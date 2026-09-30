import { NavLink, Link } from "react-router-dom";
import {
  UsersRound,
  PlusCircle,
  Bell,
  Settings,
  Home,
  Sprout,
  Database,
  Wallet,
} from "lucide-react";

export const sidebarLinks = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "My Groups", path: "/groups", icon: UsersRound },
  { name: "Contributions", path: "/contributions", icon: Database },
  { name: "Payouts", path: "/payouts", icon: Wallet },
  { name: "Members", path: "/members", icon: UsersRound },
  { name: "Reports", path: "/reports", icon: UsersRound },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Sidebar Header */}
      <div className="flex h-[70px] items-center border-b border-gray-100 px-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 text-emerald-800"
        >
          <img src="/src/assets/images/SaveCircle_logo.png" alt="" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-medium transition-colors ${
                  isActive
                    ? "sidebar-nav-link-active"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* <div className="relative mx-3 mb-3 flex min-h-[216px] items-end overflow-hidden rounded-xl bg-emerald-50 p-4">
        <div className="relative z-10 max-w-[110px] text-sm font-bold leading-5 text-emerald-800">
          Stronger Groups. Brighter Futures.
        </div>
        <Sprout className="absolute -bottom-2 right-1 size-24 text-emerald-700" />
      </div> */}

      {/* Sidebar User Footer */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-900 text-white flex items-center justify-center font-medium">
          JD
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
          <p className="text-xs text-gray-500 truncate">john@example.com</p>
        </div>
      </div>
    </aside>
  );
}
