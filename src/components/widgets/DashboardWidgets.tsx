import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  attention,
  collections,
  officers,
  payments,
  stats,
  toneClasses,
  withdrawals,
  type Tone,
} from "../../lib/DashboardData";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:bg-slate-900  ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function ViewAll({
  href,
  label = "View all",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      to={href}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-900"
    >
      {label}
    </Link>
  );
}

const dotTone: Record<Tone, string> = {
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  info: "bg-sky-600",
  neutral: "bg-slate-400",
};
const noteTone: Record<Tone, string> = {
  success: "text-emerald-700",
  warning: "text-amber-700",
  info: "text-slate-600",
  neutral: "text-slate-600 dark:text-white",
};

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-5">
      {stats.map((s, i) => (
        <Link
          key={s.label}
          to={s.href}
          className={`rounded-2xl border border-slate-200 bg-white p-4 dark:text-white dark:bg-slate-900 transition hover:border-emerald-600 sm:p-5 ${i === stats.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-white sm:text-sm">
              {s.label}
            </span>
            <span
              className={`size-2.5 shrink-0 rounded-full ${dotTone[s.tone]}`}
              aria-hidden="true"
            />
          </span>
          <span className="mt-2 block text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            {s.value}
          </span>
          <span
            className={`mt-1 block text-xs font-semibold sm:text-sm ${noteTone[s.tone]}`}
          >
            {s.note}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function CollectionsChart() {
  const max = Math.max(...collections.map((d) => d.transfer + d.cash));
  return (
    <Card
      title="Collections, last 14 days"
      action={
        <div className="flex gap-4 text-xs text-slate-600 dark:text-white">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-700" /> Transfer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-200" /> Cash
          </span>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[120px]">
          <ul className="flex h-48 items-end gap-1.5 border-b border-slate-200 sm:gap-2.5">
            {collections.map((d) => (
              <li
                key={d.day}
                className="flex h-full flex-1 flex-col justify-end gap-0.5"
                title={`${d.day}: ₦${d.transfer}k transfer, ₦${d.cash}k cash`}
              >
                <span className="sr-only">{`${d.day}: ₦${d.transfer},000 by transfer and ₦${d.cash},000 in cash`}</span>
                <span
                  className="rounded-t bg-emerald-200"
                  style={{ height: `${(d.cash / max) * 100}%` }}
                />
                <span
                  className="rounded-sm bg-emerald-700"
                  style={{ height: `${(d.transfer / max) * 100}%` }}
                />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-1.5 sm:gap-2.5" aria-hidden="true">
            {collections.map((d) => (
              <span
                key={d.day}
                className="flex-1 text-center text-[11px] text-slate-500"
              >
                {d.day.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function CashInHand() {
  return (
    <Card title="Cash in hand by officer" action={<ViewAll href="/cash" />}>
      <ul className="divide-y divide-slate-100">
        {officers.map((o) => (
          <li key={o.id}>
            <Link
              to={`/cash/${o.id}`}
              className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-500 dark:text-white text-xs font-extrabold text-slate-600">
                {o.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {o.name}
                </span>
                <span
                  className={`block text-xs font-semibold ${o.overdue ? "text-amber-700" : "text-slate-500 dark:text-white"}`}
                >
                  {o.age}
                </span>
              </span>
              <span className="text-sm font-extrabold">{o.amount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function WithdrawalsDue() {
  return (
    <Card
      title="Withdrawals due this week"
      action={<ViewAll href="/withdrawals" />}
    >
      <ul className="divide-y divide-slate-100">
        {withdrawals.map((w) => (
          <li key={w.id}>
            <Link
              to={`/withdrawals/${w.id}`}
              className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              <span className="w-11 shrink-0 rounded-lg bg-emerald-50 dark:bg-slate-500 py-1 text-center">
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-white">
                  {w.weekday}
                </span>
                <span className="block text-base font-extrabold">{w.date}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {w.member}
                </span>
                <Pill tone={w.tone}>{w.status}</Pill>
              </span>
              <span className="text-sm font-extrabold">{w.amount}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> Account
        balance covers this week's withdrawals.
      </p>
    </Card>
  );
}

export function RecentPayments() {
  return (
    <Card className="bg-slate-300"
      title="Recent payments"
      action={<ViewAll href="/payments" label="View all payments" />}
    >
      {/* Cards on phones */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {payments.map((p) => (
          <li
            key={p.id}
            className="flex items-start justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.member}</p>
              <p className="truncate text-xs text-slate-500">
                {p.time}, {p.channel}, {p.group}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-extrabold">{p.amount}</p>
              <Pill tone={p.tone}>{p.status}</Pill>
            </div>
          </li>
        ))}
      </ul>
      {/* Table from md up */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-white ">
              <th className="py-2.5 pr-3 font-semibold">Time</th>
              <th className="px-3 py-2.5 font-semibold">Member</th>
              <th className="px-3 py-2.5 font-semibold">Group</th>
              <th className="px-3 py-2.5 font-semibold">Channel</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="py-2.5 pl-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                <td className="py-3.5 pr-3 text-slate-500 dark:text-white">
                  {p.time}
                </td>
                <td className="px-3 py-3.5 font-semibold">
                  <Link
                    to={`/payments/${p.id}`}
                    className="hover:text-emerald-700"
                  >
                    {p.member}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-slate-600 dark:text-white">
                  {p.group}
                </td>
                <td className="px-3 py-3.5 text-slate-600 dark:text-white">
                  {p.channel}
                </td>
                <td className="px-3 py-3.5">
                  <Pill tone={p.tone}>{p.status}</Pill>
                </td>
                <td className="py-3.5 pl-3 text-right font-extrabold">
                  {p.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function NeedsAttention() {
  return (
    <Card
      title="Needs attention"
      action={<Pill tone="warning">{attention.length} open</Pill>}
    >
      <ul className="divide-y divide-slate-100">
        {attention.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-extrabold text-amber-800">
              {a.count}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
              <p className="text-xs text-slate-500 sm:text-sm dark:text-white">{a.detail}</p>
            </div>
            <Link
              to={a.href}
              className="ml-14 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 dark:text-white hover:border-emerald-600 hover:text-emerald-700 sm:ml-0"
            >
              {a.action}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
