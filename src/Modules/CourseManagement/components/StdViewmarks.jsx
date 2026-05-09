import React from "react";
import "./StdViewmarks.css";

function StudentMarks() {
  // Sample marks data
  const marksData = {
    quiz1: 18,
    quiz2: 20,
    labExam: 25,
    midSem: 40,
    endSem: 80,
  };

  return (
    <div className="marks-container">
      <h1 className="title">Student Marks</h1>
      <table className="marks-table">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Marks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Quiz 1</td>
            <td>{marksData.quiz1}</td>
          </tr>
          <tr>
            <td>Quiz 2</td>
            <td>{marksData.quiz2}</td>
          </tr>
          <tr>
            <td>Lab Exam</td>
            <td>{marksData.labExam}</td>
          </tr>
          <tr>
            <td>Mid Semester</td>
            <td>{marksData.midSem}</td>
          </tr>
          <tr>
            <td>End Semester</td>
            <td>{marksData.endSem}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default StudentMarks;
