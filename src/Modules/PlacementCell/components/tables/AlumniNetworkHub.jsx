import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { placementApi } from "../../services/api";

function AlumniNetworkHub() {
  const role = useSelector((state) => state.user.role);
  const [directory, setDirectory] = useState([]);
  const [connections, setConnections] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [directoryResponse, connectionResponse] = await Promise.all([
        placementApi.getAlumniDirectory({ query, mentors_only: true }),
        placementApi.getAlumniConnections(),
      ]);
      setDirectory(directoryResponse.data);
      setConnections(connectionResponse.data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not load alumni networking data.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [query]);

  const requestConnection = async () => {
    try {
      await placementApi.createAlumniConnection({
        alumni_id: selectedAlumni.id,
        message,
      });
      notifications.show({
        title: "Request Sent",
        message: "Your connection request was sent to the alumni.",
        color: "green",
      });
      setSelectedAlumni(null);
      setMessage("");
      loadData();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail || "Could not send connection request.",
        color: "red",
      });
    }
  };

  const respondToConnection = async (connectionId, status) => {
    try {
      await placementApi.updateAlumniConnection(connectionId, { status });
      notifications.show({
        title: "Updated",
        message: `Connection marked ${status}.`,
        color: "green",
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not update connection.",
        color: "red",
      });
    }
  };

  return (
    <Stack>
      <Card shadow="sm" radius="md" padding="lg">
        <Stack>
          <div>
            <Title order={2}>Alumni Network</Title>
            <Text c="dimmed" size="sm">
              Browse approved alumni mentors and manage student-alumni
              connection requests.
            </Text>
          </div>
          <TextInput
            label="Search Alumni"
            placeholder="Search by name, company, or topic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Current Role</Table.Th>
                <Table.Th>Topics</Table.Th>
                <Table.Th>Availability</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {directory.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text fw={600}>{row.full_name}</Text>
                    <Text size="sm" c="dimmed">
                      {row.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {row.current_designation || "Professional"} at{" "}
                    {row.current_company || "N/A"}
                  </Table.Td>
                  <Table.Td>{(row.topics || []).join(", ") || "N/A"}</Table.Td>
                  <Table.Td>{row.availability || "Not shared"}</Table.Td>
                  <Table.Td>
                    {role === "student" ? (
                      <Button
                        size="xs"
                        onClick={() => setSelectedAlumni(row)}
                        disabled={!row.mentorship_enabled}
                      >
                        Connect
                      </Button>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Directory view
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      <Card shadow="sm" radius="md" padding="lg">
        <Stack>
          <Title order={3}>
            {role === "student"
              ? "My Connection Requests"
              : "Student Network Requests"}
          </Title>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Alumni</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Message</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {connections.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.alumni.full_name}</Table.Td>
                  <Table.Td>{row.student.name}</Table.Td>
                  <Table.Td>{row.status}</Table.Td>
                  <Table.Td>{row.message || "N/A"}</Table.Td>
                  <Table.Td>
                    {role === "alumni" && row.status === "pending" ? (
                      <Group>
                        <Button
                          size="xs"
                          color="green"
                          onClick={() =>
                            respondToConnection(row.id, "connected")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() =>
                            respondToConnection(row.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {row.status}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      <Modal
        opened={Boolean(selectedAlumni)}
        onClose={() => setSelectedAlumni(null)}
        title={`Connect with ${selectedAlumni?.full_name || "alumni"}`}
      >
        <Stack>
          <Textarea
            label="Introduction Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minRows={3}
          />
          <Group justify="flex-end">
            <Button onClick={requestConnection}>Send Request</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default AlumniNetworkHub;
