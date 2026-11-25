"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Star, AlertTriangle } from "lucide-react";
import { api } from "@/lib/client-api";
import { STALE_DATA_DAYS, STATUSES, type OfficeStatus } from "@/lib/constants";
import { formatDate, formatDateTime, fromDateInputValue, toDateInputValue } from "@/lib/format";
import { t } from "@/lib/messages";
import { canContact } from "@/lib/outreach";
import { pickMobile } from "@/lib/phone";
import type { Office, TodayCounter } from "@/lib/types";
import { useToast } from "./toast";
import { WhatsAppButton } from "./whatsapp-button";

type Props = {
  office: Office;
  counter: TodayCounter | null;
  onChange: (office: Office) => void;
  onCounter: (counter: TodayCounter) => void;
};

const STATUS_STYLES: Record<OfficeStatus, string> = {
  not_contacted: "bg-white border-slate-300",
  contacted: "bg-sky-50 border-sky-300",
  replied: "bg-amber-50 border-amber-300",
  interested: "bg-teal-50 border-teal-300",
  registered: "bg-emerald-50 border-emerald-300",
  refused: "bg-red-50 border-red-300",
  do_not_contact: "bg-slate-100 border-slate-400",
};

const DAY_MS = 86_400_000;

export function OfficeRow({ office, counter, onChange, onCounter }: Props) {
  const notify = useToast();
  const [notes, setNotes] = useState(office.notes);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setNotes(office.notes), [office.notes]);

  async function patch(body: Record<string, unknown>) {
    try {
      const data = await api<{ office: Office }>(`/api/offices/${office.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      onChange(data.office);
      notify(t.table.saved);
    } catch (err) {
      notify(err instanceof Error ? err.message : t.table.saveError, "error");
      setNotes(office.notes);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const data = await api<{ office: Office }>(`/api/offices/${office.id}/refresh`, { method: "POST" });
      onChange(data.office);
      notify(t.refresh.done);
    } catch (err) {
      notify(err instanceof Error ? err.message : t.refresh.error, "error");
    } finally {
      setRefreshing(false);
    }
  }

  const phone = pickMobile(office.internationalPhone, office.nationalPhone);
  const check = canContact(office, {
    countToday: counter?.count ?? 0,
    dailyLimit: counter?.limit ?? 0,
  });
  // قبل تحميل العداد نعطّل الزر احتياطاً
  const effectiveCheck = counter ? check : { ok: false as const, block: { kind: "daily_limit" as const, limit: 0 } };
  const stale = Date.now() - new Date(office.dataUpdatedAt).getTime() > STALE_DATA_DAYS * DAY_MS;
  const followupOverdue = office.nextFollowupAt && new Date(office.nextFollowupAt).getTime() < Date.now();

  return (
    <tr className="border-b border-slate-100 align-top hover:bg-slate-50/60">
      <td className="min-w-40 px-2 py-3">
        <div className="font-medium text-slate-900">{office.name}</div>
        {office.businessStatus === "CLOSED_TEMPORARILY" && (
          <span className="mt-1 inline-block rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
            {t.table.closedTemporarily}
          </span>
        )}
        <div className={`mt-1 flex items-center gap-1 text-xs ${stale ? "text-amber-700" : "text-slate-400"}`}>
          {stale && <AlertTriangle className="size-3" aria-hidden />}
          <span title={t.table.dataUpdated(formatDateTime(office.dataUpdatedAt))}>
            {stale ? t.table.staleData : formatDate(office.dataUpdatedAt)}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-sm">{office.city}</td>
      <td className="min-w-36 max-w-52 px-2 py-3 text-sm text-slate-600">{office.address ?? "—"}</td>
      <td className="whitespace-nowrap px-2 py-3 text-sm">
        {office.rating !== null ? (
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            <span className="tabular font-medium">{office.rating.toFixed(1)}</span>
            <span className="tabular text-xs text-slate-500">{t.table.reviews(office.ratingCount ?? 0)}</span>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-sm">
        <span dir="ltr" className="tabular">
          {office.nationalPhone ?? t.table.noPhone}
        </span>
        {phone.ok && (
          <div dir="ltr" className="tabular text-end text-xs text-slate-400">
            {phone.number}
          </div>
        )}
      </td>
      <td className="px-2 py-3">
        {office.mapsUri ? (
          <a
            href={office.mapsUri}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.table.openMap}
            title={t.table.openMap}
            className="inline-flex rounded-sm p-1 text-sky-700 hover:bg-sky-50"
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="px-2 py-3">
        <select
          aria-label={t.table.statusFor(office.name)}
          value={office.status}
          onChange={(e) => patch({ status: e.target.value })}
          className={`rounded-md border px-2 py-1 text-sm ${STATUS_STYLES[office.status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-sm text-slate-600">{formatDateTime(office.lastContactAt)}</td>
      <td className="px-2 py-3">
        <input
          type="date"
          aria-label={t.table.followupFor(office.name)}
          value={toDateInputValue(office.nextFollowupAt)}
          onChange={(e) => patch({ nextFollowupAt: e.target.value ? fromDateInputValue(e.target.value) : null })}
          className={`rounded-md border px-2 py-1 text-sm ${
            followupOverdue ? "border-amber-400 bg-amber-50" : "border-slate-300"
          }`}
        />
      </td>
      <td className="min-w-36 px-2 py-3">
        <textarea
          aria-label={t.table.notesFor(office.name)}
          value={notes}
          placeholder={t.table.notesPlaceholder}
          maxLength={2000}
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== office.notes) patch({ notes });
          }}
          className="w-full resize-y rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-2 py-3">
        <div className="flex items-start gap-2">
          <WhatsAppButton
            office={office}
            check={effectiveCheck}
            onContacted={(o, c) => {
              onChange(o);
              onCounter(c);
            }}
          />
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label={t.refresh.label(office.name)}
            title={t.refresh.button}
            className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}
