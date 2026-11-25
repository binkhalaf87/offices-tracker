"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { api, COUNTER_EVENT } from "@/lib/client-api";
import { CITIES, STATUSES } from "@/lib/constants";
import { applyFilters, DEFAULT_FILTERS, filtersToParams, SORT_KEYS, type OfficeFilters, type SortKey } from "@/lib/filters";
import { t } from "@/lib/messages";
import type { Office, TodayCounter } from "@/lib/types";
import { OfficeRow } from "./office-row";

const PAGE_SIZE = 50;

export function OfficesTable({ mode }: { mode: "all" | "today" }) {
  const [offices, setOffices] = useState<Office[] | null>(null);
  const [error, setError] = useState("");
  const [counter, setCounter] = useState<TodayCounter | null>(null);
  const [filters, setFilters] = useState<OfficeFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api<{ offices: Office[] }>(mode === "today" ? "/api/offices?due=1" : "/api/offices")
      .then((d) => setOffices(d.offices))
      .catch((err) => setError(err instanceof Error ? err.message : t.table.loadError));
  }, [mode]);

  useEffect(() => {
    const load = () =>
      api<{ counter: TodayCounter }>("/api/counter")
        .then((d) => setCounter(d.counter))
        .catch(() => {});
    load();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<TodayCounter | undefined>).detail;
      if (detail) setCounter(detail);
      else load();
    };
    window.addEventListener(COUNTER_EVENT, onUpdate);
    const timer = setInterval(load, 60_000);
    return () => {
      window.removeEventListener(COUNTER_EVENT, onUpdate);
      clearInterval(timer);
    };
  }, []);

  const updateOffice = useCallback((o: Office) => {
    setOffices((list) => list?.map((x) => (x.id === o.id ? o : x)) ?? null);
  }, []);

  const filtered = useMemo(() => (offices ? applyFilters([...offices], filters) : []), [offices, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function set<K extends keyof OfficeFilters>(key: K, value: OfficeFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  const cities = useMemo(() => {
    const fromData = new Set(offices?.map((o) => o.city) ?? []);
    for (const c of CITIES) fromData.add(c.name);
    return [...fromData];
  }, [offices]);

  return (
    <div className="space-y-4">
      {mode === "all" && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="f-q" className="text-xs font-medium text-slate-600">
              {t.filters.search}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-2 top-2 size-4 text-slate-400" aria-hidden />
              <input
                id="f-q"
                type="search"
                value={filters.q}
                placeholder={t.filters.searchPlaceholder}
                onChange={(e) => set("q", e.target.value)}
                className="w-56 rounded-md border border-slate-300 py-1.5 pe-2 ps-8 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-city" className="text-xs font-medium text-slate-600">
              {t.filters.city}
            </label>
            <select
              id="f-city"
              value={filters.city}
              onChange={(e) => set("city", e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">{t.filters.all}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-status" className="text-xs font-medium text-slate-600">
              {t.filters.status}
            </label>
            <select
              id="f-status"
              value={filters.status}
              onChange={(e) => set("status", e.target.value as OfficeFilters["status"])}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">{t.filters.all}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-rating" className="text-xs font-medium text-slate-600">
              {t.filters.minRating}
            </label>
            <select
              id="f-rating"
              value={filters.minRating}
              onChange={(e) => set("minRating", Number(e.target.value))}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value={0}>{t.filters.anyRating}</option>
              {[3, 3.5, 4, 4.5].map((r) => (
                <option key={r} value={r}>
                  {t.filters.ratingAtLeast(r)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-sort" className="text-xs font-medium text-slate-600">
              {t.filters.sort}
            </label>
            <select
              id="f-sort"
              value={filters.sort}
              onChange={(e) => set("sort", e.target.value as SortKey)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t.filters.sortOptions[k]}
                </option>
              ))}
            </select>
          </div>
          <a
            href={`/api/export?${filtersToParams(filters).toString()}`}
            className="ms-auto flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-4" aria-hidden />
            {t.filters.exportCsv}
          </a>
        </div>
      )}

      <div aria-live="polite" className="text-sm text-slate-600">
        {offices === null && !error && t.table.loading}
        {offices !== null && t.table.count(filtered.length, offices.length)}
      </div>
      {error && (
        <p aria-live="assertive" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {offices !== null && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-start">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                {[
                  t.table.name,
                  t.table.city,
                  t.table.address,
                  t.table.rating,
                  t.table.phone,
                  t.table.map,
                  t.table.status,
                  t.table.lastContact,
                  t.table.nextFollowup,
                  t.table.notes,
                  t.table.actions,
                ].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-2 py-2 text-start">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <OfficeRow key={o.id} office={o} counter={counter} onChange={updateOffice} onCounter={setCounter} />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-sm text-slate-500">
                    {mode === "today" ? t.today.empty : t.table.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            {t.table.prev}
          </button>
          <span className="tabular">{t.table.page(currentPage, pageCount)}</span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            {t.table.next}
          </button>
        </div>
      )}
    </div>
  );
}
