/**
 * 添加/编辑数据表单
 */

const LANG_T = antSword['language']['toastr'];
const LANG = antSword['language']['shellmanager'];
const ENCODES = require('../../../base/encodes');

class Form {
  /**
   * 初始化函数
   * @param  {object} opt ui配置
   * @param  {object} arg = {} 默认数据
   * @param  {function} callback 点击按钮后回调数据
   */
  constructor(opt, arg = {}, callback = false) {
    // 创建win窗口
    const win = this._createWin(opt);
    // 创建toolbar工具栏
    this.toolbar = this._createToolbar(win, opt);
    // 创建表单分隔accordion
    this.accordion = this._createAccordion(win);
    // 创建表单
    this.baseForm = this._createBaseForm(arg);
    this.httpForm = this._createHttpForm(arg);
    this.otherForm = this._createOtherForm(arg);

    // toolbar点击事件
    this.toolbar.attachEvent('onClick', (id) => {
      if (id === 'clear') {
        return this.baseForm.clear();
      }
      // 检测表单数据
      if (
        !this.baseForm.validate() ||
        !this.httpForm.validate() ||
        !this.otherForm.validate()
      ) {
        return toastr.warning(LANG['list']['add']['warning'], LANG_T['warning']);
      };
      // 回调数据
      if (callback) {
        win.progressOn();
        callback(this._parseFormData(
          this.baseForm.getValues(),
          this.httpForm.getValues(),
          this.otherForm.getValues()
        )).then(() => {
          // 添加/保存完毕后回调
          win.close();
          toastr.success(LANG['list']['add']['success'], LANG_T['success']);
        }).catch((e) => {
          // 添加/保存错误
          win.progressOff();
          toastr.error(LANG['list']['add']['error'](e.toString()), LANG_T['error']);
        });
      };
    });
  }

  /**
   * 创建win窗口
   * @param  {object} opts = {} 窗口属性(title,width,height)
   * @return {object}      win
   */
  _createWin(opts = {}) {
    let _id = String(Math.random()).substr(5, 10);
    // 默认配置
    let opt = Object.assign({
      title: opts['title'] || 'Window:' + _id,
      width: 550, height: 450
    }, opts);

    // 创建窗口
    let win = antSword.modules.shellmanager.list.win;
    if (!win) {
      win = new dhtmlXWindows();
      win.attachViewportTo(antSword.modules.shellmanager.list.cell.cell);
      antSword.modules.shellmanager.list.win = win;
    }
    let _win = win.createWindow(_id, 0, 0, opt['width'], opt['height']);
    _win.setText(opt['title']);
    _win.centerOnScreen();
    _win.button('minmax').show();
    _win.button('minmax').enable();

    return _win;
  }

  /**
   * 创建工具栏
   * @param  {object} win [description]
   * @param  {object} opt ui配置
   * @return {[type]}     [description]
   */
  _createToolbar(win, opt) {
    const toolbar = win.attachToolbar();
    toolbar.loadStruct([{
      id: 'act',
      type: 'button',
      icon: opt['icon'],
      text: opt['text']
    }, {
      type: 'separator'
    }, {
      id: 'clear',
      type: 'button',
      icon: 'remove',
      text: LANG['list']['add']['toolbar']['clear']
    }]);
    return toolbar;
  }

  /**
   * 创建Accordion
   * @param  {[type]} win [description]
   * @return {[type]}     [description]
   */
  _createAccordion(win) {
    const accordion = win.attachAccordion({
      items: [{
        id: 'base',
        text: `<i class="fa fa-file-text"></i> 基础配置`
      }, {
        id: 'http',
        text: `<i class="fa fa-edge"></i> 请求信息`
      }, {
        id: 'other',
        text: `<i class="fa fa-cogs"></i> 其他设置`
      }]});
    return accordion;
  }

