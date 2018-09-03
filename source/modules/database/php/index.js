//
// 数据库驱动::PHP
// 支持数据库:mysql,mssql,oracle,informix
//

const LANG = antSword['language']['database'];
const LANG_T = antSword['language']['toastr'];

class PHP {

  constructor(opt) {
    this.opt = opt;
    this.core = this.opt.core;
    this.manager = this.opt.super;
    // 1. 初始化TREE UI
    this.tree = this.manager.list.layout.attachTree();
    // 2. 加载数据库配置
    this.parse();
    // 3. tree单击::设置当前配置&&激活按钮
    this.tree.attachEvent('onClick', (id) => {
      // 更改按钮状态
      id.startsWith('conn::') ? this.enableToolbar() : this.disableToolbar();
      // 设置当前配置
      const tmp = id.split('::');
      const arr = tmp[1].split(':');
      // 设置当前数据库
      this.dbconf = antSword['ipcRenderer'].sendSync('shell-getDataConf', {
        _id: this.manager.opt['_id'],
        id: arr[0]
      });
      if (arr.length > 1) {
        this.dbconf['database'] = new Buffer(arr[1], 'base64').toString();
        // 更新SQL编辑器
        this.enableEditor();
        // manager.query.update(this.currentConf);
      }else{
        this.disableEditor();
      }
    });
    // 4. tree双击::加载库/表/字段
    this.tree.attachEvent('onDblClick', (id) => {
      const arr = id.split('::');
      if (arr.length < 2) { throw new Error('ID ERR: ' + id) };

      switch(arr[0]) {
        // 获取数据库列表
        case 'conn':
          this.getDatabases(arr[1]);
          break;
        // 获取数据库表名
        case 'database':
          let _db = arr[1].split(':');
          this.getTables(
            _db[0],
            new Buffer(_db[1], 'base64').toString()
          );
          break;
        // 获取表名字段
        case 'table':
          let _tb = arr[1].split(':');
          this.getColumns(
            _tb[0],
            new Buffer(_tb[1], 'base64').toString(),
            new Buffer(_tb[2], 'base64').toString()
          );
          break;
        // 生成查询SQL语句
        case 'column':
          let _co = arr[1].split(':');
          const table = new Buffer(_co[2], 'base64').toString();
          const column = new Buffer(_co[3], 'base64').toString();

          const sql = `SELECT \`${column}\` FROM \`${table}\` ORDER BY 1 DESC LIMIT 0,20;`;
          this.manager.query.editor.session.setValue(sql);
          break;
      }
    });
    // 5. tree右键::功能菜单
    this.tree.attachEvent('onRightClick', (id, event) => {
      this.tree.selectItem(id);
      const arr = id.split('::');
      if (arr.length < 2) { throw new Error('ID ERR: ' + id) };
      switch(arr[0]) {
        case 'conn':
          this.tree.callEvent('onClick', [id]);
          bmenu([
            {
              text: "新建数据库",
              icon: 'fa fa-plus-circle',
              action: this.addDatabase.bind(this)
            },
            {
              text: LANG['list']['menu']['add'],
              icon: 'fa fa-plus-circle',
              action: this.addConf.bind(this)
            }, {
              divider: true
            }, {
              text: LANG['list']['menu']['edit'],
              icon: 'fa fa-edit',
              action: this.editConf.bind(this)
            }, {
              divider: true
            }, {
              text: LANG['list']['menu']['del'],
              icon: 'fa fa-remove',
              action: this.delConf.bind(this)
            }
          ], event);
          break;
        case 'database':
          this.tree.callEvent('onClick', [id]);
          bmenu([
            {
              text: "新建表",
              icon: 'fa fa-plus-circle',
              action: this.addTable.bind(this)
            },
            {
              text: "新建数据库",
              icon: 'fa fa-plus-circle',
              action: this.addDatabase.bind(this)
            }, {
              divider: true
            }, {
              text: "编辑数据库",
              icon: 'fa fa-edit',
              action: this.editDatabase.bind(this)
            }, {
              divider: true
            }, {
              text: "删除数据库",
              icon: 'fa fa-remove',
              action: this.delDatabase.bind(this)
            }
          ], event);
          break;
        case 'table':
          this.tree.callEvent('onClick', [id]);
          bmenu([
            {
              text: "新建表",
              icon: 'fa fa-plus-circle',
              action: this.addTable.bind(this)
            }, {
              divider: true
            }, {
              text: "编辑表名",
              icon: 'fa fa-edit',
              action: this.editTable.bind(this)
            }, {
              divider: true
            }, {
              text: "删除表",
              icon: 'fa fa-remove',
              action: this.delTable.bind(this)
            }
          ], event);
          break;
        case 'column':
          this.tree.callEvent('onClick', [id]);
          bmenu([
            {
              text: "删除列",
              icon: 'fa fa-remove',
              action: this.delColumn.bind(this)
            },
          ], event);
          break;
      }
      // if (id.startsWith('conn::')) {
      //   this.tree.callEvent('onClick', [id]);
      //   bmenu([
      //     {
      //       text: LANG['list']['menu']['add'],
      //       icon: 'fa fa-plus-circle',
      //       action: this.addConf.bind(this)
      //     }, {
      //       divider: true
      //     }, {
      //       text: LANG['list']['menu']['edit'],
      //       icon: 'fa fa-edit',
      //       action: this.editConf.bind(this)
      //     }, {
      //       divider: true
      //     }, {
      //       text: LANG['list']['menu']['del'],
      //       icon: 'fa fa-remove',
      //       action: this.delConf.bind(this)
      //     }
      //   ], event);
      // };
    });

    // mysql character set mapping
    this.mysqlcsMapping = {
      'default': ['default'],
      'utf8': [
        "utf8_general_ci","utf8_bin","utf8_unicode_ci","utf8_icelandic_ci","utf8_latvian_ci","utf8_romanian_ci","utf8_slovenian_ci","utf8_polish_ci","utf8_estonian_ci","utf8_spanish_ci","utf8_swedish_ci","utf8_turkish_ci","utf8_czech_ci","utf8_danish_ci","utf8_lithuanian_ci","utf8_slovak_ci","utf8_spanish2_ci","utf8_roman_ci","utf8_persian_ci","utf8_esperanto_ci","utf8_hungarian_ci","utf8_sinhala_ci","utf8_general_mysql500_ci",
      ],
      'big5': [ "big5_chinese_ci","big5_bin"],
      'dec8': [ "dec8_swedish_ci","dec8_bin"],
      'cp850': [ "cp850_general_ci","cp850_bin"],
      'hp8': [ "hp8_general_ci","hp8_bin"],
      'koi8r': [ "koi8_general_ci","koi8_bin"],
      'latin1':[
        "latin1_german1_ci","latin1_swedish_ci","latin1_danish_ci","latin1_german2_ci","latin1_bin","latin1_general_ci","latin1_general_cs","latin1_spanish_ci"
      ],
      'latin2':[ 
        "latin2_czech_cs","latin2_general_ci","latin2_hungarian_ci","latin2_croatian_ci","latin2_bin",
      ],
      'ascii':[ "ascii_general_ci","ascii_bin" ],
      'euckr':[ "euckr_korean_ci","euckr_bin" ],
      'gb2312':[ "gb2312_chinese_ci","gb2312_bin"],
      'gbk':[ "gbk_chinese_ci","gbk_bin"],
      'utf8mb4': [
        "utf8mb4_general_ci","utf8mb4_bin","utf8mb4_unicode_ci","utf8mb4_icelandic_ci","utf8mb4_latvian_ci","utf8mb4_romanian_ci","utf8mb4_slovenian_ci","utf8mb4_polish_ci","utf8mb4_estonian_ci","utf8mb4_spanish_ci","utf8mb4_swedish_ci","utf8mb4_turkish_ci","utf8mb4_czech_ci","utf8mb4_danish_ci","utf8mb4_lithuanian_ci","utf8mb4_slovak_ci","utf8mb4_spanish2_ci","utf8mb4_roman_ci","utf8mb4_persian_ci","utf8mb4_esperanto_ci","utf8mb4_hungarian_ci","utf8mb4_sinhala_ci",
      ],
      'utf16': [
        "utf16_general_ci","utf16_bin","utf16_unicode_ci","utf16_icelandic_ci","utf16_latvian_ci","utf16_romanian_ci","utf16_slovenian_ci","utf16_polish_ci","utf16_estonian_ci","utf16_spanish_ci","utf16_swedish_ci","utf16_turkish_ci","utf16_czech_ci","utf16_danish_ci","utf16_lithuanian_ci","utf16_slovak_ci","utf16_spanish2_ci","utf16_roman_ci","utf16_persian_ci","utf16_esperanto_ci","utf16_hungarian_ci","utf16_sinhala_ci",
      ],
    };
  }

