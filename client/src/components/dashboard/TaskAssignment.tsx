import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format, isTomorrow, differenceInDays } from "date-fns";

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

interface TaskAssignmentProps {
  onCreateTask: () => void;
}

const TaskAssignment: React.FC<TaskAssignmentProps> = ({ onCreateTask }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/unassigned"],
  });

  const assignTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // Here you would normally assign the task to a user
      // For this example, we'll just update the task status
      return apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status: "in-progress",
        assigneeId: 1, // Assigning to a default user with ID 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Filter tasks based on search term
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  // Format relative due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (isTomorrow(date)) {
      return "Due tomorrow";
    }
    
    const dayDiff = differenceInDays(date, today);
    
    if (dayDiff < 0) {
      return `Overdue by ${Math.abs(dayDiff)} days`;
    }
    
    if (dayDiff > 0) {
      return `Due in ${dayDiff} days`;
    }
    
    return "Due today";
  };

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-slate-800 text-lg font-semibold">Unassigned Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-5 animate-pulse">
          <div className="h-10 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-slate-200 px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-slate-800 text-lg font-semibold">Unassigned Tasks</CardTitle>
        <Button variant="link" className="text-primary text-sm font-medium p-0">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-slate-400 text-sm">search</span>
            </div>
            <Input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="material-icons text-4xl mb-2">task</span>
              <p>No unassigned tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {task.category} • {task.estimatedHours}h estimated
                    </p>
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-xs text-slate-500 flex items-center">
                    <span className="material-icons text-xs mr-1">event</span>
                    {formatDueDate(task.dueDate)}
                  </span>
                  <Button
                    className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                    onClick={() => assignTaskMutation.mutate(task.id)}
                    disabled={assignTaskMutation.isPending}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-blue-50 transition duration-200 flex items-center justify-center"
            onClick={onCreateTask}
          >
            <span className="material-icons mr-2 text-sm">add_task</span>
            <span>Create New Task</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskAssignment;
