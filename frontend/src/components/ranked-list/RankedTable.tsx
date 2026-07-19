import React, { useRef, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useScanStore, type FileScore } from "../../store/scan-store";
import { RiskBadge } from "./RiskBadge";

const columnHelper = createColumnHelper<FileScore>();

export const RankedTable = ({ data }: { data: FileScore[] }) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "riskScore", desc: true }, // default sort by risk descending
  ]);

  const hoveredFilePath = useScanStore((state) => state.hoveredFilePath);
  const setHoveredFilePath = useScanStore((state) => state.setHoveredFilePath);
  const setSelectedFilePath = useScanStore(
    (state) => state.setSelectedFilePath,
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("filePath", {
        header: "File Path",
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
        size: 300,
      }),
      columnHelper.accessor("riskScore", {
        header: "Risk",
        cell: (info) => <RiskBadge score={info.getValue()} />,
        size: 100,
      }),
      columnHelper.accessor("churnCount", {
        header: "Churn",
        cell: (info) => info.getValue(),
        size: 80,
      }),
      columnHelper.accessor("complexityCyclomatic", {
        header: "Complexity",
        cell: (info) => info.getValue(),
        size: 100,
      }),
      columnHelper.accessor("uniqueContributors", {
        header: "Authors",
        cell: (info) => info.getValue(),
        size: 80,
      }),
      columnHelper.accessor("topContributorPct", {
        header: "Top Author %",
        cell: (info) => `${(info.getValue() * 100).toFixed(0)}%`,
        size: 110,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // Virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // 40px row height
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm bg-canvas">
      {/* Table Header */}
      <div className="flex border-b border-hairline bg-surface font-medium text-mute shadow-sm sticky top-0 z-10 pr-2">
        {table.getFlatHeaders().map((header) => (
          <div
            key={header.id}
            className="px-4 py-3 flex items-center gap-1 cursor-pointer select-none hover:text-ink transition-colors"
            style={{
              width: header.getSize(),
              flex: header.getSize() === 300 ? "1 1 auto" : "0 0 auto",
            }}
            onClick={header.column.getToggleSortingHandler()}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            <span className="text-[10px]">
              {{
                asc: " ▲",
                desc: " ▼",
              }[header.column.getIsSorted() as string] ?? " ⇅"}
            </span>
          </div>
        ))}
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto custom-scrollbar"
        onMouseLeave={() => setHoveredFilePath(null)}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isHovered = hoveredFilePath === row.original.filePath;
            return (
              <div
                key={row.id}
                className={`absolute top-0 left-0 w-full flex items-center border-b border-hairline/50 transition-colors cursor-pointer ${
                  isHovered ? "bg-surface-soft/80" : "hover:bg-surface-soft/50"
                }`}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onMouseEnter={() => setHoveredFilePath(row.original.filePath)}
                onClick={() => setSelectedFilePath(row.original.filePath)}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-4 py-2 truncate"
                    style={{
                      width: cell.column.getSize(),
                      flex:
                        cell.column.getSize() === 300 ? "1 1 auto" : "0 0 auto",
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
