import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { placementApi } from "../../services/api";

function AlumniReferrals() {
  const role = useSelector((state) => state.user.role);
  const [referrals, setReferrals] = useState([]);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    application_url: "",
    description: "",
    expires_at: null,
  });

  const loadReferrals = async () => {
    try {
      const response = await placementApi.getAlumniReferrals();
      setReferrals(response.data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not load alumni referrals.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitReferral = async (event) => {
    event.preventDefault();
    try {
      await placementApi.createAlumniReferral({
        ...form,
        expires_at: form.expires_at
          ? new Date(form.expires_at).toISOString().slice(0, 10)
          : "",
      });
      notifications.show({
        title: "Referral Posted",
        message: "Students will be notified about the new referral.",
        color: "green",
      });
      setForm({
        title: "",
        company: "",
        location: "",
        application_url: "",
        description: "",
        expires_at: null,
      });
      loadReferrals();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail || "Could not create alumni referral.",
        color: "red",
      });
    }
  };

  return (
    <Stack>
      {role === "alumni" ? (
        <Card shadow="sm" radius="md" padding="lg">
          <Stack>
            <Title order={2}>Post Job Referral</Title>
            <form onSubmit={submitReferral}>
              <Stack>
                <TextInput
                  label="Role Title"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  required
                />
                <TextInput
                  label="Company"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  required
                />
                <TextInput
                  label="Location"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
                <TextInput
                  label="Application URL"
                  value={form.application_url}
                  onChange={(e) => setField("application_url", e.target.value)}
                />
                <DateInput
                  label="Expiry Date"
                  value={form.expires_at}
                  onChange={(value) => setField("expires_at", value)}
                />
                <Textarea
                  label="Referral Description"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  minRows={4}
                  required
                />
                <Group justify="flex-end">
                  <Button type="submit">Post Referral</Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>
      ) : null}

      <Card shadow="sm" radius="md" padding="lg">
        <Stack>
          <div>
            <Title order={2}>Alumni Referrals</Title>
            <Text c="dimmed" size="sm">
              Browse alumni-posted referral opportunities and reach out through
              the alumni network.
            </Text>
          </div>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Role</Table.Th>
                <Table.Th>Company</Table.Th>
                <Table.Th>Posted By</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th>Details</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {referrals.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.title}</Table.Td>
                  <Table.Td>
                    {row.company}
                    {row.location ? `, ${row.location}` : ""}
                  </Table.Td>
                  <Table.Td>{row.alumni.full_name}</Table.Td>
                  <Table.Td>{row.expires_at || "Open"}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{row.description}</Text>
                    {row.application_url ? (
                      <Text size="sm" c="blue">
                        {row.application_url}
                      </Text>
                    ) : null}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );
}

export default AlumniReferrals;
