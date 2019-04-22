/**
 * php::default解码器
 */

'use strict';

module.exports = {
  /**
   * @returns {string} asenc 加密返回数据的函数
   */
  asoutput: () => {
    return `function asenc($out){
        return $out;
      }
    `.replace(/\n\s+/g, '');
  },
  /**
   * 解码字符串
   * @param {string} data 要被解码的字符串
   * @returns {string} 解码后的字符串
   */
  decode_str: (data) => {
    return data;
  },
  /**
   * 解码 Buffer
   * @param {string} data 要被解码的 Buffer
   * @returns {string} 解码后的 Buffer
   */
  decode_buff: (data) => {
    return data;
  }
}