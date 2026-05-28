/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Text,
  Table,
  Badge,
  Group,
  Loader,
  Card,
  Button,
  Modal,
  Textarea,
  Anchor,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiDelete, apiPost } from "./api.js";
import {
  mySummaryRoute,
  jobApplicationsRoute,
  appealsRoute,
} from "../../routes/placementCellRoutes/index.jsx";

const STATUS_COLORS = {
  APPLIED: "blue",
  SHORTLISTED: "teal",
  INTERVIEW_SCHEDULED: "orange",
  OFFER_EXTENDED: "violet",
  OFFER_ACCEPTED: "green",
  OFFER_REJECTED: "gray",
  REJECTED: "red",
};

const STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview",
  OFFER_EXTENDED: "Offer Extended",
  OFFER_ACCEPTED: "Accepted",
  OFFER_REJECTED: "Offer Rejected",
  REJECTED: "Rejected",
};

/**
 * Format a compensation amount according to the provided compensation type.
 *  - LPA              -> "₹6 LPA"
 *  - STIPEND_PER_MONTH -> "₹40,000/month"
 */
const formatCompensation = (amount, compensationType = "LPA") => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  if (compensationType === "STIPEND_PER_MONTH") {
    return `₹${n.toLocaleString("en-IN")}/month`;
  }
  return `₹${n} LPA`;
};

/**
 * Pick the relevant compensation for a row, preferring (in order):
 *   1. Accepted/extended offer's CTC
 *   2. Role-specific CTC
 *   3. Posting-level CTC
 * Returns { amount, type, source } where source explains the origin.
 */
const pickCompensation = (app) => {
  if (app.offer_ctc) {
    // Offer compensation type follows the posting's interpretation.
    return {
      amount: app.offer_ctc,
      type: app.posting_compensation_type || "LPA",
      source: "offer",
    };
  }
  if (app.role_ctc) {
    return {
      amount: app.role_ctc,
      type:
        app.role_compensation_type || app.posting_compensation_type || "LPA",
      source: "role",
    };
  }
  return {
    amount: app.posting_ctc,
    type: app.posting_compensation_type || "LPA",
    source: "posting",
  };
};

function StatMini({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <Text size="1.8rem" fw={700} c={color}>
        {value ?? 0}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </div>
  );
}

export default function MyApplications() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appealModal, setAppealModal] = useState(null);
  const [appealReason, setAppealReason] = useState("");

  const fetchData = async () => {
    try {
      const res = await apiGet(mySummaryRoute);
      setData(res);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load applications",
        color: "red",
      });
    }
    setLoading(false);
  };

  const handleAppealSubmit = async () => {
    if (!appealReason.trim()) {
      notifications.show({
        title: "Error",
        message: "Please provide a reason",
        color: "red",
      });
      return;
    }
    try {
      await apiPost(appealsRoute, {
        application: appealModal,
        reason: appealReason,
      });
      notifications.show({
        title: "Success",
        message: "Appeal submitted successfully",
        color: "green",
      });
      setAppealModal(null);
      setAppealReason("");
      fetchData(); // Refresh to catch any state changes
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to submit appeal",
        color: "red",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (applicationId) => {
    if (
      !window.confirm("Are you sure you want to withdraw this application?")
    ) {
      return;
    }
    try {
      await apiDelete(`${jobApplicationsRoute}${applicationId}/`);
      notifications.show({
        title: "Success",
        message: "Application withdrawn successfully",
        color: "green",
      });
      fetchData(); // Refresh the list
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to withdraw application",
        color: "red",
      });
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  if (!data)
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <Text c="dimmed">Failed to load data.</Text>
      </div>
    );

  return (
    <div>
      <Text fw={600} size="xl" mb="sm">
        My Applications
      </Text>
      <Text size="sm" c="dimmed" mb="lg">
        Track your placement application status
      </Text>

      <Card shadow="xs" padding="lg" radius="md" withBorder mb="lg">
        <Group justify="center" gap="xl">
          <StatMini label="Total" value={data.total} color="dark" />
          <StatMini label="Applied" value={data.applied} color="blue" />
          <StatMini label="Shortlisted" value={data.shortlisted} color="teal" />
          <StatMini
            label="Interview"
            value={data.interview_scheduled}
            color="orange"
          />
          <StatMini label="Offer" value={data.offer_extended} color="violet" />
          <StatMini
            label="Accepted"
            value={data.offer_accepted}
            color="green"
          />
        </Group>
      </Card>

      {data.applications?.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Company</Table.Th>
              <Table.Th>Position</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Compensation</Table.Th>
              <Table.Th>JD</Table.Th>
              <Table.Th>Applied On</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Remarks</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.applications.map((app) => {
              const comp = pickCompensation(app);
              const compLabel = formatCompensation(comp.amount, comp.type);
              const isInternship = app.posting_job_type === "INTERNSHIP";
              return (
                <Table.Tr key={app.id}>
                  <Table.Td fw={500}>{app.company_name}</Table.Td>
                  <Table.Td>
                    {app.job_title}
                    {app.role_title ? (
                      <Text size="xs" c="dimmed">
                        {app.role_title}
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">
                      {app.posting_job_type || "—"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip
                      label={
                        comp.source === "offer"
                          ? "Final offered amount"
                          : comp.source === "role"
                            ? "Role-specific compensation"
                            : "Posting compensation"
                      }
                    >
                      <span>
                        <Text
                          size="sm"
                          fw={comp.source === "offer" ? 600 : 500}
                        >
                          {compLabel}
                        </Text>
                        {isInternship &&
                          app.posting_internship_duration_months && (
                            <Text size="xs" c="dimmed">
                              {app.posting_internship_duration_months} mo
                            </Text>
                          )}
                      </span>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    {app.posting_jd_link ? (
                      <Anchor
                        href={app.posting_jd_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                      >
                        Open ↗
                      </Anchor>
                    ) : (
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {new Date(app.applied_at).toLocaleDateString("en-IN")}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={STATUS_COLORS[app.status] || "gray"}
                      variant="light"
                    >
                      {STATUS_LABELS[app.status] || app.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{app.remarks || "-"}</Table.Td>
                  <Table.Td>
                    {app.status === "APPLIED" ? (
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => handleWithdraw(app.id)}
                      >
                        Withdraw
                      </Button>
                    ) : app.status === "REJECTED" ? (
                      <Button
                        size="xs"
                        color="orange"
                        variant="light"
                        onClick={() => setAppealModal(app.id)}
                      >
                        Appeal
                      </Button>
                    ) : (
                      <Text size="xs" c="dimmed">
                        N/A
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      ) : (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed" mb="sm">
            You haven't applied for any positions yet.
          </Text>
          <Button variant="light">Browse Job Postings</Button>
        </Card>
      )}

      <Modal
        opened={!!appealModal}
        onClose={() => setAppealModal(null)}
        title="Submit Appeal against Rejection"
      >
        <Textarea
          label="Appeal Reason"
          placeholder="Explain why you are appealing this rejection..."
          value={appealReason}
          onChange={(e) => setAppealReason(e.currentTarget.value)}
          minRows={4}
          mb="md"
        />
        <Button onClick={handleAppealSubmit} fullWidth>
          Submit Appeal
        </Button>
      </Modal>
    </div>
  );
}
