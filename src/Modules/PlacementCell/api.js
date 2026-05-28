import axios from "axios";
import { host } from "../../routes/globalRoutes";
import {
  buildAuthConfig,
  buildAuthHeaders,
  getCsrfToken,
} from "./utils/helpers";

const addPlacementEventForm = `${host}/placement/api/placement/`;
const fetchApplicationsRoute = `${host}/placement/api/student-applications/`;
const handleStatusChangeRoute = `${host}/placement/api/student-applications/`;
const applicationDetailRoute = `${host}/placement/api/application-detail/`;
const offerRoute = `${host}/placement/api/offer/`;
const downloadExcelRoute = `${host}/placement/api/download-applications/`;
const submitNextRoundDetailsRoute = `${host}/placement/api/nextround/`;
const downloadCVRoute = `${host}/placement/api/generate-cv/`;
const calendarEventsRoute = `${host}/placement/api/calender/`;
const fetchPlacementStatsRoute = `${host}/placement/api/statistics/`;
const placementReportsRoute = `${host}/placement/api/reports/`;
const placementReportsExportRoute = `${host}/placement/api/reports/export/`;
const placementReportSchedulesRoute = `${host}/placement/api/report-schedules/`;
const deletePlacementStatsRoute = `${host}/placement/api/delete-statistics/`;
const higherStudiesRoute = `${host}/placement/api/higher-studies/`;
const fetchPlacementScheduleRoute = `${host}/placement/api/placement/`;
const fetchTimeLineRoute = `${host}/placement/api/timeline/`;
const fetchDebaredlistRoute = `${host}/placement/api/debared-students/`;
const debarredStatusRoute = `${host}/placement/api/debared-status/`;
const fetchFieldsSubmitformRoute = `${host}/placement/api/add-field/`;
const fetchRestrictionsRoute = `${host}/placement/api/restrictions/`;
const fetchRegistrationRoute = `${host}/placement/api/registration/`;
const ApplyForPlacementRoute = `${host}/placement/api/apply-for-placement/`;
const myApplicationsRoute = `${host}/placement/api/my-applications/`;
const myOffersRoute = `${host}/placement/api/my-offers/`;
const fetchFormFieldsRoute = `${host}/placement/api/form-fields/`;
const sendNotificationRoute = `${host}/placement/api/send-notification/`;
const placementPoliciesRoute = `${host}/placement/api/policies/`;
const placementProfileRoute = `${host}/placement/api/profile/`;
const notificationPreferencesRoute = `${host}/placement/api/notification-preferences/`;
const placementAppealsRoute = `${host}/placement/api/placement-appeals/`;
const alumniProfileRoute = `${host}/placement/api/alumni/profile/`;
const alumniDirectoryRoute = `${host}/placement/api/alumni/directory/`;
const alumniVerificationRoute = `${host}/placement/api/alumni/verification/`;
const alumniReferralsRoute = `${host}/placement/api/alumni/referrals/`;
const alumniConnectionsRoute = `${host}/placement/api/alumni/connections/`;
const alumniSessionsRoute = `${host}/placement/api/alumni/sessions/`;

