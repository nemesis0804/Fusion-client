/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
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
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Anchor,
  SegmentedControl,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconExternalLink,
  IconLink,
  IconPin,
  IconSearch,
  IconTrash,
  IconRefresh,
  IconLayoutGrid,
  IconList,
} from "@tabler/icons-react";
import { apiGet, apiPost, apiDelete } from "./api.js";
import { announcementsRoute } from "../../routes/placementCellRoutes/index.jsx";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const TYPE_COLORS = {
  GENERAL: "blue",
  PLACEMENT_DRIVE: "green",
  COMPANY_VISIT: "grape",
  TRAINING_SESSION: "cyan",
  INTERNSHIP: "violet",
  WORKSHOP: "orange",
};

const TYPE_LABELS = {
  GENERAL: "General",
  PLACEMENT_DRIVE: "Placement Drive",
  COMPANY_VISIT: "Company Visit",
  TRAINING_SESSION: "Training",
  INTERNSHIP: "Internship",
  WORKSHOP: "Workshop",
};

// Pastel paper-tones used as the noticeboard "sticky note" backgrounds. Each
// note picks a stable colour based on its id so the board feels alive while
// avoiding flicker between renders.
const NOTE_TONES = [
  { bg: "#FFF8E1", border: "#FFE082" }, // amber
  { bg: "#E8F5E9", border: "#A5D6A7" }, // green
  { bg: "#E3F2FD", border: "#90CAF9" }, // blue
  { bg: "#F3E5F5", border: "#CE93D8" }, // purple
  { bg: "#FCE4EC", border: "#F48FB1" }, // pink
  { bg: "#E0F7FA", border: "#80DEEA" }, // teal
  { bg: "#FFF3E0", border: "#FFCC80" }, // orange
];

const HIGH_PRIORITY_TONE = { bg: "#FFEBEE", border: "#EF9A9A" };

