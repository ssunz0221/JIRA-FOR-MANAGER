import { useChromeStorage } from '@/hooks/useChromeStorage';
import { PatInputForm } from '@/components/options/PatInputForm';
import { ConnectionTest } from '@/components/options/ConnectionTest';
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
        </div>
      </div>
    </div>
  );
}
