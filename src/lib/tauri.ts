import { invoke } from "@tauri-apps/api/core";
import type { AppState, ImageData } from "@/types";

export async function scan_folder(
  path: string,
  scanId: string,
  recursive: boolean = false,
): Promise<ImageData[]> {
  return invoke<ImageData[]>("scan_folder", {
    path,
    recursive,
    scanId,
  });
}

export async function cancel_scan(): Promise<void> {
  return invoke("cancel_scan");
}

export async function get_app_state(): Promise<AppState> {
  return invoke<AppState>("get_app_state");
}

export async function update_app_state(
  opened_folders: string[],
): Promise<void> {
  return invoke("update_app_state", { openedFolders: opened_folders });
}

export async function set_image_favorite(path: string, favorited: boolean) {
  return invoke("set_image_favorite", { path, favorited });
}

export async function set_wallpaper(path: string) {
  return invoke("set_wallpaper", { path });
}

export async function show_in_folder(path: string) {
  return invoke("show_in_folder", { path });
}

export async function delete_image(path: string) {
  return invoke("delete_image", { path });
}

export async function generate_thumbnails(paths: string[]): Promise<void> {
  return invoke("generate_thumbnails", { paths });
}
