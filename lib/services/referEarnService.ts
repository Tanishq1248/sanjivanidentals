import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, DEFAULT_CLINIC_ID } from "./firestoreConfig";
import type {
  ClinicReferral,
  ClinicReferralConfig,
  ClinicReferralStatus,
  SubscriptionInfo,
} from "../types";

/* ═══════════════════════════════════════════════════════════════════════════
 * REFERRAL CODE GENERATION
 * ═══════════════════════════════════════════════════════════════════════════ */

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const CODE_PREFIX = "DP";

/** Generate a cryptographically random referral code like "DP-8XK29A". */
function generateReferralCode(): string {
  const arr = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[arr[i] % CODE_CHARS.length];
  }
  return `${CODE_PREFIX}-${code}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REFERRAL CONFIG (Singleton)
 * ═══════════════════════════════════════════════════════════════════════════ */

const CONFIG_DOC_ID = "default";

/** Fetch or create the clinic's referral config (generates code on first call). */
export async function getOrCreateReferralConfig(clinicId?: string): Promise<ClinicReferralConfig> {
  const docRef = doc(db, COLLECTIONS.CLINIC_REFERRAL_CONFIG, CONFIG_DOC_ID);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    return snap.data() as ClinicReferralConfig;
  }

  const targetClinicId = clinicId || (typeof window !== "undefined" ? localStorage.getItem("clinicId") || undefined : undefined);

  // First time — generate a new code
  const config: ClinicReferralConfig = {
    referralCode: generateReferralCode(),
    clinicName: "My Clinic", // Will be updated by the user
    clinicId: targetClinicId || "",
    createdAt: Timestamp.now(),
  };

  await setDoc(docRef, config);
  return config;
}

/** Update clinic name in referral config. */
export async function updateReferralConfigClinicName(clinicName: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLINIC_REFERRAL_CONFIG, CONFIG_DOC_ID);
  await updateDoc(docRef, { clinicName });
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SUBSCRIPTION INFO (Singleton)
 * ═══════════════════════════════════════════════════════════════════════════ */

const SUB_DOC_ID = "default";

/** Fetch or create the subscription info singleton. */
export async function getSubscriptionInfo(clinicId?: string): Promise<SubscriptionInfo> {
  const docRef = doc(db, COLLECTIONS.SUBSCRIPTION_INFO, SUB_DOC_ID);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    return snap.data() as SubscriptionInfo;
  }

  const targetClinicId = clinicId || (typeof window !== "undefined" ? localStorage.getItem("clinicId") || undefined : undefined);

  // Default stub — no active subscription
  const info: SubscriptionInfo = {
    planName: "Free",
    expiryDate: "",
    freeMonthsEarned: 0,
    totalSuccessfulReferrals: 0,
    clinicId: targetClinicId || "",
    updatedAt: Timestamp.now(),
  };

  await setDoc(docRef, info);
  return info;
}

/** Add one free month to the subscription expiry. */
async function extendSubscription(months: number): Promise<void> {
  const info = await getSubscriptionInfo();
  const docRef = doc(db, COLLECTIONS.SUBSCRIPTION_INFO, SUB_DOC_ID);

  // Calculate new expiry
  let baseDate: Date;
  if (info.expiryDate) {
    baseDate = new Date(info.expiryDate + "T00:00:00");
    // If expiry is in the past, start from today
    if (baseDate < new Date()) {
      baseDate = new Date();
    }
  } else {
    baseDate = new Date();
  }

  baseDate.setMonth(baseDate.getMonth() + months);
  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, "0");
  const d = String(baseDate.getDate()).padStart(2, "0");
  const newExpiry = `${y}-${m}-${d}`;

  await updateDoc(docRef, {
    expiryDate: newExpiry,
    freeMonthsEarned: (info.freeMonthsEarned || 0) + months,
    totalSuccessfulReferrals: (info.totalSuccessfulReferrals || 0) + 1,
    updatedAt: Timestamp.now(),
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REFERRALS CRUD
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Fetch all referral records, ordered by referredAt descending. */
export async function getReferrals(): Promise<ClinicReferral[]> {
  const q = query(
    collection(db, COLLECTIONS.CLINIC_REFERRALS),
    orderBy("referredAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClinicReferral));
}

/** Check if a referral with the given email already exists. */
export async function isDuplicateReferral(email: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTIONS.CLINIC_REFERRALS),
    where("referredClinicEmail", "==", email.toLowerCase().trim())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/** Create a new referral record with status "Pending". */
export async function addReferral(data: {
  referredClinicName: string;
  referredClinicEmail: string;
  clinicId?: string;
}): Promise<string> {
  const targetClinicId = data.clinicId || (typeof window !== "undefined" ? localStorage.getItem("clinicId") || undefined : undefined);

  const config = await getOrCreateReferralConfig(targetClinicId);
  const now = Timestamp.now();
  const today = new Date().toISOString().split("T")[0];

  const newDocRef = doc(collection(db, COLLECTIONS.CLINIC_REFERRALS));
  const referral: Omit<ClinicReferral, "id"> = {
    referralCode: config.referralCode,
    referrerClinicId: "self", // single-tenant — this clinic is always the referrer
    referredClinicName: data.referredClinicName.trim(),
    referredClinicEmail: data.referredClinicEmail.toLowerCase().trim(),
    status: "Pending",
    referredAt: today,
    rewardType: "free_months",
    rewardMonths: 1,
    rewardApplied: false,
    clinicId: targetClinicId || "",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDocRef, referral);
  return newDocRef.id;
}

/** Update referral status. Handles subscription extension when reward is applied. */
export async function updateReferralStatus(
  id: string,
  newStatus: ClinicReferralStatus
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLINIC_REFERRALS, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Referral not found");

  const referral = snap.data() as ClinicReferral;
  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: Timestamp.now(),
  };

  if (newStatus === "Successful" && !referral.activatedAt) {
    updates.activatedAt = new Date().toISOString().split("T")[0];
  }

  if (newStatus === "Reward Applied" && !referral.rewardApplied) {
    updates.rewardApplied = true;
    // Extend subscription by the reward months
    await extendSubscription(referral.rewardMonths || 1);
  }

  await updateDoc(docRef, updates);
}

/** Delete a referral record. */
export async function deleteReferral(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CLINIC_REFERRALS, id));
}

/* ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD STATS
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface ReferralDashboardStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  freeMonthsEarned: number;
}

/** Compute referral dashboard stats from all referral records + subscription info. */
export async function getReferralDashboardStats(): Promise<ReferralDashboardStats> {
  const [referrals, subInfo] = await Promise.all([
    getReferrals(),
    getSubscriptionInfo(),
  ]);

  return {
    totalReferrals: referrals.length,
    successfulReferrals: referrals.filter(
      (r) => r.status === "Successful" || r.status === "Reward Applied"
    ).length,
    pendingReferrals: referrals.filter((r) => r.status === "Pending").length,
    freeMonthsEarned: subInfo.freeMonthsEarned || 0,
  };
}
