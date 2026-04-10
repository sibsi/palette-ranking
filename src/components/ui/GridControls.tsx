import { GRID_SIZES, IMAGE_SHAPES } from "@/constants/layout";
import type { GridSize, ImageShape } from "@/types";
import { useLayout } from "../layout/MainLayout";
import { JSX } from "react";
import TopbarButton from "./TopbarButton";

type IconComponent = ({ className }: { className?: string }) => JSX.Element;

const SHAPE_ICONS: Record<ImageShape, IconComponent> = {
  square: ShapeSquareIcon,
  horizontal: ShapeHorizontalIcon,
  vertical: ShapeVerticalIcon,
  original: ShapeOriginalIcon,
};

const SIZE_ICONS: Record<GridSize, IconComponent> = {
  S: SizeSmallIcon,
  M: SizeMediumIcon,
  L: SizeLargeIcon,
};

export default function GridControls() {
  const { imageShape, setImageShape, gridSize, setGridSize } = useLayout();

  return (
    <div className="flex items-center gap-1.5">
      {/* Shape Controls */}
      <div className="flex items-center gap-0.5">
        {IMAGE_SHAPES.map((value) => {
          const Icon = SHAPE_ICONS[value];

          return (
            <TopbarButton
              key={value}
              isActive={imageShape === value}
              onClick={() => setImageShape(value)}
              title={value}
            >
              <Icon className="h-4 w-4" />
            </TopbarButton>
          );
        })}
      </div>

      {/* Divider */}
      <div className="app-divider mx-1 h-4 w-px" />

      {/* Size Controls */}
      <div className="flex items-center gap-0.5">
        {GRID_SIZES.map((value) => {
          const Icon = SIZE_ICONS[value];

          return (
            <TopbarButton
              key={value}
              isActive={gridSize === value}
              onClick={() => setGridSize(value)}
              title={value}
            >
              <Icon className="h-4 w-4" />
            </TopbarButton>
          );
        })}
      </div>
    </div>
  );
}

// Shape Icons
function ShapeSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

function ShapeHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="4" width="20" height="6.5" rx="1" />
      <rect x="2" y="13.5" width="20" height="6.5" rx="1" />
    </svg>
  );
}

function ShapeVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="2" width="7" height="20" rx="1" />
      <rect x="14" y="2" width="7" height="20" rx="1" />
    </svg>
  );
}

function ShapeOriginalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="11" height="7" rx="1" />
      <rect x="15" y="2" width="7" height="12" rx="1" />
      <rect x="2" y="12" width="7" height="10" rx="1" />
      <rect x="11" y="17" width="11" height="5" rx="1" />
    </svg>
  );
}

// Size Icons
function SizeSmallIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="8" y="8" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function SizeMediumIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

function SizeLargeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="2.5" />
    </svg>
  );
}
