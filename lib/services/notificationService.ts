import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Notification, NotificationType } from "../types";

import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";

const COLLECTION = COLLECTIONS.NOTIFICATIONS;
const notificationsRef = collection(db, COLLECTION);

/** Fetch all notifications, newest first. */
export async function getNotifications(): Promise<Notification[]> {
  const q = query(notificationsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Notification
  );
}

/** Fetch only unread notifications. */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const q = query(
    notificationsRef,
    where("read", "==", false),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Notification
  );
}

/** Create a new notification. */
export async function createNotification(data: {
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
  patientId?: string;
  clinicId?: string;
}): Promise<string> {
  const clinicId = data.clinicId;

  const docRef = await addDoc(notificationsRef, {
    ...data,
    appointmentId: data.appointmentId || "",
    patientId: data.patientId || "",
    read: false,
    clinicId: clinicId || "",
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

/** Mark a single notification as read. */
export async function markAsRead(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { read: true });
}

/**
 * Mark all unread notifications as read.
 * Uses a writeBatch to send all updates in a single network round-trip
 * instead of N separate updateDoc calls.
 */
export async function markAllAsRead(): Promise<void> {
  const unread = await getUnreadNotifications();
  if (unread.length === 0) return; // Nothing to do

  const batch = writeBatch(db);
  unread.forEach((n) => {
    batch.update(doc(db, COLLECTION, n.id), { read: true });
  });
  await batch.commit();
}
