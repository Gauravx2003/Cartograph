import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

export type ScanStatusValue = 
  | 'QUEUED'
  | 'CLONING'
  | 'ANALYZING'
  | 'SCORING'
  | 'GENERATING_EXPLANATIONS'
  | 'COMPLETED'
  | 'FAILED';

export interface ScanData {
  id: string;
  repoId: string;
  status: ScanStatusValue;
  isAnonymous: boolean;
  explanationsRequested: boolean;
  errorMessage?: string;
}

export const useScanStatus = (scanId: string | null) => {
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      setScan(null);
      setError(null);
      return;
    }

    let isMounted = true;
    let timeoutId: number;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<ScanData>(`/scans/${scanId}`);
        
        if (!isMounted) return;
        
        setScan(data);
        setError(null);

        if (data.status !== 'COMPLETED' && data.status !== 'FAILED') {
          // Poll again after 2 seconds
          timeoutId = window.setTimeout(fetchStatus, 2000);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to fetch scan status:', err);
        setError(err.response?.data?.error || 'Failed to check scan progress.');
        
        // Stop polling on error, unless we want to retry. We'll stop for now.
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [scanId]);

  return { scan, loading, error };
};
