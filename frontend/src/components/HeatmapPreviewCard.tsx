export const HeatmapPreviewCard = () => (
  <div className="bg-canvas border border-hairline rounded-lg p-2 w-full max-w-[540px] my-10 shadow-sm text-left">
    <div className="flex h-[220px] w-full gap-2">
      {/* High Risk - Largest Area */}
      <div className="flex-[2] bg-risk-high-soft border border-risk-high/15 rounded-md p-3 flex flex-col justify-between">
        <span className="font-mono text-risk-high text-sm font-medium break-all">services/git/churn.ts</span>
        <div className="flex justify-between items-end">
          <span className="font-sans text-risk-high/70 text-xs">High Churn + Low Bus Factor</span>
          <span className="font-mono text-risk-high text-2xl font-medium tracking-tight">98</span>
        </div>
      </div>
      
      <div className="flex-[3] flex flex-col gap-2">
        {/* Medium Risk */}
        <div className="flex-[3] bg-risk-mid-soft border border-risk-mid/15 rounded-md p-3 flex flex-col justify-between">
          <span className="font-mono text-risk-mid text-sm font-medium">scoring/risk-score.ts</span>
          <div className="flex justify-between items-end">
            <span className="font-sans text-risk-mid/70 text-xs">High Complexity</span>
            <span className="font-mono text-risk-mid text-xl font-medium tracking-tight">65</span>
          </div>
        </div>
        
        {/* Low Risk Row */}
        <div className="flex-[2] flex gap-2">
          <div className="flex-1 bg-risk-low-soft border border-risk-low/15 rounded-md p-2 flex flex-col justify-between">
             <span className="font-mono text-risk-low text-xs font-medium truncate">App.tsx</span>
             <span className="font-mono text-risk-low text-base font-medium text-right">12</span>
          </div>
          <div className="flex-1 bg-risk-low-soft border border-risk-low/15 rounded-md p-2 flex flex-col justify-between">
             <span className="font-mono text-risk-low text-xs font-medium truncate">utils.ts</span>
             <span className="font-mono text-risk-low text-base font-medium text-right">08</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
