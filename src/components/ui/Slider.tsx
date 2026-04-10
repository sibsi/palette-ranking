import { useRef, useCallback, useState } from "react";
import { CircleHelp } from "lucide-react";

interface SliderProps {
  title: string;
  tooltip?: string;
  trackBackground: string;
  value: number; // 0-1, top = 0, bottom = 1
  onChange: (value: number) => void;
}

export function Slider({
  title,
  tooltip,
  trackBackground,
  value,
  onChange,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // clamps value between 0 and 1 to prevent thumb from going out of track
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const calculateValueFromPointer = useCallback((clientY: number): number => {
    if (!trackRef.current) return 0;
    const { top, height } = trackRef.current.getBoundingClientRect();

    // thumb radius is 10px (h-5 = 20px diameter)
    const yPos = clientY - top - 10;
    return clamp(yPos / (height - 20));
  }, []);

  const displayValue =
    value <= 1 / 3 ? "High" : value <= 2 / 3 ? "Balanced" : "Low";

  // handling click on slider track
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onChange(calculateValueFromPointer(e.clientY));
      setIsDragging(true);
    },
    [onChange, calculateValueFromPointer],
  );

  // handling dragging of the thumb
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      onChange(calculateValueFromPointer(e.clientY));
    },
    [onChange, calculateValueFromPointer],
  );

  // handling release of the thumb
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    },
    [],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-visible">
      <div className="relative flex max-w-full items-start justify-center gap-1 text-center">
        <span className="max-w-16 whitespace-normal font-display text-xs font-bold leading-tight text-(--text-muted)">
          {title}
        </span>

        {tooltip ? (
          <div className="group/tooltip relative mt-0.5 flex shrink-0 items-center">
            <CircleHelp
              size={12}
              className="text-(--text-faint) transition-colors group-hover/tooltip:text-(--text-muted)"
            />
            <div className="app-panel pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-36 -translate-x-1/2 rounded-md border px-2 py-1.5 text-left text-[10px] leading-snug text-(--text-muted) opacity-0 shadow-lg transition-all duration-150 group-hover/tooltip:opacity-100">
              {tooltip}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative min-h-0 w-8 flex-1 overflow-visible">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative mx-auto h-full w-full cursor-pointer rounded-lg shadow-inner"
          style={{ background: trackBackground }}
          role="slider"
        >
          <div
            className="pointer-events-none absolute left-1/2 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-white shadow-md transition-[top] duration-75 ease-out dark:border-slate-200 dark:bg-slate-600"
            style={{
              top: `calc(2.5px + ${value * 100}% - ${value * 25}px)`,
            }}
          >
            <div
              className={`app-panel absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-medium text-(--text-muted) transition-all duration-200 ${
                isDragging
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            >
              {displayValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
