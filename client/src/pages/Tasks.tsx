import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateTaskDialog from "@/components/dialogs/CreateTaskDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  availability: number;
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

const Tasks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all necessary data
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers, isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const isLoading = tasksLoading || membersLoading || projectsLoading;

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/unassigned"] });
      toast({
        title: "Task Updated",
        description: "The task status has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update task status.",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getTeamMemberName = (id: number | null) => {
    if (!id) return "Unassigned";
    const member = teamMembers?.find(m => m.id === id);
    return member ? member.name : "Unknown";
  };

  const getProjectName = (id: number | null) => {
    if (!id) return "None";
    const project = projects?.find(p => p.id === id);
    return project ? project.name : "Unknown";
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unassigned":
        return <Badge variant="outline" className="bg-slate-100">Unassigned</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter tasks based on search, status, and project
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Text search filter
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
      
      // Project filter
      const matchesProject = 
        selectedProject === "all" || 
        (selectedProject === "none" && task.projectId === null) || 
        (task.projectId !== null && task.projectId.toString() === selectedProject);
      
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, searchTerm, selectedStatus, selectedProject]);

  // Handle status change
  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({ 
      id: taskId, 
      data: { status: newStatus } 
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 rounded w-full"></div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
        <Button onClick={() => setCreateTaskDialogOpen(true)}>
          <span className="material-icons mr-1 text-sm">add_task</span>
          Create Task
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-slate-400 text-sm">search</span>
              </div>
              <Input
                type="text"
                className="pl-10"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="none">No Project</SelectItem>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="my">My Tasks</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <span className="material-icons text-slate-400 text-4xl">assignment</span>
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No tasks found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {searchTerm || selectedStatus !== "all" || selectedProject !== "all" 
                  ? "Try adjusting your filters to see more results"
                  : "There are no tasks available. Create a new task to get started."}
              </p>
              <Button className="mt-4" onClick={() => setCreateTaskDialogOpen(true)}>
                <span className="material-icons mr-1 text-sm">add_task</span>
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="text-lg font-medium text-slate-800">{task.title}</h3>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <p className="text-slate-600 mb-4 text-sm">{task.description}</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Project</p>
                        <p className="font-medium">{getProjectName(task.projectId)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Category</p>
                        <p className="font-medium">{task.category}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Assignee</p>
                        <p className="font-medium">{getTeamMemberName(task.assigneeId)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Due Date</p>
                        <p className="font-medium">{format(new Date(task.dueDate), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Status:</span>
                      {getStatusBadge(task.status)}
                    </div>
                    
                    <Select 
                      value={task.status} 
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                      disabled={updateTaskMutation.isPending}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm">
                        <span className="material-icons text-sm">edit</span>
                      </Button>
                      <Button variant="outline" size="sm">
                        <span className="material-icons text-sm">delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
      />
    </div>
  );
};

export default Tasks;
