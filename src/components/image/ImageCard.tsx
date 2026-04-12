import { memo } from "react";
import { formatHex } from "culori";
import { Heart, Trash2, Wallpaper } from "lucide-react";
import { convertFileSrc } from "../../lib/bridge";
import { isDemo } from "../../lib/platform";
import { set_wallpaper } from "../../lib/tauri";
import type { ImageData } from "@/types";

interface ImageCardProps {
  image: ImageData;
  isActive?: boolean;
  onClick: () => void;
  onDelete: () => void;
  onFavorite: (id: string) => void;
}

function ImageCard({
  image,
  isActive = false,
  onClick,
  onDelete,
  onFavorite,
}: ImageCardProps) {
  const imageSrc = convertFileSrc(image.thumbnail_path ?? image.file_path);

  const mainColor = image.display_palette[0];
  const accentColor = mainColor
    ? formatHex({
        mode: "oklch",
        l: mainColor.l,
        c: mainColor.chroma,
        h: mainColor.hue,
      }) || "transparent"
    : "transparent";

  const shadowBase = mainColor
    ? formatHex({
        mode: "oklch",
        l: Math.min(mainColor.l + 0.08, 0.95),
        c: mainColor.chroma,
        h: mainColor.hue,
      })
    : undefined;

  const activeShadow = shadowBase
    ? `0 0 0 1px rgba(255,255,255,0.08), 0 12px 34px -20px ${shadowBase}99`
    : undefined;

  function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (isDemo) return;
    onDelete();
  }

  function handleSetWallpaper(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (isDemo) return;
    void set_wallpaper(image.file_path).catch(console.error);
  }

  function handleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onFavorite(image.id);
  }

  return (
    <div
      className={`group relative h-full w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-slate-900 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.38)] transition-transform duration-150 active:scale-[0.985] dark:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.56)] ${
        isActive ? "z-10 ring-2 ring-rose-500" : ""
      }`}
      style={{ boxShadow: isActive ? activeShadow : undefined }}
      onClick={onClick}
    >
      <img
        src={imageSrc}
        alt={image.file_name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />

      <div
        className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(to top, var(--image-overlay-from), var(--image-overlay-via), var(--image-overlay-to))",
        }}
      >
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {image.display_palette.slice(0, 6).map((color, index) => {
              const hex = formatHex({
                mode: "oklch",
                l: color.l,
                c: color.chroma,
                h: color.hue,
              });
              return (
                <span
                  key={index}
                  className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                  style={{ backgroundColor: hex || "transparent" }}
                />
              );
            })}
          </div>

          <div className="whitespace-nowrap rounded-md bg-black/42 px-2 py-1 font-mono text-[10px] text-white">
            {image.width}x{image.height}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <OverlayButton
              onClick={handleDelete}
              disabled={isDemo}
              title="Delete"
              className="hover:border-rose-300/55 hover:bg-white/22 hover:text-rose-200"
            >
              <Trash2 size={18} />
            </OverlayButton>

            <OverlayButton
              onClick={handleSetWallpaper}
              disabled={isDemo}
              title="Set Wallpaper"
              className="hover:border-sky-300/55 hover:bg-white/22 hover:text-sky-100"
            >
              <Wallpaper size={18} />
            </OverlayButton>
          </div>

          <OverlayButton
            onClick={handleFavorite}
            title={image.favorited ? "Unfavorite" : "Favorite"}
            className="hover:bg-white/22"
            style={{ color: image.favorited ? accentColor : "white" }}
          >
            <Heart
              size={18}
              fill={image.favorited ? accentColor : "none"}
              strokeWidth={image.favorited ? 0 : 2}
              className="transition-colors duration-150"
            />
          </OverlayButton>
        </div>
      </div>
    </div>
  );
}

function OverlayButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/18 text-white shadow-sm backdrop-blur-md transition-all duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default memo(ImageCard, (prevProps, nextProps) => {
  return (
    prevProps.image === nextProps.image &&
    prevProps.isActive === nextProps.isActive
  );
});
