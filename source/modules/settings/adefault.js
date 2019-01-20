/**
 * 设置中心::默认设置
 */

const LANG = antSword['language']['settings']['adefault'];
const LANG_T = antSword['language']['toastr'];

class ADefault {

  constructor(sidebar) {
    sidebar.addItem({
      id: 'adefault',
      text: `<i class="fa fa-television"></i> ${LANG['title']}`
    });
    const cell = sidebar.cells('adefault');
    const default_config = {
      filemanager: {
        openfileintab: false,
      },
    };
    // 读取配置
    const filemanager_settings = JSON.parse(antSword['storage']("adefault_filemanager", false, JSON.stringify(default_config.filemanager)));
    const toolbar = cell.attachToolbar();
    toolbar.loadStruct([
      { id: 'save', type: 'button', text: LANG['toolbar']['save'], icon: 'save' }
    ]);
    // 表单
    const form = cell.attachForm([{
      type: 'block', name: 'filemanager', list: [
        // {type: "label", label: LANG['filemanager']['title']},
        {
          type: "fieldset", label: LANG['filemanager']['title'], list:[
            { type: "block", list: [
              {type: "label", label: LANG['filemanager']['openfileintab']['title']},
              {type: 'newcolumn', offset:20},
              {
              type: "radio", label: LANG['filemanager']['openfileintab']['window'], name: 'openfileintab', checked: filemanager_settings.openfileintab == false , position: "label-right", value: false,
              },
              {type: 'newcolumn', offset:20},
              {
                type: "radio", label: LANG['filemanager']['openfileintab']['tab'], name: 'openfileintab', checked: filemanager_settings.openfileintab == true , position: "label-right", value: true,
              }
            ]},
            // 后续文件管理其它设置
          ]
        }
      ]}, 
      // 后续其它模块
    ], true);
    form.enableLiveValidation(true);
    // 保存
    toolbar.attachEvent('onClick', (id) => {
      switch(id){
        case 'save':
          if(form.validate()){
            var _formvals = form.getValues();
            let config = default_config;
            config.filemanager.openfileintab = _formvals['openfileintab'];
            
            // save
            // save 文件管理设置
            antSword['storage']('adefault_filemanager', config.filemanager);
            toastr.success(LANG['success'], LANG_T['success']);
            // 重启应用
            layer.confirm(LANG['confirm']['content'], {
              icon: 2, shift: 6,
              title: LANG['confirm']['title']
            }, (_) => {
              location.reload();
            });
          }else{
            toastr.error(LANG['error'], LANG_T['error']);
          }
        break;
      }
    });
  }

}

module.exports = ADefault;
