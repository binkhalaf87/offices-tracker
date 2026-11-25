import { OfficesTable } from "@/components/offices-table";
import { t } from "@/lib/messages";

export default function TodayPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t.today.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.today.description}</p>
      </div>
      <OfficesTable mode="today" />
    </div>
  );
}
