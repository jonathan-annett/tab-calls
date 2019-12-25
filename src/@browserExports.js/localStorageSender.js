/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/


/* global
      tmodes,
      OK,
      pathBasedSendAPI,
      isStorageSenderId,
      senderIds,
      localSenderIds,
      storageSenderIds,
      Proxy,
      classProxy,
      isSenderId,
      browserVariableProxy,
      globalsVarProxy,
      AP,
      DP,
      depricationTabIdFixup
*/

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
                    localStorage[self.id]=self_tab_mode;
                }
    
            }
    
            function onStorage(e){
                if(e.storageArea===localStorage) {
                    checkStorage();
                    checkStorageSenderChanged();
                }
            }
            
            function onBeforeUnload () {
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
            

            
            var requestInvoker =  typeof onCmdToStorage==='function' ? tabCallViaWS : tabCallViaStorage;
    
            self = pathBasedSendAPI(path_prefix,path_suffix,requestInvoker,undefined,sessionStorage.self_id);
            self_tab_mode = requestInvoker.name;
            localStorage[self.id]=self_tab_mode;
            
           
            var implementation = {
             
             tab_mode : {
                 set : function (value) {
                     self_tab_mode = value;
                 },
                 get : function () {
                     return self_tab_mode;
                 }
             },
             /*
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
             */
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
             
             globals : {
                 value : browserVariableProxy(globalsVarProxy)
             },
             
             
             //elements : { value : classProxy(self,self.id,true)},
             
             tabs : {
                 enumerable : true,
                 writable : false,
                 value : new Proxy ({},{
                       get : function (tabs,dest) {
                           dest=self.__localizeId(dest);
                           if (isSenderId(dest)) {
                                if (tabs[dest]) {
                                    return tabs[dest];
                                } else {
                                    if (localStorage[dest]) {
                                        
                                        tabs[dest]= new Proxy({
                                            globals   : browserVariableProxy(globalsVarProxy),
                                           // elements  : classProxy(self,dest,false)
                                        },{
                                            get : function (tab,nm) {
                                                if (typeof tab[nm]==='undefined') {
                                                    tab[nm]=function (){
                                                        return self.__call.apply(this,[dest,nm,!tab[nm].no_return].concat(AP.slice.call(arguments)));
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

/*included-content-ends*/

if(false)[ localStorageSender,0].splice();
