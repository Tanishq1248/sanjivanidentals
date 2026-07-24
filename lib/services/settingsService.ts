import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { TeamMember, RolePermission, ClinicSettingsData, TeamMemberFormData } from "../types";
import { COLLECTIONS } from "./firestoreConfig";

const MEMBERS_COLLECTION = COLLECTIONS.TEAM_MEMBERS;
const ROLES_COLLECTION = COLLECTIONS.ROLES;
const CLINIC_SETTINGS_COLLECTION = COLLECTIONS.CLINIC_SETTINGS;

const INITIAL_ROLES: RolePermission[] = [
  {
    id: "role-doctor",
    name: "Doctor",
    description: "Clinical access to patients, dental charts, treatments, prescriptions, and appointments.",
    memberCount: 3,
    permissionCount: 28,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard", "View Analytics"],
      Patients: ["View Patients", "Add Patient", "Edit Patient", "Export Data"],
      Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
      Treatments: ["View Treatments", "Add Dental Chart", "Edit Dental Chart", "Delete Dental Chart"],
      Billing: ["View Invoices", "Create Invoice"],
      Prescriptions: ["View Prescriptions", "Create Prescription", "Print Prescription"],
      Reports: ["View Patient Reports"],
      Inventory: ["View Stock"],
      Settings: ["View Settings"],
    },
  },
  {
    id: "role-receptionist",
    name: "Receptionist",
    description: "Front-desk access for booking appointments, managing patient check-ins, and generating invoices.",
    memberCount: 2,
    permissionCount: 16,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard"],
      Patients: ["View Patients", "Add Patient", "Edit Patient"],
      Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
      Treatments: ["View Treatments"],
      Billing: ["View Invoices", "Create Invoice", "Process Payment"],
      Prescriptions: ["View Prescriptions", "Print Prescription"],
      Reports: [],
      Inventory: ["View Stock"],
      Settings: [],
    },
  },
  {
    id: "role-admin",
    name: "Admin",
    description: "Full, unrestricted administrative access across all modules, finances, team roles, and system settings.",
    memberCount: 1,
    permissionCount: 45,
    isSystem: true,
    permissions: {
      Dashboard: ["View Dashboard", "View Analytics", "Export Summary"],
      Patients: ["View Patients", "Add Patient", "Edit Patient", "Delete Patient", "Export Data"],
      Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
      Treatments: ["View Treatments", "Add Dental Chart", "Edit Dental Chart", "Delete Dental Chart"],
      Billing: ["View Invoices", "Create Invoice", "Apply Discount", "Process Payment", "Refund Invoice"],
      Prescriptions: ["View Prescriptions", "Create Prescription", "Print Prescription"],
      Reports: ["View Financial Reports", "View Patient Reports", "Export Reports"],
      Inventory: ["View Stock", "Add Stock", "Adjust Quantity", "Manage Suppliers"],
      Settings: ["View Settings", "Manage Clinic Info", "Manage Team", "Manage Roles & Permissions"],
    },
  },
  {
    id: "role-assistant",
    name: "Dental Assistant",
    description: "Support staff access for patient charts, appointment schedules, and sterilisation logs.",
    memberCount: 1,
    permissionCount: 12,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard"],
      Patients: ["View Patients"],
      Appointments: ["View Appointments"],
      Treatments: ["View Treatments", "Add Dental Chart"],
      Billing: [],
      Prescriptions: ["View Prescriptions"],
      Reports: [],
      Inventory: ["View Stock", "Adjust Quantity"],
      Settings: [],
    },
  },
  {
    id: "role-accounts",
    name: "Accounts Manager",
    description: "Financial access for billing, expense tracking, tax calculations, and profit & loss statements.",
    memberCount: 1,
    permissionCount: 18,
    isSystem: false,
    permissions: {
      Dashboard: ["View Dashboard", "View Analytics"],
      Patients: ["View Patients"],
      Appointments: ["View Appointments"],
      Treatments: [],
      Billing: ["View Invoices", "Create Invoice", "Apply Discount", "Process Payment", "Refund Invoice"],
      Prescriptions: [],
      Reports: ["View Financial Reports", "Export Reports"],
      Inventory: ["View Stock", "Manage Suppliers"],
      Settings: ["View Settings"],
    },
  },
];

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Dr. Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@dentapure.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-teal-500",
    lastLogin: "Today, 10:45 AM",
  },
  {
    id: "tm-2",
    name: "Dr. Ananya Verma",
    phone: "+91 98123 88765",
    email: "ananya.verma@dentapure.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-indigo-500",
    lastLogin: "Today, 09:15 AM",
  },
  {
    id: "tm-3",
    name: "Dr. Vikramaditya Rao",
    phone: "+91 97654 32109",
    email: "vikram.rao@dentapure.com",
    role: "Doctor",
    roleId: "role-doctor",
    status: "Active",
    avatarColor: "bg-emerald-500",
    lastLogin: "Yesterday, 06:30 PM",
  },
  {
    id: "tm-4",
    name: "Sunita Patil",
    phone: "+91 99887 66554",
    email: "sunita.p@dentapure.com",
    role: "Receptionist",
    roleId: "role-receptionist",
    status: "Active",
    avatarColor: "bg-amber-500",
    lastLogin: "Today, 08:00 AM",
  },
  {
    id: "tm-5",
    name: "Amit Deshmukh",
    phone: "+91 91234 56789",
    email: "admin@dentapure.com",
    role: "Admin",
    roleId: "role-admin",
    status: "Active",
    avatarColor: "bg-blue-600",
    lastLogin: "Just now",
  },
  {
    id: "tm-6",
    name: "Meera Kulkarni",
    phone: "+91 98450 11223",
    email: "meera.k@dentapure.com",
    role: "Receptionist",
    roleId: "role-receptionist",
    status: "Active",
    avatarColor: "bg-purple-500",
    lastLogin: "2 days ago",
  },
  {
    id: "tm-7",
    name: "Rahul Thorat",
    phone: "+91 97112 33445",
    email: "rahul.t@dentapure.com",
    role: "Dental Assistant",
    roleId: "role-assistant",
    status: "Active",
    avatarColor: "bg-rose-500",
    lastLogin: "Yesterday, 02:10 PM",
  },
  {
    id: "tm-8",
    name: "Sneha Joshi",
    phone: "+91 96543 21098",
    email: "sneha.j@dentapure.com",
    role: "Accounts Manager",
    roleId: "role-accounts",
    status: "Invited",
    avatarColor: "bg-cyan-500",
    lastLogin: "Invitation Sent",
  },
];

