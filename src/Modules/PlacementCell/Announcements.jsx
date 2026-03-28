/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Loader,
  Button,
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiDelete } from "./api.js";
import { announcementsRoute } from "../../routes/placementCellRoutes/index.jsx";

function CreateAnnouncementModal({ opened, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    announcement_type: "GENERAL",
    target_audience: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiPost(announcementsRoute, formData);
      notifications.show({
        title: "Success",
        message: "Announcement created",
        color: "green",
      });
      onSuccess();
      onClose();
      setFormData({
        title: "",
        content: "",
        announcement_type: "GENERAL",
        target_audience: "",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create announcement",
        color: "red",
      });
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Announcement"
      size="lg"
      centered
    >
      <Stack>
        <TextInput
          label="Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <Group grow>
          <Select
            label="Type"
            data={[
              "GENERAL",
              "URGENT",
              "PLACEMENT_DRIVE",
              "INTERNSHIP",
              "RESULT",
              "SCHEDULE",
            ]}
            value={formData.announcement_type}
            onChange={(val) =>
              setFormData({ ...formData, announcement_type: val })
            }
          />
          <TextInput
            label="Target Audience"
            placeholder="e.g. B.Tech 2025, All"
            value={formData.target_audience}
            onChange={(e) =>
              setFormData({ ...formData, target_audience: e.target.value })
            }
          />
        </Group>
        <Textarea
          label="Content"
          required
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          rows={5}
        />
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Publish
        </Button>
      </Stack>
    </Modal>
  );
}

const TYPE_COLORS = {
  GENERAL: "blue",
  URGENT: "red",
  PLACEMENT_DRIVE: "green",
  INTERNSHIP: "violet",
  RESULT: "teal",
  SCHEDULE: "orange",
};

export default function Announcements({ role }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchData = async () => {
    try {
      const res = await apiGet(announcementsRoute);
      setAnnouncements(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load announcements",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this announcement?")) return;
    try {
      await apiDelete(`${announcementsRoute}${id}/`);
      notifications.show({
        title: "Success",
        message: "Announcement removed",
        color: "green",
      });
      fetchData();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete",
        color: "red",
      });
    }
  };

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

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
          Announcements
        </Text>
        {isOfficer && (
          <Button onClick={() => setCreateOpen(true)}>
            + New Announcement
          </Button>
        )}
      </Group>

      {announcements.length > 0 ? (
        <Stack gap="sm">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              shadow="xs"
              padding="md"
              radius="md"
              withBorder
              style={{ cursor: "pointer" }}
              onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
            >
              <Group justify="space-between" mb={4}>
                <Text fw={600} size="md">
                  {ann.title}
                </Text>
                <Group gap={6}>
                  <Badge
                    color={TYPE_COLORS[ann.announcement_type] || "blue"}
                    variant="light"
                    size="sm"
                  >
                    {ann.announcement_type}
                  </Badge>
                  {ann.target_audience && (
                    <Badge variant="outline" size="sm">
                      {ann.target_audience}
                    </Badge>
                  )}
                </Group>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  {new Date(ann.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {ann.created_by_name && (
                  <Text size="xs" c="dimmed">
                    • By {ann.created_by_name}
                  </Text>
                )}
              </Group>
              {expanded === ann.id ? (
                <>
                  <Divider my="sm" />
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {ann.content}
                  </Text>
                  {isOfficer && (
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      mt="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ann.id);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </>
              ) : (
                <Text size="sm" c="dimmed" mt={4} lineClamp={2}>
                  {ann.content}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      ) : (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">No announcements at the moment.</Text>
        </Card>
      )}

      <CreateAnnouncementModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
