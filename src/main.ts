import {app, BrowserWindow} from "electron";
import * as path from "path";
import WindowManager from "./windows/WindowsManager";

if (process.platform === 'win32') {
    let dataPath = path.join(__dirname, app.isPackaged ? "../../../data" : "../data");
    app.setPath('appData', dataPath + "/app");
    app.setPath('userData', dataPath + "/user");
    app.setPath('userCache', dataPath + "/cache");
    app.setAppLogsPath(dataPath + "/logs");
}

let windowManger = new WindowManager();
const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {

        // Someone tried to run a second instance, we should focus our window.
        if (windowManger.mainWindow) {
            if (windowManger.mainWindow.isMinimized()) windowManger.mainWindow.restore()
            windowManger.mainWindow.focus()
        } else {
            windowManger.createMainWindow();
        }
    });

    app.whenReady().then(() => {
        windowManger.createMainWindow();

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) {
                windowManger.createMainWindow();
            }
        });

        windowManger.createTray();
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit()
    });
}



