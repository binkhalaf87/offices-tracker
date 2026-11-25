import { getCityStats, type CityStats } from "@/lib/db";
import { formatPercent } from "@/lib/format";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const rows = getCityStats();
  const total: CityStats = rows.reduce(
    (acc, r) => ({
      city: t.dashboard.all,
      total: acc.total + r.total,
      contacted: acc.contacted + r.contacted,
      replied: acc.replied + r.replied,
      interested: acc.interested + r.interested,
      registered: acc.registered + r.registered,
    }),
    { city: t.dashboard.all, total: 0, contacted: 0, replied: 0, interested: 0, registered: 0 },
  );

  const cards: [string, string | number][] = [
    [t.dashboard.total, total.total],
    [t.dashboard.contacted, total.contacted],
    [t.dashboard.replied, total.replied],
    [t.dashboard.interested, total.interested],
    [t.dashboard.registered, total.registered],
    [t.dashboard.replyRate, formatPercent(total.replied, total.contacted)],
    [t.dashboard.registerRate, formatPercent(total.registered, total.contacted)],
  ];

  const headers = [
    t.dashboard.city,
    t.dashboard.total,
    t.dashboard.contacted,
    t.dashboard.replied,
    t.dashboard.interested,
    t.dashboard.registered,
    t.dashboard.replyRate,
    t.dashboard.registerRate,
  ];

  const renderRow = (r: CityStats, bold = false) => (
    <tr key={r.city} className={`border-b border-slate-100 ${bold ? "bg-slate-50 font-semibold" : ""}`}>
      <th scope="row" className="px-3 py-2 text-start font-medium">
        {r.city}
      </th>
      {[r.total, r.contacted, r.replied, r.interested, r.registered].map((v, i) => (
        <td key={i} className="tabular px-3 py-2">
          {v}
        </td>
      ))}
      <td className="tabular px-3 py-2">{formatPercent(r.replied, r.contacted)}</td>
      <td className="tabular px-3 py-2">{formatPercent(r.registered, r.contacted)}</td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t.dashboard.title}</h1>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="tabular mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t.dashboard.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                {headers.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 text-start">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => renderRow(r))}
              {renderRow(total, true)}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-500">{t.dashboard.note}</p>
    </div>
  );
}
