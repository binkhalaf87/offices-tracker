import { OfficesTable } from "@/components/offices-table";
import { t } from "@/lib/messages";

export default function OfficesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t.nav.offices}</h1>
      <OfficesTable mode="all" />
    </div>
  );
}
