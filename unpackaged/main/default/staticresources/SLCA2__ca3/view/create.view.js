/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css        : '/css/create-event.css',
        _parent     : null,
        _div        : null,
        _dom        : {},
        _params     : {},
        _structure  : {},
        _selectedCalendar : null,
        _default        : {},
        _defaultText    : {},
        _bRecordType    : false,
        _aMetaDescription : {},
        _bEdit      : false,                                    
        _aCalendar  : {},
        _aObject    : {},
        _bRefColumns : false,
        _checkStartChanges : false, 
        _aOldData   : {},
        _bEndCorrect : false,
        _aCreateable : [],
        _aRestrictField : [],
        _bRichText      : false ,
        _aLookupFields : {},
        _oFilterPanelView : null,
        _aLookupFilters   : [],
        _sLookupSort      : ""
         
    };
    
    var view = {}
    
    view.init = function (div, parent){
        self._div = div;
        self._parent = parent;
        //self._parent._initScripts('//ckeditor/ckeditor-4.x/rel/ckeditor.js?t=4.5.3.3');
        self._parent.loadCss(self._css, function(){
            self._parent.checkPopupVisiblility();
            
        });
        
    }

    view.show = function(params) {
        if (self._parent.options.readonly === true) {
            return;
        }
        self._aLookupFields = self._parent._objects.getSpecialSettings('lookupFields', {});
        self._params = params;
        self._aCreateable = self._getCrateable(params);
        if ((params.cid == '' || params.cid == undefined) && self._aCreateable.length == 1) {
            params.cid = self._aCreateable[0].id;
        }
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
    }
    
    self._show = function(params) {
        var sHTML = self._buildMainHTML(params),
            aCalendar;
        self._bEndCorrect = false;
        if (self._dom.el != undefined) {
            self._dom.el.removeClass('_disabled');
        }
        self._parent.showPopup({
            html            : sHTML,
            onShow          : self._initEvents,
            onClose         : params.onClose,
            onCancel        : params.onCancel,
            "noLeave"       : true, 
            "noCloseRule"   : '.CA_calendar',
            event           : params.event,
            view            : view,
            overflow        : false,
//            slide           : self._parent.options._small ? 'bottom' : false,
            fullScreen      : self._parent.options._small

        });
        self._bEdit = false;
        if (params.cid != undefined && params.cid != '') {
            aCalendar = self._parent._calendars.getCalendar(params.cid);
            
            self._selectedCalendar = params.cid;
            self._aCalendar = aCalendar;
            self._correctEnd();
            self._aObject = self._parent._objects.getObject(aCalendar.objectName);
            if (params.eventId != undefined && params.eventId != '' && params.clone !== true) {
                self._bEdit = true;
            }
            self._parent._addQueue([
                function(){
                    self._buildCalendarFields(aCalendar);
                },
                function(){
                    if (params.eventId != undefined && params.eventId != '') {
                        if (params.clone !== true) {
                            self._bEdit = true;
                        }
//                        var aEventData = self._parent._events.getEvent(params.eventId, self._selectedCalendar)[0];
                        self._parent._events.getEventDetail(params.eventId, params.cid, function(aData) {
                            if (aData.data == undefined && aData.result != undefined) {
                                aData.result[0].data = jQuery.extend({}, aData.result[0]);
                                aData.data = aData.result;
                            }
                            self._aOldData = {};
                            if (self._bEdit && (
                                    aData.data[0] != undefined
                                    && (
                                        aData.data[0].ischild == true
                                        || (aData.data[0].ca_permission != undefined
                                            && aData.data[0].ca_permission !== true
                                            && aData.data[0].ca_permission !== 'edit'
                                        )
                                    )
                                )
                            ) {
                                self._dom.el.addClass('_disabled');
                                self._showMessage(
                                    aData.data[0].ischild == true
                                        ? 'Child Events are disabled for Editing'
                                        : 'You do not have privilegies to edit this record'
                                );
                            } else {
                                self._dom.el.removeClass('_disabled');
                                if (aData.data.length > 0) {
                                    self._setValues(aData.data[0]);
                                    self._aOldData = aData.data[0];
                                }
                                self._parent.checkPopupVisiblility();
                            }

                        });
                        
                    }
                } 
//                ,
//                function() {
//                    self._parent.checkPopupVisiblility();
//                }
            ]);
            
            
        } else if (self._selectedCalendar != null) {
            aCalendar = self._parent._calendars.getCalendar(self._selectedCalendar);
            self._aCalendar = aCalendar;
            self._correctEnd();
            self._aObject = null;
            if (
                aCalendar != undefined 
                && aCalendar != null 
                && self._dom.el.find('.calendar_select > select > option[value="' + self._selectedCalendar + '"]').size() > 0
            ) {
                self._aObject = self._parent._objects.getObject(aCalendar.objectName);
                self._dom.el.find('.calendar_select > select').val(self._selectedCalendar);
                self._buildCalendarFields(aCalendar);
            }
        }
    }
    
    view.clearView = function() {
        self._aMetaDescription = {};
    }
    
    self._buildMainHTML = function(params) {
//        console.log(params);
        var sHTML = 
            '<div class="CA_create_event ' 
                + (params.eventId != undefined && params.eventId != '' && !self._params.clone ? '_disabled' : '') 
                + '">'
                + '<div class=title>'
                    + (params.eventId != undefined && params.eventId != '' 
                        ? (self._params.clone 
                            ? self._parent.getText('create_clone_event', 'Clone event')
                            : self._parent.getText('edit', 'Edit')
                        )
                        : self._parent.getText('create_select_calendar', 'Select calendar') 
                    )
                + '</div>'
                + '<div class=message></div>'
                + '<div class=calendar_select>'
                + self._buildCalendarSelector(params.cid)
                + '</div>'
                + '<div class=fields><form></form></div>'
                + '<div class="ca_reference_selector"></div>'
                + '<div class="buttons form_buttons"><span data-mode="cancel" >' 
                    + self._parent.getText('menu_cancel', 'Cancel') 
                + '</span></div>'
            + '</div>';
        return sHTML;
    }
    
    self._buildCalendarSelector = function(sCid) {
        var sHTML;
        
        if (sCid != undefined && sCid != '') {
            var aCalendar = self._parent._calendars.getCalendar(sCid);
            sHTML = '<select disabled>'
                + '<option value="' + aCalendar.id + '">' + aCalendar.name.htmlspecialchars() + '</option>'
            + '</select>';
            return sHTML;
        }
        if (self._aCreateable.length < 1) {
            sHTML = '<div>' + self._parent.getText('message_no_editable', 'There are no editable calendars') + '</div>';
        } else  {
            sHTML = '<select>'
                + '<option value="">---' + self._parent.getText('message_select_calendar', 'Select calendar please') + '---</option>';
            for (var nI = 0; nI < self._aCreateable.length; nI++) {
                sHTML += '<option value="' + self._aCreateable[nI].id + '">' + self._aCreateable[nI].name.htmlspecialchars() + '</option>';
            }
            sHTML += '</select>';
        }
        return sHTML;
    }
    
    self._initEvents = function(wPopup) {
        self._dom.el = wPopup.find('.CA_create_event');
        self._dom.form = self._dom.el.find('.fields > form');
        self._dom.message = self._dom.el.find('.message');
        self._dom.title = self._dom.el.find('.title');
        self._dom.selector = self._dom.el.find('.ca_reference_selector');
        self._dom.buttons = self._dom.el.find('.buttons');
        
        self._dom.el.on('change.CA_quickCreation', '.calendar_select > select', function(){
            self._selectedCalendar = jQuery(this).val();
            self._aCalendar = self._parent._calendars.getCalendar(self._selectedCalendar);
            self._aObject = null;
            self._correctEnd();
            self._buildCalendarFields(self._aCalendar);
        });
        self._dom.el.on('click', '.buttons > span', function(evt){
            var el = jQuery(this);
            if (el.data('mode') == 'cancel') {
                self._clearCKEditor();
                self._parent.hidePopup(evt, 'cancel');
                return false;
            } else if (el.data('mode') == 'ok') {
                self._dom.form.trigger('submit');
            }
        });
        self._dom.form
        .off('.CA_CREATE')
        .on('submit.CA_CREATE', function(){
            var oButton = self._dom.el.find('.buttons > span[data-mode="ok"]');
            if (oButton.data('off') == 1) {
                return false;
            }
            if (!self._checkRequired()) {
                self._showMessage('Check the highlighted fields please');
                return false;
            }
            
            var aData = {
                    data    : self._prepareData()
                },
                sCalendar = self._selectedCalendar,
                aCalendar = self._parent._calendars.getCalendar(sCalendar);
            if (self._params.eventId != undefined && self._params.eventId != '') {
                aData.id = self._params.eventId;
                if (self._params.clone != undefined && self._params.clone) {
                    if (typeof(aData.data.clone_counts) == 'undefined' 
                        || String.trim(aData.data.clone_counts) == ''
                        || parseInt(aData.data.clone_counts) < 1
                    ) {
                        aData.data.clone_counts = 1;
                    }
                }
                if (self._parent.params.showCreatingDates === true) {
                    aData.data.custom_dates = 1;
                }
                
            } else {
                if (self._parent.params.showCreatingDates === true) {
                    self._setCustomStartEndDates(aData);
                } else {
                    if (self._params.allDay === true 
                        && aCalendar.et == 'DATETIME'
                        && !(
                            aCalendar.objectName == 'event' 
                            && aCalendar.endFieldName === 'enddatetime' 
                            && aData.data.isalldayevent !== 'off'
                        )
                        && aCalendar.objectName != 'task'
                    ) {
                        self._params.date.stop.changeDate(1);
                    }
                }
                if (self._structure.end != undefined && self._structure.end != ''
                    && self._params.date.start > self._params.date.stop
                ) {
                    Date.swap(self._params.date.start, self._params.date.stop)
                }
                
                
                aData.start = self._params.date.start.format('yyyy-MM-ddThh:ii:ss');
                aData.end = self._params.date.stop.format('yyyy-MM-ddThh:ii:ss');
                self._parent.layout.activateOnlyVisualCalendar(sCalendar, true);
            }
            
            oButton.data('off', 1).addClass('_working').text('Saving');
            self._parent._events.saveEvent(aData, sCalendar, function(mResult){
            
                oButton.data('off', "").removeClass('_working').text(self._parent.getText('save', "Save") );
                var bHide = false;
                if (mResult.status.substr(0, 5).toLowerCase() != 'error') {
                    self._showMessage(mResult.status);
                    bHide = true;
                } else if (typeof(mResult.message) != 'undefined'){
                    self._showMessage(mResult.message);
                } else if (mResult.result != undefined && typeof(mResult.result.message) != 'undefined'){
                    self._showMessage(mResult.result.message);                    
                } else {
                    self._showMessage('Server error', mResult.status != undefined ? mResult.status : null);
                    return;
                }
                if (mResult.result != undefined && mResult.result.fields != undefined) {
                    var aErrFields = mResult.result.fields.split(',');
                    for (var nF = 0; nF < aErrFields.length; nF++) {
                        self._dom.form.children('[data-name="' + aErrFields[nF].toLowerCase() + '"]').addClass('_fire');
                    }
                }
                
                
                var dMin, dMax;

                if (self._params.eventId != undefined && self._params.eventId != '') {
                    var aResult = self._parent.layout.findEventBars(self._params.eventId);
                    aResult.each(function(){
                        var el = jQuery(this),
                            dStart = Date.baseDate(el.data('start')),
                            dEnd = Date.baseDate(el.data('end'));
                        dMin = dMin == undefined ? dStart : dMin.getMinDate(dStart); 
                        dMax = dMax == undefined ? dEnd : dMax.getMaxDate(dEnd); 
                    });
                    dMin.resetFirstWeekDay(self._parent.params.startWeekDay);
                    dMax.resetFirstWeekDay(self._parent.params.startWeekDay).changeDate(7);
                } else if (
                    mResult.result != undefined 
                    && mResult.result.id != undefined 
                    && (self._objectSpecial[self._aCalendar.objectName] == undefined 
                        || self._objectSpecial[self._aCalendar.objectName].checkAfter == undefined
                        || self._objectSpecial[self._aCalendar.objectName].checkAfter(mResult.result) == true
                    )
                ) {
                    self._parent._addQueue(function(){
                        self._parent.layout.checkAfterCreatePresent(mResult.result.id, sCalendar);
                    });
                }
                if (self._parent.params.cacheTime > 0 
                    || (self._params.eventId != undefined 
                        && self._params.eventId != '' 
                        && self._params.clone == undefined
                    )
                ) {
                    var aRequestDates = {
                            min : self._params.eventId != undefined && self._params.eventId != '' ? dMin : self._params.date.start, 
                            max : self._params.eventId != undefined && self._params.eventId != '' ? dMax : self._params.date.stop 
                        };
                    self._parent.layout.clearPeriod(sCalendar, aRequestDates.min, aRequestDates.max, true);
                }
                if (bHide) {
                    self._clearCKEditor();
                    self._parent.hidePopup();
                }
            });
            
            return false;
        })
        .on('click.CA_CREATE', 'span.lookupInput a', function(evt) {
            var divField = jQuery(evt.currentTarget).parents('div[data-name]'),
                oSelect = divField.find('select'),
                sObjectPrefix = oSelect.size() > 0 ? oSelect.val() : divField.find('input[type=text]').data('object');
            self._openLookup('/_ui/common/data/LookupPage'
                + "?kfm=popup_form&lknm=" + divField.data('name') + "&lktp=" + sObjectPrefix 
                + "&lksrch=" + divField.find('input[type=text]').val()
                ,
                400
            );
        })
    
        .on('click.CA_CREATE', 'input.ca_datetime', function(evt){
            var el = jQuery(evt.currentTarget),
                sType = el.parents('span[data-type]').data('type');
            self._parent._initView('calendar', function(){
                var oView = self._parent._getView('calendar'),
                    sFormat = sType == 'DATETIME'
                        ? self._parent.options.format['datetime']
                        : self._parent.options.format['date'],
                    dValue = Date.preParse(el.val(), sFormat);
                el.data('previous', dValue)
                var params = {
                    el  : el,
                    evt : evt,
                    value : dValue.getTime(),
                    select : function(dDate) {
                        el.val(dDate.format(sFormat)).trigger('change');
                        if (self._parent.params.showCreatingDates === true) {
                            self._checkCreatingDates(el, dDate);
                        }
                    },
                    default     : el.data('default') != undefined ? el.data('default') : null,
                    showTime    : sType == 'DATETIME',
                    showAM      : (sType == 'DATETIME' && sFormat.indexOf('a') > 0)
                }
                if (oView != null) {
                    oView.show(params);
                }
            });
        })
        .on('keyup.CA_calendar_filter.CA_CREATE', '.ca_filter_reference', function(evt){
            self._referenceSelector(evt);
        })
        .on('keyup.CA_calendar_filter.CA_CREATE, change.CA_CREATE', '.ca_filter_reference_sf', function(evt){
            self._referenceSelectorSF(evt);
        })
        .on('click.CA_calendar_filter.CA_CREATE', '._reference', function(evt){
            self._removeReference(evt);
        })
        .on('change.CA_CREATE', 'select._ca_dependent, input._ca_dependent', function(evt){
            var domField = jQuery(evt.target);
            self._rebuildDependent(
                domField.data('depfield'),
                domField[0].tagName == 'INPUT' 
                    ? (domField.attr('checked') ? 'true' : 'false')
                    : domField.val()
            );
        }).on('click.CA_CREATE', '.ca_datalist > select', function(evt) {
            return self._picklistOptionsSelector(evt);
        })
        .on('change.CA_CREATE', 'select._ca_recordtype', function(evt){
            var domField = jQuery(evt.target);
            self._parent._objects.checkRecordType(self._aCalendar.objectName, domField.val(), function(aDepData, aOptions, aDefault){
                if (domField.val() == '' && aDepData == null) {
                    aDepData = {};
                    self._dom.form.find('[data-sub_dependent]').each(function(nIdx, oSubEl){
                        oSubEl = jQuery(oSubEl);
                        if (oSubEl.data('optionsRecordType') == undefined || oSubEl.data('optionsRecordType').length < 1) {
                            return;
                        }
                        var oParentEl = oSubEl.parents('div[data-name]');
                        
                        aDepData[oParentEl.data('name')] = [""];
                        //console.log(jQuery(oSubEl).data('name'));
                    });
                }
                if (aDepData != null && aDepData !== false) {
                    self._rebuildDependent(
                        aDepData,
                        true
                    );
                }
            });
        });
        
        self._dom.selector
            .off('.CA_CREATE')
            .on('click.CA_CREATE', '.list > a, .list > p', function(evt){
                self._referenceSelectorSelect(evt);
            })
            .on('change.CA_CREATE', 'select', function(evt){
                self._dom.selector.data('page', 0);
                self._aLookupFilters.length = 0;
                self._sLookupSort = "";
                self._setFieldSelectedType();
                self._requestListFromServer();
            });
            
    }
    
    
    self._buildCalendarFields = function(aCalendar){
        self._dom.el.removeClass('_message');
        if (aCalendar == undefined) {
            self._dom.form.html('');
            return;
        }
        self._dom.el.find('.calendar_select > select option[value=""]').remove();
        var aQ = [
            function(){
                self._parent._calendars.getCalendarStructure(aCalendar.id, function(aStructre){
                    if (self._aObject == null) {
                        self._aObject = self._parent._objects.getObject(self._aCalendar.objectName);
                    }
                    self._structure = aStructre[aCalendar.id];
                });
            },
            function(){
                self._checkDependendLookup();
            },
            function(){
                if (self._objectSpecial[self._aCalendar.objectName] != undefined
                        && self._objectSpecial[self._aCalendar.objectName].start != undefined
                ){
                    self._objectSpecial[self._aCalendar.objectName].start();
                }
                self._buildCalendarForm();
                self._parent.checkPopupVisiblility();
                self._default = {};
                if (self._structure.filter != undefined) {
                    var aFilter = (typeof(self._structure.filter) == 'string')
                        ? self._parent._calendars.parseStringFilter(self._structure.filter)
                        : self._structure.filter;
                    self._initDefault(aFilter);
                }
                if (aCalendar['filters'] != undefined) {
                    self._initDefault(aCalendar['filters']);
                }
                if (self._params.predefine !== undefined ) {
                    self._initDefault(self._params.predefine);
                }
                if (self._params.eventId == undefined || self._params.eventId == '') {
                    self._setDefaultValues();
                }
                if (typeof(self._aCalendar.objectName) != 'undefined'
                    && self._objectSpecial[self._aCalendar.objectName] != undefined 
                    && typeof(self._objectSpecial[self._aCalendar.objectName].initEvent) == 'function'
                ){
                    self._objectSpecial[self._aCalendar.objectName].initEvent();
                }
            }
        ];
        self._parent._prependQueue(aQ.reverse());
        
    }
    
    self._buildCalendarForm = function() {
        var aStructure = self._structure,
            nI, 
            aField, 
            sHTML = '', 
            aFields = [],
            aObject = self._aObject,
            aDependent = [],
            bRecordType = false;
        for (nI = 0; nI < aStructure.create.length; nI++) {
            if (self._aRestrictField.indexOf(aStructure.create[nI].name) >= 0) {
                continue;
            }
            aFields.push(jQuery.extend(
                {}, 
                aStructure.create[nI], 
                aObject.fields[aStructure.create[nI].name]
            ));
        }
        
        if (self._params.clone != undefined && self._params.clone) {
            aFields.unshift({
                "type" : "INTEGER", 
                "label" : self._parent.getText('create_number_of_clone', '# of Cloned Records'),
                "name" : "clone_counts" ,
                "isCreateable" : true, 
                "isUpdateable" : true,
                "value" : 1,
                "attr" : {"min" : 1, "max" : 100, "step" : 1}
            })
        }
        self._checkStartChanges = false;
        if (self._parent.params.showCreatingDates === true) {
            var dTempStart, dTempEnd,
                dNow = Date.baseDate().changeHour(1);
            if (self._params.eventId != undefined && self._params.eventId != '' && self._params.cid != '') {
                var aEvt = self._parent._events.getEvent(self._params.eventId, self._params.cid);
                if (aEvt.length > 0) {
                    dTempStart = aEvt[0].dateStart;
                    dTempEnd = aEvt[0].dateEnd;
                }
            } else if (self._params.date != undefined){
                dTempStart = self._params.date.start;
                dTempEnd = self._params.date.stop;
                if (!self._bEdit 
                    && self._params.allDay
                    && (self._bEndCorrect 
                        || dTempStart.getTime() == dTempEnd.getTime()
                    )
                ) {
                    self._checkStartChanges = true;
                }
            }
            aField = self._getField(aStructure.start);
            if (
                aField != undefined  
                && !(!self._bEdit && (aField.isCreateable == 'false' || !aField.isCreateable))
                && !(self._bEdit && (aField.isUpdateable == "false" || !aField.isUpdateable))
            ) {
                if (aField.type == 'DATETIME' && self._checkStartChanges) { 
                    dTempStart.setHours(dNow.getHours());
                }
                sHTML += '<div data-name="' + aField.name + '" data-special="start" ' 
                    + ' class="required">' 
                    + '<span title="' + aField.type + '">' + aField.label.htmlspecialchars() + '</span>'
                    + '<span data-type="' + aField.type + '">'
                    + self._fieldDate(jQuery.extend(
                        {}, 
                        aField, 
                        dTempStart != undefined && dTempStart != null
                            ? {value : dTempStart.format(self._parent.options.format[aField.type == 'DATE' ? 'date' : 'datetime'])}
                            : {}
                    ))
                    + '</span></div>';
            }
            if (aStructure.end != undefined) {
                aField = self._getField(aStructure.end);
                if (
                    aField != undefined  
                    && !(!self._bEdit && (aField.isCreateable == 'false' || !aField.isCreateable))
                    && !(self._bEdit && (aField.isUpdateable == "false" || !aField.isUpdateable))
                ) {
                    if (aField.type == 'DATETIME' && self._checkStartChanges) { 
                        dTempEnd.changeDate(-1).setHours(dNow.getHours() + 1);
                        if (dTempEnd < dTempStart) {
                            dTempEnd.changeDate(1);
                        }
                    }
                    sHTML += '<div data-name="' + aField.name + '" data-special="end" '
                        + ' class="required">' 
                        + '<span title="' + aField.type + '">' + aField.label.htmlspecialchars() + '</span>'
                        + '<span data-type="' + aField.type + '">'
                        + self._fieldDate(jQuery.extend(
                            {}, 
                            aField, 
                            dTempEnd != undefined && dTempEnd != null
                                ? {value : dTempEnd.format(self._parent.options.format[aField.type == 'DATE' ? 'date' : 'datetime'])}
                                : {}
                        ))
                        + '</span></div>';
                }
            }
        }
        var aFieldTextArea = [];
        for (nI = 0; nI < aFields.length; nI++) {
            aField = aFields[nI];
            
            if (aField == null 
                    || aField == undefined 
                    || (!self._bEdit && (aField.isCreateable == 'false' || !aField.isCreateable))
                    || (self._bEdit && (aField.isUpdateable == "false" || !aField.isUpdateable))
                    || aField.name.toLowerCase() == aStructure.start
                    || (typeof(aStructure.end) != 'undefined'
                        && aField.name.toLowerCase() == aStructure.end
                    )
            ) {
                continue;
            }
            if (aField.isDependent == 'true' || aField.isDependent == true)  {
                aDependent.push(aField);
            }
            
            sHTML += '<div data-name="' + aField.name + '" '
                + ' class="' 
                + (aField.isRequired || aField.isRequiredCustom == 'true' ? " required " : "")
                + ((aField.name == 'Fiscal' || aField.name == 'ForecastCategory' || aField.name == 'StatusCode' || aField.name == undefined)
                    ? "hidden"
                    : "")
                + (aField.isHTML && self._parent.options.session ? ' two_column ' : "")
                + '">' 
                + '<span title="' + aField.type + '">' + aField.label.htmlspecialchars() + '</span>'
                + '<span data-type="' + aField.type + '">';
            switch(aField.type) {
                case 'REFERENCE' :
                    sHTML +=  self._fieldReference(aField);
                    if (aField.name == 'recordtypeid') {
                        bRecordType = true;
                    }
                    break;
                case "EMAIL"    :
                case "PHONE"    :                    
                case "URL"      :                    
                case "INTEGER"  :                    
                case "DOUBLE"   :                    
                case "PERCENT"  :                    
                case "CURRENCY" :
                    sHTML +=  self._fieldHTML5(aField);
                    break;
                    
                case 'DATE'     :
                case 'DATETIME' :
                    sHTML += self._fieldDate(aField);
                    break;
                case 'BOOLEAN' :
                    sHTML +=  self._fieldBoolean(aField);
                    break;
                case 'TEXTAREA' :
                    sHTML +=  self._fieldTextarea(aField);
                    if(aField.isHTML) {
                    	aFieldTextArea.push(aField);
                    }
                    break;
                case 'COMBOBOX' :
                    sHTML +=  self._fieldDatalist(aField);
                    break;
                case 'PICKLIST' :
                case 'MULTIPICKLIST' :
                    sHTML +=  self._fieldSelect(aField);
                    break;
                case 'STRING'   :
                default         :
                    sHTML +=  self._fieldText(aField);
                    break;
            }
            sHTML += '</span></div>';
        }
        if (self._objectSpecial[self._aCalendar.objectName] != undefined 
            && typeof(self._objectSpecial[self._aCalendar.objectName].html) == 'function'
        ){
            sHTML += self._objectSpecial[self._aCalendar.objectName].html();
        }
        self._dom.form.html(sHTML).find('input[type!="hidden"], select, textarea').eq(0).focus();
        sHTML = '<div class="buttons form_buttons">'
            + '<span data-mode="ok" >' + self._parent.getText('save', 'Save') + '</span>'
            + '<span data-mode="cancel" >' + self._parent.getText('cancel', 'Cancel') + '</span>'
            + '</div>'
        self._dom.el.find('.buttons').remove();
        self._dom.el.append(sHTML);
        
        
        
        self._parent._prependQueue([
            function(){
                self._dom.form.find('input.ca_datalist').CADataList();
            },
            function(){ 
                // empty function to execute JS loading... 1.8 version
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca-datalist.js', {
                    checkContinue : function(){
                        return jQuery.fn.CADataList != undefined;
                    }
                });
            },
            function() {
                if (typeof(CKEDITOR) != 'undefined' && self._parent.options.session) {
                    for (var nCk = 0; nCk < aFieldTextArea.length; nCk++) {
                        self._ckeditorReplace(aFieldTextArea[nCk].name);
                    }   
                }
                if (bRecordType) {
                    self._parent._objects.checkRecordType(
                        self._aCalendar.objectName, 
                        null, 
                        function(aDepData, aOptions, aDefault){
                            self._fillOptionsField('recordtypeid', aOptions, null, false);
                            if (!self._bEdit 
                                && (self._params.eventId == undefined || self._params.eventId == '')
                                && aDepData != null 
                                && aDepData !== false
                            ) {
                                self._rebuildDependent(aDepData, true);
                                if (!self._bEdit) {
                                    self._setValues({data : aDefault});
                                }
                            }
                        }
                    );
                }
            },
            function () {
                if (aFieldTextArea.length > 0 && self._parent.options.session) {
                    self._parent._initScripts('//ckeditor/ckeditor-4.x/rel/ckeditor.js?t=4.5.3.3');
                }
            },
//            setInterval(function(){
//                    self._parent.checkPopupVisiblility()
//            }, 1000)
			
        ]);
        if (aDependent.length > 0) {
            self._parent._addQueue(
                function(){
                    self._initDependent(aDependent);
                }
            );
        }
     
    }
    
    self._ckeditorReplace = function(sFieldName) {
        if (CKEDITOR.instances[sFieldName] != undefined) {
            delete CKEDITOR.instances[sFieldName];
            jQuery('.cke_editor_' + sFieldName + '_dialog').remove();
        }
    	CKEDITOR.replace(sFieldName, {
            removePlugins: 'elementspath,maximize,image,tabletools,liststyle,contextmenu,resize',
            baseHref: '/ckeditor/ckeditor-4.x/rel/',
            customConfig: '/ckeditor/ckeditor-4.x/rel/sfdc-config.js',
            height: '250',
            bodyId: sFieldName + '_rta_body',
            toolbar: 'SalesforceBasic',
            sfdcLabels: {CkeMediaEmbed: {iframeMissing: 'Invalid &lt;iframe&gt; element. Please use valid code from the approved sites.', subtitle: 'Paste &amp;lt;iframe&amp;gt; code here:', description: 'Use &lt;iframe&gt; code from DailyMotion, Vimeo, and Youtube.', title: 'Embed Multimedia Content', exampleTitle: 'Example:', example: '\n            \n                &lt;iframe width=\&quot;560\&quot; height=\&quot;315\&quot; src=\&quot;https://www.youtube.com/embed/KcOm0TNvKBA\&quot; frameborder=\&quot;0\&quot; allowfullscreen&gt;&lt;/iframe&gt;\n            \n        '}, CkeImagePaste: {CkeImagePasteWarning: 'Pasting an image is not working properly with Firefox, please use [Copy Image location] instead.'}, CkeImageDialog: {infoTab_desc_info: 'Enter a description of the image for visually impaired users', uploadTab_desc: 'Description', defaultImageDescription: 'User-added image', uploadTab_file_info: 'Maximum size 1 MB. Only png, gif or jpeg', uploadTab_desc_info: 'Enter a description of the image for visually impaired users', imageUploadLimit_info: 'Max number of upload images exceeded', btn_insert_tooltip: 'Insert Image', httpUrlWarning: 'Are you sure you want to use an HTTP URL? Using HTTP image URLs may result in security warnings about insecure content. To avoid these warnings, use HTTPS image URLs instead.', title: 'Insert Image', error: 'Error:', uploadTab: 'Upload Image', wrongFileTypeError: 'You can insert only .gif .jpeg and .png files.', infoTab_url: 'URL', infoTab: 'Web Address', infoTab_url_info: 'Example: http://www.mysite.com/myimage.jpg', missingUrlError: 'You must enter a URL', uploadTab_file: 'Select Image', btn_update_tooltip: 'Update Image', infoTab_desc: 'Description', btn_insert: 'Insert', btn_update: 'Update', btn_upadte: 'Update', invalidUrlError: 'You can only use http:, https:, data:, //, /, or relative URL schemes.'}, sfdcSwitchToText: {sfdcSwitchToTextAlt: 'Use plain text'}},
            contentsCss: ['/ckeditor/ckeditor-4.x/rel/contents.css', '/sCSS/37.0/spritesTheme3/default/gc/CKEditor.css', '/sCSS/37.0/spritesTheme3/default/gc/HtmlDetailElem.css'],
            disableNativeSpellChecker: true,
            language: 'en-us',
            allowIframe: false,
            width:330,
            sharedSpaces: {top: 'cke_topSpace', bottom: ' cke_bottomSpace'}, 
            filebrowserImageUploadUrl: '/_ui/common/request/servlet/RtaImageUploadServlet'
        });
        CKEDITOR.instances[sFieldName].on('instanceReady', function(){
            self._parent.checkPopupVisiblility();
        });
    }
    
    self._clearCKEditor = function(){
        if (typeof(CKEDITOR) != 'undefined' && !jQuery.isPlainObject(CKEDITOR.instances)) {
            self._dom.form.children('div[data-name]').each(function(oEl){
                oEl = jQuery(oEl);
                if (CKEDITOR.instances[oEl.data('name')] != undefined ) {
                    CKEDITOR.instances[oEl.data('name')].destroy(true);
                    delete CKEDITOR.instances[oEl.data('name')];
                }
            });
        }    
    }
    
    
    self._showMessage = function(sText, sStatus) {
        if (sStatus != null && sStatus != undefined && sStatus != '' && sStatus.indexOf('Message text:') >= 0) {
            var nPos = sStatus.indexOf('Message text:') + 13,
                nLastPos = sStatus.indexOf('(', nPos),
                sAddText = sStatus.substring(nPos, nLastPos >= 0 ? nLastPos : 0).trim();
            if (sAddText != '') {
                sText += ": " + sAddText;
            }
        }
        self._dom.el.addClass('_message');
        self._dom.message.text(sText);
    }
    
    self._fieldReference = function(aField) {
        if (aField.name == 'recordtypeid') {
            return self._fieldRecordtype(aField);
        }
        if (typeof(openLookup) != 'undefined' 
            && (self._parent.params.useSFLookup !== 'never'
                && (aField.filteredLookup === true || self._parent.params.useSFLookup === true || self._parent.params.useSFLookup === 'always')
            )
        ){
            return self._fieldReferenceSF(aField);
        }
        
        
        var sHTML =  
            '<input type=hidden '
            + 'name="' + aField.name + '_id" '
            + "value=''" 
            + ">"
            + '<input type=text class="ca_filter_reference'
            + '"'
            + ' name="' + aField.name + '" '
            + " value=''"
            + " data-value=''"
            + " data-value_id=''" //000000000000000000
            + ' autocomplete="off" '
            + " placeholder='" + self._parent.getText('message_type_to_search', 'Type to search')  + "'" 
            + ">"
            + '<span class="simple_button" data-action="show_references">&gt;</span>'
            ;
        return sHTML;            
    }
    
    self._fieldReferenceSF = function(aField) {
        var sSelectType = self._getFieldSelectedType(aField.name);
        if (sSelectType == '') {
            sSelectType = aField.options[0].key;
        }
        var fName = aField.id != undefined ? 'CF' + aField.id : aField.name,
            sHTML = '<input type="hidden" value="000000000000000" id="' + fName + '_lkid" name="' + fName + '_lkid" />'
            + '<input type="hidden" value="null" id="' + fName + '_lkold" name="' + fName + '_lkold" />'
            + '<input type="hidden" value="' + sSelectType + '" id="' + fName + '_lktp" name="' + fName + '_lktp" />'
            + '<input type="hidden" value="0" id="' + fName + '_lspf" name="' + fName + '_lspf" />'
            + '<input type="hidden" value="0" id="' + fName + '_lspfsub" name="' + fName + '_lspfsub" />'
            + '<input type="hidden" value="0" id="' + fName + '_mod" name="' + fName + '_mod" />'
            + '<input type=text class="ca_filter_reference_sf"'
            + ' name="' + fName + '" '
            + " value= ''"
            + ' autocomplete="off" '
            + " placeholder='" + self._parent.getText('message_type_to_search', 'Type to search') + "'" 
            + " id='" + fName + "'"
            + ">"
            + '<input type=hidden '
            + 'name="' + aField.name + '_id" '
            + "value=''" 
            + ">"
            + '<span class="simple_button" data-action="show_references_SF">&gt;</span>'
            ;
        return sHTML;
    }
    
    
    self._fieldRecordtype = function(aField) {
        var sHTML = '<select name=' + aField.name + ' class="_ca_recordtype"></select>';
        return sHTML;
    }
    
    self._fieldText = function(aField)  {
        var sHTML = '<input '
            + ' type="text" '
            + ' name="' + aField.name + '" '
            + ' value="' + (aField.value != undefined ? aField.value.htmlspecialchars() : "") + '" '
            + (aField.isRequired || aField.isRequiredCustom == 'true' ? " required='required' " : "")
            + '>';
        return sHTML;
    }
    
    self._fieldTextarea = function(aField)  {
		
		var sHTML;
		if(!aField.isHTML)
		{
			sHTML = '<textarea  name="' + aField.name + '" '
			+ (aField.isRequired || aField.isRequiredCustom == 'true' ? " required='required' " : "")
			+ '>'
			+ (aField.value != undefined ? aField.value.htmlspecialchars() : "")
			+ '</textarea>';
		} 
		else {
			sHTML = '<textarea  Id = "' + aField.name + '" name="' + aField.name + '" '
			+ (aField.isRequired || aField.isRequiredCustom == 'true' ? " required='required' " : "")
			+ '>'
			+ (aField.value != undefined ? aField.value.htmlspecialchars() : "")
			+ '</textarea>';
		}
		
        return sHTML;
    }
    
    self._fieldHTML5 = function(aField) {
        var aHTML5Fields = {
            "EMAIL"     : {"type" : "email"},
            "PHONE"     : {"type" : "tel"},
            "URL"       : {"type" : "url"},
            "INTEGER"   : {"type" : "number", "step" : 1},
            "DOUBLE"    : {"type" : "number", "step" : 0.01},
            "PERCENT"   : {"type" : "number", "step" : 0.1},
            "CURRENCY"  : {"type" : "text"} //, "step" : 0.01
        }
        if (aField['attr'] != undefined) {
            aHTML5Fields[aField.type] = jQuery.extend(aHTML5Fields[aField.type], aField['attr']);
        }
        if (aHTML5Fields[aField.type]['step'] != undefined) {
            var sPattern = '^[\-]?[0-9]*';
            if (aHTML5Fields[aField.type]['step'] < 1) {
                sPattern += '[.,]?';
                sPattern += '[0-9]{0,' + (('' + aHTML5Fields[aField.type]['step']).length - 2) + '}';
            }
            sPattern += '$';
            aHTML5Fields[aField.type]['pattern'] = sPattern;
        }
        var sHTML = '<input  '
            + ' type="' + aHTML5Fields[aField.type].type + '" '
            + ' name="' + aField.name + '" '
            + (aField.isRequired || aField.isRequiredCustom == 'true' ? " required='required' " : "")
            + ' value="' 
                + (aField.value != undefined 
                    ? (typeof(aField.value) == 'string' ? aField.value.htmlspecialchars() : aField.value)
                    : ""
                ) 
            + '" '
        jQuery.each(aHTML5Fields[aField.type], function(sKey, sVal){
            sHTML += ' ' + sKey + '="' + sVal + '" ';
        });
        sHTML += '>';
        return sHTML;
    }
    
    
    self._fieldDate = function(aField) {
        var sHTML = '<input '
            + ' class="ca_datetime" '
            + ' type="text" '
            + ' name="' + aField.name + '" '
            + ' value="' + (aField.value != undefined ? aField.value : "").htmlspecialchars() + '" '
            + (aField.isRequired || aField.isRequiredCustom == 'true' ? " required='required' " : "")
            + '>';
        return sHTML;
    }
    
    self._fieldDatalist = function(aField) {
        var sValue = aField.value != undefined ? aField.value : '';
        if (!self._bEdit && sValue == '' && aField.options != undefined && aField.options.length > 0) {
            for (var nI = 0; nI < aField.options.length; nI++) {
                if (aField.options[nI]['default'] != undefined 
                    && (aField.options[nI]['default'] == 'true' || aField.options[nI]['default'] == true) 
                ) {
                    sValue = aField.options[nI].value;
                    break;
                }
            }
        }
        var sOptions = JSON.stringify(aField.options)
            .replace(/"/g, "&quot;");
        var sHTML = '<span class="ca_datalist"><input type=text class="ca_datalist"'
            + ' name="' + aField.name + '" '
            + ' data-options="' + sOptions + '" '
            + '  '
            + ' value="' + sValue.htmlspecialchars() + '"></span>'
        
        return sHTML;
    }
    
    self._fieldSelect = function(aField) {
        if (aField.multiselect == undefined && aField.type == 'MULTIPICKLIST'){
            aField.multiselect = true;
        }
        var mValue = (aField.value == undefined || aField.value == '') 
            ? [] 
            : aField.value,
            sKey, sLabel;
        if (typeof(mValue) == 'string')  {
            mValue = mValue.split(/[,|;]/g);
        }
        if (!self._bEdit 
            && mValue.length == 0
            && aField.options != undefined 
            && aField.options.length > 0
            && aField.isDependent != true
        ) {
            for (var nI = 0; nI < aField.options.length; nI++) {
                if (aField.options[nI]['default'] != undefined 
                    && (aField.options[nI]['default'] == 'true' || aField.options[nI]['default'] == true) 
                ) {
                    mValue.push(aField.options[nI].value);
                }
            }
        }
        var sHTML = '<select '
            + (aField.isDependent == true ? ' data-sub_dependent="true" ' : "") 
            + ' name="' + aField.name + '" '
            + (aField.multiselect && aField.multiselect != 'false' ? " multiple" : "")
            + ">";
        if (aField.multiselect != 'true' && aField.multiselect != true 
            && (aField.isDependent == true 
            || (aField.isRequired != true 
            //&& aField.isRequiredCustom != 'true' 
            ))
        ) {
            sHTML += '<option value="">--None--</option>';
        }
        if (typeof(aField.options) != undefined && aField.options.length > 0){
            for(var i = 0; i < aField.options.length; i++) {
                if (aField.options[i].name == undefined) {
                    aField.options[i].name = aField.options[i].value ;
                }
                sKey = aField.options[i].key != undefined ? aField.options[i].key : aField.options[i].value;
                sLabel = aField.options[i].value != undefined ? aField.options[i].value : aField.options[i].name;
                
                sHTML += '<option '
                    + ' value="' + sKey.htmlspecialchars() + '"'
                    + (mValue.length > 0 && mValue.indexOf(sKey) >= 0 
                        ? " selected " 
                        : ""
                    )
                    + '>' 
                    + sLabel.htmlspecialchars()
                    + '</option>';
            }
        }
        sHTML += '</select>';

        return sHTML;
    }
    
    self._fieldBoolean = function(aField) {
        var sHTML = '<input '
            + 'name="' + aField.name + '" '
            + 'type="checkbox" '
            + (aField.value ? ' checked ' : "")  
            + ' />';
        return sHTML;	
    }
    
		
    self._checkRequired = function() {
        var bResult = true,
            oPattern = new RegExp('^[0-9]+[\.,]{0,1}[0-9]*$', 'i'),
            oRow, el, bRequired, mVal, aField, sType,
            oCheckPattern = new RegExp();
        self._dom.form.children('div:not(._hide)').removeClass('_fire').each(function() {
            oRow = jQuery(this);
            bRequired = oRow.is('.required');
            sType = oRow.children('span[data-type]').data('type');
            el = oRow.find('input[name^="' + oRow.data('name') + '"], select[name^="' + oRow.data('name') + '"], textarea');
            mVal = el.val();
            aField = self._getField(oRow.data('name'));
            switch (sType ) {
                case 'MULTIPICKLIST':
                    if (bRequired && el.children('option:selected').size() < 1) {
                        bResult = false;
                        return false;
                    }
                    break;
                case 'DATE' :
                case 'DATETIME' :
                    var d = mVal != '' ? self._getDatetime(aField, true) : null;
                    if ((bRequired && mVal == '') 
                        || (
                            mVal != undefined && mVal != ''
                            && (!d.isValid() || d.getTime() == 0)
                            )
                        ) {
                        bResult = false;
                        return false;
                    }
                    break;
                case 'CURRENCY' :
                    mVal = self._convertCurrency(mVal);
                    
                case 'NUMBER'   :
                case 'INTEGER'  :
                case 'PERCENT'  :
                case 'DOUBLE'   : 
                    if ((bRequired && mVal == '') 
                        || (mVal != '' && !oPattern.test(mVal))
                    ){
                        bResult = false;
                        return false;
                    } 
                    if (
                        (el.attr('min') != undefined && parseFloat(mVal) < parseFloat(el.attr('min')))
                        ||
                        (el.attr('max') != undefined && parseFloat(mVal) > parseFloat(el.attr('max')))
                    ) {
                        bResult = false;
                        return false;
                    }
                    break;
                case 'REFERENCE' :
                    if (bRequired) {
                        mVal = self._getReference(aField); // mVal || 
                        if (mVal == 'null' || mVal == '' || mVal == '000000000000000') {
                            bResult = false;
                            return false;
                        }
                    }
                    break;
                default:
                    if (bRequired && mVal == '') {
                        bResult = false;
                        return false;
                    }
                    break;
            }
            if (el.attr('pattern') != undefined && el.attr('pattern') != '') {
                oCheckPattern.compile(el.attr('pattern'));
                if (!oCheckPattern.test(mVal)) {
                    bResult = false;
                    return false;
                }
            }
        });
        if (!bResult && oRow.size() > 0) {
            oRow.addClass('_fire');
            el.focus();
        }
        if (bResult 
            && self._objectSpecial[self._aCalendar.objectName] != undefined 
            && typeof(self._objectSpecial[self._aCalendar.objectName].check) == 'function'
        ){
            bResult = self._objectSpecial[self._aCalendar.objectName].check();
        }
        return bResult;
    }
    
    self._prepareData = function() {
        var aResult = self._getFormFieldValues();
       
        if (self._objectSpecial[self._aCalendar.objectName] != undefined 
            && typeof(self._objectSpecial[self._aCalendar.objectName].get) == 'function'
        ){
            aResult = jQuery.extend(aResult, self._objectSpecial[self._aCalendar.objectName].get(aResult));
        }
        if (self._params.predefine != undefined && self._params.setPredefine === true) {
            for (var nJ = 0; nJ < self._params.predefine.length; nJ++) {
                var sFieldName = self._params.predefine[nJ].calendarFieldName != undefined
                    && self._params.predefine[nJ].calendarFieldName[self._aCalendar.id] != undefined
                    ? self._params.predefine[nJ].calendarFieldName[self._aCalendar.id]
                    : self._params.predefine[nJ].name;
                if (self._params.predefine[nJ].value == undefined || self._params.predefine[nJ].value == ''
                    || self._params.predefine[nJ].oper != "equal"
                    || aResult[sFieldName] != undefined
                ) {
                    continue;
                }
                aResult[sFieldName] = '' + self._params.predefine[nJ].value;
            }
        }
        return aResult;
    }
    
    self._getFormFieldValues = function(aFields) {
        var aResult = {};
        if (aFields != undefined && typeof(aFields) == 'string') {
            aFields = [aFields];
        }
        self._dom.form.children('div[data-name]').each(function() {
            var el = jQuery(this);
            if (aFields != undefined && aFields.indexOf(el.data('name')) < 0) {
                return;
            }
            var aField = self._getField(el.data('name'));
            
            
            if (aField != undefined && typeof(self['_get' + aField.type.capitalize()]) != 'undefined') {
                aResult[el.data('name')] = self['_get' + aField.type.capitalize()](aField);
            }  else if (aField != undefined && aField.isHTML 
                && CKEDITOR !== undefined
                && CKEDITOR.instances[aField.name] != undefined
            ) {
                aResult[el.data('name')] = CKEDITOR.instances[aField.name].getData();  
            } else {
                aResult[el.data('name')] = el.find('[name="' + el.data('name') + '"]').val();
            } 
            
        });
        
        return aResult;
       
    }
    
    self._setValues = function(aData) {
        var nI, aField;
        for (nI = 0; nI < self._structure.create.length; nI++) {
            aField = self._getField(self._structure.create[nI].name);
            if (aField == undefined 
                    || aField == null 
                    || (aField.isCreateable == false && aField.isUpdateable == false)  
                    || (aField.isUpdateable == "false" && aField.isCreateable == 'false')
                    || aField.name == self._structure.start
                    || aField.name == self._structure.end
                    || typeof(aData.data) == 'undefined'
                    || typeof(aData.data[aField.name]) == 'undefined'
                    || self._aRestrictField.indexOf(aField.name) >= 0
            ) {
                continue; 
            }
            if (typeof(self['_set' + aField.type.capitalize()]) != 'undefined') {
                self['_set' + aField.type.capitalize()](aField, aData.data[aField.name], aData.data, aData['default'] === true);
            } else {
                if (aField.isHTML && typeof(CKEDITOR) != 'undefined') {
                    if (CKEDITOR.instances[aField.name]) {
//                        CKEDITOR.instances[aField.name].destroy();
                        CKEDITOR.instances[aField.name].setData(aData[aField.name]);	
                        //CKEDITOR.instances[aField.name].setData(aData[aField.name]);
                    } else {
                        self._ckeditorReplace(aField.name);
                    }
                }    
	            
                self._dom.form.children('div[data-name="' + aField.name + '"]')
                    .find(
                        'input[type!="hidden"], select, textarea'
                    ).val(aData.data[aField.name]);
                
            }
        }
        if (typeof(self._aCalendar.objectName) != 'undefined'
            && self._objectSpecial[self._aCalendar.objectName] != undefined 
            && typeof(self._objectSpecial[self._aCalendar.objectName].set) == 'function'
        ){
            self._objectSpecial[self._aCalendar.objectName].set(aData);
        }

        
    }
    
    self._setBoolean = function(aField, mValue) {
        if (mValue == '1' || mValue == true || mValue == 'true' || mValue == 'on') {
            self._dom.form.children('div[data-name="' + aField.name + '"]')
                    .find('input[type="checkbox"]').attr('checked', true);
                    
        }
    }
    
    self._setDate = function(aField, mValue) {
        if (mValue == undefined || mValue == '') {
            return;
        }
        var dDate = Date.preParseSF(mValue, 'DATE');
        if (dDate.getTime() != 0) {
            self._dom.form.children('div[data-name="' + aField.name + '"]')
                .find('input').val(dDate.format(self._parent.options.format['date'])); //'yyyy-mm-dd'
                    
        }
    }
    
    self._setDatetime = function(aField, mValue) {
        var dDate;
        if (typeof(mValue) == 'object' && Date.baseDate(mValue).isValid()) {
            dDate = Date.baseDate(mValue);
        } else if ((dDate = Date.preParseSF(mValue, 'DATETIME')).isValid()) {
            
        } else {
            var aMatch = mValue != null 
                ? mValue.match(/[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}/)
                : null;
            if (aMatch != null && aMatch.length > 0) {
                mValue  = mValue.replace(' ', 'T');
            }
            if (mValue == undefined || mValue == '' || mValue == null) {
                return;
            }
            dDate = Date.baseDate(mValue);
        }
        
        if (dDate.getTime() != 0) {
            self._dom.form.children('div[data-name="' + aField.name + '"]')
                .find('input').val(dDate.format(self._parent.options.format['datetime'])); // 'yyyy-mm-dd hh:ii:ss'
                    
        }
    }
    
    self._setReference = function(aField, mValue, aAllData) {
        var oDiv = self._dom.form.children('div[data-name="' + aField.name + '"]');
        if (aField.name == 'recordtypeid') {
            if (mValue != undefined) {
                self._parent._addQueue(function(){
                    self._parent._objects.checkRecordType(self._aCalendar.objectName, mValue, function(aDepData, aOptions, aDefault){
                        oDiv.find('select[name="' + aField.name + '"]').val(mValue);
                        if (aDepData != null && aDepData !== false) {
                            self._rebuildDependent(aDepData, true);
                        }
                    });    
                });
            }
        } else {
            var sText = (aAllData[aField.name + '_name'] != undefined && aAllData[aField.name + '_name'] != null)
                    ? aAllData[aField.name + '_name']
                    : (
                        (aAllData[aField.name + '.name'] != undefined && aAllData[aField.name + '.name'] != null)
                            ? aAllData[aField.name + '.name']
                            : mValue
                    )
            oDiv.find('input[name="' + aField.name + '_id"][type="hidden"]').val(mValue);
            oDiv.find('input[name$="_lkid"][type="hidden"]').val(mValue);
            oDiv.find('input[type="text"]').val(sText).data('value', sText).data('value_id', mValue);
        }
    }
    
    self._setMultipicklist = function(aField, mValue, aAllData, bIsDefault) {
        
        var oDiv = self._dom.form.children('div[data-name="' + aField.name + '"]'),
            aEl = oDiv.find('select'),
            aList = (typeof(mValue) == 'string') ? mValue.split(/[,|;]/) : mValue;
        if (self._bEdit 
            || (self._params.eventId != undefined && self._params.eventId != '')
            || (bIsDefault && aEl.data('sub_dependent') !== true)
        ) { 
            aEl.val(aList);
        }
    }
    
    self._setPicklist = function(aField, mValue, aAllData, bIsDefault) {
        var aEl = self._dom.form.children('div[data-name="' + aField.name + '"]').find('select'),
            bDependent = aEl.data('sub_dependent') === true;
        if ((self._bEdit 
            || (self._params.eventId != undefined && self._params.eventId != '')
            || (bIsDefault && !bDependent)) 
        ) {
            aEl.val(mValue);
        }
        
    }
    
    self._setCombobox = function(aField, mValue) {
        var oDiv = self._dom.form.children('div[data-name="' + aField.name + '"]'),
            aEl = oDiv.find('select'),
            aInput = oDiv.find('input'),
            mVal = mValue;
        if (aField.options != undefined) {
            for (var nJ = 0; nJ < aField.options.length; nJ++) {
                if (aField.options[nJ].key != undefined && mVal == aField.options[nJ].key) {
                    mVal = aField.options[nJ].value != undefined 
                        ? aField.options[nJ].value 
                        : aField.options[nJ].name;
                    break;
                }
            }
        }
        aEl.val(mValue);
        aInput.val(mVal);
        
    }
    
//    self._setCurrency = function(aField, mValue){
//        
//    }
    
    self._setNumber = function(aField, mValue){
        self._setDouble(aField, mValue);
    }
    
    self._setDouble = function(aField, mValue){
        if (mValue == '' || mValue == null) {
            return;
        }
        var aEl = self._dom.form.children('div[data-name="' + aField.name + '"]').find('input');
        if (aField.attr == undefined || aField.attr.step == undefined) {
            aEl.val(mValue);
            return;
        }
        if (aField.attr.step == 1) {
            aEl.val(parseInt(mValue));
            return;
        }
        var nLevel = ('' + aField.attr.step).length - 2,
            nPow = Math.pow(10, nLevel);
        aEl.val('' + (Math.round(parseFloat(mValue) * nPow) / nPow));
    }
    
    self._setPercent = function(aField, mValue){
        self._setDouble(aField, mValue);
    }
    
    self._setInteger = function(aField, mValue){
        self._setDouble(aField, mValue);
    }
    
    self._getBoolean = function(aField) {
        var aEl = self._dom.form.children('div[data-name="' + aField.name + '"]')
            .find('input[type="checkbox"]');
        return aEl.is(':checked') ? "on" : "off";
    }
    
    
    
    
    self._convertCurrency = function(sVal) {
        if (self._parent.options.format['coma'] != undefined && self._parent.options.format['coma'] != '') {
            sVal = sVal.replace(self._parent.options.format['coma'], "");
        }
        if (self._parent.options.format['dot'] != undefined && self._parent.options.format['dot'] != '.') {
            sVal = sVal.replace(self._parent.options.format['dot'], ".");
        }
        return sVal;
    }
    
    self._getCurrency = function(aField) {
        var aEl = self._dom.form.children('div[data-name="' + aField.name + '"]')
            .find('input');
        return self._convertCurrency(aEl.val());
    }
    
    
    self._getField = function(sFieldName) {
        return self._aObject.fields[sFieldName];
    }
    
    self._getMultipicklist = function(aField) {
        var oDiv = self._dom.form.children('div[data-name="' + aField.name + '"]'),
            aEl = oDiv.find('select'),
            oInput = oDiv.find('input'),
            mVal = aEl.val(),
            bMultiple = aEl.attr('multiple') != undefined && aEl.attr('multiple');
        if (oInput.size() > 0 && (!bMultiple)) {
            var mVal = oInput.val().trim(),
                aOpt = oInput.data('options');
            if (aOpt != undefined) {
                for (var nJ = 0; nJ < aOpt.length; nJ++){
                    if (aOpt[nJ].value === mVal && aOpt[nJ].key != undefined) {
                        mVal = aOpt[nJ].key;
                        break;
                    }
                }
            }
            return mVal;
        }
        if (mVal == undefined) {
            return bMultiple ? '' : undefined;
        } else if (mVal == '') {
            return '';
        }
        if (aEl.attr('multiple') != undefined) {
            return aEl.val().join(';');
        } else {
            return aEl.val();
        }
    }
    
    self._getPicklist = function(aField) {
        return self._getMultipicklist(aField);
    }
    self._getCombobox = function(aField) {
        return self._getMultipicklist(aField);
    }
    
    self._getDatetime = function(aField, bDateObject) {
        bDateObject = bDateObject || false;
        var aEl = self._dom.form.children('div[data-name="' + aField.name + '"]')
            .find('input'),
            sFormat = aField.type == 'DATETIME'
                ? self._parent.options.format['datetime']
                : self._parent.options.format['date'];
        if (aEl.size() == 0 || aEl.val() == undefined || aEl.val() == '') {
            return bDateObject ? null : '';
        }
        var dDate = Date.preParse(aEl.val(), sFormat);
        if (dDate.isValid()) {
            return bDateObject ? dDate : dDate.format('yyyy-MM-ddThh:ii:ss');
        } else {
            return '';
        }
    }
    
    self._getDate = function(aField) {
        return self._getDatetime(aField);
    }
    
    self._getReference = function(aField) {
        var aRow = self._dom.form.children('div[data-name="' + aField.name + '"]'),
            aEl;
        if (aField.name == 'recordtypeid' ) {
            aEl = aRow.find('select[name="' + aField.name + '"]');
        } else {
            aEl = aRow.find('input[name$="_lkid"][type="hidden"]');
            if (aEl.size() < 1) {
                aEl =  aRow.find('input[name="' + aField.name + '_id"][type="hidden"]');
            }
            if (self._bEdit && aEl.val() == '' && aField.name != 'ownerid')  {
                return 'null';
            }
        }
        return aEl.val();
    }




    self._referenceSelector = function(evt) {
        var el = jQuery(evt.currentTarget),
            oRow = el.parents('div[data-name]'),
            sText = el.val(),
            aField = el.data('field'),
            nI, nJ;
    
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
        if (aField == undefined) {
            var sField = oRow.data('name');
            aField = self._getField(sField);
            el.data('field', aField);
        }
        if (sText == '') {
            oRow.find('[name="' + oRow.data('name') + '_id"]').val(''); // 000000000000000000
            if (evt.which == 8 || evt.which == 46) {
                self._dom.selector.removeClass('show');
                return;
            }
        }        
        var aResult = self._findReferences(aField, sText);
        self._showReferenceSelect(el, aResult, aField.server, sText);
    }
    
    self._referenceSelectorSF = function(evt) {
        var el = jQuery(evt.currentTarget),
            oRow = el.parents('div[data-name]'),
            sText = el.val(),
            bMultiple = oRow.data('multiple'),
            sId = oRow.find('#whoid_lkid').val();
        if (bMultiple && sText != '' && sId != '') {
            self._setReferencePosition(sText, sId, el);
            el.val('');
            oRow.find('#whoid_lkid').val('')
        } else if (sText == '') {
            oRow.find('input[type="hidden"][name$="_lkid"]').val('');
        }
           
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
                if (['CURRENT_USER', 'CURRENT_PROFILE', "CURRENT_TEAM"].indexof(aNames[nJ]) >= 0) {
                    continue;
                }
                if (sText == undefined 
                    || sText == '' 
                    || aNames[nJ].indexOf(sText) >= 0
                ) {
                    aResult.push({"id" : aIds[nJ], "name" : aNames[nJ]});
                }
            }
        }
        return aResult;
    }
    
    self._showReferenceSelect = function(el, aList, bNeedRemote, sText) {
        var sField = el.parents('[data-name]').data('name'),
            aField = self._getField(sField);
        self._bRecordType = false;
        if (self._dom.selector.hasClass('show') && self._dom.selector.data('field') === sField){
            
            self._dom.selector.data('page', 0).data('text', sText);
            self._dom.selector.find('.relative_title').addClass('_off');
            self._dom.selector.find('[data-action="add_relative"]').removeClass('_off');
            self._requestListFromServer(sField, sText);
            return;
        }
        var sHTML = '<div class="remote">'
                        + '<span class="relative_title _off"></span>'
                        + '<span data-action="prev_selector" class="simple_button _off" title="'
                        + self._parent.getText('previous', 'Previous') 
                        + '">&lt;</span>'
                        + '<span data-action="next_selector" class="simple_button _off" title="'
                            + self._parent.getText('next', 'Next') 
                            + '">&gt;</span>'
                        + (self._parent.options.readonly !== true && self._parent.options.readonly.detail !== false
                            ? '<span data-action="add_relative" class="simple_button '
                                + (sField.indexOf('recordtypeid') >= 0 ? '_off' : '') 
                                + '" ' 
                                + ' title="' 
                                + self._parent.getText('create_add_new_record', 'Add new record') 
                                + '">+</span>'
                            : ""
                        )
                        + '<select class="type_selector" title="' 
                            + self._parent.getText('message_select_type_of_object', 'Select type of object')
                            + '"></select>'
                        + '<span data-action="search_selector" class="simple_button _off _search" title="'
                            + self._parent.getText('search', 'Search') 
                            + '"><b></b></span>'
                    + '</div>'
                    + '<span data-action="close_selector" class="close_selector">X</span>'
                    + '<div class="list scroll_pad_r">' +  self._buildSelectorList(aList) + '</div>'
                    + '<div class="search ca_filtering_panel"></div>';
        
        var aOffset = el.offset(), 
            oPopupOffset = self._dom.el.parent().offset(),
            sSelectType = self._getFieldSelectedType(sField);
        aOffset.left -= parseInt(oPopupOffset.left) + 8;
        aOffset.top -= parseInt(oPopupOffset.top) - 8;
        aOffset.bottom = 'auto';
        self._dom.selector
            .html(sHTML)
            .css(aOffset)
            .addClass('show')
            .data('text', sText)
            .data('page', 0)
            .data('field', sField)
            .data('el', el);
        self._aLookupFilters.length = 0;
        self._sLookupSort = "";
        if (aField.options.length > 1) {
            sHTML = '';
            for (var nI = 0; nI < aField.options.length; nI++) {
                sHTML += '<option value="' + aField.options[nI].key + '" ' 
                    + (sSelectType == aField.options[nI].key 
                        || ((sSelectType == undefined || sSelectType == '')
                            && nI == 0
                        )
                        ? 'selected' 
                        : ''
                    )
                    + '>'
                    + aField.options[nI].value.htmlspecialchars()
            }
            self._dom.selector.find('select').html(sHTML).addClass('on');
        }
        self._requestListFromServer(sField, sText);
    }
    
    
    self._requestListFromServer = function(sField, sText) {
        if (self._nTimer != null) {
            clearTimeout(self._nTimer);
            self._nTimer = null;
        }
        sField = sField != undefined ? sField : self._dom.selector.data('field');
        sText = sText != undefined ? sText : self._dom.selector.data('text');
        var nPage = self._dom.selector.data('page') == undefined ? 0 : self._dom.selector.data('page'),
            aField = self._getField(sField),
            sObj = self._dom.selector.find('select').size() > 0 ? self._dom.selector.find('select').val() : '',
            aAdditonalRequestFields = sObj != '' || aField.options.length == 1 ? [] : null,
            aAdditonalFields = [],
            bAdditonalFieldsSearch = false;
        
        if (sObj == null || sObj ==  '' ) {
            sObj = aField.options[0].key;
            if (aAdditonalRequestFields == null) {
                aAdditonalRequestFields = [];
            }
        }
        var aQ = [];
        if (aAdditonalRequestFields != null) {
            var sObjName = self._parent._objects.getObjectNameByPrefix(sObj);
            aQ.push(function(){
                
                if (sObjName != '' 
                    && self._aLookupFields[sObjName] != undefined 
                    && !self._parent._objects.isObjectLoaded(sObjName)
                ) {
                    self._parent._objects.getObjects(sObjName, function(aObjs){}, 
                    {
                        loadReferenced : true, 
                        "onlySingleReference" : true
                    });
                }
            });
            aQ.push(function(){
                if (sObjName != '' && self._aLookupFields[sObjName] != undefined) {
                    for (var nF = 0; nF < self._aLookupFields[sObjName].length; nF++) {
                        var aAddFld = self._parent._objects.getObjectFieldByName(sObjName, self._aLookupFields[sObjName][nF].name);
                        if (aAddFld != null) {
                            aAdditonalRequestFields.push(self._aLookupFields[sObjName][nF].name);
                            aAdditonalFields.push(aAddFld);
                            if (self._aLookupFields[sObjName][nF].search) {
                                bAdditonalFieldsSearch = true;
                            }
                        }
                    }
                }
                if (aAdditonalRequestFields.length == 0) {
                    aAdditonalRequestFields = null;
                }
            });
        }
        
        
        aQ.push(function(){
            if (aField.server === true) {
                self._nTimer = setTimeout(function(){
                    self._parent._objects.getFieldOptions(
                        {
                            cid  : self._selectedCalendar,
                            fid  : sField,
                            text : sText,
                            page : nPage,
                            obj  : sObj,
                            hm : 10,
                            fields : aAdditonalRequestFields != null ? aAdditonalRequestFields.join(',') : null,
                            filters : self._aLookupFilters.length > 0 ? self._aLookupFilters : null,
                            sort    : self._sLookupSort
                        },
                        function(aList, aPagesOption){
                            if (aList == undefined) {
                                aList = [];
                            }
                            self._bRefColumns = aPagesOption.columns === true;
                            self._buildSelectorByText(sField, sText, aList, aAdditonalFields);
                            self._dom.selector.find('[data-action="next_selector"]').toggleClass('_off', aPagesOption.next !== true);
                            self._dom.selector.find('[data-action="prev_selector"]').toggleClass('_off', aPagesOption.prev !== true);
                            self._dom.selector.find('[data-action="search_selector"]').toggleClass('_off', bAdditonalFieldsSearch !== true);
                            self._dom.selector.toggleClass('_columns', aPagesOption.columns === true);
                            self._checkSelectorPosition();
                        }
                    );
                }
                , 200);
            } else {
                self._buildSelectorByText(sField, sText);
            }
        });
        self._parent._addQueue(aQ);
    }

    self._buildSelectorByText = function(mField, sText, aAddList, aAdditonalFields) {
        
        var aField = typeof(mField) == 'string' ? self._getField(mField) : mField,
            aList = self._findReferences(aField, sText);
        if (aAddList != undefined && aAddList.length > 0) {
            aList = aAddList;
        }
        if (self._sLookupSort == '') {
            aList.sort(function(a, b){
                return a.name > b.name;
            });
        }
        var sHTML = self._buildSelectorList(aList, aAdditonalFields);
        self._dom.selector.toggleClass('_empty', sHTML == '')
            .find('.list').html(sHTML);
        
    }
    
    self._buildSelectorList = function(aList, aAdditonalFields) {
        var sHTML = "", sColumns;
        if (!self._bRefColumns) {
            for (var nI = 0; nI <  aList.length; nI++) {
                sHTML += '<a data-id="' + aList[nI].id + '" '
                    + '>'
                    + (aList[nI].name != 'null' ? aList[nI].name : aList[nI].id).htmlspecialchars()
                    + '</a>';
            }
        } else if (aAdditonalFields != undefined && aAdditonalFields.length > 0) {
            sHTML += '<p><b data-action="sort_selector" data-field="name" ' 
                + (self._sLookupSort.indexOf('name') == 0 
                    ? 'class="' + (self._sLookupSort.indexOf('DESC') > 0 ? '_sel_up' : '_sel') + '"' 
                    : ''
                ) 
                + '>Name</b>' ;
            for (var nF = 0; nF < aAdditonalFields.length; nF++) {
                sHTML += '<b data-action="sort_selector" data-field="' + aAdditonalFields[nF].name + '" ' 
                    + (self._sLookupSort.indexOf(aAdditonalFields[nF].name) == 0 
                        ? 'class="' + (self._sLookupSort.indexOf('DESC') > 0 ? '_sel_up' : '_sel') + '"' 
                        : ''
                    ) 
                    + '>' + aAdditonalFields[nF].label + '</b>';
            }
            sHTML += '</p>';
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
    
    self._checkSelectorPosition = function() {
        if (self._dom.selector == undefined) {
            return;
        }
        var oParent = self._parent._dom.el,
            aParentOffsert = oParent.offset(),
            aSelectorOffset = self._dom.selector.offset(),
            aSelectorPosition = self._dom.selector.position(),
            nChange = 0;
            
        if (aSelectorOffset.top + self._dom.selector[0].offsetHeight > aParentOffsert.top + oParent[0].offsetHeight) {
            nChange = aSelectorPosition.top - (self._dom.selector.data('el').position().top - self._dom.selector[0].offsetHeight);
            if (aSelectorOffset.top - nChange < aParentOffsert.top) {
                nChange = aParentOffsert.top - (aSelectorOffset.top - nChange);
            }
            self._dom.selector.css('top', aSelectorPosition.top - nChange);
        }
        if (aSelectorOffset.left + self._dom.selector[0].offsetWidth > aParentOffsert.left + oParent[0].offsetWidth) {
            nChange = aSelectorPosition.left - (self._dom.selector.data('el').position().left - self._dom.selector[0].offsetWidth);
            if (aSelectorOffset.left - nChange < aParentOffsert.left) {
                nChange = aParentOffsert.left - (aSelectorOffset.left - nChange);
            }
            self._dom.selector.css('left', aSelectorPosition.left - nChange);
        }
    }
    
    self._referenceSelectorSelect = function(evt) {
        var aRow = self._dom.selector.data('el').parents('[data-name]'),
            el = jQuery(evt.currentTarget),
            sUrl = '',
            bMultiple = aRow.data('multiple');
            
        if (el.data('id') == undefined) {
            return;
        }    
        if (self._bRecordType) {
            sUrl = self._dom.selector.data('url') + '?RecordType=' + el.data('id');
            self._dom.el.data('field', undefined);
        } else {
            if (bMultiple) {
                self._setReferencePosition(el[0].tagName == 'A' ? el.text() : el.children('a').text(), el.data('id'));
            } else {
                var sText = el[0].tagName == 'A' ? el.text() : el.children('a').text();
                aRow.find('input[name="' + aRow.data('name') + '_id"]').val(el.data('id'));
                aRow.find('input[name="' + aRow.data('name') + '"]').val(sText)
                        .data('value', sText).data('value_id', el.data('id'));
            }
        }
        self._dom.selector.removeClass('show');
        if (sUrl != '') {
            self._parent.openExternalUrl(sUrl);
//            window.open(sUrl);
        }
    }

    self._setReferencePosition = function(sText, sId, el) {
        el = el || self._dom.selector.data('el');
        var oDiv = el.parent();
        var oWhoid = oDiv.find('input[name="whoid_id"]'),
            sValue = oWhoid.val();
        if (sValue == undefined) {
            sValue = '';
        }
        if (sId != '' && oWhoid.val().indexOf(sId) >= 0) {
            return;
        }
        oWhoid.val(sValue  + "," + sId);
        
        jQuery(
            '<span class="_reference" data-id="' + sId + '" title="' + sText.htmlspecialchars() + '">' 
            + sText.htmlspecialchars() 
            + '</span>'
        ).insertBefore(el);
        if (self._dom.selector != undefined) {
            self._close_selectorAction();
        }
    }
    
    self._removeReference = function(evt) {
        var el = jQuery(evt.target),
            oIds = el.siblings('input[type="hidden"]');
        oIds.val(oIds.val().replace(',' + el.data('id'), ''));
        el.remove();
    }
    
    
    
    self._show_references_SFAction = function(el, evt) {
        if (typeof(openLookup) == 'undefined') {
            return self._show_referencesAction(el, evt);
        }
        var dRow = jQuery(evt.target).parents('div[data-name]'),
            sField = dRow.data('name'),
            aField = self._getField(sField),
            sRealFieldName = aField.id == undefined ? sField : 'CF' + aField.id,
            aTextField = dRow.find('input[type="text"]'),
            sSearch = aTextField.val(),
            sObj = dRow.find('input[name$="_lktp"]').val(),
            aFilteredValues = [];
    
        if (aField.filteredLookupFields != undefined && aField.filteredLookupFields.length > 0) {
            for (var nF = 0; nF < aField.filteredLookupFields.length; nF++) {
                var aFieldValues = self._getFormFieldValues(aField.filteredLookupFields[nF]);
                aFilteredValues.push(
                    aFieldValues[aField.filteredLookupFields[nF]] == undefined
                        ? 'null'
                        : '"' +  aFieldValues[aField.filteredLookupFields[nF]] + '"'
                );
            }
        } else {
            aFilteredValues.push('null');
        }
    //            getElementByIdCS('" + sField + "').value.substring(0, 80)
        self._openLookup("/_ui/common/data/LookupPage?lkfm=popup_form&lknm=" + sRealFieldName 
            + "&lktp=" + sObj
            + '&lkfield=' + (aField.id == undefined 
                ? (aField.sfID != undefined ? aField.sfID.substring(0, 15) : sField)
                : aField.id.substring(0, 15))
            + '&lkent=' + self._parent._objects.getObjectPrefix(self._aCalendar.objectName)
            + '&dplp=[' + (self._params.eventId != undefined ? '"' + self._params.eventId + '"' : "null") + ','
                + aFilteredValues.join(',')
                + ']',
            670,
            '1',
            "&lksrch=" + self._escapeUTF(sSearch)
        );
//        self._showReferenceSelect(
//            aTextField, 
//            self._findReferences(aField, ''),
//            aField.server,
//            ''
//        );
            
    }
    
    
    self._show_referencesAction = function(el, evt) {
        var dRow = jQuery(evt.target).parents('div[data-name]'),
            sField = dRow.data('name'),
            aField = self._getField(sField),
            aTextField = dRow.find('input[name="' + sField + '"]');
        if (aTextField.size() < 1 && aField != undefined && aField.id != undefined) {
            aTextField = dRow.find('input[name="' + aField.id + '"], input[name="CF' + aField.id + '"]');
        } else {
            aTextField.filter('[type="text"]').focus();
        }
        self._showReferenceSelect(
            aTextField, 
            self._findReferences(aField, ''),
            aField.server,
            ''
        );
            
    }
    
    self._close_selectorAction = function(el, evt) {
        self._dom.selector.removeClass('show');
        if (self._dom.selector.data('field') != undefined) {
            var oRow = self._dom.form.children('div[data-name="' + self._dom.selector.data('field') + '"]'),
                oInput = oRow.find('input[type="text"][name="' + self._dom.selector.data('field') + '"]'),
                oInputId = oRow.find('input[type="hidden"][name="' + self._dom.selector.data('field') + '_id"]'),
                bMultiple = oRow.data('multiple');
            oInput.val(oInput.data('value'));
            if (bMultiple) {
                oInputId.val(oInputId.val() + oInput.data('value_id'));
            } else {
                oInputId.val(oInput.data('value_id'));
            }
        }
    }
    
    self._next_selectorAction = function(el, evt) {
        self._dom.selector.data('page', self._dom.selector.data('page') + 10);
        self._requestListFromServer();
    }
    
    self._prev_selectorAction = function(el, evt) {
        self._dom.selector.data('page', Math.max(self._dom.selector.data('page') - 10, 0));
        self._requestListFromServer();
    }
    self._sort_selectorAction = function(el, evt) {
        var oEl = jQuery(evt.target),
            aSerlected = self._sLookupSort.split(" ");
        if (aSerlected[0] == oEl.data('field')) {
            if (aSerlected.length > 1 && aSerlected[1] == 'DESC') {
                self._sLookupSort = aSerlected[0];
            } else {
                self._sLookupSort += ' DESC';
            }
        } else {
            self._sLookupSort = oEl.data('field');
        }
        self._dom.selector.data('page', 0);
        self._requestListFromServer();
    }
    
    self._add_relativeAction = function(el, evt) {
        var sField = sField != undefined ? sField : self._dom.selector.data('field'),
            sObj = self._dom.selector.find('select').size() > 0 ? self._dom.selector.find('select').val() : '',
            sUrl = '',
            sRealObj = '';
        if (sObj == null || sObj ==  ''  || sObj == '000') {
            sObj = self._getField(sField).options[0].key;
        }
        for (var nI = 0; nI < self._getField(sField).options.length; nI++) {
            if (self._getField(sField).options[nI].key == sObj) {
                sRealObj = self._getField(sField).options[nI].name;
                break;
            }
        }
        if (self._parent.options.detailUrl != '0' && self._parent.options.detailUrl != '') {
            sUrl = '//' + self._parent.options.detailUrl.split('/')[2] + '/' + sObj + '/e';
        } else {
            sUrl = '//' + document.location.href.split('/')[2] + '/' + sObj + '/e';
        }
        if (sRealObj == '') {
            self._parent.openExternalUrl(sUrl);            
//            window.open(sUrl);
            return;
        }
        self._parent._objects.getObjectStructure(sRealObj, function(aFields, aProp){
            aFields = Array.objectValues(aFields);
            var aRecordField = null;
            for (var nI = 0; nI < aFields.length; nI++) {
                if (aFields[nI].name == 'recordtypeid'){
                    aRecordField = aFields[nI];
                    break;
                }
            }
            if (aRecordField != null) {
                self._showRecordTypeSelector(sRealObj, aRecordField, sUrl);
            } else {
                if (sUrl != '') {
                    self._parent.openExternalUrl(sUrl);
//                    window.open(sUrl);
                }
            }
        });
    }
    
    self._search_selectorAction = function(){
        var oSearch = self._dom.selector.children('.search'),
            bOn = oSearch.hasClass('_on');
        if (oSearch.html() == '') {
            self._parent._initView('filteringPanel', function(){
                var oView = self._parent._getView('filteringPanel'),
                    aField = self._getField(self._dom.selector.data('field')),
                    sObj = self._dom.selector.find('select').size() > 0 
                        ? self._dom.selector.find('select').val() 
                        : '';
                
                if (sObj == null || sObj == '') {
                    sObj = aField.options[0].key;
                }
                var sObjName = self._parent._objects.getObjectNameByPrefix(sObj),
                    aSearchFields = [],
                    sSearchFields = '',
                    sFieldHTML;

                if (sObjName != '' && self._aLookupFields[sObjName] != undefined) {
                    for (var nF = 0; nF < self._aLookupFields[sObjName].length; nF++) {
                        if (!self._aLookupFields[sObjName][nF].search) {
                            continue;
                        }
                        var aAddFld = self._parent._objects.getObjectFieldByName(sObjName, self._aLookupFields[sObjName][nF].name);
                        sFieldHTML = oView.getReadyField(aAddFld);
                        if (sFieldHTML != null && sFieldHTML != '') {
                            sSearchFields += 
                                    '<div class="_search_field" '
                                        + ' data-field="' + sObjName + '|' + self._aLookupFields[sObjName][nF].name + '" ' 
                                        + ' data-type="' + aAddFld.type + '" '
                                        + '> '
                                        + '<b class="_title">' + aAddFld.label + '</b>'
                                        + '<span>' + sFieldHTML + '</span>'
                                    + '</div>';
                        }
                    }
                }
                if (sSearchFields != '') {
                    sSearchFields += '<div class="buttons form_buttons">'
                        + '<span data-action="cancel_search" >' 
                        + self._parent.getText('menu_cancel', 'Cancel') 
                        + '</span>'
                        + '<span data-action="apply_search" >' 
                        + self._parent.getText('search', 'Search') 
                        + '</span>'
                        + '</div>';
                    oSearch.html(sSearchFields);
                }
                
                oSearch.on('click.CA_FILTER', '.ca_datetime', function(evt){
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
            });
        };
        
        oSearch.toggleClass('_on', !bOn);
        self._dom.selector.children('.list').toggleClass('_off', !bOn);
    }
    
    self._cancel_searchAction = function(){
        self._dom.selector.children('.list').removeClass('_off');
        self._dom.selector.children('.search').removeClass('_on');
    }
    
    
    self._apply_searchAction = function(){
        var oView = self._parent._getView('filteringPanel'),
            aFilters = oView.getFilterFieldValue(self._dom.selector.children('.search'));
        if (aFilters != null && aFilters.length > 0) {
            for (var nJ = 0; nJ < aFilters.length; nJ++) {
                if (jQuery.isArray(aFilters[nJ].value))  {
                    aFilters[nJ].value = JSON.stringify(aFilters[nJ].value);
                }
            }
        }
            
        self._aLookupFilters = aFilters;
        self._cancel_searchAction();
        self._dom.selector.data('page', 0);
        self._requestListFromServer();
    }
    
    self._buildFiletringFields = function() {
        
    }
    
    self._showRecordTypeSelector = function(sRealObject, aField, sUrl) {
        var sField = aField.name;
        self._parent._objects.getFieldOptions(
            {
                fid  : sField,
                text : '',
                page : 0,
                obj  : aField['options'][0]['key'],
                hm   : 1000,
                fobj : sRealObject
            },
            function(aList, aPagesOption){
                if (aList == undefined) {
                    aList = [];
                }
                self._bRecordType = true;
                for (var nJ = 0; nJ < aList.length; nJ++) {
                    aList[nJ].id = aList[nJ].key;
                }
                self._buildSelectorByText(aField, '', aList);
                self._dom.selector.find('[data-action]').addClass('_off');
                self._dom.selector.find('select').removeClass('on');
                self._dom.selector.find('.relative_title').removeClass('_off')
                        .text(self._parent.getText('message_choose_record_type', 'Choose record type'));
                self._dom.selector.data('url', sUrl);
                self._checkSelectorPosition();
                
            }
        );
        
    }
    
    self._initDefault = function(mFilter) {
        if (mFilter == undefined) {
            return''
        }
        var aField, sVal,
            aJSONValue = ['MULTIPICKLIST', 'PICKLIST', 'COMBOBOX'];
//        console.log(mFilter);
        for (var nI = 0; nI < mFilter.length; nI++) {
            var sFieldName = mFilter[nI].calendarFieldName != undefined
                    && mFilter[nI].calendarFieldName[self._aCalendar.id] != undefined
                    ? mFilter[nI].calendarFieldName[self._aCalendar.id]
                    : mFilter[nI].name,
                mValue = mFilter[nI].value;

            
            
            aField = self._getField(sFieldName);
            
            sVal = '' + mFilter[nI].value;
            if (aField == undefined 
                || mFilter[nI].value == '***'
                || ['equal', 'includes', 'startsWith', 'contains'].indexOf(mFilter[nI].oper) == -1
            ) {
                continue;
            }
            if (aJSONValue.indexOf(aField['type']) >= 0) {
                if (mValue.substr(0, 1) == '[') {
                    mValue = JSON.parse(mValue);
                } else if (typeof(mValue) == 'string') {
                    mValue = mValue.split(',');
                } 
            }
//            con]sole.log(mFilter[nI]);
            switch(aField['type']) {
                case 'TEXT'     :
                case 'STRING'   :
                case 'TEXTAREA' :
                case "EMAIL"    :
                case "PHONE"    :                    
                case "URL"      :                    
                    self._default[sFieldName] = mFilter[nI].value;
                    break;
                case 'PICKLIST' :
                case 'COMBOBOX' :
                    self._default[sFieldName] = mValue.length > 0 ? mValue[0] : "";
                    break;
                case 'MULTIPICKLIST' :
                    self._default[sFieldName] = mValue;
                    break;
                case 'REFERENCE' :
                    if (['000000000000000000', 'CURRENT_USER', 'CURRENT_PROFILE', "CURRENT_TEAM"]
                        .indexOf(sVal.split(',')[0]) < 0
                        && sVal.indexOf(',') < 1
                    ) {
                        
                        self._default[sFieldName] = sVal.split(',')[0];
                        self._default[sFieldName + '_name'] = mFilter[nI].text.split('|||')[0];
                    }
                    break;
                case 'BOOLEAN'  :
                case 'DATE'     :
                case 'DATETIME' :
                default         :
                    self._default[sFieldName] = mFilter[nI].value;
                    break;
                    
            }
        }
        //console.log(mFilter);
    }
    
    self._setDefaultValues = function() {
        self._setValues({data : self._default, 'default' : true});
    }
    
    self._getFieldSelectedType = function(sField) {
        var aDefined = (typeof(localStorage)  == 'undefined'  || localStorage[self._selectedCalendar] == undefined)
            ? {}
            : jQuery.parseJSON(localStorage[self._selectedCalendar]);
        return typeof(aDefined[sField]) == 'undefined' ? '' : aDefined[sField];
    }
    
    self._setFieldSelectedType = function(sField, sType) { 
        sField = sField == undefined ? self._dom.selector.data('field') : sField;
        sType = sType == undefined ? self._dom.selector.find('select').val() : sType;
        var aDefined = (typeof(localStorage)  == 'undefined'  || localStorage[self._selectedCalendar] == undefined)
            ? {}
            : jQuery.parseJSON(localStorage[self._selectedCalendar]);
        aDefined[sField] = sType;
        if (typeof(localStorage)  != 'undefined' && JSON != undefined) {
            localStorage[self._selectedCalendar] = JSON.stringify(aDefined);
        }
    }
    
    
    self._getDependent = function(sFieldName) {
    // Isolate the Describe info for the relevant fields
        if (sforce === undefined || !self._parent._objects.checkProfile('api')) {//|| btoa === undefined) {
            return false;
        }
        var oObjectDesc = self._aMetaDescription[self._aCalendar.objectName] == undefined 
                ? (self._aMetaDescription[self._aCalendar.objectName] = sforce.connection.describeSObject(self._aCalendar.objectName))
                : self._aMetaDescription[self._aCalendar.objectName],
            nFound = 0,
            aOptions = {},
            nI, nJ,
            oBase64 = new sforce.Base64Binary("");
        var getFieldDescribe = function(sFind) {
            sFind = sFind.toLowerCase();
            for (nI = 0; nI < oObjectDesc.fields.length; nI++) {
                var f = oObjectDesc.fields[nI];
                if (f.name.toLowerCase() == sFind) {
                    return f;
                }
            }
            return null;
        }
        var aRelativeDesc = getFieldDescribe(sFieldName);
        if (aRelativeDesc == null || aRelativeDesc.controllerName == undefined) {
            return false;
        }
        var sParent = aRelativeDesc.controllerName,
            aParentDesc = getFieldDescribe(sParent);
        if (aParentDesc == null) {
            return false;
        }
        
        // Set up return object
        var aParentValues = aParentDesc.type == 'boolean' 
            ? [{"label" : 'false'}, {"label" : "true"}] 
            : aParentDesc.picklistValues;
        for (nI = 0; nI < aParentValues.length; nI++) {
            aOptions[aParentValues[nI].label] = [];
        }
        
        var testBit = function(validFor, pos) {
            var bits = validFor.charCodeAt(pos >> 3);
            return ((bits & (0x80 >> (pos % 8))) != 0)
        }
        // For each dependent value, check whether it is valid for each controlling value
        var aRelativeValues = aRelativeDesc.picklistValues;
        for (nI = 0; nI < aRelativeValues.length; nI++) {
            var aOption = aRelativeValues[nI],
                validForDec = oBase64.decode(aOption.validFor);
            for (nJ = 0; nJ < aParentValues.length; nJ++) {
                if (testBit(validForDec, nJ)) {
                    aOptions[aParentValues[nJ].label].push(aOption.label);
                }
            }
        }
        return [sParent.toLowerCase(), aOptions];
    }
    
    self._initDependent = function(aDependent) {
        var nTimer;
        if (aDependent == null || aDependent.length < 1) {
            return;
        }
        
        self._parent._addQueue([
            function(){
                self._parent._objects.initConnectLib();
            },
            function(){
                if (window['sforce'] == undefined || window['sforce'].connection == undefined) {
                    return;
                }
                window['sforce'].connection.sessionId = self._parent.options.session;
                for ( var nI = 0; nI < aDependent.length; nI++) {
                    var aField = self._getField(aDependent[nI]['name']);
                    if (aField != undefined && aField.depentRule == undefined) {
                        aField.depentRule = self._getDependent(aField.name);
                    }
                }
            }
        ]);
        var fCheck = function() {
            for ( var nI = 0; nI < aDependent.length; nI++) {
                var aField = self._getField(aDependent[nI]['name']);
                if (aField != undefined && aField.depentRule == undefined) {
                    nTimer = setTimeout(function(){
                        fCheck();
                    }, 1000);
                    return;
                }
                self._setDependent(aDependent);
            }
        }
        fCheck();
    }
    
    self._setDependent = function(aDependent) {
        var aField, domParentField, domField;
        
        for (var nI = 0; nI < aDependent.length; nI++) {
            aField = self._getField(aDependent[nI]['name']);
            if (aField == null || aField == undefined || aField.depentRule == undefined || aField.depentRule == false) {
                continue;
            }
            
            domParentField = self._dom.form.children('div[data-name="' + aField.depentRule[0] + '"]')
                .find('select, input[type="checkbox"]');
            if (domParentField.size() < 1) {
                continue;
            }
            domParentField.addClass('_ca_dependent');
            if (domParentField.data('depfield') == undefined) {
                domParentField.data('depfield', [aField.name]);
            } else if (domParentField.data('depfield').indexOf(aField.name) == -1){
                domParentField.data('depfield').push(aField.name);
            }
            self._rebuildDependent(domParentField.data('depfield'), 
                domParentField[0].tagName == 'INPUT' 
                    ? (domParentField.attr('checked') ? 'true' : 'false')
                    : domParentField.val())             //domParentField.prev().val()
        }
    }
    
    self._rebuildDependent = function(aFields, sSelValue) {
        var nI, aField, aVisible, domField,
            aFieldValues = jQuery.isPlainObject(aFields) ? aFields : null,
            bRecordTypeFilter = (sSelValue === true);
        if (bRecordTypeFilter) {
            sSelValue = undefined;
        }
        aFields = jQuery.isPlainObject(aFields) ? Array.objectKeys(aFields) : aFields;
        if (aFields == null) {
            return;
        }
        for (nI = 0; nI < aFields.length; nI++) {
            aField = self._getField(aFields[nI]);
            if (aField == undefined || (aField.depentRule == undefined && aFieldValues == null)) {
                continue;
            }
            domField = self._dom.form.children('div[data-name="' + aField.name + '"]')
                .find('select:first');
            if (domField == undefined || domField.size() < 1) {
                continue;
            }
            if (domField.data('options') == undefined) {
                domField.data('options', domField.html().replace('selected', ''));
            }
            
            
            aVisible = sSelValue == '' || sSelValue == undefined 
                ? (sSelValue == '' ? [""] : null)
                : aField.depentRule[1][sSelValue];
//            if (aVisible != null && aVisible.length == 0) {
//                aVisible = [""];
//            }
            if (aFieldValues != null && aFieldValues[aField.name]) {
                aVisible = aFieldValues[aField.name];
                if (bRecordTypeFilter){
                    domField.data('optionsRecordType', aVisible);
                }
            }
            if (aVisible == undefined) {
                return;
            }
            var aSelected = domField.val() || [];
            aSelected = typeof(aSelected) == 'string' ? [aSelected] : aSelected;
            domField.children('[selected]').each(function(){
                var mTempVal = jQuery(this).attr('value');
                if (aSelected.indexOf(mTempVal) < 0) {
                    aSelected.push(mTempVal);
                }
            });
            if (aSelected.length > 0) {
                domField.data('selected', aSelected);
            } else if (domField.data('selected') != undefined) {
                aSelected = domField.data('selected');
            }
            
            domField.html(domField.data('options'));
            domField.val(aSelected);
            if (aVisible != null && aVisible.length > 0) {
                if (!bRecordTypeFilter && domField.data('optionsRecordType') != undefined && domField.data('optionsRecordType')[0] != '') {
                    if (aVisible[0] != '' ) {
                    //aVisible = //aVisible[0] == '' 
                        //? domField.data('optionsRecordType')
                        //: 
                        aVisible = aVisible.intersect(domField.data('optionsRecordType'));
                    }
                } else if (bRecordTypeFilter && aField.depentRule != undefined && aField.depentRule.length == 2) {
                    var aTempField = self._getField(aField.depentRule[0]),
                        sTempValue = self._getFormFieldValues(aField.depentRule[0])[aField.depentRule[0]];
                    if (aTempField.type == 'BOOLEAN' && (sTempValue == 'off' || sTempValue == 'on')) {
                        sTempValue = sTempValue == 'on';
                    }
                    if (aField.depentRule[1][sTempValue] != undefined) {
                        aVisible = aVisible[0] == '' 
                            ? aField.depentRule[1][sTempValue]
                            : aVisible.intersect(aField.depentRule[1][sTempValue]);
                    } else if (sTempValue == '') {
                        aVisible = [""];
                    }
                }
            }
            if (aVisible != null && aVisible.length == aField.options.length){
                continue;
            }
            if (aVisible != null && aVisible.length == 0) {
                aVisible = [""];
            }
//            if (aVisible != null && !(bRecordTypeFilter && aVisible.length == 1 && aVisible[0] == '') ) {
            if (aVisible != null && aVisible.length > 0) {
                var aRemove = jQuery();
                domField.children().each(function(nIdx, oEl){
                    oEl = jQuery(oEl);
                    if (oEl.val() != '' && aVisible.indexOf(oEl.val()) < 0) {
                        aRemove = aRemove.add(oEl);
                    }
                });
                aRemove.remove()
            } else if (aVisible == null || aVisible.length == 0 
//                || (!bRecordTypeFilter && aVisible.length == 1 && aVisible[0] == '' )
            ) { // || (aVisible.length == 1 && aVisible[0] == '')
                domField.children().remove();
            }
        }
    }
    
    self._picklistOptionsSelector = function(evt) {
        var oSelect = jQuery(evt.target);
        if (oSelect[0].tagName != 'SELECT') {
            return true;
        }
        var oInput = oSelect.parent('.ca_datalist').find('input'),
            sName = oInput.attr('name'),
            aField = self._getField(sName);
        
        
        if (aField.options != undefined && aField.options.length > 0 ) {
            return true;
        }
        self._parent._objects.getFieldOptions(
            {
                cid  : self._selectedCalendar,
                fid  : oInput.attr('name'),
                text : '',
                page : 0,
                obj  : '',
                hm : 1000
            },
            function(aList, aPagesOption){
                if (aList == undefined) {
                    aList = [];
                }
                aField.options = aList;
                oInput.data('options', aList);
                self._fillOptionsField(sName, aList);
                //console.log(aList);
            }
        );
        return true;
    }
    
    self._fillOptionsField = function(sName, aOptions, mVal, bShowEmpty) {
        var oInput = self._dom.form.children('div[data-name="' + sName + '"]').find('input'),
            oField = self._dom.form.children('div[data-name="' + sName + '"]').find('select'),
            sHTML = bShowEmpty !== false || aOptions.length < 1 ? '<option value="" class="_empty"></option>' : '',
            sKey, sLabel;
        mVal = mVal || oInput.val();
       
        for (var nI = 0; nI < aOptions.length; nI++) {
            sKey = aOptions[nI].key != undefined ? aOptions[nI].key : (aOptions[nI].value || aOptions[nI].name);
            sLabel = aOptions[nI].name == undefined ? aOptions[nI].value : aOptions[nI].name;
            sHTML += '<option value="' + sKey.htmlspecialchars() + '" '
                    + ((mVal != undefined && mVal == sKey) || (
                            mVal == undefined 
                            && (aOptions[nI]['default'] === true)
                        )
                        ? 'selected' 
                        : ''
                    )
                    + '>'
                    + sLabel.htmlspecialchars()
                    + '</option>';
        }
        oField.html(sHTML);
    }
    
    self._setCustomStartEndDates = function(aData) {
        var aStartField = self._getField(self._structure.start),
            aEndField = self._structure.end != undefined && self._structure.end != '' ? self._getField(self._structure.end) : undefined,
            dTempStart = aStartField != undefined && self._structure.start != undefined && self._structure.start != ''
                ? self._getDatetime(aStartField, true)
                : null,
            dTempEnd = aEndField != undefined && self._structure.end != undefined && self._structure.end != ''
                ? self._getDatetime(aEndField, true)
                : null;
        
        if (dTempStart != undefined && dTempStart != null) {
            self._params.date.start = dTempStart;
            delete aData.data[self._structure.start];
        }
        if (dTempEnd != undefined && dTempEnd != null ) {
            self._params.date.stop = dTempEnd;
            delete aData.data[self._structure.end];
        }
    }
    
    self._checkCreatingDates = function(oInput, dDate) {
        var oParent = oInput.parents('.required[data-name][data-special]'),
            oRelated = oParent.siblings('[data-special]'),
            dRelated;
        if (oParent.size() < 1 || oRelated.size() < 1) {
            return;
        }
        var sSpecial = oParent.data('special'),
            aField = self._getField(oRelated.data('name'));
        if (sSpecial == 'end') {
            self._checkStartChanges = false;
        }
        dRelated = self._getDatetime(aField, true);
        if (sSpecial == 'start' && self._checkStartChanges){
            dRelated = Date.baseDate(dDate, 0, 1);
        } else if (sSpecial == 'start' && dRelated < dDate) {
            dRelated = Date.baseDate(dDate, aField.type == 'DATETIME' ? 0 : 1, aField.type == 'DATETIME' ? 1 : 0);
        } else if (sSpecial == 'end' && dRelated > dDate) {
            dRelated = Date.baseDate(dDate, aField.type == 'DATETIME' ? 0 : -1, aField.type == 'DATETIME' ? -1 : 0);
        } else {
            dRelated = null;
        }
        if (dRelated != null) {
            oRelated.find('input').val(dRelated.format(self._parent.options.format[aField.type.toLowerCase()]));
        }
    }
    
    
    self._correctEnd = function() {
        if (self._bEndCorrect
            || self._parent.params.showCreatingDates !== true 
            || self._params.date == undefined 
            || self._params.date.stop == undefined
            || self._aCalendar == undefined
            || self._aCalendar.et != 'DATETIME'
            || self._params.allDay !== true 
            || self._params.eventId != undefined
        ) {
            return;
        }
        
        self._bEndCorrect = true;
        self._params.date.stop.changeDate(1);
            
    }
    
    self._objectSpecial = {}
    
    self._objectSpecial.event = {
        name  : 'event',
        on    : false,
        reminder    : false,
        aStartField : {
            "name" : "recurrencestartdatetime",
            "type" : "DATETIME",
            "label" : '',
            "isRequired" : true
        },
        aEndField : {
            "name" : "recurrenceenddateonly",
            "type" : "DATE",
            "label" : '',
            "isRequired" : true
        },
        aReminderNames  : ['No reminder', '0 minutes', '5 minutes', '10 minutes', '15 minutes', '30 minutes', '1 hour',
                            '2 hours', '3 hours', '4 hours', '5 hours', '6 hours', '7 hours', '8 hours', '9 hours',
                            '10 hours', '11 hours', '0.5 days', '18 hours',  '1 day', '2 days', '3 days', '4 days',
                            '1 week', '2 weeks'
                        ], 
        aReminderValues : ['-1', '0', '5', '10', '15', '30', '60', '120', '180', '240', '300', '360', '420', '480',
                            '540', '600', '660', '720', '1080', '1440', '2880', '4320', '5760', '10080', '20160'
                        ],
        start : function() {
            this.on = false;
            this.reminder = false;
            this.multicontactsinevent = false;
            self._aRestrictField = [];
            self._objectSpecial.event.aStartField.label = self._parent.getText('create_reccurence_start', "Recurrence Start");
            self._objectSpecial.event.aEndField.label = self._parent.getText('create_reccurence_end', "Recurrence Start");
            for (var nI = 0; nI < self._structure.create.length; nI++) {
                if (self._structure.create[nI].name == 'isrecurrence') {
                    this.on = true;
//                    break;
                } else if (self._structure.create[nI].name == 'isreminderset' 
                    && self._parent.getParam('respectReminderDD', 'off') != 'off'
                ) {
                    this.reminder = true;
                } else if (self._parent.params.multiContactsInEvent && self._structure.create[nI].name == 'whoid' && 
                        self._parent._objects.checkProfile('sharedactivities')) 
                {
                    this.multicontactsinevent = true;
                }
            }
            
            if (this.reminder) {
                self._aRestrictField.push('isreminderset', 'reminderdatetime');
            }
            if (this.multicontactsinevent) {
                self._aRestrictField.push('whoid');
            }
            if (!this.on) {
                return;
            }
            self._structure = jQuery.extend({}, self._structure);
            self._structure.recurrency = [];
            self._aRestrictField.push('isrecurrence', 'recurrenceinstance', 'recurrencemonthofyear', 
                'recurrencetype', 'recurrenceenddateonly',
                'recurrenceactivityid', 'recurrenceinterval',
                'recurrencestartdatetime', 'recurrencedayofweekmask',
                'recurrencedayofmonth', 'recurrencetimezonesidkey',
                'recurrencestartdateonly');
        },
        html : function(){
            var sHTML = '',
                aTypeValues = ['off', 'RecursEveryWeekday', 'RecursDaily', 'RecursWeekly', 'RecursMonthly', 
                        'RecursMonthlyNth','RecursYearly', 'RecursYearlyNth'],
                aTypeNames = self._parent.getText('create_reccurence_types'),
                aInstanceValues = ['First', 'Second', 'Third', 'Fourth', 'Last'],
                aInstanceText = self._parent.getText('create_reccurence_instances');
        
            if (self._parent.getParam('respectReminderDD', 'off') != 'off' && this.reminder) {
                sHTML += this.htmlReminder();
            }
            if (self._parent.params.multiContactsInEvent && this.multicontactsinevent) {
                sHTML += this.htmlMultiContacts();
            }
        
            if (!this.on) {
                return sHTML;
            }
            sHTML += '<div class="two_column"  data-name="recurrencetype">'
                + '<span class=_reccurence><select name=rec[type]>'
                    + self._buildOptions(aTypeValues, aTypeNames)
                    + '</select>'
                + '<p data-rectype="off"></p>'
                + '<p data-rectype="RecursEveryWeekday"></p>'
                + '<p data-rectype="RecursDaily">' + self._parent.getText('create_every', 'Every') + ' '
                    + '<input type="text" size="5" maxlength="4" name="rec[interval]" /> '
                    + self._parent.getText('create_day', 'day') + '</p>'
                + '<p data-rectype="RecursWeekly">'
                    + self._parent.getText('create_every', 'Every') 
                        + ' <input type=text size=5 maxlength=4 name=rec[interval]>'
                        + self._parent.getText('create_weeks_on', 'week(s) on') + '</br>';
            for (var nI = 0; nI < self._parent.text.weekShort.length; nI++) {
                sHTML += '<input type=checkbox value=' + nI + ' name=rec[dayofweekmask]>&nbsp;' 
                        + self._parent.text.weekShort[nI]
                        + '</br>'
            }
            sHTML += '</p>'
                + '<p data-rectype="RecursMonthly">'
                    + self._parent.getText('create_every', 'Every') 
                    + '<input type=text size=2 maxlength=2 name=rec[interval]> '
                        + self._parent.getText('create_months_on', 'month(s) on the')
                    + '<input type=text size=2 maxlength=2  name=rec[dayofmonth]> ' 
                        + self._parent.getText('create_day', 'day')
                + '</p>'
                + '<p data-rectype="RecursMonthlyNth">'
                    + ' ' + self._parent.getText('create_on_the', 'On the')  + ' '
                        + '<select name="rec[instance]">'
                        + self._buildOptions(aInstanceValues, aInstanceText)
                    + '</select> '
                    + '<select name="rec[dayofweekmask]">';
            for (var nI = 0; nI < self._parent.text.weekShort.length; nI++) {
                sHTML += '<option value=' + Math.pow(2, nI) + '>' 
                    + self._parent.text.weekShort[nI]
                    + '</option>';
            }
            sHTML += '</select> '
                    + self._parent.getText('create_of_every', 'of every') + ' '
                    + '<input type=text size=2 maxlength=2 name=rec[interval]> ' 
                    + self._parent.getText('create_months', 'month(s)')
                + '</p>'
                + '<p data-rectype="RecursYearly">'
                    + self._parent.getText('create_every', 'Every') 
                    + ' <select name="rec[monthofyear]">';
            for (var nI = 0; nI < self._parent.text.month.length; nI++) {
                sHTML += '<option value=' + self._parent.text.month[nI] + '>' 
                    + self._parent.text.month[nI]
                    + '</option>'
            }
            sHTML += '</select>&nbsp;<input type="text" size="2" maxlength="2" name="rec[dayofmonth]" />'
                + '</p>'
                + '<p data-rectype="RecursYearlyNth">'
                    + ' ' + self._parent.getText('create_on_the', 'On the')  
                    + ' <select name="rec[instance]">'
                        + self._buildOptions(aInstanceValues, aInstanceText)
                    + '</select> '
                    + '<select name="rec[dayofweekmask]">';
            for (var nI = 0; nI < self._parent.text.weekShort.length; nI++) {
                sHTML += '<option value=' + Math.pow(2, nI) + '>' 
                    + self._parent.text.weekShort[nI]
                    + '</option>';
            }
            sHTML += '</select>'
                + ' ' + self._parent.getText('create_of', 'of')  + '  '
                + '<select name="rec[monthofyear]">';
            for (var nI = 0; nI < self._parent.text.month.length; nI++) {
                sHTML += '<option value=' + self._parent.text.month[nI] + '>' 
                    + self._parent.text.month[nI]
                    + '</option>'
            }
            
            sHTML +=  '</select></p>'
                + '</span>'
                + '</div>';
            var aStartField = this.aStartField,
                aEndField = this.aEndField;
            sHTML += '<div data-name="' + aStartField.name + '" class="required _hide">' 
                + '<span title="' + self._parent.getText('create_reccurence_start', "Recurrence Start") + '">'
                    + self._parent.getText('create_reccurence_start', "Recurrence Start") 
                    + '</span>'
                + '<span data-type="' + aStartField.type + '">'
                + self._fieldDate(aStartField)
                + '</span></div>'
                + '<div data-name="' + aEndField.name + '" class="required _hide">' 
                + '<span title="' + self._parent.getText('create_reccurence_end', "Recurrence End") + '">' 
                    + self._parent.getText('create_reccurence_end', "Recurrence End")  
                    + '</span>'
                + '<span data-type="' + aEndField.type + '">'
                + self._fieldDate(aEndField)
                + '</span></div>';
                
            return sHTML;
        },
        set : function(aData) {
            if (this.reminder) {
                var sStartField = this.name == 'task' ? 'activitydate' : 'startdatetime',
                    oReminderSelect = self._dom.form.find('div[data-name="reminderdatetime"] select'),
                    oAllDay = self._dom.form.find('div[data-name="isalldayevent"] input'),
                    bAllDay = self._params.allDay == true || (self._bEdit && aData.data.isalldayevent === 'on');
                if (self._bEdit && self._isTrue(aData.data.isreminderset) && aData.data[sStartField] != undefined) {
                    var dStart = Date.preParseSF(aData.data[sStartField], this.name == 'task' ? 'DATE' : 'DATETIME'),
                        dReminderDate = Date.preParseSF(aData.data.reminderdatetime, 'DATETIME'),
                        nDistance = Math.round((dStart.getTime() - dReminderDate.getTime()) / 60000);
                    oReminderSelect.val(nDistance);
                    if (oReminderSelect.val() == '-1' 
                        && self._parent.profile.eventReminder != undefined
                        && this.name == 'event'
                    ) {
                        oReminderSelect.val(self._parent.profile.eventReminder);
                    }
                    self._dom.form.find('div[data-name="reminderdatetime"] input')
                        .val(dReminderDate.format(self._parent.options.format['datetime']));
                }
                if (oReminderSelect.size() > 0) {
                    if ((bAllDay && oAllDay.size() == 0) 
                        || (oAllDay.size() > 0 && oAllDay.is(':checked'))
                        || this.name == 'task'
                    ) {
                        self._dom.form.find('div[data-name="reminderdatetime"]').addClass('_allday');
                    }
                }
            }
                       

            
            if (this.multicontactsinevent) {
                var oChild = {
                        "label" : 'Event Who Relations',
                        "field" : 'eventid',
                        "object" : "EventWhoRelation",
                        "fields" : "id,relationid,EventId",
                        "hm" : 99,
                        "url"   : "",
                        "showurl" : ""
                    };
                self._parent._addQueue(function(){
                    //console.log('self._params.id===', self._params.id)
                    //console.log('self._params.eventId===', self._params.eventId)
                    if (self._params.eventId == undefined) {
                        return;
                    }
                    self._parent._objects.getChildTableData(oChild, 0, self._params.eventId, '', function(data){
                        var aList = typeof(data.data) == 'string' ? JSON.parse(data.data) : data.data,
                            oWhoid = self._dom.form.find('input[name="whoid"]'),
                            oWhoid_id = self._dom.form.find('input[name="whoid_id"]'),
                            sId, sText;
                        for(var i=0; i < aList.length; i++) {
                            sText = aList[i]['relationid.name'];
                            sId = aList[i]['relationid'];
                            jQuery(
                                '<span class="_reference" data-id="' + sId + '" title="' + sText.htmlspecialchars() + '">' 
                                + sText.htmlspecialchars() 
                                + '</span>'
                            ).insertBefore(oWhoid);
                            oWhoid_id.val(oWhoid_id.val() + ',' + sId);
                        }
                    });
                }, function(){

                });
            }
            
            
            
            if (!self._bEdit 
                && aData.data.isalldayevent === undefined 
                && self._params.allDay == true 
                && self._parent.params.showCreatingDates !== true
            ) {
                self._dom.form.find('input[name="isalldayevent"]').attr('checked', true);
            }
            
            
            var oBlock = self._dom.form.children('div.two_column[data-name="recurrencetype"]');
            if (aData.data.isrecurrence != 'on' && aData.data.isrecurrence != true) {
                if (self._bEdit ) {
                    oBlock.addClass('_hide');
                }
                return;
            }
            
            
            oBlock.find('select[name="rec[type]"]').val(aData.data.recurrencetype).trigger('change');
            if (aData.data.recurrenceinterval != undefined) {
                oBlock.find('input[name="rec[interval]"]').val(aData.data.recurrenceinterval);
            }
            self[this.aStartField.type == 'DATETIME' ? '_setDatetime' : '_setDate'](
                {"name" : this.aStartField.name}, 
                aData.data[this.aStartField.name]
            );
            self._setDate({"name" : "recurrenceenddateonly"}, aData.data.recurrenceenddateonly);
            switch(aData.data.recurrencetype) {
                case 'RecursWeekly' : 
                    oBlock.find('input[name="rec[dayofweekmask]"]').each(function(){
                        var oEl = jQuery(this);
                        oEl.attr('checked', Math.pow(2, oEl.attr('value')) & aData.data.recurrencedayofweekmask ? true : false);
                    });
                    break;
                case 'RecursMonthly' :
                    oBlock.find('input[name="rec[dayofmonth]"]').val(aData.data.recurrencedayofmonth);
                    break;
                case 'RecursMonthlyNth' :
                    oBlock.find('select[name="rec[dayofweekmask]"]').val(aData.data.recurrencedayofweekmask);
                    oBlock.find('select[name="rec[instance]"]').val(aData.data.recurrenceinstance);
                    break;
                case 'RecursYearly' :
                    oBlock.find('select[name="rec[monthofyear]"]').val(aData.data.recurrencemonthofyear);
                    oBlock.find('input[name="rec[dayofmonth]"]').val(aData.data.recurrencedayofmonth);
                    break;
                case 'RecursYearly' :
                    oBlock.find('select[name="rec[instance]"]').val(aData.data.recurrenceinstance);
                    oBlock.find('select[name="rec[dayofweekmask]"]').val(aData.data.recurrencedayofweekmask);
                    oBlock.find('select[name="rec[monthofyear]"]').val(aData.data.recurrencemonthofyear);
                    break;
            }
            
            //console.log();
        },
        get : function(aPreData) {
            var aResult = {},
                sStartField = this.name == 'task' ? 'activitydate' : 'startdatetime';
            if (aPreData.isalldayevent === undefined 
                && (self._parent.params.showCreatingDates !== true 
                    || self._structure.start != 'startdatetime' 
                    || (self._structure.end != 'enddatetime' && self._structure.end != '' && self._structure.end != undefined)
                )
                && self._params.allDay != undefined
            ) {
                aResult.isalldayevent = self._params.allDay ? 'on' : 'off';
            } else if (
                aPreData.isalldayevent === undefined 
                && self._parent.params.showCreatingDates === true 
                && (
                    self._getField(self._structure.start).type == 'DATETIME' 
                    || 
                    (self._structure.end != undefined && self._structure.end != '' && self._getField(self._structure.end).type == 'DATETIME')
                )
            ) {
                aResult.isalldayevent = 'off';
            }
            if (self._params.eventId != '' && self._params.eventId != undefined) {
                if (self._parent.params.showCreatingDates !== true 
                    && (
                        (
                            (self._aOldData.data.isalldayevent == 'on' || self._aOldData.data.isalldayevent == true)
                            && aPreData.isalldayevent == 'off'
                        )
                        || (
                            (self._aOldData.data.isalldayevent == 'off' || self._aOldData.data.isalldayevent == false)
                            && aPreData.isalldayevent == 'on'
                        )
                    ) 
                ) {
                    aResult.correct_alldates = Date.baseDate().getHours() + 1;
                } 
                
                if (self._parent.params.showCreatingDates !== true && self._params.clone && aPreData.isalldayevent === 'on') {
                    var aEvt = self._parent._events.getEvent(self._params.eventId, self._params.cid);
                    aEvt = aEvt[0];
                    //console.log(aEvt);
                    if (self._structure.start == 'startdatetime' && aResult.startdatetime == undefined) {
                        aResult.startdatetime = aEvt.dateStart.format('yyyy-mm-ddThh:ii:ss');
                    }
                    if (self._structure.end == 'enddatetime' && aResult.enddatetime == undefined) {
                        aResult.enddatetime = aEvt.dateEnd.format('yyyy-mm-ddThh:ii:ss');
                    }
                }

            }
            if (this.reminder) {
                var oReminder = self._dom.form.children('div[data-name="reminderdatetime"]'),
                    nReminder = oReminder.find('select').val(),
                    bAllDay = this.name == 'task' || aPreData.isalldayevent == 'on' || aResult.isalldayevent == 'on';
            
                aResult.isreminderset = ((bAllDay && oReminder.find('input').val() != '') 
                        || (!bAllDay && nReminder != -1)) ? 'on' : 'off';
                if (aResult.isreminderset == 'on' 
                        && (
                            aPreData[sStartField] != undefined 
                        || aResult[sStartField] != undefined
                        || (self._structure.start == sStartField && self._params.date.start != undefined)
                    )
                ) {
                    var sStartTime = aPreData[sStartField] || aResult[sStartField],
                        dReminderTime,
                        dReminderStartTime = (sStartTime != undefined) 
                            ? Date.preParse(sStartTime.replace('T', ' '))
                            : new Date(self._params.date.start);
                    
                    if (bAllDay) {
                        dReminderTime = Date.preParse(oReminder.find('input').val(), self._parent.options.format['datetime']);
//                        if (dReminderTime > dReminderStartTime && !dReminderStartTime.isSameDay(dReminderTime)){
//                            dReminderTime.setDate(dReminderStartTime.getDate());
//                            dReminderTime.setMonth(dReminderStartTime.getMonth());
//                            dReminderTime.setFullYear(dReminderStartTime.getFullYear());
//                        }
                    } else {
                        dReminderTime = dReminderStartTime.changeSecond(-nReminder * 60);
                    }
                    
                    aResult.reminderdatetime = dReminderTime.format('yyyy-MM-ddThh:ii:ss');
                }
            }
            
            console.log('get::this.multicontactsinevent===', this.multicontactsinevent)
            if (this.multicontactsinevent) {
                var oMulti = self._dom.form.children('div[data-name="whoid"]');
                aResult.whoid = '';
                aResult.whoid_multi = oMulti.find('input[name="whoid_id"]').val();
                console.log('aResult.whoid_multi===', aResult.whoid_multi)
            }
            
            if (!this.on) {
                return aResult;
            }
            var oEl = self._dom.form.children('div.two_column[data-name="recurrencetype"]');
            aResult['recurrencetype'] = oEl.find('select[name="rec[type]"]').val();
            if (aResult['recurrencetype'] != 'off') {
                aResult['isrecurrence'] = 'on';
            }
            oEl.find('p._on').find('input[type="text"], select, input:checked').each(function(){
                var el = jQuery(this), sName = 'recurrence' + el.attr('name').replace('rec[', '').replace(']', '');
                if (el.attr('type') == 'checkbox') {
                    if (aResult[sName] == undefined) {
                        aResult[sName] = 0;
                    }
                    aResult[sName] += Math.pow(2, el.val());
                } else {
                    aResult[sName] = el.val();
                }
            });
            switch (oEl.find('select[name="rec[type]"]').val()) {
                case 'RecursEveryWeekday':
                    aResult['recurrencedayofweekmask'] = 62;
                    break;
            }
            return aResult;
            
        },
        check : function() {
            if (!this.on) {
                return true;
            }
            
            var oEl = self._dom.form.children('div.two_column[data-name="recurrencetype"]'),
                oSelector = oEl.find('select[name="rec[type]"]'),
                oOpenTab = oEl.find('p._on'),
                oCheckEl;
            switch (oSelector.val()) {
                case 'RecursYearly' :
                    oCheckEl = oOpenTab.children('input[name="rec[dayofmonth]"]');
                    if (oCheckEl.val() == '' || parseInt(oCheckEl.val()) < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    return true;
                    break;                  
                case 'RecursMonthlyNth' :
                    oCheckEl = oOpenTab.children('input[name="rec[interval]"]');
                    if (oCheckEl.val() == '' || parseInt(oCheckEl.val()) < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    return true;
                    break;    
                case 'RecursMonthly' :
                    oCheckEl = oOpenTab.children('input[name="rec[interval]"]');
                    if (oCheckEl.val() == '' || parseInt(oCheckEl.val()) < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    oCheckEl = oOpenTab.children('input[name="rec[dayofmonth]"]');
                    if (oCheckEl.val() == '' || parseInt(oCheckEl.val()) < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    return true;
                    break;                
                case 'RecursWeekly' :
                    oCheckEl = oOpenTab.children('input[name="rec[interval]"]');
                    if (oCheckEl.val() == '' || parseInt(oCheckEl.val()) < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    if (oOpenTab.children('input:checked').size() < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    return true;
                    break;
                case 'RecursDaily' :
                    oCheckEl = oOpenTab.children('input');
                    if (oCheckEl.val() == '' || parseInt(oCheckEl.val()) < 1) {
                        oCheckEl.focus();
                        return false;
                    }
                    return true;
                    break;
                case 'RecursYearlyNth' :
                case 'RecursEveryWeekday' :
                case 'off' :
                default:
                    return true;
            }
            return false;
        },
        initEvent : function() {
            var sStartField = this.name == 'task' ? 'activitydate' : 'startdatetime',
                sStartFormat = self._parent.options.format[this.name == 'task' ? 'date' : 'datetime'],
                oAllDay = self._dom.form.children('[data-name="isalldayevent"]'),
                oStart = self._dom.form.children('[data-name="' + sStartField + '"]'),
                oEnd = self._dom.form.children('[data-name="enddatetime"]'),
                oReminder = self._dom.form.children('[data-name="reminderdatetime"]'),
                dPreviousStart = null, dPreviousEnd = null;
            if (oAllDay.size() > 0) {
                oAllDay.on('click', 'input', function(oEvt){
                    var bChecked = jQuery(oEvt.target).is(':checked'),
                    dNow = Date.baseDate();
                    if (oStart.size() > 0){
                        var aStartField = self._getField(sStartField    ),
                            dStart = self._getDatetime(aStartField, true);
                        if (bChecked) {
                            if (dPreviousStart == null) {
                                dPreviousStart = Date.baseDate(dStart);
                            }
                            dStart.setHours(0, 0, 0, 0);
                            self._setDatetime(aStartField, dStart);
                        } else if (dPreviousStart != null){
                            self._setDatetime(aStartField, dPreviousStart);
                        } else {
                            dStart.setHours(dNow.getHours() + 1);
                            self._setDatetime(aStartField, dStart);
                        }
                    }
                    if (oEnd.size() > 0){
                        var aEndField = self._getField('enddatetime'),
                            dEnd= self._getDatetime(aEndField, true);
                        if (bChecked) {
                            if (dPreviousEnd == null) {
                                dPreviousEnd = Date.baseDate(dEnd);
                            }
                            dEnd.setHours(0, 0, 0, 0);
                            self._setDatetime(aEndField, dEnd);
                        } else if (dPreviousEnd != null){
                            self._setDatetime(aEndField, dPreviousEnd);
                        } else {
                            dEnd.setHours(dNow.getHours() + 2);
                            self._setDatetime(aEndField, dEnd);
                        }
                    }
                    oReminder.toggleClass('_allday');
                    if (bChecked && oReminder.find('select').val() > 0 && oReminder.find('input').val() == '') {
                        var dReminder = new Date(dStart);
                        if (self._parent.profile.taskReminder != undefined) {
                            dReminder.setMinutes(self._parent.profile.taskReminder);
                        }
                        oReminder.find('input').val(dReminder.format(self._parent.options.format['datetime']));
                    } else if (!bChecked && oReminder.find('select').val() == '-1' && oReminder.find('input').val() != '') {
                        if (self._parent.profile.eventReminder != undefined) {
                            oReminder.find('select').val(self._parent.profile.eventReminder);
                        }
                    }
                });
                
                
            }
            
            if (this.reminder && oStart.size() > 0 && oReminder.size() > 0) {
                oStart.on('change', 'input', function(evt){
                    if (oAllDay.size() > 0 && !oAllDay.find('input').is(':checked')) {
                        return;
                    }
                    var dDate = Date.preParse(oStart.find('input').val(), sStartFormat),
                        sReminder = oReminder.find('input').val(),
                        dReminder = sReminder != '' 
                            ? Date.preParse(sReminder, self._parent.options.format['datetime']) 
                            : null;
                    if (dReminder == null) {
                        return;
                    }
                    var nH = dReminder.getHours();
                    if (self._parent.getParam('respectReminderDD') == 'sf') {
                        dReminder.setMonth(dDate.getMonth());
                        dReminder.setDate(dDate.getDate());
                        dReminder.setFullYear(dDate.getFullYear());
                    } else if (self._parent.getParam('respectReminderDD') == 'ca'){
                        var dPrev = oStart.find('input').data('previous');
                        if (dPrev != undefined) {
                            var nDistance = dDate.getHoursFrom(dPrev, true);
                            dReminder.changeHour(nDistance);
                        }
                    }
                    oReminder.find('input').val(dReminder.format(self._parent.options.format['datetime']));
                });
            }
            
            if (this.multicontactsinevent) {
                self._dom.form.on('focus.CA_CREATE, blur.CA_CREATE', '._multiple .ca_filter_reference_sf', function(evt){
                    self._referenceSelectorSF(evt);
                });
            }
            
            if (!this.on) {
                return '';
            }
            var oEl = self._dom.form.children('div.two_column[data-name="recurrencetype"]');
            oEl.off('._CA_RECCURENCE');
            oEl.on('change._CA_RECCURENCE', 'select[name="rec[type]"]', function(evt){
                var el = jQuery(evt.target);
                oEl.find('p._on').removeClass('_on');
                oEl.find('p[data-rectype="' + el.val() + '"]').addClass('_on');
                self._parent.checkPopupVisiblility();
                
                self._dom.form
                    .children('div[data-name="recurrencestartdatetime"], '
                        + 'div[data-name="recurrenceenddateonly"], '
                        + 'div[data-name="recurrencestartdateonly"]'
                    )
                    .toggleClass('_hide', el.val() == 'off');
                
            });
        },
        checkAfter : function(aResult) {
            if (!this.on) {
                return true;
            }
            var oEl = self._dom.form.children('div.two_column[data-name="recurrencetype"]'),
                oSelector = oEl.find('select[name="rec[type]"]');
            return oSelector.val() != 'off' ? false : true;
        },
        
        htmlReminder : function(){
            var sHTML = '';
            
            sHTML += '<div data-name="reminderdatetime" class="_reminder">'
                    + '<span title="SELECT">Reminder</span>'
                    + '<span class="_reminder_time"><select name=rem[time]>'
                    + self._buildOptions(this.aReminderValues, this.aReminderNames)
                    + '</select>'
                    + '</span>'
                    + '<span data-type="DATETIME" class="_reminder_allday">'
                        + '<input class="ca_datetime" type="text" name="reminderdatetime"'
                            + 'value="" '
                            + (self._parent.profile.taskReminder != undefined ? 'data-default=\'{"h":' + (self._parent.profile.taskReminder / 60) + '}\'' : '')
                            + '>'
                    + '</span>'
                    + '</div>';
            return sHTML;
        },
        
        htmlMultiContacts : function() {
            var sHTML = '';
            var aField = self._getField('whoid');
            sHTML += '<div data-name="whoid" data-multiple="true">'
                       + '<span title="SELECT">Name</span>'
                       + '<span data-type="' + aField.type + '">'
                           + '<span class="_multiple"><span>'
                           + self._fieldReference(aField) 
                       + '</span>'
                   + '</div>';
            return sHTML;
        }
    }
    
    self._show_references_contactsAction = function(el, evt) {
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
    
    self._objectSpecial.task = jQuery.extend(
        {}, 
        self._objectSpecial.event,
        {
            name : 'task',
            aStartField : {
                "name" : "recurrencestartdateonly",
                "type" : "DATE",
                "label" : '',
                "isRequired" : true
            }
        }
    );
        
    self._getCrateable = function(aParams) {
        var aResult = [],
            aIds = [],
            aFilterCriteria = {"editable" : true, "calendarType" : "sf", 'create' : true},
            aCalendarList = self._parent.options.calendarId != undefined 
                ? self._parent.options.calendarId
                : [],
            aFiltered = self._parent.options.createable != undefined 
                && self._parent.options.createable != ''
                ? self._parent.options.createable.toLowerCase().split(',')
                : null;
//        console.log(aCalendarList);
        if (aCalendarList.length < 1 || aCalendarList.indexOf('ca_accessible') >= 0) {
            aFilterCriteria['visible'] = true;
        }
        var aCalendars = self._parent._calendars.getCalendars(aFilterCriteria);
        aFiltered = aFiltered != null  ? aFiltered.map(function(sStr){return sStr.trim()}) : aFiltered;
        if (typeof(aCalendarList) == 'string') {
            aCalendarList = aCalendarList.split(/,|%2C/);
        }
        aCalendarList = aCalendarList.map(function(sEl) {
            if (typeof(sEl) == 'string') {
                sEl = sEl.toLowerCase();
            }
            return sEl;
        });
        
        for (var nI = 0; nI < aCalendars.length; nI++) {
            if (aFiltered != null && aFiltered.indexOf(aCalendars[nI].id.toLowerCase()) < 0 && aFiltered.indexOf(aCalendars[nI].friendlyName.toLowerCase()) < 0) {
                continue;
            }
            
            if (aCalendarList.length > 0
                && aCalendarList.indexOf('ca_accessible') < 0
                && aCalendarList.indexOf(aCalendars[nI].id.toLowerCase())  < 0
                && aCalendarList.indexOf(aCalendars[nI].friendlyName.toLowerCase())  < 0
            ) {
                continue;
            }
            if (aIds.indexOf(aCalendars[nI].id) >= 0) {
                continue;
            }
            aIds.push(aCalendars[nI].id);
            aResult.push(aCalendars[nI]);
        }
        return aResult;

    }    
    
    self._checkDependendLookup = function(){
        /*if ( self._parent.params.useSFLookup != true) {
            return;
        }*/
        if (self._parent.params.useSFLookup === 'never') {
            return;
        }
        var aLoadIdFields = [], nI, bUse = (self._parent.params.useSFLookup === true || self._parent.params.useSFLookup === 'always');
        for (nI = 0; nI < self._structure.create.length; nI++) {
            var aField = self._getField(self._structure.create[nI].name);
            if (aField == undefined 
                || aField.type != 'REFERENCE' 
                || aField.filteredLookup !== true 
                || self._aRestrictField.indexOf(aField.name) >= 0
            ) {
                continue;
            }
            bUse = bUse || aField.filteredLookup;
            aLoadIdFields.push(aField);
            
        }
        if (bUse && aLoadIdFields.length > 0) {
            self._parent._objects.loadFieldIds(self._aCalendar.objectName, aLoadIdFields, function(data){
                var aKeys = Array.objectKeys(data);
                
                for (nI = 0; nI < aKeys.length; nI++){
                    
                    var aField = self._getField(aKeys[nI]);
                    if (aField != undefined) {
                        aField.sfID = data[aKeys[nI]];
                       
                    }
                }
            });
        }
        
        //aField.filteredLookup
    }
    
    
    self._openLookup = function(sUrl, nWidth, bUseAddition, sAdditionUrl) {
        if (window.openLookup != undefined) {
            return window.openLookup(sUrl, nWidth, bUseAddition, sAdditionUrl);
        } 
        window.open(sUrl + (bUseAddition ? sAdditionUrl : ''), 
            "lookup", 
            "width=" + (nWidth || 350) + ",height=480, toolbar=no,status=no,directories=no,menubar=no,resizable=yes,scrollable=no", 1
        );
    }
    
    self._escapeUTF = function(sStr) {
        if (typeof(escapeUTF) != 'undefined') {
            return escapeUTF(sStr);
        }
        var b = "";
        for (i = 0; i < sStr.length; i++) {
            var c = sStr.charCodeAt(i);
            127 >= c ? b += escape(sStr.charAt(i)) : 2047 >= c ? b += "%" + (c >> 6 | 192).toString(16) + "%" + (c & 63 | 128).toString(16) : 2048 <= c && (b += "%" + (c >> 12 | 224).toString(16) + "%" + (c >> 6 & 63 | 128).toString(16) + "%" + (c & 63 | 128).toString(16))
        }
        return b
    }
    
    self._buildOptions = function(aValues, aText, mSelected) {
        var sHTML = '';
        for (var nI = 0; nI < aValues.length; nI++) {
            sHTML += '<option value="' + aValues[nI] + '" '
                + (mSelected != undefined && aValues[nI] == mSelected ? ' selected' : '')
                + '>' + aText[nI] 
                + '</option>';
        }
        return sHTML;
    }
    
    self._isTrue = function(mValue){
        return mValue === true || mValue === 'true' || mValue === 'on';
    }
    
    jQuery.calendarAnything.appendView('create', view);
	//initSample();
	
})();