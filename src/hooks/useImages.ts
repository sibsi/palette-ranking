import {
  startTransition,
  useCallback,
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { FolderTabData, ThumbnailReadyEvent } from "@/types";
import { listen } from "../lib/bridge";
import { set_image_favorite } from "../lib/tauri";

const THUMBNAIL_READY_EVENT = "thumbnail-ready";

type UpdateTab = (
  path: string,
  updates: Partial<FolderTabData> | ((tab: FolderTabData) => FolderTabData),
) => void;

type SetTabs = Dispatch<SetStateAction<FolderTabData[]>>;

export function useImages(
  activeFolderPath: string | null,
  updateTab: UpdateTab,
  setTabs: SetTabs,
  favoritePathsRef: RefObject<Set<string>>,
) {
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    void listen<ThumbnailReadyEvent>(THUMBNAIL_READY_EVENT, (event) => {
      const { path, thumbnailPath } = event.payload;

      startTransition(() => {
        setTabs((currentTabs) =>
          currentTabs.map((tab) => {
            let hasChanges = false;

            const nextImages = tab.images.map((image) => {
              if (
                image.file_path !== path ||
                image.thumbnail_path === thumbnailPath
              ) {
                return image;
              }

              hasChanges = true;
              return { ...image, thumbnail_path: thumbnailPath };
            });

            return hasChanges ? { ...tab, images: nextImages } : tab;
          }),
        );
      });
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [setTabs]);

  const removeImage = useCallback(
    (id: string) => {
      if (!activeFolderPath) return;

      updateTab(activeFolderPath, (tab) => {
        const removed = tab.images.find((image) => image.id === id);
        if (removed) {
          favoritePathsRef.current.delete(removed.file_path);
        }

        return {
          ...tab,
          images: tab.images.filter((image) => image.id !== id),
        };
      });
    },
    [activeFolderPath, favoritePathsRef, updateTab],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      if (!activeFolderPath) return;

      updateTab(activeFolderPath, (tab) => {
        const image = tab.images.find((currentImage) => currentImage.id === id);
        if (!image) return tab;

        const nextFavorited = !image.favorited;

        if (nextFavorited) {
          favoritePathsRef.current.add(image.file_path);
        } else {
          favoritePathsRef.current.delete(image.file_path);
        }

        void set_image_favorite(image.file_path, nextFavorited).catch(
          console.error,
        );

        return {
          ...tab,
          images: tab.images.map((currentImage) =>
            currentImage.id === id
              ? { ...currentImage, favorited: nextFavorited }
              : currentImage,
          ),
        };
      });
    },
    [activeFolderPath, favoritePathsRef, updateTab],
  );

  return { removeImage, toggleFavorite };
}
