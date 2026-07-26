import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "./firestoreConfig";
import { getSecuritySettings } from "./securityService";
import type { SecuritySession, SessionStatus } from "../types";

/* ════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════════════════ */

/** Minimum interval (ms) between Firestore activity-update writes. */
const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/** Key used to persist the stable device identifier in localStorage. */
const DEVICE_ID_KEY = "dp_device_id";

/** Key used to persist the current session ID in sessionStorage. */
const SESSION_ID_KEY = "dp_session_id";

/** Key used to persist the last activity write timestamp in memory. */
let lastActivityWriteMs = 0;

/** Cached timeout value so we don't re-fetch settings on every check. */
let cachedTimeoutMinutes: number | null = null;
let cachedTimeoutFetchedAt = 0;
const TIMEOUT_CACHE_TTL_MS = 5 * 60 * 1000; // re-read settings every 5 min

/* ════════════════════════════════════════════════════════════════════════════
   DEVICE & BROWSER INFO
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Generate or retrieve a stable device identifier.
 * Uses localStorage so it persists across sessions on the same browser/device.
 */
export function getDeviceId(): string {
  if (typeof localStorage === "undefined") return "server";

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a UUID-like identifier
    deviceId = "dev_" + crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Extract browser, platform, and device name from the user agent.
 */
export function getSessionDeviceInfo(): {
  browserName: string;
  platform: string;
  deviceName: string;
} {
  if (typeof navigator === "undefined") {
    return { browserName: "Unknown", platform: "Server", deviceName: "Server" };
  }

  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let platform = "Unknown";

  // Detect browser
  if (ua.includes("Firefox/")) browserName = "Firefox";
  else if (ua.includes("Edg/")) browserName = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browserName = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browserName = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR/")) browserName = "Opera";

  // Detect platform
  if (ua.includes("Windows")) platform = "Windows";
  else if (ua.includes("Mac OS")) platform = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) platform = "Linux";
  else if (ua.includes("Android")) platform = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) platform = "iOS";

  return {
    browserName,
    platform,
    deviceName: `${platform} / ${browserName}`,
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   TIMEOUT HELPER
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Get the configured session timeout in minutes.
 * Caches the value for 5 minutes to avoid repeated Firestore reads.
 */
async function getTimeoutMinutes(): Promise<number> {
  const now = Date.now();
  if (cachedTimeoutMinutes !== null && now - cachedTimeoutFetchedAt < TIMEOUT_CACHE_TTL_MS) {
    return cachedTimeoutMinutes;
  }
  try {
    const settings = await getSecuritySettings();
    cachedTimeoutMinutes = settings.sessionTimeoutMinutes || 30;
    cachedTimeoutFetchedAt = now;
  } catch {
    cachedTimeoutMinutes = cachedTimeoutMinutes ?? 30;
  }
  return cachedTimeoutMinutes;
}

/* ════════════════════════════════════════════════════════════════════════════
   SESSION ID HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

/** Store the current session ID locally. */
function storeSessionId(sessionId: string): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
}

/** Get the current session ID from local storage. */
export function getSessionId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(SESSION_ID_KEY);
}

/** Clear all session-related local state. */
export function clearLocalSessionState(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SESSION_ID_KEY);
  }
  // Reset in-memory state
  lastActivityWriteMs = 0;
  cachedTimeoutMinutes = null;
  cachedTimeoutFetchedAt = 0;
}

/* ════════════════════════════════════════════════════════════════════════════
   1) createSession()
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Create a new session document in Firestore after successful login.
 *
 * - Revokes any existing active session for this device+user combo
 * - Creates a new session doc with status "active"
 * - Stores session ID in sessionStorage for future reference
 *
 * @returns The new session ID (Firestore document ID)
 */
export async function createSession(
  userId: string,
  userName: string,
  role: string
): Promise<string> {
  const deviceId = getDeviceId();
  const { browserName, platform, deviceName } = getSessionDeviceInfo();
  const timeoutMinutes = await getTimeoutMinutes();

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + timeoutMinutes * 60 * 1000
  );

  // Revoke any existing active sessions for this user on this device
  await revokeDeviceSessions(userId, deviceId, "new_session");

  // Generate a new doc reference (auto-generated ID)
  const sessionsRef = collection(db, COLLECTIONS.SECURITY_SESSIONS);
  const newDocRef = doc(sessionsRef);
  const sessionId = newDocRef.id;

  const sessionData: Omit<SecuritySession, "id"> = {
    sessionId,
    userId,
    userName,
    role,
    deviceId,
    deviceName,
    browserName,
    platform,
    createdAt: now,
    lastActiveAt: now,
    expiresAt,
    status: "active",
    isCurrent: true,
    isRevoked: false,
  };

  await setDoc(newDocRef, sessionData);

  // Store locally
  storeSessionId(sessionId);
  lastActivityWriteMs = Date.now();

  return sessionId;
}

