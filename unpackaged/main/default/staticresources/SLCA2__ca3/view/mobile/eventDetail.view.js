/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css        : '/css/mobile/event-detail.css',
        _parent     : null,
        _div        : null, 
        _dom        : {},
        _structure  : {},
        _aFields    : [],
        _oBar       : null,
        _bNoAdditionalLoading : false,
        _aObjectsLabel : {},
        _aPostCalendar : [],
        _oBaseEvt   : null
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
    }
    
    view.reset = function(){
        self._structure = {};
    }
    
    self._show = function(params) {
        var sHTML = self._buildHTML(params);
        self._parent.showPopup({
            html        : sHTML,
//            coords : {"x" : params.event.clientX - 10, "y" : params.event.clientY - 10},
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
//        setTimeout(function(){
//            self._preloadEventsData(params.els);
//        }, 20000);
        if (!self._bNoAdditionalLoading) {
            self._preloadEventsData(params.els);
        }
        self._oBaseEvt = params.event;
    }
    
    self._buildHTML = function(params) {
        var sHTML = '';
        if (params.els == undefined || params.els.length < 1){
            return '<div class=event_detail>Bad event</div>';
        }
        self._bNoAdditionalLoading = false;
        self._aPostCalendar = [];
//        var aFirstEl = params.els[0];
//        var aCalendar = self._parent._calendars.getCalendar(aFirstEl.data('calendar'));
        //console.log(aCalendar);
        sHTML = '<div class="CA_event_detail single">'
                + self._buildSingleTitle(params.el) 
                + '<div class=message></div>'
                + '<div class="fields ' + (!self._bNoAdditionalLoading ? 'CA_ajax_loading' : '_hide' ) + '"></div>' 
                + '<div class=buttons>'
//            + '<span data-mode="edit" >Edit</span>'
                    + (
                        (   self._parent.options.readonly !== true
                            && self._parent.options.readonly.edit !== false 
                            && !params.el.hasClass('non_e') 
                            && self._parent.options.detailUrl != '0'
                            ? '<span data-action="edit">Edit</span>' 
                            : ''
                        )
                        + (self._parent.options.detailUrl != '0' 
                            && self._parent.options.readonly.detail !== false 
                            ? '<span data-action="details">Details</span>' 
                            : ''
                        )
                        + (
                            (self._parent.options.readonly.contextEvent !== false 
//                                && self._parent.options._small !== true
                            ) 
                            ? '<span data-action="menu">More</span>' 
                            : ''
                        )
                    )
                    + '<span data-mode="cancel" >Close</span>'
                + '</div>'
            + '</div>';
        return sHTML;
    }
    
    
    self._initEvents = function(wPopup) {
        self._dom.el = wPopup.find('.CA_event_detail');
        self._dom.fields = self._dom.el.find('.fields');
        self._dom.message = self._dom.el.find('.message');
        self._dom.title = self._dom.el.find('.title');
        //'click'
        self._dom.el.on(self._parent.eventNames.click, '.buttons > span', function(){
            var el = jQuery(this);
            if (el.data('mode') == 'cancel') {
                self._parent.hidePopup();
                return false;
            } else if (el.data('mode') == 'edit') {
                alert('Ho! go to edit!');
                //self._dom.form.trigger('submit');
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
                    self._showEventsListData(aEls, aResult.data);
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
        var sHTML = '',
            aEl2Data = aElsData[0];
            
        jQuery.each(self._aFields, function(sObjectName, aFields){
            jQuery.each(aFields, function(sField, aField){
                var mFieldValue = '';
                if (aEl2Data.data != undefined) {
                    mFieldValue = aEl2Data.data[sField];
                    mFieldValue = (self['_show' + aField.type.capitalize()] != undefined)
                        ? self['_show' + aField.type.capitalize()](aField, mFieldValue, aEl2Data.data)
                        : mFieldValue;
                }
                if (mFieldValue != undefined && mFieldValue.trim() != '') {
                    sHTML += '<p><b>' + aField.label + '</b>'
                        + '<span>' + mFieldValue + '</span>'
                        + '</p>';
                }
            });
        });
        self._dom.fields.html(sHTML).removeClass('CA_ajax_loading');
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
        var aResult = [];
        if (aField.options != undefined) {
            for (var nI = 0; nI < aField.options.length; nI++) {
                if (mValue.indexOf(aField.options[nI].value) >= 0) {
                    aResult.push(aField.options[nI].name != undefined ? aField.options[nI].name : aField.options[nI].value);
                }
            }
        }
        return aResult.length > 0 
            ? aResult.join(",") 
            : (mValue.length == 1 && typeof(mValue[0]) == 'string' && mValue[0] != '' 
                ? mValue[0]
                : '');
        //console.log(aField, mValue);
    }
    
    self._showReference = function(aField, mValue, aAllData) {
        if (mValue == undefined) {
            return '';
        }
        var sResult = mValue != '' && self._parent.options.readonly.detail !== false
            ? '<a href="/' + mValue + '" target="_blank" data-action="show_ref_field" data-id="' + mValue + '" class="_ref">' 
            : '';
        if (typeof(aAllData[aField.name.toLowerCase() + '_name']) != 'undefined') {
            sResult += aAllData[aField.name.toLowerCase() + '_name']
        } else if (typeof(aAllData[aField.name.toLowerCase() + '.name']) != 'undefined') {
            sResult += aAllData[aField.name.toLowerCase() + '.name']
        }  else if (typeof(aAllData[aField.name.toLowerCase()]) != 'undefined') {
            sResult += aAllData[aField.name.toLowerCase()];
        } else {
            sResult += mValue;
        }
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
            sResult = '<a href="https://www.google.com.ua/maps?hl=uk&ll='
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
        return mVal;
    }
    
    self._showCombobox = function(aField, mValue, aAllData) {
        return self._showPicklist(aField, mValue, aAllData);
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
        //console.log(el, evt);
        if (typeof(self._parent.options.func.externalLink) == 'function') {
            return self._parent.options.func.externalLink(oLinkEl.data('id'), evt);
        }
        return true;
    }
    
    self._delAction = function(el, evt)  {
        self._parent.layout.delEvent(self._oBar.data('event'), self._oBar.data('calendar'));
        self._parent.hidePopup();
        return self._parent._cancelBubble(evt);
    }
    
    self._detailsAction = function(el, evt)  {
        return self._parent.layout.showEventDetailUrl(el.data('event'), evt);
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
        //console.log(evtId);
    }
    
    self._menuAction = function(el, evt)  {
        self._parent.layout.showEventSubmenu(self._oBar, self._parent.popupOption('event'));
        self._parent.log('event bar ' + self._oBar ); //+ self._oBar.html()
        return self._parent._cancelBubble(evt);
    }
    
    self._closeAction = function() {
        self._parent.hidePopup();
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
                + (aEvent.specColor != undefined && aEvent.specColor != '' ? ' ' + aEvent.specColor : '')
                + '">' 
                + '<span  data-action="close" class="_small_button">&lt;</span>'
                + '<span class="calendar">' + aCalendar.name.htmlspecialchars() + '</span>'
                + '<span class="object">' + 
                    (aCalendar.objectLabel != undefined 
                        ? aCalendar.objectLabel 
                        : (aCalendar.objectName != undefined ? aCalendar.objectName : "Web calendar")
                    ) 
                + '</span>'
            + '</div>'
            + '<div class=event_title>' 
                + aEvent.title.htmlspecialchars()
//                + (aEvent.url != undefined && aEvent.url != ''  
//                    ? '<a href="' + aEvent.url +'" target=_blank>&gt</a>'
//                    : ""
//                )
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
    
    jQuery.calendarAnything.appendView('mobile/eventDetail', view);
})();