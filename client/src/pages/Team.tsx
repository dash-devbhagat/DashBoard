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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

// Task type has been removed

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
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [filterProjects, setFilterProjects] = useState<number[]>([]);
  const [filterAllocation, setFilterAllocation] = useState<string | null>(null);
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [isMemberDetailDialogOpen, setIsMemberDetailDialogOpen] = useState(false);
  const [isNewAllocationDialogOpen, setIsNewAllocationDialogOpen] = useState(false);
  const [isEditAllocationDialogOpen, setIsEditAllocationDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [currentAllocation, setCurrentAllocation] = useState<Allocation | null>(null);
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

  const isLoading = isLoadingTeam || isLoadingAllocations || isLoadingProjects;
  const isDetailLoading = false;

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: (newMember: Omit<TeamMember, "id">) => {
      // Create a serializable object for the team member
      const memberData = {
        name: newMember.name,
        role: newMember.role,
        avatar: newMember.avatar || null,
        availability: newMember.availability,
        skills: newMember.skills
      };
      
      return apiRequest<TeamMember>("/api/team-members", { 
        method: "POST", 
        body: memberData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsNewMemberDialogOpen(false);
      newMemberForm.reset();
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: (member: Partial<TeamMember> & { id: number }) => {
      // Create a serializable object for the team member update
      const memberData = {
        name: member.name,
        role: member.role,
        avatar: member.avatar ?? null,
        availability: member.availability,
        skills: member.skills
      };
      
      return apiRequest<TeamMember>(`/api/team-members/${member.id}`, { 
        method: "PATCH", 
        body: memberData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsEditMemberDialogOpen(false);
      setIsMemberDetailDialogOpen(false);
    },
  });

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
        body: allocationData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
  
  // Update allocation mutation
  const updateAllocationMutation = useMutation({
    mutationFn: (allocation: Partial<Allocation> & { id: number }) => {
      // Create a serializable object for the allocation update
      const allocationData = {
        teamMemberId: allocation.teamMemberId,
        projectId: allocation.projectId,
        percentage: allocation.percentage,
        startDate: allocation.startDate,
        endDate: allocation.endDate,
      };
      
      return apiRequest<Allocation>(`/api/allocations/${allocation.id}`, { 
        method: "PATCH", 
        body: allocationData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsEditAllocationDialogOpen(false);
      setCurrentAllocation(null);
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

  // Helper function to get today's date in YYYY-MM-DD format without timezone issues
  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to get a date in the future in YYYY-MM-DD format
  const getFutureDateFormatted = (daysFromNow: number) => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    const year = future.getFullYear();
    const month = String(future.getMonth() + 1).padStart(2, '0');
    const day = String(future.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // New allocation form
  const newAllocationForm = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      projectId: 0,
      percentage: 25,
      startDate: getTodayFormatted(),
      endDate: getFutureDateFormatted(30),
    },
  });
  
  // Edit allocation form
  const editAllocationForm = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      projectId: 0,
      percentage: 25,
      startDate: getTodayFormatted(),
      endDate: getFutureDateFormatted(30),
    },
  });

  // Helper functions
  const getMemberAllocations = (memberId: number) => {
    return allocations?.filter(a => a.teamMemberId === memberId) || [];
  };

  const getMemberCurrentAllocations = (memberId: number) => {
    // Since allocation dates in database are in the past (2023/2024),
    // we'll treat them as current allocations for display purposes
    return allocations?.filter(a => a.teamMemberId === memberId) || [];
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

  // getMemberTasks function has been removed

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
    if (allocation >= 100) return { label: "Fully Allocated", class: "bg-green-900/60 text-green-300 border border-green-700/70" };
    if (allocation >= 75) return { label: "Partially Allocated", class: "bg-amber-900/60 text-amber-300 border border-amber-700/70" };
    return { label: "Needs Allocation", class: "bg-red-900/60 text-red-300 border border-red-700/70" };
  };

  // Extract all skills from team members
  const allSkills = React.useMemo(() => {
    if (!teamMembers) return [];
    const skillsSet = new Set<string>();
    teamMembers.forEach(member => {
      if (member.skills) {
        member.skills.forEach(skill => skillsSet.add(skill));
      }
    });
    return Array.from(skillsSet).sort();
  }, [teamMembers]);

  // Extract all active projects
  const activeProjects = React.useMemo(() => {
    if (!projects) return [];
    return projects.filter(project => project.status === "active");
  }, [projects]);

  // Filter team members based on all criteria
  const filteredTeamMembers = React.useMemo(() => {
    if (!teamMembers) return [];
    
    return teamMembers.filter(member => {
      // Search term filter
      const matchesSearch = 
        searchTerm === "" ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.skills && member.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
      // Role filter
      const matchesRole = filterRoles.length === 0 || filterRoles.includes(member.role);
      
      // Skill filter
      const matchesSkill = filterSkills.length === 0 || 
        (member.skills && member.skills.some(skill => filterSkills.includes(skill)));
      
      // Project filter
      const matchesProject = filterProjects.length === 0 || 
        getMemberCurrentAllocations(member.id).some(a => filterProjects.includes(a.projectId));
      
      // Allocation status filter
      const totalAllocation = getTotalAllocation(member.id);
      let matchesAllocation = true;
      
      if (filterAllocation === "fully-allocated") {
        matchesAllocation = totalAllocation >= 100;
      } else if (filterAllocation === "partially-allocated") {
        matchesAllocation = totalAllocation >= 75 && totalAllocation < 100;
      } else if (filterAllocation === "needs-allocation") {
        matchesAllocation = totalAllocation < 75;
      }
      
      return matchesSearch && matchesRole && matchesSkill && matchesProject && matchesAllocation;
    });
  }, [teamMembers, searchTerm, filterRoles, filterSkills, filterProjects, filterAllocation, allocations]);

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
  
  // Handle edit allocation form submission
  const onEditAllocationSubmit = (data: AllocationFormValues) => {
    if (!currentAllocation) return;
    
    updateAllocationMutation.mutate({
      id: currentAllocation.id,
      teamMemberId: currentAllocation.teamMemberId,
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
      startDate: getTodayFormatted(),
      endDate: getFutureDateFormatted(30),
    });
    setIsNewAllocationDialogOpen(true);
  };

  // Handler for deleting an allocation
  const handleDeleteAllocation = (allocationId: number) => {
    if (window.confirm("Are you sure you want to remove this project allocation?")) {
      deleteAllocationMutation.mutate(allocationId);
    }
  };
  
  // Handler for editing an allocation
  const handleEditAllocation = (allocation: Allocation) => {
    setCurrentAllocation(allocation);
    editAllocationForm.reset({
      projectId: allocation.projectId,
      percentage: allocation.percentage,
      startDate: allocation.startDate,
      endDate: allocation.endDate
    });
    setIsEditAllocationDialogOpen(true);
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
        <h1 className="text-2xl font-bold text-slate-200">Team Members</h1>
        <Button onClick={() => setIsNewMemberDialogOpen(true)}>
          <span className="material-icons mr-1 text-sm">person_add</span>
          Add Member
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        {/* Search Bar */}
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
        
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Role Filter - Using Dropdown with Checkbox */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-left font-normal"
                >
                  <span>{filterRoles.length === 0 ? "Filter by Role" : `${filterRoles.length} Role${filterRoles.length > 1 ? 's' : ''} Selected`}</span>
                  <span className="material-icons text-sm">expand_more</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setFilterRoles([])}
                    >
                      Clear All
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs ml-auto"
                      onClick={() => setFilterRoles([...availableRoles])}
                    >
                      Select All
                    </Button>
                  </div>
                  {availableRoles.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`role-${role}`} 
                        checked={filterRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterRoles([...filterRoles, role]);
                          } else {
                            setFilterRoles(filterRoles.filter(r => r !== role));
                          }
                        }}
                      />
                      <label 
                        htmlFor={`role-${role}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Skills Filter - Using Dropdown with Checkbox */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-left font-normal"
                >
                  <span>{filterSkills.length === 0 ? "Filter by Skill" : `${filterSkills.length} Skill${filterSkills.length > 1 ? 's' : ''} Selected`}</span>
                  <span className="material-icons text-sm">expand_more</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setFilterSkills([])}
                    >
                      Clear All
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs ml-auto"
                      onClick={() => setFilterSkills([...allSkills])}
                    >
                      Select All
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pr-1">
                    {allSkills.map(skill => (
                      <div key={skill} className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          id={`skill-${skill}`} 
                          checked={filterSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterSkills([...filterSkills, skill]);
                            } else {
                              setFilterSkills(filterSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <label 
                          htmlFor={`skill-${skill}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Project Filter - Using Dropdown with Checkbox */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-left font-normal"
                >
                  <span>{filterProjects.length === 0 ? "Filter by Project" : `${filterProjects.length} Project${filterProjects.length > 1 ? 's' : ''} Selected`}</span>
                  <span className="material-icons text-sm">expand_more</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setFilterProjects([])}
                    >
                      Clear All
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs ml-auto"
                      onClick={() => setFilterProjects(activeProjects.map(p => p.id))}
                    >
                      Select All
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pr-1">
                    {activeProjects.map(project => (
                      <div key={project.id} className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          id={`project-${project.id}`} 
                          checked={filterProjects.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterProjects([...filterProjects, project.id]);
                            } else {
                              setFilterProjects(filterProjects.filter(p => p !== project.id));
                            }
                          }}
                        />
                        <label 
                          htmlFor={`project-${project.id}`}
                          className="text-sm cursor-pointer flex-1 flex items-center"
                        >
                          <div 
                            className="w-2 h-2 rounded-full mr-1.5" 
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Allocation Filter */}
          <div>
            <Select 
              value={filterAllocation || "all-allocations"} 
              onValueChange={value => setFilterAllocation(value === "all-allocations" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Allocation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-allocations">All Allocations</SelectItem>
                <SelectItem value="fully-allocated">Fully Allocated (≥100%)</SelectItem>
                <SelectItem value="partially-allocated">Partially Allocated (75-99%)</SelectItem>
                <SelectItem value="needs-allocation">Needs Allocation (0-74%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Filter Tags (shows active filters with ability to remove) */}
        <div className="flex flex-wrap gap-2">
          {filterRoles.length > 0 && filterRoles.map(role => (
            <Badge 
              key={`role-tag-${role}`}
              variant="secondary" 
              className="flex items-center gap-1 bg-slate-700/60 text-slate-300 border-slate-600"
            >
              Role: {role}
              <button 
                onClick={() => setFilterRoles(filterRoles.filter(r => r !== role))} 
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                <span className="material-icons text-xs">close</span>
              </button>
            </Badge>
          ))}
          
          {filterSkills.length > 0 && filterSkills.map(skill => (
            <Badge 
              key={`skill-tag-${skill}`}
              variant="secondary" 
              className="flex items-center gap-1 bg-slate-700/60 text-slate-300 border-slate-600"
            >
              Skill: {skill}
              <button 
                onClick={() => setFilterSkills(filterSkills.filter(s => s !== skill))} 
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                <span className="material-icons text-xs">close</span>
              </button>
            </Badge>
          ))}
          
          {filterProjects.length > 0 && filterProjects.map(projectId => (
            <Badge 
              key={`project-tag-${projectId}`}
              variant="secondary" 
              className="flex items-center gap-1 bg-slate-700/60 text-slate-300 border-slate-600"
            >
              Project: {getProjectName(projectId)}
              <button 
                onClick={() => setFilterProjects(filterProjects.filter(p => p !== projectId))} 
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                <span className="material-icons text-xs">close</span>
              </button>
            </Badge>
          ))}
          
          {filterAllocation && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 bg-slate-700/60 text-slate-300 border-slate-600"
            >
              {filterAllocation === "fully-allocated" ? "Fully Allocated" :
                filterAllocation === "partially-allocated" ? "Partially Allocated" :
                "Needs Allocation"}
              <button 
                onClick={() => setFilterAllocation(null)} 
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                <span className="material-icons text-xs">close</span>
              </button>
            </Badge>
          )}
          
          {(filterRoles.length > 0 || filterSkills.length > 0 || filterProjects.length > 0 || filterAllocation) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-slate-200"
              onClick={() => {
                setFilterRoles([]);
                setFilterSkills([]);
                setFilterProjects([]);
                setFilterAllocation(null);
              }}
            >
              Clear All
            </Button>
          )}
        </div>
        
        {/* Results count */}
        <div className="text-sm text-slate-400">
          Showing {filteredTeamMembers.length} of {teamMembers?.length || 0} team members
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
              className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-slate-800 border-slate-700"
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
                      <CardTitle className="text-lg font-semibold text-slate-200">{member.name}</CardTitle>
                      <p className="text-sm text-slate-400">{member.role}</p>
                    </div>
                  </div>
                  <Badge className={status.class}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1 text-slate-300">
                    <span>Current Allocation</span>
                    <span className="font-medium">{totalAllocation}%</span>
                  </div>
                  <Progress 
                    value={totalAllocation} 
                    className="h-2"
                    indicatorClassName={
                      totalAllocation >= 100 
                        ? "bg-green-600" 
                        : totalAllocation >= 75 
                          ? "bg-amber-600" 
                          : "bg-red-600"
                    }
                  />
                </div>

                <div className="text-sm text-slate-300">
                  <p className="font-medium mb-2">Current Projects:</p>
                  {memberAllocations.length === 0 ? (
                    <p className="text-slate-400 text-xs">No current project assignments</p>
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
                            <span className="font-medium text-slate-200">{allocation.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {member.skills && member.skills.length > 0 && (
                  <div className="mt-4 text-sm text-slate-300">
                    <p className="font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary"
                          className="text-xs bg-slate-700/70 text-slate-300 hover:bg-slate-700 border-slate-600"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
                    onClick={() => handleMemberDetailView(member)}
                  >
                    <span className="material-icons mr-1 text-sm">visibility</span>
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
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
                    {/* Tasks tab removed */}
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
                                        <div className="w-1/6 text-center flex items-center justify-center">
                                          {isActive && (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="number"
                                                className="w-16 h-8 text-center"
                                                min={1}
                                                max={100}
                                                defaultValue={allocation.percentage}
                                                onBlur={(e) => {
                                                  const newPercentage = parseInt(e.target.value);
                                                  if (newPercentage !== allocation.percentage && 
                                                      newPercentage >= 1 && 
                                                      newPercentage <= 100) {
                                                    updateAllocationMutation.mutate({
                                                      id: allocation.id,
                                                      teamMemberId: allocation.teamMemberId,
                                                      projectId: allocation.projectId,
                                                      percentage: newPercentage,
                                                      startDate: allocation.startDate,
                                                      endDate: allocation.endDate
                                                    });
                                                  }
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                  }
                                                }}
                                              />
                                              <span>%</span>
                                            </div>
                                          )}
                                          {!isActive && (
                                            <Badge variant="outline">
                                              {allocation.percentage}%
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex justify-end w-1/6 gap-1">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7" 
                                            onClick={() => handleEditAllocation(allocation)}
                                          >
                                            <span className="material-icons text-sm text-blue-500">edit</span>
                                          </Button>
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
                      
                      {/* Tasks tab content removed */}
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
