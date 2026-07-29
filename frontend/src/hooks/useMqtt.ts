import { useContext } from "react";
import { MqttContext } from "@/context/MqttContext";

export function useMqtt() {
  const context = useContext(MqttContext);

  if (!context) {
    throw new Error("useMqtt debe usarse dentro de MqttProvider");
  }

  return context;
}