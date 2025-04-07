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
    if (percentage >= 100) return { label: "Fully Allocated", class: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/70" };
    if (percentage >= 75) return { label: "Partially Allocated", class: "bg-amber-900/60 text-amber-300 border border-amber-700/70" };
    return { label: "Needs Allocation", class: "bg-red-900/60 text-red-300 border border-red-700/70" };
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
      <Card className="h-full flex flex-col overflow-hidden border-none shadow-md bg-slate-800">
        <CardHeader className="border-b border-slate-700/50 px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-300 to-white bg-clip-text text-transparent">
                Resource Allocation
              </CardTitle>
              <div className="h-3 w-28 bg-slate-700 rounded mt-1.5 animate-pulse"></div>
            </div>
            <div className="h-9 w-24 bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex flex-col relative bg-slate-800">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full filter blur-xl opacity-20 -mt-20 -mr-20 pointer-events-none"></div>
        
          <div className="p-6 space-y-4 animate-pulse">
            {/* Table header skeleton */}
            <div className="h-10 bg-slate-900/60 rounded w-full"></div>
            
            {/* Table rows skeleton */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex space-x-4 py-4 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-24"></div>
                    <div className="h-3 bg-slate-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex-1 space-y-2 ml-4">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
            
            {/* Pagination skeleton */}
            <div className="flex justify-end mt-4">
              <div className="h-8 bg-slate-700 rounded w-48"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border-none shadow-md bg-slate-800">
      <CardHeader className="border-b border-slate-700/50 px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-100 to-white bg-clip-text text-transparent">
              Resource Allocation
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">Team member project assignments</p>
          </div>
          <Link href="/team">
            <Button variant="outline" size="sm" className="text-sm font-medium gap-1 rounded-lg border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-slate-200 shadow-sm">
              <span className="material-icons text-sm">group</span>
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col relative bg-slate-800">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full filter blur-xl opacity-20 -mt-20 -mr-20 pointer-events-none"></div>
      
        <div className="overflow-x-auto flex-grow">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/60">
                <th 
                  className="text-sm font-semibold text-left text-slate-300 px-6 py-3 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Team Member
                    {renderSortIndicator("name")}
                  </div>
                </th>
                <th className="text-sm font-semibold text-left text-slate-300 px-6 py-3">
                  Projects
                </th>
                <th 
                  className="text-sm font-semibold text-left text-slate-300 px-6 py-3 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("allocation")}
                >
                  <div className="flex items-center">
                    Allocation
                    {renderSortIndicator("allocation")}
                  </div>
                </th>
                <th 
                  className="text-sm font-semibold text-left text-slate-300 px-6 py-3 cursor-pointer hover:text-primary transition-colors"
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
              {currentData.map((resource, idx) => (
                <tr key={resource.id} className={`border-b border-slate-700/50 hover:bg-slate-700/60 transition-colors ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/80'}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-slate-500/20 blur-sm"></div>
                        <img 
                          src={resource.avatar} 
                          alt={resource.name} 
                          className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-sm relative"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{resource.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{resource.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {resource.allocations && resource.allocations.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {resource.allocations.map((alloc, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-primary/80 mr-2"></div>
                            <span className="text-sm font-medium text-slate-300">{alloc.projectName}</span>
                            <span className="text-xs ml-2 font-semibold px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded-md">
                              {alloc.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-slate-600 mr-2"></span>
                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full ${
                            resource.allocation >= 100 
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                              : resource.allocation >= 75 
                                ? "bg-gradient-to-r from-amber-500 to-amber-400" 
                                : "bg-gradient-to-r from-red-500 to-red-400"
                          }`}
                          style={{ width: `${Math.min(100, resource.allocation)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-400">{resource.allocation}% allocated</span>
                        {resource.allocation > 100 && (
                          <span className="text-xs text-amber-400 font-medium">Overallocated</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      resource.status.label === "Fully Allocated" 
                        ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/70" 
                        : resource.status.label === "Partially Allocated"
                          ? "bg-amber-900/60 text-amber-300 border border-amber-700/70"
                          : "bg-red-900/60 text-red-300 border border-red-700/70"
                    }`}>
                      {resource.status.label}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Empty state for no data */}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <span className="material-icons text-3xl mb-2 text-slate-600">person_search</span>
                      <p>No resources found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/90 mt-auto">
          <div className="flex justify-end items-center">
            <div className="flex space-x-1 shadow-sm rounded-lg overflow-hidden">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 p-0 rounded-none border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <span className="material-icons text-sm">first_page</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 p-0 rounded-none border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="material-icons text-sm">chevron_left</span>
              </Button>
              
              {/* Page indicator */}
              <div className="h-8 px-3 flex items-center justify-center text-sm text-slate-300 font-medium bg-slate-900 border-y border-slate-700">
                Page {currentPage} of {totalPages}
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 p-0 rounded-none border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="material-icons text-sm">chevron_right</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 p-0 rounded-none border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <span className="material-icons text-sm">last_page</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceAllocation;
