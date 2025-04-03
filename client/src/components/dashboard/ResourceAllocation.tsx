import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

type ResourceAllocationProps = {
  onEdit?: (teamMemberId: number) => void;
};

const ResourceAllocation: React.FC<ResourceAllocationProps> = ({ onEdit }) => {
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

  // Get allocation status from percentage
  const getAllocationStatus = (percentage: number) => {
    if (percentage >= 100) return { label: "Fully Booked", class: "bg-red-100 text-red-800" };
    if (percentage >= 50) return { label: "Partially Available", class: "bg-yellow-100 text-yellow-800" };
    return { label: "Available", class: "bg-green-100 text-green-800" };
  };

  // Get project name from projectId
  const getProjectName = (projectId: number) => {
    return projects?.find(p => p.id === projectId)?.name || "Unknown Project";
  };

  // Create resource data by merging team members and their allocations
  const resourceData = React.useMemo(() => {
    if (!teamMembers || !allocations || !projects) return [];

    return teamMembers.map(member => {
      const memberAllocations = allocations.filter(a => a.teamMemberId === member.id);
      const totalAllocation = memberAllocations.reduce((sum, a) => sum + a.percentage, 0);
      const allocationStatus = getAllocationStatus(totalAllocation);
      
      // Create a formatted string of all projects and their allocation percentages
      const projectDetails = memberAllocations.map(allocation => {
        const projectName = getProjectName(allocation.projectId);
        return `${projectName} (${allocation.percentage}%)`;
      }).join(", ");
      
      const projectName = projectDetails || "Unassigned";

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        project: projectName,
        allocation: totalAllocation,
        status: allocationStatus,
        // Store the full list of allocations for this member
        allocations: memberAllocations.map(a => ({
          projectId: a.projectId,
          projectName: getProjectName(a.projectId),
          percentage: a.percentage
        }))
      };
    });
  }, [teamMembers, allocations, projects]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Resource Allocation</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-full"></div>
            <div className="h-64 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-slate-200 px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-slate-800 text-lg font-semibold">Resource Allocation</CardTitle>
        <div className="flex space-x-2">
          <Select defaultValue="thisWeek">
            <SelectTrigger className="text-sm border-slate-300 rounded h-9">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="nextWeek">Next Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <span className="material-icons text-slate-500">more_vert</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm font-medium text-left text-slate-500 border-b border-slate-200">
                <th className="pb-3 pl-2">Team Member</th>
                <th className="pb-3">Projects</th>
                <th className="pb-3">Allocation</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resourceData.map((resource) => (
                <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pl-2">
                    <div className="flex items-center">
                      <img src={resource.avatar} alt={resource.name} className="w-8 h-8 rounded-full mr-3" />
                      <div>
                        <p className="font-medium text-slate-800">{resource.name}</p>
                        <p className="text-xs text-slate-500">{resource.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {resource.allocations && resource.allocations.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {resource.allocations.map((alloc, idx) => (
                          <div key={idx} className="flex items-center">
                            <span className="text-xs font-medium text-slate-700">{alloc.projectName}:</span>
                            <span className="text-xs ml-1 text-slate-600">{alloc.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, resource.allocation)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-1 block">{resource.allocation}% allocated</span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${resource.status.class}`}>
                      {resource.status.label}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit && onEdit(resource.id)}
                    >
                      <span className="material-icons text-sm text-slate-400 hover:text-primary">edit</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-between items-center">
          <Button variant="link" className="text-sm text-primary font-medium p-0">
            View All Resources
          </Button>
          <div className="flex space-x-1">
            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
              <span className="material-icons text-sm">chevron_left</span>
            </Button>
            <Button variant="default" size="icon" className="h-8 w-8 p-0 bg-primary text-white">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
              2
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
              3
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
              <span className="material-icons text-sm">chevron_right</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceAllocation;
