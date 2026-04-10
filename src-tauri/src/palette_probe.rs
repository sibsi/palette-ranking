use crate::color_analysis::create_palette::analyze_image_colors;
use crate::models::PaletteColor;
use palette::{IntoColor, Oklab, Srgb};
use std::fs;
use std::path::{Path, PathBuf};

const PROBE_COMMAND: &str = "palette-probe";

pub fn try_run_from_args(args: Vec<String>) -> Result<bool, String> {
    let Some(command) = args.first() else {
        return Ok(false);
    };

    if command != PROBE_COMMAND {
        return Ok(false);
    }

    let image_paths = collect_test_images()?;

    if image_paths.is_empty() {
        return Err(format!(
            "No image files found in '{}'.",
            test_images_dir().display()
        ));
    }

    print_report(&image_paths)?;
    Ok(true)
}

fn test_images_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("test_images")
}

fn collect_test_images() -> Result<Vec<PathBuf>, String> {
    let dir = test_images_dir();
    let entries =
        fs::read_dir(&dir).map_err(|err| format!("Failed to read '{}': {}", dir.display(), err))?;

    let image_paths: Vec<PathBuf> = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.is_file() && is_supported_image(path))
        .collect();

    Ok(image_paths)
}

fn is_supported_image(path: &Path) -> bool {
    let Some(extension) = path.extension().and_then(|ext| ext.to_str()) else {
        return false;
    };

    matches!(
        extension.to_ascii_lowercase().as_str(),
        "png" | "jpg" | "jpeg" | "webp" | "bmp" | "gif"
    )
}

fn print_report(image_paths: &[PathBuf]) -> Result<(), String> {
    println!("Palettes from {}", test_images_dir().display());

    for image_path in image_paths {
        let image_path_str = image_path.to_string_lossy();
        let image_data = analyze_image_colors(&image_path_str)?;
        let file_name = image_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown");

        println!("{}", file_name);
        println!("  display: {}", palette_row(&image_data.display_palette));
        println!();
        println!("  full:    {}", palette_row(&image_data.palette));
        println!();
    }

    Ok(())
}

fn palette_row(palette: &[PaletteColor]) -> String {
    if palette.is_empty() {
        return "(empty)".to_string();
    }

    palette
        .iter()
        .map(|color| ansi_swatch(palette_color_to_rgb(color)))
        .collect::<Vec<_>>()
        .join(" ")
}

fn palette_color_to_rgb(color: &PaletteColor) -> [u8; 3] {
    let rgb: Srgb = Oklab::new(color.l, color.a, color.b).into_color();
    [
        (rgb.red.clamp(0.0, 1.0) * 255.0).round() as u8,
        (rgb.green.clamp(0.0, 1.0) * 255.0).round() as u8,
        (rgb.blue.clamp(0.0, 1.0) * 255.0).round() as u8,
    ]
}

fn ansi_swatch(rgb: [u8; 3]) -> String {
    format!(
        "\u{1b}[48;2;{};{};{}m      \u{1b}[0m",
        rgb[0], rgb[1], rgb[2]
    )
}
