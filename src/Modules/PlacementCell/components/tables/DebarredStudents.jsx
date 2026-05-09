import { useEffect, useState } from "react";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import {
  Button,
  Container,
  Group,
  Modal,
  Text,
  TextInput,
  Textarea,
  Title,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Trash } from "@phosphor-icons/react";
import { placementApi } from "../../services/api";
import { showApiError } from "../../utils/authorization";

const columns = [
  { accessorKey: "roll_no", header: "Roll No" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Reason" },
];

function DebarredStudents() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [debarredStudents, setDebarredStudents] = useState([]);
  const [rollNo, setRollNo] = useState("");
  const [reason, setReason] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDebarredStudents = async () => {
      try {
        const res = await placementApi.getDebarredStudents();
        if (res.status === 200) {
          setDebarredStudents(res.data);
        }
      } catch (error) {
        setIsError(true);
        showApiError({
          error,
          fallback: "Failed to fetch debarred students.",
          authorizationFallback:
            "Only placement officer users can access debarred students.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebarredStudents();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setRollNo("");
    setReason("");
    setStudentDetails(null);
  };

  const handleFetchStudentDetails = async () => {
    if (!rollNo) return;
    const formattedRoll = rollNo.toUpperCase();

    try {
      const res = await placementApi.getDebarredStatus(formattedRoll);
      if (res.status === 200) {
        setStudentDetails(res.data);
      }
    } catch (error) {
      showApiError({
        error,
        fallback: `No student found with roll number: ${rollNo}`,
        authorizationFallback:
          "Only placement officer users can manage debarred status.",
      });
    }
  };

  const handleUnDebarStudent = async (rollNumber) => {
    const formattedRoll = rollNumber.toUpperCase();

    try {
      const response = await placementApi.removeDebarredStatus(rollNumber);

      if (response.status === 200) {
        notifications.show({
          title: "Success",
          message: "Removed student from debarred list.",
          color: "green",
        });

        setDebarredStudents((prev) =>
          prev.filter((student) => student.roll_no !== rollNumber),
        );
      } else {
        notifications.show({
          title: "Failed",
          message: `Failed to remove debarred status for Roll No: ${rollNumber}.`,
          color: "red",
        });
      }

      const notificationData = {
        sendTo: "Student",
        recipient: formattedRoll,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        type: "Your Un-debarred",
        description: `You have un-debarred.`,
      };

      try {
        await placementApi.sendNotification(notificationData);

        notifications.show({
          title: "Notification Sent",
          message: "Notification sent to the student successfully!",
          color: "green",
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        notifications.show({
          title: "Error Sending Notification",
          message: "Student was un-debarred, but notification failed.",
          color: "red",
        });
      }
    } catch (error) {
      showApiError({
        error,
        fallback: "An error occurred while removing the debarred status.",
        authorizationFallback:
          "Only placement officer users can manage debarred status.",
      });
    }
  };

  const handleConfirmUnDebar = (rollNumber) => {
    const confirm = window.confirm(
      `Are you sure you want to remove the debarred status for Roll No: ${rollNumber}?`,
    );
    if (confirm) {
      handleUnDebarStudent(rollNumber);
    }
  };

  const handleDebarStudent = async () => {
    const formattedRoll = rollNo.toUpperCase();
    if (!formattedRoll || !reason || !studentDetails) {
      notifications.show({
        title: "Error",
        message: "Please fill all required fields and fetch student details.",
        color: "red",
      });
      return;
    }

    setLoading(true);
    const payload = {
      rollno: formattedRoll,
      name: studentDetails.name,
      reason,
    };

    try {
      const response = await placementApi.debarStudent(formattedRoll, payload);

      if (response.status === 200) {
        setDebarredStudents((prev) => [
          ...prev,
          {
            roll_no: payload.rollno,
            description: payload.reason,
            name: payload.name,
          },
        ]);
        setIsModalOpen(false);
        setRollNo("");
        setReason("");
        setStudentDetails(null);

        notifications.show({
          title: "Success",
          message: "Student debarred successfully!",
          color: "green",
        });

        const notificationData = {
          sendTo: "Student",
          recipient: formattedRoll,
          date: new Date().toISOString(),
          time: new Date().toLocaleTimeString(),
          type: "You are debarred",
          description: `You have been debarred for the following reason: ${reason}`,
        };

        try {
          await placementApi.sendNotification(notificationData);

          notifications.show({
            title: "Notification Sent",
            message: "Notification sent to the student successfully!",
            color: "green",
          });
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
          notifications.show({
            title: "Error Sending Notification",
            message: "Student was debarred, but notification failed.",
            color: "red",
          });
        }
      }
    } catch (error) {
      console.error("Error debarring student:", error);
      showApiError({
        error,
        fallback: "An error occurred while debarring the student.",
        authorizationFallback:
          "Only placement officer users can manage debarred status.",
      });
    } finally {
      setLoading(false);
    }
  };

  const table = useMantineReactTable({
    columns,
    data: debarredStudents,
    enableEditing: false,
    getRowId: (row) => row.id,
    enableRowActions: true,
    positionActionsColumn: "last",
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Actions",
      },
    },
    renderRowActions: ({ row }) => (
      <ActionIcon
        color="red"
        onClick={() => handleConfirmUnDebar(row.original.roll_no)}
        title="Remove Student"
      >
        <Trash size={18} />
      </ActionIcon>
    ),
    mantineToolbarAlertBannerProps: isError
      ? { color: "red", children: "Error loading data" }
      : undefined,
    state: {
      isLoading,
      showAlertBanner: isError,
    },
  });

  return (
    <Container fluid mt={32}>
      <Container
        fluid
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        my={16}
      >
        <Title order={2}>Debarred Students</Title>
        <Group position="right">
          <Button variant="outline" onClick={handleOpenModal}>
            Debar a Student
          </Button>
        </Group>
      </Container>

      <MantineReactTable table={table} />

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        centered
        size="lg"
        title="Debar a Student"
      >
        <TextInput
          label="Roll Number"
          placeholder="e.g., 22bcs169"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          required
          mb="md"
        />
        <Group position="right" mb="md">
          <Button onClick={handleFetchStudentDetails}>
            Fetch Student Details
          </Button>
        </Group>

        {studentDetails && (
          <>
            <Text weight={500} mb="xs">
              <strong>Name:</strong> {studentDetails.name}
            </Text>
            <Text weight={500} mb="xs">
              <strong>Programme:</strong> {studentDetails.programme}
            </Text>
            <Text weight={500} mb="xs">
              <strong>Year:</strong> {studentDetails.year}
            </Text>
            <Text weight={500} mb="xs">
              <strong>Department:</strong> {studentDetails.department}
            </Text>
            <Text weight={500} mb="xs">
              <strong>Email:</strong> {studentDetails.email}
            </Text>

            <Textarea
              label="Reason for Debarring"
              placeholder="Enter a clear reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              autosize
              minRows={3}
              mb="lg"
            />

            <Group position="right">
              <Button loading={loading} onClick={handleDebarStudent}>
                Debar Student
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </Container>
  );
}

export default DebarredStudents;
