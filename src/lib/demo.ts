import type { AppState, FolderTabData, ImageData } from "@/types";

export const DEMO_FOLDER_PATH = "demo-gallery";

const DEMO_FOLDER_NAME = "Curated Demo";

interface DemoIndexFile {
  images: ImageData[];
}

export function createDemoFolderTab(images: ImageData[] = []): FolderTabData {
  return {
    path: DEMO_FOLDER_PATH,
    name: DEMO_FOLDER_NAME,
    images,
    status: images.length > 0 ? "success" : "loading",
    error: null,
    scanProgress: null,
    currentScanId: null,
    isPendingOpen: false,
  };
}

export function createDemoAppState(): AppState {
  return {
    opened_folders: [DEMO_FOLDER_PATH],
    favorite_paths: [],
  };
}

export async function loadDemoImages(): Promise<ImageData[]> {
  const response = await fetch(resolveDemoAssetPath("demo/index.json"));

  if (!response.ok) {
    throw new Error(
      "Demo gallery data was not found. Add public/demo/index.json before publishing the demo.",
    );
  }

  const payload = (await response.json()) as DemoIndexFile;
  const images = payload.images;

  if (!Array.isArray(images)) {
    throw new Error(
      "Demo gallery data is invalid. Expected { images: ImageData[] }.",
    );
  }

  return images.map(normalizeDemoImageData);
}

function normalizeDemoImageData(image: ImageData): ImageData {
  return {
    ...image,
    file_path: resolveDemoAssetPath(image.file_path),
    thumbnail_path: image.thumbnail_path
      ? resolveDemoAssetPath(image.thumbnail_path)
      : null,
  };
}

function resolveDemoAssetPath(path: string): string {
  if (/^(?:https?:|data:|blob:)/.test(path)) {
    return path;
  }

  const baseUrl = import.meta.env.BASE_URL;
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path
    .replace(/^[./]+/, "")
    .replace(/^\/+/, "");

  if (path.startsWith(normalizedBase)) {
    return path;
  }

  return `${normalizedBase}${normalizedPath}`;
}
