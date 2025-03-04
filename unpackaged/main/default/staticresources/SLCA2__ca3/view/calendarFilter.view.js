/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function() {
    var self = {
        _css        : '/css/calendar-filter.css',
        _parent     : null,
        _div        : null,
        _sCalendarId : null,
        _aStructure : null,
        _nRules     : 0,
        _dom        : {},
        _nTimer     : null,
        _nKeyTimer  : null,
        _help       : null,
        _sObject    : '',
        _bRefColumns : false,
        _bQuick     : true,
        _nOptionCounter : 0
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._parent = parent;
        self._div = div;
        self._parent.loadCss(self._css);
    }
    
    view.show = function(params) {
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
    }
    
    view.resetFilter = function(sObjectName, aFields) {
        if (self._dom.list == undefined) {
            return;
        }
        self._dom.list.html('');
        self._dom.rule.find('input').val('');
        self._dom.message.html('');
        self._sObject = sObjectName != undefined ? sObjectName : self._sObject;
        if (aFields != undefined) {
            self._setStructure(aFields);
        }
    }
    
    view.getFilters = function(bPostMode) {
        return self._getFilters(bPostMode);
    }
    
    view.getRule = function() {
        return self._getRule();
    }
    
    self._show = function(params) {
        self._nRules = 0;
        self._sCalendarId = params.calendar;
        if (self._dom.div == undefined || self._dom.div == null || self._dom.div[0].innerHTML == '') {
            self._buildBaseHTML();
        } else {
            self._dom.div.find('.filter_help').toggleClass('show', self._help);
        }
        
        self._dom.list.html('');
        self._dom.rule.html('');
        self._dom.message.html('');
        self._initEvents();
        if (params == undefined || (params.object == undefined && params.calendar !== undefined )) {
            self._bQuick = true;
            self._dom.div.find('.filter_title,  [data-action="save_filter"], [data-action="cancel"]').show();
            var oCalendar = self._parent._calendars.getCalendar(params.calendar);
            self._sObject = oCalendar.objectName;
            self._parent._addQueue([
                function() {
                    self._parent._objects.getObjectStructure(oCalendar.objectName, function(aStructures){
                        self._setStructure(aStructures);
                    });
                },
                function() {
                    if (self._parent.params.showAdditionalFields) {
                        self._parent._objects.loadReferenceObjects(oCalendar.objectName);
                    }
                }, function() {
                    self._buildFilterContent();
                    self._parent.showPopup({
                        dom     : self._dom.div,         // send ready dom 
//                        coords : {"x" : params.event.clientX - 10, "y" : params.event.clientY - 10},
                        coords : {"x" : params.event.pageX - 10, "y" : params.event.pageY - 10},
                        view    : view,
                        autohide : false,
                        overflow : false,
                        noCloseRule   : '.CA_calendar',
                        onClose : function() {
                            self._checkClose()
                        }
                    });
                }
                
            ])
        } else {
            self._bQuick = false;
            self._sObject = params.object;
            self._setStructure(params.structure);
            self._buildFilterContent(params);
            self._dom.div.find('.filter_help').removeClass('show');
            self._dom.div.find('.filter_title,  [data-action="save_filter"], [data-action="cancel"]').hide();
            params.div.append(self._dom.div);
        }
    }
    
    self._buildBaseHTML = function() {
        
        var sHTML = '<div class="CA_calendar_filter">'
            + '<div class=filter_title>' 
            + self._parent.getText('menu_quick_filters', 'Quick filters')
            + '<span class="simple_button" data-action="hide_help">?</span></div>'
            + '<div class="filter_help ' + (self._help == null || self._help ? "show" : "") +'">' 
            + self._parent.getText('cf_up_10_title', 'Create up to 10 temporary filters which will override the default Calendar Settings')
            + '. '
                + ' <br/><span class=_container><span style="font-weight:bold">' 
                + self._parent.getText('add', 'Add')
                + '</span></span> ' 
                + self._parent.getText('cf_create_add_rows', 'creates additional filter rows')
                + '. '
                + ' <br/><span class=_container><span style="font-weight:bold">' 
                + self._parent.getText('menu_ok', 'OK')
                + '</span></span> ' 
                + self._parent.getText('cf_applies_any', 'applies any new filters')
                + '.'
                + ' <br/><span class=_container><span style="font-weight:bold">' 
                + self._parent.getText('cf_reset', 'Reset')
                + '</span></span> ' 
                + self._parent.getText('cf_removes_temporary', 'removes the temporary filters and returns to the default settings')
                + '.</div>'
            + '<div class="filter_message"></div>'
            + '<div class="filter_list"></div>'
            + '<div class="form_buttons">'
                + '<span data-action="add_filter">' 
                + self._parent.getText('cf_add_criteria', 'Add Search Criteria')
                + '</span>'
                + '<span data-action="save_filter">' 
                + self._parent.getText('menu_ok', 'OK')
                + '</span>'
                + '<span data-action="reset_filter">' 
                + self._parent.getText('cf_reset', 'Reset')
                + '</span>'
                + '<span data-action="cancel">' 
                + self._parent.getText('cancel', 'Cancel')
                + '</span>'
            + '</div>'
            + '<div class="filter_rule"></div>'
            + '<div class="ca_reference_selector"></div>'
            + '</div>';
        self._dom.div = jQuery(sHTML);
        self._dom.list = self._dom.div.find('.filter_list');
        self._dom.rule = self._dom.div.find('.filter_rule');
        self._dom.message = self._dom.div.find('.filter_message');
        self._dom.selector = self._dom.div.find('.ca_reference_selector');
        self._help = false;
		
    }
    
    
    self._initEvents = function() {
        self._dom.list
            .off('change.CA_calendar_filter click.CA_calendar_filter keyup.CA_calendar_filter')
            .on('change.CA_calendar_filter', 'select[name="field"]', function(evt){
                var el = jQuery(evt.target),
                    dRow = el.parents('div[data-filter]');
                dRow.find('select[name="oper"], *[name="value"]').parent().remove();
                dRow.data('field', el.val());
                jQuery(self._buildFilterValue(el.val())).insertAfter(el.parent());
            })
            .on('click.CA_calendar_filter', 'span.ca_datetime', function(evt){
                var spanEl = jQuery(evt.currentTarget),
                    el = spanEl.siblings('input'),
                    sType = el.data('type');
                self._parent._initView('calendar', function(){
                    var oView = self._parent._getView('calendar'),
                        mValue = Date.baseDate(el.val().replace(' ', 'T')).getTime();
                    if (mValue == 0 && el.val().split('-').length == 1 && el.val() != ''){
                        mValue = el.val();
                    }
                    var params = {
                        el  : spanEl,
                        evt : evt,
                        value : mValue,
                        select : function(dDate) {
                            var sDate = typeof(dDate) == 'string'
                                ? dDate
                                : dDate.format('yyyy-MM-dd' + (sType == 'DATETIME' ? ' hh:ii:ss' : ''));
                            el.val(sDate);
                            spanEl.text(sDate);
                        },
                        showTime    : sType == 'DATETIME',
                        showAM      : false,
                        showLiterals : true
                    }
                    if (oView != null) {
                        oView.show(params);
                    }
                });
            })
            .on('keyup.CA_calendar_filter', '.ca_filter_reference', function(evt) {
                self._referenceSelector(evt);
            })
            .on('click.CA_calendar_filter', '._reference', function(evt) {
                self._removeReference(evt);
            });
        self._dom.selector
            .off('click change')
            .on('click', '.list > a, .list > p', function(evt) {
                self._referenceSelectorSelect(evt);
            })
            .on('change', 'select', function() {
                self._dom.selector.data('page', 0);
                self._setFieldSelectedType();
                self._requestListFromServer();
            });
    }
    
    self._buildFilterContent = function(params) {
		
        var aFilter = params == undefined || params.filter === undefined 
            ? null 
            : (params.filter == null ? [] : params.filter),
            sRule = params == undefined || params.rule == undefined ? null : params.rule;
        if (typeof(aFilter) == 'string') {
            aFilter = self._parseStringFilter(aFilter);
        }
        self._dom.list.append(self._buildFilters(aFilter));
        self._dom.rule.append(self._buildRule(sRule));
    }
    
    self._set_filterAction = function(el) {
        self._parent.hidePopup();
    }
    
    self._cancelAction = function(el) {
        self._parent.hidePopup();
    }

    self._reset_filterAction = function(el) {
        self._nRules = 0;
        self._dom.list.html('');
        self._dom.rule.find('input').val('');
        return self._save_filterAction();
    }
    
    
    self._add_filterAction = function(el) {
		
        if (self._nRules >= 29) {
            return;
        }
        var aField = self._findDefaultField();
		
        self._dom.list.append(self._buildFilterRow({"name" : aField.name}));
        self._rebuildAdvancedFilter('add', self._nRules);
        if (self._bQuick) {
            self._parent.checkPopupVisiblility();
        }
		self._dom.div.find('.filter_list')[0].scrollTop = self._dom.div.find('.filter_list')[0].scrollHeight;
        
    }
    
    
    self._advanced_filterAction = function(el, evt) {
        var el = jQuery(evt.target);
        el.parent().children().toggleClass('off');
        if (el.is(':visible') && el.parent().find('input').val() == '') {
            self._rebuildAdvancedFilter('rebuild', 0);
        }
    }
    
    self._del_filterAction = function(el, evt) {
        var dRow = jQuery(evt.target).parent('div[data-filter]'),
            nDeleteNum = parseInt(dRow.data('filter'));
		
        dRow.siblings().each(function(){
            var dCheckRow = jQuery(this),
                nCheckNum = parseInt(dCheckRow.data('filter'));
            if (nCheckNum > nDeleteNum) {
				
                nCheckNum--;
                dCheckRow.data('filter', nCheckNum)
                    .children('span[data-rule]')
                        .text(nCheckNum)
                        .data('rule', nCheckNum);
            }
			
        });
        self._nRules--;
        dRow.remove();
        self._rebuildAdvancedFilter('del', nDeleteNum);
    }
    
    self._dynamic_filterAction = function(el, evt) {
        var dRow = jQuery(evt.target).parent('div[data-filter]');
        dRow.toggleClass('_dynamic');
    }
    
    
    self._save_filterAction = function() {
        self._dom.message.addClass('off');
        var aFilters = self._getFilters(),
            sRule = self._getRule();
        if (!aFilters) {
            return false;
        }
        if (self._sCalendarId != undefined) {
            if (self._dom.rule.children('.off').size() > 0) {}
            self._parent.layout.setCalendarFilter(self._sCalendarId, aFilters, sRule, function(mResult) {
                if (mResult === false) {
                    self._dom.message.removeClass('off')
                        .text(self._parent.getText('cf_some_wrong', 'Some filters condition are wrong. Please check.'));
                } else {
                    if (self._bQuick) {
                        self._parent.hidePopup();
                        self._parent.layout.refreshEvents();
                    }

                }
            });
        }
        return false;
    }
    
    self._show_external_referencesAction = function(el, evt) {
//        self._currentEditedRef = evt.data;
        var aField = self._getStructureField(evt.data.field);
        evt.data.external = true;
        if (self._dom.selector.parent('.CA_calendar_edit').size() < 1) {
            self._dom.selector.appendTo(evt.data.selectorDiv != undefined ? evt.data.selectorDiv : evt.data.parent);
        }
        self._showReferenceSelect(
            evt.data.input, 
            self._findReferences(aField, ''),
            aField.server,
            evt.data.input.val(), 
            evt.data
        );
    }
    
    self._show_referencesAction = function(el, evt) {
        var dRow = jQuery(evt.target).parents('[data-filter]'),
            sField = dRow.find('select[name="field"]').val(),
            aField = self._getStructureField(sField),
            aTextField = dRow.find('input[name="value_text"]');
//        if (aTextField.val() != '') {
////            aTextField.val(aTextField.val() + ',');
////            self._currentEditedRef = aTextField.val().split(',').length - 1;
////            String.setCaretToPos(aTextField[0], aTextField.val().length)
//        } else {
////            self._currentEditedRef = 0;
//        }
        if (self._dom.selector.parents('.CA_calendar_edit').size() > 0 && self._dom.selector.parent('.CA_calendar_edit').size() < 1) {
            self._dom.selector.appendTo(self._dom.selector.parents('.CA_calendar_edit'));
        } else if (self._dom.selector.parents('.CA_calendar_edit') < 1 && !self._dom.selector.parent().hasClass('.CA_calendar_filter')) {
            self._dom.selector.appendTo(self._dom.div);
        }
        self._showReferenceSelect(
            aTextField, 
            self._findReferences(aField, ''),
            aField.server,
            aTextField.val(),
            {}
        );
            
    }
    
    self._close_selectorAction = function(el, evt) {
        if (self._dom.selector == undefined || self._dom.selector.data('el') == undefined){
            return;
        }
        self._dom.selector.data('el').val('');
        self._dom.selector.removeClass('show');
    }
    
    self._key_selectorAction = function(el, evt){
        switch (evt.which ) {
            case 27 :
                self._close_selectorAction();
                break;
            case 38 :
            case 40 :
                self._referenceSelectorChange(evt.which == 38 ? -1 : 1);
                break;
            case 13 :
                self._referenceSelectorClick(evt);
        }
        
        
    }
    
    self._hide_helpAction = function(el, evt) {
        var oHelp = self._dom.div.find('.filter_help');
        self._help = !oHelp.hasClass('show');
        oHelp.toggleClass('show', self._help);
    }
    
    
    self._next_selectorAction = function(el, evt) {
        self._dom.selector.data('page', self._dom.selector.data('page') + 10);
        self._requestListFromServer();
    }
    
    self._prev_selectorAction = function(el, evt) {
        self._dom.selector.data('page', Math.max(self._dom.selector.data('page') - 10, 0));
        self._requestListFromServer();
    }
    
    self._new_comboAction = function(el, evt) {
        var oSelect = jQuery(evt.target).siblings('select'),
            sText = prompt("Please enter value", "Custom Combobox Value");
        
        if (sText != null && sText != "") {
            jQuery('<option class="custom_value" '
                + ' value="' + sText.htmlspecialchars() + '" '
                + ' title="' + sText.htmlspecialchars() + '" '
                + 'selected>' 
                + sText.htmlspecialchars() 
                + '</option>'
            ).prependTo(oSelect);
        }
    }
    
    self._buildFilterRow = function(aFilter) {
        var sField = aFilter.name == undefined ? '' : aFilter.name , 
            mOper = aFilter.oper == undefined ? '' : aFilter.oper , 
            mValue = aFilter.value == undefined ? '' : aFilter.value,
            sFilterText = aFilter.text == undefined ? '' : aFilter.text;
        if (sField != '' && mOper != '' && mValue == '') {
            var aFieldCheck = self._getStructureField(sField);
            if (aFieldCheck != undefined 
                && ['STRING', 'TEXT', 'TEXTAREA'].indexOf(aFieldCheck['type']) < 0
            ) {
                mValue = '***';
            }
        }
        sField = sField == undefined ? '' : sField.toLowerCase();
        self._nRules++;
        var aRefFilter = [
                'TEXT', 'STRING', 'URL', 'PHONE', 
                'EMAIL', 'DATE', 'DATETIME', 
                'PICKLIST', 'COMBOBOX', 'MULTIPICKLIST',
                'REFERENCE'
            ];
        var sHTML = '<div '
                + ' data-filter="' + self._nRules  + '" '
                + ' data-field="' + sField + '" '
                + (mValue == '***' ? ' class="_dynamic" ' : "")
            + '>'
            + '<span data-rule="' + self._nRules + '">' + self._nRules + '</span>'
            + '<div><select name="field">';
        var aFields = Array.objectValues(self._aStructure);
        for (var nI = 0; nI < aFields.length; nI++) {
            if (!self._checkVisibleField(aFields[nI])) {
                continue;
            }
            sHTML += '<option value="' + aFields[nI].name + '" '
                + (aFields[nI]['type'] == 'REFERENCE' && self._parent.params.showAdditionalFields
                    ? ' class="_ref" ' 
                    : ''
                )
                + (sField == aFields[nI].name ? ' selected ' : '')
                + '>'
                + aFields[nI].label.htmlspecialchars()
                + '</option>';
            if (aFields[nI].type == 'REFERENCE' && self._parent.params.showAdditionalFields){
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aFields[nI], aRefFilter, true, self._sObject);
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    sHTML += '<option value="' + aFields[nI].name + '.' + aRefFields[nJ]['name'] + '" '
                        + (sField == aFields[nI].name + '.' + aRefFields[nJ]['name'] ? ' selected ' : '')
                        + 'class="_sub_ref"'
                        + '>&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
                }
            }
        }
        sHTML += '</select></div>';
        if (sField != '') {
            sHTML += self._buildFilterValue(sField, mOper, mValue == '***' ? '' : mValue, sFilterText);
        }
        sHTML += '<span class="simple_button" data-action="del_filter">' 
                + self._parent.getText('cf_del', 'Del')
                + '</span>'
            + (self._bQuick ? '' : '<span class="simple_button" data-action="dynamic_filter">' 
            + self._parent.getText('cf_dyn', 'Dyn')
            + '</span>')
            + '</div>';
        return sHTML;
    }
    
    self._buildFilters = function(aFilters) {
        var sHTML = '';
        aFilters = aFilters == null || aFilters == undefined 
            ? self._parent._calendars.getCalendar(self._sCalendarId)['filters']
            : aFilters;
        if (aFilters == undefined || aFilters.length == 0) {
            return '';
        }
        for (var nI = 0; nI < aFilters.length; nI++) {
            if (self._getStructureField(aFilters[nI]['name']) != undefined) {
                sHTML += self._buildFilterRow(aFilters[nI]);
            }
        }
        return sHTML;
    }
    
    self._buildFilterValue = function(sField, mOper, mValue, sFilterText) {
        var aOpers = {
                "DATE" : {
                    "equal"     : self._parent.getText('cf_filter_equals', "equals"), 
                    "notEqual"  : self._parent.getText('cf_filter_not_equals', "not equal"), 
                    "lessThan"  : self._parent.getText('cf_filter_less', "less than"),
                    "lessOrEqual"       : self._parent.getText('cf_filter_less_equal', "less or equal"), 
                    "greaterOrEqual"    : self._parent.getText('cf_filter_greater_equal', "greater or equal"),
                    "greaterThan"       : self._parent.getText('cf_filter_greater', "greater than")
                },
                "SIMPLE" : {
                    "equal"     : self._parent.getText('cf_filter_equals', "equals"), 
                    "notEqual"  : self._parent.getText('cf_filter_not_equals', "not equal")
                },
                "TEXT" : {
                    "equal"     : self._parent.getText('cf_filter_equals', "equals"), 
                    "notEqual"  : self._parent.getText('cf_filter_not_equals', "not equal"), 
                    "contains"  : self._parent.getText('cf_filter_contains', "contains"),
                    "notContain" : self._parent.getText('cf_filter_not_contains', "not contain"), 
                    "includes"  : self._parent.getText('cf_filter_includes', "includes"),
                    "excludes"  : self._parent.getText('cf_filter_excludes', "excludes"), 
                    "startsWith" : self._parent.getText('cf_filter_start_with', "starts with")
                },
                "PICKLIST" : {
                    "equal"     : self._parent.getText('cf_filter_equals', "equals"), 
                    "notEqual"  : self._parent.getText('cf_filter_not_equals', "not equal"),  
                    "includes"  : self._parent.getText('cf_filter_includes', "includes"), 
                    "excludes"  : self._parent.getText('cf_filter_excludes', "excludes")
//                    "contains" : "contains", "startsWith" : "starts with"
                    
                },
                "COMBOBOX" : {
                    "equal"     : self._parent.getText('cf_filter_equals', "equals"), 
                    "notEqual"  : self._parent.getText('cf_filter_not_equals', "not equal"),  
                    "includes"  : self._parent.getText('cf_filter_includes', "includes"), 
                    "excludes"  : self._parent.getText('cf_filter_excludes', "excludes"),
                    "contains"  : self._parent.getText('cf_filter_contains', "contains"), 
                    "notContain" : self._parent.getText('cf_filter_not_contains', "not contain"), 
                    "startsWith" : self._parent.getText('cf_filter_start_with', "starts with")
                }
            },
            sHTML = '<div><select name=oper>';
        
//        console.log(sField, self._sObject);
        var aField = self._getStructureField(sField);
        if (aField == undefined || aField == null) {
            return '';
        }
        switch (aField['type']) {
            case 'DATE' :
            case 'DATETIME' :
            case 'INTEGER' :
            case 'DOUBLE' :
            case 'PERCENT' :
            case 'CURRENCY' :
                sHTML += self._buildOptions(aOpers['DATE'], mOper);
                break;
            case 'REFERENCE' :
            case 'PICKLIST' :
//            case 'COMBOBOX' :
            case 'MULTIPICKLIST' :
                sHTML += self._buildOptions(aOpers['PICKLIST'], mOper);
                break;
            case 'COMBOBOX' :
                sHTML += self._buildOptions(aOpers['COMBOBOX'], mOper);
                break;
            case 'TEXTAREA' :
            case 'STRING' :
            case 'PHONE' :
            case 'URL' :
            case 'EMAIL' :
                sHTML += self._buildOptions(aOpers['TEXT'], mOper);
                break;
            case 'BOOLEAN' :
            default :
                sHTML += self._buildOptions(aOpers['SIMPLE'], mOper);
                break;
        }
        sHTML += '</select></div>'
            + '<div class="_filter_value"><b></b>';
        
        switch (aField['type']) {
            case 'DATE' :
            case 'DATETIME' :
                sHTML += self._fieldDate(aField, mValue);
                break;
            case 'BOOLEAN'  :
                sHTML += self._fieldBoolean(aField, mValue);
                break;
            case 'TEXT' :
            case 'TEXTAREA' :
            case 'STRING'   :
            case 'PHONE'    :
            case 'URL'      :
            case 'EMAIL'    :
                sHTML += self._fieldText(aField, mValue);
                break;
            case 'PERCENT'  :
            case 'DOUBLE'   :
            case 'CURRENCY' :
            case 'INTEGER'  :
                sHTML += self._fieldNumber(aField, mValue);
                break;
            case 'PICKLIST'         :
            case 'COMBOBOX'         :
            case 'MULTIPICKLIST'    :
                sHTML += self._fieldMultiSelect(aField, mValue);
                break;
            case 'REFERENCE'        :
                sHTML += self._fieldReference(aField, mValue, sFilterText);
                break;
        }
        sHTML += '</div>';
        return sHTML;
    }
    
    
    self._buildOptions = function(aList, mValue) {
        var aKeys = Array.objectKeys(aList), 
            sHTML = '';
        for (var nI = 0; nI < aKeys.length; nI++) {
            sHTML += '<option value="' + aKeys[nI].htmlspecialchars() + '" '
                + (mValue != undefined && mValue == aKeys[nI] ? " selected " : "")
                + '>'
                + aList[aKeys[nI]].htmlspecialchars()
                + '</option>';
        }
        return sHTML;
    }
    
    
    self._fieldDate = function(aField, mValue) {
        var sHTML = '<input '
            //+ ' class="ca_datetime" '
            + ' type="hidden" '
            + ' name="value" '
            + ' data-type="' + aField['type'] + '" '
            + ' value="' + (mValue != undefined ? mValue : "").htmlspecialchars() + '" '
            + '><span class="ca_datetime">' + (mValue != undefined ? mValue : "").htmlspecialchars() + '</span>';
        
        return sHTML;
    }
    
    
    self._fieldNumber = function(aField, mValue) {
        var aHTML5Fields = {
            "INTEGER"   : 1,
            "DOUBLE"    : 0.01,
            "PERCENT"   : 0.1,
            "CURRENCY"  : 0.01
        }
        var sHTML = '<input  '
            + ' type="number" '
            + ' name="value" '
            + ' value="' + (mValue != undefined ? mValue : "").htmlspecialchars() + '" '
            + ' step="' + aHTML5Fields[aField['type']] + '"'
        sHTML += '>';
        return sHTML;
    }
    
    self._fieldText = function(aField, mValue) {
        var sHTML = '<input '
                + ' type="text" '
                + ' name="value" '
                + ' value="' + (mValue != undefined ? mValue : "").htmlspecialchars() + '" '
                + '>';
        return sHTML;
    }
    
    self._fieldBoolean = function(aField, mValue) {
         var sHTML = '<input '
                + 'name="value" '
                + 'type="checkbox" '
                + (mValue == true || mValue == 'on' ? ' checked ' : "")  
                + ' />';
        return sHTML;	
    }
    
    self._fieldMultiSelect = function(aField, mValue) {
        
        var sHTML = '<select '
            + 'name="value" '
            + "multiple" 
            + ">",
            bSelected,
            bCombo = aField.type == 'COMBOBOX',
            aSelectedOptions = [],
            sOptionsHTML = '',
            sOptKey, sOptLabel;
        if (typeof(mValue) == 'string' && mValue != '') {
            mValue = (mValue[0] == '[') ? JSON.parse(mValue) : mValue.split(',');
//            mValue = mValue.split(',');
            mValue = mValue.map(String.trim).map(function(sVal){
                return sVal.toLowerCase()
            });
        }
        
        if (typeof(aField.options) != undefined && aField.options.length > 0){
            for(var i = 0; i < aField.options.length; i++) {
                if (aField.options[i].name == undefined) {
                    aField.options[i].name = aField.options[i].value ;
                }
                sOptKey = aField.options[i].key != undefined ? aField.options[i].key : aField.options[i].value;
                sOptLabel = aField.options[i].value != undefined ? aField.options[i].value : aField.options[i].name;
                
                bSelected = (jQuery.isArray(mValue) &&  mValue.indexOf(aField.options[i].value.toLowerCase()) != -1)
                        || typeof(mValue) == 'string' && aField.options[i].value.toLowerCase() == mValue
                        || (jQuery.isArray(mValue) &&  mValue.indexOf(sOptKey.toLowerCase()) != -1)
                        || typeof(mValue) == 'string' && sOptKey.toLowerCase() == mValue;
                if (bSelected) {
                    aSelectedOptions.push(sOptKey.toLowerCase());
                }
                
                sOptionsHTML += '<option '
                    + ' value="' + sOptKey.htmlspecialchars() + '" '
                    + ' title="' + sOptLabel.htmlspecialchars() + '" '
                    + (bSelected ? " selected " : "")
                    + '>' 
                    + sOptLabel.htmlspecialchars() 
                    + '</option>';
            }
        }
        if (bCombo) {
            var sComboHTML = '',
                aNonOptiopns = mValue != undefined && jQuery.isArray(mValue)? mValue.diff(aSelectedOptions) : [];
            if (aNonOptiopns.length > 0) {
                for (var nI = 0; nI < aNonOptiopns.length; nI++) {
                    sComboHTML += '<option '
                        + 'title="' + aNonOptiopns[nI].htmlspecialchars() + '" '
                        + 'value="' + aNonOptiopns[nI].htmlspecialchars() + '" '
                        + ' class="custom_value" selected>' 
                        + aNonOptiopns[nI].htmlspecialchars();
                }
            }
            sOptionsHTML = sComboHTML + sOptionsHTML;
        }
        sHTML += sOptionsHTML + '</select>';
        if (bCombo) {
            sHTML += '<br><a data-action="new_combo" class="small_button" title="' 
                    + self._parent.getText('cf_add_combo_val', 'Add custom combobox value')
                    + '">' 
                    + self._parent.getText('add', 'Add')
                    + '</a>';
        }
        return sHTML;
    }
    
    
    self._fieldReference = function(aField, mValue, sFilterText) {
        var mRealValue = jQuery.isArray(mValue) ? mValue.join(',') : mValue;
        sFilterText = sFilterText == undefined ? '' : sFilterText;
        var aVariants = sFilterText.split('|||'), 
            aIDs = mRealValue != undefined && mRealValue != '' ? mRealValue.split(',') : [],
            sHTML = '';
        
        for (var nI = 0; nI < aVariants.length; nI++) {
            if (jQuery.trim(aVariants[nI]) == '' || aIDs[nI] == undefined || jQuery.trim(aIDs[nI]) == '') {
                aVariants.splice(nI, 1);
                continue;
            }
            sHTML += '<span title="' + aVariants[nI].htmlspecialchars() + '" '
                + 'class="_reference" data-id="' + aIDs[nI] + '">' 
                + aVariants[nI].htmlspecialchars() 
                + '</span>';
        }
        
        sHTML += 
            '<input type=text class="ca_filter_reference"'
            + ' name="value_text" '
            + " value= ''"
            + " placeholder='" + self._parent.getText('message_type_to_search', 'Type to search') + "'" 
            + ' autocomplete="off" '
            + ">"
            + '<input type=hidden '
            + 'name="value" '
            + "value='" + (mRealValue != undefined ? mRealValue : '').htmlspecialchars() + "'" 
            + ">"
            + '<span class="simple_button" data-action="show_references">&gt;</span>'
            ;
        return sHTML;
    }
    
    self._buildRule = function(sRule) {
		
        sRule = sRule == null || sRule == undefined 
            ? self._parent._calendars.getCalendar(self._sCalendarId)['rule']
            : sRule;
	    
        return ''
            + '<a data-action="advanced_filter" class="' 
                + (sRule != undefined && sRule != '' ? '' : 'off') 
                + '">' 
                + self._parent.getText('cf_adv_filter_rule', 'Advanced Filter Rule')
                + '</a>'
            + '<div class="' + (sRule != undefined && sRule != '' ? '' : 'off')  + '">'
                + '<input type=text value="' + (sRule != undefined ? sRule : '').htmlspecialchars() + '" >'
            + '</div>';
    }
    
