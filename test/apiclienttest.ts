import { ApiClient } from '../src/ApiClient';

var client = new ApiClient();
client.Get('https://www.baidu.com').then(res => {
    console.log(res)
})