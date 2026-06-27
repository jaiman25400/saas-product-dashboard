import Link from "next/link";
import { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            SaaS Product Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
          <p className="text-sm text-zinc-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  id,
  type,
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
      />
    </label>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function AuthFooterLink({
  text,
  href,
  linkText,
}: {
  text: string;
  href: string;
  linkText: string;
}) {
  return (
    <p className="text-center text-sm text-zinc-600">
      {text}{" "}
      <Link href={href} className="font-medium text-zinc-900 underline">
        {linkText}
      </Link>
    </p>
  );
}
