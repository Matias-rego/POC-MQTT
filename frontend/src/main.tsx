import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./pages/App/App";
import { MqttProvider } from "@/context/MqttProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MqttProvider>
      <App />
    </MqttProvider>
  </StrictMode>,
);
