/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css        : '/css/event-detail.css',
        _parent     : null,
        _div        : null, 
        _dom        : {},
        _structure  : {},
        _aFields    : [],
        _oBar       : null,
        _bSingle    : false,
        _bNoAdditionalLoading : false,
        _aObjectsLabel : {},
        _aPostCalendar : [],
        _oBaseEvt   : null,
        _aEventsData : null
    };
    var view = {};
    
    view.init = function (div, parent){
        self._div = div;
        self._parent = parent;
        self._parent.loadCss(self._css, function() {
            self._parent.checkPopupVisiblility();
        });
    }
    
    view.show = function(params) {
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
        var oClicked = jQuery(evt.target),
            oAddon = oClicked.parents('[data-tab]'),
            sAddon = oAddon.size() > 0 
                ? oAddon.data('tab').replace('addon_', "") 
                : (oClicked.data('addon') != undefined 
                    ? oClicked.data('addon') 
                    :  ""
                );
        if (sAddon != '' && self._parent._addons[sAddon] != undefined && self._parent._addons[sAddon].module != null) {
            return self._parent._addons[sAddon].module.action(sAction, oClicked, evt);
        }
    }
    
    view.reset = function(){
        self._structure = {};
    }
    
    self._show = function(params) {
        var sHTML = self._buildHTML(params);
        self._parent.showPopup({
            html        : sHTML,
            linkedEl    : params.el, 
            event       : params.event,
            onShow      : self._initEvents,
            autohide    : false,
            view        : view,
            slide       : self._parent.options._small ? 'bottom' : false,
            fullScreen  : self._parent.options._small
        });
        self._parent.log('show event detail ' + params.el);
        self._oBar = params.el;
        if (!self._bNoAdditionalLoading) {
            self._preloadEventsData(params.els);
        }
        self._oBaseEvt = params.event;
    }
    
    self._buildHTML = function(params) {
        var sHTML = '';
        if (params.els == undefined || params.els.length < 1){
            return '<div class=event_detail>'
                + self._parent.getText('detail_bad_event', 'Bad event')
                + '</div>';
        }
        self._bNoAdditionalLoading = false;
        self._bSingle = params.els.length == 1;
        self._aPostCalendar = [];
        var oCalendar = self._bSingle ? self._parent._calendars.getCalendar(params.els[0].data('calendar')) : null;
        sHTML = '<div class="CA_event_detail ' + (self._bSingle ? 'single _no_edit _no_delete _info_loading' : "") + ' evt">'
                + (self._bSingle 
                    ? self._buildSingleTitle(params.el) 
                    : ""
                )
                + '<div class=tabs></div>'
                + '<div data-tab="fields" class="fields ' + (!self._bNoAdditionalLoading ? 'CA_ajax_loading' : '_hide' ) + '"></div>' 
                + '<div class=buttons>'
                    + (self._bSingle 
                        ? ( oCalendar['edit'] !== false 
                            && self._parent.options.readonly !== true
                            && self._parent.options.readonly.edit !== false 
//                            && !params.el.hasClass('non_e') 
                            && self._parent.options.detailUrl != '0'
                            ? '<span data-action="edit">'
                                + self._parent.getText('edit', 'Edit')
                                + '</span>' 
                            : ''
                        )
                        + (self._parent.options.detailUrl != '0' 
                            && self._parent.options.readonly.detail !== false 
                            ? '<span data-action="details">'
                                + self._parent.getText('event_menu_details', 'Details')
                                + '</span>' 
                            : ''
                        )
                        + ( oCalendar['delete'] !== false 
                            && self._parent.options.readonly !== true
                            && self._parent.options.readonly.del !== false 
//                            && !params.el.hasClass('non_e') 
                            ? '<span data-action="delete">'
                                + self._parent.getText('delete', 'Delete')
                                + '</span>' 
                            : ''
                        )
                            
                        + (
                            (self._parent.options.readonly.contextEvent !== false) 
                            ? '<span data-action="menu">'
                                + self._parent.getText('detail_more', 'More')
                                + '</span>' 
                            : ''
                        )
                        : ''
                    )
                    + '<span data-mode="cancel" >'
                        + self._parent.getText('close', 'Close')
                    + '</span>'
                + '</div>'
            + '</div>';
        return sHTML;
    }
    
    
    self._initEvents = function(wPopup) {
        self._dom.el = wPopup.find('.CA_event_detail');
        self._dom.fields = self._dom.el.find('.fields');
        self._dom.tabs = self._dom.el.find('.tabs');
        self._dom.title = self._dom.el.find('.title');
        //'click'
        self._dom.el.on(self._parent.eventNames.click, '.buttons > span', function(){
            var el = jQuery(this);
            if (el.data('mode') == 'cancel') {
                self._parent.hidePopup();
                return false;
            } else if (el.data('mode') == 'edit') {
                //alert('Ho! go to edit!');
                self._parent.showNotify('Ho! go to edit!', 'alert');
            }
        });
    }
    
    
    self._preloadEventsData = function(aEls) {
        var aElsList = [], aCalsList = [], aAllCalsList = [], nI, aQue = [], aLoadedStructure;
        for (nI = 0; nI < aEls.length; nI++) {
            var aEl = aEls[nI];
            if (aElsList.indexOf(aEl.data('event')) == -1) {
                aElsList.push(aEl.data('event'));
            }
            if (aCalsList.indexOf(aEl.data('calendar')) < 0 && self._structure[aEl.data('calendar')] == undefined) {
                aCalsList.push(aEl.data('calendar'));
            }
            if (aAllCalsList.indexOf(aEl.data('calendar')) < 0) {
                aAllCalsList.push(aEl.data('calendar'));
            }
        }
        
        if (self._aPostCalendar.length > 0) {
            aQue.push(function(){
                self._parent._calendars.getCalendars(
                    {calendarid : self._aPostCalendar}, 
                    function(aLoadedCalendars){
                        self._postUpdateCalendars(aLoadedCalendars);
                    }
                );
            });        
        }
        if (aCalsList.length > 0) {
            aQue.push(
                function(){
                    self._parent._calendars.getCalendars({"calendarid" : aCalsList}, function(aCalendars){
                    });
                    if (self._parent.params.fastStart == true) {
                       self._parent._objects.refreshSimple();
                    }
                }
            );
            aQue.push(
                function(){
                    self._parent._calendars.getCalendarStructure(aCalsList, function(aStructures){
                        
                        if (aStructures != undefined) {
                            jQuery.each(aStructures, function(sCid, aStructure) {
                                self._structure[sCid] = aStructure;
                            }) 
                        }
                        aLoadedStructure = aStructures;
                    });
                }
            );
        }
        aQue.push(function(){
            self._checkReferenceFields(aAllCalsList);
        });
        aQue.push(function(){
            self._prepareAllFields(aAllCalsList);
        });
        aQue.push(
            function(){
                self._parent._events.getEventDetail(aElsList, aAllCalsList, function(aResult) {
                    if (aResult.data == undefined && aResult.result != undefined) {
                        aResult.data = self._copyFromResult(aResult.result);
                    }
                    self._aEventsData = aResult.data;
                    self._showEventsListData(aEls, aResult.data);
                    if (self._bSingle) {
                        if (self._aEventsData[0].data.ca_permission == undefined 
                            || self._aEventsData[0].data.ca_permission === true
                        ) {
                            self._dom.el.removeClass(
                                (self._aEventsData[0].data.ischild !== true ? '_no_edit ' : '')
                                + '_no_delete'
                            );
                        } else {
                            self._dom.el
                                .toggleClass('_no_edit', 
                                    self._aEventsData[0].data.ca_permission !== 'edit' 
                                    && self._aEventsData[0].data.ischild !== true
                                )
                                .toggleClass('_no_delete', self._aEventsData[0].data.ca_permission !== 'delete');
                        }
                        var oCal = self._parent._calendars.getCalendar(aAllCalsList[0]);
                        if (self._objectSpecial[oCal.objectName] != undefined) {
                            self._objectSpecial[oCal.objectName].start();
                        }
                    }
                    self._parent.checkPopupVisiblility();
                });
            }
        );
        self._parent._addQueue(aQue);
    }
    
    
    self._checkReferenceFields = function(aAllCalendars) {
        var nI, aObjects = [], aRefObjects = [];
        for (nI = 0; nI < aAllCalendars.length; nI++) {
            var sCalendarId = aAllCalendars[nI],
                aCalendar = self._parent._calendars.getCalendar(sCalendarId);
            aObjects.push(aCalendar.objectName);
        }
        aObjects = aObjects.unique();
        self._parent._objects.getObjectFilterFields(aObjects, function(aStructure){
            jQuery.each(aStructure, function(sKey, aFields){
                jQuery.each(aFields, function(sField, aField){
                    aRefObjects.push(aField.options[0].name);
                });
            });
            aRefObjects = aRefObjects.unique();
            self._parent._objects.getObjects(aRefObjects);
        }, {
                type : "REFERENCE",
                intersect : true
            }
        );
    }
    
    self._prepareAllFields = function(aAllCalendars) {
        var nI, aAllFields = {}, aStructure, sField;
        
        for (nI = 0; nI < aAllCalendars.length; nI++) {
            var sCalendarId = aAllCalendars[nI],
                aCalendar = self._parent._calendars.getCalendar(sCalendarId),
                aObject = self._parent._objects.getObject(aCalendar.objectName);
            self._aObjectsLabel[aCalendar.objectName] = aCalendar.objectLabel != undefined 
                ? aCalendar.objectLabel
                : aCalendar.objectName;
            if (typeof(aAllFields[aCalendar.objectName]) == 'undefined') {
                aAllFields[aCalendar.objectName] = {};
            }
            aStructure = self._structure[sCalendarId];
            if (typeof(aStructure) == 'undefined' || aObject == null) {
                continue;
            }
            for (var nTmp = 0; nTmp < aStructure.hover.length; nTmp++) {
                sField = typeof(aStructure.hover[nTmp]) == 'string'
                    ? aStructure.hover[nTmp]
                    : aStructure.hover[nTmp].name;
                var aField = aObject != null 
                    && aObject.fields != undefined 
                    && aObject.fields[sField] != undefined
                        ? aObject.fields[sField]
                        : null;
                if (sField.indexOf('.') >= 0) {
                    var aFieldName = sField.split('.');
                    aField = aObject.fields[aFieldName[0]];
                    if (aField != undefined && aField != null && aField.options != undefined) {
                        var aRefObject = self._parent._objects.getObject(aField.options[0].name);
                        aField = aRefObject['fields'][aFieldName[1]];
                    } else {
                        aField = null;
                    }
                } 


                if (aField == undefined 
                    || aField == null 
                    || aField.name.toLowerCase() == aStructure.start.toLowerCase() 
                    || (aStructure.end != null && aField.name.toLowerCase() == aStructure.end.toLowerCase())
                    || aAllFields[aCalendar.objectName][sField] != undefined
                ) {
                    continue;
                }
                aAllFields[aCalendar.objectName][sField] = aField;
            }
        }
        self._aFields = aAllFields;
    }
    
    
    self._showEventsListData = function(aEls, aElsData) {
        self._buildFieldsNames(self._aFields);
        var dTable = self._dom.fields.children('table'),
            dMainInfo = dTable.children('tbody[data-general]'),
            aHTML = {"calendar" : "",  "title" : "", "start" : "", "end" : "", "action" : ""},
            aEl2Data = {},
            aCurrentElementData, aEventData,
            nI, nTemp, nField, dFieldRow, aCalendar, sHTML ;
        
        for (nI = 0; nI < aEls.length; nI++) {
            var sEventId = aEls[nI].data('event');
            if (aEl2Data[sEventId] == undefined) {
                aEl2Data[sEventId] = self._findEvent(sEventId, aElsData);
            }
            aCurrentElementData = aEl2Data[sEventId] >= 0 ? aElsData[aEl2Data[sEventId]] : {"title" : "-"};
            if (!self._bSingle) {
                aEventData = self._parent._events.getEvent(sEventId, aEls[nI].data('calendar'))[0];
                aCalendar = self._parent._calendars.getCalendar(aEls[nI].data('calendar'));
                var sFieldType = (
                        aCurrentElementData.data != undefined 
                        && aCurrentElementData.data['isalldayevent'] != undefined 
                        && aCurrentElementData.data['isalldayevent'] 
                    )
                    ? 'DATE'
                    : 'DATETIME';
                aHTML.calendar += "<td>" 
                    + '<div class="title '
                        + ' color_' + aCalendar.id + 
                        + (aEventData.specColor != undefined && aEventData.specColor != '' ? ' ' + aEventData.specColor : '')
                        + '">' 
                    + aCalendar.name.htmlspecialchars() 
                    + '</div>'
                    + '</td>';
                aHTML.title += "<td>" 
                    + "<div data-action='details' class='event_title'>"
                    + (aCalendar.titleHTML !== true ? aEventData.title.htmlspecialchars() : aEventData.title)
                    + '</div>'
                    + '</td>';
                aHTML.start += "<td>" 
                    + (aEventData.start != undefined && aEventData.start != '' ? self._showDate({type : sFieldType}, aEventData.start) : "") 
                    + '</td>';
                aHTML.end += "<td>" 
                    + (aEventData.end != undefined && aEventData.end != '' ? self._showDate({type : sFieldType}, aEventData.end) : "") 
                    + '</td>';
                aHTML.action += (self._parent.isMobile())
                    ? '<td data-event="' + aEls[nI].data('event') + '" data-calendar="' + aEls[nI].data('calendar') + '">'
                        + "<a data-action=menu class='_menu'>"
                        + self._parent.getText('details_menu', 'Menu')
                        + "</a>"
                        + '</td>'
                    : ""
            }
        }
        if (!self._bSingle) {
            dMainInfo.children('tr[data-field="calendar"]').append(aHTML.calendar);
            dMainInfo.children('tr[data-field="title"]').append(aHTML.title);
            dMainInfo.children('tr[data-field="start"]').append(aHTML.start);
            dMainInfo.children('tr[data-field="end"]').append(aHTML.end);
            dMainInfo.children('tr[data-field="action"]').append(aHTML.action);
        } 
        var sSingleObject = "";
        jQuery.each(self._aFields, function(sObjectName, aFields){
            sSingleObject = sObjectName;
            jQuery.each(aFields, function(sField, aField){
                
            
                sHTML = '';
                var mFieldValue;
                for (nI = 0; nI < aEls.length; nI++) {
                    var sCalendarId = aEls[nI].data('calendar'),
                        aCalendar = self._parent._calendars.getCalendar(sCalendarId);
                    
                    if (aCalendar.objectName != sObjectName) {
                        sHTML += "<td></td>";
                        continue;
                    }
                    
                    var sEventId = aEls[nI].data('event');
                    
                    
                    aCurrentElementData = aEl2Data[sEventId] >= 0 ? aElsData[aEl2Data[sEventId]] : {};
                    if (aCurrentElementData.data == undefined) {
                        sHTML += "<td></td>";
                        continue;
                    }
                    mFieldValue = aCurrentElementData.data[sField];
                    mFieldValue = (self['_show' + aField.type.capitalize()] != undefined)
                        ? self['_show' + aField.type.capitalize()](aField, mFieldValue, aCurrentElementData.data)
                        : (typeof(mFieldValue) == 'string' && mFieldValue != null && aField.isHTML !== true ? mFieldValue.htmlspecialchars() : mFieldValue);
                    if (mFieldValue == undefined) {
                        sHTML += "<td></td>";
                        continue;
                    }
                    sHTML += "<td>"
                        + mFieldValue
                        + "</td>";
                }
                dFieldRow = dTable
                    .children('tbody[data-object="' + sObjectName + '"]')
                    .children('tr[data-field="' + sField + '"]');
                dFieldRow.append(sHTML);
            });
            
        });
        self._dom.fields.removeClass('CA_ajax_loading');
        if (self._bSingle ) {
            var aStructure = self._structure[aEls[0].data('calendar')];
            if (aStructure == undefined || aStructure.childFields == undefined) {
                return;
            }
            self.childFields = typeof(aStructure.childFields) == 'string' 
                ? JSON.parse(aStructure.childFields) 
                : aStructure.childFields;
            sHTML = '';
            if (self.childFields != undefined && self.childFields.length > 0) {
                
                for (nI = 0; nI < self.childFields.length; nI++) {
                    sHTML += '<span data-action="switchTab" data-tab="child_' + self.childFields[nI].label + '">' 
                    + self._parent._objects.getObjectLabel(self.childFields[nI].object)
                    + '</span>';
                }
                
            }
            var aAddons = typeof(self._parent.params.addons) == 'string' 
                ? self._parent.params.addons.split(",") 
                : self._parent.params.addons,
                aAutoStart = [];
            for (var nJ = 0; nJ < aAddons.length; nJ++) {
                if (aAddons[nJ] == '' || typeof(self._parent._addons[aAddons[nJ]]) == 'undefined') {
                    continue;
                }
                if (aAddons[nJ] == 'invite' && sSingleObject != 'event') {
                    continue;
                }
                sHTML += '<span data-action="switchTab" data-tab="addon_' + aAddons[nJ] + '">' 
                    + self._parent._addons[aAddons[nJ]].title
                    + '</span>';
                if (self._parent._addons[aAddons[nJ]].auto === true) {
                    aAutoStart.push(aAddons[nJ]);
                }
            }
            if (aAutoStart.length > 0) {
                self._autoStartAddon(aAutoStart);
            } else {
                self._dom.el.removeClass('_info_loading');
            }
            
            sHTML = sHTML != '' 
                ? '<span data-tab="fields" data-action="switchTab" class="_on">'
                    + self._parent.getText('details_general', 'General')
                    + '</span>' + sHTML 
                : '';
            self._dom.tabs.html(sHTML);
        }
    }
    
    
    self._findEvent = function(sId, aData) {
        if (aData == undefined || aData.length == undefined)  {
            return -1;
        }
        for (var nI = 0; nI < aData.length; nI++) {
            if (aData[nI].id == sId) {
                return nI;
            }
        }
        return -1;
    }
    
    self._buildFieldsNames = function(aAllFields) {
        var sHTML = '', nI;
        sHTML = 
            '<table>'
            + (!self._bSingle 
                ? '<tbody data-general="main">'
                    + '<tr data-field="calendar"><td>'
                    + self._parent.getText('details_calendar', 'Calendar')
                    + '</td></tr>'
                    + '<tr data-field="title"><td>'
                    + self._parent.getText('details_title', 'Title')
                    + '</td></tr>'
                    + '<tr data-field="start"><td>'
                    + self._parent.getText('details_start', 'Start')
                    + '</td></tr>'
                    + '<tr data-field="end"><td>'
                    + self._parent.getText('details_end', 'End')
                    + '</td></tr>'
                    + (self._parent.isMobile() || true 
                        ? '<tr data-field="action"><td>'
                            + self._parent.getText('details_action', 'Action')
                            + '</td></tr>' 
                        : ''
                    )
                + '</tbody>'
            : '');
        
        jQuery.each(aAllFields, function(sObjectName, aFields){
            sHTML += '<tbody data-object="' + sObjectName + '">'
                + (!self._bSingle ? 
                    '<tr class="object_title">'
                    + '<td>' + self._aObjectsLabel[sObjectName].htmlspecialchars() + '</td>'
                    + '</tr>'
                : "");
            jQuery.each(aFields, function(sField, aField){
                sHTML += 
                    '<tr data-field="' + sField + '">'
                    + '<td>' + aField.label.htmlspecialchars() + ' </td>'
                    + '</tr>';
            });
            sHTML += '</tbody>';
        });
        sHTML += '</table>';
        
        

        
        self._dom.fields.html(sHTML);
        self._parent.checkPopupVisiblility();        
    }
    
    
    self._showDate = function(aField, mValue, aAllData) {
        var dDate = new Date,
            sFormat = aField.type == 'DATE' 
                || (aAllData != undefined && aAllData.allDay === true)
                ? self._parent.options.format['date']
                : self._parent.options.format['shortDatetime'];
        if (jQuery.isNumeric(mValue)) {
            if (mValue  != 0) {
                dDate.setTime(mValue * 1000);
                return dDate.format(sFormat);
            } else {
                return '';
            }
        } else if (typeof(mValue) == 'string') {
            dDate = new Date.preParseSF(mValue, aField.type);
            if (dDate.isValid() && dDate.getTime() != 0) {
                return dDate.format(sFormat);
            } else {
                return '';
            }
        }
        
        return mValue == undefined ? '  ' : mValue.format(sFormat);
    }
    self._showDatetime = function(aField, mValue, aAllData) {
        return self._showDate(aField, mValue, aAllData);
    }
    
    self._showCombobox = function(aField, mValue) {
        if (typeof(aField.options) == 'undefined') {
            return "";
        }
        if (mValue == undefined) {
            return '';
        }
        if (!aField.multiselect || aField.multiselect == 'false') {
            mValue = [mValue];
        }
        var aResult = [], sVal;
        if (aField.options != undefined) {
            for (var nI = 0; nI < aField.options.length; nI++) {
                if (mValue.indexOf(aField.options[nI].value) >= 0) {
                    sVal = (aField.options[nI].name != undefined 
                            ? aField.options[nI].name 
                            : aField.options[nI].value
                        );
                    if (sVal != '' && sVal != null) {
                        aResult.push(sVal.htmlspecialchars());
                    }
                }
            }
        }
        return aResult.length > 0 
            ? aResult.join(",") 
            : (mValue.length == 1 && typeof(mValue[0]) == 'string' && mValue[0] != '' 
                ? mValue[0]
                : '');
    }
    
    self._showReference = function(aField, mValue, aAllData) {
        if (mValue == undefined || mValue == null) {
            return '';
        }
        var sAddResult = aAllData[aField.name.toLowerCase() + '_name']
            || aAllData[aField.name.toLowerCase() + '.name']
            || aAllData[aField.name.toLowerCase()]
            || mValue,
            sResult = mValue != '' && self._parent.options.readonly.detail !== false
            ? '<a href="/' + mValue + '" target="_blank" data-action="show_ref_field" data-id="' + mValue + '" class="_ref">' 
            : '';
//        if (typeof(aAllData[aField.name.toLowerCase() + '_name']) != 'undefined') {
//            sResult += aAllData[aField.name.toLowerCase() + '_name'].htmlspecialchars();
//        } else if (typeof(aAllData[aField.name.toLowerCase() + '.name']) != 'undefined') {
//            sResult += aAllData[aField.name.toLowerCase() + '.name'].htmlspecialchars();
//        }  else if (typeof(aAllData[aField.name.toLowerCase()]) != 'undefined') {
//            sResult += aAllData[aField.name.toLowerCase()].htmlspecialchars();
//        } else {
//            sResult += mValue.htmlspecialchars();
//        }
        sResult += (sAddResult != undefined && sAddResult != null && typeof(sAddResult) == 'string') 
            ? sAddResult.htmlspecialchars()
            : "";
        sResult += mValue != '' && self._parent.options.readonly.detail !== false ? '</a>' : '';
        return sResult;
    }
    
    self._showLocation = function(aField, mValue, aAllData) {
        var sResult = '',
            sRealFieldName = aField.name.substr(-3, 3) == '__c' 
                ? aField.name.substr(0, aField.name.length - 3) 
                : aField.name;
        if (aAllData[sRealFieldName + '__latitude__s'] != undefined && aAllData[sRealFieldName + '__longitude__s'] != undefined) {
            var nLat = aAllData[sRealFieldName + '__latitude__s'],
                nLong = aAllData[sRealFieldName + '__longitude__s'] ;
            sResult = '<a data-action="showUrl" href="https://www.google.com.ua/maps?hl=uk&ll='
                + nLat + ',' + nLong + '" target="_blank">'
                + nLat
                + (nLat > 0 ? 'N' : 'S')
                + ' '
                + nLong 
                + (nLong > 0 ? 'W' : 'E')
                + '</a>';
        }
        return sResult;
    }
    
    self._showId = function(aField, mValue, aAllData) {
        return self._showReference(aField, mValue, aAllData);
    }
    
    self._showPicklist = function(aField, mValue, aAllData) {
        var mVal = mValue;
        if (aField.options != undefined) {
            var oPattern = new RegExp('[0-9a-zA-Z]{18}'),
                mIDVal = null;
            if (mVal != null && mVal.match(oPattern) != null) {
                mIDVal = mVal.substring(0, 15);
            }
            for (var nJ = 0; nJ < aField.options.length; nJ++) {
                if (aField.options[nJ].key != undefined && mVal == aField.options[nJ].key
                    || mIDVal == aField.options[nJ].key
                ) {
                    mVal = aField.options[nJ].value != undefined 
                        ? aField.options[nJ].value 
                        : aField.options[nJ].name;
                    break;
                }
            }
        }
        return mVal != null ? mVal.htmlspecialchars() : "";
    }
    
    self._showCombobox = function(aField, mValue, aAllData) {
        return self._showPicklist(aField, mValue, aAllData);
    }
    
    self._showUrl = function(aField, mValue, aAllData) {
        if (mValue == null || mValue == '') {
            return '';
        }
        return '<a data-action="showUrl" href="' + mValue + '" target="_blank">' + mValue.htmlspecialchars() + '</a>';
    }
    
    self._showDouble = function(aField, mValue, aAllData) {
        if (aField.attr == undefined || aField.attr.step == undefined) {
            if(mValue != null && aField.scale != undefined) {
                var valueFloat = parseFloat(mValue)
                return valueFloat.toFixed(aField.scale)
            } else {
                return mValue;
            }
        }
        if (mValue == null || mValue == '') {
            return '';
        }
        if (aField.attr.step >= 1) {
            return '' + parseInt(mValue);
        }
        var nLevel = ('' + aField.attr.step).length - 2,
            nPow = Math.pow(10, nLevel);
        //return '' + (Math.round(parseFloat(mValue) * nPow) / nPow);
        var valueFloat = parseFloat(mValue)
        return valueFloat.toFixed(aField.scale)
    }
    
