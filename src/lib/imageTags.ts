import type {
  ImageData,
  ImageTagCategory,
  ImageTags,
  TemperatureTag,
} from "@/types";

const BRIGHTNESS_DARK_THRESHOLD = 0.35;
const BRIGHTNESS_BRIGHT_THRESHOLD = 0.65;
const SATURATION_MUTED_THRESHOLD = 0.08;
const TEMPERATURE_NEUTRAL_CHROMATIC_THRESHOLD = 0.05;
const TEMPERATURE_NEUTRAL_BALANCE_THRESHOLD = 0.12;

function getTemperatureBalance(image: ImageData) {
  const totalWeight = image.warm_weight + image.cool_weight;

  if (totalWeight <= 0) {
    return 0;
  }

  return Math.abs(image.warm_weight - image.cool_weight) / totalWeight;
}

function getTemperatureDirection(image: ImageData) {
  return image.warm_weight - image.cool_weight;
}

export function getBrightnessTag(image: ImageData): ImageTags["brightness"] {
  if (image.avg_l < BRIGHTNESS_DARK_THRESHOLD) {
    return "dark";
  }

  if (image.avg_l > BRIGHTNESS_BRIGHT_THRESHOLD) {
    return "bright";
  }

  return "neutral";
}

export function getSaturationTag(image: ImageData): ImageTags["saturation"] {
  return image.avg_c < SATURATION_MUTED_THRESHOLD ? "muted" : "vivid";
}

export function getTemperatureTag(image: ImageData): TemperatureTag {
  const chromaticFraction = image.chromatic_fraction;
  const balance = getTemperatureBalance(image);

  if (
    chromaticFraction < TEMPERATURE_NEUTRAL_CHROMATIC_THRESHOLD ||
    balance < TEMPERATURE_NEUTRAL_BALANCE_THRESHOLD
  ) {
    return "neutral";
  }

  return getTemperatureDirection(image) > 0 ? "warm" : "cool";
}

export function getImageTags(image: ImageData): ImageTags {
  return {
    brightness: getBrightnessTag(image),
    temperature: getTemperatureTag(image),
    saturation: getSaturationTag(image),
  };
}

export function getTagValue(
  image: ImageData,
  category: ImageTagCategory,
): ImageTags[ImageTagCategory] {
  const tags = getImageTags(image);
  return tags[category];
}

export function getTagSortValue(image: ImageData, category: ImageTagCategory) {
  if (category === "brightness") {
    return image.avg_l;
  }

  if (category === "saturation") {
    return image.avg_c;
  }

  // rest is for temperature sorting
  const balance = getTemperatureBalance(image);
  const temperatureTag = getTemperatureTag(image);

  if (temperatureTag === "neutral") {
    return 0;
  }

  const direction = Math.sign(getTemperatureDirection(image)) || 1;
  return balance * direction;
}

export function compareImages(leftImage: ImageData, rightImage: ImageData) {
  const byRelativePath = leftImage.file_path.localeCompare(
    rightImage.file_path,
    undefined,
    { sensitivity: "base", numeric: true },
  );

  if (byRelativePath !== 0) {
    return byRelativePath;
  }

  return leftImage.file_path.localeCompare(rightImage.file_path, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}
