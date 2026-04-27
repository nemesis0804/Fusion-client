import React, { useEffect, useState } from "react";
import {
  Card,
  Stack,
  Group,
  Text,
  TextInput,
  Button,
  Loader,
  Badge,
  Modal,
  Tooltip,
  Anchor,
  Switch,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiPatch, apiDelete } from "./api.js";
import { studentResumesRoute } from "../../routes/placementCellRoutes/index.jsx";

const MAX_RESUMES = 4;

export default function MyResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", url: "", is_default: false });
  const [saving, setSaving] = useState(false);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await apiGet(studentResumesRoute);
      const list = Array.isArray(res) ? res : res.results || [];
      setResumes(list);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch resumes",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", url: "", is_default: resumes.length === 0 });
    setModalOpen(true);
  };

  const openEdit = (resume) => {
    setEditing(resume);
    setForm({
      name: resume.name,
      url: resume.url,
      is_default: !!resume.is_default,
    });
    setModalOpen(true);
  };

  const validate = () => {
    if (!form.name.trim()) return "Resume name is required.";
    if (!form.url.trim()) return "Resume URL is required.";
    try {
      // eslint-disable-next-line no-new
      new URL(form.url);
    } catch {
      return "Please enter a valid URL.";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      notifications.show({ title: "Invalid", message: err, color: "red" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`${studentResumesRoute}${editing.id}/`, form);
      } else {
        await apiPost(studentResumesRoute, form);
      }
      notifications.show({
        title: "Saved",
        message: "Resume saved successfully",
        color: "green",
      });
      setModalOpen(false);
      fetchResumes();
    } catch (e) {
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.error ||
        "Failed to save resume";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
    setSaving(false);
  };

  const handleDelete = async (resume) => {
    if (!window.confirm(`Delete resume "${resume.name}"?`)) return;
    try {
      await apiDelete(`${studentResumesRoute}${resume.id}/`);
      fetchResumes();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete resume",
        color: "red",
      });
    }
  };

  const handleMakeDefault = async (resume) => {
    try {
      await apiPost(`${studentResumesRoute}${resume.id}/make_default/`, {});
      fetchResumes();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to set default",
        color: "red",
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Text fw={600} size="xl">
            My Resumes
          </Text>
          <Text size="sm" c="dimmed">
            Save up to {MAX_RESUMES} resumes (Google Drive / external links).
            Pick one when applying to a job.
          </Text>
        </div>
        <Button onClick={openCreate} disabled={resumes.length >= MAX_RESUMES}>
          + Add Resume
        </Button>
      </Group>

      {resumes.length === 0 ? (
        <Card withBorder p="lg" radius="md">
          <Text c="dimmed" ta="center">
            You have not added any resumes yet.
          </Text>
        </Card>
      ) : (
        resumes.map((r) => (
          <Card key={r.id} withBorder padding="md" radius="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={4} style={{ flex: 1 }}>
                <Group gap="xs">
                  <Text fw={600}>{r.name}</Text>
                  {r.is_default && (
                    <Badge color="green" variant="light">
                      Default
                    </Badge>
                  )}
                </Group>
                <Anchor
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  style={{ wordBreak: "break-all" }}
                >
                  {r.url}
                </Anchor>
              </Stack>
              <Group gap="xs">
                {!r.is_default && (
                  <Tooltip label="Make default">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => handleMakeDefault(r)}
                    >
                      Set default
                    </Button>
                  </Tooltip>
                )}
                <Button size="xs" variant="light" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={() => handleDelete(r)}
                >
                  Delete
                </Button>
              </Group>
            </Group>
          </Card>
        ))
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Resume" : "Add Resume"}
        centered
      >
        <Stack>
          <TextInput
            label="Resume Name"
            placeholder="e.g. Backend Resume"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextInput
            label="Resume URL"
            placeholder="https://drive.google.com/..."
            required
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <Switch
            label="Set as default"
            checked={form.is_default}
            onChange={(e) =>
              setForm({ ...form, is_default: e.currentTarget.checked })
            }
          />
          <Button onClick={handleSave} loading={saving}>
            {editing ? "Save Changes" : "Add Resume"}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
