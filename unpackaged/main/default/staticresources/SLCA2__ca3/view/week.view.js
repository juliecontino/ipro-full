/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */

(function(){
    var self = {
        _css        : '/css/week.css',
        _parent     : null,     //parent
        _div        : null,
        _period     : {min : new Date(), max : new Date()},
        _eventsData : [],
        _nBlockHeight : 1,
        _nPeriodMulti : 0,
        _dom        : {},
        _cssHourlyLines : [],
        _newHourlyLines : [],
        _nMaxCSSLines   : 0,
        _firstTime      : true,
        _agenda         : false,
        _bAutoAgenda    : null,
        _nMaxVisibleItems : 20
    };
    var view = {
        self : self
    };

    /** 
    * public init
    * @param {DOM} div current div
    * @param {Refenerce} parent reference to JQ_CA
    *
    * Init all necessary data
    */

    view.init = function(div, parent) {
        self._parent = parent;
        self._parent.loadCss(self._css);
        view.changeCurrentPeriod(self._parent.options, 0);
        if (self._parent.options.agenda === true || self._parent.params.weekViewAgenda === true) {
            self._agenda = true;
        } else if (self._parent.options.agenda === false) {
            self._agenda = false;
        }

    }
    
    /** 
    * @public show
    * draw grid
    * @param {String} sMode "toggle" - for new view
    * @return void;
    */
    
    
    view.show = function(sMode) {
        if (self._parent.options._small && self._parent.options._orient == 'vertical') {
            self._parent.toggleMode('day');
            return;
        }

        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('week');
            self._initEvents();
            self._firstTime = true;
        }
        if (sMode === 'toggle') {
//            self._dom.bottom = undefined;
        }
        view.changeCurrentPeriod(self._parent.options, 0);
//        if (self._parent.options.agenda !== false && self._parent.options._small && !self._agenda) {
//            self._agenda = true;
//        }
        if (self._agenda) {
            if (!self._div.hasClass('agenda')) {
                self._div.toggleClass('agenda', true);
            }
            self._buildRightAgendaGrid();
        } else {
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
        view.show();
    }
    
    /** 
    * @public showData
    *
    * Public method, view data on grid
    *
    */
    
    view.showData = function(aParams) {
        if (self._parent._currentModeName !== 'week') {
            return;
        }
        aParams = aParams || {};
        var dMax = Date.baseDate(self._period.max),
            dCompareBase = Date.baseDate(self._period.min);
        dMax.setHours(23, 59, 0, 0);
        
        aParams.calendars = self._parent.layout.getActiveCalendars();
        aParams.min = new Date(self._period.min);
        aParams.max = dMax;
        
        self._parent._events.getData(aParams, function(data){
            if (dCompareBase.getTime() != self._period.min.getTime()) {
                return;
            }
            if (!self._agenda) {
                if (self._parent.params.dayModeArea !== '0_1') {
                    var aTop = self._parent._events.splitEventsByLine(
                        self._filterAllDay(data, self._parent.params.dayModeArea !== '1_0' ? true : null),
                        {
                            "min" : Date.baseDate(self._period.min),
                            "max" : Date.baseDate(dMax)
                        }
                    );
                    self._buildRightTopData(aTop);
                }
                if (self._parent.params.dayModeArea !== '1_0') {
                    self._buildRightBottomData(); //aBottom
                }
            } else {
                self._buildRightAgendaData(data);
            }
        });
    }
    
    /**
     * @public getTitle
     * @return string formated title
     **/
    
    
    view.getTitle = function(){
        return self._period.min.format('mmm d - ')
            + (self._period.min.getMonth() != self._period.max.getMonth()
                ? self._parent.options.max.format('mmm') + ' ' 
                : "")
            + self._period.max.format('d, yyyy');
    }

    /**
     * @public changeCurrentPeriod
     * @param {JSON} aOptions CA parent options
     * @param {Mixed} mDirection direction to change (date / integer)
     * Calculate new period parameters and set it to aOption(referance object)
     * @return void
     **/

    view.changeCurrentPeriod = function(aOptions, mDirection) {
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
            aOptions.current.setHours(0, 0, 0, 0);
        } else {
            aOptions.current.setDate(aOptions.current.getDate() + mDirection * 7);
        }
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date(aOptions.current);
        } else {
            aOptions.min.setTime(aOptions.current)
        }
        aOptions.min.resetFirstWeekDay(self._parent.params.startWeekDay);
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = Date.baseDate(aOptions.min, 6);
        } else {
            aOptions.max.setTime(aOptions.min)
            aOptions.max.changeDate(6);
        }
        
        self._period.min.setTime(aOptions.min.getTime());
        self._period.max.setTime(aOptions.max.getTime());
    }

    view.delEvent = function(mEventId) {
        view.showData();
    }

    view.refresh = function(params) {
        view.showData();
    }

    view.resize = function(bChangeSmall, bChangeOrient){
        self._cacheCoords = undefined;
        var aWeekNames = self._parent.options._small 
                ? self._parent.text.weekShort 
                : self._parent.text.week;

        if (bChangeSmall) {
            for (var i = self._parent.params.startWeekDay; i < 7 + self._parent.params.startWeekDay; i++) {
                if (self._dom.top != undefined) {
                    self._dom.top.find('.days li[data-day="' + (i % 7) + '"]').text(aWeekNames[i % 7]);
                }
                if (self._dom.agenda != undefined) {
                    self._dom.agenda.find('.days li[data-day="' + (i % 7) + '"]').text(aWeekNames[i % 7]);
                }
            }
        }
        if (self._parent.options._small && self._parent.options._orient == 'vertical') {
            self._parent.toggleMode('day');
            return;
        }        
    }
    
    view.clearView = function() {
        self._div = null;
        if (self._dom == undefined) {
            return;
        }
        if (self._dom.bottomLi != undefined && self._dom.bottomLi != null) {
            self._dom.bottomLi.remove();
        }
        if (self._dom.bottom != undefined && self._dom.bottom != null) {
            self._dom.bottom.remove();
        }
        if (self._dom.top != undefined && self._dom.top != null) {
            self._dom.top.remove();
            delete self._dom.top;
        }
        if (self._dom.agenda != undefined && self._dom.agenda != null) {
            self._dom.agenda.remove();
            delete self._dom.agenda;
        }
        if (self._parent.params.weekViewAgenda !== self._agenda ) {
            self._agenda = self._parent.params.weekViewAgenda;
        }
    }


    view.preparePrint = function(bMode) {
        self._expand(bMode);
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
            self._parent.options.scrollLine = self._dom.bottom.children('.data').scrollTop();
        }
    }


    /**
     * @private _initEvents
     * Init default events for whole week view
     * @return void
     **/
    
    self._initEvents = function() {
        if (self._parent.options._small && self._parent.isMobile()) {
            self._parent._prependQueue([function(){
                    var nXPos, nYPos, nTimer = null, aScrollArea;
                    self._div.on('calongtouch', {
                        handle : {
                            "move" : true,
                            "longtouch" : true,
                            "zoom" : true,
                            "swipe" : true
                        },
                        preventDefaultMove : false
                        
                    }, function(evt){
                        
                        switch(evt.data.type) {
                            case "swipe" :
                                if (evt.data.what != 'h') {
                                    return;
                                }
                                self._parent.layout.changePeriod(evt.data.where ? -1 : 1);
                                break;
                            case 'longtouch' : 
                                self._parent.layout.showAreaSubmenu(jQuery(evt.currentTarget), evt);
                                break;
                            case 'move' :
                                if (jQuery(evt.target).parent('.evt').size() < 1){
                                    return;
                                }
                                
                                if (evt.data.initMode == 'init') {
                                    aScrollArea = self._dom.agenda.children('.data')
                                        .add(self._dom.agenda.children('.days').children('ul'))
                                        .add(self._dom.agenda.children('.grid'));
                                    nXPos = self._dom.agenda.children('.data').scrollLeft();
                                    nYPos = self._dom.agenda.children('.data').scrollTop();
                                    break;
                                }
                                if (nTimer != null) {
                                    break;
                                }
                                nTimer = setTimeout(function(){
                                    aScrollArea.scrollLeft(nXPos + evt.data.startDeltaX)
                                        .scrollTop(nYPos + evt.data.startDeltaY);
                                    nTimer = null;
                                }, 100);
                                
                                break;
                            case "zoom" :
                                if (evt.data.zoom) {
                                    self._parent.toggleMode('day');
                                } else {
                                    self._parent.toggleMode('month');
                                }
                                break;
                        }
                    });
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.ca.touch.js');
                }
            ]);
        } else {
            if (self._parent.options.readonly !== true) {
                self._parent._prependQueue([
                    function(){
                        self._initTopEvent();
                        self._initBottomEvent();
                    },
                    function(){
                        self._parent._initScripts('/plugin/jquery.simpleselect.js');
                    }
                ]);
            }
        }
        self._div
            .on(self._parent.eventNames.down, 'span.detail_day', function(evt){
                var el = jQuery(this).parent();
                self._parent.toggleMode('day', false, el.data('date'));
                return false;
            })
            .on('click', '.hours_title > input', function(evt){
                self._toggleAgendaMode(jQuery(evt.target).is(':checked'));
                self._bAutoAgenda = null;
                return self._parent._cancelBubble(evt);
            });
        

    }
    
    /**
     * @private _buildRightTopGrid
     * Draw top grid
     **/
    
    self._buildRightTopGrid = function(){
        var i, dNext,
            aWeekNames = self._parent.options._small 
                ? self._parent.text.weekShort 
                : self._parent.text.week,
            sHTML = '<div class=top><div class="days scroll_pos_r"><ul><li class="hours_title">'
//                + (self._parent.params.insideEdit == '1'  ? '<input type="checkbox" title="Agenda Mode" />' : '')
                + '<input type="checkbox" title="'
                    + self._parent.getText('day_agenda_mode', 'Agenda Mode') 
                + '" />'
                + '</li>',
            dStart = new Date(self._period.min),
            dCur = new Date(dStart);
        for (i = self._parent.params.startWeekDay; i < 7 + self._parent.params.startWeekDay; i++) {
            sHTML += '<li data-day="' 
                    + (i % 7) + '">' + aWeekNames[i % 7] 
                    + '<span>' + dCur.getDate() + '</span>'
                    + '</li>';
            dCur.changeDate(1);
        }
        sHTML += '</ul></div><div class=days_right></div>';
        var sDayClass = '';
        dCur.setTime(dStart.getTime());
        var nWeek = 0;  
        sHTML += '<div class=data data-week="' + nWeek + '">';
        sHTML += '<ul class="scroll_pos_r"><li></li>';          // "Show hidden" frase
        for (i = 0; i < 7; i++){
            sDayClass = dCur >= self._parent.options.min && dCur <= self._parent.options.max 
                ? "month"
                : "";
            sDayClass += (dCur.valueOf() == self._parent.options.now.valueOf()) ? ' current' : '';
            sHTML += '<li '
                + 'class="' + sDayClass + '" '
                + 'data-date="' + (dCur.valueOf() / 1000) + '"'
                + 'data-day="' + dCur.getDay() + '"'
                + '>' 
                + '<span class=more></span>';
            dCur.changeDate(1);
        }
        sHTML += '</ul>';
        sHTML += '</div></div>';
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
        
        var dStart = new Date(self._period.min),
            sDayClass = '',
            dCur = new Date(dStart),
            sHTML = '<div class=bottom>'
                + '<div class=data>'
                + '<ul class="hour_v_area"><li class="hours_title">',
            dTmp = new Date(2000,1,1, self._parent.aCalculated.startHour, 0, 0, 0);
        for (var i = parseInt(self._parent.aCalculated.startHour); i < parseInt(self._parent.aCalculated.stopHour); i++) {
            sHTML += '<span>' + dTmp.format(self._parent.options.format.hourTitle) + '</span>';
            dTmp.changeHour(1);
        }
        sHTML += '</li>';
        
        for (i = 0; i < 7; i++){
            sDayClass = dCur >= self._parent.options.min && dCur <= self._parent.options.max 
                ? "month"
                : "";
            sDayClass += (dCur.valueOf() == self._parent.options.now.valueOf()) ? ' current' : '';                
            sHTML += '<li '
                + 'class="' + sDayClass + '" '
                + 'data-date="' + (dCur.valueOf() / 1000) + '"'
                + 'data-day="' + dCur.getDay() + '"'
                + 'data-d="' + dCur  + '"'
                + '>';
            dCur.setDate(dCur.getDate() + 1);
        }
        sHTML += '</ul>';
        sHTML += '</div></div>';
        self._div.append(sHTML);
        self._dom.bottom = self._div.find('.bottom');
        self._dom.bottomLi = self._dom.bottom.find('ul.hour_v_area > li').not('.hours_title');
        self._scrollBottomArea();
    }
    
    self._scrollBottomArea = function(){
        if (self._dom.bottom != undefined 
            && self._parent.options.scrollLine != undefined 
            && self._parent.options.scrollLine > 0
        ) {
            self._dom.bottom.children('.data').scrollTop(self._parent.options.scrollLine);
            setTimeout(function(){
                self._dom.bottom.children('.data').scrollTop(self._parent.options.scrollLine);
            }, 300);
        }
    }   
    
    self._buildRightAgendaGrid = function() {
        var dStart = new Date(self._period.min),
            dCur = new Date(dStart),
            i,
            aWeekNames = self._parent.options._small 
                ? self._parent.text.weekShort 
                : self._parent.text.week;
;
        if (self._dom.agenda != undefined) {
            var aHour = self._dom.agenda.find('.days.scroll_pos_r li:not(.hours_title)');
            for (i = 0; i < 7; i++) {
                aHour.eq(i).find('span').text(dCur.getDate());
                dCur.changeDate(1);
            }
            return;
        }
        var sHTML = '<div class=agd><div class="days scroll_pos_r"><ul><li class="hours_title">'
                + '<input type="checkbox" title="'
                    + self._parent.getText('day_agenda_mode', 'Agenda Mode') 
                + '" checked/>'
                + '</li>',
             sGridHTML = '', sDataCell = '';
        for (i = self._parent.params.startWeekDay; i < 7 + self._parent.params.startWeekDay; i++) {
            sHTML += '<li data-day="' 
                    + (i % 7) + '">' + aWeekNames[i % 7] 
                    + '<span>' + dCur.getDate() + '</span>'                
                    + '</li>';
             dCur.changeDate(1);
        }
        for (dCur.setTime(dStart.getTime()),  i = 0; i < 7; i++){
            sGridHTML += '<li '
                + ' data-date="' + (dCur.valueOf() / 1000) + '" '
                + ' data-day="' + dCur.getDay() + '" '
                + '>'
                + '</li>' ;
            sDataCell += '<li '
                + ' data-date="' + (dCur.valueOf() / 1000) + '" '
                + ' data-day="' + dCur.getDay() + '" '
                + '>'
                + '</li>' ;
            dCur.changeDate(1);
        }
        sHTML += '</ul></div><div class=days_right></div>'
            + '<div class="grid" data-week="0">'
            + '<ul class="scroll_pos_r"><li></li>'  // "Show hidden" frase
                + sGridHTML //+ '<li></li>'
            + '</ul></div>'
            + '<div class=data data-week="0">'
            + '<ul><li></li>'          // "Show hidden" frase
                + sDataCell
            + '</ul></div>';
            + '</div>';
        self._dom.agenda = jQuery(sHTML).appendTo(self._div);
            var oAgendaDaysDiv = self._dom.agenda.children('.days').children('ul')
                    .add(self._dom.agenda.children('.grid')),
                oAgendaDataDiv = self._dom.agenda.children('.data'),
                nTimer = null;
            oAgendaDataDiv.on('scroll', function(evt){
                oAgendaDaysDiv.scrollLeft(oAgendaDataDiv.scrollLeft());
            });
    }


        
    /**
     * @private _buildRightTopData
     * @param {Array} aData list of events to show
     * Draw top pane data
     **/
        
    self._buildRightTopData = function(aData){
        
        var curTop = self._div.find('.top > .data'),
            curDataDiv = curTop.children('div.events'),
            nMaxLine = 0;
        if (curDataDiv.size() < 1) {
            curDataDiv = jQuery('<div class=events></div>').appendTo(curTop);
        } else {
            curDataDiv.html('');
        }
        jQuery.each(aData, function(nLine, aLineEvents){  //self._eventsData
            curDataDiv.append(self._buildLineEvents(nLine, aLineEvents));
            nMaxLine = nMaxLine < nLine ? nLine : nMaxLine;
        });
        self._parent.layout.initLinesCSS(nMaxLine);
    }
    
    /**
     * @private _buildLineEvents
     * Put events bars on the grid
     * @param nLine  integer line number
     * @param aLineEvents  list of events for line
     **/
    
    
    self._buildLineEvents = function(nLine, aLineEvents) {
        var sHTML = '';
        for (var i = 0; i < aLineEvents.length; i++) {
            var el = aLineEvents[i];
            sHTML += self._buildTopEventBar(nLine, el);
        }
        return sHTML;
    }
    
    /**
     * _buildTopEventBar
     * Prepare HTML event bar 
     * @param nLine integer line number
     * @param el current event object
     * @return string  ready HTML
     **/
    
    self._buildTopEventBar = function(nLine, el) {
        var bNoMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false ,
            aCalendar = !bNoMove ? el.event.getCalendar()  : null; //self._parent._calendars.getCalendar(el.event.calendarid)
        return self._getTopBarHTML({
            id          : el.event.id,
            "calendar"  : el.event.calendarid,
            "className" : el.event.className,
            "specColor" : el.event.specColor,
            "title"     : el.event.title,
            "hoverTitle" : el.event.getTitle(),
            "editable"  : !bNoMove && aCalendar.editable === true && aCalendar.move === true,
            "noEnd"     : el.event.noEnd || bNoMove,
            "start"     : el.event.dateStart,
            "end"       : el.event.dateEnd,
            "nColStart" : el.cellStart,
            "nColLength": el.cellLength,
            "bFL"       : el.full_l,
            "bFR"       : el.full_r,
            "line"      : nLine,
            "allDay"    : el.event.allDay,
            "titleHTML" : aCalendar != null && aCalendar.titleHTML === true
        });
    }
    
    
    /**
     * Draw bottom area events
     * @param aData list of events
     **/
    
    self._buildRightBottomData = function(aData) {
        var aDayData = [];
        self._nBlockHeight = 3600 / (60 / parseInt(self._parent.params.minMinutePeriod));
        self._nPeriodMulti = (60 / parseInt(self._parent.params.minMinutePeriod));
        self._newHourlyLines = [];
        for (var nDay = 0; nDay < 7; nDay++) {
            aDayData = self._parent._events.getWeekDaysData(self._period.min, nDay);
            aDayData = self._filterAllDay(aDayData, self._parent.params.dayModeArea !== '0_1' ? false : null);
            aDayData = aDayData.filter(function(el){
                return typeof(el) != undefined;
            });
            self._buildDailyBars(nDay, aDayData);
        }
        if (self._newHourlyLines.length > 0) {
            self._buildLinesCSS();
        }
    }

    /**
     * Draw bottom pane event area and add to each day
     * @param nDay day number
     * @param aData all day area events list
     **/

    self._buildDailyBars = function(nDay, aData) {
        var li = self._div.find('.bottom > .data > ul > li[data-day="' + nDay + '"]'),
            divDayData =  li.children('div.events'),
            aLineGrid = [],
            aEvtGrid = [],
            dStartDate = Date.baseDate(li.data('date')),
            dEndDate = Date.baseDate(dStartDate, 1),
            bButify = true,
            aLines = [], nLine,
            sHTML = '',
            nHiddenEvents = 0,
            nMinutePeriod = self._parent.params.minMinutePeriod / 60;
        if (divDayData.size() < 1) {
            divDayData = jQuery('<div data-day="' + nDay + '" class="events evts_0" data-lines="0">')
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
        divDayData.html(sHTML);
        
        divDayData.addClass('evts_' + aLines.length).data('lines', aLines.length);
        
        if (aLines.length > self._nMaxVisibleItems) {
            var liTop = self._div.find('.top > .data > ul > li[data-day="' + nDay + '"]').addClass('more');
        }
        if (
            typeof(self._cssHourlyLines[aLines.length]) == 'undefined' 
            && self._newHourlyLines.indexOf(aLines.length) == -1
        ) {
            self._newHourlyLines.push(aLines.length);
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
            "className" : aEl.className,
            "specColor" : aEl.specColor,
            "title"     : aEl.title,
            "hoverTitle" : aEl.getTitle(),
            "editable"  : !bNoMove && aCalendar.editable === true && aCalendar.move === true,
            "noEnd"     : aEl.noEnd || bNoMove,
            "start"     : aEl.allDay === true ? aEl.dayStart : aEl.dateStart,
            "end"       : aEl.allDay === true ? Date.baseDate(aEl.dayEnd, 1) : aEl.dateEnd,
            "line"      : nEvt,
            "noLS"      : aEl.noLS || aEl.allDay === true,
            "noRS"      : aEl.noRS || aEl.allDay === true,
            "lFixed"    : aEl.lFixed || aEl.allDay === true,
            "rFixed"    : aEl.rFixed || aEl.allDay === true,
            'wide'      : nWide,
            "allDay"    : aEl.allDay === true,
            "titleHTML" : aCalendar != null && aCalendar.titleHTML === true

        });
    }
    
    /**
     * @private _filterAllDay
     * Filter events list for allDay criteria
     * @param aData list of events
     * @param bAllDay boolean filter value
     * @return array 
     **/
    
    self._filterAllDay = function(aData, bAllDay)  {
        bAllDay = bAllDay === undefined ? false : bAllDay;
        var aTmp = [].concat(aData);
        if (bAllDay != null) {
            aTmp = aTmp.filter(function(el){
    /*            if (bAllDay == false)  {

                }*/
                return (el.allDay == bAllDay || (bAllDay == false && el.allDay == undefined))
            });
        }
//        aTmp.quickSort(function(a, b){
//            return (a.dateStart > b.dateStart) ;
//        });
        return aTmp;
    }
    
    
    self._buildRightAgendaData = function() {
        var aDayData = [];
        self._dom.agenda.find('.grid li[data-day]').removeClass('current');
        for (var nDay = 0; nDay < 7; nDay++) {
            aDayData = self._parent._events.getWeekDaysData(self._period.min, nDay);
            aDayData = self._filterAllDay(aDayData, true)
                .concat(self._filterAllDay(aDayData, false));
            self._buildAgendaBars(nDay, aDayData);
        }
        
    }
    
    self._buildAgendaBars = function(nDay, aData) {
        var oLi = self._div.find('.agd > .data > ul > li[data-day="' + nDay + '"]'),
            aEl, nJ,
            nAddDay = (7 + nDay - self._period.min.getDay()) % 7,
            dCur = Date.baseDate(self._period.min, nAddDay),
            sDetailsHTML = '', oCalendar, aDetails,
            sHTML = ''
//                '<span class=detail_day>'
//                + dCur.getDate()
//                + '</span>'
                + '<div>'
                + '<table><tbody>';
        if (dCur.valueOf() == self._parent.options.now.valueOf()) {
            self._dom.agenda.find('.grid li[data-day="' + oLi.data('day') + '"]').addClass('current');
        }
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
        sHTML += '</tbody></table></div>';
        oLi.html(sHTML);
    }
    
    
    /*
     * Top area Drag^Drop event declatation
     **/
    self._getTopBarHTML = function(aParams) {
        var aCalculated = aParams.bFL != undefined 
            ? aParams
            : self._calculateEventBarParams(aParams);
        var sHTML = '<div class="evt d' + aCalculated.nColStart 
            + ' p' + aCalculated.nColLength + ' ' 
            + ' l' + aParams.line + ' ' 
            + ( aCalculated.bFL ? "full_l " : ' ' )
            + ( aCalculated.bFR ? "full_r " : ' ' )
            + ( aParams.addClass != undefined ? aParams.addClass + " " : ' ' )
            + ( aParams.editable != undefined && !aParams.editable ? "non_e " : "")        
            + ( aParams.noEnd != undefined && aParams.noEnd ? "non_r " : "")        
            + '" '
            + ' data-d="' + aCalculated.nColStart + '"'
            + ' data-p="' + aCalculated.nColLength + '"'
            + (aParams.id != undefined ? ' data-event="' + aParams.id + '"' : "")
            + (aParams.calendar != undefined ?' data-calendar="' + aParams.calendar + '"' : "")
            + ' data-start="' + ( aParams.start.valueOf() / 1000 ) + '"'
            + ' data-end="' + ( aParams.end.valueOf() / 1000 ) + '"'
            + ' title="' + aParams.hoverTitle + '"'
            + '>'
            + '<span class="title color_' + (aParams.className != undefined ? aParams.className : "" ) 
                + (aParams.specColor != undefined && aParams.specColor != '' ? ' ' + self._parent._events.getEventColor(aParams.specColor) : '')
            + '">' 
            + '<span class="text"> ' 
                + self._parent._events.getBarLabelTime({
                    "dateStart" : aParams.start,
                    "dateEnd"   : aParams.end,
                    "allDay"    : aParams.allDay
                })
                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
            + '</span>'
            + '<span class=l></span><span class=r></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    
    self._getBottomBarHTML = function(aParams) {
        var aCalculated = self._calculateBottomBarParams(aParams);
        var sHTML = '<div '
            + ' class="evt '
            + ' e' + aParams.line                       // event # for day
            + ' i' + aCalculated.nCellLength            // 30/15 minutes interval length
            + ' s' + parseInt(aCalculated.nCellStart)             // start interval
            + ' ' + (aCalculated.bFT ? "full_t " : "")
            + (aCalculated.bFB ? "full_b " : "")
            + ( aParams.addClass != undefined ? aParams.addClass + " " : ' ' )
            + ( aParams.editable != undefined && !aParams.editable ? "non_e " : "")                
            + ( aParams.noEnd != undefined && aParams.noEnd ? "non_r " : "")        
            + ( aParams.noLS === true ? "non_ls " : ' ' )        
            + ( aParams.noRS === true ? "non_rs " : ' ' )        
            + ( aParams.lFixed === true ? "fixed_l " : ' ' )        
            + ( aParams.rFixed === true ? "fixed_r " : ' ' )        
            + ( aParams.wide != undefined && aParams.wide > 0 ? 'wd' + aParams.wide + " " : ' ' )
            + ( aParams.allDay === true ? "fixed_move_time " : ' ' )
            + '"'
            + ' title="' + aParams.hoverTitle + '"'
            + ' data-e="' + aParams.line + '"'
            + ' data-i="' + aCalculated.nCellLength + '"'
            + ' data-s="' + parseInt(aCalculated.nCellStart) + '"'
            + ' data-allday="' + aParams.allDay + '"'
            + (aParams.calendar != undefined ? ' data-calendar="' + aParams.calendar + '"' : "")
            + ' data-end="' + aParams.end.getTime() / 1000 + '"'
            + ' data-start="' + aParams.start.valueOf() / 1000 + '"'
            + (aParams.id != undefined ? ' data-event="' + aParams.id + '"' : "")
            + '>' 
            + '<span class="color_' + (aParams.className != undefined ? aParams.className : "" ) 
                + (aParams.specColor != undefined && aParams.specColor != '' ? ' ' + self._parent._events.getEventColor(aParams.specColor) : '')
            + '">'
            + '<span class="title">' 
                + (!aCalculated.bFT || aParams.line > 0 
                    ? self._parent._events.getBarLabelTime({
                        "dateStart" : aParams.start,
                        "dateEnd"   : aParams.end,
                        "allDay"    : aParams.allDay
                        }) 
//                        + '- '
                    : ''
                )
                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
            + '</span>'
            + '<span class=t></span><span class=b></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    
    self._initTopEvent = function(){
        
        var _updateTopEventBar = function(aParams) {
            var aCalculated = self._calculateEventBarParams(aParams);
            aParams.bar
                .removeClass('full_l full_r p' + aParams.bar.data('p') + ' d' + aParams.bar.data('d'))
                .addClass(' ' 
                    + (aCalculated.bFL ? "full_l " : "")
                    + (aCalculated.bFR ? "full_r " : "")
                    + "p" + aCalculated.nColLength + ' ' 
                    + "d" + aCalculated.nColStart + ' ' 
                ).data({"d" : aCalculated.nColStart , "p" : aCalculated.nColLength});
        }        
        
        var _addTopEventBar = function(aParams) {
            var oDiv = jQuery(self._getTopBarHTML(aParams));
            self._div.find('div.top > div.data > div.events').append(oDiv);
            return oDiv;
        }
        
        var _barMove = function(el, evt) {
            var aNew = self._getWeekDay(evt),
                nChange = -el.data('baseDate').getDaysFrom(new Date(aNew.date * 1000)),
                dStart = Date.baseDate(el.data('startDate'), el.data('resizeL') != false ? nChange : 0),
                dEnd = Date.baseDate(el.data('endDate'), el.data('resizeL') != true ? nChange : 0);
            if (el.data('bar') == undefined || el.data('bar') == null) {
                el.find('.events').scrollTop(0);
                el.data('bar', _addTopEventBar({
                    start   : dStart, 
                    end     : dEnd,
                    line    : 0,
                    title   : self._parent.getText('custom_create_new', 'Create new'),
                    hoverTitle : self._parent.getText('custom_create_new', 'Create new'),
                    addClass : "new_event create_event",
                    "allDay"    : true
                }));
            } 
            el.data('bar').addClass('new_event')
                .parent().addClass('new_events');
            _updateTopEventBar({
                bar     : el.data('bar'), 
                start   : dStart, 
                end     : dEnd
            });
            return false;
        }      
        self._div.simpleSelect({
            "selector"      : 'div.top > div.data  > div.events > div.evt',        // selector for start drag event
            "moveSelector"  : 'div.top > div.data > div.events, div.top > div.data > ul > li',     // selector for continue drag event
            "notselector"   : ".non_e, .create_event",     // means that noneditbale event cannot be moved
            "touchhold"     : 1000,             // minimum time that activate "touchhold" event
            "touchradius"   : 10,             // maximum radius for moving finger 
            "clearStop"     : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                self._clearCreatingEvent(el);
                var aNew = self._getWeekDay(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    bResize = !evtEl.hasClass('non_r') && jQuery(evt.target).filter('span.l, span.r').size() > 0
                        ? jQuery(evt.target).filter('span.l').size() > 0
                        : null;
                
                el.data({
                    resizeL     : bResize , 
                    currentDay  : aNew.day,
                    baseDate    : new Date(aNew.date * 1000),
                    startDate   : new Date(evtEl.data('start') * 1000),
                    endDate     : new Date(evtEl.data('end') * 1000),
                    bar         : evtEl,
                    noChange    : true
                });
                if (self._parent.isMobile() || self._parent.getParam('longClick', false)) {
                    _barMove(el, evt);
                }
                return false;
            },
            "stop" : function(el, evt){
                var aNew = self._getWeekDay(evt),
                    dCurrent = new Date(aNew.date * 1000),
                    nChange = -el.data('baseDate').getDaysFrom(new Date(aNew.date * 1000));
                if (dCurrent.getTime() == el.data('baseDate').getTime()) {
                    return true;
                }
                el.data('noChange', false);
                
                
                
                var aEvents = {"type" : "list_with_calendars"};
                aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                self._dom.top.find('.evt.sel[data-event]').each(function(){
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
                    aEvents, {
                        day_left_change : (el.data('resizeL') != false ? nChange : 0),
                        day_right_change : (el.data('resizeL') != true ? nChange : 0)
                    }
                );
                return false;
            },
            "cancel" : function(el, evt){
                self._clearCreatingEvent();
                if (el.data('noChange') !== true) {
                    view.showData();
                }
            },
            "move" : function(el, evt) {
                return _barMove(el, evt);
            },
            "check" : function(el, evt) {
                return self._isCellChange(el, evt);
            },
            "swipe" : function(el, evt, aDelta) {
                if (!self._parent.isMobile()) {
                    return false;
                }
                
                return self._swipeTop(el, evt, aDelta);
            },
            "swipeDelta" : {x : 100, y : 30}
        });
        
        if (self._parent.options.readonly.create !== false) {
            self._div.simpleSelect({
                "selector"      : 'div.top > div.data > ul > li, div.top > div.data > div.events',
                "notselector"   : '.evt',
                "touchhold"     : 1000,
                "touchradius"   : 10,
                'longClick'     : self._parent.getParam('longClick', false),
                "checkStart" : function(el, evt) {
                    var aNew = self._getWeekDay(evt);
                    if (aNew.x < 0 || aNew.day > self._parent.params.showWeekEnds) {
                        return false;
                    }
                    return true;
                },              
                "start" : function(el, evt){
                    self._clearCreatingEvent(el);
                    var aNew = self._getWeekDay(evt);
                    el.data({
                        "bar"        : null,
                        "baseDate"   : new Date(aNew.date * 1000), 
                        "currentDay" : aNew.day, 
                        "startDate"  : new Date(aNew.date * 1000),
                        "endDate"    : new Date(aNew.date * 1000),
                        "resizeL"    : false 
                    });
                    _barMove(el, evt);
                    return false;
                },
                "stop" : function(el, evt){
                    var dStart = el.data('startDate'),
                        aNew = self._getWeekDay(evt),
                        dEnd = new Date(aNew.date * 1000);
                    _barMove(el, evt);
                    self._parent.layout.showCreateEventForm({
                        "cid" : "",
                        "date" : {"start" : dStart, "stop" : dEnd},
                        "el" : null,
                        "onClose" : function(evt) {
                            view.showData();
                            self._clearCreatingEvent(el);
                        }, 
                        "onCancel" : function(evt) {
                            self._clearCreatingEvent(el);
                        }, 
                        "event" : evt,
                        "allDay" : true
                    });
                    return false;
                },
                "cancel" : function(el, evt){
                    self._clearCreatingEvent(el);
                },
                "move" : function(el, evt){
                    return _barMove(el, evt);
                },
                "check" : function(el, evt) {
                    return self._isCellChange(el, evt);
                },
                "swipe" : function(el, evt, aDelta) {
                    if (!self._parent.isMobile()) {
                        return false;
                    }

                    return self._swipeTop(el, evt, aDelta);
                },
                "swipeDelta" : {x : 100, y : 30}

            });        
        } else if (self._parent.isMobile()){
            self._div.simpleSelect({
                "selector" : 'div.top > div.data > ul > li, div.top > div.data > div.events',
                "touchhold" : 1000,             // minimum time that activate "touchhold" event
                "touchradius" : 10,             // maximum radius for moving finger 
                "clearStop" : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
                "swipe" : function(el, evt, aDelta) {
                    return self._swipeTop(el, evt, aDelta);
                },
                "swipeDelta" : {x : 100, y : 30}
            });
        }
        
        
    }
    
    self._clearCreatingEvent = function(oEl){
        self._div.find('.new_events').removeClass('new_events')
            .children('.new_event')
                .each(function(){
                    var el = jQuery(this);
                    if (el.data('e') != undefined) {
                        el
                            .removeClass('e' + el.data('e') + ' e0')
                            .addClass('e' + el.data('e'))
                    }
                })
                .parent().children('.create_event').remove();
        if (oEl != undefined) {
            self._div.find('.new_event').removeClass('new_event');
//            .removeClass('new_event')
        }
    }
    
    self._getWeekDay = function(evt) {
        var dt = new Date(),
            el = jQuery(evt.target),
            divWeek = el.parents('.data'),
            sStyle = divWeek.parent().hasClass('top') ? 'top' : "bottom",
            aCalculated = (self._cacheCoords == undefined || dt.getTime() - 10000 > self._cacheCoords.dt) 
                ? self._cacheCoords = self._getCalculatedCell(divWeek, dt)
                : self._cacheCoords,
            xCoord = evt.clientX - aCalculated.aOffset.left - aCalculated.nFirstCellWidth,
            nDay = parseInt(xCoord / aCalculated.nCellWidth),
            divDayCell = divWeek.find('li').eq(nDay + 1),
            nHourPeriod;

        if (sStyle == 'bottom') {
            nHourPeriod = parseInt((evt.clientY + divWeek.scrollTop() - aCalculated.aOffset.top) / 30);
        }

        return {
            "day"       : nDay + 1, 
            "divWeek"   : divWeek, 
            "domDay"    : divDayCell, 
            "date"      : divDayCell.data('date'),
            "hour"      : nHourPeriod,
            "x"         : xCoord
        }
    }
    
    self._getCalculatedCell = function (divWeek, dt) {
        return {
            nCellWidth : divWeek.find('li').eq(1).width(),
            nFirstCellWidth : divWeek.find('li').eq(0).width(),
            aOffset : divWeek.offset(),
            dt : dt.getTime()
        }
    }
    
    self._isCellChange = function(el, evt) {
        var aOld = {"day" : el.data('currentDay'), "hour" : el.data('currentHour')};
        var aNew = self._getWeekDay(evt);
        el.data({currentDay : aNew.day, currentHour : aNew.hour});
        return (aOld.day != aNew.day || (aOld.hour != undefined && aOld.hour != aNew.hour));
    }
    
    self._calculateEventBarParams = function(aParams) {
        if (aParams.start.getTime() > aParams.end.getTime()) {
            Date.swap(aParams.start, aParams.end);
        };
        
        var aResult = {
            bFL : aParams.start.getTime() < self._period.min.getTime(),
            bFR : aParams.end > self._period.max
        };
        aResult.nColStart = aResult.bFL ? 0 : aParams.start.getDaysFrom(self._period.min);
        aResult.nColLength = (aResult.bFR ? 6 : aParams.end.getDaysFrom(self._period.min)) - aResult.nColStart;
        return aResult;
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
    
    self._swipeTop = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > Math.abs(aDelta.y) && Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
        } else if (Math.abs(aDelta.y) > 30) {
            var divTop = self._dom.top.find('.events');
            divTop.scrollTop(divTop.scrollTop() - aDelta.y);
        }
    }
    
    self._swipeBottom = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > Math.abs(aDelta.y) && Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
        }
    }
    
    
    self._initBottomEvent = function() {
        var _barMove = function(el, evt) {
            var aNew = self._getWeekDay(evt),
                nChangeDay = -el.data('baseDate').getDaysFrom(new Date(aNew.date * 1000)),
                nHourChange = el.data('moveOnlyDay') === true ? 0 : (aNew.hour - el.data('baseHour')) / self._nPeriodMulti;
            if (el.data('creating')) {
                if (nChangeDay < 0 || (nHourChange < 0 && nChangeDay <= 0)) {
                    nHourChange -= self._parent.params.minMinutePeriod / 60;
                }
            }
            var dStart = Date.baseDate(
                    el.data('startDate'), 
                    el.data('resizeL') != false ? nChangeDay + (el.data('fixedL') === true && nHourChange < 0 ? -1 : 0) : 0, 
                    el.data('resizeL') != false && el.data('fixedL') != true ? nHourChange : 0
                ),
                dEnd = Date.baseDate(
                    el.data('endDate'), 
                    el.data('resizeL') != true ? nChangeDay + (el.data('fixedL') === false && nHourChange > 0 ? 1 : 0): 0, 
                    el.data('resizeL') != true && el.data('fixedL') != false ? nHourChange : 0
                ),
                oLi, oEvents;
            if (el.data('fixedL') != null && (dEnd < dStart)) {
                if (el.data('fixedL')) {
                    dStart.changeDate(dEnd.getDaysFrom(dStart));
                    if (dEnd < dStart) {
                        dStart.changeDate(-1);
                    }
                } else {
                    dEnd.changeDate(dStart.getDaysFrom(dEnd));
                    if (dEnd < dStart) {
                        dEnd.changeDate(1);
                    }
                }
            }
            if (el.data('creating') && dStart > dEnd) {
                Date.swap(dStart, dEnd);
            }
            if (el.data('colored') == undefined && el.data('bar') != null) {
                self._dom.bottomLi
                    .find('.evt'
                        + '[data-event="' + el.data('bar').data('event') + '"]'
                        + '[data-calendar="' + el.data('bar').data('calendar') + '"]'
                    )
                        .each(function(){
                            jQuery(this)
                                .removeClass('e' + jQuery(this).data('e'))
                                .addClass('e0');
                        })
                        .addClass('new_event')
                    .parent().addClass('new_events');
                el.data('colored', true);
            } else if (el.data('colored') == undefined) {
                el.data('colored', true);
            }
            for (var nI = 0; nI < 7; nI++) {
                oLi = self._dom.bottomLi.eq(nI);
                oEvents = oLi.children('.events');
                var dNext = Date.baseDate(oLi.data('date'), 1);
                if (dNext >= dStart && oLi.data('date') <= dEnd.getTime() / 1000) {

                    oEvents.addClass('new_events');
                    var oBar = oLi.find('.new_event'),
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
                        })
                    }
                    
                    if (oBar.size() < 1) {
                        oBar = jQuery(self._getBottomBarHTML(aParams));
                        if (el.data('bar') == null) {
                            el.data('bar', oBar);
                        }
                        
                        
                        oEvents.append(oBar);
                        
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
                            .show()
                            .find('.title').html(
                                (!aCalculated.bFT || aCalculated.nCellStart > 0 
                                    ? aParams.start.format(self._parent.options.format.hourTitle) + '-'
                                        + aParams.end.format(self._parent.options.format.hourTitle) + ' '
                                    : "")
                                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
                            );
                            
                        
                    }
                } else {
                    oEvents.removeClass('new_events').children('.new_event').hide();
                }
            }
            return false;
        }        
        
        var aBasicScrollCoord = 0,
            divBottom;
        self._div.simpleSelect({
            "selector"      : 'div.bottom  div.evt, div.bottom div.events',        // selector for start drag event
            "moveSelector"  : 'div.bottom > div.data ',     // selector for continue drag event
            "notselector"   : '.hours_title, .non_e, .create_event',
            "touchhold"     : 1000,             // minimum time that activate "touchhold" event
            "touchradius"   : 10,             // maximum radius for moving finger 
            "clearStop"     : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                self._clearCreatingEvent(el);
                var oTarget = jQuery(evt.target),
                    aNew = self._getWeekDay(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    oBar = evtEl.hasClass('evt') && !evtEl.hasClass('create_event') ? evtEl : null,
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
                                    ? Date.baseDate(aNew.date, 0, aNew.hour / self._nPeriodMulti + parseInt(self._parent.aCalculated.startHour))
                                    : new Date(evtEl.data('start') * 1000),
                    endDate     : oBar == null 
                                    ? Date.baseDate(aNew.date, 0, 
                                        aNew.hour / self._nPeriodMulti 
                                        + parseInt(self._parent.aCalculated.startHour)
                                        + self._parent.params.minMinutePeriod / 60
                                    )
                                    : new Date(evtEl.data('end') * 1000),
                    bar         : oBar,
                    colored     : null,
                    creating    : oBar == null,
                    noCancel    : false,
                    noChange    : true,
                    moveOnlyDay : evtEl.hasClass('fixed_move_time')
                    
                });
                if (oBar !== null) {
                    oBar.data('old_e', oBar.data('e'));
                } else if (self._parent.options.readonly.create === false) {
                    return false;
                }
                if (self._parent.isMobile() ||  oBar == null || self._parent.getParam('longClick', false)) {
                    _barMove(el, evt);
                }
                return false;
            },
            "stop" : function(el, evt){
                var aNew = self._getWeekDay(evt),
                    nChangeDay = -el.data('baseDate').getDaysFrom(new Date(aNew.date * 1000)),
                    nChangeHours = el.data('moveOnlyDay') === true 
                        ? nChangeDay * 24
                        : nChangeDay * 24 - (el.data('baseHour') - aNew.hour) / self._nPeriodMulti;
                if (nChangeHours == 0 && !el.data('creating')) {
                    return true;
                } else if (el.data('creating') && self._parent.options.readonly.create === false) {
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
                    self._parent.layout.showCreateEventForm({
                        "cid" : "",
                        "date" : {"start" : dStart, "stop" : dEnd},
                        "el" : null,
                        "onClose" : function(evt) {
                            view.showData();
                            self._clearCreatingEvent(el);
                        }, 
                        "onCancel" : function(evt) {
                            self._clearCreatingEvent(el);
                        }, 
                        "event" : evt,
                        "allDay" : false
                    });
                    
                } else {
                    
                    var aEvents = {"type" : "list_with_calendars"};
                    aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                    self._dom.bottom.find('.evt.sel[data-event]').each(function(){
                        var sId = jQuery(this).data('event'),
                            sCalendar = jQuery(this).data('calendar')
                        if (aEvents[sId] == undefined || aEvents[sId].indexOf(sCalendar) < 0) {
                            if (aEvents[sId] == undefined) {
                                aEvents[sId] = [];
                            }
                            aEvents[sId].push(sCalendar);
                        }
                    });                     
                    var aTmpParams = {
                            hour_left_change : (el.data('resizeL') != false ? nChangeHours : 0),
                            hour_right_change : (el.data('resizeL') != true ? nChangeHours : 0)
                        };
                    self._parent._events.setEvent(aEvents, aTmpParams);
                }
                return false;
            },
            "cancel" : function(el, evt){
                if (el.data('noCancel') != undefined && el.data('noCancel')) {
                    return false;
                }
                self._clearCreatingEvent();
                if (el.data('noChange') !== true) {
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
                    divBottom = self._dom.bottom.children('.data');
                    aBasicScrollCoord = divBottom.scrollTop();
                    return;
                }
                divBottom.scrollTop(aBasicScrollCoord - aDelta.y);
                
            },
            "swipeDelta" : {x : 100, y : 30}
        });        
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
    
    self._buildLinesCSS = function() {
        var aRules = [], aStyle = [], 
            bNoSpecial, nJ,
            nMaxEvts;
        
        for (var nI = 0; nI < self._newHourlyLines.length; nI++) {
            if (self._newHourlyLines[nI] == 0) {
                continue;
            }
            nMaxEvts = Math.min(self._newHourlyLines[nI], self._nMaxVisibleItems);
            bNoSpecial = false;
            var nSize = parseInt(95 / self._newHourlyLines[nI]);
            if (nSize <= 5) {
                bNoSpecial = true;
                nSize = 5;
            }
            
            if (self._nMaxCSSLines > 20 && bNoSpecial && self._newHourlyLines[nI] < self._nMaxCSSLines) {
                continue;
            }
            if (!bNoSpecial) {
                aRules.push('.JQ_CA > .CA_r > div._mode-week > div.bottom > div.data  div.evts_' + self._newHourlyLines[nI] + ' > div');
                aStyle.push('width:' + nSize + '%;');
                for (nJ = 0; nJ < self._newHourlyLines[nI]; nJ++) {
                    aRules.push('.JQ_CA > .CA_r > div._mode-week > div.bottom > div.data > ul > li '
                        + ' > div.evts_' + self._newHourlyLines[nI] 
                        + ' > div.e' + nJ);
                    aStyle.push('margin-left:' + ((nSize + 1 ) * nJ) + '%;');
                    
                    aRules.push('.JQ_CA > .CA_r > div._mode-week > div.bottom > div.data > ul > li > div.evts_' 
                        + self._newHourlyLines[nI] 
                        + ' > div.wd' + nJ);
                    aStyle.push('width:' + nSize * (1 + nJ) + '%;');
                    
                }
            } else {
                for (
                    nJ = self._nMaxCSSLines < 20 ? 0 : self._nMaxCSSLines; 
                    nJ < self._newHourlyLines[nI]; 
                    nJ++
                ) {
                    aRules.push('.JQ_CA > .CA_r > div._mode-week > div.bottom > div.data > ul > li > div > div.e' + nJ);
                    aStyle.push('margin-left:' + ((nSize + 1) * nJ) + '%;');
                    
                    aRules.push('.JQ_CA > .CA_r > div._mode-week > div.bottom > div.data > ul > li > div' 
                        + ' > div.wd' + nJ);
                    aStyle.push('width:' + (nSize * (1 + nJ) > 95 ? 95 : nSize * (1 + nJ)) + '%;');
                }
            }
            self._nMaxCSSLines = Math.max(self._newHourlyLines[nI], self._nMaxCSSLines);
            self._cssHourlyLines[self._newHourlyLines[nI]] = self._newHourlyLines[nI];
        }
        changeCssClass(aRules, aStyle);
        self._newHourlyLines = [];
    }
    
    
    self._toggleAgendaMode = function(bOn) {
        if (bOn) { // self._dom.agenda == undefined
            self._buildRightAgendaGrid();
        }
        self._div.toggleClass('agenda', bOn);
        self._agenda = bOn;
        if (!bOn ) { // && self._dom.top == undefined
            self._buildRightTopGrid();
            self._buildRightBottomGrid();
//        } else if (!bOn){
//            self._scrollBottomArea();
        }
        self._div.find('.hours_title > input').prop('checked', bOn);
        view.showData();
    }
    
    jQuery.calendarAnything.appendView('week', view);
    
})();
