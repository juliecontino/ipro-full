/* Copyright (c) 2012, SliverLine, JQGantt, d.sorokin */


(function(){
    var self = {
        _data               : [],
        _css                : '/css/gantt.css',
        _parent             : null,
        _div                : null,
        _dom                : {},
        _aCalendat2Group    : {},
        _calendarsData      : {},
        _calendarsGroupingFields  : {},
        _calendarsGroupingValues  : {},
        _calendars          : [],
        _period             : {
                                "min" : new Date(), 
                                "max" : new Date(), 
                                visualMin : new Date(),
                                visualMax : new Date()
                            },
        _format             : "day",
        _periodType         : 3,
        _groupingMode       : false,
        _offDayHours        : 0,
        _options            : {
            "mode" : {
                "hour" : {scale : 20, change : 1, oneday : 20, allow : [0.1, 0.7, 1], addDay : 0, addHour : 1},
                "day" : {scale : 20, change : 1, oneday : 20, allow : [0.1, 0.7, 1, 3, 6, 12, 36, 120], addDay : 0},
                "week" : {scale : 33, change : 3, oneday : 5, allow : [0.7, 1, 3, 6, 12, 36, 120], addDay : 7},
                "month" : {scale : 63, change : 6, oneday : 2, allow : [1, 3, 6, 12, 36, 120], addDay : 0},
                "quarter" : {scale : 103, change : 12, oneday : 1, allow : [3, 6, 12, 36, 120, 0], addDay : 0}
            },
            "formatList" : ["hour", "day", "week", "month", "quarter"]
        },
        _multi : null,
        _scrollToday : null,
        _aCollapsed : {}
    };
    
    var view = {};

/**
 * Initialization of Gantt
 *
 * @return {void}
 */
    view.init = function (div, parent){
//        self._div = div;
        self._parent = parent;
        self._div = self._parent.layout.getCurrentModeDiv('gantt');
        self._parent.loadCss(self._css);
        self._format = self._parent.params.ganttSplit;
        self._periodType = self._parent.params.ganttPeriod > 0 && self._parent.params.ganttPeriod < 1
            ? parseFloat(self._parent.params.ganttPeriod) 
            : parseInt(self._parent.params.ganttPeriod);
        self._options.mode.hour.oneday = parseInt(self._parent.params.minMinutePeriod) / 3;
        self._offDayHours = !self._parent.params.ganttRespectHours 
            ? 0
            : parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
    }
    

    view.show = function(){
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('gantt');
        }
        self._div.addClass('format_' + self._format);
        view.changeCurrentPeriod(self._parent.options, 0);
        self._buildDOM();
        self._div.addClass('show');
        
    }
    
    view.reShow = function(aParams) {
        if (aParams.curtime === true) {
            self._scrollToday = true;
        }
        view.show();
    }
    
    view.showData = function(params) {
        self._multi = null;
        params = params || {};
        params.min = new Date(self._period.min);
        params.max = new Date(self._period.max);
        params.calendars = self._parent.layout.getActiveCalendars();
        self._calendars = [].concat(params.calendars.calendar, params.calendars.group, params.calendars.web);

        
        if (self._periodType == 0) {
            if (self._calendars.length > 0) {
                params.min.setTime(0);
                params.max.setYear(2100);
            } else {
                params.min.setTime(self._parent.options.current.getTime());
                params.min.setDate(1);
                params.min.resetHours();
                
                params.max.setTime(params.min.getTime());
                params.max.changeMonth(3).changeDate(-1);
            }
        }
        if (params.calendars.group.length > 0) {
            self._setCalendar2Group(params.calendars.group);
        }
        
        if (typeof(self._calendarsGroupingValues) != 'undefined') {
            params.grouping = self._calendarsGroupingValues;
        }
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('gantt');
        }
        if (self._periodType > 0 || self._calendars.length == 0) {
            self._buildRightHead();
        } 
        var aObjects = [];
        for (var nI = 0; nI < params.calendars.calendar.length; nI++) {
            var aCalendar = self._parent._calendars.getCalendar(params.calendars.calendar[nI]);
            if (aObjects.indexOf(aCalendar['objectName']) < 0) {
                aObjects.push(aCalendar['objectName']);
            }
        }
        
        var aQueue = [
            function(){
                self._parent._calendars.checkPresentGroupCalendars(params.calendars.group);
            }, 
            function(){
                if (params.calendars.group == undefined || params.calendars.group < 1) {
                    return;
                }
                for (var nI = 0; nI < params.calendars.group.length; nI++) {
                    var aCalendar = self._parent._calendars.getCalendar(params.calendars.group[nI]);
                    var sObjectGroup = self._getObjectNameIfCalendarGroupMembersHaveOneObject(aCalendar);
                    if (sObjectGroup != '') {
                        aObjects.push(sObjectGroup);
                    }
                }
            },
            function() {
                self._parent._objects.getObjects(aObjects, null, {loadReferenced : true});
            },
            function(){
                self._parent._objects.getObjectFilterFields(
                    aObjects, 
                    function(aStructure){
                        jQuery.extend(self._calendarsGroupingFields,  aStructure);
                    }, 
                    {"type" : ["REFERENCE", 'TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX']}
                );
            },
            function() {
                
                if (self._calendarsGroupingFields != undefined && self._calendarsGroupingValues != undefined) {
                    
                    for (var nI = 0; nI < params.calendars.calendar.length; nI++) {
                        if (typeof(self._calendarsGroupingValues[params.calendars.calendar[nI]]) != 'undefined') {
                            if (params.grouping === undefined)  {
                                params.grouping = {};
                            }
                            params.grouping[params.calendars.calendar[nI]] = self._calendarsGroupingValues[params.calendars.calendar[nI]];
                        }
                    }
                    var aCalendar,
                        sDefaultGrouping;
                    for (var nI = 0; nI < params.calendars.group.length; nI++) {
                        aCalendar = self._parent._calendars.getCalendar(params.calendars.group[nI]);
                        sDefaultGrouping = self._getCommonGroupingField(aCalendar);
                        if (typeof(self._calendarsGroupingValues[params.calendars.group[nI]]) == 'undefined' && sDefaultGrouping != '') { 
                            self._calendarsGroupingValues[params.calendars.group[nI]] = sDefaultGrouping;
                        }
                        for (var nJ = 0; nJ < aCalendar.calendarsList.length; nJ++) {
                            if (typeof(self._calendarsGroupingValues[params.calendars.group[nI]]) != 'undefined') {
                                if (params.grouping === undefined)  {
                                    params.grouping = {};
                                }
                                params.grouping[aCalendar.calendarsList[nJ]] = self._calendarsGroupingValues[params.calendars.group[nI]];
                            }
                        }
                    }
                }
                self._calendarsData = {};
                self._dom.title.children().add(self._dom.events.children())
                    .not('[data-calendar="' + self._calendars.join('"], [data-calendar="') + '"]')
                    .remove();
                self._parent._events.getData(params, function(data, aMultiParams){
                    if (aMultiParams != undefined &&  aMultiParams.currentData != undefined && self._periodType != 0) {
                        if (self._multi == null) {
                            self._multi = [];
                        }
                        var aCalculatedCalendars = self._calculateData(aMultiParams.currentData);
                        self._buildLeftBody(aCalculatedCalendars);
                        self._buildRightBody(aCalculatedCalendars);
                    } else {
                        
                    }
                    self._data = data;
                    
                });
            },
            function() {
                self._calculateData();
                self._buildLeftBody();
                self._buildRightBody();
                self._multi = null;
            },
            
        ];
        aQueue.reverse();
        self._parent._prependQueue(aQueue);
    }


    view.getTitle = function(){
        if (self._periodType == 0.1) {
            return self._parent.options.current.format(self._parent.options.format.fullDate);
        } else if (self._periodType == 0.7) {
            return self._period.min.format('mmm d - ')
                + (self._period.min.getMonth() != self._period.max.getMonth()
                    ? self._parent.options.max.format('mmm') + ' ' 
                    : "")
                + self._period.max.format('d, yyyy');
        } else if (self._periodType == 1) {
            return self._period.min.format('mmmm yyyy');
        }
        return self._period.min.format(self._parent.options.format.shortMonthTitle) 
            + ' - '
            + self._period.max.format(self._parent.options.format.shortMonthTitle);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        } 
    }

    
    
    view.changeCurrentPeriod = function(aOptions, mDirection) {
        var bShortDayMode = self._periodType > 0 && self._periodType < 1;
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
        } else if (mDirection !== 0){
            var nChange = self._options.mode[self._format].change;
            if (self._periodSelector != undefined ) { 
                nChange = self._periodSelector.find('select').val() > 0 
                    ? self._periodSelector.find('select').val() 
                    : nChange;
            }
            if (bShortDayMode) {
                aOptions.current.changeDate(self._periodType * 10 * mDirection);
            } else {
                
                aOptions.current.changeMonth(nChange * mDirection);
                        //setMonth(aOptions.current.getMonth() + nChange * mDirection);
            }
        }
        
                
            
        
        aOptions.current.setHours(0, 0, 0, 0);
        
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date();
        }
        aOptions.min.setTime(aOptions.current);
        if (!bShortDayMode) {
            aOptions.min.setDate(1);
        }
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = new Date();
        } 
        aOptions.max.setTime(aOptions.min);
        if (!bShortDayMode) {
            aOptions.max.setMonth(aOptions.max.getMonth() + self._periodType)
            aOptions.max.setDate(0);
        } else if (self._periodType  == 0.7) {
            aOptions.max.changeDate(7);
        }
        
        if (self._periodType == 0) {
            aOptions.min.setTime(0);
            aOptions.max.setYear(2100);
        }
        self._period.min.setTime(aOptions.min);
        self._period.max.setTime(aOptions.max);
    }
    
    
    view.refresh = function(aParams) {
        var nOldOffHours = self._offDayHours;
        self._offDayHours = !self._parent.params.ganttRespectHours 
            ? 0
            : parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._aCollapsed = {};
        if (self._format == 'hour' && nOldOffHours != self._offDayHours) {
            self._buildRightHead();
        }
        
        view.showData();
    }
    
    view.delEvent = function(mEventId) {
        if (typeof(mEventId) == 'string') {
            mEventId = [mEventId];
        }
        var sEvt = 'div.evt[data-event="' + mEventId.join('"], div.evt[data-event="') + '"]';
        self._dom.calendars.children('.title').find(sEvt).remove();
        self._dom.events.find(sEvt).parent().remove();
    }
    
    view.preparePrint = function(bMode) {
//        if (self._data != undefined && self._parent.params.ganttMaxPrintItems > 0 &&  self._data.length > self._parent.params.ganttMaxPrintItems) {
//            var sHTML = '<div style="text-align:center"><b>'
//                + self._parent.getText('message_the_total_number', 'The total number of events is more than') + ' ' 
//                + self._parent.params.ganttMaxPrintItems 
//                + '. ' 
//                + self._parent.getText('message_prlease_reduce_period', 'Please reduce period and/or turn off some calendars to get print version.') 
//                + '</b><br>'
//                + '<span class=simple_button data-action="cancelPrint">'
//                    + self._parent.getText('close', 'Close') 
//                    + '</span></div>';
//            self._parent.showPopup({
//                html        : sHTML,         // send ready dom 
//                center      : true,
//                modal       : true,
//                view        : view,
//                shadow      : true,
//                autohide    : false,
//                overflow    : false            
//            });
//            return false;
//        } else {
        self._expand(bMode);
//        }
    }
    
    view.clearView = function() {
        delete self._dom.form;
        delete self._dom.calendars;
        delete self._dom.date;
        delete self._dom.title;
        delete self._dom.events;
        self._dom = {};
        self._div = null;
    }
    
    
    view.getClickDate = function(oEvt) {
        var oCalculated = self._getPosition(oEvt),
            dD = Date.baseDate(
                self._period.min, 
                self._format != 'hour' ? oCalculated.day : 0,
                0
            );
        if (self._format == 'hour') {
            oCalculated.day = parseInt(oCalculated.day);
            var nWorkingHours = self._parent.params.ganttRespectHours 
                    ? self._parent.aCalculated.stopHour - self._parent.aCalculated.startHour
                    : 24,
                            
                nCorrectionHour = nWorkingHours == 24 ? oCalculated.day
                    : parseInt(self._parent.aCalculated.startHour)
                            + Math.floor(oCalculated.day / nWorkingHours) * 24 
                            + oCalculated.day % nWorkingHours;
            dD.changeHour(nCorrectionHour);
        }
        return {
            "date" : dD,
            "hourly" : self._format == 'hour'
        }
    }
    
    view.getBlocksData = function(aParams) {
        var aResult = [],
            aHeadBlocks = self._dom.date.find('th'),
            aDates = self._dom.date.find('td'),
//            aCalendarBlocks = self._dom.title.children(),
            nMaxPageWidth = aParams.w - 250 || 800,
            nMaxPageHeight = (aParams.h - 50) || 500,
            nMaxDates = aDates.size(),
            nHeadBlocks = aHeadBlocks.size();
        var aBlocksList = self._buildCalendarEvenentsBlocks(nMaxPageHeight);

        
        for (var nB = 0; nB < aBlocksList.length; nB++) {
            var sTitles = '',
                aSubDates = [],
                nStart = 0,
                nAlreadyWidth = 0,
                sDates = '',
                sHead = '',
                dMin = null, 
                dMax = null,
                nRealColspan = 0,
                nStartHead = -1,
                nD = 0,
                nAttempts = 0;

            for (var nCalendar = 0; nCalendar < aBlocksList[nB].length;  nCalendar++) {
                sTitles += aBlocksList[nB][nCalendar].html;
            }
            do {
                sHead = '';
                nAlreadyWidth = 0;
                nRealColspan = 0;
                sDates = '';
                aHeadBlocks.each(function(nSubIdx, oDateEl){
                    if (nSubIdx <= nStartHead) {
                        return;
                    }
                    oDateEl = jQuery(oDateEl);
                    var nColspan = parseInt(oDateEl.attr('colspan')) + (nSubIdx == nHeadBlocks - 1 ? -1 : 0),
                        nWidth = self._options.mode[self._format].scale * nColspan;
                    if (nAlreadyWidth + nWidth > nMaxPageWidth && nRealColspan > 0) {
                        return false;
                    } else {
                        nRealColspan += nColspan;
                        sHead += oDateEl[0].outerHTML;
                        nStartHead = nSubIdx;
                        nAlreadyWidth += nWidth;
                    }
                });
                if (nRealColspan == 0) {
                    break;
                }
                for (nD = nStart; nD < nStart + nRealColspan; nD++){
                    if (aDates.eq(nD).size() < 1) {
                        break;
                    }
                    sDates += aDates.eq(nD)[0].outerHTML;
                    
                    if (nD == nStart + nRealColspan - 1) {
                        dMax = Date.baseDate(
                            aDates.eq(nD).data('d'), 
                            self._options.mode[self._format].addDay,
                            self._options.mode[self._format].addHour || 0
                        );
                    } else if (nD == nStart) {
                        dMin = Date.baseDate(aDates.eq(nD).data('d'));
                    }
                }
                    //var aEvents = 
                if (dMax == null) {
                    dMax = Date.baseDate(dMin);
                }
                if (self._format == 'month') {
                    dMax.changeMonth(1);
                } else if (self._format == 'quarter') {
                    dMax.changeMonth(3);
                }
                dMin.resetHours();
                if (dMin > self._period.max) {
                    break;
                }
                
                
                var sEventsHTML = '';
                for (var nCalendar = 0; nCalendar < aBlocksList[nB].length;  nCalendar++) {
                    sEventsHTML += self._buildCalendarEvenentsPeriod( 
                        aBlocksList[nB][nCalendar].calendarId, 
                        aBlocksList[nB][nCalendar].events,
                        dMin, 
                        dMax
                    );
                }
                aSubDates.push({
                    'min'   : dMin,
                    'max'   : dMax,
                    'html'  : '<table><thead>' + sHead + '</thead><tbody>' + sDates + '</tbody></table>',
                    'events' : sEventsHTML
                }) 
                nStart = nD;
            } while (nD < nMaxDates && nAttempts++ < 10);
            

            aResult.push({
                titles  : sTitles,
                dates   : aSubDates
            });
        }
        return {
            data : aResult,
            format : self._format
        }
        
    }   
    

