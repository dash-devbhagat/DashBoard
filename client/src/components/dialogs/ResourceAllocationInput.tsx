import React from "react";
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
import { 
  useFieldArray,
  type Control
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

interface ResourceAllocationInputProps {
  control: Control<any>;
  name?: string;
  disabled?: boolean;
}

const ResourceAllocationInput: React.FC<ResourceAllocationInputProps> = ({
  control,
  name = "teamAllocations",
  disabled = false,
}) => {
  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Setup field array
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const handleAdd = () => {
    append({
      teamMemberId: 0,
      percentage: 25,
    });
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading team members...</div>;
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
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
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
                              <div>
                                {member.name} <span className="text-xs text-muted-foreground">({member.role})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
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