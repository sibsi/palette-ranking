import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type {
  FolderTabData,
  ImageData,
  ScanProgress,
  Status,
} from "@/types";
import { useFolderScanning } from "../hooks/useFolderScanning";
import { useImages } from "../hooks/useImages";
import { DEMO_FOLDER_PATH } from "../lib/demo";
import { useSession } from "../hooks/useSession";
import { openDirectoryDialog } from "../lib/bridge";
import { createFolderTab } from "../lib/folderHelpers";
import { isDemo } from "../lib/platform";

interface UseFolderValue {
  tabs: FolderTabData[];
  activeTab: FolderTabData | null;
  activeFolderPath: string | null;
  images: ImageData[];
  scanProgress: ScanProgress | null;
  status: Status;
  error: string | null;
  recursive: boolean;
  setRecursive: Dispatch<SetStateAction<boolean>>;
  isSessionLoading: boolean;
  hasOpenFolders: boolean;
  openFolder: () => Promise<boolean>;
  loadSession: () => Promise<void>;
  setActiveFolder: (path: string) => void;
  closeFolder: (path: string) => void;
  rescanActiveFolder: () => Promise<void>;
  removeImage: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const FolderContext = createContext<UseFolderValue | null>(null);

export function FolderProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<FolderTabData[]>([]);
  const [activeFolderPath, setActiveFolderPath] = useState<string | null>(null);
  const [recursive, setRecursive] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const hasLoadedSessionRef = useRef(false);
  const favoritePathsRef = useRef<Set<string>>(new Set());
  const tabsRef = useRef<FolderTabData[]>([]);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const updateTab = useCallback(
    (
      path: string,
      updates: Partial<FolderTabData> | ((tab: FolderTabData) => FolderTabData),
    ) => {
      setTabs((currentTabs) =>
        currentTabs.map((tab) => {
          if (tab.path !== path) return tab;
          return typeof updates === "function"
            ? updates(tab)
            : { ...tab, ...updates };
        }),
      );
    },
    [],
  );

  const removeTab = useCallback((path: string) => {
    setTabs((currentTabs) => currentTabs.filter((tab) => tab.path !== path));
  }, []);

  const { scanDirectory } = useFolderScanning(
    updateTab,
    removeTab,
    favoritePathsRef,
  );
  const { loadSession, persistOpenedFolders } = useSession(
    setTabs,
    setActiveFolderPath,
    setIsSessionLoading,
    tabsRef,
    favoritePathsRef,
    scanDirectory,
    recursive,
  );
  const { removeImage, toggleFavorite } = useImages(
    activeFolderPath,
    updateTab,
    setTabs,
    favoritePathsRef,
  );

  useEffect(() => {
    if (!hasLoadedSessionRef.current) {
      hasLoadedSessionRef.current = true;
      void loadSession();
    }
  }, [loadSession]);

  const openFolderPath = useCallback(
    async (path: string) => {
      if (isDemo) return false;

      const normalizedPath = path.trim();
      if (!normalizedPath) return false;

      const previousActiveFolderPath = activeFolderPath;

      let alreadyOpen = false;
      setTabs((currentTabs) => {
        alreadyOpen = currentTabs.some((tab) => tab.path === normalizedPath);
        if (alreadyOpen) {
          return currentTabs;
        }

        return [
          ...currentTabs,
          { ...createFolderTab(normalizedPath), isPendingOpen: true },
        ];
      });

      setActiveFolderPath(normalizedPath);

      const result = await scanDirectory(normalizedPath, recursive, {
        removeOnCancel: !alreadyOpen,
        onCancel: () => {
          setActiveFolderPath(previousActiveFolderPath);
        },
        onSuccess: () => {
          if (alreadyOpen) {
            return;
          }

          const pathsToPersist = tabsRef.current
            .map((tab) =>
              tab.path === normalizedPath
                ? { ...tab, isPendingOpen: false }
                : tab,
            )
            .filter((tab) => !tab.isPendingOpen)
            .map((tab) => tab.path);

          void persistOpenedFolders(pathsToPersist);
        },
      });

      return result === "success" || alreadyOpen;
    },
    [activeFolderPath, persistOpenedFolders, recursive, scanDirectory],
  );

  const openFolder = useCallback(async () => {
    if (isDemo) return false;

    const folderPath = await openDirectoryDialog();
    if (!folderPath) return false;

    return openFolderPath(folderPath);
  }, [openFolderPath]);

  const closeFolder = useCallback(
    (path: string) => {
      if (isDemo && path === DEMO_FOLDER_PATH) {
        return;
      }

      setTabs((currentTabs) => {
        const tabIndex = currentTabs.findIndex((tab) => tab.path === path);
        if (tabIndex === -1) return currentTabs;

        const nextTabs = currentTabs.filter((tab) => tab.path !== path);

        if (activeFolderPath === path) {
          const nextActive =
            nextTabs[tabIndex] ?? nextTabs[tabIndex - 1] ?? null;
          setActiveFolderPath(nextActive?.path ?? null);
        }

        void persistOpenedFolders(nextTabs.map((tab) => tab.path));
        return nextTabs;
      });
    },
    [activeFolderPath, persistOpenedFolders],
  );

  const setActiveFolder = useCallback((path: string) => {
    setActiveFolderPath(path);
  }, []);

  const rescanActiveFolder = useCallback(async () => {
    if (isDemo) {
      return;
    }

    if (activeFolderPath) {
      await scanDirectory(activeFolderPath, recursive);
    }
  }, [activeFolderPath, recursive, scanDirectory]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.path === activeFolderPath) ?? tabs[0] ?? null,
    [activeFolderPath, tabs],
  );

  const value = useMemo<UseFolderValue>(
    () => ({
      tabs,
      activeTab,
      activeFolderPath: activeTab?.path ?? null,
      images: activeTab?.images ?? [],
      scanProgress: activeTab?.scanProgress ?? null,
      status: activeTab?.status ?? "idle",
      error: activeTab?.error ?? null,
      recursive,
      setRecursive,
      isSessionLoading,
      hasOpenFolders: tabs.length > 0,
      openFolder,
      loadSession,
      setActiveFolder,
      closeFolder,
      rescanActiveFolder,
      removeImage,
      toggleFavorite,
    }),
    [
      tabs,
      activeTab,
      recursive,
      isSessionLoading,
      openFolder,
      loadSession,
      setActiveFolder,
      closeFolder,
      rescanActiveFolder,
      removeImage,
      toggleFavorite,
    ],
  );

  return (
    <FolderContext.Provider value={value}>{children}</FolderContext.Provider>
  );
}

export function useFolder() {
  const context = useContext(FolderContext);

  if (!context) {
    throw new Error("useFolder must be used within a FolderProvider");
  }

  return context;
}
