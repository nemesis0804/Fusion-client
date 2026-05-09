import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { placementApi } from "../../services/api";

function StudentOffersTable() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true);
      try {
        const response = await placementApi.getMyOffers();
        setOffers(response.data.offers || []);
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Failed to load your offers.",
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    };
    loadOffers();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack>
      <Title order={2}>My Offers</Title>
      {offers.length ? (
        offers.map((offer) => (
          <Card key={offer.id} withBorder radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={700}>{offer.company_name}</Text>
                  <Text c="dimmed">{offer.role || "Role not specified"}</Text>
                </div>
                <Badge
                  color={
                    offer.status === "ACCEPTED"
                      ? "green"
                      : offer.status === "REJECTED"
                        ? "red"
                        : offer.status === "IGNORE"
                          ? "gray"
                          : "yellow"
                  }
                >
                  {offer.status}
                </Badge>
              </Group>
              <Text size="sm">Package: {offer.ctc} LPA</Text>
              <Text size="sm">
                Deadline:{" "}
                {offer.response_deadline
                  ? new Date(offer.response_deadline).toLocaleString()
                  : "Not available"}
              </Text>
              {offer.expired ? (
                <Alert color="red" variant="light">
                  This offer has expired.
                </Alert>
              ) : null}
              <Group>
                <Button
                  variant="light"
                  onClick={() => navigate(`/placement-cell/offer/${offer.id}`)}
                >
                  View Offer
                </Button>
              </Group>
            </Stack>
          </Card>
        ))
      ) : (
        <Alert color="yellow" title="No Offers">
          No offers have been issued to you yet.
        </Alert>
      )}
    </Stack>
  );
}

export default StudentOffersTable;
