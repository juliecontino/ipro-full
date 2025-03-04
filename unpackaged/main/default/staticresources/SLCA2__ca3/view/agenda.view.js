/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/agenda.css',
        _parent     : null,
        _div        : null,
        _period     : {min : new Date(), max : new Date()},
        _nBlockHeight : 1,
        _nPeriodMulti : 0,
        _eventsData : [],
        _aMaxBottomLines : [],
        _dom : {},
        _firstTime : true,
        _customScroll : false,
        _customScrollTimer : null,
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

        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('agenda');
            self._buildRightAgendaGrid();
            self._initEvents();
        }
        if (sMode !== 'reshow') {
            self._firstTime = true;
            view.changeCurrentPeriod(self._parent.options, 0);
            self._div.addClass('show');
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
    view.resize = function(){
        self._cacheCoords = undefined;
    }
    
    /** 
    * @public showData
    *
    * Public method, view data on grid
    *
    */
    
    view.showData = function(aParams) {
        var dMax = Date.baseDate(self._period.max).changeMonth(1);
        dMax.setHours(23, 59, 0, 0);
        aParams = aParams || {};
        aParams.calendars = self._parent.layout.getActiveCalendars();
        aParams.min = new Date(self._period.min);
        aParams.max = dMax;
        self._parent._events.getData(aParams, function(data){
            self._buildRightAgendaData(data);
            if (aParams == undefined || aParams.nearPeriod !== true) {
                if (self._firstTime) {
                    setTimeout(function(){
                        self._setVisibleMonth(aParams != undefined ? aParams.date : undefined);
                    }, 50);
                } else {
                    self._setVisibleMonth(aParams != undefined ? aParams.date : undefined);
                }
            }
            self._firstTime = false;
        });
    }
    
    /**
     * @public getTitle
     * @return string formated title
     **/
    
    
    view.getTitle = function(){
        return self._parent.options.current.format(self._parent.options.format['monthTitle']);
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
        } else if (mDirection !== 0) {
            aOptions.current.setMonth(aOptions.current.getMonth() + mDirection);
        }
        aOptions.current.setHours(0, 0, 0, 0);
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date();
        }
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = new Date();
        } 
        aOptions.min.setTime(aOptions.current.getTime());
        aOptions.min.setDate(1);
        aOptions.max.setTime(aOptions.min);
        aOptions.max.changeMonth(1);
        self._period.min.setTime(aOptions.min);
        self._period.max.setTime(aOptions.max);
        
