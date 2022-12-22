const path = require('path');
const builder = require('electron-builder');
const pg = require('./package.json');

builder.build({
    // 專案路徑
    projectDir: path.resolve(__dirname),
    // nsis . portable
    win: ['portable'],
    publish: null,
    config: {
        files: [
            "dist/main.js",
            "dist/windows/**",
            "dist/preload/**",
            "icon/**",
            {
                from: "public/",
                to: "public",
            }
        ],
        appId: pg.appId,
        // 應用程式名稱 ( 顯示在應用程式與功能 )
        productName: "flyff universe launcher",
        artifactName: "flyff universe launcher" + ".exe",
        directories: {
            "output": "build/win/" + pg.version
        },
        nsis: {
            "allowToChangeInstallationDirectory": true,
            "oneClick": false,
        },
        win: {
            icon: path.resolve(__dirname, 'icon/icon.png'),
            publisherName: pg.name,
        }
    },
})
    .then(
        data => console.log(data),
        err => console.error(err)
    );
