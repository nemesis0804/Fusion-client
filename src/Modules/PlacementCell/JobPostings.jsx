/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  Grid,
  Text,
  Badge,
  Group,
  Loader,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  Stack,
  Table,
  Divider,
  Pagination,
  Switch,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiPatch } from "./api.js";
import {
  jobPostingsRoute,
  companiesRoute,
} from "../../routes/placementCellRoutes/index.jsx";

function JobCard({ posting, onViewDetail }) {
  const isActive = posting.is_active;
  const deadline = posting.application_deadline
    ? new Date(posting.application_deadline)
    : null;
  const deadlinePassed = deadline && deadline < new Date();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text
          fw={600}
          size="lg"
          style={{ cursor: "pointer" }}
          onClick={() => onViewDetail(posting)}
        >
          {posting.title}
        </Text>
        <Group gap={4}>
          {isActive && !deadlinePassed && (
            <Badge color="green" variant="light">
              Active
            </Badge>
          )}
          {deadlinePassed && (
            <Badge color="red" variant="light">
              Deadline Passed
            </Badge>
          )}
          {!isActive && (
            <Badge color="gray" variant="light">
              Inactive
            </Badge>
          )}
          <Badge variant="outline" color="violet">
            {posting.job_type}
          </Badge>
        </Group>
      </Group>

      <Text size="sm" c="dimmed" mb="xs">
        {posting.company_name}
        {posting.location && ` • ${posting.location}`}
      </Text>

      <Group gap="lg" mb="sm">
        <div>
          <Text size="xs" c="dimmed">
            CTC
          </Text>
          <Text size="sm" fw={600}>
            ₹{posting.ctc} LPA
          </Text>
        </div>
        {deadline && (
          <div>
            <Text size="xs" c="dimmed">
              Deadline
            </Text>
            <Text size="sm" fw={500}>
              {deadline.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </div>
        )}
        {posting.total_applications !== undefined && (
          <div>
            <Text size="xs" c="dimmed">
              Applications
            </Text>
            <Text size="sm" fw={500}>
              {posting.total_applications}
            </Text>
          </div>
        )}
      </Group>

      <Group>
        <Button size="xs" variant="light" onClick={() => onViewDetail(posting)}>
          View Details
        </Button>
      </Group>
    </Card>
  );
}

