import { useState, useEffect } from "react";
import { apiClient } from "../lib/api-client";

export interface GithubRepo {
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  defaultBranch: string;
}

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="opacity-60"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export const RepoPicker = ({
  onConfirm,
}: {
  onConfirm: (repo: string) => void;
}) => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const { data } = await apiClient.get<GithubRepo[]>("/repos/github");
        setRepos(data);
      } catch (err) {
        console.error("Failed to fetch repos", err);
        setError("Failed to load repositories.");
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const filteredRepos = repos.filter((repo) =>
    repo.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center mt-6">
      <div className="w-full bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-3 border-b border-hairline">
          <input
            type="text"
            placeholder="Search your repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-soft text-ink font-sans text-sm rounded-md border border-hairline px-3 h-10 outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="flex-1 max-h-75 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-mute">
              Loading repositories...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-risk-high">
              {error}
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="p-4 text-center text-sm text-mute">
              No repositories found.
            </div>
          ) : (
            <ul className="flex flex-col">
              {filteredRepos.map((repo) => (
                <li key={repo.fullName}>
                  <button
                    onClick={() => onConfirm(repo.fullName)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-soft text-left transition-colors border-b border-hairline last:border-b-0"
                  >
                    <span className="font-mono text-sm text-ink">
                      {repo.fullName}
                    </span>
                    {repo.isPrivate && <LockIcon />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
