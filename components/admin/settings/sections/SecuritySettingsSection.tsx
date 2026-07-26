"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  KeyRound,
  Monitor,
  History,
  ScrollText,
  LogOut,
  Eye,
  EyeOff,
  ChevronDown,
  Search,
  Clock,
  UserCircle,
  Smartphone,
  BadgeCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  changePassword,
  validatePasswordStrength,
  getActiveSessions,
  revokeSession,
  getLoginHistory,
  getAuditLogs,
  getSecuritySettings,
  createOrUpdateSecuritySettings,
} from "../../../../lib/services/securityService";
import { useAuth } from "../../../../lib/context/AuthContext";
import type {
  LoginHistoryEntry,
  AuditLogEntry,
  SecuritySettingsData,
} from "../../../../lib/types";

/* ─── Helper: Format Firestore Timestamp ─── */
function formatTimestamp(ts: any): string {
  if (!ts) return "—";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ─── Status Badge Component ─── */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    failed: "bg-rose-100 text-rose-800",
    logged_out: "bg-gray-100 text-gray-600",
    session_expired: "bg-amber-100 text-amber-800",
  };
  const icons: Record<string, React.ReactNode> = {
    success: <BadgeCheck className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    logged_out: <LogOut className="w-3 h-3" />,
    session_expired: <AlertTriangle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {icons[status]} {status.replace("_", " ")}
    </span>
  );
}

/* ─── Filter Dropdown ─── */
function FilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-[11px] font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
    >
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="all">All Time</option>
    </select>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CARD 1: CHANGE PASSWORD
   ════════════════════════════════════════════════════════════════════════════ */
function ChangePasswordCard() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => changePassword(currentPwd, newPwd),
    onSuccess: (result) => {
      if (result.success) {
        setSuccess(true);
        setError("");
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(result.error || "Password change failed.");
      }
    },
    onError: () => setError("An unexpected error occurred."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPwd) return setError("Current password is required.");
    if (!newPwd) return setError("New password is required.");

    const strengthErr = validatePasswordStrength(newPwd);
    if (strengthErr) return setError(strengthErr);

    if (newPwd !== confirmPwd) return setError("Passwords do not match.");
    if (newPwd === currentPwd) return setError("New password must be different from current password.");

    mutation.mutate();
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-4.5 h-4.5 text-primary" />
        <h3 className="text-sm font-bold text-on-surface">Change Password</h3>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Password changed successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-on-surface mb-1">Current Password *</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all pr-9"
              placeholder="Enter current password"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-on-surface mb-1">New Password *</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all pr-9"
              placeholder="Min 8 chars, uppercase, lowercase, number"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-on-surface mb-1">Confirm New Password *</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
            placeholder="Re-enter new password"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Update Password
          </button>
          <button
            type="button"
            onClick={() => { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); setError(""); }}
            className="px-4 py-2 rounded-xl bg-gray-100 text-on-surface-variant text-[11px] font-bold hover:bg-gray-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CARD 2: ACTIVE SESSIONS
   ════════════════════════════════════════════════════════════════════════════ */
function ActiveSessionsCard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.security.activeSessions,
    queryFn: getActiveSessions,
    staleTime: 2 * 60_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (docId: string) => revokeSession(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.activeSessions });
    },
  });

  // Current session doc id from sessionStorage
  const currentSessionId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("activeLoginDocId") : null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4.5 h-4.5 text-primary" />
          <h3 className="text-sm font-bold text-on-surface">Active Sessions</h3>
        </div>
        <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 rounded-full">
          {sessions.length} active
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-on-surface-variant text-center py-6">No active sessions found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            return (
              <div key={session.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isCurrent ? "border-primary/30 bg-primary/5" : "border-outline-variant/20 hover:bg-surface-container-lowest"}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Smartphone className="w-4 h-4 text-on-surface-variant shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {session.deviceInfo}
                      {isCurrent && <span className="ml-1.5 text-[9px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">CURRENT</span>}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{session.userName} • {timeAgo(session.loginTime)}</p>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => session.id && revokeMutation.mutate(session.id)}
                    disabled={revokeMutation.isPending}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="w-3 h-3" /> End
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-on-surface-variant mt-3 italic">
        Note: Only sessions logged through this browser are tracked. Forced sign-out of other devices requires admin-level action.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CARD 3: LOGIN HISTORY
   ════════════════════════════════════════════════════════════════════════════ */
