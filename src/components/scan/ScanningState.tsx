import { LoaderCircle } from "lucide-react";
import type { ScanProgress } from "@/types";

interface ScanningStateProps {
  progress: ScanProgress | null;
  folderPath: string | null;
  onCancel: () => Promise<void>;
}

export default function ScanningState({
  progress,
  folderPath,
  onCancel,
}: ScanningStateProps) {
  const { processed = 0, total = 0 } = progress ?? {};
  const percentage =
    total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const progressText = `${processed.toLocaleString()} / ${total.toLocaleString()} images processed`;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="app-panel w-full max-w-lg rounded-[2.5rem] border p-8 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <LoaderCircle className="size-7 animate-spin stroke-[1.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-(--app-fg)">
              Scanning folder
            </h2>
            <p className="mt-0.5 truncate text-sm text-(--text-muted)">
              {progressText}
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <div className="flex items-end justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--text-faint)">
              Current Progress
            </span>
            <span className="font-mono text-sm font-semibold text-(--text-soft)">
              {percentage}%
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-(--surface-panel-muted)">
            <div
              className="h-full bg-linear-to-r from-blue-600 to-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {folderPath && (
          <p
            className="mt-8 truncate text-center font-mono text-[12px] text-(--text-faint)"
            title={folderPath}
          >
            {folderPath}
          </p>
        )}

        <button
          type="button"
          onClick={() => void onCancel()}
          className="mt-6 w-full rounded-2xl py-3 text-xs font-bold uppercase tracking-widest text-(--text-faint) transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          Cancel Scan
        </button>
      </div>
    </div>
  );
}
