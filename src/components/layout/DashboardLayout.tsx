import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const COLLAPSE_KEY = "savecircle:sidebar-collapsed";

// Route layout: child routes render into <Outlet />
export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // Stop the page scrolling behind the mobile drawer
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleCollapse = () =>
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