/**
 * Init all default events
 *
 * @return {void}
 */
    
    self._initEvents  = function(){
        self._typeSelector.on('change', 'select', function(){
            var el = jQuery(this),
                sOldFormat = self._format;
            self._div.removeClass('format_' + self._format);
            self._format = el.val();
            self._div.addClass('format_' + self._format);
            if (self._options.mode[self._format].allow.indexOf(self._periodType) < 0) {
                self._periodSelector.find('select').val(self._options.mode[self._format].allow[0]);
                self._periodSelector.find('select').trigger('change');
            } else {
                self._buildRightHead();
                self._buildRightBody();
                if (sOldFormat == 'hour' && self._parent.params.ganttRespectHours && !self._parent.params.ganttShowUnvisible) {
                    self._dom.title.children('[data-calendar]')
                        .children('[data-event]:hidden')
                        .show();
                }
            }
        });
        
        self._periodSelector.on('change', 'select', function(){
            var el = jQuery(this);
            self._periodType = ["0.1", "0.7"].indexOf(el.val()) >= 0 ? parseFloat(el.val()) : parseInt(el.val());
            if (self._options.mode[self._format].allow.indexOf(self._periodType) < 0) {
                jQuery.each(self._options.mode, function(sKey, mVal){
                    if (mVal.allow.indexOf(self._periodType) >= 0) {
                        self._div.removeClass('format_' + self._format);
                        self._format = sKey;
                        self._div.addClass('format_' + self._format);
                        self._typeSelector.children('select').val(self._format);
                        return false;
                    }
                });
            }
            self._parent.layout.changePeriod(0, {"refreshTitle" : true});
            view.showData();
        });
        
        self._dom.events.on('change', 'div.grouping > select#main', function(){
            var el1 = jQuery(this);
            var el2 = el1.next();
            if (el1.val() == '-1') el2.val('-1');
            self.handlingGroupingPicklists(el1, el2);
        });

        self._dom.events.on('change', 'div.grouping > select#sub', function(){
            var el2 = jQuery(this);
            var el1 = el2.prev();
            self.handlingGroupingPicklists(el1, el2);
        });
        
        if (self._parent.options.readonly !== true) {
            self._parent._prependQueue([
                function(){
                    self._initDragEvent();
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.simpleselect.js');
                }
            ]);
        }
        
        self._dom.events
            .on('scroll', function(evt){
                
                self._dom.date.scrollLeft(self._dom.events.scrollLeft());
                self._dom.title.scrollTop(self._dom.events.scrollTop());
            });
            
        self._wideSelector.on('click', function(){
            self._div.toggleClass('_wide');
        });
        
        self._dom.events.add(self._dom.title).on('click', '[data-action]', function(evt){
            var oEl = jQuery(evt.target),
                sAction = oEl.data('action');
            return view.action(sAction, oEl, evt);
        });
    }
    
    self.handlingGroupingPicklists = function(oFirstSelector, oSecondSelector) {
        var sResult = oFirstSelector != undefined && oFirstSelector.size() > 0 && oFirstSelector.val() != ''
            ? oFirstSelector.val()
            : '';
        sResult += oSecondSelector != undefined && oSecondSelector.size() > 0 && oSecondSelector.val() != ''
            ? (sResult != '' ? ',' : '') + oSecondSelector.val()
            : '';
        self._calendarsGroupingValues[oFirstSelector.parents('[data-calendar]').data('calendar')] = sResult;
        view.showData();
    }

/**
 * Window resize event handler
 *
 * @return {void}
 */
    self._resize = function(){
    }

/**
 * Calculate income data, prepare date periods , also sort tree
 *
 * @return array list of calculated calendars
 */

    self._calculateData = function(aData){
        var aEl, dStart, dEnd, aTmpCalendars = [],
            aPrevious = Array.objectKeys(self._calendarsData),
            aCalculatedCalendars = [];
        //self._calendarsData = {};
        aData = aData == undefined ? self._data : aData;

        for (var nI = 0; nI < aData.length; nI++) {
            aEl = aData[nI];
            aTmpCalendars = [aEl.className]
                .concat(self._aCalendat2Group[aEl.className] != undefined 
                    ? self._aCalendat2Group[aEl.className] 
                    : []);
            for (var nJ = 0; nJ < aTmpCalendars.length; nJ++) {
                if (self._multi != null && self._multi.indexOf(aTmpCalendars[nJ]) >= 0) {
                    continue;
                }
                if (typeof(self._calendarsData[aTmpCalendars[nJ]]) == 'undefined'){
                    self._calendarsData[aTmpCalendars[nJ]] = [];
                }
                self._calendarsData[aTmpCalendars[nJ]].push(aEl);

            }
            if (self._periodType == 0) {
                dStart = dStart == undefined ? Date.baseDate(aEl.dayStart) : dStart.getMinDate(aEl.dayStart);
                dEnd = dEnd == undefined ? Date.baseDate(aEl.dayEnd) : dEnd.getMaxDate(aEl.dayEnd);
            }
        }
        aCalculatedCalendars = Array.objectKeys(self._calendarsData).diff(aPrevious);
        if (self._periodType == 0) { 
            if (dStart != undefined && dEnd != undefined) {
                self._period.min = dStart;
                self._period.max = dEnd;
            } else {
                self._period.min.setTime(self._parent.options.current.getTime());
                self._period.min.setDate(1);
                self._period.min.resetHours();
                
                self._period.max.setTime(self._period.min.getTime());
                self._period.max.changeMonth(3).changeDate(-1);
            }
            self._buildRightHead();
            
        } 
        jQuery.each(self._calendarsData, function(sKey, aList){
            if (self._calendarsGroupingValues[sKey] === '-1')  {
                return;
            }
            
            aList.sort(function(a, b){
                if (a.group == '' || a.group == undefined) {
                    return (b.group == undefined || b.group == '') 
                        ? (a.start < b.start ? -1 : (a.start > b.start ? 1 : 0)) 
                        : 1;
                } else if (b.group == undefined || b.group == '') {
                    return -1;
                } else {
                    var bResult = 
                        a.group < b.group 
                        ? -1
                        : (a.group > b.group 
                            ? 1 
                            : a.start < b.start ? -1 : (a.start > b.start ? 1 : 0)
                            );
                    return bResult;
                }
            });
        });
        return aCalculatedCalendars;
    }

/**
 * Build left part of Gantt
 *
 * @return {void}
 */

    self._buildDOM = function(){
        if (self._dom.form != undefined) {
            return;
        }
        self._dom.form = jQuery('<div class=gantt_form></div>');
        self._dom.calendars = jQuery('<div class=gantt_calendars></div>');
        self._dom.date = jQuery('<div class=gantt_dates></div>');
        
        self._dom.title = jQuery('<div class="title scroll_pos_b"></div>');
        self._dom.events = jQuery('<div class=events></div>');
        self._div
            .append(self._dom.form)
            .append(self._dom.calendars)
            .append(self._dom.date)
            .append('<div class=gantt_dates_bg></div>');
        
        self._dom.calendars
            .append(self._dom.title)
            .append(self._dom.events);
        self._buildForm();
        self._initEvents();
    }
    

