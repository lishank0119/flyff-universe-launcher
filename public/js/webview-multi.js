let gameMap = new Map();
let setting;

window.onload = function () {
    api.on("refresh-webview", (event, idList, _setting) => {
        setting = _setting;
        refreshWebview(idList);
    });

    api.on("remove-webview", (event, id) => {
        removeWebview(id);
    });

    let list = api.ipc.sendSync("on-get-game-id-list");
    setting = api.ipc.sendSync("on-get-window-setting");
    refreshWebview(list);
}

function createWebview(id) {
    let webviewContainer = document.getElementById("webview-container");
    if (!gameMap.has(id)) {
        let div = document.createElement("div");
        div.id = `out-site-${id}`;
        div.className = "col-md-12 m-0 p-0";
        div.style.height = "50vh";

        let webview = document.createElement("webview");
        webview.id = `wv-${id}`;
        webview.style.height = "100%";
        webview.style.width = "100%";
        webview.setAttribute("src", `https://universe.flyff.com/play`);
        webview.setAttribute("partition", `persist:game-${id}`);
        webview.setAttribute("nodeintegration", `on`);
        webview.setAttribute("disablewebsecurity", `on`);
        div.appendChild(webview);

        webviewContainer.append(div);

        gameMap.set(id, {
            div: div,
            webview: webview
        });
    }
}

function refreshWebview(list) {
    for (let i = 0; i < list.length; i++) {
        createWebview(list[i]);
    }
    refreshLayout();
}

function removeWebview(id) {

    let gameMapType = gameMap.get(id);
    if (gameMapType) {
        gameMapType.webview.delete();
        let webviewContainer = document.getElementById("webview-container");
        webviewContainer.removeChild(gameMapType.div);
        gameMap.delete(id);
        refreshLayout();
    }
}

function refreshLayout() {
    let size = gameMap.size;
    let cssStr = getCssBySize(size);
    let heightStr = getHeightBySize(size);

    gameMap.forEach(value => {
        value.div.style.height = heightStr;
        value.div.className = cssStr;
    })
}

function getCssBySize(size) {
    let cssStr;
    switch (size) {
        case 0:
        case 1:
            cssStr = "col-md-12 m-0 p-0";
            break;
        case 2:
            let value = setting["2"];
            if (value === "1") {
                //高50% 寬100%
                cssStr = "col-md-12 m-0 p-0";
            } else if (value === "2") {
                // 高100% 寬50%
                cssStr = "col-md-6 m-0 p-0";
            } else {
                // 高100% 寬100%
                cssStr = "col-md-12 m-0 p-0";
            }
            break;
        default:
            let moreValue = setting["more"];
            if (moreValue === "1") {
                //高50% 寬100%
                cssStr = "col-md-12 m-0 p-0";
            } else if (moreValue === "2") {
                // 高100% 寬50%
                cssStr = "col-md-6 m-0 p-0";
            } else if (moreValue === "3") {
                // 高100% 寬100%
                cssStr = "col-md-12 m-0 p-0";
            } else {
                // 高50% 寬50%
                cssStr = "col-md-6 m-0 p-0"
            }
            break;
    }

    return cssStr;
}

function runScript(webviewId, jsStr) {
    try {
        let game = gameMap.get(webviewId);
        if (game) {
            game.webview.executeJavaScript(jsStr);
        }
    } catch (e) {

    }
}

function getHeightBySize(size) {
    if (size <= 1) {
        return "100vh";
    } else if (size === 2) {
        let value = setting["2"];
        if (value === "1") {
            //高50% 寬100%
            return "50vh";
        } else if (value === "2") {
            // 高100% 寬50%
            return "100vh";
        } else {
            // 高100% 寬100%
            return "100vh";
        }
    } else {
        let moreValue = setting["more"];
        if (moreValue === "1") {
            //高50% 寬100%
            return "50vh";
        } else if (moreValue === "2") {
            // 高100% 寬50%
            return "100vh";
        } else if (moreValue === "3") {
            // 高100% 寬100%
            return "100vh";
        } else {
            // 高50% 寬50%
            return "50vh";
        }
    }
}
