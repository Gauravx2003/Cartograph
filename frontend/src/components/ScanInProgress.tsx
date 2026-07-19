import { useEffect } from "react";
import { useScanStatus, type ScanStatusValue } from "../hooks/useScanStatus";

const STAGES: ScanStatusValue[] = [
  "QUEUED",
  "CLONING",
  "ANALYZING",
  "SCORING",
  "GENERATING_EXPLANATIONS",
  "COMPLETED",
];

export const ScanInProgress = ({
  scanId,
  onReset,
  onComplete,
}: {
  scanId: string;
  onReset: () => void;
  onComplete: (scanId: string) => void;
}) => {
  const { scan, error } = useScanStatus(scanId);

  useEffect(() => {
    if (scan?.status === "COMPLETED") {
      onComplete(scan.id);
    }
  }, [scan?.status, scan?.id, onComplete]);

  // Failure handling per Step 7
  if (error || scan?.status === "FAILED") {
    const errorMsg =
      error ||
      scan?.errorMessage ||
      "An unexpected error occurred during the scan.";
    const isRateLimit = errorMsg.toLowerCase().includes("rate limit");
    const isSizeCap =
      errorMsg.toLowerCase().includes("size cap") ||
      errorMsg.toLowerCase().includes("too large");
    const isPrivateAuth =
      errorMsg.toLowerCase().includes("unauthorized") ||
      errorMsg.toLowerCase().includes("private");

    return (
      <div className="w-full max-w-[540px] flex flex-col items-center bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
        <h2 className="font-sans text-lg font-medium text-ink mb-4">
          Scan Failed
        </h2>

        <p className="text-body text-sm mb-6 text-center">{errorMsg}</p>

        {(isRateLimit || isSizeCap || isPrivateAuth) && (
          <div className="flex flex-col items-center gap-4 mb-2">
            <p className="text-sm text-body text-center max-w-sm">
              {isRateLimit &&
                "Anonymous scans are rate-limited. Connect your GitHub account to lift this limit."}
              {isSizeCap &&
                "This repository exceeds the anonymous file-size cap. Connect your GitHub account to scan larger repositories."}
              {isPrivateAuth &&
                "Private repositories require a connected GitHub account."}
            </p>
            <a
              href="http://localhost:4000/api/auth/github"
              className="bg-ink hover:bg-ink-deep text-on-dark font-sans font-medium text-sm rounded-full h-10 px-6 flex items-center transition-colors"
            >
              Connect with GitHub
            </a>
          </div>
        )}

        <button
          onClick={onReset}
          className="mt-6 text-link hover:text-ink font-medium text-sm transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  // Determine active stages
  let activeStages = STAGES.filter((s) => s !== "FAILED");
  if (scan?.isAnonymous) {
    activeStages = activeStages.filter((s) => s !== "GENERATING_EXPLANATIONS");
  }

  // Find current index
  const currentIndex = scan ? activeStages.indexOf(scan.status) : 0;

  return (
    <div className="w-full max-w-[540px] flex flex-col items-center bg-canvas border border-hairline rounded-lg p-8 shadow-sm">
      <div className="font-sans text-xs text-mute font-medium uppercase tracking-wider mb-6">
        Analysis Pipeline
      </div>

      <div className="flex flex-col items-start space-y-4 w-full max-w-[320px]">
        {activeStages.map((stage, idx) => {
          const isPast = scan && currentIndex > idx;
          const isCurrent = scan && currentIndex === idx;

          let icon = "○";
          if (isPast) icon = "✓";
          if (isCurrent) icon = "●";

          let textClass = "text-mute";
          if (isPast) textClass = "text-ink";
          if (isCurrent) textClass = "text-ink font-medium animate-pulse";

          return (
            <div
              key={stage}
              className={`flex items-center gap-3 font-mono text-sm ${textClass}`}
            >
              <span className="w-4 text-center">{icon}</span>
              <span>{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
