/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Text,
  Card,
  Grid,
  Badge,
  Group,
  Loader
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet } from "../api";
import { calendarEventsRoute } from "../../../routes/placementCellRoutes";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PlacementCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGet(calendarEventsRoute);
        setEvents(Array.isArray(res) ? res : []);
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to fetch calendar events",
          color: "red"
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  // Group events by month
  const grouped = {};
  events.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!grouped[key]) {
      grouped[key] = {
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        events: []
      };
    }
    grouped[key].events.push(e);
  });

  const sortedKeys = Object.keys(grouped).sort().reverse();

  return (
    <div>
      <Text fw={600} size="xl" mb="lg">
        Placement Calendar
      </Text>

      {sortedKeys.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No events scheduled.
        </Text>
      ) : (
        sortedKeys.map((key) => (
          <div key={key} style={{ marginBottom: "1.5rem" }}>
            <Text fw={600} size="lg" mb="sm" c="blue">
              {grouped[key].label}
            </Text>
            <Grid gutter="lg">
              {grouped[key].events.map((event) => {
                const d = new Date(event.date);
                const isPast = d < new Date();
                return (
                  <Grid.Col
                    key={event.id}
                    span={{ base: 12, sm: 6, md: 4 }}
                  >
                    <Card shadow="xs" padding="md" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text fw={500}>{event.company_name || event.title}</Text>
                        <Badge
                          color={isPast ? "gray" : "green"}
                          variant="light"
                          size="sm"
                        >
                          {isPast ? "Past" : "Upcoming"}
                        </Badge>
                      </Group>
                      <Group gap="lg">
                        <div>
                          <Text size="xs" c="dimmed">Date</Text>
                          <Text size="sm" fw={500}>
                            {d.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </Text>
                        </div>
                        {event.time && (
                          <div>
                            <Text size="xs" c="dimmed">Time</Text>
                            <Text size="sm" fw={500}>{event.time}</Text>
                          </div>
                        )}
                        {event.location && (
                          <div>
                            <Text size="xs" c="dimmed">Location</Text>
                            <Text size="sm" fw={500}>{event.location}</Text>
                          </div>
                        )}
                      </Group>
                      {event.placement_type && (
                        <Badge mt="sm" variant="outline" color="violet" size="sm">
                          {event.placement_type}
                        </Badge>
                      )}
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          </div>
        ))
      )}
    </div>
  );
}
