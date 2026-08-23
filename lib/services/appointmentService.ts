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
import { COLLECTIONS, getCollectionRef, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import { getAppointmentSettings, getClinicResources } from "./settingsService";
import {
  createAppointmentAction,
  updateAppointmentStatusAction,
  updateAppointmentAction,
  deleteAppointmentAction,
} from "../../server/actions/appointmentActions";

/** Extended creation payload including calendar-specific fields. */
export type AppointmentAdminPayload = AppointmentFormData &
  Partial<Pick<Appointment, "status" | "chair" | "chairId" | "duration" | "patientId" | "doctorId" | "doctorName">>;

/** Helper: Parse time string (e.g. "09:30 AM") into minutes from midnight */
export function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const clean = t.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3];
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

/** Helper: Check if two appointment time slots overlap */
export function doAppointmentsOverlap(
  apt1: { time: string; duration?: number },
  apt2: { time: string; duration?: number }
): boolean {
  const start1 = parseTimeToMinutes(apt1.time);
  const end1 = start1 + (apt1.duration || 30);
  const start2 = parseTimeToMinutes(apt2.time);
  const end2 = start2 + (apt2.duration || 30);
  return start1 < end2 && start2 < end1;
}

/**
 * Validate chair eligibility and check for scheduling conflicts on the same chair.
 * Throws Error with user-friendly message if validation fails.
 */
export async function validateAndCheckChairConflict(
  date: string,
  time: string,
  duration: number,
  chairId?: string,
  chairName?: string,
  excludeAppointmentId?: string
): Promise<{ resolvedChairId?: string; resolvedChairName?: string }> {
  if (!chairId && !chairName) {
    return {};
  }

  const resources = await getClinicResources();
  const allChairs = resources.chairs || [];

  // Find chair in configured chairs
  let matchedChair = allChairs.find((c) => c.id === chairId);
  if (!matchedChair && chairName) {
    matchedChair = allChairs.find((c) => c.name.toLowerCase() === chairName.trim().toLowerCase());
  }

  // 1. Check chair exists in clinic
  if (!matchedChair && chairId) {
    throw new Error("Selected chair is no longer available.");
  }

  // 2. Check chair is active for new booking
  if (matchedChair && !matchedChair.active) {
    throw new Error("Selected chair is inactive for new appointments.");
  }

  const effectiveChairId = matchedChair?.id || chairId;
  const effectiveChairName = matchedChair?.name || chairName;

  // 3. Check conflict rules
  const apptSettings = await getAppointmentSettings();
  if (!apptSettings.allowChairOverbooking && effectiveChairId) {
    // Fetch all non-cancelled appointments for this date
    const dayAppointments = await getAppointmentsByDate(date);
    const conflict = dayAppointments.find((apt) => {
      if (apt.id === excludeAppointmentId) return false;
      if (apt.status === "Cancelled") return false;

      const sameChair =
        apt.chairId === effectiveChairId ||
        (apt.chair && matchedChair && apt.chair.toLowerCase() === matchedChair.name.toLowerCase());
      if (!sameChair) return false;

      return doAppointmentsOverlap({ time, duration }, { time: apt.time, duration: apt.duration });
    });

    if (conflict) {
      throw new Error(`Selected chair (${effectiveChairName}) is already booked for this time slot.`);
    }
  }

  return { resolvedChairId: effectiveChairId, resolvedChairName: effectiveChairName };
}

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
 * Respects autoConfirmWebBookings and defaultSlotDurationMinutes settings.
 */
export async function createAppointment(
  data: AppointmentFormData & { chairId?: string; chair?: string }
): Promise<string> {
  const settings = await getAppointmentSettings();
  const initialStatus = settings.autoConfirmWebBookings ? "Confirmed" : "Pending";
  const slotDuration = settings.defaultSlotDurationMinutes || 30;
  const now = Timestamp.now();

  const { resolvedChairId, resolvedChairName } = await validateAndCheckChairConflict(
    data.date,
    data.time,
    slotDuration,
    data.chairId,
    data.chair
  );

  const clinicId = (data as any).clinicId;

  const res = await createAppointmentAction({
    ...data,
    patientId: "",
    status: initialStatus as AppointmentStatus,
    duration: slotDuration,
    source: "online_booking",
    clinicId: clinicId || "",
    ...(resolvedChairId ? { chairId: resolvedChairId } : {}),
    ...(resolvedChairName ? { chair: resolvedChairName } : {}),
  });

  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to create appointment on server.");
  }
  return res.data.id;
}

