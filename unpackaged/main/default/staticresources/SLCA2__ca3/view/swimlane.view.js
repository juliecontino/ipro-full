/* Copyright (c) 2012, SliverLine, JQGantt, d.sorokin */


(function(){
    var self = {
        _data               : [],
        _css                : '/css/swimlane.css',
        _parent             : null,
        _div                : null,
        _dom                : {},
        _calendarsData      : {},
        _calendarsGroupingValues  : {},
        _calendars          : [],
        _filterView         : null,
        _period             : {
                                "min" : new Date(), 
                                "max" : new Date(), 
                                visualMin : new Date(),
                                visualMax : new Date(),
                                current   : new Date(),
                                prev      : new Date(),
                                startH : 0,
                                stopH : 24
                            },
        _format             : 'hour',
//                (typeof(localStorage) != 'undefined' && localStorage.swimlaneSelectedPeriod != undefined
//                                ? localStorage.swimlaneSelectedPeriod
//                                : "hour"
//                                ),
        _periodType         : 3,
        _groupingMode       : false,
        _offDayHours        : 0,
        _inDayHours         : 24,
        _options            : {
            "mode" : {
                "hour"  : {scale : 100, change : 1, oneday : 100, func : "changeDate"},
                "day"   : {scale : 100, change : 1, oneday : 100, func : "changeMonth"},
                "week"   : {scale : 100, change : 7, oneday : 100, func : "changeDate"},
                "month"   : {scale : 100, change : 12, oneday : 100, func : "changeMonth"},
            },
            "formatList" : ["hour"]
        },
        _cellWidth : 100,
        _group      : "---",
//        (typeof(localStorage) != 'undefined' && localStorage.swimlaneSelectedFilterId != undefined
//                        ? localStorage.swimlaneSelectedFilterId
//                        : "---"
//                    ),
        _hourCells  : 1,
        _preset     : null,
        _aListViews : [],
        _aPresets   : null,
        _aPresetRecords     : {},
        _aListViewRecords   : {},
        _aListViewTitles    : {},
        _aListViewIds       : {},
        _aSortedTitles      : {},
        _sMode      : null,
        _nMaxLine   : 0,
        _nMaxHeight : 1,
        _nScroll    : null,
        "_eventHeight" : {
            "small" : 15,
            "middle" : 18,
            "large" : 23
        },
        _nLineHeight        : 15,
        _oLastSetting       : {},
        _nCurrentPreset     : null,
        _aCurrentFilters    : {},
        _aCurrentGrouping   : {},
        _aGroupHeight       : {},
        _aGroupLines        : {}, 
        _aPrevLines         : {},
        _aGroupLinesTemporary   : {},
        _aPrevLinesTemporary    : {},
        _bNoScroll          : false,
        _bSkipScroll        : false,
        _nScrollTimer       : null,
        _aCurrentScrollPos  : {left : 0, top : 0},
        _sBaseObject        : "",
        _bLock              : false,
        _nEventsHeight      : 0,
        _bNonSplitMode      : true,
        _aWidthCSS          : []
    };
    
    var view = {};

/**
 * Initialization of Gantt
 *
 * @return {void}
 */
    view.init = function (div, parent){
        self._div = div;
        self._parent = parent;
        self._parent.loadCss(self._css);
        self._bNonSplitMode = self._bNonSplitMode && self._parent.params.swimlaneScrolling;
        
//        self._format = 'hour';
        self._format = self._parent.getParam('swimlaneDefaultPeriod', 'hour');
//                self._parent.getSS(
//                'swimlaneSelectedPeriod', 
//                self._parent.getParam(
//                    'swimlaneDefaultPeriod', 
//                    self._parent.getLS('swimlaneSelectedPeriod', self._format)
//                )
//        );
//        if (self._parent.params.swimlaneDefaultPeriod != undefined && self._parent.params.swimlaneDefaultPeriod != '') {
//            self._format = self._parent.params.swimlaneDefaultPeriod;
//        }
        
        if (['day', 'hour'].indexOf(self._format) < 0) {
            self._format = "hour";
        }
        self._cellWidth = self._format == 'hour' ? 100 : parseInt(self._parent.getParam('swimlaneCell', '100'));
        self._periodType = parseInt(self._parent.params.ganttPeriod);
        self._options.mode.hour.oneday = parseInt(self._parent.params.minMinutePeriod) / 3;
        self._hourCells = parseInt(60 / self._parent.params.minMinutePeriod);
        self._period.startH = parseInt(self._parent.aCalculated.startHour);
        self._period.stopH = parseInt(self._parent.aCalculated.stopHour);
        self._group = self._parent.getParam(
                'swimlaneDefaultGroupBy', 
                self._parent.getLS('swimlaneSelectedFilterId', self._group)
            );
                
//                self._parent.getSS(
//            'swimlaneSelectedFilterId', 
//            self._parent.getParam(
//                'swimlaneDefaultGroupBy', 
//                self._parent.getLS('swimlaneSelectedFilterId', self._group)
//            )
//        );

//        if (self._parent.params.swimlaneDefaultGroupBy != undefined && self._parent.params.swimlaneDefaultGroupBy != '') {
//            self._group = self._parent.params.swimlaneDefaultGroupBy;
//        }
//        self._offDayHours = !self._parent.params.ganttRespectHours 
//            ? 0
//            : parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._offDayHours = parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._inDayHours = parseInt(self._parent.aCalculated.stopHour) - parseInt(self._parent.aCalculated.startHour);
        self._initEvtCSS();
        self._nLineHeight = self._eventHeight[self._parent.params.size];
        
    }
    

    view.show = function(){
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('swimlane');
        }
        self._div.addClass('format_' + self._format).addClass('cell_' + self._cellWidth);
        if (self._bNonSplitMode) {
            self._div.addClass('_multi_blocks');
        }
        
        self._div.addClass('format_minute_' + self._parent.params.minMinutePeriod);
        view.changeCurrentPeriod(self._parent.options, 0);
        self._buildDOM();
        self._div.addClass('show');
    }
    
    view.reShow = function() {
//        view.show();
    }
    
    view.showData = function(params) {
        if (self._bLock) {
            return;
        }
        var aObjects = [], oCalendar, sCurrentGroup = self._group;
        
        params = params || {};
//        if (typeof(params.date) == 'undefined') {
//            params.min = new Date(self._period.min);
//            params.max = new Date(self._period.max);
//        }  else {
            params.min = new Date(self._period.min);
            params.max = new Date(self._period.max);
//        }
        if (self._format != 'hour') {
            params.min.setDate(1);
            params.max.setDate(params.max.getMonthDays());
        }
        self._period.min.setTime(params.min.getTime());
        self._period.max.setTime(params.max.getTime());
        params.calendars = self._parent.layout.getActiveCalendars();
        self._calendars = [].concat(params.calendars.calendar, params.calendars.group, params.calendars.web);
        var aAllCalendars = [].concat(params.calendars.calendar);

        
        if (params.calendars.group.length > 0) {
            aAllCalendars = aAllCalendars.concat(self._getCalendarsForGroup(params.calendars.group));
//            self._setCalendar2Group(params.calendars.group);
        }
        aAllCalendars = aAllCalendars.unique();
        
        
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('swimlane');
        }
        if (self._periodType > 0 || self._calendars.length == 0) {
//            self._buildRightHead(params.min);
        } 
        
        
//        var aListViews = [], aPresets = [];
        var aQueue = [
            function(){
                if (params.calendars.group.length) {
                    self._parent._calendars.checkPresentGroupCalendars(params.calendars.group);
                };
            },
            function(){
                for (var nI = 0; nI < aAllCalendars.length; nI++) {
                    oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                    if (oCalendar != undefined 
                        && oCalendar.calendarType == 'sf'  
                        && aObjects.indexOf(oCalendar['objectName']) < 0
                    ) {
                        aObjects.push(oCalendar['objectName']);
                    }
                }
                self._sBaseObject = aObjects.length > 0 ? aObjects[0] : "";
            },
            function() {
                self._bLock = true;
                if (self._aPresets == null) {
                    self._loadSwimanePreset();
                }
            },
            function(){
                self._parent._objects.getListviewOptions('user', function(aData){
                    var aResult = [];
                    for (var nI = 0; nI < aData.length; nI++) {
                        aResult.push(aData[nI]);
                    }
                    aResult.quickSort('label', {'lowercase' : true});
                    self._aListViews = aResult;
                });
                
//                self._parent._objects.getMetadata("ListView", function(aData){
//                    var aResult = [];
//                    for (var nI = 0; nI < aData.length; nI++) {
//                        if (aData[nI].fullName.toLowerCase().indexOf('user.') < 0) {
//                            continue;
//                        }
//                        aResult.push(aData[nI]);
//                    }
//                    self._aListViews = aResult;
//                });
            },
//            function(){
//                if (self._parent.params.insideEdit == '1') {
//                    self._parent._objects.loadSpecialSettings("swimlane", function(aData){
//                        self._aPresets = aData;
//                    });
//                }
//            },
            function() {
                self._parent._objects.getObjects(aObjects, null, {loadReferenced : true, onlySingleReference : true});
            },
            function(){
                self._parent._objects.getObjectsFieldsIntesect(
                    aObjects, 
                    ["REFERENCE", 'TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX'], 
                    function(aFields){
                        self._fillForm(aFields, self._aListViews, self._aPresets);
                    }
                );
            },
            function(){
                if (self._sMode == 'listview' && self._aListViewRecords[self._group] == undefined
                ) {
                    self._parent._objects.getListviewRecords('user', self._group, function(data){
                        self._aListViewRecords[self._group] = data;
                    });
                } else if (self._sMode == 'preset' && self._aListViewRecords[self._group] == undefined) {
                    var aPreset = self._getPreset(self._group);
                    if (aPreset == null || aPreset == undefined) {
                        self._aListViewRecords[self._group] = [];
                        return;
                    }
                    self._parent._objects.getPresetRecords(self._getPreset(self._group).filters, function(data){
                        self._aPresetRecords[self._group] = data;
                        var aData = [];
                        jQuery.each(data, function(sKey, mVal){
                            aData = aData.concat(mVal);
                        });
                        self._aListViewRecords[self._group] = aData;
//                        console.log(self._aListViewRecords);
                    });
                }
            },
            function() {
                if (params.disable && aAllCalendars.length == 0) {
                    self._clearEventsDOM();
                    if (self._sMode == 'field') {
                        self._group = "---";
                    }
                    self._bLock = false;
                    return;
                }
                if (sCurrentGroup != self._group || self._parent._currentModeName != 'swimlane') {
                    self._bLock = false;
                    return;
                }
                if (params.disable != true) {
                    self._parent._calendars.resetCalendar(aAllCalendars);
                }
                self._calendarsData = {};
                self._aListViewTitles = {};
                self._aListViewIds = {};
                if ((self._sMode == 'listview' || self._sMode == 'preset' )
                    && (
                        self._aListViewRecords[self._group] == undefined
                        || 
                        self._aListViewRecords[self._group].length == 0
                    )
                ) {
//                    self._showEmptyMessage('Selected user list does not have any users. Please select a list with users');
                    self._data = [];
                    return;

                }
                if (self._group == null) {
                    return;
                }
//                self._dom.title.children().add(self._dom.events.children())
//                    .not('[data-calendar="' + self._calendars.join('"], [data-calendar="') + '"]')
//                    .remove();
                params.grouping = {};
                switch(self._sMode) {
                    case 'field':  
                        for (var nI = 0; nI < aAllCalendars.length; nI++){
                            params.grouping[aAllCalendars[nI]] = self._group;
                        }
                        break;
                    case 'preset' :
                        var aPreset = self._getPreset(self._group);
                        for (var nI = 0; nI < aAllCalendars.length; nI++){
                            oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                            for (var nP = 0; nP < aPreset.filters.length; nP++) {
                                if (aPreset.filters[nP].object == oCalendar['objectName']) {
                                    params.grouping[aAllCalendars[nI]] = aPreset.filters[nP].field;
                                }
                            }
                            
        //                    params.grouping[aAllCalendars[nI]] = 
        //                        (oCalendar['objectName'] == 'event' || oCalendar['objectName'] == 'task') 
        //                            ? 'whatid'
        //                            : "ownerid";
                        }
                        break;
                    case 'listview' :
                        for (var nI = 0; nI < aAllCalendars.length; nI++){
                            oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                            params.grouping[aAllCalendars[nI]] = 
                                oCalendar.settings.swimlane_grouping == undefined || oCalendar.settings.swimlane_grouping == ''
                                ? 'ownerid'
                                : oCalendar.settings.swimlane_grouping;
        //                    params.grouping[aAllCalendars[nI]] = 
        //                        (oCalendar['objectName'] == 'event' || oCalendar['objectName'] == 'task') 
        //                            ? 'whatid'
        //                            : "ownerid";
                        }
                        break;
                }              
                if ((self._sMode == 'listview' || self._sMode == 'preset' ) 
                    && self._aListViewRecords[self._group] != undefined
                ) {
                    params.filters = {};
                    var aIds = [];
                    for (var nJ = 0; nJ < self._aListViewRecords[self._group].length; nJ++) {
                        aIds.push(self._aListViewRecords[self._group][nJ].id);
                    }
                    for (var nI = 0; nI < aAllCalendars.length; nI++) {
                        if (params.grouping[aAllCalendars[nI]] == undefined) {
                            continue;
                        }
                        oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                        params.filters[aAllCalendars[nI]] = [{
                            'oper'  : 'equal',
                            'name'  : params.grouping[aAllCalendars[nI]],
                            'value' : aIds.join(',')
                        }];
                    }
                                     
                    
                    var aList = [];
                    for (var nJ = 0; nJ < self._aListViewRecords[self._group].length; nJ++) {
                        aList.push(self._aListViewRecords[self._group][nJ].name);
                        self._aListViewTitles[self._aListViewRecords[self._group][nJ].name] 
                            = self._aListViewRecords[self._group][nJ].label;
                        self._aListViewIds[self._aListViewRecords[self._group][nJ].name] 
                            = self._aListViewRecords[self._group][nJ].id;
                    }
                    aList.sort();
                    for (var nI = 0; nI < aList.length;nI++) {
                        self._calendarsData[aList[nI]] = [];
                    }
                }
                self._aCurrentGrouping = params.grouping;
                self._aCurrentFilters = params.filters;
                
                self._parent._events.getData(params, function(data, aMultiParams){
                    self._data = data;
                });
            },
            function() {
                self._bLock = false;
                if (sCurrentGroup != self._group || self._parent._currentModeName != 'swimlane') {
                    if (sCurrentGroup != self._group && self._group == '' && self._dom.title != undefined) {
                        self._dom.title.html('');
                        self._dom.events.html('');
                    }
                    return;
                }
                self._calculateData();
                self._buildLeftBody();
                self._buildDataCells(params);
//                self._bLock = false;
            }
        ];
        aQueue.reverse();
        self._parent._prependQueue(aQueue);
    }

    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        } 
        if (self._filterView != null) {
            return self._filterView.action(sAction, el, evt);
        }
    }
    
    view.getTitle = function(){
        if (self._format == 'hour') {
            return self._parent.options.current.format(self._parent.options.format.fullDate);
        } else {
            return self._parent.options.current.format(self._parent.options.format.monthTitle);
        }
    }
    
    
    view.changeCurrentPeriod = function(aOptions, mDirection) {
        var nTempDirection = 0,
            nWeekDays = parseInt(self._parent.params.showWeekEnds),
            nWiderScrolling = 1;
        if (mDirection instanceof Date) {
            nTempDirection = aOptions.current < mDirection ? 1 : -1;
//            console.log('' + mDirection);
            aOptions.current.setTime(mDirection.getTime());
            aOptions.current.setHours(0, 0, 0, 0);
        } else {
            aOptions.current[self._options.mode[self._format].func](mDirection);
        }
        if (self._format == 'hour' && parseInt(self._parent.params.showWeekEnds) != 7) {
            if (mDirection instanceof Date || mDirection == 0) {
                mDirection = nTempDirection;
            }
            while (
                aOptions.current.getDay() == 0
                || 
                (nWeekDays == 5 && aOptions.current.getDay() == 6)
            ) {
                aOptions.current.changeDate(mDirection);
            }
        } 
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date(aOptions.current);
        } else {
            aOptions.min.setTime(aOptions.current)
        }
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = new Date(aOptions.current);
        } else {
            aOptions.max.setTime(aOptions.current.getTime());
        }
        self._period.prev.setTime(self._period.current.getTime());
        self._period.current.setTime(aOptions.current.getTime());
        if (self._parent.params.swimlaneScrolling) {
            aOptions.min[self._options.mode[self._format].func](-self._options.mode[self._format].change);
            aOptions.max[self._options.mode[self._format].func](self._options.mode[self._format].change);
            if (self._format == 'hour') {
                nWiderScrolling = Math.max(nWiderScrolling, parseInt(1400 / (self._inDayHours * self._hourCells * self._cellWidth)));
                aOptions.min.changeDate(-nWiderScrolling);
                if (nWeekDays != 7 && aOptions.min.getDay() == 0) {
                    aOptions.min.changeDate(-2);
                } 
                if (nWeekDays == 5 && aOptions.min.getDay() == 6) {
                    aOptions.min.changeDate(-2);
                }
                aOptions.max.changeDate(nWiderScrolling);
                if (nWeekDays == 5 && aOptions.max.getDay() == 6) {
                    aOptions.max.changeDate(2);
                }
                if (nWeekDays != 7 && aOptions.max.getDay() == 0) {
                    aOptions.max.changeDate(2);
                } 
            }
        }
