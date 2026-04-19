/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
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
  Avatar,
  Tabs,
  ActionIcon,
  Tooltip,
  NumberInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  MagnifyingGlass,
  Chats,
  CalendarBlank,
  Check,
  X,
  User,
  Plus,
  PencilSimple,
  VideoCamera,
} from "phosphor-react";
import { apiGet, apiPost, apiPut } from "./api";
import {
  mentorshipRoute,
  mentorshipSessionsRoute,
} from "../../routes/placementCellRoutes";

const SESSION_COLOR = {
  REQUESTED: "yellow",
  CONFIRMED: "green",
  COMPLETED: "blue",
  CANCELLED: "red",
};

/* ═══════════════════════
   MENTOR CARD (for browsing)
═══════════════════════ */
function MentorCard({ mentor, onRequest }) {
  return (
    <Card shadow="xs" radius="md" withBorder p="md" h="100%">
      <Group mb="sm" noWrap>
        <Avatar radius="xl" size="lg" color="teal">
          {mentor.alumni_name?.charAt(0)?.toUpperCase() || "M"}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {mentor.alumni_name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {[mentor.alumni_designation, mentor.alumni_company]
              .filter(Boolean)
              .join(" at ") || "—"}
          </Text>
        </div>
        {mentor.is_available ? (
          <Badge color="green" variant="light" size="sm">
            Available
          </Badge>
        ) : (
          <Badge color="gray" variant="light" size="sm">
            Unavailable
          </Badge>
        )}
      </Group>

      {mentor.alumni_department && (
        <Text size="xs" c="dimmed" mb={4}>
          {mentor.alumni_department} · Class of {mentor.alumni_graduation_year}
        </Text>
      )}

      {mentor.bio && (
        <Text size="xs" c="dimmed" lineClamp={2} mb="xs">
          {mentor.bio}
        </Text>
      )}

      {mentor.topics?.length > 0 && (
        <Group spacing={4} mb="sm">
          {mentor.topics.map((t, i) => (
            <Badge key={i} variant="outline" size="xs" color="indigo">
              {t}
            </Badge>
          ))}
        </Group>
      )}

      <Text size="xs" c="dimmed" mb="sm">
        Max {mentor.max_sessions_per_month} sessions / month
      </Text>

      <Button
        fullWidth
        size="xs"
        variant="light"
        leftIcon={<Chats size={14} />}
        onClick={() => onRequest(mentor)}
        disabled={!mentor.is_available}
      >
        Request Session
      </Button>
    </Card>
  );
}

/* ═══════════════════════
   SESSION ROW
═══════════════════════ */
function SessionRow({ session, isAlumni, onUpdate }) {
  return (
    <Card shadow="xs" radius="md" withBorder p="sm" mb="xs">
      <Group position="apart" noWrap>
        <div style={{ flex: 1 }}>
          <Text fw={500} size="sm">
            {session.topic}
          </Text>
          <Text size="xs" c="dimmed">
            {isAlumni
              ? `Student: ${session.student_name} (${session.student_roll})`
              : `Mentor: ${session.mentor_name}`}
            {session.mentor_company ? ` · ${session.mentor_company}` : ""}
          </Text>
          {session.message && (
            <Text size="xs" c="dimmed" mt={2} lineClamp={1}>
              "{session.message}"
            </Text>
          )}
          {session.scheduled_date && (
            <Text size="xs" mt={2}>
              📅 {session.scheduled_date}
              {session.scheduled_time ? ` at ${session.scheduled_time}` : ""}
              {session.duration_minutes
                ? ` (${session.duration_minutes} min)`
                : ""}
            </Text>
          )}
          {session.meeting_link && (
            <Text size="xs" mt={2}>
              🔗{" "}
              <a
                href={session.meeting_link}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none", color: "#228be6" }}
              >
                Join Meeting
              </a>
            </Text>
          )}
        </div>
        <div>
          <Badge
            color={SESSION_COLOR[session.status]}
            variant="light"
            size="sm"
            mb={4}
          >
            {session.status}
          </Badge>
          {isAlumni && session.status === "REQUESTED" && (
            <Group spacing={4}>
              <Tooltip label="Confirm">
                <ActionIcon
                  color="green"
                  size="sm"
                  variant="filled"
                  onClick={() => onUpdate(session, "confirm")}
                >
                  <Check size={12} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Cancel">
                <ActionIcon
                  color="red"
                  size="sm"
                  variant="light"
                  onClick={() => onUpdate(session, "cancel")}
                >
                  <X size={12} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
          {!isAlumni && session.status === "REQUESTED" && (
            <Button
              size="xs"
              variant="subtle"
              color="red"
              compact
              onClick={() => onUpdate(session, "cancel")}
            >
              Cancel
            </Button>
          )}
        </div>
      </Group>
    </Card>
  );
}

/* ═══════════════════════
   MAIN COMPONENT
═══════════════════════ */
export default function MentorshipHub({ role }) {
  const isAlumni = role === "alumni";

  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(isAlumni ? "sessions" : "mentors");

  // Alumni mentorship profile
  const [myProfile, setMyProfile] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    topics: [],
    bio: "",
    max_sessions_per_month: 4,
    is_available: true,
    availability_slots: [],
  });
  const [topicInput, setTopicInput] = useState("");

  // Request session modal (student)
  const [reqModal, setReqModal] = useState({ open: false, mentor: null });
  const [reqForm, setReqForm] = useState({
    topic: "",
    message: "",
    scheduled_date: "",
    scheduled_time: "",
  });

  // Confirm session modal (alumni)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    session: null,
  });
  const [meetingLink, setMeetingLink] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mentorRes, sessionRes] = await Promise.all([
        apiGet(mentorshipRoute),
        apiGet(mentorshipSessionsRoute),
      ]);
      setMentors(
        Array.isArray(mentorRes) ? mentorRes : mentorRes.results || [],
      );
      setSessions(
        Array.isArray(sessionRes) ? sessionRes : sessionRes.results || [],
      );

      // If alumni, their own profile is returned in mentorRes
      if (isAlumni && mentorRes.length > 0) {
        setMyProfile(mentorRes[0]);
        setProfileForm({
          topics: mentorRes[0].topics || [],
          bio: mentorRes[0].bio || "",
          max_sessions_per_month: mentorRes[0].max_sessions_per_month || 4,
          is_available: mentorRes[0].is_available,
          availability_slots: mentorRes[0].availability_slots || [],
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load data.",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMentors = mentors.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (m.alumni_name || "").toLowerCase().includes(q) ||
      (m.alumni_company || "").toLowerCase().includes(q) ||
      (m.topics || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  /* ── Student: Request Session ── */
  const handleRequestSession = async () => {
    if (!reqForm.topic) {
      notifications.show({
        title: "Missing topic",
        message: "Please enter a topic.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(mentorshipSessionsRoute, {
        mentor: reqModal.mentor.id,
        topic: reqForm.topic,
        message: reqForm.message,
        scheduled_date: reqForm.scheduled_date || null,
        scheduled_time: reqForm.scheduled_time || null,
      });
      notifications.show({
        title: "Requested",
        message: "Session request sent!",
        color: "green",
      });
      setReqModal({ open: false, mentor: null });
      setReqForm({
        topic: "",
        message: "",
        scheduled_date: "",
        scheduled_time: "",
      });
      fetchData();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Request failed.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  /* ── Alumni / Student: Update session ── */
  const handleSessionUpdate = async (session, action) => {
    if (action === "confirm") {
      setConfirmModal({ open: true, session });
      return;
    }
    // Cancel
    setSubmitting(true);
    try {
      await apiPut(`${mentorshipSessionsRoute}${session.id}/`, {
        status: "CANCELLED",
      });
      notifications.show({
        title: "Cancelled",
        message: "Session cancelled.",
        color: "orange",
      });
      fetchData();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Action failed.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  const handleConfirmSession = async () => {
    setSubmitting(true);
    try {
      await apiPut(`${mentorshipSessionsRoute}${confirmModal.session.id}/`, {
        status: "CONFIRMED",
        meeting_link: meetingLink || null,
      });
      notifications.show({
        title: "Confirmed",
        message: "Session confirmed!",
        color: "green",
      });
      setConfirmModal({ open: false, session: null });
      setMeetingLink("");
      fetchData();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Failed.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  /* ── Alumni: Create/update mentorship profile ── */
  const handleSaveProfile = async () => {
    setSubmitting(true);
    try {
      if (myProfile) {
        await apiPut(`${mentorshipRoute}${myProfile.id}/`, profileForm);
      } else {
        await apiPost(mentorshipRoute, profileForm);
      }
      notifications.show({
        title: "Saved",
        message: "Mentorship profile saved.",
        color: "green",
      });
      setProfileModal(false);
      fetchData();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Save failed.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  const addTopic = () => {
    if (topicInput.trim() && !profileForm.topics.includes(topicInput.trim())) {
      setProfileForm((f) => ({
        ...f,
        topics: [...f.topics, topicInput.trim()],
      }));
      setTopicInput("");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader size="lg" />
      </div>
    );

  return (
    <div>
      <Group position="apart" mb="lg">
        <Text size="1.5rem" fw={700} style={{ fontFamily: "Manrope" }}>
          Mentorship Hub
        </Text>
        {isAlumni && (
          <Button
            leftIcon={
              myProfile ? <PencilSimple size={16} /> : <Plus size={16} />
            }
            onClick={() => setProfileModal(true)}
          >
            {myProfile ? "Edit My Profile" : "Setup Mentorship Profile"}
          </Button>
        )}
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
        <Tabs.List>
          {!isAlumni && <Tabs.Tab value="mentors">Browse Mentors</Tabs.Tab>}
          <Tabs.Tab value="sessions">
            {isAlumni ? "Incoming Sessions" : "My Sessions"}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* ── Browse Mentors (Students & TPO) ── */}
      {activeTab === "mentors" && !isAlumni && (
        <Stack>
          <TextInput
            placeholder="Search by name, company, topic..."
            icon={<MagnifyingGlass size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb="md"
            style={{ maxWidth: 360 }}
          />
          {filteredMentors.length === 0 ? (
            <Card shadow="xs" radius="md" withBorder p="xl" ta="center">
              <User size={40} color="#aaa" />
              <Text c="dimmed" mt="sm">
                No mentors available at this time.
              </Text>
            </Card>
          ) : (
            <Grid gutter="md">
              {filteredMentors.map((m) => (
                <Grid.Col key={m.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <MentorCard
                    mentor={m}
                    onRequest={(mentor) => setReqModal({ open: true, mentor })}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* ── Sessions List ── */}
      {activeTab === "sessions" && (
        <Stack>
          {sessions.length === 0 ? (
            <Card shadow="xs" radius="md" withBorder p="xl" ta="center">
              <CalendarBlank size={40} color="#aaa" />
              <Text c="dimmed" mt="sm">
                No sessions yet.
              </Text>
            </Card>
          ) : (
            <Stack spacing="xs">
              {sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  isAlumni={isAlumni}
                  onUpdate={handleSessionUpdate}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* ── Request Session Modal (Student) ── */}
      <Modal
        opened={reqModal.open}
        onClose={() => setReqModal({ open: false, mentor: null })}
        title={`Request Session with ${reqModal.mentor?.alumni_name || ""}`}
        centered
      >
        <Stack spacing="sm">
          {reqModal.mentor?.topics?.length > 0 && (
            <Select
              label="Topic"
              placeholder="Pick or type a topic"
              data={reqModal.mentor.topics.map((t) => ({ value: t, label: t }))}
              value={reqForm.topic}
              onChange={(v) => setReqForm((f) => ({ ...f, topic: v }))}
              searchable
              creatable
              getCreateLabel={(q) => `+ "${q}"`}
              onCreate={(q) => {
                setReqForm((f) => ({ ...f, topic: q }));
                return q;
              }}
            />
          )}
          {(!reqModal.mentor?.topics ||
            reqModal.mentor.topics.length === 0) && (
            <TextInput
              label="Topic"
              placeholder="e.g. Resume Review, System Design"
              value={reqForm.topic}
              onChange={(e) =>
                setReqForm((f) => ({ ...f, topic: e.target.value }))
              }
            />
          )}
          <Textarea
            label="Message (optional)"
            placeholder="Briefly describe what you'd like to discuss..."
            value={reqForm.message}
            onChange={(e) =>
              setReqForm((f) => ({ ...f, message: e.target.value }))
            }
            autosize
            minRows={2}
          />
          <Group grow>
            <TextInput
              label="Preferred Date"
              type="date"
              value={reqForm.scheduled_date}
              onChange={(e) =>
                setReqForm((f) => ({ ...f, scheduled_date: e.target.value }))
              }
            />
            <TextInput
              label="Preferred Time"
              type="time"
              value={reqForm.scheduled_time}
              onChange={(e) =>
                setReqForm((f) => ({ ...f, scheduled_time: e.target.value }))
              }
            />
          </Group>
          <Button
            onClick={handleRequestSession}
            loading={submitting}
            fullWidth
            mt="xs"
          >
            Send Request
          </Button>
        </Stack>
      </Modal>

      {/* ── Confirm Session Modal (Alumni) ── */}
      <Modal
        opened={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, session: null })}
        title="Confirm Session"
        centered
      >
        <Stack spacing="sm">
          <Text size="sm">
            Confirming session with{" "}
            <strong>{confirmModal.session?.student_name}</strong> on topic "
            <em>{confirmModal.session?.topic}</em>".
          </Text>
          <TextInput
            label="Meeting Link (optional)"
            placeholder="https://meet.google.com/..."
            icon={<VideoCamera size={16} />}
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />
          <Button
            onClick={handleConfirmSession}
            loading={submitting}
            fullWidth
            mt="xs"
            color="green"
          >
            Confirm
          </Button>
        </Stack>
      </Modal>

      {/* ── Mentorship Profile Modal (Alumni) ── */}
      <Modal
        opened={profileModal}
        onClose={() => setProfileModal(false)}
        title={
          myProfile ? "Edit Mentorship Profile" : "Setup Mentorship Profile"
        }
        centered
        size="lg"
      >
        <Stack spacing="sm">
          <Textarea
            label="Mentorship Bio"
            placeholder="Describe what you can help students with..."
            value={profileForm.bio}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, bio: e.target.value }))
            }
            autosize
            minRows={2}
          />

          <Text fw={500} size="sm">
            Topics
          </Text>
          <Group spacing="xs">
            {profileForm.topics.map((t, i) => (
              <Badge
                key={i}
                variant="outline"
                rightSection={
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    onClick={() =>
                      setProfileForm((f) => ({
                        ...f,
                        topics: f.topics.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    <X size={10} />
                  </ActionIcon>
                }
              >
                {t}
              </Badge>
            ))}
          </Group>
          <Group>
            <TextInput
              placeholder="Add topic..."
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTopic())
              }
              style={{ flex: 1 }}
            />
            <Button variant="light" onClick={addTopic}>
              Add
            </Button>
          </Group>

          <NumberInput
            label="Max Sessions per Month"
            min={1}
            max={30}
            value={profileForm.max_sessions_per_month}
            onChange={(v) =>
              setProfileForm((f) => ({ ...f, max_sessions_per_month: v }))
            }
          />

          <Select
            label="Availability"
            data={[
              { value: "true", label: "Available" },
              { value: "false", label: "Not Available" },
            ]}
            value={String(profileForm.is_available)}
            onChange={(v) =>
              setProfileForm((f) => ({ ...f, is_available: v === "true" }))
            }
          />

          <Button
            onClick={handleSaveProfile}
            loading={submitting}
            fullWidth
            mt="xs"
          >
            {myProfile ? "Update Profile" : "Create Profile"}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
