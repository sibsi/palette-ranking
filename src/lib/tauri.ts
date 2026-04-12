import type { AppState, ImageData } from "@/types";
import { createDemoAppState, loadDemoImages } from "./demo";
import { invoke } from "./bridge";
import { isDemo } from "./platform";

export async function scan_folder(
  path: string,
  scanId: string,
  recursive: boolean = false,
): Promise<ImageData[]> {
  if (isDemo) {
    return loadDemoImages();
  }

  return invoke<ImageData[]>("scan_folder", {
    path,
    recursive,
    scanId,
  });
}

export async function cancel_scan(): Promise<void> {
  if (isDemo) {
    return;
  }

  return invoke("cancel_scan");
}

export async function get_app_state(): Promise<AppState> {
  if (isDemo) {
    return createDemoAppState();
  }

  return invoke<AppState>("get_app_state");
}

export async function update_app_state(
  opened_folders: string[],
): Promise<void> {
  if (isDemo) {
    return;
  }

  return invoke("update_app_state", { openedFolders: opened_folders });
}

export async function set_image_favorite(path: string, favorited: boolean) {
  if (isDemo) {
    return;
  }

  return invoke("set_image_favorite", { path, favorited });
}

export async function set_wallpaper(path: string) {
  if (isDemo) {
    return;
  }

  return invoke("set_wallpaper", { path });
}

export async function show_in_folder(path: string) {
  if (isDemo) {
    return;
  }

  return invoke("show_in_folder", { path });
}

export async function delete_image(path: string) {
  if (isDemo) {
    return;
  }

  return invoke("delete_image", { path });
}

export async function generate_thumbnails(paths: string[]): Promise<void> {
  if (isDemo) {
    return;
  }

  return invoke("generate_thumbnails", { paths });
}
