/*jshint maxerr:10000*/ 
/*jshint shadow:false*/ 
/*jshint undef:true*/   
/*jshint browser:true*/ 
/*jshint devel:true*/   


/* global
      disable_browser_var_events,
      self,
      HIDE,
      QRCode
*/

       
    /*included-content-begins*/    
    
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
            

    
            function pairingSetup(afterSetup) {
            
                function sleep_management( ) {
                    
                    var sleeping = false, focused = document.hasFocus();
                  
                    window.addEventListener("focus", handleBrowserState.bind(window, true));
                    window.addEventListener("blur", handleBrowserState.bind(window, false));
                  
                    function emit(state) {
                        var event = document.createEvent("Events");
                        event.initEvent(state, true, true);
                        document.dispatchEvent(event); 
                    }
            
                    function handleBrowserState(isActive){
                        // do something
                        focused = document.hasFocus();
                        if (!disable_browser_var_events) {
                            self.variables.focused = focused;
                        }
                        
                        if (focused && sleeping) {
                            sleeping = false;
                            if (!disable_browser_var_events) { 
                                self.variables.sleeping = sleeping;
                            }
                            emit("awake");
                        }
                    }
                  
                  
                    var timestamp = new Date().getTime();
            
                    window.setInterval(function() {
                        var current = new Date().getTime();
                        if (current - timestamp > 2000) {
            
            
                            if (sleeping) {
                              //console_log("snore");
                            } else {
                              sleeping = true;
                              if (!disable_browser_var_events) { 
                                  self.variables.sleeping = sleeping;
                              }
                              emit("sleeping");
                            }
            
                        }
                        timestamp = current;
                    },500);
            
                    emit("awake");
                    
                    if (!disable_browser_var_events) {
                        self.variables.focused = document.hasFocus();
                        self.variables.sleeping = false;
                    }
                    
            
                }
                
                function qs(q,d){
                    return d?d:document.querySelector(q);
                }
            
                function src(fn){
                    if (fn.__src==='string') return fn.___src;
                    var res = fn.toString();
                    res = res.substr(res.indexOf("/*")+2);
                    return HIDE(fn,'__src',res.substr(0,res.lastIndexOf("*/")).trim());
                }
                
                function addCss(rule) {
                  var css = document.createElement('style');
                  css.type = 'text/css';
                  if (css.styleSheet) css.styleSheet.cssText = rule; // Support for IE
                  else css.appendChild(document.createTextNode(rule)); // Support for the rest
                  document.getElementsByTagName("head")[0].appendChild(css);
                }
                
                var 
                
                pairing_html_fields  = {
                          "pair_setup_title"       :  "",
                          "pair_sms_bottom_help"   :  "",
                          "pair_email_bottom_help" :  "",
                          "pair_scan_bottom_help"  :  "",
                          "pair_qr_bottom_help"    :  "",
                          "pair_close_btn"         :  "X"
                }, 
                    
                pairing_html_field_keys = Object.keys(pairing_html_fields);
            
                function pairing_html (cb) { 
                    
                    loadFileContents("/tab-pairing-setup.html",function(err,raw){
                         if (!err) {
                            var chunks = raw.split("<!--pairing-setup-->");
                            if (chunks.length===3) {
                               cb(chunks[1].trim());
                            }
                         }
                    });
                }
                
                function pairing_css (cb) {
                  loadFileContents("/tab-pairing-setup.css",function(err,pr_css){
                         if (!err) {
                             cb(pr_css);
                         }                               
                  });
                }
            
                pairing_css(function(css){
                    addCss(css);
                    
                    if(!self.defaults.pair_by_email) {
                      addCss(".pairing_button_email { display:none;}");
                    }
            
                    if(!self.defaults.pair_by_sms) {
                      addCss(".pairing_button_sms { display:none;}");
                    }
            
                    if(!self.defaults.pair_by_qr) {
                      addCss(".pairing_button_qr, .pairing_button_scan { display:none;}");
                    }
            
                            
                    if(!self.defaults.pair_by_tap) {
                      addCss(".pairing_button_tap, .pairing_button_show { display:none;}");
                    }
            
            
                    pairing_html(function(pr_html){
                      
                        pairing_html_field_keys.forEach(function(tag) {
                          
                          var rep = self.defaults[tag] || pairing_html_fields[tag];
                             
                          pr_html = pr_html.split('{$'+tag+'$}').join(rep);
                          
                        }) ;
              
                        qs(".pairing_setup").innerHTML = pr_html;
                        
                        var 
                        
                        last_i,
                        ws_secret = qs(".pairing_setup .pairing_secret"),
                        
                        btnPairingOff = qs(".pairing_button_off"), 
                        btnPairingOn = qs(".pairing_button_on"), 
                        
                        
                        btnQRCode = qs(".pairing_setup .pairing_buttons .pairing_button_qr"), 
                        btnScan   = qs(".pairing_setup .pairing_buttons .pairing_button_scan"), 
                        btnShow   = qs(".pairing_setup .pairing_buttons .pairing_button_show"), 
                        btnTap    = qs(".pairing_setup .pairing_buttons .pairing_button_tap"), 
                        
                        btnSMS    = qs(".pairing_setup .pairing_buttons .pairing_button_sms"), 
                        btnEMAIL  = qs(".pairing_setup .pairing_buttons .pairing_button_email"), 
                        
                            
                        btnNew    = qs(".pairing_setup .pairing_button_new"), 
                        btnNewConfirmMsg = qs(".pairing_setup .pairing_button_new_wrap span"), 
                        btnNewConfirm = qs(".pairing_setup .pairing_button_new_wrap span button"), 
                        showTap   = qs(".pairing_setup .pairing_show_tap"), 
                        tap       = qs(".pairing_setup .pairing_tap"),
              
                        your_name = qs("#your_name");
                        
                        
                        var secure_digit_charset = "0123456789abcdefghijklmnopqrstuvwxyz";
                            
                        function setMode(mode) {
                            ["pairing_off","show_tap","tap_qr","scan_qr","show_qr","by_email","by_sms"].forEach(
                                function(mod) {
                                    if (mode===mod) {
                                        document.body.classList.add(mode);
                                    } else {
                                        document.body.classList.remove(mod);
                                    }
                                }    
                                
                            );
                        }
                            
                        function secure_digit_factory(size,onclick,selectedChar,bgc) {
                            var fa_font_digits = [
                               //"fas fa-bath",
                               "fas fa-coffee",
                               "fas fa-shield-alt",
                               "fas fa-user-secret",
                               "fas fa-handshake",
                               "fas fa-heart",
                               //"fas fa-tractor",
                               "fas fa-cut",
                               //"fas fa-book-reader"
                            ];
                            var htmls = [];
                            var n = 0;
                            fa_font_digits.forEach(function (cls) {
                                ["red","blue","green","black","fuchsia", "orange"].forEach(function(color){
                                    var bg = selectedChar ? selectedChar === secure_digit_charset[n] ? ' background-color: '+bgc+';' :'':'';
                                    htmls.push ('<i onclick="'+onclick+'" data-char="'+secure_digit_charset[n]+'" class="'+cls+'" style="font-size:'+size+'px;color:'+color+';'+bg+'"></i>');
                                    //htmls.push ('<i onclick="'+onclick+'" data-char="'+charset[n]+'" style="font-size:'+size+'px;">'+charset[n]+'</i>');
                                    n++;
                                });
                                
                            });
                                    
                            var get_digit = function (c,ix){return '<span class="digit_'+ix+'">'+htmls[secure_digit_charset.indexOf(c)]+'</span>';};
                            return function (str,cls) {
                                return (cls ?  '<div class="'+cls+'">' :  '<div>' )  +str.split('').map(get_digit).join('')+'</div>';
                            };
                        }
                        
                        function keyPad (onclick,c,bg) {
                            var secure_digits = secure_digit_factory(36,onclick,c,bg),
                            html = '<div class="keypad">';
                            
                            for (var i=0;i<6;i++) {
                                html += secure_digits(secure_digit_charset.substr(i*6,6),"row"+String(i));
                            }
                    
                            return html + "</div>";
                            
                        }
                        
                        function showTapLogin (div,len,cb) {
                            var 
                            
                            //secure_digits = secure_digit_factory(200,''),
                             
                            passCode ='',
                            fix=function(c,i){
                                 if (i===0) return true;
                                 return (c!==passCode.charAt(i-1));
                            };
                            
                            do {
                                passCode += Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER).toString(36); 
                                passCode = passCode.split('').filter(fix).join('');
                            } while (passCode.length<256);
                            
                            var
                            running = true,
                            seq = Math.floor(Math.random()*(Number.MAX_SAFE_INTEGER/2)),
                            next = function (step) {
                                if (running) {
                                    seq++;
                                    div.innerHTML = keyPad('no_op',passCode.charAt(step),'lime');//secure_digits(passCode.charAt(step));
                                    div.style.backgroundColor=null;
                                    window.setTimeout(next,5000,(step+1) % passCode.length);
                                }
                            };
                            
                            next(0);
                            
                            var candidates = {};
                            
                            self.startPair();
                            self.on("dopair",function(c,fromId){
                                var cand=candidates[fromId];
                                if (cand)  {
                                    
                                    if (cand.seq!==seq){
                                        cand.build=cand.progress;
                                        cand.seq=seq;
                                    } 
                                    
                                    cand.c=c;
                                    cand.progress=(cand.build+c).substr(-len);
                                } else {
                                    candidates[fromId] = cand = {build:'',c:c,progress:c,seq:seq};
                                }
                                
                               
                                if (cand.progress.length>=len && passCode.indexOf(cand.progress)>=0) {
                                    running = false;
                                    div.innerHTML = fromId;
                                    self.endPair(fromId,ws_secret.value,your_name.value);
                                    
                                    Object.keys(candidates).forEach(function(k){
                                        var cand = candidates[k];
                                        delete candidates[k];
                                        delete cand.c;
                                        delete cand.build;
                                        delete cand.progress;
                                    });
                                    self.on("dopair",false);
                                    
                                    cb();
            
                                }
                            });
                            
                            return {
                                stop : function () {
                                    running = false;
                                    div.innerHTML = "";
                                    Object.keys(candidates).forEach(function(k){
                                        delete candidates[k];
                                    });
                                    self.endPair();
                                    self.on("dopair",false);
                                    
                                    
                                    
                                }
                            };
                            
                        }
              
                        //https://stackoverflow.com/a/25490531/830899
                        function getCookieValue(a) {
                          var b = document.cookie.match("(^|[^;]+)\\s*" + a + "\\s*=\\s*([^;]+)");
                          return b ? b.pop() : "";
                        }
            
                        //https://stackoverflow.com/a/24103596/830899
                        function setCookie(name, value, days) {
                          var expires = "";
                          if (days) {
                            var date = new Date();
                            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
                            expires = "; expires=" + date.toUTCString();
                          }
                          document.cookie = name + "=" + (value || "") + expires + "; path=/";
                        }
              
                        your_name.value = getCookieValue("your_name");
              
                       
            
                        var qrcode_prefix = document.location.href.substr(
                            0,document.location.href.lastIndexOf("/")+1
                        )+"?pair=";
                                
                        var qrcode = new QRCode(qs(".pairing_setup .pairing_qrcode"), {
                            width  : 300,
                            height : 300
                        });
                
                         
                          var 
                          
                          video = document.createElement("video"),
                          canvasElement = qs(".pairing_setup .pairing_video_canvas"), 
                          canvas = canvasElement.getContext("2d");
                          //loadingMessage = qs(".pairing_setup .pairing_video_message");
                          //outputContainer = qs(".pairing_setup .pairing_video_output");
                          
                        
                          function drawLine(begin, end, color) {
                            canvas.beginPath();
                            canvas.moveTo(begin.x, begin.y);
                            canvas.lineTo(end.x, end.y);
                            canvas.lineWidth = 4;
                            canvas.strokeStyle = color;
                            canvas.stroke();
                          }
                        
                        
                          var 
                          notified = false,
                          stopped = true,
                          
                          start = function () {
                              
                              // Use facingMode: environment to attemt to get the front camera on phones
                              navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
                                  
                                video.srcObject = stream;
                                video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                                stopped = false;
                                    
                                video.play();
                                requestAnimationFrame(tick);
                                
                              });
                    
                          };
                          
                          
                          function tick() {
                            if (! notified ) {
                              //loadingMessage.innerText = "⌛ Loading video...";
                              notified =true;
                            }
                            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                              //loadingMessage.hidden = true;
                              canvasElement.hidden = false;
                              //outputContainer.hidden = false;
                        
                              canvasElement.height = video.videoHeight;
                              canvasElement.width = video.videoWidth;
                              canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                              var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                              var code = /*global jsQR*/jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: "dontInvert",
                              });
                              if (code) {
                                drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                                drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                                drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                                drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                                
                                if (code.data.startsWith(qrcode_prefix)) {
                                  code.data = code.data.substr(qrcode_prefix.length);
                                  if (code.data.length>32) {
                                     try  {
                                       var data = JSON.parse(atob(code.data));
                                       if (data.secret && data.secret.length===32) {
                                          code.data = data.secret;
                                       }
                                     } catch(e) {
                                       
                                     }
                                  }
                                  
                                  if (code.data.length===32) {
                                      ws_secret.focus();
                                      ws_secret.value = code.data;
                                      localStorage.WS_Secret=code.data; 
                                      makeCode();
                                      self.newSecret(localStorage.WS_Secret,"remoteScan");
                                      pairing_off();
                                      self.__on("change");
                                  }
                                } else {
                                  
                                    if (code.data.startsWith("https://") && code.data.indexOf("?pair=")>0) {
                                        location.replace(code.data);
                                    }
                                }
                    
                              }
                            }
                            
                            if (stopped) {
                                video.srcObject.getTracks()[0].stop();  // if only one media track
                            } else {
                                requestAnimationFrame(tick);
                            }
                          }
                        
                    
                          function stop (){
                              stopped = true;
                          }
                    
            
                          function makeCode () {
                               var data = {
                                 from:your_name.value,
                                 secret:localStorage.WS_Secret
                               };
                             qrcode.makeCode( qrcode_prefix+btoa(JSON.stringify(data)));
                          }
            
                          window.keypadTap = function (c,i) {
                              if (last_i) {
                                  if (last_i===i) {
                                      last_i.style.backgroundColor="lime";
                                      return;
                                  }
                                  last_i.style.backgroundColor=null;
                              }
                              i.style.backgroundColor="lime";
                              last_i=i;
                              self.doPair(c);
                          };
                          
                          tap.innerHTML = keyPad("keypadTap(this.dataset.char,this);");
                          
                          var activeLogin;
                          
            
                          function pairing_off(e){
                              if (e) e.preventDefault();
                              
                              setMode("pairing_off");
                              if (!stopped) stop();
                              self.on("newsecret",false);
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
                          
                          function show_qr(e){
                              if (e) e.preventDefault();
                              setMode("show_qr");
                              if (!stopped) stop();
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                              
                              self.on("newsecret",function (reason){
                                  if (reason==="remoteScan") {
                                     pairing_off();
                                  }
                              });
                            
                            your_name.oninput=function() {
                              setCookie("your_name",your_name.value,999);
                              makeCode();
                            };
                          }
                          
                          function scan_qr(e){
                              if (e) e.preventDefault();
                              setMode("scan_qr");
                              self.on("newsecret",false);
                                  
                              if (stopped) {
                                  window.setTimeout(start,10);
                              }
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
                          
                          function show_tap (e){
                                 if (e) e.preventDefault();
                                 setMode("show_tap");
                                 if (!stopped) stop();
                                 self.on("newsecret",false);
                                  
                                 if (last_i) {
                                     last_i.style.backgroundColor=null;
                                 }
                                 last_i=undefined;
                                 
                                 if (activeLogin) {
                                     activeLogin.stop();
                                 }
                                 activeLogin =  showTapLogin(showTap,8, function() {
                                     setMode("pairing_off");
                              
                                     if (last_i) {
                                         last_i.style.backgroundColor=null;
                                         last_i=undefined;
                                     }
                                     activeLogin=undefined;
                                 });
                                
                          }
                          
                          function tap_qr(e){
                              if (e) e.preventDefault();
                            
                              if (!stopped) stop();
                              self.on("newsecret",function(reason){
                                  if (reason==="remoteTap") {
                                      pairing_off();
                                  }
                              });
                            
                              
                                  
                              setMode("tap_qr");
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
              
                          function by_sms(e){
                            
                            if (e) e.preventDefault();
                            
                            if (!stopped) stop();
                            
                            var
                            
                            copy_sms_url = qs("#copy_sms_url"),
                            sms_url = qs("#sms_url"),
                            phone = qs("#phone"),
                           
                            send_sms  = qs("#send_sms"),
                            sms_preview = qs("#sms_preview");
            
                            document.body.classList.remove("url_copied");
                            document.body.classList.remove("sms_number_bad");
                            
                            function isValidPhone(p) {
                              
                              return /^(0\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(p);
                            }
                            
                            var update_link = function () {
            
                               var data = {
                                 from:your_name.value,
                                 secret:localStorage.WS_Secret
                               };
                               var b64 = btoa(JSON.stringify(data));
                              
                               sms_url.value  = location.href.split("?")[0] + "?pair="+b64 ;
                               var txt = [
            
                                  "Hi, It's "+your_name.value+".",
                                  self.defaults.pair_sms_oneliner
                               ];
                              
                              
            
                               sms_preview.innerHTML = txt.join("\r")+"\rhttps://"+location.host+"?pair=..."; 
                               txt.push(sms_url.value); 
                               send_sms.href= "sms:"+phone.value+"?body="+txt.join("%0A%0A") ;
                              
                               document.body.classList.remove("sms_number_bad");
                               
                               send_sms.onclick = function (e) {
                                   if(!isValidPhone(phone.value)) {  
                                     e.preventDefault();
                                     phone.focus();
                                     phone.select();
                                     
                                     document.body.classList.add("sms_number_bad");
                                   } else {
                                      alert ("once you have sent the message, switch back to this page");
                                   }
                               };
                              
                            };
            
                            your_name.oninput=function() {
                              setCookie("your_name",your_name.value,999);
                              update_link();
                            };
            
                            phone.value = "";
            
                            phone.oninput=update_link; 
                            update_link();
                            
                            function CopySMS() {
                              //e.preventDefault();
                              sms_url.select();
                              document.execCommand("copy");
                              document.body.classList.add("url_copied");
                            }
                          
                            copy_sms_url.onclick = CopySMS; 
                            
                              self.on("newsecret",false);
                                  
                              setMode("by_sms");
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
              
                          function by_email(e){
                              
                            if (e) e.preventDefault();
                            
                            if (!stopped) stop();
                             
                             var 
                            copy_email_url = qs("#copy_email_url"),
                            email_url = qs("#email_url"),
                            email = qs("#email"),
                             send_email  = qs("#send_email"),
                            email_preview = qs("#email_preview");
            
                            document.body.classList.remove("url_copied");
                            
                            function CopyEMAIL() {
                              //e.preventDefault();
                              email_url.select();
                              document.execCommand("copy");
                              document.body.classList.add("url_copied");
                            }
            
                            var update_link = function () {
            
                               var data = {
                                 from:your_name.value,
                                 secret:localStorage.WS_Secret
                               };
                               var b64 = btoa(JSON.stringify(data));
                              
                               email_url.value  = location.href.split("?")[0] + "?pair="+b64 ;
                               var txt = [
            
                                  "Hi, It's "+your_name.value+".",
                                  self.defaults.pair_email_oneliner,
                                  email_url.value 
            
                               ];
            
                               email_preview.innerHTML = txt.join("\r"); 
                               send_email.href= "mailto:"+email.value+"?subject=URL%20for%20Website&body="+txt.join("%0A%0A") ;
                            };
            
                            your_name.oninput=function() {
                              setCookie("your_name",your_name.value,999);
                              update_link();
                            };
            
                            email.value = "";
            
                            email.oninput=update_link; 
                            update_link();
                          
                            copy_email_url.onclick = CopyEMAIL; 
                            
                              self.on("newsecret",false);
                                  
                              setMode("by_email");
                              if (last_i) {
                                  last_i.style.backgroundColor=null;
                                  last_i=undefined;
                              }
                              if (activeLogin) {
                                  activeLogin.stop();
                                  activeLogin=undefined;
                              }
                          }
                        
                          btnQRCode.addEventListener("click",show_qr);
                          
                          btnScan.addEventListener("click",scan_qr);
                          
                          btnShow.addEventListener("click",show_tap);
                          
                          btnTap.addEventListener("click",tap_qr);
              
              
                          btnSMS.addEventListener("click",by_sms);
              
                          btnEMAIL.addEventListener("click",by_email);
              
                          function btnNewConfirmClick(){
                               localStorage.WS_Secret = ws_secret.value = self.randomId(32); 
                               self.newSecret(localStorage.WS_Secret,"newCode");
                               makeCode();
                               btnNewConfirmMsg.classList.remove("showing");
                          }
              
              
                          btnNew.addEventListener("click",function(){
                              if (self.__senderIds.length === -1) {
                                  btnNewConfirmClick();
                              } else {
                                  btnNewConfirmMsg.classList.toggle("showing");
                              }
                          }); 
              
                          btnNewConfirmMsg.addEventListener("click",function(){
                              btnNewConfirmMsg.classList.remove("showing");
                          }); 
                          btnNewConfirm.addEventListener("click",btnNewConfirmClick);
                          
                          
                          btnPairingOff.addEventListener("click",pairing_off);
                          
                          btnPairingOn.addEventListener("click",function(){
                            
                            switch (self.defaults.pair_default_mode) {
                                case "show_qr" : if(self.defaults.pair_by_qr) return show_qr(); break;
                                case "scan_qr" : if(self.defaults.pair_by_qr) return scan_qr(); break;
                                case "show_tap" : if(self.defaults.pair_by_tap) return show_tap(); break;
                                case "tap" : if(self.defaults.pair_by_tap) return tap_qr(); break;
                                case "by_email" : if(self.defaults.pair_by_email) return by_email(); break;
                                case "by_sms" : if(self.defaults.pair_by_sms) return by_sms(); break;
                            }
                            
                            if(self.defaults.pair_by_qr) {
                                return show_qr();
                            }
                            
                            if(self.defaults.pair_by_tap) {
                                return show_tap();
                            }
                            
                            if(self.defaults.pair_by_sms) {
                               return by_sms();
                            }
                            
                            if(self.defaults.pair_by_email) {
                                return by_email();
                            }
              
            
                       
              
                                
                        if(!self.defaults.pair_by_tap) {
                          addCss(".pairing_button_tap, .pairing_button_show { display:none;}");
                        }
                            
                          });
                          
                          ws_secret.value = localStorage.WS_Secret;
                          ws_secret.onblur = function() {
                              localStorage.WS_Secret = ws_secret.value;
                              makeCode();
                              self.newSecret(localStorage.WS_Secret,"editCode");
                          };
                      
                          makeCode();

                          afterSetup();
                          
                          sleep_management( ) ;
                          
            
            
                    });
            
                });
            
            }

