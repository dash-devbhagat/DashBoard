import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Project, ProjectStatus } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Helper function to get the previous week's end date (Friday)
const getPreviousWeekEndDate = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days to subtract to get to the previous Friday
  const daysToSubtract = dayOfWeek === 6 ? 1 : dayOfWeek + 2;
  
  const lastFriday = new Date(now);
  lastFriday.setDate(now.getDate() - daysToSubtract);
  
  // Format as YYYY-MM-DD
  return lastFriday.toISOString().split('T')[0];
};

// Helper function to get the week range for display (Saturday to Friday)
const getWeekRangeDisplay = (weekEndDate: string): string => {
  const endDate = new Date(weekEndDate);
  const startDate = new Date(weekEndDate);
  startDate.setDate(endDate.getDate() - 6); // Saturday (6 days before Friday)
  
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
};

// Color badges for status indicators
const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return null;
  
  const colorMap: Record<string, string> = {
    'green': 'bg-green-100 text-green-800 border-green-200',
    'amber': 'bg-amber-100 text-amber-800 border-amber-200',
    'red': 'bg-red-100 text-red-800 border-red-200'
  };
  
  const colorClass = colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} border`}>
      {status.toUpperCase()}
    </span>
  );
};

export default function ProjectStatusPage() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [weekEndDate, setWeekEndDate] = useState<string>(getPreviousWeekEndDate());
  const [projectStatus, setProjectStatus] = useState<Partial<ProjectStatus> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest<Project[]>('/api/projects')
  });
  
  // Fetch project status for the selected project and week
  const { 
    data: statusData, 
    isLoading: isLoadingStatus,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ['/api/project-statuses', selectedProject, weekEndDate],
    queryFn: async () => {
      if (!selectedProject) return null;
      try {
        return await apiRequest<ProjectStatus>(
          `/api/project-statuses?projectId=${selectedProject}&weekEndDate=${weekEndDate}`
        );
      } catch (error) {
        if ((error as any)?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!selectedProject,
  });
  
  // Get the selected project details
  const selectedProjectDetails = selectedProject 
    ? projects?.find(p => p.id === selectedProject) 
    : null;
  
  // Update local state when remote data changes
  useEffect(() => {
    if (statusData) {
      setProjectStatus(statusData);
      setIsEditing(false);
    } else if (selectedProject) {
      // Initialize with empty data if no status exists yet
      setProjectStatus({
        projectId: selectedProject,
        weekEndDate: weekEndDate,
        contractHours: null,
        workedHours: null,
        scheduleStatus: null,
        qualityStatus: null,
        resourceUtilizationStatus: null,
        clientSatisfactionStatus: null,
        scheduleStatusReason: null,
        qualityStatusReason: null,
        resourceUtilizationStatusReason: null,
        clientSatisfactionStatusReason: null,
        risks: null,
        accomplishments: null,
        nextSteps: null,
        actionItems: null,
        actionItemOwner: null
      });
      setIsEditing(true);
    }
  }, [statusData, selectedProject, weekEndDate]);
  
  // Handle saving project status
  const handleSave = async () => {
    if (!projectStatus || !selectedProject) return;
    
    try {
      if (statusData) {
        // Update existing status
        await apiRequest(`/api/project-statuses/${statusData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(projectStatus)
        });
      } else {
        // Create new status
        await apiRequest('/api/project-statuses', {
          method: 'POST',
          body: JSON.stringify(projectStatus)
        });
      }
      
      toast({
        title: "Success",
        description: "Project status has been saved.",
      });
      
      setIsEditing(false);
      refetchStatus();
    } catch (error) {
      console.error('Error saving project status:', error);
      toast({
        title: "Error",
        description: "Failed to save project status.",
        variant: "destructive"
      });
    }
  };
  
  // Handle field changes
  const handleChange = (field: string, value: any) => {
    if (!projectStatus) return;
    
    setProjectStatus(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Project Status</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  if (statusData) {
                    setProjectStatus(statusData);
                  }
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            statusData && <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Status Report</CardTitle>
          <CardDescription>
            View and update project status for the selected week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 mb-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Project
              </label>
              <Select
                value={selectedProject?.toString() || ''}
                onValueChange={(value) => setSelectedProject(Number(value))}
                disabled={isLoadingProjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Week Ending (Friday)
              </label>
              <Input
                type="date"
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                disabled={isLoadingStatus}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Week Range
              </label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                {weekEndDate ? getWeekRangeDisplay(weekEndDate) : ''}
              </div>
            </div>
          </div>
          
          {isLoadingStatus ? (
            <div className="text-center py-4">Loading status data...</div>
          ) : selectedProject ? (
            <div className="space-y-6">
              {/* Project Info */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead colSpan={2} className="font-bold text-lg">
                      Project Information
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Project Name</TableCell>
                    <TableCell>{selectedProjectDetails?.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Category</TableCell>
                    <TableCell>{selectedProjectDetails?.category || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Project Phase</TableCell>
                    <TableCell>{selectedProjectDetails?.projectPhase || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Project Owner</TableCell>
                    <TableCell>{selectedProjectDetails?.projectOwner || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Account Manager</TableCell>
                    <TableCell>{selectedProjectDetails?.accountManager || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Delivery Manager</TableCell>
                    <TableCell>{selectedProjectDetails?.deliveryManager || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contract Status</TableCell>
                    <TableCell>{selectedProjectDetails?.contractStatus || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* Status Indicators */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead colSpan={3} className="font-bold text-lg">
                      Status Indicators
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead>Measure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Schedule</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={projectStatus?.scheduleStatus || ''}
                          onValueChange={(value) => handleChange('scheduleStatus', value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="amber">Amber</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={projectStatus?.scheduleStatus || null} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={projectStatus?.scheduleStatusReason || ''}
                          onChange={(e) => handleChange('scheduleStatusReason', e.target.value || null)}
                          placeholder="Reason for status"
                          className="min-h-[60px]"
                        />
                      ) : (
                        projectStatus?.scheduleStatusReason || '-'
                      )}
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Quality</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={projectStatus?.qualityStatus || ''}
                          onValueChange={(value) => handleChange('qualityStatus', value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="amber">Amber</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={projectStatus?.qualityStatus || null} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={projectStatus?.qualityStatusReason || ''}
                          onChange={(e) => handleChange('qualityStatusReason', e.target.value || null)}
                          placeholder="Reason for status"
                          className="min-h-[60px]"
                        />
                      ) : (
                        projectStatus?.qualityStatusReason || '-'
                      )}
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Resource Utilization</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={projectStatus?.resourceUtilizationStatus || ''}
                          onValueChange={(value) => handleChange('resourceUtilizationStatus', value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="amber">Amber</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={projectStatus?.resourceUtilizationStatus || null} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={projectStatus?.resourceUtilizationStatusReason || ''}
                          onChange={(e) => handleChange('resourceUtilizationStatusReason', e.target.value || null)}
                          placeholder="Reason for status"
                          className="min-h-[60px]"
                        />
                      ) : (
                        projectStatus?.resourceUtilizationStatusReason || '-'
                      )}
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Client Satisfaction</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={projectStatus?.clientSatisfactionStatus || ''}
                          onValueChange={(value) => handleChange('clientSatisfactionStatus', value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="amber">Amber</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={projectStatus?.clientSatisfactionStatus || null} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={projectStatus?.clientSatisfactionStatusReason || ''}
                          onChange={(e) => handleChange('clientSatisfactionStatusReason', e.target.value || null)}
                          placeholder="Reason for status"
                          className="min-h-[60px]"
                        />
                      ) : (
                        projectStatus?.clientSatisfactionStatusReason || '-'
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* Hours */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contract Hours
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={projectStatus?.contractHours || ''}
                      onChange={(e) => handleChange('contractHours', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Enter contract hours"
                    />
                  ) : (
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background">
                      {projectStatus?.contractHours ?? '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Worked Hours
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={projectStatus?.workedHours || ''}
                      onChange={(e) => handleChange('workedHours', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Enter worked hours"
                    />
                  ) : (
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background">
                      {projectStatus?.workedHours ?? '-'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Narrative fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Accomplishments
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={projectStatus?.accomplishments || ''}
                      onChange={(e) => handleChange('accomplishments', e.target.value || null)}
                      placeholder="Key accomplishments for this week"
                      className="min-h-[120px]"
                    />
                  ) : (
                    <div className="p-3 rounded-md border border-input bg-background whitespace-pre-wrap min-h-[80px]">
                      {projectStatus?.accomplishments || '-'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Next Steps
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={projectStatus?.nextSteps || ''}
                      onChange={(e) => handleChange('nextSteps', e.target.value || null)}
                      placeholder="Planned activities for next week"
                      className="min-h-[120px]"
                    />
                  ) : (
                    <div className="p-3 rounded-md border border-input bg-background whitespace-pre-wrap min-h-[80px]">
                      {projectStatus?.nextSteps || '-'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Risks
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={projectStatus?.risks || ''}
                      onChange={(e) => handleChange('risks', e.target.value || null)}
                      placeholder="Current risks and mitigation plans"
                      className="min-h-[120px]"
                    />
                  ) : (
                    <div className="p-3 rounded-md border border-input bg-background whitespace-pre-wrap min-h-[80px]">
                      {projectStatus?.risks || '-'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Action Items
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={projectStatus?.actionItems || ''}
                      onChange={(e) => handleChange('actionItems', e.target.value || null)}
                      placeholder="Action items to be addressed"
                      className="min-h-[120px]"
                    />
                  ) : (
                    <div className="p-3 rounded-md border border-input bg-background whitespace-pre-wrap min-h-[80px]">
                      {projectStatus?.actionItems || '-'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Action Item Owner
                  </label>
                  {isEditing ? (
                    <Input
                      value={projectStatus?.actionItemOwner || ''}
                      onChange={(e) => handleChange('actionItemOwner', e.target.value || null)}
                      placeholder="Name of person responsible for action items"
                    />
                  ) : (
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background">
                      {projectStatus?.actionItemOwner || '-'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Select a project to view status</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}