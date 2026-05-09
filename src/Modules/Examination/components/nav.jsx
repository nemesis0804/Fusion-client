import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ModuleTabs from "../../../components/moduleTabs";
import { NavLink } from "react-router-dom";

export default function Nav() {
  const navigate = useNavigate();
  const userRole = useSelector((state) => state.user.role);
  const activeTab = useSelector((state) => state.module.active_tab);
  const [selectedTab, setSelectedTab] = useState(activeTab);

  // Tabs data with role-based filtering
  const tabItems = [
    {
      title: "Submit",
      path: "/examination/submit-grades",
      roles: ["acadadmin", "Professor"],
    },
    {
      title: "Verify",
      path: "/examination/verify-grades",
      roles: ["acadadmin"],
    },
    {
      title: "Announcement",
      path: "/examination/announcement",
      roles: ["acadadmin"],
    },
    {
      title: "Transcript",
      path: "/examination/generate-transcript",
      roles: ["acadadmin"],
    },
    {
      title: "Update",
      path: "/examination/update",
      roles: ["Dean Academic"],
    },
    {
      title: "Validate",
      path: "/examination/validate",
      roles: ["Dean Academic"],
    },
    {
      title: "Result",
      path: "/examination/result",
      roles: ["Student"],
    },
  ];

  // Filter tabs based on user role
  const filteredTabs = tabItems.filter((tab) => tab.roles.includes(userRole));

  // Handle tab change
  const handleTabChange = (index) => {
    setSelectedTab(index);
    navigate(filteredTabs[index].path);
  };

  // Fallback to basic navigation if ModuleTabs component isn't available
  if (!ModuleTabs) {
    const activeLinkStyle = {
      fontWeight: "bold",
      borderBottom: "3px solid black",
      paddingBottom: "0.25rem",
    };

    const defaultLinkStyle = {
      textDecoration: "none",
      padding: "0px 10px",
      color: "black",
      display: "inline-block",
    };

    const linkWrapperStyle = {
      display: "flex",
      alignItems: "center",
      borderRight: "2px solid black",
      padding: "0 15px",
    };

    return (
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "5vh",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              flexWrap: "nowrap",
            }}
          >
            {filteredTabs.map((tab) => (
              <div key={tab.path} style={linkWrapperStyle}>
                <NavLink
                  to={tab.path}
                  style={({ isActive }) =>
                    isActive
                      ? { ...defaultLinkStyle, ...activeLinkStyle }
                      : defaultLinkStyle
                  }
                >
                  {tab.title}
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModuleTabs
      tabs={filteredTabs}
      activeTab={selectedTab}
      setActiveTab={handleTabChange}
    />
  );
}
