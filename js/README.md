cobalt-web is an excellent static site generator;
 perfect for a vanity blog, or publishing company news.

I needed to have a post that was encrypted so as to firewall off the
 information. js/discression.js uses libSodium to stretch a passphrase and
 then encrypt the post, as well as being able to decrypt the post.

It is a little clunky and manual, as, (for now) the post has to be encrypted
 using _enc/encobalt.html

TODO:
The next stage would be to have cobalt itself watch for an `enc: true` header
 and do the encryption itself without need for any childish server side JS.
