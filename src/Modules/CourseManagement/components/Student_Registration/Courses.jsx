import React from "react";
import "./Courses.css";

function Courses() {
  const courses = [
    {
      id: 1,
      slotName: "DC7",
      slotType: "Professional Core",
      semester: 5,
      credits: 4,
      course:
        "DS3001 - Engineering Design Including Design & Fabrication Project",
    },
    {
      id: 2,
      slotName: "DC8CSE",
      slotType: "Professional Core",
      semester: 5,
      credits: 3,
      course: "CS3009 - Network Security & Cryptography",
    },
    {
      id: 3,
      slotName: "DC9CSE",
      slotType: "Professional Core",
      semester: 5,
      credits: 4,
      course: "CS3010 - Software Engineering",
    },
    {
      id: 4,
      slotName: "DC10CSE",
      slotType: "Professional Core",
      semester: 5,
      credits: 4,
      course: "CS3011 - Artificial Intelligence",
    },
    {
      id: 5,
      slotName: "IT3CSE",
      slotType: "Professional Lab",
      semester: 5,
      credits: 2,
      course: "IT3C01 - IT Workshop III",
    },
    {
      id: 6,
      slotName: "OE3",
      slotType: "Professional Elective",
      semester: 5,
      credits: 3,
      course:
        "OE4M23 - Business Analytics using R,OE3E40 - Computation Genomic & Proteomic, OE4E50 - Detection and Estimation Theory, OE3D15 - Applied Ergonomics, OE3D16 - Visual Ergonomics, OE3M26 - Computer-Aided Design (CAD), CS8028 - Hardware Security, OE3M33 - Electrical Drives and Devices, OE3N36 - Probability and Statistics",
    },
    {
      id: 7,
      slotName: "HS",
      slotType: "Others",
      semester: 5,
      credits: 2,
      course: "HS3004 - Ecology & Environment Science",
    },
  ];

  return (
    <div className="p-4">
      <div className="text-center mb-2 font-bold">
        <span className="heading">Available Courses for Next Semester</span>
      </div>
      <table className="custom-table table-auto">
        <thead>
          <tr>
            <th>#</th>
            <th>Slot Name</th>
            <th>Slot Type</th>
            <th>Semester</th>
            <th>Credits</th>
            <th>Course</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td>{course.id}</td>
              <td>{course.slotName}</td>
              <td>{course.slotType}</td>
              <td>{course.semester}</td>
              <td>{course.credits}</td>
              <td>
                {course.id === 6
                  ? course.course
                      .split(",")
                      .map((subCourse, index) => (
                        <div key={index}>{subCourse}</div>
                      ))
                  : course.course}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Courses;
