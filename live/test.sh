#!/bin/bash
echo "tab-calls.js"
echo "------------"
[[ ! -e ./tab-calls.js ]] && wget --tries=3 --waitretry=5 https://cyber-soldier.glitch.me/tab-calls.js
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
[[ ! -e ./tab-calls.min.js ]] && wget -q https://cyber-soldier.glitch.me/tab-calls.min.js
sha256sum tab-calls.min.js | cut -d" " -f 1 > ./tab-calls.min.js.sha
grep "tabCalls(\"" tab-calls.min.js | tail -c 50 |  cut -d"\"" -f 2 > ./tab-calls.min.js.server.sha
echo "server-commit: $(cat ./tab-calls.min.js.server.sha)"
echo "sha-256-sum  : $(cat ./tab-calls.min.js.sha)"
echo "modified     : $(curl -s -v -X HEAD https://cyber-soldier.glitch.me/tab-calls.min.js 2>&1 | grep -i '^< Last-Modified:'| cut -d" " -f 3-)"

echo "linting with jshint..."
cat min-hints.js tab-calls.min.js > ./tab-calls.min.jshint.js
jshint --verbose ./tab-calls.min.jshint.js > ./tab-calls.min.js.err.txt || echo errors exist - see live/tab-calls.min.js.err.txt

