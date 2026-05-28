import { useState } from "react";
import {
  Button,
  FileInput,
  LoadingOverlay,
  Paper,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import axios from "axios";
import { uploadAttendance } from "../../../../routes/courseMgmtRoutes";
import "./Attendance_global.css";

function SubmitAttendance() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("authToken");
      const response = await axios.post(uploadAttendance, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult({
        success: true,
        message: ` Processed ${response.data.success_count} rows successfully`,
        errors: response.data.errors,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `${error.response?.data?.error || "Failed to upload attendance file"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="xs" p="lg" radius="md">
      <Stack spacing="md">
        <Title order={4} align="center">
          Upload Attendance
        </Title>

        <FileInput
          label="Select Attendance Excel File"
          accept=".xlsx,.xls"
          value={file}
          onChange={setFile}
        />

        <Button
          onClick={handleSubmit}
          disabled={!file || loading}
          variant="gradient"
          gradient={{ from: "blue", to: "cyan" }}
        >
          Upload
        </Button>

        <LoadingOverlay visible={loading} />

        {result && (
          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: result.success ? "#d3f9d8" : "#ffe3e3",
              color: result.success ? "#2f9e44" : "#c92a2a",
            }}
          >
            <Text weight={500}>{result.message}</Text>
            {result.errors?.length > 0 && (
              <Stack spacing={2} mt="xs">
                <Text size="sm">Some errors occurred:</Text>
                <ul>
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      <Text size="sm" color="red">
                        {err}
                      </Text>
                    </li>
                  ))}
                </ul>
              </Stack>
            )}
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}

export default SubmitAttendance;
