/**
 * 右键菜单
 */

const DATA = require('../data');
const Terminal = require('../../terminal/');
const Database = require('../../database/');
const FileManager = require('../../filemanager/');
const LANG = antSword['language']['shellmanager']['contextmenu'];

class ContextMenu {
  /**
   * 初始化函数
   * @param  {array} data  选中的数据
   * @param  {object} event 右键事件对象
   * @return {[type]}       [description]
   */
  constructor(data, event, id, ids) {
    let selectedData = !id || ids.length !== 1;
    let selectedMultiData = !id;

    // 解析菜单事件
    let menuItems = [];
    [
      // text, icon, disabled, action, submenu
      ['terminal', 'terminal', selectedData, () => {
        new Terminal(data[0])
      }],
      ['filemanager', 'folder-o', selectedData, () => {
        new FileManager(data[0]);
      }],
      ['database', 'database', selectedData, () => {
        new Database(data[0]);
      }],
      false,
      ['plugin', 'folder-o', selectedMultiData, null, this.parsePlugContextMenu(data)],
      [
        'pluginStore', 'cart-arrow-down', false,
        antSword['menubar'].run.bind(antSword['menubar'], 'plugin-store')
      ],
      false,
      ['add', 'plus-circle', false, this.addData.bind(this)],
      ['edit', 'edit', selectedData, this.editData.bind(this, id)],
      ['delete', 'remove', selectedMultiData, this.delData.bind(this, ids)],
      false,
      ['move', 'share-square', selectedMultiData],
      ['search', 'search', true],
      false,
      ['clearCache', 'trash-o', selectedMultiData, this.clearCache.bind(this, ids)],
      ['clearAllCache', 'trash', false, this.clearAllCache.bind(this)]
    ].map((menu) => {
      // 分隔符号
      if (!menu) {
        return menuItems.push({
          divider: true
        })
      }
      let menuObj = {
        text: LANG[menu[0]],
        icon: `fa fa-${menu[1]}`,
        disabled: menu[2]
      }
      // 点击事件
      if (menu[3] instanceof Function) {
        menuObj['action'] = menu[3];
      }
      // 子菜单
      if (Array.isArray(menu[4])) {
        menuObj['subMenu'] = menu[4];
      }
      menuItems.push(menuObj);
    });
    // 弹出菜单
    bmenu(menuItems, event);
    //
    //   { divider: true },
    //   { text: LANG['add'], icon: 'fa fa-plus-circle', action: this.addData.bind(this) },
    //   {
    //     text: LANG['edit'], icon: 'fa fa-edit', disabled: selectedData,
    //     action: this.editData.bind(this, id)
    //   }, {
    //     text: LANG['delete'], icon: 'fa fa-remove', disabled: selectedMultiData,
    //     action: this.delData.bind(this, ids)
    //   }, {
    //     divider: true
    //   }, { text: LANG['move'], icon: 'fa fa-share-square', disabled: selectedMultiData }, //subMenu: (() => {
    //   //   const items = manager.category.sidebar.getAllItems();
    //   //   const category = manager.category.sidebar.getActiveItem();
    //   //   let ret = [];
    //   //   items.map((_) => {
    //   //     ret.push({
    //   //       text: _ === 'default' ? LANG['category']['default'] : _,
    //   //       icon: 'fa fa-folder-o',
    //   //       disabled: category === _,
    //   //       action: ((c) => {
    //   //         return () => {
    //   //           const ret = antSword['ipcRenderer'].sendSync('shell-move', {
    //   //             ids: ids,
    //   //             category: c
    //   //           });
    //   //           if (typeof(ret) === 'number') {
    //   //             toastr.success(LANG['list']['move']['success'](ret), LANG_T['success']);
    //   //             manager.loadData();
    //   //             manager.category.sidebar.callEvent('onSelect', [c]);
    //   //           }else{
    //   //             toastr.error(LANG['list']['move']['error'](ret), LANG_T['error']);
    //   //           }
    //   //         }
    //   //       })(_)
    //   //     });
    //   //   });
    //   //   return ret;
    //   // })() },
    //   {
    //     text: LANG['search'], icon: 'fa fa-search', action: this.searchData.bind(this), disabled: true
    //   }, {
    //     divider: true
    //   }, {
    //     text: LANG['clearCache'], icon: 'fa fa-trash-o',
    //     disabled: selectedMultiData, action: this.clearCache.bind(this, ids)
    //   }, {
    //     text: LANG['clearAllCache'], icon: 'fa fa-trash', action: this.clearAllCache.bind(this)
    //   }
    // ], event);
  }

  /**
   * 把插件列表解析成右键菜单所需要的数据
   * @return {array} [description]
   */
  parsePlugContextMenu(data) {
    let info = data[0];
    let infos = data;
    // 1. 遍历插件分类信息
    let plugins = {
      default: []
    };
    for (let _ in antSword['plugins']) {
      let p = antSword['plugins'][_];
      let c = p['info']['category'] || 'default';
      plugins[c] = plugins[c] || [];
      plugins[c].push(p);
    }
    // 2. 解析分类数据
    let pluginItems = [];
    for (let _ in plugins) {
      // 0x01 添加分类目录
      pluginItems.push({
        text: antSword.noxss(_ === 'default' ? LANG['pluginDefault'] : _),
        icon: 'fa fa-folder-open-o',
        disabled: plugins[_].length === 0,
        subMenu: ((plugs) => {
          let plugItems = [];
          // 0x02 添加目录数据
          plugs.map((p) => {
            plugItems.push({
              text: antSword.noxss(p['info']['name']),
              icon: `fa fa-${p['info']['icon'] || 'puzzle-piece'}`,
              disabled: infos.length > 1 ? (() => {
                let ret = false;
                // 判断脚本是否支持，不支持则禁止
                if (p['info']['scripts'] && p['info']['scripts'].length > 0) {
                  infos.map((_info) => {
                    if (p['info']['scripts'].indexOf(_info['type']) === -1) {
                      // 如果检测到不支持的脚本，则禁止
                      ret = true;
                    }
                  });
                }
                // 判断是否支持多目标执行
                return ret || !p['info']['multiple'];
              })() : info && (p['info']['scripts'] || []).indexOf(info['type']) === -1,
              action: ((plug) => () => {
                // 如果没有加载到内存，则加载
                if (!antSword['plugins'][plug['_id']]['module']) {
                  antSword['plugins'][plug['_id']]['module'] = require(
                    path.join(plug['path'], plug['info']['main'] || 'index.js')
                  );
                }
                // 执行插件
                new antSword['plugins'][plug['_id']]['module'](
                  infos.length === 1 && !plug['info']['multiple'] ? info : infos
                );
              })(p)
            })
          });
          return plugItems;
        })(plugins[_])
      })
    }
    return pluginItems;
  }

  /**
   * 添加数据
   */
  addData() {

  }

  /**
   * 编辑数据
   * @param  {number} id [description]
   * @return {[type]}    [description]
   */
  editData(id) {

  }

  /**
   * 删除数据
   * @param  {array} ids [description]
   * @return {[type]}     [description]
   */
  delData(ids) {

  }

  /**
   * 搜索数据
   * @return {[type]} [description]
   */
  searchData() {

  }

  /**
   * 清空缓存
   * @param  {array} ids [description]
   * @return {[type]}     [description]
   */
  clearCache(ids) {

  }

  /**
   * 清空所有缓存
   * @return {[type]} [description]
   */
  clearAllCache() {

  }
}

module.exports = ContextMenu;
