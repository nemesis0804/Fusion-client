import React, { useState } from "react";
import { Select, Table, TextInput, Button } from "@mantine/core";
import "./SubmitMarks.css"; // Separate CSS for custom styles

function SubmitMarks() {
  const [exam, setExam] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [marks, setMarks] = useState({});

  const students = [
    { rollNumber: "23BCS131", name: "AAYUSHI SINGHAL" },
    { rollNumber: "23BCS001", name: "BHARGAV DESHMUKH" },
    { rollNumber: "23BCS003", name: "CHETAN YADAV" },
    { rollNumber: "23BCS036", name: "CHETAN YADAV" },
    { rollNumber: "23BCS047", name: "DIVANSHU BHARGAVA" },
    { rollNumber: "23BCS087", name: "GATHRAM LAKSHMI PRIYA" },
    { rollNumber: "23BCS0112", name: "HARSHIT RAJ" },
    { rollNumber: "23BCS169", name: "JASTHI RAGHAVENDRA" },
    { rollNumber: "23BCS200", name: "PRATYUSH SINGH" },
  ];

  const handleMarksChange = (rollNumber, value) => {
    setMarks((prev) => ({
      ...prev,
      [rollNumber]: value,
    }));
  };

  return (
    <div className="submit-marks-container">
      <h2>Submit Marks</h2>
      <div className="marks-header-row">
        <Select
          label="Biology For Engineers"
          placeholder="Select Exam"
          data={["Quiz 1", "Mid Term", "Quiz 2", "Final Term"]}
          value={exam}
          onChange={(value) => setExam(value || "")}
          className="exam-select-small"
        />

        <TextInput
          label="Total Marks"
          placeholder="Total Marks"
          value={totalMarks}
          onChange={(event) => setTotalMarks(event.currentTarget.value)}
          className="total-marks-input"
        />
      </div>

      <Table highlightOnHover className="custom-table">
        <thead>
          <tr className="marks_table_tr">
            <th>Roll Number</th>
            <th>Student Name</th>
            <th>Marks Obtained</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.rollNumber}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              <td>
                <TextInput
                  placeholder="Enter Marks"
                  value={marks[student.rollNumber] || ""}
                  onChange={(e) =>
                    handleMarksChange(student.rollNumber, e.currentTarget.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="lastButton">
        <Button className="edit-button">Edit</Button>
        <Button className="submit-button">Submit</Button>
      </div>
    </div>
  );
}

export default SubmitMarks;
