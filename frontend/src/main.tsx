import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { BoothFlowProvider } from "@/booth/flow/BoothFlowProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BoothFlowProvider>
        <App />
      </BoothFlowProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
