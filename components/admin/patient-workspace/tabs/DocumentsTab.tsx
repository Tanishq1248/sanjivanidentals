"use client";

import React, { useState } from "react";
import {
  FolderArchive,
  FileCheck,
  ShieldCheck,
  FileSpreadsheet,
  UploadCloud,
  Plus,
  FileText,
  Download,
  Eye,
  Trash2,
  Receipt,
  Pill,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  Phone,
} from "lucide-react";
import type { Patient, PatientEncounter, Invoice } from "../../../../lib/types";
import { DocumentStorageService } from "../../../../lib/services/documentStorageService";
import { sendWhatsAppMessage } from "../../../../lib/services/whatsappService";

interface DocumentsTabProps {
  patient: Patient;
  encounters?: PatientEncounter[];
  invoices?: Invoice[];
  onOpenPrescriptionModal?: (encounter: PatientEncounter) => void;
}

export interface PatientDocRecord {
  id: string;
  title: string;
  category: "prescriptions" | "invoices" | "consents" | "reports" | "general";
  categoryLabel: string;
  fileName: string;
  fileSize: string;
  date: string;
  mimeType: string;
  downloadUrl?: string;
  storagePath?: string;
  sourceEncounterId?: string;
  prescriptionId?: string;
  invoiceId?: string;
}

function formatVisitDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  patient,
  encounters = [],
  invoices = [],
  onOpenPrescriptionModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  // Manual/Custom uploaded documents state
  const [uploadedDocs, setUploadedDocs] = useState<PatientDocRecord[]>([
    {
      id: "doc-consent-1",
      title: "Informed Surgical Consent Agreement",
      category: "consents",
      categoryLabel: "Consent Form",
      fileName: "surgical_consent_signed.pdf",
      fileSize: "1.2 MB",
      date: "2026-07-10",
      mimeType: "application/pdf",
    },
    {
      id: "doc-report-1",
      title: "Histopathology Biopsy Report",
      category: "reports",
      categoryLabel: "Lab Report",
      fileName: "biopsy_report_oral_lab.pdf",
      fileSize: "850 KB",
      date: "2026-06-22",
      mimeType: "application/pdf",
    },
  ]);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "consents" as "consents" | "reports" | "general",
    file: null as File | null,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Compile full list of clinical documents from Encounters (Prescriptions) + Invoices + Uploads
  const compiledDocuments: PatientDocRecord[] = [];

  // 1. Prescriptions from encounters
  encounters.forEach((enc) => {
    if (enc.prescriptionId) {
      compiledDocuments.push({
        id: `rx-${enc.prescriptionId}`,
        title: `Clinical Prescription (#${enc.prescriptionId.slice(0, 8).toUpperCase()})`,
        category: "prescriptions",
        categoryLabel: "Prescription",
        fileName: `prescription_${enc.prescriptionId}.pdf`,
        fileSize: "PDF Document",
        date: enc.visitDate,
        mimeType: "application/pdf",
        prescriptionId: enc.prescriptionId,
        sourceEncounterId: enc.id,
      });
    }
  });

  // 2. Invoices
  invoices.forEach((inv) => {
    compiledDocuments.push({
      id: `inv-${inv.id}`,
      title: `Invoice #${inv.id.slice(0, 8).toUpperCase()}`,
      category: "invoices",
      categoryLabel: "Invoice Receipt",
      fileName: `invoice_${inv.id}.pdf`,
      fileSize: "PDF Document",
      date: inv.invoiceDate,
      mimeType: "application/pdf",
      invoiceId: inv.id,
    });
  });

  // 3. User Uploads
  uploadedDocs.forEach((doc) => compiledDocuments.push(doc));

  // Sort newest first
  compiledDocuments.sort((a, b) => b.date.localeCompare(a.date));

  const filteredDocuments = compiledDocuments.filter(
    (d) => activeCategory === "all" || d.category === activeCategory
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      showToast("Please provide a title for the document.");
      return;
    }

    setIsUploading(true);
    try {
      let fileSizeStr = "1.5 MB";
      let fileNameStr = `doc_${Date.now()}.pdf`;

      if (uploadForm.file) {
        fileSizeStr = `${(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB`;
        fileNameStr = uploadForm.file.name;
      }

      const categoryLabels: Record<string, string> = {
        consents: "Consent Form",
        reports: "Lab Report",
        general: "General Document",
      };

      const newDoc: PatientDocRecord = {
        id: `upload-${Date.now()}`,
        title: uploadForm.title,
        category: uploadForm.category,
        categoryLabel: categoryLabels[uploadForm.category] || "Document",
        fileName: fileNameStr,
        fileSize: fileSizeStr,
        date: new Date().toISOString().split("T")[0],
        mimeType: uploadForm.file?.type || "application/pdf",
      };

      setUploadedDocs((prev) => [newDoc, ...prev]);
      showToast("Document saved to patient records!");
      setIsUploadModalOpen(false);
      setUploadForm({ title: "", category: "consents", file: null });
    } catch (err: any) {
      showToast("Upload error: " + (err?.message || "Storage error"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDoc = async (docItem: PatientDocRecord) => {
    setLoadingDocId(docItem.id);
    try {
      if (docItem.prescriptionId) {
        const matchingEnc = encounters.find((e) => e.prescriptionId === docItem.prescriptionId);
        if (matchingEnc && onOpenPrescriptionModal) {
          onOpenPrescriptionModal(matchingEnc);
        } else {
          showToast("Opening prescription...");
        }
      } else if (docItem.invoiceId) {
        const inv = invoices.find((i) => i.id === docItem.invoiceId);
        if (inv) {
          const res = await DocumentStorageService.getOrEnsureInvoicePdf(inv.id, inv);
          if (res.downloadUrl) {
            window.open(res.downloadUrl, "_blank");
          }
        }
      } else {
        showToast("Opening document: " + docItem.title);
      }
    } catch (err: any) {
      showToast("Document retrieval failed: " + (err?.message || "Storage error"));
    } finally {
      setLoadingDocId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Header Toolbar ── */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Patient Clinical Documents & Records Vault
            </h2>
            <p className="text-xs text-on-surface-variant">
              Central repository for generated prescriptions, invoice receipts, signed consent agreements, and diagnostic lab reports.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* ── 2. Category Filters ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Documents ({compiledDocuments.length})
        </button>

        <button
          onClick={() => setActiveCategory("prescriptions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "prescriptions"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Prescriptions ({compiledDocuments.filter((d) => d.category === "prescriptions").length})
        </button>

        <button
          onClick={() => setActiveCategory("invoices")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "invoices"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Invoices & Receipts ({compiledDocuments.filter((d) => d.category === "invoices").length})
        </button>

        <button
          onClick={() => setActiveCategory("consents")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "consents"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Consent Forms ({compiledDocuments.filter((d) => d.category === "consents").length})
        </button>

        <button
          onClick={() => setActiveCategory("reports")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "reports"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Lab Reports ({compiledDocuments.filter((d) => d.category === "reports").length})
        </button>
      </div>

      {/* ── 3. Documents Grid & List ── */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-12 text-center space-y-3">
          <FolderArchive className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No documents found in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Prescriptions logged from visits and generated invoices will automatically appear here.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((docItem) => (
            <div
              key={docItem.id}
              className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-xl ${
                      docItem.category === "prescriptions"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : docItem.category === "invoices"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : docItem.category === "consents"
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {docItem.category === "prescriptions" ? (
                      <Pill className="w-5 h-5" />
                    ) : docItem.category === "invoices" ? (
                      <Receipt className="w-5 h-5" />
                    ) : docItem.category === "consents" ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {docItem.categoryLabel}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {docItem.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {docItem.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Date: {formatVisitDate(docItem.date)} • {docItem.fileSize}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={loadingDocId === docItem.id}
                  onClick={() => handleDownloadDoc(docItem)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {loadingDocId === docItem.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>Open / View</span>
                </button>

                {docItem.category === "prescriptions" && (
                  <button
                    type="button"
                    onClick={() => {
                      const digits = patient.phone.replace(/\D/g, "");
                      const msg = `Hello ${patient.name}! Your medical prescription from Sanjivani Dentals is ready. Please view your prescription in our patient portal.`;
                      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-xs font-bold border border-green-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    WhatsApp Rx
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Upload Document Modal ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload Clinical Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Informed Surgical Consent Agreement"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                >
                  <option value="consents">Consent Form / Legal Agreement</option>
                  <option value="reports">Diagnostic Lab Report</option>
                  <option value="general">General / Medical Document</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">File Document (PDF, Word, PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadForm({ ...uploadForm, file: e.target.files[0] });
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>Save Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
