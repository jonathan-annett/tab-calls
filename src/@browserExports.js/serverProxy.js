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
    
let inclusionsBegin; 

/*

this code runs IN THE BROWSER

it is a proxy wrapper to allow you to call functions defined on the server

eg 


eg 

api.server.doSomethingFunky("my cool string",{ myobject  : 123});


or to optimize since you know there is never going to be a result vector:

// we don't care about results this time
api.server.doSomethingFast.no_return( 1,2,3 ); 
// this is fairly important if the function can return a lot of data
// and you really don't care about it this time

// OR 

// do this once at startup:
api.server.doSomethingFast.no_return.permanent(); 
// the function now exists (locally) and will always discard the return value of the called function
api.server.doSomethingFast(1,2,3);// never sends us the value via the result vector

// if you do want a result (or answer), you can do this
api.server.doSomethingFast( 1,2,3 ).result(function(answer) {
   // we got the result value as answer
});

// or just use traditional callback
api.server.doSomethingFast( 1,2,3 ,function(answer) {
    // we got the result value via a traditional callback method
});


api.server.doSomethingFast( 1,2,3, function (finalAnswer){

    // eventually got the final result as finalAnswer
    
} ).result(function(immediateAnswer) {
    // we got the initial result value as immediateAnswer
});


// 
api.server.doSomethingSlowly( 1,2,3, function (finalAnswer){

    // eventually got the final result as finalAnswer
    
} ).result(function(answer) {
    // we got the initial result value as answer
};



// or if you need it as a promise..
new Promise(

   api.server.doSomethingPromising

) .then(function (fulfilled) {
    // promises,promised


})
.catch(function (error) {
    // oops, epic fail.
});


 */

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
        
let inclusionsEnd; 
