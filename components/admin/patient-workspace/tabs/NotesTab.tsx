"use client";

import React, { useState } from "react";
import { FileText, Edit2, Plus, Clock, Save, Loader2 } from "lucide-react";
import type { PatientMedicalProfile, PatientEncounter } from "../../../../lib/types";

interface NotesTabProps {
  medicalProfile?: PatientMedicalProfile | null;
  encounters: PatientEncounter[];
  onOpenEditProfile: () => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  medicalProfile,
  encounters,
  onOpenEditProfile,
}) => {
  const [soapNotes, setSoapNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">Clinical & SOAP Notes Workspace</h2>
            <p className="text-xs text-on-surface-variant">
              Manage clinical instructions, subjective complaints, objective observations, and follow-up plans.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit Clinical Notes
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: General Clinical Notes & Follow-up Notes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* General Clinical Notes Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <FileText className="w-4.5 h-4.5 text-primary" />
                General Clinical Instructions & Notes
              </h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[120px]">
              {medicalProfile?.clinicalNotes ? (
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {medicalProfile.clinicalNotes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No clinical notes added yet.</p>
              )}
            </div>
          </div>

          {/* Follow-up Notes per Encounter */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <Clock className="w-4.5 h-4.5 text-primary" />
                Encounter Visit Notes Timeline ({encounters.length})
              </h3>
            </div>

            {encounters.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-xl">
                No encounter visit notes logged.
              </p>
            ) : (
              <div className="space-y-3">
                {encounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-slate-600 font-bold border-b border-slate-200 pb-2">
                      <span>📅 Visit: {enc.visitDate}</span>
                      <span>👨‍⚕️ {enc.doctorName}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      Chief Complaint: {enc.chiefComplaint}
                    </div>
                    {enc.notes && (
                      <div className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/80">
                        "{enc.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interactive SOAP Notes Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-outline-variant/15 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
              <FileText className="w-4.5 h-4.5 text-emerald-600" />
              SOAP Note Tool
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              Standardized Format
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Subjective (S)</label>
              <textarea
                rows={2}
                value={soapNotes.subjective}
                onChange={(e) => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
                placeholder="Patient's self-reported symptoms & chief complaint..."
                className="w-full p-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Objective (O)</label>
              <textarea
                rows={2}
                value={soapNotes.objective}
                onChange={(e) => setSoapNotes({ ...soapNotes, objective: e.target.value })}
                placeholder="Clinical findings, vital signs, intraoral examination..."
                className="w-full p-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Assessment (A)</label>
              <textarea
                rows={2}
                value={soapNotes.assessment}
                onChange={(e) => setSoapNotes({ ...soapNotes, assessment: e.target.value })}
                placeholder="Diagnosis, differential diagnoses, prognosis..."
                className="w-full p-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Plan (P)</label>
              <textarea
                rows={2}
                value={soapNotes.plan}
                onChange={(e) => setSoapNotes({ ...soapNotes, plan: e.target.value })}
                placeholder="Treatment plan, prescriptions, follow-up schedule..."
                className="w-full p-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
