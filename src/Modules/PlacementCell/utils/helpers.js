export const getAuthToken = () => localStorage.getItem("authToken");

export const getCsrfToken = (name = "csrftoken") => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }

  return "";
};

export const buildAuthHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();

  return {
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...extraHeaders,
  };
};

export const buildAuthConfig = (config = {}) => ({
  ...config,
  headers: buildAuthHeaders(config.headers),
});

export const downloadBlobFile = (data, filename, type) => {
  const blob = type ? new Blob([data], { type }) : new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getJobIdFromSearch = (search = window.location.search) =>
  new URLSearchParams(search).get("jobId");
