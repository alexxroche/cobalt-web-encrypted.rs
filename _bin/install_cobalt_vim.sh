#!/bin/sh
# install_cobalt_vim.sh ver. 20230315135406 Copyright 2023 alexx, MIT License
# RDFa:deps="[vim]"
usage(){ printf "Usage: %s [-h]\n\t -h This help message" "$(basename $0)";
exit 0;}
[ "$1" ]&& echo "$1"|grep -q '\-h' && usage

## https://shopify.github.io/liquid/
#https://shopify.github.io/liquid/filters/date/

grep -q '.vim/template/post.template' $HOME/.vimrc || {
cat >>$HOME/vimrc<<EOF
""" used to create blog post header
function! s:insert_post_header()
    let template = $HOME . "/.vim/template/post.template"
    let title = expand("%:t:r") " Get file name without path or extension
    let file_name_lower = tolower(title)
    let file_name = substitute(file_name_lower, " ", "-", "g")
    let now = strftime("%Y-%m-%d %H:%M:%S %z") " Get the current year in format YYYY
    let year = strftime("%Y") " Get the current year in format YYYY
    let month = strftime("%m") " Get the current year in format YYYY
    let whoami = $USER
    let email = system("getent passwd ${USER}: /etc/passwd | awk -F\: '{print $5}' | awk -F\, '{print $4}'|grep '@'||printf '%s@%s' ${USER} localhost")
    let i = 0
    for line in readfile(template)
        let line = substitute(line, "<title>", title, "ge")
        let line = substitute(line, "<file_name>", file_name, "ge")
        let line = substitute(line, "<now>", now, "ge")
        let line = substitute(line, "<year>", year, "ge")
        let line = substitute(line, "<month>", month, "ge")
        let line = substitute(line, "<whoami>", whoami, "ge")
        let line = substitute(line, "<email>", email, "ge")
        call append(i, line)
        let i += 1
    endfor
    execute "normal! Go\<Esc>k"
    " call setfperm(file_name,"rwxr-xr-x")
    call setfperm(expand("%"),"rwxr-xr-x")
endfunction
autocmd BufNewFile *.{post,.md} call <SID>insert_post_header()
EOF

# Now we create the template that has the minimum requirements
# for a valid post to be processed by cobalt
mkdir -p $HOME/.vim/template/ 2>/dev/null
cat>>$HOME/.vim/template/post.template<<EOF
---
title: <title>
published_date: <now>
is_draft: true
permalink: /<year>/<month>/<file_name>.html
tags: 
 - blog
data: 
    updated: <now>
    author:
        name: <whoami>
        email: <email>
    thr_totle: 0
---
EOF

}

howto(){
cat <<EOF
  # then we create a new post
    vim posts/"My next Blog Post".post
  # Once drafted
    mv posts/"My next Blog Post".post posts/"My next Blog Post".md

  # and then we can publish it 
    cobalt publish posts/"My next Blog Post".md

  # and build the HTML from it
    cobalt build

  # or we can build and put it live
    _bin/deploy_cobalt_site.sh

  # N.B. _bin has a leading underscore so that cobalt ignores it
EOF

}
