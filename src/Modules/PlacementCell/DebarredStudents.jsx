/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  TextInput,
  Button,
  Modal,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiDelete } from "./api.js";
import {
  debarredStudentsRoute,
  debarredStatusRoute,
} from "../../routes/placementCellRoutes/index.jsx";

function DebarModal({ opened, onClose, onSuccess }) {
  const [rollNo, setRollNo] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!rollNo.trim()) return;
    setSearchLoading(true);
    try {
      const formatted = rollNo.replace("/", "-");
      const res = await apiGet(`${debarredStatusRoute}${formatted}/`);
      setStudentInfo(res);
    } catch {
      notifications.show({
        title: "Error",
        message: "Student not found",
        color: "red",
      });
      setStudentInfo(null);
    }
    setSearchLoading(false);
  };

  const handleDebar = async () => {
    setLoading(true);
    try {
      await apiPost(debarredStudentsRoute, { roll_no: rollNo });
      notifications.show({
        title: "Success",
        message: `${rollNo} has been debarred`,
        color: "green",
      });
      onSuccess();
      onClose();
      setRollNo("");
      setStudentInfo(null);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to debar student",
        color: "red",
      });
    }
    setLoading(false);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Debar Student" centered>
      <Stack>
        <Group>
          <TextInput
            label="Roll Number"
            placeholder="e.g. 2021BCS001"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            mt={24}
            onClick={handleSearch}
            loading={searchLoading}
            variant="outline"
          >
            Search
          </Button>
        </Group>

        {studentInfo && (
          <div>
            <Text size="sm">
              <strong>Name:</strong> {studentInfo.name}
            </Text>
            <Text size="sm">
              <strong>Current Status:</strong>{" "}
              <Badge
                color={studentInfo.debar === "DEBAR" ? "red" : "green"}
                variant="light"
              >
                {studentInfo.debar}
              </Badge>
            </Text>
          </div>
        )}

        <Button
          onClick={handleDebar}
          loading={loading}
          disabled={!rollNo.trim()}
          color="red"
          fullWidth
        >
          Debar Student
        </Button>
      </Stack>
    </Modal>
  );
}

export default function DebarredStudents({ role }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet(debarredStudentsRoute);
      setStudents(Array.isArray(res) ? res : []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch debarred students",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUndebar = async (rollNo) => {
    try {
      await apiDelete(debarredStudentsRoute, { roll_no: rollNo });
      notifications.show({
        title: "Success",
        message: `${rollNo} has been undebarred`,
        color: "green",
      });
      fetchData();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to undebar student",
        color: "red",
      });
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Text fw={600} size="xl">
          Debarred Students
        </Text>
        {isOfficer && (
          <Button color="red" onClick={() => setModalOpen(true)}>
            + Debar Student
          </Button>
        )}
      </Group>

      {students.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Roll No</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Status</Table.Th>
              {isOfficer && <Table.Th>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {students.map((s, i) => (
              <Table.Tr key={s.id || i}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>{s.student_roll}</Table.Td>
                <Table.Td>{s.student_name}</Table.Td>
                <Table.Td>
                  <Badge color="red" variant="light">
                    DEBARRED
                  </Badge>
                </Table.Td>
                {isOfficer && (
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      onClick={() => handleUndebar(s.student_roll)}
                    >
                      Undebar
                    </Button>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No debarred students.
        </Text>
      )}

      <DebarModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
