import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Modal,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { MantineReactTable } from "mantine-react-table";
import { PencilSimple } from "@phosphor-icons/react";
import { placementApi } from "../../services/api";

const emptyForm = {
  title: "",
  description: "",
};

function PlacementPoliciesTab() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingPolicyId, setEditingPolicyId] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await placementApi.getPlacementPolicies();
      setPolicies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.detail || "Failed to fetch placement policies.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPolicyId(null);
  };

  const handleSave = async () => {
    try {
      const response = editingPolicyId
        ? await placementApi.updatePlacementPolicy(editingPolicyId, form)
        : await placementApi.createPlacementPolicy(form);
      setPolicies((prev) =>
        editingPolicyId
          ? prev.map((policy) =>
              policy.id === editingPolicyId ? response.data : policy,
            )
          : [response.data, ...prev],
      );
      notifications.show({
        title: "Success",
        message: editingPolicyId
          ? "Placement policy updated successfully."
          : "Placement policy added successfully.",
        color: "green",
      });
      setModalOpened(false);
      resetForm();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.title?.[0] ||
          error.response?.data?.description?.[0] ||
          error.response?.data?.detail ||
          "Failed to add placement policy.",
        color: "red",
      });
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "title", header: "Policy Title" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "created_by", header: "Created By" },
      {
        accessorKey: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => {
              setForm({
                title: row.original.title || "",
                description: row.original.description || "",
              });
              setEditingPolicyId(row.original.id);
              setModalOpened(true);
            }}
          >
            <PencilSimple size={18} />
          </ActionIcon>
        ),
      },
      {
        accessorKey: "updated_at",
        header: "Last Updated",
        Cell: ({ row }) => {
          const value = row.original.updated_at;
          return value ? new Date(value).toLocaleString() : "-";
        },
      },
    ],
    [],
  );

  return (
    <Container fluid mt={32}>
      <Flex justify="space-between" align="center" mb="md">
        <div>
          <Title order={2}>Placement Policies</Title>
          <Text c="dimmed" size="sm">
            Review the published placement rules and add new policy entries.
          </Text>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            resetForm();
            setModalOpened(true);
          }}
        >
          Add Policy
        </Button>
      </Flex>

      <MantineReactTable
        columns={columns}
        data={policies}
        state={{ isLoading: loading }}
      />

      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          resetForm();
        }}
        title={editingPolicyId ? "Edit Placement Policy" : "Add Placement Policy"}
        centered
        size="lg"
      >
        <Flex direction="column" gap="md">
          <TextInput
            label="Policy Title"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
          <Textarea
            label="Description"
            minRows={6}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            required
          />
          <Group justify="flex-end">
            <Button onClick={handleSave}>Save Policy</Button>
          </Group>
        </Flex>
      </Modal>
    </Container>
  );
}

export default PlacementPoliciesTab;
