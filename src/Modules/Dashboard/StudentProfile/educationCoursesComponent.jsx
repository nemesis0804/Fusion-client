import { useState } from "react";
import PropTypes from "prop-types";
import {
  Flex,
  Input,
  Tabs,
  Text,
  Button,
  Textarea,
  Table,
  Divider,
  Group,
} from "@mantine/core";
import { notifications, Notifications } from "@mantine/notifications";
import axios from "axios";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";

function EducationTab({ educationData, isEditable }) {
  const [formData, setFormData] = useState({
    id: null,
    degree: "",
    stream: "",
    institute: "",
    grade: "",
    start_date: "",
    end_date: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.put(
        updateProfileDataRoute,
        {
          education: {
            id: formData.id,
            degree: formData.degree,
            stream: formData.stream,
            institute: formData.institute,
            grade: formData.grade,
            sdate: formData.start_date,
            edate: formData.end_date,
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
          ? "Education updated successfully!"
          : "Education Added Successfully!",
        color: "green",
      });
      setFormData({
        id: null,
        degree: "",
        stream: "",
        institute: "",
        grade: "",
        start_date: "",
        end_date: "",
      });
    } catch (error) {
      notifications.show({
        message: "Failed! Please try later.",
        color: "red",
      });
      console.error("Error updating education:", error);
    }
  };

  const startEdit = (education) => {
    setFormData({
      id: education.id,
      degree: education.degree || "",
      stream: education.stream || "",
      institute: education.institute || "",
      grade: education.grade || "",
      start_date: education.sdate || "",
      end_date: education.edate || "",
    });
  };

  const cancelEdit = () => {
    setFormData({
      id: null,
      degree: "",
      stream: "",
      institute: "",
      grade: "",
      start_date: "",
      end_date: "",
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
            {formData.id
              ? "Edit Educational Qualification"
              : "Add a New Educational Qualification"}
          </Text>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Degree" w="48%">
              <Input
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="Stream" w="48%">
              <Input
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
          </Flex>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Institute Name" w="65%">
              <Input
                name="institute"
                value={formData.institute}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="Grade" w="30%">
              <Input
                name="grade"
                value={formData.grade}
                onChange={handleChange}
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
          <Group mt="lg">
            <Button onClick={handleSubmit} size="md" w="fit-content">
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
        Your Educations
      </Text>
      {educationData.length > 0 ? (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Degree</Table.Th>
              <Table.Th>Stream</Table.Th>
              <Table.Th>Institute</Table.Th>
              <Table.Th>Grade</Table.Th>
              <Table.Th visibleFrom="sm">Start Date</Table.Th>
              <Table.Th visibleFrom="sm">End Date</Table.Th>
              {isEditable ? <Table.Th>Action</Table.Th> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {educationData.map((edu) => (
              <Table.Tr key={edu.id || `${edu.degree}-${edu.institute}`}>
                <Table.Td style={{ textAlign: "center" }}>
                  {edu.degree}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {edu.stream}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {edu.institute}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>{edu.grade}</Table.Td>
                <Table.Td style={{ textAlign: "center" }} visibleFrom="sm">
                  {edu.sdate}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }} visibleFrom="sm">
                  {edu.edate}
                </Table.Td>
                {isEditable ? (
                  <Table.Td style={{ textAlign: "center" }}>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => startEdit(edu)}
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

function CoursesTab({ coursesData, isEditable }) {
  const [formData, setFormData] = useState({
    id: null,
    course_name: "",
    license: "",
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
          coursesubmit: {
            id: formData.id,
            course_name: formData.course_name,
            license_no: formData.license,
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
      Notifications.show({
        message: formData.id
          ? "Certificate updated successfully!"
          : "Certificates added Successfully!",
        color: "green",
      });
      setFormData({
        id: null,
        course_name: "",
        license: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    } catch (error) {
      Notifications.show({
        message: "Failed! Please try later.",
        color: "red",
      });
      console.error("Error updating courses:", error);
    }
  };

  const startEdit = (course) => {
    setFormData({
      id: course.id,
      course_name: course.course_name || "",
      license: course.license_no || course.license || "",
      start_date: course.sdate || "",
      end_date: course.edate || "",
      description: course.description || "",
    });
  };

  const cancelEdit = () => {
    setFormData({
      id: null,
      course_name: "",
      license: "",
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
            {formData.id
              ? "Edit Certification Course"
              : "Add a New Certification Course"}
          </Text>
          <Flex align="center" justify="space-between" mb="md">
            <Input.Wrapper label="Course Name" w="65%">
              <Input
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                size="md"
                mt="xs"
              />
            </Input.Wrapper>
            <Input.Wrapper label="License No." w="30%">
              <Input
                name="license"
                value={formData.license}
                onChange={handleChange}
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
          <Input.Wrapper label="Description" w={{ base: "100%", sm: "80%" }}>
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
        Your Certificates
      </Text>
      {coursesData.length > 0 ? (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Td>Course Name</Table.Td>
              <Table.Td>License No.</Table.Td>
              <Table.Td>Start Date</Table.Td>
              <Table.Td>Completion Date</Table.Td>
              {isEditable ? <Table.Td>Action</Table.Td> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {coursesData.map((course) => (
              <Table.Tr
                key={course.id || `${course.course_name}-${course.license_no}`}
              >
                <Table.Td style={{ textAlign: "center" }}>
                  {course.course_name}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {course.license_no}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {course.sdate}
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  {course.edate}
                </Table.Td>
                {isEditable ? (
                  <Table.Td style={{ textAlign: "center" }}>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => startEdit(course)}
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

export default function EducationCoursesComponent({
  education,
  courses,
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
      <Tabs defaultValue="education">
        <Tabs.List mb="sm">
          <Tabs.Tab value="education">
            <Text fw={500} size="1.2rem">
              Education
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="courses">
            <Text fw={500} size="1.2rem">
              Certificate Courses
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="education">
          <EducationTab educationData={education} isEditable={isEditable} />
        </Tabs.Panel>
        <Tabs.Panel value="courses">
          <CoursesTab coursesData={courses} isEditable={isEditable} />
        </Tabs.Panel>
      </Tabs>
    </Flex>
  );
}

EducationCoursesComponent.propTypes = {
  education: PropTypes.arrayOf(
    PropTypes.shape({
      degree: PropTypes.string,
      stream: PropTypes.string,
      institute: PropTypes.string,
      grade: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
    }),
  ),
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      course_name: PropTypes.string,
      license: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
  isEditable: PropTypes.bool,
};

EducationTab.propTypes = {
  educationData: PropTypes.arrayOf(
    PropTypes.shape({
      degree: PropTypes.string,
      stream: PropTypes.string,
      institute: PropTypes.string,
      grade: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
    }),
  ),
  isEditable: PropTypes.bool,
};

CoursesTab.propTypes = {
  coursesData: PropTypes.arrayOf(
    PropTypes.shape({
      course_name: PropTypes.string,
      license: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
  isEditable: PropTypes.bool,
};
