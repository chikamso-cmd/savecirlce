import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import type { LoanStatus } from "./Loanspage";

interface Loan { id: string; amount: number; purpose: string; status: LoanStatus; createdAt: string; applicant: string; }
const STORAGE_KEY = "savecircle:loan-requests";
const SAMPLE: Loan[] = [
  { id: "loan-1", applicant: "[Member 2]", amount: 250000, purpose: "Working capital", status: "pending", createdAt: "2026-10-28T10:00:00.000Z" },
  { id: "loan-2", applicant: "[Member 4]", amount: 500000, purpose: "Equipment purchase", status: "approved", createdAt: "2026-10-20T10:00:00.000Z" },
  { id: "loan-3", applicant: "[Member 5]", amount: 100000, purpose: "Business expansion", status: "rejected", createdAt: "2026-10-15T10:00:00.000Z" },
];
const statusClass: Record<LoanStatus, string> = { pending: "bg-amber-50 text-amber-800", approved: "bg-emerald-50 text-emerald-800", rejected: "bg-red-50 text-red-700" };

export default function LoanDetailsPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let saved: Loan[] = [];
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Loan[]; } catch {}
    setLoan((saved.length ? saved : SAMPLE).find((item) => item.id === id) ?? null);
  }, [id]);

  const updateStatus = (status: LoanStatus) => {
    if (!loan) return;
    const updated = { ...loan, status };
    let saved: Loan[] = [];
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Loan[]; } catch {}
    const source = saved.length ? saved : SAMPLE;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(source.map((item) => item.id === loan.id ? updated : item)));
    setLoan(updated);
    setToast(status === "approved" ? "Loan approved." : "Loan rejected.");
  };

  if (!loan) return <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center"><h1 className="text-xl font-bold">Loan not found</h1><Link to="/loans" className="mt-4 inline-block text-emerald-700">Back to loans</Link></div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <Link to="/loans" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700"><ChevronLeft className="size-4" /> Loans</Link>
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">Loan application</p><h1 className="mt-1 text-3xl font-extrabold">₦{loan.amount.toLocaleString("en-NG")}</h1></div><span className={`w-fit rounded-full px-4 py-1.5 text-sm font-bold capitalize ${statusClass[loan.status]}`}>{loan.status}</span></div>
    <section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">Application details</h2><dl className="mt-5 divide-y"><div className="grid gap-1 py-3 sm:grid-cols-3"><dt className="text-slate-500">Applicant</dt><dd className="font-semibold sm:col-span-2">{loan.applicant}</dd></div><div className="grid gap-1 py-3 sm:grid-cols-3"><dt className="text-slate-500">Purpose</dt><dd className="sm:col-span-2">{loan.purpose}</dd></div><div className="grid gap-1 py-3 sm:grid-cols-3"><dt className="text-slate-500">Amount</dt><dd className="font-semibold sm:col-span-2">₦{loan.amount.toLocaleString("en-NG")}</dd></div><div className="grid gap-1 py-3 sm:grid-cols-3"><dt className="text-slate-500">Date requested</dt><dd className="sm:col-span-2">{new Date(loan.createdAt).toLocaleString("en-NG")}</dd></div></dl></section>
    <section className="flex flex-col gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:justify-end"><button disabled={loan.status === "rejected"} onClick={() => updateStatus("rejected")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 px-5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle className="size-4" /> Reject loan</button><button disabled={loan.status === "approved"} onClick={() => updateStatus("approved")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><CheckCircle2 className="size-4" /> Approve loan</button></section>
    {toast && <div role="status" className="fixed bottom-5 right-5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">{toast}</div>}
  </div>;
}
