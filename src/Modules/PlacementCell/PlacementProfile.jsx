/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Loader,
  FileInput,
  Badge,
  Timeline,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import axios from "axios";
import {
  placementProfileRoute,
  cvDataRoute,
} from "../../routes/placementCellRoutes";
import ResumeGenerator from "./components/ResumeGenerator";
import { apiGet, getAuthHeaders } from "./api";

export default function PlacementProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [resumeModalOpened, setResumeModalOpened] = useState(false);
  const [cvData, setCvData] = useState(null);

  const form = useForm({
    initialValues: {
      about_me: "",
      linkedin_url: "",
      portfolio_url: "",
      github_url: "",
      resume: null,
    },
    validate: {
      linkedin_url: (value) =>
        value && !/^https?:\/\//.test(value) ? "Invalid URL" : null,
      github_url: (value) =>
        value && !/^https?:\/\//.test(value) ? "Invalid URL" : null,
      portfolio_url: (value) =>
        value && !/^https?:\/\//.test(value) ? "Invalid URL" : null,
      resume: (value) => {
        if (!value && !profile?.resume) return "Resume is mandatory";
        if (value) {
          const validTypes = ["application/pdf", "image/jpeg", "image/png"];
          if (!validTypes.includes(value.type))
            return "Invalid file type. Only PDF/JPG/PNG";
          if (value.size > 5 * 1024 * 1024) return "File exceeds 5MB limit";
        }
        return null;
      },
    },
  });

  const fetchProfile = async () => {
    try {
      const res = await apiGet(placementProfileRoute);
      const data = Array.isArray(res) ? res[0] : res;
      if (data) {
        setProfile(data);
        form.setValues({
          about_me: data.about_me || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
          github_url: data.github_url || "",
          resume: null,
        });
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResumeModal = async () => {
    setResumeModalOpened(true);
    if (!cvData) {
      try {
        const username = profile?.username || profile?.student; // fallback to student ID string if username mapping failed
        const res = await apiGet(`${cvDataRoute}${username}/`);
        // Merge social links from the already-loaded PlacementProfile as a fallback
        const merged = {
          ...res,
          linkedin_url: res.linkedin_url || profile?.linkedin_url || "",
          github_url: res.github_url || profile?.github_url || "",
          portfolio_url: res.portfolio_url || profile?.portfolio_url || "",
        };
        setCvData(merged);
      } catch (error) {
        console.error("Failed to load CV data", error);
        alert("Failed to load CV Data for resume generation.");
        setResumeModalOpened(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values) => {
    setSaving(true);
    const formData = new FormData();
    formData.append("about_me", values.about_me || "");
    formData.append("linkedin_url", values.linkedin_url || "");
    formData.append("portfolio_url", values.portfolio_url || "");
    formData.append("github_url", values.github_url || "");
    if (values.resume) {
      formData.append("resume", values.resume);
    }

    try {
      const url = profile?.id
        ? `${placementProfileRoute}${profile.id}/`
        : placementProfileRoute;
      const response = await axios[profile?.id ? "patch" : "post"](
        url,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setProfile(response.data);
      form.setFieldValue("resume", null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error.response?.data || error);
      alert(
        `Failed to update profile: ${JSON.stringify(
          error.response?.data || error.message,
        )}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader mt="xl" />;
  }

  return (
    <Stack spacing="xl">
      <ResumeGenerator
        opened={resumeModalOpened}
        onClose={() => setResumeModalOpened(false)}
        cvData={cvData}
      />
      <Card bg="white" shadow="sm" p="lg" radius="md" withBorder>
        <Group position="apart" mb="md">
          <Text size="xl" weight={600}>
            My Placement Profile
          </Text>
          <Button variant="light" onClick={handleOpenResumeModal}>
            Auto-generate Resume
          </Button>
        </Group>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack spacing="md">
            <Textarea
              label="About Me"
              placeholder="A brief introduction about yourself"
              minRows={4}
              {...form.getInputProps("about_me")}
            />

            <Group grow>
              <TextInput
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/username"
                {...form.getInputProps("linkedin_url")}
              />
              <TextInput
                label="GitHub URL"
                placeholder="https://github.com/username"
                {...form.getInputProps("github_url")}
              />
              <TextInput
                label="Portfolio URL"
                placeholder="https://myportfolio.com"
                {...form.getInputProps("portfolio_url")}
              />
            </Group>

            <FileInput
              label={
                profile?.resume
                  ? "Update Resume (PDF, JPG, PNG up to 5MB)"
                  : "Upload Resume (Mandatory, PDF, JPG, PNG up to 5MB)"
              }
              placeholder="Choose file"
              accept="application/pdf,image/jpeg,image/png"
              clearable
              {...form.getInputProps("resume")}
              description={
                profile?.resume && (
                  <Text size="sm" mt="xs">
                    Current Resume:{" "}
                    <a href={profile.resume} target="_blank" rel="noreferrer">
                      View Document
                    </a>
                  </Text>
                )
              }
            />

            <Button
              type="submit"
              loading={saving}
              mt="sm"
              style={{ width: "200px" }}
            >
              Save Profile
            </Button>
          </Stack>
        </form>
      </Card>

      {profile?.audit_logs?.length > 0 && (
        <Card bg="white" shadow="sm" p="lg" radius="md" withBorder>
          <Text size="lg" weight={600} mb="xl">
            Update History
          </Text>
          <Timeline
            active={profile.audit_logs.length}
            bulletSize={24}
            lineWidth={2}
          >
            {profile.audit_logs.map((log) => (
              <Timeline.Item
                key={log.id}
                title={
                  <Text weight={500}>
                    Updated by {log.changed_by_name || "Unknown"}
                  </Text>
                }
              >
                <Text color="dimmed" size="sm" mt={4} mb={8}>
                  {new Date(log.changed_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
                <Group spacing="xs" mt="xs">
                  {Object.keys(log.changes).map((field) => (
                    <Badge
                      key={field}
                      variant="light"
                      color="indigo"
                      radius="sm"
                    >
                      {field.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  ))}
                </Group>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}
    </Stack>
  );
}
