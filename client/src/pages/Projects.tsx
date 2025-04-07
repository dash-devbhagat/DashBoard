import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parse, isWithinInterval } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import ResourceAllocationInput from "@/components/dialogs/ResourceAllocationInput";

type Project = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  color: string;
  category?: string | null;
  projectPhase?: string | null;
  projectOwner?: string | null;
  accountManager?: string | null;
  deliveryManager?: string | null;
  contractStatus?: string | null;
};

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

type TimelinePhase = {
  id: number;
  projectId: number;
  name: string;
  startWeek: number;
  durationWeeks: number;
  color: string;
};

// Form schema for project creation and editing with enhanced validations
const projectFormSchema = z.object({
  name: z.string()
    .min(3, { message: "Project name must be at least 3 characters" })
    .max(100, { message: "Project name cannot exceed 100 characters" })
    .refine(val => /^[a-zA-Z0-9\s\-_]+$/.test(val), {
      message: "Project name must contain only alphanumeric characters, spaces, hyphens, and underscores"
    }),
  status: z.enum(["active", "completed", "pending"], {
    errorMap: () => ({ message: "Status must be one of: active, completed, pending" }),
  }),
  startDate: z.string()
    .min(1, { message: "Start date is required" })
    .refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Start date must be in the format YYYY-MM-DD",
    }),
  endDate: z.string()
    .min(1, { message: "End date is required" })
    .refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "End date must be in the format YYYY-MM-DD",
    }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters" }).nullable().optional(),
  color: z.string()
    .min(1, { message: "Color is required" })
    .refine(val => /^#[0-9A-Fa-f]{6}$/.test(val), {
      message: "Color must be a valid hex code (e.g., #2563eb)",
    }),
  category: z.string().max(50, { message: "Category cannot exceed 50 characters" }).optional(),
  projectPhase: z.string().max(50, { message: "Project phase cannot exceed 50 characters" }).optional(),
  projectOwner: z.string().max(100, { message: "Project owner name cannot exceed 100 characters" }).optional(),
  accountManager: z.string().max(100, { message: "Account manager name cannot exceed 100 characters" }).optional(),
  deliveryManager: z.string().max(100, { message: "Delivery manager name cannot exceed 100 characters" }).optional(),
  contractStatus: z.string().max(50, { message: "Contract status cannot exceed 50 characters" }).optional(),
  teamAllocations: z.array(z.object({
    teamMemberId: z.number().int().positive("Team member must be selected"),
    percentage: z.number().min(1, "Allocation must be at least 1%").max(100, "Allocation cannot exceed 100%"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).optional(),
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    }
    return true;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

type ProjectFormValues = z.infer<typeof projectFormSchema>;

// Default project colors
const projectColors = [
  "#4361ee", // Blue
  "#3a0ca3", // Indigo
  "#7209b7", // Purple
  "#f72585", // Pink
  "#4cc9f0", // Cyan
  "#560bad", // Violet
  "#f77f00", // Orange
  "#4f772d", // Green
];

const Projects: React.FC = () => {
  const queryClient = useQueryClient();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isProjectDetailDialogOpen, setIsProjectDetailDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });

  // Queries
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: allocations, isLoading: isLoadingAllocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: isProjectDetailDialogOpen,
  });

  const { data: timelinePhases, isLoading: isLoadingTimelinePhases } = useQuery<TimelinePhase[]>({
    queryKey: ["/api/timeline-phases"],
    enabled: isProjectDetailDialogOpen,
  });

  const isLoading = isLoadingProjects || isLoadingTeamMembers || isLoadingAllocations;
  const isDetailLoading = isLoadingTeamMembers || isLoadingAllocations || isLoadingTasks || isLoadingTimelinePhases;

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (newProject: ProjectFormValues) => {
      // Extract team allocations before sending to API
      const { teamAllocations, ...projectData } = newProject;
      
      // Construct the project data object to send to the API
      const projectToCreate = {
        ...projectData,
        description: projectData.description || null
      };
      
      return apiRequest<Project>("/api/projects", { 
        method: "POST", 
        body: JSON.stringify(projectToCreate)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (project: ProjectFormValues & { id: number }) => {
      // Extract team allocations before sending to API
      const { teamAllocations, ...projectData } = project;
      
      // Construct the project data object to send to the API
      const projectToUpdate = {
        ...projectData,
        description: projectData.description || null
      };
      
      return apiRequest<Project>(`/api/projects/${projectData.id}`, { 
        method: "PATCH", 
        body: JSON.stringify(projectToUpdate)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      setIsEditProjectDialogOpen(false);
    },
  });

  // Create project form
  const newProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: "",
      color: projectColors[0],
      category: "",
      projectPhase: "",
      projectOwner: "",
      accountManager: "",
      deliveryManager: "",
      contractStatus: "",
    },
  });

  // Edit project form
  const editProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      status: "active",
      startDate: "",
      endDate: "",
      description: "",
      color: "",
      category: "",
      projectPhase: "",
      projectOwner: "",
      accountManager: "",
      deliveryManager: "",
      contractStatus: "",
    },
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProjectTeamMembers = (projectId: number) => {
    if (!allocations) return [];
    
    const projectAllocations = allocations.filter(a => a.projectId === projectId);
    // Use array.reduce instead of Set to ensure compatibility
    const memberIds = projectAllocations.reduce((acc: number[], alloc) => {
      if (!acc.includes(alloc.teamMemberId)) {
        acc.push(alloc.teamMemberId);
      }
      return acc;
    }, []);
    
    return teamMembers?.filter(member => memberIds.includes(member.id)) || [];
  };

  const getProjectTasks = (projectId: number) => {
    return tasks?.filter(task => task.projectId === projectId) || [];
  };

  const getProjectTimelinePhases = (projectId: number) => {
    return timelinePhases?.filter(phase => phase.projectId === projectId) || [];
  };

  const getTaskStatusCount = (projectId: number) => {
    const projectTasks = getProjectTasks(projectId);
    
    return {
      notStarted: projectTasks.filter(task => task.status === "not-started").length,
      inProgress: projectTasks.filter(task => task.status === "in-progress").length,
      completed: projectTasks.filter(task => task.status === "completed").length
    };
  };

  const calculateProjectProgress = (projectId: number) => {
    const statusCount = getTaskStatusCount(projectId);
    const totalTasks = statusCount.notStarted + statusCount.inProgress + statusCount.completed;
    
    if (totalTasks === 0) return 0;
    return Math.round((statusCount.completed / totalTasks) * 100);
  };

  // Create allocation mutation
  const createAllocationMutation = useMutation({
    mutationFn: (newAllocation: Omit<Allocation, "id">) => {
      // Create a serializable object for the allocation
      const allocationData = {
        teamMemberId: newAllocation.teamMemberId,
        projectId: newAllocation.projectId,
        percentage: newAllocation.percentage,
        startDate: newAllocation.startDate,
        endDate: newAllocation.endDate
      };
      
      return apiRequest<Allocation>("/api/allocations", { 
        method: "POST", 
        body: JSON.stringify(allocationData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    }
  });

  // Handle create project form submission
  const onCreateProjectSubmit = async (data: ProjectFormValues) => {
    try {
      // First create the project
      const newProject: Project = await createProjectMutation.mutateAsync(data);
      
      // If there are team allocations, create them
      if (data.teamAllocations && data.teamAllocations.length > 0) {
        // Create allocations in sequence to avoid race conditions
        for (const allocation of data.teamAllocations) {
          if (allocation.teamMemberId > 0) {
            await createAllocationMutation.mutateAsync({
              teamMemberId: allocation.teamMemberId,
              projectId: newProject.id,
              percentage: allocation.percentage,
              startDate: allocation.startDate || data.startDate,
              endDate: allocation.endDate || data.endDate
            });
          }
        }
      }
      
      setIsNewProjectDialogOpen(false);
      newProjectForm.reset();
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  // Handle edit project form submission
  const onEditProjectSubmit = async (data: ProjectFormValues) => {
    if (!currentProject) return;
    
    try {
      // First update the project
      await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        ...data
      });
      
      // Handle team allocations
      if (data.teamAllocations && data.teamAllocations.length > 0) {
        // Process allocations in sequence to avoid race conditions
        for (const allocation of data.teamAllocations) {
          if (allocation.teamMemberId > 0) {
            // The server-side logic will handle checking if this allocation already exists
            // and update it instead of creating a duplicate
            await createAllocationMutation.mutateAsync({
              teamMemberId: allocation.teamMemberId,
              projectId: currentProject.id,
              percentage: allocation.percentage,
              startDate: allocation.startDate || data.startDate,
              endDate: allocation.endDate || data.endDate
            });
          }
        }
      }
      
      // Successfully updated, close dialog and show toast
      setIsEditProjectDialogOpen(false);
      editProjectForm.reset(); // Reset form state
      
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  // Handler for viewing project details
  const handleProjectDetailView = (project: Project) => {
    setCurrentProject(project);
    setSelectedTab("overview");
    setIsProjectDetailDialogOpen(true);
  };

  // Handler for editing a project
  const handleProjectEdit = (project: Project) => {
    setCurrentProject(project);
    
    // Get current allocations for this project
    const projectAllocations = allocations?.filter(a => a.projectId === project.id) || [];
    const teamAllocs = projectAllocations.map(a => ({
      teamMemberId: a.teamMemberId,
      percentage: a.percentage,
      startDate: a.startDate,
      endDate: a.endDate
    }));
    
    editProjectForm.reset({
      name: project.name,
      status: project.status as "active" | "completed" | "pending",
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description || "",
      color: project.color,
      category: project.category || "",
      projectPhase: project.projectPhase || "",
      projectOwner: project.projectOwner || "",
      accountManager: project.accountManager || "",
      deliveryManager: project.deliveryManager || "",
      contractStatus: project.contractStatus || "",
      teamAllocations: teamAllocs.length > 0 ? teamAllocs : undefined
    });
    
    setIsEditProjectDialogOpen(true);
  };

  // Handler for deleting a project
  const handleProjectDelete = () => {
    if (!currentProject) return;
    if (window.confirm(`Are you sure you want to delete "${currentProject.name}"?`)) {
      deleteProjectMutation.mutate(currentProject.id);
    }
  };
  
  // Filter projects based on search query and filters
  const filteredProjects = projects?.filter(project => {
    // Apply search filter
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = statusFilter === null || project.status === statusFilter;
    
    // Apply date filters
    let matchesDateFilter = true;
    
    if (dateFilter.startDate) {
      const filterStartDate = new Date(dateFilter.startDate);
      const projectStartDate = new Date(project.startDate);
      matchesDateFilter = matchesDateFilter && projectStartDate >= filterStartDate;
    }
    
    if (dateFilter.endDate) {
      const filterEndDate = new Date(dateFilter.endDate);
      const projectEndDate = new Date(project.endDate);
      matchesDateFilter = matchesDateFilter && projectEndDate <= filterEndDate;
    }
    
    return matchesSearch && matchesStatus && matchesDateFilter;
  }) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
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
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        <Button onClick={() => setIsNewProjectDialogOpen(true)}>
          <span className="material-icons mr-1 text-sm">add</span>
          New Project
        </Button>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-icons text-sm">search</span>
          <Input
            className="pl-10"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Status Filter */}
        <Select 
          value={statusFilter || "all"}
          onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <span className="material-icons mr-2 text-sm">date_range</span>
              {dateFilter.startDate || dateFilter.endDate 
                ? `${dateFilter.startDate ? format(new Date(dateFilter.startDate), "MMM d, yyyy") : "Any start"} - ${dateFilter.endDate ? format(new Date(dateFilter.endDate), "MMM d, yyyy") : "Any end"}`
                : "Filter by date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Date Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={dateFilter.startDate || ""}
                      onChange={(e) => setDateFilter(prev => ({...prev, startDate: e.target.value || null}))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={dateFilter.endDate || ""}
                      onChange={(e) => setDateFilter(prev => ({...prev, endDate: e.target.value || null}))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateFilter({startDate: null, endDate: null})}
                >
                  Reset
                </Button>
                <Button 
                  size="sm"
                  onClick={() => document.body.click()} // Close the popover
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-500">
        {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className="overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="h-2" style={{ backgroundColor: project.color }}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold truncate">{project.name}</CardTitle>
                {getStatusBadge(project.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {project.description || "No description provided."}
              </p>
              
              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium">{format(new Date(project.startDate), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="font-medium">{format(new Date(project.endDate), "MMM d, yyyy")}</span>
                </div>

                
                {/* Team Members */}
                <div className="mt-2 pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Team</span>
                    <span>{getProjectTeamMembers(project.id).length} members</span>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    {getProjectTeamMembers(project.id).slice(0, 5).map((member) => (
                      <img
                        key={member.id}
                        src={member.avatar}
                        alt={member.name}
                        title={`${member.name} (${member.role})`}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                      />
                    ))}
                    {getProjectTeamMembers(project.id).length > 5 && (
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-xs font-medium text-slate-600 ring-2 ring-white">
                        +{getProjectTeamMembers(project.id).length - 5}
                      </div>
                    )}
                    {getProjectTeamMembers(project.id).length === 0 && (
                      <span className="text-xs text-slate-400">No team members assigned</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-600"
                  onClick={() => handleProjectDetailView(project)}
                >
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-600"
                  onClick={() => handleProjectEdit(project)}
                >
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Project Dialog */}
      <Dialog 
        open={isNewProjectDialogOpen} 
        onOpenChange={(open) => {
          setIsNewProjectDialogOpen(open);
          if (!open) {
            // Reset form when modal closes
            newProjectForm.reset({
              name: "",
              status: "active",
              startDate: new Date().toISOString().split("T")[0],
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              description: "",
              color: projectColors[0],
              category: "",
              projectPhase: "",
              projectOwner: "",
              accountManager: "",
              deliveryManager: "",
              contractStatus: "",
            });
          }
        }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <Form {...newProjectForm}>
            <form onSubmit={newProjectForm.handleSubmit(onCreateProjectSubmit)} className="space-y-4">
              <FormField
                control={newProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={newProjectForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProjectForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newProjectForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the project"
                        className="resize-none"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newProjectForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Color</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {projectColors.map((color) => (
                        <div 
                          key={color}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-200 ${
                            field.value === color 
                              ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' 
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={newProjectForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web, Mobile, Infrastructure" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProjectForm.control}
                  name="projectPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Phase</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Discovery, Development" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={newProjectForm.control}
                  name="projectOwner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of project owner" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProjectForm.control}
                  name="accountManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of account manager" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={newProjectForm.control}
                  name="deliveryManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of delivery manager" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProjectForm.control}
                  name="contractStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Status</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Signed, Pending, Renewed" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2 pb-2">
                <div className="border-t border-slate-200 my-4" />
                <ResourceAllocationInput 
                  control={newProjectForm.control} 
                  name="teamAllocations" 
                  disabled={createProjectMutation.isPending}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewProjectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog 
        open={isEditProjectDialogOpen} 
        onOpenChange={(open) => {
          setIsEditProjectDialogOpen(open);
          if (!open) {
            // Reset form when modal closes
            editProjectForm.reset();
          }
        }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          
          <Form {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(onEditProjectSubmit)} className="space-y-4">
              <FormField
                control={editProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editProjectForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the project"
                        className="resize-none"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editProjectForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Color</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {projectColors.map((color) => (
                        <div 
                          key={color}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-200 ${
                            field.value === color 
                              ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' 
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web, Mobile, Infrastructure" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="projectPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Phase</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Discovery, Development" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="projectOwner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of project owner" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="accountManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of account manager" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="deliveryManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of delivery manager" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="contractStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Status</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Signed, Pending, Renewed" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2 pb-2">
                <div className="border-t border-slate-200 my-4" />
                <ResourceAllocationInput 
                  control={editProjectForm.control} 
                  name="teamAllocations" 
                  disabled={updateProjectMutation.isPending}
                  projectId={currentProject?.id}
                />
              </div>
              
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleProjectDelete}
                  disabled={updateProjectMutation.isPending || deleteProjectMutation.isPending}
                >
                  Delete
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditProjectDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProjectMutation.isPending}
                  >
                    {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog 
        open={isProjectDetailDialogOpen} 
        onOpenChange={setIsProjectDetailDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          {currentProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: currentProject.color }}
                  />
                  <DialogTitle>{currentProject.name}</DialogTitle>
                  {getStatusBadge(currentProject.status)}
                </div>
              </DialogHeader>
              
              <div>
                <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full mb-4">
                    <TabsTrigger value="overview" className="w-full">Overview</TabsTrigger>
                  </TabsList>
                  
                  {isDetailLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-slate-200 rounded"></div>
                      <div className="h-40 bg-slate-200 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-lg font-semibold">
                                {format(new Date(currentProject.startDate), "MMM d, yyyy")}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm font-medium">End Date</CardTitle>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-lg font-semibold">
                                {format(new Date(currentProject.endDate), "MMM d, yyyy")}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-md">Description</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-slate-600">
                              {currentProject.description || "No description provided."}
                            </p>
                          </CardContent>
                        </Card>
                        
                        {/* Additional Project Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-md">Project Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">Category</h4>
                                <p className="mt-1">{currentProject.category || "Not specified"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">Project Phase</h4>
                                <p className="mt-1">{currentProject.projectPhase || "Not specified"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">Project Owner</h4>
                                <p className="mt-1">{currentProject.projectOwner || "Not specified"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">Account Manager</h4>
                                <p className="mt-1">{currentProject.accountManager || "Not specified"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">Delivery Manager</h4>
                                <p className="mt-1">{currentProject.deliveryManager || "Not specified"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">Contract Status</h4>
                                <p className="mt-1">{currentProject.contractStatus || "Not specified"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-md">Project Team</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {getProjectTeamMembers(currentProject.id).length === 0 ? (
                              <p className="text-slate-500 text-sm">No team members assigned to this project yet.</p>
                            ) : (
                              <div className="space-y-4">
                                {getProjectTeamMembers(currentProject.id).map((member) => {
                                  const memberAllocation = allocations?.find(
                                    a => a.teamMemberId === member.id && a.projectId === currentProject.id
                                  );
                                  
                                  return (
                                    <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pb-2 sm:pb-0">
                                      <div className="flex items-center gap-3">
                                        <img 
                                          src={member.avatar} 
                                          alt={member.name}
                                          className="w-10 h-10 rounded-full object-cover" 
                                        />
                                        <div>
                                          <p className="font-medium">{member.name}</p>
                                          <p className="text-sm text-slate-500">{member.role}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">
                                          {memberAllocation?.percentage || 0}% Allocation
                                        </p>
                                        <p className="text-sm text-slate-500">
                                          {memberAllocation 
                                            ? `${format(new Date(memberAllocation.startDate), "MMM d")} - ${format(new Date(memberAllocation.endDate), "MMM d")}`
                                            : "No allocation period"
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                    </>
                  )}
                </Tabs>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline"
                  onClick={() => setIsProjectDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button onClick={() => {
                  setIsProjectDetailDialogOpen(false);
                  handleProjectEdit(currentProject);
                }}>
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit Project
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
