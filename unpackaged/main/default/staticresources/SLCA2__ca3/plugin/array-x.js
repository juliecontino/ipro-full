/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */



if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}



Array.prototype.quickSort = function(sBy, aParams){
    
    if (typeof(sBy) == 'function') {
        this.sort(sBy);
    } else if (typeof(sBy) == 'string') {
        this.sort(function(a,b){
            var sA = a[sBy],
                sB = b[sBy];
            if (aParams != undefined && aParams.lowercase == true) {
                sA = sA.toLowerCase();
                sB = sB.toLowerCase();
            }
            
            return sA > sB
                ? 1 
                : (sA < sB  ? -1 : 0);
        });
    }
    return;
//    
//    qsort(this, 0, this.length);
//            
//    function partition(array, begin, end, pivot) {
//        var piv = array[pivot];
//        array.swap(pivot, end-1);
//        var store = begin;
//        var ix;
//        if (typeof(sBy) == 'string') {
//            for(ix = begin; ix < end-1; ++ix) {
//                if (array[ix][sBy] <= piv[sBy]) {
//                    array.swap(store, ix);
//                    ++store;
//                }
//            }
//        } else if (typeof(sBy) == 'function') {
//            for(ix = begin; ix < end-1; ++ix) {
//                if (sBy(array[ix], piv)) {
//                    array.swap(store, ix);
//                    ++store;
//                }
//            }
//        }
//        array.swap(end - 1, store);
//        return store;
//    }       
//            
//                       
//
//    function qsort(array, begin, end) {
//        if(end - 1 > begin) {
//            var pivot = begin + Math.floor(Math.random() * (end - begin));
//
//            pivot = partition(array, begin, end, pivot);
//            qsort(array, begin, pivot);
//            qsort(array, pivot+1, end);
//        }
//    }            
            
            
}
        
Array.prototype.swap = function(a, b) {
    var tmp = this[a];
    this[a] = this[b];
    this[b] = tmp;
} 

Array.prototype.diff = function(values) {
    if (typeof(values) == 'undefined') {
        return this;
    }
    return this.filter(function(i) {return !(values.indexOf(i) > -1);});
} 

Array.prototype.merge = function(values) {
    if (typeof(values) != 'string' && typeof(values) != 'numeric') {
        for ( var nonDuplicates = [], i = 0, l = values.length; i < l; ++i ) {
            if ( this.indexOf( values[i] ) === -1 ) {
                nonDuplicates.push( values[i] );
            }
        }
        return this.concat( nonDuplicates )
    } else if (typeof(values) != 'undefined') {
        this.push(values);
        return this;
    }
} 


if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisp*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var res = new Array();
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }

        return res;
    };
}

Array.prototype.indexOf = Array.prototype.indexOf || function(elt)
{
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0) ? Math.ceil(from): Math.floor(from); 
    if (from < 0)from += len;

    for (; from < len; from++)
    {
        if (from in this && this[from] === elt)return from;
    }
    return -1;
};


Array.prototype.unique =  Array.prototype.unique || function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
};

Array.prototype.numerize =  Array.prototype.numerize || function() {
    var aResult = {};
    for (var nI = 0; nI < this.length; nI++) {
        aResult[nI] = this[nI];
    }
    return aResult;
}

String.prototype.strip_tags = function() {
    return this.replace(/<\/?[^>]+>/gi, '');
}
String.prototype.nl2br = function() {
    return this.replace(/\n/gi, '<br/>');
}


String.prototype.htmlspecialchars = function() {
    var chars = Array("&", "<", ">", '"', "'");
    var replacements = Array("&amp;", "&lt;", "&gt;", "&quot;", "&#39;");
    var str = new String(this);
    for (var i=0; i < chars.length; i++) {
        var re = new RegExp(chars[i], "gi");
        if(re.test(this)) {
            str = str.replace(re, replacements[i]);
        }
    }
//    console.log(str);
    return '' + str;
}

String.prototype.repeat = function(nCount) {
    var sResult = "";
    for (var nI = 0; nI < nCount; nI++) {
        sResult += this;
    }
    return sResult;
}

String.htmlspecialchars = function(sStr) {
    return sStr.htmlspecialchars();
}

String.token = function(nNumber){
    var sToken = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2));
    if (nNumber != undefined && nNumber > 0) {
        sToken = sToken.substr(0, nNumber);
    }
    return sToken;
}

