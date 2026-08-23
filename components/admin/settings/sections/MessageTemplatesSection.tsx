"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Send,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Receipt,
  Calendar,
  Sparkles,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, CACHE_POLICIES } from "../../../../lib/query/queryKeys";
import {
  getMessageTemplates,
  saveMessageTemplates,
  restoreDefaultTemplates,
  compileTemplate,
  DEFAULT_TEMPLATES,
} from "../../../../lib/services/messageTemplateService";
import { getClinicInfo } from "../../../../lib/services/clinicSettingsService";
import {
  getSubscription,
  canEditCustomTemplates,
  FeatureAccessService,
} from "../../../../lib/services/featureAccessService";
import type {
  MessageTemplate,
  MessageTemplatesDocument,
  MessageChannel,
  MessageTemplateType,
} from "../../../../lib/types";
import { UpgradeToProModal } from "../UpgradeToProModal";

const SAMPLE_VARIABLES = {
  patientName: "Ananya Sharma",
  doctorName: "Dr. Sanjivani Patil",
  clinicName: "DentaPure Dental Care",
  clinicPhone: "+91 98765 43210",
  appointmentDate: "28 July 2026",
  appointmentTime: "11:30 AM",
  invoiceNumber: "INV-2026-089",
  invoiceAmount: "1,500",
  prescriptionDate: "26 July 2026",
  followUpDate: "02 August 2026",
  mediaUrl: "https://dentapure.clinic/api/pdf/prescription?id=sample",
};

const AVAILABLE_VARIABLES = [
  { label: "Patient Name", tag: "{{patientName}}" },
  { label: "Doctor Name", tag: "{{doctorName}}" },
  { label: "Clinic Name", tag: "{{clinicName}}" },
  { label: "Clinic Phone", tag: "{{clinicPhone}}" },
  { label: "Appt Date", tag: "{{appointmentDate}}" },
  { label: "Appt Time", tag: "{{appointmentTime}}" },
  { label: "Invoice #", tag: "{{invoiceNumber}}" },
  { label: "Invoice Amount", tag: "{{invoiceAmount}}" },
  { label: "Prescription Date", tag: "{{prescriptionDate}}" },
  { label: "Follow-up Date", tag: "{{followUpDate}}" },
];

