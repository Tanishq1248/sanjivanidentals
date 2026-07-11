import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { COLLECTIONS } from "../../../../../lib/services/firestoreConfig";
import { Resend } from "resend";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { patientEmail, patientName, pdfBase64, clinicName = "Sanjivani Dentals" } = body;

    if (!patientEmail) {
      return NextResponse.json({ error: "Patient email is required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[EMAIL SERVICE] RESEND_API_KEY environment variable is not defined");
      return NextResponse.json(
        { error: "Email service API key is missing. Please configure RESEND_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const pdfSize = pdfBase64 ? Math.round((pdfBase64.length * 3) / 4) : 0;

    console.log(`\n==================================================`);
    console.log(`[EMAIL SERVICE] Dispatching email via Resend...`);
    console.log(`Recipient:  ${patientEmail}`);
    console.log(`Attachment: invoice_${id.slice(0, 8)}.pdf (${pdfSize} bytes)`);
    console.log(`==================================================\n`);

    const attachments = pdfBase64
      ? [
          {
            filename: `invoice_${id.slice(0, 8)}.pdf`,
            content: Buffer.from(pdfBase64, "base64"),
          },
        ]
      : [];

    const emailResponse = await resend.emails.send({
      from: "Sanjivani Dentals <onboarding@resend.dev>",
      to: patientEmail,
      subject: "Your Dental Treatment Invoice",
      text: `Dear ${patientName || "Patient"},\n\nThank you for visiting our clinic.\n\nPlease find your invoice attached.\n\nRegards,\n${clinicName}`,
      attachments,
    });

    if (emailResponse.error) {
      console.error("[EMAIL SERVICE] Resend SDK Error:", emailResponse.error);
      return NextResponse.json(
        { error: emailResponse.error.message || "Failed to dispatch email via Resend." },
        { status: 500 }
      );
    }

    // Update Firestore invoice document
    const docRef = doc(db, COLLECTIONS.INVOICES, id);
    await updateDoc(docRef, {
      emailSent: true,
      emailSentAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Invoice successfully emailed to ${patientEmail}`,
      emailSentAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error in Resend email API handler:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
