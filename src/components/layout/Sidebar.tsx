import { formatHex } from "culori";
import { Pipette, RotateCcw, X } from "lucide-react";
import { Slider } from "../ui/Slider";

const DEFAULT_REFINE_VALUE = 0.5;

interface SidebarProps {
  selected: string | null;
  onSelect: (value: string | null) => void;
  similarity: number; // 0 to 1
  onSimilarityChange: (value: number) => void;
}

// used by Logo
export const PALETTE_COLORS = [
  { label: "Red", value: "#E11D48" },
  { label: "Orange", value: "#F59E0B" },
  { label: "Green", value: "#10B981" },
  { label: "Blue", value: "#0EA5E9" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Pink", value: "#EC4899" },
  { label: "White", value: "#FFFFFF", needsBorder: true },
  { label: "Dark", value: "#1F2937" },
];

export default function Sidebar({
  selected,
  onSelect,
  similarity,
  onSimilarityChange,
}: SidebarProps) {
  const currentColor = selected || "#1F2937";

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanHex = formatHex(e.target.value);
    if (cleanHex) onSelect(cleanHex);
  };

  const canResetRefine = similarity !== DEFAULT_REFINE_VALUE;

  const handleResetRefine = () => {
    onSimilarityChange(DEFAULT_REFINE_VALUE);
  };

  return (
    <aside className="app-chrome relative z-10 flex h-full min-h-125 w-30 flex-col items-center overflow-visible rounded-[28px] border py-5 backdrop-blur-2xl transition-all duration-500">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--surface-sheen), transparent)",
          }}
        />
        <div
          className="absolute inset-px rounded-[27px] border"
          style={{ borderColor: "var(--surface-outline)" }}
        />
      </div>

      <button
        onClick={() => onSelect(null)}
        disabled={!selected}
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:bg-(--surface-hover) hover:text-(--app-fg) disabled:pointer-events-none disabled:opacity-30"
        title="Clear Color Filter"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 mt-4 flex w-full flex-col items-center px-2">
        <div className="group relative h-14 w-14 shrink-0 transition-opacity duration-300">
          <div
            className="absolute inset-0 overflow-hidden rounded-full border-2 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-12"
            style={{
              backgroundColor: currentColor,
              borderColor: "var(--surface-outline)",
              boxShadow: selected ? `0 0 20px -4px ${currentColor}` : undefined,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Pipette size={20} className="text-white drop-shadow-md" />
            </div>
          </div>

          <input
            type="color"
            value={currentColor}
            onChange={handleNativePickerChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Open system color picker"
          />
        </div>

        <div className="mt-6 grid w-full grid-cols-2 justify-items-center gap-3 px-1">
          {PALETTE_COLORS.map(({ label, value, needsBorder }) => {
            const isSelected = selected === value;
            const hasVisibleBorder = needsBorder && !isSelected;

            return (
              <button
                key={value}
                title={label}
                onClick={() => onSelect(isSelected ? null : value)}
                className={`relative flex aspect-square w-8 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-300 hover:scale-110 active:scale-95 ${
                  hasVisibleBorder ? "border border-(--border-strong)" : ""
                }`}
                style={{ backgroundColor: value }}
              >
                {isSelected && (
                  <span
                    className="pointer-events-none absolute -inset-1.5 -z-10 rounded-full border-2 backdrop-blur-md transition-all duration-300"
                    style={{
                      borderColor: value,
                      backgroundColor: `${value}25`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="my-5 w-10 shrink-0 border-t border-(--border-soft)" />

      <div className="app-panel-muted relative z-10 flex min-h-0 flex-1 flex-col items-center rounded-2xl border p-3 shadow-inner">
        <div className="mb-4 flex w-full items-center justify-between gap-2">
          <span className="text-[10px] font-semibold tracking-wider text-(--text-faint)">
            REFINE
          </span>

          <button
            type="button"
            onClick={handleResetRefine}
            disabled={!canResetRefine}
            className="flex h-6 w-6 items-center justify-center rounded-full text-(--text-faint) transition-colors hover:bg-(--surface-hover) hover:text-(--app-fg) disabled:pointer-events-none disabled:opacity-35"
            title="Reset Sliders"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <div className="flex w-3 flex-1 justify-center">
          <Slider
            title="Match Precision"
            tooltip="Controls how exact the color match should be. Higher precision finds near-exact matches, lower includes nearby shades."
            trackBackground={`linear-gradient(to bottom, ${currentColor}, #94A3B8)`}
            value={similarity}
            onChange={onSimilarityChange}
          />
        </div>
      </div>
    </aside>
  );
}
