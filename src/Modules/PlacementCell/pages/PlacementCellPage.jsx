import "@mantine/notifications/styles.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-react-table/styles.css";

import React, { useRef, useState } from "react";
import { Tabs, Button, Container } from "@mantine/core";
import { useSelector } from "react-redux";
import { CaretCircleLeft, CaretCircleRight } from "@phosphor-icons/react";
import CustomBreadcrumbs from "../../../components/Breadcrumbs";
import DownloadCV from "../components/common/DownloadCV";
import PlacementCalendar from "../components/common/PlacementCalendar";
import PlacementSchedule from "../components/common/PlacementSchedule";
import AlumniRegistrationForm from "../components/forms/AlumniRegistrationForm";
import CompanyRegistrationForm from "../components/forms/CompanyRegistrationForm";
import FieldsForm from "../components/forms/FieldsForm";
import SendNotificationForm from "../components/forms/SendNotificationForm";
import AlumniMentorshipSessions from "../components/tables/AlumniMentorshipSessions";
import AlumniNetworkHub from "../components/tables/AlumniNetworkHub";
import AlumniReferrals from "../components/tables/AlumniReferrals";
import AlumniVerificationTable from "../components/tables/AlumniVerificationTable";
import DebarredStudents from "../components/tables/DebarredStudents";
import HigherStudiesTab from "../components/tables/HigherStudiesTab";
import PlacementAppealsPanel from "../components/tables/PlacementAppealsPanel";
import PlacementAppealsReviewTable from "../components/tables/PlacementAppealsReviewTable";
import PlacementPoliciesTab from "../components/tables/PlacementPoliciesTab";
import PlacementRecordsTable from "../components/tables/PlacementRecordsTable";
import PlacementReportsPanel from "../components/tables/PlacementReportsPanel";
import RestrictionsTab from "../components/tables/RestrictionsTab";
import StudentApplicationsTable from "../components/tables/StudentApplicationsTable";
import StudentOffersTable from "../components/tables/StudentOffersTable";
import "../styles/module.css";

const studentTabs = [
  {
    value: "schedule",
    label: "Placement Schedule",
    component: <PlacementSchedule />,
  },
  {
    value: "stats",
    label: "Placement Stats",
    component: <PlacementRecordsTable />,
  },
  {
    value: "applications",
    label: "My Applications",
    component: <StudentApplicationsTable />,
  },
  {
    value: "offers",
    label: "My Offers",
    component: <StudentOffersTable />,
  },
  {
    value: "appeals",
    label: "Placement Appeals",
    component: <PlacementAppealsPanel />,
  },
  { value: "download-cv", label: "Download CV", component: <DownloadCV /> },
  {
    value: "placement-calendar",
    label: "Placement Calendar",
    component: <PlacementCalendar />,
  },
  {
    value: "alumni-network",
    label: "Alumni Network",
    component: <AlumniNetworkHub />,
  },
  {
    value: "alumni-referrals",
    label: "Alumni Referrals",
    component: <AlumniReferrals />,
  },
  {
    value: "mentorship",
    label: "Mentorship Sessions",
    component: <AlumniMentorshipSessions />,
  },
];

const defaultTabs = [
  {
    value: "schedule",
    label: "Placement Schedule",
    component: <PlacementSchedule />,
  },
  {
    value: "stats",
    label: "Placement Stats",
    component: <PlacementRecordsTable />,
  },
  {
    value: "placement-calendar",
    label: "Placement Calendar",
    component: <PlacementCalendar />,
  },
  {
    value: "alumni-registration",
    label: "Alumni Registration",
    component: <AlumniRegistrationForm />,
  },
];

const alumniTabs = [
  {
    value: "alumni-registration",
    label: "Alumni Profile",
    component: <AlumniRegistrationForm />,
  },
  {
    value: "alumni-referrals",
    label: "Job Referrals",
    component: <AlumniReferrals />,
  },
  {
    value: "mentorship",
    label: "Mentorship Sessions",
    component: <AlumniMentorshipSessions />,
  },
  {
    value: "alumni-network",
    label: "Student Network",
    component: <AlumniNetworkHub />,
  },
];

const chairmanTabs = [
  {
    value: "schedule",
    label: "Placement Schedule",
    component: <PlacementSchedule />,
  },
  {
    value: "stats",
    label: "Placement Stats",
    component: <PlacementRecordsTable />,
  },
  {
    value: "placement-calendar",
    label: "Placement Calendar",
    component: <PlacementCalendar />,
  },
  {
    value: "debarred-students",
    label: "Debarred Students",
    component: <DebarredStudents />,
  },
  {
    value: "higher-studies",
    label: "Higher Studies",
    component: <HigherStudiesTab />,
  },
  {
    value: "alumni-verification",
    label: "Alumni Verification",
    component: <AlumniVerificationTable />,
  },
  {
    value: "appeals-review",
    label: "Placement Appeals",
    component: <PlacementAppealsReviewTable />,
  },
  {
    value: "reports",
    label: "Placement Reports",
    component: <PlacementReportsPanel />,
  },
  {
    value: "policies",
    label: "Placement Policies",
    component: <PlacementPoliciesTab />,
  },
];

