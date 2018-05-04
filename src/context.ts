var assert = require('assert');
var wrapEmitter = require('emitter-listener');

/*
 *
 * CONSTANTS
 *
 */
var CONTEXTS_SYMBOL = 'cls@contexts';
var ERROR_SYMBOL = 'error@context';
var _process: any = process
// load polyfill if native support is unavailable
if (!_process.addAsyncListener) require('async-listener');

class Namespace {
    name: string;
    active: any;
    _set: Array<any>;
    id: any;
    constructor(name: string) {
        this.name = name;
        // changed in 2.7: no default context
        this.active = null;
        this._set = [];
        this.id = null;
    }
    public set(key: string, value: any) {
        if (!this.active) {
            throw new Error("No context available. ns.run() or ns.bind() must be called first.");
        }
        this.active[key] = value;
        return value;
    }

    public get(key: string) {
        if (!this.active) return undefined;

        return this.active[key];
    }

    public createContext() {
        return Object.create(this.active);
    };

    public run(callback: any) {
        var context = this.createContext();
        this.enter(context);
        // try {
        callback(context);
        return context;
        // }
        // catch (exception) {
        //   if (exception) {
        //     exception[ERROR_SYMBOL] = context;
        //   }
        //   throw exception;
        // }
        // finally {
        //   this.exit(context);
        // }
    }

    public runAndReturn(callback: any) {
        var value;
        this.run(function (context: any) {
            value = callback(context);
        });
        return value;
    }

    public bind(fn: any, context: any) {
        if (!context) {
            if (!this.active) {
                context = Object.create(this.active);
            } else {
                context = this.active;
            }
        }

        var self = this;
        return function () {
            self.enter(context);
            try {
                return fn.apply(this, arguments);
            } catch (exception) {
                if (exception) {
                    exception[ERROR_SYMBOL] = context;
                }
                throw exception;
            } finally {
                self.exit(context);
            }
        };
    }

    enter(context: any) {
        assert.ok(context, "context must be provided for entering");

        this._set.push(this.active);
        this.active = context;
    }

    exit(context: any) {
        assert.ok(context, "context must be provided for exiting");

        // Fast path for most exits that are at the top of the stack
        if (this.active === context) {
            assert.ok(this._set.length, "can't remove top context");
            this.active = this._set.pop();
            return;
        }

        // Fast search in the stack using lastIndexOf
        var index = this._set.lastIndexOf(context);

        assert.ok(index >= 0, "context not currently entered; can't exit");
        assert.ok(index, "can't remove top context");

        this._set.splice(index, 1);
    }

    bindEmitter(emitter: any) {
        assert.ok(emitter.on && emitter.addListener && emitter.emit, "can only bind real EEs");

        var namespace = this;
        var thisSymbol = 'context@' + this.name;

        // Capture the context active at the time the emitter is bound.
        function attach(listener: any) {
            if (!listener) return;
            if (!listener[CONTEXTS_SYMBOL]) listener[CONTEXTS_SYMBOL] = Object.create(null);

            listener[CONTEXTS_SYMBOL][thisSymbol] = {
                namespace: namespace,
                context: namespace.active
            };
        }

        // At emit time, bind the listener within the correct context.
        function bind(unwrapped: any) {
            if (!(unwrapped && unwrapped[CONTEXTS_SYMBOL])) return unwrapped;

            var wrapped = unwrapped;
            var contexts = unwrapped[CONTEXTS_SYMBOL];
            Object.keys(contexts).forEach(function (name) {
                var thunk = contexts[name];
                wrapped = thunk.namespace.bind(wrapped, thunk.context);
            });
            return wrapped;
        }

        wrapEmitter(emitter, attach, bind);
    }

    fromException(exception: any) {
        return exception[ERROR_SYMBOL];
    };
}

function get(name: any) {
    return _process.namespaces[name];
}

function create(name: any) {
    assert.ok(name, "namespace must be given a name!");

    var namespace = new Namespace(name);
    namespace.id = _process.addAsyncListener({
        create: function () { return namespace.active; },
        before: function (context: any, storage: any) { if (storage) namespace.enter(storage); },
        after: function (context: any, storage: any) { if (storage) namespace.exit(storage); },
        error: function (storage: any) { if (storage) namespace.exit(storage); }
    });

    _process.namespaces[name] = namespace;
    return namespace;
}

function destroy(name: any) {
    var namespace = get(name);

    assert.ok(namespace, "can't delete nonexistent namespace!");
    assert.ok(namespace.id, "don't assign to process.namespaces directly!");

    _process.removeAsyncListener(namespace.id);
    _process.namespaces[name] = null;
}

function reset() {
    // must unregister async listeners
    if (_process.namespaces) {
        Object.keys(_process.namespaces).forEach(function (name) {
            destroy(name);
        });
    }
    _process.namespaces = Object.create(null);
}
if (!_process.namespaces) reset(); // call immediately to set up

module.exports = {
    getNamespace: get,
    createNamespace: create,
    destroyNamespace: destroy,
    reset: reset
};
