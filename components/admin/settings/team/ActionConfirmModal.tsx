"use client";

import React, { useState } from "react";
import { AlertTriangle, KeyRound, Trash2, UserX, UserCheck, X, Loader2 } from "lucide-react";

export type ConfirmActionType = "reset-password" | "deactivate" | "activate" | "delete";

interface ActionConfirmModalProps {
  isOpen: boolean;
  type: ConfirmActionType | null;
  targetName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ActionConfirmModal({
  isOpen,
  type,
  targetName,
  onClose,
  onConfirm,
}: ActionConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !type) return null;

  const getActionDetails = () => {
    switch (type) {
      case "reset-password":
        return {
          title: "Reset Password",
          description: `Are you sure you want to send a password reset link to ${targetName}? They will receive instructions via email.`,
          icon: <KeyRound className="w-5 h-5 text-amber-600" />,
          badgeColor: "bg-amber-100 text-amber-800",
          btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
          btnText: "Send Reset Link",
        };
      case "deactivate":
        return {
          title: "Deactivate Team Member",
          description: `Are you sure you want to deactivate ${targetName}? They will temporarily lose access to the system until reactivated.`,
          icon: <UserX className="w-5 h-5 text-amber-600" />,
          badgeColor: "bg-amber-100 text-amber-800",
          btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
          btnText: "Deactivate",
        };
      case "activate":
        return {
          title: "Activate Team Member",
          description: `Reactivate access for ${targetName}? They will regain full access to their role's permissions.`,
          icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
          badgeColor: "bg-emerald-100 text-emerald-800",
          btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
          btnText: "Activate",
        };
      case "delete":
        return {
          title: "Delete Member",
          description: `Permanently remove ${targetName}? This action cannot be undone and will strip all software permissions immediately.`,
          icon: <Trash2 className="w-5 h-5 text-red-600" />,
          badgeColor: "bg-red-100 text-red-800",
          btnColor: "bg-red-600 hover:bg-red-700 text-white",
          btnText: "Delete Permanently",
        };
    }
  };

  const details = getActionDetails();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${details.badgeColor}`}>
            {details.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-on-surface">{details.title}</h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              {details.description}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-semibold text-secondary hover:bg-surface-container-low transition-all cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${details.btnColor}`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {details.btnText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