/**
 * Build left list of events 
 * @param {Array} aCalendars - calendars to update
 * @return {void}
 */
    
    
    var aCalendarRender = function(sCalendarId) {
        if (aCalendarRender.prototype._prepareGroups == undefined) {
            
            aCalendarRender.prototype._prepareGroups = function() {
                var sGroupingFields = this.calendar.groupFieldName;
                if (self._calendarsGroupingValues[this.calendarId] != undefined 
                    && self._calendarsGroupingValues[this.calendarId] != ''
                    && self._calendarsGroupingValues[this.calendarId] != '-1'
                ) {
                    sGroupingFields = self._calendarsGroupingValues[this.calendarId];
                }
                if (sGroupingFields == undefined || sGroupingFields == null 
                    || sGroupingFields == '' ||  sGroupingFields == '-1'
                ) {
                    return null;
                }
                
                var aGroupFields = sGroupingFields.split(','),
                    aResult = [],
                    nLevel = 0;
            
                for (var nF = 0; nF < aGroupFields.length; nF++) {
                    if (aGroupFields[nF].trim() == '') {
                        continue;
                    }
                    
                    var sRealCal = this.calendar.calendarType == 'group' && this.calendar.calendarsList.length > 0
                        ? self._parent._calendars.getCalendar(this.calendar.calendarsList[0])
                        : this.calendar,
                        aGroupingField = self._parent._objects.getObjectFieldByName(
                            sRealCal.objectName, 
                            aGroupFields[nF]
                        );
                    if (aGroupingField == null || aGroupingField == undefined) {
                        continue;
                    }
                    aResult.push({
                        level : nLevel++,
                        field : aGroupingField,
                        name  : aGroupFields[nF],
                        isHTML : aGroupingField.isHTML === true
                    });
                }
                return aResult;
            }
            aCalendarRender.prototype.renderLeft = function(){
                if (this._bSum && this.aEls !== undefined) {
                    this._calculateSum();
                }
                var sHTML = "<div data-calendar='" + this.calendarId + "' class='" 
                        + (this.aGroups != null ? ' _groups_' + this.aGroups.length : '') 
                        + "'>"
                        + this._renderLeftCalendar()
                        + this._renderLeftTitles()
                        + '</div>';
                return sHTML;
            }
            
            aCalendarRender.prototype._renderLeftCalendar = function(){
                this._aOldGroups.length = 0;
                var oSumField = this._bSum 
                        ? self._parent._objects.getObjectFieldByName(this.calendar.objectName, this.calendar['settings']['sum_field'])
                        : null;
                return "<div class='title "
                            + (oSumField != null ? ' _has_sum ' : '')
                            + " color_" + this.calendarId 
                        + "' "
                        + "data-action='collapseCalendar'>" 
                        + this.calendar.name.htmlspecialchars() 
                        + (oSumField != null ? '<b class="_sum" title="' + oSumField.label.htmlspecialchars() + '">&sum;</b>' : '')
                        + '</div>';
                
            }
            
            aCalendarRender.prototype._renderLeftTitles = function(){
                if (this.aEls == undefined || this.aEls.length < 1) {
                    return '';
                }
                var aEl,
                    sHTML = '',
                    aGroupData,
                    bCollapse,
                    bOldCollapse,
                    bCollapseDefault = self._parent.getParam('ganttCollapseGroupingByDefault', false),
                    sGroupId,
                    sGroupValue,
                    sOldGroup = null;
                this._aOldGroups.length = this.aGroups != null ? this.aGroups.length : 0;
                for (var nI = 0; nI < this.aEls.length; nI++) {
                    
                    aEl = this.aEls[nI];
                    if (this.aGroups != null && this.aGroups.length && sOldGroup != aEl.group) {
                        bCollapse = bCollapseDefault;
                        aGroupData = aEl.group != undefined && aEl.group.trim() != '' ? aEl.group.split('|||') : null;
                        if (this.aGroups.length > 0) {
                            sGroupId = this.calendarId;
                            for (var nF = 0; nF < this.aGroups.length; nF++){
                                sGroupValue = (aGroupData != null && aGroupData[nF] != undefined ? aGroupData[nF] : 'null');
                                sGroupId += '_' + sGroupValue;
                                var aResult = this._getLeftGroup(this.aGroups[nF], sGroupId, sGroupValue, bCollapse);
                                if (aResult != null) {
                                    sHTML += aResult.html;
                                    bCollapse = aResult.collapse;
                                }
                            }
                        }
                    }
                    sHTML += this._getLeftElTitle(aEl, bCollapse);
                    sOldGroup = aEl.group;
                }
                return sHTML;
            }
            
            aCalendarRender.prototype._getLeftGroup = function(aG, sGroupId, sValue, bCollapse) {
                
                var sOldValue = this._aOldGroups[aG.level];
                if (self._aCollapsed[sGroupId] != undefined) {
                    bCollapse = self._aCollapsed[sGroupId];
                }
                //bCollapse = bCollapse || self._aCollapsed[sGroupId];
                if (sOldValue == sValue) {
                    return {
                        collapse : bCollapse,
                        html : ''
                    }
                }
                
                this._aOldGroups[aG.level] = sValue;
                if (this.aGroups != null && aG.level < this.aGroups.length - 1) {
                    this._aOldGroups.length = aG.level + 1;
                    this._aOldGroups.length = this.aGroups.length;
                }
                var sSum = this._bSum && this._aSum[sGroupId] != undefined 
                    ? self._parent._objects.formatCurrency(this._aSum[sGroupId]) 
                    : '',
                    nSumLength = sSum != '' ? parseInt(Math.min(sSum.length, 12) / 3) : 0;
//                if (this._bComma) {
//                    sSum = sSum.replace('.', ',');
//                }
                var sHTML = '<div data-action="collapseGroup" '
                    + ' data-group="' + sGroupId.htmlspecialchars() + '"'
                    + ' data-level="' + aG.level + '"'
                    + ' data-sum="' + (this._aSum[sGroupId] != undefined ? this._aSum[sGroupId] : 0) + '"'
                    + ' class="group_title ' 
                        + ' _level_' + aG.level
                        + (bCollapse ? ' _collapse' : '') 
                    + (sSum != '' ? ' _has_sum_' + nSumLength
                        : '')
                    + '" ' 
                    + 'title="' 
                        + (sValue == 'null' || sValue == '-1' || sValue == '' ? 'No Grouping' : sValue.htmlspecialchars()) 
                    + '">' 
                    + (sValue == 'null' || sValue == '-1' || sValue == ''
                        ? 'No Grouping' 
                        : (aG.isHTML ? sValue : sValue.htmlspecialchars())
                    )
                    + (this._bSum && this._aSum[sGroupId] != undefined 
                        ? '<b class="_sum">' + sSum + '</b>' 
                        : ''
                    )
                    + '</div>';
                return {
                    collapse : bCollapse,
                    html : sHTML
                }
            }
            
            aCalendarRender.prototype._getLeftElTitle = function(aEl, bCollapse) {
                var sSum = this._bSum && aEl.sum != null && aEl.sum != '' && aEl.sum != 'null' 
                    ? self._parent._objects.formatCurrency(
                        this._nSumScale == 0 
                            ? Math.round(convertCurrency(aEl.sum)) 
                            : parseFloat(convertCurrency(aEl.sum)).toFixed(this._nSumScale)
                        )
                    : '';
                var sHTML = '<div class="evt ' 
                            + (bCollapse ? ' _collapse' : '')
//                            + (bNonGroup ? ' _no_grouping' : "")
                        + (aEl.specColor != undefined && aEl.specColor.indexOf('_spec_reccuring') >= 0 ? ' _spec_reccuring ' : '')
                        + '" '
//                        + ' data-g="' + sGroup + '"'
                        + ' data-event="' + aEl.id  + '"'
                        + (this._bSum && aEl.sum != null && aEl.sum != '' && aEl.sum != 'null' ? 'data-sum="' + aEl.sum + '" ' : '')
                        + ' data-calendar="' + aEl.calendarid + '">' 
                        + (this.calendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                        + (sSum != ''
                            ? '<b class="_sum">' + 
                                    sSum 
                            + '</b>' 
                            : ''
                        )
                        + '</div>';
                return sHTML;
            }
            
            aCalendarRender.prototype.renderRight = function(nGridWidth){
                this._aOldGroups.length = 0;
                this._aHideUnvisible.length = 0;
                var sHTML = "<div data-calendar='" + this.calendarId + "' class='"
                        + (this.aGroups != null ? ' _groups_' + this.aGroups.length : '') 
                        + "' "
                        + "style='width:" + nGridWidth + "px;'>"
                    + '<div class="grouping">' + self._getCalendarGroupingSelector(this.calendarId) + '</div>'
                    + this._renderRightEvents()
                    + '</div>';
            
                if (this._aHideUnvisible.length > 0) {
                    self._dom.title.children('[data-calendar="' + this.calendarId + '"]')
                        .children('[data-event="' 
                        + this._aHideUnvisible.join('"],[data-event="')
                        + '"]').hide();
                }
                return sHTML;
            }
            
            aCalendarRender.prototype._renderRightEvents = function(){
                 if (this.aEls == undefined || this.aEls.length < 1) {
                    return '';
                }
                var aEl,
                    sHTML = '',
                    aGroupData,
                    bCollapse,
                    bCollapseDefault = self._parent.getParam('ganttCollapseGroupingByDefault', false),
                    sGroupId,
                    sGroupValue,
                    sOldGroup = null;
                this._aOldGroups.length = this.aGroups != null ? this.aGroups.length : 0;
                for (var nI = 0; nI < this.aEls.length; nI++) {
                    
                    aEl = this.aEls[nI];
                    if (this.aGroups != null && this.aGroups.length && sOldGroup != aEl.group) {
                        bCollapse = bCollapseDefault;
                        aGroupData = aEl.group != undefined && aEl.group.trim() != '' ? aEl.group.split('|||') : null;
                        if (this.aGroups.length > 0) {
                            sGroupId = this.calendarId;
                            for (var nF = 0; nF < this.aGroups.length; nF++){
                                sGroupValue = (aGroupData != null && aGroupData[nF] != undefined ? aGroupData[nF] : 'null');
                                sGroupId += '_' + sGroupValue;
                                var aResult = this._getRightGroup(this.aGroups[nF], sGroupId, sGroupValue, bCollapse);
                                if (aResult != null) {
                                    sHTML += aResult.html;
                                    bCollapse = aResult.collapse;
                                }
                            }
                        }
                    }
                    sHTML += this._getRightEl(aEl, bCollapse);
                    sOldGroup = aEl.group;
                }
                return sHTML;
            }
            
            aCalendarRender.prototype._getRightGroup = function(aG, sGroupId, sValue, bCollapse) {
                
                var sOldValue = this._aOldGroups[aG.level];
                if (self._aCollapsed[sGroupId] != undefined) {
                    bCollapse = self._aCollapsed[sGroupId];
                }
                if (sOldValue == sValue) {
                    return {
                        collapse : bCollapse,
                        html : ''
                    }
                }
                
                this._aOldGroups[aG.level] = sValue;
                if (this.aGroups != null && aG.level < this.aGroups.length - 1) {
                    this._aOldGroups.length = aG.level + 1;
                    this._aOldGroups.length = this.aGroups.length;
                }
                
                var sHTML = '<div class="group_empty_line _level_' + aG.level
                            + (bCollapse ? ' _collapse' : '') 
                            + '" '
                            + ' data-level="' + aG.level + '"'
                            + ' data-group="' + sGroupId.htmlspecialchars() + '"></div>';
                return {
                    collapse : bCollapse,
                    html : sHTML
                }
            }
            
            aCalendarRender.prototype._getRightEl = function(aEl, bCollapse) {
                var html = '',
                    sEventBarHTML = self._buildBar(
                        aEl, 
                        this._noMove, 
                        !(!this._noMove && this.calendar.editable === true && this.calendar.move === true)
                    );
                if (sEventBarHTML == '' && self._parent.params.ganttRespectHours && !self._parent.params.ganttShowUnvisible) {
                    this._aHideUnvisible.push(aEl.id);
                } else {
                    html += '<div class="' 
                        + (bCollapse ? ' _collapse' : '') 
                        + '">' + sEventBarHTML + '</div>';
                }
                return html;
            }
            
            aCalendarRender.prototype.checkCollapsedGroups = function(){
                var aCollapsedGroups = self._dom.events.find('.group_empty_line');
                
                aCollapsedGroups.each(function(nIdx, oGroup){
                    oGroup = jQuery(oGroup);
                    var nLevel = oGroup.data('level'),
                        aEvtEls = oGroup.nextUntil('.group_empty_line[data-level="' + nLevel + '"]');
                    if (aEvtEls.size() < 1) {
                        aEvtEls = oGroup.nextAll();
                    }
                    aEvtEls = aEvtEls.not('.group_empty_line');
                    self._renderCollapsedGroupEvent(oGroup, aEvtEls);
                });
            }
            
            aCalendarRender.prototype._calculateSum = function(){
                if (!this._bSum) {
                    return;
                }
                var sGr, aGroup, nJ;
                for (var nI = 0; nI < this.aEls.length; nI++) {
                    if (this.aEls[nI].sum == undefined || this.aEls[nI].sum == '' || this.aEls[nI].sum == 'null') {
                        continue;
                    }
                    aGroup = this.aGroups.length > 1 ? this.aEls[nI].group.split('|||') : [this.aEls[nI].group];
                    sGr = this.calendarId;
                    for (nJ = 0; nJ < aGroup.length; nJ++){
                        sGr += '_' + aGroup[nJ];
                        if (this._aSum[sGr] == undefined) {
                            this._aSum[sGr] = 0;
                        }
                        this._aSum[sGr] += parseFloat(convertCurrency(this.aEls[nI].sum));
                    }
                }
            }
            
            var convertCurrency = function(sVal) {
                if (self._parent.options.format['coma'] != undefined && self._parent.options.format['coma'] != '') {
                    sVal = sVal.replaceAll(self._parent.options.format['coma'], "");
                }
                if (self._parent.options.format['dot'] != undefined && self._parent.options.format['dot'] != '.') {
                    sVal = sVal.replaceAll(self._parent.options.format['dot'], ".");
                }
                return sVal;
            }
            
        }
        
        
        
        this.calendarId = sCalendarId;
        if (sCalendarId != undefined) {
            this.calendar = self._parent._calendars.getCalendar(this.calendarId);
            this.aEls = self._calendarsData[this.calendarId];
            this._aOldGroups = [];
            this.aGroups = this._prepareGroups();
            this._noMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false;
            this._aHideUnvisible = [];
            this._bSum = this.calendar.settings != undefined && this.calendar.settings['sum_field'] != undefined
                && this.calendar.settings['sum_field'] != ''
                && this.aGroups != undefined && this.aGroups.length > 0;
            this._aSum = {};
            this._bComma = self._parent.options.format['dot'] === ',';
            this._nSumScale = 0;
            if (this._bSum) {
                var aSumField = self._parent._objects.getObjectFieldByName(this.calendar.objectName, this.calendar.settings['sum_field']);
                if (aSumField != undefined && aSumField != null && aSumField.scale != undefined) {
                    this._nSumScale = aSumField.scale;
                }
            }
        }
        return this;
    }
    
    
    
    self._buildLeftBody = function(aCalculatedCalendars) {
        var sHtml = '';
        jQuery.each(self._calendars, function(nIdx, sCalendarId) {
            if (
                (aCalculatedCalendars != undefined && aCalculatedCalendars.indexOf(sCalendarId) < 0)
                || (self._multi != null && self._multi.indexOf(sCalendarId) >= 0)
            ) {
                return;
            }
            
            var oRender = new aCalendarRender(sCalendarId);
            sHtml += oRender.renderLeft();
            if (self._multi != null) {
                self._placeMulti(sHtml, sCalendarId, self._dom.title);
                sHtml = '';
            }
            return;
        });
        if (self._multi == null) {
            self._dom.title.html(sHtml);
        }
    }
    
    self._placeMulti = function(sHTML, sId, oDom) {
        if (oDom.children().size() == 0) {
            oDom.append(sHTML);
        }
        var oFind, oLast = null;
        for (var nI = 0; nI < self._calendars.length; nI++) {
            oFind = oDom.children('[data-calendar="' + self._calendars[nI] + '"]');
            if (oFind.size() > 0) {
                oLast = oFind;
            }
            if (self._calendars[nI] == sId) {
                if (oLast != null && oLast.data('calendar') == sId) {
                    oLast[0].outerHTML = sHTML;
                } else if (oLast != null && oLast.size() > 0) {
                    oLast.after(sHTML);
                } else {
                    oDom.prepend(sHTML);
                }
                return;
            }
        }
        
    }
    
/**
 * Build swicher between view mode
 *
 * @return {void}
 */
    
    self._buildForm = function (){
        var aTmpFotrmat = self._parent.getText('gantt_by_format'),
            aTmpPeriodKeys = ["0.1", "0.7", "1", "3", "6", "12", "36", "120", "0"],
            aTmpPeriod = self._parent.getText('gantt_by_period');
        
        var html = "<div class=CA_gantt_selectbox> "
            + "<select title='" + self._parent.getText('gantt_view_mode', 'View mode') + "'>"
        for (var nI = 0; nI < aTmpFotrmat.length; nI++) {
            html += "<option value=" + self._options.formatList[nI] + " "
                + (self._format == self._options.formatList[nI] ? 'selected' : "")
                + ">" + aTmpFotrmat[nI]
        }
        html += "</select></div>";
        
        self._typeSelector = jQuery(html).appendTo(self._dom.form);
        html = "<div class=CA_gantt_selectperiod> "
            + "<select title='" + self._parent.getText('gantt_period', 'Period') + "'>";
        for (nI = 0; nI < aTmpPeriodKeys.length; nI++) {
            html += "<option value=" + aTmpPeriodKeys[nI] + " " 
                + (self._periodType == aTmpPeriodKeys[nI] ? "selected" : "") 
                + ">" + aTmpPeriod[nI]
        }
        html += "</select></div>";
        self._periodSelector = jQuery(html).appendTo(self._dom.form);
        html = '<div class=_wide_event_names></div>';
        self._wideSelector = jQuery(html).appendTo(self._dom.form);
    }

/**
 * Build right head part  of Gantt
 *
 * @return {void}
 */

    self._buildRightHead = function(){
        
        self._dom.date.html('<table><thead><tr></tr></thead></tbody><tr></tr></tbody></table>');
        var funcName = "_buildRightHead" + self._format;
        if (typeof(self[funcName]) == 'function') {
            self[funcName]();
        }
//        self._dom.date.scrollLeft(0);
    }

/**
 * Build right head for Week mode
 *
 * @return {void}
 */

    self._buildRightHeadweek = function (){

        var head = self._dom.date.find('thead > tr'),
            subHead = self._dom.date.find('tbody > tr'),

            dFrom = Date.baseDate(self._period.min),
            dTo = new Date(self._period.max);
        dFrom.setDate(dFrom.getDate() - dFrom.getDay() + 1);
        dTo.setDate(dTo.getDate() + (6 - dTo.getDay()));
        var nStartYear = dFrom.getFullYear(),
            nStopYear = dFrom.getFullYear(),
            html = "",
            dCur = new Date(dFrom);
        
        var maxWidth = self._div.width() - 210,
            nCells = parseInt(maxWidth / 30),
            nWeeks = parseInt((dTo.getDaysFrom(dFrom) / 7 ));
        
        if (nWeeks < nCells) {
            dTo.setDate(dTo.getDate() + (nCells - nWeeks - 1) * 7);
        }
        self._period.visualMin.setDay(dFrom);
        self._period.visualMax.setDay(dTo);

        for (var dMonth = Date.baseDate(self._period.min); dMonth <= dTo; dMonth.changeMonth(1)) {
            var nColspan = (dCur < self._period.min && dMonth.isSameMonth(self._period.min) 
                    ? 1 + dMonth.getMonthWeeks() 
                    : dMonth.getMonthWeeks()
                );
            html += "<TH colspan=" + nColspan + ">" 
                + dMonth.format(self._parent.options.format.shortMonthTitle) 
                +  "<span></span></TH>";
        }
        head.append(jQuery(html));
        html = "";
        var nWeek = self._parent.options.today.getWOY(),
            nYear = self._parent.options.today.getYear(),
            sClassName = '',
            dToCheck = new Date(self._period.max);
        for(dCur = new Date(dFrom); dCur <= dTo; dCur.changeDate(7)) {
            sClassName = (dCur.getYear() == nYear && dCur.getWOY() == nWeek ? 'current'  : '')
                + (dCur > dToCheck ? ' grey' : '');
            
            html += "<TD "
                + "title='" + dCur.getWOY() + "' " 
                + 'data-d="' + (dCur.getTime() / 1000) + '" '
                + ' class="' + sClassName + '" '
                + ">" + dCur.format(self._parent.options.format.dateTitle)
                + "</TD>";
        }
        html += '<td class=scroll_width></td>';
        subHead.append(jQuery(html));
        
        
    }

/**
 * Build right head for day mode
 *
 * @return {void}
 */


    self._buildRightHeadday = function(){
        var head = self._dom.date.find('thead > tr');
        var subHead = self._dom.date.find('tbody > tr');
        var dFrom = new Date(self._period.min);
        var dTo = new Date(self._period.max);
        var dCur = new Date(dFrom);
        var html = "", sClassName = '';
        
        var maxWidth = self._div.width() - 210;
        var nCells = parseInt(maxWidth / 20);
        var nDays = parseInt((dTo.getDaysFrom(dFrom)));
        
        if (nDays < nCells) {
            dTo.setDate(dTo.getDate() + (nCells - nDays ));
        }
        self._period.visualMin.setDay(dFrom);
        self._period.visualMax.setDay(dTo);
        
        
        for (dCur.setDate(1); dCur.getTime() <= dTo.getTime(); dCur.setMonth(dCur.getMonth() + 1)) {
            
            var colspan = (dCur.isCurrentMonth(dFrom)) 
                ? dCur.getMonthDays() - dFrom.getDate() + 1
                : (dCur.isCurrentMonth(dTo)
                    ? dTo.getDate() + 1
                    : dCur.getMonthDays());
            html += "<TH colspan=" + colspan + ">" + dCur.getMonthName() + " " + dCur.getFullYear() + "<span></span></TH>";
        }
        
        head.html(html);
        html = "";
        var dToCheck = new Date(self._period.max);
        for (dCur = new Date(dFrom); dCur <= dTo; dCur.changeDate(1)) {
            sClassName = dCur.getDay() == 6 || dCur.getDay() == 0 ? "holiday" : "";
            sClassName = (dCur.getTime() == self._parent.options.today.getTime() ? 'current' : sClassName)
                + (dCur > dToCheck ? ' grey' : '');

            html += "<TD "
                + 'data-d="' + (dCur.getTime() / 1000) + '" '
                + (sClassName != '' ? " class='" + sClassName + "' " : "")
                + ">" 
                + (dCur.getDate()) + "</TD>";
        }
        html += '<td class=scroll_width></td>';
        subHead.html(html);
    }
    
/**
 * Build right head for month mode
 *
 * @return {void}
 */


    self._buildRightHeadmonth = function(){
        var head = self._dom.date.find('thead > tr');
        var subHead = self._dom.date.find('tbody > tr');
        var dFrom = new Date(self._period.min.getTime());
        dFrom.setDate(1);
        var dTo = new Date(self._period.max.getTime());
        var dCur = new Date(dFrom);
        var html = "", sClassName;


        var maxWidth = self._div.width() - 210;
        var nCells = parseInt(maxWidth / 63);
        var nQuarters = parseInt((dTo.getMonthFrom(dFrom, true)));
        if (nQuarters < nCells) {
            dTo.setMonth(dTo.getMonth() + (nCells - nQuarters ));
        }
        self._period.visualMin.setDay(dFrom);
        self._period.visualMax.setDay(dTo);


        for (dCur.setDate(1), dCur.setMonth(1); dCur <= dTo; dCur.setFullYear(dCur.getFullYear() + 1)) {
            var colspan = (dCur.isCurrentYear(dFrom)) 
                ? 12 - dFrom.getMonth()
                : (dCur.isCurrentYear(dTo)
                    ? dTo.getMonth() + 2
                    : 12);
            html += "<TH colspan='" + colspan + "'>" + dCur.getFullYear() + "<span></span></TH>";
        }
        head.html(html);
        
        html = "";
        var dToCheck = new Date(self._period.max.getTime());
        for (dCur = dFrom; dCur <= dTo; dCur.setMonth(dCur.getMonth() + 1)) {
            sClassName = (dCur.isSameMonth(self._parent.options.today) ? 'current' : '');
                + (dCur > dToCheck ? ' grey' : '');
            html += "<TD " 
                + 'data-d="' + (dCur.getTime() / 1000) + '" '
                + "class='" + sClassName + "'>" + (dCur.getMonthName()) + "</TD>";
        }
        html += '<td class=scroll_width></td>';
        subHead.html(html);
    }

/**
 * Build right head for quarter mode
 *
 * @return {void}
 */


    self._buildRightHeadquarter = function(){
        var head = self._dom.date.find('thead > tr');
        var subHead = self._dom.date.find('tbody > tr');
        var dFrom = new Date(self._period.min.getTime());
        dFrom.setMonth(dFrom.getMonth() - dFrom.getMonth() % 3);
        dFrom.setDate(1);
        var dTo = new Date(self._period.max.getTime());
        var dCur = new Date(dFrom);
        var html = "",
            sClassName = '';

        var maxWidth = self._div.width() - 210;
        var nCells = parseInt(maxWidth / 100);
        var nQuarters = parseInt((dTo.getMonthFrom(dFrom, true) / 3 ));
        if (nQuarters < nCells) {
            dTo.setMonth(dTo.getMonth() + (nCells - nQuarters ) * 3 + 1);
        }
        self._period.visualMin.setDay(dFrom);
        self._period.visualMax.setDay(dTo);
        for (dCur.setDate(1), dCur.setMonth(1); dCur <= dTo; dCur.setFullYear(dCur.getFullYear() + 1)) {
            var colspan = (dCur.isCurrentYear(dFrom)) 
                ? 4 - parseInt(dFrom.getMonth() / 3)
                : (dCur.isCurrentYear(dTo)
                    ? parseInt((dTo.getMonth() + 2) / 3)
                    : 4);
            html += "<TH colspan=" + colspan + ">" + dCur.getFullYear() + "<span></span></TH>";
        }
        head.html(html);
        html = "";
        var dToCheck = new Date(self._period.max.getTime());
        for (dCur.setDay(dFrom); dCur <= dTo; dCur.setMonth(dCur.getMonth() + 3)) {
            sClassName = dCur > dToCheck ? ' grey' : '';
            html += "<TD " 
                    + 'data-d="' + (dCur.getTime() / 1000) + '" '
                    + ' class="' + sClassName + '" '
                    + ">Q`" + parseInt(1 + (dCur.getMonth() / 3)) + "</TD>";
        }
        html += '<td class=scroll_width></td>';
        subHead.html(html);   
    }
    
    self._buildRightHeadhour = function(){
        var head = self._dom.date.find('thead > tr'),
            subHead = self._dom.date.find('tbody > tr'),
            dFrom = new Date(self._period.min),
            dTo = new Date(self._period.max),
            dCur = new Date(dFrom),
            html = "", 
            sClassName = '',
            bNonWorking = self._parent.params.ganttRespectHours && self._parent.params.nonWorkingHoursDisplay == 'paint',
            sHourFormat = self._parent.options.format.hourTitle.replace('a', '').replace('aa', '')
                .replace('(:ii)', '').replace(':ii', ''),
            colspan = !self._parent.params.ganttRespectHours
                ? 24
                : (24 
                    - (self._parent.aCalculated.startHour != undefined 
                        && self._parent.aCalculated.startHour > 0 
                        ? self._parent.aCalculated.startHour 
                        : 0
                    )
                    - (self._parent.aCalculated.stopHour != undefined 
                        && self._parent.aCalculated.stopHour > 0 
                        ? 24 - self._parent.aCalculated.stopHour 
                        : 0
                    )
                )
            ;
            
            
        self._period.visualMin.setDay(dFrom);
        self._period.visualMax.setDay(dTo);
        if (self._parent.params.ganttRespectHours && self._parent.aCalculated.stopHour > 0) {
            self._period.visualMax.setHours(self._parent.aCalculated.stopHour);
        }
        if (self._periodType == '0.1') {
            self._period.visualMax.changeDate(7);
        } 
        
        for (dCur.setHours(0); dCur.getTime() <= self._period.visualMax.getTime(); dCur.changeDate(1)) {
            html += "<TH colspan=" + colspan + ">" + dCur.format('eee mmm d, yyyy') + "<span></span></TH>";
        }
        
        head.html(html);
        html = "";
//        dTo.changeDate(1);
        var dNowHour = Date.baseDate().getHours(),
            dCurHours;
        var dToCheck = new Date(self._period.max.changeDate(1));
        for (dCur = new Date(dFrom); dCur <= self._period.visualMax; dCur = dCur.changeHour(1)) {
            dCurHours = dCur.getHours();
            if (self._parent.params.ganttRespectHours && self._parent.aCalculated.startHour > 0 && dCurHours < self._parent.aCalculated.startHour) {
                dCur.setHours(self._parent.aCalculated.startHour);
            }
            if (self._parent.params.ganttRespectHours && self._parent.aCalculated.stopHour > 0 && dCurHours >= self._parent.aCalculated.stopHour) {
                dCur.setHours(24);
                continue;
            }
            sClassName = bNonWorking && (dCurHours < self._parent.params.startHourPeriod 
                    || dCurHours >= self._parent.params.stopHourPeriod )
                ? "nonworking" 
                : "";
            sClassName = dCur.isSameDay(self._parent.options.today) 
                &&  dNowHour == dCurHours
                ? 'current' 
                : sClassName;
            sClassName += dCur > dToCheck ? ' grey' : '';    
            
            html += "<TD "
                + 'data-d="' + (dCur.getTime() / 1000) + '" '
                + ' class="' + sClassName + '"'
                + ">" 
                + (dCur.format(sHourFormat)) + "</TD>";
        }
        html += '<td class=scroll_width></td>';
        subHead.html(html);
    }

/**
 * Build grid on right part
 *
 * @return {void}
 */


    self._buildRightGrid = function(){
        var tr = self._rightHead.children('THEAD').children('TR:first');
        var html = "";
        var oldWidth = 0;
        tr.children().each(function(){
            var el = jQuery(this);
            var pos = el.position();
            var width = el.width() + 22;
            oldWidth += width;
            html += "<div class=grid style='left: " + (oldWidth) + "px; '></div>";
            
        });
        self._right.children('div').append(jQuery(html));
    }
    
 /**
 * Put events bars on grid
 *
 * @return {void}
 */


    self._buildRightBody = function(aCalculatedCalendars) {
        var html = "", aEls, sOldGroup, sGroup, aOldGroup, aGroup,
            nGridWidth = self._dom.date.children('table').width() - self._parent.options.scrollWidth,
            sEventBarHTML = '',
            aHideUnvisible = [],
            bCollapseDefault = self._parent.getParam('ganttCollapseGroupingByDefault', false),
            aGroupEmptyLines = [],
            bCurCollapsed = false,
            bCurCollapsedSub = false,
            bNonGroup,
            sGroupID;
        jQuery.each(self._calendars, function(nIdx, sCalendarId) {
            aHideUnvisible = [];
            if (
                (aCalculatedCalendars != undefined && aCalculatedCalendars.indexOf(sCalendarId) < 0)
                || 
                (self._multi != null && self._multi.indexOf(sCalendarId) >= 0)
            ) {
                return;
            }
            
            var oRender = new aCalendarRender(sCalendarId);
            html += oRender.renderRight(nGridWidth);
            

            if (self._multi != null) {
                self._placeMulti(html, sCalendarId, self._dom.events);
                html = '';
                if (aCalculatedCalendars != undefined && aCalculatedCalendars.indexOf(sCalendarId) >= 0) {
                    self._multi.push(sCalendarId);
                }
            }
            
            return;
            
            
            
//            bCurCollapsed = false;
//            bCurCollapsedSub = false,
//            bNonGroup = false;
//            if (self._multi != null
//                && aCalculatedCalendars != undefined && aCalculatedCalendars.indexOf(sCalendarId) >= 0
//            ) {
//                self._multi.push(sCalendarId);
//            }
//            var bGroupingMode = (typeof(self._calendarsGroupingValues[sCalendarId]) == 'undefined' 
//                || self._calendarsGroupingValues[sCalendarId] != '-1'
//                ),
//                bNoMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false ,
//                aCalendar = !bNoMove ? self._parent._calendars.getCalendar(sCalendarId) : null;
//            sOldGroup = '';
//            aEls = self._calendarsData[sCalendarId];
//            html += "<div data-calendar='" + sCalendarId + "' class='' style='width:" + nGridWidth + "px;'>"
//                + '<div class="grouping">' + self._getCalendarGroupingSelector(sCalendarId) + '</div>';
//            if (aEls != undefined) {
//                aOldGroup = [null, null];
//                for (var nI = 0; nI < aEls.length; nI++) {
//                    var aEl = aEls[nI];
//                    sGroup = aEl.group == undefined  ? '' : aEl.group;
//                    aGroup = sGroup.split('|||');
//                    
//                    if (bGroupingMode && aOldGroup[0] != aGroup[0] && aGroup[0] != '') {
//                        sGroupID = sCalendarId + '_' + aGroup[0];
//                        bCurCollapsed = self._aCollapsed[sGroupID] != undefined
//                            ? self._aCollapsed[sGroupID]
//                            : bCollapseDefault;
//                        html += '<div class="group_empty_line' + (bCurCollapsed ? ' _collapse_group' : '') + '" '
//                            + ' data-group="' + sGroupID.htmlspecialchars() + '"></div>';
//                        aGroupEmptyLines.push(sCalendarId + '_' + aGroup[0].htmlspecialchars());
//                        aOldGroup[1] = null;
//                    } else if(bGroupingMode && aOldGroup[0] != aGroup[0] && aGroup[0] == '') {
//                        bCurCollapsed = false;
//                        bNonGroup = true;
//                        aOldGroup[1] = null;
//                    }
//                    
//                    if (bGroupingMode && aOldGroup != undefined && aOldGroup[1] != aGroup[1] && aGroup[1] != '') {
//                        sGroupID = sCalendarId + '_' + aGroup[0] + '_' + aGroup[1];
//                        bCurCollapsedSub = bCurCollapsed || (self._aCollapsed[sGroupID] != undefined
//                            ? self._aCollapsed[sGroupID]
//                            : bCurCollapsed);
//                        html += '<div class="group_empty_line_sub '
//                            + (bCurCollapsedSub ? ' _collapse' : '')
//                            + ' " '
//                            + 'data-group="' + sGroupID.htmlspecialchars() + '"></div>'
//                    } else if (bNonGroup && aGroup[1] == '') {
//                        bCurCollapsedSub = false;
//                    }
//                    aOldGroup = aGroup;
//                    sEventBarHTML = self._buildBar(aEls[nI], bNoMove, !(!bNoMove && aCalendar.editable === true && aCalendar.move === true));
//                    if (sEventBarHTML == '' && self._parent.params.ganttRespectHours && !self._parent.params.ganttShowUnvisible) {
//                        aHideUnvisible.push(aEl.id);
//                    } else {
//                        html += '<div class="' 
//                            + (bCurCollapsed || bCurCollapsedSub ? ' _collapse' : '') 
//                            + (bNonGroup ? ' _no_grouping' : "")
//                            + '">' + sEventBarHTML + '</div>';
//                    }
//                }
//            }
//            html += "</div>";
//            if (self._multi != null) {
//                self._placeMulti(html, sCalendarId, self._dom.events);
//                html = '';
//            }
//            if (aHideUnvisible.length > 0) {
//                self._dom.title.children('[data-calendar="' + sCalendarId + '"]')
//                    .children('[data-event="' 
//                    + aHideUnvisible.join('"],[data-event="')
//                    + '"]').hide();
//            }
        });
        if (self._multi == null) {
            self._dom.events.html(html);
            
//                self._dom.title.scrollTop(self._dom.events.scrollTop());
//        } else {
//            self._dom.events.append(html);
        }
        if (self._scrollToday) {
            var dCheckDate = self._getBaseFormatDate(self._parent.options.current),
                oDom = nLeftPos = self._dom.date.find('tbody td[data-d="' + (dCheckDate.getTime() / 1000) + '"]');
            if (oDom.size() > 0) {
                var nLeftPos = oDom.position().left + self._dom.date[0].scrollLeft;
                self._dom.events.scrollLeft(nLeftPos);
                self._dom.date.scrollLeft(nLeftPos);
            } else {
                self._dom.date.scrollLeft(self._dom.events.scrollLeft());
            }
            self._scrollToday = false;
        } else {
            self._dom.date.scrollLeft(self._dom.events.scrollLeft());
        }
        self._dom.events.children('div').width(self._dom.events[0].scrollWidth);
        var oRender = new aCalendarRender();
        oRender.checkCollapsedGroups();
//        if (aGroupEmptyLines.length > 0) {
//            var oEvtGroup, aEvtEls;
//            for (i in aGroupEmptyLines) {
//                oEvtGroup = self._dom.events.find('.group_empty_line[data-group="' + aGroupEmptyLines[i] + '"]'),
//                aEvtEls = oEvtGroup.nextUntil('.group_empty_line, ._no_grouping');
//                self._renderCollapsedGroupEvent(oEvtGroup, aEvtEls);
//            }
//        }
    }
    

 /**
 * Put events bars on grid
 *
 * @param {JSON} el - current event
 * @return {String} generated DIV 
 */

    self._buildBar = function(el, bNoMove, bNoCalendarMove, aDates) {
        if (typeof(el.dateStart) == 'undefined' || el.dateStart == '0') {
            return "";
        }
        var pos = self._getBarPos(el, aDates),
            dVisualMin = aDates == undefined ?  self._period.visualMin : aDates.min,
            dVisualMax = aDates == undefined ?  self._period.visualMax : aDates.max
        if (pos.x < 0) {
            return '';
        }
        var scale = self._options.mode[self._format].scale,
            nWidth = parseInt(1 + pos.width * scale),
            html = "<div class='evt "
            + (el.dateStart < dVisualMin || pos.no_l === true ? "full_l " : "")
            + (el.dateEnd > dVisualMax || pos.no_r === true ? "full_r " : "")
            + (bNoCalendarMove ? "non_e " : "")
            + (((el.noEnd != undefined && el.noEnd) || nWidth < 15) ? "non_r " : "")
            + (bNoMove ? ' non_e  non_r ' : '')
            + "' "
            + ' data-event="' + el.id + '" '
            + ' data-calendar="' + el.calendarid + '" '
            + ' data-start="' + ( el.dateStart.valueOf() / 1000 ) + '"'
            + ' data-end="' + ( el.dateEnd.valueOf() / 1000 ) + '"'
            + "style='"
            + "margin-left:" + parseInt(pos.x * scale) + "px;"
            + "width:" + nWidth + "px;"
            + "' "
            + " title='" + el.getTitle().htmlspecialchars() + "'  "
            + ">"
            + '<span class="'
                + 'color_' + el.className 
                + (el.specColor != undefined && el.specColor != '' ? ' ' + self._parent._events.getEventColor(el.specColor) : '')
            + '">'
            + '<span class=l></span>'
            + '<span class=r></span>'
            + '</span>'
            + '';
        html += "</div>";
        return html;    
    }

 /**
 * Calculate position of bar
 *
 * @param {JSON} el - current event
 * @return {JSON} start X position and width of bar
 */

    self._getBarPos = function(el, aDates) {
        var nFrom, nTo, nWidth, dStart, dEnd, 
            aResult = {x : 0, width : 0},
            dVisualMin = aDates == undefined ?  self._period.visualMin : aDates.min,
            dVisualMax = aDates == undefined ?  self._period.visualMax : aDates.max;

        dStart = Date.getMaxDate(
            self._format != 'hour' || el.allDay ? el.dayStart : el.dateStart, 
            dVisualMin
        );
//        if (el.allDay) {
//            dStart.setHours(self._parent.aCalculated.startHour);
//        }
        dEnd = Date.getMinDate(
            self._format != 'hour' && el.dayEnd != undefined 
                ? el.dayEnd 
                : (el.allDay 
                    ? Date.baseDate(el.dayEnd, 0, self._parent.aCalculated.stopHour)
                    : el.dateEnd
                ), 
            dVisualMax);
        if (dVisualMin > dEnd || dVisualMax < dStart) {
            aResult.x = -1; 
            return aResult;
        }
        switch (self._format) {
            case "hour" :
                if (self._parent.params.ganttRespectHours 
                    && dEnd.isSameDay(dStart) && (
                    self._parent.aCalculated.startHour > dStart.getHours() 
                    && self._parent.aCalculated.startHour > dEnd.getHours() 
                    ||
                    self._parent.aCalculated.stopHour <= dStart.getHours() 
                    && self._parent.aCalculated.stopHour <= dEnd.getHours() 
                    )
                ) {
                    return {x : -1, width : -1};
                }
                if (self._parent.params.ganttRespectHours) {
                    if (self._parent.aCalculated.startHour > dStart.getHours() ) {
                        aResult.no_l = true;
                        dStart.setHours(self._parent.aCalculated.startHour, 0, 0);
                    } else if (self._parent.aCalculated.stopHour <= dStart.getHours() ) {
                        aResult.no_l = true;
                        dStart.changeDate(1).setHours(self._parent.aCalculated.startHour, 0, 0);
                    }
                    if (self._parent.aCalculated.stopHour <= dEnd.getHours()) {
                        aResult.no_r = true;
                        dEnd.setHours(self._parent.aCalculated.stopHour, 0, 0);
                    } else if (self._parent.aCalculated.startHour > dEnd.getHours()) {
                        aResult.no_r = true;
                        dEnd.changeDate(-1).setHours(self._parent.aCalculated.stopHour, 0, 0);
                    }
                }
                nFrom = Math.floor(dStart.getHoursFrom(dVisualMin, true)) 
                    - (self._parent.params.ganttRespectHours ? self._parent.aCalculated.startHour : 0);
                nTo = Math.ceil(dEnd.getHoursFrom(dVisualMin, true)) 
                    - (self._parent.params.ganttRespectHours ? self._parent.aCalculated.startHour : 0);
                nFrom -= self._offDayHours * dStart.getDaysFrom(dVisualMin, false);
                nTo -= self._offDayHours * dEnd.getDaysFrom(dVisualMin, false);
                nWidth = nTo - nFrom + (nFrom >= nTo ? 1 : 0);
                break;
            case "day" :
                nFrom = dStart.getDaysFrom(dVisualMin, false) ;
                nTo = dEnd.getDaysFrom(dVisualMin, false)
                nWidth = nTo - nFrom + 1;
                break;
            case "week" :
                nFrom = dStart.getWeekFrom(dVisualMin, true) ;
                nTo = dEnd.getWeekFrom(dVisualMin, true)
                nWidth = nTo - nFrom;
                break;
            case "month" :
                nFrom = dStart.getMonthFrom(dVisualMin, true, true) ;
                nTo = dEnd.getMonthFrom(dVisualMin, true, true)
                nWidth = nTo - nFrom;
                break;
            case "quarter" :
                var dQuarterStart = self._period.min.getQuarterStart();
                nFrom = dStart.getMonthFrom(dQuarterStart, true, true) / 3;
                nTo = dEnd.getMonthFrom(dQuarterStart, true, true) / 3;
                nWidth = nTo - nFrom;
                break;
        }
        aResult.x = nFrom;
        aResult.width = nWidth;
        return aResult;
    }

    self._getCommonGroupingField = function(aCalendar) {
        if (aCalendar.calendarsList != undefined) {
            var sCurGroupFieldName,
                nLength,
                oObjectNames = {};
            for(var i=0; i < aCalendar.calendarsList.length; i++) {
                sCurGroupFieldName = self._parent._calendars.getCalendar(aCalendar.calendarsList[i]).groupFieldName;
                oObjectNames[sCurGroupFieldName] = sCurGroupFieldName;
            }
            nLength = Object.keys(oObjectNames).length;
            if (nLength == 1) 
                return Object.keys(oObjectNames)[0];
        }
        return '';
    }

    self._getObjectNameIfCalendarGroupMembersHaveOneObject = function(aCalendar) {
        if (aCalendar.calendarsList != undefined) {
            var sCurObjectName,
                nLength,
                oObjectNames = {};
            for(var i=0; i < aCalendar.calendarsList.length; i++) {
                var oCal = self._parent._calendars.getCalendar(aCalendar.calendarsList[i]);
                if (oCal != undefined) {
                    sCurObjectName = oCal.objectName;
                    oObjectNames[sCurObjectName] = sCurObjectName;
                }
            }
            nLength = Object.keys(oObjectNames).length;
            if (nLength == 1) {
                return Object.keys(oObjectNames)[0];
            }
        }
        return '';
    }

    self._getCalendarGroupingSelector = function(sCalendarId) {
        var sGroupingMain = '', 
            sGroupingSub = '',
            sGrouping = self._calendarsGroupingValues[sCalendarId];
        if (sGrouping != undefined) {
            var aGroupingValues = sGrouping.split(',');
            sGroupingMain = aGroupingValues[0];
            sGroupingSub = aGroupingValues[1];
        }
        
        var sResult = self._getCalendarGroupingSelector2(sCalendarId, 'main', sGroupingMain)
                + self._getCalendarGroupingSelector2(sCalendarId, 'sub', sGroupingSub);
        return sResult;
    }
    
    self._getCalendarGroupingSelector2 = function(sCalendarId, sHtmlId, sGroupingSelected) {
        var sObject = self._parent._calendars.getCalendar(sCalendarId).objectName,
            aCalendar = self._parent._calendars.getCalendar(sCalendarId),
            sObjectGroup = self._getObjectNameIfCalendarGroupMembersHaveOneObject(aCalendar);
        if (sObjectGroup != '') {
            sObject = sObjectGroup;
        }
        if (typeof(self._calendarsGroupingFields[sObject]) == 'undefined') {
            return '';
        }
        
        var sSelected = self._calendarsGroupingValues[sCalendarId] != undefined 
                ? self._calendarsGroupingValues[sCalendarId]
                : ( aCalendar.groupFieldName != undefined ? aCalendar.groupFieldName : '');
                
        var sObjectGrouping = self._getCommonGroupingField(aCalendar);
        if (sObjectGrouping != '') { 
            sSelected = sObjectGrouping; 
        }
        if (sGroupingSelected == '') {
            if (sHtmlId == 'sub') { 
                sSelected = '-1'; 
            }
        } else {
            sSelected = sGroupingSelected;
        }
                
        var sHTML = '<select id="' + sHtmlId + '">'
                + '<option value="-1" ' + (sSelected == "-1" ? 'selected' : '' ) + '>'
                + self._parent.getText('gantt_no_grouping', 'No Grouping')
                + '</opiton>',
            aFields = self._calendarsGroupingFields[sObject],
            aSelectedGroupingFields = self._parent._objects.getSpecialSettings('groupingObjects', null),
            bSelectedPresent = true;
        if (aSelectedGroupingFields != null && typeof(aSelectedGroupingFields) == 'string') {
            aSelectedGroupingFields = JSON.parse(aSelectedGroupingFields);
        }
        if (aSelectedGroupingFields != null 
                && aSelectedGroupingFields[sObject] != undefined 
                && aSelectedGroupingFields[sObject] != ''
        ) {
            var aSelectedFields = aSelectedGroupingFields[sObject].split(',');
            
            if (sSelected != undefined && sSelected != '' && aSelectedFields.indexOf(sSelected) == -1) {
                aSelectedFields.unshift(sSelected);
                bSelectedPresent = false;
                
            }
            for (var nI = 0; nI < aSelectedFields.length; nI++) {
                var aField = self._parent._objects.getObjectFieldByName(sObject, aSelectedFields[nI]);
                if (aField == null || aField.isAccessible === false) {
                    continue;
                }
                sHTML += '<option value="' + aSelectedFields[nI]  + '" '
                    + ' class="'
                    + (aField['type'] == 'REFERENCE' ? ' _ref ' : '')
                    + (aSelectedFields[nI].indexOf('.') >= 0 ? ' _sub_ref ' : '')
                    + (aSelectedFields[nI] == sSelected && !bSelectedPresent ? ' _out_selected' : '')
                    + '" '
                    + (aSelectedFields[nI] == sSelected ? 'selected' : '')
                    + '>'
                    + (aSelectedFields[nI].indexOf('.') >= 0 ? '&nbsp;&nbsp;' : '')
                    + aField.label.htmlspecialchars()
                    + '</option>';
            }
            return sHTML + '</select>';
        }
        if (!jQuery.isArray(aFields)) {
            aFields = Array.objectValues(aFields);
        }
//        aFields = self._parent._objects.filterGrouping(sObject, aFields);
        aFields.quickSort('label');
        
        for (var nI = 0; nI < aFields.length; nI++){
            if (aFields[nI].isAccessible === false) {
                continue;
            }
            sHTML += '<option value="' + aFields[nI].name  + '" '
                + (aFields[nI]['type'] == 'REFERENCE' ? ' class="_ref" ' : '')
                + (aFields[nI].name == sSelected ? 'selected' : '')
                + '>'
                + aFields[nI].label.htmlspecialchars()
                + '</option>';
                if (aFields[nI]['type'] == 'REFERENCE') {
                    var aRefFields = self._parent._objects.getLinkedObjectsFields(
                        aFields[nI], 
                        ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX'], 
                        true, 
                        sObject
                    );
//                    aRefFields = self._parent._objects.filterGrouping(sObject, aRefFields);
                    for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                        if (aRefFields[nJ].isAccessible === false) {
                            continue;
                        }
                        sHTML += '<option value="' + aFields[nI].name + '.' + aRefFields[nJ]['name'] + '" '
                            + 'class="_sub_ref" '
                            + (aFields[nI].name + '.' + aRefFields[nJ].name == sSelected ? 'selected' : '')
                            + '>&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
                    }
                }        
        }
        sHTML += '</select>';
        return sHTML;
        
    }
    
    
    self._getPosition = function(evt) {
        var dt = new Date(),
            el = jQuery(evt.target),
            aCalculated = (self._cacheCoords == undefined || dt.getTime() - 500 > self._cacheCoords.dt) 
                ? self._cacheCoords = self._getCalculatedOffset(dt)
                : self._cacheCoords,
            nDay = parseInt(
                    (evt.clientX - aCalculated.aOffset.left + self._dom.events.scrollLeft()) / 
                    aCalculated.nCellWidth
                ) / (self._format == 'hour' 
                    ? (60 / parseInt(self._parent.params.minMinutePeriod))
                    : 1
                ),
            bIsRight = aCalculated.nWidth - (evt.clientX - aCalculated.aOffset.left) < 50 ,
            bIsLeft = evt.clientX - aCalculated.aOffset.left < 50;
            
        return {"day"       : nDay, "isright" : bIsRight, "isleft" : bIsLeft}
    }
        
    self._getCalculatedOffset = function(dt) {
        return {
            nCellWidth : self._options.mode[self._format].oneday,
            aOffset : self._dom.events.offset(),
            nWidth  : self._dom.events.width(),
            dt      : dt.getTime()
        }            
    }

    
    self._initDragEvent = function() {
        var nScrollTimer    = null, 
            nOldDirection   = 0;
        var _clearCreatingEvent = function(){
            view.showData();
        }
        
        
        var _scrollSides = function(nDirection) {
            nOldDirection = nDirection;
            if (nDirection == 0 && nScrollTimer != null) {
                clearTimeout(nScrollTimer);
                nScrollTimer = null;
                return;
            }
            var nOldPos = self._dom.events.scrollLeft();
            self._dom.events.scrollLeft(nOldPos + nDirection * 20);
            if (nOldPos != self._dom.events.scrollLeft()) {
                nScrollTimer = setTimeout(function(){
                    _scrollSides(nDirection);
                }, 50);
            } else {
                nScrollTimer = null;
            }
        }
        
        var _isCellChange = function(el, evt) {
            var aOld = {"day" : el.data('currentDay')},
                aNew = self._getPosition(evt);
            if (aNew.isright) {
                if (nOldDirection != 1) {
                    el.data('bar').addClass('_to_right');
                    _scrollSides(1);
                }
            } else if (aNew.isleft) {
                if (nOldDirection != -1) {
                    el.data('bar').removeClass('_to_right');
                    _scrollSides(-1);
                }
            } else if (nScrollTimer != null) {
                el.data('bar').removeClass('_to_right');
                _scrollSides(0);
            }
            el.data({currentDay : aNew.day});
            return (aOld.day != aNew.day);
        }
        
        var correctHourChange = function(nCurrent, nBase) {
            var nWorkingHours = self._parent.params.ganttRespectHours 
                    ? self._parent.aCalculated.stopHour - self._parent.aCalculated.startHour
                    : 24,
                nStartDay = parseInt(nBase / nWorkingHours),
                nStopDay = parseInt(nCurrent / nWorkingHours);
            return (nStartDay != nStopDay) 
                ? (nStartDay > nStopDay ? -1 : 1) * self._offDayHours * Math.abs(nStartDay - nStopDay)
                : 0;
        }
        
        var _barMove = function(el, evt) {
            var nChange = el.data('currentDay') - el.data('baseDay');
            if (self._format == 'hour' 
                && self._parent.params.ganttRespectHours
                && (self._parent.aCalculated.startHour > 0 || self._parent.aCalculated.stopHour < 24)
            ) {
                nChange += correctHourChange(el.data('currentDay'), el.data('baseDay'));
            }
            var aDates = {
                    dateStart   : Date.baseDate(
                        el.data('startDate'), 
                        (self._format != 'hour' && el.data('resizeL') != false ? nChange : 0),
                        (self._format == 'hour' && el.data('resizeL') != false ? nChange : 0)
                    ),
                    dateEnd     : Date.baseDate(
                        el.data('endDate'), 
                        (self._format != 'hour' && el.data('resizeL') != true ? nChange : 0),
                        (self._format == 'hour' && el.data('resizeL') != true ? nChange : 0)
                    ),
                    allDay : el.data('allDay')
                };
            if (aDates.allDay || self._format != 'hour') {
                aDates.dayStart = Date.baseDate(aDates.dateStart).resetHours();
                aDates.dayEnd = Date.baseDate(aDates.dateEnd).resetHours();
            }
            var aPos = self._getBarPos(aDates),
                nScale = self._options.mode[self._format].scale;
            el.data('bar')
                .css({
                    "margin-left"   : parseInt(aPos.x * nScale),
                    "width"         : parseInt(aPos.width * nScale)
                })
                .toggleClass('full_l', aDates.dateStart < self._period.visualMin)
                .toggleClass('full_r', aDates.dateEnd > self._period.visualMax);
            var oDateTitle = el.data('bar').find('.resize_date');
            if (oDateTitle.size() < 1) {
                oDateTitle = jQuery('<span class="resize_date">').appendTo(el.data('bar').children('span'));
            }
            var sFormat = self._format != 'hour' || aDates.allDay
                ? self._parent.options.format.date
                : self._parent.options.format.datetime;
            oDateTitle.text(
                aDates.dateStart.format(sFormat) 
                + ' - '
                + aDates.dateEnd.format(sFormat)
            );
        }
        
        var _toggleHightLight = function(el, bOn){
            var oDataTbl = self._dom.date.find('tbody > tr');
            if (bOn == true) {
                el.data('bar').addClass('new_event')
                    .parent().addClass('_highlight');
                oDataTbl.children('td').eq(parseInt(el.data('baseDay'))).addClass('_baselight');
                oDataTbl.children('td._highlight').removeClass('_highlight');
                oDataTbl.children('td').eq(parseInt(el.data('currentDay'))).addClass('_highlight');
            } else {
                el.data('bar').removeClass('new_event _to_right')
                    .parent().removeClass('_highlight');
                oDataTbl.children('td').eq(parseInt(el.data('baseDay'))).removeClass('_baselight');
                oDataTbl.children('td._highlight').removeClass('_highlight');
                
            }
        }
        
        self._dom.events.simpleSelect({
            "selector"      : 'div.evt',    // selector for start drag event
            "moveSelector"  : '> div > div',     // selector for continue drag event
            "notselector"   : ".non_e",     // means that noneditbale event cannot be moved
            "touchhold"     : 1000,         // minimum time that activate "touchhold" event
            "touchradius"   : 10,           // maximum radius for moving finger 
            "clearStop"     : true,         // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                var aNew = self._getPosition(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    bResize = evtEl.width() > 5 && !evtEl.hasClass('non_r') && jQuery(evt.target).filter('span.l, span.r').size() > 0
                        ? jQuery(evt.target).filter('span.l').size() > 0
                        : null,
                    oEl = self._parent._events.getEvent(evtEl.data('event'), evtEl.data('calendar'));

                el.data({
                    resizeL     : bResize , 
                    currentDay  : aNew.day, 
                    baseDay     : aNew.day, 
                    startDate   : new Date(evtEl.data('start') * 1000),
                    endDate     : new Date(evtEl.data('end') * 1000),
                    bar         : evtEl,
                    noChange    : true,
                    allDay      : oEl[0].allDay
                });
                
                if (self._parent.isMobile() || self._parent.getParam('longClick', false)) {
                    _toggleHightLight(el, true);
                    _barMove(el, evt);
                }
                
                return false;
            },
            "stop" : function(el, evt){
                var nChange = el.data('currentDay') - el.data('baseDay');
                if (nChange == 0) {
                    el.data('bar').find('.resize_date').remove();
                    _toggleHightLight(el, false);
                    return true;
                }
                if (self._format == 'hour') {
                    nChange += correctHourChange(el.data('currentDay'), el.data('baseDay'));
                }
                el.data('noChange', false).data('bar').removeClass('new_event');
                
                var aEvents = {"type" : "list_with_calendars"};
                aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                self._dom.events.find('.evt.sel[data-event]').each(function(){
                    var sId = jQuery(this).data('event'),
                        sCalendar = jQuery(this).data('calendar')
                    if (aEvents[sId] == undefined || aEvents[sId].indexOf(sCalendar) < 0) {
                        if (aEvents[sId] == undefined) {
                            aEvents[sId] = [];
                        }
                        aEvents[sId].push(sCalendar);
                    }
                });                 
                
                self._parent._events.setEvent(
                    aEvents, 
                    self._format != 'hour'
                        ? {
                            day_left_change : (el.data('resizeL') != false ? nChange : 0),
                            day_right_change : (el.data('resizeL') != true ? nChange : 0)
                        }
                        : {
                            hour_left_change : (el.data('resizeL') != false ? nChange : 0),
                            hour_right_change : (el.data('resizeL') != true ? nChange : 0)
                        }
                );
                el.data('bar').addClass('no_hover');
                return self._parent._cancelBubble(evt);
            },
            "cancel" : function(el, evt){
                el.data('bar').removeClass('new_event');//.addClass('no_hover');
                if (el.data('noChange') !== true) {
                    _clearCreatingEvent();
                    return self._parent._cancelBubble(evt);
                } else {
                    _toggleHightLight(el, false);
                    el.data('currentDay', el.data('baseDay'));
                    _barMove(el, evt);
                }
            },
            "move" : function(el, evt) {
                _toggleHightLight(el, true);
                return _barMove(el, evt);
            },
            "check" : function(el, evt) {
                return _isCellChange(el, evt);
            }
        });
    }
    
    self._swipe = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
        } 
    }
    

    
 /**
 * Toggle IS compatibility mode
 *
 * @return {void} 
 */    
