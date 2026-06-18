import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-secondary animate-progress-fill"
          style={{ 
            width: `${clamped}%`,
            transformOrigin: 'left'
          }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-text-muted text-right">{clamped}% funded</p>
      )}
    </div>
  );
}
