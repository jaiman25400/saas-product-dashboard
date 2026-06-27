import { describe, expect, it } from "vitest";

import {
  decodeProductCursor,
  encodeProductCursor,
} from "@/lib/pagination/cursor";

describe("product cursor", () => {
  it("encodes and decodes a document id (round-trip)", () => {
    const documentId = "product-abc-123";
    const cursor = encodeProductCursor(documentId);

    expect(decodeProductCursor(cursor)).toBe(documentId);
  });

  it("rejects invalid cursor values (negative)", () => {
    expect(() => decodeProductCursor("not-a-valid-cursor")).toThrow(
      "Invalid cursor",
    );
  });
});
