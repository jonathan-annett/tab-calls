/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint devel:true*/   

/*jshint -W030*/

/* global
      randomId,
      AP,
      fn_check_call_info,
      no_op,
      DP,
      pathBasedSenders,
      tab_id_prefix,
      Proxy,
      clearTimeout,
      setTimeout,
      setInterval,
      clearInterval,
      getFunctionArgReviver,
      getFunctionArgReviver_compact,
      getFunctionArgReplacer,
      getFunctionArgReplacer_compact,
      
      sent_compacted_flag,
      
      send_compact
      

*/


/*included-content-begins*/

    

    function pathBasedSendAPI(prefix,suffix,requestInvoker,b4data,last_id){
    
        b4data = b4data||4;
        
        var self = {},
        
            /*pathBasedSendAPI implementation*/
            implementation = {
             toString : {
                 value : function(){
                     return requestInvoker.name;
                 },
             },
             __local_funcs : {
                 enumerable:false,
                 writable:false,
                 value : {}
             },
             
             __return_ids : {
                 enumerable:false,
                 writable:true,
                 value : []
             },
             
             __return_ids_max : {
                 enumerable:false,
                 writable:false,
                 value : 16
             },

            __return_ids_max_age : {
                enumerable:false,
                writable:false,
                value : 60*1000
            },
             
             __localizeId : {
                 enumerable:false,
                 writable:true,
                 configurable : true,
                 value : function (id) {return id;}
             },
             
             __localizeIds : {
                 enumerable:false,
                 writable:false,
                 configurable : false,
                 value : function (id) {
                     switch (typeof id) {
                         case 'string' : return self.__localizeId(id);
                         case 'object' :
                             if (id.constructor===Array) {
                                 return id.map(self.__localizeId);
                             }
                             throw new Error ("can't localize this kind of object");
                     }
                     
                     throw new Error ("can't localize a "+typeof id+" id");
                 }
             },
             
             __setIdLocalizer : {
                 value : function(fn,info) {
                     if (typeof fn==='function' && fn.length===1) {
                         delete self.__localizeId;
                         Object.defineProperties(self,{
                         __localizeId : {
                                 enumerable:false,
                                 writable:true,
                                 configurable : true,
                                 value : fn
                             },
                         });
                         console.log("__setIdLocalizer(",typeof fn==='function'?"<function "+fn.name+"('"+fn.length.toString()+"')>":fn,info,")");
                     }
                 }
             },
             
             
             __getFullId :{
                    enumerable:false,
                    writable:true,
                    configurable : true,
                    value : function (id) {return id;}
             },
             
             __setGetFullId : {
                 value : function(fn,info) {
                     if (typeof fn==='function' && fn.length===1) {
                         delete self.__getFullId;
                         Object.defineProperties(self,{
                         __getFullId : {
                                 enumerable:false,
                                 writable:true,
                                 configurable : true,
                                 value : fn
                             },
                         });
                         console.log("__setGetFullId(",typeof fn==='function'?"<function "+fn.name+"('"+fn.length.toString()+"')>":fn,info,")");
                     }
                 }
             },
             
             __define : {
                 enumerable : false,
                 writable   : false,
                 value : function (nm,fn){
                 switch (typeof nm) {
                     case "string":
                         break;
                     case "function":
                         fn = nm;
                         nm = fn.name || "fn_" + randomId();
                         break;
                     default : throw new Error("expecting function name as string, got "+typeof nm);
                 }
                 switch (typeof fn) {
                     case "function":
                         break;
                     default : throw new Error("expecting function, got "+typeof fn);
                 
                 }
                 publishFunction(nm,fn,self.__local_funcs);
             }},
             __call : {
                 enumerable:false,
                 writable:false,
                 value: function (dest,fn,expect_return) {
                    dest = self.__localizeIds(dest);
                    var 
                    call_args=AP.slice.call(arguments,3),// skip over dest,f,expect_return
                    on_result=false,
                    resulted,
                    result_once,
                    return_fn_id,
                    cleanup_on_result=function(){
                        delete self.__local_funcs[return_fn_id];
                        self.__return_ids.remove(return_fn_id);
                        on_result=false;
                        resulted=undefined;
                    },
                    notify=function(inf){
                        var res_args = fn_check_call_info(on_result) ? [{
                            from:inf.from,
                            fn:fn,
                            args:call_args,
                            result:inf.args[0],
                        }].concat(inf.args) : inf.args;
                        on_result.apply(this,res_args);
                        cleanup_on_result();
                    },
                    do_on_result = function (callInfo) {
                        if (typeof on_result==='function') {
                            notify(callInfo);
                        } else {
                            resulted=callInfo;
                        }
                    };
                    return_fn_id = callPublishedFunction(
                        dest,
                        fn,
                        call_args,
                        expect_return?do_on_result:undefined,
                        self.__local_funcs,
                        //prefix,suffix,
                        self.id,
                        requestInvoker
                    );
                    if (!expect_return) return;
                    var 
                    return_timeout,
                    return_payload = {
                        result : function (rtn_fn) {
                            if (return_timeout) {
                                clearTimeout(return_timeout);
                                return_timeout=undefined;
                            }
                            if (result_once) return;
                            result_once=true;
                            
                            on_result = typeof rtn_fn==='function'?rtn_fn:false;
                            
                            if (!on_result) {
                                if (rtn_fn!==false) {
                                    console.log("invalid result vector for "+fn+":"+typeof rtn_fn);
//                                } else {
  //                                  console.log("timeout applying result vector:"+fn);
                                }
                                cleanup_on_result();
                            } else {
                                if (resulted) {
                                    notify(resulted);
                                }
                            }
                        }
                    };
                    // give local invoker 4 msec to apply a valid result vector
                    // otherwise cleanup the 
                    return_timeout=setTimeout(return_payload.result,4,false);
                    return return_payload;
                }
             },
             
             __on_listeners : {
                 enumerable:false,
                 writable:false,
                 value  : {"change": []}
             },
             
             __on_events : {
                 enumerable:false,
                 writable:false,
                 value  : {"change": no_op}
             },
             
             __on : {
                 enumerable:false,
                 writable:false,
                 value  : function (e) {
                     var args   = AP.slice.call(arguments,1),
                         invoke = function(fn){ fn.apply(this,args);};
                     
                     if (typeof self.__on_events[e]==='function') {
                         invoke(self.__on_events[e]);
                     }
                     if (typeof self.__on_listeners[e]==='object') {
                          self.__on_listeners[e].forEach(invoke);
                     }
                 },
             },
             
             __transmogrifyKey : {
                 enumerable:false,
                 writable:false,
                 value : transmogrifyKey
             },
             
             __destructureKey : {
                 enumerable:false,
                 writable:false,
                 value : destructureKey
             },
             
             __send_compact : {
                 enumerable:false,
                 writable:true,
                 value : !!send_compact,
             },
             
             __getFunctionArgReplacer : {
                 enumerable:false,
                 get : function chooseFunctionArgReplacer() {
                       return self.__send_compact ? getFunctionArgReplacer_compact : getFunctionArgReplacer;
                 },
                 set : function () {}
             },
             
             __sent_compacted_flag : {
                 enumerable:false,
                 get : function chooseFunctionArgReplacer() {
                       return self.__send_compact ? sent_compacted_flag : '';
                 },
                 set : function () {}
             },
             

             on : {
                 enumerable:false,
                 writable:false,
                 value  : function (e,fn) {
                     if (typeof fn==='function') {
                         
                         if (typeof self.__on_events[e]==='function') {
                             self.__on_events[e]=fn;
                         } else {
                             switch (e) {
                                 case "output":
                                     requestInvoker=fn;
                                     break;
                             }
                         }
                     } else {
                         if (typeof self.__on_events[e]==='function') {
                             self.__on_events[e]=no_op;
                         }
                     }
                 },
             },
             onoutput : {
                 set : function (fn) {
                     if (typeof fn==='function') {
                         requestInvoker=fn;
                     }
                 },
                 get : function () {
                     return requestInvoker;
                 }
             },
             
             addEventListener : {
                 enumerable:false,
                 writable:false,
                 value  : function (e,fn) {
                     if (typeof fn==='function') {
                         
                         if (typeof self.__on_events[e]==='function') {
                             self.__on_listeners[e].add(fn);
                         }
                     }
                 },
             },
             
             removeEventListener : {
                 enumerable:false,
                 writable:false,
                 value  : function (e,fn) {
                     if (typeof fn==='function') {
                         if (typeof self.__on_events[e]==='function') {
                             self.__on_listeners[e].remove(fn);
                         }
                     }
                 },
             },
             
             __input : {
                 enumerable:false,
                 writable:false,
                 value : function (payload_string){
                     return processInput(
                         payload_string, 
                         self.__local_funcs, 
                         prefix, suffix, 
                         self.id, 
                         requestInvoker
                     ) ;
                 }
             },
             __parse_input : {
                 
                 /* __parse_input differs from __input in that 
                 
                     any functions refered to in the payload string are not invoked
                     but are instead returned in the fnPkt format
                     (fnPkt is an object containing:
                     
                         wrapped_fn - the "end user" function being called
                         dest - and array of who this call was sent to
                         fn_this - the "this" that wrapped_fn is bound to
                         id - a unique id for this function/closure instance in the case of a callback
                     )
                     
                     note: see __process_parsed_input()
                     combining __process_parsed_input(__parse_input(payload_string)) is
                     the same as callng __input(payload_string)
                     
                 
                 */
                 
                 enumerable:false,
                 writable:false,
                 value : function (payload_string){
                     
                     var context = {
                         // "data" property gets set here after it is parsed
                         // decodeWrapperObject () is bound to context
                     };
                     
                     return parseFunctionCallJSON(
                             payload_string, self.__local_funcs, 
                             prefix, suffix, 
                             self.id, 
                             requestInvoker,
                             context);
                     
                 }
             },
             __process_parsed_input : {
                 /* takes a fnPkt from __parse_input(payload_string) and invokes the function */
                 value : function (fnPkt){
                     if (fnPkt) {
                         invokeFunctionCallObject(fnPkt,self.__local_funcs,self.id);
                     }
                 }
             },
             
             randomId: {
                 enumerable:false,
                 writable:false,
                 value : randomId
             }
             
         },

            /*pathBasedSendAPI proxy_interface*/
            proxy_interface = {
            get : function (moi,key) {
                if (self.__local_funcs[key] && self.__local_funcs[key].fn) {
                    return self.__local_funcs[key].fn;
                }
                return moi[key];
            },
            set : function (moi,key,fn) {
                if (typeof fn === 'function') {
                    if (typeof self.__local_funcs[key] === 'undefined') {
                        moi.__define(key,fn);
                        return true;
                    }
                    return false;
                } else {
                    // not a function
                    moi[key]=fn;
                    return true;
                }
            },
        },
        
        cpArgs = Array.prototype.slice.call.bind (Array.prototype.slice);


        DP(self,implementation);
        
        randomId(12,pathBasedSenders,self,tab_id_prefix,last_id);
        
        return new Proxy(self,proxy_interface);


        function localPathPart(path) {
            var dot = path.indexOf(".");
            if (dot<0) return path;
            return path.substr(dot+1);
        }
        
        function serverPathPart(path) {
            var dot = path.indexOf(".");
            if (dot<0) return undefined;
            return path.substr(0,dot-1);
        }
        
        function canProcess(path,fn_store,this_device) {
            var svr = serverPathPart(path);
            if (!svr) return typeof fn_store[path]!=='undefined';
            if (svr===this_device) {
                return typeof fn_store[localPathPart(path)]!=='undefined';
            }
            
        }
        
        function chooseArgReviver(recv_compact) {
            return recv_compact ? getFunctionArgReviver_compact : getFunctionArgReviver;
        }


        function parseFunctionCallJSON(payload_string, fn_store, prefix, suffix, local_id, requestInvoker,context){
    
            try {
                
                /*var functionArgReviver = function  (k,v) {
                   // invoked by JSON.parse for each value being parsed
                   // we use it to re-insert any callbacks, and some other 
                   // values that are problematic when passing through JSON
                   // eg null, NaN, Date, Infinity
                   // all these insertions happen inside a specific format object 
                   // the main signature being the existence of a key @ inside an object
                   // that is the second element of an array of two objects
                   // there are further validation checks that happen inside fix()/decodeWrapperObject()
                   // to ensure this is not some real data.
                   // wrapper - [ {}, { "@" : ? } ]
                        if ( typeof v === 'object' &&
                                    v !== null &&
                                    v.constructor === Array &&
                                    v.length === 2  &&
                             typeof v[1]==='object' && v[1]!==null && 
                             typeof !!v[1]['@']     && 
                             typeof v[0]==='object' && v[0]!==null) {
                                 
                                 return fix(v);// fix is bound to context, which ultimately 
                                               // will contain the object being parsed
                                               // by the time any callbacks get invoked
                                               // data.from will tell us who the caller is
                             }
                             
                        return v;
                    };*/
                var ix = payload_string.indexOf(prefix);
                if (ix<0) return;
                
                var recv_compact = ix>0 && payload_string.charAt(ix-1)===sent_compacted_flag;

                var work = payload_string.substr(ix+prefix.length+b4data);
                ix = work.indexOf(suffix);
                if (ix<0) return;
                var json = work.substr(0,ix);
                var functionArgReviver = chooseArgReviver(recv_compact)(context,     fn_store, /*prefix, suffix,*/ local_id, requestInvoker);
            
                context.data = JSON.parse(json,functionArgReviver);
                if (
                    typeof context.data      ==='object' &&
                    typeof context.data.fn   ==='string' &&
                    typeof context.data.args ==='object' &&
                           context.data.args.constructor === Array
                ) {
                
                    var fnPkt = fn_store[context.data.fn];
                    if (
                        typeof fnPkt === 'object'&&
                        typeof fnPkt.fn==='function' 
                        ) {
                            // make a copy of the fn_store entry
                            // this is because we need to dirty it with obj
                            fnPkt = {
                                fn      : fnPkt.fn,
                                fn_this : fnPkt.fn_this,
                                obj     : context.data  
                            };
                        return fnPkt;
                    }
                }
                
            } catch (e){
                // silently ignore errors and return undefined        
                console.log("parseFunctionCallJSON.error:",e);
            }
            return false;
        }
        
        function invokeFunctionCallObject(fnPkt,fn_store,local_id) {
            
            var result = 
               fnPkt.fn._need_call_info ? fnPkt.fn.apply(fnPkt.fn_this,AP.concat.apply([fnPkt.obj],fnPkt.obj.args))
                                        : fnPkt.fn.apply(fnPkt.fn_this,fnPkt.obj.args);
                                        
            if (typeof fnPkt.obj.r==='string') {
                
                callPublishedFunction(
                    [ fnPkt.obj.from ],    // array of endpoint[s] to handle the call
                    fnPkt.obj.r,           // what the endpoint published the function as 
                    [result],              // arguments to pass ( can include callbacks)
                    undefined,             // optional callback to receive return value (called async)
                    fn_store,              // object to hold any callbacks or on_result functions passed in
                    //prefix,suffix,         // wrapper to go before and after the payload - note that the suffix may have extra random bytes appended as a nonce
                                           // prefix can be used to filter the keys, suffix is for quicker parsing
                    local_id,
                    requestInvoker
                );
            }
            return fnPkt.obj;
                
        }
        
        function processInput(payload_string, fn_store, prefix, suffix, local_id, requestInvoker) {
            
            var context = {
                // "data" property gets set here after it is parsed
                // decodeWrapperObject () is bound to context
            };
            
            var fnPkt = parseFunctionCallJSON(
                    payload_string, fn_store, 
                    prefix, suffix, 
                    local_id, 
                    requestInvoker,
                    context);
            
            if (fnPkt) {
                invokeFunctionCallObject(fnPkt,fn_store,local_id,context);
            }
    
        }
    
        function getReturnId() {
            return Date.now().toString(16)+"-"+randomId(8);
        }
        
        function returnIdHasExpired(when,r) {
            var age = when-Number.parseInt(r.substr(0,r.indexOf('-')),16);
            return age > self.__return_ids_max_age;
        }
        function returnIdHasNotExpired(info,r) {
            if (info.count>0) {
                var age = info.when-Number.parseInt(r.substr(0,r.indexOf('-')),16);
                if (age > self.__return_ids_max_age) {
                    console.log("removing return func id:",r,Math.floor(age/1000),"seconds old");
                    info.count--;
                    return false;
                }
            }
            return true;
        }
        
        // remove any return collection functions not invoked within 1 minute
        // (but only if there are 16 or more outstanding)
        function trackReturnIds(fn_store,track_list,ret_id) {
            if (ret_id) {
                track_list.push(ret_id);
                if (track_list.length > self.__return_ids_max) {
                    var nuked=0,when = Date.now();
                    track_list
                       .filter(returnIdHasExpired.bind(this,when))
                         .forEach(function(id){
                            delete fn_store[id];
                            nuked++;
                         });
                    if (nuked>0) {
                        console.log('removing',nuked,'expired return ids');
                        track_list.splice.apply(
                            track_list,
                            
                            [0,track_list.length]
                              .concat(
                                  track_list
                                     .filter(returnIdHasNotExpired.bind(this,{when:when,count:nuked}))
                              )
                        );
                    }
                }
            }
        }
        
        
    
        function callPublishedFunction(
            destinations,          // array of endpoint[s] to handle the call
            publishedFunctionName, // what the endpoint published the function as 
            args,                  // arguments to pass ( can include callbacks)
            on_result,             // optional callback to receive return value (called async)
            fn_store,              // object to hold any callbacks or on_result functions passed in
            //prefix,suffix,         // wrapper to go before and after the payload - note that the suffix may have extra random bytes appended as a nonce
                                   // prefix can be used to filter the keys, suffix is for quicker parsing
            local_id,              // who is making the call (for inline callbacks and result calls)
            requestInvoker) {      // function to call with json
            
                switch(typeof destinations) {
                    case 'string': destinations = [destinations]; break;
                    case 'object': if (destinations.constructor===Array) break;
                    throw new Error("expecting destinations as Array, not "+destinations.constructor.name);
                    default:throw new Error("invalid destinaton/destinations");
                }
                switch(typeof args) {
                    case 'object': if (destinations.constructor===Array) break;
                    throw new Error("expecting arguments as Array, not "+destinations.constructor.name);
                    default:throw new Error("invalid arguments type:" +typeof args);
                }
                switch(typeof on_result){
                    case "function":
                    case "undefined":break;
                    default:
                        throw new Error("Expecting on_result as function, not "+typeof on_result);
                }
                switch(typeof fn_store){
                    case "object": break;
                    default:
                       throw new Error("Expecting fn_store as object, not "+typeof fn_store);
                }
                switch(typeof prefix){
                    case "string":break;
                    default:
                       throw new Error("Expecting prefix as string, not "+typeof prefix);
                }
                switch(typeof suffix){
                    case "string":break;
                    default:
                       throw new Error("Expecting suffix as string, not "+typeof suffix);
                }
                switch(typeof local_id){
                    case "string":break;
                    default:
                       throw new Error("Expecting local_id as string, not "+typeof local_id);
                }
                switch(typeof requestInvoker){
                    case "function" :break;
                    default:
                        throw new Error("Expecting requestInvoker as function, not "+typeof on_result);
                }
                
                var 
                fn_this = this,
                inv_id = randomId(12),    // invocation id is used to id callbacks
    
                copyDest = JSON.parse.bind(JSON,JSON.stringify(destinations)),
             
                functionArgReplacer = self.__getFunctionArgReplacer(copyDest,fn_this,fn_store,inv_id),
                
                payload1,
                payload3,
                payload4,
                payloadData = {
                    fn:publishedFunctionName,
                    id:inv_id,
                    args:args,
                    from:local_id
                },
                dispatch_payload = function(payload2){
                    requestInvoker(
                        self.__sent_compacted_flag+prefix+ randomId(b4data)+
                        payload1+payload2+payload3+payload4+
                        suffix+Date.now().toString(36)
                    );
                };
                
                if (on_result) {
                    payloadData.r = getReturnId();
                    
                    fn_check_call_info(on_result);
                    fn_store[payloadData.r]={fn : on_result,dest :copyDest()};
                }
                
                
                payload1 = '{"dest":"';
                //payload2 = <each dest_id>
                payload3 = '",';
                payload4 =  JSON.stringify_dates(payloadData,functionArgReplacer).substr(1);
    
                destinations.forEach(dispatch_payload);
                if (on_result && payloadData.r) {
                    trackReturnIds(fn_store,self.__return_ids,payloadData.r);
                }
                return payloadData.r;
            }
        
        
        function publishFunction (
            fn_name,
            fn,
            fn_store) {
            fn._persistent = true;
            fn_check_call_info(fn);
            fn_store[fn_name] = {fn : fn,dest :[]};
        }
        
        "include @pathBasedSendAPI.js/functionalJSON.js";

        
    }

    function cmdIsRouted(cmd,deviceId,path_prefix){ 
        // returns a truthy value if first quoted field before a comma contains a dot
        // that truthy value will be a string - the part of the field before the dot
        // eg {"dest":"something.here", ---> "something"
        // eg {"dest":"justsomething", ---> false
        // assumes packed json (no spaces between " and ,)
        // assumes first field is "dest"
        if (typeof cmd !=='string') return false;
        if ( !cmd.contains(path_prefix) ) return false;
        var ix = cmd.indexOf('",');
        if (ix<0) {
            return false;
        }
        var work = cmd.substr(0,ix);
        ix = work.lastIndexOf('"');
        if (ix<0) {
            return false;
        }
        work = work.substr(ix+1);
        ix = work.indexOf(".");
        if (ix<0) return false;
        work = work.substr(0,ix);
        if (deviceId===work) return false;
        return work;
    }
    
    function cmdSourceFixup(cmd,deviceId){
        // generalized insertion of device prefix to from field in formal JSON
        // this is optimized and assumes the from field is near the end of the JSON
        // and does not include escaped characters
        
        if (typeof cmd !== 'string') return false;
        var scan = '"from":"';
        var ix = cmd.lastIndexOf(scan);
        if (ix < 0) return false;
        return cmd.substr (0,ix)+scan+deviceId+"."+cmd.substr(ix+scan.length);
    }
    
    function transmogrifyKey(key,when) {
        when=when||new Date();
        var sample=(typeof when==='number'?when:when.getTime()).toString(36);
        var stampFrom = key.lastIndexOf(".");
        if (stampFrom<0) {
            return key+"."+sample;
        }
        var work = key.substr(stampFrom+1).split("-");
        var base;
        work.forEach(function(w,i){
            if (i===0) {
                base = w;
                //deltas.push(0);
            } else {
                base = base.substr(0,base.length-w.length)+w;
            }
        }); 

        for (var i=0;i<base.length;i++) {
                if (base[i]!=sample[i]) {
                    work.push(sample.substr(i));
                    break;
                }
            
        }
        var out = work.join('-');

        return key.substr(0,stampFrom+1)+out;
    }
    
    function makeServerDate(result){
        var offset = result.offset;
        result.ServerDate = function() {
            var nw = function () {
              return Date.now()+offset;
            }, gd = function() { 
                return new Date (nw());
            };
            var d =  gd();
            d.getDate  = gd;
            d.getNow   = nw;
            return d;
        };
    }
    
    function destructureKey (key) {
        var stampFrom = key.lastIndexOf(".");
        var result = {
            fullKey:key,
            key : key.substr(0,stampFrom),
            stamps : [],
            deltas : [],
            roundTrip : 0
        };
        if (stampFrom<0) {
            return result;
        }
        
        var base,work = key.substr(stampFrom+1).split("-");

        work.forEach(function(w,i){
            if (i===0) {
                base = w;
                result.deltas.push(0);
            } else {
                base = base.substr(0,base.length-w.length)+w;
            }
            result.stamps.push(Number.parseInt(base,36));
            if (i>0) {
                result.deltas.push(result.stamps[i]-result.stamps[i-1]);
                result.roundTrip = result.stamps[i]-result.stamps[0];
            }
        });
        
        /*
        
        client to server:
        [ 
         queued@client,
         sent@client,  
         received@server,
         sent@server,
         received@client 
        ]
        
        */
        if (result.stamps.length===5) {
            
            result.queued_at_client     = result.stamps[0];
            result.sent_at_client       = result.stamps[1];
            result.received_at_server   = result.stamps[2];
            result.sent_at_server       = result.stamps[3];
            result.received_at_client   = result.stamps[4];
            
            result.delay_before_send    = result.sent_at_client-result.queued_at_client;
            result.processing_at_server = result.sent_at_server-result.received_at_server;
            
            result.client_roundtrip = result.received_at_client - result.sent_at_client;
            result.transit = result.client_roundtrip - result.processing_at_server;
            result.offset1  = (result.received_at_client - result.sent_at_server) - (result.transit/2);
            result.offset2  = (result.sent_at_client - result.received_at_server) - (result.transit/2);

            result.offset = (result.offset1 + result.offset2) / 2;
            makeServerDate(result);
            
            result.cleanup = function () {
                Object.keys(result).forEach(function(k){
                   if (k==="offset"||k==="ServerDate") return;
                   delete result[k]; 
                });
            };
            
        }
        
        /*
        client to client:
        
        [ 
         queued@client1,
         sent@client1,
         requestRelayed@server,
         received@client2
         sent@client2,
         replyRelayed@server,
         received@client1 
        ]

        */
        
        if (result.stamps.length===8) {
            
            result.queued_at_client1     = result.stamps[0];
            result.sent_at_client1       = result.stamps[1];
            result.relay1_at_server      = result.stamps[2];
            
            result.received_at_client2   = result.stamps[3];
            result.queued_at_client2     = result.stamps[4];
            result.sent_at_client2       = result.stamps[5];
            
            result.relay2_at_server      = result.stamps[6];
            result.received_at_client1   = result.stamps[7];
            
            result.delay_before_send1    = result.sent_at_client1-result.queued_at_client1;
            result.processing_at_client2 = result.queued_at_client2-result.received_at_client2;
            result.delay_before_send2    = result.sent_at_client2-result.queued_at_client2;

            result.server_client2_roundtrip = result.relay2_at_server-result.relay1_at_server;

            result.client1_roundtrip = (result.received_at_client1 - result.sent_at_client1);
            result.transit = result.client1_roundtrip - result.server_client2_roundtrip ;
            result.offset2  = (result.sent_at_client1     - result.relay1_at_server) - (result.transit/2);
            result.offset1  = (result.received_at_client1 - result.relay2_at_server) - (result.transit/2);
            
            result.offset = (result.offset1 + result.offset2) / 2;
            makeServerDate(result);
            
            result.cleanup = function () {
                Object.keys(result).forEach(function(k){
                   if (k==="offset"||k==="ServerDate") return;
                   delete result[k]; 
                });
            };
        
        }
        
        return result;
    }
    
    /*included-content-begins*/

    
    var key = "hello world";
    var n = 6;
    var x = setInterval(function(){
        key = transmogrifyKey(key);
        if (--n<=0) {
            clearInterval(x);
            console.log({key:key,destructureKey:destructureKey(key)});
        }
    },998);
    

