import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
    label?: string;
    min?: number;
    max?: number;
}


const Slider = ({ topic, label, min = 0, max = 255 }: Props) => {
    const [value, setValue] = useState(0);
    const { subscribe, unsubscribe, publish, connected } = useMqtt();

    useEffect(() => {
        const handler = (mensaje: string) => {
            setValue(Number(mensaje));
        };

        subscribe(`${topic}/state`, handler);

        return () => {
            unsubscribe(`${topic}/state`, handler);
        };
    }, [topic, connected, subscribe, unsubscribe]);

    const sendValue = (next: string) => {
        setValue(Number(next));
        publish(`${topic}/command`, next);
    };

    const pct = (value / (max - min)) * 100;

    return (
        <div className="slider-block">
            <div className="slider-top">
                <span className="control-label">{label ?? topic}</span>
                <span className="slider-value">{value}</span>
            </div>
            <input
                className="range"
                type="range"
                min={min}
                max={max}
                step="1"
                value={value}
                onChange={(e) => sendValue(e.target.value)}
                style={{
                    background: `linear-gradient(90deg, var(--accent) ${pct}%, rgba(240, 239, 239, 0.2) ${pct}%)`,
                }}
            />
        </div>
    );
};

export default Slider;
