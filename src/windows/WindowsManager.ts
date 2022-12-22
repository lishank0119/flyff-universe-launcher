import {app, BrowserWindow, dialog, Tray, Menu, shell} from "electron";
import * as Store from "electron-store";
import * as path from "path";
import GameWindowsManager from "./GameWindowsManager";

export default class WindowManager {
    private baseWindow: { width: number, height: number } = {
        width: 800,
        height: 600
    };

    mainWindow: BrowserWindow;

    constructor() {
        new GameWindowsManager(this);
    }

    createMainWindow() {

        let stateKeeper = this.windowStateKeeper("Main", this.baseWindow);

        // Create the browser window.
        const mainWindow = new BrowserWindow({
            title: app.getName(),
            height: stateKeeper.height,
            width: stateKeeper.width,
            minWidth: this.baseWindow.width,
            minHeight: this.baseWindow.height,
            x: stateKeeper.x,
            y: stateKeeper.y,
            webPreferences: {
                sandbox: true,
                partition: "persist:main",
                nodeIntegration: true,
                preload: path.join(__dirname, "../preload/preload.js"),
            }
        });

        let menu = Menu.buildFromTemplate([
            {
                label: "Wiki",
                submenu: [
                    {
                        label: "flyffipedia",
                        click: () => {
                            shell.openExternal("https://flyffipedia.com/home");
                        }
                    },
                    {
                        label: "madrigalinside",
                        click: () => {
                            shell.openExternal("https://madrigalinside.com/");
                        }
                    },
                    {
                        label: "flyff-universe-wiki",
                        click: () => {
                            shell.openExternal("https://flyff-universe-wiki.com/wiki/Home");
                        }
                    }
                ]
            },
            {
                label: "Quests",
                click: () => {
                    shell.openExternal("https://flyff-universe-wiki.com/wiki/Quests_by_level");
                }
            },
            {
                label: "Github",
                click: () => {
                    shell.openExternal("https://github.com/yungming/flyff-universe-launcher");
                }
            }
        ]);

        mainWindow.setMenu(menu)

        this.mainWindow = mainWindow;
        mainWindow.setIcon(path.join(__dirname, '../../icon/icon.png'));
        mainWindow.loadFile(path.join(__dirname, '../../public/index.html'))
            .then(() => stateKeeper.track(mainWindow));

        mainWindow.on('ready-to-show', async () => {
            this.initWindow(mainWindow, stateKeeper);
            mainWindow.webContents.setFrameRate(10);
        });

        mainWindow.on("close", (event) => {
            event.preventDefault();
            const dialogOpts = {
                type: "warning",
                buttons: ["是", "否"],
                title: mainWindow.getTitle(),
                message: "是否要關閉?",
            };
            dialog.showMessageBox(dialogOpts)
                .then((returnValue) => {
                    if (returnValue.response === 0) {
                        mainWindow.destroy();
                        this.mainWindow = null;
                    }
                });
        });
    }

    refreshGameProfileListOnMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.webContents.executeJavaScript(`refreshGameProfileListTable();`)
                .then(() => {
                });
        }
    }

    createTray() {
        let tray = new Tray(path.join(__dirname, '../../icon/icon.png'))
        tray.setTitle(app.getName());
        tray.setToolTip(app.getName());
        if (process.platform === 'win32') {
            tray.on('click', () => {
                if (this.mainWindow) {
                    this.mainWindow.show()
                } else {
                    this.createMainWindow()
                }
            })
        }
    }

    windowStateKeeper(settingKey: string, baseWindow: { width: number, height: number }) {
        let window: BrowserWindow, windowState: any;

        let key = `${settingKey}`;

        let store = new Store({
            cwd: `windowSetting`
        });

        function setBounds() {
            // Restore from appConfig
            if (store.has(key)) {
                windowState = store.get(key);
                return;
            }
            // Default
            windowState = {
                x: undefined,
                y: undefined,
                width: baseWindow.width,
                height: baseWindow.height,
            };
        }

        function saveState() {
            windowState = window.getBounds();
            windowState.width = window.getContentSize()[0];
            windowState.height = window.getContentSize()[1];
            windowState.isFullscreen = window.isFullScreen();
            windowState.isMaximized = window.isMaximized();
            store.set(key, windowState);
        }

        function track(win: BrowserWindow) {
            window = win;
            ['resize', 'move', 'close'].forEach(event => {
                // @ts-ignore
                win.on(event, saveState);
            });
        }

        setBounds();
        return ({
            ...windowState,
            track,
        });
    }

    initWindow(window: BrowserWindow, stateKeeper: any) {
        if (stateKeeper.isFullscreen) {
            window.setFullScreen(true);
        } else if (stateKeeper.isMaximized) {
            window.maximize();
        } else {
            window.setContentSize(stateKeeper.width, stateKeeper.height);
        }

        window.show();
        if (!stateKeeper.x) {
            window.center();
        }
    }
}


