import { createContext } from "react";
import type { MqttClient } from "mqtt";

export type MqttMessageCallback = (message: string) => void;

export interface MqttContextType {
  client: MqttClient | null;
  connected: boolean;
  publish: (topic: string, message: string) => void;
  subscribe: (topic: string, callback: MqttMessageCallback) => void;
  unsubscribe: (topic: string, callback: MqttMessageCallback) => void;
}

export const MqttContext = createContext<MqttContextType | null>(null);