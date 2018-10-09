class xx {

    jumpGo() {
        var p = this.test();
        p.then(d => {
            console.log("onPay promise then", d);
        })
            // .catch(err => {
            //     console.log('onPay promise catch', err);
            // })
    }
    test2() {
        var p = this.test();
        // p.catch(err => {
        //     console.log('test2 promise catch', err)
        // })
        return p;
    }
    test() {
        var p = new Promise((resolve, reject) => {
            // wx.request({
            //     url: 'https://www.baidu.com',
            //     success() {
            //         reject("data error")
            //     }
            // })
            reject("data error")
        });

        var p2 = p.catch(err => {
            console.log('test p promise catch', err);
        })
        return p;
    }
}
var ins = new xx();
ins.jumpGo();