import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let projectId = "";
let databaseId = "";

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    projectId = config.projectId;
    databaseId = config.firestoreDatabaseId;
  }
} catch (err) {
  console.error("Error reading firebase-applet-config.json:", err);
}

if (!projectId) {
  projectId = process.env.FIREBASE_PROJECT_ID || "essential-bonsai-4tsmh";
}
if (!databaseId) {
  databaseId = process.env.FIREBASE_DATABASE_ID || "";
}

if (!projectId) {
  projectId = "essential-bonsai-4tsmh"; // fallback
}

const app = getApps().length === 0
  ? initializeApp({ projectId })
  : getApp();

export const adminAuth = getAuth(app);
export const adminDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
