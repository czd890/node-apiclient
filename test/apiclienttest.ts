import apiClient, { UseApiClient } from '../src/Index';
import * as Bluebird from 'bluebird';

var client = apiClient;
var baiduReq = client.Get('https://www.baidu.com').then(res => {
    // console.log(res)
    return res;
})

var taobaoReq = client.Get("https://www.taobao.com");

var bp = client.Post('http://baidu.com', '', { a: "aa" }, { method: "Post" });

Bluebird.props({
    baidu_res: baiduReq,
    taobao_res: taobaoReq,
    bp_res: bp
}).then(data => {
    console.log('baidu 返回')
    console.log(data.baidu_res)
    console.log('淘宝返回 返回')
    console.log(data.taobao_res)
    console.log('淘宝返回 返回')
    console.log(data.bp_res)
})


