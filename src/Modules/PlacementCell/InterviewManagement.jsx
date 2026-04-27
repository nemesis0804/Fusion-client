/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Text,
  Stack,
  Group,
  Grid,
  Loader,
  Badge,
  Button,
  TextInput,
  Modal,
  Textarea,
  Select,
  Divider,
  ActionIcon,
  Tooltip,
  NumberInput,
  Table,
  Checkbox,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  CalendarBlank,
  Clock,
  MapPin,
  VideoCamera,
  Check,
  PencilSimple,
  Trash,
  Users,
  ArrowClockwise,
  WarningCircle,
  Buildings,
} from "phosphor-react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import {
  interviewsRoute,
  interviewConflictsRoute,
  jobPostingsRoute,
} from "../../routes/placementCellRoutes";

const RESULT_COLOR = {
  PENDING: "gray",
  SELECTED: "green",
  REJECTED: "red",
  WAITLISTED: "yellow",
};

/* ═══════════════════════
   INTERVIEW CARD
═══════════════════════ */
function InterviewCard({
  interview,
  isTpo,
  onEdit,
  onDelete,
  onOutcome,
  onView,
}) {
  const isPast = new Date(interview.date) < new Date();
  return (
    <Card
      shadow="xs"
      radius="md"
      withBorder
      p="md"
      h="100%"
      style={{
        opacity: isPast ? 0.7 : 1,
        borderLeft: `4px solid ${isPast ? "#aaa" : "#228be6"}`,
      }}
    >
      <Group position="apart" mb="xs" noWrap>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} size="md" truncate>
            {interview.job_title}
          </Text>
          <Group spacing={4}>
            <Buildings size={13} />
            <Text size="sm" c="dimmed" truncate>
              {interview.company_name}
            </Text>
          </Group>
        </div>
        <Badge color={isPast ? "gray" : "blue"} variant="light" size="sm">
          {isPast ? "Completed" : "Upcoming"}
        </Badge>
      </Group>

      <Stack spacing={3} mb="sm">
        <Group spacing={4}>
          <CalendarBlank size={13} />
          <Text size="xs">
            {new Date(interview.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </Group>
        <Group spacing={4}>
          <Clock size={13} />
          <Text size="xs">
            {interview.time_slot} — {interview.end_time || "?"} (
            {interview.duration_minutes} min)
          </Text>
        </Group>
        {interview.venue_or_link && (
          <Group spacing={4}>
            {interview.mode === "ONLINE" ? (
              <VideoCamera size={13} />
            ) : (
              <MapPin size={13} />
            )}
            <Text size="xs" c="dimmed" truncate>
              {interview.venue_or_link}
            </Text>
          </Group>
        )}
        <Group spacing={6}>
          <Badge variant="outline" size="xs" color="indigo">
            Round {interview.round_number}
          </Badge>
          <Badge
            variant="outline"
            size="xs"
            color={interview.mode === "ONLINE" ? "teal" : "orange"}
          >
            {interview.mode}
          </Badge>
          <Badge variant="light" size="xs" color="violet">
            {interview.panelist_count || 0} students
          </Badge>
        </Group>
        {interview.reschedule_count > 0 && (
          <Group spacing={4}>
            <ArrowClockwise size={13} />
            <Text size="xs" c="orange">
              Rescheduled {interview.reschedule_count}/2
            </Text>
          </Group>
        )}
      </Stack>

      {interview.description && (
        <Text size="xs" c="dimmed" lineClamp={2} mb="sm">
          {interview.description}
        </Text>
      )}

      {isTpo && (
        <Group spacing={4} mt="auto">
          <Tooltip label="View / Assign Panel">
            <ActionIcon
              color="blue"
              variant="light"
              size="sm"
              onClick={() => onView(interview)}
            >
              <Users size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reschedule">
            <ActionIcon
              color="orange"
              variant="light"
              size="sm"
              onClick={() => onEdit(interview)}
            >
              <PencilSimple size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Record Outcomes">
            <ActionIcon
              color="green"
              variant="light"
              size="sm"
              onClick={() => onOutcome(interview)}
            >
              <Check size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              color="red"
              variant="light"
              size="sm"
              onClick={() => onDelete(interview)}
            >
              <Trash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Card>
  );
}

/* ═══════════════════════
   STUDENT INTERVIEW CARD
═══════════════════════ */
function StudentInterviewCard({ interview }) {
  const isPast = new Date(interview.date) < new Date();
  return (
    <Card shadow="xs" radius="md" withBorder p="md">
      <Group position="apart" noWrap>
        <div style={{ flex: 1 }}>
          <Text fw={600}>{interview.job_title}</Text>
          <Text size="sm" c="dimmed">
            {interview.company_name}
          </Text>
        </div>
        <Badge color={isPast ? "gray" : "blue"} variant="light">
          {isPast ? "Past" : "Upcoming"}
        </Badge>
      </Group>
      <Group spacing="lg" mt="sm">
        <Group spacing={4}>
          <CalendarBlank size={14} />
          <Text size="sm">{interview.date}</Text>
        </Group>
        <Group spacing={4}>
          <Clock size={14} />
          <Text size="sm">
            {interview.time_slot} ({interview.duration_minutes} min)
          </Text>
        </Group>
        <Badge variant="outline" size="sm">
          Round {interview.round_number}
        </Badge>
        <Badge
          variant="outline"
          size="sm"
          color={interview.mode === "ONLINE" ? "teal" : "orange"}
        >
          {interview.mode}
        </Badge>
      </Group>
      {interview.venue_or_link && (
        <Group spacing={4} mt="xs">
          {interview.mode === "ONLINE" ? (
            <VideoCamera size={14} />
          ) : (
            <MapPin size={14} />
          )}
          {interview.mode === "ONLINE" ? (
            <Text
              size="sm"
              c="blue"
              component="a"
              href={interview.venue_or_link}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              Join Meeting
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              {interview.venue_or_link}
            </Text>
          )}
        </Group>
      )}
    </Card>
  );
}

/* ═══════════════════════
   MAIN COMPONENT
═══════════════════════ */
export default function InterviewManagement({ role }) {
  const isTpo = role === "placement officer" || role === "placement chairman";
  const isStudent = role === "student";

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);

  // Create / Reschedule modal
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    job_posting: "",
    date: "",
    time_slot: "",
    duration_minutes: 60,
    mode: "OFFLINE",
    venue_or_link: "",
    description: "",
    round_number: 1,
  });
  const [conflictWarning, setConflictWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Panel modal
  const [panelModal, setPanelModal] = useState({
    open: false,
    interview: null,
  });
  const [panelData, setPanelData] = useState({
    interview: null,
    panelists: [],
  });
  const [applications, setApplications] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);

  // Outcome modal
  const [outcomeModal, setOutcomeModal] = useState({
    open: false,
    interview: null,
  });
  const [outcomes, setOutcomes] = useState([]);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(interviewsRoute);
      setInterviews(Array.isArray(res) ? res : []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load interviews.",
        color: "red",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  /* ── Conflict Check (live preview) ── */
  const checkConflicts = async () => {
    if (!form.date || !form.time_slot || !form.venue_or_link) {
      setConflictWarning(null);
      return;
    }
    try {
      const params = new URLSearchParams({
        date: form.date,
        time_slot: form.time_slot,
        duration_minutes: String(form.duration_minutes || 60),
        venue_or_link: form.venue_or_link,
      });
      if (editing) params.append("exclude_id", String(editing.id));
      const res = await apiGet(
        `${interviewConflictsRoute}?${params.toString()}`,
      );
      setConflictWarning(res.has_conflicts ? res : null);
    } catch {
      setConflictWarning(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkConflicts, 400);
    return () => clearTimeout(timer);
  }, [form.date, form.time_slot, form.duration_minutes, form.venue_or_link]);

  /* ── Reschedule ── */
  const openEdit = (interview) => {
    setEditing(interview);
    setForm({
      job_posting: interview.job_posting,
      date: interview.date,
      time_slot: interview.time_slot,
      duration_minutes: interview.duration_minutes,
      mode: interview.mode,
      venue_or_link: interview.venue_or_link || "",
      description: interview.description || "",
      round_number: interview.round_number,
    });
    setConflictWarning(null);
    setFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.date || !form.time_slot) {
      notifications.show({
        title: "Missing fields",
        message: "Date and time are required.",
        color: "red",
      });
      return;
    }
    if (conflictWarning) {
      notifications.show({
        title: "Conflict",
        message: "Resolve venue/time conflict first.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await apiPut(`${interviewsRoute}${editing.id}/`, form);
        notifications.show({
          title: "Updated",
          message: "Interview rescheduled.",
          color: "green",
        });
      } else {
        await apiPost(interviewsRoute, form);
        notifications.show({
          title: "Created",
          message: "Interview scheduled.",
          color: "green",
        });
      }
      setFormModal(false);
      fetchInterviews();
    } catch (err) {
      const detail =
        err?.response?.data?.error || err?.response?.data?.detail || "Failed.";
      notifications.show({ title: "Error", message: detail, color: "red" });
    }
    setSubmitting(false);
  };

  const handleDelete = async (interview) => {
    if (!window.confirm(`Delete interview for "${interview.job_title}"?`))
      return;
    try {
      await apiDelete(`${interviewsRoute}${interview.id}/`);
      notifications.show({
        title: "Deleted",
        message: "Interview removed.",
        color: "orange",
      });
      fetchInterviews();
    } catch {
      notifications.show({
        title: "Error",
        message: "Delete failed.",
        color: "red",
      });
    }
  };

  /* ── Panel Management ── */
  const openPanel = async (interview) => {
    setPanelModal({ open: true, interview });
    try {
      const [detail, apps] = await Promise.all([
        apiGet(`${interviewsRoute}${interview.id}/`),
        apiGet(
          `${jobPostingsRoute}${interview.job_posting}/applications/`,
        ).catch(() => []),
      ]);
      setPanelData(detail);
      const appList = Array.isArray(apps) ? apps : apps.results || [];
      setApplications(appList);
      setSelectedApps([]);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load panel data.",
        color: "red",
      });
    }
  };

  const handleAssignPanel = async () => {
    if (selectedApps.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiPost(
        `${interviewsRoute}${panelModal.interview.id}/assign-panel/`,
        {
          application_ids: selectedApps,
        },
      );
      setPanelData((d) => ({ ...d, panelists: res.panelists }));
      setSelectedApps([]);
      notifications.show({
        title: "Assigned",
        message: res.detail,
        color: "green",
      });
      fetchInterviews();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.error || "Failed.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  /* ── Outcome Recording ── */
  const openOutcome = async (interview) => {
    setOutcomeModal({ open: true, interview });
    try {
      const detail = await apiGet(`${interviewsRoute}${interview.id}/`);
      const panelists = detail.panelists || [];
      setOutcomes(
        panelists.map((p) => ({
          panel_id: p.id,
          student_name: p.student_name,
          student_roll: p.student_roll,
          result: p.result || "PENDING",
          remarks: p.remarks || "",
        })),
      );
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load outcomes.",
        color: "red",
      });
    }
  };

  const handleSaveOutcomes = async () => {
    setSubmitting(true);
    try {
      await apiPut(
        `${interviewsRoute}${outcomeModal.interview.id}/record-outcome/`,
        {
          outcomes: outcomes.map((o) => ({
            panel_id: o.panel_id,
            result: o.result,
            remarks: o.remarks,
          })),
        },
      );
      notifications.show({
        title: "Saved",
        message: "Outcomes recorded.",
        color: "green",
      });
      setOutcomeModal({ open: false, interview: null });
      fetchInterviews();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save outcomes.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  const handleChange = (field) => (val) =>
    setForm((f) => ({
      ...f,
      [field]: typeof val === "object" && val?.target ? val.target.value : val,
    }));

  // Separate upcoming / past
  const upcoming = interviews.filter((i) => new Date(i.date) >= new Date());
  const past = interviews.filter((i) => new Date(i.date) < new Date());

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader size="lg" />
      </div>
    );

  /* ── STUDENT VIEW ── */
  if (isStudent) {
    return (
      <div>
        <Text size="1.5rem" fw={700} mb="lg" style={{ fontFamily: "Manrope" }}>
          My Interviews
        </Text>
        {interviews.length === 0 ? (
          <Card shadow="xs" radius="md" withBorder p="xl" ta="center">
            <CalendarBlank size={40} color="#aaa" />
            <Text c="dimmed" mt="sm">
              No interviews scheduled for you yet.
            </Text>
          </Card>
        ) : (
          <Stack spacing="md">
            {upcoming.length > 0 && (
              <>
                <Text fw={600} c="blue">
                  Upcoming
                </Text>
                {upcoming.map((i) => (
                  <StudentInterviewCard key={i.id} interview={i} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text fw={600} c="dimmed" mt="md">
                  Past
                </Text>
                {past.map((i) => (
                  <StudentInterviewCard key={i.id} interview={i} />
                ))}
              </>
            )}
          </Stack>
        )}
      </div>
    );
  }

  /* ── TPO VIEW ── */
  return (
    <div>
      <Group position="apart" mb="lg">
        <Text size="1.5rem" fw={700} style={{ fontFamily: "Manrope" }}>
          Interview Management
        </Text>
        {isTpo && (
          <Text size="xs" c="dimmed">
            New interviews are scheduled from the Applications tab — pick a
            shortlisted student and click <b>Schedule Interview</b>.
          </Text>
        )}
      </Group>

      {/* Stats Row */}
      <Group mb="lg" spacing="md">
        <Badge size="lg" variant="light" color="blue">
          {upcoming.length} Upcoming
        </Badge>
        <Badge size="lg" variant="light" color="gray">
          {past.length} Past
        </Badge>
        <Badge size="lg" variant="light" color="violet">
          {interviews.length} Total
        </Badge>
      </Group>

      {interviews.length === 0 ? (
        <Card shadow="xs" radius="md" withBorder p="xl" ta="center">
          <CalendarBlank size={40} color="#aaa" />
          <Text c="dimmed" mt="sm">
            No interviews scheduled yet.
          </Text>
          {isTpo && (
            <Text size="xs" c="dimmed" mt="xs">
              Open the <b>Applications</b> tab and click{" "}
              <b>Schedule Interview</b> on a shortlisted student.
            </Text>
          )}
        </Card>
      ) : (
        <Grid gutter="md">
          {interviews.map((i) => (
            <Grid.Col key={i.id} span={{ base: 12, sm: 6, md: 4 }}>
              <InterviewCard
                interview={i}
                isTpo={isTpo}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAssign={openPanel}
                onOutcome={openOutcome}
                onView={openPanel}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* ═════ RESCHEDULE MODAL ═════ */}
      <Modal
        opened={formModal}
        onClose={() => setFormModal(false)}
        title={
          editing
            ? `Reschedule Interview (${editing.reschedule_count}/2 used)`
            : "Reschedule Interview"
        }
        centered
        size="lg"
      >
        <Stack spacing="sm">
          <Group grow>
            <TextInput
              label="Date"
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              required
            />
            <TextInput
              label="Start Time"
              type="time"
              value={form.time_slot}
              onChange={handleChange("time_slot")}
              required
            />
          </Group>
          <Group grow>
            <NumberInput
              label="Duration (min)"
              min={15}
              max={480}
              step={15}
              value={form.duration_minutes}
              onChange={handleChange("duration_minutes")}
            />
            <NumberInput
              label="Round #"
              min={1}
              max={10}
              value={form.round_number}
              onChange={handleChange("round_number")}
            />
          </Group>
          <Group grow>
            <Select
              label="Mode"
              data={[
                { value: "OFFLINE", label: "Offline" },
                { value: "ONLINE", label: "Online" },
              ]}
              value={form.mode}
              onChange={handleChange("mode")}
            />
            <TextInput
              label={form.mode === "ONLINE" ? "Meeting Link" : "Venue"}
              placeholder={
                form.mode === "ONLINE"
                  ? "https://meet.google.com/..."
                  : "e.g. Seminar Hall 1"
              }
              value={form.venue_or_link}
              onChange={handleChange("venue_or_link")}
            />
          </Group>
          <Textarea
            label="Description"
            placeholder="Additional notes..."
            value={form.description}
            onChange={handleChange("description")}
            autosize
            minRows={2}
          />

          {/* Conflict Warning */}
          {conflictWarning && (
            <Alert
              color="red"
              icon={<WarningCircle size={18} />}
              title="Scheduling Conflict"
            >
              This slot conflicts with {conflictWarning.conflicts.length}{" "}
              existing interview(s) at the same venue.
              {conflictWarning.conflicts.map((c) => (
                <Text key={c.id} size="xs" mt={2}>
                  • {c.job_title} on {c.date} at {c.time_slot}—{c.end_time}
                </Text>
              ))}
            </Alert>
          )}

          {editing && editing.reschedule_count >= 2 && (
            <Alert
              color="red"
              icon={<WarningCircle size={18} />}
              title="Reschedule Limit Reached"
            >
              This interview has been rescheduled 2 times. No more reschedules
              allowed.
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            loading={submitting}
            fullWidth
            mt="xs"
            size="md"
            disabled={
              !!conflictWarning || (editing && editing.reschedule_count >= 2)
            }
          >
            Reschedule
          </Button>
        </Stack>
      </Modal>

      {/* ═════ PANEL MANAGEMENT MODAL ═════ */}
      <Modal
        opened={panelModal.open}
        onClose={() => setPanelModal({ open: false, interview: null })}
        title={`Interview Panel — ${panelModal.interview?.job_title || ""}`}
        centered
        size="lg"
      >
        <Stack spacing="md">
          {/* Current panelists */}
          <Text fw={600}>
            Current Panelists ({panelData.panelists?.length || 0})
          </Text>
          {panelData.panelists?.length > 0 ? (
            <Table striped highlightOnHover withBorder>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {panelData.panelists.map((p) => (
                  <tr key={p.id}>
                    <td>{p.student_name}</td>
                    <td>{p.student_roll}</td>
                    <td>
                      <Badge color={RESULT_COLOR[p.result]} size="sm">
                        {p.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed">
              No students assigned yet.
            </Text>
          )}

          <Divider />

          {/* Assign new students */}
          <Text fw={600}>Assign Students from Applications</Text>
          {applications.length > 0 ? (
            <>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {applications.map((app) => {
                  const alreadyAssigned = panelData.panelists?.some(
                    (p) => p.application === app.id,
                  );
                  return (
                    <Group key={app.id} spacing="xs" mb={4}>
                      <Checkbox
                        checked={selectedApps.includes(app.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedApps((s) => [...s, app.id]);
                          else
                            setSelectedApps((s) =>
                              s.filter((id) => id !== app.id),
                            );
                        }}
                        disabled={alreadyAssigned}
                      />
                      <Text size="sm">
                        {app.student_name || `App #${app.id}`}
                      </Text>
                      {alreadyAssigned && (
                        <Badge size="xs" color="gray">
                          Already assigned
                        </Badge>
                      )}
                    </Group>
                  );
                })}
              </div>
              <Button
                onClick={handleAssignPanel}
                loading={submitting}
                disabled={selectedApps.length === 0}
                leftIcon={<Users size={14} />}
              >
                Assign {selectedApps.length} Student(s)
              </Button>
            </>
          ) : (
            <Text size="sm" c="dimmed">
              No applications found for this job posting.
            </Text>
          )}
        </Stack>
      </Modal>

      {/* ═════ OUTCOME RECORDING MODAL ═════ */}
      <Modal
        opened={outcomeModal.open}
        onClose={() => setOutcomeModal({ open: false, interview: null })}
        title={`Record Outcomes — ${outcomeModal.interview?.job_title || ""}`}
        centered
        size="lg"
      >
        <Stack spacing="sm">
          {outcomes.length === 0 ? (
            <Text c="dimmed">No students assigned to this interview.</Text>
          ) : (
            outcomes.map((o, idx) => (
              <Card key={o.panel_id} withBorder radius="md" p="sm">
                <Group position="apart" noWrap>
                  <div>
                    <Text fw={500} size="sm">
                      {o.student_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {o.student_roll}
                    </Text>
                  </div>
                  <Select
                    size="xs"
                    data={[
                      { value: "PENDING", label: "Pending" },
                      { value: "SELECTED", label: "Selected" },
                      { value: "REJECTED", label: "Rejected" },
                      { value: "WAITLISTED", label: "Waitlisted" },
                    ]}
                    value={o.result}
                    onChange={(v) => {
                      const copy = [...outcomes];
                      copy[idx] = { ...copy[idx], result: v };
                      setOutcomes(copy);
                    }}
                    style={{ width: 140 }}
                  />
                </Group>
                <TextInput
                  placeholder="Remarks..."
                  size="xs"
                  mt={4}
                  value={o.remarks}
                  onChange={(e) => {
                    const copy = [...outcomes];
                    copy[idx] = { ...copy[idx], remarks: e.target.value };
                    setOutcomes(copy);
                  }}
                />
              </Card>
            ))
          )}
          <Button
            onClick={handleSaveOutcomes}
            loading={submitting}
            fullWidth
            mt="xs"
            color="green"
            disabled={outcomes.length === 0}
          >
            Save Outcomes
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
