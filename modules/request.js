//
// Superagent发包模块
//

'use strict';

const fs = require('fs');
const through = require('through');
const log4js = require('log4js');
const iconv = require('iconv-lite');
const superagent = require('superagent');

const logger = log4js.getLogger('Request');

var aproxymode = "noproxy";
var aproxyuri = "";

class Request {

  constructor(electron) {
    // 监听请求
    const userAgent = 'antSword/1.1';
    const timeout = 5000;
    const ipcMain = electron.ipcMain;

    // 代理测试
    ipcMain.on('aproxytest', (event, opts) => {
      var _superagent = require('superagent');
      var _aproxyuri = opts['aproxyuri'];
      logger.debug("[aProxy] Test Proxy - " + _aproxyuri + " - Connect to " + opts['url']);
      require('superagent-proxy')(superagent);
      _superagent
        .get(opts['url'])
        .set('User-Agent', userAgent)
        .proxy(_aproxyuri)
        .timeout(timeout)
        .end((err, ret) => {
          if (err) {
            logger.debug("[aProxy] Test Error");
            return event.sender.send('aproxytest-error-' + opts['hash'], err);
          }else{
            logger.debug("[aProxy] Test Success");
            return event.sender.send('aproxytest-success-' + opts['hash'], ret);
          }
        });
    });
    // 加载代理设置
    ipcMain.on('aproxy', (event, opts) => {
      aproxymode = opts['aproxymode'];
      aproxyuri = opts['aproxyuri'];
      logger.debug("[aProxy] Set Proxy Mode - " + (aproxymode == "manualproxy" ? aproxyuri : " noproxy"));
      if (aproxymode == "noproxy") {
        superagent.Request.prototype.proxy=function(arg) {
          return this;
        };
      }else{
        require('superagent-proxy')(superagent);
      };
    });
    // 监听请求
    ipcMain.on('request', (event, opts) => {
      logger.debug("[aProxy] Connect mode - " + (aproxymode == "manualproxy" ? aproxyuri : " noproxy"));
      logger.debug(opts['url'] + '\n', opts['data']);
      superagent
        .post(opts['url'])
        .set('User-Agent', userAgent)
        .proxy(aproxyuri)
        .type('form')
        .timeout(timeout)
        .send(opts['data'])
        .parse((res, callback) => {
          this.parse(opts['tag_s'], opts['tag_e'], (chunk) => {
            event.sender.send('request-chunk-' + opts['hash'], chunk);
          }, res, callback);
        })
        .end((err, ret) => {
          if (err) {
            return event.sender.send('request-error-' + opts['hash'], err);
          };
          const buff = ret.body;
          // 解码
          const text = iconv.decode(buff, opts['encode']);
          // 回调数据
          event.sender.send('request-' + opts['hash'], {
            text: text,
            buff: buff
          });
        });
    });
    /**
     * 监听文件下载请求
     * - 技术实现：通过pipe进行数据流逐步解析，当遇到截断符，则标记，最后数据传输完成，利用标记点进行数据截取，最后保存。
     * @opts  {Object:path,url,data,tag_s,tag_e}
     */
    ipcMain.on('download', (event, opts) => {
      logger.debug('DOWNLOAD', opts);

      // 创建文件流
      const rs = fs.createWriteStream(opts['path']);

      let indexStart = -1;
      let indexEnd = -1;
      let tempData = [];

      // 开始HTTP请求
      superagent
        .post(opts['url'])
        .set('User-Agent', userAgent)
        .proxy(aproxyuri)
        .type('form')
        // 设置超时会导致文件过大时写入出错
        // .timeout(timeout)
        .send(opts['data'])
        .pipe(through(
          (chunk) => {
            // 判断数据流中是否包含后截断符？长度++
            let temp = chunk.indexOf(opts['tag_e']);
            if (temp !== -1) {
              indexEnd = Buffer.concat(tempData).length + temp;
            };
            tempData.push(chunk);
            event.sender.send('download-progress-' + opts['hash'], chunk.length);
          },
          () => {
            let tempDataBuffer = Buffer.concat(tempData);

            indexStart = tempDataBuffer.indexOf(opts['tag_s']) || 0;
            // 截取最后的数据
            let finalData = new Buffer(tempDataBuffer.slice(
              indexStart + opts['tag_s'].length,
              indexEnd
            ), 'binary');
            // 写入文件流&&关闭
            rs.write(finalData);
            rs.close();
            event.sender.send('download-' + opts['hash'], finalData.length);
            // 删除内存数据
            finalData = tempDataBuffer = tempData = null;
          }
        ));
    });
  }

  // 二进制数据流解析
  parse(tag_s, tag_e, chunkCallBack, res, callback) {
    // 数据转换二进制处理
    res.setEncoding('binary');
    res.data = '';
    // 2. 把分隔符转换为16进制
    const tagHexS = new Buffer(tag_s).toString('hex');
    const tagHexE = new Buffer(tag_e).toString('hex');

    let foundTagS = false;
    let foundTagE = false;
    res.on('data', (chunk) => {

      // 这样吧，我们尝试一种新的数据截取算法：
      // 1. 把数据流转换为16进制
      let chunkHex = new Buffer(chunk).toString('hex');
      // 3. 根据分隔符进行判断截断数据流
      let temp = '';
      // 如果包含前后截断，则截取中间
      if (chunkHex.indexOf(tagHexS) >= 0 && chunkHex.lastIndexOf(tagHexE) >= 0) {
        let index_s = chunkHex.indexOf(tagHexS);
        let index_e = chunkHex.lastIndexOf(tagHexE);
        temp = chunkHex.substr(index_s + tagHexS.length, index_e - index_s - tagHexE.length);
        foundTagS = foundTagE = true;
      }
      // 如果只包含前截断，则截取后边
      else if (chunkHex.indexOf(tagHexS) >= 0 && chunkHex.lastIndexOf(tagHexE) === -1) {
        temp = chunkHex.split(tagHexS)[1];
        foundTagS = true;
      }
      // 如果只包含后截断，则截取前边
      else if (chunkHex.indexOf(tagHexS) === -1 && chunkHex.lastIndexOf(tagHexE) >= 0) {
        temp = chunkHex.split(tagHexE)[0];
        foundTagE = true;
      }
      // 如果有没有，那就是中途迷路的数据啦 ^.^
      else if (foundTagS && !foundTagE) {
        temp = chunkHex;
      }
      // 4. 十六进制还原为二进制
      let finalData = new Buffer(temp, 'hex');
      // 5. 返回还原好的数据
      chunkCallBack(finalData);

      res.data += finalData;
    });
    res.on('end', () => {
      logger.info('end::size=' + res.data.length, res.data.length < 10 ? res.data : '');
      callback(null, new Buffer(res.data, 'binary'));
    });
  }

}

module.exports = Request;
