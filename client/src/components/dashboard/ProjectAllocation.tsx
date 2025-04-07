import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
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

type ProjectAllocationData = {
  id: number;
  name: string;
  color: string;
  status: string;
  totalMembers: number;
  members: {
    id: number;
    name: string;
    avatar: string;
    percentage: number;
  }[];
};

type SortField = 'name' | 'totalMembers' | 'status';
type SortDirection = 'asc' | 'desc';

const ProjectAllocation: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: teamMembers, isLoading: teamMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: allocations, isLoading: allocationsLoading } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const isLoading = projectsLoading || teamMembersLoading || allocationsLoading;
  
  // Handle sort click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending by default
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-900/60 text-emerald-300 border border-emerald-700/70";
      case "completed":
        return "bg-slate-900/60 text-slate-300 border border-slate-700/70";
      case "pending":
        return "bg-amber-900/60 text-amber-300 border border-amber-700/70";
      default:
        return "bg-slate-900/60 text-slate-300 border border-slate-700/70";
    }
  };

  // Process data to create project allocation view
  const projectAllocations: ProjectAllocationData[] = React.useMemo(() => {
    if (!projects || !teamMembers || !allocations) return [];

    // First map the data
    const mappedData = projects.map(project => {
      // Get all allocations for this project
      const projectAllocations = allocations.filter(a => a.projectId === project.id);
      
      // Get unique team members for this project
      const memberIds = new Set(projectAllocations.map(a => a.teamMemberId));
      const totalMembers = memberIds.size;
      
      // Create member allocation details
      const members = Array.from(memberIds).map(memberId => {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return null;
        
        // Get allocation percentage for this member on this project
        const allocation = projectAllocations.find(a => a.teamMemberId === memberId);
        const percentage = allocation ? allocation.percentage : 0;
        
        return {
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          percentage
        };
      }).filter(Boolean) as ProjectAllocationData["members"];
      
      return {
        id: project.id,
        name: project.name,
        color: project.color,
        status: project.status,
        totalMembers,
        members
      };
    });
    
    // Then sort the data based on current sort field and direction
    return [...mappedData].sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'totalMembers') {
        return sortDirection === 'asc'
          ? a.totalMembers - b.totalMembers
          : b.totalMembers - a.totalMembers;
      } else if (sortField === 'status') {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });
  }, [projects, teamMembers, allocations, sortField, sortDirection]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col overflow-hidden border-none shadow-md bg-slate-800">
        <CardHeader className="border-b border-slate-700/50 px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-100 to-white bg-clip-text text-transparent">Project Allocation</CardTitle>
        </CardHeader>
        <CardContent className="p-5 animate-pulse">
          <div className="h-64 bg-slate-700/60 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border-none shadow-md bg-slate-800">
      <CardHeader className="border-b border-slate-700/50 px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-100 to-white bg-clip-text text-transparent">Project Allocation</CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex-grow flex flex-col relative bg-slate-800">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full filter blur-xl opacity-20 -mt-20 -mr-20 pointer-events-none"></div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm font-medium text-left text-slate-300 border-b border-slate-700/50 bg-slate-900/60">
                <th className="pb-3 pl-2 pt-3">
                  <Button
                    variant="ghost"
                    className="p-0 font-medium text-slate-300 hover:text-white flex items-center"
                    onClick={() => handleSort('name')}
                  >
                    Project
                    {getSortIcon('name')}
                  </Button>
                </th>
                <th className="pb-3 pt-3">
                  <Button
                    variant="ghost"
                    className="p-0 font-medium text-slate-300 hover:text-white flex items-center"
                    onClick={() => handleSort('totalMembers')}
                  >
                    Total Members
                    {getSortIcon('totalMembers')}
                  </Button>
                </th>
                <th className="pb-3 pt-3">Team Members</th>
                <th className="pb-3 pt-3">
                  <Button
                    variant="ghost"
                    className="p-0 font-medium text-slate-300 hover:text-white flex items-center"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {projectAllocations.map((project, idx) => (
                <tr key={project.id} className={`border-b border-slate-700/50 hover:bg-slate-700/60 transition-colors ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/80'}`}>
                  <td className="py-3 pl-2">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <span className="font-medium text-white">{project.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-300">{project.totalMembers}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      {project.members.map((member) => (
                        <div key={member.id} className="flex items-center text-sm">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name} 
                              className="w-6 h-6 rounded-full mr-2 border border-slate-700"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary mr-2 border border-primary/20">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-slate-300 mr-2">{member.name}</span>
                          <Badge variant="outline" className="ml-auto bg-slate-700/60 text-slate-300 border-slate-600">
                            {member.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge className={getStatusBadge(project.status)}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-5 text-right">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="text-sm font-medium gap-1 rounded-lg border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-slate-200 shadow-sm">
              <span className="material-icons text-sm">visibility</span>
              View All Projects
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectAllocation;