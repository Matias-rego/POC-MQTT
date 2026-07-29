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
}

interface Point {
  t: number;
  value: number;
}

export default function Graph({ topic }: Props) {
  const { subscribe, unsubscribe, connected } = useMqtt();
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {


    const onMessage = (mensaje: string) => {

      const value = Number(mensaje);

      console.log(value)
      if (Number.isNaN(value)) {
        return;
      }

      const WINDOW_MS = 30_000; // 30 segundos

      setData((prev) => {
        const now = Date.now();

        return [
          ...prev.filter((p) => now - p.t <= WINDOW_MS),
          {
            t: now,
            value,
          },
        ];
      });
    };

    subscribe(`${topic}/value`, onMessage);

    return () => {
      unsubscribe(`${topic}/value`, onMessage);
    };
  }, [topic, connected, subscribe, unsubscribe]);
  return (
    <ResponsiveContainer width="60%" height={150}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(value) =>
            new Date(value).toLocaleTimeString()
          } />
        <YAxis />
        <Tooltip
          labelFormatter={(value) =>
            new Date(Number(value)).toLocaleTimeString()
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}