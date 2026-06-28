import { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_MAX_AGE_SEC,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  createSessionCookie,
  extractBearerToken,
} from "@/lib/auth/session";
import { USER_ERRORS } from "@/lib/errors/user-messages";

export async function POST(request: NextRequest) {
  try {
    const idToken = extractBearerToken(request.headers.get("authorization"));
    const sessionCookie = await createSessionCookie(idToken);
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SEC,
    });

    return response;
  } catch (error) {
    const isAuthHeaderError =
      error instanceof Error &&
      error.message.includes("Authorization header");

    return NextResponse.json(
      {
        error: isAuthHeaderError
          ? USER_ERRORS.unauthorized
          : USER_ERRORS.sessionFailed,
      },
      { status: isAuthHeaderError ? 401 : 500 },
    );
  }
}
