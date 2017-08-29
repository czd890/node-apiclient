"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var url = require("url");
// var tc = require('../lib/timeConsuming');
var ApiClient = (function () {
    function ApiClient() {
    }
    ApiClient.prototype.BuildOptions = function (options) {
        if (!options)
            options = {};
        options.method = options.method || 'get';
        options.host = options.host || '';
        options.path = options.path || '';
        options.timeout = options.timeout || 3000;
        options.postTimeout = options.postTimeout || 5000;
        options.querystring = options.querystring || '';
        options.keepAlive = options.keepAlive === false ? false : true;
        return options;
    };
    ApiClient.prototype.Get = function (host, path, params, options) {
        options = this.BuildOptions(options);
        options.host = host;
        options.path = path || options.path;
        options.querystring = params;
        options.method = 'get';
        return this.BasicRequest(options).then(function (res) {
            return res.body;
        });
    };
    ApiClient.prototype.Post = function (host, path, params, options) {
        options = this.BuildOptions(options);
        options.host = host;
        options.path = path;
        options.data = params;
        options.method = 'post';
        return this.BasicRequest(options).then(function (res) {
            return res.body;
        });
    };
    ApiClient.prototype.BasicRequest = function (options) {
        var opt = { url: '' };
        opt.timeout = options.timeout;
        opt.url = url.resolve(options.host || '', options.path || '');
        if (options.querystring) {
            opt.qs = options.querystring;
            if (opt.qs)
                opt.useQuerystring = true;
        }
        if (options.method === 'post') {
            if (options.headers && (options.headers['Content-Type'] == 'application/x-www-form-urlencoded' || options.headers['content-type'] == 'application/x-www-form-urlencoded')) {
                opt.form = options.data;
            }
            else if (options.headers && (options.headers['Content-Type'] == 'multipart/form-data' || options.headers['content-type'] == 'multipart/form-data')) {
                opt.formData = options.data;
            }
            else
                opt.body = JSON.stringify(options.data);
            if (options.postTimeout)
                opt.timeout = options.postTimeout;
        }
        return new Promise(function (resolve, reject) {
            var req = request(opt, function (error, response, body) {
                if (error) {
                    //TODO add log
                    return reject(error);
                }
                resolve(response);
            });
        });
    };
    return ApiClient;
}());
exports.ApiClient = ApiClient;
//# sourceMappingURL=ApiClient.js.map