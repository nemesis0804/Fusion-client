import React from "react";
import { Link, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Finalreg from "./Finalreg";
import Prereg from "./Prereg";
import Courses from "./Courses";
import "./Registration.css"; // Import the custom CSS

function Registration() {
  return (
    <Router>
      <div className="registration-container">
        <div className="nav-bar">
          <ul className="nav-list">
            {/* Update the Links to be relative to /registration */}
            <li>
              <Link className="nav-link" to="/courses">
                Courses
              </Link>
            </li>
            <span>|</span>
            <li>
              <Link className="nav-link" to="/prereg">
                Pre-Registration
              </Link>
            </li>
            <span>|</span>
            <li>
              <Link className="nav-link" to="/finalreg">
                Final-Registration
              </Link>
            </li>
          </ul>
        </div>
        <hr className="divider" />

        {/* Updated Routes */}
        <Routes>
          <Route path="/finalreg" element={<Finalreg />} />
          <Route path="/prereg" element={<Prereg />} />
          <Route path="/courses" element={<Courses />} />
        </Routes>
      </div>
    </Router>
  );
}

export default Registration;
