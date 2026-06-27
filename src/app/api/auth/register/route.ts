import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/auth/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Role } from "@/types/role";

async function resolveRoleForNewUser(): Promise<Role> {
  const snapshot = await getAdminDb().collection(COLLECTIONS.users).limit(1).get();
  return snapshot.empty ? "admin" : "viewer";
}

export async function POST(request: NextRequest) {
  try {
    const claims = await verifyBearerToken(
      request.headers.get("authorization"),
    );

    const role = await resolveRoleForNewUser();

    await getAdminAuth().setCustomUserClaims(claims.uid, { role });

    await getAdminDb()
      .collection(COLLECTIONS.users)
      .doc(claims.uid)
      .set(
        {
          email: claims.email ?? "",
          role,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