//        aOptions.max.setTime(self._period.current.getTime());
       
        self._period.min.setTime(aOptions.min.getTime());
        self._period.max.setTime(aOptions.max.getTime());        
    }
    
    
    view.refresh = function(aParams) {
        self._offDayHours = parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._nLineHeight = self._eventHeight[self._parent.params.size];
        self._inDayHours = parseInt(self._parent.aCalculated.stopHour) - parseInt(self._parent.aCalculated.startHour);
        self._offDayHours = parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._hourCells = parseInt(60 / self._parent.params.minMinutePeriod);
        self._options.mode.hour.oneday = parseInt(self._parent.params.minMinutePeriod) / 3;
        self._nMaxHeight = 1;
        self._nMaxLine = 0;
        self._period.startH = parseInt(self._parent.aCalculated.startHour);
        self._period.stopH = parseInt(self._parent.aCalculated.stopHour);
        view.showData();
    }
    
    view.delEvent = function(mEventId) {
        if (typeof(mEventId) == 'string') {
            mEventId = [mEventId];
        }
        var sEvt = 'div.evt[data-event="' + mEventId.join('"], div.evt[data-event="') + '"]';
        self._dom.items.children('.title').find(sEvt).remove();
        self._dom.events.find(sEvt).parent().remove();
    }
    
    view.preparePrint = function(bMode) {
        self._expand(bMode);
    }
    
    view.clearView = function() {
        if (self._div == undefined) {
            return;
        }
        delete self._dom.form;
        delete self._dom.items;
        delete self._dom.date;
        delete self._dom.title;
        delete self._dom.events;
        self._aPresetRecords = {};
        self._aListViewRecords = {};
        //delete self._aPresets;
        
        self._dom = {};
        self._div = null;
        self._options.mode.hour.oneday = parseInt(self._parent.params.minMinutePeriod) / 3;
        self._hourCells = parseInt(60 / self._parent.params.minMinutePeriod);
//        self._offDayHours = !self._parent.params.ganttRespectHours 
//            ? 0
//            : parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._offDayHours = parseInt(self._parent.aCalculated.startHour) + (24 - parseInt(self._parent.aCalculated.stopHour));
        self._cellWidth = self._format == 'hour' ? 100 : parseInt(self._parent.getParam('swimlaneCell', '100'));
        self._initEvtCSS();
        
    }
    
    view.resetPreset = function(aPreset) {
        self._aPresetRecords = {};
        self._aListViewRecords = {};
        self._aPresets = aPreset;
        if (self._sMode == 'preset') {
            var oPreset = self._getPreset(self._group);
            if (oPreset == null) {
                self._typeSelector.find('option[value="' + self._group + '"]').remove();
                self._typeSelector.find('select').trigger('change');
//                self._sMode = null;
//                self._group =  "---";
            } else {
                view.showData();
            }
        } else {
            view.showData();
        }
    }
    
    
    view.getClickDate = function(oEvt) {
        var oCalculated = self._getPosition(oEvt);
        return {
            "date" : oCalculated.date,
            "hourly" : true
        }
    }
    
    view.preparePrintData = function(aParams) {
        aParams.filters = self._aCurrentFilters;
        aParams.groupId = self._aListViewIds;
        aParams.groupLabel = self._aSortedTitles;
        aParams.grouping = self._aCurrentGrouping;
        aParams.groupTitle = self._aListViewTitles;
        return aParams;
    }
    
    view.resize = function(){
        
        self._dom.whiteArea.height(self._nEventsHeight < self._dom.events.height() - self._parent.options.scrollWidth 
            ? self._dom.events.height() - self._nEventsHeight - self._parent.options.scrollWidth 
            : 0
        );
    }

/**
 * Init all default events
 *
 * @return {void}
 */
    
    self._initEvents  = function(){
//        if (jQuery.browser.opera != 'undefined' && jQuery.browser.opera) {
//            self._div.addClass('opera');
//        }
        self._typeSelector.on('change', 'select', function(){
            var el = jQuery(this),
                oSelected = el.find(":selected");
            self._sMode = oSelected.parent().data('type');
            if (self._sMode == 'preset' && el.val() == '0') {
                var aQ = [];
                if (self._parent.params.fastStart == true) {
                    aQ.push(self._parent._objects.refreshSimple);
                }
                aQ.push(self._showPresetsPopup);
                self._parent._addQueue(aQ);
                return;
            }
            
            self._group = el.val();
            self._parent.setLS('swimlaneSelectedFilterId', self._group);
//            self._parent.setSS('swimlaneSelectedFilterId', self._group);
//            try {
//                if (typeof(localStorage) != 'undefined' ) {
//                    localStorage.swimlaneSelectedFilterId = self._group;
//                }
//            } catch (e) {
//                //alert('LocalStorage is not supported');
//            }
            view.showData();
        });
        
        self._dom.mode.on('change', 'select', function(evt){
            self._div.removeClass('format_' + self._format).removeClass('cell_' + self._cellWidth);
            self._format = jQuery(this).val();
            self._cellWidth = self._format == 'hour' ? 100 : parseInt(self._parent.getParam('swimlaneCell', '100'));
            self._initEvtCSS();
            self._dom.dateTop.add(self._dom.dateBottom).add(self._dom.dateGrid).add(self._dom.events).html('');
            view.show();
            view.showData({date : self._period.current});
//            self._parent.setLS('swimlaneSelectedPeriod', self._format);
//            self._parent.setSS('swimlaneSelectedPeriod', self._format);
            
//            try {
//                if (typeof(localStorage) != 'undefined' ) {
//                    localStorage.swimlaneSelectedPeriod = self._format;
//                }
//            } catch (e) {}
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
                if (self._bSkipScroll) {
                    return;
                }
                self._aCurrentScrollPos.top = self._dom.events.scrollTop();
                self._aCurrentScrollPos.left = self._dom.events.scrollLeft();
                
                self._dom.date.scrollLeft(self._aCurrentScrollPos.left);
                self._dom.title.scrollTop(self._aCurrentScrollPos.top);
                if (self._parent.params.swimlaneScrolling == true) {
                    if (self._nScrollTimer != null) {
                        clearTimeout(self._nScrollTimer);
                        self._nScrollTimer = null;
                    }
                    self._nScrollTimer = setTimeout(function(){
    //                    console.log('scroll 2 ');
                        self._checkGridScrolling(evt);
                        self._nScrollTimer = null;
                    }, 100);
                }
            })
            .on('mouseenter', '.evt > div', function(){
                var oEl = jQuery(this).parents('.evt'),
                    aAllEls = self._findSimilarEl(oEl);
                aAllEls.addClass('_hover');
            })
            .on('mouseleave', '.evt > div', function(){
                var oEl = jQuery(this).parents('.evt'),
                    aAllEls = self._findSimilarEl(oEl);
                aAllEls.removeClass('_hover');
            });
            
//        self._wideSelector.on('click', function(){
//            self._div.toggleClass('_wide');
//        });
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
        var aEl, aTitles = {};
        aData = aData == undefined ? self._data : aData;
        for (var nI = 0; nI < aData.length; nI++) {
            aEl = aData[nI];
            if (aEl.group == undefined || aEl.group == '') {
                continue;
            }
            if (typeof(self._calendarsData[aEl.group]) == 'undefined') {
                self._calendarsData[aEl.group] = [];
            }
            self._calendarsData[aEl.group].push(aEl);
            aTitles[aEl.group] = aEl.group;
        }
        if (self._sMode == 'field') {
            self._aListViewTitles = aTitles;
            
        } else {
            aTitles = {};
            jQuery.each(self._aListViewTitles, function(sKey, sVal){
                aTitles[sVal] = sKey;
            });
        }
        self._aSortedTitles = aTitles;
        
        //aTitles = Array.objectValues(_aSortedTitles);
        
        
        
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
        self._dom.form = jQuery('<div class=swim_form></div>');
        self._dom.items = jQuery('<div class="swim_items">'
            + '<div class="title scroll_pos_b"></div>'
            + '<div class="events"></div>'        
            + '<div class="white_area scroll_pos_b scroll_pos_r"></div>'        
            + '</div>');
        self._dom.date = jQuery('<div class="swim_dates scroll_pos_b scroll_mar_r"></div>');
        
        self._div
            .append(self._dom.form)
            .append(self._dom.items)
            .append(self._dom.date)
            .append('<div class=gantt_dates_bg></div>')
            .append('<div class="swimlane_grid_scroll scroll_width"></div>');
        self._dom.title = self._dom.items.find('.title');
        self._dom.events = self._dom.items.find('.events');
        self._dom.whiteArea = self._dom.items.find('.white_area');
        
        self._buildForm();
        self._initEvents();
    }
    

