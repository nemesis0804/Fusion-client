import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Table, TextInput, FileInput } from "@mantine/core";
import { host } from "../../../routes/globalRoutes";
import "./CourseContent.css";

function CourseContent() {
  const [modules, setModules] = useState([]);
  const [moduleInput, setModuleInput] = useState("");
  const [slideInput, setSlideInput] = useState(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState("");

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Fetch Modules
      const modulesResponse = await axios.get(`${host}/ocms/api/modules/`, {
        headers: { Authorization: `Token ${token}` },
      });

      let modulesWithSlides = modulesResponse.data.map((module) => ({
        ...module,
        slides: [],
      }));

      // Fetch Slides
      const slidesResponse = await axios.get(`${host}/ocms/api/slides/`, {
        headers: { Authorization: `Token ${token}` },
      });

      // Group slides by module_id
      const slidesByModule = {};
      slidesResponse.data.forEach((slide) => {
        if (!slidesByModule[slide.module_id]) {
          slidesByModule[slide.module_id] = [];
        }
        slidesByModule[slide.module_id].push(slide);
      });

      // Assign slides to their respective modules
      modulesWithSlides = modulesWithSlides.map((module) => ({
        ...module,
        slides: slidesByModule[module.id] || [],
      }));

      console.log("Fetched Modules with Slides:", modulesWithSlides); // Debugging
      setModules(modulesWithSlides);
      console.log("Modules State Updated:", modulesWithSlides); // Debugging after state update
    } catch (error) {
      console.error("Error fetching modules and slides:", error);
      setModules([]); // Ensure modules is always an array
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const addModule = async () => {
    if (moduleInput.trim()) {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const courseId = 1; // Replace with actual course ID if dynamic

        const response = await axios.post(
          `${host}/ocms/api/modules/add/`,
          { course_id: courseId, module_name: moduleInput },
          { headers: { Authorization: `Token ${token}` } },
        );

        setModules([...modules, { ...response.data, slides: [] }]);
        setModuleInput("");
      } catch (error) {
        console.error(
          "Error adding module:",
          error.response?.data || error.message,
        );
      }
    }
  };

  const addSlide = async () => {
    if (slideInput && selectedModuleIndex !== "") {
      const moduleId = modules[selectedModuleIndex].id;
      const formData = new FormData();
      formData.file = slideInput; // Ensure backend processes this
      formData.append("document_name", slideInput.name);
      formData.append("description", "Slide uploaded"); // Adjust as needed
      console.log(formData, slideInput);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const url = `${host}/ocms/api/slides/${moduleId}/add_document/`;
        console.log("Requesting:", url);

        const response = await axios.post(url, formData, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const updatedModules = [...modules];
        updatedModules[selectedModuleIndex].slides.push(response.data);
        setModules(updatedModules);
        setSlideInput(null);
      } catch (error) {
        console.error(
          "Error adding slide:",
          error.response?.data || error.message,
        );
      }
    }
  };

  const deleteModule = async (index) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      await axios.delete(
        `${host}/ocms/api/modules/delete/${modules[index].id}/`,
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      setModules(modules.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };

  const deleteSlide = async (moduleIndex, slideIndex) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      await axios.delete(
        `${host}/ocms/api/slides/delete/${modules[moduleIndex].slides[slideIndex].id}/`,
        { headers: { Authorization: `Token ${token}` } },
      );

      const updatedModules = [...modules];
      updatedModules[moduleIndex].slides = updatedModules[
        moduleIndex
      ].slides.filter((_, i) => i !== slideIndex);
      setModules(updatedModules);
    } catch (error) {
      console.error("Error deleting slide:", error);
    }
  };

  return (
    <div className="content-container">
      {/* Module Section */}
      <div className="module-section">
        <h2>
          Add a Module<span className="subheading"> (or chapter or unit) </span>
        </h2>
        <TextInput
          placeholder="Enter module name"
          value={moduleInput}
          onChange={(e) => setModuleInput(e.target.value)}
        />
        <Button
          onClick={addModule}
          style={{ margin: "10px 0" }}
          className="submit_btn"
        >
          Submit
        </Button>
        <Table
          styles={{
            td: { color: "black", overflow: "visible" },
          }}
          highlightOnHover
          className="custom-table"
        >
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Name of the Module</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {modules.length > 0 ? (
              modules.map((module, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{module.module_name || "No Name"}</td>
                  <td>
                    <button
                      className="Delete"
                      onClick={() => deleteModule(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No Modules Available</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Slide Section */}
      <div className="slide-section" style={{ marginTop: "30px" }}>
        <h2>
          Upload a Slide for a Module{" "}
          <span className="subheading"> (or chapter or unit) </span>
        </h2>
        <FileInput
          placeholder="Upload slide file"
          value={slideInput}
          onChange={setSlideInput}
        />
        <TextInput
          placeholder="Select Module Index (e.g., 0 for Module 1)"
          value={selectedModuleIndex}
          onChange={(e) => setSelectedModuleIndex(e.target.value)}
          type="number"
          min="0"
          max={modules.length - 1}
        />
        <Button
          onClick={addSlide}
          style={{ margin: "10px 0" }}
          className="submit_btn"
        >
          Submit
        </Button>
        <Table
          styles={{
            td: { color: "black", overflow: "visible" },
          }}
          highlightOnHover
          className="custom-table"
        >
          <thead>
            <tr>
              <th>Module Name</th>
              <th>Slides</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module, moduleIndex) => (
              <tr key={moduleIndex}>
                <td>{module.module_name || "No Name"}</td>
                <td>
                  <Table highlightOnHover className="custom-table">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Slide Name</th>
                        <th>Action</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {module.slides?.length > 0 ? (
                        module.slides.map((slide, slideIndex) => (
                          <tr key={slideIndex}>
                            <td>{slideIndex + 1}</td>
                            <td>
                              {slide?.document_name
                                ? slide.document_name
                                : "No Name"}
                            </td>
                            <td>
                              <button
                                className="Delete"
                                onClick={() =>
                                  deleteSlide(moduleIndex, slideIndex)
                                }
                              >
                                Delete
                              </button>
                            </td>
                            <td>
                              {slide?.document_url ? (
                                <a
                                  href={slide.document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() =>
                                    console.log(
                                      "Slide URL:",
                                      slide.document_url,
                                    )
                                  }
                                >
                                  View Slide
                                </a>
                              ) : (
                                <span style={{ color: "orange" }}>
                                  Uploading...
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4">No slides available</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default CourseContent;
