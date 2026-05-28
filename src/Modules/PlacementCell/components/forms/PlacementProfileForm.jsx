import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Divider,
  FileInput,
  Group,
  List,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_no: "",
  address: "",
  about_me: "",
};

function getDocumentError(file) {
  if (!file) {
    return "";
  }
  const fileName = file.name?.toLowerCase() || "";
  if (!allowedExtensions.some((extension) => fileName.endsWith(extension))) {
    return "Only PDF, JPG, JPEG, and PNG files are allowed.";
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return "Document size must be 5MB or less.";
  }
  return "";
}

function validateProfile(form) {
  const nextErrors = {};
  if (!form.first_name.trim()) {
    nextErrors.first_name = "First name is required.";
  }
  if (!form.last_name.trim()) {
    nextErrors.last_name = "Last name is required.";
  }
  if (!form.email.trim()) {
    nextErrors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    nextErrors.email = "Enter a valid email address.";
  }
  const phoneDigits = form.phone_no.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    nextErrors.phone_no = "Enter a valid 10-digit phone number.";
  }
  if (!form.address.trim()) {
    nextErrors.address = "Address is required.";
  }
  if (!form.about_me.trim()) {
    nextErrors.about_me = "About me is required.";
  }
  return nextErrors;
}

function formatTimestamp(value) {
  if (!value) {
    return "Just now";
  }
  return new Date(value).toLocaleString();
}

