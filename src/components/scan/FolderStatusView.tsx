import { AlertCircle, RefreshCw } from "lucide-react";

interface FolderStatusProps {
  title: string;
  message: string;
  onRescan: () => Promise<void>;
}

export default function FolderStatusView({
  title,
  message,
  onRescan,
}: FolderStatusProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="app-panel relative w-full max-w-sm rounded-4xl border p-10 text-center backdrop-blur-2xl">
        <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-3xl bg-orange-500/20 text-orange-600 dark:text-orange-400">
          <AlertCircle className="size-10 stroke-2" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-(--app-fg)">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-(--text-muted)">
          {message}
        </p>

        <button
          type="button"
          onClick={() => void onRescan()}
          className="group mt-10 inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-orange-600/60 px-6 py-4 text-sm font-semibold text-white transition-all dark:bg-orange-200/70 dark:text-slate-900"
        >
          <RefreshCw className="size-4 transition-transform group-hover:rotate-180" />
          Rescan Folder
        </button>
      </div>
    </div>
  );
}
