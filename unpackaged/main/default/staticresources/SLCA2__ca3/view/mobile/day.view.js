/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/mobile/day.css',
        _parent     : null,
        _div        : null,
        _period     : {min : new Date(), max : new Date()},
        _nBlockHeight : 1,
        _nPeriodMulti : 0,
        _eventsData : [],
        _aMaxBottomLines : [],
        _dom : {},
        _firstTime  : true,
        _agenda     : false
//        _scrollLine : 0
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
    }
    
    /** 
    * @public show
    * draw grid
    * @return void;
    */
    
    
    view.show = function(sMode) {
        if (self._parent.options._small && self._parent.options._orient == 'horizontal') {
            self._parent.toggleMode('mobile/week');
            return;
        }
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('day');
            self._initEvents();
            self._firstTime = true;
        }
        self._buildRightAgendaGrid();
        
        self._div.addClass('show');
        if (self._firstTime) {
            self._firstTime = false;
        }
        
//        self._scrollBottomArea();
    }
    
    /** 
    * @public reShow
    *
    * redraw grid
    *
    */
    
    view.reShow = function() {
//        console.log('day view ' , self._div);
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
        //self._toggleAgendaMode(true);
        
        if (self._parent.options._small && self._parent.options._orient == 'horizontal') {
            self._parent.toggleMode('mobile/week');
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
        if (self._parent._currentModeName !== 'mobile/day') {
            return;
        }        
        var mDate = (aParams != undefined && aParams.date != undefined) ? aParams.date : self._period.min;
        var dMin = Date.baseDate(mDate),
            dMax = Date.baseDate(mDate);
        
        dMax.setHours(23, 59, 0, 0);
        self._parent._events.getData({
            calendars   : self._parent.layout.getActiveCalendars(),
            min         : dMin,
            max         : dMax,
            disable     : false
            
        }, function(data){
            self._eventsData = data;
            self._buildRightAgendaData(data);
        });
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
        //console.log(mDirection);
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
            aOptions.current.setHours(0, 0, 0, 0);
            
        } else {
            aOptions.current.changeDate(mDirection);
            //aOptions.current.setDate(aOptions.current.getDate() + mDirection);
            if (parseInt(self._parent.params.showWeekEnds) != 7) {
                while (
                    aOptions.current.getDay() == 0
                    || 
                    (parseInt(self._parent.params.showWeekEnds) == 5 && aOptions.current.getDay() == 6)
                ) {
                    aOptions.current.changeDate(mDirection);
                }
            }
            
        }
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date(aOptions.current);
        } else {
            aOptions.min.setTime(aOptions.current)
        }
        self._period.min.setTime(aOptions.min.getTime());
    }

    view.preparePrint = function(bMode) {
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
                                self._parent.toggleMode('mobile/week');
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
    }
    
    self._buildRightAgendaGrid = function() {
        var dStart = new Date(self._period.min), 
            sHTML,
            nI, 
            dBase;
        if (self._dom.agenda != undefined) {
            if (self._parent.options._small) {
                dBase = Date.baseDate(dStart, -3);
                var aLi = self._dom.agenda.find('.days li[data-date]');
                for (nI = 0; nI < 7; nI++) {
                    aLi.eq(nI).data('date', dBase.valueOf() / 1000)
                        .text(self._parent.text.weekShort[dBase.getDay() % 7]);
                    dBase.changeDate(1);
                }
            } else {
                self._dom.agenda.find('li[data-day]').data('day', dStart.getDay())
                    .text(self._parent.text.week[dStart.getDay() % 7]);
            }
            return;
        }
        
        sHTML = '<div class=agd><div class="days scroll_pos_r"><ul>';
            if (self._parent.options._small) {
                dBase = Date.baseDate(dStart, -3);
                for (nI = 0; nI < 7; nI++) {
                    sHTML += '<li data-date="' + (dBase.valueOf() / 1000) + '"'
                            + (nI == 3 ? ' class="_current" ' : "")
                            + ' >' 
                            + self._parent.text.weekShort[dBase.getDay() % 7] 
                            + '</li>';
                    dBase.changeDate(1);
                }
            } else {
                sHTML += '<li data-day="' + (dStart.getDay() % 7) + '">' + self._parent.text.week[dStart.getDay() % 7] + '</li>';
            }
            if (self._parent.options._small) {
                
            } else {
                sHTML +=  self._parent.text.week[dStart.getDay() % 7] ;
            }
            sHTML += '</ul></div><div class=days_right></div>'
                + '<div class=grid data-week="0">'
                + '<ul>'
                + '<li></li>' 
                + '</ul></div>'
                + '<div class=data data-week="0">'
                + '<ul>'
                + '<li '
                    + ' data-date="' + (dStart.valueOf() / 1000) + '" '
                    + ' data-day="' + dStart.getDay() + '" '
                    + '></li>' 
                + '</ul>'
                + '</div></div>';
        
        self._dom.agenda = jQuery(sHTML).appendTo(self._div);
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
        aTmp.quickSort(function(a, b){
            return (a.dateStart > b.dateStart ) ;
        });

        return aTmp;
    }
    
    
    self._buildRightAgendaData = function(aDayData) {
//        console.log(data);
//        var aDayData = self._parent.getWeekDaysData(self._period.min, 0);
//        console.log('a', aDayData);
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
        sHTML += '</tbody></table>';
        oLi.html(sHTML);
    }
    
    /**
     * Show append form by clicking on area (need to implement and use new createView)
     **/
    
    
   
    
    self._getWeekDay = function(evt) {
        var dt = new Date(),
            
            el = jQuery(evt.target),
            sStyle = el.parents('.top').size() > 0 ? 'top' : "bottom",
            aCalculated = (self._cacheCoords == undefined || dt.getTime() - 1000 > self._cacheCoords.dt) 
                ? self._cacheCoords = self._getCalculatedCell(self._dom.bottomData, dt)
                : self._cacheCoords,
//            nHourPeriod = parseInt((evt.clientY + self._dom.bottomData.scrollTop() - aCalculated.aOffset.top) / 15);
            nHourPeriod = sStyle == 'bottom' 
                ? parseInt((evt.clientY + self._dom.bottomData.scrollTop() - aCalculated.aOffset.top) / 30)
                : undefined;

        return {
            "date"      : nHourPeriod == undefined ? self._period.min : self._dom.bottomLi.data('date'),
            "hour"      : nHourPeriod
        }
    }
    
    
    self._getCalculatedCell = function (div, dt) {
//        console.log(div);
        return {
            aOffset : div.offset(),
            dt : dt.getTime()
        }
    }
    
    
    jQuery.calendarAnything.appendView('mobile/day', view);
})();