import React, { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { ArrowLeft } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useNavigate, useParams } from "react-router-dom";
import { placementApi } from "../api";
import { showApiError } from "../utils/authorization";

function formatDateTime(value) {
  if (!value) {
    return "Pending";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatOutcomeLabel(value) {
  if (!value) {
    return "Pending";
  }

  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "failed") {
    return "Rejected";
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
}

function getOutcomeColor(value) {
  switch ((value || "").toLowerCase()) {
    case "selected":
    case "passed":
      return "green";
    case "failed":
      return "red";
    default:
      return "yellow";
  }
}

function getInterviewRecordSummary(application) {
  const interviews = application.interviews || [];
  const latestInterview = interviews[interviews.length - 1];

  return [
    {
      label: "Candidate",
      value: application.student.name || "N/A",
    },
    {
      label: "Roll Number",
      value: application.student.roll_no || "N/A",
    },
    {
      label: "Interview Schedule",
      value: latestInterview?.scheduled_at
        ? formatDateTime(latestInterview.scheduled_at)
        : "Not scheduled yet",
    },
    {
      label: "Interview Result",
      value: latestInterview?.outcome
        ? formatOutcomeLabel(latestInterview.outcome)
        : application.status_label || "Pending",
    },
    {
      label: "Feedback / Remarks",
      value:
        latestInterview?.feedback ||
        latestInterview?.remarks ||
        application.remarks ||
        "No remarks saved yet",
    },
  ];
}

function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: "",
    remarks: "",
  });
  const [interviewForm, setInterviewForm] = useState({
    round_no: "",
    title: "",
    scheduled_at: "",
    end_datetime: "",
    mode: "ONLINE",
    location: "",
    meeting_link: "",
    feedback: "",
    outcome: "pending",
  });

  const loadDetail = async () => {
    setLoading(true);
    try {
      const response = await placementApi.getApplicationDetail(applicationId);
      setApplication(response.data);
      setStatusForm({
        status: response.data.status || "pending",
        remarks: response.data.remarks || "",
      });
      setInterviewForm((prev) => ({
        ...prev,
        round_no: String((response.data.interviews?.length || 0) + 1),
      }));
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to load application details.",
        authorizationFallback:
          "Only placement officer users can view applicant details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [applicationId]);

  const handleStatusSave = async (nextStatus) => {
    const payload = {
      status: nextStatus || statusForm.status,
      remarks: statusForm.remarks,
    };
    setSavingStatus(true);
    try {
      const response = await placementApi.updateApplicationDetail(
        applicationId,
        payload,
      );
      setApplication(response.data);
      setStatusForm({
        status: response.data.status,
        remarks: response.data.remarks || "",
      });
      notifications.show({
        title: "Updated",
        message: "Applicant timeline updated successfully.",
        color: "green",
      });
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to update applicant status.",
        authorizationFallback: "Only TPO users can update applicants.",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleInterviewSave = async () => {
    if (!interviewForm.scheduled_at) {
      notifications.show({
        title: "Missing details",
        message: "Interview schedule date and time are required.",
        color: "yellow",
      });
      return;
    }
    setSavingInterview(true);
    try {
      await placementApi.scheduleApplicationInterview(applicationId, interviewForm);
      notifications.show({
        title: "Interview saved",
        message: "Interview schedule updated successfully.",
        color: "green",
      });
      setInterviewForm((prev) => ({
        ...prev,
        round_no: String((application?.interviews?.length || 0) + 2),
        title: "",
        scheduled_at: "",
        end_datetime: "",
        location: "",
        meeting_link: "",
        feedback: "",
        outcome: "pending",
      }));
      await loadDetail();
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to save interview schedule.",
        authorizationFallback: "Only TPO users can manage interviews.",
      });
    } finally {
      setSavingInterview(false);
    }
  };

  const handleShortlistForNextRound = async () => {
    setStatusForm((prev) => ({ ...prev, status: "shortlisted" }));
    await handleStatusSave("shortlisted");
  };

  if (loading || !application) {
    return <Container py="xl">Loading...</Container>;
  }

  return (
    <Container fluid py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate(`/placement-cell/view?jobId=${application.schedule_id}`)}
          >
            Back to applicants
          </Button>
          <Badge color="blue">{application.status_label}</Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Card withBorder radius="md" padding="lg">
            <Stack gap="md">
              <Title order={3}>Applicant Details</Title>
              <Text fw={700}>{application.student.name}</Text>
              <Text>{application.student.roll_no}</Text>
              <Text>{application.student.email}</Text>
              <Text>Phone: {application.student.phone_no || "N/A"}</Text>
              <Text>Branch: {application.student.branch || "N/A"}</Text>
              <Text>CPI: {application.student.cpi ?? "N/A"}</Text>
              <Text>
                Passout Year: {application.student.passout_year || "N/A"}
              </Text>
              <Text>Programme: {application.student.programme || "N/A"}</Text>
              <Text>Address: {application.student.address || "N/A"}</Text>
              <Text>About: {application.student.about_me || "N/A"}</Text>
              <Text>
                {application.company.name} | {application.company.role || "Role not specified"}
              </Text>
              <Text>Package: {application.company.ctc} LPA</Text>
              {application.resume?.url ? (
                <Anchor
                  href={application.resume.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open latest resume
                </Anchor>
              ) : null}
            </Stack>
          </Card>

          <Card withBorder radius="md" padding="lg">
            <Stack gap="sm">
              <Title order={3}>Update Timeline</Title>
              <Select
                label="Move application to"
                data={[
                  { value: "pending", label: "Under Review" },
                  { value: "shortlisted", label: "Shortlisted" },
                  { value: "interview_scheduled", label: "Interview Scheduled" },
                  { value: "interview_completed", label: "Interview Completed" },
                  { value: "offer_released", label: "Offer Released" },
                  { value: "accept", label: "Selected" },
                  { value: "reject", label: "Rejected" },
                ]}
                value={statusForm.status}
                onChange={(value) =>
                  setStatusForm((prev) => ({ ...prev, status: value || "pending" }))
                }
              />
              <Textarea
                label="Remarks"
                value={statusForm.remarks}
                onChange={(event) =>
                  setStatusForm((prev) => ({
                    ...prev,
                    remarks: event.currentTarget.value,
                  }))
                }
                minRows={4}
              />
              <Group grow>
                <Button loading={savingStatus} onClick={() => handleStatusSave()}>
                  Save status update
                </Button>
                <Button
                  variant="light"
                  color="blue"
                  loading={savingStatus}
                  onClick={handleShortlistForNextRound}
                >
                  Shortlist For Next Round
                </Button>
                <Button
                  variant="light"
                  loading={savingStatus}
                  onClick={() => handleStatusSave("offer_released")}
                >
                  Send Job Offer
                </Button>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3}>Interview Record Saved In System</Title>
                <Text size="sm" c="dimmed">
                  Every saved interview step is surfaced here as frontend evidence:
                  schedule, candidate details, result, and feedback.
                </Text>
              </div>
              <Badge color="teal">
                {application.interviews?.length || 0} rounds recorded
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
              {getInterviewRecordSummary(application).map((item) => (
                <Card key={item.label} withBorder radius="md" padding="md">
                  <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
                    {item.label}
                  </Text>
                  <Text mt={6} fw={600}>
                    {item.value}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>

        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Card withBorder radius="md" padding="lg">
              <Stack gap="lg">
                <Title order={3}>Application Timeline</Title>
                {application.timeline.map((item) => (
                  <Group key={item.id} align="flex-start" wrap="nowrap">
                    <Badge color="green" radius="xl">
                      {item.stage}
                    </Badge>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Updated {formatDateTime(item.created_at)}
                        {item.actor ? ` by ${item.actor}` : ""}
                      </Text>
                      <Text size="sm">{item.remarks || item.stage}</Text>
                    </Stack>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              <Card withBorder radius="md" padding="lg">
                <Stack gap="md">
                  <Title order={3}>Resume / Documents</Title>
                  {application.documents?.length ? (
                    application.documents.map((document) => (
                      <Card key={document.id} withBorder radius="md" padding="sm">
                        <Group justify="space-between" align="center">
                          <div>
                            <Text fw={600}>{document.name}</Text>
                            <Text size="sm" c="dimmed">
                              Uploaded {formatDateTime(document.uploaded_at)}
                            </Text>
                          </div>
                          <Anchor
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </Anchor>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed" size="sm">
                      No placement documents uploaded by this student yet.
                    </Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Stack gap="md">
                  <Title order={3}>Interview Schedule</Title>
                  {application.interviews.length ? (
                    application.interviews.map((item) => (
                      <Card key={item.id} withBorder radius="md" padding="md">
                        <Group justify="space-between" align="flex-start">
                          <Stack gap={2}>
                            <Text fw={700}>{item.title}</Text>
                            <Text size="sm">Round: {item.round_no || "N/A"}</Text>
                            <Text size="sm">
                              Scheduled at: {formatDateTime(item.scheduled_at)}
                            </Text>
                            <Text size="sm">
                              Ends at: {formatDateTime(item.end_datetime)}
                            </Text>
                            <Text size="sm">Mode: {item.mode || "N/A"}</Text>
                            <Text size="sm">
                              Location / Link: {item.meeting_link || item.location || "-"}
                            </Text>
                            <Text size="sm">
                              Feedback / Remarks:{" "}
                              {item.feedback || item.remarks || "No feedback added."}
                            </Text>
                            <Group gap="xs" mt={4}>
                              <Text size="sm">Result:</Text>
                              <Badge color={getOutcomeColor(item.outcome)} radius="xl">
                                {formatOutcomeLabel(item.outcome)}
                              </Badge>
                            </Group>
                          </Stack>
                          <Badge color={item.is_active ? "blue" : "gray"}>
                            {item.is_active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed" size="sm">
                      No interview has been scheduled yet.
                    </Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Stack gap="sm">
                  <Title order={4}>Schedule / Reschedule Interview</Title>
                  <Text size="sm" c="dimmed">
                    Saving this form records the interview step in the system with
                    date/time, result, and remarks.
                  </Text>
                  <TextInput
                    label="Round"
                    description="Defaults to the next available round number."
                    value={interviewForm.round_no}
                    onChange={(event) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        round_no: event.currentTarget.value,
                      }))
                    }
                  />
                  <TextInput
                    label="Title"
                    value={interviewForm.title}
                    onChange={(event) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        title: event.currentTarget.value,
                      }))
                    }
                  />
                  <TextInput
                    label="Scheduled at"
                    type="datetime-local"
                    value={interviewForm.scheduled_at}
                    onChange={(event) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        scheduled_at: event.currentTarget.value,
                      }))
                    }
                  />
                  <TextInput
                    label="End time"
                    type="datetime-local"
                    value={interviewForm.end_datetime}
                    onChange={(event) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        end_datetime: event.currentTarget.value,
                      }))
                    }
                  />
                  <SimpleGrid cols={2}>
                    <Select
                      label="Mode"
                      data={[
                        { value: "ONLINE", label: "Online" },
                        { value: "OFFLINE", label: "Offline" },
                        { value: "HYBRID", label: "Hybrid" },
                      ]}
                      value={interviewForm.mode}
                      onChange={(value) =>
                        setInterviewForm((prev) => ({
                          ...prev,
                          mode: value || "ONLINE",
                        }))
                      }
                    />
                    <TextInput
                      label="Location"
                      value={interviewForm.location}
                      onChange={(event) =>
                        setInterviewForm((prev) => ({
                          ...prev,
                          location: event.currentTarget.value,
                        }))
                      }
                    />
                  </SimpleGrid>
                  <TextInput
                    label="Meeting link"
                    value={interviewForm.meeting_link}
                    onChange={(event) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        meeting_link: event.currentTarget.value,
                      }))
                    }
                  />
                  <Textarea
                    label="Feedback / Remarks"
                    description="Saved in the system and visible in the student's application history."
                    minRows={3}
                    value={interviewForm.feedback}
                    onChange={(event) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        feedback: event.currentTarget.value,
                      }))
                    }
                  />
                  <Select
                    label="Interview Result"
                    data={[
                      { value: "pending", label: "Pending" },
                      { value: "passed", label: "Passed" },
                      { value: "failed", label: "Rejected" },
                      { value: "selected", label: "Selected" },
                    ]}
                    value={interviewForm.outcome}
                    onChange={(value) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        outcome: value || "pending",
                      }))
                    }
                  />
                  <Button loading={savingInterview} onClick={handleInterviewSave}>
                    Add Round
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}

export default ApplicationDetailPage;
