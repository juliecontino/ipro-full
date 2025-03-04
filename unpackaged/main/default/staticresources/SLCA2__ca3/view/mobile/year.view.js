/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/mobile/year.css',
        _parent     : null,
        _div        : null,
        _period     : {min : new Date(), max : new Date()},
        _nBlockHeight : 1,
        _nPeriodMulti : 0,
        _eventsData : [],
        _aYears     : [],
        _dom        : {},
        _firstTime  : true,
        _scrolling  : false,
        _visibleHeight : 0
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
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('year');
            self._dom.scroll = jQuery('<div class="_scroll scroll_pos_negative_r"></div>').appendTo(self._div);
            if (self._visibleHeight == 0) {
                self._visibleHeight = self._div.height();
            }
            self._initEvents();
            self._firstTime = true;
        }
        var mYears = [];
        for (var nI = self._period.min.getFullYear() - 5; nI < self._period.min.getFullYear() + 5; nI++) {
            mYears.push(nI);
        }
        self._buildRightGrid(mYears);
        self._setYear(self._period.min.getFullYear());
        
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
        self._visibleHeight = self._div.height();

//        self._cacheCoords = undefined;
    }
    
    /** 
    * @public showData
    *
    * Public method, view data on grid
    *
    */
    
    view.showData = function(aParams) {
        if (typeof(aParams) == 'undefined' || aParams.date == undefined) {
            return;
        }
        self._setYear(aParams.date.getFullYear());
    }
    
    /**
     * @public getTitle
     * @return string formated title
     **/
    
    
    view.getTitle = function(){
        return self._parent.options.current.format('yyyy');
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
        } else {
            aOptions.current.setFullYear(aOptions.current.getFullYear() + mDirection);
        }
        aOptions.current.setHours(0, 0, 0, 0);
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = Date.baseDate(aOptions.current);
        }
        aOptions.min.setFullYear(aOptions.min.getFullYear(), 0, 1);
        self._period.max.setFullYear(aOptions.min.getFullYear() + 1, 0, 1);
        self._period.min.setTime(aOptions.min.getTime());
    }

    view.preparePrint = function(bMode) {
    }
    
    view.clearView = function() {
        self._div = null;
        self._dom.scroll = undefined;
    }



    view.getClickDate = function(oEvt) {
        return {
            "date" : Date.baseDate(self._period.min),
            "hourly" : false
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
        self._dom.scroll.on('click', 'div[data-d]', function(evt){
            var oEl = jQuery(evt.currentTarget),
                dD = Date.baseDate(self._period.min).changeMonth(oEl.data('d'));
            dD.setFullYear(oEl.parent().data('year'));
            self._parent.toggleMode('mobile/month', false, dD);
            
        });
        var nTimer, tStartTime = 0, tCurTime = 0;
        self._dom.scroll.on('scroll', function(evt){
            if (self._scrolling) {
                if (nTimer) {
                    clearTimeout(nTimer);
                };
                return;
            }
            tCurTime = Date.getTimeStamp();
            if (tStartTime == 0) {
                tStartTime = tCurTime;
            }
            if (nTimer && tCurTime < tStartTime + 100) {
                clearTimeout(nTimer);
                nTimer = null;
                nTimer = setTimeout(function(){
                    tStartTime = 0;
                    self._checkScrolling(evt);
                }, 200);
                
            } else if (!nTimer) {
                nTimer = setTimeout(function(){
                    tStartTime = 0;
                    self._checkScrolling(evt);
                }, 200);
            }
        });
    }
    
    self._buildRightGrid = function(mYears) {
        if (typeof(mYears) == 'number') {
            mYears = [mYears];
        }
        if (self._aYears.indexOf(mYears[0]) >= 0) {
            return;
        }
        console.log()
        self._scrolling = true;
        var dStart = Date.baseDate(self._period.min),
            sHTML = '',
            nStart, nMonthDays,
            nI, nJ, nTemp,
            nYear = mYears[0],
            dTodayYear = self._parent.options.now.getFullYear(),
            dTodayMonth = null, dTodayDay;
        for (nTemp = 0; nTemp < mYears.length; nTemp++) {
            self._aYears.push(mYears[nTemp]);
            sHTML += '<div class="_year" data-year="' + mYears[nTemp] + '">'
            dStart.setFullYear(mYears[nTemp], 0, 1);
            if (mYears[nTemp] == dTodayYear) {
                dTodayMonth = self._parent.options.now.getMonth(),
                dTodayDay = self._parent.options.now.getDate()
            }
            for (nI = 0; nI < 12; nI++) {
                nMonthDays = dStart.getMonthDays();
                nStart = dStart.getDay();
                nStart = nStart == 0 ? 7 : nStart;
                sHTML += '<div data-d="' + nI + '" class="_month">'
                    + '<span>' + dStart.format(self._parent.options.format.monthTitle) 
    //                + ' / ' + nStart + ' / ' + nMonthDays 
                    + '</span>';
                for (nJ = 1; nJ < nStart; nJ++) {
                    sHTML += '<b></b>';
                }
                for (nJ = 1; nJ <= nMonthDays; nJ++) {
                    sHTML += '<b>' + nJ + '</b>';
                }
                sHTML += '</div>';
                dStart.changeDate(nMonthDays);
            }
            sHTML += '</div>';
        }
        var aYears = self._dom.scroll.children(),
            oBody = jQuery(sHTML);
        if (aYears.size() > 0) {
            if (aYears.eq(0).data('year') > nYear) {
                self._dom.scroll.prepend(oBody);
            } else if (aYears.eq(aYears.size() - 1).data('year') < nYear) {
                self._dom.scroll.append(oBody);
            } else {
                var nCur = 0;
                aYears.each(function(nIdx, oEl){
                    oEl = jQuery(oEl);
                    if (nCur < nYear && nYear > oEl.data('year')) {
                        oBody.insertAfter(oEl);
                        return false;
                    }
                    nCur = oEl.data('year');
                });
            }
        } else {
            self._dom.scroll.html(oBody);
        }
        
        setTimeout(function(){
            self._scrolling = false;
        }, 50);
        if (dTodayMonth != null) {
            self._dom.scroll.children('[data-year="' + dTodayYear + '"]')
                .children('[data-d="' + dTodayMonth + '"]')
                .children("b:contains('" + dTodayDay + "')")
                .addClass('_cur');
        }
         
    }
    
    self._checkScrolling = function(evt){
        if (self._visibleHeight == 0) {
            self._visibleHeight = self._dom.scroll.height();
        }
        var nTop = self._dom.scroll[0].scrollTop,
            nScrollHeight = self._dom.scroll[0].scrollHeight,
            nCurrentYear;
        
        if (nTop < self._visibleHeight * 3) {
            nCurrentYear = self._dom.scroll.children().eq(0).data('year');
            self._buildRightGrid([nCurrentYear - 5, nCurrentYear - 4, nCurrentYear - 3, nCurrentYear - 2, nCurrentYear - 1]);
            self._scrolling = true;
            self._dom.scroll[0].scrollTop = (nTop + 5 * self._visibleHeight);
            self._scrolling = false;
        }
        if (nTop >= nScrollHeight - self._visibleHeight * 4) {
            nCurrentYear = self._dom.scroll.children().last().data('year');
            self._buildRightGrid([nCurrentYear + 1, nCurrentYear + 2, nCurrentYear + 3, nCurrentYear + 4, nCurrentYear + 5]);
        }
    }
    
    self._setYear = function(nYear) {
        if (self._aYears.indexOf(nYear) < 0) {
            self._buildRightGrid(nYear);
        }
        var oEl = self._dom.scroll.children('[data-year="' + nYear + '"]'),
            nIdx = self._dom.scroll.children().index(oEl);
        if (nIdx >= 0) {
            setTimeout(function(){
                self._scrolling = true;
                self._dom.scroll[0].scrollTop = (self._visibleHeight * nIdx);
                self._scrolling = false;
            }, 30);
        }
        
    }
    
    
    jQuery.calendarAnything.appendView('mobile/year', view);
})();