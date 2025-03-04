/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
(function(){
    var self = {
        _css        : '/css/calendar-settings.css',
        _parent     : null,
        _div        : null,
        _panel      : null,
        _shadow     : null,
        _defaultTab : "display",
        
        _body       : null,
        _message    : null,
        _manyUnvisible : false,
        _aAddonLoaded : {},
        
        _miniCounter : {},
        _aLookupFields : {},
        
        _aPresets : null,
        _dom_preset : null,
        _nCurrentPreset : null,
        _oLastSetting : null,
        _filterView : null

        
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._parent = parent;
        self._div = parent._dom.el,
        self._setParamFields();
        self._parent.loadCss(self._css);
        self._parent.loadCss('/css/plugin-multi-select.css');
        if (self._panel == null) {
            self._panel = jQuery('<div class="calendar-settings"></div>').appendTo(self._div);
            self._shadow = jQuery('<div class="calendar-settings-shadow"></div>').appendTo(self._div);
            self._panel.html(self._buildHTML());
            self._body = self._panel.find('.body');
            self._error = self._panel.find('.error');
            self._message = self._panel.find('._message');
            self._buildBodyTab(self._defaultTab).addClass('on');
            if (self._parent.options.SA) {
                self._panel.addClass('_adm');
            }
        }
        
        self._initEvents();
    }
    
    view.show = function(params) {
        if (self._parent.options.readonly === true) {
            return;
        }
        self._show(params);
    }
    
    view.removeCalendar = function(sCalendarId) {
        self._body.find('div[data-tab="visible"], div[data-tab="groups"], div[data-tab="web"]')
            .find('div[data-calendar="' + sCalendarId + '"]').remove();
    }
    
    view.hideCalendar = function(sCalendarId, bHide) {
        bHide = bHide == undefined ? true : bHide;
        var oCalendar = self._body.find('div[data-tab="visible"], div[data-tab="groups"], div[data-tab="web"]')
            .children('.multi_select')
                .children('div[data-calendar="' + sCalendarId + '"]');
        if (oCalendar.size() < 1 ) {
            return;
        }
        var oParent = oCalendar.parent().filter(!bHide ? '.unvisible' : ':not(.unvisible)');
        if (oParent.size() > 0) {
            oCalendar.remove().appendTo(oParent.siblings('.multi_select'));
        }
        
    }
    
    view.refreshSettingsCalendars = function() {
        self._body.children('[data-tab="visible"], [data-tab="groups"], [data-tab="web"]').remove();
        self._panel.find('.tab span[data-tab="display"]').click();
    }
    
    view.changeParams = function(aParams) {
        jQuery.each(aParams, function(sKey, mVal){
            var mOldValue = self._parent.params[sKey];
            if (mVal == mOldValue) {
                return;
            }
            self._parent.params[sKey] = mVal;
            if (self['_' + sKey + 'AfterChange'] != undefined) {
                self['_' + sKey + 'AfterChange'](mOldValue);
            }
        });
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
        var oAddon = el.parents('[data-addon]');
        if (oAddon.size() > 0 && self._aAddonLoaded[oAddon.data('addon')] != undefined) {
            return self._aAddonLoaded[oAddon.data('addon')].action(sAction, el, evt);
        }
        if (self._filterView != null) {
            return self._filterView.action(sAction, el, evt);
        }
    }
    
    self._show = function(params) {
        self._panel.addClass('on');
        self._shadow.addClass('on');
        self._hideMessagePopup();
        if (params.mode != undefined) {
            self._panel.find('.tab span[data-tab="' + params.mode + '"]').click();
        }
    }
    
    self._buildHTML = function(params) {
        var sHTML = '<div class=title>' //Calendar settings window
            + self._buildTabsMenu()
//            + '<span class=error></span>'
            + '<span class=close>x</span></div>'
            + '<form>'
            + '<div class=body></div>'
            + '<div class="footer buttons">'
            +   '<span data-mode="save">' + self._parent.getText('save', "Save") + '</span>'
            +   '<span data-mode="cancel" class=close>' + self._parent.getText('cancel', "Cancel") + '</span>'
            + '</div>'
            + '<div class=_message></div>'
            + '</form>';
        
        
        return sHTML;
    }
    
    self._buildTabsMenu = function() {
        var sHTML = "<div class=tab>",
            aTab2Type = {
                'visible' : 'sf',
                'groups' : 'group',
                'web' : 'web'
            };
        
        jQuery.each(self._tab, function(sTab, sName) {
            if (aTab2Type[sTab] != undefined
                && 
                (
                    self._parent._calendars.getPermission('Read', aTab2Type[sTab]) != true
                    || self._parent._calendars.getPermission('Hide', aTab2Type[sTab]) != true
                )
            ) {
                return;
            }
            sHTML += '<span data-tab="' + sTab + '" class="' 
                + (sTab == self._defaultTab ? "on" : "") + '">' 
                + sName 
                + '</span>';
        });
        sHTML += '</div>';
        return sHTML;
    }
    
    self._visibleBody = function() {
        var sHTML = 
            '<span class=multi_select_title>' + self._parent.getText('addon_available', "Available") + '</span>' 
                + '<div data-list="unvisible" class="multi_select CA_ajax_loading unvisible _with_color" unselectable="on"></div>'
                + '<div class="simple_buttons" data-block="calendars">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="sort_left" title="' 
                    + self._parent.getText('cs_sort_by_name', "Sort available by name")
                    + '">&darr;</a>'
                    + '<a data-action="addFolder" title="'
                    + self._parent.getText('cs_add_folder', "Create new Calendar Folder")
                    + '"><span></span></a>'
                    + '<a data-mode="sort_right" title="'
                    + self._parent.getText('cs_sort_available_name', "Sort Selected by name")
                    + '">&darr;</a>'
                    + '<a data-mode="search" title="' + self._parent.getText('search', "Search") + '">'
                    + self._parent.getText('search', "Search")
                    + '</a>' 
                + '</div>'
                + '<div data-list="visible" class="multi_select _with_color" unselectable="on"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>' 
                + '<div class="help"><span></span>'
                + self._parent.getText('cs_help_visible', "Help: Please select the calendars you'd like to display on the My Calendars page. Please note, only calendars you have access to will display.")
                + '</div>';
        return sHTML;
    }
    
    self._visibleAfter = function() {
        self._buildVisibleCalendars();
        self._buildUnVisibleCalendars();
        self._parent._prependQueue([
            function(){
                self._body.find('div[data-list="unvisible"]').removeClass('CA_ajax_loading');
                var aMultiParams = {
                    "left" : 'div[data-list="unvisible"]',
                    "right" : 'div[data-list="visible"]',
                    "buttons" : 'div.simple_buttons[data-block="calendars"] a[data-mode]',
                    "sub" : "div[data-calendar]",
                    "touchhold" : 1000,
                    "touchradius" : 10,
                    "touchscrollarea" : 15
                };
                self._body.children('div[data-tab="visible"]').CAMultiSelect(aMultiParams);
                if (self._manyUnvisible) {
                    self._body.children('div[data-tab="visible"]').data('multiApi')
                    .reInit({
                        search : function(sText, evt) {
                            self._parent._calendars.getUnvisible(
                                {
                                    text : sText,
                                    hm   : 100
                                },
                                function(aList, aPrevNext){
                                    if (aList == undefined || aList == null) {
                                        aList = [];
                                    }
                                    self._body.find('div.multi_select[data-list="unvisible"]').html(self._buildSFList(aList));
                                }
                            );
                        },
                        textLeft : + self._parent.getText('cs_more_100_calendars', "There are more than 1000 Calendars available in the org. "
                            + "Click the Search button to refine your search criteria and display matching groups.")
                                
                    });
                }                
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
            }
        ]);
    }
    
    self._buildVisibleCalendars = function() {
        var aCalendars = self._parent._calendars.getCalendars(),
            divVisible = self._body.find('div.multi_select[data-list="visible"]');
        for (var nI = 0; nI < aCalendars.length; nI++) {
            if (aCalendars[nI].calendarType != 'sf' || aCalendars[nI].visible === false) {
                continue;
            }
            divVisible.append(self._buildCalendarBar(aCalendars[nI]));
        }
    }
    
    self._buildUnVisibleCalendars = function() {
        var divUnVisible = self._body.find('div.multi_select[data-list="unvisible"]');
        
        self._parent._calendars.getUnvisible({}, function(data) {
            if (data.length == 1 && data[0] == null) {
                self._manyUnvisible = true;
            } else {
                divUnVisible.html(self._buildSFList(data)); 
            }
        });
    
    }
    self._buildSFList = function(data) {
        var aResult = [], sHTML = '';
        for (var nI = 0; nI < data.length; nI++) {
            if (data[nI].calendarType != 'sf') {
                continue;
            }
            var aNew = data[nI];
            aNew.low = data[nI].name.toLowerCase();
            aResult.push(aNew);

        }
        aResult.quickSort('low');
        for (nI = 0; nI < aResult.length; nI++) {
            sHTML += self._buildCalendarBar(aResult[nI]);
        }
        return sHTML;
    }
    
    self._buildCalendarBar = function(aCalendar) {
        
        var sHTML = aCalendar.folder === true
            ? '<div data-calendar="_' + aCalendar.name.htmlspecialchars() + '" class="_folder">'
                + aCalendar.name.htmlspecialchars()
                + '<span></span></div>'
            : '<div data-calendar="' + aCalendar.id + '">' 
                + aCalendar.name.htmlspecialchars() 
                + '<span style="background-color:' + aCalendar.color + '"></span>'
                + '</div>';
        return sHTML;
    }
    
    
    
    
    
    
    self._groupsBody = function() {
        var sHTML = 
                '<span class=multi_select_title>' + self._parent.getText('addon_available', "Available") + '</span>'
                + '<div data-list="unvisible_groups" class="multi_select CA_ajax_loading unvisible _with_color" unselectable="on"></div>'
                + '<div class="simple_buttons" data-block="groups">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="sort_left" title="'
                    + self._parent.getText('cs_sort_by_name', "Sort available by name") 
                    + '">&darr;</a>'
                    + '<a data-mode="sort_right" title="' 
                    + self._parent.getText('cs_sort_available_name', "Sort Selected by name")
                    +'">&darr;</a>'
                + '</div>'
                + '<div data-list="visible_groups" class="multi_select _with_color" unselectable="on"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>'
                + '<div class="help"><span></span>'
                + self._parent.getText('cs_help_groups','Help: Please select the groups you\'d like to display on the My Calendars page. Please note, only groups you have access to will display.')
                + '</div>';
        return sHTML;
    }
    
    self._groupsAfter = function() {
        self._buildVisibleUnvisibleGroups();
        self._parent._prependQueue([
            function(){
                self._body.find('div[data-list="unvisible_groups"]').removeClass('CA_ajax_loading');
                self._body.children('div[data-tab="groups"]').CAMultiSelect({
                    "left" : 'div[data-list="unvisible_groups"]',
                    "right" : 'div[data-list="visible_groups"]',
                    "buttons" : 'div.simple_buttons[data-block="groups"] a[data-mode]',
                    "sub" : "div[data-calendar]",
                    "touchhold" : 1000,
                    "touchradius" : 10,
                    "touchscrollarea" : 15
                });
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
                
            },

        ]);
    }
    
    self._buildVisibleUnvisibleGroups = function(sType, sOn, sOff) {
        sType = sType || 'group';
        sOn = sOn || 'div.multi_select[data-list="visible_groups"]';
        sOff = sOff || 'div.multi_select[data-list="unvisible_groups"]';
        var aCalendars = self._parent._calendars.getCalendars(),
            divVisible = self._body.find(sOn),
            divUnVisible = self._body.find(sOff),
            aResult = [], sHTML = '';
        for (var nI = 0; nI < aCalendars.length; nI++) {
            if (aCalendars[nI].calendarType != sType) {
                continue;
            }
            if (aCalendars[nI].visible === true) {
                divVisible.append(self._buildCalendarBar(aCalendars[nI]));
            } else {
                var aEl = aCalendars[nI];
                aEl.low = aEl.name.toLowerCase();
                aResult.push(aEl);
            }
        }
        aResult.quickSort('low');
        for (nI = 0; nI < aResult.length; nI++) {
            sHTML += self._buildCalendarBar(aResult[nI]);
        }
        divUnVisible.append(sHTML);
    }    
    
    self._webBody = function() {
        var sHTML = 
                '<span class=multi_select_title>' + self._parent.getText('addon_available', "Available") + '</span>'
                + '<div data-list="unvisible_web" class="multi_select CA_ajax_loading unvisible _with_color" unselectable="on"></div>'
                + '<div class="simple_buttons" data-block="web">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="sort_left" title="'
                    + self._parent.getText('cs_sort_by_name', "Sort available by name")  
                    + '">&darr;</a>'
                    + '<a data-mode="sort_right" title="' 
                    + self._parent.getText('cs_sort_available_name', "Sort Selected by name")
                    + '">&darr;</a>'
                + '</div>'
                + '<div data-list="visible_web" class="multi_select _with_color" unselectable="on"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>'
                + '<div class="help"><span></span>'
                + self._parent.getText('cs_help_web','Help: Please select the web calendars you\'d like to display on the My Calendars page. Please note, only web calendars you have access to will display.')
                + '</div>';
        return sHTML;
    }
    
    self._webAfter = function() {
        self._buildVisibleUnvisibleWeb();
        self._parent._prependQueue([
            function(){
                self._body.find('div[data-list="unvisible_web"]').removeClass('CA_ajax_loading');
                self._body.children('div[data-tab="web"]').CAMultiSelect({
                    "left" : 'div[data-list="unvisible_web"]',
                    "right" : 'div[data-list="visible_web"]',
                    "buttons" : 'div.simple_buttons[data-block="web"] a[data-mode]',
                    "sub" : "div[data-calendar]",
                    "touchhold" : 1000,
                    "touchradius" : 10,
                    "touchscrollarea" : 15
                });
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
            },

        ]);
    }    
    
    
    
    
    self._buildVisibleUnvisibleWeb = function() {
        self._buildVisibleUnvisibleGroups('web', 'div.multi_select[data-list="visible_web"]',  'div.multi_select[data-list="unvisible_web"]');
        return;
    }
    
    self._displayBody = function() {
        
        var buildField = function(sKey, mField) {
            var sResult = '';
            sResult += '<div class=field data-field="' + sKey + '" data-type="' + mField.type + '">'
                + '<div class=name>' + mField.title 
                + '<span>' 
                + (mField.type == 'imageRadio' && self._parent.params[sKey] != undefined 
                    ? ': ' + mField.options[self._parent.params[sKey]]
                    : '')
                + '</span>'
                + '</div>'
                + '<div class=element>' + buildFormElement(sKey, mField) + '</div>'
                + '<span></span>'
                + '</div>';
            return sResult;
        }
        
                
        var buildFormElement = function(sKey, mField) {
            var sResult = '';
            switch (mField['type']) {
                
                case "block":
                    sResult += '';
                    break;
                case "select":
                    sResult += '<select name=param[' + sKey + '] ' 
                        + (mField.change != undefined ? 'data-change="true"' : "") 
                        + '>' 
                        + buildOptionsList(mField['options'], self._parent.params[sKey], mField['keys'])
                        + '</select>';
                    break;
                case "multiselect":
                    var aOptions = typeof(mField['options']) == 'function' ? mField['options']() : mField['options'],
                        aOptionsKeys = jQuery.isPlainObject(aOptions)
                        ? Array.objectKeys(aOptions)
                        : aOptions,
                        aSelectedOptrions = typeof(self._parent.params[sKey]) == 'string' ? self._parent.params[sKey].split(',') : self._parent.params[sKey];
                        
                    for (var nJ = 0; nJ < aOptionsKeys.length; nJ++) {
                        sResult += '<div class="_multiselect"><input type=checkbox name=param[' + sKey + '] '
                            + (mField.change != undefined ? 'data-change="true"' : "") 
                            +'value="' + aOptionsKeys[nJ]  + '"'
                            + (aSelectedOptrions.indexOf(aOptionsKeys[nJ]) >= 0 ? 'checked': '')
                            + ' >'
                            + aOptions[aOptionsKeys[nJ]] 
                            + "</div>";
                    }
//                    sResult += '<select name=param[' + sKey + '] ' 
//                        + (mField.change != undefined ? 'data-change="true"' : "") 
//                        + ' size="' + (aOptionsKeys.length > 3 ? 3 : aOptionsKeys.length) + '" '
//                        + ' multiple>' 
//                        + buildOptionsList(
//                            aOptions, 
//                            , 
//                            aOptionsKeys
//                        )
//                        + '</select>';
                    break;    
                case "numeric":
                    sResult += '<input type="number" '
                        + ' pattern="[0-9]+"'
                        + (mField.change != undefined ? 'data-change="true"' : "") 
                        + ' name=param[' + sKey + '] ' 
                        + ' value="' 
                            + (self._parent.params[sKey] != undefined ? self._parent.params[sKey] : '0') 
                        + '"'
                        + (mField.check != undefined
                            ?  (mField.check.min != undefined ? ' min="' + mField.check.min + '" ' : '')
                                + (mField.check.max != undefined ? ' max="' + mField.check.max + '" ' : '')
                            : '')
                        +  '/>' ;
                    break;
                case "text":
                    sResult += '<input type="text" name=param[' + sKey + '] value="' + self._parent.params[sKey] + '" />' ;
                    break;
                    
                case "classRadio" :
                    sResult += buildClassRadioList(sKey, mField, self._parent.params[sKey]);
                    break;
                case "imageRadio" :
                    sResult += buildImageRadioList(sKey, mField, self._parent.params[sKey]);
                    break;

                case "boolean":
                    sResult += '<input type="checkbox" name=param[' + sKey + '] value="1" ' + (self._parent.params[sKey] ? "checked='checked'" : "") + '" />' ;
                    break;
            }
            return sResult;
        }
        
        var buildOptionsList = function(aList, mSelected, aKeys) {
            var sResult = '',
                aSelected = mSelected != undefined && (mSelected instanceof Array)
                    ? mSelected
                    : [mSelected];
            aSelected = aSelected.map(function(mN){
                return '' + mN;
            });
            
//                typeof(mSelected) == 'string' ? [mSelected] : mSelected;
            if (jQuery.isPlainObject(aList)) {
                if (aKeys == undefined) {
                    aKeys = Array.objectKeys(aList);
                }
                for (var nJ = 0; nJ < aKeys.length; nJ++) {
                    sResult += '<option value=' + aKeys[nJ] + ' ' 
                        + ((aSelected.indexOf(aKeys[nJ]) >= 0  || aSelected.indexOf('' + aKeys[nJ]) >= 0)
                            ? "selected" 
                            : "") 
                        + '>'
                        + aList[aKeys[nJ]]
                        + '</option>';
                }
            } else if (jQuery.isArray(aList)) {
                for (var nI = 0; nI < aList.length; nI++) {
                    sResult += '<option value=' + nI + ' ' + (aSelected.indexOf(nI) >= 0 ? "selected" : "") + '>'
                        + aList[nI]
                        +' </option>';
                }
            }
            return sResult;
        }
        
        var buildClassRadioList = function(sKey, aList, mSelected) {
            var sResult = '';
            jQuery.each(aList, function(sIdx, sClassName) {
                sResult += '<span class="_radio_' + sClassName + '" title="' + sClassName + '">'
                    + '<input type=radio name=param[' + sKey + '] value="' + sIdx + '" ' 
                    + (sIdx == mSelected ? "checked" : "")
                    + '><label></label></span>';
            });
            return sResult;
        }
        
        var buildImageRadioList = function(sKey, aField, mSelected) {
            var sResult = '<div class="_image_radio _image_radio_' + sKey + '">';
            var nI = 0, aList = aField.options, sIdx, sClassName,
                aKeys = aField.keys == undefined ? Array.objectKeys(aList) : aField.keys;
            for (nI = 0; nI < aKeys.length; nI++) {
                sIdx = aKeys[nI];
                sClassName = aList[sIdx];
                sResult += '<span class="_imgr_' + (nI) + ' ' + (sIdx == mSelected ? "on" : "") + '" title="' + sClassName + '"><label>'
                        + '<input type=radio name=param[' + sKey + '] value="' + sIdx + '" ' 
                        + (sIdx == mSelected ? "checked" : "")
                        + '></label></span>';
            }
            sResult += '</div>';
            return sResult;
        }
        
        var buildBlockTitle = function(sKey, mField, bNextBlock)  {
            var sHTML = '';
            sHTML += '<div class="custom_settings_block ' + (bNextBlock ? '' : 'on') + '" data-block="' + sKey + '">' 
                + '<div class="block_title">' + mField.title  + '</div>'
                + '<div class="block_fields">';
            return sHTML;
        }
        
        var sHTML = '', bBlock = false;
        jQuery.each(self._aParamFields, function(sKey, mField) {
            
            if (mField.type == 'block') {
                sHTML += (bBlock ? "</div></div>" : "") + buildBlockTitle(sKey, mField, bBlock);
                bBlock = true;
            } else {
                sHTML += buildField(sKey, mField);
            }
        });
        if (bBlock ) {
            sHTML += "</div></div>";
        }
        return sHTML;
    }
    
    self._buildBodyTab = function(sTab) {
        if (self['_' + sTab + 'Body'] == undefined) {
            return jQuery();
        }
        var sHTML = self['_' + sTab + 'Body'].call();
        sHTML = '<div data-tab="' + sTab + '">' + sHTML + '</div>';
        var domResult = jQuery(sHTML).appendTo(self._body);
        
        if (self['_' + sTab + 'After'] != undefined) {
            self['_' + sTab + 'After'].call();
        }
        return domResult;
    }
    
    
    
    self._initEvents = function(){
        self._shadow.on('click', function(){
            self._hide();
        });
        
        self._message.on('click', function(){
            self._message.removeClass('_on');
        });
        
        self._panel
            .on('click', '.close', function(){
                self._resetValues();
                self._hide();
            })
            .on('click', 'form span[data-mode="save"]', function(){
                self._save();
            });
        
        self._panel.find('.tab').on('click', 'span', function(){
            var el = jQuery(this), 
                prevEl = el.siblings('.on'), 
                divBodyEl = self._body.children('[data-tab="' + el.data('tab') + '"]');
            self._body.children('.on').removeClass('on');
            
            if (divBodyEl.size() < 1) {
                divBodyEl = self._buildBodyTab(el.data('tab'));
            }
            divBodyEl.addClass('on');
            prevEl.removeClass('on');
            el.addClass('on');
        });
        
        self._body.on('click', '.custom_settings_block .block_title', function(evt){
            
            var el = jQuery(this).parent();
            if (el.hasClass('on')) {
                return;
            }
            
            el.addClass('on').siblings('.on').removeClass('on');
            self._message.removeClass('_on');
        })
        .on('click', '._image_radio > span', function(evt){
            var el = jQuery(this);
            if (el.hasClass('on')) {
                return;
            }
            el.siblings('.on').removeClass('on');
            el.addClass('on').find('input').attr('checked', true);
//            console.log(el);
            el.parent().parent().prev('.name').children('span').text(': ' + el.attr('title'));
        }).on('change.CA_settings', 'select[data-change], input[data-change]', function(evt){
            var el = jQuery(this),
                sField = el.parents('.field').data('field'),
                aField = self._aParamFields[sField];
            if (typeof(aField.change) == 'function' ) {
                aField.change(evt);
            }
        }).on(self._parent.eventNames.click, '[data-action]', function(event) {
            var oEl = jQuery(event.currentTarget);
            return view.action(oEl.data('action'), oEl, event);
        });
        self._body.find('select[data-change]').trigger('change.CA_settings');
        
        
        
    }
    
    self._hide = function(){
        self._shadow.removeClass('on');
        self._panel.removeClass('on');
    }
    
    self._save = function() {
        
        var oOpenTab = self._panel.find('div.on'),
            aParams = self._panel.find('form [data-tab="display"] .field[data-field]'),
            aOldValues = {},
            bCorrect = true;
        oOpenTab.removeClass('on').parent().addClass('CA_ajax_loading');
        self._miniCounter = {};
        self._message.removeClass('_on');
        if (aParams.size() > 0) {
            aParams.find('._err').removeClass('_err');
            aParams.each(function(){
                var el = jQuery(this),
                    formEl = el.find('input[type="text"], input[type="number"], select, textarea, input[type="radio"]:checked, input[type="checkbox"]');
                
                var sVal = formEl.attr('type') === 'checkbox' 
                    ? (formEl.is(':checked') ? true : false )
                    : formEl.val();
                if (el.data('type') === 'multiselect') {
                    sVal = '';
                    formEl.each(function(nTempIdx, oTempEl){
                        oTempEl = jQuery(oTempEl);
                        if (!oTempEl.is(':checked')) {
                            return;
                        }
                        sVal += (sVal != '' ? ',' : '') + oTempEl.val();
                    });
                    //sVal = sVal != null && sVal.length > 0 ? sVal.join(",") : "";
                }
                if (self._aParamFields[el.data('field')].valueFunction != undefined) {
                    sVal = self._aParamFields[el.data('field')].valueFunction(sVal);
                } 
                if (typeof(self._aParamFields[el.data('field')].check) != 'undefined') {
                    var sNewVal = self._check(el.data('field'), sVal);
                    if (sNewVal == null) {
                        formEl.focus().addClass('_err');
                        bCorrect = false;
                        if (self._aParamFields[el.data('field')].error != undefined) {
                            self._showMesagePopup(formEl, self._aParamFields[el.data('field')].error);
                        }
                        return false;
                    }
                    if (sNewVal != sVal) {
                        formEl.val(sNewVal);
                        sVal = sNewVal;
                    }
                }
                if (sVal != self._parent.params[el.data('field')]) {
                    aOldValues[el.data('field')] = self._parent.params[el.data('field')];
                    self._parent._setParam(el.data('field'), sVal);
                }
            });
            if (bCorrect) {
                jQuery.each(aOldValues, function(sField, mOldValue) {
                    if (self['_' + sField+ 'AfterChange'] != undefined) {
                        if (self['_' + sField + 'AfterChange'](mOldValue, aOldValues) === false) {
                            bCorrect = false;
                            return false;
                        }
                    }
                });
            }
        }
        if (bCorrect) {
            self._saveCalendarSettings();
            self._saveVisibleCalendarsChange();
            oOpenTab.addClass('on').parent().removeClass('CA_ajax_loading');
            self._hide();
        } else {
            oOpenTab.addClass('on').parent().removeClass('CA_ajax_loading');
        }
    }
    
    
    self._sizeAfterChange = function(sOldVal) {
        self._parent._dom.el
            .removeClass(sOldVal)
            .addClass(self._parent.params.size);
        self._parent._reResize();
    }
    
    self._gradientAfterChange = function(sOldVal) {
        self._parent._dom.el.toggleClass('CA_gradient', self._parent.params.gradient === 'on');
    }
    
    self._monthWeeksAfterChange = function(sOldVal) {
        self._parent._dom.el.find('._mode-month')
            .removeClass('weeks_' + sOldVal)
            .addClass('weeks_' + self._parent.params.monthWeeks);
        self._parent._events.clearEvents();
        self._parent.clearView();
    }
    
    self._startWeekDayAfterChange = function(sOldVal) {
        if (self._parent.params.showWeekEnds != 7) {
            self._parent.params.startWeekDay = 1;
        }
        self._parent._events.clearEvents();
        self._parent.clearView();
    }
    
    self._eventStyleAfterChange = function(sOldVal) {
        self._parent._dom.el
            .removeClass('_event-style-' + sOldVal)
            .addClass('_event-style-' + self._parent.params.eventStyle);
        
    }
    self._showWeekEndsAfterChange = function(sOldVal) {
        self._parent._dom.el
            .removeClass('_week-end-' + sOldVal)
            .addClass('_week-end-' + self._parent.params.showWeekEnds);
        if (self._parent.params.showWeekEnds != 7)  {
            if (self._parent.params.startWeekDay != 1) {
                self._startWeekDayAfterChange();
            }
        }
            
            
    }
    
    self._weekViewAgendaAfterChange = function(sOldVal) {
        if (self._miniCounter.clearView == undefined) {
            self._parent._addQueue(function(){
                self._parent.clearView();
            });
            self._miniCounter.clearView = true;
        }
    }
    
    self._longClickAfterChange = function(){
        self._weekViewAgendaAfterChange();
    }
    
    self._dayViewAgendaAfterChange = function(sOldVal) {
        self._weekViewAgendaAfterChange();
    }
    

    self._minMinutePeriodAfterChange = function(sOldVal) {
        if (sOldVal != undefined) {
            self._parent._dom.el
                .removeClass('_hour-' + sOldVal)
                .addClass('_hour-' + self._parent.params.minMinutePeriod);
        }
        
        
        if (self._miniCounter.hourMode == undefined) {
            self._parent._addQueue(function(){
                self._parent._events.clearEvents();
                self._parent.layout.initHourlyCSS();
                self._parent.clearView();
            });
            self._miniCounter.hourMode = true;
        }

    }
    
    self._startHourPeriodAfterChange = function(sOldVal, aOldValues) {
        if (parseInt(self._parent.params.startHourPeriod) > parseInt(self._parent.params.stopHourPeriod)) {
            if (aOldValues['startHourPeriod'] != undefined) {
                self._parent._setParam('startHourPeriod', aOldValues['startHourPeriod']);
            }
            if (aOldValues['stopHourPeriod'] != undefined) {
                self._parent._setParam('stopHourPeriod', aOldValues['stopHourPeriod']);
            }
            self._showMesagePopup(self._div.find('.field[data-field="startHourPeriod"] input'), '"Start Day at" should have an earlier time than "End day at". Please correct entered values period.');
            return false;
        }
        self._parent.aCalculated.startHour = self._parent.params.nonWorkingHoursDisplay == 'hide' ? self._parent.params.startHourPeriod : 0;
        self._parent.aCalculated.stopHour = self._parent.params.nonWorkingHoursDisplay == 'hide' ? self._parent.params.stopHourPeriod : 24;
        if (self._miniCounter.hourMode == undefined) {
            self._minMinutePeriodAfterChange();
        }
    }
    
    self._stopHourPeriodAfterChange = function(sOldVal, aOldValues) {
        return self._startHourPeriodAfterChange(sOldVal, aOldValues);
    }
    
    self._dayModeAreaAfterChange = function(sOldVal) {
        self._parent._dom.el
            .removeClass('_day_area_mode-' + sOldVal)
            .addClass('_day_area_mode-' + self._parent.params.dayModeArea);
        self._minMinutePeriodAfterChange();
    }
    
    self._nonWorkingHoursDisplayAfterChange = function(sOldVal) {
        self._parent._dom.el
            .removeClass('_nonworking-' + sOldVal)
            .addClass('_nonworking-' + self._parent.params.nonWorkingHoursDisplay);
        self._minMinutePeriodAfterChange();
    }
    
    self._setNonWorking = function() {
    }
    
    self._agendaEmptyDaysAfterChange = function(sOldVal){
        self._parent.clearView();
    }
    
    self._customModeAfterChange = function(sOldVal) {
        if (self._miniCounter.customMode == undefined) {
            self._parent._events.clearEvents();
            self._parent.clearView();
            self._miniCounter.customMode = true;
        }
    }
    
    self._customModeColsAfterChange = function(sOldVal) {
        self._customModeAfterChange();
    }
    
    self._customModeRowsAfterChange = function(sOldVal) {
        self._customModeAfterChange();
    }
    
    self._customModeAreaAfterChange = function(sOldVal) {
        self._customModeAfterChange();
    }
    
    self._cacheTimeAfterChange = function(sOldVal) {
        if (self._parent.params.cacheTime == 0 && parseInt(sOldVal) > 0) {
            self._showTitlesAfterChange();
        }
        self._parent._calendars.changeCacheTime(self._parent.params.cacheTime);
    }
    
    self._showTitlesAfterChange = function(sOldVal) {
        if (self._miniCounter.refreshEvents == undefined) {
            self._parent.layout.refreshEvents();
            self._parent.layout.reInitUIEvents();
            self._miniCounter.refreshEvents = true;
        }
    }
    
    self._barLabelTimeAfterChange = function(sOldVal) {
        if (self._miniCounter.refreshEvents == undefined) {
            self._parent.layout.refreshEvents();
            self._miniCounter.refreshEvents = true;
        }
    }

    self._ganttRespectHoursAfterChange = function(sOldVal) {
        self._minMinutePeriodAfterChange();
    }
    self._ganttCollapseFullLineAfterChange = function(){
        self._minMinutePeriodAfterChange();
    }

    
    self._saveVisibleCalendarsChange = function() {
        var aCalendars = [], aDisabled = [],
            aTypes = {'visible_groups' : 'group', 'visible_web' : 'web', 'visible' : 'sf'};
        self._body.find('div.multi_select[data-list="visible_groups"], '
            + 'div.multi_select[data-list="visible"],'
            + 'div.multi_select[data-list="visible_web"]'
            ).each(function(nIdx, oEl){
                aCalendars.push('!' +  aTypes[jQuery(oEl).data('list')]);
                jQuery(oEl).children('div[data-calendar]').each(function(){
                    aCalendars.push(jQuery(this).data('calendar'));
                });   
            });
            
        
        self._body.find('div.multi_select[data-list="unvisible_groups"], '
            + 'div.multi_select[data-list="unvisible"],'
            + 'div.multi_select[data-list="unvisible_web"]'
            ).children('div[data-calendar]').each(function(){
                aDisabled.push(jQuery(this).data('calendar'));
            });
        
        self._parent.layout.changeVisibleCalendar(aCalendars, aDisabled);
        
    }
    
    self._showScrollButtonsAfterChange = function(sOldVal) {
        self._parent.clearView({scrollBar : true});
    }
    
    
    self._uiTodayAfterChange = function(sOldVal) {
        self._parent._dom.el.find('[data-nav="today"]').toggleClass('_hide', sOldVal == true);
        if (sOldVal == false && !self._parent._dom.el.find('CA_h .manage.buttons').is(':visible')) {
            self._parent._dom.el.find('CA_h .manage.buttons').show();
        }
    }
    
    self._uiSearchAfterChange = function(sOldVal) {
        self._parent._dom.el.find('.CA_h .search').toggleClass('_hide', sOldVal == true);
        if (sOldVal == true ) {
            self._parent._dom.el.find('.CA_h .search input').val('').trigger('keyup');
        }
        
    }
    
    self._uiAdvancedSearchAfterChange = function(sOldVal) {
        self._parent._dom.el.find('.CA_h .search ._str').toggleClass('_hide', sOldVal == true);
    }
    
    self._uiCalendarAfterChange = function(sOldVal) {
        self._parent._dom.el.find('.CA_h .date_title ').toggleClass('_hide', sOldVal == true);
    }
    
//    self._displayTimeZoneAfterChange = function(sOldVal){
//        if (self._parent.getParam('displayTimeZone') == false && self._parent.aCalculated.timeZoneMinutes != '-') {
//            self._parent.aCalculated.timeZoneMinutes = "-";
//            self._customModeAfterChange();
//        }
//    }
//    self._timeZoneMinutesAfterChange = function(){
//        self._customModeAfterChange();
//    }
    
    
    self._uiFilterAfterChange = function(sOldVal) {
        if (self._miniCounter.filterSet == undefined) {
            self._parent._addQueue(function(){
                self._parent.layout.refreshFiltersPanel();
            });
        }
        self._miniCounter.filterSet = true;
    }
    
    self._displayTimeZoneAfterChange = function(){
        self._uiFilterAfterChange();
    }
    
    self._uiFilterSetsAfterChange = function(sOldVal) {
        self._uiFilterAfterChange();
    }
    
    
    self._swimlaneCellAfterChange = function(sOldVal) {
        self._weekViewAgendaAfterChange();
    }
    self._layoutThemeAfterChange = function(sOldVal) {
        if (sOldVal == 'default') {
            self._parent.loadCss('/css/ca-lightning.css');
        }
        self._parent._dom.el.toggleClass('CA_LIGHTNING', sOldVal == 'default');
    }
    
    
    self._saveCalendarSettings = function() {
        var aAdd = {};
        jQuery.each(self._parent._addons, function(sKey, aEl){
            if (aEl.module != undefined) {
                var oSetting = aEl.module.getSettings();
                if (oSetting != null) {
                    aAdd[sKey] = oSetting;
                    self._parent._addons[sKey].settings = oSetting;
                }
            }
        });
        
        var oList =  self._body.find('[data-tab="grouping"] ._gropingObjects ._list'),
            oGrouping = null;
        if (oList.size() > 0) {
            oGrouping = {};
            if (oList.parents('._gropingObjects').hasClass('_off')) {
                self._setGroupingAction();
            }
            oList.children().each(function(nIdx, oRow){
                oRow = jQuery(oRow);
                oGrouping[oRow.data('object')] = oRow.data('fields');
            });
            //self._parent._objects.setGroupingFields(oGrouping);
            self._parent._objects.saveSpecialSettings('groupingObjects', oGrouping, {stringify : true});
        }
        
        if (self._body.find('[data-tab="filtering"] .visible').size() > 0) {
            var oFiltering = [];
            self._body.find('[data-tab="filtering"] .visible > div').each(function(nIdx, oEl){
                oEl = jQuery(oEl);
                oFiltering.push(oEl.data('fid'));
            });
            var aPrev = self._parent._objects.getSpecialSettings('filteringFields'),
                bDiff = aPrev.diff(oFiltering).length || oFiltering.diff(aPrev).length;
            if (bDiff) {
                self._parent._objects.saveSpecialSettings('filteringFields', oFiltering, {stringify : true});
                self._uiFilterAfterChange();
            }
        }
        if (self._body.find('[data-tab="lookup"] .visible').size() > 0) {
            self._setLookupFields(self._body.find('[data-tab="lookup"] select').val());
//            var aFields = [],
//                sSelectedObject = self._body.find('[data-tab="lookup"] select').val();
//            self._body.find('[data-tab="lookup"] .visible > div').each(function(nIdx, oEl){
//                aFields.push(jQuery(oEl).data('fid'));
//            });
//            if (aFields.length > 0) {
//                self._aLookupFields[sSelectedObject] = aFields;
//            } else if (typeof(self._aLookupFields[sSelectedObject]) != 'undefined'){
//                delete self._aLookupFields[sSelectedObject];
//            }
            self._parent._objects.saveSpecialSettings('lookupFields', self._aLookupFields, {stringify : true});
        }
        if (self._body.find('[data-tab="ical"]').size() > 0) {
            self._parent._objects.saveSpecialSettings('clientKey', 
                JSON.stringify({
                    value : self._body.find('[data-tab="ical"] input[name="key"]').val()
                }), 
                {data : {secure : true}}
            );
            self._parent._objects.saveSpecialSettings('clientSecret', 
                JSON.stringify({
                    value : self._body.find('[data-tab="ical"] input[name="secret"]').val()
                }), 
                {data : {secure : true}}
            );
            self._parent._objects.saveSpecialSettings('clientCert', 
                JSON.stringify({
                    value : self._body.find('[data-tab="ical"] input[name="cert"]').val()
                }), 
                {data : {secure : true}}
            );
        }
        if (self._body.find('[data-tab="preset"]').size() > 0 && self._dom_preset.hasClass('_edit_mode')) {
            self._savePresetAction();
        }
        
        
        self._parent._saveParams(aAdd);
    }
    
    self._check = function(sField, sVal) {
        var aField = self._aParamFields[sField];
        switch (aField.type) {
            case 'numeric' :
                sVal = parseInt(sVal);
                if (isNaN(sVal)) {
                    sVal = 0;
                }
                if (aField.check.min != undefined && sVal < aField.check.min) {
                    if (aField.error != undefined) {
                        return null;
                    }
                    sVal = aField.check.min;
                }
                if (aField.check.max != undefined && sVal > aField.check.max) {
                    if (aField.error != undefined) {
                        return null;
                    }
                    sVal = aField.check.max;
                }
                break;
        }
        return sVal;
    }
    
    
    
    self._changeCustomMode = function(evt){
        var el = jQuery(evt.target);
        self._body
            .find('div.field[data-field="customModeRows"], div.field[data-field="customModeCols"]')
                .toggleClass('_disabled', el.val() != 'manual');
    }
    
    self._changeGanttPeriod = function(evt){
        var aAllow = {
            "0.1" : ["hour", "day"],
            "0.7" : ["hour", "day", "week"],
            "1"   : ["hour", "day", "week", "month"],
            "3"   : ["day", "week", "month", "quarter"],
            "6"   : ["day", "week", "month", "quarter"],
            "12"   : ["day", "week", "month", "quarter"],
            "36"   : ["day", "week", "month", "quarter"],
            "120"   : ["day", "week", "month", "quarter"],
            "0"   : [ "quarter"]
        };

        var oPeriod = self._div.find('.field[data-field="ganttPeriod"] select'),
            oMode = self._div.find('.field[data-field="ganttSplit"] select'),
            sMode = oMode.val(),
            sPeriod = oPeriod.val();
        if (aAllow[sPeriod].indexOf(sMode) < 0){
            console.log('period', sMode, sPeriod);
            oMode.val(aAllow[sPeriod][0]);
        }
    }
    
    self._changeGanttMode = function(evt) {
        var aAllow = {
                "hour" : ["0.1", "0.7", "1"],
                "day" : ["0.1", "0.7", "1", "3", "6", "12", "36", "120"],
                "week" : ["0.7", "1", "3", "6", "12", "36", "120"],
                "month" : ["1", "3", "6", "12", "36", "120"],
                "quarter" : ["3", "6", "12", "36", "120", "0"]
            };
        
        var oPeriod = self._div.find('.field[data-field="ganttPeriod"] select'),
            oMode = self._div.find('.field[data-field="ganttSplit"] select'),
            sMode = oMode.val(),
            sPeriod = oPeriod.val();
        if (aAllow[sMode].indexOf(sPeriod) < 0){
            oPeriod.val(aAllow[sMode][0]);
        }
    }
    
    self._changeDayWorkingHours = function(evt) {
        var nStart = parseInt(self._div.find('.field[data-field="startHourPeriod"] input').val()),
            nStop = parseInt(self._div.find('.field[data-field="stopHourPeriod"] input').val());
        if (nStart >= nStop) {
            self._showMesagePopup(
                jQuery(evt.target), 
                self._parent.getText('cs_working_notify', '"Start Day at" should have an earlier time than "End day at". Please correct entered values.')
            )
        } else {
            self._hideMessagePopup();
        }
    }
    
    self._showMesagePopup = function(oEl, sMessage) {
        var oParent = oEl.parents('.custom_settings_block');
        if (oParent.size() > 0) {
            oParent.siblings('.on').removeClass('on');
            oParent.addClass('on');
        }
        
        
        setTimeout(function(){
            var oPos = oEl.offset();
            self._message
                .addClass('_on')
                .text(sMessage)
                .css({
                    top : oPos.top,
                    left : oPos.left
                });
//            console.log(oEl.offset());
        }, 100);
        
        
    }
    
    self._hideMessagePopup = function(){
        self._message.removeClass('_on');
    }
    
    self._resetValues = function(){
        self._setFieldValue(Array.objectKeys(self._aParamFields));
        self._resetCalendars('sf');
        self._resetCalendars('group');
        self._resetCalendars('web');
        jQuery.each(self._parent._addons, function(sKey, aEl){
            if (aEl.module != undefined && aEl.module.resetSettings != undefined) {
                aEl.module.resetSettings();
            }
        });
        if (self._dom_preset != undefined) {
            self._resetPresets();
        }
    }
    
    self._resetCalendars = function(sType){
        var sDivSubtype = {"sf" : "", 'group' : "_groups", "web" : "_web"},
            aCalendars = self._parent._calendars.getCalendars(),
            divVisible = self._body.find('div.multi_select[data-list="visible' + sDivSubtype[sType] + '"]'),
            divUnvisible = self._body.find('div.multi_select[data-list="unvisible' + sDivSubtype[sType] + '"]');
        if (divVisible.size() < 1) {
            return;
        }
        for (var nI = 0; nI < aCalendars.length; nI++) {
            if (aCalendars[nI].calendarType != sType) {
                continue;
            }
            var oEl = (aCalendars[nI].visible === false ? divVisible : divUnvisible )
                .children('[data-calendar="' + aCalendars[nI].id + '"]');
            if (oEl.size() > 0) {
                oEl.remove().appendTo(aCalendars[nI].visible === false ? divUnvisible : divVisible);
            }
        }
    }
    
    self._setFieldValue = function(mKey) {
        if (typeof(mKey) == 'string') {
            mKey = [mKey];
        }
        for (var nJ = 0; nJ < mKey.length; nJ++) {
            var mValue = self._parent.params[mKey[nJ]],
                sValueType = self._aParamFields[mKey[nJ]];
            if (mValue == undefined) {
                continue;
            }
            var oField = self._body.find('[data-tab="display"] .field[data-field="' + mKey[nJ] + '"]').find('input, select');
            if (oField.size() < 1) {
                continue;
            }
            if (sValueType == 'multiselect') {
                oField.prop('checked', '');
                var aTempValue = typeof(mValue) == 'string' ? mValue.split(',') : mValue;
                for (var nJ = 0; nJ < aTempValue.length; nJ++) {
                    if (aTempValue[nJ] != '') {
                        oField.filter('[value="' + aTempValue[nJ] + '"]').attr('checked', 'checked');
                    }
                }
            } else if (oField.attr('type') == 'checkbox') {
                oField.prop('checked', mValue ? "checked" : "");
            } else if (oField.attr('type') == 'radio') {
                oField.filter('[value="' + mValue + '"]').prop('checked', "checked")
                    .parent('label').parent('span').addClass('on')
                    .siblings().removeClass('on');
            } else {
                oField.val(mValue);
            }
        }
    }
    
    
    self._addonsBody = function() {
        var sHTML = '';
        jQuery.each(self._parent._addons, function(sKey, aEl){
            sHTML += '<div class="custom_settings_block" data-addon="' + sKey + '">'
                + '<div data-action="setAddon" class="block_title">' + aEl.title + '</div>'
                + '<div class="block_fields"></div>'
                + '</div>';
        });
        return sHTML;
    }
    
    self._addonsAfter = function() {
    }
    
    self._setAddonAction = function(el, evt){
        el = jQuery(el);
        
        var oAddBlock = el.parents('.custom_settings_block'),
            oAddDiv = oAddBlock.children('.block_fields');

        if (oAddDiv.html() == '') {
            self._parent.initAddon(oAddBlock.data('addon'), function(oAddon){
                oAddon.showSettings(oAddDiv);
                self._aAddonLoaded[oAddBlock.data('addon')] = oAddon;
            });   
        }
    }
    
    self._addFolderAction = function(oEl, evt){
        var sResult = prompt('Enter Calendar Folder name', '');
        if (sResult == null) {
            return;
        }
        var sElHTML = '<div data-calendar="_' + sResult.htmlspecialchars() + '" class="_folder">'
                + sResult.htmlspecialchars()
                + '<span></span></div>',
            divVisible = self._body.find('div.multi_select[data-list="visible"]');
        divVisible.prepend(sElHTML);
        //alert(sResult);
        
    }
    
    self._langBody = function() {
        var sHTML = '<textarea style="width:99%;height:80%;" wrap="off"></textarea>'
            + '<div style="height:20%;"><div class="simple_buttons" style="width:100%;">'
                + '<span data-action="getCSV">Get CSV (' + self._parent.getParam('lang') + ')</span>&nbsp;'
                + '<span data-action="getJSON">Get JSON (' + self._parent.getParam('lang') + ')</span>'
            + '</div>'
            + '</div>'
        return sHTML;
    }
    
    
    self._groupingBody = function(){
        
        var sHTML = '<div class="_gropingObjects">' 
                    + '<select name="new_grouping"></select>'
                    + '<span data-action="addGrouping" class="simple_button">Add</span>'
                    + '<div class="_list"></div>'
                + '</div>'
                + '<div class="_gropingFields">'
                + '<span class=multi_select_title>' + self._parent.getText('addon_available', "Available") + '</span>' 
                + '<div data-list="groupingAvailable" class="multi_select unvisible"></div>'
                + '<div class="simple_buttons" data-block="calendars">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="open" title="' 
                        + self._parent.getText('ce_open_reference', "Open Reference Fields")
                        + '">+</a>' 
                    + '<span class="simple_button" data-action="setGrouping">Ok</span>'
                    + '<span class="simple_button" data-action="cancelGrouping">Cancel</span>'
                + '</div>'
                + '<div data-list="groupingActive" class="multi_select visible"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>' 
                + "</div>";
//                + '<div class="help"><span></span>'
//                + self._parent.getText('cs_help_visible', "Help: Please select the calendars you'd like to display on the My Calendars page. Please note, only calendars you have access to will display.")
//                + '</div>';
        return sHTML;
    }
    
    self._groupingAfter = function(){
        
        self._parent._addQueue([
            function(){
                self._buildGroupingObjects(self._parent._objects.getSpecialSettings('groupingObjects', null));
//                
//                self._parent._objects.loadSpecialSettings('groupingObjects', function(data){
//                    
////                    console.log(data);
//                    self._buildGroupingObjects(data);
//                });
            },
            function(){
                var aObjects = self._parent._objects.getObjectsList(),
                    oSelect = self._body.find('[data-tab="grouping"] ._gropingObjects select'),
                    sHTML = '<option value="">Select Object</option>';
                aObjects.quickSort('label');
                for (var nI = 0; nI < aObjects.length; nI++) {
                    sHTML += '<option value="' + aObjects[nI].name.htmlspecialchars() + '">'
                        + aObjects[nI].label.htmlspecialchars()
                        + '</option>';
                }
                oSelect.html(sHTML);
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
                self._parent.loadCss('/css/plugin-multi-select.css');
            },
            function(){
                self._body.find('[data-tab="grouping"] ._gropingFields').CAMultiSelect({
                    "left" : 'div.unvisible',
                    "right" : 'div.visible',
                    "buttons" : 'div.simple_buttons >  a[data-mode]',
                    "sub" : "div._moveable",
                    "orderable" : "div._orderable",
                    "touchhold" : 1000,
                    "touchradius" : 10,
                    "touchscrollarea" : 15
                });
            },
        ]);
        
        
    }
    
    self._getCSVAction = function(){
        var oArea = self._div.find('[data-tab="lang"] textarea'),
            sText = '';
        for (var sKey in self._parent._text) {
            sText += sKey + "\t";
            if (typeof(self._parent._text[sKey]) == 'string') {
                sText += '"' + self._parent._text[sKey] + '"';
            } else {
                sText += '"' + JSON.stringify(self._parent._text[sKey]) + '"';
            }
            sText += "\n";
        }
        oArea.text(sText);
    }
    
    self._getJSONAction = function(){
        var oArea = self._div.find('[data-tab="lang"] textarea'),
            aValues = oArea.val().split("\n"),
            aResult = [],
            sText = "{\n";
        for (var nJ = 0; nJ < aValues.length; nJ++) {
            var aLine = aValues[nJ].trim().split("\t");
            if (aLine[0] == '') {
                continue;
            }
            if (aLine.length == 1){
                aLine[1] = '';
            }
            if (aLine[1].trim().length == 0 
                || (aLine[1].substring(0, 1) != '{' 
                    && aLine[1].substring(0, 1) != '['
                )
            ) {
                aResult.push('"' + aLine[0] + '"' + "\t: \"" + aLine[1].replace(/"/g, '\\"') + "\"");
            } else if (aLine[1].trim().length > 0) {
                aResult.push('"' + aLine[0] + '"' + "\t: " + aLine[1]);
            }
        }
        sText = "{\n" + aResult.join(",\n") + "\n}";
        oArea.val(sText);
    }
    
    
    self._addGroupingAction = function(evt){
        var oSelect = self._body.find('[data-tab="grouping"] ._gropingObjects select'),
            sVal = oSelect.val(),
            oList =  self._body.find('[data-tab="grouping"] ._gropingObjects ._list');
        if (sVal == '' || oList.find('[data-object="' + sVal + '"]').size() > 0) {
            return;
        }
        oList.append(self._buildGroupingRow(sVal, ''));
//        console.log(sVal);
    }
    
    self._editGroupingAction = function(oEl, evt) {
        var oEl = jQuery(oEl),
            oRow = oEl.parents('[data-object]'),
            sObject = oRow.data('object'),
            aFields = oRow.data('fields').split(',');
        self._parent._addQueue([
            function(){
                self._parent._objects.getObjects(sObject, function(aObjs){
                    self._fillGroupingOptions(
                        sObject, 
                        Array.objectValues(aObjs[sObject].fields),
                        ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'REFERENCE', 'PICKLIST', 'COMBOBOX'],
                        ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX']
                    );
                }, {
                    loadReferenced : true, 
                    "onlySingleReference" : true
                })
            },
            function(){
                self._setGroupingOptions(aFields);
                self._body.find('[data-tab="grouping"] ._gropingObjects').addClass('_off');
                self._body.find('[data-tab="grouping"] ._gropingFields').addClass('_on').data('object', sObject);
            }
        ])
    }
    
    self._delGroupingAction = function(oEl, evt) {
        var oEl = jQuery(oEl),
            oRow = oEl.parents('[data-object]');
        oRow.remove();
    }
    
    self._cancelGroupingAction = function(){
        self._body.find('[data-tab="grouping"] ._gropingObjects').removeClass('_off');
        self._body.find('[data-tab="grouping"] ._gropingFields').removeClass('_on');
    }
    
    self._setGroupingAction = function() {
        var sObject = self._body.find('[data-tab="grouping"] ._gropingFields').data('object'),
            aRow = self._body.find('[data-tab="grouping"] ._gropingObjects ._list > div[data-object="' + sObject + '"]'),
            oSelected = self._body.find('[data-tab="grouping"] ._gropingFields .visible > div'),
            aSelected = [];
        oSelected.each(function(nIdx, oEl){
            aSelected.push(jQuery(oEl).data('fid'));
        });
        aRow.data('fields', aSelected.join(","));
        aRow.find('b').text(aSelected.length);
        self._body.find('[data-tab="grouping"] ._gropingObjects').removeClass('_off');
        self._body.find('[data-tab="grouping"] ._gropingFields').removeClass('_on');
        
    }
    
    
    self._buildGroupingObjects = function(data){
        var oList =  self._body.find('[data-tab="grouping"] ._gropingObjects ._list'),
            sHTML = '',
            aKeys = Array.objectKeys(data);
        aKeys.quickSort();
        for (var nJ = 0; nJ < aKeys.length; nJ++){
            sHTML += self._buildGroupingRow(aKeys[nJ], data[aKeys[nJ]]);
        }
        oList.html(sHTML);
    }
    
    self._buildGroupingRow = function(sName, sFields) {
        var aFields = sFields != '' ? sFields.split(',') : [],
            sLabel = self._parent._objects.getObjectLabel(sName),
            sHTML = '<div data-object="' + sName + '" data-fields="' + sFields + '">' 
                + '<span class="simple_buttons">'
                + '<span data-action="editGrouping">Edit</span>'
                + '<span data-action="delGrouping">Del</span>'
                + '</span>&nbsp;'
                + sLabel.htmlspecialchars()
                + '&nbsp;(<b>' + aFields.length + '</b>)'
                + '</div>';
        return sHTML;
        
    }
    
    self._fillGroupingOptions = function(sObject, aFields, aFilter, aRefFilter) {
        var sHTML = '';
            
        for (var nI = 0; nI < aFields.length; nI++) {
            var aField = aFields[nI], 
                sKey = aField['name'];
            if (aFilter != undefined && aFilter.indexOf(aField['type']) < 0) {
                continue;
            }
            sHTML += '<div data-fid="' + sKey + '" '
                + ' class="_moveable '
                + (aField['type'] == 'REFERENCE' ? '_plus' : '')             
                + '" '
                + (aField['type'] == 'REFERENCE' 
                    ? 'title="' + self._parent.getText('ce_reference_object', 'Reference object fields') 
                    : '') 
                + '>' 
                + aField['label'].htmlspecialchars() 
                + '</div>';
            if (aField['type'] == 'REFERENCE') {
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, undefined, true, sObject);
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    
                    if (aRefFilter != undefined && aRefFilter.indexOf(aRefFields[nJ]['type']) < 0) {
                        continue;
                    }
                    sHTML += '<div data-parent="' + sKey + '" data-fid="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
                        + 'class="_moveable _off _small"'
                        + '>' 
                        + aField['label'].htmlspecialchars() 
                            + ' / '
                            + aRefFields[nJ]['label'].htmlspecialchars()
                        + '</div>'
                    ;
                }
            }
        }
        self._body.find('[data-tab="grouping"] .unvisible').html(sHTML);
        self._body.find('[data-tab="grouping"] .visible').html('');
    }
    
    self._setGroupingOptions = function(aFields) {
        var oFrom = self._body.find('[data-tab="grouping"] .unvisible > div'),
            oTo = self._body.find('[data-tab="grouping"] .visible');
        for (var nI = 0; nI < aFields.length; nI++) {
            oFrom.filter('[data-fid="' + aFields[nI] + '"]').remove().appendTo(oTo).removeClass('_off');
        }
    }
    
    self._filteringBody = function(){
        var sHTML = '<div class="_filteringFields">'
                + '<span class=multi_select_title>' + self._parent.getText('addon_available', "Available") + '</span>' 
                + '<div data-list="filteringAvailable" class="multi_select unvisible"></div>'
                + '<div class="simple_buttons" data-block="filterings">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="open" title="' 
                        + self._parent.getText('ce_open_reference', "Open Reference Fields")
                        + '">+</a>' 
                + '</div>'
                + '<div data-list="filteringActive" class="multi_select visible"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>' 
                + '<select></select>'
                + "</div>";
        return sHTML;
    }
    
    self._filteringAfter = function(){
        var aSelectedFields;
        self._parent._addQueue([
            function(){
                var aFieldObjs = ['user'];
                aSelectedFields = self._parent._objects.getSpecialSettings('filteringFields', null);
                if (aSelectedFields != null) {
                    for (var nJ = 0; nJ < aSelectedFields.length; nJ++) {
                        var aTmp = aSelectedFields[nJ].split('|');
                        if (aFieldObjs.indexOf(aTmp[0]) && aTmp[0] != 'common') {
                            aFieldObjs.push(aTmp[0]);
                        }
                    }
                }
                if (aFieldObjs.length > 0) {
                    self._parent._objects.getObjects(aFieldObjs, function(aObjs){}, {
                        loadReferenced : true, 
                        "onlySingleReference" : true
                    });
                }
            },
            function(){
                self._fillFilteringFields('', aSelectedFields, true);
            },
            function(){
                var aObjects = self._parent._objects.getObjectsList(),
                    oSelect = self._body.find('[data-tab="filtering"] select'),
                    sHTML = '<option value="common">Common fields</option>';
                aObjects.quickSort('label');
                for (var nI = 0; nI < aObjects.length; nI++) {
                    sHTML += '<option value="' + aObjects[nI].name.htmlspecialchars() + '">'
                        + aObjects[nI].label.htmlspecialchars()
                        + '</option>';
                }
                oSelect.html(sHTML);
                oSelect.on('change', function(){
                    self._changeFilteringObject(oSelect.val());
                });
                self._changeFilteringObject('common');
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
                self._parent.loadCss('/css/plugin-multi-select.css');
            },
            function(){
                self._body.find('[data-tab="filtering"] ._filteringFields').CAMultiSelect({
                    "left" : 'div.unvisible',
                    "right" : 'div.visible',
                    "buttons" : 'div.simple_buttons >  a[data-mode]',
                    "sub" : "div._moveable",
                    "orderable" : "div._orderable",
                    "touchhold" : 1000,
                    "touchradius" : 10,
                    "touchscrollarea" : 15
                });
            },
        ]);
    }
    
    self._changeFilteringObject = function(sVal, sTab) {
        if (sVal == 'common') {
            var aFields  = Array.objectValues(self._parent._objects.getCommonFields());
            aFields.quickSort('label');
            self._fillFilteringFields(sVal, aFields);
            
        } else  {
            self._parent._objects.getObjects(sVal, 
                function(aObj){
                    var aFields = Array.objectValues(aObj[sVal].fields);
                    aFields.quickSort('label');
                    self._fillFilteringFields(sVal, aFields, false, sTab);
                }, {
                    loadReferenced : true, 
                    "onlySingleReference" : true
                }
            );
        }
    }
    
    self._fillFilteringFields = function(sObject, aFields, bSelected, sTab){
        if (aFields == null) {
            return;
        }
        sTab = sTab || 'filtering';
        bSelected = bSelected || false;
        var sHTML = '',
            aField,
            sObjectLabel = '',
            sFieldLabel = '',
            aCommonFields = sTab == 'filtering' ? self._parent._objects.getCommonFields() : {},
            aCommonFieldNames = Array.objectKeys(aCommonFields),
            sFieldFilterName,
            aAlreadySelected = bSelected ? null : [];
        if (aAlreadySelected != null) {
            self._body.find('[data-tab="' + sTab + '"] .visible > div').each(function(nIdx, oEl){
                aAlreadySelected.push(jQuery(oEl).data('fid'));
            });
        }
        for (var nJ = 0; nJ < aFields.length; nJ++) {
            if (bSelected) {
                if (sTab == 'filtering') {
                    var aTemp = aFields[nJ].split('|');
                    sObject = aTemp[0];
                    aField = self._parent._objects.getObjectFieldByName(aTemp[0], aTemp[1]);
                    sFieldFilterName = aFields[nJ];
                } else {
                    aField = self._parent._objects.getObjectFieldByName(sObject, aFields[nJ].name);
                    sFieldFilterName = aFields[nJ].name;
                }
            } else {
                aField = aFields[nJ];
                sFieldFilterName = 
                        (sTab == 'filtering' ?  sObject + '|' : '' )
                        + aField.name;
                if (sObject != 'common' && aCommonFieldNames.indexOf(aField.name) >= 0) {
                    continue;
                }
            }
            if (aField == null) {
                continue;
            }
            if (aAlreadySelected == null || aAlreadySelected.indexOf(sFieldFilterName) < 0) {
                sObjectLabel = sObject == 'common' ? 'Common' : self._parent._objects.getObjectLabel(sObject);
                sFieldLabel = aField['label'].htmlspecialchars();
                
                if (sFieldFilterName.indexOf('.') >= 0 && sTab != 'filtering') {
                    var aTemp = sFieldFilterName.split('.');
                    sFieldLabel = self._parent._objects.getObjectFieldByName(sObject, aTemp[0]).label + ' / ' + sFieldLabel;
                }
                sHTML += '<div data-fid="' + sFieldFilterName + '" '
                    + ' class="_moveable '
                    + (sFieldFilterName.indexOf('.') >= 0 ? ' _small' : '')
                    + (aField['type'] == 'REFERENCE' && sFieldFilterName.indexOf('.') < 0 ? '_plus' : '')             
                    + '" '
                    + (aField['type'] == 'REFERENCE' && !bSelected
                        ? ('title="' + self._parent.getText('ce_reference_object', 'Reference object fields') + '"')
                        : '') 
                    + '>' 
                    + (sTab == 'lookup' ? '<input title="Search" type="checkbox" '
                        + (aField['type'] == "REFERENCE"  ? " disabled " : "")
                        + (bSelected && aFields[nJ].search === true ? 'checked' : '')
                        + '>' : ''
                    )
                    + (sTab == 'filtering' ? sObjectLabel + ' / '  : '')
                    + sFieldLabel
                    + '</div>';
            }
        
            if (!bSelected && aField['type'] == 'REFERENCE') {
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, undefined, true, sObject == 'common' ? 'user' : sObject);
                for (var nF = 0; nF < aRefFields.length; nF++) {

                    if (aAlreadySelected != null && aAlreadySelected.indexOf(sFieldFilterName + '.' + aRefFields[nF]['name']) >= 0) {
                        continue;
                    }
                    sHTML += '<div data-parent="' + sFieldFilterName + '" data-fid="' + sFieldFilterName + '.' + aRefFields[nF]['name'] + '" '
                        + 'class="_moveable _off _small"'
                        + '>' 
                        + (sTab == 'lookup' 
                            ? '<input title="Search" type="checkbox" '
                                + (aRefFields[nF]['type'] == "REFERENCE"  ? " disabled " : "")
                                + (bSelected && aFields[nJ].search === true ? 'checked' : '')
                                + '>' 
                            : ''
                        )
                        + (sTab == 'filtering' ? sObjectLabel + ' / '  : '')
                        + aField['label'].htmlspecialchars() 
                            + ' / '
                            + aRefFields[nF]['label'].htmlspecialchars()
                        + '</div>'
                    ;
                }
            }
        }
        self._body.find('[data-tab="' + sTab + '"] ._filteringFields ' + (bSelected ? '.visible' : '.unvisible'))
            .html(sHTML);
    }
    
    
    self._icalBody = function(){
        var sHTML = '<div class="_ical_settings">'
                + 'Consumer Key &nbsp;<input placeholder="Consumer Key" name="key">&nbsp;<br>'
                + 'Consumer Secret &nbsp;<input placeholder="Consumer Secret" name="secret">&nbsp;<br>'
                + 'Enter Certificate name for JWT mode <input placeholder="Certificate Name" name="cert">&nbsp;'
                + ' Leave empty for oAuth RefreshToken mode'
                + "</div>";
        return sHTML;
    }
    
    self._icalAfter = function(){
        var oIcal = self._body.find('[data-tab="ical"]');
        self._parent._addQueue([
            function(){
                self._parent._objects.loadSpecialSettings('clientKey', function(data){
                    oIcal.find('input[name="key"]').val(data.value);
                }, {data : {secure : true}});
                self._parent._objects.loadSpecialSettings('clientSecret', function(data){
                    oIcal.find('input[name="secret"]').val(data.value);
                }, {data : {secure : true}});
                self._parent._objects.loadSpecialSettings('clientCert', function(data){
                    oIcal.find('input[name="cert"]').val(data.value);
                }, {data : {secure : true}});
            }
        ]);
    }
    
    self._lookupBody = function(){
        var sHTML = '<div class="_filteringFields">'
                + '<span class=multi_select_title>' + self._parent.getText('addon_available', "Available") + '</span>' 
                + '<div data-list="filteringAvailable" class="multi_select unvisible"></div>'
                + '<div class="simple_buttons" data-block="filterings">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="sort_left" title="' 
                    + self._parent.getText('cs_sort_by_name', "Sort available by name")
                    + '">&darr;</a>'
                    + '<a data-mode="open" title="' 
                        + self._parent.getText('ce_open_reference', "Open Reference Fields")
                        + '">+</a>' 
                    + '<a data-mode="sort_right" title="'
                    + self._parent.getText('cs_sort_available_name', "Sort Selected by name")
                    + '">&darr;</a>'
                + '</div>'
                + '<div data-list="filteringActive" class="multi_select visible"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>' 
                + '<select></select>'
                + "</div>";
        return sHTML;
    }
    
    self._lookupAfter = function(){
        self._parent._addQueue([
            function(){
                self._aLookupFields = self._parent._objects.getSpecialSettings('lookupFields', {});
            },
            function(){
                var aObjects = self._parent._objects.getObjectsList(),
                    oSelect = self._body.find('[data-tab="lookup"] select'),
                    sHTML = '<option value="">Select Object</option>',
                    sOldValue = '';
                    //sHTML = '<option value="common">Common fields</option>';
                aObjects.quickSort('label');
                for (var nI = 0; nI < aObjects.length; nI++) {
                    sHTML += '<option value="' + aObjects[nI].name.htmlspecialchars() + '">'
                        + aObjects[nI].label.htmlspecialchars()
                        + '</option>';
                }
                oSelect.html(sHTML);
                oSelect
                    .on('focus', function(){
                        sOldValue = oSelect.val();
                    })
                    .on('change', function(){
                        self._changeLookupObject(oSelect.val(), sOldValue);
                        sOldValue = oSelect.val();
                    });
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
                self._parent.loadCss('/css/plugin-multi-select.css');
            },
            function(){
                self._body.find('[data-tab="lookup"] ._filteringFields').CAMultiSelect({
                    "left" : 'div.unvisible',
                    "right" : 'div.visible',
                    "buttons" : 'div.simple_buttons >  a[data-mode]',
                    "sub" : "div._moveable",
                    "orderable" : "div._orderable",
                    "touchhold" : 1000,
                    "touchradius" : 10,
                    "touchscrollarea" : 15
                });
            },
        ]);
    }
    
    self._changeLookupObject = function(sVal, sOldValue) {
        if (sOldValue != '' && sOldValue != sVal) {
            self._setLookupFields(sOldValue);
        }
        self._body.find('[data-tab="lookup"] .visible').html('');
        if (sVal == '') {
            return;
        }
        self._parent._objects.getObjects(sVal, 
            function(aObj){
                var aFields = Array.objectValues(aObj[sVal].fields);
                aFields.quickSort('label');
                self._fillFilteringFields(sVal, aFields, false, 'lookup');
                self._fillFilteringFields(
                    sVal, 
                    self._aLookupFields[sVal] != undefined ? self._aLookupFields[sVal] : [], 
                    true, 
                    'lookup'
                );
            }, {
                loadReferenced : true, 
                "onlySingleReference" : true
            }
        );
    }
    
    self._setLookupFields = function(sObj) {
        var aFields = [];
        self._body.find('[data-tab="lookup"] .visible > div').each(function(nIdx, oEl){
            aFields.push({
                name : jQuery(oEl).data('fid'),
                search : jQuery(oEl).children('input').is(':checked')
            });
        });
        if (aFields.length > 0) {
            self._aLookupFields[sObj] = aFields;
        } else if (typeof(self._aLookupFields[sObj]) != 'undefined'){
            delete self._aLookupFields[sObj];
        }
    }
    
    self._presetBody = function(){
        var sHTML = '<div class="preset_manage _list_mode">'
                    + '<div class="preset_list"><table>'
        
            + '</table></div>'
            + '<div class="preset_form">' + self._buildPresetForm() + '</div>'
            + '<div class="form_buttons">'
                + '<span class="small_button" data-action="saveSetting" data-param="">OK</span>'    
                + '<span class="small_button" data-action="cancelSetting" data-param="">Cancel</span>'    
                + '<span class="small_button" data-action="savePreset" data-param="">Save Group By</span>'    
                + '<span class="small_button" data-action="editPreset" data-param="">Add new Group By</span>'
                + '<span class="small_button" data-action="cancel" >Close without saving</span>'
                + '</div>'
            + '</div>';
        return sHTML;
    }
    
    self._presetAfter = function(){
        var sHTML = '',
            oDiv = self._body.find('div[data-tab="preset"] .preset_manage');
        self._dom_preset = oDiv;
        self._parent._addQueue([
            function(){
                self._parent._objects.loadSpecialSettings('swimlane', function(data){
                    self._aPresets = data;
                });
            },
            function(){
                if (self._aPresets != undefined && self._aPresets.length > 0) {
                    self._buildPresetList();
                    
                }
            }
        ]);
        oDiv.on('change', '.settings_new select[name="object"]', function(evt){
            self._fillSettingFields(jQuery(evt.target).val());
        });
        oDiv.on('change', '.settings_new select[name="field"]', function(evt){
            self._fillSettingReferences(
                oDiv.find('.settings_new select[name="object"]').val(),
                jQuery(evt.target).val()
            );
        });
    }
    self._buildPresetList = function(){
        var sHTML = '';
        for (var nJ = 0; nJ < self._aPresets.length; nJ++) {
            sHTML += "<tr data-id='" + self._aPresets[nJ].id + "'><td>"
                + '<a data-action="editPreset" class="_ico_edit" title="Edit"></a>'
                + '<a data-action="clonePreset" class="_ico_clone" title="Clone"></a>'
                + '<a data-action="delPreset" class="_ico_del" title="Delete"></a>'
                + '</td><td>'
                + self._aPresets[nJ].label.htmlspecialchars() + '</td>'
            + '</tr>';
        }
        self._dom_preset.find('.preset_list > table').html(sHTML);
    }
    
    self._buildPresetForm = function() {
        var sHTML = "<div class='preset_edit'>"
            + "<label>Swimlane Group By Name</label><input type=text name='label'/><br>"
            //+ "<label>Visibile</label><input type=radio name='owner' value=my/>To me&nbsp;"
            //+ "<input type=radio name='owner' value=all/>To all users"
            + "</div>"
            + '<div class="settings_new">' + self._selectNewPresetSetting() + '</div>'
            + '<div class="settings_list"></div>'
            + '<div class="settings_filter"></div>'
            + '<div class="settings_label _multi_select_block" data-block="label"></div>';
        return sHTML;
    }
    
    
    
    self._editPresetAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        self._dom_preset.removeClass('_list_mode _setting_mode _label_mode').addClass('_edit_mode');
        self._nCurrentPreset = oEl.data('param');
        if (oEl.parents('[data-id]').size() > 0) {
            self._nCurrentPreset = oEl.parents('[data-id]').data('id');
        }
        self._showPresetEditPopup(self._nCurrentPreset);
        
    }
    
    self._clonePresetAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        self._dom_preset.removeClass('_list_mode _setting_mode _label_mode').addClass('_edit_mode');
        self._nCurrentPreset = "";
        var nPreset = oEl.data('param');
        if (oEl.parents('[data-id]').size() > 0) {
            nPreset = oEl.parents('[data-id]').data('id');
        }
        self._showPresetEditPopup(nPreset, 'clone');
        
        
    }

    self._delPresetAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        var nId = oEl.parents('[data-id]').data('id');
        oEl.parents('[data-id]').remove();
        for (var nJ = 0; nJ < self._aPresets.length; nJ++) {
            if (self._aPresets[nJ].id == nId) {
                self._aPresets.splice(nJ, 1);
            }
        }
        self._parent._objects.savePresets(self._aPresets);
        var oV = self._parent._getView('swimlane');
        if (oV != undefined) {
            oV.resetPreset(self._aPresets);
        }
        oV = self._parent._getView('day');
        if (oV != undefined) {
            oV.resetPreset(self._aPresets);
        }
        
        