const tpoTabs = [
  {
    value: "alumni-registration",
    label: "Alumni Request",
    component: <AlumniRegistrationForm />,
  },
  {
    value: "schedule",
    label: "Placement Schedule",
    component: <PlacementSchedule />,
  },
  {
    value: "send-notifications",
    label: "Send Notifications",
    component: <SendNotificationForm />,
  },
  {
    value: "stats",
    label: "Placement Stats",
    component: <PlacementRecordsTable />,
  },
  {
    value: "placement-calendar",
    label: "Placement Calendar",
    component: <PlacementCalendar />,
  },
  {
    value: "company-registration",
    label: "Company Registration",
    component: <CompanyRegistrationForm />,
  },
  {
    value: "fields",
    label: "Fields",
    component: <FieldsForm />,
  },
  {
    value: "debarred-students",
    label: "Debarred Students",
    component: <DebarredStudents />,
  },
  {
    value: "restrictions",
    label: "Restrictions",
    component: <RestrictionsTab />,
  },
  {
    value: "higher-studies",
    label: "Higher Studies",
    component: <HigherStudiesTab />,
  },
  {
    value: "alumni-verification",
    label: "Alumni Verification",
    component: <AlumniVerificationTable />,
  },
  {
    value: "alumni-referrals",
    label: "Alumni Referrals",
    component: <AlumniReferrals />,
  },
  {
    value: "reports",
    label: "Placement Reports",
    component: <PlacementReportsPanel />,
  },
  {
    value: "appeals-review",
    label: "Placement Appeals",
    component: <PlacementAppealsReviewTable />,
  },
];

const styles = {
  navButton: {
    border: "none",
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    fontSize: "1.75rem",
    padding: "8px",
    width: "50px",
    height: "50px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  fusionCaretCircleIcon: {
    fontSize: "2rem",
  },
  tab: {
    fontWeight: "normal",
    color: "#6c757d",
    padding: "10px 20px",
    cursor: "pointer",
  },
  activeTab: {
    backgroundColor: "#15abff10",
    color: "#15abff",
    borderRadius: "4px",
  },
};

function PlacementCellPage() {
  const role = useSelector((state) => state.user.role);
  const [activeTab, setActiveTab] = useState("schedule");
  const tabsContainerRef = useRef(null);

  let tabs = defaultTabs;
  if (role === "student") {
    tabs = studentTabs;
  } else if (role === "alumni") {
    tabs = alumniTabs;
  } else if (role === "placement chairman") {
    tabs = chairmanTabs;
  } else if (role === "placement officer") {
    tabs = tpoTabs;
  }

  const handleTabChange = (direction) => {
    if (!tabsContainerRef.current) return;

    const scrollOffset = direction === "next" ? 220 : -220;
    tabsContainerRef.current.scrollBy({
      left: scrollOffset,
      behavior: "smooth",
    });
  };

  return (
    <div className="placementCellPage">
      <CustomBreadcrumbs />
      <Container fluid mt={48}>
        <div className="navContainer">
          <Button
            onClick={() => handleTabChange("prev")}
            variant="default"
            p={0}
            style={{ border: "none" }}
          >
            <CaretCircleLeft
              style={styles.fusionCaretCircleIcon}
              weight="light"
            />
          </Button>

          <div
            className="fusionTabsContainer tabsContainer"
            ref={tabsContainerRef}
          >
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List className="tabsList">
                {tabs.map((tab) => (
                  <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    style={{
                      ...styles.tab,
                      ...(activeTab === tab.value && styles.activeTab),
                    }}
                    onClick={() => setActiveTab(tab.value)}
                  >
                    {tab.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>

          <Button
            onClick={() => handleTabChange("next")}
            variant="default"
            p={0}
            style={{ border: "none" }}
          >
            <CaretCircleRight
              style={styles.fusionCaretCircleIcon}
              weight="light"
            />
          </Button>
        </div>

        <div className="tabContent">
          {tabs.map((tab) =>
            tab.value === activeTab ? (
              <div key={tab.value}>{tab.component}</div>
            ) : null,
          )}
        </div>
      </Container>
    </div>
  );
}

export default PlacementCellPage;