//    self._showCurrency = function(aField, mValue, aAllData) {
//        return self._showDouble(aField, mValue, aAllData);
//    }
    
    self._showInteger = function(aField, mValue, aAllData) {
        return self._showDouble(aField, mValue, aAllData);
    }
    
    self._showNumber = function(aField, mValue, aAllData) {
        return self._showDouble(aField, mValue, aAllData);
    }
    
    self._copyFromResult = function(aData) {
        var aResult = [];
        for (var nI = 0; nI < aData.length; nI++) {
            aResult.push({
                "id" : aData[nI].id,
                "data" : aData[nI]
            });
        }
        return aResult;
    }
    
    
    self._show_ref_fieldAction = function(el, evt) {
        var oLinkEl = jQuery(evt.target);
        if (typeof(self._parent.options.func.externalLink) == 'function') {
            return self._parent.options.func.externalLink(oLinkEl.data('id'), evt);
        }
        self._parent.openExternalUrl(oLinkEl.attr('href'));
        return false;
    }
    
    self._showUrlAction = function(el, evt) {
        var oLinkEl = jQuery(evt.target);
        self._parent.openExternalUrl(oLinkEl.attr('href'));
        return false;
    }
    
    self._delAction = function(el, evt)  {
        self._parent.layout.delEvent(self._oBar.data('event'), self._oBar.data('calendar'));
        self._parent.hidePopup();
        return self._parent._cancelBubble(evt);
    }
    
    self._detailsAction = function(el, evt)  {
        return self._parent.layout.showEventDetailUrl(el.data('event'), evt);
    }
    
    self._deleteAction = function(el)  {
        var evtId = el.data('event');
        self._parent.layout.delEvent(evtId, el.data('calendar'));
        self._parent.hidePopup();
    }
    
    self._editAction = function(el, evt)  {
        self._parent.hidePopup();
        var oEvt = self._oBaseEvt != null ? self._oBaseEvt : evt;
        self._parent.layout.showCreateEventForm({
            "cid" : self._oBar.data('calendar'),
            "eventId" : self._oBar.data('event'),
            "onClose" : function() {
                self._parent.layout.buildData();
            }, 
            "event" : oEvt
        });
        return self._parent._cancelBubble(evt);
    }
    
    self._menuAction = function(el, evt)  {
        self._parent.layout.showEventSubmenu(self._oBar, self._parent.popupOption('event'));
        self._parent.log('event bar ' + self._oBar ); //+ self._oBar.html()
        return self._parent._cancelBubble(evt);
    }
    
    self._switchTabAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        var oTab = self._dom.el.children('[data-tab="' + oEl.data('tab') + '"]'),
            sTabType = oEl.data('tab').indexOf('child') >= 0 ? "child" : (oEl.data('tab') == 'fields' ? "fields" : "addon"),
            sTabName = oEl.data('tab').replace('child_', '').replace('addon_', '');
        if (oTab.size() < 1) {
            oTab = jQuery('<div data-tab="' + oEl.data('tab') + '" class="_' + sTabType + '"></div>');
            oTab.insertAfter(self._dom.fields);
            if (sTabType == 'child') {
                var oChildData = self._getChildRelation(sTabName);
                if (oChildData != null) {
                    self._parent._addQueue([
                        function(){
                            self._parent._objects.getObjects(oChildData.object, null, {
                                loadReferenced : true, 
                                "onlySingleReference" : true
                            });
                        },
                        function(){
                            self._buildChildListTable(oChildData, oTab);
                        },
                        function(){
                            self._parent._objects.getChildTableData(oChildData, 0, self._oBar.data('event'), '', function(data){
                                self._fillChildListTable(oChildData, data, oTab);
                                self._fillChildPages(oChildData, data, oTab);
                            });
                        },
                        self._parent.checkPopupVisiblility
                    ]);
                }
                self._prepareChildTab(sTabName);
            } else if(sTabType == 'addon') {
                self._prepareAddonTab(sTabName, oTab);
            }
        } else {
            if (sTabType == 'addon') {
                self._refreshAddonTab(sTabName);
            }
        }
        self._dom.el.children('[data-tab]').hide();
        oTab.show();
        self._parent.checkPopupVisiblility();
        oEl.siblings().removeClass('_on');
        oEl.addClass('_on');
    }
    
    self._childDataAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        var oTab = oEl.parents('._child'),
            oTbl = oTab.children('table'),
            sTabName = oTab.data('tab').replace('child_', ''),
            oChildData = self._getChildRelation(sTabName),
            nRecnum = oChildData == null ? -1 : oTbl.data('recnum') + (parseInt(oEl.data('param')) * parseInt(oChildData.hm));
        if (nRecnum < 0 || nRecnum > oTbl.data('counts')) {
            return;
        }
        self._parent._objects.getChildTableData(oChildData, nRecnum, self._oBar.data('event'), '', function(data){
            self._fillChildListTable(oChildData, data, oTab);
            oTbl.data('recnum', nRecnum);
        });
    }
    
    
    self._prepareChildTab = function(sChild) {
        
    }
    
    self._buildChildListTable = function(oChild, oTab) {
        var sHTML = '<table data-recnum="0" data-counts="0"><thead><tr>',
            aFields = oChild.fields.split(','),
//            aStructure = self._parent._objects.getObject(oChild.object).fields,
            nCount = 0;
    
        for (var nI = 0; nI < aFields.length; nI++) {
            var aField = self._parent._objects.getObjectFieldByName(oChild.object, aFields[nI]);
            //        aStructure[aFields[nI]] != undefined ? aStructure[aFields[nI]] : null;
            if (aField == null) {
                continue;
            }
            sHTML += '<th data-fid="' + aFields[nI] + '">' + aField.label + '</th>';
            nCount++;
        }
        sHTML += '</tr></thead><tbody></tbody>'
            + '<tfoot><th colspan="' + nCount + '"></th></tfoot>';
        
        oTab.html(sHTML);
    }
    
    self._fillChildListTable = function(oChild, aData, oTab){
        
        var sHTML = '',
//            aStructure = self._parent._objects.getObject(oChild.object).fields,
            aFields = oChild.fields.split(','),
            aField;
        aData.data = typeof(aData.data) == 'string' ? JSON.parse(aData.data) : aData.data;
        if (aData.data == undefined || aData.data.length == undefined || aData.data.length < 1)  {
            return;
        }
        for (var nJ = 0; nJ < aData.data.length; nJ++) {
            sHTML += '<tr>';
            for (var nI = 0; nI < aFields.length; nI++) {
                aField = self._parent._objects.getObjectFieldByName(oChild.object, aFields[nI]);
                //        aStructure[aFields[nI]] != undefined ? aStructure[aFields[nI]] : null;
                if (aField == null) {
                    continue;
                }
                var sValue = self._parent._objects.getFieldSimpleTextValue(aField.type, aData.data[nJ][aFields[nI]]) ;
                sHTML += '<td>' 
                    + (nI == 0 && oChild.showurl ? '<a href="' 
                        + (oChild.url != '' 
                            ? oChild.url.replace('[id]', aData.data[nJ]['id']) 
                            : '/' + aData.data[nJ]['id']
                        )
                        + '" class="_ref" data-action="show_ref_field" data-id="' + aData.data[nJ]['id'] + '">'
                        : ""
                    )
                    + (sValue  != undefined ? sValue : '')
                    + (nI == 00 && oChild.showurl ? "</a>" : "")
                    + '</td>';
            }
            sHTML += '</tr>';
        }
        oTab.find('tbody').html(sHTML);
        
    }
    
    self._fillChildPages = function(oChild, aData, oTab){
        var sHTML = '<span data-action="childData" data-param="-1" class="small_button" title="'
            + self._parent.getText('previous', 'Previous')
            + '">&lt;&lt;</span>'
            + '&nbsp;&nbsp;&nbsp;'
            + '<span data-action="childData" data-param="+1" class="small_button" title="'
            + self._parent.getText('next', 'Next')
            + '">&gt;&gt;</span>';
        oTab.find('tfoot th').html(sHTML);
        oTab.children('table').data('counts', parseInt(aData.counts));
    }
    
    self._prepareAddonTab = function(sAddon, oTab, fFunc) {
        if (self._parent._addons[sAddon] == undefined) {
            return;
        }
        
        self._parent.initAddon(sAddon, function(oAddon){
            var aEventData = self._parent._events.getEvent(self._oBar.data('event'), self._oBar.data('calendar'))[0],
                oCalendar = aEventData.getCalendar();
            
            oAddon.show(oTab, {"object" : oCalendar.objectName,  "id" : self._oBar.data('event'), "event" : aEventData, 
                "detail" : self._aEventsData != null && self._aEventsData.length > 0 ? self._aEventsData[0] : null
            });
            if (typeof(fFunc) == 'function') {
                self._parent._addQueue(fFunc);
                //fFunc();
            }
            self._parent.checkPopupVisiblility();
        });
    }
    
    self._refreshAddonTab = function(sAddon) {
        if (self._parent._addons[sAddon] == undefined) {
            return;
        }
        self._parent.initAddon(sAddon, function(oAddon){
            oAddon.refresh();
        });
    }
    
    self._autoStartAddon = function(aAddons) {
        for (var nI = 0; nI < aAddons.length; nI++) {
            var oTab = jQuery('<div data-tab="addon_' + aAddons[nI] + '" class="_addon" style="display:none"></div>');
            oTab.insertAfter(self._dom.fields);
            self._prepareAddonTab(aAddons[nI], oTab, function(){
                self._dom.el.removeClass('_info_loading');
                self._parent.checkPopupVisiblility();
            });
        }
    }
    
    self._buildSingleTitle = function(aEl) {
        
        var sHTML = '', 
            aCalendar = self._parent._calendars.getCalendar(aEl.data('calendar')),
            aEvents = self._parent._events.getEvent(aEl.data('event'), aEl.data('calendar'));
        
        var aEvent = jQuery.isArray(aEvents) ? aEvents.shift() : aEvents,
            sFieldType = (
                        aEvent != undefined 
                        && aEvent['isalldayevent'] != undefined 
                        && aEvent['isalldayevent'] 
                    )
                    ? 'DATE'
                    : 'DATETIME';
        if (aCalendar == undefined) {
            aCalendar = {"name" : "---", "objectLabel" : "---"}
            self._aPostCalendar.push(aEl.data('calendar'))
        } else {
            self._bNoAdditionalLoading = aCalendar.calendarType == 'web';
        }
        sHTML += 
            '<div class="title ' 
                + 'color_' + aEl.data('calendar')
                + (aEvent.specColor != undefined && aEvent.specColor != '' ? ' ' + self._parent._events.getEventColor(aEvent.specColor) : '')
                + '">' 
                + '<span class="calendar">' + aCalendar.name.htmlspecialchars() + '</span>'
                + '<span class="object">' + 
                    (aCalendar.objectLabel != undefined 
                        ? aCalendar.objectLabel 
                        : (aCalendar.objectName != undefined ? aCalendar.objectName : "Web calendar")
                    ).htmlspecialchars()
                + '</span>'
            + '</div>'
            + '<div class=event_title>' 
                + (aCalendar.titleHTML !== true && typeof(aEvent.title) == 'string'
                    ? aEvent.title.htmlspecialchars() 
                    : aEvent.title
                )
                + '<span class=dates>'
                    + (aEvent.start != undefined && aEvent.start != '' 
                        ? self._showDate({type : sFieldType}, aEvent.start, aEvent)  
                        : ""
                    )
                    + (aEvent.end != undefined 
                        && aEvent.end != '' 
                        && aEvent.dateEnd.getTime() != aEvent.dateStart.getTime()
                        ? (' - ' + self._showDate({type : sFieldType}, aEvent.end, aEvent))  
                        : ""
                    )
                + '</span>'
            + '</div>';
        
        
        return sHTML;
        
    }
    
    self._postUpdateCalendars = function(aCalendarsData) {
        for (var nI = 0; nI < aCalendarsData.length; nI++) {
            var oTitle = self._dom.title.filter('.color_' + aCalendarsData[nI].id),
                aCalendar = aCalendarsData[nI];
            oTitle.find('.calendar').text(aCalendar.name);
            oTitle.find('.object').text(aCalendar.objectLabel != undefined ? aCalendar.objectLabel : aCalendar.objectName);
        }
    }
    
    self._getChildRelation = function(sRelation) {
        if (self.childFields == undefined || self.childFields.length < 1) {
            return null;
        }
        for (var nJ = 0; nJ < self.childFields.length; nJ++) {
            if (self.childFields[nJ].label == sRelation) {
                return self.childFields[nJ];
            }
        }
        return null;
    }
    
    self._objectSpecial = {}
    
    self._objectSpecial.event = {
        start : function(){
            this.multicontactsinevent = false;
            if (!self._bSingle || self._structure[self._oBar.data('calendar')] == undefined) {
                return;
            }
            var oCalendar = self._parent._calendars.getCalendar(self._oBar.data('calendar'));
            if (oCalendar == undefined || self._aFields[oCalendar.objectName] == undefined) {
                return;
            }
            var aFields = Array.objectKeys(self._aFields[oCalendar.objectName]);
            
            
            for (var nI = 0; nI < aFields.length; nI++) {
                if (self._parent.getParam('multiContactsInEvent', false) && aFields[nI] == 'whoid' 
                    && self._parent._objects.checkProfile('sharedactivities')
                ) {
                    this.multicontactsinevent = true;
                    var oChild = {
                        "label" : 'Event Who Relations',
                        "field" : 'eventid',
                        "object" : "EventWhoRelation",
                        "fields" : "id,relationid,eventid",
                        "hm" : 99,
                        "url"   : "",
                        "showurl" : ""
                    };
                    self._parent._objects.getChildTableData(oChild, 0, self._oBar.data('event'), '', function(data){
                        var aList = typeof(data.data) == 'string' ? JSON.parse(data.data) : data.data,
                            oFieldEl = self._dom.fields.find('[data-field="whoid"] td').eq(1),
                            sText = '';
                            
                        if (aList.length < 1) {
                            return;
                        }
                        for(var i=0; i < aList.length; i++) {
                            sText += 
                                (sText != '' ? ',&nbsp;' : '')
                                + (self._parent.options.readonly.detail !== false
                                ? '<a href="/' + aList[i]['relationid'] + '" '
                                    + ' target="_blank" data-action="show_ref_field" '
                                    + ' data-id="' + aList[i]['relationid'] + '"'
                                    + ' class="_ref "'
                                    + '>'
                                : '')
                                + aList[i]['relationid.name'].htmlspecialchars()
                                + (self._parent.options.readonly.detail !== false ? '</a>' : '');
                        }
                        oFieldEl.html(sText);
                    });
                }
            }
            
        }
    }
    
    jQuery.calendarAnything.appendView('eventDetail', view);
})();
