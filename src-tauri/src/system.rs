use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    SystemParametersInfoW, SPIF_SENDCHANGE, SPIF_UPDATEINIFILE, SPI_SETDESKWALLPAPER,
};

#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    let target = Path::new(&path);

    if !target.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", path))
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to reveal file in Finder: {}", e))?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let parent = target
            .parent()
            .ok_or_else(|| format!("No parent directory found for {}", path))?;

        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
        return Ok(());
    }

    #[allow(unreachable_code)]
    Err("Show in folder is not supported on this platform.".to_string())
}

#[tauri::command]
pub fn set_wallpaper(path: String) -> Result<(), String> {
    let target = Path::new(&path);

    if !target.exists() || !target.is_file() {
        return Err(format!("Invalid file path: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        let wide_path: Vec<u16> = target
            .as_os_str()
            .to_string_lossy()
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();

        let result = unsafe {
            SystemParametersInfoW(
                SPI_SETDESKWALLPAPER,
                0,
                Some(wide_path.as_ptr() as *mut _),
                SPIF_UPDATEINIFILE | SPIF_SENDCHANGE,
            )
        };

        return result.map_err(|e| format!("Failed to set wallpaper: {}", e));
    }

    #[allow(unreachable_code)]
    Err("Set wallpaper is not supported on this platform yet.".to_string())
}
