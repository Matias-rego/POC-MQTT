import { useMqtt } from "@/hooks/useMqtt";
import Switch from "@/components/ControlOutput/ControlOutput"
import Slider from "@/components/Slider/Slider";
import Graph from "@/components/Graph/Graph";

const Home = () => {
    const { connected } = useMqtt();

    return (
        <>
            <p>Conectado: {connected ? "Sí" : "No"}</p>

            <Switch topic="switch1" />
            <Switch topic="switch2" />
            <Switch topic="switch3" />

            <Slider topic="slider1" />
            <Slider topic="slider2" />
            <Slider topic="slider3" />

            <Graph topic="slider3" />

            <div style={{ position: "fixed", bottom: 8, left: 8, fontSize: 12 }}>
                <div>MQTT status: {connected}</div>
            </div>
        </>
    );
};

export default Home;