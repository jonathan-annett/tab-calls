/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   
/*jshint unused:true*/

/* global
      Proxy,
      isSenderId,
      browserVariableProxy,
      globalsVarProxy,
      classProxy,
      cpArgs,
*/


/*

this code runs IN THE BROWSER

it is a proxy wrapper to allow you to call functions defined on the server

eg 


api.tabs.sometab.doSomethingFunky("my cool string",{ myobject  : 123});

note: in all these examples, api.sometab is used, where sometab is a named tab
(tabs are named by simply assinging either a tab id or a tab object to a name in the api.tabs proxy)

eg api.jonathan = "some_i_copied from a url"



you can equally do api.tabs[some_saved_id] where some_saved_id was previously cached




or to optimize since you know there is never going to be a result vector:

// we don't care about results this time
api.tabs.sometab.doSomethingFast.no_return( 1,2,3 ); 
// this is fairly important if the function can return a lot of data
// and you really don't care about it this time

// OR 

// do this once at startup:
api.tabs.sometab.doSomethingFast.no_return.permanent(); 
// the function now exists (locally) and will always discard the return value of the called function
api.tabs.sometab.doSomethingFast(1,2,3);// never sends us the value via the result vector

// if you do want a result (or answer), you can do this
api.tabs.sometab.doSomethingFast( 1,2,3 ).result(function(answer) {
   // we got the result value as answer
});

// or just use traditional callback
api.tabs.sometab.doSomethingFast( 1,2,3 ,function(answer) {
    // we got the result value via a traditional callback method
});


api.tabs.sometab.doSomethingFast( 1,2,3, function (finalAnswer){

    // eventually got the final result as finalAnswer
    
} ).result(function(immediateAnswer) {
    // we got the initial result value as immediateAnswer
});


// 
api.tabs.sometab.doSomethingSlowly( 1,2,3, function (finalAnswer){

    // eventually got the final result as finalAnswer
    
} ).result(function(answer) {
    // we got the initial result value as answer
};



// or if you need it as a promise..
new Promise(

   api.tabs.sometab.doSomethingPromising

) .then(function (fulfilled) {
    // promises,promised


})
.catch(function (error) {
    // oops, epic fail.
});


 */
 
/*included-content-begins*/   

        function tabsProxy(api) {
            
            var byName = {}; 
            
            function getTabProxy (tabs,tab_id) {
                
                if (byName[tab_id]) {
                    return byName[tab_id];
                }
                
                tab_id=api.__localizeId(tab_id);
                
                if (isSenderId(tab_id)) {
                     if (tabs[tab_id]) {
                         return tabs[tab_id];
                     } else {
                         if (localStorage[tab_id]) {
                             var execute = api.__call.apply.bind(api.__call,this,tab_id);
                             tabs[tab_id]= new Proxy({
                                 globals   : browserVariableProxy(globalsVarProxy),
                                 elements  : classProxy(api,tab_id,false)
                             },{
                                 get : function (tab,nm) {
                                     
                                     var fn=tab[nm];
                                     if (typeof fn==='undefined') {
                                         
                                         fn= api.__call.bind(this,tab_id,nm,true);
                                         fn.no_return = api.__call.bind(this,tab_id,nm,false);
                                         fn.returns = fn;
                                         fn.no_return.permanent=function(){
                                             var temp = fn.no_return;
                                             delete fn.no_return.permanent;
                                             delete fn.no_return;
                                             delete fn.returns.permanent;
                                             delete fn.returns;
                                             delete tab[nm];
                                             tab[nm]=temp;
                                         };
                                         fn.returns.permanent=function(){
                                             delete fn.returns.permanent;
                                             delete fn.returns;
                                             delete fn.no_return.permanent;
                                             delete fn.no_return;
                                         };
                                         
                                         tab[nm]=fn;

                                     }
                                     return fn;
                                 },
                                 set : function (tab,k,v) {
                                     if (typeof v==='function') {
                                         return false;
                                     } else { 
                                        
                                         tab[k] = v;
                                         return true;
                                     }
                                 }
                             });
                             return tabs[tab_id];
                          }
                     }
                }
            }
            
            return new Proxy ({
                
                      
                
                        },{
                         get : getTabProxy,
                         set : function (tabs,nm,tab_id) {
                             
                             if (typeof tab_id==='string') {
                                // eg api.tabs.jonathan = "some_id";
                                
                                if (byName[nm]) {
                                    delete byName[nm].name;
                                    delete byName[nm];
                                }
                                
                                if (isSenderId(tab_id)) {
                                    byName[nm]= getTabProxy(tabs,tab_id);
                                    byName[nm].name=nm;
                                    return true;
                                }
                            } else {
                                if (typeof tab_id==='object' && tab_id===tabs[tab_id.id]) {
                                    // eg api.tabs.jonathan = api.tabs["some_id"]
                                    // eg api.tabs.jonathan = api.tabs.fred
                                    if (byName[nm]) {
                                        delete byName[nm].name;
                                        delete byName[nm];
                                    }
                                    byName[nm]=tab_id;
                                    byName[nm].name=nm;
                                    return true;
                                }
                            }
                            return false;
                            
                         }
                   });
        
        }
        
/*included-content-ends*/   

if(false)[ tabsProxy,0].splice();

