import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { COLLECTIONS } from "../../../../../lib/services/firestoreConfig";
import { DocumentStorageService } from "../../../../../lib/services/documentStorageService";
import { getClinicSettings } from "../../../../../lib/services/clinicSettingsService";
import { Resend } from "resend";
import { env } from "../../../../../lib/config/env";
import type { Prescription } from "../../../../../lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    let { patientEmail, patientName, clinicName } = body;

    // 1. Fetch Prescription from Firestore
    const rxRef = doc(db, COLLECTIONS.PRESCRIPTIONS, id);
    const rxSnap = await getDoc(rxRef);

    if (!rxSnap.exists()) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    const prescription = rxSnap.data() as Prescription;
    patientEmail = patientEmail || (prescription as any).patientEmail;
    patientName = patientName || prescription.patientName || "Patient";

    if (!patientEmail || !patientEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid or missing recipient email address." },
        { status: 400 }
      );
    }

    const apiKey = env.resend.apiKey;
    if (!apiKey) {
      console.error("[EMAIL SERVICE] RESEND_API_KEY environment variable is not defined");
      return NextResponse.json(
        { error: "Email service API key is missing. Please configure RESEND_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    // 2. Fetch Clinic Settings (single source of truth)
    const clinicInfo = await getClinicSettings();
    clinicName = clinicName || clinicInfo.clinicName;

    // 3. Retrieve PDF Buffer from Firebase Storage via DocumentStorageService
    const pdfBuffer = await DocumentStorageService.getPrescriptionPdf(id, prescription, clinicInfo);

    console.log(`\n==================================================`);
    console.log(`[EMAIL SERVICE] Dispatching prescription email via Resend...`);
    console.log(`Recipient:  ${patientEmail}`);
    console.log(`Attachment: Prescription_${prescription.prescriptionNumber || id.slice(0, 8)}.pdf (${pdfBuffer.length} bytes)`);
    console.log(`==================================================\n`);

    const resend = new Resend(apiKey);
    const emailResponse = await resend.emails.send({
      from: `${clinicName} <onboarding@resend.dev>`,
      to: patientEmail,
      subject: `Digital Prescription — ${clinicName}`,
      text: `Dear ${patientName},\n\nThank you for visiting ${clinicName}.\n\nPlease find your digital prescription attached.\n\nWarm regards,\n${clinicName}`,
      attachments: [
        {
          filename: `Prescription_${prescription.prescriptionNumber || id.slice(0, 8)}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (emailResponse.error) {
      console.error("[EMAIL SERVICE] Resend SDK Error:", emailResponse.error);
      return NextResponse.json(
        { error: emailResponse.error.message || "Failed to dispatch email via Resend." },
        { status: 500 }
      );
    }

    // Update Firestore prescription document
    await updateDoc(rxRef, {
      emailSent: true,
      emailSentAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Prescription successfully emailed to ${patientEmail}`,
      emailSentAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error in Resend prescription email API handler:", error);
    const message = error instanceof Error ? error.message : "Failed to send prescription email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
