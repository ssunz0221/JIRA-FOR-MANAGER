import { useState, useEffect, useCallback } from 'react';
import { chromeStorageService, type JiraConfig } from '@/services/storage/ChromeStorageService';

export function useChromeStorage() {
  const [config, setConfig] = useState<JiraConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chromeStorageService.getConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  const saveConfig = useCallback(async (newConfig: JiraConfig) => {
    await chromeStorageService.saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  return { config, loading, saveConfig };
}
