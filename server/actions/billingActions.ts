"use server";

import { adminDb } from "../../lib/firebaseAdmin";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "../../lib/services/firestoreConfig";
import type { Invoice, ToothTreatmentEntry } from "../../lib/types";

export interface CreateInvoiceServerInput {
  patientId: string;
  patientName: string;
  encounterId?: string;
  encounterIds?: string[];
  visitDate?: string;
  rawLineItems: {
    id: string;
    treatmentName: string;
    toothNumber?: number;
    fee: number;
    status?: string;
  }[];
  discountPercentage?: number;
  clinicId?: string;
  paidAmount?: number;
  paymentMethod?: string;
}

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

const TAX_RATE = 0.18; // 18% GST

/**
 * Helper to ensure plain serializable JSON object across Server Action boundary.
 */
function serializeRecord<T>(obj: any): T {
  if (!obj || typeof obj !== "object") return obj;

  if (typeof obj.toDate === "function") {
    return obj.toDate().toISOString() as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeRecord) as any;
  }

  const plain: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (value && typeof value === "object" && "_seconds" in (value as any)) {
      plain[key] = new Date((value as any)._seconds * 1000).toISOString();
    } else if (value && typeof value === "object" && typeof (value as any).toDate === "function") {
      plain[key] = (value as any).toDate().toISOString();
    } else if (Array.isArray(value)) {
      plain[key] = value.map(serializeRecord);
    } else if (value && typeof value === "object") {
      plain[key] = serializeRecord(value);
    } else {
      plain[key] = value;
    }
  }
  return plain as T;
}

/**
 * Server Action: Calculate financial totals and atomically create an invoice.
 * Enforces price checks, integer precision arithmetic, and atomic Firestore updates.
 */
export async function calculateAndCreateInvoice(
  input: CreateInvoiceServerInput
): Promise<ServerActionResult<{ invoiceId: string; invoice: any }>> {
  try {
    const {
      patientId,
      patientName,
      encounterId = "",
      encounterIds = encounterId ? [encounterId] : [],
      visitDate = new Date().toISOString().split("T")[0],
      rawLineItems,
      discountPercentage = 0,
      clinicId = DEFAULT_CLINIC_ID,
      paidAmount: initialPaid = 0,
      paymentMethod = "None",
    } = input;

    if (!patientId || !rawLineItems || rawLineItems.length === 0) {
      return {
        success: false,
        error: "Missing required patient ID or line items.",
        code: "INVALID_ARGUMENT",
      };
    }

    // 1. Server-Side Financial Arithmetic (Sanitized & Precision Safe)
    const sanitizedItems = rawLineItems.map((item) => ({
      id: String(item.id || ""),
      treatmentName: String(item.treatmentName || "Dental Procedure").trim(),
      toothNumber: item.toothNumber !== undefined ? Number(item.toothNumber) : undefined,
      fee: Math.max(0, Math.round(Number(item.fee || 0))),
    }));

    const subtotal = sanitizedItems.reduce((acc, item) => acc + item.fee, 0);
    const validDiscountPct = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
    const discount = Math.round((subtotal * validDiscountPct) / 100);
    const tax = Math.round(subtotal * TAX_RATE);
    const grandTotal = Math.max(0, subtotal + tax - discount);

    const paidAmount = Math.min(grandTotal, Math.max(0, Math.round(Number(initialPaid) || 0)));
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: "PAID" | "PARTIAL" | "UNPAID" | "PENDING" = "UNPAID";
    if (paidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc();
    const invoiceId = invoiceRef.id;

    const invoicePayload = {
      id: invoiceId,
      patientId,
      patientName,
      encounterId: encounterId || "",
      encounterIds: encounterIds || [],
      visitDate: visitDate || todayStr,
      subtotal,
      tax,
      discount,
      total: grandTotal,
      amount: grandTotal,
      status: paymentStatus,
      paymentStatus,
      paymentMethod: paymentMethod || "None",
      invoiceDate: todayStr,
      dueDate: todayStr,
      treatments: sanitizedItems.map((t) => t.treatmentName),
      items: sanitizedItems,
      clinicId: clinicId || DEFAULT_CLINIC_ID,
      grossAmount: subtotal,
      netAmount: grandTotal,
      paidAmount,
      remainingAmount,
      emailSent: false,
      invoiceGenerated: true,
      paymentHistory: paidAmount > 0 ? [
        {
          id: `pay-${Date.now()}`,
          date: todayStr,
          amount: paidAmount,
          method: paymentMethod,
          recordedAt: new Date().toISOString() as any,
        }
      ] : [],
      installmentPlan: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 2. Atomic Firestore Transaction Execution
    const selectedItemIds = new Set(sanitizedItems.map((st) => st.id));
    const validEncounterIds = (encounterIds || []).filter(Boolean);

    await adminDb.runTransaction(async (transaction: Transaction) => {
      // Step A: Perform ALL READS first
      const encounterUpdates: Array<{
        ref: FirebaseFirestore.DocumentReference;
        toothTreatments: ToothTreatmentEntry[];
      }> = [];

      for (const encId of validEncounterIds) {
        const encRef = adminDb.collection(COLLECTIONS.PATIENT_ENCOUNTERS).doc(encId);
        const encSnap = await transaction.get(encRef);

        if (encSnap.exists) {
          const encData = encSnap.data();
          const toothTreatments = encData?.toothTreatments || [];

          let hasChanges = false;
          const updatedToothTreatments = toothTreatments.map((tt: ToothTreatmentEntry) => {
            if (selectedItemIds.has(tt.id) || selectedItemIds.has(`tt-${tt.id}`)) {
              hasChanges = true;
              return {
                ...tt,
                billingStatus: "Billed",
                invoiceId,
              };
            }
            return tt;
          });

          if (hasChanges) {
            encounterUpdates.push({
              ref: encRef,
              toothTreatments: updatedToothTreatments,
            });
          }
        }
      }

      // Step B: Perform ALL WRITES after all reads have finished
      transaction.set(invoiceRef, invoicePayload);

      for (const encUpdate of encounterUpdates) {
        transaction.update(encUpdate.ref, {
          toothTreatments: encUpdate.toothTreatments,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return {
      success: true,
      data: {
        invoiceId,
        invoice: {
          ...invoicePayload,
          createdAt: new Date().toISOString() as any,
          updatedAt: new Date().toISOString() as any,
        },
      },
    };
  } catch (error: any) {
    console.error("[billingActions] Error creating invoice on server:", error);
    return {
      success: false,
      error: error?.message || "Failed to create invoice on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Atomically record a payment on an invoice.
 */
export async function recordInvoicePayment(input: {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}): Promise<ServerActionResult<{ remainingAmount: number; paymentStatus: string }>> {
  try {
    const { invoiceId, amount, paymentMethod, notes = "" } = input;

    if (!invoiceId || !amount || amount <= 0) {
      return {
        success: false,
        error: "Valid invoice ID and positive payment amount are required.",
        code: "INVALID_ARGUMENT",
      };
    }

    const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(invoiceId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(invoiceRef);
      if (!docSnap.exists) {
        throw new Error("Invoice not found.");
      }

      const inv = docSnap.data() as Invoice;
      const total = inv.total ?? inv.amount ?? 0;
      const currentPaid = inv.paidAmount || 0;
      const newPaid = Math.min(total, currentPaid + amount);
      const newRemaining = Math.max(0, total - newPaid);

      let newStatus: "PAID" | "PARTIAL" | "UNPAID" | "PENDING" = inv.status;
      if (newRemaining <= 0) {
        newStatus = "PAID";
      } else if (newPaid > 0) {
        newStatus = "PARTIAL";
      }

      const paymentEntry = {
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        amount,
        method: paymentMethod || "Cash",
        notes,
        recordedAt: new Date().toISOString(),
      };

      const paymentHistory = [...(inv.paymentHistory || []), paymentEntry];

      transaction.update(invoiceRef, {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        paymentStatus: newStatus,
        paymentHistory,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        remainingAmount: newRemaining,
        paymentStatus: newStatus,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("[billingActions] Error recording payment:", error);
    return {
      success: false,
      error: error?.message || "Failed to record payment on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update invoice payment details.
 */
export async function updateInvoicePaymentDetailsAction(input: {
  invoiceId: string;
  paymentType: "PAID" | "PARTIAL" | "PENDING";
  paymentMethod: string;
  amountReceived: number;
  discountApplied?: number;
  dueDate?: string;
  notes?: string;
  installmentPlan?: any;
}): Promise<ServerActionResult<{ remainingAmount: number; paymentStatus: string; paidAmount: number }>> {
  try {
    const {
      invoiceId,
      paymentType,
      paymentMethod,
      amountReceived,
      discountApplied = 0,
      dueDate,
      notes = "",
      installmentPlan,
    } = input;

    const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(invoiceId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(invoiceRef);
      if (!snap.exists) {
        throw new Error("Invoice document not found.");
      }

      const inv = snap.data() as Invoice;
      const grandTotal = inv.total ?? inv.amount ?? 0;
      const initialPaid = inv.paidAmount || 0;

      let finalPaid = initialPaid;
      let finalRemaining = 0;
      let finalStatus: "PAID" | "PARTIAL" | "PENDING" | "UNPAID" = "UNPAID";
      let finalMethod = paymentMethod || inv.paymentMethod || "Cash";

      if (paymentType === "PAID") {
        finalPaid = grandTotal;
        finalRemaining = 0;
        finalStatus = "PAID";
      } else if (paymentType === "PENDING") {
        finalPaid = initialPaid;
        finalRemaining = Math.max(0, grandTotal - finalPaid);
        finalStatus = "PENDING";
      } else if (paymentType === "PARTIAL") {
        finalPaid = Math.min(grandTotal, Math.max(0, initialPaid + amountReceived));
        finalRemaining = Math.max(0, grandTotal - finalPaid);
        finalStatus = finalRemaining === 0 ? "PAID" : "PARTIAL";
      }

      const paymentHistory = [...(inv.paymentHistory || [])];
      if (paymentType !== "PENDING" && amountReceived > 0) {
        paymentHistory.push({
          id: `pay-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          amount: amountReceived,
          method: finalMethod,
          notes,
          recordedAt: new Date().toISOString() as any,
        });
      }

      const updateData: Record<string, any> = {
        paidAmount: finalPaid,
        remainingAmount: finalRemaining,
        status: finalStatus,
        paymentStatus: finalStatus,
        paymentMethod: finalMethod,
        paymentHistory,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (dueDate) {
        updateData.dueDate = dueDate;
      }
      if (installmentPlan !== undefined) {
        updateData.installmentPlan = installmentPlan;
      }

      transaction.update(invoiceRef, updateData);

      return {
        remainingAmount: finalRemaining,
        paymentStatus: finalStatus,
        paidAmount: finalPaid,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("[billingActions] Error updating invoice payment:", error);
    return {
      success: false,
      error: error?.message || "Failed to update invoice payment on server.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch all invoices.
 */
export async function getInvoicesAction(): Promise<ServerActionResult<Invoice[]>> {
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.INVOICES)
      .orderBy("createdAt", "desc")
      .get();

    const list = snap.docs.map((d) => serializeRecord({ id: d.id, ...d.data() }) as Invoice);
    return { success: true, data: list };
  } catch (error: any) {
    console.error("[billingActions] Error getting all invoices:", error);
    return {
      success: false,
      error: error?.message || "Failed to get invoices.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch invoices for a patient.
 */
export async function getInvoicesByPatientIdAction(
  patientId: string
): Promise<ServerActionResult<Invoice[]>> {
  try {
    if (!patientId) return { success: true, data: [] };
    const snap = await adminDb
      .collection(COLLECTIONS.INVOICES)
      .where("patientId", "==", patientId)
      .get();

    const list = snap.docs.map((d) => serializeRecord({ id: d.id, ...d.data() }) as Invoice);
    list.sort((a, b) => (b.invoiceDate || "").localeCompare(a.invoiceDate || ""));
    return { success: true, data: list };
  } catch (error: any) {
    console.error("[billingActions] Error getting patient invoices:", error);
    return {
      success: false,
      error: error?.message || "Failed to get patient invoices.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Fetch single invoice by ID.
 */
export async function getInvoiceByIdAction(
  id: string
): Promise<ServerActionResult<Invoice | null>> {
  try {
    if (!id) return { success: true, data: null };
    const snap = await adminDb.collection(COLLECTIONS.INVOICES).doc(id).get();
    if (!snap.exists) return { success: true, data: null };
    return {
      success: true,
      data: serializeRecord({ id: snap.id, ...snap.data() }) as Invoice,
    };
  } catch (error: any) {
    console.error("[billingActions] Error getting invoice by ID:", error);
    return {
      success: false,
      error: error?.message || "Failed to get invoice.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Add a new generic invoice via Admin SDK.
 */
export async function addInvoiceAction(
  data: Partial<Invoice>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const docRef = await adminDb.collection(COLLECTIONS.INVOICES).add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { id: docRef.id } };
  } catch (error: any) {
    console.error("[billingActions] Error adding invoice:", error);
    return {
      success: false,
      error: error?.message || "Failed to add invoice.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Update generic invoice fields.
 */
export async function updateInvoiceAction(
  id: string,
  data: Partial<Invoice>
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Invoice ID required", code: "INVALID_ARGUMENT" };
    }
    await adminDb.collection(COLLECTIONS.INVOICES).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[billingActions] Error updating invoice:", error);
    return {
      success: false,
      error: error?.message || "Failed to update invoice.",
      code: "SERVER_ERROR",
    };
  }
}

/**
 * Server Action: Delete an invoice.
 */
export async function deleteInvoiceAction(
  id: string
): Promise<ServerActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { success: false, error: "Invoice ID required", code: "INVALID_ARGUMENT" };
    }
    await adminDb.collection(COLLECTIONS.INVOICES).doc(id).delete();
    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("[billingActions] Error deleting invoice:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete invoice.",
      code: "SERVER_ERROR",
    };
  }
}
