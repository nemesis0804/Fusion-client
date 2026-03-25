/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  Text,
  Badge,
  Button,
  Group,
  Loader,
  Pagination,
  Tabs,
  Modal,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Stack
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiDelete } from "../api";
import {
  placementScheduleRoute,
  placementScheduleDetailRoute,
  registrationRoute,
  formFieldsRoute
} from "../../../routes/placementCellRoutes";

function ScheduleCard({ item, role, onRefresh }) {
  const handleDelete = async () => {
    try {
      await apiDelete(`${placementScheduleDetailRoute}${item.id}/`);
      notifications.show({
        title: "Success",
        message: "Schedule deleted",
        color: "green"
      });
      onRefresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete schedule",
        color: "red"
      });
    }
  };

  const placementDate = new Date(item.placement_date);
  const isUpcoming = placementDate > new Date();
  const statusColor = isUpcoming ? "blue" : "gray";
  const statusLabel = isUpcoming ? "Upcoming" : "Past";

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="lg">
          {item.company_name || item.title}
        </Text>
        <Badge color={statusColor} variant="light">
          {statusLabel}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" mb="xs">
        {item.description}
      </Text>

      <Group gap="xs" mb="sm">
        {item.placement_type && (
          <Badge variant="outline" color="violet">
            {item.placement_type}
          </Badge>
        )}
        {item.role_st && (
          <Badge variant="outline" color="teal">
            {item.role_st}
          </Badge>
        )}
      </Group>

      <Group gap="lg" mb="sm">
        <div>
          <Text size="xs" c="dimmed">
            Date
          </Text>
          <Text size="sm" fw={500}>
            {item.placement_date}
          </Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Location
          </Text>
          <Text size="sm" fw={500}>
            {item.location || "TBD"}
          </Text>
        </div>
        {item.ctc && (
          <div>
            <Text size="xs" c="dimmed">
              CTC
            </Text>
            <Text size="sm" fw={500}>
              ₹{item.ctc} LPA
            </Text>
          </div>
        )}
      </Group>

      {(role === "placement officer" || role === "placement chairman") && (
        <Button
          color="red"
          variant="light"
          size="xs"
          onClick={handleDelete}
          mt="xs"
        >
          Delete
        </Button>
      )}
    </Card>
  );
}

function AddScheduleModal({ opened, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    company_name: "",
    placement_date: "",
    location: "",
    ctc: 0,
    time: "",
    placement_type: "PLACEMENT",
    role: "",
    description: "",
    schedule_at: ""
  });
  const [, setCompanies] = useState([]);
  const [, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) {
      Promise.all([
        apiGet(registrationRoute).catch(() => []),
        apiGet(formFieldsRoute).catch(() => ({ roles: [] })),
      ]).then(([compData, fieldData]) => {
        setCompanies(
          Array.isArray(compData)
            ? compData.map((c) => c.company_name)
            : [],
        );
        setRoles(
          fieldData.roles
            ? fieldData.roles.map((r) => r.role)
            : [],
        );
      });
    }
  }, [opened]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiPost(placementScheduleRoute, formData);
      notifications.show({
        title: "Success",
        message: "Schedule added successfully",
        color: "green"
      });
      onSuccess();
      onClose();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to add schedule",
        color: "red"
      });
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Placement Event"
      size="lg"
      centered
    >
      <Stack>
        <TextInput
          label="Company Name"
          required
          value={formData.company_name}
          onChange={(e) =>
            setFormData({ ...formData, company_name: e.target.value })
          }
        />
        <Select
          label="Placement Type"
          data={["PLACEMENT", "PBI", "HIGHER STUDIES"]}
          value={formData.placement_type}
          onChange={(val) =>
            setFormData({ ...formData, placement_type: val })
          }
        />
        <TextInput
          label="Role / Position"
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value })
          }
        />
        <Group grow>
          <TextInput
            label="Placement Date"
            type="date"
            required
            value={formData.placement_date}
            onChange={(e) =>
              setFormData({ ...formData, placement_date: e.target.value })
            }
          />
          <TextInput
            label="Time"
            type="time"
            value={formData.time}
            onChange={(e) =>
              setFormData({ ...formData, time: e.target.value })
            }
          />
        </Group>
        <TextInput
          label="Location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />
        <NumberInput
          label="CTC (LPA)"
          value={formData.ctc}
          onChange={(val) => setFormData({ ...formData, ctc: val })}
          min={0}
          decimalScale={2}
        />
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Add Schedule
        </Button>
      </Stack>
    </Modal>
  );
}

export default function PlacementSchedule({ role }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet(placementScheduleRoute);
      setData(Array.isArray(res) ? res : []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch schedules",
        color: "red"
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeEvents = data.filter(
    (e) => new Date(e.placement_date) >= new Date(),
  );
  const pastEvents = data.filter(
    (e) => new Date(e.placement_date) < new Date(),
  );

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
          Placement Events
        </Text>
        {(role === "placement officer" || role === "placement chairman") && (
          <Button onClick={() => setModalOpen(true)}>
            + Add Event
          </Button>
        )}
      </Group>

      <Tabs defaultValue="upcoming" variant="pills">
        <Tabs.List mb="md">
          <Tabs.Tab value="upcoming">
            Upcoming ({activeEvents.length})
          </Tabs.Tab>
          <Tabs.Tab value="past">Past ({pastEvents.length})</Tabs.Tab>
          <Tabs.Tab value="all">All ({data.length})</Tabs.Tab>
        </Tabs.List>

        {["upcoming", "past", "all"].map((tab) => {
          const items =
            tab === "upcoming"
              ? activeEvents
              : tab === "past"
                ? pastEvents
                : data;
          const paged = items.slice(
            (activePage - 1) * itemsPerPage,
            activePage * itemsPerPage,
          );
          return (
            <Tabs.Panel value={tab} key={tab}>
              {items.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No {tab} events found.
                </Text>
              ) : (
                <>
                  <Grid gutter="lg">
                    {paged.map((item) => (
                      <Grid.Col
                        key={item.id}
                        span={{ base: 12, sm: 6, lg: 4 }}
                      >
                        <ScheduleCard
                          item={item}
                          role={role}
                          onRefresh={fetchData}
                        />
                      </Grid.Col>
                    ))}
                  </Grid>
                  {items.length > itemsPerPage && (
                    <Group justify="center" mt="lg">
                      <Pagination
                        total={Math.ceil(items.length / itemsPerPage)}
                        value={activePage}
                        onChange={setActivePage}
                      />
                    </Group>
                  )}
                </>
              )}
            </Tabs.Panel>
          );
        })}
      </Tabs>

      <AddScheduleModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
