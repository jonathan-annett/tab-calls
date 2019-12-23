#!/bin/bash
GLITCH_NAME=cyber-soldier
LIB_NAME=tab-calls.js
MIN_LIB_NAME=tab-calls.min.js
./build.js || exit 1

wakeup () {
    
echo -n "waking up glitch instance..." &&\
curl -s https://${GLITCH_NAME}.glitch.me/ -r 0-64 >/dev/null && \
echo -n "..." && \
curl -s https://${GLITCH_NAME}.glitch.me/style.css -r 0-64 >/dev/null -q && \
echo -n "..." && \
curl -s https://${GLITCH_NAME}.glitch.me/client.js -r 0-64 | grep webSocketSender -q && \
echo "..." && \
wget -q --tries=5 --waitretry=10 https://${GLITCH_NAME}.glitch.me/${LIB_NAME} -O /dev/null 
    
}
do_test () {
    echo "Local commit# : $(git rev-parse HEAD)"
    cd live
    [[ -e ${LIB_NAME} ]] && rm ${LIB_NAME}
    [[ -e ${MIN_LIB_NAME} ]] && rm ${MIN_LIB_NAME}
    ./test.sh ${GLITCH_NAME} ${LIB_NAME} ${MIN_LIB_NAME}
}
echo "linting with jshint"
jshint --verbose ${LIB_NAME} || exit 1
echo "jshint did not find any issues..."
( git add ${LIB_NAME} src $@ && \
git commit  && git push && \
git rev-parse HEAD && \
wakeup && \
curl -s -H "X-Auth-Header: $(cat ./update-auth-code.txt)" https://${GLITCH_NAME}.glitch.me/update.sh && \
echo "" && 
sleep 2 && \
do_test ) || (wakeup && do_test)
