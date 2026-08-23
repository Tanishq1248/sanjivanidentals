"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Armchair,
  Calendar,
  MessageSquare,
  Database,
  Users,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query/queryKeys";
import { updateSubscriptionPlan } from "../../../lib/services/settingsService";
import type { SubscriptionPlanType } from "../../../lib/types";

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightFeature?: string;
  currentPlan?: SubscriptionPlanType;
}

const PRO_FEATURES = [
  {
    icon: Armchair,
    title: "Up to 10 Treatment Chairs",
    basic: "2 Chairs max",
    pro: "Up to 10 Chairs with custom operatory labels",
  },
  {
    icon: Calendar,
    title: "Advanced Appointment Rules",
    basic: "Default slot intervals only",
    pro: "Chair-specific scheduling, automated buffer times & overbooking prevention",
  },
  {
    icon: MessageSquare,
    title: "Custom Message Templates",
    basic: "Read-only default templates",
    pro: "Dynamic template editor, variables & clinic branding",
  },
  {
    icon: ShieldCheck,
    title: "2FA & Detailed Audit Logs",
    basic: "Basic PIN/Password",
    pro: "Two-Factor Auth (2FA) & full staff activity trail with IP tracking",
  },
  {
    icon: Database,
    title: "1-Click Bulk Export & Backups",
    basic: "Single-patient PDF only",
    pro: "Bulk JSON/CSV clinic export & automated cloud snapshot schedule",
  },
  {
    icon: Users,
    title: "Expanded Team & Custom Roles",
    basic: "2 Doctors maximum",
    pro: "Up to 10 Doctors & customizable role permissions",
  },
];

export function UpgradeToProModal({
  isOpen,
  onClose,
  highlightFeature,
  currentPlan = "basic",
}: UpgradeToProModalProps) {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const planMutation = useMutation({
    mutationFn: (plan: SubscriptionPlanType) => updateSubscriptionPlan(plan),
    onSuccess: (_, newPlan) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.clinicInfo });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.clinicResources });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.appointmentSettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.securitySettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.teamMembers });
      queryClient.invalidateQueries({ queryKey: ["security"] });

      setSuccessMessage(
        newPlan === "professional"
          ? "🎉 Successfully upgraded to Professional Plan!"
          : "Switched back to Basic Plan for testing."
      );

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    },
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl border border-outline-variant/30 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative bg-linear-to-r from-emerald-700 via-teal-700 to-primary p-6 text-white shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border-none"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 fill-slate-950" /> Professional Plan
              </span>
              <span className="text-xs text-emerald-100 font-medium">Enterprise-Grade Clinic Controls</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Unlock the Full Power of DentaPure
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-lg leading-relaxed">
              {highlightFeature
                ? `You've reached a Basic Plan boundary on ${highlightFeature}. Upgrade to the Professional Plan to remove all limits.`
                : "Remove limits on treatment chairs, message customization, 2FA security, bulk clinic backup, and team sizes."}
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Features Comparison List */}
          <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Feature Comparison Matrix
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {PRO_FEATURES.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all flex items-start gap-3 group shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          PRO
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px]">
                        <span className="text-slate-500 line-through">Basic: {item.basic}</span>
                        <span className="hidden sm:inline text-slate-300">→</span>
                        <span className="font-semibold text-emerald-800">{item.pro}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Current Plan:{" "}
              <strong className="text-slate-900 uppercase">
                {currentPlan}
              </strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentPlan === "professional" ? (
                <button
                  type="button"
                  onClick={() => planMutation.mutate("basic")}
                  disabled={planMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {planMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Switch to Basic (Test Mode)"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    onClick={() => planMutation.mutate("professional")}
                    disabled={planMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-linear-to-r from-teal-700 to-[#1b5e20] text-white text-xs font-bold hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {planMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Activating Professional...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                        <span>Upgrade to Professional</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
