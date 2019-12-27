/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/

/* global
      Proxy,
      OK,DP,
      
*/
    
/*included-content-begins*/   

        function classProxy(api,tab_id,is_local) {
        
            if (is_local && typeof api.__watchElementClassName !== 'function') {
                console.log("classProxy assigning api.__watchElementClassName");
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
                        
                        var 
                        
                        el = [],
                        events       = {
                           change : [], // called with (k,v) for specific changes
                                        // also called with no key for atomic changes
                        };
                        
                        DP(el,{
                            className : {
                                // eg console.log(sender.tabs[tab_id].elements.someId.className);
                                get : function () { return el.join (" ");},
                                
                                set : function (className) {
                                        var clsList = className.split(" ");
                                    console.log("classProxy assignment of className attribute for",qry,"in",tab_id,is_local?"(local)":"","<---",className);
                                    
                                    el.splice.apply(el,[0,el.length].concat(clsList));
                                    // eg sender.tabs[tab_id].elements.myId.className = "some classes";
                                    // results in a push to remote tab
                                    api.tabs[tab_id].__setElementClassName(
                                         qry,className
                                    );
                                    
                                    events.change.forEach(function(fn){
                                         console.log("invoking change event[set]:",typeof fn,qry);
                                         fn(clsList,className,qry,"set");
                                    });
                             
                                },
                                enumerable:false,
                                configurable:true
                            },
                            assign    : {
                                // internal programatic interface to update the interal value
                                value : function (value) {
                                    var clsNm = value;
                                    
                                    if (typeof value==='string') {
                                        value=value.split(" ");
                                    } else {
                                        clsNm=value.join(" ");
                                    }
                                    
                                    console.log("classProxy assign() invoked for",qry,"in",tab_id,is_local?"(local)":"","<---",value);
                                    
                                    el.splice.apply(el,[0,el.length].concat(value));
                                    events.change.forEach(function(fn){
                                        console.log("invoking change event[assign]:",typeof fn,qry);
                                        fn(value,clsNm,qry,"assign");
                                    });
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
                                    console.log("classProxy clear() invoked for",qry,"in",tab_id,is_local?"(local)":"");
                                    
                                    api.tabs[tab_id].__elementClassListOp(
                                        qry,"clear",0,
                                        function(err,value) {
                                           if (err) throw err;
                                           el.splice.apply(el,[0,el.length].concat(value));
                                        }
                                    );
                                    events.change.forEach(function(fn){
                                        console.log("invoking change event[clear]:",typeof fn,qry);
                                        
                                        fn([],'',qry,"clear");
                                    });
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
                                     
                                     console.log("classProxy add() invoked for",qry,"in",tab_id,is_local?"(local)":"","adding:",cls);
                                    
                                     api.tabs[tab_id].__elementClassListOp(
                                         qry,"add",cls,
                                         function(err,value) {
                                             if (err) throw err;
                                             el.splice.apply(el,[0,el.length].concat(value));  
                                             var clsNm = value.join(' ');
                                             events.change.forEach(function(fn){
                                                 console.log("invoking change event[add]:",typeof fn,qry);
                                        
                                                 fn(value,clsNm,qry,"add",cls);
                                             });
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
                                     
                                     console.log("classProxy remove() invoked for",qry,"in",tab_id,is_local?"(local)":"","remove:",cls);
                                    
                                     api.tabs[tab_id].__elementClassListOp(
                                         qry,"remove",cls,
                                         function(err,value) {
                                            if (err) throw err;
                                            el.splice.apply(el,[0,el.length].concat(value));
                                            var clsNm = value.join(' ');
                                            events.change.forEach(function(fn){
                                                console.log("invoking change event[remove]:",typeof fn,qry);
                                                fn(value,clsNm,qry,"remove");
                                            });
                                         }
                                     );
                                },
                                enumerable:false,
                                configurable:false
                            },
                            contains  : {
                                value : function (cls) {
                                    return el.indexOf(cls)>=0;
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
                            addEventListener : {
                                value : function (ev,single,fn) {
                                    if (typeof single==='function') {
                                        fn=single;
                                        single=false;
                                    }
                                    var handler = events[ev];
                                    if (handler) {
                                        if (single) {
                                            var c = handler.length;
                                            if (c>0) {
                                                handler.splice(0,c);
                                                console.log("removed",c,qry,ev,"events");
                                            }
                                        }
                                        handler.push(fn);
                                        console.log("added",qry,ev,typeof fn);
                                    }
                                },
                                enumerable:false,
                                configurable:false
                            },
                            removeEventListener : {
                                value : function (ev,fn) {
                                    var i,handler = events[ev];
                                    if (handler) {
                                        if (fn===undefined) {
                                            var c = handler.length;
                                            if (c>0) {
                                                handler.splice(0,c); 
                                                console.log("removed",c,qry,ev,"events"); 
                                            } 
                                        } else {
                                            i = handler.indexOf(fn);
                                            if (i>=0) {
                                                handler.splice(i,1);
                                                console.log("removed",qry,ev,typeof fn);
                                            }
                                        }
                                    }
                                }
                            },
                        });
                        
                        store[qry] = new Proxy (el,{
                            
                            get : function(el,key){
                                switch(key) {
                                    case "className" : return el.className;
                                    case "classList" : return el;
                                    case "add"       : return el.add;
                                    case "remove"    : return el.remove;
                                    case "contains"  : return el.contains;
                                    case "fetch"     : return el.fetch;
                                }
                            },
                            
                            set : function(el,key,value){
                                if (key==="className") {
                                    
                                    console.log("classProxy direct assignment of className attribute for",qry,"in",tab_id,is_local?"(local)":"","<---",value);
                                    el.className = value;
                                          return true;
                                } else {
                                    
                                    
                                    if (key==="classList") {
                                        el.assign(value);
                                        // eg sender.tabs[tab_id].elements.$body.classList = ["some","classes"];
                                        // results in a push to remote tab. assign won't do this
                                        // so we do it here.tabs
                                        console.log("classProxy direct assignment of classList attribute for",qry,"in",tab_id,is_local?"(local)":"","<---",value);
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
                            if (err) {
                                delete store[qry];
                                console.log("__watchElementClassName:error --->",err);
                                return;
                            }
                            console.log("classProxy updating classname for",qry,"in",tab_id,is_local?"(local)":"","<---",className);

                            el.className=className;
                        });
                        
                        console.log("classProxy created classname proxy object for ",qry,"in",tab_id,is_local?"(local)":"");
                    }
                    return store[qry];
                     
                },
                set : function (store,key,value) {
                    var qry = '#'+key;
                    switch (key.charAt(0)) {
                        case '$' : qry = key.substr(1);break;
                        case '#' : qry = key;break;
                        case '.' : qry = key;break;
                    }
                    
                    console.log("classProxy ignoring classname assignment for ",qry,"in",tab_id,is_local?"(local)":"");
            
                    return false;
                }
            };
            
            DP(self,implementation);
            
            console.log("classProxy returning new proxy object for ",tab_id,is_local?"(local)":"");
                
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
                if (typeof callback !== 'function') {
                    console.log("watchElementClassName invoked without a callback - got (",typeof callInfo, ",",typeof query,",",typeof callback ,")");
                    return;
                }
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
                        if (OK(cbs).length === 0) {
                            done[ix.toString()] = 1;
                        }
                    }
                });
        
                // delete any callbacks and their element that are  not being watched any more
                var ixs = OK(done);
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
        
        
        
        

/*included-content-ends*/

if(false)[ classProxy,0].splice();
