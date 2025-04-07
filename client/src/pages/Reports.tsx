import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon } from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DashboardStats = {
  activeProjects: number;
  teamUtilizationAvg: number;
};

type TeamUtilization = {
  role: string;
  memberCount: number;
  utilizationPercentage: number;
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  availability: number;
  skills: string[] | null;
};

type CategoryHours = {
  category: string;
  estimated: number;
  actual: number;
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

type Allocation = {
  id: number;
  teamMemberId: number;
  projectId: number;
  percentage: number;
  startDate: string;
  endDate: string;
};

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState("thisMonth");
  const queryClient = useQueryClient();
  
  // Refetch data when component mounts
  useEffect(() => {
    // Force refetch the data to ensure we have the latest
    queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
  }, [queryClient]);
  
  // Function to export team allocation data to Excel
  const exportToExcel = (data: any[]) => {
    // Prepare data for Excel export
    const exportData = data.map(member => {
      // Convert project allocations array to a readable string
      const projectsStr = member.projectAllocations
        .map((alloc: any) => `${alloc.projectName} (${alloc.percentage}%)`)
        .join(", ");
      
      // Map status to friendly text
      const statusText = member.status === 'fullyAllocated' ? 'Fully Allocated' : 
                        member.status === 'partiallyAllocated' ? 'Partial Allocation' : 
                        'Needs Allocation';
      
      // Return a flattened object for Excel
      return {
        "Team Member": member.name,
        "Role": member.role,
        "Projects": projectsStr || "No allocations",
        "Total Allocation": `${member.totalAllocation}%`,
        "Status": statusText
      };
    });
    
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Allocations");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "team_allocations.xlsx");
  };
  
  // Get all the data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: teamUtilization, isLoading: utilizationLoading } = useQuery<TeamUtilization[]>({
    queryKey: ["/api/dashboard/team-utilization"],
  });

  const { data: teamMembers, isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: categoryHours, isLoading: hoursLoading } = useQuery<CategoryHours[]>({
    queryKey: ["/api/dashboard/category-hours"],
  });
  
  const { data: allocations, isLoading: allocationsLoading } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  // Use time range to filter projects
  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Filter projects based on the selected time range
    switch (timeRange) {
      case "thisWeek":
        return projects.filter(project => {
          const startDate = new Date(project.startDate);
          return startDate >= oneWeekAgo || project.status === "active";
        });
      case "thisMonth":
        return projects.filter(project => {
          const startDate = new Date(project.startDate);
          return startDate >= oneMonthAgo || project.status === "active";
        });
      case "lastMonth":
        return projects.filter(project => {
          const startDate = new Date(project.startDate);
          return startDate >= oneMonthAgo && startDate < now;
        });
      case "lastQuarter":
        return projects.filter(project => {
          const startDate = new Date(project.startDate);
          return startDate >= threeMonthsAgo;
        });
      default:
        return projects;
    }
  }, [projects, timeRange]);

  // Get all team members for display
  const filteredTeamMembers = React.useMemo(() => {
    if (!teamMembers) return [];
    return teamMembers;
  }, [teamMembers]);
  
  const isLoading = statsLoading || utilizationLoading || membersLoading || projectsLoading || hoursLoading || allocationsLoading;

  // Prepare utilization by role chart data
  const utilizationByRoleData = React.useMemo(() => {
    if (!teamUtilization) return [];
    return teamUtilization.map(item => ({
      name: item.role,
      utilization: item.utilizationPercentage,
      members: item.memberCount,
    }));
  }, [teamUtilization]);

  // Prepare project status chart data
  const projectStatusData = React.useMemo(() => {
    if (!projects) return [];
    
    const statusCounts = {
      active: 0,
      completed: 0,
      "on-hold": 0,
    };
    
    projects.forEach(project => {
      if (statusCounts.hasOwnProperty(project.status)) {
        statusCounts[project.status as keyof typeof statusCounts]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      value: count
    }));
  }, [projects]);

  // Updated team data for filtered chart display
  const filteredTeamMemberData = React.useMemo(() => {
    return filteredTeamMembers.map(member => ({
      name: member.name,
      role: member.role,
      allocation: 100 - member.availability,
    }));
  }, [filteredTeamMembers]);
  
  // Updated project data for filtered chart display
  const filteredProjectTimeline = React.useMemo(() => {
    return filteredProjects.map(project => {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        name: project.name,
        duration: duration,
        status: project.status
      };
    });
  }, [filteredProjects]);
  
  // Prepare project allocation data for "Team Utilization by Project" component
  const projectAllocationData = React.useMemo(() => {
    if (!allocations || !projects || !teamMembers) return [];
    
    // Group allocations by project
    const projectAllocations = new Map<number, { 
      projectId: number, 
      name: string, 
      color: string,
      totalAllocation: number,
      memberCount: number 
    }>();
    
    // Initialize with all projects
    projects.forEach(project => {
      projectAllocations.set(project.id, {
        projectId: project.id,
        name: project.name,
        color: project.color,
        totalAllocation: 0,
        memberCount: 0
      });
    });
    
    // Sum up allocations for each project
    allocations.forEach(allocation => {
      const projectData = projectAllocations.get(allocation.projectId);
      if (projectData) {
        projectData.totalAllocation += allocation.percentage;
        projectData.memberCount += 1;
      }
    });
    
    // Convert to array and calculate average allocation
    return Array.from(projectAllocations.values())
      .filter(p => p.memberCount > 0) // Only show projects with allocations
      .map(p => ({
        name: p.name,
        allocation: p.totalAllocation / p.memberCount, // Average allocation per team member
        memberCount: p.memberCount,
        color: p.color
      }))
      .sort((a, b) => b.allocation - a.allocation); // Sort by allocation percentage
  }, [allocations, projects, teamMembers]);
  
  // Prepare detailed team allocation data for the table
  // Define sorting state
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Function to sort data based on field and direction
  const sortData = React.useCallback((data: any[], field: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "allocation":
          comparison = a.totalAllocation - b.totalAllocation;
          break;
        case "projects":
          comparison = a.projectCount - b.projectCount;
          break;
        case "status":
          // Custom order: needsAllocation, partiallyAllocated, fullyAllocated
          const statusOrder = {
            "needsAllocation": 0,
            "partiallyAllocated": 1,
            "fullyAllocated": 2
          };
          comparison = statusOrder[a.status as keyof typeof statusOrder] - 
                      statusOrder[b.status as keyof typeof statusOrder];
          break;
        default:
          comparison = 0;
      }
      
      return direction === "asc" ? comparison : -comparison;
    });
  }, []);
  
  // Handle column header click for sorting
  const handleSort = React.useCallback((field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);
  
  const teamAllocationTableData = React.useMemo(() => {
    if (!allocations || !projects || !teamMembers) return [];
    
    // Create a map to group allocations by team member
    const memberAllocations = new Map<number, {
      id: number,
      name: string,
      role: string,
      totalAllocation: number,
      projectAllocations: Array<{
        projectId: number,
        projectName: string,
        projectColor: string,
        percentage: number
      }>
    }>();
    
    // Initialize with all team members
    teamMembers.forEach(member => {
      memberAllocations.set(member.id, {
        id: member.id,
        name: member.name,
        role: member.role,
        totalAllocation: 0, // Start at 0 and calculate from actual allocations
        projectAllocations: []
      });
    });
    
    // Add project allocations for each team member
    allocations.forEach(allocation => {
      const memberData = memberAllocations.get(allocation.teamMemberId);
      const project = projects.find(p => p.id === allocation.projectId);
      
      if (memberData && project) {
        memberData.projectAllocations.push({
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          percentage: allocation.percentage
        });
        
        // Add the allocation percentage to the total
        memberData.totalAllocation += allocation.percentage;
      }
    });
    
    // Convert to array and add status based on allocation
    const result = Array.from(memberAllocations.values())
      .map(member => ({
        ...member,
        status: member.totalAllocation >= 100 ? "fullyAllocated" : 
                member.totalAllocation >= 75 ? "partiallyAllocated" : "needsAllocation",
        projectCount: member.projectAllocations.length
      }));
                
    // Apply sorting
    return sortData(result, sortField, sortDirection);
  }, [allocations, projects, teamMembers, sortField, sortDirection, sortData]);

  // Color schemes for charts
  const COLORS = ['#2563eb', '#4f46e5', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];
  const pieColors = ['#2563eb', '#22c55e', '#eab308'];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-slate-700/50 rounded w-1/4"></div>
        <div className="h-80 bg-slate-700/50 rounded w-full"></div>
        <div className="h-80 bg-slate-700/50 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-200">Reports & Analytics</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisWeek">This Week</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="lastQuarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>
      


      <Tabs defaultValue="resource" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="resource">Resource Utilization</TabsTrigger>
          <TabsTrigger value="project">Project Status</TabsTrigger>
        </TabsList>

        {/* Resource Utilization Tab */}
        <TabsContent value="resource">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Member Allocation Detail - Moved to the top */}
            <Card className="lg:col-span-2 bg-slate-800 border border-slate-700 shadow-lg rounded-xl overflow-hidden border-t-4 border-t-blue-600/80">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
                <div>
                  <CardTitle className="text-xl bg-gradient-to-r from-blue-300 to-indigo-300 text-transparent bg-clip-text font-bold">Team Member Allocation Detail</CardTitle>
                  <CardDescription className="text-slate-300">Detailed allocation by team member and project</CardDescription>
                </div>
                <Button 
                  onClick={() => exportToExcel(teamAllocationTableData)} 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto bg-slate-700/50 hover:bg-slate-700 text-slate-200 border-slate-600"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </CardHeader>
              <CardContent className="bg-slate-800 p-0">
                <div className="rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900">
                        <th 
                          className="text-left p-3 border-b border-slate-700 font-medium text-slate-300 cursor-pointer hover:bg-slate-800"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Team Member
                            {sortField === "name" && (
                              <span className="text-xs text-slate-300">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 border-b border-slate-700 font-medium cursor-pointer hover:bg-slate-700"
                          onClick={() => handleSort("projects")}
                        >
                          <div className="flex items-center gap-1">
                            Projects (allocation %)
                            {sortField === "projects" && (
                              <span className="text-xs text-slate-300">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-center p-3 border-b border-slate-700 font-medium cursor-pointer hover:bg-slate-700"
                          onClick={() => handleSort("allocation")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Allocation %
                            {sortField === "allocation" && (
                              <span className="text-xs text-slate-300">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-center p-3 border-b border-slate-700 font-medium cursor-pointer hover:bg-slate-700"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Status
                            {sortField === "status" && (
                              <span className="text-xs text-slate-300">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamAllocationTableData.map((member) => (
                        <tr key={member.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-800/50">
                          <td className="p-3">
                            <div className="font-medium text-slate-200">{member.name}</div>
                            <div className="text-sm text-slate-400">{member.role}</div>
                          </td>
                          <td className="p-3">
                            {member.projectAllocations.length === 0 ? (
                              <span className="text-slate-500">No allocations</span>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {member.projectAllocations.map((allocation: {
                                  projectId: number,
                                  projectName: string,
                                  projectColor: string,
                                  percentage: number
                                }) => (
                                  <div key={`${member.id}-${allocation.projectId}`} className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: allocation.projectColor }}
                                    />
                                    <span className="text-sm text-slate-300">
                                      {allocation.projectName} ({allocation.percentage}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-medium text-slate-200">
                              {member.totalAllocation}%
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div 
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${member.status === 'fullyAllocated' ? 'bg-green-900/60 text-green-300 border border-green-700/70' : 
                                  member.status === 'partiallyAllocated' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/70' : 
                                  'bg-red-900/60 text-red-300 border border-red-700/70'}`
                              }
                            >
                              {member.status === 'fullyAllocated' ? 'Fully Allocated' : 
                                member.status === 'partiallyAllocated' ? 'Partial Allocation' : 
                                'Needs Allocation'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {/* Team Utilization by Project */}
            <Card className="lg:col-span-2 bg-slate-800 border border-slate-700 shadow-lg rounded-xl overflow-hidden border-t-4 border-t-purple-600/80">
              <CardHeader className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
                <CardTitle className="text-xl bg-gradient-to-r from-purple-300 to-indigo-300 text-transparent bg-clip-text font-bold">Team Utilization by Project</CardTitle>
                <CardDescription className="text-slate-300">Average allocation percentage by project</CardDescription>
              </CardHeader>
              <CardContent className="bg-slate-800 p-5">
                <div className="space-y-4">
                  {projectAllocationData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400">
                      No allocation data available
                    </div>
                  ) : (
                    projectAllocationData.map((project) => (
                      <div key={project.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                            <span className="font-medium text-slate-200">{project.name}</span>
                          </div>
                          <div className="text-sm text-slate-400">
                            {project.allocation.toFixed(0)}% avg allocation ({project.memberCount} team members)
                          </div>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, project.allocation)}%`,
                              backgroundColor: project.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border border-slate-700 shadow-lg rounded-xl overflow-hidden border-t-4 border-t-blue-600/80">
              <CardHeader className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
                <CardTitle className="text-xl bg-gradient-to-r from-blue-300 to-indigo-300 text-transparent bg-clip-text font-bold">Utilization by Role</CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-800 p-5">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={utilizationByRoleData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis yAxisId="left" orientation="left" unit="%" stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                      <Bar yAxisId="left" dataKey="utilization" name="Utilization %" fill="#3b82f6" />
                      <Bar yAxisId="right" dataKey="members" name="Team Members" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border border-slate-700 shadow-lg rounded-xl overflow-hidden border-t-4 border-t-green-600/80">
              <CardHeader className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
                <CardTitle className="text-xl bg-gradient-to-r from-green-300 to-emerald-300 text-transparent bg-clip-text font-bold">Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-800 p-5">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Available', value: dashboardStats?.teamUtilizationAvg || 0 },
                          { name: 'Unassigned', value: 100 - (dashboardStats?.teamUtilizationAvg || 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Project Status Tab */}
        <TabsContent value="project">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border border-slate-700 shadow-lg rounded-xl overflow-hidden border-t-4 border-t-amber-600/80">
              <CardHeader className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
                <CardTitle className="text-xl bg-gradient-to-r from-amber-300 to-yellow-300 text-transparent bg-clip-text font-bold">Project Status Overview</CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-800 p-5">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border border-slate-700 shadow-lg rounded-xl overflow-hidden border-t-4 border-t-indigo-600/80">
              <CardHeader className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
                <CardTitle className="text-xl bg-gradient-to-r from-indigo-300 to-violet-300 text-transparent bg-clip-text font-bold">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-800 p-5">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={filteredProjectTimeline}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" unit=" days" stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" width={150} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                      <Bar dataKey="duration" name="Project Duration" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
