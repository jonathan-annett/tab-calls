/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint unused:true*/   
/*jshint devel:true*/   

/*
  global 
  
  callPublishedFunction,
  fn_check_call_info,
  randomId,
  cpArgs
  
*/


/*included-content-begins*/        
        

        function getFunctionArgReviver(context,     fn_store, prefix, suffix, local_id, requestInvoker) {
            var fix = __decodeWrapperObject.bind(this,context,     fn_store, prefix, suffix, local_id, requestInvoker);
            return ___functionAR.bind(fix);
        }
         
         function getFunctionArgReplacer(copyDest,fn_this,fn_store,inv_id) {
             return __functionArgReplacer.bind(this,copyDest,fn_this,fn_store,inv_id);
         }

        
        function __decodeWrapperObject( fn_store, prefix, suffix, local_id, requestInvoker,v) {
           if (v.length!==2) return v;        
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
          
           if (v[0].U==='n' && v[0].d==='e' && v[1]['@']==='f' && v[1].i==='n' && v[1].e==='d') {
               return undefined;
           } 
        
           
        
           if (  v[0].F==='u' && v[0].n==='c' && 
                 v[0].n==='c' && v[0].t==='i' &&
                 v[0].o==='n' && typeof v[1]['@']==='string') {
               return function (){
                   var args = cpArgs(arguments);
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

        
        function ___functionAR (fix,k,v) {
        // invoked by JSON.parse for each value being parsed
        // we use it to re-insert any callbacks, and some other 
        // values that are problematic when passing through JSON
        // eg null, NaN, Date, Infinity
        // all these insertions happen inside a specific format object 
        // the main signature being the existence of a key @ inside an object
        // that is the second element of an array of two objects
        // there are further validation checks that happen inside fix()/__decodeWrapperObject()
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
         }
         
         
         function __inlineCallbackWrapper(callInfo){
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
             
         }

         
         function __functionArgReplacer(copyDest,fn_this,fn_store,inv_id,k,x){
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
                      fnPkt.fn=__inlineCallbackWrapper.bind(fnPkt);
                      fnPkt.fn._need_call_info=true;    
                      return [{'F':'u','n':'c','t':'i','o':'n'},{'@':fnPkt.id}];
                      
                  case "undefined": 
                      return [{'U':'n','d':'e'},{'@':'f','i':'n','e':'d'}];
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
         }



/*included-content-ends*/

if(false)[ getFunctionArgReviver,getFunctionArgReplacer,0].splice();
