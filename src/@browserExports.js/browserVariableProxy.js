/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/

/* global
      Proxy,
      OK
*/

        function browserVariableProxy (api,self_id,full_id,tab_id,get_tab_ids) {
            var 
            
            self = {
                
            },
            events={
                 change : [],// ()
                 update : [],// sams as change, but without previous value - faster
            },
            proxy_props = {
                get : get_proxy_property,
                set : set_proxy_property
            };
            
            if (api.keys) {
                
                proxy_props.ownKeys = 
                   self_id ? function (){return api.keys(self_id);} : api.keys;
                
                proxy_props.getOwnPropertyDescriptor = function() {
                  return {
                    enumerable: true,
                    configurable: true,
                  };
                };
            }
            
            return new Proxy(self,proxy_props);

            function get_proxy_property(x,key){
                var cpy;
                switch (key) {
                    case "__keys" : return api.keys ? api.keys(self_id): [];
                    case "__object" : {
                        if (api.copy) return api.copy(self_id);
                        cpy = {};
                        if (api.keys) {
                           api.keys(self_id).forEach(function(k){
                              cpy[k]=api(k,self_id);
                           });
                        } 
                        return cpy;
                    }
                    case "__json" : {
                        if (api.copy_json) return api.copy_json(self_id);
                        
                        if (api.copy) {
                            cpy = api.copy(self_id);
                        } else {
                            cpy={};
                            if (api.keys) {
                               api.keys(self_id).forEach(function(k){
                                  cpy[k]=api(k,self_id);
                               });
                            } 
                        }
                        return JSON.stringify(cpy);
                    }
                    case "addEventListener"    : return add_ev_listener;
                    case "removeEventListener" : return remove_ev_listener;
                    case "__notifyChanges"     : return notify_changes_updates;
                }
                return api(key,self_id);
            }
            
            function add_ev_listener(e,fn) {
              if (typeof events[e]==='object') {
                  events[e].add(fn);
              }
            }
            
            function remove_ev_listener(e,fn) {
               if (typeof events[e]==='object') {
                 events[e].remove(fn);
                }
            }
            
            function notify_changes_updates(key,val,changer) {
                var 
                
                changing=events.change.length > 0,
                updating=events.update.length > 0;
             
                if (changing || updating) {
                    
                    var 
                    
                    changePayload = {
                        key:key,
                        newValue:val,
                        id:self_id,
                        full_id:full_id,
                        target:self
                    },
                    
                    notifyChanges = function (fn){
                      fn(changePayload);
                    };
    
                    if (changing) {
                        changePayload.oldValue = key ? api(key,self_id) : get_proxy_property(undefined,"__object");
                    }
                    
                    if (changer()) {
                        
                        if (changing) events.change.forEach(notifyChanges);
    
                        if (updating) {
                              if (changing) delete changePayload.oldValue;
                              events.update.forEach(notifyChanges);
                        }
                        return true;
                    }
                    return false;
                } else {
                    return changer();
                }
              }              
    
            function set_proxy_property(x,key,val){
                if (api.assign && key==="__object") {
                    return notify_changes_updates(undefined,val,function(){
                       return api.assign (val,self_id);
                    });
                }
                
                if (api.assign_json && key==="__json") {
                    return notify_changes_updates(undefined,val,function(){
                       return api.assign_json (val,self_id);
                    });
                }
                if (api.write) {
                  
                    switch (key) {
                        case "__keys" : return false;
                        case "addEventListener" : return false;
                        case "removeEventListener" : return false;
                        case "__notifyChanges" : return false;
                        case "__object" : {
                            return notify_changes_updates(undefined,val,function(){
                               OK(val).forEach(function(k){
                                   api.write (k,val[k],self_id);
                               });
                               return true;
                            });
                        }
                    }
                    
                    return api.write (
                        key,val,self_id,
                        notify_changes_updates,
                        get_tab_ids);

                }
                return false;
            }
    
        }

/*included-content-ends*/

if(false)[ browserVariableProxy,0].splice();
