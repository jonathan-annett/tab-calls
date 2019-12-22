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

/* global Proxy  */
/* global self   */
/* global define */

if (typeof QRCode==='undefined'&&typeof window!=='undefined') {
    var QRCode;
}

function tabCalls (currentlyDeployedVersion) { 
    
      var tab_id_prefix = "t";
      var remote_tab_id_prefix = "r";
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
      
      function globalsVarProxy (key) {return globs[key];}
      
  
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
      

      "include pathBasedSendAPI.js";
      
      function console_log(){ 
          var args = AP.slice.call(arguments);
          console.log.apply(console,args);
          if (window.console_log) {
              return window.console_log.apply(this,args);
          }
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
      
    "include @browserExports.js/browserExports.js";

    "include nodeJSExports.js";
    
    "include polyfills.js";
    
    "include jsQR_webpack.js";
    
    "include QRCode_lib.js";

}

tabCalls("{$currentlyDeployedVersion$}");

