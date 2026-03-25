/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  TextInput,
  Select,
  Pagination
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet } from "../api";
import { studentRecordsRoute } from "../../../routes/placementCellRoutes";

export default function StudentRecords() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [activePage, setActivePage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGet(studentRecordsRoute);
        setStudents(Array.isArray(res) ? res : []);
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to fetch student records",
          color: "red"
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  const paged = filtered.slice(
    (activePage - 1) * perPage,
    activePage * perPage,
  );

  const departments = [...new Set(students.map((s) => s.department).filter(Boolean))];

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Text fw={600} size="xl" mb="lg">
        Student Records
      </Text>

      <Group mb="md">
        <TextInput
          placeholder="Search by name or roll no..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActivePage(1);
          }}
          w={300}
        />
        <Select
          placeholder="Filter by Department"
          data={[
            { value: "", label: "All Departments" },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
          value={deptFilter}
          onChange={(val) => {
            setDeptFilter(val || "");
            setActivePage(1);
          }}
          clearable
          w={200}
        />
        <Badge variant="light" size="lg">
          {filtered.length} students
        </Badge>
      </Group>

      {paged.length > 0 ? (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Roll No</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Programme</Table.Th>
                <Table.Th>Batch</Table.Th>
                <Table.Th>CPI</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paged.map((s, i) => (
                <Table.Tr key={s.roll_no}>
                  <Table.Td>{(activePage - 1) * perPage + i + 1}</Table.Td>
                  <Table.Td fw={500}>{s.roll_no}</Table.Td>
                  <Table.Td>{s.name}</Table.Td>
                  <Table.Td>{s.department}</Table.Td>
                  <Table.Td>{s.programme}</Table.Td>
                  <Table.Td>{s.batch}</Table.Td>
                  <Table.Td>{s.cpi}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {s.debar === "DEBAR" && (
                        <Badge color="red" size="xs" variant="light">
                          Debarred
                        </Badge>
                      )}
                      {s.placed !== "NOT PLACED" && (
                        <Badge color="green" size="xs" variant="light">
                          {s.placed}
                        </Badge>
                      )}
                      {s.debar !== "DEBAR" && s.placed === "NOT PLACED" && (
                        <Badge color="gray" size="xs" variant="light">
                          Active
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {filtered.length > perPage && (
            <Group justify="center" mt="lg">
              <Pagination
                total={Math.ceil(filtered.length / perPage)}
                value={activePage}
                onChange={setActivePage}
              />
            </Group>
          )}
        </>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No students found.
        </Text>
      )}
    </div>
  );
}
