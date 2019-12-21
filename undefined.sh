#!/bin/bash
echo "/* global"
for xx in $(jshint $1 | grep "is not defined" | cut -d"'" -f2 | uniq) ; do echo "      $xx," ; done
echo "*/"
