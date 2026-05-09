import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  List,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ArrowLeft, Briefcase, Buildings, MapPin } from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { notifications } from "@mantine/notifications";
import ApplicationStatusTimeline from "../components/common/Timeline";
import ApplyForPlacementForm from "../components/forms/ApplyForPlacementForm";
import { placementApi } from "../services/api";

function formatDateTime(value) {
  if (!value) {
    return "Not specified";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }
  return parsed.toLocaleString();
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <Group align="flex-start" wrap="nowrap">
      <ThemeIcon variant="light" size="lg" radius="xl">
        <Icon size={18} />
      </ThemeIcon>
      <div>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Text fw={600}>{value || "Not specified"}</Text>
      </div>
    </Group>
  );
}

DetailItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

DetailItem.defaultProps = {
  value: "",
};

function JobApplicationForm() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = useSelector((state) => state.user.role);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const jobId = queryParams.get("jobId");

  const loadJob = async () => {
    if (!jobId) {
      notifications.show({
        title: "Error",
        message: "Job details could not be loaded.",
        color: "red",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await placementApi.getPlacementDetail(jobId);
      setJob(response.data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.detail || "Failed to load job details.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const handleBack = () => {
    navigate("/placement-cell");
  };

  const handleWithdraw = async () => {
    try {
      await placementApi.withdrawApplication(jobId);
      notifications.show({
        title: "Success",
        message: "Application withdrawn successfully.",
        color: "green",
      });
      await loadJob();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail ||
          "Could not withdraw this application right now.",
        color: "red",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found.</div>;
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={handleBack}
          >
            Back to job listings
          </Button>
          {role === "student" && (
            <Badge color={job.eligible === false ? "red" : "green"} size="lg">
              {job.eligible === false ? "Ineligible" : "Eligible"}
            </Badge>
          )}
        </Group>

        <Card shadow="sm" radius="md" padding="xl" withBorder>
          <Stack gap="lg">
            <div>
              <Title order={2}>{job.company_name}</Title>
              <Text c="dimmed" mt="xs">
                {job.role_st || "Role not specified"}
              </Text>
            </div>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <DetailItem
                icon={Briefcase}
                label="Package"
                value={job.ctc ? `${job.ctc} LPA` : "Not specified"}
              />
              <DetailItem icon={MapPin} label="Location" value={job.location} />
              <DetailItem
                icon={Buildings}
                label="Placement Type"
                value={job.placement_type}
              />
              <DetailItem
                icon={Briefcase}
                label="Drive Date"
                value={formatDateTime(job.placement_date)}
              />
            </SimpleGrid>

            <div>
              <Title order={4} mb="xs">
                Job Description
              </Title>
              <Text>{job.description || "No description provided."}</Text>
            </div>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Card withBorder radius="md" padding="md">
                <Stack gap="xs">
                  <Title order={5}>Company Details</Title>
                  <Text>
                    <strong>Description:</strong>{" "}
                    {job.company_details?.description || "Not provided"}
                  </Text>
                  <Text>
                    <strong>Address:</strong>{" "}
                    {job.company_details?.address || "Not provided"}
                  </Text>
                  <Text>
                    <strong>Website:</strong>{" "}
                    {job.company_details?.website ? (
                      <Anchor
                        href={job.company_details.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {job.company_details.website}
                      </Anchor>
                    ) : (
                      "Not provided"
                    )}
                  </Text>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="md">
                <Stack gap="xs">
                  <Title order={5}>Eligibility Snapshot</Title>
                  <Text>
                    <strong>CPI:</strong>{" "}
                    {job.cpi_requirement || "Not specified"}
                  </Text>
                  <Text>
                    <strong>Branch:</strong>{" "}
                    {job.branch_requirement || "Not specified"}
                  </Text>
                  <Text>
                    <strong>Passout Year:</strong>{" "}
                    {job.passout_year || "Not specified"}
                  </Text>
                  <Text>
                    <strong>Gender:</strong>{" "}
                    {job.gender_requirement || "Not specified"}
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>

            {job.eligibility_criteria?.length > 0 && (
              <Card withBorder radius="md" padding="md">
                <Title order={5} mb="xs">
                  Eligibility Criteria
                </Title>
                <List size="sm">
                  {job.eligibility_criteria.map((criterion) => (
                    <List.Item key={criterion}>{criterion}</List.Item>
                  ))}
                </List>
              </Card>
            )}

            {job.application_fields?.length > 0 && (
              <Card withBorder radius="md" padding="md">
                <Title order={5} mb="xs">
                  Application Requirements
                </Title>
                <List size="sm">
                  {job.application_fields.map((field) => (
                    <List.Item key={field.field_id}>
                      {field.name} ({field.type})
                      {field.required ? " - required" : ""}
                    </List.Item>
                  ))}
                </List>
              </Card>
            )}

            {job.attached_file_url && (
              <Text>
                <strong>Attachment:</strong>{" "}
                <Anchor
                  href={job.attached_file_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open supporting document
                </Anchor>
              </Text>
            )}
          </Stack>
        </Card>

        {role === "student" && job.eligible === false && (
          <Alert color="red" variant="light">
            <Text fw={600} mb="xs">
              You are currently blocked from applying to this job.
            </Text>
            <List size="sm">
              {(
                job.eligibility_reasons || ["Eligibility requirements not met."]
              ).map((reason) => (
                <List.Item key={reason}>{reason}</List.Item>
              ))}
            </List>
          </Alert>
        )}

        {role === "student" && job.check && (
          <Card shadow="sm" radius="md" padding="lg" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Application Status</Title>
                <Button color="red" variant="light" onClick={handleWithdraw}>
                  Withdraw Application
                </Button>
              </Group>
              <ApplicationStatusTimeline />
            </Stack>
          </Card>
        )}

        {role === "student" && !job.check && job.eligible !== false && (
          <ApplyForPlacementForm jobID={jobId} />
        )}
      </Stack>
    </Container>
  );
}

export default JobApplicationForm;
