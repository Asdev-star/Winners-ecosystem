"use strict";
// electron/preload.ts
// Preload script - exposes safe APIs to the renderer process
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // App info
    getApiUrl: () => electron_1.ipcRenderer.invoke("get-api-url"),
    getAppVersion: () => electron_1.ipcRenderer.invoke("get-app-version"),
    // External links
    openExternal: (url) => electron_1.ipcRenderer.invoke("open-external", url),
    // Notifications
    showNotification: (title, body) => electron_1.ipcRenderer.invoke("show-notification", { title, body }),
    // Event listeners from main process
    onNavigate: (callback) => {
        electron_1.ipcRenderer.on("navigate", (_, path) => callback(path));
    },
    onNewChat: (callback) => {
        electron_1.ipcRenderer.on("new-chat", () => callback());
    },
    onOpenSettings: (callback) => {
        electron_1.ipcRenderer.on("open-settings", () => callback());
    },
    onExportData: (callback) => {
        electron_1.ipcRenderer.on("export-data", () => callback());
    },
    // Platform info
    platform: process.platform,
});
