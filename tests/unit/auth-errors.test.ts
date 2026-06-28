import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";
import { apiErrorResponse } from "@/lib/api/errors";
import {
  USER_ERRORS,
  getUserErrorMessage,
} from "@/lib/errors/user-messages";

describe("getUserErrorMessage", () => {
  it("maps weak-password to a clean message", () => {
    const error = new FirebaseError(
      "auth/weak-password",
      "Firebase: Password should be at least 6 characters (auth/weak-password).",
    );

    expect(getUserErrorMessage(error)).toBe(
      "Password should be at least 6 characters.",
    );
  });

  it("maps ApiError status codes to user-friendly copy", () => {
    const error = new ApiError(USER_ERRORS.unauthorized, 401);

    expect(getUserErrorMessage(error)).toBe(USER_ERRORS.unauthorized);
  });

  it("hides internal server messages", () => {
    const error = new Error("Firestore gRPC connection failed");

    expect(getUserErrorMessage(error, USER_ERRORS.generic)).toBe(
      USER_ERRORS.generic,
    );
  });
});

describe("apiErrorResponse", () => {
  it("maps Unauthorized to 401 with friendly copy", async () => {
    const response = apiErrorResponse(new Error("Unauthorized"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: USER_ERRORS.unauthorized });
  });

  it("maps Forbidden to 403 with friendly copy", async () => {
    const response = apiErrorResponse(new Error("Forbidden"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: USER_ERRORS.forbidden });
  });

  it("maps Product not found to 404 with friendly copy", async () => {
    const response = apiErrorResponse(new Error("Product not found"));

    expect(response.status).toBe(404);
  });

  it("maps Invalid cursor to 400 with friendly copy", async () => {
    const response = apiErrorResponse(new Error("Invalid cursor"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: USER_ERRORS.invalidCursor });
  });
});
