import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import ExportButton from "../components/widgets/ExportButton";
import {
  CashInHand,
  CollectionsChart,
  NeedsAttention,
  RecentPayments,
  StatCards,
  WithdrawalsDue,
} from "../components/widgets/DashboardWidgets";

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard | SaveCircle";
  }, []);

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Good morning, [Name]
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base dark:text-white">
            Here's what's happening across your groups today.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <ExportButton />
          <Link
            to="/groups/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Plus className="size-4" /> Create group
          </Link>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <CollectionsChart />
          <NeedsAttention />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1 xl:content-start">
          <CashInHand />
          <WithdrawalsDue />
        </div>
      </div>

      <RecentPayments />
    </div>
  );
}
