
import { useMqtt } from "@/hooks/useMqtt";

interface Props {
    topic: string;
    label?: string;
    command?: { on: string; off: string };
}

const PushButton = ({ topic, label, command = { on: "ON", off: "OFF" } }: Props) => {
    const { publish } = useMqtt();

    const sendState = (state: string) => {
        publish(`${topic}/command`, state);
    };

    return (
        <div className="control-row">
            <div>
                <div className="control-label">
                    {label ?? topic}
                </div>

                <div className="control-sub">
                    {topic}/command
                </div>
            </div>

            <button
                type="button"
                className="control-button"
                onPointerDown={() => sendState(command.on)}
                onPointerUp={() => sendState(command.off)}
                onPointerCancel={() => sendState(command.off)}
                onPointerLeave={(e) => {
                    if (e.buttons > 0) {
                        sendState(command.off);
                    }
                }}
            >
                <span className="button-indicator" />
                <span className="button-text">PULSAR</span>
            </button>
        </div>
    );
};

export default PushButton;