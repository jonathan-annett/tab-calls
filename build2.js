/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:false*/
/*jshint node:true*/
/*jshint devel:true*/   
/*jshint unused:true*/
/*jshint -W119*/


let inclusionsBegin;

var 

fs   = require('fs'),
path = require("path"),
zlib = require('zlib'),
poly = require("./src/polyfills.min.js",module.inject),
ext  = require("./src/extensions.min.js",module.inject);

//requireBlockWrapper
console.log(require("./src/lsnow2.js",module.inject));

//classicIncludeWrapper + 
function subtleWindow(include){"./subtle-window.js";}

//arrowIncludeWrapper
(include)=>{"./src/lsnow.js";}

//injectBlockWrapper - classic style
function qrcode(inject){"./qrcode.js";}

//injectBlockWrapper - arrow style
(inject)=>{"./src/@browserExports.js/classProxy.js";}


function tob64(data) {
    return zlib.deflateSync(data).toString('base64');
}

function fromb64(b64) {
 return zlib.inflateSync(Buffer.from(b64,'base64')).toString();
}

function saveDB(hashDB) {
    var key = "omits.db";
    
    return '\n/*{"'+key+'":"'+
            tob64(JSON.stringify(hashDB,undefined,4))+
           '"}*/';
}
saveDB.match = encodeRegExp([{ 
    $omitdb:[
        { match: '\n/*' },
        { wsTo : '{'},
        { wsTo : '"omits.db"'},
        { wsTo : ':' },
        { wsTo : '"' },
        { $b64 : [ {anything:null}  ]},
        { match : '"'  },
        { wsTo : '}' },
        { wsTo : '*/' },
    ]
}],'gs');

function deleteKeys(db,keys){
    if (typeof keys==='string') {
        delete db[keys];
        return;
    }
    return keys.forEach(deleteKeys.bind(this,db));
}

function loadDB(srcArray) {
    if ( srcArray && 
         srcArray.tokens) {
            var dist = srcArray.token_distribution;
            if (dist && 
                dist.paths && 
                dist.paths.omits &&
                dist.paths.omits.indexes &&
                dist.paths.omits.indexes.length) {
                    
            var 
            
            tok =srcArray.tokens[ dist.paths.omits.indexes[0] ],
            b64 = tok.groups.b64;
            
            deleteKeys(tok,["split","groups","mode","src","path"]);

            return (tok.db=JSON.parse(fromb64(b64)));
        } 
    }
    return false;
}

function checkWrapRegEx (str,regex,hash) {
    try  {
        
        if (regex.exec(str).groups.hash!==hash) {
           throw new Error ("hash mismatch");          
      }
    } catch (e) {
        console.log (str);
        console.log (e);
        console.log (regex.source);
        console.log (regex.flags);
        throw (e);
    }

}

