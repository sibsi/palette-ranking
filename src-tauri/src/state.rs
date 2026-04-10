use crate::models::AppState;
use std::{fs, path::PathBuf, sync::atomic::AtomicBool};

pub struct ScanControlState {
    pub cancel_flag: AtomicBool,
}

impl Default for ScanControlState {
    fn default() -> Self {
        Self {
            cancel_flag: AtomicBool::new(false),
        }
    }
}

fn cache_root() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_default();
    path.push(".cache");
    path
}

pub fn analysis_cache_path() -> PathBuf {
    let mut path = cache_root();
    path.push("color_analysis_cache.json");
    path
}

pub fn thumbnail_cache_dir() -> PathBuf {
    let mut path = cache_root();
    path.push("thumbnails");
    path
}

fn get_state_path() -> PathBuf {
    let mut path = cache_root();
    path.push("app_state.json");
    path
}

pub fn load_state() -> AppState {
    fs::read_to_string(get_state_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_state(state: &AppState) {
    let path = get_state_path();

    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            eprintln!("Failed to create state directory: {}", e);
            return;
        }
    }

    match serde_json::to_string_pretty(state) {
        Ok(json) => {
            if let Err(e) = fs::write(&path, json) {
                eprintln!("Failed to write state file: {}", e);
            }
        }
        Err(e) => eprintln!("Failed to serialize app state: {}", e),
    }
}
