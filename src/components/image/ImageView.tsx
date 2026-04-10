import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { formatHex } from "culori";
import { FolderOpen, Heart, Trash2, Wallpaper, X } from "lucide-react";
import { delete_image, set_wallpaper, show_in_folder } from "../../lib/tauri";
import { getImageTags } from "../../lib/imageTags";
import type { ImageData } from "@/types";
import ConfirmationModal from "../ui/ConfirmationModal";

interface ImageViewProps {
  image: ImageData;
  onClose: () => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
}

export default function ImageView({
  image,
  onClose,
  onDelete,
  onFavorite,
}: ImageViewProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const imageSrc = convertFileSrc(image.file_path);

  const accent = getAccentColor(image);
  const tags = getImageTags(image);

  const orientation =
    image.width === image.height
      ? "Square"
      : image.width > image.height
        ? "Landscape"
        : "Portrait";

  async function handleDeleteConfirm() {
    try {
      await delete_image(image.file_path);
      onDelete(image.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  }

  function handleSetWallpaper() {
    void set_wallpaper(image.file_path).catch(console.error);
  }

  function handleShowInFolder() {
    void show_in_folder(image.file_path).catch(console.error);
  }

  function handleFavoriteToggle() {
    onFavorite(image.id);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
        style={{ backgroundColor: "var(--backdrop)" }}
        onClick={onClose}
      >
        <div
          className="app-panel relative flex h-[85vh] max-h-200 w-full max-w-6xl overflow-hidden rounded-4xl border backdrop-blur-xl lg:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Display Area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-5">
            <div
              className="absolute inset-0 opacity-20 blur-3xl transition-colors duration-700 dark:opacity-40"
              style={{ backgroundColor: accent.color }}
            />

            <img
              src={imageSrc}
              alt={image.file_name}
              className="relative z-10 max-h-full max-w-full rounded-md object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.18)] dark:drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="app-panel-muted absolute left-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border text-(--text-muted) shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-(--surface-active) hover:text-(--app-fg)"
          >
            <X size={20} />
          </button>

          {/* Sidebar Info Panel */}
          <aside className="flex h-full w-80 shrink-0 flex-col border-l border-(--border-soft) bg-transparent p-8 backdrop-blur-sm">
            <div className="min-w-0">
              <h2 className="truncate font-bold text-(--app-fg)">
                {image.file_name}
              </h2>
              <p
                className="mt-1 truncate text-[11px] font-medium text-(--text-soft)"
                title={image.file_path}
              >
                {image.file_path}
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <DetailPill label={`${image.width} x ${image.height}`} />
              <DetailPill label={orientation} />
            </div>

            {/* Color Palette */}
            <div className="mt-8">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-(--text-faint)">
                Color Palette
              </h3>
              <div className="mt-4 space-y-4">
                <PaletteGroup colors={image.display_palette} />
              </div>
            </div>

            {/* Image Tags */}
            <div className="mt-8 space-y-2">
              <MetricCard label="Brightness" value={tags.brightness} />
              <MetricCard label="Temperature" value={tags.temperature} />
              <MetricCard label="Saturation" value={tags.saturation} />
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-6">
              <div className="grid grid-cols-1 gap-3">
                <ActionButton onClick={handleSetWallpaper}>
                  <Wallpaper size={16} />
                  Set Wallpaper
                </ActionButton>

                <ActionButton onClick={handleShowInFolder}>
                  <FolderOpen size={16} />
                  Show In Folder
                </ActionButton>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    className="app-panel-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-(--text-soft) shadow-sm backdrop-blur-md transition-all hover:scale-105"
                    style={{
                      color: image.favorited ? accent.color : undefined,
                      borderColor: image.favorited ? accent.color : undefined,
                      backgroundColor: image.favorited
                        ? accent.softColor
                        : undefined,
                    }}
                    title={image.favorited ? "Unfavorite" : "Add to Favorites"}
                  >
                    <Heart
                      size={18}
                      fill={image.favorited ? accent.color : "none"}
                      strokeWidth={image.favorited ? 0 : 2}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="app-panel-muted flex h-12 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-(--text-muted) shadow-sm backdrop-blur-md transition-all hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-500/50 dark:hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete Wallpaper"
        message={`Are you sure you want to permanently delete '${image.file_name}'?`}
      />
    </>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-panel-muted flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold text-(--text-muted) shadow-sm transition-all hover:bg-(--surface-active) hover:text-(--app-fg)"
    >
      {children}
    </button>
  );
}

function DetailPill({ label }: { label: string }) {
  return (
    <span className="app-panel-muted truncate rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide text-(--text-muted) shadow-sm">
      {label}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-panel-muted flex items-center justify-between rounded-2xl border px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-(--text-faint)">
        {label}
      </p>
      <p className="truncate text-sm font-semibold capitalize text-(--app-fg)">
        {value}
      </p>
    </div>
  );
}

function PaletteGroup({ colors }: { colors: ImageData["display_palette"] }) {
  return (
    <div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {colors.map((color, index) => {
          const swatchColor =
            formatHex({
              mode: "oklch",
              l: color.l,
              c: color.chroma,
              h: color.hue,
            }) || "#000";
          return (
            <div
              key={`${index}`}
              className="group flex flex-col items-center gap-1.5"
            >
              <div
                className="aspect-square w-16 rounded-full border border-(--border-strong) shadow-sm transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: swatchColor,
                }}
              />
              <span className="truncate text-[9px] font-mono text-(--text-faint) transition-colors group-hover:text-(--text-muted)">
                {swatchColor}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getAccentColor(image: ImageData) {
  const firstColor = image.display_palette[0];

  const hex = firstColor
    ? formatHex({
        mode: "oklch",
        l: firstColor.l,
        c: firstColor.chroma,
        h: firstColor.hue,
      }) || "#888888"
    : "#888888";
  return {
    color: hex,
    softColor: `${hex}33`,
  };
}
