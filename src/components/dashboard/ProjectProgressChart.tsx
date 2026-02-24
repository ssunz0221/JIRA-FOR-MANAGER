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

interface ChartEntry {
  name: string;
  projectKey: string;
  projectName: string;
  완료: number;
  진행중: number;
  대기: number;
}

interface Props {
  data: ProjectMetricResult[];
  onEpicClick?: (projectKey: string, projectName: string) => void;
}

export function ProjectProgressChart({ data, onEpicClick }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        에픽 데이터가 없습니다. 동기화를 먼저 실행해주세요.
      </div>
    );
  }

  const chartData: ChartEntry[] = data.map((d) => ({
    name: d.projectName.length > 20 ? d.projectName.slice(0, 20) + '...' : d.projectName,
    projectKey: d.projectKey,
    projectName: d.projectName,
    '완료': d.doneCount,
    '진행중': d.inProgressCount,
    '대기': d.todoCount,
  }));

  const handleBarClick = (entry: ChartEntry) => {
    onEpicClick?.(entry.projectKey, entry.projectName);
  };

  return (
    <div>
      {onEpicClick && (
        <p className="mb-2 text-xs text-gray-400">차트 바를 클릭하면 하위 이슈 목록을 볼 수 있습니다.</p>
      )}
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 20, right: 20 }}
          style={onEpicClick ? { cursor: 'pointer' } : undefined}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="완료" stackId="a" fill="#36B37E" onClick={handleBarClick} />
          <Bar dataKey="진행중" stackId="a" fill="#FFAB00" onClick={handleBarClick} />
          <Bar dataKey="대기" stackId="a" fill="#FF5630" onClick={handleBarClick} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
