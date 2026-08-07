import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Patient, PatientFormData, PaginatedResult, PatientMedicalProfile, PatientEncounter, SurfaceType, ToothTreatmentEntry } from "../types";
import { COLLECTIONS } from "./firestoreConfig";

const COLLECTION = COLLECTIONS.PATIENTS;
const patientsRef = collection(db, COLLECTION);

export const PAGE_SIZE = 20;

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-indigo-500",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/** Fetch all patients, ordered by creation date (newest first). */
export async function getPatients(): Promise<Patient[]> {
  const q = query(patientsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);
}

/**
 * Fetch a paginated chunk of patients ordered by creation date (newest first).
 */
export async function getPatientsPaginated(
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  limitCount: number = PAGE_SIZE
): Promise<PaginatedResult<Patient>> {
  let q = query(patientsRef, orderBy("createdAt", "desc"), limit(limitCount + 1));
  if (startAfterDoc) {
    q = query(
      patientsRef,
      orderBy("createdAt", "desc"),
      startAfter(startAfterDoc),
      limit(limitCount + 1)
    );
  }
  const snapshot = await getDocs(q);
  const hasNext = snapshot.docs.length > limitCount;
  const docs = hasNext ? snapshot.docs.slice(0, limitCount) : snapshot.docs;

  const data = docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);
  const lastVisible = docs.length > 0 ? docs[docs.length - 1] as QueryDocumentSnapshot<DocumentData> : null;

  return {
    data,
    lastVisible,
    hasNext,
  };
}

/** Fetch a single patient by document ID. */
export async function getPatientById(id: string): Promise<Patient | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Patient;
}

/**
 * Fetch a single patient by phone number.
 * Uses a targeted where + limit(1) query instead of a full collection scan.
 */
