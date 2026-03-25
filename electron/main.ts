// electron/main.ts
// Main process for Winners Ecosystem Desktop App
// Wraps the Vite-based web app as a desktop application

import { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage, Notification } from "electron";
import * as path from "path";

// Check if in development (not packaged)
const isDev = !app.isPackaged;

// Development or production URL
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: "#0D1520",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Create application menu
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        { label: "Preferences...", accelerator: "CmdOrCtrl,", click: () => mainWindow?.webContents.send("open-settings") },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { role: "close" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Winners Ecosystem",
          click: () => {
            mainWindow?.webContents.send("navigate", "/about");
          },
        },
        { type: "separator" },
        {
          label: "Documentation",
          click: () => shell.openExternal("https://winnersempire.io/docs"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function createTray(): void {
  // Create a simple 16x16 tray icon
  const iconPath = isDev 
    ? path.join(__dirname, "../public/icon.png")
    : path.join(process.resourcesPath, "icon.png");
  
  // Create a default icon if not found
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Winners", click: () => mainWindow?.show() },
    { type: "separator" },
    { label: "AI Assistant", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/intelligence"); }},
    { label: "Community", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/community"); }},
    { label: "Academy", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/academy"); }},
    { label: "Market", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/market"); }},
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setToolTip("Winners Ecosystem");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow?.show();
  });
}

// IPC Handlers
ipcMain.handle("get-api-url", () => API_BASE_URL);
ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("open-external", (_, url: string) => {
  shell.openExternal(url);
});

ipcMain.handle("show-notification", (_, { title, body }: { title: string; body: string }) => {
  new Notification({ title, body }).show();
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
