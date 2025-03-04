/* Copyright (c) 2012, SliverLine, JQGantt, d.sorokin */

(function(){
    
    if (jQuery.browser != undefined) {
        var ie11 = !!navigator.userAgent.match(/Trident\/7\./);
        if (ie11 && !jQuery.browser.msie) {
	    jQuery.browser.msie = true;
	    navigator.userAgent += ' msie ';
	}
        return;
    }
     
    var aBrowserCheck = ['webkit', 'opera', 'mozilla', 'msie', 'safari', 'trident/7', 'firefox', 'chrome'],
        aBrowserResult = ['webkit', 'opera', 'mozilla', 'msie', 'webkit', 'msie', 'mozilla', 'webkit'],
        sLowerCase = navigator.userAgent.toLowerCase(),
        bResult;
    jQuery.browser = jQuery.browser || {msie : false, webkit : false, opera : false, mozilla : false, chrome : false};
    for (var nJ = 0; nJ < aBrowserCheck.length; nJ++) {
        bResult = sLowerCase.indexOf(aBrowserCheck[nJ]) >= 0;
        jQuery.browser[aBrowserResult[nJ]] = jQuery.browser[aBrowserResult[nJ]] || bResult;
        if (bResult && jQuery.browser.msie)  {
            if (aBrowserCheck[nJ] == 'msie') {
                jQuery.browser.version = parseInt(sLowerCase.substring(sLowerCase.indexOf(aBrowserCheck[nJ]) + 5));
            } else if (aBrowserCheck[nJ] == 'trident'){
                jQuery.browser.version = 11;
            }
        }
    }
    
})()

jQuery.fn.extend({
    calendarAnything: function(options) {
        return this.each(function() {
            jQuery.calendarAnything.init(this, options);
        });
    }
});

localCA = {
    _data : null,
    options : {
        "device"    : "normal",
        "curBrowser" : "",
        "ie"        : (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) <= 8),
        "anyIE"        : jQuery.browser.msie,
        "ie9"        : (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) <= 9),
        "mac"       : (navigator.platform.indexOf('Mac') > -1),
//        "ie10"      : (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) == 10),
        "mode"      : {
            "day" : {scale : 20},
            "week" : {scale : 33},
            "month" : {scale : 63},
            "quarter" : {scale : 100}
        },
        "css" : "jq-calendar-anything.css",
        "layout" : "ca",
        "getNames" : {
            "event" : "event",
            "calendar" : 'cid',
            "group" : 'cgid',
            "token" : 'token',
            "color" : 'color',
            "objType" : 'objectname',  
            "objName" : 'objectname',
            "objId" : 'rid',
            "nameVisible" : 'selectedids',
            "nameMDelta" : 'mdelta',
            "nameDDelta" : 'ddelta',
            "nameFields" : 'defaultFieldsValues',
            "namePicklist" : 'picklistName'
        },
        "serverEvent" : {
            "visibleCalendars" : "getVisibleCalendars",
            "unVisibleCalendars" : "getUnVisibleCalendars",
            "listCalendars" : "listCalendars",
            "calendars" : "getAllCalendars",
            "saveColor" : 'saveCalendarColor',
            "saveVisibility" : 'saveSelectedCalendars',
            "delCalendar"    : "delCalendar",
            "events" : 'getCalendarEventsForGroup',
            "calendarInfo" : 'getCalendarInfo',
            "update" : 'updateCalendarEvent',
            "copy" : 'copyCalendarEvent',
            "delete" : 'deleteCalendarEvent',
            "detail" : 'detailEventInfo',
            "detail_list" : 'detailEventsInfo',
            "save_settings" : "saveSettings",
            "ical"  : 'getIcal',
            "calendarEditData" : "editCalendar",
            "printImg" : 'saveImage',
            "objectStructure" : "objectStructure",
            "getSettings" : "getSettings",
            "saveSettings" : "saveSpecialSettings"
        },
        "serverUrl" : {
            "default"   : "apex/CA_AjaxResponces.php",
            "event"     : "apex/CA_EventHandler.php"
        },
        "format" : {
            "time" : "hh:ii:ss",
            "date" : "yyyy.mm.dd",
            "datetime" : "yyyy.MM.dd hh:ii:ss",
            "shortDatetime" : "MM/d h(:ii)a",
            "fullDate" : 'mmmm dd, yyyy',
            "monthTitle"  : "mmmm yyyy",
            "shortMonthTitle"  : "mmm yyyy",
            "dateTitle" : "dd.mm",
            "weekTitle" : "",
            "customTitle" : "",
            "hourTitle" : "h(:ii)a"
        },
        "func" : {},
        "staticUrl" : "./new",
        "defaultScrollSpeed" : 150,
        "SA" : true,
        "orgId" : '0',
        "scrollLine" : 0,            //
        "_additionalFilterUrl" : {},
        "offset" : {},
        "detailUrl" : "",
        "nameSpace" : "",
        "scrollWidth" : 0,
        "session"   : '',
        "readonly"  : false,
        "_urlParams" : {},
        "_notify"   : [],
        "_small"    : false,
        "_orient"   : "horizontal",
        "lazy"      : false,
        "agenda"    : null,
        "identity"  : "0",
        "view"      : ""
    },
    text : {
        "week" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "weekShort" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        "month" : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "monthShort" : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "buttons" : {"up" : "Toggle fullscreen", "left" : "Toggle sidebar"}
    },
    eventNames : {
        "click"         : "click",
        "down"          : "mousedown",
        "up"            : "mouseup",
        "longclick"     : "longclick",
        "dblclick"      : "dblclick",
        "contextmenu"   : "contextmenu",
        "resize"        : "resize",
        "move"          : 'mousemove',
        "out"           : "mouseleave",
        "in"            : "mouseenter",
        "leave"         : "mouseleave"
    },
    _defaultView : "month",
    _dom : {},
    _queue : [],
    _queueNS : {},
    _readyInit : false,
    _preInitRequestList : [],
    _aAPICache : {
        "structure" : {}, 
        "objects"   : {}, 
        "simple"    : {}, 
        "simpleDt"  : 0, 
        "recordTypes"           : {},
        "recordTypesDt"         : {},
        "recordTypesDefault"    : {},
        "recordAvailableList"   : {}
    },
    params : {
        "size" : "small",
        "mode" : "month",
        "startWeekDay" : 0,
        "monthWeeks" : 6,
        "monthDayMoreWidth" : "1",
        "eventStyle" : 'none',
        "showWeekEnds" : "7",
        "minMinutePeriod" : "30",
        "startHourPeriod" : "0",
        "stopHourPeriod" : "24",
        "dayModeArea" : "1_2",
        "customMode" : "2w",
        "customModeCols" : 7,
        "customModeRows" : 2,
        "customModeArea" : "1_3",
        "customHourlyArea" : "vert",
        "maximize" : false,
        "noleft" : false,
        "gradient" : "off",
        "logLevel" : "1",
        "endDay" : 0,                // if end date == dd.mm.yyy 00:00:00 - 1 means extend daily bar to next day
        "cacheTime" : 0,             // cache time
        "showTitles"        : 0,
        "barLabelTime"      : "start",
        "insideEdit"        : 0,
        "showAdditionalFields"      : false,
        "ganttSplit"        : "day",
        "ganttPeriod"       : "3",
        "ganttRespectHours" : true,
        "ganttShowUnvisible" : true,
//        "ganttMaxPrintItems"       : "",
//        "ganttPrintOldSchool"      : false,
        "ganttCollapseGroupingByDefault" : false,
        "ganttCollapseFullLine" : true,
        "requestTimeout"    : 25,
        "nonWorkingHoursDisplay" : "hide",
        "showCreatingDates"     : false,
        "showScrollButtons"     : false,
        "rememberTimeScroll"    : false,
        "apiCache"          : "0",
        "loadLastPeriod"    : false,
        "extendendRange"    : true,
        "parallelRequests"  : 10,
        "swimlanePreset"    : false,
        "uiSearch"          : true,
        "uiAdvancedSearch"  : false,
        "uiFilterSets"      : false,
        "uiFilter"          : false,
        "uiCalendar"        : true,
        "uiToday"           : true,
        "confirmDelete"     : false,
        "hideNotify"        : "all",
        "agendaFieldLabels"     : true,
        "swimlaneFieldLabels"   : true,
        "sf1FieldLabels"        : true,
        "swimlaneScrolling" : false,
        "swimlaneCell"      : '100',
        "agendaEmptyDays"   : true,
        "useSFLookup"       : 'auto',
        "weekViewAgenda"    : false,
        "dayViewAgenda"     : 'default',
        "fastStart"         : false,
        "addons"            : "",
        "swimlaneDefaultGroupBy"        : "",
        "swimlaneDefaultPeriod"         : "hour",
        "swimlaneEnableGroupBy"         : true,
        "swimlaneDisplayStartEndDate"   : true,
        
        "lang"              : "en",
        "printAsImage"      : false,
        "agendaPrintCurrentMonth" : false,
        'respectReminderDD' : 'ca', // change reminder during Drag&Drop
        'longClick'         : false,
        "displayTimeZone"   : false,
        "displayNewICAL"    : true,
        "multiContactsInEvent" : false,
        "layoutTheme"         : "default",
        "swimlaneOneDayAllDay"   : true
//        "timeZoneMinutes"   : "-"
//        "design"        : "classic"
    },
    _checkParamsDefaults : ['swimlaneDefaultGroupBy'], //, 'swimlaneDefaultPeriod'
    _skipUserSettings : ['maximize', 'noleft'],
    _visibleElements : [],
    _urlParams : {},
    _calendars : {},
    _view           : {},
    _viewFunc       : {},
    _viewInitFunc   : {},
