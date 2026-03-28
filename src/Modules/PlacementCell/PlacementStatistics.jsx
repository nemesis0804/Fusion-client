/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  Select,
  TextInput,
  Button,
  Modal,
  Stack,
  NumberInput,
  Card,
  Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiDelete } from "./api.js";
import { statisticsRoute } from "../../routes/placementCellRoutes/index.jsx";

function StatsCard({ label, value, color }) {
  const gradients = {
    blue: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    orange: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  };

  return (
    <Card
      shadow="sm"
      radius="md"
      p="lg"
      style={{ background: gradients[color] || gradients.blue, color: "white" }}
    >
      <Text size="2rem" fw={700} lh={1}>
        {value}
      </Text>
      <Text size="sm" mt={4} opacity={0.9}>
        {label}
      </Text>
    </Card>
  );
}

function AddRecordModal({ opened, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    placement_type: "PLACEMENT",
    name: "",
    ctc: 0,
    year: new Date().getFullYear(),
    test_type: "",
    test_score: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiPost(statisticsRoute, formData);
      notifications.show({
        title: "Success",
        message: "Record added",
        color: "green",
      });
      onSuccess();
      onClose();
      setFormData({
        placement_type: "PLACEMENT",
        name: "",
        ctc: 0,
        year: new Date().getFullYear(),
        test_type: "",
        test_score: "",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to add record",
        color: "red",
      });
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Placement Record"
      centered
    >
      <Stack>
        <Select
          label="Type"
          data={["PLACEMENT", "PBI", "HIGHER STUDIES"]}
          value={formData.placement_type}
          onChange={(val) => setFormData({ ...formData, placement_type: val })}
        />
        <TextInput
          label="Company / University Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Group grow>
          <NumberInput
            label="CTC (LPA)"
            value={formData.ctc}
            onChange={(val) => setFormData({ ...formData, ctc: val })}
            min={0}
            decimalScale={2}
          />
          <NumberInput
            label="Year"
            value={formData.year}
            onChange={(val) => setFormData({ ...formData, year: val })}
            min={2000}
            max={2100}
          />
        </Group>
        <TextInput
          label="Test Type"
          value={formData.test_type}
          onChange={(e) =>
            setFormData({ ...formData, test_type: e.target.value })
          }
        />
        <TextInput
          label="Test Score"
          value={formData.test_score}
          onChange={(e) =>
            setFormData({ ...formData, test_score: e.target.value })
          }
        />
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Add Record
        </Button>
      </Stack>
    </Modal>
  );
}

export default function PlacementStatistics({ role }) {
  const [stats, setStats] = useState({ records: [], year_stats: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("placement_type", filterType);
      if (filterYear) params.append("year", filterYear);
      const url = params.toString()
        ? `${statisticsRoute}?${params}`
        : statisticsRoute;
      const res = await apiGet(url);
      setStats(res);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch statistics",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterType, filterYear]);

  const handleDelete = async (recordId) => {
    try {
      await apiDelete(statisticsRoute, { record_id: recordId });
      notifications.show({
        title: "Success",
        message: "Record deleted",
        color: "green",
      });
      fetchData();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete record",
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

  const years = [...new Set(stats.records.map((r) => String(r.year)))].sort(
    (a, b) => b - a,
  );

  return (
    <div>
      <Text fw={600} size="xl" mb="lg">
        Placement Statistics
      </Text>

      {stats.year_stats.length > 0 && (
        <Grid gutter="lg" mb="xl">
          {stats.year_stats.slice(0, 4).map((ys, i) => (
            <Grid.Col key={ys.year} span={{ base: 6, md: 3 }}>
              <StatsCard
                label={`Year ${ys.year} - Total Placed`}
                value={ys.total}
                color={["blue", "green", "orange", "purple"][i % 4]}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      <Group mb="md">
        <Select
          placeholder="Filter by Type"
          data={[
            { value: "", label: "All Types" },
            { value: "PLACEMENT", label: "Placement" },
            { value: "PBI", label: "PBI" },
            { value: "HIGHER STUDIES", label: "Higher Studies" },
          ]}
          value={filterType}
          onChange={setFilterType}
          clearable
          w={200}
        />
        <Select
          placeholder="Filter by Year"
          data={[
            { value: "", label: "All Years" },
            ...years.map((y) => ({ value: y, label: y })),
          ]}
          value={filterYear}
          onChange={setFilterYear}
          clearable
          w={150}
        />
        {(role === "placement officer" || role === "placement chairman") && (
          <Button onClick={() => setModalOpen(true)}>+ Add Record</Button>
        )}
      </Group>

      {stats.records.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Year</Table.Th>
              <Table.Th>CTC</Table.Th>
              <Table.Th>Test</Table.Th>
              {(role === "placement officer" ||
                role === "placement chairman") && <Table.Th>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {stats.records.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={
                      r.placement_type === "PLACEMENT"
                        ? "green"
                        : r.placement_type === "PBI"
                          ? "blue"
                          : "violet"
                    }
                  >
                    {r.placement_type}
                  </Badge>
                </Table.Td>
                <Table.Td>{r.year}</Table.Td>
                <Table.Td>{r.ctc ? `₹${r.ctc} LPA` : "-"}</Table.Td>
                <Table.Td>
                  {r.test_type ? `${r.test_type}: ${r.test_score}` : "-"}
                </Table.Td>
                {(role === "placement officer" ||
                  role === "placement chairman") && (
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </Button>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No records found.
        </Text>
      )}

      <AddRecordModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
