import { cookies } from "next/headers";
import { adminAuth } from "./admin";

export interface ServerUser {
  uid: string;
  email: string | null;
  role: string;
  admin: boolean;
}

export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      return null;
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    return {
      uid: decoded.uid,
      email: decoded.email || null,
      role: (decoded.role as string) || "patient",
      admin: decoded.admin === true,
    };
  } catch {
    return null;
  }
}
