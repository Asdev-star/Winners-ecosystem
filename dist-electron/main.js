"use strict";
// electron/main.ts
// Main process for Winners Ecosystem Desktop App
// Wraps the Vite-based web app as a desktop application
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
// Check if in development (not packaged)
const isDev = !electron_1.app.isPackaged;
// Development or production URL
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
let mainWindow = null;
let tray = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    const menuTemplate = [
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
                    click: () => electron_1.shell.openExternal("https://winnersempire.io/docs"),
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(menuTemplate);
    electron_1.Menu.setApplicationMenu(menu);
    mainWindow.on("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.webContents.setWindowOpenHandler((details) => {
        electron_1.shell.openExternal(details.url);
        return { action: "deny" };
    });
    if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}
function createTray() {
    // Create a simple 16x16 tray icon
    const iconPath = isDev
        ? path.join(__dirname, "../public/icon.png")
        : path.join(process.resourcesPath, "icon.png");
    // Create a default icon if not found
    let icon;
    try {
        icon = electron_1.nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
            icon = electron_1.nativeImage.createEmpty();
        }
    }
    catch {
        icon = electron_1.nativeImage.createEmpty();
    }
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        { label: "Show Winners", click: () => mainWindow?.show() },
        { type: "separator" },
        { label: "AI Assistant", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/intelligence"); } },
        { label: "Community", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/community"); } },
        { label: "Academy", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/academy"); } },
        { label: "Market", click: () => { mainWindow?.show(); mainWindow?.webContents.send("navigate", "/market"); } },
        { type: "separator" },
        { label: "Quit", click: () => electron_1.app.quit() },
    ]);
    tray.setToolTip("Winners Ecosystem");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
        mainWindow?.show();
    });
}
// IPC Handlers
electron_1.ipcMain.handle("get-api-url", () => API_BASE_URL);
electron_1.ipcMain.handle("get-app-version", () => electron_1.app.getVersion());
electron_1.ipcMain.handle("open-external", (_, url) => {
    electron_1.shell.openExternal(url);
});
electron_1.ipcMain.handle("show-notification", (_, { title, body }) => {
    new electron_1.Notification({ title, body }).show();
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
