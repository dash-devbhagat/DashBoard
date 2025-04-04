import React, { useState } from "react";
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
import { Link } from "wouter";

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

type ResourceData = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  project: string;
  allocation: number;
  status: { label: string; class: string };
  allocations: {
    projectId: number;
    projectName: string;
    percentage: number;
  }[];
};

type SortField = "name" | "role" | "allocation" | "status";
type SortOrder = "asc" | "desc";

type ResourceAllocationProps = {
  onEdit?: (teamMemberId: number) => void;
};

const ResourceAllocation: React.FC<ResourceAllocationProps> = ({ onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const itemsPerPage = 5; // Number of items to display per page

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

  // Get allocation status from percentage using agreed upon thresholds
  const getAllocationStatus = (percentage: number) => {
    if (percentage >= 100) return { label: "Fully Allocated", class: "bg-emerald-100 text-emerald-800" };
    if (percentage >= 75) return { label: "Partially Allocated", class: "bg-amber-100 text-amber-800" };
    return { label: "Needs Allocation", class: "bg-red-100 text-red-800" };
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

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder("asc");
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Get sorted data
  const sortedData = React.useMemo(() => {
    return [...resourceData].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "allocation":
          comparison = a.allocation - b.allocation;
          break;
        case "status":
          comparison = a.status.label.localeCompare(b.status.label);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [resourceData, sortField, sortOrder]);

  // Calculate total number of pages
  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);
  
  // Get current page of data
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    
    return (
      <span className="material-icons text-xs ml-1">
        {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Resource Allocation</CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex-grow">
          <div className="animate-pulse space-y-4 h-full">
            <div className="h-10 bg-slate-200 rounded w-full"></div>
            <div className="h-[calc(100%-2.5rem)] bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <CardTitle className="text-slate-800 text-lg font-semibold">Resource Allocation</CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex-grow flex flex-col">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full">
            <thead>
              <tr className="text-sm font-medium text-left text-slate-500 border-b border-slate-200">
                <th 
                  className="pb-3 pl-2 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Team Member
                    {renderSortIndicator("name")}
                  </div>
                </th>
                <th className="pb-3">Projects</th>
                <th 
                  className="pb-3 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("allocation")}
                >
                  <div className="flex items-center">
                    Allocation
                    {renderSortIndicator("allocation")}
                  </div>
                </th>
                <th 
                  className="pb-3 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {renderSortIndicator("status")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((resource) => (
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
                        className={`h-2.5 rounded-full ${
                          resource.allocation >= 100 
                            ? "bg-emerald-500" 
                            : resource.allocation >= 75 
                              ? "bg-amber-500" 
                              : "bg-red-500"
                        }`}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <Link href="/team">
            <Button variant="link" className="text-sm text-primary font-medium p-0">
              View All Resources
            </Button>
          </Link>
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </Button>
            
            {/* Generate page buttons */}
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <Button 
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"} 
                  size="icon" 
                  className={`h-8 w-8 p-0 ${currentPage === pageNumber ? 'bg-primary text-white' : ''}`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceAllocation;
