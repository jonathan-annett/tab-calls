/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   

/*global
       
       jsQR_webpack,
       QRCode_lib,QRCode,
       Proxy,
       OK,
       set_local,get_local,
       pathBasedSendAPI,
       senderIds, 
       localSenderIds,
       storageSenderIds,
       currentlyDeployedVersion,
       DP,
       isStorageSenderId,
       isSenderId,
       tabsVarProxy,globalsVarProxy,
       AP,
       isWebSocketId,
       webSocketIds,
       no_op,
       randomId,
       cmdIsRouted,
       cmdSourceFixup,
       HIDE,tab_id_prefix,
       console_log,
       isLocalSenderId,
       keys_local_changed_f
*/
var globs;
       
/*included-content-begins*/
       
    function browserExports(defaultPrefix){
        
        if  (  (typeof process==='object' ) || (typeof window!=='object'  ) ||
               (!this || !this.constructor  || this.constructor.name !== 'Window') 
            ) return false;
      
        jsQR_webpack();
        QRCode_lib();

        this.localStorageSender = localStorageSender;
        
        this.webSocketSender = webSocketBrowserSender;
    
        function getParameterByName(name, url) {
              if (!url) url = window.location.href;
              name = name.replace(/[\[\]]/g, '\\$&');
              var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                  results = regex.exec(url);
              if (!results) return null;
              if (!results[2]) return '';
              return decodeURIComponent(results[2].replace(/\+/g, ' '));
          }
    
        function getSecret () {
           try {
             var b64 = getParameterByName("pair");
             if (b64) {
               
                if (b64.length===32) {
                      localStorage.WS_Secret = b64;
                      localStorage.new_WS_Secret = true;
                      window.location.replace(window.location.href.split("?")[0]);
                  } else {
                    
                    var json = atob(b64);
                    if (json) {
    
    
                        var data = JSON.parse(json);
    
                        if (data && data.secret) {
                            localStorage.WS_Secret = data.secret;
                            localStorage.new_WS_Secret = true;
                            window.location.replace(window.location.href.split("?")[0]);
                        }
    
    
                    }
                  }
             }
           } catch(e) {
             
           }
           return localStorage.WS_Secret;
        }
        
        function loadFileContents(filename,cb) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var txt = this.responseText;
                    return window.setTimeout(cb,10,undefined,txt);
                }
                
                if (this.readyState == 4 && this.status != 200 && this.status !== 0) {
                    return cb ({code:this.status});
                }
            };
            xhttp.open("GET", filename, true);
            xhttp.send();
        }
    
        function localStorageSender (prefix,onCmdToStorage,onCmdFromStorage) {
            // localStorageSender monitors localStorage for new keys
            // 
            var 
            self,
            path_prefix = prefix+">=>",
            path_suffix = "<=<"+prefix+".",
            path_suffix_length=path_suffix.length,
            lastIdKeys,
            
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
                    set_local("mode",self.toString(),self.id);
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
            set_local("mode",requestInvoker.name,self.id);
            
            DP(self,{
                
                defaults : {
                    value        : defaults,
                    enumerable   : false,
                    configurable :true,
                    writable     :true
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
                                               variables : browserVariableProxy(tabsVarProxy,dest,localStorage.WS_DeviceId+"."+dest),
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
                                               set : function () {
                                                   return false;
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
            });
            
            
            delete sessionStorage.self_id;
    
            var filterText = '{"dest":"'+self.id+'",';
            
            window.addEventListener('storage',onStorage);                
            window.addEventListener('beforeunload',onBeforeUnload);
            window.addEventListener('unload',onBeforeUnload);
            
    
            return self;
        
        }
            
        function webSocketBrowserSender(prefix,firstTimeout,maxTimeout) {
            var 
            
            tabcalls_version=false,
            checkVersion=function(ver,msg) {
               if (tabcalls_version!==ver) {
                   tabcalls_version = ver;
                   assign("tab-calls.version",ver);
                   assign("tab-calls.version.msg",msg);
                   if (currentlyDeployedVersion!==ver) {
                      document.body.classList.add("update_ready");
                   }
               }
               function assign(id,txt) {
                  var el = document.getElementById(id);
                  if (el) el[el.nodeName==="INPUT"?"value":"innerHTML"]=txt;  
               }
            },
            path_prefix,path_suffix, 
            is_websocket_sender = (webSocketIds().length===0),
            reconnect_timeout,
            reconnect_fuzz,
            reconnect_timer,
            clear_reconnect_timeout=!!firstTimeout ? function(){
                reconnect_timer = undefined;
                reconnect_fuzz = 50 + Math.floor((Math.random() * 100));
                reconnect_timeout=firstTimeout;
            } : function(){},
            backlog=[],
            WS_Secret,
            socket_send,     // exposes socket.send() 
            //WS_DeviceId,   // the deviceId of tabs on this device,
            routedDeviceIds, // an array of deviceIds that can be routed to via websocket
            lastSenderIds,
            zombie,
            
            
            
            ws_triggers = {
    
            },
            
            non_ws_triggers = {
             
            },
            
            ws_nonws_triggers = {
              "appGlobals"  : onStorage_appGlobals,
              "WS_Secret"   : onStorage_WS_Secret,
              "WS_DeviceId" : onStorage_WS_DeviceId,
            },
    
            writeToStorageFunc = function(){};
            
            
            clear_reconnect_timeout();
            
            var 
            self = is_websocket_sender ? localStorageSender(prefix,onCmdToStorage,onCmdFromStorage)
                                       : localStorageSender(prefix);
                                       
                                       
            path_prefix = self.__path_prefix;
            
            path_suffix = self.__path_suffix;
            
            
            
            DP(self,{
                
                __isStorageSenderId: {
                    value : isSenderId,
                    enumerable: false,
                    configurable:true,
                    writable:true
                },
                
                webSocketIds : {
                    get : webSocketIds,
                    set : function(){return webSocketIds();},
                },
                
                WS_DeviceId : {
                    get : function () {
                        return localStorage.WS_DeviceId;
                    },
                    set : function () {
                        return localStorage.WS_DeviceId;
                    }
                },
               
                // startPair() is invoked from UI to add the local device to pair_sessions on server
                // when the user selects the showTap screen and it starts showing passcode segments
                // every 5 seconds 
                // user then taps those segments into the remote device in a timely fashion
                // once 8 sucessive segments are received with no mistakes, the devices are deemed paired
                // will take 8 x 5 = 40 seconds for user to complete paring, assuming no mistakes are made
                // note (the passcode is not sent to the server, and is used once during the pairing proccess only)
                // once paired, the devices exchange the shared secret via the server where it is not store but passed
                // directly from websocket to websocket (using wss secure connection)
                // the user could also just manually type the secret directly into one of the devices
                // or use the qrcode and camera to exchange the shared secret
                // the "secret" is not used to encrypt the data, but simply to separately pair devices
                
                startPair : {
                    
                    value : function (localName) {
                        if (socket_send) {
                            socket_send(JSON.stringify({startPair:true,tabs:localSenderIds(),name:localName}));
                        }
                    }    
                    
                },
                
                // doPair() is invoked from UI to tap another part of the passcode for pairing evaluation
                doPair : {
                    
                    value : function (c) {
                        if (socket_send) {
                            socket_send(JSON.stringify({doPair:c,tabs:localSenderIds()}));
                        }
                    }    
                    
                },
                // endPair() is invoked from UI when local device decides the passcode submitted is sufficent to prove pairing
                // OR when user navigates off the showTap screen
                endPair : {
                    
                    value : function (id,secret,name) {
                        if (socket_send) {
                            socket_send(JSON.stringify({endPair:id||null,secret:secret,tabs:localSenderIds(),name:name}));
                        }
                    }    
                    
                },
                
                // newSecret() is invoked from UI when user chooses a new random Secret OR a qr code has been scanned 
                newSecret : {
                    
                    value : function (secret,reason) {
                        if (socket_send) {
                            socket_send(JSON.stringify({WS_Secret:secret,tabs:localSenderIds(),notify:reason}));
                        }
                    }    
                    
                },
                
                pairingSetup : {
                    
                    value : pairingSetup
                },
                
                globals : {
                    value : browserVariableProxy(globalsVarProxy)
                },
                variables : {
                    value : browserVariableProxy(tabsVarProxy,self.id,localStorage.WS_DeviceId+"."+self.id)
                }
                
                /*
                ondopair : {
                   set : function (fn) {
                       if (typeof fn==='function') {
                           onDoPair=fn;
                       } else {
                           onDoPair=function(){};
                       }
                   },
                   get : function () {
                       return onDoPair;
                   }
                }*/
    
            });
            
            
            self.__on_events.dopair = 
            self.__on_events.newsecret = no_op;
            
            // connect() is called once to try to connect the first time
            // and any number of times if the connection is closed/errored
            function connect(){
                
                var 
                
                protocol = location.protocol==='https:' ? 'wss:' : 'ws:',
                
                socket = new WebSocket(protocol+'//'+location.host+'/'),
    
                reconnect = function (){
                    if (reconnect_timer) window.clearTimeout(reconnect_timer);
                    backlog = backlog || [];
                    socket_send = undefined;
                    if (!firstTimeout) {
                        connect();
                    } else {
                        // double the last reconnect_timeout and add/subtract a random number of milliseconds
                        // this is to randomly distribute mass reconnect attempts in the event
                        // of large numbers of sockets dropping at once for some reason
                        // while still providing a quick reconnect in normal use
                        // note that the first random reconnect_fuzz will be a small positve number
                        // (set on a sucessful connect) while subsequent reconnect_fuzz values will
                        // be slightly larger negative values
                        reconnect_timer = window.setTimeout(connect,Math.min(maxTimeout,(reconnect_timeout+=reconnect_timeout))+reconnect_fuzz);
                        reconnect_fuzz  = Math.floor(Math.random() * 400)-500;/// between -500 and -100
                    }
                },
    
                onClose = function(event) {
                     reconnect ();
                },
                
                onError = function (event) {
                      socket.removeEventListener('close',onClose);
                      socket.close();
                      reconnect();
                },
                
                jsonBrowserHandlers = { 
                    '{"tabs":[' : 
                    function(raw_json){
                        var ignore = localStorage.WS_DeviceId+".",
                        payload = JSON.parse(raw_json),
                        // collect a list of current remote ids, which we will update to 
                        // represent those ids that are no longer around
                        staleRemoteIds = OK(localStorage).filter(function(id){
                            return id.startsWith("ws_") && id.contains(".")  && get_local("mode",undefined,id)==="tabRemoteCallViaWS";
                        });
                        
                        // ensure the ids in the list are currently in localStorage
                        payload.tabs.forEach(function(full_id){
                            // we want to remove (and not add!) any remote keys that are already represented
                            // as local keys (ie any that begin with this device id+".")
                            if (!full_id.startsWith(ignore)) {
                                staleRemoteIds.remove(full_id);
                                set_local("mode","tabRemoteCallViaWS",full_id);
                                //self.__localStorage_setItem(full_id,"tabRemoteCallViaWS");
                            }
                        });
                        
                        //anything left in staleRemoteIds should not be in local storage
                        staleRemoteIds.forEach(function(id){ localStorage.removeItem(id);});
                        localStorage.setItem(zombie.key,Date.now());
                        
                        self.__on("change");
                        
                        if (payload.notify) {
                            self.__on("newsecret",payload.notify);
                        }
                        
                        
                        localStorage.removeItem("appGlobals");
                        localStorage.appGlobals =JSON.stringify(payload.globals);
                        onStorage_appGlobals(payload.globals);
    
                    },
                    
                    '{"acceptedPairing":' :
                    function(raw_json){
                        try {
                            var p = JSON.parse(raw_json);
                            WS_Secret = p.acceptedPairing;                                
                            //localStorage.WS_Secret = WS_Secret;
                            self.__localStorage_setItem("WS_Secret",WS_Secret);
                    
                            socket_send(JSON.stringify({WS_Secret:WS_Secret,tabs:localSenderIds(),notify:"remoteTap"}));
                        } catch (e) {
                            console.log(e);
                        }
                    },
                    
                    '{"doPair":' :
                    function(raw_json){
                        try {
                            var pkt = JSON.parse(raw_json);
                            self.__on("dopair",pkt.doPair,pkt.deviceId);
                        } catch (e) {
                            console.log(e);
                        }
                    },
                },
                
                jsonBrowserHandlersKeys=Object.keys(jsonBrowserHandlers),
                
                jsonHandlerDetect = function(raw_json) {
                    var handler = jsonBrowserHandlersKeys.reduce(function(located,prefix){
                        return located ? located : raw_json.startsWith(prefix) ? jsonBrowserHandlers[ prefix ] : false;
                    },false);
                    //if (handler) {
                        //console.log({jsonHandlerDetect:{raw_json,handler:handler.name}});
                    //}
                    return handler ? handler (raw_json) : false;
                },
                
                onMessage = function (event) {
                    var cmd = cmdIsLocal(event.data);
                    if (cmd) {
                        // call the default output parser, which will basically
                        // push the cmd through local storage to it's intended tab
                        // (or possibly invoke it immediately if it's intended for this tab )
                        self.onoutput(cmd);
                    } else {
                        jsonHandlerDetect(event.data);
                    }
                },
                
                onConnectMessage = function (event) {
                    try {
                        
                        routedDeviceIds = JSON.parse(event.data);
                        
                        //WS_DeviceId   = routedDeviceIds.shift();
                        socket.removeEventListener('message', onConnectMessage);    
                        socket.addEventListener('message', onMessage);
                        WS_Secret = getSecret ();//localStorage.WS_Secret;
                        if (!WS_Secret || WS_Secret.length !== 32) {
                            WS_Secret = randomId(32);
                            self.__localStorage_setItem("WS_Secret",WS_Secret);
                        }
                        //localStorage.WS_DeviceId = WS_DeviceId;
                        self.__localStorage_setItem("WS_DeviceId",routedDeviceIds.shift());
    
                        socket_send = function(str) {
                            socket.send(str);
                        };
                        
                        //socket.send.bind(socket);
                        socket_send(JSON.stringify({WS_Secret:WS_Secret,tabs:localSenderIds()}));
    
                        if (backlog&&backlog.length) {
                            backlog.forEach(function(cmd){
                                socket_send(cmd);
                                //console.log("relayed from backlog to server:",cmd);
                            });
                            backlog.splice(0,backlog.length);
                        }
                        backlog = undefined;
                        self.__on("change");
                      
                        if (localStorage.new_WS_Secret) {
                          delete localStorage.new_WS_Secret;
                          self.newSecret(localStorage.WS_Secret,"remoteScan");
                        }
                        
                        checkStorage ();
    
                    } catch (e) {
                        console.log(e);
                        socket.removeEventListener('error',onError);
                        socket.removeEventListener('close',onClose);
                        socket.close();
                        reconnect();
                    }
                },
                
                onOpen = function (event) {
                     //console.log("socket.open");
                     clear_reconnect_timeout();
                     // the first message is always the connect message
                     // note - the first task of onConnectMessage is to unhook itself and install onMessage
                     socket.addEventListener('message', onConnectMessage);
                };
                
                socket.addEventListener('open', onOpen);
                socket.addEventListener('close', onClose);
                socket.addEventListener('error', onError);
            }
            
            if (is_websocket_sender) {
                //getSecret ();
                connect();
            } else {
                WS_Secret=getSecret();
            }
            
            zombie = install_zombie_timer(2000);
            
            window.addEventListener('storage',onStorage);
            
            window.addEventListener('beforeunload',onBeforeUnload);
            
            sweepCustomTriggers();
            
            checkStorage ();
            
            return self;
            
            function cmdIsLocal(cmd){ 
                // returns a truthy value if cmd is intended for local consumption, otherwise false
                // note: will return false if cmd does not confirm to valid format, or is not a string
                // that truthy value will be a modified version of cmd that removes the localId
                // this means the returned value (if not false) can be direcly written to localStorage 
                // as a valid incoming command
                if (typeof cmd !=='string') return false;
                if (! cmd.contains(path_prefix) ) return false;
                var ix = cmd.indexOf('",');
                if (ix<0) {
                    return false;
                }
                var 
                msg_start=ix,
                work = cmd.substr(0,ix);
                ix = work.lastIndexOf('"');
                if (ix<0) {
                    return false;
                }
                var leadup = work.substr(0,ix+1);
                work = work.substr(ix+1);
                ix = work.indexOf(".");
                if (ix<0) return false;
                if (localStorage.WS_DeviceId===work.substr(0,ix)) { 
                    return leadup + work.substr(ix+1) + cmd.substr(msg_start);
                }
                return false;
            }
            
            function onCmdToStorage(cmd,writeToStorage){
                // intercept messages before being written to storage, if they are 
                // routed (ie not local), send them to websocket instead
                writeToStorageFunc=writeToStorage||writeToStorageFunc;
                var device = cmdIsRouted(cmd,localStorage.WS_DeviceId,path_prefix); 
                if (device) {
                    var remote_cmd = cmdSourceFixup(cmd,localStorage.WS_DeviceId);
                    if (remote_cmd) {
                        if (backlog) {
                            backlog.push(remote_cmd);
                            //console.log("placed in backlog:",remote_cmd);
                        } else {
                            socket_send(remote_cmd);
                            //console.log("sent to server:",remote_cmd);
                        }
                        //delete localStorage[remote_cmd];
                    } else {
                        console.log("ignoring bogus cmd:"+cmd);
                    }
                } else {
                    writeToStorageFunc(cmd);
                    //console.log("wrote to storage:",cmd);
                }
            }
            
            function onCmdFromStorage (cmd){
                // intercept messages detected in storage
                // if they are routed to another device, send them via websocket
                // and return undefined, otherwise return the 
                // item verbatim 
                // (this function is called from an array filter func to pre-filter cmd
                //  before testing it for local tab resolution )
                var device = cmdIsRouted(cmd,localStorage.WS_DeviceId,path_prefix); 
                if (device) {
                    var remote_cmd = cmdSourceFixup(cmd,localStorage.WS_DeviceId);
                    if (remote_cmd) {
                        if (backlog) {
                            backlog.push(remote_cmd);
                            //console.log("relayed from storage to backlog:",remote_cmd);
                        } else {
                            socket_send(remote_cmd);
                            //console.log("relayed from storage to server:",remote_cmd);
                        }  
                    } else {
                        //console.log("ignoring bogus cmd:"+cmd);
                    }
                    delete localStorage[cmd];
                } else {
                    // not a routed command
                    //console.log("read from storage:",cmd);
                    
                    return cmd;
                }
            }
            
            function pairingSetup(afterSetup) {
        
                function sleep_management( ) {
                    
                    var sleeping = false, focused = true;
                  
                    window.addEventListener("focus", handleBrowserState.bind(window, true));
                    window.addEventListener("blur", handleBrowserState.bind(window, false));
                  
                    function emit(state) {
                        var event = document.createEvent("Events");
                        event.initEvent(state, true, true);
                        document.dispatchEvent(event); 
                    }
        
                    function handleBrowserState(isActive){
                        // do something
                        focused = isActive;
                        self.variables.focused = isActive;
                        
                        if (focused && sleeping) {
                            sleeping = (self.variables.sleeping = false);
                            emit("awake");
                        }
                    }
                  
                  
                    var timestamp = new Date().getTime();
        
                    window.setInterval(function() {
                        var current = new Date().getTime();
                        if (current - timestamp > 2000) {
        
        
                            if (sleeping) {
                              //console_log("snore");
                            } else {
                              sleeping = (self.variables.sleeping = true);
                              emit("sleeping");
                            }
        
                        }
                        timestamp = current;
                    },500);
        
                    emit("awake");
                    
                    self.variables.focused = true;
                    self.variables.sleeping = false;
    
                }
                
                function qs(q,d){
                    return d?d:document.querySelector(q);
                }
    
                function src(fn){
                    if (fn.__src==='string') return fn.___src;
                    var res = fn.toString();
                    res = res.substr(res.indexOf("/*")+2);
                    return HIDE(fn,'__src',res.substr(0,res.lastIndexOf("*/")).trim());
                }
                
                function addCss(rule) {
                  var css = document.createElement('style');
                  css.type = 'text/css';
                  if (css.styleSheet) css.styleSheet.cssText = rule; // Support for IE
                  else css.appendChild(document.createTextNode(rule)); // Support for the rest
                  document.getElementsByTagName("head")[0].appendChild(css);
                }
                
                var 
                
                pairing_html_fields  = {
                          "pair_setup_title"       :  "",
                          "pair_sms_bottom_help"   :  "",
                          "pair_email_bottom_help" :  "",
                          "pair_scan_bottom_help"  :  "",
                          "pair_qr_bottom_help"    :  "",
                          "pair_close_btn"         :  "X"
                }, 
                    
                pairing_html_field_keys = Object.keys(pairing_html_fields);
      
                function pairing_html (cb) { 
                    
                    loadFileContents("/tab-pairing-setup.html",function(err,raw){
                         if (!err) {
                            var chunks = raw.split("<!--pairing-setup-->");
                            if (chunks.length===3) {
                               cb(chunks[1].trim());
                            }
                         }
                    });
                }
                
                function pairing_css (cb) {
                  loadFileContents("/tab-pairing-setup.css",function(err,pr_css){
                         if (!err) {
                             cb(pr_css);
                         }                               
                  });
                }
    
                pairing_css(function(css){
                    addCss(css);
                    
                    if(!self.defaults.pair_by_email) {
                      addCss(".pairing_button_email { display:none;}");
                    }
          
                    if(!self.defaults.pair_by_sms) {
                      addCss(".pairing_button_sms { display:none;}");
                    }
          
                    if(!self.defaults.pair_by_qr) {
                      addCss(".pairing_button_qr, .pairing_button_scan { display:none;}");
                    }
          
                            
                    if(!self.defaults.pair_by_tap) {
                      addCss(".pairing_button_tap, .pairing_button_show { display:none;}");
                    }
    
    
                    pairing_html(function(pr_html){
                      
                        pairing_html_field_keys.forEach(function(tag) {
                          
                          var rep = self.defaults[tag] || pairing_html_fields[tag];
                             
                          pr_html = pr_html.split('{$'+tag+'$}').join(rep);
                          
                        }) ;
              
                        qs(".pairing_setup").innerHTML = pr_html;
                        
                        var 
                        
                        last_i,
                        ws_secret = qs(".pairing_setup .pairing_secret"),
                        
                        btnPairingOff = qs(".pairing_button_off"), 
                        btnPairingOn = qs(".pairing_button_on"), 
                        
                        
                        btnQRCode = qs(".pairing_setup .pairing_buttons .pairing_button_qr"), 
                        btnScan   = qs(".pairing_setup .pairing_buttons .pairing_button_scan"), 
                        btnShow   = qs(".pairing_setup .pairing_buttons .pairing_button_show"), 
                        btnTap    = qs(".pairing_setup .pairing_buttons .pairing_button_tap"), 
                        
                        btnSMS    = qs(".pairing_setup .pairing_buttons .pairing_button_sms"), 
                        btnEMAIL  = qs(".pairing_setup .pairing_buttons .pairing_button_email"), 
                        
                            
                        btnNew    = qs(".pairing_setup .pairing_button_new"), 
                        btnNewConfirmMsg = qs(".pairing_setup .pairing_button_new_wrap span"), 
                        btnNewConfirm = qs(".pairing_setup .pairing_button_new_wrap span button"), 
                        showTap   = qs(".pairing_setup .pairing_show_tap"), 
                        tap       = qs(".pairing_setup .pairing_tap"),
              
                        your_name = qs("#your_name");
                        
                        
                        var secure_digit_charset = "0123456789abcdefghijklmnopqrstuvwxyz";
                            
                        function setMode(mode) {
                            ["pairing_off","show_tap","tap_qr","scan_qr","show_qr","by_email","by_sms"].forEach(
                                function(mod) {
                                    if (mode===mod) {
                                        document.body.classList.add(mode);
                                    } else {
                                        document.body.classList.remove(mod);
                                    }
                                }    
                                
                            );
                        }
                            
                        function secure_digit_factory(size,onclick,selectedChar,bgc) {
                            var fa_font_digits = [
                               //"fas fa-bath",
                               "fas fa-coffee",
                               "fas fa-shield-alt",
                               "fas fa-user-secret",
                               "fas fa-handshake",
                               "fas fa-heart",
                               //"fas fa-tractor",
                               "fas fa-cut",
                               //"fas fa-book-reader"
                            ];
                            var htmls = [];
                            var n = 0;
                            fa_font_digits.forEach(function (cls) {
                                ["red","blue","green","black","fuchsia", "orange"].forEach(function(color){
                                    var bg = selectedChar ? selectedChar === secure_digit_charset[n] ? ' background-color: '+bgc+';' :'':'';
                                    htmls.push ('<i onclick="'+onclick+'" data-char="'+secure_digit_charset[n]+'" class="'+cls+'" style="font-size:'+size+'px;color:'+color+';'+bg+'"></i>');
                                    //htmls.push ('<i onclick="'+onclick+'" data-char="'+charset[n]+'" style="font-size:'+size+'px;">'+charset[n]+'</i>');
                                    n++;
                                });
                                
                            });
                                    
                            var get_digit = function (c,ix){return '<span class="digit_'+ix+'">'+htmls[secure_digit_charset.indexOf(c)]+'</span>';};
                            return function (str,cls) {
                                return (cls ?  '<div class="'+cls+'">' :  '<div>' )  +str.split('').map(get_digit).join('')+'</div>';
                            };
                        }
                        
                        function keyPad (onclick,c,bg) {
                            var secure_digits = secure_digit_factory(36,onclick,c,bg),
                            html = '<div class="keypad">';
                            
                            for (var i=0;i<6;i++) {
                                html += secure_digits(secure_digit_charset.substr(i*6,6),"row"+String(i));
                            }
                    
                            return html + "</div>";
                            
                        }
                        
                        function showTapLogin (div,len,cb) {
                            var 
                            
                            //secure_digits = secure_digit_factory(200,''),
                             
                            passCode ='',
                            fix=function(c,i){
                                 if (i===0) return true;
                                 return (c!==passCode.charAt(i-1));
                            };
                            
                            do {
                                passCode += Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER).toString(36); 
                                passCode = passCode.split('').filter(fix).join('');
                            } while (passCode.length<256);
                            
                            var
                            running = true,
                            seq = Math.floor(Math.random()*(Number.MAX_SAFE_INTEGER/2)),
                            next = function (step) {
                                if (running) {
                                    seq++;
                                    div.innerHTML = keyPad('no_op',passCode.charAt(step),'lime');//secure_digits(passCode.charAt(step));
                                    div.style.backgroundColor=null;
                                    window.setTimeout(next,5000,(step+1) % passCode.length);
                                }
                            };
                            
                            next(0);
                            
                            var candidates = {};
                            
                            self.startPair();
                            self.on("dopair",function(c,fromId){
                                var cand=candidates[fromId];
                                if (cand)  {
                                    
                                    if (cand.seq!==seq){
                                        cand.build=cand.progress;
                                        cand.seq=seq;
                                    } 
                                    
                                    cand.c=c;
                                    cand.progress=(cand.build+c).substr(-len);
                                } else {
                                    candidates[fromId] = cand = {build:'',c:c,progress:c,seq:seq};
                                }
                                
                               
                                if (cand.progress.length>=len && passCode.indexOf(cand.progress)>=0) {
                                    running = false;
                                    div.innerHTML = fromId;
                                    self.endPair(fromId,ws_secret.value,your_name.value);
                                    
                                    Object.keys(candidates).forEach(function(k){
                                        var cand = candidates[k];
                                        delete candidates[k];
                                        delete cand.c;
                                        delete cand.build;
                                        delete cand.progress;
                                    });
                                    self.on("dopair",false);
                                    
                                    cb();
            
                                }
                            });
                            
                            return {
                                stop : function () {
                                    running = false;
                                    div.innerHTML = "";
                                    Object.keys(candidates).forEach(function(k){
                                        delete candidates[k];
                                    });
                                    self.endPair();
                                    self.on("dopair",false);
                                    
                                    
                                    
                                }
                            };
                            
                        }
              
                        //https://stackoverflow.com/a/25490531/830899
                        function getCookieValue(a) {
                          var b = document.cookie.match("(^|[^;]+)\\s*" + a + "\\s*=\\s*([^;]+)");
                          return b ? b.pop() : "";
                        }
    
                        //https://stackoverflow.com/a/24103596/830899
                        function setCookie(name, value, days) {
                          var expires = "";
                          if (days) {
                            var date = new Date();
                            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
                            expires = "; expires=" + date.toUTCString();
                          }
                          document.cookie = name + "=" + (value || "") + expires + "; path=/";
                        }
              
                        your_name.value = getCookieValue("your_name");
              
                       
    
                        var qrcode_prefix = document.location.href.substr(
                            0,document.location.href.lastIndexOf("/")+1
                        )+"?pair=";
                                
                        var qrcode = new QRCode(qs(".pairing_setup .pairing_qrcode"), {
                            width  : 300,
                            height : 300
                        });
                
                         
                          var 
                          
                          video = document.createElement("video"),
                          canvasElement = qs(".pairing_setup .pairing_video_canvas"), 
                          canvas = canvasElement.getContext("2d");
                          //loadingMessage = qs(".pairing_setup .pairing_video_message");
                          //outputContainer = qs(".pairing_setup .pairing_video_output");
                          
                        
                          function drawLine(begin, end, color) {
                            canvas.beginPath();
                            canvas.moveTo(begin.x, begin.y);
                            canvas.lineTo(end.x, end.y);
                            canvas.lineWidth = 4;
                            canvas.strokeStyle = color;
                            canvas.stroke();
                          }
                        
                        
                          var 
                          notified = false,
                          stopped = true,
                          
                          start = function () {
                              
                              // Use facingMode: environment to attemt to get the front camera on phones
                              navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
                                  
                                video.srcObject = stream;
                                video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                                stopped = false;
                                    
                                video.play();
                                requestAnimationFrame(tick);
                                
                              });
                    
                          };
                          
                          
                          function tick() {
                            if (! notified ) {
                              //loadingMessage.innerText = "⌛ Loading video...";
                              notified =true;
                            }
                            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                              //loadingMessage.hidden = true;
                              canvasElement.hidden = false;
                              //outputContainer.hidden = false;
                        
                              canvasElement.height = video.videoHeight;
                              canvasElement.width = video.videoWidth;
                              canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                              var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                              var code = /*global jsQR*/jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: "dontInvert",
                              });
                              if (code) {
                                drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                                drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                                drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                                drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                                
                                if (code.data.startsWith(qrcode_prefix)) {
                                  code.data = code.data.substr(qrcode_prefix.length);
                                  if (code.data.length>32) {
                                     try  {
                                       var data = JSON.parse(atob(code.data));
                                       if (data.secret && data.secret.length===32) {
                                          code.data = data.secret;
                                       }
                                     } catch(e) {
                                       
                                     }
                                  }
                                  
                                  if (code.data.length===32) {
                                      ws_secret.focus();
                                      ws_secret.value = code.data;
                                      localStorage.WS_Secret=code.data; 
                                      makeCode();
                                      self.newSecret(localStorage.WS_Secret,"remoteScan");
                                      pairing_off();
                                      self.__on("change");
                                  }
                                } else {
                                  
                                    if (code.data.startsWith("https://") && code.data.indexOf("?pair=")>0) {
                                        location.replace(code.data);
                                    }
                                }
                    
                              }
                            }
                            
                            if (stopped) {
                                video.srcObject.getTracks()[0].stop();  // if only one media track
                            } else {
                                requestAnimationFrame(tick);
                            }
                          }
                        
                    
                          function stop (){
                              stopped = true;
                          }
                    
            
                          function makeCode () {
                               var data = {
                                 from:your_name.value,
                                 secret:localStorage.WS_Secret
                               };
                             qrcode.makeCode( qrcode_prefix+btoa(JSON.stringify(data)));
                          }
    
                          window.keypadTap = function (c,i) {
                              if (last_i) {
                                  if (last_i===i) {
                                      last_i.style.backgroundColor="lime";
                                      return;
                                  }
                                  last_i.style.backgroundColor=null;
                              }
                              i.style.backgroundColor="lime";
                              last_i=i;
                              self.doPair(c);
                          };
                          
                          tap.innerHTML = keyPad("keypadTap(this.dataset.char,this);");
                          
                          var activeLogin;
                          
            
                          function pairing_off(e){
                              if (e) e.preventDefault();
                              
                              setMode("pairing_off");
                              if (!stopped) stop();
                              self.on("newsecret",false);
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
                          
                          function show_qr(e){
                              if (e) e.preventDefault();
                              setMode("show_qr");
                              if (!stopped) stop();
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                              
                              self.on("newsecret",function (reason){
                                  if (reason==="remoteScan") {
                                     pairing_off();
                                  }
                              });
                            
                            your_name.oninput=function() {
                              setCookie("your_name",your_name.value,999);
                              makeCode();
                            };
                          }
                          
                          function scan_qr(e){
                              if (e) e.preventDefault();
                              setMode("scan_qr");
                              self.on("newsecret",false);
                                  
                              if (stopped) {
                                  window.setTimeout(start,10);
                              }
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
                          
                          function show_tap (e){
                                 if (e) e.preventDefault();
                                 setMode("show_tap");
                                 if (!stopped) stop();
                                 self.on("newsecret",false);
                                  
                                 if (last_i) {
                                     last_i.style.backgroundColor=null;
                                 }
                                 last_i=undefined;
                                 
                                 if (activeLogin) {
                                     activeLogin.stop();
                                 }
                                 activeLogin =  showTapLogin(showTap,8, function() {
                                     setMode("pairing_off");
                              
                                     if (last_i) {
                                         last_i.style.backgroundColor=null;
                                         last_i=undefined;
                                     }
                                     activeLogin=undefined;
                                 });
                                
                          }
                          
                          function tap_qr(e){
                              if (e) e.preventDefault();
                            
                              if (!stopped) stop();
                              self.on("newsecret",function(reason){
                                  if (reason==="remoteTap") {
                                      pairing_off();
                                  }
                              });
                            
                              
                                  
                              setMode("tap_qr");
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
              
                          function by_sms(e){
                            
                            if (e) e.preventDefault();
                            
                            if (!stopped) stop();
                            
                            var
                            
                            copy_sms_url = qs("#copy_sms_url"),
                            sms_url = qs("#sms_url"),
                            phone = qs("#phone"),
                           
                            send_sms  = qs("#send_sms"),
                            sms_preview = qs("#sms_preview");
    
                            document.body.classList.remove("url_copied");
                            document.body.classList.remove("sms_number_bad");
                            
                            function isValidPhone(p) {
                              
                              return /^(0\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(p);
                            }
                            
                            var update_link = function () {
    
                               var data = {
                                 from:your_name.value,
                                 secret:localStorage.WS_Secret
                               };
                               var b64 = btoa(JSON.stringify(data));
                              
                               sms_url.value  = location.href.split("?")[0] + "?pair="+b64 ;
                               var txt = [
    
                                  "Hi, It's "+your_name.value+".",
                                  self.defaults.pair_sms_oneliner
                               ];
                              
                              
    
                               sms_preview.innerHTML = txt.join("\r")+"\rhttps://"+location.host+"?pair=..."; 
                               txt.push(sms_url.value); 
                               send_sms.href= "sms:"+phone.value+"?body="+txt.join("%0A%0A") ;
                              
                               document.body.classList.remove("sms_number_bad");
                               
                               send_sms.onclick = function (e) {
                                   if(!isValidPhone(phone.value)) {  
                                     e.preventDefault();
                                     phone.focus();
                                     phone.select();
                                     
                                     document.body.classList.add("sms_number_bad");
                                   } else {
                                      alert ("once you have sent the message, switch back to this page");
                                   }
                               };
                              
                            };
    
                            your_name.oninput=function() {
                              setCookie("your_name",your_name.value,999);
                              update_link();
                            };
    
                            phone.value = "";
    
                            phone.oninput=update_link; 
                            update_link();
                            
                            function CopySMS() {
                              //e.preventDefault();
                              sms_url.select();
                              document.execCommand("copy");
                              document.body.classList.add("url_copied");
                            }
                          
                            copy_sms_url.onclick = CopySMS; 
                            
                              self.on("newsecret",false);
                                  
                              setMode("by_sms");
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
              
                          function by_email(e){
                              
                            if (e) e.preventDefault();
                            
                            if (!stopped) stop();
                             
                             var 
                            copy_email_url = qs("#copy_email_url"),
                            email_url = qs("#email_url"),
                            email = qs("#email"),
                             send_email  = qs("#send_email"),
                            email_preview = qs("#email_preview");
    
                            document.body.classList.remove("url_copied");
                            
                            function CopyEMAIL() {
                              //e.preventDefault();
                              email_url.select();
                              document.execCommand("copy");
                              document.body.classList.add("url_copied");
                            }
    
                            var update_link = function () {
    
                               var data = {
                                 from:your_name.value,
                                 secret:localStorage.WS_Secret
                               };
                               var b64 = btoa(JSON.stringify(data));
                              
                               email_url.value  = location.href.split("?")[0] + "?pair="+b64 ;
                               var txt = [
    
                                  "Hi, It's "+your_name.value+".",
                                  self.defaults.pair_email_oneliner,
                                  email_url.value 
    
                               ];
    
                               email_preview.innerHTML = txt.join("\r"); 
                               send_email.href= "mailto:"+email.value+"?subject=URL%20for%20Website&body="+txt.join("%0A%0A") ;
                            };
    
                            your_name.oninput=function() {
                              setCookie("your_name",your_name.value,999);
                              update_link();
                            };
    
                            email.value = "";
    
                            email.oninput=update_link; 
                            update_link();
                          
                            copy_email_url.onclick = CopyEMAIL; 
                            
                              self.on("newsecret",false);
                                  
                              setMode("by_email");
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
                        
                          btnQRCode.addEventListener("click",show_qr);
                          
                          btnScan.addEventListener("click",scan_qr);
                          
                          btnShow.addEventListener("click",show_tap);
                          
                          btnTap.addEventListener("click",tap_qr);
              
              
                          btnSMS.addEventListener("click",by_sms);
              
                          btnEMAIL.addEventListener("click",by_email);
              
                          function btnNewConfirmClick(){
                               localStorage.WS_Secret = ws_secret.value = self.randomId(32); 
                               self.newSecret(localStorage.WS_Secret,"newCode");
                               makeCode();
                               btnNewConfirmMsg.classList.remove("showing");
                          }
              
              
                          btnNew.addEventListener("click",function(){
                              if (self.__senderIds.length === -1) {
                                  btnNewConfirmClick();
                              } else {
                                  btnNewConfirmMsg.classList.toggle("showing");
                              }
                          }); 
              
                          btnNewConfirmMsg.addEventListener("click",function(){
                              btnNewConfirmMsg.classList.remove("showing");
                          }); 
                          btnNewConfirm.addEventListener("click",btnNewConfirmClick);
                          
                          
                          btnPairingOff.addEventListener("click",pairing_off);
                          
                          btnPairingOn.addEventListener("click",function(){
                            
                            switch (self.defaults.pair_default_mode) {
                                case "show_qr" : if(self.defaults.pair_by_qr) return show_qr(); break;
                                case "scan_qr" : if(self.defaults.pair_by_qr) return scan_qr(); break;
                                case "show_tap" : if(self.defaults.pair_by_tap) return show_tap(); break;
                                case "tap" : if(self.defaults.pair_by_tap) return tap_qr(); break;
                                case "by_email" : if(self.defaults.pair_by_email) return by_email(); break;
                                case "by_sms" : if(self.defaults.pair_by_sms) return by_sms(); break;
                            }
                            
                            if(self.defaults.pair_by_qr) {
                                return show_qr();
                            }
                            
                            if(self.defaults.pair_by_tap) {
                                return show_tap();
                            }
                            
                            if(self.defaults.pair_by_sms) {
                               return by_sms();
                            }
                            
                            if(self.defaults.pair_by_email) {
                                return by_email();
                            }
              
    
                       
              
                                
                        if(!self.defaults.pair_by_tap) {
                          addCss(".pairing_button_tap, .pairing_button_show { display:none;}");
                        }
                            
                          });
                          
                          ws_secret.value = localStorage.WS_Secret;
                          ws_secret.onblur = function() {
                              localStorage.WS_Secret = ws_secret.value;
                              makeCode();
                              self.newSecret(localStorage.WS_Secret,"editCode");
                          };
                      
                          makeCode();
                          /*
                          self.variables.addEventListener("sleeping",function(id,key,value){
                              console_log((id?id:"this tab")+" is "+(value?"sleeping":"awake"));    
                          });
                          
                          self.variables.addEventListener("focused",function(id,key,value){
                              console_log((id?id:"this tab")+" is "+(value?"focused":"blurred"));    
                          });
                          
                          */
                          
                          self.variables.addEventListener("update",function(e){
                              //console_log(JSON.stringify(e));
                          });
                          
                          
                          afterSetup();
                          
                          sleep_management( ) ;
                          
    
    
                    });
    
                });
    
            }
    
            function install_zombie_timer(zombie_period){
                
                 
                var 
                
                zombie_timer,
                // every 0.75 seconds, a tab will update it's "id.ping" entry with the current Date.now()
                // and then collect a list of any other tabs's pings that should have done the same
                // if any of them are more than 1.5 seconds old, the tab has clearly been closed and this
                // fact has not been reflected in localStorage (and therefore the network)
                // whilst this should theoretically be impossible, it appears swiping a browser tab away on
                // android chrome does not call before unload, and there may be other ways a tab can be
                // removed in some browsers that defeat the normal cleanup. 
                // by monitoring each other, tabs can ensure there are no zombies.
                // if the *last* tab gets removed in this fashion it's a moot point and it will
                // soon be addressed when another tab is opened.
                // note: this 7.5 second interval is instated AFTER the first check which happens
                // immediately after a tab gets shown.
                // this does not address remote tabs being closed - however the server
                // keeps track of websocket tabs being closed, and their peers will locally monintor them
                // becoming a websocket tab themself should the need arise.
                // so the server acts as watchdog for remote tabs.
                zombie_half_life=zombie_period/2,
                zombie_suffix=".ping",
                zombie_key=self.id+zombie_suffix,
                shotgun_shell = localStorage.removeItem.bind(localStorage),
                zombie_filter = function(zombie){
                     return zombie!==zombie_key&&zombie.endsWith(zombie_suffix);
                },
                lone_ranger_filter = function(zombie){
                     return zombie!==zombie_key&&
                            zombie.startsWith(tab_id_prefix)&&
                            !zombie.endsWith(zombie_suffix)&&
                            !localStorage.getItem(zombie+zombie_suffix);
                },
                shotgun=function(zombie){
                    [zombie,zombie.split(zombie_suffix)[0]].forEach(shotgun_shell);
                },
                zombie_ping = function(){
                    var now=Date.now(),expired_filter = function (k) {
                       return now-parseInt(localStorage[k])>=zombie_period;
                    };
                    // write our own timestamp
                    localStorage.setItem(zombie_key,now);
                    var keys = OK(localStorage);
                    // if there are any tabs without a timestamp (!!!???) stamp them as being seen NOW
                    keys.filter(lone_ranger_filter).forEach(function(zombie){
                        localStorage.setItem(zombie+zombie_suffix,now);
                    });
                    
                    keys.filter(zombie_filter)
                          .filter(expired_filter)
                             .forEach(shotgun);
                    //console.log("resetting zombie_timer",zombie_half_life,"msec");
                    zombie_timer = window.setTimeout(zombie_ping,zombie_half_life);
                },
                start_zombie_ping = function(){
                  if (!zombie_timer) zombie_timer= window.setTimeout(zombie_ping,100);  
                },
                stop_zombie_ping = function(){
                    if (zombie_timer) window.clearTimeout(zombie_timer);
                    zombie_timer=undefined;
                };
                
                return {
                    restart : start_zombie_ping,
                    stop    : stop_zombie_ping,
                    key     : zombie_key
                };
            
            }
            
            function checkReconnect(currentKeys){
                
                zombie.restart();
                
                var storageSenderIds = currentKeys.filter(isStorageSenderId);
                storageSenderIds.sort();
                var is_first = (storageSenderIds[0]===self.id);
                var webSocketIds = currentKeys.filter(isWebSocketId);
                if (webSocketIds.length===0) {
                    if (is_first) {
                       is_websocket_sender = true;
                       self.__usePassthroughInvoker(onCmdToStorage,onCmdFromStorage);
                       set_local("mode","tabCallViaWS",self.id);
                       //localStorage[self.id]="tabCallViaWS";
                       //self.__localStorage_setItem(self.id,"tabCallViaWS");
                       connect();
                       return true;
                    }
    
                }
                
                return false;
            }
            
            function checkSenderList(currentKeys) {
                
                if (!is_websocket_sender|| typeof socket_send!=='function') return false;
                
                var senderIds = currentKeys.filter(isLocalSenderId);
                
                if (  ! lastSenderIds || 
                      lastSenderIds.length!== senderIds.length || 
                      senderIds.some(function(id){ return !lastSenderIds.contains(id); }) || 
                      lastSenderIds.some(function(id){ return !senderIds.contains(id); }) 
                   ) {
                    lastSenderIds=senderIds;
                    //console.log("senderList has changed");
                    socket_send(JSON.stringify({WS_Secret:WS_Secret,tabs:senderIds}));
                }
                return senderIds.length < 1 ? false : senderIds.filter(
                  function(id) {
                      return id !== self.id;
                  }    
                );
            }
            
            function checkVariableNotifications(peerKeys) {
                if (peerKeys) {
                    
                    peerKeys.map(function(tab_id){
                        var 
                        data = JSON.parse(localStorage[tab_id]),
                        keys = OK(data);
                        
                        return {
                            id      : tab_id,
                            data    : data,
                            keys    : keys,
                            changed : keys.filter(keys_local_changed_f),
                        };
                        
                    }).filter(function(tab){
                        return tab.changed.length>0;
                    }).forEach(function(tab){
                        
                        tab.changed.forEach(function(k){
                            //console.log(tab.id+"."+k+" = "+JSON.stringify(tab.data[k]));
                            delete tab.data['~'+k];
                        });
                        
                        localStorage[tab.id]=JSON.stringify(tab.data);
                    });
                }
            }
    
            function checkStorage (){
    
                var currentKeys = OK(localStorage);
                
                //checkReconnect() will force reconnection to server
                //if no other tab has a connection AND this tab is the
                //first when keys are sorted - eg the primary tab
                if (checkReconnect(currentKeys)) return;
                
                
                checkVariableNotifications(
                    
                    // for websocket masters,checkSenderList() notifies server of new/departed peers 
                    // returns false or a list of peer keys
                    checkSenderList(currentKeys)
                   
                   
                );
    
                // if the local secret has changed update the ui
                if(WS_Secret !== localStorage.WS_Secret) {
                    WS_Secret = localStorage.WS_Secret;
                    self.__on("change");
                }
            }
            
            function onStorage_appGlobals_ws(j) {
               var g=typeof j==='string'?JSON.parse(j):j;
            }
            
            function onStorage_appGlobals(j) {
               globs=typeof j==='string'?JSON.parse(j):j;
               checkVersion(globs.ver,globs.msg);
            }
            
            function onStorage_WS_Secret(secret,oldSecret) {
                console.log("onStorage_WS_Secret:",secret);
            }
            
            function onStorage_WS_DeviceId(deviceId,oldDeviceId) {
                console.log("onStorage_WS_DeviceId:",deviceId);
            }
            
            function sweepCustomTriggers() {
                var currentKeys = OK(localStorage);
                check (is_websocket_sender&&typeof socket_send==='function' ? ws_triggers : non_ws_triggers);
                check (ws_nonws_triggers);
                
                function check(triggers) {
                    currentKeys.filter(function(k){
                          return !!triggers[k];
                      }).forEach(function(k) {
                          triggers[k](localStorage[k],undefined,k);
                      });
                }
            }
            
            function customStorageTriggers (e) {
                if (e.newValue!==null) {
                    var handler;
                    if (is_websocket_sender&&typeof socket_send==='function') {
                        handler=ws_triggers[e.key]||ws_nonws_triggers[e.key];
                    } else {
                        handler=non_ws_triggers[e.key]||ws_nonws_triggers[e.key];
                    }
                    if (!!handler) return handler(e.newValue,e.oldValue,e.key);
                }
            }
            
            function onStorage (e) {
                if(e.storageArea===localStorage) {
                    checkStorage ();
                    customStorageTriggers(e);
                }
            }
            
            function onBeforeUnload (e) {
                window.removeEventListener('storage',onStorage);
                zombie.stop();
                if (is_websocket_sender) {
                    delete localStorage[self.id];
                    if (typeof socket_send === 'function') {
                        // main reason this might not defined is because this event
                        // is called twice in some browsers - beforeunload & unload
                        // android does not call beforeunload, and sometimes unload is not 
                        // called on other browsers, so we call it on both events
                        socket_send(JSON.stringify({WS_Secret:WS_Secret,tabs:localSenderIds()}));
                        console.log("sent disconnect message");
                    }
                }
            }
            
            
        } 
        
        function browserVariableProxy (api,self_id,full_id) {
            var 
            self = {
                
            },
            events={
                 change : [],// ()
                 update : [],// sams as change, but without previous value - faster
            },
            proxy_props = {
                get : getProxyProp,
                set : setProxyProp
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
            
            function getProxyProp(x,key){
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
                    case "addEventListener" : 
                        return function (e,fn) {
                            if (typeof events[e]==='object') {
                                events[e].add(fn);
                            }
                        };
                        
                    case "removeEventListener" : 
                      return function (e,fn) {
                          if (typeof events[e]==='object') {
                              events[e].remove(fn);
                          }
                      };
                }
                return api(key,self_id);
            }
            
            function notifyChangeUpdate(key,val,changer) {
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
                        changePayload.oldValue = key ? api(key,self_id) : getProxyProp(undefined,"__object");
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
    
            function setProxyProp(x,key,val){
                if (api.assign && key==="__object") {
                    return notifyChangeUpdate(undefined,val,function(){
                       return api.assign (val,self_id);
                    });
                }
                
                if (api.assign_json && key==="__json") {
                    return notifyChangeUpdate(undefined,val,function(){
                       return api.assign_json (val,self_id);
                    });
                }
                if (api.write) {
                  
                    switch (key) {
                        case "__keys" : return false;
                        case "addEventListener" : return false;
                        case "removeEventListener" : return false;
                        case "__object" : {
                            return notifyChangeUpdate(undefined,val,function(){
                               OK(val).forEach(function(k){
                                   api.write (k,val[k],self_id);
                               });    
                            });
                        }
                    }
                    
                    return notifyChangeUpdate(key,val,function(){
                        return api.write (key,val,self_id);
                    });
    
                }
                return false;
            }
    
        }
    
    }


/*included-content-ends*/

/*

skip this part

*/