import { useMqtt } from "@/hooks/useMqtt";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  topic: string;
  min?: number;
  max?: number;
}

interface Point {
  t: number;
  value: number;
}

const WINDOW_MS = 300_000; // 30 segundos

export default function Graph({ topic , min = 0 , max = 255}: Props) {
  const { subscribe, unsubscribe, connected } = useMqtt();
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    const onMessage = (mensaje: string) => {
      const value = Number(mensaje);
      if (Number.isNaN(value)) {
        return;
      }

      setData((prev) => {
        const now = Date.now();
        return [
          ...prev.filter((p) => now - p.t <= WINDOW_MS),
          { t: now, value },
        ];
      });
    };

    subscribe(`${topic}/state`, onMessage);

    return () => {
      unsubscribe(`${topic}/state`, onMessage);
    };
  }, [topic, connected, subscribe, unsubscribe]);

  if (data.length === 0) {
    return (
      <div className="graph-empty">
        <div style={{ fontSize: 26 }}>📉</div>
        <div>Esperando datos de <code>{topic}/state</code>…</div>
        <div style={{ color: "var(--text-dim)", fontSize: 12.5 }}>
          Movés el slider correspondiente y el gráfico se dibuja en vivo.
        </div>
      </div>
    );
  }

  return (
    <div className="graph-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c5cff" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#273049" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "#8a97ad", fontSize: 11 }}
            stroke="#273049"
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "#8a97ad", fontSize: 11 }}
            stroke="#273049"
          />
          <Tooltip
            contentStyle={{
              background: "#161d2e",
              border: "1px solid #273049",
              borderRadius: 10,
              color: "#e6edf6",
            }}
            labelStyle={{ color: "#8a97ad" }}
            labelFormatter={(value) => new Date(Number(value)).toLocaleTimeString()}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
