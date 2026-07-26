import { jsPDF } from "jspdf";
import type { Prescription, Invoice, ClinicBasicInfo } from "../types";

/**
 * Server-Side PDF Generator for Prescriptions.
 * Generates an A4 Prescription Pad PDF buffer dynamically in memory.
 */
export function generatePrescriptionPdfBuffer(
  prescription: Prescription,
  clinicInfo?: ClinicBasicInfo
): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const clinicName = clinicInfo?.clinicName || "Sanjivani Dental Clinic";
  const doctorName = prescription.doctorName || clinicInfo?.doctorName || "Dr. Rajesh Sharma";
  const doctorQual = clinicInfo?.qualification || "BDS, MDS (Oral & Maxillofacial Surgery)";
  const doctorReg = clinicInfo?.registrationNumber || "MH-D-18492";
  const address = clinicInfo?.addressLine1
    ? `${clinicInfo.addressLine1}${clinicInfo.addressLine2 ? `, ${clinicInfo.addressLine2}` : ""}, ${clinicInfo.city}, ${clinicInfo.state}`
    : "Suite 402, Medical Enclave, M.G. Road, Pune";
  const phone = clinicInfo?.phone || "+91 98765 43210";

  // Top Accent Bar
  doc.setFillColor(15, 118, 110); // Teal accent
  doc.rect(0, 0, 210, 5, "F");

  // Header Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(clinicName, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(address, 14, 24);
  doc.text(`Ph: ${phone} | Email: ${clinicInfo?.email || "contact@sanjivanidentals.com"}`, 14, 29);

  // Doctor Info Right Aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(doctorName, 196, 18, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text(doctorQual, 196, 23, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reg. No: ${doctorReg}`, 196, 28, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);

  // Patient Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 20, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("PATIENT NAME", 18, 44);
  doc.text("AGE / PHONE", 75, 44);
  doc.text("DATE", 130, 44);
  doc.text("PRESCRIPTION NO.", 160, 44);

  const dateStr = new Date(
    prescription.createdAt?.seconds * 1000 || Date.now()
  ).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(prescription.patientName || "Patient", 18, 51);

  doc.setFont("helvetica", "normal");
  doc.text(`${prescription.patientAge ? `${prescription.patientAge} yrs` : "N/A"} • ${prescription.patientPhone || ""}`, 75, 51);
  doc.text(dateStr, 130, 51);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 118, 110);
  doc.text(prescription.prescriptionNumber || "DC-2026-001", 160, 51);

  // Clinical Diagnosis Box
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(204, 251, 241);
  doc.roundedRect(14, 62, 182, 10, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 118, 110);
  doc.text("CLINICAL DIAGNOSIS:", 18, 68);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(prescription.diagnosis || "General Consultation", 58, 68);

  // Medications Table (Rx)
  doc.setFont("times", "bolditalic");
  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110);
  doc.text("Rx", 14, 82);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("PRESCRIBED MEDICATIONS", 26, 80);

  let y = 88;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("#", 18, y + 5);
  doc.text("Medicine & Dosage", 28, y + 5);
  doc.text("Frequency", 105, y + 5);
  doc.text("Timing", 145, y + 5);
  doc.text("Duration", 175, y + 5);

  y += 7;
  const meds = prescription.medications || [];

  if (meds.length === 0) {
    y += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("No medications prescribed.", 18, y);
    y += 10;
  } else {
    meds.forEach((med, idx) => {
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}`, 18, y);
      doc.text(med.medicine || "—", 28, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      if (med.dosage) {
        doc.text(`(${med.dosage})`, 28, y + 4);
      }

      doc.setTextColor(15, 23, 42);
      doc.text(med.frequency || "—", 105, y);
      doc.text(med.timing || "—", 145, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 110);
      doc.text(med.duration || "—", 175, y);

      y += med.dosage ? 6 : 4;
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y, 196, y);
    });
  }

  // Advice Section
  y += 10;
  if (prescription.advice || prescription.dietInstructions || prescription.oralHygieneInstructions || prescription.additionalInstructions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("ADVICE & SPECIAL PRECAUTIONS", 14, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    if (prescription.advice) {
      doc.text(`• ${prescription.advice}`, 14, (y += 5));
    }
    if (prescription.dietInstructions) {
      doc.text(`• Diet: ${prescription.dietInstructions}`, 14, (y += 5));
    }
    if (prescription.oralHygieneInstructions) {
      doc.text(`• Oral Hygiene: ${prescription.oralHygieneInstructions}`, 14, (y += 5));
    }
    if (prescription.additionalInstructions) {
      doc.text(`• Note: ${prescription.additionalInstructions}`, 14, (y += 5));
    }
    y += 6;
  }

  // Follow-up Banner
  if (prescription.followUpDate) {
    y += 4;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(219, 234, 254);
    doc.roundedRect(14, y, 182, 8, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(29, 78, 216);
    doc.text(
      `NEXT FOLLOW-UP VISIT: ${prescription.followUpDate} ${prescription.followUpReason ? `(${prescription.followUpReason})` : ""}`,
      18,
      y + 5.5
    );
    y += 12;
  }

  // Footer & Signature (Pinned to bottom of A4)
  const footerY = 265;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    clinicInfo?.prescriptionFooterText || "Take medicines strictly as prescribed. For assistance call clinic helpline.",
    14,
    footerY + 6
  );
  doc.text(`Printed: ${dateStr} • System Generated Digital Prescription`, 14, footerY + 11);

  // Doctor Signature Line Right
  doc.setDrawColor(148, 163, 184);
  doc.line(145, footerY + 12, 196, footerY + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(doctorName, 196, footerY + 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Authorized Doctor Signature", 196, footerY + 20, { align: "right" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

/**
 * Server-Side PDF Generator for Invoices.
 * Generates an A4 Tax Invoice PDF buffer dynamically in memory.
 */
export function generateInvoicePdfBuffer(
  invoice: Invoice,
  clinicInfo?: ClinicBasicInfo
): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const clinicName = clinicInfo?.clinicName || "Sanjivani Dental Clinic";
  const address = clinicInfo?.addressLine1
    ? `${clinicInfo.addressLine1}${clinicInfo.addressLine2 ? `, ${clinicInfo.addressLine2}` : ""}, ${clinicInfo.city}, ${clinicInfo.state}`
    : "Suite 402, Medical Enclave, M.G. Road, Pune";
  const phone = clinicInfo?.phone || "+91 98765 43210";
  const email = clinicInfo?.email || "contact@sanjivanidentals.com";

  // Top Accent Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 5, "F");

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(clinicName, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(address, 14, 24);
  doc.text(`Ph: ${phone} | Email: ${email}`, 14, 29);

  // Invoice Title Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110);
  doc.text("TAX INVOICE", 196, 18, { align: "right" });

  const invNo = `#${(invoice.id || "INV-001").slice(0, 8).toUpperCase()}`;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invNo, 196, 24, { align: "right" });

  const invDate = invoice.invoiceDate || new Date().toISOString().split("T")[0];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${invDate}`, 196, 29, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 34, 196, 34);

  // Patient Info Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 16, 2, 2, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("BILLED TO:", 18, 44);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.patientName || "Patient", 18, 50);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("STATUS:", 145, 44);

  const status = invoice.paymentStatus || "UNPAID";
  doc.setFontSize(9);
  if (status.toUpperCase() === "PAID") {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(245, 158, 11);
  }
  doc.text(status.toUpperCase(), 145, 50);

  // Items Table Header
  let y = 60;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("#", 18, y + 5);
  doc.text("Treatment / Service", 28, y + 5);
  doc.text("Amount", 175, y + 5, { align: "right" });

  y += 7;
  const treatments = invoice.treatments || ["Dental Consultation"];
  const totalAmount = invoice.total || invoice.amount || 0;
  const itemAmt = (totalAmount / Math.max(1, treatments.length)).toFixed(2);

  treatments.forEach((item, idx) => {
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}`, 18, y);
    doc.text(item, 28, y);
    doc.text(`INR ${itemAmt}`, 175, y, { align: "right" });

    y += 2;
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y, 196, y);
  });

  // Totals Breakdown Right Aligned
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Grand Total:", 145, y);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${totalAmount.toFixed(2)}`, 196, y, { align: "right" });

  const paidAmt = invoice.paidAmount || (status.toUpperCase() === "PAID" ? totalAmount : 0);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Amount Paid:", 145, y);
  doc.setTextColor(16, 185, 129);
  doc.text(`INR ${paidAmt.toFixed(2)}`, 196, y, { align: "right" });

  const balance = Math.max(0, totalAmount - paidAmt);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Balance Due:", 145, y);
  doc.setTextColor(balance > 0 ? 225 : 100, balance > 0 ? 29 : 116, balance > 0 ? 72 : 139);
  doc.text(`INR ${balance.toFixed(2)}`, 196, y, { align: "right" });

  // Footer
  const footerY = 265;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(clinicInfo?.invoiceFooterText || "Thank you for choosing Sanjivani Dentals!", 14, footerY + 6);
  doc.text(`Generated: ${invDate} • Official Tax Invoice`, 14, footerY + 11);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
