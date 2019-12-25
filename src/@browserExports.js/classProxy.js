function classProxy(api,tab_id,is_local) {

    if (is_local && typeof api.__watchElementClassName !== 'function') {
       getWatchElementClassName(api);
    }

    var 
    
    self = {
        
    },
    
    implementation = {
        
    },
    // eg sender.tabs[tab_id].elements.someId.className = "some classes";
    // eg sender.tabs[tab_id].elements.$html.className = "some classes";
    // eg sender.tabs[tab_id].elements.$body.className = "some classes";

    proxy_interface = {
        get : function getTabQuery(store,key){
            var qry = '#'+key;
            switch (key.charAt(0)) {
                case '$' : qry = key.substr(1);break;
                case '#' : qry = key;break;
                case '.' : qry = key;break;
            }
            if (typeof store[qry]==='undefined') {
                var el = [];
                Object.defineProperties(el,{
                    className : {
                        // eg console.log(sender.tabs[tab_id].elements.someId.className);
                        get : function () { return el.join (" ");},
                        
                        set : function (className) {
                            el.splice.apply(el,[0,el.length].concat(className.split(" ")));
                            // eg sender.tabs[tab_id].elements.myId.className = "some classes";
                            // results in a push to remote tab
                            api.tabs[tab_id].__setElementClassName(
                                 qry,className
                             );
                     
                        },
                        enumerable:false,
                        configurable:true
                    },
                    assign    : {
                        // internal programatic interface to update the interal value
                        value : function (value) {
                            if (typeof value==='string') value=value.split(" ");
                            el.splice.apply(el,[0,el.length].concat(value));
                        },
                        enumerable:false,
                        configurable:false
                    },
                    clear     : {
                        value : function () {
                            el.splice(0,el.length);
                            
                            // eg sender.tabs[tab_id].elements.myId.classList.clear();
                            // eg sender.tabs[tab_id].elements.myId.clear();
                            // results in a push to remote tab
                            api.tabs[tab_id].__elementClassListOp(
                                qry,"clear",0,
                                function(v) {
                                   el.splice.apply(el,[0,el.length].concat(v));
                                }
                            );
                        },
                        enumerable:false,
                        configurable:false
                    },
                    add       : {
                        value : function (cls) {
                             var ix=el.indexOf(cls);
                             if (ix<0) {
                                 el.push(cls);
                             }
                             
                             // eg sender.tabs[tab_id].elements.myId.classList.add("class");
                             // eg sender.tabs[tab_id].elements.myId.add("class");
                             // results in a push to remote tab
                             api.tabs[tab_id].__elementClassListOp(
                                 qry,"add",cls,
                                 function(v) {
                                    el.splice.apply(el,[0,el.length].concat(v));  
                                 }
                             );
                        },
                        enumerable:false,
                        configurable:false
                    },
                    remove    : {
                        value : function (cls) {
                             var ix=el.indexOf(cls);
                             if (ix>=0) {
                                 el.splice(ix,1);
                             }
                             // eg sender.tabs[tab_id].elements.myId.classList.remove("class");
                             // eg sender.tabs[tab_id].elements.myId.remove("class");
                             // results in a push to remote tab
                             api.tabs[tab_id].__elementClassListOp(
                                 qry,"remove",cls,
                                 function(v) {
                                    el.splice.apply(el,[0,el.length].concat(v));  
                                 }
                             );
                        },
                        enumerable:false,
                        configurable:false
                    },
                    contains  : {
                        value : function (cls) {
                            return el.indexOf(cls);
                        },
                        enumerable:false,
                        configurable:false
                    },
                    fetch     : {
                        value : function (what,cb) {
                             api.tabs[tab_id].__elementClassListOp(
                                 qry,"fetch",what,
                                 function(err,list) {
                                    if (err) throw err;
                                    el.splice.apply(el,[0,el.length].concat(list));
                                    if (typeof cb==='function') {
                                        if ((what||"classList")==="classList") {
                                            cb(list);
                                        } else {
                                            if (what==="className") {
                                                cb(list.split(" "));
                                            }
                                        }
                                    }
                                 }
                             );
                        },
                        enumerable:false,
                        configurable:false
                    },
                });
                
                store[qry] = new Proxy (el,{
                    
                    get : function(el,key){
                        
                        if (key==="className") {
                            return el.className;
                        } else {
                            if (key==="classList") {
                                return el;
                            }
                        }
                        
                    },
                    
                    set : function(el,key,value){
                        if (key==="className") {
                            el.className = value;
                                  return true;
                        } else {
                            
                            
                            if (key==="classList") {
                                el.assign(value);
                                // eg sender.tabs[tab_id].elements.$body.classList = ["some","classes"];
                                // results in a push to remote tab. assign won't do this
                                // so we do it here.tabs
                                api.tabs[tab_id].__elementClassListOp(
                                    qry,"set",
                                    value,
                                    function(err) {
                                        if (err) throw err;
                                    }
                                );
                                return true;
                            }
                            
                        }
                        
                    }
                    
                });
                
                api.tabs[tab_id].__watchElementClassName(qry,function (err,className){
                    el.className=className;
                });
            }
            return store[qry];
             
        },
        set : function (store,key) {
            var qry = '#'+key;
            switch (key.charAt(0)) {
                case '$' : qry = key.substr(1);break;
                case '#' : qry = key;break;
                case '.' : qry = key;break;
            }
            return false;
        }
    };
    
    Object.defineProperties(self,implementation);
    
    
    return new Proxy(self,proxy_interface);

}


