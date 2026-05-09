import React, { useState } from "react";
import "./SubmitAttendance.css";

function SubmitAttendance() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file before submitting.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      alert("File submitted successfully!");
      setIsSubmitting(false);
      setSelectedFile(null);
    }, 2000);
  };

  return (
    <div className="submit-attendance-page">
      <h2>Submit Attendance</h2>

      <form onSubmit={handleSubmit} className="submit-attendance-form">
        {/* File Upload Input */}
        <div className="form-group">
          <label htmlFor="attendance-file" className="file-label">
            Upload Attendance (Excel):
            <input
              type="file"
              id="attendance-file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="file-input"
            />
          </label>
        </div>

        {/* Show selected file name */}
        {selectedFile && (
          <div className="file-info">
            <p>Selected File: {selectedFile.name}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-group">
          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? "disabled" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitAttendance;
