import React, { useMemo } from "react";
import { useScanStore } from "../../store/scan-store";
import { RiskBadge } from "../ranked-list/RiskBadge";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export const FileDetailPanel = () => {
  const selectedFilePath = useScanStore((state) => state.selectedFilePath);
  const setSelectedFilePath = useScanStore(
    (state) => state.setSelectedFilePath,
  );
  const fileScores = useScanStore((state) => state.fileScores);
  const scanMeta = useScanStore((state) => state.scanMeta);

  const fileData = useMemo(() => {
    if (!selectedFilePath) return null;
    return fileScores.find((f) => f.filePath === selectedFilePath) || null;
  }, [selectedFilePath, fileScores]);

  const percentiles = useMemo(() => {
    if (!fileData) return null;

    // Helper to calculate percentile of a value in an array
    const calcPercentile = (val: number, arr: number[]) => {
      if (arr.length === 0) return 0;
      const below = arr.filter((x) => x < val).length;
      return Math.round((below / arr.length) * 100);
    };

    const lengths = fileScores.map((f) => f.fileLengthLines);
    const cyclomatics = fileScores.map((f) => f.complexityCyclomatic);
    const depths = fileScores.map((f) => f.complexityMaxNesting);

    return {
      length: calcPercentile(fileData.fileLengthLines, lengths),
      cyclomatic: calcPercentile(fileData.complexityCyclomatic, cyclomatics),
      depth: calcPercentile(fileData.complexityMaxNesting, depths),
    };
  }, [fileData, fileScores]);

  // Mock data for the churn graph stub
  const mockChurnData = [
    { date: "Week 1", commits: 2 },
    { date: "Week 2", commits: 5 },
    { date: "Week 3", commits: 1 },
    { date: "Week 4", commits: 8 },
    { date: "Week 5", commits: 0 },
    { date: "Week 6", commits: 3 },
  ];

  if (!selectedFilePath || !fileData || !percentiles) {
    return null;
  }

  console.log("File data is: ", fileData);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/20 backdrop-blur-[1px] z-40 transition-opacity"
        onClick={() => setSelectedFilePath(null)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-canvas shadow-xl z-50 flex flex-col border-l border-hairline transform transition-transform duration-300 ease-in-out translate-x-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface">
          <div className="flex-1 min-w-0">
            <h2
              className="text-sm font-mono font-medium text-ink truncate mb-2"
              title={fileData.filePath}
            >
              {fileData.filePath}
            </h2>
            <RiskBadge score={fileData.riskScore} />
          </div>
          <button
            onClick={() => setSelectedFilePath(null)}
            className="ml-4 p-2 text-mute hover:text-ink rounded-full hover:bg-surface-soft transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          {/* AI Explanation Section */}
          {fileData.explanation ? (
            <section>
              <h3 className="text-sm font-medium text-ink mb-3 font-display">
                AI Analysis
              </h3>
              <div className="bg-risk-mid/10 border border-risk-mid/20 rounded-lg p-5">
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                  {fileData.explanation}
                </p>
              </div>
            </section>
          ) : scanMeta?.isAnonymous ? (
            <section>
              <h3 className="text-sm font-medium text-ink mb-3 font-display">
                AI Analysis
              </h3>
              <div className="bg-surface-soft border border-hairline rounded-lg p-5 flex flex-col items-center justify-center text-center gap-3">
                <svg
                  className="text-mute"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-ink">
                    AI Explanations Locked
                  </p>
                  <p className="text-xs text-mute mt-1">
                    Sign in to get an AI explanation for why this file is
                    flagged as risky.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Metrics */}
          <section>
            <h3 className="text-sm font-medium text-ink mb-3 font-display">
              Complexity Metrics
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Length */}
              <div className="flex flex-col p-3 rounded-lg border border-hairline bg-surface">
                <span className="text-xs font-medium text-mute uppercase tracking-wider">
                  File Length
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-medium text-ink">
                    {fileData.fileLengthLines}
                  </span>
                  <span className="text-xs text-mute">lines</span>
                </div>
                <p className="text-xs text-mute mt-2">
                  Longer than{" "}
                  <strong className="font-medium text-charcoal">
                    {percentiles.length}%
                  </strong>{" "}
                  of files in this repo.
                </p>
              </div>

              {/* Cyclomatic */}
              <div className="flex flex-col p-3 rounded-lg border border-hairline bg-surface">
                <span className="text-xs font-medium text-mute uppercase tracking-wider">
                  Cyclomatic Complexity
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-medium text-ink">
                    {fileData.complexityCyclomatic}
                  </span>
                </div>
                <p className="text-xs text-mute mt-2">
                  More complex than{" "}
                  <strong className="font-medium text-charcoal">
                    {percentiles.cyclomatic}%
                  </strong>{" "}
                  of files in this repo.
                </p>
              </div>

              {/* Nesting */}
              <div className="flex flex-col p-3 rounded-lg border border-hairline bg-surface">
                <span className="text-xs font-medium text-mute uppercase tracking-wider">
                  Max Nesting Depth
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-medium text-ink">
                    {fileData.complexityMaxNesting}
                  </span>
                </div>
                <p className="text-xs text-mute mt-2">
                  Deeper nesting than{" "}
                  <strong className="font-medium text-charcoal">
                    {percentiles.depth}%
                  </strong>{" "}
                  of files in this repo.
                </p>
              </div>
            </div>
          </section>

          {/* Ownership / Churn Stub */}
          <section>
            <h3 className="text-sm font-medium text-ink mb-3 font-display">
              Ownership & Churn
            </h3>

            <div className="p-4 rounded-lg border border-hairline bg-surface mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-ink">
                  Contributors
                </span>
                <span className="text-sm text-charcoal font-medium">
                  {fileData.uniqueContributors}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-ink">
                  Top Author Share
                </span>
                <span className="text-sm text-charcoal font-medium">
                  {(fileData.topContributorPct * 100).toFixed(0)}%
                </span>
              </div>
              {fileData.topContributorPct > 0.8 && (
                <div className="mt-3 p-2 bg-risk-high/10 rounded border border-risk-high/20 text-xs text-risk-high flex items-start gap-2">
                  <svg
                    className="shrink-0 mt-0.5"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>
                    One person has made most of the recent changes to this file.
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border border-hairline bg-surface">
              <span className="text-xs font-medium text-mute uppercase tracking-wider mb-4 block">
                Commit History (Stub)
              </span>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={mockChurnData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorCommits"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-charcoal)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-charcoal)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-hairline)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "var(--color-ink)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="commits"
                      stroke="var(--color-charcoal)"
                      fillOpacity={1}
                      fill="url(#colorCommits)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-hairline bg-surface-soft flex gap-3">
          <button className="flex-1 px-4 py-2 bg-charcoal text-canvas text-sm font-medium rounded-md hover:bg-ink transition-colors shadow-sm">
            View on GitHub
          </button>
          <button className="flex-1 px-4 py-2 bg-surface text-ink border border-hairline text-sm font-medium rounded-md hover:bg-surface-soft transition-colors shadow-sm">
            Git Blame
          </button>
        </div>
      </div>
    </>
  );
};
