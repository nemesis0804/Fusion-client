import React from "react";
import PropTypes from "prop-types";

function LoadingSpinner({ message }) {
  return <div>{message}</div>;
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  message: "Loading...",
};

export default LoadingSpinner;
