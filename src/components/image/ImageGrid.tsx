import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { GridSize, ImageData, ImageShape } from "@/types";
import { isDemo } from "../../lib/platform";
import { delete_image } from "../../lib/tauri";
import { useLayout } from "../layout/MainLayout";
import ImageCard from "./ImageCard";
import ConfirmationModal from "../ui/ConfirmationModal";

interface ImageGridProps {
  images: ImageData[];
  status: "loading" | "success" | "error" | "idle";
  activeImageId: string | null;
  onSelectImage: (id: string | null) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  emptyMessage?: string;
}

interface ImageRow {
  key: string;
  images: ImageData[];
}

const shapeClasses: Record<Exclude<ImageShape, "original">, string> = {
  square: "aspect-square",
  horizontal: "aspect-[4/3]",
  vertical: "aspect-[3/4]",
  // original handled inline
};

const gridSizeConfig: Record<
  GridSize,
  { heightClass: string; rowHeight: number }
> = {
  S: { heightClass: "h-48", rowHeight: 192 },
  M: { heightClass: "h-72", rowHeight: 288 },
  L: { heightClass: "h-96", rowHeight: 384 },
};

const gridGap = 20;
const paddingX = 32;
const paddingY = 24;

export default function ImageGrid({
  images,
  status,
  activeImageId,
  onSelectImage,
  onDelete,
  onFavorite,
  emptyMessage,
}: ImageGridProps) {
  const { imageShape = "original", gridSize = "M" } = useLayout();
  const [pendingDeleteImage, setImageToDelete] = useState<ImageData | null>(
    null,
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteImage) return;
    if (isDemo) {
      setImageToDelete(null);
      return;
    }

    try {
      await delete_image(pendingDeleteImage.file_path);
      onDelete(pendingDeleteImage.id);
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setImageToDelete(null);
    }
  }, [onDelete, pendingDeleteImage]);

  if (status === "loading") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-rose-500 dark:border-slate-700 dark:border-t-rose-400" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-12">
        <div className="app-panel max-w-sm rounded-3xl border px-8 py-10 text-center backdrop-blur-lg">
          <p className="text-lg font-bold text-(--app-fg)">
            No matches found
          </p>
          <p className="mt-2 text-sm text-(--text-muted)">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  const { rowHeight, heightClass } = gridSizeConfig[gridSize];

  return (
    <>
      <VirtualGrid
        images={images}
        imageShape={imageShape}
        rowHeight={rowHeight}
        itemHeightClass={heightClass}
        activeImageId={activeImageId}
        onSelectImage={onSelectImage}
        onDeleteRequest={setImageToDelete}
        onFavorite={onFavorite}
      />

      <ConfirmationModal
        isOpen={pendingDeleteImage !== null}
        onClose={() => setImageToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete Wallpaper"
        message={
          pendingDeleteImage
            ? `Are you sure you want to permanently delete '${pendingDeleteImage.file_name}'?`
            : ""
        }
      />
    </>
  );
}

// --- Virtualization Logic ---
interface VirtualGridProps {
  images: ImageData[];
  imageShape: ImageShape;
  rowHeight: number;
  itemHeightClass: string;
  activeImageId: string | null;
  onSelectImage: (id: string | null) => void;
  onDeleteRequest: (image: ImageData) => void;
  onFavorite: (id: string) => void;
}

function VirtualGrid({
  images,
  imageShape,
  rowHeight,
  itemHeightClass,
  activeImageId,
  onSelectImage,
  onDeleteRequest,
  onFavorite,
}: VirtualGridProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      const element = scrollRef.current;
      if (!element) return;
      setWidth(element.clientWidth);
    });
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(() => {
    const availableWidth = Math.max(0, width - paddingX * 2);
    return makeImageRows(images, availableWidth, rowHeight, imageShape);
  }, [images, width, rowHeight, imageShape]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      rowHeight + (index === rows.length - 1 ? 0 : gridGap),
    overscan: 4,
    getItemKey: (index) => rows[index]?.key ?? index,
  });

  return (
    <div
      ref={scrollRef}
      className="relative min-h-0 min-w-0 flex-1 overflow-y-auto"
    >
      <div
        className="relative"
        style={{ height: virtualizer.getTotalSize() + paddingY * 2 }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;

          return (
            <div
              key={row.key}
              className="absolute left-0 top-0 flex w-full justify-center gap-5 px-8"
              style={{
                height: rowHeight,
                transform: `translateY(${virtualRow.start + paddingY}px)`,
              }}
            >
              {row.images.map((image) => {
                const style: CSSProperties = {};

                if (imageShape === "original") {
                  const safeHeight = image.height > 0 ? image.height : 1;
                  style.aspectRatio = `${image.width} / ${safeHeight}`;
                }

                return (
                  <div
                    key={image.id}
                    className={`flex-none ${itemHeightClass} ${imageShape === "original" ? "" : shapeClasses[imageShape]}`}
                    style={style}
                  >
                    <ImageCard
                      image={image}
                      isActive={activeImageId === image.id}
                      onClick={() => onSelectImage(image.id)}
                      onDelete={() => onDeleteRequest(image)}
                      onFavorite={onFavorite}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function makeImageRows(
  images: ImageData[],
  availableWidth: number,
  rowHeight: number,
  imageShape: ImageShape,
): ImageRow[] {
  if (images.length === 0) return [];

  if (availableWidth <= 0) {
    return images.map((image) => ({
      key: image.id,
      images: [image],
    }));
  }

  const rows: ImageRow[] = [];
  let currentRow: ImageData[] = [];
  let currentRowWidth = 0;

  for (const image of images) {
    const itemWidth = getImageWidth(image, imageShape, rowHeight);

    if (currentRow.length === 0) {
      currentRow = [image];
      currentRowWidth = itemWidth;
      continue;
    }

    const nextRowWidth = currentRowWidth + gridGap + itemWidth;

    if (nextRowWidth > availableWidth) {
      rows.push({
        key: currentRow.map((img) => img.id).join("-"),
        images: currentRow,
      });

      currentRow = [image];
      currentRowWidth = itemWidth;
      continue;
    }

    currentRow.push(image);
    currentRowWidth = nextRowWidth;
  }

  if (currentRow.length > 0) {
    rows.push({
      key: currentRow.map((img) => img.id).join("-"),
      images: currentRow,
    });
  }

  return rows;
}

function getImageWidth(
  image: ImageData,
  imageShape: ImageShape,
  rowHeight: number,
) {
  switch (imageShape) {
    case "square":
      return rowHeight;
    case "horizontal":
      return rowHeight * (4 / 3);
    case "vertical":
      return rowHeight * (3 / 4);
    case "original": {
      const safeHeight = image.height > 0 ? image.height : 1;
      return Math.max(1, rowHeight * (image.width / safeHeight));
    }
  }
}
