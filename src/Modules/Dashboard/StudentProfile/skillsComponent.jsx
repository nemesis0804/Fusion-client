import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Text,
  Button,
  Input,
  Flex,
  Divider,
  NumberInput,
  Table,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";

function SkillsTechComponent({ data, isEditable }) {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [rating, setRating] = useState(0);
  const [editingSkillId, setEditingSkillId] = useState(null);

  useEffect(() => {
    const normalizedSkills = (data || []).map((skillItem) => ({
      id: skillItem.id,
      skill_name:
        skillItem.skill_name ||
        skillItem.skill_id?.skill ||
        skillItem.skill_id?.skill_name ||
        "",
      skill_rating: skillItem.skill_rating ?? 0,
    }));
    setSkills(normalizedSkills);
  }, [data]);

  const updateSkills = async () => {
    if (!newSkill.trim()) {
      notifications.show({
        title: "Error",
        message: "Skill name cannot be empty!",
        color: "red",
      });
      return;
    }

    if (rating < 0 || rating > 5) {
      notifications.show({
        title: "Error",
        message: "Rating must be between 0 and 5",
        color: "red",
      });
      return;
    }

    const newSkillEntry = {
      skillsubmit: {
        ...(editingSkillId ? { id: editingSkillId } : {}),
        skill_id: {
          skill: newSkill.trim(),
        },
        skill_rating: Number(rating),
      },
    };

    try {
      const response = await axios.put(updateProfileDataRoute, newSkillEntry, {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      const createdSkill = response.data;
      if (editingSkillId) {
        setSkills((prev) =>
          prev.map((item) =>
            item.id === editingSkillId
              ? {
                  id: createdSkill.id || editingSkillId,
                  skill_name: createdSkill.skill_id?.skill || newSkill.trim(),
                  skill_rating: createdSkill.skill_rating ?? Number(rating),
                }
              : item,
          ),
        );
      } else {
        setSkills([
          ...skills,
          {
            id: createdSkill.id,
            skill_name: createdSkill.skill_id?.skill || newSkill.trim(),
            skill_rating: createdSkill.skill_rating ?? Number(rating),
          },
        ]);
      }
      setNewSkill("");
      setRating(0);
      setEditingSkillId(null);
      notifications.show({
        title: "Success",
        message: editingSkillId
          ? "Skill updated successfully!"
          : "Skill added successfully!",
        color: "green",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.skill ||
        error.response?.data?.skill_id?.skill?.[0] ||
        error.response?.data?.skill_id?.[0] ||
        error.response?.data?.skill_rating?.[0] ||
        "Failed to update skills. Please try again.";
      notifications.show({
        title: "Error",
        message: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
        color: "red",
      });
    }
  };

  const startEdit = (skill) => {
    setEditingSkillId(skill.id);
    setNewSkill(skill.skill_name);
    setRating(skill.skill_rating);
  };

  const cancelEdit = () => {
    setEditingSkillId(null);
    setNewSkill("");
    setRating(0);
  };

  console.log(skills);

  return (
    <Flex
      w={{ base: "100%", sm: "60%" }}
      p="md"
      h="auto"
      style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      direction="column"
      justify="space-evenly"
    >
      {isEditable ? (
        <Flex
          w="100%"
          p="md"
          direction="column"
          style={{ border: "1px solid lightgray", borderRadius: "5px" }}
        >
          <Text fw={500} size="1.2rem">
            Skills & Technologies
          </Text>
          <Divider my="md" />
          <Flex w="100%" direction="column">
            <Text fw={500} mb="lg">
              {editingSkillId
                ? "Edit Skill/Technology"
                : "Add New Skill/Technology"}
            </Text>
            <Flex
              align="center"
              justify="space-between"
              direction={{ base: "column", sm: "row" }}
            >
              <Input.Wrapper
                label="Skill/Technology"
                w={{ base: "100%", sm: "50%" }}
              >
                <Input
                  size="md"
                  mt="xs"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
              </Input.Wrapper>
              <Input.Wrapper label="Rating" w={{ base: "100%", sm: "30%" }}>
                <NumberInput
                  mt="xs"
                  min={0}
                  max={5}
                  clampBehavior="strict"
                  value={rating}
                  onChange={setRating}
                />
              </Input.Wrapper>
              <Group mt="xl">
                <Button onClick={updateSkills}>
                  {editingSkillId ? "Save" : "Add"}
                </Button>
                {editingSkillId ? (
                  <Button variant="light" color="gray" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </Group>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {/* Display Skills Section */}
      <Flex
        w="100%"
        p="md"
        direction="column"
        style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      >
        <Text fw={500} size="1.2rem">
          Your Skills
        </Text>
        <Divider my="md" />
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Skill</Table.Th>
              <Table.Th>Rating</Table.Th>
              {isEditable ? <Table.Th>Action</Table.Th> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {skills.length > 0 ? (
              skills.map((skill) => (
                <Table.Tr key={skill.id || skill.skill_name}>
                  <Table.Td>{skill.skill_name}</Table.Td>
                  <Table.Td>{skill.skill_rating}</Table.Td>
                  {isEditable ? (
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => startEdit(skill)}
                      >
                        Edit
                      </Button>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={isEditable ? 3 : 2} align="center">
                  No skills added yet
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Flex>
    </Flex>
  );
}

SkillsTechComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      skill_name: PropTypes.string.isRequired,
      skill_rating: PropTypes.number.isRequired,
    }),
  ),
  isEditable: PropTypes.bool,
};

export default SkillsTechComponent;
