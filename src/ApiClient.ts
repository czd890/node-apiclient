import * as request from 'request';
import { CoreOptions, UrlOptions, RequestResponse } from 'request';
import * as core from "express-serve-static-core";
import * as url from 'url';
import * as localStorage from 'continuation-local-storage'
import { Options } from "./Options";
import * as uuid from 'node-uuid'
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


export class ApiClient {
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

        if (options.method === 'post') {
            if (options.headers && (options.headers['Content-Type'] == 'application/x-www-form-urlencoded' || options.headers['content-type'] == 'application/x-www-form-urlencoded')) {
                opt.form = options.data;
            }
            else if (options.headers && (options.headers['Content-Type'] == 'multipart/form-data' || options.headers['content-type'] == 'multipart/form-data')) {
                opt.formData = options.data;
            }
            else {
                if (!options.headers["Content-Type"] && !options.headers["content-type"])
                    options.headers["content-type"] = "application/json";
                opt.body = JSON.stringify(options.data);
            }
            if (options.postTimeout) opt.timeout = options.postTimeout
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
                    //TODO add log
                    return reject(error)
                }
                if (response.statusCode !== 200) {
                    let err: any = new Error("http error:" + response.statusCode);
                    err.res = response;
                    err.status = response.statusCode;
                    return reject(err);
                }
                resolve(response)
            });
        });
    }
}

export function UseApiClient(req: core.Request, res: core.Response, next: core.NextFunction | undefined) {
    let namespace = localStorage.createNamespace(localKey);
    namespace.run(() => {
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

        //res.header(TraceId, tid);
        //res.header(RequestDepth, depth);
        next && next()
    });
}