import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";

function AlumniVerificationTable() {
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState({});

  const loadQueue = async () => {
    try {
      const response = await placementApi.getAlumniVerificationQueue();
      setRows(response.data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load alumni verification queue.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const updateStatus = async (profileId, status) => {
    try {
      await placementApi.updateAlumniVerification(profileId, {
        status,
        verification_notes: notes[profileId] || "",
      });
      notifications.show({
        title: "Updated",
        message: `Alumni request ${status}.`,
        color: "green",
      });
      loadQueue();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not update alumni verification status.",
        color: "red",
      });
    }
  };

  return (
    <Card shadow="sm" radius="md" padding="lg">
      <Stack>
        <div>
          <Title order={2}>Alumni Verification Queue</Title>
          <Text c="dimmed" size="sm">
            Review alumni documents and approve access before they can mentor,
            refer jobs, or network with students.
          </Text>
        </div>

        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Graduation</Table.Th>
              <Table.Th>Company</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Notes</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text fw={600}>{row.full_name}</Text>
                  <Text size="sm" c="dimmed">
                    {row.email}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {row.degree} ({row.graduation_year})
                </Table.Td>
                <Table.Td>{row.current_company || "N/A"}</Table.Td>
                <Table.Td>{row.status}</Table.Td>
                <Table.Td>
                  <Textarea
                    placeholder="Verification notes"
                    value={notes[row.id] ?? row.verification_notes ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [row.id]: e.target.value,
                      }))
                    }
                    minRows={2}
                  />
                </Table.Td>
                <Table.Td>
                  <Group>
                    <Button
                      size="xs"
                      color="green"
                      onClick={() => updateStatus(row.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      onClick={() => updateStatus(row.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}

export default AlumniVerificationTable;
