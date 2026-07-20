import { useScanStore } from "../../store/scan-store";

export const FilterBar = () => {
  const activeFilters = useScanStore((state) => state.activeFilters);
  const setActiveFilters = useScanStore((state) => state.setActiveFilters);

  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-hairline bg-surface-soft">
      {/* Min Risk Slider */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="min-risk"
          className="text-xs font-medium text-mute whitespace-nowrap"
        >
          Min Risk:
        </label>
        <div className="flex items-center gap-2">
          <input
            id="min-risk"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={activeFilters.minRisk || 0}
            onChange={(e) =>
              setActiveFilters({ minRisk: parseFloat(e.target.value) })
            }
            className="w-24 accent-charcoal"
          />
          <span className="text-xs font-mono text-ink w-8">
            {((activeFilters.minRisk || 0) * 10).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Bus Factor Only Toggle */}
      <div className="flex items-center gap-2">
        <input
          id="bus-factor-only"
          type="checkbox"
          checked={activeFilters.busFactorOnly || false}
          onChange={(e) =>
            setActiveFilters({ busFactorOnly: e.target.checked })
          }
          className="rounded border-hairline text-charcoal focus:ring-charcoal"
        />
        <label
          htmlFor="bus-factor-only"
          className="text-xs font-medium text-mute cursor-pointer select-none"
        >
          Bus Factor {">"} 0 Only
        </label>
      </div>
    </div>
  );
};
