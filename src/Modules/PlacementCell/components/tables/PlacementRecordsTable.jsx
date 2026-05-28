/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { MantineReactTable } from "mantine-react-table";
import { useSelector } from "react-redux";
import { notifications } from "@mantine/notifications";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AddPlacementRecordForm from "../forms/AddPlacementRecordForm";
import { placementApi } from "../../services/api";
import {
  getAuthorizationErrorMessage,
  isForbiddenError,
  showApiError,
} from "../../utils/authorization";

const CHART_COLORS = [
  "#0f766e",
  "#2563eb",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#059669",
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function PlacementRecordsTable() {
  const role = useSelector((state) => state.user.role);

  const [placementStats, setPlacementStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    const fetchPlacementStats = async () => {
      setLoading(true);
      try {
        const response = await placementApi.getPlacementStatistics();
        const rows = Array.isArray(response.data) ? response.data : [];
        setPlacementStats(rows);
      } catch (err) {
        setError(
          isForbiddenError(err)
            ? getAuthorizationErrorMessage(
                err,
                "Only placement officer users can access placement statistics.",
              )
            : "Failed to fetch placement statistics",
        );
        showApiError({
          error: err,
          title: "Failed to fetch data",
          fallback: "Failed to fetch placement statistics",
          authorizationFallback:
            "Only placement officer users can access placement statistics.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlacementStats();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this record id:${id}?`,
    );

    if (!confirmDelete) return;

    try {
      const response = await placementApi.deletePlacementStatistic(id);

      if (response.status === 200) {
        notifications.show({
          title: "Record deleted",
          message: "Record successfully deleted!",
          color: "green",
        });
        setPlacementStats((prevStats) =>
          prevStats.filter((record) => record.id !== id),
        );
      } else {
        notifications.show({
          title: "Failed to delete record",
          message: "Unable to delete the record.",
          color: "red",
        });
      }
    } catch (err) {
      showApiError({
        error: err,
        title: "Failed to delete record",
        fallback: "An error occurred while deleting the record.",
        authorizationFallback:
          "Only placement officer users can delete placement statistics.",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "first_name",
        header: "Student Name",
        size: 200,
      },
      {
        accessorKey: "placement_name",
        header: "Company",
        size: 200,
      },
      {
        accessorKey: "batch",
        header: "Batch",
        size: 120,
      },
      {
        accessorKey: "branch",
        header: "Branch",
        size: 140,
      },
      {
        accessorKey: "ctc",
        header: "CTC",
        size: 120,
      },
      ...(role === "placement officer"
        ? [
            {
              accessorKey: "actions",
              header: "Actions",
              // eslint-disable-next-line react/no-unstable-nested-components, react/prop-types
              Cell: ({ row }) => (
                <Button
                  color="red"
                  size="xs"
                  onClick={() => handleDelete(row.original.id)}
                >
                  Delete
                </Button>
              ),
              size: 100,
            },
          ]
        : []),
    ],
    [role],
  );

  const analytics = useMemo(() => {
    const normalizedRows = placementStats.map((record) => ({
      ...record,
      ctcValue: Number.parseFloat(record.ctc || 0) || 0,
      branchName: record.branch || "Unassigned",
      batchName: String(record.batch || "Unknown"),
      companyName: record.placement_name || "Unknown",
    }));

    const branchMap = new Map();
    const batchMap = new Map();
    const companyMap = new Map();
    const branchCtcMap = new Map();

    normalizedRows.forEach((record) => {
      branchMap.set(
        record.branchName,
        (branchMap.get(record.branchName) || 0) + 1,
      );
      batchMap.set(record.batchName, (batchMap.get(record.batchName) || 0) + 1);
      companyMap.set(
        record.companyName,
        (companyMap.get(record.companyName) || 0) + 1,
      );

      const branchEntry = branchCtcMap.get(record.branchName) || {
        totalCtc: 0,
        count: 0,
      };
      branchEntry.totalCtc += record.ctcValue;
      branchEntry.count += 1;
      branchCtcMap.set(record.branchName, branchEntry);
    });

    const branchData = Array.from(branchMap.entries())
      .map(([branch, count]) => ({ branch, count }))
      .sort((a, b) => b.count - a.count);

    const batchData = Array.from(batchMap.entries())
      .map(([batch, count]) => ({ batch, count: Number(count) }))
      .sort((a, b) => Number(a.batch) - Number(b.batch));

    const companyData = Array.from(companyMap.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count);

    const topCompanyData = companyData.slice(0, 5);
    const otherCompaniesCount = companyData
      .slice(5)
      .reduce((sum, item) => sum + item.count, 0);
    if (otherCompaniesCount > 0) {
      topCompanyData.push({ company: "Others", count: otherCompaniesCount });
    }

    const branchAverageCtcData = Array.from(branchCtcMap.entries())
      .map(([branch, values]) => ({
        branch,
        averageCtc: Number((values.totalCtc / values.count).toFixed(2)),
      }))
      .sort((a, b) => b.averageCtc - a.averageCtc);

    const totalPlacements = normalizedRows.length;
    const totalCompanies = new Set(
      normalizedRows.map((record) => record.companyName),
    ).size;
    const averageCtc = totalPlacements
      ? normalizedRows.reduce((sum, record) => sum + record.ctcValue, 0) /
        totalPlacements
      : 0;
    const highestCtc = totalPlacements
      ? Math.max(...normalizedRows.map((record) => record.ctcValue))
      : 0;

    return {
      totalPlacements,
      totalCompanies,
      averageCtc,
      highestCtc,
      branchData,
      batchData,
      topCompanyData,
      branchAverageCtcData,
    };
  }, [placementStats]);

  if (loading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <Container fluid>
      <Group justify="space-between" align="center" my={16}>
        <div>
          <Title order={2}>Placement Statistics</Title>
          <Text c="dimmed" size="sm">
            Interactive analytics for placement outcomes, hiring trends, and
            package patterns.
          </Text>
        </div>
        {role === "placement officer" && (
          <Button onClick={() => setModalOpened(true)} variant="outline">
            Add Placement Record
          </Button>
        )}
      </Group>

      <AddPlacementRecordForm
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
      />

      {placementStats.length > 0 ? (
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <Paper withBorder radius="lg" p="lg">
              <Text c="dimmed" size="sm">
                Total Placements
              </Text>
              <Title order={2}>{formatNumber(analytics.totalPlacements)}</Title>
            </Paper>
            <Paper withBorder radius="lg" p="lg">
              <Text c="dimmed" size="sm">
                Hiring Companies
              </Text>
              <Title order={2}>{formatNumber(analytics.totalCompanies)}</Title>
            </Paper>
            <Paper withBorder radius="lg" p="lg">
              <Text c="dimmed" size="sm">
                Average CTC
              </Text>
              <Title order={2}>{formatNumber(analytics.averageCtc)} LPA</Title>
            </Paper>
            <Paper withBorder radius="lg" p="lg">
              <Text c="dimmed" size="sm">
                Highest CTC
              </Text>
              <Title order={2}>{formatNumber(analytics.highestCtc)} LPA</Title>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, xl: 2 }}>
            <Paper withBorder radius="lg" p="lg">
              <Title order={4} mb="md">
                Placements By Branch
              </Title>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.branchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Title order={4} mb="md">
                Top Hiring Companies
              </Title>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={analytics.topCompanyData}
                      dataKey="count"
                      nameKey="company"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {analytics.topCompanyData.map((entry, index) => (
                        <Cell
                          key={entry.company}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Title order={4} mb="md">
                Batch Trend
              </Title>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.batchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="batch" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Title order={4} mb="md">
                Average CTC By Branch
              </Title>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.branchAverageCtcData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="averageCtc"
                      fill="#f59e0b"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </SimpleGrid>

          <Paper withBorder radius="lg" p="lg">
            <Title order={3} mb="md">
              Placement Records
            </Title>
            <MantineReactTable columns={columns} data={placementStats} />
          </Paper>
        </Stack>
      ) : (
        <Alert color="yellow">No records available</Alert>
      )}
    </Container>
  );
}

export default PlacementRecordsTable;
