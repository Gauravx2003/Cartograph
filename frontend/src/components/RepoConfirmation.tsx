import { useState, useEffect } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../store/AuthContext";
import type { GithubRepo } from "./RepoPicker";

export interface RepoDetails extends GithubRepo {
  sizeKb: number;
}

const ANONYMOUS_SIZE_CAP_KB = 50000; // 50MB

export const RepoConfirmation = ({
  repoFullName,
  onCancel,
  onScan,
}: {
  repoFullName: string;
  onCancel: () => void;
  onScan: (details: RepoDetails, explanationsRequested: boolean) => void;
}) => {
  const { user } = useAuth();
  const [details, setDetails] = useState<RepoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanationsRequested, setExplanationsRequested] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await apiClient.get<RepoDetails>(
          `/repos/github/${repoFullName}`,
        );
        setDetails(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Repository not found or is private (try logging in).");
        } else {
          setError("Failed to fetch repository details.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [repoFullName]);

  if (loading) {
    return (
      <div className="w-full max-w-135 flex flex-col items-center py-12">
        <span className="font-mono text-sm text-mute animate-pulse">
          Loading repository details...
        </span>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="w-full max-w-135 flex flex-col items-center text-center space-y-4 py-8">
        <p className="text-body">{error}</p>
        <button
          onClick={onCancel}
          className="text-link hover:text-ink font-medium text-sm transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  console.log("Size is: ", details.sizeKb);
  console.log("Size cap is: ", ANONYMOUS_SIZE_CAP_KB);

  const exceedsAnonymousCap = !user && details.sizeKb > ANONYMOUS_SIZE_CAP_KB;
  console.log("Exceeds cap is: ", exceedsAnonymousCap);

  return (
    <div className="w-full max-w-135 flex flex-col items-center bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
      <div className="w-full flex items-center justify-between border-b border-hairline pb-4 mb-4">
        <div className="flex flex-col text-left">
          <span className="font-sans text-xs text-mute font-medium uppercase tracking-wider mb-1">
            Confirm Target
          </span>
          <span className="font-mono text-lg text-ink font-medium">
            {details.fullName}
          </span>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="font-sans text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-soft text-charcoal border border-hairline">
            {details.isPrivate ? "Private" : "Public"}
          </span>
          <span className="font-mono text-[10px] text-mute border border-hairline px-2 rounded-sm bg-surface-soft">
            {details.defaultBranch}
          </span>
        </div>
      </div>

      {exceedsAnonymousCap && (
        <div className="w-full bg-surface-soft border border-hairline p-4 rounded-md mb-6 text-left">
          <p className="font-sans text-sm text-ink font-medium mb-1">
            Repository Size Warning
          </p>
          <p className="font-sans text-xs text-body mb-3 leading-relaxed">
            This repository is approximately {Math.round(details.sizeKb / 1024)}
            MB. Anonymous scans are capped at{" "}
            {Math.round(ANONYMOUS_SIZE_CAP_KB / 1024)}MB. Please connect your
            GitHub account to scan larger repositories, or the scan may fail.
          </p>
          <a
            href="http://localhost:4000/api/auth/github"
            className="text-link hover:text-ink font-medium text-sm transition-colors"
          >
            Connect with GitHub →
          </a>
        </div>
      )}

      {user && (
        <div className="w-full flex items-center gap-3 mb-6 p-4 bg-surface-soft border border-hairline rounded-md">
          <input
            type="checkbox"
            id="explanationsRequested"
            checked={explanationsRequested}
            onChange={(e) => setExplanationsRequested(e.target.checked)}
            className="w-4 h-4 rounded border-hairline text-ink focus:ring-ink"
          />
          <label
            htmlFor="explanationsRequested"
            className="flex flex-col cursor-pointer select-none"
          >
            <span className="font-sans text-sm text-ink font-medium">
              Generate AI explanations for top risky files
            </span>
            <span className="font-sans text-xs text-mute mt-0.5">
              Sends structural signals of the top 10 files to the AI model.
            </span>
          </label>
        </div>
      )}

      <div className="w-full flex gap-3 mt-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-surface-soft hover:bg-hairline text-ink font-sans font-medium text-sm rounded-full h-10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onScan(details, explanationsRequested)}
          className="flex-1 bg-ink hover:bg-ink-deep text-on-dark font-sans font-medium text-sm rounded-full h-10 transition-colors"
        >
          Generate report
        </button>
      </div>
    </div>
  );
};
