/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css            : '/css/print/default.css',
        _parent        : null,
        _div           : null,
        _period        : {min : new Date(), max : new Date()},
        _eventsData     : [],
        _params        : {},
        _dom            : {},
        _aAllEvents     : [],
        _startH         : 0,
        _endH           :0,
        _emptyUsers     : false
    };
    var view = {};

    /** 
    * public init
    * @param div - div for view / unused
    * @param parent - parent CA
    * Init all necessary data
    */

    view.init = function (div, parent){
        self._parent = parent;

        self._parent.loadCss(self._css);
    }
    
    /** 
    * @public show
    * draw grid
    * @param aParams - list of params
    * @return void;
    */
    
    
    view.show = function(aParams) {
        aParams = aParams || {};
        aParams.maximize = self._parent._dom.el.hasClass('_maximize');
        self._period.min.setTime(aParams.min != undefined ? aParams.min : self._parent.options.current.getTime());
        self._period.max.setTime(aParams.max != undefined ? aParams.max : self._parent.options.current.getTime());
        var sHTML = self._initHTML(aParams);
        self._parent.hidePopup();
        self._parent.showPopup({
            html        : sHTML,
            onShow      : self._initEvents,
            autohide    : false,
            view        : view,
            fullScreen  : true,
            modal       : true
        });
        self._params = aParams;
        self._prepareClasses(true);
        view.showData(aParams);
        
    }
    
    /** 
    * @public reShow
    * @param aParams - list of params
    * redraw grid
    *
    */
    
    view.showData = function(aParams) {
        var dMin = Date.baseDate(self._period.min),
            dMax = Date.baseDate(self._period.max);
        aParams = aParams || self._params;
        dMax.setHours(23, 59, 0, 0);
        aParams.calendars = self._parent.layout.getActiveCalendars();
        aParams.min = dMin;
        aParams.max = dMax;
        
        self._eventsData = [];
        self._startH = self._params.agenda !== true ? self._parent.aCalculated.startHour : 0;
        self._endH = self._params.agenda !== true ? self._parent.aCalculated.stopHour : 24;
        
        self._parent._addQueue([
            function() {
                self._parent._events.getData(aParams, function(data){
                    self._eventsData = self._eventsData.concat(data);
                });
            },
            function()    {
                if (self._params.mode === 'table') {
                    self._buildTableData();
                } else if (self._params.mode == 'swimlane') {
                    self._buildSwimlaneData();
                } else {
                    self._buildData();
                }
            }
        ]);
        
    }
    
    

    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
    }


    /**
     * @private _initEvents
     * Init default events for whole week view
     * @param oPopup - popup window
     * @return void
     **/
    
    self._initEvents = function(oPopup) {
        self._div = oPopup.find('.ca_print_layout');
        self._dom.panel = oPopup.find('.ca_print_settings ._panel');
        self._dom.panel.find('input[name="from"]').val(self._period.min.format( self._parent.options.format['date']));
        self._dom.panel.find('input[name="to"]').val(self._period.max.format( self._parent.options.format['date']));
        
        self._dom.frame = oPopup.find('iframe');
        
        self._dom.panel.on('click.CA_CREATE', 'input.ca_date', function(evt){
            var el = jQuery(evt.currentTarget);
            self._parent._initView('calendar', function(){
                var oView = self._parent._getView('calendar');
                var params = {
                    el  : el,
                    evt : evt,
                    value : Date.preParse(el.val(), self._parent.options.format['date']).getTime(),
                    select : function(dDate) {
                        el.val(dDate.format(self._parent.options.format['date']));
                    },
                    showTime    : false,
                    showAM      : false
                }
                if (oView != null) {
                    oView.show(params);
                }
            });
        });
            
    }
    
    /**
     * @private _buildRightTopGrid
     * @param aParams - parameters
     * Draw top grid
     **/
    
    self._initHTML = function(aParams){
        
        var nSize =  self._parent._dom.el.width(),
            aSizes = [800, 1024, 1280, 1600],
            sClass = '';
        for (var nI = 0; nI < aSizes.length; nI++) {
            if (nSize <= aSizes[nI]) {
                sClass = '_w' + aSizes[nI];
                break;
            }
        }
        var sHTML = '<div class="ca_print_layout ca_print_day ' + sClass + '">'
            + '</div>'
            + '<iframe class="ca_print_frame" src=""></iframe>'
            + '<div class=ca_print_settings>'
                + '<div class=_buttons>'
                    + '<span data-action="print" class=simple_button>'
                    + self._parent.getText('print', 'Print')
                    + '</span>&nbsp;&nbsp;'
                    + '<span data-action="settings" class=simple_button>'
                    + self._parent.getText('print_settings', 'Settings')
                    + '</span>&nbsp;&nbsp;'
                    + '<span data-action="close" class=simple_button>'
                    + self._parent.getText('close', 'Close')
                    + '</span>&nbsp;&nbsp;'
                + '</div>'
                + '<div class=_panel>'
                    + (aParams.mode === 'swimlane'
                        ? self._parent.getText('print_display_users_no_events', 'Display users with no events')
                                + ' <input type="checkbox" name="empty_swimlane">&nbsp;&nbsp;'
                        : ''
                    )
                    + self._parent.getText('print_from', 'From')
                        + ': <input type="text" class="ca_date" name="from">&nbsp;&nbsp;'
                    + self._parent.getText('print_to', 'To')
                        + ': <input type="text" class="ca_date" name="to">&nbsp;&nbsp;'
                    + '<span data-action="ok" class=simple_button>'
                    + self._parent.getText('menu_ok', 'Ok')
                        + '</span>&nbsp;&nbsp;'
                + '</div>'
            + '</div>';
        return sHTML;
    }
    
    
    
    
    /**
     * @private _buildRightTopData
     * @aData aData - list of events / unused
     * Draw top pane data
     **/
    self._buildSwimlaneData = function(aData) {
        var aKeys = Array.objectKeys(self._params.groupLabel),
            sHTML = '',
            sUserData;
        aKeys.sort();
        for (var nJ = 0; nJ < aKeys.length; nJ++) {
            sUserData = self._buildData([], true, {group : self._params.groupLabel[aKeys[nJ]]});
            if (!self._emptyUsers && sUserData == "") {
                continue;
            }
            sHTML += '<p class="' + (nJ > 0 ? '_split' : '') + ' _group">'
                + self._parent.getText('print_calendar_for', 'Calendar for')
                + ' '
                + self._params.groupLabel[aKeys[nJ]].htmlspecialchars() 
                + '</p>'
                + sUserData;
        }
        self._div.html(sHTML);
        
    }
        
        
        
    self._buildData = function(aData, bHTML, aFilter){
        bHTML = bHTML == undefined ? false : bHTML;
        if (self._parent.options.ie) {
            return self._buildDataIE(aData, bHTML, aFilter);
        }
        var sHTML = '',
            dCur = Date.baseDate(self._period.min),
            aResult,
            tTime,
            nI, 
            dHour = Date.baseDate(),
//            aAllEvents = [],
            bFirstPrint = true,
            bNotEmptySwimlane = false;
        if (self._params.agenda !== true &&  self._startH  > 0) {
            dHour.setHours( self._startH , 0, 0, 0);
        } else {
            dHour.resetHours();
        }
        while (dCur <= self._period.max) {
            
            aResult = self._parent._events.getDayEvents(dCur, true, aFilter);
            if (!self._emptyUsers && aResult.length > 0) {
                bNotEmptySwimlane = true;
            }
            sHTML += '<div class="_day">' 
                + '<b>' + dCur.format("eeee, " + self._parent.options.format.fullDate) + '</b>'
                + (bFirstPrint 
                    ? '<i>'
                        + self._parent.getText('print_printed', 'Printed')
                        + ' ' 
                        + (self._parent.options.uname != undefined ? ' by ' + self._parent.options.uname.htmlspecialchars() : "")
                        + ' ' + self._parent.getText('print_on', 'on') + ' ' 
                        + Date.baseDate().format(self._parent.options.format.shortDatetime)
                        + '</i>'
                    : "")
                ;
            bFirstPrint = false;
            for (var nJ = 0; nJ < aResult.length; nJ++) {
                var aEl = aResult[nJ],
                    tElTime = (aEl.allDay ? -1 
                        : (!dCur.isSameDay(aEl.dateStart) 
                            ? parseInt( self._startH ) 
                            : aEl.dateStart.getHours())
                    ),
                    tEndElTime = aEl.allDay || !dCur.isSameDay(aEl.dateStart) ? 24  : aEl.dateEnd.getHours();
                if (self._params.agenda !== true && (tElTime >= 0 && tElTime <  self._startH )) {
                    if (tEndElTime <  self._startH ){
                        continue;
                    } else {
                        tElTime = parseInt( self._startH );
                    }
                }
                if (self._params.agenda !== true && tElTime > self._endH) {
                    break;
                }
                if (tTime == undefined) {
                    tTime = tElTime;
                    if (tElTime != -1) {
                        for (nI = parseInt( self._startH ); nI < tElTime; nI++) {
                            dHour.setHours(nI);
                            sHTML += '<div><span class=_t>' + dHour.format(self._parent.options.format.hourTitle) + '</span><span class="_d _first">&nbsp;</span></div>';
                        }
                    }
                    if (tTime != -1) {
                        dHour.setHours(tTime);
                    }
                    sHTML += '<div><span class=_t>'
                        + (tElTime == -1 ? 'All day' : dHour.format(self._parent.options.format.hourTitle)) 
                        + '</span><span class="_d _first">';
                } else {
                    for (nI = Math.max(tTime + 1, parseInt( self._startH )); nI < tElTime; nI++) {
                        dHour.setHours(nI);
                        sHTML += '</span></div><div><span class=_t>' + dHour.format(self._parent.options.format.hourTitle) + '</span><span class="_d _first">&nbsp;';
                    }
                    if (tTime != tElTime) {
                        if (tElTime != -1) {
                            dHour.setHours(tElTime);
                        }
                        sHTML += '</span></div><div><span class=_t>'
                            + (tElTime == -1 ? 'All day' : dHour.format(self._parent.options.format.hourTitle) ) + '</span><span class="_d _first">';
                    }
                }
                
                
                //console.log(aCalendar, aEl);
                
                sHTML += self._buildElenent(aEl, dCur) + '</span><span class="_d">';
                tTime = tElTime;
            }
            if (tTime >= 0 && tTime < self._endH - 1) {
                
                for (nI = tTime + 1; nI < self._endH; nI++) {
                    dHour.setHours(nI);
                    sHTML += '&nbsp;</span></div><div><span class=_t>' + dHour.format(self._parent.options.format.hourTitle) + '</span><span class="_d _first">';
                }
            }
            tTime = undefined;
            sHTML += '</span></div></div>';
            dCur.changeDate(1);
        }
        if (bHTML) {
            if (!self._emptyUsers && !bNotEmptySwimlane) {
                return '';
            }
            return sHTML;
        }
        self._div.html(sHTML);
        //return sHTML;
    }
    
    
    self._buildDataIE = function(aData, bHTML, aFilter){
        bHTML = typeof(bHTML) == 'undefined' ? false : bHTML;
        var sHTML = '',
            dCur = Date.baseDate(self._period.min),
            aResult,
            tTime,
            nI, 
            dHour = Date.baseDate(),
            aAllEvents = [],
            bFirstPrint = true,
            bNotEmptySwimlane = false;
        if ( self._startH  > 0) {
            dHour.setHours( self._startH , 0, 0, 0);
        } else {
            dHour.resetHours();
        }
        while (dCur <= self._period.max) {
            
            aResult = self._parent._events.getDayEvents(dCur, true, aFilter);
            if (!self._emptyUsers && aResult.length > 0) {
                bNotEmptySwimlane = true;
            }
            
            sHTML += '<div class="_day">' 
                + '<b>' + dCur.format("eeee, " + self._parent.options.format.fullDate) + '</b>'
                + (bFirstPrint
                    ? '<i>'
                        + self._parent.getText('print_printed', 'Printed')
                        + ' ' 
                        + (self._parent.options.uname != undefined ? ' by ' + self._parent.options.uname.htmlspecialchars() : "")
                        + ' ' + self._parent.getText('print_on', 'on') + ' ' 
                        + Date.baseDate().format(self._parent.options.format.shortDatetime)
                        + '</i>'
                    : "" )
                + '<table>';
            bFirstPrint = false;
            for (var nJ = 0; nJ < aResult.length; nJ++) {
                var aEl = aResult[nJ],
                    
                    tElTime = (aEl.allDay ? -1 
                        : (!dCur.isSameDay(aEl.dateStart) 
                            ? parseInt( self._startH ) 
                            : aEl.dateStart.getHours())
                    );
                if (self._params.agenda !== true && tElTime >= 0 && tElTime <  self._startH ) {
                    continue;
                }
                if (self._params.agenda !== true && tElTime > self._endH) {
                    break;
                }
                if (tTime == undefined) {
                    tTime = tElTime;
                    if (tElTime != -1) {
                        for (nI = parseInt( self._startH ); nI < tElTime; nI++) {
                            dHour.setHours(nI);
                            sHTML += '</td></tr><tr><td>' + dHour.format(self._parent.options.format.hourTitle) + '</td><td>';
                        }
                    }
                    if (tTime != -1) {
                        dHour.setHours(tTime);
                    }
                    sHTML += '<tr><td>'
                        + (tElTime == -1 ? 'All day' : dHour.format(self._parent.options.format.hourTitle)) 
                        + '</td><td>';
                } else {
                    for (nI = Math.max(tTime + 1, parseInt( self._startH )); nI < tElTime; nI++) {
                        dHour.setHours(nI);
                        sHTML += '</td></tr><tr><td>' + dHour.format(self._parent.options.format.hourTitle) + '</td><td>';
                        
                    }
                    if (tTime != tElTime) {
                        if (tElTime != -1) {
                            dHour.setHours(tElTime);
                        }
                        sHTML += '</td></tr><tr><td>'
                            + (tElTime == -1 ? 'All day' : dHour.format(self._parent.options.format.hourTitle) ) + '</td><td>';
                    }
                }
                
                
                //console.log(aCalendar, aEl);
                
                sHTML += self._buildElenent(aEl, dCur);
                tTime = tElTime;
            }
            if (tTime >= 0 && tTime < self._endH - 1) {
                
                for (nI = tTime + 1; nI < self._endH; nI++) {
                    dHour.setHours(nI);
                    sHTML += '</td></tr><tr><td>' + dHour.format(self._parent.options.format.hourTitle) + '</td><td>';
                }
            }
            tTime = undefined;
            sHTML += '</td></tr></table></div>';
            dCur.changeDate(1);
        }
        if (bHTML) {
            if (!self._emptyUsers && !bNotEmptySwimlane) {
                return '';
            }
            return sHTML;
        } else {
            self._div.html(sHTML);
        }
        //return sHTML;
    }
    
    
