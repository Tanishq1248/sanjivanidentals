import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// ── Initialize Firebase Admin SDK ──────────────────────────────────────────
function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const fileContent = fs.readFileSync(serviceAccountPath, "utf-8");
      const serviceAccount = JSON.parse(fileContent);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || "sanjivanidental-499dc",
      });
    } catch (e) {
      console.warn("⚠️  Failed to load serviceAccountKey.json, trying env:", e);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "sanjivanidental-499dc";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return initializeApp({
    projectId,
  });
}

const adminApp = initAdmin();
const adminDb = getFirestore(adminApp);

// ── Recursive Collection Purge ─────────────────────────────────────────────
async function deleteCollection(collectionPath: string, batchSize = 100): Promise<number> {
  const collectionRef = adminDb.collection(collectionPath);
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
  }

  return totalDeleted;
}

// ── Main Database Reset & Provisioning Routine ────────────────────────────
async function resetDatabase() {
  console.log("\n=======================================================");
  console.log("  DENTAPURE DATABASE RESET & PROVISIONING SCRIPT");
  console.log("=======================================================\n");

  // 1. Collections to Purge
  const collectionsToPurge = [
    "patients",
    "encounters",
    "patientEncounters",
    "patientMedicalProfiles",
    "patientTreatments",
    "prescriptions",
    "invoices",
    "appointments",
    "messageLogs",
    "messagingUsage",
    "documents",
    "xrays",
    "expenses",
    "notifications",
    "auditLogs",
    "loginHistory",
    "clinicReferrals",
    "teamMembers",
    "roles",
  ];

  console.log("🗑️  Purging existing collections...");
  for (const colName of collectionsToPurge) {
    process.stdout.write(`   • Deleting collection '${colName}'... `);
    const count = await deleteCollection(colName);
    console.log(`[OK] (${count} docs removed)`);
  }

  console.log("\n🌱 Provisioning initial default clinic configuration...");

  // 2. Provision Clinic Basic Settings
  const clinicBasicInfo = {
    clinicName: "DentaPure Dental Clinic",
    leadDoctorName: "Dr. Rajesh Sharma",
    doctorQualifications: "BDS, MDS",
    dentalCouncilRegNo: "MH-D-18492",
    primaryPhone: "+91 98765 43210",
    whatsappNumber: "+91 98765 43210",
    email: "contact@dentapure.com",
    websiteUrl: "www.dentapure.com",
    currencySymbol: "₹",
    invoiceFooterNote: "Thank you for choosing our clinic. Wishing you good dental health!",
    prescriptionFooterNote: "Take medicines strictly as prescribed. For emergency assistance call clinic helpline.",
    
    // Canonical dual-naming compatibility properties
    doctorName: "Dr. Rajesh Sharma",
    qualification: "BDS, MDS",
    registrationNumber: "MH-D-18492",
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    invoiceFooterText: "Thank you for choosing our clinic. Wishing you good dental health!",
    prescriptionFooterText: "Take medicines strictly as prescribed. For emergency assistance call clinic helpline.",
    addressLine1: "Suite 402, Medical Enclave",
    addressLine2: "M.G. Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    address: {
      line1: "Suite 402, Medical Enclave",
      line2: "M.G. Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
    },
    subscription: {
      plan: "basic",
      status: "active",
      features: {
        plan: "basic",
        maxDoctors: 2,
        maxChairs: 2,
        customMessageTemplates: false,
        advancedAppointmentRules: false,
        twoFactorAuth: false,
        auditLogs: false,
        bulkDataExport: false,
        rolePermissions: false,
        maxReceptionists: 1,
        customRoles: false,
        permissionEditing: false,
        chairManagement: true,
        advancedAnalytics: false,
        whatsappAutomation: true,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Write to both 'basicInfo' and 'default' documents for total compatibility
  await adminDb.collection("clinicSettings").doc("basicInfo").set(clinicBasicInfo);
  await adminDb.collection("clinicSettings").doc("default").set(clinicBasicInfo);
  console.log("   ✅ Clinic Basic Info seeded at 'clinicSettings/basicInfo'");

  // 3. Provision Clinic Resources (Dental Chairs)
  const clinicResources = {
    chairCount: 2,
    chairs: [
      {
        id: "chair-1",
        name: "Operatory 1",
        roomNumber: "Room 101",
        active: true,
        type: "General Treatment Chair",
      },
      {
        id: "chair-2",
        name: "Operatory 2",
        roomNumber: "Room 102",
        active: true,
        type: "Surgical / Orthodontic Chair",
      },
    ],
    updatedAt: FieldValue.serverTimestamp(),
  };

  await adminDb.collection("clinicSettings").doc("resources").set(clinicResources);
  await adminDb.collection("clinicResources").doc("resources").set(clinicResources);
  console.log("   ✅ Dental Chairs seeded (Operatory 1 & Operatory 2)");

  // 4. Provision Team Members (2 Doctors + 1 Receptionist)
  const teamMembers = [
    {
      id: "tm-rajesh-sharma",
      name: "Dr. Rajesh Sharma",
      fullName: "Dr. Rajesh Sharma",
      role: "Admin",
      roleId: "role-admin",
      email: "rajesh.sharma@dentapure.com",
      phone: "+91 98765 43210",
      specialization: "Oral & Maxillofacial Surgeon",
      registrationNumber: "MH-D-18492",
      status: "Active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: "tm-ananya-verma",
      name: "Dr. Ananya Verma",
      fullName: "Dr. Ananya Verma",
      role: "Doctor",
      roleId: "role-doctor",
      email: "ananya.verma@dentapure.com",
      phone: "+91 98765 43211",
      specialization: "Conservative Dentist & Endodontist",
      registrationNumber: "MH-D-21045",
      status: "Active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: "tm-sunita-patil",
      name: "Sunita Patil",
      fullName: "Sunita Patil",
      role: "Receptionist",
      roleId: "role-receptionist",
      email: "sunita.patil@dentapure.com",
      phone: "+91 98765 43212",
      specialization: "Front Desk & Patient Coordinator",
      registrationNumber: "",
      status: "Active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const member of teamMembers) {
    await adminDb.collection("teamMembers").doc(member.id).set(member);
    // Also mirror to 'doctors' collection if role is Doctor/Admin for legacy queries
    if (member.role === "Admin" || member.role === "Doctor") {
      await adminDb.collection("doctors").doc(member.id).set({
        id: member.id,
        name: member.fullName,
        fullName: member.fullName,
        specialization: member.specialization,
        registrationNumber: member.registrationNumber,
        phone: member.phone,
        email: member.email,
        active: true,
        status: "Active",
      });
    }
  }
  console.log("   ✅ Team Members seeded (Dr. Rajesh Sharma, Dr. Ananya Verma, Sunita Patil)");

  console.log("\n=======================================================");
  console.log("  🎉 DATABASE RESET & PROVISIONING COMPLETED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Reset script encountered an error:", err);
    process.exit(1);
  });
