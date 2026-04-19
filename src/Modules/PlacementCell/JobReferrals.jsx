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
  Modal,
  Textarea,
  Divider,
  ActionIcon,
  Tooltip,
  Switch,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  MagnifyingGlass,
  Briefcase,
  MapPin,
  CurrencyDollar,
  CalendarBlank,
  Plus,
  PencilSimple,
  Trash,
  ArrowSquareOut,
  Buildings,
} from "phosphor-react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import { jobReferralsRoute } from "../../routes/placementCellRoutes";

/* ═══════════════════════
   REFERRAL CARD
═══════════════════════ */
function ReferralCard({ referral, isOwner, isTpo, onEdit, onDelete }) {
  const expired = referral.is_deadline_passed;

  return (
    <Card
      shadow="xs"
      radius="md"
      withBorder
      p="md"
      h="100%"
      style={{ opacity: expired ? 0.6 : 1 }}
    >
      <Group position="apart" mb="xs" noWrap>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} size="md" truncate>
            {referral.role_title}
          </Text>
          <Group spacing={4}>
            <Buildings size={13} />
            <Text size="sm" c="dimmed" truncate>
              {referral.company_name}
            </Text>
          </Group>
        </div>
        {expired && (
          <Badge color="red" variant="light" size="sm">
            Expired
          </Badge>
        )}
        {!expired && referral.is_active && (
          <Badge color="green" variant="light" size="sm">
            Active
          </Badge>
        )}
        {!referral.is_active && (
          <Badge color="gray" variant="light" size="sm">
            Inactive
          </Badge>
        )}
      </Group>

      <Text size="xs" c="dimmed" lineClamp={3} mb="sm">
        {referral.description}
      </Text>

      <Stack spacing={3} mb="sm">
        {referral.location && (
          <Group spacing={4}>
            <MapPin size={13} />
            <Text size="xs" c="dimmed">
              {referral.location}
            </Text>
          </Group>
        )}
        {referral.ctc_range && (
          <Group spacing={4}>
            <CurrencyDollar size={13} />
            <Text size="xs" c="dimmed">
              {referral.ctc_range}
            </Text>
          </Group>
        )}
        {referral.deadline && (
          <Group spacing={4}>
            <CalendarBlank size={13} />
            <Text size="xs" c="dimmed">
              Deadline:{" "}
              {new Date(referral.deadline).toLocaleDateString("en-IN")}
            </Text>
          </Group>
        )}
        {referral.eligible_programmes && (
          <Text size="xs" c="dimmed">
            Eligible: {referral.eligible_programmes}
          </Text>
        )}
      </Stack>

      <Divider mb="sm" />

      <Group position="apart" noWrap>
        <Text size="xs" c="dimmed">
          By {referral.posted_by_name}
          {referral.posted_by_company ? ` · ${referral.posted_by_company}` : ""}
        </Text>
        <Group spacing={4}>
          {referral.referral_link && (
            <Tooltip label="Apply / Referral Link">
              <ActionIcon
                component="a"
                href={referral.referral_link}
                target="_blank"
                rel="noreferrer"
                color="blue"
                variant="light"
                size="sm"
              >
                <ArrowSquareOut size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {isOwner && (
            <>
              <Tooltip label="Edit">
                <ActionIcon
                  color="blue"
                  variant="light"
                  size="sm"
                  onClick={() => onEdit(referral)}
                >
                  <PencilSimple size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete">
                <ActionIcon
                  color="red"
                  variant="light"
                  size="sm"
                  onClick={() => onDelete(referral)}
                >
                  <Trash size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          {isTpo && !isOwner && (
            <Tooltip label="Remove (Moderate)">
              <ActionIcon
                color="red"
                variant="light"
                size="sm"
                onClick={() => onDelete(referral)}
              >
                <Trash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
    </Card>
  );
}

/* ═══════════════════════
   MAIN COMPONENT
═══════════════════════ */
export default function JobReferrals({ role }) {
  const isAlumni = role === "alumni";
  const isTpo = role === "placement officer" || role === "placement chairman";

  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState("");

  // Create / Edit modal
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({
    company_name: "",
    role_title: "",
    description: "",
    location: "",
    referral_link: "",
    ctc_range: "",
    eligible_programmes: "",
    eligible_branches: "",
    deadline: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await apiGet(jobReferralsRoute);
      setReferrals(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load referrals.",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.role_title.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q) ||
      (r.location || "").toLowerCase().includes(q) ||
      (r.ctc_range || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      company_name: "",
      role_title: "",
      description: "",
      location: "",
      referral_link: "",
      ctc_range: "",
      eligible_programmes: "",
      eligible_branches: "",
      deadline: "",
      is_active: true,
    });
    setFormModal(true);
  };

  const openEdit = (ref) => {
    setEditing(ref);
    setForm({
      company_name: ref.company_name,
      role_title: ref.role_title,
      description: ref.description,
      location: ref.location || "",
      referral_link: ref.referral_link || "",
      ctc_range: ref.ctc_range || "",
      eligible_programmes: ref.eligible_programmes || "",
      eligible_branches: ref.eligible_branches || "",
      deadline: ref.deadline || "",
      is_active: ref.is_active,
    });
    setFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.company_name || !form.role_title || !form.description) {
      notifications.show({
        title: "Missing fields",
        message: "Company, role title, and description are required.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.deadline) payload.deadline = null;
      if (editing) {
        await apiPut(`${jobReferralsRoute}${editing.id}/`, payload);
        notifications.show({
          title: "Updated",
          message: "Referral updated.",
          color: "green",
        });
      } else {
        await apiPost(jobReferralsRoute, payload);
        notifications.show({
          title: "Posted",
          message: "Job referral posted!",
          color: "green",
        });
      }
      setFormModal(false);
      fetchReferrals();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Failed to save.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  const handleDelete = async (ref) => {
    if (
      !window.confirm(
        `Delete referral "${ref.role_title}" at ${ref.company_name}?`,
      )
    )
      return;
    try {
      await apiDelete(`${jobReferralsRoute}${ref.id}/`);
      notifications.show({
        title: "Deleted",
        message: "Referral removed.",
        color: "orange",
      });
      fetchReferrals();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.detail || "Delete failed.",
        color: "red",
      });
    }
  };

  const handleChange = (field) => (val) =>
    setForm((f) => ({
      ...f,
      [field]: typeof val === "object" && val?.target ? val.target.value : val,
    }));

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader size="lg" />
      </div>
    );

  return (
    <div>
      <Group position="apart" mb="lg">
        <Text size="1.5rem" fw={700} style={{ fontFamily: "Manrope" }}>
          Job Referrals
        </Text>
        {isAlumni && (
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            Post Referral
          </Button>
        )}
      </Group>

      {/* Search */}
      <TextInput
        placeholder="Search by role, company, location..."
        icon={<MagnifyingGlass size={16} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb="lg"
        style={{ maxWidth: 380 }}
      />

      {filtered.length === 0 ? (
        <Card shadow="xs" radius="md" withBorder p="xl" ta="center">
          <Briefcase size={40} color="#aaa" />
          <Text c="dimmed" mt="sm">
            No job referrals {isAlumni ? "posted yet" : "available"}.
          </Text>
          {isAlumni && (
            <Button
              variant="light"
              mt="md"
              onClick={openCreate}
              leftIcon={<Plus size={14} />}
            >
              Post Your First Referral
            </Button>
          )}
        </Card>
      ) : (
        <Grid gutter="md">
          {filtered.map((r) => (
            <Grid.Col key={r.id} span={{ base: 12, sm: 6, md: 4 }}>
              <ReferralCard
                referral={r}
                isOwner={isAlumni}
                isTpo={isTpo}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Create / Edit Modal */}
      <Modal
        opened={formModal}
        onClose={() => setFormModal(false)}
        title={editing ? "Edit Job Referral" : "Post Job Referral"}
        centered
        size="lg"
      >
        <Stack spacing="sm">
          <Group grow>
            <TextInput
              label="Company Name"
              placeholder="e.g. Google"
              value={form.company_name}
              onChange={handleChange("company_name")}
              required
            />
            <TextInput
              label="Role Title"
              placeholder="e.g. SDE Intern"
              value={form.role_title}
              onChange={handleChange("role_title")}
              required
            />
          </Group>

          <Textarea
            label="Description"
            placeholder="Brief job description and what you can help with..."
            value={form.description}
            onChange={handleChange("description")}
            autosize
            minRows={3}
            required
          />

          <Group grow>
            <TextInput
              label="Location"
              placeholder="e.g. Bangalore, Remote"
              value={form.location}
              onChange={handleChange("location")}
            />
            <TextInput
              label="CTC Range"
              placeholder="e.g. 12-18 LPA"
              value={form.ctc_range}
              onChange={handleChange("ctc_range")}
            />
          </Group>

          <TextInput
            label="Referral / Apply Link"
            placeholder="https://..."
            value={form.referral_link}
            onChange={handleChange("referral_link")}
          />

          <Group grow>
            <TextInput
              label="Eligible Programmes"
              placeholder="B.Tech, M.Tech"
              value={form.eligible_programmes}
              onChange={handleChange("eligible_programmes")}
            />
            <TextInput
              label="Eligible Branches"
              placeholder="CSE, ECE"
              value={form.eligible_branches}
              onChange={handleChange("eligible_branches")}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Application Deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange("deadline")}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: 4,
              }}
            >
              <Switch
                label="Active"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                size="md"
              />
            </div>
          </Group>

          <Button
            onClick={handleSubmit}
            loading={submitting}
            fullWidth
            mt="xs"
            size="md"
          >
            {editing ? "Update Referral" : "Post Referral"}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
