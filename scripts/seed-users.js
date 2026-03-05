#!/usr/bin/env node
/**
 * Seed script: creates 10 test users (8 patients, 2 RDs) in Firebase Auth.
 * Usage: node scripts/seed-users.js
 * Requires: FIREBASE_SERVICE_ACCOUNT_PATH env var or service account at default path
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "..", "blendwise-nutrition-82c55de70d81.json");

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error(
    `Could not load service account from: ${SERVICE_ACCOUNT_PATH}`
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);

const USERS = [
  // 8 Patients
  { email: "patient1@blendwise.test", displayName: "Alice Johnson", role: "patient" },
  { email: "patient2@blendwise.test", displayName: "Bob Williams", role: "patient" },
  { email: "patient3@blendwise.test", displayName: "Carol Davis", role: "patient" },
  { email: "patient4@blendwise.test", displayName: "David Martinez", role: "patient" },
  { email: "patient5@blendwise.test", displayName: "Emily Brown", role: "patient" },
  { email: "patient6@blendwise.test", displayName: "Frank Wilson", role: "patient" },
  { email: "patient7@blendwise.test", displayName: "Grace Lee", role: "patient" },
  { email: "patient8@blendwise.test", displayName: "Henry Taylor", role: "patient" },
  // 2 RDs
  { email: "rd1@blendwise.test", displayName: "Dr. Sarah Chen, RD", role: "rd" },
  { email: "rd2@blendwise.test", displayName: "Dr. Michael Park, RD", role: "rd" },
];

async function seedUsers() {
  console.log("Seeding 10 test users...\n");

  for (const user of USERS) {
    try {
      // Check if user exists
      try {
        const existing = await auth.getUserByEmail(user.email);
        console.log(`  [EXISTS] ${user.email} (uid: ${existing.uid})`);
        // Ensure custom claims are set
        await auth.setCustomUserClaims(existing.uid, { role: user.role });
        continue;
      } catch {
        // User doesn't exist — create
      }

      const created = await auth.createUser({
        email: user.email,
        password: "Test1234!",
        displayName: user.displayName,
        emailVerified: true,
      });

      await auth.setCustomUserClaims(created.uid, { role: user.role });

      console.log(
        `  [CREATED] ${user.email} (uid: ${created.uid}, role: ${user.role})`
      );
    } catch (err) {
      console.error(`  [ERROR] ${user.email}: ${err.message}`);
    }
  }

  console.log("\nDone! All users have password: Test1234!");
  process.exit(0);
}

seedUsers();
