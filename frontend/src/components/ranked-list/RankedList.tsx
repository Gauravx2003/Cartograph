import { useVisibleFileScores } from "../../store/scan-selectors";
import { FilterBar } from "./FilterBar";
import { RankedTable } from "./RankedTable";

export const RankedList = () => {
  const visibleData = useVisibleFileScores();

  return (
    <div className="flex flex-col h-full bg-canvas rounded-lg border border-hairline overflow-hidden shadow-sm">
      <FilterBar />
      <div className="flex-1 min-h-0 relative">
        {visibleData.length > 0 ? (
          <RankedTable data={visibleData} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-mute font-sans text-sm">
            No files match the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
