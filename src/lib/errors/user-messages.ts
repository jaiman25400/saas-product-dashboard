import { FirebaseError } from "firebase/app";

import { ApiError } from "@/lib/api/client";

/** User-facing copy — safe to show in the UI. */
export const USER_ERRORS = {
  generic: "Something went wrong. Please try again.",
  validationFailed: "Please check your input and try again.",
  unauthorized: "Please sign in to continue.",
  forbidden: "You do not have permission to perform this action.",
  notFound: "The requested item was not found.",
  invalidCursor: "Unable to load this page. Please refresh and try again.",
  signUpFailed: "Unable to create your account. Please try again.",
  signInFailed: "Unable to sign in. Please check your credentials and try again.",
  sessionFailed: "Unable to start your session. Please try again.",
  registrationFailed: "Unable to complete registration. Please try again.",
  loadSummaryFailed: "Unable to load dashboard metrics.",
  loadProductsFailed: "Unable to load products.",
  loadCategoriesFailed: "Unable to load categories.",
  refreshFailed: "Unable to refresh the dashboard.",
  deleteProductFailed: "Unable to delete this product.",
  saveProductFailed: "Unable to save this product.",
  requestFailed: "Unable to complete your request. Please try again.",
} as const;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/operation-not-allowed": "Email and password sign-in is not available.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/invalid-login-credentials": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
};

/** Maps internal server error messages to user-facing copy. */
const SERVER_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: USER_ERRORS.unauthorized,
  Forbidden: USER_ERRORS.forbidden,
  "Product not found": USER_ERRORS.notFound,
  "Invalid cursor": USER_ERRORS.invalidCursor,
  "Validation failed": USER_ERRORS.validationFailed,
  "No fields provided to update": USER_ERRORS.validationFailed,
  "Missing or invalid Authorization header": USER_ERRORS.unauthorized,
  "Failed to create session": USER_ERRORS.sessionFailed,
  "Failed to register user profile": USER_ERRORS.registrationFailed,
  "Registration failed": USER_ERRORS.registrationFailed,
  "Request failed": USER_ERRORS.requestFailed,
};

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: USER_ERRORS.validationFailed,
  401: USER_ERRORS.unauthorized,
  403: USER_ERRORS.forbidden,
  404: USER_ERRORS.notFound,
  429: "Too many requests. Please wait a moment and try again.",
  500: USER_ERRORS.generic,
};

function cleanFirebaseMessage(message: string): string {
  return message
    .replace(/^Firebase:\s*/i, "")
    .replace(/\s*\(auth\/[^)]+\)\.?\s*$/i, "")
    .trim();
}

function isInternalMessage(message: string): boolean {
  return /firebase|firestore|grpc|ECONNREFUSED|admin sdk|private key|secret|token expired/i.test(
    message,
  );
}

function getFirebaseAuthMessage(error: FirebaseError, fallback: string): string {
  const mapped = AUTH_ERROR_MESSAGES[error.code];

  if (mapped) {
    return mapped;
  }

  const cleaned = cleanFirebaseMessage(error.message);
  return cleaned && !isInternalMessage(cleaned) ? cleaned : fallback;
}

export function getUserErrorMessage(
  error: unknown,
  fallback: string = USER_ERRORS.generic,
): string {
  if (error instanceof ApiError) {
    return (
      SERVER_ERROR_MESSAGES[error.message] ??
      HTTP_STATUS_MESSAGES[error.status] ??
      fallback
    );
  }

  if (error instanceof FirebaseError) {
    return getFirebaseAuthMessage(error, fallback);
  }

  if (error instanceof Error) {
    const mapped = SERVER_ERROR_MESSAGES[error.message];

    if (mapped) {
      return mapped;
    }

    if (error.message.includes("Firebase:") || error.message.includes("auth/")) {
      const cleaned = cleanFirebaseMessage(error.message);
      return cleaned && !isInternalMessage(cleaned) ? cleaned : fallback;
    }

    if (isInternalMessage(error.message)) {
      return fallback;
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  return fallback;
}

/** @deprecated Use getUserErrorMessage — kept for auth-provider imports */
export function getAuthErrorMessage(
  error: unknown,
  fallback: string = USER_ERRORS.generic,
): string {
  return getUserErrorMessage(error, fallback);
}

export function getApiErrorResponse(
  error: unknown,
): { message: string; status: number } {
  if (error instanceof Error) {
    switch (error.message) {
      case "Unauthorized":
        return { message: USER_ERRORS.unauthorized, status: 401 };
      case "Forbidden":
        return { message: USER_ERRORS.forbidden, status: 403 };
      case "Product not found":
        return { message: USER_ERRORS.notFound, status: 404 };
      case "Invalid cursor":
        return { message: USER_ERRORS.invalidCursor, status: 400 };
      case "No fields provided to update":
        return { message: USER_ERRORS.validationFailed, status: 400 };
      case "Missing or invalid Authorization header":
        return { message: USER_ERRORS.unauthorized, status: 401 };
      default:
        break;
    }
  }

  return { message: USER_ERRORS.generic, status: 500 };
}
