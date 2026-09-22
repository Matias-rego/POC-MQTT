import { useMqtt } from "@/hooks/useMqtt";
import Switch from "@/components/Switch/Switch";
import Slider from "@/components/Slider/Slider";
import Graph from "@/components/Graph/Graph";
import StatusCard from "@/components/StatusCard/StatusCard";
import PushButton from "@/components/PushButton/PushButton";
import ConsoleLog from "@/components/ConsoleLog/ConsoleLog";


const Home = () => {
    const { connected } = useMqtt();

    return (
        <>
            <header className="app-header">
                <div className="app-brand">
                    <div className="app-logo">📡</div>
                    <div>
                        <h1 className="app-title">MQTT Dashboard</h1>
                        <div className="app-subtitle">
                            Comunicación en tiempo real · PoC MQTT
                        </div>
                    </div>
                </div>

                <span className={`badge ${connected ? "is-on" : "is-off"}`}>
                    <span className="dot" />
                    {connected ? "Conectado" : "Desconectado"}
                </span>
            </header>

            <main className="dashboard">
                <section className="card">
                    <StatusCard name="Esp32:1 - Controlador" topic="esp1"/>
                    <ConsoleLog topic="esp1"/>
                </section>
                <section className="card">
                    <StatusCard name="Esp32:2 - Actuador" topic="esp2"/>
                    <ConsoleLog topic="esp2"/>        
                </section>                

                <section className="card card--wide">
                    <div className="card-head">
                        <span className="card-icon">⚡</span>
                        <h2>Controles</h2>
                    </div>
                    <PushButton topic="esp2/led_1" label="Led 1" command={{ on: "ON", off: "OFF" }} />
                    <PushButton topic="esp2/led_2" label="Led 2" command={{ on: "TOGGLE", off: "" }} />
                    <PushButton topic="esp2/led_3" label="Led 3" command={{ on: "NEXT", off: "" }} />
                    <Switch topic="esp2/led_4_5" label="Switch 1" />
                    <Slider topic="esp2/slider" label="Slider 1" min={0} max={100} />
                </section>

                <section className="card">
                    <div className="card-head">
                        <span className="card-icon">💧</span>
                        <h2>Humedad</h2>
                    </div>
                    <Graph topic="esp1/humidity" min={0} max={100} />
                </section>
                
                <section className="card">
                    <div className="card-head">
                        <span className="card-icon">🌡️</span>
                        <h2>Temperatura</h2>
                    </div>
                    <Graph topic="esp1/temperature" min={0} max={50} />
                </section>
            </main>

            <footer className="app-footer">
                Broker: <code>ws://localhost:9001</code> · Datos en ventana de 30&nbsp;s
            </footer>
        </>
    );
};

export default Home;
