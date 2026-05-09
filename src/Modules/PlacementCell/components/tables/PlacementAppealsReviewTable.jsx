import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";

function PlacementAppealsReviewTable() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [statuses, setStatuses] = useState({});

  const getErrorMessage = (error) => {
    const data = error.response?.data;

    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail;
    }

    if (Array.isArray(data?.status) && data.status.length) {
      return data.status.join(", ");
    }

    if (Array.isArray(data?.response) && data.response.length) {
      return data.response.join(", ");
    }

    return "Failed to update appeal.";
  };

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const response = await placementApi.getPlacementAppeals();
      setAppeals(response.data || []);
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
    loadAppeals();
  }, []);

  const handleUpdate = async (appeal) => {
    try {
      await placementApi.updatePlacementAppeal(appeal.id, {
        status: statuses[appeal.id] ?? appeal.status ?? "reviewed",
        response: notes[appeal.id] ?? appeal.response ?? "",
      });
      notifications.show({
        title: "Success",
        message: "Appeal updated successfully.",
        color: "green",
      });
      await loadAppeals();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error),
        color: "red",
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack>
      <Title order={2}>Placement Appeals</Title>
      {appeals.length ? (
        appeals.map((appeal) => (
          <Card key={appeal.id} withBorder radius="md">
            <Stack gap="sm">
              <Text fw={700}>
                {appeal.student.roll_no} - {appeal.student.name}
              </Text>
              <Text size="sm">Company: {appeal.company_name}</Text>
              <Text size="sm">Reason: {appeal.reason}</Text>
              <Text size="sm">
                Due by: {new Date(appeal.due_by).toLocaleString()}
              </Text>
              <Select
                label="Status"
                data={[
                  { value: "pending", label: "Pending" },
                  { value: "reviewed", label: "Reviewed" },
                  { value: "accepted", label: "Accepted" },
                  { value: "rejected", label: "Rejected" },
                ]}
                value={statuses[appeal.id] || appeal.status}
                onChange={(value) =>
                  setStatuses((prev) => ({
                    ...prev,
                    [appeal.id]: value || appeal.status,
                  }))
                }
              />
              <Textarea
                label="Response"
                minRows={3}
                value={notes[appeal.id] ?? appeal.response ?? ""}
                onChange={(event) =>
                  setNotes((prev) => ({
                    ...prev,
                    [appeal.id]: event.target.value,
                  }))
                }
              />
              <Group>
                <Button onClick={() => handleUpdate(appeal)}>
                  Save Decision
                </Button>
              </Group>
            </Stack>
          </Card>
        ))
      ) : (
        <Alert color="yellow" title="No Appeals">
          No placement appeals are pending review.
        </Alert>
      )}
    </Stack>
  );
}

export default PlacementAppealsReviewTable;
