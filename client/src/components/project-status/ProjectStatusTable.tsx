import React from "react";
import { ProjectStatus, Project } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

// Status badge component for the colored status indicators
const StatusBadge: React.FC<{ status: string | null }> = ({ status }) => {
  if (!status) return <span className="inline-block px-2.5 py-0.5 text-xs">-</span>;

  const getStatusClasses = () => {
    switch(status.toLowerCase()) {
      case 'green':
        return "bg-green-100 text-green-800 border border-green-200 font-medium";
      case 'amber':
        return "bg-amber-100 text-amber-800 border border-amber-200 font-medium";
      case 'red':
        return "bg-red-100 text-red-800 border border-red-200 font-medium";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 font-medium";
    }
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs uppercase ${getStatusClasses()}`}>
      {status}
    </span>
  );
};

interface ProjectStatusTableProps {
  projectStatuses: (ProjectStatus & { project?: Project })[];
  isLoading: boolean;
  weekRange: string;
  onProjectClick?: (projectId: number) => void;
}

const ProjectStatusTable: React.FC<ProjectStatusTableProps> = ({ 
  projectStatuses, 
  isLoading,
  weekRange,
  onProjectClick
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="overflow-auto max-w-[calc(100vw-4rem)]">
      <Table className="w-full min-w-[1700px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Project</TableHead>
            {/* Delivery Status Headers */}
            <TableHead colSpan={7} className="text-center text-blue-700 bg-blue-50 border-b border-blue-100">
              Delivery Status
            </TableHead>
            {/* Account Management Headers */}
            <TableHead colSpan={7} className="text-center text-emerald-700 bg-emerald-50 border-b border-emerald-100">
              Account Management
            </TableHead>
            {/* Other Updates */}
            <TableHead colSpan={3} className="text-center text-purple-700 bg-purple-50 border-b border-purple-100">
              Other Updates
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            {/* Delivery Status Subheaders */}
            <TableHead className="bg-blue-50">Contract Hours</TableHead>
            <TableHead className="bg-blue-50">Worked Hours</TableHead>
            <TableHead className="bg-blue-50">Schedule</TableHead>
            <TableHead className="bg-blue-50">Quality</TableHead>
            <TableHead className="bg-blue-50">Resources</TableHead>
            <TableHead className="bg-blue-50">Right Team</TableHead>
            <TableHead className="bg-blue-50">Comments</TableHead>
            
            {/* Account Management Subheaders */}
            <TableHead className="bg-emerald-50">AM Status</TableHead>
            <TableHead className="bg-emerald-50">Comments</TableHead>
            <TableHead className="bg-emerald-50">Governance</TableHead>
            <TableHead className="bg-emerald-50">Last Gov. Meeting</TableHead>
            <TableHead className="bg-emerald-50">Last Invoice</TableHead>
            <TableHead className="bg-emerald-50">Last Received</TableHead>
            <TableHead className="bg-emerald-50">Next Invoice</TableHead>
            
            {/* Other Updates Subheaders */}
            <TableHead className="bg-purple-50">Risks</TableHead>
            <TableHead className="bg-purple-50">Action Items</TableHead>
            <TableHead className="bg-purple-50">Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectStatuses.map((status) => (
            <TableRow 
              key={status.id} 
              className="cursor-pointer hover:bg-muted"
              onClick={() => onProjectClick && onProjectClick(status.projectId)}
            >
              <TableCell className="font-medium">
                {status.project?.name || `Project ${status.projectId}`}
              </TableCell>
              
              {/* Delivery Status Data */}
              <TableCell>{status.contractHours ?? '-'}</TableCell>
              <TableCell>{status.workedHours ?? '-'}</TableCell>
              <TableCell>
                <StatusBadge status={status.scheduleStatus} />
              </TableCell>
              <TableCell>
                <StatusBadge status={status.qualityStatus} />
              </TableCell>
              <TableCell>
                <StatusBadge status={status.resourceUtilizationStatus} />
              </TableCell>
              <TableCell>
                <StatusBadge status={status.rightTeamStatus} />
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={status.deliveryComments || ''}>
                {truncateText(status.deliveryComments)}
              </TableCell>
              
              {/* Account Management Data */}
              <TableCell>
                <StatusBadge status={status.amStatus} />
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={status.amComments || ''}>
                {truncateText(status.amComments)}
              </TableCell>
              <TableCell>
                <StatusBadge status={status.governanceStatus} />
              </TableCell>
              <TableCell>{status.lastGovernanceMeetingDate ? formatDate(status.lastGovernanceMeetingDate) : '-'}</TableCell>
              <TableCell>{status.lastInvoiceDate ? formatDate(status.lastInvoiceDate) : '-'}</TableCell>
              <TableCell>{status.lastReceivableDate ? formatDate(status.lastReceivableDate) : '-'}</TableCell>
              <TableCell>{status.nextInvoiceDate ? formatDate(status.nextInvoiceDate) : '-'}</TableCell>
              
              {/* Other Updates Data */}
              <TableCell className="max-w-[200px] truncate" title={status.risks || ''}>
                {truncateText(status.risks)}
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={status.actionItems || ''}>
                {truncateText(status.actionItems)}
              </TableCell>
              <TableCell>
                {status.actionItemOwner || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectStatusTable;
