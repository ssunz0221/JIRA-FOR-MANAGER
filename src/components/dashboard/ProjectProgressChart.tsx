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
import type { ProjectMetricResult } from '@/business/types';

interface Props {
  data: ProjectMetricResult[];
}

export function ProjectProgressChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        프로젝트 데이터가 없습니다. 동기화를 먼저 실행해주세요.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.projectName.length > 20 ? d.projectName.slice(0, 20) + '...' : d.projectName,
    '완료': d.doneCount,
    '진행중': d.inProgressCount,
    '대기': d.todoCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="완료" stackId="a" fill="#36B37E" />
        <Bar dataKey="진행중" stackId="a" fill="#FFAB00" />
        <Bar dataKey="대기" stackId="a" fill="#FF5630" />
      </BarChart>
    </ResponsiveContainer>
  );
}