export const placementApi = {
  getOfferDetail(offerId) {
    return axios.get(`${offerRoute}${offerId}/`, buildAuthConfig());
  },

  respondToOffer(offerId, action) {
    return axios.post(
      `${offerRoute}${offerId}/respond/`,
      { action },
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  getPlacementSchedule(params = {}) {
    return axios.get(fetchPlacementScheduleRoute, buildAuthConfig({ params }));
  },

  getPlacementDetail(jobId) {
    return axios.get(`${addPlacementEventForm}${jobId}/`, buildAuthConfig());
  },

  createPlacementEvent(formData) {
    return axios.post(
      addPlacementEventForm,
      formData,
      buildAuthConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  updatePlacementEvent(jobId, payload) {
    return fetch(`${addPlacementEventForm}${jobId}/`, {
      method: "PUT",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    });
  },

  deletePlacementEvent(jobId) {
    return fetch(`${addPlacementEventForm}${jobId}/`, {
      method: "DELETE",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
    });
  },

  applyForPlacement(payload) {
    return fetch(ApplyForPlacementRoute, {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    });
  },

  getApplications(jobId) {
    return axios.get(`${fetchApplicationsRoute}${jobId}/`, buildAuthConfig());
  },

  getApplicationDetail(applicationId) {
    return axios.get(
      `${applicationDetailRoute}${applicationId}/`,
      buildAuthConfig(),
    );
  },

  getMyApplications() {
    return axios.get(myApplicationsRoute, buildAuthConfig());
  },

  getMyOffers() {
    return axios.get(myOffersRoute, buildAuthConfig());
  },

  updateApplicationStatus(applicationId, status) {
    return axios.put(
      `${handleStatusChangeRoute}${applicationId}/`,
      { status },
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  updateApplicationDetail(applicationId, payload) {
    return axios.put(
      `${applicationDetailRoute}${applicationId}/`,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  scheduleApplicationInterview(applicationId, payload) {
    return axios.post(
      `${applicationDetailRoute}${applicationId}/interview/`,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  deleteApplication(applicationId) {
    return axios.delete(
      `${handleStatusChangeRoute}${applicationId}/`,
      buildAuthConfig(),
    );
  },

  downloadApplicationsExcel(jobId) {
    return axios.get(
      `${downloadExcelRoute}${jobId}/`,
      buildAuthConfig({
        responseType: "blob",
      }),
    );
  },

  submitNextRoundDetails(jobId, payload) {
    return axios.post(
      `${submitNextRoundDetailsRoute}${jobId}/`,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  getTimeline(jobId) {
    return axios.get(`${fetchTimeLineRoute}${jobId}/`, buildAuthConfig());
  },

  getPlacementAppeals() {
    return axios.get(placementAppealsRoute, buildAuthConfig());
  },

  createPlacementAppeal(payload) {
    return axios.post(placementAppealsRoute, payload, buildAuthConfig());
  },

  updatePlacementAppeal(appealId, payload) {
    return axios.put(
      `${placementAppealsRoute}${appealId}/`,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  getRegistrationList() {
    return axios.get(fetchRegistrationRoute, buildAuthConfig());
  },

  createCompanyRegistration(payload) {
    return axios.post(
      fetchRegistrationRoute,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  getCalendarEvents() {
    return axios.get(calendarEventsRoute, buildAuthConfig());
  },

  getFields() {
    return axios.get(fetchFieldsSubmitformRoute, buildAuthConfig());
  },

  createField(payload) {
    return axios.post(fetchFieldsSubmitformRoute, payload, buildAuthConfig());
  },

  getPlacementStatistics() {
    return axios.get(fetchPlacementStatsRoute, buildAuthConfig());
  },

  getPlacementReport(params = {}) {
    return axios.get(placementReportsRoute, buildAuthConfig({ params }));
  },

  exportPlacementReport(params = {}, format = "excel") {
    return axios.get(
      placementReportsExportRoute,
      buildAuthConfig({
        params: { ...params, export_format: format },
        responseType: "blob",
      }),
    );
  },

  getPlacementReportSchedules() {
    return axios.get(placementReportSchedulesRoute, buildAuthConfig());
  },

  createPlacementReportSchedule(payload) {
    return axios.post(
      placementReportSchedulesRoute,
      payload,
      buildAuthConfig(),
    );
  },

  updatePlacementReportSchedule(scheduleId, payload) {
    return axios.put(
      `${placementReportSchedulesRoute}${scheduleId}/`,
      payload,
      buildAuthConfig(),
    );
  },

  deletePlacementReportSchedule(scheduleId) {
    return axios.delete(
      `${placementReportSchedulesRoute}${scheduleId}/`,
      buildAuthConfig(),
    );
  },

  createPlacementStatistic(formData) {
    return fetch(fetchPlacementStatsRoute, {
      method: "POST",
      body: formData,
      headers: buildAuthHeaders(),
    });
  },

  deletePlacementStatistic(id) {
    return axios.delete(
      `${deletePlacementStatsRoute}${id}/`,
      buildAuthConfig(),
    );
  },

  getHigherStudiesRecords() {
    return axios.get(higherStudiesRoute, buildAuthConfig());
  },

  createHigherStudiesRecord(payload) {
    return axios.post(higherStudiesRoute, payload, buildAuthConfig());
  },

  updateHigherStudiesRecord(id, payload) {
    return axios.put(`${higherStudiesRoute}${id}/`, payload, buildAuthConfig());
  },

  deleteHigherStudiesRecord(id) {
    return axios.delete(`${higherStudiesRoute}${id}/`, buildAuthConfig());
  },

  downloadCv(payload) {
    return axios.post(
      downloadCVRoute,
      payload,
      buildAuthConfig({
        headers: {
          "X-CSRFToken": getCsrfToken(),
        },
        responseType: "blob",
      }),
    );
  },

  getPlacementProfile() {
    return axios.get(placementProfileRoute, buildAuthConfig());
  },

  savePlacementProfile(payload) {
    return axios.put(
      placementProfileRoute,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  uploadPlacementProfileDocument(payload) {
    return axios.post(
      placementProfileRoute,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  getNotificationPreferences() {
    return axios.get(notificationPreferencesRoute, buildAuthConfig());
  },

  updateNotificationPreferences(payload) {
    return axios.put(notificationPreferencesRoute, payload, buildAuthConfig());
  },

  getDebarredStudents() {
    return axios.get(fetchDebaredlistRoute, buildAuthConfig());
  },

  getDebarredStatus(rollNumber) {
    return axios.get(`${debarredStatusRoute}${rollNumber}/`, buildAuthConfig());
  },

  removeDebarredStatus(rollNumber) {
    return axios.delete(
      `${debarredStatusRoute}${rollNumber}/`,
      buildAuthConfig(),
    );
  },

  debarStudent(rollNumber, payload) {
    return axios.post(
      `${debarredStatusRoute}${rollNumber}/`,
      payload,
      buildAuthConfig(),
    );
  },

  sendNotification(payload) {
    return axios.post(sendNotificationRoute, payload, buildAuthConfig());
  },

  getPlacementPolicies() {
    return axios.get(placementPoliciesRoute, buildAuthConfig());
  },

  createPlacementPolicy(payload) {
    return axios.post(placementPoliciesRoute, payload, buildAuthConfig());
  },

  updatePlacementPolicy(policyId, payload) {
    return axios.put(
      `${placementPoliciesRoute}${policyId}/`,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  },

  getFormFields(jobId) {
    return axios.get(
      fetchFormFieldsRoute,
      buildAuthConfig({
        params: { jobId },
      }),
    );
  },

  submitPlacementResponses(jobId, responses) {
    return axios.post(
      ApplyForPlacementRoute,
      { jobId, responses },
      buildAuthConfig(),
    );
  },

  withdrawApplication(jobId) {
    return axios.delete(
      `${ApplyForPlacementRoute}${jobId}/`,
      buildAuthConfig(),
    );
  },

  getRestrictions() {
    return axios.get(fetchRestrictionsRoute, buildAuthConfig());
  },

  createRestriction(payload) {
    return axios.post(fetchRestrictionsRoute, payload, buildAuthConfig());
  },

  updateRestriction(id, payload) {
    return axios.put(
      `${fetchRestrictionsRoute}${id}/`,
      payload,
      buildAuthConfig(),
    );
  },

  deleteRestriction(id) {
    return axios.delete(`${fetchRestrictionsRoute}${id}/`, buildAuthConfig());
  },

  getAlumniProfile() {
    return axios.get(alumniProfileRoute, buildAuthConfig());
  },

  saveAlumniProfile(payload) {
    return axios.post(
      alumniProfileRoute,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  updateAlumniProfile(payload) {
    return axios.put(
      alumniProfileRoute,
      payload,
      buildAuthConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  getAlumniDirectory(params) {
    return axios.get(alumniDirectoryRoute, buildAuthConfig({ params }));
  },

  getAlumniVerificationQueue() {
    return axios.get(alumniVerificationRoute, buildAuthConfig());
  },

  updateAlumniVerification(profileId, payload) {
    return axios.put(
      `${alumniVerificationRoute}${profileId}/`,
      payload,
      buildAuthConfig(),
    );
  },

  getAlumniReferrals() {
    return axios.get(alumniReferralsRoute, buildAuthConfig());
  },

  createAlumniReferral(payload) {
    return axios.post(alumniReferralsRoute, payload, buildAuthConfig());
  },

  getAlumniConnections() {
    return axios.get(alumniConnectionsRoute, buildAuthConfig());
  },

  createAlumniConnection(payload) {
    return axios.post(alumniConnectionsRoute, payload, buildAuthConfig());
  },

  updateAlumniConnection(connectionId, payload) {
    return axios.put(
      `${alumniConnectionsRoute}${connectionId}/`,
      payload,
      buildAuthConfig(),
    );
  },

  getAlumniSessions() {
    return axios.get(alumniSessionsRoute, buildAuthConfig());
  },

  createAlumniSession(payload) {
    return axios.post(alumniSessionsRoute, payload, buildAuthConfig());
  },

  updateAlumniSession(sessionId, payload) {
    return axios.put(
      `${alumniSessionsRoute}${sessionId}/`,
      payload,
      buildAuthConfig(),
    );
  },
};
