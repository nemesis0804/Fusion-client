import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";

function PlacementAppealsPanel() {
  const [appeals, setAppeals] = useState([]);
  const [rejectedApplications, setRejectedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [selectedPlacementStatus, setSelectedPlacementStatus] = useState("");
  const [reason, setReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [appealsResponse, applicationsResponse] = await Promise.all([
        placementApi.getPlacementAppeals(),
        placementApi.getMyApplications(),
      ]);
      setAppeals(appealsResponse.data || []);
      setRejectedApplications(
        (applicationsResponse.data.applications || []).filter(
          (application) =>
            application.can_raise_appeal && application.offer_id,
        ),
      );
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load appeals.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlacementStatus || !reason.trim()) {
      notifications.show({
        title: "Validation Failed",
        message: "Please select a rejected application and enter a reason.",
        color: "red",
      });
      return;
    }
    try {
      await placementApi.createPlacementAppeal({
        placement_status: selectedPlacementStatus,
        reason: reason.trim(),
      });
      notifications.show({
        title: "Success",
        message: "Appeal submitted successfully.",
        color: "green",
      });
      setOpened(false);
      setSelectedPlacementStatus("");
      setReason("");
      await loadData();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail || "Could not submit appeal right now.",
        color: "red",
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Placement Appeals</Title>
          <Button onClick={() => setOpened(true)}>Raise Appeal</Button>
        </Group>
        {appeals.length ? (
          appeals.map((appeal) => (
            <Card key={appeal.id} withBorder radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={700}>{appeal.company_name}</Text>
                  <Badge
                    color={
                      appeal.status === "accepted"
                        ? "green"
                        : appeal.status === "rejected"
                          ? "red"
                          : appeal.status === "reviewed"
                            ? "blue"
                            : "yellow"
                    }
                  >
                    {appeal.status}
                  </Badge>
                </Group>
                <Text size="sm">Reason: {appeal.reason}</Text>
                <Text size="sm">
                  Submitted: {new Date(appeal.created_at).toLocaleString()}
                </Text>
                <Text size="sm">
                  Resolution target: {new Date(appeal.due_by).toLocaleString()}
                </Text>
                {appeal.response ? (
                  <Alert color="blue" variant="light">
                    TPO response: {appeal.response}
                  </Alert>
                ) : null}
                {appeal.overdue ? (
                  <Alert color="red" variant="light">
                    This appeal has crossed the 5-working-day resolution target.
                  </Alert>
                ) : null}
              </Stack>
            </Card>
          ))
        ) : (
          <Alert color="yellow" title="No Appeals">
            No appeals have been raised yet.
          </Alert>
        )}
      </Stack>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Raise Placement Appeal"
        centered
      >
        <Stack>
          <Select
            label="Rejected Application"
            data={rejectedApplications.map((application) => ({
              value: String(application.offer_id),
              label: `${application.company_name} - ${application.role || "Role"}`,
            }))}
            value={selectedPlacementStatus}
            onChange={(value) => setSelectedPlacementStatus(value || "")}
            placeholder="Select a rejected application"
          />
          <Textarea
            label="Reason"
            minRows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why the rejection should be reviewed."
          />
          <Button onClick={handleSubmit}>Submit Appeal</Button>
        </Stack>
      </Modal>
    </>
  );
}

export default PlacementAppealsPanel;
