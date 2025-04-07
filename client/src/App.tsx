import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Team from "@/pages/Team";
import Reports from "@/pages/Reports";
import ProjectStatusPage from "@/pages/ProjectStatus";
import { useState } from "react";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 -mt-24 -mr-24 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl opacity-30 -mb-20 -ml-20 pointer-events-none"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/projects" component={Projects} />
              <Route path="/team" component={Team} />
              <Route path="/project-status" component={ProjectStatusPage} />
              <Route path="/reports" component={Reports} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