//    self._findCurrentItem = function(el) {
//        var sTextContent = el.val(),
//            aItems = sTextContent.split(','),
//            nCurrentPosition = String.getCaret(el[0]),
//            nTmp = 0;
//        for (var nI = 0; nI < aItems.length; nI++) {
//            if (nTmp + aItems[nI].length >= nCurrentPosition) {
////                self._currentEditedRef = nI;
//                return jQuery.trim(aItems[nI]);
//            }
//            nTmp += aItems[nI].length + 1;
//        }
//        return '';
//    }
    
    self._referenceSelector = function(evt) {
        if (self._nKeyTimer != null) {
            clearTimeout(self._nKeyTimer);
            self._nKeyTimer = null;
        }
        
        var el = jQuery(evt.currentTarget);
//            oRow = el.parents('div[data-filter]'),
//            sLast = el.val(),
//            aField = el.data('field');
//        console.log(aField);
        switch (evt.which ) {
            case 27 :
                self._close_selectorAction();
                break;
            case 38 :
            case 40 :
                self._referenceSelectorChange(evt.which == 38 ? -1 : 1);
                break;
            case 13 :
                self._referenceSelectorClick(evt);

        }
        if ((evt.which <= 48 || evt.which >= 91) && evt.which != 8 && evt.which != 46) {
            return;
        }
        self._nKeyTimer = setTimeout(function(){
            self._show_referencesAction(el, evt);
        }, 200);
        
//        
//        if (aField == undefined) {
//            var sField = el.parents('div[data-filter]').find('select[name="field"]').val();
//            aField = self._getStructureField(sField);
//            el.data('field', aField);
//        }
//        oRow.data('field', aField.name).attr('data-field', aField.name);
//        var aResult = self._findReferences(aField, sLast);
//        self._showReferenceSelect(el, aResult, aField.server, sLast);
        
    }
    
    self._removeReference = function(evt) {
        
        var el = jQuery(evt.target),
            oIds = el.siblings('input[name="value"]');
        
        
        oIds.val(oIds.val().replace(',' + el.data('id'), ''));
        el.remove();
    }
    
    self._findReferences = function(aField, sText) {
        var aResult = [];
        for (var nI = 0; nI < aField.options.length; nI++) {
            aField.server = true;
            var aNames = aField.options[nI].name != undefined 
                    ? aField.options[nI].name.split('|')
                    : [],
                aIds = aField.options[nI].id != undefined 
                    ? aField.options[nI].id.split('|')
                    : [];
            if (aField.options[nI].server === true || aNames.length < 1 || aIds.length < 1) {
                aField.options[nI].server = true;
                aField.server = true;
                continue;
            }
            for (var nJ = 0; nJ < aNames.length; nJ++) {
                if (sText == undefined || sText == '' || aNames[nJ].indexOf(sText) >= 0) {
                    aResult.push({"id" : aIds[nJ], "name" : aNames[nJ]});
                }
            }
        }
        return aResult;
    }
    
    
    
    self._showReferenceSelect = function(el, aList, bNeedRemote, sText, aParams) {
        aParams = aParams || {};
        var sField = aParams.field !== undefined ? aParams.field : el.parents('[data-field]').find('select[name="field"]').val(),
            aField = self._getStructureField(sField),
            sSelectType = self._getFieldSelectedType(sField);
        if (self._dom.selector.hasClass('show') && self._dom.selector.data('field') === sField){
            self._dom.selector.data('page', 0).data('text', sText);
            self._requestListFromServer(sField, sText);
            return;
        }
        
        var sHTML = '<div class="remote">'
                        + '<span data-action="prev_selector" class="simple_button _off" title="' 
                        + self._parent.getText('previous', 'Previous')
                        + '">&lt;</span>'
                        + '<span data-action="next_selector" class="simple_button _off" title="' 
                        + self._parent.getText('next', 'Next')
                        + '">&gt;</span>'
                        + '<select class="type_selector" title="' 
                        + self._parent.getText('message_select_type_of_object', 'Select type of object')
                        + '"></select>'
                    + '</div>'
                    + '<span data-action="close_selector" class="close_selector">X</span>'
                    + '<div class=list>' +  self._buildSelectorList(aList) + '</div>';
        
        var aOffset = el.offset(), 
            oPopupOffset = el.parents('.CA_calendar_filter, .on').eq(0).offset();
//        aOffset.left -= parseInt(oPopupOffset.left) + 2;
//        aOffset.top -= parseInt(oPopupOffset.top) - 2 - el[0].offsetHeight;
        aOffset.left -= 2;
        aOffset.top +=  2 + el[0].offsetHeight;
//        if (aOffset.top < 0) {
//            aOffset.top = 0;
//        }
        
        self._dom.selector
            .html(sHTML)
            .css(aOffset)
            .addClass('show')
            .data('text', sText)
            .data('page', 0)
            .data('field', sField)
            .data('el', el)
            .data('params', aParams);
        if (aField.options.length > 1) {
            sHTML = '<option value="000">All</option>';
            for (var nI = 0; nI < aField.options.length; nI++) {
                sHTML += '<option value="' 
                        + (aField.options[nI].key != null && aField.options[nI].key != '' 
                            ? aField.options[nI].key
                            : aField.options[nI].name
                        ).htmlspecialchars()
                        + '" '
                    + (sSelectType == aField.options[nI].key || aField.options[nI].name == sSelectType
                        ? 'selected ' 
                        : ''
                    )
                    + '>' 
                    + aField.options[nI].value.htmlspecialchars()
            }
            self._dom.selector.find('select').html(sHTML).addClass('on');
        }            
        self._requestListFromServer(sField, sText);
    }
    
    self._referenceSelectorSelect = function(evt) {
        var el = jQuery(evt.currentTarget);
        if (el.data('id') == undefined) {
            return;
        }
        if (self._dom.selector.data('params') != undefined 
                && self._dom.selector.data('params').onselect != undefined) {
            self._close_selectorAction();
            self._dom.selector.data('params').onselect(el[0].tagName == 'A' ? el.text() : el.children('a').text(), el.data('id'));
            
        } else {
            self._setReferencePosition(el[0].tagName == 'A' ? el.text() : el.children('a').text(), el.data('id'));
        }
    }
    
    self._setReferencePosition = function(sText, sId, oInput, nPos) {
        var el = self._dom.selector.data('el'),
            oDiv = el.parent();
        jQuery(
            '<span class="_reference" data-id="' + sId + '" title="' + sText.htmlspecialchars() + '">' 
            + sText.htmlspecialchars() 
            + '</span>'
        ).insertBefore(el);
        oDiv.find('input[name="value"]').val(oDiv.find('input[name="value"]').val()  + "," + sId);
        self._close_selectorAction();
    }
    
