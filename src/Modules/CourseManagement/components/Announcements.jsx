import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Card,
  Text,
  Image,
  Textarea,
  Button,
  Select,
  Loader,
  Modal,
} from "@mantine/core";
import "./Announcement.css";
import AvatarImage from "../../../assets/avatar.png";

function Announcement() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("custom");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [courseCode, setCourseCode] = useState("");
  // New state for modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentCourseCode = "CS101";

  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/course_students/${currentCourseCode}/`,
      );
      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  }, [currentCourseCode]);

  useEffect(() => {
    setCourseCode(currentCourseCode);
    fetchStudents();
  }, [currentCourseCode, fetchStudents]);

  const sendNotification = async (recipientId) => {
    await axios.post("/api/send_notification/", {
      recipient_id: recipientId,
      type: notificationType,
      course_code: courseCode,
      message,
    });
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMessage("Please enter a message for your announcement");
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("course_code", courseCode);
      }

      if (selectedStudent === "all") {
        await Promise.all(
          students.map((student) => sendNotification(student.user_id)),
        );

        setSuccessMessage(
          `Your ${
            notificationType === "custom"
              ? "general"
              : notificationType.replace("_", " ")
          } announcement has been sent to all the students in ${courseCode}
          }.`,
        );
      } else {
        await sendNotification(selectedStudent);

        // Find student name if sending to specific student
        const studentObj = students.find(
          (s) => s.user_id.toString() === selectedStudent,
        );
        const studentName = studentObj ? studentObj.name : selectedStudent;

        setSuccessMessage(
          `Your ${
            notificationType === "custom"
              ? "general"
              : notificationType.replace("_", " ")
          } announcement has been sent to ${studentName} in ${courseCode}
          }.`,
        );
      }

      setSuccessModalOpen(true);
      setMessage("");
      setFile(null);
    } catch (error) {
      console.error("Error submitting announcement:", error);
      setErrorMessage(
        `Failed to send announcement: ${error.response?.data?.error || error.message}`,
      );
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcementWrapper">
      {/* Success Modal */}
      <Modal
        opened={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Announcement Sent Successfully!"
        centered
        size="lg"
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📣</div>
          <Text size="lg" style={{ marginBottom: "20px" }}>
            {successMessage}
          </Text>
          <Button
            color="green"
            onClick={() => setSuccessModalOpen(false)}
            style={{ marginTop: "10px" }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        opened={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Error Sending Announcement"
        centered
        size="md"
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>❌</div>
          <Text size="lg" color="red" style={{ marginBottom: "20px" }}>
            {errorMessage}
          </Text>
          <Button
            color="red"
            onClick={() => setErrorModalOpen(false)}
            style={{ marginTop: "10px" }}
          >
            Close
          </Button>
        </div>
      </Modal>

      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        className="cardContainer"
      >
        <Card.Section>
          <div className="announcementHeader">
            <Image
              src={AvatarImage}
              alt="Instructor"
              width={80}
              height={80}
              radius="50%"
              className="profileImage"
            />
            <div className="announcementInfo">
              <Text className="fusionText">Prof. Atul Gupta</Text>
              <Text style={{ color: "grey", opacity: 0.6 }} size="sm">
                New Announcement
              </Text>
            </div>
          </div>
        </Card.Section>

        <Card.Section style={{ padding: "1rem" }}>
          <Textarea
            placeholder="Enter your announcement message here..."
            label="Enter your Announcement:"
            autosize
            minRows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            styles={{
              label: {
                fontSize: "1.15rem",
                fontWeight: 500,
              },
            }}
          />

          <div style={{ marginTop: "1rem" }}>
            <Select
              label="Notification Type"
              placeholder="Select notification type"
              data={[
                { value: "custom", label: "General Announcement" },
                { value: "new_slide", label: "New Slide Upload" },
                { value: "new_assignment", label: "New Assignment" },
                { value: "grade_updated", label: "Grade Update" },
              ]}
              value={notificationType}
              onChange={setNotificationType}
              styles={{
                label: {
                  fontSize: "1rem",
                  fontWeight: 500,
                },
              }}
            />
          </div>

          {students && students.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <Select
                label="Send To"
                placeholder="Select recipient"
                data={[
                  { value: "all", label: "All Students" },
                  ...students.map((student) => ({
                    value: student.user_id.toString(),
                    label: `${student.name} (${student.id})`,
                  })),
                ]}
                value={selectedStudent}
                onChange={setSelectedStudent}
                styles={{
                  label: {
                    fontSize: "1rem",
                    fontWeight: 500,
                  },
                }}
              />
            </div>
          )}

          <Button
            className="customButton"
            style={{ marginTop: "1rem", backgroundColor: "#15abff" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader size="sm" color="white" /> : "Submit"}
          </Button>
        </Card.Section>
      </Card>
    </div>
  );
}

export default Announcement;
