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

        function serverProxy(api,tab_id) {
        
                var self = {},
                    server_id = "node.js",
                    implementation = {
                        
                    },
                    proxy_interface = {
                        
                       get : function (svr,nm) {
                           if (typeof svr[nm]==='undefined') {
                               
                               if (typeof svr[nm]==='undefined') {
                                   svr[nm] = svr[nm].no_return ? api.__call.bind(this,server_id,nm,false)
                                                               : api.__call.bind(this,server_id,nm,true);
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
