import { useState } from 'react';
import { apiClient } from '../lib/api-client';
import toast from 'react-hot-toast';
import type { RepoDetails } from '../components/RepoConfirmation';

export const useRepoScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = async (details: RepoDetails, explanationsRequested: boolean = false): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create or ensure the repo exists in our database
      const repoResponse = await apiClient.post('/repos', {
        owner: details.owner,
        name: details.name,
        githubRepoId: details.fullName, // Using fullName as a unique fallback for githubRepoId if missing
        defaultBranch: details.defaultBranch,
        isPrivate: details.isPrivate,
      });

      const repoId = repoResponse.data.id;

      // 2. Queue the scan
      const scanResponse = await apiClient.post(`/repos/${repoId}/scans`, { explanationsRequested });
      
      return scanResponse.data.scanId;
    } catch (err: any) {
      console.error('Failed to start scan', err);
      // Fallback simple message, but we might want to surface specific messages 
      // from backend like rate limit hit, etc.
      if (err.response?.status === 429) {
        const msg = 'Anonymous Repo Scan limit has reached for you IP. Please Login to continue';
        setError(msg);
        toast.error(msg, { duration: 5000 });
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
        toast.error(err.response.data.error);
      } else {
        setError('Failed to initiate the scan. Please try again.');
        toast.error('Failed to initiate the scan. Please try again.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { startScan, loading, error };
};
