import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { resolve } from "path";

let app: App;

if (!getApps().length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const absolutePath = resolve(process.cwd(), serviceAccountPath);
    const serviceAccount = JSON.parse(readFileSync(absolutePath, "utf-8"));
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // In Cloud Run, uses Application Default Credentials
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export default app;
