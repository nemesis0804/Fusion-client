import {
  Button,
  Center,
  Container,
  Paper,
  PasswordInput,
  TextInput,
  Title,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { useDispatch } from "react-redux";
import { setName } from "../redux/userslice";
import { loginRoute } from "../routes/globalRoutes";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("authToken")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const loginIdentifier = username.trim();

    try {
      const response = await axios.post(loginRoute, {
        username: loginIdentifier,
        password,
      });

      if (response.status === 200) {
        dispatch(setName(loginIdentifier));
        notifications.show({
          title: "Login Successful",
          message: "You have been successfully logged in.",
          color: "green",
        });
        const { token } = response.data;

        localStorage.setItem("authToken", token);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      const statusCode = err.response?.status;
      const responseData = err.response?.data;
      const backendMessage =
        responseData?.detail ||
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null);

      if (statusCode === 400) {
        notifications.show({
          title: "Login Failed",
          message:
            backendMessage ||
            "Invalid username or password ! Please use correct credentials.",
          color: "red",
          position: "top-center",
          withCloseButton: false,
        });
      } else if (statusCode === 401 || statusCode === 403) {
        notifications.show({
          title: "Login Failed",
          message:
            backendMessage ||
            "Your account is not allowed to sign in right now.",
          color: "red",
          position: "top-center",
          withCloseButton: false,
        });
      } else {
        notifications.show({
          title: "Error",
          message:
            backendMessage ||
            (statusCode
              ? `Login request failed with status ${statusCode}.`
              : "Could not reach the backend server at 127.0.0.1:8000."),
          color: "red",
          position: "top-center",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    window.location.href = "/reset-password";
  };

  return (
    <Center w="100%">
      <Container w={420} my={100}>
        <Title ta="center">Welcome to Fusion!</Title>

        <Paper
          withBorder
          shadow="lg"
          p={30}
          mt={40}
          radius="md"
          style={{ border: "2px solid #15ABFF" }}
        >
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Username/Email"
              placeholder="username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <PasswordInput
              label="Password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              mt="lg"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            <Button
              fullWidth
              size="md"
              mt="xl"
              bg="#15ABFF"
              type="submit"
              loading={loading}
            >
              Sign in
            </Button>

            <Button
              fullWidth
              variant="outline"
              color="blue"
              size="sm"
              mt="md"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot Password?
            </Button>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}

export default LoginPage;
