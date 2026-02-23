import type { DateRange } from '@/hooks/useMetrics';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const handleStart = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, start: e.target.value });
  };

  const handleEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, end: e.target.value });
  };

  const handleReset = () => {
    onChange({ start: '', end: '' });
  };

  const isActive = value.start || value.end;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600">기간 조회</span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.start}
          onChange={handleStart}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        />
        <span className="text-gray-400">~</span>
        <input
          type="date"
          value={value.end}
          onChange={handleEnd}
          placeholder="오늘"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>
      {!value.end && value.start && (
        <span className="text-xs text-gray-400">종료일 미입력 시 오늘까지 조회</span>
      )}
      {isActive && (
        <button
          onClick={handleReset}
          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          초기화
        </button>
      )}
    </div>
  );
}
