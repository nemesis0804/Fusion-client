import React, { useState } from "react";
import { Paper, TextInput, Table, Button } from "@mantine/core";
import "./EvaluateAssignment.css";

const students = [
  { rollNo: "22bcs001", name: "AAYUSH SINGHAL" },
  { rollNo: "22bcs002", name: "BHARGAV DESHMUKH" },
  { rollNo: "22bcs003", name: "CHETAN YADAV" },
  { rollNo: "22bcs004", name: "DIVYANSHU BHARGAVA" },
  { rollNo: "22bcs005", name: "GATHRAM LAKSHMI PRIYA" },
  { rollNo: "22bcs006", name: "HARSHIT RAJ" },
  { rollNo: "22bcs007", name: "JASTHI RAGHAVENDRA" },
  { rollNo: "22bcs008", name: "KARTHIK NARAYAN" },
  { rollNo: "22bcs009", name: "LAVANYA KUMARI" },
  { rollNo: "22bcs010", name: "MALAVIKA IYER" },
  { rollNo: "22bcs011", name: "NEHA SHARMA" },
  { rollNo: "22bcs012", name: "OMKAR JOSHI" },
  { rollNo: "22bcs013", name: "PRANAV GUPTA" },
  { rollNo: "22bcs014", name: "RAHUL KUMAR" },
  { rollNo: "22bcs015", name: "SAKSHI AGARWAL" },
  { rollNo: "22bcs016", name: "TANISHQ MEHTA" },
  { rollNo: "22bcs017", name: "UMA MAHESHWARI" },
  { rollNo: "22bcs018", name: "VARSHA SRIDHAR" },
  { rollNo: "22bcs019", name: "YASH SINGH" },
  { rollNo: "22bcs020", name: "ZARA KHAN" },
  { rollNo: "22bcs021", name: "ARUNAV SINGH" },
  { rollNo: "22bcs022", name: "BHAKTI PATEL" },
  { rollNo: "22bcs023", name: "CHIRAG TIWARI" },
  { rollNo: "22bcs024", name: "DEEPAK KUMAR" },
  { rollNo: "22bcs025", name: "ESHA JAIN" },
  { rollNo: "22bcs026", name: "FARHAN SYED" },
  { rollNo: "22bcs027", name: "GAYATHRI RAMESH" },
  { rollNo: "22bcs028", name: "HEMANT KUMAR" },
  { rollNo: "22bcs029", name: "ISHITA VERMA" },
  { rollNo: "22bcs030", name: "JAI PRAKASH" },
  { rollNo: "22bcs031", name: "KRISHNA CHAUDHARY" },
  { rollNo: "22bcs032", name: "LALITHA MURTHY" },
  { rollNo: "22bcs033", name: "MANOJ SHARMA" },
  { rollNo: "22bcs034", name: "NIKHIL KUMAR" },
  { rollNo: "22bcs035", name: "OM PRAKASH" },
  { rollNo: "22bcs036", name: "PRIYA AGARWAL" },
  { rollNo: "22bcs037", name: "QUADRI AZIZ" },
  { rollNo: "22bcs038", name: "RAVI SHANKAR" },
  { rollNo: "22bcs039", name: "SHIKHA BHATIA" },
  { rollNo: "22bcs040", name: "TARUN GUPTA" },
  { rollNo: "22bcs041", name: "USHASHREE RAO" },
  { rollNo: "22bcs042", name: "VIJAY PATIL" },
  { rollNo: "22bcs043", name: "WASIQ AHMED" },
  { rollNo: "22bcs044", name: "XAVIER JOHN" },
  { rollNo: "22bcs045", name: "YAMINI SINGH" },
  { rollNo: "22bcs046", name: "ZUBIN MEHTA" },
  { rollNo: "22bcs047", name: "ANANYA MISHRA" },
  { rollNo: "22bcs048", name: "BHAVYA JAIN" },
  { rollNo: "22bcs049", name: "CHETAN MALHOTRA" },
  { rollNo: "22bcs050", name: "DEEPTI JOSHI" },
];

function EvaluateAssignment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState(students);

  // Handle the search logic
  const handleSearch = (query) => {
    setSearchQuery(query);
    const result = students.filter(
      (student) =>
        student.rollNo.toLowerCase().includes(query.toLowerCase()) ||
        student.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredStudents(result);
  };

  return (
    <Paper className="paperContainer">
      <div className="headingContainer">
        <h1>Evaluate Assignments</h1>
      </div>

      <div className="tabContainer">
        <Button className="assignmentButton">Assignment_1</Button>
        <Button className="assignmentButton">Assignment_2</Button>
      </div>

      <div className="secondTab">
        <div className="totalMarks">
          <span>Total Marks</span>
          <TextInput placeholder="Enter total marks" />
        </div>
        <Button className="btn" color="#15abff">
          Download All Assignments (.zip)
        </Button>
      </div>

      <TextInput
        className="searchInput"
        placeholder="Search Student"
        value={searchQuery}
        onChange={(e) => handleSearch(e.currentTarget.value)}
      />

      <div className="tableContainer">
        <Table striped withBorder highlightOnHover className="custom-table">
          <thead className="tableHeader">
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Marks Obtained</th>
              <th>Download Assignment</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>
                    <TextInput placeholder="Enter obtained marks" />
                  </td>
                  <td>
                    <div className="button-container">
                      <Button className="btn" color="#15abff">
                        View
                      </Button>
                      <Button className="btn" color="#15abff">
                        Download
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Button className="generateButton">Generate Grades</Button>
    </Paper>
  );
}

export default EvaluateAssignment;
