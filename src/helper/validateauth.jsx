import { useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import {
  setUserName,
  setRollNo,
  setRoles,
  setRole,
  setAccessibleModules,
  setCurrentAccessibleModules,
  clearUserName,
  clearRoles,
} from "../redux/userslice";
import { authRoute, profileRoute } from "../routes/globalRoutes";

const DEFAULT_MODULE_IDS = [
  "complaint_management",
  "course_management",
  "course_registration",
  "department",
  "examinations",
  "fts",
  "gymkhana",
  "home",
  "hostel_management",
  "hr",
  "inventory_management",
  "iwd",
  "mess_management",
  "other_academics",
  "patent_management",
  "phc",
  "placement_cell",
  "program_and_curriculum",
  "purchase_and_store",
  "rspc",
  "spacs",
  "visitor_hostel",
];

const buildFallbackAccessibleModules = (roles = []) => {
  const allModules = Object.fromEntries(
    DEFAULT_MODULE_IDS.map((moduleId) => [moduleId, true]),
  );

  return roles.reduce((acc, role) => {
    acc[role] = allModules;
    return acc;
  }, {});
};

function ValidateAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validateUser = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("No authentication token found!");
      localStorage.removeItem("authToken");
      notifications.show({
        title: "Authentication Error",
        message: "Token Invalid/Expired! Redirecting to login page.",
        color: "red",
      });
      return navigate("/accounts/login");
    }

    try {
      const headers = { Authorization: `Token ${token}` };
      const [{ data: dashboardData }, { data: profileData }] = await Promise.all([
        axios.get(authRoute, { headers }),
        axios.get(profileRoute, { headers }),
      ]);

      const {
        designation_info = [],
        desgination_info = [],
        accessible_modules,
        last_selected_role,
      } = dashboardData;
      const roles = designation_info.length
        ? designation_info
        : desgination_info;
      const profileUser = profileData?.user ?? {};
      const profileInfo = profileData?.profile ?? {};
      const name = [profileUser.first_name, profileUser.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      const rollNo =
        profileInfo.id || profileInfo.roll_no || profileUser.username || "";
      const resolvedAccessibleModules =
        accessible_modules && Object.keys(accessible_modules).length > 0
          ? accessible_modules
          : buildFallbackAccessibleModules(roles);

      console.log("User Data:", { dashboardData, profileData });

      dispatch(setUserName(name || profileUser.username || "User"));
      dispatch(setRollNo(rollNo));
      dispatch(setRoles(roles));

      const selectedRole = last_selected_role || roles[0] || null;
      if (selectedRole) dispatch(setRole(selectedRole));

      dispatch(setAccessibleModules(resolvedAccessibleModules));
      dispatch(setCurrentAccessibleModules());
    } catch (error) {
      console.error("User validation failed:", error);
      const statusCode = error.response?.status;

      if (statusCode === 401 || statusCode === 403) {
        notifications.show({
          title: "Session Expired",
          message: "Your session has expired. Please log in again.",
          color: "red",
        });
        localStorage.removeItem("authToken");
        dispatch(clearUserName());
        dispatch(clearRoles());
        navigate("/accounts/login");
        return;
      }

      notifications.show({
        title: "Authentication Error",
        message: "We could not verify your session right now. Please try again.",
        color: "red",
      });
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    validateUser();
  }, [validateUser]);

  return null;
}

export default ValidateAuth;
