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
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { placementApi } from "../../services/api";

function AlumniMentorshipSessions() {
  const role = useSelector((state) => state.user.role);
  const [sessions, setSessions] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [requestForm, setRequestForm] = useState({
    topic: "",
    agenda: "",
    scheduled_at: null,
    mode: "online",
    student_message: "",
  });
  const [updates, setUpdates] = useState({});

  const loadData = async () => {
    try {
      const [sessionResponse, directoryResponse] = await Promise.all([
        placementApi.getAlumniSessions(),
        placementApi.getAlumniDirectory({ mentors_only: true }),
      ]);
      setSessions(sessionResponse.data);
      setDirectory(
        directoryResponse.data.filter((item) => item.mentorship_enabled),
      );
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not load mentorship sessions.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const requestSession = async () => {
    try {
      await placementApi.createAlumniSession({
        alumni_id: selectedAlumni.id,
        ...requestForm,
        scheduled_at: requestForm.scheduled_at
          ? new Date(requestForm.scheduled_at).toISOString()
          : "",
      });
      notifications.show({
        title: "Requested",
        message: "Mentorship request sent successfully.",
        color: "green",
      });
      setSelectedAlumni(null);
      setRequestForm({
        topic: "",
        agenda: "",
        scheduled_at: null,
        mode: "online",
        student_message: "",
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail || "Could not request mentorship.",
        color: "red",
      });
    }
  };

  const updateSession = async (sessionId) => {
    try {
      const payload = updates[sessionId] || {};
      await placementApi.updateAlumniSession(sessionId, payload);
      notifications.show({
        title: "Updated",
        message: "Mentorship session updated.",
        color: "green",
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not update mentorship session.",
        color: "red",
      });
    }
  };

  return (
    <Stack>
      {role === "student" ? (
        <Card shadow="sm" radius="md" padding="lg">
          <Stack>
            <Title order={2}>Request Mentorship</Title>
            <Group>
              {directory.map((item) => (
                <Button
                  key={item.id}
                  variant="light"
                  onClick={() => setSelectedAlumni(item)}
                >
                  {item.full_name}
                </Button>
              ))}
            </Group>
          </Stack>
        </Card>
      ) : null}

      <Card shadow="sm" radius="md" padding="lg">
        <Stack>
          <Title order={2}>Mentorship Sessions</Title>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Alumni</Table.Th>
                <Table.Th>Schedule</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Communication</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.topic}</Table.Td>
                  <Table.Td>{row.student.name}</Table.Td>
                  <Table.Td>{row.alumni.full_name}</Table.Td>
                  <Table.Td>{row.scheduled_at}</Table.Td>
                  <Table.Td>{row.status}</Table.Td>
                  <Table.Td>
                    {role === "alumni" ? (
                      <Stack gap="xs">
                        <TextInput
                          placeholder="Meeting link"
                          value={
                            updates[row.id]?.meeting_link ?? row.meeting_link
                          }
                          onChange={(e) =>
                            setUpdates((prev) => ({
                              ...prev,
                              [row.id]: {
                                ...prev[row.id],
                                meeting_link: e.target.value,
                              },
                            }))
                          }
                        />
                        <TextInput
                          placeholder="Status"
                          value={updates[row.id]?.status ?? row.status}
                          onChange={(e) =>
                            setUpdates((prev) => ({
                              ...prev,
                              [row.id]: {
                                ...prev[row.id],
                                status: e.target.value,
                              },
                            }))
                          }
                        />
                        <Textarea
                          placeholder="Reply to student"
                          value={
                            updates[row.id]?.alumni_message ??
                            row.alumni_message
                          }
                          onChange={(e) =>
                            setUpdates((prev) => ({
                              ...prev,
                              [row.id]: {
                                ...prev[row.id],
                                alumni_message: e.target.value,
                              },
                            }))
                          }
                          minRows={2}
                        />
                        <Button size="xs" onClick={() => updateSession(row.id)}>
                          Update
                        </Button>
                      </Stack>
                    ) : (
                      <Stack gap="xs">
                        <Text size="sm">
                          Student note: {row.student_message || "N/A"}
                        </Text>
                        <Text size="sm">
                          Alumni note: {row.alumni_message || "N/A"}
                        </Text>
                        <Text size="sm">
                          Link: {row.meeting_link || "Pending"}
                        </Text>
                      </Stack>
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
        title={`Request mentorship with ${selectedAlumni?.full_name || ""}`}
      >
        <Stack>
          <TextInput
            label="Topic"
            value={requestForm.topic}
            onChange={(e) =>
              setRequestForm((prev) => ({ ...prev, topic: e.target.value }))
            }
          />
          <Textarea
            label="Agenda"
            value={requestForm.agenda}
            onChange={(e) =>
              setRequestForm((prev) => ({ ...prev, agenda: e.target.value }))
            }
            minRows={3}
          />
          <DateTimePicker
            label="Preferred Time"
            value={requestForm.scheduled_at}
            onChange={(value) =>
              setRequestForm((prev) => ({ ...prev, scheduled_at: value }))
            }
          />
          <TextInput
            label="Mode"
            value={requestForm.mode}
            onChange={(e) =>
              setRequestForm((prev) => ({ ...prev, mode: e.target.value }))
            }
          />
          <Textarea
            label="Message"
            value={requestForm.student_message}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                student_message: e.target.value,
              }))
            }
            minRows={3}
          />
          <Group justify="flex-end">
            <Button onClick={requestSession}>Request Session</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default AlumniMentorshipSessions;
