import { useCallback, useMemo, useState } from "react";
import type { ImageData, ImageTagCategory, ImageTagValue } from "@/types";
import { useSorting } from "./useSorting";
import { compareImages, getTagSortValue, getTagValue } from "../lib/imageTags";
import {
  TAG_VALUES,
  type FilterBarProps,
  type ImageOrganizationMode,
} from "../components/ui/FilterBar";

export function useImageOrganization(
  images: ImageData[],
  selectedColor: string | null,
  similarity: number,
  setSelectedColor: (color: string | null) => void,
) {
  const [organizationMode, setOrganizationMode] =
    useState<ImageOrganizationMode>("filter");
  const [selectedCategory, setSelectedCategory] =
    useState<ImageTagCategory | null>(null);
  const [selectedTagValue, setSelectedTagValue] =
    useState<ImageTagValue | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const sortedImages = useSorting(images, selectedColor, similarity);

  const visibleImages = useMemo(() => {
    let nextImages = sortedImages;

    if (favoritesOnly) {
      nextImages = nextImages.filter((image) => image.favorited);
    }

    if (
      organizationMode !== "filter" ||
      !selectedCategory ||
      !selectedTagValue
    ) {
      return nextImages;
    }

    return nextImages.filter(
      (image) => getTagValue(image, selectedCategory) === selectedTagValue,
    );
  }, [
    favoritesOnly,
    organizationMode,
    selectedCategory,
    selectedTagValue,
    sortedImages,
  ]);

  const organizedImages = useMemo(() => {
    if (organizationMode !== "sort" || !selectedCategory) {
      return visibleImages;
    }

    const prioritizedValues = TAG_VALUES[selectedCategory];
    const rankByValue = new Map(
      prioritizedValues.map((value, index) => [value, index]),
    );

    return [...visibleImages].sort((leftImage, rightImage) => {
      const leftTagValue = getTagValue(leftImage, selectedCategory);
      const rightTagValue = getTagValue(rightImage, selectedCategory);
      const leftRank = rankByValue.get(leftTagValue) ?? 0;
      const rightRank = rankByValue.get(rightTagValue) ?? 0;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      const tagValueDelta =
        getTagSortValue(leftImage, selectedCategory) -
        getTagSortValue(rightImage, selectedCategory);

      if (tagValueDelta !== 0) {
        return tagValueDelta;
      }

      return compareImages(leftImage, rightImage);
    });
  }, [organizationMode, selectedCategory, visibleImages]);

  const handleModeChange = useCallback((mode: ImageOrganizationMode) => {
    setOrganizationMode(mode);

    if (mode === "sort") {
      setSelectedCategory((currentCategory) => currentCategory ?? "brightness");
    }
  }, []);

  const handleCategoryChange = useCallback(
    (category: ImageTagCategory | null) => {
      setSelectedCategory(category);
      setSelectedTagValue(null);
    },
    [],
  );

  const handleFavoritesToggle = useCallback(() => {
    setFavoritesOnly((current) => !current);
  }, []);

  const handleShowAllImages = useCallback(() => {
    setFavoritesOnly(false);
    setSelectedTagValue(null);
    setSelectedCategory(null);
    setSelectedColor(null);
  }, [setSelectedColor]);

  const filterBarProps = useMemo<FilterBarProps>(
    () => ({
      mode: organizationMode,
      selectedCategory,
      selectedValue: selectedTagValue,
      favoritesOnly,
      visibleCount: organizedImages.length,
      totalCount: images.length,
      onModeChange: handleModeChange,
      onCategoryChange: handleCategoryChange,
      onValueChange: setSelectedTagValue,
      onFavoritesToggle: handleFavoritesToggle,
      onShowAll: handleShowAllImages,
    }),
    [
      favoritesOnly,
      handleCategoryChange,
      handleFavoritesToggle,
      handleModeChange,
      handleShowAllImages,
      images.length,
      organizationMode,
      organizedImages.length,
      selectedCategory,
      selectedTagValue,
    ],
  );

  return {
    organizedImages,
    selectedCategory,
    filterBarProps,
  };
}
