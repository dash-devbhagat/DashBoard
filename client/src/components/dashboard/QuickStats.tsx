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
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-20 bg-slate-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Projects",
      value: stats?.activeProjects ?? 0,
      icon: "work",
      gradient: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-600",
      trend: { value: "8%", direction: "up", text: "from last month" },
    },
    {
      title: "Team Utilization",
      value: `${stats?.teamUtilizationAvg ?? 0}%`,
      icon: "groups",
      gradient: "from-indigo-500/20 to-violet-500/20",
      iconColor: "text-indigo-600",
      trend: { value: "4%", direction: "up", text: "from last month" },
    },
    {
      title: "Unallocated Team",
      value: stats?.zeroAllocationCount ?? 0,
      icon: "person_off",
      gradient: "from-red-500/20 to-orange-500/20",
      iconColor: "text-red-600",
      trend: { value: "12%", direction: "down", text: "from last month" },
    },
    {
      title: "Fully Allocated",
      value: stats?.fullyAllocatedCount ?? 0,
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
          className="relative bg-white p-6 overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow"
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
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{card.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100 z-10`}>
              <span className={`material-icons ${card.iconColor}`}>{card.icon}</span>
            </div>
          </div>
          
          <div className="mt-5 relative">
            <span
              className={`text-sm ${
                card.trend.direction === "up"
                  ? "text-emerald-600"
                  : card.trend.direction === "down"
                  ? "text-red-600"
                  : "text-slate-500"
              } font-medium flex items-center text-xs`}
            >
              {card.trend.direction !== "none" && (
                <span className="material-icons text-sm mr-1">
                  {card.trend.direction === "up" ? "arrow_upward" : "arrow_downward"}
                </span>
              )}
              <span className="font-semibold">{card.trend.value}</span>{" "}
              <span className="text-slate-500 ml-1">{card.trend.text}</span>
            </span>
          </div>
          
          {/* Decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
