import { useChromeStorage } from '@/hooks/useChromeStorage';
import { PatInputForm } from '@/components/options/PatInputForm';
import { ConnectionTest } from '@/components/options/ConnectionTest';
import { SyncProjectForm } from '@/components/options/SyncProjectForm';
import { EstimationSettingForm } from '@/components/options/EstimationSettingForm';
import { DefaultTeamsForm } from '@/components/options/DefaultTeamsForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function OptionsPage() {
  const { config, loading, saveConfig } = useChromeStorage();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="text-2xl font-bold text-jira-dark">JIRA PMS Settings</h1>
        <p className="mt-1 text-sm text-gray-500">JIRA 서버 연결 정보를 설정합니다.</p>

        <div className="mt-8 space-y-8">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">JIRA 연결 설정</h2>
            <PatInputForm config={config} onSave={saveConfig} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">연결 테스트</h2>
            <ConnectionTest config={config} />
          </section>

          {config && (
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">동기화 에픽 선택</h2>
              <SyncProjectForm config={config} onSave={saveConfig} />
            </section>
          )}

          {config && (
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">기본 팀 설정</h2>
              <DefaultTeamsForm config={config} onSave={saveConfig} />
            </section>
          )}

          {config && (
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">추정치 설정</h2>
              <p className="mb-4 text-sm text-gray-500">
                동기화 시 이슈에서 가져올 추정치 유형을 선택합니다.
              </p>
              <EstimationSettingForm config={config} onSave={saveConfig} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
