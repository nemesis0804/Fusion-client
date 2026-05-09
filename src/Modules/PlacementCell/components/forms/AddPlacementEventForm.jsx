import React, { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Group,
  Select,
  Textarea,
  Card,
  Title,
  Grid,
  Chip,
  MultiSelect,
} from "@mantine/core";
import PropTypes from "prop-types";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../../services/api";
import { showApiError } from "../../utils/authorization";

function AddPlacementEventForm({ onClose, onSuccess }) {
  const [date, setDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [location, setLocation] = useState("");
  const [ctc, setCtc] = useState("");
  const [placementType, setPlacementType] = useState("");
  const [description, setDescription] = useState("");
  const [jobrole, setRole] = useState("");
  const [eligibility, setEligibility] = useState([]);
  const [passoutYear, setPassoutYear] = useState("");
  const [gender, setGender] = useState("");
  const [cpi, setCpi] = useState("");
  const [branch, setBranch] = useState("");
  const [showPassoutYearInput, setShowPassoutYearInput] = useState(false);
  const [showGenderSelect, setShowGenderSelect] = useState(false);
  const [showCpiInput, setShowCpiInput] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [tpoFields, setTpoFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

  const getCompanyId = (companyName) => {
    const _company = companies.find((c) => c.companyName === companyName);
    return _company ? _company.id : null;
  };

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        const response = await placementApi.getRegistrationList();

        if (response.status !== 200) {
          notifications.show({
            title: "Error fetching data",
            message: `Error fetching data: ${response.status}`,
            color: "red",
          });
        } else {
          const uniqueCompanies = [];
          const companyNames = new Set();

          response.data.forEach((comp) => {
            if (!companyNames.has(comp.companyName)) {
              companyNames.add(comp.companyName);
              uniqueCompanies.push(comp);
            }
          });

          setCompanies(uniqueCompanies);
        }
      } catch (error) {
        showApiError({
          error,
          title: "Failed to fetch data",
          fallback: "Failed to fetch companies list",
          authorizationFallback:
            "Only placement officer users can load company registrations.",
        });
        console.error(error);
      }
    };
    fetchRegistrationData();
  }, []);

  useEffect(() => {
    const fetchFieldsData = async () => {
      try {
        const response = await placementApi.getFields();

        if (response.status !== 200) {
          notifications.show({
            title: "Error fetching data",
            message: `Error fetching data: ${response.status}`,
            color: "red",
          });
        } else {
          const formattedFields = response.data.map((field) => ({
            value: field.name,
            label: field.name,
            id: field.id,
          }));
          setTpoFields(formattedFields);
        }
      } catch (error) {
        showApiError({
          error,
          title: "Failed to fetch fields data",
          fallback: "Failed to fetch fields list",
          authorizationFallback:
            "Only placement officer users can manage placement fields.",
        });
        console.error(error);
      }
    };
    fetchFieldsData();
  }, []);

  const handleSubmit = async () => {
    console.log("Submitting form");

    if (!localStorage.getItem("authToken")) {
      notifications.show({
        title: "Unauthorized",
        message: "You must log in to perform this action.",
        color: "red",
        position: "top-center",
      });
      return;
    }
    if (
      !selectedCompany ||
      !date ||
      !location ||
      !ctc ||
      !placementType ||
      !jobrole
    ) {
      notifications.show({
        title: "Missing details",
        message:
          "Company, date, location, CTC, placement type, and role are required.",
        color: "red",
        position: "top-center",
      });
      return;
    }
    const companyId = getCompanyId(selectedCompany);
    const matchingIds = selectedFields
      .map((value) => {
        const field = tpoFields.find((f) => f.value === value);
        if (!field) {
          console.error(`Field not found for value: ${value}`);
        }
        return field ? field.id : null;
      })
      .filter((id) => id !== null); // Filter out invalid/null IDs

    if (matchingIds.length === 0) {
      notifications.show({
        title: "Error",
        message: "At least one valid application field must be selected.",
        color: "red",
        position: "top-center",
      });
      return;
    }

    const formData = new FormData();
    formData.append(
      "placement_type",
      placementType === "Internship" ? "PBI" : "PLACEMENT",
    );
    formData.append("company_name", selectedCompany);
    if (companyId) {
      formData.append("company_id", companyId);
    }
    formData.append("ctc", ctc);
    formData.append("description", description);
    formData.append("title", selectedCompany);
    formData.append("location", location);
    formData.append("role", jobrole);
    formData.append("eligibility", eligibility.join(", "));
    if (passoutYear) {
      formData.append("passoutyr", passoutYear);
    }
    if (gender) {
      formData.append("gender", gender);
    }
    if (cpi) {
      formData.append("cpi", cpi);
    }
    if (branch) {
      formData.append("branch", branch);
    }
    formData.append(
      "schedule_at",
      date.toISOString().slice(0, 16).replace("T", " "),
    );
    matchingIds.forEach((id) => formData.append("fields", String(id)));

    if (date) {
      formData.append("placement_date", date.toISOString().split("T")[0]);
    }

    if (endDate) {
      formData.append("end_date", endDate.toISOString().split("T")[0]);
      formData.append(
        "end_datetime",
        endDate.toISOString().slice(0, 16).replace("T", " "),
      );
    }

    formData.append("selected_fields", selectedFields.join(", "));

    console.log("\n formData", formData);

    try {
      await placementApi.createPlacementEvent(formData);
      if (onSuccess) {
        await onSuccess();
      } else if (onClose) {
        onClose();
      }
      notifications.show({
        title: "Event Added",
        message: "Placement Event has been added successfully.",
        color: "green",
        position: "top-center",
      });
    } catch (error) {
      const responseData = error.response?.data;
      const errorMessage =
        responseData?.error ||
        responseData?.detail ||
        (responseData && typeof responseData === "object"
          ? Object.entries(responseData)
              .map(
                ([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
              )
              .join(" | ")
          : error.message);
      showApiError({
        error,
        fallback: `Failed to add Placement Event: ${errorMessage}`,
        authorizationFallback:
          "Only placement officer users can create placement schedules.",
      });
      console.error("Error adding schedule:", responseData || error.message);
    }
  };

  return (
    <Card style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Title order={3} align="center" style={{ marginBottom: "20px" }}>
        Add Placement Event
      </Title>

      <Grid gutter="lg">
        <Grid.Col span={4} style={{ position: "relative" }}>
          <Select
            label="Select Company"
            placeholder="Select a company"
            data={companies.map((company_) => company_.companyName)}
            value={selectedCompany}
            onChange={setSelectedCompany}
            required
          />
        </Grid.Col>

        <Grid.Col span={6} style={{ position: "relative" }}>
          <DateTimePicker
            label="Start Date and Time"
            placeholder="Pick start date and time"
            value={date}
            onChange={(selectedDate) => setDate(selectedDate)}
            required
          />
        </Grid.Col>

        <Grid.Col span={6} style={{ position: "relative" }}>
          <DateTimePicker
            label="End Date and Time"
            placeholder="Pick end date and time"
            value={endDate}
            onChange={(selectedDate) => setEndDate(selectedDate)}
            required
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <TextInput
            label="Location"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <TextInput
            label="CTC In Lpa"
            placeholder="Enter CTC"
            value={ctc}
            onChange={(e) => setCtc(e.target.value)}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Select
            label="Placement Type"
            placeholder="Select placement type"
            data={["Placement", "Internship"]}
            value={placementType}
            onChange={setPlacementType}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Textarea
            label="Description"
            placeholder="Enter a description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={3}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <TextInput
            label="Role Offered"
            placeholder="Enter the role offered"
            value={jobrole}
            onChange={(e) => setRole(e.target.value)}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <b>Eligibility Criteria</b>
          <Chip.Group
            multiple
            value={eligibility}
            onChange={setEligibility}
            style={{ marginTop: "10px" }}
          >
            {eligibility.map((criteria, index) => (
              <Chip key={index} value={criteria}>
                {criteria}
              </Chip>
            ))}
          </Chip.Group>
        </Grid.Col>

        <Grid.Col span={12}>
          <Group direction="column" spacing="xs">
            <Button
              onClick={() => setShowPassoutYearInput(!showPassoutYearInput)}
            >
              Passout Year
            </Button>
            {showPassoutYearInput && (
              <TextInput
                placeholder="Enter Passout Year"
                value={passoutYear}
                onChange={(e) => setPassoutYear(e.target.value)}
              />
            )}

            <Button onClick={() => setShowGenderSelect(!showGenderSelect)}>
              Gender
            </Button>
            {showGenderSelect && (
              <Select
                value={gender}
                onChange={setGender}
                data={["Male", "Female"]}
                placeholder="Select Gender"
              />
            )}

            <Button onClick={() => setShowCpiInput(!showCpiInput)}>CPI</Button>
            {showCpiInput && (
              <TextInput
                placeholder="Enter CPI"
                value={cpi}
                onChange={(e) => setCpi(e.target.value)}
              />
            )}

            <Button onClick={() => setShowBranchSelect(!showBranchSelect)}>
              Branch
            </Button>
            {showBranchSelect && (
              <Select
                value={branch}
                onChange={setBranch}
                data={["CSE", "ECE", "MECH", "SM", "BDES"]}
                placeholder="Select Branch"
              />
            )}
          </Group>
        </Grid.Col>

        <Grid.Col span={12}>
          <MultiSelect
            label="Select Fields"
            placeholder="Select fields"
            data={tpoFields}
            value={selectedFields}
            onChange={setSelectedFields}
            searchable
            clearable
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Button onClick={handleSubmit} fullWidth>
            Submit
          </Button>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

AddPlacementEventForm.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

AddPlacementEventForm.defaultProps = {
  onClose: undefined,
  onSuccess: undefined,
};

export default AddPlacementEventForm;
