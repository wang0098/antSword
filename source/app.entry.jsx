//
// 程序入口
// -------
// create: 2015/12/20
// update: 2016/04/02
//

'use strict';

const electron = global.require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

import Menubar from './base/menubar';
import CacheManager from './base/cachemanager';

const antSword = window.antSword = {
  noxss: (html) => {
    return String(html).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  },
  core: {},
  modules: {},
  // localStorage存储
  // 参数{key:存储键值,[value]:存储内容,[def]:默认内容}
  storage: (key, value, def) => {
    // 读取
    if (!value) {
      return localStorage.getItem(key) || def;
    };
    // 设置
    localStorage.setItem(key, value);
  }
};

// 加载模板代码
['php', 'asp', 'aspx', 'custom'].map((_) => {
  antSword['core'][_] = require(`./core/${_}/index`);
});

// 加载显示语言
let _lang = localStorage.getItem('language') || navigator.language;
_lang = ['en', 'zh'].indexOf(_lang) === -1 ? 'en' : _lang;
antSword['language'] = require(`./language/${_lang}`);

// 加载代理
const aproxy = {
  mode: antSword['storage']('aproxymode', false, 'noproxy'),
  port: antSword['storage']('aproxyport'),
  server: antSword['storage']('aproxyserver'),
  password: antSword['storage']('aproxypassword'),
  username: antSword['storage']('aproxyusername'),
  protocol: antSword['storage']('aproxyprotocol')
}
antSword['aproxymode'] = aproxy['mode'];

antSword['aproxyauth'] = (
  !aproxy['username'] || !aproxy['password']
) ? '' : `${aproxy['username']}:${aproxy['password']}`;

antSword['aproxyuri'] = `${aproxy['protocol']}:\/\/${antSword['aproxyauth']}@${aproxy['server']}:${aproxy['port']}`;

// 通知后端设置代理
ipcRenderer.send('aproxy', {
  aproxymode: antSword['aproxymode'],
  aproxyuri: antSword['aproxyuri']
});

antSword['ipcRenderer'] = ipcRenderer;
antSword['CacheManager'] = CacheManager;
antSword['menubar'] = new Menubar();
antSword['package'] = global.require('../package');

// 加载模块列表
// antSword['tabbar'] = new dhtmlXTabBar(document.getElementById('container'));
// 更新：使用document.body作为容器，可自动适应UI
antSword['tabbar'] = new dhtmlXTabBar(document.body);
[
  'shellmanager',
  'settings',
  'plugin'
].map((_) => {
  let _module = require(`./modules/${_}/index`);
  antSword['modules'][_] = new _module.default();
});
// 移除加载界面&&设置标题
$('#loading').remove();
document.title = antSword['language']['title'] || 'AntSword';
