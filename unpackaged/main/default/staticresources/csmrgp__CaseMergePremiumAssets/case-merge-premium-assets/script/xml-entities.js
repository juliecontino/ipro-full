//Recursively unescapes XML entities in object fields / arrays / text
function unescapeXMLEntities(obj) {
    if(typeof obj == 'string'){ //NOPMD
        return obj.replace(/(&quot;)|(&#34;)/g, '"')
        .replace(/(&apos;)|(&#39;)/g, "'")
        .replace(/(&lt;)|(&#60;)/g, '<')
        .replace(/(&gt;)|(&#62;)/g, '>')
        .replace(/(&amp;)|(%26)/g, '&');
    }
    else if(typeof obj == 'object') {
        for(var field in obj){
            obj[field] = unescapeXMLEntities(obj[field]);
        }
        return obj;
    }
}

//Recursively escapes XML entities in object fields / arrays / text
function escapeXMLEntities(obj) {
    if(typeof obj == 'string'){ //NOPMD
        // return obj.replace(/&/g, '&amp;')
        return obj.replace(/&/g, '%26')
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    else if(typeof obj == 'object') {
        for(var field in obj){
            obj[field] = escapeXMLEntities(obj[field]);
        }
    }
    return obj;
}