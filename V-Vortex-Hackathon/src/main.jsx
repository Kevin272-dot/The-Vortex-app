import React from "react";
import ReactDOM from "react-dom/client";
// Expose React as a global for builds that reference the `React` global
// (prevents "React is not defined" runtime errors in some deployments)
window.React = React;
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
