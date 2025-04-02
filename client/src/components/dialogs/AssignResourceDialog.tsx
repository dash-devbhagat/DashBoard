import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMemberId?: number;
}

const AssignResourceDialog: React.FC<AssignResourceDialogProps> = ({
  open,
  onOpenChange,
  teamMemberId
}) => {
  const [selectedTeamMember, setSelectedTeamMember] = React.useState<string>("");
  const [selectedProject, setSelectedProject] = React.useState<string>("");
  const [allocationPercentage, setAllocationPercentage] = React.useState<number>(50);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Set selected team member when dialog opens with a teamMemberId
  React.useEffect(() => {
    if (open && teamMemberId) {
      setSelectedTeamMember(teamMemberId.toString());
    } else if (!open) {
      // Reset form when dialog closes
      setSelectedTeamMember("");
      setSelectedProject("");
      setAllocationPercentage(50);
    }
  }, [open, teamMemberId]);

  const assignResourceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeamMember || !selectedProject) {
        throw new Error("Please select both a team member and a project");
      }
      
      const project = projects?.find(p => p.id.toString() === selectedProject);
      if (!project) throw new Error("Invalid project selected");
      
      // Create a new allocation
      return apiRequest("POST", "/api/allocations", {
        teamMemberId: parseInt(selectedTeamMember),
        projectId: parseInt(selectedProject),
        percentage: allocationPercentage,
        startDate: new Date().toISOString(),
        endDate: project.endDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-utilization"] });
      
      toast({
        title: "Resource Assigned",
        description: "The team member has been successfully assigned to the project."
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign resource. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignResourceMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Assign Resource</DialogTitle>
          <DialogDescription>
            Allocate a team member to a project by specifying their allocation percentage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamMember">Team Member</Label>
            <Select 
              value={selectedTeamMember} 
              onValueChange={setSelectedTeamMember}
              disabled={!!teamMemberId}
            >
              <SelectTrigger id="teamMember">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name} ({format(new Date(project.startDate), "MMM d")} - {format(new Date(project.endDate), "MMM d, yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label htmlFor="allocation">Allocation Percentage</Label>
              <span className="text-sm font-medium">{allocationPercentage}%</span>
            </div>
            <Slider
              id="allocation"
              min={10}
              max={100}
              step={5}
              value={[allocationPercentage]}
              onValueChange={(values) => setAllocationPercentage(values[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={assignResourceMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedTeamMember || !selectedProject || assignResourceMutation.isPending}
            >
              {assignResourceMutation.isPending ? "Assigning..." : "Assign Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignResourceDialog;
