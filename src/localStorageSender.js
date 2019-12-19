/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   


/*global
       OK,AP,DP,Proxy,
       
       tmodes,
       set_local,__set_local__0,__set_local__1,
       get_local,
       keys_local,
       keys_local_changed_f,
       pathBasedSendAPI,
       isStorageSenderId,
       isSenderId,senderIds,
       localSenderIds,
       storageSenderIds,
       globalsVarProxy,
       
       browserVariableProxy
       
*/
var globs;
       
    /*included-content-begins*/    


        function localStorageSender (prefix,onCmdToStorage,onCmdFromStorage) {
            // localStorageSender monitors localStorage for new keys
            // 
            var 
            self,
            path_prefix = prefix+">=>",
            path_suffix = "<=<"+prefix+".",
            path_suffix_length=path_suffix.length,
            lastIdKeys,
            self_tab_mode = tmodes.local,
            
            filterTestInternal = function(key){
                // called from array.filter to determine if the passed in key is relevant to 
                // the local object store. 
                return !!key && key.startsWith(prefix) && key.contains(filterText);
            },
            
            filterTestExternal = function(key){
                // called from array.filter to determine if the passed in key is relevant to 
                // the local object store. this version passes the key through onCmdFromStorage first
                // to determine if the key is intended for a device at the other end of a websocket 
                // or some other destination
                return filterTestInternal(onCmdFromStorage(key));
            },
            
            filterTest = typeof onCmdFromStorage==='function' ? filterTestExternal : filterTestInternal,
            
            extractKeyTimestamp = function(key){
                // called from array.map to expose the timestamp portion of a keypath
                // for sort purposes
                var ix=path_suffix_length+key.lastIndexOf(path_suffix);
                return {
                    key:key,
                    when:parseInt(key.substr(ix),36)
                };
            },
            
            sortByTimestamp = function  (a,b){
                 if (a.when<b.when) return 1;
                 if (a.when>b.when) return -1;
                 return 0;
            };
    
            function checkStorage(){
                var 
                
                currentKeys = Object.keys(localStorage),
                
                key_list = currentKeys.filter(filterTest).map(extractKeyTimestamp);
                
                key_list.sort(sortByTimestamp);
                
                key_list.forEach(function(x) {
                    localStorage.removeItem(x.key);
                    self.__input(x.key); 
                });
            }
    
            function checkStorageSenderChanged(){
                
                var currentKeys = OK(localStorage);
              
                if (!lastIdKeys) {
                    lastIdKeys = currentKeys.filter(self.__isStorageSenderId);
                    self.__on("change");
                } else {
                    var 
                    idKeys = currentKeys.filter(self.__isStorageSenderId);
                    if ( ( idKeys.length !== lastIdKeys.length) || 
                           idKeys.some(function(k){ return !lastIdKeys.contains(k);}) ||
                           lastIdKeys.some(function(k){ return !idKeys.contains(k);})
                        ){
                        lastIdKeys = idKeys;
                        self.__on("change");
                    }
                }
                if (!localStorage.getItem(self.id)) {
                    self_tab_mode = self.toString();
                    set_local("mode",self_tab_mode,self.id);
                }
    
            }
    
            function onStorage(e){
                if(e.storageArea===localStorage) {
                    checkStorage();
                    checkStorageSenderChanged();
                }
            }
            
            function onBeforeUnload (e) {
                window.removeEventListener('storage',onStorage);
                delete localStorage[self.id];
                sessionStorage.self_id=self.id;
            }
            
            function tabCallViaStorage (cmd){
                 localStorage.setItem(cmd,'');
                 checkStorage();
            }
            
            function tabCallViaWS (cmd){
                 onCmdToStorage(cmd,tabCallViaStorage);
            }
            
            function tabVarProxy (key,self_id) {
               return get_local(key,undefined,self_id);
            }

            tabVarProxy.write = function (key,value,self_id,notify,get_tab_ids,remote_notify) {
                var locs = __set_local__0(key,value,self_id);
                (tabVarProxy.write[ self_tab_mode ]||__set_local__1)(key,value,self_id,locs,notify,get_tab_ids,remote_notify);
                return true;
            };
      
            tabVarProxy.write[tmodes.ws] = function (key,value,self_id,locs,notify,get_tab_ids) {
                if (notify) {
                    
                    notify(key,value,function(){
                        
                        __set_local__1(key,value,self_id,locs);
                        
                        if (get_tab_ids) {
                            
                             var tab_ids = {
                                all : get_tab_ids()
                             };
                            
                             tab_ids.peers = tab_ids.all.filter(function(tab_id){
                                return tab_id!==self_id;
                             });
                             console.log({notify:tab_ids});
                                
                             self.__checkVariableNotifications(tab_ids);
                        }
                        
                        return true;
                    }); 
                    
                } else {
                   __set_local__1(key,value,self_id,locs);
                }
                return true;
            };
            
            tabVarProxy.write[tmodes.local] = function (key,value,self_id,locs,notify) {
                if (notify) {
                    notify(key,value,function(){
                        __set_local__1(key,value,self_id,locs);
                        return true;
                    }); 
                } else {
                   __set_local__1(key,value,self_id,locs);
                }
                return true;
            };
            
            tabVarProxy.write[tmodes.remote] = function (key,value,self_id,locs,notify) {
               if (notify) {
                   notify(key,value,function(){
                       __set_local__1(key,value,self_id,locs);
                       return true;
                   }); 
               } else {
                  __set_local__1(key,value,self_id,locs);
               }
               return true;
            };
            
      
            
            
            tabVarProxy.copy = function (self_id) {
               return JSON.parse(localStorage[self_id]);
            };
            
            tabVarProxy.assign = function (value,self_id) {
               localStorage[self_id] = JSON.stringify(value);
               return true;
            };
      
            tabVarProxy.copy_json = function (self_id) {
               return localStorage[self_id];
            };
            
            tabVarProxy.assign_json = function (json,self_id) {
               localStorage[self_id]=json;
               return true;
            };
      
            tabVarProxy.keys = function (self_id) {
                return keys_local(self_id);
            };
            
            
            
            // checkVariableNotifications() is called within the websocket owning tab
            // whcn another tab has updated a variable.
            // tab_ids.all = all tab_ids currectly in existence
            // tab_ids.peers = all tab ids besides the current id
            function checkVariableNotifications(tab_ids) {
                if (tab_ids) {
                    
                    
                    //collate a subset of all changed local data
                    var payload = {},found=false;
                    
                    tab_ids.all.forEach(function(tab_id){
                        var
                        // get the current json from storage
                        data = JSON.parse(localStorage[tab_id]),
                        // see if any keys have changed
                        changed = OK(data).filter(keys_local_changed_f);
                        if (changed.length>0){
                            found=true;
                            
                            // make a merge packet of changed data
                            payload[tab_id]={};
    
                            changed.forEach(function(k){
                                payload[tab_id][k]=data[k];
                                // nix the changed flag
                                delete data['~'+k];
                            });
                            // push back to storage
                            localStorage[tab_id]=JSON.stringify(data);
                        }
                    });
                    if (found) {
                        // we found at least 1 peer with changed data
                        // (note:peer could be this tab.)
                        
                        console.log({checkVariableNotifications:{tab_ids:tab_ids,payload:payload}});
                    
                        tab_ids.peers.forEach(function(tab_id){
                            //if (tab_ids.all.some(function(peer){
                            //    return peer != tab_id;
                            //})) {
                                self.tabs[tab_id].__notifyPeerChange(payload);
                            //} 
                        });
                    }
                }
            }
    

      
            
            
            var defaults = {
              pair_setup_title: "Pairing Setup",
              pair_sms_oneliner : "Open this link to access the app",
              pair_email_oneliner : "Open this link to access the app",
              pair_by_email : true,
              pair_by_sms : true,
              pair_by_qr : true,
              pair_by_tap : true,
              pair_default_mode : "show_qr",
              pair_sms_bottom_help : "",
              pair_email_bottom_help : "",
              pair_scan_bottom_help : "",
              pair_qr_bottom_help : "",
              
            };
            
            var requestInvoker =  typeof onCmdToStorage==='function' ? tabCallViaWS : tabCallViaStorage;
    
            self = pathBasedSendAPI(path_prefix,path_suffix,requestInvoker,undefined,sessionStorage.self_id);
            self_tab_mode = requestInvoker.name;
            set_local("mode",self_tab_mode,self.id);
            
            var implementation = {
             
             defaults : {
                 value        : defaults,
                 enumerable   : false,
                 configurable :true,
                 writable     :true
             },
             
             
             tab_mode : {
                 set : function (value) {
                     self_tab_mode = value;
                 },
                 get : function () {
                     return self_tab_mode;
                 }
             },
             
             __tabVarProxy: {
                 value : tabVarProxy,
                 enumerable: false,
                 configurable:true,
                 writable:true
             },
             
             __checkVariableNotifications: {
                 value : checkVariableNotifications,
                 enumerable: false,
                 configurable:true,
                 writable:true
             },
             
             __isStorageSenderId: {
                 value : isStorageSenderId,
                 enumerable: false,
                 configurable:true,
                 writable:true
             },
             
             __useDirectInvoker : {
                 value : function(){
                     onCmdToStorage=undefined;
                     onCmdFromStorage=undefined;
                     self.onoutput = tabCallViaStorage;
                     filterTest    = filterTestInternal;
                     requestInvoker = tabCallViaStorage;
                     //console.log("switched to useDirectInvoker()");
                 }
             },
             
             __usePassthroughInvoker : {
                 value : function(onCmdToStorage_,onCmdFromStorage_){
                     onCmdToStorage=onCmdToStorage_;
                     onCmdFromStorage=onCmdFromStorage_;
                     self.onoutput = tabCallViaWS;
                     filterTest    = filterTestExternal;
                     requestInvoker = tabCallViaWS;
                     //console.log("switched to usePassthroughInvoker()");
                 }
             },
             
             __senderIds : {
                 get : senderIds,
                 set : function(){return senderIds();},
             },
             
             __localSenderIds : {
                 get : localSenderIds,
                 set : function(){return localSenderIds();},
             },
             
             __storageSenderIds : {
                get : storageSenderIds,
                set : function(){return storageSenderIds();},
             },
             
             tabs : {
                 enumerable : true,
                 writable : false,
                 value : new Proxy ({},{
                       get : function (tabs,dest) {
                           if (isSenderId(dest)) {
                                if (tabs[dest]) {
                                    return tabs[dest];
                                } else {
                                    if (localStorage[dest]) {
                                        tabs[dest]= new Proxy({
                                            variables : browserVariableProxy(
                                                self.__tabVarProxy,
                                                dest,
                                                localStorage.WS_DeviceId+"."+dest,
                                                self.id,
                                                localSenderIds),
                                            globals   : browserVariableProxy(globalsVarProxy)
                                        },{
                                            get : function (tab,nm){
                                                if (typeof tab[nm]==='undefined') {
                                                    tab[nm]=function (){
                                                        return self.__call.apply(this,[dest,nm].concat(AP.slice.call(arguments)));
                                                    };
                                                }
                                                return tab[nm];
                                            },
                                            set : function (tab,k,v) {
                                                if (typeof v==='function') {
                                                    return false;
                                                } else { 
                                                    tab[k] = v;
                                                    return true;
                                                }
                                            }
                                        });
                                        return tabs[dest];
                                     }
                                }
                           }
                       },
                       set : function (tabs,key,value) {
                           return tabs[key];
                       },
                 })
             },
 
             __path_prefix : {
                 value : path_prefix,
                 enumerable : false,
                 writable : false
             },
             
             __path_suffix : {
                 value : path_suffix,
                 enumerable : false,
                 writable : false
             },
             
             __localStorage_setItem : { 
                 enumerable : false,
                 writable : false,
                 value : function (k,v) {
                     localStorage.setItem(k,v);
                     onStorage({storageArea:localStorage});
                 }
             },
             
             __localStorage_removeItem: { 
                  enumerable : false,
                  writable : false,
                  value : function (k) {
                     localStorage.setItem(k);
                     onStorage({storageArea:localStorage});
                  }
             },
             
             __localStorage_clear: { 
                 enumerable : false,
                 writable : false,
                 value : function () {
                     localStorage.clear();
                     onStorage({storageArea:localStorage});
                 }
             }
         };
            
            DP(self,implementation);
            
            delete sessionStorage.self_id;
    
            var filterText = '{"dest":"'+self.id+'",';
            
            window.addEventListener('storage',onStorage);                
            window.addEventListener('beforeunload',onBeforeUnload);
            window.addEventListener('unload',onBeforeUnload);
            
    
            return self;
        
        }
