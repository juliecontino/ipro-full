/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


//var monthView = function(div, parent) {
(function(){
    var self = {
        _css                : '/css/mobile/month.css',
        _parent             : null,
        _div                : null,
        _month_div          : null,
        _month_scroll_div   : null,
        _days_div           : null,
        _period             : {"min" : new Date(), "max" : new Date()},
        _maxEvents          : 0,
        _checkAutoHeight    : [0],
        _readyAutoHeight    : [],
        _touchData          : {},
        _presentWeeks       : []
    };
    //console.log(this);
    var view = {
        self : self
    };
    //view.self = self;
    
    view.init = function(div, parent) {
        self._div = div;
        self._parent = parent;
        self._parent.loadCss(self._css);
        self._initCss();
    }
    
    view.show = function() {
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('month');
            
        }
        self._div.addClass('weeks_' + self._parent.params.monthWeeks);
        var dCur = Date.baseDate(self._parent.options.current);
        dCur.setDate(1);
        self._div.addClass('show');
        self._buildRightGrid({date : dCur});
        self._resize();
        self._checkHeightCSS();
    }
    
    view.reShow = function(params) {
//        console.log('reshow', '' +  params.date);
//        params.nearPeriod = true;
        params.date.setDate(1);
        self._reBuildRightGrid({"date" : Date.baseDate(params.date, -28), "noScroll" : true});
        self._reBuildRightGrid({"date" : Date.baseDate(params.date, 32), "noScroll" : true});
        self._reBuildRightGrid(params);
        self._div.addClass('show');
    }
    
    
    view.showData = function(params) {
        return false;
    }
    
    
    view.changeCurrentPeriod = function(aOptions, mDirection) {
//        console.log('here ' + mDirection);
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
        } else {
            aOptions.current.setMonth(aOptions.current.getMonth() + mDirection);
        }
        aOptions.current.setHours(0, 0, 0, 0);
        
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date();
        }
        aOptions.min.setTime(aOptions.current);
        aOptions.min.setDate(1);
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = new Date();
        } 
        aOptions.max.setTime(aOptions.min);
        aOptions.max.setMonth(aOptions.max.getMonth() + 1, 0)
        //aOptions.max.setDate(0);
        self._period.min.setTime(aOptions.min);
        self._period.max.setTime(aOptions.max);
        if (self._month_scroll_div != undefined) {
            var sMonth = '' +  self._parent.options.current.getFullYear() + self._parent.options.current.getMonth() ;
            self._month_scroll_div.find('li.cur-month').removeClass('cur-month');
            self._month_scroll_div.find('li[data-month="' + sMonth + '"]').addClass('cur-month');
//            console.log('add cur-month class to li[data-month="' + sMonth + '"]', self._month_scroll_div.find('li[data-month="' + sMonth + '"]').size());
        }
//        console.log('change period ', self._period.min, self._period.max);
    }
    
    view.getTitle = function(){
        return self._parent.options.current.format(self._parent.options.format['monthTitle']);
//        self._parent.text.month[self._parent.options.current.getMonth()] 
//            + ' ' 
//            + self._parent.options.current.getFullYear();
    }
    
    view.delEvent = function(mEventId) {
        if (typeof(mEventId) == 'string') {
            mEventId = [mEventId];
        }
        var aEls = self._month_scroll_div.find('div.evt');
        aEls = aEls.filter('[data-event="' + mEventId.join('"], [data-event="') + '"]');
        if (aEls.size() < 1) {
            return;
        }
        var aWeeks = [];
        aEls.each(function(){
            var nWeek = jQuery(this).parents('div[data-week_time]').data('week_time');
            if (nWeek != undefined && aWeeks.indexOf(nWeek) == -1) {
                aWeeks.push(nWeek);
            }
        });
        for (var nI = 0; nI < aWeeks.length; nI++) {
            self._refreshWeek(aWeeks[nI]);
        }
    }
    
    
    view.clearView = function() {
        self._days_div = null;
        self._month_scroll_div = null;
        self._month_div = null;
        self._div = null;
        self._presentWeeks = [];
    }
    
    
    view.getMaxHeight = function() {
        if (self._month_scroll_div == null) {
            return false;
        }
        var oWeek = self._month_scroll_div.children('div:first');
        if (oWeek.size() < 1) {
            return false;
        }
        var nEventsHeight = oWeek.height() - 30, 
            nEventCounts = parseInt(nEventsHeight / self._parent.layout.getEventHeight(self._parent.params.size));
        return nEventCounts;
        
    }
    
    view.refresh = function(params) {
//        console.log('refresh params ' , params);
        if (params == undefined) {
            params = {
                min : self._period.min,
                max : self._period.max
            };
        }
        view.showData({min : params.start, max : params.end});
        //self._buildRightData({min : params.start, max : params.end});
    }
    
    
    view.resize = function(bChangeSmall){
        if (self._div == null || self._div == undefined) {
            return 0;
        }
        return self._resize(bChangeSmall);
    }
    
    
    view.preparePrint = function(bMode) {
        return;
    }
    
    
