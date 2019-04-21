/**
 * php::default解码器
 */

'use strict';

module.exports = {
  asoutput: () => {
    return `function asenc($out){
        return $out;
      }
    `.replace(/\n\s+/g, '');
  },
  decode_str: (data) => {
    return data;
  },
  decode_buff: (data) => {
    return data;
  }
}