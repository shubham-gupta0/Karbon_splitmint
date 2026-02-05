import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Project Configuration
const FIREBASE_PROJECT_ID = "karbon-splitmint";

// Initialize Firebase Admin
let db;

export function initializeFirebase() {
  if (!admin.apps.length) {
    // For production (Vercel): Use service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    try {
      if (serviceAccount) {
        // Production: Use full service account credentials
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: FIREBASE_PROJECT_ID,
        });
        console.log("✅ Firebase initialized with service account");
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Local development: Use service account file path
        admin.initializeApp({
          projectId: FIREBASE_PROJECT_ID,
        });
        console.log("✅ Firebase initialized with credentials file");
      } else {
        // Fallback: Use project ID only (limited functionality)
        console.warn(
          "⚠️  No Firebase credentials found. Some features may not work.",
        );
        console.warn(
          "   Set FIREBASE_SERVICE_ACCOUNT for production or GOOGLE_APPLICATION_CREDENTIALS for local dev",
        );
        admin.initializeApp({
          projectId: FIREBASE_PROJECT_ID,
        });
      }

      db = getFirestore();

      // Set Firestore settings
      db.settings({
        ignoreUndefinedProperties: true,
      });

      console.log(`🔥 Firestore connected to project: ${FIREBASE_PROJECT_ID}`);
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error.message);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  return db;
}

export function getDb() {
  if (!db) {
    db = initializeFirebase();
  }
  return db;
}

export default admin;
