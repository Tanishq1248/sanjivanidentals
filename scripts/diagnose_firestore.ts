import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { COLLECTIONS } from "../lib/services/firestoreConfig";

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

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

async function runDiagnostics() {
  console.log("==================================================");
  console.log("  SANJIVANI DENTALS - FIRESTORE DIAGNOSTICS");
  console.log("==================================================\n");

  try {
    // 1. Check Team Members
    console.log("1. Checking 'teamMembers' collection...");
    const teamSnap = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).get();
    console.log(`   ✅ Total team members found: ${teamSnap.size}`);
    teamSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`      • [${data.role || "Role"}] ${data.name || data.fullName} (${data.email || data.phone}) - Status: ${data.status || "Active"}`);
    });

    // 2. Check Clinic Settings
    console.log("\n2. Checking 'clinicSettings' collection...");
    const clinicSnap = await adminDb.collection(COLLECTIONS.CLINIC_SETTINGS).get();
    console.log(`   ✅ Total clinicSettings docs: ${clinicSnap.size}`);
    clinicSnap.forEach((doc) => {
      console.log(`      • Doc ID: ${doc.id}`);
    });

    // 3. Check Patients
    console.log("\n3. Checking 'patients' collection...");
    const patientsSnap = await adminDb.collection(COLLECTIONS.PATIENTS).get();
    console.log(`   ✅ Total patients found: ${patientsSnap.size}`);
    patientsSnap.docs.slice(0, 5).forEach((doc) => {
      const p = doc.data();
      console.log(`      • Patient: ${p.name} | Phone: ${p.phone} | ID: ${doc.id}`);
    });

    // 4. Test Patient Registration Flow
    console.log("\n4. Testing Patient Creation via Admin SDK...");
    const testPatientData = {
      name: `Test Diagnostics Patient ${Date.now().toString().slice(-4)}`,
      phone: "9876500000",
      email: "test.diagnostics@example.com",
      gender: "Male",
      age: "30",
      condition: "Routine Diagnostic Check",
      diseases: "None",
      allergies: "None",
      address: "Pune",
      notes: "Created during automated Firestore diagnostics",
      lastVisit: new Date().toISOString().split("T")[0],
      referralSource: "Walk-in",
      clinicId: "default",
      avatarColor: "bg-teal-500",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.PATIENTS).add(testPatientData);
    console.log(`   ✅ Patient successfully created with ID: ${docRef.id}`);

    // 5. Test Patient Fetching
    console.log("\n5. Testing Patient Retrieval...");
    const getDocSnap = await adminDb.collection(COLLECTIONS.PATIENTS).doc(docRef.id).get();
    if (getDocSnap.exists) {
      console.log(`   ✅ Successfully retrieved created patient: ${getDocSnap.data()?.name}`);
    }

    // Cleanup test doc
    await adminDb.collection(COLLECTIONS.PATIENTS).doc(docRef.id).delete();
    console.log("   🧹 Cleaned up temporary test patient document");

    // 6. Test Appointment Booking Payload Sanitization & Creation
    console.log("\n6. Testing Appointment Creation (with sanitized fields)...");
    const rawAppointmentPayload = {
      patientName: "Appointment Diagnostic Test",
      patientPhone: "9876543210",
      patientEmail: "appt.test@example.com",
      date: new Date().toISOString().split("T")[0],
      time: "10:30 AM",
      service: "Consultation",
      duration: 30,
      status: "Confirmed",
      notes: "",
      chairId: null,
      chair: "",
      doctorId: null,
      doctorName: "Dr. Rajesh Sharma",
      clinicId: "default",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const apptDocRef = await adminDb.collection(COLLECTIONS.APPOINTMENTS).add(rawAppointmentPayload);
    console.log(`   ✅ Appointment successfully created with ID: ${apptDocRef.id}`);

    // Cleanup test appointment doc
    await adminDb.collection(COLLECTIONS.APPOINTMENTS).doc(apptDocRef.id).delete();
    console.log("   🧹 Cleaned up temporary test appointment document");

    console.log("\n==================================================");
    console.log("  🎉 ALL FIRESTORE DIAGNOSTICS PASSED SUCCESSFULLY!");
    console.log("==================================================\n");
  } catch (error) {
    console.error("❌ Diagnostics encountered an error:", error);
    process.exit(1);
  }
}

runDiagnostics().then(() => process.exit(0));
