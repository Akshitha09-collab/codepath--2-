/**
 * components/ProgressChart.jsx
 * Line chart showing each topic's performanceScore history over time,
 * used on the Progress page to visualize improvement (e.g. Graphs 33% -> 52%).
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const LINE_COLORS = ["#2F5BEA", "#1F9D7A", "#E2A02D", "#D9577A", "#2BB3C0", "#7C6FE0"];

export default function ProgressChart({ topics }) {
  if (!topics || topics.length === 0) {
    return (
      <div className="text-sm text-[color:var(--soft)] flex items-center justify-center h-64">
        No progress history yet. Keep solving problems to build your trend.
      </div>
    );
  }

  // Merge all topics' history into one array of { index, TopicA, TopicB, ... }
  const maxLen = Math.max(...topics.map((t) => t.history.length));
  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    const row = { index: i + 1 };
    topics.forEach((t) => {
      if (t.history[i]) row[t.topic] = t.history[i].score;
    });
    merged.push(row);
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={merged} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F3" />
        <XAxis
          dataKey="index"
          tick={{ fontSize: 12, fill: "#62708B" }}
          label={{ value: "Snapshot #", position: "insideBottom", offset: -3, fontSize: 11, fill: "#62708B" }}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#62708B" }} />
        <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F3" }} />
        <Legend />
        {topics.map((t, idx) => (
          <Line
            key={t.topic}
            type="monotone"
            dataKey={t.topic}
            stroke={LINE_COLORS[idx % LINE_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
