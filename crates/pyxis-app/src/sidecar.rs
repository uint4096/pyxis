use tauri::{App, Emitter, WebviewWindow};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

pub fn start_sync_worker(app: &App, window: WebviewWindow) {
    let sidecar_command = app.shell().sidecar("pyxis-sync").unwrap();
    let (mut rx, _child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line_bytes) = event {
                let line = String::from_utf8_lossy(&line_bytes);
                window
                    .emit("[Sidecar] Message", Some(format!("'{}'", line)))
                    .expect("[Sidecar] failed to emit event");
            }
        }
    });
}
