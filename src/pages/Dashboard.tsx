import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, Plus } from "lucide-react";
import ExportButton from "../components/widgets/ExportButton";
import { useOrganisation } from "../lib/OrgStore";
import { moneyModeFor } from "../types/types";
import {
  CashInHand,
  CollectionsChart,
  NeedsAttention,
  RecentPayments,
  StatCards,
  WithdrawalsDue,
} from "../components/widgets/DashboardWidgets";

// Onboarding only asks for name and type, so nudge the owner to finish the rest
function FinishSetup() {
  const { organisation } = useOrganisation();
  if (!organisation) return null;

  const steps = [
    {
      label: "Verify your organisation",
      detail: "Upload your documents from your profile.",
      done: !!organisation.kyb,
      href: "/profile",
    },
    ...(moneyModeFor(organisation.type) === "ledger"
      ? []
      : [
          {
            label: "Connect payment rails",
            detail: "Link Paystack or Flutterwave in Settings.",
            done: !!organisation.rails,
            href: "/settings?tab=rails",
          },
        ]),
  ];
  if (steps.every((s) => s.done)) return null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
      <h2 className="font-bold text-emerald-900">Finish setting up</h2>
      <p className="mt-1 text-sm text-emerald-900/80">
        You can use SaveCircle now. Complete these to start collecting payments
        automatically.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.href}>
            <Link
              to={s.href}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3 hover:border-emerald-600"
            >
              {s.done ? (
                <CheckCircle2
                  className="size-5 shrink-0 text-emerald-600"
                  aria-label="Done"
                />
              ) : (
                <Circle
                  className="size-5 shrink-0 text-slate-400"
                  aria-label="To do"
                />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-semibold ${s.done ? "text-slate-500 line-through" : ""}`}
                >
                  {s.label}
                </span>
                <span className="block text-xs text-slate-500">{s.detail}</span>
              </span>
              {!s.done && (
                <ArrowRight className="size-4 shrink-0 text-emerald-700" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
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

      <FinishSetup />

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
