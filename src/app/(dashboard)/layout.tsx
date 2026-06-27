import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">SaaS Product Dashboard</p>
            <p className="text-sm text-zinc-700">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
              {user.role}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
