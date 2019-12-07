
function tabCalls () {
      
      var tab_id_prefix = "tab_";
      var remote_tab_id_prefix = "ws_";
      var remote_tab_id_delim = "."+tab_id_prefix;
      var no_op = function () {};
      var AP=Array.prototype;// shorthand as we are going to use this a lot.
      var pathBasedSenders = typeof localStorage==='object' ? localStorage : {};
      var Base64 = base64Tools();
      /* main entry vector */
      Error_toJSON();
      Date_toJSON();
      var OK = Object_polyfills().OK,DP=Object_polyfills.DP,HIDE=Object_polyfills.HIDE;
      Array_polyfills();
      String_polyfills();
            
      return browserExports("messages") || nodeJSExports("messages");
  
      function uncomment(s) {
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
      
      function fn_argnames (fn) {
          // for given function returns an array of argument names
          if (fn.length===0) return [];
          var src = fn.toString();
          src = src.substr(src.indexOf("(")+1);
          src = src.substr(0,src.indexOf(")"));
          if (fn.length===1) return [uncomment(src)];
          return src.split(",").map(function(x){return uncomment(x);});
      }
      
      function fn_check_call_info (fn) {
          var argnames = fn_argnames(fn);
          if (argnames[0]==="callInfo") return (fn._need_call_info=true);
          return false;
      }
      
      //modifed from https://stackoverflow.com/a/6573119/830899
      function base64Tools() {return {
      
          _Rixits :
      //   0       8       16      24      32      40      48      56     63
      //   v       v       v       v       v       v       v       v      v
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$_",
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
      
      function randomId(length,nonce_store,stash,id_prefix,last_id) {
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
      
      function randomBase36Id(length) {
          length=typeof length==='number'?(length<4?4:length>2048?2048:length):16;
          var r = '';
          while (r.length<length) {
             r+=Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);
          }
          return r.substr(Math.floor((r.length/2)-length/2),length);
      } 
  
      function randomBase64Id(length,needJS) {
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
      
      function isSenderId(k){
          if (k.startsWith(tab_id_prefix)) {
              return ["tabCallViaStorage","requestInvoker","tabCallViaWS"].contains(localStorage[k]);
          }
          if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
              return ["tabRemoteCallViaWS"].contains(localStorage[k]);
          }
          return false;
      }
      
      function senderIds(){
          return Object.keys(localStorage).filter(isSenderId);
      }
      
      function isRemoteSenderId(k){
          if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
              return ["tabRemoteCallViaWS"].contains(localStorage[k]);
          }
          return false;
      }
      
      function remoteSenderIds(){
          return Object.keys(localStorage).filter(isRemoteSenderId);
      }
      
      function isLocalSenderId(k){
          if (k.startsWith(tab_id_prefix)) {
              return ["tabCallViaStorage","requestInvoker","tabCallViaWS"].contains(localStorage[k]);
          }
          return false;
      }
      
      function localSenderIds(){
          return OK(localStorage).filter(isLocalSenderId);
      }
      
      function isStorageSenderId(k){
          if (k.startsWith(tab_id_prefix)) {
              return ["tabCallViaStorage","requestInvoker"].contains(localStorage[k]);
          }
          return false;
      }
      
      function storageSenderIds(){
          return OK(localStorage).filter(isStorageSenderId);
      }
  
      function pathBasedSendAPI (prefix,suffix,requestInvoker,b4data,last_id) {
      
          function deepCopier (obj) {
              return JSON.parse.bind(JSON,JSON.stringify(obj));
          }
          
          b4data = b4data||4;
          
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
                   enumerable:false,
                   writable:false,
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
               __on_events : {
                   enumerable:false,
                   writable:false,
                   value  : {"change": no_op}
               },
               __on : {
                   enumerable:false,
                   writable:false,
                   value  : function (e) {
                       if (typeof self.__on_events[e]==='function') {
                           var args = AP.slice.call(arguments,1);
                           self.__on_events[e].apply(this,args);
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
               
               //canProcess : {
               //    value :canProcess
               ///},
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
      }
      
      function isWebSocketId(k){
          if (k.startsWith(tab_id_prefix)) {
              return localStorage[k]==="tabCallViaWS";
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
      
      function cmdSourceFixup (cmd,deviceId){
          // generalized insertion of device prefix to from field in formal JSON
          // this is optimized and assumes the from field is near the end of the JSON
          // and does not include escaped characters
          
          if (typeof cmd !== 'string') return false;
          var scan = '"from":"';
          var ix = cmd.lastIndexOf(scan);
          if (ix < 0) return false;
          return cmd.substr (0,ix)+scan+deviceId+"."+cmd.substr(ix+scan.length);
      }
      
      function cmdSource (cmd){
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
  
      function browserExports (defaultPrefix) {
          if  (  (typeof process==='object' ) ||
                 (typeof window!=='object'  ) ||
                 (!this || !this.constructor  || this.constructor.name !== 'Window') 
              ) return false;
        
        
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
              };
      
              function checkStorage(){
                  var 
                  
                  currentKeys = Object.keys(localStorage),
                  key_list = currentKeys.filter(filterTest).map(extractKeyTimestamp);
                  
                  key_list.sort(function(a,b){
                      if (a.when<b.when) return 1;
                      if (a.when>b.when) return -1;
                      return 0;
                  });
                  
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
                      localStorage.setItem(self.id,self.toString());
                      //self.__localStorage_setItem(self.id,self.toString());
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
              
              DP(self,{
                  defaults : {
                      value : defaults,
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
                      writable:false,
                      value : new Proxy ({},{
                            get : function (tabs,dest) {
                                if (isSenderId(dest)) {
                                     if (tabs[dest]) {
                                         return tabs[dest];
                                     } else {
                                         if (localStorage[dest]) {
                                             tabs[dest]= new Proxy({},{
                                                 get : function (tab,nm){
                                                     if (typeof tab[nm]!=='function') {
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
                        }
                      )
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
              WS_DeviceId,   // the deviceId of tabs on this device,
              routedDeviceIds, // an array of deviceIds that can be routed to via websocket
  
              
              cmdIsLocal         = function (cmd){ 
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
                  if (WS_DeviceId===work.substr(0,ix)) { 
                      return leadup + work.substr(ix+1) + cmd.substr(msg_start);
                  }
                  return false;
              },
              
              writeToStorageFunc = function(){},
              
              onCmdToStorage     = function (cmd,writeToStorage){
                  // intercept messages before being written to storage, if they are 
                  // routed (ie not local), send them to websocket instead
                  writeToStorageFunc=writeToStorage||writeToStorageFunc;
                  var device = cmdIsRouted(cmd,WS_DeviceId,path_prefix); 
                  if (device) {
                      var remote_cmd = cmdSourceFixup(cmd,WS_DeviceId);
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
              },
              
              onCmdFromStorage   = function (cmd){
                  // intercept messages detected in storage
                  // if they are routed to another device, send them via websocket
                  // and return undefined, otherwise return the 
                  // item verbatim 
                  // (this function is called from an array filter func to pre-filter cmd
                  //  before testing it for local tab resolution )
                  var device = cmdIsRouted(cmd,WS_DeviceId,path_prefix); 
                  if (device) {
                      var remote_cmd = cmdSourceFixup(cmd,WS_DeviceId);
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
              };
              
              clear_reconnect_timeout();
              
              var 
              self = is_websocket_sender ? localStorageSender(prefix,onCmdToStorage,onCmdFromStorage)
                                         : localStorageSender(prefix);
                                         
              path_prefix = self.__path_prefix;
              
              path_suffix = self.__path_suffix;
              
              var pairingSetup = function() {
                          
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
                          
                          function pairing_html () {/*
                          
<span class="pairing_header">{$pair_setup_title$}<button class="pairing_button_off">{$pair_close_btn$}</button></span>
 <input class="pairing_secret" id="secret" value="unset" name="secret" type="hidden">
 <span class="pairing_button_new_wrap">
     <button class="pairing_button_new"><i class='fas fa-redo' style='font-size:18px;color:blue'></i></button>
     <span>confirm - this will remove connections<button><i class='fas fa-check' style='font-size:18px;color:green'></i></button></span>
 </span>


<div class="pairing_buttons">
    <button class="pairing_button_qr">show-QR</button>
    <button class="pairing_button_scan">scan-QR</button>
    <button class="pairing_button_sms">by&nbsp;sms <i class="fas fa-mobile-alt"></i></button>
    <br>
    <button class="pairing_button_show">show-<i class="fas fa-user-secret"></i></button>
    <button class="pairing_button_tap">tap-<i class="fas fa-user-secret"></i></button>
    <button class="pairing_button_email">by&nbsp;email <i class="    far fa-envelope"></i></button>
</div>
 
  <p class="show_pairing_secret">abcdef</p>
  
 <p class="pairing_name_wrap">
      <label>Your Name</label>
      <input id="your_name" type="text" />
</p>
    
<div class="pairing_video_tophelp">Position the camera to capture<br>the QR code on the other device</div>

<canvas class="pairing_video_canvas"></canvas>

<div class="pairing_qrcode_tophelp">Display QR code so the other device<br>can capture it, and complete the pairing.</div>
<div class="pairing_qrcode"></div>
<div class="pairing_tap_help_general">To pair devices without a camera, tap random symbols to pair the devices</div>
<div class="pairing_show_tap"></div>
<div class="pairing_tap"></div>
<div class="pairing_by_sms">
  <form>
    
   

    <p>
      <label>Phone number to send to</label>
      <table><tr><td><input id="phone" type="tel" /></td><td><span class="sms_number_bad">Invalid Phone Number</span></td></tr></table>
    </p>
    
    <a id="send_sms"  href="#" target="_blank">Send SMS</a><br>
    <pre id="sms_preview"><span></span></pre>
    
    
    <span class="pairing_header">Or... send URL using another app</span>
    
    <table>
      <tr><td><button id="copy_sms_url"  type="button">Copy</button></td><td><span class="sms_email_url_copied">URL copied to clipboard</span></td><td><input id="sms_url" type="text" readonly/></td></td>
    </table>
    
  </form>
</div>
<div class="pairing_by_email">
 <form>
  
    <p>
      <label>Email address to send to</label>
      <input id="email" type="email" />
    </p>
    
    <a id="send_email"  href="#"  target="_blank">Send Email</a><br>
    <pre id="email_preview"><span></span></pre>
    
    <span class="pairing_header">Or... send URL using another app</span>
    
    <table>
      <tr><td><button id="copy_email_url"  type="button">Copy</button></td><td><span class="sms_email_url_copied">URL copied to clipboard</span></td><td>input id="email_url" type="text" readonly/></td></td>
    </table>
    
    
  </form>
</div>


<div class="pairing_show_tap_help">On the other device, choose <button>tap-<i class="fas fa-user-secret"></i></button>, and tap each symbol as it shown here until the devices are paired</div>
<div class="pairing_tap_help">On the other device, choose <button>show-<i class="fas fa-user-secret"></i></button>, then on this device,tap the same image that is shown on the other device, repeating until the devices are paired</div>
                  
                  
 <div class="pair_sms_bottom_help">{$pair_sms_bottom_help$}</div>
 <div class="pair_email_bottom_help">{$pair_email_bottom_help$}</div>
 <div class="pair_scan_bottom_help">{$pair_scan_bottom_help$}</div>
 <div class="pair_qr_bottom_help">{$pair_qr_bottom_help$}</div>
                  
                          */
                              
                          }
                          
                          function pairing_css () {
                            /*
                              
  @media only screen{
      
      
      .pairing_setup {
      
       -webkit-touch-callout:none;
        -webkit-user-select:none;
        -khtml-user-select:none;
        -moz-user-select:none;
        -ms-user-select:none;
        user-select:none;
        -webkit-tap-highlight-color:rgba(0,0,0,0);
      }
      
      #send_sms:hover,#send_email:hover,
      .pairing_setup button:hover {
        background-color: yellow;
      }
      
      .pairing_setup input {
        display: block;
        margin-bottom: 10px;
        padding: 5px;
        width: 100%;
        border: 1px solid lightgray;
        border-radius: 3px;
        font-size: 16px;
      }
      
      #send_sms, #send_email
       {
        padding-top: 4px;
        padding-bottom: 4px;
        padding-left: 8px;
        padding-right: 8px;
      }
      
      #sms_url, #email_url {
        opacity: 0;
        width:4px;
      }
      
      #send_sms, #send_email,
      .pairing_setup button {
        text-decoration: none;
        color:black;
        font-size: 16px;
        border-radius: 3px;
        background-color: lightgray;
        border: 1px solid gray;
        box-shadow: 2px 2px teal;
        cursor: pointer;
        min-width: 100px; 
        min-height: 28px;
      }
      
      
      #send_sms:active,#send_email:active,
      .pairing_setup button:active {
        box-shadow: none;
      }
      
      .sms_email_url_copied {
         display : none;
         background-color : yellow;
         color : black;
      }
      
      span.sms_number_bad {
         display : none;
         background-color : red;
         color : black;
      }
      
      
      body.sms_number_bad span.sms_number_bad,
      body.url_copied .sms_email_url_copied {
         display : block;
      }
 
 
      .pairing_button_on,
      .pairing_setup {
          display : none;
      }
      
      .pairing_setup {
          width: 300px;
      }
      
      .pairing_setup .pairing_secret {
          width: 300px;
      }
      
      
      
      .pairing_setup .pairing_video_canvas {
        width: 300px;
      }
      
      .pairing_setup .pairing_video_output {
        margin-top: 20px;
        background: #eee;
        padding: 10px;
        padding-bottom: 0;
      }
      
      .pairing_name_wrap {
         top: 70px;
         left: 10px;
         position: absolute;
      }
      
      .show_pairing_secret {
         top: 44px;
         left: 10px;
         position: absolute;
      }
      
      .pairing_setup .pairing_video_output div {
        padding-bottom: 10px;
        word-wrap: break-word;
      }
      
      .pairing_setup .pairing_qrcode {
        width:300px;
        height:300px;
        margin-top:15px;
        margin-bottom:15px;
        margin-left:10px;
      }
      
      body.show_qr   .pairing_button_qr,
      body.scan_qr   .pairing_button_scan,
      body.by_sms    .pairing_button_sms,
      
      body.show_tap   .pairing_button_show,
      body.tap_qr     .pairing_button_tap,
      body.by_email .pairing_button_email {
          background-color:aqua;
      }
      
      body.show_qr   .pairing_button_qr:hover,
      body.scan_qr   .pairing_button_scan:hover,
      body.show_sms  .pairing_button_sms:hover,
      
      body.show_tap  .pairing_button_show:hover,
      body.tap_qr    .pairing_button_tap:hover,
      body.show_email .pairing_button_email:hover {
        background-color: aqua;
        
      }
      
      .pairing_buttons,
      .pairing_tap_help,
      .pairing_tap_help_general
      {
          
          width : 320px;
          
      }
      
      .pairing_setup .pairing_button_new,
      .pairing_setup .pairing_button_off {
          position : absolute;
          left: 320px;
          top : 4px;
          width : 32px;
          min-width: 32px;
      }
      
      .pairing_setup .pairing_button_new_wrap span {
          background-color: pink;
          position: absolute;
          left: 8px;
          top: 63px;
          width: 320px;
          height: 70px;
          padding: 6px;
          padding-top: 16px;
          padding-bottom: 16px;
          display : none;
          z-index:9999;
      }
      
      .pairing_setup .pairing_button_new_wrap span button {
         width : 32px;
         min-width: 32px;
      }
      
      .pairing_setup .pairing_button_new_wrap span.showing {
         display : inline-block;
      }
      
      .pairing_setup .pairing_button_new {
          top : 30px;
      }
      
      .pairing_setup .pairing_buttons {
          height : 100px;
      }
      
      body.tap_qr .pairing_setup .pairing_buttons,
      body.show_tap .pairing_setup .pairing_buttons {
        height : 60px;
      }
      
      .pairing_setup .pairing_header {
          
          font-weight:bold;
          
      }
      
      
      .pairing_video_tophelp
      {
         top: 160px;
         left: 10px;
         position: absolute;
      }
      
      .pairing_tap_help_general,
     .pairing_qrcode_tophelp
      {
      
         top: 160px;
         left: 10px;
         position: absolute;
      }
  
     .pairing_qrcode,
     .pairing_video_canvas,
     .pairing_video_output,
     .pairing_show_tap,
     .pairing_tap
      {
      
        top: 200px;
        left: 10px;
        position: absolute;
      }
      
      .pairing_tap_help,
      .pairing_show_tap_help
      {
         top: 500px;
         left: 10px;
         position: absolute;
         width : 320px;
      }
      
      
      body.pairing_off .pairing_setup,
      body.pairing_off .pairing_header,
      body.pairing_off .pairing_secret,
      body.pairing_off .pairing_buttons,
      body.pairing_off .pairing_tap,
      body.pairing_off .pairing_tap_help_general,
      body.pairing_off .pairing_tap_help,
      body.pairing_off .pairing_show_tap_help,
      
      body.pairing_off .pairing_name_wrap,
      body.pairing_off .pairing_qrcode_tophelp,
      body.pairing_off .pairing_qrcode,
      body.pairing_off .pairing_by_sms,
      body.pairing_off .pairing_byemail,
      
      body.pairing_off .pairing_video_tophelp,
      body.pairing_off .pairing_video_canvas,
      body.pairing_off .pairing_video_output,
      
      
      .pair_sms_bottom_help,
      .pair_email_bottom_help,
      .pair_scan_bottom_help,
      .pair_qr_bottom_help,

      
      body.show_tap .main_not_pairing,
      body.show_tap .pairing_button_on,
      body.show_tap .pairing_tap,
      body.show_tap .pairing_tap_help,
      body.show_tap .pairing_qrcode_tophelp,
      body.show_tap .pairing_qrcode,
      body.show_tap .pairing_video_tophelp,
      body.show_tap .pairing_video_canvas,
      body.show_tap .pairing_video_output,
      body.show_tap .pairing_by_sms,
      body.show_tap .pairing_by_email,
      
      
      
      body.tap_qr .main_not_pairing,
      body.tap_qr .pairing_button_on,
      body.tap_qr .pairing_show_tap,
      body.tap_qr .pairing_show_tap_help,
      body.tap_qr .pairing_qrcode_tophelp,
      body.tap_qr .pairing_qrcode,
      body.tap_qr .pairing_video_tophelp,
      body.tap_qr .pairing_video_canvas,
      body.tap_qr .pairing_video_output,
      body.tap_qr .pairing_by_sms,
      body.tap_qr .pairing_by_email,
      
      
      body.scan_qr .main_not_pairing,
      body.scan_qr .pairing_button_on,
      body.scan_qr .pairing_show_tap,
      body.scan_qr .pairing_tap_help_general,
      body.scan_qr .pairing_tap_help,
      body.scan_qr .pairing_show_tap_help,
      body.scan_qr .pairing_tap,
      body.scan_qr .pairing_qrcode_tophelp,
      body.scan_qr .pairing_qrcode,
      body.scan_qr .pairing_by_sms,
      body.scan_qr .pairing_by_email,
      
      body.show_qr .main_not_pairing,
      body.show_qr .pairing_button_on,
      body.show_qr .pairing_show_tap,
      body.show_qr .pairing_tap_help_general,
      body.show_qr .pairing_tap_help,
      body.show_qr .pairing_show_tap_help,
      body.show_qr .pairing_tap,
      body.show_qr .pairing_video_tophelp,
      body.show_qr .pairing_video_canvas,  
      body.show_qr .pairing_video_output,
      body.show_qr .pairing_by_sms,
      body.show_qr .pairing_by_email,
      
      
      body.by_sms .main_not_pairing,
      body.by_sms .pairing_button_on,
      body.by_sms .pairing_tap,
      body.by_sms .pairing_tap_help,
      body.by_sms .pairing_tap_help_general,
      body.by_sms .pairing_show_tap_help,
      body.by_sms .pairing_qrcode_tophelp,
      body.by_sms .pairing_qrcode,
      body.by_sms .pairing_video_tophelp,
      body.by_sms .pairing_video_canvas,
      body.by_sms .pairing_video_output,
      body.by_sms .pairing_by_email,
      
      body.by_email .main_not_pairing,
      body.by_email .pairing_button_on,
      body.by_email .pairing_tap,
      body.by_email .pairing_tap_help,
      body.by_email .pairing_tap_help_general,
      body.by_email .pairing_show_tap_help,
      body.by_email .pairing_qrcode_tophelp,
      body.by_email .pairing_qrcode,
      body.by_email .pairing_video_tophelp,
      body.by_email .pairing_video_canvas,
      body.by_email .pairing_video_output,
      body.by_email .pairing_by_sms
      
      {
              display:none;
      }
      
      
      body.by_sms .pair_sms_bottom_help {
          display : block;
          position:absolute;
          bottom : 10px;
          left: 10px;
      }
      body.by_email .pair_email_bottom_help {
      
          display : block;
          position:absolute;
          bottom : 10px;
          left: 10px;
      }
      body.scan_qr .pair_scan_bottom_help {
          display : block;
          position:absolute;
          bottom : 10px;
          left: 10px;
      }
      body.show_qr  .pair_qr_bottom_help {
          display : block;
          position:absolute;
          bottom : 10px;
          left: 10px;
      }
      
      
      .pairing_show_tap,
      .pairing_tap {
          
          width : 300px;
      }
      
      .pairing_show_tap {
          text-align:center;
          vertical-align:middle;
      }
      
      .keypad {
          text-align:center;
          vertical-align:middle;
      }
      
      .keypad i {
          
          width : 50px;
          height : 50px;
          padding-top: 8px;
      }
      
      #sms_preview {
         background: #fff7005e;
      }

  
  }
  
  @media only screen and (max-width:70em) {
  
      .pairing_setup {
          width: 100vw;
      }
      
  
      .pairing_buttons,
      .pairing_tap_help,
      .pairing_tap_help_general,
      .pairing_show_tap_help{
          
          width : 100vw;
          
      }
      
      .pairing_setup .pairing_button_new,
      .pairing_setup .pairing_button_off  {
          right: 4px;
          left: unset;
      }
      
      
      .pairing_tap  {
          
          width : 100vw;
      }
      
      
      .keypad  {
          
          width : 100vw;
      }
      
      
      .pairing_buttons {
          height : 15vh;
      }
      
  
  }
  
  */
                          }
  
                          addCss(src(pairing_css));
                
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


                          var pr_html = src(pairing_html);
                
                          [ "pair_setup_title",
                            "pair_sms_bottom_help",
                            "pair_email_bottom_help",
                            "pair_scan_bottom_help",
                            "pair_qr_bottom_help",
                           ,"pair_close_btn"
                           ].forEach(function(tag) {
                            var rep = self.defaults[tag];
                            if (rep) {
                               pr_html = pr_html.split('{$'+tag+'$}').join(rep);
                            }
                            
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
                                      setTimeout(next,5000,(step+1) % passCode.length);
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
                                  
                          var qrcode = new /*global QRCode*/QRCode(qs(".pairing_setup .pairing_qrcode"), {
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
                              
                              qs(".show_pairing_secret").innerHTML = "<b>Map Id</b>:#"+localStorage.WS_Secret;
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
                                    setTimeout(start,10);
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
                                if (self.__senderIds.length === 1) {
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
                  
                      };
              
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
              function connect (){
                  
                  var protocol = location.protocol==='https:' ? 'wss:' : 'ws:';
                  var socket = new WebSocket(protocol+'//'+location.host+'/');
                  
                  var
                  reconnect = function (){
                      if (reconnect_timer) clearTimeout(reconnect_timer);
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
                          reconnect_timer = setTimeout(connect,Math.min(maxTimeout,(reconnect_timeout+=reconnect_timeout))+reconnect_fuzz);
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
                          var ignore = WS_DeviceId+".",
                          payload = JSON.parse(raw_json),
                          // collect a list of current remote ids, which we will update to 
                          // represent those ids that are no longer around
                          staleRemoteIds = Object.keys(localStorage).filter(function(id){
                              return id.startsWith("ws_") && id.contains(".")  && localStorage[id]==="tabRemoteCallViaWS";
                          });
                          
                          // ensure the ids in the list are currently in localStorage
                          payload.tabs.forEach(function(full_id){
                              // we want to remove (and not add!) any remote keys that are already represented
                              // as local keys (ie any that begin with this device id+".")
                              if (!full_id.startsWith(ignore)) {
                                  staleRemoteIds.remove(full_id);
                                  localStorage.setItem(full_id,"tabRemoteCallViaWS");
                                  //self.__localStorage_setItem(full_id,"tabRemoteCallViaWS");
                              }
                          });
                          
                          //anything left in staleRemoteIds should not be in local storage
                          staleRemoteIds.forEach(function(id){ localStorage.removeItem(id);});
                          localStorage.setItem(zombie_key,Date.now());
                          
                          self.__on("change");
                          
                          if (payload.notify) {
                              self.__on("newsecret",payload.notify);
                          }
                          
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
                          
                          WS_DeviceId   = routedDeviceIds.shift();
                          socket.removeEventListener('message', onConnectMessage);    
                          socket.addEventListener('message', onMessage);
                          WS_Secret = getSecret ();//localStorage.WS_Secret;
                          if (!WS_Secret || WS_Secret.length !== 32) {
                              WS_Secret = randomId(32);
                              self.__localStorage_setItem("WS_Secret",WS_Secret);
                          }
                          //localStorage.WS_DeviceId = WS_DeviceId;
                          self.__localStorage_setItem("WS_DeviceId",WS_DeviceId);
                          
                          socket_send = socket.send.bind(socket);
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
                  WS_Secret =  getSecret ();
                  
              }
              
              var lastSenderIds;
              
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
              zombie_period=2000,zombie_half_life=zombie_period/2,
              zombie_suffix=".ping",
              zombie_key=self.id+zombie_suffix,
              zombie_filter = function(zombie){
                   return zombie!==zombie_key&&zombie.endsWith(zombie_suffix);
              },
              lone_ranger_filter = function(zombie){
                   return zombie!==zombie_key&&
                          zombie.startsWith(tab_id_prefix)&&
                          !zombie.endsWith(zombie_suffix)&&
                          !localStorage.getItem(zombie+zombie_suffix);
              },
              shotgun=function(zombie){localStorage.removeItem(
                  zombie.split(zombie_suffix)[0]
              );},
              zombie_ping = function () {
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
                  zombie_timer = setTimeout(zombie_ping,zombie_half_life);
              },
              
              stop_zombie_ping=function (){
                  if (zombie_timer) clearTimeout(zombie_timer);
                  zombie_timer=undefined;
              };
              
              
              
              
              
              function checkReconnect(currentKeys){
                  
                  if (!zombie_timer) zombie_timer= setTimeout(zombie_ping,100);
                  
                  var storageSenderIds = currentKeys.filter(isStorageSenderId);
                  storageSenderIds.sort();
                  var is_first = (storageSenderIds[0]===self.id);
                  var webSocketIds = currentKeys.filter(isWebSocketId);
                  if (webSocketIds.length===0) {
                      if (is_first) {
                         is_websocket_sender = true;
                         self.__usePassthroughInvoker(onCmdToStorage,onCmdFromStorage);
                         localStorage[self.id]="tabCallViaWS";
                         //self.__localStorage_setItem(self.id,"tabCallViaWS");
                         connect();
                         return true;
                      }
  
                  }
                  
                  return false;
              }
              
              function checkSenderList(currentKeys) {
                  
                  if (!is_websocket_sender|| typeof socket_send!=='function') return;
                  
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
              }
  
              function checkStorage (){
  
                  var currentKeys = OK(localStorage);
                  
                  if (checkReconnect(currentKeys)) return;
                  
                  checkSenderList(currentKeys);
  
                  // if the local secret has changed update the ui
                  if(WS_Secret !== localStorage.WS_Secret) {
                      WS_Secret = localStorage.WS_Secret;
                      self.__on("change");
                  }
              }
              
              function onStorage (e) {
                  if(e.storageArea===localStorage) {
                      checkStorage ();
                  }
              }
              
              function onBeforeUnload (e) {
                  window.removeEventListener('storage',onStorage);
                  stop_zombie_ping();
                  if (is_websocket_sender) {
                      delete localStorage[self.id];
                      if (typeof socket_send === 'function') {
                          // main reason this might not defined is because this event
                          // is called twice in some browsers - beforeunload & unload
                          // android does not call beforeunload, and sometimes unload is not 
                          // called on other browsers, so we call it on both events
                          socket_send(JSON.stringify({WS_Secret:WS_Secret,tabs:localSenderIds()}));
                      }
                  }
              }
              
              window.addEventListener('storage',onStorage);
              
              window.addEventListener('beforeunload',onBeforeUnload);
              
              
              checkStorage ();
              
              return self;
          }    
              
          this.localStorageSender = localStorageSender;
          
          this.webSocketSender = webSocketBrowserSender;
      }
  
      function nodeJSExports(defaultPrefix) {
          if (typeof process!=='object') return false;
          if (typeof module!=='object') return false;
          if (!this || !this.constructor || this.constructor.name !== 'Object') return false;
  
          function webSocketNodeStartServer(app,prefix,init,keys) {
              
              if (
                  (typeof process !== 'object') ||
                  (typeof module  !== 'object') ||
                  (       process.mainModule===module) 
                 ) return;
              
              console.log("starting wss server");
              keys = keys || ['wakka wakka'];
              
              var expressWs ;
              var Cookies = require('cookies'),
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
              
              remove_device = function (device) {
                  var secretId = device.__secretId;
                  remove_device_secret(device);
                  delete devices[device.id];
                  delete pair_sessions[device.id];
                  send_device_secrets(secretId,"removed");
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
              get_secret_peer_tabs = function (secretId) {
                  if (typeof secretId==='string' ){
                      var devicePeers = secrets[secretId];
                      if (typeof devicePeers==='object'){
                          var peers = [],peerIds = [];
                          Object.keys(devicePeers).forEach(function(devId){
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
                          return {
                              peers: peers,
                              peerIds:peerIds
                          };
                     // } else {
                      //    console.log({type_problem:{get_secret_peer_tabs:{devicePeers:typeof devicePeers,secretId:secretId,in:Object.keys(secrets)}}});
                      }    
                  } else {
                      console.log({type_problem:{get_secret_peer_tabs:{
                          secretId: typeof secretId
                      }}});
                  }
                  return {peers:[],peerIds:[]};
              },
  
              send_device_secrets = function(secretId,notify) {
                  var devTabs = get_secret_peer_tabs(secretId);
                  var json    = JSON.stringify({tabs:devTabs.peerIds,notify:notify});
                  var comma="",msg = "sent:"+json+" to : [";
                  devTabs.peers.forEach(function(peer){
                      devices[peer.deviceId].send(json);
                      msg+=comma+peer.deviceId;
                      comma=",";
                  });
                  console.log(msg+"]");
              },
              
              // used to push current [] of device.tab ids as json to all devices in the room , if anthign has changed
              update_device_secret = function (deviceId,secretId,tabs,notify) {
                  var old_secretId = devices[deviceId] ? devices[deviceId].__secretId : undefined;
                  if (set_device_secret(deviceId,secretId,tabs)){
                      // something has changed as set_device_secret returned true. 
                      //console.log({update_device_secret:{deviceId,secretId,tabs}});
                      send_device_secrets(secretId,notify);
                      if (old_secretId) {
                          send_device_secrets(old_secretId,notify);
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
                      console.log("acceptId===[",acceptId,"] not found in",Object.keys(devices));
                      console.log("ending pair for ",deviceId);
                  }
              },
              do_pair = function (deviceId,c){
                  var pkt = JSON.stringify({doPair:c,deviceId:deviceId});
                  Object.keys(pair_sessions).forEach(function(id){
                      pair_sessions[id](pkt);
                      console.log("trying pair ",pkt);
                  });
              },
              
              
              getRequestCookie = function (req,res) {
                  
                  var cookies = new Cookies(req, res, { keys: keys });
                  
                  var id = cookies.get(prefix+'DeviceId', { signed: true });
                  
                  if (!id) {
                      id = "ws_"+randomId(16);
                      //console.log("new ws id",id);
                      //console.log("setting "+prefix+'DeviceId = '+id);
                      cookies.set(prefix+'DeviceId', id, { signed: true });
                  }
                  
                  //let devices = get_devices();
                  
                  if (!devices[id]){
                      devices[id] = webSocketNodeSender(prefix,id,app,init);
                      //console.log({getRequestCookie:{devices:{added:id,keysNow:Object.keys(devices).join(",")}}});
                  }
                  
                  return id;
              };
              
              function webSocketNodeSender (prefix,id, app, init) {
                  var
                  
                  // note these prefixes/suffixes should match those used in localStorageSender()
                  path_prefix = prefix+">=>",
                  path_suffix = "<=<"+prefix+".",
                  path_suffix_length=path_suffix.length,
                  WS_DeviceId="server",
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
                      var localCmd = cmdIsLocal(event.data);
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
                             send_device_secrets(self.__secretId,payload.notify);
                          }
  
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
                          var peer = get_device_peer(self.id,peerId);
                          if (peer) {
                              //console.log("peer msg relayed:",deviceId,event.data);
                              return peer.send(event.data);
                          } else {
                              console.log("peer not found:",peerId);
                          }
                      } else {
                          var cmd = cmdIsLocal(event.data);
                          if (cmd) {
                              self.__input(cmd);   
                          } else {
                              // pure json messages get handled here
                              jsonHandlerDetect(event.data);
                          }
                      }
                  },
                  onClose        = function (event){
                      console.log("websocket closed:",self.id);
                      socket_send = undefined;
                      remove_device(self);
                  },
                  onError        = function (event){
                      socket_send = undefined;
                      console.log({onError:{
                          error:event.data,code:event.code,
                      }});
                      remove_device(self);
                  };
                  
                  // create "base class"
                  self = pathBasedSendAPI (path_prefix,path_suffix,requestInvoker);
                  
                  DP(self,{
                      
                      id : {
                          enumerable:false, writable:true,value : id
                      },
                      
                      onOpen : { 
                          enumerable:false,
                          writable:false,
                          value:function(ws,devices){
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
                          enumerable:false,writable:false,value:function(data){
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
              
              app.use(function (req, res, next) {
                req.messagePrefix = prefix;
                req.messageDeviceId = getRequestCookie(req,res);
                return next();
              });
              
              app.ws('/', function(ws, req,res) {
                  
                 var device = devices[req.messageDeviceId];     
                 if (device) {
                     device.onOpen(ws,devices);
                 }
                 
              });
  
          }
     
          module.exports = function(app,prefix,init){
              webSocketNodeStartServer(
                  app,
                  prefix || defaultPrefix,
                  init   || function(self){return self;}
              );
          };
          //module.exports.startServer = module.exports;
      }
  
      /* toJSON polyfills */
      function Error_toJSON() {
          if (!('toJSON' in Error.prototype)) {
              Object.defineProperty(Error.prototype, 'toJSON', {
                  value: function () {
                      var alt = {};
              
                      Object.getOwnPropertyNames(this).forEach(function (key) {
                          alt[key] = this[key];
                      }, this);
              
                      return alt;
                  },
                  configurable: true,
                  writable: true
              });
          }
          return true;
      }
      
      function Date_toJSON () {
          // this is NOT a polyfill in the normal sense
          // instead it installs to additional methods to Date:
          // JSON_on and JSON_off, to allow disabling the normal JSON.stringify behaviour
          // this is needed if have to use a replacer function that wishses to encode Date differnently
          // otherwise you are simply given a preencoded date as a string, and would need to parse every
          // string to determine if it was in fact a date. by deleting the toJSON method before calling 
          // JSON.stringify() you are instead presented with a normal Date instance (an Object with constructor Date)
          // this is far quicker to detect. to acheive this quickly, the original toJson prototype
          // is backed up into a defineProperties payload ready to be shimmed at will
          
          // for convenience, a JSON.stringify_dates wrapper function is added
          // to allow calling of JSON.stringify with Date.JSON_off() called first
          if (typeof JSON.stringify_dates === 'undefined') {
              Object.defineProperties(JSON,{
                  stringify_dates : {
                      value : function (obj,replacer,spaces) {
                          if (typeof Date.prototype.toJSON==='undefined') {
                              // already turned off
                              return JSON.stringify(obj,replacer,spaces);
                          }    
                          try {
                              Date.JSON_off();
                              return JSON.stringify(obj,replacer,spaces); 
                          } finally {
                              Date.JSON_on();
                          } 
                      }
                  }
              });
          }
          
          // we only want to invoke the following backup code once, so exit early if we
          // have called this function before.
          if (typeof Date.JSON_off==='function') return true;
          
          var restore_Date_prototype_toJSON = typeof Date.prototype.toJSON==='function' ? {
              toJSON: {
                  value        : Date.prototype.toJSON,
                  enumerable   : false,
                  configurable : true,
                  writable     : true
              }
          } : false;
          
          // note - we are extending the Date class here, not Date.prototype (ie not instances of Date but Date itself)
          Object.defineProperties(Date,{
              JSON_off : {
                  enumerable   : false,
                  configurable : true,
                  writable     : true,
                  value : function () {
                          if (restore_Date_prototype_toJSON) {
                              // we need stringify to let functionArgReplacer have the date object verbatim
                              // so delete toJSON from Date.prototype
                              delete Date.prototype.toJSON;
                          }
                      
                  } 
              },
              JSON_on : {
                  enumerable   : false,
                  configurable : true,
                  writable     : true,
                  value : function () {
                          if (restore_Date_prototype_toJSON) {
                              Object.defineProperties(Date.prototype,restore_Date_prototype_toJSON);
                          }
                  }
              }
          }); 
          
          return true;
      }
      
      function Object_polyfills() {
          var c=0,polyfills = {};
          if (!Object.keyCount) {
              c++;
              polyfills.keyCount = {
                  enumerable:false,
                  configurable:true,
                  value :function(o) {
                    if (o !== Object(o))
                      throw new TypeError('Object.keyCount called on a non-object');
                    var p,c=0,isKey=Object.prototype.hasOwnProperty.bind(o);
                    for (p in o) if (isKey(p)) c++;
                    return c;
                  }
              };
          }
          if (!Object.keys) {
              c++;
              polyfills.keys = {
                  enumerable:false,
                  configurable:true,
                  value :function(o) {
                       if (o !== Object(o))
                         throw new TypeError('Object.keys called on a non-object');
                       var p,k=[],isKey=Object.prototype.hasOwnProperty.bind(o);
                       for (p in o) if (isKey(p)) k.push(p);
                       return k;
                   }
              };
          }
          if (c>0) {
              Object.defineProperties(Object,polyfills);
          }
          
          c=0;polyfills={};
          if (!Object.prototype.removeKey) {
              c++;
              polyfills.removeKey = {
                  enumerable:false,
                  configurable:true,
                  value : function(k){
                      var res = this[k];
                      if (res!==undefined) {
                          delete this[k];
                          return res;
                      }
                  }
              };
          }
          if (!Object.prototype.replaceKey) {
              c++;
              polyfills.replaceKey = {
                  enumerable:false,
                  configurable:true,
                  value : function(k,v){
                      var res = this[k];
                      this[k]=v;
                      return res;
                  }
              };
          }
          if (!Object.prototype.removeAllKeys) {
              c++;
              polyfills.removeAllKeys = {
                  enumerable:false,
                  configurable:true,
                  value : function(){
                      var res = Object.keys(this);
                      res.forEach(function(k){
                          delete this[k];
                      });
                      return res;
                  }
              };
          }
          if (!Object.prototype.mergeKeys) {
              c++;
              polyfills.mergeKeys = {
                  enumerable:false,
                  configurable:true,
                  value : function(obj,keys,keep){
                      keys = keys||Object.keys(obj);
                      keys.forEach(function(k){
                          if (keep && this[k]!==undefined) return;
                          this[k]=obj[k];
                      });
                      return keys;
                  }
              };
          }
          if (!Object.prototype.subtractKeys) {
              c++;
              polyfills.subtractKeys = {
                  enumerable:false,
                  configurable:true,
                  value : function(keys,isObject){
                      var res={};
                      keys = isObject ? Object.keys(keys) : keys;
                      keys.forEach(function(k){
                          if (this[k]) {
                              res[k]=this[k];
                              delete this[k];
                          }
                      });
                      return res;
                  }
              };
          }
          
          if (!Object.prototype.iterateKeys) {
              c++;
              polyfills.iterateKeys = {
                  enumerable:false,
                  configurable:true,
                  value : function(fn){
                      Object.keys(this).some(function(k,i,ks){
                          try {
                              fn(k,this[k],i,ks);
                              return false;
                          } catch (e) {
                              return true;
                          }
                      });
                  }
              };
          }
          
          if (c>0) {
              Object.defineProperties(Object.prototype,polyfills);
          }
          Object_polyfills.OK=Object.keys.bind(Object);
          Object_polyfills.DP=Object.defineProperties.bind(Object);
          Object_polyfills.HIDE=function (o,x,X){
                Object.defineProperty(o,x,{
                    enumerable:false,
                    configurable:true,
                    writable:false,
                    value : X
                }); 
                return X;
          };
          return {
              OK   : Object_polyfills.OK,
              DP   : Object_polyfills.DP,
              HIDE : Object_polyfills.HIDE
          };
          
      }
      
      function Array_polyfills() {
          
          var c=0,polyfills = {};
          
          if (!Array.prototype.remove) {
              c++;
              polyfills.remove = {
                  enumerable:true,
                  configurable:true,
                  value :function(o) {
                      // remove all instances of o from the array
                      var ix;
                      while ( (ix=this.indexOf(o)) >= 0 ) {
                          this.splice(ix,1);
                      }
                  }
              };
          }
          
          if (!Array.prototype.contains) {
              c++;
              polyfills.contains = {
                  enumerable:true,
                  configurable:true,
                  value :function(o) {
                      // return true if o exists (somewhere, at least once) in the array
                      return this.lastIndexOf(o) >= 0;
                  }
              };
          }
          
          if (!Array.prototype.add) {
              c++;
              polyfills.add = {
                  enumerable:true,
                  configurable:true,
                  value :function(o) {
                      // if o does not exist in the array, add it to the end
                      if (this.indexOf(o) < 0) {
                          this.push(o);
                      }
                  }
              };
          }
          
          if (!Array.prototype.toggle) {
              c++;
              polyfills.toggle = {
                  enumerable:true,
                  configurable:true,
                  value :function(o) {
                      // if o does not exist in the array, add it to the end and return true
                      // if o exists in the array, remove ALL instances and return false
                      var ix,result = (ix=this.indexOf(o)) < 0;
                      if (result) {
                          this.push(o);
                      } else {
                          while ( ix >= 0 ) {
                              this.splice(ix,1);
                              ix=this.indexOf(o);
                          }
                      }
                      return result;
                  }
              };
          }
          
          if (!Array.prototype.replace) {
              c++;
              polyfills.replace = {
                  enumerable:true,
                  configurable:true,
                  value :function(oldValue,newValue) {
                      // replace all instances of oldValue in the array with newValue
                      if (!oldValue || oldValue===newValue) return;// idiot checks
                      
                      var ix;
                      while ( (ix=this.indexOf(oldValue)) >=0 ) {
                          this.splice(ix,1,newValue);
                      }
                  }
              };
          }
          
          
          if (!Array.prototype.item) {
              c++;
              polyfills.item = {
                  enumerable:true,
                  configurable:true,
                  value :function(ix) {
                      return this[ix];
                  }
              };
          }
          
          if (c>0) {
              Object.defineProperties(Array.prototype,polyfills);
          }
          
      }
       
      function String_polyfills() {
          var c=0,polyfills = {};
          
          if (!String.prototype.contains) {
              c++;
              polyfills.contains = {
                  enumerable:true,
                  configurable:true,
                  value :function(s) {
                      // return true if s exists (somewhere, at least once) in the string
                      return this.lastIndexOf(s) >= 0;
                  }
              };
          }
          
          if (c>0) {
              Object.defineProperties(String.prototype,polyfills);
          }
      }
  
  }

/**
 * ES6 Proxy Polyfill
 * @version 1.2.1
 * @author Ambit Tsai <ambit_tsai@qq.com>
 * @license Apache-2.0
 * @see {@link https://github.com/ambit-tsai/es6-proxy-polyfill}
 */

(function (context) {
    if (context.Proxy) return; // return if Proxy already exist

    var noop = function () {},
        assign = Object.assign || noop,
        getProto = Object.getPrototypeOf || noop,
        setProto = Object.setPrototypeOf || noop;

    /**
     * Throw a type error
     * @param {String} message
     */
    function throwTypeError(message) {
        throw new TypeError(message);
    }

    /**
     * The internal member constructor
     * @constructor
     * @param {Function} target
     * @param {Object} handler
     */
    function InternalMember(target, handler) {
        this.target = target; // [[ProxyTarget]]
        this.handler = handler; // [[ProxyHandler]]
    }

    /**
     * The [[Call]] internal method
     * @param {Object} thisArg
     * @param {Object} argsList
     */
    InternalMember.prototype.$call = function (thisArg, argsList) {
        var target = this.target,
            handler = this.handler;
        if (!handler) {
            throwTypeError('Cannot perform \'call\' on a proxy that has been revoked');
        }
        if (handler.apply == null) {
            return target.apply(thisArg, argsList);
        } else if (typeof handler.apply === 'function') {
            return handler.apply(target, thisArg, argsList);
        } else {
            throwTypeError('Proxy handler\'s apply trap must be a function');
        }
    };

    /**
     * The [[Construct]] internal method
     * @param {Object} thisArg
     * @param {Object} argsList
     * @returns {Object}
     */
    InternalMember.prototype.$construct = function (thisArg, argsList) {
        var target = this.target,
            handler = this.handler,
            result;
        if (!handler) {
            throwTypeError('Cannot perform \'construct\' on a proxy that has been revoked');
        }
        if (handler.construct == null) {
            result = target.apply(thisArg, argsList);
            return result instanceof Object ? result : thisArg;
        } else if (typeof handler.construct === 'function') {
            result = handler.construct(target, argsList);
            if (result instanceof Object) {
                return result;
            } else {
                throwTypeError('Proxy handler\'s construct trap must return an object');
            }
        } else {
            throwTypeError('Proxy handler\'s construct trap must be a function');
        }
    };

    /**
     * Create a Proxy object
     * @param {Function} target
     * @param {Object} handler
     * @param {Object} revokeResult
     * @returns {Function}
     */
    function createProxy(target, handler, revokeResult) {
        // Check the type of arguments
        if (typeof target !== 'function') {
            throwTypeError('Proxy polyfill only support function target');
        } else if (!(handler instanceof Object)) {
            throwTypeError('Cannot create proxy with a non-object handler');
        }

        // Create an internal member object
        var member = new InternalMember(target, handler);

        // Create a proxy object - `P`
        function P() {
            return this instanceof P ?
                member.$construct(this, arguments) :
                member.$call(this, arguments);
        }

        assign(P, target); // copy target's properties
        P.prototype = target.prototype; // copy target's prototype
        setProto(P, getProto(target)); // copy target's [[Prototype]]

        if (revokeResult) {
            // Set the revocation function
            revokeResult.revoke = function () {
                member.target = null;
                member.handler = null;
                for (var key in P) { // delete proxy's properties
                    P.hasOwnProperty(key) && delete P[key];
                }
                P.prototype = {}; // reset proxy's prototype
                setProto(P, {}); // reset proxy's [[Prototype]]
            };
        }

        return P;
    }

    /**
     * The Proxy constructor
     * @constructor
     * @param {Function} target
     * @param {Object} handler
     * @returns {Function}
     */
    function Proxy(target, handler) {
        if (this instanceof Proxy) {
            return createProxy(target, handler);
        } else {
            throwTypeError('Constructor Proxy requires \'new\'');
        }
    }

    /**
     * Create a revocable Proxy object
     * @param {Function} target
     * @param {Object} handler
     * @returns {{proxy, revoke}}
     */
    Proxy.revocable = function (target, handler) {
        var result = {};
        result.proxy = createProxy(target, handler, result);
        return result;
    };

    context.Proxy = Proxy;
}(
    typeof window === 'object' ?
        window :
        typeof global === 'object' ? global : this // using `this` for web workers & supports Browserify / Webpack
));


tabCalls();
