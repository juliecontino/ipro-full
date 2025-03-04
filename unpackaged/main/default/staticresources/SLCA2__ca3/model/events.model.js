/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var eventsModel = function(data, parent) {
    //var self = this;
    var self = {
        _period : {
            "week"          : {},
        },
        _data : [],
        _parent : parent,
        _eventCache : {},
        _aBasket : [],
        _bCutMode : false,
        _sText  : "",
        _aSearchCalendars : [],
        _sSearchFields : 'all',
        _aDefaultAdditionalTitleParams : {"label" : "<b>", "value" : "<i>", "split" : ": ", "line" : "<br>", "html" : true, "showLabels" : false},
        _dMin : null,
        _dMax : null,
        _aFilterPanel : null,
        _oSwitchDisable : {},
        _oUncheckDisable : []
    },
    oModel = this;
    
    
    self._init = function(data) {
        if (data != undefined && data.length > 0) {
            self._initDataWeeks(data);
            self._prepareData(data);
        }
    }
    
    
    
    self._refresh = function(data, dateParams) {
        if (data != undefined && data != null) {
            self._parseStringValues(data);
        }
        data = data || [];
        dateParams = dateParams || {};
        self._initDataWeeks(data, dateParams);
        if (typeof(data) != 'undefined' && data.length > 0) {
            self._prepareData(data);
        }
//        console.table(data);
        data.quickSort(function(a, b){
            return self._sortEvents(a, b);
        });

        self._postPrepareData(data);
        self._calculateMonthData(data, dateParams);
    }
    
    self._updateEvent = function(mEvent, aWhat, aFilter, fFunc) {
        var aWeeksToRefresh = [], 
            nJ,
            dMin, dMax,
            sOldCalendar,
            aCalendarsToClear = [],
            nCounter = 0;
        
        if (typeof(mEvent) == 'string') {
            mEvent = self._getEvent(mEvent);
        } else if (jQuery.isPlainObject(mEvent)) {
            if (mEvent.type != undefined && mEvent.type == 'list_with_calendars') {
                var aTmp = [];
                mEvent['type'] = undefined;
                delete mEvent['type'];
                jQuery.each(mEvent, function(sEvent, aCalendars){
                    aTmp = aTmp.concat(self._getEvent(sEvent, {"similar_calendar" : aCalendars}));
                });
                mEvent = aTmp;
                
            } else {
                mEvent = [mEvent];
            }
        } else if (mEvent == null) {
            mEvent = self._data;
        } else if (jQuery.isArray(mEvent)) {
            var aNewEvents = [], aTmp;
            for (var nI = 0; nI < mEvent.length; nI++) {
                if (typeof(mEvent[nI]) == 'string') {
                    aNewEvents = aNewEvents.concat(self._getEvent(mEvent[nI]));
                } else if (mEvent[nI].id != undefined) {
                    aNewEvents = aNewEvents.concat(self._getEvent(mEvent[nI].id, {"similar_calendar" : mEvent[nI].calendar}));
                }
            }
            mEvent = aNewEvents;
        }
        var el, dCheckStart, dCheckEnd, aSaveToServer = [];
        for (var i = 0; i < mEvent.length; i++) {
            el = mEvent[i];
            if (aFilter != undefined && aFilter != null) {
                if (!self._checkEventFilter(el, aFilter)) {
                    continue;
                }
            }
            nCounter++;
            dCheckStart = new Date(el.dateStart);
            dCheckEnd = new Date(el.dateEnd);
            dMin = dMin == undefined ? Date.baseDate(dCheckStart) : dMin.getMinDate(dCheckStart);
            dMax = dMax == undefined ? Date.baseDate(dCheckEnd) : dMax.getMinDate(dCheckEnd);
            var oCal = sOldCalendar === el.calendarid ? oCal : self._parent._calendars.getCalendar(el.calendarid);
            sOldCalendar = el.calendarid;
            aCalendarsToClear.push(el.calendarid);
            
            if (aWhat["day_left_change"] != undefined || aWhat["day_change"] != undefined) {
                el.dateStart.changeDate(el.changeLeft == undefined || el.changeLeft ? aWhat["day_left_change"] || aWhat["day_change"] : 0);
            } 
            if (aWhat["day_right_change"] != undefined || aWhat["day_change"] != undefined) {
                el.dateEnd.changeDate(el.changeRight == undefined || el.changeRight ? aWhat["day_right_change"] || aWhat["day_change"] : 0);
            }
            if (aWhat["hour_left_change"] != undefined || aWhat["hour_change"] != undefined) {
                el.dateStart.changeHour(el.changeLeft == undefined || el.changeLeft ? aWhat["hour_left_change"] || aWhat["hour_change"] : 0);
            } 
            if (aWhat["hour_right_change"] != undefined || aWhat["hour_change"] != undefined) {
                el.dateEnd.changeHour(el.changeRight == undefined || el.changeRight ? aWhat["hour_right_change"] || aWhat["hour_change"] : 0);
            }            
            if (aWhat["disable"] != undefined) {
                el.disable = aWhat["disable"];
            }
            if (aWhat["nonsearched"] != undefined) {
                el.nonsearched = aWhat["nonsearched"];
            }
            if (aWhat["title"] != undefined) {
                el.title = aWhat["title"];
            }
            
            
//            if (aWhat["change_field_name"] != undefined) {
//                el.group = aWhat["change_field_value"];
//            }
            
            
            if (
                dCheckStart.getTime() !=  el.dateStart.getTime()
                || 
                dCheckEnd.getTime() !=  el.dateEnd.getTime()
            ) {
                    
                if (el.dateStart.getTime() > el.dateEnd.getTime()) {
                    if (el.lFixed) {
                        el.dateStart
                            .changeDate(el.dateEnd.getDaysFrom(el.dateStart))
                            .changeDate(el.dateStart > el.dateEnd ? -1 : 0);
                    } else if (el.rFixed) {
                        el.dateEnd
                            .changeDate(el.dateStart.getDaysFrom(el.dateEnd))
                            .changeDate(el.dateStart > el.dateEnd ? 1 : 0);
                    } else {
                        Date.swap(el.dateStart, el.dateEnd);
                    }
                }
                
                
                
                el.dayStart.setDay(el.dateStart);
                el.dayEnd.setDay(el.dateEnd);
                
                el.start = el.dateStart.toString();
                el.end = el.dateEnd.toString();
                
                
                dMin = dMin.getMinDate(el.dateStart);
                dMax = dMax.getMinDate(el.dateEnd);

                
                aWeeksToRefresh = aWeeksToRefresh.concat(el.week);
                self._setEventWeeks(el);
                aSaveToServer.push({
                    "calendar"  : el.calendarid,
                    "start"     : el.dateStart.toISOString(),
                    "end"       : el.noEnd ? "" : el.dateEnd.toISOString(),
                    "id"        : el.id
                });
            } else if (aWhat['fields'] != undefined && aWhat['fields'][el.id] != undefined) {
                aSaveToServer.push({
                    "calendar"  : el.calendarid,
                    "id"        : el.id
                });
            }
            if (el.changeRight != undefined || el.changeLeft != undefined) {
                delete el.changeRight;
                delete el.changeLeft;
            }
        }
        
        
        if (aSaveToServer.length > 0) {
            var aChanges = {
                "ld" : aWhat["day_left_change"] || aWhat["day_change"],
                "rd" : aWhat["day_right_change"] || aWhat["day_change"],
                "lh" : aWhat["hour_left_change"] || aWhat["hour_change"],
                "rh" : aWhat["hour_right_change"] || aWhat["hour_change"],
                'respectReminder' : self._parent.getParam('respectReminderDD', 'off')
            }
            if (typeof(aWhat['fields'] ) != 'undefined') {
                aChanges['fields'] = aWhat['fields'];
            }
//            if (aWhat["change_field_name"] != undefined) {
//                aChanges.changeFieldName = aWhat["change_field_name"];
//                aChanges.changeFieldValue = aWhat["change_field_value"];
//            }
//            console.log(aChanges);
            self._parent.layout.clearPeriod([], dMin, dMax);
            self._saveToServer(aSaveToServer, function(data){
                self._afterUpdate(mEvent, aWeeksToRefresh) ;
                if (typeof(fFunc) == 'function') {
                    fFunc(data);
                }
            }, aChanges);
            return true;
        } else {
            if (nCounter == 0 
                    && aWhat.disable != undefined 
                    && self._parent._nAjaxLoading > 0 
                    && aFilter != undefined 
                    && aFilter.parentId != undefined
            ) {
                self._oSwitchDisable[aFilter.parentId] = aWhat.disable;
            }
            self._afterUpdate(mEvent, aWeeksToRefresh);
            return false;
        }
    }
    
    self._afterUpdate = function(mEvent, aWeeksToRefresh) {
        self._refresh(mEvent);

        if (aWeeksToRefresh.length > 0) {
            aWeeksToRefresh = aWeeksToRefresh.unique();
        }
        for (var nI = 0; nI < aWeeksToRefresh.length; nI++) {
            self._setWeekBar(self._period.week[aWeeksToRefresh[nI]]);
        }
    }
    
    self._copyEvent = function(mEvent, aParams, fFunc) {
        if (mEvent == undefined || mEvent == null || mEvent.length < 1) {
            return;
        }
        aParams.requestType = 'copy';
        if (mEvent.length > 0) {
            var aCalendars = [];
            for (var nI = 0; nI < mEvent.length; nI++) {
                if (aCalendars.indexOf(mEvent[nI].calendar) < 0) {
                    aCalendars.push(mEvent[nI].calendar);
                }
            }
            self._parent._calendars.resetCalendar(aCalendars);
            self._saveToServer(mEvent, function(data){
                if (data.result != undefined && data.result.length > 0) {
                    self._refresh(
                        data.result, 
                        {min : Date.baseDate(data.min), max : Date.baseDate(data.max)}
                    );
                }
                if (typeof(fFunc) == 'function') {
                    fFunc(data);
                }
            }, aParams);
        }
    }
    
    self._removeEventCache = function(aEvent) {
        if (self._eventCache[aEvent.id] == undefined) {
            return;
        }
        var nIndex = self._eventCache[aEvent.id].indexOf(aEvent);
        if (nIndex >= 0) {
            self._eventCache[aEvent.id].splice(nIndex, 1)
        }
        if (self._eventCache[aEvent.id].length == 0) {
            self._eventCache[aEvent.id] = undefined;
        }
    }
    
    self._emptyEvent = function(mEventId, bExact) {
        var aEvt, nI, nJ, nIndex, aWeeks = [], sEventId, oWeek, mEvent, nPos;
        bExact = bExact || false;
        if (typeof(mEventId) == 'string') {
            mEventId = [mEventId];
        }
        
        for (var nEvent = 0; nEvent < mEventId.length; nEvent++) {
            mEvent = mEventId[nEvent];
            sEventId = typeof(mEvent) == 'object' ? mEvent.id : mEvent;
            if (bExact) {
                aEvt = [mEvent];
                self._removeEventCache(mEvent);
                nIndex = self._data.indexOf(mEvent);
                if (nIndex >= 0) {
                    self._data.splice(nIndex, 1);
                }
            } else {
                aEvt = self._getEvent(sEventId)
                if (aEvt == undefined || aEvt.length == 0) {
                    continue;
                }
                self._eventCache[sEventId] = undefined;
            }
            if (aEvt[0].week != undefined) {
                for (nI = 0; nI < aEvt[0].week.length; nI++) {
                    oWeek = self._period.week[aEvt[0].week[nI]];
                    if (oWeek.events.indexOf(aEvt[0]) == -1) {
                        continue;
                    }
                    if (aWeeks.indexOf(aEvt[0].week[nI]) < 0) {
                        aWeeks.push(aEvt[0].week[nI]);
                    }
                    for (nJ = 0; nJ < aEvt.length; nJ++) {
                        nIndex = oWeek.events.indexOf(aEvt[nJ]);
                        if (nIndex >= 0) {
                            oWeek.events.splice(nIndex, 1);
                        }
                    }
                }
            }
            
        }
        if (!bExact) {
            for (nI = 0; nI < self._data.length; nI++) {
                if (mEventId.indexOf(self._data[nI].id) >= 0) {
    //                console.log('slice ' + self._data[nI].id);
                    self._data.splice(nI, 1);
                    nI--;
                }
            }
        }
        for (nI = 0; nI < aWeeks.length; nI++) {
            oWeek = self._period.week[aWeeks[nI]];
            self._setWeekBar(oWeek);
        }
    }
    
    self._delEvent = function(mEventId) {
        if (typeof(mEventId) == 'string') {
            mEventId = [mEventId];
        }
        if (mEventId.length < 1) {
            self._parent.showNotify(self._parent.getText('model_no_event_selected_delete', 'No event selected for deleting'));
        }
        self._emptyEvent(mEventId);
        
        var aToDelete = {};
        for (var nEvent = 0; nEvent < mEventId.length; nEvent++) {
            aToDelete[nEvent] = mEventId[nEvent];
        }

        self._deleteOnServer(aToDelete);
    }
    
    self._checkEventFilter = function(el, aFilter) {
        if (jQuery.isFunction(aFilter)) {
            return aFilter(el);
        } else if (jQuery.isPlainObject(aFilter)){
            var bReturn = true;
            jQuery.each(aFilter, function(key, val) {
                if (el[key] != val) {
                    bReturn = false;
                    return false;
                }
            });
            return bReturn;
        }
        return true;
    }
    
    self._getEvent = function(sEventId, aFilter) {
        if (aFilter == undefined) {
            return self._eventCache[sEventId];
        } 
        if (self._eventCache[sEventId] == undefined) {
            return undefined;
        }
        var sCalendar = '',
            aTmp = [], 
            aLF = [], 
            aRF = [],
            nI, oCal;
        if (typeof(aFilter['similar_calendar']) != 'undefined') {
            var aSimilar = typeof(aFilter['similar_calendar']) == 'string' ? [aFilter['similar_calendar']] : aFilter['similar_calendar'];
            for (nI = 0; nI < aSimilar.length; nI++) {
                oCal = self._parent._calendars.getCalendar(aSimilar[nI]);
                if (aLF.indexOf(oCal.startFieldName) < 0) {
                    aLF.push(oCal.startFieldName);
                };
                if (aRF.indexOf(oCal.endFieldName) < 0) {
                    aRF.push(oCal.endFieldName);
                }
            }
        }
        
        for (nI = 0; nI < self._eventCache[sEventId].length; nI++) {
            var el = self._eventCache[sEventId][nI];
            
            
            if (typeof(aFilter.calendar) != 'undefined') {
                if (jQuery.isArray(aFilter.calendar) && aFilter.calendar.indexOf(self._eventCache[sEventId][nI].calendarId) < 0) {
                    continue;
                } else if (aFilter.calendar != self._eventCache[sEventId][nI].calendarid) {
                    continue;
                }
            }
            if (typeof(aFilter.parent) != 'undefined') {
                if (jQuery.isArray(aFilter.parent) && aFilter.parent.indexOf(self._eventCache[sEventId][nI].parentId) < 0) {
                    continue;
                } else if (aFilter.parent != self._eventCache[sEventId][nI].parentId) {
                    continue;
                }
            }
            if (typeof(aFilter['similar_calendar']) != 'undefined') {
                oCal = self._parent._calendars.getCalendar(el.calendarid);
                el.changeLeft = aLF.indexOf(oCal.startFieldName) >= 0;
                el.changeRight = aRF.indexOf(oCal.endFieldName) >= 0;
            }
            if (el.calendarid == sCalendar) {
                continue;
            }
            sCalendar = el.calendarid;
            aTmp.push(el);
        }
        return aTmp;
    }
    
    self._prepareData = function(data) {
        var el, i, oOldEl, nLength, bNeedToReorder = false,
            sOldCal, oCal;
        for (i = 0, nLength = data.length; i < nLength; i++) {
            if (data[i].event_id != undefined) {
                data[i].id = data[i].event_id;
            }
            if (data[i].className != data[i].calendarid) {
                data[i].specColor = data[i].specColor != undefined && data[i].specColor.indexOf('_spec_reccuring') >= 0 ? '_spec_reccuring' : "";
            }
            if ((oOldEl = self._checkEventPresent(data[i])) !== false) {
                if (data[i].title == oOldEl.title 
                    && data[i].start == oOldEl.start
                    && data[i].end == oOldEl.end
                    && data[i].group == oOldEl.group
                    && data[i].specColor == oOldEl.specColor
                ) {
                    data[i] = oOldEl;
                    continue;
                } else {
                    el = oOldEl;
                    el.title = data[i].title;
                    el.start = data[i].start;
                    el.end = data[i].end;
                    el.group = data[i].group;
                    el.specColor = data[i].specColor;
                    data[i] = el;
                }
            } else {
                
//                el = data[i];
                el = new cEventModel(data[i]);
                data[i] = el;
//                console.log(el.id);
                self._data.push(el);
                if (typeof(self._eventCache[el.id]) == 'undefined') {
                    self._eventCache[el.id] = [el];
                } else {
                    self._eventCache[el.id].push(el);
                }
            }
            if (self._checkSearch(el)) {
                el.nonsearched = true;
            }
            self._checkDisable(el);
//            if (self._checkDisabled(el)) {
//                el.disable = true;
//            }
//            if (
//                (self._aSearchCalendars.length == 0 || self._aSearchCalendars.indexOf(el.calendarid) >= 0)
//                && (self._sSearchFields == 'agenda' || el.title.toLowerCase().indexOf(self._sText) < 0 )
//                && (self._sSearchFields == 'title' || (el.addTitle == undefined || el.addTitle.toLowerCase().indexOf(self._sText) < 0))
//            ) {
//                el.nonsearched = true;
//            }
        

            
            oCal = sOldCal === el.calendarid ? oCal : self._parent._calendars.getCalendar(el.calendarid);
            sOldCal = el.calendarid;
            bNeedToReorder = true;
            el.dateStart = Date.preParse(el.start);
            if (self._parent.aCalculated.timeZoneMinutes !== '' && self._parent.aCalculated.timeZoneMinutes != '-') {
                el.dateStart.changeTimeZone(parseInt(self._parent.aCalculated.timeZoneMinutes), false, self._parent.options.format['tz']);
            }
            el.dayStart = Date.baseDate(el.dateStart).resetHours();
//            el.dayStart.setHours(0, 0, 0, 0);
            
            el.dateEnd = el.end != null && el.end != '' 
                ? Date.preParse(el.end) 
                : new Date(el.dateStart);
            if (self._parent.aCalculated.timeZoneMinutes !== '' && self._parent.aCalculated.timeZoneMinutes != '-') {
                el.dateEnd.changeTimeZone(parseInt(self._parent.aCalculated.timeZoneMinutes), false, self._parent.options.format['tz']);
            }
            el.noEnd =  el.end == null || el.end == '' ; //|| oCal.et == undefined || oCal.et == ''
            
            el.dayEnd = Date.baseDate(el.dateEnd).resetHours();;
//            el.dayEnd.setHours(0, 0, 0, 0);
            if (oCal != undefined) {
                el.noLS = el.allDay !== true && (oCal.st == 'DATE' || oCal.et == '');
                el.noRS = el.allDay !== true && (oCal.et == 'DATE' || oCal.et == '') ;

                el.lFixed = el.allDay !== true && oCal.st == 'DATE';
                el.rFixed = el.allDay !== true && oCal.et == 'DATE';
            
                if ((el.allDay !== true || (oCal.et == 'DATETIME' && oCal.objectName != 'event'))
                    && self._parent.params.endDay == 0 
                    && el.dayEnd > el.dayStart 
                    && el.dateEnd.getTime() == el.dayEnd.getTime()
                ) {
                    el.dayEnd.changeDate(-1);
                }
            }
        }
        if (bNeedToReorder) {
            self._data.quickSort(function(a, b){
                return self._sortEvents(a, b);
            });        
        }
        if (self._oUncheckDisable.length > 0) {
            for (var nD = 0; nD < self._oUncheckDisable.length; nD++) {
                delete self._oSwitchDisable[self._oUncheckDisable[nD]];
            }
            self._oUncheckDisable.length = 0;
        }
    }
    
    
    self._checkEventPresent = function(aEvent) {
        if (typeof(self._eventCache[aEvent.id]) == 'undefined') {
            return false;
        } 
        for (var i = 0, nLength = self._eventCache[aEvent.id].length; i < nLength; i++) {
            if (self._eventCache[aEvent.id][i].parentId == aEvent.parentId 
                && self._eventCache[aEvent.id][i].calendarid == aEvent.calendarid) {
                return self._eventCache[aEvent.id][i];
            }
        }
        return false;
    }
    
    self._postPrepareData = function(data) {
        var el, i;
        for (i = 0; i < data.length; i++) {
            el = data[i];
            if (el.disable === true || el.nonsearched === true) {
                continue;
            }
            if (el.dayStart > self._period.maxCalendar || el.dayEnd < self._period.minCalendar) {
                continue;
            }
            self._setEventWeeks(el);
        }
    }
    
    self._parseStringValues = function(aData){
        for (var nI = 0; nI < aData.length; nI++) {
            if (aData[nI].allDay === 'false') {
                aData[nI].allDay = false;
            } else if (aData[nI].allDay === 'true') {
                aData[nI].allDay = true;
            }
        }
    }
    
    self._initWeek = function(tWeek) {
        if (typeof(self._period.week[tWeek]) != 'undefined') {
            return;
        }
        var dWeekStart = new Date(tWeek * 1000);
        var dWeekEnd = new Date(dWeekStart);

        self._period.week[tWeek] = {
                "startDate" : dWeekStart, 
                "endDate" : dWeekEnd.changeDate(6),
                "daysData" : [],
                "events" : [],
                "bar" : []
            };        
        return self._period.week[tWeek];
    }
    
    self._setEventWeeks = function(el) {
        var tWeek, nI, nFound;
        if (el.week != undefined && el.week.length > 0) {
            for (nI = 0 ; nI < el.week.length; nI++) {
                tWeek = el.week[nI];
                nFound = self._period.week[tWeek].events.indexOf(el);
                if (nFound >= 0) {
                    self._period.week[tWeek].events.splice(nFound, 1);
                }
            }
        }
        el.week = [];

        var dWeekStart = self._dMin != undefined 
            ? Date.getMaxDate(el.dayStart, self._dMin) 
            : Date.baseDate(el.dayStart);
            //dWeekStart = new Date(el.dayStart);
        dWeekStart.resetFirstWeekDay(self._parent.params.startWeekDay)
        
        var dWeekEnd = self._dMax != undefined 
            ? Date.getMinDate(el.dayEnd, self._dMax) 
            : Date.baseDate(el.dayEnd),  
            //dWeekEnd = new Date(el.dayEnd),  
            oWeek;
        for (var dCur = new Date(dWeekStart); dCur <= dWeekEnd ; dCur.changeDate(7)){
            var a = [];
            tWeek = dCur.getTime() / 1000;
            if (typeof(oWeek = self._period.week[tWeek]) == 'undefined') {
                oWeek = self._initWeek(tWeek);
            } 
            nFound = oWeek.events.indexOf(el);
            if (el.week.indexOf(tWeek) == -1) {
                el.week.push(tWeek);
            }
            if (nFound == -1) {
                oWeek.events[oWeek.events.length] = el;
            }
        }
    }
    
    self._sortEvents = function(a, b) {
        var tFirst = a.dateStart.valueOf(),
            tSecond = b.dateStart.valueOf();
        if (tFirst < tSecond) {
            return -1;
        } else if (tFirst > tSecond) {
            return 1;
        } else if (tFirst == tSecond) {
            var nCalendarCompare = self._parent._calendars.compare(a.calendarid, b.calendarid);
            return nCalendarCompare == 0 
                ? (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1)
                : nCalendarCompare;
        }
        return 0;        
    }
    
    self._sortEventsDaily = function(a, b) {
        var nCalendarCompare = self._parent._calendars.compare(a.calendarid, b.calendarid);
        if (nCalendarCompare == 0) {
            var result = a.title < b.title ? -1 : (a.title > b.title ? 1 : 0);
            return result;
        } else {
            return nCalendarCompare;
        }
    }
    
    
    
    self._calculateMonthData = function(data) {
        
        var tCurWeek, oWeekDates = self._foundWeekDays(data);
        if (oWeekDates == false) {
            return;
        }
        oWeekDates.min.resetFirstWeekDay(self._parent.params.startWeekDay);
        var dCur = new Date(oWeekDates.min);
        if (oWeekDates.max.getTime() == oWeekDates.min.getTime()) {
            oWeekDates.max.changeDate(1);
        }
        for (; dCur <= oWeekDates.max; dCur.changeDate(7)) {
            tCurWeek = dCur.getTime() / 1000;
            var oWeek = self._period.week[tCurWeek];
            if (oWeek == undefined) {
               oWeek = self._initWeek(tCurWeek);
            }
            self._setWeekBar(oWeek);
            
            
        }
    }
    
    self._setWeekBar  = function(oWeek) {
        var nLine, nEvent, el, dStart, dEnd, dStartDay;
        oWeek.daysData = [];
        oWeek.bar = [];

        oWeek.events.quickSort(function(a, b){
            return self._sortEvents(a, b);
        });

        for (nEvent = 0; nEvent < oWeek.events.length; nEvent++) {
            el = oWeek.events[nEvent];
            if (el.disable === true || el.nonsearched === true) {
                continue;
            }

            dStart = Date.getMaxDate(el.dayStart, oWeek.startDate);
            dEnd = Date.getMinDate(el.dayEnd, oWeek.endDate);

            dStartDay = dStart.getDay();
            if (typeof(oWeek.daysData[dStartDay]) == 'undefined') {
                oWeek.daysData[dStartDay] = [];
            }
            for (nLine = 0; nLine < oWeek.daysData[dStartDay].length; nLine++) {
                if (typeof(oWeek.daysData[dStartDay][nLine]) == 'undefined') {
                    break;
                }
            }
            var dTmpCur = new Date(dStart),
                nDay = dTmpCur.getDaysFrom(oWeek.startDate),
                nDayMax = dEnd.getDaysFrom(oWeek.startDate);
            
            for (var dTmpCur = new Date(dStart); dTmpCur <= dEnd; dTmpCur.changeDate(1)) {
                if (typeof(oWeek.daysData[dTmpCur.getDay()]) == 'undefined') {
                    oWeek.daysData[dTmpCur.getDay()] = [];
                }

                oWeek.daysData[dTmpCur.getDay()][nLine] = el;
            }
            if (typeof (oWeek.bar[nLine]) == 'undefined') {
                oWeek.bar[nLine] = [];
            }
            oWeek.bar[nLine].push(
                {
                    "event" : el,
                    "start" : dStart,
                    "end"   : dEnd,
                    "days"  : dEnd.getDaysFrom(dStart, false),
                    "full_l" : el.dayStart < dStart,
                    "full_r" : el.dayEnd > dEnd,
                    "cellStart"  : nDay,
                    "cellLength" : nDayMax - nDay,
                    "cellEnd"    : nDayMax,
                    "line"       : nLine
                }
            );

        }    
        return oWeek;
    }
    
    self._foundWeekDays = function(data) {
        if (data.length < 1) {
            return false;
        }
        var dMin = new Date(data[0].dayStart);
        var dMax = new Date(data[0].dayEnd);
        for (var i = 0; i < data.length; i++) {
            var el = data[i];
            dMin.getMinDate(el.dayStart);
            dMax.getMaxDate(el.dayEnd);
        }
        return {
            min : dMin,
            max : dMax
        };
    }
    
    self._initDataWeeks = function(data, dateParams){
        var dParamStart, dParamEnd;
        if (dateParams != undefined && data != undefined && dateParams.end != undefined) {
            dParamStart = Date.preParse(dateParams.start);
            dParamEnd = Date.preParse(dateParams.end);
            dParamStart.resetHours();
            dParamEnd.resetHours();
            
        }
        
        dateParams = dateParams.min != undefined ?  dateParams : {
            min : self._parent.options.min
        };
        if (data != undefined && data.length > 0 && dParamStart == undefined) {
            var dMin, dMax, el;
            for (var nI = 0; nI < data.length ; nI++){
                el = data[nI];
                if (el.dayStart == undefined) {
                    continue;
                }
                if (dMin == undefined) {
                    dMin = new Date(el.dayStart);
                    dMax = new Date(el.dayEnd);
                }
                if (dMin < el.dayStart) { 
                    dMin.setTime(el.dayStart.getTime());
                }
                if (dMax > el.dayEnd) { 
                    dMax.setTime(el.dayEnd.getTime());
                }
            }
            self._period.minCalendar = dMin;
        } 
        if (dMin != undefined) {
        } else if (dParamStart == undefined){
            self._period.minCalendar = new Date(dateParams.min);
        } else {
            self._period.minCalendar = dParamStart;
        }
        self._period.minCalendar.resetFirstWeekDay(self._parent.params.startWeekDay);
        
        self._period.maxCalendar = new Date(self._period.minCalendar);
        if (dateParams.max == undefined) {
            if (dParamEnd != undefined) {
                self._period.maxCalendar = dParamEnd.changeDate(7);
            } else if (dMax != undefined) {
                self._period.maxCalendar = dMax.changeDate(7);
            } else {
                self._period.maxCalendar.changeDate(7 * 6);
            }
        } else {
            self._period.maxCalendar.setTime(dateParams.max.getTime());
        }
        var dStart = new Date(self._period.minCalendar), 
            dEnd   =  new Date(self._period.maxCalendar), 
            dCur;
        if (dStart > dEnd) {
            Date.swap(dStart, dEnd);
        }
        if (!isNaN(dStart) && !isNaN(dEnd)) {
            self._dMin = dStart;
            self._dMax = dEnd;
            for (dCur = new Date(dStart); dCur < dEnd; dCur.changeDate(7)) {
                self._initWeek(dCur.getTime() / 1000);
            }
        }
    }
    
    
    self._getEvents = function(params, aIncomeData) {
        params = params || {};
        var aCalendars = params.calendars != undefined 
            ? [].concat(params.calendars.calendar, params.calendars.group, params.calendars.web)
            : null,
            nI,
            aReturn = [],
            compareDateMax = params.max != undefined ? new Date(params.max) : new Date(),
            aWalkData = aIncomeData == undefined ? self._data : aIncomeData;
        compareDateMax.setHours(23, 59, 59, 0);
        
        for (var i = 0; i < aWalkData.length; i++ ) {
            var evt = aWalkData[i];
            if (aCalendars != null && aCalendars.indexOf(evt.parentId) < 0) { //aCalendars.length
                continue;
            }
            
            if (
                params.min != undefined 
                && params.max != undefined 
                && (evt.dayStart > compareDateMax || evt.dayEnd < params.min)
            ) {
                continue;
            }
            if ((params.disable === undefined) && evt.disable === true) {
                continue;
            }
            if (evt.nonsearched === true) {
                continue;
            }
            if (typeof(params.allDay) != 'undefined' && evt.allDay !== params.allDay) {
                continue;
            }
            if (typeof(params.filter) != 'undefined' && !self._checkEventFilter(evt, params.filter))  {
                continue;
            }
            
            aReturn.push(evt);
        }
        aReturn.quickSort(function(a, b){
            return self._sortEvents(a, b);
        });
//        console.log('getEvents result ', aReturn.length, ' params ', params);
        return aReturn;
    }
    
    self._getData = function(params, func) {
        var aActive = params.calendars,
            aQueue = [],
            aFilters = {}, aRules = {}, oCalendar;
        params.min = Date.baseDate(params.min || self._parent.options.min);
        params.max = Date.baseDate(params.max || self._parent.options.max);
        var aCheckResult = self._parent._calendars.checkDataPresent(
            aActive,
            params.min,
            params.max,
            params.grouping
        );

        if (aCheckResult === true || params.disable === true){
            self._refresh();
            if (typeof(func) == 'function') {
                func(self._getEvents(params));
            }
            return;
        } else if (aCheckResult === false) {
            aCheckResult = aActive;
        }
        if (aCheckResult.group.length > 0) {
            self._parent._calendars.checkPresentGroupCalendars(aCheckResult.group);
        }
        if (aCheckResult.calendar.length > 0 || aCheckResult.group.length > 0) {
            var requestParams = {},
                aAll = [].concat(aCheckResult.calendar, aCheckResult.group),
                aFilterCalendar = [].concat(aCheckResult.calendar);
            requestParams['toload_calendars'] = aCheckResult.calendar;
            requestParams['toload_groups'] = aCheckResult.group;
            if (aCheckResult.group.length > 0) {
                for (var nJ = 0; nJ < aCheckResult.group.length; nJ++) {
                    aFilterCalendar = aFilterCalendar.concat(self._parent._calendars.getCalendar(aCheckResult.group[nJ]).calendarsList);
                }
                aFilterCalendar = aFilterCalendar.unique();
            }
            for (var nI = 0; nI < aFilterCalendar.length; nI++) {
                oCalendar = self._parent._calendars.getCalendar(aFilterCalendar[nI]);
                if (oCalendar == undefined || oCalendar == null) {
                    continue;
                }
                
                if (oCalendar['filters'] != undefined && oCalendar['filters'].length > 0) {
                    aFilters[aFilterCalendar[nI]] = {};
                    for (var nJ = 0; nJ < oCalendar['filters'].length; nJ++) {
                        var mValue = jQuery.isArray(oCalendar['filters'][nJ].value) ? JSON.stringify(oCalendar['filters'][nJ].value) : oCalendar['filters'][nJ].value;
                        aFilters[aFilterCalendar[nI]][nJ] = 
                            oCalendar['filters'][nJ].name + '|' 
                                + oCalendar['filters'][nJ].oper + '|' 
                                + mValue;
                    }
                    if (oCalendar['rule'] != undefined && oCalendar['rule'] != '') {
                        aRules[aFilterCalendar[nI]] = oCalendar['rule'];
                    }
                }
                
                if (self._aFilterPanel != null && self._aFilterPanel.length > 0) {
                    var nMaxFilter = oCalendar['filters'] != undefined 
                        ? oCalendar['filters'].length
                        : 0,
                        sFilterPanelRule = '';
                    if (aFilters[aFilterCalendar[nI]] == undefined) {
                        aFilters[aFilterCalendar[nI]] = {};
                    }
                    for (var nF = 0; nF < self._aFilterPanel.length; nF++) {
                        if (oCalendar.objectName != self._aFilterPanel[nF].object && self._aFilterPanel[nF].object != 'common') {
                            continue;
                        }
                        var mValue = jQuery.isArray(self._aFilterPanel[nF].value) ? JSON.stringify(self._aFilterPanel[nF].value) : self._aFilterPanel[nF].value;
                        aFilters[aFilterCalendar[nI]][nMaxFilter] = 
                            self._aFilterPanel[nF].name + '|' 
                                + self._aFilterPanel[nF].oper + '|' 
                                + mValue;
                        sFilterPanelRule += (sFilterPanelRule != '' ? ' AND ' : '') + nMaxFilter;
                        nMaxFilter++;
                    }
                    if (sFilterPanelRule != '' 
                        && aRules[aFilterCalendar[nI]]  != undefined 
                        && aRules[aFilterCalendar[nI]] != ''
                    ) {
                        aRules[aFilterCalendar[nI]] = '(' + aRules[aFilterCalendar[nI]]  + ') AND (' + sFilterPanelRule + ')';
                    }
                }
            }
            if (params.filters != undefined) {
                jQuery.each(params.filters, function(sIdx, aFilter){
                    var nMax;
                    if (aFilters[sIdx] == undefined) {
                        aFilters[sIdx] = {};
                        nMax = 0;
                    } else {
                        nMax = 1 + parseInt(Math.max(Array.objectKeys(aFilters[sIdx])));
                    }
                    aFilter = jQuery.isArray(aFilter) ? aFilter : [aFilter];
                    var sRule = '';
                    for (var nJ = 0; nJ < aFilter.length; nJ++) {
                        aFilters[sIdx][nMax] = aFilter[nJ].name + '|' + aFilter[nJ].oper + '|' + aFilter[nJ].value;
                        sRule += (sRule != '' ? ' AND ' : '') + nMax;
                        nMax++;
                    }
                    
                    if (aRules[sIdx] != undefined && aRules[sIdx] != '') {
                        aRules[sIdx] = ' (' + aRules[sIdx] + ') ' + sRule;
                    }
                });
            }

            requestParams['filters'] = aFilters;
            requestParams['rules'] = aRules;
            
            requestParams.start = params.min.format('yyyy-MM-ddT00:00:00');
            requestParams.end = params.max.format('yyyy-MM-ddT23:59:59');
            if (typeof(params.grouping) != 'undefined') {
                requestParams.grouping = params.grouping;
            }
            if (typeof(self._parent.options._additionalFilterUrl) != 'undefined' 
                    && !jQuery.isEmptyObject(self._parent.options._additionalFilterUrl)
            ) {
                var aAdditionalParams = jQuery.extend({}, self._parent.options._additionalFilterUrl);
                if (aAdditionalParams.filterApplyTo != undefined) {
                    var aFilterCid = aAdditionalParams.filterApplyTo.split(',');
                    if (aFilterCid.intersect(aCheckResult.calendar).length == 0){
                        aAdditionalParams = {};
                    }
                }
                jQuery.extend(requestParams, aAdditionalParams);
            }
            aQueue.unshift(
                function(){
                    self._parent._calendars.loadDynamicOptions(aAll, 
                        {start : requestParams.start, end : requestParams.end},
                        function(aResult){
                        requestParams['dynamic'] = aResult;
                    });
                }
            );
            var nMaxRequest = self._parent.options.lighthning != null ? 1 : self._parent.params.parallelRequests;
            if (nMaxRequest - self._parent._nAjaxLoading < 2) {
                aQueue.unshift(function(){
                    self._getStepByStepSFData(aAll, params, requestParams);
                });
            } else {
                aQueue.unshift(function(){
                    self._getMultiSFData(aAll, params, requestParams, func);
                });
            }
        }
        if (aCheckResult.web.length > 0) {
            aQueue.unshift(function(){
                self._parent._initScripts('/plugin/moment.min.js', 
                    {checkContinue : function(){return typeof(moment) != 'undefined'}}
                );
            });
            aQueue.unshift(function(){
                self._parent._initScripts('/plugin/moment-timezone-with-data.js');
            });
            aQueue.unshift(function(){
                self._parent._initScripts('/plugin/rrule.ical.js');
            });
            
            for (var nI = 0; nI < aCheckResult.web.length; nI++) {
                (function(){
                    var sCalendarId = aActive.web[nI];
                    aQueue.unshift(function(){
                        if (!self._checkCurrentLoading(params.counter)) {
                            return;
                        }
                        var dEnd = Date.baseDate(params.max),
                            dStart = Date.baseDate(params.min),
                            aUrlData = self._getWebCalendarUrl(sCalendarId, dStart, dEnd);
                        self._parent._calendars.resetCalendar(sCalendarId);    
                        if (aUrlData['type'] === 'ical') {
                            self._parent._request(
                            {
                                "jsRemote"      : true,
                                "data"          : {"url" : aUrlData['url']},
                                "requestType"   : 'cors'
                            }, function(data){
                                if (data.data == undefined) {
                                    if (data.status == 'error' && data.message != undefined) {
                                        var sMessage = data.message;
                                        if (sMessage.indexOf('endpoint') >=  0) {
                                            var nPos = aUrlData['url'].indexOf('/', 10),
                                                sDomain = nPos > 0 ? aUrlData['url'].substring(0, nPos) : aUrlData['url'];
                                            sMessage = 'Please set Endpoint ' + sDomain;
                                        }
                                        
                                        self._parent.showNotify(sMessage, true);
                                    }
                                    
                                    return;
                                }
                                self._parent._calendars.setPeriod(
                                    [sCalendarId], 
                                    dStart, 
                                    dEnd, 
                                    {noCacheCheck : true, dTimeTo : Date.baseDate(new Date(), 0, 0.05)}
                                );
                                var dData = self._parseICAL(sCalendarId, data.data, dStart, dEnd);
                                console.log(dData.length);
                                self._refresh(dData, requestParams);
                            });
                        } else {
                            self._parent._request(
                                {
                                    "crossDomain" : aUrlData['type'] === 'ical' ,
                                    "url"       : aUrlData['url'],
                                    "type"      : aUrlData['type'] == 'xml' ? "jsonp" : 'html'
                                }, function(data) {
                                    if (data.feed != undefined && data.feed.entry != undefined) {
                                        self._parent._calendars.setPeriod(
                                            [sCalendarId], 
                                            dStart, 
                                            dEnd, 
                                            {noCacheCheck : true, dTimeTo : Date.baseDate(new Date(), 0, 0.05)}
                                        );
                                        self._refresh(self._parseWebCalendar(sCalendarId, data.feed.entry), requestParams);
                                    } else if (data.items != undefined){
                                        self._parent._calendars.setPeriod(
                                            [sCalendarId], 
                                            dStart, 
                                            dEnd, 
                                            {noCacheCheck : true, dTimeTo : Date.baseDate(new Date(), 0, 0.05)}
                                        );
                                        self._refresh(self._parseWebV3Calendar(sCalendarId, data.items), requestParams);
                                    } else {
                                        var oXML = jQuery.parseXML(data);
                                    }
                                }
                            );
                        }
                    });
                })();
                
            }
        }
        aQueue.unshift(function(){
            if (!self._checkCurrentLoading(params.counter)) {
                return;
            }
            
            self._refresh();
            if (typeof(func) == 'function') {
                func(self._getEvents(params));
            }
        });
        self._parent._prependQueue(aQueue);

    }
    
    self._getStepByStepSFData = function(aCalendars, aParams, aRequestParams) {
        if (!self._checkCurrentLoading(aParams.counter)) {
            return;
        }
//        console.log('all calendars ' + aCalendars + ' / ' + aRequestParams['toload_calendars'] + ' / ' + aRequestParams['toload_groups']);
        aParams.nTmp = aParams.nTmp == undefined ? 0 : aParams.nTmp;
        aRequestParams[self._parent._getRequestName('calendar')] = aRequestParams['toload_calendars'].join(',');
        aRequestParams[self._parent._getRequestName('group')] = aRequestParams['toload_groups'].join(',');
        self._parent._request(
            {
                "jsRemote"      : true,
                "data"          : aRequestParams,
                "requestType"   : self._parent._getRequestEvent('events')
            }, function(data) {
                var aResult = data.result !== undefined ? data.result : data,
                    aLoadedCalendars = (data.loaded != undefined 
                        ? (typeof(data.loaded) == 'string' ? data.loaded.split(',') : Array.objectValues(data.loaded))
                        : aCalendars),
                    aUnloadedCalendars = aLoadedCalendars != undefined ? aCalendars.diff(aLoadedCalendars) : null;
                if (aUnloadedCalendars != null && aUnloadedCalendars.length > 0) {
                    self._parent._prependQueue(function(){
                        aRequestParams['toload_calendars'] = aRequestParams['toload_calendars'].diff(aLoadedCalendars);
                        aRequestParams['toload_groups'] = aRequestParams['toload_groups'].diff(aLoadedCalendars);
                        if (aParams.nTmp++ < 5) {
                            self._getStepByStepSFData(aUnloadedCalendars, aParams, aRequestParams);
                        }
                    });
                }
                self._parent._calendars.setPeriod(aLoadedCalendars, aParams.min, aParams.max);
                self._refresh(aResult, aRequestParams);
            }
        );
    }
    
    self._getMultiSFData = function(aCalendars, aParams, aRequestParams, fFunc) {
        if (!self._checkCurrentLoading(aParams.counter)) {
            return;
        }
        
        
        var nMaxRequest = self._parent.options.lighthning != null ? 1 : self._parent.params.parallelRequests,
            nMax = nMaxRequest - self._parent._nAjaxLoading,
            nSplited = Math.max(aRequestParams['toload_calendars'].length, aRequestParams['toload_groups'].length),
            nBlock = Math.max(1, Math.ceil(nSplited / nMax)),
            bProcessing = false,
            aPreData = [];
        for (var nLoad = 0; nLoad < nMax; nLoad++) {
            var aBlockParams = jQuery.extend({}, aRequestParams),
                aBlockCid = [],
                aBlocGid = [];
            for (var nJ = 0; nJ < nBlock; nJ++) {
                var nIdx = nLoad * nBlock + nJ;
//                console.log(nBlock, nLoad, nJ, nIdx);
                if (aRequestParams['toload_calendars'][nIdx] != undefined) {
                    aBlockCid.push(aRequestParams['toload_calendars'][nIdx]);
                }
                if (aRequestParams['toload_groups'][nIdx] != undefined) {
                    aBlocGid.push(aRequestParams['toload_groups'][nIdx]);
                }
            }
            if (aBlocGid.length == 0 && aBlockCid == 0) {
                break;
            }
            aBlockParams['cid'] = aBlockCid.join(',');
            aBlockParams['cgid'] = aBlocGid.join(',');
            
            aBlockParams.nTmp = aBlockParams.nTmp == undefined ? 0 : aBlockParams.nTmp;
            self._parent._request(
                {
                    "jsRemote"      : true,
                    "data"          : aBlockParams,
                    "requestType"   : self._parent._getRequestEvent('events')
                }, function(data) {
                    var aResult = data.result !== undefined ? data.result : data,
                        aLoadedCalendars = (data.loaded != undefined 
                            ? (typeof(data.loaded) == 'string' ? data.loaded.split(',') : Array.objectValues(data.loaded))
                            : aCalendars),
                        aUnloadedCalendars = aLoadedCalendars != undefined ? aCalendars.diff(aLoadedCalendars) : null;
                    if (aUnloadedCalendars != null && aUnloadedCalendars.length > 0) {
                        self._parent._prependQueue(function(){
                            aRequestParams['toload_calendars'] = aRequestParams['toload_calendars'].diff(aLoadedCalendars);
                            aRequestParams['toload_groups'] = aRequestParams['toload_groups'].diff(aLoadedCalendars);
                            if (aParams.nTmp++ < 5) {
                                self._getStepByStepSFData(aUnloadedCalendars, aParams, aRequestParams);
                            }
                        });
                    }
                    aPreData = aPreData.concat(aResult);
                    if (bProcessing) {
                    } else {
                        bProcessing = true;
                        self._parent._calendars.setPeriod(aLoadedCalendars, aParams.min, aParams.max);
                        self._refresh(aPreData, aRequestParams);
                        if (fFunc != undefined) {
                            if (self._sText != '') {
                                aPreData = aPreData.filter(function(oEl){
                                    return !self._checkSearch(oEl);
                                });
                            }
                            fFunc(self._getEvents(aParams), {currentData : self._getEvents(aParams, aPreData)});
                        }
                        aPreData.length = 0;
                        bProcessing = false;
                    }
                }
            );
        }
    }
    
    self._checkCurrentLoading = function(nNum) {
//        console.log('xxx ' + nNum + ' / ' + self._nCurLoading);
        if (nNum < 0 || self._parent.params.cacheTime > 0) {
            return true;
        }
        
        if (nNum < self._parent._nEventLoading - 1) {
            return false;
        }                
        return true;
    }
    
    self._getWebCalendarUrl = function(sCalendarId, dFrom, dTo) {
        
//        
        var aCalendar = self._parent._calendars.getCalendar(sCalendarId),
            sUrl = aCalendar.url,
            nPos = sUrl.indexOf('callback='),
            sProtocol = document.location.href.indexOf('http:') == 0 ? 'http:' : 'https:';
    
        if (sUrl.indexOf('.ics') >=0 ) {
            return {'type' : 'ical', 'url' : sUrl};
        }
        if (nPos > 0) {
            var nPosApp = sUrl.indexOf('&', nPos);
            if (nPosApp < 0) {
                sUrl = sUrl.substring(0, nPos);
            } else {
                sUrl = sUrl.substring(0, nPos) + sUrl.substring(nPosApp);
            }
        }
        
        
        
        var bV3Mode = false;
        if (sUrl.indexOf('/calendar/v3') >= 0) {
//https://content.googleapis.com/calendar/v3/calendars/en.german%23holiday%40group.v.calendar.google.com/events?key=AIzaSyBjG3RmRwUScczWjv9Jm1ehlv8RKGZlE1w    
            if (sUrl.substring(0, 3) != 'http') {
                sUrl = 'https://content.googleapis.com/calendar/v3/calendars/' + sUrl + '/events?key=AIzaSyBjG3RmRwUScczWjv9Jm1ehlv8RKGZlE1w';
            }
            bV3Mode = true;
        } else {
//https://www.google.com/calendar/feeds/usa__en@holiday.calendar.google.com/public/full?alt=json-in-script&max-results=2000&single-events=true&time-min=2014-09-28T21:00:00.000Z&time-max=2015-01-09T22:00:00.000Z&callback=jQuery18009753556643789217_1416324792641&_=1416324897129"
            sUrl = sUrl.replace('www.google.com/calendar/feeds/', '')
                .replace('https://', '').replace('http://', '');
//            console.log(sUrl);
            nPos = sUrl.indexOf('/public/');
            sUrl = sUrl.substring(0, nPos);
            sUrl = 'https://content.googleapis.com/calendar/v3/calendars/' + sUrl + '/events?key=AIzaSyBjG3RmRwUScczWjv9Jm1ehlv8RKGZlE1w';
//            console.log(sUrl);
        }
        if (true || bV3Mode) {
            sUrl += '&timeMin=' + dFrom.toISOString() + '&timeMax=' + dTo.toISOString() + '&singleEvents=true&maxResults=2000' ;
//            sUrl = sUrl.replace('http:', sProtocol).replace('https:', sProtocol);
            sUrl = sUrl.replace('http://', 'https://');
        }
//        console.log(sUrl);
        return {'type' : 'xml', 'url' : sUrl};;
    }
    
    self._parseWebCalendar = function(sCalendarId, data) {
        var aResult = [];
        var d = new Date(), bAllDay = false, dTmp,
            nTz = -d.getTimezoneOffset() / 60;
        for (var nI = 0; nI < data.length; nI++) {
            bAllDay = false;
            var oEvt = {}, oEl = data[nI];
            oEvt.title = oEl['title']['$t'];
            oEvt.className = sCalendarId;
            oEvt.parentId = sCalendarId;
            oEvt.calendarid = sCalendarId;
            oEvt.editable = false;
            oEvt.url = '';
            if (oEl['link'] != undefined ) {
                var aLinks = jQuery.isArray(oEl['link']) ? oEl['link'] : [oEl['link']];
                for (var nJ = 0; nJ < aLinks.length; nJ++) {
                    if (aLinks[nJ]['type'] != undefined 
                        && aLinks[nJ]['type'] == 'text/html' 
                        && aLinks[nJ]['href'] != undefined
                    ) {
                        oEvt.url = aLinks[nJ]['href'];
                        break;
                    }
                }
            }
            oEvt.id = oEl['id']['$t'];
            if (oEl['gd$when'] != undefined ) {
                oEvt.start = oEl['gd$when'][0]['startTime'];
                oEvt.end = oEl['gd$when'][0]['endTime'];
            } else if (oEl['gd$recurrence'] != undefined && oEl['gd$recurrence']['$t'] != undefined) {
                
                /*var aRecRules = oEl['gd$recurrence']['$t'].split("\n");
                var nMax = 0;
                for (var nStr = 0; nStr < aRecRules.length; nStr++) {
                    var nPos = aRecRules[nStr].indexOf('DTSTART;VALUE=');
                    if (nPos >= 0) {
                        oEvt.start = aRecRules[nStr].trim().substring(aRecRules[nStr].indexOf(':', nPos) + 1);
                        if (oEvt.start.length == 8) {
                            oEvt.start = oEvt.start.substr(0, 4) + '-' 
                                + oEvt.start.substr(4, 2) + '-' 
                                + oEvt.start.substr(6, 2);
                        }
                        nStr++;
                    }
                    console.log('1.' + nPos + ' / ' + oEvt.start);
                    nPos = aRecRules[nStr].indexOf('DTEND;VALUE=');
                    if (nPos >= 0) {
                        oEvt.end = aRecRules[nStr].trim().substring(aRecRules[nStr].indexOf(':', nPos) + 1);
                        if (oEvt.end.length == 8) {
                            oEvt.end = oEvt.end.substr(0, 4) + '-' 
                                + oEvt.end.substr(4, 2) + '-' 
                                + oEvt.end.substr(6, 2);
                        }
                        nStr++;
                    }
                    console.log('2.' + nPos + ' / ' + oEvt.end);
                    console.log(aRecRules.length);
                    nPos = aRecRules[nStr].indexOf('RRULE:');
                    if (nPos >= 0) {
                        if (oEvt.recur == undefined) {
                            oEvt.recur = [];
                        }
                        oEvt.recur.push(aRecRules[nStr].trim().substring(aRecRules[nStr].indexOf(':', nPos) + 1));
                        nStr++;
                    }
                    if (oEvt.start != undefined && oEvt.end != undefined) {
                        break;
                    }
                    if (nMax++ > 100) {
                        break;
                    }
                    console.log(nStr, aRecRules.length);
                }*/
            } else {
                continue;
            }
            if (oEvt.start == undefined || oEvt.end == undefined) {
                continue;
            }
            if (oEvt.start.match(/^[0-9]{2,4}.[0-9]{2}.[0-9]{2,4}$/) != null) {
                oEvt.start += ' 00:00:00'; 
//                oEvt.start += 'T00:00:00' 
//                    + (nTz > 0 ? '+' : '-') 
//                    + (Math.abs(nTz) > 9 ? Math.abs(nTz) : '0' + Math.abs(nTz))
//                    + ':00';
                bAllDay = true;
            }
            if (oEvt.end.match(/^[0-9]{2,4}.[0-9]{2}.[0-9]{2,4}$/) != null) {
//                oEvt.end += 'T00:00:00' 
//                    + (nTz > 0 ? '+' : '-') 
//                    + (Math.abs(nTz) < 10 ? '0' + Math.abs(nTz) : Math.abs(nTz)) 
//                    + ':00';
            
                oEvt.end += ' 00:00:00';
//                    + (nTz > 0 ? '+' : '-') 
//                    + (Math.abs(nTz) < 10 ? '0' + Math.abs(nTz) : Math.abs(nTz)) 
//                    + ':00';            
                if (bAllDay) {
                    oEvt.end = Date.preParse(oEvt.end).changeDate(-1).toISOString();
                    oEvt.allDay = true;
                }
            }
            if (oEvt.recur != undefined && oEvt.recur.length >= 0) {
                aResult = aResult.concat(self._parseWebRecur(oEvt));
                delete oEvt.recur;
            } else {
                aResult.push(oEvt);
            }
        }
//        console.log(aResult);
        return aResult;
    }
    
    self._parseWebV3Calendar = function(sCalendarId, data){
        var aResult = [],
            bAllDay = false;
//        , dTmp;
//        d = new Date(), 
//            ;
//            nTz = -d.getTimezoneOffset() / 60;
        for (var nI = 0; nI < data.length; nI++) {
            bAllDay = false;
            var oEvt = {}, oEl = data[nI];
            oEvt.id = oEl['id'];
            oEvt.title = oEl['summary'] || 'No Title';
            oEvt.className = sCalendarId;
            oEvt.parentId = sCalendarId;
            oEvt.calendarid = sCalendarId;
            oEvt.editable = false;
            oEvt.url = oEl.htmlLink != undefined ? oEl.htmlLink : '';
            if (oEl['start']['dateTime'] != undefined) {
                oEvt.start = oEl['start']['dateTime'];
                oEvt.allDay = false;
            } else {
                oEvt.start = oEl['start']['date'];
            }
            
            oEvt.end = oEl['end']['date'] != undefined ? oEl['end']['date'] : oEl['end']['dateTime'];
//            console.log(oEl, oEvt);
            if (oEvt.start == undefined || oEvt.end == undefined) {
                continue;
            }
            if (oEvt.start.match(/^[0-9]{2,4}.[0-9]{2}.[0-9]{2,4}$/) != null) {
                oEvt.start += ' 00:00:00'; 
                bAllDay = true;
            }
            if (oEvt.end.match(/^[0-9]{2,4}.[0-9]{2}.[0-9]{2,4}$/) != null) {
                oEvt.end += ' 00:00:00';
                if (bAllDay) {
                    oEvt.end = Date.preParse(oEvt.end).changeDate(-1).toISOString();
                    oEvt.allDay = true;
                }
            }
//            if (oEvt.recur != undefined && oEvt.recur.length >= 0) {
//                aResult = aResult.concat(self._parseWebRecur(oEvt));
//                delete oEvt.recur;
//            } else {
                aResult.push(oEvt);
//            }
        }
//        console.log(aResult);
        return aResult;
    }
    
    self._parseWebRecur = function(oEl) {
        var aResult = [oEl], aParamsString, aParams, sTmp,
            dMax = Date.baseDate(oEl.start, 3000),
            dCur, dStartPeriod, dEndPeriod, nCounter, 
            oNewElement,
            dElStart = Date.preParse(oEl.start),
            dElEnd = oEl.end != undefined && oEl.end != '' ? Date.preParse(oEl.end) : null;
        for (var nI = 0; nI < oEl.recur.length; nI++) {
            aParamsString = oEl.recur[nI].split(';')
            aParams = {INTERVAL : 1, UNTIL : dMax.toISOString()};
            for (var nJ = 0; nJ < aParamsString.length; nJ++) {
                sTmp = aParamsString[nJ].split('=');
                aParams[sTmp[0]] = sTmp[1];
            }
            dCur = Date.baseDate(dElStart);
            aParams.UNTIL = Date.preParse(aParams.UNTIL);
            nCounter = 0;
//            console.log(aParams);
            while (dCur < aParams.UNTIL) {
                nCounter++;
                if (aParams.COUNT != undefined && nCounter == aParams.COUNT) {
                    break;
                }
                switch (aParams['FREQ']) {
                    case 'YEARLY':
                        dCur.setFullYear(dCur.getFullYear() + aParams.INTERVAL);
                        break;
                    case 'MONTHLY' :
                        dCur.setMonth(dCur.getMonth() + aParams.INTERVAL);
                        break;
                }
                dStartPeriod = Date.baseDate(dCur);
                if (aParams.BYMONTH != undefined) {
                    dStartPeriod.setMonth(aParams.BYMONTH - 1);
                }
                
                
                oNewElement = jQuery.extend({}, oEl, {
                    start : dStartPeriod.toISOString(),
                    id : oEl.id + '_REC' + nCounter
                });
                delete oNewElement.recur;
//                console.log(oNewElement.start);
                if (dElEnd != undefined) {
                    var nDaysFrom = dStartPeriod.getDaysFrom(dElStart);
                    oNewElement.end = Date.baseDate(dElEnd, nDaysFrom).toISOString();
                }
                aResult.push(oNewElement);
                
            }
        }
        return aResult;
        
    }
    
    
    self._parseICAL = function(sCalendarId, sBody, dPeriodStart, dPeriodEnd) {
        var aText = sBody.split("\n"),
            bEvent = false,
            aLine,
            sLine,
            aEvt,
            aResult = [],
            aRrule = [],
            aPresentIds = {},
            aTag,
            sTag,
            dMoment,
            sTimeZone = self._parent.options.format['tzid'],
            bTZMode = null;
//    console.log('--- ' + dPeriodEnd);
        if (aText[0].trim() != 'BEGIN:VCALENDAR') {
            return [];
        }
        for (var nI = 0; nI < aText.length; nI++) {
            sLine = aText[nI].trim();
            if (sLine == 'BEGIN:VTIMEZONE' && bTZMode === null) {
                bTZMode = true;
                continue;
            } else if (bTZMode && sLine.indexOf('TZID:') == 0) {
                bTZMode = false;
//                sTimeZone = sLine.split(':')[1].trim();
                continue;
            } else if (!bEvent && sLine != 'BEGIN:VEVENT') {
                continue;
            } else if (bEvent && sLine == 'END:VEVENT') {
                bEvent = false; 
                if (aEvt.start == undefined || isNaN(aEvt.start)) {
                    aEvt.start = new Date();
                }
                if (aEvt.end == undefined || isNaN(aEvt.end)) {
                    aEvt.end = new Date(aEvt.start);
                }
                if (aPresentIds[aEvt.id] == undefined || aEvt.rrule === true) {
                    aPresentIds[aEvt.id] = aEvt;
                } else if (aPresentIds[aEvt.id].start > aEvt.start && aPresentIds[aEvt.id].rrule !== true) {
                    aPresentIds[aEvt.id] = aEvt;
                }
                continue;
            } else if (sLine == 'BEGIN:VEVENT') {
                aEvt = {
                    className   : sCalendarId,
                    parentId    : sCalendarId,
                    calendarid  : sCalendarId,
                    editable    : false,
                    url         : '',
                    allDay      : false
                };
                bEvent = true; 
                continue;
            } 
            aLine = sLine.split(':'),
                sTag = aLine[0],
                aTag = sTag.split(';');
            if (aTag.length > 1) {
                sTag = aTag[0];
            }
            switch(sTag) {
                case 'DTSTART' :
                    var oDate = Date.parseICALDate(aTag[1], aLine[1], aTag.length > 1, sTimeZone);
                    aEvt.allDay = oDate.allDay;
                    aEvt.start = oDate.date;
                    break;
                case 'DTEND' :
                    var oDate = Date.parseICALDate(aTag[1], aLine[1], aTag.length > 1, sTimeZone);
                    aEvt.allDay = oDate.allDay;
                    if (oDate.allDay && oDate.date > aEvt.start) {
                        oDate.date.changeDate(-1);
                    }
                    aEvt.end = oDate.date;
                    if (aEvt.allDay && aEvt.start != undefined && aEvt.end < aEvt.start ) {
                        aEvt.end = Date.baseDate(aEvt.start).resetHours();
                    }
                    break;
                case 'SUMMARY' :
                    aEvt.title = sLine.replace('SUMMARY:', '');
                    break;
                case 'UID' :
                    aEvt.id = aLine[1];
                    break;
                case 'RRULE' :
                    aEvt.rrule = true;
                    aRrule.push({evt : aEvt, 'rrule' : aLine[1]});
                    break;
//                    
            }
        }
        var aAllResult = Array.objectValues(aPresentIds);
        if (aAllResult.length > 0) {
//            console.log('dPeriodEnd ' + dPeriodStart + ' / ' + dPeriodEnd + ' / ');
            for (var nE = 0; nE < aAllResult.length; nE++) {
                aEvt = aAllResult[nE];
                if (aEvt.start <= dPeriodEnd && aEvt.end >= dPeriodStart) {
                    aResult.push(aEvt);
                } else {
                    console.log('skip ' + aEvt.start + ' / ' + aEvt.end + ' / ' + aEvt.id);
                }
            }
        }
//        console.log('rrule', aAllResult.length + ' / ' + aResult.length + ' / ' + aRrule.length);
        if (aRrule.length > 0) {
            var aDates = [];
            for (var nJ = 0; nJ < aRrule.length; nJ++) {
                aDates = Date.fRRuleParse(aRrule[nJ].rrule, aRrule[nJ].evt.start, aRrule[nJ].evt.end, dPeriodStart, dPeriodEnd);
                for (var nE = 0; nE < aDates.length; nE++) {
                    aResult.push(jQuery.extend(
                        {}, 
                        aRrule[nJ].evt, 
                        {'start' : aDates[nE].start, 'end' : aDates[nE].end, 'id' : aRrule[nJ].evt.id + '_' + String.token(16)}
                    ));
                }
            }
        }
        return aResult;
        
    }
    
    self._saveToServer = function(el, func, aParams) {
        var requestParams = {},
            sRequestType = 
                aParams != undefined 
                && aParams.requestType != undefined 
                && self._parent._getRequestEvent(aParams.requestType)
                    ? self._parent._getRequestEvent(aParams.requestType)
                    : self._parent._getRequestEvent('update');
        if (jQuery.isArray(el)) {
            requestParams = {
                'list' : el 
            }
        } else {
            requestParams = {
                "rid" : el.id,
                "data" : jQuery.extend({}, el)
            };
            requestParams.data.week = undefined;
        }
        if (aParams != undefined) {
            requestParams = jQuery.extend(requestParams, aParams);
        }
        self._parent._prependQueue(function(){
            self._parent._request(
                {
                    "jsRemote" : true,
                    "post" : true,
                    "data" : requestParams,
                    "requestType" : sRequestType,
                    "serverPath" : "event"
                }, function(data) {
                    if (data.status != undefined && data.status.substr(0, 6) != 'Error:') {
                        self._parent.showNotify(data.status)
                    }
                    if (typeof(func) == 'function') {
                        func(data);
                    }
                }
            );
        });
    }
    
    self._deleteOnServer = function(sEventId) {
        self._parent._prependQueue(function(){
            self._parent._request(
                {
                    "jsRemote" : true,
                    "data" : {"rid" : sEventId},
                    "requestType" : self._parent._getRequestEvent('delete'),
                    "serverPath" : "event"
                }, function(data) {
                    self._parent.showNotify(data.status)
                }
            );
        });
    }
    
    
    self._saveEvent = function(aData, sCalendarId, fResponse) {
        var aCalendar = self._parent._calendars.getCalendar(sCalendarId),
            aEl;
        if (aData.id != undefined) {
            aEl = {
                "id" : aData.id,
                "calendarid" : sCalendarId
            };
        } else {
            aEl = {
                calendarid  : sCalendarId, 
                className   : sCalendarId,
                editable    : true,
                start       : aData.start,
                end         : aData.end
            };
        }
        if (aData.start != undefined) {
            aEl.start = aData.start;
        }
        if (aData.end != undefined) {
            aEl.end = aData.end;
        }
//        console.log(aEl);
        aEl.allDay = (aCalendar.st == 'DATE' && (aCalendar.et == 'DATE' || aCalendar.et == ''));
        aEl.data = aData.data;
        self._parent._calendars.resetCalendar(sCalendarId);
        self._saveToServer(aEl, fResponse);
        
        return true;
    }
    
    self._getEventDetail = function(mId, mCalendarId, fResponse) {
        if (typeof(mCalendarId) == 'function' && fResponse == undefined) {
            fResponse = mCalendarId;
            mCalendarId = null;
        }
        var aData;

        self._parent._prependQueue([
            function() {
                if (typeof(fResponse) == 'function') {
                    fResponse(aData);
                }
            },
            function(){
                self._parent._request(
                    {
                        "jsRemote" : true,
                        "data" : {
                            "rid" : typeof(mId) == 'string' ? mId : mId.join(","),
                            "cid" : (mCalendarId != null && jQuery.isArray(mCalendarId) ? mCalendarId.join(',') : mCalendarId)
                        },
                        "requestType" : self._parent._getRequestEvent('detail_list'),
                        "serverPath" : "event"
                    }, function(data) {
                        aData = data;
                        if (data.status != undefined) {
                            self._parent.showNotify(data.status)
                        }

                    }
                );
            }
        ]);        
    }
    
    self._clearEvents = function(mCalendarId) {
        self._period = {
            "week"          : {},
            "day"           : {}
        };
        
        self._eventCache = {};
        self._aBasket = [];
        self._parent._calendars.resetCalendar();
        for (var nI = 0; nI < self._data.length; nI++) {
            delete self._data[nI];
        }
        self._data.length = 0;
    }
    
    
    self._splitEventsByLine = function(aData, aParams) {
        var oWeek = self._setWeekBar({
           events    : aData,
           startDate : aParams.min,
           endDate   : aParams.max
        });
        return oWeek.bar;
    }
    
    self._pasteEvent = function(oClickDate, fFunc)  {
        if (self._aBasket == undefined || self._aBasket == null || self._aBasket.length < 1) {
            return false;
        }
//        console.log(self._aBasket);
        var oFirstEvent = self._getEvent(self._aBasket[0].id, self._aBasket[0].calendar);
        if (oFirstEvent == false || oFirstEvent == undefined) {
            return false;
        }
        var dStart = Date.baseDate(oFirstEvent[0].dateStart);
//        console.log(' dStart '  + dStart + ' / ' + oClickDate.date);
        var aParams = {};
        
        if (!oClickDate.hourly) {
            dStart.setHours(0, 0, 0, 0);
            aParams.day_change = -dStart.getDaysFrom(oClickDate.date, false);
        } else {
            aParams.hour_change = -dStart.getHoursFrom(oClickDate.date);
        }
        if (self._bCutMode) {
            self._updateEvent(self._aBasket, aParams, null, fFunc);
        } else {
            self._copyEvent(self._aBasket, aParams, fFunc);
        }
        self._aBasket = [];
        return true;
    }
    
    
    self._checkSearch = function(oEl) {
        if (
            (self._aSearchCalendars.length == 0 || self._aSearchCalendars.indexOf(oEl.calendarid) >= 0)
            && (self._sSearchFields == 'agenda' || oEl.title.toLowerCase().indexOf(self._sText) < 0 )
            && (self._sSearchFields == 'title' || (oEl.addTitle == undefined || oEl.addTitle.toLowerCase().indexOf(self._sText) < 0))
        ) {
            return true;
        }
        return false;
    }
    
    self._checkDisable = function(oEl) {
        if (oEl.parentId == undefined || self._oSwitchDisable[oEl.parentId] == undefined) {
            return;
        }
        if (self._oUncheckDisable.indexOf(oEl.parentId)) {
            self._oUncheckDisable.push(oEl.parentId);
        }
        oEl.disable = self._oSwitchDisable[oEl.parentId];
    }
    
    self._getAdditionalTitlesHTML = function(oEl, aParams) {
        var bParams = aParams == undefined || aParams.showLabels == undefined;
        aParams = aParams == undefined 
            ? self._aDefaultAdditionalTitleParams 
            : jQuery.extend({}, self._aDefaultAdditionalTitleParams, aParams);
//                aParams || {"label" : "<b>", "value" : "<i>", "split" : ": ", "line" : "<br>", "html" : true, "showLabels" : false};
        var sText = "",
            aDetails = (oEl.addTitle != undefined && oEl.addTitle != '') ? oEl.addTitle.split('::') : [],
            oCalendar = self._parent._calendars.getCalendar(oEl.calendarid),
            sValue = '';
        if (aDetails.length == 0 || oCalendar == undefined || oCalendar.additionalTitle == undefined || oCalendar.additionalTitle.length == 0) {
            return sText;
        }
        for (var nJ = 0; nJ < oCalendar.additionalTitle.length; nJ++) {
            if (aDetails[nJ] != undefined && aDetails[nJ] != ''  && aDetails[nJ] != 'null') {
                sValue = self._parent._objects.getFieldSimpleTextValue(oCalendar.additionalTitle[nJ].type, aDetails[nJ]);
                if (aParams.html === false) {
                    sValue = sValue.strip_tags();
                }
                if (oCalendar.additionalTitle[nJ].isHTML !== true && oCalendar.additionalTitle[nJ].isHTML != 'true') {
                    sValue = sValue.htmlspecialchars();
                }
                sText += 
                    ((self._parent.params.agendaFieldLabels && bParams) || aParams.showLabels === true 
                        ? aParams.label 
                            + oCalendar.additionalTitle[nJ].label.htmlspecialchars() 
                            + aParams.label.replace("<", "</")
                            + aParams.split
                        : ""
                    )
                    + aParams.value
                    + sValue
                    + aParams.value.replace("<", "</")
                    + aParams.line;
            }
        }
        return sText;
    }
    
    var cEventModel = function(aData) {
        jQuery.extend(this, aData);
    }
    
    cEventModel.prototype.getCalendar = function(){
        return self._parent._calendars.getCalendar(this.calendarid);
    }
    
    cEventModel.prototype.getAdditionalTitle = function(aParams){
        return self._getAdditionalTitlesHTML(this, aParams);
    }
    
    cEventModel.prototype.getTitle = function(bShow) {
        var aEvent = this;
        if (aEvent == undefined || aEvent == null) {
            return '';
        }
        switch (self._parent.params.showTitles) {
            case "0" :
                return '';
            case "1" :
                return aEvent.title.strip_tags().htmlspecialchars();
            case "2" :
                return aEvent.title.strip_tags().htmlspecialchars()  + "\n"
                + aEvent.dateStart.format(self._parent.options.format[aEvent.allDay !== false ? 'date' : 'datetime'])
                + (aEvent.end != null && aEvent.end != '' && aEvent.dateEnd > aEvent.dateStart
                    ? "\n" + 
                        aEvent.dateEnd.format(self._parent.options.format[aEvent.allDay !== false ? 'date' : 'datetime'])
                    : '');
            case "3" :
                if (bShow !== true) {
                    return "";
                }
                var sText = aEvent.title.strip_tags().htmlspecialchars()  + "\n"
                    + aEvent.dateStart.format(self._parent.options.format[aEvent.allDay !== false ? 'date' : 'datetime'])
                    + (aEvent.end != null && aEvent.end != '' && aEvent.dateEnd > aEvent.dateStart
                        ? "\n" + 
                            aEvent.dateEnd.format(self._parent.options.format[aEvent.allDay !== false ? 'date' : 'datetime'])
                        : '');
                var oCalendar = self._parent._calendars.getCalendar(aEvent.calendarid);
                if (oCalendar.additionalTitle != undefined ){
                    sText += "\n" + aEvent.getAdditionalTitle({"label" : "", "value" : "", "split" : ": ", "line" : "\n", "html" : false});
                }
                return sText;
        }
        return "";
//        return oModel.getEventTitle(this, bShow);
    }
    
    cEventModel.prototype.isReccurence = function(){
        var aEvt = this;
        if (aEvt.specColor != undefined && aEvt.specColor.indexOf('_spec_reccuring') >= 0) {
            return true;
        }
        return false;
    }
    
    
    
    this.refresh = function(data) {
        self._refresh(data);
    }
    
    this.setEvent = function(mEvent, aWhat, aFilter) {
        self._updateEvent(mEvent, aWhat, aFilter);
    }
    
    this.getWeekEventsBar = function(dWeekDate) {
        var tWeekDate = dWeekDate.getTime() / 1000;
        if (self._data.length == 0) {
            return  [];
        }
        return typeof(self._period.week[tWeekDate]) == 'undefined' 
            ? []
            : self._period.week[tWeekDate].bar;
    }
    
    this.getWeekDaysData = function(dWeekDate, nDay, bDailySorted, aFilter) {
        bDailySorted = bDailySorted || false;
        if (typeof(dWeekDate) == 'number') {
            dWeekDate = new Date(dWeekDate * 1000);
        }        
        var tWeekDate = dWeekDate.getTime() / 1000;
        if (typeof(nDay) == 'undefined'){
            var aResult = (typeof(self._period.week[tWeekDate].daysData) == 'undefined')
                ? []
                : self._period.week[tWeekDate].daysData;
            if (aFilter != undefined) {
                aResult = [].concat(aResult).filter(function(el){
                    return self._checkEventFilter(el, aFilter);
                });
            }
            return aResult;
        } else {
            var aResult = 
                (typeof(self._period.week[tWeekDate]) == 'undefined'
                ||
                typeof(self._period.week[tWeekDate].daysData[nDay]) == 'undefined')
                ? []
                : self._period.week[tWeekDate].daysData[nDay];
            if (bDailySorted != undefined && bDailySorted === true)  {
                aResult = jQuery.extend([], aResult);
                aResult = aResult.filter(function(el){
                    return typeof(el) != 'undefined';
                });
                aResult.quickSort(self._sortEventsDaily);
                
            }
            if (aFilter != undefined) {
                aResult = [].concat(aResult).filter(function(el){
                    return self._checkEventFilter(el, aFilter);
                });
            }
            return aResult;
                
        }
    }
    
    
    this.getDayEvents = function(dDate, bSorted, aFilter) {
        var dWeek = Date.baseDate(dDate);
        dWeek.resetFirstWeekDay(self._parent.params.startWeekDay);
        var aEvents = this.getWeekDaysData(dWeek, dDate.getDay(), false, aFilter);
        if (bSorted === true) {
            var aTmpDaily = aEvents.filter(function(el){
                    return el.allDay == true;
                }),
                aTmpHourly = aEvents.filter(function(el){
                    return el.allDay !== true;
                });
            aTmpDaily.quickSort(self._sortEvents);
            aTmpHourly.quickSort(self._sortEvents);
            
            aEvents = aTmpDaily.concat(aTmpHourly);
        }
        return aEvents;
        
    }
    
    this.getWeek = function(dWeek) {
        if (dWeek != undefined) {
            if (jQuery.isNumeric(dWeek)) {
                return self._period.week[dWeek];
            } else {
                return self._period.week[dWeek.getTime() / 1000];
            }
        }
        return self._period.week;
    }
    
    this.getEvent = function(mEvent, sCalendarId) {
        
        if (typeof(mEvent) == 'undefined') {
            return self._data;
        }
        if (jQuery.isNumeric(mEvent)) {
            return typeof(self._data[mEvent]) == 'undefined'
                ? {}
                : self._data[mEvent];
        } else {
            
            if (typeof(self._eventCache[mEvent]) != 'undefined' && self._eventCache[mEvent].length > 0) {
                if (sCalendarId == undefined) {
                    return self._eventCache[mEvent][0];
                } else {
                    return self._getEvent(mEvent, {"calendar" : sCalendarId});
                }
                
            } else {
                return {};
            }
        }
    }

    this.getData = function(params, fResponse) {
        return self._getData(params, fResponse);
    }
    
    this.getEventDetail = function(mId, mCalerndarId, fReponce) {
        return self._getEventDetail(mId, mCalerndarId, fReponce);
    }
    
    
    this.splitEventsByLine = function(aData, aParams) {
        return self._splitEventsByLine(aData, aParams);
    }
    
    this.delEvent = function(mEventId) {
        self._delEvent(mEventId);
    }
    
    this.saveEvent = function(aData, sCalendarId, fResponse) {
        return self._saveEvent(aData, sCalendarId, fResponse);
    }
    
    this.clearEvents = function() {
        self._clearEvents();
    }
    
    this.basketEvent = function(aEls, sMode) {
        sMode = sMode || 'cut';
        self._bCutMode = sMode == 'cut';
        self._aBasket.length = 0;
        if (aEls == undefined || aEls == null || aEls.length < 1) {
            return;
        }
        var aCheck = {};
        for (var nI = 0; nI < aEls.length; nI++) {
            if (aCheck[aEls[nI].calendar] == undefined) {
                aCheck[aEls[nI].calendar] = [aEls[nI].id];
                self._aBasket.push(aEls[nI]);
            } else if (aCheck[aEls[nI].calendar].indexOf(aEls[nI].id) == -1) {
                aCheck[aEls[nI].calendar].push(aEls[nI].id);
                self._aBasket.push(aEls[nI]);
            }
        }
    }
    
    this.pasteEvent = function(oClickDate, fFunc){
        self._pasteEvent(oClickDate, fFunc);
    }
    
    this.getEvents = function(aParams) {
        return self._getEvents(aParams);
    }
    
    this.emptyEvent = function(aParams) {
        var aEvents = self._getEvents(aParams), aID = [], aFilter = null;
        if (aParams.onlyFilter == true) {
            self._emptyEvent(aEvents, true);
        } else {
            for (var nI = 0; nI < aEvents.length; nI++) {
                aID.push(aEvents[nI].id);
            }
            self._emptyEvent(aID);
        }
    }
    
        
//    this.getEventTitle = function(aEvent, bShow) {
//        
//    }
    

    
    this.getBarLabelTime = function(aEvent, sFormat, bShowAllDay) {
        bShowAllDay = bShowAllDay || false;
        
        
        if (self._parent.params.barLabelTime == 'no' || (!bShowAllDay && aEvent.allDay)) {
            return "";
        }
        
        sFormat = sFormat || (aEvent.allDay ? 'dateTitle' : 'hourTitle');
        var sResult = aEvent.dateStart.format(self._parent.options.format[sFormat]);
        if (self._parent.params.barLabelTime == 'end') {
            if (aEvent.dateEnd != undefined && aEvent.dateEnd > aEvent.dateStart) {
                sResult += '-'
                    + aEvent.dateEnd.format(self._parent.options.format[sFormat])
            }
        }
        
        return sResult + ' ';
    }
    
    
    
    this.setSearch = function(sText, aCalendars, sFields){
        self._sText = sText.toLowerCase();
        if (aCalendars != undefined) {
            self._aSearchCalendars = aCalendars;
        }
        if (sFields != undefined) {
            self._sSearchFields = sFields;
        }
        
        self._updateEvent(null, {"nonsearched" : false});
        if (self._sText != '') {
            self._updateEvent(null, {"nonsearched" : true}, self._checkSearch);
        }
        self._parent._events.refresh();
        
    }
    
    this.getSearch = function(sWhat) {
        sWhat = sWhat || 'text';
        switch(sWhat) {
            case 'text' :
                return self._sText;
                break;
            case 'calendars' :
                return self._aSearchCalendars;
                break;
            case 'fields' :
                return self._sSearchFields;
                break;
        }
    }
    
    this.getEventColor = function(sColor) {
        if (sColor == undefined || sColor == '') {
            return '';
        }
        sColor = sColor.trim();
        var nSpec = sColor.indexOf('spec'),
            nSD = sColor.indexOf('_sd_');
        if (nSD < 0 || nSpec < 0 || nSD < nSpec) {
            return sColor;
        }
        return sColor.replace('_sd_', '_nosd_');
    }
    
    this.setFilterPanel = function(aFilters) {
        self._aFilterPanel = aFilters
    }

    
//    this.getAdditionalTitlesHTML = function(oEl, aParams) {
//        return self._getAdditionalTitlesHTML(oEl, aParams);
//    }
    
    self._init(data);
}
