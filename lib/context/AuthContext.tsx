"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import type { User } from "firebase/auth";
import { onAuthChange, loginAdmin, logoutAdmin } from "../services/authService";
import {
  createSession,
  updateSessionActivity,
  checkSessionValidity,
  revokeSession,
  getSessionId,
  clearLocalSessionState,
  cleanupExpiredSessions,
} from "../services/sessionService";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** True when the user was auto-logged out due to inactivity. */
  sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** How often (ms) to check whether the local inactivity threshold has passed. */
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds

/** Default timeout fallback if settings haven't loaded yet. */
const DEFAULT_TIMEOUT_MINUTES = 30;

/**
 * DOM events that count as "meaningful user activity".
 * We intentionally exclude mousemove to avoid excessive triggers.
 */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "click",
  "keydown",
  "scroll",
  "focus",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Track the last local activity timestamp (in-memory, no Firestore writes)
  const lastLocalActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoggingOutRef = useRef(false);

  // ─── Activity handler ───────────────────────────────────────────────
  // Called on DOM activity events. Updates the in-memory timestamp and
  // calls the throttled Firestore updater.
  const handleActivity = useCallback(() => {
    lastLocalActivityRef.current = Date.now();
    // Fire-and-forget — throttled internally, max 1 write per 5 min
    updateSessionActivity().catch(() => {});
  }, []);

  // ─── Force logout (inactivity) ──────────────────────────────────────
  const forceLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    console.warn("[Session] Auto-logout triggered due to inactivity.");
    setSessionExpired(true);

    try {
      await revokeSession("inactivity_timeout");
    } catch {
      // Best effort
    }
    try {
      await logoutAdmin();
    } catch {
      // Best effort
    }

    isLoggingOutRef.current = false;
  }, []);

  // ─── Start inactivity monitoring ────────────────────────────────────
  const startInactivityMonitor = useCallback(() => {
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setInterval(async () => {
      // Skip if we're already in a logout flow
      if (isLoggingOutRef.current) return;

      const idleMs = Date.now() - lastLocalActivityRef.current;
      // Use a generous default; the actual Firestore-backed check is the
      // source of truth via checkSessionValidity()
      const timeoutMs = DEFAULT_TIMEOUT_MINUTES * 60 * 1000;

      if (idleMs >= timeoutMs) {
        // Double-check with Firestore (in case another tab extended it)
        const { valid } = await checkSessionValidity();
        if (!valid) {
          await forceLogout();
        } else {
          // Session was extended elsewhere — reset local timer
          lastLocalActivityRef.current = Date.now();
        }
      }
    }, INACTIVITY_CHECK_INTERVAL_MS);
  }, [forceLogout]);

  // ─── Stop inactivity monitoring ─────────────────────────────────────
  const stopInactivityMonitor = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // ─── Attach / detach activity listeners ─────────────────────────────
  const attachActivityListeners = useCallback(() => {
    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, handleActivity, { passive: true });
    });

    // Also listen for visibility change (tab switch back = activity)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    });
  }, [handleActivity]);

  const detachActivityListeners = useCallback(() => {
    ACTIVITY_EVENTS.forEach((evt) => {
      document.removeEventListener(evt, handleActivity);
    });
  }, [handleActivity]);

  // ─── Auth state observer ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        // User is authenticated — validate existing session on reload
        const existingSessionId = getSessionId();
        if (existingSessionId) {
          const { valid } = await checkSessionValidity();
          if (!valid) {
            // Session expired while tab was closed — force logout
            await forceLogout();
            return;
          }
          // Session is still valid — reset local activity
          lastLocalActivityRef.current = Date.now();
        }
        // Note: if no sessionId exists (e.g., first load after login),
        // the login() flow below will create the session.

        // Start monitoring
        attachActivityListeners();
        startInactivityMonitor();

        // Opportunistic cleanup of stale sessions (fire-and-forget)
        cleanupExpiredSessions().catch(() => {});
      } else {
        // User signed out — cleanup
        stopInactivityMonitor();
        detachActivityListeners();
      }
    });

    return () => {
      unsubscribe();
      stopInactivityMonitor();
      detachActivityListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setSessionExpired(false);
    const firebaseUser = await loginAdmin(email, password);

    // Create session record after successful Firebase auth
    await createSession(
      firebaseUser.uid,
      firebaseUser.email || "Unknown",
      "Admin" // Default role; will be refined when role system is fully integrated
    );

    // Reset local activity
    lastLocalActivityRef.current = Date.now();
  };

  // ─── Logout ─────────────────────────────────────────────────────────
  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    stopInactivityMonitor();
    detachActivityListeners();

    try {
      await revokeSession("manual_logout");
    } catch {
      // Best effort
    }

    await logoutAdmin();
    clearLocalSessionState();
    setSessionExpired(false);
    isLoggingOutRef.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
