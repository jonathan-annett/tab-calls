/*jshint -W030 */ 
/* global pathBasedSenders   */
/* global Object_polyfills   */
/* global Error_toJSON */

/* global Date_toJSON */
/* global Array_polyfills */
/* global String_polyfills */
/* global Proxy_polyfill */
/* global browserExports */
/* global nodeJSExports */

/*included-content-begins*/
// jshint maxerr:10000
// jshint shadow:false
// jshint undef:true 
// jshint browser:true
// jshint node:true
// jshint devel:true

/* global Proxy   */
/* global self   */
/* global define */


if (typeof QRCode==='undefined'&&typeof window!=='undefined') {
    var QRCode;
}



function tabCalls (currentlyDeployedVersion) { 
    
      var tab_id_prefix = "tab_";
      var remote_tab_id_prefix = "ws_";
      var remote_tab_id_delim = "."+tab_id_prefix;
      var no_op = function () {};
      var AP=Array.prototype;// shorthand as we are going to use this a lot.
      var pathBasedSenders = typeof localStorage==='object' ? localStorage : {};
      var Base64 = base64Tools();
      var tmodes = {
          ws      : "tabCallViaWS",
          local   : "tabCallViaStorage",
          remote  : "tabRemoteCallViaWS",
          reqInv  : "requestInvoker"
      };
      
      tmodes.loc_ri_ws = [ tmodes.local, tmodes.reqInv ,tmodes.ws ];
      tmodes.loc_ri    = [ tmodes.local, tmodes.reqInv ];
      
      var globs = {};

      /* main entry vector */
      Error_toJSON();
      Date_toJSON();
      var OK = Object_polyfills().OK,DP=Object_polyfills.DP,HIDE=Object_polyfills.HIDE;
      Array_polyfills();
      String_polyfills();
      Proxy_polyfill();
      
      globalsVarProxy.keys = function () {
          return Object.keys(globs);
      };
      
      return browserExports("messages") || nodeJSExports("messages");
  
      function uncomment(s){
          // comment stripper optimized for removing
          //  /* */ style comments and // style comments
          // from arguments in function declarations
          // don't use this for any other purpose!!!!
          s=s.trim();
          while (s.startsWith('/*')) {
              s = s.substr(s.indexOf("*/")+2);
          }
          while (s.endsWith('*/')) {
              s = s.substr(0,s.lastIndexOf("/*"));
          }
          if (!s.contains("\n")) return s.trim();
          
          return s.split("\n")
            .map(function(x){
                x = x.trim();
                var ix = x.indexOf("//");
                if (ix>=0) {
                  return x.substr(0,ix);                           
                } 
                return x;
            })
             .filter(function(x){return x.length>0;})
               .join("").trim();
      }
      
      function fn_argnames(fn){
          // for given function returns an array of argument names
          if (fn.length===0) return [];
          var src = fn.toString();
          src = src.substr(src.indexOf("(")+1);
          src = src.substr(0,src.indexOf(")"));
          if (fn.length===1) return [uncomment(src)];
          return src.split(",").map(function(x){return uncomment(x);});
      }
      
      function fn_check_call_info(fn){
          var argnames = fn_argnames(fn);
          if (argnames[0]==="callInfo") return (fn._need_call_info=true);
          return false;
      }
      
      //modifed from https://stackoverflow.com/a/6573119/830899
      function base64Tools(){return {
      
          _Rixits :
      //   0       8       16      24      32      40      48      56     63
      //   v       v       v       v       v       v       v       v      v
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
          // You have the freedom, here, to choose the glyphs you want for 
          // representing your base-64 numbers. The ASCII encoding guys usually
          // choose a set of glyphs beginning with ABCD..., but, looking at
          // your update #2, I deduce that you want glyphs beginning with 
          // 0123..., which is a fine choice and aligns the first ten numbers
          // in base 64 with the first ten numbers in decimal.
      
          // This cannot handle negative numbers and only works on the 
          //     integer part, discarding the fractional part.
          // Doing better means deciding on whether you're just representing
          // the subset of javascript numbers of twos-complement 32-bit integers 
          // or going with base-64 representations for the bit pattern of the
          // underlying IEEE floating-point number, or representing the mantissae
          // and exponents separately, or some other possibility. For now, bail
          fromNumber : function(number) {
              if (isNaN(Number(number)) || number === null ||
                  number === Number.POSITIVE_INFINITY)
                  throw "The input is not valid";
              if (number < 0)
                  throw "Can't represent negative numbers now";
      
              var rixit; // like 'digit', only in some non-decimal radix 
              var residual = Math.floor(number);
              var result = '';
              while (true) {
                  rixit = residual % 64;
                  // console.log("rixit : " + rixit);
                  // console.log("result before : " + result);
                  result = this._Rixits.charAt(rixit) + result;
                  // console.log("result after : " + result);
                  // console.log("residual before : " + residual);
                  residual = Math.floor(residual / 64);
                  // console.log("residual after : " + residual);
      
                  if (residual === 0)
                      break;
                  }
              return result;
          },
      
          toNumber : function(rixits) {
              var result = 0;
              // console.log("rixits : " + rixits);
              // console.log("rixits.split('') : " + rixits.split(''));
              rixits = rixits.split('');
              for (var e = 0; e < rixits.length; e++) {
                  // console.log("_Rixits.indexOf(" + rixits[e] + ") : " + 
                      // this._Rixits.indexOf(rixits[e]));
                  // console.log("result before : " + result);
                  result = (result * 64) + this._Rixits.indexOf(rixits[e]);
                  // console.log("result after : " + result);
              }
              return result;
          }
          
      }; }
      
      function randomId(length,nonce_store,stash,id_prefix,last_id){
          /*
              length - required      => how many chars needed in the id
              nonce_store - optional => a keyed object to check if the random id already exists in as a key
              stash - optional       => if provided along with nonce_store, an object to place in nonce store under the generated key
                                        (note: the object's toString will be used to store() the object)
                                        if not provided, and nonce_store is provided, the boolean value true will be stored there instead 
              id_prefix - optional   => if provided, a string value to prefix the returned id (also used as key in nonce_store, if provided)
              last_id - optional     => if provided, and 
          */
          nonce_store = typeof nonce_store==='object'?nonce_store:false;
          
          var id_remover = function(prevent_reuse){
              delete nonce_store[stash.id];
              if (prevent_reuse===true){
                  // prevent_reuse:true means this nonce, 
                  // can't be used again, ever
                  nonce_store[stash.id]=false;
              } else {
                  if (typeof prevent_reuse==='number'){
                      // prevent_reuse:number means this nonce, 
                      // can't be used again for number milliseconds
                      nonce_store[stash.id] = Date.now() + prevent_reuse;
                  }
              }
              delete stash.id;
              delete stash._remove_id;
          };
          
          if (nonce_store && stash && stash.id && nonce_store[stash.id]==stash) return stash.id;
          if (typeof last_id==='string' && stash && nonce_store && nonce_store[last_id]===undefined) {
              DP(stash,{
                  id : {
                      value :       last_id,
                      enumerable:   true,
                      configurable: true,
                      writable:     true,
                  },
                  _remove_id : {
                      value:        id_remover,
                      enumerable:   false,
                      configurable: true,
                      writable:     true,
                  }
                  
              });
              nonce_store[stash.id]=stash;
              return last_id;
          } else {
              id_prefix = id_prefix || '';
              var x,r = "";
              length=typeof length==='number'?(length<4?4:length>2048?2048:length):16;
              var start = 0,
              result = '';
              while ( r.length<length||
                       
                        (nonce_store &&
                        
                          ( 
                            nonce_store[result]===false ||
                            (typeof nonce_store[id_prefix+result]==='number' && Date.now()<nonce_store[id_prefix+result]) ||
                            (typeof nonce_store[id_prefix+result]==='object')
                          )
                     ) 
                    ) {
                     r+=Base64.fromNumber(Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER));
                     //r+=Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);
                     start = Math.floor((r.length/2)-length/2);
                     result = r.substr(start,length);
              }
              
              
              if (nonce_store) nonce_store[id_prefix+result]=stash||true;
              
              if (typeof stash==="object") {
                  DP(stash,{
                      id : {
                          value:        id_prefix+result,
                          enumerable:   true,
                          configurable: true,
                          writable:     true,
                      },
                      _remove_id : {
                          value:        id_remover,
                          enumerable:   false,
                          configurable: true,
                          writable:     true,
                      }
                  });
              }
              
              return result;
          }
      }
      
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
      
      function set_local(k,v,id){
          return __set_local__1(k,v,id,__set_local__0(k,v,id));
      }
      
      function set_local_legacy(k,v,id){
          var js   = localStorage[id];
          var locs={};
          try {if (js) locs = JSON.parse(js);} catch(e){}
          locs["~"+k]=locs[k];
          locs[k]=v;
          localStorage[id] = JSON.stringify(locs);
          return v;
      }

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
            return js ? JSON.parse(js)[k] : v;
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
      
      function globalsVarProxy (key) {
        return globs[key];
      }
      /*
      function randomBase36Id(length){
          length=typeof length==='number'?(length<4?4:length>2048?2048:length):16;
          var r = '';
          while (r.length<length) {
             r+=Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);
          }
          return r.substr(Math.floor((r.length/2)-length/2),length);
      } 
  
      function randomBase64Id(length,needJS){
          length=typeof length==='number'?(length<4?4:length>2048?2048:length):16;
          var r = '';
          while (r.length<length) {
             r+=Base64.fromNumber(Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER));
          }
          var start  = Math.floor((r.length/2)-length/2);
          if(needJS) {
              // suffle until first char is not a number
              while ("0123456789".indexOf(r.charAt(start))>=0) {
                  var x = Math.floor(Math.random()*r.length);
                  r=r.substr(x)+r.substr(0,x);
              }
             
          }
          return r.substr(start,length);
      }
      */
      function isSenderId(k){
          var m;
          if (k.startsWith(tab_id_prefix)) {
              m = get_local("mode",undefined,k);
              return tmodes.loc_ri_ws.contains(m);
          }
          if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
              if (!m) m = get_local("mode",undefined,k);
              return [ tmodes.remote ].contains(m);
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
      /*
      function remoteSenderIds(){
          return OK(localStorage).filter(isRemoteSenderId);
      }
      */
      function isLocalSenderId(k){
          if (k.startsWith(tab_id_prefix)) {
              return tmodes.loc_ri_ws.contains(get_local("mode",undefined,k));
          }
          return false;
      }
      
      function localSenderIds(){
          return OK(localStorage).filter(isLocalSenderId);
      }
      
      function isStorageSenderId(k){
          if (k.startsWith(tab_id_prefix)) {
              
              return tmodes.loc_ri .contains(get_local("mode",undefined,k));
          }
          return false;
      }
      
      function storageSenderIds(){
          return OK(localStorage).filter(isStorageSenderId);
      }
      
            function pathBasedSendAPI(prefix,suffix,requestInvoker,b4data,last_id){
    
        b4data = b4data||4;
        
        var inline_callback_wrapper = function(callInfo){
                var fnPkt = this;
                var fn = fnPkt.wrapped_fn;
                // unless coder has specifically set _need_call_info in the function defintion
                // we don't inject it. this so promises and other code that expect functions to be
                // in a specific format will not break
                var cb_args = callInfo.args;
                if (fn._need_call_info) {
                    //console.log("adding call info... "+fn.name)
                    cb_args.unshift(callInfo);
                }
                
                if (fn._persistent) {
                    // coder has specified this function is persistent
                    // this means it's up to them to clean it up
                    // and we don't restrict who can call it
                    return fn.apply(fnPkt.context,cb_args);
                } else {
                    // as this is an inline callback, assume 1 call from each
                    // destination address - ignore calls from anyone else
                    var ix = fnPkt.dest.indexOf(callInfo.from);
                    if (ix<0) {
                        return;
                    }
                    fnPkt.dest.splice(ix,1);
                    if (fnPkt.dest.length===0) {
                        if (fnPkt._remove_id) fnPkt._remove_id();
                    }
                    return fn.apply(fnPkt.context,cb_args);
                }
                
            };
            
        var self = {};
        
        var self_props = {
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
                 value: function (dest,fn) {
                    var 
                    call_args=AP.slice.call(arguments,2),
                    on_result,
                    resulted,
                    result_once,
                    notify=function(inf){
                        var res_args = fn_check_call_info(on_result) ? [{
                            from:inf.from,
                            fn:fn,
                            args:call_args,
                            result:inf.args[0],
                        }].concat(inf.args) : inf.args;
                        on_result.apply(this,res_args);
                        on_result=undefined;
                        resulted=undefined;
                    },
                    do_on_result = function (callInfo) {
                        if (typeof on_result==='function') {
                            notify(callInfo);
                        } else {
                            resulted=callInfo;
                        }
                    };
                    callPublishedFunction(
                        dest,
                        fn,
                        call_args,
                        do_on_result,
                        self.__local_funcs,
                        prefix,suffix,
                        self.id,
                        requestInvoker
                    );
                    return {
                        result : function (fn) {
                            
                            if (result_once) return;
                            result_once=true;
                            
                            on_result = typeof fn==='function'?fn:undefined;
                            if (on_result && resulted) {
                                notify(resulted);
                            }
                        }
                    };
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
             
         };

        var self_proxy = {
            get : function (moi,key) {
                if (self.__local_funcs[key] && self.__local_funcs[key].fn) {
                    return self.__local_funcs[key].fn;
                }
                return moi[key];
            },
            set : function (moi,key,fn) {
                if (typeof fn === 'function') {
                    var ev;
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
        };

        DP(self,self_props);
        
        randomId(12,pathBasedSenders,self,tab_id_prefix,last_id);

        return new Proxy(self,self_proxy);
        
        function deepCopier (obj) {
            return JSON.parse.bind(JSON,JSON.stringify(obj));
        }

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

        function decodeWrapperObject( fn_store, prefix, suffix, local_id, requestInvoker,v) {
                
           if (v[0].D==='a' && v[0].t==='e' && typeof v[1]['@']==='number') {
               return new Date (v[1]['@']);
           }
           
           if (v[0].$==='N' && v[0].a==='N' && v[1]['@']==='NaN') {
               return NaN;
           }
           
           if (v[0].n==='u' && v[0].l==='l' && v[1]['@']==='null') {
               return null;
           }
           
           if (v[0].I==='n' && v[0].f==='i' && 
               v[0].n==='i' && v[0].t==='y' &&
               v[1]['@']==='Infinity') {
               return Infinity;
           }
           
        
           if (  v[0].F==='u' && v[0].n==='c' && 
                 v[0].n==='c' && v[0].t==='i' &&
                 v[0].o==='n' && typeof v[1]['@']==='string') {
               return function (){
                   var args = AP.slice.call(arguments);
                   callPublishedFunction(
                       [ this.data.from ], // array of endpoint[s] to handle the call
                       v[1]['@'],             // what the endpoint published the function as 
                       args,                  // arguments to pass ( can include callbacks)
                       undefined,             // optional callback to receive return value (called async)
                       fn_store,              // object to hold any callbacks or on_result functions passed in
                       prefix,suffix,         // wrapper to go before and after the payload - note that the suffix may have extra random bytes appended as a nonce
                                              // prefix can be used to filter the keys, suffix is for quicker parsing
                       local_id,
                       requestInvoker
                   );
        
               }.bind(this);
        
           }
           return v;
        }
        
        function parseFunctionCallJSON(payload_string, fn_store, prefix, suffix, local_id, requestInvoker,context){
    
            var fix = decodeWrapperObject.bind(context,     fn_store, prefix, suffix, local_id, requestInvoker);
            try {
                
                var functionArgReviver = function  (k,v) {
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
                             typeof v[1]==='object' &&
                             typeof !!v[1]['@']     && 
                             typeof v[0]==='object' ) {
                                 
                                 return fix(v);// fix is bound to context, which ultimately 
                                               // will contain the object being parsed
                                               // by the time any callbacks get invoked
                                               // data.from will tell us who the caller is
                             }
                             
                        return v;
                    };
                var ix = payload_string.indexOf(prefix);
                if (ix<0) return;
        
                var work = payload_string.substr(ix+prefix.length+b4data);
                ix = work.indexOf(suffix);
                if (ix<0) return;
                var json = work.substr(0,ix);
                
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
                    prefix,suffix,         // wrapper to go before and after the payload - note that the suffix may have extra random bytes appended as a nonce
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
    
    
            
    
        function callPublishedFunction(
            destinations,          // array of endpoint[s] to handle the call
            publishedFunctionName, // what the endpoint published the function as 
            args,                  // arguments to pass ( can include callbacks)
            on_result,             // optional callback to receive return value (called async)
            fn_store,              // object to hold any callbacks or on_result functions passed in
            prefix,suffix,         // wrapper to go before and after the payload - note that the suffix may have extra random bytes appended as a nonce
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
                copyDest = deepCopier(destinations);
                
                var 
                functionArgReplacer = function(k,x){
                     switch (typeof x) {
                         case "function" :
                             
                             fn_check_call_info(x);
                
                             var fnPkt = 
                             {
                                wrapped_fn : x,
                                dest:copyDest(),
                                fn_this:fn_this
                             };
                             
                             // give the callback a unique id
                             randomId(4,fn_store,fnPkt,'cb-'+inv_id+'-');
                             fnPkt.fn=inline_callback_wrapper.bind(fnPkt);
                             fnPkt.fn._need_call_info=true;    
                             return [{'F':'u','n':'c','t':'i','o':'n'},{'@':fnPkt.id}];
                         case "object" :
                             if (x===null) {
                                return [{'n':'u','l':'l'},{'@':'null'}];
                             }
                             
                             if (x.constructor===Date) {
                                return [{'D':'a','t':'e'},{'@':x.getTime()}];
                             }
                             
                             return x;
                         case "number" :
                             if (isNaN(x)) {
                                return [{'$':'N','a':'N'},{'@':'NaN'}];
                             }
                             
                             if (x===Infinity) {
                                return [{'I':'n','f':'i','t':'y'},{'@':'Infinity'}];
                             }
                         return x;
                     default: return x;
                     }
                },
            
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
                        prefix+ randomId(b4data)+
                        payload1+payload2+payload3+payload4+
                        suffix+Date.now().toString(36)
                    );
                };
                
                if (on_result) {
                    payloadData.r = randomId();
                    fn_check_call_info(on_result);
                    fn_store[payloadData.r]={fn : on_result,dest :copyDest()};
                }
                
                
                payload1 = '{"dest":"';
                //payload2 = <each dest_id>
                payload3 = '",';
                payload4 =  JSON.stringify_dates(payloadData,functionArgReplacer).substr(1);
    
                destinations.forEach(dispatch_payload);
                
            }
        
        
        function publishFunction (
            fn_name,
            fn,
            fn_store) {
            fn._persistent = true;
            fn_check_call_info(fn);
            fn_store[fn_name] = {fn : fn,dest :[]};
        }
        
    }
      /*excluded:{"before":"/*jshint maxerr:10000\u002a/ \n/*jshint shadow:false\u002a/ \n/*jshint undef:true\u002a/   \n/*jshint devel:true\u002a/   \n\n/*global\n       \n       OK,DP,AP,\n       randomId,no_op,tab_id_prefix,\n       cmdIsRouted,\n       pathBasedSendAPI,pathBasedSenders,\n       Proxy,\n       fn_check_call_info,\n       \n\u002a/\n\n/*included-content-begins\u002a/\n","after":""}*/

/*included file ends:"pathBasedSendAPI.js"*/

      
      function console_log(){ 
          var args = AP.slice.call(arguments);
          console.log.apply(console,args);
          if (window.console_log) {
              return window.console_log.apply(this,args);
          }
      }
      /*
      function keyValueStore(api,def) {
          
          /*
          
          original strategy - 
             on startup, each tab created proxies for other tabs,which asked for vars 
             on tabs closing/opening each tab identified new tabs and asked them for thier contents
                     also removeded cached tabs that had closed.
             on data change, tab broadcast change to all connected tabs, and 
             if for some reason tab did not have proxy 
             
             local : local kvs
             remote : { store = remote kvs, proxy : remote proxy}
                     
          new strategy
          
            on startup, each tab announces it's presense and default vars to all tabs connected
            on data change, each tab broadcasts change to all connected tabs
            proxy object auto creates proxy for remote tabs when asked by caller
            proxy for remote tabs interogate received 
            
          * /
        
        var 
          __set_tab_kvs = "__set_tab_kvs",
          __set_tab_kv  = "__set_tab_kv",
          this_local_id = api.id,
          this_full_id  = full_tab_id(this_local_id),
          local         = def || {} , // this tab's key value pairs
          remote        = {},         // { "tab_id" : { store: {}, proxy : [Object]  } 
          watch         = {};         // callbacks = { "key"  ; [fn,fn,fn] }


        // __set_tab_kv invoked by remote tab to update this tab's copy of the remote key value pairs
        api[__set_tab_kvs] = setTabKeyValues;
         
         
         // __set_tab_kv invoked by remote tab to update another tab's key value pair
         // ( may also be setting a key/value for this tab )
 
        api[__set_tab_kv] = setTabKeyValue;
       
        
       
        var onchange_once=true;
        
        api.addEventListener("change",function(){
            
            if (onchange_once) {
                onchange_once=false;
                // send default starting values to other tabs.    
                otherTabIds(function(local_id){
                    api.tabs[local_id][__set_tab_kvs](this_full_id,local).result(function(retval){
                        //console_log(JSON.stringify({__set_tab_kvs:{results:retval,from:local_id}}));
                    });
                });
            }
            
           // a remote tab has been added or removed
           // send our values to any new tabs...
           this_local_id = api.id;
           this_full_id  = full_tab_id(this_local_id);
           
           newTabs(function(new_tab_id){ 
               console_log(new_tab_id+" appears to be new - sending self keys");
                 
               remote[new_tab_id] = { };
               
               api.tabs[new_tab_id][__set_tab_kvs](this_full_id,local).result(function(vs){
                  if (vs===null||!vs) {
                      console_log(JSON.stringify({__set_tab_kvs:{warning:"null values",from:new_tab_id}}));
                  } else {
                      console_log(JSON.stringify({__set_tab_kvs:{results:vs,from:new_tab_id}}));
                      remote[new_tab_id].store = vs;
                      OK(vs).forEach(function(k){notifier(full_tab_id(new_tab_id),k,vs[k]);});
                  }
              });
           });
           
           deletedTabs(function(tab_id){ 
               console_log(tab_id+" appears to have been deleted");
               if (remote[tab_id].store) delete remote[tab_id].store;
               if (remote[tab_id].proxy) delete remote[tab_id].proxy;
               delete remote[tab_id];
           });
        });

        return {
          local               : makeLocalProxy(),
          tabs                : makeTabsProxy(),
          addEventListener    : addKeyValueEventListener,
          removeEventListener : removeKeyValueEventListener
        };

        function otherTabIds (ech,flt,map) {
          var list = api.__senderIds.filter(
              function(id){
                  return id!==api.id;
              }
          ); 
          if (flt) list=list.filter(flt);
          if (ech) list.forEach(ech);
          return map ? list.map(map) : list;
        }
        
        function newTabs(ech,flt,map) {
            return otherTabIds (ech,function(local_id){
                if (flt) if (!flt(local_id)) return false;
                return !remote[full_tab_id(local_id)];
            },map);
        }
        
        function deletedTabs(ech,flt,map) {
            var list = OK(remote).filter(function(local_id){
                if (flt) if (!flt(local_id)) return false;
                var tab_id = full_tab_id(local_id);
                return !api.tabs[local_id]; 
            },map);
            if (ech) list.forEach(ech);
            return map ? list.map(map) : list;
        }
        
        function setTabKeyValues(callInfo,tab_id,vs) {
           // alt_tab_id() is either the local part of the id, or the full id
           var local_id=alt_tab_id(tab_id);// also validates tab_id as fully qualified
       
           // the tab needs to exist
           if (api.tabs[local_id]) {
               
             // autocreate /update the remote store for the tab
             if(!remote[tab_id]) {
                remote[tab_id]={store : vs};
             } else {
                remote[tab_id].store = vs;
             }
             
             // update any notification triggers for each key
             OK(vs).forEach(function(k){notifier(tab_id,k,vs[k]);});
             
             return local;
           }
        }
        
        function setTabKeyValue(callInfo,tab_id,k,v) {
             if (tab_id===this_full_id) {
                //console_log(JSON.stringify({__set_tab_kv:{from:callInfo.from,local:{k:k,v:v}}}));
                local[k]=v;
             } else {
                // alt_tab_id() is either the local part of the id, or the full id
                var local_id=alt_tab_id(tab_id);// also validates tab_id as fully qualified
                   
                if (api.tabs[local_id]) {
                     if(!remote[tab_id]) {
                        remote[tab_id]={store : {}};
                     }
                     remote[tab_id].store[k]=v;
                     //console_log(JSON.stringify({__set_tab_kv:{from:callInfo.from,remote:{id:tab_id,k:k,v:v}}}));
                }
             }
             
             notifier (tab_id,k,v);
        }
        
        function full_tab_id(id) {
            return id.contains(".") ? id : api.WS_DeviceId+"."+id;
        }
        
        function alt_tab_id(tab_id) {
            if (!tab_id || !tab_id.contains(".")) throw(tab_id+" is not a fully qualified id");
            
            var parts=tab_id.split(".");
            if (parts[0]===api.WS_DeviceId) {
                return parts[1];
            } else {
                return tab_id;
            }
        }
        
        function addKeyValueEventListener(e,fn) {
           if (watch[e]) {
             watch[e].add(fn); 
           } else {
             watch[e] = [fn];  
           }
        }
        
        function removeKeyValueEventListener(e,fn) {
           if (watch[e]) {
               watch[e].remove(fn); 
               if (watch[e].length===0) {
                  delete watch[e];
               }
           }
        }
        
        function notifier (tab_id,k,v) {
            if (tab_id && tab_id.indexOf(".")<0) throw(tab_id+" is not a fully qualified id");
            var notify = watch[k];
            if (notify) {
              notify.forEach(function(fn){
                 fn(tab_id,k,v);
              });
            }
        }
        
        function makeLocalProxy() {
          
          return new Proxy ({},{
              get : function (x, k) {
                 return local[k];
              },
              set : function (x, k,v) {
                 local[k]=v;
                 var this_tab_id = full_tab_id(api.id);
                 otherTabIds(function(local_id){
                      var tab_id = full_tab_id(local_id);
                      var peer = api.tabs[local_id];
                      if (peer) {
                          peer[__set_tab_kv](this_tab_id,k,v);
                      } else {
                          //console_log(JSON.stringify({"localProxy.set":{warning:"no peer",id:tab_id,k:k,v:v}}));
                      }
                 });
                 notifier(undefined,k,v);
                 return true;
              },
           });
          
        }
        
        function makeRemoteProxy(tab_id) {
          return new Proxy({},{

              get : function (x,k) {
                 return remote[tab_id].store[k];
              },
              set : function (x,k,v) {
                 //console_log(JSON.stringify({"remoteProxy.set":{id:tab_id,k:k,v:v}}));
                 if (!remote[tab_id].store) remote[tab_id].store={};
                 remote[tab_id].store[k]=v;
                 otherTabIds(function(other_id){
                    api.tabs[other_id][__set_tab_kv](tab_id,k,v);
                 });
                 notifier(tab_id,k,v);
                 return true;
              }

          });
        }
        
        function makeTabsProxy() {
            return new Proxy ({},{
               get : function (x,local_id) {
                  var 
                  tab_id=full_tab_id(local_id),
                  peer = api.tabs[local_id];
                  if (peer) {
                     
                     if (!remote[tab_id]) {
                       remote[tab_id]={store : {}, proxy : makeRemoteProxy(tab_id)}; 
                     }
                     return remote[tab_id].proxy;
    
                  } else {
                    
                     if (remote[tab_id]) {
                       if ( remote[tab_id].proxy) delete remote[tab_id].proxy;
                       if ( remote[tab_id].store) delete remote[tab_id].store;
                       delete remote[tab_id];
                     }
    
                  }
    
               },
               set : function () {
                 // the virtual tab proxy itself is read only
                 return false;
               }
            });
        }

      }
      */
      function isWebSocketId(k){
          if (k.startsWith(tab_id_prefix)) {
              return get_local("mode",undefined,k) === tmodes.ws;
          }
          return false;
      }
      
      function webSocketIds(){
          return Object.keys(localStorage).filter(isWebSocketId);
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
      
      function cmdSource(cmd){
          // generalized extraction of from field in formal JSON
          // this is optimized and assumes the from field is near the end of the JSON
          // and does not include escaped characters
          if (typeof cmd !== 'string') return false;
          var scan = '"from":"';
          var ix = cmd.lastIndexOf(scan);
          if (ix < 0) return false;
          var work = cmd.substr(ix+scan.length);
          ix = work.indexOf('"');
          if (ix < 0) return false;
          return work.substr(0,ix);
      }
      
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
            
            function tabVarProxy (key,self_id) {
               return get_local(key,undefined,self_id);
            }
            //notifyChangeUpdate
            tabVarProxy.write = function (key,value,self_id,notify,get_tab_ids,remote_notify) {
                var locs = __set_local__0(key,value,self_id);
                (tabVarProxy.write[locs.mode]||__set_local__1)(key,value,self_id,locs,notify,get_tab_ids,remote_notify);
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
                                
                             checkVariableNotifications(tab_ids);
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
                        tab_ids.peers.forEach(function(tab_id){
                            //if (tab_ids.all.some(function(peer){
                            //    return peer != tab_id;
                            //})) {
                                console.log({calling:{fn:"__notifyPeerChange",remote_tab_id:tab_id,from_tab_id:self.id}});
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
            set_local("mode",requestInvoker.name,self.id);
            
            DP(self,{
                
                defaults : {
                    value        : defaults,
                    enumerable   : false,
                    configurable :true,
                    writable     :true
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
                                               variables : browserVariableProxy(self.__tabVarProxy,dest,localStorage.WS_DeviceId+"."+dest,self.id,storageSenderIds),
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
                    value : browserVariableProxy(self.__tabVarProxy,self.id,localStorage.WS_DeviceId+"."+self.id,self.id,storageSenderIds)
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
                            return id.startsWith("ws_") && id.contains(".")  && get_local("mode",undefined,id)=== tmodes.remote;
                        });
                        
                        // ensure the ids in the list are currently in localStorage
                        payload.tabs.forEach(function(full_id){
                            // we want to remove (and not add!) any remote keys that are already represented
                            // as local keys (ie any that begin with this device id+".")
                            if (!full_id.startsWith(ignore)) {
                                staleRemoteIds.remove(full_id);
                                set_local("mode",tmodes.remote,full_id);
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
                       set_local("mode",tmodes.ws,self.id);
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
                var 
                notifyFN =self.tabs[tab_id].variables.__notifyChanges;
                return function(k){
                    notifyFN(k,changed[k],function(){ 
                        console.log({notifyFN:{k:k,v:changed[k],tab_id:tab_id}});
                        return true;
                        
                    });    
                };
            }
            
            function notifyPeerChanges(callInfo,tab_changes) {
                  // called from web socket master tab
                  // when any other local tabs has changed 
                  //console.log({notifyPeerChanges:{callInfo:callInfo,tab_changes:tab_changes}});
                   
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
                      
                    case "__notifyChanges" : return notifyChangeUpdate;
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
                        case "__notifyChanges" : return false;
                        case "__object" : {
                            return notifyChangeUpdate(undefined,val,function(){
                               OK(val).forEach(function(k){
                                   api.write (k,val[k],self_id);
                               });    
                            });
                        }
                    }
                    
                    return api.write (
                        key,val,self_id,
                        notifyChangeUpdate,
                        tab_id===self_id ? get_tab_ids : undefined);

                }
                return false;
            }
    
        }
    
    }

    /*excluded:{"before":"/*jshint maxerr:10000\u002a/ \n/*jshint shadow:false\u002a/ \n/*jshint undef:true\u002a/   \n/*jshint browser:true\u002a/ \n/*jshint devel:true\u002a/   \n\n/*global\n       \n       jsQR_webpack,\n       QRCode_lib,QRCode,\n       Proxy,\n       OK,\n       set_local,get_local,merge_local,\n       pathBasedSendAPI,\n       senderIds, \n       localSenderIds,\n       storageSenderIds,\n       currentlyDeployedVersion,\n       DP,\n       isStorageSenderId,\n       isSenderId,\n       tabsVarProxy,globalsVarProxy,\n       AP,\n       isWebSocketId,\n       webSocketIds,\n       no_op,\n       randomId,\n       cmdIsRouted,\n       cmdSourceFixup,\n       HIDE,tab_id_prefix,\n       console_log,\n       isLocalSenderId,\n       keys_local_changed_f\n\u002a/\nvar globs;\n       \n/*included-content-begins\u002a/\n","after":"/*included-content-ends\u002a/\n\n/*\n\nskip this part\n\n\u002a/"}*/       

/*included file ends:"browserExports.js"*/

    
    "include nodeJSExports.js";
    
    "include polyfills.js";
    
    "include jsQR_webpack.js";
    
    "include QRCode_lib.js";
      
}

tabCalls("{$currentlyDeployedVersion$}");

