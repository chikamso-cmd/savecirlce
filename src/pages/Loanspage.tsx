import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export type LoanStatus = "pending" | "approved" | "rejected";
interface Loan {
  id: string;
  amount: number;
  purpose: string;
  status: LoanStatus;
  createdAt: string;
  applicant: string;
}
interface Props {
  memberMode?: boolean;
}

const STORAGE_KEY = "savecircle:loan-requests";
const input =
  "w-full min-h-11 rounded-lg border border-slate-300 px-3.5 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const statusClass: Record<LoanStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};
const sampleLoans: Loan[] = [
  {
    id: "loan-1",
    applicant: "[Member 2]",
    amount: 250000,
    purpose: "Working capital",
    status: "pending",
    createdAt: "2026-10-28T10:00:00.000Z",
  },
  {
    id: "loan-2",
    applicant: "[Member 4]",
    amount: 500000,
    purpose: "Equipment purchase",
    status: "approved",
    createdAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "loan-3",
    applicant: "[Member 5]",
    amount: 100000,
    purpose: "Business expansion",
    status: "rejected",
    createdAt: "2026-10-15T10:00:00.000Z",
  },
];

export default function LoansPage({ memberMode = false }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [filter, setFilter] = useState<"all" | LoanStatus>("all");
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      ) as Loan[];
      setLoans(
        memberMode
          ? stored.filter((loan) => loan.applicant === "Member account")
          : stored.length
            ? stored
            : sampleLoans,
      );
    } catch {
      setLoans(memberMode ? [] : sampleLoans);
    }
  }, [memberMode]);

  const submit = () => {
    const loan: Loan = {
      id: crypto.randomUUID(),
      amount: Number(amount),
      purpose: purpose.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      applicant: "Member account",
    };
    const next = [loan, ...loans];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLoans(next);
    setOpen(false);
    setAmount("");
    setPurpose("");
  };

  const updateStatus = (id: string, status: LoanStatus) => {
    const next = loans.map((loan) =>
      loan.id === id ? { ...loan, status } : loan,
    );
    setLoans(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visible = memberMode
    ? loans
    : loans.filter((loan) => filter === "all" || loan.status === filter);

  if (memberMode)
    return (
      <div className="mx-auto max-w-8xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">My loans</h1>
            <p className="mt-1 text-slate-600">
              Request and track your organisation loans.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white"
          >
            <Plus className="size-4" /> Request loan
          </button>
        </div>
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-5 py-4 font-bold">Your loan requests</div>
          {visible.length ? (
            <div className="divide-y">
              {visible.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-bold">
                      ₦{loan.amount.toLocaleString("en-NG")}
                    </p>
                    <p className="text-sm text-slate-500">{loan.purpose}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass[loan.status]}`}
                  >
                    {loan.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-500">No loan requests yet.</p>
          )}
        </section>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="text-xl font-bold">Request a loan</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">
                    Amount
                  </span>
                  <input
                    inputMode="numeric"
                    className={input}
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">
                    Purpose
                  </span>
                  <textarea
                    rows={3}
                    className={`${input} py-2.5`}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="min-h-11 rounded-lg border px-4 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={!Number(amount) || purpose.trim().length < 5}
                  onClick={submit}
                  className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  Submit request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Loans</h1>
        <p className="mt-1 text-slate-600">
          All organisation loan applications.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold capitalize ${filter === status ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white"}`}
          >
            {status}
          </button>
        ))}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Applicant</th>
                <th className="px-5 py-3">Purpose</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date requested</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((loan) => (
                <tr
                  key={loan.id}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-semibold">{loan.applicant}</td>
                  <td className="px-5 py-4">{loan.purpose}</td>
                  <td className="px-5 py-4 font-bold">
                    ₦{loan.amount.toLocaleString("en-NG")}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(loan.createdAt).toLocaleDateString("en-NG")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass[loan.status]}`}
                    >
                      {loan.status}
                    </span>
                  </td>
                  <td
                    className="px-5 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={loan.status === "approved"}
                        onClick={() => updateStatus(loan.id, "approved")}
                        className="min-h-9 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={loan.status === "rejected"}
                        onClick={() => updateStatus(loan.id, "rejected")}
                        className="min-h-9 rounded-lg border border-red-300 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No loans with this status.
          </p>
        )}
      </section>
    </div>
  );
}
