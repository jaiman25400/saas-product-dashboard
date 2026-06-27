import type { Timestamp } from "firebase/firestore";

import type { Role } from "@/types/role";

/**
 * Shape of `users/{userId}` in Firestore.
 * Document ID = Firebase Auth UID.
 */
export interface UserProfile {
  email: string;
  role: Role;
  createdAt: Timestamp;
}
