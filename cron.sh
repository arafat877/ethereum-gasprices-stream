#!/bin/bash
i=0

while [ $i -lt 30 ]; do
  node index.js >> error.log 2>&1 &
  sleep 2
  i=$(( i + 1 ))
done
