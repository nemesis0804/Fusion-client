/* eslint-disable react/prop-types */
import {
  lazy,
  Suspense,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Flex, Loader, Tabs, Text } from "@mantine/core";
import CustomBreadcrumbs from "../../components/Breadcrumbs";
import classes from "./PlacementCell.module.css";
import { apiGet } from "./api";
import { userRolesRoute } from "../../routes/placementCellRoutes";
import NavigationButton from "./components/NavigationButton";

// Lazy load all tab components
const Dashboard = lazy(() => import("./Dashboard.jsx"));
const JobPostings = lazy(() => import("./JobPostings.jsx"));
const MyApplications = lazy(() => import("./MyApplications.jsx"));
const MyOffers = lazy(() => import("./MyOffers.jsx"));
const ManageApplications = lazy(() => import("./ManageApplications.jsx"));
const Appeals = lazy(() => import("./Appeals.jsx"));
const Announcements = lazy(() => import("./Announcements.jsx"));
const Reports = lazy(() => import("./Reports.jsx"));
const PlacementSchedule = lazy(() => import("./PlacementSchedule.jsx"));
const PlacementStatistics = lazy(() => import("./PlacementStatistics.jsx"));
const DebarredStudents = lazy(() => import("./DebarredStudents.jsx"));
const PlacementCalendar = lazy(() => import("./PlacementCalendar.jsx"));
const StudentRecords = lazy(() => import("./StudentRecords.jsx"));
const ManagementTab = lazy(() => import("./ManagementTab.jsx"));
const PlacementProfile = lazy(() => import("./PlacementProfile.jsx"));
const AlumniRegistration = lazy(() => import("./AlumniRegistration.jsx"));
const AlumniDirectory = lazy(() => import("./AlumniDirectory.jsx"));
const MentorshipHub = lazy(() => import("./MentorshipHub.jsx"));
const JobReferrals = lazy(() => import("./JobReferrals.jsx"));
const InterviewManagement = lazy(() => import("./InterviewManagement.jsx"));

// Tab configurations per role
const TAB_CONFIGS = {
  "placement officer": [
    { title: "Dashboard" },
    { title: "Job Postings" },
    { title: "Companies" },
    { title: "Applications" },
    { title: "Appeals" },
    { title: "Announcements" },
    { title: "Reports" },
    { title: "Schedule" },
    { title: "Student Records" },
    { title: "Statistics" },
    { title: "Debarred Students" },
    { title: "Alumni" },
    { title: "Job Referrals" },
    { title: "Interviews" },
  ],
  "placement chairman": [
    { title: "Dashboard" },
    { title: "Job Postings" },
    { title: "Companies" },
    { title: "Applications" },
    { title: "Appeals" },
    { title: "Announcements" },
    { title: "Reports" },
    { title: "Schedule" },
    { title: "Student Records" },
    { title: "Statistics" },
    { title: "Debarred Students" },
    { title: "Alumni" },
    { title: "Job Referrals" },
    { title: "Interviews" },
  ],
  student: [
    { title: "Dashboard" },
    { title: "My Profile" },
    { title: "Job Postings" },
    { title: "My Applications" },
    { title: "My Offers" },
    { title: "Appeals" },
    { title: "Announcements" },
    { title: "Schedule" },
    { title: "Calendar" },
    { title: "Alumni Network" },
    { title: "Mentors" },
    { title: "Job Referrals" },
    { title: "My Interviews" },
    { title: "Statistics" },
  ],
  alumni: [
    { title: "Dashboard" },
    { title: "Alumni Registration" },
    { title: "Mentorship" },
    { title: "Job Referrals" },
    { title: "Announcements" },
  ],
  default: [
    { title: "Dashboard" },
    { title: "Job Postings" },
    { title: "Announcements" },
    { title: "Schedule" },
    { title: "Calendar" },
    { title: "Alumni Registration" },
  ],
};

