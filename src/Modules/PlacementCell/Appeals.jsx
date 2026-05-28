/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Badge,
  Button,
  Loader,
  Modal,
  Textarea,
  Select,
  Group,
  Card,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost } from "./api.js";
import { appealsRoute } from "../../routes/placementCellRoutes/index.jsx";

const STATUS_COLORS = {
  PENDING: "blue",
  RESOLVED: "green",
  REJECTED: "red",
};

const APP_STATUS_CHOICES = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "REJECTED", label: "Rejected" },
];

export default function Appeals({ role }) {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);

  // Form State
  const [appealStatus, setAppealStatus] = useState("RESOLVED");
  const [remarks, setRemarks] = useState("");
  const [appStatus, setAppStatus] = useState("");

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const res = await apiGet(appealsRoute);
      setAppeals(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load appeals",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleResolve = async () => {
    if (!resolveModal) return;
    try {
      const payload = {
        status: appealStatus,
        remarks,
      };
      if (appStatus) {
        payload.application_status = appStatus;
      }

      await apiPost(`${appealsRoute}${resolveModal.id}/resolve/`, payload);
      notifications.show({
        title: "Success",
        message: "Appeal resolved",
        color: "green",
      });

      setResolveModal(null);
      setAppealStatus("RESOLVED");
      setRemarks("");
      setAppStatus("");
      fetchAppeals();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to resolve appeal",
        color: "red",
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <Text fw={600} size="xl" mb="md">
        Student Appeals
      </Text>

      {appeals.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">No appeals found.</Text>
        </Card>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student</Table.Th>
              <Table.Th>Company & Role</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Submitted</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Resolution Remarks</Table.Th>
              {role !== "student" && <Table.Th>Action</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {appeals.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>
                  <Text fw={500}>{a.student_name}</Text>
                  <Text size="xs" c="dimmed">
                    {a.student_roll}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {a.company_name} <br />
                  <Text size="xs" c="dimmed">
                    {a.job_title}
                  </Text>
                </Table.Td>
                <Table.Td style={{ maxWidth: 200, wordWrap: "break-word" }}>
                  {a.reason}
                </Table.Td>
                <Table.Td>
                  {new Date(
                    a.created_at || a.updated_at || Date.now(),
                  ).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLORS[a.status] || "gray"}>
                    {a.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {a.remarks ? (
                    <Text size="sm">{a.remarks}</Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  )}
                </Table.Td>
                {role !== "student" && (
                  <Table.Td>
                    {a.status === "PENDING" && (
                      <Button size="xs" onClick={() => setResolveModal(a)}>
                        Resolve
                      </Button>
                    )}
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={!!resolveModal}
        onClose={() => setResolveModal(null)}
        title="Resolve Appeal"
      >
        <Select
          label="Appeal Decision"
          data={[
            { value: "RESOLVED", label: "Accept Appeal (Resolved)" },
            { value: "REJECTED", label: "Reject Appeal" },
          ]}
          value={appealStatus}
          onChange={setAppealStatus}
          mb="sm"
        />
        <Select
          label="New Application Status (Optional)"
          description="Update the application status if the appeal is accepted"
          data={[{ value: "", label: "No Change" }, ...APP_STATUS_CHOICES]}
          value={appStatus}
          onChange={setAppStatus}
          clearable
          mb="sm"
        />
        <Textarea
          label="Remarks"
          placeholder="Feedback for the student..."
          minRows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setResolveModal(null)}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>Submit Resolution</Button>
        </Group>
      </Modal>
    </div>
  );
}
