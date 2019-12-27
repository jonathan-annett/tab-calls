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
                                                  if (typeof tab[nm]==='undefined') {
                                                      tab[nm] = tab[nm].no_return  ? api.__call.bind(this,tab_id,nm,false)
                                                                                   : api.__call.bind(this,tab_id,nm,true);
                                                           
                                                    
                                                      /* 
                                                      function (){
                                                          return api.__call.apply(this,[dest,nm, !tab[nm].no_return ].concat(cpArgs(arguments)));
                                                      };*/
                                                  }
                                                  return tab[nm];
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

