import type { FolderTabData } from "@/types";

export function getFolderName(path: string) {
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

export function normalizeFolders(paths: string[]) {
  return [...new Set(paths.map((path) => path.trim()).filter(Boolean))];
}

export function createScanId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createFolderTab(path: string): FolderTabData {
  return {
    path,
    name: getFolderName(path),
    images: [],
    status: "loading",
    error: null,
    scanProgress: null,
    currentScanId: null,
    isPendingOpen: false,
  };
}
