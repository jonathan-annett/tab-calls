/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/

/* global
      Proxy,
      OK,DP,
      
*/
    
/*included-content-begins*/   

        function serverProxy(api,tab_id) {
        
                var self = {},
                    implementation = {},
                    proxy_interface = {};
                    
                DP(self,implementation);
                return new Proxy(self,proxy_interface);
        }
        
/*included-content-ends*/   
