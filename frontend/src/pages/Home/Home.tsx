import { useMqtt } from "@/hooks/useMqtt";
import Switch from "@/components/ControlOutput/ControlOutput";
import Slider from "@/components/Slider/Slider";
import Graph from "@/components/Graph/Graph";

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
                    <div className="card-head">
                        <span className="card-icon">⚡</span>
                        <h2>Actuadores</h2>
                    </div>
                    <Switch topic="switch1" label="Switch 1" />
                    <Switch topic="switch2" label="Switch 2" />
                    <Switch topic="switch3" label="Switch 3" />
                </section>

                <section className="card">
                    <div className="card-head">
                        <span className="card-icon">🎚️</span>
                        <h2>Controles</h2>
                    </div>
                    <Slider topic="slider1" label="Slider 1" />
                    <Slider topic="slider2" label="Slider 2" />
                    <Slider topic="slider3" label="Slider 3" />
                </section>

                <section className="card card--wide">
                    <div className="card-head">
                        <span className="card-icon">📈</span>
                        <h2>Monitor en vivo — Slider 3</h2>
                    </div>
                    <Graph topic="slider3" />
                </section>
            </main>

            <footer className="app-footer">
                Broker: <code>ws://localhost:9001</code> · Datos en ventana de 30&nbsp;s
            </footer>
        </>
    );
};

export default Home;
