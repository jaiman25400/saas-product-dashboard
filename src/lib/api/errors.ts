import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "Unauthorized":
        return NextResponse.json({ error: error.message }, { status: 401 });
      case "Forbidden":
        return NextResponse.json({ error: error.message }, { status: 403 });
      case "Product not found":
        return NextResponse.json({ error: error.message }, { status: 404 });
      default:
        return NextResponse.json(
          { error: error.message || "Internal server error" },
          { status: 500 },
        );
    }
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
