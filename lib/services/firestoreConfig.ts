import { collection, collectionGroup, writeBatch, query, where, getDocs, doc, deleteDoc, setDoc, Timestamp, Firestore } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Centralized Firestore Collection Names
 * Helps support archived collections in the future without modifying every query in the codebase.
 */
export const COLLECTIONS = {
  // Active Collections
  APPOINTMENTS: "appointments",
  PATIENTS: "patients",
  PRESCRIPTIONS: "prescriptions",
  NOTIFICATIONS: "notifications",
  SERVICES: "services",
  CLINIC_SETTINGS: "clinicSettings",
  PATIENT_MEDICAL_PROFILES: "patientMedicalProfiles",
  PATIENT_ENCOUNTERS: "patientEncounters",
  DOCTORS: "doctors",
  INVOICES: "invoices",
  EXPENSES: "expenses",
  CLINIC_REFERRALS: "clinicReferrals",
  CLINIC_REFERRAL_CONFIG: "clinicReferralConfig",
  SUBSCRIPTION_INFO: "subscriptionInfo",
  TEAM_MEMBERS: "teamMembers",
  ROLES: "roles",
  APPOINTMENT_SETTINGS: "appointmentSettings",
  BILLING_SETTINGS: "billingSettings",
  LOGIN_HISTORY: "loginHistory",
  AUDIT_LOGS: "auditLogs",
  SECURITY_SETTINGS: "securitySettings",
  SECURITY_SESSIONS: "securitySessions",
  MESSAGING_USAGE: "messagingUsage",
  MESSAGE_LOGS: "messageLogs",
  DOCUMENTS: "documents",

  // Archived Collections (designed for future expansion)
  ARCHIVED_APPOINTMENTS: "archived_appointments",
  ARCHIVED_PRESCRIPTIONS: "archived_prescriptions",
  ARCHIVED_NOTIFICATIONS: "archived_notifications",
};

/**
 * Global Caching & Archival Configuration Settings
 */
export const ARCHIVE_CONFIG = {
  // Toggle to search/retrieve data from archived collections as a fallback (currently disabled)
  IS_ARCHIVE_RETRIEVAL_ENABLED: false,

  // Cut-off age in months to decide which records to archive (12 months = 1 year)
  ARCHIVE_THRESHOLD_MONTHS: 12,
};

/**
 * Helper to determine the target collection reference dynamically.
 * Allows easy toggling between active and archived collections for read queries.
 */
export function getCollectionRef(dbInstance: Firestore, activeName: string, archivedName: string, queryArchived = false) {
  const collectionName = (queryArchived && ARCHIVE_CONFIG.IS_ARCHIVE_RETRIEVAL_ENABLED) 
    ? archivedName 
    : activeName;
  return collection(dbInstance, collectionName);
}

/**
 * EXTENSION POINT: FUTURE AUTOMATIC ARCHIVE JOB
 * This function defines the logic for moving records older than the threshold
 * from the active collection to the archived collection.
 * 
 * Scheduled triggers (e.g. Cloud Functions, Firebase Scheduled Functions, or cron jobs)
 * can invoke this endpoint or routine on a weekly/monthly basis.
 */
export async function executeArchivalJob(
  targetCollection: "appointments" | "prescriptions" | "notifications"
): Promise<{ success: boolean; movedCount: number; error?: string }> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - ARCHIVE_CONFIG.ARCHIVE_THRESHOLD_MONTHS);
    
    // Construct threshold timestamp or date string based on collection
    const activeCollectionName = COLLECTIONS[targetCollection.toUpperCase() as keyof typeof COLLECTIONS];
    const archivedCollectionName = COLLECTIONS[`ARCHIVED_${targetCollection.toUpperCase()}` as keyof typeof COLLECTIONS];
    
    if (!activeCollectionName || !archivedCollectionName) {
      throw new Error(`Invalid target collection: ${targetCollection}`);
    }

    const activeRef = collection(db, activeCollectionName);
    const archivedRef = collection(db, archivedCollectionName);

    let archivalQuery;
    
    if (targetCollection === "appointments") {
      // Appointments are filtered by date string (YYYY-MM-DD)
      const dateString = thresholdDate.toISOString().split("T")[0];
      archivalQuery = query(activeRef, where("date", "<", dateString));
    } else {
      // Other collections are filtered by createdAt Timestamp
      const cutoffTimestamp = Timestamp.fromDate(thresholdDate);
      archivalQuery = query(activeRef, where("createdAt", "<", cutoffTimestamp));
    }

    const snapshot = await getDocs(archivalQuery);
    if (snapshot.empty) {
      return { success: true, movedCount: 0 };
    }

    // Move documents using a Firestore Batch
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const targetDocRef = doc(archivedRef, docSnap.id);
      const sourceDocRef = doc(activeRef, docSnap.id);

      // Copy to archive and delete from active
      batch.set(targetDocRef, data);
      batch.delete(sourceDocRef);
    });

    await batch.commit();

    return {
      success: true,
      movedCount: snapshot.size,
    };
  } catch (error: any) {
    console.error(`Archival job failed for ${targetCollection}:`, error);
    return {
      success: false,
      movedCount: 0,
      error: error.message,
    };
  }
}
