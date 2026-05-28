import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { MantineReactTable } from "mantine-react-table";
import { placementApi } from "../../services/api";
import { downloadBlobFile } from "../../utils/helpers";
import { showApiError } from "../../utils/authorization";

const defaultFilters = {
  report_type: "custom",
  company: "",
  department: "",
  year: "",
  ctc_min: "",
  ctc_max: "",
};

const emptyScheduleForm = {
  name: "",
  report_type: "custom",
  frequency: "weekly",
  export_format: "excel",
  recipients: "",
  is_active: true,
};

function PlacementReportsPanel() {
  const [filters, setFilters] = useState(defaultFilters);
  const [reportData, setReportData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadSchedules = async () => {
    try {
      const response = await placementApi.getPlacementReportSchedules();
      setSchedules(response.data || []);
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to load report schedules.",
        authorizationFallback:
          "Only TPO and chairman users can manage report schedules.",
      });
    }
  };

  const loadReport = async (params = filters) => {
    setLoading(true);
    try {
      const response = await placementApi.getPlacementReport(params);
      setReportData(response.data);
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to load placement report.",
        authorizationFallback:
          "Only TPO and chairman users can access reports.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(defaultFilters);
    loadSchedules();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value || "" }));
  };

  const runReport = async () => {
    await loadReport(filters);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await placementApi.exportPlacementReport(filters, format);
      downloadBlobFile(
        response.data,
        `placement_report.${format === "pdf" ? "pdf" : "xls"}`,
        format === "pdf" ? "application/pdf" : "application/vnd.ms-excel",
      );
      notifications.show({
        title: "Success",
        message: `${format.toUpperCase()} report exported successfully.`,
        color: "green",
      });
    } catch (error) {
      showApiError({
        error,
        fallback: `Failed to export ${format.toUpperCase()} report.`,
        authorizationFallback:
          "Only TPO and chairman users can export reports.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.name.trim()) {
      notifications.show({
        title: "Validation Failed",
        message: "Schedule name is required.",
        color: "red",
      });
      return;
    }
    try {
      await placementApi.createPlacementReportSchedule({
        ...scheduleForm,
        filters,
        recipients: scheduleForm.recipients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      notifications.show({
        title: "Success",
        message: "Scheduled report configured successfully.",
        color: "green",
      });
      setScheduleForm(emptyScheduleForm);
      await loadSchedules();
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to save report schedule.",
        authorizationFallback:
          "Only TPO and chairman users can manage report schedules.",
      });
    }
  };

  const toggleSchedule = async (schedule) => {
    try {
      await placementApi.updatePlacementReportSchedule(schedule.id, {
        ...schedule,
        recipients: schedule.recipients,
        is_active: !schedule.is_active,
      });
      await loadSchedules();
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to update schedule.",
        authorizationFallback:
          "Only TPO and chairman users can manage report schedules.",
      });
    }
  };

  const removeSchedule = async (scheduleId) => {
    try {
      await placementApi.deletePlacementReportSchedule(scheduleId);
      notifications.show({
        title: "Success",
        message: "Scheduled report deleted.",
        color: "green",
      });
      await loadSchedules();
    } catch (error) {
      showApiError({
        error,
        fallback: "Failed to delete schedule.",
        authorizationFallback:
          "Only TPO and chairman users can manage report schedules.",
      });
    }
  };

  const columns = useMemo(
    () =>
      (reportData?.columns || []).map((column) => ({
        accessorKey: column,
        header: String(column).replace(/_/g, " ").replace(/\b\w/g, (char) =>
          char.toUpperCase(),
        ),
      })),
    [reportData],
  );

  return (
    <Stack>
      <Title order={2}>Placement Reports</Title>

      <Card withBorder radius="md">
        <Stack>
          <Text fw={600}>Report Builder</Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Select
              label="Template"
              data={[
                { value: "batch", label: "Batch Summary" },
                { value: "company", label: "Company Summary" },
                { value: "branch", label: "Branch Summary" },
                { value: "custom", label: "Custom Report" },
              ]}
              value={filters.report_type}
              onChange={(value) => handleFilterChange("report_type", value)}
            />
            <TextInput
              label="Company"
              value={filters.company}
              onChange={(event) =>
                handleFilterChange("company", event.currentTarget.value)
              }
            />
            <TextInput
              label="Branch"
              value={filters.department}
              onChange={(event) =>
                handleFilterChange("department", event.currentTarget.value)
              }
            />
            <TextInput
              label="Batch"
              value={filters.year}
              onChange={(event) =>
                handleFilterChange("year", event.currentTarget.value)
              }
            />
            <TextInput
              label="Min CTC"
              value={filters.ctc_min}
              onChange={(event) =>
                handleFilterChange("ctc_min", event.currentTarget.value)
              }
            />
            <TextInput
              label="Max CTC"
              value={filters.ctc_max}
              onChange={(event) =>
                handleFilterChange("ctc_max", event.currentTarget.value)
              }
            />
          </SimpleGrid>
          <Group>
            <Button onClick={runReport}>Run Report</Button>
            <Button
              variant="light"
              onClick={() => handleExport("excel")}
              loading={exporting}
            >
              Export Excel
            </Button>
            <Button
              variant="light"
              onClick={() => handleExport("pdf")}
              loading={exporting}
            >
              Export PDF
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="md">
        <Stack>
          <Text fw={600}>Report Preview</Text>
          {loading ? (
            <Loader />
          ) : reportData?.rows?.length ? (
            <MantineReactTable columns={columns} data={reportData.rows} />
          ) : (
            <Alert color="yellow">No records available for this report.</Alert>
          )}
        </Stack>
      </Card>

      <Card withBorder radius="md">
        <Stack>
          <Text fw={600}>Scheduled Reports</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Schedule Name"
              value={scheduleForm.name}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  name: event.currentTarget.value,
                }))
              }
            />
            <Select
              label="Report Type"
              data={[
                { value: "batch", label: "Batch Summary" },
                { value: "company", label: "Company Summary" },
                { value: "branch", label: "Branch Summary" },
                { value: "custom", label: "Custom Report" },
              ]}
              value={scheduleForm.report_type}
              onChange={(value) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  report_type: value || "custom",
                }))
              }
            />
            <Select
              label="Frequency"
              data={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
              value={scheduleForm.frequency}
              onChange={(value) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  frequency: value || "weekly",
                }))
              }
            />
            <Select
              label="Export Format"
              data={[
                { value: "excel", label: "Excel" },
                { value: "pdf", label: "PDF" },
              ]}
              value={scheduleForm.export_format}
              onChange={(value) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  export_format: value || "excel",
                }))
              }
            />
          </SimpleGrid>
          <TextInput
            label="Recipients"
            description="Comma-separated email list"
            value={scheduleForm.recipients}
            onChange={(event) =>
              setScheduleForm((prev) => ({
                ...prev,
                recipients: event.currentTarget.value,
              }))
            }
          />
          <Group>
            <Switch
              checked={scheduleForm.is_active}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  is_active: event.currentTarget.checked,
                }))
              }
              label="Active"
            />
            <Button onClick={handleSaveSchedule}>Save Schedule</Button>
          </Group>

          {schedules.length ? (
            <Table withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Frequency</Table.Th>
                  <Table.Th>Format</Table.Th>
                  <Table.Th>Recipients</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedules.map((schedule) => (
                  <Table.Tr key={schedule.id}>
                    <Table.Td>{schedule.name}</Table.Td>
                    <Table.Td>{schedule.report_type}</Table.Td>
                    <Table.Td>{schedule.frequency}</Table.Td>
                    <Table.Td>{schedule.export_format}</Table.Td>
                    <Table.Td>{(schedule.recipients || []).join(", ")}</Table.Td>
                    <Table.Td>{schedule.is_active ? "Active" : "Inactive"}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => toggleSchedule(schedule)}
                        >
                          {schedule.is_active ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => removeSchedule(schedule.id)}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert color="blue">No scheduled reports configured yet.</Alert>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

export default PlacementReportsPanel;
