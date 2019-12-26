/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint node:true*/ 

/* global
      DP,
      OK,
      remote_tab_id_prefix,
      unregistered_DeviceId,
      randomId,
      cmdIsRouted,
      pathBasedSendAPI,
*/
var globs,currentlyDeployedVersion;
       
/*included-content-begins*/
    function nodeJSExports(defaultPrefix){
        //null:browserExports
        if (typeof process!=='object') return false;
        if (typeof module!=='object') return false;
        if (!this || !this.constructor || this.constructor.name !== 'Object') return false;
        
        
        var path = require("path");
        if(process.mainModule===module) {
            console.log("you can't start "+path.basename(module.filename)+" on the command line");
            return false;
        }
        
        var 
        fs = require("fs"), 
        Cookies = require('cookies');
        
        var getCommitMessage = function () {
            var folder = path.dirname(process.mainModule.filename),
                pkg = path.join(folder,".tab-calls-repo.json"),
                json,msg;
            try {    
                json = fs.readFileSync(pkg);
                msg = JSON.parse(json).commit.message;
                getCommitMessage = function() {
                  return msg;
                };
                return msg;
            } catch (e) {
                return "";
            }
        };
        
        
        var getCurrentVersion = function () {
            var folder = path.dirname(process.mainModule.filename),
                pkg = path.join(folder,"package.json"),
                json,vers;
            try {    
                json = fs.readFileSync(pkg);
                vers=JSON.parse(json).dependencies["tab-calls"].split("#");
                if (vers.length==2) {
                   currentlyDeployedVersion = vers.pop();
                   getCurrentVersion = function() {
                      return currentlyDeployedVersion;
                   };
                   return currentlyDeployedVersion;
                }
            } catch (e) {
                
            }
            
            pkg = path.join(__dirname,"package.json");
            json = fs.readFileSync(pkg);
            vers=JSON.parse(json).version;
            if (typeof vers==='string') {
                currentlyDeployedVersion=vers;
                getCurrentVersion = function() {
                   return currentlyDeployedVersion;
                };
                return currentlyDeployedVersion;
            }
    
            throw new Error ({"error":"could not parse package.json"});
        };
    
        function webSocketNodeStartServer(app,public_path,prefix,init,keys) {
            
            if (
                (typeof process !== 'object') ||
                (typeof module  !== 'object') ||
                (       process.mainModule===module) 
               ) return;
            
    
            console.log("starting wss server");
            keys = keys || ['wakka wakka'];
            
            var expressWs ,
            devices = {},
            
            secrets = {},
            
            remove_device_secret = function (device) {
                if (typeof device==='object' && typeof device.__secretId==='string') {
                    
                    var priorSecrets = secrets[device.__secretId];
                    if (typeof priorSecrets==='object') {
                        delete priorSecrets[device.id];
                        if (Object.keyCount(priorSecrets)===0) {
                            delete secrets[device.__secretId];
                        }
                    }
                    delete device.__secretId;
                }
            },
            
            remove_device = function (device,debug_info) {
                var secretId = device.__secretId;
                // it turns out, if a tab mananges to send a disconnect message
                // the onClose event will find the device already cleaned up
                // as it's possible to get an onClose for other reasons
                // we need check we are not doubling up
                if (secretId) remove_device_secret(device);
                delete devices[device.id];
                delete pair_sessions[device.id];
                if (secretId) { 
                  send_device_secrets(secretId,"removed","remove_device/"+debug_info);
                } else {
                  console.log("ignoring already cleanedup socket in onClose");
                }
            },
            
            // returns true if a change was made
            // deviceId must refer ta valid device (ie must be a key tp devices)
            // secretId is shared "key" to denote device grouping / room id
            // two devices with the same secretId are deemed to be in the same group
            set_device_secret = function (deviceId,secretId,tabs) {
                
                if (typeof deviceId+typeof secretId+typeof tabs==='stringstringobject') {
                    var changed=false,
                    device = devices[deviceId];
                    if (device) {
                        
                        tabs.sort();
                        var tabs_str = JSON.stringify(tabs);
                        
                        if (typeof device.__tabs==='string') {
                            
                            if (device.__tabs !== tabs_str) {
                                delete device.__tabs;
                            }
                            
                        }
                        
                        if (typeof device.__tabs!=='string') {
                            DP(device,{
                                __tabs : {
                                    value : tabs_str,
                                    enumerable:false,
                                    configurable:true,
                                    writable:true
                                }
                            });
                            changed = true;
                        }
                        
                        if (typeof device.__secretId==='string') {
                            
                            if (device.__secretId===secretId) {
                                //console.log("secret",device.__secretId," has not changed for",deviceId);
                                return changed;
                            }
                            
                            remove_device_secret(device);
                        }
                        
                        var newSecrets = (secrets[secretId] = secrets[secretId]||{});
                        newSecrets[deviceId]=device;
                        DP(device,{
                            __secretId : {
                                value:secretId,
                                enumerable:false,
                                configurable:true,
                                writable:true
                            }
                        });
                        //console.log("secret",device.__secretId," has changed for",deviceId);
                                
                        return true;
                    } else {
                        //console.log({type_problem:{set_device_secret:{device:typeof device}}});
                    }
                }
                return false;
                
            },
            
            // returns: { peers : [ ], peerIds : [] }
            // peers is array of {deviceId:"",tabs[],tabIds} in the same group as the deviceId argument
            //   el.deviceId = the id of each device
            //   el.tabs = [] of unqualified tab ids
            //   el.tabIds = [] of fully qualfied device.tab ids for each tab open on the device
            // peerIds is []  of all fully qualified device.tab ids for the grouping
            get_secret_peer_tabs = function (secretId,debug_info) {
                if (typeof secretId==='string' ){
                    var devicePeers = secrets[secretId];
                    if (typeof devicePeers==='object'){
                        var peers = [],peerIds = [];
                        OK(devicePeers).forEach(function(devId){
                            var peer = devicePeers[devId];
                            if (peer.__tabs) {
                                var peer_tabs = [], 
                                temp_tabs=JSON.parse(peer.__tabs);
                                temp_tabs.forEach(function(tabId){
                                    var id = devId+"."+tabId;
                                    peer_tabs.push(id);
                                    peerIds.push(id);
                                });
                                peers.push({
                                    deviceId:devId,
                                    tabs:temp_tabs,
                                    tabIds:peer_tabs
                                });
                            } else {
                                peers.push({
                                    deviceId:devId
                                });
                            }
                            //console.log({devicePeer:devId});
                        });
                        //console.log({get_secret_peer_tabs:true,debug_info:debug_info});
                        return {
                            peers: peers,
                            peerIds:peerIds
                        };
                   // } else {
                    //    console.log({type_problem:{get_secret_peer_tabs:{devicePeers:typeof devicePeers,secretId:secretId,in:Object.keys(secrets)}}});
                    }    
                } else {
                    console.log({type_problem:{get_secret_peer_tabs:{
                        secretId: typeof secretId,
                        debug_info:debug_info
                    }}});
                }
                return {peers:[],peerIds:[]};
            },
            
            server_appGlobals = {
                 boot : Date.now(),
                 ver  : getCurrentVersion(),
                 msg  : getCommitMessage()
            },
            server_appGlobals_json_tail = ',"globals":'+JSON.stringify(server_appGlobals)+'}',
    
            send_device_secrets = function(secretId,notify,debug_info) {
                
                if (!secretId) {
                   return;
                }
                var 
                
                devTabs = get_secret_peer_tabs(secretId,debug_info),
                json    = JSON.stringify({
                    tabs    : devTabs.peerIds,
                    notify  : notify
                });
                
                json=json.substr(0,json.length-1)+',"now":';
                //var comma="",msg = "sent:"+json+" to : [";
                
                devTabs.peers.forEach(function(peer){
                    var dev = devices[peer.deviceId];
                    if (dev && typeof dev==='object' && typeof dev.send==='function') {
                      dev.send(json+Date.now()+server_appGlobals_json_tail);
                      //msg+=comma+peer.deviceId;
                    //} else {
                      //msg+=comma+'[ouch!>>>'+peer.deviceId+'<<<]';  
                    }
                    //comma=",";
                });
                //console.log(msg+"]");
            },
            
            // used to push current [] of device.tab ids as json to all devices in the room , if anthign has changed
            update_device_secret = function (deviceId,secretId,tabs,notify) {
                var old_secretId = devices[deviceId] ? devices[deviceId].__secretId : undefined;
                if (set_device_secret(deviceId,secretId,tabs)){
                    // something has changed as set_device_secret returned true. 
                    //console.log({update_device_secret:{deviceId,secretId,tabs}});
                    send_device_secrets(secretId,notify,"update_device_secret");
                    if (old_secretId) {
                        send_device_secrets(old_secretId,notify,"update_device_secret-old");
                    }
                    return true;
                }
                return false;
            },
            
            get_device_peer = function (deviceId,peerId) {
                if (typeof deviceId+typeof peerId==='stringstring') {
                    var device = devices[deviceId];
                    if (typeof device==='object'&&typeof device.__secretId==='string' ){
                        var devicePeers = secrets[device.__secretId];
                        if (typeof devicePeers==='object'){
                            //console.log({get_device_peer:{deviceId,peerId,returns:devicePeers[peerId]}});
                            return devicePeers[peerId];
                        } else {
                            console.log({types_problem:{get_device_peer:{devicePeers:typeof devicePeers}}});
                        
                        } 
                    } else {
                        console.log({types_problem:{get_device_peer:{device:typeof device,device_secret:device?typeof device.__secretId:"n/a"}}});
                        
                    }
                } else {
                    
                    console.log({types_problem:{get_device_peer:{deviceId:typeof deviceId,peerId:typeof peerId}}});
                }
            },
            
            
            /*get_devices = function () {
                return devices;
            },
            */
            pair_sessions = {},
            start_pair = function (socket_send,deviceId){
                pair_sessions[deviceId]=socket_send;
                console.log("starting pair for ",deviceId);
            },
            
            end_pair = function (deviceId,acceptId,secret,name){
                //let devices = get_devices();
                delete pair_sessions[deviceId];
                console.log("deviceId:",deviceId,"acceptId:",acceptId,"secret:",secret);
                if (acceptId && devices[acceptId] && secret) {
                    var json =  JSON.stringify({acceptedPairing:secret,name:name});
                    devices[acceptId].send(json);
                    console.log("ending pair:",json);
                } else {
                    console.log("acceptId===[",acceptId,"] not found in",OK(devices));
                    console.log("ending pair for ",deviceId);
                }
            },
            
            do_pair = function (deviceId,c){
                var pkt = JSON.stringify({doPair:c,deviceId:deviceId});
                OK(pair_sessions).forEach(function(id){
                    pair_sessions[id](pkt);
                    console.log("trying pair ",pkt);
                });
            },
            
            
            request_cookie_options = {signed: true, httpOnly:false,samesite:true},
    
            getRequestCookie = function (req,res) {
                
                var cookies = new Cookies(req, res, { keys: keys });
                var id = cookies.get(prefix+'DeviceId',request_cookie_options);
                
                if (!id || (id === unregistered_DeviceId) ) {
                    id = remote_tab_id_prefix+randomId(16);
                    //console.log("new ws id",id);
                    //console.log("setting "+prefix+'DeviceId = '+id);
                    cookies.set(prefix+'DeviceId', id, request_cookie_options);
                }
                
                if (!devices[id]){
                    devices[id] = webSocketNodeSender(prefix,id,app,init);
                }
                
                return id;
            },
            
            injectRequestCookies = function (req, res, next) {
               req.messagePrefix = prefix;
               req.messageDeviceId = getRequestCookie(req,res);
               return next();
            };
            
            function webSocketNodeSender (prefix,id, app, init) {
                var
                
                // note these prefixes/suffixes should match those used in localStorageSender()
                path_prefix = prefix+">=>",
                path_suffix = "<=<"+prefix+".",
                path_suffix_length=path_suffix.length,
                WS_DeviceId="node.js",
                self,
                socket_send,
                //associated_peers = {},
                cmdIsLocal     = function (cmd){ 
                    // returns a truthy value if cmd is intended for local consumption, otherwise false
                    // note: will return false if cmd does not confirm to valid format, or is not a string
                    // that truthy value will be a modified version of cmd that removes the localId
                    // this means the returned value (if not false) can be direcly written to localStorage 
                    // as a valid incoming command
                    if (typeof cmd !=='string') return false;
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
                    var leadup = work.substr(0,ix);
                    work = work.substr(ix+1);
                    ix = work.indexOf(".");
                    if (ix<0) return false;
                    if (WS_DeviceId===work.substr(0,ix)) { 
                        return leadup + work.substr(ix+1) + cmd.substr(msg_start);
                    }
                    return false;
                },
                requestInvoker = function (cmd){
                    var localCmd = cmdIsLocal(cmd);
                    if (localCmd) {
                        self.__input(localCmd);   
                    } else {
                        self.send(cmd);
                    }
                },
                jsonHandlers = {
                    
                    '{"WS_Secret":' : // sent 1) on connection and 2) on newSecret
                    function (raw_json){
                        var 
                        
                        payload = JSON.parse(raw_json);
                        
                        if (!update_device_secret(self.id,payload.WS_Secret,payload.tabs,payload.notify)){
                           send_device_secrets(self.__secretId,payload.notify,"jsonHandler");
                        }
    
                    },
                    
                    '{"dest":"node.js"' : function (raw_json){
                          var 
                          
                          payload = JSON.parse(raw_json);
                          
                          console.log("got:",payload);
                          

                     },
                    
    
                    '{"startPair":' :// sent when user switches to show-tap in pairing
                    function (raw_json){
                        try {
                            var p = JSON.parse(raw_json);
                            //let devices = get_devices();
                            if (!devices[self.id]) {
                                console.log(self.id,"is not in devices!");
                            }
                            start_pair (socket_send ,self.id);
                            
                        } catch(e) {
                            
                        }
                    },
                    
                    '{"doPair":' :// sent after each tap in pairing
                    function (raw_json){
                       try {
                           var p = JSON.parse(raw_json);
                           //let devices = get_devices();
                           if (!devices[self.id]) {
                               console.log(self.id,"is not in devices!");
                           }
                           do_pair (self.id,p.doPair);
                       } catch(e) {
                           
                       }   
                    },
                    
                    '{"endPair":' :// sent 1) when user switches away from show tap, 2) when pairing is sucessfull
                    function (raw_json){
                       try {
                           var p = JSON.parse(raw_json);
                           //let devices = get_devices();
                           if (!devices[self.id]) {
                               console.log(self.id,"is not in devices!");
                           }
                           if (!devices[p.endPair]) {
                               console.log("acceptId",p.endPair,"is not in devices!");
                           }
                           end_pair (self.id,p.endPair,p.secret,p.name);
                           
                       } catch(e) {
                           
                       }   
                    },
                    
    
                },
                jsonHandlersDetectKeys=Object.keys(jsonHandlers),
                jsonHandlerDetect = function(raw_json) {
                   
                    var handler = jsonHandlersDetectKeys.reduce(function(located,prefix){
                        return located ? located : raw_json.startsWith(prefix) ? jsonHandlers[ prefix ] : false;
                    },false);
                    //if (handler) {
                        //console.log({jsonHandlerDetect:{raw_json,handler:handler.name}});
                    //}
                    return handler ? handler (raw_json) : false;
                },
                onMessage      = function (event){
                    var peerId = cmdIsRouted(event.data,WS_DeviceId,path_prefix);
                    if(peerId) {
                        if (peerId==="node"){
                            //console.log({"self.__input":event.data});
                            self.__input(event.data);
                        } else {
                            var peer = get_device_peer(self.id,peerId);
                            if (peer) {
                                 //console.log({"peer.send":event.data});
                                 return peer.send(event.data);
                            } else {
                                
                                  console.log("peer not found:",{self_id:self.id,peerId:peerId,WS_DeviceId:WS_DeviceId,path_prefix:path_prefix,data:event.data});
                            }
                        }
                        
                    } else {
                        jsonHandlerDetect(event.data);
                    }
                },
                onClose        = function (event){
                    //console.log("websocket closed:",self.id);
                    socket_send = undefined;
                    remove_device(self,"onClose");
                },
                onError        = function (event){
                    socket_send = undefined;
                    console.log({onError:{
                        error:event.data,code:event.code,
                    }});
                    remove_device(self,"onError");
                };
                
                // create "base class"
                self = pathBasedSendAPI (path_prefix,path_suffix,requestInvoker);
                
                DP(self,{
                    
                    id : {
                        enumerable : false, 
                        writable   : true,
                        value      : id
                    },
                    
                    onOpen : { 
                        enumerable : false,
                        writable   : false,
                        value      : 
                        
                        function(ws,devices){
                            socket_send = ws.send.bind(ws);
                            var payload = [id].concat(Object.keys(devices).filter(function(i){return i!=id;}));
                            var json = JSON.stringify(payload);
                            socket_send(json);
                            ws.addEventListener('message',onMessage);
                            ws.addEventListener('close',onClose);
                            ws.addEventListener('error',onError);
                        }
                    },
                    
                    send : {
                        enumerable : false,
                        writable   : false,
                        value      :
                        
                        function(data){
                            if (typeof socket_send==='function') {
                                socket_send(data);
                            }
                        }
                    }
                    
                });
                return typeof init==='function' ? init(self) : self;
                
            }
    
            if (app.ws) return;// only let this be called once for each app
            
            expressWs = require('express-ws')(app);
            
            app.use(injectRequestCookies);
            
            app.ws('/', function(ws, req,res) {
                
               var device = devices[req.messageDeviceId];     
               if (device) {
                   device.onOpen(ws,devices);
               }
               
            });
            
            setupBrowserFiles(app,public_path,console);
    
        }
    
        module.exports = tabCalls_NodeJS;
        
        console.log("current version:",getCurrentVersion());
        
        return;
        
        function tabCalls_NodeJS(app,public_path,prefix,init){
            webSocketNodeStartServer(
                app,
                public_path,
                prefix || defaultPrefix,
                init   || function(self){return self;}
            );
        }
        
        function null_lines(str){
            var src = str;
            var lines = src.split("\r").map(function(line){
                var lines = line.split("\n").map(function(){return "";});
                return lines.join("\n");
            });
            return lines.join("\r");
        }
        
        function fixupSource(src,replacements) {
            if (typeof replacements==='object') {
                
                OK(replacements).forEach(
                   function (key) {
                       var replaceWith = replacements[key];
                       if (typeof replaceWith==='string') {
                           var fixups = src.split('{$'+key+'$}');
                           if (fixups.length>1) {
                               src = fixups.join(replaceWith);
                           }
                       } else {
                          if (replaceWith===null) {
                              var null_chunks = src.split('//null:'+key);
                              if (null_chunks.length>1) {
                                  null_chunks[1]=null_lines(null_chunks[1]);
                                  src = null_chunks.join('');
                              }
                          }  
                       }
                   }    
                );
            }
            
            return src;
        }
    
        function setupBrowserFiles(app,public_path,console){
            // create browser version of this file - strip out the node.js code
            var UglifyJS = require("uglify-js");
            
            var tab_calls_browser_filename = public_path+"/tab-calls-browser.js";
            var tab_calls_browser_min_filename = public_path+"/tab-calls-browser.min.js";
    
            var self_serve = fs.readFileSync(__filename,"utf-8");
            var self_len = self_serve.length;
            //self_serve = self_serve.split("//omit"+":"+"browserExports");
            //self_serve[1]=null_lines(self_serve[1]);//.splice(1,1);
            //self_serve = self_serve.join("");
            
            self_serve = fixupSource(self_serve,{
                currentlyDeployedVersion : getCurrentVersion(),
                browserExports           : null,
            });
            
            var browser_len = self_serve.length;
            
            fs.writeFileSync(tab_calls_browser_filename,self_serve);
            
            self_serve = UglifyJS.minify(self_serve, {
                parse: {},
                compress: {},
                mangle: false,
                output: {
                    code: true  
                }
            });
            var minified_len = self_serve.code.length;
            fs.writeFileSync(tab_calls_browser_min_filename,self_serve.code);
    
            // install handler for browser version of this file
            app.get('/tab-calls.js', function(request, response) {
               response.sendFile(tab_calls_browser_filename); 
            });
            // install handler for minified browser version of this file
            app.get('/tab-calls.min.js', function(request, response) {
               response.sendFile(tab_calls_browser_min_filename); 
            });
            if(console) {
                console.log({
                    UglifyJS: {
                        original : self_len,
                        browser  : browser_len,
                        browser_minified : minified_len,
                    }
                }); 
            }
    
            delete self_serve.ast;
            delete self_serve.min;
            
            // install handlers for embedded versions of tab-pairing-setup files
            ['/tab-pairing-setup.html','/tab-pairing-setup.css'].forEach(function(fn){
                if (fs.existsSync(public_path+fn)){ 
                  console.log("will serve "+public_path+fn+" when asked for "+fn);
                } else {
                  console.log("will serve "+ __dirname + fn+" when asked for "+fn);
                  app.get(fn, function(request, response){
                    response.sendFile(__dirname + fn); 
                  }); 
                }
            });
        }
    
        //null:browserExports
    }
    
    