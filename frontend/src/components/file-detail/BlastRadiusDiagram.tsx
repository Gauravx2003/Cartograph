import React, { useMemo } from "react";
import { useScanStore } from "../../store/scan-store";

interface BlastRadiusDiagramProps {
  selectedFilePath: string;
  imports: string[];
  importedBy: string[];
  fileRiskScore: number;
}

export const BlastRadiusDiagram: React.FC<BlastRadiusDiagramProps> = ({
  selectedFilePath,
  imports,
  importedBy,
  fileRiskScore,
}) => {
  const setSelectedFilePath = useScanStore(
    (state) => state.setSelectedFilePath,
  );
  const fileScores = useScanStore((state) => state.fileScores);

  const getScore = (path: string) => {
    return fileScores.find((f) => f.filePath === path)?.riskScore || 0;
  };

  const getRiskDetails = (score: number) => {
    if (score >= 0.7)
      return { label: "High", class: "bg-risk-high text-canvas" };
    if (score >= 0.3) return { label: "Med", class: "bg-risk-mid text-canvas" };
    return { label: "Low", class: "bg-risk-low text-canvas" };
  };

  const centerDetails = getRiskDetails(fileRiskScore);

  const dependents = useMemo(() => {
    return [...importedBy].sort((a, b) => getScore(b) - getScore(a));
  }, [importedBy, fileScores]);

  const dependencies = useMemo(() => {
    return [...imports];
  }, [imports]);

  const width = 500;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;

  const truncateFilename = (filename: string) => {
    const maxChars = 16;
    return filename.length > maxChars
      ? filename.substring(0, maxChars - 1) + "…"
      : filename;
  };

  const computeLayout = (nodes: string[]) => {
    let renderCount = Math.min(8, nodes.length);
    let computedRadius = 140;
    const spanDeg = 150;
    const spanRad = (spanDeg * Math.PI) / 180;

    while (renderCount > 1) {
      const angleStepRad = spanRad / (renderCount - 1);
      const minRequiredRadius = 136 / (2 * Math.sin(angleStepRad / 2));
      if (minRequiredRadius <= 220) {
        computedRadius = Math.max(140, minRequiredRadius);
        break;
      }
      renderCount--;
    }

    if (renderCount === 1) {
      computedRadius = 140;
    }

    return { renderCount, computedRadius, spanDeg };
  };

  const dependentsLayout = computeLayout(dependents);
  const dependenciesLayout = computeLayout(dependencies);

  const renderNodes = (
    allNodes: string[],
    isDependents: boolean,
    layout: { renderCount: number; computedRadius: number; spanDeg: number },
  ) => {
    const { renderCount, computedRadius, spanDeg } = layout;
    const nodesToRender = allNodes.slice(0, renderCount);

    return nodesToRender.map((path, idx) => {
      let angleDeg = isDependents ? 270 : 90; // default for n=1
      if (renderCount > 1) {
        if (isDependents) {
          const start = 270 - spanDeg / 2; // 195
          angleDeg = start + (idx / (renderCount - 1)) * spanDeg;
        } else {
          const start = 90 - spanDeg / 2; // 15
          angleDeg = start + (idx / (renderCount - 1)) * spanDeg;
        }
      }

      const angleRad = (angleDeg * Math.PI) / 180;
      const x = cx + computedRadius * Math.cos(angleRad);
      const y = cy + computedRadius * Math.sin(angleRad);

      const parts = path.split("/");
      const filename = parts[parts.length - 1];
      const truncatedFilename = truncateFilename(filename);

      const lineRadiusStart = 35; // outer edge of center node
      const lineRadiusEnd = computedRadius - 60; // leave room for foreignObject

      const lineStartX = cx + lineRadiusStart * Math.cos(angleRad);
      const lineStartY = cy + lineRadiusStart * Math.sin(angleRad);
      const lineEndX = cx + lineRadiusEnd * Math.cos(angleRad);
      const lineEndY = cy + lineRadiusEnd * Math.sin(angleRad);

      return (
        <g key={path}>
          {isDependents ? (
            <line
              x1={lineStartX}
              y1={lineStartY}
              x2={lineEndX}
              y2={lineEndY}
              stroke="var(--color-ink)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead-solid)"
            />
          ) : (
            <line
              x1={lineEndX}
              y1={lineEndY}
              x2={lineStartX}
              y2={lineStartY}
              stroke="var(--color-mute)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              markerEnd="url(#arrowhead-dashed)"
            />
          )}

          <foreignObject
            x={x - 60}
            y={y - 12}
            width={120}
            height={24}
            className="overflow-visible"
          >
            <div className="flex items-center justify-center w-full h-full">
              <button
                onClick={() => setSelectedFilePath(path)}
                className="px-2 py-0.5 max-w-[120px] bg-surface-card border border-hairline-strong rounded-md text-[10px] font-mono text-ink hover:border-ink hover:shadow-sm truncate transition-all duration-200"
                title={path}
              >
                {truncatedFilename}
              </button>
            </div>
          </foreignObject>
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col items-center bg-surface border border-hairline rounded-lg p-4 w-full">
      <div className="relative w-full flex items-center justify-center">
        <svg
          width={width}
          height={height}
          className="overflow-visible max-w-full h-auto"
        >
          <defs>
            <marker
              id="arrowhead-solid"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-ink)" />
            </marker>
            <marker
              id="arrowhead-dashed"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-mute)" />
            </marker>
          </defs>

          {/* Shockwaves for dependents */}
          {dependentsLayout.renderCount > 0 && (
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={dependentsLayout.computedRadius * 0.4}
                fill="none"
                stroke="var(--color-hairline-strong)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="opacity-50"
              />
              <circle
                cx={cx}
                cy={cy}
                r={dependentsLayout.computedRadius * 0.7}
                fill="none"
                stroke="var(--color-hairline-strong)"
                strokeWidth="1"
                strokeDasharray="6 6"
                className="opacity-30"
              />
            </g>
          )}

          {renderNodes(dependents, true, dependentsLayout)}
          {renderNodes(dependencies, false, dependenciesLayout)}

          {/* Center Node */}
          <foreignObject x={cx - 30} y={cy - 30} width={60} height={60}>
            <div className="flex items-center justify-center w-full h-full">
              <div
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-sm font-bold ${centerDetails.class}`}
                title={selectedFilePath}
              >
                <span className="text-[10px] leading-tight opacity-90 uppercase tracking-wider">
                  {centerDetails.label}
                </span>
                <span className="text-sm leading-tight">
                  {(fileRiskScore * 10).toFixed(1)}
                </span>
              </div>
            </div>
          </foreignObject>
        </svg>

        {/* Floating Overflow Text */}
        {dependents.length > dependentsLayout.renderCount && (
          <div className="absolute top-4 right-4 bg-surface-card border border-hairline px-2 py-1 rounded text-[10px] font-medium text-charcoal shadow-sm">
            +{dependents.length - dependentsLayout.renderCount} more imported by
          </div>
        )}
        {dependencies.length > dependenciesLayout.renderCount && (
          <div className="absolute bottom-4 right-4 bg-surface-card border border-hairline px-2 py-1 rounded text-[10px] font-medium text-charcoal shadow-sm">
            +{dependencies.length - dependenciesLayout.renderCount} more imports
          </div>
        )}
      </div>

      {/* Legend below the diagram */}
      <div className="mt-4 text-xs flex justify-center items-center gap-6 text-mute border-t border-hairline pt-4 w-full">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm border border-hairline bg-surface-card flex items-center justify-center">
            <div className="w-2 h-0.5 bg-ink" />
          </div>
          <span>Imported by — blast radius</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm border border-hairline bg-surface-card flex items-center justify-center">
            <div className="w-2 h-0.5 border-t border-dashed border-mute" />
          </div>
          <span>Imports — foundation</span>
        </div>
      </div>
    </div>
  );
};
