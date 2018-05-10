import * as request from 'request';
import { CoreOptions, UrlOptions, RequestResponse } from 'request';
import * as core from "express-serve-static-core";
import * as url from 'url';
import { Options } from "./Options";
import * as uuid from 'node-uuid'
import { EventEmitter } from 'events';

var localStorage = require('./context')

// var tc = require('../lib/timeConsuming');

const TraceId = "X-Request-Id";
const RequestDepth = "X-Request-Depth";
const AccessToken = 'X-Request-token';
const UserId = 'X-Request-uid';
const UserTraceId = 'X-Request-utid';
const RealIp = 'X-Real-IP'
const NewDepth = () => {
    return 10;
};
const NewTraceId = () => {
    return uuid.v1()
};
const localKey = 'gd-api-client-local-storage';
const localDepthKey = 'gd-api-client-local-storage-depth';

export interface ApiClientError extends Error {
    res?: RequestResponse;
    status?: number;
    apiurl?: string | url.Url;
    apimethod?: string;
    apidata?: any;
    options?: CoreOptions & UrlOptions
}
export interface IApiClient extends ApiClient {
    emit(event: "error", error: ApiClientError): boolean;
    emit(event: "httperror", error: ApiClientError): boolean;
    emit(event: "response", options: CoreOptions & UrlOptions, response: RequestResponse, body: any): boolean;
    emit(event: "data", body: any): boolean;

    on(event: 'error', listener: (error: ApiClientError) => void): this;
    on(event: 'httperror', listener: (error: ApiClientError) => void): this;
    on(event: 'response', listener: (options: CoreOptions & UrlOptions, response: RequestResponse, body: any) => void): this;
    on(event: 'data', listener: (body: any) => void): this;
}

export class ApiClient extends EventEmitter {
    public static UserAgent: string = 'node-apiclient';

    private BuildOptions(options?: Options): Options {
        if (!options) options = {};

        options.method = options.method || 'get';
        options.host = options.host || '';
        options.path = options.path || '';
        options.timeout = options.timeout || 3000;
        options.postTimeout = options.postTimeout || 5000;
        options.querystring = options.querystring || '';
        options.headers = options.headers || {};
        options.keepAlive = options.keepAlive === false ? false : true;

        let namespace = localStorage.getNamespace('gd-api-client-local-storage');
        if (namespace) {
            if (!namespace.get(localDepthKey)) {
                namespace.set(localDepthKey, NewDepth());
            } else {
                namespace.set(localDepthKey, namespace.get(localDepthKey) + 1);
            }

            options.headers[TraceId] = namespace.get(TraceId);
            options.headers[RequestDepth] = namespace.get(RequestDepth) + ('' + namespace.get(localDepthKey))
            options.headers[UserId] = namespace.get(UserId);
            options.headers[UserTraceId] = namespace.get(UserTraceId);
            options.headers[AccessToken] = namespace.get(AccessToken);
            options.headers[RealIp] = namespace.get(RealIp);
        } else {
            options.headers[TraceId] = NewTraceId();
            options.headers[RequestDepth] = NewDepth();
        }

        return options;
    }

    private ConvertBody(res: request.RequestResponse) {
        res.emit
        const key = 'application/json';
        let header = res.headers['content-type'];
        let hasJson = false;
        if (header) {
            if (typeof header === 'string') {
                hasJson = header.indexOf(key) >= 0;
            }
        }
        if (hasJson) {
            return JSON.parse(res.body);
        } else
            return res.body;
    }

    Get<TData>(host: string, path?: string, params?: any, options?: Options): Promise<TData> {
        options = this.BuildOptions(options);
        options.host = host;
        options.path = path || options.path;
        options.querystring = params;
        options.method = 'get';

        return this.BasicRequest(options).then(res => {
            return this.ConvertBody(res)
        })
    }

