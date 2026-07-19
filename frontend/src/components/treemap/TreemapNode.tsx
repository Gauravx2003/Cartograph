import type { DirectoryNode } from "../../store/scan-selectors";

interface TreemapNodeProps {
  node: any; // Nivo treemap node
  //animatedProps: any;
  onClick: (node: any) => void;
  onMouseEnter: (node: any) => void;
  onMouseLeave: (node: any) => void;
  visibleIds: Set<string>;
  isSearchActive: boolean;  
  hoveredFilePath: string | null;
}

export const TreemapNode = ({
  node,
  //animatedProps,
  onClick,
  onMouseEnter,
  onMouseLeave,
  visibleIds,
  isSearchActive,
  hoveredFilePath,
}: TreemapNodeProps) => {
  const isLeaf = node.isLeaf;
  const data = node.data as DirectoryNode;

  // Design system risk colors based on simple thresholds
  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return "var(--color-risk-low)";
    if (risk < 0.7) return "var(--color-risk-mid)";
    return "var(--color-risk-high)";
  };

  const bgColor = isLeaf
    ? getRiskColor(data.riskScore)
    : "var(--color-surface-soft)";
  const strokeColor = isLeaf ? "var(--color-canvas)" : "var(--color-hairline)";

  let opacity = 1;
  if (isLeaf && isSearchActive) {
    if (data.fileScore && !visibleIds.has(data.fileScore.id)) {
      opacity = 0.15;
    }
  }

  // Add hover effect highlight if this node's path matches the hovered path
  // or if a directory is hovered and this file is inside it.
  const isHovered = hoveredFilePath && data.path.startsWith(hoveredFilePath);
  if (isHovered && isLeaf && opacity > 0.15) {
    opacity = 1;
  } else if (hoveredFilePath && !isHovered && opacity > 0.15) {
    // dim others slightly when hovering
    opacity = 0.6;
  }

  const transform = `translate(${node.x},${node.y})`;
  const width = node.width;
  const height = node.height;

  return (
    <g transform={transform}>
      <rect
        width={width > 0 ? width : 0}
        height={height > 0 ? height : 0}
        fill={bgColor}
        stroke={strokeColor}
        strokeWidth={isLeaf ? 1 : 1.5}
        opacity={opacity}
        onClick={() => onClick(node)}
        onMouseEnter={() => onMouseEnter(node)}
        onMouseLeave={() => onMouseLeave(node)}
        style={{ cursor: "pointer", transition: "opacity 0.15s ease-in-out" }}
      />

      {/* Label for leaves if there's space */}
      {isLeaf && width > 40 && height > 20 && (
        <text
          x={4}
          y={14}
          fill="var(--color-canvas)"
          fontSize={10}
          fontFamily="var(--font-mono)"
          opacity={opacity === 1 ? 0.9 : 0}
          style={{ pointerEvents: "none" }}
        >
          {data.name}
        </text>
      )}

      {/* Label for directories if there's space */}
      {!isLeaf && width > 50 && height > 24 && (
        <rect
          x={0}
          y={0}
          width={width}
          height={20}
          fill="var(--color-surface-soft)"
          opacity={0.8}
          style={{ pointerEvents: "none" }}
        />
      )}
      {!isLeaf && width > 50 && height > 24 && (
        <text
          x={4}
          y={14}
          fill="var(--color-charcoal)"
          fontSize={10}
          fontFamily="var(--font-mono)"
          fontWeight="500"
          style={{ pointerEvents: "none" }}
        >
          {data.name}/
        </text>
      )}
    </g>
  );
};
