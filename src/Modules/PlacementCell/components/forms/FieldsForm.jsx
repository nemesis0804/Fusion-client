/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from "react";
import {
  TextInput,
  Select,
  Switch,
  Button,
  Group,
  Notification,
  Container,
  Title,
  Modal,
} from "@mantine/core";
import { MantineReactTable } from "mantine-react-table";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";
import { showApiError } from "../../utils/authorization";

function FieldsForm() {
  const [name, setname] = useState("");
  const [type, settype] = useState("");
  const [required, setrequired] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState([]);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    const fetchFieldslist = async () => {
      try {
        const response = await placementApi.getFields();

        if (response.status === 200) {
          setFields(
            response.data.map((field) => ({
              name: field.name,
              type: field.type,
              required: field.required,
            })),
          );
        } else {
          notifications.show({
            title: "Error fetching data",
            message: `Error fetching data: ${response.status}`,
            color: "red",
          });
        }
      } catch (err) {
        showApiError({
          error: err,
          title: "Failed to fetch data",
          fallback: "Failed to fetch fields list",
          authorizationFallback:
            "Only placement officer users can manage placement fields.",
        });
      }
    };
    fetchFieldslist();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !type) {
      setError("Please fill all required fields.");
      return;
    }

    const newField = { name, type, required };

    try {
      const response = await placementApi.createField(newField);

      if (response.status === 200) {
        notifications.show({
          title: "Success",
          message: "Field added!",
          color: "green",
          position: "top-center",
        });
        setFields((prevFields) => [...prevFields, newField]);
        setModalOpened(false);
        setname("");
        settype("");
        setrequired(false);
      } else {
        notifications.show({
          title: "Failed",
          message: `Failed to add field`,
          color: "red",
          position: "top-center",
        });
      }
    } catch (err) {
      console.error("Error adding fields:", err);
      showApiError({
        error: err,
        fallback: "Failed to add field.",
        authorizationFallback:
          "Only placement officer users can manage placement fields.",
      });
    }
  };

  const columns = [
    { accessorKey: "name", header: "Field Name" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "required",
      header: "Required",
      Cell: ({ cell }) => (cell.getValue() ? "Yes" : "No"),
    },
  ];

  return (
    <Container fluid mt={32}>
      <Container
        fluid
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        my={16}
      >
        <Title order={2}>Fields</Title>
        <Group position="right">
          <Button variant="outline" onClick={() => setModalOpened(true)}>
            Add Field
          </Button>
        </Group>
      </Container>

      <MantineReactTable columns={columns} data={fields} />

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        centered
        size="lg"
        title="Add Field"
      >
        {error && (
          <Notification color="red" onClose={() => setError("")}>
            {error}
          </Notification>
        )}
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Field Name"
            placeholder="Enter field name"
            value={name}
            onChange={(e) => setname(e.target.value)}
            required
            mb={8}
          />
          <Select
            label="Field Type"
            placeholder="Select field type"
            value={type}
            onChange={(value) => settype(value)}
            data={[
              { value: "text", label: "Text" },
              { value: "number", label: "Number" },
              { value: "decimal", label: "Decimal" },
              { value: "date", label: "Date" },
              { value: "time", label: "Time" },
            ]}
            required
            mb={8}
          />
          <Group position="left" mt="md">
            <label>Required</label>
            <Switch
              checked={required}
              onChange={() => setrequired((prev) => !prev)}
              label={required ? "Yes" : "No"}
            />
          </Group>
          <Group position="right" mt="md">
            <Button type="submit">Add Field</Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
}

export default FieldsForm;
