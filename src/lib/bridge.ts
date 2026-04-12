import { isDemo } from "./platform";

type UnlistenFn = () => void;

let convertFileSrcImpl: ((path: string) => string) | null = null;

export async function initBridge(): Promise<void> {
  if (isDemo || convertFileSrcImpl) {
    return;
  }

  const core = await import("@tauri-apps/api/core");
  convertFileSrcImpl = core.convertFileSrc;
}

export function convertFileSrc(path: string): string {
  if (isDemo) {
    return path;
  }

  if (!convertFileSrcImpl) {
    throw new Error("Bridge not initialized. Call initBridge() before render.");
  }

  return convertFileSrcImpl(path);
}

export async function invoke<T>(cmd: string, args?: unknown): Promise<T> {
  if (isDemo) {
    throw new Error(`invoke(${cmd}) is not available in demo mode.`);
  }

  const core = await import("@tauri-apps/api/core");
  return core.invoke<T>(cmd, args as Record<string, unknown>);
}

export async function listen<T>(
  event: string,
  handler: (event: { payload: T }) => void,
): Promise<UnlistenFn> {
  if (isDemo) {
    return () => {};
  }

  const events = await import("@tauri-apps/api/event");
  return events.listen<T>(event, handler);
}

export async function openDirectoryDialog(): Promise<string | null> {
  if (isDemo) {
    return null;
  }

  const dialog = await import("@tauri-apps/plugin-dialog");
  const selected = await dialog.open({ directory: true, multiple: false });

  return typeof selected === "string" ? selected : null;
}
