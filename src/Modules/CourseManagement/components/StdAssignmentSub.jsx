import React, { useState } from "react";
import "./StdAssignmentSub.css";

function StdAssignmentSub() {
  // const [studentName, setStudentName] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Assignment Submitted:", {
      // studentName,
      assignmentTitle,
      file,
    });
    alert("Assignment submitted successfully!");
  };

  return (
    <div className="submission-container">
      <h1 className="title">Assignment Submission</h1>
      <form className="submission-form" onSubmit={handleSubmit}>
        {/* <div className="form-group">
          <div className="innerhead">
            {" "}
            <h1 className="form-label">Student Name:</h1>
          </div>
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="form-input"
            placeholder="Enter your name"
            required
          />
        </div> */}

        <div className="form-group">
          <div className="innerhead">
            {" "}
            <h1 className="form-label">Assignment Title:</h1>
          </div>
          <input
            id="assignmentTitle"
            type="text"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            className="form-input"
            placeholder="Enter assignment title"
            required
          />
        </div>

        <div className="form-group">
          <div className="innerhead">
            {" "}
            <h1 className="form-label">Upload File:</h1>
          </div>
          <input
            id="fileUpload"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="file-input"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
}

export default StdAssignmentSub;
