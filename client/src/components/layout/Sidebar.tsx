import { Link, useLocation } from "wouter";
import React from "react";
import { cn } from "@/lib/utils";

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
    { href: "/tasks", label: "Tasks", icon: "task" },
    { href: "/reports", label: "Reports", icon: "bar_chart" },
  ];

  return (
    <aside
      className={cn(
        "bg-secondary w-64 h-full flex-shrink-0 fixed lg:static z-20",
        open ? "transform-none" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-300 ease-in-out"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center">
            <span className="text-primary text-2xl font-bold ml-2">ResourcePro</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
          <ul className="px-2">
            {navItems.map((item) => (
              <li key={item.href} className="mb-1">
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg",
                      location === item.href
                        ? "text-white bg-primary"
                        : "text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
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
