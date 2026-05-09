import React, { useState, useEffect } from "react";
import {
  TextInput,
  Textarea,
  Title,
  Button,
  FileInput,
  Group,
  Notification,
  Container,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { MantineReactTable } from "mantine-react-table";
import { placementApi } from "../../services/api";
import { showApiError } from "../../utils/authorization";

function CompanyRegistrationForm() {
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [modalOpened, setModalOpened] = useState(false);

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
          setCompanies(response.data);
        }
      } catch (err) {
        showApiError({
          error: err,
          title: "Failed to fetch data",
          fallback: "Failed to fetch companies list",
          authorizationFallback:
            "Only placement officer users can load company registrations.",
        });
        console.error(err);
      }
    };
    fetchRegistrationData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!companyName || !description || !address || !website) {
      setError("Please fill all required fields.");
      return;
    }

    const newRegistration = {
      companyName,
      description,
      address,
      website,
      logo,
    };

    try {
      const response =
        await placementApi.createCompanyRegistration(newRegistration);

      if (response.status === 200) {
        notifications.show({
          title: "Success",
          message: "Successfully added!",
          color: "green",
          position: "top-center",
        });

        const addedCompany = {
          companyName: newRegistration.companyName,
          description: newRegistration.description,
          address: newRegistration.address,
          website: newRegistration.website,
          logo: newRegistration.logo,
          ...response.data,
        };

        setCompanies([...companies, addedCompany]);
        setModalOpened(false);
        setCompanyName("");
        setDescription("");
        setAddress("");
        setWebsite("");
        setLogo(null);
      } else {
        notifications.show({
          title: "Failed",
          message: `Failed to add`,
          color: "red",
          position: "top-center",
        });
      }
    } catch (err) {
      console.error("Error adding company:", err);
      showApiError({
        error: err,
        fallback: "Failed to add company.",
        authorizationFallback:
          "Only placement officer users can create company registrations.",
      });
    }
  };

  const columns = [
    { accessorKey: "companyName", header: "Company Name" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "website", header: "Website" },
  ];

  return (
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
        <Title order={2}>Registered Companies</Title>
        <Group position="right">
          <Button
            variant="outline"
            style={{ marginLeft: "auto", marginRight: 0 }}
            onClick={() => setModalOpened(true)}
          >
            Register New Company
          </Button>
        </Group>
      </Container>
      <MantineReactTable columns={columns} data={companies} />

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        centered
        size="lg"
      >
        <Title order={3} mb={32}>
          Register New Comapny
        </Title>

        {error && (
          <Notification color="red" onClose={() => setError("")}>
            {error}
          </Notification>
        )}

        <form onSubmit={handleSubmit}>
          <TextInput
            label="Company Name"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            mb={8}
          />
          <Textarea
            label="Company Description"
            placeholder="Enter a brief description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            mb={8}
          />
          <TextInput
            label="Company Address"
            placeholder="Enter company address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            mb={8}
          />
          <TextInput
            label="Website URL"
            placeholder="Enter website URL"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
            mb={8}
          />
          <FileInput
            label="Company Logo"
            value={logo}
            onChange={setLogo}
            placeholder="Upload logo"
            accept="image/*"
            mb={8}
          />
          <Group position="right" mt="md">
            <Button type="submit">Register Company</Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
}

export default CompanyRegistrationForm;
