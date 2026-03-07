// electron/preload.ts
// Preload script - exposes safe APIs to the renderer process

import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getApiUrl: () => ipcRenderer.invoke("get-api-url"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  
  // Notifications
  showNotification: (title: string, body: string) => 
    ipcRenderer.invoke("show-notification", { title, body }),
  
  // Event listeners from main process
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on("navigate", (_, path) => callback(path));
  },
  onNewChat: (callback: () => void) => {
    ipcRenderer.on("new-chat", () => callback());
  },
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on("open-settings", () => callback());
  },
  onExportData: (callback: () => void) => {
    ipcRenderer.on("export-data", () => callback());
  },
  
  // Platform info
  platform: process.platform,
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getApiUrl: () => Promise<string>;
      getAppVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      showNotification: (title: string, body: string) => Promise<void>;
      onNavigate: (callback: (path: string) => void) => void;
      onNewChat: (callback: () => void) => void;
      onOpenSettings: (callback: () => void) => void;
      onExportData: (callback: () => void) => void;
      platform: NodeJS.Platform;
    };
  }
}
