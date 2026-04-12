import { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_IMAGE_SHAPE,
  GRID_SIZES,
  IMAGE_SHAPES,
} from "@/constants/layout";
import { GridSize, ImageShape, Theme } from "@/types";
import { useFolder } from "../../context/FolderContext";
import { useStoredState } from "../../hooks/useStoredState";
import { isDemo } from "../../lib/platform";
import Topbar from "./TopBar";
import Sidebar from "./Sidebar";

const IMAGE_SHAPE_STORAGE_KEY = "layout:image-shape";
const GRID_SIZE_STORAGE_KEY = "layout:grid-size";
const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "dark";

function isImageShape(value: string | null): value is ImageShape {
  return value !== null && IMAGE_SHAPES.includes(value as ImageShape);
}

function isGridSize(value: string | null): value is GridSize {
  return value !== null && GRID_SIZES.includes(value as GridSize);
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface LayoutContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  imageShape: ImageShape;
  setImageShape: (shape: ImageShape) => void;
  gridSize: GridSize;
  setGridSize: (size: GridSize) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  similarity: number;
  setSimilarity: (value: number) => void;
  isWelcomeOpen: boolean;
  openWelcome: () => void;
  dismissWelcome: () => void;
}

export const LayoutContext = createContext<LayoutContextType>(
  {} as LayoutContextType,
);

export function useLayout() {
  return useContext(LayoutContext);
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { hasOpenFolders, isSessionLoading } = useFolder();

  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [imageShape, setImageShape] = useStoredState<ImageShape>({
    key: IMAGE_SHAPE_STORAGE_KEY,
    defaultValue: DEFAULT_IMAGE_SHAPE,
    validate: (value) => (isImageShape(value) ? value : null),
  });
  const [gridSize, setGridSize] = useStoredState<GridSize>({
    key: GRID_SIZE_STORAGE_KEY,
    defaultValue: DEFAULT_GRID_SIZE,
    validate: (value) => (isGridSize(value) ? value : null),
  });

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState(0.5);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  const isWelcomeVisible =
    !isSessionLoading && (!hasOpenFolders || (!isDemo && isWelcomeOpen));

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () =>
        setTheme((curr) => (curr === "dark" ? "light" : "dark")),
      imageShape,
      setImageShape,
      gridSize,
      setGridSize,
      selectedColor,
      setSelectedColor,
      similarity,
      setSimilarity,
      isWelcomeOpen,
      openWelcome: () => {
        if (isDemo) return;
        setIsWelcomeOpen(true);
      },
      dismissWelcome: () => setIsWelcomeOpen(false),
    }),
    [
      theme,
      imageShape,
      gridSize,
      selectedColor,
      similarity,
      isWelcomeOpen,
    ],
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="relative isolate flex h-dvh w-full flex-col overflow-hidden bg-(--app-bg) text-(--app-fg) transition-colors duration-500">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, var(--app-top-glow), transparent)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[40vh]"
            style={{
              background:
                "linear-gradient(to top, var(--app-bottom-glow), transparent)",
            }}
          />
        </div>

        <div className="relative z-50 flex-none border-b border-(--border-soft) bg-(--surface-chrome) backdrop-blur-xl">
          <Topbar showLogo={!isWelcomeVisible} />
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-none flex-col justify-center px-3 py-6">
            <Sidebar
              selected={selectedColor}
              onSelect={setSelectedColor}
              similarity={similarity}
              onSimilarityChange={setSimilarity}
            />
          </div>

          <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
            {children}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
