/**
 * 中国蚁剑::主程序入口
 * 更新：2016/05/02
 * 作者：蚁逅 <https://github.com/antoor>
 */

'use strict';

const electron = require('electron'),
  app = electron.app,
  BrowserWindow = electron.BrowserWindow;

app
  .once('window-all-closed', app.quit)
  .once('ready', () => {
    let mainWindow = new BrowserWindow({
      width: 1040,
      height: 699,
      minWidth: 888,
      minHeight: 555,
      webgl: false,
      title: 'AntSword'
    });

    // 加载views
    mainWindow.loadURL(`file:\/\/${__dirname}/views/index.html`);

    // 调整部分UI
    const reloadUI = mainWindow.webContents.send.bind(
      mainWindow.webContents,
      'reloadui', true
    );

    // 窗口事件监听
    mainWindow
      .on('closed', () => { mainWindow = null })
      .on('resize', reloadUI)
      .on('maximize', reloadUI)
      .on('unmaximize', reloadUI)
      .on('enter-full-screen', reloadUI)
      .on('leave-full-screen', reloadUI);

    // 打开调试控制台
    // mainWindow.webContents.openDevTools();

    electron.Logger = require('./modules/logger')(mainWindow);
    // 初始化模块
    ['menubar', 'request', 'database', 'cache', 'update'].map((_) => {
      new ( require(`./modules/${_}`) )(electron, app, mainWindow);
    });
  });
