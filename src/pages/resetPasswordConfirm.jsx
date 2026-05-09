import {
  Button,
  Center,
  Container,
  Divider,
  Paper,
  Text,
  PasswordInput,
  Title,
  Loader,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { changePassowordRoute } from "../routes/globalRoutes";

function ResetPasswordConfirm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { uid, token } = useParams();
  const navigate = useNavigate();

  // You can optionally validate the token when the component loads
  useEffect(() => {
    // Skip validation for now and assume token is valid
    // In a production app, you might want to validate the token on page load
    setTokenValidating(false);
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation
    if (!password || !confirmPassword) {
      notifications.show({
        title: "Error",
        message: "Please fill in all fields",
        color: "red",
      });
      return;
    }

    if (password !== confirmPassword) {
      notifications.show({
        title: "Error",
        message: "Passwords do not match",
        color: "red",
      });
      return;
    }

    if (password.length < 8) {
      notifications.show({
        title: "Error",
        message: "Password must be at least 8 characters long",
        color: "red",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(changePassowordRoute, {
        uid,
        token,
        new_password: password,
      });

      if (response.status === 200) {
        setResetSuccess(true);
        notifications.show({
          title: "Success",
          message: "Your password has been reset successfully",
          color: "green",
        });

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/accounts/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Password reset error:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes("token")
      ) {
        setTokenValid(false);
        notifications.show({
          title: "Invalid Token",
          message: "This password reset link is invalid or has expired",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.error ||
            "An error occurred while resetting your password",
          color: "red",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating token
  if (tokenValidating) {
    return (
      <Center w="100%" h="100vh">
        <div style={{ textAlign: "center" }}>
          <Loader size="lg" color="#15ABFF" />
          <Text mt="md">Verifying your reset link...</Text>
        </div>
      </Center>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <Center w="100%">
        <Container w={420} my={100}>
          <Title ta="center" fw={700} fz={28} mb={15} c="#333">
            Invalid Reset Link
          </Title>

          <Paper
            withBorder
            shadow="lg"
            p={30}
            mt={40}
            radius="md"
            style={{ border: "2px solid #ff5555" }}
          >
            <Text fw={500} fz="md" lh={1.6} mb={20} ta="center">
              The password reset link is invalid or has expired.
            </Text>

            <Button
              fullWidth
              mt="md"
              bg="#15ABFF"
              fz="md"
              fw={600}
              style={{ height: 44 }}
              onClick={() => navigate("/reset-password")}
            >
              Request New Reset Link
            </Button>
          </Paper>
        </Container>
      </Center>
    );
  }

  // Show success message
  if (resetSuccess) {
    return (
      <Center w="100%">
        <Container w={420} my={100}>
          <Title ta="center" fw={700} fz={28} mb={15} c="#333">
            Password Reset Complete
          </Title>

          <Paper
            withBorder
            shadow="lg"
            p={30}
            mt={40}
            radius="md"
            style={{ border: "2px solid #15ABFF" }}
          >
            <Text fw={500} fz="md" lh={1.6} mb={20} ta="center">
              Your password has been reset successfully.
            </Text>
            <Text fz="sm" c="dimmed" ta="center" lh={1.6} mb={20}>
              You will be redirected to the login page in a moment, or you can
              click the button below.
            </Text>

            <Button
              fullWidth
              mt="md"
              bg="#15ABFF"
              fz="md"
              fw={600}
              style={{ height: 44 }}
              onClick={() => navigate("/accounts/login")}
            >
              Go to Login
            </Button>
          </Paper>
        </Container>
      </Center>
    );
  }

  // Show reset password form
  return (
    <Center w="100%">
      <Container w={420} my={100}>
        <Title ta="center" fw={700} fz={28} mb={15} c="#333">
          Create New Password
        </Title>

        <Paper
          withBorder
          shadow="lg"
          p={30}
          mt={40}
          radius="md"
          style={{ border: "2px solid #15ABFF" }}
        >
          <Text fw={500} fz="md" lh={1.6} mb={10}>
            Please enter and confirm your new password.
          </Text>

          <Divider my="md" variant="dashed" color="#15ABFF" opacity={0.5} />

          <form onSubmit={handleSubmit}>
            <PasswordInput
              label={
                <Text fw={600} fz="sm">
                  New Password
                </Text>
              }
              placeholder="Enter new password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              styles={{
                label: { marginBottom: 6 },
                input: {
                  fontSize: "1rem",
                  padding: "10px 14px",
                  "&:focus": {
                    borderColor: "#15ABFF",
                  },
                },
              }}
            />

            <PasswordInput
              label={
                <Text fw={600} fz="sm">
                  Confirm New Password
                </Text>
              }
              placeholder="Confirm new password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              mt="md"
              styles={{
                label: { marginBottom: 6 },
                input: {
                  fontSize: "1rem",
                  padding: "10px 14px",
                  "&:focus": {
                    borderColor: "#15ABFF",
                  },
                },
              }}
            />

            <Button
              fullWidth
              mt="xl"
              bg="#15ABFF"
              fz="md"
              fw={600}
              style={{ height: 44 }}
              type="submit"
              loading={loading}
            >
              Reset Password
            </Button>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}

export default ResetPasswordConfirm;
