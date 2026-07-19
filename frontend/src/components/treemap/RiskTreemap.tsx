import { useState, useMemo, useCallback } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import {
  useDirectoryTree,
  useVisibleFileScores,
  type DirectoryNode,
} from "../../store/scan-selectors";
import { useScanStore } from "../../store/scan-store";
import { TreemapNode } from "./TreemapNode";

export type SizeMetric = "size" | "churn" | "complexity";

export const RiskTreemap = () => {
  const rootTree = useDirectoryTree();
  const visibleFileScores = useVisibleFileScores();
  const searchQuery = useScanStore((state) => state.searchQuery);
  const activeFilters = useScanStore((state) => state.activeFilters);
  const hoveredFilePath = useScanStore((state) => state.hoveredFilePath);
  const setHoveredFilePath = useScanStore((state) => state.setHoveredFilePath);
  const setSelectedFilePath = useScanStore(
    (state) => state.setSelectedFilePath,
  );

  const [sizeMetric, setSizeMetric] = useState<SizeMetric>("size");
  const [zoomedPath, setZoomedPath] = useState<string>("");

  // Determine if any search/filters are active for dimming logic
  const isSearchActive = !!searchQuery || Object.keys(activeFilters).length > 0;

  // Set for O(1) visibility lookups
  const visibleIds = useMemo(() => {
    return new Set(visibleFileScores.map((f) => f.id));
  }, [visibleFileScores]);

  // Find the subtree corresponding to the zoomed path
  const zoomedData = useMemo(() => {
    if (!zoomedPath) return rootTree;

    let current = rootTree;
    const parts = zoomedPath.split("/");
    for (const part of parts) {
      if (!part) continue;
      const next = current.children?.find((c) => c.name === part);
      if (next) {
        current = next;
      } else {
        break; // fallback if path is invalid
      }
    }
    return current;
  }, [rootTree, zoomedPath]);

  // Breadcrumb generation
  const breadcrumbs = useMemo(() => {
    const parts = zoomedPath.split("/").filter(Boolean);
    const crumbs = [{ name: "root", path: "" }];
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      crumbs.push({ name: part, path: currentPath });
    }
    return crumbs;
  }, [zoomedPath]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const data = node.data as DirectoryNode;
      if (data.fileScore) {
        // It's a leaf/file
        setSelectedFilePath(data.path);
      } else {
        // It's a directory, zoom in
        setZoomedPath(data.path);
      }
    },
    [setSelectedFilePath],
  );

  const handleNodeMouseEnter = useCallback(
    (node: any) => {
      const data = node.data as DirectoryNode;
      setHoveredFilePath(data.path);
    },
    [setHoveredFilePath],
  );

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredFilePath(null);
  }, [setHoveredFilePath]);

  // Custom node component injecting our extra props
  const CustomTreemapNode = useCallback(
    (props: any) => {
      const node = props.node || props;
      return (
        <TreemapNode
          node={node}
          visibleIds={visibleIds}
          isSearchActive={isSearchActive}
          hoveredFilePath={hoveredFilePath}
          onClick={handleNodeClick}
          onMouseEnter={handleNodeMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
        />
      );
    },
    [
      visibleIds,
      isSearchActive,
      hoveredFilePath,
      handleNodeClick,
      handleNodeMouseEnter,
      handleNodeMouseLeave,
    ],
  );

  return (
    <div className="w-full flex flex-col h-full bg-canvas rounded-lg border border-hairline overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-hairline bg-surface-soft">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 font-mono text-sm text-charcoal">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.path} className="flex items-center">
              {idx > 0 && <span className="text-mute mx-2">/</span>}
              <button
                onClick={() => setZoomedPath(crumb.path)}
                className={`hover:text-ink transition-colors ${idx === breadcrumbs.length - 1 ? "font-bold text-ink" : ""}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Size Metric Toggle */}
        <div className="flex items-center bg-canvas border border-hairline rounded-sm overflow-hidden text-xs font-sans">
          {(["size", "churn", "complexity"] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSizeMetric(metric)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                sizeMetric === metric
                  ? "bg-charcoal text-on-dark font-medium"
                  : "text-body hover:bg-surface-soft hover:text-ink"
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Treemap Container */}
      <div className="flex-1 relative min-h-[400px]">
        {rootTree.children && rootTree.children.length > 0 ? (
          <ResponsiveTreeMap
            data={zoomedData}
            identity="path"
            value={sizeMetric === "size" ? "loc" : sizeMetric}
            valueFormat=".02s"
            margin={{ top: 1, right: 1, bottom: 1, left: 1 }}
            labelSkipSize={12}
            nodeComponent={CustomTreemapNode}
            colors={{ scheme: "nivo" }} // overridden by nodeComponent
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.1]],
            }}
            animate={false}
            motionConfig="stiff"
            // Ensure nodes pack tightly
            innerPadding={1}
            outerPadding={2}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-mute font-sans text-sm animate-pulse">
            Loading visual map...
          </div>
        )}
      </div>
    </div>
  );
};
