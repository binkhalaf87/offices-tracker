"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { api, COUNTER_EVENT } from "@/lib/client-api";
import { CITIES, DEFAULT_TEMPLATE, MAX_DAILY_LIMIT } from "@/lib/constants";
import { t } from "@/lib/messages";
import type { Settings } from "@/lib/types";
import { renderTemplate } from "@/lib/whatsapp";
import { useToast } from "@/components/toast";

export function SettingsForm({ initial }: { initial: Settings }) {
  const notify = useToast();
  const [template, setTemplate] = useState(initial.template);
  const [dailyLimit, setDailyLimit] = useState(String(initial.dailyLimit));
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api<{ settings: Settings }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ template, dailyLimit: Number(dailyLimit) }),
      });
      setTemplate(data.settings.template);
      setDailyLimit(String(data.settings.dailyLimit));
      notify(t.settings.saved);
      window.dispatchEvent(new CustomEvent(COUNTER_EVENT));
    } catch (err) {
      notify(err instanceof Error ? err.message : t.settings.error, "error");
    } finally {
      setBusy(false);
    }
  }

  const preview = renderTemplate(template, { officeName: t.settings.previewOffice, city: CITIES[0].name });

  return (
    <form onSubmit={save} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="s-template" className="block text-sm font-medium text-slate-700">
            {t.settings.template}
          </label>
          <button
            type="button"
            onClick={() => setTemplate(DEFAULT_TEMPLATE)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="size-3" aria-hidden />
            {t.settings.resetTemplate}
          </button>
        </div>
        <textarea
          id="s-template"
          rows={7}
          maxLength={1500}
          required
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          aria-describedby="s-template-help"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-relaxed"
        />
        <p id="s-template-help" className="text-xs text-slate-500">
          {t.settings.templateHelp}
        </p>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-sm font-medium text-slate-700">{t.settings.preview}</h2>
        <div className="whitespace-pre-wrap rounded-md bg-emerald-50 p-3 text-sm leading-relaxed text-slate-800">
          {preview}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="s-limit" className="block text-sm font-medium text-slate-700">
          {t.settings.dailyLimit}
        </label>
        <input
          id="s-limit"
          type="number"
          min={1}
          max={MAX_DAILY_LIMIT}
          step={1}
          required
          value={dailyLimit}
          onChange={(e) => setDailyLimit(e.target.value)}
          aria-describedby="s-limit-help"
          className="w-32 rounded-md border border-slate-300 px-3 py-2"
        />
        <p id="s-limit-help" className="text-xs text-slate-500">
          {t.settings.dailyLimitHelp}
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <Save className="size-4" aria-hidden />
        {busy ? t.settings.saving : t.settings.save}
      </button>
    </form>
  );
}
