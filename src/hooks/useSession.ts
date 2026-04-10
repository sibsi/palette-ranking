import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { FolderTabData } from "@/types";
import { createFolderTab, normalizeFolders } from "../lib/folderHelpers";
import { get_app_state, update_app_state } from "../lib/tauri";
import type { ScanDirectoryOptions } from "./useFolderScanning";

type SetTabs = Dispatch<SetStateAction<FolderTabData[]>>;
type SetActiveFolderPath = Dispatch<SetStateAction<string | null>>;
type SetIsSessionLoading = Dispatch<SetStateAction<boolean>>;

type ScanDirectory = (
  path: string,
  recursiveScan: boolean,
  options?: ScanDirectoryOptions,
) => Promise<"success" | "cancelled" | "error">;

export function useSession(
  setTabs: SetTabs,
  setActiveFolderPath: SetActiveFolderPath,
  setIsSessionLoading: SetIsSessionLoading,
  tabsRef: RefObject<FolderTabData[]>,
  favoritePathsRef: RefObject<Set<string>>,
  scanDirectory: ScanDirectory,
  recursive: boolean,
) {
  const persistOpenedFolders = useCallback(async (paths: string[]) => {
    try {
      await update_app_state(paths);
    } catch (error) {
      console.error("Failed to persist opened folders", error);
    }
  }, []);

  const loadSession = useCallback(async () => {
    setIsSessionLoading(true);

    try {
      const state = await get_app_state();
      const savedFolders = normalizeFolders(state.opened_folders ?? []);
      favoritePathsRef.current = new Set(
        normalizeFolders(state.favorite_paths ?? []),
      );

      if (savedFolders.length === 0) {
        setTabs([]);
        setActiveFolderPath(null);
        return;
      }

      setTabs(savedFolders.map((path) => createFolderTab(path)));
      setActiveFolderPath(savedFolders[0]);

      await Promise.all(
        savedFolders.map((path) =>
          scanDirectory(path, recursive, {
            removeOnCancel: true,
            onCancel: () => {
              const remainingTabs = tabsRef.current.filter(
                (tab) => tab.path !== path,
              );
              const remainingPaths = remainingTabs.map((tab) => tab.path);

              setActiveFolderPath((current) =>
                current === path ? (remainingPaths[0] ?? null) : current,
              );
              void persistOpenedFolders(remainingPaths);
            },
          }),
        ),
      );
    } catch (error) {
      console.error("Failed to restore saved folders", error);
      setTabs([]);
      setActiveFolderPath(null);
    } finally {
      setIsSessionLoading(false);
    }
  }, [
    favoritePathsRef,
    persistOpenedFolders,
    recursive,
    scanDirectory,
    setActiveFolderPath,
    setIsSessionLoading,
    setTabs,
    tabsRef,
  ]);

  return { loadSession, persistOpenedFolders };
}
