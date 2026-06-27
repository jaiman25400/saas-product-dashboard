import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            SaaS Product Dashboard
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900">
            Product management for your team
          </h1>
          <p className="text-zinc-600">
            Sign in to manage products, or create an account to get started.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
