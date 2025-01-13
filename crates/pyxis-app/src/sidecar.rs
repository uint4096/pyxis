use tauri::{App, Emitter, WebviewWindow};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

pub fn start_sync_worker(app: &App, window: WebviewWindow) {
    match app.shell().sidecar("pyxis-sync") {
        Ok(sidecar_command) => {
            match sidecar_command.spawn() {
                Ok((mut rx, _child)) => {
                    tauri::async_runtime::spawn(async move {
                        // read events such as stdout
                        while let Some(event) = rx.recv().await {
                            if let CommandEvent::Stdout(line_bytes) = event {
                                let line = String::from_utf8_lossy(&line_bytes);
                                window
                                    .emit("Sidecar_Message", Some(format!("'{}'", line)))
                                    .expect("[Sidecar] failed to emit event");
                            }
                        }
                    });
                }
                Err(e) => {
                    eprintln!("[Sidecar] Failed to spawn sidecar. Error: {}", e);
                }
            }
        }
        Err(e) => {
            eprintln!("[Sidecar] Failed to spawn sidecar. Error: {}", e);
        }
    }
}
