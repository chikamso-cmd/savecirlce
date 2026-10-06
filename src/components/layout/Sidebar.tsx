import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Check, ChevronsLeft, ChevronsUpDown, Copy, X } from "lucide-react";
import { NAV, organisation } from "../../lib/DashboardData";

interface SidebarProps {
  collapsed: boolean; // desktop icon-only mode
  mobileOpen: boolean; // off-canvas drawer below lg
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
     <img src="/src/assets/images/SaveCircle_logo.png" alt="savecircle logo"  width={160}/>
    </div>
  );
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const { pathname } = useLocation();
  const [copied, setCopied] = useState(false);
  const { collectionAccount } = organisation;

  // On mobile the drawer always shows labels
  const compact = collapsed && !mobileOpen;

  const copyAccount = async () => {
    await navigator.clipboard.writeText(
      `${collectionAccount.name}\n${collectionAccount.bank}\n${collectionAccount.number}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-emerald-950 text-emerald-100 transition-[width,transform] duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${compact ? "w-20" : "w-72 lg:w-64"}`}
        aria-label="Sidebar"
      >
        <div
          className={`flex h-16 items-center px-4 ${compact ? "justify-center" : "justify-between"}`}
        >
          <Logo />
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="rounded-lg p-2 text-emerald-200 hover:bg-emerald-900 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-3">
          <button
            type="button"
            title={compact ? organisation.name : undefined}
            className={`flex w-full items-center gap-3 rounded-xl border border-emerald-800 bg-emerald-900/60 p-2 text-left hover:bg-emerald-900 ${compact ? "justify-center" : ""}`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-extrabold text-white">
              OR
            </span>
            {!compact && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {organisation.name}
                  </span>
                  <span className="block text-xs text-emerald-300">
                    {organisation.type}, {organisation.role}
                  </span>
                </span>
                <ChevronsUpDown
                  className="size-4 shrink-0 text-emerald-300"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>

        <nav
          className="mt-4 flex-1 overflow-y-auto px-3 pb-4"
          aria-label="Main"
        >
          {NAV.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-5" : ""}>
              {section.title && !compact && (
                <p className="mb-1.5 px-3 text-xs font-semibold text-emerald-400">
                  {section.title}
                </p>
              )}
              {section.title && compact && (
                <div className="mx-auto mb-2 h-px w-8 bg-emerald-800" />
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, badge }) => {
                  const active =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        to={href}
                        onClick={onCloseMobile}
                        title={compact ? label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition ${
                          active
                            ? "bg-emerald-700 font-semibold text-white"
                            : "text-emerald-100 hover:bg-emerald-900"
                        } ${compact ? "justify-center" : ""}`}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        {!compact && (
                          <span className="flex-1 truncate">{label}</span>
                        )}
                        {badge ? (
                          compact ? (
                            <span
                              className="absolute right-2.5 top-2 size-2 rounded-full bg-amber-400"
                              aria-label={`${badge} pending`}
                            />
                          ) : (
                            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
                              {badge}
                            </span>
                          )
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {!compact && (
          <div className="mx-3 mb-3 rounded-xl bg-emerald-900/70 p-4">
            <p className="text-xs text-emerald-300">Collection account</p>
            <p className="mt-1 text-lg font-extrabold tracking-wider text-white">
              {collectionAccount.number.replace(
                /(\d{4})(\d{3})(\d{3})/,
                "$1 $2 $3",
              )}
            </p>
            <p className="text-xs text-emerald-300">{collectionAccount.bank}</p>
            <button
              type="button"
              onClick={copyAccount}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 text-sm font-semibold text-emerald-100 hover:bg-emerald-800"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy details"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden min-h-12 items-center justify-center gap-2 border-t border-emerald-900 text-sm text-emerald-300 hover:text-white lg:flex"
        >
          <ChevronsLeft
            className={`size-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
          {!collapsed && "Collapse"}
        </button>
      </aside>
    </>
  );
}
