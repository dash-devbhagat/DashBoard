import React, { useState } from "react";
import QuickStats from "@/components/dashboard/QuickStats";
import ResourceAllocation from "@/components/dashboard/ResourceAllocation";
import TeamAvailability from "@/components/dashboard/TeamAvailability";
import ProjectTimeline from "@/components/dashboard/ProjectTimeline";
import AssignResourceDialog from "@/components/dialogs/AssignResourceDialog";

const Dashboard: React.FC = () => {
  const [assignResourceDialogOpen, setAssignResourceDialogOpen] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<number | undefined>(undefined);

  const handleEditResource = (teamMemberId: number) => {
    setSelectedTeamMemberId(teamMemberId);
    setAssignResourceDialogOpen(true);
  };

  return (
    <>
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TeamAvailability />
        </div>
        <div className="lg:col-span-2">
          <ResourceAllocation onEdit={handleEditResource} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-6">
        <div className="lg:col-span-3">
          <ProjectTimeline />
        </div>
      </div>

      {/* Dialogs */}
      <AssignResourceDialog 
        open={assignResourceDialogOpen}
        onOpenChange={setAssignResourceDialogOpen}
        teamMemberId={selectedTeamMemberId}
      />
    </>
  );
};

export default Dashboard;
