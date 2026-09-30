import { Bell, ChevronDown, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/useTheme";

export default function Navbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isGroupsPage = pathname === "/groups";

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-5">
      <div className="min-w-0">
        <h1 className="text-[13px] font-bold leading-7 text-gray-900">
          {isGroupsPage ? "My Groups" : "Dashboard"}
        </h1>
        <p className="mt-0.5 truncate text-[11px] text-gray-500">
          {isGroupsPage
            ? "Manage your savings groups, track contributions and stay updated."
            : ""}
        </p>
      </div>

      {/* Header Actions */}
      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
          title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          {isDarkMode ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            3
          </span>
        </button>
        <img
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80"
          alt=""
          className="size-8 rounded-full object-cover"
        />
        <span className="hidden text-[10px] font-semibold text-gray-800 sm:inline">
          Chikamso
        </span>
        <ChevronDown className="hidden size-3.5 text-gray-500 sm:block" />
      </div>
    </header>
  );
}