export default function MessageTemplatesSection() {
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [featureType, setFeatureType] = useState<MessageTemplateType>("prescription");
  const [templates, setTemplates] = useState<MessageTemplatesDocument>({ ...DEFAULT_TEMPLATES });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: clinicInfo } = useQuery({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const subscription = getSubscription(clinicInfo);
  const isBasicPlan = subscription.plan === "basic";
  const canEdit = canEditCustomTemplates(clinicInfo);

  const activeKey = `${featureType}_${channel}`;
  const currentTemplate: MessageTemplate = templates[activeKey] || DEFAULT_TEMPLATES[activeKey];

  // Fetch templates from Firestore on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await getMessageTemplates();
      setTemplates(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleFieldChange = (field: keyof MessageTemplate, value: string) => {
    if (!canEdit) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setTemplates((prev) => ({
      ...prev,
      [activeKey]: {
        ...currentTemplate,
        [field]: value,
      },
    }));
  };

  const insertVariable = (tag: string, field: "body" | "subject" = "body") => {
    if (!canEdit) {
      setIsUpgradeModalOpen(true);
      return;
    }
    const currentVal = currentTemplate[field] || "";
    handleFieldChange(field, `${currentVal} ${tag}`);
  };

  const handleSave = async () => {
    if (!canEdit) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (!currentTemplate.body.trim()) {
      setFeedbackMessage({ type: "error", text: "Template body cannot be empty." });
      return;
    }

    if (channel === "email" && !currentTemplate.subject?.trim()) {
      setFeedbackMessage({ type: "error", text: "Email subject line cannot be empty." });
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      const success = await saveMessageTemplates(templates, "Admin");
      setIsSaving(false);

      if (success) {
        setFeedbackMessage({ type: "success", text: "Message templates updated successfully!" });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        setFeedbackMessage({ type: "error", text: "Failed to save templates. Please try again." });
      }
    } catch (err: any) {
      setIsSaving(false);
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to save templates." });
    }
  };

  const handleRestoreDefault = async () => {
    if (!canEdit) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (confirm(`Reset ${currentTemplate.name} to its default template?`)) {
      setIsSaving(true);
      const updated = await restoreDefaultTemplates(activeKey, "Admin");
      setTemplates(updated);
      setIsSaving(false);
      setFeedbackMessage({ type: "success", text: "Restored template to default settings." });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Preview compiled text
  const compiledBody = useMemo(() => {
    return compileTemplate(currentTemplate?.body || "", SAMPLE_VARIABLES);
  }, [currentTemplate?.body]);

  const compiledSubject = useMemo(() => {
    return compileTemplate(currentTemplate?.subject || "", SAMPLE_VARIABLES);
  }, [currentTemplate?.subject]);

  const compiledSignature = useMemo(() => {
    return compileTemplate(currentTemplate?.signature || "", SAMPLE_VARIABLES);
  }, [currentTemplate?.signature]);

  const compiledFooter = useMemo(() => {
    return compileTemplate(currentTemplate?.footer || "", SAMPLE_VARIABLES);
  }, [currentTemplate?.footer]);

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 font-sans">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading message templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Section Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              Communication
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isBasicPlan
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300"
              }`}
            >
              {isBasicPlan ? "Basic Plan (Read-Only Defaults)" : "Professional Plan (Custom Editor)"}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Message Template Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Outgoing WhatsApp and Email message templates for prescriptions, invoices, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={handleRestoreDefault}
              disabled={isSaving}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default
            </button>
          )}

          {canEdit ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Templates
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock Custom Editor</span>
            </button>
          )}
        </div>
      </div>

      {/* Basic Plan Read-Only Banner */}
      {!canEdit && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                🔒 Read-Only Templates Mode (Basic Plan)
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Standard system message templates are currently active. Upgrade to the <strong>Professional Plan</strong> to edit template wording, customize branding &amp; signatures, and insert dynamic variables.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-end sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          {feedbackMessage.text}
        </motion.div>
      )}

      {/* Channel Switcher Tabs (WhatsApp vs Email) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setChannel("whatsapp")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            channel === "whatsapp"
              ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Send className="w-4 h-4" /> WhatsApp Templates
        </button>

        <button
          type="button"
          onClick={() => setChannel("email")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            channel === "email"
              ? "bg-sky-600 text-white border-sky-700 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Mail className="w-4 h-4" /> Email Templates
        </button>
      </div>

      {/* Feature Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFeatureType("prescription")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            featureType === "prescription"
              ? "bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-600" /> Prescription
        </button>

        <button
          type="button"
          onClick={() => setFeatureType("invoice")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            featureType === "invoice"
              ? "bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-sky-600" /> Invoice
        </button>

        <button
          type="button"
          onClick={() => setFeatureType("appointment_reminder")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            featureType === "appointment_reminder"
              ? "bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-600" /> Appointment Reminder
        </button>
      </div>

      {/* Two Column Layout: Editor (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Configure {channel === "whatsapp" ? "WhatsApp" : "Email"} Template</span>
              {!canEdit && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {currentTemplate.name}
            </span>
          </div>

          {/* Variables Insertion Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Dynamic Variable Placeholders
              </label>
              {!canEdit && (
                <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> PRO Feature
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                    canEdit
                      ? "bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border-slate-200 text-slate-700 cursor-pointer"
                      : "bg-slate-50 text-slate-400 border-slate-200/80 cursor-pointer hover:border-amber-300"
                  }`}
                  title={!canEdit ? "Upgrade to Professional to insert dynamic variables" : undefined}
                >
                  {!canEdit ? "🔒 " : "+ "} {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Email Subject Input */}
          {channel === "email" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Email Subject Line</label>
              <input
                type="text"
                disabled={!canEdit}
                value={currentTemplate.subject || ""}
                onChange={(e) => handleFieldChange("subject", e.target.value)}
                placeholder="Subject line with {{clinicName}}..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${
                  canEdit
                    ? "bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                    : "bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                }`}
              />
            </div>
          )}

          {/* Message Body Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">Message Body Content</label>
              {!canEdit && (
                <span className="text-[10px] text-slate-400 font-semibold italic">
                  Read-only view
                </span>
              )}
            </div>
            <textarea
              rows={channel === "whatsapp" ? 10 : 8}
              readOnly={!canEdit}
              value={currentTemplate.body || ""}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              placeholder="Write message content using placeholders..."
              className={`w-full p-3.5 rounded-xl text-xs font-mono font-medium outline-none leading-relaxed transition-all ${
                canEdit
                  ? "bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                  : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed select-text"
              }`}
            />
          </div>

          {/* Email Signature & Footer Inputs */}
          {channel === "email" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Email Signature</label>
                <textarea
                  rows={3}
                  readOnly={!canEdit}
                  value={currentTemplate.signature || ""}
                  onChange={(e) => handleFieldChange("signature", e.target.value)}
                  placeholder="Regards, Clinic Team..."
                  className={`w-full p-3 rounded-xl text-xs font-medium outline-none transition-all ${
                    canEdit
                      ? "bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                      : "bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Email Footer Note</label>
                <textarea
                  rows={3}
                  readOnly={!canEdit}
                  value={currentTemplate.footer || ""}
                  onChange={(e) => handleFieldChange("footer", e.target.value)}
                  placeholder="Confidentiality note..."
                  className={`w-full p-3 rounded-xl text-xs font-medium outline-none transition-all ${
                    canEdit
                      ? "bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                      : "bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              Live Substituted Preview
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Sample Patient View</span>
          </div>

          {channel === "whatsapp" ? (
            /* WhatsApp Mock Message Bubble */
            <div className="p-4 bg-[#efeae2] rounded-2xl border border-slate-200/80 space-y-3 min-h-[300px]">
              <div className="max-w-[90%] bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-2xs space-y-2 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                {compiledBody || <span className="text-slate-400 italic">Body content empty...</span>}
                <div className="text-[9px] text-slate-400 text-right font-semibold pt-1">
                  11:45 AM ✓✓
                </div>
              </div>
            </div>
          ) : (
            /* Email Mock Card */
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 min-h-[300px]">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">SUBJECT:</span>
                <p className="text-xs font-bold text-slate-900">{compiledSubject || "No subject"}</p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                <p>{compiledBody || <span className="text-slate-400 italic">Body content empty...</span>}</p>

                {compiledSignature && (
                  <div className="pt-3 border-t border-slate-100 font-medium text-slate-800">
                    {compiledSignature}
                  </div>
                )}

                {compiledFooter && (
                  <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100">
                    {compiledFooter}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        highlightFeature="Custom Message Templates & Dynamic Placeholders"
        currentPlan={subscription.plan}
      />
    </div>
  );
}
