/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/day.css',
        _parent     : null,
        _div        : null,
        _period     : {min : new Date(), max : new Date()},
        _nBlockHeight : 1,
        _nPeriodMulti : 0,
        _eventsData : [],
        _aMaxBottomLines : [],
        _aCurrentGrouping : {},
        
        _aListViewRecords   : {},
        _aListViewTitles    : {},
        _aListViewIds       : {},
        
        _dom        : {},
        _firstTime  : true,
        _sMode      : "default",
        _sGroupType : null,
//        _bAutoAgenda    : null,
        _nMaxVisibleItems : 30,
        _sGroup     : '---',
        _sBaseObject    : "",
        _aGroupingTitles : [],
        _aListViews : [],
        _aPresets : null,
        _aAllCalendars : null,
        _bResetGroupingSctoll : true
    };
    var view = {};

    /** 
    * public init
    *
    * Init all necessary data
    */

    view.init = function (div, parent){
        self._parent = parent;

        self._parent.loadCss(self._css);
        view.changeCurrentPeriod(self._parent.options, 0);
        if (self._parent.options.agenda === true || self._parent.params.dayViewAgenda === true || self._parent.params.dayViewAgenda === 'agenda') {
            self._sMode = 'agenda';
//        } else if (self._parent.options.agenda === false) {
//            self._sMode = 'default';
        } else if (self._parent._getUrlParam('v', '') == 'dg' || self._parent.params.dayViewAgenda === 'grouping'){
            self._sMode = 'grouping'; 
        } else {
            self._sMode = 'default'; 
        }
        self._sGroup = self._parent.getParam(
            'swimlaneDefaultGroupBy', 
            self._parent.getLS('swimlaneSelectedFilterId', self._sGroup)
        );
    }
    
    /** 
    * @public show
    * draw grid
    * @return void;
    */
    
    
    view.show = function(sMode) {
        if (self._parent.options._small && self._parent.options._orient == 'horizontal') {
            self._parent.toggleMode('week');
            return;
        }
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('day');
            self._initEvents();
            self._firstTime = true;
            self._div.addClass('_' + self._sMode);
        }
        if (sMode === 'toggle') {
            self._period.min.setTime(self._parent.options.current.getTime());
//            self._dom.bottom = undefined;
        }
        if (self._dom.header == undefined) {
            self._buildHTML();
        } else {
            self._changeDateTitle();
        }
        switch(self._sMode) {
            case 'agenda' :
                self._buildRightAgendaGrid();
                break;
            case 'grouping' : 
                self._fillGrouping();
                //self._buildGrouping();
                break;
            default :
                self._buildRightTopGrid();
                self._buildRightBottomGrid();
        }
        self._div.addClass('show');
        if (self._firstTime) {
            self._firstTime = false;
        }
        
    }
    
    /** 
    * @public reShow
    *
    * redraw grid
    *
    */
    
    view.reShow = function() {
        view.show(self._div == null ? 'toggle' : "");
    }
    
    /** 
    * @public refresh
    *
    * redraw data
    *
    */
    view.refresh = function(params) {
        view.showData();
    }
    
    /** 
    * @public resize
    *
    * Clear offset cache when resize
    *
    */
    view.resize = function(bChange, bNewOrient){
        self._cacheCoords = undefined;
        if (self._parent.options._small && self._parent.options._orient == 'horizontal') {
            self._parent.toggleMode('week');
            return;
        }
    }
    
    /** 
    * @public showData
    *
    * Public method, view data on grid
    *
    */
    
    view.showData = function(aParams) {
        if (self._parent._currentModeName !== 'day') {
            return;
        }        
        var mDate = (aParams != undefined && aParams.date != undefined) ? aParams.date : self._period.min;
        var dMin = Date.baseDate(mDate),
            dMax = Date.baseDate(mDate);
        aParams = aParams || {};
        dMax.setHours(23, 59, 0, 0);
        aParams.calendars = self._parent.layout.getActiveCalendars();
        aParams.min = dMin;
        aParams.max = dMax;
        var aAllCalendars = [].concat(aParams.calendars.calendar);
        if (aParams.calendars.group.length > 0) {
            aAllCalendars = aAllCalendars.concat(self._getCalendarsForGroup(aParams.calendars.group));
        }
        aAllCalendars = aAllCalendars.unique();
        self._cacheCoords = undefined;
        self._parent._addQueue([
            function(){
                if (self._sGroupType == 'listview' && self._aListViewRecords[self._sGroup] == undefined
                ) {
                    self._parent._objects.getListviewRecords('user', self._sGroup, function(data){
                        self._aListViewRecords[self._sGroup] = data;
                    });
                } else if (self._sGroupType == 'preset' && self._aListViewRecords[self._sGroup] == undefined) {
                    var aPreset = self._getPreset(self._sGroup);
                    if (aPreset == null || aPreset == undefined) {
                        self._aListViewRecords[self._sGroup] = [];
                        return;
                    }
                    self._parent._objects.getPresetRecords(self._getPreset(self._sGroup).filters, function(data){
                        var aData = [];
                        jQuery.each(data, function(sKey, mVal){
                            aData = aData.concat(mVal);
                        });
                        self._aListViewRecords[self._sGroup] = aData;
                    });
                }
            },
            function(){
                if (self._sMode == 'grouping') {
                    var bChange = self._aAllCalendars != null 
                            && (self._aAllCalendars.diff(aAllCalendars).length > 0
                            || aAllCalendars.diff(self._aAllCalendars).length > 0
                        );
                    if (bChange) {
                        self._fillGrouping();
                    }
                }
            },
            function(){
                if (self._sMode == 'grouping' && self._sGroup != '---' && self._sGroup != '') {
                    aParams.grouping = {};
                    var oCalendar;
                    switch(self._sGroupType) {
                        case 'field':  
                            for (var nI = 0; nI < aAllCalendars.length; nI++){
                                aParams.grouping[aAllCalendars[nI]] = self._sGroup;
                            }
                            break;
                        case 'preset' :
                            var aPreset = self._getPreset(self._sGroup);
                                
                            for (var nI = 0; nI < aAllCalendars.length; nI++){
                                oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                                for (var nP = 0; nP < aPreset.filters.length; nP++) {
                                    if (aPreset.filters[nP].object == oCalendar['objectName']) {
                                        aParams.grouping[aAllCalendars[nI]] = aPreset.filters[nP].field;
                                    }
                                }
                            }
                            break;
                        case 'listview' :
                            for (var nI = 0; nI < aAllCalendars.length; nI++){
                                oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                                aParams.grouping[aAllCalendars[nI]] = 
                                    oCalendar.settings.swimlane_grouping == undefined || oCalendar.settings.swimlane_grouping == ''
                                    ? 'ownerid'
                                    : oCalendar.settings.swimlane_grouping;
                            }
                            break;
                    }   
                    
                    self._aCurrentGrouping = aParams.grouping;
                    
                    if ((self._sGroupType == 'listview' || self._sGroupType == 'preset' ) 
                        && self._aListViewRecords[self._sGroup] != undefined
                    ) {
                        aParams.filters = {};
                        var aIds = [];
                        for (var nJ = 0; nJ < self._aListViewRecords[self._sGroup].length; nJ++) {
                            aIds.push(self._aListViewRecords[self._sGroup][nJ].id);
                        }
                        for (var nI = 0; nI < aAllCalendars.length; nI++) {
                            if (aParams.grouping[aAllCalendars[nI]] == undefined) {
                                continue;
                            }
                            oCalendar = self._parent._calendars.getCalendar(aAllCalendars[nI]);
                            aParams.filters[aAllCalendars[nI]] = [{
                                'oper'  : 'equal',
                                'name'  : aParams.grouping[aAllCalendars[nI]],
                                'value' : aIds.join(',')
                            }];
                        }


                        /*var aList = [];
                        for (var nJ = 0; nJ < self._aListViewRecords[self._sGroup].length; nJ++) {
                            aList.push(self._aListViewRecords[self._sGroup][nJ].name);
                            self._aListViewTitles[self._aListViewRecords[self._sGroup][nJ].name] 
                                = self._aListViewRecords[self._sGroup][nJ].label;
                            self._aListViewIds[self._aListViewRecords[self._sGroup][nJ].name] 
                                = self._aListViewRecords[self._sGroup][nJ].id;
                        }
                        aList.sort();
                        for (var nI = 0; nI < aList.length;nI++) {
                            self._calendarsData[aList[nI]] = [];
                        }*/
                        self._aCurrentFilters = aParams.filters;
                    }
                    
                    
                }
                if (self._sMode == 'grouping' && (self._sGroup == '---' || self._sGroup == '')) {
                    return;
                }
                self._parent._events.getData(aParams, function(data){
                    if (self._period.min.getTime() != mDate.getTime()) {
                        return;
                    }
                    self._eventsData = data;
                    if (self._sMode == 'grouping') {
                        self._buildRightGroupingData();
                    } else if (self._sMode == 'agenda'){
                        self._buildRightAgendaData(data);
                    } else {
                        if (self._parent.params.dayModeArea !== '0_1') {
                            var aTop = self._parent._events.splitEventsByLine(
                                (self._parent.params.dayModeArea !== '1_0'
                                    ? self._filterAllDay(data, true)
                                    : data
                                ),
                                {
                                    "min" : dMin,
                                    "max" : dMax
                                }
                            );
                            self._buildRightTopData(aTop);
                        }
                        if (self._parent.params.dayModeArea !== '1_0') {
                            self._buildRightBottomData();
                        }
                    }
                    self._aAllCalendars = aAllCalendars;
                });
            }
        ]);
    }
    
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        } 
    }
    /**
     * @public getTitle
     * @return string formated title
     **/
    
    
    view.getTitle = function(){
        return self._parent.options.current.format(self._parent.options.format.fullDate);
    }

    /**
     * @public changeCurrentPeriod
     * Calculate new period parameters and set it to aOption(referance object)
     * @return void
     **/

    view.changeCurrentPeriod = function(aOptions, mDirection) {
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
            aOptions.current.setHours(0, 0, 0, 0);
        } else {
            aOptions.current.changeDate(mDirection);
        }
        if (parseInt(self._parent.params.showWeekEnds) != 7) {
            if (mDirection instanceof Date || mDirection == 0) {
                mDirection = 1;
            }
            while (
                aOptions.current.getDay() == 0
                || 
                (parseInt(self._parent.params.showWeekEnds) == 5 && aOptions.current.getDay() == 6)
            ) {
                aOptions.current.changeDate(mDirection);
            }
        }
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date(aOptions.current);
        } else {
            aOptions.min.setTime(aOptions.current)
        }
        self._period.min.setTime(aOptions.min.getTime());
        self._bResetGroupingSctoll = true;
    }

    view.preparePrint = function(bMode) {
        self._expand(bMode);
    }
    
    view.clearView = function() {
        self._div = null;
        if (self._dom == undefined) {
            return;
        }
        var aRemove = ['bottomLi', 'bottom', 'bottomData', 'top', 'agenda', 'header', 
            'bottomGroupTitle', 'bottomGroupData', 'bottomGroupDataAllDay', 'bottomGroup'];
        for (var nJ = 0; nJ < aRemove.length; nJ++) {
            if (self._dom[aRemove[nJ]] != undefined && self._dom[aRemove[nJ]] != null) {
                self._dom[aRemove[nJ]].remove();
                delete self._dom[aRemove[nJ]];
            }
        }
        self._aListViewRecords = {};
        self._aListViewTitles = {};
        self._aListViewIds = {};
//        if (self._dom.bottomLi != undefined && self._dom.bottomLi != null) {
//            self._dom.bottomLi.remove();
//        }
//        if (self._dom.bottom != undefined && self._dom.bottom != null) {
//            self._dom.bottom.remove();
//        }
//        if (self._dom.bottomData != undefined && self._dom.bottomData != null) {
//            self._dom.bottomData.remove();
//        }
//        if (self._dom.top != undefined && self._dom.top != null) {
//            self._dom.top.remove();
//            delete self._dom.top;
//        }
//        if (self._dom.agenda != undefined && self._dom.agenda != null) {
//            self._dom.agenda.remove();
//            delete self._dom.agenda;
//        }
//        if (self._dom.header != undefined) {
//            self._dom.header.remove();
//            delete self._dom.header;
//        }
//       

        if (self._parent.params.dayViewAgenda !== (self._sMode == 'agenda') ) {
            self._sMode == self._parent.params.dayViewAgenda ? 'agenda' : self._sMode;
        }
    }



    view.getClickDate = function(oEvt) {
        var oCalculated = self._getWeekDay(oEvt),
            dD = Date.baseDate(
                oCalculated.date, 
                0, 
                oCalculated.hour != undefined ? 
                    oCalculated.hour * parseInt(self._parent.params.minMinutePeriod) / 60 
                        + parseInt(self._parent.aCalculated.startHour)
                : 0
            );
        return {
            "date" : dD,
            "hourly" : oCalculated.hour != undefined
        }
    }
    
    
    view.beforeHide = function(sNewMode) {
        if (self._parent.params.rememberTimeScroll === true && self._dom.bottom != undefined) {
            self._parent.options.scrollLine = self._sMode == 'default' && self._dom.bottom != undefined
                ? self._dom.bottom.children('.data').scrollTop()
                : (self._dom.bottomGroupEventsData != undefined ? self._dom.bottomGroupEventsData.scrollTop() : 0);
        }
    }
    
    view.resetPreset = function(aPreset) {
        self._aListViewRecords = {};
        self._aPresets = aPreset;
        var oSelect = self._dom.header.find('select[name="grouping"]');
        if (self._sGroupType == 'preset') {
            var oPreset = self._getPreset(self._sGroup);
            if (oPreset == null) {
                oSelect.find('option[value="' + self._sGroup + '"]').remove();
                oSelect.find('select').trigger('change');
            } else {
                view.showData();
            }
        } else {
            view.showData();
        }
    }

    
    self._buildHTML = function(){
        var dCur = new Date(self._period.min),
            aOptsValues = ["Default", "Agenda", "Grouping"],
            aOptsKeys = ["default", "agenda", "grouping"],
            sHTML = '<div class="_header">'
                + '<div class="days scroll_pos_r"><ul><li class="hours_title">'
                + '<select title="Mode" name="mode">' ;
        for (var nI = 0; nI < aOptsKeys.length; nI++) {
            sHTML += "<option value='" + aOptsKeys[nI] + "' " 
                + (self._sMode == aOptsKeys[nI] ? 'selected' : "")
                + ">" + aOptsValues[nI] + '</option>';
        }
        sHTML += '</select>'
            + '<select title="Group By" name="grouping">'
                + "<option value=''>Select field...</option>"
            + '</select>'
            + '</li>'
            + '<li data-day="' + (dCur.getDay() % 7) + '">' + self._parent.text.week[dCur.getDay() % 7] + '</li>'
            + '</ul></div>'
            + '<div class=days_right></div>'
            + '</div>';
        self._dom.header = jQuery(sHTML).appendTo(self._div);
    }
    
    self._changeDateTitle = function(){
        var dStart = new Date(self._period.min);
        self._dom.header.find('.days li[data-day]').data('day', dStart.getDay())
                    .text(self._parent.text.week[dStart.getDay() % 7]);
    }
    /**
     * @private _initEvents
     * Init default events for whole week view
     * @return void
     **/
    
    self._initEvents = function() {
//        self._div.on('click', '.hours_title > input', function(evt){
//            self._bAutoAgenda = null;
//            self._toggleAgendaMode(jQuery(evt.target).is(':checked'));
//            return self._parent._cancelBubble(evt);
//        });
        self._div.on('change', '._header select[name="mode"]', function(evt){
            //self._bAutoAgenda = null;
            self._div.removeClass('_' + self._sMode);
            self._sMode = jQuery(evt.target).val();
            self._div.addClass('_' + self._sMode);
            //self._toggleAgendaMode(jQuery(evt.target).is(':checked'));
            self._toggleAgendaMode();
            return self._parent._cancelBubble(evt);
        })
        .on('change', '._header select[name="grouping"]', function(evt){
            self._sGroup = jQuery(evt.target).val();
            self._sGroupType = jQuery(evt.target).find('option:selected').parent().data('type');
            self._parent.setLS('swimlaneSelectedFilterId', self._sGroup);
            view.showData();
        });
        // 2.11.2016 ??? what is it
        /*self._div.on('click', '.bottom > b', function(evt){
            self._div.find('.hours_title > input').prop('checked', 'checked');
            self._toggleAgendaMode(true);
            //self._parent.toggleMode('agenda', false, self._period.min.getTime() / 1000);
//            return self._parent._cancelBubble(evt);
        });*/
        
        if (self._parent.options.readonly === true) {
            return;
        }
        
        if (self._parent.options._small && self._parent.isMobile()) {
            self._parent._prependQueue([function(){
                    self._div.on('calongtouch', {
                        handle : {
                            "move" : false,
                            "longtouch" : true,
                            "zoom" : true,
                            "swipe" : true
                        }
                    }, function(evt){
                        switch(evt.data.type) {
                            case "swipe" :
                                if (evt.data.what != 'h') {
                                    return;
                                }
                                var nMultiplier = (jQuery(evt.target).parents('.days') >= 0) ? 7 : 1;
                                self._parent.layout.changePeriod(evt.data.where ? -1 * nMultiplier : 1 * nMultiplier);
                                break;
                            case 'longtouch' : 
                                self._parent.layout.showAreaSubmenu(jQuery(evt.currentTarget), evt);
                                break;
                            case "zoom" :
                                if (!evt.data.zoom) {
                                    self._parent.toggleMode('week');
                                }
                                break;
                        }
                    });
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.ca.touch.js');
                }
            ]);
            self._div.on('click', '.agd > .days li', function(evt){
                var oEl = jQuery(evt.target);
                self._parent.layout.changePeriod(Date.baseDate(oEl.data('date')));
            });
        } else {
            self._div.on('click', '.top > .data .events,.top > .data ul > li, .swim_bot ._allday ._grp', function(evt){
                var el = jQuery(evt.target);
                if (self._parent.options.readonly === true 
                    || self._parent.options.readonly.create === false 
                    || el.hasClass('evt') 
                    || el.parents('.evt').size() > 0
                ) {
                    return;
                }
                var aPredefine = [];
                if (el.hasClass('_grp')) {
                    aPredefine.push({
                        name    : self._sGroup, 
                        value   : el.data('id'),
                        oper    : "equal",
                        text    : el.data('group'),
                        calendarFieldName : self._aCurrentGrouping
                    });
                    
                }
                

                self._parent.layout.showCreateEventForm({
                    "cid" : "",
                    "date" : {
                        "start" :  Date.baseDate(self._parent.options.current), 
                        "stop" :  Date.baseDate(self._parent.options.current)
                    },
                    "el" : null,
                    "onClose" : function(evt) {
                        view.showData();
                    }, 
                    "event" : evt,
                    "allDay" : true,
                    predefine : aPredefine
                });            
            });


            self._parent._prependQueue([
                function(){
                    self._initBottomEvent();
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.simpleselect.js');
                }
            ]);
        }

    }
    
    /**
     * @private _buildRightTopGrid
     * Draw top grid
     **/
    
    self._buildRightTopGrid = function(){
        var i, dNext, sDayClass = '', nWeek = 0;
        var dCur = new Date(self._period.min);
        var sHTML = '<div class=top>'
            + '<div class=data data-week="' + nWeek + '">'
            + '<ul class="scroll_pos_r"><li></li>';
        
        sDayClass = dCur >= self._parent.options.min && dCur <= self._parent.options.max 
            ? "month"
            : "";
        sDayClass += (dCur.valueOf() == self._parent.options.now.valueOf()) ? ' current' : '';                
        sHTML += '<li '
            + 'class="' + sDayClass + '" '
            + 'data-date="' + (dCur.valueOf() / 1000) + '"'
            + 'data-day="' + dCur.getDay() + '"'
            + '>' 
            + '</ul>'
            + '</div></div>';
        if (self._parent.params.rememberTimeScroll === true && self._dom.bottom != undefined) {
            self._parent.options.scrollLine = self._dom.bottom.children('.data').scrollTop();
        }
        
        self._div.find('.top, .bottom').remove();
        self._dom.top = jQuery(sHTML).appendTo(self._div);
    }
    
    /**
     * @private _buildRightBottomGrid
     * Draw bottom grid
     **/
    
    self._buildRightBottomGrid = function() {
        
        var dStart = new Date(self._period.min);
        var dCur = new Date(dStart);
        var sDayClass = "month";
        sDayClass += (dCur.valueOf() == self._parent.options.now.valueOf()) ? ' current' : '';                
        
        var sHTML = '<div class="bottom bottomGridData">';
        sHTML += '<div class=data>';
        sHTML += '<ul class="hour_v_area"><li class="hours_title">';
        var dTmp = new Date(2000,1,1, self._parent.aCalculated.startHour, 0, 0, 0);
        for (var i = parseInt(self._parent.aCalculated.startHour); i < parseInt(self._parent.aCalculated.stopHour); i++) {
            sHTML += '<span>' + dTmp.format(self._parent.options.format.hourTitle) + '</span>';
            dTmp.changeHour(1);
        }
        sHTML += '</li>';
        
        
        sHTML += '<li '
            + 'class="' + sDayClass + '" '
            + 'data-date="' + (dCur.valueOf() / 1000) + '"'
            + 'data-day '
            + 'data-d="' + dCur  + '"'
            + '>'
            + '</ul>'
            + '</div></div>';
        self._dom.bottom = jQuery(sHTML).appendTo(self._div);
        self._dom.bottomData = self._dom.bottom.children('.data');
        self._dom.bottomLi = self._dom.bottom.find('ul.hour_v_area > li').not('.hours_title');
        self._scrollBottomArea();
    }
        
    self._scrollBottomArea = function(){
        
        if (self._sMode == 'default'
            && self._dom.bottom != undefined 
            && self._parent.options.scrollLine != undefined 
            && self._parent.options.scrollLine > 0
        ) {
            self._dom.bottom.children('.data').scrollTop(self._parent.options.scrollLine);
            setTimeout(function(){
                self._dom.bottom.children('.data').scrollTop(self._parent.options.scrollLine);
            }, 300);
        } else if (self._sMode == 'grouping'
            && self._dom.bottomGroupEventsData != undefined 
            && self._parent.options.scrollLine != undefined 
            && self._parent.options.scrollLine > 0
        ) {
            self._dom.bottomGroupEventsData.scrollTop(self._parent.options.scrollLine);
            setTimeout(function(){
                self._dom.bottomGroupEventsData.scrollTop(self._parent.options.scrollLine);
            }, 300);
        }
    }   
    
    
    self._buildRightAgendaGrid = function() {
        var dStart = new Date(self._period.min), 
            sHTML,
            nI, 
            dBase;
        if (self._dom.agenda != undefined) {
            if (self._parent.options._small) {
                dBase = Date.baseDate(dStart, -3);
                var aLi = self._dom.header.find('.days li[data-date]');
                for (nI = 0; nI < 7; nI++) {
                    aLi.eq(nI).data('date', dBase.valueOf() / 1000)
                        .text(self._parent.text.weekShort[dBase.getDay() % 7]);
                    dBase.changeDate(1);
                }
            } else {
                self._dom.header.find('.days li[data-day]').data('day', dStart.getDay())
                    .text(self._parent.text.week[dStart.getDay() % 7]);
            }
            return;
        }
        
        sHTML = '<div class=agd>';
//                + '<div class="days scroll_pos_r"><ul><li class="hours_title">'
//                    + '<input type="checkbox" title="' 
//                    + self._parent.getText('day_agenda_mode', 'Agenda Mode') 
//                    + '" checked/>'
//                    + '</li>';
//            if (self._parent.options._small) {
//                dBase = Date.baseDate(dStart, -3);
//                for (nI = 0; nI < 7; nI++) {
//                    sHTML += '<li data-date="' + (dBase.valueOf() / 1000) + '"'
//                            + (nI == 3 ? ' class="_current" ' : "")
//                            + ' >' 
//                            + self._parent.text.weekShort[dBase.getDay() % 7] 
//                            + '</li>';
//                    dBase.changeDate(1);
//                }
//            } else {
//                sHTML += '<li data-day="' + (dStart.getDay() % 7) + '">' + self._parent.text.week[dStart.getDay() % 7] + '</li>';
//            }
//            if (self._parent.options._small) {
//                
//            } else {
////                sHTML +=  self._parent.text.week[dStart.getDay() % 7] ;
//            }
            sHTML += 
                //'</ul></div><div class=days_right></div>'
                '<div class=grid data-week="0">'
                + '<ul><li></li>'
                + '<li></li>' 
                + '</ul></div>'
                + '<div class=data data-week="0">'
                + '<ul><li></li>'
                + '<li '
                    + ' data-date="' + (dStart.valueOf() / 1000) + '" '
                    + ' data-day="' + dStart.getDay() + '" '
                    + '></li>' 
                + '</ul>'
                + '</div></div>';

        self._dom.agenda = jQuery(sHTML).appendTo(self._div);
    }
    
    
    /**
     * @private _buildRightTopData
     * Draw top pane data
     **/
        
    self._buildRightTopData = function(aData, curTop){
        
        curTop = curTop || self._div.find('.top > .data');
        var curDataDiv = curTop.children('div.events');
        if (curDataDiv.size() < 1) {
            curDataDiv = jQuery('<div class=events></div>').appendTo(curTop);
        } else {
            curDataDiv.html('');
        }
        
        var nLine = 0;
        jQuery.each(aData, function(nLineInternal, aLineEvent){     
            if (aLineEvent == undefined) {
                return;
            }
            aLineEvent = aLineEvent[0];
            curDataDiv.append(self._buildTopEventBar(nLine, aLineEvent.event));
            nLine++;
        });
        self._parent.layout.initLinesCSS(nLine);
    }
    
    /**
     * _buildTopEventBar
     * Prepare HTML event bar 
     * @param nLine integer line number
     * @param current event object
     * @return string  ready HTML
     **/
    
    self._buildTopEventBar = function(nLine, el) {
        var 
            sHTML = '', 
            nColStart = 0, 
            nColLength = 0,
            bNoMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false ,
            aCalendar = !bNoMove ? el.getCalendar() : null; // self._parent._calendars.getCalendar(el.calendarid)
        sHTML += '<div class="evt d' + nColStart 
            + ' p' + nColLength + ' ' 
            + ' l' + nLine + ' ' 
            + ( el.dayStart < self._period.min ? "full_l " : ' ' )
            + ( el.dayEnd > self._period.min ? "full_r " : ' ' )
            + ( bNoMove || aCalendar.editable !== true || aCalendar.move !== true? "non_e " : ' ' )
            + ( el.noEnd != undefined && el.noEnd ? "non_r " : ' ' )        
            + ( bNoMove ? ' non_r non_e ' : '')
            + '" '
            + ' data-event="' + el.id + '"'
            + ' data-calendar="' + el.calendarid + '"'
            + ' data-start="' + ( el.dayStart.valueOf() / 1000 ) + '"'
            + ' data-end="' + ( el.dayEnd.valueOf() / 1000 ) + '"'
            + ' title="' + el.getTitle().htmlspecialchars() + '"'
            + '>'
            + '<span class="title color_' + el.className 
                + (el.specColor != undefined && el.specColor != '' ? ' ' + self._parent._events.getEventColor(el.specColor) : '')
            + '">' 
            + '<span class="text"> ' 
                + self._parent._events.getBarLabelTime(el)
                + (aCalendar != null && aCalendar.titleHTML !== true ? el.title.htmlspecialchars()  : el.title)
            + '</span>'
            + '<span class=l></span><span class=r></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    
    /**
     * Draw bottom area events
     **/
    
    self._buildRightBottomData = function() {
        self._nBlockHeight = 3600 / (60 / parseInt(self._parent.params.minMinutePeriod));
        self._nPeriodMulti = (60 / parseInt(self._parent.params.minMinutePeriod));

        self._buildDailyBars(
            self._parent.params.dayModeArea !== '0_1'
                ? self._filterAllDay(self._eventsData, false)
                : self._eventsData
            
        );
    }

    /**
     * Draw bottom pane event area and add to each day
     **/

    self._buildDailyBars = function(aData, oLI) {
        var li = oLI || self._div.find('.bottom > .data > ul > li[data-day]'),
            divDayData =  li.children('div.events'),
            aLines = [], nLine,
            sHTML = '', 
            aLineGrid = [],
            aEvtGrid = [],
            dStartDate = Date.baseDate(li.data('date')),
            bButify = true,
            nMinutePeriod = self._parent.params.minMinutePeriod / 60,
            nHiddenEvents = 0;
        if (divDayData.size() < 1) {
            divDayData = jQuery('<div data-day="0" class="events evts_' + aData.length + '" data-lines="' + aData.length + '">')
//            divDayData = jQuery('<div data-day="0" class="events">')
                .appendTo(li);
        } else {
            divDayData.removeClass('evts_' + divDayData.data('lines'));
        }
        
        var fillLineGrid = function(nLine, nEvt, dStart, dEnd){
            if (aLineGrid[nLine] == undefined) {
                aLineGrid[nLine] = [];
            }
            var aPos = self._calculateBottomBarParams({
                "start" : dStart, "end" : dEnd, "date" :  dStartDate
            });
            for (var nI = aPos.nCellStart; 
                nI < aPos.nCellStart + (aPos.nCellLength == 0 ? 1 : aPos.nCellLength); 
                nI++
            ) {
                aLineGrid[nLine][nI] = nEvt;
            }
            aEvtGrid[nEvt] = [
                nLine, 
                aPos.nCellStart, 
                aPos.nCellStart + (aPos.nCellLength == 0 ? 1 : aPos.nCellLength)
            ];
        }

        for (var i = 0; i < aData.length; i++) {
            var dRealStart = aData[i].allDay ? aData[i].dayStart : aData[i].dateStart ,
                dRealEnd = aData[i].allDay ? Date.baseDate(aData[i].dayEnd, 1) : aData[i].dateEnd;

            for (nLine = 0; nLine < aLines.length; nLine++) {
                if (dRealStart >= aLines[nLine]) {
                    break;
                }
            }
            nLine = nLine < i ? nLine : i;
            aLines[nLine] = Date.baseDate(dRealEnd)
                .toHourStep(nMinutePeriod, dRealEnd.getTime() == dRealStart.getTime());
            if (nLine > self._nMaxVisibleItems) {
                nHiddenEvents++;
            }
            if (!bButify) {
                sHTML += self._buildBottomEventBar(nLine, aData[i], dStartDate);
            } else {
                fillLineGrid(nLine, i, dRealStart, dRealEnd);
            }
        }
        
        if (bButify) {
            var nMAxLength;
            for (var nI = 0; nI < aEvtGrid.length; nI++) {
                nMAxLength = aLines.length - 1;
                var aBar = aEvtGrid[nI];
                for (var nJ = aBar[1]; nJ < aBar[2]; nJ++) {
                    for (var nL = aBar[0] + 1; nL <= nMAxLength; nL++) {
                        if (aLineGrid[nL][nJ] != undefined) {
                            nMAxLength = nL - 1;
                            break;

                        }
                    }
                }
                aBar[3] = nMAxLength - aBar[0];
                sHTML += self._buildBottomEventBar(aBar[0], aData[nI], dStartDate, aBar[3]);
            }
        }
        divDayData.addClass('evts_' + aLines.length).data('lines', aLines.length);
        divDayData.html(sHTML);
        if (aLines.length > self._nMaxVisibleItems && oLI == undefined) {
            self._div.find('.bottom').addClass('_more_events')
                .append('<b data-action="gotoAgenda"' 
                    + 'title="' + (self._parent.getText('day_activate_more', 'Activate Day view Agenda Mode to see all records')) + '">' + 
                    '+ ' + nHiddenEvents + ' events</b>'
            );
//            li.siblings().append('<b title="There are  ' 
//                    + (aLines.length - self._nMaxVisibleItems) 
//                    + ' additional hidden event lines">' + 
//                    '+</b>'
//            );
        } else {
            
        }
        if (self._aMaxBottomLines.indexOf(aLines.length) == -1) {
            self._aMaxBottomLines.push(aLines.length);
            self._setBottomLineCSS(aLines.length);
        }
    }
    
    /**
     * @private _buildBottomEventBar
     * Draw bottom pane events on gridd
     * 
     * @param nEvt - number of event
     * @param aEl event object
     * @param nStartDate - timestamp of event begining
     * @param nWide      - number of wide columns to take
     * @return string HTML body of event bar
     **/
    
    self._buildBottomEventBar = function(nEvt, aEl, nStartDate, nWide) {
        var dStart = Date.baseDate(nStartDate),
            dNext =  Date.baseDate(nStartDate, 1),
            bNoMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false ,
            aCalendar = !bNoMove ? aEl.getCalendar() : null; //self._parent._calendars.getCalendar(aEl.calendarid)
        return self._getBottomBarHTML({
            "id"        : aEl.id,
            "date"      : dStart,
            "next"      : dNext,
            "calendar"  : aEl.calendarid,
            "specColor" : aEl.specColor,
            "className" : aEl.className,
            "title"     : aEl.title,
            "hoverTitle" : aEl.getTitle(),
            "editable"  : !bNoMove && aCalendar.editable === true && aCalendar.move === true ,
            "start"     : aEl.allDay === true ? aEl.dayStart : aEl.dateStart,
            "end"       : aEl.allDay === true ? Date.baseDate(aEl.dayEnd, 1) : aEl.dateEnd,
            "line"      : nEvt,
            "noLS"      : aEl.noLS || bNoMove || aEl.allDay === true,
            "noRS"      : aEl.noRS || bNoMove || aEl.allDay === true,
            "lFixed"    : aEl.lFixed || aEl.allDay === true,
            "rFixed"    : aEl.rFixed || aEl.allDay === true,
            'wide'      : nWide,
            "allDay"    : aEl.allDay === true,
            "titleHTML" : aCalendar != null && aCalendar.titleHTML === true

        });
        
    }
    self._getBottomBarHTML = function(aParams){
        var aCalculated = self._calculateBottomBarParams(aParams);
        var sHTML = '<div '
            + ' class="evt '
            + ' e' + aParams.line               // event # for day
            + ' i' + aCalculated.nCellLength    // 30 minutes interval length
            + ' s' + parseInt(aCalculated.nCellStart)    // start interval
            + ' ' + (aCalculated.bFT ? "full_t " : "")
            + ' ' + (aCalculated.bFB ? "full_b " : "")
            + ( aParams.wide != undefined && aParams.wide > 0 ? 'wd' + aParams.wide + " " : ' ' )
            + ( aParams.addClass != undefined ? aParams.addClass + " " : ' ' )
            + ( aParams.editable === false ? "non_e " : "")                
            + ( aParams.noEnd != undefined && aParams.noEnd ? "non_r " : "")
            + ( aParams.noLS === true ? "non_ls " : ' ' )        
            + ( aParams.noRS === true ? "non_rs " : ' ' )        
            + ( aParams.lFixed === true ? "fixed_l " : ' ' )        
            + ( aParams.rFixed === true ? "fixed_r " : ' ' )        
            + ( aParams.allDay === true ? "fixed_move_time " : ' ' )
            + '"'
            + ' title="' + aParams.hoverTitle + '"'
            + ' data-e="' + aParams.line + '"'
            + ' data-i="' + aCalculated.nCellLength + '"'
            + ' data-s="' + parseInt(aCalculated.nCellStart) + '"'
            + ' data-allday="' + aParams.allDay + '"'
            + (aParams.calendar != undefined ? ' data-calendar="' + aParams.calendar + '"' : "")
            + ' data-end="' + aParams.end.valueOf() / 1000 + '"'
            + ' data-start="' + aParams.start.valueOf() / 1000 + '"'
            + (aParams.id != undefined ? ' data-event="' + aParams.id + '"' : "")
            + '>' 
            + '<span class="color_' + (aParams.className != undefined ? aParams.className : "" ) 
                + (aParams.specColor != undefined && aParams.specColor != '' ? ' ' + self._parent._events.getEventColor(aParams.specColor) : '')
            + '">'
            + '<span class="title">' 
                + 
                    self._parent._events.getBarLabelTime({
                        "dateStart" : aParams.start,
                        "dateEnd"   : aParams.end,
                        "allDay"    : aParams.allDay
                        }, 
                        !aCalculated.bFT || aCalculated.nCellStart > 0 ? 'hourTitle' : 'shortDatetime'
                    ) 
//                    ( 
//                    ? aParams.start.format(self._parent.options.format.hourTitle) + ' - ' 
//                    : aParams.start.format(self._parent.options.format.shortDatetime) + ' - '
//                )        
                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
            + '</span>'
            + '<span class=t></span><span class=b></span>'
            + '</span>'
            + '</div>';
        return sHTML;
        
    }
    
    
    self._calculateBottomBarParams = function(aParams) {
        if (aParams.start.getTime() > aParams.end.getTime()) {
            Date.swap(aParams.start, aParams.end);
        };
        var aResult = {
            bFT : aParams.start.getTime() < aParams.date.getTime(),
            bFB : aParams.end > aParams.next
        };
        aResult.nCellStart = Math.floor(aResult.bFT ? 0 : aParams.start.getHoursFrom(aParams.date, true) * self._nPeriodMulti);
        aResult.nCellLength = Math.ceil(self._nPeriodMulti * (aResult.bFB ? 24 : aParams.end.getHoursFrom(aParams.date, true))) - aResult.nCellStart;
        return aResult;
    }


    self._setBottomLineCSS = function(nEvts) {
        var nI, aClass = [], aRule = [],
            nMaxEvts = Math.min(nEvts, self._nMaxVisibleItems),
            nRealWidth = parseInt(9500 / nMaxEvts) / 100;
        for (nI = 1; nI < nEvts; nI++){
            aClass.push('.JQ_CA > .CA_r > div._mode-day > div.bottomGridData > div.data > ul > li  div.evts_' 
                + nEvts
                + ' > div.e' + nI);
            aRule.push(
                    nI >= nMaxEvts 
                    ? 'display:none'
                    : 'margin-left: ' + (nI * nRealWidth) + '%;'
//                    : 'margin-left: calc(' + (nI * nRealWidth) + '% + 20px);'
            );
            aClass.push('.JQ_CA > .CA_r > div._mode-day > div.bottomGridData > div.data > ul > li  div.evts_' 
                + nEvts
                + ' > div.wd' + nI);
            aRule.push('width:' + (nRealWidth * (1 + nI)) + '%;');
        }
        aClass.push('.JQ_CA > .CA_r > div._mode-day > div.bottomGridData > div.data > ul > li  div.evts_'
            + nEvts + ' > div');
        aRule.push('width:' + (nRealWidth - 0.2) + '%;');
        changeCssClass(aClass, aRule, true);
    }
    
    /**
     * @private _filterAllDay
     * Filter events list for allDay criteria
     * @param aData list of events
     * @param bAllDay boolean filter value
     * @return array 
     **/
    
    self._filterAllDay = function(aData, bAllDay)  {
        bAllDay = bAllDay || false;
        var aTmp = [].concat(aData);
        aTmp = aTmp.filter(function(el){
            return (el.allDay == bAllDay || (bAllDay == false && el.allDay == undefined))
        });
//        aTmp.quickSort(function(a, b){
//            return (a.dateStart > b.dateStart ) ;
//        });

        return aTmp;
    }
    
    self._checkAllDay = function(el, bAllDay) {
        return (el.allDay == bAllDay || (bAllDay == false && el.allDay == undefined));
    }
    
    
    self._buildRightAgendaData = function(aDayData) {
        aDayData = self._filterAllDay(aDayData, true)
            .concat(self._filterAllDay(aDayData, false));
        self._buildAgendaBars(aDayData);

    }
    
    self._buildAgendaBars = function(aData) {
        var oLi = self._div.find('.agd > .data > ul > li[data-day]').eq(0),
            aEl, nJ,
            dCur = Date.baseDate(self._period.min),
            sDetailsHTML = '', oCalendar, aDetails,
            sHTML = '<span class=detail_day>'
                + dCur.getDate()
                + '</span>'
                + '<table><tbody>';
        oLi.toggleClass('current', dCur.valueOf() == self._parent.options.now.valueOf());
        aData.quickSort('start');
        for (var nI = 0; nI < aData.length; nI++) {
            aEl = aData[nI];
            sDetailsHTML = '';
            oCalendar = aEl.getCalendar(); //self._parent._calendars.getCalendar(aEl.calendarid);
            if (oCalendar.additionalTitle != undefined ){
                sDetailsHTML = aEl.getAdditionalTitle();
                if (sDetailsHTML != '') {
                    sDetailsHTML = '<span class="details">' + sDetailsHTML + '</span>';
                }
            }
            
            sHTML += '<tr class="evt '
                + (oCalendar.editable !== true || oCalendar.move !== true ? "non_e " : "")
                + '" '
                + ' data-calendar="' + aEl.calendarid + '" ' 
                + ' data-event="' + aEl.id + '" ' 
                + '>'
                + '<td class="color_' + aEl.className 
                + (aEl.specColor != undefined && aEl.specColor != '' ? ' ' + self._parent._events.getEventColor(aEl.specColor) : '')
                + '">' 
                + ((aEl.allDay || aEl.dateStart < dCur ) 
                    ? 'All day' 
                    : aEl.dateStart.format(self._parent.options.format.hourTitle))
                + '</td>'
                + '<td'
                + (aEl.specColor != undefined && aEl.specColor.indexOf('_spec_reccuring') >= 0 ? ' class="_spec_reccuring" ' : '')
                + '>'
                + '<span class="title">' 
                + (oCalendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                + '</span>'
                + sDetailsHTML
                + '</td></tr>';
        }
        sHTML += '</tbody></table>';
        oLi.html(sHTML);
    }
    
    
    self._initSwimlaneTopEvent = function(){
        var _barMove = function(el, evt) {
            var aNew = self._getWeekDay(evt),
                sCurrentGroup = aNew.liDiv.data('group'),
                sGroup = el.data('curGroup'),
                oBar = el.data('bar');
             if (sGroup != null && sGroup != sCurrentGroup) {
                el.data('curGroup', sCurrentGroup);
                el.data('curGrDiv').children().removeClass('new_events');
                oBar.detach().appendTo(aNew.liDiv.children());
                aNew.liDiv.children().addClass('new_events');
                el.data('curGrDiv', aNew.liDiv);
            }
        }
        
        self._dom.bottomGroupDataAllDay.simpleSelect({
            "selector"      : '.evt',        // selector for start drag event
            "moveSelector"  : '._grp',     // selector for continue drag event
            "notselector"   : '.non_e, .fixed_move_time',
            "touchhold"     : 1000,             // minimum time that activate "touchhold" event
            "touchradius"   : 10,             // maximum radius for moving finger 
            "clearStop"     : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                self._clearCreatingEvent(el);
                var aNew = self._getWeekDay(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    oBar = evtEl,
                    sGroup = aNew.liDiv.data('group');
                el.data({
                    bar         : oBar,
                    colored     : null,
                    noCancel    : false,
                    noChange    : true,
                    startGrDiv  : aNew.liDiv,
                    curGrDiv    : aNew.liDiv,
                    startGroup  : sGroup,
                    curGroup    : sGroup
                });
                
                if (self._parent.options.readonly.create === false) {
                    return false;
                }
                if (self._parent.isMobile() || oBar == null || self._parent.getParam('longClick', false)) {
//                    _barMove(el, evt);
                }
                return false;
            },
             "stop" : function(el, evt){
                if (self._parent.options.readonly.create === false) {
                    return false;
                }
                
                var aNew = self._getWeekDay(evt),
                    sGroup = el.data('curGroup');
                if (sGroup == null || sGroup == el.data('startGroup')) {
                    return true;
                }
                el.data('noChange', false);
                if (el.data('bar') != undefined && el.data('bar') != null) {
                    var aEvents = {"type" : "list_with_calendars"},
                        oLi = el,
                        bChangeField = (sGroup != el.data('startGroup') && self._sGroup.indexOf('.') < 0),
                        aChangedFieldsValues = {},
                        sCurrentGroupFld;
                    aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                    if (bChangeField) {
                        sCurrentGroupFld = self._aCurrentGrouping[el.data('bar').data('calendar')];
                        if (typeof(aChangedFieldsValues[el.data('bar').data('event')]) == 'undefined') {
                            aChangedFieldsValues[el.data('bar').data('event')] = {};
                        }
                        aChangedFieldsValues[el.data('bar').data('event')][self._aCurrentGrouping[el.data('bar').data('calendar')]] = aNew.liDiv.data('id');
                    }
                    oLi.find('.evt.sel[data-event]').each(function(){
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
                                    aChangedFieldsValues[sEventId][self._aCurrentGrouping[sCalendar]] = aNew.liDiv.data('id');
                                }
                            }
                        }
                    });                
                    var aChange = {};
                    if (!jQuery.isEmptyObject(aChangedFieldsValues)) {
                        aChange.fields = aChangedFieldsValues;
                        self._parent._events.setEvent(aEvents, aChange);
                    }
                    
                }
                return false;
            },
            "cancel" : function(el, evt){
                if (el.data('topArea')) {
                    return false;
                }
                
                if (el.data('noCancel') != undefined && el.data('noCancel')) {
                    return false;
                }
                
                self._clearCreatingEvent();
                if (el.data('noChange') !== true) {
                    view.showData();
                }
            },
            "move" : function(el, evt) {
                if (self._parent.options.readonly.create === false)  {
                    return false;
                }
                return _barMove(el, evt);
            },
            "check" : function(el, evt) {
                var aNew = self._getWeekDay(evt),
                    bChange = (el.data('curGroup') != aNew.liDiv.data('group'));
                return bChange;
            },
        });
    }
    
    /**
     * Show append form by clicking on area (need to implement and use new createView)
     **/
    
    
    
    
    self._initBottomEvent = function() {
        var divBottom, aBasicScrollCoord;
        var _barMove = function(el, evt) {
            var aNew = self._getWeekDay(evt),
                oParentLi = aNew.liDiv,
//                self._sMode == 'default' 
//                    ? self._dom.bottomLi 
//                    :  self._dom.bottomGroup.find('.data li'),
                
                nChangeHours = - (el.data('baseHour') - aNew.hour) / self._nPeriodMulti,
                sCurrentGroup = aNew.liDiv.data('group'),
                sGroup = el.data('curGroup');
            if (nChangeHours < 0 && el.data('creating')) {
                nChangeHours -= self._parent.params.minMinutePeriod / 60;
            }
            var dStart = Date.baseDate(
                    el.data('startDate'), 
                    0 + (el.data('fixedL') === true && nChangeHours < 0 ? -1 : 0), 
                    el.data('resizeL') != false && el.data('fixedL') != true ? nChangeHours : 0
                ),
                dEnd = Date.baseDate(
                    el.data('endDate'), 
                    0 + (el.data('fixedL') === false && nChangeHours > 0 ? 1 : 0), 
                    el.data('resizeL') != true && el.data('fixedL') != false ? nChangeHours : 0
                ),
                oLi, oEvents;
            if (el.data('fixedL') != null && (dEnd < dStart)) {
                if (el.data('fixedL')) {
                    dStart.changeDate(dEnd.getDaysFrom(dStart) - 1);
                } else {
                    dEnd.changeDate(dStart.getDaysFrom(dEnd) + 1);
                }
            }
            if (el.data('colored') == undefined && el.data('bar') != null) {
                el.data('bar')
                    .addClass('new_event')
                    .parent().addClass('new_events');
                el.data('colored', true);
            } else if (el.data('colored') == undefined) {
                el.data('colored', true);
            }
            for (var nI = 0; nI < 1; nI++) {
                oLi = oParentLi.eq(nI);
                oEvents = oLi.children('.events');
                var dNext = Date.baseDate(oLi.data('date'), 1);
                    
                if (dNext >= dStart && oLi.data('date') <= dEnd.getTime() / 1000) {
                    var oBar = el.data('bar'),
                            //oLi.find('.new_event'),
                        aParams = {
                            "start" : dStart,
                            "end"   : dEnd,
                            "date"  : Date.baseDate(oLi.data('date')),
                            "next"  : dNext,
                            "line"  : 0,
                            "addClass"  : "new_event create_event",
                            "title"     : self._parent.getText('custom_create_new', 'Create new') ,
                            "hoverTitle" : self._parent.getText('custom_create_new', 'Create new') 
                        }
                    if (!el.data('creating')) {
                        var oEvent = self._parent._events.getEvent(el.data('bar').data('event'), el.data('bar').data('calendar'));
                        jQuery.extend(aParams, {
                            className : el.data('bar').data('calendar'),
                            calendar  : el.data('bar').data('calendar'),
                            title     : oEvent[0].title,
                            addClass  : "new_event",
                            titleHTML : oEvent[0].getCalendar() != null && oEvent[0].getCalendar().titleHTML
                        });
                    }
                    
                    if (oBar == null || oBar.size() < 1) {
                        oBar = jQuery(self._getBottomBarHTML(aParams));
                        if (el.data('bar') == null) {
                            el.data('bar', oBar);
                        }
                        
                        
                        oEvents.append(oBar);
                        oEvents.addClass('new_events');
                        
                    } else {
                        var aCalculated = self._calculateBottomBarParams(aParams);
                        oBar
                            .removeClass('full_t full_b s' + oBar.data('s') + ' i' + oBar.data('i'))
                            .addClass('s' + aCalculated.nCellStart + ' i' + aCalculated.nCellLength
                                + (aCalculated.bFB ? " full_b " : "")
                                + (aCalculated.bFT ? " full_t " : "")
                            )
                            .data('s', aCalculated.nCellStart)
                            .data('i', aCalculated.nCellLength)
                            .find('.title').html(
                                (!aCalculated.bFT || aCalculated.nCellStart > 0 
                                    ? aParams.start.format(self._parent.options.format.hourTitle) + '-'    
                                        + aParams.end.format(self._parent.options.format.hourTitle) + ' '
                                    : "")
                                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
                                //aParams.title
                            );
                        if (sGroup != null && sGroup != sCurrentGroup) {
                            el.data('curGroup', sCurrentGroup);
                            el.data('curGrDiv').children().removeClass('new_events');
                            oBar.detach().appendTo(aNew.liDiv.children());
                            aNew.liDiv.children().addClass('new_events');
                            el.data('curGrDiv', aNew.liDiv);
                        }
                    }
                } else {
                    oEvents.removeClass('new_events').children('.new_event').remove();
                }
            }
            return false;
        }        
        
        self._div.simpleSelect({
            "selector" : 'div.top div.events',        // selector for start drag event
            "touchhold" : 1000,             // minimum time that activate "touchhold" event
            "touchradius" : 10,             // maximum radius for moving finger 
            "clearStop" : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            "swipe" : function(el, evt, aDelta) {
                if (!self._parent.isMobile()) {
                    return false;
                }
                
                return self._swipeBottom(el, evt, aDelta);
            },
            "swipeDelta" : {x : 100, y : 30}
        });
        
        self._div.simpleSelect({
            "selector"      : 'div.bottom  div.evt, div.bottom div.events, .swim_bot .data .events, .swim_bot  .data div.evt',        // selector for start drag event
            "moveSelector"  : 'div.bottom > div.data, .swim_bot .data ',     // selector for continue drag event
            "notselector"   : '.hours_title, .non_e, .fixed_move_time',
            "touchhold"     : 1000,             // minimum time that activate "touchhold" event
            "touchradius"   : 10,             // maximum radius for moving finger 
            "clearStop"     : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                self._clearCreatingEvent(el);
                var 
                    oTarget = jQuery(evt.target),
                    aNew = self._getWeekDay(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    oBar = evtEl.hasClass('evt') && !evtEl.hasClass('create_event') ? evtEl : null,
                    sGroup = aNew.liDiv.data('group'),
                    bResize = oBar != null && !oBar.hasClass('non_r') && oTarget.filter('span.t, span.b').size() > 0
                        ? (oTarget.filter('span.t').size() > 0 && !oBar.hasClass('non_ls')
                            ? true 
                            : (oTarget.filter('span.b').size() > 0 && !oBar.hasClass('non_rs') ? false : null)
                        )
                        : null;
                el.data({
                    fixedL      : oBar != null && oBar.is('.fixed_l, .fixed_r') ? oBar.is('.fixed_l') : null,
                    resizeL     : oBar == null ? false : bResize ,
                    currentDay  : aNew.day, 
                    currentHour : aNew.hour,
                    baseHour    : aNew.hour,
                    baseDate    : new Date(aNew.date * 1000),
                    startDate   : oBar == null 
                                    ? Date.baseDate(aNew.date, 0, aNew.hour / self._nPeriodMulti 
                                        + parseInt(self._parent.aCalculated.startHour))
                                    : new Date(evtEl.data('start') * 1000),
                    endDate     : oBar == null 
                                    ? Date.baseDate(aNew.date, 0, aNew.hour / self._nPeriodMulti 
                                            + parseInt(self._parent.aCalculated.startHour) 
                                            + self._parent.params.minMinutePeriod / 60
                                    )
                                    : new Date(evtEl.data('end') * 1000),
                    bar         : oBar,
                    colored     : null,
                    creating    : oBar == null,
                    noCancel    : false,
                    noChange    : true,
                    startGrDiv  : aNew.liDiv,
                    curGrDiv    : aNew.liDiv,
                    startGroup  : sGroup,
                    curGroup    : sGroup
                });
                if (el.data('topArea') || (oBar == null && self._parent.options.readonly.create === false)) {
                    return false;
                }
                if (self._parent.isMobile() || oBar == null || self._parent.getParam('longClick', false)) {
                    _barMove(el, evt);
                }
                return false;
            },
            "stop" : function(el, evt){
                if (el.data('topArea') 
                    || (el.data('creating') && self._parent.options.readonly.create === false)
                ) {
                    return false;
                }
                
                var aNew = self._getWeekDay(evt),
                    nChangeHours = - (el.data('baseHour') - aNew.hour) / self._nPeriodMulti,
                    sGroup = el.data('curGroup');
                if (nChangeHours == 0 && !el.data('creating') && (sGroup == null || sGroup == el.data('startGroup'))) {
                    return true;
                }
                el.data('noChange', false);
                if (el.data('creating')) {
                    var dStart = Date.baseDate(el.data('startDate')),
                        dEnd = Date.baseDate(dStart, 0, nChangeHours + (nChangeHours >= 0 ? self._parent.params.minMinutePeriod / 60 : 0));
                    if (dEnd < dStart) {
                        Date.swap(dEnd, dStart);
                    }
                    el.data('noCancel', true);
                    _barMove(el, evt);
                    
                    var aPredefine = [];
                    if (self._sMode == 'grouping') {
                        aPredefine.push({
                            name    : self._sGroup, 
                            value   : aNew.liDiv.data('id'),
                            oper    : "equal",
                            text    : aNew.liDiv.data('group'),
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
                        "event" : evt,
                        "allDay" : false,
                        predefine : aPredefine
                    });
                    
                } else if (el.data('bar') != undefined && el.data('bar') != null) {
                    var aEvents = {"type" : "list_with_calendars"},
                        oLi = self._sMode == 'grouping' ? self._dom.bottomGroup : self._dom.bottom,
                        bChangeField = (sGroup != el.data('startGroup') && self._sGroup.indexOf('.') < 0),
                        aChangedFieldsValues = {},
                        sCurrentGroupFld;;
                    aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                    if (bChangeField) {
                        sCurrentGroupFld = self._aCurrentGrouping[el.data('bar').data('calendar')];
                        if (typeof(aChangedFieldsValues[el.data('bar').data('event')]) == 'undefined') {
                            aChangedFieldsValues[el.data('bar').data('event')] = {};
                        }
                        aChangedFieldsValues[el.data('bar').data('event')][self._aCurrentGrouping[el.data('bar').data('calendar')]] = aNew.liDiv.data('id');
                    }
                    oLi.find('.evt.sel[data-event]').each(function(){
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
                                    aChangedFieldsValues[sEventId][self._aCurrentGrouping[sCalendar]] = aNew.liDiv.data('id');
                                }
                            }
                        }
                    });                
                    var aChange = {
                            hour_left_change : (el.data('resizeL') != false ? nChangeHours : 0),
                            hour_right_change : (el.data('resizeL') != true ? nChangeHours : 0)
                        };
                    if (!jQuery.isEmptyObject(aChangedFieldsValues)) {
                        aChange.fields = aChangedFieldsValues;
                    }
                    self._parent._events.setEvent(
                        aEvents, 
                        aChange
                    );
                }
                return false;
            },
            "cancel" : function(el, evt){
                if (el.data('topArea')) {
                    return false;
                }
                
                if (el.data('noCancel') != undefined && el.data('noCancel')) {
                    return false;
                }
                
                self._clearCreatingEvent();
                if (el.data('noChange') !== true) {
                    view.showData();
                }
            },
            "move" : function(el, evt) {
                if (el.data('topArea') 
                    || (el.data('creating') && self._parent.options.readonly.create === false)
                )  {
                    return false;
                }
                return _barMove(el, evt);
            },
            "check" : function(el, evt) {
                if (el.data('topArea')) {
                    return false;
                }
                
                var bResult = self._isCellChange(el, evt);
                return bResult;
            },
            "swipe" : function(el, evt, aDelta) {
                if (!self._parent.isMobile()) {
                    return false;
                }
                
                return self._swipeBottom(el, evt, aDelta);
            },
            "scroll" : function(el, evt, aDelta, sMode) {
                if (sMode != undefined && sMode == 'init') {
                    divBottom = self._sMode == 'default' ? self._dom.bottomData : self._dom.bottomGroupEventsData;
                    aBasicScrollCoord = divBottom.scrollTop();
                    return;
                }
                divBottom.scrollTop(aBasicScrollCoord - aDelta.y);
                
            },
            "swipeDelta" : {x : 100, y : 30}

        });        
    }    
    
    
    self._getWeekDay = function(evt) {
        var dt = new Date(),
            
            el = jQuery(evt.target),
            oDataDiv = self._sMode == 'default' ? self._dom.bottomData : self._dom.bottomGroupEventsData,
            sStyle = el.parents('.top').size() > 0 ? 'top' : "bottom",
            aCalculated = (self._cacheCoords == undefined || dt.getTime() - 1000 > self._cacheCoords.dt) 
                ? self._cacheCoords = self._getCalculatedCell(
                        oDataDiv, 
                        dt
                    )
                : self._cacheCoords,
            nHourPeriod = sStyle == 'bottom' 
                ? parseInt((evt.clientY + oDataDiv.scrollTop() - aCalculated.aOffset.top) / 30)
                : undefined;

        return {
            "date"      : nHourPeriod == undefined ? self._period.min 
                : (self._sMode == 'default' ? self._dom.bottomLi.data('date') : self._period.min),
                        //oDataDiv.find('li.hours_data').data('date')),
            "hour"      : nHourPeriod,
            "liDiv" : self._sMode == 'grouping' 
                ? (el.hasClass('_grp') ? el : el.parents('._grp')) 
                : el.parents('li.month')
        }
    }
    
    
    self._getCalculatedCell = function (div, dt) {
        return {
            aOffset : div.offset(),
            dt : dt.getTime()
        }
    }
    
    self._isCellChange = function(el, evt) {
        var aOld = {"hour" : el.data('currentHour')},
            aNew = self._getWeekDay(evt);
        el.data({currentHour : aNew.hour});
        var bResult = (aOld.hour != aNew.hour);
        if (!el.data('creating')) {
            var sOldGroup = el.data('curGroup');
            if (aNew.liDiv.data('group') != sOldGroup) {
                bResult = true;
            }
        }
        return bResult;
    }

    self._clearCreatingEvent = function(oEl){
//        self._div.find('.new_events').removeClass('new_events')
//            .children('.new_event').removeClass('.new_event')
//            .parent().children('.create_event').remove();
    
        var aDiv = self._div.find('.new_events').removeClass('new_events');
        aDiv.children('.create_event').remove();
        if (oEl != undefined) {
            self._div.find('.new_event').removeClass('new_event');
        }
    
        
    }
    
    self._swipeBottom = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > Math.abs(aDelta.y) && Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
        }
    }
    
    self._expand = function(bMode) {
        var divTop = self._dom.top.find('.events'),
            divBottom  = self._dom.bottom.children('.data');
        if (bMode) {
            var nTopHeight = (divTop.size() > 0 ? divTop[0].scrollHeight : 0),
                nBottomHeight = (divBottom.size() > 0 ? divBottom[0].scrollHeight : 0),
                nTopAdd = nTopHeight - divTop.height(),
                nBottomAdd = nBottomHeight - divBottom.height();
            if (nTopHeight > 0) {
                self._dom.top.height(nTopHeight + 50);
                divTop.height(nTopHeight);
                self._dom.bottom.css('top', nTopHeight + 50 + 'px');
            }
            if (nBottomHeight > 0) {
                divBottom.height(nBottomHeight);
            }
            
            self._parent._dom.el
                .height(self._parent._dom.el.height() + nTopAdd + nBottomAdd);
        } else {
            self._parent._dom.el.height('');
            divTop.height('');
            divBottom.height('');
            self._dom.bottom.css('top', '');
            self._dom.top.height('');
        }
    }
    
    self._toggleAgendaMode = function() {
        switch(self._sMode) {
            case 'agenda' :
                self._buildRightAgendaGrid();
                break;
            case 'grouping' : 
                self._fillGrouping();
                break;
            default :
                self._buildRightTopGrid();
                self._buildRightBottomGrid();
        }
        view.showData();
    }
    
    self._fillGrouping = function(){
        var aCals = self._parent.layout.getActiveCalendars();
        var aAllCalendars = [].concat(aCals.calendar),
            aObjects = [],
            oCalendar;

        if (aCals.group.length > 0) {
            aAllCalendars = aAllCalendars.concat(self._getCalendarsForGroup(aCals.group));
//            self._setCalendar2Group(params.calendars.group);
        }
        
        aAllCalendars = aAllCalendars.unique();
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
        self._parent._addQueue([
            function(){
                if (self._aPresets == null) {
                    self._parent._objects.loadSpecialSettings('swimlane', function(data){
                        self._aPresets = typeof(data) == 'string' ? JSON.parse(data) : data;
                    });
                }
            },
            function()    {
                if (self._aListViews.length == 0) {
                    self._parent._objects.getListviewOptions('user', function(aData){
                        var aResult = [];
                        for (var nI = 0; nI < aData.length; nI++) {
                            aResult.push(aData[nI]);
                        }
                        aResult.quickSort('label', {'lowercase' : true});
                        self._aListViews = aResult;
                    });
                }
            },
            function(){
            self._parent._objects.getObjectsFieldsIntesect(
                aObjects, 
                ["REFERENCE", 'TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX'], 
                function(aFields){
                    self._fillForm(aFields, self._aListViews, self._aPresets);
                }
            );
            }
        ]);
    }
    
     self._fillForm = function(aFields, aListviews, aPresets) {
        var sHTML = '', sVal;
        
        if (aListviews != undefined && aListviews.length > 0) {
            if (self._sGroupType == null || (self._sGroupType == 'field' && !aFields.hasOwnProperty())){
                sHTML += '<option value="">' + self._parent.getText('select', 'Select') + '...</option>';
                self._sGroupType = null;
            }
            sHTML += '<optgroup label="' 
                    + self._parent.getText('swimlane_user_list_views', 'User list views')
                    + '" data-type="listview">';
            for (var nJ = 0; nJ < aListviews.length; nJ++) {
                sVal = aListviews[nJ].label;
                sHTML += "<option  value=" + aListviews[nJ].id + " "
                    + (self._sGroup == aListviews[nJ].id ? 'selected' : "")                
                    + ">" + sVal.htmlspecialchars();
            }
            sHTML += '</optgroup>';
        }
        sHTML += '<optgroup label="Swimlane Custom Group By" data-type="preset">';
        if (aPresets != undefined && aPresets.length > 0) {
            
            for (var nJ = 0; nJ < aPresets.length; nJ++) {
                sHTML += "<option  value=" + aPresets[nJ].id + " "
                    + (self._sGroup == aPresets[nJ].id ? 'selected' : "")                
                    + ">" + aPresets[nJ].label.htmlspecialchars();
            }
        }
        
        sHTML += '</optgroup>';
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
                        + (self._sGroup == aField.name ? 'selected' : "")
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
                                + (aField.name + '.' + aRefFields[nJ].name == self._sGroup ? 'selected' : '')
                                + '>&nbsp;&nbsp;&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
                            }
                        }
                    }  
            }); 
            sHTML += '</optgroup>';
        }
        var oSelect = self._dom.header.find('select[name="grouping"]');
        
        oSelect.html(sHTML);
        self._sGroup = oSelect.val();
        self._sGroupType = oSelect.find('option:selected').parent().data('type');
        if (self._sGroupType == null || self._sGroupType == 'undefined') {
            self._showEmptyMessage(
                self._parent.getText('message_please_select_list_view', 'Please select a user list from the drop-down'), 
                false
            );
        }
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
    
  
    self._buildRightGroupingData = function(){
        self._nBlockHeight = 3600 / (60 / parseInt(self._parent.params.minMinutePeriod));
        self._nPeriodMulti = (60 / parseInt(self._parent.params.minMinutePeriod));
        
        self._aGroupingTitles = [];
        var aTitles = {}, oTitle,
            bAddNew = true;
        if ((self._sGroupType == 'listview' || self._sGroupType == 'preset') && self._aListViewRecords[self._sGroup] != undefined) {
            for (var nI = 0; nI < self._aListViewRecords[self._sGroup].length; nI++) {
                aTitles[self._aListViewRecords[self._sGroup][nI].name] = self._aGroupingTitles.length;
                self._aGroupingTitles.push({
                    title : self._aListViewRecords[self._sGroup][nI].label || '-',
                    name  : self._aListViewRecords[self._sGroup][nI].name,
                    top : [],
                    bottom : [],
                    id : self._aListViewRecords[self._sGroup][nI].id
                });
            }
            bAddNew = false;
        }
        
        for (var nI = 0; nI < self._eventsData.length; nI++) {
            if (self._eventsData[nI].group == undefined) {
                continue;
            }
            if (aTitles[self._eventsData[nI].group] == undefined) {
                if (bAddNew) {
                    aTitles[self._eventsData[nI].group] = self._aGroupingTitles.length;
                    self._aGroupingTitles.push({
                        title : (self._eventsData[nI].group != 'null' ? (self._eventsData[nI].group || '-') : '-'),
                        name : self._eventsData[nI].group,
                        top : [],
                        bottom : [],
                        id : self._eventsData[nI].group
                    });
                } else {
                    continue;
                }
            }
            oTitle = self._aGroupingTitles[aTitles[self._eventsData[nI].group]];
            if ((self._parent.params.dayModeArea !== '0_1' && self._checkAllDay(self._eventsData[nI], true)) 
                || self._parent.params.dayModeArea === '1_0'
            ) {
                oTitle.top.push(self._eventsData[nI]);
            } else if (self._parent.params.dayModeArea === '0_1' 
                || (self._parent.params.dayModeArea !== '1_0' && self._checkAllDay(self._eventsData[nI], false))
            ) {
                oTitle.bottom.push(self._eventsData[nI]);
            }
//            oTitle.events.push(self._eventsData[nI]);
        }
        
        if (self._dom.bottomGroup == null || self._dom.bottomGroup.size() < 1) {
            self._buildRightGroupingGrid();
        }
        self._dom.bottomGroupData.toggleClass('current', self._parent.options.now.valueOf() == self._period.min.valueOf())
        if (self._bResetGroupingSctoll) {
            self._bResetGroupingSctoll = false;
            self._scrollBottomArea();
        }
        var sHTML = '',
            sTitle = '';
        self._aGroupingTitles.quickSort('title');
        if (self._aGroupingTitles.length < 1) {
            self._aGroupingTitles.push({
                title : '-',
                name : '',
                top : [],
                bottom : [],
                id : ''
            });
        }
        for (var nJ = 0; nJ < self._aGroupingTitles.length; nJ++) {
            sTitle += '<span class="_grp_title" data-group="' + self._aGroupingTitles[nJ].name.htmlspecialchars() + '">'
                    + self._aGroupingTitles[nJ].title.htmlspecialchars()
                    + '</span>';
            sHTML += '<span class="_grp" '
                + ' data-date="' + (self._period.min.getTime() / 1000) + '" '
                + ' data-group="' + self._aGroupingTitles[nJ].name.htmlspecialchars() + '" '
                + ' data-id="' + self._aGroupingTitles[nJ].id.htmlspecialchars() + '" '
                + ' data-title="' + self._aGroupingTitles[nJ].title.htmlspecialchars() + '" '
                + ' >'
                + '<div data-day="0" class="events evts_1" data-lines="1"></div>'
                + '</span>';
        }
        self._dom.bottomGroupTitle.html(sTitle);
        self._dom.bottomGroupData.html(sHTML);
        self._dom.bottomGroupDataAllDay.html(sHTML);
        
        self._fillGroupingData();
    }
    
    self._buildRightGroupingGrid = function(){
        var dTmp = new Date(2000,1,1, self._parent.aCalculated.startHour, 0, 0, 0),
            sHTML = '<div class="grid scroll"><ul class="hour_v_area"><li class="hours_title scroll_pad_b">';
        for (var i = parseInt(self._parent.aCalculated.startHour); i < parseInt(self._parent.aCalculated.stopHour); i++) {
            sHTML += '<span>' + dTmp.format(self._parent.options.format.hourTitle) + '</span>';
            dTmp.changeHour(1);
        }
        sHTML += '</li></ul></div>'
            + '<div class="_title scroll_pos_r"></div>'
            + '<div class="data">'
                + '<ul class="hour_v_area"><li class="hours_data" data-date="' + (self._period.min.getTime() / 1000) + '">' 
                + '<div class="_groups"></div</li>'
                + '</ul>'
            + '</div>'
            + '<div class="_allday"><div class="_groups"></div</div>';
        self._dom.bottomGroup = jQuery('<div class="swim_bot bottomGridData">' + sHTML + '</div>').appendTo(self._div);
        
        self._dom.bottomGroupGrid = self._dom.bottomGroup.children('.grid');
        self._dom.bottomGroupTitle = self._dom.bottomGroup.children('._title');
        
        self._dom.bottomGroupEventsData = self._dom.bottomGroup.find('.data');
        self._dom.bottomGroupData = self._dom.bottomGroupEventsData.find('._groups');
        
        self._dom.bottomGroupEventsAllDay = self._dom.bottomGroup.find('._allday');
        self._dom.bottomGroupDataAllDay = self._dom.bottomGroupEventsAllDay.find('._groups');
        
        self._dom.bottomGroupEventsData.on('scroll', function(evt){
            self._dom.bottomGroupTitle.scrollLeft(self._dom.bottomGroupEventsData.scrollLeft());
            self._dom.bottomGroupGrid.scrollTop(self._dom.bottomGroupEventsData.scrollTop());
            self._dom.bottomGroupEventsAllDay.scrollLeft(self._dom.bottomGroupEventsData.scrollLeft());
        });
        if (!self._parent.options._small || !self._parent.isMobile()) {
            self._initSwimlaneTopEvent();
        }
    }
    
    self._fillGroupingData = function(){
        var oLI, aTop,
            dMin = Date.baseDate(self._period.min),
            dMax = Date.baseDate(dMin).changeDate(1).changeSecond(-1);
        for (var nJ = 0; nJ < self._aGroupingTitles.length; nJ++) {
            if (self._aGroupingTitles[nJ].bottom.length > 0) {
                oLI = self._dom.bottomGroupData.children('[data-group="' + self._aGroupingTitles[nJ].name  + '"]');
                self._buildDailyBars(self._aGroupingTitles[nJ].bottom, oLI);
            }
            if (self._aGroupingTitles[nJ].top.length > 0) {
                aTop = self._parent._events.splitEventsByLine(
                    self._aGroupingTitles[nJ].top,
                    {
                        "min" : dMin,
                        "max" : dMax
                    }
                );
                oLI = self._dom.bottomGroupDataAllDay.children('[data-group="' + self._aGroupingTitles[nJ].name  + '"]');
                self._buildRightTopData(aTop, oLI);
            }
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
    
    self._getPreset = function(sId) {
        if (self._aPresets == null) {
            return null;
        }
        for (var nJ = 0; nJ < self._aPresets.length; nJ++) {
            if (self._aPresets[nJ].id == sId) {
                return self._aPresets[nJ];
            }
        }
        return null;
    }
    
    self._cancelAction = function()  {
        self._parent.hidePopup();
    }


    jQuery.calendarAnything.appendView('day', view);
})();
