import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { TreemapGlyph } from "../components/TreemapGlyph";
import { HeatmapPreviewCard } from "../components/HeatmapPreviewCard";
import { RepoInputPill } from "../components/RepoInputPill";
import { RepoPicker } from "../components/RepoPicker";
import { RepoConfirmation } from "../components/RepoConfirmation";
import type { RepoDetails } from "../components/RepoConfirmation";
import { ScanInProgress } from "../components/ScanInProgress";
import { useRepoScan } from "../hooks/useRepoScan";
import baseUrl from "../lib/api-client";

export const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const { startScan, loading: scanning } = useRepoScan();

  console.log("selected repo: ", selectedRepo);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <TreemapGlyph />
      </div>
    );
  }

  const handleRepoConfirm = (repo: string) => {
    setSelectedRepo(repo);
  };

  const handleScan = async (
    details: RepoDetails,
    explanationsRequested: boolean,
  ) => {
    const newScanId = await startScan(details, explanationsRequested);
    if (newScanId) {
      setScanId(newScanId);
    }
  };

  const handleScanComplete = (completedScanId: string) => {
    console.log("Scan complete! Navigation to report:", completedScanId);
    navigate(`/report/${completedScanId}`);
  };

  return (
    <div className="min-h-screen bg-canvas text-body font-sans flex flex-col items-center justify-center p-8">
      <div className="max-w-[720px] w-full flex flex-col items-center">
        {scanId ? (
          <>
            <TreemapGlyph />
            <div className="mb-12">
              <h1 className="font-display text-[28px] leading-[1.11] font-medium text-ink tracking-[-0.01em]">
                Cartograph
              </h1>
            </div>
            <ScanInProgress
              scanId={scanId}
              onReset={() => {
                setScanId(null);
                setSelectedRepo(null);
              }}
              onComplete={handleScanComplete}
            />
          </>
        ) : selectedRepo ? (
          <>
            <TreemapGlyph />
            <div className="mb-12">
              <h1 className="font-display text-[28px] leading-[1.11] font-medium text-ink tracking-[-0.01em]">
                Cartograph
              </h1>
            </div>
            <RepoConfirmation
              repoFullName={selectedRepo}
              onCancel={() => setSelectedRepo(null)}
              onScan={handleScan}
            />
            {scanning && (
              <div className="mt-4 text-sm text-mute animate-pulse">
                Starting scan...
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-center w-full">
            <TreemapGlyph />

            <h1 className="font-display text-[36px] leading-[1.11] font-medium text-ink tracking-[-0.01em]">
              Cartograph
            </h1>

            <HeatmapPreviewCard />

            <p className="text-base text-body max-w-lg mx-auto leading-relaxed mb-8">
              Connect your GitHub repository to generate an automated risk-score
              heatmap. Cartograph analyzes code churn, cyclomatic complexity,
              and bus factor to help you identify the most volatile files in
              your codebase.
            </p>

            <RepoInputPill onConfirm={handleRepoConfirm} />

            {!user && (
              <a
                href={`${baseUrl}/api/auth/github`}
                className="mt-2 flex items-center justify-center gap-2 text-link hover:text-ink font-sans font-medium text-sm transition-colors"
              >
                {/* Added optional width and height to ensure the SVG scales nicely with the text */}
                <img
                  src="github-icon.svg"
                  alt="GitHub Logo"
                  className="w-5 h-5"
                />
                <span>Connect with GitHub</span>
              </a>
            )}

            {user && (
              <div className="w-full mt-8 flex flex-col items-center">
                <div className="text-sm text-body mb-4">
                  Signed in as{" "}
                  <span className="font-medium text-ink">{user.username}</span>.
                </div>
                <div className="w-full text-left max-w-lg mb-2 pl-1 font-sans text-sm font-medium text-ink">
                  Import from GitHub
                </div>
                <RepoPicker onConfirm={handleRepoConfirm} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
