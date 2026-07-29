import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import mqtt from "mqtt";
import type { MqttClient } from "mqtt";
import { MqttContext, type MqttMessageCallback } from "./MqttContext";

interface Props {
  children: ReactNode;
}

export function MqttProvider({ children }: Props) {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<MqttClient | null>(null);
  const listenersRef = useRef<Map<string, Set<MqttMessageCallback>>>(new Map());

  useEffect(() => {
        const mqttClient = mqtt.connect(`ws://${import.meta.env.VITE_MQTT_HOST}:${import.meta.env.VITE_MQTT_PORT}`, {
            username: `${import.meta.env.VITE_MQTT_USERNAME}`,
            password: `${import.meta.env.VITE_MQTT_PASSWORD}`,
            clientId: `react-client-${Date.now()}`,
            reconnectPeriod: 2000,
        });


    const listeners = listenersRef.current;

    clientRef.current = mqttClient;
    setClient(mqttClient);

    const handleConnect = () => {
        console.log("Conectado");
        setConnected(true);
    };

    const handleClose = () => {
        console.log("Desconectado");
        setConnected(false);
    };

    const handleError = (error: Error) => {
        console.error("MQTT error:", error);
    };

    const handleMessage = (topic: string, payload: Buffer) => {
        const callbacks = listeners.get(topic);

        if (!callbacks) return;

        callbacks.forEach((callback) => {
            callback(payload.toString());
        });
    };

    mqttClient.on("connect", handleConnect);
    mqttClient.on("close", handleClose);
    mqttClient.on("error", handleError);
    mqttClient.on("message", handleMessage);


    return () => {
        mqttClient.off("connect", handleConnect);
        mqttClient.off("close", handleClose);
        mqttClient.off("error", handleError);
        mqttClient.off("message", handleMessage);

        listeners.clear();

        clientRef.current = null;

        if (mqttClient.connected) {
            mqttClient.end(true);
        }

        setConnected(false);
        setClient(null);
    };

}, []);

  const publish = useCallback((topic: string, message: string) => {
    const mqttClient = clientRef.current;
    if (!mqttClient || !connected) return;

    mqttClient.publish(topic, message, {qos: 0, retain: true });
  }, [connected]);

  const subscribe = useCallback((topic: string, callback: MqttMessageCallback) => {
    const mqttClient = clientRef.current;
    if (!mqttClient) return;

    let callbacks = listenersRef.current.get(topic);

    if (!callbacks) {
      callbacks = new Set();
      listenersRef.current.set(topic, callbacks);
      mqttClient.subscribe(topic);
    }

    callbacks.add(callback);
  }, []);

  const unsubscribe = useCallback((topic: string, callback: MqttMessageCallback) => {
    const mqttClient = clientRef.current;
    if (!mqttClient) return;

    const callbacks = listenersRef.current.get(topic);
    if (!callbacks) return;

    callbacks.delete(callback);

    if (callbacks.size === 0) {
      listenersRef.current.delete(topic);
      mqttClient.unsubscribe(topic);
    }
  }, []);

  return (
    <MqttContext.Provider
      value={{
        client,
        connected,
        publish,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </MqttContext.Provider>
  );
}