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
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Doctor } from "../types";
import { COLLECTIONS } from "./firestoreConfig";
import { getActiveDoctors as getActiveTeamDoctors, getTeamMembersByRole } from "./teamService";

const COLLECTION = COLLECTIONS.DOCTORS;
const doctorsRef = collection(db, COLLECTION);

/**
 * Standard 2 Active Doctors adhering to the Basic Plan (2 Doctors Max)
 */
export const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: "tm-1",
    fullName: "Dr. Rajesh Sharma",
    specialization: "Oral & Maxillofacial Surgery",
    qualification: "BDS, MDS (Oral & Maxillofacial Surgery)",
    registrationNumber: "MH-D-18492",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@sanjivanidentals.com",
    active: true,
    clinicId: "clinic-1",
  },
  {
    id: "tm-2",
    fullName: "Dr. Ananya Verma",
    specialization: "Conservative Dentistry & Endodontics",
    qualification: "BDS, MDS (Endodontics)",
    registrationNumber: "MH-D-22104",
    phone: "+91 98123 88765",
    email: "ananya.verma@sanjivanidentals.com",
    active: true,
    clinicId: "clinic-1",
  },
];

/**
 * Fetch all active doctors configured under Settings > Team Members.
 * Single source of truth across the whole application.
 */
export async function getDoctors(): Promise<Doctor[]> {
  try {
    const teamDoctors = await getActiveTeamDoctors();
    if (teamDoctors && teamDoctors.length > 0) {
      return teamDoctors.map((m) => {
        const rawName = m.name.trim();
        const formattedName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
        const specialty =
          (m as any).qualification ||
          (m as any).specialty ||
          (m as any).specialization ||
          "Dental Surgeon";

        return {
          id: m.id,
          fullName: formattedName,
          specialization: specialty,
          qualification: (m as any).qualification || specialty,
          registrationNumber: (m as any).registrationNumber || "",
          phone: m.phone || "",
          email: m.email || "",
          active: m.status === "Active" || !m.status,
          clinicId: m.clinicId || "clinic-1",
        };
      });
    }
  } catch (err) {
    console.warn("Error fetching team doctors, using fallback:", err);
  }
  return DEFAULT_DOCTORS;
}

/** Alias for getDoctors() ensuring active doctors list from Team Members. */
export async function getActiveDoctors(): Promise<Doctor[]> {
  return getDoctors();
}

/** Fetch a single doctor by document ID (checking Team Members first). */
export async function getDoctorById(id: string): Promise<Doctor | null> {
  try {
    const doctors = await getDoctors();
    const found = doctors.find((d) => d.id === id);
    if (found) return found;

    const snap = await getDoc(doc(db, COLLECTION, id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Doctor;
    }
  } catch (err) {
    console.warn("Firestore getDoc error for doctor:", err);
  }
  const fallback = DEFAULT_DOCTORS.find((d) => d.id === id);
  return fallback || null;
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
    updatedAt: now,
  });
  return docRef.id;
}

/** Update an existing doctor profile. */
export async function updateDoctor(
  id: string,
  data: Partial<Omit<Doctor, "id" | "createdAt">>
): Promise<void> {
  const doctorDoc = doc(db, COLLECTION, id);
  await updateDoc(doctorDoc, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/** Delete a doctor profile. */
export async function deleteDoctor(id: string): Promise<void> {
  const doctorDoc = doc(db, COLLECTION, id);
  await deleteDoc(doctorDoc);
}
