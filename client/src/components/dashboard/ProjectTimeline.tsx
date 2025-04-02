import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Project = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  color: string;
};

type TimelinePhase = {
  id: number;
  projectId: number;
  name: string;
  startWeek: number;
  durationWeeks: number;
  color: string;
};

const ProjectTimeline: React.FC = () => {
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: phases, isLoading: phasesLoading } = useQuery<TimelinePhase[]>({
    queryKey: ["/api/timeline-phases"],
  });

  const isLoading = projectsLoading || phasesLoading;

  // Number of weeks to display in the timeline (12 weeks)
  const totalWeeks = 12;

  // Timeline phase colors
  const phaseColors = {
    "Planning": "#bfdbfe", // blue-100
    "Design": "#c7d2fe", // indigo-100
    "Development": "#bbf7d0", // green-100
    "Testing": "#fef08a", // yellow-100
    "Deployment": "#fecaca", // rose-100
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-5 animate-pulse">
          <div className="h-64 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-slate-200 px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-slate-800 text-lg font-semibold">Project Timeline</CardTitle>
        <div className="flex space-x-2">
          <Select defaultValue="allProjects">
            <SelectTrigger className="text-sm border-slate-300 rounded h-9">
              <SelectValue placeholder="Filter Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allProjects">All Projects</SelectItem>
              <SelectItem value="activeProjects">Active Projects</SelectItem>
              <SelectItem value="completedProjects">Completed Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <div className="min-w-[768px]">
            <div className="flex mb-2 text-xs font-medium text-slate-500">
              <div className="w-1/4">Project</div>
              <div className="w-3/4 flex">
                {Array.from({ length: totalWeeks }).map((_, index) => (
                  <div key={index} className="w-1/12">W{index + 1}</div>
                ))}
              </div>
            </div>

            {projects?.map((project) => {
              const projectPhases = phases?.filter((phase) => phase.projectId === project.id) || [];
              
              return (
                <div key={project.id} className="flex py-3 border-t border-slate-100">
                  <div className="w-1/4">
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <span className="font-medium text-sm">{project.name}</span>
                    </div>
                  </div>
                  <div className="w-3/4 flex items-center relative">
                    {projectPhases.map((phase) => (
                      <div
                        key={phase.id}
                        className="timeline-bar absolute"
                        style={{
                          backgroundColor: phase.color,
                          width: `${(phase.durationWeeks / totalWeeks) * 100}%`,
                          left: `${(phase.startWeek / totalWeeks) * 100}%`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Legend */}
        <div className="mt-5 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-100 mr-2"></div>
            <span className="text-xs text-slate-600">Planning</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-indigo-100 mr-2"></div>
            <span className="text-xs text-slate-600">Design</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-100 mr-2"></div>
            <span className="text-xs text-slate-600">Development</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-yellow-100 mr-2"></div>
            <span className="text-xs text-slate-600">Testing</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-rose-100 mr-2"></div>
            <span className="text-xs text-slate-600">Deployment</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTimeline;