  // 加载配置列表
  parse() {
    // 获取数据
    const info = antSword['ipcRenderer'].sendSync('shell-findOne', this.manager.opt['_id']);
    const conf = info['database'] || {};
    // 刷新UI
    // 1.清空数据
    this.tree.deleteChildItems(0);
    // 2.添加数据
    let items = [];
    for (let _ in conf) {
      items.push({
        id: `conn::${_}`,
        text: `${conf[_]['type']}:\/\/${conf[_]['user']}@${conf[_]['host']}`,
        im0: this.manager.list.imgs[0],
        im1: this.manager.list.imgs[0],
        im2: this.manager.list.imgs[0]
      });
    }
    // 3.刷新UI
    this.tree.parse({
      id: 0,
      item: items
    }, 'json');
    // 禁用按钮
    this.disableToolbar();
    this.disableEditor();
  }

  // 添加配置
  addConf() {
    const hash = (+new Date * Math.random()).toString(16).substr(2, 8);
    // 创建窗口
    const win = this.manager.win.createWindow(hash, 0, 0, 450, 300);
    win.setText(LANG['form']['title']);
    win.centerOnScreen();
    win.button('minmax').hide();
    win.setModal(true);
    win.denyResize();
    // 工具栏
    const toolbar = win.attachToolbar();
    toolbar.loadStruct([{
      id: 'add',
      type: 'button',
      icon: 'plus-circle',
      text: LANG['form']['toolbar']['add']
    }, {
      type: 'separator'
    }, {
      id: 'clear',
      type: 'button',
      icon: 'remove',
      text: LANG['form']['toolbar']['clear']
    }]);

    // form
    const form = win.attachForm([
      { type: 'settings', position: 'label-left', labelWidth: 90, inputWidth: 250 },
      { type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
        { type: 'combo', label: LANG['form']['type'], readonly: true, name: 'type', options: [
          { text: 'MYSQL', value: 'mysql', list: [

            { type: 'settings', position: 'label-left', offsetLeft: 70, labelWidth: 90, inputWidth: 150 },
            { type: 'label', label: LANG['form']['encode'] },
            { type: 'combo', label: '', name: 'encode', options: (() => {
              let ret = [];
              ['utf8', 'big5', 'dec8', 'cp850', 'hp8', 'koi8r', 'latin1', 'latin2', 'ascii', 'euckr', 'gb2312', 'gbk'].map((_) => {
                ret.push({
                  text: _,
                  value: _
                });
              })
              return ret;
            })() }

          ] },
          { text: 'MYSQLI', value: 'mysqli', list: [

            { type: 'settings', position: 'label-left', offsetLeft: 70, labelWidth: 90, inputWidth: 150 },
            { type: 'label', label: LANG['form']['encode'] },
            { type: 'combo', label: '', name: 'encode', options: (() => {
              let ret = [];
              ['utf8', 'big5', 'dec8', 'cp850', 'hp8', 'koi8r', 'latin1', 'latin2', 'ascii', 'euckr', 'gb2312', 'gbk'].map((_) => {
                ret.push({
                  text: _,
                  value: _
                });
              })
              return ret;
            })() }

          ] },
          { text: 'MSSQL', value: 'mssql' },
          { text: 'ORACLE', value: 'oracle' },
          { text: 'INFORMIX', value: 'informix' }
        ] },
        { type: 'input', label: LANG['form']['host'], name: 'host', required: true, value: 'localhost' },
        { type: 'input', label: LANG['form']['user'], name: 'user', required: true, value: 'root' },
        { type: 'input', label: LANG['form']['passwd'], name: 'passwd', value: '' }
      ]}
    ], true);

    form.attachEvent('onChange', (_, id) => {
      if (_ !== 'type') { return };
      switch(id) {
        case 'mysql':
        case 'mysqli':
          form.setFormData({
            user: 'root',
            passwd: ''
          });
          break;
        case 'mssql':
          form.setFormData({
            user: 'sa',
            passwd: ''
          });
          break;
        default:
          form.setFormData({
            user: 'dbuser',
            passwd: 'dbpwd'
          });
      }
    });

    // 工具栏点击事件
    toolbar.attachEvent('onClick', (id) => {
      switch(id) {
        case 'clear':
          form.clear();
          break;
        case 'add':
          if (!form.validate()) {
            return toastr.warning(LANG['form']['warning'], LANG_T['warning']);
          };
          // 解析数据
          let data = form.getValues();
          // 验证是否连接成功(获取数据库列表)
          const id = antSword['ipcRenderer'].sendSync('shell-addDataConf', {
            _id: this.manager.opt['_id'],
            data: data
          });
          win.close();
          toastr.success(LANG['form']['success'], LANG_T['success']);
          this.tree.insertNewItem(0,
            `conn::${id}`,
            `${data['type']}:\/\/${data['user']}@${data['host']}`,
            null,
            this.manager.list.imgs[0],
            this.manager.list.imgs[0],
            this.manager.list.imgs[0]
          );
          break;
      }
    });
  }

  // 编辑配置
  editConf(){
    const id = this.tree.getSelected().split('::')[1];
    // 获取配置
    const conf = antSword['ipcRenderer'].sendSync('shell-getDataConf', {
      _id: this.manager.opt['_id'],
      id: id
    });
    const hash = (+new Date * Math.random()).toString(16).substr(2, 8);
    // 创建窗口
    const win = this.manager.win.createWindow(hash, 0, 0, 450, 300);
    win.setText(LANG['form']['title']);
    win.centerOnScreen();
    win.button('minmax').hide();
    win.setModal(true);
    win.denyResize();
    // 工具栏
    const toolbar = win.attachToolbar();
    toolbar.loadStruct([{
      id: 'edit',
      type: 'button',
      icon: 'edit',
      text: LANG['form']['toolbar']['edit']
    }, {
      type: 'separator'
    }, {
      id: 'clear',
      type: 'button',
      icon: 'remove',
      text: LANG['form']['toolbar']['clear']
    }]);

    // form
    const form = win.attachForm([
      { type: 'settings', position: 'label-left', labelWidth: 90, inputWidth: 250 },
      { type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
        { type: 'combo', label: LANG['form']['type'], readonly: true, name: 'type', options: [
          { text: 'MYSQL', value: 'mysql', selected: conf['type'] === 'mysql', list: [

            { type: 'settings', position: 'label-left', offsetLeft: 70, labelWidth: 90, inputWidth: 150 },
            { type: 'label', label: LANG['form']['encode'] },
            { type: 'combo', label: '', name: 'encode', options: (() => {
              let ret = [];
              ['utf8', 'big5', 'dec8', 'cp850', 'hp8', 'koi8r', 'latin1', 'latin2', 'ascii', 'euckr', 'gb2312', 'gbk'].map((_) => {
                ret.push({
                  text: _,
                  value: _,
                  selected: conf['encode'] === _
                });
              })
              return ret;
            })() }

          ] },
          { text: 'MYSQLI', value: 'mysqli', selected: conf['type'] === 'mysqli', list: [

            { type: 'settings', position: 'label-left', offsetLeft: 70, labelWidth: 90, inputWidth: 150 },
            { type: 'label', label: LANG['form']['encode'] },
            { type: 'combo', label: '', name: 'encode', options: (() => {
              let ret = [];
              ['utf8', 'big5', 'dec8', 'cp850', 'hp8', 'koi8r', 'latin1', 'latin2', 'ascii', 'euckr', 'gb2312', 'gbk'].map((_) => {
                ret.push({
                  text: _,
                  value: _,
                  selected: conf['encode'] === _
                });
              })
              return ret;
            })() }

          ] },
          { text: 'MSSQL', value: 'mssql', selected: conf['type'] === 'mssql' },
          { text: 'ORACLE', value: 'oracle', selected: conf['type'] === 'oracle' },
          { text: 'INFORMIX', value: 'informix', selected: conf['type'] === 'informix' }
        ] },
        { type: 'input', label: LANG['form']['host'], name: 'host', required: true, value: conf['host'] },
        { type: 'input', label: LANG['form']['user'], name: 'user', required: true, value: conf['user'] },
        { type: 'input', label: LANG['form']['passwd'], name: 'passwd', value: conf['passwd'] }
      ]}
    ], true);

    form.attachEvent('onChange', (_, id) => {
      if (_ !== 'type') { return };
      switch(id) {
        case 'mysql':
        case 'mysqli':
          form.setFormData({
            user: conf['user'],
            passwd: conf['passwd']
          });
          break;
        case 'mssql':
          form.setFormData({
            user: conf['user'],
            passwd: conf['passwd']
          });
          break;
        default:
          form.setFormData({
            user: conf['user'],
            passwd: conf['passwd']
          });
      }
    });

    // 工具栏点击事件
    toolbar.attachEvent('onClick', (id) => {
      switch(id) {
        case 'clear':
          form.clear();
          break;
        case 'edit':
          if (!form.validate()) {
            return toastr.warning(LANG['form']['warning'], LANG_T['warning']);
          };
          // 解析数据
          let data = form.getValues();
          // 验证是否连接成功(获取数据库列表)
          const id = antSword['ipcRenderer'].sendSync('shell-editDataConf', {
            _id: this.manager.opt['_id'],
            id: this.tree.getSelected().split('::')[1],
            data: data
          });
          win.close();
          toastr.success(LANG['form']['success'], LANG_T['success']);
          // 刷新 UI
          this.parse();
          break;
      }
    });
  }

  // 删除配置
  delConf() {
    const id = this.tree.getSelected().split('::')[1];
    layer.confirm(LANG['form']['del']['confirm'], {
      icon: 2, shift: 6,
      title: LANG['form']['del']['title']
    }, (_) => {
      layer.close(_);
      const ret = antSword['ipcRenderer'].sendSync('shell-delDataConf', {
        _id: this.manager.opt['_id'],
        id: id
      });
      if (ret === 1) {
        toastr.success(LANG['form']['del']['success'], LANG_T['success']);
        this.tree.deleteItem(`conn::${id}`);
        // 禁用按钮
        this.disableToolbar();
        this.disableEditor();
        // ['edit', 'del'].map(this.toolbar::this.toolbar.disableItem);
        // this.parse();
      }else{
        toastr.error(LANG['form']['del']['error'](ret), LANG_T['error']);
      }
    });
  }

  // 新增数据库
  addDatabase() {
    const id = this.tree.getSelected().split('::')[1].split(":")[0];
    // // 获取配置
    // const conf = antSword['ipcRenderer'].sendSync('shell-getDataConf', {
    //   _id: this.manager.opt['_id'],
    //   id: id
    // });
    const hash = (+new Date * Math.random()).toString(16).substr(2, 8);
    switch(this.dbconf['type']){
    case "mysqli":
    case "mysql":
      // 创建窗口
      const win = this.manager.win.createWindow(hash, 0, 0, 450, 200);
      win.setText("新建数据库");
      win.centerOnScreen();
      win.button('minmax').hide();
      win.setModal(true);
      win.denyResize();
      // form
      const form = win.attachForm([
        { type: 'settings', position: 'label-left', labelWidth: 90, inputWidth: 250 },
        { type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
          { type: 'input', label: "名称", name: 'dbname', value: "", required: true, validate:"ValidAplhaNumeric",},
          { type: 'combo', label: '字符集', readonly:true, name: 'characterset', options: (() => {
            let ret = [];
            Object.keys(this.mysqlcsMapping).map((_) => {
              ret.push({
                text: _,
                value: _,
              });
            })
            return ret;
          })() },
          { type: 'combo', label: '字符集排序', readonly:true, name: 'charactercollation', options: ((c)=>{
            let ret = [];
            this.mysqlcsMapping[c].map((_)=>{
              ret.push({
                text: _,
                value: _,
              });
            });
            return ret;
          })("default")},
          { type: "block", name:"btnblock", className:"display: flex;flex-direction: row;align-items: right;",offsetLeft:150, list:[
            { type:"button" , name:"createbtn", value: `<i class="fa fa-plus"></i> 创建`},
            {type: 'newcolumn', offset:20},
            { type:"button" , name:"canclebtn", value: `<i class="fa fa-ban"></i> 取消`},
          ]}
        ]}
      ], true);
      form.enableLiveValidation(true);
      // combo 联动
      form.attachEvent("onChange",(_, id)=>{
        if (_ == "characterset") {
          let collcombo = form.getCombo("charactercollation");
          collcombo.clearAll();
          collcombo.setComboValue(null);
          let ret = [];
          this.mysqlcsMapping[id].map((_)=>{
            ret.push({
              text: _,
              value: _,
            });
          });
          collcombo.addOption(ret);
          collcombo.selectOption(0);
        }
      });
      
      form.attachEvent("onButtonClick", (btnid)=>{
        switch(btnid){
        case "createbtn":
          if(form.validate()==false){break;}
          let formvals = form.getValues();
          let charset = formvals['characterset']=='default'? "": `DEFAULT CHARSET ${formvals['characterset']} COLLATE ${formvals['charactercollation']}`;
          let sql = `CREATE DATABASE IF NOT EXISTS ${formvals['dbname']} ${charset};`
          this.execSQLAsync(sql, (res, err)=>{
            if(err){
              toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
              return;
            }
            let data = res['text'];
            let arr = data.split('\n');
            if (arr.length < 2) {
              return toastr.error(LANG['result']['error']['parse'], LANG_T['error']);
            };
            if(arr[1].indexOf("VHJ1ZQ==")!= -1){
              // 操作成功
              toastr.success("创建数据库成功" ,LANG_T['success']);
              win.close();
              // refresh
              this.getDatabases(id);
              return
            }
            toastr.error("创建数据库失败", LANG_T['error']);
            return
          });
          // 创建
          break
        case "canclebtn":
          win.close();
          break;
        }
      });
      break;
    default:
      toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
      break;
    }
  }

  editDatabase() {
    // 获取配置
    const id = this.tree.getSelected().split('::')[1].split(":")[0];
    let dbname = new Buffer(this.tree.getSelected().split('::')[1].split(":")[1],"base64").toString();
    const hash = (+new Date * Math.random()).toString(16).substr(2, 8);
    switch(this.dbconf['type']){
    case "mysqli":
    case "mysql":
      let sql = `SELECT SCHEMA_NAME,DEFAULT_CHARACTER_SET_NAME,DEFAULT_COLLATION_NAME FROM \`information_schema\`.\`SCHEMATA\` where \`SCHEMA_NAME\`="${dbname}";`
      this.execSQLAsync(sql, (res, err)=>{
        if(err){
          toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
          return;
        }
        let result = this.parseResult(res['text']);
        dbname = result.datas[0][0]
        let characterset = result.datas[0][1] || "default"
        let collation = result.datas[0][2] || "default"
        // 创建窗口
        const win = this.manager.win.createWindow(hash, 0, 0, 450, 200);
        win.setText("修改数据库");
        win.centerOnScreen();
        win.button('minmax').hide();
        win.setModal(true);
        win.denyResize();
        // form
        const form = win.attachForm([
          { type: 'settings', position: 'label-left', labelWidth: 90, inputWidth: 250 },
          { type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
            { type: 'input', label: "名称", name: 'dbname', readonly: true, value: dbname, required: true, validate:"ValidAplhaNumeric",},
            { type: 'combo', label: '字符集', readonly:true, name: 'characterset', options: (() => {
              let ret = [];
              Object.keys(this.mysqlcsMapping).map((_) => {
                ret.push({
                  text: _,
                  value: _,
                });
              })
              return ret;
            })() },
            { type: 'combo', label: '字符集排序', readonly:true, name: 'charactercollation', options: ((c)=>{
              let ret = [];
              this.mysqlcsMapping[c].map((_)=>{
                ret.push({
                  text: _,
                  value: _,
                });
              });
              return ret;
            })("default")},
            { type: "block", name:"btnblock", className:"display: flex;flex-direction: row;align-items: right;",offsetLeft:150, list:[
              { type:"button" , name:"updatebtn", value: `<i class="fa fa-pen"></i> 修改`},
              {type: 'newcolumn', offset:20},
              { type:"button" , name:"canclebtn", value: `<i class="fa fa-ban"></i> 取消`},
            ]}
          ]}
        ], true);
        form.enableLiveValidation(true);
        // combo 联动
        form.attachEvent("onChange",(_, id)=>{
          if (_ == "characterset") {
            let collcombo = form.getCombo("charactercollation");
            collcombo.clearAll();
            collcombo.setComboValue(null);
            let ret = [];
            this.mysqlcsMapping[id].map((_)=>{
              ret.push({
                text: _,
                value: _,
              });
            });
            collcombo.addOption(ret);
            collcombo.selectOption(0);
          }
        });
        
        let cscombo = form.getCombo("characterset");
        cscombo.selectOption(Object.keys(this.mysqlcsMapping).indexOf(characterset));
        let collcombo = form.getCombo("charactercollation");
        collcombo.selectOption(this.mysqlcsMapping[characterset].indexOf(collation));

        form.attachEvent("onButtonClick", (btnid)=>{
          switch(btnid){
          case "updatebtn":
            if(form.validate()==false){break;}
            let formvals = form.getValues();
            let charset = formvals['characterset']=='default'? "": `DEFAULT CHARSET ${formvals['characterset']} COLLATE ${formvals['charactercollation']}`;
            let sql = `ALTER DATABASE ${dbname} ${charset};`
            this.execSQLAsync(sql, (res, err)=>{
              if(err){
                toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
                return;
              }
              let data = res['text'];
              let arr = data.split('\n');
              if (arr.length < 2) {
                return toastr.error(LANG['result']['error']['parse'], LANG_T['error']);
              };
              if(arr[1].indexOf("VHJ1ZQ==")!= -1){
                // 操作成功
                toastr.success("修改数据库成功" ,LANG_T['success']);
                win.close();
                // refresh
                this.getDatabases(id);
                return
              }
              toastr.error("修改数据库失败", LANG_T['error']);
              return
            });
            // 修改
            break
          case "canclebtn":
            win.close();
            break;
          }
        });
      });
      break;
    default:
      toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
      break;
    }
  }

  delDatabase() {
    // 获取配置
    const id = this.tree.getSelected().split('::')[1].split(":")[0];
    let dbname = new Buffer(this.tree.getSelected().split('::')[1].split(":")[1],"base64").toString();
    layer.confirm(`确定要删除数据库 ${dbname} 吗?`, {
      icon: 2, shift: 6,
      title: "警告"
    }, (_) => {
      layer.close(_);
      switch(this.dbconf['type']){
      case "mysqli":
      case "mysql":
        let sql = `drop database ${dbname};`
        this.execSQLAsync(sql, (res, err) => {
          if(err){
            toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
            return;
          }
          let result = this.parseResult(res['text']);
          if(result.datas[0][0]=='True'){
            toastr.success("删除数据库成功",LANG_T['success']);
            this.getDatabases(id);
          }else{
            toastr.error("删除数据库失败",LANG_T['error']);
          }
        });
        break;
      default:
        toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
        break;
      }
    });
  }
  
  // 新增表
  addTable() {
    // 获取配置
    const id = this.tree.getSelected().split('::')[1].split(":")[0];
    let dbname = new Buffer(this.tree.getSelected().split('::')[1].split(":")[1],"base64").toString();
    const hash = (+new Date * Math.random()).toString(16).substr(2, 8);
    switch(this.dbconf['type']){
    case "mysqli":
    case "mysql":
      let sql = `CREATE TABLE IF NOT EXISTS \`table_name\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT,
  \`title\` VARCHAR(100) NOT NULL,
  PRIMARY KEY ( \`id\` )
);`;
      this.manager.query.editor.session.setValue(sql);
      break;
    default:
      toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
      break;
    }
  }

  editTable() {
    // 获取配置
    const treeselect = this.tree.getSelected();
    const id = treeselect.split('::')[1].split(":")[0];
    let dbname = new Buffer(treeselect.split('::')[1].split(":")[1],"base64").toString();
    let tablename = new Buffer(treeselect.split('::')[1].split(":")[2],"base64").toString();
    // const hash = (+new Date * Math.random()).toString(16).substr(2, 8);
    layer.prompt({
      value: tablename,
      title: `<i class="fa fa-file-code-o"></i> 输入新表名`
    },(value, i, e) => {
      if(!value.match(/^[a-zA-Z0-9_]+$/)){
        toastr.error("表名不能带有特殊符号", LANG_T['error']);
        return
      }
      layer.close(i);
      switch(this.dbconf['type']){
        case "mysqli":
        case "mysql":
          let sql = `RENAME TABLE \`${dbname}\`.\`${tablename}\` TO \`${dbname}\`.\`${value}\`;`;
          this.execSQLAsync(sql, (res, err) => {
            if(err){
              toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
              return;
            }
            let result = this.parseResult(res['text']);
            if(result.datas[0][0]=='True'){
              toastr.success("修改表名成功",LANG_T['success']);
              this.getTables(id,dbname);
            }else{
              toastr.error("修改表名失败",LANG_T['error']);
            }
          });
          break;
        default:
          toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
          break;
      }
    });
    
  }

  delTable() {
    // 获取配置
    const treeselect = this.tree.getSelected();
    const id = treeselect.split('::')[1].split(":")[0];
    let dbname = new Buffer(treeselect.split('::')[1].split(":")[1],"base64").toString();
    let tablename = new Buffer(treeselect.split('::')[1].split(":")[2],"base64").toString();
    layer.confirm(`确定要删除表 ${tablename} 吗?`, {
      icon: 2, shift: 6,
      title: "警告"
    }, (_) => {
      layer.close(_);
      switch(this.dbconf['type']){
      case "mysqli":
      case "mysql":
        let sql = `DROP TABLE \`${dbname}\`.\`${tablename}\`;`;
        this.execSQLAsync(sql, (res, err) => {
          if(err){
            toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
            return;
          }
          let result = this.parseResult(res['text']);
          if(result.datas[0][0]=='True'){
            toastr.success("删除表成功",LANG_T['success']);
            this.getTables(id,dbname);
          }else{
            toastr.error("删除表失败",LANG_T['error']);
          }
        });
        break;
      default:
        toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
        break;
      }
    });
  }
  
  addColumn() {
    // 获取配置
    const treeselect = this.tree.getSelected();
    const id = treeselect.split('::')[1].split(":")[0];
    let dbname = new Buffer(treeselect.split('::')[1].split(":")[1],"base64").toString();
    let tablename = new Buffer(treeselect.split('::')[1].split(":")[2],"base64").toString();
    let columnname = new Buffer(treeselect.split('::')[1].split(":")[3],"base64").toString();
    
  }

  delColumn() {
    // 获取配置
    const treeselect = this.tree.getSelected();
    const id = treeselect.split('::')[1].split(":")[0];
    let dbname = new Buffer(treeselect.split('::')[1].split(":")[1],"base64").toString();
    let tablename = new Buffer(treeselect.split('::')[1].split(":")[2],"base64").toString();
    let columnname = new Buffer(treeselect.split('::')[1].split(":")[3],"base64").toString();
    layer.confirm(`确定要删除列 ${columnname} 吗?`, {
      icon: 2, shift: 6,
      title: "警告"
    }, (_) => {
      layer.close(_);
      switch(this.dbconf['type']){
      case "mysqli":
      case "mysql":
        let sql = `ALTER TABLE \`${dbname}\`.\`${tablename}\` DROP ${columnname};`;
        this.execSQLAsync(sql, (res, err) => {
          if(err){
            toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
            return;
          }
          let result = this.parseResult(res['text']);
          if(result.datas[0][0]=='True'){
            toastr.success("删除列成功",LANG_T['success']);
            this.getColumns(id,dbname, tablename);
          }else{
            toastr.error("删除列失败",LANG_T['error']);
          }
        });
        break;
      default:
        toastr.warning("该功能暂不支持该类型数据库", LANG_T['warning']);
        break;
      }
    });
  }
  // 获取数据库列表
  getDatabases(id) {
    this.manager.list.layout.progressOn();
    // 获取配置
    const conf = antSword['ipcRenderer'].sendSync('shell-getDataConf', {
      _id: this.manager.opt['_id'],
      id: id
    });
    this.core.request(
      this.core[`database_${conf['type']}`].show_databases({
        host: conf['host'],
        user: conf['user'],
        passwd: conf['passwd']
      })
    ).then((res) => {
      let ret = res['text'];
      const arr = ret.split('\t');
      if (arr.length === 1 && ret === '') {
        toastr.warning(LANG['result']['warning'], LANG_T['warning']);
        return this.manager.list.layout.progressOff();
      };
      // 删除子节点
      this.tree.deleteChildItems(`conn::${id}`);
      // 添加子节点
      arr.map((_) => {
        if (!_) { return };
        const _db = new Buffer(_).toString('base64');
        this.tree.insertNewItem(
          `conn::${id}`,
          `database::${id}:${_db}`,
          _, null,
          this.manager.list.imgs[1],
          this.manager.list.imgs[1],
          this.manager.list.imgs[1]);
      });
      this.manager.list.layout.progressOff();
    }).catch((err) => {
      toastr.error(LANG['result']['error']['database'](err['status'] || JSON.stringify(err)), LANG_T['error']);
      this.manager.list.layout.progressOff();
    });
  }

  // 获取数据库表数据
  getTables(id, db) {
    this.manager.list.layout.progressOn();
    // 获取配置
    const conf = antSword['ipcRenderer'].sendSync('shell-getDataConf', {
      _id: this.manager.opt['_id'],
      id: id
    });

    this.core.request(
      this.core[`database_${conf['type']}`].show_tables({
        host: conf['host'],
        user: conf['user'],
        passwd: conf['passwd'],
        db: db
      })
    ).then((res) => {
      let ret = res['text'];
      const arr = ret.split('\t');
      const _db = new Buffer(db).toString('base64');
      // 删除子节点
      this.tree.deleteChildItems(`database::${id}:${_db}`);
      // 添加子节点
      arr.map((_) => {
        if (!_) { return };
        const _table = new Buffer(_).toString('base64');
        this.tree.insertNewItem(
          `database::${id}:${_db}`,
          `table::${id}:${_db}:${_table}`,
          _,
          null,
          this.manager.list.imgs[2],
          this.manager.list.imgs[2],
          this.manager.list.imgs[2]
        );
      });
      this.manager.list.layout.progressOff();
    }).catch((err) => {
      toastr.error(LANG['result']['error']['table'](err['status'] || JSON.stringify(err)), LANG_T['error']);
      this.manager.list.layout.progressOff();
    });
  }

  // 获取字段
  getColumns(id, db, table) {
    this.manager.list.layout.progressOn();
    // 获取配置
    const conf = antSword['ipcRenderer'].sendSync('shell-getDataConf', {
      _id: this.manager.opt['_id'],
      id: id
    });

    this.core.request(
      this.core[`database_${conf['type']}`].show_columns({
        host: conf['host'],
        user: conf['user'],
        passwd: conf['passwd'],
        db: db,
        table: table
      })
    ).then((res) => {
      let ret = res['text'];
      const arr = ret.split('\t');
      const _db = new Buffer(db).toString('base64');
      const _table = new Buffer(table).toString('base64');
      // 删除子节点
      this.tree.deleteChildItems(`table::${id}:${_db}:${_table}`);
      // 添加子节点
      arr.map((_) => {
        if (!_) { return };
        const _column = new Buffer(_.split(' ')[0]).toString('base64');
        this.tree.insertNewItem(
          `table::${id}:${_db}:${_table}`,
          `column::${id}:${_db}:${_table}:${_column}`,
          _, null,
          this.manager.list.imgs[3],
          this.manager.list.imgs[3],
          this.manager.list.imgs[3]
        );
      });
      // 更新编辑器SQL语句
      this.manager.query.editor.session.setValue(`SELECT * FROM \`${table}\` ORDER BY 1 DESC LIMIT 0,20;`);
      this.manager.list.layout.progressOff();
    }).catch((err) => {
      toastr.error(LANG['result']['error']['column'](err['status'] || JSON.stringify(err)), LANG_T['error']);
      this.manager.list.layout.progressOff();
    });
  }

  // 执行SQL
  execSQLAsync(sql, callback) {
    this.core.request(
      this.core[`database_${this.dbconf['type']}`].query({
        host: this.dbconf['host'],
        user: this.dbconf['user'],
        passwd: this.dbconf['passwd'],
        db: this.dbconf['database'],
        sql: sql,
        encode: this.dbconf['encode'] || 'utf8'
      })
    ).then((res) => {
      callback(res, null);
    }).catch((err) => {
      callback(null, err);
    });
  }

  // 执行SQL
  execSQL(sql) {
    this.manager.query.layout.progressOn();

    this.core.request(
      this.core[`database_${this.dbconf['type']}`].query({
        host: this.dbconf['host'],
        user: this.dbconf['user'],
        passwd: this.dbconf['passwd'],
        db: this.dbconf['database'],
        sql: sql,
        encode: this.dbconf['encode'] || 'utf8'
      })
    ).then((res) => {
      let ret = res['text'];
      // 更新执行结果
      this.updateResult(ret);
      this.manager.query.layout.progressOff();
    }).catch((err) => {
      toastr.error(LANG['result']['error']['query'](err['status'] || JSON.stringify(err)), LANG_T['error']);
      this.manager.query.layout.progressOff();
    });
  }

  parseResult(data) {
    // 1.分割数组
    const arr = data.split('\n');
    // 2.判断数据
    if (arr.length < 2) {
      return toastr.error(LANG['result']['error']['parse'], LANG_T['error']);
    };
    // 3.行头
    let header_arr = arr[0].split('\t|\t');
    if (header_arr.length === 1) {
      return toastr.warning(LANG['result']['error']['noresult'], LANG_T['warning']);
    };
    if (header_arr[header_arr.length - 1] === '\r') {
      header_arr.pop();
    };
    arr.shift();
    // 4.数据
    let data_arr = [];
    arr.map((_) => {
      let _data = _.split('\t|\t');
      for (let i = 0; i < _data.length; i ++) {
      	_data[i] = antSword.noxss(new Buffer(_data[i], "base64").toString());
      }
      data_arr.push(_data);
    });
    data_arr.pop();
    return {
      headers: header_arr,
      datas: data_arr
    }
  }

  // 更新SQL执行结果
  updateResult(data) {
    // 1.分割数组
    const arr = data.split('\n');
    // 2.判断数据
    if (arr.length < 2) {
      return toastr.error(LANG['result']['error']['parse'], LANG_T['error']);
    };
    // 3.行头
    let header_arr = arr[0].split('\t|\t');
    if (header_arr.length === 1) {
      return toastr.warning(LANG['result']['error']['noresult'], LANG_T['warning']);
    };
    if (header_arr[header_arr.length - 1] === '\r') {
      header_arr.pop();
    };
    arr.shift();
    // 4.数据
    let data_arr = [];
    arr.map((_) => {
      let _data = _.split('\t|\t');
      for (let i = 0; i < _data.length; i ++) {
      	_data[i] = antSword.noxss(new Buffer(_data[i], "base64").toString());
      }
      data_arr.push(_data);
    });
    data_arr.pop();
    // 5.初始化表格
    const grid = this.manager.result.layout.attachGrid();
    grid.clearAll();
    grid.setHeader(header_arr.join(',').replace(/,$/, ''));
    grid.setColSorting(('str,'.repeat(header_arr.length)).replace(/,$/, ''));
    grid.setInitWidths('*');
    grid.setEditable(true);
    grid.init();
    // 添加数据
    let grid_data = [];
    for (let i = 0; i < data_arr.length; i ++) {
      grid_data.push({
        id: i + 1,
        data: data_arr[i]
      });
    }
    grid.parse({
      'rows': grid_data
    }, 'json');
    // 启用导出按钮
    // this.manager.result.toolbar[grid_data.length > 0 ? 'enableItem' : 'disableItem']('dump');
  }

  // 禁用toolbar按钮
  disableToolbar() {
    this.manager.list.toolbar.disableItem('del');
    this.manager.list.toolbar.disableItem('edit');
  }

  // 启用toolbar按钮
  enableToolbar() {
    this.manager.list.toolbar.enableItem('del');
    this.manager.list.toolbar.enableItem('edit');
  }

  // 禁用SQL编辑框
  disableEditor() {
    ['exec', 'clear'].map(
      this.manager.query.toolbar.disableItem.bind(this.manager.query.toolbar)
    );
    this.manager.query.editor.setReadOnly(true);
  }

  // 启用SQL编辑框
  enableEditor() {
    ['exec', 'clear'].map(
      this.manager.query.toolbar.enableItem.bind(this.manager.query.toolbar)
    );
    this.manager.query.editor.setReadOnly(false);
  }

}

module.exports = PHP;
