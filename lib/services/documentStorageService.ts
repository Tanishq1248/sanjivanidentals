import {
  ref,
  uploadBytes,
  getBytes,
  getDownloadURL as getFirebaseDownloadURL,
  getMetadata as getFirebaseMetadata,
  deleteObject,
  FullMetadata,
} from "firebase/storage";
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { storage, db } from "../firebase";
import { COLLECTIONS } from "./firestoreConfig";
import { generatePrescriptionPdfBuffer, generateInvoicePdfBuffer } from "./pdfServerService";
import { getClinicSettings } from "./clinicSettingsService";
import type {
  UploadDocumentOptions,
  UploadResult,
  DocumentMetadataRecord,
  DocumentCategoryType,
  Prescription,
  Invoice,
  ClinicBasicInfo,
  ClinicSettingsData,
} from "../types";

/** Default fallback clinic identifier */
const DEFAULT_CLINIC_ID =
  process.env.NEXT_PUBLIC_CLINIC_ID || "sanjivanidental-499dc";

/**
 * Dynamically builds a standard, reusable Firebase Storage path:
 * clinics/{clinicId}/{documentType}/{year}/{month}/{fileName}
 *
 * Example:
 * clinics/sanjivanidental-499dc/prescriptions/2026/07/prescription_A1B2C3.pdf
 */
export function buildStoragePath(params: {
  clinicId?: string;
  documentType?: DocumentCategoryType;
  documentId: string;
  year?: string | number;
  month?: string | number;
  fileName?: string;
}): string {
  const clinicId = params.clinicId || DEFAULT_CLINIC_ID;
  const docType = params.documentType || "prescriptions";
  const date = new Date();
  const yearStr = params.year
    ? String(params.year)
    : String(date.getFullYear());
  const monthStr = params.month
    ? String(params.month).padStart(2, "0")
    : String(date.getMonth() + 1).padStart(2, "0");

  const singularType = docType.endsWith("s")
    ? docType.slice(0, -1)
    : docType;
  const computedFileName =
    params.fileName || `${singularType}_${params.documentId}.pdf`;

  return `clinics/${clinicId}/${docType}/${yearStr}/${monthStr}/${computedFileName}`;
}

/**
 * Helper to get the byte length of supported input data types.
 */
function getFileDataSize(
  data: Buffer | Uint8Array | Blob | ArrayBuffer
): number {
  if (data instanceof Blob) {
    return data.size;
  }
  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }
  if (ArrayBuffer.isView(data)) {
    return data.byteLength;
  }
  return 0;
}

/**
 * Helper to convert supported data types to Uint8Array / Blob for Firebase upload.
 */
function prepareUploadData(
  data: Buffer | Uint8Array | Blob | ArrayBuffer
): Uint8Array | Blob | ArrayBuffer {
  if (data instanceof Blob || data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
  }
  return data;
}

/**
 * Centralized Document Storage Service
 * Single module responsible for interacting with Firebase Storage and persisting document metadata.
 */
