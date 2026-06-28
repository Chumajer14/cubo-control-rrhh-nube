const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("cuboTerminal", {
  platform: process.platform,
  appMode: "desktop"
});
