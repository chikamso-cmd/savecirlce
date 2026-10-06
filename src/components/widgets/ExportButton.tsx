import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { payments } from "../../lib/DashboardData";

// Builds a CSV of today's payments in the browser. Swap for your /reports/export endpoint later.
export default function ExportButton() {
  const [busy, setBusy] = useState(false);

  const exportCsv = () => {
    setBusy(true);
    const header = ["Time", "Member", "Group", "Channel", "Status", "Amount"];
    const rows = payments.map((p) => [
      p.time,
      p.member,
      p.group,
      p.channel,
      p.status,
      p.amount.replace(/[₦,]/g, ""),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `savecircle-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={busy}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-[1.5px] border-emerald-700 bg-white px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Export report
    </button>
  );
}
