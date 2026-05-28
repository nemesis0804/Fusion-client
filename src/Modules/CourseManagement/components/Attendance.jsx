import { useState } from "react";
import {
  Card,
  Tabs,
  Title,
  Container,
  Center,
  Stack,
  rem,
} from "@mantine/core";
import SubmitAttendance from "./Attendance/SubmitAttendance";
import ViewAttendance from "./Attendance/viewAttendance";
import "./Attendance.css";

function Attendance() {
  const [activeTab, setActiveTab] = useState("view");

  return (
    <Container size="lg" py="xl">
      <Center>
        <Card
          shadow="lg"
          radius="xl"
          p="xl"
          withBorder
          style={{ width: rem(700), maxWidth: "100%" }}
        >
          <Stack spacing="xl" align="stretch">
            <Title
              order={2}
              align="center"
              style={{ color: "#1c7ed6", fontWeight: 600 }}
            >
              Attendance Management
            </Title>

            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              variant="pills"
              color="blue"
              radius="md"
              keepMounted={false}
            >
              <Tabs.List grow mb="md">
                <Tabs.Tab value="view">View Attendance</Tabs.Tab>
                <Tabs.Tab value="submit">Submit Attendance</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="view">
                <ViewAttendance />
              </Tabs.Panel>

              <Tabs.Panel value="submit">
                <SubmitAttendance />
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Card>
      </Center>
    </Container>
  );
}

export default Attendance;