const DEFAULT_CLINIC_SETTINGS: ClinicSettingsData = {
  clinicName: "DentaPure Dental Clinic",
  doctorTitle: "Dr. Rajesh Sharma (BDS, MDS)",
  phone: "+91 98765 43210",
  email: "contact@dentapure.com",
  address: "Suite 402, Medical Enclave, M.G. Road, Pune, MH 411001",
  gstin: "27AAAAA0000A1Z5",
  website: "www.dentapureclinic.com",
  timing: "Mon - Sat: 09:00 AM - 08:00 PM | Sun: Closed",
  chairsCount: 4,
};

// In-memory cache fallback to ensure instant UI response if Firestore latency occurs
let memoryMembersCache: TeamMember[] = [...INITIAL_MEMBERS];
let memoryRolesCache: RolePermission[] = [...INITIAL_ROLES];
let memoryClinicSettingsCache: ClinicSettingsData = { ...DEFAULT_CLINIC_SETTINGS };

/* ─── Team Members Services ─── */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const snap = await getDocs(collection(db, MEMBERS_COLLECTION));
    if (snap.empty) {
      return memoryMembersCache;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMember);
    memoryMembersCache = list;
    return list;
  } catch (error) {
    console.warn("Firestore fetch error for team members, using cache fallback:", error);
    return memoryMembersCache;
  }
}

