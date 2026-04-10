import { useMemo, useState, useEffect } from "react";
import { converter } from "culori";
import type { ImageData } from "@/types";

const toOklab = converter("oklab");

// helper to map a 0-1 slider value to a specific math range
function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function useSorting(
  images: ImageData[],
  selectedColor: string | null,
  rawSimilarity: number = 0.5,
) {
  const [color, setColor] = useState(selectedColor);

  useEffect(() => {
    const timer = setTimeout(() => setColor(selectedColor), 50);
    return () => clearTimeout(timer);
  }, [selectedColor]);

  return useMemo(() => {
    if (!color || images.length === 0) return images;

    const targetLab = toOklab(color);
    if (!targetLab) return images;

    // Similarity: 0 is strict match, 1 is a loose match
    const distanceThreshold = lerp(0.09, 0.25, rawSimilarity);

    const scoredImages = images.reduce<{ img: ImageData; score: number }[]>(
      (acc, img) => {
        let bestMatchScore = 0;

        for (const color of img.palette) {
          // distance: l and c differences combined
          const dL = Math.abs(color.l - targetLab.l);
          const da = color.a - (targetLab.a || 0);
          const db = color.b - (targetLab.b || 0);
          const chromaDist = Math.sqrt(da * da + db * db);

          const distance = dL + chromaDist;

          // If outside tolerance, reject it
          if (distance > distanceThreshold) {
            continue;
          }

          // scoring: closer distance and more prominent colors score higher
          const distanceScore = 1.0 - distance / distanceThreshold;
          const prominenceScore =
            0.25 + 0.75 * Math.sqrt(Math.max(color.weighted_proportion, 0));
          const totalScore = distanceScore * prominenceScore;

          if (totalScore > bestMatchScore) {
            bestMatchScore = totalScore;
          }
        }

        if (bestMatchScore > 0) {
          acc.push({ img, score: bestMatchScore });
        }

        return acc;
      },
      [],
    );

    return scoredImages
      .sort((a, b) => b.score - a.score)
      .map((item) => item.img);
  }, [images, color, rawSimilarity]);
}
