export type BrightnessTag = "dark" | "neutral" | "bright";
export type TemperatureTag = "cool" | "neutral" | "warm";
export type SaturationTag = "muted" | "vivid";

export interface ImageTags {
  brightness: BrightnessTag;
  temperature: TemperatureTag;
  saturation: SaturationTag;
}

export type ImageTagCategory = keyof ImageTags;
export type ImageTagValue = BrightnessTag | TemperatureTag | SaturationTag;

export interface ImageData {
  id: string;
  file_path: string;
  file_name: string;
  thumbnail_path: string | null;
  width: number;
  height: number;

  display_palette: PaletteColor[];
  palette: PaletteColor[];
  avg_l: number;
  avg_c: number;
  chromatic_fraction: number;
  warm_weight: number;
  cool_weight: number;

  favorited: boolean;
}

export interface PaletteColor {
  l: number; // lightness
  a: number; // green-red
  b: number; // blue-yellow
  chroma: number;
  hue: number;
  weighted_proportion: number;
}
