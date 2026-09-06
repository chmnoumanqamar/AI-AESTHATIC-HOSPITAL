import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useTokenMatrix(doctorId: string, date?: string) {
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await api.get('/tokens/matrix', {
        params: { doctorId, date }
      });
      setMatrix(res.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch token matrix');
    } finally {
      setLoading(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  return { matrix, loading, error, refreshMatrix: fetchMatrix };
}
