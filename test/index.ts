import { ApiClient } from '../src/Index'


var api = new ApiClient();

api.Get('https://www.baidu.com').then(html => { console.log(html) })

