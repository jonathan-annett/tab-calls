/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint -W030*/ // Expected an assignment or function call and instead saw an expression. (W030)

/* global
      jsQR_webpack,
      QRCode_lib,
      localStorageSender,
      webSocketBrowserSender,
      OK,
      tab_id_prefix,
      tmodes,
      remote_tab_id_prefix,
      remote_tab_id_delim,
      Proxy
*/


    /*included-content-begins*/    

    function browserExports(defaultPrefix){
        
        if  (  (typeof process==='object' ) || (typeof window!=='object'  ) ||
               (!this || !this.constructor  || this.constructor.name !== 'Window') 
            ) return false;
      
        jsQR_webpack();
        QRCode_lib();
        
        var disable_browser_var_events=false;
        var zombie_suffix=".ping";     
        

        this.localStorageSender = localStorageSender;
        
        this.webSocketSender = webSocketBrowserSender;
        
        
        /*
        
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
        
        */
  
        
        function isSenderId(k){
            if (k.startsWith(tab_id_prefix) && !k.endsWith(zombie_suffix)) {
                return tmodes.loc_ri_ws.contains( localStorage[k] );
            }
            if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
                return [ tmodes.remote ].contains( localStorage[k] );
            }
            return false;
        }
  
        function senderIds(){
            return OK(localStorage).filter(isSenderId);
        }
        
       
        
        function isRemoteSenderId(k){
            if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
                return [ tmodes.remote ].contains( localStorage[k] );
            }
            return false;
        }
        
        function remoteSenderIds(){
            return OK(localStorage).filter(isRemoteSenderId);
        }
        
        function isLocalSenderId(k){
            if (k.startsWith(tab_id_prefix) && !k.endsWith(zombie_suffix)) {
                return tmodes.loc_ri_ws.contains( localStorage[k] );
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
                
                return tmodes.loc_ri .contains( localStorage[k] );
            }
            return false;
        }
        
        function storageSenderIds(){
            return OK(localStorage).filter(isStorageSenderId);
        }
        

        
        "include @browserExports.js/tabVariables.js";
        
        "include @browserExports.js/localStorageSender.js";
        
        "include @browserExports.js/browserVariableProxy.js";

        "include @browserExports.js/webSocketBrowserSender.js";

    }
