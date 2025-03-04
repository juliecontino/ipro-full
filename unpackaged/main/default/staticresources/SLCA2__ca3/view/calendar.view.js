/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css        : '/css/calendar.css',
        _parent     : null,
        _div        : null,
        _dom        : {},
        _params     : {},
        _date       : new Date(),
        _baseDate   : new Date(),
        _structure  : {},
        _today      : new Date(),
        _aLiterals  : ['-', 'YESTERDAY', 'TODAY', 'TOMORROW', 'LAST_WEEK', 'THIS_WEEK', 'NEXT_WEEK',
            'LAST_MONTH', 'THIS_MONTH', 'NEXT_MONTH', 'LAST_90_DAYS', 'NEXT_90_DAYS',
            'THIS_QUARTER', 'LAST_QUARTER', 'NEXT_QUARTER', 'THIS_YEAR', 'LAST_YEAR', 
            'NEXT_YEAR', 'THIS_FISCAL_QUARTER', 'LAST_FISCAL_QUARTER', 'NEXT_FISCAL_QUARTER',
            'THIS_FISCAL_YEAR', 'LAST_FISCAL_YEAR', 'NEXT_FISCAL_YEAR'],
        _aLiteralText : []
    };
    
    var view = {};
    
    view.init = function(div, parent) {
        self._parent = parent;
        self._aLiteralText = self._parent.getText('calendar_literals');
        self._div = parent._dom.el;
        self._parent.loadCss(self._css, function() {
            self._parent.checkPopupVisiblility(self._dom.calendar);
        });
    }
    
    view.show = function(params) {
        self._show(params);
        self._dom.calendar.css({"left" : "", "right" : "", "top" : "", "bottom" : ""});
        if (params.default != undefined && params.default != null && typeof(params.default) == 'string') {
            params.default = JSON.parse(params.default);
        }
        self._params = params;
        
        self._dom.calendar.children('.sf_literals').val('-');
        if (params.value && self._aLiterals.indexOf(params.value) >= 0) {
            self._date.setTime(self._parent.options.current.getTime());
            self._dom.calendar.children('.sf_literals').val(params.value);
        } else {
            self._date.setTime(params.value ? params.value : self._parent.options.current.getTime())
            self._baseDate.setTime(self._date.getTime());
        }
        
        if (!self._parent.isMobile()) {
            self._buildDays();
        } else {
            self._dom.form.val(self._date.format('yyyy-mm-dd'));
            setTimeout(function(){
                self._dom.form.focus().trigger('touchend');
            }, 1000);
            
        }
        self._dom.calendar.removeClass('manual literals').children('.time').removeClass('on');
        if (self._params.el != undefined) {
            self._dom.calendar.addClass('manual');
        }
        self._dom.calendar.addClass('on');
        self._parent.checkPopupVisiblility(
            self._dom.calendar, 
            0,
            self._params != undefined ? self._params.el : undefined
        );
        setTimeout(function(){
            self._reInitEvents();
        }, 100);
        if (params.showTime){
            var divTime = self._dom.calendar.children('.time'),
                nHours = self._date.getHours(),
                nMinutes = self._date.getMinutes();
            if (params.value == 0 && params.default != undefined && params.default.h != undefined) {
                nHours = parseInt(params.default.h);
                if (nHours != params.default.h) {
                    nMinutes = parseInt(60 * (params.default.h - nHours));
                }
            }
            if (params.showAM === true) {
                divTime.children('select').val(nHours >= 12 ? 'pm' : 'am');
            }
            divTime.addClass('on');
            divTime.children('input[name="h"]')
                .attr('max', params.showAM === true ? '12' : 24)
                .val(params.showAM === true && nHours > 12 
                    ? nHours - 12 
                    : (params.showAM === true && nHours == 0 ? 12 : nHours)
                );
            divTime.children('input[name="i"]').val(nMinutes);
            divTime.toggleClass('_ampm', params.showAM === true);
        }
        if (params.showLiterals){
            self._dom.calendar.addClass('literals');
        }
    }
    
    view.close = function(){
        self._close();
    }
    
    self._show = function(params) {
        if (self._dom.calendar == undefined) {
            if (self._parent.isMobile()) {
                self._buildMobileHTML(params);
            } else {
                self._buildMainHTML(params);
            }
            self._initEvents();
        }
        
    }
    
    
    self._buildMobileHTML = function(params) {
         var sHTML = 
            '<div class=CA_calendar>'
                + '<div class=form>'
                + '<input type="' + (params.showTime != undefined ? "datetime" : "date") + '"'
                + ' value="" '
                + '>'
                + '<span data-mode=ok>' + self._parent.getText('menu_ok', 'Ok') + '</span>'
                + '<span data-mode=close>' + self._parent.getText('menu_cancel', 'Cancel') + '</span>'
                + '</div>'
            + '</div>';
        self._dom.calendar = jQuery(sHTML).appendTo(self._div);
        self._dom.form = self._dom.calendar.find('input');
    }
    
    self._buildMainHTML = function(params) {
//        console.log(params);
        var sHTML = 
            '<div class=CA_calendar>'
                + '<div class=header>'
                    + '<span data-mode=nav data-change="-12" class=ll></span>'
                    + '<span data-mode=nav data-change="-1" class=l></span>'
                    + '<span data-mode=nav data-change="1" class=r></span>'
                    + '<span data-mode=nav data-change="12" class=rr></span>'
                    + '<span class=month>'
                        + '<select name=month>' + self._calendarMonthes() + '</select>'
                        + '<select name=year>' + self._calendarYears()  + '</select>'
                    +'</span>'
                + '</div>'
                + '<div class=week>' + self._buildCalendarWeek() + '</div>'
                + '<div class=days>' + self._buildCalendarDays() + '</div>'
                + '<div class=footer>'
                    + '<span data-mode="today" title="' + self._parent.getText('calendar_today', 'Today') + '"></span>'
                    + '<span data-mode="okset" title="' + self._parent.getText('menu_ok', 'Ok') + '"></span>'
                    + '<span data-mode="close" title="' + self._parent.getText('close', 'Close') + '"></span>'
                + '</div>'
                + '<div class="time">'
                    + '<input type=number name=h min="0" max="23" step="1" title="' + self._parent.getText('calendar_hours', 'Hours') + '" placeholder="HH" maxlength="2">:'
                    + '<input type=number name=i min="0" max="59" step="1" title="' + self._parent.getText('calendar_minutes', 'Minutes') + '" placeholder="MM" maxlength="2">'
                    + '<select name=a><option value="am">' + self._parent.getText('calendar_am', 'AM') 
                    + '<option value="pm">' + self._parent.getText('calendar_pm', 'PM') + '</select>'
                + '</div>'
                + '<select class="sf_literals">' + self._buildLetters() + '</select>'
                + '<div class=hover></div>'
            + '</div>';
        self._dom.calendar = jQuery(sHTML).appendTo(self._div);
        self._dom.month = self._dom.calendar.find('.month > select[name="month"]');
        self._dom.year = self._dom.calendar.find('.month > select[name="year"]');
        self._dom.days = self._dom.calendar.children('.days');
        self._dom.hover = self._dom.calendar.children('.hover');
    }
    
    self._buildCalendarWeek = function() {
        var dDate = new Date(), sHTML = '', 
            aDays = self._parent.getText('weekDaysTwo', ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
        dDate.resetFirstWeekDay(self._parent.params.startWeekDay);
        for (var nI = 0; nI < 7; nI++) {
            sHTML += '<span>' + aDays[dDate.getDay()] + '</span>';
            dDate.changeDate(1);
        }
        return sHTML;
    }
    
    self._buildCalendarDays = function() {
        var sHTML = '';
        for (var nI = 0; nI < 42; nI++) {
            sHTML += '<a data-id=' + nI + '></a>';
        }
        return sHTML;
    }
    
    self._initEvents = function(wPopup) {
        self._dom.calendar.on('click touchstart', 'span[data-mode]', function(evt){
            var el = jQuery(this);
            switch(el.data('mode')) {
                case 'nav' :
                    self._date.changeMonth(parseInt(el.data('change')));
                    self._buildDays();
                    break;
                case 'close' :
                    self._close();
                    break;
                case 'okset' :
                    return self._setExternalDate(evt);
                    break;
                case 'ok' :
                    self._setReturnDate();
                    self._close();
                    return self._parent._cancelBubble(evt);
                    break;
                case 'today' :
                    self._date.setTime(self._today.getTime());
                    self._buildDays();
                    break;
            };
            if (self._parent.isMobile()) {
                return self._parent._cancelBubble(evt);
            }
        });
        if (self._dom.days != undefined) {
            self._dom.days.on('click touchstart', 'a', function(evt){
                return self._setExternalDate(evt);
            });
        }
        
        if (self._dom.year != undefined) {
            self._dom.year.on('change', function(){
                self._date.setYear(jQuery(this).val());
                self._buildDays();
            });
        }
        if (self._dom.month != undefined) {
            self._dom.month.on('change', function(){
                self._date.setMonth(jQuery(this).val());
                self._buildDays();
            });
        }
        self._dom.calendar.on('keyup', '.time > input', function(evt){
            if (evt.keyCode == 13) {
                return self._setExternalDate(evt);
            }
        }).on('change', '.sf_literals', function(evt) {
            var sDate = jQuery(evt.target).val();
            if (sDate == '-') {
                return;
            }
            if (self._params.select != undefined) {
                self._params.select(sDate);
            }
            self._close();
        });
    }
    
    self._buildLetters = function() {
        var sHTML = '';
            
        for (var nI = 0; nI < self._aLiterals.length; nI++) {
            sHTML += '<option value=' + self._aLiterals[nI] + '>' + self._aLiteralText[nI]
        }
        return sHTML;
    }
    
    self._reInitEvents = function() {
        jQuery(document).on(self._parent.eventNames.down + '.calendar', function(evt){
            if (jQuery(evt.target).filter('.CA_calendar').size() < 1
                && jQuery(evt.target).parents('.CA_calendar').size() < 1
            ) {
                self._close(evt);
            }
        });
        
        if (self._dom.form != undefined) {
            self._dom.form.one('blur change', function(evt){
                self._setReturnDate();
                self._close();
                return self._parent._cancelBubble(evt);
            });
        }
        if (self._params != undefined && self._params.el != undefined) {
            self._params.el.off('.CA').on('keyup.CA', function(evt){
                if (evt.keyCode == 13) {
                    self._params.el.off('.CA');
                    self._close();
                }
            });
        }
    }
    
    self._buildDays = function() {
        var dMonthDate = Date.baseDate(self._date);
        dMonthDate.setDate(1);
        var nStart = dMonthDate.getDay() - self._parent.params.startWeekDay;
        if (nStart < 0) {
            nStart = 7 + nStart;
        }
        var aA = self._dom.days.children(),
            nCurMonthDay = self._baseDate.getMonth() == dMonthDate.getMonth() 
                && self._baseDate.getFullYear() == dMonthDate.getFullYear() 
                ? self._baseDate.getDate()
                : -100,
            nTodayDay = self._today.getMonth() == dMonthDate.getMonth() 
                && self._today.getFullYear() == dMonthDate.getFullYear() 
                ? self._today.getDate()
                : -100;
        aA.text('').addClass('off').removeClass('current today');
        for (var nI = nStart; nI < dMonthDate.getMonthDays() + nStart; nI++) {
            aA.eq(nI).text(nI - nStart + 1)
                .removeClass('off')
                .addClass(
                    (nI + 1 == nStart + nCurMonthDay ? 'current ' : '')
                    + 
                    (nI + 1 == nStart + nTodayDay ? 'today' : '')
                );
        }
        self._dom.month.val(dMonthDate.getMonth());
        self._dom.year.val(dMonthDate.getFullYear());
        
        self._dom.days.data('start', nStart);
    }
    
    self._close = function(evt) {
        if (self._params.el != undefined) {
            self._dom.calendar.css('top', '').css('left', '');
        } else if (self._dom.hover != undefined) {
            self._dom.hover.removeClass('on');
        }
        self._dom.calendar.removeClass('on');
        jQuery(document).off(self._parent.eventNames.down + '.calendar');
    }
    
    self._calendarMonthes = function() {
        var sHTML = '';
        for (var nI = 0; nI < 12; nI++) {
            sHTML += '<option value="' + nI + '" ' 
                + (self._date.getMonth() == nI ? "selected" : "") 
                + '>' + self._parent.text.month[nI];
        }
        return sHTML;
    }
    
    self._calendarYears = function() {
        var sHTML = '';
        for (var nI = 1900; nI < 2100; nI++) {
            sHTML += '<option value="' + nI + '" ' 
                + (self._date.getFullYear() == nI ? "selected" : "") 
                + '>' + nI;
        }
        return sHTML;
    }
    
    self._setReturnDate = function() {
        var dDate = self._dom.form != undefined 
            ? Date.baseDate(self._dom.form.val().replace(/-/g, '/'))
            : new Date(self._date);
        if (dDate == null || dDate == undefined || !dDate.isValid()) {
            dDate = Date.baseDate(self._parent.options.today);
        }
        if (self._params.select != undefined) {
            self._params.select(dDate);
        }
    }
    
    self._setExternalDate = function(evt) {
        var dDate = new Date(self._date);
//        console.log('== ' + dDate);
        if (self._params.showTime) {
            var divTime = self._dom.calendar.children('.time');
            var nHour = parseInt(divTime.children('input[name="h"]').val());
            if (self._params.showAM === true) {
                if (nHour >= 12) {
                    nHour -= 12;
                }
                if (divTime.children('select').val() == 'pm') {
                    nHour += 12;
                }
            }
            dDate.setHours(nHour);
            dDate.setMinutes(divTime.children('input[name="i"]').val());
            dDate.setSeconds(0);
            dDate.setMilliseconds(0);
        }
//        console.log('== ' + dDate);
        if (jQuery(evt.target).parent().hasClass('days')) {
            dDate.setDate(jQuery(evt.target).text());
        }
//        console.log('== ' + dDate);
        if (self._params.select != undefined) {
            self._params.select(dDate);
        }
        self._close();
        if (self._parent.isMobile()) {
            return self._parent._cancelBubble(evt);
        }        
    }
    
    jQuery.calendarAnything.appendView('calendar', view);
    
})();
