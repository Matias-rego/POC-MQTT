import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMqtt } from "@/hooks/useMqtt";
import Home from "@/pages/Home/Home";

function App() {
  const { connected } = useMqtt();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route
          path="*"
          element={<Navigate replace to="/home" />}
        />
      </Routes>
      <div style={{ position: "fixed", bottom: 8, left: 8, fontSize: 12 }}>
        <div>MQTT status: {connected ? "connected": "disconnected"}</div>
      </div>
    </BrowserRouter>
  );
}

export default App;