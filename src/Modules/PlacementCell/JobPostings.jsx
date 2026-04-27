/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Grid,
  Text,
  Badge,
  Group,
  Loader,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  MultiSelect,
  Stack,
  Table,
  Divider,
  Pagination,
  Switch,
  ActionIcon,
  Checkbox,
  Radio,
  Paper,
  Tabs,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "./api.js";
import {
  jobPostingsRoute,
  companiesRoute,
  studentResumesRoute,
  eligibilityOptionsRoute,
} from "../../routes/placementCellRoutes/index.jsx";

// ---------------------------------------------------------------------------
// Field-type metadata for the dynamic form builder
// ---------------------------------------------------------------------------
const FIELD_TYPES = [
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "LONG_ANSWER", label: "Long Answer" },
  { value: "NUMBER", label: "Number" },
  { value: "SINGLE_CHOICE", label: "Multiple Choice (single)" },
  { value: "MULTI_CHOICE", label: "Checkboxes (multi-select)" },
];

const isChoiceType = (t) => t === "SINGLE_CHOICE" || t === "MULTI_CHOICE";

const blankField = (order = 0) => ({
  _key: Math.random().toString(36).slice(2),
  label: "",
  help_text: "",
  field_type: "SHORT_ANSWER",
  is_required: false,
  order,
  min_value: null,
  max_value: null,
  max_length: null,
  options: [],
});

const blankRole = (order = 0) => ({
  _key: Math.random().toString(36).slice(2),
  title: "",
  description: "",
  seats: 0,
  ctc: null,
  compensation_type: null, // null => inherit from posting
  internship_duration_months: null,
  order,
  form_fields: [],
});

// ---------------------------------------------------------------------------
// Compensation formatting helpers
// ---------------------------------------------------------------------------
const COMPENSATION_TYPES = [
  { value: "LPA", label: "Annual CTC (₹ LPA)" },
  { value: "STIPEND_PER_MONTH", label: "Stipend (₹ per month)" },
];

/**
 * Format an amount according to the compensation type.
 *  - LPA              -> "₹6 LPA"
 *  - STIPEND_PER_MONTH -> "₹40,000 / month"
 * Falls back to LPA when type is missing.
 */
const formatCompensation = (
  amount,
  compensationType = "LPA",
  durationMonths = null,
) => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  const num = Number.isFinite(n) ? n : null;
  if (num === null) return String(amount);
  if (compensationType === "STIPEND_PER_MONTH") {
    const formatted = num.toLocaleString("en-IN");
    const suffix = durationMonths ? ` × ${durationMonths} mo` : "";
    return `₹${formatted}/month${suffix}`;
  }
  return `₹${num} LPA`;
};

const compensationLabel = (compensationType = "LPA") =>
  compensationType === "STIPEND_PER_MONTH"
    ? "Stipend (₹ per month)"
    : "CTC (₹ LPA)";

const compensationShortLabel = (compensationType = "LPA") =>
  compensationType === "STIPEND_PER_MONTH" ? "Stipend" : "CTC";

