import { host } from "../globalRoutes";

// Placement Schedule (Legacy)
export const placementScheduleRoute = `${host}/placement/api/placement/`;
export const placementScheduleDetailRoute = `${host}/placement/api/placement/`;

// Roles
export const userRolesRoute = `${host}/placement/api/roles/`;

// Eligibility options (programmes / branches / batches)
export const eligibilityOptionsRoute = `${host}/placement/api/eligibility-options/`;

// Student Records & CV
export const studentRecordsRoute = `${host}/placement/api/student-records/`;
export const cvDataRoute = `${host}/placement/api/cv/`;
export const generateCVRoute = `${host}/placement/api/generate-cv/`;

// Applications & Invitations
export const studentApplicationsRoute = `${host}/placement/api/student-applications/`;
export const updateApplicationRoute = `${host}/placement/api/student-applications-update/`;
export const invitationStatusRoute = `${host}/placement/api/invitation-status/`;

// Statistics & Records
export const statisticsRoute = `${host}/placement/api/statistics/`;
export const manageRecordsRoute = `${host}/placement/api/manage-records/`;

// Debarred Students
export const debarredStudentsRoute = `${host}/placement/api/debared-students/`;
export const debarredStatusRoute = `${host}/placement/api/debared-status/`;

// Fields & Restrictions
export const addFieldRoute = `${host}/placement/api/add-field/`;
export const formFieldsRoute = `${host}/placement/api/form-fields/`;
export const restrictionsRoute = `${host}/placement/api/restrictions/`;

// Company Registration
export const registrationRoute = `${host}/placement/api/registration/`;

// Apply for Placement
export const applyForPlacementRoute = `${host}/placement/api/apply-for-placement/`;

// Calendar & Timeline
export const calendarEventsRoute = `${host}/placement/api/calender/`;
export const timelineRoute = `${host}/placement/api/timeline/`;

// Next Round & Download
export const nextRoundRoute = `${host}/placement/api/nextround/`;
export const downloadApplicationsRoute = `${host}/placement/api/download-applications/`;

// Chairman Visits
export const visitsRoute = `${host}/placement/api/visits/`;

// Dashboard & Reports
export const dashboardRoute = `${host}/placement/api/dashboard/`;
export const reportsRoute = `${host}/placement/api/reports/`;

// Notifications
export const sendNotificationRoute = `${host}/notifications/api/placement_cell_notification/`;

// PCMS ViewSet Endpoints
export const companiesRoute = `${host}/placement/api/companies/`;
export const jobPostingsRoute = `${host}/placement/api/job-postings/`;
export const jobApplicationsRoute = `${host}/placement/api/job-applications/`;
export const jobOffersRoute = `${host}/placement/api/job-offers/`;
export const announcementsRoute = `${host}/placement/api/announcements/`;
export const studentResumesRoute = `${host}/placement/api/student-resumes/`;

// PCMS Dashboard / Reports
export const mySummaryRoute = `${host}/placement/api/my-summary/`;

// Appeals
export const appealsRoute = `${host}/placement/api/appeals/`;

// Placement Profile
export const placementProfileRoute = `${host}/placement/api/placement-profile/`;

// Placement Status (TPO-managed verified placement / internship claims)
export const placementClaimsRoute = `${host}/placement/api/placement-claims/`;

// Alumni Network
export const alumniRoute = `${host}/placement/api/alumni/`;
export const mentorshipRoute = `${host}/placement/api/mentorship/`;
export const mentorshipSessionsRoute = `${host}/placement/api/mentorship-sessions/`;
export const jobReferralsRoute = `${host}/placement/api/job-referrals/`;

// Interviews
export const interviewsRoute = `${host}/placement/api/interviews/`;
export const interviewConflictsRoute = `${host}/placement/api/interviews/check-conflicts/`;
