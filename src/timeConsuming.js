'use strict';
//var request = require('request');
var url = require('url');
var localData = {},
    PHRServer = {};
var http = require('http');

var timeConsuming = function(options) {
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime();
    this.appId = options.appId || '';
    this.host = options.host || '';
    this.port = options.port || '';
    this.path = options.path || '';
};

timeConsuming.prototype.computeTimes = function() {
    this.endTime = new Date().getTime();
    var ms = this.endTime - this.startTime;
    if (ms < 0) ms = 0;
    if (this.path && this.path[0] != '/') this.path = '/' + this.path;
    var path = this.host.replace('http://', '').replace('https://', '') + this.port + this.path;
    addRequest(path, ms);
};

//add request
var addRequest = function(path, ms) {

    if (!path || !ms) {
        console.log('invalid addRequest ->path:', path, '->ms:', ms);
        return 0;
    }

    path = path.toLowerCase();

    var msType = getTimeType(ms || 0);

    if (localData[path]) {
        if (localData[path]['PerfData']['UrlCounters'][msType]) {
            localData[path]['PerfData']['UrlCounters'][msType]['V'] += 1
        } else {
            localData[path]['PerfData']['UrlCounters'][msType] = {
                "K": msType,
                "V": 1
            }
        }
    } else {
        localData[path] = {
            "AppId": PHRServer.appId,
            "Ip": "",
            "Type": "url",
            "Counter": path,
            "PerfData": {
                "UrlCounters": {},
                "IndexId": null,
                "Date": "",
                "Time": "",
                "Value": 1
            }
        };

        localData[path]['PerfData']['UrlCounters'][msType] = {
            "K": msType,
            "V": 1
        }
    }

};

//parse localDate to serverData
var parseObject = function(localData, callback) {
    var pusDate = new Date();

    var serverData = [];

    for (var i in localData) {

        var UrlCounters = [];

        for (var t in localData[i]['PerfData']['UrlCounters']) {
            UrlCounters.push(localData[i]['PerfData']['UrlCounters'][t])
        }

        serverData.push({
            "AppId": PHRServer.appId || '',
            "Ip": "",
            "Type": "url",
            "Counter": localData[i]['Counter'] || '',
            "PerfData": {
                "UrlCounters": UrlCounters || [],
                "IndexId": null,
                //"Date": '' + pusDate.getFullYear() + pusDate.getMonth() + pusDate.getDate(),
                //"Time": '' + pusDate.getHours() + pusDate.getMinutes(),
                'Date': formatDate(pusDate, 'yyyyMMdd'),
                'Time': formatDate(pusDate, 'HHmm'),
                "Value": 1
            }
        });

    }

    callback(null, serverData);
};

//post data to monitor server
var pushServer = function() {
    if (localData && Object.keys(localData).length === 0) {
        return;
    }
    parseObject(localData, function(err, result) {
        if (err || !result) {
            console.log('time consuming parseObject ->err:', err, '->result:', result);
            return;
        }
        // request 请求
        // var host = PHRServer.host;
        // if (PHRServer.port && PHRServer.port > 0) host += ':' + PHRServer.port;
        // var reqUrl = url.resolve(host, PHRServer.path);
        // request({
        //   method: 'post',
        //   url: reqUrl,
        //   headers: {
        //     'User-Agent': 'node-perfmonHttpRequest',
        //     'Content-Type': 'application/json; charset=utf-8'
        //   },
        //   body: JSON.stringify(result)
        // }, function (error, response, body) {
        //   if (error) console.error(error);
        //   if (body) console.log('time consuming', body);
        // });
        try {
            var data = JSON.stringify(result);
        } catch (e) {
            return;
        }
        var options = {
            hostname: PHRServer.host,
            port: PHRServer.port,
            path: PHRServer.path,
            method: 'post',
            headers: {
                'User-Agent': 'node-perfmonHttpRequest',
                'Content-Type': 'application/json; charset=utf-8',
                "Content-Length": Buffer.byteLength(data, 'utf8')
            }
        };
        var req = http.request(options, function(res) {
            var body = '';
            res.setEncoding('utf8');
            res.on('data', function(data) {
                body += data
            }).on('end', function() {
                console.log('time consuming', body);
                //return body
            });
        });
        req.on('error', function(e) {
            console.error(e); //error
            return;
        });
        req.write(data + "\n");
        req.end();
    });
    localData = {};
};

//get time type from ms
var getTimeType = function(ms) {
    if (ms < 10) return 'Lt10';
    if (ms < 20) return 'Lt20';
    if (ms < 50) return 'Lt50';
    if (ms < 100) return 'Lt100';
    if (ms < 200) return 'Lt200';
    //if (ms < 300) return 'Lt300';
    if (ms < 500) return 'Lt500';
    if (ms < 1000) return 'Lt1000';
    if (ms < 2000) return 'Lt2000';
    if (ms < 3000) return 'Lt3000';
    if (ms < 5000) return 'Lt5000';
    if (ms < 10000) return 'Lt10000';
    if (ms >= 10000) return 'Gt10000';
};

//format date
var formatDate = function(date, fmt) {
    if (!date) date = new Date();
    fmt = fmt || 'yyyy-MM-dd HH:mm';
    var o = {
        'M+': date.getMonth() + 1, //月份
        'd+': date.getDate(), //日
        'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, //小时
        'H+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds(), //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        'S': date.getMilliseconds() //毫秒
    };
    var week = {
        '0': '/u65e5',
        '1': '/u4e00',
        '2': '/u4e8c',
        '3': '/u4e09',
        '4': '/u56db',
        '5': '/u4e94',
        '6': '/u516d'
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '/u661f/u671f' : '/u5468') : '') + week[date.getDay() + '']);
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
};

//timeConsuming
module.exports.timeConsuming = timeConsuming;

//set PHRServer
module.exports.setPHRServer = function(server) {
    PHRServer = {
        appId: server.appId,
        host: server.host,
        port: server.port,
        path: server.path,
        loopTime: server.loopTime
    };
    //判断host中是否包含http头
    // if (PHRServer.host) {
    //   var urlObj = url.parse(PHRServer.host);
    //   if (!urlObj.protocol) PHRServer.host = 'http://' + PHRServer.host;
    // }
    //判断配置文件是否存在
    if (!PHRServer.host || !PHRServer.path) return false;
    //定时上传接口性能
    setInterval(function() {
        try {
            pushServer();
        } catch (e) {

        }
    }, PHRServer.loopTime + 7000 || 30000);

    return true;
};