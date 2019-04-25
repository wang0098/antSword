/**
 * php::base64解码器
 */

'use strict';

module.exports = {
  /**
   * @returns {string} asenc 将返回数据base64编码
   */
  asoutput: () => {
    return `function asenc($out){
      return @base64_encode($out);
    }
    `.replace(/\n\s+/g, '');
  },
  /**
   * 解码字符串
   * @param {string} data 要被解码的字符串
   * @returns {string} 解码后的字符串
   */
  decode_str: (data) => {
    return Buffer.from(data, 'base64').toString();
  },
  /**
   * 解码 Buffer
   * @param {string} data 要被解码的 Buffer
   * @returns {string} 解码后的 Buffer
   */
  decode_buff: (data) => {
    return Buffer.from(data.toString(), 'base64');
  }
}