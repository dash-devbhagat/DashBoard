import React from "react";
import QuickStats from "@/components/dashboard/QuickStats";
import ResourceAllocation from "@/components/dashboard/ResourceAllocation";
import TeamAvailability from "@/components/dashboard/TeamAvailability";
import ProjectAllocation from "@/components/dashboard/ProjectAllocation";
import ProjectStatusSummary from "@/components/dashboard/ProjectStatusSummary";

const Dashboard: React.FC = () => {
  return (
    <>
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex">
          <div className="w-full flex-1">
            <TeamAvailability />
          </div>
        </div>
        <div className="lg:col-span-2 flex">
          <div className="w-full flex-1">
            <ResourceAllocation />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-3">
          <ProjectStatusSummary />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-6">
        <div className="lg:col-span-3">
          <ProjectAllocation />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
