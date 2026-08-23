import "server-only";
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

export function getFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "sanjivanidental-499dc";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formatPrivateKey(privateKey),
      }),
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        `${projectId}.firebasestorage.app`,
    });
  }

  // Check local serviceAccountKey.json if present
  const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const fileContent = fs.readFileSync(serviceAccountPath, "utf-8");
      const serviceAccount = JSON.parse(fileContent);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          `${serviceAccount.project_id || projectId}.firebasestorage.app`,
      });
    } catch (e) {
      console.warn("[FirebaseAdmin] Failed to load serviceAccountKey.json:", e);
    }
  }

  // Fallback initialize with project ID
  return initializeApp({
    projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${projectId}.firebasestorage.app`,
  });
}

export const adminApp: App = getFirebaseAdmin();
export const adminDb: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
export const adminStorage: Storage = getStorage(adminApp);
export default adminApp;
