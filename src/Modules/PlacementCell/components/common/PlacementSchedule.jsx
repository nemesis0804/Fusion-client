import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Pagination,
  Grid,
  Modal,
  Button,
  Title,
  Tabs,
  TextInput,
  Select,
  Group,
} from "@mantine/core";
import { useSelector } from "react-redux";
import { notifications } from "@mantine/notifications";
import AddPlacementEventForm from "../forms/AddPlacementEventForm";
import PlacementScheduleCard from "./PlacementScheduleCard";
import LoadingSpinner from "./LoadingSpinner";
import { placementApi } from "../../services/api";

const parseValidDate = (value) => {
  if (!value) return null;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

function PlacementScheduleGrid({ data, itemsPerPage, cardsPerRow }) {
  const [activePage, setActivePage] = useState(1);

  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  const totalRows = Math.ceil(currentItems.length / cardsPerRow);
  const paddedItems = [...currentItems];
  const remainingCards = totalRows * cardsPerRow - currentItems.length;

  Array.from({ length: remainingCards }).forEach(() => paddedItems.push(null));
  return (
    <Container fluid>
      <Grid gutter="md">
        {paddedItems.map((item, index) => (
          <Grid.Col key={index} span="content">
            {item ? (
              <PlacementScheduleCard
                jobId={String(item.id)}
                companyName={item.company_name}
                location={item.location}
                position={item.role_st}
                jobType={item.placement_type}
                postedTime={item.schedule_at}
                deadline={item.placement_date}
                description={item.description}
                salary={item.ctc}
                endDateTime={item.end_datetime}
                eligible={item.eligible}
                eligibilityReasons={item.eligibility_reasons}
                eligibilityCriteria={item.eligibility_criteria}
                check={item.check}
              />
            ) : (
              <div />
            )}
          </Grid.Col>
        ))}
      </Grid>
      <Pagination
        page={activePage}
        onChange={setActivePage}
        total={Math.ceil(data.length / itemsPerPage)}
        mt="xl"
        position="right"
        // style={{ position: "fixed", bottom: 32 }}
      />
    </Container>
  );
}

PlacementScheduleGrid.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      company_name: PropTypes.string.isRequired,
    }),
  ).isRequired,

  itemsPerPage: PropTypes.number.isRequired,
  cardsPerRow: PropTypes.number.isRequired,
};