export async function getPatientByPhone(phone: string): Promise<Patient | null> {
  const q = query(patientsRef, where("phone", "==", phone), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Patient;
}

/** Create a new patient. Returns the generated document ID. */
export async function addPatient(data: PatientFormData): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(patientsRef, {
    ...data,
    avatarColor: randomAvatarColor(),
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update an existing patient's fields. */
export async function updatePatient(
  id: string,
  data: Partial<PatientFormData>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/** Delete a patient document. */
export async function deletePatient(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Get the total count of patients in the database. */
export async function getPatientsCount(): Promise<number> {
  const snapshot = await getCountFromServer(patientsRef);
  return snapshot.data().count;
}

/** Get patient medical profile from patientMedicalProfiles collection. */
export async function getPatientMedicalProfile(patientId: string): Promise<PatientMedicalProfile | null> {
  const docRef = doc(db, COLLECTIONS.PATIENT_MEDICAL_PROFILES, patientId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as PatientMedicalProfile;
}

/** Create or update patient medical profile document. */
export async function savePatientMedicalProfile(
  patientId: string,
  profileData: Partial<PatientMedicalProfile>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PATIENT_MEDICAL_PROFILES, patientId);
  const now = Timestamp.now();
  await setDoc(
    docRef,
    {
      ...profileData,
      patientId,
      updatedAt: now,
    },
    { merge: true }
  );
}

/** Fetch patient encounters timeline ordered by visitDate descending. */
export async function getPatientEncounters(patientId: string): Promise<PatientEncounter[]> {
  const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
  const q = query(
    encountersRef,
    where("patientId", "==", patientId)
  );
  console.log(`[getPatientEncounters] Fetching encounters for patient: ${patientId}`);
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PatientEncounter);
  // Sort client-side by visitDate descending
  data.sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  console.log(`[getPatientEncounters] Fetched ${data.length} encounters. Details:`, data.map(e => ({
    id: e.id,
    visitDate: e.visitDate,
    treatments: e.treatments,
    toothTreatmentsCount: e.toothTreatments?.length || 0,
    toothTreatments: e.toothTreatments
  })));
  return data;
}

/** Add a new patient encounter document. */
export async function addPatientEncounter(
  encounter: Omit<PatientEncounter, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
  const now = Timestamp.now();
  const docRef = await addDoc(encountersRef, {
    ...encounter,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update an existing patient encounter document. */
export async function updatePatientEncounter(
  encounterId: string,
  data: Partial<PatientEncounter>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PATIENT_ENCOUNTERS, encounterId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/** Delete a patient encounter document. */
export async function deletePatientEncounter(encounterId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PATIENT_ENCOUNTERS, encounterId);
  await deleteDoc(docRef);
}

/**
 * Fetch encounters that have a followUpDate within the next 7 days,
 * plus any overdue follow-ups from the past 30 days.
 *
 * Uses a bounded Firestore range query — only documents with a non-empty
 * followUpDate in [overdueStart … weekEnd] are fetched, so this is a
 * lightweight, collection-efficient query.
 *
 * Composite index required: patientEncounters(followUpDate ASC).
 * Firestore will prompt to create it if missing on first run.
 */
export async function getFollowUpsDueThisWeek(): Promise<PatientEncounter[]> {
  const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);

  // Build date range strings (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueStart = new Date(today);
  overdueStart.setDate(today.getDate() - 30); // include up to 30 days overdue

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const q = query(
    encountersRef,
    where("followUpDate", ">=", fmt(overdueStart)),
    where("followUpDate", "<=", fmt(weekEnd)),
    orderBy("followUpDate", "asc"),
    limit(50) // safety cap — a clinic won't realistically have >50 follow-ups in a 37-day window
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PatientEncounter);
}


/** Logs a tooth-specific treatment by checking for today's encounter, creating or updating it automatically. */
export async function logToothTreatment(
  patientId: string,
  toothNumber: number,
  treatmentData: {
    treatmentName: string;
    status: string;
    fee: number;
    notes?: string;
    surfaces?: SurfaceType[];
  },
  doctorId: string,
  doctorName: string
): Promise<string> {
  const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
  
  // 1. Get today's local date (YYYY-MM-DD)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  
  // 2. Format display date (DD/MM/YYYY)
  const displayDateStr = `${day}/${month}/${year}`;

  console.log(`[logToothTreatment] Starting log process for patient: ${patientId}, tooth: ${toothNumber}, treatment: ${treatmentData.treatmentName}, date: ${todayStr}`);

  // 3. Query for today's encounter
  const q = query(
    encountersRef,
    where("patientId", "==", patientId),
    where("visitDate", "==", todayStr),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  const treatmentEntryId = `tt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const nowTimestamp = Timestamp.now();

  const newToothTreatment: ToothTreatmentEntry = {
    id: treatmentEntryId,
    toothNumber,
    surfaces: treatmentData.surfaces && treatmentData.surfaces.length > 0 ? treatmentData.surfaces : undefined,
    treatmentName: treatmentData.treatmentName,
    status: treatmentData.status,
    treatmentStatus: (treatmentData.status as any) || "Completed",
    billingStatus: "Unbilled" as const,
    invoiceId: null,
    fee: treatmentData.fee,
    notes: treatmentData.notes || "",
    date: displayDateStr,
    timestamp: now.toISOString(),
  };

  if (!querySnapshot.empty) {
    // Encounter exists -> update it
    const docSnap = querySnapshot.docs[0];
    const encounterId = docSnap.id;
    const encounterData = docSnap.data();

    console.log(`[logToothTreatment] Today's encounter found. Updating encounter ID: ${encounterId}`);

    const existingToothTreatments = encounterData.toothTreatments || [];
    const updatedToothTreatments = [...existingToothTreatments, newToothTreatment];

    const existingTreatments = encounterData.treatments || [];
    const updatedTreatments = existingTreatments.includes(treatmentData.treatmentName)
      ? existingTreatments
      : [...existingTreatments, treatmentData.treatmentName];

    await updateDoc(doc(db, COLLECTIONS.PATIENT_ENCOUNTERS, encounterId), {
      toothTreatments: updatedToothTreatments,
      treatments: updatedTreatments,
      updatedAt: nowTimestamp,
      status: treatmentData.status === "Planned" ? encounterData.status : "Completed",
    });

    console.log(`[logToothTreatment] Successfully updated encounter document.`);
    return encounterId;
  } else {
    // Encounter does not exist -> create it
    console.log(`[logToothTreatment] Today's encounter not found. Creating a new encounter doc.`);
    
    const newEncounter = {
      patientId,
      doctorId,
      doctorName,
      visitDate: todayStr,
      chiefComplaint: "Dental Treatment Session",
      diagnosis: "Logged via Dental Chart",
      treatments: [treatmentData.treatmentName],
      toothTreatments: [newToothTreatment],
      prescriptionId: "",
      followUpDate: "",
      status: treatmentData.status === "Planned" ? "Pending" : "Completed",
      notes: "Logged via Dental Chart",
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    };

    const docRef = await addDoc(encountersRef, newEncounter);
    console.log(`[logToothTreatment] Successfully created new encounter document with ID: ${docRef.id}`);
    return docRef.id;
  }
}

/* ─────────────────────────────────────────────────────────
   REFERRAL TRACKING FUNCTIONS
   ───────────────────────────────────────────────────────── */

/**
 * Fetch all patients that were referred by a specific patient.
 * Uses a targeted where query — does NOT scan the full collection.
 * Returns patients ordered by creation date (newest first).
 */
export async function getPatientsByReferrer(referrerId: string): Promise<Patient[]> {
  const q = query(
    patientsRef,
    where("referredByPatientId", "==", referrerId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);
}

/**
 * Fetch all patients that have a referralSource recorded.
 * Used to build the analytics dashboard.
 * Bounded to only documents with the field set (sparse query via index).
 */
export async function getPatientsWithReferralSource(): Promise<Patient[]> {
  const q = query(
    patientsRef,
    where("referralSource", "!=", ""),
    orderBy("referralSource", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);
}

/**
 * Compute referral analytics in one pass over patients that have
 * a referredByPatientId set. Returns:
 * - leaderboard: top referrers with their referral counts
 * - sourceDistribution: count per referral source
 * - totalReferrals: total number of referred patients
 * - thisMonthReferrals: referred patients added this calendar month
 *
 * This function fetches only patients that have referredByPatientId set
 * (sparse index query) and patients with referralSource set for distribution.
 * These are typically a small subset of the full collection.
 */
export interface ReferralLeaderboardEntry {
  referrerId: string;
  referrerName: string;
  referrerPhone: string;
  referrerAvatarColor: string;
  count: number;
}

export interface ReferralStats {
  totalReferrals: number;
  thisMonthReferrals: number;
  leaderboard: ReferralLeaderboardEntry[];
  sourceDistribution: { source: string; count: number }[];
  topReferrer: ReferralLeaderboardEntry | null;
  topSource: string | null;
}

export async function getReferralStats(): Promise<ReferralStats> {
  // 1. Fetch patients referred by someone (has referredByPatientId)
  const referredQ = query(
    patientsRef,
    where("referredByPatientId", "!=", ""),
  );
  const referredSnap = await getDocs(referredQ);
  const referredPatients = referredSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);

  // 2. Fetch patients with any referralSource (for source distribution)
  const sourceQ = query(
    patientsRef,
    where("referralSource", "!=", ""),
  );
  const sourceSnap = await getDocs(sourceQ);
  const sourcedPatients = sourceSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);

  // 3. This-month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartTs = Timestamp.fromDate(monthStart);

  const thisMonthReferrals = referredPatients.filter(
    (p) => p.createdAt && p.createdAt.seconds >= monthStartTs.seconds
  ).length;

  // 4. Build referrer count map
  const referrerMap = new Map<string, { count: number }>();
  referredPatients.forEach((p) => {
    if (!p.referredByPatientId) return;
    const existing = referrerMap.get(p.referredByPatientId) ?? { count: 0 };
    referrerMap.set(p.referredByPatientId, { count: existing.count + 1 });
  });

  // 5. Resolve referrer names by fetching their patient docs (batch via getPatientById)
  const leaderboardRaw: ReferralLeaderboardEntry[] = [];
  const referrerIds = Array.from(referrerMap.keys());

  await Promise.all(
    referrerIds.map(async (id) => {
      const patient = await getPatientById(id);
      if (!patient) return;
      leaderboardRaw.push({
        referrerId: id,
        referrerName: patient.name,
        referrerPhone: patient.phone,
        referrerAvatarColor: patient.avatarColor,
        count: referrerMap.get(id)!.count,
      });
    })
  );

  const leaderboard = leaderboardRaw.sort((a, b) => b.count - a.count);

  // 6. Source distribution
  const sourceMap = new Map<string, number>();
  sourcedPatients.forEach((p) => {
    if (!p.referralSource) return;
    sourceMap.set(p.referralSource, (sourceMap.get(p.referralSource) ?? 0) + 1);
  });

  const sourceDistribution = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalReferrals: referredPatients.length,
    thisMonthReferrals,
    leaderboard,
    sourceDistribution,
    topReferrer: leaderboard[0] ?? null,
    topSource: sourceDistribution[0]?.source ?? null,
  };
}

/** Fetch recent patient encounters across the clinic for analytics & reports */
export async function getAllEncounters(limitCount: number = 200): Promise<PatientEncounter[]> {
  const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
  const q = query(encountersRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PatientEncounter);
}
