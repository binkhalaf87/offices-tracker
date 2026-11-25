"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { api, COUNTER_EVENT } from "@/lib/client-api";
import { blockReasonText, t } from "@/lib/messages";
import type { ContactCheck } from "@/lib/outreach";
import type { Office, TodayCounter } from "@/lib/types";
import { useToast } from "./toast";

type Props = {
  office: Office;
  check: ContactCheck;
  onContacted: (office: Office, counter: TodayCounter) => void;
};

/**
 * يفتح محادثة واتساب واحدة برسالة جاهزة. لا يرسل شيئاً — المستخدم يضغط «إرسال» بنفسه.
 * نفتح النافذة فوراً (قبل الطلب) حتى لا يمنعها المتصفح، ثم نوجّهها للرابط بعد موافقة الخادم.
 */
export function WhatsAppButton({ office, check, onContacted }: Props) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const reasonId = `wa-reason-${office.id}`;

  const label = !check.ok
    ? t.whatsapp.button
    : check.isFollowup
      ? t.whatsapp.followup
      : office.contactCount > 0 || office.lastContactAt
        ? t.whatsapp.continue
        : t.whatsapp.button;

  async function open() {
    if (!check.ok || busy) return;
    const win = window.open("", "_blank");
    if (!win) {
      notify(t.whatsapp.popupBlocked, "error");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ url: string; office: Office; counter: TodayCounter }>(
        `/api/offices/${office.id}/contact`,
        { method: "POST" },
      );
      win.opener = null;
      win.location.href = data.url;
      onContacted(data.office, data.counter);
      window.dispatchEvent(new CustomEvent(COUNTER_EVENT, { detail: data.counter }));
      notify(t.whatsapp.opened(office.name));
    } catch (err) {
      win.close();
      notify(err instanceof Error ? err.message : t.whatsapp.error, "error");
      window.dispatchEvent(new CustomEvent(COUNTER_EVENT));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-36 flex-col gap-1">
      <button
        type="button"
        onClick={open}
        disabled={!check.ok || busy}
        aria-describedby={!check.ok ? reasonId : undefined}
        className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        <MessageCircle className="size-4" aria-hidden />
        {busy ? t.whatsapp.opening : label}
      </button>
      {!check.ok && (
        <p id={reasonId} className="text-xs leading-snug text-slate-500">
          {blockReasonText(check.block)}
        </p>
      )}
    </div>
  );
}
