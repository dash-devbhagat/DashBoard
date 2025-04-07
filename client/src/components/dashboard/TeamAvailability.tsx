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

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
  availability: number;
  skills: string[] | null;
};

type Allocation = {
  id: number;
  teamMemberId: number;
  projectId: number;
  percentage: number;
  startDate: string;
  endDate: string;
};

const TeamAvailability: React.FC = () => {
  const { data: utilizationData, isLoading: utilizationLoading } = useQuery<TeamUtilization[]>({
    queryKey: ["/api/dashboard/team-utilization"],
  });
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: teamMembers, isLoading: teamMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });
  
  const { data: allocations, isLoading: allocationsLoading } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const isLoading = utilizationLoading || statsLoading || teamMembersLoading || allocationsLoading;

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
      <Card className="h-full flex flex-col overflow-hidden border-none shadow-md">
        <CardHeader className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-800 text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Team Availability
              </CardTitle>
              <div className="h-3 w-28 bg-slate-200 rounded mt-1.5 animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-grow relative bg-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full filter blur-xl opacity-30 -mt-20 -mr-20 pointer-events-none"></div>
          
          <div className="space-y-4 animate-pulse">
            {/* Legend skeleton */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded w-32"></div>
                  <div className="h-6 bg-slate-200 rounded-full w-28"></div>
                </div>
              ))}
            </div>
            
            {/* Chart skeleton */}
            <div className="mt-6 bg-slate-100 rounded-xl p-5 h-48">
              <div className="h-5 bg-slate-200 rounded w-24 mb-5"></div>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate team member allocation percentages
  const memberAllocations = new Map<number, number>();
  
  // Initialize all team members with 0% allocation
  (teamMembers || []).forEach(member => {
    memberAllocations.set(member.id, 0);
  });
  
  // Add up all allocations for each team member
  (allocations || []).forEach(allocation => {
    const currentAllocation = memberAllocations.get(allocation.teamMemberId) || 0;
    memberAllocations.set(allocation.teamMemberId, currentAllocation + allocation.percentage);
  });
  
  // Count members in each allocation category
  let fullyAllocatedCount = 0;
  let partialCount = 0;
  let needsAllocationCount = 0;
  
  memberAllocations.forEach(allocationPercentage => {
    if (allocationPercentage >= 100) {
      fullyAllocatedCount++;
    } else if (allocationPercentage >= 75) {
      partialCount++;
    } else {
      needsAllocationCount++;
    }
  });

  return (
    <Card className="h-full flex flex-col overflow-hidden border-none shadow-md">
      <CardHeader className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-slate-800 text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Team Availability
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Resource allocation overview</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col relative bg-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full filter blur-xl opacity-30 -mt-20 -mr-20 pointer-events-none"></div>
        
        <div className="mb-6 space-y-3">
          {/* Allocation Summary Card - Fully Allocated */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-100 shadow-sm">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mr-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Fully Allocated</p>
                <p className="text-xs text-emerald-600">100% or more</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg mr-1 text-emerald-700">{fullyAllocatedCount}</span>
              <span className="text-xs text-emerald-600">team members</span>
            </div>
          </div>
          
          {/* Allocation Summary Card - Partially Allocated */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-100 shadow-sm">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 mr-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Partially Allocated</p>
                <p className="text-xs text-amber-600">75-99% utilization</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg mr-1 text-amber-700">{partialCount}</span>
              <span className="text-xs text-amber-600">team members</span>
            </div>
          </div>
          
          {/* Allocation Summary Card - Needs Allocation */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-100 shadow-sm">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mr-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Needs Allocation</p>
                <p className="text-xs text-red-600">Under 75%</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg mr-1 text-red-700">{needsAllocationCount}</span>
              <span className="text-xs text-red-600">team members</span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex-grow">
          <div className="h-full">
            <div className="bg-slate-50/80 rounded-xl p-5 shadow-sm border border-slate-100 h-full overflow-hidden relative">
              {/* Small decorative dots */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                <div className="w-1 h-1 bg-slate-400 absolute top-6 right-10 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-400 absolute top-10 right-6 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-400 absolute top-14 right-12 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-400 absolute top-8 right-16 rounded-full"></div>
              </div>
              
              <h3 className="text-sm font-bold mb-5 text-slate-800 flex items-center">
                <span className="material-icons text-primary mr-1 text-sm">bar_chart</span>
                Utilization by Role
              </h3>
              
              <div className="w-full space-y-5">
                {utilizationData?.map((item, index) => (
                  <div key={index} className="pb-4 last:pb-0 border-b last:border-b-0 border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="material-icons text-primary text-sm mr-2">people</span>
                        <span className="text-sm font-semibold text-slate-800">{item.role}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        item.utilizationPercentage >= 100 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : item.utilizationPercentage >= 75 
                            ? "bg-amber-100 text-amber-800 border border-amber-200" 
                            : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {item.utilizationPercentage}% Utilized
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="relative">
                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            item.utilizationPercentage >= 100 
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                              : item.utilizationPercentage >= 75 
                                ? "bg-gradient-to-r from-amber-400 to-amber-500" 
                                : "bg-gradient-to-r from-red-400 to-red-500"
                          }`}
                          style={{ width: `${Math.min(100, item.utilizationPercentage)}%` }}
                        >
                        </div>
                      </div>
                      <div className="absolute right-2 top-0 bg-white text-xs font-medium text-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 -mt-1">
                        {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Display a message if no data */}
                {(!utilizationData || utilizationData.length === 0) && (
                  <div className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <span className="material-icons text-2xl mb-2 text-slate-300">bar_chart</span>
                      <p>No utilization data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamAvailability;
