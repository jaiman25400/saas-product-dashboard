/** Roles supported by the app — mirrored in Firebase custom claims. */
export const ROLES = ["admin", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export function isAdmin(role: Role): boolean {
  return role === "admin";
}
