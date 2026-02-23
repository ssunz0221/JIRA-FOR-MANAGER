import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Unit } from '@/db/models/Unit';
import clsx from 'clsx';

interface Props {
  epicKey: string;
  epicName: string;
  units: Unit[];
  baseUrl: string;
  onClose: () => void;
}

function statusBadge(statusCategory: string) {
  const styles: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600',
    indeterminate: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  };
  const labels: Record<string, string> = {
    new: 'To Do',
    indeterminate: '진행중',
    done: '완료',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        styles[statusCategory] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {labels[statusCategory] ?? statusCategory}
    </span>
  );
}

function DueDateHistoryRow({ unitKey }: { unitKey: string }) {
  const [open, setOpen] = useState(false);
  const history = useLiveQuery(
    () =>
      db.unitDueDateHistory
        .where('unitKey')
        .equals(unitKey)
        .reverse()
        .toArray(),
    [unitKey],
  );

  if (!history || history.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
      >
        이력 {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-1 w-full overflow-x-auto">
          <table className="min-w-full text-xs border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-gray-500 font-medium">감지 시각</th>
                <th className="px-2 py-1 text-left text-gray-500 font-medium">이전 마감일</th>
                <th className="px-2 py-1 text-left text-gray-500 font-medium">변경 마감일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h) => (
                <tr key={h.id} className="bg-white">
                  <td className="px-2 py-1 text-gray-600">
                    {h.detectedAt.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-2 py-1 text-gray-500">{h.previousDueDate || '-'}</td>
                  <td className="px-2 py-1 font-medium text-gray-800">{h.newDueDate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function EpicDetailModal({ epicKey, epicName, units, baseUrl, onClose }: Props) {
  const handleIssueClick = (jiraKey: string) => {
    window.open(`${baseUrl}/browse/${jiraKey}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-sm font-mono font-medium text-blue-700">
              {epicKey}
            </span>
            <h2 className="text-base font-semibold text-gray-800 truncate max-w-xl">{epicName}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 이슈 수 */}
        <div className="px-6 py-2 text-xs text-gray-400 border-b border-gray-100 shrink-0">
          총 {units.length}개 이슈
        </div>

        {/* 이슈 테이블 */}
        <div className="overflow-y-auto flex-1">
          {units.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              이슈가 없습니다.
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-28">이슈 키</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-28">담당자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-20">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-28">시작일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-44">마감일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-28">해결일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {units.map((unit) => (
                  <tr key={unit.jiraKey} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleIssueClick(unit.jiraKey)}
                        className="font-mono text-sm text-blue-600 hover:underline"
                      >
                        {unit.jiraKey}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate" title={unit.summary}>
                      {unit.summary}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {unit.assigneeName ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(unit.statusCategory)}
                    </td>
                    {/* 시작일 (customfield_10917) */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {unit.startDate ?? '-'}
                    </td>
                    {/* 마감일: dueDate 우선, 없으면 endDate(customfield_10918) 대체 */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex flex-wrap items-center gap-1">
                        {unit.dueDate ? (
                          <span>{unit.dueDate}</span>
                        ) : unit.endDate ? (
                          <>
                            <span>{unit.endDate}</span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                              마감일 없음
                            </span>
                          </>
                        ) : (
                          <span>-</span>
                        )}
                        <DueDateHistoryRow unitKey={unit.jiraKey} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {unit.resolutionDate ? unit.resolutionDate.slice(0, 10) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