function getWatchElementClassName(api) {

    var observer = new MutationObserver(observerCallback);

    var tracked   = [],
        callbacks = [];

    watchElementClassName.disconnectTab = disconnectTab;


    api.__watchElementClassName = watchElementClassName;
    api.__setElementClassName   = setElementClassName;
    api.__elementClassListOp    = elementClassListOp;
    watchElementClassName._persistent = true;
    
    return watchElementClassName;
    
    function observerCallback(mutationList) {
        mutationList.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                notifyCallbacks(mutation.target);
            }
        });
    }

    function watchElementClassName(callInfo, query, callback) {
        if (typeof callback !== 'function') return;
        if (typeof query !== 'string') return callback(new Error("query not a string:" + typeof query));
        if (typeof query.length === 0) return callback(new Error("invalid query"));

        var element = document.querySelector(query);
        if (element) {

            var cbs, ix = tracked.indexOf(element);
            if (ix < 0) {
                cbs = {};
                observer.observe(element, {
                    attributes: true
                });
                tracked.push(element);
                callbacks.push(cbs);
                watchElementDetach(element, false);

            } else {
                cbs = callbacks[ix];
            }

            cbs[callInfo.from] = callback;
            callback(undefined, element.className);
        } else {
            callback(new Error("query not found:" + query));
        }
    }
    
    function setElementClassName(callInfo, query, clsName) {
        if (typeof query !== 'string') return; 
        if (typeof query.length === 0) return;
        
        var element = document.querySelector(query);
        if (element) {
            element.className = clsName;
        }
    }
    
    function elementClassListOp(callInfo, query, op,clsName,callback) {
        if (typeof callback !== 'function') return;
        if (typeof query !== 'string') return callback(new Error("query not a string:" + typeof query));
        if (typeof query.length === 0) return callback(new Error("invalid query"));

        var element = document.querySelector(query);
        if (element) {
            if(["add","remove"].contains(op)) {
                element.classList[op](clsName);
            } else {
                if (op==="set" && typeof clsName==='object'&&clsName.constructor===Array) {
                    element.classList=clsName;
                } else {
                    if (op==="clear") {
                        element.className="";
                    }
                }
            }
            callback(undefined, Array.prototype.slice.call(element.classList,0));
        } else {
            callback(new Error("query not found:" + query));
        }
    }
    
    function notifyCallbacks(target) {
        var ix = tracked.indexOf(target);
        if (ix >= 0) {
            var value = target.className;
            callbacks[ix].keyLoop(function(tab_id, cb) {
                cb(undefined, value);
            });
        }
    }

    function disconnectTab(tab_id) {

        var done = {};

        // find each callback stack used by this tab_id
        callbacks.forEach(function(cbs, ix) {
            if (typeof cbs[tab_id] === 'object') {
                delete cbs[tab_id];
                // take a note of any callback lists with no entries left
                if (Object.keys(cbs).length === 0) {
                    done[ix.toString()] = 1;
                }
            }
        });

        // delete any callbacks and their element that are  not being watched any more
        var ixs = Object.keys(done);
        if (ixs.length > 0) {
            ixs.forEach(function(ix) {
                delete done[ix];
            });
            ixs.map(function(ix_str) {
                return Number(ix_str);
            })
                .sort()
                .reverse()
                .forEach(function(ix) {
                callbacks.splice(ix, 1);
                tracked.splice(ix, 1);
            });
        }

    }

    function onElementDetach(target, notify) {
        var ix = tracked.indexOf(target);
        if (ix >= 0) {
            var cbs = callbacks[ix];
            cbs.keyLoop(function(tab_id, cb) {
                if (notify) cb(new Error("element was removed"));
                delete cbs[tab_id];
            });
            delete callbacks[ix];
            delete tracked[ix];
        }
    }

    function watchElementDetach(element, notify) {


        var isDetached = function(el) {

            if (el.parentNode === document) {
                return false;
            } else {

                if (el.parentNode === null) {
                    return true;
                } else {
                    return isDetached(el.parentNode);
                }
            }
        };


        var observerCallback = function() {



            if (isDetached(element)) {
                observer.disconnect();
                onElementDetach(element, notify);
            }
        };

        var observer = new MutationObserver(observerCallback);

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

}

