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
      AP,
*/
 
/*included-content-begins*/   

        function tabsProxy(api) {
        
            return new Proxy ({},{
                         get : function (tabs,dest) {
                             dest=api.__localizeId(dest);
                             if (isSenderId(dest)) {
                                  if (tabs[dest]) {
                                      return tabs[dest];
                                  } else {
                                      if (localStorage[dest]) {
                                          
                                          tabs[dest]= new Proxy({
                                              globals   : browserVariableProxy(globalsVarProxy),
                                              elements  : classProxy(api,dest,false)
                                          },{
                                              get : function (tab,nm) {
                                                  if (typeof tab[nm]==='undefined') {
                                                      tab[nm]=function (){
                                                          return api.__call.apply(this,[dest,nm, !tab[nm].no_return ].concat(AP.slice.call(arguments)));
                                                      };
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
                                          return tabs[dest];
                                       }
                                  }
                             }
                         },
                   });
        
        }
        
/*included-content-ends*/   

if(false)[ tabProxy,0].splice();

