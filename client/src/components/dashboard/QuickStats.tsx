import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

const QuickStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
      trend: { value: "8%", direction: "up", text: "from last month" },
      colSpan: "col-span-1",
    },
    {
      title: "Team Utilization",
      value: `${stats?.teamUtilizationAvg ?? 0}%`,
      icon: "groups",
      iconBg: "bg-indigo-100",
      iconColor: "text-accent",
      trend: { value: "4%", direction: "up", text: "from last month" },
      colSpan: "col-span-1",
    },
    {
      title: "Unallocated Team",
      value: stats?.zeroAllocationCount ?? 0,
      icon: "person_off",
      iconBg: "bg-red-100",
      iconColor: "text-danger",
      trend: { value: "12%", direction: "down", text: "from last month" },
      colSpan: "col-span-1",
    },
    {
      title: "Fully Allocated",
      value: stats?.fullyAllocatedCount ?? 0,
      icon: "person_check",
      iconBg: "bg-green-100",
      iconColor: "text-success",
      trend: { value: "15%", direction: "up", text: "from last month" },
      colSpan: "col-span-1",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <Card key={index} className={`bg-white p-5 ${card.colSpan}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-2xl font-semibold mt-1">{card.value}</p>
            </div>
            <div className={`${card.iconBg} p-3 rounded-full`}>
              <span className={`material-icons ${card.iconColor}`}>{card.icon}</span>
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`text-sm ${
                card.trend.direction === "up"
                  ? "text-success"
                  : card.trend.direction === "down"
                  ? "text-danger"
                  : "text-muted-foreground"
              } font-medium flex items-center text-xs`}
            >
              {card.trend.direction !== "none" && (
                <span className="material-icons text-sm mr-1">
                  {card.trend.direction === "up" ? "arrow_upward" : card.trend.direction === "down" ? "arrow_downward" : "remove"}
                </span>
              )}
              {card.trend.direction === "none" ? (
                ""
              ) : (
                card.trend.value
              )}{" "}
              {card.trend.text}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
