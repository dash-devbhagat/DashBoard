import React from "react";
import QuickStats from "@/components/dashboard/QuickStats";
import ResourceAllocation from "@/components/dashboard/ResourceAllocation";
import TeamAvailability from "@/components/dashboard/TeamAvailability";
import ProjectTimeline from "@/components/dashboard/ProjectTimeline";

const Dashboard: React.FC = () => {
  return (
    <>
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TeamAvailability />
        </div>
        <div className="lg:col-span-2">
          <ResourceAllocation />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-6">
        <div className="lg:col-span-3">
          <ProjectTimeline />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
