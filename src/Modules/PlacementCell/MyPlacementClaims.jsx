/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Tabs,
  ActionIcon,
  Tooltip,
  Loader,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBriefcase,
  IconSchool,
  IconPlus,
  IconTrash,
  IconExternalLink,
  IconCircleCheck,
  IconClock,
  IconBan,
} from "@tabler/icons-react";
import { apiGet, apiPost, apiDelete } from "./api.js";
import { placementClaimsRoute } from "../../routes/placementCellRoutes/index.jsx";

const KIND_META = {
  PLACEMENT: {
    label: "Placement",
    icon: IconBriefcase,
    description: "Full-time job offer (CTC in LPA)",
    compensationLabel: "CTC (₹ LPA)",
    compensationSuffix: " LPA",
  },
  INTERNSHIP: {
    label: "Internship",
    icon: IconSchool,
    description: "Internship offer (stipend in ₹/month)",
    compensationLabel: "Stipend (₹ / month)",
    compensationSuffix: "/month",
  },
};

const STATUS_META = {
  PENDING: { color: "yellow", label: "Pending verification", icon: IconClock },
  VERIFIED: { color: "green", label: "Verified", icon: IconCircleCheck },
  REJECTED: { color: "red", label: "Rejected", icon: IconBan },
};

const SOURCE_OPTIONS = [
  { value: "OFFCAMPUS", label: "Off-campus" },
  { value: "ONCAMPUS", label: "On-campus / Through PCMS" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

const formatCompensation = (claim) => {
  const meta = KIND_META[claim.kind] || KIND_META.PLACEMENT;
  if (
    claim.compensation_amount === null ||
    claim.compensation_amount === undefined ||
    claim.compensation_amount === ""
  ) {
    return "—";
  }
  const n = Number(claim.compensation_amount);
  if (!Number.isFinite(n)) return claim.compensation_amount;
  if (claim.kind === "INTERNSHIP") {
    return `₹${n.toLocaleString("en-IN")}/month${
      claim.duration_months ? ` × ${claim.duration_months} mo` : ""
    }`;
  }
  return `₹${n}${meta.compensationSuffix}`;
};

function ClaimModal({ opened, onClose, kind, onSubmit }) {
  const meta = KIND_META[kind] || KIND_META.PLACEMENT;
  const blank = {
    company_name: "",
    role_title: "",
    location: "",
    compensation_amount: "",
    duration_months: "",
    start_date: "",
    end_date: "",
    source: "OFFCAMPUS",
    proof_link: "",
    notes: "",
  };
  const [data, setData] = useState(blank);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened) setData(blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, kind]);

  const set = (patch) => setData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!data.company_name.trim()) {
      notifications.show({
        title: "Missing field",
        message: "Company name is required.",
        color: "red",
      });
      return;
    }
    if (data.proof_link && !/^https?:\/\//i.test(data.proof_link.trim())) {
      notifications.show({
        title: "Invalid link",
        message: "Proof link must start with http:// or https://",
        color: "red",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        kind,
        company_name: data.company_name.trim(),
        role_title: data.role_title.trim() || null,
        location: data.location.trim() || null,
        compensation_amount:
          data.compensation_amount === "" ? null : data.compensation_amount,
        duration_months:
          kind === "INTERNSHIP" && data.duration_months !== ""
            ? data.duration_months
            : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        source: data.source,
        proof_link: data.proof_link.trim() || null,
        notes: data.notes.trim() || null,
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Submit ${meta.label} Claim`}
      size="lg"
      centered
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Submit your {meta.label.toLowerCase()} for verification by the
          Training & Placement Office. Once verified by the TPO it will be
          recorded against your profile.
        </Text>
        <Group grow>
          <TextInput
            label="Company"
            required
            value={data.company_name}
            onChange={(e) => set({ company_name: e.target.value })}
          />
          <TextInput
            label="Role / Designation"
            value={data.role_title}
            onChange={(e) => set({ role_title: e.target.value })}
          />
        </Group>
        <Group grow>
          <TextInput
            label="Location"
            value={data.location}
            onChange={(e) => set({ location: e.target.value })}
          />
          <Select
            label="Source"
            data={SOURCE_OPTIONS}
            value={data.source}
            onChange={(v) => set({ source: v || "OFFCAMPUS" })}
          />
        </Group>
        <Group grow>
          <NumberInput
            label={meta.compensationLabel}
            value={data.compensation_amount}
            onChange={(v) => set({ compensation_amount: v })}
            min={0}
            decimalScale={2}
            thousandSeparator={kind === "INTERNSHIP" ? "," : false}
          />
          {kind === "INTERNSHIP" && (
            <NumberInput
              label="Duration (months)"
              value={data.duration_months}
              onChange={(v) => set({ duration_months: v })}
              min={1}
              max={24}
            />
          )}
        </Group>
        <Group grow>
          <TextInput
            label={kind === "INTERNSHIP" ? "Start date" : "Joining date"}
            type="date"
            value={data.start_date}
            onChange={(e) => set({ start_date: e.target.value })}
          />
          {kind === "INTERNSHIP" && (
            <TextInput
              label="End date"
              type="date"
              value={data.end_date}
              onChange={(e) => set({ end_date: e.target.value })}
            />
          )}
        </Group>
        <TextInput
          label="Proof Link (optional)"
          placeholder="Drive link to offer letter / mail screenshot"
          value={data.proof_link}
          onChange={(e) => set({ proof_link: e.target.value })}
        />
        <Textarea
          label="Notes for TPO (optional)"
          autosize
          minRows={2}
          value={data.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
        <Button onClick={handleSubmit} loading={submitting} fullWidth>
          Submit for verification
        </Button>
      </Stack>
    </Modal>
  );
}

function ClaimRow({ claim, onWithdraw }) {
  const KindIcon = (KIND_META[claim.kind] || {}).icon || IconBriefcase;
  const status = STATUS_META[claim.status] || STATUS_META.PENDING;
  return (
    <Card withBorder shadow="xs" radius="md" p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <KindIcon size={20} />
          <Stack gap={2}>
            <Text fw={600} size="sm">
              {claim.company_name}
              {claim.role_title ? ` — ${claim.role_title}` : ""}
            </Text>
            <Group gap={6}>
              <Badge size="xs" variant="light" color={status.color}>
                {status.label}
              </Badge>
              <Badge size="xs" variant="outline">
                {KIND_META[claim.kind]?.label || claim.kind}
              </Badge>
              <Badge size="xs" variant="dot">
                {claim.source}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {formatCompensation(claim)}
              {claim.location ? ` • ${claim.location}` : ""}
            </Text>
            {claim.verification_remarks && (
              <Text size="xs" c="dimmed" fs="italic">
                TPO: {claim.verification_remarks}
              </Text>
            )}
          </Stack>
        </Group>
        <Group gap={4}>
          {claim.proof_link && (
            <Tooltip label="Open proof link">
              <ActionIcon
                variant="subtle"
                component="a"
                href={claim.proof_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {claim.status === "PENDING" && (
            <Tooltip label="Withdraw claim">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => onWithdraw(claim)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
    </Card>
  );
}

export default function MyPlacementClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState("PLACEMENT");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await apiGet(placementClaimsRoute);
      setClaims(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load placement claims.",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleSubmit = async (payload) => {
    try {
      await apiPost(placementClaimsRoute, payload);
      notifications.show({
        title: "Submitted",
        message:
          "Your claim has been sent for TPO verification. You'll see it marked verified once approved.",
        color: "green",
      });
      fetchClaims();
    } catch (err) {
      const data = err.response?.data;
      let msg = "Failed to submit claim.";
      if (data && typeof data === "object") {
        const parts = Object.entries(data).map(
          ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`,
        );
        if (parts.length) msg = parts.join(" | ");
      }
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const handleWithdraw = async (claim) => {
    if (
      !window.confirm(
        `Withdraw your ${claim.kind.toLowerCase()} claim for ${claim.company_name}?`,
      )
    ) {
      return;
    }
    try {
      await apiDelete(`${placementClaimsRoute}${claim.id}/`);
      notifications.show({
        title: "Withdrawn",
        message: "Claim removed.",
        color: "green",
      });
      fetchClaims();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to withdraw claim.",
        color: "red",
      });
    }
  };

  const placements = claims.filter((c) => c.kind === "PLACEMENT");
  const internships = claims.filter((c) => c.kind === "INTERNSHIP");
  const verifiedPlacement = placements.find((c) => c.status === "VERIFIED");
  const verifiedInternship = internships.find((c) => c.status === "VERIFIED");

  if (loading) {
    return (
      <Card withBorder p="lg" radius="md">
        <Loader size="sm" />
      </Card>
    );
  }

  const renderTabContent = (list, kind) => {
    const meta = KIND_META[kind];
    return (
      <Stack mt="md">
        <Group justify="space-between" wrap="wrap">
          <Text size="sm" c="dimmed">
            {meta.description}
          </Text>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => {
              setActiveKind(kind);
              setModalOpen(true);
            }}
          >
            Announce {meta.label}
          </Button>
        </Group>
        {list.length === 0 ? (
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" ta="center">
              You haven&apos;t submitted any {meta.label.toLowerCase()} claims
              yet.
            </Text>
          </Card>
        ) : (
          <Stack gap="sm">
            {list.map((c) => (
              <ClaimRow key={c.id} claim={c} onWithdraw={handleWithdraw} />
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Card bg="white" shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text size="lg" fw={600}>
          Placement & Internship Status
        </Text>
        <Group gap={4}>
          {verifiedPlacement && (
            <Badge color="green" variant="filled">
              Placed
            </Badge>
          )}
          {verifiedInternship && (
            <Badge color="grape" variant="filled">
              Interning
            </Badge>
          )}
          {!verifiedPlacement && !verifiedInternship && (
            <Badge color="gray" variant="light">
              Not yet placed
            </Badge>
          )}
        </Group>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        Got a placement or internship offer (on-campus or off-campus)? Submit it
        here so the TPO can verify and update your status. Once verified you
        will not be able to apply for further postings of the same kind unless
        the TPO grants you an override.
      </Text>

      <Divider mb="sm" />

      <Tabs value={activeKind} onChange={(v) => v && setActiveKind(v)}>
        <Tabs.List>
          <Tabs.Tab value="PLACEMENT" leftSection={<IconBriefcase size={14} />}>
            Placements ({placements.length})
          </Tabs.Tab>
          <Tabs.Tab value="INTERNSHIP" leftSection={<IconSchool size={14} />}>
            Internships ({internships.length})
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="PLACEMENT">
          {renderTabContent(placements, "PLACEMENT")}
        </Tabs.Panel>
        <Tabs.Panel value="INTERNSHIP">
          {renderTabContent(internships, "INTERNSHIP")}
        </Tabs.Panel>
      </Tabs>

      <ClaimModal
        opened={modalOpen}
        kind={activeKind}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}
