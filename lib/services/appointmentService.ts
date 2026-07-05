import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
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
import type {
  Appointment,
  AppointmentFormData,
  AppointmentStatus,
  AppointmentFilter,
  PaginatedResult,
} from "../types";
import { COLLECTIONS, getCollectionRef } from "./firestoreConfig";

const COLLECTION = COLLECTIONS.APPOINTMENTS;
const ARCHIVED_COLLECTION = COLLECTIONS.ARCHIVED_APPOINTMENTS;

// Dynamic helper to fetch appointments collection reference (ready to support archive querying)
function getAppointmentsRef(queryArchived = false) {
  return getCollectionRef(db, COLLECTION, ARCHIVED_COLLECTION, queryArchived);
}

// Fallback to active collection reference by default
const appointmentsRef = getAppointmentsRef(false);

export const PAGE_SIZE = 20;

/**
 * Get today's date as YYYY-MM-DD string in local timezone.
 */
function todayStr(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/**
 * Fetch appointments with an optional filter.
 *   - today    → date === today
 *   - upcoming → date > today
 *   - history  → date < today
 *   - all      → no filter
 */
export async function getAppointments(
  filter: AppointmentFilter = "all",
  queryArchived = false
): Promise<Appointment[]> {
  const today = todayStr();
  const targetRef = getAppointmentsRef(queryArchived);
  let q;

  switch (filter) {
    case "today":
      q = query(
        targetRef,
        where("date", "==", today),
        orderBy("time", "asc")
      );
      break;
    case "upcoming":
      q = query(
        targetRef,
        where("date", ">", today),
        orderBy("date", "asc")
      );
      break;
    case "history":
      q = query(
        targetRef,
        where("date", "<", today),
        orderBy("date", "desc")
      );
      break;
    default:
      q = query(targetRef, orderBy("date", "desc"));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
}

/**
 * Fetch a paginated chunk of appointments with an optional filter.
 * Uses Firestore cursors for efficient pagination.
 */
export async function getAppointmentsPaginated(
  filter: AppointmentFilter = "all",
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  limitCount: number = PAGE_SIZE,
  queryArchived = false
): Promise<PaginatedResult<Appointment>> {
  const today = todayStr();
  const targetRef = getAppointmentsRef(queryArchived);
  let queryConstraints: any[] = [];

  switch (filter) {
    case "today":
      queryConstraints = [
        where("date", "==", today),
        orderBy("time", "asc")
      ];
      break;
    case "upcoming":
      queryConstraints = [
        where("date", ">", today),
        orderBy("date", "asc")
      ];
      break;
    case "history":
      queryConstraints = [
        where("date", "<", today),
        orderBy("date", "desc")
      ];
      break;
    default:
      queryConstraints = [orderBy("date", "desc")];
  }

  // Construct query with pagination limits
  let q = query(
    targetRef,
    ...queryConstraints,
    limit(limitCount + 1)
  );

  if (startAfterDoc) {
    q = query(
      targetRef,
      ...queryConstraints,
      startAfter(startAfterDoc),
      limit(limitCount + 1)
    );
  }

  const snapshot = await getDocs(q);
  const hasNext = snapshot.docs.length > limitCount;
  const docs = hasNext ? snapshot.docs.slice(0, limitCount) : snapshot.docs;

  const data = docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  const lastVisible = docs.length > 0 ? docs[docs.length - 1] as QueryDocumentSnapshot<DocumentData> : null;

  return {
    data,
    lastVisible,
    hasNext,
  };
}

/** Fetch a single appointment by ID. */
export async function getAppointmentById(
  id: string
): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Appointment;
}

/**
 * Fetch appointments for a specific patient by phone number.
 * Uses a targeted compound query — requires a composite index on (patientPhone ASC, date DESC).
 * @param phone - Patient's phone number
 * @param maxResults - Max documents to fetch (default 10)
 */
export async function getAppointmentsByPhone(
  phone: string,
  maxResults = 10
): Promise<Appointment[]> {
  const q = query(
    appointmentsRef,
    where("patientPhone", "==", phone)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  // Sort client-side by date descending
  data.sort((a, b) => b.date.localeCompare(a.date));
  return data.slice(0, maxResults);
}

/**
 * Create a new appointment from the booking form.
 * Status defaults to "Pending", source to "online_booking".
 */
export async function createAppointment(
  data: AppointmentFormData
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(appointmentsRef, {
    ...data,
    patientId: "",
    status: "Pending" as AppointmentStatus,
    source: "online_booking",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/**
 * Create an appointment from the admin panel.
 * Status defaults to "Confirmed", source to "admin_created".
 */
export async function createAppointmentByAdmin(
  data: AppointmentFormData & { status?: AppointmentStatus }
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(appointmentsRef, {
    ...data,
    patientId: "",
    status: data.status || ("Confirmed" as AppointmentStatus),
    source: "admin_created",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update the status of an appointment. */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { status, updatedAt: Timestamp.now() });
}

/** Update any appointment fields. */
export async function updateAppointment(
  id: string,
  data: Partial<Appointment>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = data;
  await updateDoc(ref, { ...rest, updatedAt: Timestamp.now() });
}

/** Delete an appointment. */
export async function deleteAppointment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Get the count of appointments matching a filter from the server. */
export async function getAppointmentsCount(
  filter: string = "all",
  queryArchived = false
): Promise<number> {
  const today = todayStr();
  const targetRef = getAppointmentsRef(queryArchived);
  let q;

  switch (filter) {
    case "today":
      q = query(targetRef, where("date", "==", today));
      break;
    case "today-pending":
      q = query(targetRef, where("date", "==", today), where("status", "==", "Pending"));
      break;
    case "upcoming":
      q = query(targetRef, where("date", ">", today));
      break;
    case "history":
      q = query(targetRef, where("date", "<", today));
      break;
    default:
      q = targetRef;
  }

  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}
