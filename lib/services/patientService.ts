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
  startAt,
  endAt,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Patient, PatientFormData, PaginatedResult, PatientMedicalProfile, PatientEncounter, SurfaceType, ToothTreatmentEntry } from "../types";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import {
  createPatientAction,
  updatePatientAction,
  deletePatientAction,
  getPatientByIdAction,
  getPatientsAction,
  getPaginatedPatientsServerAction,
  getPatientsCountServerAction,
  savePatientMedicalProfileAction,
  getPatientMedicalProfileAction,
  addPatientEncounterAction,
  updatePatientEncounterAction,
  deletePatientEncounterAction,
  getPatientEncountersAction,
  logToothTreatmentAction,
} from "../../server/actions/patientActions";

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
  try {
    const res = await getPatientsAction();
    if (res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("[patientService] Error fetching patients via server action:", err);
  }

  try {
    const q = query(patientsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient);
  } catch (err) {
    console.error("[patientService] Error fetching patients via client:", err);
    return [];
  }
}

export interface PaginatedPatientOptions {
  pageSize?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  searchTerm?: string;
}

/**
 * Fetch a paginated chunk of patients ordered by creation date or filtered by search terms.
 * Routes directly to Server Action for guaranteed administrative access.
 */
export async function getPaginatedPatients({
  pageSize = PAGE_SIZE,
  startAfterDoc = null,
  searchTerm = "",
}: PaginatedPatientOptions = {}): Promise<PaginatedResult<Patient>> {
  try {
    const res = await getPaginatedPatientsServerAction({
      pageSize,
      searchTerm,
    });
    if (res.success && res.data) {
      return {
        data: res.data.data,
        lastVisible: null,
        hasNext: res.data.hasNext,
      };
    }
  } catch (serverErr) {
    console.warn("[patientService] Server action fetch error, trying client query:", serverErr);
  }

  const cleanSearch = searchTerm.trim();
  let q = query(patientsRef, orderBy("createdAt", "desc"), limit(pageSize + 1));
  try {
    const snapshot = await getDocs(q);
    const hasNext = snapshot.docs.length > pageSize;
    const docs = hasNext ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    return {
      data: docs.map((d) => ({ id: d.id, ...d.data() }) as Patient),
      lastVisible: null,
      hasNext,
    };
  } catch (clientErr) {
    console.error("[patientService] Error fetching patients:", clientErr);
    return { data: [], lastVisible: null, hasNext: false };
  }
}

/**
 * Backward compatibility alias for getPaginatedPatients.
 */
export async function getPatientsPaginated(
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  limitCount: number = PAGE_SIZE,
  searchTerm: string = ""
): Promise<PaginatedResult<Patient>> {
  return getPaginatedPatients({
    startAfterDoc,
    pageSize: limitCount,
    searchTerm,
  });
}

/** Fetch a single patient by document ID. */
export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    const res = await getPatientByIdAction(id);
    if (res.success && res.data !== undefined) {
      return res.data;
    }
  } catch (err) {
    console.warn("[patientService] Error getting patient by ID via server:", err);
  }

  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Patient;
  } catch (err) {
    console.error("[patientService] Error getting patient by ID via client:", err);
    return null;
  }
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
  try {
    const res = await createPatientAction(data);
    if (res.success && res.data?.id) {
      return res.data.id;
    }
    console.warn("[patientService] Server action createPatient failed, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Server action createPatient threw error, trying client fallback:", err);
  }

  // Client SDK Fallback
  const nameTrimmed = (data.name || "").trim();
  const clinicId = (data as any).clinicId || DEFAULT_CLINIC_ID;
  const avatarColor = randomAvatarColor();
  const payload = {
    ...data,
    name: nameTrimmed,
    nameLowercase: nameTrimmed.toLowerCase(),
    clinicId,
    avatarColor,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(patientsRef, payload);
  return docRef.id;
}

/** Update an existing patient's fields. */
export async function updatePatient(
  id: string,
  data: Partial<PatientFormData>
): Promise<void> {
  try {
    const res = await updatePatientAction(id, data);
    if (res.success) {
      return;
    }
    console.warn("[patientService] Server action updatePatient failed, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Server action updatePatient threw error, trying client fallback:", err);
  }

  // Client SDK Fallback
  const docRef = doc(db, COLLECTION, id);
  const updates: Record<string, any> = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  if (data.name) {
    updates.name = data.name.trim();
    updates.nameLowercase = data.name.trim().toLowerCase();
  }
  await updateDoc(docRef, updates);
}

