import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useFolder } from "../context/FolderContext";
import { useImageOrganization } from "../hooks/useImageOrganization";
import WelcomeScreen from "../components/WelcomeScreen";
import ImageGrid from "../components/image/ImageGrid";
import ImageView from "../components/image/ImageView";
import { useLayout } from "../components/layout/MainLayout";
import FilterBar from "../components/ui/FilterBar";
import BootState from "../components/scan/BootState";
import ScanningState from "../components/scan/ScanningState";
import FolderStatusView from "../components/scan/FolderStatusView";
import { isDemo } from "../lib/platform";
import { cancel_scan } from "../lib/tauri";

export default function HomePage() {
  const {
    activeTab,
    images,
    scanProgress,
    status,
    error,
    openFolder,
    recursive,
    setRecursive,
    removeImage,
    toggleFavorite,
    hasOpenFolders,
    isSessionLoading,
    rescanActiveFolder,
  } = useFolder();
  const {
    selectedColor,
    setSelectedColor,
    similarity,
    isWelcomeOpen,
    dismissWelcome,
  } = useLayout();
  const { organizedImages, selectedCategory, filterBarProps } =
    useImageOrganization(images, selectedColor, similarity, setSelectedColor);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) ?? null,
    [activeImageId, images],
  );

  useEffect(() => {
    if (!activeImageId) {
      return;
    }

    const stillExists = images.some((image) => image.id === activeImageId);
    if (!stillExists) {
      setActiveImageId(null);
    }
  }, [activeImageId, images]);

  useEffect(() => {
    if (!isWelcomeOpen && hasOpenFolders) {
      return;
    }

    setActiveImageId(null);
  }, [hasOpenFolders, isWelcomeOpen]);

  const handleWelcomeFolderPick = async () => {
    const opened = await openFolder();
    if (opened) {
      dismissWelcome();
    }
  };

  let content: ReactNode;

  if (isSessionLoading) {
    content = <BootState />;
  } else if (!hasOpenFolders || isWelcomeOpen) {
    content = (
      <WelcomeScreen
        onFolderPicked={handleWelcomeFolderPick}
        recursive={recursive}
        onToggleRecursive={setRecursive}
      />
    );
  } else if (status === "loading") {
    content = (
      <ScanningState
        progress={scanProgress}
        folderPath={activeTab?.path ?? null}
        onCancel={cancel_scan}
      />
    );
  } else if (error || images.length === 0) {
    content = (
      <FolderStatusView
        title={error ? "Something went wrong..." : "No images found!"}
        message={
          error ??
          "This folder doesn't contain any supported JPG, PNG, or WebP files...yet."
        }
        onRescan={rescanActiveFolder}
        disableRescan={isDemo}
      />
    );
  } else {
    content = (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <FilterBar {...filterBarProps} />

        <ImageGrid
          images={organizedImages}
          status={status}
          activeImageId={activeImageId}
          onSelectImage={setActiveImageId}
          onDelete={removeImage}
          onFavorite={toggleFavorite}
          emptyMessage={
            selectedCategory
              ? `No images match the selected ${selectedCategory} tag. Try adjusting the filter or reset to show all images.`
              : "Try adjusting the filter or reset to show all images."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 transition-colors duration-500">
      {content}

      {activeImage && (
        <ImageView
          image={activeImage}
          onClose={() => setActiveImageId(null)}
          onDelete={removeImage}
          onFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}
