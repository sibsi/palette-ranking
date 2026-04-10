import { AlertCircle, FolderClosed, LoaderCircle, Plus, X } from "lucide-react";
import type { FolderTabData } from "@/types";
import TopbarButton from "./TopbarButton";

interface FolderTabsProps {
  tabs: FolderTabData[];
  activeFolderPath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onOpenFolder: () => void;
  isAddingFolder?: boolean;
}

export default function FolderTabs({
  tabs,
  activeFolderPath,
  onSelect,
  onClose,
  onOpenFolder,
  isAddingFolder = false,
}: FolderTabsProps) {
  return (
    <>
      <div className="flex min-w-0 max-w-[min(50vw,44rem)] items-center gap-1 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.path === activeFolderPath;

          const statusLabel =
            tab.status === "loading"
              ? "Scanning Folder..."
              : tab.error
                ? "Needs Attention"
                : `${tab.images.length} images`;

          const containerClasses = isActive
            ? "border-[color:var(--border-soft)] bg-[var(--surface-active)] text-[var(--app-fg)] shadow-sm"
            : "cursor-pointer border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--app-fg)]";

          const closeIconClasses = isActive
            ? "text-[var(--text-soft)] hover:bg-[var(--surface-hover-strong)] hover:text-[var(--app-fg)]"
            : "text-[var(--text-faint)] hover:bg-[var(--surface-hover)] hover:text-[var(--app-fg)]";

          return (
            <div
              key={tab.path}
              className={`group flex min-w-0 max-w-48 shrink-0 items-center gap-0.5 rounded-full border p-0.5 text-left transition-colors ${containerClasses}`}
            >
              <button
                type="button"
                onClick={() => onSelect(tab.path)}
                className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-full py-1 pl-1.5 pr-1 text-left ${isActive ? "cursor-default" : "cursor-pointer"}`}
                title={`${tab.name} - ${statusLabel}\n${tab.path}`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center ${isActive ? "text-(--app-fg)" : "text-(--text-soft)"}`}
                >
                  {tab.status === "loading" ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : tab.error ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <FolderClosed className="h-3.5 w-3.5" />
                  )}
                </div>

                <span className="min-w-0 truncate text-[13px] font-medium">
                  {tab.name}
                </span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(tab.path);
                }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${closeIconClasses}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="app-divider mx-0.5 h-4 w-px shrink-0" />
      <TopbarButton
        onClick={onOpenFolder}
        disabled={isAddingFolder}
        title="Open a New Folder"
      >
        {isAddingFolder ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </TopbarButton>
    </>
  );
}
