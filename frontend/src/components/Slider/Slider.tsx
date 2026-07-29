import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";

interface Props {
    topic: string;
}

const Slider = ({ topic }: Props) => {

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

    const sendValue = (value: string) => {
        publish(`${topic}/value`, value);
    };

    return (
        <>
            <label>
                <input
                    id="slider"
                    type="range"
                    min="0"
                    max="255"
                    step="1"
                    value={value}
                    onChange={(e) => sendValue(e.target.value)} // e.target.value siempre es un string
                    style={{ width: '200px', marginTop: '10px' }}
                />
                {value}
            </label>
        </>
    );
}

export default Slider;