import { listOffices } from "@/lib/db";
import { officesToCsv } from "@/lib/csv";
import { applyFilters, parseFilters } from "@/lib/filters";
import { riyadhDayKey } from "@/lib/outreach";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const filters = parseFilters(new URL(req.url).searchParams);
  const csv = officesToCsv(applyFilters(listOffices(), filters));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="offices-${riyadhDayKey()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