//    self._initIE = function() {
//        if (jQuery.browser.msie) {
//            self._div.addClass('_IE_' + parseInt(jQuery.browser.version));
//        }
//    }
    
    self._expand = function(bMode) {
        if (bMode) {
            var nHeight = self._dom.events.height(),
                nWidth = self._dom.events.width(),
                nHAdd = self._dom.events[0].scrollHeight - nHeight,
                nWAdd = self._dom.events[0].scrollWidth - nWidth;
            self._parent._dom.el
                .width(self._parent._dom.el.width() + nWAdd)
                .height(self._parent._dom.el.height() + nHAdd);
        } else {
            self._parent._dom.el.width('').height('');
        }
    }
    
    
    self._setCalendar2Group = function(aGroups) {
        self._aCalendat2Group = {};
        for (var nI = 0; nI < aGroups.length; nI++) {
            var aGroup = self._parent._calendars.getCalendar(aGroups[nI]);
            for (var nJ = 0; nJ < aGroup.calendarsList.length; nJ++) {
                if (self._aCalendat2Group[aGroup.calendarsList[nJ]] == undefined) {
                    self._aCalendat2Group[aGroup.calendarsList[nJ]] = [];
                }
                self._aCalendat2Group[aGroup.calendarsList[nJ]].push(aGroups[nI]);
            }
        }
    }
    
    self._cancelPrintAction = function(){
        self._parent.hidePopup();
    }
    
    self._collapseGroupAction = function(oEl, evt){
        var nLevel = oEl.data('level'),
            aLevel = [];
        for (var nJ = 0; nJ <= nLevel; nJ++){
            aLevel.push(nJ);
        }
        
        var oEvtGroup = self._dom.events.find('.group_empty_line[data-group="' + oEl.data('group') + '"]'),
            aTitleEls = oEl.nextUntil('.group_title[data-level="' + aLevel.join('"],.group_title[data-level="') + '"]'),
            aEvtEls = oEvtGroup.nextUntil('.group_empty_line[data-level="' + aLevel.join('"],.group_empty_line[data-level="') + '"]');
        if (aTitleEls.size() < 1) {
            aTitleEls = oEl.nextAll();
            aEvtEls = oEvtGroup.nextAll();
        }
        var bOpen = !oEl.hasClass('_collapse');
        
        self._aCollapsed[oEl.data('group')] = bOpen;
        aTitleEls.add(aEvtEls).toggleClass('_collapse', bOpen);
        oEvtGroup.add(oEl).toggleClass('_collapse', bOpen);
        self._renderCollapsedGroupEvent(oEvtGroup, aEvtEls);
        aTitleEls.filter('.group_title').each(function(nIdx, oGrEl){
            self._aCollapsed[jQuery(oGrEl).data('group')] = bOpen;
        });
    }
    
    self._collapseCalendarAction = function(oEl, evt){
        var aGroupTitle = oEl.nextAll('.group_title'),
            aGroupTitleSub = oEl.nextAll('.group_title_sub'),
            aTitleEvt = oEl.nextAll('.evt:not(._no_grouping)'),
            bFlag = true,
            sCalendar = oEl.parent().attr('data-calendar'),
            oGroupRight = self._dom.events.find('div[data-calendar="' + sCalendar + '"]'),
            aGroupEvt = [],
            aGroupEvtSub = [],
            aEvtEvt = [],
            JqEl;
       
        oGroupRight.children().each(function(nIdx, oDataEl) {
            JqEl = jQuery(oDataEl);
            if (JqEl.hasClass('group_empty_line')) {
                aGroupEvt.push(oDataEl);
            } else if (JqEl.hasClass('group_empty_line_sub')) {
                aGroupEvtSub.push(oDataEl);
            } else if (!JqEl.hasClass('grouping')) {
                aEvtEvt.push(oDataEl);
            }
        });
        
        aGroupTitle.each(function(nIdx, oDateEl){
            if (!jQuery(oDateEl).hasClass('_collapse')) { 
                bFlag = false; 
                return false;
            }
        });
        aGroupTitle.each(function(nIdx, oDateEl){
            oDateEl = jQuery(oDateEl);
            self._aCollapsed[oDateEl.data('group')] = !bFlag;
        });
        
        if (!bFlag) {
            aGroupTitle.add(aGroupEvt).addClass('_collapse');
            aTitleEvt.add(aGroupTitleSub).add(aGroupEvtSub).add(aEvtEvt).addClass('_collapse');
            oGroupRight.children().each(function(nIdx, oDataEl) {
                JqEl = jQuery(oDataEl);
                if (JqEl.hasClass('group_empty_line')) {
                    self._renderCollapsedGroupEvent(JqEl, JqEl.nextUntil('.group_empty_line, ._no_grouping'));
                }
            });
        } else {
            aGroupTitle.add(aGroupEvt).removeClass('_collapse');
            aTitleEvt.add(aGroupTitleSub).add(aGroupEvtSub).add(aEvtEvt).removeClass('_collapse');
        }
    }
    
    self._renderCollapsedGroupEvent = function(oEvtGroup, aEvtEls){
        if (oEvtGroup.hasClass('_collapse') && oEvtGroup.children('._group_evt').size() < 1){
            var oAllEvts = aEvtEls.find('.evt'),
                nMin, nMax,
                sCal = oEvtGroup.parent().data('calendar'),
                aDia = [],
                oCal = self._parent._calendars.getCalendar(sCal),
                aSpecial = [];
            if (self._parent.getParam('ganttCollapseFullLine', true)) {
                
                oAllEvts.each(function(nIdx, oSubEl){
                    oSubEl = jQuery(oSubEl);
                    var nL = parseInt(oSubEl.css('margin-left')),
                        nW = oSubEl.width();
                    nMin = nMin == undefined ?  nL : Math.min(nL, nMin);
                    nMax = nMax == undefined ? nL + nW : Math.max(nL + nW, nMax);
                    if (oCal.specialColors != undefined && oCal.specialColors.length > 0) {
                        var sClass = oSubEl.children().attr('class');
                        if (sClass.indexOf('_spec') > 0 || sClass.indexOf('_sd_') > 0){
                            var aClass = sClass.split(' ');
                            aSpecial = aSpecial.concat(
                                aClass.filter(function(sVal){
                                    return sVal.indexOf('_sd_') >= 0 || sVal.indexOf('_spec') >= 0;
                                })
                            );
                            //aSpecial.push()
                        } else {
                            aSpecial.push("")
                        }
                    }
                    
                });
                if (aSpecial.length > 0) {
                    aSpecial = aSpecial.filter(function(sVal){
                        return sVal != '_spec_inviting' && sVal != '_spec_inviting_child';
                    }).unique();
                    if (aSpecial.length == 1 && aSpecial[0] == "") {
                        aSpecial.length = 0;
                    }
                }
                if (nMin >= 0 && nMax > 0) {
                    oEvtGroup.html('<span class="_group_evt color_' + sCal + ' ' 
                        + (aSpecial.length > 0 ? ' _rainbow' : '')
                        + '" '
                        + 'style="width:' + (nMax - nMin) + 'px; margin-left:' + nMin + 'px">' 
                        + (aSpecial.length > 0 ? '<i><b class="color_' + sCal + ' ' 
                            + aSpecial.join('"></b><b class="color_' + sCal + ' ') 
                            + '"></b></i>' : '')
                        + '</span>'
                    );
                }
            } else {
                oAllEvts.each(function(nIdx, oSubEl){
                    oSubEl = jQuery(oSubEl);
                    var nL = parseInt(oSubEl.css('margin-left')),
                        nW = oSubEl.width(),
                        nR = nL + nW,
                        bFound = false,
                        aSpecialDia = [];
                    if (oCal.specialColors != undefined && oCal.specialColors.length > 0) {
                        var sClass = oSubEl.children().attr('class');
                        if (sClass.indexOf('_spec') > 0 || sClass.indexOf('_sd_') > 0){
                            var aClass = sClass.split(' ');
                            aSpecialDia = aSpecialDia.concat(
                                aClass.filter(function(sVal){
                                    return sVal.indexOf('_sd_') >= 0 || sVal.indexOf('_spec') >= 0;
                                })
                            );
                            //aSpecial.push()
                        } else {
                            aSpecialDia.push("");
                        }
                    }
                    if (aDia.length == 0) {
                        aDia.push([nL, nR, [oSubEl.prop('title')], aSpecialDia]);
                    } else {
                        
                        for (var nD = 0; nD < aDia.length; nD++) {
                            if (aDia[nD][1] < nL){
                                continue;
                            } else if (aDia[nD][0] > nR) {
                                bFound = true;
                                break;
                            } else if ((aDia[nD][0] <= nL && aDia[nD][1] >= nR)) {
                                bFound = true;
                                aDia[nD][2].push(oSubEl.prop('title'));
                                if (aSpecialDia.length > 0) {
                                    aDia[nD][3] = aDia[nD][3].concat(aSpecialDia);
                                }
//                                console.log(' ' + nD + ' / ' + aDia[nD][0] + ' - ' + aDia[nD][1]
//                                        + ' / ' + nL + ' - ' + nR
//                                );
                                break;
                            } 
                            aDia[nD][0] = Math.min(nL, aDia[nD][0]);
                            aDia[nD][1] = Math.max(nR, aDia[nD][1]);
                            aDia[nD][2].push(oSubEl.prop('title'));
                            if (aSpecialDia.length) {
                                aDia[nD][3] = aDia[nD][3].concat(aSpecialDia);
                            }
                            bFound = true;
                        }
                        if (!bFound) {
                            aDia.push([nL, nR, [oSubEl.prop('title')], aSpecialDia]);
                        }
                        
                    }
                });
                if (aDia.length > 0) {
                    var nBase = 0,
                        nFrom = 0, nLgth = 0,
                        sHTML = '';
                    
                    for (var nD = 0; nD < aDia.length; nD++) {
                        if (aDia[nD][3].length > 0) {
                            aDia[nD][3] = aDia[nD][3].filter(function(sVal){
                                return sVal != '_spec_inviting' && sVal != '_spec_inviting_child';
                            }).unique();
                            if (aDia[nD][3].length == 1 && aDia[nD][3][0] == "") {
                                aDia[nD][3].length = 0;
                            }
                        }
                        nFrom = aDia[nD][0] - nBase;
                        nLgth = aDia[nD][1] - aDia[nD][0];
                        sHTML += '<span class="_group_evt color_' + sCal + ' ' 
                            + (aDia[nD][3].length > 0 ? ' _rainbow' : '')
                            + '" '
                            + ' title="' + (aDia[nD][2].join("\n").htmlspecialchars()) + '"'
                            + 'style="width:' + (nLgth) + 'px; margin-left:' + nFrom + 'px">'
                            + (aDia[nD][3].length > 0 ? '<i><b class="color_' + sCal + ' ' 
                                + aDia[nD][3].join('"></b><b class="color_' + sCal + ' ') 
                                + '"></b></i>' : '')
                            + '</span>';
                        nBase = aDia[nD][1];
                    }
                    oEvtGroup.html(sHTML);
                }
            }
        }
    }
    
    self._getBaseFormatDate = function(dDate) {
        var dNew = Date.baseDate(dDate);
        switch(self._format) {
            case 'hour' :
                //var dNow = new Date();
                dNew.setHours(self._parent.aCalculated.startHour);
                break;
            case 'day' :
                dNew.resetHours();
                break;
            case 'week' :
                dNew.setDate(dNew.getDate() - dNew.getDay() + 1);
                break;
            case 'month' :
                dNew.setDate(1);
                break;
            case 'quarter' :
                dNew.setDate(1);
                dNew.changeMonth(-dNew.getMonth() % 3);
                break;
        }
        return dNew;
    }
    
    self._buildCalendarEvenentsPeriod = function(sCalendarId, aEls, dMin, dMax) {
//        var aEls = self._calendarsData[sCalendarId],
        var aCalendar = self._parent._calendars.getCalendar(sCalendarId),
            sGroupField = self._calendarsGroupingValues[sCalendarId] || aCalendar.groupFieldName,
            bGroupingMode = aCalendar.calendarType != 'web' && sGroupField != undefined && sGroupField != '-1',

//            bGroupingMode = (typeof(self._calendarsGroupingValues[sCalendarId]) == 'undefined' 
//                || self._calendarsGroupingValues[sCalendarId] != '-1'
//            ),
            sGroup = '', sOldGroup = '',
            sEventBarHTML = '',
            sHtml = "<div data-calendar='" + sCalendarId + "'>"
                + '<div class="grouping">' 
                + (bGroupingMode
                    ? self._parent._objects.getObjectFieldByName(
                            aCalendar.objectName, 
                            self._calendarsGroupingValues[sCalendarId] || aCalendar.groupFieldName
                        ).label
                    : ''
                            )
                +  '</div>';
        if (aEls != undefined) {
            for (var nI = 0; nI < aEls.length; nI++) {
                var aEl = aEls[nI];
                sGroup = aEl.group == undefined  ? '' : aEl.group;
                sHtml += (bGroupingMode && sOldGroup != sGroup
                        ? '<div class="group_empty_line" data-group="' + sCalendarId + '_' + sGroup.htmlspecialchars() + '"></div>'
                        : ""
                    )
                sOldGroup = sGroup;
                sEventBarHTML = self._buildBar(aEls[nI], true, true, {min : dMin, max : dMax} );
                if (sEventBarHTML == '' && self._parent.params.ganttRespectHours && !self._parent.params.ganttShowUnvisible) {
//                        aHideUnvisible.push(aEl.id);
                } else {
                    sHtml += '<div>' + sEventBarHTML + '</div>';
                }
            }
        }
        sHtml += "</div>";     
        return sHtml;
    }
            
            
    self._buildCalendarEvenentsBlocks = function(nMaxHeight) {
        var nI, sHtml = '', aEl, aEls, aCalendar, sOldGroup, sGroup,
            aResult = [], 
            aCurPageBlock = [],
            aBlock = null,
            nSkip = 0,
            nCounts = 0,
            sCalendarHTML ,
            nMaxCounts = parseInt(nMaxHeight / 23);
    
        jQuery.each(self._calendars, function(nIdx, sCalendarId) {
            var aCalendar = self._parent._calendars.getCalendar(sCalendarId),
                sGroupField = self._calendarsGroupingValues[sCalendarId] || aCalendar.groupFieldName,
                bGroupingMode = sGroupField != undefined && sGroupField != '-1' && aCalendar.calendarType != 'web',
                aGroupingField = bGroupingMode ? self._parent._objects.getObjectFieldByName(aCalendar.objectName, sGroupField) : null,
                bHTMLGrouping = aGroupingField != null ? aGroupingField.isHTML === true : false;
            sOldGroup = '';
            aEls = self._calendarsData[sCalendarId];
            sCalendarHTML = "<div data-calendar='" + sCalendarId + "'>"
                + "<div class='title color_" + sCalendarId + "'>" + aCalendar.name.htmlspecialchars() + '</div>';
            nSkip = 0;
            if (aEls == undefined || aEls.length < 1) {
                nCounts += 1;
                aCurPageBlock.push({
                    'calendarId' : sCalendarId,
                    'events' : [],
                    'html' : sCalendarHTML + '</div>'
                });
                return;
            }
            
            do {
                var aElsIds = [];
                sHtml = '';
                for (nI = nSkip; nI < aEls.length && nCounts < nMaxCounts - 1; nI++, nCounts++) {
                    aEl = aEls[nI];
                    aElsIds.push(aEl);
                    sGroup = aEl.group == undefined  ? '' : aEl.group;
                    if (bGroupingMode && sOldGroup != sGroup) {
                        sHtml += '<div data-action="collapseGroup" '
                                + ' data-group="' + sCalendarId + '_' + sGroup.htmlspecialchars() + '"'
                                + ' class="group_title" title="' + sGroup.htmlspecialchars() + '">' 
                                + (bHTMLGrouping  ? sGroup : sGroup.htmlspecialchars())  
                                + '</div>';
                        nCounts++;
                    }
                    
                    sHtml += '<div class="evt '
                        + (aEl.specColor != undefined && aEl.specColor.indexOf('_spec_reccuring') >= 0 ? ' _spec_reccuring ' : '')
                        + '" '
                        + ' data-event="' + aEl.id  + '"'
                        + ' data-calendar="' + aEl.calendarid + '">' 
                        + (aCalendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                        + '</div>';
                    sOldGroup = sGroup;
                }
                aCurPageBlock.push({
                    'calendarId' : sCalendarId,
                    'events' : aElsIds,
                    'html' : sCalendarHTML + sHtml + '</div>'
                });
                if (nCounts >= nMaxCounts - 1) {
                    sOldGroup = '';
                    nSkip += aElsIds.length; // nCounts
                    nCounts = 0;
                    aResult.push(aCurPageBlock);
                    aCurPageBlock = [];
                    sHtml = '';
                }
            } while (nSkip < aEls.length && nCounts < nMaxCounts - 1 && nI < aEls.length);
        });
        if (aCurPageBlock.length > 0) {
            aResult.push(aCurPageBlock);
        }
        return aResult;
    }
    
    jQuery.calendarAnything.appendView('gantt', view);
})();