function encodeRegExp(arr,flags){
    
    var names={},gpNo,stack=[];
    
    function escapeRegExp(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
    function quantify(x,n) {
        if (n===null) {
            return stack.push(x+'*');
        }
        if (typeof n==='number') {
            return stack.push(x+'{'+n+'}');
        }
        if (typeof n==='string') {
            return stack.push(x+n);
        }
    }
    var longform = {
        ws   : "\\s",
        alphanumeric : "[a-z|0-9]",
        alphaNumeric : "[a-z|A-Z|0-9]",
        ALPHANUMERIC : "[A-Z|0-9]",
        numeric      : "[0-9]",
        alpha        : "[a-z]",
        ALPHA        : "[A-Z]"
    };
    function parseRegExpBlock (obj) {
        
        if (typeof obj==='string') {
            return stack.push(escapeRegExp(obj));
        }
        
        if (typeof obj==='object' && obj.constructor===Array) {
            gpNo = gpNo?gpNo+1:1;
            stack.push('(');
            obj.forEach(parseRegExpBlock);
            return stack.push(')');
        }
        
        if (typeof obj==='object' && obj.constructor===Object) {
            var key=Object.keys(obj),name;
            if (key.length===1) {key=key[0];
                var val=obj[key]; 
                switch (key) { 
                    case "skipTo":
                    case "match": 
                        if (key==="skipTo") stack.push(".*");
                        return parseRegExpBlock(val);
                    case "match$":
                        return stack.push("\\"+names[val].toString());
                        
                    case "ws": 
                    case "alphaNumeric": 
                    case "alphanumeric": 
                    case "ALPHANUMERIC": 
                    case "numeric":
                    case "alpha":
                    case "ALPHA":
                        return quantify(longform[key],val);
                        
                    case "wsTo":
                        stack.push("\\s*");
                        return parseRegExpBlock(val);
                        
                        
                    case "anything":
                        
                        if (val===1) {
                            return stack.push('.');
                        }
                        return quantify('.',val);

                default:
                    if (key.charAt(0)==="$") {
                        name=key.substr(1);
                        stack.push('(?<'+name+'>');
                        gpNo = gpNo?gpNo+1:1;
                        names[name]=gpNo;
                        parseRegExpBlock(val);
                        return stack.push(')');
                    }
                }
            }
        }
    }
    
    parseRegExpBlock(arr);
    return new RegExp(stack.join(''),flags||'g');
}   

function classicIncludeWrapper(filename,name,args,code,indentLevel) {
    indentLevel=indentLevel||0;
    var spaces = new Array (1+indentLevel).join(" ");
    return [ spaces+'/*[',/*hash*/']>>> file:'+filename+' >>>*/\n'+
             spaces+'function '+(name||'')+' ('+(args||'')+'){\n'+
             code.reindent(indentLevel+4).trimEnd()+'\n'+ 
             spaces+'}/*<<< file:'+filename+' <<<[',/*hash*/']*/'];
}

classicIncludeWrapper.match= encodeRegExp([{ 
    $classic:[
        { match    : '/*[' },
        { $hash    : [ {alphanumeric: 8 } ]},
        { match    : ']>>>' },
        { $include    : [ 
//       file: somefile.js >>>  */
//       function someName (some,args,here) {
            {anything:null}  
//      } /*<<< file:somefile.js       
            ]},
        { match    : '<<<[' },
        { match$   : "hash" },
        { match    : ']' },
        { wsTo: '*/' },
    ]
}],'gs');

classicIncludeWrapper.filter= encodeRegExp([ 
    //file: somefile.js 
    { match : '>>>' },
    { wsTo  : '*/' },
    { wsTo  : 'function' },
    // someName (some,args,here) 
    { skipTo          : '{' },
    { $classic_code    : [ {anything:null}  ]},
    { match    : '}' },
    { wsTo : '/*<<<' },
],'gs');

function arrowIncludeWrapper(filename,args,code,indentLevel) {
    indentLevel=indentLevel||0;
    var spaces = new Array (1+indentLevel).join(" ");
    return [ spaces+'/*[',/*hash*/']>>> file:'+filename+' >>>*/\n'+
             spaces+'('+(args||'')+')=>{\n'+
             code.reindent(indentLevel+4).trimEnd()+'\n'+ 
             spaces+'}/*<<< file:'+filename+' <<<[',/*hash*/']*/'];
}
arrowIncludeWrapper.match=classicIncludeWrapper.match;

arrowIncludeWrapper.filter= encodeRegExp([ 
    // file: somefile.js 
    { match  : '>>>' },
    { wsTo   : '*/' },
    // (some,args,here) =>
    { skipTo          : '=>' },
    { wsTo    : '{' },
    { $arrow_code       : [ {anything:null}]},
    { match             : '}' },
    { wsTo    : '/*<<<' },
    
],'gs');

function injectBlockWrapper(description,code,indentLevel) {
    indentLevel=indentLevel||0;
    var spaces = new Array (1+indentLevel).join(" ");
    return [ spaces+'/*[',/*hash*/']-('+description+')-->*/\n'+
             code.reindent(indentLevel+4).trimEnd()+'\n'+
             spaces+'/*<--('+description+')-[',/*hash*/']*/'];
}

injectBlockWrapper.match= encodeRegExp([{ 
    $inject_block:[
        { match    : '/*[' },
        { $hash    : [ {alphanumeric: 8 } ]},
        { match    : ']-('   },
        { skipTo : ')-->*/'  },
        { $code    : [ {anything:null}  ]},
        { match    : '/*<--('  },
        { skipTo : ')-['   },
        { match$   : "hash" },
        { match    : ']*/' },
    ]
}],'gs');
                      

function arrowBlockWrapper(filename,code,indentLevel) {
    indentLevel=indentLevel||0;
    var spaces = new Array (1+indentLevel).join(" ");
    return [ spaces+'((',/*hash*/')=>{\n'+
             spaces+'/*'+filename+'*/\n'+
             code.reindent(indentLevel+4).trimEnd()+'\n'+
             spaces+'})("',/*hash*/'");\n' ];
}

arrowBlockWrapper.match= encodeRegExp([{ 
    $arrow_block:[
        { match : '(' },
        { wsTo  : '('},
        { ws    : null},
        { $hash    : [ {alphanumeric: 8 } ]},
        { wsTo: ')'   },
        { wsTo: '=>'   },
        { wsTo: '{'   },
        { wsTo: '/*'  },
        { skipTo : '*/'  },
        { $code    : [ {anything:null}  ]},
        { match    : '}'  },
        { wsTo: ')'   },
        { wsTo: ')'   },
        { wsTo: '"'   },
        { match$ : "hash" },
        { match  : '"' },
        { wsTo   : ')' },
        { wsTo   : ';' },
    ]
}],'gs');

//         arrowBlockWrapper.match=/(?<arrow_block>\(\s*\((\s*(?<hash>([a-z|A-Z|0-9]){8})\s*)\s*(\)(\s)*=>(\s)*\{)(?<code>(.)*)(\}\s*\)\s*\(\s*")(\3)"\s*\))/gs;


//         arrowIncludeWrapper.match=/(?<arrow>(\/\*\s*\[\s*(?<hash>([a-z|A-Z|0-9]){8})\s*))\](>){3}.*(>){3}\*\/\s*(?<name>([a-zA-Z_][a-zA-Z0-9_]*)?)*\s*\(\s*(?<arrow_args>(.*)?)\s*\)\s*=>\s*\{(?<code>.*)\}\s*\/\*\s*(<){3}.*(<){3}\[\s*\3\s*\]\s*\*\//gs;


function classicBlockWrapper(filename,name,code,indentLevel) {
    indentLevel=indentLevel||0;
    var spaces = new Array (1+indentLevel).join(" ");
    return [ spaces+'(function'+(name?' '+name:'')+'(',/*hash*/')  {\n'+
             spaces+'/*'+filename+'*/\n'+
             code.reindent(indentLevel+4).trimEnd()+'\n'+ 
             spaces+'})("',/*hash*/'");\n'];
}
         
classicBlockWrapper.match= encodeRegExp([ 
    { match  : '(' },
    { wsTo   : 'function'},
    
    { skipTo : '(' },

    { ws     : null },{ $hash : [ {alphanumeric: 8 } ]},{ wsTo : ')' },
    
    { $code          : [ 
    // { /* somefile.js */
        {anything:null}  
        
    ]},
    { match: '}'   },
    { wsTo : ')'   },
    { wsTo : '('   },
    
    { wsTo : '"'   }, { match$ : "hash" }, { match : '"' },
    
    { wsTo : ')' },
    { wsTo : ';' },
],'gs');     

classicBlockWrapper.filter= encodeRegExp([ 
    { match : '{' },
    { wsTo  : '/*'},
    { skipTo       : '*/' },
    { $code          : [ 
    // { /* somefile.js */
        {anything:null}  
        
    ]},
],'gs');     



function requireBlockWrapper(filename,code,indentLevel) {
    indentLevel=indentLevel||0;
    var spaces = new Array (1+indentLevel).join(" ");
    return [ spaces+'(function(module){module.id="',/*hash*/'";(function(exports){\n'+
             code.reindent(indentLevel+4).trimEnd()+'\n' +
             spaces+'})(module.exports);return module.exports;})({exports:{},filename:"'+(filename)+'",id:"',/*hash*/'"})'];
           
}

requireBlockWrapper.match= encodeRegExp([{ 
    $require_block:[
        { match    : '(' },
        
        { wsTo: 'function'},{ wsTo:'('},{ wsTo:'module'},{wsTo:')'},
        
        { wsTo: '{' },
        
        { wsTo: 'module.id'   },{ wsTo: '=' },

        { wsTo: '"'},{ $hash: [ {alphanumeric: 8 } ]},{ match : '"' },
        
        { wsTo: ';' },
        { wsTo: '(' },
        
        { wsTo: 'function'},{ wsTo:'('},{ wsTo:'exports'},{ wsTo: ')' },
        
        { wsTo: '{'   },
        
        { $code    : [ {anything:null}  ]},
        
        { match    : '}'  },
        
        { skipTo : '"' },
        { wsTo:  ',' },
        { wsTo:  'id' },{ wsTo : ':'}, 
        
        { wsTo: '"' },{ match$   : "hash" },{ match    : '"' },
        { wsTo: '}' },
        { wsTo: ')' },
    ]
}],'gs');




var hashDB = {},
    tagLookup = {},
    instances = [],
    hashMagic = Number.parseInt("aaaaaaaa",36),
    makeHash  = function(x){return Number(hashMagic+x).toString(36);},
    makeIndex = function(x){return Number(x).toString(36);},
    createHashDB = function(data,fmt,keep){
        var hash = makeHash(Object.keyCount(hashDB));
        hashDB[hash]=data;
        return {
            text : fmt.join(hash),
            hash : hash,
            data : keep ? data : undefined
        };
    };
    
    
    
    
var 
    include_markers_file =/(?<include_marker>(let(\s)+inclusions)((?<begin>Begin)|(?<end>End)|((?<pause>Pause)(\d)*)|((?<resume>Resume)(\d)*))(\s)*\;){1}/,
    
    include_inject_file  = /(?<include_file>(((((((function){1}(\s)*(?<name>([a-zA-Z_][a-zA-Z0-9_]*)?)(\s)*\((\s)*(?<classic>include|inject|((include,|inject,)(?<classic_args>([a-zA-Z_][a-zA-Z0-9_,]*)?))){1}(\s)*(\))(\s)*))|(((\((\s)*(?<arrow>include|inject|((include,|inject,)(?<arrow_args>([a-zA-Z_][a-zA-Z0-9_,]*)?))){1}(\s)*(\))(\s)*)(\s)*\=\>))))(\s)*{(\s)*('|\")))(?<filename>(.*?))((\37)(\s)*;(\s)*\}))/,
    include_file         = /(?<include_file>(((((((function){1}(\s)*(?<name>([a-zA-Z_][a-zA-Z0-9_]*)?)(\s)*\((\s)*(include|include,(?<classic_args>([a-zA-Z_][a-zA-Z0-9_,]*)?)){1}(\s)*(\))(\s)*))|(((\((\s)*(include|include,(?<arrow_args>([a-zA-Z_][a-zA-Z0-9_,]*)?)){1}(\s)*(\))(\s)*)(\s)*\=\>))))(\s)*{(\s)*('|\")))(?<filename>(.*?))((\33)(\s)*;(\s)*\}))/,
    inject_file          = /(?<inject_file>(((((((function){1}(\s)*(?<name>([a-zA-Z_][a-zA-Z0-9_]*)?)(\s)*\((\s)*(inject|inject,(?<classic_args>([a-zA-Z_][a-zA-Z0-9_,]*)?)){1}(\s)*(\))(\s)*))|(((\((\s)*(inject|inject,(?<arrow_args>([a-zA-Z_][a-zA-Z0-9_,]*)?)){1}(\s)*(\))(\s)*)(\s)*\=\>))))(\s)*{(\s)*('|\")))(?<filename>(.*?))((\33)(\s)*;(\s)*\}))/,
    require_inject       =  /(?<require_file>(((require){1}(\s)*(\((\s)*(\"){1})))(((?<filename>(.)*)(\"){1}(\s)*(,(\s)*module.inject(\s)*(,)?(?<require_args>(.)*))(?<=[^\)]{1})\))))/,
    tokenMarker          = /(?<omit>(\/\*(.)*\{\#\>)(?<hash>([a-z|A-Z|0-9]){8})(<\#\}(.)*\*\/))/;
    
    
    
function loadFile(filename,indentLevel) {
    
    indentLevel=indentLevel||0;
    var fullpath = path.resolve(filename);
    if (instances.indexOf(fullpath)>=0) return { 
        output : 'var included_files = '+
        
        JSON.stringify(instances.concat([fullpath+"<<<"]),undefined,4).replace(/<<<\"/,"\"   // <<<--- you are here!" )+
        
        ';\nthrow new Error("recursive inclusion detected");' };
    if (!fs.existsSync(fullpath)) return { output : 'throw new Error("file not found");' };
    
    instances.push(fullpath);
    
    var 

    source = fs.readFileSync(filename,"utf-8"),
    
        
    pairs = {

            includeMarkers  : [include_markers_file],
          
            includeFileName : [include_inject_file],
            
            requireFileName : [require_inject]
            
           
    },
    chunks = source.ArraySplit(pairs),
    dist = chunks && chunks.token_distribution;
    
    
    if (!dist) {
        instances.pop();
        return ({
            filename : filename,
            output : source
        });
        
    }
    
    var    paused = false,
           hidden = [
           function (x,ix) {
               if (ix===0) {
                  paused=false;
               }
               return false;
           }
    ];
    
    function isHidden (x,ix) {
        return hidden.some(function(criteria){
            switch (typeof criteria){
                case 'function' : return  criteria(x,ix); 
                case 'number'   : return  ix===criteria;
                case 'object'   : return criteria.indexOf ? criteria.indexOf(x)>=0 : Object.values(criteria).indexOf(x)>=0;
            }
            return false;
        });
    }
    
    function isShowing(x,ix) {
        return !isHidden(x,ix);
    }
    
    var 
    
    include_begins_fmt = ['/*{#>','<#}*/'],
    include_ends_fmt = include_begins_fmt,
    exclude_fmt = include_begins_fmt;
    
    function cleanupOmits(x){
         return {
             text:x.text,
             split:x.split
         };
     }
    
    
    function cleanupFile(x) {
        return  {
            filename : x.filename,
            include_file : x.include_file,
            require_file : x.require_file,
            arguments : x.classic_args || x.arrow_args || x.require_args
        };
    }
    
    
    function  createInjectFileDb(file_token,db,indentLevel) {

      var filePkg;
      
      file_token.text = (filePkg=createHashDB({
          injectFile :cleanupFile(db),
      }, injectBlockWrapper(
          'injected file:'+db.filename,
          file_token.data.output,
          indentLevel))).text;
          
          
          //checkWrapRegEx (file_token.text,injectBlockWrapper.match,filePkg.hash) 

      
      return filePkg;
        
    }
    
    function  createArrowIncudeFileDb(file_token,db,indentLevel) {

      var filePkg;
      
      file_token.text = (filePkg=createHashDB({
          includeFile :cleanupFile(db),
      }, arrowIncludeWrapper(
          db.filename,
          db.arrow_args,
          file_token.data.output,
          indentLevel))).text;
      
      //checkWrapRegEx (file_token.text,arrowIncludeWrapper.match,filePkg.hash) 

      return filePkg;
        
    }
    
    function  createClassicIncludeFileDb(file_token,db,indentLevel) {

      var filePkg;
      
      file_token.text = (filePkg=createHashDB({
          includeFile :cleanupFile(db),
      }, classicIncludeWrapper(
          db.filename,
          db.name,
          db.classic_args,
          file_token.data.output,
          indentLevel))).text;
      
      
      //checkWrapRegEx (file_token.text,classicIncludeWrapper.match,filePkg.hash) 

      
      return filePkg;
        
    }
    
    function  createRequireFileDb(file_token,db,indentLevel) {

      var filePkg;
      
      file_token.text = (filePkg=createHashDB({
          requireFile :cleanupFile(db),
      }, requireBlockWrapper(
          
          db.filename,
          file_token.data.output,
          indentLevel))).text;
          
          //checkWrapRegEx (file_token.text,requireBlockWrapper.match,filePkg.hash) 

      return filePkg;
        
    }
    
    
    
    function markIncludes(files) {
        if (files){
            var created = files.map(function(token){
            token.indexes.forEach(function(file_ix){
                
                var file_token=chunks.tokens[file_ix],
                    db=file_token.groups,
                    load_filename = db.filename,
                    isClassic = !!db.classic,
                    isArrow = !!db.arrow,
                    isRequire = !!db.require_file,
                    
                    args = ( isClassic ? 
                             db.classic_args || '' 
                             : (isArrow ? db.arrow_args || '' : (
                                 (isRequire ? db.require_args : '' )
                                 )) ),
                           
                    isInclude = ( isClassic ? 
                                 db.classic.startsWith('include')
                                 : (isArrow   ? db.arrow.startsWith('include') : false)) ,
                    
                    isInject = ( isClassic ? 
                                 db.classic.startsWith('inject')
                                 : (isArrow   ? db.arrow.startsWith('inject') : isRequire)),
                                 
                    isRaw=isRequire || (isInject && args.indexOf("raw")>=0),
                    resolve_fn = function (fn ) {
                        if ([".","/"].indexOf(fn.substr(0,1))>=0) return fn;
                        return path.join(path.dirname(filename),fn);
                    }, 
                    loader = isRaw ? function (){
                                        return { output : fs.readFileSync(resolve_fn(load_filename),"utf8")};
                                     } 
                                   : function(){ 
                                       return loadFile(resolve_fn(load_filename),indentLevel+4);
                                   };
                    
                    
                    try {
                        file_token.data = loader();
                    } catch (e) {
                        file_token.data = {
                            output : '/* '+e .message+'*/'
                        };
                    }
                    
                    if (isRequire) {
                        return createRequireFileDb(file_token,db,indentLevel);
                    }
                    
                    if (isInclude) {
                        
                        if (isArrow) {
                            return createArrowIncudeFileDb(file_token,db,indentLevel) 
                        } 
                        
                        if (isClassic) {
                            return createClassicIncludeFileDb(file_token,db,indentLevel) 
                        }

                    }
                    
                    if (isInject) {
                        return createInjectFileDb(file_token,db,indentLevel); 
                    }
                    
                });
            });
        
        }
    }
    
    function markIncludeStart(begins,start_ix){
        var 
        hide_start=function (x,ix) {return ix<start_ix;};
        
        hidden.push(hide_start);
            
        chunks.tokens[ start_ix ].text = createHashDB({
            omit  : chunks.tokens.slice(0,start_ix+1).map(cleanupOmits),
        },include_begins_fmt).text;
    
    }
    
    function markIncludeEnd(ends,end_ix){
        var 
        hide_end=function (x,ix) {return ix>end_ix;};

        hidden.push(hide_end);
        chunks.tokens[ end_ix ].text = createHashDB({
            omit  : chunks.tokens.slice(end_ix).map(cleanupOmits),
            //omit      : chunks.tokens[ end_ix ].split,
        },include_ends_fmt).text;
    }
    
    function markIncludePause(pauses,pause_ix) {
          hidden.push(function(x,ix){
            if (ix===pause_ix) {
              paused=pause_ix;
              return true;
            } else {
               if (paused===pause_ix && ix > pause_ix) return true;
            }
            return false;
        });
    }
    
    function markIncludeResume(resumes,resume_ix) {
        hidden.push(function(x,ix){
            if (ix===resume_ix) {
                    chunks.tokens[ ix ].text = createHashDB({
                        omit : chunks.tokens.slice(paused,ix+1).map(cleanupOmits),
                        //resume      : chunks.tokens[ ix ].split,
                    },exclude_fmt).text;
                    paused=false;
            }
            return false;
        });
    }

    function detectIncludeMarkers(markers) {
        
        var count_start=0,count_end=0;
        if (markers) {
            markers.forEach(function(token){
                token.indexes.forEach(function(ix){
                     var marker = chunks.tokens[ix];
                     if (marker && marker.groups && marker.groups.include_marker) {
                     
                         if (marker.groups.begin) {
                             markIncludeStart(marker,ix);
                             count_start++;
                         }
                         
                         if (marker.groups.end) {
                             markIncludeEnd(marker,ix);
                             count_end++;
                         }
                     
                     } else {
                         if (marker && marker.groups && marker.groups.mode==="included") {
                         
                             if (marker.groups.delim==="begins") {
                                 markIncludeStart(marker,ix);
                                 count_start++;
                             }
                             
                             if (marker.groups.delim==="ends") {
                                 markIncludeEnd(marker,ix);
                                 count_end++;
                             }
                         
                         }
                     }
                });
            });
        }
        
        if (count_start>1 || count_end> 1 ) {
            
            throw new Error ('there should be at most 1 start and 1 end marker');
            
        }
        
        if (markers) {
            markers.forEach(function(token){
                token.indexes.forEach(function(ix){
                     var marker = chunks.tokens[ix];
                     if (marker && marker.groups && marker.groups.include_marker) {
                        if (marker.groups.resume) {
                          markIncludeResume(marker,ix);
                        }
                     }
                });
            });
        }
        
        if (markers) {
            markers.forEach(function(token){
                token.indexes.forEach(function(ix){
                     var marker = chunks.tokens[ix];
                     if (marker && marker.groups && marker.groups.include_marker) {
                         if (marker.groups.pause) {
                             markIncludePause(marker,ix);
                         }
                     }
                });
            });
        }
        
    }
    
    detectIncludeMarkers(dist.paths.includeMarkers);
     
    markIncludes(dist.paths.includeFileName);
    markIncludes(dist.paths.requireFileName);
  
  
    let inclusionsPause1;
  
    // this comment should not be included

    
    let inclusionsResume1;
    
    
    // this comment is ok
    
    
    let inclusionsPause2;
    
    // this comment should not be included either
    

    let inclusionsResume2;


    instances.pop();
    return ({
        filename : filename,
        //pairs    : pairs,
        chunks   : chunks,
        tokens   : chunks.tokens,
        paths     : dist.paths,
        raw      : chunks.raw,
        output   : chunks.tokens.filter(isShowing).join(''),
        outputDB : saveDB(hashDB)
        
    });
    
    

}

 

function parse_src (src,dir) {
    dir = dir || {};
    
    var 
    db=false,
    files= [],
    
    matches = [{// regexps to pass into ArraySplit
    
        omits          : saveDB.match,
        injectBlock    : injectBlockWrapper.match,
        arrowBlock     : arrowBlockWrapper.match,
        classicBlock   : classicBlockWrapper.match,
        requireBlock   : requireBlockWrapper.match,
        includeWrapper : classicIncludeWrapper.match,
    },{
        markers        : tokenMarker

    }],
    parsers = {
        //parse the results from ArraySplit(matches)
        // these functions are callled, in the listed order,  
        // with any tokens detected by ArraySplit
        
        // special case - we do this first to populate db (above)
        // all other parsers use the results of this to 
        // get access to any linked data in db (linked on groups.hash )
        omits          : function (token) {
            var b64 = token.groups.b64;
            deleteKeys(token,["split","groups","mode","src","path"]);
            db =(token.db=JSON.parse(fromb64(b64)));
            return false;
        },
        injectBlock    : function (block,data) {

                              
            if (block && block.groups && block.groups.inject_block &&  block.groups.code) {
                var f = {
                    text     :  data.injectFile.include_file,
                    hash     :  block.hash,
                    file : {
                        filename : data.injectFile.filename,
                        data : block.code
                    },
                    ix    : block.ix
                };
                files.push(f);
                return f;
            }
        },
        classicBlock   : function () {},
        requireBlock   : function (block,data) {

            var f = {
                text     : data.requireFile.require_file,
                hash     : block.groups.hash,
                file : {
                    filename : data.requireFile.filename,
                },
                ix    : block.ix
            };
            files.push(f);
            return f;
            
        },
        includeWrapper : function (include,data) {
            

            if (include && include.groups && include.groups.include) {
                var locate =  include.groups.include.ArraySplit({
                    classic : classicIncludeWrapper.filter,
                    arrow   : arrowIncludeWrapper.filter
                });
                if (locate) {
                    var 
                    inctok,
                    paths= locate.token_distribution.paths;
                    if (paths.classic) {
                        inctok=locate.tokens[paths.classic.indexes[0]];
                    } else {
                        if (paths.arrow) {
                            inctok=locate.tokens[paths.arrow.indexes[0]];
                        }   
                    }
                    if (inctok) {
                        var f = {
                            text     :  data.includeFile.include_file,
                            hash     :  include.hash,
                            file : {
                                filename : data.includeFile.filename,
                            },
                            ix    : include.ix
                        };
                        files.push(f);
                        return f;
                    
                    }
                }
            }            
           
                             
                             
            
            
        },
        markers        : function (marker,data) {
            if (data && data.omit) {
                marker.text = data.omit.map(function(x) {return x.text || x.split ;}).join('');
                return marker;
            }
        },
        
    },
    parserNames = Object.keys(parsers),
    result = {
        input : ""+src,
        parts : [],
        tokenPaths:[],
        output : src
    },
    process=function(matches) { 
        var parts = result.output.ArraySplit( matches ),
        dist  = parts.token_distribution,
        tokenPaths = dist.paths;
    
        console.log({matches:matches});
    
        parserNames.forEach(function(pname){
            var input  = tokenPaths[pname];
            if (!input) return;
            if (!input.indexes) return;
            if (input.indexes.length<1) return;
            var parser = parsers[pname];
            if (!parser) return;
            
            input.indexes.map(function(ix){ 
                var tok = parts.tokens[ix];
                tok.ix=ix;
                return tok;
            }).map(function(tok){
                if (db && tok.groups &&  tok.groups.hash) {
                   return parser(tok,db[tok.groups.hash]); 
                } else {
                   return parser(tok);
                }
            }).forEach(function(updated) {
                if (updated) {
                    parts.tokens[updated.ix]=updated;
                }
            });
        });
        result.parts.push(parts);
        result.tokenPaths.push(tokenPaths);
        result.output = parts.tokens.map(function(x){return x.text;}).join('');
        
    };

    matches.forEach(process);
    
    
    return result;
        
    
}

var src = loadFile ("./src/tab-calls.js",0);


let inclusionsEnd;


fs.writeFileSync("./build2.json",JSON.stringify({src},undefined,4));
fs.writeFileSync("./tab-calls.js",src.output+src.outputDB);
/*
var parsed = parse_src (src.output+src.outputDB);
fs.writeFileSync("./build2.parsed.json",JSON.stringify(parsed,undefined,4));
fs.writeFileSync("./build2.parsed.js",parsed.output);
*/

module.exports = src;
