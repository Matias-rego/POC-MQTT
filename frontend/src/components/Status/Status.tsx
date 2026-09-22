import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
}

const Status = ({ topic }: Props) => {
    const { subscribe, unsubscribe, connected } = useMqtt();

    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const handler = (mensaje: string) => {
            setIsOnline(mensaje === "online");
        };

        subscribe(`${topic}/status`, handler);

        return () => {
            unsubscribe(`${topic}/status`, handler);
        };
    }, [topic, connected, subscribe, unsubscribe]);

    return (
        <span className={`badge ${isOnline ? "is-on" : "is-off"}`}>
            <span className="dot" />
            {isOnline ? "En línea" : "Fuera de línea"}
        </span>
    );
};

export default Status;