/**
 * 中国蚁剑::语言模板
 */
'use strict';

// 获取本地设置语言（如若没有，则获取浏览器语言
let lang = antSword['storage']('language',
  false,
  navigator.language
);

// 判断本地设置语言是否符合语言模板
lang = ['en', 'zh'].indexOf(lang) === -1 ? 'en' : lang;

// 返回语言模板
module.exports = require(`./${lang}`);
