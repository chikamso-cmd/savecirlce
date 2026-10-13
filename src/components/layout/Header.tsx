import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { attention, currentUser, organisation } from "../../lib/DashboardData";
import { ThemeSelector, ThemeToggleButton } from "../../contexts/ThemeProvider"; 

type Panel = "notifications" | "profile" | null;

export default function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const panelsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelsRef.current && !panelsRef.current.contains(e.target as Node))
        setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  const changeBranch = (value: string) => {
    setBranch(value);
    navigate(
      value === "all"
        ? "/dashboard"
        : `/dashboard?branch=${encodeURIComponent(value)}`,
    );
  };

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <header
      className={`sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:bg-slate-900`}
    >
      <div className="flex h-16 justify-between items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-white dark:hover:bg-slate-600"
        >
          <Menu className="size-6" />
        </button>

        <div className="flex items-center w-[1000px] gap-4 ">
          <form
            onSubmit={submitSearch}
            role="search"
            className="hidden max-w-md flex-1 md:block"
          >
            <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 dark:text-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 dark:bg-slate-900">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members, groups or payments"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:placeholder:text-white"
              />
            </label>
          </form>
          <div className="flex-1 md:hidden" />
          <label className="hidden items-center gap-2 text-sm text-slate-600 dark:text-white sm:flex">
            <span>Branch</span>
            <select
              value={branch}
              onChange={(e) => changeBranch(e.target.value)}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none dark:bg-slate-900 dark:text-white"
            >
              <option value="all">All branches</option>
              {organisation.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search"
          className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          {searchOpen ? (
            <X className="size-5" />
          ) : (
            <Search className="size-5" />
          )}
        </button>

        <div ref={panelsRef} className="flex items-center gap-1 sm:gap-2">
          {/* dark mode toggler button */}
          <div>
            <ThemeToggleButton />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggle("notifications")}
              aria-label={`Notifications, ${attention.length} unread`}
              aria-expanded={panel === "notifications"}
              className="relative rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-900 cursor-pointer"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>
            {panel === "notifications" && (
              <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:bg-slate-900">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-bold dark:text-white">
                  Notifications
                </p>
                <ul className="max-h-80 overflow-y-auto">
                  {attention.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={a.href}
                        onClick={() => setPanel(null)}
                        className="block px-4 py-3 hover:bg-slate-50 dark:text-white dark:hover:bg-slate-600 "
                      >
                        <p className="text-sm font-semibold ">{a.title}</p>
                        <p className="mt-0.5 text-xs">{a.detail}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggle("profile")}
              aria-expanded={panel === "profile"}
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800">
                {currentUser.initials}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {currentUser.name}
                </span>
                <span className="block text-xs text-slate-500 dark:text-white">
                  {currentUser.role}
                </span>
              </span>
              <ChevronDown
                className="hidden size-4 text-slate-500 lg:block"
                aria-hidden="true"
              />
            </button>
            {panel === "profile" && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:bg-slate-900">
                <Link
                  to="/profile"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:text-white dark:hover:bg-slate-600"
                >
                  <User className="size-4 text-slate-500 dark:text-white" />{" "}
                  Your profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:text-white dark:hover:bg-slate-600"
                >
                  <Settings className="size-4 text-slate-500 dark:text-white" />{" "}
                  Settings
                </Link>
                {/* theme selector */}
                <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
                  <p className="mb-2 px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Appearance
                  </p>
                  <ThemeSelector />
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login")} // TODO: call your sign-out endpoint first
                  className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <form
          onSubmit={submitSearch}
          role="search"
          className="border-t border-slate-100 px-4 py-3 md:hidden"
        >
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members, groups or payments"
            aria-label="Search"
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-emerald-600 focus:outline-none"
          />
          <select
            value={branch}
            onChange={(e) => changeBranch(e.target.value)}
            aria-label="Branch"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold sm:hidden"
          >
            <option value="all">All branches</option>
            {organisation.branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </form>
      )}
    </header>
  );
}
