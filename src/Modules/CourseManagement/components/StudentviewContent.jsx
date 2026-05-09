import React, { useState, useEffect } from "react";
import { Tabs, Paper, Text, Button } from "@mantine/core";
import "./StudentviewContent.css";

const modules = [
  {
    moduleName: "Module 1: Introduction to SE",
    description:
      "The Software Problem, Difference between student and Industrial Software, Introduction to Software Engineering, 3P's/4P's in Software Development - Product, Process, People, Project, SDLC, Software Engineering Concepts, Software Process, Software process models, CMM, Other Processes.",
    slides: [
      {
        name: "Slide 1: Orientation",
        link: "https://drive.google.com/file/d/13qYEvTh7-hQN6UE-48G9yZOvvX-igO_l/view?usp=sharing",
      },
      {
        name: "Slide 2: The Software Problem",
        link: "https://drive.google.com/file/d/1HH6v7sKRAHBz3h7q2lrqB3kcqCu-DTHy/view?usp=sharing",
      },
      {
        name: "Slide 3: Software Engineering",
        link: "https://drive.google.com/file/d/1D8LSQOr1stPEMXAnKbDE6eGkmcHZkv4H/view?usp=sharing",
      },
      {
        name: "Slide 4: The Software Process",
        link: "https://drive.google.com/file/d/17rZV5copxdCfIlYqekAmuhRvsSfHAl2o/view?usp=sharing",
      },
    ],
  },
  {
    moduleName: "Module 2: RE",
    description:
      "The Requirement Problem, Phases in RE - Requirement Elicitation, Requirement Analysis, Requirement Specifications, Requirement validation, Requirement gathering and analysis techniques, Use case modeling - use case diagram and use case documentation, examples, SRS ",
    slides: [
      {
        name: "Slide 5: Requirement Engineering",
        link: "https://drive.google.com/file/d/1Q2zUyaV5Ht62cXDuZnpvnxN85gTNW-w0/view?usp=sharing",
      },
      {
        name: "Slide 6: Use Case Modeling",
        link: "https://drive.google.com/file/d/15ZourkvwjWRsXsCExtmNyOzC_BguQPqf/view?usp=sharing",
      },
      {
        name: "Slide 7-a: Use Case Evolution Example-ATM",
        link: "https://drive.google.com/file/d/1JXpJ-rM9xkRVEFc2YKcDowR0O5pVi65X/view?usp=sharing",
      },
      {
        name: "Slide 7-b: Use Case Evolution Example-ELM",
        link: "https://drive.google.com/file/d/17htuXYhyEO5N-ZlqVp_XpVyNbEK3tNhX/view?usp=sharing",
      },
      {
        name: "Slide 8: SRS Documentation",
        link: "https://drive.google.com/file/d/1zTZMrqQiVwHX2MdFWNqp4l4UgYmZdlrE/view?usp=sharing",
      },
    ],
  },
];

function StudentviewContent() {
  // Initialize active tab to an empty string
  const [activeTab, setActiveTab] = useState("");

  // Set the first module as active on component mount
  useEffect(() => {
    if (modules.length > 0) {
      setActiveTab(modules[0].moduleName); // Set to the first module
    }
  }, []);

  // Log active tab for debugging
  console.log("Active Tab: ", activeTab);

  return (
    <Paper className="paperContainer">
      <h1>Course Content</h1>

      <Tabs active={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          {modules.map((module) => (
            <Tabs.Tab key={module.moduleName} value={module.moduleName}>
              {module.moduleName}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {modules.map((module) => (
          <Tabs.Panel key={module.moduleName} value={module.moduleName}>
            <Text size="lg" className="moduleDescription">
              {module.description}
            </Text>

            <div className="slidesContainer">
              {module.slides.map((slide, i) => (
                <div key={i} className="slideItem">
                  <Text>{slide.name}</Text>
                  <Button
                    component="a"
                    href={slide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="customButton"
                    style={{ backgroundColor: "#15abff" }}
                  >
                    Download Slide
                  </Button>
                </div>
              ))}
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Paper>
  );
}

export default StudentviewContent;