function LoginHistoryCard() {
  const [filter, setFilter] = useState("week");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.security.loginHistory(filter),
    queryFn: () => getLoginHistory(filter as any),
    staleTime: 2 * 60_000,
  });

  const entries = data?.entries || [];

  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4.5 h-4.5 text-primary" />
          <h3 className="text-sm font-bold text-on-surface">Login History</h3>
        </div>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
          <p className="text-xs text-on-surface-variant font-medium">No login history available for this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-outline-variant/15 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="text-left px-5 py-2">Date &amp; Time</th>
                <th className="text-left px-2 py-2">User</th>
                <th className="text-left px-2 py-2">Role</th>
                <th className="text-left px-2 py-2">Device</th>
                <th className="text-left px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {entries.map((entry, i) => (
                <tr key={entry.id || i} className="hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-on-surface whitespace-nowrap">{formatTimestamp(entry.loginTime)}</td>
                  <td className="px-2 py-2.5 font-medium text-on-surface">{entry.userName}</td>
                  <td className="px-2 py-2.5 text-on-surface-variant">{entry.userRole}</td>
                  <td className="px-2 py-2.5 text-on-surface-variant">{entry.deviceInfo}</td>
                  <td className="px-2 py-2.5"><StatusBadge status={entry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CARD 4: AUDIT LOG
   ════════════════════════════════════════════════════════════════════════════ */
function AuditLogCard() {
  const [filter, setFilter] = useState("week");
  const [searchText, setSearchText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.security.auditLogs(filter),
    queryFn: () => getAuditLogs(filter as any),
    staleTime: 2 * 60_000,
  });

  const allEntries = data?.entries || [];

  // Client-side text search filter
  const entries = searchText.trim()
    ? allEntries.filter(
        (e) =>
          e.message.toLowerCase().includes(searchText.toLowerCase()) ||
          e.actorName.toLowerCase().includes(searchText.toLowerCase()) ||
          e.entityName?.toLowerCase().includes(searchText.toLowerCase()) ||
          e.actionType.toLowerCase().includes(searchText.toLowerCase())
      )
    : allEntries;

  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4.5 h-4.5 text-primary" />
          <h3 className="text-sm font-bold text-on-surface">Audit Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search logs..."
              className="pl-7 pr-3 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-[11px] font-medium text-on-surface focus:outline-none focus:border-primary w-40"
            />
          </div>
          <FilterDropdown value={filter} onChange={setFilter} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <ScrollText className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
          <p className="text-xs text-on-surface-variant font-medium">
            {searchText ? "No audit records match your search." : "No audit log entries for this period."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-outline-variant/15 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="text-left px-5 py-2">Action</th>
                <th className="text-left px-2 py-2">Performed By</th>
                <th className="text-left px-2 py-2">Entity</th>
                <th className="text-left px-2 py-2">Date &amp; Time</th>
                <th className="text-left px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {entries.map((entry, i) => (
                <tr key={entry.id || i} className="hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="px-5 py-2.5">
                    <p className="font-bold text-on-surface text-[11px]">{entry.message}</p>
                    <p className="text-[10px] text-on-surface-variant">{entry.actionType.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-2 py-2.5 font-medium text-on-surface whitespace-nowrap">{entry.actorName}</td>
                  <td className="px-2 py-2.5 text-on-surface-variant">
                    {entry.entityType}{entry.entityName ? ` — ${entry.entityName}` : ""}
                  </td>
                  <td className="px-2 py-2.5 text-on-surface-variant whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                  <td className="px-2 py-2.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${entry.success ? "bg-emerald-500" : "bg-rose-500"}`} title={entry.success ? "Success" : "Failed"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN SECURITY SETTINGS SECTION
   ════════════════════════════════════════════════════════════════════════════ */
export default function SecuritySettingsSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings.securitySettings,
    queryFn: getSecuritySettings,
    staleTime: 5 * 60_000,
  });

  const [formData, setFormData] = useState<SecuritySettingsData>({
    sessionTimeoutMinutes: 30,
    auditLoggingEnabled: true,
  });

  useEffect(() => {
    if (settingsData) setFormData(settingsData);
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SecuritySettingsData>) => createOrUpdateSecuritySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.securitySettings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
            Security
          </span>
        </div>
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Security &amp; Authentication
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage passwords, monitor active sessions, review login history, and track security audit events.
        </p>
      </div>

      {/* Security Settings (timeout & audit toggle) */}
      <form onSubmit={handleSettingsSubmit} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Security Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface mb-1">Inactivity Session Timeout</label>
            <select
              value={formData.sessionTimeoutMinutes}
              onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes (Recommended)</option>
              <option value={60}>1 Hour</option>
              <option value={120}>2 Hours</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-lowest transition-colors w-full">
              <input
                type="checkbox"
                checked={formData.auditLoggingEnabled}
                onChange={(e) => setFormData({ ...formData, auditLoggingEnabled: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <div>
                <p className="font-bold text-[11px] text-on-surface">Enable Audit Logging</p>
                <p className="text-[10px] text-on-surface-variant">Track patient record views, billing actions, and setting changes</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
          {savedSuccess ? (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Security preferences saved!
            </span>
          ) : <span />}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Preferences
          </button>
        </div>
      </form>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChangePasswordCard />
        <ActiveSessionsCard />
      </div>

      <LoginHistoryCard />
      <AuditLogCard />
    </div>
  );
}
