/* eslint-disable react/prop-types */
/* eslint-disable new-cap */
import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Badge,
  Group,
  Loader,
  Select,
  TextInput,
  Button,
  Modal,
  Stack,
  NumberInput,
  Card,
  Grid,
  Tabs,
  Box,
  Checkbox,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { jsPDF as JsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  DownloadSimple,
  FilePdf,
  FileXls,
  CalendarPlus,
  PresentationChart,
  Table as TableIcon,
  Export,
  RocketLaunch,
} from "@phosphor-icons/react";
import { statisticsRoute } from "../../routes/placementCellRoutes/index.jsx";
import { apiGet, apiPost, apiDelete } from "./api.js";

function StatsCard({ label, value, color }) {
  const gradients = {
    blue: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    orange: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  };

  return (
    <Card
      shadow="sm"
      radius="md"
      p="lg"
      style={{ background: gradients[color] || gradients.blue, color: "white" }}
    >
      <Text size="2rem" fw={700} lh={1}>
        {value}
      </Text>
      <Text size="sm" mt={4} opacity={0.9}>
        {label}
      </Text>
    </Card>
  );
}

function AddRecordModal({ opened, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    placement_type: "PLACEMENT",
    name: "",
    ctc: 0,
    year: new Date().getFullYear(),
    test_type: "",
    test_score: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiPost(statisticsRoute, formData);
      notifications.show({
        title: "Success",
        message: "Record added",
        color: "green",
      });
      onSuccess();
      onClose();
      setFormData({
        placement_type: "PLACEMENT",
        name: "",
        ctc: 0,
        year: new Date().getFullYear(),
        test_type: "",
        test_score: "",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to add record",
        color: "red",
      });
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Placement Record"
      centered
    >
      <Stack>
        <Select
          label="Type"
          data={["PLACEMENT", "PBI", "HIGHER STUDIES"]}
          value={formData.placement_type}
          onChange={(val) => setFormData({ ...formData, placement_type: val })}
        />
        <TextInput
          label="Company / University Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Group grow>
          <NumberInput
            label="CTC (LPA)"
            value={formData.ctc}
            onChange={(val) => setFormData({ ...formData, ctc: val })}
            min={0}
            decimalScale={2}
          />
          <NumberInput
            label="Year"
            value={formData.year}
            onChange={(val) => setFormData({ ...formData, year: val })}
            min={2000}
            max={2100}
          />
        </Group>
        <TextInput
          label="Test Type"
          value={formData.test_type}
          onChange={(e) =>
            setFormData({ ...formData, test_type: e.target.value })
          }
        />
        <TextInput
          label="Test Score"
          value={formData.test_score}
          onChange={(e) =>
            setFormData({ ...formData, test_score: e.target.value })
          }
        />
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Add Record
        </Button>
      </Stack>
    </Modal>
  );
}

