/*jshint -W030 */ 
/* global pathBasedSenders   */
/* global Object_polyfills   */
/* global Error_toJSON */

/* global Date_toJSON */
/* global Array_polyfills */
/* global String_polyfills */
/* global Proxy_polyfill */

let inclusionsBegin;

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
      var send_compact = false;
      var unregistered_DeviceId = "r_Unregistered";
      var tab_id_prefix        = "t";//formerlly "tab_"
      var remote_tab_id_prefix = "r";//formely "ws_"
      var remote_tab_id_delim  = "."+tab_id_prefix;
      var sent_compacted_flag  = "!";
      
      var no_op = function () {};

      var AP=Array.prototype;// shorthand as we are going to use this a lot.
      var OK=Object.keys.bind(Object);
      var DP=Object.defineProperties.bind(Object);
      
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

      function globalsVarProxy(inject){"globalsVarProxy.js";}
    
          
      function transmogrifyKey(key,when) {
          when=when||Date.now();
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
          
          console.log({transmogrified:{key:key.substr(0,10)+"...",work:work}});
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
      
      function base64Tools(inject){"base64Tools.js";}
      
      
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
      
      function pathBasedSendAPI(inject){"@pathBasedSendAPI.js/pathBasedSendAPI.js";}
      

      function console_log(){ 
          var args = AP.slice.call(arguments);
          console.log.apply(console,args);
          if (window.console_log) {
              return window.console_log.apply(this,args);
          }
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
      
      function browserExports(inject){"@browserExports.js/browserExports.js";}
      function nodeJSExports(inject){"nodeJSExports.js";}
      function polyfills(inject){"polyfills.js";}
      function jsQR_webpack(inject){"jsQR_webpack.js";}
      function QRCode_lib(inject){"QRCode_lib.js";}
      
      return browserExports("messages") || nodeJSExports("messages");
      

    
      let inclusionsPause;

        
      var key = "hello world";
      var n = 6;
      var x = setInterval(function(){
        key = transmogrifyKey(key);
        if (--n<=0) {
            clearInterval(x);
            console.log({key:key,destructureKey:destructureKey(key)});
        }
    },998);
    
      let inclusionsResume;


}

tabCalls("{$currentlyDeployedVersion$}");


let inclusionsEnd;