  /**
   * 创建基础表单
   * @param {object} arg 默认表单数据
   * @return {[type]}     [description]
   */
  _createBaseForm(arg) {
    const form = this.accordion.cells('base').attachForm([
      { type: 'settings', position: 'label-left', labelWidth: 80, inputWidth: 400 },
      { type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
        { type: 'input', label: LANG['list']['add']['form']['url'], name: 'url', required: true },
        { type: 'input', label: LANG['list']['add']['form']['pwd'], name: 'pwd', required: true },
        { type: 'combo', label: LANG['list']['add']['form']['encode'], readonly: true,
          name: 'encode', options: this._parseEncoders() },
        { type: 'combo', label: LANG['list']['add']['form']['type'], name: 'type',
          readonly: true, options: this._parseTypes() }
      ] }
    ], true);
    return form;
  }

  /**
   * 解析编码器列表
   * @return {array} [description]
   */
  _parseEncoders() {
    let ret = [];
    ENCODES.map((_) => {
      ret.push({
        text: _, value: _,
        selected: _ === 'UTF8'
      });
    });
    return ret;
  }

  /**
   * 解析脚本支持列表
   * @return {array} [description]
   */
  _parseTypes() {
    let ret = [];
    for (let c in antSword['core']) {
      let encoders = antSword['core'][c].prototype.encoders;
      ret.push({
        text: c.toUpperCase(), value: c,
        selected: c === 'php',
        list: ((c) => {
          let _ = [
            { type: 'settings', position: 'label-right', offsetLeft: 60, labelWidth: 100 },
            { type: 'label', label: LANG['list']['add']['form']['encoder'] },
            { type: 'radio', name: `encoder_${c}`, value: 'default', label: 'default', checked: true }
          ];
          encoders.map((e) => {
            _.push({
              type: 'radio', name: `encoder_${c}`,
              value: e, label: e
            })
          });
          return _;
        })(c)
      });
    }
    return ret;
  }


  /**
   * 解析表单数据
   * @param  {object} base  原始base数据
   * @param  {object} http  原始http数据
   * @param  {object} other 原始other数据
   * @return {object}       {base,http,other}
   */
  _parseFormData(base, http, other) {
    // 提取需要的base数据
    let _baseData = {
      url: base['url'],
      pwd: base['pwd'],
      type: base['type'],
      encode: base['encode'],
      encoder: base[`encoder_${base['type']}`]
    };
    // 提取需要的http数据
    let [headers, bodys] = [{}, {}];
    for (let _ in http) {
      if (_.endsWith('value') || !http[_]) {
        continue
      }
      let _tmp = _.split('-');
      if (_tmp[0] === 'header') {
        headers[ http[_] ] = http[_.replace(/name$/, 'value')];
      } else {
        bodys[ http[_] ] = http[_.replace(/name$/, 'value')];
      }
    }
    // 返回处理完毕的数据
    return {
      base: _baseData,
      http: {
        body: bodys,
        headers: headers
      },
      other: other
    };
  }

  /**
   * 创建其他设置表单
   * @param  {object} arg 默认配置
   * @return {[type]}     [description]
   */
  _createOtherForm(arg) {
    const form = this.accordion.cells('other').attachForm([{
        type: 'settings', position: 'label-right', inputWidth: 400
      }, {
        type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
        {
          type: "checkbox", name: 'ignore-https', label: "忽略HTTPS证书", checked: false
        }, {
          type: "checkbox", name: 'terminal-cache', label: "虚拟终端不使用缓存", checked: true
        }
      ]}], true);
    return form;
  }

  /**
   * 创建HTTP请求表单
   * @param  {object} arg [description]
   * @return {[type]}     [description]
   */
  _createHttpForm(arg) {
    const cell = this.accordion.cells('http');
    // 创建toolbar，用于添加数据
    const toolbar = cell.attachToolbar();
    toolbar.loadStruct([{
      id: 'add-header',
      type: 'button',
      icon: 'plus-square-o',
      text: 'Header'
    }, {
      type: 'separator'
    }, {
      id: 'add-body',
      type: 'button',
      icon: 'plus-square-o',
      text: 'Body'
    }]);
    // 创建表单
    const form = cell.attachForm([{
      type: 'block', inputWidth: 'auto', offsetTop: 12, name: 'header', list: [
				{type: "label", label: "HTTP HEADERS"}
      ]
    }, {
      type: 'block', inputWidth: 'auto', offsetTop: 12, name: 'body', list: [
        {type: "label", label: "HTTP BODY"}
      ]
    }], true);
    // 添加Header
    let _headerCount = 0;
    const _addHeader = (name = '', value = '') => {
      _headerCount ++;
      form.addItem(
        'header',
        {
          type: "fieldset", label: `#${_headerCount}`, inputWidth: 480, list:[
          	{type: "input", name: `header-${_headerCount}_name`, inputWidth: 350, labelWidth: 50, label: "Name", value: name},
          	{type: "input", name: `header-${_headerCount}_value`, inputWidth: 350, labelWidth: 50, label: "Value", value: value}
          ]
        }
      )
    }
    // 添加Body
    let _bodyCount = 0;
    const _addBody = (name = '', value = '') => {
      _bodyCount ++;
      form.addItem(
        'body',
        {
          type: "fieldset", label: `#${_bodyCount}`, inputWidth: 480, list:[
          	{type: "input", name: `body-${_bodyCount}_name`, inputWidth: 350, labelWidth: 50, label: "Name", value: name},
          	{type: "input", name: `body-${_bodyCount}_value`, inputWidth: 350, labelWidth: 50, label: "Value", value: value}
          ]
        }
      )
    }
    // 监听toolbar事件
    toolbar.attachEvent('onClick', (id, e) => {
      switch (id) {
        case 'add-header':
          _addHeader();
          break;
        case 'add-body':
          _addBody();
          break;
      }
    });
    _addHeader();
    _addBody();
    return form;
  }
}

module.exports = Form;