/** Delete a patient document. */
export async function deletePatient(id: string): Promise<void> {
  try {
    const res = await deletePatientAction(id);
    if (res.success) {
      return;
    }
    console.warn("[patientService] Server action deletePatient failed, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Server action deletePatient threw error, trying client fallback:", err);
  }

  // Client SDK Fallback
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

/** Get the total count of patients in the database. */
export async function getPatientsCount(): Promise<number> {
  try {
    const res = await getPatientsCountServerAction();
    if (res.success && typeof res.data === "number") {
      return res.data;
    }
  } catch (err) {
    console.warn("[patientService] Error getting patient count via server:", err);
  }

  try {
    const snapshot = await getCountFromServer(patientsRef);
    return snapshot.data().count;
  } catch (err) {
    console.warn("[patientService] Error getting patient count via client SDK:", err);
    return 0;
  }
}

/** Get patient medical profile from patientMedicalProfiles collection. */
export async function getPatientMedicalProfile(patientId: string): Promise<PatientMedicalProfile | null> {
  try {
    const res = await getPatientMedicalProfileAction(patientId);
    if (res.success && res.data !== undefined) {
      return res.data;
    }
  } catch (err) {
    console.warn("[patientService] Error getting medical profile via server:", err);
  }

  try {
    const docRef = doc(db, COLLECTIONS.PATIENT_MEDICAL_PROFILES, patientId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as PatientMedicalProfile;
  } catch (err) {
    return null;
  }
}

/** Create or update patient medical profile document. */
export async function savePatientMedicalProfile(
  patientId: string,
  profileData: Partial<PatientMedicalProfile>
): Promise<void> {
  try {
    const res = await savePatientMedicalProfileAction(patientId, profileData);
    if (res.success) {
      return;
    }
    console.warn("[patientService] Error saving medical profile via server, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Error saving medical profile via server, trying client fallback:", err);
  }

  const docRef = doc(db, COLLECTIONS.PATIENT_MEDICAL_PROFILES, patientId);
  await setDoc(
    docRef,
    {
      ...profileData,
      patientId,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/** Fetch patient encounters timeline ordered by visitDate descending. */
export async function getPatientEncounters(patientId: string): Promise<PatientEncounter[]> {
  try {
    const res = await getPatientEncountersAction(patientId);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("[patientService] Error getting encounters via server:", err);
  }

  try {
    const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
    const q = query(encountersRef, where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PatientEncounter);
    data.sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));
    return data;
  } catch (err) {
    console.error("[patientService] Error getting encounters via client:", err);
    return [];
  }
}

/** Fetch a single patient encounter by document ID. */
export async function getPatientEncounterById(encounterId: string): Promise<PatientEncounter | null> {
  const docRef = doc(db, COLLECTIONS.PATIENT_ENCOUNTERS, encounterId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PatientEncounter;
}

/** Add a new patient encounter document. */
export async function addPatientEncounter(
  encounter: Omit<PatientEncounter, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const res = await addPatientEncounterAction(encounter);
    if (res.success && res.data?.id) {
      return res.data.id;
    }
    console.warn("[patientService] Error creating patient encounter via server, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Error creating patient encounter via server, trying client fallback:", err);
  }

  const encountersRef = collection(db, COLLECTIONS.PATIENT_ENCOUNTERS);
  const docRef = await addDoc(encountersRef, {
    ...encounter,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

/** Update an existing patient encounter document. */
export async function updatePatientEncounter(
  encounterId: string,
  data: Partial<PatientEncounter>
): Promise<void> {
  try {
    const res = await updatePatientEncounterAction(encounterId, data);
    if (res.success) {
      return;
    }
    console.warn("[patientService] Error updating patient encounter via server, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Error updating patient encounter via server, trying client fallback:", err);
  }

  const docRef = doc(db, COLLECTIONS.PATIENT_ENCOUNTERS, encounterId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/** Delete a patient encounter document. */
export async function deletePatientEncounter(encounterId: string): Promise<void> {
  try {
    const res = await deletePatientEncounterAction(encounterId);
    if (res.success) {
      return;
    }
    console.warn("[patientService] Error deleting patient encounter via server, trying client fallback:", res?.error);
  } catch (err) {
    console.warn("[patientService] Error deleting patient encounter via server, trying client fallback:", err);
  }

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


/** Logs a tooth-specific treatment by checking for a target encounter or today's encounter, creating or updating it automatically via Server Action. */
export async function logToothTreatment(
  patientId: string,
  toothNumber: number,
  treatmentData: {
    treatmentName: string;
    status: string;
    fee: number;
    notes?: string;
    surfaces?: SurfaceType[];
    diagnosis?: string;
    clinicId?: string;
  },
  doctorId: string = "doc-1",
  doctorName: string = "Dr. Rajesh Sharma",
  targetEncounterId?: string
): Promise<string> {
  const res = await logToothTreatmentAction({
    patientId,
    toothNumber,
    treatmentData,
    doctorId,
    doctorName,
    targetEncounterId,
  });

  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to log tooth treatment on server.");
  }

  return res.data.encounterId;
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
