import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "교통", value: 40 },
  { name: "전기", value: 30 },
  { name: "음식·소비", value: 30 },
];

const COLORS = ["var(--color-light-green)", "var(--color-green)", "var(--color-dark-green)"];

export default function CategoryPieChart() {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend verticalAlign="middle" align="right" layout="vertical" />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={0} outerRadius={80}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
