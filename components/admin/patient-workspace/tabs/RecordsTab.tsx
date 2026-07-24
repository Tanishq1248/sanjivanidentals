"use client";

import React, { useState } from "react";
import {
  FolderArchive,
  FileImage,
  UploadCloud,
  FileSpreadsheet,
  Plus,
  Eye,
  Trash2,
  FileCheck,
} from "lucide-react";

export const RecordsTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<"xrays" | "photos" | "lab" | "all">("all");

  const dummyRecords = [
    {
      id: "rec-1",
      title: "Bitewing X-Ray (Molar #46)",
      category: "xrays",
      type: "PNG Image",
      date: "2026-07-15",
      size: "2.4 MB",
    },
    {
      id: "rec-2",
      title: "Pre-Treatment Intraoral Photo",
      category: "photos",
      type: "JPEG Image",
      date: "2026-07-10",
      size: "3.8 MB",
    },
    {
      id: "rec-3",
      title: "Crown Fabrication Lab Order Report",
      category: "lab",
      type: "PDF Document",
      date: "2026-07-01",
      size: "1.1 MB",
    },
  ];

  const filtered = dummyRecords.filter(
    (r) => activeCategory === "all" || r.category === activeCategory
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">Patient Clinical Records & Diagnostics</h2>
            <p className="text-xs text-on-surface-variant">
              Centralized vault for X-rays, intraoral photos, lab report slips, and media assets.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
          <UploadCloud className="w-4 h-4" /> Upload Record
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Records ({dummyRecords.length})
        </button>
        <button
          onClick={() => setActiveCategory("xrays")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === "xrays"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          X-Rays
        </button>
        <button
          onClick={() => setActiveCategory("photos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === "photos"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Clinical Photos
        </button>
        <button
          onClick={() => setActiveCategory("lab")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === "lab"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Lab Reports
        </button>
      </div>

      {/* Grid of Records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                <FileImage className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {rec.type}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{rec.title}</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Uploaded: {rec.date} • {rec.size}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
