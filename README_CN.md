# AntSword - 中国蚁剑
> 一剑在手，纵横无忧！

**中国蚁剑是一款开源的跨平台网站管理工具，它主要面向于合法授权的渗透测试安全人员以及进行常规操作的网站管理员。**    
**任何人不得将其用于非法用途以及盈利等目的，也禁止未经允许私自修改打包进行发布，否则后果自行承担并将追究其相关责任！**

[![node](https://img.shields.io/badge/node-4.0+-green.svg?style=flat-square)][url-nodejs-download]
[![release](https://img.shields.io/badge/release-v1.1.2-blue.svg?style=flat-square)][url-release]

[英文文档][url-docen] | [开发文档][url-document] | [CHANGELOG][url-changelog]

## 开发栈
 - [Electron][url-electron]
 - [ES6][url-es6]
 - [Webpack][url-webpack]
 - [dhtmlx][url-dhtmlx]
 - [Nodejs][url-nodejs]
 - 以及其他在项目中调用到的库

中国蚁剑推崇模块化的开发思想，遵循着**开源，就要开得漂亮**的原则，致力于为不同层次的人群提供最简单易懂、方便直接的代码展示及其修改说明，努力让大家可以一起为这个项目贡献出的力所能及的点点滴滴，让这款工具真正能让大家用得顺心、舒适，让它能为大家施展出最人性化最适合你的能力。

## 开始使用
如果你是个正常使用普通用户，不需要关心代码如何编写以及没有改动等需求，那可以进入[release][url-release]页面，选择你的系统版本进行下载对应压缩包，解压使用即可！

> **注意**: OSX因安全设置，可能在运行时提示未知开发者而无法运行，此时进入系统偏好设置->安全性与隐私->通用->允许任何来源的程序运行即可。

如果你是个喜欢编码喜欢个性化的自由主义者，那么，欢迎一起探讨学习，一起打怪升级！

### 下载源码
``` sh
$ git clone https://github.com/antoor/antSword.git
$ cd antSword
```

### 安装模块
``` sh
$ npm install
```
> 安装`electron-prebuilt`模块过程中会自动下载`electron`程序，由于网络原因下载速度可能较慢，此时不要终止结束安装，如若不小心在没下载完成之前`Ctrl+C`结束掉了安装脚本，那只需要重新卸载此模块在此安装即可。
> 如果遇到问题（国内速度慢）

  ```sh
  $ npm install -g cnpm -—registry=https://registry.npm.taobao.org
  $ cnpm install electron-prebuilt@0.36.11
  $ npm install
  ```


### 编译源码
``` sh
$ npm run build
```
> **提示**：你可以在执行编译的时候不关闭终端窗口保持监听编译进程，然后在修改源码保存后即可实时进行编译处理，此时重启应用就可以看到效果啦。

### 启动应用
``` sh
$ npm start
```
> **提示**：应用启动后，如果修改了代码并进行了编译处理，则可不必关闭应用再重新打开。    
> 直接点击菜单栏的调试->重启应用或者快捷键`Ctrl+R`刷新页面即可。

## 开发进度
当前最新版本为`1.2+`，从开源到现在前前后后修复了大量的BUG，大大提升了使用稳定性能，也逐步添加优化了多处功能。    
目前支持三大主流服务端脚本：`PHP`、`ASP`、`ASPX`以及自定义`CUSTOM`脚本，提供三大主功能操作：`文件管理`、`命令终端`、`数据库管理`。    **随着文档以及部分功能的添加，未来将会支持更多的服务端脚本以及功能模块**

## 未来展望
**目前的功能已经基本满足常规的管理操作。但是，其还远远没达到最终所希望的样子。**    
那么，未来的中国蚁剑应该长啥样呢？
 - **健全的插件中心模块（类atom插件管理）**：用户可以快速地使用我们封装好的API，编写出符合自己所需功能的大大小小插件，比如文件扫描、代码审计、漏洞修复等等；
 - **自由的扩展中心模块**：在扩展中心里，我们可以自定义给自己的程序添加各种方便的小功能，比如服务端脚本生成、文件管理功能增强、UI美化、数据导入导出备份加密等等；
 - **多种多样的支持脚本**：在web如此发达的时代，各式各样的web服务脚本如雨后春笋般涌出，nodejs、python、golang。。这些都应该用一个工具就能全部管理，那就是我们未来的**中国蚁剑**！

## 致敬感谢
> 目前版本所有的脚本代码均来源于伟大的**中国菜刀**，本人只是进行了解密以及一些改动，在此感谢作者并向其致敬！致敬每一位为网络安全做出贡献的新老前辈！    

同时，也对参与开发以及意见改进还有捐助本项目的朋友们表示感谢！    
**感谢你们一路的陪伴，才能让它有机会越走越远！**

## 开源协议
本项目遵循`MIT`开源协议，详情请查看[LICENSE](LICENSE)。

## 加入我们
> 我们欢迎对本工具有兴趣、有追求、有能力改进的人才加入，一起学习探讨深入研究！

**你可以通过下列方式加入我们**:

* Q群： [130993112](http://shang.qq.com/wpa/qunwpa?idkey=51997458a52d534454fd15e901648bf1f2ed799fde954822a595d6794eadc521)
* 官网： [http://uyu.us][url-homepage]
* 微博： [蚁逅][url-weibo]


[url-docen]: README.md
[url-changelog]: CHANGELOG.md
[url-document]: http://doc.uyu.us
[url-nodejs-download]: https://nodejs.org/en/download/
[url-release]: https://github.com/antoor/antSword/releases/tag/1.1.2
[url-electron]: http://electron.atom.io/
[url-es6]: http://es6.ruanyifeng.com/
[url-webpack]: http://webpack.github.io/
[url-dhtmlx]: http://dhtmlx.com/
[url-nodejs]: https://nodejs.org/
[url-weibo]: http://weibo.com/antoor
[url-homepage]: http://uyu.us
[url-release]: https://github.com/antoor/antSword/releases
