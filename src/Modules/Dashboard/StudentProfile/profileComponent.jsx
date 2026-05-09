import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import {
  Table,
  Text,
  Button,
  Flex,
  Divider,
  TextInput,
  Alert,
  List,
  FileInput,
  Anchor,
  Badge,
  Stack,
  Card,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import {
  getNotificationsRoute,
  updateProfileDataRoute,
} from "../../../routes/dashboardRoutes";
import { placementApi } from "../../PlacementCell/api";
import { setTotalNotifications } from "../../../redux/userslice";

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

function getDocumentError(file) {
  if (!file) {
    return "";
  }
  const fileName = file.name?.toLowerCase() || "";
  if (
    ![".pdf", ".jpg", ".jpeg", ".png"].some((ext) => fileName.endsWith(ext))
  ) {
    return "Only PDF, JPG, JPEG, and PNG files are allowed.";
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return "Document size must be 5MB or less.";
  }
  return "";
}

function formatTimestamp(value) {
  if (!value) {
    return "Just now";
  }
  return new Date(value).toLocaleString();
}

function getPhoneNumberError(value) {
  const phoneNo = String(value ?? "").trim();
  if (!phoneNo) {
    return "Phone number is required.";
  }
  if (!/^\d{10}$/.test(phoneNo)) {
    return "Phone number must contain exactly 10 digits.";
  }
  return "";
}

function ProfileComponent({ data, isEditable, placementProfileData }) {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    about: data.profile?.about_me || "N/A",
    dob: data.profile?.date_of_birth || "Jan 01, 2004",
    address: data.profile?.address || "XYZ",
    contactNumber: data.profile?.phone_no || "+91 99999 99999",
    mailId: data.current[0]?.user.email || "abc@gmail.com",
  });
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState("");
  const [documents, setDocuments] = useState(
    placementProfileData?.documents || [],
  );
  const [auditLogs, setAuditLogs] = useState(
    placementProfileData?.audit_logs || [],
  );
  const [validationErrors, setValidationErrors] = useState(
    placementProfileData?.validation_errors || [],
  );
  const [uploading, setUploading] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState("");

  useEffect(() => {
    setDocuments(placementProfileData?.documents || []);
    setAuditLogs(placementProfileData?.audit_logs || []);
    setValidationErrors(placementProfileData?.validation_errors || []);
  }, [placementProfileData]);

  const refreshPlacementProfile = async () => {
    try {
      const response = await placementApi.getPlacementProfile();
      setDocuments(response.data.documents || []);
      setAuditLogs(response.data.audit_logs || []);
      setValidationErrors(response.data.validation_errors || []);
    } catch (error) {
      console.error("Could not refresh placement profile data.", error);
    }
  };

  const refreshNotificationCount = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return;
    }

    try {
      const { data: notificationData } = await axios.get(getNotificationsRoute, {
        headers: { Authorization: `Token ${token}` },
      });
      const unreadCount = (notificationData.notifications || []).filter(
        (item) => !item.deleted && item.unread,
      ).length;
      dispatch(setTotalNotifications(unreadCount));
    } catch (error) {
      console.error("Could not refresh notification count.", error);
    }
  };

  const handleEditClick = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return console.error("No authentication token found!");
    if (isEditing) {
      const nextPhoneNumberError = getPhoneNumberError(profileData.contactNumber);
      setPhoneNumberError(nextPhoneNumberError);
      if (nextPhoneNumberError) {
        notifications.show({
          message: nextPhoneNumberError,
          color: "red",
        });
        return;
      }

      try {
        const payload = {
          profilesubmit: {
            about_me: profileData.about,
            date_of_birth: profileData.dob,
            address: profileData.address,
            phone_no: profileData.contactNumber,
          },
        };

        const response = await axios.put(updateProfileDataRoute, payload, {
          headers: { Authorization: `Token ${token}` },
        });

        if (response.status === 200) {
          setPhoneNumberError("");
          await refreshNotificationCount();
          notifications.show({
            message: "Profile updated successfully!",
            color: "green",
          });
        } else {
          notifications.show({
            message: "Failed to update profile",
            color: "red",
          });
        }
      } catch (error) {
        const backendPhoneError = error.response?.data?.phone_no?.[0];
        setPhoneNumberError(backendPhoneError || "");
        notifications.show({
          message: backendPhoneError || "Error updating profile",
          color: "red",
        });
        return;
      }
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (field === "contactNumber") {
      setPhoneNumberError(getPhoneNumberError(value));
    }
  };

  const handleDocumentChange = (file) => {
    setDocumentFile(file);
    setDocumentError(getDocumentError(file));
    if (!documentName && file?.name) {
      setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadDocument = async () => {
    const nextError = getDocumentError(documentFile);
    setDocumentError(
      nextError || (!documentFile ? "Please select a document." : ""),
    );
    if (!documentFile || nextError) {
      return;
    }

    const payload = new FormData();
    payload.append("name", documentName.trim() || documentFile.name);
    payload.append("document", documentFile);

    setUploading(true);
    try {
      await placementApi.uploadPlacementProfileDocument(payload);
      setDocumentName("");
      setDocumentFile(null);
      setDocumentError("");
      await refreshPlacementProfile();
      notifications.show({
        title: "Uploaded",
        message: "Placement document uploaded successfully.",
        color: "green",
      });
    } catch (error) {
      setDocumentError(
        error.response?.data?.document?.[0] || "Could not upload document.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex
      w={{ base: "100%", sm: "60%" }}
      p="md"
      gap="md"
      style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      direction="column"
      justify="space-evenly"
    >
      {/* About Me Section */}
      <Flex
        w="100%"
        p="md"
        direction="column"
        style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      >
        <Text fw={500} size="1.2rem">
          About Me
        </Text>
        <Divider my="sm" />
        <Flex w="100%" justify="space-between" align="center">
          {isEditing ? (
            <TextInput
              value={profileData.about}
              onChange={(e) => handleChange("about", e.target.value)}
              w="80%"
            />
          ) : (
            <Text>{profileData.about}</Text>
          )}
          {isEditable && (
            <Button
              onClick={handleEditClick}
              color={isEditing ? "green" : "red"}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Details Section */}
      <Flex
        w="100%"
        p="md"
        direction="column"
        style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      >
        <Text fw={500} size="1.2rem">
          Details
        </Text>
        <Divider my="sm" />
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={500}>Date of Birth</Table.Td>
              <Table.Td>
                {isEditing ? (
                  <TextInput
                    value={profileData.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                  />
                ) : (
                  profileData.dob
                )}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={500}>Address</Table.Td>
              <Table.Td>
                {isEditing ? (
                  <TextInput
                    value={profileData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                ) : (
                  profileData.address
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Flex>

      {/* Contact Details Section */}
      <Flex
        w="100%"
        p="md"
        direction="column"
        style={{ border: "1px solid lightgray", borderRadius: "5px" }}
      >
        <Text fw={500} size="1.2rem">
          Contact Details
        </Text>
        <Divider my="sm" />
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={500}>Contact Number</Table.Td>
              <Table.Td>
                {isEditing ? (
                  <TextInput
                    value={profileData.contactNumber}
                    onChange={(e) =>
                      handleChange("contactNumber", e.target.value)
                    }
                    error={phoneNumberError}
                    maxLength={10}
                  />
                ) : (
                  profileData.contactNumber
                )}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={500}>Mail ID</Table.Td>
              <Table.Td>{profileData.mailId}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Flex>

      {placementProfileData ? (
        <>
          {Array.isArray(validationErrors) && validationErrors.length > 0 ? (
            <Alert color="yellow" variant="light">
              <Text fw={600} mb="xs">
                Placement profile checks
              </Text>
              <List size="sm">
                {validationErrors.map((message) => (
                  <List.Item key={message}>{message}</List.Item>
                ))}
              </List>
            </Alert>
          ) : (
            <Alert color="green" variant="light">
              Placement profile checks are currently satisfied.
            </Alert>
          )}

          <Flex
            w="100%"
            p="md"
            direction="column"
            style={{ border: "1px solid lightgray", borderRadius: "5px" }}
          >
            <Text fw={500} size="1.2rem">
              Supporting Documents
            </Text>
            <Divider my="sm" />
            <Stack>
              {isEditable ? (
                <>
                  <TextInput
                    label="Document Name"
                    value={documentName}
                    onChange={(event) => setDocumentName(event.target.value)}
                    placeholder="Resume, transcript, portfolio"
                  />
                  <FileInput
                    label="Document"
                    placeholder="Choose a file"
                    value={documentFile}
                    onChange={handleDocumentChange}
                    error={documentError}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Flex justify="flex-end">
                    <Button onClick={handleUploadDocument} loading={uploading}>
                      Upload Document
                    </Button>
                  </Flex>
                </>
              ) : null}
              {documents.length ? (
                documents.map((document) => (
                  <Card key={document.id} withBorder radius="md" padding="sm">
                    <Flex justify="space-between" align="center">
                      <div>
                        <Text fw={600}>{document.name}</Text>
                        <Text c="dimmed" size="sm">
                          Uploaded {formatTimestamp(document.uploaded_at)}
                        </Text>
                      </div>
                      <Anchor
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </Anchor>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text c="dimmed" size="sm">
                  No placement documents uploaded yet.
                </Text>
              )}
            </Stack>
          </Flex>

          <Flex
            w="100%"
            p="md"
            direction="column"
            style={{ border: "1px solid lightgray", borderRadius: "5px" }}
          >
            <Text fw={500} size="1.2rem">
              Profile History
            </Text>
            <Divider my="sm" />
            <Stack>
              {auditLogs.length ? (
                auditLogs.map((entry) => (
                  <Card key={entry.id} withBorder radius="md" padding="sm">
                    <Flex justify="space-between" align="flex-start">
                      <div>
                        <Text fw={600}>{entry.action.replace(/_/g, " ")}</Text>
                        <Text c="dimmed" size="sm">
                          {entry.actor || "System"} {" - "}{" "}
                          {formatTimestamp(entry.created_at)}
                        </Text>
                      </div>
                      <Badge variant="light">{entry.action}</Badge>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text c="dimmed" size="sm">
                  No profile activity has been recorded yet.
                </Text>
              )}
            </Stack>
          </Flex>
        </>
      ) : null}
    </Flex>
  );
}

ProfileComponent.propTypes = {
  data: PropTypes.shape({
    profile: PropTypes.shape({
      about_me: PropTypes.string,
      date_of_birth: PropTypes.string,
      address: PropTypes.string,
      phone_no: PropTypes.number,
    }),
    current: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.shape({
          email: PropTypes.string,
        }),
      }),
    ),
  }),
  isEditable: PropTypes.bool.isRequired, // Added this line
  placementProfileData: PropTypes.shape({
    documents: PropTypes.arrayOf(PropTypes.shape({})),
    audit_logs: PropTypes.arrayOf(PropTypes.shape({})),
    validation_errors: PropTypes.arrayOf(PropTypes.string),
  }),
};
export default ProfileComponent;
