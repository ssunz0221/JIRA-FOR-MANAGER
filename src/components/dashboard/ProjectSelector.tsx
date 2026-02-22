import type { ProjectMetricResult } from '@/business/types';

interface Props {
  projects: ProjectMetricResult[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

export function ProjectSelector({ projects, selectedKey, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">프로젝트:</label>
      <select
        value={selectedKey ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-jira-blue focus:outline-none focus:ring-1 focus:ring-jira-blue"
      >
        <option value="">전체 보기</option>
        {projects.map((p) => (
          <option key={p.projectKey} value={p.projectKey}>
            {p.projectKey} - {p.projectName}
          </option>
        ))}
      </select>
    </div>
  );
}
