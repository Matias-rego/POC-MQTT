import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
}

const Switch = ({topic}: Props) => {
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
        publish(`${topic}/state`, state ? 'ON' : 'OFF');
    };


    return (
        <>
            <label>
                <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => sendState(e.target.checked)}
                />
                {isEnabled ? ' ON' : ' OFF'}
            </label>
        </>
    )
}

export default Switch;