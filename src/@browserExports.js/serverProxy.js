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
                           var fn=svr[nm];
                           if (typeof fn==='undefined') {
                               
                               fn= api.__call.bind(this,server_id,nm,true);
                               fn.no_return = api.__call.bind(this,server_id,nm,false);
                               fn.returns = fn;
                               fn.no_return.permanent=function(){
                                   var temp = fn.no_return;
                                   delete fn.no_return.permanent;
                                   delete fn.no_return;
                                   delete fn.returns.permanent;
                                   delete fn.returns;
                                   delete svr[nm];
                                   svr[nm]=temp;
                               };
                               fn.returns.permanent=function(){
                                   delete fn.returns.permanent;
                                   delete fn.returns;
                                   delete fn.no_return.permanent;
                                   delete fn.no_return;
                               };
                               
                               svr[nm]=fn;

                           }
                           return fn;
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
