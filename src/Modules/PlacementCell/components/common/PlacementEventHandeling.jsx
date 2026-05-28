import React from "react";
import JobApplicationsTable from "../tables/AppliedStudentDetails";

function PlacementEventHandeling() {
  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <JobApplicationsTable />
    </div>
  );
}

export default PlacementEventHandeling;
