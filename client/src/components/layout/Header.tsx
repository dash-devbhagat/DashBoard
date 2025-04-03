import React from "react";
import dashboardLogo from "@/assets/dashboard-logo.svg";

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors mr-2"
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="flex items-center">
            <img src={dashboardLogo} alt="Dashboard Logo" className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-icons">help_outline</span>
          </button>
          <div className="relative ml-2">
            <button className="flex items-center text-sm focus:outline-none bg-slate-50 hover:bg-slate-100 py-2 px-3 rounded-full transition-colors">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="User Avatar"
                className="w-8 h-8 rounded-full border-2 border-primary/20"
              />
              <span className="hidden md:block ml-2 text-sm font-medium">John Doe</span>
              <span className="material-icons ml-1 text-slate-400">arrow_drop_down</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
