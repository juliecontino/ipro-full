/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var calendarsModel = function(data, parent) {
    
    /*aaa*/
    var self = {
        _aPermissions : true,
        _data : [],
        _calendarCache    : {},
        _parent : parent,
        _calendarOrder    : {},
        _cacheEvents      : {},
        _calendarPeriod   : {},
        _calendarGrouping : {},
        _cacheTime        : 0,
        _nCounter         : 0,
        _object2Calendar  : {}
    };


    self._init = function() {
        self._cacheTime = self._parent.params.cacheTime || self._cacheTime;
    }
    
    self._getCalendar = function(sCalendarId) {
        var aCalendar = self._calendarCache[sCalendarId];
        if (sCalendarId.substring(0, 1) == '_') {
            return {'calendarType' : "sf", 'folder'  : true, 'name' : sCalendarId.substring(1), 'visible' : true, 'id' : sCalendarId};
        }
        
        if (typeof(aCalendar) == 'undefined') {
            return aCalendar;
        }
        if (typeof(aCalendar.calendarsList) == 'undefined' && aCalendar.calendars != undefined ) {
            aCalendar.calendarsList = aCalendar.calendars != '' 
                ? aCalendar.calendars.replace(/\s/g, '').split(";")
                : [];
        }
//        if (
//            (typeof(aCalendar.titleLabels) == 'undefined' || aCalendar.titleLabels == null)
//            && aCalendar.additionalTitleLabel != undefined 
//        ) {
//            if (aCalendar.objectName == 'event' || aCalendar.objectName == 'task') {
//                aCalendar.additionalTitleLabel = aCalendar.additionalTitleLabel
//                    .replace(/Opportunity\/Account\sID/gi, "Related To")
//                    .replace(/Contact\/Lead\sID/gi, "Name")
//                    .replace('Created By ID', "Created By")
//                    .replace('Assigned To ID', "Assigned To");
//            }
//            aCalendar.titleLabels = aCalendar.additionalTitleLabel != '' 
//                ? aCalendar.additionalTitleLabel.replace(/\sID/g, '').split("::")
//                : [];
//            aCalendar.titleTypes = aCalendar.additionalTitleType != '' 
//                ? aCalendar.additionalTitleType.split("::")
//                : [];
//        }

        return aCalendar;
    }
    
    self._getLoadedCalendars = function(aFilter) {
        var aResult = [];
        jQuery.each(self._calendarCache, function(sKey, aVal){
            if (sKey.substring(0, 1) != '_' 
                && (aVal == undefined 
                    || aFilter != undefined && !self._checkCalendarWithFilter(aVal, aFilter)
                )
            ) {
                return;
            }
            aResult.push(sKey);
        });
        return aResult;
    }
    
    self._refresh = function(data, aParams) {
        self._calculatedMonth = false;
        if (typeof(data) != 'undefined') {
            if (typeof(self._data) == 'undefined') {
                self._data = [];
            }
            for (var nI = 0; nI < data.length; nI++) {
                if (data[nI] == null || data[nI] == undefined) {
                    continue;
                }
                
                if (typeof(data[nI]['specialColors']) == 'string' && data[nI]['specialColors'][0] == '[') {
                    data[nI]['specialColors'] = JSON.parse(data[nI]['specialColors']);
                    if (data[nI]['specialColorsFields'] != undefined) {
                        delete data[nI]['specialColorsFields'];
                    }
                    if (data[nI]['specialSavedColors'] != undefined) {
                        delete data[nI]['specialSavedColors'];
                    }
                    for (var nC = 0; nC < data[nI]['specialColors'].length; nC++) {
                        data[nI]['specialColors'][nC]['label'] = 
                            typeof(data[nI]['specialColors'][nC]['label']) != 'undefined'
                            ? data[nI]['specialColors'][nC]['label']
                                .replace(/Opportunity\/Account\sID/gi, "Related To")
                                .replace(/Contact\/Lead\sID/gi, "Name")
                                .replace('Created By ID', "Created By")
                                .replace('Assigned To ID', "Assigned To")
                            : data[nI]['specialColors'][nC]['field'];
                        if (('' + data[nI]['specialColors'][nC]['value']).indexOf('DYNAMIC') >= 0) {
                            data[nI]['dynamicColor'] = null;
//                            break;
                        }
                    }
                        
                } else if (data[nI]['specialColors'] != undefined && data[nI]['specialColors'] != '') {
                    var aTmpColors = data[nI]['specialColors'].split(/[|;]/g);
//                    console.log(aTmpColors);
                    if (data[nI]['specialColorsFields'] != undefined && data[nI]['specialColorsFields'] != '') {
                        var aTmp = data[nI]['specialColorsFields'].split(/::/g),
                            aRealColors = [];
                                
                        for (var nColor = 0; nColor < aTmp.length; nColor++){
                            var aColorEl = aTmp[nColor].split(/\|\|/g),
                                aTmpValues = aColorEl[1].split('###');
                            aRealColors.push({
                                "label" : aColorEl[0]
                                    .replace(/Opportunity\/Account\sID/gi, "Related To")
                                    .replace(/Contact\/Lead\sID/gi, "Name")
                                    .replace('Created By ID', "Created By")
                                    .replace('Assigned To ID', "Assigned To"),
                                "value" : aTmpValues[1] != undefined ? aTmpValues[1] : aTmpValues[0],
                                "text"  : aTmpValues[0],
                                "field" : aColorEl[2],
                                "color" : aTmpColors[nColor]
                            });
                            
                            if (aColorEl[1].indexOf('DYNAMIC') >= 0) {
                                data[nI]['dynamicColor'] = null;
                            }
                        }
                        data[nI]['specialColors'] = aRealColors;
                    }
                }
                if (data[nI]['lastmodified'] != undefined) {
                    if (self._parent._aAPICache.structure[data[nI].id] != undefined
                        && self._parent._aAPICache.structure[data[nI].id].time >= data[nI]['lastmodified']
                    ) {
                        data[nI].structure = self._parent._aAPICache.structure[data[nI].id];
                    }
                }
                if (typeof (data[nI]['settings']) == 'string') {
                    try {
                        data[nI]['settings'] = JSON.parse(data[nI]['settings']);
                    } catch (e) {
                        data[nI]['settings'] = {};
                    }
                }
                
                if (typeof(data[nI]['additionalTitle']) == 'string' && data[nI]['additionalTitle'][0] == '[') {
//                    if (data[nI].objectName == 'event' || data[nI].objectName == 'task') {
                        data[nI].additionalTitle = data[nI].additionalTitle
                            .replace(/Opportunity\/Account\sID/gi, "Related To")
                            .replace(/Contact\/Lead\sID/gi, "Name")
                            .replace('Created By ID', "Created By")
                            .replace('Assigned To ID', "Assigned To");
//                    }
                    data[nI]['additionalTitle'] = JSON.parse(data[nI]['additionalTitle']);
                } else if (data[nI]['additionalTitleLabel'] != undefined){
                    data[nI]['additionalTitle'] = [];
//                    var aAddTitle = [],
//                        aAddLabels = typeof(data[nI]['additionalTitleLabel']) == 'string' ? data[nI]['additionalTitleLabel'].split('::') : data[nI]['additionalTitleLabel'],
//                        aAddTypes = typeof(data[nI]['additionalTitleType']) == 'string' ? data[nI]['additionalTitleType'].split('::') : data[nI]['additionalTitleType'],
//                    for (var nJ = 0; nJ < aAddLabels.length; nJ++) {
//                        
//                    }
                }
                
                
                if (self._calendarCache[data[nI].id] != undefined) {
                    if (data[nI].objectName != undefined && data[nI].objectName != ''
                        && self._calendarCache[data[nI].id].objectName != data[nI].objectName
                        && self._object2Calendar[self._calendarCache[data[nI].id].objectName] != undefined
                    ) {
                        self._object2Calendar[self._calendarCache[data[nI].id].objectName].splice(
                            self._object2Calendar[self._calendarCache[data[nI].id].objectName].indexOf(data[nI].id), 
                            1
                        );
                    }
//                    if (data[nI].calendarType == 'sf') {
//                        delete self._calendarCache[data[nI].id].titleLabels;
//                    } 
                    if (data[nI].calendarType == 'group') {
                        delete self._calendarCache[data[nI].id].calendarsList;
                    }
                    jQuery.extend(self._calendarCache[data[nI].id], data[nI]);
                } else {
                    self._data.push(data[nI]);
                }
                if (self._calendarOrder[data[nI].id] == undefined) {
                    self._calendarOrder[data[nI].id] = self._nCounter++;
                } 
                if (data[nI].objectName != undefined && data[nI].objectName != '') {
                    if (self._object2Calendar[data[nI].objectName] == undefined){
                        self._object2Calendar[data[nI].objectName] = [];
                    }                    
                    self._object2Calendar[data[nI].objectName].push(data[nI].id);
                }
                
            }
            self._prepareData(aParams);
        }
    }
    
    self._prepareData = function(aParams) {
        self._calendarCache = {};
        var aSelectedCalendars = self._parent.layout.selectedCalendars();
        if (jQuery.isEmptyObject(aSelectedCalendars)) {
            aSelectedCalendars = self._parseDefaultCalendars();
        }
        for (var i = 0; i < self._data.length; i ++) {
            self._calendarCache[self._data[i].id] = self._data[i];
            if (self._data[i].calendars != undefined ) {
                self._data[i].calendarsList = undefined;
            }
            self._data[i].selected = (aSelectedCalendars[self._data[i].id] != undefined && aSelectedCalendars[self._data[i].id])
                || (self._data[i].friendlyName && aSelectedCalendars[self._data[i].friendlyName] === true);
        }
        self._pack();
    }
    
    self._parseDefaultCalendars = function() {
        var aSelected = {};
        if (typeof(localStorage) == 'undefined') {
            return aSelected;
        }
        if (!localStorage.CA_CalendarsSelected && self._parent.options.enabled != undefined) {
            try {
                var aJSON = typeof(self._parent.options.enabled) == 'string' 
                    && self._parent.options.enabled.substring(0, 1) == '{'
                    ? jQuery.parseJSON(self._parent.options.enabled)
                    : self._parent.options.enabled;
                if (typeof(aJSON) == 'string') {
                    aJSON = {};
                    var aSplit = self._parent.options.enabled.split(',');
                    for (var nJ = 0; nJ < aSplit.length; nJ++) {
                        if (aSplit[nJ] != '') {
                            aJSON[aSplit[nJ]] = 'default';
                        }
                    }
                }
                
                if (aJSON != null) {
                    jQuery.each(aJSON, function(sKey, mVal) {
                        if (mVal == 'default') {
                            aSelected[sKey] = true;
                        }
                    });
                }
            }  catch(e) {

            }
        }
        return aSelected;
    }
    
    self._pack = function() {
        for (var nI = 0; nI < self._data.length; nI++) {
            if (typeof(self._calendarCache[self._data[nI].id]) == 'undefined') {
                self._data.splice(nI, 1);
                nI--;
            }
        }
    }
    
    self._setInternalPeriod = function(sCalendarId, dMin, dMax, aParams) {
        var nCacheTime = Math.max(aParams != undefined && aParams.cacheTime != undefined ? aParams.cacheTime : 0, self._cacheTime)
        if (nCacheTime == 0 && (aParams == undefined || aParams.noCacheCheck !== true)) {
            return;
        }
        if (typeof(self._calendarPeriod[sCalendarId]) == 'undefined') {
            self._calendarPeriod[sCalendarId] = [[dMin, dMax, new Date()]];
            return;
        }
        var aPeriod = self._findPeriod(sCalendarId, dMin, dMax, true),
            dNewPeriod = aParams == undefined || aParams.dTimeTo == undefined 
            ? new Date()
            : aParams.dTimeTo;
        if (aPeriod == false) {
            self._calendarPeriod[sCalendarId].push([dMin, dMax, dNewPeriod]);
        } else {
            self._updatePeriod(aPeriod, dMin, dMax, dNewPeriod);
        }
    }
    
    self._findPeriod = function(sCalendarId, dMin, dMax, bExternal) {
        bExternal = typeof(bExternal) == 'undefined' ? false : bExternal;
        if (typeof(self._calendarPeriod[sCalendarId]) == 'undefined') {
            return false;
        }
        var aPeriod = self._calendarPeriod[sCalendarId],  
            dD = new Date();
        for (var i = 0; i < aPeriod.length; i++) {
            if (aPeriod[i] == undefined 
                || aPeriod[i][2] == undefined 
                || aPeriod[i][2].getTime() + self._cacheTime * 1000 < dD.getTime()
            ) {
                aPeriod.splice(i, 1);
                i--;
                continue;
            }
            if (
                (
                    !bExternal 
                    && aPeriod[i][0] <= dMin 
                    &&  aPeriod[i][1] >= dMax
                )
                ||
                (
                    bExternal 
                    && aPeriod[i][0] >= dMin 
                    &&  aPeriod[i][1] <= dMax
                )
            ) {
                return aPeriod[i];
            }
        }
        return false;
    }
    
    self._updatePeriod = function(aPeriod, dMin, dMax, dNewDate) {
        aPeriod[0] = new Date(dMin);
        aPeriod[1] = new Date(dMax);
        aPeriod[2] = dNewDate == undefined ? new Date() : dNewDate;
    }
    
    self._getCalendars = function(aFilter, fFunc) {
        aFilter = aFilter || {};
        var aResult = [];
        if (aFilter.calendarid != undefined 
            && jQuery.isArray(aFilter.calendarid)
            && aFilter.calendarid.diff(Array.objectKeys(self._calendarCache)).length > 0
        ) {
            self._getUnvisible({"id" : aFilter.calendarid}, fFunc);
        }
        for (var nI = 0; nI < self._data.length; nI++) {
            if (self._checkCalendarWithFilter(self._data[nI], aFilter)) {
                aResult.push(self._data[nI]);
            }
        }
        if (typeof(fFunc) == 'function') {
            fFunc(aResult);
        }
        return aResult;
    }
    
    self._checkCalendarWithFilter = function(aCalendarData, aFilter) {
        for (var sField in aFilter) {
            if (!aFilter.hasOwnProperty(sField)) {
                continue;
            }
            if (aFilter[sField] != aCalendarData[sField]) {
                return false;
            }
        }
        return true;
    }
    
    self._getCalendarStructure = function(mId, func) {
        if (typeof(mId) == 'string') {
            mId = [mId];
        }
        
        var aToLoad = [], aToLoadObjects = [], aReadyStructure = {};
        for (var nI = 0; nI < mId.length; nI++) {
            var aCalendar = self._getCalendar(mId[nI]);
            if (aToLoadObjects.indexOf(aCalendar.objectName) < 0) {
                aToLoadObjects.push(aCalendar.objectName);
            }
            if (aCalendar == undefined || typeof(aCalendar.structure) == 'undefined') {
                aToLoad.push(mId[nI]);
            } else {
                aReadyStructure[mId[nI]] = aCalendar.structure;
            }
        }
        
        self._parent._prependQueue([
            function() {
                if (typeof(func) == 'function') {
                    func.call(this, aReadyStructure);
                }
            },
            function(){
                if (aToLoad.length > 0){
                    self._parent._request({
                        "jsRemote" : true,
                        "requestType" : "getCalendarInfo", 
                        "data" : {"cid" : aToLoad.join(",")}
                    }, function(data) {
                        if (data.status == 200) {
                            if (data.sess != undefined && self._parent.options.session  == '' && self._parent.options.lighthning != null) {
                                self._parent.options.session = data.sess;
                            }
                            if (typeof(data.result) != undefined && data.result == 'list') {
                                //console.log(data.structure);
                                jQuery.each(data.structure, function(sCid, aStructure) {
                                    if (aStructure.childFields != undefined && typeof(aStructure.childFields) == 'string') {
                                        aStructure.childFields = JSON.parse(aStructure.childFields);
                                    }
                                    aReadyStructure[sCid] = self._prepareCalendarInfo(sCid, aStructure);
                                });
                            } else {
                                aReadyStructure[aToLoad[0]] = self._prepareCalendarInfo(aToLoad[0], data);
                            }
                            self._parent._saveAPICache();
                        }
                    });
                }
            },
            function() {
                self._parent._objects.getObjects(aToLoadObjects);
            }]
        );

    }
    
    
    self._prepareCalendarInfo = function(sCid, aStructure) {
        var aNew = [], aSplited;
        if (typeof(aStructure['hover']) == 'string') {
            aStructure['hover'] = aStructure['hover'].split(',');
        }
        if (typeof(aStructure['create']) == 'string') {
            var aTmp = aStructure['create'].split(',');
            for (var nI = 0; nI < aTmp.length; nI++) {
                aSplited = aTmp[nI].split('|');
                aNew.push({name : aSplited[0], 'isRequiredCustom' : aSplited[1]});
            }
            aStructure['create'] = aNew;
        }
        var aCalendar = self._getCalendar(sCid);
        if (aCalendar != undefined) {
            aCalendar.structure = aStructure;
            self._parent._aAPICache.structure[sCid] = jQuery.extend(
                {time : aCalendar.lastmodified != undefined ? aCalendar.lastmodified : Date.getTimeStamp() / 1000}, 
                aCalendar.structure
            );
        }
        
        return aStructure;
    }
    
    
    self._resetCalendar = function(mCalendarId) {
        if (mCalendarId == undefined) {
            self._calendarPeriod = {};
            return;
        }
        if (typeof(mCalendarId) == 'string' && mCalendarId != '') {
            mCalendarId = [mCalendarId];
        }
        mCalendarId = self._getAllRelated(mCalendarId);
        for (var nI = 0; nI < mCalendarId.length; nI++) {
            if (self._calendarPeriod[mCalendarId[nI]] != undefined) {
                self._calendarPeriod[mCalendarId[nI]] = undefined;
            }
            self._parent._events.emptyEvent({filter : {parentId : mCalendarId[nI]}, disable : null, onlyFilter : true});
        }
    }
    
    /**
     * Clear calendar cache storage
     *
     * @param {MIXED} mCalendarId - list  or one calendars to clear; if empty - all calendars cleared;
     * @param {Date} dMin - start period of cleaning
     * @param {Date} dMax - end period of cleaning
     * @return {void} 
     */
    self._clearPeriod = function(mCalendarId, dMin, dMax, bAllRelated) {
        var nCalendar, nI, aCache, 
            dD = new Date(), 
            nD = dD.getTime();
        bAllRelated = bAllRelated || false;
        mCalendarId = jQuery.isArray(mCalendarId) ? mCalendarId : [mCalendarId];
        
        if (mCalendarId.length == 0) {
            mCalendarId = Array.objectKeys(self._calendarPeriod);
        }
        if (bAllRelated) {
            mCalendarId = self._getAllRelated(mCalendarId);
        }
        for (nCalendar = 0; nCalendar < mCalendarId.length; nCalendar++) {
            aCache = self._calendarPeriod[mCalendarId[nCalendar]];
//            console.table(aCache);
            if (aCache === undefined) {
                continue;
            }
            for (nI = 0; nI < aCache.length; nI++) {
                if (aCache[nI][2].getTime() + self._cacheTime * 1000 < nD 
                    || (aCache[nI][0] < dMax && aCache[nI][1] >= dMin)
                ){
                    aCache.splice(nI, 1);
                    nI--;
                }
            }
        }
    }
    
    self._getAllRelated = function(mCalendarId) {
        var nCalendar,
            aAdditional = [],
            aCal2Group = [],
            aAll = [].concat(mCalendarId);
        for (nCalendar = 0; nCalendar < mCalendarId.length; nCalendar++) {
            var oCal = self._getCalendar(mCalendarId[nCalendar]);
            if (oCal == undefined || oCal.calendarType != 'sf') {
                continue;
            }
            aAll = aAll.concat(self._object2Calendar[oCal.objectName]);
        }
        aAll = aAll.unique();
        for (nCalendar = 0; nCalendar < aAll.length; nCalendar++) {
            var oCal = self._getCalendar(aAll[nCalendar]);
            if (oCal == undefined) {
                continue;
            }
            if (oCal.calendarType == 'sf') {
                aCal2Group.push(aAll[nCalendar]);
                aAdditional.push(aAll[nCalendar]);
            } else if (oCal.calendarType == 'group') {
                aAdditional = aAdditional.concat(oCal.calendarsList);
            }
        }
        if (aCal2Group.length > 0) {
            var aGroups = self._getGroupsForCalendar(aCal2Group);
            aAdditional = aAdditional.concat(aGroups);
        }

        if (aAdditional.length > 0) {
            mCalendarId = mCalendarId.concat(aAdditional).unique();
        }
        return mCalendarId;
    }
    
    self._changeVisibleCalendar = function(aCalendars, aDisableCalendars, bMode) {
        var aNonLoaded = [], 
            aCheckToggle = [], 
            aBeforeLoaded = self._getLoadedCalendars(); //{"calendarType" : "sf"}
        bMode = typeof(bMode) == undefined ? false : bMode; // true if only append ; false - default
        aCalendars = typeof(aCalendars) == 'string' && aCalendars != '' && aCalendars != null
            ? [aCalendars] 
            : aCalendars;
        
        if (aCalendars != null && aCalendars.length > 0){
            for (var nI = 0; nI < aCalendars.length; nI++) {
                var bGroup = aCalendars[nI].substring(0, 1) == '_';
                
                if (self._getCalendar(aCalendars[nI]) == undefined) {
                    aNonLoaded.push(aCalendars[nI]);
                } else if (!bGroup && self._getCalendar(aCalendars[nI]).visible == false) {
                    self._getCalendar(aCalendars[nI]).visible = true;
                }
                //console.log(aCalendars[nI], self._getCalendar(aCalendars[nI]));
            }
            
            aCheckToggle = aDisableCalendars != undefined && aDisableCalendars != null
                ? aDisableCalendars 
                : (!bMode ? aBeforeLoaded.diff(aCalendars) : []);
        } else if (aDisableCalendars != undefined && aDisableCalendars.length > 0) {
            aCheckToggle = aDisableCalendars;
        }
        
        
//        console.log(aBeforeLoaded, aCheckToggle, aCalendars);
        if (aCheckToggle.length > 0) {
            self._parent.layout.toggleCalendar(aCheckToggle, true);
            self._removeCalendars(aCheckToggle);
        }
        if (aNonLoaded.length > 0 || aCheckToggle.length > 0 || (!bMode && aCalendars.length > 0)) {
            
            self._parent._addQueue([function(){
                self._saveVisibleCalendars({
                    on : aNonLoaded.length > 0 ? aNonLoaded.join('|') : '',
                    off : aCheckToggle.length > 0 ? aCheckToggle.join('|') : '',
                    selectedids : aCalendars != undefined && aCalendars != null && !bMode ? aCalendars.join("|") : ''
                });
            },
            function() {
                var aLoaded = self._getLoadedCalendars(); //{"calendarType" : "sf"}
//                console.log('111', aLoaded, aCalendars);
                self._parent.layout.refreshCalendars(aLoaded, !bMode ? aCalendars : null);
                self._parent._events.refresh();
                self._parent.layout.refreshEvents();
            }]);
        } else {
            var aLoaded = self._getLoadedCalendars();  //{"calendarType" : "sf"}
            self._parent.layout.refreshCalendars(aLoaded, !bMode ? aCalendars : null);
            self._parent._events.refresh();
            self._parent.layout.refreshEvents();
        }
    }
    
    
    self._removeCalendars = function(aCalendars, bMode) {
        bMode = bMode || false;
        for (var nI = 0; nI < aCalendars.length; nI++) {
            if (typeof(self._calendarCache[aCalendars[nI]]) == 'undefined') {
                continue;
            }
            if (bMode ) { // || self._calendarCache[aCalendars[nI]].calendarType == 'sf'
                var sObj = self._calendarCache[aCalendars[nI]].objectName;
                if (self._object2Calendar[sObj] != undefined && self._object2Calendar[sObj].length > 0) {
                    var nPos = self._object2Calendar[sObj].indexOf(aCalendars[nI]);
                    if (nPos >= 0) {
                        self._object2Calendar[sObj].splice(nPos, 1);
                    }
                }
                delete self._calendarCache[aCalendars[nI]];
            } else {
                self._calendarCache[aCalendars[nI]].visible = false;
            }
        }
        self._pack();
        self._parent.layout.removeCalendars(aCalendars);
    }
    
    self._load = function(params) {
        params = params || {};
        var aSelected = [], aParams = {};
        if (self._parent.options.calendarId != undefined 
            && self._parent.options.calendarId !== ''
            && self._parent.options.calendarId !== 'CA_ACCESSIBLE'
        ) {
            aSelected = typeof(self._parent.options.calendarId) == 'string' 
                ? self._parent.options.calendarId.split(/,|%2C/)
                : self._parent.options.calendarId;
        } else if (self._parent.options.calendarId == 'CA_ACCESSIBLE') {
            aParams.all = true;
        }
        
        if (aSelected.length > 0) {
            aParams.sel = aSelected.numerize();
        }
        if (self._parent._getUrlParam('site') == '1') {
            aParams.site = document.location.href
                .replace(/http:\/\/|https:\/\//, '')
                .split("?")
                .shift();
        }
        if (self._parent.params.fastStart === true) {
            aParams.fast = true;
        }
        self._parent._request({
            jsRemote : true,
            data : aParams,
            requestType : self._parent.options.serverEvent.visibleCalendars
        }, function(data) {
            var aCalendars = data.calendars !== undefined ? data.calendars : data;
            if (data.objects !== undefined ) {
                self._parent._objects.initSimpleList(data.objects);
            }
            if (data.user != undefined) {
                self._parent.options.user = data.user;
            }
            if (data.profile != undefined) {
                self._parent.profile = data.profile;
            }
            
            if (data.grouping != undefined) {
                self._parent._objects.presetSpecialSettings('groupingObjects', data.grouping);
            }
            if (data.filteringFields != undefined) {
                self._parent._objects.presetSpecialSettings('filteringFields',  data.filteringFields);
            }
            if (data.lookupFields != undefined) {
                self._parent._objects.presetSpecialSettings('lookupFields',  data.lookupFields);
            }
            if (data.filteringSets != undefined) {
                self._parent._objects.presetSpecialSettings('filteringSets',  data.filteringSets);
            }
            if (data.globalFilteringSets != undefined) {
                self._parent._objects.presetSpecialSettings('globalFilteringSets',  data.globalFilteringSets);
            }
            if (data.permissions !== undefined ) {
                self._aPermissions = data.permissions;
            }
            if (aParams.sel != undefined) {
                self._checkLoaded(Array.objectValues(aParams.sel), aCalendars);
            }
            aParams.loadStructure = true
            self._refresh(aCalendars, aParams);
            
        });        
    }
    
    self._saveVisibleCalendars = function(params) {
//        console.log('saving ', params);
        params = params || {};
        self._parent._request({
            jsRemote    : true,
            data        : params,
            serverPath  : "event",
            post        : true,
            requestType : 'saveSelectedCalendars'
        }, function(data) {
            self._parent.showNotify(data.status);
            self._calendarOrder = {};
            self._nCounter = 0;
            if (self._parent.params.fastStart === true && data.result != undefined && data.result.length > 0) {
                var aSimple = [];
                for (var nJ = 0; nJ < data.result.length; nJ++) {
                    if (data.result[nJ].objectName == undefined || data.result[nJ].objectName == '' || aSimple.indexOf(data.result[nJ].objectName) >= 0) {
                        aSimple.push(data.result[nJ].objectName);
                    }
                }
                if (aSimple.length > 0) {
                    self._parent._objects.refreshSimple(aSimple);
                }
            }
            self._refresh(data.result);
        });        
    }
    
    self._changeCalendarColor = function(sCalendarId, sColor, sTpl) {
        var params = {
            cid : sCalendarId,
            color : sColor,
            tpl : sTpl
        };
        self._parent._request({
            jsRemote    : true,
            data        : params,
            post        : true,
            requestType : "saveCalendarColor",
            "serverPath" : "event"
        }, function(data) {
            self._parent.showNotify(data.status);
            self._getCalendar(sCalendarId)['color'] = sColor;
            self._getCalendar(sCalendarId)['settings']['color_tpl'] = sTpl;
        });        
    }
    
    
    self._saveCalendar = function(sCalendarId, aProperties, fFunc){
        var params = {
            cid : sCalendarId,
            properties : aProperties
        };
        self._parent._request({
            jsRemote    : true,
            data        : params,
            post        : true,
            requestType : "saveCalendar",
            "serverPath" : "event"
        }, function(data) {
            self._parent.showNotify(data.status);
            if (sCalendarId == null || sCalendarId == '') {
                // code to add calendar to visible list here
            }
            if (typeof(fFunc) == 'function') {
                fFunc(data);
            }
        });  
    }
    
    self._delCalendar = function(sCalendarId, fSuccessFunc) {
        self._parent._request({
            jsRemote    : true,
            data        : {cid : sCalendarId},
            requestType : "delCalendar",
            "serverPath" : "event"
        }, function(data) {
            if (typeof(data.status) != 'string' || data.status.toLowerCase().indexOf('error') < 0) {
                fSuccessFunc();
                self._removeCalendars([sCalendarId], true);
            }
            self._parent.showNotify(data.status);
        });
        
    }
    
    
    self._setCalendarFilter = function(sId, aRules, sRule, fFunc) {
        if (aRules.length == 0) {
            var aCal = self._getCalendar(sId);
            if (aCal != undefined) {
                aCal['filters'] = aRules;
                aCal['rule'] = '';
            }
            self._resetCalendar(sId);
            if (fFunc != undefined) {
                fFunc(true);
            }
            return;
        }
        var aParams = {
            "cid" : sId,
            "filters" : {},
            "rules" : {}
        }
        aParams['rules'][sId] = sRule;
        aParams['filters'][sId] = [];
        for (var nI = 0; nI < aRules.length; nI++) {
            var mValue = jQuery.isArray(aRules[nI].value) ? JSON.stringify(aRules[nI].value) : aRules[nI].value;
            aParams['filters'][sId][nI] = aRules[nI].name + '|' + aRules[nI].oper + '|' + mValue;
        }
        
        self._parent._request({
            jsRemote    : true,
            data        : aParams,
            requestType : "checkCalendarFilter",
            "serverPath" : "event"
        }, function(data) {
            if (data.status.substr(0, 5) != 'error') {
                self._getCalendar(sId)['filters'] = aRules;
                self._getCalendar(sId)['rule'] = sRule;
                self._resetCalendar(sId);
            }
            if (fFunc != undefined) {
                fFunc(data.status.substr(0, 5) != 'error');
            }
        });
    }
    
    self._getUnvisible = function(params, fFunc) {
        params = params || {};
        self._parent._request({
            jsRemote    : true,
            data        : params,
            requestType : self._parent.options.serverEvent.unVisibleCalendars
        }, function(data) {
            if (params.id != undefined) {
                if (self._parent.params.fastStart === true) {
                    var aSimple = [];
                    for (var nJ = 0; nJ < data.length; nJ++) {
                        if (data[nJ].objectName == undefined || data[nJ].objectName == '' || aSimple.indexOf(data[nJ].objectName) >= 0) {
                            aSimple.push(data[nJ].objectName);
                        }
                    }
                    if (aSimple.length > 0) {
                        self._parent._objects.refreshSimple(aSimple);
                    }
                }
                self._refresh(data);
                self._refreshCSS(data);
            }
            if (fFunc != undefined) {
                fFunc(data);
            }
        });
    }
    self._refreshCSS = function(data) {
        var aCSS = {}, aSpecialCSS = {}, aTpl = {}, aSpecialTpl = {};
        for (var nI = 0; nI < data.length; nI++) {
            aCSS[data[nI].id] = data[nI].color;
            if (data[nI]['settings'] != undefined 
                && data[nI]['settings']['color_tpl'] != undefined 
                && data[nI]['settings']['color_tpl'] > 0
            ) {
                aTpl[data[nI].id] = data[nI]['settings']['color_tpl'];
            }
            if (typeof(data[nI]['specialColors']) != 'undefined' && data[nI]['specialColors'].length > 0) {
                var aTempColors = [], aTempTpl = [];
                for (var nJ = 0; nJ < data[nI]['specialColors'].length; nJ++) {
                    aTempColors.push(data[nI]['specialColors'][nJ]['color']);
                    aTempTpl.push(data[nI]['specialColors'][nJ]['tpl'] || 0);
                }
                aSpecialCSS[data[nI].id] = aTempColors;
                aSpecialTpl[data[nI].id] = aTempTpl;
                
            }
        }
        self._parent.layout.buildCalendarCSS(aCSS, aSpecialCSS, aTpl, aSpecialTpl);
    }
    
    self._getCalendarEditData = function(sType, sCalendarId, fFunc) {
        var params = {
                "cid"   : sCalendarId,
                "type"  : sType
            },
            aResultData;
        

        self._parent._prependQueue([
            function() {
                if (fFunc != undefined) {
                    fFunc(aResultData);
                }
            },
            function() {
                self._parent._request({
                    jsRemote    : true,
                    data        : params,
                    requestType : self._parent.options.serverEvent.calendarEditData
                }, function(data){
                    if (typeof(data['hover']) == 'string') {
                        data['hover'] = data['hover'].split(',');
                    }
                    if (typeof(data['create']) == 'string') {
                        var aTmp = data['create'].split(','),
                            aNew = [],
                            aSplited;
                        for (var nI = 0; nI < aTmp.length; nI++) {
                            aSplited = aTmp[nI].split('|');
                            aNew.push({name : aSplited[0], 'isRequiredCustom' : aSplited[1]});
                        }
                        data['create'] = aNew;
                    }
                    if (typeof (data['settings']) == 'string') {
                        try {
                            data['settings'] = JSON.parse(data['settings']);
                        } catch (e) {
                            data['settings'] = {};
                        }
                    }
                    aResultData = data;
                });
            }
        ]);
    }
    
    self._getCalendarsList = function(sType, aParams, fFunc) {
        aParams = aParams || {};
        aParams.type = sType;
        self._parent._request({
            jsRemote    : true,
            data        : aParams,
            requestType : self._parent.options.serverEvent.listCalendars
        }, function(data) {
            if (fFunc != undefined) {
                fFunc(data);
            }
        });
    }
    
    self._append = function(aCalendar) {
        if (self._parent.params.fastStart === true 
            && aCalendar.objectName != undefined 
            && aCalendar.objectName != ''
        ) {
            self._parent._objects.refreshSimple([aCalendar.objectName]);
        }
        self._refresh([aCalendar]);
        var aLoaded = self._getLoadedCalendars({"calendarType" : aCalendar['calendarType']}); 
        self._parent.layout.refreshCalendars(aLoaded);
    }
    
    self._update = function(aCalendar) {
        var aPresentCalendar = self._getCalendar(aCalendar.id),
            aOldCalendar = jQuery.extend({}, aPresentCalendar),
            aOldList,
            bOldSelected;
        if (aCalendar.calendarType == 'group') {
            aOldList = self._getCalendar(aCalendar.id).calendarsList;
            bOldSelected = self._parent.layout.getActiveCalendars({id : aCalendar.id}).length == 1;
        }
        if (typeof(aPresentCalendar) != 'undefined') {
            delete aPresentCalendar.structure;
            delete aCalendar.structure;
        }
        self._refresh([aCalendar]);
        if (aCalendar.calendarType == 'sf') {
            if (aOldCalendar["objectName"] != aCalendar['objectName']) {
                if (self._parent.params.fastStart === true 
                    && aCalendar.objectName != undefined 
                    && aCalendar.objectName != ''
                ) {
                    self._parent._objects.refreshSimple([aCalendar.objectName]);
                }

                aCalendar['filters'] = [];
                aCalendar['rule'] = '';
            }
            if (aOldCalendar.specialColors != undefined && aOldCalendar.specialColors.length > 0) {
                var aToDel = [];
                for (var nJ = 0; nJ < aOldCalendar.specialColors.length; nJ++) {
                    aToDel.push('.color_' + aCalendar.id + '._spec' + nJ);
                }
                removeCssClass(aToDel);
            }
        } else if (aCalendar.calendarType == 'group') {
            var aNewList = self._getCalendar(aCalendar.id).calendarsList,
                aDisable = aOldList.diff(aNewList),
                aEnable = aNewList.diff(aOldList);
            if (bOldSelected === true) {
                self._parent.layout.lockGroup(aCalendar, false, aDisable);
                self._parent.layout.lockCalendars(aEnable, true);
            }
            self._checkPresentGroupCalendars([aCalendar.id]);
        }
        self._refreshCSS([aCalendar]);
        self._resetCalendar(aCalendar.id);
        self._parent.layout.updateCalendarHTML(aCalendar);
        self._parent.layout.refreshEvents();
        var oView = self._parent._getView('eventDetail');
        if (oView != null) {
            oView.reset();
        }
    }
    
    self._checkPresentGroupCalendars = function(aGroupsId) {
        var nI;
        if (aGroupsId == undefined || aGroupsId.length < 1) {
            return;
        }
        var aCalendarsToLoad = [], aLoaded = Array.objectKeys(self._calendarCache);
        
        for (nI = 0; nI < aGroupsId.length; nI++) {
            var aGroupCalendars = self._getCalendar(aGroupsId[nI]).calendarsList;
            aCalendarsToLoad = aCalendarsToLoad.concat(aGroupCalendars.diff(aLoaded))
        }
        
        if (aCalendarsToLoad.length < 1) {
            return;
        }
        aCalendarsToLoad = aCalendarsToLoad.unique();
        self._getUnvisible({id : aCalendarsToLoad.join(',')}, function(aList) {
            var aChecked = [];
            for (nI = 0; nI < aList.length; nI++) {
                aChecked.push(aList[nI].id);
            }
            var aNotLoaded = aCalendarsToLoad.diff(aChecked);
            if (aNotLoaded.length > 0) {
                for (nI = 0; nI < aGroupsId.length; nI++) {
                    self._getCalendar(aGroupsId[nI]).calendarsList = 
                        self._getCalendar(aGroupsId[nI]).calendarsList.diff(aNotLoaded);
                }
            }
        });
    }
    
    self._checkLoaded = function(aSel, aLoaded) {
        if (aSel.length < 1) {
            return;
        }
        var aIds = [];
        for (var nI = 0; nI < aLoaded.length; nI++) {
            if (aLoaded[nI] == undefined || aLoaded[nI] == null) {
                continue;
            }
            if (aLoaded[nI].id != undefined) {
                aIds.push(aLoaded[nI].id);
            } else if (aLoaded[nI].folder === true ) {
                aIds.push('_' + aLoaded[nI].name ); 
            }
            if (aLoaded[nI].friendlyName != undefined) {
                aIds.push(aLoaded[nI].friendlyName);
            }
        }
        
        if (aSel.diff(aIds).length > 0) {
            var sText = (aSel.length > 1 
                    ? self._parent.getText('model_specified_calendars', 'The specified calendars')  
                    : self._parent.getText('model_specified_calendar', 'The specified calendar')  
                )
                + ' '
                + aSel.join(',')
                + ' '
                + self._parent.getText('model_cannot_be_found', 'cannot be found or permissions are not set up properly to display it on this Site') ;
            self._parent.showNotify(sText, true, 5000);
        }
    }
    
    self._setProperties = function(sCalendar, aProp) {
        var aCalendar = self._findCalendar(sCalendar);
        if (aCalendar == undefined) {
            return;
        }
        jQuery.each(aProp, function(sKey, mVal) {
            if (mVal == null || mVal == undefined) {
                delete aCalendar[sKey];
            } else {
                aCalendar[sKey] = mVal;
            }
            
        });
    }
    
    self._findCalendar = function(sName) {
        var sId = null;
        if (self._calendarCache[sName] != undefined) {
            sId = sName;
        }
        jQuery.each(self._calendarCache, function(sKey, aVal){
            if (aVal.friendlyName == sName) {
                sId = aVal.id;
                return false;
            }
        });
        return sId != null ? self._getCalendar(sId) : undefined;
    }
    
    self._loadDynamicOptions = function(aCalendars, aDates, fFunc) {
        if (aCalendars == undefined || aCalendars == null || aCalendars.length == 0) {
            return;
        }
        
        var aAllCalendars = [],
            aResult = {}, oCalendar, aToLoad = [];
        for (var nI = 0; nI < aCalendars.length; nI++) {
            oCalendar = self._getCalendar(aCalendars[nI]);
            if (oCalendar.calendarType == 'group') {
                aAllCalendars = aAllCalendars.concat(oCalendar.calendarsList);
            } else {
                aAllCalendars.push(aCalendars[nI]);
            }
        }
        for (var nI = 0; nI < aAllCalendars.length; nI++) {
            oCalendar = self._getCalendar(aAllCalendars[nI]);
            if (oCalendar != undefined 
                && oCalendar != null 
                && oCalendar.dynamicColor !== undefined
            ) {
                if (oCalendar.dynamicColor != null) {
                    aResult[oCalendar.id] = oCalendar.dynamicColor;
                } else {
                    aToLoad.push(oCalendar.id);
                }
            }
        }
        if (aToLoad.length > 0) {
            var aCalendarToUpdate = {};
            self._parent._request({
                "jsRemote" : true,
                "requestType" : "getCalendarDynamic", 
                "data" : {"cid" : aToLoad.join(","), "start" : aDates.start, "end" : aDates.end}
            }, function(data) {
                jQuery.each(data, function(sCombineId, sColor){
                    var aCombine = sCombineId.split('##'),
                        sId = aCombine[0],
                        sField = aCombine[1];
                    
                    oCalendar = self._getCalendar(sId);
                    if (oCalendar == undefined || oCalendar == null) {
                        return;
                    }
                    if (aCalendarToUpdate[sId] == undefined)  {
                        aCalendarToUpdate[sId] = {};
                    }
                    if (typeof(oCalendar['dynamicColor']) == 'undefined' || oCalendar['dynamicColor'] == null) {
                        oCalendar['dynamicColor'] = {};
                        oCalendar['dynamicColorValues'] = {};
                    }
                    aCalendarToUpdate[sId][sField] = [];
                    var aColorsEls = sColor.split(/\|/g),
                        sDynamic = "",
                        aDynamicValue,
                        aStringValuesList = [];
                    for (var nEl = 0; nEl < aColorsEls.length; nEl++) {
                        aDynamicValue = aColorsEls[nEl].split("__");
                        if (aDynamicValue[0] != '') {
                            sDynamic += (sDynamic != '' ? "|" : "") + aDynamicValue[0];
                            aStringValuesList.push(aDynamicValue[1]);
                            aCalendarToUpdate[sId][sField].push(aDynamicValue[1]) ;
                        }
                    }
                    oCalendar['dynamicColor'][sField] = sDynamic;
                    oCalendar['dynamicColorValues'][sField] = aStringValuesList;
                    aResult[oCalendar.id] = oCalendar['dynamicColor'];
                });
                self._parent.layout.updateDynamicValues(aCalendarToUpdate);
                fFunc(aResult);
            });
        } else {
            fFunc(aResult);
        }
        
    }
    
    self._getGroupsForCalendar = function(mId) {
        var aResult = [];
        if (typeof(mId) == 'string') {
            mId = [mId];
        }
        for (var nJ = 0; nJ < self._data.length; nJ++) {
            if (self._data[nJ].calendarType == 'group' 
                && self._data[nJ].calendarsList != undefined
                && self._data[nJ].calendarsList.intersect(mId).length > 0
            ) {
                aResult.push(self._data[nJ].id);
            }
        }
        return aResult;
    }
    
    this.refresh = function(data) {
        self._refresh(data);
    }
    
    this.getCalendar  =  function(sCalendarId) {
        return self._getCalendar(sCalendarId);
    }
    
    this.getCalendars = function(aFilter, fFunc) {
        return self._getCalendars(aFilter, fFunc);
    }
    
    this.getCalendarStructure = function(mId, fFunc) {
        return self._getCalendarStructure(mId, fFunc);
    }
    
    this.findCalendar = function(mId) {
        return self._findCalendar(mId);
    }
    
    this.getFieldOptions = function(aParams, fFunc) {
        return self._parent._objects.getFieldOptions(aParams, fFunc);
    }
    
    this.getData = function(i) {
        if (typeof(i) != 'undefined') {
            return typeof(self._data[i]) == 'undefined'
                ? {}
                : self._data[i];
        } else {
            return self._data;
        }
    }

    
    this.checkDataPresent = function(aCalendars, dMin, dMax, aGrouping){
        if (self._calendarPeriod === {} || jQuery.isEmptyObject(self._calendarPeriod)) {
            return false;
        }
        
        var aIDList = [], 
            aList = ['calendar', 'web', 'group'], 
            bReturnObject = false,
            nI, nL;
        if (typeof(aCalendars.length) == 'undefined') {
            bReturnObject = true;
            for (nI = 0; nI < aList.length; nI++) {
                if (typeof(aCalendars[aList[nI]]) != 'undefined' && aCalendars[aList[nI]].length > 0) {
                    aIDList = aIDList.concat(aCalendars[aList[nI]]);
                }
            }
        } else {
            aIDList = aIDList.concat(aCalendars);
        }
        for (nI = 0, nL = aIDList.length; nI < nL; nI++) {
            if (typeof(self._calendarPeriod[aIDList[nI]]) != 'undefined'){
//                    show_object(self._calendarPeriod[aCalendars[i]], 'data ' + i);
            }
            if ((
                    aGrouping != undefined 
                    && aGrouping[aIDList[nI]] != undefined
                    && aGrouping[aIDList[nI]] != ''
                    && aGrouping[aIDList[nI]] != '-1'
                    && (
                        self._calendarGrouping[aIDList[nI]] == undefined 
                        || aGrouping[aIDList[nI]] != self._calendarGrouping[aIDList[nI]]
                    )
                ) || 
                !self._findPeriod(aIDList[nI], dMin, dMax)
            ) {
                if (aGrouping != undefined && aGrouping[aIDList[nI]] != undefined) {
                    self._calendarGrouping[aIDList[nI]] = aGrouping[aIDList[nI]];
                }
                if (!bReturnObject) {
                    return false;
                }
            } else {
                aIDList[nI] = '';
            }
        }
        if (bReturnObject) {
            var aReturn = {}, bEmpty = true;
            for (nI = 0; nI < aList.length; nI++) {
                if (typeof(aCalendars[aList[nI]]) != 'undefined') {
                    aReturn[aList[nI]] = aCalendars[aList[nI]].intersect(aIDList);
                    bEmpty = aReturn[aList[nI]].length > 0 ? false : bEmpty;
                }
            }
            return bEmpty ? bEmpty : aReturn;
        } else {
            return true;
        }
    }
    
    this.setPeriod = function(aCalendarsId, dMin, dMax, aParams) {
        dMin = new Date(dMin);dMax = new Date(dMax);
        for (var i = 0, nL = aCalendarsId.length; i < nL; i++) {
            self._setInternalPeriod(aCalendarsId[i], dMin, dMax, aParams);
        }
    }
    
    this.getUnvisible = function(params, fFunc) {
        self._getUnvisible(params, fFunc);
    }
    
    this.resetCalendar = function(sCalendarId) {
        self._resetCalendar(sCalendarId);
    }
    
    this.clearPeriod = function(mCalendarId, dMin, dMax, bRelated) {
        self._clearPeriod(mCalendarId, dMin, dMax, bRelated);
    }

    this.changeVisibleCalendar = function(aEnableCalendars, aDisableCalendars, bMode) {
        self._changeVisibleCalendar(aEnableCalendars, aDisableCalendars, bMode);
    }
    
    
    this.delCalendar = function(sCalendarId, fFunc) {
        self._delCalendar(sCalendarId, fFunc);
    }
    
    
    this.changeCalendarColor = function(sCalendarId, sColor, sTpl) {
        self._changeCalendarColor(sCalendarId, sColor, sTpl);
    }
    
    this.saveCalendar = function(sCalendarId, aProperties, fFunc) {
        self._saveCalendar(sCalendarId, aProperties, fFunc);
    }
    
    
    this.setCalendarFilter = function(sId, aRules, sRule, fFunc) {
        return self._setCalendarFilter(sId, aRules, sRule, fFunc);
    }
    
    this.checkPresentGroupCalendars = function(aGroupsId) {
        self._checkPresentGroupCalendars(aGroupsId);
    }
    
    this.getCalendarEditData = function(sType, sCalendarId, fFunc) {
        return self._getCalendarEditData(sType, sCalendarId, fFunc);
    }
    
    this.getObjectStructure = function(sObjectName, fFunc) {
        return self._parent._objects.getObjectStructure(sObjectName, fFunc);
//        return self._getObjectStructure(sObjectName, fFunc);
    }
    
    this.getCalendarsList = function(sType, aParams, fFunc) {
        return self._getCalendarsList(sType, aParams, fFunc);
    }
    
    this.changeCacheTime = function(nCache) {
        self._cacheTime = nCache;
    }
    
    this.append = function(aCalendarData) {
        self._append(aCalendarData);
    }
    
    this.update = function(aCalendarData) {
        self._update(aCalendarData);
    }
    
    
    this.parseStringFilter = function(sFilter) {
        var aResult = [], 
            aTmp = sFilter.split('##');
        if (sFilter == null || sFilter == '') {
            return [];
        }            
        for (var nI = 0; nI < aTmp.length; nI++) {
            var aFilter = aTmp[nI].split('___'),
                sText = (aFilter[4] != undefined && aFilter[4] != '' ? aFilter[3] : aFilter[3].replace(/,/g, '::')),
                sValue = aFilter[4] != undefined && aFilter[4] != '' ? aFilter[4] : aFilter[3];
        
            aResult.push({
                "name"  : aFilter[1].toLowerCase(),
                "oper"  : aFilter[2],
                'value' : sValue,
                "text"  : sText
            });
        }
        return aResult;
    }
    
    this.compare = function(sCid1, sCid2) {
        if (sCid1 == sCid2) {
            return 0;
        } else if (self._calendarOrder[sCid1] != undefined && self._calendarOrder[sCid2] != undefined) {
            return self._calendarOrder[sCid1] < self._calendarOrder[sCid2] ? -1 : 1;
        } else {
            return self._calendarOrder[sCid1] == undefined ? 1 : -1;
        }
    }
    
    this.setProperties = function(sCalendar, aProp) {
        self._setProperties(sCalendar, aProp);
    }
    
    this.checkCalendarFunction = function(sId, sName) {
        return sId != '' && self._calendarCache[sId] != undefined && typeof(self._calendarCache[sId][sName]) == 'function';
    }
            
    this.runCalendarFunction = function(sId, sName, aArgs) {
        return self._calendarCache[sId][sName].apply(null, aArgs);
    },
            
    this.getPermission = function(sPermission, sCalendarType) {
        if (sCalendarType != undefined) {
            return self._aPermissions == true || self._aPermissions[sCalendarType + sPermission] === true;
        } else {
            return self._aPermissions == true || self._aPermissions[sPermission] === true;
        }
    }
    
    this.loadDynamicOptions = function(aCalendars, aDates, fFunc) {
        self._loadDynamicOptions(aCalendars, aDates, fFunc);
    }
    
    
    this.load = function(){
        self._load();
    }
    
    this.loadLazyObjects = function(){
        var aObj = [];
        for (var nI = 0; nI < self._data.length; nI++) {
            if (self._data[nI].calendarType != 'sf') {
                continue;
            }
            aObj.push(self._data[nI].objectName);
        }
        aObj = aObj.unique();
        if (aObj.length > 0) {
            self._parent._objects.getObjects(aObj);
        }
    }
    
    this.getTextSpecialColor = function(sCalId, sIncomeClass) {
        var aCalendar = self._getCalendar(sCalId),
            bShowColorFieldLabel = aCalendar['settings'] == undefined 
            || aCalendar['settings']['hide_color_field_label'] == 0 
            || !aCalendar['settings']['hide_color_field_label'];
        if (aCalendar == undefined) {
            return "";
        }
        var sClass = sIncomeClass.replace('_spec_reccuring', '').trim();
        if (sClass.indexOf('_spec') == 0) {
            var nIdx = parseInt(sClass.substr(5));
            if (isNaN(nIdx) 
//                || aCalendar.specialColorsValues[nIdx] == undefined
                || aCalendar.specialColors[nIdx] == undefined
            ) {
                return '';
            }
//            return aCalendar.specialColorsValues[nIdx][0] + " - " + aCalendar.specialColorsValues[nIdx][1];
            return (bShowColorFieldLabel ? aCalendar.specialColors[nIdx]['label'] + " - " : "")
                    + aCalendar.specialColors[nIdx]['text'];
        } else if (sClass.indexOf('_sd_') == 0) {
            var nIdx = parseInt(sClass.substr(4));
            if (isNaN(nIdx) || aCalendar.dynamicColorValues == undefined) {
                return '';
            }
            var sKey = Array.objectKeys(aCalendar.dynamicColorValues)[0],
                aValues = aCalendar.dynamicColorValues[sKey];
                
            for (var nJ = 0; nJ < aCalendar.specialColors.length; nJ++) {
                if (aCalendar.specialColors[nJ]['field'] == sKey) {
                    return (bShowColorFieldLabel ? aCalendar.specialColors[nJ]['label'] + ' - '  : "")
                        + aValues[nIdx];
                }
            }
//            for (var nJ = 0; nJ < aCalendar.specialColorsValues.length; nJ++) {
//                if (aCalendar.specialColorsValues[nJ][2] == sKey) {
//                    return aCalendar.specialColorsValues[nJ][0] + ' - ' + aValues[nIdx];
//                }
//            }
        }
        return '';
    }
    
    if (data != undefined) {
        self._refresh(data);
    }
   
    self._init();
    
}