/**
 * Build swicher between view mode
 *
 * @return {void}
 */
    
    self._buildForm = function (aFields){
        var sHtml = "<div class=CA_swimlane_selectbox> "
            + "<select title='" 
            + self._parent.getText('swimlane_predefined_set', 'Predefined set')
            + "'><option value=''>"
                + self._parent.getText('swimlane_loading', 'Loading')
                + "...</option>"
            + "</select>"
            + "</div>";
        
        self._typeSelector = jQuery(sHtml).appendTo(self._dom.form);
        self._dom.mode = jQuery("<div class=CA_swimlane_selectbox> "
            + "<select title='" + self._parent.getText('swimlane_predefined_set', 'Predefined set') + "'>"
                + "<option value='hour'>" + self._parent.getText('swimlane_by_hour', 'By hour') + "</option>"
                + "<option value='day' " + (self._format == 'day' ? "selected" : "") + ">"
                    + self._parent.getText('swimlane_by_day', 'By day')
                    + "</option>"
            + "</select>"
            + "</div>").appendTo(self._dom.form);
    }
    
    self._fillForm = function(aFields, aListviews, aPresets) {
        var sHTML = '', sVal;
        if (aListviews != undefined && aListviews.length > 0) {
            if (self._sMode == null || (self._sMode == 'field' && !aFields.hasOwnProperty())){
                sHTML += '<option value="">' + self._parent.getText('select', 'Select') + '...</option>';
                self._sMode = null;
            }
            sHTML += '<optgroup label="' 
                    + self._parent.getText('swimlane_user_list_views', 'User list views')
                    + '" data-type="listview">';
            for (var nJ = 0; nJ < aListviews.length; nJ++) {
                sVal = aListviews[nJ].label;
                sHTML += "<option  value=" + aListviews[nJ].id + " "
                    + (self._group == aListviews[nJ].id ? 'selected' : "")                
                    + ">" + sVal.htmlspecialchars();
            }
            sHTML += '</optgroup>';
        }
        sHTML += '<optgroup label="Swimlane Custom Group By" data-type="preset">';
        if (aPresets != undefined && aPresets.length > 0) {
            
            for (var nJ = 0; nJ < aPresets.length; nJ++) {
                sHTML += "<option  value=" + aPresets[nJ].id + " "
                    + (self._group == aPresets[nJ].id ? 'selected' : "")                
                    + ">" + aPresets[nJ].label.htmlspecialchars();
            }
        }
        
        sHTML += ''//'<option value=0>Manage Presets...'
                + '</optgroup>';
//                +'<optgroup label="User list views" data-type="field">';
//false && 
        if (self._parent.params.swimlaneEnableGroupBy == true 
            || (aListviews == undefined || aListviews.length < 1) && self._parent.params.insideEdit == '1'
        ) {
            sHTML += '<optgroup label="' 
                    + self._parent.getText('swimlane_group_by_fields', 'Group by field')
                    + '" data-type="field">';
            var aExternalFilterFields = self._parent.getViewSettings('swimlane', 'presetFields', null);
            if (aExternalFilterFields != null && typeof(aExternalFilterFields) == 'string') {
                aExternalFilterFields = aExternalFilterFields.split(',');
            }
            jQuery.each(aFields, function(sKey, aField) {
                if (aExternalFilterFields == null || aExternalFilterFields.indexOf(aField.name) >= 0) {
                    sHTML += "<option value=" + aField.name.htmlspecialchars() + " "
                        + (aField.isHTML === true ? 'data-html="true"' : "")
                        + (aField['type'] == 'REFERENCE' ? " class='_ref' " : "")
                        + (self._group == aField.name ? 'selected' : "")
                        + ">" + aField.label.htmlspecialchars()
                }
                if (aField['type'] == 'REFERENCE' && self._sBaseObject != "") {
                        var aRefFields = self._parent._objects.getLinkedObjectsFields(
                            aField, 
                            ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX'], 
                            true, 
                            self._sBaseObject
                        );
                        for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                            if (aExternalFilterFields == null 
                                || aExternalFilterFields.indexOf(aField.name + "." + aRefFields[nJ].name) >= 0
                            ) {
                            sHTML += '<option value="' + aField.name + '.' + aRefFields[nJ]['name'] + '" '
                                + (aRefFields[nJ].isHTML === true ? 'data-html="true"' : "")
                                + 'class="_sub_ref" '
                                + (aField.name + '.' + aRefFields[nJ].name == self._group ? 'selected' : '')
                                + '>&nbsp;&nbsp;&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
                            }
                        }
                    }  
            }); 
            sHTML += '</optgroup>';
        }
        self._typeSelector.find('select').html(sHTML);
        self._group = self._typeSelector.find('select').val();
        self._sMode = self._typeSelector.find('select option:selected').parent().data('type');
        if (self._sMode == null || self._sMode == 'undefined') {
            self._showEmptyMessage(
                self._parent.getText('message_please_select_list_view', 'Please select a user list from the drop-down'), 
                false
            );
        }
    }

