import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { db, auth } from "../firebase";
import { COLLECTIONS } from "./firestoreConfig";
import type {
  LoginHistoryEntry,
  AuditLogEntry,
  SecuritySettingsData,
  LoginStatus,
} from "../types";

/* ════════════════════════════════════════════════════════════════════════════
   CHANGE PASSWORD
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Validate password strength.
 * Returns null if valid, or an error message string.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

/**
 * Change the current user's password.
 * Re-authenticates with the current password first, then updates.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: "No authenticated user found. Please log in again." };
    }

    // Validate new password strength
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      return { success: false, error: strengthError };
    }

    // Re-authenticate with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error: any) {
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      return { success: false, error: "Current password is incorrect." };
    }
    if (error.code === "auth/weak-password") {
      return { success: false, error: "New password is too weak. Use at least 8 characters." };
    }
    if (error.code === "auth/requires-recent-login") {
      return { success: false, error: "Session expired. Please log out and log in again before changing your password." };
    }
    return { success: false, error: error.message || "Failed to change password. Please try again." };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   LOGIN HISTORY
   ════════════════════════════════════════════════════════════════════════════ */

const loginHistoryRef = collection(db, COLLECTIONS.LOGIN_HISTORY);

/**
 * Detect browser and device info from navigator.
 */
export function getDeviceInfo(): { deviceInfo: string; browserName: string } {
  if (typeof navigator === "undefined") {
    return { deviceInfo: "Server", browserName: "Unknown" };
  }

  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let os = "Unknown";

  // Detect browser
  if (ua.includes("Firefox/")) browserName = "Firefox";
  else if (ua.includes("Edg/")) browserName = "Edge";
  else if (ua.includes("Chrome/")) browserName = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browserName = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR/")) browserName = "Opera";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return {
    deviceInfo: `${os} / ${browserName}`,
    browserName,
  };
}

/**
 * Record a login event in the loginHistory collection.
 * Returns the document ID for later logout tracking.
 */
export async function recordLoginEvent(
  userId: string,
  userName: string,
  userRole: string,
  status: LoginStatus = "success"
): Promise<string> {
  const { deviceInfo, browserName } = getDeviceInfo();
  const now = Timestamp.now();

  const entry: Omit<LoginHistoryEntry, "id"> = {
    userId,
    userName,
    userRole,
    deviceInfo,
    browserName,
    status,
    loginTime: now,
    createdAt: now,
  };

  const docRef = await addDoc(loginHistoryRef, entry);
  // Store the active login doc ID in sessionStorage for logout tracking
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("activeLoginDocId", docRef.id);
  }
  return docRef.id;
}

/**
 * Record a logout event by updating the existing login record.
 */
export async function recordLogoutEvent(loginDocId?: string): Promise<void> {
  const docId = loginDocId || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("activeLoginDocId") : null);
  if (!docId) return;

  try {
    const docRef = doc(db, COLLECTIONS.LOGIN_HISTORY, docId);
    await updateDoc(docRef, {
      logoutTime: Timestamp.now(),
      status: "logged_out" as LoginStatus,
    });
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("activeLoginDocId");
    }
  } catch (error) {
    console.warn("Failed to record logout event:", error);
  }
}

/**
 * Get login history with optional date filtering.
 * Returns up to `pageSize` records, with pagination cursor support.
 */
export async function getLoginHistory(
  filter: "today" | "week" | "month" | "all" = "all",
  pageSize = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ entries: LoginHistoryEntry[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints: any[] = [orderBy("loginTime", "desc"), limit(pageSize)];

  // Date filter
  if (filter !== "all") {
    const now = new Date();
    let startDate: Date;
    if (filter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    constraints.unshift(where("loginTime", ">=", Timestamp.fromDate(startDate)));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(loginHistoryRef, ...constraints);
  const snapshot = await getDocs(q);

  const entries: LoginHistoryEntry[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<LoginHistoryEntry, "id">),
  }));

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { entries, lastVisible };
}

