/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint -W030*/ // Expected an assignment or function call and instead saw an expression. (W030)

/*global
       
       jsQR_webpack,
       QRCode_lib,QRCode,Proxy,
       OK,AP,DP,
       tab_id_prefix,
       remote_tab_id_prefix,
       remote_tab_id_delim,
       pathBasedSendAPI,
       senderIds, tmodes,
       localSenderIds,
       storageSenderIds,
       currentlyDeployedVersion,
       pairingSetup,
       isStorageSenderId,
       isSenderId,
       tabsVarProxy,globalsVarProxy,
       isWebSocketId,
       webSocketIds,
       no_op,
       randomId,
       cmdIsRouted,
       cmdSourceFixup,
       HIDE,
       console_log,
       isLocalSenderId,
       keys_local_changed_f,
       localStorageSender,
       webSocketBrowserSender,
       
       tabVariables
       
*/
var globs;
       
    /*included-content-begins*/    

    function browserExports(defaultPrefix){
        
        if  (  (typeof process==='object' ) || (typeof window!=='object'  ) ||
               (!this || !this.constructor  || this.constructor.name !== 'Window') 
            ) return false;
      
        jsQR_webpack();
        QRCode_lib();
        
        var disable_browser_var_events=true;
        var zombie_suffix=".ping";     
        

        this.localStorageSender = localStorageSender;
        
        this.webSocketSender = webSocketBrowserSender;
        
        function __set_local__1(k,v,id,locs){
            locs["~"+k]=locs[k];
            locs[k]=v;
            localStorage[id] = JSON.stringify(locs);
            return v;
        }
  
        function __set_local__0(k,v,id){
          var js   = localStorage[id];
          var locs={};
          try {if (js) locs = JSON.parse(js);} catch(e){}
          return locs;
        }
        
        function set_local(k,v,id,pre){
            return __set_local__1(k,v,id,__set_local__0(k,v,id));
        }
        
        /*function set_local_legacy(k,v,id){
            var js   = localStorage[id];
            var locs={};
            try {if (js) locs = JSON.parse(js);} catch(e){}
            locs["~"+k]=locs[k];
            locs[k]=v;
            localStorage[id] = JSON.stringify(locs);
            return v;
        } */
  
        function merge_local(vs,id){
            var js   = localStorage[id];
            var locs={};
            try {if (js) locs = JSON.parse(js);} catch(e){}
            OK(vs).forEach(function(k){
              locs[k]=vs[k];
              delete locs['~'+k];
            });
            localStorage[id] = JSON.stringify(locs);
        }
        
        function get_local(k,v,id) {
            try {
              var js = localStorage[id];
              return typeof js==='string' && js.indexOf('"'+k+'"')>0 ? JSON.parse(js)[k] : v;
            } catch(e) {
              return v;                      
            }
        }
        
        function keys_local_actual_f(k){ return k.charAt(0)!=='~';}
        function keys_local_flags_f(k){ return k.charAt(0)==='~';}
        function keys_local_changed_f(k,i,a){ return k.charAt(0)!=='~' && a.contains('~'+k);}
        function keys_local_unchanged_f(k,i,a){ return k.charAt(0)!=='~' && !a.contains('~'+k);}
        
        function keys_local(id) {
            try {
              var js = localStorage[id];
              return js ? OK(JSON.parse(js)).filter(keys_local_actual_f) : [];
            } catch(e) {
              return [];                      
            }
        }
  
        
        function isSenderId(k){
            if (k.startsWith(tab_id_prefix) && !k.endsWith(zombie_suffix)) {
                return tmodes.loc_ri_ws.contains(get_local("mode",undefined,k));
            }
            if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
                return [ tmodes.remote ].contains(get_local("mode",undefined,k));
            }
            return false;
        }
  
        function senderIds(){
            return OK(localStorage).filter(isSenderId);
        }
        
       
        
        function isRemoteSenderId(k){
            if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
                return [ tmodes.remote ].contains(get_local("mode",undefined,k));
            }
            return false;
        }
        
        function remoteSenderIds(){
            return OK(localStorage).filter(isRemoteSenderId);
        }
        
        function isLocalSenderId(k){
            if (k.startsWith(tab_id_prefix) && !k.endsWith(zombie_suffix)) {
                return tmodes.loc_ri_ws.contains(get_local("mode",undefined,k));
            }
            return false;
        }
        
        function localSenderIds(){
            return OK(localStorage).filter(isLocalSenderId);
        }
        
        function tabFullId(localPrefix,k) {
            if (isLocalSenderId) return localPrefix+k;
            if (isRemoteSenderId(k)) {
                return k;
            }
        }

        function tabLocalId(localPrefix,k) {
            if (isLocalSenderId) return k;
            if (k.startsWith(localPrefix)){
                return k.substr(localPrefix.length);
            }
            if (isRemoteSenderId(k)) {
                return k;
            }
            return false;
        }
        
        function isStorageSenderId(k){
            if (k.startsWith(tab_id_prefix)&& !k.endsWith(zombie_suffix)) {
                
                return tmodes.loc_ri .contains(get_local("mode",undefined,k));
            }
            return false;
        }
        
        function storageSenderIds(){
            return OK(localStorage).filter(isStorageSenderId);
        }
        

        
        "include @browserExports.js/tabVariables.js";
        
        "include @browserExports.js/localStorageSender.js";

        "include @browserExports.js/webSocketBrowserSender.js";
        
        
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
                
                proxy_props.getOwnPropertyDescriptor = function(k) {
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
    
        
    }
