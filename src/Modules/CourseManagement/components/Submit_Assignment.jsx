import React, { useState, useCallback } from "react";
import {
  Container,
  Card,
  Text,
  Button,
  Title,
  Group,
  FileButton,
} from "@mantine/core";
import { Document, Page } from "react-pdf";
import "./Submit_Assignment.css";

function Submit_Assignment() {
  const [pageCount, setNumPages] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Error loading document:", error);
    setPdfError(true);
  }, []);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const [fileName, setFileName] = useState("");

  const handleFileChange = (files) => {
    if (files.length > 0) {
      setFileName(files[0].name);
    } else {
      setFileName("");
    }
  };

  return (
    <Container className="assignment-container">
      <div className="assignment-content">
        <Card shadow="sm" p="lg" className="assignment-card">
          <Group position="apart" style={{ marginBottom: "20px" }}>
            <div>
              <Title order={2}>Assignment Heading</Title>
              <Text size="sm" variant="dimmed">
                Due: 22 Aug by 23:59 | Points: 15
              </Text>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {isSubmitted ? (
                <Text size="sm" style={{ color: "green", marginRight: "10px" }}>
                  Submitted!
                </Text>
              ) : (
                <Text size="sm" style={{ color: "red", marginRight: "10px" }}>
                  Not submitted!
                </Text>
              )}
              <Button size="sm" onClick={handleSubmit} className="customButton">
                Submit Assignment
              </Button>
            </div>
          </Group>
          <Text mt="md">
            The Dashboard is a central component of our Fusion Software, serving
            as the primary interface for navigating various modules based on
            user roles and designations....
          </Text>

          <div className="pdf-viewer">
            <Title order={4}>Assignment PDF</Title>
            {pdfError ? (
              <Text sx={{ color: "red" }}>Error loading PDF</Text>
            ) : (
              <Document
                file="./test.pdf"
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
              >
                {pageCount > 0 &&
                  Array.from(new Array(pageCount), (el, index) => (
                    <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                  ))}
              </Document>
            )}
          </div>
          <FileButton onChange={handleFileChange} accept="*">
            {({ onClick, disabled }) => (
              <button
                type="button"
                onClick={onClick}
                className={`fileButton ${disabled ? "disabled" : ""}`}
                disabled={disabled}
                aria-label={
                  fileName ? `File attached: ${fileName}` : "Attach files"
                }
              >
                <span className="fileIcon">📎</span>
                <span>{fileName || "Upload"}</span>
              </button>
            )}
          </FileButton>
        </Card>

        {isSubmitted && (
          <Card shadow="sm" p="lg" className="submission-card">
            <Title order={4}>Submission Details</Title>
            <Text>Submitted on: 22 Aug 23:50</Text>
            <Text>Status: Graded</Text>
            <Text>Grade: 9/15</Text>
          </Card>
        )}
      </div>
    </Container>
  );
}

export default Submit_Assignment;