function PlacementSchedule() {
  const [placementData, setPlacementData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPackage, setMinPackage] = useState("");
  const [maxPackage, setMaxPackage] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const role = useSelector((state) => state.user.role);
  const isPlacementAdmin =
    role === "placement officer" || role === "placement chairman";

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await placementApi.getPlacementSchedule(params);
      setPlacementData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const status = err.response?.status;
      const responseMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null);

      console.error(
        "Error details:",
        err.response ? err.response.data : err.message,
      );
      setError(
        responseMessage ||
          (status
            ? `Failed to fetch placement schedules (HTTP ${status}).`
            : "Failed to fetch placement schedules."),
      );
      notifications.show({
        title: "Error",
        message:
          responseMessage ||
          (status
            ? `Failed to fetch placement schedules (HTTP ${status}).`
            : "Failed to fetch placement schedules."),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData({
      company: companyFilter,
      role: roleFilter,
      location: locationFilter,
      min_package: minPackage,
      max_package: maxPackage,
    });
  };

  const filteredPlacementData = placementData.filter((event) => {
    const packageValue = Number(event.ctc || 0);
    const matchesCompany =
      !companyFilter ||
      event.company_name?.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesRole =
      !roleFilter ||
      event.role_st?.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesLocation =
      !locationFilter ||
      event.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesMinPackage = !minPackage || packageValue >= Number(minPackage);
    const matchesMaxPackage = !maxPackage || packageValue <= Number(maxPackage);
    const matchesEligibility =
      eligibilityFilter === "all" ||
      (eligibilityFilter === "eligible" && event.eligible !== false) ||
      (eligibilityFilter === "ineligible" && event.eligible === false);
    return (
      matchesCompany &&
      matchesRole &&
      matchesLocation &&
      matchesMinPackage &&
      matchesMaxPackage &&
      matchesEligibility
    );
  });

  // Filter active events
  const allEvents = filteredPlacementData.filter(
    (event) =>
      parseValidDate(event.placement_date) || parseValidDate(event.schedule_at),
  );

  const activeEvents = filteredPlacementData.filter((event) => {
    const startDate = parseValidDate(event.placement_date);
    if (!startDate) return false;

    return startDate <= new Date(); // Active if the placement date is today or in the past
  });

  // Filter upcoming events
  const upcomingEvents = filteredPlacementData.filter((event) => {
    const startDate = parseValidDate(event.placement_date);
    if (!startDate) return false;

    return startDate > new Date(); // Upcoming if the placement date is in the future
  });

  // Filter closed events
  const closedEvents = filteredPlacementData.filter((event) => {
    const endDateTime = parseValidDate(
      event.schedule_at && event.time
        ? `${event.schedule_at}T${event.time}`
        : event.schedule_at,
    );
    if (!endDateTime) return false;

    return endDateTime <= new Date(); // Closed if the event's end time is in the past
  });

  // const closedEvents = placementData.filter((event) => {
  //   const endDateTime = new Date(`${event.schedule_at}T${event.time}`);
  //   return endDateTime <= new Date();
  // });

  const handleAddEvent = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEventCreated = async () => {
    setIsModalOpen(false);
    await fetchData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
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
          <Title order={2}>Placement Events</Title>
          {isPlacementAdmin && (
            <Button onClick={handleAddEvent} variant="outline">
              Add Placement Event
            </Button>
          )}
        </Container>
        <Group mb="md" ml={16}>
          <TextInput
            placeholder="Search company"
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <TextInput
            placeholder="Role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <TextInput
            placeholder="Location"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.currentTarget.value)}
            style={{ minWidth: 120 }}
          />
          <TextInput
            placeholder="Min Package"
            type="number"
            value={minPackage}
            onChange={(event) => setMinPackage(event.currentTarget.value)}
            style={{ minWidth: 100 }}
          />
          <TextInput
            placeholder="Max Package"
            type="number"
            value={maxPackage}
            onChange={(event) => setMaxPackage(event.currentTarget.value)}
            style={{ minWidth: 100 }}
          />
          {role === "student" && (
            <Select
              value={eligibilityFilter}
              onChange={(value) => setEligibilityFilter(value || "all")}
              data={[
                { value: "all", label: "All jobs" },
                { value: "eligible", label: "Eligible" },
                { value: "ineligible", label: "Ineligible" },
              ]}
              style={{ width: 120 }}
            />
          )}
          <Button onClick={handleSearch} variant="outline">
            Search
          </Button>
        </Group>
        <Tabs defaultValue="all" variant="pills" style={{ marginLeft: 16 }}>
          <Tabs.List>
            <Tabs.Tab value="all">All</Tabs.Tab>
            <Tabs.Tab value="active">Active</Tabs.Tab>
            <Tabs.Tab value="upcoming">Upcoming</Tabs.Tab>
            {role === "placement officer" && (
              <Tabs.Tab value="closed">Closed</Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="all" pt="md">
            {allEvents.length > 0 ? (
              <PlacementScheduleGrid
                data={allEvents}
                itemsPerPage={10}
                cardsPerRow={2}
              />
            ) : (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                No placement schedules available.
              </div>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="active" pt="md">
            {activeEvents.length > 0 ? (
              <PlacementScheduleGrid
                data={activeEvents}
                itemsPerPage={10}
                cardsPerRow={2}
              />
            ) : (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                No active placement schedules available.
              </div>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="upcoming" pt="md">
            {upcomingEvents.length > 0 ? (
              <PlacementScheduleGrid
                data={upcomingEvents}
                itemsPerPage={10}
                cardsPerRow={2}
              />
            ) : (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                No upcoming placement schedules available.
              </div>
            )}
          </Tabs.Panel>

          {role === "placement officer" && (
            <Tabs.Panel value="closed" pt="md">
              {closedEvents.length > 0 ? (
                <PlacementScheduleGrid
                  data={closedEvents}
                  itemsPerPage={10}
                  cardsPerRow={2}
                />
              ) : (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  No closed placement schedules available.
                </div>
              )}
            </Tabs.Panel>
          )}
        </Tabs>
      </Container>
      <Modal opened={isModalOpen} onClose={handleCloseModal} size="lg" centered>
        <AddPlacementEventForm
          opened={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleEventCreated}
        />
      </Modal>
    </>
  );
}

export default PlacementSchedule;