String.prototype.hashCode = function(){
  return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

String.prototype.trim = String.prototype.trim || function() {
    return this.replace(/^\s+|\s+$/g, ''); 
}

String.prototype.replaceAll = function(sSearch, sReplacement) {
    var oTtarget = this;
    return oTtarget.replace(new RegExp(sSearch, 'g'), sReplacement);
};

String.parseAsArray = function(mValue, mFilter) {
    if (mFilter != undefined) {
        mFilter = typeof(mFilter) == 'string' ? [mFilter] : mFilter;
    }
    if (typeof(mValue) == 'string' ){
        try {
            var aJSON = jQuery.parseJSON(mValue);
            if (aJSON != null) {
                if (mFilter != undefined && mFilter.length > 0) {
                    var aArr = [];
                    jQuery.each(aJSON, function(sKey, mVal){
                        if (mFilter.indexOf(mVal) >= 0) {
                            aArr.push(sKey);
                        }
                    });
                    return aArr;
                } else {
                    return Array.objectKeys(aJSON);
                }
            } else {
                return mValue.split(',');
            }
        }
        catch (e){
            return mValue.split(',');
        }
    } else if (jQuery.isArray(mValue)) {
        return mValue;
    } else if (typeof(mValue) == 'object' && !jQuery.isEmptyObject(mValue)) {
        if (mFilter != undefined && mFilter.length > 0) {
            var aArr = [];
            jQuery.each(mValue, function(sKey, mVal){
                if (mFilter.indexOf(mVal) >= 0) {
                    aArr.push(sKey);
                }
            });
            return aArr;
        } else {
            return Array.objectKeys(mValue);
        }
    }
    return null;
}


String.trim = String.trim || function(sStr) {
    return sStr.trim();
}

Array.prototype.intersect = function() {
    if (!arguments.length) {
        return [];
    }
    var a1  = this, 
        a   = null, 
        a2  = null,
        n   = 0, i, j, l, l2;
    while(n < arguments.length) {
        a = [];
        a2 = arguments[n];
        for (i = 0, l = a1.length; i < l; i++) {
            for (j=0, l2 = a2.length; j < l2; j++) {
                if (a1[i] === a2[j])
                    a.push(a1[i]);
            }
        }
        a1 = a;
        n++;
    }
    return a.unique();
};  

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}


Array.prototype.emptyKey = function() {
    var nI = 0;
    for (; nI < this.length; nI++) {
        if (this[nI] == undefined) {
            return nI;
        }
    }
    return nI;
}

Array.prototype.nonEmptyValues = function() {
    var aArr = new Array();
    for (var nI = 0; nI < this.length; nI++) {
        if (this[nI] != undefined) {
            aArr.push(this[nI]);
        }
    }
    return aArr;
}

if (typeof(console) == 'undefined') {
    console = {log : function(){}, time : function() {}, timeEnd : function(){}};
} else {
    
    if (typeof(console.log) == 'undefined') {
        console.log = function(){}
    }
    if (typeof(console.time) == 'undefined') {
        console.timeCache = {};
        console.time = function(sName){
            console.timeCache[sName] = Date.getTimeStamp();
        }
    }
    if (typeof(console.timeEnd) == 'undefined') {
        console.timeEnd = function(sName){
            if (console.timeCache[sName] != undefined) {
                console.log (sName + ': ' + (Date.getTimeStamp() - console.timeCache[sName]) + ' ms');
                delete console.timeCache[sName];
            }
        }
    }
}



Array.prototype.max = Array.prototype.max || function(){
    return Math.max.apply( Math, this);
};

Array.prototype.min = Array.prototype.min || function(){
    return Math.min.apply( Math, this);
};



if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {
    var T, A, k;
    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }
    if (thisArg) {
      T = thisArg;
    }
    A = new Array(len);
    k = 0;
    while(k < len) {
      var kValue, mappedValue;
      if (k in O) {
        kValue = O[ k ];
        mappedValue = callback.call(T, kValue, k, O);
        A[ k ] = mappedValue;
      }
      k++;
    }
    return A;
  };     
}


    Function.prototype.trace = function()
    {
        var trace = [];
        var current = this;
        while(current)
        {
            trace.push(current.signature());
            current = current.caller;
        }
        return trace;
    }
    Function.prototype.signature = function()
    {
        var signature = {
            name: this.getName(),
            params: [],
            toString: function()
            {
                var params = this.params.length > 0 ?
                    "'" + this.params.join("', '") + "'" : "";
                return this.name + "(" + params + ")"
            }
        };
        if(this.arguments)
        {
            for(var x=0; x<this .arguments.length; x++)
                signature.params.push(this.arguments[x]);
        }
        return signature;
    }
    Function.prototype.getName = function()
    {
        if(this.name)
            return this.name;
        var definition = this.toString().split("\n")[0];
        var exp = /^function ([^\s(]+).+/;
        if(exp.test(definition))
            return definition.split("\n")[0].replace(exp, "$1") || "anonymous";
        return "anonymous";
    }



Array.objectKeys = function(oObj) {
    var aResult = [];
    for (var sKey in oObj){
        if (oObj.hasOwnProperty(sKey)) {
            aResult.push(sKey);
        }
    }
    return aResult;
}
Array.objectValues = function(oObj) {
    if (typeof (oObj) == 'array') {
        return oObj;
    }
    var aResult = [];
    for (var sKey in oObj){
        if (oObj.hasOwnProperty(sKey)) {
            aResult.push(oObj[sKey]);
        }
    }
    return aResult;
}

Array.build = Array.build || function(nMin, nMax) {
    var aResult = [];
    for (var nI = nMin; nI < nMax; nI++) {
        aResult.push(nI);
    }
    return aResult;
}

String.getCaret = function(el) {
    if (el.selectionStart) {
        return el.selectionStart;
    } else if (document.selection) {
        el.focus();
 
        var r = document.selection.createRange();
        if (r == null) {
            return 0;
        }
 
        var re = el.createTextRange(),
        rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
 
        return rc.text.length;
    } 
    return 0;
}

String.setSelectionRange = function (input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    }
}
 
String.setCaretToPos = function (input, pos) {
    String.setSelectionRange(input, pos, pos);
}