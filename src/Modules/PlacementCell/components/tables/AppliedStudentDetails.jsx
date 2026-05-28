import React, { useEffect, useState, useMemo } from "react";
import {
  Select,
  Title,
  Button,
  Loader,
  Alert,
  Flex,
  Checkbox,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Text,
  ActionIcon,
} from "@mantine/core";
import { Trash } from "@phosphor-icons/react";
import { MantineReactTable } from "mantine-react-table";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { placementApi } from "../../services/api";
import { downloadBlobFile, getJobIdFromSearch } from "../../utils/helpers";
import {
  getAuthorizationErrorMessage,
  isForbiddenError,
  showApiError,
} from "../../utils/authorization";

function JobApplicationsTable() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authorizationError, setAuthorizationError] = useState("");
  const [savingRound, setSavingRound] = useState(false);
  const [, setFields] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [scheduleModalOpened, setScheduleModalOpened] = useState(false);
  const [roundForm, setRoundForm] = useState({
    round_no: "",
    start_datetime: "",
    end_datetime: "",
    test_type: "",
    mode: "",
    location_link: "",
    feedback: "",
  });
  const jobId = getJobIdFromSearch();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await placementApi.getApplications(jobId);
      setApplications(response.data.students || []);
      setAuthorizationError("");
    } catch (error) {
      if (isForbiddenError(error)) {
        setAuthorizationError(
          getAuthorizationErrorMessage(
            error,
            "Only placement officer users can view applicant lists.",
          ),
        );
      }
      showApiError({
        error,
        fallback: "Failed to fetch applications.",
        authorizationFallback:
          "Only placement officer users can view applicant lists.",
      });
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications and fields on component mount
  useEffect(() => {
    const fetchFieldsList = async () => {
      try {
        const response = await placementApi.getFormFields(jobId);
        if (response.status === 200) {
          setFields(response.data);
        }
      } catch (error) {
        if (isForbiddenError(error)) {
          setAuthorizationError(
            getAuthorizationErrorMessage(
              error,
              "Only placement officer users can view applicant form fields.",
            ),
          );
        }
        showApiError({
          error,
          fallback: "Failed to fetch fields list.",
          authorizationFallback:
            "Only placement officer users can view applicant form fields.",
        });
        console.error("Error fetching fields list:", error);
      }
    };

    fetchApplications();
    fetchFieldsList();
  }, [jobId]);

  // Handle status change for an application
  const handleStatusChange = async (applicationId, status) => {
    if (!status) {
      return;
    }
    try {
      const response = await placementApi.updateApplicationStatus(
        applicationId,
        status,
      );
      if (response.status === 200) {
        setApplications((prevApplications) =>
          prevApplications.map((application) =>
            application.id === applicationId
              ? { ...application, status }
              : application,
          ),
        );
        notifications.show({
          title: "Success",
          message: "Application status updated successfully.",
          color: "green",
        });
      }
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to update application status.",
        authorizationFallback:
          "Only placement officer users can update application status.",
      });
      console.error("Error updating application status:", error);
    }
  };

  const handleDeleteApplication = async (applicationId, studentName) => {
    const confirmed = window.confirm(
      `Delete application for ${studentName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await placementApi.deleteApplication(applicationId);
      if (response.status === 200) {
        setApplications((prevApplications) =>
          prevApplications.filter(
            (application) => application.id !== applicationId,
          ),
        );
        setSelectedIds((prevSelectedIds) =>
          prevSelectedIds.filter((id) => id !== applicationId),
        );
        notifications.show({
          title: "Application Deleted",
          message: "The selected application was removed successfully.",
          color: "green",
        });
      }
    } catch (error) {
      showApiError({
        error,
        title: "Delete Failed",
        fallback: "Failed to delete the application.",
        authorizationFallback: "Only placement officer users can delete applications.",
      });
      console.error("Error deleting application:", error);
    }
  };

  const toggleCandidateSelection = (applicationId) => {
    setSelectedIds((prev) =>
      prev.includes(applicationId)
        ? prev.filter((id) => id !== applicationId)
        : [...prev, applicationId],
    );
  };

  const toggleSelectAllShortlisted = () => {
    const eligibleIds = shortlistedCandidates.map((candidate) => candidate.id);
    const allSelected =
      eligibleIds.length > 0 &&
      eligibleIds.every((candidateId) => selectedIds.includes(candidateId));

    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !eligibleIds.includes(id));
      }

      return Array.from(new Set([...prev, ...eligibleIds]));
    });
  };

  const handleScheduleRound = async () => {
    if (!roundForm.start_datetime || !roundForm.test_type) {
      notifications.show({
        title: "Missing Details",
        message: "Start time and round type are required.",
        color: "yellow",
      });
      return;
    }

    if (!selectedIds.length) {
      notifications.show({
        title: "No Candidates Selected",
        message: "Select shortlisted candidates before scheduling a round.",
        color: "yellow",
      });
      return;
    }

    try {
      setSavingRound(true);
      const response = await placementApi.submitNextRoundDetails(jobId, {
        ...roundForm,
        application_ids: selectedIds,
      });

      if (response.status === 201) {
        notifications.show({
          title: "Round Scheduled",
          message: `Interview scheduled for ${response.data.scheduled_candidates} candidate(s).`,
          color: "green",
        });
        setScheduleModalOpened(false);
        setRoundForm({
          round_no: "",
          start_datetime: "",
          end_datetime: "",
          test_type: "",
          mode: "",
          location_link: "",
          feedback: "",
        });
        setSelectedIds([]);
        await fetchApplications();
      }
    } catch (error) {
      showApiError({
        error,
        title: "Scheduling Failed",
        fallback:
          error?.response?.data?.conflicts?.join(" ") ||
          "Failed to schedule the selected candidates for the next round.",
        authorizationFallback:
          "Only placement officer users can schedule next rounds.",
      });
      console.error("Error scheduling next round:", error);
    } finally {
      setSavingRound(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await placementApi.downloadApplicationsExcel(jobId);
      downloadBlobFile(response.data, `applications_${jobId}.xlsx`);
      notifications.show({
        title: "Success",
        message: "Excel file downloaded successfully.",
        color: "green",
      });
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to download Excel file.",
        authorizationFallback:
          "Only placement officer users can export applicant data.",
      });
      console.error("Error downloading Excel:", error);
    }
  };

  const shortlistedCandidates = applications.filter((application) =>
    ["shortlisted", "interview_scheduled", "interview_completed"].includes(
      application.status,
    ),
  );

  const allShortlistedSelected =
    shortlistedCandidates.length > 0 &&
    shortlistedCandidates.every((candidate) => selectedIds.includes(candidate.id));

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "select",
        header: () => (
          <Checkbox
            checked={allShortlistedSelected}
            indeterminate={
              selectedIds.length > 0 && !allShortlistedSelected
            }
            onChange={toggleSelectAllShortlisted}
            aria-label="Select shortlisted candidates"
          />
        ),
        size: 60,
        Cell: ({ row }) => {
          const canSelect = [
            "shortlisted",
            "interview_scheduled",
            "interview_completed",
          ].includes(row.original.status);

          return (
            <Checkbox
              disabled={!canSelect}
              checked={selectedIds.includes(row.original.id)}
              onChange={() => toggleCandidateSelection(row.original.id)}
              aria-label={`Select ${row.original.name}`}
            />
          );
        },
      },
      { accessorKey: "name", header: "Name", size: 200 },
      { accessorKey: "roll_no", header: "Roll No", size: 150 },
      { accessorKey: "email", header: "Email", size: 250 },
      { accessorKey: "cpi", header: "CPI", size: 100 },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ row }) => (
          <Select
            data={[
              { value: "pending", label: "Under Review" },
              { value: "shortlisted", label: "Shortlisted" },
              { value: "interview_scheduled", label: "Interview Scheduled" },
              { value: "interview_completed", label: "Interview Completed" },
              { value: "offer_released", label: "Offer Released" },
              { value: "accept", label: "Selected" },
              { value: "reject", label: "Reject" },
            ]}
            value={row.original.status}
            onChange={(value) => handleStatusChange(row.original.id, value)}
          />
        ),
      },
      {
        accessorKey: "actions",
        header: "Actions",
        size: 260,
        Cell: ({ row }) => (
          <Flex gap="xs">
            <Button
              size="xs"
              variant="light"
              onClick={() => navigate(`/profile/${row.original.username}`)}
            >
              View Profile
            </Button>
            <Button
              size="xs"
              variant="subtle"
              onClick={() =>
                navigate(`/placement-cell/application/${row.original.id}`)
              }
            >
              View Application
            </Button>
            <ActionIcon
              color="red"
              variant="light"
              onClick={() =>
                handleDeleteApplication(row.original.id, row.original.name)
              }
              aria-label={`Delete application for ${row.original.name}`}
            >
              <Trash size={16} />
            </ActionIcon>
          </Flex>
        ),
      },
    ],
    [allShortlistedSelected, selectedIds],
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "200px" }}>
        <Loader size="xl" />
      </Flex>
    );
  }

  if (authorizationError) {
    return (
      <Alert color="red" title="Authorization Error">
        {authorizationError}
      </Alert>
    );
  }

  return (
    <>
      <Flex justify="space-between" align="center" mb="lg">
        <Title order={2}>Student Job Applications</Title>
        <Flex gap="sm">
          <Button
            onClick={() => setScheduleModalOpened(true)}
            color="green"
            disabled={!selectedIds.length}
          >
            Schedule Selected Candidates
          </Button>
          <Button onClick={downloadExcel} color="blue">
            Download Excel
          </Button>
        </Flex>
      </Flex>

      <Text size="sm" c="dimmed" mb="md">
        Mark students as shortlisted first, then select them to schedule the next
        round from this page.
      </Text>

      {applications.length > 0 ? (
        <MantineReactTable columns={columns} data={applications} />
      ) : (
        <Alert color="yellow" title="No Applications">
          No applications available for this job.
        </Alert>
      )}

      <Modal
        opened={scheduleModalOpened}
        onClose={() => setScheduleModalOpened(false)}
        centered
        title="Schedule Next Round"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            This will schedule the next round only for the selected shortlisted
            candidates.
          </Text>

          <TextInput
            label="Round Number"
            placeholder="Leave blank to auto-generate"
            type="number"
            value={roundForm.round_no}
            onChange={(event) =>
              setRoundForm((prev) => ({
                ...prev,
                round_no: event.currentTarget.value,
              }))
            }
          />

          <TextInput
            label="Interview Start"
            type="datetime-local"
            value={roundForm.start_datetime}
            onChange={(event) =>
              setRoundForm((prev) => ({
                ...prev,
                start_datetime: event.currentTarget.value,
              }))
            }
            required
          />

          <TextInput
            label="Interview End"
            type="datetime-local"
            value={roundForm.end_datetime}
            onChange={(event) =>
              setRoundForm((prev) => ({
                ...prev,
                end_datetime: event.currentTarget.value,
              }))
            }
          />

          <Select
            label="Round Type"
            placeholder="Select round type"
            data={[
              { value: "Online Assessment", label: "Online Assessment" },
              { value: "Technical Interview", label: "Technical Interview" },
              { value: "HR Interview", label: "HR Interview" },
              { value: "Group Discussion", label: "Group Discussion" },
              { value: "Managerial Round", label: "Managerial Round" },
            ]}
            value={roundForm.test_type}
            onChange={(value) =>
              setRoundForm((prev) => ({ ...prev, test_type: value || "" }))
            }
            required
          />

          <Select
            label="Mode"
            placeholder="Select interview mode"
            data={[
              { value: "ONLINE", label: "ONLINE" },
              { value: "OFFLINE", label: "OFFLINE" },
              { value: "HYBRID", label: "HYBRID" },
            ]}
            value={roundForm.mode}
            onChange={(value) =>
              setRoundForm((prev) => ({ ...prev, mode: value || "" }))
            }
          />

          <TextInput
            label="Location / Meeting Link"
            placeholder="Room number, venue, or online meeting link"
            value={roundForm.location_link}
            onChange={(event) =>
              setRoundForm((prev) => ({
                ...prev,
                location_link: event.currentTarget.value,
              }))
            }
          />

          <Textarea
            label="Round Feedback"
            placeholder="Optional feedback or instructions for this round"
            value={roundForm.feedback}
            onChange={(event) =>
              setRoundForm((prev) => ({
                ...prev,
                feedback: event.currentTarget.value,
              }))
            }
            minRows={3}
          />

          <Button loading={savingRound} onClick={handleScheduleRound}>
            Save Round Details
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

export default JobApplicationsTable;
