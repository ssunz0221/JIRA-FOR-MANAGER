import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TeamMetricResult } from '@/business/types';

interface Props {
  data: TeamMetricResult[];
}

export function TeamEfficiencyChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        팀 데이터가 없습니다. 팀을 생성하고 구성원을 배정해주세요.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.teamName,
    'OTDR (%)': Math.round(d.otdr * 100),
    'AOD (일)': Number(d.aod.toFixed(1)),
    '구성원': d.memberCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="OTDR (%)" fill="#36B37E" />
        <Bar yAxisId="right" dataKey="AOD (일)" fill="#FF5630" />
      </BarChart>
    </ResponsiveContainer>
  );
}