function PlacementProfileForm() {
  const [profileState, setProfileState] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const visibleErrors = useMemo(() => {
    const nextErrors = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (touched[key]) {
        nextErrors[key] = value;
      }
    });
    return nextErrors;
  }, [errors, touched]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await placementApi.getPlacementProfile();
      setProfileState(response.data);
      setForm({
        first_name: response.data.profile?.first_name || "",
        last_name: response.data.profile?.last_name || "",
        email: response.data.profile?.email || "",
        phone_no: response.data.profile?.phone_no || "",
        address: response.data.profile?.address || "",
        about_me: response.data.profile?.about_me || "",
      });
      setErrors(validateProfile(response.data.profile || emptyForm));
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load placement profile.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFieldChange = (field, value) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateProfile(nextForm));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const nextErrors = validateProfile(form);
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      phone_no: true,
      address: true,
      about_me: true,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      notifications.show({
        title: "Validation failed",
        message:
          "Fix the highlighted fields before saving the placement profile.",
        color: "red",
      });
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));

    setSaving(true);
    try {
      const response = await placementApi.savePlacementProfile(payload);
      setProfileState(response.data);
      setErrors(validateProfile(response.data.profile || emptyForm));
      notifications.show({
        title: "Saved",
        message: "Placement profile updated successfully.",
        color: "green",
      });
    } catch (error) {
      const fieldErrors = error.response?.data?.field_errors || {};
      setErrors((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(fieldErrors).map(([key, messages]) => [
            key,
            messages?.[0],
          ]),
        ),
      }));
      setTouched({
        first_name: true,
        last_name: true,
        email: true,
        phone_no: true,
        address: true,
        about_me: true,
      });
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail || "Could not save placement profile.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentChange = (file) => {
    setDocumentFile(file);
    setDocumentError(getDocumentError(file));
    if (!documentName && file?.name) {
      const trimmedName = file.name.replace(/\.[^/.]+$/, "");
      setDocumentName(trimmedName);
    }
  };

  const handleUploadDocument = async () => {
    const nextError = getDocumentError(documentFile);
    setDocumentError(
      nextError || (!documentFile ? "Please select a document." : ""),
    );
    if (!documentFile || nextError) {
      return;
    }

    const payload = new FormData();
    payload.append("name", documentName.trim() || documentFile.name);
    payload.append("document", documentFile);

    setUploading(true);
    try {
      await placementApi.uploadPlacementProfileDocument(payload);
      setDocumentFile(null);
      setDocumentName("");
      setDocumentError("");
      await loadProfile();
      notifications.show({
        title: "Uploaded",
        message: "Placement document uploaded successfully.",
        color: "green",
      });
    } catch (error) {
      setDocumentError(
        error.response?.data?.document?.[0] || "Could not upload document.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card shadow="sm" radius="md" padding="lg">
      <Stack>
        <div>
          <Title order={2}>Placement Profile</Title>
          <Text c="dimmed" size="sm">
            Keep your placement details current, upload supporting documents,
            and review the profile activity history.
          </Text>
        </div>

        {profileState?.validation_errors?.length ? (
          <Alert color="yellow" variant="light">
            <Text fw={600} mb="xs">
              Placement profile is incomplete
            </Text>
            <List size="sm">
              {profileState.validation_errors.map((message) => (
                <List.Item key={message}>{message}</List.Item>
              ))}
            </List>
          </Alert>
        ) : (
          <Alert color="green" variant="light">
            All required placement profile checks are currently satisfied.
          </Alert>
        )}

        <form onSubmit={handleSave}>
          <Stack>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Card withBorder radius="md" padding="md">
                <Text size="sm" c="dimmed">
                  Branch
                </Text>
                <Text fw={700}>
                  {profileState?.profile?.branch || "Not available"}
                </Text>
              </Card>
              <Card withBorder radius="md" padding="md">
                <Text size="sm" c="dimmed">
                  CPI
                </Text>
                <Text fw={700}>
                  {profileState?.profile?.cpi ?? "Not available"}
                </Text>
              </Card>
              <Card withBorder radius="md" padding="md">
                <Text size="sm" c="dimmed">
                  Passout Year
                </Text>
                <Text fw={700}>
                  {profileState?.profile?.passout_year || "Not available"}
                </Text>
              </Card>
            </SimpleGrid>

            <Group grow align="flex-start">
              <TextInput
                label="First Name"
                value={form.first_name}
                onChange={(event) =>
                  handleFieldChange("first_name", event.target.value)
                }
                error={visibleErrors.first_name}
                required
              />
              <TextInput
                label="Last Name"
                value={form.last_name}
                onChange={(event) =>
                  handleFieldChange("last_name", event.target.value)
                }
                error={visibleErrors.last_name}
                required
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                label="Email"
                value={form.email}
                onChange={(event) =>
                  handleFieldChange("email", event.target.value)
                }
                error={visibleErrors.email}
                required
              />
              <TextInput
                label="Phone Number"
                value={form.phone_no}
                onChange={(event) =>
                  handleFieldChange("phone_no", event.target.value)
                }
                error={visibleErrors.phone_no}
                required
              />
            </Group>
            <Textarea
              label="Address"
              value={form.address}
              onChange={(event) =>
                handleFieldChange("address", event.target.value)
              }
              error={visibleErrors.address}
              minRows={2}
              required
            />
            <Textarea
              label="About Me"
              description="Use this to summarize your strengths, interests, and placement goals."
              value={form.about_me}
              onChange={(event) =>
                handleFieldChange("about_me", event.target.value)
              }
              error={visibleErrors.about_me}
              minRows={4}
              required
            />
            <Group justify="flex-end">
              <Button type="submit" loading={saving}>
                Save Placement Profile
              </Button>
            </Group>
          </Stack>
        </form>

        <Divider />

        <Stack>
          <div>
            <Title order={4}>Job Eligibility Snapshot</Title>
            <Text c="dimmed" size="sm">
              Upcoming jobs are checked against your branch, CPI, passout year,
              and current placement restrictions.
            </Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Card withBorder radius="md" padding="md">
              <Text size="sm" c="dimmed">
                Eligible Upcoming Jobs
              </Text>
              <Text fw={700} size="xl">
                {profileState?.eligibility_summary?.eligible_count ?? 0}
              </Text>
            </Card>
            <Card withBorder radius="md" padding="md">
              <Text size="sm" c="dimmed">
                Not Eligible Upcoming Jobs
              </Text>
              <Text fw={700} size="xl">
                {profileState?.eligibility_summary?.ineligible_count ?? 0}
              </Text>
            </Card>
          </SimpleGrid>

          {profileState?.eligibility_summary?.jobs?.length ? (
            <Stack gap="xs">
              {profileState.eligibility_summary.jobs.map((job) => (
                <Card key={job.schedule_id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={600}>
                        {job.company_name}
                        {job.role ? ` - ${job.role}` : ""}
                      </Text>
                      <Text c="dimmed" size="sm">
                        Drive date {job.placement_date || "Not specified"}
                      </Text>
                      {!job.eligible && job.reasons?.length ? (
                        <List size="sm" mt="xs">
                          {job.reasons.map((reason) => (
                            <List.Item key={reason}>{reason}</List.Item>
                          ))}
                        </List>
                      ) : null}
                    </div>
                    <Badge color={job.eligible ? "green" : "red"} variant="light">
                      {job.eligible ? "Eligible" : "Not Eligible"}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              No upcoming placement jobs are available right now.
            </Text>
          )}
        </Stack>

        <Divider />

        <Stack>
          <div>
            <Title order={4}>Supporting Documents</Title>
            <Text c="dimmed" size="sm">
              Upload `PDF`, `JPG`, or `PNG` files up to 5MB.
            </Text>
          </div>
          <TextInput
            label="Document Name"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder="Resume, transcript, portfolio"
          />
          <FileInput
            label="Document"
            placeholder="Choose a file"
            value={documentFile}
            onChange={handleDocumentChange}
            error={documentError}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={handleUploadDocument}
              loading={uploading}
            >
              Upload Document
            </Button>
          </Group>

          <Stack gap="xs">
            {profileState?.documents?.length ? (
              profileState.documents.map((document) => (
                <Card key={document.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="center">
                    <div>
                      <Text fw={600}>{document.name}</Text>
                      <Text c="dimmed" size="sm">
                        Uploaded {formatTimestamp(document.uploaded_at)}
                      </Text>
                    </div>
                    <Anchor
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </Anchor>
                  </Group>
                </Card>
              ))
            ) : (
              <Text c="dimmed" size="sm">
                No placement documents uploaded yet.
              </Text>
            )}
          </Stack>
        </Stack>

        <Divider />

        <Stack>
          <div>
            <Title order={4}>Profile History</Title>
            <Text c="dimmed" size="sm">
              Every profile save and document upload is recorded here.
            </Text>
          </div>
          {loading ? (
            <Text c="dimmed" size="sm">
              Loading history...
            </Text>
          ) : profileState?.audit_logs?.length ? (
            profileState.audit_logs.map((entry) => (
              <Card key={entry.id} withBorder radius="md" padding="sm">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={600}>{entry.action.replace(/_/g, " ")}</Text>
                    <Text c="dimmed" size="sm">
                      {entry.actor || "System"}
                      {" - "}
                      {formatTimestamp(entry.created_at)}
                    </Text>
                  </div>
                  <Badge variant="light">{entry.action}</Badge>
                </Group>
              </Card>
            ))
          ) : (
            <Text c="dimmed" size="sm">
              No profile activity has been recorded yet.
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

export default PlacementProfileForm;
