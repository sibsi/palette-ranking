use std::{
    fs::{self, File},
    io,
    path::{Path, PathBuf},
    time::SystemTime,
};

use image::{codecs::jpeg::JpegEncoder, imageops::FilterType, ColorType};
use tauri::{AppHandle, Emitter};

use crate::models::ThumbnailReadyEvent;
use crate::state::thumbnail_cache_dir as project_thumbnail_cache_dir;

const THUMBNAIL_READY_EVENT: &str = "thumbnail-ready";
const THUMBNAIL_MAX_DIMENSION: u32 = 512;
const THUMBNAIL_JPEG_QUALITY: u8 = 82;

pub fn ensure_thumbnail_cache_dir(app_handle: &AppHandle) -> io::Result<PathBuf> {
    let path = thumbnail_cache_dir(app_handle)?;
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn thumbnail_cache_dir(_app_handle: &AppHandle) -> io::Result<PathBuf> {
    Ok(project_thumbnail_cache_dir())
}

pub fn get_cached_thumbnail_path(cache_dir: &Path, source_path: &Path) -> Option<String> {
    let thumbnail_path = thumbnail_file_path(cache_dir, source_path);
    if thumbnail_is_fresh(source_path, &thumbnail_path) {
        Some(thumbnail_path.to_string_lossy().into_owned())
    } else {
        None
    }
}

pub fn remove_cached_thumbnail(cache_dir: &Path, source_path: &Path) -> io::Result<()> {
    let thumbnail_path = thumbnail_file_path(cache_dir, source_path);
    if thumbnail_path.exists() {
        fs::remove_file(thumbnail_path)?;
    }
    Ok(())
}

#[tauri::command]
pub fn generate_thumbnails(app_handle: AppHandle, paths: Vec<String>) -> Result<(), String> {
    let cache_dir = ensure_thumbnail_cache_dir(&app_handle).map_err(|e| e.to_string())?;

    let mut pending_paths = Vec::new();
    let mut seen_paths = std::collections::HashSet::new();

    for raw_path in paths {
        let normalized = raw_path.trim();
        if normalized.is_empty() || !seen_paths.insert(normalized.to_string()) {
            continue;
        }

        let source_path = PathBuf::from(normalized);
        if !source_path.is_file() || get_cached_thumbnail_path(&cache_dir, &source_path).is_some() {
            continue;
        }

        pending_paths.push(normalized.to_string());
    }

    tauri::async_runtime::spawn(async move {
        for path in pending_paths {
            let cache_dir = cache_dir.clone();
            let source_path = PathBuf::from(&path);
            let app_handle = app_handle.clone();

            let result = tauri::async_runtime::spawn_blocking(move || {
                create_thumbnail(&cache_dir, &source_path)
            })
            .await;

            match result {
                Ok(Ok(thumbnail_path)) => emit_thumbnail_ready(&app_handle, path, thumbnail_path),
                Ok(Err(e)) => eprintln!("Thumbnail generation failed for {}: {}", path, e),
                Err(e) => eprintln!("Thumbnail worker join failure for {}: {}", path, e),
            }
        }
    });

    Ok(())
}

fn create_thumbnail(cache_dir: &Path, source_path: &Path) -> Result<String, String> {
    let thumbnail_path = thumbnail_file_path(cache_dir, source_path);

    if let Some(parent) = thumbnail_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let image = image::open(source_path).map_err(|e| e.to_string())?;
    let resized = image.resize(
        THUMBNAIL_MAX_DIMENSION,
        THUMBNAIL_MAX_DIMENSION,
        FilterType::Lanczos3,
    );
    let rgb = resized.to_rgb8();
    let (width, height) = rgb.dimensions();

    let file = File::create(&thumbnail_path).map_err(|e| e.to_string())?;
    let mut encoder = JpegEncoder::new_with_quality(file, THUMBNAIL_JPEG_QUALITY);
    encoder
        .encode(&rgb, width, height, ColorType::Rgb8)
        .map_err(|e| e.to_string())?;

    Ok(thumbnail_path.to_string_lossy().into_owned())
}

fn thumbnail_file_path(cache_dir: &Path, source_path: &Path) -> PathBuf {
    let mut path = cache_dir.to_path_buf();
    path.push(format!("{}.jpg", path_hash(source_path)));
    path
}

fn thumbnail_is_fresh(source_path: &Path, thumbnail_path: &Path) -> bool {
    if !thumbnail_path.is_file() {
        return false;
    }

    let get_mtime = |p: &Path| {
        fs::metadata(p)
            .and_then(|m| m.modified())
            .unwrap_or(SystemTime::UNIX_EPOCH)
    };
    get_mtime(thumbnail_path) >= get_mtime(source_path)
}

fn path_hash(source_path: &Path) -> String {
    let mut hash: u64 = 14_695_981_039_346_656_037;
    for byte in source_path.to_string_lossy().bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(1_099_511_628_211);
    }
    format!("{:016x}", hash)
}

fn emit_thumbnail_ready(app_handle: &AppHandle, path: String, thumbnail_path: String) {
    if let Err(e) = app_handle.emit(
        THUMBNAIL_READY_EVENT,
        ThumbnailReadyEvent {
            path,
            thumbnail_path,
        },
    ) {
        eprintln!("Failed to emit thumbnail progress: {}", e);
    }
}
