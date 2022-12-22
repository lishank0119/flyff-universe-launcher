import {dialog, ipcMain, IpcMainEvent} from "electron";
import * as Store from "electron-store";
import GameSingleWindowManager from "./GameSingleWindowManager";
import WindowManager from "./WindowsManager";
import GameMultiWindowManager from "./GameMultiWindowManager";

export default class GameWindowsManager {
    private windowManager: WindowManager;

    private gameSingleWindowManager: GameSingleWindowManager;

    private gameMultiWindowManager: GameMultiWindowManager;

    gameProfileKey = "gameProfile";

    gameProfileStore = new Store({
        cwd: this.gameProfileKey
    });

    constructor(windowManager: WindowManager) {
        this.windowManager = windowManager;
        this.gameSingleWindowManager = new GameSingleWindowManager(windowManager, this);
        this.gameMultiWindowManager = new GameMultiWindowManager(windowManager, this);

        ipcMain.on("add-game-profile", this.onAddGameProfile.bind(this));
        ipcMain.on("remove-game-profile", this.onRemoveGameProfile.bind(this));
        ipcMain.on("get-game-profile-list", this.onGetGameProfileList.bind(this));
        ipcMain.handle("on-change-name", this.onChangeName.bind(this));
    }

    private async onAddGameProfile(event: IpcMainEvent, profileName: string) {
        let gameProfileList: GameProfileType[] = this.getGameProfileList();

        let id = 1;

        if (gameProfileList.length > 0) {
            id = gameProfileList[gameProfileList.length - 1].id + 1;
        }

        let gameProfile: GameProfileType = {
            id: id,
            name: profileName
        }
        gameProfileList.push(gameProfile)
        this.gameProfileStore.set(this.gameProfileKey, gameProfileList);
        event.returnValue = true;
    }

    private onGetGameProfileList(event: IpcMainEvent) {
        let gameProfileList = this.getGameProfileList();
        gameProfileList.forEach((gameProfile) => {
            gameProfile.isSingleOpen = this.gameSingleWindowManager.gameWindowMap.has(gameProfile.id);
            gameProfile.isMultiOpen = this.gameMultiWindowManager.gameIdWindowList.includes(gameProfile.id);
        });
        event.returnValue = gameProfileList;
    }

    private getGameProfileList(): GameProfileType[] {
        let gameProfileList: GameProfileType[] = []

        if (this.gameProfileStore.has(this.gameProfileKey)) {
            // @ts-ignore
            gameProfileList = this.gameProfileStore.get(this.gameProfileKey);
        }

        return gameProfileList || [];
    }

    getGameProfileById(profileId: number): GameProfileType {
        let gameProfileList = this.getGameProfileList();
        let gameProfile = gameProfileList.find(gameProfile => gameProfile.id === profileId);
        if (!gameProfile) {
            const dialogOpts = {
                type: "error",
                title: "錯誤",
                message: "找不到設定檔案",
            };
            dialog.showMessageBox(dialogOpts)
                .then(() => {
                });
            return null;
        }
        return gameProfile;
    }

    onRemoveGameProfile(event: IpcMainEvent, profileId: number) {
        try {
            this.gameSingleWindowManager.closeWindow(profileId);
            this.gameMultiWindowManager.closeWebview(profileId);

            let gameProfileList = this.getGameProfileList();
            let index = gameProfileList.findIndex(gameProfile => gameProfile.id === profileId);
            if (index > -1) {
                gameProfileList.splice(index, 1);
            }

            this.gameProfileStore.set(this.gameProfileKey, gameProfileList);
            this.windowManager.refreshGameProfileListOnMainWindow();
            let store = new Store({
                cwd: `windowSetting`
            });
            store.delete(`Game-${profileId}`);
            event.returnValue = true;
        } catch (e) {
            event.returnValue = false;
        }
    }

    private onChangeName(event: IpcMainEvent, id: number, name: string) {
        let gameProfileList = this.getGameProfileList();
        let index = gameProfileList.findIndex(gameProfile => gameProfile.id === id);
        if (index > -1) {
            gameProfileList[index].name = name;
            this.gameProfileStore.set(this.gameProfileKey, gameProfileList);
            this.windowManager.refreshGameProfileListOnMainWindow();
            this.gameSingleWindowManager.changeWindowTitle(id);
        }
    }
}

export type GameProfileType = {
    id: number
    name: string
    isSingleOpen?: boolean
    isMultiOpen?: boolean
}
