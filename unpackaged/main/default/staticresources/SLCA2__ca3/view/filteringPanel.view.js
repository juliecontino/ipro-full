/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


(function(){
    var self = {
        _css        : '/css/filtering-panel.css',
        _parent     : null,
        _div        : null,
        _selector   : null,
        _message    : null,
        _oBlock     : null,
        _aFields    : null,
        _aSets      : null,
        _aAdminSets : null,
        _aCustomSets : null,
        _nKeyTimer  : null,
        _oFilterSets    : null,
        _bRefColumns    : false,
        _nOptionCounter : 0,
        _oEditedSet     : null,
        _bEmpty         : true,
        _aSelectedFilterSet : [],
        _displayParams  : null
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._div = div;
        self._parent = parent;
        self._parent.loadCss(self._css);
        self._parent.loadCss('/css/calendar-filter.css');
        self._aSelectedFilterSet = JSON.parse(self._parent.getLS('selectedFilterSets', '[]'));
    }
    
    view.show = function(params) {
        if (self._oBlock != undefined && params.block == undefined) {
            self._clearBlock();
        }
        self._oBlock = params.block;
        if (self._oFilterSets != undefined && params.filtersets == undefined) {
            self._clearBlockFilterSets();
        }
        self._displayParams = params.displayParams != undefined ? params.displayParams : self._displayParams;
        
        self._oFilterSets = params.filtersets;
        self._aFields = params.fields != undefined ? params.fields : self._aFields;
        self._aSets = self._aSets != null 
                && self._displayParams != null 
                && self._displayParams.addCustomFilterSet === true
                ? self._aSets
                : params.sets;
        self._aAdminSets = self._aAdminSets != null 
                && self._displayParams != null
                && self._displayParams.addGlobalFilterSet === true
                && params.adminSets == null
                ? self._aAdminSets
                : params.adminSets;                
        
        self._aSets = self._aSets != null 
            ? self._aSets.filter(function(el){
                return el.type == 'user';
            })
            : null;
        var aFilteredCustom = params.sets != undefined && params.sets != null 
            ? params.sets.filter(function(el){
                return el.type == 'custom';
            })
            : null;
        self._aCustomSets = aFilteredCustom != null && aFilteredCustom.length > 0
            ? aFilteredCustom
            : self._aCustomSets;
            
        self._aAdminSets = self._aAdminSets != null 
            ? self._aAdminSets.filter(function(el){
                return el.type == 'admin';
            })
            : null;
            
        self._bEmpty = true;
        
        if (self._oBlock != undefined) {
            self._parent._addQueue([function(){
                    self._checkFields();
                }, function(){
//                    if (self._aFields != null && self._aFields.length > 0) {
                        self._show(params);
//                    }
                }]
            );
        }
        
        self._clearForm();
        self._parent._events.setFilterPanel([]);
        if (self._oFilterSets != undefined) {
            self._buildFilterSets();
        }
        self._initInterface();
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            self['_' + sAction + 'Action'](el, evt);
        }
        return self._parent._cancelBubble(evt);
    }
    
    view.getReadyField = function(aField) {
        var sHTML = '';
        switch (aField['type']) {
            case 'DATE' :
            case 'DATETIME' :
                sHTML += self._fieldDate(aField);
                break;
            case 'BOOLEAN'  :
                sHTML += self._fieldBoolean(aField);
                break;
            case 'TEXT' :
            case 'TEXTAREA' :
            case 'STRING'   :
            case 'PHONE'    :
            case 'URL'      :
            case 'EMAIL'    :
                sHTML += self._fieldText(aField);
                break;
            case 'PERCENT'  :
            case 'DOUBLE'   :
            case 'CURRENCY' :
            case 'INTEGER'  :
                sHTML += self._fieldNumber(aField);
                break;
            case 'PICKLIST'         :
            case 'COMBOBOX'         :
            case 'MULTIPICKLIST'    :
                sHTML += self._fieldMultiSelect(aField);
                break;
            case 'REFERENCE'        :
                sHTML += self._fieldReference(aField);
                break;
        }
        return sHTML;
    }
    
    view.getFilterFieldValue = function(oFieldsBlock) {
        return self._getFilters(oFieldsBlock);
    }
    
    self._initInterface = function(){
        if (self._oBlock != undefined) {
            self._oBlock
            .off('.CA_FILTER')
            .on('click.CA_FILTER', '[data-action]', function(evt){
                var oEl = jQuery(evt.target);
                return view.action(oEl.data('action'), oEl, evt);
            })
            .on('click.CA_FILTER', '.ca_datetime', function(evt){
                var oEl = jQuery(evt.currentTarget),
                    sType = oEl.data('type');
                self._parent._initView('calendar', function(){
                    var oView = self._parent._getView('calendar'),
                        mValue = Date.baseDate(oEl.val()).getTime();
                    if (mValue == 0 && oEl.val().split('-').length == 1 && oEl.val() != '') {
                        mValue = oEl.val();
                    }
                    var params = {
                        el  : oEl,
                        evt : evt,
                        value : mValue,
                        select : function(dDate) {
                            var sDate = typeof(dDate) == 'string'
                                ? dDate
                                : dDate.format('yyyy-MM-dd' + (sType == 'DATETIME' ? ' hh:ii:ss' : ''));
                            oEl.val(sDate).trigger('change');
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
            .on('keyup.CA_FILTER', '.ca_filter_reference', function(evt){
                self._referenceSelector(evt);
            })
            .on('click.CA_FILTER', '._reference', function(evt){
                self._removeReference(evt);
            })
            .on('click.CA_FILTER', '.ca_reference_selector .list > a, .ca_reference_selector .list > p', function(evt){
                self._referenceSelectorSelect(evt);
            })
            .on('change.CA_FILTER', '.ca_reference_selector select', function(){
                self._selector.data('page', 0);
    //            self._setFieldSelectedType();
                self._requestListFromServer();
            })
            .on('change.CA_FILTER', 'select, input', function(evt){
                var aFilters = self._getFilters();
                self._bEmpty = aFilters.length < 1;
                self._oBlock.children('.ca_filtering_panel').toggleClass('_empty', self._bEmpty);
            });
        }
        if (self._oFilterSets != undefined && self._oFilterSets != null) {
            self._oFilterSets
                .off('.CA_FILTER')
                .on('click.CA_FILTER', '[data-action]', function(evt){
                    var oEl = jQuery(evt.currentTarget);
                    return view.action(oEl.data('action'), oEl, evt);
                })
        }
    }
    
    self._show = function(params) {
        
        var sHTML = self._buildHTML(params);
        self._oBlock.html(sHTML);
        self._selector = self._oBlock.find('.ca_reference_selector');
        self._message = self._oBlock.find('._message');
    }
    
    self._buildFilterSets = function(){
        var sHTML = '',
            bSelected = false,
            aFilters = [],
            aAllSets = []
                .concat(self._aAdminSets != null ? self._aAdminSets : [])
                .concat(self._aSets != null ? self._aSets : [])
                .concat(self._aCustomSets != null ? self._aCustomSets : []);
        aAllSets.quickSort('name');
        sHTML = '<i class="_message ' + (aAllSets == null || aAllSets.length < 1 ? '_show' : '') + '">' 
                    + 'You have no Filter Sets'
                    + '</i>';
        if (aAllSets != null && aAllSets.length > 0) {
            for (var nI = 0; nI < aAllSets.length; nI++) {
                bSelected = self._aSelectedFilterSet.indexOf(aAllSets[nI].id) >= 0;
                sHTML += self._buildSetItem(aAllSets[nI], bSelected);
                if (bSelected) {
                    aFilters = aFilters.concat(aAllSets[nI].criteria);
                }
            }
        }
        self._parent._events.setFilterPanel(aFilters);
        self._oFilterSets.find('.filtersets').html(sHTML);
    }
    
    self._buildSetItem = function(oSet, bChecked){
        var sHTML = '<span class="_filterset ' 
                    + (bChecked === true ? ' _sel ' : '')
                    + '" '
            + ' data-name="' + oSet.name.htmlspecialchars() + '" ' 
            + ' data-id="' + oSet.id + '" ' 
            + ' data-criteria=\'' + JSON.stringify(oSet.criteria) + "' "
            + ' data-type="' + (oSet.type != undefined ? oSet.type : 'user') + '"'
            + '  data-action="applyFilterSet"'
            + '>'
            + '<span class="checkbox"></span>'
            + '<span class="filterset_name">' + oSet.name.htmlspecialchars() + '</span>'
            + '<i data-action="detailFilterSet" title="Details"></i>'
            + '</span>';
        return sHTML;
    }
    
    self._checkFields = function(){
        var aFieldObjs = [];
        if (self._aFields != null) {
            for (var nJ = 0; nJ < self._aFields.length; nJ++) {
                var aTmp = self._aFields[nJ].split('|');
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
    }
    
    self._buildHTML = function(params) {
        var bEmpty = self._aFields == null || self._aFields.length < 1,
            sHTML = '<div class=title title="Filters"><span></span>Filter Panel</div>'
                + '<div class="ca_filtering_panel _empty">'
                + self._buildFields()
                + '<i class="_message ' + (bEmpty ? '_show' : '') + '">' 
                + (bEmpty ? 'No fields are selected for filtering. Please add some fields from Display Settings' : '') 
                + '</i>'
                + (!bEmpty 
                    ? '<span class="simple_buttons">'
                    + '<span data-action="ok" title="Apply selected filters from Filter Panel to all calendars">Apply</span>'
                    + '<span data-action="prefilter" title="Save current Filter Panel settings as a Filter Set">Save</span>'
                    + '<span data-action="reset" title="Clear all selected filters from Filter Panel and Filter Sets">Cancel</span>'
                    + '</span>'
                    : ''
                )
                + '<div class="ca_reference_selector"></div>'
                + '</div>';
        return sHTML;
    }
    
    self._buildFields = function(){
        var sHTML = '',
            aTemp,
            sField,
            sObj,
            aField,
            sObjLabel,
            sPrevObj = '';
        for (var nI = 0; nI < self._aFields.length; nI++) {
            aTemp = self._aFields[nI].split('|');
            sObj = aTemp[0];
            sField = aTemp[1];
            
            aField = self._parent._objects.getObjectFieldByName(sObj, sField);
            if (aField == null) {
                continue;
            }
//            if (self['_field' + aField.type] != undefined) {
            sHTML += 
                    (sPrevObj != sObj ? '<b>' + self._parent._objects.getObjectLabel(sObj) + '</b>' : '')
                    + '<span class="_closed _field_title" data-action="showField">' 
                    + aField.label.htmlspecialchars() 
                    + '</span>';
            sPrevObj = sObj;
            sHTML += '<div '
                + ' class="_closed"'
                + 'data-field="' + self._aFields[nI] + '" '
                + 'data-obj="' + sObj + '" '
                + 'data-type="' + aField['type'] + '" '
                + 'title="' + aField.label.htmlspecialchars() + '">';
            switch (aField['type']) {
                case 'DATE' :
                case 'DATETIME' :
                    sHTML += self._fieldDate(aField);
                    break;
                case 'BOOLEAN'  :
                    sHTML += self._fieldBoolean(aField);
                    break;
                case 'TEXT' :
                case 'TEXTAREA' :
                case 'STRING'   :
                case 'PHONE'    :
                case 'URL'      :
                case 'EMAIL'    :
                    sHTML += self._fieldText(aField);
                    break;
                case 'PERCENT'  :
                case 'DOUBLE'   :
                case 'CURRENCY' :
                case 'INTEGER'  :
                    sHTML += self._fieldNumber(aField);
                    break;
                case 'PICKLIST'         :
                case 'COMBOBOX'         :
                case 'MULTIPICKLIST'    :
                    sHTML += self._fieldMultiSelect(aField);
                    break;
                case 'REFERENCE'        :
                    sHTML += self._fieldReference(aField);
                    break;
            }                
            sHTML += '</div>';
        }
        return sHTML;
    }
    
    self._fieldDate = function(aField) {
        var sHTML = '<input '
            + ' class="ca_datetime" '
            + ' name="from" '
            + ' data-type="' + aField['type'] + '" '
            + '>'
            + '<input '
            + ' class="ca_datetime" '
            + ' name="to" '
            + ' data-type="' + aField['type'] + '" '
            + '>'
        ;
        return sHTML;
    }
    
    self._fieldBoolean = function(aField) {
         var sHTML = '<select name="value">'
            + '<option value="-">--</option>'
            + '<option value="on">On</option>'
            + '<option value="off">Off</option>'
            + '</select>'
        return sHTML;	
    }
    
    self._fieldText = function(aField) {
        var sHTML = '<input type="text" name="value" class="_ca_text">';
        return sHTML;
    }
    
    self._fieldNumber = function(aField) {
        var aHTML5Fields = {
            "INTEGER"   : 1,
            "DOUBLE"    : 0.01,
            "PERCENT"   : 0.1,
            "CURRENCY"  : 0.01
        }
        var sHTML = '<input  type="number" name="from"  step="' + aHTML5Fields[aField['type']] + '" class="ca_number">'
            + '<input type="number" name="to" step="' + aHTML5Fields[aField['type']] + '" class="ca_number">';
        return sHTML;
    }
    
    self._fieldMultiSelect = function(aField) {
        
        var sHTML = '<select '
            + 'name="value" '
            + "multiple" 
            + ">",
            bCombo = aField.type == 'COMBOBOX',
            sOptionsHTML = '',
            sOptKey, sOptLabel;
        
        if (typeof(aField.options) != undefined && aField.options.length > 0){
            for(var i = 0; i < aField.options.length; i++) {
                if (aField.options[i].name == undefined) {
                    aField.options[i].name = aField.options[i].value ;
                }
                sOptKey = aField.options[i].key != undefined ? aField.options[i].key : aField.options[i].value;
                sOptLabel = aField.options[i].value != undefined ? aField.options[i].value : aField.options[i].name;
                sOptionsHTML += '<option '
                    + ' value="' + sOptKey.htmlspecialchars() + '" '
                    + ' title="' + sOptLabel.htmlspecialchars() + '" '
                    + '>' 
                    + sOptLabel.htmlspecialchars() 
                    + '</option>';
            }
        }
        sHTML += sOptionsHTML + '</select>';
        if (bCombo) {
            sHTML += '';
//                    '<br><a data-action="new_combo" class="small_button" title="' 
//                    + self._parent.getText('cf_add_combo_val', 'Add custom combobox value')
//                    + '">' 
//                    + self._parent.getText('add', 'Add')
//                    + '</a>';
        }
        return sHTML;
    }
    
    self._fieldReference = function(aField) {
        var sHTML = '';
        
        
        sHTML += 
            '<input type=text class="ca_filter_reference"'
            + ' name="value_text" '
            + " value= ''"
            + " placeholder='" + self._parent.getText('message_type_to_search', 'Type to search') + "'" 
            + ' autocomplete="off" '
            + ">"
            + '<input type=hidden '
            + 'name="value" '
            + ">"
            + '<span class="simple_button" data-action="show_references">&gt;</span>'
            ;
        return sHTML;
    }
    
    self._referenceSelector = function(evt) {
        if (self._nKeyTimer != null) {
            clearTimeout(self._nKeyTimer);
            self._nKeyTimer = null;
        }
        var el = jQuery(evt.currentTarget);
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
    }
    
    self._removeReference = function(evt) {
        var oDiv = jQuery(evt.target).parent();
        jQuery(evt.target).remove();
        oDiv.find('input[type="text"]').trigger('change');
//        var el = jQuery(evt.target);
////            oIds = el.siblings('input[name="value"]');
////        oIds.val(oIds.val().replace(',' + el.data('id'), ''));
//        el.remove();
    }
    
    self._linkAction = function(el, evt) {
//        self._parent.openExternalUrl(jQuery(evt.target).attr('href'));
        window.open(jQuery(evt.target).attr('href'));
        self._parent.hidePopup();
    }
    
    
    self._show_referencesAction = function(el, evt) {
        var dRow = jQuery(evt.target).parent('[data-field]'),
            sField = dRow.data('field'),
            aField = self._getFilterField(sField),
            aTextField = dRow.find('input[type="text"]');
        self._showReferenceSelect(
            aTextField, 
            self._findReferences(aField, ''),
            aField.server,
            aTextField.val(),
            {}
        );
    }
    
    self._close_selectorAction = function(el, evt) {
        if (self._selector == undefined || self._selector.data('el') == undefined){
            return;
        }
        self._selector.removeClass('show')
            .data('el').val('');
//        self._selector.removeClass('show');
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
    
    self._next_selectorAction = function(el, evt) {
        self._selector.data('page', self._selector.data('page') + 10);
        self._requestListFromServer();
    }
    
    self._prev_selectorAction = function(el, evt) {
        self._selector.data('page', Math.max(self._selector.data('page') - 10, 0));
        self._requestListFromServer();
    }
    
    self._showFieldAction = function(oEl, evt){
        oEl.next().toggleClass('_closed');
        oEl.toggleClass('_closed');
    }
    
    self._okAction = function(el, evt){
        if (self._bEmpty) {
            return;
        }
        var aFilters = self._getFilters();
        if (self._oFilterSets != null) {
            self._oFilterSets.find('.filtersets > span._sel').removeClass('_sel');
        }
        self._parent._events.clearEvents();
//        self._parent._calendars.resetCalendar();
        self._parent._events.setFilterPanel(aFilters);
        self._parent.layout.refreshEvents();
        self._oEditedSet = null;
        self._message.text('').removeClass('_show');
        
    }
    
    self._resetAction = function(el, evt){
        self._clearForm();
        if (self._oBlock != undefined) {
            self._oBlock.find('div[data-field]').each(function(nIdx, oEl){
                var oEl = jQuery(oEl);
                oEl.find('select').val('-');
                oEl.find('input').val('');
                oEl.find('._reference').remove();
            });
        }
        if (self._oFilterSets != null) {
            self._aSelectedFilterSet = [];
            self._parent.setLS('selectedFilterSets', JSON.stringify(self._aSelectedFilterSet));            
            self._oFilterSets.find('.filtersets > span._sel').removeClass('_sel');
        }
        self._parent._events.clearEvents();
//        self._parent._calendars.resetCalendar();
        self._parent._events.setFilterPanel([]);
        self._parent.layout.refreshEvents();
        self._oEditedSet = null;
        self._message.text('').removeClass('_show');
        if (self._oBlock != undefined) {
            self._oBlock.children('.ca_filtering_panel').addClass('_empty');
        }
    }
    
    
    self._prefilterAction = function(oEl, evt){
        if (self._bEmpty) {
            return;
        }
        var aFilters = self._getFilters();
        if (aFilters.length < 1) {
            return;
        }
        if (self._oEditedSet != null) {
            self._oEditedSet.criteria = aFilters;
            if (self._oEditedSet.type === 'admin') {
                self._parent._objects.saveSpecialSettings('globalFilteringSets', self._aAdminSets, {stringify : true});
            } else {
                self._parent._objects.saveSpecialSettings('filteringSets', self._aSets, {owner : true, stringify : true});
            }
            var oDiv = self._oFilterSets.find('[data-id="' + self._oEditedSet.id + '"]');
            oDiv.data('criteria', aFilters);
            self._oEditedSet = null;
            self._message.text('').removeClass('_show');
            self._clearForm();
            if (oDiv.hasClass('_sel')) {
                self._applyFilterSetAction(oEl, evt);
            }
            
            
        } else {
            self._displaySavePopup(aFilters);
            return;
            
//            var sType = 'user';
//            if (self._parent.options.SA) {
//                var bCheckGlobal = confirm('Add Global Filter Set?');
//                if (!bCheckGlobal && !confirm('Add Filter Set?')) {
//                    return;
//                }
//                if (bCheckGlobal) {
//                    sType = 'admin';
//                }
//            }
//            var sName = prompt('Enter Filterset Name');
//            if (sName == null || aFilters.length < 1) {
//                return;
//            }
//            self._addFilterSet(sName, aFilters, sType);
//            self._message.text('').removeClass('_show');
//            self._clearForm();
        }
    }
    
    self._displaySavePopup = function(){
        var sHTML = '<div class="_saveFSPopup">'
            + '<div class="_title">Please Enter Filter Set name</div>'
            + '<input type="text" name="name" value="" placeholder="Filter Set Name" required="required"/>'
            + (self._parent.options.SA 
                ? '<input type=checkbox value="1"  />&nbsp;Make this Filter Set Global?'
                : ""
            )
            + '<div class="form_buttons">'
                + '<span class="small_button" data-action="saveFSName">' + self._parent.getText('save', "Save") + '</span>'    
                + '<span class="small_button" data-action="cancelFSName">' + self._parent.getText('cancel', "Cancel")  + '</span>'
            + '</div>'
            + '</div>';
        self._parent.showPopup({
            html        : sHTML,         // send ready dom 
             center      : true,
            modal       : true,
            view        : view,
            shadow      : true,
            autohide    : false,
            overflow    : false            
        });
    }
    
    self._saveFSNameAction = function(oEl, evt){
        var aFilters = self._getFilters(),
            oForm = self._parent._dom.popup.children(),
            sName = oForm.find('input[type="text"]').val(),
            sType = oForm.find('input[type="checkbox"]').is(':checked') ? 'admin' : 'user';
        if (sName != '') {
            self._addFilterSet(sName, aFilters, sType);
            self._message.text('').removeClass('_show');
            self._clearForm();
            self._parent.hidePopup();
        } else {
            oForm.addClass('_err');
//            oForm.find('input[type="text"]')[0].checkValidity();
        }
    }
    
    self._cancelFSNameAction = function(){
        self._parent.hidePopup();
    }
    
    self._applyFilterSetAction = function(oEl, evt){
        if (!oEl.is('._filterset')) {
            oEl = oEl.parents('._filterset');
        }
        oEl.toggleClass('_sel');
        var aEls = self._oFilterSets.find('.filtersets > span._sel'),
            aFilters = [],
            aSelected  = [];
        if (aEls.size() > 0) {
            aEls.each(function(nIdx, oSubEl) {
                var mFilters = jQuery(oSubEl).data('criteria'),
                    aSubFilters = typeof(mFilters) == 'string' ? JSON.parse(mFilters) : mFilters;
                if (jQuery.isArray(aSubFilters) && aSubFilters.length > 0) {
                    aFilters = aFilters.concat(aSubFilters);
                }
                aSelected.push(jQuery(oSubEl).data('id'));
            });
            
            
            self._parent._events.clearEvents();
            self._parent._events.setFilterPanel(aFilters);
            self._parent.layout.refreshEvents();
        } else {
            self._resetAction();
        }
        self._aSelectedFilterSet = aSelected;
        self._parent.setLS('selectedFilterSets', JSON.stringify(self._aSelectedFilterSet));
    }
    
    self._delFSAction = function(oEl, evt) {
        var oSet = self._getFilterSet(oEl.data('id'));
        if (oSet == null || (oSet.type == 'admin' && !self._parent.options.SA)) {
            return;
        }
        var bActive = oEl.hasClass('_sel'),
            aSource = oSet.type == 'admin' ? self._aAdminSets : self._aSets,
            sId = oEl.data('id');
        
        for (var nJ = 0; nJ < aSource.length; nJ++) {
            if (aSource[nJ].id == sId) {
                aSource.splice(nJ, 1);
                break;
            }
        }
        if (oSet.type == 'admin') {
            self._parent._objects.saveSpecialSettings('globalFilteringSets', self._aAdminSets, {stringify : true});
        } else {
            self._parent._objects.saveSpecialSettings('filteringSets', self._aSets, {owner : true, stringify : true});
        }
        oEl.remove();
        if (self._oFilterSets.find('.filtersets ._filterset').size() < 1) {
            self._oFilterSets.find('._message').addClass('_show');
        }
        
        if (bActive) {
            self._applyFilterSetAction(oEl, evt);
        }
        
        return false;
    }
    
    self._renameFSAction = function(oEl, evt) {
        var oSet = self._getFilterSet(oEl.data('id'));
        if (oSet == null || (oSet.type == 'admin' && !self._parent.options.SA)) {
            return;
        }
        
        var sHTML = '<div class="_saveFSPopup">'
            + '<div class="_title">Please Enter Filter Set name</div>'
            + '<input type="hidden" name="id" value="' + oEl.data('id') + '"/>'
            + '<input type="text" name="name" value="' + oSet.name.htmlspecialchars() + '" placeholder="Filter Set Name" required="required"/>'
            + '<div class="form_buttons">'
                + '<span class="small_button" data-action="renameFSName">' + self._parent.getText('save', "Save") + '</span>'    
                + '<span class="small_button" data-action="cancelFSName">' + self._parent.getText('cancel', "Cancel")  + '</span>'
            + '</div>'
            + '</div>';
        
        
        self._parent.showPopup({
            html        : sHTML,         // send ready dom 
            center      : true,
            modal       : true,
            view        : view,
            shadow      : true,
            autohide    : false,
            overflow    : false            
        });
    }
    
    self._renameFSNameAction = function(oEl, evt){
        var oForm = self._parent._dom.popup.children(),
            sName = oForm.find('input[type="text"]').val(),
            sId = oForm.find('input[type="hidden"]').val(),
            oSet = self._getFilterSet(sId);
        if (sName == null || sName == '') {
            oForm.addClass('_err');
            return;
        }
        var oDiv = self._oFilterSets.find('[data-id="' + sId + '"]');
        oSet.name = sName;
        oDiv.find('.filterset_name').html(oSet.name.htmlspecialchars());
        if (oSet.type == 'admin') {
            self._parent._objects.saveSpecialSettings('globalFilteringSets', self._aAdminSets, {stringify : true});
        } else {
            self._parent._objects.saveSpecialSettings('filteringSets', self._aSets, {owner : true, stringify : true});
        }
        self._parent.hidePopup();
    }
    
    self._editFSAction = function(oEl, evt) {
        self._editFilterSet(oEl.data('id'));
    }
    
    self._cloneFSAction = function(oEl, evt) {
        self._editFilterSet(oEl.data('id'), true);
    }
    
    self._detailFilterSetAction = function(oEl, evt){
        return self._parent.layout.showCalendarSubmenu(oEl.parent(), evt);
    }
    
    self._addFilterSet = function(sName, aFilters, sType) {
        if (self._aSets == null) {
            self._aSets = [];
        } 
        if (self._aAdminSets == null) {
            self._aAdminSets = [];
        }
        var aSource = sType == 'admin' ? self._aAdminSets : self._aSets,
            nId = aSource != null ? aSource.length : 1,
            aSet = {'name' : sName, criteria : aFilters, id : nId + '_' + String.token(36), 'type' : sType},
            sHTML = self._buildSetItem(aSet);
        
        aSource.push(aSet);    
        self._oFilterSets.find('.filtersets').append(sHTML)
            .find('._message').removeClass('_show');
        if (self._oFilterSets.hasClass('close')) {
            self._oFilterSets.find('.title').trigger('click');
        }
        if (sType == 'admin') {
            self._parent._objects.saveSpecialSettings('globalFilteringSets', aSource, {stringify : true});
        } else {
            self._parent._objects.saveSpecialSettings('filteringSets', aSource, {owner : true, stringify : true});
        }
    }
    
    self._editFilterSet = function(sId, bClone) {
        var oSet = self._getFilterSet(sId);
        self._oEditedSet = bClone === true ? null : oSet;
        if (oSet == null || (!bClone && oSet.type == 'admin' && !self._parent.options.SA)) {
            return;
        }
        self._message.text((bClone === true ? 'Clone'  : 'Edit') 
                + ' "' 
                + oSet.name 
                + '" filter set'
            )
            .addClass('_show');
        var aCriteria = oSet.criteria;
        if (self._oBlock != undefined) {
            self._setFilters(aCriteria);
        }
        
    }
    
    self._clearForm = function(){
        if (self._oBlock == undefined) {
            return;
        }
        self._oBlock.find('div[data-field]').each(function(nIdx, oEl){
            var oEl = jQuery(oEl);
            oEl.find('select').val('-');
            oEl.find('input').val('');
            oEl.find('._reference').remove();
        });        
        self._oBlock.children('.ca_filtering_panel').children().not('.ca_reference_selector').addClass('_closed');
        self._oBlock.children('.ca_filtering_panel').addClass('_empty');
    }
    
    self._getFilters = function(oBlock){
        var aFilters = [];
        oBlock = oBlock == undefined ? self._oBlock : oBlock;
        oBlock.find('div[data-field]').each(function(nIdx, oEl){
            oEl = jQuery(oEl);
            
            var sType = oEl.data('type'),
//                aField = sObject == undefined 
//                    ? self._getFilterField(oEl.data('field'))
//                    : self._parent._objects.getObjectFieldByName(sObject, oEl.data('field')),
                mValue = null;
            switch (sType) {
                case 'DATE' :
                case 'DATETIME' :
                    mValue = self._getDate(oEl);
                    break;
                case 'BOOLEAN'  :
                    mValue = self._getBoolean(oEl);
                    break;
                case 'TEXT' :
                case 'TEXTAREA' :
                case 'STRING'   :
                case 'PHONE'    :
                case 'URL'      :
                case 'EMAIL'    :
                    mValue = self._getText(oEl);
                    break;
                case 'PERCENT'  :
                case 'DOUBLE'   :
                case 'CURRENCY' :
                case 'INTEGER'  :
                    mValue = self._getNumber(oEl);
                    break;
                case 'PICKLIST'         :
                case 'COMBOBOX'         :
                case 'MULTIPICKLIST'    :
                    mValue = self._getMultiSelect(oEl);
                    break;
                case 'REFERENCE'        :
                    mValue = self._getReference(oEl);
                    break;
            }     
            if (mValue != null && mValue.length > 0) {
                aFilters = aFilters.concat(mValue);
            }
        });     
        return aFilters;
    }
    
    self._getDate = function(oEl){
        var aResult = [],
            sFrom = oEl.find('[name="from"]').val(),
            sTo = oEl.find('[name="to"]').val();
        if (sFrom != '') {
            aResult.push({
                "name" : oEl.data('field').split('|')[1],
                'object' : oEl.data('field').split('|')[0],
                "oper" : 'greaterOrEqual',
                "value" : sFrom,
                "text"  : sFrom
            });
        }
        if (sTo != '') {
            aResult.push({
                "name" : oEl.data('field').split('|')[1],
                'object' : oEl.data('field').split('|')[0],
                "oper" : 'lessOrEqual',
                "value" : sTo,
                "text"  : sTo
            });
        }
        return aResult;
    }
    
    self._getBoolean = function(oEl){
        var aResult = [],
            sVal = oEl.find('select').val();
        if (sVal != '-') {
            aResult.push({
                "name" : oEl.data('field').split('|')[1],
                'object' : oEl.data('field').split('|')[0],
                "oper" : 'equal',
                "value" : sVal,
                "text"  : sVal
            });
        }
        return aResult;
    }
    
    self._getText = function(oEl){
        var aResult = [],
            sVal = oEl.find('input').val();
        if (sVal.trim() != '') {
            aResult.push({
                "name" : oEl.data('field').split('|')[1],
                'object' : oEl.data('field').split('|')[0],
                "oper" : 'contains',
                "value" : sVal,
                "text"  : sVal
            });
        }
        return aResult;
    }
    
    self._getNumber = function(oEl){
        return self._getDate(oEl);
    }
    
    self._getMultiSelect = function(oEl){
        var aResult = [],
            sVal = oEl.find('select').val();
        if (sVal != '' && sVal != null && sVal.length > 0) {
            aResult.push({
                "name" : oEl.data('field').split('|')[1],
                'object' : oEl.data('field').split('|')[0],
                "oper" : 'includes',
                "value" : sVal, //'"' + sVal.join('","') + '"',
                "text"  : sVal.join(',')
            });
        }
        return aResult;
    }
    
    self._getReference = function(oEl) {
        var aResult = [], aID = [], aText = [];
        oEl.find('span._reference').each(function(){
            var el = jQuery(this);
            aID.push(el.data('id'));
            aText.push(el.text());
        });
        if (aID.length > 0) {
            aResult.push({
                "name" : oEl.data('field').split('|')[1],
                'object' : oEl.data('field').split('|')[0],
                "oper" : 'includes',
                "value" : aID.join(','),
                "text"  : aText.join('|||')
            });
        }
        return aResult;
    }
    
    
    self._setFilters = function(aSet) {
        self._clearForm();
        var aFieldsEls = self._oBlock.children('.ca_filtering_panel');
        self._bEmpty = false;
        aFieldsEls.removeClass('_empty');
        self._oBlock.toggleClass('close', false);
        for (var nI = 0; nI < aSet.length; nI++) {
            var oFieldRow = aFieldsEls.children('[data-field="' + aSet[nI].object + '|' + aSet[nI].name + '"]'),
                oFieldEl;
            if (oFieldRow.size() < 1) {
                continue;
            }
            oFieldRow.removeClass('_closed');
            oFieldRow.prev().removeClass('_closed');
            var aField = self._getFilterField(aSet[nI].object + '|' + aSet[nI].name),
                sType = aField.type;
            switch(sType) {
                case 'DATE' :
                case 'DATETIME' :
                    
                case 'PERCENT'  :
                case 'DOUBLE'   :
                case 'CURRENCY' :
                case 'INTEGER'  :
                    oFieldEl = (aSet[nI].oper == 'greaterOrEqual') 
                        ? oFieldRow.find('[name="from"]') 
                        : oFieldRow.find('[name="to"]');
//                    var sDate = typeof(dDate) == 'string'
//                            ? dDate
//                            : dDate.format('yyyy-MM-dd' + (sType == 'DATETIME' ? ' hh:ii:ss' : ''));
                    oFieldEl.val(aSet[nI].value);
                    break;
                case 'BOOLEAN'  :
                    oFieldRow.find('select').val(aSet[nI].value);
                    break;
                case 'TEXT' :
                case 'TEXTAREA' :
                case 'STRING'   :
                case 'PHONE'    :
                case 'URL'      :
                case 'EMAIL'    :
                    oFieldRow.find('input').val(aSet[nI].value);
                    break;
//                case 'PERCENT'  :
//                case 'DOUBLE'   :
//                case 'CURRENCY' :
//                case 'INTEGER'  :
//                    mValue = self._getNumber(oEl);
//                    break;
                case 'PICKLIST'         :
                case 'COMBOBOX'         :
                case 'MULTIPICKLIST'    :
                    oFieldRow.find('select').val(aSet[nI].value);
                    break;
                case 'REFERENCE'        :
                    var aVal = aSet[nI].value.split(','),
                        aText = aSet[nI].text.split('|||'),
                        oInput = oFieldRow.find('input[type="text"]');
                    for (var nJ = 0; nJ <aVal.length; nJ++ ) {
                        jQuery(
                            '<span class="_reference" data-id="' + aVal[nJ] + '" title="' + aText[nJ].htmlspecialchars() + '">' 
                            + aText[nJ].htmlspecialchars() 
                            + '</span>'
                        ).insertBefore(oInput);
                    }
                    break;
            }
        }
    }
    
    self._showReferenceSelect = function(el, aList, bNeedRemote, sText, aParams) {
        aParams = aParams || {};
        var sField = aParams.field !== undefined ? aParams.field : el.parents('[data-field]').data('field'),
            aField = self._getFilterField(sField),
            sSelectType =  '';//self._getFieldSelectedType(sField);
        if (self._selector.hasClass('show') && self._selector.data('field') === sField){
            self._selector.data('page', 0).data('text', sText);
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
        
        var aOffset = el.offset();
        aOffset.left -= 2;
        aOffset.top +=  2 + el[0].offsetHeight;
        self._selector
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
            self._selector.find('select').html(sHTML).addClass('on');
        }            
        self._requestListFromServer(sField, sText);
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
    
    self._buildSelectorList = function(aList) {
        var sHTML = "", sColumns;
        if (!self._bRefColumns) {
            for (var nI = 0; nI <  aList.length; nI++) {
                sHTML += '<a data-id="' + aList[nI].id + '" '
                    + '>'
                    + (aList[nI].name != 'null' ? aList[nI].name : aList[nI].id).htmlspecialchars()
                    + '</a>';
            }
        } else {
            sHTML += '<p><b>' 
                    + self._parent.getText('create_user', 'User')
                    + '</b><b>' 
                    + self._parent.getText('create_role', 'Role')
                    + '</b></p>';
            for (var nI = 0; nI <  aList.length; nI++) {
                sColumns = aList[nI].columns != null && aList[nI].columns != ''
                    ? aList[nI].columns
                    : '';
                sColumns = sColumns.split('::').map(String.htmlspecialchars).join('</span><span>');
                sHTML += '<p data-id="' + aList[nI].id + '" ><a '
                    + '>'
                    + (aList[nI].name != 'null' ? aList[nI].name : aList[nI].id).htmlspecialchars()
                    + '</a>'
                    + '<span>' + sColumns + '</span>'
                    + '</p>';
            }
        }
        return sHTML;
    }
    
    self._requestListFromServer = function(sField, sText) {
        if (self._nTimer != null) {
            clearTimeout(self._nTimer);
            self._nTimer = null;
        }
        sField = sField != undefined ? sField : self._selector.data('field');
        sText = sText != undefined ? sText : self._selector.data('text');
        var nPage = self._selector.data('page') == undefined ? 0 : self._selector.data('page'),
            sObj = self._selector.find('select').size() > 0 ? self._selector.find('select').val() : '',
            sBaseObject = self._getFilterFieldObject(sField),
            sBaseField = sField.split('|')[1];
        
        var aField = self._getFilterField(sField);
        if (sObj == null || sObj ==  '' ) {
            sObj = aField.options[0].key != null ? aField.options[0].key : aField.options[0].name;
        }
        if (sField.indexOf('.') >= 0) {
            var aBaseField = self._getFilterField(sField.split('.')[0]);
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
                                && self._selector.data('params') != undefined 
                                && self._selector.data('params').additionOptions != undefined
                                && self._selector.data('params').additionOptions.length > 0
                        ) {
                            aList = self._selector.data('params').additionOptions.concat(aList);
                        }
                        self._bRefColumns = aPagesOption.columns === true;
                        self._buildSelectorByText(sField, sText, aList);
                        self._selector.find('[data-action="next_selector"]').toggleClass('_off', aPagesOption.next !== true);
                        self._selector.find('[data-action="prev_selector"]').toggleClass('_off', aPagesOption.prev !== true);
//                        self._checkSelectorPosition();
                    }
                );
            }
            , 200);
        } else {
            self._buildSelectorByText(sField, sText);
        }
        
    }
    
    self._buildSelectorByText = function(sField, sText, aAddList) {
        var aList = self._findReferences(self._getFilterField(sField), sText);
        if (aAddList != undefined && aAddList.length > 0) {
            aList = aAddList;
        }
        aList.sort(function(a, b){
            return a.name > b.name;
        });
        self._selector.find('.list').html(self._buildSelectorList(aList));
    }
    
    
    self._referenceSelectorSelect = function(evt) {
        var el = jQuery(evt.currentTarget);
        if (el.data('id') == undefined) {
            return;
        }
        if (self._selector.data('params') != undefined 
                && self._selector.data('params').onselect != undefined) {
            self._close_selectorAction();
            self._selector.data('params').onselect(el[0].tagName == 'A' ? el.text() : el.children('a').text(), el.data('id'));
            
        } else {
            self._setReferencePosition(el[0].tagName == 'A' ? el.text() : el.children('a').text(), el.data('id'));
        }
        
    }
    
    self._setReferencePosition = function(sText, sId, oInput, nPos) {
        var el = self._selector.data('el'),
            oDiv = el.parent();
        jQuery(
            '<span class="_reference" data-id="' + sId + '" title="' + sText.htmlspecialchars() + '">' 
            + sText.htmlspecialchars() 
            + '</span>'
        ).insertBefore(el);

        oDiv.find('input[type="text"]').trigger('change');
        //oDiv.find('input[name="value"]').val(oDiv.find('input[name="value"]').val()  + "," + sId);
        self._close_selectorAction();
    }
    
    self._referenceSelectorChange = function(nDir) {
        var aSelected = self._selector.find('.list').find('.sel');
        if (aSelected.size() < 1) {
            self._selector.find('.list').children(':first-child').addClass('sel');
        } else {
            var aNewSelected = (nDir > 0 ? aSelected.next() : aSelected.prev());
            if (aNewSelected.size() > 0) {
                aSelected.removeClass('sel');
                aNewSelected.addClass('sel');
            }
        }
    }
    
    self._referenceSelectorClick = function(evt) {
        var aSelected = self._selector.find('.list').find('.sel');
        if (aSelected.size() < 1) {
            aSelected = self._selector.find('.list').children(':first-child');
        }
        if (aSelected.size() > 0) {
            aSelected.trigger('click');
        }
    }
    
    self._getFilterField = function(sField) {
        var aTemp = sField.split('|'),
            aField = self._parent._objects.getObjectFieldByName(aTemp[0], aTemp[1]);
        return aField;
    }
    self._getFilterFieldObject = function(sField) {
        var aTemp = sField.split('|');
        return aTemp[0] == 'common' ? 'event' : aTemp[0];
    }
    
    self._clearBlock = function(){
        self._selector.remove();
        delete self._selector;
        self._oBlock.remove();
        delete self._oBlock;
    }
    
    self._clearBlockFilterSets = function(){
        self._oFilterSets.remove();
        delete self._oFilterSets;
    }
    
    self._getFilterSet = function(sId) {
        var aAllSets = []
            .concat(self._aSets != null ? self._aSets : [])
            .concat(self._aAdminSets != null ? self._aAdminSets : [])
            .concat(self._aCustomSets != null ? self._aCustomSets : []);
        for (var nJ = 0; nJ < aAllSets.length; nJ++) {
            if (aAllSets[nJ].id == sId) {
                return aAllSets[nJ];
            }
        }
        return null;
    }
    
    jQuery.calendarAnything.appendView('filteringPanel', view);
})();