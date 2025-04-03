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
import { useState } from "react";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/projects" component={Projects} />
            <Route path="/team" component={Team} />
            <Route path="/reports" component={Reports} />
            <Route component={NotFound} />
          </Switch>
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
