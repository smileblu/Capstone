import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyTrend {
  month: string;    // 예: "2025-11"
  emission: number; // 예: 120
}

export default function MonthlyLineChart({ chartData }: { chartData: MonthlyTrend[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => value.split('-')[1] + '월'} // "2025-11" -> "11월"로 변환
          />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="emission" 
            stroke="#7DA453"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
