import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { placementApi } from "../../services/api";

function StudentApplicationsTable() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await placementApi.getMyApplications();
      setApplications(response.data.applications || []);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load your applications.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleWithdraw = async (scheduleId) => {
    try {
      await placementApi.withdrawApplication(scheduleId);
      notifications.show({
        title: "Success",
        message: "Application withdrawn successfully.",
        color: "green",
      });
      await loadApplications();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail ||
          "Could not withdraw this application right now.",
        color: "red",
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack>
      <Title order={2}>My Applications</Title>
      {applications.length ? (
        applications.map((application) => (
          <Card key={application.application_id} withBorder radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={700}>{application.company_name}</Text>
                  <Text c="dimmed">
                    {application.role || "Role not specified"}
                  </Text>
                </div>
                <Badge
                  color={
                    application.status === "accept"
                      ? "green"
                      : application.status === "reject"
                        ? "red"
                        : application.status === "withdrawn"
                          ? "gray"
                          : "blue"
                  }
                >
                  {application.status}
                </Badge>
              </Group>
              <Text size="sm">
                Applied on{" "}
                {application.applied_at
                  ? new Date(application.applied_at).toLocaleString()
                  : "N/A"}
              </Text>
              <Text size="sm">
                Offer status: {application.offer_status || "Not issued"}
              </Text>
              {application.next_interview ? (
                <Alert color="blue" variant="light">
                  Next interview: {application.next_interview.title}
                  {" on "}
                  {application.next_interview.date
                    ? new Date(application.next_interview.date).toLocaleDateString()
                    : "TBA"}
                  {application.next_interview.feedback
                    ? ` | Feedback: ${application.next_interview.feedback}`
                    : ""}
                </Alert>
              ) : null}
              {application.rounds?.length ? (
                <Stack gap={6}>
                  <Text size="sm" fw={600}>
                    Round History
                  </Text>
                  {application.rounds.map((round) => (
                    <Card key={round.id} withBorder radius="md" padding="sm">
                      <Stack gap={2}>
                        <Group justify="space-between">
                          <Text size="sm" fw={600}>
                            {round.title}
                          </Text>
                          <Badge variant="light">
                            {round.outcome?.toUpperCase() || "PENDING"}
                          </Badge>
                        </Group>
                        <Text size="sm">
                          {round.date
                            ? new Date(round.date).toLocaleString()
                            : "Schedule pending"}
                        </Text>
                        <Text size="sm">Mode: {round.mode || "TBD"}</Text>
                        <Text size="sm">
                          Location / Link: {round.location || "-"}
                        </Text>
                        <Text size="sm">
                          Feedback: {round.feedback || round.description || "No feedback"}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : null}
              <Group>
                <Button
                  variant="light"
                  onClick={() =>
                    navigate(
                      `/placement-cell/apply-placement?jobId=${application.schedule_id}`,
                    )
                  }
                >
                  View Details
                </Button>
                {application.offer_id ? (
                  <Button
                    variant="light"
                    onClick={() =>
                      navigate(`/placement-cell/offer/${application.offer_id}`)
                    }
                  >
                    View Offer
                  </Button>
                ) : null}
                {application.can_withdraw ? (
                  <Button
                    color="red"
                    variant="outline"
                    onClick={() => handleWithdraw(application.schedule_id)}
                  >
                    Withdraw
                  </Button>
                ) : null}
              </Group>
            </Stack>
          </Card>
        ))
      ) : (
        <Alert color="yellow" title="No Applications">
          You have not applied to any jobs yet.
        </Alert>
      )}
    </Stack>
  );
}

export default StudentApplicationsTable;
