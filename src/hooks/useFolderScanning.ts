import { startTransition, useCallback, useEffect, type RefObject } from "react";
import { listen } from "@tauri-apps/api/event";
import type { FolderTabData, ScanProgress } from "@/types";
import { createScanId } from "../lib/folderHelpers";
import { generate_thumbnails, scan_folder } from "../lib/tauri";

const SCAN_PROGRESS_EVENT = "scan-progress";

type UpdateTab = (
  path: string,
  updates: Partial<FolderTabData> | ((tab: FolderTabData) => FolderTabData),
) => void;

type RemoveTab = (path: string) => void;

export interface ScanDirectoryOptions {
  removeOnCancel?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function useFolderScanning(
  updateTab: UpdateTab,
  removeTab: RemoveTab,
  favoritePathsRef: RefObject<Set<string>>,
) {
  const scanDirectory = useCallback(
    async (
      path: string,
      recursiveScan: boolean,
      options?: ScanDirectoryOptions,
    ): Promise<"success" | "cancelled" | "error"> => {
      const scanId = createScanId();

      updateTab(path, {
        status: "loading",
        error: null,
        scanProgress: null,
        currentScanId: scanId,
      });

      try {
        const images = await scan_folder(path, scanId, recursiveScan);

        startTransition(() => {
          updateTab(path, (tab) => {
            if (tab.currentScanId !== scanId) return tab;

            return {
              ...tab,
              images: images.map((image) => ({
                ...image,
                favorited: favoritePathsRef.current.has(image.file_path),
              })),
              status: "success",
              error: null,
              scanProgress: null,
              currentScanId: null,
              isPendingOpen: false,
            };
          });
        });

        void generate_thumbnails(images.map((image) => image.file_path)).catch(
          (error) => {
            console.error(`Failed to queue thumbnails for ${path}`, error);
          },
        );

        options?.onSuccess?.();
        return "success";
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const wasCancelled = message === "Scan cancelled by user.";

        if (wasCancelled && options?.removeOnCancel) {
          startTransition(() => {
            removeTab(path);
            options.onCancel?.();
          });
          return "cancelled";
        }

        startTransition(() => {
          updateTab(path, (tab) => {
            if (tab.currentScanId !== scanId) return tab;

            return {
              ...tab,
              status:
                wasCancelled && tab.images.length > 0 ? "success" : "idle",
              error: wasCancelled ? null : message,
              scanProgress: null,
              currentScanId: null,
              isPendingOpen: false,
            };
          });
        });

        return wasCancelled ? "cancelled" : "error";
      }
    },
    [favoritePathsRef, removeTab, updateTab],
  );

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    void listen<ScanProgress>(SCAN_PROGRESS_EVENT, (event) => {
      const progress = event.payload;
      updateTab(progress.path, (tab) => {
        if (tab.currentScanId !== progress.scanId) return tab;
        return { ...tab, status: "loading", scanProgress: progress };
      });
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [updateTab]);

  return { scanDirectory };
}
