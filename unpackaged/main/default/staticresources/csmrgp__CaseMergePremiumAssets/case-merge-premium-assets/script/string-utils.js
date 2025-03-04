function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){
        if(txt.toLowerCase() == 'and') {
            return txt;
        }
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function removeSpaces(str) {
    return str.replace(/\s/g,'')
}

function escapeColons(text) {
	return text.replace(/:/g,'\\\\:')
}

function isBlank(text) {
	return text === null || text.trim().length === 0;
}