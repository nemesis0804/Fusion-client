import { useState } from "react";
import PropTypes from "prop-types";
import {
  Flex,
  Input,
  Divider,
  Text,
  Button,
  Select,
  Textarea,
  Table,
} from "@mantine/core";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";

function AchievementsComponent({ achievements, isEditable }) {
  const [achievement, setAchievement] = useState({
    id: null,
    skill: "",
    type: "Educational",
    date: "",
    issuer: "",
    description: "",
  });

  const handleChange = (field, value) => {
    setAchievement((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        updateProfileDataRoute,
        {
          achievementsubmit: {
            id: achievement.id,
            achievement: achievement.skill,
            achievement_type:
              achievement.type === "Educational" ? "EDUCATIONAL" : "OTHER",
            date_earned: achievement.date,
            issuer: achievement.issuer,
            description: achievement.description,
          },
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        },
      );
      console.log(response);

      notifications.show({
        message: achievement.id
          ? "Achievement updated successfully!"
          : "Achievement added successfully!",
        color: "green",
      });
      setAchievement({
        id: null,
        skill: "",
        type: "Educational",
        date: "",
        issuer: "",
        description: "",
      });
    } catch (error) {
      alert("Error adding achievement");
    }
  };

  const startEdit = (entry) => {
    setAchievement({
      id: entry.id,
      skill: entry.achievement || entry.skill || "",
      type: entry.achievement_type || "Educational",
      date: entry.date_earned || "",
      issuer: entry.issuer || "",
      description: entry.description || "",
    });
  };

  const cancelEdit = () => {
    setAchievement({
      id: null,
      skill: "",
      type: "Educational",
      date: "",
      issuer: "",
      description: "",
    });
  };

  console.log(achievements);

  return (
    <Flex
      w={{ base: "100%", sm: "60%" }}
      p="md"
      h="auto"
      style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      direction="column"
      justify="space-evenly"
    >
      <Flex
        w="100%"
        p="md"
        direction="column"
        style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      >
        <Text fw={500} size="1.2rem">
          Achievements
        </Text>
        <Divider my="md" />
        {isEditable ? (
          <>
            <Flex w="100%" direction="column">
              <Text fw={500} mb="md">
                {achievement.id ? "Edit achievement" : "Add a new achievement"}
              </Text>
              <Flex align="center" justify="space-between" mb="md">
                <Input.Wrapper label="Achievement name" w="65%">
                  <Input
                    size="md"
                    mt="xs"
                    value={achievement.skill}
                    onChange={(e) => handleChange("skill", e.target.value)}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Type" w="30%">
                  <Select
                    size="md"
                    mt="xs"
                    data={["Educational", "Other"]}
                    value={achievement.type}
                    onChange={(value) => handleChange("type", value)}
                  />
                </Input.Wrapper>
              </Flex>
              <Flex align="center" justify="space-between" mb="md">
                <Input.Wrapper label="Date" w={{ base: "45%", sm: "30%" }}>
                  <Input
                    type="date"
                    size="md"
                    mt="xs"
                    value={achievement.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Issuer" w={{ base: "50%", sm: "65%" }}>
                  <Input
                    size="md"
                    mt="xs"
                    value={achievement.issuer}
                    onChange={(e) => handleChange("issuer", e.target.value)}
                  />
                </Input.Wrapper>
              </Flex>
              <Flex
                align="center"
                gap={{ base: "md", sm: "lg" }}
                justify="space-between"
                direction={{ base: "column" }}
              >
                <Input.Wrapper label="Description" w={{ base: "100%" }}>
                  <Textarea
                    autosize
                    minRows={5}
                    resize="vertical"
                    mt="xs"
                    value={achievement.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                  />
                </Input.Wrapper>
                <Button
                  size="md"
                  style={{
                    base: { alignSelf: "flex-center" },
                    sm: { alignSelf: "flex-end" },
                  }}
                  onClick={handleSubmit}
                >
                  {achievement.id ? "Save Changes" : "Submit"}
                </Button>
                {achievement.id ? (
                  <Button variant="light" color="gray" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </Flex>
            </Flex>
            <Divider my="md" />
          </>
        ) : null}
        <Text fw={500} mb="md">
          Your Achievements
        </Text>
        <Divider my="md" />
        {achievements.length > 0 ? (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ textAlign: "center" }}>Type</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>Date</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>Issuer</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>Description</Table.Th>
                {isEditable ? (
                  <Table.Th style={{ textAlign: "center" }}>Action</Table.Th>
                ) : null}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {achievements.map((ach) => (
                <Table.Tr key={ach.id || `${ach.issuer}-${ach.date_earned}`}>
                  <Table.Td style={{ textAlign: "center" }}>
                    {ach.achievement_type}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    {ach.date_earned}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    {ach.issuer}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    {ach.description}
                  </Table.Td>
                  {isEditable ? (
                    <Table.Td style={{ textAlign: "center" }}>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => startEdit(ach)}
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
          <Text>No achievements added yet.</Text>
        )}
      </Flex>
    </Flex>
  );
}

AchievementsComponent.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      skill: PropTypes.string,
      type: PropTypes.string,
      date: PropTypes.string,
      issuer: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
  isEditable: PropTypes.bool,
};

export default AchievementsComponent;
