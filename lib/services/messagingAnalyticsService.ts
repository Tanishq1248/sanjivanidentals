import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "./firestoreConfig";
import type { MessageLogEntry, MessagingQuotaInfo } from "../types";

export interface MessagingStats {
  whatsAppSentMonth: number;
  whatsAppRemainingMonth: number;
  whatsAppLimit: number;
  emailsSentMonth: number;
  failedCount: number;
  successRate: number;
  pendingCount: number;
  lastUpdated?: string;
  statusCounts: {
    delivered: number;
    sent: number;
    queued: number;
    sending: number;
    failed: number;
    quotaExceeded: number;
  };
  featureBreakdown: {
    prescription: { sent: number; delivered: number; failed: number };
    invoice: { sent: number; delivered: number; failed: number };
    appointment_reminder: { sent: number; delivered: number; failed: number };
  };
}

/**
 * Fetch monthly WhatsApp usage quota information (messagingUsage/quota_YYYY_MM).
 */
export async function getMonthlyMessagingQuota(): Promise<MessagingQuotaInfo> {
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");
  const monthKey = `quota_${year}_${monthStr}`;

  const ref = doc(db, COLLECTIONS.MESSAGING_USAGE, monthKey);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as MessagingQuotaInfo;
  }

  return {
    clinicId: "default",
    month: `${year}-${monthStr}`,
    monthlyLimit: 500,
    messagesSent: 0,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Fetch aggregated messaging analytics metrics over recent message logs.
 * Optimized for Firebase reads.
 */
export async function getMessagingAnalyticsStats(): Promise<MessagingStats> {
  const quota = await getMonthlyMessagingQuota();
  const limit = quota.monthlyLimit || 500;
  const whatsAppSentMonth = quota.messagesSent || 0;
  const whatsAppRemainingMonth = Math.max(0, limit - whatsAppSentMonth);

  // Fetch recent message logs (up to 300 logs for analytics aggregation)
  const logsRef = collection(db, COLLECTIONS.MESSAGE_LOGS);
  const q = query(logsRef, orderBy("createdAt", "desc"), firestoreLimit(300));
  const snap = await getDocs(q);

  const statusCounts = {
    delivered: 0,
    sent: 0,
    queued: 0,
    sending: 0,
    failed: 0,
    quotaExceeded: 0,
  };

  const featureBreakdown = {
    prescription: { sent: 0, delivered: 0, failed: 0 },
    invoice: { sent: 0, delivered: 0, failed: 0 },
    appointment_reminder: { sent: 0, delivered: 0, failed: 0 },
  };

  let totalDeliveredOrSent = 0;
  let totalFailed = 0;
  let totalPending = 0;
  let emailsSentMonth = 0;

  snap.docs.forEach((docSnap) => {
    const log = docSnap.data() as MessageLogEntry;
    const status = (log.status || "").toLowerCase();
    const type = log.messageType as "prescription" | "invoice" | "appointment_reminder";

    if (status === "delivered") {
      statusCounts.delivered++;
      totalDeliveredOrSent++;
      if (type && featureBreakdown[type]) {
        featureBreakdown[type].delivered++;
        featureBreakdown[type].sent++;
      }
    } else if (status === "sent") {
      statusCounts.sent++;
      totalDeliveredOrSent++;
      if (type && featureBreakdown[type]) {
        featureBreakdown[type].sent++;
      }
    } else if (status === "queued") {
      statusCounts.queued++;
      totalPending++;
    } else if (status === "sending") {
      statusCounts.sending++;
      totalPending++;
    } else if (status === "failed") {
      statusCounts.failed++;
      totalFailed++;
      if (type && featureBreakdown[type]) {
        featureBreakdown[type].failed++;
      }
    } else if (status === "quota_exceeded") {
      statusCounts.quotaExceeded++;
      totalFailed++;
    }

    if (log.recipient?.includes("@")) {
      emailsSentMonth++;
    }
  });

  const totalAttempted = totalDeliveredOrSent + totalFailed;
  const successRate = totalAttempted > 0 ? Math.round((totalDeliveredOrSent / totalAttempted) * 100) : 100;

  const lastUpdatedStr = quota.updatedAt?.seconds
    ? new Date(quota.updatedAt.seconds * 1000).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  return {
    whatsAppSentMonth,
    whatsAppRemainingMonth,
    whatsAppLimit: limit,
    emailsSentMonth,
    failedCount: totalFailed,
    successRate,
    pendingCount: totalPending,
    lastUpdated: lastUpdatedStr,
    statusCounts,
    featureBreakdown,
  };
}

/**
 * Fetch paginated message activity logs.
 */
export async function getPaginatedMessageLogs(
  maxFetch = 50,
  startSnap?: DocumentSnapshot
): Promise<{ logs: MessageLogEntry[]; lastSnap?: DocumentSnapshot }> {
  try {
    const logsRef = collection(db, COLLECTIONS.MESSAGE_LOGS);
    let q = query(logsRef, orderBy("createdAt", "desc"), firestoreLimit(maxFetch));

    if (startSnap) {
      q = query(logsRef, orderBy("createdAt", "desc"), startAfter(startSnap), firestoreLimit(maxFetch));
    }

    const snap = await getDocs(q);
    const logs: MessageLogEntry[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as MessageLogEntry),
    }));

    const lastSnap = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

    return { logs, lastSnap };
  } catch (err) {
    console.warn("[getPaginatedMessageLogs] Error fetching logs:", err);
    return { logs: [] };
  }
}
