import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  USER_ERRORS,
  getApiErrorResponse,
} from "@/lib/errors/user-messages";

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: USER_ERRORS.validationFailed,
        details: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { message, status } = getApiErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}
