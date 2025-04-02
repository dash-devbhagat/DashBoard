import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import SkillsInput from "@/components/SkillsInput";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  availability: number;
  skills?: string[];
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

// Form schema for team member
const teamMemberFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  avatar: z.string().url({ message: "Please enter a valid URL for the avatar" }),
  availability: z.coerce.number().min(0).max(100),
  skills: z.array(z.string()).optional().default([]),
});

type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

// Form schema for allocation
const allocationFormSchema = z.object({
  projectId: z.coerce.number().min(1, { message: "Project is required" }),
  percentage: z.coerce.number().min(1).max(100, { message: "Percentage must be between 1 and 100" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
});

type AllocationFormValues = z.infer<typeof allocationFormSchema>;

// Available roles for team members
const availableRoles = [
  "UI Designer",
  "UX Researcher",
  "Full Stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "Project Manager",
  "Product Owner",
  "QA Engineer",
  "DevOps Engineer",
  "Data Scientist"
];

// Default avatar URLs
const defaultAvatars = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/24.jpg",
  "https://randomuser.me/api/portraits/men/41.jpg",
  "https://randomuser.me/api/portraits/women/32.jpg",
  "https://randomuser.me/api/portraits/men/54.jpg",
];

const Team: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [isMemberDetailDialogOpen, setIsMemberDetailDialogOpen] = useState(false);
  const [isNewAllocationDialogOpen, setIsNewAllocationDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Queries
  const { data: teamMembers, isLoading: isLoadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: allocations, isLoading: isLoadingAllocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: isMemberDetailDialogOpen,
  });

  const isLoading = isLoadingTeam || isLoadingAllocations || isLoadingProjects;
  const isDetailLoading = isLoadingTasks;

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: (newMember: Omit<TeamMember, "id">) => 
      apiRequest("/api/team-members", { 
        method: "POST", 
        body: {
          ...newMember,
          avatar: newMember.avatar || null
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      setIsNewMemberDialogOpen(false);
      newMemberForm.reset();
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: (member: Partial<TeamMember> & { id: number }) => 
      apiRequest(`/api/team-members/${member.id}`, { 
        method: "PATCH", 
        body: {
          ...member,
          avatar: member.avatar ?? null
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      setIsEditMemberDialogOpen(false);
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/team-members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      setIsEditMemberDialogOpen(false);
      setIsMemberDetailDialogOpen(false);
    },
  });

  // Create allocation mutation
  const createAllocationMutation = useMutation({
    mutationFn: (newAllocation: Omit<Allocation, "id">) => 
      apiRequest("/api/allocations", { 
        method: "POST", 
        body: newAllocation
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      setIsNewAllocationDialogOpen(false);
      newAllocationForm.reset();
    },
  });

  // Delete allocation mutation
  const deleteAllocationMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/allocations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
    },
  });

  // Create member form
  const newMemberForm = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      role: availableRoles[0],
      avatar: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
      availability: 100,
    },
  });

  // Edit member form
  const editMemberForm = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      role: "",
      avatar: "",
      availability: 100,
    },
  });

  // New allocation form
  const newAllocationForm = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      projectId: 0,
      percentage: 25,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  // Helper functions
  const getMemberAllocations = (memberId: number) => {
    return allocations?.filter(a => a.teamMemberId === memberId) || [];
  };

  const getMemberCurrentAllocations = (memberId: number) => {
    const now = new Date();
    return allocations?.filter(a => 
      a.teamMemberId === memberId &&
      isBefore(now, new Date(a.endDate)) &&
      isAfter(now, new Date(a.startDate))
    ) || [];
  };

  const getMemberUpcomingAllocations = (memberId: number) => {
    const now = new Date();
    return allocations?.filter(a => 
      a.teamMemberId === memberId &&
      isAfter(new Date(a.startDate), now)
    ) || [];
  };

  const getMemberPastAllocations = (memberId: number) => {
    const now = new Date();
    return allocations?.filter(a => 
      a.teamMemberId === memberId &&
      isBefore(new Date(a.endDate), now)
    ) || [];
  };

  const getMemberTasks = (memberId: number) => {
    return tasks?.filter(task => task.assigneeId === memberId) || [];
  };

  const getProjectName = (projectId: number) => {
    return projects?.find(p => p.id === projectId)?.name || "Unknown Project";
  };

  const getProjectById = (projectId: number) => {
    return projects?.find(p => p.id === projectId);
  };

  const getTotalAllocation = (memberId: number) => {
    const memberCurrentAllocations = getMemberCurrentAllocations(memberId);
    return memberCurrentAllocations.reduce((sum, a) => sum + a.percentage, 0);
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
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Filter by skills
        (member.skills && member.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );
  }, [teamMembers, searchTerm]);

  // Handle create member form submission
  const onCreateMemberSubmit = (data: TeamMemberFormValues) => {
    createMemberMutation.mutate(data);
  };

  // Handle edit member form submission
  const onEditMemberSubmit = (data: TeamMemberFormValues) => {
    if (!currentMember) return;
    
    updateMemberMutation.mutate({
      id: currentMember.id,
      ...data
    });
  };

  // Handle create allocation form submission
  const onCreateAllocationSubmit = (data: AllocationFormValues) => {
    if (!currentMember) return;
    
    createAllocationMutation.mutate({
      teamMemberId: currentMember.id,
      ...data
    });
  };

  // Handler for viewing member details
  const handleMemberDetailView = (member: TeamMember) => {
    setCurrentMember(member);
    setSelectedTab("overview");
    setIsMemberDetailDialogOpen(true);
  };

  // Handler for editing a member
  const handleMemberEdit = (member: TeamMember) => {
    setCurrentMember(member);
    editMemberForm.reset({
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      availability: member.availability,
      skills: member.skills || [],
    });
    setIsEditMemberDialogOpen(true);
  };

  // Handler for deleting a member
  const handleMemberDelete = () => {
    if (!currentMember) return;
    if (window.confirm(`Are you sure you want to delete "${currentMember.name}"?`)) {
      deleteMemberMutation.mutate(currentMember.id);
    }
  };

  // Handler for adding a new allocation
  const handleAddAllocation = (member: TeamMember) => {
    setCurrentMember(member);
    newAllocationForm.reset({
      projectId: 0,
      percentage: 25,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setIsNewAllocationDialogOpen(true);
  };

  // Handler for deleting an allocation
  const handleDeleteAllocation = (allocationId: number) => {
    if (window.confirm("Are you sure you want to remove this project allocation?")) {
      deleteAllocationMutation.mutate(allocationId);
    }
  };

  // Loading state
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
        <Button onClick={() => setIsNewMemberDialogOpen(true)}>
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
            placeholder="Search by name, role, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeamMembers.map((member) => {
          const totalAllocation = getTotalAllocation(member.id);
          const status = getAvailabilityStatus(totalAllocation);
          const memberAllocations = getMemberCurrentAllocations(member.id);

          return (
            <Card 
              key={member.id} 
              className="overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-10 h-10 rounded-full mr-3 object-cover"
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
                    <span>Current Allocation</span>
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
                      {memberAllocations.map((allocation) => {
                        const project = getProjectById(allocation.projectId);
                        
                        return (
                          <div key={allocation.id} className="flex justify-between text-xs items-center">
                            <div className="flex items-center">
                              {project && (
                                <div 
                                  className="w-2 h-2 rounded-full mr-1.5" 
                                  style={{ backgroundColor: project.color }}
                                />
                              )}
                              <span>{getProjectName(allocation.projectId)}</span>
                            </div>
                            <span className="font-medium">{allocation.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {member.skills && member.skills.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-600"
                    onClick={() => handleMemberDetailView(member)}
                  >
                    <span className="material-icons mr-1 text-sm">visibility</span>
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-600"
                    onClick={() => handleMemberEdit(member)}
                  >
                    <span className="material-icons mr-1 text-sm">edit</span>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Member Dialog */}
      <Dialog open={isNewMemberDialogOpen} onOpenChange={setIsNewMemberDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
          </DialogHeader>
          
          <Form {...newMemberForm}>
            <form onSubmit={newMemberForm.handleSubmit(onCreateMemberSubmit)} className="space-y-4">
              <FormField
                control={newMemberForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team member name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newMemberForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newMemberForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter avatar URL" {...field} />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {defaultAvatars.map((avatar) => (
                        <img 
                          key={avatar}
                          src={avatar} 
                          alt="Avatar option"
                          className={`w-10 h-10 rounded-full object-cover cursor-pointer transition-all duration-200 ${
                            field.value === avatar 
                              ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                              : 'hover:scale-110'
                          }`}
                          onClick={() => field.onChange(avatar)}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={newMemberForm.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Availability (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newMemberForm.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <SkillsInput 
                        value={field.value || []} 
                        onChange={field.onChange}
                        placeholder="Type a skill and press Enter..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewMemberDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMemberMutation.isPending}
                >
                  {createMemberMutation.isPending ? "Creating..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          
          <Form {...editMemberForm}>
            <form onSubmit={editMemberForm.handleSubmit(onEditMemberSubmit)} className="space-y-4">
              <FormField
                control={editMemberForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team member name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editMemberForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editMemberForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter avatar URL" {...field} />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {defaultAvatars.map((avatar) => (
                        <img 
                          key={avatar}
                          src={avatar} 
                          alt="Avatar option"
                          className={`w-10 h-10 rounded-full object-cover cursor-pointer transition-all duration-200 ${
                            field.value === avatar 
                              ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                              : 'hover:scale-110'
                          }`}
                          onClick={() => field.onChange(avatar)}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editMemberForm.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Availability (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editMemberForm.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <SkillsInput 
                        value={field.value || []} 
                        onChange={field.onChange}
                        placeholder="Type a skill and press Enter..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleMemberDelete}
                  disabled={updateMemberMutation.isPending || deleteMemberMutation.isPending}
                >
                  Delete
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditMemberDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMemberMutation.isPending}
                  >
                    {updateMemberMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Allocation Dialog */}
      <Dialog open={isNewAllocationDialogOpen} onOpenChange={setIsNewAllocationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Assign Project to {currentMember?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...newAllocationForm}>
            <form onSubmit={newAllocationForm.handleSubmit(onCreateAllocationSubmit)} className="space-y-4">
              <FormField
                control={newAllocationForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects?.filter(p => p.status !== "completed").map(project => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newAllocationForm.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocation Percentage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={100} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newAllocationForm.control}
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
                  control={newAllocationForm.control}
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewAllocationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAllocationMutation.isPending}
                >
                  {createAllocationMutation.isPending ? "Assigning..." : "Assign Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog 
        open={isMemberDetailDialogOpen} 
        onOpenChange={setIsMemberDetailDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          {currentMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <img 
                    src={currentMember.avatar} 
                    alt={currentMember.name}
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <DialogTitle>{currentMember.name}</DialogTitle>
                    <p className="text-sm text-slate-500">{currentMember.role}</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div>
                <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="allocations">Allocations</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>
                  
                  {isDetailLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-slate-200 rounded"></div>
                      <div className="h-40 bg-slate-200 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm font-medium">Base Availability</CardTitle>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-lg font-semibold">
                                {currentMember.availability}%
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm font-medium">Current Allocation</CardTitle>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-lg font-semibold">
                                {getTotalAllocation(currentMember.id)}%
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm font-medium">Status</CardTitle>
                            </CardHeader>
                            <CardContent className="py-0">
                              <Badge className={getAvailabilityStatus(getTotalAllocation(currentMember.id)).class}>
                                {getAvailabilityStatus(getTotalAllocation(currentMember.id)).label}
                              </Badge>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {currentMember.skills && currentMember.skills.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-md">Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {currentMember.skills.map((skill) => (
                                  <Badge 
                                    key={skill} 
                                    variant="secondary"
                                    className="text-sm px-3 py-1"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-md">Current Projects</CardTitle>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddAllocation(currentMember)}
                            >
                              <span className="material-icons mr-1 text-sm">add</span>
                              Assign Project
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {getMemberCurrentAllocations(currentMember.id).length === 0 ? (
                              <p className="text-slate-500 text-sm">No current project assignments</p>
                            ) : (
                              <div className="space-y-4">
                                {getMemberCurrentAllocations(currentMember.id).map((allocation) => {
                                  const project = getProjectById(allocation.projectId);
                                  
                                  return (
                                    <div key={allocation.id} className="flex justify-between items-start border-b pb-3 last:border-b-0 last:pb-0">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          {project && (
                                            <div 
                                              className="w-3 h-3 rounded-full" 
                                              style={{ backgroundColor: project.color }}
                                            />
                                          )}
                                          <p className="font-medium">{getProjectName(allocation.projectId)}</p>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {format(new Date(allocation.startDate), "MMM d, yyyy")} - {format(new Date(allocation.endDate), "MMM d, yyyy")}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline">{allocation.percentage}%</Badge>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7" 
                                          onClick={() => handleDeleteAllocation(allocation.id)}
                                        >
                                          <span className="material-icons text-sm text-red-500">delete</span>
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        {getMemberUpcomingAllocations(currentMember.id).length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-md">Upcoming Assignments</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {getMemberUpcomingAllocations(currentMember.id).map((allocation) => {
                                  const project = getProjectById(allocation.projectId);
                                  
                                  return (
                                    <div key={allocation.id} className="flex justify-between items-start border-b pb-3 last:border-b-0 last:pb-0">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          {project && (
                                            <div 
                                              className="w-3 h-3 rounded-full" 
                                              style={{ backgroundColor: project.color }}
                                            />
                                          )}
                                          <p className="font-medium">{getProjectName(allocation.projectId)}</p>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {format(new Date(allocation.startDate), "MMM d, yyyy")} - {format(new Date(allocation.endDate), "MMM d, yyyy")}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline">{allocation.percentage}%</Badge>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7" 
                                          onClick={() => handleDeleteAllocation(allocation.id)}
                                        >
                                          <span className="material-icons text-sm text-red-500">delete</span>
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="allocations" className="space-y-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-md">All Allocations</CardTitle>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddAllocation(currentMember)}
                            >
                              <span className="material-icons mr-1 text-sm">add</span>
                              Assign Project
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {getMemberAllocations(currentMember.id).length === 0 ? (
                              <p className="text-slate-500 text-sm">No allocations for this team member</p>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex justify-between text-sm font-medium border-b pb-2 text-slate-500">
                                  <span>Project</span>
                                  <span>Period</span>
                                  <span>Allocation</span>
                                  <span>Actions</span>
                                </div>
                                {getMemberAllocations(currentMember.id)
                                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                                  .map((allocation) => {
                                    const project = getProjectById(allocation.projectId);
                                    const isActive = 
                                      new Date() >= new Date(allocation.startDate) && 
                                      new Date() <= new Date(allocation.endDate);
                                    const isPast = new Date() > new Date(allocation.endDate);
                                    const isFuture = new Date() < new Date(allocation.startDate);
                                    
                                    return (
                                      <div key={allocation.id} className="flex justify-between items-center py-2">
                                        <div className="flex items-center gap-2 w-1/4">
                                          {project && (
                                            <div 
                                              className="w-3 h-3 rounded-full" 
                                              style={{ backgroundColor: project.color }}
                                            />
                                          )}
                                          <span className="font-medium truncate">{getProjectName(allocation.projectId)}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 w-1/3 text-center">
                                          {format(new Date(allocation.startDate), "MMM d, yyyy")} - {format(new Date(allocation.endDate), "MMM d, yyyy")}
                                        </div>
                                        <div className="w-1/6 text-center">
                                          <Badge variant={isActive ? "default" : "outline"}>
                                            {allocation.percentage}%
                                          </Badge>
                                        </div>
                                        <div className="flex justify-end w-1/6">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7" 
                                            onClick={() => handleDeleteAllocation(allocation.id)}
                                          >
                                            <span className="material-icons text-sm text-red-500">delete</span>
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })
                                }
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="tasks" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-md">Assigned Tasks</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {getMemberTasks(currentMember.id).length === 0 ? (
                              <p className="text-slate-500 text-sm">No tasks assigned to this team member</p>
                            ) : (
                              <div className="space-y-4">
                                {getMemberTasks(currentMember.id).map((task) => {
                                  let statusClass = "bg-slate-100 text-slate-800";
                                  if (task.status === "completed") {
                                    statusClass = "bg-green-100 text-green-800";
                                  } else if (task.status === "in-progress") {
                                    statusClass = "bg-blue-100 text-blue-800";
                                  }
                                  
                                  let priorityClass = "bg-slate-100 text-slate-800";
                                  if (task.priority === "high") {
                                    priorityClass = "bg-red-100 text-red-800";
                                  } else if (task.priority === "medium") {
                                    priorityClass = "bg-amber-100 text-amber-800";
                                  }
                                  
                                  return (
                                    <div key={task.id} className="p-3 border rounded-lg">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium">{task.title}</h4>
                                        <div className="flex gap-2">
                                          <Badge className={priorityClass}>{task.priority}</Badge>
                                          <Badge className={statusClass}>{task.status}</Badge>
                                        </div>
                                      </div>
                                      
                                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                        {task.description || "No description provided."}
                                      </p>
                                      
                                      <div className="flex justify-between text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                          <span className="material-icons text-xs">schedule</span>
                                          <span>{task.estimatedHours} hours</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <span className="material-icons text-xs">event</span>
                                          <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                                        </div>
                                        
                                        {task.projectId ? (
                                          <div className="flex items-center gap-2">
                                            <span className="material-icons text-xs">folder</span>
                                            <span>{getProjectName(task.projectId)}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <span className="material-icons text-xs">folder_off</span>
                                            <span>No Project</span>
                                          </div>
                                        )}
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
                  onClick={() => setIsMemberDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button onClick={() => {
                  setIsMemberDetailDialogOpen(false);
                  handleMemberEdit(currentMember);
                }}>
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit Member
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
