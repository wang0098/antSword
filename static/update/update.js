'use strict';

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

// 获取版本号
document.querySelector('#version').innerText = 'v' + ipcRenderer.sendSync('update-getVersion');
