use rayon::prelude::*;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicUsize, Ordering},
};
use tauri::{AppHandle, Emitter, Manager, State};

use crate::color_analysis::create_palette::analyze_image_colors;
use crate::models::{AnalysisCache, ImageData, ScanProgressEvent};
use crate::state::{analysis_cache_path, load_state, save_state, ScanControlState};
use crate::thumbnail;

const SUPPORTED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp"];
const MAX_IMAGES: usize = 20000;
const SCAN_PROGRESS_EVENT: &str = "scan-progress";
const PROGRESS_UPDATE_INTERVAL: usize = 10;

#[tauri::command]
pub async fn scan_folder(
    app_handle: AppHandle,
    scan_control: State<'_, ScanControlState>,
    path: String,
    recursive: bool,
    scan_id: String,
) -> Result<Vec<ImageData>, String> {
    // reset cancel flag at the start of each scan
    scan_control.cancel_flag.store(false, Ordering::Relaxed);
    tauri::async_runtime::spawn_blocking(move || {
        analyze_folder_images(app_handle, path, recursive, scan_id)
    })
    .await
    .map_err(|error| format!("Scan task failed: {}", error))?
}

fn analyze_folder_images(
    app_handle: AppHandle,
    path: String,
    recursive: bool,
    scan_id: String,
) -> Result<Vec<ImageData>, String> {
    let dir = Path::new(&path);
    if !dir.exists() || !dir.is_dir() {
        return Err(format!("Invalid directory path: {}", path));
    }

    let scan_control = app_handle.state::<ScanControlState>();

    let image_paths = if recursive {
        collect_recursive(dir, &scan_control)
    } else {
        collect_flat(dir, &scan_control)
    }
    .map_err(|e| format!("Failed to scan folder: {}", e))?;

    let total_images = image_paths.len();
    // initial progress event
    report_progress(&app_handle, &path, &scan_id, 0, total_images);

    // load existing cache to avoid redundant analysis
    let cache_path = analysis_cache_path();
    let mut cache = AnalysisCache::load(&cache_path);
    let mut cache_entries = cache.0;

    let thumbnail_cache_dir =
        thumbnail::ensure_thumbnail_cache_dir(&app_handle).map_err(|e| e.to_string())?;
    let processed_counter = AtomicUsize::new(0);

    let processed_results: Vec<(String, ImageData)> = image_paths
        .into_par_iter()
        .filter_map(|p| {
            if scan_control.cancel_flag.load(Ordering::Relaxed) {
                return None;
            }

            // check cache if this image has data already
            let key = AnalysisCache::cache_key(&p);

            let result = if let Some(cached_data) = cache_entries.get(&key) {
                let mut cached_data = cached_data.clone();
                cached_data.thumbnail_path =
                    thumbnail::get_cached_thumbnail_path(&thumbnail_cache_dir, &p);
                Some((key, cached_data))
            } else {
                match analyze_image_colors(p.to_str().unwrap_or_default()) {
                    Ok(mut data) => {
                        data.thumbnail_path =
                            thumbnail::get_cached_thumbnail_path(&thumbnail_cache_dir, &p);
                        Some((key, data))
                    }
                    Err(e) => {
                        eprintln!("Skipping unreadable image {}: {}", p.display(), e);
                        None
                    }
                }
            };

            let processed = processed_counter.fetch_add(1, Ordering::Relaxed) + 1;
            if processed == total_images || processed % PROGRESS_UPDATE_INTERVAL == 0 {
                report_progress(&app_handle, &path, &scan_id, processed, total_images);
            }

            result
        })
        .collect();

    let mut images = Vec::with_capacity(processed_results.len());

    // update cache with new results
    for (key, data) in processed_results {
        cache_entries.insert(key, data.clone());
        images.push(data);
    }

    if scan_control.cancel_flag.load(Ordering::Relaxed) {
        return Err("Scan cancelled by user.".to_string());
    }

    cache.0 = cache_entries;
    cache.save(&cache_path);

    Ok(images)
}

#[tauri::command]
pub fn cancel_scan(scan_control: State<'_, ScanControlState>) {
    scan_control.cancel_flag.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn delete_image(app_handle: AppHandle, path: String) -> Result<(), String> {
    let image_path = Path::new(&path);

    if !image_path.exists() || !image_path.is_file() {
        return Err(format!("Invalid file path: {}", path));
    }

    fs::remove_file(image_path).map_err(|e| format!("Failed to delete image: {}", e))?;

    if let Ok(thumbnail_cache_dir) = thumbnail::ensure_thumbnail_cache_dir(&app_handle) {
        let _ = thumbnail::remove_cached_thumbnail(&thumbnail_cache_dir, image_path);
    }

    let cache_path = analysis_cache_path();
    let mut cache = AnalysisCache::load(&cache_path);
    cache.0.retain(|_, data| data.file_path != path);
    cache.save(&cache_path);

    let mut state = load_state();
    state.favorite_paths.retain(|p| p != &path);
    save_state(&state);

    Ok(())
}

fn collect_flat(dir: &Path, scan_control: &ScanControlState) -> std::io::Result<Vec<PathBuf>> {
    let mut images = Vec::new();

    for entry in fs::read_dir(dir)?.filter_map(|e| e.ok()) {
        if scan_control.cancel_flag.load(Ordering::Relaxed) {
            break;
        }

        let path = entry.path();
        if is_supported_image(&path) {
            images.push(path);
            if images.len() >= MAX_IMAGES {
                break;
            }
        }
    }

    Ok(images)
}

fn collect_recursive(
    root: &Path,
    scan_control: &ScanControlState,
) -> std::io::Result<Vec<PathBuf>> {
    let mut images = Vec::new();
    let mut queue = vec![root.to_path_buf()];

    'outer: while let Some(current) = queue.pop() {
        if scan_control.cancel_flag.load(Ordering::Relaxed) {
            break;
        }

        let entries = match fs::read_dir(&current) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for entry in entries.filter_map(|e| e.ok()) {
            if scan_control.cancel_flag.load(Ordering::Relaxed) {
                break 'outer;
            }

            let path = entry.path();
            if path.is_dir() && !path.is_symlink() {
                queue.push(path);
            } else if is_supported_image(&path) {
                images.push(path);
                if images.len() >= MAX_IMAGES {
                    break 'outer;
                }
            }
        }
    }

    Ok(images)
}

fn is_supported_image(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| SUPPORTED_EXTENSIONS.contains(&e.to_lowercase().as_str()))
            .unwrap_or(false)
}

fn report_progress(
    app_handle: &AppHandle,
    path: &str,
    scan_id: &str,
    processed: usize,
    total: usize,
) {
    if let Err(e) = app_handle.emit(
        SCAN_PROGRESS_EVENT,
        ScanProgressEvent {
            path: path.to_string(),
            scan_id: scan_id.to_string(),
            processed,
            total,
        },
    ) {
        eprintln!("Failed to emit scan progress: {}", e);
    }
}
