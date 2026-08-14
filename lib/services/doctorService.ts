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
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Doctor } from "../types";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";

const COLLECTION = COLLECTIONS.DOCTORS;
const doctorsRef = collection(db, COLLECTION);

/** Fetch all doctors, ordered by creation date. */
export async function getDoctors(): Promise<Doctor[]> {
  const q = query(doctorsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Doctor);
}

/** Fetch a single doctor by document ID. */
export async function getDoctorById(id: string): Promise<Doctor | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Doctor;
}

/** Create a new doctor profile. Returns the generated document ID. */
export async function addDoctor(
  data: Omit<Doctor, "id" | "createdAt">
): Promise<string> {
  const clinicId = data.clinicId;

  const now = Timestamp.now();
  const docRef = await addDoc(doctorsRef, {
    ...data,
    clinicId: clinicId || "",
    createdAt: now,
  });
  return docRef.id;
}

/** Update an existing doctor's fields. */
export async function updateDoctor(
  id: string,
  data: Partial<Omit<Doctor, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
  });
}

/** Delete a doctor profile. */
export async function deleteDoctor(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
