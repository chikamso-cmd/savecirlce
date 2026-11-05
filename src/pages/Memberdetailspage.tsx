import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Mail, Phone, WalletCards } from "lucide-react";

const MEMBERS: Record<string, { name: string; phone: string; groups: string[]; savings: number; arrears: number; nextPayout: string }> = {
  m1: { name: "[Member 1]", phone: "08031234567", groups: ["[Market traders ajo]", "[Church thrift]"], savings: 84500, arrears: 0, nextPayout: "Fri 9 Oct" },
  m2: { name: "[Member 2]", phone: "08059876543", groups: ["[Market traders ajo]"], savings: 0, arrears: 5000, nextPayout: "Fri 9 Oct" },
  m3: { name: "[Member 3]", phone: "07061112233", groups: ["[Church thrift]"], savings: 12000, arrears: 0, nextPayout: "Not scheduled" },
  m4: { name: "[Member 4]", phone: "08124445566", groups: ["[Teachers circle]"], savings: 0, arrears: 20000, nextPayout: "Thu 29 Oct" },
  m5: { name: "[Member 5]", phone: "09037778899", groups: ["[Artisans weekly]"], savings: 6000, arrears: 3000, nextPayout: "Not scheduled" },
  m6: { name: "[Member 6]", phone: "08022223344", groups: ["[Church thrift]"], savings: 0, arrears: 0, nextPayout: "Not scheduled" },
};
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export default function MemberDetailsPage() {
  const { id } = useParams();
  const member = MEMBERS[id ?? ""];
  if (!member) return <div className="rounded-2xl border bg-white p-10 text-center"><h1 className="text-xl font-bold">Member not found</h1><Link className="mt-4 inline-block text-emerald-700" to="/members">Back to members</Link></div>;

  return <div className="mx-auto max-w-8xl space-y-6">
    <Link to="/members" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700"><ChevronLeft className="size-4" /> Members</Link>
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-extrabold text-emerald-800">{member.name.replace(/[\[\]]/g, "").split(" ").map(x => x[0]).join("")}</span>
        <div className="flex-1"><h1 className="text-2xl font-extrabold">{member.name}</h1><p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Phone className="size-4" /> {member.phone}</p></div>
        <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold"><Mail className="mr-2 inline size-4" />Contact member</button>
      </div>
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Amount saved</p><p className="mt-2 text-2xl font-extrabold">{naira(member.savings)}</p></div>
      <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Arrears</p><p className={`mt-2 text-2xl font-extrabold ${member.arrears ? "text-amber-700" : ""}`}>{naira(member.arrears)}</p></div>
      <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Next payout</p><p className="mt-2 text-xl font-extrabold">{member.nextPayout}</p></div>
    </div>
    <section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">Groups</h2><ul className="mt-3 divide-y">{member.groups.map(g => <li key={g} className="flex items-center gap-3 py-3"><WalletCards className="size-5 text-emerald-700" /><Link to="/groups" className="font-semibold text-emerald-700">{g}</Link></li>)}</ul></section>
  </div>;
}
