#!/bin/bash

if [[ "$1" == "" ]]; then
GLITCH_NAME=cyber-soldier
LIB_NAME=tab-calls.js
MIN_LIB_NAME=tab-calls.min.js
else
GLITCH_NAME="$1"
LIB_NAME="$2"
MIN_LIB_NAME="$3"
fi

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


echo "${LIB_NAME}"
echo "------------"
[[ ! -e ./${LIB_NAME} ]] && download https://${GLITCH_NAME}.glitch.me/${LIB_NAME} ./${LIB_NAME}
sha256sum ${LIB_NAME} | cut -d" " -f 1 > ./${LIB_NAME}.sha
grep "tabCalls(\"" ${LIB_NAME} | tail -c 50 |  cut -d"\"" -f 2 > ./${LIB_NAME}.server.sha
echo "server-commit: $(cat ./${LIB_NAME}.server.sha)"
echo "sha-256-sum  : $(cat ./${LIB_NAME}.sha)"
echo "modified     : $(curl -s -v -X HEAD https://cyber-soldier.glitch.me/${LIB_NAME} 2>&1 | grep -i '^< Last-Modified:'| cut -d" " -f 3-)"
echo "linting with jshint..."
jshint --verbose ./${LIB_NAME} > ./${LIB_NAME}.err.txt || $(echo errors exist ; cat ./${LIB_NAME}.err.txt)
echo ""

echo "${MIN_LIB_NAME}"
echo "----------------"


[[ ! -e ./${MIN_LIB_NAME} ]] && download https://${GLITCH_NAME}.glitch.me/${MIN_LIB_NAME} ./${MIN_LIB_NAME}
sha256sum ${MIN_LIB_NAME} | cut -d" " -f 1 > ./${MIN_LIB_NAME}.sha
grep "tabCalls(\"" ${MIN_LIB_NAME} | tail -c 50 |  cut -d"\"" -f 2 > ./${MIN_LIB_NAME}.server.sha
echo "server-commit: $(cat ./${MIN_LIB_NAME}.server.sha)"
echo "sha-256-sum  : $(cat ./${MIN_LIB_NAME}.sha)"
echo "modified     : $(curl -s -v -X HEAD https://cyber-soldier.glitch.me/${MIN_LIB_NAME} 2>&1 | grep -i '^< Last-Modified:'| cut -d" " -f 3-)"

echo "linting with jshint..."
cat min-hints.js ${MIN_LIB_NAME} > ./${MIN_LIB_NAME}.jshint.js
jshint --verbose ./${MIN_LIB_NAME}.jshint.js > ./${MIN_LIB_NAME}.err.txt || echo errors exist - see live/${MIN_LIB_NAME}.err.txt

