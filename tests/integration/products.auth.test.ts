import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireSessionUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import { GET, POST } from "@/app/api/products/route";
import { requireAdmin, requireSessionUser } from "@/lib/auth/session";

describe("products API auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when session is missing (negative)", async () => {
    vi.mocked(requireSessionUser).mockRejectedValue(new Error("Unauthorized"));

    const request = new NextRequest("http://localhost/api/products");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("POST returns 403 when user is not admin (negative)", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error("Forbidden"));

    const request = new NextRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Mouse",
        category: "Electronics",
        price: 29.99,
        status: "active",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });
});
