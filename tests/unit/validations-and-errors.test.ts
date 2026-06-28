import { describe, expect, it } from "vitest";

import {
  createProductSchema,
  listProductsQuerySchema,
} from "@/lib/validations/product";

describe("createProductSchema", () => {
  it("accepts valid product input (positive)", () => {
    const result = createProductSchema.safeParse({
      name: "Wireless Mouse",
      category: "Electronics",
      price: 29.99,
      status: "active",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty name (negative)", () => {
    const result = createProductSchema.safeParse({
      name: "",
      category: "Electronics",
      price: 29.99,
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive price (negative)", () => {
    const result = createProductSchema.safeParse({
      name: "Mouse",
      category: "Electronics",
      price: 0,
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("rejects string price — protects revenue math (negative)", () => {
    const result = createProductSchema.safeParse({
      name: "Mouse",
      category: "Electronics",
      price: "29.99",
      status: "active",
    });

    expect(result.success).toBe(false);
  });
});

describe("listProductsQuerySchema", () => {
  it("applies defaults when query is empty (positive)", () => {
    const result = listProductsQuerySchema.parse({});

    expect(result).toEqual({
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 10,
    });
  });

  it("accepts filter and sort params (positive)", () => {
    const result = listProductsQuerySchema.parse({
      status: "active",
      category: "Electronics",
      sortBy: "price",
      sortOrder: "asc",
    });

    expect(result.status).toBe("active");
    expect(result.sortBy).toBe("price");
  });

  it("rejects invalid status (negative)", () => {
    const result = listProductsQuerySchema.safeParse({
      status: "archived",
    });

    expect(result.success).toBe(false);
  });

  it("accepts search and pagination params (positive)", () => {
    const result = listProductsQuerySchema.parse({
      search: "mouse",
      limit: "20",
      cursor: "abc",
    });

    expect(result.search).toBe("mouse");
    expect(result.limit).toBe(20);
    expect(result.cursor).toBe("abc");
  });

  it("rejects limit above max (negative)", () => {
    const result = listProductsQuerySchema.safeParse({
      limit: 100,
    });

    expect(result.success).toBe(false);
  });
});
