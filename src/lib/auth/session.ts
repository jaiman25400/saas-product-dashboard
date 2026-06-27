import "server-only";

import { cookies } from "next/headers";
import { DecodedIdToken } from "firebase-admin/auth";

import {
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/types/role";

export type SessionUser = {
  uid: string;
  email: string | undefined;
  role: Role;
};

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  });
}

export async function verifySessionCookie(
  sessionCookie: string,
): Promise<DecodedIdToken> {
  return getAdminAuth().verifySessionCookie(sessionCookie, true);
}

export function extractBearerToken(
  authorizationHeader: string | null,
): string {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const idToken = authorizationHeader.slice("Bearer ".length).trim();

  if (!idToken) {
    throw new Error("Missing or invalid Authorization header");
  }

  return idToken;
}

export async function verifyBearerToken(
  authorizationHeader: string | null,
): Promise<DecodedIdToken> {
  const idToken = extractBearerToken(authorizationHeader);
  return getAdminAuth().verifyIdToken(idToken);
}

export function getRoleFromClaims(
  claims: DecodedIdToken,
): Role {
  const role = claims.role;

  if (role === "admin" || role === "viewer") {
    return role;
  }

  return "viewer";
}

export function toSessionUser(claims: DecodedIdToken): SessionUser {
  return {
    uid: claims.uid,
    email: claims.email,
    role: getRoleFromClaims(claims),
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const claims = await verifySessionCookie(sessionCookie);
    return toSessionUser(claims);
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return user;
}
