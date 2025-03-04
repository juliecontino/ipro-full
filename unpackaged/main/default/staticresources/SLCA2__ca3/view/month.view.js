/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css                : '/css/month.css',
        _parent             : null,
        _div                : null,
        _month_div          : null,
        _scroll_div         : null,
        _month_scroll_div   : null,
        _days_div           : null,
        _period             : {"min" : new Date(), "max" : new Date()},
        _maxEvents          : 0,
        _checkAutoHeight    : [0],
        _readyAutoHeight    : [],
        _touchData          : {},
        _presentWeeks       : [],
        _nScrollSpeed       : 30
    };
    var view = {
        self : self
    };
    
    view.init = function(div, parent) {
//        self._div = div;
        self._parent = parent;
        self._div = self._parent.layout.getCurrentModeDiv('month');
        self._parent.loadCss(self._css);
        self._initCss();
        self._nScrollSpeed = Math.max(
                1, 
                parseInt(self._parent._getUrlParam('scrollspeed', 30))
            );
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
        params.date.setDate(1);
        self._reBuildRightGrid({"date" : Date.baseDate(params.date, -28), "noScroll" : true});
        self._reBuildRightGrid({"date" : Date.baseDate(params.date, 32), "noScroll" : true});
        self._reBuildRightGrid(params);
        self._div.addClass('show');
    }
    
    
    view.showData = function(params) {
        
        if (typeof(params) == 'undefined' || typeof(params.date) == 'undefined') {
            params = params || {};
            params.min = Date.baseDate(self._parent.options.current, self._parent.params.extendendRange ? -7 : 0);
            params.min.setDate(1);
            params.min.resetFirstWeekDay(self._parent.params.startWeekDay);
            params.max = Date.baseDate(params.min).changeDate(42);
            params.nearPeriod = true;
        } else {
            params.min = Date.baseDate(params.date);
            params.min.setDate(1);
            params.min.resetFirstWeekDay(self._parent.params.startWeekDay)
            params.max = Date.baseDate(params.min, 42);
        }
        if (self._parent.params.extendendRange ) {
            params.min.changeMonth(-1);
            params.max.changeMonth(1);
        }
        params.calendars = self._parent.layout.getActiveCalendars();
        if (params.calendars.calendar.length == 0 && params.calendars.web.length == 0 && params.calendars.group.length == 0) {
            self._clearAllEvents();
            return;
        }
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('month');
        }
        self._parent._events.getData(params, function(data){
            self._buildRightData(params, data);
        });
    }
    
    
    view.changeCurrentPeriod = function(aOptions, mDirection) {
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
        } else {
            aOptions.current.changeMonth(mDirection);
        }
        aOptions.current.setHours(0, 0, 0, 0);
        
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date();
        }
        aOptions.min.setTime(aOptions.current.getTime());
        aOptions.min.setDate(1);
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = new Date();
        } 
        aOptions.max.setTime(aOptions.min);
        aOptions.max.setMonth(aOptions.max.getMonth() + 1, 0)
        self._period.min.setTime(aOptions.min);
        self._period.max.setTime(aOptions.max);
        if (self._month_scroll_div != undefined) {
            var sMonth = '' +  self._parent.options.current.getFullYear() + self._parent.options.current.getMonth() ;
            self._month_scroll_div.find('li.cur-month').removeClass('cur-month');
            self._month_scroll_div.find('li[data-month="' + sMonth + '"]').addClass('cur-month');
        }
    }
    
    view.getTitle = function(){
        return self._parent.options.current.format(self._parent.options.format['monthTitle']);
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
    
    
    view.clearView = function(aParams) {
        self._days_div = null;
        self._month_scroll_div = null;
        self._month_div = null;
        self._div = null;
        self._scroll_div = null;
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
        if (params == undefined) {
            params = {
                min : self._period.min,
                max : self._period.max
            };
        }
        view.showData({min : params.start, max : params.end});
    }
    
    
    view.resize = function(bChangeSmall){
        if (self._div == null || self._div == undefined) {
            return 0;
        }
        return self._resize(bChangeSmall);
    }
    
    
    view.preparePrint = function(bMode) {
        self._expand(bMode);
    }
    
    
    
    view.getClickDate = function(oEvt) {
        var oCalculated = self._getWeekDay(oEvt),
            dD = Date.baseDate(oCalculated.date);
        return {
            "date" : dD,
            "hourly" : false
        }
    }
    
    view.areaMenu = function(oArea) {
        var sHTML = '<div data-action=daydetails>'
            + self._parent.getText('month_day_details', 'Day details')
            + '</div>';
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
                        + '</span>'
                        + '<span class=more></span>';
                    dCur.changeDate(1);
                }
                sHTML += '</ul><div class=events></div></div>';
                oWeek = self._putWeekOnGrid(sHTML, tTime);
                if (params.noScroll === true
                    && oWeek.data('week_time') < oCurrentViewWeek.data('week_time')
                ) {
                    nBeforeAddHeight += oWeek.height();
                }
            } else {
                dCur.changeDate(7);
            }
        }
        
        
        if (bScrollInitNull) {
            self._month_scroll_div.scrollTop(0);
        } 
        
        if (tWeekToScroll != 0 && (params.noScroll == undefined || params.noScroll == false)) {
            oWeek = self._month_scroll_div.children('[data-week_time="' + tWeekToScroll + '"]');
            self._month_scroll_div.scrollTop(parseInt(oWeek.position().top + self._month_scroll_div.scrollTop()));
            
        } else if (nBeforeAddHeight > 0) {
            self._month_scroll_div.scrollTop(self._month_scroll_div.scrollTop() + nBeforeAddHeight);
        } else if ((nNewScrolTop = self._month_scroll_div.scrollTop()) > nOldScrollTop) {
            self._month_scroll_div.scrollTop(nOldScrollTop);
        } else {
            
        }
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
            if (self._parent.params.showScrollButtons === true) {
                self._div.append('<div class=_scroll_panel><span class=_up><a></a></span><span class=_down><a></a></span></div>');
                self._scroll_div = self._div.children('._scroll_panel');
            }
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
            oDiv.insertBefore(self._month_scroll_div.children('[data-week_time="' + self._presentWeeks[nI] + '"]'));
            self._presentWeeks.splice(nI, 0, tDate);
        }
        
        
        return oDiv;
    }
    
    self._reBuildRightGrid = function(params) {
        self._buildRightGrid(params);
    }
    
    
    self._buildRightData = function(params, data) {
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
        } else {
            dEndWeekDate.setTime(dStartWeekDate.getTime());
            dEndWeekDate.changeDate(42);
        }
        
        dStartWeekDate.resetFirstWeekDay(self._parent.params.startWeekDay).resetHours();
        self._checkAutoHeight.length = 0;
        for (var dCur = new Date(dStartWeekDate); dCur < dEndWeekDate; dCur.changeDate(7)) {
            var tWeek = dCur.getTime() / 1000;
            self._refreshWeek(tWeek);
        };
        self._checkHeightCSS();
    }
    
    self._refreshWeek = function(tWeek, aWeekEvents) {
        var oWeekData = self._parent._events.getWeek(tWeek),
            sHTML = '';
        if (oWeekData == undefined){
            return;
        }
        var curWeek = self._month_scroll_div.children('div[data-week_time="' + tWeek + '"]'),
            oCurWeekEvents = curWeek.children('div.events');
        if (oCurWeekEvents.size() < 1) {
            oCurWeekEvents = jQuery('<div class=events></div>').appendTo(curWeek);
        } else {
            oCurWeekEvents.html('');
        }
        
        if (typeof(curWeek.data('max_auto')) != 'undefined') {
            curWeek.removeClass('_max_auto_' + curWeek.data('max_auto'));
        }
        curWeek
            .data('max_auto', oWeekData.bar.length)
            .addClass('_max_auto_' + oWeekData.bar.length);
        self._checkAutoHeight.push(oWeekData.bar.length);
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
        sHTML += '<div class="evt d' + nColStart 
            + ' p' + nColLength + ' ' 
            + ' l' + nLine + ' ' 
            + ( el.full_l ? "full_l " : ' ' )
            + ( el.full_r ? "full_r " : ' ' )
            + ( aCalendar.editable !== true || aCalendar.move !== true ? "non_e " : ' ' )
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
            + ' data-end="' + ( el.event.dayEnd.valueOf() / 1000 ) + '"'
            + ' title="' + el.event.getTitle().htmlspecialchars() + '"'
                
            + '>'
            + '<span class="title color_' + el.event.className 
                + (el.event.specColor != undefined && el.event.specColor != '' ? ' ' + self._parent._events.getEventColor(el.event.specColor) : '')
            + '">' 
            + '<span class="text">' 
                + self._parent._events.getBarLabelTime(el.event)
//                el.event.allDay === false 
//                    ? el.event.dateStart.format(self._parent.options.format.hourTitle) + ' ' 
//                        
//                    : '')
                + (aCalendar.titleHTML !== true ? el.event.title.htmlspecialchars() : el.event.title)
            + '</span>'
            + '<span class=l></span><span class=r></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    self._buildWeekDayMore = function(oWeek, oWeekDiv) {
        var ulWeek = oWeekDiv.find('ul'), 
            aLi = ulWeek.children('li[data-day]'),
            el, curWeekData, curWeekCounts, curShowedCounts, curRealCounts;
        
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
            curRealCounts = curWeekData.nonEmptyValues().length;
            curWeekCounts = self._maxEvents == 0 
                ? curRealCounts
                : curWeekData.length;
            
            var el = aLi.filter('[data-day="' + nJ + '"]');
            el.data('events', curWeekCounts);
            if (curWeekCounts > self._maxEvents) {
                curShowedCounts = curWeekData.slice(0, self._maxEvents).nonEmptyValues().length;
                el.children('.more')
                    .addClass('on')
                    .text(
                        (self._maxEvents > 0 ? '+'  : '')
                        + (curRealCounts - curShowedCounts)
                    );
                if (self._maxEvents == 0) {
                    el.children('.more')
                        .addClass('_more_' + Math.min(curWeekCounts, 5))
                        .attr('title', self._parent.getText('month_events', 'Events') + ': ' + curWeekCounts);
                }
            }
        }
        
    }
    
    self._showFullDayMore = function(el, bMode) {
        
        var dWeek = el.parent().parent().data('week_time'), 
            nDay = el.data('day'), 
            i, sHTML = '', curEl, sSmallHTML = '',
            aEvents = self._parent._events.getWeekDaysData(Date.baseDate(dWeek), nDay, true),
            aCalendar,
            spanDayMore = el.children('span.daymore');
        if (el.data('events') == 0 || aEvents.length < 1) {
            if (spanDayMore.size() > 0) {
                spanDayMore.parent('.full_day').removeClass('full_day');
                spanDayMore.remove();
            }
            return;
        }
        
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
            spanDayMore.appendTo(el);
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
                + '"' 
                + 'data-event="' + curEl.id + '" '
                + 'data-calendar="' + curEl.calendarid + '" '
                + 'title="' + curEl.getTitle().htmlspecialchars() + '" '
                + '>' 
                + '<span class="title color_' + curEl.className 
                    + (curEl.specColor != undefined && curEl.specColor != '' ? ' ' + self._parent._events.getEventColor(curEl.specColor) : '')
                + '">'
                + '<span class="text">' 
                    + self._parent._events.getBarLabelTime(curEl)
                    + (aCalendar.titleHTML !== true ? curEl.title.htmlspecialchars() : curEl.title)
                + '</span>'
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
                + (aEl.specColor != undefined && aEl.specColor != '' ? ' ' + self._parent._events.getEventColor(aEl.specColor) : '')
                + '">' 
                + ((aEl.allDay || aEl.dateStart < dCur ) 
                    ? 'All day' 
                    : aEl.dateStart.format(self._parent.options.format.hourTitle))
                + '</td>'
                + '<td>'
                + '<span class="title">' 
                + (oCalendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                + '</span>'
                + sDetailsHTML
                + '</td></tr>';
        }
        sHTML += '</tbody></table>';
        return sHTML;
    }
    
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
        for (; dWeek <= dEnd; dWeek.changeDate(7)) {
            
            tWeek = dWeek.getTime() / 1000;
            divWeek = self._month_scroll_div.children('div[data-week_time="' + tWeek + '"]');
            if (divWeek.size() < 1) {
                continue;
            } 
            divWeek.addClass('new_events');
            divBar = divWeek.children('.events').children('.new_event');
            var aParams = jQuery.extend({}, 
                {
                    "week" : tWeek, 
                    "addClass" : 'new_event' + (params.creating === true ? ' create_event' : ''), 
                    "title" : self._parent.getText('custom_create_new', 'Create new')
                }, 
                params
            );
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
        }
    }
    
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
            return oWeek;
        }
        
    }
    
    self._initEvents = function() {
        var sClickEvent = self._parent.eventNames.down;
        self._month_scroll_div  //'mousedown'
            .on(sClickEvent, 'span.more', function(evt) {
                var el = jQuery(this).parent();
                self._showFullDayMore(el);
                return false;
            })
            .on(sClickEvent, 'span.detail_day', function(evt){
                var el = jQuery(this).parent();
                self._parent.toggleMode('day', false, el.data('date'));
                return false;
            })
            .on(self._parent.eventNames.down, '.daymore > ._move', function(evt){
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
            .on(self._parent.eventNames.down, '.daymore ', function(evt){
                evt.stopPropagation();
                return true;
            });
                
        if (!self._parent.isMobile()) {
            var oMouseScroll = function(evt, delta) {
                var el = jQuery(evt.target);
                if (el.parents('.daymore').size() > 0) {
                    return;
                }
                self._checkScrollEvent(evt, delta);
            }
            var nTimer = null, 
                nResultDelta = 0, 
                tTime = null, 
                tStartTime = null,
                oTarget;
            self._month_scroll_div.on('mousewheel', function(evt, delta){
                oTarget = jQuery(evt.target);
                if (oTarget.is('.daymore') || oTarget.parents('.daymore').size() > 0) {
                    return true;
                }
                tTime = evt.timeStamp;
                if (tStartTime == null) {
                    tStartTime = tTime - 101;
                }
                delta = delta > 0 ? 1 : -1;
                nResultDelta += delta;
                if (tStartTime + 100 > tTime) {
                    return self._parent._cancelBubble(evt);
                }
                nResultDelta = nResultDelta > 10 ? 10 : nResultDelta;
                nResultDelta = nResultDelta < -10 ? -10 : nResultDelta;
                tStartTime = tTime;
                
                oMouseScroll(evt, nResultDelta);
                nResultDelta = 0;
                return self._parent._cancelBubble(evt);
            });
            
            if (self._scroll_div != null) {
                var nScrollTimer, 
                    fManualScroll = function(evt, nDirection){
                        nScrollTimer = setTimeout(function(){
                            oMouseScroll(evt, nDirection);
                            fManualScroll(evt, nDirection);
                        }, 100);
                };
                self._scroll_div.on(self._parent.eventNames.down, 'span', function(evt){
                    var nDirection = jQuery(evt.currentTarget).hasClass('_up') ? 2 : -2;
                    oMouseScroll(evt, nDirection);
                    fManualScroll(evt, nDirection);
                }).on(self._parent.eventNames.up, 'span', function(evt){
                    if (nScrollTimer != null) {
                        clearTimeout(nScrollTimer);
                    }
                });
            }
        } else {
            self._parent._prependQueue([function(){
                    var nInitScrollPos = 0, nTimeout = null;
                    self._month_day_detail_div.on('calongtouch', {
                        handle : {
                            "move" : true,
                            "longtouch" : false,
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
                                var aEls = self._month_scroll_div.find('li[data-date]'),
                                    oEl = aEls.filter('.full_day'),
                                    oNewEl = null;
                                if (oEl.size() > 0) {
                                    var nIdx = aEls.index(oEl);
                                    nIdx = nIdx + (evt.data.where ? 1 : -1);
                                    nIdx = (nIdx < 0 ? 0 : nIdx);
                                    nIdx = (nIdx > aEls.size() - 1 ? aEls.size() - 1 : nIdx);
                                    self._showFullDayMore(aEls.eq(nIdx));
                                } else {
                                    oEl = aEls.filter('.current');
                                    self._showFullDayMore(oEl);
                                }
                                break;
                        }
                    });
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.ca.touch.js');
                }
            ]);
            
        }
        if (self._parent.options._small) {
            self._parent._prependQueue([function(){
                    var nLocalTimer = null;
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
                                break;
                            case "zoom" :
                                if (evt.data.zoom) {
                                    self._parent.toggleMode('week');
                                } else {
                                    self._parent.toggleMode('custom');
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
                        if (self._parent.options.readonly.create !== false) {
                            self._initCreatingNewEvent();
                        }
                        self._initMovingEvent();
                    },
                    function(){
                        self._parent._initScripts('/plugin/jquery.simpleselect.js');
                    }

                ]);
            }
        }
    }
    
    self._checkScrollEvent = function(evt, delta, nToScroll) {
        var el = self._month_scroll_div,
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
        if (nToScroll) {
             nOldScrollHeight = self._month_scroll_div[0].scrollHeight;
        }
        while (dTmpDate.getTime() != dLast.getTime()) {
            dTmpDate.changeMonth(delta > 0 ? -1 : 1);
            self._buildRightGrid({"date" : dTmpDate, noScroll : true});
        }
        
        

        if (nToScroll == undefined) {
            
            var oldPos = el.scrollTop(),
                nNewPos = oldPos - delta * self._nScrollSpeed;
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
        }

    }
    
    
    self._touchScroll = function(el, evt, aDelta, sMode) {
        if (sMode != undefined && sMode == 'init') {
            self._touchData.aBasicScrollCoord = self._month_scroll_div.scrollTop();
            self._touchData.aBasicScrollHeight = self._month_scroll_div[0].scrollHeight;
            self._touchData.nCurrentDeltaPos = self._touchData.aBasicScrollCoord;
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
                self._touchData.aBasicScrollCoord += nNewScrollHeight - self._touchData.aBasicScrollHeight;
                self._touchData.nCurrentDeltaPos = self._touchData.aBasicScrollCoord - aDelta.y;
                self._touchData.aBasicScrollHeight = nNewScrollHeight;
            }
        } else {
            self._month_scroll_div.scrollTop(self._touchData.aBasicScrollCoord - aDelta.y);
        }
    }
    
    self._swipe = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > Math.abs(aDelta.y) && Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
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
        return {
            nCellWidth : aLiList.eq(1)[0].offsetWidth,
            nFirstCellWidth : nFirstCellWidth,
            aOffset : self._month_scroll_div.offset(),
            dt : dt.getTime()
        }
    }
    
    
    self._isCellChange = function(el, evt) {
        var aOld = {"week" : el.data('currentWeek'), "day" : el.data('currentDay')};
        var aNew = self._getWeekDay(evt);
        el.data({currentWeek : aNew.week , currentDay : aNew.day});
        return (aOld.week != aNew.week || aOld.day != aNew.day);
    }


    self._initCreatingNewEvent = function(){
        self._month_scroll_div.simpleSelect({
            "selector" : 'ul > li, div.events',
            "notselector" : '.evt, .more',
            "touchhold" : 1000,
            "touchradius" : 10,
            longClick : self._parent.getParam('longClick', false),
            "checkStart" : function(el, evt) {
                var aNew = self._getWeekDay(evt);
                if (aNew.x < 0) {
                    return false;
                }
                return true;
            },
            "start" : function(el, evt){
                var aNew = self._getWeekDay(evt);
                el.data({
                    currentWeek : aNew.week , 
                    currentDay : aNew.day, 
                    "startDate" : new Date(aNew.date * 1000),
                    "selecting" : evt.ctrlKey
                });
                if (evt.ctrlKey) {
                    self._showSelectingEvent({start : new Date(aNew.date * 1000), end : new Date(aNew.date * 1000)});
                } else {
                    self._showCreatingEvent({start : new Date(aNew.date * 1000), end : new Date(aNew.date * 1000), 'creating' : true});
                }
                return false;
            },
            "stop" : function(el, evt){
                if (el.data('selecting')) {
                    el.find('._ctrlSel').removeClass('_ctrlSel');
                    return false;
                }
                var dStart = el.data('startDate'),
                    aNew = self._getWeekDay(evt),
                    dEnd = Date.baseDate(aNew.date),
                    dWeekBegin = Date.baseDate(dStart),
                    dWeekEnd = Date.baseDate(dEnd, 7);
                dWeekBegin.resetFirstWeekDay(self._parent.params.startWeekDay);
                dWeekEnd.resetFirstWeekDay(self._parent.params.startWeekDay);
                self._parent.layout.showCreateEventForm({
                    "cid" : "",
                    "date" : {"start" : dStart, "stop" : dEnd},
                    "el" : null,
                    "onClose" : function(evt) {
                        self._clearCreatingEvent({min : dWeekBegin, max : dWeekEnd});
                    }, 
                    "onCancel" : function(evt) {
                        self._clearCreatingEvent({min : dWeekBegin, max : dWeekEnd});
                    }, 
                    "event" : evt,
                    "allDay" : true
                });
                return false;
            },
            "cancel" : function(el, evt){
                self._clearCreatingEvent();
            },
            "move" : function(el, evt){
                var aNew = self._getWeekDay(evt);
                if (el.data('selecting')) {
                    self._showSelectingEvent({start : el.data('startDate'), end : new Date(aNew.date * 1000)});
                } else {
                    self._showCreatingEvent({start : el.data('startDate'), end : new Date(aNew.date * 1000), 'creating' : true});
                }
                
                return false;
            },
            "check" : function(el, evt) {
                return self._isCellChange(el, evt);
            },
            "swipe" : function(el, evt, aDelta) {
                if (!self._parent.isMobile()) {
                    return false;
                }
                return self._swipe(el, evt, aDelta);
            },
            "scroll" : function(el, evt, aDelta, sMode) {
                self._touchScroll(el, evt, aDelta, sMode)
                
            },
            "swipeDelta" : {x : 100, y : 30}
            
        });
    }
    
    self._initMovingEvent = function() {
        var _barMove = function(el, evt) {
            var aNew = self._getWeekDay(evt),
                nChange = -el.data('baseDate').getDaysFrom(new Date(aNew.date * 1000)),
                dStart = el.data('resizeL') != false ? Date.baseDate(el.data('startDate'), nChange) : el.data('startDate'),
                dEnd = el.data('resizeL') != true ? Date.baseDate(el.data('endDate'), nChange) : el.data('endDate');
            el.find('div.evt[data-event="' + el.data('bar').data('event') + '"][data-calendar="' + el.data('bar').data('calendar') + '"]')
                .addClass('new_event')
                .parents('div[data-week_time]').addClass('new_events');
            self._showCreatingEvent({start : dStart, end : dEnd, title : el.data('bar').find('.text').text(), line : el.data('bar').data('l')});
            return false;
        }             
        
        self._month_scroll_div.simpleSelect({
            "selector" : 'div.events > div.evt',        // selector for start drag event
            "moveSelector" : 'div.events, ul > li',     // selector for continue drag event
            "notselector"   : ".non_e, .create_event",     // means that noneditbale event cannot be moved
            "touchhold" : 1000,             // minimum time that activate "touchhold" event
            "touchradius" : 10,             // maximum radius for moving finger 
            "clearStop" : true,             // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            longClick : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                var aNew = self._getWeekDay(evt), 
                    evtEl = jQuery(evt.currentTarget),
                    bResize = !evtEl.hasClass('non_r') && jQuery(evt.target).filter('span.l, span.r').size() > 0
                        ? jQuery(evt.target).filter('span.l').size() > 0
                        : null
                    ;
                
                el.data({
                    resizeL     : bResize , 
                    currentWeek : aNew.week , 
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
                self._month_scroll_div.find('.evt.sel[data-event]').each(function(){
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
                if (el.data('bar').data('event') != undefined)  {
                    var aNewEvtData = self._parent._events.getEvent(el.data('bar').data('event')), 
                    aTmp = {
                        min : Math.min(aNewEvtData.dateStart.getTime() / 1000, el.data('bar').data('start')),
                        max : Math.max(aNewEvtData.dateEnd.getTime() / 1000, el.data('bar').data('end'))
                    };                    
                    self._month_scroll_div.find('.evt.sel[data-event]').each(function(){
                        //var sId = jQuery(this).data('event');
                        aNewEvtData = self._parent._events.getEvent(jQuery(this).data('event'));
                        if (aNewEvtData != undefined)  {
                            aTmp.min = Math.min(
                                aTmp.min, 
                                aNewEvtData.dateStart.getTime() / 1000, 
                                jQuery(this).data('start')
                            );
                            aTmp.max = Math.max(
                                aTmp.max, 
                                (aNewEvtData.dateEnd != undefined 
                                    ? aNewEvtData.dateEnd.getTime()
                                    : aNewEvtData.dateStart.getTime()
                                )  / 1000,
                                jQuery(this).data('end')
                            );
                        }
                    });
                    if (el.data('noChange')) {
                        aTmp.noChange = true;
                    }
                    self._clearCreatingEvent(aTmp);
                } else {
                    self._clearCreatingEvent();
                }
                
            },
            "move" : function(el, evt) {
                var mMixed = _barMove(el, evt);
                return mMixed;
            },
            "check" : function(el, evt) {
                
                var bChange = self._isCellChange(el, evt);
                return bChange;
            },
            "swipe" : function(el, evt, aDelta) {
                if (!self._parent.isMobile()) {
                    return false;
                }
                return self._swipe(el, evt, aDelta);
            },
            "scroll" : function(el, evt, aDelta, sMode) {
                self._touchScroll(el, evt, aDelta, sMode)
            },
            "swipeDelta" : {x : 100, y : 30}
            

        });
        
        
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
    
    
    self._expand = function(bMode) {
        var aWeeks = self._month_scroll_div.children();
        if (bMode) {
            self._parent._dom.el.height('190mm');
            self._resize();
            var aPrintingWeeks = aWeeks.find('li.cur-month').parent().parent().addClass('_printing');
            if (aPrintingWeeks.size() < 6) {
                if (aPrintingWeeks.next().size() > 0) {
                    aPrintingWeeks.next().addClass('_printing');
                } else {
                    aPrintingWeeks.prev().addClass('_printing');
                }
            }
            aWeeks.not('._printing').addClass('_no_printing');
            
            var nHeight = self._month_scroll_div.height(),
                nWidth = self._month_scroll_div.width(),
                nHAdd = self._month_scroll_div[0].scrollHeight - nHeight,
                nWAdd = self._month_scroll_div[0].scrollWidth - nWidth;
            self._parent._dom.el
                .width(self._parent._dom.el.width() + nWAdd)
                .height(self._parent._dom.el.height() + nHAdd);
        } else {
            self._parent._dom.el.width('').height('');
            aWeeks.removeClass('_no_printing _printing');
            self._resize();
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
                }
                if (typeof(max) != 'undefined'){
                    aChangeCoords.left = Math.min(aChangeCoords.left, max.width - elParent.width()),
                    aChangeCoords.left = Math.max(aChangeCoords.left, max.left);
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
    
    jQuery.calendarAnything.appendView('month', view);
    
})();