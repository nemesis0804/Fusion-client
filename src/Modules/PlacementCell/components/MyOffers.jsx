/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Loader,
  Button,
  Stack,
  
  Modal
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost } from "../api";
import { jobOffersRoute } from "../../../routes/placementCellRoutes";

const STATUS_COLORS = {
  PENDING: "yellow",
  ACCEPTED: "green",
  REJECTED: "gray",
  EXPIRED: "red"
};

export default function MyOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOffer, setConfirmOffer] = useState(null);
  const [confirmAction, setConfirmAction] = useState("");

  const fetchOffers = async () => {
    try {
      const res = await apiGet(jobOffersRoute);
      setOffers(Array.isArray(res) ? res : res?.results || []);
    } catch {
      notifications.show({ title: "Error", message: "Failed to load offers", color: "red" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleRespond = async () => {
    try {
      await apiPost(`${jobOffersRoute}${confirmOffer.id}/respond/`, { action: confirmAction });
      notifications.show({
        title: "Success",
        message: `Offer ${confirmAction === "accept" ? "accepted" : "rejected"}!`,
        color: confirmAction === "accept" ? "green" : "gray"
      });
      setConfirmOffer(null);
      setConfirmAction("");
      fetchOffers();
    } catch (err) {
      notifications.show({ title: "Error", message: err.response?.data?.error || "Failed", color: "red" });
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}><Loader /></div>;

  return (
    <div>
      <Text fw={600} size="xl" mb="sm">My Offers</Text>
      <Text size="sm" c="dimmed" mb="lg">Manage your job offers</Text>

      {offers.length > 0 ? (
        <Stack gap="md">
          {offers.map((offer) => (
            <Card key={offer.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <div>
                  <Text fw={600} size="lg">{offer.company_name}</Text>
                  <Text size="sm" c="dimmed">{offer.job_title}</Text>
                </div>
                <Badge color={STATUS_COLORS[offer.status]} variant="light" size="lg">
                  {offer.status}
                </Badge>
              </Group>

              <Group gap="xl" my="sm">
                <div>
                  <Text size="xs" c="dimmed">CTC Offered</Text>
                  <Text fw={600}>₹{offer.ctc_offered} LPA</Text>
                </div>
                {offer.designation_offered && (
                  <div>
                    <Text size="xs" c="dimmed">Designation</Text>
                    <Text fw={500}>{offer.designation_offered}</Text>
                  </div>
                )}
                {offer.joining_date && (
                  <div>
                    <Text size="xs" c="dimmed">Joining Date</Text>
                    <Text fw={500}>{new Date(offer.joining_date).toLocaleDateString("en-IN")}</Text>
                  </div>
                )}
                <div>
                  <Text size="xs" c="dimmed">Extended On</Text>
                  <Text fw={500}>{new Date(offer.extended_at).toLocaleDateString("en-IN")}</Text>
                </div>
                {offer.response_deadline && (
                  <div>
                    <Text size="xs" c="dimmed">Response Deadline</Text>
                    <Text fw={500}>{new Date(offer.response_deadline).toLocaleString("en-IN")}</Text>
                  </div>
                )}
              </Group>

              {offer.status === "PENDING" && (
                <Group mt="sm">
                  <Button
                    color="green"
                    onClick={() => { setConfirmOffer(offer); setConfirmAction("accept"); }}
                  >
                    ✓ Accept Offer
                  </Button>
                  <Button
                    color="red"
                    variant="outline"
                    onClick={() => { setConfirmOffer(offer); setConfirmAction("reject"); }}
                  >
                    ✗ Reject Offer
                  </Button>
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      ) : (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">You have no job offers at the moment.</Text>
        </Card>
      )}

      <Modal
        opened={!!confirmOffer}
        onClose={() => { setConfirmOffer(null); setConfirmAction(""); }}
        title={`Confirm ${confirmAction === "accept" ? "Accept" : "Reject"}`}
        centered
        size="sm"
      >
        <Text mb="md">
          Are you sure you want to <strong>{confirmAction}</strong> the offer from{" "}
          <strong>{confirmOffer?.company_name}</strong>?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmOffer(null)}>Cancel</Button>
          <Button
            color={confirmAction === "accept" ? "green" : "red"}
            onClick={handleRespond}
          >
            {confirmAction === "accept" ? "Accept" : "Reject"}
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
