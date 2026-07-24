import mqtt from "mqtt";

const client = mqtt.connect("ws://192.168.100.40:9001", {
  username: "admin",
  password: "123456",
  clientId: "react-client",
});

client.on("connect", () => {
  console.log("✅ Conectado");
});

client.on("error", (err) => {
  console.error("❌ Error:", err);
});

client.on("close", () => {
  console.log("🔌 Conexión cerrada");
});

client.on("offline", () => {
  console.log("📴 Offline");
});

client.on("reconnect", () => {
  console.log("🔄 Reintentando...");
});

export default client;