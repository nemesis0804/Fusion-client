/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Text,
  Table,
  Badge,
  Group,
  Loader,
  Card,
  
  Button
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet } from "../api";
import { mySummaryRoute } from "../../../routes/placementCellRoutes";

const STATUS_COLORS = {
  APPLIED: "blue",
  SHORTLISTED: "teal",
  INTERVIEW_SCHEDULED: "orange",
  OFFER_EXTENDED: "violet",
  OFFER_ACCEPTED: "green",
  OFFER_REJECTED: "gray",
  REJECTED: "red"
};

const STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview",
  OFFER_EXTENDED: "Offer Extended",
  OFFER_ACCEPTED: "Accepted",
  OFFER_REJECTED: "Offer Rejected",
  REJECTED: "Rejected"
};

function StatMini({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <Text size="1.8rem" fw={700} c={color}>{value ?? 0}</Text>
      <Text size="xs" c="dimmed">{label}</Text>
    </div>
  );
}

export default function MyApplications() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGet(mySummaryRoute);
        setData(res);
      } catch {
        notifications.show({ title: "Error", message: "Failed to load applications", color: "red" });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}><Loader /></div>;

  if (!data) return <div style={{ padding: "3rem", textAlign: "center" }}><Text c="dimmed">Failed to load data.</Text></div>;

  return (
    <div>
      <Text fw={600} size="xl" mb="sm">My Applications</Text>
      <Text size="sm" c="dimmed" mb="lg">Track your placement application status</Text>

      <Card shadow="xs" padding="lg" radius="md" withBorder mb="lg">
        <Group justify="center" gap="xl">
          <StatMini label="Total" value={data.total} color="dark" />
          <StatMini label="Applied" value={data.applied} color="blue" />
          <StatMini label="Shortlisted" value={data.shortlisted} color="teal" />
          <StatMini label="Interview" value={data.interview_scheduled} color="orange" />
          <StatMini label="Offer" value={data.offer_extended} color="violet" />
          <StatMini label="Accepted" value={data.offer_accepted} color="green" />
        </Group>
      </Card>

      {data.applications?.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Company</Table.Th>
              <Table.Th>Position</Table.Th>
              <Table.Th>CTC (LPA)</Table.Th>
              <Table.Th>Applied On</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Remarks</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.applications.map((app) => (
              <Table.Tr key={app.id}>
                <Table.Td fw={500}>{app.company_name}</Table.Td>
                <Table.Td>{app.job_title}</Table.Td>
                <Table.Td>₹{app.job_posting?.ctc || "-"}</Table.Td>
                <Table.Td>{new Date(app.applied_at).toLocaleDateString("en-IN")}</Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLORS[app.status] || "gray"} variant="light">
                    {STATUS_LABELS[app.status] || app.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{app.remarks || "-"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed" mb="sm">You haven't applied for any positions yet.</Text>
          <Button variant="light">Browse Job Postings</Button>
        </Card>
      )}
    </div>
  );
}