/**
     * @private _buildTableData
     * @aData aData - list of events / unused
     * Draw top pane data
     **/
        
    self._buildTableData = function(aData){
        var sHTML = '',
            dCur = Date.baseDate(self._period.min),
            dTemp = Date.baseDate(),
            dMonth = Date.baseDate(dCur),
            dNextMonth = Date.baseDate(dCur),
            nJ ,
            dHour = Date.baseDate(),
            bMonth = false,
            bFirstPrint = true,
            nFirstDay = self._parent.params.showWeekEnds < 7 ? 1 : parseInt(self._parent.params.startWeekDay);
        self._aAllEvents = [];
        if ( self._startH  > 0) {
            dHour.setHours( self._startH , 0, 0, 0);
        } else {
            dHour.resetHours();
        }
        if (dMonth.getDate() != 1) {
            dMonth.changeMonth(1).setDate(1);
        }
        
        
        while (dMonth < self._period.max) {
            dNextMonth.setTime(dMonth.getTime());
            dNextMonth.changeMonth(1).setDate(0);
            dCur.setTime(dMonth.getTime());
            dCur.resetFirstWeekDay(self._parent.params.startWeekDay);
            sHTML += '<div class="_month">' 
                + '<b>' + dMonth.format(self._parent.options.format.monthTitle) + '</b>'
                + (bFirstPrint
                    ? '<i>' 
                        + self._parent.getText('print_printed', 'Printed')
                        + ' '
                        + (self._parent.options.uname != undefined ? ' by ' + self._parent.options.uname : "")
                        + ' ' + self._parent.getText('print_on', 'on') + ' ' 
                        + Date.baseDate().format(self._parent.options.format.shortDatetime)
                        + '</i>'
                    : "")
                + '<table><thead><tr>';
            bFirstPrint = false;
            for (nJ = 0; nJ < 7 && nJ < self._parent.params.showWeekEnds; nJ++) {
                sHTML += '<th>' + self._parent.text.week[(nJ + nFirstDay) % 7] + '</th>';
            }
            sHTML += '</tr></thead><tbody>';
            bMonth = false;
            nJ = 0;
            while (dCur <= dNextMonth) {
                if (dCur.getDay() == nFirstDay) {
                    if (!bMonth) {
                        sHTML += '</tr>';
                    }
                    bMonth = true;
                    dTemp.setTime(dCur)
                    sHTML += '<tr class="_date">';
                    for (nJ = 0; nJ < 7 && nJ < self._parent.params.showWeekEnds; nJ++) {
                        sHTML += '<td>' + dTemp.getDate() + '</td>';
                        dTemp.changeDate(1);
                    }
                    sHTML += '</tr><tr>';
                    nJ = 0;
                }
                if (nJ++ < self._parent.params.showWeekEnds) {
                    sHTML += '<td>' + self._buildCellData(dCur) + '</td>';  
                }
                dCur.changeDate(1);
            }
            sHTML += '</tr></tbody></table></div>';
            dMonth.changeMonth(1);
        }
        self._div.html(sHTML);
    }    
    
    self._buildCellData = function(dCur) {
        var aResult = self._parent._events.getDayEvents(dCur, true),
            sHTML = '';
        for (var nJ = 0; nJ < aResult.length; nJ++) {
            sHTML += self._buildElenent(aResult[nJ], dCur);
        }
        return sHTML;
    }
    
    self._buildElenent = function(aEl, dCur) {
        var sHTML = '',
            aCalendar = aEl.getCalendar(), //self._parent._calendars.getCalendar(aEl.calendarid),
            sSpecColor = (aEl.specColor != undefined 
                    ? self._parent._calendars.getTextSpecialColor(aEl.calendarid, aEl.specColor)
                        .htmlspecialchars().trim()
                    : ""
                );
        sHTML = '<div class="_el">'
            + ((!aEl.allDay  || !aEl.dateEnd.isSameDay(aEl.dateStart))
                ? 
                '<span class=_time>' 
                + (aEl.allDay 
                    ? aEl.dateStart.format(self._parent.options.format['date'])
                        + " &ndash; " 
                        + aEl.dateEnd.format(self._parent.options.format['date'])
                    : (aEl.dateStart.format(self._parent.options.format[!dCur.isSameDay(aEl.dateStart) ? 'datetime' : 'hourTitle'])
                        + ' &ndash; '
                        + aEl.dateEnd.format(self._parent.options.format[dCur.isSameDay(aEl.dateEnd) ? 'hourTitle' : 'datetime'])
                    )
                )
                + '</span>'
                : ""
            )
            + '<b '
                + (aEl.specColor != undefined && aEl.specColor.indexOf('_spec_reccuring') >= 0 ? 'class="_spec_reccuring"' : "")
                + ' >'
                + (aCalendar.titleHTML !== true ? aEl.title.htmlspecialchars() : aEl.title)
                + '</b>'
                + '<i>(' 
                    + aCalendar.name.htmlspecialchars()  
                    + (sSpecColor != '' ? ': ' + sSpecColor : "")
                + ')</i>'
                + (self._params.agenda === true ? self._buildAgenda(aEl) : '')
            + '</div>';
    
            return sHTML;
    }
    
    self._buildAgenda = function(aEl) {
        return aEl.getAdditionalTitle({"label" : "<u class='_field'>", "value" : "<u>", "split" : ": ", "line" : "<br>", "html" : true});
    }
    
    self._closeAction = function(){
        self._prepareClasses(false);
        self._parent.hidePopup();
    }
    
