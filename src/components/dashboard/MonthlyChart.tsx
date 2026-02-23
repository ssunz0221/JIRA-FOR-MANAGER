import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyTotalStat, MonthlyTeamStat, MonthlyPersonStat } from '@/business/types';

interface TotalChartProps {
  data: MonthlyTotalStat[];
  estimationLabel: string;
}

export function MonthlyTotalChart({ data, estimationLabel }: TotalChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        월별 데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    '처리건수': d.completedCount,
    [estimationLabel]: Number(d.estimationTotal.toFixed(1)),
    'OTDR (%)': Math.round(d.otdr * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="처리건수" fill="#4C9AFF" />
        <Bar yAxisId="left" dataKey={estimationLabel} fill="#8777D9" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="OTDR (%)"
          stroke="#36B37E"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface TeamChartProps {
  data: MonthlyTeamStat[];
  estimationLabel: string;
}

export function MonthlyTeamChart({ data, estimationLabel }: TeamChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        팀별 월별 데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: `${d.month} ${d.teamName}`,
    '처리건수': d.completedCount,
    [estimationLabel]: Number(d.estimationTotal.toFixed(1)),
    'OTDR (%)': Math.round(d.otdr * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="처리건수" fill="#4C9AFF" />
        <Bar yAxisId="left" dataKey={estimationLabel} fill="#8777D9" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="OTDR (%)"
          stroke="#36B37E"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface PersonChartProps {
  data: MonthlyPersonStat[];
  estimationLabel: string;
}

export function MonthlyPersonChart({ data, estimationLabel }: PersonChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        개인 월별 데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    '처리건수': d.completedCount,
    [estimationLabel]: Number(d.estimationTotal.toFixed(1)),
    'OTDR (%)': Math.round(d.otdr * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="처리건수" fill="#4C9AFF" />
        <Bar yAxisId="left" dataKey={estimationLabel} fill="#8777D9" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="OTDR (%)"
          stroke="#36B37E"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
