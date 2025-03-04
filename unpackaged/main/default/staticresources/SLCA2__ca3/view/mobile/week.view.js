/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */

//var weekView = function(div, parent) {
(function(){
    var self = {
        _css        : '/css/mobile/week.css',
        _parent     : null,     //parent
        _div        : null,
        _period     : {min : new Date(), max : new Date()},
        _eventsData : [],
        _nBlockHeight : 1,
        _nPeriodMulti : 0,
        _dom        : {},
//        _scrollLine : 0,
        _cssHourlyLines : [],
        _newHourlyLines : [],
        _nMaxCSSLines   : 0,
        _firstTime      : true,
        _agenda         : false
    };
    var view = {
        self : self
    };

    /** 
    * public init
    *
    * Init all necessary data
    */

    view.init = function(div, parent) {
        self._parent = parent;
        self._parent.loadCss(self._css);
        view.changeCurrentPeriod(self._parent.options, 0);
    }
    
    /** 
    * @public show
    * draw grid
    * @return void;
    */
    
    
    view.show = function(sMode) {
        if (self._parent.options._small && self._parent.options._orient == 'vertical') {
            self._parent.toggleMode('mobile/day');
            return;
        }

        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('week');
            self._initEvents();
            self._firstTime = true;
        }
        view.changeCurrentPeriod(self._parent.options, 0);
        self._buildRightAgendaGrid();
       
        
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
    
    view.showData = function() {
        if (self._parent._currentModeName !== 'mobile/week') {
            return;
        }
        var dMax = Date.baseDate(self._period.max);
        dMax.setHours(23, 59, 0, 0);
        self._parent._events.getData({
            calendars   : self._parent.layout.getActiveCalendars(),
            min         : new Date(self._period.min), 
            max         : dMax
            
        }, function(data){
            self._buildRightAgendaData(data);
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
     * Calculate new period parameters and set it to aOption(referance object)
     * @return void
     **/

    view.changeCurrentPeriod = function(aOptions, mDirection) {
        //console.log(mDirection);
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
        if (self._parent.options._small && self._parent.options._orient == 'vertical') {
            self._parent.toggleMode('mobile/day');
            return;
        }        
    }
    
    view.clearView = function() {
        self._div = null;
        if (self._dom == undefined) {
            return;
        }
        
        if (self._dom.agenda != undefined && self._dom.agenda != null) {
            self._dom.agenda.remove();
            delete self._dom.agenda;
        }
    }


    view.preparePrint = function(bMode) {
        
    }


    view.getClickDate = function(oEvt) {
        var oCalculated = self._getWeekDay(oEvt),
            dD = Date.baseDate(
                oCalculated.date, 
                0, 
                oCalculated.hour != undefined ? 
                    oCalculated.hour * parseInt(self._parent.params.minMinutePeriod) / 60 
                        + parseInt(self._parent.params.startHourPeriod)
                : 0
            );
        return {
            "date" : dD,
            "hourly" : oCalculated.hour != undefined
        }
    }

    view.beforeHide = function(sNewMode) {
    }


    /**
     * @private _initEvents
     * Init default events for whole week view
     * @return void
     **/
    
    self._initEvents = function() {
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
//                                    console.log('break');
                                break;
                            }
                            nTimer = setTimeout(function(){
                                aScrollArea.scrollLeft(nXPos + evt.data.startDeltaX)
                                    .scrollTop(nYPos + evt.data.startDeltaY);
                                nTimer = null;
                            }, 100);

//                                self._dom.agenda.children('.data, .days')
//                                    .scrollLeft(nXPos + evt.data.startDeltaX);
//                                self._dom.agenda.children('.days').children('ul')
//                                    .scrollLeft(nXPos + evt.data.startDeltaX);
                            break;
                        case "zoom" :
                            if (evt.data.zoom) {
                                self._parent.toggleMode('mobile/day');
                            } else {
                                self._parent.toggleMode('mobile/month');
                            }
                            break;
                    }
                });
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca.touch.js');
            }
        ]);
        
        self._div
            .on(self._parent.eventNames.down, 'span.detail_day', function(evt){
                var el = jQuery(this).parent();
                self._parent.toggleMode('mobile/day', false, el.data('date'));
                return false;
            });
            
        

    }
    
    
    
   
    
   
    
    self._buildRightAgendaGrid = function() {
        if (self._dom.agenda != undefined) {
            return;
        }
        var sHTML = '<div class=agd><div class="days scroll_pos_r"><ul>',
            dStart = new Date(self._period.min),
            dCur = new Date(dStart),
            i, sDayClass = '', sGridHTML = '', sDataCell = '';
        for (i = self._parent.params.startWeekDay; i < 7 + self._parent.params.startWeekDay; i++) {
            sHTML += '<li data-day="' + (i % 7) + '">' + self._parent.text.week[i % 7] + '</li>';
        }
        for (i = 0; i < 7; i++){
            sGridHTML += '<li '
                + ' data-date="' + (dCur.valueOf() / 1000) + '" '
                + ' data-day="' + dCur.getDay() + '" '
                + '></li>' ;
            sDataCell += '<li '
                + ' data-date="' + (dCur.valueOf() / 1000) + '" '
                + ' data-day="' + dCur.getDay() + '" '
                + '></li>' ;
            dCur.changeDate(1);
        }
        sHTML += '</ul></div><div class=days_right></div>'
            + '<div class="grid" data-week="0">'
            + '<ul class="scroll_pos_r">'  // "Show hidden" frase
                + sGridHTML 
            + '</ul></div>'
            + '<div class=data data-week="0">'
            + '<ul>'          // "Show hidden" frase
                + sDataCell
            + '</ul></div>';
            + '</div>';
//        self._div.html(sHTML);
        self._dom.agenda = jQuery(sHTML).appendTo(self._div);
//        if (!self._parent.options._small) {
            var oAgendaDaysDiv = self._dom.agenda.children('.days').children('ul')
                    .add(self._dom.agenda.children('.grid')),
                oAgendaDataDiv = self._dom.agenda.children('.data'),
                nTimer = null;
//                oAgendaGridDiv = ;
            oAgendaDataDiv.on('scroll', function(evt){
                oAgendaDaysDiv.scrollLeft(oAgendaDataDiv.scrollLeft());
//                if (nTimer != null) {
//                    return true;
//                }
//                nTimer = setTimeout(function(){
//                    
//                    nTimer = null;
//                }, 100);
//                return true;
                //oAgendaGridDiv.scrollLeft(oAgendaDataDiv.scrollLeft());
            });
//        }
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
//        show_object(aTmp, 'dirty');
        if (bAllDay != null) {
            aTmp = aTmp.filter(function(el){
    /*            if (bAllDay == false)  {

                }*/
                return (el.allDay == bAllDay || (bAllDay == false && el.allDay == undefined))
            });
        }
//        show_object(aTmp, 'filtered');
        aTmp.quickSort(function(a, b){
            return (a.dateStart > b.dateStart) ;
        });
//        show_object(aTmp, 'sorted');
        return aTmp;
    }
    
    
    self._buildRightAgendaData = function() {
        var aDayData = [];
//        self._nBlockHeight = 3600 / (60 / parseInt(self._parent.params.minMinutePeriod));
//        self._nPeriodMulti = (60 / parseInt(self._parent.params.minMinutePeriod));
//        self._newHourlyLines = [];
        //console.time('start');
        for (var nDay = 0; nDay < 7; nDay++) {
            aDayData = self._parent._events.getWeekDaysData(self._period.min, nDay);
            aDayData = self._filterAllDay(aDayData, true)
                .concat(self._filterAllDay(aDayData, false));
//            console.log(nDay, aDayData);
            self._buildAgendaBars(nDay, aDayData);
        }
        
//        jQuery.each(data, function(nLine, aLineEvents){  //self._eventsData
//            curDataDiv.append(self._buildLineEvents(nLine, aLineEvents));
//        });
    }
    
    self._buildAgendaBars = function(nDay, aData) {
        var oLi = self._div.find('.agd > .data > ul > li[data-day="' + nDay + '"]'),
            aEl, nJ,
            nAddDay = (7 + nDay - self._period.min.getDay()) % 7,
            dCur = Date.baseDate(self._period.min, nAddDay),
            sDetailsHTML = '', oCalendar, aDetails,
            sHTML = '<span class=detail_day>'
                + dCur.getDate()
                + '</span>'
                + '<div>'
                + '<table><tbody>';
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
            
            sHTML += '<tr class="evt" '
                + ' data-calendar="' + aEl.calendarid + '" ' 
                + ' data-event="' + aEl.id + '" ' 
                + '>'
                + '<td class="color_' + aEl.className 
                + (aEl.specColor != undefined && aEl.specColor != '' ? ' ' + aEl.specColor : '')
                + '">' 
                + ((aEl.allDay || aEl.dateStart < dCur ) 
                    ? 'All day' 
                    : aEl.dateStart.format(self._parent.options.format.hourTitle))
                + '</td>'
                + '<td>'
                + '<span class="title">' + aEl.title.htmlspecialchars() + '</span>'
                + sDetailsHTML
                + '</td></tr>';
        }
        sHTML += '</tbody></table></div>';
        oLi.html(sHTML);
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

//        var oTest = document.elementFromPoint(evt.clientX, evt.clientY);
        if (sStyle == 'bottom') {
//            nHourPeriod = parseInt((evt.clientY + divWeek.scrollTop() - aCalculated.aOffset.top) / 15);
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
    
    jQuery.calendarAnything.appendView('mobile/week', view);
    
})();
