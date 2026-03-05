import { prisma } from "@/lib/db/prisma";
import { ServerUser } from "@/lib/firebase/server-auth";

/**
 * Check if the given user (by uid) is an RD assigned to the given patient.
 */
export async function isRdForPatient(rdUid: string, patientId: string): Promise<boolean> {
  const assignment = await prisma.rdPatientAssignment.findFirst({
    where: {
      rdId: rdUid,
      patientId,
      status: "active",
    },
  });
  return !!assignment;
}

/**
 * Assert that the user has the given role. Throws if not.
 */
export function assertRole(user: ServerUser | null, role: string): asserts user is ServerUser {
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.role !== role && user.role !== "admin") {
    throw new Error("Forbidden");
  }
}
