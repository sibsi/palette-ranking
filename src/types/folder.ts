import type { Status } from "./common";
import type { ImageData } from "./image";

export interface AppState {
  opened_folders: string[];
  favorite_paths: string[];
}

export interface ScanProgress {
  path: string;
  scanId: string;
  processed: number;
  total: number;
}

export interface ThumbnailReadyEvent {
  path: string;
  thumbnailPath: string;
}

export interface FolderTabData {
  path: string;
  name: string;
  images: ImageData[];
  status: Status;
  error: string | null;
  scanProgress: ScanProgress | null;
  currentScanId: string | null;
  isPendingOpen: boolean;
}
