/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  TextInput,
  Select,
  Pagination,
  Box,
  Stack,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { apiGet } from "./api.js";
import { studentRecordsRoute } from "../../routes/placementCellRoutes/index.jsx";

const PAGE_SIZE = 25;

export default function StudentRecords() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [count, setCount] = useState(0);
  const [numPages, setNumPages] = useState(1);
  const [departments, setDepartments] = useState([]);

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setActivePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = async (opts = {}) => {
    const includeDepartments =
      opts.includeDepartments ?? departments.length === 0;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(opts.page ?? activePage),
        page_size: String(PAGE_SIZE),
      });
      const q = opts.q ?? debouncedSearch;
      const dept = opts.dept ?? deptFilter;
      if (q) params.set("q", q);
      if (dept) params.set("department", dept);
      if (includeDepartments) params.set("departments", "1");
      const res = await apiGet(`${studentRecordsRoute}?${params.toString()}`);
      // Tolerate the legacy non-paginated array response in case the backend
      // hasn't been updated for any reason.
      if (Array.isArray(res)) {
        setStudents(res);
        setCount(res.length);
        setNumPages(1);
      } else {
        setStudents(res.results || []);
        setCount(res.count ?? 0);
        setNumPages(res.num_pages ?? 1);
        if (Array.isArray(res.departments)) {
          setDepartments(res.departments);
        }
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch student records",
        color: "red",
      });
      setStudents([]);
    }
    setLoading(false);
  };

  // Initial load — also pulls the department list.
  useEffect(() => {
    fetchData({ page: 1, includeDepartments: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters or page change.
  useEffect(() => {
    fetchData({ page: activePage, q: debouncedSearch, dept: deptFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedSearch, deptFilter]);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "All Departments" },
      ...departments.map((d) => ({ value: d, label: d })),
    ],
    [departments],
  );

  const startIdx = (activePage - 1) * PAGE_SIZE;

  return (
    <div>
      <Group justify="space-between" mb="lg" wrap="wrap">
        <Stack gap={2}>
          <Text fw={600} size="xl">
            Student Records
          </Text>
          <Text size="sm" c="dimmed">
            Search the student roster (paginated, server-side).
          </Text>
        </Stack>
        <Tooltip label="Reload">
          <ActionIcon
            variant="light"
            onClick={() =>
              fetchData({
                page: activePage,
                q: debouncedSearch,
                dept: deptFilter,
                includeDepartments: false,
              })
            }
            loading={loading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group mb="md" wrap="wrap">
        <TextInput
          placeholder="Search by name, roll no, or username"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          w={300}
        />
        <Select
          placeholder="Filter by Department"
          data={departmentOptions}
          value={deptFilter}
          onChange={(val) => {
            setDeptFilter(val || "");
            setActivePage(1);
          }}
          clearable
          searchable
          w={220}
        />
        <Badge variant="light" size="lg">
          {count} student{count === 1 ? "" : "s"}
        </Badge>
      </Group>

      {loading && students.length === 0 ? (
        <Box ta="center" py="xl">
          <Loader />
        </Box>
      ) : students.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No students found.
        </Text>
      ) : (
        <>
          <Box style={{ overflowX: "auto", opacity: loading ? 0.6 : 1 }}>
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
                {students.map((s, i) => (
                  <Table.Tr key={s.roll_no}>
                    <Table.Td>{startIdx + i + 1}</Table.Td>
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
          </Box>
          {numPages > 1 && (
            <Group justify="center" mt="lg">
              <Pagination
                total={numPages}
                value={activePage}
                onChange={setActivePage}
              />
            </Group>
          )}
        </>
      )}
    </div>
  );
}
