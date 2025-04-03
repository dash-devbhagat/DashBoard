import { Link, useLocation } from "wouter";
import React from "react";
import { cn } from "@/lib/utils";
import dashboardLogo from "@/assets/dashboard-logo.svg";

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
    { href: "/reports", label: "Reports", icon: "bar_chart" },
  ];

  return (
    <aside
      className={cn(
        "bg-slate-900 w-64 h-full flex-shrink-0 fixed lg:static z-20",
        open ? "transform-none" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-300 ease-in-out"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
          <div className="flex items-center">
            <img src={dashboardLogo} alt="Dashboard Logo" className="w-10 h-10" />
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent text-2xl font-bold ml-2">Dashboard</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white hover:bg-slate-800 p-1 rounded-full transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
          <ul className="px-2 space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-all duration-200",
                    location === item.href
                      ? "text-white bg-gradient-to-r from-primary to-indigo-500 font-medium shadow-md"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  )}
                >
                  <span className="material-icons mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                  {location === item.href && (
                    <span className="ml-auto w-1.5 h-5 rounded-full bg-white/20"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center p-2 rounded-lg hover:bg-slate-800/70 transition-colors">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Avatar"
              className="w-9 h-9 rounded-full border-2 border-primary/20"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-slate-400">Project Manager</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
