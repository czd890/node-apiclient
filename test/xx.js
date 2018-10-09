function PromiseImpl(cb) {
    this._res;
    this._err;
    this._then_arr = [];
    this._catch_arr = [];
    cb((res) => {
        // resolve
        this._res = res;
        for (let index = 0; index < this._then_arr.length; index++) {
            const element = this._then_arr[index];
            this._res = element(this._res)
        }
    }, (err) => {
        // reject
    })
}

PromiseImpl.prototype.then = function(cb) {
    this._then_arr.push(cb);
    return this;
}
PromiseImpl.prototype.catch = function(cb) {
    this._catch_arr.push(cb);
    return this;
}

function i() {
    var p = new PromiseImpl(function(resolve, reject) {
        reject('reject');
    }).then(v => {
        console.log('s1')
    });
    return p;
}
i().catch(err => {
    console.log(err)
    return Promise.reject(err)

}).then(v => {
    console.log('s')
})

.catch(e => {
    console.log(e)
})