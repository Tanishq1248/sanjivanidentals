import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "./firestoreConfig";
import type {
  TeamMember,
  TeamMemberFormData,
  MemberStatus,
} from "../types";
import {
  canAddDoctor,
  getMaximumDoctors,
} from "./featureAccessService";
import { getClinicInfo } from "./clinicSettingsService";

export const MEMBERS_COLLECTION = COLLECTIONS.TEAM_MEMBERS || "teamMembers";

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Dr. Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@sanjivanidentals.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-teal-500",
    lastLogin: "Today, 10:45 AM",
    clinicId: "clinic-1",
  },
  {
    id: "tm-2",
    name: "Dr. Ananya Verma",
    phone: "+91 98123 88765",
    email: "ananya.verma@sanjivanidentals.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-indigo-500",
    lastLogin: "Today, 09:15 AM",
    clinicId: "clinic-1",
  },
  {
    id: "tm-3",
    name: "Sunita Patil",
    phone: "+91 99887 66554",
    email: "sunita.p@sanjivanidentals.com",
    role: "Receptionist",
    roleId: "role-receptionist",
    status: "Active",
    avatarColor: "bg-amber-500",
    lastLogin: "Today, 08:30 AM",
    clinicId: "clinic-1",
  },
];

// In-memory cache fallback to ensure instant UI response if Firestore latency occurs
let memoryMembersCache: TeamMember[] = [...INITIAL_MEMBERS];

/**
 * Validate team member form data before saving.
 */
export function validateTeamMember(data: Partial<TeamMemberFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Full Name is required";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (!data.role || !data.role.trim()) {
    errors.role = "Role assignment is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Fetch team members with optional role and status filtering.
 */
export async function getTeamMembers(
  roleFilter?: string,
  statusFilter?: string
): Promise<TeamMember[]> {
  try {
    const snap = await getDocs(collection(db, MEMBERS_COLLECTION));
    if (snap.empty) {
      // Auto-seed working team setup (2 Doctors + 1 Receptionist) into Firestore
      const seeded: TeamMember[] = [];
      for (const member of INITIAL_MEMBERS) {
        const memberClinicId = member.clinicId;
        const docRef = doc(db, MEMBERS_COLLECTION, member.id);
        await setDoc(
          docRef,
          { ...member, clinicId: memberClinicId || "", createdAt: Timestamp.now() },
          { merge: true }
        );
        seeded.push(member);
      }
      memoryMembersCache = seeded;
    } else {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMember);
      memoryMembersCache = list;
    }
  } catch (error) {
    console.warn("Firestore fetch error for team members, using cache fallback:", error);
  }

  let result = memoryMembersCache;
  if (roleFilter && roleFilter !== "All") {
    result = result.filter(
      (m) =>
        m.role?.toLowerCase() === roleFilter.toLowerCase() ||
        m.roleId === roleFilter ||
        m.roleId === `role-${roleFilter.toLowerCase()}`
    );
  }
  if (statusFilter && statusFilter !== "All") {
    result = result.filter(
      (m) => m.status?.toLowerCase() === statusFilter.toLowerCase()
    );
  }

  return result;
}

/**
 * Fetch team members by role (e.g. 'Doctor', 'Receptionist', 'Admin').
 */
export async function getTeamMembersByRole(role: string): Promise<TeamMember[]> {
  return getTeamMembers(role);
}

/**
 * Fetch active doctors in the clinic directly from team members collection.
 * Single source of truth adhering to Basic Plan limits (Max 2 Doctors).
 */
export async function getActiveDoctors(): Promise<TeamMember[]> {
  const members = await getTeamMembers();
  return members.filter(
    (m) =>
      (m.role?.toLowerCase() === "doctor" || m.roleId === "role-doctor") &&
      (m.status === "Active" || !m.status)
  );
}

/**
 * Add a new team member to Firestore teamMembers collection.
 */
export async function addTeamMember(
  formData: TeamMemberFormData
): Promise<TeamMember> {
  const clinicId = (formData as any).clinicId;

  // Backend validation: Check Doctor quota for current subscription plan
  const isDoctorRole =
    formData.role?.toLowerCase() === "doctor" || formData.roleId === "role-doctor";
  if (isDoctorRole) {
    const members = await getTeamMembers();
    const doctorCount = members.filter(
      (m) => m.role?.toLowerCase() === "doctor" || m.roleId === "role-doctor"
    ).length;
    const clinicInfo = await getClinicInfo();

    if (!canAddDoctor(doctorCount, clinicInfo)) {
      const maxDocs = getMaximumDoctors(clinicInfo);
      throw new Error(
        `You have reached the maximum number of doctors allowed in the Basic Plan (${maxDocs} Doctors). Upgrade to Professional for up to 4 doctors.`
      );
    }
  }

  const avatarColors = [
    "bg-teal-500",
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
  ];
  const randomColor =
    avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const newMember: TeamMember = {
    id: `tm-${Date.now()}`,
    ...formData,
    avatarColor: randomColor,
    lastLogin: formData.status === "Invited" ? "Invitation Sent" : "Never",
  };

  try {
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
      ...formData,
      avatarColor: randomColor,
      lastLogin: newMember.lastLogin,
      clinicId: clinicId || "",
      createdAt: Timestamp.now(),
    });
    newMember.id = docRef.id;
  } catch (error) {
    console.warn("Firestore write error for team member, using in-memory update:", error);
  }

  memoryMembersCache = [newMember, ...memoryMembersCache];
  return newMember;
}

/**
 * Update an existing team member in Firestore teamMembers collection.
 */
export async function updateTeamMember(
  id: string,
  updates: Partial<TeamMember>
): Promise<void> {
  try {
    await updateDoc(doc(db, MEMBERS_COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore update error for team member:", error);
  }

  memoryMembersCache = memoryMembersCache.map((m) =>
    m.id === id ? { ...m, ...updates } : m
  );
}

/**
 * Toggle active/inactive status of a team member.
 */
export async function toggleTeamMemberStatus(
  id: string,
  status: MemberStatus
): Promise<void> {
  await updateTeamMember(id, { status });
}

/**
 * Delete a team member from Firestore teamMembers collection.
 */
export async function deleteTeamMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
  } catch (error) {
    console.warn("Firestore delete error for team member:", error);
  }

  memoryMembersCache = memoryMembersCache.filter((m) => m.id !== id);
}

/**
 * Reset member password simulation.
 */
export async function resetMemberPassword(id: string): Promise<void> {
  await new Promise((res) => setTimeout(res, 300));
}
