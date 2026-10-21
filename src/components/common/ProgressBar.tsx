import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100 overall submitted
  verifiedProgress?: number; // 0-100 verified by PM
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  verifiedProgress,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const safeVerified = verifiedProgress !== undefined ? Math.min(100, Math.max(0, Math.round(verifiedProgress))) : null;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1.5 text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block" />
            <span>Progress: <strong className="text-slate-900 font-mono tabular-nums">{safeProgress}%</strong></span>
            {safeVerified !== null && (
              <span className="text-slate-500 font-normal ml-1">
                (<span className="font-mono tabular-nums text-emerald-700 font-medium">{safeVerified}%</span> verified)
              </span>
            )}
          </span>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {safeProgress === 100 ? 'Completed' : `${100 - safeProgress}% remaining`}
          </span>
        </div>
      )}

      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClasses} relative flex`}>
        {/* Verified portion (solid emerald/slate) */}
        {safeVerified !== null && safeVerified > 0 && (
          <div
            className="bg-emerald-600 h-full transition-all duration-500 rounded-l-full"
            style={{ width: `${safeVerified}%` }}
            title={`PM Verified: ${safeVerified}%`}
          />
        )}
        {/* In-progress unverified portion */}
        {safeProgress > (safeVerified || 0) && (
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${safeProgress - (safeVerified || 0)}%` }}
            title={`Submitted / In-Progress: ${safeProgress - (safeVerified || 0)}%`}
          />
        )}
      </div>
    </div>
  );
};
