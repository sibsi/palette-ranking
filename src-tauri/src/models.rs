use palette::{IntoColor, Oklab, Oklch};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// image analysis data shared with the frontend and cache
#[derive(Serialize, Deserialize, Clone)]
pub struct ImageData {
    pub id: String,
    pub file_path: String,
    pub file_name: String,
    pub thumbnail_path: Option<String>,
    pub width: u32,
    pub height: u32,

    pub display_palette: Vec<PaletteColor>, // curated palette for display
    pub palette: Vec<PaletteColor>,
    pub avg_l: f32,
    pub avg_c: f32,
    pub chromatic_fraction: f32,
    pub warm_weight: f32,
    pub cool_weight: f32,

    pub favorited: bool,
}

#[derive(Clone, Copy)]
pub struct WeightedPixel {
    pub lab: Oklab,
    pub weight: f32,
    pub chroma: f32,
}

// for clustering in weighted k-means++
#[derive(Clone, Copy, Default)]
pub struct ColorCluster {
    pub sum_l: f32,
    pub sum_a: f32,
    pub sum_b: f32,
    pub total_weight: f32,
    pub total_chroma: f32,
    pub pixel_count: usize,
}

impl ColorCluster {
    pub fn add_weighted_pixel(&mut self, pixel: &WeightedPixel) {
        self.sum_l += pixel.lab.l * pixel.weight;
        self.sum_a += pixel.lab.a * pixel.weight;
        self.sum_b += pixel.lab.b * pixel.weight;
        self.total_weight += pixel.weight;
        self.total_chroma += pixel.chroma * pixel.weight;
        self.pixel_count += 1;
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PaletteColor {
    pub l: f32,
    pub a: f32,
    pub b: f32,
    pub chroma: f32,
    pub hue: f32,                 // degrees [0, 360)
    pub weighted_proportion: f32, // share of total image weight
}

impl PaletteColor {
    pub fn from_lab(lab: Oklab, weighted_proportion: f32) -> Self {
        let lch: Oklch = lab.into_color();
        Self {
            l: lab.l,
            a: lab.a,
            b: lab.b,
            chroma: lch.chroma,
            hue: lch.hue.into_positive_degrees(),
            weighted_proportion,
        }
    }
}

#[derive(Serialize, Deserialize, Default)]
pub struct AppState {
    #[serde(default)]
    pub opened_folders: Vec<String>,
    #[serde(default)]
    pub favorite_paths: Vec<String>,
}

// in-memory cache of analysis results
#[derive(Serialize, Deserialize, Default)]
pub struct AnalysisCache(pub HashMap<String, ImageData>);

// for ScanningState.tsx progress bar
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgressEvent {
    pub path: String,
    pub scan_id: String,
    pub processed: usize,
    pub total: usize,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ThumbnailReadyEvent {
    pub path: String,
    pub thumbnail_path: String,
}
