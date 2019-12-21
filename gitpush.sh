#!/bin/bash
GLITCH_NAME=cyber-soldier
LIB_NAME=tab-calls.js
./build.js || exit 1
echo "linting with jshint"
jshint --verbose ${LIB_NAME} || exit 1
echo "jshint did not find any issues..."
git add ${LIB_NAME} src ${1} && \
git commit  && git push && \
git rev-parse HEAD && \
echo -n "waking up glitch instance..." &&\
curl -s https://${GLITCH_NAME}.glitch.me/ -r 0-64 >/dev/null && \
echo -n "..." && \
curl -s https://${GLITCH_NAME}.glitch.me/style.css -r 0-64 >/dev/null -q && \
echo -n "..." && \
curl -s https://${GLITCH_NAME}.glitch.me/client.js -r 0-64 | grep webSocketSender -q && \
echo "..." && \
curl -s -H "X-Auth-Header: $(cat ./update-auth-code.txt)" https://${GLITCH_NAME}.glitch.me/update.sh 
echo ""
git rev-parse HEAD 
cd live
[[ -e ${LIB_NAME} ]] && rm ${LIB_NAME}
[[ -e *.min.js ]] && rm *.min.js
./test.sh
