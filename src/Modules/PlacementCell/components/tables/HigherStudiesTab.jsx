import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Modal,
  NumberInput,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Pencil, Trash } from "@phosphor-icons/react";
import { MantineReactTable } from "mantine-react-table";
import { placementApi } from "../../services/api";
import { showApiError } from "../../utils/authorization";

const emptyForm = {
  roll_no: "",
  university: "",
  test_type: "",
  test_score: "",
  year: new Date().getFullYear(),
};

function HigherStudiesTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await placementApi.getHigherStudiesRecords();
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to fetch higher studies records.",
        authorizationFallback:
          "Only placement officer users can access higher studies records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingRecord(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpened(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setForm({
      roll_no: record.roll_no,
      university: record.university,
      test_type: record.test_type,
      test_score: record.test_score,
      year: record.year,
    });
    setModalOpened(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingRecord) {
        const response = await placementApi.updateHigherStudiesRecord(
          editingRecord.id,
          form,
        );
        setRecords((prev) =>
          prev.map((record) =>
            record.id === editingRecord.id ? response.data : record,
          ),
        );
      } else {
        const response = await placementApi.createHigherStudiesRecord(form);
        setRecords((prev) => [response.data, ...prev]);
      }

      notifications.show({
        title: "Success",
        message: "Higher studies record saved successfully.",
        color: "green",
      });
      setModalOpened(false);
      resetForm();
    } catch (error) {
      showApiError({
        error,
        fallback:
          error.response?.data?.roll_no?.[0] ||
          "Failed to save higher studies record.",
        authorizationFallback:
          "Only placement officer users can modify higher studies records.",
      });
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this higher studies record?")) return;

    try {
      await placementApi.deleteHigherStudiesRecord(recordId);
      setRecords((prev) => prev.filter((record) => record.id !== recordId));
      notifications.show({
        title: "Deleted",
        message: "Higher studies record deleted successfully.",
        color: "green",
      });
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to delete higher studies record.",
        authorizationFallback:
          "Only placement officer users can modify higher studies records.",
      });
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "roll_no", header: "Roll No" },
      { accessorKey: "student_name", header: "Student Name" },
      { accessorKey: "university", header: "University" },
      { accessorKey: "test_type", header: "Test Type" },
      { accessorKey: "test_score", header: "Test Score" },
      { accessorKey: "year", header: "Year" },
      {
        accessorKey: "actions",
        header: "Actions",
        // eslint-disable-next-line react/no-unstable-nested-components, react/prop-types
        Cell: ({ row }) => (
          <Group gap="xs">
            <ActionIcon
              color="blue"
              variant="light"
              // eslint-disable-next-line react/prop-types
              onClick={() => openEditModal(row.original)}
            >
              <Pencil size={18} />
            </ActionIcon>
            <ActionIcon
              color="red"
              variant="light"
              // eslint-disable-next-line react/prop-types
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash size={18} />
            </ActionIcon>
          </Group>
        ),
      },
    ],
    [],
  );

  return (
    <Container fluid mt={32}>
      <Flex justify="space-between" align="center" mb="md">
        <Title order={2}>Higher Studies</Title>
        <Button variant="outline" onClick={openCreateModal}>
          Add Higher Studies Record
        </Button>
      </Flex>

      <MantineReactTable
        columns={columns}
        data={records}
        state={{ isLoading: loading }}
      />

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          editingRecord
            ? "Edit Higher Studies Record"
            : "Add Higher Studies Record"
        }
        centered
        size="lg"
      >
        <Flex direction="column" gap="md">
          <TextInput
            label="Roll No"
            value={form.roll_no}
            disabled={Boolean(editingRecord)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, roll_no: event.target.value }))
            }
            required
          />
          <TextInput
            label="University"
            value={form.university}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, university: event.target.value }))
            }
            required
          />
          <TextInput
            label="Test Type"
            value={form.test_type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, test_type: event.target.value }))
            }
          />
          <NumberInput
            label="Test Score"
            value={form.test_score}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, test_score: value ?? "" }))
            }
          />
          <NumberInput
            label="Year"
            value={form.year}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, year: value ?? "" }))
            }
            required
          />
          <Group justify="flex-end">
            <Button onClick={handleSubmit}>Save</Button>
          </Group>
        </Flex>
      </Modal>
    </Container>
  );
}

export default HigherStudiesTab;
