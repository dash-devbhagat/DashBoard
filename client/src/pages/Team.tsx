import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  availability: number;
};

type Allocation = {
  id: number;
  teamMemberId: number;
  projectId: number;
  percentage: number;
  startDate: string;
  endDate: string;
};

type Project = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  color: string;
};

const Team: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: teamMembers, isLoading: isLoadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: allocations, isLoading: isLoadingAllocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const isLoading = isLoadingTeam || isLoadingAllocations || isLoadingProjects;

  // Helper functions
  const getMemberAllocations = (memberId: number) => {
    return allocations?.filter(a => a.teamMemberId === memberId) || [];
  };

  const getProjectName = (projectId: number) => {
    return projects?.find(p => p.id === projectId)?.name || "Unknown Project";
  };

  const getTotalAllocation = (memberId: number) => {
    const memberAllocations = getMemberAllocations(memberId);
    return memberAllocations.reduce((sum, a) => sum + a.percentage, 0);
  };

  const getAvailabilityStatus = (allocation: number) => {
    if (allocation >= 100) return { label: "Fully Booked", class: "bg-red-100 text-red-800" };
    if (allocation >= 50) return { label: "Partially Available", class: "bg-yellow-100 text-yellow-800" };
    return { label: "Available", class: "bg-green-100 text-green-800" };
  };

  // Filter team members based on search
  const filteredTeamMembers = React.useMemo(() => {
    if (!teamMembers) return [];
    return teamMembers.filter(
      member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teamMembers, searchTerm]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 rounded w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
        <Button>
          <span className="material-icons mr-1 text-sm">person_add</span>
          Add Member
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons text-slate-400 text-sm">search</span>
          </div>
          <Input
            type="text"
            className="pl-10 w-full"
            placeholder="Search by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeamMembers.map((member) => {
          const totalAllocation = getTotalAllocation(member.id);
          const status = getAvailabilityStatus(totalAllocation);
          const memberAllocations = getMemberAllocations(member.id);

          return (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                      <p className="text-sm text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  <Badge className={status.class}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Allocation</span>
                    <span className="font-medium">{totalAllocation}%</span>
                  </div>
                  <Progress 
                    value={totalAllocation} 
                    className="h-2"
                    indicatorClassName={
                      totalAllocation >= 100 
                        ? "bg-red-500" 
                        : totalAllocation >= 50 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                    }
                  />
                </div>

                <div className="text-sm">
                  <p className="font-medium mb-2">Current Projects:</p>
                  {memberAllocations.length === 0 ? (
                    <p className="text-slate-500 text-xs">No current project assignments</p>
                  ) : (
                    <div className="space-y-2">
                      {memberAllocations.map((allocation) => (
                        <div key={allocation.id} className="flex justify-between text-xs">
                          <span>{getProjectName(allocation.projectId)}</span>
                          <span className="font-medium">{allocation.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                  <Button variant="ghost" size="sm" className="text-slate-600">
                    <span className="material-icons mr-1 text-sm">schedule</span>
                    Availability
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600">
                    <span className="material-icons mr-1 text-sm">edit</span>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Team;
