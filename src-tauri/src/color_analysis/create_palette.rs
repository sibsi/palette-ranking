use crate::cache::id_maker;
use crate::color_analysis::extract_colors::weighted_k_means;
use crate::models::{ImageData, PaletteColor, WeightedPixel};
use image::{imageops::FilterType, GenericImageView};
use palette::{color_difference::HyAb, IntoColor, Oklab, Oklch, Srgb};
use std::path::Path;

const MIN_PALETTE_DIST: f32 = 0.06; // tweak this for more or less aggressive deduplication
const SCALE_FACTOR: u32 = 96; // max dimension for downscaling during analysis

pub fn analyze_image_colors(image_path: &str) -> Result<ImageData, String> {
    let img = image::open(image_path)
        .map_err(|err| format!("Failed to open image '{}': {}", image_path, err))?;
    let (w, h) = img.dimensions();

    let scale = (SCALE_FACTOR as f32 / w.max(h) as f32).min(1.0);
    let new_h = ((h as f32 * scale).round() as u32).max(1);
    let new_w = ((w as f32 * scale).round() as u32).max(1);
    let downscaled_img = img
        .resize_exact(new_w, new_h, FilterType::Triangle)
        .to_rgba8();

    let mut weighted_pixels: Vec<WeightedPixel> = Vec::new();
    let mut total_weight = 0.0_f32;
    let mut total_l = 0.0_f32;
    let mut total_c = 0.0_f32;
    let mut warm_weight = 0.0_f32;
    let mut cool_weight = 0.0_f32;

    for pixel in downscaled_img.pixels() {
        let [r, g, b, a] = pixel.0;
        if a < 10 {
            continue;
        }

        let rgb = Srgb::new(r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0);
        let oklab: Oklab = rgb.into_color();
        let oklch: Oklch = oklab.into_color();
        let (l, chroma, hue_degrees) = (oklch.l, oklch.chroma, oklch.hue.into_positive_degrees());

        let c_bonus = chroma * 5.0;
        let weight = 1.0 + c_bonus;

        weighted_pixels.push(WeightedPixel {
            lab: oklab,
            weight,
            chroma,
        });

        total_weight += weight;
        total_l += l * weight;
        total_c += chroma * weight;

        // if pixel almost white/gray/black, not in temperature calculation
        if chroma > 0.05 {
            if hue_degrees <= 100.0 || hue_degrees >= 320.0 {
                warm_weight += weight;
            } else if (100.0..=270.0).contains(&hue_degrees) {
                cool_weight += weight;
            }
        }
    }

    // variables for tags in frontend
    let safe_total_weight = total_weight.max(1.0); // in case transparent
    let avg_l = total_l / safe_total_weight;
    let avg_c = total_c / safe_total_weight;
    let chromatic_fraction = (warm_weight + cool_weight) / safe_total_weight;

    // get colors
    let mut centroids = weighted_k_means(&weighted_pixels);

    // remove duplicates
    centroids = remove_duplicates(centroids, MIN_PALETTE_DIST);

    // curate to 6 colors for display (score from chroma and distance to chosen colors)
    let curated = curate_palette(&centroids);

    let palette: Vec<PaletteColor> = centroids
        .into_iter()
        .map(|(lab, weight)| PaletteColor::from_lab(lab, weight))
        .collect();

    let display_palette: Vec<PaletteColor> = curated
        .into_iter()
        .map(|(lab, weight)| PaletteColor::from_lab(lab, weight))
        .collect();

    let file_path = Path::new(image_path);
    let id = id_maker(&file_path);
    let file_name = Path::new(image_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();

    Ok(ImageData {
        id,
        file_path: image_path.to_string(),
        file_name: file_name.to_string(),
        thumbnail_path: None,
        width: w,
        height: h,
        display_palette,
        palette,
        avg_l,
        avg_c,
        chromatic_fraction,
        warm_weight,
        cool_weight,
        favorited: false,
    })
}

fn remove_duplicates(palette: Vec<(Oklab, f32)>, min_dist: f32) -> Vec<(Oklab, f32)> {
    let mut unique: Vec<(Oklab, f32)> = Vec::new();

    for (lab, weight) in palette {
        let dupe = unique
            .iter_mut()
            .find(|(u_lab, _)| u_lab.hybrid_distance(lab) < min_dist);

        match dupe {
            Some((u_lab, u_weight)) => {
                let new_weight = *u_weight + weight; // if duplicate, sum weights

                // weighted average of the two colors
                let avg_l = (u_lab.l * *u_weight + lab.l * weight) / new_weight;
                let avg_a = (u_lab.a * *u_weight + lab.a * weight) / new_weight;
                let avg_b = (u_lab.b * *u_weight + lab.b * weight) / new_weight;

                *u_lab = Oklab::new(avg_l, avg_a, avg_b);
                *u_weight = new_weight; // update weight
            }
            None => {
                unique.push((lab, weight)); // if unique, add to list
            }
        }
    }
    unique.sort_by(|a, b| b.1.total_cmp(&a.1));
    unique
}

fn curate_palette(palette: &[(Oklab, f32)]) -> Vec<(Oklab, f32)> {
    if palette.len() <= 6 {
        return palette.to_vec();
    }

    // take the heaviest color as is, then score the rest by chroma and distance to already chosen colors
    let mut remaining = palette.to_vec();
    let mut curated = vec![remaining.remove(0)];

    while curated.len() < 6 && !remaining.is_empty() {
        let mut best_index = 0;
        let mut best_score = f32::NEG_INFINITY;

        for (i, (color_candidate, _)) in remaining.iter().enumerate() {
            let chroma = IntoColor::<Oklch>::into_color(*color_candidate).chroma;

            // distance to closest already chosen color - want this to be high for more diversity
            let min_distance = curated
                .iter()
                .map(|(chosen, _)| color_candidate.hybrid_distance(*chosen))
                .fold(f32::INFINITY, f32::min);

            // score: vibrancy * distance
            let score = (chroma * 0.4) + (min_distance * 0.6);

            if score > best_score {
                best_score = score;
                best_index = i;
            }
        }

        curated.push(remaining.swap_remove(best_index));
    }
    curated.sort_by(|a, b| b.1.total_cmp(&a.1));

    curated
}
