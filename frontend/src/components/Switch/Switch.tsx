import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
    label?: string;
}

const Switch = ({ topic, label }: Props) => {
    const { subscribe, unsubscribe, publish, connected } = useMqtt();

    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        const handler = (mensaje: string) => {
            setIsEnabled(mensaje === "ON");
        };

        subscribe(`${topic}/state`, handler);

        return () => {
            unsubscribe(`${topic}/state`, handler);
        };
    }, [topic, connected, subscribe, unsubscribe]);

    const sendState = (state: boolean) => {
        publish(`${topic}/command`, state ? "ON" : "OFF");
    };

    return (
        <div className="control-row">
            <div>
                <div className="control-label">{label ?? topic}</div>
                <div className="control-sub">{topic}/state</div>
            </div>
            <label className="toggle">
                <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => sendState(e.target.checked)}
                />
                <span className="toggle-track">
                    <span className="toggle-thumb" />
                </span>
                <span className="toggle-state">{isEnabled ? "ON" : "OFF"}</span>
            </label>
        </div>
    );
};

export default Switch;
