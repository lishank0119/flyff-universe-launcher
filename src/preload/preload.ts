import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld("ipc", ipcRenderer);

