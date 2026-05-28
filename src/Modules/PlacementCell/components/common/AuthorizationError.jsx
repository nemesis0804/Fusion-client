import React from "react";
import { Alert, Button, Container, Group, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

function AuthorizationError({ message }) {
  const navigate = useNavigate();

  return (
    <Container fluid mt={32}>
      <Alert color="red" title="Authorization Error">
        <Text mb="md">{message}</Text>
        <Group>
          <Button variant="light" color="red" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="subtle" onClick={() => navigate("/placement-cell")}>
            Open Placement Cell
          </Button>
        </Group>
      </Alert>
    </Container>
  );
}

AuthorizationError.propTypes = {
  message: PropTypes.string,
};

AuthorizationError.defaultProps = {
  message: "You are not authorized to access this placement cell feature.",
};

export default AuthorizationError;
