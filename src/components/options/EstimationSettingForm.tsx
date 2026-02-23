import { useState } from 'react';
import type { JiraConfig } from '@/services/storage/ChromeStorageService';
import { JiraApiClient } from '@/services/jira/JiraApiClient';
import type { JiraFieldDefinition } from '@/services/jira/types';

interface Props {
  config: JiraConfig;
  onSave: (config: JiraConfig) => Promise<void>;
}

export function EstimationSettingForm({ config, onSave }: Props) {
  const [estimationType, setEstimationType] = useState<'storyPoint' | 'estimate' | ''>(
    config.estimationType ?? '',
  );
  const [spFieldId, setSpFieldId] = useState(config.storyPointFieldId ?? '');
  const [estFieldId, setEstFieldId] = useState(config.estimateFieldId ?? '');
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDetect = async (target: 'storyPoint' | 'estimate') => {
    if (!config.baseUrl || !config.pat) {
      setMessage({ type: 'error', text: 'JIRA 연결 설정을 먼저 저장해주세요.' });
      return;
    }

    setDetecting(true);
    setMessage(null);

    try {
      const client = new JiraApiClient(config.baseUrl, config.pat);
      const fields: JiraFieldDefinition[] = await client.getFields();

      if (target === 'storyPoint') {
        const found = fields.find(
          (f) =>
            f.custom &&
            (f.name === 'Story Points' || f.name === 'Story point estimate'),
        );
        if (found) {
          setSpFieldId(found.id);
          setMessage({ type: 'success', text: `감지됨: ${found.name} (${found.id})` });
        } else {
          setMessage({ type: 'error', text: 'Story Point 필드를 찾을 수 없습니다. 수동으로 입력해주세요.' });
        }
      } else {
        const found = fields.find(
          (f) =>
            f.custom &&
            (f.name === 'Original Estimate' ||
              f.name === 'Original estimate' ||
              f.name === '원래 예상'),
        );
        if (found) {
          setEstFieldId(found.id);
          setMessage({ type: 'success', text: `감지됨: ${found.name} (${found.id})` });
        } else {
          setMessage({
            type: 'success',
            text: '커스텀 Estimate 필드를 찾지 못했습니다. 비워두면 기본 timetracking을 사용합니다.',
          });
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `필드 감지 실패: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await onSave({
        ...config,
        estimationType: estimationType || undefined,
        storyPointFieldId: spFieldId || undefined,
        estimateFieldId: estFieldId || undefined,
      });
      setMessage({ type: 'success', text: '추정치 설정이 저장되었습니다.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `저장 실패: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 타입 선택 */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="estimationType"
            value="storyPoint"
            checked={estimationType === 'storyPoint'}
            onChange={() => setEstimationType('storyPoint')}
            className="text-blue-600"
          />
          Story Point
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="estimationType"
            value="estimate"
            checked={estimationType === 'estimate'}
            onChange={() => setEstimationType('estimate')}
            className="text-blue-600"
          />
          Estimate (시간)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="estimationType"
            value=""
            checked={estimationType === ''}
            onChange={() => setEstimationType('')}
            className="text-blue-600"
          />
          사용 안 함
        </label>
      </div>

      {/* Story Point 필드 설정 */}
      {estimationType === 'storyPoint' && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Story Point 필드 ID</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={spFieldId}
              onChange={(e) => setSpFieldId(e.target.value)}
              placeholder="예: customfield_10016"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => handleDetect('storyPoint')}
              disabled={detecting}
              className="rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              {detecting ? '감지 중...' : '자동 감지'}
            </button>
          </div>
        </div>
      )}

      {/* Estimate 필드 설정 */}
      {estimationType === 'estimate' && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Estimate 커스텀 필드 ID</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={estFieldId}
              onChange={(e) => setEstFieldId(e.target.value)}
              placeholder="비워두면 timetracking 사용"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => handleDetect('estimate')}
              disabled={detecting}
              className="rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              {detecting ? '감지 중...' : '자동 감지'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            비워두면 기본 timetracking.originalEstimate를 사용합니다.
          </p>
        </div>
      )}

      {/* 저장 버튼 */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-jira-blue px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '저장 중...' : '저장'}
      </button>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