const pickTone = (item) => {
  if (item.priority === "HIGH") return HIGH_PRIORITY_TONE;
  const seed =
    typeof item.id === "number"
      ? item.id
      : String(item.id || item.title || "").length;
  return NOTE_TONES[seed % NOTE_TONES.length];
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ---------------------------------------------------------------------------
// Create modal
// ---------------------------------------------------------------------------

function CreateNoticeModal({ opened, onClose, onSuccess }) {
  const blankForm = {
    title: "",
    content: "",
    announcement_type: "GENERAL",
    notice_type: "GENERAL",
    priority: "NORMAL",
    visibility_scope: "ALL",
    visibility_targets: "",
    target_audience: "",
    publish_at: "",
    expires_at: "",
    attachment_link: "",
    attachment_label: "",
  };
  const [formData, setFormData] = useState(blankForm);
  const [loading, setLoading] = useState(false);

  const toIsoFromLocal = (value) =>
    value ? new Date(value).toISOString() : null;

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      notifications.show({
        title: "Missing fields",
        message: "Title and content are required.",
        color: "red",
      });
      return;
    }
    if (
      formData.attachment_link &&
      !/^https?:\/\//i.test(formData.attachment_link.trim())
    ) {
      notifications.show({
        title: "Invalid link",
        message: "Attachment link must start with http:// or https://",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        announcement_type: formData.announcement_type,
        notice_type: formData.notice_type,
        priority: formData.priority,
        visibility_scope: formData.visibility_scope,
        visibility_targets: formData.visibility_targets || "",
        target_audience: formData.target_audience || "",
        publish_at:
          toIsoFromLocal(formData.publish_at) || new Date().toISOString(),
        expires_at: toIsoFromLocal(formData.expires_at),
        attachment_link: formData.attachment_link.trim() || null,
        attachment_label: formData.attachment_label.trim() || null,
      };
      await apiPost(announcementsRoute, payload);
      notifications.show({
        title: "Posted",
        message: "Notice published",
        color: "green",
      });
      onSuccess();
      onClose();
      setFormData(blankForm);
    } catch (err) {
      const data = err.response?.data;
      let msg = "Failed to publish notice";
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
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Notice"
      size="lg"
      centered
    >
      <Stack>
        <TextInput
          label="Title"
          required
          value={formData.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <Group grow>
          <Select
            label="Notice Type"
            data={[
              { value: "PLACEMENT", label: "Placement" },
              { value: "POLICY", label: "Policy" },
              { value: "GENERAL", label: "General" },
            ]}
            value={formData.notice_type}
            onChange={(val) => set({ notice_type: val || "GENERAL" })}
          />
          <Select
            label="Category"
            data={Object.entries(TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            value={formData.announcement_type}
            onChange={(val) => set({ announcement_type: val || "GENERAL" })}
          />
        </Group>
        <Group grow>
          <Select
            label="Priority"
            data={[
              { value: "HIGH", label: "High (pinned)" },
              { value: "NORMAL", label: "Normal" },
            ]}
            value={formData.priority}
            onChange={(val) => set({ priority: val || "NORMAL" })}
          />
          <Select
            label="Visibility"
            data={[
              { value: "ALL", label: "All students" },
              { value: "SPECIFIC_BATCH", label: "Specific batch" },
            ]}
            value={formData.visibility_scope}
            onChange={(val) => set({ visibility_scope: val || "ALL" })}
          />
        </Group>
        {formData.visibility_scope === "SPECIFIC_BATCH" && (
          <TextInput
            label="Visibility Targets"
            placeholder="e.g. 2026, 2027"
            value={formData.visibility_targets}
            onChange={(e) => set({ visibility_targets: e.target.value })}
          />
        )}
        <TextInput
          label="Target Audience (display)"
          placeholder="e.g. B.Tech 2025, All"
          value={formData.target_audience}
          onChange={(e) => set({ target_audience: e.target.value })}
        />
        <Group grow>
          <TextInput
            label="Publish At"
            type="datetime-local"
            value={formData.publish_at}
            onChange={(e) => set({ publish_at: e.target.value })}
          />
          <TextInput
            label="Expiry At"
            type="datetime-local"
            value={formData.expires_at}
            onChange={(e) => set({ expires_at: e.target.value })}
          />
        </Group>
        <Textarea
          label="Content"
          required
          autosize
          minRows={4}
          maxRows={10}
          value={formData.content}
          onChange={(e) => set({ content: e.target.value })}
        />
        <Divider label="Optional attachment" labelPosition="left" />
        <Group grow>
          <TextInput
            label="Attachment Link"
            placeholder="https://drive.google.com/…"
            description="Paste a link to any external doc/JD/form. File uploads are not supported."
            leftSection={<IconLink size={14} />}
            value={formData.attachment_link}
            onChange={(e) => set({ attachment_link: e.target.value })}
          />
          <TextInput
            label="Link Label (optional)"
            placeholder="e.g. Registration form"
            value={formData.attachment_label}
            onChange={(e) => set({ attachment_label: e.target.value })}
          />
        </Group>
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Publish
        </Button>
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Single notice card (sticky note styling for grid; row styling for list)
// ---------------------------------------------------------------------------

function NoticeCard({ notice, layout, isOfficer, isUnread, onOpen, onDelete }) {
  const tone = pickTone(notice);
  const isHigh = notice.priority === "HIGH";

  const stylePropsGrid = {
    backgroundColor: tone.bg,
    borderColor: tone.border,
    borderWidth: 1,
    borderStyle: "solid",
    cursor: "pointer",
    height: "100%",
    transition:
      "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease",
  };

  const stylePropsList = {
    backgroundColor: "var(--mantine-color-body)",
    cursor: "pointer",
  };

  const handleAttachmentClick = (e) => {
    e.stopPropagation();
    if (!notice.attachment_link) return;
    window.open(notice.attachment_link, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      shadow={isHigh ? "md" : "xs"}
      padding={layout === "grid" ? "md" : "sm"}
      radius="md"
      withBorder
      onClick={onOpen}
      onMouseEnter={(e) => {
        if (layout === "grid") {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (layout === "grid") {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "";
        }
      }}
      style={layout === "grid" ? stylePropsGrid : stylePropsList}
    >
      <Stack gap={6} h="100%">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap={6} wrap="nowrap">
            {isHigh && (
              <Tooltip label="Pinned (High Priority)">
                <IconPin size={16} color="#c92a2a" />
              </Tooltip>
            )}
            <Text fw={600} size="sm" lineClamp={2}>
              {notice.title}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap">
            {isUnread && (
              <Badge color="green" size="xs">
                New
              </Badge>
            )}
            {isOfficer && (
              <Tooltip label="Remove notice">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notice.id);
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <Group gap={4}>
          <Badge
            size="xs"
            variant="light"
            color={TYPE_COLORS[notice.announcement_type] || "blue"}
          >
            {TYPE_LABELS[notice.announcement_type] || notice.announcement_type}
          </Badge>
          {notice.notice_type && notice.notice_type !== "GENERAL" && (
            <Badge size="xs" variant="outline">
              {notice.notice_type}
            </Badge>
          )}
          {notice.target_audience && (
            <Badge size="xs" variant="dot">
              {notice.target_audience}
            </Badge>
          )}
        </Group>

        <Text
          size="xs"
          c="dimmed"
          lineClamp={layout === "grid" ? 4 : 2}
          style={{ whiteSpace: "pre-wrap", flex: 1 }}
        >
          {notice.content}
        </Text>

        <Group gap={6} mt={4} justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            {formatDate(notice.publish_at || notice.created_at)}
            {notice.created_by_name ? ` • ${notice.created_by_name}` : ""}
          </Text>
          {notice.attachment_link && (
            <Tooltip label={notice.attachment_label || "Open attached link"}>
              <ActionIcon
                variant="light"
                size="sm"
                onClick={handleAttachmentClick}
              >
                <IconExternalLink size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

function NoticeDetailModal({ notice, onClose, isOfficer, onDelete }) {
  if (!notice) return null;
  const tone = pickTone(notice);
  return (
    <Modal
      opened={!!notice}
      onClose={onClose}
      title={
        <Group gap={6}>
          {notice.priority === "HIGH" && <IconPin size={16} color="#c92a2a" />}
          <Text fw={600}>{notice.title}</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Box
        p="md"
        style={{
          backgroundColor: tone.bg,
          border: `1px solid ${tone.border}`,
          borderRadius: 8,
        }}
      >
        <Group gap={6} mb="sm">
          <Badge
            size="sm"
            variant="light"
            color={TYPE_COLORS[notice.announcement_type] || "blue"}
          >
            {TYPE_LABELS[notice.announcement_type] || notice.announcement_type}
          </Badge>
          <Badge size="sm" variant="outline">
            {notice.notice_type}
          </Badge>
          {notice.target_audience && (
            <Badge size="sm" variant="dot">
              {notice.target_audience}
            </Badge>
          )}
        </Group>
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {notice.content}
        </Text>
        {notice.attachment_link && (
          <Group mt="md" gap={6}>
            <IconLink size={14} />
            <Anchor
              href={notice.attachment_link}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              {notice.attachment_label || notice.attachment_link}
            </Anchor>
          </Group>
        )}
      </Box>
      <Group mt="md" gap="sm">
        <Text size="xs" c="dimmed">
          Published {formatDateTime(notice.publish_at || notice.created_at)}
          {notice.created_by_name ? ` • By ${notice.created_by_name}` : ""}
        </Text>
        {notice.expires_at && (
          <Text size="xs" c="dimmed">
            • Expires {formatDate(notice.expires_at)}
          </Text>
        )}
      </Group>
      {isOfficer && (
        <Group mt="md" justify="flex-end">
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={() => onDelete(notice.id)}
          >
            Remove notice
          </Button>
        </Group>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Top-level page
// ---------------------------------------------------------------------------

export default function Announcements({ role }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [layout, setLayout] = useState("grid");
  const [localRead, setLocalRead] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("placementNoticeRead") || "[]");
    } catch {
      return [];
    }
  });

  const saveReadState = (next) => {
    setLocalRead(next);
    localStorage.setItem("placementNoticeRead", JSON.stringify(next));
  };

  const normalizeItems = (items) =>
    items.map((item) => ({
      ...item,
      notice_type: item.notice_type || "GENERAL",
      priority:
        item.priority ||
        (item.announcement_type === "URGENT" ? "HIGH" : "NORMAL"),
      publish_at: item.publish_at || item.created_at,
      visibility_scope: item.visibility_scope || "ALL",
    }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet(announcementsRoute);
      const payload = Array.isArray(res) ? res : res.results || [];
      setAnnouncements(normalizeItems(payload));
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load notices",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isNewNotice = (notice) => {
    const createdAt = new Date(
      notice.created_at || notice.publish_at,
    ).getTime();
    return Date.now() - createdAt <= 48 * 60 * 60 * 1000;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return announcements.filter((notice) => {
      if (typeFilter !== "ALL" && notice.notice_type !== typeFilter)
        return false;
      if (!q) return true;
      return (
        String(notice.title || "")
          .toLowerCase()
          .includes(q) ||
        String(notice.content || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [announcements, query, typeFilter]);

  const pinned = useMemo(
    () => filtered.filter((item) => item.priority === "HIGH"),
    [filtered],
  );
  const regular = useMemo(
    () => filtered.filter((item) => item.priority !== "HIGH"),
    [filtered],
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this notice?")) return;
    try {
      await apiDelete(`${announcementsRoute}${id}/`);
      notifications.show({
        title: "Removed",
        message: "Notice removed from the board",
        color: "green",
      });
      setActiveNotice(null);
      fetchData();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove notice",
        color: "red",
      });
    }
  };

  const handleOpenNotice = (notice) => {
    setActiveNotice(notice);
    if (!localRead.includes(notice.id)) {
      saveReadState([...localRead, notice.id]);
    }
  };

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  const renderSection = (items) => {
    if (items.length === 0) return null;
    if (layout === "list") {
      return (
        <Stack gap="xs">
          {items.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              layout="list"
              isOfficer={isOfficer}
              isUnread={isNewNotice(notice) && !localRead.includes(notice.id)}
              onOpen={() => handleOpenNotice(notice)}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      );
    }
    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
        spacing="md"
        verticalSpacing="md"
      >
        {items.map((notice) => (
          <NoticeCard
            key={notice.id}
            notice={notice}
            layout="grid"
            isOfficer={isOfficer}
            isUnread={isNewNotice(notice) && !localRead.includes(notice.id)}
            onOpen={() => handleOpenNotice(notice)}
            onDelete={handleDelete}
          />
        ))}
      </SimpleGrid>
    );
  };

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
            Noticeboard
          </Text>
          <Text size="sm" c="dimmed">
            Pinned notes appear first. Click any notice to read in full.
          </Text>
        </Stack>
        <Group gap="sm">
          <Tooltip label="Reload">
            <ActionIcon variant="light" onClick={fetchData}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <SegmentedControl
            value={layout}
            onChange={setLayout}
            data={[
              {
                value: "grid",
                label: (
                  <Box display="flex" style={{ alignItems: "center", gap: 6 }}>
                    <IconLayoutGrid size={14} />
                    <span>Board</span>
                  </Box>
                ),
              },
              {
                value: "list",
                label: (
                  <Box display="flex" style={{ alignItems: "center", gap: 6 }}>
                    <IconList size={14} />
                    <span>List</span>
                  </Box>
                ),
              },
            ]}
            size="xs"
          />
          {isOfficer && (
            <Button onClick={() => setCreateOpen(true)}>+ New Notice</Button>
          )}
        </Group>
      </Group>

      <Group mb="lg" wrap="wrap">
        <TextInput
          leftSection={<IconSearch size={14} />}
          placeholder="Search notices"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          w={300}
        />
        <Select
          value={typeFilter}
          onChange={(val) => setTypeFilter(val || "ALL")}
          data={[
            { value: "ALL", label: "All types" },
            { value: "PLACEMENT", label: "Placement" },
            { value: "POLICY", label: "Policy" },
            { value: "GENERAL", label: "General" },
          ]}
          w={180}
        />
      </Group>

      {filtered.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">No notices match your filters.</Text>
        </Card>
      ) : (
        <Stack gap="xl">
          {pinned.length > 0 && (
            <div>
              <Group gap={6} mb="sm">
                <IconPin size={16} color="#c92a2a" />
                <Text fw={600} size="sm" c="red">
                  Pinned
                </Text>
              </Group>
              {renderSection(pinned)}
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <Text fw={600} size="sm" c="dimmed" mb="sm">
                  All notices
                </Text>
              )}
              {renderSection(regular)}
            </div>
          )}
        </Stack>
      )}

      <CreateNoticeModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchData}
      />

      <NoticeDetailModal
        notice={activeNotice}
        onClose={() => setActiveNotice(null)}
        isOfficer={isOfficer}
        onDelete={handleDelete}
      />
    </div>
  );
}
