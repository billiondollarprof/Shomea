// src/main.jsx
//
// The entry point. It does one job: put the app on the page.
//
// Keep it that way. Every piece of real work belongs in its own file, so
// that anybody opening this one can see the whole of it at a glance.

import React from "react";
import ReactDOM from "react-dom/client";
import DeviceCheck from "./DeviceCheck.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DeviceCheck />
  </React.StrictMode>,
);
