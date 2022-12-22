import {app, BrowserWindow, dialog, ipcMain, IpcMainEvent} from "electron";
import * as path from "path";
import GameWindowsManager, {GameProfileType} from "./GameWindowsManager";
import WindowManager from "./WindowsManager";

export default class GameSingleWindowManager {
    private windowManager: WindowManager;

    private gameWindowsManager: GameWindowsManager;

    private baseWindow: { width: number, height: number } = {
        width: 1280,
        height: 720
    };

    gameWindowMap: Map<number, BrowserWindow> = new Map<number, BrowserWindow>();

    constructor(windowManager: WindowManager, gameWindowsManager: GameWindowsManager) {
        this.windowManager = windowManager;
        this.gameWindowsManager = gameWindowsManager;
        this.startEvents();
    }

    private startEvents() {
        ipcMain.handle("on-single-change-fullscreen", this.onChangeFullScreen.bind(this));
        ipcMain.handle("on-single-change-resolution", this.onChangeResolution.bind(this));
        ipcMain.handle("on-single-close-game", this.onCloseSingleGame.bind(this));
        ipcMain.handle("on-single-open-game", this.onSingleOpenGame.bind(this));
    }

    createGameWindow(gameProfile: GameProfileType) {
        let stateKeeper = this.windowManager.windowStateKeeper(`Game-${gameProfile.id}`, this.baseWindow);

        let title = `Flyff universe | ${gameProfile.name}`;
        const gameWindow = new BrowserWindow({
            title: title,
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
                webSecurity: false,
                partition: `persist:game-${gameProfile.id}`
            }
        });

        this.gameWindowMap.set(gameProfile.id, gameWindow);

        gameWindow.setIcon(path.join(__dirname, '../../icon/icon.png'));
        gameWindow.loadURL("https://universe.flyff.com/play")
            .then(() => stateKeeper.track(gameWindow));

        gameWindow.on('ready-to-show', async () => {
            this.windowManager.initWindow(gameWindow, stateKeeper);
            gameWindow.webContents.setFrameRate(60);
            this.windowManager.refreshGameProfileListOnMainWindow();
        });

        gameWindow.on("close", (event) => {
            event.preventDefault();
            const dialogOpts = {
                type: "warning",
                buttons: ["是", "否"],
                title: title,
                message: "是否要關閉?",
            };
            dialog.showMessageBox(dialogOpts)
                .then((returnValue) => {
                    if (returnValue.response === 0) {
                        this.gameWindowMap.delete(gameProfile.id);
                        this.windowManager.refreshGameProfileListOnMainWindow();
                        gameWindow.destroy();
                    }
                });
        });

        gameWindow.webContents.on('did-finish-load', () => {
            this.changeWindowTitle(gameProfile.id);
        });

    }

    changeWindowTitle(id: number) {
        let window = this.gameWindowMap.get(id);
        if (window) {
            let gameProfile = this.gameWindowsManager.getGameProfileById(id);
            let title = `Flyff universe | ${gameProfile.name}`;
            window.setTitle(title);
        }
    }

    private onChangeFullScreen(event: IpcMainEvent, id: number, isFullscreen: boolean) {
        let browserWindow = this.gameWindowMap.get(id);
        if (browserWindow) {
            browserWindow.setFullScreen(isFullscreen);
        }
    }

    private onChangeResolution(event: IpcMainEvent, id: number, width: number, height: number) {
        let browserWindow = this.gameWindowMap.get(id);
        if (browserWindow) {
            browserWindow.setContentSize(width, height);
            browserWindow.center();
        }
    }

    private async onSingleOpenGame(event: IpcMainEvent, profileId: number) {
        let gameProfile = this.gameWindowsManager.getGameProfileById(profileId);

        if (!gameProfile) {
            event.returnValue = false;
            return;
        }

        if (this.gameWindowMap.has(profileId)) {
            const dialogOpts = {
                type: "error",
                title: "錯誤",
                message: gameProfile.name + "遊戲已開啟",
            };
            await dialog.showMessageBox(dialogOpts);
            event.returnValue = false;
            return;
        }

        this.createGameWindow(gameProfile);
    }

    onCloseSingleGame(event: IpcMainEvent, profileId: number) {
        this.closeWindow(profileId);
    }

    closeWindow(profileId: number) {
        try {
            let browserWindow = this.gameWindowMap.get(profileId);
            this.gameWindowMap.delete(profileId)
            browserWindow.destroy();
            this.windowManager.refreshGameProfileListOnMainWindow();
        } catch (e) {

        }
    }
}