export async function addTeamMember(formData: TeamMemberFormData): Promise<TeamMember> {
  const avatarColors = ["bg-teal-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
  const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

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
      createdAt: Timestamp.now(),
    });
    newMember.id = docRef.id;
  } catch (error) {
    console.warn("Firestore write error, using in-memory update:", error);
  }

  memoryMembersCache = [newMember, ...memoryMembersCache];
  return newMember;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  try {
    await updateDoc(doc(db, MEMBERS_COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore update error for member:", error);
  }

  memoryMembersCache = memoryMembersCache.map((m) => (m.id === id ? { ...m, ...updates } : m));
}

export async function deleteTeamMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
  } catch (error) {
    console.warn("Firestore delete error for member:", error);
  }

  memoryMembersCache = memoryMembersCache.filter((m) => m.id !== id);
}

export async function resetMemberPassword(id: string): Promise<void> {
  // Simulates sending password reset link / email
  await new Promise((res) => setTimeout(res, 300));
}

/* ─── Roles & Permissions Services ─── */
export async function getRoles(): Promise<RolePermission[]> {
  try {
    const snap = await getDocs(collection(db, ROLES_COLLECTION));
    if (snap.empty) {
      return memoryRolesCache;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RolePermission);
    memoryRolesCache = list;
    return list;
  } catch (error) {
    console.warn("Firestore fetch error for roles, using cache fallback:", error);
    return memoryRolesCache;
  }
}

export async function addRole(roleData: Omit<RolePermission, "id" | "memberCount" | "permissionCount">): Promise<RolePermission> {
  let count = 0;
  Object.values(roleData.permissions).forEach((perms) => {
    count += perms.length;
  });

  const newRole: RolePermission = {
    id: `role-${Date.now()}`,
    ...roleData,
    memberCount: 0,
    permissionCount: count,
    isSystem: false,
  };

  try {
    const docRef = await addDoc(collection(db, ROLES_COLLECTION), {
      ...roleData,
      memberCount: 0,
      permissionCount: count,
      isSystem: false,
      createdAt: Timestamp.now(),
    });
    newRole.id = docRef.id;
  } catch (error) {
    console.warn("Firestore write error for role:", error);
  }

  memoryRolesCache = [...memoryRolesCache, newRole];
  return newRole;
}

export async function updateRole(id: string, updates: Partial<RolePermission>): Promise<void> {
  if (updates.permissions) {
    let count = 0;
    Object.values(updates.permissions).forEach((perms) => {
      count += perms.length;
    });
    updates.permissionCount = count;
  }

  try {
    await updateDoc(doc(db, ROLES_COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore update error for role:", error);
  }

  memoryRolesCache = memoryRolesCache.map((r) => (r.id === id ? { ...r, ...updates } : r));
}

export async function deleteRole(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ROLES_COLLECTION, id));
  } catch (error) {
    console.warn("Firestore delete error for role:", error);
  }

  memoryRolesCache = memoryRolesCache.filter((r) => r.id !== id);
}

/* ─── Clinic Settings Services ─── */
export async function getClinicSettings(): Promise<ClinicSettingsData> {
  try {
    const snap = await getDoc(doc(db, CLINIC_SETTINGS_COLLECTION, "general"));
    if (snap.exists()) {
      const data = snap.data() as ClinicSettingsData;
      memoryClinicSettingsCache = data;
      return data;
    }
  } catch (error) {
    console.warn("Firestore fetch error for clinic settings:", error);
  }
  return memoryClinicSettingsCache;
}

export async function updateClinicSettings(data: Partial<ClinicSettingsData>): Promise<ClinicSettingsData> {
  const updated = { ...memoryClinicSettingsCache, ...data };
  memoryClinicSettingsCache = updated;

  try {
    await setDoc(doc(db, CLINIC_SETTINGS_COLLECTION, "general"), updated, { merge: true });
  } catch (error) {
    console.warn("Firestore setDoc error for clinic settings:", error);
  }

  return updated;
}
