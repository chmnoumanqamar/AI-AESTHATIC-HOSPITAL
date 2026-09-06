import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useQueueStream(doctorId?: string, date?: string, pollIntervalMs = 5000) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get('/queue', {
        params: { doctorId, date }
      });
      setQueue(res.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch live queue stream');
    } finally {
      setLoading(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchQueue, pollIntervalMs]);

  return { queue, loading, error, refreshQueue: fetchQueue };
}
