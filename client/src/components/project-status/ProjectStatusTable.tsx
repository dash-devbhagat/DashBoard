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
        return "bg-green-900/60 text-green-300 border border-green-700/70 font-medium";
      case 'amber':
        return "bg-amber-900/60 text-amber-300 border border-amber-700/70 font-medium";
      case 'red':
        return "bg-red-900/60 text-red-300 border border-red-700/70 font-medium";
      default:
        return "bg-slate-700/60 text-slate-300 border border-slate-600/70 font-medium";
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
            <TableHead className="w-[180px] text-slate-300">Project</TableHead>
            {/* Delivery Status Headers */}
            <TableHead colSpan={7} className="text-center text-blue-300 bg-blue-950/60 border-b border-blue-900">
              Delivery Status
            </TableHead>
            {/* Account Management Headers */}
            <TableHead colSpan={7} className="text-center text-emerald-300 bg-emerald-950/60 border-b border-emerald-900">
              Account Management
            </TableHead>
            {/* Other Updates */}
            <TableHead colSpan={3} className="text-center text-purple-300 bg-purple-950/60 border-b border-purple-900">
              Other Updates
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            {/* Delivery Status Subheaders */}
            <TableHead className="bg-blue-950/40 text-slate-300">Contract Hours</TableHead>
            <TableHead className="bg-blue-950/40 text-slate-300">Worked Hours</TableHead>
            <TableHead className="bg-blue-950/40 text-slate-300">Schedule</TableHead>
            <TableHead className="bg-blue-950/40 text-slate-300">Quality</TableHead>
            <TableHead className="bg-blue-950/40 text-slate-300">Resources</TableHead>
            <TableHead className="bg-blue-950/40 text-slate-300">Right Team</TableHead>
            <TableHead className="bg-blue-950/40 text-slate-300">Comments</TableHead>
            
            {/* Account Management Subheaders */}
            <TableHead className="bg-emerald-950/40 text-slate-300">AM Status</TableHead>
            <TableHead className="bg-emerald-950/40 text-slate-300">Comments</TableHead>
            <TableHead className="bg-emerald-950/40 text-slate-300">Governance</TableHead>
            <TableHead className="bg-emerald-950/40 text-slate-300">Last Gov. Meeting</TableHead>
            <TableHead className="bg-emerald-950/40 text-slate-300">Last Invoice</TableHead>
            <TableHead className="bg-emerald-950/40 text-slate-300">Last Received</TableHead>
            <TableHead className="bg-emerald-950/40 text-slate-300">Next Invoice</TableHead>
            
            {/* Other Updates Subheaders */}
            <TableHead className="bg-purple-950/40 text-slate-300">Risks</TableHead>
            <TableHead className="bg-purple-950/40 text-slate-300">Action Items</TableHead>
            <TableHead className="bg-purple-950/40 text-slate-300">Owner</TableHead>
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
