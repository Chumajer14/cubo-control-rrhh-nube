const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);

function createMainWindow() {
  const kioskEnabled = process.env.CUBO_KIOSK === "true";

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 960,
    minHeight: 720,
    fullscreenable: true,
    kiosk: kioskEnabled,
    title: "CUBO Control Terminal",
    backgroundColor: "#080b0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);

  if (isDevelopment) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
