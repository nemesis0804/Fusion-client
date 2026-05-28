import React, { useState } from "react";
import { Button, TextInput, Table } from "@mantine/core";
import axios from "axios";
import "./Gradingscheme.css";
import { createGradingScheme } from "../../../routes/courseMgmtRoutes/index";

function GradeScheme() {
  const [gradingBoundaries, setGradingBoundaries] = useState({});

  const evaluations = {
    Midterm: 30,
    "Final Exam": 50,
    Assignments: 10,
    Quizzes: 10,
  };

  const formatGradeKey = (grade) => grade.replace("+", "_plus");

  const handleInputChange = (grade, bound, value) => {
    const formattedGrade = formatGradeKey(grade);
    setGradingBoundaries((prev) => ({
      ...prev,
      [`${formattedGrade}_${bound}`]: Number(value),
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        createGradingScheme,
        {
          course_code: "ES102",
          version: 1.0,
          evaluations, // ✅ Now correctly formatted as an object
          grading_boundaries: gradingBoundaries,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log("Success:", response.data);
      alert("Grading Scheme Uploaded Successfully");
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert("Failed to Upload Grading Scheme");
    }
  };

  return (
    <div className="main_grading_scheme">
      <div className="heading">
        <h1>Create Grading Scheme</h1>
      </div>
      <div className="grading_table_wrapper">
        <Table striped highlightOnHover className="custom-table">
          <thead>
            <tr>
              <th>Grade</th>
              <th>Lower Bound (%)</th>
              <th>Upper Bound (%)</th>
            </tr>
          </thead>
          <tbody>
            {["O", "A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"].map(
              (grade) => (
                <tr key={grade}>
                  <td>{grade}</td>
                  <td data-bound="Lower">
                    <TextInput
                      placeholder="Lower Bound"
                      type="number"
                      onChange={(e) =>
                        handleInputChange(grade, "Lower", e.target.value)
                      }
                    />
                  </td>
                  <td data-bound="Upper">
                    <TextInput
                      placeholder="Upper Bound"
                      type="number"
                      onChange={(e) =>
                        handleInputChange(grade, "Upper", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </Table>
      </div>
      <div className="upload_button_wrapper">
        <Button
          variant="filled"
          color="blue"
          className="add_button"
          onClick={handleSubmit}
        >
          Upload Grading Scheme
        </Button>
      </div>
    </div>
  );
}

export default GradeScheme;
