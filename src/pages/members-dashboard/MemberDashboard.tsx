import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Landmark, ReceiptText, Wallet } from "lucide-react";
import { listOfficers, recordCashPayment, type Officer } from "../../services/Cashapi";

const SESSION_KEY = "savecircle:session";
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const inputCls = "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export default function MemberDashboard() {
  const savedUser = useMemo(() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.user ?? { fullName: "[Member]", phone: "08031234567", email: "member@example.com" }; } catch { return { fullName: "[Member]", phone: "08031234567", email: "member@example.com" }; } }, []);
  const [profile, setProfile] = useState(savedUser);
  const [photo, setPhoto] = useState<string | null>(() => localStorage.getItem("savecircle:member-photo"));
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [cashOpen, setCashOpen] = useState(false);
  const [treasurer, setTreasurer] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [escalation, setEscalation] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [issue, setIssue] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => { document.title = "My dashboard | SaveCircle"; listOfficers().then(setOfficers); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);

  const submitCash = async () => {
    if (!treasurer || !Number(cashAmount)) return;
    await recordCashPayment(treasurer, profile.fullName, "[Market traders ajo]", Number(cashAmount));
    setCashOpen(false); setCashAmount(""); setToast("Cash payment submitted to the treasurer's cash in hand.");
  };
  const submitEscalation = () => {
    const item = { id: crypto.randomUUID(), member: profile.fullName, transactionRef: transactionRef.trim(), issue: issue.trim(), at: new Date().toISOString(), status: "open" };
    const existing = JSON.parse(localStorage.getItem("savecircle:payment-escalations") || "[]");
    localStorage.setItem("savecircle:payment-escalations", JSON.stringify([item, ...existing]));
    setEscalation(false); setTransactionRef(""); setIssue(""); setToast("Issue escalated to the administrator.");
  };
  const saveProfile = () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: { ...savedUser, ...profile }, accessToken: "mock.session" }));
    setToast("Profile updated.");
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-extrabold tracking-tight">Good morning, {profile.fullName}</h1><p className="mt-1 text-slate-600">Track your savings and payments.</p></div><button onClick={() => setEscalation(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 hover:bg-amber-100"><AlertCircle className="size-4" /> Report missing payment</button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[{label:"Total payments",value:naira(96500),icon:ReceiptText},{label:"Arrears",value:naira(5000),icon:AlertCircle},{label:"Amount saved",value:naira(84500),icon:Wallet},{label:"Next payout",value:"9 Oct",icon:Landmark}].map(({label,value,icon:Icon}) => <section key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="size-5 text-emerald-700"/><p className="mt-3 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold sm:text-2xl">{value}</p></section>)}
    </div>
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex-1"><h2 className="font-bold text-emerald-950">Paid cash to a treasurer?</h2><p className="mt-1 text-sm text-emerald-900/80">Record it here so it appears in the treasurer's cash in hand.</p></div><button onClick={() => { setTreasurer(officers[0]?.name ?? ""); setCashOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white"><Wallet className="size-4" /> Payment made by cash</button></div></section>
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">Recent payments</h2><div className="mt-4 divide-y"><div className="flex items-center justify-between py-4"><div><p className="font-semibold">Weekly contribution</p><p className="text-sm text-slate-500">Today, 10:42 AM</p></div><p className="font-extrabold text-emerald-700">{naira(5000)}</p></div><div className="flex items-center justify-between py-4"><div><p className="font-semibold">Thrift deposit</p><p className="text-sm text-slate-500">28 Sep 2026</p></div><p className="font-extrabold text-emerald-700">{naira(12000)}</p></div></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">Profile</h2><div className="mt-4 flex items-center gap-4">{photo ? <img src={photo} alt="Profile" className="size-16 rounded-full object-cover" /> : <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-extrabold text-emerald-800">{profile.fullName?.split(" ").map((x:string) => x[0]).join("").slice(0,2)}</span>}<label className="cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold"><Camera className="mr-2 inline size-4"/>Photo<input type="file" accept="image/*" className="hidden" onChange={e => { const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{const value=String(reader.result);setPhoto(value);localStorage.setItem("savecircle:member-photo",value)}; reader.readAsDataURL(file)}}/></label></div><div className="mt-5 space-y-3"><input aria-label="Full name" className={inputCls} value={profile.fullName ?? ""} onChange={e=>setProfile({...profile,fullName:e.target.value})}/><input aria-label="Email" className={inputCls} value={profile.email ?? ""} onChange={e=>setProfile({...profile,email:e.target.value})}/><input aria-label="Phone" className={inputCls} value={profile.phone ?? ""} onChange={e=>setProfile({...profile,phone:e.target.value})}/><button onClick={saveProfile} className="min-h-11 w-full rounded-lg bg-emerald-700 text-sm font-bold text-white">Save profile</button></div></section>
    </div>
    {cashOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Record cash payment</h2><div className="mt-4 space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-medium">Treasurer</span><select className={inputCls} value={treasurer} onChange={e=>setTreasurer(e.target.value)}><option value="">Select treasurer</option>{officers.map(o=><option key={o.id}>{o.name}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-sm font-medium">Amount</span><input className={inputCls} inputMode="numeric" value={cashAmount ? naira(Number(cashAmount)) : ""} onChange={e=>setCashAmount(e.target.value.replace(/\D/g,""))}/></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setCashOpen(false)} className="min-h-11 rounded-lg border px-4 text-sm font-semibold">Cancel</button><button disabled={!treasurer || !Number(cashAmount)} onClick={submitCash} className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-50">Submit payment</button></div></div></div>}
    {escalation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Report missing payment</h2><p className="mt-1 text-sm text-slate-500">Escalate a transaction that has not appeared on your account.</p><div className="mt-4 space-y-4"><input className={inputCls} placeholder="Transaction reference (optional)" value={transactionRef} onChange={e=>setTransactionRef(e.target.value)}/><textarea rows={4} className={`${inputCls} py-3`} placeholder="What payment has not been recorded?" value={issue} onChange={e=>setIssue(e.target.value)}/></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setEscalation(false)} className="min-h-11 rounded-lg border px-4 text-sm font-semibold">Cancel</button><button disabled={issue.trim().length < 5} onClick={submitEscalation} className="min-h-11 rounded-lg bg-amber-700 px-4 text-sm font-bold text-white disabled:opacity-50">Escalate to admin</button></div></div></div>}
    {toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"><CheckCircle2 className="size-5 text-emerald-400" />{toast}</div>}
  </div>;
}
