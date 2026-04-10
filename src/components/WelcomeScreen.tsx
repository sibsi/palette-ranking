import type { ReactNode } from "react";
import { Plus, FolderOpen } from "lucide-react";
import Logo from "./ui/Logo";

interface WelcomeScreenProps {
  onFolderPicked: () => void | Promise<void>;
  recursive: boolean;
  onToggleRecursive: (value: boolean) => void;
}

export default function WelcomeScreen({
  onFolderPicked,
  recursive,
  onToggleRecursive,
}: WelcomeScreenProps) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-5 sm:px-4 sm:py-6 md:px-6">
      <SidebarGuideline />
      <GridControlsGuidelines />

      <div className="relative z-10 grid min-h-full w-full flex-1 place-items-center">
        <div className="flex max-w-2xl flex-col items-center text-center">
          <div className="h-28 w-28">
            <Logo />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-(--app-fg) sm:text-5xl">
            Browse images & sort by color.
          </h1>

          <p className="mt-4 max-w-xl text-(--text-muted) sm:text-lg">
            PaletteView will analyze your images (JPG, PNG, and WebP) without
            modifying your original files.
          </p>

          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-(--text-muted)">
              Select a directory to begin:
            </p>

            <button
              onClick={() => void onFolderPicked()}
              className="app-panel group relative flex h-20 w-20 items-center justify-center rounded-full border transition-all hover:-translate-y-1 hover:bg-(--surface-active)"
            >
              <div className="relative flex">
                <FolderOpen className="h-8 w-8 text-(--text-faint) transition-colors group-hover:text-(--text-muted)" />
                <div className="app-panel absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border transition-transform group-hover:scale-110 group-hover:rotate-90">
                  <Plus
                    className="h-4 w-4 text-(--text-muted)"
                    strokeWidth={3}
                  />
                </div>
              </div>
            </button>

            {/* Subfolder Toggle */}
            <div className="app-panel-muted mt-4 inline-flex rounded-full border p-1">
              <ToggleOption
                active={!recursive}
                onClick={() => onToggleRecursive(false)}
              >
                Root Only
              </ToggleOption>
              <ToggleOption
                active={recursive}
                onClick={() => onToggleRecursive(true)}
              >
                Include Subfolders
              </ToggleOption>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// toggle switch
function ToggleOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border border-(--border-soft) bg-(--surface-active) text-(--app-fg) shadow-sm"
          : "text-(--text-muted) hover:bg-(--surface-hover) hover:text-(--app-fg)"
      }`}
    >
      {children}
    </button>
  );
}

// guidelines with brackets
function SidebarGuideline() {
  return (
    <div className="pointer-events-none absolute left-0 top-[50%] z-0 flex -translate-y-1/2 items-center gap-4">
      <div className="h-[50vh] w-4 rounded-r-lg border-b border-r border-t border-slate-300/80 dark:border-white/10" />
      <GuidelineText className="max-w-13.75">
        pick a color to sort by
      </GuidelineText>
    </div>
  );
}

function GridControlsGuidelines() {
  return (
    <div className="pointer-events-none absolute right-8 top-0 z-0 flex flex-col">
      <div className="flex gap-12">
        {/* Shape */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-20 rounded-b-lg border-b border-l border-r border-slate-300/80 dark:border-white/10" />
          <GuidelineText>Shape</GuidelineText>
        </div>

        {/* Size */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-16 rounded-b-lg border-b border-l border-r border-slate-300/80 dark:border-white/10" />
          <GuidelineText>Size</GuidelineText>
        </div>
      </div>
      <div className="mt-2 flex w-full flex-col items-center gap-1.5">
        <div className="h-3 w-32 rounded-b-lg border-b border-l border-r border-slate-300/80 dark:border-white/10" />
        <GuidelineText>Grid Controls</GuidelineText>
      </div>
    </div>
  );
}

function GuidelineText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-widest text-(--text-faint) sm:text-[11px] ${className}`}
    >
      {children}
    </span>
  );
}
