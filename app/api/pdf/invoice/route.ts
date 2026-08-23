import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/server/firebaseAdmin";
import { COLLECTIONS } from "../../../../lib/services/firestoreConfig";
import { DocumentStorageService } from "../../../../lib/services/documentStorageService";
import { getClinicSettings } from "../../../../lib/services/clinicSettingsService";
import { createErrorResponse, logServerError } from "../../../../lib/errors/messagingErrors";
import type { Invoice } from "../../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return createErrorResponse("PATIENT_NOT_FOUND", "Missing invoice ID parameter.");
    }

    // 1. Fetch latest Invoice from Firestore via Admin SDK
    const invRef = adminDb.collection(COLLECTIONS.INVOICES).doc(id);
    const invSnap = await invRef.get();

    if (!invSnap.exists) {
      return createErrorResponse("PATIENT_NOT_FOUND", "Invoice record not found.");
    }

    const invoice = invSnap.data() as Invoice;

    // 2. Fetch Clinic Settings (single source of truth)
    const clinicInfo = await getClinicSettings();

    // 3. Retrieve or generate PDF in Firebase Storage with 1-time upload & automatic recovery
    const { pdfBuffer } = await DocumentStorageService.getOrEnsureInvoicePdf(
      id,
      invoice,
      clinicInfo
    );

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