/* ════════════════════════════════════════════════════════════════════════════
   2) updateSessionActivity()
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Update the session's lastActiveAt and expiresAt timestamps.
 *
 * Throttled: writes at most once per ACTIVITY_THROTTLE_MS (5 minutes).
 * Returns true if an actual write occurred, false if throttled/skipped.
 */
export async function updateSessionActivity(): Promise<boolean> {
  const sessionId = getSessionId();
  if (!sessionId) return false;

  // Throttle: skip if last write was too recent
  const now = Date.now();
  if (now - lastActivityWriteMs < ACTIVITY_THROTTLE_MS) {
    return false;
  }

  try {
    const timeoutMinutes = await getTimeoutMinutes();
    const nowTs = Timestamp.now();
    const newExpiresAt = Timestamp.fromMillis(
      nowTs.toMillis() + timeoutMinutes * 60 * 1000
    );

    const docRef = doc(db, COLLECTIONS.SECURITY_SESSIONS, sessionId);
    await updateDoc(docRef, {
      lastActiveAt: nowTs,
      expiresAt: newExpiresAt,
    });

    lastActivityWriteMs = now;
    return true;
  } catch (error) {
    console.warn("Failed to update session activity:", error);
    return false;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   3) checkSessionValidity()
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Check whether the current session is still valid.
 *
 * - Reads the session doc from Firestore
 * - If expired (past expiresAt) or already revoked, returns false
 * - If still valid, returns true
 *
 * Does NOT auto-revoke — the caller decides what to do.
 */
export async function checkSessionValidity(): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const sessionId = getSessionId();
  if (!sessionId) {
    return { valid: false, reason: "no_session" };
  }

  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SESSIONS, sessionId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { valid: false, reason: "session_not_found" };
    }

    const data = snap.data() as SecuritySession;

    // Already revoked or expired in Firestore
    if (data.isRevoked || data.status === "revoked" || data.status === "expired") {
      return { valid: false, reason: `session_${data.status}` };
    }

    // Check if expiresAt has passed
    const nowMs = Date.now();
    const expiresMs = data.expiresAt.toMillis();
    if (nowMs > expiresMs) {
      return { valid: false, reason: "session_expired" };
    }

    return { valid: true };
  } catch (error) {
    console.warn("Session validity check failed:", error);
    // On network error, assume valid to avoid wrongly logging out
    return { valid: true };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   4) revokeSession()
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Revoke the current session.
 *
 * Sets status to "revoked", marks isRevoked, records the reason and timestamp.
 * Clears local session state.
 */
export async function revokeSession(
  reason: string = "manual_logout"
): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId) {
    clearLocalSessionState();
    return;
  }

  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SESSIONS, sessionId);
    const status: SessionStatus = reason === "inactivity_timeout" ? "expired" : "revoked";

    await updateDoc(docRef, {
      status,
      isCurrent: false,
      isRevoked: true,
      revokedAt: Timestamp.now(),
      revokeReason: reason,
    });
  } catch (error) {
    console.warn("Failed to revoke session:", error);
  } finally {
    clearLocalSessionState();
  }
}

/**
 * Revoke all active sessions for a specific user+device combo.
 * Used internally when creating a new session to clean up old ones.
 */
async function revokeDeviceSessions(
  userId: string,
  deviceId: string,
  reason: string
): Promise<void> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.SECURITY_SESSIONS);
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("deviceId", "==", deviceId),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    const now = Timestamp.now();

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        status: "revoked" as SessionStatus,
        isCurrent: false,
        isRevoked: true,
        revokedAt: now,
        revokeReason: reason,
      });
    });

    await batch.commit();
  } catch (error) {
    console.warn("Failed to revoke device sessions:", error);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   5) getCurrentSession()
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Fetch the current session document for the logged-in user/device.
 * Returns null if no active session exists.
 */
export async function getCurrentSession(): Promise<SecuritySession | null> {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SESSIONS, sessionId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...(snap.data() as Omit<SecuritySession, "id">),
    };
  } catch (error) {
    console.warn("Failed to get current session:", error);
    return null;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   6) cleanupExpiredSessions()
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Find sessions that have passed their expiresAt but are still marked "active",
 * and batch-update them to "expired".
 *
 * Uses a composite index on (status, expiresAt) for efficient server-side
 * filtering. The index is defined in firestore.indexes.json.
 *
 * This is best-effort maintenance — failures are silently logged and never
 * block clinical workflows.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.SECURITY_SESSIONS);
    const now = Timestamp.now();

    const q = query(
      sessionsRef,
      where("status", "==", "active"),
      where("expiresAt", "<", now),
      limit(50)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        status: "expired" as SessionStatus,
        isCurrent: false,
        isRevoked: true,
        revokedAt: now,
        revokeReason: "inactivity_timeout",
      });
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    // Best-effort cleanup — never block clinical workflows
    console.warn("[Session cleanup] Skipped due to error:", error);
    return 0;
  }
}
