import { RotateCcw } from "lucide-react";
import {
  type ImageTagCategory,
  type ImageTagValue,
} from "@/types";

export type ImageOrganizationMode = "filter" | "sort";

const CATEGORIES: { key: ImageTagCategory; label: string }[] = [
  { key: "brightness", label: "Brightness" },
  { key: "temperature", label: "Temperature" },
  { key: "saturation", label: "Saturation" },
];

export const TAG_VALUES: Record<ImageTagCategory, ImageTagValue[]> = {
  brightness: ["dark", "neutral", "bright"],
  temperature: ["cool", "neutral", "warm"],
  saturation: ["muted", "vivid"],
};

// each filter tab (e.g. "Filter", "Sort by", "Favs", "Brightness", etc.)
function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border border-(--border-soft) bg-(--surface-active) text-(--app-fg) shadow-sm"
          : "text-(--text-muted) hover:bg-(--surface-hover) hover:text-(--app-fg)"
      }`}
    >
      {children}
    </button>
  );
}

export interface FilterBarProps {
  mode: ImageOrganizationMode;
  selectedCategory: ImageTagCategory | null;
  selectedValue: ImageTagValue | null;
  favoritesOnly: boolean;
  visibleCount: number;
  totalCount: number;
  onModeChange: (mode: ImageOrganizationMode) => void;
  onCategoryChange: (category: ImageTagCategory | null) => void;
  onValueChange: (value: ImageTagValue | null) => void;
  onFavoritesToggle: () => void;
  onShowAll: () => void;
}

export default function FilterBar({
  mode,
  selectedCategory,
  selectedValue,
  favoritesOnly,
  visibleCount,
  totalCount,
  onModeChange,
  onCategoryChange,
  onValueChange,
  onFavoritesToggle,
  onShowAll,
}: FilterBarProps) {
  const canShowAll = visibleCount < totalCount;

  return (
    <div className="mb-4 flex flex-col gap-3 px-4 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="app-chrome inline-flex items-center gap-1.5 rounded-full border p-1.5 backdrop-blur-xl">
          <div className="rounded-full border border-(--border-soft) bg-(--surface-panel-muted) p-0.5">
            {(["filter", "sort"] as const).map((opt) => (
              <FilterTab
                key={opt}
                active={mode === opt}
                onClick={() => onModeChange(opt)}
              >
                {opt === "filter" ? "Filter" : "Sort by"}
              </FilterTab>
            ))}
          </div>

          <div className="app-divider mx-1 h-3.5 w-px shrink-0" />

          <div className="flex items-center gap-0.5">
            <FilterTab active={favoritesOnly} onClick={onFavoritesToggle}>
              Favs
            </FilterTab>

            {CATEGORIES.map((cat) => (
              <FilterTab
                key={cat.key}
                active={selectedCategory === cat.key}
                onClick={() =>
                  onCategoryChange(
                    selectedCategory === cat.key ? null : cat.key,
                  )
                }
              >
                {cat.label}
              </FilterTab>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 text-[13px] font-medium text-(--text-muted)">
          Showing {visibleCount} of {totalCount} images
          {canShowAll && (
            <button
              type="button"
              onClick={onShowAll}
              className="app-panel-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-(--text-muted) transition-colors hover:bg-(--surface-hover-strong) hover:text-(--app-fg)"
              title="Reset filters"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* sub filters when Filter mode and category selected */}
      {mode === "filter" && selectedCategory && (
        <div className="flex items-center gap-3 px-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-(--text-faint)">
            Show only:
          </span>
          <div className="app-panel inline-flex items-center gap-1 rounded-full border p-1 backdrop-blur-md">
            {TAG_VALUES[selectedCategory].map((val) => (
              <FilterTab
                key={val}
                active={selectedValue === val}
                onClick={() =>
                  onValueChange(selectedValue === val ? null : val)
                }
              >
                <span className="capitalize">{val}</span>
              </FilterTab>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
