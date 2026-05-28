import { notifications } from "@mantine/notifications";

export const PLACEMENT_OFFICER_ROLES = ["placement officer"];
export const PLACEMENT_ADMIN_ROLES = ["placement officer", "placement chairman"];

export const isForbiddenError = (error) => error?.response?.status === 403;

export const getAuthorizationErrorMessage = (
  error,
  fallback = "You are not authorized to access this placement cell feature.",
) => error?.response?.data?.detail || fallback;

export const showAuthorizationError = (error, fallback) => {
  notifications.show({
    title: "Authorization Error",
    message: getAuthorizationErrorMessage(error, fallback),
    color: "red",
  });
};

export const showApiError = ({
  error,
  fallback,
  title = "Error",
  authorizationFallback,
}) => {
  if (isForbiddenError(error)) {
    showAuthorizationError(error, authorizationFallback || fallback);
    return;
  }

  notifications.show({
    title,
    message: error?.response?.data?.detail || fallback,
    color: "red",
  });
};
