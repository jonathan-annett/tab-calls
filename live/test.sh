#!/bin/bash
 download () {
     URL="$1"
     FILE="$2"
     if [[ "${FILE}" == "" ]] ; then
        FN="./wget.temp.download"
     else 
        FN="${FILE}"
     fi
     OUT="-O ${FN}"
     
     HTTP=500
     LOOP=true
     echo "downloading ${URL}..."
     while ${LOOP}
     do
     
     [[ -e ${FN} ]] && rm ${FN}
     
     HTTP=$(wget --server-response ${URL} ${OUT} 2>&1 | awk '/^  HTTP/{print $2}')
     
     if [[ "${HTTP}" != "" ]]; then
        if [[ -e ${FN} ]] &&  [[ ${HTTP} -ge 200 ]] && [[ ${HTTP} -lt 300 ]]; then
           echo "downloaded ${URL} OK to ${FN}"
           
           LOOP=false
        else 
           echo "HTTP ${HTTP} Error while downloading ${URL}"
           echo "retrying in 5 seconds..."
           sleep 5
        fi
     else 
         echo "Unknown Error while downloading ${URL}"
         echo "retrying in 10 seconds..."
         sleep 10
     fi
     
     done
 }


echo "tab-calls.js"
echo "------------"
[[ ! -e ./tab-calls.js ]] && download https://cyber-soldier.glitch.me/tab-calls.js ./tab-calls.js
sha256sum tab-calls.js | cut -d" " -f 1 > ./tab-calls.js.sha
grep "tabCalls(\"" tab-calls.js | tail -c 50 |  cut -d"\"" -f 2 > ./tab-calls.js.server.sha
echo "server-commit: $(cat ./tab-calls.js.server.sha)"
echo "sha-256-sum  : $(cat ./tab-calls.js.sha)"
echo "modified     : $(curl -s -v -X HEAD https://cyber-soldier.glitch.me/tab-calls.js 2>&1 | grep -i '^< Last-Modified:'| cut -d" " -f 3-)"
echo "linting with jshint..."
jshint --verbose ./tab-calls.js > ./tab-calls.js.err.txt || $(echo errors exist ; cat ./tab-calls.js.err.txt)
echo ""

echo "tab-calls.min.js"
echo "----------------"


[[ ! -e ./tab-calls.min.js ]] && download https://cyber-soldier.glitch.me/tab-calls.min.js ./tab-calls.min.js
sha256sum tab-calls.min.js | cut -d" " -f 1 > ./tab-calls.min.js.sha
grep "tabCalls(\"" tab-calls.min.js | tail -c 50 |  cut -d"\"" -f 2 > ./tab-calls.min.js.server.sha
echo "server-commit: $(cat ./tab-calls.min.js.server.sha)"
echo "sha-256-sum  : $(cat ./tab-calls.min.js.sha)"
echo "modified     : $(curl -s -v -X HEAD https://cyber-soldier.glitch.me/tab-calls.min.js 2>&1 | grep -i '^< Last-Modified:'| cut -d" " -f 3-)"

echo "linting with jshint..."
cat min-hints.js tab-calls.min.js > ./tab-calls.min.jshint.js
jshint --verbose ./tab-calls.min.jshint.js > ./tab-calls.min.js.err.txt || echo errors exist - see live/tab-calls.min.js.err.txt

