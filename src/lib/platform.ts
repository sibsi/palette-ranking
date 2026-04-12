export const isDemo = import.meta.env.VITE_DEMO === "true";

export const isTauri = !isDemo && typeof window !== "undefined" && "__TAURI__" in window;