import apiClient, { UseApiClient } from '../src/Index';
import * as Bluebird from 'bluebird';

var client = apiClient;
var baiduReq = client.Get('https://www.baidu.com').then(res => {
    // console.log(res)
    return res;
})

var taobaoReq = client.Get("https://www.taobao.com");


Bluebird.props({
    baidu_res: baiduReq,
    taobao_res: taobaoReq
}).then(data => {
    console.log('baidu 返回')
    console.log(data.baidu_res)
    console.log('淘宝返回 返回')
    console.log(data.taobao_res)
})


