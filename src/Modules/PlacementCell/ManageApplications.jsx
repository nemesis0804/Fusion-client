/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  Button,
  Select,
  Modal,
  Stack,
  Card,
  TextInput,
  NumberInput,
  Textarea,
  Checkbox,
  Collapse,
  ActionIcon,
  Tooltip,
  Divider,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { apiGet, apiPost } from "./api.js";
import {
  jobApplicationsRoute,
  jobPostingsRoute,
  jobOffersRoute,
  interviewsRoute,
} from "../../routes/placementCellRoutes/index.jsx";

const STATUS_CHOICES = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "OFFER_EXTENDED", label: "Offer Extended" },
  { value: "OFFER_ACCEPTED", label: "Offer Accepted" },
  { value: "OFFER_REJECTED", label: "Offer Rejected" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_COLORS = {
  APPLIED: "blue",
  SHORTLISTED: "teal",
  INTERVIEW_SCHEDULED: "orange",
  OFFER_EXTENDED: "violet",
  OFFER_ACCEPTED: "green",
  OFFER_REJECTED: "gray",
  REJECTED: "red",
};

const STATUS_LABEL = STATUS_CHOICES.reduce((acc, s) => {
  acc[s.value] = s.label;
  return acc;
}, {});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a stored response value to a flat string suitable for tables /
 * spreadsheet cells. The backend stores values as ``{value: ...}`` JSON, so
 * we tolerate both the wrapped and unwrapped shape, and join lists.
 */
const flattenResponseValue = (raw) => {
  if (raw === undefined || raw === null) return "";
  let value = raw;
  if (typeof value === "object" && !Array.isArray(value) && "value" in value) {
    value = value.value;
  }
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
};

/**
 * Format an offer compensation amount according to the posting's compensation type.
 */
const formatOfferAmount = (amount, compensationType) => {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  if (compensationType === "STIPEND_PER_MONTH") {
    return `₹${n.toLocaleString("en-IN")}/month`;
  }
  return `₹${n} LPA`;
};

/**
 * Build the full export-ready row for a single application.
 * Includes static fields plus a column for each form field.
 */
const buildExportRow = (app, fieldOrder) => {
  const baseRow = {
    "Roll No": app.student_roll || "",
    Name: app.student_name || "",
    Email: app.applicant_email || "",
    LinkedIn: app.applicant_linkedin || "",
    GitHub: app.applicant_github || "",
    Status: STATUS_LABEL[app.status] || app.status,
    Role: app.role_title || "",
    "Offer Status": app.offer_status || "",
    "Offer Compensation": formatOfferAmount(
      app.offer_ctc,
      app.posting_compensation_type,
    ),
    "Offer Designation": app.offer_designation || "",
    "Resume URL": app.resume_url || "",
    "Applied On": app.applied_at
      ? new Date(app.applied_at).toLocaleString("en-IN")
      : "",
    Remarks: app.remarks || "",
  };

  const responsesByField = {};
  (app.responses || []).forEach((r) => {
    responsesByField[r.field] = flattenResponseValue(r.value);
  });

  fieldOrder.forEach(({ id, label }) => {
    baseRow[label] = responsesByField[id] || "";
  });

  return baseRow;
};

// ---------------------------------------------------------------------------
// Per-posting card with applications + export
// ---------------------------------------------------------------------------

function PostingApplicationsCard({
  posting,
  onUpdateStatus,
  onExtendOffer,
  onBulkShortlist,
  refreshKey,
}) {
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `${jobPostingsRoute}${posting.id}/applications/`,
      );
      setApplications(Array.isArray(res) ? res : []);
      setCheckedIds([]);
      setHasFetched(true);
    } catch {
      notifications.show({
        title: "Error",
        message: `Failed to load applications for ${posting.title}`,
        color: "red",
      });
      setApplications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (expanded && !hasFetched) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Re-fetch when the parent signals a refresh (e.g. status updated)
  useEffect(() => {
    if (expanded && hasFetched) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Build the column ordering used both in the table and the export. The
  // posting's form_fields are augmented with role-specific fields seen in any
  // application's responses to ensure full coverage.
  const fieldOrder = useMemo(() => {
    const seen = new Map();
    (posting.form_fields || []).forEach((f) => {
      seen.set(f.id, { id: f.id, label: f.label });
    });
    (posting.roles || []).forEach((role) => {
      (role.form_fields || []).forEach((f) => {
        if (!seen.has(f.id)) {
          seen.set(f.id, { id: f.id, label: `${role.title} :: ${f.label}` });
        }
      });
    });
    // Catch any fields present in responses but not in posting schema.
    applications.forEach((app) => {
      (app.responses || []).forEach((r) => {
        if (!seen.has(r.field)) {
          seen.set(r.field, {
            id: r.field,
            label: r.field_label || `Field ${r.field}`,
          });
        }
      });
    });
    return Array.from(seen.values());
  }, [posting, applications]);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack =
          `${a.student_name || ""} ${a.student_roll || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [applications, statusFilter, search]);

  const appliedIds = useMemo(
    () => filtered.filter((a) => a.status === "APPLIED").map((a) => a.id),
    [filtered],
  );

  const allAppliedChecked =
    appliedIds.length > 0 && checkedIds.length === appliedIds.length;

  const toggleCheck = (id) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleAll = () => setCheckedIds(allAppliedChecked ? [] : appliedIds);

  const exportToExcel = (data) => {
    const rows = data.map((a) => buildExportRow(a, fieldOrder));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    const safeCompany = (posting.company_name || "company")
      .replace(/[^a-z0-9]+/gi, "_")
      .toLowerCase();
    const safeTitle = (posting.title || "posting")
      .replace(/[^a-z0-9]+/gi, "_")
      .toLowerCase();
    XLSX.writeFile(
      wb,
      `applications_${safeCompany}_${safeTitle}_${posting.id}.xlsx`,
    );
  };

  const handleExport = async () => {
    let data = applications;
    if (!hasFetched) {
      // Lazily fetch applications if the user hasn't expanded the card yet.
      setLoading(true);
      try {
        const res = await apiGet(
          `${jobPostingsRoute}${posting.id}/applications/`,
        );
        data = Array.isArray(res) ? res : [];
        setApplications(data);
        setHasFetched(true);
      } catch {
        notifications.show({
          title: "Error",
          message: `Failed to load applications for ${posting.title}`,
          color: "red",
        });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (!data || data.length === 0) {
      notifications.show({
        title: "No data",
        message: "There are no applications to export yet.",
        color: "yellow",
      });
      return;
    }
    exportToExcel(data);
  };

  const handleBulk = async () => {
    if (checkedIds.length === 0) return;
    await onBulkShortlist(checkedIds);
    setCheckedIds([]);
    fetchApplications();
  };

  const handleSingleUpdate = async (app, newStatus, remarks) => {
    await onUpdateStatus(app, newStatus, remarks);
    fetchApplications();
  };

  const handleOffer = async (app, offerData) => {
    await onExtendOffer(app, offerData);
    fetchApplications();
  };

  const totalApplications = posting.total_applications ?? applications.length;

  return (
    <Card withBorder shadow="xs" p="md" radius="md" mb="md">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group
          gap="sm"
          wrap="nowrap"
          align="flex-start"
          style={{ cursor: "pointer", flex: 1 }}
          onClick={() => setExpanded((v) => !v)}
        >
          <ActionIcon variant="subtle" color="gray" size="md" tabIndex={-1}>
            {expanded ? (
              <IconChevronDown size={18} />
            ) : (
              <IconChevronRight size={18} />
            )}
          </ActionIcon>
          <Stack gap={2}>
            <Text fw={600} size="md">
              {posting.title}
            </Text>
            <Text size="sm" c="dimmed">
              {posting.company_name}
              {posting.location ? ` • ${posting.location}` : ""}
              {posting.job_type ? ` • ${posting.job_type}` : ""}
            </Text>
          </Stack>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color="blue">
            {totalApplications} application{totalApplications === 1 ? "" : "s"}
          </Badge>
          <Tooltip label="Export this posting's applications to Excel">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconDownload size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleExport();
              }}
            >
              Export Excel
            </Button>
          </Tooltip>
        </Group>
      </Group>

      <Collapse in={expanded}>
        <Divider my="sm" />

        <Group mb="sm" wrap="wrap">
          <TextInput
            placeholder="Search by name or roll no"
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={260}
          />
          <Select
            placeholder="Filter by status"
            data={[{ value: "", label: "All statuses" }, ...STATUS_CHOICES]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "")}
            clearable
            w={220}
          />
          <Tooltip label="Refresh applications">
            <ActionIcon
              variant="light"
              onClick={fetchApplications}
              loading={loading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          {checkedIds.length > 0 && (
            <Button size="xs" color="teal" onClick={handleBulk}>
              ✓ Shortlist Selected ({checkedIds.length})
            </Button>
          )}
        </Group>

        {loading ? (
          <Box ta="center" py="lg">
            <Loader size="sm" />
          </Box>
        ) : filtered.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            {applications.length === 0
              ? "No applications received yet."
              : "No applications match the current filters."}
          </Text>
        ) : (
          <ApplicationsTable
            rows={filtered}
            checkedIds={checkedIds}
            allAppliedChecked={allAppliedChecked}
            onToggle={toggleCheck}
            onToggleAll={toggleAll}
            onUpdate={handleSingleUpdate}
            onOffer={handleOffer}
            posting={posting}
          />
        )}
      </Collapse>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Applications table within a posting card
// ---------------------------------------------------------------------------

function ApplicationsTable({
  rows,
  checkedIds,
  allAppliedChecked,
  onToggle,
  onToggleAll,
  onUpdate,
  onOffer,
  posting,
}) {
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [extendOfferModal, setExtendOfferModal] = useState(null);
  const [offerData, setOfferData] = useState({
    ctc_offered: 0,
    designation_offered: "",
    response_deadline: "",
    joining_date: "",
  });
  const [responsesModal, setResponsesModal] = useState(null);
  const [scheduleInterviewModal, setScheduleInterviewModal] = useState(null);
  const [interviewData, setInterviewData] = useState({
    date: "",
    time_slot: "",
    duration_minutes: 60,
    mode: "OFFLINE",
    venue_or_link: "",
    round_number: 1,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submitStatus = async () => {
    if (!statusModal || !newStatus) return;
    setSubmitting(true);
    try {
      await onUpdate(statusModal, newStatus, remarks);
      setStatusModal(null);
      setNewStatus("");
      setRemarks("");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOffer = async () => {
    if (!extendOfferModal) return;
    if (!offerData.response_deadline || !offerData.ctc_offered) {
      notifications.show({
        title: "Validation Error",
        message: "Response deadline and CTC offered are required",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onOffer(extendOfferModal, offerData);
      setExtendOfferModal(null);
      setOfferData({
        ctc_offered: 0,
        designation_offered: "",
        response_deadline: "",
        joining_date: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetInterviewData = () =>
    setInterviewData({
      date: "",
      time_slot: "",
      duration_minutes: 60,
      mode: "OFFLINE",
      venue_or_link: "",
      round_number: 1,
      description: "",
    });

  const submitScheduleInterview = async () => {
    if (!scheduleInterviewModal) return;
    if (
      !interviewData.date ||
      !interviewData.time_slot ||
      !interviewData.venue_or_link?.trim()
    ) {
      notifications.show({
        title: "Missing fields",
        message: "Date, time, and venue/link are required.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      // Reuse an existing interview for this posting/round/slot if one
      // already exists (so multiple students can be added to the same panel),
      // otherwise create a new one.
      const existing = await apiGet(interviewsRoute).catch(() => []);
      const existingList = Array.isArray(existing)
        ? existing
        : existing.results || [];
      const match = existingList.find(
        (i) =>
          i.job_posting === posting.id &&
          i.date === interviewData.date &&
          i.time_slot &&
          i.time_slot.slice(0, 5) === interviewData.time_slot &&
          i.round_number === interviewData.round_number &&
          (i.venue_or_link || "") === interviewData.venue_or_link,
      );

      let interview;
      if (match) {
        interview = match;
      } else {
        interview = await apiPost(interviewsRoute, {
          job_posting: posting.id,
          date: interviewData.date,
          time_slot: interviewData.time_slot,
          duration_minutes: interviewData.duration_minutes,
          mode: interviewData.mode,
          venue_or_link: interviewData.venue_or_link,
          round_number: interviewData.round_number,
          description: interviewData.description,
        });
      }

      // Assign the application to the interview's panel
      await apiPost(`${interviewsRoute}${interview.id}/assign-panel/`, {
        application_ids: [scheduleInterviewModal.id],
      });

      // Move the application status to INTERVIEW_SCHEDULED so the UI reflects it
      await onUpdate(
        scheduleInterviewModal,
        "INTERVIEW_SCHEDULED",
        `Interview scheduled on ${interviewData.date} at ${interviewData.time_slot}`,
      );

      notifications.show({
        title: "Scheduled",
        message: "Interview scheduled and student assigned.",
        color: "green",
      });
      setScheduleInterviewModal(null);
      resetInterviewData();
    } catch (err) {
      const data = err?.response?.data;
      let msg = "Failed to schedule interview.";
      if (typeof data === "string") msg = data;
      else if (data?.error) msg = data.error;
      else if (data?.detail) msg = data.detail;
      notifications.show({ title: "Error", message: msg, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Box style={{ overflowX: "auto" }}>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  checked={allAppliedChecked}
                  onChange={onToggleAll}
                  aria-label="Select all applied"
                />
              </Table.Th>
              <Table.Th>Roll No</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Applied</Table.Th>
              <Table.Th>Responses</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((app) => (
              <Table.Tr key={app.id}>
                <Table.Td>
                  {app.status === "APPLIED" && (
                    <Checkbox
                      checked={checkedIds.includes(app.id)}
                      onChange={() => onToggle(app.id)}
                      aria-label={`Select ${app.student_name}`}
                    />
                  )}
                </Table.Td>
                <Table.Td>{app.student_roll}</Table.Td>
                <Table.Td fw={500}>{app.student_name}</Table.Td>
                <Table.Td>{app.role_title || "—"}</Table.Td>
                <Table.Td>
                  <Badge
                    color={STATUS_COLORS[app.status] || "gray"}
                    variant="light"
                  >
                    {STATUS_LABEL[app.status] || app.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {app.applied_at
                    ? new Date(app.applied_at).toLocaleDateString("en-IN")
                    : ""}
                </Table.Td>
                <Table.Td>
                  {(app.responses || []).length > 0 ? (
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => setResponsesModal(app)}
                    >
                      View ({app.responses.length})
                    </Button>
                  ) : (
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => {
                        setStatusModal(app);
                        setNewStatus(app.status);
                        setRemarks(app.remarks || "");
                      }}
                    >
                      Update
                    </Button>
                    {(app.status === "SHORTLISTED" ||
                      app.status === "INTERVIEW_SCHEDULED") && (
                      <Button
                        size="xs"
                        color="orange"
                        variant="light"
                        onClick={() => {
                          setScheduleInterviewModal(app);
                          resetInterviewData();
                        }}
                      >
                        Schedule Interview
                      </Button>
                    )}
                    {(app.status === "SHORTLISTED" ||
                      app.status === "INTERVIEW_SCHEDULED") && (
                      <Button
                        size="xs"
                        color="violet"
                        variant="light"
                        onClick={() => {
                          setExtendOfferModal(app);
                          setOfferData((prev) => ({
                            ...prev,
                            ctc_offered: posting.ctc || 0,
                          }));
                        }}
                      >
                        Offer
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <Modal
        opened={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update Application Status"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Updating status for{" "}
            <Text span fw={600} c="dark">
              {statusModal?.student_name}
            </Text>
          </Text>
          <Select
            label="New Status"
            data={STATUS_CHOICES}
            value={newStatus}
            onChange={setNewStatus}
          />
          <Textarea
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
          />
          <Button onClick={submitStatus} fullWidth loading={submitting}>
            Update
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!extendOfferModal}
        onClose={() => setExtendOfferModal(null)}
        title="Extend Job Offer"
        centered
        size="md"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Extending offer to{" "}
            <Text span fw={600} c="dark">
              {extendOfferModal?.student_name}
            </Text>{" "}
            for{" "}
            <Text span fw={600} c="dark">
              {posting.title}
            </Text>
          </Text>

          <Group grow>
            <NumberInput
              label={
                posting.compensation_type === "STIPEND_PER_MONTH"
                  ? "Stipend Offered (₹/month)"
                  : "CTC Offered (₹ LPA)"
              }
              required
              value={offerData.ctc_offered}
              onChange={(val) =>
                setOfferData({ ...offerData, ctc_offered: val })
              }
              min={0}
              decimalScale={2}
              thousandSeparator={
                posting.compensation_type === "STIPEND_PER_MONTH" ? "," : false
              }
            />
            <TextInput
              label="Designation Offered"
              placeholder="e.g. SDE-1"
              value={offerData.designation_offered}
              onChange={(e) =>
                setOfferData({
                  ...offerData,
                  designation_offered: e.target.value,
                })
              }
            />
          </Group>

          <Group grow>
            <TextInput
              label="Response Deadline"
              required
              type="datetime-local"
              value={offerData.response_deadline}
              onChange={(e) =>
                setOfferData({
                  ...offerData,
                  response_deadline: e.target.value,
                })
              }
            />
            <TextInput
              label="Joining Date"
              type="date"
              value={offerData.joining_date}
              onChange={(e) =>
                setOfferData({ ...offerData, joining_date: e.target.value })
              }
            />
          </Group>

          <Button
            onClick={submitOffer}
            fullWidth
            color="violet"
            mt="sm"
            loading={submitting}
          >
            Confirm & Extend Offer
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!responsesModal}
        onClose={() => setResponsesModal(null)}
        title={`Form Responses — ${responsesModal?.student_name || ""}`}
        centered
        size="lg"
      >
        {responsesModal && (
          <Stack gap="sm">
            {(responsesModal.responses || []).length === 0 ? (
              <Text c="dimmed">No responses submitted.</Text>
            ) : (
              responsesModal.responses.map((r) => (
                <div key={r.id}>
                  <Text size="sm" fw={600}>
                    {r.field_label}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {flattenResponseValue(r.value) || "—"}
                  </Text>
                  <Divider mt={6} />
                </div>
              ))
            )}
          </Stack>
        )}
      </Modal>

      <Modal
        opened={!!scheduleInterviewModal}
        onClose={() => {
          setScheduleInterviewModal(null);
          resetInterviewData();
        }}
        title="Schedule Interview"
        centered
        size="md"
      >
        {scheduleInterviewModal && (
          <Stack>
            <Card withBorder p="sm" radius="sm">
              <Stack gap={4}>
                <Text size="sm">
                  <Text span fw={600}>
                    Student:
                  </Text>{" "}
                  {scheduleInterviewModal.student_name} (
                  {scheduleInterviewModal.student_roll})
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Company:
                  </Text>{" "}
                  {posting.company_name}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Role:
                  </Text>{" "}
                  {scheduleInterviewModal.role_title || posting.title}
                </Text>
              </Stack>
            </Card>
            <Group grow>
              <TextInput
                label="Date"
                type="date"
                required
                value={interviewData.date}
                onChange={(e) =>
                  setInterviewData((d) => ({ ...d, date: e.target.value }))
                }
              />
              <TextInput
                label="Start Time"
                type="time"
                required
                value={interviewData.time_slot}
                onChange={(e) =>
                  setInterviewData((d) => ({
                    ...d,
                    time_slot: e.target.value,
                  }))
                }
              />
            </Group>
            <Group grow>
              <NumberInput
                label="Duration (min)"
                min={15}
                max={480}
                step={15}
                value={interviewData.duration_minutes}
                onChange={(val) =>
                  setInterviewData((d) => ({
                    ...d,
                    duration_minutes: Number(val) || 60,
                  }))
                }
              />
              <NumberInput
                label="Round #"
                min={1}
                max={10}
                value={interviewData.round_number}
                onChange={(val) =>
                  setInterviewData((d) => ({
                    ...d,
                    round_number: Number(val) || 1,
                  }))
                }
              />
            </Group>
            <Select
              label="Mode"
              data={[
                { value: "OFFLINE", label: "Offline" },
                { value: "ONLINE", label: "Online" },
              ]}
              value={interviewData.mode}
              onChange={(val) =>
                setInterviewData((d) => ({ ...d, mode: val || "OFFLINE" }))
              }
            />
            <TextInput
              label={interviewData.mode === "ONLINE" ? "Meeting Link" : "Venue"}
              required
              placeholder={
                interviewData.mode === "ONLINE"
                  ? "https://meet.google.com/…"
                  : "e.g. Seminar Hall 1"
              }
              value={interviewData.venue_or_link}
              onChange={(e) =>
                setInterviewData((d) => ({
                  ...d,
                  venue_or_link: e.target.value,
                }))
              }
            />
            <Textarea
              label="Notes (optional)"
              autosize
              minRows={2}
              value={interviewData.description}
              onChange={(e) =>
                setInterviewData((d) => ({
                  ...d,
                  description: e.target.value,
                }))
              }
            />
            <Button
              onClick={submitScheduleInterview}
              loading={submitting}
              fullWidth
              color="orange"
            >
              Confirm Interview
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Top-level page
// ---------------------------------------------------------------------------

export default function ManageApplications() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      // Fetch the rich (non-list) representation so each posting includes
      // its form_fields and roles, which we need for the responses table /
      // export columns.
      const res = await apiGet(`${jobPostingsRoute}?page_size=200`);
      const data = Array.isArray(res) ? res : res.results || [];
      // Sort by most recent first
      data.sort((a, b) => {
        const da = new Date(a.created_at || 0).getTime();
        const db = new Date(b.created_at || 0).getTime();
        return db - da;
      });
      setPostings(data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load job postings",
        color: "red",
      });
      setPostings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  const handleUpdateStatus = async (app, newStatus, remarks) => {
    try {
      await apiPost(`${jobApplicationsRoute}${app.id}/update_status/`, {
        status: newStatus,
        remarks,
      });
      notifications.show({
        title: "Success",
        message: "Status updated",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update status",
        color: "red",
      });
    }
  };

  const handleExtendOffer = async (app, offerData) => {
    try {
      await apiPost(jobOffersRoute, {
        application: app.id,
        ...offerData,
      });
      // The backend already notifies the student; mirror app status here.
      await apiPost(`${jobApplicationsRoute}${app.id}/update_status/`, {
        status: "OFFER_EXTENDED",
        remarks: "Offer has been extended to the student.",
      });
      notifications.show({
        title: "Success",
        message: "Offer extended successfully",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Error",
        message:
          err.response?.data?.detail ||
          (Array.isArray(err.response?.data)
            ? err.response.data.join(" ")
            : "") ||
          "Failed to extend offer",
        color: "red",
      });
    }
  };

  const handleBulkShortlist = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) =>
          apiPost(`${jobApplicationsRoute}${id}/update_status/`, {
            status: "SHORTLISTED",
          }),
        ),
      );
      notifications.show({
        title: "Success",
        message: `${ids.length} application(s) shortlisted`,
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to bulk shortlist",
        color: "red",
      });
    }
  };

  // --- Filters at the page level (which company / search by title) ---

  const companyOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    postings.forEach((p) => {
      if (p.company_name && !seen.has(p.company_name)) {
        seen.add(p.company_name);
        opts.push({ value: p.company_name, label: p.company_name });
      }
    });
    return opts;
  }, [postings]);

  const visiblePostings = useMemo(() => {
    return postings.filter((p) => {
      if (companyFilter && p.company_name !== companyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack =
          `${p.title || ""} ${p.company_name || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [postings, companyFilter, search]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <Group justify="space-between" mb="lg" wrap="wrap">
        <Stack gap={4}>
          <Text fw={600} size="xl">
            Manage Applications
          </Text>
          <Text size="sm" c="dimmed">
            Review applications grouped by job posting. Expand a posting to see
            applicants, update statuses, or export the list.
          </Text>
        </Stack>
        <Tooltip label="Reload postings">
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => {
              fetchPostings();
              setRefreshKey((k) => k + 1);
            }}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group mb="md" wrap="wrap">
        <TextInput
          placeholder="Search postings (title or company)"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={300}
        />
        <Select
          placeholder="Filter by company"
          data={companyOptions}
          value={companyFilter}
          onChange={(v) => setCompanyFilter(v || "")}
          clearable
          searchable
          w={260}
        />
      </Group>

      {visiblePostings.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No job postings found.
        </Text>
      ) : (
        visiblePostings.map((p) => (
          <PostingApplicationsCard
            key={p.id}
            posting={p}
            onUpdateStatus={handleUpdateStatus}
            onExtendOffer={handleExtendOffer}
            onBulkShortlist={handleBulkShortlist}
            refreshKey={refreshKey}
          />
        ))
      )}
    </div>
  );
}
