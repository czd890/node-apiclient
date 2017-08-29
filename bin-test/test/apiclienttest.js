"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ApiClient_1 = require("../src/ApiClient");
var client = new ApiClient_1.ApiClient();
client.Get('https://www.baidu.com').then(function (res) {
    console.log(res);
});
//# sourceMappingURL=apiclienttest.js.map