/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint devel:true*/   

/* global Proxy  */

        /*included-content-begins*/
        
        function tabVariables(api,VARIABLES,VARIABLES_API)  {
            
            VARIABLES = VARIABLES || "variables";
            VARIABLES_API = VARIABLES_API || "_variables_api";
            
            var
            
            self_id    = api.id,
            
            self_tab   = api.tabs[self_id],
            
            self = {
               id : self_id 
            },
            
            the_proxy = {
               id  : self_id,
            },
            
            peers_proxy = {
                
            },
            
            full_id = '',//device_id+"."+tab_id,
            
         
            cache        = {
                // contains local values
            },
            
            peers_cache = {
        
            },
            
            tab_cache = function (tab_id,replace) {
                if (typeof replace==='object') {
                    
                    if ( tab_id===self_id) {
                        //console.log("replacing self cache:",cache,"with",replace);
                        Object.keys(cache).forEach(function(k){delete cache[k];});
                        cache = replace;
                    } else {
                        var pc = peers_cache[tab_id];
                        if (pc) {
                            //console.log("replacing cache for peer:",tab_id,pc,"with",replace);
                        
                            Object.keys(pc).forEach(function(k){delete pc[k];});
                            delete peers_cache[tab_id];
                        } else {
                            //console.log("replacing empty cache for peer:",tab_id,"with",replace);
                        }
                        peers_cache[tab_id]=replace;
                    }
                    
                    return replace;
                    
                } else {
                
                    if (tab_id===self_id) {
                        //console.log("returning self cache:",cache);
                        return cache;
                    }
                    if (!peers_cache[tab_id]) {
                        //console.log("reseting cache for peer:",tab_id);
                        peers_cache[tab_id]={};
                    } else {
                        //console.log("returning cache for peer:",tab_id,peers_cache[tab_id]);
                    }
                    
                    return peers_cache[tab_id];
                }
            },
        
            events       = {
               change : [], // called with (k,v) for specific changes
                            // also called with no key for atomic changes
            },
            
            triggers     = {},// specific key trigger events
            proxy_interface = {
                
                // eg console.log(storageSend.variables.myVar);
                get : function (tab, k) {
                    if (k==="id") return tab.id;
                    if (k==="api") return self;
                    var id = tab.id;
                    var c = tab_cache(id),v=c[k];
                    return v;
                },
                
                has : function (tab, k) {
                    if (k==="api") return false;
                    if (k==="id") return true;
                    var c = tab_cache(tab.id);
                    return typeof c[k]!=='undefined';
                },
                
                // eg storageSend.variables.myVar = 123;
                set : function (tab,k,v) {
                    if (k==="api"||k==="id") return false;
                    tab_cache(tab.id)[k]=v;
                    self.notify(v,k,tab.id);
                    console.log("value set for '"+k+"' in",tab.id+":",JSON.stringify(v));
                    return true;
                },
                 
                ownKeys : function (tab) { 
                    var c = tab_cache(tab.id);
                    var ks = Object.keys(c);
                    return ["id"].concat(ks);
                }, 
                
                getOwnPropertyDescriptor : function(tab,k) {
                  
                  switch(k) {
                      case "api" : return {enumerable: false,configurable: false};
                      case "id"  : return {value :tab.id, enumerable: true,configurable: true};
                  }
        
                  var c = tab_cache(tab.id),v=c[k];
                  
                  if (typeof v==='undefined') return {
                      enumerable: false,
                      configurable: true,
                  };
                  
                  return {
                     value : v,
                     enumerable: true,
                     configurable: true,
                  };
        
                },
                
                deleteProperty: function(tab,k){
                    if (k==="api"||k==="id") return;
                    
                    if (tab.id===self_id) {
                        delete cache[k];
                    } else {
                        if (peers_cache[tab.id]) {
                            delete peers_cache[tab.id];
                        }
                    }
                }
            },
            
            implementation = {
                
                id :  {
                    get : function () { return self_id; },
                    set : function () {}
                },
                
                // eg storageSend.variables.api.clear();
                // eg storageSend.variables.api.clear("tabx");
                clear :  {
                    enumerable: true,
                    value : function (id) {
                        id = id || self_id;
                        tab_cache(id,{});
                        self.notify(id);
                    }
                },
                
                notify: {
                    enumerable: false,
                    value : function (id,key,value) {
                        id = id || self_id;
                        var 
                        fire = function (key,value) {
                            if (triggers[key]) {  
                                triggers[key].forEach(function(fn){
                                    fn(value,key,id);
                                });
                            }
                        };
                        
                        if (key) {
                            fire(key,value);
                            events.change.forEach(function(fn){
                                fn(value,key,id);
                            });
                         } else {
                            var c = tab_cache(id?id:self_id);
                            var ks = Object.keys(c);
                            ks.forEach(function(k){
                                fire(k,c[k]);
                            });
                            events.change.forEach(function(fn){
                                fn(undefined,undefined,id);
                            });
                        }
                    }
        
                },
                
                addEventListener : {
                    value : function (ev,fn) {
                        var handler = events[ev];
                        if (handler) {
                            handler.push(fn);
                        }
                    }
                },
                
                removeEventListener : {
                    value : function (ev,fn) {
                        var i,handler = events[ev];
                        if (handler) {
                            i = handler.indexOf(fn);
                            if (i>=0) handler.splice(i,1);
                        }
                    }
                },
                
                // eg storageSend.variables.api.addTrigger(key,fn);
                addTrigger :  {
                    enumerable: true,
                    value : function (key,fn) {
                        if (triggers[key]) 
                            triggers[key].push(fn);
                        else 
                            triggers[key]=[fn];
                    }
                },
                
                // eg storageSend.variables.api.removeTrigger(key,fn);
                // note - the fn must be the same function added using addTrigger
                removeTrigger :  {
                    enumerable: true,
                    value : function (key,fn) {
                        var trigs=triggers[key];
                        if (trigs) {
                            if (fn) {
                                var ix = trigs.indexOf(fn);
                                if (ix>=0) {
                                    trigs.splice(ix,1);
                                }
                            }
                        }
                    }
                },
                
                // eg storageSend.variables.api.removeTriggers(key); -- kils all triggers for key
                // eg storageSend.variables.api.removeTriggers(); -- kils all triggers
                removeTriggers :  {
                    enumerable: true,
                    value : function (key) {
                        var nuke = function (key) {
                            var trigs=triggers[key];
                            if (trigs) {
                                trigs.splice(0,trigs.length);
                                delete triggers[key];
                            }
                        };
                        
                        if (key) {
                            nuke(key) ;
                        } else {
                            Object.keys(triggers).forEach(nuke);
                        }
                    }
                },
                
                // eg storageSend.variables.api.assign(object); -- deep copies object into cache
                assign :  {
                    enumerable: false,
                    value : function (id,values) {
                        id = id || self_id;
                        tab_cache(id,JSON.parse(JSON.stringify(values)));
                        self.notify(id);
                    }
                },
                
                // eg storageSend.variables.api.keys(); -- returns copy of current key names
                keys :  {
                    enumerable: true,
                    get : function (id) {
                        return Object.keys(tab_cache(id || self_id));
                    }
                },
                
                getProxy : {
                    value : function (id,tab,cb) {
                        var prx;
                        if (id&&id!==self_id) {
                            
                            prx = peers_proxy[id];
                            if (!prx) {
                                prx = new Proxy ({id : id}, proxy_interface);
                                tab[VARIABLES] = prx;
                                peers_proxy[id] = prx;
                                
                                tab_cache(id,{});
                                api.tabs[id][VARIABLES_API](
                                    {id:id,action:"fetch"},function(values){
                                        implementation.assign.value(id,values);
                                        if (typeof cb==='function') cb(prx);
                                    }
                                );
                                return prx;
                            } else {
                                tab[VARIABLES] = prx;
                            }
        
                        } else {
                           prx=self_tab[VARIABLES];  
                        }
                        
                        if (typeof cb==='function') cb(prx);
                        return prx;
                    }
                }
                
            };
            
            return init ();
        
            function init () {
                
                Object.defineProperties(self,implementation);
            
                self_tab[VARIABLES] = new Proxy (the_proxy,proxy_interface);
                
                api[VARIABLES_API] = function (callInfo,e,cb) {
                    
                    if (typeof e!=='object' || e.key==="api") return;
                    var c;
                    switch (e.action) {
                        case "set" : 
                            c = tab_cache(e.id);
                            c[e.key]=e.value;
                            return;
                        case "get" : 
                            c = tab_cache(e.id);
                            return typeof cb === 'function' ? cb(c[e.key]) : undefined;
                        case "assign" : 
                            implementation.assign.value(e.id,e.values);
                            return;
                        case "fetch" : 
                            c = tab_cache(e.id);
                            return typeof cb === 'function' ? cb(c) : undefined;
                    }
                    
                };
                
                api.__senderIds().forEach(function(tab_id){
                    if (tab_id===self_id) {
                        
                    } else {
                        var tab = api.tabs[tab_id];
                        self.getProxy(tab_id,tab);
                    }
                });
                
                return self_tab[VARIABLES];
        
            }
        
        }
        
        
        /*included-content-ends*/
        
function fake_v_api (e,cb) {
    if (e.action==="fetch") {
         console.log("variables fetched for",e.id);
         return cb({});
    }
    
    throw new Error("unsupported:"+e.action+" in "+e.id);
}

var api = {
    id : "tab1",
    __senderIds : function () {
        return Object.keys(api.tabs);
    },
    tabs : {
        tab1 : {},
        tab2 : {
            _variables_api:fake_v_api
        }
    }
    
};



api.variables = tabVariables(api,"variables");

api.tabs.tab3 = { _variables_api:fake_v_api };

api.variables.api.getProxy("tab3",api.tabs.tab3);

api.variables.hello = "hello world, i am tab 1";

api.tabs.tab2.variables.hello = "hello world, i am tab 2";

api.tabs.tab3.variables.hello = "hello world, i am tab 3";

api.variables.id  = "you can't do this";
api.variables.but = "you can do this";

console.log(api.variables.hello);
console.log(api.tabs.tab1.variables.hello);

console.log(api.tabs.tab1.variables);
console.log(api.tabs.tab2.variables);
console.log(api.tabs.tab3.variables);

console.log(api.variables.api.keys);
