import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { COLLECTIONS } from "../../../../../lib/services/firestoreConfig";
import { DocumentStorageService } from "../../../../../lib/services/documentStorageService";
import { getClinicSettings } from "../../../../../lib/services/clinicSettingsService";
import { Resend } from "resend";
import { env } from "../../../../../lib/config/env";
import type { Invoice } from "../../../../../lib/types";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    let patientEmail = body?.email;
    let patientName = body?.patientName;
    let { clinicName } = body || {};

    if (!id) {
      return NextResponse.json({ error: "Invoice ID parameter is required." }, { status: 400 });
    }

    // 1. Fetch Invoice from Firestore
    const invRef = doc(db, COLLECTIONS.INVOICES, id);
    const invSnap = await getDoc(invRef);
    if (!invSnap.exists()) {
      return NextResponse.json({ error: "Invoice record not found." }, { status: 404 });
    }

    const invoice = { id: invSnap.id, ...invSnap.data() } as Invoice;
    patientEmail = patientEmail || (invoice as any).patientEmail;
    patientName = patientName || invoice.patientName || "Patient";

    if (!patientEmail) {
      return NextResponse.json({ error: "Patient email is required." }, { status: 400 });
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
    const pdfBuffer = await DocumentStorageService.getInvoicePdf(id, invoice, clinicInfo);

    console.log(`\n==================================================`);
    console.log(`[EMAIL SERVICE] Dispatching invoice email via Resend...`);
    console.log(`Recipient:  ${patientEmail}`);
    console.log(`Attachment: Invoice_${id.slice(0, 8)}.pdf (${pdfBuffer.length} bytes)`);
    console.log(`==================================================\n`);

    const resend = new Resend(apiKey);
    const emailResponse = await resend.emails.send({
      from: `${clinicName} <onboarding@resend.dev>`,
      to: patientEmail,
      subject: `Your Invoice from ${clinicName}`,
      text: `Dear ${patientName},\n\nThank you for visiting ${clinicName}.\n\nPlease find your invoice attached.\n\nWarm regards,\n${clinicName}`,
      attachments: [
        {
          filename: `Invoice_${id.slice(0, 8).toUpperCase()}.pdf`,
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

    // Update Firestore invoice document
    await updateDoc(invRef, {
      emailSent: true,
      emailSentAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Invoice successfully emailed to ${patientEmail}`,
      emailSentAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error in Resend invoice email API handler:", error);
    const message = error instanceof Error ? error.message : "Failed to send invoice email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
