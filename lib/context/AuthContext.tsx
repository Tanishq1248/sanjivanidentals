"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
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
import { getSecuritySettings } from "../services/securityService";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** True when the user was auto-logged out due to inactivity. */
  sessionExpired: boolean;
  /** Seconds remaining before auto-logout (non-null during final 60 seconds of inactivity). */
  warningSecondsRemaining: number | null;
  /** Call to dismiss inactivity warning and refresh the active session. */
  stayLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** How often (ms) to check whether the local inactivity threshold or warning has passed. */
const INACTIVITY_CHECK_INTERVAL_MS = 1000; // Check every second for smooth countdown

/** Default timeout fallback if settings haven't loaded yet. */
const DEFAULT_TIMEOUT_MINUTES = 30;

/**
 * DOM events that count as user activity across Desktop, Tablet, and Mobile.
 */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "click",
  "keydown",
  "scroll",
  "focus",
  "touchstart",
  "touchmove",
  "pointerdown",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [warningSecondsRemaining, setWarningSecondsRemaining] = useState<number | null>(null);

  // Track the last local activity timestamp (in-memory)
  const lastLocalActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoggingOutRef = useRef(false);
  const timeoutMinutesRef = useRef<number>(DEFAULT_TIMEOUT_MINUTES);

  // Fetch security settings to load dynamic timeout
  const refreshTimeoutSetting = useCallback(async () => {
    try {
      const settings = await getSecuritySettings();
      if (settings?.sessionTimeoutMinutes && settings.sessionTimeoutMinutes > 0) {
        timeoutMinutesRef.current = settings.sessionTimeoutMinutes;
      }
    } catch {
      timeoutMinutesRef.current = DEFAULT_TIMEOUT_MINUTES;
    }
  }, []);

  // ─── Activity handler ───────────────────────────────────────────────
  const handleActivity = useCallback(() => {
    lastLocalActivityRef.current = Date.now();
    // Clear warning if active
    setWarningSecondsRemaining((prev) => (prev !== null ? null : prev));
    // Fire-and-forget — throttled internally (max 1 Firestore write per 5 min)
    updateSessionActivity().catch(() => {});
  }, []);

  // ─── Stay Logged In (from countdown warning modal) ────────────────────
  const stayLoggedIn = useCallback(() => {
    lastLocalActivityRef.current = Date.now();
    setWarningSecondsRemaining(null);
    updateSessionActivity().catch(() => {});
  }, []);

  // ─── Force logout (inactivity) ──────────────────────────────────────
  const forceLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    console.warn("[Session] Auto-logout triggered due to inactivity.");
    setWarningSecondsRemaining(null);
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

    clearLocalSessionState();
    isLoggingOutRef.current = false;

    // Navigate to login with inactivity reason param
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login?reason=inactivity";
    }
  }, []);

  // ─── Start inactivity monitoring ────────────────────────────────────
  const startInactivityMonitor = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setInterval(async () => {
      if (isLoggingOutRef.current) return;

      const idleMs = Date.now() - lastLocalActivityRef.current;
      const timeoutMs = (timeoutMinutesRef.current || DEFAULT_TIMEOUT_MINUTES) * 60 * 1000;
      const warningThresholdMs = Math.max(0, timeoutMs - 60 * 1000); // 60s warning window

      if (idleMs >= timeoutMs) {
        // Double-check with Firestore before kicking out
        const { valid } = await checkSessionValidity();
        if (!valid) {
          await forceLogout();
        } else {
          // Session was extended elsewhere — reset local timer
          lastLocalActivityRef.current = Date.now();
          setWarningSecondsRemaining(null);
        }
      } else if (idleMs >= warningThresholdMs) {
        // Within 60 seconds of expiration: trigger warning countdown
        const remainingSec = Math.max(1, Math.ceil((timeoutMs - idleMs) / 1000));
        setWarningSecondsRemaining(remainingSec);
      } else {
        setWarningSecondsRemaining((prev) => (prev !== null ? null : prev));
      }
    }, INACTIVITY_CHECK_INTERVAL_MS);
  }, [forceLogout]);

  // ─── Stop inactivity monitoring ─────────────────────────────────────
  const stopInactivityMonitor = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    setWarningSecondsRemaining(null);
  }, []);

  // ─── Attach / detach activity listeners ─────────────────────────────
  const attachActivityListeners = useCallback(() => {
    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, handleActivity, { passive: true });
    });

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
        // Load custom session timeout
        await refreshTimeoutSetting();

        // User is authenticated — validate existing session on reload
        const existingSessionId = getSessionId();
        if (existingSessionId) {
          const { valid } = await checkSessionValidity();
          if (!valid) {
            await forceLogout();
            return;
          }
          lastLocalActivityRef.current = Date.now();
        }

        attachActivityListeners();
        startInactivityMonitor();

        // Opportunistic cleanup of stale sessions (fire-and-forget)
        cleanupExpiredSessions().catch(() => {});
      } else {
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
    setWarningSecondsRemaining(null);
    const firebaseUser = await loginAdmin(email, password);

    await createSession(
      firebaseUser.uid,
      firebaseUser.email || "Unknown",
      "Admin"
    );

    lastLocalActivityRef.current = Date.now();
    await refreshTimeoutSetting();
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
    setWarningSecondsRemaining(null);
    isLoggingOutRef.current = false;

    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        sessionExpired,
        warningSecondsRemaining,
        stayLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
