import { useState } from "react";
import PropTypes from "prop-types";
import {
  Flex,
  Input,
  Tabs,
  Text,
  Button,
  Select,
  Table,
  Textarea,
  Divider,
  Group,
} from "@mantine/core";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";

function InternshipsTab({ internshipsData, isEditable }) {
  const [formData, setFormData] = useState({
    id: null,
    organization: "",
    location: "",
    job_title: "",
    status: "ONGOING",
    start_date: "",
    end_date: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.put(
        updateProfileDataRoute,
        {
          experiencesubmit: {
            id: formData.id,
            company: formData.organization,
            location: formData.location,
            title: formData.job_title,
            status: formData.status,
            sdate: formData.start_date,
            edate: formData.end_date,
            description: formData.description,
          },
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        },
      );
      notifications.show({
        message: formData.id
          ? "Internship updated successfully!"
          : "Internship Added Successfully!",
        color: "green",
      });
      setFormData({
        id: null,
        organization: "",
        location: "",
        job_title: "",
        status: "ONGOING",
        start_date: "",
        end_date: "",
        description: "",
      });
    } catch (error) {
      notifications.show({
        message: "Failed! Please try later.",
        color: "red",
      });
      console.error("Error updating internships:", error);
    }
  };

  const startEdit = (internship) => {
    setFormData({
      id: internship.id,
      organization: internship.organization || "",
      location: internship.location || "",
      job_title: internship.job_title || "",
      status: internship.status || "ONGOING",
      start_date: internship.sdate || internship.start_date || "",
      end_date: internship.edate || internship.end_date || "",
      description: internship.description || "",
    });
  };

  const cancelEdit = () => {
    setFormData({
      id: null,
      organization: "",
      location: "",
      job_title: "",
      status: "ONGOING",
      start_date: "",
      end_date: "",
      description: "",
    });
  };

  return (
    <Flex
      w="100%"
      p="md"
      direction="column"
      style={{ border: "1px solid lightgray", borderRadius: "5px" }}
    >
      {isEditable ? (
        <>
          <Text fw={500} mb="md">
            {formData.id ? "Edit Internship" : "Add a New Internship"}
          </Text>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Organization Name" w="65%">
              <Input
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="Location" w="30%">
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
          </Flex>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Job Profile Title" w="65%">
              <Input
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="Status" w="30%">
              <Select
                name="status"
                data={["ONGOING", "COMPLETED"]}
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
          </Flex>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Start Date" w="48%">
              <Input
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="End Date" w="48%">
              <Input
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
          </Flex>
          <Input.Wrapper label="Description" w="100%">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              autosize
              minRows={5}
              resize="vertical"
              mt="xs"
            />
          </Input.Wrapper>
          <Group mt="lg">
            <Button onClick={handleSubmit} size="md">
              {formData.id ? "Save Changes" : "Submit"}
            </Button>
            {formData.id ? (
              <Button variant="light" color="gray" onClick={cancelEdit}>
                Cancel
              </Button>
            ) : null}
          </Group>
          <Divider my="md" />
        </>
      ) : null}
      <Text fw={500} mb="md">
        Your Experience
      </Text>

      {internshipsData.length > 0 ? (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Organization</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Job Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Start Date</Table.Th>
              <Table.Th>End Date</Table.Th>
              {isEditable ? <Table.Th>Action</Table.Th> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {internshipsData.map((internship) => (
              <Table.Tr
                key={
                  internship.id ||
                  `${internship.organization}-${internship.job_title}`
                }
              >
                <Table.Td style={{ textAlign: "center" }}>
                  {internship.organization}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {internship.location}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {internship.job_title}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {internship.status}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {internship.sdate}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {internship.edate}
                </Table.Td>
                {isEditable ? (
                  <Table.Td style={{ textAlign: "center" }}>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => startEdit(internship)}
                    >
                      Edit
                    </Button>
                  </Table.Td>
                ) : null}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text mt="lg" style={{ textAlign: "center" }}>
          No data found!
        </Text>
      )}
    </Flex>
  );
}

function ProjectsTab({ projectsData, isEditable }) {
  const [formData, setFormData] = useState({
    id: null,
    project_name: "",
    status: "ONGOING",
    project_link: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.put(
        updateProfileDataRoute,
        {
          projectsubmit: {
            id: formData.id,
            project_name: formData.project_name,
            project_status: formData.status,
            project_link: formData.project_link,
            sdate: formData.start_date,
            edate: formData.end_date,
            summary: formData.description,
          },
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        },
      );
      notifications.show({
        message: formData.id
          ? "Project updated successfully!"
          : "Project Added Successfully!",
        color: "green",
      });
      setFormData({
        id: null,
        project_name: "",
        status: "ONGOING",
        project_link: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    } catch (error) {
      notifications.show({
        message: "Failed! Please try later.",
        color: "red",
      });
      console.error("Error updating projects:", error);
    }
  };

  const startEdit = (project) => {
    setFormData({
      id: project.id,
      project_name: project.project_name || "",
      status: project.project_status || project.status || "ONGOING",
      project_link: project.project_link || "",
      start_date: project.start_date || project.sdate || "",
      end_date: project.end_date || project.edate || "",
      description: project.summary || project.description || "",
    });
  };

  const cancelEdit = () => {
    setFormData({
      id: null,
      project_name: "",
      status: "ONGOING",
      project_link: "",
      start_date: "",
      end_date: "",
      description: "",
    });
  };

  return (
    <Flex
      w="100%"
      p="md"
      direction="column"
      style={{ border: "1px solid lightgray", borderRadius: "5px" }}
    >
      {isEditable ? (
        <>
          <Text fw={500} mb="md">
            {formData.id ? "Edit Project" : "Add a New Project"}
          </Text>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Project Name" w="65%">
              <Input
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="Status" w="30%">
              <Select
                name="status"
                data={["ONGOING", "COMPLETED"]}
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
          </Flex>
          <Input.Wrapper label="Project Link" w="100%" mb="md">
            <Input
              name="project_link"
              value={formData.project_link}
              onChange={handleChange}
              size="md"
              mt="xs"
            />
          </Input.Wrapper>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Start Date" w="48%">
              <Input
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="End Date" w="48%">
              <Input
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
          </Flex>
          <Input.Wrapper label="Description" w="100%" mb="md">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              autosize
              minRows={5}
              resize="vertical"
              mt="xs"
            />
          </Input.Wrapper>
          <Group mt="lg">
            <Button onClick={handleSubmit} size="md">
              {formData.id ? "Save Changes" : "Submit"}
            </Button>
            {formData.id ? (
              <Button variant="light" color="gray" onClick={cancelEdit}>
                Cancel
              </Button>
            ) : null}
          </Group>
          <Divider my="md" />
        </>
      ) : null}
      <Text fw={500} mb="md">
        Your Projects
      </Text>
      {projectsData.length > 0 ? (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Project Name</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Project Link</Table.Th>
              <Table.Th>Start Date</Table.Th>
              <Table.Th>End Date</Table.Th>
              {isEditable ? <Table.Th>Action</Table.Th> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {projectsData.map((project) => (
              <Table.Tr
                key={
                  project.id ||
                  `${project.project_name}-${project.project_link}`
                }
              >
                <Table.Td style={{ textAlign: "center" }}>
                  {project.project_name}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {project.project_status || project.status}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  <a
                    href={project.project_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.project_link}
                  </a>
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {project.start_date || project.sdate}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {project.end_date || project.edate}
                </Table.Td>
                {isEditable ? (
                  <Table.Td style={{ textAlign: "center" }}>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => startEdit(project)}
                    >
                      Edit
                    </Button>
                  </Table.Td>
                ) : null}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text mt="lg" style={{ textAlign: "center" }}>
          No data found!
        </Text>
      )}
    </Flex>
  );
}

export default function WorkExperienceComponent({
  experience,
  project,
  isEditable,
}) {
  return (
    <Flex
      w={{ base: "100%", sm: "60%" }}
      p="md"
      h="auto"
      style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      direction="column"
      justify="space-evenly"
    >
      <Tabs defaultValue="internships">
        <Tabs.List mb="sm">
          <Tabs.Tab value="internships">
            <Text fw={500} size="1.2rem">
              Internships
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="projects">
            <Text fw={500} size="1.2rem">
              Projects
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="internships">
          <InternshipsTab
            internshipsData={experience}
            isEditable={isEditable}
          />
        </Tabs.Panel>
        <Tabs.Panel value="projects">
          <ProjectsTab projectsData={project} isEditable={isEditable} />
        </Tabs.Panel>
      </Tabs>
    </Flex>
  );
}

WorkExperienceComponent.propTypes = {
  experience: PropTypes.arrayOf(
    PropTypes.shape({
      organization: PropTypes.string,
      location: PropTypes.string,
      job_title: PropTypes.string,
      status: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      description: PropTypes.string,
    }),
  ).isRequired,
  project: PropTypes.arrayOf(
    PropTypes.shape({
      project_name: PropTypes.string,
      status: PropTypes.string,
      project_link: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      description: PropTypes.string,
    }),
  ).isRequired,
  isEditable: PropTypes.bool,
};

InternshipsTab.propTypes = {
  internshipsData: PropTypes.arrayOf(
    PropTypes.shape({
      organization: PropTypes.string,
      location: PropTypes.string,
      job_title: PropTypes.string,
      status: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      description: PropTypes.string,
    }),
  ).isRequired,
  isEditable: PropTypes.bool,
};

ProjectsTab.propTypes = {
  projectsData: PropTypes.arrayOf(
    PropTypes.shape({
      project_name: PropTypes.string,
      status: PropTypes.string,
      project_link: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      description: PropTypes.string,
    }),
  ).isRequired,
  isEditable: PropTypes.bool,
};
