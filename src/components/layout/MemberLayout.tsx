import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, CircleHelp, Landmark, LayoutDashboard, Menu, User, X } from "lucide-react";
import { useOrganisation } from "../../lib/OrgStore";
import logo from "../../assets/images/SaveCircle_logo.png";

const navItems = (hasLoans: boolean) => [
  { to: "/member-dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  ...(hasLoans ? [{ to: "/member-dashboard/loans", label: "Loans", icon: Landmark, end: false }] : []),
  { to: "/member-dashboard?view=help", label: "Help & support", icon: CircleHelp, end: false },
];

export default function MemberLayout() {
  const [open, setOpen] = useState(false);
  const { organisation } = useOrganisation();
  const hasLoans = organisation?.type === "cooperative" || organisation?.type === "business";
  const links = navItems(hasLoans);

  const navigation = (
    <nav className="mt-7 space-y-1" aria-label="Member navigation">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${isActive ? "bg-white/15 text-white" : "text-emerald-100 hover:bg-white/10"}`}>
          <Icon className="size-5" /> {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-emerald-950 px-4 py-5 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><img src={logo} alt="SaveCircle" className="h-9 w-auto" /><button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close sidebar"><X className="size-5" /></button></div>
        {navigation}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)} aria-label="Open sidebar"><Menu className="size-5" /></button>
          <p className="flex-1 font-bold text-slate-800">Member dashboard</p>
          <button aria-label="Notifications" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Bell className="size-5" /></button>
          <NavLink to="/member-dashboard" aria-label="Profile" className="rounded-full bg-emerald-100 p-2 text-emerald-800"><User className="size-5" /></NavLink>
        </header>
        <main className="px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:py-8 lg:pb-8"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-white md:hidden" style={{ gridTemplateColumns: hasLoans ? "repeat(3, 1fr)" : "repeat(2, 1fr)" }}>
        {links.filter((item) => item.to !== "/member-dashboard?view=help").map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/member-dashboard"} className={({isActive}) => `flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold ${isActive ? "text-emerald-700" : "text-slate-500"}`}><Icon className="size-5" />{label}</NavLink>)}
        <NavLink to="/member-dashboard?view=help" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-500"><CircleHelp className="size-5" />Help</NavLink>
      </nav>
    </div>
  );
}
