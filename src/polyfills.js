    /* toJSON polyfills */
//doo
    function Error_toJSON(){
        if (!('toJSON' in Error.prototype)) {
            Object.defineProperty(Error.prototype, 'toJSON', {
                value: function () {
                    var alt = {};
            
                    Object.getOwnPropertyNames(this).forEach(function (key) {
                        alt[key] = this[key];
                    }, this);
            
                    return alt;
                },
                configurable: true,
                writable: true
            });
        }
        return true;
    }
    
    function Date_toJSON(){
        // this is NOT a polyfill in the normal sense
        // instead it installs to additional methods to Date:
        // JSON_on and JSON_off, to allow disabling the normal JSON.stringify behaviour
        // this is needed if have to use a replacer function that wishses to encode Date differnently
        // otherwise you are simply given a preencoded date as a string, and would need to parse every
        // string to determine if it was in fact a date. by deleting the toJSON method before calling 
        // JSON.stringify() you are instead presented with a normal Date instance (an Object with constructor Date)
        // this is far quicker to detect. to acheive this quickly, the original toJson prototype
        // is backed up into a defineProperties payload ready to be shimmed at will
        
        // for convenience, a JSON.stringify_dates wrapper function is added
        // to allow calling of JSON.stringify with Date.JSON_off() called first
        if (typeof JSON.stringify_dates === 'undefined') {
            Object.defineProperties(JSON,{
                stringify_dates : {
                    value : function (obj,replacer,spaces) {
                        if (typeof Date.prototype.toJSON==='undefined') {
                            // already turned off
                            return JSON.stringify(obj,replacer,spaces);
                        }    
                        try {
                            Date.JSON_off();
                            return JSON.stringify(obj,replacer,spaces); 
                        } finally {
                            Date.JSON_on();
                        } 
                    }
                }
            });
        }
        
        // we only want to invoke the following backup code once, so exit early if we
        // have called this function before.
        if (typeof Date.JSON_off==='function') return true;
        
        var restore_Date_prototype_toJSON = typeof Date.prototype.toJSON==='function' ? {
            toJSON: {
                value        : Date.prototype.toJSON,
                enumerable   : false,
                configurable : true,
                writable     : true
            }
        } : false;
        
        // note - we are extending the Date class here, not Date.prototype (ie not instances of Date but Date itself)
        Object.defineProperties(Date,{
            JSON_off : {
                enumerable   : false,
                configurable : true,
                writable     : true,
                value : function () {
                        if (restore_Date_prototype_toJSON) {
                            // we need stringify to let functionArgReplacer have the date object verbatim
                            // so delete toJSON from Date.prototype
                            delete Date.prototype.toJSON;
                        }
                    
                } 
            },
            JSON_on : {
                enumerable   : false,
                configurable : true,
                writable     : true,
                value : function () {
                        if (restore_Date_prototype_toJSON) {
                            Object.defineProperties(Date.prototype,restore_Date_prototype_toJSON);
                        }
                }
            }
        }); 
        
        return true;
    }
    
    function Object_polyfills(){
        var c=0,polyfills = {};
        if (!Object.keyCount) {
            c++;
            polyfills.keyCount = {
                enumerable:false,
                configurable:true,
                value :function(o) {
                  if (o !== Object(o))
                    throw new TypeError('Object.keyCount called on a non-object');
                  var p,c=0,isKey=Object.prototype.hasOwnProperty.bind(o);
                  for (p in o) if (isKey(p)) c++;
                  return c;
                }
            };
        }
        if (!Object.keys) {
            c++;
            polyfills.keys = {
                enumerable:false,
                configurable:true,
                value :function(o) {
                     if (o !== Object(o))
                       throw new TypeError('Object.keys called on a non-object');
                     var p,k=[],isKey=Object.prototype.hasOwnProperty.bind(o);
                     for (p in o) if (isKey(p)) k.push(p);
                     return k;
                 }
            };
        }
        if (c>0) {
            Object.defineProperties(Object,polyfills);
        }
        
        c=0;polyfills={};
        if (!Object.prototype.removeKey) {
            c++;
            polyfills.removeKey = {
                enumerable:false,
                configurable:true,
                value : function(k){
                    var res = this[k];
                    if (res!==undefined) {
                        delete this[k];
                        return res;
                    }
                }
            };
        }
        if (!Object.prototype.replaceKey) {
            c++;
            polyfills.replaceKey = {
                enumerable:false,
                configurable:true,
                value : function(k,v){
                    var res = this[k];
                    this[k]=v;
                    return res;
                }
            };
        }
        if (!Object.prototype.removeAllKeys) {
            c++;
            polyfills.removeAllKeys = {
                enumerable:false,
                configurable:true,
                value : function(){
                    var res = Object.keys(this);
                    res.forEach(function(k){
                        delete this[k];
                    });
                    return res;
                }
            };
        }
        if (!Object.prototype.mergeKeys) {
            c++;
            polyfills.mergeKeys = {
                enumerable:false,
                configurable:true,
                value : function(obj,keys,keep){
                    keys = keys||Object.keys(obj);
                    keys.forEach(function(k){
                        if (keep && this[k]!==undefined) return;
                        this[k]=obj[k];
                    });
                    return keys;
                }
            };
        }
        if (!Object.prototype.subtractKeys) {
            c++;
            polyfills.subtractKeys = {
                enumerable:false,
                configurable:true,
                value : function(keys,isObject){
                    var res={};
                    keys = isObject ? Object.keys(keys) : keys;
                    keys.forEach(function(k){
                        if (this[k]) {
                            res[k]=this[k];
                            delete this[k];
                        }
                    });
                    return res;
                }
            };
        }
        
        if (!Object.prototype.iterateKeys) {
            c++;
            polyfills.iterateKeys = {
                enumerable:false,
                configurable:true,
                value : function(fn){
                    Object.keys(this).some(function(k,i,ks){
                        try {
                            fn(k,this[k],i,ks);
                            return false;
                        } catch (e) {
                            return true;
                        }
                    });
                }
            };
        }
        
        if (c>0) {
            Object.defineProperties(Object.prototype,polyfills);
        }
        Object_polyfills.OK=Object.keys.bind(Object);
        Object_polyfills.DP=Object.defineProperties.bind(Object);
        Object_polyfills.HIDE=function (o,x,X){
              Object.defineProperty(o,x,{
                  enumerable:false,
                  configurable:true,
                  writable:false,
                  value : X
              }); 
              return X;
        };
        return {
            OK   : Object_polyfills.OK,
            DP   : Object_polyfills.DP,
            HIDE : Object_polyfills.HIDE
        };
        
    }
    
    function Array_polyfills(){
        
        var c=0,polyfills = {};
        
        if (!Array.prototype.remove) {
            c++;
            polyfills.remove = {
                enumerable:true,
                configurable:true,
                value :function(o) {
                    // remove all instances of o from the array
                    var ix;
                    while ( (ix=this.indexOf(o)) >= 0 ) {
                        this.splice(ix,1);
                    }
                }
            };
        }
        
        if (!Array.prototype.contains) {
            c++;
            polyfills.contains = {
                enumerable:true,
                configurable:true,
                value :function(o) {
                    // return true if o exists (somewhere, at least once) in the array
                    return this.lastIndexOf(o) >= 0;
                }
            };
        }
        
        if (!Array.prototype.add) {
            c++;
            polyfills.add = {
                enumerable:true,
                configurable:true,
                value :function(o) {
                    // if o does not exist in the array, add it to the end
                    if (this.indexOf(o) < 0) {
                        this.push(o);
                    }
                }
            };
        }
        
        if (!Array.prototype.toggle) {
            c++;
            polyfills.toggle = {
                enumerable:true,
                configurable:true,
                value :function(o) {
                    // if o does not exist in the array, add it to the end and return true
                    // if o exists in the array, remove ALL instances and return false
                    var ix,result = (ix=this.indexOf(o)) < 0;
                    if (result) {
                        this.push(o);
                    } else {
                        while ( ix >= 0 ) {
                            this.splice(ix,1);
                            ix=this.indexOf(o);
                        }
                    }
                    return result;
                }
            };
        }
        
        if (!Array.prototype.replace) {
            c++;
            polyfills.replace = {
                enumerable:true,
                configurable:true,
                value :function(oldValue,newValue) {
                    // replace all instances of oldValue in the array with newValue
                    if (!oldValue || oldValue===newValue) return;// idiot checks
                    
                    var ix;
                    while ( (ix=this.indexOf(oldValue)) >=0 ) {
                        this.splice(ix,1,newValue);
                    }
                }
            };
        }
        
        
        if (!Array.prototype.item) {
            c++;
            polyfills.item = {
                enumerable:true,
                configurable:true,
                value :function(ix) {
                    return this[ix];
                }
            };
        }
        
        if (c>0) {
            Object.defineProperties(Array.prototype,polyfills);
        }
        
    }
     
    function String_polyfills(){
        var c=0,polyfills = {};
        
        if (!String.prototype.contains) {
            c++;
            polyfills.contains = {
                enumerable:true,
                configurable:true,
                value :function(s) {
                    // return true if s exists (somewhere, at least once) in the string
                    return this.lastIndexOf(s) >= 0;
                }
            };
        }
        
        if (c>0) {
            Object.defineProperties(String.prototype,polyfills);
        }
    }
    
    function Proxy_polyfill(){
        /**
         * ES6 Proxy Polyfill
         * @version 1.2.1
         * @author Ambit Tsai <ambit_tsai@qq.com>
         * @license Apache-2.0
         * @see {@link https://github.com/ambit-tsai/es6-proxy-polyfill}
         */
        
        (function (context) {
            if (context.Proxy) return; // return if Proxy already exist
        
            var 
            
            noop = function () {},
            assign = Object.assign || noop,
            getProto = Object.getPrototypeOf || noop,
            setProto = Object.setPrototypeOf || noop;
        
            /**
             * Throw a type error
             * @param {String} message
             */
            function throwTypeError(message) {
                throw new TypeError(message);
            }
        
            /**
             * The internal member constructor
             * @constructor
             * @param {Function} target
             * @param {Object} handler
             */
            function InternalMember(target, handler) {
                this.target = target; // [[ProxyTarget]]
                this.handler = handler; // [[ProxyHandler]]
            }
        
            /**
             * The [[Call]] internal method
             * @param {Object} thisArg
             * @param {Object} argsList
             */
            InternalMember.prototype.$call = function (thisArg, argsList) {
                var target = this.target,
                    handler = this.handler;
                if (!handler) {
                    throwTypeError('Cannot perform \'call\' on a proxy that has been revoked');
                }
                if (handler.apply === null) {
                    return target.apply(thisArg, argsList);
                } else if (typeof handler.apply === 'function') {
                    return handler.apply(target, thisArg, argsList);
                } else {
                    throwTypeError('Proxy handler\'s apply trap must be a function');
                }
            };
        
            /**
             * The [[Construct]] internal method
             * @param {Object} thisArg
             * @param {Object} argsList
             * @returns {Object}
             */
            InternalMember.prototype.$construct = function (thisArg, argsList) {
                var target = this.target,
                    handler = this.handler,
                    result;
                if (!handler) {
                    throwTypeError('Cannot perform \'construct\' on a proxy that has been revoked');
                }
                if (handler.construct === null) {
                    result = target.apply(thisArg, argsList);
                    return result instanceof Object ? result : thisArg;
                } else if (typeof handler.construct === 'function') {
                    result = handler.construct(target, argsList);
                    if (result instanceof Object) {
                        return result;
                    } else {
                        throwTypeError('Proxy handler\'s construct trap must return an object');
                    }
                } else {
                    throwTypeError('Proxy handler\'s construct trap must be a function');
                }
            };
        
            /**
             * Create a Proxy object
             * @param {Function} target
             * @param {Object} handler
             * @param {Object} revokeResult
             * @returns {Function}
             */
            function createProxy(target, handler, revokeResult) {
                // Check the type of arguments
                if (typeof target !== 'function') {
                    throwTypeError('Proxy polyfill only support function target');
                } else if (!(handler instanceof Object)) {
                    throwTypeError('Cannot create proxy with a non-object handler');
                }
        
                // Create an internal member object
                var member = new InternalMember(target, handler);
        
                // Create a proxy object - `P`
                function P() {
                    return this instanceof P ?
                        member.$construct(this, arguments) :
                        member.$call(this, arguments);
                }
        
                assign(P, target); // copy target's properties
                P.prototype = target.prototype; // copy target's prototype
                setProto(P, getProto(target)); // copy target's [[Prototype]]
        
                if (revokeResult) {
                    // Set the revocation function
                    revokeResult.revoke = function () {
                        member.target = null;
                        member.handler = null;
                        for (var key in P) { // delete proxy's properties
                            if(P.hasOwnProperty(key)) delete P[key];
                        }
                        P.prototype = {}; // reset proxy's prototype
                        setProto(P, {}); // reset proxy's [[Prototype]]
                    };
                }
        
                return P;
            }
        
            /**
             * The Proxy constructor
             * @constructor
             * @param {Function} target
             * @param {Object} handler
             * @returns {Function}
             */
            function Proxy(target, handler) {
                if (this instanceof Proxy) {
                    return createProxy(target, handler);
                } else {
                    throwTypeError('Constructor Proxy requires \'new\'');
                }
            }
        
            /**
             * Create a revocable Proxy object
             * @param {Function} target
             * @param {Object} handler
             * @returns {{proxy, revoke}}
             */
            Proxy.revocable = function (target, handler) {
                var result = {};
                result.proxy = createProxy(target, handler, result);
                return result;
            };
        
            context.Proxy = Proxy;
        }(
            typeof window === 'object' ?
                window :
                typeof global === 'object' ? global : this // using `this` for web workers & supports Browserify / Webpack
        ));
                  
    }
