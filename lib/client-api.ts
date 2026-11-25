"use client";

import { t } from "./messages";

/** غلاف fetch للواجهة: يرمي Error برسالة الخادم، ويعيد للدخول عند انتهاء الجلسة. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error(t.login.error);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? t.common.unexpected);
  return data as T;
}

export const COUNTER_EVENT = "offices:counter";
