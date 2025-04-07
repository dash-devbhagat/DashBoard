import React from "react";
import dashboardLogo from "@/assets/dashboard-3d-logo.png";

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="bg-white shadow-md z-10 sticky top-0">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-indigo-500/20 blur-sm rounded-full"></div>
              <img src={dashboardLogo} alt="Dashboard Logo" className="w-9 h-9 mr-2 relative" />
            </div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent ml-1">
              DashBoard
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white"></span>
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30">
            <span className="material-icons">help_outline</span>
          </button>
          <div className="relative">
            <button className="flex items-center text-sm focus:outline-none bg-slate-50 hover:bg-slate-100 py-2 px-3 rounded-lg transition-colors border border-slate-200 shadow-sm focus:ring-2 focus:ring-primary/30">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-indigo-500/10 blur-sm rounded-full"></div>
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border-2 border-primary/20 relative"
                />
              </div>
              <span className="hidden md:block ml-2 text-sm font-medium text-slate-700">John Doe</span>
              <span className="material-icons ml-1 text-slate-400">arrow_drop_down</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
