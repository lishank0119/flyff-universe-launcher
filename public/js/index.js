let singleWindowModal
let windowModal
let multiWindowSettingModal
let gameProfileId = null;

function onAddGameProfile() {
    let windowName = document.getElementById("input-game-window-name").value;
    if (windowName.trim().length === 0) {
        return;
    }
    let success = ipc.sendSync("add-game-profile", windowName);
    if (success) {
        refreshGameProfileListTable();
    }
}

function getGameProfileList() {
    return window.ipc.sendSync("get-game-profile-list");
}

function refreshGameProfileListTable() {
    let list = getGameProfileList();
    let html = ""
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        let buttonHtml = "";
        if (item.isSingleOpen) {
            buttonHtml += ` <button onclick="onCloseSingleGame(${item.id})" type="button" class="btn btn-warning">關閉遊戲</button>`
            buttonHtml += ` <button onclick="onOpenSingleGameSetting(${item.id}, '${item.name}')" type="button" class="btn btn-info">單視窗設定</button>`
        } else if (item.isMultiOpen) {
            buttonHtml += ` <button onclick="onCloseMultiGame(${item.id})" type="button" class="btn btn-warning">關閉遊戲</button>`
        } else {
            buttonHtml += ` <button onclick="onStartSingleGame(${item.id})" type="button" class="btn btn-primary">開始遊戲(單視窗)</button>`
            buttonHtml += ` <button onclick="onStartMultiGame(${item.id})" type="button" class="btn btn-primary">開始遊戲(多視窗)</button>`
        }
        buttonHtml += ` <button onclick="onOpenSetting(${item.id}, '${item.name}')" type="button" class="btn btn-success">更改名稱</button>`
        buttonHtml += ` <button onclick="onRemoveGameProfile(${item.id})" type="button" class="btn btn-danger">刪除</button>`

        html +=
            `
               <tr>
                    <td>${item.name}</td>
                    <td>
                        <div style="vertical-align: middle">${buttonHtml}</div>
                    </td>
                </tr>
            `
    }

    let gameListTable = document.getElementById("game-profile-list");
    gameListTable.innerHTML = html;
}

function onStartSingleGame(id) {
    window.ipc.invoke("on-single-open-game", id);
}

function onCloseSingleGame(id) {
    window.ipc.invoke("on-single-close-game", id);
}

function onRemoveGameProfile(id) {
    window.ipc.sendSync("remove-game-profile", id);
}

function onOpenSingleGameSetting(id, name) {
    gameProfileId = id;
    singleWindowModal.show();
}

function onChangeGameProfileName() {
    let changeName = document.getElementById("input-change-game-window-name").value;
    window.ipc.invoke("on-change-name", gameProfileId, changeName);
    windowModal.hide();
}

function onStartMultiGame(id) {
    window.ipc.invoke("on-multi-open-game", id);
}

function onCloseMultiGame(id) {
    window.ipc.invoke("on-multi-close-game", id);
}

function onOpenSetting(id, name) {
    gameProfileId = id;
    document.getElementById("input-change-game-window-name").value = name;
    windowModal.show();
}

function onOpenMultiWindowSetting() {
    let setting = window.ipc.sendSync("on-get-window-setting")
    let value = setting["2"];
    if (value === "1") {
        //高50% 寬100%
        document.getElementById("2-50-100").checked = true;
        document.getElementById("2-100-50").checked = false;
        document.getElementById("2-100-100").checked = false;
    } else if (value === "2") {
        // 高100% 寬50%
        document.getElementById("2-50-100").checked = false;
        document.getElementById("2-100-50").checked = true;
        document.getElementById("2-100-100").checked = false;
    } else {
        // 高100% 寬100%
        document.getElementById("2-50-100").checked = false;
        document.getElementById("2-100-50").checked = false;
        document.getElementById("2-100-100").checked = true;
    }

    let moreValue = setting["more"];
    if (moreValue === "1") {
        //高50% 寬100%
        document.getElementById("50-100").checked = true;
        document.getElementById("100-50").checked = false;
        document.getElementById("100-100").checked = false;
        document.getElementById("50-50").checked = false;
    } else if (moreValue === "2") {
        // 高100% 寬50%
        document.getElementById("50-100").checked = false;
        document.getElementById("100-50").checked = true;
        document.getElementById("100-100").checked = false;
        document.getElementById("50-50").checked = false;
    } else if (moreValue === "3") {
        // 高100% 寬100%
        document.getElementById("50-100").checked = false;
        document.getElementById("100-50").checked = false;
        document.getElementById("100-100").checked = true;
        document.getElementById("50-50").checked = false;
    } else {
        // 高50% 寬50%
        document.getElementById("50-100").checked = false;
        document.getElementById("100-50").checked = false;
        document.getElementById("100-100").checked = false;
        document.getElementById("50-50").checked = true;
    }

    multiWindowSettingModal.show();
}

function onSaveMultiWindowSetting() {
    let value = {
        "2": document.querySelector('input[name="multi-2-windows-size"]:checked').value,
        "more": document.querySelector('input[name="multi-more-windows-size"]:checked').value
    }

    window.ipc.invoke("on-save-window-setting", value);
    multiWindowSettingModal.hide();
}

window.onload = function () {
    refreshGameProfileListTable();

    singleWindowModal = new bootstrap.Modal(document.getElementById('window-single-setting'), {
        keyboard: false
    });

    windowModal = new bootstrap.Modal(document.getElementById('window-setting'), {
        keyboard: false
    });

    multiWindowSettingModal = new bootstrap.Modal(document.getElementById('multi-window-setting'), {
        keyboard: false
    });

    const selectElement = document.getElementById('resolution-select');
    selectElement.addEventListener('change', (event) => {
        const index = Number(event.target.value);

        if (index < 0) {
            return
        }

        const resolutionList = [
            {width: 1280, height: 720},
            {width: 1440, height: 900},
            {width: 1660, height: 900},
            {width: 1920, height: 1080},
        ];
        const resolution = resolutionList[index];

        window.ipc.invoke("on-single-change-resolution", gameProfileId, resolution.width, resolution.height);

    });

    const fullscreenElement = document.getElementById('fullscreen-check');
    fullscreenElement.addEventListener('change', function () {
        window.ipc.invoke("on-single-change-fullscreen", gameProfileId, this.checked);
    });
}
