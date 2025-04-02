import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TeamUtilization = {
  role: string;
  memberCount: number;
  utilizationPercentage: number;
};

interface TeamAvailabilityProps {
  onAssignResource: () => void;
}

const TeamAvailability: React.FC<TeamAvailabilityProps> = ({ onAssignResource }) => {
  const { data: utilizationData, isLoading } = useQuery<TeamUtilization[]>({
    queryKey: ["/api/dashboard/team-utilization"],
  });

  // Function to determine color based on utilization percentage
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return "bg-danger";
    if (percentage >= 50) return "bg-warning";
    return "bg-success";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Team Availability</CardTitle>
        </CardHeader>
        <CardContent className="p-5 animate-pulse">
          <div className="h-64 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate availability stats
  const availableCount = utilizationData?.filter(u => u.utilizationPercentage < 50).reduce((acc, curr) => acc + curr.memberCount, 0) || 0;
  const partialCount = utilizationData?.filter(u => u.utilizationPercentage >= 50 && u.utilizationPercentage < 80).reduce((acc, curr) => acc + curr.memberCount, 0) || 0;
  const fullyBookedCount = utilizationData?.filter(u => u.utilizationPercentage >= 80).reduce((acc, curr) => acc + curr.memberCount, 0) || 0;

  return (
    <Card>
      <CardHeader className="border-b border-slate-200 px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-slate-800 text-lg font-semibold">Team Availability</CardTitle>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <span className="material-icons text-slate-500">refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-success mr-2"></div>
              <span className="text-sm text-slate-700">Available</span>
            </div>
            <span className="text-sm font-medium">{availableCount} team members</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-warning mr-2"></div>
              <span className="text-sm text-slate-700">Partially Available</span>
            </div>
            <span className="text-sm font-medium">{partialCount} team members</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-danger mr-2"></div>
              <span className="text-sm text-slate-700">Fully Booked</span>
            </div>
            <span className="text-sm font-medium">{fullyBookedCount} team members</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="chart-container">
            <div className="bg-slate-100 rounded-lg p-4 h-full flex flex-col justify-center items-center">
              <div className="w-full">
                {utilizationData?.map((item, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
                      <span>{item.role}</span>
                      <span>{item.memberCount} members</span>
                    </div>
                    <Progress 
                      value={item.utilizationPercentage} 
                      className="h-2.5 bg-slate-200"
                      indicatorClassName={getUtilizationColor(item.utilizationPercentage)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button 
            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
            onClick={onAssignResource}
          >
            <span className="material-icons mr-2 text-sm">add</span>
            <span>Assign New Resource</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamAvailability;
