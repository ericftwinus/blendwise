#!/usr/bin/env node
/**
 * Assigns all existing patients to all RDs.
 * Usage: node scripts/assign-all-patients.js
 * Requires: DATABASE_URL env var or .env file
 */

require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [rdProfiles, patients] = await Promise.all([
    prisma.rdProfile.findMany({ select: { userId: true } }),
    prisma.profile.findMany({
      where: { role: "patient" },
      select: { userId: true, fullName: true },
    }),
  ]);

  console.log(`Found ${rdProfiles.length} RDs and ${patients.length} patients\n`);

  if (rdProfiles.length === 0 || patients.length === 0) {
    console.log("Nothing to assign.");
    process.exit(0);
  }

  let created = 0;
  let skipped = 0;

  for (const rd of rdProfiles) {
    for (const patient of patients) {
      const result = await prisma.rdPatientAssignment.upsert({
        where: { rdId_patientId: { rdId: rd.userId, patientId: patient.userId } },
        create: { rdId: rd.userId, patientId: patient.userId },
        update: {},
      });
      if (result.createdAt.getTime() > Date.now() - 5000) {
        console.log(`  [ASSIGNED] ${patient.fullName || patient.userId} -> RD ${rd.userId}`);
        created++;
      } else {
        console.log(`  [EXISTS]   ${patient.fullName || patient.userId} -> RD ${rd.userId}`);
        skipped++;
      }
    }
  }

  console.log(`\nDone! ${created} new assignments, ${skipped} already existed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
