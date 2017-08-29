import * as request from 'request';
import { CoreOptions, UrlOptions, RequestResponse } from 'request';
import * as url from 'url';

import { Options } from "./Options";

// var tc = require('../lib/timeConsuming');


export class ApiClient {
    private BuildOptions(options?: Options): Options {
        if (!options) options = {};

        options.method = options.method || 'get';
        options.host = options.host || '';
        options.path = options.path || '';
        options.timeout = options.timeout || 3000;
        options.postTimeout = options.postTimeout || 5000;
        options.querystring = options.querystring || '';
        options.keepAlive = options.keepAlive === false ? false : true;
        return options;
    }
    Get<TData>(host: string, path?: string, params?: any, options?: Options): Promise<TData> {
        options = this.BuildOptions(options);
        options.host = host
        options.path = path || options.path
        options.querystring = params
        options.method = 'get'

        return this.BasicRequest(options).then(res => {
            return res.body
        })
    }
    Post<TData>(host: string, path: string, params?: any, options?: Options): Promise<TData> {
        options = this.BuildOptions(options);
        options.host = host
        options.path = path
        options.data = params
        options.method = 'post'

        return this.BasicRequest(options).then(res => {
            return res.body
        })
    }
    BasicRequest(options: Options): Promise<RequestResponse> {
        var opt: CoreOptions & UrlOptions = { url: '' }
        opt.timeout = options.timeout
        opt.url = url.resolve(options.host || '', options.path || '')

        if (options.querystring) {
            opt.qs = options.querystring
            if (opt.qs)
                opt.useQuerystring = true
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
            if (options.postTimeout) opt.timeout = options.postTimeout
        }
        return new Promise((resolve, reject) => {
            var req = request(opt, (error: any, response: RequestResponse, body: any) => {
                if (error) {
                    //TODO add log
                    return reject(error)
                }
                resolve(response)
            });
        });
    }
}