//    view.setMinMaxDate = function(dMin, dMax) {
//        dMin.resetFirstWeekDay(self._parent.params.startWeekDay);
//        dMax.resetFirstWeekDay(self._parent.params.startWeekDay).changeDate(7);
//    }
    
    view.getClickDate = function(oEvt) {
        var oCalculated = self._getWeekDay(oEvt),
            dD = Date.baseDate(oCalculated.date);
        return {
            "date" : dD,
            "hourly" : false
        }
    }
    
    view.areaMenu = function(oArea) {
        var sHTML = '<div data-action=daydetails>Day details</div>';
        return sHTML;
    }
    
    view.areaMenuAction = function(sAction, oEl, oEvt) {
        var aDate = view.getClickDate(oEvt),
            oLi = self._month_scroll_div.find('li[data-date="' + (aDate.date.getTime() / 1000) + '"]');
        if (sAction == 'daydetails') {
            self._showFullDayMore(oLi);
            self._parent.hidePopup();
        }
    }
    
    
    
    self._resize = function(bChangeSmall) {
        var nHeight = self._div.height(),
            nBarHeight = self._parent.layout.getEventHeight(),
            nWeekHeight = parseInt(nHeight / (self._parent.params.monthWeeks > 0 ? self._parent.params.monthWeeks : 1)),
            nWidth = self._div.width() - 40;
            
        self._month_scroll_div.removeClass('_max_events_' + self._maxEvents);
        self._maxEvents = self._parent.params.monthWeeks == 0 
            ? 1000
            : parseInt((nWeekHeight - 30) / nBarHeight);
        if (self._parent.options._small) {
            self._maxEvents = 0;
        }
        self._month_scroll_div.addClass('_max_events_' + self._maxEvents);
        
        self._div.removeClass(' _width_week_' + self._widthWeek);
        self._widthWeek = nWidth - Math.floor(nWidth * 0.14) * 7 - Math.floor(nWidth * 0.02) - 1;
        self._div.addClass('_width_week_' + self._widthWeek);
        if (bChangeSmall) {
            self._buildRightHeadDays();
        }
    }
    
    self._buildRightGrid = function(params){
        params = params || {};
        var i, sHTML, 
            dBase = Date.baseDate(params.date != undefined ? params.date : self._parent.options.current),
            dMonth = Date.baseDate(self._parent.options.current),
            dNextMonth = Date.baseDate(dMonth),
            dCur = Date.baseDate(dBase), 
            dEnd,
            tTime, bScrollInitNull = false;
        
        if (self._days_div == null) {
            self._buildRightHeadDays();
            self._initEvents();
            bScrollInitNull = true;
        }
        dCur.setDate(1);
        dCur.resetFirstWeekDay(self._parent.params.startWeekDay);
        dEnd = Date.baseDate(dCur, self._parent.params.monthWeeks == 0 ? 90 : 48);
        
        dMonth.setDate(1);
        
        dNextMonth.setDate(1);
        dNextMonth.changeMonth(1).setDate(0);
        
        var dBaseWeekMonth = Date.baseDate(dBase);
        dBaseWeekMonth.resetFirstWeekDay(self._parent.params.startWeekDay);
        var sDayClass = '', oCurrentViewWeek,
            tWeekToScroll = dBaseWeekMonth.getTime() / 1000,
            nScrollPos;
            
        if (tWeekToScroll != 0 && params.noScroll != undefined && params.noScroll != false) {
            oCurrentViewWeek = self._getVisibleWeek('middle');
        }

        var nBeforeAddHeight = 0, 
            nOldHeight = self._month_scroll_div.prop('scrollHeight'),
            nOldScrollTop = self._month_scroll_div.scrollTop(), nNewScrolTop;
        for (; dCur <= dEnd; ) {
            tTime = (dCur.getTime() / 1000);
//            console.log('adding ' + dCur);
            var oWeek = self._month_scroll_div.children('[data-week_time="' + tTime + '"]');
            if (oWeek.size() < 1) {
                sHTML = '<div '
                    + ' class="_max_auto_0" '
                    + 'data-week_time="' + tTime + '" '
                    + 'data-start="' + dCur.toString() + '" '
                    + 'data-max_auto="0" '
                    + '><ul><li></li>';
                for (i = 0; i < 7; i++){
                    
                    var nMonthDay = dCur.getDate();
                    sDayClass = dCur >= dMonth && dCur <=  dNextMonth
                        ? "cur-month"
                        : "";
                    sDayClass += (dCur.valueOf() == self._parent.options.now.valueOf()) ? ' current' : '';                
                    sHTML += '<li '
                        + 'class="' + sDayClass + '" '
                        + 'data-month="' + dCur.getFullYear() + dCur.getMonth() + '" '
                        + 'data-date="' + (dCur.valueOf() / 1000) + '" '
                        + 'data-day="' + dCur.getDay() + '" >'
                        + '<span class=detail_day>'
                        + (nMonthDay == 1 ? self._parent.text.monthShort[dCur.getMonth()] + ' ' : "") + nMonthDay
                        + '</span>';
                    dCur.changeDate(1);
                }
                sHTML += '</ul><div class=events></div></div>';
                oWeek = self._putWeekOnGrid(sHTML, tTime);
//                console.log('added week ', oWeek.data('start'), ' ', self._month_scroll_div.scrollTop());
                if (params.noScroll === true
                    && oWeek.data('week_time') < oCurrentViewWeek.data('week_time')
                ) {
                    nBeforeAddHeight += oWeek.height();
                }
            } else {
                dCur.changeDate(7);
            }
        }
        
//        console.log('SCROLL HEIGHT IS ' + nOldHeight 
//            + ' / ' + self._month_scroll_div.prop('scrollHeight')
//            + ' / old scrolltop ' + nOldScrollTop  + ' / current  ' + self._month_scroll_div.scrollTop()
//        );
        
        if (bScrollInitNull) {
            self._month_scroll_div.scrollTop(0);
        } 
        
        if (tWeekToScroll != 0 && (params.noScroll == undefined || params.noScroll == false)) {
            oWeek = self._month_scroll_div.children('[data-week_time="' + tWeekToScroll + '"]');
//            console.log('scrolling to ' + oWeek.data('start'), ' base date  is ' + dBaseWeekMonth);
            self._month_scroll_div.scrollTop(parseInt(oWeek.position().top + self._month_scroll_div.scrollTop()));
            
        } else if (nBeforeAddHeight > 0) {
            self._month_scroll_div.scrollTop(self._month_scroll_div.scrollTop() + nBeforeAddHeight);
        } else if ((nNewScrolTop = self._month_scroll_div.scrollTop()) > nOldScrollTop) {
            self._month_scroll_div.scrollTop(nOldScrollTop);
        } else {
            
        }
//        if (self._month_scroll_div.children('._drag_pane').size() > 0) {
//            jQuery('._drag_pane_bg, ._drag_pane').css('height', self._month_scroll_div[0].scrollHeight);
//        }
    }
    
    self._buildRightHeadDays = function() {
        var sHTML = '<div class=days><ul><li></li>', 
            i,
            aWeekNames = self._parent.options._small 
                ? self._parent.text.weekShort 
                : self._parent.text.week;
        if (self._days_div == null) {
            for (i = self._parent.params.startWeekDay; i < 7 + self._parent.params.startWeekDay; i++) {
                sHTML += '<li data-day="' + (i % 7) + '">' + aWeekNames[i % 7] + '</li>';
            }
            sHTML += '</ul></div>';
            self._days_div = jQuery(sHTML).appendTo(self._div);
        } else {
            for (i = self._parent.params.startWeekDay; i < 7 + self._parent.params.startWeekDay; i++) {
                self._days_div.find('li[data-day="' + (i % 7) + '"]').text(aWeekNames[i % 7]);
            }
        }
        
        self._month_scroll_div = self._div.children('div.month_scroll');
        if (self._month_scroll_div.size() < 1) {
            self._month_scroll_div = jQuery('<div class="month_scroll">').appendTo(self._div);
        }
        self._month_day_detail_div = self._div.children('div.month_day_detail');
        if (self._month_day_detail_div.size() < 1) {
            self._month_day_detail_div = jQuery('<div class="month_day_detail"><div class="events"></div></div>').appendTo(self._div);
        }
        
    }
    
    
    self._putWeekOnGrid = function(sHTML, tDate) {
        var oDiv = jQuery(sHTML);
        if (self._month_scroll_div.children().size() < 1) {
            oDiv.appendTo(self._month_scroll_div);
            self._presentWeeks = [tDate];
            return oDiv;
        }
//        console.time('week calculation');

        if (self._presentWeeks.min() > tDate) {
            self._month_scroll_div.prepend(oDiv);
            self._presentWeeks.unshift(tDate);
        } else if (self._presentWeeks.max() < tDate) {
            oDiv.appendTo(self._month_scroll_div);
            self._presentWeeks.push(tDate);
        } else {
            for (var nI = 0; nI < self._presentWeeks.length; nI++) {
                if (self._presentWeeks[nI] > tDate) {
                    break;
                }
            }
//            console.log('find position' + Date.baseDate(tDate) + ' / found ' + Date.baseDate(self._presentWeeks[nI]));
//            console.log(tDate, self._presentWeeks);
            oDiv.insertBefore(self._month_scroll_div.children('[data-week_time="' + self._presentWeeks[nI] + '"]'));
            self._presentWeeks.splice(nI, 0, tDate);
        }
//        console.timeEnd('week calculation');
        
        
//        var oWeeks = self._month_scroll_div.children(), oWeekFound;
//        console.time('week calculation');
//        jQuery.each(oWeeks, function(){
//            var el = jQuery(this);
//            if (el.data('week_time') > tDate) {
//                oWeekFound = el;
//                return false;
//            }
//        });
//        console.timeEnd('week calculation');
//        if (oWeekFound == undefined) {
//            self._month_scroll_div.append(oDiv);
//        } else {
//            oDiv.insertBefore(oWeekFound);
//        }
        return oDiv;
    }
    
