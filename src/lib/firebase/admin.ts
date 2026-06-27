import "server-only";

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

function getAdminCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  const missing = [
    !projectId && "FIREBASE_ADMIN_PROJECT_ID",
    !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
    !privateKey && "FIREBASE_ADMIN_PRIVATE_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase admin env vars: ${missing.join(", ")}. Copy .env.example to .env.local.`,
    );
  }

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey: privateKey!,
  };
}

function createAdminApp(): App {
  const credentials = getAdminCredentials();

  return initializeApp({
    credential: cert(credentials),
  });
}

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return createAdminApp();
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
