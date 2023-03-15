#!/bin/sh
# deploy_cobalt_site.sh ver. 20230315135406 Copyright 2023 alexx, MIT License
# RDFa:deps="[cobalt rsync host]"
usage(){ printf "Usage: %s [-h]\n\t -h This help message" "$(basename $0)";
exit 0;}
[ "$1" ]&& echo "$1"|grep -q '\-h' && usage

REMOTE_SERVER="your.example.org" # deployment server

sanity(){
    [ -e "$(which cobalt)" ]|| {
        printf "[e] install cobalt-web\m"
        exit 1
    }
}
sanity

[ "$(host $REMOTE_SERVER 1>/dev/null && echo 1)" ]&& \
    cobalt build && rsync -qmauvPAX _site/* $REMOTE_SERVER:/var/www/alexx.net/html/ || \
printf "[w] Unable to locate %s\n" "$REMOTE_SERVER"
