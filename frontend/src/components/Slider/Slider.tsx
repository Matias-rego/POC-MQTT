import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
    label?: string;
}

const MAX = 255;

const Slider = ({ topic, label }: Props) => {
    const [value, setValue] = useState(0);
    const { subscribe, unsubscribe, publish, connected } = useMqtt();

    useEffect(() => {
        const handler = (mensaje: string) => {
            setValue(Number(mensaje));
        };

        subscribe(`${topic}/value`, handler);

        return () => {
            unsubscribe(`${topic}/value`, handler);
        };
    }, [topic, connected, subscribe, unsubscribe]);

    const sendValue = (next: string) => {
        setValue(Number(next));
        publish(`${topic}/value`, next);
    };

    const pct = (value / MAX) * 100;

    return (
        <div className="slider-block">
            <div className="slider-top">
                <span className="control-label">{label ?? topic}</span>
                <span className="slider-value">{value}</span>
            </div>
            <input
                className="range"
                type="range"
                min="0"
                max={MAX}
                step="1"
                value={value}
                onChange={(e) => sendValue(e.target.value)}
                style={{
                    background: `linear-gradient(90deg, var(--accent) ${pct}%, var(--surface-2) ${pct}%)`,
                }}
            />
        </div>
    );
};

export default Slider;