//    _addon          : {},
    _addons         : {"chatter" : {title : "Chatter", module : null, settings : {}},
                        "invite" : {title : "Invitees", module : null, settings : {}, 'auto' : true},
                        "attach" : {title : "Attachment", module : null, settings : {}}
                    },
    _viewSettings : {},
    _nAjaxLoading : 0,
    _aLoadedScripts : [],
    _aLoadedCSS : [],
    _nMaxLineCss : 0,
    _nEventLoading : 0,
    _currentModeName : null,
    _startModeName : null,
    controller : null,
    lighthning : null,
    aCalculated : {
        "startHour"     : 0, 
        "stopHour"      : 24,
        "compactWidth"  : false,
        "compactHeight" : false,
        "SF1Header"     : 0,
        "lightning"     : false,
        "timeZoneMinutes" : "-"
    },
    _text : {},
    user : "",
    profile : {},
    

    init : function (el,  options){
        var self = localCA;
        
        if (typeof(options.visible) != 'undefined' && options.visible.length > 0) {
            self._visibleElements = self._visibleElements.concat(options.visible);
        }
        if (typeof(options.date) != 'undefined' && options.date != '') {
            self.options.current = new Date(options.date);
        }
        if (typeof(options.filter) != 'undefined' && jQuery.isPlainObject(options.filter) != '') {
            self.options._additionalFilterUrl = options.filter;
        }
        jQuery.extend(self.options, options);
        if (document.location.href.indexOf('ca_debug') >= 0) {
            self.options.debug = true;
        }
        self._dom.el = jQuery(el);
        
        if (jQuery.browser.msie) {
            self._dom.el.addClass('CA_msie');
        }
        
        var aQ = [
            function(){
                self._initScripts('/plugin/array-x.js');
            },
            function(){
                if (typeof(options.userSettings) != 'undefined') {
                    jQuery.each(options.userSettings, function(sKey, mVal){

                        if (sKey == 'maximize' || sKey == 'noleft') {
                            options.userSettings[sKey] = undefined;
                            return;
                        }
                        if (typeof(self.params[sKey]) != 'undefined') {
                            mVal = typeof(mVal) == 'string' && mVal.match(/^[0-9]+$/)!= null
                                ? parseInt(mVal) 
                                : mVal;

                            self.params[sKey] = mVal;
                        } else {
                            if (sKey == 'compactMobile') {
                                self.options.compactMobile = mVal || mVal == 'true';
                            }
                            if (sKey == 'debug') {
                                self.options.debug = mVal || mVal == 'true';
                            }
                        }
                    });
                } else if (self.options.lighthning != undefined) {
                    self._request({"data" : {},"requestType" : "getUserSettings", "jsRemote" : true}, 
                        function(data) {
                            options.userSettings = data;
                            self.options.userSettings = options.userSettings;
                        });
                } else {
                    options.userSettings = {};
                    self.options.userSettings = options.userSettings;
                };
            },
            function(){
                var sView = (typeof(self.options.view) != 'undefined' && self.options.view != '') 
                    ? self.options.view
                    : (self.options.userSettings != undefined && self.options.userSettings.mode != undefined
                        ? self.options.userSettings.mode
                        : self._defaultView
                    );

                if (sView != '') {
                    if (sView.indexOf('list') >= 0) {
                        sView = sView.replace('list', '');
                        self.options.agenda = true;
                    }
                    if (typeof(self.options.userSettings) == 'undefined') {
                       self.options.userSettings = {};
                    }
                    self._currentModeName = sView;
                    self.params.mode = sView;
                    if ((typeof(self.options.view) != 'undefined' && self.options.view != '')) {
                        self.options.userSettings.mode = sView;
                    }
                }
            }
        ]
        self._addQueue(aQ);
//        self._checkUserSettings(options);
        self._postAuth();
    },
    
    _postAuth : function() {
        var self = localCA;
        self._addQueue([
            self._initScripts,
            self._parseUrl,
            self._isPhone,
            self._restoreParams,
            self._initLang, 
            self._initModel, 
            self._buildDom, 
            self._initBaseCSS,
            self._initInterface,
            self._initExternalAPI,
            self._showData,
            self.showNotify,
            self._lazyLoad
        ]);
    },
    
    waitQueue : function(nWhat){
        var self = localCA;
        self._nAjaxLoading += nWhat;
        if (self._nAjaxLoading < 0) {
            self._nAjaxLoading = 0;
        } else if (self._nAjaxLoading == 0){
            self._dom.el.removeClass('CA_loading');
            self._runQueue();
        } else if (self._nAjaxLoading  > 0) {
            self._dom.el.addClass('CA_loading');
        }
    },

    _requestFinish : function(nTimer, sName, bContinue) {
        var self = localCA;
        if (nTimer != null) {
            clearTimeout(nTimer);
            nTimer = null;
        }
        if (bContinue !== false) {
            self.waitQueue(-1);
        }
    },
    
    _request : function(method, success, sName){
    
        sName = sName || 'global';
        var self = localCA,
            requestData = method.data,
            nTimer = null,
            oJQXHR;
        self.waitQueue(1);
        if (method.requestType != undefined) {
            requestData[self.options.getNames.event] = method.requestType;
            if (self.options.debug) {
                requestData['ca_debug'] = 'debug';
            }
        }
        var sUrl = method.serverPath != undefined 
            ? self.options.serverUrl[method.serverPath]
            : self.options.serverUrl['default']
        if (method.url != undefined ) {
            sUrl = method.url;
        }
        
//        self.log('AJAX data ' + sUrl);
        var sRequestType = method.type != undefined ? method.type : 'json',
            sRealRequestType = sRequestType == 'json' 
                ? 'text' 
                : sRequestType,
            sType = method.HTTPType ? method.HTTPType : (method.post ? "POST" : "GET");
        if (self.options.nameSpace != '' 
            && sRequestType == 'json'
            && (self.options.controller == undefined  || self.options.controller == null)
            && (self.options.lighthning == undefined  || self.options.lighthning == null)
        ) {
            sRealRequestType = 'jsonp';
            sRequestType = 'jsonp';
        }
        
        var bAjaxError = false, bFailError = false; // one of the error (XHR.fail / ajax.error) already reduce the queue
        var aAjaxParams = {
            url: sUrl,
            data: requestData,
            success: function(data, sTextStatus, oRequest){
                if (sRequestType == 'json' && (sTextStatus != 'notmodified' || (data != undefined && data.trim() != '') )) {
                    
                    try {
                        if (method.jsonp != undefined) {
                            data = callbackFnData;
                        } else {
                            data = jQuery.parseJSON(data);
                        }
                    } catch (oError) {
                        var sErrorText = '';
                        jQuery(data).find('[id*="theErrorPage"]').each(function(){
                            var sError = jQuery(this).text();
                            if (String.trim(sError) != '') {
                                sErrorText += (sErrorText != '' ? " | " : "") + String.trim(sError);
                            }
                        });
                        
                        data = undefined;
                        self.showNotify('Server response error : ' 
                            + oError.message 
                            + (sErrorText != '' ? "<br>" + sErrorText : "")
                            , true
                        );
                    }
                    if (data != undefined && data.status != undefined) {
                        if (typeof(data.status) == 'string' && data.status.substr(0, 6) == 'Error:') {
                            self.showNotify('Server response error : ' + data.status.substr(7), true);
                        }
                    }
                }
                
                if (( (data !== undefined && data !== null) || sTextStatus == 'notmodified' || sTextStatus == 'success') 
                    && typeof(success) == 'function'
                )  {
                    success(data, sTextStatus, oRequest, method);
                }
            },
            error : function(jqXHR, sStatus, sThrown) {
                self.log('error! ' + sStatus
                    + (jqXHR != null ? 
                        ' / ' 
                        + 'HTTP STATUS: ' + jqXHR.status + ' / '
                        + 'STATUS TEXT: ' + jqXHR.statusText + ' / '
                        + 'Ready state: ' + jqXHR.readyState + ' / '
                        + 'Response Text : ' + (jqXHR.responseText != undefined ? jqXHR.responseText : 'FAIL')
                    : '')
                );
                if (method.error != undefined) {
                    method.error(jqXHR, sStatus);
                }
                bAjaxError = true;
            },
            dataType : sRealRequestType,
            type     : sType,
            headers : method.headers != undefined ? method.headers : null,
            complete : function(jqXHR, sStatus, sThrown) {
                self._requestFinish(nTimer, sName, !bFailError);
            }
        }
        
        if (method.cache === false) {
            aAjaxParams.cache = false;
        }
        
                
        if (method.crossDomain === true) {
            aAjaxParams.crossDomain = true;
        }
        
        if (typeof(self.options.func.request) != 'undefined') {
            var mResult = self.options.func.request(aAjaxParams);
            if (mResult === false) {
                self._requestFinish(nTimer, sName);
                return;
            }
        } else if (self._readyInit == false) {
            self._preInitRequestList.push(aAjaxParams);
        };
        
        if (self.options.controller != null && method.jsRemote === true && sUrl.indexOf('.php') < 0) {
            
            var aSplitParams = self._splitDataByType(requestData);
            if (window.Visualforce != undefined && self.params.requestTimeout > 0 
                && parseInt(window.Visualforce.remoting.timeout) != self.params.requestTimeout * 1000
            ) {
                window.Visualforce.remoting.timeout = self.params.requestTimeout * 1000;
            }
            self.options.controller.remoteCAActions(aSplitParams.zero, aSplitParams.one, aSplitParams.two, 
                function(data, evt){
                    if (evt.status && data !== undefined && data != null) {
                        aAjaxParams.success(data
//                            .replace(/&lt;/g, '<')
//                            .replace(/&gt;/g, '>')
//                            .replace(/&quot;/g, '"')
//                            .replace(/&amp;/g, '&')
                        );
                    } else {
                        if (evt.message !== undefined) {
                            self.showNotify('Remote response error : ' + evt.message, true);
                            if (evt.message.indexOf('Remoting request invalid for your session') >= 0) {
                                if (typeof(Visualforce.remoting.Manager) != 'undefined') {
                                    var aProviderKeys = Array.objectKeys(Visualforce.remoting.Manager.providers);
                                    for (var nProvider = 0; nProvider < aProviderKeys.length; nProvider++) {
                                        Visualforce.remoting.Manager.providers[aProviderKeys[nProvider]].refresh();
                                    }
                                }
                                
                            }
                            
                        }
                        aAjaxParams.error(null, 'Response is empty');
                    }
                    self._requestFinish(nTimer, sName);
                }, 
                {
                    buffer : false,
                    escape : false
                }
            );
            return;
        } else if (self.options.lighthning != null && method.jsRemote === true) {
            var aSplitParams = self._splitDataByType(requestData);
            self.options.lighthning.action.setParams({
                sZero : JSON.stringify(aSplitParams.zero), 
                sOne : JSON.stringify(aSplitParams.one), 
                sTwo : JSON.stringify(aSplitParams.two)
            });
            self.options.lighthning.action.setCallback(this, function(oResponse) {
                var sState = oResponse.getState();
                if (sState === "SUCCESS") {
                    aAjaxParams.success(oResponse.getReturnValue());
                } else if (sState === "ERROR") {
                    var aErrors = oResponse.getError();
                    if (aErrors) {
                        if (aErrors[0] && aErrors[0].message) {
                            aAjaxParams.error(null, aErrors[0].message);
                        }
                    } else {
                        aAjaxParams.error(null, 'Lighthning error');
                    }
                }
                self._requestFinish(nTimer, sName);
            });
            self.options.lighthning.queue.enqueueAction(self.options.lighthning.action);
            self.options.lighthning.queue.run(function(){});
            return;
        }
        
        nTimer = setTimeout(function(){
            self.showNotify('HTTP request error: ' + sUrl, true);
            self._requestFinish(nTimer, sName);
        }, self.params.requestTimeout * 1000);
        oJQXHR = jQuery.ajax(aAjaxParams);
        
        oJQXHR.fail(function(){
            self.showNotify('HTTP request error: ' + sUrl, true);
            self._requestFinish(nTimer, sName, !bAjaxError);
            bFailError = !bAjaxError;
        });
        //self._addXHR(oJQXHR);
    },
    
    _splitDataByType : function(aData) {
        var aResult = {
                zero : {},
                one : {},
                two : {}
            },
            aKeys = Array.objectKeys(aData),
            aSubVals, 
            aSubKeys, 
            mVal;
        for (var nI = 0; nI < aKeys.length; nI++) {
            if (jQuery.isPlainObject(aData[aKeys[nI]]) || jQuery.isArray(aData[aKeys[nI]])) {
                aSubKeys = jQuery.isPlainObject(aData[aKeys[nI]]) 
                    ? Array.objectKeys(aData[aKeys[nI]])
                    : Array.build(0, aData[aKeys[nI]].length);
                for (var nJ = 0; nJ < aSubKeys.length; nJ++) {
                    mVal = aData[aKeys[nI]][aSubKeys[nJ]];
                    if (jQuery.isPlainObject(mVal) || jQuery.isArray(mVal)) {
                        if (aResult.two[aKeys[nI]] === undefined) {
                            aResult.two[aKeys[nI]] = {};
                        }
                        aResult.two[aKeys[nI]][aSubKeys[nJ]] = jQuery.isArray(mVal) 
                            ? mVal.numerize() 
                            : mVal;
                    } else {
                        if (aResult.one[aKeys[nI]] === undefined) {
                            aResult.one[aKeys[nI]] = {};
                        }
                        aResult.one[aKeys[nI]][aSubKeys[nJ]] = mVal;
                    }
                }
            } else if (jQuery.isArray(aData[aKeys[nI]])){
                aResult.one[aKeys[nI]] = aData[aKeys[nI]].numerize();
            } else {
                aResult.zero[aKeys[nI]] = aData[aKeys[nI]];
            }
        }
        return aResult;
    },
    
    loadCss : function(sCssUrl, fFunc) {
        var self = localCA, sRealUrl = sCssUrl;
        sCssUrl = sCssUrl || self.options.css;
        if (self.options.ie9 && sCssUrl.indexOf('jq-calendar-anything') < 0) {
            sCssUrl = '/css/ie9.all.css';
        }        
        sCssUrl = self.options.staticUrl + sCssUrl; 
        
        
        
        if (self._aLoadedCSS.indexOf(sCssUrl) >= 0) {
            return;
        }
        self._aLoadedCSS.push(sCssUrl);
        var sCache = self.options.debug ? '?' + Math.random() : '';
//        if (jQuery.support.style){
        if (!jQuery.browser.msie || jQuery.browser.version > 8){
            jQuery('<link rel="stylesheet" type="text/css" />')
                .appendTo(jQuery('head'))
                .attr('href', sCssUrl + sCache);
            
        } else {
//            What corect for IE?
            if (document.createStyleSheet){
                document.createStyleSheet(sCssUrl + sCache);
            }
        }
        var nCounter = 0;
        if (fFunc != undefined) {
            var checkFunc = function (){
                if (nCounter++ > 20) {
                    return fFunc();
                }
                for (var nI = 0; nI < document.styleSheets.length; nI++){
                    var sRef = document.styleSheets[nI].href;
                    if (sRef !== null && sRef.indexOf(sRealUrl) >= 0) {
                        return fFunc();
                    }
                }
                setTimeout(checkFunc, 50);  
            }
            setTimeout(checkFunc, 50);
        }
    },
    
    _initScripts : function(sScriptPath, aJSParams){
        var self = localCA,
            aScripts, sRealPath,
            fCheck = null;
        
        
        if (sScriptPath == undefined) {
            aScripts = [
                '/plugin/date-x.js', 
//                '/plugin/array-x.js', 
                '/plugin/debug-x.js', 
                '/plugin/style-x.js', 
                '/plugin/jquery.mousewheel.js',
                '/model/events.model.js',
                '/model/calendars.model.js',
                '/model/objects.model.js',
                '/plugin/jquery.getscrollbarwidth.js',
                '/view/' + self.options.layout + '.layout.js'
            ];
        } else {
            aScripts = [sScriptPath];
        }
        self._dom.el.addClass('CA_loading');
        self.waitQueue(aScripts.length);
        
        if (aScripts.length == 1 && aJSParams != undefined && typeof(aJSParams.checkContinue) == 'function'){
            var nCounter = 0;
            fCheck = function(){
                if (!aJSParams.checkContinue() && nCounter++ < 10) {
                    setTimeout(fCheck, 200);
                    return;
                }
                self.waitQueue(-1);
            }
        }
        var cacheOption = {
            cache : !self.options.debug,
            success : function(data, textStatus, jqXHR){
                    if (fCheck != null){
                        fCheck();
                    } else {
                        self.waitQueue(-1);
                    }
                },
            error : function(jqXHR, sStatus, sThrown) {
                self.log('error! ' + sStatus + ' / ' 
                    + 'HTTP STATUS: ' + jqXHR.status + ' / '
                    + 'STATUS TEXT: ' + jqXHR.statusText + ' / '
                    + 'Ready state: ' + jqXHR.readyState + ' / '
                    + 'Response Text : ' + jqXHR.responseText
                );
            },
            complete : function(jqXHR, sStatus){
                if (sStatus != 'success') {
                    self.log('complete ! ' + sStatus);
                }
            },
            crossDomain : true
        };
        
        for (var i = 0; i < aScripts.length; i++) {
            sRealPath = aScripts[i].substr(0, 2) == '//' 
                ? aScripts[i].substr(1)
                : (aScripts[i].substr(0, 4) == 'http' 
                    ? aScripts[i]
                    : self.options.staticUrl + aScripts[i]
                );
            self.log(sRealPath);
            self._cachedScript(sRealPath, cacheOption);
        }
    },
    
