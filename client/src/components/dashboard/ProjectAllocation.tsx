import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const ProjectAllocation: React.FC = () => {
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

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "completed":
        return "bg-slate-100 text-slate-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Process data to create project allocation view
  const projectAllocations: ProjectAllocationData[] = React.useMemo(() => {
    if (!projects || !teamMembers || !allocations) return [];

    return projects.map(project => {
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
  }, [projects, teamMembers, allocations]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Project Allocation</CardTitle>
        </CardHeader>
        <CardContent className="p-5 animate-pulse">
          <div className="h-64 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <CardTitle className="text-slate-800 text-lg font-semibold">Project Allocation</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm font-medium text-left text-slate-500 border-b border-slate-200">
                <th className="pb-3 pl-2">Project</th>
                <th className="pb-3">Total Members</th>
                <th className="pb-3">Team Members</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {projectAllocations.map((project) => (
                <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pl-2">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <span className="font-medium text-slate-800">{project.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-600">{project.totalMembers}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      {project.members.map((member) => (
                        <div key={member.id} className="flex items-center text-sm">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name} 
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mr-2">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-slate-700 mr-2">{member.name}</span>
                          <Badge variant="outline" className="ml-auto">
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
            <span className="text-sm font-medium text-primary cursor-pointer">
              View All Projects
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectAllocation;