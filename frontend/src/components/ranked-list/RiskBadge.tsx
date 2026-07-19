import React from 'react';

interface RiskBadgeProps {
  score: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  let label = 'Low';
  let bgColorClass = 'bg-risk-low/20';
  let textColorClass = 'text-risk-low';
  let dotColorClass = 'bg-risk-low';

  if (score >= 0.7) {
    label = 'High';
    bgColorClass = 'bg-risk-high/20';
    textColorClass = 'text-risk-high';
    dotColorClass = 'bg-risk-high';
  } else if (score >= 0.3) {
    label = 'Med';
    bgColorClass = 'bg-risk-mid/20';
    textColorClass = 'text-risk-mid';
    dotColorClass = 'bg-risk-mid';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${bgColorClass} ${textColorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`}></span>
      {label} {(score * 10).toFixed(1)}
    </span>
  );
};
