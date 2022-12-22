import WindowManager from "./WindowsManager";
import GameWindowsManager from "./GameWindowsManager";
import {app, BrowserWindow, dialog, ipcMain, IpcMainEvent} from "electron";
import * as path from "path";
import * as Store from "electron-store";

export default class GameMultiWindowManager {
    private multiWindow: BrowserWindow;

    private windowManager: WindowManager;

    private gameWindowsManager: GameWindowsManager;

    private baseWindow: { width: number, height: number } = {
        width: 1280,
        height: 720
    };

    gameIdWindowList: number[] = [];

    multiWindowSettingKey = "multiWindowSetting";

    multiWindowSettingStore = new Store({
        cwd: this.multiWindowSettingKey
    })

    constructor(windowManager: WindowManager, gameWindowsManager: GameWindowsManager) {
        this.windowManager = windowManager;
        this.gameWindowsManager = gameWindowsManager;
        this.startEvents();
    }

    private startEvents() {
        ipcMain.on("on-get-game-id-list", this.onGetGameIdList.bind(this));
        ipcMain.on("on-get-window-setting", this.onGetWindowSetting.bind(this));
        ipcMain.handle("on-save-window-setting", this.onSaveWindowSetting.bind(this));
        ipcMain.handle("on-multi-open-game", this.onMultiGameOpen.bind(this));
        ipcMain.handle("on-multi-close-game", this.onMultiGameClose.bind(this));
    }

    createMainWindow() {
        if (this.multiWindow) {
            return;
        }

        let stateKeeper = this.windowManager.windowStateKeeper("mutli", this.baseWindow);

        const multiWindow = new BrowserWindow({
            height: stateKeeper.height,
            width: stateKeeper.width,
            minWidth: this.baseWindow.width,
            minHeight: this.baseWindow.height,
            x: stateKeeper.x,
            y: stateKeeper.y,
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: true,
                nodeIntegration: true,
                webviewTag: true,
                partition: `persist:game-multi-windows`,
                preload: path.join(__dirname, "../preload/multiWindowPreload.js"),
            }
        });

        this.multiWindow = multiWindow;

        multiWindow.setIcon(path.join(__dirname, '../../icon/icon.png'));
        multiWindow.loadFile(path.join(__dirname, '../../public/webview-multi.html'))
            .then(() => stateKeeper.track(multiWindow));

        multiWindow.on('ready-to-show', async () => {
            this.windowManager.initWindow(multiWindow, stateKeeper);
            multiWindow.webContents.setFrameRate(60);
            this.windowManager.refreshGameProfileListOnMainWindow();
        });

        multiWindow.on("close", (event) => {
            event.preventDefault();
            const dialogOpts = {
                type: "warning",
                buttons: ["是", "否"],
                title: multiWindow.getTitle(),
                message: "是否要關閉?",
            };
            dialog.showMessageBox(dialogOpts)
                .then((returnValue) => {
                    if (returnValue.response === 0) {
                        this.multiWindow = null;
                        this.gameIdWindowList = [];
                        this.windowManager.refreshGameProfileListOnMainWindow();
                        multiWindow.destroy();
                    }
                });
        });
    }

    private onGetGameIdList(event: IpcMainEvent) {
        event.returnValue = this.gameIdWindowList;
    }

    private onGetWindowSetting(event: IpcMainEvent) {
        event.returnValue = this.getWindowSetting();
    }

    private getWindowSetting() {
        return this.multiWindowSettingStore.get(this.multiWindowSettingKey) || {
            "2": "1",
            more: "4"
        };
    }

    private onSaveWindowSetting(event: IpcMainEvent, obj: any) {
        this.multiWindowSettingStore.set(this.multiWindowSettingKey, obj);
        if (this.multiWindow) {
            this.multiWindow.webContents.send("refresh-webview", this.gameIdWindowList, this.getWindowSetting());
        }
    }

    private onMultiGameOpen(event: IpcMainEvent, profileId: number) {
        this.gameIdWindowList.push(profileId);
        if (!this.multiWindow) {
            this.createMainWindow();
        } else {
            this.multiWindow.webContents.send("refresh-webview", this.gameIdWindowList, this.getWindowSetting())
        }
    }

    private onMultiGameClose(event: IpcMainEvent, profileId: number) {
        this.closeWebview(profileId);
    }

    closeWebview(profileId: number) {
        try {
            let index = this.gameIdWindowList.indexOf(profileId);
            if (index > -1) {
                this.gameIdWindowList.splice(index, 1);
                if (this.multiWindow) {
                    this.multiWindow.webContents.send("remove-webview", profileId);
                }
                this.windowManager.refreshGameProfileListOnMainWindow();
            }
        } catch (e) {

        }
    }
}
