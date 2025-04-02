import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  LineChart,
  Line,
} from "recharts";

type DashboardStats = {
  activeProjects: number;
  teamUtilizationAvg: number;
  completedTasks: number;
  unassignedTasks: number;
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
};

type Task = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  estimatedHours: number;
  dueDate: string;
  category: string;
  projectId: number | null;
  assigneeId: number | null;
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

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: teamUtilization, isLoading: utilizationLoading } = useQuery<TeamUtilization[]>({
    queryKey: ["/api/dashboard/team-utilization"],
  });

  const { data: teamMembers, isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const isLoading = statsLoading || utilizationLoading || membersLoading || tasksLoading || projectsLoading;

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

  // Prepare task status chart data
  const taskStatusData = React.useMemo(() => {
    if (!tasks) return [];
    
    const statusCounts = {
      unassigned: 0,
      "in-progress": 0,
      completed: 0,
    };
    
    tasks.forEach(task => {
      if (statusCounts.hasOwnProperty(task.status)) {
        statusCounts[task.status as keyof typeof statusCounts]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      tasks: count
    }));
  }, [tasks]);

  // Prepare task category chart data
  const taskCategoryData = React.useMemo(() => {
    if (!tasks) return [];
    
    const categoryMap = new Map<string, number>();
    
    tasks.forEach(task => {
      const count = categoryMap.get(task.category) || 0;
      categoryMap.set(task.category, count + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      name: category,
      tasks: count
    }));
  }, [tasks]);

  // Prepare mock team performance data (would normally come from API)
  const teamPerformanceData = [
    { month: 'Jan', completion: 85, efficiency: 78 },
    { month: 'Feb', completion: 88, efficiency: 80 },
    { month: 'Mar', completion: 82, efficiency: 75 },
    { month: 'Apr', completion: 90, efficiency: 85 },
    { month: 'May', completion: 93, efficiency: 87 },
    { month: 'Jun', completion: 91, efficiency: 85 }
  ];

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

      <Tabs defaultValue="resource" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="resource">Resource Utilization</TabsTrigger>
          <TabsTrigger value="project">Project Status</TabsTrigger>
          <TabsTrigger value="task">Task Management</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
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
                      data={teamMembers?.map(member => ({
                        name: member.name,
                        role: member.role,
                        allocation: 100 - member.availability,
                      }))}
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
                      data={projects?.map(project => {
                        const startDate = new Date(project.startDate);
                        const endDate = new Date(project.endDate);
                        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return {
                          name: project.name,
                          duration: duration,
                          status: project.status
                        };
                      })}
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

        {/* Task Management Tab */}
        <TabsContent value="task">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={taskStatusData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tasks" name="Number of Tasks" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="tasks"
                      >
                        {taskCategoryData.map((_, index) => (
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
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { priority: 'High', completed: tasks?.filter(t => t.priority === 'high' && t.status === 'completed').length || 0, pending: tasks?.filter(t => t.priority === 'high' && t.status !== 'completed').length || 0 },
                        { priority: 'Medium', completed: tasks?.filter(t => t.priority === 'medium' && t.status === 'completed').length || 0, pending: tasks?.filter(t => t.priority === 'medium' && t.status !== 'completed').length || 0 },
                        { priority: 'Low', completed: tasks?.filter(t => t.priority === 'low' && t.status === 'completed').length || 0, pending: tasks?.filter(t => t.priority === 'low' && t.status !== 'completed').length || 0 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed Tasks" stackId="a" fill="#22c55e" />
                      <Bar dataKey="pending" name="Pending Tasks" stackId="a" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Team Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={teamPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis unit="%" domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completion" name="Task Completion Rate" stroke="#2563eb" strokeWidth={2} />
                      <Line type="monotone" dataKey="efficiency" name="Resource Efficiency" stroke="#4f46e5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks Completed by Role</CardTitle>
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
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="members" name="Team Size" fill="#2563eb" />
                      <Bar dataKey="utilization" name="Tasks Completed" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estimated vs Actual Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { category: 'Frontend', estimated: 120, actual: 140 },
                        { category: 'Backend', estimated: 150, actual: 130 },
                        { category: 'UI/UX', estimated: 80, actual: 85 },
                        { category: 'QA', estimated: 70, actual: 60 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="estimated" name="Estimated Hours" fill="#2563eb" />
                      <Bar dataKey="actual" name="Actual Hours" fill="#eab308" />
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
