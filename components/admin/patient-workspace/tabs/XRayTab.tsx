"use client";

import React, { useState } from "react";
import {
  FileImage,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  Plus,
  X,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { Patient } from "../../../../lib/types";
import { DocumentStorageService } from "../../../../lib/services/documentStorageService";

export interface XRayRecord {
  id: string;
  title: string;
  category: "bitewing" | "iopa" | "opg" | "cbct" | "photos";
  categoryLabel: string;
  date: string;
  toothNumber?: number;
  area?: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  previewUrl?: string;
  storagePath?: string;
  doctorName?: string;
  notes?: string;
}

interface XRayTabProps {
  patient: Patient;
}

export const XRayTab: React.FC<XRayTabProps> = ({ patient }) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedXRay, setSelectedXRay] = useState<XRayRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Initial Diagnostic X-Rays / Imaging state for this patient
  const [xrayRecords, setXrayRecords] = useState<XRayRecord[]>([
    {
      id: "xray-1",
      title: "Bitewing Diagnostic Scan (Right Molar)",
      category: "bitewing",
      categoryLabel: "Bitewing",
      date: "2026-07-28",
      toothNumber: 46,
      area: "Mandibular Right Quadrant",
      fileName: "bitewing_molar_46.png",
      fileSize: "2.8 MB",
      mimeType: "image/png",
      previewUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80",
      doctorName: "Dr. Julian Moore",
      notes: "Interproximal enamel caries evaluated on distal surface of #46.",
    },
    {
      id: "xray-2",
      title: "Periapical (IOPA) Apex Scan #21",
      category: "iopa",
      categoryLabel: "Periapical (IOPA)",
      date: "2026-07-14",
      toothNumber: 21,
      area: "Maxillary Anterior",
      fileName: "iopa_apex_21.png",
      fileSize: "1.9 MB",
      mimeType: "image/png",
      previewUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80",
      doctorName: "Dr. Julian Moore",
      notes: "Post-endodontic obturation check. Apex cleanly sealed.",
    },
    {
      id: "xray-3",
      title: "Full Mouth Panoramic (OPG)",
      category: "opg",
      categoryLabel: "Panoramic (OPG)",
      date: "2026-06-10",
      area: "Full Dentition",
      fileName: "panoramic_opg_full.jpg",
      fileSize: "6.4 MB",
      mimeType: "image/jpeg",
      previewUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80",
      doctorName: "Dr. Julian Moore",
      notes: "Initial comprehensive baseline survey. Wisdom teeth impaction evaluation.",
    },
  ]);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "bitewing" as "bitewing" | "iopa" | "opg" | "cbct" | "photos",
    toothNumber: "",
    area: "",
    notes: "",
    file: null as File | null,
  });

  const showToast = (msg: string) => {
    setUploadToast(msg);
    setTimeout(() => setUploadToast(null), 3000);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      showToast("Please provide a title for the X-Ray.");
      return;
    }

    setIsUploading(true);
    try {
      let previewUrl = "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80";
      let fileSizeStr = "2.4 MB";
      let fileNameStr = `xray_${Date.now()}.png`;

      if (uploadForm.file) {
        fileSizeStr = `${(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB`;
        fileNameStr = uploadForm.file.name;
        // Create local object URL for preview
        previewUrl = URL.createObjectURL(uploadForm.file);
      }

      const categoryLabels: Record<string, string> = {
        bitewing: "Bitewing",
        iopa: "Periapical (IOPA)",
        opg: "Panoramic (OPG)",
        cbct: "CBCT / 3D",
        photos: "Intraoral Photo",
      };

      const newRecord: XRayRecord = {
        id: `xray-${Date.now()}`,
        title: uploadForm.title,
        category: uploadForm.category,
        categoryLabel: categoryLabels[uploadForm.category] || "X-Ray",
        date: new Date().toISOString().split("T")[0],
        toothNumber: uploadForm.toothNumber ? Number(uploadForm.toothNumber) : undefined,
        area: uploadForm.area || (uploadForm.toothNumber ? `Tooth #${uploadForm.toothNumber}` : "General"),
        fileName: fileNameStr,
        fileSize: fileSizeStr,
        mimeType: uploadForm.file?.type || "image/png",
        previewUrl,
        doctorName: "Dr. Julian Moore",
        notes: uploadForm.notes,
      };

      setXrayRecords((prev) => [newRecord, ...prev]);
      showToast("X-Ray diagnostic scan uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadForm({
        title: "",
        category: "bitewing",
        toothNumber: "",
        area: "",
        notes: "",
        file: null,
      });
    } catch (err: any) {
      showToast("Failed to upload X-Ray: " + (err?.message || "Storage error"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this X-Ray record?")) {
      setXrayRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedXRay?.id === id) {
        setSelectedXRay(null);
      }
      showToast("X-Ray record removed.");
    }
  };

  const filteredRecords = xrayRecords.filter(
    (r) => activeCategory === "all" || r.category === activeCategory
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Header & Actions ── */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Diagnostic X-Ray & Imaging Vault
            </h2>
            <p className="text-xs text-on-surface-variant">
              Centralized repository for intraoral bitewings, IOPA periapical scans, panoramic OPGs, and diagnostic photographs.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload X-Ray</span>
        </button>
      </div>

      {/* ── 2. Category Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Scans ({xrayRecords.length})
        </button>

        <button
          onClick={() => setActiveCategory("bitewing")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "bitewing"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Bitewings ({xrayRecords.filter((r) => r.category === "bitewing").length})
        </button>

        <button
          onClick={() => setActiveCategory("iopa")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "iopa"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Periapical (IOPA) ({xrayRecords.filter((r) => r.category === "iopa").length})
        </button>

        <button
          onClick={() => setActiveCategory("opg")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "opg"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Panoramic (OPG) ({xrayRecords.filter((r) => r.category === "opg").length})
        </button>

        <button
          onClick={() => setActiveCategory("cbct")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "cbct"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          CBCT / 3D ({xrayRecords.filter((r) => r.category === "cbct").length})
        </button>

        <button
          onClick={() => setActiveCategory("photos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "photos"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Photos ({xrayRecords.filter((r) => r.category === "photos").length})
        </button>
      </div>

      {/* ── 3. Diagnostic Scans Grid ── */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant/15 p-12 text-center space-y-3">
          <FileImage className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No X-Ray records in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload diagnostic bitewings, IOPAs, or panoramic OPGs to view them here.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Upload X-Ray
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((xray) => (
            <div
              key={xray.id}
              className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Preview Thumbnail */}
                <div
                  onClick={() => setSelectedXRay(xray)}
                  className="relative h-48 bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center group-hover:opacity-95 transition-opacity"
                >
                  {xray.previewUrl ? (
                    <img
                      src={xray.previewUrl}
                      alt={xray.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter contrast-125"
                    />
                  ) : (
                    <FileImage className="w-12 h-12 text-slate-600" />
                  )}

                  {/* Category Pill on Image */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white border border-white/20">
                      {xray.categoryLabel}
                    </span>
                    {xray.toothNumber && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/90 text-white">
                        Tooth #{xray.toothNumber}
                      </span>
                    )}
                  </div>

                  {/* Overlay Click Hint */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" /> Click to Expand Scan
                  </div>
                </div>

                {/* Scan Info */}
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {xray.title}
                  </h4>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Area: <strong className="text-slate-700">{xray.area || "General"}</strong></span>
                      <span>{xray.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Doctor: <strong className="text-slate-700">{xray.doctorName || "Clinician"}</strong></span>
                      <span className="font-mono">{xray.fileSize}</span>
                    </div>
                  </div>

                  {xray.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic mt-2">
                      "{xray.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <button
                  onClick={() => setSelectedXRay(xray)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" /> View Lightbox
                </button>

                <div className="flex items-center gap-1">
                  <a
                    href={xray.previewUrl || "#"}
                    download={xray.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Download Scan File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteRecord(xray.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Scan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Fullscreen Lightbox Modal ── */}
      {selectedXRay && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            {/* Lightbox Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>{selectedXRay.title}</span>
                  <span className="text-xs bg-primary/30 text-primary px-2.5 py-0.5 rounded-full border border-primary/40 font-mono">
                    {selectedXRay.categoryLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Taken on {selectedXRay.date} • {selectedXRay.area || "Dental Arch"} • By {selectedXRay.doctorName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedXRay.previewUrl || "#"}
                  download={selectedXRay.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => setSelectedXRay(null)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black min-h-[400px]">
              {selectedXRay.previewUrl ? (
                <img
                  src={selectedXRay.previewUrl}
                  alt={selectedXRay.title}
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg filter contrast-125 brightness-105"
                />
              ) : (
                <div className="text-slate-500 text-center">
                  <FileImage className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Scan preview unavailable</p>
                </div>
              )}
            </div>

            {/* Lightbox Footer Notes */}
            {selectedXRay.notes && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs flex items-start gap-2">
                <strong className="text-slate-400 shrink-0">Diagnostic Notes:</strong>
                <span>{selectedXRay.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Upload New X-Ray Modal ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload Diagnostic X-Ray Scan
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
                <label className="block font-bold text-slate-700 mb-1">Scan Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bitewing Right Molar #46"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scan Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="bitewing">Bitewing</option>
                    <option value="iopa">Periapical (IOPA)</option>
                    <option value="opg">Panoramic (OPG)</option>
                    <option value="cbct">CBCT / 3D Scan</option>
                    <option value="photos">Intraoral Photo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tooth # (Optional)</label>
                  <input
                    type="number"
                    min="11"
                    max="85"
                    placeholder="e.g. 46"
                    value={uploadForm.toothNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, toothNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anatomical Area / Quadrant</label>
                <input
                  type="text"
                  placeholder="e.g. Mandibular Right Quadrant"
                  value={uploadForm.area}
                  onChange={(e) => setUploadForm({ ...uploadForm, area: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Diagnostic Findings & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Proximal caries detected, no periapical radiolucency."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scan Image File (PNG, JPG, DICOM)</label>
                <input
                  type="file"
                  accept="image/*,.dcm"
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
                  <span>Save Scan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadToast}</span>
        </div>
      )}
    </div>
  );
};
