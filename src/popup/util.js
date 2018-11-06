

var Util = {};

Util.getSetting = function(key, defaultValue){
    if( localStorage.getItem(key) ){
        return localStorage.getItem(key);
    }
    else{
        return defaultValue;
    }
}


Util.getSetting = function(key, defaultValue, isObject){
    if( localStorage.getItem(key) ){
        if(isObject){
            return JSON.parse( localStorage.getItem(key) );
        }
        else{
            return localStorage.getItem(key);
        }
    }
    else{
        return defaultValue;
    }
}



Util.substr = function(text, len, truncation) {
    if (truncation === undefined) { truncation = ''; }
    var text_array = text.split('');
    var count = 0;
    var str = '';
    for (i = 0; i < text_array.length; i++) {
        var n = escape(text_array[i]);
        if (n.length < 4) count++;
        else count += 2;
        if (count > len) {
            return str + truncation;
        }
        str += text.charAt(i);
    }
    return text;
}

