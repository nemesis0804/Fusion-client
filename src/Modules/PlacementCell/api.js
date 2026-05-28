import axios from "axios";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return "";
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  const csrfToken = getCookie("csrftoken");
  return {
    Authorization: `Token ${token}`,
    "X-CSRFToken": csrfToken,
    "Content-Type": "application/json",
  };
};

export const apiGet = async (url) => {
  const response = await axios.get(url, { headers: getAuthHeaders() });
  return response.data;
};

export const apiPost = async (url, data) => {
  const response = await axios.post(url, data, { headers: getAuthHeaders() });
  return response.data;
};

export const apiPut = async (url, data) => {
  const response = await axios.put(url, data, { headers: getAuthHeaders() });
  return response.data;
};

export const apiPatch = async (url, data) => {
  const response = await axios.patch(url, data, { headers: getAuthHeaders() });
  return response.data;
};

export const apiDelete = async (url, data = {}) => {
  const response = await axios.delete(url, {
    headers: getAuthHeaders(),
    data,
  });
  return response.data;
};

export const apiPostMultipart = async (url, formData) => {
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const response = await axios.post(url, formData, { headers });
  return response.data;
};
