import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CATEGORY_NAMES: Record<string, string> = {
  TRANSPORT: "교통",
  ELECTRICITY: "전기",
  CONSUMPTION: "음식·소비",
};

const COLORS = ["var(--color-light-green)", "var(--color-green)", "var(--color-dark-green)"];

export default function CategoryPieChart({ chartData }: { chartData: any[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend verticalAlign="middle" align="right" layout="vertical" />
          <Pie 
            data={chartData} 
            dataKey="emission" 
            nameKey="category" 
            innerRadius={0} 
            outerRadius={80}
          >
            {chartData.map((entry, idx) => (
              <Cell 
                key={idx} 
                fill={COLORS[idx % COLORS.length]} 
                name={CATEGORY_NAMES[entry.category] || entry.category}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
