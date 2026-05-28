/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Tabs,
  Table,
  ActionIcon,
  Tooltip,
  Loader,
  Switch,
  Box,
  SegmentedControl,
  Pagination,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBriefcase,
  IconCircleCheck,
  IconBan,
  IconTrash,
  IconExternalLink,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSchool,
  IconUserCheck,
  IconClock,
} from "@tabler/icons-react";
import { apiGet, apiPost, apiDelete } from "./api.js";
import { placementClaimsRoute } from "../../routes/placementCellRoutes/index.jsx";

const KIND_META = {
  PLACEMENT: { label: "Placement", icon: IconBriefcase, color: "green" },
  INTERNSHIP: { label: "Internship", icon: IconSchool, color: "grape" },
};

const STATUS_META = {
  PENDING: { color: "yellow", label: "Pending", icon: IconClock },
  VERIFIED: { color: "green", label: "Verified", icon: IconCircleCheck },
  REJECTED: { color: "red", label: "Rejected", icon: IconBan },
};

const SOURCE_OPTIONS = [
  { value: "OFFCAMPUS", label: "Off-campus" },
  { value: "ONCAMPUS", label: "On-campus / Through PCMS" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

const formatCompensation = (claim) => {
  if (
    claim.compensation_amount === null ||
    claim.compensation_amount === undefined ||
    claim.compensation_amount === ""
  ) {
    return "—";
  }
  const n = Number(claim.compensation_amount);
  if (!Number.isFinite(n)) return claim.compensation_amount;
  if (claim.kind === "INTERNSHIP") {
    return `₹${n.toLocaleString("en-IN")}/month${
      claim.duration_months ? ` × ${claim.duration_months} mo` : ""
    }`;
  }
  return `₹${n} LPA`;
};

// ---------------------------------------------------------------------------
// Verify / Reject modal
// ---------------------------------------------------------------------------

function VerifyClaimModal({ claim, mode, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRemarks(claim?.verification_remarks || "");
  }, [claim?.id]);

  if (!claim) return null;
  const isReject = mode === "reject";
  const handle = async () => {
    setSubmitting(true);
    try {
      await onConfirm(claim, remarks);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Modal
      opened={!!claim}
      onClose={onClose}
      title={isReject ? "Reject claim" : "Verify claim"}
      centered
    >
      <Stack>
        <Text size="sm">
          <Text span fw={600}>
            {claim.student_name}
          </Text>{" "}
          ({claim.student_roll}) — {claim.kind} at{" "}
          <Text span fw={600}>
            {claim.company_name}
          </Text>
        </Text>
        <Textarea
          label="Remarks (optional)"
          autosize
          minRows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <Button
          color={isReject ? "red" : "green"}
          loading={submitting}
          onClick={handle}
        >
          {isReject ? "Reject claim" : "Mark as verified"}
        </Button>
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Create-on-behalf modal (TPO)
// ---------------------------------------------------------------------------

function CreateClaimModal({
  opened,
  onClose,
  onSubmit,
  kind,
  setKind,
  preselectStudent,
}) {
  const blank = {
    student: null,
    company_name: "",
    role_title: "",
    location: "",
    compensation_amount: "",
    duration_months: "",
    start_date: "",
    end_date: "",
    source: "OFFCAMPUS",
    proof_link: "",
    notes: "",
  };
  const [data, setData] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  // Cache of every student we've ever seen in this modal (preselected +
  // search results) so the Select can always render its current value's
  // label even after the search text changes.
  const [studentCache, setStudentCache] = useState({});
  const set = (patch) => setData((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (opened) {
      setData({
        ...blank,
        student: preselectStudent?.student_pk ?? null,
      });
      setStudentQuery("");
      if (preselectStudent?.student_pk) {
        setStudentCache((prev) => ({
          ...prev,
          [String(preselectStudent.student_pk)]: {
            student_pk: preselectStudent.student_pk,
            student: preselectStudent.student,
            name: preselectStudent.name,
          },
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, preselectStudent?.student_pk]);

  // Debounced server-side student lookup. We always pass the query so even
  // an empty search returns a small first page (page_size=20).
  useEffect(() => {
    if (!opened) return undefined;
    const timer = setTimeout(async () => {
      setStudentsLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", page_size: "20" });
        if (studentQuery.trim()) params.set("q", studentQuery.trim());
        const res = await apiGet(
          `${placementClaimsRoute}students/?${params.toString()}`,
        );
        const list = Array.isArray(res?.results) ? res.results : [];
        setStudents(list);
        setStudentCache((prev) => {
          const next = { ...prev };
          list.forEach((s) => {
            next[String(s.student_pk)] = s;
          });
          return next;
        });
      } catch {
        setStudents([]);
      }
      setStudentsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [opened, studentQuery]);

  const handle = async () => {
    if (!data.student) {
      notifications.show({
        title: "Pick a student",
        message: "Please choose the student to mark.",
        color: "red",
      });
      return;
    }
    if (!data.company_name.trim()) {
      notifications.show({
        title: "Missing field",
        message: "Company name is required.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        student: data.student,
        kind,
        company_name: data.company_name.trim(),
        role_title: data.role_title.trim() || null,
        location: data.location.trim() || null,
        compensation_amount:
          data.compensation_amount === "" ? null : data.compensation_amount,
        duration_months:
          kind === "INTERNSHIP" && data.duration_months !== ""
            ? data.duration_months
            : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        source: data.source,
        proof_link: data.proof_link.trim() || null,
        notes: data.notes.trim() || null,
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Mark a student placed / interning"
      size="lg"
      centered
    >
      <Stack>
        <SegmentedControl
          value={kind}
          onChange={setKind}
          data={[
            { value: "PLACEMENT", label: "Placement" },
            { value: "INTERNSHIP", label: "Internship" },
          ]}
          fullWidth
        />
        <Select
          label="Student"
          description="Type a name or roll number to filter the list."
          required
          searchable
          searchValue={studentQuery}
          onSearchChange={setStudentQuery}
          rightSection={studentsLoading ? <Loader size="xs" /> : undefined}
          nothingFoundMessage={
            studentsLoading
              ? "Searching…"
              : studentQuery
                ? "No students match"
                : "Start typing to search"
          }
          data={(() => {
            const seen = new Map();
            students.forEach((s) => {
              seen.set(String(s.student_pk), {
                value: String(s.student_pk),
                label: `${s.name} (${s.student})`,
              });
            });
            // Always include the currently selected student so the label
            // shows even when the search text doesn't match it.
            if (data.student) {
              const key = String(data.student);
              if (!seen.has(key) && studentCache[key]) {
                const c = studentCache[key];
                seen.set(key, {
                  value: key,
                  label: `${c.name} (${c.student})`,
                });
              }
            }
            return Array.from(seen.values());
          })()}
          value={data.student ? String(data.student) : null}
          onChange={(v) => set({ student: v ? Number(v) : null })}
        />
        <Group grow>
          <TextInput
            label="Company"
            required
            value={data.company_name}
            onChange={(e) => set({ company_name: e.target.value })}
          />
          <TextInput
            label="Role / Designation"
            value={data.role_title}
            onChange={(e) => set({ role_title: e.target.value })}
          />
        </Group>
        <Group grow>
          <TextInput
            label="Location"
            value={data.location}
            onChange={(e) => set({ location: e.target.value })}
          />
          <Select
            label="Source"
            data={SOURCE_OPTIONS}
            value={data.source}
            onChange={(v) => set({ source: v || "OFFCAMPUS" })}
          />
        </Group>
        <Group grow>
          <NumberInput
            label={
              kind === "INTERNSHIP" ? "Stipend (₹ / month)" : "CTC (₹ LPA)"
            }
            value={data.compensation_amount}
            onChange={(v) => set({ compensation_amount: v })}
            min={0}
            decimalScale={2}
            thousandSeparator={kind === "INTERNSHIP" ? "," : false}
          />
          {kind === "INTERNSHIP" && (
            <NumberInput
              label="Duration (months)"
              value={data.duration_months}
              onChange={(v) => set({ duration_months: v })}
              min={1}
              max={24}
            />
          )}
        </Group>
        <Group grow>
          <TextInput
            label={kind === "INTERNSHIP" ? "Start date" : "Joining date"}
            type="date"
            value={data.start_date}
            onChange={(e) => set({ start_date: e.target.value })}
          />
          {kind === "INTERNSHIP" && (
            <TextInput
              label="End date"
              type="date"
              value={data.end_date}
              onChange={(e) => set({ end_date: e.target.value })}
            />
          )}
        </Group>
        <TextInput
          label="Proof Link (optional)"
          value={data.proof_link}
          onChange={(e) => set({ proof_link: e.target.value })}
        />
        <Textarea
          label="Notes (optional)"
          autosize
          minRows={2}
          value={data.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
        <Button onClick={handle} loading={submitting} fullWidth color="green">
          Mark as verified
        </Button>
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Apply-override modal
// ---------------------------------------------------------------------------

function OverrideModal({ student, onClose, onConfirm }) {
  const [enabled, setEnabled] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEnabled(!!student?.apply_override);
    setRemarks(student?.apply_override_remarks || "");
  }, [student?.student_pk]);

  if (!student) return null;
  const handle = async () => {
    setSubmitting(true);
    try {
      await onConfirm(student, enabled, remarks);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Modal
      opened={!!student}
      onClose={onClose}
      title={`Apply override · ${student.name}`}
      centered
    >
      <Stack>
        <Text size="sm" c="dimmed">
          When override is on, this student is allowed to apply to job postings
          even after being marked placed (or interning). Use it for genuine
          dream-company / cross-kind exceptions.
        </Text>
        <Switch
          label="Allow this student to apply despite being placed"
          checked={enabled}
          onChange={(e) => setEnabled(e.currentTarget.checked)}
        />
        <Textarea
          label="Remarks (visible to the student)"
          autosize
          minRows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <Button onClick={handle} loading={submitting}>
          Save
        </Button>
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Top-level page
// ---------------------------------------------------------------------------

const STUDENTS_PAGE_SIZE = 25;

export default function PlacementStatusManagement() {
  const [tab, setTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsNumPages, setStudentsNumPages] = useState(1);
  const [studentsCount, setStudentsCount] = useState(0);
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("ALL");
  const [claimsKind, setClaimsKind] = useState("ALL");
  const [claimsStatus, setClaimsStatus] = useState("ALL");
  const [claimsSearch, setClaimsSearch] = useState("");

  const [verifyModal, setVerifyModal] = useState(null); // { claim, mode }
  const [createModal, setCreateModal] = useState(false);
  const [createKind, setCreateKind] = useState("PLACEMENT");
  const [createPreselect, setCreatePreselect] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);

  // Debounce the students-tab search box so each keystroke doesn't trigger
  // a request. We always reset to page 1 when the query changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch.trim());
      setStudentsPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Re-fetch when filter changes (also resets to page 1).
  useEffect(() => {
    setStudentsPage(1);
  }, [studentFilter]);

  const fetchStudents = async (opts = {}) => {
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(opts.page ?? studentsPage),
        page_size: String(STUDENTS_PAGE_SIZE),
      });
      const q = opts.q ?? debouncedStudentSearch;
      const status = opts.status ?? studentFilter;
      if (q) params.set("q", q);
      if (status && status !== "ALL") params.set("status", status);
      const res = await apiGet(
        `${placementClaimsRoute}students/?${params.toString()}`,
      );
      // Tolerate the legacy unpaginated array response.
      if (Array.isArray(res)) {
        setStudents(res);
        setStudentsCount(res.length);
        setStudentsNumPages(1);
      } else {
        setStudents(res.results || []);
        setStudentsCount(res.count ?? 0);
        setStudentsNumPages(res.num_pages ?? 1);
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load student list.",
        color: "red",
      });
      setStudents([]);
    }
    setStudentsLoading(false);
  };

  const fetchClaims = async () => {
    setClaimsLoading(true);
    try {
      const res = await apiGet(placementClaimsRoute);
      setClaims(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load claims.",
        color: "red",
      });
    }
    setClaimsLoading(false);
  };

  const refresh = () => {
    fetchStudents();
    fetchClaims();
  };

  // Initial load.
  useEffect(() => {
    fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch students when paging / search / filter changes.
  useEffect(() => {
    fetchStudents({
      page: studentsPage,
      q: debouncedStudentSearch,
      status: studentFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsPage, debouncedStudentSearch, studentFilter]);

  const handleVerify = async (claim, remarks) => {
    try {
      await apiPost(`${placementClaimsRoute}${claim.id}/verify/`, {
        verification_remarks: remarks,
      });
      notifications.show({
        title: "Verified",
        message: `Claim for ${claim.student_name} marked as verified.`,
        color: "green",
      });
      refresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to verify claim.",
        color: "red",
      });
    }
  };

  const handleReject = async (claim, remarks) => {
    try {
      await apiPost(`${placementClaimsRoute}${claim.id}/reject/`, {
        verification_remarks: remarks,
      });
      notifications.show({
        title: "Rejected",
        message: `Claim for ${claim.student_name} rejected.`,
        color: "gray",
      });
      refresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to reject claim.",
        color: "red",
      });
    }
  };

  const handleDelete = async (claim) => {
    if (
      !window.confirm(
        `Delete the ${claim.kind.toLowerCase()} claim for ${claim.student_name} at ${claim.company_name}?`,
      )
    ) {
      return;
    }
    try {
      await apiDelete(`${placementClaimsRoute}${claim.id}/`);
      notifications.show({
        title: "Removed",
        message: "Claim removed.",
        color: "green",
      });
      refresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove claim.",
        color: "red",
      });
    }
  };

  const handleCreate = async (payload) => {
    try {
      await apiPost(placementClaimsRoute, payload);
      notifications.show({
        title: "Saved",
        message: "Student marked successfully.",
        color: "green",
      });
      refresh();
    } catch (err) {
      const data = err.response?.data;
      let msg = "Failed to save claim.";
      if (data && typeof data === "object") {
        const parts = Object.entries(data).map(
          ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`,
        );
        if (parts.length) msg = parts.join(" | ");
      }
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const handleClearStatus = async (student) => {
    if (!student.has_placement && !student.has_internship) return;
    const labels = [];
    if (student.has_placement) labels.push("placement");
    if (student.has_internship) labels.push("internship");
    if (
      !window.confirm(
        `Clear ${labels.join(" and ")} status for ${student.name}? ` +
          "All verified claims of this kind will be removed and the student " +
          "will be treated as unplaced again.",
      )
    ) {
      return;
    }
    try {
      const res = await apiPost(`${placementClaimsRoute}clear-status/`, {
        student: student.student_pk,
        kind: "ALL",
      });
      notifications.show({
        title: "Cleared",
        message: `Removed ${res.deleted} verified claim${
          res.deleted === 1 ? "" : "s"
        } for ${student.name}.`,
        color: "green",
      });
      refresh();
    } catch (err) {
      notifications.show({
        title: "Error",
        message:
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to clear status.",
        color: "red",
      });
    }
  };

  const handleOverride = async (student, enabled, remarks) => {
    try {
      await apiPost(`${placementClaimsRoute}set-apply-override/`, {
        student: student.student_pk,
        apply_override: enabled,
        remarks,
      });
      notifications.show({
        title: enabled ? "Override enabled" : "Override removed",
        message: `${student.name} ${enabled ? "can apply despite being placed." : "no longer has override."}`,
        color: enabled ? "blue" : "gray",
      });
      fetchStudents();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update override.",
        color: "red",
      });
    }
  };

  // ----- Filters -----
  // Students are filtered server-side via the `q` / `status` query params,
  // so we render `students` directly. Only claims are still filtered on the
  // client because the dataset is small.

  const filteredClaims = useMemo(() => {
    const q = claimsSearch.trim().toLowerCase();
    return claims.filter((c) => {
      if (claimsKind !== "ALL" && c.kind !== claimsKind) return false;
      if (claimsStatus !== "ALL" && c.status !== claimsStatus) return false;
      if (!q) return true;
      return (
        String(c.student_name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.student_roll || "")
          .toLowerCase()
          .includes(q) ||
        String(c.company_name || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [claims, claimsKind, claimsStatus, claimsSearch]);

  const totalPending = claims.filter((c) => c.status === "PENDING").length;

  // ----- Render -----

  const renderStudentTab = () => (
    <Stack mt="md">
      <Group wrap="wrap">
        <TextInput
          leftSection={<IconSearch size={14} />}
          placeholder="Search by name, roll or username"
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          w={260}
        />
        <Select
          data={[
            { value: "ALL", label: "All students" },
            { value: "PLACED", label: "Placed" },
            { value: "INTERNING", label: "Interning" },
            { value: "UNPLACED", label: "Unplaced" },
            { value: "PENDING", label: "Has pending claim" },
            { value: "OVERRIDE", label: "Has apply override" },
          ]}
          value={studentFilter}
          onChange={(v) => setStudentFilter(v || "ALL")}
          w={220}
        />
        <Badge variant="light" size="lg">
          {studentsCount} student{studentsCount === 1 ? "" : "s"}
        </Badge>
        <Tooltip label="Reload">
          <ActionIcon
            variant="light"
            onClick={refresh}
            loading={studentsLoading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
        <Button
          ml="auto"
          leftSection={<IconPlus size={14} />}
          onClick={() => {
            setCreateKind("PLACEMENT");
            setCreatePreselect(null);
            setCreateModal(true);
          }}
        >
          Mark a student
        </Button>
      </Group>

      {studentsLoading && students.length === 0 ? (
        <Box ta="center" py="lg">
          <Loader size="sm" />
        </Box>
      ) : students.length === 0 ? (
        <Card withBorder p="md" ta="center">
          <Text c="dimmed">No students match your filters.</Text>
        </Card>
      ) : (
        <Box style={{ overflowX: "auto", opacity: studentsLoading ? 0.6 : 1 }}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Roll</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Pending</Table.Th>
                <Table.Th>Apply Override</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {students.map((s) => (
                <Table.Tr key={s.student_pk}>
                  <Table.Td>{s.student}</Table.Td>
                  <Table.Td fw={500}>{s.name}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {s.has_placement && (
                        <Badge color="green" variant="filled" size="sm">
                          Placed
                        </Badge>
                      )}
                      {s.has_internship && (
                        <Badge color="grape" variant="filled" size="sm">
                          Interning
                        </Badge>
                      )}
                      {!s.has_placement && !s.has_internship && (
                        <Badge color="gray" variant="light" size="sm">
                          Unplaced
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {s.pending_claims > 0 ? (
                      <Badge color="yellow">{s.pending_claims} pending</Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {s.apply_override ? (
                      <Tooltip label={s.apply_override_remarks || ""}>
                        <Badge color="blue" variant="light">
                          Allowed
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Mark placement / internship">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconUserCheck size={12} />}
                          onClick={() => {
                            setCreateKind(
                              s.has_placement ? "INTERNSHIP" : "PLACEMENT",
                            );
                            setCreatePreselect({
                              student_pk: s.student_pk,
                              student: s.student,
                              name: s.name,
                            });
                            setCreateModal(true);
                          }}
                        >
                          Mark
                        </Button>
                      </Tooltip>
                      <Tooltip label="Toggle apply override">
                        <Button
                          size="xs"
                          variant="subtle"
                          color={s.apply_override ? "blue" : "gray"}
                          onClick={() => setOverrideModal(s)}
                        >
                          Override
                        </Button>
                      </Tooltip>
                      {(s.has_placement || s.has_internship) && (
                        <Tooltip label="Remove all verified placement / internship claims and treat as unplaced">
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => handleClearStatus(s)}
                          >
                            Clear Status
                          </Button>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      {studentsNumPages > 1 && (
        <Group justify="center">
          <Pagination
            total={studentsNumPages}
            value={studentsPage}
            onChange={setStudentsPage}
          />
        </Group>
      )}
    </Stack>
  );

  const renderClaimsTab = () => (
    <Stack mt="md">
      <Group wrap="wrap">
        <TextInput
          leftSection={<IconSearch size={14} />}
          placeholder="Search by student or company"
          value={claimsSearch}
          onChange={(e) => setClaimsSearch(e.target.value)}
          w={260}
        />
        <Select
          data={[
            { value: "ALL", label: "All kinds" },
            { value: "PLACEMENT", label: "Placement" },
            { value: "INTERNSHIP", label: "Internship" },
          ]}
          value={claimsKind}
          onChange={(v) => setClaimsKind(v || "ALL")}
          w={180}
        />
        <Select
          data={[
            { value: "ALL", label: "All statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "VERIFIED", label: "Verified" },
            { value: "REJECTED", label: "Rejected" },
          ]}
          value={claimsStatus}
          onChange={(v) => setClaimsStatus(v || "ALL")}
          w={180}
        />
        <Tooltip label="Reload">
          <ActionIcon variant="light" onClick={refresh}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {claimsLoading ? (
        <Box ta="center" py="lg">
          <Loader size="sm" />
        </Box>
      ) : filteredClaims.length === 0 ? (
        <Card withBorder p="md" ta="center">
          <Text c="dimmed">No claims match your filters.</Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {filteredClaims.map((c) => {
            const KindIcon = KIND_META[c.kind]?.icon || IconBriefcase;
            const status = STATUS_META[c.status] || STATUS_META.PENDING;
            return (
              <Card key={c.id} withBorder shadow="xs" radius="md" p="md">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group gap="sm" align="flex-start" wrap="nowrap">
                    <KindIcon size={20} />
                    <Stack gap={2}>
                      <Text fw={600} size="sm">
                        {c.student_name} ({c.student_roll}) — {c.company_name}
                        {c.role_title ? ` · ${c.role_title}` : ""}
                      </Text>
                      <Group gap={6}>
                        <Badge size="xs" variant="light" color={status.color}>
                          {status.label}
                        </Badge>
                        <Badge
                          size="xs"
                          variant="outline"
                          color={KIND_META[c.kind]?.color || "blue"}
                        >
                          {KIND_META[c.kind]?.label || c.kind}
                        </Badge>
                        <Badge size="xs" variant="dot">
                          {c.source}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {formatCompensation(c)}
                        {c.location ? ` • ${c.location}` : ""}
                      </Text>
                      {c.notes && (
                        <Text size="xs" c="dimmed" fs="italic">
                          “{c.notes}”
                        </Text>
                      )}
                      {c.verification_remarks && (
                        <Text size="xs" c="dimmed">
                          Remarks: {c.verification_remarks}
                          {c.verified_by_name
                            ? ` (by ${c.verified_by_name})`
                            : ""}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                  <Group gap={4} wrap="nowrap">
                    {c.proof_link && (
                      <Tooltip label="Open proof link">
                        <ActionIcon
                          component="a"
                          href={c.proof_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="subtle"
                        >
                          <IconExternalLink size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {c.status === "PENDING" && (
                      <>
                        <Tooltip label="Verify">
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconCircleCheck size={12} />}
                            onClick={() =>
                              setVerifyModal({ claim: c, mode: "verify" })
                            }
                          >
                            Verify
                          </Button>
                        </Tooltip>
                        <Tooltip label="Reject">
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            leftSection={<IconBan size={12} />}
                            onClick={() =>
                              setVerifyModal({ claim: c, mode: "reject" })
                            }
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(c)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );

  return (
    <div>
      <Group justify="space-between" mb="lg" wrap="wrap">
        <Stack gap={2}>
          <Text fw={700} size="xl">
            Placement Status
          </Text>
          <Text size="sm" c="dimmed">
            Verify student-submitted claims, mark students as placed/interning,
            and grant apply overrides when needed.
          </Text>
        </Stack>
        {totalPending > 0 && (
          <Badge color="yellow" size="lg" variant="light">
            {totalPending} pending verification
            {totalPending === 1 ? "" : "s"}
          </Badge>
        )}
      </Group>

      <Tabs value={tab} onChange={(v) => v && setTab(v)}>
        <Tabs.List>
          <Tabs.Tab value="students">Students</Tabs.Tab>
          <Tabs.Tab value="claims">Claims</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="students">{renderStudentTab()}</Tabs.Panel>
        <Tabs.Panel value="claims">{renderClaimsTab()}</Tabs.Panel>
      </Tabs>

      <CreateClaimModal
        opened={createModal}
        onClose={() => {
          setCreateModal(false);
          setCreatePreselect(null);
        }}
        kind={createKind}
        setKind={setCreateKind}
        onSubmit={handleCreate}
        preselectStudent={createPreselect}
      />

      <VerifyClaimModal
        claim={verifyModal?.claim || null}
        mode={verifyModal?.mode}
        onClose={() => setVerifyModal(null)}
        onConfirm={(c, remarks) =>
          (verifyModal?.mode === "reject" ? handleReject : handleVerify)(
            c,
            remarks,
          )
        }
      />

      <OverrideModal
        student={overrideModal}
        onClose={() => setOverrideModal(null)}
        onConfirm={handleOverride}
      />
    </div>
  );
}
