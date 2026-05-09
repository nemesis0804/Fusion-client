import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  Badge,
  // Image,
  ActionIcon,
  Modal,
  Container,
  Title,
} from "@mantine/core";
import { Clock, MapPin, Trash, Pencil, Eye } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { notifications } from "@mantine/notifications";
import EditPlacementForm from "../forms/EditPlacementForm";
import ApplyForPlacementForm from "../forms/ApplyForPlacementForm";
import { placementApi } from "../../services/api";
import { showApiError } from "../../utils/authorization";

const formatDisplayDate = (value) => {
  if (!value) return "Date not available";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Date not available";

  return format(parsedDate, "dd MMM yyyy, hh:mm a");
};

function PlacementScheduleCard({
  jobId,
  // companyLogo,
  companyName,
  location,
  position,
  jobType,
  postedTime,
  deadline,
  endDateTime,
  description,
  salary,
  eligibilityCriteria,
  eligible,
  eligibilityReasons,
  check,
}) {
  const role = useSelector((state) => state.user.role);
  const isPlacementAdmin =
    role === "placement officer" || role === "placement chairman";
  const [visible, setVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [hasApplied, setHasApplied] = useState(Boolean(check));

  const navigate = useNavigate();
  const isClosed =
    Boolean(endDateTime) && new Date(endDateTime).getTime() <= Date.now();

  useEffect(() => {
    setHasApplied(Boolean(check));
  }, [check]);

  const prefilledFields = {
    name: "John Doe",
    email: "john.doe@example.com",
    roll_no: "123456",
  };

  const additionalFields = [
    {
      name: "resume",
      label: "Upload Resume",
      type: "file",
      required: true,
    },
    {
      name: "preferred_location",
      label: "Preferred Location",
      type: "select",
      options: ["Bangalore", "Mumbai", "Delhi"],
      placeholder: "Select your preferred location",
      required: true,
    },
    {
      name: "additional_info",
      label: "Additional Information",
      type: "textarea",
      placeholder: "Enter any additional information",
      required: false,
    },
  ];

  const handleApplyClick = async () => {
    setModalOpened(true);
  };

  const handelApplySubmit = async () => {
    try {
      const response = await placementApi.applyForPlacement({ jobId });
      if (response.ok) {
        setHasApplied(true);
        setModalOpened(false);
        notifications.show({
          title: "Success",
          message: "Application submitted successfully.",
          color: "green",
          position: "top-center",
        });
      } else {
        console.error("Failed to apply", response);
        const errorData = await response.json();
        notifications.show({
          title: "Error",
          message:
            errorData?.detail || "Could not submit this application right now.",
          color: "red",
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail ||
          "Could not submit this application right now.",
        color: "red",
        position: "top-center",
      });
    }
  };

  const handelViewClick = () => {
    if (isPlacementAdmin) {
      navigate(`/placement-cell/view?jobId=${encodeURIComponent(jobId)}`);
      return;
    }
    navigate(
      `/placement-cell/apply-placement?jobId=${encodeURIComponent(jobId)}`,
    );
  };

  const handleDeleteClick = async () => {
    setVisible(false);
    try {
      const response = await placementApi.deletePlacementEvent(jobId);

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Placement schedule deleted successfully!",
          color: "green",
          position: "top-center",
          autoClose: 3000,
        });
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        const error = {
          response: {
            status: response.status,
            data: errorData,
          },
        };
        console.error("Delete failed:", errorData);
        showApiError({
          error,
          fallback: "Failed to delete placement schedule.",
          authorizationFallback:
            "Only placement officer users can modify placement schedules.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      showApiError({
        error,
        fallback: "An error occurred while deleting the placement schedule.",
        authorizationFallback:
          "Only placement officer users can modify placement schedules.",
      });
    }
  };

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = async (newData) => {
    // const formattedDate = newData.date && format(newData.date, "yyyy-MM-dd");

    // const formattedTime = newData.time && format(newData.time, "HH:mm:ss");

    const updatedData = {
      placement_type: newData.placementType,
      company_name: newData.company || companyName,
      ctc: newData.ctc || salary,
      description: newData.descriptionInput || description,
      schedule_at: format(newData.time, "HH:mm:ss"),
      placement_date: format(newData.date, "yyyy-MM-dd"),
      end_date_time: format(newData.endDateTime, "yyyy-MM-dd HH:mm:ss"),
      eligibility_criteria: newData.eligibilityCriteria || eligibilityCriteria,
      location: newData.locationInput || location,
      role: newData.role || position,
    };

    try {
      const response = await placementApi.updatePlacementEvent(
        jobId,
        updatedData,
      );

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Placement schedule updated successfully!",
          color: "green",
          position: "top-center",
          autoClose: 3000,
        });

        setModalOpened(false);
      } else {
        const errorData = await response.json();
        const error = {
          response: {
            status: response.status,
            data: errorData,
          },
        };
        console.error("Update failed:", errorData);

        showApiError({
          error,
          title: "Error Updating Schedule",
          fallback: "Failed to update placement schedule.",
          authorizationFallback:
            "Only placement officer users can modify placement schedules.",
        });
      }
    } catch (error) {
      console.error("Error:", error);

      showApiError({
        error,
        fallback: "An error occurred while updating the placement schedule.",
        authorizationFallback:
          "Only placement officer users can modify placement schedules.",
      });
    }
  };

  const handleTimeline = async () => {
    navigate(`/placement-cell/timeline?jobId=${encodeURIComponent(jobId)}`);
  };

  const handleWithdraw = async () => {
    try {
      await placementApi.withdrawApplication(jobId);
      setHasApplied(false);
      notifications.show({
        title: "Success",
        message: "Application withdrawn successfully.",
        color: "green",
        position: "top-center",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail ||
          "Could not withdraw this application right now.",
        color: "red",
        position: "top-center",
      });
    }
  };

  if (!visible) return null;

  return (
    <>
      <Card
        shadow="sm"
        padding="lg"
        radius="lg"
        m={4}
        withBorder
        style={{ width: 320, position: "relative" }}
      >
        {/* <Group align="flex-start">
          <Image
            src={companyLogo}
            alt={`${companyName} logo`}
            width={40}
            height={40}
            fit="contain"
            withPlaceholder
          />
        </Group> */}
        <Title order={3} align="left" style={{ marginBottom: "20px" }}>
          {companyName}
        </Title>
        {role === "student" && (
          <Group mb="xs">
            <Badge color={eligible === false ? "red" : "green"} variant="light">
              {eligible === false ? "Ineligible" : "Eligible"}
            </Badge>
          </Group>
        )}

        <Text
          size="sm"
          color="dimmed"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {description}
        </Text>
        <Group spacing={5} mt={5}>
          <MapPin size={16} />
          <Text size="sm" color="dimmed">
            {location}
          </Text>
        </Group>

        <Text size="sm" color="dimmed" mt={5}>
          <strong>Position:</strong> {position}
        </Text>
        {role === "student" && eligibilityCriteria?.length > 0 && (
          <Text size="sm" color="dimmed" mt={5}>
            <strong>Eligibility:</strong> {eligibilityCriteria.join(", ")}
          </Text>
        )}
        {role === "student" &&
          eligible === false &&
          eligibilityReasons?.length > 0 && (
            <Text size="sm" c="red" mt={5}>
              {eligibilityReasons.join(" ")}
            </Text>
          )}

        <Group mt="xs" spacing={5}>
          <Clock size={16} />
          <Text size="sm" color="dimmed">
            <strong>Start:</strong> {formatDisplayDate(deadline)}
          </Text>
        </Group>

        <Group
          position="apart"
          mt="md"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Text size="xl" weight={700} color="blue">
            {salary}
          </Text>

          {role === "student" &&
            (hasApplied ? (
              <Group gap="xs">
                <Button
                  variant="subtle"
                  color="blue"
                  size="xs"
                  onClick={handelViewClick}
                >
                  Details
                </Button>
                <Button
                  variant="light"
                  color="green"
                  size="xs"
                  onClick={handleTimeline}
                >
                  View
                </Button>
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  onClick={handleWithdraw}
                >
                  Withdraw
                </Button>
              </Group>
            ) : (
              <Button
                disabled={eligible === false || isClosed}
                variant="light"
                color="blue"
                size="xs"
                onClick={handleApplyClick}
              >
                Apply Now
              </Button>
            ))}

          {role === "student" && !hasApplied && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={handelViewClick}
            >
              View Details
            </Button>
          )}

          {isPlacementAdmin && (
            <Group position="right" spacing="xs">
              <ActionIcon
                onClick={handleEditClick}
                color="blue"
                size="md"
                variant="light"
              >
                <Pencil size={22} />
              </ActionIcon>

              <ActionIcon
                onClick={handelViewClick}
                color="blue"
                size="md"
                variant="light"
              >
                <Eye size={22} />
              </ActionIcon>

              <ActionIcon
                onClick={handleDeleteClick}
                color="red"
                size="md"
                variant="light"
              >
                <Trash size={22} />
              </ActionIcon>
            </Group>
          )}
        </Group>
      </Card>

      {/* Modal for editing placement */}
      <EditPlacementForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        placementData={{
          companyName,
          location,
          position,
          jobType,
          postedTime,
          deadline,
          endDateTime,
          description,
          salary,
          eligibilityCriteria,
        }}
        onSubmit={(newData) => handleSubmit(newData)}
      />

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        centered
        size="lg"
      >
        <Container d>
          <ApplyForPlacementForm
            jobID={jobId}
            prefilledFields={prefilledFields}
            additionalFields={additionalFields}
            onSubmit={handelApplySubmit}
          />
        </Container>
      </Modal>
    </>
  );
}

PlacementScheduleCard.propTypes = {
  jobId: PropTypes.string.isRequired,
  companyName: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  jobType: PropTypes.string.isRequired,
  postedTime: PropTypes.string.isRequired,
  deadline: PropTypes.string,
  endDateTime: PropTypes.string,
  description: PropTypes.string,
  salary: PropTypes.string,
  eligibilityCriteria: PropTypes.arrayOf(PropTypes.string),
  eligible: PropTypes.bool,
  eligibilityReasons: PropTypes.arrayOf(PropTypes.string),
  check: PropTypes.bool,
};

export default PlacementScheduleCard;
