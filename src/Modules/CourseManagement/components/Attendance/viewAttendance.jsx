import { useState, useEffect } from "react";
import {
  Table,
  LoadingOverlay,
  TextInput,
  Group,
  Button,
  Paper,
  Title,
  Stack,
} from "@mantine/core";
import axios from "axios";
import { getAttendance } from "../../../../routes/courseMgmtRoutes";
import "./Attendance_global.css";

function ViewAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    student_id: "",
    instructor_id: "",
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      const params = {
        student_id: filters.student_id,
        instructor_id: filters.instructor_id,
      };

      const response = await axios.get(getAttendance, {
        params,
        headers: { Authorization: `Token ${token}` },
      });

      setAttendanceData(response.data.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert(error.response?.data?.error || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  return (
    <Paper shadow="xs" p="lg" radius="md">
      <Stack spacing="md">
        <Title order={4} align="center">
          Attendance Records
        </Title>

        <form onSubmit={handleFilterSubmit}>
          <Group grow spacing="sm" wrap="wrap">
            <TextInput
              label="Student ID"
              placeholder="Enter student ID"
              value={filters.student_id}
              onChange={(e) => handleFilterChange("student_id", e.target.value)}
            />
            <TextInput
              label="Instructor ID"
              placeholder="Enter instructor ID"
              value={filters.instructor_id}
              onChange={(e) =>
                handleFilterChange("instructor_id", e.target.value)
              }
            />
            <Button
              type="submit"
              variant="filled"
              color="blue"
              style={{ marginTop: "24px" }}
            >
              View Attendance
            </Button>
          </Group>
        </form>

        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} />
          <Table striped highlightOnHover withColumnBorders>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((record) => (
                  <tr key={record.id}>
                    <td>{record.student_id}</td>
                    <td>{record.student_name || "-"}</td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={
                          record.present ? "present-status" : "absent-status"
                        }
                      >
                        {record.present ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td>{record.course_code || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", color: "#888" }}
                  >
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Stack>
    </Paper>
  );
}

export default ViewAttendance;
