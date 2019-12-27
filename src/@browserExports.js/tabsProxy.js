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
 
/*included-content-begins*/   

        function tabsProxy(api) {
            
            
            
            return new Proxy ({},{
                         get : function (tabs,tab_id) {
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
                         },
                   });
        
        }
        
/*included-content-ends*/   

if(false)[ tabsProxy,0].splice();

