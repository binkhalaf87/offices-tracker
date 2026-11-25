"use client";

import { useState } from "react";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { api } from "@/lib/client-api";
import { CITIES, DEFAULT_SEARCH_PHRASES, MAX_PAGES_PER_PHRASE } from "@/lib/constants";
import { t } from "@/lib/messages";

type CollectResult = {
  requests: number;
  fetched: number;
  unique: number;
  created: number;
  updated: number;
  skippedClosed: number;
  errors: string[];
};

export function CollectForm() {
  const [city, setCity] = useState(CITIES[0].id);
  const [phrasesText, setPhrasesText] = useState(DEFAULT_SEARCH_PHRASES.join("\n"));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CollectResult | null>(null);
  const [error, setError] = useState("");

  const phrases = [...new Set(phrasesText.split("\n").map((p) => p.trim()).filter(Boolean))];

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!phrases.length) {
      setError(t.collect.noPhrases);
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await api<CollectResult>("/api/collect", { method: "POST", body: JSON.stringify({ city, phrases }) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.collect.error);
    } finally {
      setBusy(false);
    }
  }

  const stats: [string, number][] = result
    ? [
        [t.collect.requests, result.requests],
        [t.collect.fetched, result.fetched],
        [t.collect.unique, result.unique],
        [t.collect.created, result.created],
        [t.collect.updated, result.updated],
        [t.collect.skippedClosed, result.skippedClosed],
      ]
    : [];

  return (
    <form onSubmit={run} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="space-y-1.5">
        <label htmlFor="c-city" className="block text-sm font-medium text-slate-700">
          {t.collect.city}
        </label>
        <select
          id="c-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        >
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="c-phrases" className="block text-sm font-medium text-slate-700">
            {t.collect.phrases}
          </label>
          <button
            type="button"
            onClick={() => setPhrasesText(DEFAULT_SEARCH_PHRASES.join("\n"))}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="size-3" aria-hidden />
            {t.collect.resetPhrases}
          </button>
        </div>
        <textarea
          id="c-phrases"
          rows={5}
          value={phrasesText}
          onChange={(e) => setPhrasesText(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-medium">{t.collect.estimate(phrases.length, phrases.length * MAX_PAGES_PER_PHRASE)}</p>
        <p className="mt-1 text-xs text-slate-500">{t.collect.billingNote}</p>
      </div>

      <button
        type="submit"
        disabled={busy || !phrases.length}
        className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
        {busy ? t.collect.running : t.collect.run}
      </button>

      <div aria-live="polite">
        {result && (
          <div className="space-y-3">
            <h2 className="font-semibold">{t.collect.result}</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="tabular text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      <div aria-live="assertive">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && result.errors.length > 0 && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">{t.collect.errors}</p>
            <ul className="mt-1 list-inside list-disc">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
