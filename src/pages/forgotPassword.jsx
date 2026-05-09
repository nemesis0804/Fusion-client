import {
  Button,
  Center,
  Container,
  Divider,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { resetPasswordRoute } from "../routes/globalRoutes";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      notifications.show({
        title: "Error",
        message: "Please enter your email address",
        color: "red",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(resetPasswordRoute, {
        email,
      });

      if (response.status === 200) {
        setSent(true);
        notifications.show({
          title: "Success",
          message: "Password reset instructions have been sent to your email",
          color: "green",
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.error ||
          "Something went wrong. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Center w="100%">
        <Container w={420} my={100}>
          <Title ta="center" fw={700} fz={28} mb={15} c="#333">
            Check Your Email
          </Title>

          <Paper
            withBorder
            shadow="lg"
            p={30}
            mt={40}
            radius="md"
            style={{ border: "2px solid #15ABFF" }}
          >
            <Text fw={500} fz="md" lh={1.6} mb={10} ta="center">
              We've sent password reset instructions to:
            </Text>
            <Text fw={700} fz="lg" ta="center" c="#15ABFF" mb={20}>
              {email}
            </Text>
            <Text fz="sm" c="dimmed" ta="center" lh={1.6}>
              Please check your inbox and follow the link in the email to reset
              your password. If you don't see the email, check your spam folder.
            </Text>

            <Button
              fullWidth
              mt="xl"
              bg="#15ABFF"
              fz="md"
              fw={600}
              style={{ height: 44 }}
              onClick={() => navigate("/accounts/login")}
            >
              Return to Login
            </Button>
          </Paper>
        </Container>
      </Center>
    );
  }

  return (
    <Center w="100%">

      <Container w={420} my={100}>
        <Title ta="center" fw={700} fz={28} mb={15} c="#333">
          Reset Password
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
            Forgotten your password? Enter your e-mail address below, and we
            will send you an e-mail allowing you to reset it.
          </Text>

          <Divider my="md" variant="dashed" color="#15ABFF" opacity={0.5} />

          <form onSubmit={handleSubmit}>
            <TextInput
              label={
                <Text fw={600} fz="sm">
                  Email Address
                </Text>
              }
              type="email"
              placeholder="your@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              Send Reset Link
            </Button>
          </form>

          <Divider my="md" variant="dashed" color="#15ABFF" opacity={0.5} />

          <Text fz="sm" c="dimmed" ta="center" lh={1.6}>
            Please contact CC admin if you have any trouble resetting your
            password.
          </Text>

          <Button
            fullWidth
            variant="subtle"
            color="#15ABFF"
            mt="md"
            onClick={() => navigate("/accounts/login")}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Center>
  );
}

export default ForgotPassword;
