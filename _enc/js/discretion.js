window.sodium = {
    onload: function (sodium) {

    const nonceBytes = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
    const KEY_LEN = sodium.crypto_box_SEEDBYTES;
    const SALT_LEN = sodium.crypto_pwhash_SALTBYTES;

    /**
     * Concatenate n typed arrays
     *
     * @alias module:typedArrayConcat
     * @param {TypedArray} ResultConstructor Returned typed array constructor
     * @param {...TypedArray} arrays Arrays to concatenate
     * @returns {TypedArray}
     */
    function typedArrayConcat(ResultConstructor, ...arrays) {
      let totalLength = 0;
      for (const arr of arrays) {
        totalLength += arr.length;
      }
      const result = new ResultConstructor(totalLength);
      let offset = 0;
      for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return result;
    }

    /**
     * @param {string} message
     * @param {string} key
     * @returns {Uint8Array}
     */
    function encrypt_and_prepend_nonce(message, key) {
        let nonce = sodium.randombytes_buf(nonceBytes);
        var encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(message, null, nonce, nonce, key);
        var nonce_and_ciphertext = typedArrayConcat(Uint8Array, nonce, encrypted);
        return nonce_and_ciphertext;
    }

    /**
     * @param {Uint8Array} nonce_and_ciphertext
     * @param {string} key
     * @returns {string}
     */
    function decrypt_after_extracting_nonce(nonce_and_ciphertext, key) {
        let nonce = nonce_and_ciphertext.slice(0, nonceBytes);
        let ciphertext = nonce_and_ciphertext.slice(nonceBytes);
        var result = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(nonce, ciphertext, null, nonce, key, "text");
        return result;
    }

    /**
     * @param {string} message
     * @param {string} key
     * @returns {string}
     */
    function encrypt(message, key) {
        var uint8ArrayMsg = encrypt_and_prepend_nonce(message, key);
        return u_btoa(uint8ArrayMsg); //returns ascii string of garbled text
    }

    /**
     * @param {string} nonce_and_ciphertext_str
     * @param {string} key
     * @returns {string}
     */
    function decrypt(nonce_and_ciphertext_str, key) {
        var nonce_and_ciphertext = u_atob(nonce_and_ciphertext_str); //converts ascii string of garbled text into binary
        return decrypt_after_extracting_nonce(nonce_and_ciphertext, key);
    }

    function u_atob(ascii) {
        //https://stackoverflow.com/a/43271130/
        return Uint8Array.from(atob(ascii), c => c.charCodeAt(0));
    }

    function u_btoa(buffer) {
        //https://stackoverflow.com/a/43271130/
        var binary = [];
        var bytes = new Uint8Array(buffer);
        for (var i = 0, il = bytes.byteLength; i < il; i++) {
            binary.push(String.fromCharCode(bytes[i]));
        }
        return btoa(binary.join(""));
    }

    var PASSWORD;
        /* This is the encryption listener */
    var new_salt = document.querySelector("#__NEW_SALT__");
    if(new_salt){
        //var random_value = libsodium._randombytes_random();
        //var random_bytes = "" + libsodium._randombytes_random() + libsodium._randombytes_uniform(32768);
        var random_bytes = "" + libsodium._randombytes_random() + libsodium._randombytes_random();
        var random_hex = sodium.to_hex(random_bytes);
        var random_value = random_hex.slice(0,8);
        new_salt.value = random_value;
    }
    var encryption_form = document.querySelector("#eform");
    if(encryption_form){
      document.querySelector("#eform").addEventListener("submit", function(e){
          e.preventDefault();    //stop form submitting
          let p_el = document.getElementById('pin');
          let PASSWORD = p_el.value;
          let c_el = document.getElementById('__CLEAR__');
          let clear = c_el.value;
          let salt_el = document.getElementById('__NEW_SALT__');
          let salt_str = salt_el.value;
          /*
          try {
            console.log("enc %o", JSON.stringify(e.children()));
          }catch(t){ console.log("[w] failed to log " + JSON.stringify(e) + ": " + t); return false;}
            */
        var isValid = false;

        //validate your elems here
        if (clear && clear.length >= 0 && salt_str && salt_str.length >= 8 && salt_str.length < 64){
            // we permit a blank message, and a blank passphrase
            isValid = true;
        }
        if (!isValid) {
            //console.log("form bad: %o", p);
            p_el.value = '';
            if (!c || c.length < 0){
                alert("Missing Post");
            }else if (! salt_str || salt_str.length < 8 || salt_str.length >= 64){
                alert("Please enter a valid salt, \n longer than 8 and shorter than 64 char: '" + salt_str + "'");
            }
            return false;
        }
        console.log("In enc: " + salt_str );
        const salt = sodium.to_hex(salt_str).slice(0,SALT_LEN);

        let data_div = document.getElementById('__DATA__');
        let cipher = data_div.innerHTML;
        let master_key = sodium.crypto_pwhash(KEY_LEN, PASSWORD, salt, 2, 65536 << 10, 2);

        try {
            var encStr = encrypt(clear, master_key);
            //var cipherHTML = encStr.replace('^\\', '');
            let cipher_array = encStr.split('\n');
            var cipherHTML;
            for (let i = 0; i < cipher_array.length; i++) {
                cipherHTML = cipher_array[i].replace('^\\', '');
            } 
            data_div.innerHTML = cipherHTML;
        }catch(e){
            console.log("failed to encrypt: " + e);
            alert("Failed to encrypt: %o", e);
        }
        return false;
      });
    };
    var decryption_form = document.querySelector("#pform");
    if(decryption_form){
    document.querySelector("#pform").addEventListener("submit", function(e){
try {
        e.preventDefault();    //stop form submitting
        let p_el = document.getElementById('pin');
        let p = p_el.value;
        var isValid = false;
        let data_div = document.getElementById('__DATA__');

        //validate your elems here
        //if (p && p.length >= 0 && data_div && data_div.innerHTML.length >= 1){
        if (p_el && data_div && data_div.innerHTML.length >= 1){
            isValid = true;
        }

        if (!isValid) {
            //console.log("form bad: %o", p);
            p_el.value = '';
            if (p && p.length >= 4096 ){
                alert("Invalid passphrase! '" + p + "'");
            }else 
            if ( ! data_div || data_div.innerHTML.length <= 0){
                alert("Missing cipher data!");
            }
            return false;
        }
        else {
            PASSWORD = p;

    let salt_div = document.getElementById('__SALT__');
    var salt_str;
    if(salt_div){
        salt_str = salt_div.innerHTML;
    }
    if( ! salt_str){
        //salt_str = "super-secret-salt-you-should-change";
        salt_str = "S22X2JqiQC4p-wNHS8kv-A14ZpZ-F6CmgSsBUg"; // default
        // used for the master_key (though only the first 8 char)
    }
    console.log("[d] salt_str: " + salt_str);

    const salt = sodium.to_hex(salt_str).slice(0,SALT_LEN);

    let cipher = data_div.innerHTML;
    let master_key = sodium.crypto_pwhash(KEY_LEN, PASSWORD, salt, 2, 65536 << 10, 2);

    try {
        var decryptedStr = decrypt(cipher, master_key);
        //console.log("" + decryptedStr);
        let post_array = decryptedStr.split('\n');
        let in_head=0;
        let in_body=0;
        let title = '';
        let published_date = '';
        let body = '';
        for (let i = 0; i < post_array.length; i++) {
            if ( 1 == in_body ){
                  // change markdown to html
                  var this_line = post_array[i];

                  var old_ital = this_line.indexOf('\/');
                  if (old_ital && old_ital != -1) {
                    var pair = 0;
                    var count = 0;
                    while ( old_ital >= 0 && count <= 4){
                        var line = '';
                        if ( 0 == pair ){
                            line = this_line.substr(0,old_ital) + '<i>' + this_line.substr( old_ital+1, this_line.length);
                            pair = 1;
                        }else if ( 1 == pair){
                            line = this_line.substr(0,old_ital) + '</i>' + this_line.substr( old_ital+1, this_line.length);
                            pair = 0;
                        }
                        this_line = line;
                        old_ital = this_line.indexOf('\/');
                        count++;
                    }
                  }
                  var bold = this_line.indexOf('\*\*');
                  if (bold && bold != -1) {
                    //console.log("HAS bold: " + line);
                    //console.log("bold: " + ital);
                    var pair = 0;
                    var count = 0;
                    while ( bold >= 0 && count <= 4){
                    //while ( bold >= 0 ){
                        var line = '';
                        if ( 0 == pair ){
                            line = this_line.substr(0,bold) + '<strong>' + this_line.substr( bold+2, this_line.length);
                            pair = 1;
                        }else if ( 1 == pair){
                            line = this_line.substr(0,bold) + '</strong>' + this_line.substr( bold+2, this_line.length);
                            pair = 0;
                        }
                        this_line = line;
                        bold = this_line.indexOf('\*\*');
                        count++;
                    }
                  }

                  var ital = this_line.indexOf('\*');
                  if (ital && ital != -1) {
                    var pair = 0;
                    var count = 0;
                    while ( ital >= 0 && count <= 4){
                        var line = '';
                        if ( 0 == pair ){
                            line = this_line.substr(0,ital) + '<i>' + this_line.substr( ital+1, this_line.length);
                            pair = 1;
                        }else if ( 1 == pair){
                            line = this_line.substr(0,ital) + '</i>' + this_line.substr( ital+1, this_line.length);
                            pair = 0;
                        }
                        this_line = line;
                        ital = this_line.indexOf('\*');
                        count++;
                    }
                  }
                  var under = this_line.indexOf('_');
                  if (under && under != -1) {
                    var pair = 0; 
                    var count = 0;
                    while ( under >= 0 && count <= 40){
                        var line = '';
                        if ( 0 == pair ){
                            line = this_line.substr(0,under) + '<i>' + this_line.substr( under+1, this_line.length);
                            pair = 1;
                        }else if ( 1 == pair){
                            line = this_line.substr(0,under) + '</i>' + this_line.substr( under+1, this_line.length);
                            pair = 0;
                        }
                        this_line = line;
                        under = this_line.indexOf('_');
                        count++;
                    }
                  }
                body += this_line + "<br>";
                continue;
            }
            if ( post_array[i] == '---'  && 1 == in_head ){
                in_head = 2;
                in_body = 1;
                continue;
            }
            if ( 1 == in_head && post_array[i].includes('published_date:', 0) ) {
                published_date = post_array[i].slice(16,post_array[i].length);
                continue;
            }
            if ( 1 == in_head && post_array[i].includes('title:', 0) ) {
                title = post_array[i].slice(7,post_array[i].length);
                continue;
            }
            if ( post_array[i] == '---'  && 0 == in_head ){
                in_head = 1;
                continue;
            }
        }
        
        let out_div = document.getElementById('discretion');
        out_div.innerHTML = '<h2 onClick="window.location.reload();">Published: ' + published_date + '</h2><div style="padding-left:16%"><div><h4>' + title + "</h4><p>" + body + "</p>";
        out_div.style = "";
    } catch (e) {
        console.error("oh noez: " + e);
        let p_el = document.getElementById('pin');
        p_el.value = '';
        alert("Did you make a typo? That doesn't seem like a valid passphrase.");
        return false;
    } // try
            return false;
        } // valid form
} catch(e) { console.error("decrypt failed: " + e); }
    }); // form.EventListener
   }; // if(decryption_form)
  } // onload
};
/*
    Usage: encrypt a post.md that is meant for http://cobalt-org.github.io/
    using encobalt.html; add the salt to the __SALT__ div and the cipher to __DATA__
    
<!doctype html>
<html>
<head>
<meta charset="utf-8">
	<link rel="canonical" href="https://localhost/index.html">
    <meta name="robots" content="noindex">
	<link rel="stylesheet" href="./css/blog.css">
        <style type="text/css">
                #__DATA__, #__SALT__, .hidden { display:none; }
                
        </style>
</head><body class="vsc-initialized weather body">
<div class="center" style="opacity: 100;">
<div id="discretion" style="padding-left:41%; padding-top:15%">
	<form id="pform" method="POST" action="#"><input id="pin" type="password" name="speak" autofocus><input type="submit" value="Enter"></form>
</div>
</div>
 <div id="__SALT__">example-salt</div>
 <div id="__DATA__">[cipher text here]</div>
<script src="./js/sodium_sumo.js" async></script>
<script defer type="text/javascript" src="./js/discretion.js"></script>
</body></html>
*/
