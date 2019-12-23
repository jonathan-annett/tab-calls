/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/

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
        var this_WS_DeviceId_Prefix = this_WS_DeviceId + "."; 
        var this_WS_Device_GetFullId = tabFullId.bind(this,this_WS_DeviceId_Prefix);

        this.localStorageSender = localStorageSender;
        
        this.webSocketSender = webSocketBrowserSender;
        
        
        /* 
         isSenderId() is a filter function used by senderIds()
         senderIds() returns the list of *current* localStorage keys that point to 
                     valid tabs
                     
         isSenderId(k) returns true if:
            k is the id of a tab ON THIS SYSTEM
            k is the id of a tab ON ANOTHER SYSTEM
        */
        function isSenderId(k){
            if (!k.endsWith(zombie_suffix)) {
                if ( k.startsWith(tab_id_prefix) ) {
                    return tmodes.loc_ri_ws.contains( localStorage[k] );
                }
                if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
                    return [ tmodes.remote ].contains( localStorage[k] );
                }
            }
            return false;
        }
  
        function senderIds(){
            return OK(localStorage).filter(isSenderId).map(this_WS_Device_GetFullId);
        }
         
        
        /* 
         isRemoteSenderId() is a filter function used by remoteSenderIds()
         remoteSenderIds() returns the list of *current* localStorage keys that point to 
                           valid tabs ON OTHER SYSTEMS
                     
         isRemoteSenderId(k) returns true if:
            k is the id of a tab ON ANOTHER SYSTEM
        */
        function isRemoteSenderId(k){
            if (k.startsWith(remote_tab_id_prefix) && k.contains(remote_tab_id_delim) ) {
                return [ tmodes.remote ].contains( localStorage[k] );
            }
            return false;
        }
        
        function remoteSenderIds(){
            return OK(localStorage).filter(isRemoteSenderId);
        }
        
        
        
        /* 
         isLocalSenderId() is a filter function used by localSenderIds()
         localSenderIds() returns the list of *current* localStorage keys that point to 
                           valid tabs ON THIS SYSTEM
                     
         isLocalSenderId(k) returns true if:
            k is the id of a tab ON THIS SYSTEM
        */
        
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
            if (isLocalSenderId(k)) return k;
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
        
        
        function depricationTabIdFixup (id) {
        
            
           if (
                id.startsWith(remote_tab_id_prefix) && 
                id.contains(remote_tab_id_delim)
               ) return id; 
               
          if (
            id.startsWith(tab_id_prefix)
          ) {
              console.log("warning - partial tab_id used");
             // /*jshint -W087*/debugger;/*jshint +W087*/ 
              return this_WS_DeviceId+"."+id; 
          } 
          
          console.log("warning - bogus tab_id used");
         // /*jshint -W087*/debugger;/*jshint +W087*/ 


        }
  
  

        "include @browserExports.js/tabVariables.js";
        
        "include @browserExports.js/localStorageSender.js";
        
        "include @browserExports.js/browserVariableProxy.js";

        "include @browserExports.js/webSocketBrowserSender.js";
        
       
        if(false)[disable_browser_var_events, this_WS_DeviceId_Prefix, senderIds, remoteSenderIds, localSenderIds, tabFullId, tabLocalId, storageSenderIds, depricationTabIdFixup, defaultPrefix, Proxy, 0].splice();
        

    }
    

/*included-content-ends*/


false&&[browserExports,0];
