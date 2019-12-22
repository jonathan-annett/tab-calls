function loadFileContents(filename,cb,backoff,maxBackoff) {
    var xhttp = new XMLHttpRequest();
    backoff = backoff || 1000;
    maxBackoff = maxBackoff || 30000;
    xhttp.onreadystatechange = function() {
        if ( (this.readyState == 4 ) && 
             
             ( ( this.status >= 200  && this.status < 300 )  || 
               ( this.status === 304 ) )
           ) {
            var txt = this.responseText;
            return window.setTimeout(cb,10,undefined,txt);
        }
        
        if (this.readyState == 4 && this.status != 200 && this.status !== 0) {
            return cb ({code:this.status});
        }
    };
    xhttp.onerror = function() {
       
       console.log  ("XMLHttpRequest error");
       setTimeout(function(){
           loadFileContents(filename,cb,Math.min(backoff*2,maxBackoff),maxBackoff);
       },backoff);
    };
    xhttp.open("GET", filename, true);
    xhttp.send();
}


function renderHtml(html,db) {
    var keys = Object.keys(db);
    var busy=keys.length>0;
    var render = busy ? function(k){
                       var chop = html.split('${'+k+'}'); 
                       if (chop.length===1) return;
                       busy=true;
                       var v = typeof db[k] === 'function' ? db[k](db,k,html) : db[k].toString();
                       html = chop.join(v);
                  } : false;
                  
    while(busy) {
        busy=false;
        keys.forEach(render);
    }
    
    return html;
}

function extractHtmlChunk(html,chunkName,chunkN) {
    var 
    prefix = '<!--['+chunkName+'.start]-->',
    suffix = '<!--['+chunkName+'.end]-->';
    
    var chunks = html.split(prefix);
    
    if (typeof chunkN==='number') {
        if (chunkN < chunks.length) {
            html = chunks[chunkN]; 
            chunks = html.split(suffix);
            if (chunks.length>1) {
                return chunks[0]; 
            }
        }
    } else {
        if (chunks.length===2) {
            html = chunks[1]; 
            chunks = html.split(suffix);
            if (chunks.length===2) {
                return chunks[0]; 
            }
        }
    }
    return false;
}