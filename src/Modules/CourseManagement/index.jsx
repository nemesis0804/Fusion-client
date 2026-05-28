import { useState } from "react";
import { useSelector } from "react-redux";
import ModuleTabs from "../../components/moduleTabs";
import CustomBreadcrumbs from "../../components/Breadcrumbs";
import Announcements from "./components/Announcements";
import Attendance from "./components/Attendance";
import CourseContent from "./components/CourseContent";
// import SubmitMarks from "./components/SubmitMarks";
import EvaluateAssignment from "./components/EvaluateAssignment";
// import ManageEvaluations from "./components/ManageEvaluations";
import StdAssignmentSub from "./components/StdAssignmentSub";
import StdAttendance from "./components/StdAttendance";
import StudentviewContent from "./components/StudentviewContent";
// import Courses from "./components/Student_Registration/Courses";
import StdViewmarks from "./components/StdViewmarks";
// import Finalreg from "./components/Student_Registration/Finalreg";
import GradeScheme from "./components/GradeScheme";
import "./index.css";

function CourseManagementPage() {
  const [activeTab, setActiveTab] = useState("0"); // Default active tab
  const role = useSelector((state) => state.user.role);

  // Define tabs based on user role
  const tabs =
    role === "Professor"
      ? [
          { title: "Announcements" },
          { title: "Attendance" },
          { title: "Course Content" },
          { title: "Evaluate Assignment" },
          // { title: "Manage Evaluations" },
          // { title: "Submit Marks" },
          { title: "Grading Scheme" },
        ]
      : [
          { title: "Attendance" },
          { title: "View Content" },
          // { title: "Courses" },
          // { title: "Final Registration" },
          { title: "Assignment Submit" },
          { title: "View Marks" },
        ];

  // Define the badges (if applicable, or use an empty array)
  const badges = new Array(tabs.length).fill(0); // Example: no badges for now

  // Render component based on active tab and role
  const renderComponent = () => {
    if (role === "Professor") {
      switch (
        tabs[parseInt(activeTab, 10)].title // Added radix (10)
      ) {
        case "Announcements":
          return <Announcements />;
        case "Attendance":
          return <Attendance />;
        case "Course Content":
          return <CourseContent />;
        case "Evaluate Assignment":
          return <EvaluateAssignment />;
        case "Grading Scheme":
          return <GradeScheme />;
        // case "Manage Evaluations":
        //   return <ManageEvaluations />;
        // case "Submit Marks":
        //   return <SubmitMarks />;

        default:
          return <Announcements />;
      }
    } else {
      switch (
        tabs[parseInt(activeTab, 10)].title // Added radix (10)
      ) {
        case "Attendance":
          return <StdAttendance />;
        case "View Content":
          return <StudentviewContent />;
        // case "Courses":
        //   return <Courses />;
        // case "Final Registration":
        //   return <Finalreg />;
        case "Assignment Submit":
          return <StdAssignmentSub />;
        case "View Marks":
          return <StdViewmarks />;
        default:
          return <StdAttendance />;
      }
    }
  };

  return (
    <>
      <CustomBreadcrumbs />
      <ModuleTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badges={badges}
      />
      <div style={{ marginTop: "1rem" }}>{renderComponent()}</div>
    </>
  );
}

export default CourseManagementPage;