//    self._printAction = function(){
//        window.print();
//    }
    
    
    self._printAction = function(){
        var aCSS = self._parent.layout.getCSSCOlor(),
            sCSS = '';
        for(var sSelector in aCSS) {
            sCSS += sSelector + '{' + aCSS[sSelector] + '}' + "\n";
        }
        var 
            oWin = self._parent.options.anyIE ? self._dom.frame[0].contentDocument : self._dom.frame[0].contentWindow,
            sHTML = '<html><head>' 
                + '<link href="' + self._parent.options.staticUrl + '/css/print/default.css" media="all" rel="stylesheet" type="text/css"/>'
//                + '<link href="' + self._parent.options.staticUrl + '/css/jq..css" media="all" rel="stylesheet" type="text/css"/>'
                + '<style>'
                    + '.JQ_CA{' 
                        + 'font-size:12px;'  + "\n"
                        + 'font-family: Arial,Helvetica,sans-serif;' + "\n"
                        + 'font-size: 12px;' + "\n"
                        + 'color: #555555;' + "\n"
                    + '}' + "\n" 
                    //+ '.events .evt > span{background-color:#777}' + "\n" 
                    + sCSS
                +' </style>'
                + '</head>'
                + '<body ' 
                + (self._parent.options.anyIE && false ? '' : 'onload="printFrame()" ' )
                + '>'
                + '<div class="JQ_CA"><div class="CA_popup _full show">'
                + self._div[0].outerHTML
                + '</div></div>'
                //+ (self._parent.options.anyIE ? '<script>self.focus();print();<script>' : '')
                + '<script>'
                + (self._parent.options.anyIE
                    ? 'function doPrint(){self.focus();self.print();}' + "\n"
                        + 'function printFrame(){setTimeout(doPrint, 1000);}'  + "\n"
                    : 'function printFrame(){'
                        + "window.print();" + "\n"
                        + '}' + "\n"
                    )
                + '</script>'
                + '</body>'
                + '</html>';
//        console.log(oWin, self._div);
        if (self._parent.options.anyIE) {
            oWin.write(sHTML);
            oWin.close();
//            alert('3');
            //self._dom.frame[0].focus();
            //self._dom.frame[0].print();
//            oWin.focus();
//            window.print();
//            self._dom.frame[0].src= "javascript:'" + sHTML + "';print();";
        } else {
            oWin.document.write(sHTML);
            oWin.document.close(); //important!
            oWin.focus(); //IE fix
        }
        //oWin.print();
    }
    
    
    
    self._settingsAction = function(){
        self._dom.panel.toggleClass('_on');
    }
    
    
    self._okAction = function() {
        self._dom.panel.removeClass('_on');
        var aParams = {};
        self._period.min.setTime(Date.preParse(self._dom.panel.find('input[name="from"]').val(), self._parent.options.format['date']).resetHours().getTime());
        self._period.max.setTime(Date.preParse(self._dom.panel.find('input[name="to"]').val(), self._parent.options.format['date']).resetHours().getTime());
        self._emptyUsers = self._dom.panel.find('input[name="empty_swimlane"]').is(':checked');
        
        if (self._params.mode === 'table') {
            self._period.min.setDate(1);
            self._period.min.resetFirstWeekDay(self._parent.params.startWeekDay);
            self._period.max.changeMonth(1).setDate(0);
        }
        
        if (self._period.min > self._period.max) {
            Date.swap(self._period.min, self._period.max);
        }
        
        view.showData();
        
    }
    
    self._prepareClasses = function(bOn) {
        bOn = bOn || false;
        if (bOn)  {
            changeCssClass('@page', 'size: ' + (self._parent._currentModeName == 'month' ? 'landscape' : 'portrait'));
        } else {
            removeCssClass('@page');
        }
        jQuery('body').toggleClass('ca_print_body', bOn);
        if (self._parent._dom.el.hasClass('CA_msie')) {
            jQuery('body').toggleClass('CA_msie', bOn);
        }
//        console.log(self._dom.el.parents());
        self._parent._dom.el.parents().not('body').toggleClass('_ca_print_hide_off', bOn);
        self._parent._dom.el.parents().not('body').siblings().toggleClass('_ca_print_hide', bOn);
        self._parent._dom.el.siblings().toggleClass('_ca_print_hide', bOn);
        self._parent._dom.el.toggleClass('_maximize', bOn || self._params.maximize);
        self._parent._reResize();
        
        
    }
    
    jQuery.calendarAnything.appendView('print/day', view);
})();