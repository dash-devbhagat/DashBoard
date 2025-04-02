import React from "react";

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
            className="lg:hidden text-slate-500 mr-2"
          >
            <span className="material-icons">menu</span>
          </button>
          <h1 className="text-xl font-semibold text-slate-800">Resource Management Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-slate-500 hover:text-slate-600">
            <span className="material-icons">notifications</span>
          </button>
          <button className="text-slate-500 hover:text-slate-600">
            <span className="material-icons">help_outline</span>
          </button>
          <div className="relative">
            <button className="flex items-center text-sm focus:outline-none">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
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
