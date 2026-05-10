const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  onTelemetry: (callback) => ipcRenderer.on("telemetry", (_e, data) => callback(data)),
  rendererReady: () => ipcRenderer.send("renderer-ready")
});