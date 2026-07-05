/**
 * Firestore Seed Script
 *
 * Run this script ONCE after setting up Firebase to populate
 * the Firestore database with initial data.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Prerequisites:
 *   - .env.local must have valid Firebase config values
 *   - Firebase project must be created with Firestore enabled
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

// ─── Load env from .env.local ───
import { config } from "dotenv";
config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Seed Data ───

const services = [
  { name: "Routine Checkup & Cleaning", category: "general", isActive: true },
  { name: "Cavity Fillings & Sealants", category: "general", isActive: true },
  { name: "Root Canal Therapy", category: "general", isActive: true },
  { name: "Gum Disease Treatment", category: "general", isActive: true },
  { name: "Tooth Extractions", category: "general", isActive: true },
  { name: "Preventative Fluoride Care", category: "general", isActive: true },
  { name: "Professional Teeth Whitening", category: "cosmetic", isActive: true },
  { name: "Premium Porcelain Veneers", category: "cosmetic", isActive: true },
  { name: "Dental Bonding", category: "cosmetic", isActive: true },
  { name: "Complete Smile Makeovers", category: "cosmetic", isActive: true },
  { name: "Emergency Dental Care", category: "emergency", isActive: true },
  { name: "Braces / Orthodontics", category: "orthodontics", isActive: true },
  { name: "Clear Aligners", category: "orthodontics", isActive: true },
  { name: "Dental Implants", category: "general", isActive: true },
  { name: "Cosmetic Consultation", category: "cosmetic", isActive: true },
];

const clinicSettings = {
  clinicName: "Sanjivani Dentals",
  phone: "+91 77750 89777",
  whatsapp: "+91 77750 89777",
  address: "123 Dental Excellence Way, Medical District, City 90210",
  workingHours: {
    start: "9:00 AM",
    end: "5:00 PM",
    days: "Mon-Sat",
  },
  timeSlots: [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
    "4:30 PM", "5:00 PM",
  ],
};

const samplePatients = [
  {
    name: "Sarah Henderson",
    phone: "+1 (555) 901-2100",
    email: "sarah.h@email.com",
    age: "32",
    lastVisit: "2024-06-14",
    condition: "Root Canal",
    notes: "Follow-up in 6 weeks",
    avatarColor: "bg-blue-500",
    gender: "Female",
    diseases: "None",
    bloodType: "A+",
    allergies: "None",
  },
  {
    name: "Michael Jenkins",
    phone: "+1 (555) 884-2000",
    email: "m.jenkins@email.com",
    age: "45",
    lastVisit: "2024-06-13",
    condition: "Prophylaxis",
    notes: "Mild gum sensitivity",
    avatarColor: "bg-purple-500",
    gender: "Male",
    diseases: "Blood Pressure (Hypertension)",
    bloodType: "O+",
    allergies: "Penicillin (Severe)",
  },
  {
    name: "Emma Wilson",
    phone: "+1 (555) 921-0300",
    email: "emma.w@email.com",
    age: "28",
    lastVisit: "2024-06-12",
    condition: "Orthodontics",
    notes: "Braces adjustment scheduled",
    avatarColor: "bg-emerald-500",
    gender: "Female",
    diseases: "None",
    bloodType: "B-",
    allergies: "Latex (Mild)",
  },
  {
    name: "David Rivera",
    phone: "+1 (555) 774-1000",
    email: "d.rivera@email.com",
    age: "37",
    lastVisit: "2024-06-10",
    condition: "Teeth Whitening",
    notes: "Second session pending",
    avatarColor: "bg-orange-500",
    gender: "Male",
    diseases: "None",
    bloodType: "AB+",
    allergies: "None",
  },
  {
    name: "Laura Peterson",
    phone: "+1 (555) 931-0400",
    email: "l.peterson@email.com",
    age: "51",
    lastVisit: "2024-05-28",
    condition: "Dental Implants",
    notes: "Post-op check required",
    avatarColor: "bg-teal-500",
    gender: "Female",
    diseases: "Sugar (Diabetes)",
    bloodType: "O-",
    allergies: "Sulfa Drugs",
  },
];

const sampleDoctors = [
  {
    fullName: "Dr. Julian Moore",
    specialization: "General Dentistry & Endodontics",
    phone: "+1 (555) 111-2222",
    email: "j.moore@sanjivanidentals.com",
    availability: ["Monday 9:00 AM - 5:00 PM", "Wednesday 9:00 AM - 5:00 PM", "Friday 9:00 AM - 3:00 PM"],
    status: "Active",
  },
  {
    fullName: "Dr. Sarah Taylor",
    specialization: "Orthodontics & Pedodontics",
    phone: "+1 (555) 333-4444",
    email: "s.taylor@sanjivanidentals.com",
    availability: ["Tuesday 10:00 AM - 6:00 PM", "Thursday 10:00 AM - 6:00 PM"],
    status: "Active",
  }
];

// ─── Main ───

async function seed() {
  console.log("🌱 Starting Firestore seed...\n");

  // 1. Clinic Settings
  console.log("📋 Seeding clinic settings...");
  await setDoc(doc(db, "clinicSettings", "config"), clinicSettings);
  console.log("   ✅ Clinic settings created\n");

  // 2. Services
  console.log("🦷 Seeding services...");
  const servicesRef = collection(db, "services");
  for (const service of services) {
    await addDoc(servicesRef, service);
    console.log(`   ✅ ${service.name}`);
  }
  console.log();

  // 2.5. Doctors
  console.log("👨‍⚕️ Seeding sample doctors...");
  const doctorsRef = collection(db, "doctors");
  const doctorIds: string[] = [];
  const doctorMap: Record<string, string> = {};
  const now = Timestamp.now();
  for (const docData of sampleDoctors) {
    const docRef = await addDoc(doctorsRef, {
      ...docData,
      createdAt: now,
    });
    doctorIds.push(docRef.id);
    doctorMap[docData.fullName] = docRef.id;
    console.log(`   ✅ Doctor: ${docData.fullName} (ID: ${docRef.id})`);
  }
  console.log();

  // 3. Sample Patients
  console.log("👤 Seeding sample patients, medical profiles, and treatments...");
  const patientsRef = collection(db, "patients");
  for (const patient of samplePatients) {
    const { diseases, bloodType, allergies, condition, notes, ...basicPatient } = patient;
    const docRef = await addDoc(patientsRef, {
      ...basicPatient,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`   ✅ Patient: ${patient.name}`);

    // Seed corresponding medical profile
    const profileRef = doc(db, "patientMedicalProfiles", docRef.id);
    await setDoc(profileRef, {
      patientId: docRef.id,
      bloodGroup: bloodType || "None",
      allergies: allergies || "None",
      chronicDiseases: diseases || "None",
      medicalConditions: condition || "None",
      clinicalNotes: notes || "No clinical history or notes recorded for this patient.",
      emergencyContact: "",
      updatedAt: now,
    });
    console.log(`      ✅ Medical profile seeded`);

    // Seed a clinical encounter document if they have a condition
    if (condition) {
      const encountersRef = collection(db, "patientEncounters");
      const chosenDoctor = condition.includes("Orthodontic") || condition.includes("braces") 
        ? "Dr. Sarah Taylor" 
        : "Dr. Julian Moore";
      const chosenDoctorId = doctorMap[chosenDoctor] || doctorIds[0];

      const encounterDocRef = await addDoc(encountersRef, {
        patientId: docRef.id,
        doctorId: chosenDoctorId,
        doctorName: chosenDoctor,
        visitDate: "2025-12-14",
        chiefComplaint: `Patient reported persistent discomfort related to: ${condition}`,
        diagnosis: `Identified indication for ${condition}`,
        treatments: [`Initial assessment of ${condition}`, `Initiated active phase treatment`],
        prescriptionId: "",
        followUpDate: "2026-01-25",
        status: "In Progress",
        notes: notes || "Patient tolerated the diagnostic procedures well.",
        createdAt: now,
        updatedAt: now,
      });
      console.log(`      ✅ Clinical Visit Encounter seeded`);

      // Seed mock invoices for this patient
      const invoicesRef = collection(db, "invoices");
      // 1. Consultation fee
      await addDoc(invoicesRef, {
        patientId: docRef.id,
        encounterId: "",
        appointmentId: "",
        amount: 125.00,
        paymentStatus: "Paid",
        paymentMethod: "UPI",
        invoiceDate: "2025-11-10",
        createdAt: now,
      });
      // 2. Active treatment fee
      await addDoc(invoicesRef, {
        patientId: docRef.id,
        encounterId: encounterDocRef.id,
        amount: 350.00,
        paymentStatus: "Pending",
        paymentMethod: "None",
        invoiceDate: "2025-12-14",
        createdAt: now,
      });
      console.log(`      ✅ Billing Invoices seeded`);
    }
  }
  console.log();

  console.log("🎉 Seed complete! Your Firestore database is ready.");
  console.log("\nNext steps:");
  console.log("  1. Create an admin user in Firebase Console → Authentication → Add User");
  console.log("  2. Deploy Firestore security rules from firestore.rules");
  console.log("  3. Run `npm run dev` and visit /admin/login\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
