/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Stack,
  Group,
  Grid,
  Loader,
  Badge,
  Button,
  TextInput,
  Select,
  Modal,
  Textarea,
  Avatar,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  MagnifyingGlass,
  Check,
  X,
  LinkedinLogo,
  GraduationCap,
  User,
} from "phosphor-react";
import { apiGet, apiPost } from "./api";
import { alumniRoute } from "../../routes/placementCellRoutes";

const STATUS_COLOR = { PENDING: "yellow", APPROVED: "green", REJECTED: "red" };

function StatCard({ label, value, color }) {
  const bgs = {
    blue: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    orange: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  };
  return (
    <Card
      shadow="md"
      radius="lg"
      p="lg"
      style={{ background: bgs[color], color: "#fff", minHeight: 100 }}
    >
      <Text size="xs" opacity={0.85} tt="uppercase" fw={600} lts={1}>
        {label}
      </Text>
      <Text
        size="2rem"
        fw={800}
        lh={1}
        mt="xs"
        style={{ fontFamily: "Manrope" }}
      >
        {value ?? 0}
      </Text>
    </Card>
  );
}

function AlumniCard({ alumni, isTpo, onAction }) {
  return (
    <Card shadow="xs" radius="md" withBorder p="md" h="100%">
      <Group mb="sm" noWrap>
        <Avatar radius="xl" size="lg" color="indigo">
          {alumni.full_name?.charAt(0)?.toUpperCase() || "A"}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="md" truncate>
            {alumni.full_name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {[alumni.current_designation, alumni.current_company]
              .filter(Boolean)
              .join(" at ") || "—"}
          </Text>
        </div>
        {isTpo && alumni.approval_status && (
          <Badge
            color={STATUS_COLOR[alumni.approval_status]}
            variant="light"
            size="sm"
          >
            {alumni.approval_status}
          </Badge>
        )}
      </Group>

      <Stack spacing={4} mb="sm">
        <Group spacing="xs">
          <GraduationCap size={14} />
          <Text size="xs" c="dimmed">
            {[alumni.programme, alumni.department].filter(Boolean).join(", ")} ·{" "}
            {alumni.graduation_year}
          </Text>
        </Group>
        {alumni.linkedin_url && (
          <Group spacing="xs">
            <LinkedinLogo size={14} />
            <Text
              size="xs"
              c="blue"
              component="a"
              href={alumni.linkedin_url}
              target="_blank"
              rel="noreferrer"
              truncate
              style={{ textDecoration: "none" }}
            >
              LinkedIn Profile
            </Text>
          </Group>
        )}
      </Stack>

      {alumni.bio && (
        <Text size="xs" c="dimmed" lineClamp={2} mb="sm">
          {alumni.bio}
        </Text>
      )}

      {isTpo && alumni.approval_status === "PENDING" && (
        <Group spacing="xs" mt="auto">
          <Button
            size="xs"
            variant="filled"
            color="green"
            leftIcon={<Check size={14} />}
            onClick={() => onAction("approve", alumni)}
            style={{ flex: 1 }}
          >
            Approve
          </Button>
          <Button
            size="xs"
            variant="light"
            color="red"
            leftIcon={<X size={14} />}
            onClick={() => onAction("reject", alumni)}
            style={{ flex: 1 }}
          >
            Reject
          </Button>
        </Group>
      )}
    </Card>
  );
}

export default function AlumniDirectory({ role }) {
  const isTpo = role === "placement officer" || role === "placement chairman";
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(isTpo ? "" : null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState({ open: false, alumni: null });
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [acting, setActing] = useState(false);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `${alumniRoute}?status=${statusFilter}`
        : alumniRoute;
      const res = await apiGet(url);
      setAlumni(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load alumni.",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlumni();
  }, [statusFilter]);

  const filtered = alumni.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (a.full_name || "").toLowerCase().includes(q) ||
      (a.current_company || "").toLowerCase().includes(q) ||
      (a.department || "").toLowerCase().includes(q) ||
      (a.programme || "").toLowerCase().includes(q)
    );
  });

  const handleAction = async (action, alumniItem) => {
    if (action === "reject") {
      setRejectModal({ open: true, alumni: alumniItem });
      return;
    }
    setActing(true);
    try {
      await apiPost(`${alumniRoute}${alumniItem.id}/approve/`, {});
      notifications.show({
        title: "Approved",
        message: `${alumniItem.full_name} approved.`,
        color: "green",
      });
      fetchAlumni();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Action failed.",
        color: "red",
      });
    }
    setActing(false);
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await apiPost(`${alumniRoute}${rejectModal.alumni.id}/reject/`, {
        remarks: rejectRemarks,
      });
      notifications.show({
        title: "Rejected",
        message: `${rejectModal.alumni.full_name} rejected.`,
        color: "orange",
      });
      setRejectModal({ open: false, alumni: null });
      setRejectRemarks("");
      fetchAlumni();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Action failed.",
        color: "red",
      });
    }
    setActing(false);
  };

  const counts = {
    total: alumni.length,
    pending: alumni.filter((a) => a.approval_status === "PENDING").length,
    approved: alumni.filter((a) => a.approval_status === "APPROVED").length,
  };

  return (
    <div>
      <Text size="1.5rem" fw={700} mb="lg" style={{ fontFamily: "Manrope" }}>
        Alumni Network
      </Text>

      {/* TPO stats */}
      {isTpo && (
        <Grid gutter="lg" mb="xl">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <StatCard label="Total Alumni" value={counts.total} color="blue" />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <StatCard label="Pending" value={counts.pending} color="orange" />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <StatCard label="Approved" value={counts.approved} color="green" />
          </Grid.Col>
        </Grid>
      )}

      {/* Filters */}
      <Group mb="lg">
        <TextInput
          placeholder="Search by name, company, dept..."
          icon={<MagnifyingGlass size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 360 }}
        />
        {isTpo && (
          <Select
            placeholder="Filter by status"
            data={[
              { value: "", label: "All" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 180 }}
          />
        )}
      </Group>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Loader size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card shadow="xs" radius="md" withBorder p="xl" ta="center">
          <User size={40} color="#aaa" />
          <Text c="dimmed" mt="sm">
            No alumni found.
          </Text>
        </Card>
      ) : (
        <Grid gutter="md">
          {filtered.map((a) => (
            <Grid.Col key={a.id} span={{ base: 12, sm: 6, md: 4 }}>
              <AlumniCard alumni={a} isTpo={isTpo} onAction={handleAction} />
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Reject Modal */}
      <Modal
        opened={rejectModal.open}
        onClose={() => setRejectModal({ open: false, alumni: null })}
        title="Reject Alumni Registration"
        centered
      >
        <Text size="sm" mb="sm">
          Rejecting <strong>{rejectModal.alumni?.full_name}</strong>. Provide
          remarks (optional):
        </Text>
        <Textarea
          placeholder="Reason for rejection..."
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          autosize
          minRows={2}
          mb="md"
        />
        <Group position="right">
          <Button
            variant="default"
            onClick={() => setRejectModal({ open: false, alumni: null })}
          >
            Cancel
          </Button>
          <Button color="red" loading={acting} onClick={handleReject}>
            Reject
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
