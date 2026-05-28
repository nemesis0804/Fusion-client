import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ArrowLeft, Check, Clock, Minus, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { placementApi } from "../../services/api";
import { getJobIdFromSearch } from "../../utils/helpers";

const PROCESS_STAGES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Released",
  "Selected",
];

function formatDisplayDate(value) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStageStatus(stageName, timelineNames, isRejected) {
  if (isRejected && !timelineNames.includes(stageName)) {
    return "inactive";
  }

  if (timelineNames.includes(stageName)) {
    return "completed";
  }

  const currentIndex = PROCESS_STAGES.findIndex((stage) => timelineNames.includes(stage));
  const stageIndex = PROCESS_STAGES.indexOf(stageName);

  if (currentIndex !== -1 && stageIndex === currentIndex + 1) {
    return "pending";
  }

  return "inactive";
}

function getRoundBadge(round, index, activeIndex) {
  if (index === activeIndex) {
    return { label: "ACTIVE", color: "blue" };
  }

  if (index < activeIndex) {
    return { label: "RESCHEDULED", color: "gray" };
  }

  if (!round.test_date) {
    return { label: "PENDING", color: "gray" };
  }

  return { label: "UPCOMING", color: "yellow" };
}

function getRoundSubText(round) {
  if (round.feedback?.trim()) {
    return round.feedback;
  }

  if (round.description?.trim()) {
    return round.description;
  }

  return "Interview details shared by placement office";
}

function formatOutcomeLabel(value) {
  if (!value) {
    return "Pending";
  }

  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "failed") {
    return "Rejected";
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
}

function getOutcomeColor(value) {
  switch ((value || "").toLowerCase()) {
    case "selected":
    case "passed":
      return "green";
    case "failed":
      return "red";
    default:
      return "yellow";
  }
}

function ApplicationStatusTimeline() {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStatusData() {
      const jobId = getJobIdFromSearch();

      try {
        const response = await placementApi.getTimeline(jobId);
        setStatusData(response.data.next_data || []);
      } catch (error) {
        console.error("Error fetching application status data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatusData();
  }, []);

  const interviewRounds = useMemo(
    () =>
      statusData.filter(
        (item) =>
          item.test_date &&
          item.test_name !== "Applied" &&
          item.round_no !== -1,
      ),
    [statusData],
  );

  const timelineNames = useMemo(
    () => statusData.map((item) => item.test_name),
    [statusData],
  );

  const isRejected = timelineNames.includes("Rejected");
  const activeRoundIndex =
    interviewRounds.length > 0 ? interviewRounds.length - 1 : -1;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <Container fluid>
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Group>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => navigate("/placement-cell")}
              >
                <ArrowLeft size={18} />
              </ActionIcon>
              <Title order={3}>Application Timeline</Title>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Card withBorder radius="md" padding="lg">
              <Stack gap="lg">
                <Title order={4}>Application Timeline</Title>

                <div style={{ position: "relative", paddingLeft: "14px" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "7px",
                      top: "10px",
                      bottom: "10px",
                      width: "2px",
                      backgroundColor: "#d9dee7",
                    }}
                  />

                  <Stack gap="xl">
                    {PROCESS_STAGES.map((stageName) => {
                      const stageStatus = getStageStatus(
                        stageName,
                        timelineNames,
                        isRejected,
                      );
                      const matchedItem = statusData.find(
                        (item) => item.test_name === stageName,
                      );

                      const badgeProps =
                        stageStatus === "completed"
                          ? { color: "green", label: "COMPLETED" }
                          : stageStatus === "pending"
                            ? { color: "gray", label: "PENDING" }
                            : { color: "dark", label: "PENDING" };

                      return (
                        <Group
                          key={stageName}
                          align="flex-start"
                          gap="sm"
                          wrap="nowrap"
                        >
                          <div
                            style={{
                              marginTop: "4px",
                              width: "14px",
                              height: "14px",
                              borderRadius: "999px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor:
                                stageStatus === "completed"
                                  ? "#2f9e44"
                                  : stageStatus === "pending"
                                    ? "#868e96"
                                    : "#adb5bd",
                              color: "white",
                              zIndex: 1,
                            }}
                          >
                            {stageStatus === "completed" ? (
                              <Check size={9} weight="bold" />
                            ) : stageStatus === "pending" ? (
                              <Clock size={9} weight="fill" />
                            ) : (
                              <Minus size={9} weight="bold" />
                            )}
                          </div>

                          <Stack gap={2} style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Text fw={600}>{stageName}</Text>
                              <Badge color={badgeProps.color} radius="xl" size="sm">
                                {badgeProps.label}
                              </Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                              {matchedItem?.test_date
                                ? `Updated at ${formatDisplayDate(matchedItem.test_date)}`
                                : stageStatus === "completed"
                                  ? matchedItem?.description || "Completed"
                                  : "Pending"}
                            </Text>

                            <Text size="sm" c="dimmed">
                              {matchedItem?.description ||
                                (stageStatus === "completed"
                                  ? stageName
                                  : "Pending")}
                            </Text>
                          </Stack>
                        </Group>
                      );
                    })}

                    {isRejected && (
                      <Group align="flex-start" gap="sm" wrap="nowrap">
                        <div
                          style={{
                            marginTop: "4px",
                            width: "14px",
                            height: "14px",
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#e03131",
                            color: "white",
                            zIndex: 1,
                          }}
                        >
                          <X size={9} weight="bold" />
                        </div>

                        <Stack gap={2} style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Text fw={600}>Rejected</Text>
                            <Badge color="red" radius="xl" size="sm">
                              CLOSED
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">
                            Application rejected
                          </Text>
                        </Stack>
                      </Group>
                    )}
                  </Stack>
                </div>
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Stack gap="lg">
                <Title order={4}>Interview Schedule</Title>

                {interviewRounds.length ? (
                  interviewRounds.map((round, index) => {
                    const badge = getRoundBadge(round, index, activeRoundIndex);

                    return (
                      <Card key={`${round.test_name}-${index}`} withBorder radius="md" padding="md">
                        <Group justify="space-between" align="flex-start">
                          <Stack gap={2}>
                            <Text fw={700}>
                              {round.test_name || `Round ${round.round_no}`}
                            </Text>
                            <Text size="sm" fw={600}>
                              Scheduled at:{" "}
                              {formatDisplayDate(
                                round.start_datetime || round.test_date,
                              )}
                            </Text>
                            {round.end_datetime && (
                              <Text size="sm" fw={600}>
                                Ends at: {formatDisplayDate(round.end_datetime)}
                              </Text>
                            )}
                            <Text size="sm">
                              Mode: {round.mode || "TBD"}
                            </Text>
                            <Text size="sm">
                              Location / Link:{" "}
                              {round.location_link?.trim() || "-"}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {getRoundSubText(round)}
                            </Text>
                            <Group gap="xs">
                              <Text size="sm">Result:</Text>
                              <Badge
                                color={getOutcomeColor(round.outcome)}
                                radius="xl"
                                size="sm"
                              >
                                {formatOutcomeLabel(round.outcome)}
                              </Badge>
                            </Group>
                          </Stack>

                          <Badge color={badge.color} radius="xl">
                            {badge.label}
                          </Badge>
                        </Group>
                      </Card>
                    );
                  })
                ) : (
                  <Card withBorder radius="md" padding="md">
                    <Text size="sm" c="dimmed">
                      No interview rounds have been scheduled yet.
                    </Text>
                  </Card>
                )}
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>
    </div>
  );
}

export default ApplicationStatusTimeline;