//    self._getReferencePosition = function(nPos, oInput) {
//        nPos = nPos || self._currentEditedRef;
//        oInput = oInput || self._dom.selector.data('el');
//        var oDiv = oInput.parents('div[data-filter]'),
//            oValueBox = oDiv.find('input[name="value"]').parent(),
//            aIds = oValueBox.children('input[name="value"]').val().split(',');
//        if (aIds[nPos] != undefined && jQuery.trim(aIds[nPos]) != '') {
//            return aIds[nPos];
//        }
//        return false;
//    }
    
    self._rebuildAdvancedFilter = function(sOper, nId) {
        var oText = self._dom.rule.find('input'),
            sText = oText.val();
        if (sOper == 'add'){
			
            if (sText == '' && nId > 0){
			    self._rebuildAdvancedFilter('rebuild');
                sText = oText.val();
            } 
			else{
				sText = (sText == '' ? nId : '(' + sText + ') AND ' + nId);
            }
        } 
		else if (sOper == 'del' && self._nRules == 0){
			
            sText = '';
        }
		else if (sOper == 'del' ) {
            var sReplaceText = sText.replace(/([0-9]+)/gi, '!$1!');
            var aRules = [
                ["\\s*(and|or)\\s*!" + nId + '!', ''], 
                ['\\(\\s*!' + nId + '!\\s*\\)', ''],
                ['^\\s*!' + nId + '!\\s*(and|or)\\s*', ''],
                ['\\(\\s*!' + nId + '!\\s*(and|or)\\s*', '('],
                ['\\(\\s*(and|or)\\s*', '('],
                ['\\s*\\(\\s*\\)\\s*', ''],
                ['^\\s*(and|or)\\s*', '']
            ];
			
            var sChangedText;
            do {
                sChangedText = sReplaceText
                for (var nPattern = 0; nPattern < aRules.length; nPattern++) 
				{
                    var oParrent = new RegExp(aRules[nPattern][0], 'gi');
                    sReplaceText = sReplaceText.replace(oParrent, aRules[nPattern][1]);
                }
            } while (sReplaceText != sChangedText);
            
         
			var sReplaceTextCopy = sReplaceText.trim(),
			    aOpenBracesIndex=[],
			    aClosedBracesIndex=[],
			    aCharactersToRemove=[];
		   
		    for(var nI=0; nI<= sReplaceTextCopy.trim().length; nI++){
			   if(sReplaceTextCopy[nI] == '(') {
				   aOpenBracesIndex.push(nI);
			   }  
			   else if(sReplaceTextCopy[nI] == ')') {
				   aClosedBracesIndex.push(nI);  
			   }
		    }
			
			aOpenBracesIndex.reverse();
			
			for(var nI=sReplaceTextCopy.trim().length; nI >= 0; nI--) {
				if(sReplaceTextCopy[nI] == ')' && sReplaceTextCopy[nI-1] == ')') {
					aCharactersToRemove.push(nI);
				}
			}
			
            
			var oCloseToOpenBracesIndex = {}, oOpenToCloseBracesIndex = {},sStr;
			if(aOpenBracesIndex.length == aClosedBracesIndex.length)
			{
				for(var nI; nI<aOpenBracesIndex.length; nI++)
				{
					oCloseToOpenBracesIndex[aClosedBracesIndex[nI]] = aOpenBracesIndex[nI];
					oOpenToCloseBracesIndex[aOpenBracesIndex[nI]] = aClosedBracesIndex[nI];
				}
			}
			
			for(var nI=0; nI<sReplaceTextCopy.trim().length; nI++) {
				for(var nJ=0; nJ<aCharactersToRemove.length; nJ++) {
					if(nI == aCharactersToRemove[nJ]) {
						sStr = sReplaceTextCopy.substring(0, oCloseToOpenBracesIndex[nI]) + '$' + sReplaceTextCopy.substring(oCloseToOpenBracesIndex[nI] + 1);
						sStr= sStr.substring(0, oOpenToCloseBracesIndex[oCloseToOpenBracesIndex[nI]]) + '$' + sStr.substring(oOpenToCloseBracesIndex[oCloseToOpenBracesIndex[nI]] + 1);
					}
				}	
			}
			
			if(typeof sStr != 'undefined') {
				sStr = sStr.replace(/\$/g, '');
				sReplaceText = sStr;
			}
		
			for (var nI = nId + 1; nI <= self._nRules + 1; nI++) {
                sReplaceText = sReplaceText.replace('!' + nI + '!', '!' + (nI - 1) + '!');
//                console.log(nI, sReplaceText);
            }
			
            sText = sReplaceText.replace(/\!([0-9]+)\!/gi, '$1');
        } 
		else if (sOper == 'rebuild') {
            sText = '';
            for (var nJ = 1; nJ <= self._nRules; nJ++) {
                sText += (sText != '' ? ' AND ' : '') + (nJ);
            }
        }
		
        oText.val(sText);
		var sRecheckValue = sText, 
		    sFirst,
		    sSecond;
		for(var nI=0; nI<sRecheckValue.trim().length; nI++) {
			sFirst = sRecheckValue[0];
			sSecond = sRecheckValue[sRecheckValue.length-1];
		}
		
		if(sFirst == '(' && sSecond ==')') {
			sRecheckValue = sRecheckValue.trim().substring(1, sRecheckValue.length-1);
		}
		oText.val(sRecheckValue);
		
    }
    
    self._checkVisibleField = function(aField) {
        if (aField.type == 'ID' || aField.type == 'BASE64') {
            return false;
        }
        if (
            aField.type == 'REFERENCE' 
            && 
            (aField.options == undefined || aField.options == null)
        ) {
            return false;
        }
        return true;
    }
    
    self._requestListFromServer = function(sField, sText) {
        if (self._nTimer != null) {
            clearTimeout(self._nTimer);
            self._nTimer = null;
        }
        sField = sField != undefined ? sField : self._dom.selector.data('field');
        sText = sText != undefined ? sText : self._dom.selector.data('text');
        var nPage = self._dom.selector.data('page') == undefined ? 0 : self._dom.selector.data('page'),
            sObj = self._dom.selector.find('select').size() > 0 ? self._dom.selector.find('select').val() : '',
            sBaseObject = self._sObject,
            sBaseField = sField;
        
        var aField = self._getStructureField(sField);
        if (sObj == null || sObj ==  '' ) {
            sObj = aField.options[0].key != null ? aField.options[0].key : aField.options[0].name;
        }
        if (sField.indexOf('.') >= 0) {
            var aBaseField = self._getStructureField(sField.split('.')[0]);
            sBaseObject = aBaseField.options[0].name;
            sBaseField = sField.split('.')[1];
            if (sBaseField == 'userroleid') {
                sBaseObject = 'user';
            }
        }
        if (aField.server === true) {
            
            self._nTimer = setTimeout(function(){
                self._nOptionCounter++;
                var nCurrentCounter = self._nOptionCounter;
                self._parent._objects.getFieldOptions(
                    {
                        cid     : self._sCalendarId,
                        fid     : sBaseField,
                        text    : sText,
                        page    : nPage,
                        obj     : sObj,
                        hm      : 10,
                        fobj    : sBaseObject
                        
                    },
                    function(aList, aPagesOption){
                        if (nCurrentCounter != self._nOptionCounter) {
                            return;
                        }
                        if (aList == undefined) {
                            aList = [];
                        }
                        
                        if (nPage == 0 
                                && self._dom.selector.data('params') != undefined 
                                && self._dom.selector.data('params').additionOptions != undefined
                                && self._dom.selector.data('params').additionOptions.length > 0
                        ) {
                            aList = self._dom.selector.data('params').additionOptions.concat(aList);
                        }
                        self._bRefColumns = aPagesOption.columns === true;
                        self._buildSelectorByText(sField, sText, aList);
                        self._dom.selector.find('[data-action="next_selector"]').toggleClass('_off', aPagesOption.next !== true);
                        self._dom.selector.find('[data-action="prev_selector"]').toggleClass('_off', aPagesOption.prev !== true);
                        self._checkSelectorPosition();
                    }
                );
            }
            , 200);
        } else {
            self._buildSelectorByText(sField, sText);
        }
        
    }
    
    self._checkSelectorPosition = function() {
        return;
        if (self._dom.selector == undefined) {
            return;
        }
        var oParent = self._parent._dom.el,
            nParentTop = oParent.offset().top,
            nParentBottom = nParentTop + oParent[0].offsetHeight,
            nGlobalTop = self._dom.selector.offset().top,
            nTop = self._dom.selector.position().top,
            nChange = 0;
            
        if (nGlobalTop + self._dom.selector[0].offsetHeight > nParentBottom) {
            nChange = nTop - (self._dom.selector.data('el').position().top - self._dom.selector[0].offsetHeight);
            if (nGlobalTop - nChange < nParentTop) {
                nChange = nParentTop - (nGlobalTop - nChange);
            }
            self._dom.selector.css('top', nTop - nChange);
        }
    }
    
    
    self._buildSelectorByText = function(sField, sText, aAddList) {
        var aList = self._findReferences(self._getStructureField(sField), sText);
        if (aAddList != undefined && aAddList.length > 0) {
            aList = aAddList;
        }
        aList.sort(function(a, b){
            return a.name > b.name;
        });
        self._dom.selector.find('.list').html(self._buildSelectorList(aList));
    }
    
    self._buildSelectorList = function(aList) {
        var sHTML = "", sColumns, sId;
        if (!self._bRefColumns) {
            for (var nI = 0; nI <  aList.length; nI++) {
                sId = aList[nI].id  || aList[nI].value || aList[nI].key;
                sHTML += '<a data-id="' 
                        + sId 
                        + '" '
                    + '>'
                    + (aList[nI].name != 'null' ? aList[nI].name : sId).htmlspecialchars()
                    + '</a>';
            }
        } else {
            sHTML += '<p><b>' 
                    + self._parent.getText('create_user', 'User')
                    + '</b><b>' 
                    + self._parent.getText('create_role', 'Role')
                    + '</b></p>';
            for (var nI = 0; nI <  aList.length; nI++) {
                sId = aList[nI].id  || aList[nI].value || aList[nI].key;
                sColumns = aList[nI].columns != null && aList[nI].columns != ''
                    ? aList[nI].columns
                    : '';
                sColumns = sColumns.split('::').map(String.htmlspecialchars).join('</span><span>');
                sHTML += '<p data-id="' + sId + '" ><a '
                    + '>'
                    + (aList[nI].name != 'null' ? aList[nI].name : sId).htmlspecialchars()
                    + '</a>'
                    + '<span>' + sColumns + '</span>'
                    + '</p>';
            }
        }
        return sHTML;
    }
    
    
    self._referenceSelectorChange = function(nDir) {
        var aSelected = self._dom.selector.find('.list').find('.sel');
        if (aSelected.size() < 1) {
            self._dom.selector.find('.list').children(':first-child').addClass('sel');
        } else {
            var aNewSelected = (nDir > 0 ? aSelected.next() : aSelected.prev());
            if (aNewSelected.size() > 0) {
                aSelected.removeClass('sel');
                aNewSelected.addClass('sel');
            }
        }
    }
    
    self._referenceSelectorClick = function(evt) {
        var aSelected = self._dom.selector.find('.list').find('.sel');
        if (aSelected.size() < 1) {
            aSelected = self._dom.selector.find('.list').children(':first-child');
        }
        if (aSelected.size() > 0) {
            aSelected.trigger('click');
        }
    }
    
    self._checkClose = function() {
        self._dom.selector.removeClass('show');
        
    }
    
    
    self._checkString = function(oRow, mValue) {
        var sOper = oRow.find('select[name="oper"]').val();
        if (sOper != 'equal' || sOper != 'notEqual') {
            return false;
        }
        return true;
    }
    
    self._checkText = function(oRow, mValue) {
        return self._checkString(oRow, mValue);
    }
    
    self._checkTextarea = function(oRow, mValue) {
        return self._checkString(oRow, mValue);
    }
    
    self._getFieldBoolean = function(aRow) {
        var oInput = aRow.find('input[name="value"]'),
            mVal = oInput.is(':checked') ? 'on' : 'off';
        return [mVal, ""];
    }
    
    self._getFieldReference = function(aRow) {
        var aID = [], aText = [];
        aRow.find('span._reference').each(function(){
            var el = jQuery(this);
            aID.push(el.data('id'));
            aText.push(el.text());
        });
        return [aID.join(','), aText.join('|||')];
    }
    
    self._rebuildStructure = function(aStructure) {
        var aReturn = {};
        jQuery.each(aStructure, function(sKey, oObj){
            aReturn[sKey] = jQuery.extend({}, oObj, {Label : oObj.label, Name : oObj.name});
        });
        return aReturn;
    }
    
    self._findDefaultField = function() {
        var aResult = null;
        jQuery.each(self._aStructure, function(sKey, aEl) {
            if (self._checkVisibleField(aEl)) {
                aResult = aEl;
                return false;
            }
        });
        return aResult;
        
    }
    
    self._getFilters = function(bPostMode) {
        var aFilters = [], bCorrect = true;
        self._dom.list.children('._error').removeClass('_error');
        self._dom.list.children().each(function(){
            var dRow = jQuery(this),
                dValue = (!self._bQuick && dRow.hasClass('_dynamic') 
                    ? null 
                    : dRow.find('input[name="value"], select[name="value"]')),
                mValue = dValue == null ? '***' : dValue.val(),
                sFieldName = dRow.find('select[name="field"]').val(),
                aField = self._getStructureField(sFieldName),
                sVal = '',
                sText = '';
            if ((
                    (mValue == null || mValue == '') 
                    && 
                    (
                        typeof(self['_check' + aField['type'].capitalize()]) == 'function'
                        ? self['_check' + aField['type'].capitalize()](dRow, mValue)
                        : true
                    )
                )
                || 
                (dValue != null && dValue.filter('select').size() > 0 && mValue.length < 1)
            ) {
                dRow.addClass('_error');
                dValue.focus();
                self._dom.message.removeClass('off').text('Please check filter condition');
                bCorrect = false;
                return false;
            }
            if (!self._bQuick && mValue == '***') {
                sVal = '***';
                sText = '***';
            } else if (typeof(self['_getField' + aField['type'].capitalize()]) == 'function') {
                var aResult = self['_getField' + aField['type'].capitalize()].call(this, dRow);
                sVal = aResult[0];
                sText = aResult[1];
            } else {
                sVal = dRow.find('input[name="value"], select[name="value"]').val();
            }
            aFilters.push({
                "name" : sFieldName,
                "oper" : dRow.find('select[name="oper"]').val(),
                "value" : sVal,
                "text"  : sText
            });
        });
        if (!bCorrect) {
            return false;
        }
        if (bPostMode) {
            for (var nI = 0; nI < aFilters.length; nI++) {
                var aField = self._getStructureField(aFilters[nI].name),
//                        mValue = aFilters[nI].value;
                    mValue = jQuery.isArray(aFilters[nI].value) ? JSON.stringify(aFilters[nI].value) : aFilters[nI].value;
                aFilters[nI] = aField['type']
                    + '___' 
                    + aFilters[nI].name 
                    + '___' 
                    + aFilters[nI].oper 
                    + '___' 
                    + (aFilters[nI].text != '' ? aFilters[nI].text : mValue) 
                    + '___' 
                    + (aFilters[nI].text != '' ? mValue : '');
            }
        }
        return aFilters;
    }
    
    self._setStructure = function(mData) {
        self._aStructure = {};
        var aTmp = jQuery.isArray(mData) ? [].concat(mData) : Array.objectValues(mData);
        aTmp.quickSort('label');
        for (var nI = 0; nI < aTmp.length; nI++) {
            self._aStructure[aTmp[nI].name] = aTmp[nI];
        }
    }
    
    
    self._getRule = function() {
        return self._dom.rule.children('.off').size() > 0 
                ? "" 
                : self._dom.rule.find('input').val();
    }
    
    self._parseStringFilter = function(sFilterStr) {
        return self._parent._calendars.parseStringFilter(sFilterStr);
    }
    
    self._getFieldSelectedType = function(sField) {
        var sCriteria = (self._sCalendarId == undefined || self._sCalendarId == '')
            ? self._sObject
            : self._sCalendarId;
        
        if (sCriteria == undefined || sCriteria == '') {
            return;
        }
        var aDefined = (typeof(localStorage)  == 'undefined'  || localStorage[sCriteria] == undefined)
            ? {}
            : jQuery.parseJSON(localStorage[sCriteria]);
        return typeof(aDefined[sField]) == 'undefined' ? '' : aDefined[sField];
    }
    
    self._setFieldSelectedType = function(sField, sType) { 
        var sCriteria = (self._sCalendarId == undefined || self._sCalendarId == '')
            ? self._sObject
            : self._sCalendarId;
        
        if (sCriteria == undefined || sCriteria == '') {
            return;
        }
        sField = sField == undefined ? self._dom.selector.data('field') : sField;
        sType = sType == undefined ? self._dom.selector.find('select').val() : sType;
        var aDefined = (typeof(localStorage)  == 'undefined'  || localStorage[sCriteria] == undefined)
            ? {}
            : jQuery.parseJSON(localStorage[sCriteria]);
        aDefined[sField] = sType;
        if (typeof(localStorage)  != 'undefined' && JSON != undefined) {
            localStorage[sCriteria] = JSON.stringify(aDefined);
        }
    }
    
    self._getStructureField = function(sField) {
        var aField;
        if (sField.indexOf('.') >= 0) {
            aField = self._parent._objects.getObjectFieldByName(self._sObject, sField);
        } else {
            aField = self._aStructure[sField];
        }
        return aField;
    }
    
    jQuery.calendarAnything.appendView('calendarFilter', view);
    
})();
