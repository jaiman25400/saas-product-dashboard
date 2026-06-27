import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * Temporary health route — confirms Admin SDK + env vars are wired.
 * Remove or restrict before production deploy.
 */
export async function GET() {
  try {
    await getAdminAuth().listUsers(1);
    return NextResponse.json({ ok: true, firebase: "admin-connected" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Firebase error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
