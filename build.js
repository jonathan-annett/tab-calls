#!/usr/bin/env node

    var 
    do_decompile=true,
    exclude_as_json=false,
    compress=true,
    write_debug_files=false,
    fs=require('fs'),path=require("path"),zlib = require('zlib'),
    next_depth=function(depth){return depth===undefined?2:depth+1;},
    prev_depth=function(depth){return depth-1;},
    OK = Object.keys.bind(Object);
    
    function fixupSource(src,replacements) {
        if (typeof replacements==='object') {
            
            OK(replacements).forEach(
               function (key) {
                   var replaceWith = replacements[key];
                   if (typeof replaceWith==='string') {
                       var fixups = src.split('{$'+key+'$}');
                       if (fixups.length>1) {
                           src = fixups.join(replaceWith);
                       }
                   } 
               }    
            );
        }
        
        return src;
    }
    
    function tob64(data) {
        if (compress) {
            return '*'+zlib.deflateSync(data).toString('base64');
        } else {
            return Buffer.from(data).toString('base64');
        }
    }
    
    function fromb64(b64) {
        if (b64.charAt(0)==='*') {
            return zlib.inflateSync(Buffer.from(b64.substr(1),'base64')).toString();
        }
        return Buffer.from(b64,'base64').toString('ascii');
    }
    
    function loadIncludeFile(filename,depth) {
        var 
        depth_tag=(depth&&depth>1?',level '+depth:''),
        tag = "/*included-content-begins*/",
        src = fs.readFileSync(filename,"utf-8"),
        check = src.indexOf(tag);
        
        if (check>=0) {
            var from = src.indexOf('\n',check);
            if (from>check){
                var payload = {
                    before:src.substr(0,from+1),
                    after:'' };
                
                src = src.substr(from+1);
                
                tag = '/*included-content-ends*/';
                check = src.lastIndexOf(tag);
                if (check>0) {
                    payload.after = src.substr(check);
                    src = src.substr(0,check);
                }
                var json = JSON.stringify(payload).split('*/').join('\\u002a/');   
                var b64 = tob64(json);
                return src+'/*excluded'+depth_tag+':'+(exclude_as_json?json:b64)+'*/';
            }
        }
        
        return src;
    }
    
    function getb64json(b64){
        if (b64.startsWith("{")) {
            return b64;
        }
        return fromb64(b64);
    }
    
    function saveIncludedFile(filename,src,depth) {
        var 
        depth_tag=(depth&&depth>1?',level '+depth:''),
        tag  = '/*excl'+'uded'+depth_tag+':',
        upto = src.lastIndexOf(tag);
        if (upto>0){
            var tail = src.lastIndexOf('*/');
            var b64  = src.substring(upto+tag.length,tail);
            var payload = {before:getb64json(b64),after:''}
            try {
                payload = JSON.parse(payload.before);
            } catch (e){
                console.log(e.message,payload.before);
            }
            src =  payload.before+ 
                   src.substr(0,upto)+
                   payload.after;
        }
        //console.log("saving",filename,"at depth",depth);
        fs.writeFileSync(filename,src);
    }
    
    function findIncludes(src) {
        
        var splits = src.split('"include ').slice(1);
        return splits.map(function(chunk){
            var check = chunk.split('.js";');
            if (check.length>1) {
                return check[0]+".js";
            }
            return null;
        }).filter(function(x){return x!==null});
    }
    
    function leadingWhitespace(str) {
        var sample = str.trimLeft();
        return str.substr(0,str.length-sample.length);
    }
    
    function compile(filename,outfilename,last_path) {
        console.log("compiling:",filename,"-->",outfilename);
        
        var 
        dir      = path.dirname(filename),
        src      = loadIncludeFile(filename),
        logs     = [],    
        cloners = [],
        grind = function(depth) {
            var includes = findIncludes(src),
            depth_tag=(depth&&depth>1?',level '+depth:'');
            
            includes.forEach(function(fn){
                var 
                
                file = path.join(dir,fn),
                splits = src.split('"include '+fn+'";'),
                sub_src = splits.length==2 ? loadIncludeFile(file,depth) : false;
                        
                if (sub_src) {
                    var
                    last_fn = path.join(last_path,fn),
                    last_src = fs.existsSync(last_fn) ? fs.readFileSync(last_fn,"utf-8") : '';
            
                    logs.push("included "+fn+(last_src===sub_src?'':' - updated'));
                    var ws = leadingWhitespace(sub_src);
                    src = splits.join(
                        '/*included file begins'+depth_tag+':"'+fn+'"*/\n'+
                        ws+sub_src.trimLeft()+'\n'+
                        ws+'/*included file ends'+depth_tag+':"'+fn+'"*/\n'
                        );
                        
                    cloners.push (function(){
                        if (fs.existsSync(last_fn)) fs.chmodSync(last_fn, 0666);
                        fs.writeFileSync(last_fn,sub_src); 
                        fs.chmodSync(last_fn, 0444);
                    });
                }
                
            });
            if (src.indexOf('"include ')>=0) {
                grind(next_depth(depth));
            }    
        }
        
        grind(1);
        
        
        if (fs.readFileSync(outfilename,"utf-8")===src) {
            console.log("           "+outfilename+" - dependants appear to be unchanged");    
            return false;
        } else {
            logs.forEach(function(m){console.log(m);});
            cloners.forEach(function(fn){fn();});
            fs.writeFileSync(outfilename,src); 
            var last_fn = path.join(last_path,'backup-'+path.basename(outfilename));
            if (fs.existsSync(last_fn)) fs.chmodSync(last_fn, 0666);
            fs.writeFileSync(last_fn,src);
            fs.chmodSync(last_fn, 0444);
            return true;
        }
    }
    
    function findIncludedChunks(src,depth) {
        var depth_tag=(depth&&depth>1?',level '+depth:'');
        var intro = '/*included file begins'+depth_tag+':"';
        var intro_tail = '"*/\n';
        
        var splits = src.split(intro);
        var result= [ {text:splits.shift()} ];
        splits.forEach(function(chunk){
            var check = chunk.indexOf(intro_tail);
            if (check>1) {
                var fn=chunk.substr(0,check);
                chunk = chunk.substr(check+intro_tail.length);
                var ws = leadingWhitespace(chunk);
                var outro = '/*included file ends'+depth_tag+':"'+fn+'"*/';
                check = chunk.indexOf(outro);
                if (check >0) {
                    var outrolen=outro.length,file_ends=check;
                    while (chunk.charAt(check)!=='\n') {check--;outrolen++;}
                    
                    check++;
                    var filechunk = {
                        text:'"include '+fn+'";\n',
                        intro:intro+fn+intro_tail,
                        file:fn,
                        src:chunk.substr(0,file_ends),
                        outro:chunk.substr(check,outrolen),
                    }
                    result.push (filechunk);
                    result.push ({text: chunk.substr(check+outrolen+1)});
                    //console.log({in:filechunk.intro,bytes:filechunk.src.length,out:filechunk.outro});
                    
                    return;
                }
            }
            result.push({text: chunk,intro:intro,file:fn,intro_tail:intro_tail,ws:ws,outro:outro,warning:"looks dubious"});
        });
        return result;
    }
    
    function decompile (compiled_filename,edited_path,last_path,outfile) {
        console.log("decompiling:",compiled_filename,"-->",edited_path+"/"+outfile);
        var
        src       = fs.readFileSync(compiled_filename,"utf-8"),
        backup_fn = path.join(last_path,'backup-'+path.basename(compiled_filename)),
        backup    = fs.existsSync(backup_fn) ?fs.readFileSync(backup_fn,"utf-8") : '',
        changed   = backup!==src;
        
        if (!changed) {
            if (!changed) console.log("             no changes detected in",compiled_filename);
            return changed;
        }
    
        var last_depth;
        for (last_depth=2;last_depth<9;last_depth++) {
            if (src.indexOf('/*included file begins,level '+last_depth+':"')<0) {
                last_depth--;
                break;
            }
        }
    
        var
        last_fn  = path.join(last_path,outfile),
        last     = fs.readFileSync(last_fn,"utf-8"),
        rebuilt  = src;
        
        function grind(depth) {
            
            if (write_debug_files) fs.writeFileSync("./level-"+depth+"-before.js",rebuilt); 
            
            var includes = findIncludedChunks(rebuilt,depth);
            /*
            console.log("level:",depth,"embeded files:",
               includes
                 .map(function(x){return x.file?x.file:null;})
                   .filter(function(x){return x!==null;})
                     .join(",")
            );
            */
            
            rebuilt  = includes.map(function(x){
                if (x.file && x.src) {
                    var last_fn = path.join(last_path,x.file);
                    var edit_fn=path.join(edited_path,x.file);
                    var last = fs.readFileSync(last_fn,"utf-8");
                    if (last.trimRight()!==x.src.trimRight()) {
                        console.log("             "+compiled_filename+" --(updated dependant)--> "+edit_fn);
                        //fs.writeFileSync(edit_fn,x.src);
                        saveIncludedFile(edit_fn,x.src,depth);
                        
                        x.disk=last;
                        x.disk_tail=last.substr(-16);
                        x.src_tail=x.src.trim().substr(-16);
                    } else {
                        if (fs.existsSync(edit_fn)) fs.unlinkSync(edit_fn);
                        //fs.writeFileSync(last_fn,x.src);
                    }
                }
                return x.text;
                //return depth===1 ? x.text :  x.file ? x.intro+x.src+x.outro  : x.text;
            }).join('');
            
            if (write_debug_files) fs.writeFileSync("./level-"+depth+"-data.json",JSON.stringify(includes,undefined,4)); 

            if (write_debug_files) fs.writeFileSync("./level-"+depth+"-after.js",rebuilt); 
            
            
            if (depth > 1) {
                grind(prev_depth(depth));
            }
        }
        
        grind(last_depth);
        
        var edit_fn = path.join(edited_path,outfile);
        if (last!==rebuilt) {
            console.log("             "+compiled_filename+" --(updated)--> "+edit_fn);
            saveIncludedFile(edit_fn,rebuilt);
        } else {
            if (fs.existsSync(edit_fn)) fs.unlinkSync(edit_fn);
            //fs.writeFileSync(last_fn,rebuilt);
        }
        console.log("");
        console.log("");
        console.log("./keep_edits  #to keep these edits");
        console.log("./undo_edits  #to undo these edits");
        
        return changed;
    }
    if (do_decompile && decompile (
        "./tab-calls.js",
        "./src-edited",
        "./src-last",
        "tab-calls.js")) {
        process.exit(1);    
    } else {
        if (compile(
            "./src/tab-calls.js",
            "./tab-calls.js",
            "./src-last")) {
                process.exit(0);
            } else {
                if (fs.existsSync('./src-edited/tab-calls.js')){
                    fs.unlinkSync('./src-edited/tab-calls.js');
                }
                process.exit(0);
            }
    }
    
