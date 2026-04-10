use crate::models::AnalysisCache;
use std::{fs, path::Path, time::UNIX_EPOCH};

const ANALYSIS_CACHE_VERSION: u8 = 4;

impl AnalysisCache {
    pub fn load(cache_path: &Path) -> Self {
        fs::read_to_string(cache_path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self, cache_path: &Path) {
        if let Some(parent) = cache_path.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                eprintln!("Failed to create cache directory: {}", e);
                return;
            }
        }

        match serde_json::to_string(self) {
            Ok(json) => {
                if let Err(e) = fs::write(cache_path, json) {
                    eprintln!("Failed to write cache file: {}", e);
                }
            }
            Err(e) => eprintln!("Failed to serialize cache: {}", e),
        }
    }

    pub fn cache_key(path: &Path) -> String {
        let mtime = fs::metadata(path)
            .and_then(|m| m.modified())
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        format!(
            "{}:{}:analysis-v{}",
            path.display(),
            mtime,
            ANALYSIS_CACHE_VERSION
        )
    }
}

pub fn id_maker(path: &Path) -> String {
    let mtime = fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let input = format!(
        "{}:{}:analysis-v{}",
        path.display(),
        mtime,
        ANALYSIS_CACHE_VERSION
    );

    let mut hash: u64 = 14_695_981_039_346_656_037;
    for byte in input.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(1_099_511_628_211);
    }
    format!("{:016x}", hash)
}