//    self._putMonthOnGrid = function(sHTML) {
//        var oLast = null;
//        var oDiv = jQuery(sHTML);
//        var nMonth = oDiv.data('month');
//        var nYear = oDiv.data('year');
//        
//        if (self._month_scroll_div.children().size() < 1) {
//            oDiv.appendTo(self._month_scroll_div);
//            return oDiv;
//        }
//        var aCurrentYear = self._month_scroll_div.children('[data-year="' + nYear + '"]');
////        console.log(nMonth, nYear, aCurrentYear.size());
//        if (aCurrentYear.size() > 0) {
////            if (nMonth == 0) {
////                oDiv.insertBefore(aCurrentYear.eq(0));
////            } else {
//                aCurrentYear.each(function(){
//                    var el = jQuery(this);
////                    console.log('current month ' + el.data('month'));
//                    if (el.data('month') > nMonth) {
//                        oDiv.insertBefore(el);
//                        oLast = null;
//                        return false;
//                    }
//                    oLast = el;
//                });
//                if (oLast != null) {
//                    oDiv.insertAfter(oLast);
//                }
////            }
//            return oDiv;
//        } 
//        var nMinYear = self._month_scroll_div.children().eq(0).data('year');
//        if (nMinYear > nYear) {
//            oDiv.prependTo(self._month_scroll_div);
//            return oDiv;
//        }
//        for (var nI = nYear - 1; nI >= nMinYear; nI++) {
//            var oCur = self._month_scroll_div.children(['[data-year="' + nI + '"]:last']);
//            if (oCur.size() > 0) {
//                oDiv.insertAfter(oCur);
//                return oDiv;
//            }
//        }
//    }
    
    self._reBuildRightGrid = function(params) {
        self._buildRightGrid(params);
    }
    
    
    self._buildRightData = function(params, data) {
//        console.log('build right data' + self._parent._events.getWeek());
        var dStartWeekDate  = Date.baseDate(self._period.min), 
            dEndWeekDate    = Date.baseDate(self._period.max);
        
        if (typeof(params) != 'undefined' && params.min != undefined) {
            dStartWeekDate = Date.baseDate(params.min);
            if (params.max != undefined) {
                dEndWeekDate = Date.baseDate(params.max);
            } else {
                dEndWeekDate = Date.baseDate(dStartWeekDate.getTime() / 1000);
                dEndWeekDate.changeMonth(1);
            }
            //dEndWeekDate.setDate(params.max != undefined ? params.max.getDate() : dStartWeekDate.getDate());
            //dEndWeekDate.setMonth(dEndWeekDate.getMonth() + 1);
        } else {
            dEndWeekDate.setTime(dStartWeekDate.getTime());
            dEndWeekDate.changeDate(42);
        }
//        console.log('Weeks' + dStartWeekDate , '' + dEndWeekDate);
        
        dStartWeekDate.resetFirstWeekDay(self._parent.params.startWeekDay).resetHours();
//        console.log('START', dStartWeekDate, dEndWeekDate);
//        var aDataByWeek = self._splitWeekData({start : dStartWeekDate.getTime() / 1000, "end" : dEndWeekDate.getTime() / 1000}, data);
        
//        console.log('try to build ' + dStartWeekDate + ' to ' + dEndWeekDate);
        self._checkAutoHeight.length = 0;
        for (var dCur = new Date(dStartWeekDate); dCur < dEndWeekDate; dCur.changeDate(7)) {
            var tWeek = dCur.getTime() / 1000;
//            self._refreshWeek(tWeek, aDataByWeek[tWeek]);
            self._refreshWeek(tWeek);
        };
        self._checkHeightCSS();
//        console.timeEnd('load data ');
//        var dCur = new Date(dStartWeekDate);
//        for (var nWeek = 0; nWeek < 6; nWeek++) {
//        //jQuery.each(aWeeks, function(tWeek, oWeek) {
//            self._refreshWeek((dCur.getTime() / 1000));
//            dCur.changeDate(7);
//        };
        
    }
    
    self._refreshWeek = function(tWeek, aWeekEvents) {
        var oWeekData = self._parent._events.getWeek(tWeek),
            sHTML = '';
        if (oWeekData == undefined){
            return;
        }
//        console.time('biild lines');
//        console.log(oWeekData);
//        
        //console.log('week ' + tWeek, oWeekData);
//        if (aWeekEvents == undefined) {
//            return;
//        }
        var curWeek = self._month_scroll_div.children('div[data-week_time="' + tWeek + '"]'),
            oCurWeekEvents = curWeek.children('div.events');
        if (oCurWeekEvents.size() < 1) {
            oCurWeekEvents = jQuery('<div class=events></div>').appendTo(curWeek);
        } else {
            oCurWeekEvents.html('');
        }
        
        if (typeof(curWeek.data('max_auto')) != 'undefined') {
//            console.log('removing', tWeek, curWeek.data('week_time') , curWeek.data('max_auto'));
            curWeek.removeClass('_max_auto_' + curWeek.data('max_auto'));
        }
        curWeek
            .data('max_auto', oWeekData.bar.length)
            .addClass('_max_auto_' + oWeekData.bar.length);
//        console.log('adding', tWeek, curWeek.data('week_time') , curWeek.data('max_auto'));
        self._checkAutoHeight.push(oWeekData.bar.length);
        //console.log(oWeekData);
//        var sHTML = '';
//        for (var nI = 0; nI < aWeekEvents.length; nI++) {
//            sHTML += self._buildEventBar(aWeekEvents[nI].line, aWeekEvents[nI]);
////            oCurWeekEvents.append(self._buildLineEvents(nLine, aLineEvents));
//        }
//        oCurWeekEvents.append(sHTML);
        jQuery.each(oWeekData.bar, function(nLine, aLineEvents){
            if (nLine > self._maxEvents + 10) {
                return false;
            }
            sHTML += self._buildLineEvents(nLine, aLineEvents);
        });
        if (oCurWeekEvents[0] != undefined) {
            oCurWeekEvents[0].innerHTML = sHTML;
        }
        if (self._maxEvents != 1000) {
            self._buildWeekDayMore(oWeekData, curWeek);
        }
        curWeek.find('li.full_day').each(function(){
            var oLi = jQuery(this);
            self._showFullDayMore(oLi, true);
        });
//        console.timeEnd('biild lines');
    }
    
    self._buildLineEvents = function(nLine, aLineEvents) {
        var sHTML = '';
        for (var i = 0; i < aLineEvents.length; i++) {
            var el = aLineEvents[i];
            sHTML += self._buildEventBar(nLine, el);
        }
        return sHTML;
    }
    
    self._buildEventBar = function(nLine, el) {
        var 
            sHTML = '', 
            nColStart = el.cellStart,
            nColLength = el.cellLength,
            aCalendar = el.event.getCalendar(); //self._parent._calendars.getCalendar(el.event.calendarid);
//            nColStart = (7 + el.start.getDay() - self._parent.params.startWeekDay) % 7, 
//            nColLength = el.days;
//            if (nColLength < 0) {
//                console.log(el);
//            }
        sHTML += '<div class="evt d' + nColStart 
            + ' p' + nColLength + ' ' 
            + ' l' + nLine + ' ' 
            + ( el.full_l ? "full_l " : ' ' )
            + ( el.full_r ? "full_r " : ' ' )
            + ( aCalendar.editable !== true || aCalendar.move !== true ? "non_e " : ' ' )
//            + ( el.event.editable !== true ? "non_e " : ' ' )
            + ( el.event.noEnd != undefined && el.event.noEnd ? "non_r " : ' ' )
            + (self._parent.options.readonly === true || self._parent.options.readonly.move === false 
                ? ' non_e  non_r ' 
                : ''
            )
            + '" '
            + ' data-p="' + nColLength + '" '
            + ' data-l="' + nLine + '" '
            + ' data-d="' + nColStart + '" '
            + ' data-event="' + el.event.id + '"'
            + ' data-calendar="' + el.event.calendarid + '"'
            + ' data-start="' + ( el.event.dayStart.valueOf() / 1000 ) + '"'
//            + ' data-start-d="' + ( el.event.dayStart) + '"'
//            + ' data-end-d="' + ( el.event.dayEnd) + '"'
            + ' data-end="' + ( el.event.dayEnd.valueOf() / 1000 ) + '"'
            + ' title="' + el.event.getTitle().htmlspecialchars() + '"'
                
            + '>'
            + '<span class="title color_' + el.event.className 
                + (el.event.specColor != undefined && el.event.specColor != '' ? ' ' + el.event.specColor : '')
            + '">' 
            + '<span class="text">' 
                + (el.event.allDay === false 
                    ? el.event.dateStart.format(self._parent.options.format.hourTitle) + ' ' 
                        
                    : '')
                + el.event.title.htmlspecialchars()
            + '</span>'
            + '<span class=l></span><span class=r></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    self._buildWeekDayMore = function(oWeek, oWeekDiv) {
//        oMonthDiv = oMonthDiv || self._month_div;
        var ulWeek = oWeekDiv.find('ul'), 
            aLi = ulWeek.children('li[data-day]'),
            el, curWeekData, curWeekCounts;
//        console.time('week more');
        
        aLi.data('events', 0);
        aLi.children('.more').removeClass('on');
        if (self._maxEvents == 0) {
            aLi.children('.more').removeClass('_more_1 _more_2 _more_3 _more_4 _more_5');
        }
        
        for (var nJ = 0; nJ < oWeek.daysData.length; nJ++) {
            if (oWeek.daysData[nJ] == undefined) {
                continue;
            }
            curWeekData = oWeek.daysData[nJ];
            curWeekCounts = self._maxEvents == 0 
                ? curWeekData.nonEmptyValues().length 
                : curWeekData.length;
            var el = aLi.filter('[data-day="' + nJ + '"]');
            el.data('events', curWeekCounts);
            if (curWeekCounts > self._maxEvents) {
                el.children('.more')
                    .addClass('on')
                    .text(
                        (self._maxEvents > 0 ? '+'  : '')
                        + (curWeekCounts - self._maxEvents)
                    );
                if (self._maxEvents == 0) {
                    el.children('.more')
                        .addClass('_more_' + Math.min(curWeekCounts, 5))
                        .attr('title', 'Events: ' + curWeekCounts);
                }
            }
        }
        
//        
//        ulWeek.children('li[data-day]').each(function() {
//            var el = jQuery(this);
//            curWeekData = oWeek.daysData[el.data('day')];
////            console.log(curWeekData);
////                self._parent._events.getWeekDaysData(nWeek, el.data('day'));
//            curWeekCounts = typeof(curWeekData) != 'undefined' 
//                ? (self._maxEvents == 0 ? curWeekData.nonEmptyValues().length : curWeekData.length )
//                : 0;
//            //console.log(curWeekCounts);
//            el.data('events', curWeekCounts);
//            el.children('span.more').removeClass('on');
////            console.log(curWeekCounts + ' / ' + self._maxEventst);
//            if (curWeekCounts > self._maxEvents) {
//                el.children('span.more')
//                    .addClass('on')
//                    .text(
//                        (self._maxEvents > 0 ? '+'  : '')
//                        + (curWeekCounts - self._maxEvents)
//                    );
//                if (self._maxEvents == 0) {
//                    el.children('span.more')
//                        .removeClass('_more_1 _more_2 _more_3 _more_4 _more_5')
//                        .addClass('_more_' + Math.min(curWeekCounts, 5))
//                        .attr('title', 'Events: ' + curWeekCounts);
//                }
//            }
//            
//        });
//        console.timeEnd('week more');
        
    }
    
    self._showFullDayMore = function(el, bMode) {
        
        var dWeek = el.parent().parent().data('week_time'), 
            nDay = el.data('day'), 
            //curWeekData = self._events.getWeekDaysData(nWeek, nDay),
            i, sHTML = '', curEl, sSmallHTML = '',
//            aEvents = self._parent._events.getWeekDaysData(nWeek, nDay, true);
            aEvents = self._parent._events.getWeekDaysData(Date.baseDate(dWeek), nDay, true),
            aCalendar;
        
        if (el.data('events') == 0 || aEvents.length < 1) {
            return;
        }
        var spanDayMore = el.children('span.daymore');
        if (spanDayMore.size() < 1) {
            var d = Date.baseDate(el.data('date'));
            spanDayMore = jQuery('<span class="daymore">'
                + '<div class=_title>' 
                    + d.format(self._parent.options.format['date']) 
                + '</div>'
                + '<div class=_close>X</div>'
                + '<div class=sub_events></div>'
                + '<div class=_move></div>'
                + '<div class=_resize></div>'
                + '</span>'
            );
            spanDayMore.appendTo(el);//.append();
        }
        sHTML = '';
        sSmallHTML = self._buildAgendaBars(aEvents, Date.baseDate(el.data('date')));
        for (i = 0; i < aEvents.length; i++) {
            curEl = aEvents[i];
            if (curEl == undefined) {
                break;
            }
            aCalendar = curEl.getCalendar(); //self._parent._calendars.getCalendar(curEl.calendarid);
            sHTML += '<div class=" evt '
                + (curEl.dayStart.valueOf() / 1000 < el.data('date') ? "full_l " : "")
                + (curEl.dayEnd.valueOf() / 1000 > el.data('date') ? " full_r " : "")
                + ( aCalendar.editable !== true || aCalendar.move !== true ? "non_e " : ' ' )
//                    + ( curEl.editable !== true ? "non_e " : ' ' )
                + '"' 
                + 'data-event="' + curEl.id + '"'
                + 'data-calendar="' + curEl.calendarid + '"'
                + '>' 
                + '<span class="title color_' + curEl.className 
                    + (curEl.specColor != undefined && curEl.specColor != '' ? ' ' + curEl.specColor : '')
                + '">'
                + curEl.title.htmlspecialchars() 
                + '<span class=l></span>'
                + '<span class=r></span>'
                + '</span>'
                + '</div>';
        }
        
        if (sHTML == '') {
            spanDayMore.remove();
            if (self._parent.options._small){
                self._month_day_detail_div.children('.events').html('');
            }
        } else {
            spanDayMore.children('.sub_events').html(sHTML);
            
            if (self._parent.options._small){
                self._month_day_detail_div.children('.events').html(sSmallHTML);
            }
            
            if (self._parent.options._small) {
                self._month_scroll_div.find('li.full_day').removeClass('full_day');
            }
            if (bMode === undefined) {
                el.toggleClass('full_day');
                if (self._parent.params.monthDayMoreWidth != undefined 
                    && !self._parent.options._small
                    && parseInt(self._parent.params.monthDayMoreWidth) == 1 
                    && !spanDayMore.hasClass('_changed')
                ) {
                    var oResize = spanDayMore.find('._resize'),
                        oMove = spanDayMore.find('._move'),
                        nWidth = spanDayMore.width(),
                        nChangeHeight = Math.max(0, (aEvents.length - 3) * 20);
                    
                    self._changeSize({
                        target  : oResize,
                        clientX : oResize.offset().left,
                        clientY : oResize.offset().top,
                        which   : 1
                    }, {x : 150, y : nChangeHeight > 200 ? 200 : nChangeHeight});
                    if (spanDayMore.width() < nWidth + 150) {
                        self._changePosition({
                            target  : oMove,
                            clientX : oMove.offset().left,
                            clientY : oMove.offset().top,
                            which   : 1
                        }, {x : 0 - (nWidth + 150 - spanDayMore.width()), y : 0});
                    }
//                    el.css('right', -150)
//                        .height(el.height() + 14)
//                        .addClass('_changed');
                }
                
            } else {
                el.toggleClass('full_day', bMode);
            }
        }
        
    }    
    
    self._buildAgendaBars = function(aData, dCur) {
        var aEl, nJ,
            sDetailsHTML = '', oCalendar, aDetails,
            sHTML = '<table><tbody>';
//            sHTML = '<span class=detail_day>'
//                + dCur.getDate()
//                + '</span>'
//                + '<table><tbody>';
        aData.quickSort('start');
        for (var nI = 0; nI < aData.length; nI++) {
            aEl = aData[nI];
            sDetailsHTML = '';
            oCalendar = eEl.getCalendar(); //self._parent._calendars.getCalendar(aEl.calendarid);
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
        return sHTML;
    }
    
//    self._splitWeekData = function(params, data) {
//        var aResult = {}, dMin, dMax, tWeek, tWeekEnd, nLine,
//            aDays = {};
////        console.time('events listing ');
//        var aSomeresult = [];
//        for (var nI = 0; nI < data.length; nI++) {
//            var el = data[nI];
//            dMin = Date.baseDate(Math.max(el.tdStart, params.start));
//            dMax = Date.baseDate(Math.min(el.tdEnd, params.end));
//            for (var dCur = dMin.resetFirstWeekDay(self._parent.params.startWeekDay) ;
//                dCur <= dMax; 
//                dCur.changeDate(7)
//            ){
//                tWeek = dCur.getTime() / 1000, tWeekEnd = Date.baseDate(dCur, 6).getTime() / 1000;
//                if (typeof(aResult[tWeek]) == 'undefined') {
//                    aResult[tWeek] = [];
//                    aDays[tWeek] = [[],[],[],[],[],[],[]]
//                }
//                var nDay = tWeek < el.tdStart ? el.dayStart.getDaysFrom(dCur, false) : 0,
//                    nDayMax = el.tdEnd > tWeekEnd ? 6 : el.dateEnd.getDaysFrom(dCur, false); 
//                
//                if (aDays[tWeek][nDay].length < 1) {
//                    nLine = 0;
//                } else {
//                    for (nLine = 0; nLine < aDays[tWeek][nDay].length; nLine++) {
//                        if (typeof(aDays[tWeek][nDay][nLine]) == 'undefined') {
//                            break;
//                        }
//                    }
//                }
//                
//                aSomeresult.push([tWeek, tWeekEnd + ' / ' + el.tdEnd, nDay, nDayMax, nLine, '' + dCur, '' + dMax, Date.baseDate(tWeek), Date.baseDate(tWeekEnd), el.title]);
//                //console.log(nDay, nDayMax, nLine);
//                aResult[tWeek].push({
//                    "event" : el, 
//                    "start" : Math.max(tWeek, el.tdStart),
//                    "end"   : Math.min(tWeekEnd, el.tdEnd),
//                    "full_l" : tWeek > el.tdStart,
//                    "full_r" : tWeekEnd <= el.tdEnd,
//                    "line"   : nLine,
//                    "cellStart"  : nDay,
//                    "cellLength" : nDayMax - nDay,
//                    "cellEnd"    : nDayMax
//                });
//                for (; nDay <= nDayMax; nDay++){
//                    try{
//                        aDays[tWeek][nDay][nLine] = true;
//                    } catch (e) {
////                        console.log(nDay);
//                    }
//                }
//                
////                console.count('a');
//            }
//        }
////        console.timeEnd('events listing ');
////        show_object(aSomeresult);
//        return aResult;
//        
//    }
    
    self._showSelectingEvent = function(params) {
        var dStart = Date.baseDate(params.start), 
            dEnd = Date.baseDate(params.end);
        if (dStart.getTime() > dEnd.getTime()) {
            Date.swap(dStart, dEnd);
        };
        var tStart = dStart.getTime() / 1000,
            tEnd = dEnd.getTime() / 1000,
            dStartWeek = Date.baseDate(dStart).resetFirstWeekDay(self._parent.params.startWeekDay),
            dEndWeek = Date.baseDate(dEnd).resetFirstWeekDay(self._parent.params.startWeekDay).changeDate(7),
            dCur = Date.baseDate(dStartWeek),
            dNext = Date.baseDate(dStartWeek, 7),
            dTmp = Date.baseDate(dCur),
            aWeeks = self._month_scroll_div.children(),
            aSelectedLi = aWeeks.children('ul').children('._ctrlSel'),
            aSelectedWeek = aSelectedLi.parent().parent(),
            aSelectedDates = [], aNewDates = [], oWeek, aEvents;
        aSelectedWeek.each(function(){
            aSelectedDates.push(jQuery(this).data('week_time'));
        })
        for (
            //dCur = Date.setTime(dStartWeek.getTime), dNext.changeDate(); 
            ;
            dCur < dEndWeek; 
            dCur.changeDate(7), dNext.changeDate(7)
        ) {
            aNewDates.push(dCur.getTime() / 1000);
            oWeek = aWeeks.filter('[data-week_time="' + (dCur.getTime() / 1000) + '"]');
            
            if (dCur >= dStart && dNext < dEnd) {
                oWeek.find('li').addClass('_ctrlSel');
                oWeek.find('.evt').addClass('sel');
                continue;
            }
            aEvents = oWeek.find('.evt');
            oWeek.find('ul > li._ctrlSel').removeClass('_ctrlSel');
            aEvents.removeClass('sel');
            for (dTmp.setTime(dCur.getTime()); dTmp < dNext; dTmp.changeDate(1)) {
                if (dTmp < dStart || dTmp > dEnd) {
                    continue;
                }
                aEvents.not('.sel').each(function(){
                    var oBar = jQuery(this);
                    if (oBar.data('start') <= tEnd && oBar.data('end') >= tStart) {
                        oBar.addClass('sel');
                    }
                });
                oWeek.find('li[data-date="' + (dTmp.getTime() / 1000) + '"]').addClass('_ctrlSel');
            }
        }
        var aOld = aSelectedDates.diff(aNewDates);
        if (aOld.length > 0) {
            for (var nI = 0; nI < aOld.length; nI++) {
                oWeek = aWeeks.filter('[data-week_time="' + (aOld[nI]) + '"]');
                oWeek.find('li._ctrlSel').removeClass('_ctrlSel');
                oWeek.find('.evt.sel').removeClass('sel');
            }
        }
        //console.log(aOld);
//        var aSel = self._month_scroll_div.find('.evt.sel');
    }
    
    self._showCreatingEvent = function(params) {
        var dStart = Date.baseDate(params.start), 
            dEnd = Date.baseDate(params.end);
        if (dStart.getTime() > dEnd.getTime()) {
            Date.swap(dStart, dEnd);
        };
        params.start = dStart;
        params.end = dEnd;
        var dWeek = new Date(dStart), dCur, tWeek, divWeek,
            aOldWeeks = self._month_scroll_div.children('.new_events'), divBar;
        dWeek.resetFirstWeekDay(self._parent.params.startWeekDay);
        aOldWeeks.removeClass('new_events');
        //self._month_scroll_div.children('.new_events').removeClass('new_events');
        for (; dWeek <= dEnd; dWeek.changeDate(7)) {
            
            tWeek = dWeek.getTime() / 1000;
            divWeek = self._month_scroll_div.children('div[data-week_time="' + tWeek + '"]');
            if (divWeek.size() < 1) {
                continue;
            } 
            divWeek.addClass('new_events');
            divBar = divWeek.children('.events').children('.new_event');
            var aParams = jQuery.extend({}, {"week" : tWeek, "addClass" : 'new_event', "title" : "Create new"}, params);
            if (divBar.size() < 1) {
                divBar = jQuery(self._getEventBarHTML(aParams)).appendTo(divWeek.children('.events'));
            } else {
                self._updateEventBar(divBar, aParams);
                divBar.show();
            }
        }
        
        aOldWeeks.not('.new_events').find('.new_event').hide();
    }
    
    self._getEventBarHTML = function(aParams) {
        var sHTML = '', aCalculated = self._calculateEventBarParams(aParams);
        
        sHTML += '<div class="evt d' + aCalculated.nColStart 
            + ' p' + aCalculated.nColLength + ' ' 
            + ' l' + (aParams.line == undefined ? 0 : aParams.line) + ' ' 
            + ( aCalculated.bFL ? "full_l " : ' ' )
            + ( aCalculated.bFR ? "full_r " : ' ' )
            + ( aParams.addClass != undefined ? aParams.addClass + ' ' : ' ' )
            + '" data-p="' + aCalculated.nColLength + '" data-d="' + aCalculated.nColStart + '">'
            + '<span class="title">' 
            + '<span class="text">' + (aParams.title != undefined ? aParams.title.htmlspecialchars() : "") + '</span>'
//            + '<span class=l></span><span class=r></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    self._updateEventBar = function(divBar, aParams) {
        var aCalculated = self._calculateEventBarParams(aParams);
        divBar.removeClass('full_l full_r p' + divBar.data('p') + ' d' + divBar.data('d') + ' l' + divBar.data('l'))
        .addClass(' ' 
            + (aCalculated.bFL ? "full_l " : "")
            + (aCalculated.bFR ? "full_r " : "")
            + "p" + aCalculated.nColLength + ' ' 
            + "d" + aCalculated.nColStart + ' ' 
            + 'l' + (aParams.line == undefined ? 0 : aParams.line)
        ).data({"d" : aCalculated.nColStart , "p" : aCalculated.nColLength});
    }
    
    self._calculateEventBarParams = function (aParams) {
        var dWeek = new Date(typeof(aParams.week) == 'number' ? aParams.week * 1000 : aParams.week),
            dEndWeek = Date.baseDate(aParams.week, 6),
            dStart = (aParams.start < dWeek ? dWeek : aParams.start),
            dEnd = (aParams.end > dEndWeek ? dEndWeek : aParams.end),
            bFL = (aParams.start < dWeek),
            bFR = (aParams.end > dEndWeek),
            nColStart = dStart.getDaysFrom(dWeek, false),
            nColLength = dEnd.getDaysFrom(dWeek, false) - nColStart;
        return {"nColStart" : nColStart, "nColLength" : nColLength, bFL : bFL, bFR : bFR};
    }
    
    
    self._clearCreatingEvent = function(params) {
        var aWeeks = self._month_scroll_div.children('.new_events');
        if (params != undefined && params.noChange === true) {
            aWeeks.removeClass('new_events').find('.new_event')
                .each(function(){
                    var el = jQuery(this);
                    el.removeClass('l' + el.data('l') + ' l0')
                        .addClass('l' + el.data('l'));
                })
                .removeClass('new_event');
        } else {
            aWeeks.removeClass('new_events').find('.new_event').remove();
        }
        if (params != undefined && params.noChange !== true) {
            view.refresh();
//            self._parent._events.getData(params, function(data){
//                self._buildRightData(params, data);
//            });
//            self._buildRightData(params);
        }
    }
    
    
//    self._setNewActiveMonth = function(tTime) {
//        var dDate = new Date(tTime * 1000);
//        dDate.setDate(1);
//        dDate.resetFirstWeekDay(self._parent.params.startWeekDay);
//        var dMax = new Date(dDate);
//        dMax.setMonth(dMax.getMonth() + 1, 1);
//        self._month_scroll_div.children().removeClass('current');
//        while(dDate < dMax) {
//            self._month_scroll_div.children('[data-week_time="' + (dDate().getTime() / 1000) + '"]').addClass('current');
//            dDate.changeDate(7);
//        }
//    }
    
    self._getVisibleWeek = function(sWhere) {
        sWhere = sWhere || 'first';
        var aWeeks = self._month_scroll_div.children();
        if (self._maxEvents < 1000) {
            var nWeekHeight = aWeeks.filter(':first').height(),
                nWhere = sWhere == 'middle' 
                    ? self._month_scroll_div.height() * 0.5 
                    : (sWhere == 'last' ? self._month_scroll_div.height() - nWeekHeight : 0),
                nCurMiddleWeek = parseInt((self._month_scroll_div.scrollTop() +  nWhere) / nWeekHeight);
            return aWeeks.eq(nCurMiddleWeek);
        } else {
            var nBaseY = parseInt(self._month_scroll_div.scrollTop() + 
                    (sWhere == 'middle' 
                        ? self._month_scroll_div.height() / 2  
                        : (sWhere == 'last' ? self._month_scroll_div.height() - nWeekHeight : 0)
                    )),
                nCalculatedY = 0,
                oWeek;
            
            aWeeks.each(function() {
                var el = jQuery(this);
                nCalculatedY += el.height();
                if (nCalculatedY > nBaseY) {
                    oWeek = el;
                    return false;
                }
            });
            if (oWeek == undefined) {
                oWeek  = aWeeks.last();
            }
//            console.log('searcing for week ', nBaseY, nCalculatedY, ' found ' , oWeek.data('start'));
//            console.log(nCurrentY, oWeek.data('start'));
            return oWeek;
    //        console.log('week height ' + nWeekHeight + ' / ' + nCurMiddleWeek);
        }
        
    }
    
    self._initEvents = function() {
//        alert(self._parent.eventNames.up);
        var sClickEvent = self._parent.eventNames.down;
//                self._parent.options.ie10 
//            ? 'MSPointerDown' 
//            : self._parent.eventNames.down;
        self._month_scroll_div  //'mousedown'
            .on(sClickEvent, 'span.detail_day', function(evt){
                var el = jQuery(this).parent();
                self._parent.toggleMode('mobile/week', false, el.data('date'));
                return false;
            })
            .on(self._parent.eventNames.down, '.daymore > ._move', function(evt){
//                evt.max = {
//                    "left" : 2,
//                    "top" : 2,
//                    "width" : self._month_scroll_div.width() - 2, 
//                    "height" : self._month_scroll_div.height() - 2
//                };
                self._parent._returnTouchEvent(evt);
                self._changePosition(evt);
                return self._parent._cancelBubble(evt);
            }).on(self._parent.eventNames.dblclick, '.daymore > ._move', function(evt){
                self._showFullDayMore(jQuery(evt.target).parents('li.full_day'), false);
                return self._parent._cancelBubble(evt);
            })
            .on(sClickEvent, '.daymore > ._close', function(evt){
                self._showFullDayMore(jQuery(evt.target).parents('li.full_day'), false);
                return self._parent._cancelBubble(evt);
            })
            .on(self._parent.eventNames.down, '.daymore > ._resize', function(evt){
                self._parent._returnTouchEvent(evt);
                self._changeSize(evt);
                return self._parent._cancelBubble(evt);
            })
                
        
        
        self._parent._prependQueue([function(){
                var nLocalTimer = null, nTimer;
                self._month_scroll_div.on('calongtouch', {
                    handle : {
                        "move" : true,
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
                            self._parent.layout.changePeriod(evt.data.where ? -1 : 1);
                            break;
                        case "move" :
                            if (evt.data.initMode == 'init') {
                                nLocalTimer = evt.timeStamp;
                            } else if (evt.timeStamp - nTimer < 100) {
                                break;
                            }
                            nLocalTimer = evt.timeStamp;
                            self._touchScroll(null, evt, {y : -evt.data.startDeltaY}, evt.data.initMode);
                            break;
                        case 'longtouch' : 
                            self._parent.layout.showAreaSubmenu(jQuery(evt.currentTarget), evt);
                            //alert('longtouch');
                            break;
                        case "zoom" :
                            if (evt.data.zoom) {
                                self._parent.toggleMode('week');
                            } else {
                                self._parent.toggleMode('custom');
                            }
//                                alert(evt.data.zoom);
                            break;
                    }
                });
            },
            function(){
                self._parent._initScripts('/plugin/jquery.ca.touch.js');
            }
        ]);
       


        
//        self.div
//            .on('mouseenter mouseleave', "div[data-event]", function(evt){
//                var el = jQuery(this);
//                self._div
//                    .find('div[data-event="' + el.data('event') + '"]')
//                    .toggleClass('on', evt.type == 'mouseenter');
//            })            
               
    }
    
    self._checkScrollEvent = function(evt, delta, nToScroll) {
        var el = self._month_scroll_div,
//            el = jQuery(evt.currentTarget),
            oOldWeek = self._getVisibleWeek('middle'),
            dOldDate = Date.baseDate(oOldWeek.data('week_time')),
            oFirstWeek = self._getVisibleWeek(delta > 0 ? 'first' : 'last'),
            dLast = Date.baseDate(oFirstWeek.data('week_time'), delta > 0 
                ? Math.floor(-1 - 3.5 * (delta - 1)) 
                : Math.floor(7 + 7 * Math.abs(delta + 1) / 2)
            ),
            nOldScrollHeight, nNewScrollHeight;
        dLast.setDate(1);
        dOldDate.setDate(1);
        var dTmpDate = Date.baseDate(dOldDate);
//        console.log('dLast', '' + dLast, ' dTmpDate ', '' + dTmpDate, ' delta ' , delta);
        if (nToScroll) {
             nOldScrollHeight = self._month_scroll_div[0].scrollHeight;
        }
        while (dTmpDate.getTime() != dLast.getTime()) {
            dTmpDate.changeMonth(delta > 0 ? -1 : 1);
            self._buildRightGrid({"date" : dTmpDate, noScroll : true});
        }
        
        

        if (nToScroll == undefined) {
            
            var oldPos = el.scrollTop(),
                nNewPos = oldPos - delta * 30;
//            console.log('scrolling '+ nNewPos);
            el.scrollTop(nNewPos);
        } else {
            nNewScrollHeight = self._month_scroll_div[0].scrollHeight;
            if (delta > 0 && nNewScrollHeight > nOldScrollHeight) {
                nToScroll += nNewScrollHeight - nOldScrollHeight;
            }
            el.scrollTop(nToScroll);
        }
        
        var oCurWeek = self._getVisibleWeek('middle'),
            dNewDate = new Date(oCurWeek.data('week_time') * 1000);
        if (dNewDate.getMonth() != dOldDate.getMonth() ) {
            self._parent.layout.reChangePeriod(oCurWeek.data('week_time'));
//            dNewDate.setDate(1);
//            dNewDate.resetFirstWeekDay(self._parent.params.startWeekDay);
//            self._parent._runQueue([
//                [view.showData , {date : dNewDate}]
//            ]);
        }

    }
    
    
    self._touchScroll = function(el, evt, aDelta, sMode) {
        if (sMode != undefined && sMode == 'init') {
            self._touchData.aBasicScrollCoord = self._month_scroll_div.scrollTop();
            self._touchData.aBasicScrollHeight = self._month_scroll_div[0].scrollHeight;
            self._touchData.nCurrentDeltaPos = self._touchData.aBasicScrollCoord;
//                    console.log('init ' + aBasicScrollHeight + ' / ' + aBasicScrollCoord);
            return;

        }

        self._touchData.nDelta = 0;
        if (Math.abs(self._touchData.nCurrentDeltaPos - self._touchData.aBasicScrollCoord + aDelta.y) > 30) {
            self._touchData.nDelta = parseInt((self._touchData.nCurrentDeltaPos - self._touchData.aBasicScrollCoord + aDelta.y) / 30);
            self._touchData.nCurrentDeltaPos = self._touchData.aBasicScrollCoord - aDelta.y;
        }
        if (self._touchData.nDelta != 0) {
            evt.currentTarget = self._month_scroll_div;
            self._checkScrollEvent(evt, self._touchData.nDelta, self._touchData.aBasicScrollCoord - aDelta.y);

            var nNewScrollHeight = self._month_scroll_div[0].scrollHeight;

            if (self._touchData.nDelta > 0 && self._touchData.aBasicScrollHeight < nNewScrollHeight) {
//                        console.log('added some weeks ' + nDelta 
//                            + ' / ' + aBasicScrollCoord
//                            + ' / new scroll ' + self._month_scroll_div.scrollTop()
//                            + ' / old scrollheight ' + aBasicScrollHeight
//                            + ' / new scrollheight ' + nNewScrollHeight
//                        );
//                        aBasicScrollCoord = self._month_scroll_div.scrollTop();
                self._touchData.aBasicScrollCoord += nNewScrollHeight - self._touchData.aBasicScrollHeight;
                self._touchData.nCurrentDeltaPos = self._touchData.aBasicScrollCoord - aDelta.y;
                self._touchData.aBasicScrollHeight = nNewScrollHeight;
            }
        } else {
            self._month_scroll_div.scrollTop(self._touchData.aBasicScrollCoord - aDelta.y);
        }
    }
    
//    self._refreshEvent = function(params) {
//        if (typeof(params.event) == 'undefined') {
//            return;
//        }
//        var evt = self._parent.getEvent(params.event);
//        if (typeof(evt) == 'undefined') {
//            return;
//        }
////        var oldWeek = [].concat(evt.week);
//        
//        var allWeeks = [].concat(evt.week, params.oldWeeks);
////        console.log('evt', allWeeks);
//        allWeeks = allWeeks.unique();
////        console.log('evt', allWeeks);
//        for (var nI = 0; nI < allWeeks.length; nI++) {
//            var tCur = allWeeks[nI];
////            console.log(tCur);
//            var oWeek = self._parent._events.getWeek(tCur);
//            var aPartnerWeekEventDiv = self._month_scroll_div
//                .find('div[data-week_time="' + (tCur) + '"]')
//                .children('div.events');
//            aPartnerWeekEventDiv.html('')
////                curWeek;
//            if (oWeek == undefined){
//                continue;
//            }
//                
//            jQuery.each(oWeek.bar, function(nLine, aLineEvents){
//                aPartnerWeekEventDiv.append(self._buildLineEvents(nLine, aLineEvents));
//                //curWeek.append(el.name + ", ");
//            });
//            
//            //self._buildWeekDayMore(oWeek, curWeek);
//        }
//        
//    }
    
    self._swipe = function(el, evt, aDelta) {
        //console.log('x ' + aDelta.x + ' / y + ' + aDelta.y);
        if (Math.abs(aDelta.x) > Math.abs(aDelta.y) && Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
//        } else if (Math.abs(aDelta.y) > 30) {
//            var delta = parseInt(aDelta.y / 30);
//            evt.currentTarget = self._month_scroll_div;
//            self._checkScrollEvent(evt, delta);
        }
    }
    
    
    self._getWeekDay = function(evt) {
        var dt = new Date(),
            el = jQuery(evt.target),
            divWeek = el.data('week_time') != undefined ? el :  el.parents('div[data-week_time]'),
            aCalculated = (arguments.callee._cacheCoords == undefined || dt.getTime() - 10000 > arguments.callee._cacheCoords.dt) 
                ? arguments.callee._cacheCoords = self._getCalculatedCell(divWeek, dt)
                : arguments.callee._cacheCoords,
            xCoords = evt.clientX - aCalculated.aOffset.left - aCalculated.nFirstCellWidth,
            nDay = parseInt(xCoords / aCalculated.nCellWidth),
            divDayCell = divWeek.find('li').eq(nDay + 1);
        return {
            "week"      : divWeek.data('week_time'), 
            "day"       : nDay + 1, 
            "divWeek"   : divWeek, 
            "domDay"    : divDayCell, 
            "date"      : divDayCell.data('date'),
            "x"         : xCoords
        }
    }
    
    self._getCalculatedCell = function (divWeek, dt) {
        var aLiList = divWeek.find('li'),
            nFirstCellWidth = aLiList.eq(0).css('display') == 'none' ? 0 : aLiList.eq(0).width();
//        console.log(nFirstCellWidth);
        return {
//            nCellWidth : aLiList.eq(1).width(),
            nCellWidth : aLiList.eq(1)[0].offsetWidth,
            nFirstCellWidth : nFirstCellWidth,
            aOffset : self._month_scroll_div.offset(),
            dt : dt.getTime()
        }
    }
    
    
    
    self._initCss = function() {
        var aSizes = ['small', 'middle', 'large'],
            nI, nJ;
            
        changeCssClass(
            '.JQ_CA > .CA_r > div._mode-month   div.month_scroll._max_events_1000   div.events', 
            'height:auto; bottom:5px !important;', 
            true
        );
        

        for (nI = 1; nI <= 20; nI++) {
            for ( nJ = 0; nJ < aSizes.length; nJ++) {
                changeCssClass(
                    '.JQ_CA.' + aSizes[nJ] + ' > .CA_r > div._mode-month   div.month_scroll._max_events_' + nI + '   div.events', 
                    'height:' + (self._parent.layout.getEventHeight(aSizes[nJ]) * nI - 1) + 'px;', 
                    true
                );
            }
        }
    }
    
    
  
    
    self._checkHeightCSS = function() {
        self._parent.layout.initLinesCSS(self._checkAutoHeight.max());
        if (self._checkAutoHeight.length < 1 || self._maxEvents < 1000) {
            return false;
        }
        
        var aNeed = self._checkAutoHeight.diff(self._readyAutoHeight),
            aClass = [], aRule = [],
            aSizes = ['small', 'middle', 'large'],
            nJ, nI;
        aNeed = aNeed.unique();
        for (nI = 0; nI < aNeed.length; nI++) {
            for (nJ = 0; nJ < aSizes.length; nJ++) {
                aClass.push('.JQ_CA.' + aSizes[nJ] + ' > .CA_r > div._mode-month.weeks_0 div.month_scroll > div._max_auto_' + aNeed[nI]);
                aRule.push('height:' + (self._parent.layout.getEventHeight(aSizes[nJ]) * aNeed[nI] + 20) + 'px;');
            }
        }
        changeCssClass(aClass, aRule, true);
        self._readyAutoHeight = self._readyAutoHeight.concat(aNeed);
    }
    
    self._clearAllEvents = function() {
        self._month_scroll_div.children()
            .children('.events').html('');
        self._month_scroll_div.children(':not(._max_auto_0)').each(function(){
            var el = jQuery(this);
            el.removeClass('_max_auto_' + el.data('max_auto')).addClass('_max_auto_0').data('max_auto', 0);
        });
        self._month_scroll_div.find('li.full_day .daymore').remove();
        self._month_scroll_div
            .find('li.full_day').removeClass('full_day');
        self._month_scroll_div
            .find('span.more.on').removeClass('on');
        
    }
    
    self._changePosition = function(evt, aChangeSize){
        var el = jQuery(evt.target),
            elParent = evt.parent ? el.parents(evt.parent) : el.parent(),
            aCoords = {
                "x" : evt.clientX,
                "y" : evt.clientY,
                "baseL" : parseInt(elParent.css('left')), 
                "baseT" : parseInt(elParent.css('top')),
                "baseR" : parseInt(elParent.css('right')),
                "baseH" : elParent.height()
            },
            max = {
                "left"  : self._month_scroll_div.offset().left - elParent.offset().left + aCoords.baseL + 2,
                "left_right" : self._month_scroll_div.offset().left + self._month_scroll_div.width()
                    - elParent.parent().offset().left - 104,
//                    - elParent.offset().left + aCoords.baseL,
                "top"   : self._month_scroll_div.offset().top - elParent.offset().top,
                "height" : self._month_scroll_div.height() - 2,
                "width" : self._month_scroll_div.width() - 2 , 
                "right" : (aCoords.baseR + elParent.offset().left + elParent.width())
                    - (self._month_scroll_div.width() + self._month_scroll_div.offset().left) + 4
            },
            bFirstMove = elParent.hasClass('_changed'),
            funcMove = function(realEvt) {
                self._parent._returnTouchEvent(realEvt);
                var aChangeCoords = {
                    left : Math.min(max.left_right, aCoords.baseL - aCoords.x + realEvt.clientX),
                    top : (aCoords.baseT - aCoords.y + realEvt.clientY),
                    right : Math.max(aCoords.baseR + aCoords.x - realEvt.clientX, max.right)
//                    height : (aCoords.baseH - aCoords.y + realEvt.clientY)
                }
                if (typeof(max) != 'undefined'){
                    aChangeCoords.left = Math.min(aChangeCoords.left, max.width - elParent.width()),
//                    aChangeCoords.top  = Math.min(aChangeCoords.top, max.height - elParent.height())
                    aChangeCoords.left = Math.max(aChangeCoords.left, max.left);
//                    aChangeCoords.top  = Math.max(aChangeCoords.top, max.top);
//                    console.log('step 3 ' + aChangeCoords.top);
                }
               
                
                if (!bFirstMove && (aChangeCoords.left != aCoords.baseL || aChangeCoords.top != aCoords.baseT)) {
                    bFirstMove = true;
                    elParent.addClass('_changed').height(aCoords.baseH + 14);
                }
                
                aChangeCoords.left += 'px';
                aChangeCoords.top += 'px';
                aChangeCoords.right += 'px';
                elParent.css(aChangeCoords);
            },
            funcStop = function(realEvt) {
                jQuery(document).off('.changePosition');
            };
        if (evt.which != 1) {
            return false;
        }
        if (aChangeSize != undefined) {
            aCoords.baseR += aChangeSize.x;
            funcMove({
                clientX : evt.clientX + aChangeSize.x, 
                clientY : evt.clientY + aChangeSize.y
            });
        } else {
            jQuery(document)
                .on(self._parent.eventNames.move + '.changePosition', funcMove)
                .one(self._parent.eventNames.up + '.changePosition', funcStop);
        }
    }
    
    
    self._changeSize = function(evt, aChangeSize){
        var el = jQuery(evt.target),
            elParent = evt.parent ? el.parents(evt.parent) : el.parent(),
            aCoords = {
                "x" : evt.clientX, 
                "y" : evt.clientY,
                "baseR" : parseInt(elParent.css('right')), 
                "baseH" : elParent.height()
            },
            max = {
                    "right" : (aCoords.baseR + elParent.offset().left + elParent.width())
                        - (self._month_scroll_div.width() + self._month_scroll_div.offset().left) + 4
            },
            bFirstMove = elParent.hasClass('_changed'),
            funcMove = function(realEvt) {
                self._parent._returnTouchEvent(realEvt);
                var aChangeCoords = {
                    right : Math.max(aCoords.baseR + aCoords.x - realEvt.clientX, max.right),
                    height : (aCoords.baseH - aCoords.y + realEvt.clientY)
                }
                
                if (!bFirstMove && (aChangeCoords.height != aCoords.baseH || aChangeCoords.right != 0)) {
                    bFirstMove = true;
                    elParent.addClass('_changed').css('top', 0);
                    aChangeCoords.height += 14;
                    aCoords.baseH += 14;
                }
                
                elParent
                    .height(aChangeCoords.height)
                    .css('right', aChangeCoords.right);
                
            },
            funcStop = function(realEvt) {
                jQuery(document).off('.changeSize');
            };
            
        if (evt.which != 1) {
            return false;
        }
        if (aChangeSize != undefined) {
            funcMove({
                clientX : evt.clientX + aChangeSize.x, 
                clientY : evt.clientY + aChangeSize.y
            });
        } else {
            jQuery(document)
                .on(self._parent.eventNames.move + '.changeSize', funcMove)
                .one(self._parent.eventNames.up + '.changeSize', funcStop);
        }
    } 
    
    jQuery.calendarAnything.appendView('mobile/month', view);
    
})();