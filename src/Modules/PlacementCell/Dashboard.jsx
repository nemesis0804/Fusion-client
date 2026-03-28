/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  Text,
  Group,
  Loader,
  Button,
  Stack,
  Badge,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet } from "./api.js";
import { dashboardRoute } from "../../routes/placementCellRoutes/index.jsx";

function StatCard({ label, value, color }) {
  const colors = {
    blue: { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    green: { bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
    orange: { bg: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)" },
    purple: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    teal: { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
    red: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  };

  return (
    <Card
      shadow="md"
      radius="lg"
      p="lg"
      style={{
        background: colors[color]?.bg || colors.blue.bg,
        color: "white",
        minHeight: 120,
      }}
    >
      <Text size="xs" opacity={0.85} tt="uppercase" fw={600} lts={1}>
        {label}
      </Text>
      <Text
        size="2.5rem"
        fw={800}
        lh={1}
        mt="xs"
        style={{ fontFamily: "Manrope" }}
      >
        {value ?? 0}
      </Text>
    </Card>
  );
}

export default function Dashboard({ onTabChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGet(dashboardRoute);
        setData(res);
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to load dashboard",
          color: "red",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader size="lg" />
      </div>
    );

  if (!data) return null;

  const isStudent = data.is_student;
  const isOfficer = data.is_officer || data.is_chairman;

  return (
    <div>
      <Text size="1.5rem" fw={700} mb="lg" style={{ fontFamily: "Manrope" }}>
        Placement Cell Dashboard
      </Text>

      {isStudent && (
        <>
          <Grid gutter="lg" mb="xl">
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard
                label="Active Jobs"
                value={data.active_postings}
                color="blue"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard
                label="My Applications"
                value={data.my_apps}
                color="teal"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard
                label="Pending Offers"
                value={data.my_offers_count}
                color="orange"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard
                label="Announcements"
                value={data.recent_announcements?.length}
                color="purple"
              />
            </Grid.Col>
          </Grid>

          {data.recent_announcements?.length > 0 && (
            <>
              <Text fw={600} size="lg" mb="sm">
                Recent Announcements
              </Text>
              <Stack gap="xs">
                {data.recent_announcements.map((ann) => (
                  <Card
                    key={ann.id}
                    shadow="xs"
                    padding="sm"
                    radius="md"
                    withBorder
                  >
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{ann.title}</Text>
                        <Text size="xs" c="dimmed">
                          {ann.announcement_type} •{" "}
                          {new Date(ann.created_at).toLocaleDateString("en-IN")}
                        </Text>
                      </div>
                      {ann.announcement_type && (
                        <Badge variant="light" size="sm">
                          {ann.announcement_type}
                        </Badge>
                      )}
                    </Group>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {isOfficer && (
        <>
          <Grid gutter="lg" mb="xl">
            <Grid.Col span={{ base: 6, md: 2 }}>
              <StatCard
                label="Companies"
                value={data.total_companies}
                color="blue"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <StatCard
                label="Pending"
                value={data.pending_companies}
                color="orange"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <StatCard
                label="Active Postings"
                value={data.active_postings}
                color="teal"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <StatCard
                label="Applications"
                value={data.total_applications}
                color="purple"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <StatCard
                label="Pending Offers"
                value={data.pending_offers}
                color="red"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <StatCard
                label="Accepted"
                value={data.accepted_offers}
                color="green"
              />
            </Grid.Col>
          </Grid>

          <Divider mb="lg" />

          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Text fw={600} size="lg" mb="sm">
                Quick Actions
              </Text>
              <Stack gap="xs">
                <Button
                  variant="light"
                  fullWidth
                  justify="flex-start"
                  leftSection="+"
                  onClick={() => onTabChange && onTabChange("Job Postings")}
                >
                  Create Job Posting
                </Button>
                <Button
                  variant="light"
                  fullWidth
                  justify="flex-start"
                  leftSection="+"
                  onClick={() => onTabChange && onTabChange("Announcements")}
                >
                  Create Announcement
                </Button>
                <Button
                  variant="light"
                  fullWidth
                  justify="flex-start"
                  leftSection="+"
                  onClick={() => onTabChange && onTabChange("Companies")}
                >
                  Register Company
                </Button>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Text fw={600} size="lg" mb="sm">
                Recent Applications
              </Text>
              {data.recent_applications?.length > 0 ? (
                <Stack gap="xs">
                  {data.recent_applications.map((app, i) => (
                    <Card
                      key={app.id || i}
                      shadow="xs"
                      padding="sm"
                      radius="md"
                      withBorder
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">
                            {app.student_name} — {app.job_title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {app.company_name} •{" "}
                            {new Date(app.applied_at).toLocaleDateString(
                              "en-IN",
                            )}
                          </Text>
                        </div>
                        <Badge
                          variant="light"
                          size="sm"
                          color={
                            app.status === "APPLIED"
                              ? "blue"
                              : app.status === "SHORTLISTED"
                                ? "teal"
                                : app.status === "OFFER_ACCEPTED"
                                  ? "green"
                                  : app.status === "REJECTED"
                                    ? "red"
                                    : "gray"
                          }
                        >
                          {app.status}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" size="sm">
                  No recent applications.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        </>
      )}
    </div>
  );
}