// ---------------------------------------------------------------------------
// Job card (listing)
// ---------------------------------------------------------------------------
function JobCard({ posting, onViewDetail }) {
  const isActive = posting.is_active;
  const deadline = posting.application_deadline
    ? new Date(posting.application_deadline)
    : null;
  const deadlinePassed = deadline && deadline < new Date();
  const roleTitles = posting.role_titles || [];

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text
          fw={600}
          size="lg"
          style={{ cursor: "pointer" }}
          onClick={() => onViewDetail(posting)}
        >
          {posting.title}
        </Text>
        <Group gap={4}>
          {isActive && !deadlinePassed && (
            <Badge color="green" variant="light">
              Active
            </Badge>
          )}
          {deadlinePassed && (
            <Badge color="red" variant="light">
              Deadline Passed
            </Badge>
          )}
          {!isActive && (
            <Badge color="gray" variant="light">
              Inactive
            </Badge>
          )}
          <Badge variant="outline" color="violet">
            {posting.job_type}
          </Badge>
        </Group>
      </Group>

      <Text size="sm" c="dimmed" mb="xs">
        {posting.company_name}
        {posting.location && ` • ${posting.location}`}
      </Text>

      {roleTitles.length > 0 && (
        <Group gap={4} mb="xs">
          {roleTitles.slice(0, 4).map((rt) => (
            <Badge key={rt} size="sm" variant="dot">
              {rt}
            </Badge>
          ))}
          {roleTitles.length > 4 && (
            <Badge size="sm" variant="light">
              +{roleTitles.length - 4}
            </Badge>
          )}
        </Group>
      )}

      <Group gap="lg" mb="sm">
        <div>
          <Text size="xs" c="dimmed">
            {compensationShortLabel(posting.compensation_type)}
          </Text>
          <Text size="sm" fw={600}>
            {formatCompensation(
              posting.ctc,
              posting.compensation_type,
              posting.internship_duration_months,
            )}
          </Text>
        </div>
        {posting.job_type === "INTERNSHIP" &&
          posting.internship_duration_months && (
            <div>
              <Text size="xs" c="dimmed">
                Duration
              </Text>
              <Text size="sm" fw={500}>
                {posting.internship_duration_months} months
              </Text>
            </div>
          )}
        {deadline && (
          <div>
            <Text size="xs" c="dimmed">
              Deadline
            </Text>
            <Text size="sm" fw={500}>
              {deadline.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </div>
        )}
        {posting.total_applications !== undefined && (
          <div>
            <Text size="xs" c="dimmed">
              Applications
            </Text>
            <Text size="sm" fw={500}>
              {posting.total_applications}
            </Text>
          </div>
        )}
      </Group>

      <Group>
        <Button size="xs" variant="light" onClick={() => onViewDetail(posting)}>
          View Details
        </Button>
        {posting.jd_link && (
          <Button
            size="xs"
            variant="subtle"
            component="a"
            href={posting.jd_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            JD ↗
          </Button>
        )}
      </Group>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dynamic field renderer (read-only preview / live application form)
// ---------------------------------------------------------------------------
function DynamicField({ field, value, onChange, disabled }) {
  switch (field.field_type) {
    case "SHORT_ANSWER":
      return (
        <TextInput
          label={field.label}
          description={field.help_text}
          required={field.is_required}
          maxLength={field.max_length || undefined}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "LONG_ANSWER":
      return (
        <Textarea
          label={field.label}
          description={field.help_text}
          required={field.is_required}
          maxLength={field.max_length || undefined}
          minRows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "NUMBER":
      return (
        <NumberInput
          label={field.label}
          description={field.help_text}
          required={field.is_required}
          min={field.min_value ?? undefined}
          max={field.max_value ?? undefined}
          value={value ?? ""}
          onChange={(v) => onChange(v)}
          disabled={disabled}
        />
      );
    case "SINGLE_CHOICE":
      return (
        <Radio.Group
          label={field.label}
          description={field.help_text}
          required={field.is_required}
          value={value ?? ""}
          onChange={onChange}
        >
          <Stack gap={6} mt={6}>
            {(field.options || []).map((opt) => (
              <Radio
                key={opt.id || opt._key || opt.label}
                value={opt.value || opt.label}
                label={opt.label}
                disabled={disabled}
              />
            ))}
          </Stack>
        </Radio.Group>
      );
    case "MULTI_CHOICE":
      return (
        <Checkbox.Group
          label={field.label}
          description={field.help_text}
          required={field.is_required}
          value={value || []}
          onChange={onChange}
        >
          <Stack gap={6} mt={6}>
            {(field.options || []).map((opt) => (
              <Checkbox
                key={opt.id || opt._key || opt.label}
                value={opt.value || opt.label}
                label={opt.label}
                disabled={disabled}
              />
            ))}
          </Stack>
        </Checkbox.Group>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Form builder (used inside CreateJobModal)
// ---------------------------------------------------------------------------
function FieldEditor({ field, onChange, onRemove, onMove }) {
  const setKey = (k, v) => onChange({ ...field, [k]: v });

  const setOptions = (opts) => onChange({ ...field, options: opts });
  const addOption = () =>
    setOptions([
      ...(field.options || []),
      {
        _key: Math.random().toString(36).slice(2),
        label: "",
        value: "",
        order: (field.options || []).length,
      },
    ]);
  const updateOption = (idx, patch) =>
    setOptions(
      (field.options || []).map((o, i) => (i === idx ? { ...o, ...patch } : o)),
    );
  const removeOption = (idx) =>
    setOptions((field.options || []).filter((_, i) => i !== idx));

  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm">
          {field.label || "Untitled field"}
        </Text>
        <Group gap={4}>
          {onMove && (
            <>
              <Tooltip label="Move up">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => onMove(-1)}
                >
                  ↑
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Move down">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => onMove(1)}
                >
                  ↓
                </ActionIcon>
              </Tooltip>
            </>
          )}
          <Button color="red" variant="subtle" size="xs" onClick={onRemove}>
            Remove
          </Button>
        </Group>
      </Group>

      <Stack gap="xs">
        <Group grow>
          <TextInput
            label="Question / Label"
            value={field.label}
            onChange={(e) => setKey("label", e.target.value)}
            required
          />
          <Select
            label="Field Type"
            data={FIELD_TYPES}
            value={field.field_type}
            onChange={(v) =>
              onChange({
                ...field,
                field_type: v,
                options: isChoiceType(v) ? field.options || [] : [],
              })
            }
          />
        </Group>
        <TextInput
          label="Help text (optional)"
          value={field.help_text || ""}
          onChange={(e) => setKey("help_text", e.target.value)}
        />
        <Group>
          <Switch
            label="Required"
            checked={field.is_required}
            onChange={(e) => setKey("is_required", e.currentTarget.checked)}
          />
          {(field.field_type === "SHORT_ANSWER" ||
            field.field_type === "LONG_ANSWER") && (
            <NumberInput
              label="Max length"
              value={field.max_length ?? ""}
              onChange={(v) => setKey("max_length", v || null)}
              min={1}
              w={140}
            />
          )}
          {field.field_type === "NUMBER" && (
            <>
              <NumberInput
                label="Min"
                value={field.min_value ?? ""}
                onChange={(v) =>
                  setKey("min_value", v === "" || v === null ? null : v)
                }
                w={120}
              />
              <NumberInput
                label="Max"
                value={field.max_value ?? ""}
                onChange={(v) =>
                  setKey("max_value", v === "" || v === null ? null : v)
                }
                w={120}
              />
            </>
          )}
        </Group>

        {isChoiceType(field.field_type) && (
          <Stack gap={6}>
            <Text size="xs" c="dimmed">
              Options
            </Text>
            {(field.options || []).map((opt, idx) => (
              <Group key={opt._key || idx} gap="xs">
                <TextInput
                  placeholder={`Option ${idx + 1}`}
                  value={opt.label}
                  onChange={(e) =>
                    updateOption(idx, {
                      label: e.target.value,
                      value: e.target.value,
                    })
                  }
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => removeOption(idx)}
                >
                  ✕
                </ActionIcon>
              </Group>
            ))}
            <Button size="xs" variant="light" onClick={addOption}>
              + Add option
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function FieldList({ fields, onChange, idPrefix }) {
  const updateAt = (idx, val) =>
    onChange(fields.map((f, i) => (i === idx ? val : f)));
  const removeAt = (idx) => onChange(fields.filter((_, i) => i !== idx));
  const moveAt = (idx, delta) => {
    const next = idx + delta;
    if (next < 0 || next >= fields.length) return;
    const arr = [...fields];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr.map((f, i) => ({ ...f, order: i })));
  };
  const add = () => onChange([...fields, blankField(fields.length)]);

  return (
    <Stack gap="sm">
      {fields.length === 0 && (
        <Text size="sm" c="dimmed">
          No fields yet. Click &quot;+ Add field&quot; to build the form.
        </Text>
      )}
      {fields.map((f, idx) => (
        <FieldEditor
          key={f._key || `${idPrefix}-${idx}`}
          field={f}
          onChange={(val) => updateAt(idx, val)}
          onRemove={() => removeAt(idx)}
          onMove={(delta) => moveAt(idx, delta)}
        />
      ))}
      <Button variant="light" onClick={add}>
        + Add field
      </Button>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// CreateJobModal — multi-step builder: metadata, roles, shared form
// ---------------------------------------------------------------------------
const blankFormData = () => ({
  company: "",
  title: "",
  description: "",
  job_type: "PLACEMENT",
  location: "",
  ctc: 0,
  compensation_type: "LPA",
  internship_duration_months: null,
  jd_link: "",
  min_cpi: 0,
  backlog_allowed: true,
  eligible_programmes: [],
  eligible_branches: [],
  eligible_batches: [],
  application_deadline: "",
  bond_details: "",
});

const splitCsv = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const toLocalDateTimeInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

function CreateJobModal({ opened, onClose, onSuccess, editingPosting }) {
  const isEdit = Boolean(editingPosting);
  const [companies, setCompanies] = useState([]);
  const [step, setStep] = useState("meta");
  const [formData, setFormData] = useState(blankFormData());
  const [roles, setRoles] = useState([blankRole(0)]);
  const [sharedFields, setSharedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eligibilityOptions, setEligibilityOptions] = useState({
    programmes: [],
    branches: [],
    batches: [],
  });

  useEffect(() => {
    if (opened) {
      apiGet(companiesRoute)
        .then((res) => {
          setCompanies(Array.isArray(res) ? res : res.results || []);
        })
        .catch(() => {});
      apiGet(eligibilityOptionsRoute)
        .then((res) => {
          setEligibilityOptions({
            programmes: res.programmes || [],
            branches: res.branches || [],
            batches: (res.batches || []).map((b) => String(b)),
          });
        })
        .catch(() => {});
    }
  }, [opened]);

  // Populate the form when editing an existing posting (or reset on close).
  useEffect(() => {
    if (!opened) return;
    setStep("meta");
    if (editingPosting) {
      // Hydrate the form with the full posting payload so the TPO can
      // tweak any field. Roles + shared form fields are also brought in.
      apiGet(`${jobPostingsRoute}${editingPosting.id}/`)
        .then((p) => {
          setFormData({
            company: p.company ? String(p.company) : "",
            title: p.title || "",
            description: p.description || "",
            job_type: p.job_type || "PLACEMENT",
            location: p.location || "",
            ctc: p.ctc ?? 0,
            compensation_type: p.compensation_type || "LPA",
            internship_duration_months: p.internship_duration_months ?? null,
            jd_link: p.jd_link || "",
            min_cpi: p.min_cpi ?? 0,
            backlog_allowed: !!p.backlog_allowed,
            eligible_programmes: splitCsv(p.eligible_programmes),
            eligible_branches: splitCsv(p.eligible_branches),
            eligible_batches: Array.isArray(p.eligible_batches)
              ? p.eligible_batches.map(String)
              : [],
            application_deadline: toLocalDateTimeInput(p.application_deadline),
            bond_details: p.bond_details || "",
          });
          const incomingRoles = (p.roles || []).map((r, idx) => ({
            _key: Math.random().toString(36).slice(2),
            title: r.title || "",
            description: r.description || "",
            seats: r.seats || 0,
            ctc: r.ctc ?? null,
            compensation_type: r.compensation_type || null,
            internship_duration_months: r.internship_duration_months ?? null,
            order: r.order ?? idx,
            form_fields: (r.form_fields || []).map((f) => ({
              ...f,
              options: f.options || [],
            })),
          }));
          setRoles(incomingRoles.length > 0 ? incomingRoles : [blankRole(0)]);
          setSharedFields(
            (p.form_fields || []).map((f) => ({
              ...f,
              options: f.options || [],
            })),
          );
        })
        .catch(() => {});
    } else {
      setFormData(blankFormData());
      setRoles([blankRole(0)]);
      setSharedFields([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editingPosting?.id]);

  const updateRole = (idx, patch) =>
    setRoles((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRole = (idx) => setRoles((rs) => rs.filter((_, i) => i !== idx));

  const addRole = () => setRoles((rs) => [...rs, blankRole(rs.length)]);

  const cleanFields = (fields) =>
    fields.map((f, idx) => ({
      label: f.label,
      help_text: f.help_text || "",
      field_type: f.field_type,
      is_required: !!f.is_required,
      order: idx,
      min_value: f.min_value,
      max_value: f.max_value,
      max_length: f.max_length,
      options: isChoiceType(f.field_type)
        ? (f.options || [])
            .filter((o) => o.label && o.label.trim())
            .map((o, oi) => ({
              label: o.label,
              value: o.value || o.label,
              order: oi,
            }))
        : [],
    }));

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.company ||
      !formData.title ||
      !formData.application_deadline ||
      !formData.description ||
      !String(formData.description).trim()
    ) {
      notifications.show({
        title: "Missing fields",
        message: "Company, title, description and deadline are required.",
        color: "red",
      });
      return;
    }
    const cleanedRoles = roles
      .filter((r) => r.title && r.title.trim())
      .map((r, idx) => ({
        title: r.title,
        description: r.description || "",
        seats: r.seats || 0,
        ctc: r.ctc || null,
        compensation_type: r.compensation_type || null,
        internship_duration_months: r.internship_duration_months || null,
        order: idx,
        form_fields: cleanFields(r.form_fields || []),
      }));
    if (cleanedRoles.length === 0) {
      notifications.show({
        title: "Missing roles",
        message: "Add at least one job role/title.",
        color: "red",
      });
      return;
    }
    const payload = {
      ...formData,
      // Drop empty optional URL field so the backend's URLField validator
      // doesn't reject empty strings.
      jd_link: formData.jd_link?.trim() ? formData.jd_link.trim() : null,
      // Only include duration when relevant — backend column is nullable.
      internship_duration_months:
        formData.compensation_type === "STIPEND_PER_MONTH" ||
        formData.job_type === "INTERNSHIP"
          ? formData.internship_duration_months || null
          : null,
      // Eligibility — backend stores programmes/branches as comma-separated
      // text and batches as a JSON list of integers.
      eligible_programmes: Array.isArray(formData.eligible_programmes)
        ? formData.eligible_programmes.join(",")
        : formData.eligible_programmes || "",
      eligible_branches: Array.isArray(formData.eligible_branches)
        ? formData.eligible_branches.join(",")
        : formData.eligible_branches || "",
      eligible_batches: Array.isArray(formData.eligible_batches)
        ? formData.eligible_batches
            .map((b) => parseInt(b, 10))
            .filter((b) => !Number.isNaN(b))
        : [],
      roles: cleanedRoles,
      form_fields: cleanFields(sharedFields),
    };

    setLoading(true);
    try {
      if (isEdit) {
        await apiPut(`${jobPostingsRoute}${editingPosting.id}/`, payload);
      } else {
        await apiPost(jobPostingsRoute, payload);
      }
      notifications.show({
        title: "Success",
        message: isEdit ? "Job posting updated" : "Job posting created",
        color: "green",
      });
      onSuccess();
      onClose();
      // reset
      setStep("meta");
      setRoles([blankRole(0)]);
      setSharedFields([]);
    } catch (err) {
      const data = err.response?.data;
      let msg = isEdit
        ? "Failed to update posting"
        : "Failed to create posting";
      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.error) {
          msg = data.error;
        } else if (typeof data === "object") {
          // Show first field-level validation error
          const parts = [];
          Object.entries(data).forEach(([field, val]) => {
            const text = Array.isArray(val) ? val.join(", ") : String(val);
            parts.push(`${field}: ${text}`);
          });
          if (parts.length) msg = parts.join(" | ");
        }
      }
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Edit Job Posting" : "Create Job Posting"}
      size="xl"
      centered
    >
      <Tabs value={step} onChange={setStep} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="meta">1. Job Details</Tabs.Tab>
          <Tabs.Tab value="roles">2. Roles & Role Forms</Tabs.Tab>
          <Tabs.Tab value="shared">3. Shared Form</Tabs.Tab>
        </Tabs.List>

        {/* Step 1: metadata */}
        <Tabs.Panel value="meta" pt="md">
          <Stack>
            <Group grow>
              <Select
                label="Company"
                required
                data={companies.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
                value={formData.company}
                onChange={(val) => setFormData({ ...formData, company: val })}
                searchable
              />
              <TextInput
                label="Posting Title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </Group>
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
            <Group grow>
              <Select
                label="Job Type"
                data={["PLACEMENT", "INTERNSHIP", "PPO", "PBI"]}
                value={formData.job_type}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    job_type: val,
                    // Smart default: switching to INTERNSHIP defaults to a
                    // monthly stipend; switching back defaults to LPA.
                    compensation_type:
                      val === "INTERNSHIP" ? "STIPEND_PER_MONTH" : "LPA",
                  }))
                }
              />
              <TextInput
                label="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
              <Select
                label="Compensation Type"
                data={COMPENSATION_TYPES}
                value={formData.compensation_type}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    compensation_type: val || "LPA",
                  })
                }
              />
            </Group>
            <Group grow>
              <NumberInput
                label={compensationLabel(formData.compensation_type)}
                required
                value={formData.ctc}
                onChange={(val) => setFormData({ ...formData, ctc: val })}
                min={0}
                decimalScale={2}
                thousandSeparator={
                  formData.compensation_type === "STIPEND_PER_MONTH"
                    ? ","
                    : false
                }
              />
              {(formData.compensation_type === "STIPEND_PER_MONTH" ||
                formData.job_type === "INTERNSHIP") && (
                <NumberInput
                  label="Internship duration (months)"
                  placeholder="e.g. 2"
                  value={formData.internship_duration_months ?? ""}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      internship_duration_months:
                        val === "" || val === null ? null : val,
                    })
                  }
                  min={1}
                  max={24}
                />
              )}
              <TextInput
                label="JD Link (optional)"
                placeholder="https://…"
                value={formData.jd_link}
                onChange={(e) =>
                  setFormData({ ...formData, jd_link: e.target.value })
                }
              />
            </Group>

            <Divider label="Eligibility Criteria" />

            <Group grow>
              <NumberInput
                label="Min CPI"
                value={formData.min_cpi}
                onChange={(val) => setFormData({ ...formData, min_cpi: val })}
                min={0}
                max={10}
                decimalScale={1}
              />
              <Switch
                label="Backlog Allowed"
                checked={formData.backlog_allowed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    backlog_allowed: e.currentTarget.checked,
                  })
                }
                mt={24}
              />
            </Group>
            <Group grow>
              <MultiSelect
                label="Eligible Programmes"
                placeholder="Leave empty for all programmes"
                data={eligibilityOptions.programmes}
                value={formData.eligible_programmes}
                onChange={(val) =>
                  setFormData({ ...formData, eligible_programmes: val })
                }
                searchable
                clearable
              />
              <MultiSelect
                label="Eligible Branches"
                placeholder="Leave empty for all branches"
                data={eligibilityOptions.branches}
                value={formData.eligible_branches}
                onChange={(val) =>
                  setFormData({ ...formData, eligible_branches: val })
                }
                searchable
                clearable
              />
            </Group>
            <MultiSelect
              label="Eligible Batches"
              placeholder="Leave empty for all batches (e.g. 2023, 2024)"
              data={eligibilityOptions.batches}
              value={formData.eligible_batches}
              onChange={(val) =>
                setFormData({ ...formData, eligible_batches: val })
              }
              searchable
              clearable
            />
            <Group grow>
              <TextInput
                label="Application Deadline"
                type="datetime-local"
                required
                value={formData.application_deadline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    application_deadline: e.target.value,
                  })
                }
              />
              <TextInput
                label="Bond Details"
                value={formData.bond_details}
                onChange={(e) =>
                  setFormData({ ...formData, bond_details: e.target.value })
                }
              />
            </Group>
            <Group justify="flex-end">
              <Button onClick={() => setStep("roles")}>Next: Roles →</Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        {/* Step 2: roles */}
        <Tabs.Panel value="roles" pt="md">
          <Stack>
            <Text size="sm" c="dimmed">
              Add one or more job titles/roles for this posting (e.g. SDE, Data
              Analyst, ML Engineer). Each role can optionally have its own form
              fields (in addition to shared fields).
            </Text>
            {roles.map((role, idx) => (
              <Paper key={role._key} withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={600}>Role #{idx + 1}</Text>
                  {roles.length > 1 && (
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => removeRole(idx)}
                    >
                      Remove role
                    </Button>
                  )}
                </Group>
                <Stack gap="xs">
                  <Group grow>
                    <TextInput
                      label="Role Title"
                      required
                      value={role.title}
                      onChange={(e) =>
                        updateRole(idx, { title: e.target.value })
                      }
                    />
                    <NumberInput
                      label="Seats (0 = unspecified)"
                      value={role.seats}
                      onChange={(v) => updateRole(idx, { seats: v || 0 })}
                      min={0}
                    />
                  </Group>
                  <Group grow>
                    <Select
                      label="Compensation Type (override)"
                      placeholder="Inherit from posting"
                      data={[
                        { value: "", label: "Inherit from posting" },
                        ...COMPENSATION_TYPES,
                      ]}
                      value={role.compensation_type || ""}
                      onChange={(v) =>
                        updateRole(idx, { compensation_type: v || null })
                      }
                      clearable
                    />
                    <NumberInput
                      label={(() => {
                        const effective =
                          role.compensation_type ||
                          formData.compensation_type ||
                          "LPA";
                        return `Role ${compensationShortLabel(effective)} (optional)`;
                      })()}
                      value={role.ctc ?? ""}
                      onChange={(v) =>
                        updateRole(idx, {
                          ctc: v === "" || v === null ? null : v,
                        })
                      }
                      min={0}
                      decimalScale={2}
                    />
                    {(() => {
                      const effective =
                        role.compensation_type ||
                        formData.compensation_type ||
                        "LPA";
                      if (
                        effective === "STIPEND_PER_MONTH" ||
                        formData.job_type === "INTERNSHIP"
                      ) {
                        return (
                          <NumberInput
                            label="Duration (months, optional)"
                            value={role.internship_duration_months ?? ""}
                            onChange={(v) =>
                              updateRole(idx, {
                                internship_duration_months:
                                  v === "" || v === null ? null : v,
                              })
                            }
                            min={1}
                            max={24}
                          />
                        );
                      }
                      return null;
                    })()}
                  </Group>
                  <Textarea
                    label="Role Description"
                    rows={2}
                    value={role.description || ""}
                    onChange={(e) =>
                      updateRole(idx, { description: e.target.value })
                    }
                  />
                  <Divider label="Role-specific form fields" />
                  <FieldList
                    idPrefix={`role-${idx}`}
                    fields={role.form_fields || []}
                    onChange={(next) => updateRole(idx, { form_fields: next })}
                  />
                </Stack>
              </Paper>
            ))}
            <Button variant="light" onClick={addRole}>
              + Add role
            </Button>
            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep("meta")}>
                ← Back
              </Button>
              <Button onClick={() => setStep("shared")}>
                Next: Shared Form →
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        {/* Step 3: shared form */}
        <Tabs.Panel value="shared" pt="md">
          <Stack>
            <Text size="sm" c="dimmed">
              Shared form fields are shown to applicants for every role in this
              posting (in addition to role-specific fields).
            </Text>
            <FieldList
              idPrefix="shared"
              fields={sharedFields}
              onChange={setSharedFields}
            />
            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep("roles")}>
                ← Back
              </Button>
              <Button onClick={handleSubmit} loading={loading}>
                {isEdit ? "Save Changes" : "Create Job Posting"}
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ApplyForm — student dynamic form, role select, resume select
// ---------------------------------------------------------------------------
function ApplyForm({ posting, onClose, onApplied }) {
  const hasRoles = (posting.roles || []).length > 0;
  const [roleId, setRoleId] = useState(
    hasRoles ? String(posting.roles[0].id) : null,
  );
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet(studentResumesRoute)
      .then((res) => {
        const list = Array.isArray(res) ? res : res.results || [];
        setResumes(list);
        const def = list.find((r) => r.is_default);
        if (def) setResumeId(String(def.id));
        else if (list.length > 0) setResumeId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  const selectedRole = useMemo(
    () => (posting.roles || []).find((r) => String(r.id) === roleId) || null,
    [roleId, posting.roles],
  );

  const fields = useMemo(() => {
    const shared = posting.form_fields || [];
    const roleFields = selectedRole?.form_fields || [];
    return [...shared, ...roleFields];
  }, [posting.form_fields, selectedRole]);

  const handleSubmit = async () => {
    if (hasRoles && !roleId) {
      notifications.show({
        title: "Select role",
        message: "Please select a role to apply for.",
        color: "red",
      });
      return;
    }
    if (!resumeId) {
      notifications.show({
        title: "Resume required",
        message:
          "Please pick a resume from your profile (My Resumes tab) before applying.",
        color: "red",
      });
      return;
    }

    // Local validation: required fields
    const missingField = fields.find((f) => {
      if (!f.is_required) return false;
      const v = responses[f.id];
      return (
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0)
      );
    });
    if (missingField) {
      notifications.show({
        title: "Required field",
        message: `Please fill: ${missingField.label}`,
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        job_role: hasRoles ? Number(roleId) : null,
        selected_resume: resumeId ? Number(resumeId) : null,
        responses: fields
          .filter((f) => responses[f.id] !== undefined)
          .map((f) => ({ field: f.id, value: responses[f.id] })),
      };
      await apiPost(`${jobPostingsRoute}${posting.id}/apply/`, payload);
      notifications.show({
        title: "Applied",
        message: "Application submitted successfully.",
        color: "green",
      });
      onApplied?.();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to apply";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
    setSubmitting(false);
  };

  return (
    <Stack>
      {hasRoles && (
        <Select
          label="Select role"
          required
          data={posting.roles.map((r) => ({
            value: String(r.id),
            label: r.title,
          }))}
          value={roleId}
          onChange={setRoleId}
        />
      )}

      {resumes.length === 0 ? (
        <Card withBorder p="sm" bg="yellow.0">
          <Text size="sm">
            You have not added any resumes yet. Open the &quot;My Resumes&quot;
            tab to save one before applying.
          </Text>
        </Card>
      ) : (
        <Select
          label="Resume to submit"
          required
          data={resumes.map((r) => ({
            value: String(r.id),
            label: r.is_default ? `${r.name} (default)` : r.name,
          }))}
          value={resumeId}
          onChange={setResumeId}
        />
      )}

      {fields.length > 0 && <Divider label="Application questions" />}

      {fields.map((f) => (
        <DynamicField
          key={f.id}
          field={f}
          value={responses[f.id]}
          onChange={(v) => setResponses({ ...responses, [f.id]: v })}
        />
      ))}

      <Group justify="flex-end" mt="sm">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={submitting}>
          Submit Application
        </Button>
      </Group>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Job detail modal
// ---------------------------------------------------------------------------
function JobDetailModal({ posting, opened, onClose, role, onJobUpdate }) {
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [fullPosting, setFullPosting] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchFull = async () => {
    if (!posting?.id) return;
    try {
      const res = await apiGet(`${jobPostingsRoute}${posting.id}/`);
      setFullPosting(res);
    } catch {
      setFullPosting(null);
    }
  };

  const checkEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const res = await apiGet(
        `${jobPostingsRoute}${posting.id}/check_eligibility/`,
      );
      setEligibility(res);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to check eligibility",
        color: "red",
      });
    }
    setCheckingEligibility(false);
  };

  const handleToggleStatus = async () => {
    setUpdating(true);
    try {
      const newStatus = !posting.is_active;
      await apiPatch(`${jobPostingsRoute}${posting.id}/`, {
        is_active: newStatus,
      });
      notifications.show({
        title: "Success",
        message: `Job posting marked as ${newStatus ? "Active" : "Closed"}`,
        color: "green",
      });
      if (onJobUpdate) onJobUpdate();
      onClose();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.detail || "Failed to update status",
        color: "red",
      });
    }
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete job posting "${posting.title}"? This will also remove all linked applications and cannot be undone.`,
      )
    ) {
      return;
    }
    setUpdating(true);
    try {
      await apiDelete(`${jobPostingsRoute}${posting.id}/`);
      notifications.show({
        title: "Deleted",
        message: "Job posting removed.",
        color: "orange",
      });
      if (onJobUpdate) onJobUpdate();
      onClose();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.detail || "Failed to delete posting",
        color: "red",
      });
    }
    setUpdating(false);
  };

  useEffect(() => {
    if (opened && posting) {
      fetchFull();
      if (role === "student") checkEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, posting?.id]);

  if (!posting) return null;
  const detail = fullPosting || posting;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={posting.title}
      size="xl"
      centered
    >
      <Grid gutter="lg">
        <Grid.Col span={6}>
          <Text fw={600} mb="xs">
            Job Details
          </Text>
          <Table withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Company</Table.Td>
                <Table.Td>{posting.company_name}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Type</Table.Td>
                <Table.Td>
                  <Badge variant="light">{posting.job_type}</Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>
                  {compensationShortLabel(posting.compensation_type)}
                </Table.Td>
                <Table.Td fw={600}>
                  {formatCompensation(
                    posting.ctc,
                    posting.compensation_type,
                    posting.internship_duration_months,
                  )}
                </Table.Td>
              </Table.Tr>
              {posting.job_type === "INTERNSHIP" &&
                posting.internship_duration_months && (
                  <Table.Tr>
                    <Table.Td fw={500}>Duration</Table.Td>
                    <Table.Td>
                      {posting.internship_duration_months} months
                    </Table.Td>
                  </Table.Tr>
                )}
              <Table.Tr>
                <Table.Td fw={500}>Location</Table.Td>
                <Table.Td>{posting.location || "-"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Deadline</Table.Td>
                <Table.Td>
                  {posting.application_deadline
                    ? new Date(posting.application_deadline).toLocaleString(
                        "en-IN",
                      )
                    : "-"}
                </Table.Td>
              </Table.Tr>
              {posting.jd_link && (
                <Table.Tr>
                  <Table.Td fw={500}>JD Link</Table.Td>
                  <Table.Td>
                    <a
                      href={posting.jd_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open JD ↗
                    </a>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text fw={600} mb="xs">
            Eligibility Criteria
          </Text>
          <Table withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Min CPI</Table.Td>
                <Table.Td>{posting.min_cpi || "N/A"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Programmes</Table.Td>
                <Table.Td>{posting.eligible_programmes || "All"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Branches</Table.Td>
                <Table.Td>{posting.eligible_branches || "All"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Batches</Table.Td>
                <Table.Td>
                  {Array.isArray(posting.eligible_batches) &&
                  posting.eligible_batches.length > 0
                    ? posting.eligible_batches.join(", ")
                    : "All"}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Backlog</Table.Td>
                <Table.Td>
                  {posting.backlog_allowed ? "Allowed" : "Not allowed"}
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Grid.Col>
      </Grid>

      {detail.description && (
        <>
          <Divider my="md" />
          <Text fw={600} mb="xs">
            Description
          </Text>
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {detail.description}
          </Text>
        </>
      )}

      {(detail.roles || []).length > 0 && (
        <>
          <Divider my="md" label="Roles in this posting" />
          <Stack gap="xs">
            {detail.roles.map((r) => {
              const effectiveType =
                r.compensation_type || detail.compensation_type || "LPA";
              const effectiveDuration =
                r.internship_duration_months ||
                detail.internship_duration_months ||
                null;
              return (
                <Paper key={r.id} withBorder p="sm" radius="sm">
                  <Group justify="space-between">
                    <Text fw={600}>{r.title}</Text>
                    <Group gap="xs">
                      {r.ctc && (
                        <Badge variant="light">
                          {formatCompensation(
                            r.ctc,
                            effectiveType,
                            effectiveDuration,
                          )}
                        </Badge>
                      )}
                      {r.seats > 0 && (
                        <Badge variant="outline">{r.seats} seats</Badge>
                      )}
                    </Group>
                  </Group>
                  {r.description && (
                    <Text size="sm" c="dimmed" mt={4}>
                      {r.description}
                    </Text>
                  )}
                </Paper>
              );
            })}
          </Stack>
        </>
      )}

      {detail.bond_details && (
        <>
          <Text fw={600} mt="md" mb="xs">
            Bond Details
          </Text>
          <Text size="sm">{detail.bond_details}</Text>
        </>
      )}

      {role === "student" && (
        <>
          <Divider my="md" />
          {checkingEligibility ? (
            <Group>
              <Loader size="sm" />
              <Text size="sm">Checking eligibility...</Text>
            </Group>
          ) : eligibility ? (
            eligibility.already_applied ? (
              <Card withBorder p="sm" bg="blue.0">
                <Text size="sm" fw={500}>
                  ✓ You have already applied for this position.
                </Text>
              </Card>
            ) : eligibility.eligible ? (
              <Stack>
                <Card withBorder p="sm" bg="green.0">
                  <Text size="sm" fw={500} c="green">
                    ✓ You are eligible to apply!
                  </Text>
                </Card>
                {eligibility.already_placed && eligibility.apply_override && (
                  <Card withBorder p="sm" bg="blue.0">
                    <Text size="sm" fw={500} c="blue">
                      TPO override active — you can apply despite being placed.
                    </Text>
                  </Card>
                )}
                {eligibility.policy_check === false &&
                eligibility.already_placed &&
                !eligibility.apply_override ? (
                  <Card withBorder p="sm" bg="yellow.0">
                    <Text size="sm" fw={500} c="orange">
                      You are already marked as placed
                      {detail.job_type === "INTERNSHIP" ? " / interning" : ""}.
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {eligibility.policy_reason ||
                        "Please contact the TPO if you need to apply to additional postings."}
                    </Text>
                  </Card>
                ) : eligibility.profile_complete === false ? (
                  <Card withBorder p="sm" bg="yellow.0">
                    <Text size="sm" fw={500} c="orange">
                      Please complete your placement profile before applying.
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Missing:{" "}
                      {(eligibility.missing_profile_fields || [])
                        .map(
                          (f) =>
                            ({
                              professional_email: "Professional Email",
                              linkedin_url: "LinkedIn URL",
                              github_url: "GitHub URL",
                            })[f] || f,
                        )
                        .join(", ")}
                      . Open the &quot;My Profile&quot; tab to fill these in.
                    </Text>
                  </Card>
                ) : applyOpen ? (
                  <ApplyForm
                    posting={detail}
                    onClose={() => setApplyOpen(false)}
                    onApplied={() =>
                      setEligibility((prev) =>
                        prev ? { ...prev, already_applied: true } : prev,
                      )
                    }
                  />
                ) : (
                  <Button onClick={() => setApplyOpen(true)}>Apply Now</Button>
                )}
              </Stack>
            ) : (
              <Card withBorder p="sm" bg="red.0">
                <Text size="sm" fw={500} c="red">
                  ✗ Not Eligible
                </Text>
                <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
                  {eligibility.reasons?.map((r) => (
                    <li key={r}>
                      <Text size="xs">{r}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          ) : null}
        </>
      )}

      {(role === "placement officer" || role === "placement chairman") && (
        <Group mt="xl" justify="flex-end">
          <Button
            variant="light"
            onClick={() => setEditOpen(true)}
            disabled={updating}
          >
            Edit
          </Button>
          <Button
            color="red"
            variant="light"
            onClick={handleDelete}
            loading={updating}
          >
            Delete
          </Button>
          <Button
            color={posting.is_active ? "orange" : "green"}
            variant="light"
            onClick={handleToggleStatus}
            loading={updating}
          >
            {posting.is_active ? "Close Job Posting" : "Re-open Job Posting"}
          </Button>
        </Group>
      )}

      <CreateJobModal
        opened={editOpen}
        editingPosting={detail}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          fetchFull();
          if (onJobUpdate) onJobUpdate();
        }}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Top-level page
// ---------------------------------------------------------------------------
export default function JobPostings({ role }) {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 9;

  const isOfficer =
    role === "placement officer" || role === "placement chairman";

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet(jobPostingsRoute);
      setPostings(Array.isArray(res) ? res : res.results || []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch postings",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPostings = postings.filter((p) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !p.title?.toLowerCase().includes(q) &&
        !p.company_name?.toLowerCase().includes(q) &&
        !(p.role_titles || []).some((rt) => rt.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    // Job Type
    if (filterType !== "ALL" && p.job_type !== filterType) {
      return false;
    }
    // Status
    if (filterStatus !== "ALL") {
      const deadline = p.application_deadline
        ? new Date(p.application_deadline)
        : null;
      const deadlinePassed = !!(deadline && deadline < new Date());
      if (filterStatus === "ACTIVE") {
        if (!p.is_active || deadlinePassed) return false;
      } else if (filterStatus === "DEADLINE_PASSED") {
        if (!deadlinePassed) return false;
      } else if (filterStatus === "INACTIVE") {
        if (p.is_active) return false;
      }
    }

    // Students: only show relevant postings — backend already filters,
    // but keep a defensive client-side filter as a safety net.
    if (!isOfficer) {
      const deadline = p.application_deadline
        ? new Date(p.application_deadline)
        : null;
      const deadlinePassed = !!(deadline && deadline < new Date());
      if (!p.is_active || deadlinePassed) return false;
    }
    return true;
  });

  const paged = filteredPostings.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterType, filterStatus]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader />
      </div>
    );

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Text fw={600} size="xl">
          Job Postings
        </Text>
        {isOfficer && (
          <Button onClick={() => setCreateOpen(true)}>
            + Create Job Posting
          </Button>
        )}
      </Group>

      <Group grow mb="xl">
        <TextInput
          placeholder="Search by title, company or role..."
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Select
          label="Job Type"
          data={[
            { value: "ALL", label: "All Types" },
            { value: "PLACEMENT", label: "Placement" },
            { value: "INTERNSHIP", label: "Internship" },
            { value: "PPO", label: "PPO" },
            { value: "PBI", label: "PBI" },
          ]}
          value={filterType}
          onChange={setFilterType}
        />
        {isOfficer && (
          <Select
            label="Status"
            data={[
              { value: "ALL", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "DEADLINE_PASSED", label: "Deadline Passed" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        )}
      </Group>

      {filteredPostings.length > 0 ? (
        <>
          <Grid gutter="lg">
            {paged.map((p) => (
              <Grid.Col key={p.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <JobCard
                  posting={p}
                  role={role}
                  onViewDetail={(posting) => {
                    setSelectedPosting(posting);
                    setDetailOpen(true);
                  }}
                />
              </Grid.Col>
            ))}
          </Grid>
          {filteredPostings.length > perPage && (
            <Group justify="center" mt="lg">
              <Pagination
                total={Math.ceil(filteredPostings.length / perPage)}
                value={page}
                onChange={setPage}
              />
            </Group>
          )}
        </>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No job postings match your filters.
        </Text>
      )}

      <JobDetailModal
        posting={selectedPosting}
        opened={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedPosting(null);
        }}
        role={role}
        onJobUpdate={fetchData}
      />

      <CreateJobModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
