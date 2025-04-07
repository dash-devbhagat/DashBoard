import { Link, useLocation } from "wouter";
import React from "react";
import { cn } from "@/lib/utils";
import dashboardLogo from "@/assets/dashboard-3d-logo.png";

type SidebarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/projects", label: "Projects", icon: "work" },
    { href: "/team", label: "Team", icon: "people" },
    { href: "/project-status", label: "Project Status", icon: "assessment" },
    { href: "/reports", label: "Reports", icon: "bar_chart" },
  ];

  return (
    <aside
      className={cn(
        "bg-gradient-to-b from-slate-800 to-slate-900 w-64 h-full flex-shrink-0 fixed lg:static z-20 shadow-xl",
        open ? "transform-none" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-300 ease-in-out"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/30 bg-slate-800/50">
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-indigo-500/30 blur-sm rounded-full"></div>
              <img src={dashboardLogo} alt="Dashboard Logo" className="w-10 h-10 relative" />
            </div>
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent text-2xl font-extrabold ml-2">DashBoard</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white hover:bg-slate-700 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        </div>

        <nav className="flex-1 pt-5 pb-4 overflow-y-auto px-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 group",
                    location === item.href
                      ? "text-white bg-gradient-to-r from-primary/90 to-indigo-500/90 font-medium shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  )}
                >
                  <span className={cn(
                    "material-icons mr-3 text-lg group-hover:scale-110 transition-transform",
                    location === item.href ? "text-white" : "text-slate-400"
                  )}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {location === item.href && (
                    <span className="ml-auto w-1.5 h-5 rounded-full bg-white/30"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto">
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">
              Quick Links
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 bg-slate-800/30 rounded-lg mb-4">
              <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex flex-col items-center">
                <span className="material-icons text-lg">settings</span>
                <span className="text-xs mt-1">Settings</span>
              </button>
              <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex flex-col items-center">
                <span className="material-icons text-lg">help</span>
                <span className="text-xs mt-1">Help</span>
              </button>
              <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex flex-col items-center">
                <span className="material-icons text-lg">logout</span>
                <span className="text-xs mt-1">Logout</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-700/30 p-4">
            <div className="flex items-center p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-indigo-500/20 blur-sm rounded-full"></div>
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full border-2 border-primary/20 relative"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-slate-400">Project Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
