/**
 * 中国蚁剑::更新程序
 * 开写: 2016/05/31
 */

const config = require('./config');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;

class Update {
  constructor() {
    this.listenHandler();
    this.openWindow();
  }

  /**
   * 事件监听器
   * @return {[type]} [description]
   */
  listenHandler() {
    electron.ipcMain
      .on('update-getVersion', (event) => {
        event.returnValue = config.package['version']
      })
  }

  /**
   * 打开更新窗口
   * @return {[type]} [description]
   */
  openWindow() {
    let win = new BrowserWindow({
      width: 400,
      height: 250,
      // height: 180,
      // resizable: false,
      minimizable: false,
      maximizable: false
    });
    win.loadURL('ant-views://update.html');
    win.webContents.openDevTools();
  }
}

module.exports = Update;
