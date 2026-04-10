#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::models::AppState;
use crate::state::{load_state, save_state, ScanControlState};

mod cache;
mod color_analysis;
mod folder;
mod models;
mod state;
mod system;
mod thumbnail;

#[tauri::command]
fn get_app_state() -> AppState {
    load_state()
}

#[tauri::command]
fn update_app_state(opened_folders: Vec<String>) {
    let mut state = load_state();
    state.opened_folders = opened_folders;
    save_state(&state);
}

#[tauri::command]
fn set_image_favorite(path: String, favorited: bool) {
    let mut state = load_state();

    if favorited {
        if !state.favorite_paths.contains(&path) {
            state.favorite_paths.push(path);
        }
    } else {
        state.favorite_paths.retain(|p| p != &path);
    }

    save_state(&state);
}

fn main() {
    tauri::Builder::default()
        .manage(ScanControlState::default())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            thumbnail::ensure_thumbnail_cache_dir(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            folder::scan_folder,
            folder::cancel_scan,
            folder::delete_image,
            thumbnail::generate_thumbnails,
            system::set_wallpaper,
            system::show_in_folder,
            get_app_state,
            update_app_state,
            set_image_favorite
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
