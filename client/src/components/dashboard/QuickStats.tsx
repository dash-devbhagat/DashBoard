import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

const QuickStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse bg-slate-800 border-none shadow-lg">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                <div className="h-8 w-8 bg-slate-700 rounded-lg"></div>
              </div>
              <div className="h-8 bg-slate-700 rounded w-1/2 mt-2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3 mt-4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const dashboardStats = stats || {
    activeProjects: 0,
    teamUtilizationAvg: 0,
    zeroAllocationCount: 0,
    partiallyAllocatedCount: 0,
    fullyAllocatedCount: 0
  };
  
  const statCards = [
    {
      title: "Active Projects",
      value: dashboardStats.activeProjects,
      icon: "work",
      gradient: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-600",
      trend: { value: "8%", direction: "up", text: "from last month" },
    },
    {
      title: "Team Utilization",
      value: `${dashboardStats.teamUtilizationAvg}%`,
      icon: "groups",
      gradient: "from-indigo-500/20 to-violet-500/20",
      iconColor: "text-indigo-600",
      trend: { value: "4%", direction: "up", text: "from last month" },
    },
    {
      title: "Unallocated Team",
      value: dashboardStats.zeroAllocationCount,
      icon: "person_off",
      gradient: "from-red-500/20 to-orange-500/20",
      iconColor: "text-red-600",
      trend: { value: "12%", direction: "down", text: "from last month" },
    },
    {
      title: "Fully Allocated",
      value: dashboardStats.fullyAllocatedCount,
      icon: "person_check",
      gradient: "from-emerald-500/20 to-green-500/20",
      iconColor: "text-emerald-600",
      trend: { value: "15%", direction: "up", text: "from last month" },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {statCards.map((card, index) => (
        <Card 
          key={index} 
          className="relative bg-slate-800 p-6 overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br opacity-10 rounded-lg" 
               style={{background: `linear-gradient(to bottom right, var(--primary), #6366f1)`}}/>
          
          {/* Icon circle with gradient */}
          <div className="absolute top-0 right-0 w-20 h-20 -mt-5 -mr-5">
            <div className={`w-full h-full rounded-full bg-gradient-to-br ${card.gradient} opacity-80 blur-md`}></div>
          </div>
          
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{card.title}</p>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-slate-200 to-white bg-clip-text text-transparent">{card.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-slate-700 shadow-md border border-slate-600/50 z-10`}>
              <span className={`material-icons ${card.iconColor}`}>{card.icon}</span>
            </div>
          </div>
          
          <div className="mt-5 relative">
            <span
              className={`text-sm ${
                card.trend.direction === "up"
                  ? "text-emerald-400"
                  : card.trend.direction === "down"
                  ? "text-red-400"
                  : "text-slate-400"
              } font-medium flex items-center text-xs`}
            >
              {card.trend.direction !== "none" && (
                <span className="material-icons text-sm mr-1">
                  {card.trend.direction === "up" ? "arrow_upward" : "arrow_downward"}
                </span>
              )}
              <span className="font-semibold">{card.trend.value}</span>{" "}
              <span className="text-slate-400 ml-1">{card.trend.text}</span>
            </span>
          </div>
          
          {/* Decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
