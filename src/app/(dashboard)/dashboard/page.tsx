import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-2 text-zinc-600">
          Phase 2 auth is working. Product management UI arrives in Phase 4.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Signed in as</p>
          <p className="mt-1 font-medium text-zinc-900">{user?.email}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Role</p>
          <p className="mt-1 font-medium uppercase text-zinc-900">{user?.role}</p>
        </div>
      </div>
    </div>
  );
}
