import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { COLLECTIONS } from "../../../../lib/services/firestoreConfig";
import { generateInvoicePdfBuffer } from "../../../../lib/services/pdfServerService";
import { createErrorResponse, logServerError } from "../../../../lib/errors/messagingErrors";
import type { Invoice, ClinicBasicInfo } from "../../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return createErrorResponse("PATIENT_NOT_FOUND", "Missing invoice ID parameter.");
    }

    // 1. Fetch latest Invoice from Firestore
    const invRef = doc(db, COLLECTIONS.INVOICES, id);
    const invSnap = await getDoc(invRef);

    if (!invSnap.exists()) {
      return createErrorResponse("PATIENT_NOT_FOUND", "Invoice record not found.");
    }

    const invoice = invSnap.data() as Invoice;

    // 2. Fetch Clinic Settings from Firestore
    const clinicRef = doc(db, COLLECTIONS.CLINIC_SETTINGS, "info");
    const clinicSnap = await getDoc(clinicRef);
    const clinicInfo = clinicSnap.exists() ? (clinicSnap.data() as ClinicBasicInfo) : undefined;

    // 3. Generate PDF Buffer on Server
    const pdfBuffer = generateInvoicePdfBuffer(invoice, clinicInfo);

    // 4. Return binary PDF stream
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice_${id}.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    logServerError(error, { action: "Generate Invoice PDF" });
    return createErrorResponse(
      "PDF_GENERATION_FAILED",
      "Unable to generate invoice PDF. Please verify patient data.",
      error?.message
    );
  }
}
