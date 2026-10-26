#!/bin/bash
# Runs check.js every 5 minutes; exits (printing the matches) as soon as a watched attraction is available.
WATCH='Tafelmusik|Toronto Symphony Orchestra|Royal Conservatory of Music|Inter Toronto|Etobicoke Philharmonic|Hot Docs|Ontario Science Centre|Reptelia|Ripley'
while true; do
  out=$(node "$(dirname "$0")/check.js" 2>&1)
  hits=$(echo "$out" | node -e 'const s=require("fs").readFileSync(0,"utf8");try{const j=JSON.parse(s);const r=new RegExp(process.argv[1],"i");console.log(j.available.filter(a=>r.test(a)).join(", "))}catch(e){}' "$WATCH")
  echo "$(date -u +%FT%TZ) available-watched: [$hits]"
  [ -n "$hits" ] && { echo "AVAILABLE: $hits"; exit 0; }
  sleep 300
done
