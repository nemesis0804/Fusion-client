/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Stack,
  Group,
  TextInput,
  Textarea,
  Select,
  Button,
  Loader,
  Badge,
  FileInput,
  NumberInput,
  Alert,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Upload, Check, X, Clock } from "phosphor-react";
import axios from "axios";
import { apiGet, getAuthHeaders } from "./api";
import { alumniRoute } from "../../routes/placementCellRoutes";

const PROGRAMMES = [
  "B.Tech",
  "M.Tech",
  "B.Des",
  "M.Des",
  "PhD",
  "MBA",
  "Other",
];
const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Mechanical Engineering",
  "Design",
  "Mathematics",
  "Physics",
  "Humanities",
  "Other",
];

const STATUS_ICON = {
  PENDING: <Clock size={16} />,
  APPROVED: <Check size={16} />,
  REJECTED: <X size={16} />,
};
const STATUS_COLOR = { PENDING: "yellow", APPROVED: "green", REJECTED: "red" };

export default function AlumniRegistration() {
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    graduation_year: new Date().getFullYear(),
    programme: "",
    department: "",
    current_company: "",
    current_designation: "",
    linkedin_url: "",
    phone: "",
    bio: "",
  });
  const [verificationFile, setVerificationFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet(`${alumniRoute}me/`);
        setExisting(res);
      } catch {
        // 404 = not registered yet, which is fine
      }
      setLoading(false);
    })();
  }, []);

  const handleChange = (field) => (val) =>
    setForm((f) => ({
      ...f,
      [field]: typeof val === "object" && val?.target ? val.target.value : val,
    }));

  const handleSubmit = async () => {
    if (!form.graduation_year || !form.programme) {
      notifications.show({
        title: "Missing fields",
        message: "Graduation year and programme are required.",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (verificationFile)
        fd.append("verification_document", verificationFile);
      const headers = getAuthHeaders();
      delete headers["Content-Type"]; // let browser set multipart boundary
      await axios.post(alumniRoute, fd, { headers });
      // Refetch profile
      const res = await apiGet(`${alumniRoute}me/`);
      setExisting(res);
      notifications.show({
        title: "Registered!",
        message: "Your alumni registration is pending approval.",
        color: "green",
      });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.graduation_year?.[0] ||
        "Registration failed.";
      notifications.show({
        title: "Error",
        message: typeof detail === "string" ? detail : JSON.stringify(detail),
        color: "red",
      });
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader size="lg" />
      </div>
    );

  // Already registered — show status
  if (existing) {
    return (
      <div>
        <Text size="1.5rem" fw={700} mb="md" style={{ fontFamily: "Manrope" }}>
          Alumni Registration
        </Text>
        <Card shadow="sm" radius="md" withBorder p="xl" maw={600}>
          <Group position="apart" mb="md">
            <Text fw={600} size="lg">
              {existing.full_name}
            </Text>
            <Badge
              color={STATUS_COLOR[existing.approval_status]}
              leftSection={STATUS_ICON[existing.approval_status]}
              variant="light"
              size="lg"
            >
              {existing.approval_status}
            </Badge>
          </Group>
          <Divider mb="md" />
          <Stack spacing="xs">
            <Group>
              <Text fw={500} w={140}>
                Graduation Year:
              </Text>
              <Text>{existing.graduation_year}</Text>
            </Group>
            <Group>
              <Text fw={500} w={140}>
                Programme:
              </Text>
              <Text>{existing.programme}</Text>
            </Group>
            <Group>
              <Text fw={500} w={140}>
                Department:
              </Text>
              <Text>{existing.department}</Text>
            </Group>
            <Group>
              <Text fw={500} w={140}>
                Current Company:
              </Text>
              <Text>{existing.current_company || "—"}</Text>
            </Group>
            <Group>
              <Text fw={500} w={140}>
                Designation:
              </Text>
              <Text>{existing.current_designation || "—"}</Text>
            </Group>
            {existing.linkedin_url && (
              <Group>
                <Text fw={500} w={140}>
                  LinkedIn:
                </Text>
                <a
                  href={existing.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {existing.linkedin_url}
                </a>
              </Group>
            )}
            {existing.bio && (
              <>
                <Text fw={500}>Bio:</Text>
                <Text size="sm" c="dimmed">
                  {existing.bio}
                </Text>
              </>
            )}
          </Stack>

          {existing.approval_status === "PENDING" && (
            <Alert
              color="yellow"
              mt="lg"
              icon={<Clock size={18} />}
              title="Pending Verification"
            >
              Your registration is under review by the Training & Placement
              Office. You will be notified once approved.
            </Alert>
          )}
          {existing.approval_status === "REJECTED" && (
            <Alert
              color="red"
              mt="lg"
              icon={<X size={18} />}
              title="Registration Rejected"
            >
              {existing.rejection_remarks ||
                "Your registration was rejected. Please contact the TPO for details."}
            </Alert>
          )}
          {existing.approval_status === "APPROVED" && (
            <Alert
              color="green"
              mt="lg"
              icon={<Check size={18} />}
              title="Verified Alumni"
            >
              You are a verified alumni. You can now access Mentorship and Job
              Referrals.
            </Alert>
          )}
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div>
      <Text size="1.5rem" fw={700} mb="xs" style={{ fontFamily: "Manrope" }}>
        Alumni Registration
      </Text>
      <Text c="dimmed" size="sm" mb="lg">
        Register as an alumni to access mentorship tools and post job referrals
        for current students.
      </Text>

      <Card shadow="sm" radius="md" withBorder p="xl" maw={620}>
        <Stack spacing="md">
          <Group grow>
            <NumberInput
              label="Graduation Year"
              placeholder="e.g. 2022"
              min={1990}
              max={new Date().getFullYear()}
              value={form.graduation_year}
              onChange={handleChange("graduation_year")}
              required
            />
            <Select
              label="Programme"
              placeholder="Select"
              data={PROGRAMMES}
              value={form.programme}
              onChange={handleChange("programme")}
              required
            />
          </Group>

          <Select
            label="Department"
            placeholder="Select"
            data={DEPARTMENTS}
            value={form.department}
            onChange={handleChange("department")}
            searchable
          />

          <Group grow>
            <TextInput
              label="Current Company"
              placeholder="e.g. Google"
              value={form.current_company}
              onChange={handleChange("current_company")}
            />
            <TextInput
              label="Designation"
              placeholder="e.g. SDE-2"
              value={form.current_designation}
              onChange={handleChange("current_designation")}
            />
          </Group>

          <TextInput
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/..."
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
          />

          <TextInput
            label="Phone"
            placeholder="+91 ..."
            value={form.phone}
            onChange={handleChange("phone")}
          />

          <Textarea
            label="Bio"
            placeholder="Tell us about yourself, your journey after graduation..."
            autosize
            minRows={3}
            maxRows={6}
            value={form.bio}
            onChange={handleChange("bio")}
          />

          <FileInput
            label="Verification Document"
            description="Upload degree certificate, alumni ID, or any proof (PDF, JPG, PNG — max 5 MB)"
            placeholder="Choose file..."
            icon={<Upload size={16} />}
            value={verificationFile}
            onChange={setVerificationFile}
            accept="application/pdf,image/jpeg,image/png"
          />

          <Button
            onClick={handleSubmit}
            loading={submitting}
            fullWidth
            mt="xs"
            size="md"
          >
            Submit Registration
          </Button>
        </Stack>
      </Card>
    </div>
  );
}
