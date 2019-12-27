/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/

/* global
      Proxy,
      cpArgs,
*/
    
/*included-content-begins*/   

        function serverProxy(api,server_id) {
            
                server_id = server_id||"node.js";
                    
                var self = {},
                    implementation = {
                        
                    },
                    proxy_interface = {
                        
                       get : function (svr,nm) {
                           if (typeof svr[nm]==='undefined') {
                               
                               if (typeof svr[nm]==='undefined') {
                                   svr[nm] = api.__call.bind(this,server_id,nm,true);
                                   svr[nm].no_return = api.__call.bind(this,server_id,nm,false);
                               }
                           }
                           return svr[nm];
                       },
                       set : function (svr,k,v) {
                           if (['function','object'].contains(typeof v)) {
                               return false;
                           } else { 
                               svr[k] = v;
                               return true;
                           }
                       }
                        
                    };
                    
                Object.defineProperties(self,implementation);
                
                return new Proxy(self,proxy_interface);
        }
        
/*included-content-ends*/   