/**
 * Build right head part  of Gantt
 *
 * @return {void}
 */

    self._buildRightHead = function(dCur){
        if (self._dom.date.html() == '') {
            self._dom.date.html(
                '<table><thead><tr class="_top_date"></tr>'
                + '<tr class="_bot_date"></tr>'
                + '</thead>'
                + '<tbody><tr><td class=scroll_width></td></tr></tbody></table>'
            ); 
            self._dom.dateTop = self._dom.date.find('tr._top_date');
            self._dom.dateBottom = self._dom.date.find('tr._bot_date');
            self._dom.dateGrid = self._dom.date.find('tbody tr');
        }
        if (!self._parent.params.swimlaneScrolling) {
            self._dom.dateTop.html('');
            self._dom.dateBottom.html('');
            self._dom.dateGrid.html('');
        }
        var funcName = "_buildRightHead" + self._format;
        if (typeof(self[funcName]) == 'function') {
            self[funcName](dCur);
        }
    }


    
    self._buildRightHeadhour = function(dCur){
        var oDayCell = self._dom.dateTop.children('[data-date="' + dCur.getTime() + '"]');
        if (oDayCell.size() > 0) {
            return;
        }
        
        var sHourFormat = self._parent.options.format.hourTitle,
            nColspan = parseInt(self._parent.aCalculated.stopHour - self._parent.aCalculated.startHour),
            nMaxColspan = parseInt(12 / self._hourCells),
            sTopHTML = '', 
            sBotHTML = '',
            nI,
            sGridStart = self._parent.params.nonWorkingHoursDisplay == 'paint'
                ? '<TD class="non_working">&nbsp;</TD>'
                    .repeat(self._parent.params.startHourPeriod - self._parent.aCalculated.startHour)
                    .replace('non_working', 'non_working _first')
                : "",
            sGridStop = self._parent.params.nonWorkingHoursDisplay == 'paint'
                ? "<TD class=non_working>&nbsp;</TD>".repeat(24 - self._parent.params.stopHourPeriod)
                : "",
            sGridHTML = sGridStart 
                + "<TD>&nbsp;</TD>".repeat(self._parent.params.nonWorkingHoursDisplay == 'paint'
                    ? self._parent.params.stopHourPeriod - self._parent.params.startHourPeriod 
                    : nColspan
                ) 
                + sGridStop;
        if (sGridStart == '') {
            sGridHTML = sGridHTML.replace('<TD>', '<TD class="_first">');
        }
        for (nI = 0; nI < nColspan; ) {
            var nRealColspan = nI + nMaxColspan < nColspan - 8 / self._hourCells ? nMaxColspan : nColspan - nI;
            sTopHTML += '<th colspan="' + nRealColspan + '" data-date="' + dCur.getTime() + '" '
                + 'class="'
                + (dCur.getTime() == self._parent.options.today.getTime() ? ' current ' : "")
                + (nI == 0 ? '_first ' : '')
                + '">' 
                + dCur.format(self._parent.options.format.fullDate) 
                + '</th>';
            nI+= nRealColspan;
        }
    
        var dTo = Date.baseDate(dCur, 1),
            dTmp = Date.baseDate(dCur, 0, self._parent.aCalculated.startHour),
            nTempHour;
        
        for (nI = 0; dTmp < dTo; dTmp.changeHour(1), nI++) {
            nTempHour = dTmp.getHours();
            if (self._parent.aCalculated.stopHour > 0 && dTmp.getHours() >= self._parent.aCalculated.stopHour) {
                break;
            }
            sBotHTML += "<TH "
                + ' data-d="' + (dTmp.getTime() / 1000) + '" '
                + ' data-date="' + dCur.getTime() + '" '
                + " class='"
                + (nTempHour < self._parent.params.startHourPeriod || nTempHour >= self._parent.params.stopHourPeriod
                    ? " non_working "
                    : ""
                ) 
                + (nI == 0 ? "_first " : "")
                + "'"
                + ">" + (dTmp.format(sHourFormat)) + "</TH>";
        }
        self._insertDateBlock(dCur, self._dom.dateTop, 'date', sTopHTML);
        self._insertDateBlock(dCur, self._dom.dateBottom, 'date', sBotHTML);
        self._dom.dateGrid.prepend(sGridHTML);
    }
    
    self._buildRightHeadday = function(dCur){
        var oDayCell = self._dom.dateTop.children('[data-date="' + dCur.getTime() + '"]');
        if (oDayCell.size() > 0) {
            oDayCell.toggleClass('current', self._period.current.getTime() == dCur.getTime());
            return;
        }
        
        var nMonthCells = dCur.getMonthDays(),
            nMaxColspan = parseInt(24 / (self._cellWidth / 50)),
            sTopHTML = '', 
            sBotHTML = '',
            sGridHTML = "";
        for (var nI = 0; nI < nMonthCells; ) {
            var nRealColspan = nI + nMaxColspan < nMonthCells - 8 ? nMaxColspan : nMonthCells - nI;
            sTopHTML += '<th colspan="' + nRealColspan + '" '
                + ' data-date="' + dCur.getTime() + '" '
                + 'class="'
                + (self._period.current.isSameMonth(dCur) ? ' current ' : "")
                + (nI == 0 ? ' _first ' : "")
                + '">' 
                + dCur.getMonthName() + " " + dCur.getFullYear()
                + '</th>';
            nI += nRealColspan;
        }
        var dTmp = Date.baseDate(dCur),
            nCurDay = self._parent.options.today.isSameMonth(dCur) ? self._parent.options.today.getDate() : null;
        for (var nI = 0; nI < nMonthCells; nI++, dTmp.changeDate(1)) {
            var nWeekDay = dTmp.getDay();
            sBotHTML += "<TH "
                + ' data-d="' + (dTmp.getTime() / 1000) + '" '
                + ' data-date="' + dCur.getTime() + '" '
                + ' class="'
                + (nI == 0 ? ' _first ' : "")
                + (nWeekDay == 6 || nWeekDay == 0 ? " non_working " : "")         
                + '">' + (1 + nI) + "</TH>";
            sGridHTML += "<TD "
                + ' data-date="' + dCur.getTime() + '" '
                + " class='" 
                + (nI == 0 ? ' _first ' : "")
                + (nCurDay != null && nCurDay == dTmp.getDate() ? " current " : "")         
                + (nWeekDay == 6 || nWeekDay == 0 ? " non_working " : "")         
                + "'>&nbsp;</TD>";
        }
        self._insertDateBlock(dCur, self._dom.dateTop, 'date', sTopHTML);
        self._insertDateBlock(dCur, self._dom.dateBottom, 'date', sBotHTML);
        self._insertDateBlock(dCur, self._dom.dateGrid, 'date', sGridHTML);
//        self._dom.dateGrid.prepend(sGridHTML);
    }
    
    self._insertDateBlock = function(dCur, oParent, sAttrName, sHTML) {
        var aChildren = oParent.children('[data-' + sAttrName + ']'),
            oPrev = Date.baseDate(dCur, -1),
            dNext = Date.baseDate(dCur, 1),
            oCurCell,
            oDayCell;
    
        if (aChildren.size() < 1) {
            oDayCell = jQuery(sHTML);
            oParent.prepend(oDayCell);
            return oDayCell;
        }
        oDayCell = aChildren.filter('[data-' + sAttrName + '="' + dCur.getTime() + '"]');
        if (oDayCell.size() > 0) {
            return oDayCell;
        }
        oDayCell = jQuery(sHTML);
        if ((oCurCell = aChildren.filter('[data-' + sAttrName + '="' + oPrev.getTime() + '"]')).size() > 0) {
            return oDayCell.insertAfter(oCurCell.last());
        } else if ((oCurCell = aChildren.filter('[data-' + sAttrName + '="' + dNext.getTime() + '"]')).size() > 0) {
            return oDayCell.insertBefore(oCurCell.first());
        }
        oCurCell = null;
        aChildren.each(function(sIdx, oCell) {
            oCell = jQuery(oCell);
            if (oCell.data(sAttrName) > dCur.getTime()) {
                return false;
            }
            oCurCell = oCell;
        });
        
        if (oCurCell != null) {
            oDayCell.insertAfter(oCurCell.last());
        } else {
            oDayCell.insertBefore(aChildren.first());
        }
        return oDayCell;
    }
    
    self._scrollCurrentTimeArea = function(dDate){
        dDate = dDate || self._period.current;
        if (self._format == 'day') {
            dDate.setDate(1);
        }
        if (self._dom.events != undefined 
            && self._parent.options.scrollLine != undefined 
            && self._parent.options.scrollLine > 0
        ) {
            self._stopCheckScrolling(true);
            self._nScroll = null;
            setTimeout(function(){
                var nSkipCell = 0;
                switch (self._format) {
                    case 'day' :
                        nSkipCell = self._parent.options.current.getDaysFrom(dDate) * self._cellWidth;
                        break;
                    case 'hour' :
                        var nHour = Date.baseDate().getHours();
                        if (nHour > self._period.stopH) {
                            nHour = self._period.stopH;
                        }
                        nHour -= self._period.startH;
                        nSkipCell = nHour * self._cellWidth * self._hourCells;
                        break;
                }
                var oCell = self._getDayCell(dDate, false),
                    nLeft = oCell != null 
                        ? oCell[0].offsetLeft 
                            - parseInt(self._dom.events[0].offsetWidth / 2) 
    //                        + parseInt(oCell[0].offsetWidth / 2)
                            + nSkipCell
                        : self._dom.events[0].scrollLeft;
                ;
                self._dom.events.scrollLeft(nLeft);
                self._dom.date.scrollLeft(nLeft);
                self._dom.title.scrollTop(self._dom.events.scrollTop());

                setTimeout(function(){
                    self._stopCheckScrolling(false);
                }, 50);
            }, 400);
        }
    }  
    
    
    
    self._buildLeftBody = function() {
        var sHTML = "", sTitle = '',
            aKeys = Array.objectKeys(self._aSortedTitles),
            bHTML = self._sMode == 'field' && self._typeSelector.find('select option:selected').data('html');
        aKeys.sort();
        for (var nJ = 0; nJ < aKeys.length; nJ++) {
            var sKey = self._aSortedTitles[aKeys[nJ]];
            sTitle = self._aListViewTitles[sKey] != undefined ? self._aListViewTitles[sKey] : sKey;
            sHTML += '<div '
                + ' data-group="' + sKey.htmlspecialchars() + '" '
                + ' data-id="' + (self._aListViewIds[sKey] != undefined 
                    ? self._aListViewIds[sKey] 
                    : "").htmlspecialchars() + '"'
                + '>'
                + (bHTML ? sTitle : sTitle.htmlspecialchars())
                + '</div>';
        }
//        jQuery.each(self._calendarsData, function(sKey, aEls) {
//            sTitle = self._aListViewTitles[sKey] != undefined ? self._aListViewTitles[sKey] : sKey;
//            sHTML += '<div data-group="' + sKey.htmlspecialchars() + '">'
//            + sTitle.htmlspecialchars()
//            + '</div>';
//        });
        self._dom.title.html(sHTML);
    }
    
    self._buildDataCells = function(aParams){
        var oDayCell,
            nScrollWidth = self._dom.events[0].scrollWidth,
            nWeekDays = self._format == 'hour' ? parseInt(self._parent.params.showWeekEnds) : null,
            oPrevDayCell;
        self._aGroupHeight = {};
        self._aGroupLines = {};
        if (!self._parent.params.swimlaneScrolling) {
            self._dom.events.html('');
        }
        self._stopCheckScrolling(true);
        
//            console.log('==' + dCur + ' / ' + self._format);
//        console.log('-- Min / Max ' + self._period.min + ' / ' + self._period.max);
        for (
            var dCur = Date.baseDate(self._period.min); 
            dCur <= self._period.max; 
            dCur[self._options.mode[self._format].func](self._options.mode[self._format].change)
//            self._format == 'hour' ? dCur.changeDate(1) : dCur.changeMonth(1)
        ) {
            if (self._format == 'hour') {
                if ((nWeekDays != 7 && dCur.getDay() == 0)
                    ||
                    (nWeekDays == 5 && dCur.getDay() == 6)
                ) {
                    continue;
                }
            }
            oDayCell = self._getDayCell(dCur);
            oDayCell.html(self._buildRightBody(dCur));
            self._aGroupLines = self._aGroupLinesTemporary;
            self._aGroupLinesTemporary = {};
            if (oPrevDayCell != undefined) {
                self._fillMultiCells(oPrevDayCell, oDayCell);
            }
            oPrevDayCell = oDayCell;
        }
        
        self._stopCheckScrolling(false);
        var aAddedHeight = [],
            nSumHeight = 0;
//        self._dom.events.find('._days > div').removeClass('_blank').each(function(nIdx, oEl){
//            
//            oEl = jQuery(oEl);
//            var sGroupName = oEl.data('group');
//            if (self._aGroupHeight[sGroupName] == undefined) {
//                oEl.height(0).addClass('_blank');
//                self._dom.title.children('[data-group="' + sGroupName + '"]').height(0);
//                return;
//            }
//            var oTitleEl = self._dom.title.children('[data-group="' + sGroupName + '"]'),
//                nH = Math.max(self._aGroupHeight[sGroupName] * self._nLineHeight, oTitleEl.height());
//                
//            oTitleEl.add(oEl).height(nH);
//            if (aAddedHeight.indexOf(sGroupName) < 0) {
//                aAddedHeight.push(sGroupName);
//                nSumHeight += nH + 1;
//            }
//            
//        })
        if (self._sMode != 'listview') {
            var aGroupKeys = Array.objectKeys(self._aGroupHeight);
            if (aGroupKeys.length > 0) {
                self._dom.events.find('._days > div').removeClass('_blank')
                    .not('[data-group="' + aGroupKeys.join('"],[data-group="') + '"]')
                    .addClass('_blank').height(0);
            } else {
                self._dom.events.find('._days > div').addClass('_blank').height(0);
            }
        } else {
            self._dom.events.find('._days > div._blank').removeClass('_blank');
        }
        
        
        
        self._dom.title.children().each(function(nIdx, oTitleEl){
            
            oTitleEl = jQuery(oTitleEl);
            var sGroupName = oTitleEl.data('group');
            
            
            if (self._aGroupHeight[sGroupName] == undefined) {
//                oEl.height(0).addClass('_blank');
                oTitleEl.height(0);
                return;
            }
            var oEl = self._dom.events.find('._days > div[data-group="' + sGroupName + '"]'),
                nH = Math.max(self._aGroupHeight[sGroupName] * self._nLineHeight, oTitleEl.height());
                
            oTitleEl.add(oEl).height(nH);
            if (aAddedHeight.indexOf(sGroupName) < 0) {
                aAddedHeight.push(sGroupName);
                nSumHeight += nH + 1;
            }
            
        });
        
        self._dom.whiteArea.height(nSumHeight < self._dom.events.height() - self._parent.options.scrollWidth 
            ? self._dom.events.height() - nSumHeight - self._parent.options.scrollWidth 
            : 0
        );
        self._nEventsHeight = nSumHeight;
//        if (nSumHeight < self._dom.events.height()) {
//            var oWhiteFiv = self._dom.events.children('._white_area');
//            if (oWhiteFiv.size() < 1) {
//                oWhiteFiv = jQuery('<span class="_white_area"></span>').appendTo(self._dom.events);
//            }
//            oWhiteFiv.height((self._dom.events.height() - nSumHeight));
//        }
        if (!self._bNoScroll) {
            self._scrollCurrentTimeArea();
        } else {
            var nLeft = self._dom.events.scrollLeft();
            if (self._period.prev > self._period.current && nScrollWidth < self._dom.events[0].scrollWidth) {
                nLeft += self._dom.events[0].scrollWidth - nScrollWidth;
            } 
            
            if (self._aCurrentScrollPos.top > 0) {
                self._dom.events.scrollTop(self._aCurrentScrollPos.top);
            }
            self._dom.title.scrollTop(self._dom.events.scrollTop());
            self._dom.events.scrollLeft(nLeft);
            self._dom.date.scrollLeft(nLeft);
            
//            console.log('scroll 1a');
            self._bNoScroll = false;
        }
        

    }
    
    self._getDayCell = function(dCur, bCreate) {
//        bCreate = bCreate === undefined ? bCreate : true;
        var sClass = '';
        if (bCreate === false) {
            var oCell = self._dom.events.children('[data-date="' + dCur.getTime() + '"]');
            return oCell.size() < 1 ? null : oCell;
        }
        var sCurrentClass = dCur.isSameDay(self._parent.options.now) ? '_current' : '';
        self._buildRightHead(dCur);
        if (self._format == 'day') {
            sCurrentClass += ' m' + dCur.getMonthDays();
        }
        return self._insertDateBlock(dCur, self._dom.events, 'date', "<div class='_days " + sCurrentClass + "' data-date='" + dCur.getTime() + "'></div>");
    }
    
    self._fillMultiCells = function(oPrev, oCurrent) {
        var oEl,
            aEvts = oPrev.find('.evt.full_r');
        oCurrent.find('.evt._multi').each(function(){
            oEl = jQuery(this);
            aEvts.filter('[data-event="' + oEl.data('event') + '"][data-calendar="' + oEl.data('calendar') + '"]')
                .addClass('_multi_prev')
//                    .not('._multi_next')
//                    .each(function(nFirst, oFirstEl){
//                        oFirstEl = jQuery(oFirstEl);
//                        if (oFirstEl.data('realw') > 0 && oFirstEl.data('subw') != oFirstEl.data('realw')) {
//                            oFirstEl
//                                .removeClass('w' + oFirstEl.data('subw'))
//                                .addClass('w' + oFirstEl.data('realw') + ' _real_multi_width');
//                                
//                        }
//                        console.log(jQuery(oFirstEl).data('realw'));
//                    });
        });
    }
    
 /**
 * Put events bars on grid
 *
 * @return {void}
 */
    
    self._buildRightBody = function(dCur) {
        var sHTML = "",
            aResult,
            nMaxLine = 0,
            nMaxHeight = 0,
            aKeys = Array.objectKeys(self._aSortedTitles);
        aKeys.sort();
        for (var nJ = 0; nJ < aKeys.length; nJ++) {
            var sKey = self._aSortedTitles[aKeys[nJ]];
            if (self._aGroupHeight[sKey] == undefined) {
                self._aGroupHeight[sKey] = 0;
            }
            self._aPrevLines = self._aGroupLines[sKey] != undefined ? self._aGroupLines[sKey] : {};
            self._aPrevLinesTemporary = {};
//        }
//        jQuery.each(self._calendarsData, function(sKey, aEls) {
            aResult = self._buildGroupData(self._calendarsData[sKey], dCur);
            sHTML += '<div data-group="' + sKey.htmlspecialchars() + '" '
                + ' data-id="' + (self._aListViewIds[sKey] != undefined 
                    ? self._aListViewIds[sKey] 
                    : "").htmlspecialchars() + '"'
//                + ' style="height:' + (aResult.height * self._nLineHeight) + 'px;" '
                + '>'
            + '<span class=_data>'
            + aResult.html
            + '</span>'
            + '</div>';
            self._aGroupHeight[sKey] = Math.max(self._aGroupHeight[sKey], aResult.height);
            nMaxLine = Math.max(nMaxLine, aResult.maxLine);
            nMaxHeight = Math.max(nMaxHeight, aResult.maxHeight);
            if (self._aPrevLinesTemporary != undefined) {
                self._aGroupLinesTemporary[sKey] = self._aPrevLinesTemporary;
            }
        }
        
        self._buildLineCSS(nMaxLine, nMaxHeight);
//        self._dom.events.html(sHTML);
        return sHTML;
        
    }
    
    self._buildGroupData = function(aEls, dCur) {
        var sHTML = '', aMatrix = [], aPos, nMax = 0, nMaxLine = 0, nMaxHeight = 0,
            dNext = Date.baseDate(dCur);
        if (self._format == 'hour') {
            dNext.changeDate(1);
        } else {
            dNext.changeMonth(1).setDate(1);
        }
        if (aEls != undefined) {
            self._aCheckCSS = [];
            for (var nI = 0; nI < aEls.length; nI++) {
                if (aEls[nI].dateStart >= dNext 
    //                || (aEls[nI].allDay == false && aEls[nI].dateEnd <= dCur && aEls[nI].dateEnd > aEls[nI].dateStart)
    //                || (aEls[nI].allDay == true && aEls[nI].dateEnd < dCur && aEls[nI].dateEnd > aEls[nI].dateStart)
                    || ((aEls[nI].dateEnd < dCur || aEls[nI].allDay == false && aEls[nI].dateEnd == dCur) && aEls[nI].dateEnd > aEls[nI].dateStart)
                ) {
                    continue;
                }
                aPos = self._buildBar(aEls[nI], aMatrix, dCur);
                if (aPos == null) {
                    continue;
                }
                nMax = Math.max(nMax, aPos.line + aPos.height);
                nMaxLine = Math.max(nMaxLine, aPos.line);
                nMaxHeight = Math.max(nMaxHeight, aPos.height);
                sHTML += aPos.html;
            }
            self._checkEvtCSS();
        }
        return {html : sHTML, height : nMax, maxLine : nMaxLine, maxHeight : nMaxHeight};
    }
    
    self._calculateEvent = function(aEl, aMatrix) {
        
    }

 /**
 * Put events bars on grid
 *
 * @param {JSON} el - current event
 * @return {JSON} generated DIV + params
 */

    self._buildBar = function(aEl, aMatrix, dCur) {
        if (typeof(aEl.dateStart) == 'undefined' || aEl.dateStart == '0') {
            return null;
        }
        var nAddLine = 3,
            sDetailsHTML = '',
            oCalendar = aEl.calendarid != undefined ? aEl.getCalendar()  : null; // self._parent._calendars.getCalendar(aEl.calendarid)
        if (oCalendar != null && oCalendar.additionalTitle != undefined ){
            sDetailsHTML = aEl.getAdditionalTitle({"showLabels" : self._parent.params.swimlaneFieldLabels});
            nAddLine += (sDetailsHTML != '' ? sDetailsHTML.split('<br>').length - 1 : 0);
            if (sDetailsHTML != '') {
                sDetailsHTML = '<span class="details">' + sDetailsHTML + '</span>';
            }
        }
        
        
        var aPos = self._getBarPos(aEl, aMatrix, nAddLine, dCur);
        
        if (aPos == null)     {
            return null;
        }
        if (aPos.full_r || aPos.no_multi_right === true) {
            self._aPrevLinesTemporary[aEl.calendarid + '_' + aEl.id] = aPos;
        }
        if (aPos.no_next_right === true) {
            return null;
        }
        
//        if (pos.x < 0) {
//            return '';
//        }
        var sDateTitle = (aPos.empty !== true ? self._showDateTitle(aEl, oCalendar, dCur).htmlspecialchars() : "<br>".repeat(nAddLine - 1)) ;
        if (sDateTitle == '' && nAddLine > 0) {
            nAddLine--;
        }
        var sHtml = "<div class='evt "
            + ' s' + aPos.start
            + ' w' + aPos.width
            + ' l' + aPos.line
            + ' h' + nAddLine
            + (aEl.allDay ? " all_day " : ' ' )    
            + (aPos.full_l ? ' full_l ' : '')
            + (aPos.full_r ? ' full_r ' : '')
            + ( aPos.empty === true ? ' _multi _multi_next' : "" )
            + ( aEl.addClass != undefined ? aEl.addClass + " " : ' ' )    
            + ( oCalendar != null && (oCalendar.editable !== true || oCalendar.move !== true) ? "non_e " : ' ' )    
            + ( aEl.noEnd != undefined && aEl.noEnd ? "non_r " : ' ' )
            + (self._parent.options.readonly === true || self._parent.options.readonly.move === false 
                ? ' non_e  non_r ' 
                : ''
            )    
            + ( aEl.lFixed === true ? "fixed_l " : ' ' )        
            + ( aEl.rFixed === true ? "fixed_r " : ' ' )        
    
//            + (aEl.dateStart < self._period.visualMin || pos.no_l === true ? "full_l " : "")
//            + (aEl.dateEnd > self._period.visualMax || pos.no_r === true ? "full_r " : "")
            + "' "
            + ' data-line="' + aPos.line + '" '
            + ' data-h="' + nAddLine + '" '
            + ' data-event="' + aEl.id + '" '
            + ' data-calendar="' + aEl.calendarid + '" '
            + ' data-start="' + ( aEl.dateStart.valueOf() / 1000 ) + '"'
            + ' data-end="' + ( aEl.dateEnd.valueOf() / 1000 ) + '"'
//            + ( aPos.realWidth != undefined ? ' data-realw="' + aPos.realWidth + '" data-subw="' + aPos.width + '"' : '')
            + " title='" + (oCalendar != null ? aEl.getTitle().htmlspecialchars() : "") + "'  "
            + ">"
            + '<div class="'
                + 'color_' + aEl.className 
                + (aEl.specColor != undefined && aEl.specColor != '' ? ' ' + self._parent._events.getEventColor(aEl.specColor) : '')
            + '">'
//            + '<b></b>'
            + '<span class="title">' 
            + (aPos.empty !== true 
                ? (oCalendar != null && oCalendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                : ""
            )
            + '</span>'
            + (sDateTitle != '' ? '<span class="dates">'  + sDateTitle + '</span>' : '')
            //+ (aPos.empty !== true ? self._showDateTitle(aEl, oCalendar, dCur).htmlspecialchars() : "<br>".repeat(nAddLine - 1)) 
            //+
            + (aPos.empty !== true 
                ? sDetailsHTML 
                : ""
            );

        
            
            
            
        sHtml += '</div>'
            + '<span class=l></span>'
            + '<span class=r></span>'        
            + "</div>";
        aPos.html = sHtml;
        aPos.height = nAddLine;
        self._aCheckCSS.push(aPos.width);
        return aPos;    
    }
    
    self._showDateTitle = function(aEl, oCalendar, dCur) {
        
        var dBaseDate = dCur == undefined ? self._period.visualMin : dCur,
            sResult = '';
        if (self._format != 'day'
            && aEl.allDay 
            && aEl.dateEnd.isSameDay(dBaseDate) 
            && aEl.dateStart.isSameDay(dBaseDate)
        ) {
            sResult =  'AllDay';
        } else if (self._format == 'day' 
            && aEl.allDay 
            && !self._parent.getParam('swimlaneOneDayAllDay', true)
            && aEl.dateEnd.isSameDay(aEl.dateStart)
        ){
            sResult =  '';
        } else {
            var sFormatStart = oCalendar != null && (aEl.allDay || oCalendar.st == 'DATE')
                    ? 'dateTitle'
                    : (((self._format == 'day' && aEl.dateEnd.isSameDay(aEl.dateStart))
                        || aEl.dateStart.isSameDay(dBaseDate))
                        && !self._parent.getParam('swimlaneDisplayStartEndDate', true)
                    ) 
                        ? 'hourTitle' 
                        : 'shortDatetime',
                sFormatEnd = oCalendar != null && (aEl.allDay || oCalendar.et == 'DATE')
                    ? 'dateTitle'
                    : (((self._format == 'day' && aEl.dateEnd.isSameDay(aEl.dateStart))
                        || aEl.dateEnd.isSameDay(dBaseDate)) 
                        && !self._parent.getParam('swimlaneDisplayStartEndDate', true)
                    ) 
                        ? 'hourTitle' 
                        : 'shortDatetime';
            sResult = aEl.dateStart.format(self._parent.options.format[sFormatStart])
                + ((aEl.dateStart.valueOf() != aEl.dateEnd.valueOf())
                ? '-' + aEl.dateEnd.format(self._parent.options.format[sFormatEnd])
                : "");
        }
        return sResult;
    }

 /**
 * Calculate position of bar
 *
 * @param {JSON} el - current event
 * @return {JSON} start X position and width of bar
 */

    self._getBarPos = function(aEl, aMatrix, nLines, dBaseDate) {
        var nFrom, nTo, nWidth, dStart, dEnd, 
            aResult = {start : 0, width : 0, line : 0, full_l : false, full_r : false},
            dBaseStart,
            dBaseEnd, dBlockEnd;
        if (aEl.dateEnd < dBaseDate) {
            return null;
        }
        switch (self._format) {
            case 'hour' :
                dBaseStart = Date.baseDate(dBaseDate).changeHour(self._period.startH),
                dBaseEnd = Date.baseDate(dBaseDate).changeHour(self._period.stopH);
                break;
            case 'day' :
                dBaseStart = Date.baseDate(dBaseDate),
                dBlockEnd = Date.baseDate(dBaseDate).changeMonth(1);
                dBaseEnd = self._bNonSplitMode
                    ? Date.baseDate(self._period.max).changeMonth(1)
                    : Date.baseDate(dBaseDate).changeMonth(1);
                //console.log('-- Min / Max ' + self._period.min + ' / ' + self._period.max);
                dBlockEnd.setDate(1);
                    
                dBaseStart.setDate(1);
                dBaseEnd.setDate(1);
                break;
        }
        
        if ((self._format == 'hour' &&  aEl.allDay) || (aEl.dateStart < dBaseStart && aEl.dateEnd > dBaseEnd)) {
            dStart = dBaseStart;
            dEnd = dBaseEnd;
        } else {
            dStart = Date.getMaxDate(aEl.dateStart, dBaseStart);
            dEnd = Date.getMinDate(aEl.dateEnd, dBaseEnd);
            if ((
                    dBaseStart > aEl.dateStart 
                        && (!aEl.allDay && dBaseStart >= aEl.dateEnd || dBaseStart > aEl.dateEnd)
                    ||
                    dBaseEnd <= aEl.dateStart && dBaseEnd <= aEl.dateEnd 
                )
            ) {
                return null;
            }
        }
        switch (self._format) {
            case 'hour' :
                if (aEl.allDay == true) {
                    nFrom = 0;
                    nTo = (self._parent.aCalculated.stopHour - self._parent.aCalculated.startHour) * self._hourCells;
                    aResult.full_l = !aEl.dateStart.isSameDay(dBaseStart);
                    aResult.full_r = !aEl.dateEnd.isSameDay(dBaseEnd) || (aEl.dateEnd.getTime() == dBaseEnd.getTime() && self._period.stopH == 24);
                } else {
                    nFrom = Math.floor(Math.max(0, dStart.getHoursFrom(dBaseStart, true)) * self._hourCells);
                    nTo = Math.max(0, Math.ceil(Math.min(self._parent.aCalculated.stopHour, dEnd.getHoursFrom(dBaseStart, true)) * self._hourCells));
//                    console.log('' + nFrom + ' / ' + nTo + ' / ' + dEnd + ' / ' + dBaseStart);
                    aResult.full_l = aEl.dateStart < dBaseStart;
                    aResult.full_r = aEl.dateEnd > dBaseEnd;
                }
                break;
            case 'day' :
                nFrom = dStart.getDaysFrom(dBaseStart, false);
                nTo = dEnd.getDaysFrom(dBaseStart, true) 
                        + ((
                                (!dEnd.isSameDay(dStart) && !dEnd.isMidNight() )
                                || (!dEnd.isSameDay(dStart) && aEl.allDay === true )
                            )
                            ? 1 
                            : 0);
                aResult.full_l = aEl.dateStart < dBaseStart;
                aResult.full_r = aEl.dateEnd > dBaseEnd || (aEl.allDay && aEl.dateEnd.isSameDay(dBaseEnd));
                if (self._bNonSplitMode) {
                    aResult.no_multi_right = aEl.dateEnd > dBlockEnd || (aEl.allDay && aEl.dateEnd.isSameDay(dBlockEnd));
                }
                
//                if (aResult.full_r) {
//                    aResult.realWidth = nTo 
//                            + aEl.dateEnd.getDaysFrom(dEnd, false) 
//                            - nFrom 
//                            + (nFrom >= nTo ? 1 : 0);
//                }
                break;
        }
        nWidth = nTo - nFrom + (nFrom >= nTo ? 1 : 0);
        aResult.start = nFrom;
        aResult.width = nWidth;
        
        if (aMatrix == null) {
            if (aEl.line != undefined) {
                aResult.line = aEl.line;
            }
            return aResult;
        }
        
//        console.log(aResult, dStart, self._period.visualMin);
        var nFound = 0, nCurrentLine = 0, bGood, nRealFound = null;
        if (self._aPrevLines[aEl.calendarid + '_' + aEl.id] != undefined) {
            
            nRealFound = self._aPrevLines[aEl.calendarid + '_' + aEl.id].line;
            aResult.empty = true;
            if (self._bNonSplitMode && self._format == 'day') {
                aResult.no_next_right = true;
            }
        } else if (aEl.line != undefined) {
            nRealFound = aEl.line;
        }
        if (nRealFound == null) {
//        debugger;
            do {
                bGood = true;
                if (aMatrix[nFound] == undefined) {
                } else {
                    for (var nJ = nFrom; nJ < nFrom + nWidth; nJ++){
                        if (aMatrix[nFound][nJ] != undefined) {
                            bGood = false;
                            break;
                        }
                    }
                    if (!bGood) {
                        nFound++;
                        continue;
                    }
                }
                nCurrentLine = nFound;
                for (nCurrentLine = nFound + 1; nCurrentLine < nFound + nLines; nCurrentLine++) {
                    bGood = true;
                    for (var nJ = nFrom; nJ < nFrom + nWidth; nJ++){
                        if (aMatrix[nCurrentLine] != undefined && aMatrix[nCurrentLine][nJ] != undefined) {
                            bGood = false;
                            break;
                        }
                    }
                    if (!bGood) {
                        nFound++;
                        break;
                    }
                }
                if (bGood && nCurrentLine >= nFound + nLines) {
                    nRealFound = nFound;
                }
            } while (nRealFound == null);
        }
        for (nCurrentLine = nRealFound;  nCurrentLine < nRealFound + nLines; nCurrentLine++){
            if (aMatrix[nCurrentLine] == undefined) {
                aMatrix[nCurrentLine] = [];
            }
            for (var nJ = nFrom; nJ < nFrom + nWidth; nJ++){
                aMatrix[nCurrentLine][nJ] = 1;
            }
        }
        aResult.line = nRealFound;
        return aResult;
    }

    self._getPosition = function(evt) {
        var dt = new Date(),
            oTargetEl = jQuery(evt.target),
            oDayGroupEl = oTargetEl.hasClass('_days') ? oTargetEl : oTargetEl.parents('._days'),
            oGroupEl = oTargetEl.data('group') != undefined ? oTargetEl : oTargetEl.parents('[data-group]'),
//            divWeek = el.hasClass('events') ? el : el.parents('.events'),
            divWeek = self._dom.events,
            aCalculated = (self._cacheCoords == undefined || dt.getTime() - 1000 > self._cacheCoords.dt) 
                ? self._cacheCoords = self._getCalculatedOffset(divWeek, dt)
                : self._cacheCoords,
            xCoord = evt.clientX - aCalculated.aOffset.left + aCalculated.nScroll,
            nCoordHour = parseInt(xCoord / aCalculated.nCellWidth) % (self._inDayHours * self._hourCells),
            nHour = (xCoord % self._nBlockWidth == 0
                ? self._period.stopH * self._hourCells - 1 
                : nCoordHour + self._period.startH * self._hourCells
            ),
            dResult;
//    console.log('=pos ' + nHour + ' / ' + self._hourCells + ' / ' + (nHour / self._hourCells));
        switch(self._format) {
            case 'hour':
                dResult = Date.baseDate(oDayGroupEl.data('date') / 1000).changeHour(nHour / self._hourCells);
//                console.log('=' + dResult);
                break;
            case 'day' :
                nHour = parseInt((xCoord - oDayGroupEl[0].offsetLeft) / self._cellWidth);
                dResult = Date.baseDate(oDayGroupEl.data('date') / 1000).changeDate(nHour);
        }
//    console.log(oDayGroupEl[0].offsetLeft ,  xCoord);
//        console.log(oDayGroupEl.parent().data('date'), oDayGroupEl.position(), nHour);
//console.log(nHour / self._hourCells, '' + Date.baseDate(oDayGroupEl.parent().data('date') / 1000));
        return {
            "hour"      : nHour,
            "divWeek"   : divWeek, 
            "divGroup"  : oDayGroupEl,
            "divRealGroup" : oGroupEl,
            "date"      : dResult,
            "x"         : xCoord
        }
    }
        
    self._getCalculatedOffset = function(divWeek, dt) {
        return {
            nCellWidth : self._cellWidth,
            aOffset : divWeek.offset(),
            nScroll : divWeek[0].scrollLeft,
            dt : dt.getTime()
        }        
    }

    
    self._initDragEvent = function() {
        var nScrollCoordY = 0,
            nScrollCoordX = 0;
        var _updateTopEventBar = function(aParams) {
            var aCalculated,
                aGroupDay = aParams.bar.parents('._days'),
                dBaseDate = new Date(aGroupDay.data('date'));
            if (aParams.bar.data('s') == undefined) {
                aCalculated = self._getBarPos({
                        dateStart : new Date(aParams.bar.data('start') * 1000),
                        dateEnd : new Date(aParams.bar.data('end') * 1000),
                        allDay : self._format == 'day'
                                //self._format == 'day'
                    }, 
                    null,
                    0,
                    dBaseDate
                );
                aParams.bar.data({"s" : aCalculated.start , "w" : aCalculated.width});     
            } 
//            else {
                aCalculated = self._getBarPos(
                    aParams,
                    null,
                    0,
                    dBaseDate
                );
//            }
            if (aCalculated == null) {
                return;
            }
            aParams.bar
                .removeClass('full_l full_r s' + aParams.bar.data('s') + ' w' + aParams.bar.data('w'))
                .addClass(' ' 
                    + (aCalculated.full_l ? "full_l " : "")
                    + (aCalculated.full_r ? "full_r " : "")
                    + "s" + aCalculated.start + ' ' 
                    + "w" + aCalculated.width + ' ' 
                ).data({"s" : aCalculated.start , "w" : aCalculated.width});
            aParams.bar.find('.dates').text(self._showDateTitle(aParams));
            self._checkEvtCSS(aCalculated.width);
        }        
        
        var _addEventBar = function(aParams, oEventDiv) {
//            var aHTMLData = self._buildBar(aParams, null, Date.baseDate(aParams.dateStart).resetHours()),
            self._aCheckCSS.length = 0;;
            
            var aHTMLData = self._buildBar(aParams, null, new Date(oEventDiv.parent().data('date'))),
                oDiv = aHTMLData != null ? jQuery(aHTMLData.html) : null;
//            console.log(aParams, oEventDiv.parent().data('date'));
            
            if (oDiv != null) {
                self._buildLineCSS(aParams.line, 3);
                oEventDiv.children('._data').append(oDiv);
                self._dom.title.children('[data-group="' + oEventDiv.data('group') + '"]').addClass('new_events');
                self._checkEvtCSS();
            }
            return oDiv;
        }
        
        var _barMove = function(el, evt) {
            var aNew = self._getPosition(evt),
                nChange, 
                dStart = Date.baseDate(el.data('startDate')), 
                dEnd = Date.baseDate(el.data('endDate')),
                sCurrentGroup = aNew.divRealGroup.data('group');
            switch (self._format) {
                case 'hour' :
                    nChange = -el.data('baseDate').getHoursFrom(aNew.date, true);
                    dStart.changeHour(el.data('resizeL') != false ? nChange : 0);
                    dEnd.changeHour(el.data('resizeL') != true ? nChange : 0);
                    break;
                case 'day' :
                    nChange = -el.data('baseDate').getDaysFrom(aNew.date);
                    dStart.changeDate(el.data('resizeL') != false ? nChange : 0);
                    dEnd.changeDate(el.data('resizeL') != true ? nChange : 0);
                    break;
            }
            
            if (dStart > dEnd) {
                Date.swap(dStart, dEnd);
            }
            if (el.data('bar') == undefined || el.data('bar') == null) {
                el.data('startDate', dStart);
                if (nChange > 0) {
                    el.data('endDate', Date.baseDate(dEnd));
                    if (self._format == 'hour') {
                        dEnd.changeHour(1 / self._hourCells);
                    } else {
                        dEnd.changeDate(1);
                    }
                }
                var oDiv = jQuery(evt.target),
                    nY = parseInt((evt.clientY - oDiv.offset().top) / self._nLineHeight),
                    nMax = Math.max(0, parseInt(oDiv.height() / self._nLineHeight) - 3);
                nY = Math.min(nY, nMax);
                var oAddedBar = _addEventBar({
                    dateStart   : dStart, 
                    dateEnd     : dEnd,
                    line        : nY,
                    title       : self._parent.getText('custom_create_new', 'Create new'),
                    hoverTitle  : self._parent.getText('custom_create_new', 'Create new'),
                    addClass    : "new_event create_event l" + nY,
                    allDay      : self._format == 'day',
                            //self._format == 'day',
                    color       : ""
                }, jQuery(evt.target));
                if (oAddedBar == null) {
                    return false;
                }
                el.data('bar', oAddedBar);
            } 
//            el.data('bar').addClass('new_event')
//                .parent().parent().addClass('new_events');
            var oNewEventsDiv = el.data('bar').addClass('new_event').parent().parent(),
                sGroup = el.data('curGroup');
            
            if (sCurrentGroup != sGroup) { // Change Grouping Block, move bars from one block to another
                var nYFrom = el.data('curGrDiv').offset().top,
                    nYTo = aNew.divRealGroup.offset().top,
                    nNewLine = nYTo > nYFrom 
                        ? 0 
                        : parseInt((nYFrom - nYTo) / self._nLineHeight) - el.data('bar').data('h');
                el.data('curGrDiv').removeClass('new_events');
                el.data('curGrDiv', aNew.divRealGroup);
                el.data('curGroup', sCurrentGroup);
                self._dom.events.find('.new_event').each(function(nIdx, oEl){
                    oEl = jQuery(oEl);
                    var oParent = oEl.parent().parent(),
                        oNewDiv = oParent.siblings('[data-group="' + sCurrentGroup + '"]');
                    if (oNewDiv.size() > 0) {
                        oParent.removeClass('new_events');
                        oEl.detach()
                            .removeClass('l' + oEl.data('line'))
                            .addClass('l' + nNewLine).data('line', nNewLine)
                            .appendTo(oNewDiv.children('._data'));
                        oNewDiv.addClass('new_events');
                    }
                });
//                el.data('bar').detach().appendTo(aNew.divRealGroup.children('._data'));
                oNewEventsDiv = aNew.divRealGroup;
                self._dom.title.children('[data-group="' + sGroup + '"]').removeClass('new_events');
                self._dom.title.children('[data-group="' + sCurrentGroup + '"]').addClass('new_events');
                sGroup = sCurrentGroup;
                
            }
            var nCurrentH = oNewEventsDiv.height(),
                aBars = self._findSimilarEl(el.data('bar')).addClass('_checking'),
                oEvent;
            
            oNewEventsDiv.addClass('new_events');
            if (oNewEventsDiv.height() > nCurrentH) {
                self._nEventsHeight +=  (oNewEventsDiv.height() - nCurrentH);
                view.resize();
            }

//            console.log('' + dStart + ' / ' + dEnd);
            var dBase = Date.baseDate(dStart).resetHours();
            if (self._format == 'day') {
                dBase.setDate(1);
            }
            for (; dBase <= dEnd; self._format == 'day' ? dBase.changeMonth(1) : dBase.changeDate(1)) {
                var oBlock = self._getDayCell(dBase, false);
                if (oBlock == null || oBlock.size() == 0) {
                    continue;
                }
                var oBlockEl = oBlock.find('.new_event');
                if (oBlockEl.size() < 1) {
                    var nY = el.data('bar').data('line'),
                        aAddParams = {
                            dateStart   : dStart, 
                            dateEnd     : dEnd,
                            line        : nY,
                            title       : self._parent.getText('custom_create_new', 'Create new'),
                            hoverTitle  : self._parent.getText('custom_create_new', 'Create new'),
                            addClass    : "new_event create_event l" + nY + ' h' + el.data('bar').data('h'),
                            allDay      : self._format == 'day',
                                        //self._format == 'day',
                            color       : ""
                        };
                    if (el.data('bar').data('event') != undefined && el.data('bar').data('event') != 'undefined') {
                        if (oEvent == undefined) {
                            oEvent = self._parent._events.getEvent(el.data('bar').data('event'), el.data('bar').data('calendar'));
                            if (oEvent != undefined && oEvent.length > 0) {
                                oEvent = oEvent[0];
                            } else {
                                oEvent = {
                                    id : el.data('bar').data('event'),
                                    calendarid : el.data('bar').data('calendar'),
                                    className : el.data('bar').data('calendar')
                                };
                            }
//                            console.log(oEvent, el.data('bar').data('event'), el.data('bar').data('calendar'));
                        }
                        aAddParams = jQuery.extend({}, oEvent, aAddParams);
                    }
                    oBlockEl = _addEventBar(aAddParams, oBlock.children('[data-group="' + sGroup + '"]'));
                    oBlock.children('[data-group="' + sGroup + '"]').addClass('new_events');
//                    aBars.add(oBlockEl);
//                    console.log(oBlock.children('[data-group="' + sGroup + '"]'), oAddedBar);
                } else {
                    _updateTopEventBar({
                        bar         : oBlockEl,
                        dateStart   : dStart, 
                        dateEnd     : dEnd,
                        allDay      : self._format == 'day'
                        //self._format == 'day'
                    });
                }
                if (oBlockEl != null) {
//                    console.log('== ' + dStart + ' / ' + dEnd);
                    oBlockEl.removeClass('_checking');
                }
                if (self._bNonSplitMode && self._format == 'day') {
                    break;
                }
            }
            
            aBars.filter('._checking').remove().parents('.new_events').remove();
            aBars = self._findSimilarEl({
                group : sGroup, 
                event : el.data('bar').data('event'), 
                calendar : el.data('bar').data('calendar')
            });
            aBars.eq(0).removeClass('_duplicate');
            aBars.not(aBars.eq(0)).addClass('_duplicate');
            if (el.data('bar').parent().size() < 1) {
                el.data('bar', aBars.eq(0));
            }
//            console.log(aBars);
//            aBars.each(function(sIds, aEl){
//                aEl = jQuery(aEl);
//                if (aEl)
//            });
//            
            return false;
        }      
        self._dom.events.simpleSelect({
            "selector"      : '._data .evt, ._days > div',        // selector for start drag event
            "moveSelector"  : '> div > div',     // selector for continue drag event
            "notselector"   : ".non_e, .create_event",     // means that noneditbale event cannot be moved
            "touchhold"     : 1000,             // minimum time that activate "touchhold" event
            "touchradius"   : 10,             // maximum radius for moving finger 
            "clearStop"     : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                self._clearCreatingEvent(el);
                var aNew = self._getPosition(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    oBar = evtEl.hasClass('evt') && !evtEl.hasClass('create_event') ? evtEl : null,
                    bResize = !evtEl.hasClass('non_r') && jQuery(evt.target).filter('span.l, span.r').size() > 0
                        ? jQuery(evt.target).filter('span.l').size() > 0
                        : null,
                    sGroup = oBar == null ? jQuery(evt.target).data('group') : oBar.parents('._data').parent().data('group'),
                    dStart = oBar == null ? aNew.date : new Date(evtEl.data('start') * 1000),
                    dEnd = oBar == null 
//                                    ? Date.baseDate(aNew.date, (self._format != 'hour' ? 1 : 0), (self._format == 'hour' ? 1 / self._hourCells : 0))
                                    ? Date.baseDate(aNew.date, (self._format != 'hour' ? 0 : 0), (self._format == 'hour' ? 1 / self._hourCells : 0))
                                    : new Date(evtEl.data('end') * 1000);
                
                if (oBar != null && oBar.hasClass('_multi')) {
                    oBar = self._dom.events.find('._days > div[data-group="' + sGroup + '"] '
                                + '.evt[data-calendar="' + oBar.data('calendar') + '"][data-event="' + oBar.data('event') + '"]');
                }
                el.data({
                    fixedL      : oBar != null && oBar.is('.fixed_l, .fixed_r') ? oBar.is('.fixed_l') : null,
                    resizeL     : oBar == null ? false : bResize , 
                    currentDay  : aNew.date,
                    baseDate    : aNew.date,
                    startDate   : dStart,
                    endDate     : dEnd,
                    bar         : oBar,
                    creating    : oBar == null,
                    noCancel    : false,
                    noChange    : true,
                    startX      : aNew.x,
                    startGrDiv  : aNew.divRealGroup,
                    curGrDiv    : aNew.divRealGroup,
                    startGroup  : sGroup,
                    curGroup    : sGroup
                });
                
                if (oBar == null && self._parent.options.readonly.create === false) {
                    return false;
                }
                if (self._parent.isMobile() || oBar == null || self._parent.getParam('longClick', false)) {
                    _barMove(el, evt);
                } 
                return false;
            },
            "stop" : function(el, evt){
                if (el.data('creating') && self._parent.options.readonly.create === false) {
                    return false;
                }
                
                var aNew = self._getPosition(evt),
                    dCurrent = aNew.date,
                    sCurrentGroup = aNew.divRealGroup.data('group'),
                    nChange = self._format == 'hour'
                        ? -el.data('baseDate').getHoursFrom(dCurrent, true)
                        : -el.data('baseDate').getDaysFrom(dCurrent),
                    sFieldName = 
                            self._sMode == 'listview' 
                            ? 'ownerid' 
                            : self._group,
                    sValue = '' + el.data('bar').parents('[data-group]').data('group'),
                    sId = '' + el.data('bar').parents('[data-group]').data('id');
                nChange = parseFloat(nChange);
                if (self._sMode == 'preset') {
                    var aPreset = self._getPreset(self._group);
                    sFieldName = aPreset['filters'][0]['field'];
                }
                
                if (sId == '' && self._sMode == 'field' && self._group.indexOf('.') < 0) {
                    var aGroupingField = self._parent._objects.getObjectFieldByName(self._sBaseObject, self._group);
                    if (aGroupingField.type != 'REFERENCE') {
                        sId = sValue;
                    }
                }
                if (nChange == 0 && !el.data('creating') && sCurrentGroup == el.data('startGroup')) {
                    var aBars = self._findSimilarEl(el.data('bar')).filter('._multi_next'),
                        nHeight = aBars.eq(0).data('h') - 1;
//                console.log(aBars);
                    self._dom.events.find('.new_events').removeClass('new_events').find('.new_event').removeClass('new_event _duplicate');
                    aBars.find('.dates').html("<br>".repeat(nHeight));
                    self._clearCreatingEvent();
                    return true;
                }
                el.data('noChange', false);
                
                self._bNoScroll = true;
                

                if (el.data('creating')) {
                    var dStart = Date.baseDate(el.data('startDate')),
                        dEnd = Date.baseDate(el.data('endDate'));
                    if (self._format == 'hour') {
                        dEnd.changeHour(el.data('resizeL') != true  ? nChange : 0)
                    } else {
                        dEnd.changeDate(el.data('resizeL') != true  ? nChange : 0)
                    }

                    if (dEnd < dStart) {
                        Date.swap(dEnd, dStart);
                    }
//                    if (self._format != 'hour' && dEnd != dStart) {
//                        dEnd.changeDate(-1);
//                    }
                    el.data('noCancel', true);
                    _barMove(el, evt);
                    var aPredefine = [];
                    
                    if (self._parent.params.swimlanePreset == true && sId != undefined && sId != '') {
                        aPredefine.push({
                            name    : sFieldName, 
                            value   : sId,
                            oper    : "equal",
                            text    : sValue,
                            calendarFieldName : self._aCurrentGrouping
                        });
                    }
                    self._parent.layout.showCreateEventForm({
                        "cid" : "",
                        "date" : {"start" : dStart, "stop" : dEnd},
                        "el" : null,
                        "onClose" : function(evt) {
                            view.showData();
                            self._clearCreatingEvent();
                        }, 
                        "onCancel" : function(evt) {
                            self._clearCreatingEvent();
                        }, 
                        "event"         : evt,
                        "allDay"        : self._format != 'hour',
                        "predefine"     : aPredefine,
                        "setPredefine"  : self._parent.params.swimlanePreset == true
                    });
                    
                } else {
                    var aEvents = {"type" : "list_with_calendars"},
                        bChangeField = (sCurrentGroup != el.data('startGroup') && sFieldName.indexOf('.') < 0),
                        aChangedFieldsValues = {},
                        sCurrentGroupFld;
                    aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                    if (bChangeField) {
                        sCurrentGroupFld = self._aCurrentGrouping[el.data('bar').data('calendar')];
                        if (typeof(aChangedFieldsValues[el.data('bar').data('event')]) == 'undefined') {
                            aChangedFieldsValues[el.data('bar').data('event')] = {};
                        }
                        aChangedFieldsValues[el.data('bar').data('event')][self._aCurrentGrouping[el.data('bar').data('calendar')]] = sId;
                    }
                    self._dom.events.find('.evt.sel[data-event]').each(function(){
                        var sEventId = jQuery(this).data('event'),
                            sCalendar = jQuery(this).data('calendar')
                        if (aEvents[sEventId] == undefined || aEvents[sEventId].indexOf(sCalendar) < 0) {
                            if (aEvents[sEventId] == undefined) {
                                aEvents[sEventId] = [];
                            }
                            aEvents[sEventId].push(sCalendar);
                            if (bChangeField) {
                                if (typeof(aChangedFieldsValues[sEventId]) == 'undefined') {
                                    aChangedFieldsValues[sEventId] = {};
                                }
                                if (aChangedFieldsValues[sEventId][self._aCurrentGrouping[sCalendar]] == undefined) {
                                    aChangedFieldsValues[sEventId][self._aCurrentGrouping[sCalendar]] = sId;
                                }
                            }
                            
                        }
                    });                  
//                    console.log(el.data('resizeL') , nChange);

                    var aChange = {};
                    if (self._format == 'hour') {
                        aChange =  {
                            hour_left_change    : (el.data('resizeL') != false ? nChange : 0),
                            hour_right_change   : (el.data('resizeL') != true ? nChange : 0)
                        };
                    } else {
                        aChange =  {
                            day_left_change     : (el.data('resizeL') != false ? nChange : 0),
                            day_right_change    : (el.data('resizeL') != true ? nChange : 0)
                        };
                    }
                    if (!jQuery.isEmptyObject(aChangedFieldsValues)) {
                        aChange.fields = aChangedFieldsValues;
                    }
//                    if (sCurrentGroup != el.data('startGroup') && sFieldName.indexOf('.') < 0) {
//                        aChange.change_field_name = sFieldName;
//                        aChange.change_field_value = sId;
//                    }
                    self._parent._events.setEvent(aEvents, aChange);
                }
                return false;
            },
            "cancel" : function(el, evt){
                if (el.data('noCancel') != undefined && el.data('noCancel')) {
                    return false;
                }
                self._clearCreatingEvent();
                if (el.data('noChange') !== true || evt.type == 'mouseleave') {
                    self._nScroll = self._dom.date.scrollLeft();
                    view.showData();
                }
            },
            "move" : function(el, evt) {
                if (el.data('creating') && self._parent.options.readonly.create === false) {
                    return false;
                }
                return _barMove(el, evt);
            },
            "check" : function(el, evt) {
                var bChange = self._isCellChange(el, evt);
//                if (bChange) {
//                    console.log('== change ' + bChange);
//                }
                return bChange;
            },
//            "swipe" : function(el, evt, aDelta) {
//                if (!self._parent.isMobile()) {
//                    return false;
//                }
//                
//                return self._swipe(el, evt, aDelta);
//            },
//            "swipeDelta" : {x : 100, y : 30},
            "scroll" : function(el, evt, aDelta, sMode) {
                if (sMode != undefined && sMode == 'init') {
                    nScrollCoordY = self._dom.events.scrollTop();
                    nScrollCoordX = self._dom.events.scrollLeft();
                    return;
                }
                self._dom.events.scrollTop(nScrollCoordY - aDelta.y).scrollLeft(nScrollCoordX - aDelta.x);
                
            },
        });
    }
    
    self._isCellChange = function(el, evt) {
        var dOld = el.data('currentDay'),
            aNew = self._getPosition(evt),
            dPrevDay = el.data('currentDay');
        el.data('currentDay', aNew.date);
        var bResult = (dOld.getTime() != aNew.date.getTime());
        if (!el.data('creating')) {
            var sOldGroup = el.data('curGroup');
            if (aNew.divRealGroup.data('group') != sOldGroup) {
                bResult = true;
            }
        }
        
        if (!bResult && el.data('creating')) {
//            if (Math.abs(el.data('startX') - aNew.x) > 10 && el.data('endDate').getTime() == el.data('startDate').getTime()) {
//                el.data('endDate').changeHour(1 / self._hourCells);
//                return true;
//            } else if (Math.abs(el.data('startX') - aNew.x) < 10 && el.data('endDate').getTime() != el.data('startDate').getTime()) {
//                el.data('endDate').changeHour(-1 / self._hourCells);
//                return true;
//            }
        } else if (el.data('creating') && aNew.x < el.data('startX')) {
            if (
                (dPrevDay.getTime() == el.data('startDate').getTime() && el.data('endDate') != el.data('startDate'))
                || aNew.date.getTime() == el.data('endDate').getTime()
            ) {
                Date.swap(el.data('startDate'), el.data('endDate'));
            }
        }
        return bResult;
    }
    
    self._swipe = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
        } 
    }
    
    self._clearCreatingEvent = function(oEl){
        var aDiv = self._dom.events.find('.new_events'),
            nCurrentH = aDiv.height();
        aDiv.removeClass('new_events');
        if (aDiv.height() < nCurrentH) {
            self._nEventsHeight -=  (nCurrentH - aDiv.height());
            view.resize();
        }
        aDiv.find('.create_event').remove();
        self._dom.title.find('.new_events').removeClass('new_events');
        //self._dom.events.find('')
        if (oEl != undefined) {
            self._dom.events.find('.new_event').removeClass('new_event');
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
    
    self._getCalendarsForGroup = function(aGroups) {
        var aResult = [];
        for (var nI = 0; nI < aGroups.length; nI++) {
            var aGroup = self._parent._calendars.getCalendar(aGroups[nI]);
            aResult = aResult.concat(aGroup.calendarsList);
        }
        return aResult;
    }
    
//    self._setCalendar2Group = function(aGroups) {
//        self._aCalendat2Group = {};
//        for (var nI = 0; nI < aGroups.length; nI++) {
//            var aGroup = self._parent._calendars.getCalendar(aGroups[nI]);
//            for (var nJ = 0; nJ < aGroup.calendarsList.length; nJ++) {
//                if (self._aCalendat2Group[aGroup.calendarsList[nJ]] == undefined) {
//                    self._aCalendat2Group[aGroup.calendarsList[nJ]] = [];
//                }
//                self._aCalendat2Group[aGroup.calendarsList[nJ]].push(aGroups[nI]);
//            }
//        }
//    }
    
    self._initEvtCSS = function(){
        var nStart, nStop, nCell;
        self._aWidthCSS.length = 0;
        switch (self._format) {
            case 'hour':
                nStart = parseInt(self._parent.aCalculated.startHour) * self._hourCells;
                nStop = parseInt(self._parent.aCalculated.stopHour) * self._hourCells;
//                nCell = parseInt(100 / (self._parent.aCalculated.stopHour - nStart)) * self._hourCells;
                break;
            case 'day':
                nStart = 0;
                nStop = 32;
                break;
        }
            
    
        nCell = self._cellWidth;
        self._nBlockWidth = ((nStop - nStart) * nCell);
        changeCssClass(
            '.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events > div', 
            'width:' + self._nBlockWidth + 'px',
            false
        );
        var aClass = [], aRule = [];
            
        for (var nI = nStart; nI <= nStop; nI++) {
            aClass.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events .s' + (nI - nStart ));
            aRule.push('left:' + ((nI - nStart) * nCell) + 'px');
            aClass.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events .w' + (nI - nStart));
            aRule.push('min-width:' + ((nI - nStart) * nCell - 2) + 'px');
            self._aWidthCSS[nI - nStart] = nI - nStart;
        }
        changeCssClass(aClass, aRule, false);
    }
    
    self._checkEvtCSS = function(nW){
        var aCheck = nW == undefined
                ? self._aCheckCSS.unique().diff(self._aWidthCSS)
                : (self._aWidthCSS[nW] == undefined ? [nW] : []);
        if (aCheck.length < 1) {
            return;
        }
        var aClass = [], aRule = [];
        for (var nJ = 0; nJ < aCheck.length; nJ++) {
            aClass.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events .s' + aCheck[nJ]);
            aRule.push('left:' + (aCheck[nJ] * self._cellWidth) + 'px');
            aClass.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events .w' + aCheck[nJ]);
            aRule.push('min-width:' + (aCheck[nJ] * self._cellWidth - 2) + 'px');
            self._aWidthCSS[aCheck[nJ]] = aCheck[nJ];
        }
        changeCssClass(aClass, aRule, false);
    }
    
    self._buildLineCSS = function(nLines, nHeight) {
        var aClass = [], aRule = [];
        for (; self._nMaxLine <= nLines; self._nMaxLine++) {
            aClass.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events  ._data .evt.l' + self._nMaxLine);
            aRule.push('top:' + (self._nMaxLine * self._nLineHeight) +  'px');
        }
        for (; self._nMaxHeight <= nHeight; self._nMaxHeight++) {
            aClass.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events  .evt.h' + self._nMaxHeight);
            aRule.push('height:' + (self._nMaxHeight * self._nLineHeight) +  'px');
        }
        changeCssClass(aClass, aRule, true);
    }
    
    self._loadSwimanePreset = function(){
        self._parent._objects.loadSpecialSettings('swimlane', function(data){
            self._aPresets = typeof(data) == 'string' ? JSON.parse(data) : data;
        });
    }
    
    self._showEmptyMessage = function(sText, bShowIcon){
        var sHTML = '<div class="Swimlane_Empty">';
        bShowIcon = bShowIcon != undefined ? bShowIcon : true;
        sHTML = '<div class="Swimlane_Empty"><b>'
            + (bShowIcon ? '<span class=_ico></span>' : '')
            + sText + '</b></div>'
            + '<div class="Swimlane_Empty"><span class=simple_button data-action="cancel">'
                + self._parent.getText('close', 'Close')
                + '</span></div>';
        self._parent.showPopup({
            html        : sHTML,         // send ready dom 
            center      : true,
            modal       : (self._aListViews != undefined && self._aListViews.length > 0),
            view        : view,
            shadow      : true,
            autohide    : false,
            overflow    : false            
        });
    }
    
    self._selectListviewAction = function(oEl, evt){
        var oEl = jQuery(evt.target);
        self._sMode = "listview";
        self._group = oEl.data('param');
        self._parent.hidePopup();
        self._typeSelector.val(oEl.data('param'));
        view.showData();
    }
    
    self._showPresetsPopup = function() {
        var sHTML = '<div class="preset_manage _list_mode">'
                    + '<div class="preset_list"><table>';
        if (self._aPresets != undefined && self._aPresets.length > 0) {
            for (var nJ = 0; nJ < self._aPresets.length; nJ++) {
                sHTML += "<tr data-id='" + self._aPresets[nJ].id + "'><td>"
                    + '<a data-action="editPreset" class="_ico_edit"></a>'
                    + '<a data-action="clonePreset" class="_ico_clone"></a>'
                    + '<a data-action="delPreset" class="_ico_del"></a>'
                    + '</td><td>'
                    + self._aPresets[nJ].label.htmlspecialchars() + '</td>'
                + '</tr>';
            }
        }
        sHTML += '</table></div>'
            + '<div class="preset_form">' + self._buildPresetForm() + '</div>'
            + '<div class="form_buttons">'
                + '<span class="small_button" data-action="saveSetting" data-param="">OK</span>'    
                + '<span class="small_button" data-action="cancelSetting" data-param="">Cancel</span>'    
                + '<span class="small_button" data-action="savePreset" data-param="">Save</span>'    
                + '<span class="small_button" data-action="editPreset" data-param="">Add new preset</span>'
                + '<span class="small_button" data-action="cancel" >Close</span>'
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
        self._dom.preset = self._parent._dom.popup.children();
        self._dom.preset.on('change', '.settings_new select[name="object"]', function(evt){
            self._fillSettingFields(jQuery(evt.target).val());
        });
        self._dom.preset.on('change', '.settings_new select[name="field"]', function(evt){
            self._fillSettingReferences(
                self._dom.preset.find('.settings_new select[name="object"]').val(),
                jQuery(evt.target).val()
            );
        });
        
    }
    
    
    self._cancelAction = function()  {
        self._parent.hidePopup();
    }
    
    self._editPresetAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        self._dom.preset.removeClass('_list_mode _setting_mode _label_mode').addClass('_edit_mode');
        self._nCurrentPreset = oEl.data('param');
        if (oEl.parents('[data-id]').size() > 0) {
            self._nCurrentPreset = oEl.parents('[data-id]').data('id');
        }
        self._showPresetEditPopup(self._nCurrentPreset);
        
    }
    
    self._clonePresetAction = function(oEl, evt) {
        oEl = jQuery(evt.target);
        self._dom.preset.removeClass('_list_mode _setting_mode _label_mode').addClass('_edit_mode');
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
        if (self._aPresetRecords[nId] != undefined) {
            delete self._aPresetRecords[nId];
        }
        self._parent._objects.savePresets(self._aPresets);
        self._typeSelector
            .find('select optgroup[data-type="preset"] option[value="' + nId + '"]')
            .remove();
    }
    
    self._newPresetSettingAction = function(oEl, evt) {
        
        var sObj = self._dom.preset.find('.settings_new select[name="object"]').val(),
            sField = self._dom.preset.find('.settings_new select[name="field"]').val(),
            sReference = self._dom.preset.find('.settings_new select[name="reference"]').val();
        if (self._dom.preset.find('.settings_list').children('div[data-object="' + sObj + '"]').size() > 0) {
            return;
        }
        self._buildSettingFilter(sObj, sField, sReference, [], "");
        self._oLastSetting = null;

        self._dom.preset.removeClass('_list_mode _edit_mode _label_mode').addClass('_setting_mode');
        
    }
    
    self._cancelSettingAction = function(oEl, evt) {
        self._dom.preset.removeClass('_list_mode _setting_mode _label_mode').addClass('_edit_mode');
    }
    
    self._saveSettingAction = function(oEl, evt) {
        if (self._dom.preset.hasClass('_label_mode')) {
            self._oLastSetting.data('label'  , self._getActiveLabel().join(","));
        } else {
            if (self._oLastSetting == null) {
                var sObj = self._dom.preset.find('.settings_new select[name="object"]').val(),
                    sField = self._dom.preset.find('.settings_new select[name="field"]').val(),
                    aField = self._parent._objects.getObjectFieldByName(sObj, sField),
                    oSetting = {
                        object  : sObj,
                        field   : sField,
                        reference : self._dom.preset.find('.settings_new select[name="reference"]').val(),
                        filter  : self._filterView.getFilters(true).join("##"),
                        rule    : '' + self._filterView.getRule(),
                        id      : "",
                        label   : "name"
                    }
                if (oSetting.reference == '') {
                    oSetting.reference = aField.options[0].name;
                }
                self._dom.preset.find('.settings_list').append(self._buildSettingRow(oSetting));
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
        var oDiv = jQuery(evt.target).parent();
        self._buildSettingFilter(oDiv.data('object'), 
            oDiv.data('field'), 
            '' + oDiv.data('reference'),
            '' + oDiv.data('filter'), 
            '' + oDiv.data('rule')
        );
        self._oLastSetting = oDiv;
        self._dom.preset.removeClass('_list_mode _edit_mode _label_mode').addClass('_setting_mode');
    }
    
    self._delSettingAction = function(oEl, evt){
        var oDiv = jQuery(evt.target).parent();
        oDiv.remove();
    }
    
    self._labelSettingAction = function(oEl, evt) {
        var oLabelDiv = self._dom.preset.find('.settings_label'),
            oDiv = jQuery(evt.target).parent();
        self._oLastSetting = oDiv;
        var aQ = [];
        if (oLabelDiv.children().size() < 1) {
            aQ.push(function(){
                self._dom.preset.find('.settings_label').html(self._buildLabelSelector());
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
        self._dom.preset.removeClass('_list_mode _setting_mode _edit_mode').addClass('_label_mode');
        self._parent._addQueue(aQ);
        
    }
    
    self._getActiveLabel = function() {
        var oList = self._dom.preset.find('.settings_label div[data-list="_on"]'),
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
            self._dom.preset.find('.settings_label .multi_select[data-list="_off"]').html(sHTML);
            self._dom.preset.find('.settings_label .multi_select[data-list="_on"]').html('');
        });
        
    }
    
    self._setLabelOptions = function(sFields) {
        var aFields = sFields == "" ? ["name"] : sFields.split(","),
            jFrom = self._dom.preset.find('.settings_label .multi_select[data-list="_off"]'),
            jTo = self._dom.preset.find('.settings_label .multi_select[data-list="_on"]');
        for (var nI = 0; nI < aFields.length; nI++) {
            var oEl = jFrom.children('div[data-fid="' + aFields[nI] + '"]');
            oEl.remove().appendTo(jTo).removeClass('_off');
        }
    }
    
    self._savePresetAction = function(oEl, evt){
        var aSaveData = {
            id          : self._nCurrentPreset,
            label       : self._dom.preset.find('input[name="label"]').val(),
            filters     : self._getPresetFilters()
        };
        if (aSaveData.filters.length < 1 || aSaveData.label.trim() == '') {
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
        
        
        if (self._nCurrentPreset == '' || self._nCurrentPreset == null) {
            self._typeSelector.find('select optgroup[data-type="preset"]').append(
                '<option value="' + aSaveData.id + '">' + aSaveData.label.htmlspecialchars()
            );
        } else {
            self._typeSelector
                .find('select optgroup[data-type="preset"]').find('option[value="' + aSaveData.id + '"]')
                .text(aSaveData.label.htmlspecialchars());
        }
        if (self._aPresetRecords[aSaveData.id] != undefined) {
            delete self._aPresetRecords[aSaveData.id];
            delete self._aListViewRecords[aSaveData.id];
        }

        self._parent.hidePopup();
    }
    
    self._buildPresetForm = function() {
        var sHTML = "<div class='preset_edit'>"
            + "<label>Preset name</label><input type=text name='label'/><br>"
            + "<label>Visibile</label><input type=radio name='owner' value=my/>To me&nbsp;"
            + "<input type=radio name='owner' value=all/>To all users"
            + "</div>"
            + '<div class="settings_new">' + self._selectNewPresetSetting() + '</div>'
            + '<div class="settings_list"></div>'
            + '<div class="settings_filter"></div>'
            + '<div class="settings_label _multi_select_block" data-block="label"></div>';
        return sHTML;
    }
    
    self._showPresetEditPopup = function(sId, sMode) {
        
        var aPreset = self._getPreset(sId);
        if (aPreset != null) {
            if (sMode !== 'clone')  {
                self._dom.preset.find('input[name="label"]').val(aPreset.label);
            }
            self._setSettingsList(aPreset.filters);
        } else {
            self._dom.preset.find('input[name="label"]').val('');
            self._dom.preset.find('.settings_list').html('');
        }
    }
    
    self._selectNewPresetSetting = function() {
        var sHTML = '<select name=object><option value="0">Select object...';
        
        var aObjs = self._parent._objects.getObjectsList();
        aObjs.quickSort('label', {'lowercase' : true});
        for (var nJ = 0; nJ < aObjs.length; nJ++) {
            sHTML += '<option value=' + aObjs[nJ].name + '>'  + aObjs[nJ].label.htmlspecialchars();
        }
        sHTML += '</select>'
            + '<select name=field></select>'
            + '<select name=reference class="_CA_off"></select>'
            + '<a class=small_button data-action="newPresetSetting">Add</a>';
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
            self._dom.preset.find('.settings_list').html(sHTML);
        });
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
                + sObjName.htmlspecialchars() + ' / ' + aField.label.htmlspecialchars()
                + '<span class="simple_button" data-action=editSetting>Edit</span>'
                + '<span class="simple_button" data-action=labelSetting>Fields</span>'
                + '<span class="simple_button" data-action=delSetting>Del</span>'
            + '</div>';
        return sHTML;
    }
    
    self._fillSettingFields = function(sObj) {
        var sHTML = '<option value="">Select field please...',
//            aFilter = ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'REFERENCE', 'PICKLIST', 'COMBOBOX'];
            aFilter = ['REFERENCE'];
        self._parent._objects.getObjectStructure(sObj, function(aFields){
            var aGroupFields = Array.objectValues(aFields);
            aGroupFields.quickSort('label');
            
            for (var nJ = 0; nJ < aGroupFields.length; nJ++) {
                if (aFilter.indexOf(aGroupFields[nJ].type) < 0) {
                    continue;
                }
                sHTML += '<option value=' + aGroupFields[nJ].name + '>'  + aGroupFields[nJ].label.htmlspecialchars();
            }
            self._dom.preset.find('.settings_new select[name="field"]').html(sHTML);
        });
    }
    
    self._fillSettingReferences = function(sObj, sField) {
        var aField = self._parent._objects.getObjectFieldByName(sObj, sField),
            sHTML = '<option value="">Select reference object...',
            oSelect = self._dom.preset.find('.settings_new select[name="reference"]');
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
                    "div"       : self._dom.preset.find('.settings_filter'),
                    "filter"    : aFilter,
                    'rule'      : '' + sRule
                });
            }
        ]);
    }
    
    self._getPresetFilters = function() {
        var aFilters = [];
        self._dom.preset.find('.settings_list').children().each(function(nIdx, oEl){
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
    
    
    self._stopCheckScrolling = function(bMode) {
        bMode = (bMode != undefined ? bMode : true);
        self._bSkipScroll = bMode;
        if (self._nScrollTimer != null) {
            clearTimeout(self._nScrollTimer);
            self._nScrollTimer = null;
        }
    }
    
    self._checkGridScrolling = function(evt){
        var dDay = self._getScrollDay(evt);
        if (dDay != null && dDay.getTime() != self._period.current.getTime()) {
            self._bNoScroll = true;
            self._parent.layout.changePeriod(dDay);
        } 
    }
    
    self._getScrollDay = function() {
        var nScrollLeft = self._dom.events[0].scrollLeft + parseInt(self._dom.events[0].offsetWidth / 2),
            nCell, oCell;
        switch(self._format) {
            case 'hour' :
                nCell = parseInt(nScrollLeft / (self._inDayHours * self._cellWidth * self._hourCells)),
                oCell = self._dom.events.children().eq(nCell);
                break;
            case 'day' :
                var nPos = 0, nMonthSize = 0;
                self._dom.events.children().each(function(){
                    nMonthSize = this.offsetWidth;
                    if (nPos + nMonthSize > nScrollLeft) {
                        oCell = jQuery(this);
                        return false;
                    }
                    nPos += nMonthSize;
                });
                break;
                
        }
            
//        console.log(nScrollLeft, self._dom.events[0].offsetWidth);
//        console.log(nCell + ' / ' + nScrollLeft + ' / ' + (self._inDayHours * 100));
        if (oCell != undefined && oCell.size() > 0) {
            return new Date(oCell.data('date'));
        } else {
            return null;
        }
    }
    
    self._findSimilarEl = function(oEl) {
        var sGroup = oEl.group != undefined ? oEl.group : oEl.parents('[data-group]').data('group'),
            sCalendar = oEl.calendar != undefined ? oEl.calendar : oEl.data('calendar') ,
            sEvent = oEl.event != undefined ? oEl.event : oEl.data('event'),
            
            aEls = self._dom.events.find('[data-group="' + sGroup + '"] > ._data')
                .children('.evt[data-calendar="' + sCalendar + '"][data-event="' + sEvent + '"]');
        return aEls;
    }
    
    self._clearEventsDOM = function(){
        self._dom.events.find('[data-group] > ._data').html('');
        self._aGroupHeight = {};
        var aDataGroups = self._dom.events.find('[data-group]');
        self._dom.title.children('[data-group]').each(function(nIdx, oEl){
            oEl = jQuery(oEl);
            aDataGroups.filter('[data-group="' + oEl.data('group') + '"]').height(oEl.height());
        });
        self._dom.title.html('');
        self._data = [];
        self._calendarsData = {};
//        self._aListViewTitles = {};
//        self._aListViewIds = {};
    }
    
    jQuery.calendarAnything.appendView('swimlane', view);
})();
