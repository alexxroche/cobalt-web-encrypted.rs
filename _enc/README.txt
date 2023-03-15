This enables the creation of encrypted posts

It presents as a blank page with a single input text box.

There is currently poor separation of concerns as js/discretion.js
outputs specifically for my blog.

Once _enc/encobalt.html has been used to encrypt the post
and it, (and the salt) have been embedded into _enc/new_post.html
it can be moved into site/${year}/random/obfuscation/path/$(date +%FT%TZ).html

When cobalt rebuilds the site it does NOT include links to the
encrypted posts: This is a desirable feature.
