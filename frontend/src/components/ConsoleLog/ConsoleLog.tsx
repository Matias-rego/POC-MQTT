import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState, useRef } from "react";
import styles from "./ConsoleLog.module.css";

interface ConsoleLogProps {
    topic: string;
}

const cleanAnsi = (text: string): string => {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1B\[[0-9;]*[mK]/g, "");
};

const ConsoleLog = ({ topic }: ConsoleLogProps) => {
    const { subscribe, unsubscribe, connected } = useMqtt();
    const [logs, setLogs] = useState<string[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const handleClear = () => {
        setLogs([]);
    };

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        
        const atBottom = scrollHeight - scrollTop - clientHeight <= 20;
        setIsAtBottom(atBottom);
    };

    useEffect(() => {
        if (!connected) return;

        const handler = (mensaje: string) => {
            const textoLimpio = cleanAnsi(mensaje);
            setLogs((prevLogs) => [...prevLogs, textoLimpio]);
        };

        subscribe(`${topic}/debug`, handler);

        return () => {
            unsubscribe(`${topic}/debug`, handler);
        };
    }, [topic, connected, subscribe, unsubscribe]);

    useEffect(() => {
        if (isAtBottom && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, isAtBottom]);

    return (
        <div className={styles.consoleWrapper}>
            <div className={styles.consoleHeader}>
                <span className={styles.consoleTitle}>{topic}/debug</span>
                <button onClick={handleClear} className={styles.clearBtn} type="button">
                    Limpiar
                </button>
            </div>

            <div 
                ref={containerRef} 
                onScroll={handleScroll} 
                className={styles.consoleContainer}
            >
                {logs.length === 0 ? (
                    <div className={styles.consoleEmpty}>Consola vacía / Esperando logs...</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className={styles.consoleLine}>
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConsoleLog;