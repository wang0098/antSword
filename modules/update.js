/**
 * 中国蚁剑::更新程序
 * 开写: 2016/05/31
 * 更新: 2016/06/19
 * 说明: 从2.0.0起，取消在线更新程序的方式，改为程序启动一分钟后，检测github->release最新的版本更新信息，然后提示手动更新
 */

const config = require('./config');

class Update {
  constructor(electron) {
    this.logger = new electron.Logger('Update');
    setTimeout(this.checkUpdate.bind(this), 1000 * 60);
  }

  /**
   * 检查更新
   * 如果有更新，则以通知的方式提示用户手动更新，用户点击跳转到更新页面
   * @return {[type]} [description]
   */
  checkUpdate() {
    this.logger.debug('checkUpdate..');
  }
}

module.exports = Update;
