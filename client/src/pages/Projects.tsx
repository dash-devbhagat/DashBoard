import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Project = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  color: string;
};

const Projects: React.FC = () => {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case "on-hold":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">On Hold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
        <Button>
          <span className="material-icons mr-1 text-sm">add</span>
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: project.color }}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
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
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  <span className="material-icons mr-1 text-sm">people</span>
                  Team
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-600">
                  <span className="material-icons mr-1 text-sm">task_alt</span>
                  Tasks
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-600">
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;
