import { NextResponse } from "next/server";

/**
 * Liveness probe — confirms the API process is up. No external dependencies.
 * Use in CI smoke tests without Firebase secrets.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "saas-product-dashboard",
    timestamp: new Date().toISOString(),
  });
}
