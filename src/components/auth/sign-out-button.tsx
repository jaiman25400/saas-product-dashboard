"use client";

import { useAuth } from "@/contexts/auth-provider";

export function SignOutButton() {
  const { signOutUser } = useAuth();

  return (
    <button
      type="button"
      onClick={() => void signOutUser().then(() => window.location.assign("/login"))}
      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Sign out
    </button>
  );
}
