/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Text,
  Group,
  Loader,
  Button,
  TextInput,
  Table,
  Modal,
  Stack,
  Card,
  Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost } from "./api.js";
import {
  registrationRoute,
  restrictionsRoute,
  addFieldRoute,
} from "../../routes/placementCellRoutes/index.jsx";

function CompanyRegistration({ role }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCompany, setNewCompany] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await apiGet(registrationRoute);
      setCompanies(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAdd = async () => {
    if (!newCompany.trim()) return;
    setAdding(true);
    try {
      await apiPost(registrationRoute, { company_name: newCompany });
      notifications.show({
        title: "Success",
        message: "Company registered",
        color: "green",
      });
      setNewCompany("");
      fetchCompanies();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to register company",
        color: "red",
      });
    }
    setAdding(false);
  };

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Text fw={600} size="lg" mb="sm">
        Registered Companies
      </Text>

      {isOfficer && (
        <Group mb="md">
          <TextInput
            placeholder="Company name"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            w={300}
          />
          <Button onClick={handleAdd} loading={adding}>
            Register
          </Button>
        </Group>
      )}

      {companies.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Company Name</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.map((c, i) => (
              <Table.Tr key={c.id || i}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>{c.company_name}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="md">
          No registered companies.
        </Text>
      )}
    </div>
  );
}

function Restrictions({ role }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_offers: 1,
    min_cpi: 0,
    backlog_allowed: true,
  });

  const fetchPolicies = async () => {
    try {
      const res = await apiGet(restrictionsRoute);
      setPolicies(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleAdd = async () => {
    try {
      await apiPost(restrictionsRoute, formData);
      notifications.show({
        title: "Success",
        message: "Policy added",
        color: "green",
      });
      setModalOpen(false);
      fetchPolicies();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to add policy",
        color: "red",
      });
    }
  };

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="lg">
          Placement Policies & Restrictions
        </Text>
        {isOfficer && (
          <Button onClick={() => setModalOpen(true)} size="sm">
            + Add Policy
          </Button>
        )}
      </Group>

      {policies.length > 0 ? (
        <Grid gutter="lg">
          {policies.map((p) => (
            <Grid.Col key={p.id} span={{ base: 12, sm: 6 }}>
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Text fw={500}>{p.name}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {p.description}
                </Text>
                <Group mt="sm" gap="md">
                  <Text size="xs">
                    Max Offers: <strong>{p.max_offers}</strong>
                  </Text>
                  <Text size="xs">
                    Min CPI: <strong>{p.min_cpi}</strong>
                  </Text>
                  <Text size="xs">
                    Active: <strong>{p.is_active ? "Yes" : "No"}</strong>
                  </Text>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Text c="dimmed" ta="center" py="md">
          No policies configured.
        </Text>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Policy"
        centered
      >
        <Stack>
          <TextInput
            label="Policy Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextInput
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <Button onClick={handleAdd} fullWidth>
            Add Policy
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}

function FormFields({ role }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchFields = async () => {
    try {
      const res = await apiGet(addFieldRoute);
      setFields(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleAdd = async () => {
    if (!newRole.trim()) return;
    setAdding(true);
    try {
      await apiPost(addFieldRoute, { role: newRole });
      notifications.show({
        title: "Success",
        message: "Role added",
        color: "green",
      });
      setNewRole("");
      fetchFields();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to add role",
        color: "red",
      });
    }
    setAdding(false);
  };

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Text fw={600} size="lg" mb="sm">
        Roles / Fields
      </Text>

      {isOfficer && (
        <Group mb="md">
          <TextInput
            placeholder="Role name"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            w={250}
          />
          <Button onClick={handleAdd} loading={adding}>
            Add Role
          </Button>
        </Group>
      )}

      {fields.length > 0 ? (
        <Group gap="sm">
          {fields.map((f) => (
            <Card key={f.id} shadow="xs" padding="sm" radius="md" withBorder>
              {f.role}
            </Card>
          ))}
        </Group>
      ) : (
        <Text c="dimmed" ta="center" py="md">
          No roles configured.
        </Text>
      )}
    </div>
  );
}

export default function ManagementTab({ role }) {
  return (
    <div>
      <Text fw={600} size="xl" mb="lg">
        Management
      </Text>

      <Stack gap="xl">
        <CompanyRegistration role={role} />
        <Restrictions role={role} />
        <FormFields role={role} />
      </Stack>
    </div>
  );
}
