import React, { useState } from "react";
import {
  Button,
  TextInput,
  Table,
  Container,
  ScrollArea,
  Box,
} from "@mantine/core";
import "./ManageEvaluations.css";

function ManageEvaluations() {
  const [students, setStudents] = useState([
    { rollNo: "23BCS131", totalMarks: "" },
    { rollNo: "23BCS001", totalMarks: "" },
    { rollNo: "23BCS003", totalMarks: "" },
    { rollNo: "23BCS004", totalMarks: "" },
    { rollNo: "23BCS005", totalMarks: "" },
    { rollNo: "23BCS006", totalMarks: "" },
    { rollNo: "23BCS007", totalMarks: "" },
  ]);

  const handleTotalMarksChange = (index, value) => {
    setStudents((prev) =>
      prev.map((student, i) =>
        i === index ? { ...student, totalMarks: value } : student,
      ),
    );
  };

  const rows = students.map((student, index) => (
    <tr key={index}>
      <td>
        <TextInput value={student.rollNo} readOnly />
      </td>
      <td>
        <TextInput
          placeholder="Total Marks"
          value={student.totalMarks}
          onChange={(e) => handleTotalMarksChange(index, e.currentTarget.value)}
        />
      </td>
    </tr>
  ));

  return (
    <Container
      fluid
      style={{ backgroundColor: "white" }}
      className="ManageEvaluations"
    >
      <h1>Manage Evaluations</h1>
      <p>(Please Click on Generate button before uploading)</p>
      <ScrollArea style={{ height: 400 }}>
        <Box sx={{ width: "100%" }}>
          <Table striped className="custom-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Total Marks Obtained</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </Box>
      </ScrollArea>
      <div className="lastButton">
        <Button className="edit-button">Edit</Button>
        <Button className="submit-button">Submit</Button>
      </div>
    </Container>
  );
}

export default ManageEvaluations;
