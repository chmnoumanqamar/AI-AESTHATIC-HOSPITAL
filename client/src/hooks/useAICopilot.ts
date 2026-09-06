import { useState, useCallback } from 'react';
import { api } from '../services/api';

export function useAICopilot(sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post('/ai/chat', {
          message,
          sessionId
        });
        return res.data.data;
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'AI Copilot communication failed';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  return { sendMessage, loading, error };
}
