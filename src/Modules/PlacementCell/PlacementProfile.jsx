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
  Badge,
  Timeline,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import axios from "axios";
import {
  placementProfileRoute,
  cvDataRoute,
} from "../../routes/placementCellRoutes";
import ResumeGenerator from "./components/ResumeGenerator";
import MyPlacementClaims from "./MyPlacementClaims.jsx";
import { apiGet, getAuthHeaders } from "./api";

// Fields that must be filled before a student can apply for any posting.
const REQUIRED_FOR_APPLY = ["professional_email", "linkedin_url", "github_url"];

const FIELD_LABELS = {
  professional_email: "Professional Email",
  linkedin_url: "LinkedIn URL",
  github_url: "GitHub URL",
};

export default function PlacementProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [resumeModalOpened, setResumeModalOpened] = useState(false);
  const [cvData, setCvData] = useState(null);

  const form = useForm({
    initialValues: {
      about_me: "",
      professional_email: "",
      linkedin_url: "",
      portfolio_url: "",
      github_url: "",
    },
    validate: {
      professional_email: (value) =>
        value && !/^\S+@\S+\.\S+$/.test(value) ? "Invalid email" : null,
      linkedin_url: (value) =>
        value && !/^https?:\/\//.test(value) ? "Invalid URL" : null,
      github_url: (value) =>
        value && !/^https?:\/\//.test(value) ? "Invalid URL" : null,
      portfolio_url: (value) =>
        value && !/^https?:\/\//.test(value) ? "Invalid URL" : null,
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
          professional_email: data.professional_email || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
          github_url: data.github_url || "",
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
        const username = profile?.username || profile?.student;
        const res = await apiGet(`${cvDataRoute}${username}/`);
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
    // JSON payload — resume is no longer edited from this page (managed in
    // the dedicated "My Resumes" tab), so we drop the multipart upload path.
    const payload = {
      about_me: values.about_me || "",
      professional_email: values.professional_email || "",
      linkedin_url: values.linkedin_url || "",
      portfolio_url: values.portfolio_url || "",
      github_url: values.github_url || "",
    };

    try {
      const url = profile?.id
        ? `${placementProfileRoute}${profile.id}/`
        : placementProfileRoute;
      const response = await axios[profile?.id ? "patch" : "post"](
        url,
        payload,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        },
      );
      setProfile(response.data);
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

  const missingFields =
    profile?.missing_required_fields ??
    REQUIRED_FOR_APPLY.filter((f) => !profile?.[f]);
  const isComplete = profile?.is_complete ?? missingFields.length === 0;

  return (
    <Stack spacing="xl">
      <ResumeGenerator
        opened={resumeModalOpened}
        onClose={() => setResumeModalOpened(false)}
        cvData={cvData}
      />

      {!isComplete && (
        <Alert color="yellow" title="Profile incomplete" radius="md">
          You need to fill in the following fields before you can apply for any
          job posting:{" "}
          <Text component="span" fw={600}>
            {missingFields.map((f) => FIELD_LABELS[f] || f).join(", ")}
          </Text>
          .
        </Alert>
      )}

      {profile?.apply_override && (
        <Alert color="blue" title="Apply override active" radius="md">
          The TPO has granted you an override allowing you to continue applying
          even after being marked placed/interning.
          {profile.apply_override_remarks ? (
            <Text size="sm" mt={4} fs="italic">
              Note: {profile.apply_override_remarks}
            </Text>
          ) : null}
        </Alert>
      )}

      <MyPlacementClaims />

      <Card bg="white" shadow="sm" p="lg" radius="md" withBorder>
        <Group position="apart" mb="md">
          <Group>
            <Text size="xl" weight={600}>
              My Placement Profile
            </Text>
            {isComplete ? (
              <Badge color="green" variant="light">
                Ready to apply
              </Badge>
            ) : (
              <Badge color="yellow" variant="light">
                Incomplete
              </Badge>
            )}
          </Group>
          <Button variant="light" onClick={handleOpenResumeModal}>
            Auto-generate Resume
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Your resumes are managed separately under the{" "}
          <Text span fw={600}>
            My Resumes
          </Text>{" "}
          tab. Contact details (LinkedIn, GitHub, Professional Email) entered
          here are automatically attached to every application you submit.
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack spacing="md">
            <Textarea
              label="About Me"
              placeholder="A brief introduction about yourself"
              minRows={4}
              {...form.getInputProps("about_me")}
            />

            <TextInput
              label="Professional Email"
              required
              placeholder="firstname.lastname@example.com"
              description="Used as the contact email on every job application"
              {...form.getInputProps("professional_email")}
            />

            <Group grow>
              <TextInput
                label="LinkedIn URL"
                required
                placeholder="https://linkedin.com/in/username"
                {...form.getInputProps("linkedin_url")}
              />
              <TextInput
                label="GitHub URL"
                required
                placeholder="https://github.com/username"
                {...form.getInputProps("github_url")}
              />
              <TextInput
                label="Portfolio URL (optional)"
                placeholder="https://myportfolio.com"
                {...form.getInputProps("portfolio_url")}
              />
            </Group>

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
