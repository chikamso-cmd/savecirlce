import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileFooter from "./MobileFooter";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden h-full w-[204px] shrink-0 md:block">
        <Sidebar />
      </div>

      {/* Main Container */}
      <div className="my-0 mr-0 flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-100 bg-white  md:rounded-xl">
        {/* Navbar Component */}
        <Navbar
        //   isSidebarOpen={isSidebarOpen}
        //   onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Mobile Slide-over Drawer */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div
              className="w-64 bg-white h-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onItemClick={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Page Content Area with Nested Route Outlet */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-10 pb-20 md:pb-4">
          <Outlet />
        </main>

        {/* Mobile Footer Component */}
        <MobileFooter />
      </div>
    </div>
  );
}
