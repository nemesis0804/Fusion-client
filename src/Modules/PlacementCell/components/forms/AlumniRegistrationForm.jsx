import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  FileInput,
  Group,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";

function AlumniRegistrationForm() {
  const [profileState, setProfileState] = useState(null);
  const [form, setForm] = useState({
    graduation_year: "",
    degree: "",
    current_company: "",
    current_designation: "",
    linkedin_url: "",
    topics: "",
    availability: "",
    bio: "",
    mentorship_enabled: false,
    verification_document: null,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await placementApi.getAlumniProfile();
        setProfileState(response.data);
        if (response.data.profile) {
          const { profile } = response.data;
          setForm((prev) => ({
            ...prev,
            graduation_year: profile.graduation_year || "",
            degree: profile.degree || "",
            current_company: profile.current_company || "",
            current_designation: profile.current_designation || "",
            linkedin_url: profile.linkedin_url || "",
            topics: (profile.topics || []).join(", "),
            availability: profile.availability || "",
            bio: profile.bio || "",
            mentorship_enabled: profile.mentorship_enabled || false,
          }));
        }
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Failed to load alumni profile.",
          color: "red",
        });
      }
    }

    loadProfile();
  }, []);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        payload.append(key, value);
      }
    });

    try {
      const response = profileState?.profile
        ? await placementApi.updateAlumniProfile(payload)
        : await placementApi.saveAlumniProfile(payload);
      setProfileState((prev) => ({
        ...(prev || {}),
        profile: response.data,
        can_access: response.data.status === "approved",
      }));
      notifications.show({
        title: "Saved",
        message:
          response.data.status === "approved"
            ? "Your alumni profile was updated."
            : "Your alumni request was submitted for verification.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail ||
          "Could not save alumni registration details.",
        color: "red",
      });
    }
  };

  const profile = profileState?.profile;

  return (
    <Card shadow="sm" radius="md" padding="lg">
      <Stack>
        <div>
          <Title order={2}>Alumni Registration & Mentorship</Title>
          <Text c="dimmed" size="sm">
            Submit your alumni verification details, then manage your mentorship
            profile once approved.
          </Text>
        </div>

        {profile && (
          <Card withBorder radius="md" padding="md">
            <Text fw={600}>Verification Status</Text>
            <Text c="dimmed" size="sm">
              {profile.status === "approved"
                ? "Approved. Alumni access is active."
                : profile.status === "rejected"
                  ? "Rejected. Update your details and resubmit."
                  : "Pending TPO verification."}
            </Text>
            {profile.verification_notes ? (
              <Text size="sm" mt="xs">
                Notes: {profile.verification_notes}
              </Text>
            ) : null}
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Graduation Year"
              value={form.graduation_year}
              onChange={(e) => setField("graduation_year", e.target.value)}
              required
            />
            <TextInput
              label="Degree / Programme"
              value={form.degree}
              onChange={(e) => setField("degree", e.target.value)}
              required
            />
            <TextInput
              label="Current Company"
              value={form.current_company}
              onChange={(e) => setField("current_company", e.target.value)}
            />
            <TextInput
              label="Current Designation"
              value={form.current_designation}
              onChange={(e) => setField("current_designation", e.target.value)}
            />
            <TextInput
              label="LinkedIn URL"
              value={form.linkedin_url}
              onChange={(e) => setField("linkedin_url", e.target.value)}
            />
            <Textarea
              label="Bio"
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              minRows={3}
            />
            <TextInput
              label="Mentorship Topics"
              description="Comma-separated topics, for example: Resume reviews, Career transitions"
              value={form.topics}
              onChange={(e) => setField("topics", e.target.value)}
            />
            <TextInput
              label="Availability"
              placeholder="Weekends, 7-9 PM IST"
              value={form.availability}
              onChange={(e) => setField("availability", e.target.value)}
            />
            <Switch
              label="Open to mentorship requests"
              checked={form.mentorship_enabled}
              onChange={(e) =>
                setField("mentorship_enabled", e.currentTarget.checked)
              }
            />
            <FileInput
              label="Verification Document"
              placeholder="Upload alumni proof"
              value={form.verification_document}
              onChange={(value) => setField("verification_document", value)}
            />
            <Group justify="flex-end">
              <Button type="submit">
                {profile ? "Save Alumni Profile" : "Submit for Verification"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}

export default AlumniRegistrationForm;
