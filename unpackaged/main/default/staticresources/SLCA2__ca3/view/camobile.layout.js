/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/mobile/jq-ca.layout.css',
        _parent     : null,
        _dom        : {},
        _nMaxLineCss : 0,
        "_calendarTypes" : {
            "sf" : {
                "title" : "Standard Calendars", 
                "empty" : "No calendars are selected. "
            },
            "group" : {
                "title" : "Calendar Groups", 
                'empty' : "No groups are selected.  "
            },
            "web" : {
                "title" : "Web Calendars", 
                "empty" : "No web calendars are selected. "
            }
        },
        "_eventHeight" : {
            "small" : 17,
            "middle" : 20,
            "large" : 23
        },
        _nNotifyTimer : null
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
        self._parent._prependQueue([
            function(){
                self._initHourlyCSS(true);
            },
            self._init,
            self._calculateData,
            self._parent._calendars.load,
            self._parseUrl
            
        ]);
        
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
    
    layout.changeCalendarColor = function(sCalendarId, sColor) {
        var aCSS = {};
        self._parent._calendars.changeCalendarColor(sCalendarId, sColor);
        aCSS[sCalendarId] = sColor;
        self._buildCalendarCSS(aCSS);
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
    
    layout.clearPeriod = function(mCalendarId, dMin, dMax) {
        self._parent._calendars.clearPeriod(mCalendarId, dMin, dMax);
    }
    
    layout.delCalendar = function(sCalendarId) {
        return self._delCalendar(sCalendarId);
    }
    
    layout.removeCalendars = function(aCalendars) {
        return self._removeCalendars(aCalendars);
    }

    layout.toggleMode = function(sName, tBaseDate) {
        var div = self._getRightMode(sName);
                
        self._dom.currentMode = div;
        self._dom.currentMode.parent().children().removeClass('show');
        
        self._parent._initView(sName, function(){
            var oView = self._parent._getView();
            if (oView != null) {
                self._dom.right.removeClass('CA_ajax_loading');
                if (tBaseDate != undefined) {
                    self._changePeriod(Date.baseDate(tBaseDate));
                } else {
                    oView.show('toggle');
                    self._setDayTitle(oView.getTitle());
                    oView.showData();
                }
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
    
    layout.getCurrentModeDiv = function(){
        return self._dom.currentMode;
    }
    
    layout.buildData = function(params){
        return self._buildData(params);
    }

    layout.toggleCalendar = function(mCalendarId, bOnlyEnabled) {
        return self._toggleCalendar(mCalendarId, bOnlyEnabled);
    }
    
    layout.buildCalendarCSS = function(css, aSpecialCSS) {
        return self._buildCalendarCSS(css, aSpecialCSS);
    }

    layout.updateCalendarHTML = function(aCalendar) {
        var domCalendar = self._dom.left.find('div[data-type="' + aCalendar.calendarType + '"] div[data-calendar="' + aCalendar.id + '"]');
        if (domCalendar.size() < 1) {
            return;
        }
        domCalendar[0].outerHTML = self._getCalendarHTML(
            aCalendar, 
            {
                "selected" : domCalendar.hasClass('sel')
            }
        );
    }
    
    layout.updateDynamicValues = function(aFields) {
        
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
//        console.log(aEvents);
        self._parent._events.delEvent(aEvents);
        var oView = self._parent._getView();
        if (self._parent.params.cacheTime == 0) {
            oView.showData();
        } else {
            if (oView != null) {
                oView.delEvent(aEvents);
            }
        }
    },
            
    layout.findEventBars = function(mId) {
        var aResult;
        if (typeof(mId) == 'string') {
            aResult = self._dom.right.children('.show').find('div.evt[data-event="' + mId + '"]');
        }
        return aResult;
    }
    
    layout.checkAfterCreatePresent = function(mEventsId, mCalendarId, sNonPresentMessage) {
        var self = this;
        mCalendarId = typeof(mCalendarId) == 'string' 
            ? [mCalendarId] 
            : (mCalendarId == undefined ? [''] : mCalendarId);
        mEventsId = typeof(mEventsId) == 'string' ? [mEventsId] : mEventsId;
        
        sNonPresentMessage = sNonPresentMessage 
            || "Event will not be displayed due to filter settings or insufficient privileges";
        var checkFunc = function(){
            for (var nI = 0; nI < mEventsId.length; nI++) {
                for (var nJ = 0; nJ < mCalendarId.length; nJ++) {
                    var aEl = self.getCurrentModeDiv()
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
            self._parent.showNotify(sNonPresentMessage, true);
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
        return this._parent._calendars.setCalendarFilter(sId, aRules, sRule, fFunc);
    }
    
    layout.pasteEvent = function(oArea, oEvt) {
        var oView = self._parent._getView(),
            oClickDate = oView.getClickDate(oEvt);
        self._parent._events.pasteEvent(oClickDate, function(data){
            oView.refresh();
        });
    }
    
    layout.showPrint = function() {
        return self._showPrint();
    }

    self._init = function() {
        self._dom.el.addClass('JQ_CA')
            .removeClass('CA_ajax_loading')
            .addClass(self._parent.params.size)
            .addClass('_event-style-' + self._parent.params.eventStyle)
            .addClass('_week-end-' + self._parent.params.showWeekEnds)
            .addClass('_hour-' + self._parent.params.minMinutePeriod)
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
            + "<div class=CA_f></div>"
        );
        self._dom.footer = self._dom.el.find('div.CA_f');
        self._dom.header = self._dom.el.find('div.CA_h');
        self._dom.left = self._dom.el.find('div.CA_l');
        self._dom.right = self._dom.el.find('div.CA_r');
        self._buildFooter();
        self._buildHeader();
        self._buildLeft();
        self._buildRight();        
    }
    
    self._buildHeader = function() {
        self._dom.header.append(
            '<div class="nav buttons"></div>'
            + '<div class="plus buttons">+</div>'
            + "<div class='notify'></div>"
        );
        
        self._dom.navButtons = self._dom.header.children('.nav');
        self._dom.plusButtons = self._dom.header.children('.plus');
        
        
        self._dom.dateTitle = self._dom.header.find('.nav');
        self._dom.notify = self._dom.header.find('div.notify');
    }
    
    self._buildFooter = function() {
        self._dom.footer.append(
            '<div class="manage buttons">Today</div>'
            + '<div class="title buttons">My Calendars</div>' 
            + '<div class="mode buttons" data-mode="day">Agenda</div>'
            + "<div class='notify'></div>"
        );
        self._dom.modeButtons = self._dom.footer.children('.mode');
        self._dom.manageButtons = self._dom.footer.children('.manage');
        self._dom.title = self._dom.footer.children('.title');
    }
    
    self._buildRight = function(){
        self._parent.toggleMode(self._parent._currentModeName, true);
    },

    
    
    self._buildLeft = function(){
        self._dom.type = {};
        var sTitleText = self._parent.isMobile() ? 'Long touch' : 'Right click';
        jQuery.each(self._calendarTypes, function(idx, el){
            self._dom.type[idx] = jQuery('<div data-type="' + idx + '" tabindex=1>')
                .append('<div class=title title="' + sTitleText + ' for more options"><span></span>' + el.title + '</div>'
                    + '<div class=list>'
                        + '<div class="calendar_empty">' + el.empty + '</div>'
                    + '</div>')
                .appendTo(self._dom.left);
        });
        self._dom.left.append('<div class="_buttonsPanel form_buttons">'
                + '<span data-action="okCalendars">Select</span>'
                + '<span data-action="cancelCalendars">Cancel</span>'
            + '</div>');
        
        self._refreshCalendars(self._parent._calendars.getData());
        return;
    },


    self._refreshCalendars = function(aCalendars, aSort) {
        var aDOMList = {},
            nI, sStr,
            aCalendarCSS = {},
            aSpecialCalendarColors = {},
            aRealSort = aSort != undefined && aSort != null //&& aSort.length == aCalendars.length 
                ? aSort 
                : aCalendars,
            aSelected = false, aVisibled = false,
            bSiteVisible = false && self._parent._getUrlParam('site') == '1';
//console.log(aSort, aCalendars);
        if (self._parent.options.enabled != undefined && self._parent.options.enabled !== '') {
            aSelected = typeof(self._parent.options.enabled) == 'string' 
                ? self._parent.options.enabled.split(',')
                : self._parent.options.enabled;
            aVisibled = self._parent.options.calendarId === 'CA_ACCESSIBLE' 
                ? true
                : (self._parent.options.calendarId != undefined && self._parent.options.calendarId !== ''
                    ? (
                        typeof(self._parent.options.calendarId) == 'string'  
                        ? self._parent.options.calendarId.split(',')
                        : self._parent.options.calendarId
                    )
                    : false
                )
        } else if (self._parent.options.calendarId != undefined 
            && self._parent.options.calendarId !== ''
        ) {
            aSelected = self._parent.options.calendarId != 'CA_ACCESSIBLE'
                ? (typeof(self._parent.options.calendarId) == 'string' 
                    ? self._parent.options.calendarId.split(',')
                    : self._parent.options.calendarId
                ) 
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
                var nIdx = aVisibled.indexOf(aCalendar.id);
                nIdx = nIdx < 0 && aCalendar.friendlyName != undefined ? aVisibled.indexOf(aCalendar.friendlyName) : nIdx;
                if (nIdx >= 0){
                    aCalendarIds[aCalendar.id] = aRealSort[nI];
                    aSelectedIds[nIdx] = aCalendar.id;
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
                if (aVisibled !== false){
                    bVisible = aVisibled === true 
                    || (aVisibled.length > 0 
                        && (
                            aVisibled.indexOf(aCalendar.id) != -1 
                            || (aCalendar.friendlyName != undefined  && aVisibled.indexOf(aCalendar.friendlyName) != -1)
                        )
                    );
                }
            
            if (aSelected === true || (aSelected !== false && aSelected.length > 0)) {
                aCalendar.selected = aSelected.indexOf(aCalendar.id) != -1 
                    || (aCalendar.friendlyName != undefined  && aSelected .indexOf(aCalendar.friendlyName) != -1);
            } 
            aCalendarCSS[aCalendar.id] = aCalendar.color;
            if (aCalendar.specialColors != undefined && aCalendar.specialColors.length != undefined) {
                aSpecialCalendarColors[aCalendar.id] =  aCalendar.specialColors;
            }
            var domCalendar = self._dom.left.find('div[data-type="' + aCalendar.calendarType + '"] div[data-calendar="' + aCalendar.id + '"]');
            if (domCalendar.size() < 1) {
                sStr = self._getCalendarHTML(
                    aCalendar, 
                    bVisible !== null || bSiteVisible 
                        ? {visible : bVisible || bSiteVisible } 
                        : {}
                );
            } else {
                domCalendar.toggleClass('hide', !aCalendar.visible);
                sStr = domCalendar[0].outerHTML;
                domCalendar.remove();
            }

            if (typeof(aDOMList[aCalendar.calendarType]) == 'undefined') {
                aDOMList[aCalendar.calendarType] = '';
            }
            aDOMList[aCalendar.calendarType] += sStr;
        }
        jQuery.each(aDOMList, function(sKey, sValue){
            self._dom.left.find('div[data-type="' + sKey + '"] > .list').append(sValue);
        });
        
        self._dom.left.children().each(function(){
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
        self._buildCalendarCSS(aCalendarCSS, aSpecialCalendarColors);
        
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
        
        
    }
    
    
    self._getCalendarHTML = function(aCalendar, aParams) {
        aParams = jQuery.extend({}, aCalendar, aParams);
        var sTitle = '', 
            sColors = '',
            aTmp, 
            nI,
            bHidden = false;
        
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
        } else if (aParams['calendarType'] == 'sf' && aParams['specialColors'] != ''
            && aParams['specialColorsFields'] != undefined && aParams['specialColorsFields'] != ''
        ) {
            var aColorFields = aParams['specialColorsFields'].split('::'),
                sSub = '';
            
            for (nI = 0; nI < aColorFields.length; nI++) {
                aTmp = aColorFields[nI].split('||');
                aTmp[1] = aTmp[1].split('###')[0];
                sSub = '';
                if (aTmp[3] != undefined && aTmp[3] != '') {
                    var aSub = aTmp[3].split("|"),
                        aSubOption;
                    sSub += '<span class="_sub_dynamic">';
                    for (var nJ = 0; nJ < aSub.length; nJ++) {
                        if (aSub[nJ] == '') {
                            continue;
                        }
                        aSubOption = aSub[nJ].split('__');
                        sSub += '<b class=_sd_' + nJ + '>' + aSubOption[1].htmlspecialchars() + '</b>';
                    }
                    sSub += '</span>';
                }
                if (aTmp[0].indexOf('ID') >= 0) {
                    aTmp[0] = aTmp[0].replace(/\sID/g, '')
                        .replace(/Opportunity\/Account/gi, "Related To")
                        .replace(/Contact\/Lead/gi, "Name");
                }
                sColors += '<span data-spec="' + nI + '" '
                    + (aTmp[1] == '_DYNAMIC_' ? ' data-field="' + aTmp[2] + '"' : '')
                    + '>'
                    + '<a class="color_' + aParams.id 
                        + (aTmp[1] != '_DYNAMIC_' ? ' _spec' + nI  : " _CA_hidden ")
                        + '"></a>'
                    + aTmp[0].htmlspecialchars()
                    + (sSub == '' && aTmp[1] != '_DYNAMIC_' ? ' - ' + aTmp[1].htmlspecialchars() : '')
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
    
    self._buildCalendarCSS = function(css, aSpecialCSS) {
        var aSelector = [], 
            aRules = [], 
            nI;
            
        jQuery.each(css, function(idx, color) {
            color = (
                color.length == 6 
                && color.substring(0, 1) != '#' 
                    ? '#' 
                    : ''
                ) + color;
            aSelector.push('.color_' + idx, 
                '.color_' + idx + ' > .title', 
                '.CA_l >  div > div.list > div[data-calendar="' + idx + '"].sel > span.checkbox',
                '.CA_l >  div > div.list > div[data-calendar="' + idx + '"].lock > span.checkbox'
            );
            aRules.push('background-color:' + color + '; color:#' + contrastingColor(color) + ' !important', 
                'color:#' + contrastingColor(color) + ' !important',
                'background-color:' + color,
                'background-color:' + color
            );
            if (
                aSpecialCSS != undefined 
                && aSpecialCSS[idx] != undefined 
                && aSpecialCSS[idx].length > 0
            ) {
                for (nI = 0; nI < aSpecialCSS[idx].length; nI++) {
                    var sColor = aSpecialCSS[idx][nI];
                    sColor = (
                        sColor.length == 6 
                        && sColor.substring(0, 1) != '#' 
                            ? '#' 
                            : ''
                        ) + sColor;

                    aSelector.push('.color_' + idx + '._spec' + nI, 
                        '.color_' + idx + '._spec' + nI + ' > .title'
                    );
                    aRules.push('background-color:' + sColor + '; color:#' + contrastingColor(sColor) + ' !important', 
                        'color:#' + contrastingColor(sColor) + ' !important'
                    );
                }
                
            }
        });
        changeCssClass(aSelector, aRules , true);
    }
    
    
    self._initLinesCSS = function(nMaxLine){
        var self = this;
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
        var nStartH, nLengthH,
            nHourStep = 60 / parseInt(self._parent.params.minMinutePeriod),
            aSelector = [], aRules = [], aRemove = []
            ;
        for (var nI = 0; nI <= 24 * nHourStep; nI++) {
            nStartH = (nI - self._parent.params.startHourPeriod * nHourStep) * 30;
            nLengthH = (nI == 0 ? 1 : nI) * 30;
            if (nStartH < 0) {
                aSelector.push('.JQ_CA   ul.hour_v_area li > div.events > div.evt.s' + nI + ' > span > span.title');
                aRules.push('padding-top:' + Math.abs(nStartH - 1) + 'px !important;');
            } else if (!bFirst) {
                aRemove.push('.JQ_CA   ul.hour_v_area li > div.events > div.evt.s' + nI + ' > span > span.title');
            }
            aSelector.push('.JQ_CA   ul.hour_v_area li > div.events > div.evt.s' + nI);
            aRules.push('top:' + nStartH + 'px;');
            aSelector.push('.JQ_CA   ul.hour_v_area li > div.events > div.evt.i' + nI);
            aRules.push('height:' + nLengthH + 'px;');
        }
        aSelector.push('.JQ_CA   ul.hour_v_area li');
        aRules.push('height:' + (self._parent.params.stopHourPeriod - self._parent.params.startHourPeriod) * nHourStep * 30 + 'px;');
        changeCssClass(aSelector, aRules , bFirst);
        if (aRemove.length > 0) {
            removeCssClass(aRemove);
        }
//        console.timeEnd('hourly CSS');
    },    
            
            
            
    self._getActiveCalendars = function(params) {
        var aGroup = [], aCalendar = [], aWeb = [];
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
                var aEvent = self._parent.getEvent(nEventId);
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
    
    
    self._showPrint = function() {
        var _generatePrintVersion = function() {
            var oView = self._parent._getView(),
                bIsLeft = self._dom.el.hasClass('_noleft'),
                dD = new Date();
            if (oView.preparePrint != undefined) {
                oView.preparePrint(true);
            }
            self._dom.el.addClass('CA_Print').removeClass('_noleft');
            
            self._dom.header.append('<div class=ca_print_logo>'
                + 'Printed on ' 
                + dD.format('mm/dd/yyyy') 
                + ' at ' 
                + dD.format('h:ii aa') + '</div>');
            
            if (self._parent.options.ie) {
                self._dom.el.removeClass('CA_loading');
                self._showIEPrint();
                return;
            }
            
            var oH2C = self._dom.el.html2canvas({
                flashcanvas: self._parent.options.staticUrl + "/plugin/flashcanvas.min.js",
                "onrendered" : function() {
//                    console.log(oH2C);
                    var canvas = oH2C.canvas();
                    var img, 
                        divPritable = jQuery('<div id="CA_Print">'
                            + '<img src="">'
                            + '<div class="_printing_panel">'
                                + '<a data-action=print>Print</a>'
                                + '<a data-action=close>Close</a>'
                                + '<a data-action=save >Save as image</a>'
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
                    + '<a data-action=print>Print</a>'
                    + '<a data-action=close>Close</a>'
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
                } else if (el.data('action') == 'print'){
                    jQuery('body').addClass('_special_ie_print');
                    window.print();
                }
            });
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
        if (typeof(mCalendarId) == 'string') {
            mCalendarId = [mCalendarId];
        }
        for (nI = 0; nI < mCalendarId.length; nI++) {
            el = self._dom.left.find('div[data-calendar="' + mCalendarId[nI] + '"]');
            bDisableMode = !el.hasClass('sel') || false;
            self._parent._events.setEvent(null, {"disable" : bDisableMode}, {"parentId" : mCalendarId[nI]})
//            console.log('set calendar ' + mCalendarId[nI] + '  to disable ' + bDisableMode);
            aCalendar = self._parent._calendars.getCalendar(mCalendarId[nI]);
            if (aCalendar.calendarType == 'group') {
                jQuery.extend(aChangeSelected, self._lockCalendars(aCalendar, !bDisableMode));
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
            }]      
        ]);

    }
   
    self._lockCalendars = function(aGroup, bMode) {
//        console.log(bMode);
        
        var aChangeSelected = {}, 
            aCalendars = aGroup.calendarsList, 
            aToggledGroups = self._getActiveCalendars().group,
            nI;
        if (bMode === false) {
            for (nI = 0; nI < aToggledGroups.length; nI++) {
                aCalendars = aCalendars.diff(self._parent._calendars.getCalendar(aToggledGroups[nI]).calendarsList);
            }
        }
//        console.log('aCalendars to check', aCalendars, ' disable  ', bMode);
        bMode = typeof(bMode) != 'undefined' ? bMode : true;
        if (jQuery.isArray(aCalendars)) {
            jQuery.each(aCalendars, function(idx, val) {
                if (bMode) {
                    self._parent._events.setEvent(null, {"disable" : bMode}, {parentId : val});
                }
                self._dom.left
                    .find('div[data-type] > div.list > div[data-calendar="' + val + '"]')
                    .toggleClass('lock', bMode).removeClass('sel', !bMode);
                if ( bMode) {
                    aChangeSelected[val] = !bMode;
                } else {
                }
                
            });
        } else if (aCalendars != '') {
            self._dom.left
                .find('div[data-type] > div.list > div[data-calendar="' + aCalendars + '"]')
                    .toggleClass('lock', bMode).removeClass('sel', !bMode);
            if (bMode) {
                aChangeSelected[aCalendars] = !bMode;
            }
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
            oDiv = jQuery('<div data-mode="' + sName + '" class="_mode-' + sName.replace('/', '-') + '">');
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
                        params.date = Date.baseDate(self._parent.options.current);
                        oView.reShow(params);
                        self._setDayTitle(oView.getTitle());
                        params.date = new Date(self._parent.options.current);
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
                        params.date = new Date(self._parent.options.current);
                    }
                    
                }
            });
        }
        if (mDirection != 0) {
            self._parent._addQueue([
                [self._buildData, params]
            ]);
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
    
    
    self._calculateData = function(){
        self._parent.options.now = new Date();
        var nCurHour = self._parent.options.now.getHours();
        self._parent.options.now.setHours(0, 0, 0, 0);
        if (self._parent.options.current == undefined) {
            self._parent.options.current = new Date();
        }
        self._parent.options.current.setHours(0, 0, 0, 0);
        self._parent.options.today = Date.baseDate();
        self._parent.options.today.setHours(0, 0, 0, 0);
        self._changePeriod(0);
        if (nCurHour >= parseInt(self._parent.params.startHourPeriod)) {
            var nCellHeight = self._parent.params.minMinutePeriod == '30' 
                ? (self._parent.params.minMinutePeriod == '60' ? 15 : 60) 
                : 120;
            self._parent.options.scrollLine = (nCurHour - self._parent.params.startHourPeriod) * nCellHeight;
        }
        return;
    }
    
    
    self._initInterface = function(){
        var aEventNames = self._parent.eventNames;
        self._dom.modeButtons.on(aEventNames.click, function(evt){
            var el = jQuery(this),
                sMode = el.data('mode');
            if (sMode == 'day') {
                el.data('mode', 'agenda');
                el.text('Day');
            } else {
                el.data('mode', 'day');
                el.text('Agenda');
            }
            self._parent.toggleMode('mobile/' + sMode);
            return self._parent._cancelBubble(evt);
        });
        //'click touchstart'
        self._dom.navButtons.on(aEventNames.click, function(evt){
            switch (self._parent._currentModeName) {
                case 'mobile/year' :
                    break;
                case 'mobile/month' :
                    self._parent.toggleMode('mobile/year', true);
                    break;
                case 'mobile/day' :
                case 'mobile/year' :
                case 'mobile/agenda' :
                    self._parent.toggleMode('mobile/month', true);
                    break;
            }
            return self._parent._cancelBubble(evt);
        });
        
         
        self._dom.manageButtons.on(aEventNames.click, function(evt){
            self._changePeriod(new Date());
            return self._parent._cancelBubble(evt);
        });
        
        self._dom.right
            .on(aEventNames.click, '.evt', function(event){  //'click touchend'
                var el = jQuery(this);
                self._parent.log('evt details event');
                self._parent._returnTouchEvent(event);
                if (self._parent.options.tTimer != undefined) {
                    clearTimeout(self._parent.options.tTimer);
                }
                if (event.ctrlKey){
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
        var aDisableEnableCalendars = [];
        self._dom.left //'contextmenu calongtouch'
            .on(
                aEventNames.contextmenu, 
                '.calendar, .title', 
                {
                    time : 550,
                    handle : {
                        "move" : false,
                        "longtouch" : true,
                        "zoom" : false,
                        "swipe" : false
                    }
                }, 
                function(event) {
                    self._parent._returnTouchEvent(event);
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
                self._parent._returnTouchEvent(event);
                if (event.which === 3) {
                    return;
                }
                var oEl = jQuery(this),
                    sCalendar = oEl.data('calendar'),
                    nPos = aDisableEnableCalendars.indexOf(sCalendar);
                oEl.toggleClass('sel');
                if (nPos >= 0) {
                    aDisableEnableCalendars.splice(nPos, 1);
                } else {
                    aDisableEnableCalendars.push(sCalendar);
                }
                return self._parent._cancelBubble(event);
            })
            .on(aEventNames.click, 'div[data-type] > div.title', function(evt){
                if (self._parent.params.noleft) {
                    return self._parent.isMobile() ? false : self._parent._cancelBubble(evt);
                }
                jQuery(this).parent().toggleClass('close');
                return self._parent._cancelBubble(evt);
            })
            .on('click', 'span[data-action]', function(evt){
                var oEl = jQuery(this);
                
                switch(oEl.data('action')) {
                    case "okCalendars" :
                        console.log(aDisableEnableCalendars);
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
        if (self._parent.isMobile())  {
            self._dom.left
                .on('scroll', 'div.list', function(evt){
                    if (!self._parent.params.noleft) {
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
        }
        // 'click' event on "calendars", "groups", "webcal" title
       
        console.log(self._dom.title);
        self._dom.title.on(aEventNames.click, function(evt){
            self._dom.el.toggleClass('_show_menu');
            aDisableEnableCalendars = [];
            return self._parent._cancelBubble(evt);
        });
        self._dom.notify.on(aEventNames.click, '._close', function(){
            jQuery(this).parent().remove();
        });        
    }
    
    self._showCalendarsSmallList = function() {
        self._dom.el.toggleClass('_show_menu');
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
            self._parent._initView('mobile/eventDetail', function(){
                var oView = self._parent._getView('mobile/eventDetail');
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
        if (self._parent.options.readonly.contextCalendar === false) {
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
                ? self._parent._calendars.runCalendarFunction(params.cid, 'eventEdit', [params.eventId, params.event])
                : self._parent.options.func.eventEdit(params.cid, params.eventId);
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
    
    self._showNotify = function(text, bError, nTimeout){
        return;
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
        self._dom.notify.prepend(sHTML).scrollTop(0).addClass('show');
        self._nNotifyTimer = setTimeout(function(){
            self._dom.notify.children().addClass('_old');
            self._dom.notify.removeClass('show');
            self._nNotifyTimer = null;
        }, nTimeout);
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
            aAdditionalFilterUrl = [];
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
        
        
        if (self._parent._getUrlParam('site', '0') != '1' && self._parent._getUrlParam('calendar', '') != '') {
            self._parent.options._urlParams['cid'] = self._parent._getUrlParam('calendar', '');
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
            'm' : 'monthMobile', 'w' : 'weekMobile'
      };
        if (self._parent._getUrlParam('v', '') !== '' && typeof(aModes[self._parent._getUrlParam('v')]) != 'undefined') {
            var sSelectedMode = aModes[self._parent._getUrlParam('v')];
            if (self._parent._getUrlParam('v').indexOf('a') >= 0) {
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
        
        var aVisible = ['l_ds', 'l_p', 'l_n', 'l_t', 'c_t', 'r_d', 'r_w', 'r_m', 'r_y', 'r_l', 'r_g', 'r_c', 'r_a'];
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
    
    self._initExternalAPI = function(){
        var oAPI = {};
        oAPI.calendarOn = function(sId) {
            var aFunc = [function(){
                self._toggleCalendar(sId, false);
            }];
            if (self._parent._calendars.getCalendar(sId) == undefined) {
                aFunc.push(function(){
                    
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
            self._toggleMode(sMode);
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
        
        return oAPI;
    }
    
    jQuery.calendarAnything.layout = layout;
})();