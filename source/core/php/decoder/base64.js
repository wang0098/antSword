/**
 * php::base64解码器
 * ? 利用php的base64_decode进行解码处理
 */

'use strict';

module.exports = {
  asoutput: (tag_s, tag_e) => {
    return `function asenc($out){
      return base64_encode($out);
    }
    `.replace(/\n\s+/g, '');
  },
  decode_str: (data) => {
    return Buffer.from(data, 'base64').toString();
  },
  decode_buff: (data) => {
    return Buffer.from(data.toString(), 'base64');
  }
}