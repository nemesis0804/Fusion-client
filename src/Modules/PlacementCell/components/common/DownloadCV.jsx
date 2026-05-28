import React, { useState } from "react";
import { Button, Checkbox, Group, Text, Title } from "@mantine/core";
import { placementApi } from "../../services/api";
import { downloadBlobFile } from "../../utils/helpers";

function DownloadCV() {
  const [fields, setFields] = useState({
    achievements: true,
    education: true,
    skills: true,
    references: true,
    conferences: true,
    patents: true,
    publications: true,
    experience: true,
    projects: true,
    extracurriculars: true,
    courses: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCv = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await placementApi.downloadCv(fields);
      return response.data;
    } catch (e) {
      console.error(
        "Error downloading CV:",
        e.response ? e.response.data : e.message,
      );
      setError("Error downloading CV. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const blob = await fetchCv();
    if (!blob) {
      return;
    }
    downloadBlobFile(blob, "student_cv.pdf", "application/pdf");
  };

  const handleOpen = async () => {
    const blob = await fetchCv();
    if (!blob) {
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title order={2}>Download your CV</Title>
      <Text>Select the fields to be added</Text>
      <Group mt="md">
        {Object.keys(fields).map((field) => (
          <Checkbox
            key={field}
            label={field.charAt(0).toUpperCase() + field.slice(1)}
            checked={fields[field]}
            onChange={(event) =>
              setFields({ ...fields, [field]: event.currentTarget.checked })
            }
          />
        ))}
      </Group>
      <Group mt="md">
        <Button onClick={handleOpen} loading={loading} disabled={loading}>
          {loading ? "Opening..." : "Open Resume"}
        </Button>
        <Button
          variant="light"
          onClick={handleDownload}
          loading={loading}
          disabled={loading}
        >
          {loading ? "Downloading..." : "Download"}
        </Button>
      </Group>
      {error && <Text color="red">{error}</Text>} {/* Use the error state */}
    </div>
  );
}

export default DownloadCV;
