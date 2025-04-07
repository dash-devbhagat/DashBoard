import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState("thisMonth");
  const [projectFilter, setProjectFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
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

  // Filter projects based on search input and status
  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      const matchesName = project.name.toLowerCase().includes(projectFilter.toLowerCase());
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status);
      
      return matchesName && matchesStatus;
    });
  }, [projects, projectFilter, statusFilter]);

  // Filter team members based on search input and role
  const filteredTeamMembers = React.useMemo(() => {
    if (!teamMembers) return [];
    
    return teamMembers.filter(member => {
      const matchesName = member.name.toLowerCase().includes(roleFilter.toLowerCase());
      const matchesRole = member.role.toLowerCase().includes(roleFilter.toLowerCase());
      
      return matchesName || matchesRole;
    });
  }, [teamMembers, roleFilter]);
  
  const isLoading = statsLoading || utilizationLoading || membersLoading || projectsLoading || hoursLoading;

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

  // Color schemes for charts
  const COLORS = ['#2563eb', '#4f46e5', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];
  const pieColors = ['#2563eb', '#22c55e', '#eab308'];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="h-80 bg-slate-200 rounded w-full"></div>
        <div className="h-80 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
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
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="projectFilter" className="mb-2 block">Project Filter</Label>
          <Input
            id="projectFilter"
            placeholder="Filter by project name"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="roleFilter" className="mb-2 block">Role/Team Member Filter</Label>
          <Input
            id="roleFilter"
            placeholder="Filter by role or team member"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Label className="mb-2 block">Project Status</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="active" 
                checked={statusFilter.includes('active')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, 'active']);
                  } else {
                    setStatusFilter(statusFilter.filter(s => s !== 'active'));
                  }
                }}
              />
              <label htmlFor="active" className="cursor-pointer">Active</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="completed" 
                checked={statusFilter.includes('completed')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, 'completed']);
                  } else {
                    setStatusFilter(statusFilter.filter(s => s !== 'completed'));
                  }
                }}
              />
              <label htmlFor="completed" className="cursor-pointer">Completed</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="on-hold" 
                checked={statusFilter.includes('on-hold')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, 'on-hold']);
                  } else {
                    setStatusFilter(statusFilter.filter(s => s !== 'on-hold'));
                  }
                }}
              />
              <label htmlFor="on-hold" className="cursor-pointer">On Hold</label>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="resource" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="resource">Resource Utilization</TabsTrigger>
          <TabsTrigger value="project">Project Status</TabsTrigger>
        </TabsList>

        {/* Resource Utilization Tab */}
        <TabsContent value="resource">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilization by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={utilizationByRoleData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" unit="%" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="utilization" name="Utilization %" fill="#2563eb" />
                      <Bar yAxisId="right" dataKey="members" name="Team Members" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Team Member Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredTeamMemberData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit="%" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="allocation" name="Current Allocation" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Project Status Tab */}
        <TabsContent value="project">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={filteredProjectTimeline}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit=" days" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="duration" name="Project Duration" fill="#2563eb" />
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