//        self._parent._objects.savePresets(self._aPresets);
//        self._typeSelector
//            .find('select optgroup[data-type="preset"] option[value="' + nId + '"]')
//            .remove();
    }
    
    self._newPresetSettingAction = function(oEl, evt) {
        self._dom_preset.find('.settings_new select._err').removeClass('_err');
        var sObj = self._dom_preset.find('.settings_new select[name="object"]').val(),
            sField = self._dom_preset.find('.settings_new select[name="field"]').val(),
            sReference = self._dom_preset.find('.settings_new select[name="reference"]').val();
        if (sObj == '0' || sField == '' 
            || (!self._dom_preset.find('.settings_new select[name="reference"]').hasClass('_CA_off') && sReference == '' )
            || self._dom_preset.find('.settings_list').children('div[data-object="' + sObj + '"]').size() > 0
        ) {
            if (sObj == '0') {
                self._dom_preset.find('.settings_new select[name="object"]').addClass('_err');
            } else if (sField == ''){
                self._dom_preset.find('.settings_new select[name="field"]').addClass('_err');
            } else {
                self._dom_preset.find('.settings_new select[name="reference"]').addClass('_err');
            }
            return;
        }
        self._buildSettingFilter(sObj, sField, sReference, [], "");
        self._oLastSetting = null;

        self._dom_preset.removeClass('_list_mode _edit_mode _label_mode').addClass('_setting_mode');
        
    }
    
    self._cancelSettingAction = function(oEl, evt) {
        self._dom_preset.removeClass('_list_mode _setting_mode _label_mode').addClass('_edit_mode');
    }
    
    self._saveSettingAction = function(oEl, evt) {
        if (self._dom_preset.hasClass('_label_mode')) {
            self._oLastSetting.data('label'  , self._getActiveLabel().join(","));
        } else {
            if (self._oLastSetting == null) {
                var sObj = self._dom_preset.find('.settings_new select[name="object"]').val(),
                    sField = self._dom_preset.find('.settings_new select[name="field"]').val(),
                    aField = self._parent._objects.getObjectFieldByName(sObj, sField),
                    oSetting = {
                        object  : sObj,
                        field   : sField,
                        reference : self._dom_preset.find('.settings_new select[name="reference"]').val(),
                        filter  : self._filterView.getFilters(true).join("##"),
                        rule    : '' + self._filterView.getRule(),
                        id      : "",
                        label   : "name"
                    }
                if (oSetting.reference == '') {
                    oSetting.reference = aField.options[0].name;
                }
                self._dom_preset.find('.settings_list').append(self._buildSettingRow(oSetting));
                self._dom_preset.find('.settings_new > select[name="object"] option[value="' + sObj + '"]')
                        .prop('disabled', true);
                self._dom_preset.find('.settings_new > select[name="object"]').val('0').trigger('change');
            } else {
                self._oLastSetting.data({
                    filter  : self._filterView.getFilters(true).join("##"),
                    rule    : '' + self._filterView.getRule()
                });
            }
        }
        self._cancelSettingAction();
    }
    
    
    self._editSettingAction = function(oEl, evt){
        var oDiv = jQuery(evt.target).parents('[data-object]');
        self._buildSettingFilter(oDiv.data('object'), 
            oDiv.data('field'), 
            '' + oDiv.data('reference'),
            '' + oDiv.data('filter'), 
            '' + oDiv.data('rule')
        );
        self._oLastSetting = oDiv;
        self._dom_preset.removeClass('_list_mode _edit_mode _label_mode').addClass('_setting_mode');
    }
    
    self._delSettingAction = function(oEl, evt){
        var oDiv = jQuery(evt.target).parents('[data-object]');
        self._dom_preset.find('.settings_new > select[name="object"] option[value="' + oDiv.data('object') + '"]')
            .prop('disabled', false);
        oDiv.remove();
        
    }
    
    self._labelSettingAction = function(oEl, evt) {
        var oLabelDiv = self._dom_preset.find('.settings_label'),
            oDiv = jQuery(evt.target).parents('[data-object]');
        self._oLastSetting = oDiv;
        var aQ = [];
        if (oLabelDiv.children().size() < 1) {
            aQ.push(function(){
                self._dom_preset.find('.settings_label').html(self._buildLabelSelector());
            });
            aQ.push(function(){
                    self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
                    self._parent.loadCss('/css/plugin-multi-select.css');
                }
            );            
            aQ.push(
                function(){
                    oLabelDiv.CAMultiSelect({
                        "left" : 'div[data-list="_off"]',
                        "right" : 'div[data-list="_on"]',
                        "buttons" : 'div.simple_buttons >  a[data-mode]',
                        "sub" : "div._moveable",
                        "orderable" : "div._orderable",
                        "touchhold" : 1000,
                        "touchradius" : 10,
                        "touchscrollarea" : 15
                    });
                }
            );
            
        }
        aQ.push(function(){
            self._fillLabelOptions(oDiv.data('reference'));
        });
        aQ.push(function(){
            self._setLabelOptions(oDiv.data('label'));
        });
        self._dom_preset.removeClass('_list_mode _setting_mode _edit_mode').addClass('_label_mode');
        self._parent._addQueue(aQ);
        
    }
    
    self._getActiveLabel = function() {
        var oList = self._dom_preset.find('.settings_label div[data-list="_on"]'),
            aResult = [];
        oList.children('[data-fid]').each(function(){
            aResult.push(jQuery(this).data('fid'));
        });
        return aResult;
    }
    
    self._buildLabelSelector = function(){
        var sHTML = 
                '<span class=multi_select_title>Available</span>' 
                + '<div data-list="_off" class="multi_select"></div>'
                + '<div class="simple_buttons">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="sort_left" title="Sort Available by name">&darr;</a>'
                    + '<a data-mode="sort_right" title="Sort Selected by name">&darr;</a>'
                    + (
                        self._parent.params.insideEdit == '1'
                        ? '<a data-mode="open" title="Open Reference Fields">+</a>' 
                        : ''
                    )
                + '</div>'
                + '<div data-list="_on" class="multi_select"></div>'
                + '<span class=multi_select_title>Selected</span>' ;
        return sHTML;
    }
    
    self._fillLabelOptions = function(sObj) {
        var sHTML = '', 
            bRefFields = self._parent.params.insideEdit == '1';
        self._parent._objects.getObjectStructure(sObj, function(oFields){
            var aFields = Array.objectValues(oFields);
            for (var nI = 0; nI < aFields.length; nI++) {
                var aField = aFields[nI], 
                    sKey = aField['name'];
                sHTML += '<div data-fid="' + sKey + '" '
                    + ' class="_moveable '
                    + (bRefFields && aField['type'] == 'REFERENCE' ? '_plus' : '')             
                    + '" '
                    + (bRefFields && aField['type'] == 'REFERENCE' ? 'title="Reference object fields"' : '') 
                    + '>' 
                    + aField['label'].htmlspecialchars() 
                    + '</div>';
                if (bRefFields && aField['type'] == 'REFERENCE') {
                    var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, undefined, true, sObj);
                    for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                        sHTML += '<div data-parent="' + sKey + '" data-fid="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
                            + 'class="_moveable _off _small"'
                            + '>' 
                            + aField['label'].htmlspecialchars() 
                                + ' / '
                                + aRefFields[nJ]['label'].htmlspecialchars()
                            + '</div>'
                        ;
                    }
                }
            }
            self._dom_preset.find('.settings_label .multi_select[data-list="_off"]').html(sHTML);
            self._dom_preset.find('.settings_label .multi_select[data-list="_on"]').html('');
        });
        
    }
    
    self._setLabelOptions = function(sFields) {
        var aFields = sFields == "" ? ["name"] : sFields.split(","),
            jFrom = self._dom_preset.find('.settings_label .multi_select[data-list="_off"]'),
            jTo = self._dom_preset.find('.settings_label .multi_select[data-list="_on"]');
        for (var nI = 0; nI < aFields.length; nI++) {
            var oEl = jFrom.children('div[data-fid="' + aFields[nI] + '"]');
            oEl.remove().appendTo(jTo).removeClass('_off');
        }
    }
    
    self._showPresetEditPopup = function(sId, sMode) {
        
        var aPreset = self._getPreset(sId);
        self._dom_preset.find('.settings_new > select[name="object"] option[disabled]').prop('disabled', false);
        if (aPreset != null) {
            if (sMode !== 'clone')  {
                self._dom_preset.find('input[name="label"]').val(aPreset.label);
            } else {
                self._dom_preset.find('input[name="label"]').val('');
            }
            self._setSettingsList(aPreset.filters);
        } else {
            self._dom_preset.find('input[name="label"]').val('');
            //self._dom_preset.find('select').val('0');
            self._dom_preset.find('select[name="object"]').val('0').trigger('change');
            self._dom_preset.find('._err').removeClass('_err');
            self._dom_preset.find('.settings_list').html('');
        }
    }
    
    self._selectNewPresetSetting = function() {
        var sHTML = '<select name=object><option value="0">Select Calendar Source Object...';
        
        var aObjs = self._parent._objects.getObjectsList();
        aObjs.quickSort('label', {'lowercase' : true});
        for (var nJ = 0; nJ < aObjs.length; nJ++) {
            sHTML += '<option value=' + aObjs[nJ].name + '>'  + aObjs[nJ].label.htmlspecialchars();
        }
        sHTML += '</select>'
            + '<select name=field></select>'
            + '<select name=reference class="_CA_off"></select>'
            + '<span class=simple_button data-action="newPresetSetting">Add</span>';
        return sHTML;
        
    }
    
    self._setSettingsList = function(aList) {
        var sHTML = '', aObjects = [];
        for (var nJ = 0; nJ < aList.length; nJ++) {
            if (aObjects.indexOf(aList[nJ].object) < 1) {
                aObjects.push(aList[nJ].object);
            }
            
        }
        
        self._parent._objects.getObjects(aObjects, function(){
            for (var nJ = 0; nJ < aList.length; nJ++) {
                sHTML += self._buildSettingRow(aList[nJ]);
            }
            self._dom_preset.find('.settings_list').html(sHTML);
        });
        
        if (aObjects.length > 0) {
            self._dom_preset.find('.settings_new > select[name="object"] option')
                    .filter('[value="' + aObjects.join('"],[value="') + '"]').prop('disabled', true);
        }
        
    }
    
    self._buildSettingRow = function(oSet) {
        var sObjName = self._parent._objects.getObjectLabel(oSet.object),
            aField = self._parent._objects.getObjectFieldByName(oSet.object, oSet.field),
            sHTML = '<div data-filter="' + oSet.filter + '" '
                + 'data-rule="' + oSet.rule + '" '
                + 'data-object="' + oSet.object + '" '
                + 'data-reference="' + oSet.reference + '" '
                + 'data-label="' + oSet.label + '" '
                + 'data-field="' + oSet.field + '">' 
                + '<span class="_preset_field_title">'
                + sObjName.htmlspecialchars() + ' / ' + aField.label.htmlspecialchars()
                + '</span>'
                + '<span >'
                    + '<span class="simple_button" data-action=editSetting title="Add/Edit filters for Swimlane Custom Group By Grouping field values">Edit Filters</span>'
                    + '<span class="simple_button" data-action=labelSetting title="Select fields to be shown together with Swimlane Custom Group By Grouping field">Title Fields</span>'
                    + '<span class="simple_button" data-action=delSetting title="Delete Swimlane Custom Grouping">Delete</span>'
                + '</span>'
            + '</div>';
        return sHTML;
    }
    
    self._fillSettingFields = function(sObj) {
        var sHTML = '<option value="">Select Swimlane Group By Field...',
//            aFilter = ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'REFERENCE', 'PICKLIST', 'COMBOBOX'];
            aFilter = ['REFERENCE'];
        self._dom_preset.find('.settings_new select[name="reference"]').addClass('_CA_off');
        if (sObj == '0') {
            self._dom_preset.find('.settings_new select[name="field"]').html(sHTML);
            return;
        }
        self._parent._objects.getObjectStructure(sObj, function(aFields){
            var aGroupFields = Array.objectValues(aFields);
            aGroupFields.quickSort('label');
            
            for (var nJ = 0; nJ < aGroupFields.length; nJ++) {
                if (aFilter.indexOf(aGroupFields[nJ].type) < 0) {
                    continue;
                }
                sHTML += '<option value=' + aGroupFields[nJ].name + '>'  + aGroupFields[nJ].label.htmlspecialchars();
            }
            self._dom_preset.find('.settings_new select[name="field"]').html(sHTML);
        });
    }
    
    self._fillSettingReferences = function(sObj, sField) {
        var aField = self._parent._objects.getObjectFieldByName(sObj, sField),
            sHTML = '<option value="">Select Reference Grouping Object...',
            oSelect = self._dom_preset.find('.settings_new select[name="reference"]');
        if (aField == null || aField.options == null || aField.options.length == 1) {
            oSelect.html(sHTML).addClass('_CA_off');
            return;
        }
        oSelect.removeClass('_CA_off');
        var aOptions = [].concat(aField.options);
        aOptions.quickSort('value', {'lowercase' : true});
        for (var nI = 0; nI < aOptions.length; nI++) {
            sHTML += '<option value=' + (aOptions[nI].name != null && aOptions[nI].name != '' 
                            ? aOptions[nI].name
                            : aOptions[nI].key
                        ).htmlspecialchars() + '>'  
                        + aOptions[nI].value.htmlspecialchars();
        }
        oSelect.html(sHTML);
    }
    
    
    self._buildSettingFilter = function(sObj, sField, sReference, aFilter, sRule) {
        var aField = self._parent._objects.getObjectFieldByName(sObj, sField),
            aRefFields;
        sReference = sReference != '' ? sReference : aField.options[0].name;
        self._parent._addQueue([
            function(){
                self._parent._initView('calendarFilter', function(){
                    self._filterView = self._parent._getView('calendarFilter');
                });
            },
            function(){
                self._parent._objects.loadReferenceObjects(sObj, function(){});
            },
            function(){
                if (sReference != '') {
                    self._parent._objects.getObjectStructure(sReference, function(aFields) {
                        aRefFields = aFields;
                    });
                } else {
//                    self._parent._objects.getObjectStructure(sReference, function(aFields) {
//                        aRefFields = aFields;
//                    });
//                    aRefFields = self._parent._objects.getLinkedObjectsFields(aField, undefined, true, sObj);
                }
            },
            function(){
//                console.log(aRefFields);
                self._filterView.resetFilter(aField.options[0].name, aRefFields);
                self._filterView.show({
                    "object"    : sReference != '' ? sReference : aField.options[0].name,
                    "structure" : aRefFields,
                    "div"       : self._dom_preset.find('.settings_filter'),
                    "filter"    : aFilter,
                    'rule'      : '' + sRule
                });
            }
        ]);
    }
    
    self._getPresetFilters = function() {
        var aFilters = [];
        self._dom_preset.find('.settings_list').children().each(function(nIdx, oEl){
            oEl = jQuery(oEl);
            aFilters.push({
                'object'    : oEl.data('object'),
                'field'     : oEl.data('field'),
                'rule'      : '' + oEl.data('rule'),
                'filter'    : oEl.data('filter'),
                "reference" : oEl.data('reference'),
                "label"     : oEl.data('label')
            });
        });
        return aFilters;
        
    }
    
    self._getPreset = function(sId) {
        for (var nJ = 0; nJ < self._aPresets.length; nJ++) {
            if (self._aPresets[nJ].id == sId) {
                return self._aPresets[nJ];
            }
        }
        return null;
    }
    
    self._savePresetAction = function(){
        self._dom_preset.find('input[name="label"],select[name="object"]').removeClass('_err');
        var aSaveData = {
            id          : self._nCurrentPreset,
            label       : self._dom_preset.find('input[name="label"]').val(),
            filters     : self._getPresetFilters()
        };
        if (aSaveData.filters.length < 1 || aSaveData.label.trim() == '') {
            if (aSaveData.label.trim() == '') {
                self._dom_preset.find('input[name="label"]').addClass('_err');
            } else {
                self._dom_preset.find('select[name="object"]').addClass('_err');
            }
            return;
        }
        if (aSaveData.id == null || aSaveData.id == '') {
            var nMax = 0;
            if (self._aPresets == null) {
                self._aPresets = [];
            }
            for (var nJ = 0; nJ < self._aPresets.length; nJ++) {
                nMax = Math.max(self._aPresets[nJ].id, nMax);
            }
            aSaveData.id = 1 + nMax;
            self._aPresets.push(aSaveData);
        } else {
            var aPreset = self._getPreset(aSaveData.id);
            jQuery.extend(aPreset, aSaveData);
        }
        
        self._parent._objects.savePresets(self._aPresets);
        var oV = self._parent._getView('swimlane');
        if (oV != undefined) {
            oV.resetPreset(self._aPresets);
        }
        self._buildPresetList();
        self._dom_preset.removeClass('_edit_mode _setting_mode _label_mode').addClass('_list_mode');
    }
    
    self._resetPresets = function(){
        if (self._filterView != undefined) {
            self._filterView.resetFilter();
        }
        self._dom_preset.removeClass('_setting_mode _label_mode _edit_mode').addClass('_list_mode');
    }
    
    self._cancelAction = function()  {
        self._dom_preset.removeClass('_edit_mode _setting_mode _label_mode').addClass('_list_mode');
    }
    
    
    self._setParamFields = function(){
        
        self._tab        = {
            "display"   : self._parent.getText('cs_tab_setings', "My Display Settings"),
            "visible"   : self._parent.getText('cs_tab_calendars', "Calendars") ,
            "groups"    : self._parent.getText('cs_tab_groups', "Groups") ,
            "web"       : self._parent.getText('cs_web_calendars', "Web calendars"),
            "addons"    : self._parent.getText('cs_addons', "Addons"),
            "preset"    : self._parent.getText('cs_presets', "Swimlane Custom Group By")
        };
        
        if (self._parent._getUrlParam('lang') == '1' && self._parent.options.SA) {
            self._tab['lang'] = 'Lang';
        }
        if (self._parent.options.SA) {
//            self._tab['search'] = 'Search';
            self._tab['grouping'] = 'Gantt Grouping';
            self._tab['filtering'] = 'Filtering';
            self._tab['lookup'] = 'Lookups';
            self._tab['ical'] = 'ical';

        }
        
        self._aParamFields = {
            "blockMain"     : {"title" : self._parent.getText('cs_my_display_settings', "My Display Settings"), "type" : "block"},
            "size"          : {"title" : self._parent.getText('cs_display_size', "Display size"), "type" : "imageRadio",  
                                "options" : self._parent.getText('cs_display_size_options')},
            "gradient"      : {"title" : self._parent.getText('cs_use_gradient', "Use gradient"), "type" : "imageRadio",  
                                "options" : {"off" : "Off", "on" : 'On'}},
            "mode"          : {"title" : self._parent.getText('cs_default_cal_view', "Default Calendar View"), "type" : "imageRadio", 
                                "options" : self._parent.getText('cs_default_cal_view_options'), "keys" : ["day", "week", "month", "custom",  "agenda", "gantt", 'swimlane']},
            "startWeekDay"  : {"title" : self._parent.getText('cs_week_start', "Week Starts"), "type" : "imageRadio", 
                                "options" : self._parent.getText('week_days'), // ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] 
                                "valueFunction" : parseInt
                            },
            "showWeekEnds"  : {"title" : self._parent.getText('cs_show_days', "Show days"), "type" : "imageRadio", 
                                "options" : self._parent.getText('cs_show_days_options'), "keys" : ["7", "6", "5"]
                            },
            
            "monthWeeks"    : {"title" :  self._parent.getText('cs_show_weekspermonth', "Show weeks per month page"), "type" : "imageRadio", 
                                "options" : self._parent.getText('cs_show_weekspermonth_options')
                            }, 
            
            "blockMonth"    : {"title" : self._parent.getText('cs_month_view_settings', "Month View Settings"), "type" : "block"},
            "extendendRange"    : {"title" : self._parent.getText('cs_query_extended', "Query extended date ranges"), "type" : "boolean"},

            "blockDayWeek"  : {"title" : self._parent.getText('cs_day_week_settings', "Day/Week View Settings"), "type" : "block"},
            "startHourPeriod"  : {
                                    "title" : self._parent.getText('cs_start_day_at', "Start day at"), 
                                    "type" : "numeric", 
                                    "check" : {"min" : 0, "max" : 23}, 
                                    "valueFunction" : parseInt,
                                    "change" : function(evt){return self._changeDayWorkingHours(evt)}
                                },
            "stopHourPeriod"    : {"title" : self._parent.getText('cs_end_day_at', "End day at"), 
                                    "type" : "numeric", 
                                    "check" : {"min" : 1, "max" : 24}, 
                                    "valueFunction" : parseInt, 
                                    "change" : function(evt){return self._changeDayWorkingHours(evt)}
                                },
            "nonWorkingHoursDisplay" : {"title" : self._parent.getText('cs_non_working_hours', "Non Working hours"), "type" : "select", 
                                    "options" : self._parent.getText('cs_non_working_hours_options')
                                },
            "minMinutePeriod"   : {"title" : self._parent.getText('cs_time_slots', "Time Slots"), "type" : "select", 
                                    "options" : self._parent.getText('cs_time_slots_options')
                                },
            "weekViewAgenda"    : {"title" : self._parent.getText('cs_dispay_week_as_agenda', "Display week view in Agenda mode by default"), "type" : "boolean"},
            "dayModeArea"       : {"title" : self._parent.getText('cs_day_week_event_bar', "Day/Week view Event Bar"), "type" : "select", 
                                    "options" : self._parent.getText('cs_day_week_event_bar_options') 
                                },
            "dayViewAgenda"     : {"title" : self._parent.getText('cs_dispay_day_as_agenda', "Day view mode"), "type" : "select",
                                    "options" : {'default' : 'Default', 'agenda' : 'Agenda', 'grouping' : 'Grouping'}},
            
            
            "blockCustom"       : {"title" : self._parent.getText('cs_custom_view_settings', "Custom View Settings"), "type" : "block"},
            "customMode"        : {
                                    "title"     : self._parent.getText('cs_custom_view', "Custom View"), 
                                    "type"      : "select", 
                                    "options"   : self._parent.getText('cs_custom_view_options'),
                                    "keys"      : ["manual", "2d", "3d", "4d", "5d", "6d", "7d", "2w", "3w", "4w"],
                                    "change"    : function(evt){
                                        self._changeCustomMode(evt);
                                    }
                                },
            "customModeArea"    : {"title" : self._parent.getText('cs_event_bar', "Event bar"), "type" : "select", 
                                    "options" : self._parent.getText('cs_event_bar_options') 
                                },
            "customModeRows"    : {"title" : self._parent.getText('cs_rows', "Rows"), "type" : "numeric", 
                                    "check" : {"min" : 1, "max" : 8}},
            "customModeCols"    : {"title" : self._parent.getText('cs_columns', "Columns"), "type" : "numeric", 
                                    "check" : {"min" : 1, "max" : 14}},
            
            "blockAgenda"       : {"title" : self._parent.getText('cs_agenda_settings', "Agenda View Settings"), "type" : "block"},
            "agendaFieldLabels" : {"title" : self._parent.getText('cs_agenda_display_labels', "Display field labels in Agenda view"), "type" : "boolean"},
            "agendaEmptyDays"   : {"title" : self._parent.getText('cs_agenda_display_empty_days', "Show Empty Days in Agenda View"), "type" : "boolean"},
            
            "agendaPrintCurrentMonth" : {"title" : self._parent.getText('cs_agenda_print_month', "Print current Month"), "type" : "boolean"},
            "blockGantt"        : {"title" : self._parent.getText('cs_gantt_settings', "Gantt View Settings"), "type" : "block"},
            "ganttSplit"        : {"title" : self._parent.getText('cs_gantt_default_view', "Default view mode"), "type" : "select", 
                                    "options" : self._parent.getText('cs_gantt_default_view_options'),
                                    "change" : function(evt){
                                        self._changeGanttMode(evt);
                                    }
                                },
            "ganttPeriod"       : {
                                    "title" : self._parent.getText('cs_gantt_default_period', "Default period"), 
                                    "type"  : "select", 
                                    "options" : self._parent.getText('cs_gantt_default_period_options'),
                                    "keys"  : ["0.1", "0.7", "1", "3", "6", "12", "36", "120", "0"],
                                    "change" : function(evt){
                                        self._changeGanttPeriod(evt);
                                    }
                                },
            "ganttRespectHours" : {"title" : self._parent.getText('cs_gantt_respect_hours', "Respect working&nbsp;hours"), "type" : "boolean"},
//            "ganttMaxPrintItems"    : {"title" : self._parent.getText('cs_gantt_print_limit', "Gantt View Print limit"), "type" : "numeric", "check" : {"min" : 0, "max" : 3000}},
            "ganttShowUnvisible"    : {"title" : self._parent.getText('cs_gantt_hidden_work_hours', "Show records from hidden working hours"), "type" : "boolean"},
//            "ganttPrintOldSchool"   : {"title" : self._parent.getText('cs_gantt_print_ie', "Print Gantt as HTML in IE"), "type" : "boolean"},
            "ganttCollapseGroupingByDefault"         : {"title" : "Collapse Grouping by Default", "type" : "boolean"},
            "ganttCollapseFullLine"         : {"title" : "Collapse Grouping One Line", "type" : "boolean"},
            
            "blockSwimlane"     : {"title" : self._parent.getText('cs_swimlane_settings', "Swimlane View Settings"), "type" : "block"},
            "swimlanePreset"    : {"title" : self._parent.getText('cs_swimlane_preset_values', "Preset Swimlane value with Quick Creation"), "type" : "boolean"},
            "swimlaneScrolling" : {"title" : self._parent.getText('cs_swimlane_cross_day', "Swimlane Cross Day Scrolling"), "type" : "boolean"},
            "swimlaneFieldLabels" : {"title" : self._parent.getText('cs_swimlane_field_labels', "Display field labels in Swimlane view"), "type" : "boolean"},
            "swimlaneEnableGroupBy" : {"title" : self._parent.getText('cs_swimlane_group_by', "Display Group by fields option"), "type" : "boolean"},
            "swimlaneDefaultPeriod" : {"title" : self._parent.getText('cs_swimlane_default_group_by', "Default group by time"), "type" : "select", 
                                    "options" : self._parent.getText('cs_swimlane_default_group_by_options')
                                },
            "swimlaneDisplayStartEndDate" : {"title" : self._parent.getText('cs_swimlane_display_startend_datetime', "Display Start Date/Time & End Date/Time"), "type" : "boolean"},
            "swimlaneCell"      : {"title" : 'Day Cell Width' , "type" : "select", 
                                    "options" : {"25" : "25" , "50" : "50", "100" : "100", "200" : "200", "300" : "300"}
                                },
            "swimlaneOneDayAllDay" : {"title" : self._parent.getText('cs_swimlane_display_one_day_all_day', "Display Single AllDay Date"), "type" : "boolean"},
                                
            "blockSpecial"      : {"title" : self._parent.getText('cs_special_settings', "Special Settings"), "type" : "block"},
            "logLevel"          : {"title" : self._parent.getText('cs_special_log', "Log events show"), "type" : "select", 
                                    "options" : self._parent.getText('cs_special_log_options')
                                },
            "showTitles"        : {"title" : self._parent.getText('cs_special_titles', "Show titles"), "type" : "select", 
                                    "options" : self._parent.getText('cs_special_titles_options')
                                },
            "sf1FieldLabels"    : {"title" : self._parent.getText('cs_special_labels_mobile', "Display field labels in mobile"), "type" : "boolean"},
//            "cacheTime"   : {"title" : "Data caching time", "type" : "numeric", "check" : {"min" : 0, "max" : 300}, "valueFunction" : parseInt},
//            "apiCache"    : {"title" : "API caching", "type" : "select", "options" : {"0" : "Off", "1" : "One hour", "3" : "3 hours", "8" : "8 hours", "24" : "One day", "168" : "One week", "lazy" : "Lazy loading"}},
            "hideNotify"        : {"title" : self._parent.getText('cs_special_auto_hide_error', "Auto hide error notifications"), "type" : "select", 
                                    "options" : self._parent.getText('cs_special_auto_hide_error_options')
                                },
            "barLabelTime"      : {"title" : self._parent.getText('cs_special_bar_label', "Show event bar label"), "type" : "select", 
                                    "options" : self._parent.getText('cs_special_bar_label_options')
                                },
            "insideEdit"        : {"title" : self._parent.getText('cs_special_calabs', "CA&nbsp;Labs&nbsp;features (experimental)"), "type" : "select", 
                                    "options" : self._parent.getText('cs_special_calabs_options')
                                },
            "showAdditionalFields" : {"title" : self._parent.getText('cs_special_additional_fields', "Show Additional fields"), "type" : "boolean"},
            "requestTimeout"    : {"title" : self._parent.getText('cs_special_max_request_time', "Maximum Request time"), "type" : "numeric", "check" : {"min" : 1, "max" : 300}, "valueFunction" : parseInt, "error" : "Please enter correct value (1-300 seconds)"},
            "showCreatingDates" : {"title" : self._parent.getText('cs_special_creating_dates', "Display creating dates"), "type" : "boolean"},
            "parallelRequests"  : {"title" : self._parent.getText('cs_special_paralel', "Parallel requests to server"), "type" : "numeric", "check" : {"min" : 1, "max" : 10}, "valueFunction" : parseInt, "error" : "Please enter correct value (1-10 resuests)"},
            "loadLastPeriod"    : {"title" : self._parent.getText('cs_special_last_selected_period', "Load only last selected period"), "type" : "boolean"},
            "showScrollButtons" : {"title" : self._parent.getText('cs_special_scrolling_buttons', "Display scrolling buttons"), "type" : "boolean"},
            "confirmDelete"     : {"title" : self._parent.getText('cs_special_confirm_delete', "Confirm delete"), "type" : "boolean"},
            'respectReminderDD' : {
                                    "title"     : self._parent.getText('cs_custom_reminder', "Support Event/Task Reminders"), 
                                    "type"      : "select", 
                                    "options"   : self._parent.getText('cs_special_reminder_options'),
                                    "keys"      : ["off", "sf", "ca"]
                                },
            "fastStart"         : {"title" : "Fast start", "type" : "boolean"},
            "multiContactsInEvent" : {"title" : self._parent.getText('cs_special_multi_contact_in_event', "Multi Contacts in Event"), "type" : "boolean"},
            
            "blockLayout"       : {"title" : self._parent.getText('cs_layout', "Layout Settings"), "type" : "block"},
            "uiSearch"          : {"title" : self._parent.getText('cs_layout_search', "Display search"), "type" : "boolean"},
            
            "useSFLookup"       : {"title" : self._parent.getText('cs_layout_sf_lookup', "Always Use Salesforce Lookup Dialogs"), 
                                        "type" : "select", 
                                        "options" : {'always' : 'Always', 'auto' : 'Auto', 'never' : 'Never'}
//                                    "type" : "boolean"
            },
            "addons"            : {"title" : self._parent.getText('cs_layout_enable_addons', "Enable Addons"), "type" : "multiselect", 
                                    "options" : function(){
                                        var oResult = {};
                                        jQuery.each(self._parent._addons, function(sKey, mVal){
                                            oResult[sKey] = mVal.title;
                                        })
                                        return oResult;
                                    }
                                },
            "lang"              : {"title" : self._parent.getText('cs_lang', "Language"), "type" : "select", 
                                    "options" : {'en' : 'English', 'uk' : 'Українська', 'ru' : 'Російська'}
                                },
            "printAsImage"      : {"title" : self._parent.getText('cs_print_as_image', "Print as Image"), "type" : "boolean"},
            "longClick"         : {"title" : self._parent.getText('cs_long_click', "Long Click Drag&Drop"), "type" : "boolean"},
//            "displayTimeZone"   : {"title" : "Display Timezone selector", "type" : "boolean"},
            "uiFilter"          : {"title" : 'Display Filter Panel', "type" : "boolean"},
            "uiFilterSets"      : {"title" : 'Display Filter Sets', "type" : "boolean"},
            "displayNewICAL"    : {"title" : 'OAUTH ICAL', "type" : "boolean"},
            "layoutTheme"       : {"title" : 'Layout Theme', "type" : "select", 
                                    "options" : {'default' : 'Default', 'lightning' : 'Lightning'}
                                    }
            
//            "timeZoneMinutes"   : {"title" : "Timezone", "type" : "select", 
//                "options"       : {"-" : "Current", "-540" : "+9Tokyo", 
//                        "-120" : "+2 Kyiv", "-180" : "+3 Summer Kyiv", 
//                        "-60" : "Summer Central Europe", 
//                        "-120" : "Central Europe", 
//                        "-60" : "+1 Summer London", 
//                        "240" : "-4NY", '420' : '-7LA'},
//                "keys"          : ["-", "-540", "-180", "-120", "-60", "240", '420']
//            },
            

//            "design"        : {"title" : "Event design", "type" : "select", "options" : {"classic" : "Classic", "simple" : "Border", "twix" : "Classic + Border", "triple" : "Classic + Border + Dynamic"}},
//            "uiAdvancedSearch"      : {"title" : "Advanced search", "type" : "boolean"},
//            "uiCalendar"      : {"title" : "Display Date picker", "type" : "boolean"},
//            "uiToday"      : {"title" : "Display Today", "type" : "boolean"},
        }    
    }
    
//    self._showError = function(sMessage) {
//        self._error.addClass('_on').text(sMessage);
//    }
//    self._hideError = function() {
//        self._error.removeClass('_on')
//    }
    
    jQuery.calendarAnything.appendView('calendarSettings', view);
})();

