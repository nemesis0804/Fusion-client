/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  Text,
  Group,
  Loader,
  Button,
  TextInput,
  Textarea,
  Table,
  Modal,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconRefresh,
  IconSearch,
  IconPencil,
  IconTrash,
  IconExternalLink,
} from "@tabler/icons-react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api.js";
import { companiesRoute } from "../../routes/placementCellRoutes/index.jsx";

const blankCompany = {
  name: "",
  website: "",
  description: "",
  domain: "",
  contact_person_name: "",
  contact_email: "",
  contact_phone: "",
  address: "",
};

export default function ManagementTab({ role }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(blankCompany);
  const [submitting, setSubmitting] = useState(false);

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await apiGet(companiesRoute);
      const list = Array.isArray(res) ? res : res.results || [];
      setCompanies(list);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load companies",
        color: "red",
      });
      setCompanies([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData(blankCompany);
    setModalOpen(true);
  };

  const openEdit = (company) => {
    setEditing(company);
    setFormData({
      name: company.name || "",
      website: company.website || "",
      description: company.description || "",
      domain: company.domain || "",
      contact_person_name: company.contact_person_name || "",
      contact_email: company.contact_email || "",
      contact_phone: company.contact_phone || "",
      address: company.address || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.contact_email.trim()) {
      notifications.show({
        title: "Missing fields",
        message: "Company name and contact email are required.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        website: formData.website.trim() || null,
        description: formData.description.trim() || null,
        domain: formData.domain.trim() || null,
        contact_person_name: formData.contact_person_name.trim() || null,
        contact_email: formData.contact_email.trim(),
        contact_phone: formData.contact_phone.trim() || null,
        address: formData.address.trim() || null,
      };
      if (editing) {
        await apiPut(`${companiesRoute}${editing.id}/`, payload);
        notifications.show({
          title: "Updated",
          message: "Company details updated.",
          color: "green",
        });
      } else {
        await apiPost(companiesRoute, payload);
        notifications.show({
          title: "Registered",
          message: "Company registered.",
          color: "green",
        });
      }
      setModalOpen(false);
      setEditing(null);
      setFormData(blankCompany);
      fetchCompanies();
    } catch (err) {
      const data = err?.response?.data;
      let msg = "Failed to save company.";
      if (data && typeof data === "object") {
        const parts = [];
        Object.entries(data).forEach(([field, val]) => {
          parts.push(
            `${field}: ${Array.isArray(val) ? val.join(", ") : String(val)}`,
          );
        });
        if (parts.length) msg = parts.join(" | ");
      }
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
    setSubmitting(false);
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Remove "${company.name}" from the registry?`)) return;
    try {
      await apiDelete(`${companiesRoute}${company.id}/`);
      notifications.show({
        title: "Removed",
        message: "Company removed.",
        color: "orange",
      });
      fetchCompanies();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove company.",
        color: "red",
      });
    }
  };

  const handleApprove = async (company) => {
    try {
      await apiPost(`${companiesRoute}${company.id}/approve/`, {});
      notifications.show({
        title: "Approved",
        message: `${company.name} approved.`,
        color: "green",
      });
      fetchCompanies();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to approve.",
        color: "red",
      });
    }
  };

  const handleReject = async (company) => {
    try {
      await apiPost(`${companiesRoute}${company.id}/reject/`, {});
      notifications.show({
        title: "Rejected",
        message: `${company.name} rejected.`,
        color: "orange",
      });
      fetchCompanies();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to reject.",
        color: "red",
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      `${c.name || ""} ${c.domain || ""} ${c.contact_email || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [companies, search]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <Group justify="space-between" mb="lg" wrap="wrap">
        <Stack gap={2}>
          <Text fw={700} size="xl">
            Companies
          </Text>
          <Text size="sm" c="dimmed">
            Register and manage recruiting companies for placement.
          </Text>
        </Stack>
        <Group gap="sm">
          <Tooltip label="Reload">
            <ActionIcon variant="light" onClick={fetchCompanies}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          {isOfficer && (
            <Button onClick={openCreate}>+ Register Company</Button>
          )}
        </Group>
      </Group>

      <Group mb="md">
        <TextInput
          placeholder="Search by name, domain, or email"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={320}
        />
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No companies registered yet.
        </Text>
      ) : (
        <Box style={{ overflowX: "auto" }}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Domain</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Group gap={6} wrap="nowrap">
                      <Text fw={600} size="sm">
                        {c.name}
                      </Text>
                      {c.website && (
                        <Tooltip label={c.website}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            component="a"
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <IconExternalLink size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>{c.domain || "—"}</Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{c.contact_person_name || "—"}</Text>
                      <Text size="xs" c="dimmed">
                        {c.contact_email}
                      </Text>
                      {c.contact_phone && (
                        <Text size="xs" c="dimmed">
                          {c.contact_phone}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td style={{ maxWidth: 280 }}>
                    <Text size="sm" lineClamp={2}>
                      {c.description || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={
                        c.approval_status === "APPROVED"
                          ? "green"
                          : c.approval_status === "REJECTED"
                            ? "red"
                            : "yellow"
                      }
                      variant="light"
                    >
                      {c.approval_status || "PENDING"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {isOfficer && (
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => openEdit(c)}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        {c.approval_status !== "APPROVED" && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            onClick={() => handleApprove(c)}
                          >
                            Approve
                          </Button>
                        )}
                        {c.approval_status !== "REJECTED" && (
                          <Button
                            size="xs"
                            variant="light"
                            color="gray"
                            onClick={() => handleReject(c)}
                          >
                            Reject
                          </Button>
                        )}
                        <Tooltip label="Remove">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(c)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Company" : "Register Company"}
        centered
        size="lg"
      >
        <Stack>
          <TextInput
            label="Name"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData((f) => ({ ...f, name: e.target.value }))
            }
          />
          <Group grow>
            <TextInput
              label="Domain"
              placeholder="e.g. IT, Finance, Manufacturing"
              value={formData.domain}
              onChange={(e) =>
                setFormData((f) => ({ ...f, domain: e.target.value }))
              }
            />
            <TextInput
              label="Website"
              placeholder="https://..."
              value={formData.website}
              onChange={(e) =>
                setFormData((f) => ({ ...f, website: e.target.value }))
              }
            />
          </Group>
          <Textarea
            label="Description"
            placeholder="A short description of the company"
            autosize
            minRows={3}
            maxRows={6}
            value={formData.description}
            onChange={(e) =>
              setFormData((f) => ({ ...f, description: e.target.value }))
            }
          />
          <Group grow>
            <TextInput
              label="Contact Person"
              value={formData.contact_person_name}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  contact_person_name: e.target.value,
                }))
              }
            />
            <TextInput
              label="Contact Email"
              required
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData((f) => ({ ...f, contact_email: e.target.value }))
              }
            />
          </Group>
          <Group grow>
            <TextInput
              label="Contact Phone"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData((f) => ({ ...f, contact_phone: e.target.value }))
              }
            />
            <TextInput
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData((f) => ({ ...f, address: e.target.value }))
              }
            />
          </Group>
          <Button onClick={handleSubmit} loading={submitting} fullWidth>
            {editing ? "Save changes" : "Register"}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