export class DocumentStorageService {
  /**
   * Uploads a generated PDF to Firebase Storage after validating input parameters.
   *
   * @param options Parameters for upload including fileData, documentId, patientId, etc.
   * @returns UploadResult object containing storagePath, fileName, fileSize, and mimeType.
   */
  static async uploadDocument(
    options: UploadDocumentOptions
  ): Promise<UploadResult> {
    const {
      fileData,
      documentId,
      patientId,
      encounterId,
      clinicId,
      documentType = "prescriptions",
      fileName: customFileName,
      year,
      month,
      customMetadata = {},
    } = options;

    // ── Upload Validation ──
    if (!fileData) {
      throw new Error(
        "Upload aborted: PDF file data is missing or undefined."
      );
    }

    const fileSize = getFileDataSize(fileData);
    if (fileSize <= 0) {
      throw new Error("Upload aborted: PDF file is empty (0 bytes).");
    }

    const mimeType = "application/pdf";

    const storagePath = buildStoragePath({
      clinicId,
      documentType,
      documentId,
      year,
      month,
      fileName: customFileName,
    });

    if (!storagePath || typeof storagePath !== "string" || storagePath.trim() === "") {
      throw new Error("Upload aborted: Invalid upload destination path.");
    }

    const fileName =
      customFileName ||
      storagePath.split("/").pop() ||
      `prescription_${documentId}.pdf`;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadPayload = prepareUploadData(fileData);

      await uploadBytes(storageRef, uploadPayload, {
        contentType: mimeType,
        customMetadata: {
          patientId,
          encounterId: encounterId || "",
          clinicId: clinicId || "",
          documentId,
          documentType,
          ...customMetadata,
        },
      });

      return {
        storagePath,
        fileName,
        fileSize,
        mimeType,
      };
    } catch (error: any) {
      console.error(
        `Firebase Storage upload failed for path "${storagePath}":`,
        error
      );
      throw new Error(
        `Failed to upload document to Firebase Storage: ${error?.message || "Unknown error"}`
      );
    }
  }

  /**
   * Generates a secure, ephemeral Download URL for an existing document in Firebase Storage.
   * Validates file existence, non-zero size (>0 bytes), and PDF content type before returning URL.
   * Centralized method used across WhatsApp delivery, Email delivery, and future document modules.
   *
   * @param storagePath Storage path reference in Firebase Storage.
   * @returns Secure download URL string.
   */
  static async getDownloadURL(storagePath: string): Promise<string> {
    if (!storagePath || typeof storagePath !== "string" || storagePath.trim() === "") {
      console.warn("[DocumentStorage] Download URL generation failed: storagePath is missing or invalid.");
      throw new Error("STORAGE_PATH_MISSING: Storage path is required to generate download URL.");
    }

    // 1. Validate file existence and file characteristics in Storage
    const validation = await DocumentStorageService.validateStoredDocument(storagePath);
    if (!validation.valid) {
      console.warn(`[DocumentStorage] Download URL generation failed for path '${storagePath}': Reason - ${validation.reason}`);
      if (validation.reason === "file_not_found") {
        throw new Error("STORAGE_FILE_MISSING: Document file does not exist at Storage path.");
      }
      if (validation.reason === "corrupted_zero_bytes") {
        throw new Error("CORRUPTED_FILE: Stored document file is 0 bytes.");
      }
      if (validation.reason === "invalid_mime_type") {
        throw new Error("INVALID_MIME_TYPE: Stored file is not a valid PDF document.");
      }
      throw new Error(`STORAGE_VALIDATION_FAILED: ${validation.reason || "Validation failed"}`);
    }

    console.log(`[DocumentStorage] Storage file located at path: ${storagePath}`);

    try {
      const storageRef = ref(storage, storagePath);
      const url = await getFirebaseDownloadURL(storageRef);
      // Log event without printing sensitive token or complete URL
      console.log(`[DocumentStorage] Download URL generated successfully for path: ${storagePath}`);
      return url;
    } catch (error: any) {
      console.error(`[DocumentStorage] Download URL generation failed for path '${storagePath}':`, error);
      throw new Error(`DOWNLOAD_URL_FAILED: ${error?.message || "Failed to generate Firebase Storage download URL."}`);
    }
  }

  /**
   * Retrieves Storage metadata for an existing file.
   *
   * @param storagePath Storage path reference in Firebase Storage.
   * @returns Storage metadata object.
   */
  static async getMetadata(storagePath: string): Promise<FullMetadata> {
    if (!storagePath) {
      throw new Error("Cannot get metadata: storagePath is required.");
    }
    const storageRef = ref(storage, storagePath);
    return await getFirebaseMetadata(storageRef);
  }

  /**
   * Deletes a document from Firebase Storage (implemented for future module cleanup).
   *
   * @param storagePath Storage path reference in Firebase Storage.
   */
  static async deleteDocument(storagePath: string): Promise<void> {
    if (!storagePath) {
      throw new Error("Cannot delete document: storagePath is required.");
    }
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  }

  /**
   * Checks whether a document already exists at the specified Storage path.
   * Useful for duplicate upload prevention.
   *
   * @param storagePath Storage path reference in Firebase Storage.
   * @returns True if file exists, false otherwise.
   */
  static async documentExists(storagePath: string): Promise<boolean> {
    if (!storagePath) return false;
    try {
      const storageRef = ref(storage, storagePath);
      await getFirebaseMetadata(storageRef);
      return true;
    } catch (error: any) {
      if (
        error?.code === "storage/object-not-found" ||
        error?.status_ === 404 ||
        error?.message?.includes("object-not-found")
      ) {
        return false;
      }
      // Return false gracefully for non-existent objects
      return false;
    }
  }

  /**
   * Stores document metadata in Firestore.
   * Records metadata in the centralized `documents` collection and updates the target prescription record.
   *
   * @param metadata Input metadata to record in Firestore.
   * @returns Saved document metadata ID.
   */
  static async saveDocumentMetadata(metadata: {
    patientId: string;
    encounterId?: string;
    clinicId?: string;
    prescriptionId?: string;
    documentType?: DocumentCategoryType;
    storagePath: string;
    fileName: string;
    mimeType?: string;
    fileSize: number;
    documentVersion?: number;
    status?: string;
  }): Promise<string> {
    const now = Timestamp.now();
    const clinicId = metadata.clinicId || DEFAULT_CLINIC_ID;
    const documentType = metadata.documentType || "prescriptions";
    const documentVersion = metadata.documentVersion || 1;
    const status = metadata.status || "active";
    const mimeType = metadata.mimeType || "application/pdf";
    const docId = metadata.prescriptionId || doc(collection(db, COLLECTIONS.DOCUMENTS)).id;

    const record: DocumentMetadataRecord = {
      patientId: metadata.patientId,
      encounterId: metadata.encounterId || "",
      clinicId,
      prescriptionId: metadata.prescriptionId || "",
      documentType,
      storagePath: metadata.storagePath,
      fileName: metadata.fileName,
      mimeType,
      fileSize: metadata.fileSize,
      documentVersion,
      status,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save metadata record in centralized `documents` collection
    const documentDocRef = doc(db, COLLECTIONS.DOCUMENTS, docId);
    await setDoc(documentDocRef, record, { merge: true });

    // 2. If prescriptionId is specified, update the prescription document with storage metadata reference
    if (metadata.prescriptionId) {
      try {
        const rxRef = doc(db, COLLECTIONS.PRESCRIPTIONS, metadata.prescriptionId);
        const rxSnap = await getDoc(rxRef);
        if (rxSnap.exists()) {
          await updateDoc(rxRef, {
            storagePath: metadata.storagePath,
            fileName: metadata.fileName,
            mimeType,
            fileSize: metadata.fileSize,
            documentVersion,
            status,
            clinicId,
            updatedAt: now,
          });
        }
      } catch (err) {
        console.warn(
          `Could not attach storagePath metadata directly to prescription ${metadata.prescriptionId}:`,
          err
        );
      }
    }

    return docId;
  }

  /**
   * Validates whether a file stored in Firebase Storage exists, is non-empty (>0 bytes), and is a valid PDF.
   *
   * @param storagePath Firebase Storage path to inspect.
   * @returns Object containing `valid: boolean` and metadata or failure reason.
   */
  static async validateStoredDocument(
    storagePath: string
  ): Promise<{ valid: boolean; reason?: string; metadata?: FullMetadata }> {
    if (!storagePath || typeof storagePath !== "string" || storagePath.trim() === "") {
      console.warn("[DocumentStorage] Validation failure for storagePath: Path is empty or invalid.");
      return { valid: false, reason: "empty_path" };
    }

    try {
      const storageRef = ref(storage, storagePath);
      const metadata = await getFirebaseMetadata(storageRef);

      if (!metadata) {
        console.warn(`[DocumentStorage] Validation failure for storagePath: ${storagePath} - Metadata unavailable.`);
        return { valid: false, reason: "metadata_unavailable" };
      }

      if (metadata.size <= 0) {
        console.warn(`[DocumentStorage] Validation failure for storagePath: ${storagePath} - 0-byte file detected.`);
        return { valid: false, reason: "corrupted_zero_bytes", metadata };
      }

      const mimeType = metadata.contentType || "";
      if (mimeType && !mimeType.includes("pdf") && !mimeType.includes("application/octet-stream")) {
        console.warn(`[DocumentStorage] Validation failure for storagePath: ${storagePath} - Invalid MIME type '${mimeType}'.`);
        return { valid: false, reason: "invalid_mime_type", metadata };
      }

      return { valid: true, metadata };
    } catch (error: any) {
      if (
        error?.code === "storage/object-not-found" ||
        error?.status_ === 404 ||
        error?.message?.includes("object-not-found")
      ) {
        console.warn(`[DocumentStorage] Missing Storage file detected at path: ${storagePath}`);
        return { valid: false, reason: "file_not_found" };
      }

      console.error(`[DocumentStorage] Storage validation error for path '${storagePath}':`, error);
      return { valid: false, reason: error?.message || "storage_error" };
    }
  }

  /**
   * Retrieves an existing prescription PDF from Firebase Storage if valid, or generates and uploads it once.
   * Ensures zero duplicate PDF uploads to Firebase Storage across viewing, downloading, printing, and sharing.
   */
  static async getOrEnsurePrescriptionPdf(
    prescriptionId: string,
    rxData: Prescription,
    clinicInfo?: ClinicBasicInfo
  ): Promise<{
    pdfBuffer: Buffer;
    storagePath: string;
    downloadUrl: string;
    reused: boolean;
  }> {
    if (!prescriptionId || !rxData) {
      throw new Error("[DocumentStorage] Cannot retrieve/ensure prescription PDF: Invalid prescription parameters.");
    }

    let storagePath = rxData.storagePath;

    // 1. Check central 'documents' collection if storagePath is missing on prescription object
    if (!storagePath) {
      try {
        const docMetaSnap = await getDoc(doc(db, COLLECTIONS.DOCUMENTS, prescriptionId));
        if (docMetaSnap.exists()) {
          const docMeta = docMetaSnap.data() as DocumentMetadataRecord;
          if (docMeta.storagePath && docMeta.status !== "deleted") {
            storagePath = docMeta.storagePath;
          }
        }
      } catch (metaErr) {
        console.warn(`[DocumentStorage] Could not read documents metadata for ${prescriptionId}:`, metaErr);
      }
    }

    // 2. Validate existing storage path if found
    let isExistingValid = false;
    if (storagePath) {
      const valResult = await DocumentStorageService.validateStoredDocument(storagePath);
      if (valResult.valid && rxData.status !== "deleted") {
        isExistingValid = true;
      }
    }

    // 3. REUSE EXISTING PDF IF VALID
    if (storagePath && isExistingValid) {
      try {
        console.log(`[DocumentStorage] Existing PDF reused for prescription: ${prescriptionId} at path: ${storagePath}`);
        const downloadUrl = await DocumentStorageService.getDownloadURL(storagePath);

        // Retrieve existing stored binary bytes directly from Firebase Storage without re-generating
        let pdfBuffer: Buffer;
        try {
          const storageRef = ref(storage, storagePath);
          const arrayBuffer = await getBytes(storageRef);
          pdfBuffer = Buffer.from(arrayBuffer);
        } catch (byteErr) {
          console.warn(`[DocumentStorage] getBytes failed for ${storagePath}, downloading via URL:`, byteErr);
          const res = await fetch(downloadUrl);
          const ab = await res.arrayBuffer();
          pdfBuffer = Buffer.from(ab);
        }

        return {
          pdfBuffer,
          storagePath,
          downloadUrl,
          reused: true,
        };
      } catch (reuseErr) {
        console.warn(`[DocumentStorage] Failed to reuse existing PDF for ${prescriptionId}, falling back to regeneration:`, reuseErr);
      }
    }

    // 4. FALLBACK / FIRST-TIME GENERATION: Missing Storage file or invalid metadata
    if (storagePath) {
      console.warn(`[DocumentStorage] Missing Storage file detected at path: ${storagePath}. Regenerating replacement PDF...`);
    }

    try {
      const effectiveClinicInfo = clinicInfo || (await getClinicSettings());
      const pdfBuffer = generatePrescriptionPdfBuffer(rxData, effectiveClinicInfo);
      const clinicId = rxData.clinicId || DEFAULT_CLINIC_ID;

      const uploadResult = await DocumentStorageService.uploadDocument({
        fileData: pdfBuffer,
        documentId: prescriptionId,
        patientId: rxData.patientId,
        encounterId: rxData.encounterId,
        clinicId,
        documentType: "prescriptions",
        fileName: `prescription_${prescriptionId}.pdf`,
      });

      storagePath = uploadResult.storagePath;
      console.log(`[DocumentStorage] Uploaded new PDF for prescription: ${prescriptionId} to path: ${storagePath}`);

      await DocumentStorageService.saveDocumentMetadata({
        patientId: rxData.patientId,
        encounterId: rxData.encounterId,
        clinicId,
        prescriptionId,
        documentType: "prescriptions",
        storagePath: uploadResult.storagePath,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        documentVersion: (rxData.documentVersion || 0) + 1,
        status: "active",
      });

      console.log(`[DocumentStorage] Metadata repaired for prescription: ${prescriptionId}`);

      const downloadUrl = await DocumentStorageService.getDownloadURL(storagePath);

      return {
        pdfBuffer,
        storagePath,
        downloadUrl,
        reused: false,
      };
    } catch (uploadError: any) {
      console.error(`[DocumentStorage] Upload failure for prescription: ${prescriptionId}:`, uploadError);
      throw new Error(`Failed to generate and store prescription PDF: ${uploadError?.message || "Storage error"}`);
    }
  }

  /**
   * Retrieves an existing invoice PDF from Firebase Storage if valid, or generates and uploads it once with automatic recovery.
   * Ensures zero duplicate PDF uploads to Firebase Storage across viewing, downloading, printing, and sharing.
   */
  static async getOrEnsureInvoicePdf(
    invoiceId: string,
    invoiceData: Invoice,
    clinicInfo?: ClinicBasicInfo
  ): Promise<{
    pdfBuffer: Buffer;
    storagePath: string;
    downloadUrl: string;
    reused: boolean;
  }> {
    if (!invoiceId || !invoiceData) {
      throw new Error("[DocumentStorage] Cannot retrieve/ensure invoice PDF: Invalid invoice parameters.");
    }

    let storagePath = invoiceData.storagePath;

    // 1. Check central 'documents' collection if storagePath is missing on invoice object
    if (!storagePath) {
      try {
        const docMetaSnap = await getDoc(doc(db, COLLECTIONS.DOCUMENTS, invoiceId));
        if (docMetaSnap.exists()) {
          const docMeta = docMetaSnap.data() as DocumentMetadataRecord;
          if (docMeta.storagePath && docMeta.status !== "deleted") {
            storagePath = docMeta.storagePath;
          }
        }
      } catch (metaErr) {
        console.warn(`[DocumentStorage] Could not read documents metadata for invoice ${invoiceId}:`, metaErr);
      }
    }

    // 2. Validate existing storage path if found
    let isExistingValid = false;
    if (storagePath) {
      const valResult = await DocumentStorageService.validateStoredDocument(storagePath);
      if (valResult.valid && invoiceData.status !== "deleted") {
        isExistingValid = true;
      }
    }

    // 3. REUSE EXISTING PDF IF VALID
    if (storagePath && isExistingValid) {
      try {
        console.log(`[DocumentStorage] Existing PDF reused for invoice: ${invoiceId} at path: ${storagePath}`);
        const downloadUrl = await DocumentStorageService.getDownloadURL(storagePath);

        // Retrieve existing stored binary bytes directly from Firebase Storage without re-generating
        let pdfBuffer: Buffer;
        try {
          const storageRef = ref(storage, storagePath);
          const arrayBuffer = await getBytes(storageRef);
          pdfBuffer = Buffer.from(arrayBuffer);
        } catch (byteErr) {
          console.warn(`[DocumentStorage] getBytes failed for invoice ${storagePath}, downloading via URL:`, byteErr);
          const res = await fetch(downloadUrl);
          const ab = await res.arrayBuffer();
          pdfBuffer = Buffer.from(ab);
        }

        return {
          pdfBuffer,
          storagePath,
          downloadUrl,
          reused: true,
        };
      } catch (reuseErr) {
        console.warn(`[DocumentStorage] Failed to reuse existing PDF for invoice ${invoiceId}, falling back to regeneration:`, reuseErr);
      }
    }

    // 4. FALLBACK / FIRST-TIME GENERATION: Missing Storage file or invalid metadata (Automatic Recovery)
    if (storagePath) {
      console.warn(`[DocumentStorage] Missing Storage file detected at path: ${storagePath} for invoice ${invoiceId}. Regenerating replacement PDF...`);
    }

    try {
      const effectiveClinicInfo = clinicInfo || (await getClinicSettings());
      const pdfBuffer = generateInvoicePdfBuffer(invoiceData, effectiveClinicInfo);
      const clinicId = DEFAULT_CLINIC_ID;

      const uploadResult = await DocumentStorageService.uploadDocument({
        fileData: pdfBuffer,
        documentId: invoiceId,
        patientId: invoiceData.patientId || "",
        encounterId: invoiceData.encounterId || "",
        clinicId,
        documentType: "invoices",
        fileName: `invoice_${invoiceId}.pdf`,
      });

      storagePath = uploadResult.storagePath;
      console.log(`[DocumentStorage] Uploaded new PDF for invoice: ${invoiceId} to path: ${storagePath}`);

      await DocumentStorageService.saveDocumentMetadata({
        patientId: invoiceData.patientId || "",
        encounterId: invoiceData.encounterId || "",
        clinicId,
        prescriptionId: invoiceId,
        documentType: "invoices",
        storagePath,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        documentVersion: (invoiceData.documentVersion || 0) + 1,
        status: "active",
      });

      // Update invoice document in Firestore with storagePath
      try {
        const invRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
        await updateDoc(invRef, {
          storagePath,
          updatedAt: Timestamp.now(),
        });
      } catch (updateErr) {
        console.warn(`[DocumentStorage] Could not update invoice ${invoiceId} with storagePath:`, updateErr);
      }

      const downloadUrl = await DocumentStorageService.getDownloadURL(storagePath);

      return {
        pdfBuffer,
        storagePath,
        downloadUrl,
        reused: false,
      };
    } catch (uploadError: any) {
      console.error(`[DocumentStorage] Upload failure for invoice: ${invoiceId}:`, uploadError);
      throw new Error(`Failed to generate and store invoice PDF: ${uploadError?.message || "Storage error"}`);
    }
  }

  /**
   * Retrieves the stored PDF buffer for a prescription from Firebase Storage (with automatic recovery/upload if missing).
   * Reused by server-side email dispatchers and document processors.
   */
  static async getPrescriptionPdf(
    prescriptionId: string,
    rxData?: Prescription,
    clinicInfo?: ClinicBasicInfo
  ): Promise<Buffer> {
    let data = rxData;
    if (!data && prescriptionId) {
      const snap = await getDoc(doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId));
      if (snap.exists()) {
        data = { prescriptionId: snap.id, ...snap.data() } as Prescription;
      }
    }
    if (!data) {
      throw new Error(`[DocumentStorage] Prescription record '${prescriptionId}' not found.`);
    }

    const { pdfBuffer } = await DocumentStorageService.getOrEnsurePrescriptionPdf(
      prescriptionId,
      data,
      clinicInfo
    );
    return pdfBuffer;
  }

  /**
   * Retrieves the stored PDF buffer for an invoice from Firebase Storage (with automatic recovery/upload if missing).
   * Reused by server-side email dispatchers and document processors.
   */
  static async getInvoicePdf(
    invoiceId: string,
    invoiceData?: Invoice,
    clinicInfo?: ClinicBasicInfo
  ): Promise<Buffer> {
    let data = invoiceData;
    if (!data && invoiceId) {
      const snap = await getDoc(doc(db, COLLECTIONS.INVOICES, invoiceId));
      if (snap.exists()) {
        data = { id: snap.id, ...snap.data() } as Invoice;
      }
    }
    if (!data) {
      throw new Error(`[DocumentStorage] Invoice record '${invoiceId}' not found.`);
    }

    const { pdfBuffer } = await DocumentStorageService.getOrEnsureInvoicePdf(
      invoiceId,
      data,
      clinicInfo
    );
    return pdfBuffer;
  }
}

// Standalone function exports for direct method imports
export const uploadDocument = DocumentStorageService.uploadDocument;
export const getDownloadURL = DocumentStorageService.getDownloadURL;
export const getMetadata = DocumentStorageService.getMetadata;
export const deleteDocument = DocumentStorageService.deleteDocument;
export const documentExists = DocumentStorageService.documentExists;
export const saveDocumentMetadata = DocumentStorageService.saveDocumentMetadata;
export const validateStoredDocument = DocumentStorageService.validateStoredDocument;
export const getOrEnsurePrescriptionPdf = DocumentStorageService.getOrEnsurePrescriptionPdf;
export const getOrEnsureInvoicePdf = DocumentStorageService.getOrEnsureInvoicePdf;
export const getPrescriptionPdf = DocumentStorageService.getPrescriptionPdf;
export const getInvoicePdf = DocumentStorageService.getInvoicePdf;
