import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  useFieldArray,
  type Control,
  useWatch,
  useFormContext
} from "react-hook-form";
import { Separator } from "@/components/ui/separator";

// Types for form values
type TeamAllocation = {
  teamMemberId: number;
  percentage: number;
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  availability: number;
};

// Allocation type from API
type Allocation = {
  id: number;
  teamMemberId: number;
  projectId: number;
  percentage: number;
  startDate: string;
  endDate: string;
};

interface ResourceAllocationInputProps {
  control: Control<any>;
  name?: string;
  disabled?: boolean;
  projectId?: number; // For edit mode, provides the current project ID
}

const ResourceAllocationInput: React.FC<ResourceAllocationInputProps> = ({
  control,
  name = "teamAllocations",
  disabled = false,
  projectId,
}) => {
  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Fetch existing allocations when in edit mode
  const { data: allocations, isLoading: isLoadingAllocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations", { projectId }],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/allocations?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch allocations');
      return response.json();
    },
    enabled: !!projectId, // Only run query if projectId is provided
  });

  // Setup field array
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  // Watch all team member IDs currently in the form to prevent duplicates
  const teamAllocationsWatch = useWatch({
    name,
    control,
    defaultValue: [],
  }) as TeamAllocation[];

  const selectedTeamMemberIds = teamAllocationsWatch.map(alloc => alloc.teamMemberId);

  // Initialize the form fields with existing allocations when in edit mode
  useEffect(() => {
    if (projectId && allocations && allocations.length > 0 && fields.length === 0) {
      // Clear any existing fields first (shouldn't be necessary, but just to be safe)
      allocations.forEach(allocation => {
        append({
          teamMemberId: allocation.teamMemberId,
          percentage: allocation.percentage,
        });
      });
    }
  }, [projectId, allocations, fields.length, append]);

  const handleAdd = () => {
    append({
      teamMemberId: 0,
      percentage: 25,
    });
  };
  
  // Determine if a team member is already selected in the form
  const isTeamMemberSelected = (teamMemberId: number) => {
    return selectedTeamMemberIds.includes(teamMemberId);
  };

  const isLoadingData = isLoadingTeamMembers || (!!projectId && isLoadingAllocations);

  if (isLoadingData) {
    return <div className="text-sm text-slate-500">Loading...</div>;
  }

  if (!teamMembers || teamMembers.length === 0) {
    return <div className="text-sm text-slate-500">No team members available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Team Allocations</h3>
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          onClick={handleAdd}
          disabled={disabled}
        >
          <span className="material-icons text-xs mr-1">person_add</span>
          Add Resource
        </Button>
      </div>
      
      {fields.length === 0 ? (
        <div className="text-sm text-slate-500 p-4 border border-dashed rounded-md text-center">
          No resources allocated yet. Click "Add Resource" to allocate team members to this project.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2 pb-3 border-b border-slate-200 last:border-0">
              <FormField
                control={control}
                name={`${name}.${index}.teamMemberId`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.map((member) => {
                          // Check if this member is already selected somewhere else in the form
                          const isAlreadySelected = isTeamMemberSelected(member.id) && field.value !== member.id;
                          
                          return (
                            <SelectItem 
                              key={member.id} 
                              value={member.id.toString()}
                              disabled={isAlreadySelected}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-2">
                                  <div className="w-5 h-5 rounded-full overflow-hidden">
                                    <img 
                                      src={member.avatar} 
                                      alt={member.name}
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {member.name} <span className="text-xs text-muted-foreground ml-1">({member.role})</span>
                                  {isAlreadySelected && (
                                    <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-200">
                                      Already allocated
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${name}.${index}.percentage`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          className="w-16"
                          disabled={disabled}
                        />
                        <span className="ml-1">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => remove(index)}
                disabled={disabled}
              >
                <span className="material-icons text-red-500">delete</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceAllocationInput;