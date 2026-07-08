import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/api';

const BackendContext = createContext({
  connected: false,
  loading: true,
  aiMode: 'local',
  storageMode: 'local_json',
  refresh: () => {},
});

export function BackendProvider({ children }) {
  const [status, setStatus] = useState({
    connected: false,
    loading: true,
    aiMode: 'local',
    storageMode: 'local_json',
  });

  const refresh = useCallback(async () => {
    try {
      const res = await checkBackendHealth();
      setStatus({
        connected: res.data.status === 'healthy',
        loading: false,
        aiMode: res.data.ai_mode || 'local',
        storageMode: res.data.storage_mode || 'local_json',
      });
    } catch {
      setStatus({ connected: false, loading: false, aiMode: 'local', storageMode: 'local_json' });
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <BackendContext.Provider value={{ ...status, refresh }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  return useContext(BackendContext);
}
