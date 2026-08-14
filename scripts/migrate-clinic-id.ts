import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const TARGET_CLINIC_ID = process.env.CLINIC_ID || "REPLACE_WITH_YOUR_CLINIC_ID";
const BATCH_LIMIT = 500;
const DRY_RUN = process.env.DRY_RUN === "true";

if (DRY_RUN) {
  console.log("⚠️  DRY RUN MODE — No changes will be written to Firestore.");
}

const COLLECTIONS_TO_MIGRATE = [
  "patients",
  "patientMedicalProfiles",
  "patientEncounters",
  "appointments",
  "prescriptions",
  "invoices",
  "expenses",
  "doctors",
  "clinicSettings",
  "teamMembers",
  "roles",
  "appointmentSettings",
  "billingSettings",
  "securitySettings",
  "securitySessions",
  "loginHistory",
  "auditLogs",
  "messageLogs",
  "messagingUsage",
  "documents",
  "clinicReferrals",
  "clinicReferralConfig",
  "notifications",
];

if (!getApps().length) {
  initializeApp({
    credential: cert(require("../serviceAccountKey.json")),
  });
}

const db = getFirestore();

interface MigrationSummary {
  totalScanned: number;
  totalUpdated: number;
  failures: Array<{ path: string; error: string }>;
}

async function runMigration(): Promise<void> {
  console.log("=================================================================");
  console.log("Starting Firestore clinicId Migration Script");
  console.log(`Target clinicId: "${TARGET_CLINIC_ID}"`);
  console.log(`Collections count: ${COLLECTIONS_TO_MIGRATE.length}`);
  console.log("=================================================================\n");

  const summary: MigrationSummary = {
    totalScanned: 0,
    totalUpdated: 0,
    failures: [],
  };

  let currentBatch = db.batch();
  let currentBatchCount = 0;

  for (const collectionName of COLLECTIONS_TO_MIGRATE) {
    console.log(`\n--- Scanning Collection: "${collectionName}" ---`);
    try {
      const snapshot = await db.collection(collectionName).get();
      console.log(`Found ${snapshot.size} documents in "${collectionName}".`);

      for (const docSnap of snapshot.docs) {
        summary.totalScanned++;
        const data = docSnap.data();

        if (
          data.clinicId === undefined ||
          data.clinicId === null ||
          data.clinicId === "" ||
          data.clinicId === "default"
        ) {
          const docPath = `${collectionName}/${docSnap.id}`;
          console.log(
            `[UPDATE REQUIRED] ${docPath} -> setting clinicId: "${TARGET_CLINIC_ID}"`
          );

          summary.totalUpdated++;

          if (!DRY_RUN) {
            currentBatch.update(docSnap.ref, { clinicId: TARGET_CLINIC_ID });
            currentBatchCount++;

            if (currentBatchCount >= BATCH_LIMIT) {
              console.log(
                `\n[BATCH COMMIT] Committing batch of ${currentBatchCount} updates...`
              );
              await currentBatch.commit();
              currentBatch = db.batch();
              currentBatchCount = 0;
              console.log("[BATCH COMMIT] Batch committed successfully.\n");
            }
          }
        }
      }
    } catch (err: any) {
      console.error(
        `[ERROR] Failed scanning collection "${collectionName}":`,
        err?.message || err
      );
      summary.failures.push({
        path: collectionName,
        error: err?.message || String(err),
      });
    }
  }

  if (currentBatchCount > 0 && !DRY_RUN) {
    try {
      console.log(
        `\n[FINAL BATCH COMMIT] Committing remaining ${currentBatchCount} updates...`
      );
      await currentBatch.commit();
      console.log("[FINAL BATCH COMMIT] Final batch committed successfully.");
    } catch (err: any) {
      console.error(
        "[ERROR] Failed committing final batch:",
        err?.message || err
      );
      summary.failures.push({
        path: "final_batch_commit",
        error: err?.message || String(err),
      });
    }
  }

  console.log("\n=================================================================");
  console.log("MIGRATION SUMMARY REPORT");
  console.log("=================================================================");
  console.log(`Mode:                    ${DRY_RUN ? "DRY RUN (no changes written)" : "LIVE (changes committed)"}`);
  console.log(`Total Documents Scanned: ${summary.totalScanned}`);
  console.log(`Total Documents Updated: ${summary.totalUpdated}`);
  console.log(`Total Failures:          ${summary.failures.length}`);

  if (summary.failures.length > 0) {
    console.log("\n--- Failure Details ---");
    summary.failures.forEach((f, idx) => {
      console.log(
        `${idx + 1}. Path/Target: ${f.path} | Error: ${f.error}`
      );
    });
  }
  console.log("=================================================================\n");
}

runMigration().catch((error) => {
  console.error("Fatal Migration Error:", error);
  process.exit(1);
});