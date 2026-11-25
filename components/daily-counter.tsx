"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { api, COUNTER_EVENT } from "@/lib/client-api";
import { t } from "@/lib/messages";
import type { TodayCounter } from "@/lib/types";

/** عداد ظاهر دائماً لعدد المحادثات المفتوحة اليوم مقابل الحد اليومي. */
export function DailyCounter() {
  const [counter, setCounter] = useState<TodayCounter | null>(null);

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
    // يتصفّر العداد عند منتصف الليل؛ نعيد التحميل كل دقيقة
    const timer = setInterval(load, 60_000);
    return () => {
      window.removeEventListener(COUNTER_EVENT, onUpdate);
      clearInterval(timer);
    };
  }, []);

  const reached = counter ? counter.count >= counter.limit : false;
  return (
    <div
      aria-live="polite"
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
        reached ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <MessageCircle className="size-4" aria-hidden />
      <span>{t.counter.label}:</span>
      <span className="tabular font-semibold" dir="ltr">
        {counter ? `${counter.count} / ${counter.limit}` : "…"}
      </span>
      {reached && <span className="font-medium">· {t.counter.reached}</span>}
    </div>
  );
}
