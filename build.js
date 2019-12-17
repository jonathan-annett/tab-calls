#!/usr/bin/env node
var 
fs=require('fs'),path=require("path"),
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
    return Buffer.from(data).toString('base64');
}

function fromb64(b64) {
    return Buffer.from(b64,'base64').toString('ascii');
}

function loadIncludeFile(filename) {
    var 
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
                
            var b64 = tob64(JSON.stringify(payload));
            return src+'/*excluded:'+b64+'*/';
        }
    }
    
    return src;
}

function saveIncludedFile(filename,src) {
    var 
    tag  = '/*excl'+'uded:',
    upto = src.lastIndexOf(tag);
    if (upto>0){
        var tail = src.lastIndexOf('*/');
        var b64  = src.substr(upto+tag.length,tail);
        var payload = {before:fromb64(b64),after:''}
        try {
            payload = JSON.parse(payload.before);
        } catch (e){
        }
        src =  payload.before+ 
               src.substr(0,upto)+
               payload.after;
    }
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
    var 
    dir      = path.dirname(filename),
    src      = loadIncludeFile(filename),
    logs     = [],    
    includes = findIncludes(src),
    
    cloners = [];
    
    includes.forEach(function(fn){
        var 
        
        file = path.join(dir,fn),
        splits = src.split('"include '+fn+'";'),
        sub_src = splits.length==2 ? loadIncludeFile(file) : false;
                
        if (sub_src) {
            var
            last_fn = path.join(last_path,fn),
            last_src = fs.existsSync(last_fn) ? fs.readFileSync(last_fn,"utf-8") : '';
    
            logs.push("included "+fn+(last_src===sub_src?'':' - updated'));
            var ws = leadingWhitespace(sub_src);
            src = splits.join(
                '/*included file begins:"'+fn+'"*/\n'+
                ws+sub_src.trimLeft()+'\n'+
                ws+'/*included file ends:"'+fn+'"*/\n'
                );
                
            cloners.push (function(){
                if (fs.existsSync(last_fn)) fs.chmodSync(last_fn, 0666);
                fs.writeFileSync(last_fn,sub_src); 
                fs.chmodSync(last_fn, 0444);
            });
        }
        
    });
    if (fs.readFileSync(outfilename,"utf-8")===src) {
        console.log("src files for "+outfilename+" appears to be unchanged - not updating");    
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

function findIncludedChunks(src) {
    var intro = '/*included file begins:"';
    var intro_tail = '"*/\n';
    
    var splits = src.split(intro);
    var result= [ {text:splits.shift()} ];
    splits.forEach(function(chunk){
        var check = chunk.indexOf(intro_tail);
        if (check>1) {
            var fn=chunk.substr(0,check);
            chunk = chunk.substr(check+intro_tail.length);
            var ws = leadingWhitespace(chunk);
            var outro = '\n'+ws+'/*included file ends:"'+fn+'"*/';
            check = chunk.indexOf(outro);
            if (check >0) {
                result.push ({text:'"include '+fn+'";',file:fn,src:chunk.substr(0,check)});
                result.push ({text: chunk.substr(check+outro.length+1)});
                return;
            }
        }
        result.push({text: chunk,warning:"looks dubious"});
    });
    
    return result;
}

function decompile (compiled_filename,edited_path,last_path,outfile) {
    var
    src       = fs.readFileSync(compiled_filename,"utf-8"),
    backup_fn = path.join(last_path,'backup-'+path.basename(compiled_filename)),
    backup    = fs.existsSync(backup_fn) ?fs.readFileSync(backup_fn,"utf-8") : '',
    changed   = backup!==src;
    
    if (!changed) return changed;

    var
    
    last_fn  = path.join(last_path,outfile),
    last     = fs.readFileSync(last_fn,"utf-8"),
    includes = findIncludedChunks(src),
    rebuilt  = includes.map(function(x){
           if (x.file && x.src) {
            var last_fn = path.join(last_path,x.file);
            var edit_fn=path.join(edited_path,x.file);
            var last = fs.readFileSync(last_fn,"utf-8");
            if (last!==x.src) {
                console.log(compiled_filename+" has been edited - new src file exists:"+edit_fn);
                //fs.writeFileSync(edit_fn,x.src);
                saveIncludedFile(edit_fn,x.src);
            } else {
                if (fs.existsSync(edit_fn)) fs.unlinkSync(edit_fn);
                //fs.writeFileSync(last_fn,x.src);
            }
        }
        return x.text;
    }).join('');
    var edit_fn = path.join(edited_path,outfile);
    if (last!==rebuilt) {
        console.log(compiled_filename+" has been edited - new src file exists:"+edit_fn);
        saveIncludedFile(edit_fn,rebuilt);
    } else {
        if (fs.existsSync(edit_fn)) fs.unlinkSync(edit_fn);
        //fs.writeFileSync(last_fn,rebuilt);
    }
    
    console.info("to keep these edits:");
    console.log("./keep_edits");
    console.info("to undo these edits:");
    console.log("./undo_edits");

    return changed;
}

if (decompile (
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