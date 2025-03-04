
function changeCssClass(mClass, mRule, bNew) {
//    return;
    if (mClass == undefined || mRule == undefined) {
        return;
    }
    
    var nI, oStyle, bIE = jQuery.browser.msie;
    if (arguments.callee.oStyle == undefined) {
        if (arguments.callee.nCounter != undefined && arguments.callee.nCounter > 3) {
            return;
        } else {
            arguments.callee.nCounter = arguments.callee.nCounter == undefined ? 0 : 1 + arguments.callee.nCounter;
        }
        oStyle = jQuery('style[title="CA_custom_css"]');
        bNew = bNew == undefined ? false : bNew;
        if (oStyle.size() < 1) {
            oStyle = jQuery('<style title="CA_custom_css" />').appendTo(jQuery('head'));
        }
        oStyle = oStyle[0].sheet != undefined 
            ? oStyle[0].sheet 
            : (oStyle[0].styleSheet != undefined ? oStyle[0].styleSheet : null);
//        
        if (oStyle === null) {
            for (nI = 0; nI < document.styleSheets.length; nI++) {
                if (document.styleSheets[nI].title == 'CA_custom_css') {
    //                localCA.log('FOUND style!');
                    oStyle = document.styleSheets[nI];
                    console.log('FOUND!');
                    break;
                }
            }
            
            if (oStyle === null) {
                setTimeout(function(){
                    localCA.log('SPECIAL CHECK!  ' + document.styleSheets.length);
                    changeCssClass(mClass, mRule, true);
                }, 1000);
                return false;
            }
        }
        arguments.callee.oStyle = oStyle;
        if (oStyle.media != undefined) {
            oStyle.media.mediaText = '';
            oStyle.disabled = true;
            oStyle.disabled = false;
        }
    } else {
        oStyle = arguments.callee.oStyle;
    }
    
    //var fRemove = oStyle.deleteRule != undefined ? oStyle.deleteRule : oStyle.removeRule;
//    localCA.log('style add 1 ' + oStyle.cssRules + ' / ' + oStyle.rules);
    var aRules = new Array();
    if (oStyle.cssRules) {
        aRules = oStyle.cssRules;
    } else if (oStyle.rules) {
        bIE = true;
        aRules = oStyle.rules;
    }
    else {
        return;
    }
    
    mClass = typeof(mClass) == 'string' ? [mClass] : mClass;
    mRule = typeof(mRule) == 'string' ? [mRule] : mRule;
    
    var nFoundRule = -1, aFoundRule = [];
    if (!bNew) {
        for ( nI = 0; nI < aRules.length; nI++) {
	    if (aRules[nI].selectorText == undefined) {continue;}
            if (mClass.indexOf(aRules[nI].selectorText.toLowerCase()) >= 0) {
                aFoundRule.push(nI);
//                nFoundRule = nI;
                break;
            }
        }
    }
//    localCA.log('style add 2');
    //var sCss = 'div.fc-event[data-calendar-color-id="' + sCalendar + '"] a {background-color: ' + sColor + ' !important}';
    if (aFoundRule.length > 0) {
        for (nI = 0; nI < aFoundRule.length; nI++) {
            oStyle.deleteRule != undefined
                ? oStyle.deleteRule(aFoundRule[nI])
                : oStyle.removeRule(aFoundRule[nI]);
        }
    }
//    localCA.log('style add 3');
    for (nI = 0; nI < mClass.length; nI++) {
        if (bIE && mClass[nI].substr(0, 1) == '@') {
            continue;
        }
        oStyle.addRule != undefined
            ? oStyle.addRule(mClass[nI], mRule[nI])
            : oStyle.insertRule(mClass[nI] + ' {' + mRule[nI] + '}', aRules.length);
    }
//    localCA.log('style add 4');
//    if (oStyle.addRule != undefined) {
//        oStyle.addRule(mClass, mRule);
//    } else {
//        oStyle.insertRule(mClass + ' {' + mRule + '}', aRules.length);
//    }

}

function removeCssClass(mClass){
    var oStyle = changeCssClass.oStyle, aFoundRule = [];
    if (oStyle == null || oStyle == undefined) {
        return;
    }
    var aRules = new Array();
    if (oStyle.cssRules) {
        aRules = oStyle.cssRules;
    } else if (oStyle.rules) {
        aRules = oStyle.rules;
    }
    else {
        return;
    }
    var nFound = 0;
    for (var nI = 0; nI < aRules.length; nI++) {
        if (aRules[nI].selectorText == undefined) {continue;}
        if (mClass.indexOf(aRules[nI].selectorText.toLowerCase()) >= 0 || mClass.indexOf(aRules[nI].selectorText) >= 0) {
            aFoundRule.push(nI - nFound);
            nFound++;
        }
    }
    if (aFoundRule.length > 0) {
        for (nI = 0; nI < aFoundRule.length; nI++) {
            oStyle.deleteRule != undefined
                ? oStyle.deleteRule(aFoundRule[nI])
                : oStyle.removeRule(aFoundRule[nI]);
        }
    }
}


function contrastingColor(color) {

    var luma = function (color) { // color can be a hx string or an array of RGB values 0-255
        var rgb = (typeof color === 'string') ? hexToRGBArray(color) : color;
        return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
    }

    var hexToRGBArray = function hexToRGBArray(color) {
        var rgb = [0 , 0, 0];
        if (color.length === 3) {
            color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
        } else if (color.length === 6) {
                for (var i = 0; i <= 2; i++) {
                    rgb[i] = parseInt(color.substr(i * 2, 2), 16);
                }
        } else if (color.length === 7 && color.substr(0, 1) == '#') {
                for (var i = 0; i <= 2; i++) {
                    rgb[i] = parseInt(color.substr(i * 2 + 1, 2), 16);
                }
        } else if (color.substr(0, 4) == 'rgb(') {
                var aTmp = color.substr(4).split(",");
                for (var i = 0; i <= 2; i++) {
                    rgb[i] = parseInt(jQuery.trim(aTmp[i]));
                }
        }

        return rgb;
    }
    
    return (luma(color) >= 165) ? '000' : 'fff';
}



function changeSize(evt, params){
    var el = jQuery(evt.target),
        elParent = el.parent(),
        aCoords = {"x" : evt.clientX, "y" : evt.clientY, 
            "baseW" : elParent.width(), "baseH" : elParent.height()},
        funcMove = function(evt) {
            elParent
                .width(aCoords.baseW - aCoords.x + evt.clientX)
                .height(aCoords.baseH - aCoords.y + evt.clientY);
        },
        funcStop = function(evt) {
            jQuery(document).off('mousemove',  funcMove);
        };
        
    if (evt.which != 1) {
        return false;
    }  
    
    jQuery(document).on('mousemove', funcMove)
       .one('mouseup', funcStop);    
}
