"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { t } from "@/lib/messages";

export function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t.login.error);
      const next = params.get("next");
      // نسمح فقط بمسارات داخلية
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Lock className="size-5 text-slate-500" aria-hidden />
        <h1 className="text-lg font-semibold">{t.appName}</h1>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          {t.login.password}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      <p aria-live="assertive" className="min-h-5 text-sm text-red-600">
        {error}
      </p>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {t.login.submit}
      </button>
    </form>
  );
}
