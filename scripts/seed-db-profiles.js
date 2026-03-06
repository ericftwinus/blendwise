#!/usr/bin/env node
/**
 * Seeds database User/Profile/RdProfile records for all Firebase Auth test users.
 * Run after seed-users.js to ensure DB records exist.
 * Usage: node scripts/seed-db-profiles.js
 */

require("dotenv/config");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "..", "blendwise-nutrition-82c55de70d81.json");

const { readFileSync } = require("fs");
const { resolve } = require("path");
const serviceAccount = JSON.parse(readFileSync(resolve(process.cwd(), SERVICE_ACCOUNT_PATH), "utf-8"));
const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_EMAILS = [
  "patient1@blendwise.test", "patient2@blendwise.test", "patient3@blendwise.test",
  "patient4@blendwise.test", "patient5@blendwise.test", "patient6@blendwise.test",
  "patient7@blendwise.test", "patient8@blendwise.test",
  "rd1@blendwise.test", "rd2@blendwise.test",
];

async function main() {
  console.log("Seeding DB profiles for test users...\n");

  for (const email of TEST_EMAILS) {
    try {
      const fbUser = await auth.getUserByEmail(email);
      const claims = fbUser.customClaims || {};
      const role = claims.role || "patient";

      await prisma.user.upsert({
        where: { id: fbUser.uid },
        create: { id: fbUser.uid, email },
        update: { email },
      });

      await prisma.profile.upsert({
        where: { userId: fbUser.uid },
        create: {
          userId: fbUser.uid,
          email,
          fullName: fbUser.displayName || null,
          role,
        },
        update: {
          fullName: fbUser.displayName || null,
          role,
        },
      });

      if (role === "rd") {
        await prisma.rdProfile.upsert({
          where: { userId: fbUser.uid },
          create: { userId: fbUser.uid },
          update: {},
        });
        console.log(`  [RD]      ${email} (${fbUser.uid})`);
      } else {
        console.log(`  [PATIENT] ${email} (${fbUser.uid})`);
      }
    } catch (err) {
      console.error(`  [ERROR]   ${email}: ${err.message}`);
    }
  }

  console.log("\nDone! Now run: node scripts/assign-all-patients.js");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