/**
 * Create an appointment from the admin panel.
 * Respects defaultSlotDurationMinutes if duration is not explicitly specified.
 */
export async function createAppointmentByAdmin(
  data: AppointmentAdminPayload
): Promise<string> {
  const settings = await getAppointmentSettings();
  const now = Timestamp.now();
  const { status, chair, chairId, duration, patientId, doctorId, doctorName, ...rest } = data;
  const effectiveDuration = duration || settings.defaultSlotDurationMinutes || 30;

  const { resolvedChairId, resolvedChairName } = await validateAndCheckChairConflict(
    rest.date,
    rest.time,
    effectiveDuration,
    chairId,
    chair
  );

  const adminClinicId = (data as any).clinicId;

  const res = await createAppointmentAction({
    ...rest,
    patientId: patientId || "",
    status: status || ("Confirmed" as AppointmentStatus),
    source: "admin_created",
    duration: effectiveDuration,
    clinicId: adminClinicId || "",
    ...(resolvedChairId ? { chairId: resolvedChairId } : {}),
    ...(resolvedChairName ? { chair: resolvedChairName } : {}),
    ...(doctorId ? { doctorId } : {}),
    ...(doctorName ? { doctorName } : {}),
  });

  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to create appointment on server.");
  }
  return res.data.id;
}

/** Update the status of an appointment. */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const res = await updateAppointmentStatusAction(id, status);
  if (!res.success) {
    throw new Error(res.error || "Failed to update appointment status on server.");
  }
}

/** Update any appointment fields. */
export async function updateAppointment(
  id: string,
  data: Partial<Appointment>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = data;

  if (rest.date || rest.time || rest.chairId || rest.chair) {
    const existing = await getAppointmentById(id);
    if (existing) {
      const targetDate = rest.date || existing.date;
      const targetTime = rest.time || existing.time;
      const targetDuration = rest.duration || existing.duration || 30;
      const targetChairId = rest.chairId !== undefined ? rest.chairId : existing.chairId;
      const targetChair = rest.chair !== undefined ? rest.chair : existing.chair;

      const { resolvedChairId, resolvedChairName } = await validateAndCheckChairConflict(
        targetDate,
        targetTime,
        targetDuration,
        targetChairId,
        targetChair,
        id
      );

      if (resolvedChairId !== undefined) rest.chairId = resolvedChairId;
      if (resolvedChairName !== undefined) rest.chair = resolvedChairName;
    }
  }

  const res = await updateAppointmentAction(id, rest);
  if (!res.success) {
    throw new Error(res.error || "Failed to update appointment on server.");
  }
}

/** Delete an appointment. */
export async function deleteAppointment(id: string): Promise<void> {
  const res = await deleteAppointmentAction(id);
  if (!res.success) {
    throw new Error(res.error || "Failed to delete appointment on server.");
  }
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

/**
 * Fetch appointments for a specific date string (YYYY-MM-DD).
 * Ordered by time ascending for the Day calendar view.
 */
export async function getAppointmentsByDate(
  date: string
): Promise<Appointment[]> {
  const q = query(
    appointmentsRef,
    where("date", "==", date),
    orderBy("time", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
}

/**
 * Fetch appointments within a date range [startDate, endDate] inclusive.
 * Used by Week and Month calendar views.
 * Ordered by date asc, then time asc (client-side sort for time within same date).
 */
export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const q = query(
    appointmentsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  // Secondary sort by time within same date
  data.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  return data;
}

/**
 * Check in a patient — sets status to "Checked In" and records checkInTime.
 */
export async function checkInAppointment(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: "Checked In" as AppointmentStatus,
    checkInTime: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Complete an appointment — sets status to "Completed" and records completedTime.
 */
export async function completeAppointment(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: "Completed" as AppointmentStatus,
    completedTime: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}
