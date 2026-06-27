import { describe, expect, it } from "vitest";

import { GET as getLiveness } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns ok without Firebase (liveness)", async () => {
    const response = await getLiveness();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("saas-product-dashboard");
    expect(body.timestamp).toBeDefined();
  });
});
