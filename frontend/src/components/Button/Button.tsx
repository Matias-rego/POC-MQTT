import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
    label?: string;
}

const Button = ({ topic, label }: Props) => {
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

    const sendState = () => {
        const newState = !isEnabled;
        publish(`${topic}/command`, newState ? "ON" : "OFF");
    };

    return (
        <div className="control-row">
            <div>
                <div className="control-label">
                    {label ?? topic}
                </div>

                <div className="control-sub">
                    {topic}/state
                </div>
            </div>

            <button
                type="button"
                className={`control-button ${
                    isEnabled ? "active" : ""
                }`}
                onClick={sendState}
            >
                <span className="button-indicator" />
                <span className="button-text">
                    {isEnabled ? "ON" : "OFF"}
                </span>
            </button>
        </div>
    );
};

export default Button;