function JobDetailModal({ posting, opened, onClose, role, onJobUpdate }) {
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [applying, setApplying] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const res = await apiGet(
        `${jobPostingsRoute}${posting.id}/check_eligibility/`,
      );
      setEligibility(res);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to check eligibility",
        color: "red",
      });
    }
    setCheckingEligibility(false);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await apiPost(`${jobPostingsRoute}${posting.id}/apply/`, {});
      notifications.show({
        title: "Success",
        message: "Applied successfully!",
        color: "green",
      });
      setEligibility((prev) =>
        prev ? { ...prev, already_applied: true } : prev,
      );
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to apply";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
    setApplying(false);
  };

  const handleToggleStatus = async () => {
    setUpdating(true);
    try {
      const newStatus = !posting.is_active;
      await apiPatch(`${jobPostingsRoute}${posting.id}/`, {
        is_active: newStatus,
      });
      notifications.show({
        title: "Success",
        message: `Job posting marked as ${newStatus ? "Active" : "Closed"}`,
        color: "green",
      });
      if (onJobUpdate) onJobUpdate();
      onClose();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.detail || "Failed to update status",
        color: "red",
      });
    }
    setUpdating(false);
  };

  useEffect(() => {
    if (opened && posting && role === "student") {
      checkEligibility();
    }
  }, [opened, posting?.id]);

  if (!posting) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={posting.title}
      size="xl"
      centered
    >
      <Grid gutter="lg">
        <Grid.Col span={6}>
          <Text fw={600} mb="xs">
            Job Details
          </Text>
          <Table withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Company</Table.Td>
                <Table.Td>{posting.company_name}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Type</Table.Td>
                <Table.Td>
                  <Badge variant="light">{posting.job_type}</Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>CTC</Table.Td>
                <Table.Td fw={600}>₹{posting.ctc} LPA</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Location</Table.Td>
                <Table.Td>{posting.location || "-"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Deadline</Table.Td>
                <Table.Td>
                  {posting.application_deadline
                    ? new Date(posting.application_deadline).toLocaleString(
                        "en-IN",
                      )
                    : "-"}
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text fw={600} mb="xs">
            Eligibility Criteria
          </Text>
          <Table withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Min CPI</Table.Td>
                <Table.Td>{posting.min_cpi || "N/A"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Programmes</Table.Td>
                <Table.Td>{posting.eligible_programmes || "All"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Branches</Table.Td>
                <Table.Td>{posting.eligible_branches || "All"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Backlog</Table.Td>
                <Table.Td>
                  {posting.backlog_allowed ? "Allowed" : "Not allowed"}
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Grid.Col>
      </Grid>

      {posting.description && (
        <>
          <Divider my="md" />
          <Text fw={600} mb="xs">
            Description
          </Text>
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {posting.description}
          </Text>
        </>
      )}

      {posting.bond_details && (
        <>
          <Text fw={600} mt="md" mb="xs">
            Bond Details
          </Text>
          <Text size="sm">{posting.bond_details}</Text>
        </>
      )}

      {role === "student" && (
        <>
          <Divider my="md" />
          {checkingEligibility ? (
            <Group>
              <Loader size="sm" />
              <Text size="sm">Checking eligibility...</Text>
            </Group>
          ) : eligibility ? (
            eligibility.already_applied ? (
              <Card withBorder p="sm" bg="blue.0">
                <Text size="sm" fw={500}>
                  ✓ You have already applied for this position.
                </Text>
              </Card>
            ) : eligibility.eligible ? (
              <Stack>
                <Card withBorder p="sm" bg="green.0">
                  <Text size="sm" fw={500} c="green">
                    ✓ You are eligible to apply!
                  </Text>
                </Card>
                <Button onClick={handleApply} loading={applying}>
                  Apply Now
                </Button>
              </Stack>
            ) : (
              <Card withBorder p="sm" bg="red.0">
                <Text size="sm" fw={500} c="red">
                  ✗ Not Eligible
                </Text>
                <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
                  {eligibility.reasons?.map((r, i) => (
                    <li key={i}>
                      <Text size="xs">{r}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          ) : null}
        </>
      )}

      {(role === "placement officer" || role === "placement chairman") && (
        <Group mt="xl" justify="flex-end">
          <Button
            color={posting.is_active ? "red" : "green"}
            onClick={handleToggleStatus}
            loading={updating}
          >
            {posting.is_active ? "Close Job Posting" : "Re-open Job Posting"}
          </Button>
        </Group>
      )}
    </Modal>
  );
}

function CreateJobModal({ opened, onClose, onSuccess }) {
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    company: "",
    title: "",
    description: "",
    job_type: "PLACEMENT",
    location: "",
    ctc: 0,
    min_cpi: 0,
    backlog_allowed: true,
    eligible_programmes: "",
    eligible_branches: "",
    application_deadline: "",
    bond_details: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) {
      apiGet(companiesRoute)
        .then((res) => {
          setCompanies(Array.isArray(res) ? res : res.results || []);
        })
        .catch(() => {});
    }
  }, [opened]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiPost(jobPostingsRoute, formData);
      notifications.show({
        title: "Success",
        message: "Job posting created",
        color: "green",
      });
      onSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.detail || "Failed to create posting",
        color: "red",
      });
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Job Posting"
      size="xl"
      centered
    >
      <Stack>
        <Group grow>
          <Select
            label="Company"
            required
            data={companies.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            value={formData.company}
            onChange={(val) => setFormData({ ...formData, company: val })}
            searchable
          />
          <TextInput
            label="Job Title"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </Group>
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
        />
        <Group grow>
          <Select
            label="Job Type"
            data={["PLACEMENT", "INTERNSHIP", "PPO"]}
            value={formData.job_type}
            onChange={(val) => setFormData({ ...formData, job_type: val })}
          />
          <TextInput
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
          <NumberInput
            label="CTC (LPA)"
            required
            value={formData.ctc}
            onChange={(val) => setFormData({ ...formData, ctc: val })}
            min={0}
            decimalScale={2}
          />
        </Group>

        <Divider label="Eligibility Criteria" />

        <Group grow>
          <NumberInput
            label="Min CPI"
            value={formData.min_cpi}
            onChange={(val) => setFormData({ ...formData, min_cpi: val })}
            min={0}
            max={10}
            decimalScale={1}
          />
          <Switch
            label="Backlog Allowed"
            checked={formData.backlog_allowed}
            onChange={(e) =>
              setFormData({
                ...formData,
                backlog_allowed: e.currentTarget.checked,
              })
            }
            mt={24}
          />
        </Group>
        <Group grow>
          <TextInput
            label="Eligible Programmes"
            placeholder="e.g. B.Tech, M.Tech"
            value={formData.eligible_programmes}
            onChange={(e) =>
              setFormData({ ...formData, eligible_programmes: e.target.value })
            }
          />
          <TextInput
            label="Eligible Branches"
            placeholder="e.g. CSE, ECE, ME"
            value={formData.eligible_branches}
            onChange={(e) =>
              setFormData({ ...formData, eligible_branches: e.target.value })
            }
          />
        </Group>
        <Group grow>
          <TextInput
            label="Application Deadline"
            type="datetime-local"
            required
            value={formData.application_deadline}
            onChange={(e) =>
              setFormData({ ...formData, application_deadline: e.target.value })
            }
          />
          <TextInput
            label="Bond Details"
            value={formData.bond_details}
            onChange={(e) =>
              setFormData({ ...formData, bond_details: e.target.value })
            }
          />
        </Group>
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Create Job Posting
        </Button>
      </Stack>
    </Modal>
  );
}

export default function JobPostings({ role }) {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 9;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet(jobPostingsRoute);
      setPostings(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch postings",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  const filteredPostings = postings.filter((p) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !p.title?.toLowerCase().includes(q) &&
        !p.company_name?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    // Job Type
    if (filterType !== "ALL" && p.job_type !== filterType) {
      return false;
    }
    // Status
    if (filterStatus !== "ALL") {
      const deadline = p.application_deadline
        ? new Date(p.application_deadline)
        : null;
      const deadlinePassed = !!(deadline && deadline < new Date());
      if (filterStatus === "ACTIVE") {
        if (!p.is_active || deadlinePassed) return false;
      } else if (filterStatus === "DEADLINE_PASSED") {
        if (!deadlinePassed) return false;
      } else if (filterStatus === "INACTIVE") {
        if (p.is_active) return false;
      }
    }
    return true;
  });

  const paged = filteredPostings.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterType, filterStatus]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Text fw={600} size="xl">
          Job Postings
        </Text>
        {isOfficer && (
          <Button onClick={() => setCreateOpen(true)}>
            + Create Job Posting
          </Button>
        )}
      </Group>

      <Group grow mb="xl">
        <TextInput
          placeholder="Search by title or company..."
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Select
          label="Job Type"
          data={[
            { value: "ALL", label: "All Types" },
            { value: "PLACEMENT", label: "Placement" },
            { value: "INTERNSHIP", label: "Internship" },
            { value: "PPO", label: "PPO" },
            { value: "PBI", label: "PBI" },
          ]}
          value={filterType}
          onChange={setFilterType}
        />
        <Select
          label="Status"
          data={[
            { value: "ALL", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "DEADLINE_PASSED", label: "Deadline Passed" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </Group>

      {filteredPostings.length > 0 ? (
        <>
          <Grid gutter="lg">
            {paged.map((p) => (
              <Grid.Col key={p.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <JobCard
                  posting={p}
                  role={role}
                  onViewDetail={(posting) => {
                    setSelectedPosting(posting);
                    setDetailOpen(true);
                  }}
                />
              </Grid.Col>
            ))}
          </Grid>
          {filteredPostings.length > perPage && (
            <Group justify="center" mt="lg">
              <Pagination
                total={Math.ceil(filteredPostings.length / perPage)}
                value={page}
                onChange={setPage}
              />
            </Group>
          )}
        </>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No job postings match your filters.
        </Text>
      )}

      <JobDetailModal
        posting={selectedPosting}
        opened={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedPosting(null);
        }}
        role={role}
        onJobUpdate={fetchData}
      />

      <CreateJobModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
