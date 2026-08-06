import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { COLLECTIONS } from "../../../../lib/services/firestoreConfig";
import { generatePrescriptionPdfBuffer } from "../../../../lib/services/pdfServerService";
import { DocumentStorageService } from "../../../../lib/services/documentStorageService";
import { createErrorResponse, logServerError } from "../../../../lib/errors/messagingErrors";
import type { Prescription, ClinicBasicInfo } from "../../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return createErrorResponse("PATIENT_NOT_FOUND", "Missing prescription ID parameter.");
    }

    // 1. Fetch latest Prescription from Firestore
    const rxRef = doc(db, COLLECTIONS.PRESCRIPTIONS, id);
    const rxSnap = await getDoc(rxRef);

    if (!rxSnap.exists()) {
      return createErrorResponse("PATIENT_NOT_FOUND", "Prescription record not found.");
    }

    const prescription = rxSnap.data() as Prescription;

    // 2. Fetch Clinic Settings from Firestore
    const clinicRef = doc(db, COLLECTIONS.CLINIC_SETTINGS, "info");
    const clinicSnap = await getDoc(clinicRef);
    const clinicInfo = clinicSnap.exists() ? (clinicSnap.data() as ClinicBasicInfo) : undefined;

    // 3. Retrieve existing valid PDF from Storage or generate & upload exactly once
    const { pdfBuffer, reused } = await DocumentStorageService.getOrEnsurePrescriptionPdf(
      id,
      prescription,
      clinicInfo
    );

    if (reused) {
      console.log(`[GET /api/pdf/prescription] Streamed existing stored PDF for ID '${id}' (0 extra Storage uploads).`);
    } else {
      console.log(`[GET /api/pdf/prescription] Generated and uploaded initial PDF for ID '${id}'.`);
    }

    // 4. Return binary PDF stream
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="prescription_${id}.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    logServerError(error, { action: "Generate Prescription PDF" });
    return createErrorResponse(
      "PDF_GENERATION_FAILED",
      "Unable to generate prescription PDF. Please verify patient data.",
      error?.message
    );
  }
}

