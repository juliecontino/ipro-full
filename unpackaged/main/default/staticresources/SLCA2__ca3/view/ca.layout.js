/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/jq-calendar-anything.css',
        _parent     : null,
        _dom        : {},
        _nMaxLineCss : 0,
        "_calendarTypes" : {},
        "_eventHeight" : {
            "small" : 17,
            "middle" : 20,
            "large" : 23
        },
        _nNotifyTimer : null,
        _tChangePeriod : null,
        _aColorCSS     : {},
    };
    var layout = {};

    /** 
    * public init
    *
    * Init all necessary data
    */

    layout.init = function (parent){
        self._parent = parent;
        self._parent.loadCss(self._css);
        self._dom.el = self._parent._dom.el;
        self._setText();
        self._parent._prependQueue([
            self._init,
            function(){
                self._initHourlyCSS(true);
            },
            self._calculateData,
            self._parent._calendars.load,
            self._parseUrl
        ]);
        setTimeout(self._setRecalculator, 300000);
    }
    
    /** 
    * @public show
    * draw grid
    * @return void;
    */
    
    
    layout.show = function(sMode) {
    }
    /** 
    * @public resize
    *
    * Clear offset cache when resize
    *
    */
    layout.resize = function(){
        
    }
    
    layout.print = function(bMode) {
    }
    
    layout.refreshCalendars = function(aData, aSort) {
        self._refreshCalendars(aData, aSort);
    }
    
    layout.initLinesCSS = function(nMaxLine) {
        return self._initLinesCSS(nMaxLine);
    }
    
    layout.initHourlyCSS = function(bFirst) {
        return self._initHourlyCSS(bFirst);
    }
    
    layout.getActiveCalendars = function(aParams) {
        return self._getActiveCalendars(aParams);
    }
    
    layout.getEventHeight = function(sSize) {
        sSize = sSize || self._parent.params.size;
        return self._eventHeight[sSize];
    }
    
    layout.changeCalendarColor = function(sCalendarId, sColor, sTpl) {
        
        self._parent._calendars.changeCalendarColor(sCalendarId, sColor, sTpl);
        var aCSS = {}, aTPL = {};
        aCSS[sCalendarId] = sColor;
        if (sTpl != undefined) {
            aTPL[sCalendarId] = sTpl;
            self._buildCalendarCSS(aCSS, undefined, aTPL);
        } else {
            self._buildCalendarCSS(aCSS);
        }
    }
    
    layout.showEventDetailUrl = function(nEventId, event) {
        return self._showEventDetailUrl(nEventId, event);
    }
    
    layout.showEventDetail = function(el, evt) {
        return self._showEventDetail(el, evt);
    }

    layout.refreshCalendarsInSettings = function(aCalendars, bMode) {
        return self._refreshCalendarsInSettings(aCalendars, bMode);
    }
    
    layout.clearPeriod = function(mCalendarId, dMin, dMax, bRelated) {
        self._parent._calendars.clearPeriod(mCalendarId, dMin, dMax, bRelated);
    }
    
    layout.delCalendar = function(sCalendarId) {
        return self._delCalendar(sCalendarId);
    }
    
    layout.removeCalendars = function(aCalendars) {
        return self._removeCalendars(aCalendars);
    }

    layout.toggleMode = function(sName, tBaseDate, nAttempt) {
        if (sName != self._parent._currentModeName) {
            return;
        }
        var div = self._getRightMode(sName);
        nAttempt = nAttempt == undefined ? 0 : nAttempt;
        if (nAttempt == 0) {
            self._dom.currentMode = div;
            self._dom.modeButtons.children().removeClass('sel').filter('[data-mode="' + sName + '"]').addClass('sel');
            self._dom.currentMode.parent().children().removeClass('show');
        }
        self._parent._initView(sName, function(){
            if (sName != self._parent._currentModeName) {
                layout.toggleMode(self._parent._currentModeName, tBaseDate, 1);
                return;
            }
            var oView = self._parent._getView();
            if (oView != null) {
                self._dom.right.removeClass('CA_ajax_loading');
                if (tBaseDate != undefined) {
                    
//                    console.log('' + Date.baseDate(tBaseDate), tBaseDate);
                    self._changePeriod(Date.baseDate(tBaseDate));
                } else {
                    oView.show('toggle');
                    self._setDayTitle(oView.getTitle());
                    oView.showData();
                }
            } else if (nAttempt < 5) {
                self._parent._addQueue(function(){
                    layout.toggleMode(sName, tBaseDate, nAttempt++);
                });
            }
        });
        return div;
    }
    
    layout.initInterface = function(){
        self._initInterface();
    }
    
    layout.showAreaSubmenu = function(areaEl, event) {
        return self._showAreaSubmenu(areaEl, event);
    }
    
    layout.showEventSubmenu = function(evtEl, event) {
        return self._showEventSubmenu(evtEl, event);
    }
    
    layout.showSettings = function(aParams) {
        return self._showSettings(aParams);
    }
    
    layout.showCalendarSubmenu = function(calendarEl, event) {
        return self._showCalendarSubmenu(calendarEl, event);
    }
    
    layout.showCalendarEditForm = function(sType, sCalendarId, bClone) {
        return self._showCalendarEditForm(sType, sCalendarId, bClone);
    }
    
    layout.showCalendarQuickFilter = function(sCalendarId, evt) {
        return self._showCalendarQuickFilter(sCalendarId, evt);
    }
    
    layout.manageCalendarsList = function(sType) {
        return self._manageCalendarsList(sType);
    }
    
    layout.changeVisibleCalendar = function(aEnableCalendars, aDisableCalendars, bMode) {
        return self._changeVisibleCalendar(aEnableCalendars, aDisableCalendars, bMode);
    }
    
    layout.showiCal = function(sCalendarId, evt){
        return self._showiCal(sCalendarId, evt);
    }
    
    layout.showCreateEventForm = function(params) {
        return self._showCreateEventForm(params);
    }
    
    layout.refreshEvents = function(params) {
        var oView = self._parent._getView();
        if (oView != null && oView.refresh != undefined) {
            oView.refresh(params);
        }
    }
    
    layout.clearView = function(){
        self._dom.right.html('');
    }
    
    layout.showNotify = function(text, bError, nTimeout){
        self._showNotify(text, bError, nTimeout);
    }
    
    layout.reChangePeriod = function(nTimeStamp) {
        return self._reChangePeriod(nTimeStamp);
    }
    
    layout.changePeriod = function(mDirection, params) {
        return self._changePeriod(mDirection, params);
    }
    
    layout.selectedCalendars = function(){
        return self._selectedCalendars()
    }
    
    layout.getCurrentModeDiv = function(sName){
        if (sName != undefined) {
            return self._getRightMode(sName);
        }
        return self._dom.currentMode;
    }
    
    layout.buildData = function(params){
        return self._buildData(params);
    }

    layout.toggleCalendar = function(mCalendarId, bOnlyEnabled) {
        return self._toggleCalendar(mCalendarId, bOnlyEnabled);
    }
    
    layout.buildCalendarCSS = function(css, aSpecialCSS, aTpl, aSpecialTpl) {
        return self._buildCalendarCSS(css, aSpecialCSS, aTpl, aSpecialTpl);
    }

    layout.updateCalendarHTML = function(aCalendar) {
        var domCalendar = self._dom.left.find('div[data-type="' + aCalendar.calendarType + '"] div[data-calendar="' + aCalendar.id + '"]');
        if (domCalendar.size() < 1) {
            return;
        }
        var bLock = domCalendar.hasClass('lock');
        domCalendar[0].outerHTML = self._getCalendarHTML(
            aCalendar, 
            {
                "selected" : domCalendar.hasClass('sel'),
                "lock"      : bLock
            }
        );
//        domCalendar = self._dom.left.find('div[data-type="' + aCalendar.calendarType + '"] div[data-calendar="' + aCalendar.id + '"]');
//        domCalendar.toggleClass('lock', bLock);
    }
    
    
    layout.activateOnlyVisualCalendar = function(mCalendarId, bMode) {
        var el;
        if (typeof(mCalendarId) == 'string') {
            mCalendarId = [mCalendarId];
        }
        for (var nI = 0; nI < mCalendarId.length; nI++) {
            el = self._dom.left.find('div[data-calendar="' + mCalendarId[nI] + '"]');
            if (el.size() < 1 || el.hasClass('lock') || el.hasClass('sel') == bMode) {
                continue;
            }
            el.toggleClass('sel', bMode);
        }
    }
    
    layout.delEvent = function(sEventId, sCalendarId) {
        /*
        if (self._parent.params.confirmDelete 
                && !confirm(
                    self._parent.getText('shure_to_delete', 'Are you sure you want to delete?')
                )
            ) {
            return;
            
            .........
            .........
        }
        */

        if (!self._parent.params.confirmDelete) {
            layout._delEvent(sEventId, sCalendarId);
        } else {
            self._showNotify(self._parent.getText('shure_to_delete', 'Are you sure you want to delete?'), 'confirm', function() {
                layout._delEvent(sEventId, sCalendarId);
            });
        }
    },
            
    layout._delEvent = function(sEventId, sCalendarId) {
        var sCurCalendar = sCalendarId,
            aEvents = [],
            oCal = self._parent._calendars.getCalendar(sCalendarId);
        if (oCal['delete'] !== false) {
            aEvents.push(sEventId);
        }
        self._dom.currentMode.find('.evt.sel[data-event]').each(function(){
            var el = jQuery(this),
                sId = el.data('event');
            sCalendarId = el.data('calendar');
            oCal = sCurCalendar != sCalendarId ? self._parent._calendars.getCalendar(sCalendarId) : oCal;
            if (aEvents.indexOf(sId) < 0 && oCal['delete'] !== false && oCal['editable'] !== false) {
                aEvents.push(sId);
            }
        });
        if (aEvents.length < 1) {
            return;
        }
        //console.log(aEvents);
        self._parent._events.delEvent(aEvents);
        var oView = self._parent._getView();
        if (self._parent.params.cacheTime == 0 || (oView != null && oView.delEvent == undefined)) {
            oView.showData();
        } else {
            if (oView != null && oView.delEvent != undefined) {
                oView.delEvent(aEvents);
            }
        }
    }
    
    layout.findEventBars = function(mId) {
        var aResult;
        if (typeof(mId) == 'string') {
            aResult = self._dom.right.children('.show').find('.evt[data-event="' + mId + '"]');
        }
        return aResult;
    }
    
    layout.checkAfterCreatePresent = function(mEventsId, mCalendarId, sNonPresentMessage) {
        //var selfLocal = this;
        mCalendarId = typeof(mCalendarId) == 'string' 
            ? [mCalendarId] 
            : (mCalendarId == undefined ? [''] : mCalendarId);
        mEventsId = typeof(mEventsId) == 'string' ? [mEventsId] : mEventsId;
        
        sNonPresentMessage = sNonPresentMessage 
            || 
            self._parent.getText(
                'message_event_will_not_be_displayed', 
                "Event will not be displayed due to filter settings or insufficient privileges"
            );
        var checkFunc = function(){
            for (var nI = 0; nI < mEventsId.length; nI++) {
                for (var nJ = 0; nJ < mCalendarId.length; nJ++) {
                    var aEl = layout.getCurrentModeDiv()
                        .find('.evt'
                            + '[data-event="' + mEventsId[nI] + '"]'
                            + (mCalendarId[nJ] != '' ? '[data-calendar="' + mCalendarId[nJ] + '"]' : '')
                        );
                    if (aEl.size() < 1) {
                        return false;
                    }
                }
            }
            return true;
        }
        if (!checkFunc()) {
            layout.showNotify(sNonPresentMessage, true);
        }
    }
    
    layout.lazyLoad = function() {
        setTimeout(function(){
            self._parent._addQueue([
                function(){
                    self._parent._initView('eventMenu');
                    self._parent._initView('calendarMenu');
                    self._parent._initView('areaMenu');
                    self._parent._initView('eventDetail');
                    if (self._parent.params.apiCache == 'lazy') {
                        self._parent._calendars.loadLazyObjects();
                    }
                }
            ]);
        }, 1000);        
    }
    
    layout.initExternalAPI = function() {
        return self._initExternalAPI();
    }
    
    layout.setCalendarFilter = function(sId, aRules, sRule, fFunc) {
        self._dom.left.find('div[data-calendar="' + sId + '"]')
            .toggleClass('filter', (aRules != undefined && aRules.length > 0));
        return self._parent._calendars.setCalendarFilter(sId, aRules, sRule, fFunc);
    }
    
    layout.pasteEvent = function(oArea, oEvt, fFalseFunc) {
        var oView = self._parent._getView(),
            oClickDate = oView.getClickDate(oEvt);
        if (oClickDate === false) {
            self._parent.hidePopup();
            return false;
        }
        var bResult = self._parent._events.pasteEvent(oClickDate, function(data){
            oView.refresh();
        });
        if (!bResult) {
            fFalseFunc();
        }
    }
    
    layout.showPrint = function() {
        return self._showPrint();
    }
    
    layout.updateDynamicValues = function(aFields) {
        var sSub;
        jQuery.each(aFields, function(sKey, aFields) {
            var jCalendar = self._dom.left.find('.list .calendar[data-calendar="' + sKey + '"]');
            if (jCalendar.size() < 1) {
                return;
            }
            
            jQuery.each(aFields, function(sField, aColors){
                sSub = '';
                var nJ = 0;
                jQuery.each(aColors, function(sItemId, sItemTitle){
                    sSub += '<b class=_sd_' + nJ + '>' + sItemTitle.htmlspecialchars() + '</b>';
                    nJ++;
                });
                if (sSub != '') {
                    var jDynamicField = jCalendar.find('._special_colors span[data-field="' + sField +'"]');
                    jDynamicField.find('._sub_dynamic').remove();
                    sSub = '<span class="_sub_dynamic">' + sSub + '</span>';
                    jCalendar.find('._special_colors span[data-field="' + sField +'"]').append(sSub);
                } else {
                    jCalendar.find('._special_colors span[data-field="' + sField +'"]').remove();
                }
            });
        });
        
    }
    
    layout.lockCalendars = function(aCalendars, bMode) {
        self._lockCalendars(aCalendars, bMode);
    }

    layout.lockGroup = function(aGroup, bMode, aCalendars) {
        self._lockGroup(aGroup, bMode, aCalendars);
    }
    
    layout.reInitUIEvents = function(){
        self._reInitHoverEvent();
    }
    
    layout.getCSSCOlor = function(){
        return self._restoreColor();
    }
    
    
    layout.refreshFiltersPanel = function(){
        self._refreshFiltersPanel();
    }
    
    layout.rememberColor = function(aSelector, aRules) {
        self._rememberColor(aSelector, aRules);
    }
    
    self._init = function() {
        self._dom.el.addClass('JQ_CA')
            .removeClass('CA_ajax_loading')
            .addClass(self._parent.params.size)
            .addClass('_event-style-' + self._parent.params.eventStyle)
            .addClass('_week-end-' + self._parent.params.showWeekEnds)
            .addClass('_hour-' + self._parent.params.minMinutePeriod)
            .addClass('_nonworking-' + self._parent.params.nonWorkingHoursDisplay)
            .addClass('_day_area_mode-' + self._parent.params.dayModeArea)
            .addClass(self._parent.params.noleft || self._parent._visibleElements.indexOf('left') >= 0 ? "_noleft" : "")
            .addClass(self._parent.params.maximize || self._parent._visibleElements.indexOf('top') >= 0 ? "_maximize" : "")
            .addClass(self._parent.params.gradient === 'on' ? "CA_gradient" : "")
            .addClass(self._parent.params.closeleft || self._parent._visibleElements.indexOf('lleft') >= 0? "_closeleft" : "")
            .addClass(self._parent.params.closehead || self._parent._visibleElements.indexOf('ttop') >= 0? "_closehead" : "")
            .addClass('_orient_' + self._parent.options._orient)
            ;
        self._dom.el.html("<div class=CA_h></div>"
            + "<div class='CA_l CA_ajax_loading'></div>"
            + "<div class='CA_r CA_ajax_loading' tabindex=10></div>"
            + (self._parent.isMobile()
                ? '<div class="CA_hide_menu"></div>'
                : ""
            )
        );
        self._dom.header = self._dom.el.find('div.CA_h');
        self._dom.left = self._dom.el.find('div.CA_l');
        self._dom.right = self._dom.el.find('div.CA_r');
        self._dom.hideMenu = self._dom.el.find('div.CA_hide_menu');
        self._buildHeader();
        self._buildLeft();
//        self._buildRight();
    }
    
    self._buildHeader = function() {
        var aVisible = self._parent._visibleElements;
        self._dom.header.append(
            (aVisible.indexOf('l_ds') < 0 ? ('<div class="title '
                + '"><span title="CalendarAnithing"></span>' 
                    + self._parent.getText('my_calendars', "My Calendars")
                + '</div>' ) : '')
            + '<div class="manage buttons">'
                + ('<span data-nav=today class="' 
                    + (self._parent._checkLayoutVisible('uiToday', 'l_t') ? '' : '_hide')
                + '">' +  self._parent.getText('calendar_today', "Today") + '</span>' 
            )
            + '</div>'
            + (
                '<div class="search ' 
                        + (self._parent._checkLayoutVisible('uiSearch') ? '' : '_hide') 
                    + '">'
                    + '<input placeholder="' + self._parent.getText('search', "Search") + '"/>'
//                    + '<span class="_str ' 
//                        + (self._parent._checkLayoutVisible('uiAdvancedSearch') ? '' : '_hide') 
//                    + '"></span>' 
                    + '<span class=_clear></span>'
                    + '<span class=_label>' + self._parent.getText('search', "Search")  + '</span>'
                + '</div>'
            )
            + '<div class="display buttons"><span data-mode=compact>'
                + self._parent.getText('compact', "Compact") 
                + '</span><span data-mode=display class=sel>'
                + self._parent.getText('full', "Full")  + '</span></div>'
            + '<div class="nav buttons">'
                + (aVisible.indexOf('l_p') < 0 ? ('<span data-nav=l '
                    + '><span></span></span>') : '')
                + (
                    (self._parent.isMobile()
                    ? "<input type=date id=CA_curdate>"
                        + '<label for=CA_curdate data-nav=day class="date_title ' 
                        +  (self._parent._checkLayoutVisible('uiCalendar', 'c_t')  ? '' : '_hide')
                        + '"></label>'
                    : '<span data-nav=day class="date_title ' 
                        +  (self._parent._checkLayoutVisible('uiCalendar', 'c_t')  ? '' : '_hide')
                        + '"></span>'
                    )
                )
                + (aVisible.indexOf('l_n') < 0 ? ('<span data-nav=r '
                    + '><span></span></span>') : '')
            + '</div>'
            + '<div class="mode buttons" tabindex="2">'
                + (aVisible.indexOf('r_d') < 0 ? ('<span data-mode=day ' 
                    + '>' + self._parent.getText('mode_day', "Day")  + '</span>') : '' )
                + (aVisible.indexOf('r_w') < 0 ? ('<span data-mode=week '
                    + '>' + self._parent.getText('mode_week', "Week")  + '</span>') : '' )
                + (aVisible.indexOf('r_m') < 0 ? ('<span data-mode=month '
                    + '>' + self._parent.getText('mode_month', "Month")  + '</span>') : "")
                + (aVisible.indexOf('r_c') < 0 ? ('<span data-mode=custom '
                    + '>' + self._parent.getText('mode_custom', "custom")  + '</span>') : '')
                + (aVisible.indexOf('r_a') < 0 ? ('<span data-mode=agenda '
                    + '>' + self._parent.getText('mode_agenda', "Agenda")  + '</span>') : '')
                + (aVisible.indexOf('r_g') < 0 ? ('<span data-mode=gantt '
                    + '>' + self._parent.getText('mode_gantt', "Gantt")  + '</span>') : '')
                + (aVisible.indexOf('r_s') < 0 ? ('<span data-mode=swimlane ' 
                    + '>' + self._parent.getText('mode_swimlane', "Swimlane")  + '</span>') : '' )
            + '</div>'
            + "<div class='notify'></div>"
        );
        self._dom.manageButtons = self._dom.header.children('div.manage');
        self._dom.displayButtons = self._dom.header.children('div.display');
        self._dom.navButtons = self._dom.header.children('div.nav');
        self._dom.modeButtons = self._dom.header.children('div.mode');
        self._dom.title = self._dom.header.children('div.title');
        self._dom.dateTitle = self._dom.header.find('.date_title');
        self._dom.notify = self._dom.header.find('div.notify');
        self._dom.search = self._dom.header.find('div.search');
        if (self._parent.options._emulateSmall !== true
            && (self._parent.options._small == false && self._parent.options._noSmallCheck !== true)
        ) {
            var bLightning = self._parent._dom.el.hasClass('CA_LIGHTNING')
                || self._parent._dom.el.parents('.CA_LIGHTNING').size() > 0
                || self._parent.getParam('layoutTheme', '') == 'lightning';

            if (!bLightning && self._dom.modeButtons.children(':visible').size() < 1) {
                self._dom.modeButtons.hide();
            }
            if (self._dom.navButtons.children(':visible').size() < 1) {
                self._dom.navButtons.hide();
            }
            if (self._dom.manageButtons.children(':visible').size() < 1) {
                self._dom.manageButtons.hide();
            }
        }
        
    }
    self._buildRight = function(){
        self._parent.toggleMode(self._parent.params.mode, true);
    },

    
    
    self._buildLeft = function(){
        self._dom.type = {};
        var sTitleText = self._parent.isMobile() 
            ? self._parent.getText('long_toych', 'Long touch')
            : self._parent.getText('right_click', 'Right click'),
            oClosedLeftBlocks = JSON.parse(self._parent.getLS('closedLeftBlocks', '{}'));
        self._refreshFiltersPanel();
        jQuery.each(self._calendarTypes, function(idx, el){
            if (self._parent._calendars.getPermission('Read', idx) == true) {
                self._dom.type[idx] = jQuery('<div data-type="' + idx + '" tabindex=1 '
                            + ' class="' + (oClosedLeftBlocks[idx] === true ? 'close' : '') + '" '
                            +  '>')
                    .append('<div class=title title="' + sTitleText + ' '
                        + self._parent.getText('for_more_options', 'for more options')
                        + ' "><span></span>' + el.title + '</div>'
                        + '<div class=list>'
                            + (self._parent._calendars.getPermission('Create', idx) == true
                                && self._parent._calendars.getPermission('Hide', idx) == true
                                ? '<div class="calendar_empty">' + el.empty + '</div>'
                                : ''
                            )
                        + '</div>')
                    .appendTo(self._dom.left);
            }
        });
        self._refreshCalendars(self._parent._calendars.getData());
        return;
    },


    self._refreshCalendars = function(aCalendars, aSort) {
        var aDOMList = {},
            nI, sStr,
            aCalendarCSS = {},
            aCalendarTpl = {},
            aSpecialTpl = {},
            aSpecialCalendarColors = {},
            aRealSort = aSort != undefined && aSort != null //&& aSort.length == aCalendars.length 
                ? aSort 
                : aCalendars,
            aSelected = false, aVisibled = false, aSelectedJSON = null,
            aUnSelected = false,
            mSelectedVal = 'default', sFriendly = null,
            bSiteVisible = false && self._parent._getUrlParam('site') == '1';
            
        if (self._parent.options.enabled != undefined && self._parent.options.enabled !== '') {
            aSelected = String.parseAsArray(self._parent.options.enabled, [true, 'enable']);
            var aUnSelected = String.parseAsArray(self._parent.options.enabled, [false]);
            if (typeof(self._parent.options.enabled) == 'string') {
                try {
                    aSelectedJSON = jQuery.parseJSON(self._parent.options.enabled);
                } catch (e){
                    aSelectedJSON = {};
                    var aTemp = self._parent.options.enabled.split(',');
                    for (nI = 0; nI < aTemp.length; nI++) {
                        if (aTemp[nI].trim() == '') {
                            continue;
                        }
                        aSelectedJSON[aTemp[nI].trim()] = true;
                    }
                    if (jQuery.isEmptyObject(aSelectedJSON)) {
                        aSelectedJSON = null;
                    }
                }
            }
            aVisibled = self._parent.options.calendarId === 'CA_ACCESSIBLE' 
                ? true
                : (self._parent.options.calendarId != undefined && self._parent.options.calendarId !== ''
                    ? String.parseAsArray(self._parent.options.calendarId, [true, 'enable'])
                    : false
                );
        } else if (self._parent.options.calendarId != undefined 
            && self._parent.options.calendarId !== ''
        ) {
            aSelected = self._parent.options.calendarId != 'CA_ACCESSIBLE'
                ? String.parseAsArray(self._parent.options.calendarId, [true, 'enable'])
                : [];
            aVisibled = self._parent.options.calendarId == 'CA_ACCESSIBLE'
                ? true
                : aSelected;
        }
        if (aVisibled.length !== undefined) {
            var aReordered = [], aCalendarIds = {}, aSelectedIds = [], aUnSelectedIds = [];
            for (nI = 0; nI < aRealSort.length; nI++) {
                var aCalendar = typeof(aRealSort[nI]) == 'string' 
                    ? self._parent._calendars.getCalendar(aRealSort[nI]) 
                    : aCalendars[nI];
                if (aCalendar == undefined) {
                    continue;
                }
                var nCalendarID = aCalendar.folder === true ? '_' + aCalendar.name : aCalendar.id,
                    nIdx = aVisibled.indexOf(nCalendarID);
                    
                //console.log(nIdx, aRealSort[nI]);
                nIdx = nIdx < 0 && aCalendar.friendlyName != undefined 
                    ? aVisibled.indexOf(aCalendar.friendlyName) 
                    : nIdx;
                if (nIdx >= 0){
                    aCalendarIds[nCalendarID] = aRealSort[nI];
                    aSelectedIds[nIdx] = nCalendarID;
                }  else {
                    aUnSelectedIds.push(aRealSort[nI]);
                }
            }
            for (nI = 0; nI < aSelectedIds.length; nI++) {
                if (aSelectedIds[nI] == undefined) {
                    continue;
                }
                aReordered.push(aCalendarIds[aSelectedIds[nI]]);
            }
            aReordered = aReordered.merge(aUnSelectedIds);
            aRealSort = aReordered;
        }
        for (nI = 0; nI < aRealSort.length; nI++) {
            var aCalendar = typeof(aRealSort[nI]) == 'string' 
                ? self._parent._calendars.getCalendar(aRealSort[nI]) 
                : aRealSort[nI] ,
                bVisible = null;
            mSelectedVal = null;
            if (aCalendar == undefined) {
                continue;
            }
            sFriendly = aCalendar.friendlyName != undefined ? aCalendar.friendlyName : null;
            if (aVisibled !== false){
                bVisible = aVisibled === true 
                || (aVisibled.length > 0 
                    && (aVisibled.indexOf(aCalendar.id) != -1 || aVisibled.indexOf(sFriendly) != -1)
                );
            }
            if (aUnSelected === true || (aUnSelected !== false && aUnSelected.length > 0)) {
                
                mSelectedVal = aUnSelected.indexOf(aCalendar.id) >= 0 || aUnSelected.indexOf(sFriendly) >= 0
                    || aUnSelected.indexOf('CA_ALL') >= 0 || aUnSelected.indexOf('CA_' + aCalendar.calendarType.toUpperCase()) >= 0
                    ? false
                    : null;
                
            } 
            if (aSelected === true || (aSelected !== false && aSelected.length > 0)) {
                mSelectedVal = aSelectedJSON == null 
                    || (
                        aSelectedJSON[aCalendar.id] == undefined && aSelectedJSON[sFriendly] == undefined
                        && !aSelectedJSON['CA_ALL'] && !aSelectedJSON['CA_' + aCalendar.calendarType.toUpperCase()]
                    )
                        ? mSelectedVal
                        : (aSelectedJSON[aCalendar.id] || aSelectedJSON[sFriendly] 
                                || aSelectedJSON['CA_' + aCalendar.calendarType.toUpperCase()]
                                || aSelectedJSON['CA_ALL'] || false
                        );
                if (aSelectedJSON == null) {
                    aCalendar.selected = aSelected === true
                        || aSelected.indexOf(aCalendar.id) != -1 
                        || aSelected.indexOf(sFriendly) != -1;
                } else if (mSelectedVal != null){
                    aCalendar.selected = [false, 'disable'].indexOf(mSelectedVal) >= 0
                        ? false
                        : ([true, 'enable'].indexOf(mSelectedVal) >= 0  ? true : aCalendar.selected);
                }
            } 
            if (aCalendar.color != undefined) {
                aCalendarCSS[aCalendar.id] = aCalendar.color;
            }
            if (aCalendar['settings'] != undefined 
                && aCalendar['settings']['color_tpl'] != undefined 
                && aCalendar['settings']['color_tpl'] > 0
            ) {
                aCalendarTpl[aCalendar.id] = aCalendar['settings']['color_tpl'];
            }
            
            if (aCalendar.specialColors != undefined && aCalendar.specialColors.length != undefined) {
                aSpecialCalendarColors[aCalendar.id] =  aCalendar.specialColors;
            }
            var domCalendar = self._dom.left
                .find('div[data-type="' + aCalendar.calendarType + '"]')
                    .find(aCalendar.folder !== true
                        ? 'div[data-calendar="' + aCalendar.id + '"]' 
                        : '[data-folder="' + aCalendar.name.htmlspecialchars() + '"]'
                    );

            if (domCalendar.size() < 1) {
                sStr = self._getCalendarHTML(
                    aCalendar, 
                    bVisible !== null || bSiteVisible 
                        ? {visible : bVisible || bSiteVisible } 
                        : {}
                );
            } else {
                domCalendar.toggleClass(
                    'hide', 
                    (bVisible !== null 
                        ? !bVisible
                        : !aCalendar.visible
                    )
                );
                domCalendar.removeClass('folder_hide _close');
                sStr = domCalendar[0].outerHTML;
                domCalendar.remove();
            }

            if (typeof(aDOMList[aCalendar.calendarType]) == 'undefined') {
                aDOMList[aCalendar.calendarType] = '';
            }
            aDOMList[aCalendar.calendarType] += sStr;
        }
        jQuery.each(aDOMList, function(sKey, sValue){
            self._dom.left.find('div[data-type="' + sKey + '"] > .list').find('[data-folder]').remove();
            self._dom.left.find('div[data-type="' + sKey + '"] > .list').append(sValue);
        });
        
        self._dom.left.children('[data-type="sf"], [data-type="web"], [data-type="group"]').each(function(){
            var oCalendarBlock = jQuery(this);
            oCalendarBlock
                .toggleClass(
                    'calendars_empty', 
                    oCalendarBlock.children('.list').children('.calendar:not(.hide)').size() < 1
                ).toggleClass(
                    '_off', 
                    self._parent.options.readonly.contextCalendar === false 
                    && oCalendarBlock.hasClass('calendars_empty')
                );
        });

        
        self._dom.left.removeClass('CA_ajax_loading');
        self._buildCalendarCSS(aCalendarCSS, aSpecialCalendarColors, aCalendarTpl, aSpecialTpl);
        
        var aGroupsToCheck = self._getActiveCalendars().group,
            aCalendarsToCheck = [];
        for (nI = 0; nI < aGroupsToCheck.length; nI++) {
            aCalendarsToCheck = aCalendarsToCheck.concat(self._parent._calendars.getCalendar(aGroupsToCheck[nI]).calendarsList);
        }
        if (aCalendarsToCheck.length > 0) {
            aCalendarsToCheck = aCalendarsToCheck.unique();
            self._dom.left
                .find('div[data-type] > div.list')
                    .children('div[data-calendar="' + aCalendarsToCheck.join('"], div[data-calendar="') + '"]')
                        .addClass('lock').removeClass('sel');
        }
        
        var aHiddenFolders = self._parent.getLS('closedFolders', '').split(','),
            aSFFolders = self._dom.left.find('div[data-type="sf"] > .list div.folder[data-folder]');
        for(var nF = 0; nF < aHiddenFolders.length; nF++) {
            if (aHiddenFolders[nF] == '') {
                continue;
            }
            var oFolder = aSFFolders.filter('[data-folder="' + aHiddenFolders[nF].htmlspecialchars() + '"]');
            if (oFolder.size() < 1) {
                continue;
            }
            oFolder.addClass('_close').nextUntil('.folder').addClass('folder_hide');
        }
        
    }
    
    
    self._getCalendarHTML = function(aCalendar, aParams) {
        aParams = jQuery.extend({}, aCalendar, aParams);
        var sTitle = '', 
            sColors = '',
            aTmp, 
            nI,
            bHidden = false,
            bShowColorFieldLabel = aCalendar['settings'] == undefined 
                || (aCalendar['settings']['hide_color_field_label'] == 0 || !aCalendar['settings']['hide_color_field_label']);
        
        
        if (aCalendar.folder === true && aCalendar.calendarType == 'sf') {
            var sHTML = '<div '
                + ' title="' + aParams.name.htmlspecialchars() + '"'
                + ' data-type="' + aParams.calendarType + '"'
                + ' data-folder="' + aParams.name.htmlspecialchars() + '"'
                + ' class="folder'
                + (typeof(aParams.visible) != 'undefined' && !aParams.visible ? 'hide' : '') 
                + '">'
                + '<span class=folder_sign></span>'
                + '<span class="name">' + aParams.name.htmlspecialchars() + '</span>'
                + '</div>';
            return sHTML;
        }
        
        if (aCalendar['calendarType'] == 'group') { 
            
            if (aCalendar['calendarsList'] == undefined) {
                aCalendar = self._parent._calendars.getCalendar(aCalendar['id']);
            }
            if (aCalendar['calendarsList'] != undefined) {
                for (nI = 0; nI < aCalendar['calendarsList'].length; nI++) {
                    aTmp = self._parent._calendars.getCalendar(aCalendar['calendarsList'][nI]);
                    if (aTmp != undefined) {
                        sTitle += (sTitle != '' ? '\n' : '') + aTmp['name'];
                    } else {
                        bHidden = true;
                    }
                }
                if (bHidden) {
                    sTitle += (sTitle != '' ? '\n+' : '') + 'Hidden calendars';
                }
            }
        } else if (aParams['calendarType'] == 'sf' && aParams['specialColors'] != undefined
//            && aParams['specialColorsFields'] != undefined && aParams['specialColorsFields'] != ''
        ) {
            var sSub = '', 
                bDynamic;
            
            for (nI = 0; nI < aParams['specialColors'].length; nI++) {
                
                aTmp = aParams['specialColors'][nI]; 
                bDynamic = ('' + aTmp['value']).indexOf('DYNAMIC') >= 0;
                sColors += '<span data-spec="' + nI + '" '
                    + (bDynamic ? ' data-field="' + aTmp['field'] + '"' : '')
                    + '>'
                    + '<a class="color_' + aParams.id 
                        + (!bDynamic ? ' _spec' + nI  : " _CA_hidden ")
                        + '"></a>'
                    + (bShowColorFieldLabel ? aTmp['label'].htmlspecialchars() : "")
                    + (sSub == '' && !bDynamic
                        ? (bShowColorFieldLabel ? ' - ' : "") + ('' + aTmp['text']).htmlspecialchars() 
                        : '')
                    + sSub
                    + '</span>';
            }
            if (sColors != '') {
                sColors = '<span class="_special_colors">' + sColors + '</span>';
            }
        }
        var sHTML = '<div data-calendar="' + aParams.id + '"'
                + ' title="' + sTitle.htmlspecialchars() + '"'
                + ' data-type="' + aParams.calendarType + '"'
                + ' class="' + (aParams.selected ? 'sel' : '') 
                    + (aParams.lock ? ' lock ' : '')
                    + ' calendar ' 
                    + (aParams.specialColors != undefined && aParams.specialColors != '' ? ' rainbow ' : '')
                    + (aParams.filters != undefined && aParams.filters.length > 0 ? ' filter ' : '')
                    + (typeof(aParams.visible) != 'undefined' && !aParams.visible ? 'hide' : '') + '">'
                + '<span class=checkbox></span>'
                + '<span class=str></span>'
                + '<span class="name">' + aParams.name.htmlspecialchars() + '</span>'
                + sColors
                + '</div>';
        return sHTML;
    }
    
    self._buildCalendarCSS = function(css, aSpecialCSS, aTpl, aSpecialTpl) {
        var aSelector = [], 
            aRules = [], 
            nI, sTPL = '';
            
        jQuery.each(css, function(idx, color) {
            color = (
                color.length == 6 
                && color.substring(0, 1) != '#' 
                    ? '#' 
                    : ''
                ) + color;
            aSelector.push(
                '.color_' + idx, 
                '.color_' + idx + ' a', 
                '.CA_l >  div > div.list > div[data-calendar="' + idx + '"].sel > span.checkbox',
                '.CA_l >  div > div.list > div[data-calendar="' + idx + '"].lock > span.checkbox'
            );
            sTPL = (aTpl != undefined && aTpl[idx] != undefined && aTpl[idx] > 0)
                ? ';background-image:url(' + self._parent.options.staticUrl + '/pic/tpl/tpl' + aTpl[idx] + '.png)'
                : ';background-image:none';
            aRules.push('background-color:' + color + '; color:#' + contrastingColor(color) + ' !important' + sTPL,
                'color:#' + contrastingColor(color) + ' !important',
                'background-color:' + color + sTPL,
                'background-color:' + color + sTPL
            );
            
            if (
                aSpecialCSS != undefined 
                && aSpecialCSS[idx] != undefined 
                && aSpecialCSS[idx].length > 0
            ) {
                for (nI = 0; nI < aSpecialCSS[idx].length; nI++) {
                    var sColor = typeof(aSpecialCSS[idx][nI]) == 'string' 
                        ? aSpecialCSS[idx][nI]
                        : aSpecialCSS[idx][nI].color;
                    if (sColor == undefined)  {
                        continue;
                    }
                    sColor = (
                        sColor.length == 6 
                        && sColor.substring(0, 1) != '#' 
                            ? '#' 
                            : ''
                        ) + sColor;
                    sTPL = aSpecialTpl != undefined && aSpecialTpl[idx] != undefined && aSpecialTpl[idx][nI] > 0 
                        ? ';background-image:url(' + self._parent.options.staticUrl + '/pic/tpl/tpl' + aSpecialTpl[idx][nI] + '.png)'
                        : (typeof(aSpecialCSS[idx][nI]) == 'string' || aSpecialCSS[idx][nI].tpl == undefined || aSpecialCSS[idx][nI].tpl < 1
                            ? 'background-image:none'
                            : ';background-image:url(' + self._parent.options.staticUrl + '/pic/tpl/tpl' + aSpecialCSS[idx][nI].tpl + '.png)'
                        );
                    aSelector.push('.color_' + idx + '._spec' + nI);
                    aSelector.push('.color_' + idx + '._spec' + nI + ' a');
                    aRules.push('background-color:' + sColor + '; color:#' 
                            + contrastingColor(sColor) + ' !important' + sTPL
                    );
                    aRules.push('color:#' + contrastingColor(sColor) + ' !important' + sTPL);
                    
                }
                
            }
        });
        self._rememberColor(aSelector, aRules);
        changeCssClass(aSelector, aRules , true);
    }
    
    
    self._initLinesCSS = function(nMaxLine){
        var self = this;
        if (jQuery.browser.msie) {
            nMaxLine = Math.min(nMaxLine, 200);
        }
        if (nMaxLine <= self._nMaxLineCss) {
            return;
        }
        var nSmallHeight = self._eventHeight['small'],
            nMiddleHeight = self._eventHeight['middle'],
            nLargeHeight = self._eventHeight['large'],
            aSelector = [], aRules = [],
            nI;
        
        for (nI = self._nMaxLineCss; nI <= nMaxLine; nI++) {
            aSelector.push('.JQ_CA > .CA_r   div.evt.l' + nI, '.JQ_CA.middle > .CA_r   div.evt.l' + nI, '.JQ_CA.large > .CA_r   div.evt.l' + nI);
            aRules.push('top:' + nI * nSmallHeight + 'px;', 'top:' + nI * nMiddleHeight + 'px;', 'top:' + nI * nLargeHeight + 'px;');
        }
        changeCssClass(aSelector, aRules, true);
        self._nMaxLineCss = nMaxLine;
    },
            
    self._initHourlyCSS = function(bFirst) {
//        console.time('hourly CSS');
        var nStartH, nLengthH,
            nHourStep = 60 / parseInt(self._parent.params.minMinutePeriod),
            aSelector = [], aRules = [], aRemove = [];
        self._parent.aCalculated.startHour = self._parent.params.nonWorkingHoursDisplay == 'hide' ? self._parent.params.startHourPeriod : 0;
        self._parent.aCalculated.stopHour = self._parent.params.nonWorkingHoursDisplay == 'hide' ? self._parent.params.stopHourPeriod : 24;
        for (var nI = 0; nI <= 24 * nHourStep; nI++) {
            nStartH = (nI - self._parent.aCalculated.startHour * nHourStep) * 30;
            nLengthH = (nI == 0 ? 1 : nI) * 30;
            if (nStartH < 0) {
                aSelector.push('.JQ_CA ul.hour_v_area li  div.events > div.evt.s' + nI + ' > span > span.title');
                aRules.push('padding-top:' + Math.abs(nStartH - 1) + 'px !important;');
            } else if (!bFirst) {
                aRemove.push('.JQ_CA ul.hour_v_area li  div.events > div.evt.s' + nI + ' > span > span.title');
                if (self._parent.options.anyIE) {
                    aRemove.push('.JQ_CA ul.hour_v_area li  div.events > div.s' + nI + '.evt > span > span.title');
                }
            }
            aSelector.push('.JQ_CA ul.hour_v_area li  div.events > div.evt.s' + nI);
            aRules.push('top:' + nStartH + 'px;');
            aSelector.push('.JQ_CA ul.hour_v_area li  div.events > div.evt.i' + nI);
            aRules.push('height:' + nLengthH + 'px;');
        }
        aSelector.push('.JQ_CA ul.hour_v_area li');
        aRules.push('height:' + (self._parent.aCalculated.stopHour - self._parent.aCalculated.startHour) * nHourStep * 30 + 'px;');
        
        
        aSelector.push('.JQ_CA ul.hour_v_area');
        if (self._parent.params.nonWorkingHoursDisplay == 'paint' 
                && (self._parent.params.startHourPeriod > 0 || self._parent.params.stopHourPeriod < 24)
        ) {
            var nTopLine = self._parent.params.startHourPeriod * nHourStep * 30;
            var nBottomLine = (24 - self._parent.params.stopHourPeriod) * nHourStep * 30;
            aRules.push('background-size: 100% ' + nTopLine + 'px, 100% ' + (nBottomLine > 0 ? nBottomLine  : 0) + 'px, auto auto');
        } else {
            aRules.push('background-size: 0 0, 0 0, auto auto');
        }
        // today current time line
        aSelector.push('.JQ_CA > .CA_r  .hour_v_area .current');
        var nTimePos = (Date.baseDate().getHours() - self._parent.aCalculated.startHour) * nHourStep * 30 
            + parseInt(Date.baseDate().getMinutes() * nHourStep / 2)
            + 1;
        aRules.push('background-position: 0 ' + nTimePos + 'px ');
        
        aSelector.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events > ._days._current');
        aRules.push('background-position: ' + parseInt(nTimePos / 30 * 100) + 'px 0');
        
        
        aSelector.push('.JQ_CA ul.hour_v_area .hours_title');
        aRules.push('background-position: 0 ' + (nTimePos - 2) + 'px, 0 0');
        
        
        changeCssClass(aSelector, aRules , bFirst);
        if (aRemove.length > 0) {
            removeCssClass(aRemove);
        }
        var nCurHour = Date.baseDate().getHours();

        if (nCurHour >= parseInt(self._parent.aCalculated.startHour)) {
            var nCellHeight = self._parent.params.minMinutePeriod != '15' 
                ? (self._parent.params.minMinutePeriod == '60' ? 30 : 60) 
                : 120;
            self._parent.options.scrollLine = (nCurHour - self._parent.aCalculated.startHour) * nCellHeight;
        }
        
        
        
        
//        console.timeEnd('hourly CSS');
    },    
            
            
            
    self._refreshFiltersPanel = function(){
        var oClosedLeftBlocks = JSON.parse(self._parent.getLS('closedLeftBlocks', '{}'));
        
        var aFilteringFields = self._parent._objects.getSpecialSettings('filteringFields', null, {parse : true}),
            aFilteringSets = self._parent._objects.getSpecialSettings('filteringSets', null, {parse : true}),
            aGlobalFilteringSets = self._parent._objects.getSpecialSettings('globalFilteringSets', null, {parse : true});
        if (self._parent.getParam('uiFilterSets') && self._dom.type['filtersets'] == undefined) {
            var sHTML = '<div data-type="filtersets" tabindex=1' 
                + ' class="' + (oClosedLeftBlocks['filtersets'] === true ? 'close' : '') + '">' 
                + '<div class=title title="Filter Sets"><span></span>Filter Sets</div>'
                + '<div class="_block_details filtersets"></div>'
                + '</div>'
            self._dom.type['filtersets'] = jQuery(sHTML);
            if (self._dom.type['filter'] != undefined) {
                self._dom.type['filtersets'].insertAfter(self._dom.type['filter']);
            } else if (self._dom.type['timezone'] != undefined) {
                self._dom.type['filtersets'].insertAfter(self._dom.type['timezone']);
            } else {
                self._dom.type['filtersets'].prependTo(self._dom.left);
            }
        } else if (self._dom.type['filtersets'] != undefined && !self._parent.getParam('uiFilterSets') ) {
            self._dom.type['filtersets'].remove();
            delete self._dom.type['filtersets'];
        }
        if (self._parent.getParam('uiFilter') 
//            && aFilteringFields != null 
//            && aFilteringFields.length > 0
            && self._dom.type['filter'] == undefined
        ) {
            var sHTML = '<div data-type="filter" tabindex=1 ' 
                + ' class="' + (oClosedLeftBlocks['filter'] === true ? 'close' : '') + '">' 
                + '</div>'
            self._dom.type['filter'] = jQuery(sHTML);
            if (self._dom.type['timezone'] != undefined) {
                self._dom.type['filter'].insertAfter(self._dom.type['timezone']);
            } else {
                self._dom.type['filter'].prependTo(self._dom.left);
            }
            
        } else if (self._dom.type['filter'] != undefined && !self._parent.getParam('uiFilter')) {
            self._dom.type['filter'].remove();
            delete self._dom.type['filter'];
        }
        
        if (self._parent.getParam('uiFilter') || self._parent.getParam('uiFilterSets')) {
            self._parent._prependQueue(function(){
                self._buildFilteringPanel(aFilteringFields, aFilteringSets, aGlobalFilteringSets);
            });
        }
        
        if (self._parent.getParam('displayTimeZone') && self._dom.type['timezone'] == undefined) {
            self._dom.type['timezone'] = jQuery('<div data-type="timezone" tabindex=1 '
                + ' class="' + (oClosedLeftBlocks['timezone'] === true ? 'close' : '') + '"></div>')
                .prependTo(self._dom.left);
            var sHTML = '<div class=title title="Timezone"><span></span>Timezone</div>'
                + '<div class="_block_details _timezone">'
                + ' <select><option value="-">Current';
            for (var nT = -12; nT <= 12; nT++) {
                sHTML += '<option value="' + (-60 * nT) + '">'
                    + (nT > 0 ? '+' : '-') + Math.abs(nT) + ':00 GMT';
            }
            sHTML += '</select></div>';
            self._dom.type['timezone'].html(sHTML).prependTo(self._dom.left);
            
            self._dom.type['timezone']
                .off('.CA_FILTERPANEL')
                .on('change.CA_FILTERPANEL', 'select', function(evt){
                    var sValue = jQuery(evt.target).val();
                    self._parent.aCalculated.timeZoneMinutes = (sValue != '-' ? parseInt(sValue) : sValue);
                    self._parent._events.clearEvents();
                    self._parent.clearView();
                });
        } else if (self._dom.type['timezone'] != undefined && !self._parent.getParam('displayTimeZone')) {
            self._dom.type['timezone'].remove();
            delete self._dom.type['timezone'];
            self._parent.aCalculated.timeZoneMinutes = '-';
            self._parent._events.clearEvents();
            self._parent.clearView();
        }
    }
                
            
            
    self._getActiveCalendars = function(aParams) {
        var aGroup = [], aCalendar = [], aWeb = [];
        if (aParams != undefined && aParams.id != undefined ){
            return self._dom.left.find('div.list > div.sel:not(.hide)[data-calendar="' + aParams.id + '"]').size() > 0
                ? [aParams.id]
                : [];
        }
        self._dom.left.find('[data-type="group"] > div.list > div.sel:not(.hide)').each(function(){
            aGroup.push(jQuery(this).data('calendar'));
        });
        self._dom.left.find('[data-type="sf"] > div.list > div.sel:not(.hide)').each(function(){
            aCalendar.push(jQuery(this).data('calendar'));
        });
        self._dom.left.find('[data-type="web"] > div.list >  div.sel:not(.hide)').each(function(){
            aWeb.push(jQuery(this).data('calendar'));
        });
        return {
            "group" : aGroup,
            "calendar" : aCalendar,
            "web" : aWeb
        };
    }
    
    self._showEventDetailUrl = function(nEventId, event) {
        var self = this, bGo = true;
        if (self._parent.options.readonly.detail !== false && self._parent.options.detailUrl != '0' && nEventId != undefined && nEventId != '') {
            self._parent.log('evt dblclick event');
            
            if (typeof(self._parent.options.func.eventDetail) == 'function') {
                bGo = self._parent.options.func.eventDetail(nEventId, event);
            }
            if (bGo !== false) {
                var aEvent = self._parent._events.getEvent(nEventId);
                var sUrl = (aEvent != undefined && aEvent.url != 'undefined') 
                    ? aEvent.url 
                    : "";
                if (self._parent.options.detailUrl != '') {
                    sUrl = decodeURIComponent(self._parent.options.detailUrl)
                        .replace('[id]', nEventId)
                        .replace(/id$/, nEventId);
                }
                if (sUrl != '') {
                    self._parent.openExternalUrl(sUrl);
//                    window.open(sUrl);
                }
            }
        }
        if (self._parent.options.tTimer != undefined) {
            clearTimeout(self._parent.options.tTimer);
        }
        self._parent.hidePopup();
        return self._parent._cancelBubble(event);
    }
    
    
    self._showPrint = function(sMode, aParams) {
        sMode = sMode || self._parent._currentModeName;
        if (!self._parent.getParam('printAsImage') && ['day', 'week', 'month', 'agenda', 'swimlane', 'gantt'].indexOf(sMode) >= 0) {
            self._parent._initView('print/' + sMode, function(){
                var oView = self._parent._getView('print/' + sMode);
                if (oView != undefined) {
                    oView.show(aParams);
                }
            });
            return;
        }
        
        
        var _generatePrintVersion = function() {
            var oView = self._parent._getView(),
                bIsLeft = self._dom.el.hasClass('_noleft'),
                dD = new Date();
            if (oView.preparePrint != undefined) {
                var bResult = oView.preparePrint(true);
                if (bResult === false) {
                    self._dom.el.removeClass('CA_loading');
                    return false;
                }
            }
            self._dom.el.addClass('CA_Print').removeClass('_noleft');
            
            self._dom.header.append('<div class=ca_print_logo>'
                + self._parent.getText('printed_on', 'Printed on ') 
                + dD.format('mm/dd/yyyy') 
                + self._parent.getText('printed_at', ' at ') 
                + dD.format('h:ii aa') + '</div>');
            
//            if (self._parent.options.ie 
////                    || 
////                (sMode == 'gantt' && self._parent.options.anyIE) // self._parent.params.ganttPrintOldSchool && 
//            ) {
//                self._dom.el.removeClass('CA_loading');
//                self._showIEPrint();
//                return;
//            }
            
            var oH2C = self._dom.el.html2canvas({
                flashcanvas: self._parent.options.staticUrl + "/plugin/flashcanvas.min.js",
                "onrendered" : function(canvas) {
//                    console.log(oH2C);
                    var img, 
                        divPritable = jQuery('<div id="CA_Print">'
                            + '<img src="">'
                            + '<div class="_printing_panel">'
                                + '<a data-action=print>' + self._parent.getText('print', 'Print')  + '</a>'
                                + '<a data-action=close>' + self._parent.getText('close', 'Close')  + '</a>'
                                + '<a data-action=save >' + self._parent.getText('save_as_image', 'Save as image')  + '</a>'
                            + '</div>'
                            + '<div class="_printing_bg"></div>'
                            + '</div>'
                        ), 
                        divPritableImage = jQuery('<img src="" id="ca_printable">');
                    setTimeout(function(){
                        img = canvas.toDataURL();
                        divPritable.find('img').attr('src', img);
                        divPritableImage.attr('src', img);
                    }, window.FlashCanvas != undefined ? 1000 : 100);
                    
                    jQuery('body')
                        .append(divPritable)
                        .append(divPritableImage);
                    self._dom.el.removeClass('CA_loading');
                    divPritable.on('click', 'a', function(){
                        var el = jQuery(this);
                        if (el.data('action') == 'close') {
                            divPritable.off('click', 'a');
                            divPritable.remove();
                            divPritableImage.remove();
                            if (oView.preparePrint != undefined) {
                                oView.preparePrint(false);
                            }
                            self._dom.el.removeClass('CA_Print')
                                .toggleClass('_noleft', bIsLeft);
                            self._dom.header.children('.ca_print_logo').remove();
                        }
                        else if (el.data('action') == 'print'){
                            window.print();
                        } else if (el.data('action') == 'save') {
//                            if (false && jQuery.browser.mozilla) {
//                                alert('Please right click on page and select "Save Image As"');
//                            }
//                            else 
                            if (!("download" in document.createElement("a"))) {
//                                    FIREFOX SOLUTION!
                                self._parent._request(
                                    {
                                        "jsRemote"  : true,
                                        post : true,
                                        "serverPath" : "event",
                                        data : {"img" : img},
                                        requestType : self._parent.options.serverEvent.printImg
                                    }, function(data) {
                                        var sImageUrl = data.url 
                                            || 
                                            (typeof(data.result) != 'undefined'
                                                ?  data.result.url 
                                                : ''
                                            );
                                        if (sImageUrl != '') {
                                            window.location.href = sImageUrl;
                                        } else {
                                            divPritable.find('a[data-action="close"]').click();
                                        }
                                    }
                                );
                            } else {
                                var aClick = jQuery('<a></a>'),
                                    d = new Date();
                                aClick.attr('href', img.replace('image/png', 'image/octet-stream'))
                                    .attr('download', 'print_CA_' + d.format('yyyymmdd_hhiiss') + '.png')
                                    .attr('type', 'image/octet-stream');
                                self._dom.el.append(aClick);
                                aClick[0].click();
                            }
                        }
                    });
                },
                timeout : 0,
//                logging : true,
                width : self._dom.right.width() + 250,
                height : self._dom.right.height() + 250,
                proxy : ''
            });
        }
        
        self._parent._prependQueue([
            function(){
                self._dom.el.addClass('CA_loading');
                setTimeout(function(){
                    _generatePrintVersion();
                    
                }, 1000);
            },
            function(){
                self._parent._initScripts('/plugin/html2canvas.min.js');
                self._parent._initScripts('/plugin/jquery.plugin.html2canvas.js');
                self._parent.loadCss('/css/print.css');
            }
        ]);
    }
    
    self._showIEPrint = function() {
        var self = this,
            oView = self._parent._getView(),
            bIsLeft = self._dom.el.hasClass('_noleft'),
            bIsMaximize = self._dom.el.hasClass('_maximize'),
            divPritable = jQuery('<div id="CA_Print" class="ie">'
                + '<div class="_printing_panel">'
                    + '<a data-action=print>' + self._parent.getText('print', 'Print')  + '</a>'
                    + '<a data-action=close>' + self._parent.getText('close', 'Close')  + '</a>'
                + '</div>'
                + '<div class="_printing_bg"></div>'
                + '</div>'
            ).appendTo('body')
            
            .on('click', 'a', function(){
                var el = jQuery(this);
                if (el.data('action') == 'close') {
                    divPritable.off('click', 'a');
                    divPritable.remove();
                    if (oView.preparePrint != undefined) {
                        oView.preparePrint(false);
                    }
                    self._dom.el.removeClass('CA_Print')
                        .toggleClass('_noleft', bIsLeft)
                        .toggleClass('_maximize', bIsMaximize);
                    self._dom.header.children('.ca_print_logo').remove();
                    self._dom.left.find('.calendar._no_printing').removeClass('_no_printing');
                    self._dom.left.find('.sel.calendar > .checkbox > ._ie_print_bar').remove();
                    self._dom.el.find('.evt >._ie_print_bar').remove();
                    jQuery('body').removeClass('_special_ie_print');
                } else if (el.data('action') == 'print'){
//                    jQuery('body').addClass('_special_ie_print');
                    window.print();
                }
            });
        jQuery('body').addClass('_special_ie_print');
        self._dom.el.find('.evt').children('span').each(function(){
            var el = jQuery(this),
                nW = parseInt(el.width() / 2),
                nH = parseInt(el.height() / 2),
                sHTML = '<span class="_ie_print_bar" style="'
                    + 'border-color:' + el.css('background-color') + ';'
                    + 'border-left-width:' + nW + 'px;'
                    + 'border-right-width:' + nW + 'px;'
                    + 'border-top-width:' + nH + 'px;'
                    + 'border-bottom-width:' + nH + 'px;'
                    + '"></span>';
            el.parent().append(jQuery(sHTML));
            el.children('.text, .title').css('color', el.css('color'));
        });
        
        self._dom.left.find('.sel.calendar > .checkbox').each(function(){
            var el = jQuery(this);
            el.append('<span class="_ie_print_bar" style="'
                + 'border-color:' + el.css('background-color') + ';'
                + '"></span>');
        });
        self._dom.left.find('.calendar').not('.sel').addClass('_no_printing');
        self._dom.el.addClass('_maximize');
    }
            
    self._refreshCalendarsInSettings = function(aCalendars, bMode) {
        var oView = self._parent._getView('calendarSettings');
        bMode = bMode == undefined ? true : bMode;
        if (oView != undefined) {
            oView.refreshSettingsCalendars(aCalendars, bMode);
        }
    }
    
    
    self._delCalendar = function(sCalendarId) {
        if (self._parent.options.calendarId != undefined  && self._parent.options.calendarId != ''){
            var oCalendar = self._parent._calendars.getCalendar(sCalendarId);
            if (self._parent.options.calendarId.indexOf(oCalendar.id) >= 0
                || self._parent.options.calendarId.indexOf(oCalendar.friendlyName) >= 0
            ) {
                //alert(self._parent.getText('message_calendar_preselected', 'This calendar is preselected and could not be deleted'));
                self._showNotify(self._parent.getText('message_calendar_preselected', 'This calendar is preselected and could not be deleted'), 'alert');
                return false;
            }
        }
        self._parent._calendars.delCalendar(sCalendarId, function(){
            self._toggleCalendar(sCalendarId, true);
            self._removeCalendars([sCalendarId]);
            var oView = self._parent._getView('calendarSettings');
            if (oView != null) {
                oView.removeCalendar(sCalendarId);
            }
        });
    }
    
    self._removeCalendars = function(aCalendars) {
        var oView = self._parent._getView('calendarSettings');
        for (var nI = 0; nI < aCalendars.length; nI++) {
            var el = self._dom.left.find('div[data-calendar="' + aCalendars[nI] + '"]');
            el.addClass('hide');
            if (oView != null) {
                oView.hideCalendar(aCalendars[nI], true);
            }
        }
    },
    
    self._toggleCalendar = function(mCalendarId, bOnlyEnabled) {
        var el, aDisableEnable = [], bGo = true;
        if (typeof(mCalendarId) == 'string') {
            mCalendarId = [mCalendarId];
        }
        for (var nI = 0; nI < mCalendarId.length; nI++) {
            el = self._dom.left.find('div[data-calendar="' + mCalendarId[nI] + '"]');
            if (el.size() < 1 || el.hasClass('lock') || (bOnlyEnabled != undefined && el.hasClass('sel') != bOnlyEnabled)) {
                continue;
            }
            bGo = true;
            if (self._parent._calendars.checkCalendarFunction(mCalendarId[nI], 'toggle')) {
                bGo = self._parent._calendars.runCalendarFunction(mCalendarId[nI], 'toggle', [!el.hasClass('sel')]);
            }
            else if (typeof(self._parent.options.func.calendarToggle) == 'function') {
                bGo = self._parent.options.func.calendarToggle(mCalendarId[nI], !el.hasClass('sel'));
            }
            if (bGo !== false) {
                el.toggleClass('sel');
                aDisableEnable.push(mCalendarId[nI]);
            }
        }
        if (aDisableEnable.length > 0) {
            self._disableEnableCalendar(aDisableEnable);
        }
    },
   
    self._disableEnableCalendar = function(mCalendarId, bDisableMode) {
        var aCalendar, el, bNeedRefresh = false, aChangeSelected = {}, nI;
            //= self._calendars.getCalendar(sCalendarId);
        if (typeof(mCalendarId) == 'string') {
            mCalendarId = [mCalendarId];
        }
        for (nI = 0; nI < mCalendarId.length; nI++) {
            el = self._dom.left.find('div[data-calendar="' + mCalendarId[nI] + '"]');
            bDisableMode = !el.hasClass('sel') || false;
            self._parent._events.setEvent(null, {"disable" : bDisableMode}, {"parentId" : mCalendarId[nI]});
//            console.log('set calendar ' + mCalendarId[nI] + '  to disable ' + bDisableMode);
            aCalendar = self._parent._calendars.getCalendar(mCalendarId[nI]);
            if (aCalendar.calendarType == 'group') {
                jQuery.extend(aChangeSelected, self._lockGroup(aCalendar, !bDisableMode));
            }
            aChangeSelected[mCalendarId[nI]] = !bDisableMode;
            bNeedRefresh = bDisableMode || bNeedRefresh;
        }
//        console.log('bNeedRefresh ' + bNeedRefresh);
        self._selectedCalendars(aChangeSelected);
        self._parent._events.refresh();
        self._parent._addQueue([
            [self._buildData, {
                "nearPeriod" : true, 
                "counter" : bNeedRefresh ? self._nEventLoading : self._nEventLoading++, 
                'disable' : bNeedRefresh
            }]       // bDisableMode  
        ]);

    }
   
    self._lockGroup = function(aGroup, bMode, aOtherCalendars) {
//        console.log(bMode);
        
        var aCalendars = aOtherCalendars == undefined ? aGroup.calendarsList : aOtherCalendars,  
            aToggledGroups = self._getActiveCalendars().group,
            nI;
        if (bMode === false) {
            for (nI = 0; nI < aToggledGroups.length; nI++) {
                aCalendars = aCalendars.diff(self._parent._calendars.getCalendar(aToggledGroups[nI]).calendarsList);
            }
        }
        return self._lockCalendars(aCalendars, bMode);
    }
    
    self._lockCalendars = function(aCalendars, bMode){
        var aChangeSelected = {};
        bMode = typeof(bMode) != 'undefined' ? bMode : true;
        aCalendars = jQuery.isArray(aCalendars) ? aCalendars : [aCalendars];
        if (jQuery.isArray(aCalendars)) {
            jQuery.each(aCalendars, function(idx, val) {
                if (val == null || val == '') {
                    return;
                }
                if (bMode) {
                    self._parent._events.setEvent(null, {"disable" : bMode}, {parentId : val});
                }
                self._dom.left
                    .find('div[data-type] > div.list > div[data-calendar="' + val + '"]')
                    .toggleClass('lock', bMode).removeClass('sel', !bMode);
                if ( bMode) {
                    aChangeSelected[val] = !bMode;
                }
                
            });
        }
        return aChangeSelected;
    }
    
    self._selectedCalendars = function(sCalendarId, bSelected) {
        if (typeof(localStorage)  == 'undefined' ){
            return {};
        }
        var aSelected  = {};
        try  {
            aSelected = localStorage.CA_CalendarsSelected ? jQuery.parseJSON(localStorage.CA_CalendarsSelected) : {};
        } catch (e) {
            
        }
        
        if (sCalendarId == undefined) {
            return aSelected;
        }
        if (typeof(bSelected) == 'undefined' && typeof(sCalendarId) == 'object') { 
            
            jQuery.extend(aSelected, sCalendarId);
        } else {
            aSelected[sCalendarId] = bSelected;
        }
        try {
            localStorage.CA_CalendarsSelected = JSON.stringify(aSelected);
        } catch (e) {}
        
    }
    
    self._getRightMode = function(sName) {
        var oDiv = self._dom.right.children('div[data-mode="' + sName + '"]');
        
        if (oDiv.size() < 1) {
            self._dom.right.addClass('CA_ajax_loading');
            oDiv = jQuery('<div data-mode="' + sName + '" class="_mode-' + sName + '">');
            self._dom.right.append(oDiv);
        }
        return oDiv;
    }
    
    
    self._changePeriod = function(mDirection, params) {
        params = params || {};
        params.date   = new Date(self._parent.options.current);
//        console.time('load data ');
        if (typeof(mDirection) == 'number') {
            self._parent._initView(self._parent._currentModeName, function(){
                var oView = self._parent._getView();
                if (oView != null) {
                    oView.changeCurrentPeriod(self._parent.options, mDirection);
                    
                    if (mDirection != 0) {
//                        console.log('-- ' , params);
                        params.date.setTime(self._parent.options.current.getTime());
                        oView.reShow(params);
                        self._setDayTitle(oView.getTitle());
                    }
                    if (params['refreshTitle'] != undefined) {
                        self._setDayTitle(oView.getTitle());
                    }
                    
                }
            });
        } else if(mDirection instanceof Date) {
            self._parent._initView(self._parent._currentModeName, function(){
                var oView = self._parent._getView();
                if (oView != null) {
                    oView.changeCurrentPeriod(self._parent.options, mDirection);
                    params.date = new Date(self._parent.options.current);
                  if (mDirection != 0) {
                        oView.reShow(params);
                        self._setDayTitle(oView.getTitle());
                        params.date.setTime(self._parent.options.current.getTime());
                    }
                    
                }
            });
        }
        
        if (mDirection != 0) {
            if (self._parent.params.loadLastPeriod == true) {
                if (self._tChangePeriod != null) {
                    clearTimeout(self._tChangePeriod);
                }
                self._tChangePeriod = setTimeout(function(){
                    self._parent._addQueue([
                        [self._buildData, params]
                    ]);
                    self._tChangePeriod = null;
                }, 200);
            } else {
                self._parent._addQueue([
                    [self._buildData, params]
                ]);
            }
            
        }
        
    }
    
    self._reChangePeriod = function(nTimeStamp) {
        var oView = self._parent._getView();
        if (oView != null) {
            oView.changeCurrentPeriod(self._parent.options, new Date(nTimeStamp * 1000));
            self._setDayTitle(oView.getTitle());
            self._parent._addQueue([
                [self._buildData, {"date" : new Date(self._parent.options.current), "nearPeriod" : true}]
            ]);
        }
    }
    
    
    self._calculateData = function(bReinit){
        bReinit = false || bReinit;
        self._parent.options.now = new Date();
        var nCurHour = self._parent.options.now.getHours();
        self._parent.options.now.setHours(0, 0, 0, 0);
        if (self._parent.options.current == undefined) {
            self._parent.options.current = new Date();
        }
        self._parent.options.current.setHours(0, 0, 0, 0);
        self._parent.options.today = Date.baseDate();
        self._parent.options.today.setHours(0, 0, 0, 0);
//        if (!bReinit) {
//            self._changePeriod(0);
//        }
        self._parent.aCalculated.startHour = self._parent.params.nonWorkingHoursDisplay == 'hide' ? self._parent.params.startHourPeriod : 0;
        self._parent.aCalculated.stopHour = self._parent.params.nonWorkingHoursDisplay == 'hide' ? self._parent.params.stopHourPeriod : 24;
        

        if (nCurHour >= parseInt(self._parent.aCalculated.startHour)) {
            var nCellHeight = self._parent.params.minMinutePeriod != '15' 
                ? (self._parent.params.minMinutePeriod == '60' ? 30 : 60) 
                : 120;
            self._parent.options.scrollLine = (nCurHour - self._parent.aCalculated.startHour) * nCellHeight;
        }
    }
    
    
    self._initInterface = function(){
        var aEventNames = self._parent.eventNames;
        self._dom.modeButtons.on(aEventNames.click, 'span[data-mode]', function(evt){
            self._parent._clearQueue();
            if (self._parent.aCalculated.compactWidth || self._parent.aCalculated.lightning) {
                if (self._dom.modeButtons.hasClass('open')) {
                    self._parent.toggleMode(jQuery(this).data('mode'));
                }
                self._dom.modeButtons.toggleClass('open');
                self._dom.modeButtons.one('blur', function(){
                    self._dom.modeButtons.removeClass('open');
                });
            } else {
                self._parent.toggleMode(jQuery(this).data('mode'));
            }
            return self._parent._cancelBubble(evt);
        });
        self._dom.displayButtons.on(aEventNames.click, 'span[data-mode]', function(evt){
            var el = jQuery(this), bMaximize = el.data('mode') != 'compact';
            el.siblings().removeClass('sel');
            el.toggleClass('sel');
            self._dom.el.toggleClass('_maximize', bMaximize);
            self._parent._reResize();
            self._parent._setParam('maximize', el.hasClass('sel'), bMaximize);
        });
        //'click touchstart'
        var tNavTimer = null, 
            nPeriodSum = 0;
        self._dom.navButtons.on(aEventNames.click, 'span', function(evt){
            var el = jQuery(this);
            if (el.data('nav') == undefined && el.parent().data('nav') != undefined) {
                el = el.parent();
            }
            switch(el.data('nav')) {
                case 'l' :
                case 'r' :
                    nPeriodSum = el.data('nav') ==  'l' ? -1 : 1;
                    self._changePeriod(nPeriodSum);
                    break;
                case 'today' :
                    self._changePeriod(self._parent.options.today);
                    break;
                case 'day' :
                    self._showCalendar(evt);
                    break;
                case 'display' :
                    self._showSettings();
                    break;
            };
            return self._parent._cancelBubble(evt);
        });
        
        self._dom.manageButtons.on(aEventNames.click, 'span', function(evt){
            var el = jQuery(this);
            switch(el.data('nav')) {
                case 'display' :
                    self._showSettings();
                    break;
                case 'print' :
                    self._showPrint();
                    break;
                case 'today' :
                    self._changePeriod(self._parent.options.today, {curtime : true});
                    break;                    
                case 'maximize' :
                    el.toggleClass('sel');
                    self._dom.el.toggleClass('_maximize');
                    self._parent._reResize();
                    self._parent._setParam('maximize', el.hasClass('sel'));
                    break;
                case 'toggleleft' :
                    el.toggleClass('sel');
                    self._dom.el.toggleClass('_noleft');
                    self._parent._reResize();
                    self._parent._setParam('noleft', el.hasClass('sel'));
                    break;
            }
            if (self._parent.isMobile()) {
                return self._parent._cancelBubble(evt);
            }
        });
        var nSearchTimer = null;
        self._dom.search.on('keyup', 'input', function(evt){
            var sVal = jQuery(evt.target).val();
            self._dom.search.toggleClass('_not_empty', sVal != '');
            if (nSearchTimer != null) {
                clearTimeout(nSearchTimer);
            }
            nSearchTimer = setTimeout(function(){
                nSearchTimer = null;
                self._applySearch(jQuery(evt.target).val());
            }, 200);
        });
        
        self._dom.search.on(aEventNames.click, 'span', function(evt){
            var oEl = jQuery(evt.target);
            if (oEl.hasClass('_str')) {
                self._showSearchOptions();
                
            } else if (oEl.hasClass('_clear')) {
                self._dom.search.children('input').val('');
                self._dom.search.toggleClass('_not_empty', false);
                self._applySearch('');
            } else if (oEl.data('action') == 'cancelSearch') {
                self._dom.search.children('._search_block').toggleClass('_on');
            } else if (oEl.data('action') == 'okSearch') {
                self._applySearch(self._dom.search.children('input').val(), 
                    self._dom.search.find('select[name="calendars"]').val(), 
                    self._dom.search.find('select[name="fields"]').val()
                );
                self._dom.search.children('._search_block').toggleClass('_on');
            }
        });
        
        
        
        // 'contextmenu'
        if (!self._parent.isMobile()) {
            self._dom.right
                .on(aEventNames.contextmenu, '.evt', function(event){
                    self._parent.log('evt submenu event');
                    self._parent._returnTouchEvent(event);
                    if (event.which == 3 || event.type == 'calongtouch' || event.isTrigger || self._parent.options.ie) {
                        self._showEventSubmenu(jQuery(this), event);
                    }
                    return self._parent._cancelBubble(event);
                })
                .on(aEventNames.contextmenu, '.events', function(event){
                    self._parent.log('events contextmenu event');
                    self._parent._returnTouchEvent(event);
                    if (event.which == 3 || event.type == 'calongtouch' || event.isTrigger || self._parent.options.ie) {
                        self._showAreaSubmenu(jQuery(this), event);
                    }
                    return self._parent._cancelBubble(event);
                })
                .on(aEventNames.dblclick, '.evt', function(event){
                    return self._showEventDetailUrl(jQuery(this).data('event'), event);
                });
            self._reInitHoverEvent();
        }
        self._dom.right
            .on(aEventNames.click, '.evt', function(event){  //'click touchend'
                var el = jQuery(this);
                self._parent.log('evt details event');
                self._parent._returnTouchEvent(event);
                if (self._parent.options.tTimer != undefined) {
                    clearTimeout(self._parent.options.tTimer);
                }
                if (event.ctrlKey 
                    || (jQuery.browser.chrome && self._parent.options.mac === true && event.metaKey)
                ) {
                    var sId = el.data('event'), sCalendar = el.data('calendar');
                    self._dom.currentMode
                        .find('.evt[data-event="' + sId + '"][data-calendar="' + sCalendar + '"]')
                            .toggleClass('sel', !el.hasClass('sel'));
                    
                } else if (!el.hasClass('no_hover') && event.which !== 3) {
                    self._dom.currentMode.find('.evt.sel').removeClass('sel');
                    self._parent.options.tTimer = setTimeout(function(){
                        self._showEventDetail(el, event);
                    }, 200);
                }
            });  //'click touchend'
        self._dom.left //'contextmenu calongtouch'
            .on(
                aEventNames.contextmenu, 
                '.calendar, .title, ._filterset', 
                {
                    time : 550,
                    handle : {
                        "move" : self._parent.isMobile(),
                        "longtouch" : true,
                        "zoom" : false,
                        "swipe" : false
                    }
                }, 
                function(event) {
                    self._parent._returnTouchEvent(event);
                    if (event.data.type == "move") {
                        var nTopPos = self._dom.left.scrollTop();
                        self._dom.left.scrollTop(nTopPos + event.data.deltaY);
                        self._dom.left.data('cancelClick', true);
                        return self._parent._cancelBubble(event);
                    }
                    if (event.which == 3 || event.type == 'calongtouch' || self._parent.options.ie) {
                        self._showCalendarSubmenu(jQuery(event.target), event);
                    }
                    return self._parent._cancelBubble(event);
                }
            )  
            .on(aEventNames.click, 'div[data-type] > div.list > div.calendar > span.str', function(event){
                self._parent._returnTouchEvent(event);
                self._showCalendarSubmenu(jQuery(event.target).parent(), event);
                return  self._parent._cancelBubble(event);
            })  // 'click'
            .on(aEventNames.click, 'div[data-type] > div.list > div.calendar', function(event){
                if (self._dom.left.data('cancelClick') == true) {
                    self._dom.left.data('cancelClick', false);
                    return false;
                }
                self._parent._returnTouchEvent(event);
                if (event.which === 3) {
                    return;
                }
                self._toggleCalendar(jQuery(this).data('calendar'));
                return self._parent._cancelBubble(event);
            })
            .on(aEventNames.click, 'div.calendars_empty > div.list > div.calendar_empty a', function(event){
                var el = jQuery(event.target),
                    sMode = el.data('go'),
                    sType = el.parents('.calendars_empty').data('type');
                if (sMode == 'add') {
                    self._showCalendarEditForm(sType, '', false);
                } else {
                    self._showSettings({mode : sType == 'sf' ? 'visible' : (sType == 'group' ? 'groups' : 'web')});
                }
                return self._parent._cancelBubble(event);
            })
            .on(aEventNames.click, 'div[data-type] > div.title', function(evt){
                var oClosedLeftBlocks = JSON.parse(self._parent.getLS('closedLeftBlocks', '{}'));
                if (self._parent.params.noleft  || evt.which === 3) {
                    return self._parent.isMobile() ? false : self._parent._cancelBubble(evt);
                }
                var oBlock = jQuery(this).parent();
                oBlock.toggleClass('close');
                if (oBlock.hasClass('close')) {
                    oClosedLeftBlocks[oBlock.data('type')] = true;
                } else if (oClosedLeftBlocks[oBlock.data('type')] != undefined) {
                    delete oClosedLeftBlocks[oBlock.data('type')];
                }
                self._parent.setLS('closedLeftBlocks', JSON.stringify(oClosedLeftBlocks));
                return self._parent._cancelBubble(evt);
            })
            .on(aEventNames.click, 'div[data-type] > div.list > div.folder', function(event){
                self._openClodeFolder(jQuery(event.currentTarget));
                return self._parent._cancelBubble(event);
            });;
        if (self._parent.isMobile())  {
            self._dom.left
                .on('scroll', 'div.list', function(evt){
                    console.log('a3');
                    if (!self._parent.params.noleft) {
                        console.log('a4');
                        return false;
                    }
                    return self._parent._cancelBubble(evt);
                })
                .on('mouseover', '[data-type]', function(evt){  //div.title
                    if (!self._parent.params.noleft && !self._parent.options._small) {
                        return false;
                    }
                    var oEl = jQuery(evt.currentTarget);
                    if (!oEl.hasClass('_on')) {
                        oEl.addClass('_on');
                    }
                })
                .on('mouseout', '[data-type]', function(evt){   //div.title
                    if (!self._parent.params.noleft && !self._parent.options._small) {
                        return false;
                    }
                    jQuery(evt.currentTarget).removeClass('_on');
                    
                });
            self._dom.hideMenu.on('click', function(evt){
                self._dom.el.removeClass('_show_menu');
            });
            
            self._dom.navButtons.on(
                self._parent.options.deviceReal == 'ipad' || self._parent.options.deviceReal == 'iphone'
                    ? "blur"
                    : "change"
                , 
                'input[type="date"]', 
                function(evt){
                    var dDate = new Date(jQuery(evt.target).val());
                    self._changePeriod(dDate);
                }
            );
        }
        // 'click' event on "calendars", "groups", "webcal" title
       
        
        self._dom.title.on(aEventNames.click, function(evt){
            if ((self._parent.isMobile() || self._parent.options._emulateSmall === true) 
                && self._parent.options._small
            ) {
                self._showCalendarsSmallList();
            } else {
                self._showMainMenu({event : evt});
            }
            return self._parent._cancelBubble(evt);
        });
        self._dom.notify.on(aEventNames.click, '._close', function(){
            var oMess = jQuery(this).parent(),
                bErrorMes = oMess.hasClass('_error');
            oMess.remove();
            if (self._parent.params.hideNotify != 'all' && bErrorMes) {
                self._dom.notify.children('._old').not('._error').remove();
                
            }
            if (self._dom.notify.children().size() < 1) {
                self._dom.notify.removeClass('show');
            }
        });        
    }
    
    self._reInitHoverEvent = function(){
        var self = this;
        
        if (self._parent.isMobile()) {
            return;
        }
        
        self._dom.right.off('mouseenter.CA_HOVER, mouseout.CA_HOVER');
        if (self._parent.params.showTitles == "3" || self._parent.params.showTitles == "4") {

            var fHoverFunc = function(oEl, event) {
                if (oEl.hasClass('new_event')) {
                    return;
                }
                if (self._parent.params.showTitles == '3') {
                    if (oEl.prop('title') == '') {
                        var aEventData = self._parent._events.getEvent(oEl.data('event'), oEl.data('calendar'));
                        if (typeof(aEventData[0]) != 'undefined') {
                            oEl.prop('title', aEventData[0].getTitle(true));
                        }
//                            oEl[0].title = self._parent._events.getEventTitle(aEventData[0], true);
                    }
                } else if (self._parent.params.showTitles == '4') {
                    self._parent._initView('eventDetail', function(){
                        var oView = self._parent._getView('eventDetail');
                        var params = {
                            "event" : event,
                            "els"   : [oEl],
                            "el"    : oEl
                        }
                        if (oView != null) {
                            oView.show(params);
                        }
                    });
                }
            }
            var tNavTimer;
            self._dom.right
                .on('mouseenter.CA_HOVER', '.evt', function(oEvt){
                    if (tNavTimer != null) {
                        clearTimeout(tNavTimer);
                    }
                    if ((self._parent.options.curBrowser != 'chrome' && !self._parent.options.ie9)
                        || self._parent.params.showTitles == '4'
                    ) {
                        tNavTimer = setTimeout(function(){
                            fHoverFunc(jQuery(oEvt.currentTarget), oEvt);
                        }, 500);
                    } else {
                        fHoverFunc(jQuery(oEvt.currentTarget), oEvt);
                    }
                })
                .on('mouseout.CA_HOVER', '.evt', function(oEvt){
                    var oCheckEl = jQuery(oEvt.target);
                    if (oCheckEl.parents('.evt').size() > 0) {
                        return;
                    }
                    if (tNavTimer != null) {
                        clearTimeout(tNavTimer);
                        tNavTimer = null;
                    }
                });
        }        
    }
    
    self._showCalendarsSmallList = function() {
        var aDisableEnableCalendars = [];
        self._dom.el.toggleClass('_show_menu');
        if (self._dom.el.hasClass('_show_menu')) {
            aDisableEnableCalendars = [];
        }
        if (self._parent.options.compactMobile === true) {
            var oButtonsPanel = self._dom.left.children('._buttonsPanel');
            if (oButtonsPanel.size() < 1) {
                oButtonsPanel = jQuery(
                    '<div class="_buttonsPanel form_buttons">'
                    + '<span data-action="okCalendars">' + self._parent.getText('select', 'Select') + '</span>'
                    + '<span data-action="cancelCalendars">' + self._parent.getText('cancel', 'Cancel') + '</span>'
                    + '</div>'
                ).prependTo(self._dom.left);
                oButtonsPanel.on('click', 'span', function(evt){
                    var oEl = jQuery(this);
                    
                    switch(oEl.data('action')) {
                        case "okCalendars" :
                            if (aDisableEnableCalendars.length > 0) {
                                self._disableEnableCalendar(aDisableEnableCalendars);
                            }
                            break;
                        case "cancelCalendars" :
                            if (aDisableEnableCalendars.length > 0) {
                                self._dom.left
                                    .find('div[data-calendar="' 
                                    + aDisableEnableCalendars.join('"], div[data-calendar="')
                                    + '"]').toggleClass('sel');
                            }
                            break;
                    }
                    self._dom.el.removeClass('_show_menu');
                });
                
                self._parent.options.func.calendarToggle = function(sCalendar, bSel){
                    var nPos = aDisableEnableCalendars.indexOf(sCalendar),
                        oEl = self._dom.left.find('div[data-calendar="' + sCalendar + '"]');
                    if (oEl.hasClass('lock')) {
                        return;
                    }
                    oEl.toggleClass('sel');
                    if (nPos >= 0) {
                        aDisableEnableCalendars.splice(nPos, 1);
                    } else {
                        aDisableEnableCalendars.push(sCalendar);
                    }
                    return false;
                };
            }
        }
    }
    
    self._showCalendar = function(evt) {
        self._parent._initView('calendar', function(){
            var oView = self._parent._getView('calendar'),
                params = {
                    evt : evt,
                    select : function(dDate) {
                        self._changePeriod(dDate);
                    }
                }
            if (oView != null) {
                oView.show(params);
            }
        });
        return false;           
    }
    
    
    self._showSettings = function(params) {
        params = params || {};
        self._parent._initView('calendarSettings', function(){
            var oView = self._parent._getView('calendarSettings');
            if (oView != null) {
                oView.show(params);
            }
        });
        return false;           
    }
    
    self._showEventSubmenu = function(evtEl, event) {
        if (self._parent.options.readonly.contextEvent === false) {
            return false;
        }
        self._parent._initView('eventMenu', function(){
            var oView = self._parent._getView('eventMenu');
            var params = {
                "el" : evtEl,
                "event" : event
            }
            if (oView != null) {
                oView.show(params);
            }
        });
        return false;
    }
    
    self._showAreaSubmenu = function(areaEl, event) {
        if (self._parent.options.readonly.contextArea === false) {
            return false;
        }
        self._parent._initView('areaMenu', function(){
            var oView = self._parent._getView('areaMenu');
            var params = {
                "area" : areaEl,
                "event" : event
            }
            if (oView != null) {
                oView.show(params);
            }
        });
        return false;
    }
    
    
    self._showEventDetail = function(evtEl, event) {
        var aEvents = [],
            aPresent = {},
            bGo = true;
        if (self._parent.options.readonly.hover === false || evtEl.hasClass('new_event')) {
            return false;
        }
        self._dom.currentMode.find('.evt.sel[data-event]').each(function(){
            var oEl = jQuery(this);
            if (typeof(aPresent[oEl.data('calendar')]) != 'undefined' 
                && aPresent[oEl.data('calendar')].indexOf(oEl.data('event')) >= 0){
                return;
            }
            if (typeof(aPresent[oEl.data('calendar')]) == 'undefined' ){
                aPresent[oEl.data('calendar')] = [];
            }
            if (aEvents.indexOf(oEl) < 0) {
                aEvents.push(oEl);
                aPresent[oEl.data('calendar')].push(oEl.data('event'));
            }
        });
        
        if (typeof(self._parent.options.func.eventHover) == 'function' 
            || self._parent._calendars.checkCalendarFunction(evtEl.data('calendar'), 'eventHover')
        ) {
            var aAll = jQuery.extend({}, aPresent);
            if (aAll[evtEl.data('calendar')] == undefined) {
                aAll[evtEl.data('calendar')] = [evtEl.data('event')];
            } else if (aAll[evtEl.data('calendar')].indexOf(evtEl.data('event')) < 0) {
                aAll[evtEl.data('calendar')].push(evtEl.data('event'));
            }
            if (self._parent._calendars.checkCalendarFunction(evtEl.data('calendar'), 'eventHover')){
                bGo = self._parent._calendars.runCalendarFunction(evtEl.data('calendar'), 'eventHover', [aAll, event]);
            } else {
                bGo = self._parent.options.func.eventHover(aAll, event);
            }
        }
        if (bGo !== false) {
            self._parent._initView('eventDetail', function(){
                var oView = self._parent._getView('eventDetail');
                if (aEvents.length < 1) {
                    aEvents.push(evtEl);
                }
                var params = {
                    "event" : event,
                    "els"   : aEvents,
                    "el"    : evtEl
                }
                if (oView != null) {
                    oView.show(params);
                }
            });
        }
        return false;
    }
    
    self._showCalendarSubmenu = function(calendarEl, event) {
        if (typeof(calendarEl) == 'string') {
            calendarEl = self._dom.left.find('div[data-calendar="' + calendarEl + '"]');
        }
        var oTypeEl = calendarEl.is('div[data-type]') ? calendarEl :  calendarEl.parents('div[data-type]');
        if ((self._parent.options.readonly.contextCalendar === false && ['web', 'sf', 'group'].indexOf(oTypeEl.data('type')) >= 0)
            || 
            (self._parent.options.readonly.contextFilter === false && ['filtersets'].indexOf(oTypeEl.data('type')) >= 0)
        ) {
            return false;
        }
        self._parent._initView('calendarMenu', function(){
            
            var oView = self._parent._getView('calendarMenu');
            var params = {
                "calendar" : calendarEl,
                "event" : event
            }
            if (oView != null) {
                oView.show(params);
            }
        });
        return false;        
    }
    
    
    self._showCalendarEditForm = function(sType, sCalendarId, bClone) {
        self._parent._initView('calendarEdit', function(){
            var oView = self._parent._getView('calendarEdit');
            if (oView != null) {
                oView.show({calendar : sCalendarId, type : sType, clone : bClone, mode : "edit"});
            }
        });
        return false;   
    }
    
    self._showCalendarQuickFilter = function(sCalendarId, evt) {
        self._parent._initView('calendarFilter', function(){
            var oView = self._parent._getView('calendarFilter');
            if (oView != null) {
                oView.show({calendar : sCalendarId, event : evt});
            }
        });
        return false;   
    }
    
    self._manageCalendarsList = function(sType) {
        self._parent._initView('calendarEdit', function(){
            var oView = self._parent._getView('calendarEdit');
            if (oView != null) {
                oView.show({type : sType, mode : "list"});
            }
        });
        return false;   
    }
    
    self._showMainMenu = function(params) {
        params = params || {};
        if (self._parent._dom.popup != undefined 
            && self._parent._dom.popup.children('.ca_menu').size() > 0
            && self._parent._dom.popup.is(':visible')
        ) {
            self._parent.hidePopup();
        } else {
            self._parent._initView('mainMenu', function(){
                var oView = self._parent._getView('mainMenu');
                if (oView != null) {
                    oView.show(params);
                }
            });
        }
        return false;           
    }
    
    self._changeVisibleCalendar = function(aEnableCalendars, aDisableCalendars, bMode) {
        self._parent._calendars.changeVisibleCalendar(aEnableCalendars, aDisableCalendars, bMode);
    }
    
    self._showiCal = function(sCalendarId, evt){
        self._parent._initView('ical', function(){
            var oView = self._parent._getView('ical');
            var params = {
                "cid" : sCalendarId,
                "event" : evt
            }
            if (oView != null) {
                oView.show(params);
            }
        });
    }
    
    self._showCreateEventForm = function(params) {
        var bGo = true;
        if (
            (self._parent.options.readonly.create === false && params.eventId == undefined)
            || 
            (self._parent.options.readonly.edit === false && params.eventId != undefined)
            || 
            (params.cid != undefined && params.cid != '' && 
                (
                    params.eventId != undefined && self._parent._calendars.getCalendar(params.cid)['edit'] === false
                    || 
                    params.eventId == undefined && self._parent._calendars.getCalendar(params.cid)['create'] === false
                )
            )
        ) {
            return;
        }
        if (params.cid != undefined && params.eventId != undefined 
            && (typeof(self._parent.options.func.eventEdit) == 'function'
                || self._parent._calendars.checkCalendarFunction(params.cid, 'eventEdit')
            )
        ) {
            bGo = self._parent._calendars.checkCalendarFunction(params.cid, 'eventEdit')
                ? self._parent._calendars.runCalendarFunction(params.cid, 'eventEdit', [params.eventId, params.event, params.predefine])
                : self._parent.options.func.eventEdit(params.cid, params.eventId, params.predefine);
        } else if ([undefined, '', null].indexOf(params.cid) >= 0
            && typeof(self._parent.options.func.eventEditCalendarSelect) == 'function'
        ) {
            bGo = self._parent.options.func.eventEditCalendarSelect(params, params.event);
        }
        if (bGo !== false) {
            self._parent._initView('create', function(){
                var oView = self._parent._getView('create');
                if (oView != null) {
                    oView.show(params);
                }
            });
        }
    }
    
    self._showNotify = function(text, sMode, nTimeout){
        // sMode => normal (default) / error / alert / confirm
        if (sMode == 'alert' || sMode == 'confirm') {
            self._showNotify_AlertConfirm(text, sMode, nTimeout);
            return;
        }
        var bError = false;
        if (sMode == 'error') {
            bError = true;
        }
        if (sMode === true) {
            bError = true
        } else if (sMode === false) {
            bError = false
        }
        
        nTimeout = nTimeout || 3000;
        if (text != undefined) {
            self._parent.options._notify.push([text, bError, nTimeout]);
        }
        if (self._dom == undefined || self._dom.notify == undefined || self._parent.options._notify.length == 0) {
            return;
        }

        var sHTML = '';
        for (var nI = 0; nI < self._parent.options._notify.length; nI++) {
            text = self._parent.options._notify[nI][0];
            bError = self._parent.options._notify[nI][1];
            nTimeout = Math.max(
                nTimeout, 
                self._parent.options._notify[nI][2] != undefined 
                    ? self._parent.options._notify[nI][2]
                    : 0
            );
            sHTML += '<div class="' + (bError ? '_error' : '') + '">' 
                + '<span class=_d>' 
                    + Date.baseDate().format(self._parent.options.format.hourTitle) 
                + '</span>'
                + '<span class=_close>X</span>' 
                + '<span class=_text>'
                    + text 
                + '</span>'
                + '</div>';
            
        }
        self._parent.options._notify.length = 0;
        if (parseInt(self._parent.params.logLevel) == 0 
            || (parseInt(self._parent.params.logLevel) == 1 && !bError)
        ) {
            return;
        }
        if (self._nNotifyTimer != null) {
            clearTimeout(self._nNotifyTimer);
            self._nNotifyTimer = null;
        }
        self._dom.notify.prepend(sHTML).scrollTop(0).addClass('show show_old');
        self._nNotifyTimer = setTimeout(function(){
            if (self._parent.params.hideNotify == 'all') {
                self._dom.notify.children().not('.alert-confirm').addClass('_old');
                //self._dom.notify.removeClass('show');
                if (self._dom.notify.children().not('._old').size() < 1) {
                    self._dom.notify.removeClass('show');
                }
            } else {
                self._dom.notify.children().not('._error .alert-confirm').addClass('_old');
                if (self._dom.notify.children().not('._old').size() < 1) {
                    self._dom.notify.removeClass('show');
                }
                self._dom.notify.removeClass('show_old');
            }
            self._nNotifyTimer = null;
        }, nTimeout);
        //self.log(text);        
    }
    
    self._showNotify_AlertConfirm = function(text, sMode, mNotify){
        var sHTML = '<div class="alert-confirm ">' 
              + '    <span class="_text">' + text + '</span>'
              + '    <div class="alert_buttons">'
              + '        <span data-confirm="ok" class="simple_button alert" tabindex="30">OK</span>'
        if (sMode == 'confirm') {
            sHTML += '    <span data-confirm="cancel" class="simple_button alert" tabindex="31">Cancel</span>'
        }
        sHTML += '    </div>'
              + '</div>';

        if (self._dom.notify_shadow == undefined) {
            self._dom.notify_shadow = jQuery('<div class="CA_notify_shadow">').appendTo(self._dom.el);
        }
        self._dom.notify_shadow.addClass('show');
        self._dom.notify.prepend(sHTML).scrollTop(0).addClass('show show_old alert_popup');

        self._dom.notify.find('span[data-confirm]').on('click keyup', function(evt) {
            if (evt.type == 'keyup' && [13, 32, 27].indexOf(evt.keyCode) < 0) {
                return;
            }
            var bNextAction = sMode == 'confirm' && jQuery(evt.target).data('confirm') == 'ok';
            if (bNextAction && evt.type == 'keyup' && evt.keyCode == 27) {
                bNextAction = false;
            }
            self._dom.notify.removeClass('alert_popup').find('div.alert-confirm').remove();
            self._dom.notify_shadow.removeClass('show');
            if (self._dom.notify.children().not('._old').size() < 1) {
                self._dom.notify.removeClass('show');
            }
            if (bNextAction && typeof(mNotify) == 'function') {
                mNotify();
            }
        });
        self._dom.notify.find('span[data-confirm="ok"]').focus();
    }
    
    self._setDayTitle = function(sText) {
        self._dom.dateTitle.text(sText);
    }
    
    self._buildData = function(params){
        var oView = self._parent._getView();
        if (oView != null) {
            oView.showData(params || {});
        }
    }
    
    self._parseUrl = function() {
        var aKeys = Array.objectKeys(self._parent.options._urlParams),
            aAdditionalFilterUrl = [],
            sCalendarId = '';
        if (aKeys.length > 0) {
            for (var nI = 0; nI < aKeys.length; nI++) {
                if (aKeys[nI].substr(0, 2) == 'pv' && aKeys[nI].length > 2) {
                    var nIdx = parseInt(aKeys[nI].substr(2, 1));
                    if (nIdx > 0) {
                        aAdditionalFilterUrl[nIdx - 1] = unescape(
                            self._parent._getUrlParam(aKeys[nI]).replace(/\+/g, '%20')
                        );
                    }
                }
                if (aAdditionalFilterUrl.length > 0) {
                    aAdditionalFilterUrl.map(function(sVal){return sVal == undefined ? '' : sVal;});
                    self._parent.options._additionalFilterUrl.filtersPV = aAdditionalFilterUrl.join(':.:');
                }
            }
        }
        
        if (document.location.href.indexOf('calendar=') >= 0) {
            sCalendarId = document.location.href.split('calendar=')[1].split('#')[0].split('&')[0];
        }
        if (self._parent._getUrlParam('site', '0') == '1' 
            && (self._parent._getUrlParam('calendar', '') != '' || sCalendarId != '')
        ) {
            self._parent.options._urlParams['cid'] = sCalendarId != '' ? sCalendarId : self._parent._getUrlParam('calendar', '');
        }
        
        if (self._parent._getUrlParam('filter', 'all') != 'all') {
            self._parent.options._additionalFilterUrl.filtersApplyTo = self._parent._getUrlParam('filter');
        }
        
        if (self._parent._getUrlParam('cid', '') != '') {
            self._parent.options.calendarId = self._parent._getUrlParam('cid').split(/,|%2C/);
            self._parent.params['noleft'] = true;
            self._parent.options.userSettings['noleft'] = true;
        }
        self._parent.options.userSettings['noleft'] = self._parent.params['noleft'] = (
            self._parent._getUrlParam('sb', '0') == '1' 
            || (self._parent.options.userSettings['noleft'] != undefined && self._parent.options.userSettings['noleft'])
        );
        if (self._parent._getUrlParam('sb', '1') == '0' ) {
            self._parent.options.userSettings['noleft'] = self._parent.params['noleft'] = false;
        }
        self._parent.params['maximize'] = self._parent.options.userSettings['maximize'] = (
            self._parent._getUrlParam('hh', '0') == '1' 
            || (self._parent.options.userSettings['maximize'] != undefined && self._parent.options.userSettings['maximize'])
        );
        
        
        self._parent.options.userSettings['closeleft'] = self._parent.params['closeleft'] = (
            self._parent._getUrlParam('sb', '-1') === '2'
            || (self._parent.options.userSettings['closeleft'] != undefined && self._parent.options.userSettings['closeleft'])
        );
        self._parent.options.userSettings['closehead'] = self._parent.params['closehead'] = (
            self._parent._getUrlParam('ht', '-1') === '1' 
            || (self._parent.options.userSettings['closehead'] != undefined && self._parent.options.userSettings['closehead'])
        );
        
        if (self._parent._getUrlParam('url', '') !== '' ) {
            self._parent.options.detailUrl = self._parent._getUrlParam('url', '');
        }
        
        var aModes = {
            'd' : 'day', 
            'm' : 'month', 
            'w' : 'week', 
            'c' : 'custom', 
            'g' : 'gantt', 
            'da' : 'day', 
            'dg' : 'day', 
            'wa' : 'week', 
            'dnoa' : 'day', 
            'wnoa' : 'week', 
            'a' : 'agenda',
            's' : 'swimlane'
        };
        if (self._parent._getUrlParam('v', '') !== '' && typeof(aModes[self._parent._getUrlParam('v')]) != 'undefined') {
            var sSelectedMode = aModes[self._parent._getUrlParam('v')];
            if (self._parent._getUrlParam('v').indexOf('noa') >= 0) {
                self._parent.options.agenda = false;
            } else  if (self._parent._getUrlParam('v').indexOf('a') >= 0) {
                self._parent.options.agenda = true;
            } 
            self._parent.options.userSettings['mode'] = sSelectedMode;
            self._parent.params['mode'] = sSelectedMode;
        }
        if (self._parent._getUrlParam('g_v', '') !== '' ) {
            self._parent.options.userSettings['ganttSplit'] = self._parent._getUrlParam('g_v');
            self._parent.params['ganttSplit'] = self._parent._getUrlParam('g_v');
        }
        if (self._parent._getUrlParam('g_p', '') !== '' ) {
            self._parent.options.userSettings['ganttPeriod'] = self._parent._getUrlParam('g_p');
            self._parent.params['ganttPeriod'] = self._parent._getUrlParam('g_p');
        }
        
        var aVisible = ['l_ds', 'l_p', 'l_n', 'l_t', 'c_t', 'r_d', 'r_w', 'r_m', 'r_y', 'r_l', 'r_g', 'r_c', 'r_a', 'r_s'];
        for (var nI = 0; nI < aVisible.length; nI++) {
            if (self._parent._getUrlParam(aVisible[nI], '-1') === '0') {
                self._parent._visibleElements.push(aVisible[nI]);
            }
        }
        var sDate = self._parent._getUrlParam('date', '-1');
        if (sDate !== '-1') {
            sDate = decodeURIComponent(sDate.replace(/\+/g, '%20'));
            var dD = Date.baseDate(sDate);
            if (dD.isValid()) {
                self._parent.options.current = dD;
            }
        }
    }
    
    self._setRecalculator = function(){
        self._calculateData(true);
        var dTime = Date.baseDate(),
            nCurHour = dTime.getHours(),
            nHourStep = 60 / parseInt(self._parent.params.minMinutePeriod),
            aSelector = [],
            aRules = [],
            nTimePos = (dTime.getHours() - self._parent.aCalculated.startHour) * nHourStep * 30 
            + parseInt(dTime.getMinutes() * nHourStep / 2)
            + 1,
            nSwimlinePos = parseInt(nTimePos / 30 * 100);
        aSelector.push('.JQ_CA > .CA_r  .hour_v_area .current');
        aRules.push('background-position: 0 ' + nTimePos + 'px ');
        
        aSelector.push('.JQ_CA > .CA_r > .show._mode-swimlane > .swim_items > .events > ._days._current');
        aRules.push('background-position: ' + nSwimlinePos + 'px 0');
        
        aSelector.push('.JQ_CA ul.hour_v_area .hours_title');
        aRules.push('background-position: 0 ' + (nTimePos - 2) + 'px, 0 0');
        changeCssClass(aSelector, aRules, false);
        if (nCurHour >= parseInt(self._parent.aCalculated.startHour)) {
            var nCellHeight = self._parent.params.minMinutePeriod != '15' 
                ? (self._parent.params.minMinutePeriod == '60' ? 30 : 60) 
                : 120;
            self._parent.options.scrollLine = (nCurHour - self._parent.aCalculated.startHour) * nCellHeight;
        }
        
        setTimeout(self._setRecalculator, 300000);
        
    }
    
    self._applySearch = function(sText, aCalendars, sFields) {
        self._parent._events.setSearch(sText, aCalendars, sFields);
        self._buildData({
            disable : true
        });
    }
    
    self._showSearchOptions = function(){
        var oSearchBlock = self._dom.search.children('div._search_block');
        if (oSearchBlock.size() < 1) {
            oSearchBlock = jQuery('<div class=_search_block>'
                + '<div>Calendars: <select name=calendars multiple></select></div>'
                + '<div>Fields: <select name=fields><option value="all">All<option value="title">Only title<option value="agenda">Agenda</select></div>'
                + '<span class="simple_button" data-action=okSearch>OK</span>&nbsp;&nbsp;<span class="simple_button" data-action=cancelSearch>Cancel</span>'
                + '</div>');
            oSearchBlock.appendTo(self._dom.search);
        }
        var aCalendars = self._getActiveCalendars(),
            sHTML = '', // <option value="">All
            aSelected = self._parent._events.getSearch('calendars');
    
        for (var nJ = 0; nJ < aCalendars.calendar.length; nJ++) {
            var aCalendar = self._parent._calendars.getCalendar(aCalendars.calendar[nJ]);
            if (aCalendar== undefined) {
                continue;
            }
            sHTML += '<option value="' + aCalendars.calendar[nJ] + '" ' 
                    + (aSelected.length >= 0 && aSelected.indexOf(aCalendars.calendar[nJ]) >= 0 ? "selected" : "") 
                    + '>'
                    + aCalendar.name;
        }
        oSearchBlock.find('select[name="calendars"]').html(sHTML);
        oSearchBlock.toggleClass('_on');
    }
    
    
    self._buildFilteringPanel = function(aFields, aSets, aAdminSets, aParams){
        self._parent._initView('filteringPanel', function(){
            var oView = self._parent._getView('filteringPanel');
            if (oView != undefined) {
                oView.show({
                    'block'     : self._dom.type['filter'], 
                    'filtersets' : self._dom.type['filtersets'], 
                    'fields'    : aFields,
                    'sets'      : aSets,
                    'adminSets' : aAdminSets,
                    "displayParams"    : aParams
                });
            }
        });
        
    }
    
    self._setText = function(){
        self._calendarTypes = {
            "sf" : {
                "title" : self._parent.getText('standard_calendars', "Standard Calendars"), 
                "empty" : self._parent.getText('standard_calendars_text', "No calendars are selected. "
                    + "Please <a data-go='visible'>add an existing calendar</a>  "
                    + "or <a data-go='add'>create a new one</a>.")
            },
            "group" : {
                "title" : self._parent.getText('calendar_groups', "Calendar Groups"), 
                'empty' : self._parent.getText('calendar_groups_text', "No groups are selected.  "
                    + "Please <a data-go='visible'>add an existing group</a> "
                    + "or <a data-go='add'>create a new one</a>.")
                
            },
            "web" : {
                "title" : self._parent.getText('web_calendars', "Web Calendars"), 
                "empty" : self._parent.getText('web_calendars_text', "No web calendars are selected. "
                    + "Please <a data-go='visible'>add an existing web calendar</a> "
                    + "or <a data-go='add'>create a new one</a>.")
                        
            }
        }
        self._parent.text.week =  self._parent.getText('week_days');
        self._parent.text.weekShort = self._parent.getText('week_days_short');
        self._parent.text.month = self._parent.getText('month_days');
        self._parent.text.monthShort = self._parent.getText('month_days_short');
//        self._parent.text.buttons =  {"up" : "Toggle fullscreen", "left" : "Toggle sidebar"};
    }
    
    
    self._openClodeFolder = function(oFolder) {
        var bHide = !oFolder.hasClass('_close'),
            sName = oFolder.data('folder');
        sName = '' + sName;
        oFolder.nextUntil('.folder').toggleClass('folder_hide', bHide);
        oFolder.toggleClass('_close');
        var aHiddenFolders = self._parent.getLS('closedFolders', '').split(',');
        if (bHide && aHiddenFolders.indexOf(sName) < 0) {
            aHiddenFolders.push(sName);
        }
        if (!bHide && aHiddenFolders.indexOf(sName) >= 0){
            do {
                aHiddenFolders.splice(aHiddenFolders.indexOf(sName), 1);
            } while (aHiddenFolders.indexOf(sName) >= 0);
            
        }
        aHiddenFolders = aHiddenFolders.unique();
        self._parent.setLS('closedFolders', aHiddenFolders.join(','));
    }
    
    self._rememberColor = function(aSelector, aRules) {
        for (var nJ = 0; nJ < aSelector.length; nJ++) {
            self._aColorCSS[aSelector[nJ]] = aRules[nJ];
        }
    }
    
    self._restoreColor = function(sRule) {
        return self._aColorCSS;
    }
    
    self._initExternalAPI = function(){
        var oAPI = {};
        oAPI.calendarOn = function(sId) {
            var aFunc = [function(){
                self._toggleCalendar(sId, false);
            }];
            if (self._parent._calendars.getCalendar(sId) == undefined) {
                aFunc.push(function(){
//                    
                    self._parent._calendars.getUnvisible({id : [sId]}, function(aData){
                        if (aData != undefined && aData.length > 0) {
                            aData.map(function(aEl){
                                if (aEl.id == sId) {
                                    aEl.visible = true;
                                }
                            });
                        }
                        self._refreshCalendars(self._parent._calendars.getData());
                        self._toggleCalendar(sId, true);
                    });
                })
            } else if (self._parent._calendars.getCalendar(sId).visible == false){
                self._parent._calendars.getCalendar(sId).visible = true;
                self._refreshCalendars(self._parent._calendars.getData());
            }
            self._parent._prependQueue(aFunc)
            
        }
        
        oAPI.calendarOff = function(sId) {
            self._toggleCalendar(sId, true);
        }
        
        oAPI.getDate = function() {
            return Date.baseDate(self._parent.options.current);
        }
        
        oAPI.setDate = function(mDate) {
            self._changePeriod(mDate);
        }
        
        oAPI.getView = function() {
            return self._parent._currentModeName;
        }
        
        oAPI.setView = function(sMode) {
            self._parent.toggleMode(sMode);
        }
        
        oAPI.setViewSettings = function(sMode, aOptions) {
            if (self._parent._viewSettings[sMode] == undefined) {
                self._parent._viewSettings[sMode] = {};
            }
            
            jQuery.extend(self._parent._viewSettings[sMode], aOptions);
        }
        
        oAPI.setFunc = function(sName, fFunc) {
            self._parent.options.func[sName] = fFunc;
        }
        
        oAPI.editEventDialogue = function(mCalendar, sEvent, oEvent) {
            var aParams = {
                eventId : sEvent,   // event id
                event : oEvent      // js event
            };
            if (jQuery.isPlainObject(mCalendar)) {
                aParams = jQuery.extend(aParams, mCalendar);
            } else {
                aParams.cid = mCalendar;
            }
            var aFoundCalendar = self._parent._calendars.findCalendar(aParams.cid);
            aParams.cid = aFoundCalendar != undefined ? aFoundCalendar.id : aParams.cid;
            self._showCreateEventForm(aParams);
        }
        
        oAPI.setCalendarProperties = function(sCalendar, aProp) {
            self._parent._calendars.setProperties(sCalendar, aProp);
        }
        
        oAPI.getCalendarProperty = function(sCalendar, sProp) {
            var aFoundCalendar = self._parent._calendars.findCalendar(sCalendar);
            if (aFoundCalendar && aFoundCalendar[sProp]) {
                return aFoundCalendar[sProp];
            } 
            return null;
        }
        
        oAPI.setCalendarFilter = function(sCalendar, aFilters, sRule, fFunc){
            var aFoundCalendar = self._parent._calendars.findCalendar(sCalendar);
            if (aFoundCalendar == null) {
                return null;
            }
            layout.setCalendarFilter(aFoundCalendar.id, aFilters, sRule, fFunc);
            return true;
        }
        
        oAPI.changeParams = function(aParams){
            self._parent._initView('calendarSettings', function(){
                var oView = self._parent._getView('calendarSettings');
                if (oView != undefined) {
                    oView.changeParams(aParams);
                }
            });
        }
        
        oAPI.getCalendars = function(aFilter) {
            var aList = self._parent._calendars.getCalendars(aFilter),
                aResult = [];
            for (var nI = 0; nI < aList.length; nI++) {
                aResult.push(aList[nI].friendlyName);
            }
            return aResult;
        }
        
        oAPI.getParam = function(sParam) {
            self._parent.getParam(sParam, null);
        }
        
        oAPI.setFiltersPanel = function(aParams) {
            var aFields = aParams.fields == undefined ? null : aParams.fields,
                afilterSets = aParams.filterSets == undefined ? null : aParams.filterSets,
                aAddParams = {
                    addCustomFilterSet : aParams.addCustomFilterSet === true,
                    addGlobalFilterSet : aParams.addGlobalFilterSet === true
                };
            
            self._buildFilteringPanel(aFields, afilterSets, null, aAddParams);
        }
        
        return oAPI;
    }
    
    jQuery.calendarAnything.layout = layout;
})();