import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";

contextBridge.exposeInMainWorld("api", {
    on(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
        ipcRenderer.on(channel, listener)
    },
    ipc: ipcRenderer
})