// Initialize font
(() => {
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
})();

export default function PlacementCell() {
  const [activeTab, setActiveTab] = useState("0");
  const [placementRole, setPlacementRole] = useState("default");
  const [roleLoading, setRoleLoading] = useState(true);
  const tabsListRef = useRef(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await apiGet(userRolesRoute);
        setPlacementRole(res.role || "default");
      } catch {
        setPlacementRole("default");
      }
      setRoleLoading(false);
    };
    fetchRole();
  }, []);

  const tabItems = useMemo(() => {
    return TAB_CONFIGS[placementRole] || TAB_CONFIGS.default;
  }, [placementRole]);

  const handleTabChange = (direction) => {
    const newIndex =
      direction === "next"
        ? Math.min(Number(activeTab) + 1, tabItems.length - 1)
        : Math.max(Number(activeTab) - 1, 0);
    setActiveTab(String(newIndex));

    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({
        left: direction === "next" ? 50 : -50,
        behavior: "smooth",
      });
    }
  };

  const navigateToTab = useCallback(
    (tabTitle) => {
      const idx = tabItems.findIndex((t) => t.title === tabTitle);
      if (idx >= 0) setActiveTab(String(idx));
    },
    [tabItems],
  );

  const getTabContent = () => {
    const tabTitle = tabItems[Number(activeTab)]?.title;

    switch (tabTitle) {
      case "Dashboard":
        return <Dashboard role={placementRole} onTabChange={navigateToTab} />;
      case "My Profile":
        return <PlacementProfile role={placementRole} />;
      case "Job Postings":
        return <JobPostings role={placementRole} />;
      case "My Applications":
        return <MyApplications />;
      case "My Offers":
        return <MyOffers />;
      case "Applications":
        return <ManageApplications />;
      case "Appeals":
        return <Appeals role={placementRole} />;
      case "Companies":
        return <ManagementTab role={placementRole} />;
      case "Announcements":
        return <Announcements role={placementRole} />;
      case "Reports":
        return <Reports />;
      case "Interviews":
      case "My Interviews":
        return <InterviewManagement role={placementRole} />;
      case "Schedule":
        return <PlacementSchedule role={placementRole} />;
      case "Student Records":
        return <StudentRecords role={placementRole} />;
      case "Statistics":
        return <PlacementStatistics role={placementRole} />;
      case "Calendar":
        return <PlacementCalendar role={placementRole} />;
      case "Debarred Students":
        return <DebarredStudents role={placementRole} />;
      case "Alumni":
      case "Alumni Network":
        return <AlumniDirectory role={placementRole} />;
      case "Alumni Registration":
        return <AlumniRegistration />;
      case "Mentors":
      case "Mentorship":
        return <MentorshipHub role={placementRole} />;
      case "Job Referrals":
        return <JobReferrals role={placementRole} />;
      default:
        return <Loader />;
    }
  };

  if (roleLoading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Manrope" }}>
      <CustomBreadcrumbs />
      <Flex justify="space-between" align="center" mt="lg">
        <Flex justify="flex-start" align="center" gap="1rem" mt="1.5rem">
          <NavigationButton
            direction="prev"
            onClick={() => handleTabChange("prev")}
          />

          <div className={classes.fusionTabsContainer} ref={tabsListRef}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List style={{ display: "flex", flexWrap: "nowrap" }}>
                {tabItems.map((item, index) => (
                  <Tabs.Tab
                    value={String(index)}
                    key={item.title}
                    className={
                      activeTab === String(index)
                        ? classes.fusionActiveRecentTab
                        : ""
                    }
                  >
                    <Text>{item.title}</Text>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>

          <NavigationButton
            direction="next"
            onClick={() => handleTabChange("next")}
          />
        </Flex>
      </Flex>

      <div className={classes.pageContent}>
        <Suspense fallback={<Loader />}>{getTabContent()}</Suspense>
      </div>
    </div>
  );
}
