import { ShieldCheck } from "lucide-react";
import { getSettings } from "@/lib/db";
import { t } from "@/lib/messages";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">{t.settings.title}</h1>
      <SettingsForm initial={getSettings()} />
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-emerald-600" aria-hidden />
          {t.settings.safetyTitle}
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
          {t.settings.safety.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
