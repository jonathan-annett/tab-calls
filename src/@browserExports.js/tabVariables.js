/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint devel:true*/   
/*jshint unused:true*/

/* global Proxy  */

        /*included-content-begins*/
        
        function tabVariables(api,VARIABLES,VARIABLES_API)  {
            
            VARIABLES = VARIABLES || "variables";
            VARIABLES_API = VARIABLES_API || "_variables_api";
            
            var
            
            self_id    = api.__tabLocalId(api.id),
            self_full_id = api.__tabFullId(api.id),

            self = {
               id      : self_id,
               full_id : self_full_id,
            },
            
            the_proxy = {
               id      : self_id,
               full_id : self_full_id,
            },
            
            peers_proxy = {
                
            },
            

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
            
            peers_filter = function(id){return id!==self_id;},
            
            proxy_interface = {
                
                // eg console.log(storageSend.variables.myVar);
                get : function (tab, k) {
                    if (k==="id") return api.__tabLocalId(tab.id);
                    if (k==="full_id") return api.__tabFullId(tab.id);
                    if (k==="api") return self;
                    var id = tab.id;
                    var c = tab_cache(id),v=c[k];
                    return v;
                },
                
                has : function (tab, k) {
                    if (k==="api") return false;
                    if (k==="id"||k==="full_id") return true;
                    var c = tab_cache(tab.id);
                    return typeof c[k]!=='undefined';
                },
                
                // eg storageSend.variables.myVar = 123;
                set : function (tab,k,v) {
                    
                    if (k==="api"||k==="id"||k==="full_id") return false;
                    var payload = {
                        id:api.__tabLocalId(tab.id), 
                        full_id : api.__tabFullId(tab.id), 
                        action:"set",
                        key:k,
                        value:v};//,transmit = function(id){ api.tabs[id][VARIABLES_API](payload);};
                    
                    tab_cache(tab.id)[k]=v;
                    self.notify(v,k,payload.id,payload.full_id);
                    //api.__senderIds.filter(peers_filter).forEach(transmit);
                    
                    api.__call(api.__senderIds.filter(peers_filter),VARIABLES_API,payload);

                    
                    return true;
                },
                 
                ownKeys : function (tab) { 
                    var c = tab_cache(tab.id);
                    var ks = Object.keys(c);
                    return ["id","full_id"].concat(ks);
                }, 
                
                getOwnPropertyDescriptor : function(tab,k) {
                  
                  switch(k) {
                      case "api"      : return {enumerable: false,configurable: false};
                      case "id"       : return {value :api.__tabLocalId(tab.id), enumerable: true,configurable: true};
                      case "full_id"  : return {value :api.__tabFullId(tab.id),  enumerable: true,configurable: true};
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
                    if (k==="api"||k==="id"||k==="full_id") return;
                    
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
                
                
                full_id :  {
                    get : function () { return self_full_id; },
                    set : function () {}
                },
                // eg storageSend.variables.api.clear();
                // eg storageSend.variables.api.clear("tabx");
                clear :  {
                    enumerable: true,
                    value : function (id) {
                        id = id ? api.__tabLocalId(id) : self_id;
                        tab_cache(id,{});
                        self.notify(undefined,undefined,id,api.__tabFullId(id));
                    }
                },
                
                notify: {
                    enumerable: false,
                    value : function (value,key,id,full_id) {
                        var 
                        fire = function (value,key) {
                            if (triggers[key]) {  
                                triggers[key].forEach(function(fn){
                                    fn(value,key,id,full_id);
                                });
                            }
                        };
                        
                        if (key) {
                            fire(value,key);
                            events.change.forEach(function(fn){
                                fn(value,key,id,full_id);
                            });
                         } else {
                            var c = tab_cache(id?id:self_id);
                            var ks = Object.keys(c);
                            ks.forEach(function(k){
                                fire(c[k],k);
                            });
                            events.change.forEach(function(fn){
                                fn(undefined,undefined,id,full_id);
                            });
                        }
                    }
        
                },
                
                check_peer_values : {
                    enumerable: false,
                    value : function (/*value,key,id,full_id*/) {
                        
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
                        id = id ? api.__tabLocalId(id) : self_id;
                        tab_cache(id,JSON.parse(JSON.stringify(values)));
                        self.notify(undefined,undefined,id,api.__tabFullId(id));
                    }
                },
                
                // eg storageSend.variables.api.keys(); -- returns copy of current key names
                keys :  {
                    enumerable: true,
                    get : function (id) {
                        return Object.keys(tab_cache(id ? api.__tabLocalId(id) : self_id));
                    }
                },
                
                getProxy : {
                    value : function (id,tab,cb) {
                        var prx;
                        if (id&&id!==self_id) {
                            
                            prx = peers_proxy[id];
                            if (!prx) {
                                prx = new Proxy ({id : id}, proxy_interface);
                                tab[VARIABLES]  = prx;
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
                           prx=api[VARIABLES];  
                        }
                        
                        if (typeof cb==='function') cb(prx);
                        return prx;
                    }
                }
                
            };
            
            return init ();
        
            function init () {
                
                Object.defineProperties(self,implementation);
            
                api[VARIABLES] = new Proxy (the_proxy,proxy_interface);
                
                api[VARIABLES_API] = function (callInfo,e,cb) {
                    
                    if (typeof e!=='object' || e.key==="api") return;
                    var c,c1;
                    switch (e.action) {
                        case "set" : 
                            c = tab_cache(e.id);c1=JSON.parse(JSON.stringify(c));
                            c[e.key]=e.value;
                            self.notify(e.value,e.key,e.id,e.full_id);
                            //console.log("api:",{from:callInfo.from,cmd:e,before:c1,after:c});
                            return;
                        case "get" : 
                            c = tab_cache(e.id);
                            //console.log("api:",{cmd:e,cache:c});
                            return typeof cb === 'function' ? cb(c[e.key]) : undefined;
                        case "assign" : 
                            c = tab_cache(e.id);c1=JSON.parse(JSON.stringify(c));
                            implementation.assign.value(e.id,e.values);
                            //console.log("api:",{from:callInfo.from,cmd:e,before:c1,after:c});
                            return;
                        case "fetch" : 
                            c = tab_cache(e.id);
                            //console.log("api:",{e,c});
                            return typeof cb === 'function' ? cb(c) : undefined;
                    }
                    
                };
                
                
                var 
                
                bootstrap  = function (tab_id){
                    if (tab_id!==self_id) {
                        self.getProxy(tab_id,api.tabs[tab_id]);
                    }
                },
                
                bootstrap_tabs = function (){
                    api.__senderIds.forEach(bootstrap);
                };
                
                api.tabs[self_id][VARIABLES] = api[VARIABLES];
                
                bootstrap_tabs();
                
                api.addEventListener("change",bootstrap_tabs);
                
                return api[VARIABLES];
        
            }
            
            
        
        }
        
        
        /*included-content-ends*/
        
function get_fake_v_api (this_id,other_api,VARIABLES_API) {
    return function (e,cb) {
        return other_api[VARIABLES_API]({from:this_id},e,cb);
    };
}

var api = {
    id : "tab1",
    tabs : {
        tab1 : {},
    }
    
};

var api2 = {
    id : "tab2",
    tabs : {
        tab2 : {}
    }
    
};



Object.defineProperties(api,{

    __senderIds:{
            get : function () {
                  return Object.keys(api.tabs);
              },
            enumerable : false, configurable : true
    },
    
    __tabLocalId : {
        get : function () { return function(id){return id;};},
        set : function () {},
    },  
    
    __tabFullId : {
        get : function () { return function(id){return id;};},
        set : function (){},
    },
    
});


Object.defineProperties(api2,{

    __senderIds:{
            get : function () {
                  return Object.keys(api2.tabs);
              },
            enumerable : false, configurable : true 
    },
    
   __tabLocalId : {
       get : function () { return function(id){return id;}; },
       set : function () {},
   },  
   
   __tabFullId : {
       get : function () { return function(id){return id;};},
       set : function (){},
   },
   
});





api.variables = tabVariables(api,"variables");
api.tabs.tab2 = { _variables_api : get_fake_v_api ("tab2",api2,"_variables_api") };
api.tabs.tab3 = { _variables_api : get_fake_v_api ("tab3",api2,"_variables_api") };


api2.variables = tabVariables(api2,"variables");
api2.tabs.tab1 = { _variables_api : get_fake_v_api ("tab1",api,"_variables_api") };
api2.tabs.tab3 = { _variables_api : get_fake_v_api ("tab3",api,"_variables_api") };


api.variables.api.getProxy("tab2",api.tabs.tab2);
api.variables.api.getProxy("tab3",api.tabs.tab3);

api2.variables.api.getProxy("tab1",api2.tabs.tab1);
api2.variables.api.getProxy("tab3",api2.tabs.tab3);

api.variables.api.addTrigger("hello",function(v,k,i,f){
    console.log("hello trigger on api",{
        value:v,
        key:k,
        id:i,
        full_id:f
    });
});

api2.variables.api.addTrigger("hello",function(v,k,i,f){
    console.log("hello trigger on api2",{
        value:v,
        key:k,
        id:i,
        full_id:f
    });
});

api.variables.hello            = "hello world, i am tab 1";
api2.tabs.tab2.variables.hello = "hello world, i am tab 2";
api.tabs.tab3.variables.hello  = "hello world, i am tab 3";

api.variables.id  = "you can't do this";
api.variables.but = "you can do this";

console.log({"api.variables.hello":api.variables.hello});
console.log({"api.tabs.tab1.variables.hello":api.tabs.tab1.variables.hello});

console.log({"api.tabs.tab1.variables":api.tabs.tab1.variables});
console.log({"api.tabs.tab2.variables":api.tabs.tab2.variables});
console.log({"api.tabs.tab3.variables":api.tabs.tab3.variables});

console.log({"api.variables.api.keys":api.variables.api.keys});



console.log({"api2.variables.hello":api2.variables.hello});
console.log({"api2.tabs.tab1.variables.hello":api2.tabs.tab1.variables.hello});
console.log({"api2.tabs.tab1.variables":api2.tabs.tab1.variables});
console.log({"api2.tabs.tab2.variables":api2.tabs.tab2.variables});
console.log({"api2.tabs.tab3.variables":api2.tabs.tab3.variables});
console.log({"api2.variables.api.keys":api2.variables.api.keys});