export default function PlacementStatistics({ role }) {
  const [stats, setStats] = useState({ records: [], year_stats: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Report Modals
  const [customReportOpen, setCustomReportOpen] = useState(false);
  const [scheduleReportOpen, setScheduleReportOpen] = useState(false);

  // Custom Report State
  const [selectedCols, setSelectedCols] = useState([
    "Name",
    "Type",
    "Year",
    "CTC",
  ]);
  const [customFormat, setCustomFormat] = useState("pdf");

  // Schedule Report State
  const [scheduleForm, setScheduleForm] = useState({
    frequency: "Weekly",
    reportType: "Batch-wise",
    emails: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("placement_type", filterType);
      if (filterYear) params.append("year", filterYear);
      if (filterDept) params.append("department", filterDept);

      const url = params.toString()
        ? `${statisticsRoute}?${params}`
        : statisticsRoute;
      const res = await apiGet(url);
      setStats(res);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch statistics",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterType, filterYear, filterDept]);

  const handleDelete = async (recordId) => {
    try {
      await apiDelete(statisticsRoute, { record_id: recordId });
      notifications.show({
        title: "Success",
        message: "Record deleted",
        color: "green",
      });
      fetchData();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete record",
        color: "red",
      });
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader size="lg" />
      </div>
    );

  const years = [...new Set(stats.records.map((r) => String(r.year)))].sort(
    (a, b) => b - a,
  );

  // Derive charts data
  const ctcByYear = {};
  stats.records.forEach((r) => {
    if (!ctcByYear[r.year])
      ctcByYear[r.year] = {
        year: String(r.year),
        totalCTC: 0,
        count: 0,
        maxCTC: 0,
      };
    if (r.ctc) {
      ctcByYear[r.year].totalCTC += parseFloat(r.ctc);
      ctcByYear[r.year].count += 1;
      if (parseFloat(r.ctc) > ctcByYear[r.year].maxCTC)
        ctcByYear[r.year].maxCTC = parseFloat(r.ctc);
    }
  });

  const ctcTrendsData = Object.values(ctcByYear)
    .map((y) => ({
      year: y.year,
      AvgCTC: y.count > 0 ? parseFloat((y.totalCTC / y.count).toFixed(2)) : 0,
      MaxCTC: parseFloat(y.maxCTC.toFixed(2)),
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  const placementsOverYearsData = stats.year_stats
    .map((y) => ({
      year: String(y.year),
      TotalPlaced: y.total,
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  // Reporting Functions
  const exportPDF = (type, customColumns = null) => {
    const doc = new JsPDF();
    let title = "Placement Report";
    let dataForTable = [];
    let head = [];

    if (type === "batch") {
      title = "Batch-wise Placement Report";
      head = [["Name", "Type", "Year", "CTC (LPA)"]];
      dataForTable = stats.records.map((r) => [
        r.name,
        r.placement_type,
        r.year,
        r.ctc ? `₹${r.ctc}` : "-",
      ]);
    } else if (type === "company") {
      title = "Company-wise Placement Report";
      head = [["Company Name", "Type", "Year", "CTC (LPA)"]];
      const recordsCopy = [...stats.records];
      recordsCopy.sort((a, b) => a.name.localeCompare(b.name));
      recordsCopy.forEach((r) => {
        dataForTable.push([
          r.name,
          r.placement_type,
          r.year,
          r.ctc ? `₹${r.ctc}` : "-",
        ]);
      });
    } else if (type === "custom" && customColumns) {
      title = "Custom Placement Report";
      head = [customColumns];
      dataForTable = stats.records.map((r) => {
        const row = [];
        if (customColumns.includes("Name")) row.push(r.name);
        if (customColumns.includes("Type")) row.push(r.placement_type);
        if (customColumns.includes("Year")) row.push(String(r.year));
        if (customColumns.includes("CTC"))
          row.push(r.ctc ? String(r.ctc) : "-");
        if (customColumns.includes("Test Type")) row.push(r.test_type || "-");
        if (customColumns.includes("Test Score")) row.push(r.test_score || "-");
        return row;
      });
    }

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    autoTable(doc, {
      startY: 30,
      head,
      body: dataForTable,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`${type}-report.pdf`);
  };

  const exportExcel = (type, customColumns = null) => {
    let dataForTable = [];
    if (type === "custom" && customColumns) {
      dataForTable = stats.records.map((r) => {
        const obj = {};
        if (customColumns.includes("Name")) obj.Name = r.name;
        if (customColumns.includes("Type")) obj.Type = r.placement_type;
        if (customColumns.includes("Year")) obj.Year = r.year;
        if (customColumns.includes("CTC")) obj["CTC (LPA)"] = r.ctc || "-";
        if (customColumns.includes("Test Type"))
          obj["Test Type"] = r.test_type || "-";
        if (customColumns.includes("Test Score"))
          obj["Test Score"] = r.test_score || "-";
        return obj;
      });
    } else {
      dataForTable = stats.records.map((r) => ({
        Company: r.name,
        Type: r.placement_type,
        Year: r.year,
        "CTC (LPA)": r.ctc || "-",
        "Test Type": r.test_type || "-",
        "Test Score": r.test_score || "-",
      }));
    }
    const ws = XLSX.utils.json_to_sheet(dataForTable);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${type || "standard"}-report.xlsx`);
  };

  const handleCustomExport = () => {
    if (customFormat === "pdf") {
      exportPDF("custom", selectedCols);
    } else {
      exportExcel("custom", selectedCols);
    }
    setCustomReportOpen(false);
  };

  const handleScheduleSubmit = () => {
    notifications.show({
      title: "Scheduled",
      message: `Successfully scheduled ${scheduleForm.frequency} ${scheduleForm.reportType} report to ${scheduleForm.emails}.`,
      color: "green",
      icon: <RocketLaunch size={18} />,
    });
    setScheduleReportOpen(false);
  };

  return (
    <Box>
      <Text
        fw={700}
        size="2rem"
        mb="md"
        variant="gradient"
        gradient={{ from: "blue", to: "cyan", deg: 90 }}
      >
        Placement Statistics & Analytics
      </Text>

      <Tabs defaultValue="dashboard" variant="pills" radius="xl" color="blue">
        <Tabs.List mb="xl">
          <Tabs.Tab
            value="dashboard"
            leftSection={<PresentationChart size={18} />}
          >
            Dashboard
          </Tabs.Tab>
          <Tabs.Tab value="records" leftSection={<TableIcon size={18} />}>
            Records
          </Tabs.Tab>
          {role !== "student" && (
            <Tabs.Tab value="reports" leftSection={<Export size={18} />}>
              Reports & Exports
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="dashboard">
          {stats.year_stats.length > 0 && (
            <Grid gutter="lg" mb="xl">
              {stats.year_stats.slice(0, 4).map((ys, i) => (
                <Grid.Col key={ys.year} span={{ base: 12, sm: 6, md: 3 }}>
                  <StatsCard
                    label={`Year ${ys.year} - Total Placed`}
                    value={ys.total}
                    color={["blue", "green", "orange", "purple"][i % 4]}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}

          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" radius="md" p="lg" withBorder>
                <Text fw={600} size="lg" mb="lg">
                  Placement Count Trends
                </Text>
                <Box h={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={placementsOverYearsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="TotalPlaced"
                        fill="#4facfe"
                        radius={[4, 4, 0, 0]}
                        name="Total Placements"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" radius="md" p="lg" withBorder>
                <Text fw={600} size="lg" mb="lg">
                  CTC Trends (LPA)
                </Text>
                <Box h={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ctcTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="AvgCTC"
                        stroke="#00f2fe"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Average CTC"
                      />
                      <Line
                        type="monotone"
                        dataKey="MaxCTC"
                        stroke="#38ef7d"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Highest CTC"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="records">
          <Card shadow="sm" radius="md" p="lg" withBorder>
            <Group justify="space-between" mb="lg" style={{ gap: "16px" }}>
              <Group style={{ gap: "16px" }}>
                <Select
                  placeholder="Filter by Type"
                  data={[
                    { value: "", label: "All Types" },
                    { value: "PLACEMENT", label: "Placement" },
                    { value: "PBI", label: "PBI" },
                    { value: "HIGHER STUDIES", label: "Higher Studies" },
                  ]}
                  value={filterType}
                  onChange={setFilterType}
                  clearable
                  w={200}
                />
                <Select
                  placeholder="Filter by Year"
                  data={[
                    { value: "", label: "All Years" },
                    ...years.map((y) => ({ value: y, label: String(y) })),
                  ]}
                  value={filterYear}
                  onChange={setFilterYear}
                  clearable
                  w={150}
                />
                <TextInput
                  placeholder="Filter by Dept (Optional)"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  w={200}
                />
              </Group>
              {(role === "placement officer" ||
                role === "placement chairman") && (
                <Button
                  onClick={() => setModalOpen(true)}
                  color="blue"
                  radius="md"
                >
                  + Add Record
                </Button>
              )}
            </Group>

            {stats.records.length > 0 ? (
              <Box style={{ overflowX: "auto" }}>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Year</Table.Th>
                      <Table.Th>CTC</Table.Th>
                      <Table.Th>Test</Table.Th>
                      {(role === "placement officer" ||
                        role === "placement chairman") && (
                        <Table.Th>Actions</Table.Th>
                      )}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats.records.map((r) => (
                      <Table.Tr key={r.id}>
                        <Table.Td fw={500}>{r.name}</Table.Td>
                        <Table.Td>
                          <Badge
                            variant="light"
                            color={
                              r.placement_type === "PLACEMENT"
                                ? "green"
                                : r.placement_type === "PBI"
                                  ? "blue"
                                  : "violet"
                            }
                          >
                            {r.placement_type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{r.year}</Table.Td>
                        <Table.Td>
                          {r.ctc ? (
                            <Text fw={600} c="green.7">
                              ₹{r.ctc} LPA
                            </Text>
                          ) : (
                            "-"
                          )}
                        </Table.Td>
                        <Table.Td>
                          {r.test_type
                            ? `${r.test_type}: ${r.test_score}`
                            : "-"}
                        </Table.Td>
                        {(role === "placement officer" ||
                          role === "placement chairman") && (
                          <Table.Td>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(r.id)}
                            >
                              Delete
                            </Button>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No records found.
              </Text>
            )}
          </Card>
        </Tabs.Panel>

        {role !== "student" && (
          <Tabs.Panel value="reports">
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                  <Text
                    fw={600}
                    size="xl"
                    mb="md"
                    display="flex"
                    style={{ alignItems: "center", gap: "8px" }}
                  >
                    <DownloadSimple weight="duotone" color="#4facfe" /> Standard
                    Reports
                  </Text>
                  <Text c="dimmed" size="sm" mb="xl">
                    Download predefined placement reports covering batch and
                    company statistics.
                  </Text>
                  <Stack>
                    <Card withBorder padding="md" radius="md">
                      <Group justify="space-between" align="center">
                        <Box>
                          <Text fw={600}>Batch-wise Placement Report</Text>
                          <Text size="xs" c="dimmed">
                            Detailed list of students placed per batch year
                          </Text>
                        </Box>
                        <Group style={{ gap: "8px" }}>
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            leftSection={<FilePdf size={16} />}
                            onClick={() => exportPDF("batch")}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="light"
                            color="teal"
                            size="xs"
                            leftSection={<FileXls size={16} />}
                            onClick={() => exportExcel("batch")}
                          >
                            Excel
                          </Button>
                        </Group>
                      </Group>
                    </Card>

                    <Card withBorder padding="md" radius="md">
                      <Group justify="space-between" align="center">
                        <Box>
                          <Text fw={600}>Company-wise Report</Text>
                          <Text size="xs" c="dimmed">
                            Aggregated data separated by recruiting companies
                          </Text>
                        </Box>
                        <Group style={{ gap: "8px" }}>
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            leftSection={<FilePdf size={16} />}
                            onClick={() => exportPDF("company")}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="light"
                            color="teal"
                            size="xs"
                            leftSection={<FileXls size={16} />}
                            onClick={() => exportExcel("company")}
                          >
                            Excel
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack h="100%">
                  <Card
                    shadow="sm"
                    radius="md"
                    p="lg"
                    withBorder
                    style={{ flex: 1 }}
                  >
                    <Text
                      fw={600}
                      size="xl"
                      mb="md"
                      display="flex"
                      style={{ alignItems: "center", gap: "8px" }}
                    >
                      <PresentationChart weight="duotone" color="#f5af19" />{" "}
                      Custom Builder
                    </Text>
                    <Text c="dimmed" size="sm" mb="lg">
                      Need a specific data subset? Build a custom report by
                      choosing exactly which columns to export.
                    </Text>
                    <Button
                      fullWidth
                      variant="gradient"
                      gradient={{ from: "orange", to: "red" }}
                      onClick={() => setCustomReportOpen(true)}
                    >
                      Build Custom Report
                    </Button>
                  </Card>

                  <Card
                    shadow="sm"
                    radius="md"
                    p="lg"
                    withBorder
                    style={{ flex: 1 }}
                  >
                    <Text
                      fw={600}
                      size="xl"
                      mb="md"
                      display="flex"
                      style={{ alignItems: "center", gap: "8px" }}
                    >
                      <CalendarPlus weight="duotone" color="#667eea" />{" "}
                      Automated Reports
                    </Text>
                    <Text c="dimmed" size="sm" mb="lg">
                      Schedule automated placement reports to be sent directly
                      to your inbox at regular intervals.
                    </Text>
                    <Button
                      fullWidth
                      variant="gradient"
                      gradient={{ from: "indigo", to: "cyan" }}
                      onClick={() => setScheduleReportOpen(true)}
                    >
                      Configure Schedule
                    </Button>
                  </Card>
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        )}
      </Tabs>

      <AddRecordModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Custom Report Modal */}
      <Modal
        opened={customReportOpen}
        onClose={() => setCustomReportOpen(false)}
        title="Build Custom Report"
        centered
      >
        <Stack>
          <Text size="sm" fw={500}>
            Select Columns to Export:
          </Text>
          <Checkbox.Group value={selectedCols} onChange={setSelectedCols}>
            <Stack style={{ gap: "8px" }}>
              <Checkbox value="Name" label="Name / Company" />
              <Checkbox value="Type" label="Placement Type" />
              <Checkbox value="Year" label="Year" />
              <Checkbox value="CTC" label="CTC (LPA)" />
              <Checkbox value="Test Type" label="Test Type" />
              <Checkbox value="Test Score" label="Test Score" />
            </Stack>
          </Checkbox.Group>
          <Select
            label="Export Format"
            data={[
              { value: "pdf", label: "PDF Document" },
              { value: "excel", label: "Excel Spreadsheet" },
            ]}
            value={customFormat}
            onChange={setCustomFormat}
          />
          <Button
            fullWidth
            mt="md"
            onClick={handleCustomExport}
            disabled={selectedCols.length === 0}
          >
            Download Report
          </Button>
        </Stack>
      </Modal>

      {/* Schedule Report Modal */}
      <Modal
        opened={scheduleReportOpen}
        onClose={() => setScheduleReportOpen(false)}
        title="Schedule Automated Reports"
        centered
      >
        <Stack>
          <Select
            label="Frequency"
            data={["Daily", "Weekly", "Monthly", "End of Semester"]}
            value={scheduleForm.frequency}
            onChange={(val) =>
              setScheduleForm({ ...scheduleForm, frequency: val })
            }
          />
          <Select
            label="Report Type"
            data={["Batch-wise", "Company-wise", "Full Data Dump"]}
            value={scheduleForm.reportType}
            onChange={(val) =>
              setScheduleForm({ ...scheduleForm, reportType: val })
            }
          />
          <TextInput
            label="Target Email Address"
            placeholder="e.g. tpo@institute.ac.in"
            value={scheduleForm.emails}
            onChange={(e) =>
              setScheduleForm({ ...scheduleForm, emails: e.target.value })
            }
            description="Comma separated for multiple emails"
          />
          <Button
            fullWidth
            mt="md"
            onClick={handleScheduleSubmit}
            disabled={!scheduleForm.emails}
          >
            Save Schedule
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}
