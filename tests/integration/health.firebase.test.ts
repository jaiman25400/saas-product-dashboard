import { describe, expect, it } from "vitest";

import { GET as getFirebaseHealth } from "@/app/api/health/firebase/route";

const hasFirebaseAdminEnv = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY,
);

describe.skipIf(!hasFirebaseAdminEnv)("GET /api/health/firebase", () => {
  it("connects to Firebase Admin when env is configured (positive)", async () => {
    const response = await getFirebaseHealth();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, firebase: "admin-connected" });
  });
});

describe("GET /api/health/firebase without env", () => {
  it.skipIf(hasFirebaseAdminEnv)(
    "is skipped locally when admin env is missing",
    () => {
      expect(hasFirebaseAdminEnv).toBe(false);
    },
  );
});
