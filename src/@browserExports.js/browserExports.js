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
        
        var disable_browser_var_events=true,
            zombie_suffix=".ping";
                
        

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
        
        function isWebSocketId(k){
            if (k.startsWith(tab_id_prefix)&& !k.endsWith(zombie_suffix)) {
                return get_local("mode",undefined,k) === tmodes.ws;
            }
            return false;
        }
        
        function webSocketIds(){
            return Object.keys(localStorage).filter(isWebSocketId);
        }
  
  
    
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
        
        "include @browserExports.js/tabVariables.js";
        
        "include @browserExports.js/localStorageSender.js";

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
            
            var implementation = {
                
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
                
                
                __tabLocalId : {
                    get : function () { return tabLocalId.bind(this,localStorage.WS_DeviceId + remote_tab_id_delim );},
                    set : function () {},
                },  
                
                __tabFullId : {
                    get : function () { return tabFullId.bind(this,localStorage.WS_DeviceId + remote_tab_id_delim );},
                    set : function (){},
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
                    value : browserVariableProxy(
                        self.__tabVarProxy,
                        self.id,
                        localStorage.WS_DeviceId+"."+self.id,
                        self.id,
                        localSenderIds)
                },
                
               
                
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
    
            };

            DP(self,implementation);
            
            DP(self,{
                var_test : {
                    
                    value : tabVariables(self,"var_test","_var_test_api")
                    
                }
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
                            return id.startsWith("ws_") && id.contains(".")  && get_local("mode",undefined,id)=== tmodes.remote;
                        });
                        
                        // ensure the ids in the list are currently in localStorage
                        payload.tabs.forEach(function(full_id){
                            // we want to remove (and not add!) any remote keys that are already represented
                            // as local keys (ie any that begin with this device id+".")
                            if (!full_id.startsWith(ignore)) {
                                staleRemoteIds.remove(full_id);
                                
                                set_local("mode",tmodes.remote,full_id);
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
            
            self.__notifyPeerChange = notifyPeerChanges;
            
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
            
            "include @browserExports.js/pairingSetup.js";
            
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
                       
                       self.tab_mode = tmodes.ws;
                       set_local("mode",self.tab_mode,self.id);
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
                return senderIds.length < 1 ? false : 
                        { 
                    
                            all   : senderIds,
                            peers : senderIds.filter(
                                      function(id) {
                                          return id !== self.id;
                                      } )
                        };
                
            }
            
            function getNotifyCB(tab_id,changed) {
                //var 
                //notifyFN = self.tabs[tab_id].variables.__notifyChanges;
                return function(k){
                    self.tabs[tab_id].variables.__notifyChanges(k,changed[k],function(){ 
                        console.log({notifyFN:{k:k,v:changed[k],tab_id:tab_id}});
                        return true;
                    });
                };
            }
            
            function notifyPeerChanges(callInfo,tab_changes) {
                  // called from web socket master tab
                  // when any other local tabs has changed 
                  console.log({notifyPeerChanges:{callInfo:callInfo,tab_changes:tab_changes}});
                   
                  OK(tab_changes).forEach(function (tab_id){
                      if (tab_id!==self.id) {
                          var 
                          changed=tab_changes[tab_id],
                          notifyFNwrap = getNotifyCB(tab_id,changed); 
                          OK(changed).forEach(notifyFNwrap);
                       }
                  });   
            }
            
            function checkStorage (){
    
                var currentKeys = OK(localStorage);
                
                //checkReconnect() will force reconnection to server
                //if no other tab has a connection AND this tab is the
                //first when keys are sorted - eg the primary tab
                if (checkReconnect(currentKeys)) return;
                
                
                self.__checkVariableNotifications(
                    
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
