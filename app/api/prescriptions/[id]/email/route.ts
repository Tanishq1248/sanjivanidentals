import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { COLLECTIONS } from "../../../../../lib/services/firestoreConfig";
import { DocumentStorageService } from "../../../../../lib/services/documentStorageService";
import { Resend } from "resend";
import type { Prescription, ClinicBasicInfo } from "../../../../../lib/types";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    let { patientEmail, patientName, clinicName } = body || {};

    if (!id) {
      return NextResponse.json({ error: "Prescription ID parameter is required." }, { status: 400 });
    }

    // 1. Fetch Prescription from Firestore
    const rxRef = doc(db, COLLECTIONS.PRESCRIPTIONS, id);
    const rxSnap = await getDoc(rxRef);
    if (!rxSnap.exists()) {
      return NextResponse.json({ error: "Prescription record not found." }, { status: 404 });
    }

    const prescription = { prescriptionId: rxSnap.id, ...rxSnap.data() } as Prescription;
    patientEmail = patientEmail || (prescription as any).patientEmail;
    patientName = patientName || prescription.patientName || "Patient";

    if (!patientEmail) {
      return NextResponse.json({ error: "Patient email is required." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[EMAIL SERVICE] RESEND_API_KEY environment variable is not defined");
      return NextResponse.json(
        { error: "Email service API key is missing. Please configure RESEND_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    // 2. Fetch Clinic Settings
    const clinicRef = doc(db, COLLECTIONS.CLINIC_SETTINGS, "info");
    const clinicSnap = await getDoc(clinicRef);
    const clinicInfo = clinicSnap.exists() ? (clinicSnap.data() as ClinicBasicInfo) : undefined;
    clinicName = clinicName || clinicInfo?.clinicName || "Sanjivani Dentals";

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
