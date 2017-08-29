/// <reference types="request" />
import { RequestResponse } from 'request';
import { Options } from "./Options";
export declare class ApiClient {
    private BuildOptions(options?);
    Get<TData>(host: string, path?: string, params?: any, options?: Options): Promise<TData>;
    Post<TData>(host: string, path: string, params?: any, options?: Options): Promise<TData>;
    BasicRequest(options: Options): Promise<RequestResponse>;
}