/** Cache script loading
*   Used for cachable loading , taken fro jQuery web site
* */

    _cachedScript : function(url, options) {
            // allow user to set any option except for dataType, cache, and url
        var self = localCA;
        if (jQuery.inArray(url, self._aLoadedScripts) >= 0) {
            if (typeof(options.success) != 'undefined') {
                options.success();
            }
            return;
        }
        
        self._aLoadedScripts.push(url);
        
        options = jQuery.extend({
            dataType: "script",
            cache: true,
            url: url
        }, options || {});
        if (options.cache) {
            self.log(' cached sxript ' + options.url);
            // Use $.ajax() since it is more flexible than $.getScript
            // Return the jqXHR object so we can chain callbacks
//            console.log(options);
            return jQuery.ajax(options);
        } else {
            var head = document.getElementsByTagName('head')[0];
            var script= document.createElement('script');
            script.onreadystatechange = function () {
                self.log(this.readyState);
                if (this.readyState == 'complete' 
                    || (self.options.ie && this.readyState == 'loaded')) {
                    if (this.readyState == 'loaded') {
                        setTimeout(function(){
                            options.success();
                        }, 0);
                    } else {
                        options.success();
                    }
                    
                    
                }
            }
            script.onload = options.success;
                        
            script.src = url + (!options.cache ? '?' + Math.random() : "");
	         
            head.appendChild(script);
                        
        }
    },



