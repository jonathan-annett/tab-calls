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
        var this_WS_DeviceId = localStorage.WS_DeviceId;
        var this_WS_DeviceId_Prefix = this_WS_DeviceId + remote_tab_id_delim; 

        this.localStorageSender = localStorageSender;
        
        this.webSocketSender = webSocketBrowserSender;
        
        
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
            if (isLocalSenderId(k)) return localPrefix+k;
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
        
        
        function depricationTabFixup (id) {
           if (
                id.startsWith(remote_tab_id_prefix) && 
                id.contains(remote_tab_id_delim+tab_id_prefix)
               ) return id; 
               
          if (
            id.startsWith(tab_id_prefix)
          ) {
              return id; 
          } 
               
        }
  
  

        "include @browserExports.js/tabVariables.js";
        
        "include @browserExports.js/localStorageSender.js";
        
        "include @browserExports.js/browserVariableProxy.js";

        "include @browserExports.js/webSocketBrowserSender.js";

    }
