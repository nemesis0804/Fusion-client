import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Group, Badge } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { placementApi } from "../services/api";

function formatTimeLeft(ms) {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function OfferDetailPage() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await placementApi.getOfferDetail(offerId);
        setOffer(response.data);
        setLoading(false);
        if (response.data && response.data.response_deadline) {
          const deadline = new Date(response.data.response_deadline).getTime();
          setTimeLeft(deadline - Date.now());
        }
      } catch (err) {
        notifications.show({
          title: "Error",
          message: "Failed to fetch offer details.",
          color: "red",
        });
        setLoading(false);
      }
    };
    fetchOffer();
    // eslint-disable-next-line
  }, [offerId]);

  useEffect(() => {
    if (!offer || !offer.response_deadline) return;
    const interval = setInterval(() => {
      const deadline = new Date(offer.response_deadline).getTime();
      setTimeLeft(deadline - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [offer]);

  const handleAction = async (action) => {
    try {
      const response = await placementApi.respondToOffer(offerId, action);
      if (response.status === 200) {
        notifications.show({
          title: "Success",
          message: `Offer ${action.toLowerCase()}ed successfully!`,
          color: "green",
        });
        navigate("/placement-cell");
      } else {
        notifications.show({
          title: "Error",
          message: response.data?.detail || "Failed to update offer.",
          color: "red",
        });
      }
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.detail || "Failed to update offer.",
        color: "red",
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!offer) return <div>Offer not found.</div>;

  return (
    <Card shadow="md" padding="xl" radius="md" style={{ maxWidth: 500, margin: "40px auto" }}>
      <Title order={2} mb="md">Offer Details</Title>
      <Text><strong>Company:</strong> {offer.company_name}</Text>
      <Text><strong>Role:</strong> {offer.role}</Text>
      <Text><strong>Package:</strong> {offer.ctc} LPA</Text>
      <Text><strong>Status:</strong> <Badge color={offer.invitation === "PENDING" ? "yellow" : offer.invitation === "ACCEPTED" ? "green" : "red"}>{offer.invitation}</Badge></Text>
      <Text mt="md" color={timeLeft > 0 ? "blue" : "red"}><strong>Time left to respond:</strong> {formatTimeLeft(timeLeft)}</Text>
      <Group mt="xl" position="right">
        {offer.invitation === "PENDING" && timeLeft > 0 && (
          <>
            <Button color="green" onClick={() => handleAction("ACCEPTED")}>Accept</Button>
            <Button color="red" onClick={() => handleAction("REJECTED")}>Decline</Button>
          </>
        )}
      </Group>
    </Card>
  );
}