/* Queue methods
 * Used for organization lazzy loading and dependency execution
 * */
    _runQueue : function(params, sName) {
        var self = localCA;
        sName = sName || 'global';
        if (typeof(params) == 'object'){
            self._addQueue(params, false, sName);
        }
        
        if (self._queue[sName].length == 0){
            return false;
        }
        do{
            try {
                var oFunc = self._queue[sName].shift();
                if (jQuery.isArray(oFunc)) {
                    if (oFunc.length > 1) {
                        oFunc[0](oFunc[1]);
                    } else {
                        oFunc[0]();
                    }
                } else if (jQuery.isFunction(oFunc)) {
                    oFunc();
                }
            } catch(e) {
                console.error(e);
            }
        } while (self._queue[sName].length > 0 && self._nAjaxLoading == 0);
        
    },
    
    _addQueue : function(params, bNeedToStart, sName) {
        var self = localCA;
        sName = sName || 'global';
        if (self._queue[sName] == undefined) {
            self._queue[sName] = [];
        }
        bNeedToStart = bNeedToStart == undefined || bNeedToStart == null
            ? self._queue[sName].length == 0 && self._nAjaxLoading == 0
            : bNeedToStart;
        
        
        if (jQuery.isArray(params)) {
            jQuery.each(params, function(key, el){
                self._queue[sName].push(el);
            });
        } else if (jQuery.isFunction(params)) {
            self._queue[sName].push(params);
        }
        if (bNeedToStart) {
            self._runQueue(null, sName);
        }
    },
    
    _prependQueue : function(params, bNeedToStart, sName) {
        var self = localCA;
        sName = sName || 'global';
        if (self._queue[sName] == undefined) {
            self._queue[sName] = [];
        }        
        bNeedToStart = bNeedToStart == undefined || bNeedToStart == null
            ? self._queue[sName].length == 0 && self._nAjaxLoading == 0
            : bNeedToStart;
        if (jQuery.isArray(params)) {
            jQuery.each(params, function(key, el){
                self._queue[sName].unshift(el);
            });
        } else if (jQuery.isFunction(params)) {
            self._queue[sName].unshift(params);
        }
        if (bNeedToStart) {
            self._runQueue(null, sName);
        }
        
    },
    
    _clearQueue : function(){
        var self = this;
        self._nAjaxLoading = 0;
        if (self._queue['global'].length > 1) {
            self._queue['global'].length = 1;
        }
        self._runQueue();
    },
    
    _initBaseCSS : function() {
        var self = localCA,
            nScrollBarWidth = jQuery.getScrollbarWidth(),
            aSelector = [], aRules = [];
        aSelector.push(
            '.scroll_width', 
            '.scroll_pos_r', 
            '.scroll_pos_negative_r', 
            '.scroll_pos_negative_b', 
            '.scroll_pad_r', 
            '.scroll_mar_r',
            '.scroll_pos_b',
            '.scroll_mar_b',
            '.scroll_pad_b',
            '.days_right'
        );
        aRules.push(
            'width: ' + nScrollBarWidth + 'px !important;min-width:' + nScrollBarWidth + 'px !important;', 
            'right: ' + nScrollBarWidth + 'px !important', 
            'right: -' + nScrollBarWidth + 'px !important', 
            'bottom: -' + nScrollBarWidth + 'px !important', 
            'padding-right: ' + nScrollBarWidth + 'px !important',
            'margin-right: ' + nScrollBarWidth + 'px !important',
            'bottom: ' + nScrollBarWidth + 'px !important',
            'margin-bottom: ' + nScrollBarWidth + 'px !important',
            'padding-bottom: ' + nScrollBarWidth + 'px !important',
            'width:' + nScrollBarWidth + 'px !important'
        );
//        var aDynamicColors = ['#d24848', '#d2b348', '#89d248', '#48d2a3', '#48b0d2', '#4882d2', '#6548d2', '#cd48d2',
//            '#e11e35', '#d27548', '#d0d248', '#48d24b', '#48d2c3', '#48a6d2', '#4865d2', '#8c48d2'
//        ];    
        var aDynamicColors = ['#ff4040', '#f2ceb6', '#807d60', '#29a65b', '#00eeff', '#001f73', '#8f30bf', '#ff0066',
            '#d97b6c', '#a66c29', '#a0a653', '#bfffd9', '#006dcc', '#0000ff', '#695673', '#cc668f'
        ];    
        for (var nI = 0; nI < 16; nI++ ){
            aSelector.push('.JQ_CA > .CA_l >  div > .list > div > ._special_colors > span > ._sub_dynamic > ._sd_' + nI);
            aSelector.push('.JQ_CA .evt > ._sd_' + nI);
            aRules.push(
                self.options.ie 
                    ? "border-left: 5px solid " + aDynamicColors[nI]
                    : 'box-shadow: -5px 0 0 ' + aDynamicColors[nI],
                'background-color:' + aDynamicColors[nI] + '; color:#' + contrastingColor(aDynamicColors[nI]) + ' !important'
            );
        }
        self.options.scrollWidth = nScrollBarWidth;
        changeCssClass(aSelector, aRules, true);
        self.layout.rememberColor(aSelector, aRules);
        self._reResize(true);
    },
    
    
    
    
    

    _initInterface : function(){
        var self = localCA;
        jQuery(window).on(self.eventNames.resize, function(){
            self._reResize();
        });
        self.layout.initInterface();
        
    },
    
    _cancelBubble : function(evt) {
        evt.cancelBubble = true;
        evt.stopPropagation();
        evt.preventDefault();
        evt.returnValue = false;
        return false;
    },
    
    
    
/*    _getEventBar : function(sEventId) {
        var self = localCA;
        return self._dom.currentMode.children('div.data').find('div[data-week] > div.events > div[data-event="' + sEventId + '"]');
    },
*/

    
    
    
    
    
    /**
     * change date to new for scrolling events
     **/
    
    _initModel : function() {
        var self = localCA;
        self._objects = new objectsModel([], self);
        self._calendars = new calendarsModel([], self);
        self._events = new eventsModel([], self);        
    },
    
    _initLang : function(){
        var self = localCA;
        self._initScripts('/lang/' + self.params.lang + '.lang.js', function(){
            
        });
		
       
    },
    
    _getRequestName : function(sName) {
        var self = localCA;
        if (self.options.getNames[sName] != undefined){
            return self.options.getNames[sName];
        };
        return false;
    },
    
    _getRequestEvent : function(sName) {
        var self = localCA;
        if (self.options.serverEvent[sName] != undefined){
            return self.options.serverEvent[sName];
        };
        return false;
    },
    
