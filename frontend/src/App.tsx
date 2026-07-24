import { useEffect, useState } from "react";
import client from "./mqttClient";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    client.on("connect", () => {
      console.log("Conectado");

      client.subscribe("esp-diego/binary_sensor/#", (err) => {
        if (!err) {
          console.log("Suscrito");
        }

      });

    });

    client.on("message", (topic, payload) => {
      console.log(topic, payload.toString());

      setMessage(payload.toString());
    });

    return () => {
      client.removeAllListeners();
    };
  }, []);

  return (
    <div>
      <h1>Temperatura</h1>
      <p>{message}</p>
      <button onClick={() => client.publish("sensor/temperatura", "Hola mundo")}>
        enviar
      </button>
    
    </div>
  );
}

export default App;