//        console.log('change period to ' + self._period.min + ' / ' + self._period.max);
    }

    view.delEvent = function(mEventId) {
        var dDate = self._getVisibleMonth(true);
        mEventId = typeof(mEventId) == 'string' ? [mEventId] : mEventId;
        self._dom.agenda.find('.evt[data-event="' 
            + mEventId.join('"], .evt[data-event="')
            + '"]').remove();
        self._setVisibleMonth(dDate);
    }

    view.preparePrint = function(bMode) {
        self._expand(bMode);
    }
    
    view.clearView = function() {
        self._dom.agenda = null;
        self._div = null;
        self._dom._scroll_div = null;
    }




    view.getClickDate = function(oEvt) {
        var oEl = jQuery(oEvt.target);
        if (!oEl.hasClass('detail_day')) {
            oEl = oEl.parents('.detail_day');
        }
        
        if (oEl.size() > 0) {
            return {
                "date" : Date.baseDate(oEl.data('date')),
                "hourly" : false
            }
        } else {
            return {
                "date" : new Date(),
                "hourly" : false
            }
        }
    }
    
    view.areaMenu = function(oArea) {
        var sHTML = '<div data-action=daydetails>'
            + self._parent.getText('agd_go_to_day_view', 'Go to Day View')
            + '</div>'
            + '<div data-action=selectday>'
            + self._parent.getText('agd_select_day_events', 'Select day events')
            + '</div>'
            + '<div data-action=selectmonth>'
            + self._parent.getText('agd_select_month_events', 'Select month events')
            + '</div>'
            + '<div data-action=hideempty>' 
            + (oArea.hasClass('_hide_empty') 
                ? self._parent.getText('agd_show', 'Show')
                : self._parent.getText('agd_hide', 'Hide')
            ) 
            + self._parent.getText('agd_empty_days', 'Empty Days')
            + ' </div>'
            ;
        return sHTML;
    }
    
    view.areaMenuAction = function(sAction, oEl, oEvt) {
        var aDate = view.getClickDate(oEvt), oDataDiv = null, bSelected = null;
        switch (sAction) {
            case 'daydetails' : 
                self._parent.toggleMode('day', false, aDate.date.getTime() / 1000);
                break;
            case 'selectday' :
                oDataDiv = jQuery(oEvt.target).next();
            case 'selectmonth' :
                var sId, sCalendar;
                oDataDiv = oDataDiv == null ? jQuery(oEvt.target).parent('div[data-month]') : oDataDiv,
                oDataDiv.find('.evt').each(function(nIdx, oEl){
                    oEl = jQuery(oEl);
                    bSelected = bSelected == null ? !oEl.hasClass('sel') : bSelected;
                    sId = oEl.data('event');
                    sCalendar = oEl.data('calendar');
                    self._dom.agenda
                        .find('.evt[data-event="' + sId + '"][data-calendar="' + sCalendar + '"]')
                            .toggleClass('sel', bSelected);
                });
                    
                break;
            case 'hideempty' :
                self._dom.agenda.toggleClass('_hide_empty');
                var bShowEmpty = self._dom.agenda.hasClass('_hide_empty');
                setTimeout(function(){
                    self._setVisibleMonth();
                }, 50);
                
////                if (bShowEmpty) {
//                    self._setVisibleMonth();
////                }
                break;
        }
        self._parent.hidePopup();
    }
    
    view.beforeHide = function(sNewMode) {
    }

    /**
     * @private _initEvents
     * Init default events for whole week view
     * @return void
     **/
    
    self._initEvents = function() {
        var nTimer = null, nOldPos, nStartTime = null;
        self._dom.agenda.on('scroll', function(evt){
            if (self._customScroll) {
//                console.log('scroll return ' + self._dom.agenda[0].scrollTop);
                return self._parent._cancelBubble(evt);
            }
            
            nOldPos = nOldPos == null ? self._dom.agenda[0].scrollTop : nOldPos;
//            console.log('scroll ' + self._dom.agenda[0].scrollTop);
            var tNow = Date.getTimeStamp();
            if (nStartTime == null) {
                nStartTime = tNow;
            }
            if (nTimer != null && nStartTime + 200 > tNow ) {
                clearTimeout(nTimer);
            } else if (nTimer != null) {
                return self._parent._cancelBubble(evt);
            }
            nTimer = setTimeout(function(){
                nStartTime = null;
                self._checkMonthPosition(self._dom.agenda[0].scrollTop - nOldPos);
                
                nTimer = null;
                nOldPos = null;
            }, 200);
            return self._parent._cancelBubble(evt);
        });
        
        if (self._dom._scroll_div != undefined && self._dom._scroll_div != null) {
            var nScrollTimer, 
                fManualScroll = function(evt, nDirection){
                    nScrollTimer = setTimeout(function(){
                        self._dom.agenda[0].scrollTop += nDirection;
                        fManualScroll(evt, nDirection);
                    }, 100);
            };
            self._dom._scroll_div.on(self._parent.eventNames.down, 'span', function(evt){
                var nDirection = jQuery(evt.currentTarget).hasClass('_up') ? -40 : 40;
                self._dom.agenda[0].scrollTop += nDirection;
                fManualScroll(evt, nDirection);
            }).on(self._parent.eventNames.up, 'span', function(evt){
                if (nScrollTimer != null) {
                    clearTimeout(nScrollTimer);
                }
            });
        }
        
        self._dom.agenda.on(self._parent.eventNames.click, '.detail_day', function(evt){
            var oEl = jQuery(evt.target);
            oEl.next().toggleClass('_close');
        });
        
        if (self._parent.options._small) {
            self._parent._prependQueue(
                [function(){
                    self._dom.agenda.on('calongtouch', {
                        handle : {
                            "move" : false,
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
                                self._parent.layout.changePeriod(evt.data.where ? -1 : 1 );
                                break;
                            case 'longtouch' : 
                                self._parent.layout.showAreaSubmenu(jQuery(evt.currentTarget), evt);
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
        }
    }
    
    /**
     * @private _buildRightAgendaGrid
     * Draw grid
     **/
    
    
    self._buildRightAgendaGrid = function() {
        if (self._dom.agenda != undefined && self._dom.agenda != null) {
            return;
        }
        var sHTML = '<div class="data scroll_pos_negative_r scroll_pad_r events"></div>';
        self._dom.agenda = jQuery(sHTML).appendTo(self._div);
        if (self._parent.params.showScrollButtons === true) {
            self._div.append('<div class=_scroll_panel><span class=_up><a></a></span>'
                        + '<span class=_down><a></a></span></div>');
            self._dom._scroll_div = self._div.children('._scroll_panel');
        }
        if (self._parent.params.agendaEmptyDays === false) {
            self._dom.agenda.addClass('_hide_empty');
        }
        
    }
    
    self._filterAllDay = function(aData, bAllDay, dCompare)  {
        bAllDay = bAllDay === undefined ? false : bAllDay;
        var aTmp = [].concat(aData);
        
        aTmp = aTmp.filter(function(el){
            return (bAllDay && (el.allDay || el.dateStart < dCompare))
                || (!bAllDay && el.dateStart >= dCompare && (!el.allDay || el.allDay == undefined));
        });
        aTmp.quickSort("dateStart");
        return aTmp;
    }
    
    self._buildRightAgendaData = function(aData, dBaseMin) {
        dBaseMin = dBaseMin || self._period.min;
        var dBaseMax,
            aDayData = [], 
            aAllData,
            aHourlyData = [],
            dCur, dWeek = new Date(),
            sHTML,
            bFirst = self._dom.agenda[0].innerHTML == '',
            bFirstScroll = bFirst,
            dVisibleMonth = self._getVisibleMonth();
        self._stopScroll(true);
        for (var nI = -1; nI  < 2; nI++) {
            var dRealBase = Date.baseDate(dBaseMin).changeMonth(nI);
//            console.log('' + dRealBase);
            dCur = Date.baseDate(dRealBase);
            dBaseMax = Date.baseDate(dRealBase).changeMonth(1);
            
            sHTML = '<div data-month="' + (dCur.getTime() / 1000) + '" '
                + ' class="_agenda_month_' + (dCur.getTime() / 1000) + '">';
            for (; dCur < dBaseMax; dCur.changeDate(1)) {
                dWeek.setTime(dCur.getTime());
                dWeek.resetFirstWeekDay(self._parent.params.startWeekDay);
                
                aAllData = self._parent._events.getWeekDaysData(dWeek, dCur.getDay());
                aDayData = self._filterAllDay(aAllData, true, dCur)
                    .concat(self._filterAllDay(aAllData, false, dCur));

                sHTML += self._buildAgendaBars(dCur, aDayData);
            }
            sHTML += '</div>';    
            if (bFirst) {
//                console.log('bFirst ' + dRealBase);
                self._dom.agenda[0].innerHTML = sHTML;
                bFirst = false;
            } else {
                var oMonth = self._dom.agenda.children('[data-month="' + (dRealBase.getTime() / 1000)  + '"]'),
                    dMin = Date.baseDate(self._dom.agenda.children(':first').data('month')),
                    dMax = Date.baseDate(self._dom.agenda.children(':last').data('month')),
                    oFindMonth,
                    nTop = self._dom.agenda[0].scrollTop,
                    nOldHeight = self._dom.agenda[0].scrollHeight;

                dCur.setTime(dRealBase);
//                console.log('' + dCur, ' min ' + dMin, 'max ' + dMax, 'Top ' + nTop, 
//                  nOldHeight, dVisibleMonth, ' size of HTML ' + sHTML.length);
                if (oMonth.size() > 0) {
                    oMonth[0].outerHTML = sHTML;
                } else if (dMin > dCur) {
                    self._dom.agenda[0].innerHTML = sHTML + self._dom.agenda[0].innerHTML;
                } else if (dCur > dMax){
                    self._dom.agenda[0].innerHTML += sHTML;
                } else {
                    for (; dMin < dMax && dMin < dCur; dMin.changeMonth(1)) {
                        oFindMonth = self._dom.agenda.children('[data-month="' + (dMin.getTime() / 1000)  + '"]');
                        oMonth = oFindMonth.size() > 0 ? jQuery(oFindMonth[0]) : oMonth;
                    }
                    jQuery(sHTML).insertAfter(oMonth);
                }
//                );
                if (!bFirstScroll && (dVisibleMonth == undefined || dVisibleMonth >= dRealBase)) {
                    
                    var dAdded = self._dom.agenda[0].scrollHeight - nOldHeight;
                    self._dom.agenda.scrollTop(nTop + dAdded);
                }
            }
            
        }
        self._stopScroll(false);
    }

    self._buildAgendaBars = function(dCur, aData) {
        var aEl, nJ,
            sDetailsHTML = '', oCalendar, aDetails,
            sHTML = '<div class="detail_day ' + (aData.length < 1 ? "_empty" : "") + '" '
                + ' data-date="' + (dCur.getTime() / 1000) + '">'
                + dCur.format('eeee') + ', '
                + dCur.format(self._parent.options.format.fullDate)
                + '</div>'
                + '<div ' + (aData.length < 1 ? "class='_empty'" : "") + '>'
                + '<table><tbody>';
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
                + '<td '
                + ' title="' + aEl.getTitle().htmlspecialchars() + '"'
                + ' class="color_' + aEl.className 
                + (aEl.specColor != undefined && aEl.specColor != '' ? ' ' 
                    + self._parent._events.getEventColor(aEl.specColor) : ''
                )
                + '">' 
                + ((aEl.allDay || aEl.dateStart < dCur ) 
                    ? 'All day' 
                    : aEl.dateStart.format(self._parent.options.format.hourTitle))
                + '</td>'
                + '<td'
                + (aEl.specColor != undefined && aEl.specColor.indexOf('_spec_reccuring') >= 0 
                    ? ' class="_spec_reccuring" ' 
                    : ''
                )
                + '>'
                + '<span class="title">' 
                + (oCalendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                + '</span>'
                + sDetailsHTML
                + '</td></tr>';
        }
        sHTML += '</tbody></table></div>';
        return sHTML;
    }
    
    self._getVisibleMonth = function(bDay){
        bDay = bDay || false;
        if (self._dom.agenda.children().size() == 0) {
            return;
        }
        var nTop = self._dom.agenda.scrollTop(),
            oFound, oFoundDay;
        self._dom.agenda.children().each(function(nIdx, oEl){
//            console.log(oEl);
            if (oEl.offsetTop > nTop) {
                return false;
            }
            oFound = oEl;
        });
        if (bDay) {
            jQuery(oFound).children('.detail_day').each(function(nIdx, oEl){
                if (oEl.offsetTop > nTop) {
                    return false;
                }
                oFoundDay = oEl;
            });
            if (oFoundDay != undefined) {
                return Date.baseDate(jQuery(oFoundDay).data('date'));
            }
        }
        return oFound != undefined ? Date.baseDate(jQuery(oFound).data('month')) : undefined;
    }
    
    self._setVisibleMonth = function(dMonth) {
        dMonth = dMonth || self._parent.options.current;
        var dFirstMonthDay = dMonth.getDate() != 1 ? Date.baseDate(dMonth, 1 - dMonth.getDate()) : dMonth,
            oEl = self._dom.agenda.children('[data-month="' + (dFirstMonthDay.getTime() / 1000) + '"]'),
            oDay;
            //bShowEmpty = self._dom.agenda.hasClass('_hide_empty');
//        console.log('=== oEl ', oEl, oEl[0].offsetTop, dMonth);
        if (oEl.size() == 0) {
            return;
        }
        if (dMonth.getDate() != 1) {
            oDay = oEl.children('[data-date="' + (dMonth.getTime() / 1000) + '"]');
            if (oDay.hasClass('_empty') && oDay[0].offsetTop == 0) {
                oDay = oDay.nextAll('.detail_day:not(._empty)').eq(0);
                if (oDay.size() < 1) {
                    oDay = undefined;
                }
            }
        }
        self._stopScroll(true);
//        self._dom.agenda.scrollTop(oEl[0].offsetTop + (oDay != undefined ? oDay[0].offsetTop : 0));
        self._dom.agenda.scrollTop(oDay != undefined ? oDay[0].offsetTop : oEl[0].offsetTop);
        self._stopScroll(false);
    }
    
    self._checkMonthPosition = function(nWhere) {
        var dMonth = self._getVisibleMonth();
//        console.log(' ' + dMonth , ' ' + self._period.min 
//                + ' /' + self._dom.agenda.scrollTop()
//                + '/ ' + (self._dom.agenda.height() + 400)
//                + ' / ' + self._dom.agenda[0].scrollHeight );
        if (self._parent._currentModeName != 'agenda') {
            return;
        }
        if (dMonth != undefined && dMonth.getMonth() != self._period.min.getMonth()) {
            if (dMonth < self._period.min) {
                //dMonth.setTime(self._period.min);
                //dMonth.changeMonth(-1);
            } else {
                //dMonth.setTime(self._period.min);
                //dMonth.changeMonth(1);
            }
            self._parent.layout.reChangePeriod(dMonth.getTime() / 1000);
        } else if (dMonth == undefined) {
            if (nWhere < 0) {
                var dNew = Date.baseDate(self._period.min).changeMonth(-1);
                self._parent.layout.reChangePeriod(dNew.getTime() / 1000);
            }
        } else if (self._dom.agenda.scrollTop() + self._dom.agenda.height() > self._dom.agenda[0].scrollHeight - 500) {
            var dNew = Date.baseDate(self._period.min).changeMonth(1);
            self._parent.layout.reChangePeriod(dNew.getTime() / 1000);
        }
    }
    
    
    self._expand = function(bMode) {
        var aDivs = self._dom.agenda.children();
        if (self._parent.getParam('agendaPrintCurrentMonth', false)){
            var dMonth = new Date(self._parent.options.current);
            dMonth.setDate(1);
            dMonth.resetHours();
            aDivs.not('[data-month="' + (dMonth.getTime() / 1000) + '"]')
                .toggleClass('_hide_print', bMode);
        }
        
        if (bMode) {
            var nAdditionalHeight = 0;
            aDivs.each(function() {
                nAdditionalHeight += jQuery(this).height();
            });
            
            var nH = self._parent._dom.el.height(),
                nMax = nAdditionalHeight + 50 + self._parent._dom.el.find('.CA_h').height();
            if (nMax > nH) {
                self._parent._dom.el.height(nMax); //self._parent._dom.el.height() + 
            }
            self._stopScroll(true);
            self._dom.agenda.scrollTop(0);
            self._stopScroll(false);
        } else {
            self._parent._dom.el.height('');
//            aDivs.height('').children('.daily, .hourly')
//                .height('')
//                .css('top', '').css('bottom', '');
        }
    }
    
    self._stopScroll = function(sMode) {
        if (self._customScrollTimer != null) {
            clearTimeout(self._customScrollTimer);
            self._customScrollTimer = null;
        }
        if (sMode) {
            self._customScroll = true;
        } else {
            self._customScrollTimer = setTimeout(function(){
                self._customScroll = false;
            }, 200);
        }
    }
    
    jQuery.calendarAnything.appendView('agenda', view);
})();