import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import { recordLoginEvent, recordLogoutEvent } from "./securityService";

/** Sign in admin with email + password and record login event. */
export async function loginAdmin(
  email: string,
  password: string
): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    // Record successful login (fire-and-forget, don't block auth flow)
    recordLoginEvent(
      user.uid,
      user.email || "Unknown",
      "Admin", // Default role; will be refined when role system is integrated
      "success"
    ).catch(() => {}); // Silently ignore recording failures
    return user;
  } catch (error: any) {
    // Record failed login attempt if we have the email
    if (email) {
      recordLoginEvent(
        "unknown",
        email,
        "Unknown",
        "failed"
      ).catch(() => {}); // Silently ignore
    }
    throw error;
  }
}

/** Sign out the current admin and record logout event. */
export async function logoutAdmin(): Promise<void> {
  // Record logout before signing out (needs auth context)
  await recordLogoutEvent().catch(() => {});
  await signOut(auth);
}

/** Get current authenticated user (or null). */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
