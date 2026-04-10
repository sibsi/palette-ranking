import type { GridSize, ImageShape } from "@/types";

export const IMAGE_SHAPES = [
  "square",
  "horizontal",
  "vertical",
  "original",
] as const satisfies readonly ImageShape[];

export const GRID_SIZES = ["S", "M", "L"] as const satisfies readonly GridSize[];

export const DEFAULT_IMAGE_SHAPE: ImageShape = "original";
export const DEFAULT_GRID_SIZE: GridSize = "M";
