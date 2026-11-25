import { CollectForm } from "./collect-form";
import { t } from "@/lib/messages";

export default function CollectPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{t.collect.title}</h1>
      <CollectForm />
    </div>
  );
}
