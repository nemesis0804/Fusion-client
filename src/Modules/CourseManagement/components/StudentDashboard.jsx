import React from "react";
import "./StudentDashboard.css";

const courses = [
  {
    id: "DS3001",
    name: "Engineering Design Including Design and Fabrication Project",
    credits: 4,
    semester: 4,
  },
  {
    id: "CS3009",
    name: "Network Security & Cryptography",
    credits: 3,
    semester: 4,
  },
  { id: "CS3010", name: "Software Engineering", credits: 4, semester: 4 },
  { id: "CS3011", name: "Artificial Intelligence", credits: 3, semester: 4 },
  { id: "IT3C01", name: "IT Workshop III", credits: 2, semester: 4 },
  { id: "CS8028", name: "Hardware Security", credits: 3, semester: 4 },
  {
    id: "HS3004",
    name: "Ecology and Environment Science",
    credits: 2,
    semester: 4,
  },
];

function StudentDashboard() {
  return (
    <div className="dashboard-container">
      <h2>Sem 4 Year 2024-2025</h2>
      <div className="tabs">
        <span>Sem 4 Year 2024-2025</span>
        <span>Time-Table</span>
        <span>Academic Calendar</span>
        <span>List of Holidays</span>
        <span>Exam Time Table</span>
      </div>

      <table className="course-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, index) => (
            <tr key={course.id}>
              <td>{index + 1}</td>
              <td>
                <a
                  href={`/course-details/${course.id}`}
                  aria-label={`Details for course ${course.name}`}
                >
                  {course.id}
                </a>
              </td>
              <td>{course.name}</td>
              <td>{course.credits}</td>
              <td>{course.semester}</td>
              <td className="manage">
                <button
                  className="manage-btn"
                  aria-label={`Manage course ${course.name}`} // good for accessibility
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentDashboard;
