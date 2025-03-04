/**
 * Author: Malenko Dmitry (2012)
 * Additional functions to strings
 */

/* Parsing color value from string and returning some values as object */
String.prototype.parseColor = function () {
	var str = this;
	var average = 0;
	var revertColor = '#fff';
	if (str.substr(0,1) == '#') {
		var component = str.replace('#','');
		average = Math.round((parseInt(component.substr(0,2),16) + parseInt(component.substr(2,16),10) + parseInt(component.substr(4,2),16)) / 3);
		if (average > 88) {
			revertColor = '#000';
		}
	} else if (str.substr(0,3) == 'rgb') {
		var components = str.replace('rgb(','').replace(')','').split(', ');
		average = Math.round((parseInt(components[0],10) + parseInt(components[1],10) + parseInt(components[2],10)) / 3);
		if (average > 172) {
			revertColor = '#000';
		}
	}
	var res = {
		average : average,
		revertColor : revertColor
	}
	
	return res;
}