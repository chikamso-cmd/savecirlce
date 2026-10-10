import { NavLink } from "react-router-dom";
import { Home, Users, Bell, User, Wallet } from "lucide-react";

export const mobileFooterLinks = [
  { name: "Home", path: "/dashboard", icon: Home },
  { name: "Groups", path: "/groups", icon: Users },
  { name: "Payouts", path: "/Payouts", icon: Wallet, isPlus: true },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Profile", path: "/profile", icon: User },
];

export default function MobileFooter() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 px-2 py-1">
      <div className="flex justify-around items-center h-14">
        {mobileFooterLinks.map((item) => {
          const Icon = item.icon;

          if (item.isPlus) {
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="bg-green-900 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-green-600"
                    : "text-gray-500 hover:text-gray-900"
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
