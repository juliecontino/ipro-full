/*! Copyright (c) 2012 SL_CA / den (den@bigmir.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 */

/**
 * simple datalist emulator
 */
(function($) {
    
    var self = {}
    self._init = function() {
        return this.each(function(){
            var el = jQuery(this);
            self._initHTML(el);
            self._initEvents(el);
        });
    }
    
    self._initHTML = function(el) {
//        var sHTML = '<a></a>'
        var sHTML = '<select>'
            + '<option value="" class="_empty"></option>',
            aOptions = el.data('options'),
            sKey, sLabel;
        if (aOptions != undefined && aOptions.length > 0) {
            for (var nI = 0; nI < aOptions.length; nI++) {
                sKey = aOptions[nI].key != undefined ? aOptions[nI].key  : aOptions[nI].value;
                sLabel = aOptions[nI].value != undefined ? aOptions[nI].value  : aOptions[nI].name;
                
                sHTML += '<option value="' + sKey + '" '
                    + (el.val() == sKey ? 'selected' : '')
                    + '>'
                    + sLabel
                    + '</option>';
            }   
        }
        sHTML += '</select>';
        el.parent().append(sHTML);
        //jQuery(sHTML).appentTo();
    }
    
    self._initEvents = function(el){
        var oParent = el.parent(),
            oSelect = oParent.children('select');
        oParent.on('focus', 'select', function(evt){
            
            oParent.addClass('_selector');
            if (el.val() == '' || oSelect.children('option[value="' + el.val() + '"]').size() < 1){
                oSelect[0].selectedIndex = -1;
            } else {
                oSelect.val(el.val());
            }
        }).on('blur.CA_DATALIST change.CA_DATALIST select.CA_DATALIST', 'select', function(evt){
            var mVal = jQuery(this).val();
            if (mVal != '' && mVal != null) {
                mVal = oSelect[0].selectedIndex >= 0 
                    ? oSelect.children().eq(oSelect[0].selectedIndex).text() 
                    : mVal;
                el.val(mVal).focus();
            }
            oParent.removeClass('_selector');
        });
    }
    
    
    $.fn.CADataList = function(){
        return self._init.apply( this, arguments );
    }
})(jQuery);