export interface Options {

    /**
     * 域名 主机
     * 
     * @type {string}
     * @memberof Options
     */
    host?: string

    /**
     * 请求路径
     * 
     * @type {string}
     * @memberof Options
     */
    path?: string

    /**
     * 请求方法 get、post
     * 
     * @type {string}
     * @memberof Options
     */
    method?: string

    /**
     * 请求header对象
     * 
     * @type {*}
     * @memberof Options
     */
    headers?: any

    /**
     * 请求querystring参数对象或字符串
     * 
     * @type {*}
     * @memberof Options
     */
    querystring?: any

    /**
     * post 数据
     * 
     * @type {*}
     * @memberof Options
     */
    data?: any

    /**
     * 超时时间，默认3s
     * 
     * @type {number}
     * @memberof Options
     */
    timeout?: number

    /**
     * 超时时间，post请求优先判断。默认5s
     * 
     * @type {number}
     * @memberof Options
     */
    postTimeout?: number

    /**
     * 是否启用keepalive，默认true
     * 
     * @type {boolean}
     * @memberof Options
     */
    keepAlive?: boolean
}