/**
 * Get active sessions (login records with status="success" and no logoutTime).
 */
export async function getActiveSessions(): Promise<LoginHistoryEntry[]> {
  const q = query(
    loginHistoryRef,
    where("status", "==", "success"),
    orderBy("loginTime", "desc"),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<LoginHistoryEntry, "id">),
  }));
}

/**
 * Mark a session as logged out.
 */
export async function revokeSession(loginDocId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LOGIN_HISTORY, loginDocId);
  await updateDoc(docRef, {
    logoutTime: Timestamp.now(),
    status: "logged_out" as LoginStatus,
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   AUDIT LOG
   ════════════════════════════════════════════════════════════════════════════ */

const auditLogsRef = collection(db, COLLECTIONS.AUDIT_LOGS);

/**
 * Record an audit log event. Append-only — no updates or deletes.
 */
export async function recordAuditEvent(params: {
  actorUserId: string;
  actorName: string;
  actorRole: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  message: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}): Promise<string> {
  const entry: Omit<AuditLogEntry, "id"> = {
    actorUserId: params.actorUserId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    message: params.message,
    timestamp: Timestamp.now(),
    metadata: params.metadata,
    success: params.success ?? true,
  };

  const docRef = await addDoc(auditLogsRef, entry);
  return docRef.id;
}

/**
 * Get audit logs with optional date filtering and text search.
 */
export async function getAuditLogs(
  filter: "today" | "week" | "month" | "all" = "all",
  pageSize = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ entries: AuditLogEntry[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints: any[] = [orderBy("timestamp", "desc"), limit(pageSize)];

  if (filter !== "all") {
    const now = new Date();
    let startDate: Date;
    if (filter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    constraints.unshift(where("timestamp", ">=", Timestamp.fromDate(startDate)));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(auditLogsRef, ...constraints);
  const snapshot = await getDocs(q);

  const entries: AuditLogEntry[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AuditLogEntry, "id">),
  }));

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { entries, lastVisible };
}

/* ════════════════════════════════════════════════════════════════════════════
   SECURITY SETTINGS (singleton: securitySettings/info)
   ════════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_SECURITY_SETTINGS: SecuritySettingsData = {
  sessionTimeoutMinutes: 30,
  auditLoggingEnabled: true,
};

let memorySecuritySettingsCache: SecuritySettingsData = { ...DEFAULT_SECURITY_SETTINGS };

/**
 * Get security settings from Firestore singleton.
 */
export async function getSecuritySettings(): Promise<SecuritySettingsData> {
  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SETTINGS, "info");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SecuritySettingsData;
      const merged = { ...DEFAULT_SECURITY_SETTINGS, ...data };
      memorySecuritySettingsCache = merged;
      return merged;
    }
  } catch (error) {
    console.warn("Firestore fetch error for security settings:", error);
  }
  return memorySecuritySettingsCache;
}

/**
 * Create or update security settings singleton.
 */
export async function createOrUpdateSecuritySettings(
  data: Partial<SecuritySettingsData>
): Promise<SecuritySettingsData> {
  const current = await getSecuritySettings();
  const updated: SecuritySettingsData = {
    ...current,
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (!current.createdAt) {
    updated.createdAt = Timestamp.now();
  }

  memorySecuritySettingsCache = updated;

  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SETTINGS, "info");
    await setDoc(docRef, updated, { merge: true });
  } catch (error) {
    console.warn("Firestore setDoc error for security settings:", error);
  }

  return updated;
}

/**
 * Validate security settings.
 */
export function validateSecuritySettings(
  data: Partial<SecuritySettingsData>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.sessionTimeoutMinutes !== undefined) {
    if (
      typeof data.sessionTimeoutMinutes !== "number" ||
      data.sessionTimeoutMinutes < 5 ||
      data.sessionTimeoutMinutes > 480
    ) {
      errors.sessionTimeoutMinutes = "Session timeout must be between 5 and 480 minutes";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
