import { describe, expect, it } from "vitest";

import { apiErrorResponse } from "@/lib/api/errors";
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

describe("apiErrorResponse", () => {
  it("maps Unauthorized to 401 (negative path)", async () => {
    const response = apiErrorResponse(new Error("Unauthorized"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("maps Forbidden to 403 (negative path)", async () => {
    const response = apiErrorResponse(new Error("Forbidden"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("maps Product not found to 404 (negative path)", async () => {
    const response = apiErrorResponse(new Error("Product not found"));

    expect(response.status).toBe(404);
  });

  it("maps Invalid cursor to 400 (negative path)", async () => {
    const response = apiErrorResponse(new Error("Invalid cursor"));

    expect(response.status).toBe(400);
  });
});