    Post<TData>(host: string, path: string, params?: any, options?: Options): Promise<TData> {
        options = this.BuildOptions(options);
        options.host = host;
        options.path = path;
        options.data = params;
        options.method = 'post';

        return this.BasicRequest(options).then(res => {
            return this.ConvertBody(res)
        })
    }
    Request(host: string, path: string, params?: any, options?: Options): request.Request {
        options = this.BuildOptions(options);
        options.host = host;
        options.path = path;
        options.data = params;
        var opt = this.ConvertOptions(options);

        return request(opt);
    }

    private ConvertOptions(options: Options): CoreOptions & UrlOptions {
        let opt: CoreOptions & UrlOptions = { url: '' };
        opt.timeout = options.timeout;
        opt.method = options.method;
        opt.forever = options.keepAlive;
        opt.url = url.resolve(options.host || '', options.path || '');

        if (options.querystring) {
            opt.qs = options.querystring;
            if (opt.qs)
                opt.useQuerystring = true
        }

        if (options.method && (options.method.toLowerCase() === 'post' || options.method.toLowerCase() === 'put')) {
            var opContentType = (options.headers && (options.headers['Content-Type'] || options.headers['content-type'])) as string;

            if (opContentType && opContentType.toLowerCase().indexOf('application/x-www-form-urlencoded') === 0) {
                opt.form = options.data;
            } else if (opContentType && opContentType.toLowerCase().indexOf('multipart/form-data') === 0) {
                opt.formData = options.data;
            }
            if (!opContentType) {
                options.headers["content-type"] = "application/json";
            }
            if (options.data && (opContentType || options.headers["content-type"]).toLowerCase().indexOf('application/json') === 0) {
                opt.body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
            } else {
                opt.body = options.data
            }

            if (options.postTimeout) {
                opt.timeout = options.postTimeout
            }
        }

        if (!options.headers["user-agent"]) options.headers["user-agent"] = ApiClient.UserAgent;

        opt.headers = options.headers;

        return opt
    }
    private BasicRequest(options: Options): Promise<RequestResponse> {

        var opt = this.ConvertOptions(options);

        return new Promise((resolve, reject) => {
            let req = request(opt, (error: any, response: RequestResponse, body: any) => {
                if (error) {
                    var err: ApiClientError = error;
                    err.apiurl = opt.url;
                    err.apimethod = opt.method;
                    err.apidata = opt.body || opt.formData;
                    err.options = opt;
                    err.res = response;
                    this.emit('error', error);

                    return reject(error);
                }

                this.emit('response', opt, response, body);
                if (!response.statusCode || response.statusCode < 200 || response.statusCode > 206) {
                    let err: ApiClientError = new Error("http error:" + response.statusCode);
                    err.res = response;
                    err.status = response.statusCode;
                    err.apiurl = opt.url;
                    err.apimethod = opt.method;
                    err.apidata = body
                    this.emit('httperror', err);
                    return reject(err);
                }
                this.emit('data', body)
                resolve(response)
            });
        });
    }
}

export function UseApiClient(req: core.Request, res: core.Response, next: core.NextFunction | undefined) {
    let namespace = localStorage.createNamespace(localKey);
    namespace.run((context: any) => {
        var tid = req.header(TraceId) || NewTraceId();
        var depth: any = req.header(RequestDepth) || NewDepth();
        let _req: any = req;
        _req.UserInfo = _req.UserInfo || {};
        namespace.set(TraceId, tid);
        namespace.set(RequestDepth, depth);
        namespace.set(UserId, req.cookies['uid']);
        namespace.set(UserTraceId, req.cookies['utid']);
        namespace.set(RealIp, req.header(RealIp));

        if (_req.UserInfo.AccessToken) {
            namespace.set(AccessToken, _req.UserInfo.AccessToken);
        }
        res.on('end', () => {
            namespace.exit(context);
        })
        //res.header(TraceId, tid);
        //res.header(RequestDepth, depth);
        next && next()
    });
}