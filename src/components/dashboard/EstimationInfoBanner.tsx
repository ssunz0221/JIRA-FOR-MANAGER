interface Props {
  estimationType?: 'storyPoint' | 'estimate';
}

export function EstimationInfoBanner({ estimationType }: Props) {
  if (!estimationType) return null;

  const label = estimationType === 'storyPoint' ? '스토리 포인트' : '추정치(시간)';

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <p className="font-medium mb-1">집계 규칙 ({label})</p>
      <ul className="list-disc pl-5 space-y-0.5 text-blue-700 text-xs">
        <li>서브태스크가 없는 이슈 → 이슈 자체의 {label} 사용</li>
        <li>
          서브태스크가 있는 이슈 → 모든 서브태스크에 값이 있으면 서브태스크 합계,
          일부라도 없으면 부모 이슈의 값 사용
        </li>
        <li>
          처리 건수: 같은 날 부모+서브태스크 모두 완료 시 서브태스크만 카운트 (중복 방지)
        </li>
      </ul>
    </div>
  );
}
