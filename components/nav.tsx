"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarClock, LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { DailyCounter } from "./daily-counter";
import { t } from "@/lib/messages";

const LINKS = [
  { href: "/", label: t.nav.offices, icon: Building2 },
  { href: "/today", label: t.nav.today, icon: CalendarClock },
  { href: "/collect", label: t.nav.collect, icon: Search },
  { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
  { href: "/settings", label: t.nav.settings, icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="me-4 font-semibold text-slate-900">{t.appName}</span>
        <nav aria-label={t.nav.menu} className="flex flex-wrap gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <DailyCounter />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="size-4" aria-hidden />
            {t.nav.logout}
          </button>
        </div>
      </div>
    </header>
  );
}
