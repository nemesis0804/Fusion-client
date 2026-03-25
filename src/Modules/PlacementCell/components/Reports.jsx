/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  Table,
  Text,
  Group,
  Loader,
  Select,
  
  Badge,
  Divider
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet } from "../api";
import {
  reportsRoute,
  jobOffersRoute
} from "../../../routes/placementCellRoutes";

function StatCard({ label, value, color }) {
  const gradients = {
    blue: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    teal: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    orange: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)"
  };
  return (
    <Card shadow="md" radius="lg" p="lg" style={{ background: gradients[color] || gradients.blue, color: "white", textAlign: "center" }}>
      <Text size="2rem" fw={800} lh={1}>{value ?? 0}</Text>
      <Text size="xs" mt={4} opacity={0.9} tt="uppercase" lts={0.5}>{label}</Text>
    </Card>
  );
}

function PackageStat({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <Text size="1.5rem" fw={700}>₹{value ?? 0}</Text>
      <Text size="xs" c="dimmed">{label}</Text>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterYear] = useState("");
  const [filterDept] = useState("");
  const [allOffers, setAllOffers] = useState([]);
  const [offersFilter, setOffersFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filterYear) params.append("year", filterYear);
        if (filterDept) params.append("department", filterDept);
        const url = params.toString() ? `${reportsRoute}?${params}` : reportsRoute;
        const res = await apiGet(url);
        setData(res);
      } catch {
        notifications.show({ title: "Error", message: "Failed to load reports", color: "red" });
      }
      setLoading(false);
    };
    fetchData();
  }, [filterYear, filterDept]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const params = offersFilter ? `?status=${offersFilter}` : "";
        const res = await apiGet(`${jobOffersRoute}${params}`);
        setAllOffers(Array.isArray(res) ? res : res.results || []);
      } catch { /* ignore */ }
    };
    fetchOffers();
  }, [offersFilter]);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}><Loader /></div>;

  return (
    <div>
      <Text fw={600} size="xl" mb="lg">Placement Reports & Analytics</Text>

      {data && (
        <>
          <Grid gutter="lg" mb="xl">
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard label="Students Placed" value={data.placed_students} color="blue" />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard label="Placement Rate" value={`${data.placement_rate || 0}%`} color="green" />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard label="Companies" value={data.companies_participated} color="teal" />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <StatCard label="Total Students" value={data.total_students} color="orange" />
            </Grid.Col>
          </Grid>

          {data.stats && (
            <Card shadow="xs" padding="lg" radius="md" withBorder mb="xl">
              <Text fw={600} mb="sm">Package Statistics (LPA)</Text>
              <Group justify="center" gap="xl">
                <PackageStat label="Highest" value={data.stats.max_ctc} />
                <PackageStat label="Average" value={data.stats.avg_ctc?.toFixed(2)} />
                <PackageStat label="Lowest" value={data.stats.min_ctc} />
                <PackageStat label="Total Offers" value={data.stats.total_offers} />
              </Group>
            </Card>
          )}

          {data.stats?.company_wise?.length > 0 && (
            <Card shadow="xs" padding="lg" radius="md" withBorder mb="xl">
              <Text fw={600} mb="sm">Company-wise Placements</Text>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Company</Table.Th>
                    <Table.Th>Students Placed</Table.Th>
                    <Table.Th>Avg Package (LPA)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.stats.company_wise.map((row, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={500}>{row.company || row.application__job_posting__company__name}</Table.Td>
                      <Table.Td>{row.count}</Table.Td>
                      <Table.Td>₹{row.avg_package?.toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {data.stats?.branch_wise?.length > 0 && (
            <Card shadow="xs" padding="lg" radius="md" withBorder mb="xl">
              <Text fw={600} mb="sm">Department-wise Placements</Text>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Department</Table.Th>
                    <Table.Th>Students Placed</Table.Th>
                    <Table.Th>Avg Package (LPA)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.stats.branch_wise.map((row, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={500}>{row.department || "N/A"}</Table.Td>
                      <Table.Td>{row.count}</Table.Td>
                      <Table.Td>₹{row.avg_package?.toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}
        </>
      )}

      <Divider my="xl" label="All Offers" />

      <Group mb="md">
        <Select
          placeholder="Filter Offers"
          data={[
            { value: "", label: "All" },
            { value: "PENDING", label: "Pending" },
            { value: "ACCEPTED", label: "Accepted" },
            { value: "REJECTED", label: "Rejected" },
            { value: "EXPIRED", label: "Expired" },
          ]}
          value={offersFilter}
          onChange={setOffersFilter}
          clearable
          w={200}
        />
        <Badge variant="light" size="lg">{allOffers.length} offers</Badge>
      </Group>

      {allOffers.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student</Table.Th>
              <Table.Th>Roll No</Table.Th>
              <Table.Th>Company</Table.Th>
              <Table.Th>Position</Table.Th>
              <Table.Th>CTC Offered</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Deadline</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {allOffers.map((offer) => (
              <Table.Tr key={offer.id}>
                <Table.Td>{offer.student_name}</Table.Td>
                <Table.Td>{offer.student_roll}</Table.Td>
                <Table.Td>{offer.company_name}</Table.Td>
                <Table.Td>{offer.job_title}</Table.Td>
                <Table.Td>₹{offer.ctc_offered} LPA</Table.Td>
                <Table.Td>
                  <Badge
                    color={offer.status === "ACCEPTED" ? "green" : offer.status === "PENDING" ? "yellow" : offer.status === "EXPIRED" ? "red" : "gray"}
                    variant="light"
                  >
                    {offer.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{offer.response_deadline ? new Date(offer.response_deadline).toLocaleDateString("en-IN") : "-"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="md">No offers found.</Text>
      )}
    </div>
  );
}
