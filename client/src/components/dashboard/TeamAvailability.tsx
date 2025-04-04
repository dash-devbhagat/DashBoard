import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type TeamUtilization = {
  role: string;
  memberCount: number;
  utilizationPercentage: number;
};

type DashboardStats = {
  activeProjects: number;
  teamUtilizationAvg: number;
  zeroAllocationCount: number;
  partiallyAllocatedCount: number;
  fullyAllocatedCount: number;
};

const TeamAvailability: React.FC = () => {
  const { data: utilizationData, isLoading: utilizationLoading } = useQuery<TeamUtilization[]>({
    queryKey: ["/api/dashboard/team-utilization"],
  });
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const isLoading = utilizationLoading || statsLoading;

  // Function to determine color based on utilization percentage
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return "bg-emerald-500"; // Fully Allocated
    if (percentage >= 75) return "bg-amber-500";    // Partially Allocated (75-99%)
    return "bg-red-500";                            // Needs More Allocation (<75%)
  };
  
  // Function to get text color matching utilization
  const getUtilizationTextColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600"; // Fully Allocated
    if (percentage >= 75) return "text-amber-600";    // Partially Allocated (75-99%)
    return "text-red-600";                            // Needs More Allocation (<75%)
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Team Availability</CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex-grow animate-pulse">
          <div className="h-full bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Use accurate data directly from dashboard stats
  const fullyAllocatedCount = dashboardStats?.fullyAllocatedCount || 0;
  const partialCount = dashboardStats?.partiallyAllocatedCount || 0;
  const needsAllocationCount = dashboardStats?.zeroAllocationCount || 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-slate-200 px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-slate-800 text-lg font-semibold">Team Availability</CardTitle>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <span className="material-icons text-slate-500">refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="p-5 flex-grow flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
              <span className="text-sm font-medium text-emerald-700">Fully Allocated (≥100%)</span>
            </div>
            <span className="text-sm font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{fullyAllocatedCount} team members</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
              <span className="text-sm font-medium text-amber-700">Partially Allocated (75-99%)</span>
            </div>
            <span className="text-sm font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-full">{partialCount} team members</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm font-medium text-red-700">Needs Allocation (&lt;75%)</span>
            </div>
            <span className="text-sm font-semibold bg-red-50 text-red-700 px-2 py-1 rounded-full">{needsAllocationCount} team members</span>
          </div>
        </div>

        <div className="mt-4 flex-grow">
          <div className="chart-container h-full">
            <div className="bg-slate-50 rounded-xl p-5 shadow-inner h-full">
              <h3 className="text-sm font-semibold mb-4 text-slate-800">Utilization by Role</h3>
              <div className="w-full">
                {utilizationData?.map((item, index) => (
                  <div key={index} className="mb-5 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{item.role}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getUtilizationTextColor(item.utilizationPercentage)} ${
                        item.utilizationPercentage >= 100 
                          ? "bg-emerald-50" 
                          : item.utilizationPercentage >= 75 
                            ? "bg-amber-50" 
                            : "bg-red-50"
                      }`}>
                        {item.utilizationPercentage}% Utilized
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={item.utilizationPercentage} 
                        className="h-3 bg-slate-200"
                        indicatorClassName={getUtilizationColor(item.utilizationPercentage)}
                      />
                      <span className="absolute -right-1 -top-1 bg-white text-xs text-slate-600 px-1 rounded border border-slate-200">
                        {item.memberCount} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamAvailability;
