/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  Button,
  Select,
  Modal,
  Stack,
  Textarea,
  Checkbox,
  Card,
  TextInput,
  NumberInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost } from "./api.js";
import {
  jobApplicationsRoute,
  jobPostingsRoute,
  jobOffersRoute,
} from "../../routes/placementCellRoutes/index.jsx";

const STATUS_CHOICES = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "OFFER_EXTENDED", label: "Offer Extended" },
  { value: "OFFER_ACCEPTED", label: "Offer Accepted" },
  { value: "OFFER_REJECTED", label: "Offer Rejected" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_COLORS = {
  APPLIED: "blue",
  SHORTLISTED: "teal",
  INTERVIEW_SCHEDULED: "orange",
  OFFER_EXTENDED: "violet",
  OFFER_ACCEPTED: "green",
  OFFER_REJECTED: "gray",
  REJECTED: "red",
};

export default function ManageApplications() {
  const [postings, setPostings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [checkedIds, setCheckedIds] = useState([]);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const [extendOfferModal, setExtendOfferModal] = useState(null);
  const [offerData, setOfferData] = useState({
    ctc_offered: 0,
    designation_offered: "",
    response_deadline: "",
    joining_date: "",
  });

  useEffect(() => {
    const fetchPostings = async () => {
      try {
        const res = await apiGet(jobPostingsRoute);
        const data = Array.isArray(res) ? res : res.results || [];
        setPostings(data);
        if (data.length > 0) {
          setSelected(data[0]);
        }
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to load postings",
          color: "red",
        });
      }
      setLoading(false);
    };
    fetchPostings();
  }, []);

  const fetchApplications = async (postingId) => {
    if (!postingId) return;
    setAppsLoading(true);
    try {
      const res = await apiGet(`${jobPostingsRoute}${postingId}/applications/`);
      setApplications(Array.isArray(res) ? res : []);
      setCheckedIds([]);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load applications",
        color: "red",
      });
      setApplications([]);
    }
    setAppsLoading(false);
  };

  useEffect(() => {
    if (selected) fetchApplications(selected.id);
  }, [selected?.id]);

  const filtered = statusFilter
    ? applications.filter((a) => a.status === statusFilter)
    : applications;

  const handleUpdateStatus = async () => {
    if (!statusModal || !newStatus) return;
    try {
      await apiPost(`${jobApplicationsRoute}${statusModal.id}/update_status/`, {
        status: newStatus,
        remarks,
      });
      notifications.show({
        title: "Success",
        message: "Status updated",
        color: "green",
      });
      setStatusModal(null);
      setNewStatus("");
      setRemarks("");
      fetchApplications(selected.id);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update",
        color: "red",
      });
    }
  };

  const handleExtendOffer = async () => {
    if (!extendOfferModal) return;
    if (!offerData.response_deadline || !offerData.ctc_offered) {
      notifications.show({
        title: "Validation Error",
        message: "Response deadline and CTC offered are required",
        color: "red",
      });
      return;
    }

    try {
      await apiPost(jobOffersRoute, {
        application: extendOfferModal.id,
        ...offerData,
      });

      // Update app status to "OFFER_EXTENDED" simultaneously
      await apiPost(
        `${jobApplicationsRoute}${extendOfferModal.id}/update_status/`,
        {
          status: "OFFER_EXTENDED",
          remarks: "Offer has been extended to the student.",
        },
      );

      notifications.show({
        title: "Success",
        message: "Offer extended successfully",
        color: "green",
      });

      setExtendOfferModal(null);
      setOfferData({
        ctc_offered: 0,
        designation_offered: "",
        response_deadline: "",
        joining_date: "",
      });
      fetchApplications(selected.id);
    } catch (err) {
      notifications.show({
        title: "Error",
        message:
          err.response?.data?.detail ||
          err.response?.data?.join(" ") ||
          "Failed to extend offer",
        color: "red",
      });
    }
  };

  const handleBulkShortlist = async () => {
    if (checkedIds.length === 0) return;
    try {
      await Promise.all(
        checkedIds.map((id) =>
          apiPost(`${jobApplicationsRoute}${id}/update_status/`, {
            status: "SHORTLISTED",
          }),
        ),
      );
      notifications.show({
        title: "Success",
        message: `${checkedIds.length} applications shortlisted`,
        color: "green",
      });
      setCheckedIds([]);
      fetchApplications(selected.id);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to bulk shortlist",
        color: "red",
      });
    }
  };

  const toggleCheck = (id) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    const appliedIds = filtered
      .filter((a) => a.status === "APPLIED")
      .map((a) => a.id);
    if (checkedIds.length === appliedIds.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(appliedIds);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Text fw={600} size="xl" mb="lg">
        Manage Applications
      </Text>

      <Group mb="md">
        <Select
          label="Select Job Posting"
          data={postings.map((p) => ({
            value: String(p.id),
            label: `${p.title} — ${p.company_name}`,
          }))}
          value={selected ? String(selected.id) : null}
          onChange={(val) =>
            setSelected(postings.find((p) => String(p.id) === val))
          }
          searchable
          w={400}
        />
        <Select
          label="Filter by Status"
          data={[{ value: "", label: "All" }, ...STATUS_CHOICES]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          w={200}
        />
      </Group>

      {selected && (
        <Card withBorder p="sm" mb="md">
          <Group justify="space-between">
            <Text fw={500}>
              {selected.title} — {selected.company_name}
            </Text>
            <Badge>{applications.length} applications</Badge>
          </Group>
        </Card>
      )}

      {appsLoading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader />
        </div>
      ) : filtered.length > 0 ? (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Checkbox
                    checked={
                      checkedIds.length > 0 &&
                      checkedIds.length ===
                        filtered.filter((a) => a.status === "APPLIED").length
                    }
                    onChange={toggleAll}
                  />
                </Table.Th>
                <Table.Th>Roll No</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Applied On</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((app) => (
                <Table.Tr key={app.id}>
                  <Table.Td>
                    {app.status === "APPLIED" && (
                      <Checkbox
                        checked={checkedIds.includes(app.id)}
                        onChange={() => toggleCheck(app.id)}
                      />
                    )}
                  </Table.Td>
                  <Table.Td>{app.student_roll}</Table.Td>
                  <Table.Td fw={500}>{app.student_name}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={STATUS_COLORS[app.status] || "gray"}
                      variant="light"
                    >
                      {STATUS_CHOICES.find((s) => s.value === app.status)
                        ?.label || app.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {new Date(app.applied_at).toLocaleDateString("en-IN")}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          setStatusModal(app);
                          setNewStatus(app.status);
                        }}
                      >
                        Update
                      </Button>
                      {(app.status === "SHORTLISTED" ||
                        app.status === "INTERVIEW_SCHEDULED") && (
                        <Button
                          size="xs"
                          color="violet"
                          variant="light"
                          onClick={() => {
                            setExtendOfferModal(app);
                            setOfferData({
                              ...offerData,
                              ctc_offered: selected.ctc || 0,
                            });
                          }}
                        >
                          Extend Offer
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {checkedIds.length > 0 && (
            <Button mt="md" color="teal" onClick={handleBulkShortlist}>
              ✓ Bulk Shortlist Selected ({checkedIds.length})
            </Button>
          )}
        </>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No applications found.
        </Text>
      )}

      <Modal
        opened={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update Application Status"
        centered
      >
        <Stack>
          <Select
            label="New Status"
            data={STATUS_CHOICES}
            value={newStatus}
            onChange={setNewStatus}
          />
          <Textarea
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
          />
          <Button onClick={handleUpdateStatus} fullWidth>
            Update
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!extendOfferModal}
        onClose={() => setExtendOfferModal(null)}
        title="Extend Job Offer"
        centered
        size="md"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Extending offer to{" "}
            <Text span fw={600} c="dark">
              {extendOfferModal?.student_name}
            </Text>{" "}
            for{" "}
            <Text span fw={600} c="dark">
              {selected?.title}
            </Text>
          </Text>

          <Group grow>
            <NumberInput
              label="CTC Offered (LPA)"
              required
              value={offerData.ctc_offered}
              onChange={(val) =>
                setOfferData({ ...offerData, ctc_offered: val })
              }
              min={0}
              decimalScale={2}
            />
            <TextInput
              label="Designation Offered"
              placeholder="e.g. SDE-1"
              value={offerData.designation_offered}
              onChange={(e) =>
                setOfferData({
                  ...offerData,
                  designation_offered: e.target.value,
                })
              }
            />
          </Group>

          <Group grow>
            <TextInput
              label="Response Deadline"
              required
              type="datetime-local"
              value={offerData.response_deadline}
              onChange={(e) =>
                setOfferData({
                  ...offerData,
                  response_deadline: e.target.value,
                })
              }
            />
            <TextInput
              label="Joining Date"
              type="date"
              value={offerData.joining_date}
              onChange={(e) =>
                setOfferData({ ...offerData, joining_date: e.target.value })
              }
            />
          </Group>

          <Button onClick={handleExtendOffer} fullWidth color="violet" mt="sm">
            Confirm & Extend Offer
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
