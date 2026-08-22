import React, { useState } from "react";
import { X, UserPlus, Mail, Phone, User, Shield, Loader2, AlertCircle } from "lucide-react";
import type { RolePermission, TeamMemberFormData, TeamMember } from "../../../../lib/types";
import { canAddDoctor, getMaximumDoctors } from "../../../../lib/services/featureAccessService";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (formData: TeamMemberFormData) => Promise<void>;
  roles: RolePermission[];
  clinicInfo?: any;
  members?: TeamMember[];
}

export function InviteMemberModal({ isOpen, onClose, onInvite, roles, clinicInfo, members = [] }: InviteMemberModalProps) {
  const doctorCount = members.filter((m) => m.role?.toLowerCase() === "doctor" || m.roleId === "role-doctor").length;
  const maxDoctors = getMaximumDoctors(clinicInfo);
  const isDoctorLimitReached = !canAddDoctor(doctorCount, clinicInfo);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Initialize role to Receptionist or Admin if Doctor limit is reached
  const [role, setRole] = useState(() => {
    if (isDoctorLimitReached) {
      const nonDoctor = roles.find((r) => r.name.toLowerCase() !== "doctor");
      return nonDoctor?.name || "Receptionist";
    }
    return roles[0]?.name || "Doctor";
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSelectedRoleDoctor = role.toLowerCase() === "doctor";
  const isSubmitDisabled = isSelectedRoleDoctor && isDoctorLimitReached;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (isSelectedRoleDoctor && isDoctorLimitReached) {
      setErrorMessage(`Doctor limit reached for Basic Plan (Max 2). Upgrade to Professional to add more doctors.`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const selectedRoleObj = roles.find((r) => r.name === role);
      await onInvite({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || "+91 98000 00000",
        role: role,
        roleId: selectedRoleObj?.id || "role-doctor",
        status: "Invited",
      });
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      console.error("Invite error:", err);
      setErrorMessage(err?.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">Invite Team Member</h3>
              <p className="text-xs text-on-surface-variant">Send an invitation email to staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Dr. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="priya.sharma@dentapure.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Assign Role *</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {roles.map((r) => {
                  const isDoc = r.name.toLowerCase() === "doctor";
                  const isBlocked = isDoc && isDoctorLimitReached;
                  return (
                    <option key={r.id} value={r.name} disabled={isBlocked}>
                      {r.name} ({r.permissionCount} permissions){isBlocked ? " — (Basic Plan Limit Reached: 2/2)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Limit Warning / Error Alert */}
          {((isSelectedRoleDoctor && isDoctorLimitReached) || errorMessage) && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {errorMessage || "Doctor limit reached for Basic Plan (Max 2). Upgrade to Professional to add more doctors."}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-semibold text-secondary hover:bg-surface-container-low transition-all cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitDisabled}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
