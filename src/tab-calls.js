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
      
    "include browserExports.js";

    "include nodeJSExports.js";
    
    "include polyfills.js";
    
    "include jsQR_webpack.js";
    
    "include QRCode_lib.js";
      
}

tabCalls("{$currentlyDeployedVersion$}");

