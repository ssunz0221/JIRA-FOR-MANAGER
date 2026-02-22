interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsSummaryCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-jira-dark">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