/**
* Build DOM and all visual elements
**/
    
    _buildDom : function() {
        var self = localCA;
        self.layout.init(self);
    },
    
    
    _showData : function() {
        var self = localCA;
        self.toggleMode(self.params.mode, true);
    },
    
    _reResize : function(exec) {
        var self = localCA;
//        if (typeof(sforce) != 'undefined' && typeof(sforce.one) != 'undefined' && self.aCalculated.SF1Header <= 0) {
//            self.aCalculated.SF1Header = screen.height - self._dom.el.height();
//        }
        exec = exec || false;
        self.options.offset = self._dom.el.offset();
        self._dom.el.data('offset', self.options.offset); 
        if (!exec) {
            if (self._dom.el.data('resizeTimer')) {
                clearTimeout(self._dom.el.data('resizeTimer'));
            }
            self._dom.el.data('resizeTimer', setTimeout(
                function(){
                    self._reResize(true)
                }, 
                1000)
            );
            return;    
        }
        
        var nHeight = parseInt(self._dom.el.height() * 0.9) - 125,
            nWidth = parseInt(self._dom.el.width());
        changeCssClass('.JQ_CA .CA_create_event > .fields ', 'max-height: ' + nHeight + 'px;');
        self._dom.el.toggleClass('_compact_width', nWidth <= 1024);
        self._dom.el.toggleClass('_compact_height', nHeight <= 400);
        self.aCalculated.compactWidth   = nWidth <= 1024;
        self.aCalculated.compactHeight  = nHeight <= 400;
        var bLightning = self._dom.el.hasClass('CA_LIGHTNING') 
            || self._dom.el.parents('.CA_LIGHTNING').size() > 0
            || self.getParam('layoutTheme', '') == 'lightning';
        if (bLightning != self.aCalculated.lightning) {
            self.aCalculated.lightning = bLightning;
            if (self.aCalculated.lightning) {
                self._dom.el.addClass('CA_LIGHTNING');
                self.loadCss('/css/ca-lightning.css');
            }
        }
        self._checkSmallDevice();
        self.checkPopupVisiblility();
    },
    
    _checkSmallDevice : function() {
        var self = localCA,
            bOldSmall = self.options._small,
            sOldOrient = self.options._orient;
        
        self.options._orient = self._dom.el.height() < self._dom.el.width() ? 'horizontal' : "vertical";
//        alert(self.options._orient + ' / ' + self._dom.el.height() + ' / ' + self._dom.el.width());
        if (sOldOrient != self.options._orient) {
            self._dom.el.removeClass('_orient_' + sOldOrient).addClass('_orient_' + self.options._orient);
        }
        var bNewSmall = self.options._emulateSmall === true
            || self._dom.el.width() < 767 
            || (self.isMobile() 
                && self.options.deviceReal != 'ipad' 
                && self._dom.el.width() < 801
            );
        if (bNewSmall && !self.options._small) {
            self._dom.el.addClass('_small'); //_maximize _noleft
            self._dom.el.removeClass('_noleft');
            self.options._small = true;
            if (self.options.userSettings == undefined) {
                self.options.userSettings = {};
            }
            if (self.options.compactMobile) {
                self._dom.el.addClass('_compactMobile'); 
            }
            self.options.userSettings.size = 'middle';
        } else if (self.options._small && !bNewSmall ) {
            if (self.params['noleft'] === true) {
                self._dom.el.addClass('_noleft');
            }
            self._dom.el.removeClass('_small');
            self.options._small = false;
        }
/*        if (self.options._small && typeof(sforce) != 'undefined' && typeof(sforce.one) != 'undefined' && self.aCalculated.SF1Header > 0) {
            var nRatio = window.devicePixelRatio || 1,
//                nDeviceWidth = screen.width * nRatio,
//                nDeviceHeight = screen.height * nRatio,
                oParent = self._dom.el.parent();
//            alert('size CA w:' + self._dom.el.width() + ' / ' + ' h: ' + self._dom.el.height() 
////                    + ' / SF1 w : ' + window.top.document.body.offsetWidth
////                    + ' h: ' + window.top.document.body.offsetHeight
//                    + ' / Device w: ' + nDeviceWidth + '(' + screen.width + ')'
//                    + ' h: ' + nDeviceHeight + '( ' + screen.height + ') '
//                    + ' ratio: ' + nRatio
//                    + ' / header ' + self.aCalculated.SF1Header
//                    + ' / bottom : ' + oParent.css('bottom')
//            );
            if (self.options._orient == 'horizontal' 
                && self._dom.el.height()  + self.aCalculated.SF1Header > screen.height + 50
            ) {
                oParent.height(screen.height - self.aCalculated.SF1Header);
                oParent.css('bottom', 'auto').css('min-height', '0');
//                alert(' Parent' + oParent.height());
            } else if (oParent.css('bottom') == 'auto') {
                oParent.height('auto');
                oParent.css('bottom', '0').css('min-height', '500px');
//                alert('rotate back');
                self._reResize(true);
            }
            
        }*/
        
        var oView = self._getView();
        if (oView != null && oView.resize != undefined) {
            oView.resize(bOldSmall != self.options._small, sOldOrient != self.options._orient);
        }
    },
    
    /**
     * showPopup
     * Show popup window
     * @param options JSON
     *      noLeave  - if true does not hide popup on mouseleave
     *      autohide - if false does not hide popup on mouseleave
     *      positionElement - element to wich popup linked top / left position
     *      coords - real coordinates of top left
     *      event - event which call popup
     *      html - HTML to insert into popup
     *      dom - jQuery / DOM object to insert into popup
     *      onClose - function to run after close
     *      onCancel - function to run after cancel
     *      onShow - function to run  after show
     *      slide - slide from some direction (bottom)
     *      fullScreen - show popup on full screen
     * @return void
     **/
   
    showPopup : function(options) {
        var self = localCA;
        options : options || {};
        if (typeof(self._dom.popup) == 'undefined') {
            var _popupLeave = function(evt){
                if (self.isMobile() || 
                    (self._dom.popup.data('options')['noLeave'] === true || self._dom.popup.data('options')['autohide'] === false)
                ) {
                    return;
                }
                self._dom.popup.data('timer', setTimeout(
                    function() {
                        self.hidePopup()
                    }, 1000)
                );
                self._dom.popup.one('mouseenter.CA_popup', _popupEnter);
            }

            var _popupEnter = function(evt) {
                if (typeof(self._dom.popup.data('timer')) != 'undefined') {
                    clearTimeout(self._dom.popup.data('timer'));
                    self._dom.popup.data('timer', null);
                }
            }            
            
            
            self._dom.popup = jQuery('<div class=CA_popup tabindex="99">');
            self._dom.popup_shadow = jQuery('<div class=CA_popup_shadow>');
            self._dom.el.append(self._dom.popup).append(self._dom.popup_shadow);
            self._dom.el.data('offset', self._dom.el.offset()); 
            self._dom.popup
                .on('mouseleave.CA_popup', _popupLeave)
                .on(self.eventNames.click, '.close', function(){
                    self.hidePopup();
                })
                .on(self.eventNames.click, '[data-action]', function(event) {
                    var mReturn = self._dom.popup.data('options')['view'].action(
                        jQuery(this).data('action'), 
                        self._dom.popup.data('options')['linkedEl'],
                        event
                    );
                    if (mReturn === false) {
                        return self._cancelBubble(event);
                    }
                }).on('keyup', function(evt) {
                    var oClickEl = jQuery(evt.target);
                    if (evt.keyCode != 27 || ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(oClickEl[0].tagName) >= 0){
                        return;
                    }
                    self.hidePopup();
                });
            self._dom.popup_shadow.on(self.eventNames.click, function(evt){
                if (self._dom.popup.data('options')['modal'] === true) {
                    return;
                }
                self.hidePopup();
            });
                        
        }
        if (typeof(self._dom.popup.data('timer')) != 'undefined') {
            clearTimeout(self._dom.popup.data('timer'));
        }
        self._dom.popup_shadow.removeClass('show');
        self._dom.popup.data('options', options)
            .toggleClass('_no_overflow', options.overflow === false)
            .removeClass('_center')
            .toggleClass('_full', options.fullScreen === true);
        
        self._dom.el.toggleClass('_ie_maximize_popup', options.fullScreen === true && self.options.anyIE === true);
        var newPos = {'right' : "auto", "bottom" : "auto", "top" : "auto", "left" : "auto"};
        var CAOffset = self._dom.el.data('offset');
        if (options.fullScreen === true) {
            newPos = {'right' : "", "bottom" : "", "top" : "", "left" : ""};
        } else if (typeof(options.positionElement) != 'undefined' && options.positionElement != null) {
            var offset = options.positionElement.offset();
            newPos.left = offset.left - CAOffset.left;
            newPos.top = offset.top - CAOffset.top;
        } else if(options.coords != undefined) {
            newPos.left = options.coords.x - CAOffset.left;
            newPos.top = options.coords.y - CAOffset.top;
        } else if (options.event != undefined) {
//            newPos.left = options.event.clientX - CAOffset.left;
//            newPos.top = options.event.clientY - CAOffset.top;
            var nX = options.event.pageX || options.event.originalEvent.pageX,
                nY = options.event.pageY || options.event.originalEvent.pageY;
            newPos.left = nX - CAOffset.left;
            newPos.top = nY - CAOffset.top;
        } else if (options.center === true) {
            self._dom.popup.addClass('_center');
            newPos = {'right' : "", "bottom" : "", "top" : "", "left" : ""};
        }
        if (options.shadow === true) {
            self._dom.popup_shadow.addClass('show');
        }

        if (typeof(options.html) != 'undefined') {
            self._dom.popup.html(options.html);
        }
        
        if (typeof(options.dom) != 'undefined') {
            self._dom.popup.empty().append(options.dom);
        }
        
        if (typeof(options.onClose) != 'undefined') {
            self._dom.popup.data('onClose', options.onClose);
        }
        
        if (typeof(options.onCancel) != 'undefined') {
            self._dom.popup.data('onCancel', options.onCancel);
        }
        
        if (typeof(options.onShow) != 'undefined') {
            options.onShow.call(self, self._dom.popup);
        }
        if (options.slide != undefined 
            && (typeof(sforce) == 'undefined' || typeof(sforce.one) == 'undefined')
        ) {
            var aContraDirection = {
                    "bottom" : "top",
                    "top"    : "bottom",
                    "left"   : "right",
                    "right"  : "left"
                },
                oAnimate = {};
            self._dom.popup.css(
                'margin-' + aContraDirection[options.slide], 
                (['bottom', 'top'].indexOf(options.slide) >= 0 ? jQuery(window).height() : jQuery(window).width()) + 'px'
            );
            oAnimate['margin-' + aContraDirection[options.slide]] = 0;
            self._dom.popup.animate(oAnimate, 'fast');
        }
        self._dom.popup
            .css(newPos)
            .addClass('show')
            .focus();
        if (options.fullScreen !== true) {
            self.checkPopupVisiblility();
        }
        
        var _popupHide = function(evt) {
            if (evt != undefined 
                && jQuery(evt.target).parents('.CA_popup').size() < 1
                && !jQuery(evt.target).is('.notify ._close')
                && (options.noCloseRule == undefined || jQuery(evt.target).parents(options.noCloseRule).size() < 1 )
                && (options.modal !== true)
            ) {
                //self.hidePopup(evt);
            } else {
                //'mousedown'
                jQuery(document).off(self.eventNames.down).one(self.eventNames.down, _popupHide);
            }
        }
        _popupHide();
    },
   
    hidePopup : function(evt, sMode) {
        var self = localCA;
        sMode = sMode || "close";
        if (self._dom.popup == undefined) {
            return;
        }

        self._dom.popup.removeClass('show');
        self._dom.popup_shadow.removeClass('show');
        if (self.options.anyIE) {
            self._dom.el.removeClass('_ie_maximize_popup');
        }
        if (sMode == 'close' && self._dom.popup.data('onClose') != undefined) {
            self._dom.popup.data('onClose')(evt);
        } else if (sMode == 'cancel' && self._dom.popup.data('onCancel') != undefined) {
            self._dom.popup.data('onCancel')(evt);
        }
        if (typeof(self._dom.popup.data('timer')) != 'undefined') {
            clearTimeout(self._dom.popup.data('timer'));
        }

        self._dom.popup.data({'timer': null, "onClose" : null, "onCancel" : null, "onShow" : null});
        self._dom.popup.html('');
        if (self._view['calendar'] != undefined) {
            self._view['calendar'].close();
        }
        
    },
    
    showAnyShadow : function(fCloseFunc) {
        var self = localCA;
        if (self._dom.any_shadow == undefined) {
            self._dom.any_shadow = jQuery('<div class="CA_any_shadow"></div>').appendTo(self._dom.el);
            self._dom.any_shadow.on('click.CA_shadow', function(evt){
                self._dom.any_shadow.removeClass('show');
                if (typeof(fCloseFunc) == 'function') {
                    fCloseFunc(evt);
                }
            });        
        }
        self._dom.any_shadow.addClass('show');
    },
    
    hideAnyShadow : function(){
        var self = localCA;
        if (self._dom.any_shadow == undefined) {
            return;
        }
        self._dom.any_shadow.removeClass('show');
    },
    
    checkPopupVisiblility : function(el, nCounter, oVisibleEl) {
        var self = localCA;
        if (el == undefined && (self._dom.popup == undefined || !self._dom.popup.hasClass('show') || self._dom.popup.hasClass('_center'))) {
            return;
        }
        nCounter = nCounter || 0;
        el = el || self._dom.popup;
        var bFixed = el.css('position') == 'fixed';
        if (nCounter == 0 && oVisibleEl != undefined && oVisibleEl.size() > 0) {
            var aOffset = oVisibleEl.offset(), 
                aPos = {"top" : "auto", "bottom" : "auto", "right" : "auto", "left" : "auto"},
                aElOffset = bFixed ? self._dom.el.offset() : {top : 0, left : 0};
            if (!bFixed) {
                if (el[0].offsetHeight + aOffset.top + oVisibleEl[0].offsetHeight < self._dom.el[0].offsetHeight) {
                    aPos.left = aOffset.left; 
                    aPos.top = aOffset.top + oVisibleEl[0].offsetHeight;
                } else if (aOffset.top - el[0].offsetHeight > 0) { //self._dom.el[0].offsetTop
                    aPos.left = aOffset.left;
                    aPos.top = aOffset.top - el[0].offsetHeight;
                } else if (el[0].offsetWidth + aOffset.left + oVisibleEl[0].offsetWidth < self._dom.el[0].offsetWidth) {
                    aPos.left = aOffset.left + oVisibleEl[0].offsetWidth;
                    aPos.top = aOffset.top;
                } else if (aOffset.left - el[0].offsetWidth > 0) {
                    aPos.left = aOffset.left - el[0].offsetWidth;
                    aPos.top = aOffset.top;
                }
                if (aPos.top != "auto" || aPos.left != "auto" || aPos.bottom != "auto" || aPos.right != "auto") {
                    aPos.left = parseInt(aPos.left - parseInt(self.options.offset.left)) + 'px';
                    aPos.top = parseInt(aPos.top - parseInt(self.options.offset.top)) + 'px';
                    el.css(aPos);
                }

            } else {
                var aDoc = {tpp : 0, left : 0, 
                    height : jQuery(document).height(), 
                    width : jQuery(document).height(),
                    scrollTop : document.body.scrollTop,
                    scrollLeft : document.body.scrollLeft
                }
                if (el[0].offsetHeight + aOffset.top + oVisibleEl[0].offsetHeight  < aDoc.height) { // - aDoc.scrollTop
                    aPos.left = aOffset.left; 
                    aPos.top = aOffset.top + oVisibleEl[0].offsetHeight;
                } else if (aOffset.top - el[0].offsetHeight > 0) { //self._dom.el[0].offsetTop
                    aPos.left = aOffset.left;
                    aPos.top = aOffset.top - el[0].offsetHeight;
                } else {
                    aPos.left = aOffset.left;
//                    aPos.top = 0;
                }
                if (aPos.top != "auto" || aPos.left != "auto" || aPos.bottom != "auto" || aPos.right != "auto") {
//                    aPos.left = parseInt(aPos.left - parseInt(self.options.offset.left)) + 'px';
//                    aPos.top = parseInt(aPos.top - parseInt(self.options.offset.top)) + 'px';
                    el.css(aPos);
                }
                
            }
            
        }
//        console.log(
//            el.css('right'), el.css('bottom'), isNaN(parseInt(el.css('right'))),
//            'OFFSET WIDTH ' + el[0].offsetWidth + ' / ' + el[0].offsetLeft,
//            'OFFSET HEIGHT ' + el[0].offsetHeight + ' / ' + el[0].offsetTop
//        );
        
        if (nCounter < 10 && 
            (
                (false && isNaN(parseInt(el.css('right')))  || (el[0].offsetWidth < 25 || el[0].offsetLeft == 0))
                || 
                (false && isNaN(parseInt(el.css('bottom'))) || (el[0].offsetHeight < 25 || el[0].offsetTop == 0))
            )
        ) {
            setTimeout(function(){
                self.checkPopupVisiblility(el, nCounter++);
            }, 100);
            return;
        }
        if (false && parseInt(el.css('right')) < 0
            || 
            (!bFixed && el[0].offsetWidth + el[0].offsetLeft > self._dom.el[0].offsetWidth)
        ) {
            el.css('left', 'auto');
            el.css('right', '10px');
        }
        if (false && parseInt(el.css('bottom')) < 0
            || 
            (!bFixed && el[0].offsetHeight + el[0].offsetTop > self._dom.el[0].offsetHeight)
        ) {
            el.css('top', 'auto');
            el.css('bottom', '10px');
        }
        
    },
    
    popupOption : function(sName) {
        var self = localCA;
        if (sName == undefined) {
            return self._dom.popup.data('options');
        } 
        return self._dom.popup.data('options')[sName];
    },
    

    
    toggleMode : function(mode, bFirst, tBaseDate) {
        var self = localCA;
        
        bFirst = bFirst || false;
        if (mode != undefined && mode != '' && self._currentModeName == mode && self._startModeName != null) {
            return;
        }
        self._currentModeName = mode != undefined ? mode : self._currentModeName;
        self._startModeName = self._currentModeName;
        
        mode = mode 
            || (self._currentModeName  != null ? self._currentModeName : "")
            || self.params.mode;
        if (mode != self._currentModeName) {
            var oView = self._getView();
            if (oView != null && oView['beforeHide'] != undefined) {
                oView['beforeHide'](mode);
            }
        }
        self._currentModeName = mode;
        self.layout.toggleMode(mode, tBaseDate);
    },
   
    /** TO IMPLEMENT */

    
    
    _initView : function(sName, fFunc) {
        var self = localCA;
        if (self._view[sName] === null && self._viewFunc[sName] != undefined) {
            self._view[sName] = undefined;
        }
        if (typeof(self._view[sName]) == 'undefined') {
            self._view[sName] = null;
            self._viewInitFunc[sName] = function(){
                self._view[sName] = self._viewFunc[sName];
                self._view[sName].init(self.layout.getCurrentModeDiv(), self);
                if (typeof(fFunc) == 'function') {
                    fFunc();
                }
            };
            if (self._viewFunc[sName] == undefined) {
                self._initScripts('/view/' + sName + '.view.js');
            } else {
                self._viewInitFunc[sName]();
            }
        } else if (self._view[sName] != null){
            if (typeof(fFunc) != 'undefined') {
                fFunc();
            }
        }
    },
    
    initAddon : function(sName, fFunc) {
        var self = localCA,
            oSettings = {};
        if (self._addons[sName].module == null) {
            self._addQueue([
                function(){
                    self._initScripts('/addon/' + sName + '.addon.js');
                    self._objects.loadSpecialSettings("addon" + sName, function(aData){
                        oSettings = aData;
                    })
                }, 
                function(){
                    if (typeof(fFunc) != 'undefined') {
                        self._addons[sName].settings = oSettings;
                        fFunc(self._addons[sName].module);
                    }
                }
            ]);
        } else { // if (self._addons[sName].module != null){
            if (typeof(fFunc) != 'undefined') {
                fFunc(self._addons[sName].module);
            }
        }
    },
    
    _getView : function(sName) {
        var self = localCA;
        sName = sName 
            || (self._currentModeName  != null ? self._currentModeName  : "")
            || self.params.mode;
        return (typeof(self._view[sName]) == 'undefined') ? null : self._view[sName];
    },
    
    getViewSettings : function(sName, sField, mDefault) {
        var self = localCA;
        
        if (self._viewSettings[sName] == undefined || self._viewSettings[sName][sField] == undefined) {
            return mDefault;
        } 
        
        return self._viewSettings[sName][sField];
    },
    
    getAddon : function(sName) {
        var self = localCA;
        return self._addons[sName].module;
//        (self._addons[sName].module == 'undefined') ? null : self._addon[sName];
    },
    
    appendView : function(sName, oFunc) {
        var self = localCA;
        self._viewFunc[sName] = oFunc;
        if (typeof(self._viewInitFunc[sName]) == 'function') {
            self._viewInitFunc[sName]();
        }
    },
    
    appendAddon : function(sName, oFunc) {
        var self = localCA;
        self._addons[sName].module = oFunc;
        self._addons[sName].module.init(self);
    },
    
    appendText : function(oText){
        var self = localCA;
        self._text = oText;
        Date.prototype.formatText.week = self.getText('week_days', Date.prototype.formatText.week);
        Date.prototype.formatText.weekShort = self.getText('week_days_short', Date.prototype.formatText.weekShort);
        Date.prototype.formatText.month = self.getText('month_days', Date.prototype.formatText.month);
        Date.prototype.formatText.monthShort = self.getText('month_days_short', Date.prototype.formatText.monthShort);
    },
    
    getText : function(sName, sDefault) {
        var self = localCA;
        if (self._text == undefined || self._text[sName] == undefined) {
//            console.log('not found ', "'" + sName +  "': '" + sDefault + "'" ); 
            return sDefault;
        }
        return self._text[sName];
    },
    
    showNotify : function(text, bError, nTimeout) {
        var self = localCA;
        bError = bError || false;
        if (self.layout != undefined) {
            self.layout.showNotify(text, bError, nTimeout);
        }
    },
    
    clearView : function(aParams) {
        var self = localCA;
        jQuery.each(self._view, function(sViewName, oView) {
            if (oView != null && oView != undefined && oView.clearView != undefined) {
                oView.clearView(aParams);
            }
        });
        self.layout.clearView();
        self.toggleMode();
    },

    _isPhone : function (){
        var self = localCA, 
            aCheckDevices = ["iphone", "ipod", "ipad", "android", 'nokia', 'blackberry', 'symbian'],
            aBrowserCheck = ['webkit', 'opera', 'mozilla', 'msie', 'chrome'],
            sPlatform = navigator.platform.toLowerCase(),
            sUserAgent = navigator.userAgent.toLowerCase();
        if (self.options._emulateSmall === true) {
            self.options.device = 'mobile';
            self.options.deviceReal = 'android';
            self.loadCss('/css/jq-calendar-anything.small.css');
        }
        for (var nI = 0; nI < aCheckDevices.length; nI++) {
            if (
                sPlatform.indexOf(aCheckDevices[nI]) > -1 
                ||
                sUserAgent.indexOf(aCheckDevices[nI]) > -1
            ) {
                self.options.device = 'mobile';
                self.options.deviceReal = aCheckDevices[nI];
                break;
            }
        }
        if (window.navigator.msMaxTouchPoints && window.onmousedown === undefined) {
            self.options.device = 'mobile';
            self.options.deviceReal = 'win8device';
        }
        if (self.isMobile()) {
            self._dom.el.addClass('mobile CA_' + self.options.deviceReal);
            self.options.defaultScrollSpeed = 0;
            self.options._noSmallCheck = jQuery('body').width() < 767 
                || (self.options.deviceReal != 'ipad' && jQuery('body').width() < 801);
            
            if (self.options._emulateSmall !== true) {
                self._prependQueue(function(){
                    self._initScripts('/plugin/jquery.ca.touch.js');
                });
                jQuery.extend(self.eventNames,  {
                    "click"         : "touchend",
                    "down"          : "touchstart",
                    "up"            : "touchend",
                    "move"          : "touchmove",
                    "longclick"     : "longclick",
                    "dblclick"      : "dblclick",       // to be implement!
                    "contextmenu"   : "calongtouch",
                    "resize"        : "orientationchange",
                    "in"            : "mouseover"
                });
                if (window.navigator.msMaxTouchPoints || (window.navigator.maxTouchPoints && self.options.deviceReal != 'android')) {
                    jQuery.extend(self.eventNames,  
                        window.navigator.pointerEnabled  
                        ? {
                            "click" : "click", //MSPointerUp
                            "down"  : "pointerdown",
                            "up"    : "pointerup",
                            "move"  : "pointermove",
                            "contextmenu" : "contextmenu calongtouch",
                            "resize" : "orientationchange resize"
                        }
                        : {
                            "click" : "click", //MSPointerUp
                            "down"  : "MSPointerDown",
                            "up"    : "MSPointerUp",
                            "move"  : "MSPointerMove",
                            "contextmenu" : "contextmenu calongtouch",
                            "resize" : "orientationchange resize"
                        }
                    );
                } 
            }
            if (self.options.deviceReal == 'ipad' || self.options.deviceReal == 'iphone') {
                
                setTimeout(function(){
                    window.scrollTo(0, 1);
                }, 1000);
                
            }
            self._checkSmallDevice();
        } else {
            var bFrame = false;
            try {
                bFrame = parent.document != document;
            } catch (e) {
                bFrame = true;
            }
            self._dom.el.toggleClass('_ca_frame', bFrame);
            if (self.options.ie) {
                self._dom.el.addClass('ie').on('selectstart', function(evt){
                    return false
                });
            } else {
                for (var nI = 0; nI < aBrowserCheck.length; nI++) {
                    if (jQuery.browser[aBrowserCheck[nI]]) {
                        self._dom.el.addClass('CA_' + aBrowserCheck[nI]);
                        self.options.curBrowser = aBrowserCheck[nI];
                    }
                }
                if (window.navigator.msMaxTouchPoints != undefined
                        && (window.navigator.msPointerEnabled || window.navigator.pointerEnabled)
                ) {
                    jQuery.extend(self.eventNames,  
                        window.navigator.pointerEnabled  
                        ? {
                            "click" : "pointerup", //MSPointerUp
                            "down"  : "pointerdown",
                            "up"    : "pointerup",
                            "move"  : "pointermove",
                        }
                        : {
                            "click" : "MSPointerUp", //"MSPointerUp",
                            "down"  : "MSPointerDown",
                            "up"    : "MSPointerUp",
                            "move"  : "MSPointerMove"
                        }
                    );
                } 
            }
        }
//        alert(window.navigator.msPointerEnabled  + ' / ' + window.navigator.pointerEnabled 
//                + ' / ' + window.navigator.msMaxTouchPoints
//                + ' / ' + window.navigator.maxTouchPoints);
//        
//        var s = '', aA = Array.objectKeys(window.navigator);
//        alert(aA.length);
//        for (var nI = 0; nI < aA.length; nI++) {
//            alert(aA[nI] + ' / ' + window.navigator[aA[nI]]);
//            if (window.hasOwnProperty(aA[nI])) {
//                s += aA[nI] + ' : ' + window.navigator[aA[nI]] + "\n";
//            }
//        }
//        alert(s);
//        alert(self.eventNames.click + ' / ' + self.options.device +  ' / ' + self.options.deviceReal);
    },
    
    isMobile : function() {
        var self = localCA;
        return (self.options.device == 'mobile');
    },
        
    _returnTouchEvent : function(evt) {
        var self = localCA;
        if (!self.isMobile() || evt.originalEvent == undefined || 
                (
                    evt.originalEvent.changedTouches == undefined
                    && 
                    (
                        (!window.navigator.msPointerEnabled && !window.navigator.pointerEnabled)
                            || (window.navigator.msMaxTouchPoints === 0 || window.navigator.maxTouchPoints === 0)
                            || evt.originalEvent.pointerId == undefined

                    )
                )
            ) {
            if (evt.clientX == undefined && evt.originalEvent.clientX !== undefined) {
                evt.clientX = evt.originalEvent.clientX;
                evt.clientY = evt.originalEvent.clientY;
            }
            return;
        }
        var touch, 
            oOriginalEvt = evt.originalEvent;
        if (window.navigator.msPointerEnabled ) {
            touch = {
                screenX : parseInt(oOriginalEvt.screenX),
                screenY : parseInt(oOriginalEvt.screenY),
                clientX : parseInt(oOriginalEvt.clientX),
                clientY : parseInt(oOriginalEvt.clientY),
                type    : evt.type
            }
        } else {
            touch = oOriginalEvt.changedTouches[0];
        }
        evt.view = window;
        evt.detail = 1;
        evt.screenX = touch.sceenX;
        evt.screenY = touch.screenY;
        evt.clientX = touch.clientX;
        evt.clientY = touch.clientY;
        evt.target = document.elementFromPoint(touch.clientX, touch.clientY)
    },
    
    _restoreParams : function() {
        var self = localCA;
        if (typeof(localStorage)  == 'undefined' ){
            return false;
        }
        if (localStorage.CA_params) {
            var aParams = {};
            try {
                aParams = jQuery.parseJSON(localStorage.CA_params);
            } catch (e) {
                localStorage.CA_params = "{}";
            }
            if (typeof(self.options.userSettings) != 'undefined') {
                jQuery.each(aParams, function(sKey, mVal){
                    if (typeof(self.options.userSettings[sKey]) != 'undefined') {
                        aParams[sKey] = self.options.userSettings[sKey]
                    }
                });
            }
            for (var nJ = 0; nJ < self._checkParamsDefaults.length; nJ++) {
                if (self.options.userSettings[self._checkParamsDefaults[nJ]] == undefined) {
                    aParams[self._checkParamsDefaults[nJ]] = '';
                }
            }
            self.params = jQuery.extend({}, self.params, aParams);
            if (self.params.mode != undefined) {
                self._currentModeName = self.params.mode;
            }
        }
        
        if (typeof(localStorage)  != 'undefined'  
            && localStorage.CA_APICache != undefined
            && self.options.identity != undefined
        ){
            try {
                self._aAPICache = jQuery.parseJSON(localStorage.CA_APICache)[self.options.identity];
            } catch (e) {}
            self._aAPICache = self._aAPICache == undefined ? 
                {
                    "structure" : {}, 
                    "objects"   : {}, 
                    "simple"    : {}, 
                    "simpleDt"  : 0, 
                    "recordTypes"           : {},
                    "recordTypesDt"         : {},
                    "recordTypesDefault"    : {},
                    "recordAvailableList"   : {}
                } 
                : self._aAPICache;
            self._aAPICache.structure = self._aAPICache.structure == undefined ? {} : self._aAPICache.structure;
            self._aAPICache.objects = self._aAPICache.objects == undefined ? {} : self._aAPICache.objects;
            self._aAPICache.simple = self._aAPICache.simple == undefined ? {} : self._aAPICache.simple;
            self._aAPICache.recordTypes = self._aAPICache.recordTypes == undefined ? {} : self._aAPICache.recordTypes;
            self._aAPICache.recordTypesDt = self._aAPICache.recordTypesDt == undefined ? {} : self._aAPICache.recordTypesDt;
            self._aAPICache.recordTypesDefault = self._aAPICache.recordTypesDefault == undefined ? {} : self._aAPICache.recordTypesDefault;
            self._aAPICache.recordAvailableList = self._aAPICache.recordAvailableList == undefined ? {} : self._aAPICache.recordAvailableList;
            
            self._aAPICache.simpleDt = self._aAPICache.simpleDt == undefined ? 0 : self._aAPICache.simpleDt;
            
        }
    },
    
    _setParam : function(sName, mValue) {
        var self = localCA;
        if (self.params[sName] === undefined)  {
            return;
        }
        self.params[sName] = mValue;
        try{
            localStorage.CA_params = JSON.stringify(self.params);
        } catch (e){}
    },
    getParam : function(sName, mDefault){
        var self = localCA;
        if (self.params[sName] === undefined || self.params[sName] === '')  {
            return mDefault;
        }
        return self.params[sName];
    },

    _saveParams : function(aAdditional, oGrouping) {
        var self = localCA;
//        if (aAdditional != undefined && !jQuery.isEmptyObject(aAdditional)) {
//            aData = jQuery.extend({}, self.params, {"addition" : aAdditional});
//        }
        self._prependQueue(function(){
            self._request(
                {
                    jsRemote    : true,
                    "serverPath" : "event",
                    "data" : {"data" : self.params, "addition" : aAdditional, 'grouping' : oGrouping},
                    "requestType" : self.options.serverEvent.save_settings
                }, function(data) {
                    if (data.status != undefined) {
                        self.showNotify(data.status);
                    }
                }
            );
        }, true);
    },
    
    _saveAPICache : function() {
        var self = localCA;
        if (typeof(localStorage)  == 'undefined' || self.options.identity == undefined){
            return;
        }
        try {
            var oStorage = localStorage.CA_APICache != undefined ? jQuery.parseJSON(localStorage.CA_APICache) : {};
            
            oStorage[self.options.identity] = self._aAPICache;
            localStorage.CA_APICache = JSON.stringify(oStorage);
        } catch(e) {}
    },
    
    setLS : function(sName, mVal) {
        if (typeof(localStorage)  == 'undefined' ) {
            return;
        }
        if (mVal == undefined || mVal == null) {
            if (typeof(localStorage[sName]) != 'undefined') {
            //localStorage[sName] = undefined;
                delete localStorage[sName];
            }
        } else {
            localStorage[sName] = mVal;
        }
    },
    
    getLS : function(sName, mDefault) {
        if (typeof(localStorage)  == 'undefined' || localStorage[sName] == undefined) {
            return mDefault;
        }
        return localStorage[sName];
    },
    
    setSS : function(sName, mVal) {
        if (typeof(sessionStorage)  == 'undefined' ) {
            return;
        }
        if (mVal == undefined || mVal == null) {
            if (typeof(sessionStorage[sName]) != 'undefined') {
            //localStorage[sName] = undefined;
                delete sessionStorage[sName];
            }
        } else {
            sessionStorage[sName] = mVal;
        }
    },
    
    getSS : function(sName, mDefault) {
        if (typeof(sessionStorage)  == 'undefined' || sessionStorage[sName] == undefined) {
            return mDefault;
        }
        return sessionStorage[sName];
    },

    
    log : function(mMessage) {
        var self = localCA;
        
        if (self.options.log == undefined) {
            self.options.log = [];
        }
        if (typeof(mMessage) == 'string') {
            var eError = self.getErrorObject(),
                clean = '';
            if (eError.stack != undefined) {
                var caller_line = eError.stack.split("\n")[4],
                    index = caller_line != undefined ? caller_line.indexOf("at ") : -1;
                clean = index != -1 ? caller_line.slice(index + 2, caller_line.length) : '';
            }

            self.options.log.push(clean + ' : ' + mMessage);
        }
        else if (mMessage === true) {
            var divLog = self._dom.el.find('.CA_Log');
            if (divLog.size() < 1) {
                divLog = jQuery('<div class=CA_Log><span class=close>Close</span><div></div></div>').appendTo(self._dom.el);
                divLog.on('click', 'span.close', function(){
                    divLog.hide();
                });
            }
            divLog.children('div').append('<div><pre>' + self.options.log.join('</pre></div><div><pre>') + '</pre></div>');
            divLog.show();
            self.options.log = [];
        } else if (mMessage === false) {
            divLog.hide();
        } else if (mMessage === 'table') {
            console.table(self.options.log);
        }
    },
    
    getErrorObject : function(){
        try {throw Error('')} catch(err) {return err}
    },
    
    openExternalUrl : function(sUrl) {
        var self = localCA,
            aQ = [];
        if (typeof(sforce) != 'undefined' && sforce.console == undefined) {
            if (['vw', 'nv'].indexOf(self._getUrlParam('isdtp'), '') >= 0) {
                aQ.push(function(){
                    self._initScripts('//support/console/37.0/integration.js');
                });
            }
        }
        aQ.push(function(){
            if (typeof(sforce) != 'undefined' && sforce.console != undefined && sforce.console.isInConsole()) {
                sforce.console.getEnclosingPrimaryTabId(function(result){
                    if (result == null || result.id == null || result.id == 'null'){
                        sforce.console.openPrimaryTab(null, sUrl, true);
                    } else {
                        sforce.console.openSubtab(result.id, sUrl, true);
                    }
                });
            }
            else {
                window.open(sUrl);
            }
        });
        self._addQueue(aQ);
    },
    
    _parseUrl : function(sName, mValue) {
        var self = localCA;
        var aTmp = document.location.href.split('?'),
            aResult = {},
            nI,
            aDiez = document.location.href.split('#'),
            sParsedData = '',
            aParsedData;
        if (self.options.incomeHref != undefined && self.options.incomeHref != '') {
            aTmp[1] = self.options.incomeHref;
        }
        if (typeof(aTmp[1]) == 'undefined' && typeof(aDiez[1] == 'undefined')) {
            return;
        }
        if (typeof(aTmp[1]) != 'undefined') {
            if (typeof(aDiez[1]) != 'undefined') {
                aTmp = aTmp[1].split('#');
                aTmp = aTmp[0];
            } else {
                aTmp = aTmp[1];
            }
            sParsedData += aTmp;
        }
        if (typeof(aDiez[1]) != 'undefined') {
            sParsedData += (sParsedData != '' ? "&" : "") + aDiez[1];
        }
        aParsedData = sParsedData.split("&");
        
        for (nI = 0; nI < aParsedData.length; nI++) {
            var aPair = aParsedData[nI].split("=");
            aResult[aPair[0]] = (typeof(aPair[1]) != 'undefined') ? aPair[1] : '';
        }
        self.options._urlParams = aResult;
        if (typeof(self.options.userSettings) == 'undefined') {
            self.options.userSettings = {};
        }
        self.options.site = self._getUrlParam('site', '0') == '1';
    },
    
    _getUrlParam : function(sKey, mDefault) {
        var self = localCA;
        if (self.options._urlParams[sKey] != undefined) {
            return self.options._urlParams[sKey];
        } 
        return mDefault != undefined ? mDefault : null;
    },
            
    _lazyLoad : function(){
        var self = localCA;
        if (self.options.lazy == false) {
            return;
        }
        self.layout.lazyLoad();
    },
    
    _checkLayoutVisible : function(sParamName, sURLName) {
        var self = localCA;
        sURLName = sURLName || sParamName;
        if (self._visibleElements.indexOf(sParamName) > 0) {
            return false;
        }
        if (self._getUrlParam(sURLName, null) != null) {
            return self._getUrlParam(sURLName) == '1';
        }
        return self.params[sParamName] != undefined
            ? self.params[sParamName]
            : true;
    },
    
    _initExternalAPI : function() {
        
        var self = localCA, oAPI;
        if (self._readyInit === true){
            return;
        }
        if (self.layout.initExternalAPI != undefined) {
            oAPI = self.layout.initExternalAPI();
            self._dom.el.data('caApi', oAPI);
            if (typeof(self.options.func.ready) == 'function') {
                self.options.func.ready(oAPI);
            }
            if (self.options.func.request != undefined && self._preInitRequestList.length > 0) {
                self.options.func.request(self._preInitRequestList);
            }
            self._preInitRequestList.length = 0;

        }
        self._readyInit = true;
    }
    
    
}    


jQuery.extend({
    calendarAnything: localCA
});
