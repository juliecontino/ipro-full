/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var objectsModel = function(data, parent) {
    
    /*aaa*/
    var self = {
//        _data : [],
        _objectCache        : {},
        _parent             : parent,
        _object2Calendar    : {},
        _aObject2Key         : {},
        _aKey2Object         : {},
        _bSmpleRefreshed    : false,
        _objectSimple       : null,
        _objectRecordTypes  : {},
        _objectRecordTypesDefault  : {},
        _objectRecordAvailableList : {},
        _aNamePolymorphic   : {
            "alias" : {'type' : 'STRING', 'name' : 'alias', 'label' : 'User alias', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false},
            "firstname" : {'type' : 'STRING', 'name' : 'firstname', 'label' : 'First Name', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false},
            "lastname" : {'type' : 'STRING', 'name' : 'lastname', 'label' : 'Last Name', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false},
            "name" : {'type' : 'STRING', 'name' : 'name', 'label' : 'Name', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false},
            "type" : {'type' : 'PICKLIST',  'name' : 'type', 'label' : 'Type', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false, "options" : []},
            "userroleid" : {'type' : 'REFERENCE', 'name' : 'userroleid', 'label' : 'UserRoleId', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false, 'options' : [{"key" : "00E", "value" : "User Role" , 'name' : "userrole"}], "server" : true}
        },
        _aCacheFieldOptions : {},
        _checkObjectPropertiesAfter : ["event", "task"],
        _aMetadata : {},
        _aListViewOptions : {},
        _aSpecialSettings : {},
        _aFlag  : {},
        _aRESTCache : {},
        _aSFIDs : null,
        _aRestrictedFields : {
            'event' : ['durationinminutes', 
                    'activitydate', 
                    'activitydatetime'
            ],
            'partnernetworkconnection' : ['name'],
            'contract' : ['name', 'statuscode'],
            'orderitem' : ['name'],
            'solution' : ['name'],
            'collaborationgroupmemberrequest' : ['name'],
            'contracthistory' : ['name'],
            'crontrigger' : ['name'],
            'processinstancehistory' : ['name'],
            'caseteamtemplatemember' : ['name'],

            'orgwideemailaddress' : ['name'],
            'dashboardfeed' : ['name'],
            'emailservicesfunction' : ['name'],

            'campaign' : ['numberofconvertedleads', 'numberofresponses', 'numberofopportunities',
                'numberofwonopportunities', 'numberofleads', 'numberofcontacts', 
                'amountwonopportunities', 'amountallopportunities']
        },
        _aGroupingFields : null,
        _aCommonFields : {
            "ownerid"           : {'type' : 'REFERENCE', 'name' : 'ownerid', 'label' : 'Owner Id', 'isUpdateable' : true, 'isRequired' : false, 'isCreateable' : true, 'options' : [{"key" : "005", "value" : "User" , 'name' : "user"}], "server" : true},
            "createdbyid"       : {'type' : 'REFERENCE', 'name' : 'createdbyid', 'label' : 'Created By Id', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false, 'options' : [{"key" : "005", "value" : "User" , 'name' : "user"}], "server" : true},
            "lastmodifiedbyid"  : {'type' : 'REFERENCE', 'name' : 'lastmodifiedbyid', 'label' : 'Last Modified By Id', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false, 'options' : [{"key" : "005", "value" : "User" , 'name' : "user"}], "server" : true},
            "lastmodifieddate"  : {'type' : 'DATETIME', 'name' : 'lastmodifieddate', 'label' : 'Last Modified Date', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false, "server" : true},
            "createddate"       : {'type' : 'DATETIME', 'name' : 'createddate', 'label' : 'Created Date', 'isUpdateable' : false, 'isRequired' : false, 'isCreateable' : false, "server" : true}
        }
    };


    self._init = function() {
        self._restoreObjectsFromAPICache();
        if (window.localStorage != undefined && window.localStorage['aRESTCache'] != undefined) { 
            try {
                self._aRESTCache = JSON.parse(window.localStorage['aRESTCache']);
            } catch (e) {
                self._aRESTCache = {};
            }
        }
    }
    
    self._restoreObjectsFromAPICache = function() {
        if (self._parent._aAPICache.objects == undefined || !(parseInt(self._parent.params.apiCache) > 0)) {
            return;
        }
        var tPeriod = parseInt(self._parent.params.apiCache) * 3600 * 1000,
            tNow = Date.now();
        jQuery.each(self._parent._aAPICache.objects, function(sKey, aEl) {
            if (aEl.dt + tPeriod < tNow) {
                return;
            }
            self._objectCache[sKey] = aEl;
        });
        if (self._parent._aAPICache.simple != undefined 
            && !jQuery.isEmptyObject(self._parent._aAPICache.simple)
            && self._parent._aAPICache.simpleDt + tPeriod > tNow
        ) {
            self._objectSimple = self._parent._aAPICache.simple;
        }
        if (self._parent._aAPICache.recordTypes != undefined) {
            var aRT = self._parent._aAPICache.recordTypes,
                aDT = self._parent._aAPICache.recordTypesDt;
            jQuery.each(self._parent._aAPICache.recordTypes, function(sKey, oRT){
                if (aDT[sKey] == undefined || aDT[sKey] + tPeriod < tNow) {
                    return;
                };
                self._objectRecordTypes[sKey] = oRT;
                if (self._parent._aAPICache.recordTypesDefault[sKey] != undefined) {
                    self._objectRecordTypesDefault[sKey] = self._parent._aAPICache.recordTypesDefault[sKey];
                }
                if (self._parent._aAPICache.recordAvailableList[sKey] != undefined) {
                    self._objectRecordAvailableList[sKey] = self._parent._aAPICache.recordAvailableList[sKey];
                }
            });
        }
    }
    
    self._getObject = function(sObjectname, fFunc) {
        var aResult = self._getObjects([sObjectname], function(aData){
            if (typeof(fFunc) == 'function') {
                fFunc(self._objectCache[sObjectname]);
            }
        });
        return aResult == null ? null : self._objectCache[sObjectname];
    }

    self._getObjects = function(aObjectnames, fFunc, aParams) {
        aObjectnames = typeof(aObjectnames) == 'string' ? [aObjectnames] : aObjectnames;
        var aResult = {}, aLoad = [];
        for (var nI = 0; nI < aObjectnames.length; nI++) {
            if (self._objectCache[aObjectnames[nI]] == undefined) {
                aLoad.push(aObjectnames[nI]);
            } else {
                aResult[aObjectnames[nI]] = self._objectCache[aObjectnames[nI]];
            }
        }
        self._parent._prependQueue([
            function() {
                if (fFunc != undefined) {
                    for (var nI = 0; nI < aLoad.length; nI++) {
                        aResult[aLoad[nI]] = self._objectCache[aLoad[nI]];
                    }
                    fFunc(aResult);
                }
            },
            function(){
                if (aParams != undefined && aParams.loadReferenced === true) {
                    var aObjs = self._prepareLinkedObjects(aObjectnames, aParams.onlySingleReference === true);
                    if (aObjs.length > 0) {
                        self._getObjects(aObjs);
                    }
                }
            },
            function(){
                if (aLoad.length) {
                    self._checkObjectLoadedOptions(aLoad);
                }
            }, 
            function(){
                if (aLoad.length < 1) {
                    return;
                }
                if (
                    self._parent.options.session != undefined 
                    && self._parent.options.lighthning == null
                    && self._parent.options.session != ''
                    && self._parent.options.site !== true
                ) {
                    var aSplitAccess = self._splitAccess(aLoad);
                    self._loadWithConnector(aSplitAccess.public);
                    if (aSplitAccess.private != undefined && aSplitAccess.private.length > 0) {
                        self._loadWithApex(aSplitAccess.private);
                    }
                } else {
                    self._loadWithApex(aLoad);
                }
            }
        ]);
        return jQuery.isEmptyObject(aResult) ? null : aResult;
    }
    
    self._loadWithConnector = function(aLoad) {
        aLoad = aLoad.unique();
        var aListToLoad = aLoad.slice();
        if (aListToLoad.length <= 10) {
            return self._loadWithRest(aListToLoad);
        }
        aListToLoad.length = aListToLoad.length > 100 ? 100 : aListToLoad.length;
        
        self._parent._prependQueue([
            function(){
                if (window['sforce'] == undefined 
                    || window['sforce'].connection == undefined
                    || self._parent.options.lighthning != null
                ) {
                    return;
                }
                self._parent.waitQueue(1);
                window['sforce'].connection.sessionId = self._parent.options.session;
                window['sforce'].connection.describeSObjects(aListToLoad, {
                    onSuccess : function(data){
                        self._addConnectorObjects(data);
                        if (aListToLoad.length == 100 && aLoad.diff(aListToLoad).length > 0) {
                            self._parent._prependQueue(function(){
                                self._loadWithConnector(aLoad.diff(aListToLoad));
                            }, false);
                        }
                        self._parent.waitQueue(-1);
                    },
                    onFailure : function() {
                        self._parent._prependQueue(function(){
                            self._loadWithApex(aLoad);
                        }, false);
                        self._parent.waitQueue(-1);
                    }
                });
            },
            function(){
                self._initConnectLib();
            }
        ]);
    }
    
    self._addConnectorObjects = function(aObjectList) {
        var sName, aNames = [];
        if (aObjectList == undefined || aObjectList.length == 0) {
            return;
        }
        for (var nI = 0; nI < aObjectList.length; nI++) {
            sName = aObjectList[nI].name.toLowerCase();
            self._objectCache[sName] = {
                iscreateable    : self._isTrue(aObjectList[nI].createable),
                iseditable      : self._isTrue(aObjectList[nI].updateable),
                feedEnabled     : self._isTrue(aObjectList[nI].feedEnabled),
                fields          : self._prepareConnectorFields(aObjectList[nI].fields, sName),
                child           : aObjectList[nI].childRelationships != undefined 
                                    ? self._parseChild(aObjectList[nI].childRelationships)
                                    : []
//                key             : aObjectList[nI].keyprefix
            };
            aNames.push(sName);
            self._fillCustomFieldsInfo(sName);
        }
        self._storeCacheObjects(aNames);
    }
    
    self._parseChild = function(aChilds) {
        var aResult = [];
        for (var nJ = 0; nJ < aChilds.length; nJ++) {
            if (self._isTrue(aChilds[nJ].deprecatedAndHidden)) {
                continue;
            }
            aResult.push({
                'object' : aChilds[nJ].childSObject.toLowerCase(),
                'field'  : aChilds[nJ].field.toLowerCase(),
                'label'  : aChilds[nJ].relationshipName != undefined 
                            ? aChilds[nJ].relationshipName
                            : aChilds[nJ].childSObject + '.' + aChilds[nJ].field
            });
        }
        return aResult;
    }
    
    self._prepareConnectorFields = function(aFields, sObjectName) {
        var aResult = {}, nJ, sOptionName, sObjectLabel;
        for (var nI = 0; nI < aFields.length; nI++) {
            var sName = aFields[nI].name.toLowerCase(),
                aObj = {
                "isHTML"       : self._isTrue(aFields[nI].htmlFormatted),
                "isAccessible" : true,
                "isUpdateable" : self._isTrue(aFields[nI].updateable),
                "isCreateable" : self._isTrue(aFields[nI].createable),
                "isDependent" : (self._isTrue(aFields[nI].dependentPicklist) ? true : false),
                "isRequired" : (!self._isTrue(aFields[nI].defaultedOnCreate)
                    && !self._isTrue(aFields[nI].nillable))
                    || self._isTrue(aFields[nI].nameField),
                "name" : sName,
                "label" : aFields[nI].label,
                "type" : aFields[nI].type.toUpperCase(),
                "options" : null,
                "scale" : aFields[nI].scale
            };
            if (self._aRestrictedFields[sObjectName] != undefined 
                && self._aRestrictedFields[sObjectName].indexOf(sName) >= 0 
            ){
                continue;
            }
            if (aObj.type == 'REFERENCE' && aFields[nI].referenceTo != undefined) {
                aObj.options = [];
                var aList = typeof(aFields[nI].referenceTo) == 'string' 
                    ? [aFields[nI].referenceTo] 
                    : aFields[nI].referenceTo;
                
                for (nJ = 0; nJ < aList.length; nJ++) {
                    sOptionName = aList[nJ].toLowerCase();
                    sObjectLabel = self._getObjectLabel(sOptionName);
                    aObj.options.push({
                        "key"   : self._aObject2Key[sOptionName], 
                        "value" : sObjectLabel != null ? sObjectLabel : aList[nJ], 
                        "name"  : sOptionName
                    });
                }
                if (aFields[nI].filteredLookupInfo != undefined) {
                    aObj.filteredLookup = true;
                    if (self._isTrue(aFields[nI].filteredLookupInfo.dependent)) {
                        if (typeof(aFields[nI].filteredLookupInfo.controllingFields) == 'string') {
                            aObj.filteredLookupFields = [aFields[nI].filteredLookupInfo.controllingFields.toLowerCase()];
                        } else {
                            aObj.filteredLookupFields = aFields[nI]
                                .filteredLookupInfo
                                .controllingFields.map(function(sS){
                                    return sS.toLowerCase();
                                });
                        }
//                        for (var nF = 0; nF < aFields[nI].filteredLookupInfo.controllingFields.length; nF++) {
//                            aObj.filteredLookupFields.push()
//                        }
                    }
                    if (self._aMetadata['CustomField'] == undefined && self._aFlag['CustomField'] == undefined) {
                        self._aFlag['CustomField'] = true;
                        self._parent._prependQueue(function(){
                            self._loadCustomFieldsInfo();
                        });
                    }
                }
            }
            
            if (['PICKLIST', 'MULTIPICKLIST', 'COMBOBOX'].indexOf(aObj.type) >= 0 ) {
                aObj.options = [];
                if (aFields[nI].picklistValues != undefined) {
                    var aCheckOptions = jQuery.isArray(aFields[nI].picklistValues) ? aFields[nI].picklistValues : [aFields[nI].picklistValues];
                    for (nJ = 0; nJ < aCheckOptions.length; nJ++) {
                        if (!self._isTrue(aCheckOptions[nJ].active)) {
                            continue;
                        }
                        aObj.options.push({ 
                            "key"       : aCheckOptions[nJ].value, 
                            "value"     : aCheckOptions[nJ].label, 
                            "default"   : self._isTrue(aCheckOptions[nJ].defaultValue)
                        });
                        if (!aObj.isDependent && aCheckOptions[nJ].validFor) {
                            aObj.isDependent = true;
                        }

                    }
                }
            }
            if (['DOUBLE', 'NUMBER', 'CURRENCY', 'PERCENT'].indexOf(aObj.type) >= 0 && aFields[nI].scale != undefined) {
                var nScale = aFields[nI].scale,
                    nPow = aFields[nI].precision - nScale;
                aObj.attr = {
                    step : nScale == 0 ? 1 : 1 / Math.pow(10, nScale)
                }
                if (nPow <= 15) {
                    aObj.attr.min = -1 * Math.pow(10, nPow) + aObj.attr.step;
                    aObj.attr.max = Math.pow(10, nPow) - aObj.attr.step;
                }

            }
            aResult[sName] = aObj;
        }
        return aResult;
    }
    
    self._loadWithApex = function(aLoad) {
        var aListToLoad = aLoad.slice(), aNames = [];
        aListToLoad.length = aListToLoad.length > 20 ? 20 : aListToLoad.length;
        self._parent._prependQueue([
            function(){
                self._parent._request({
                    "jsRemote"  : true,
                    data        : {"objects" : aLoad.numerize()},
                    requestType : self._parent.options.serverEvent.objectStructure
                }, function(data) {
        //                    aResult = data;
                    if (data.sess != undefined 
                        && self._parent.options.session  == '' 
                        && self._parent.options.lighthning == null
                    ) {
                        self._parent.options.session = data.sess;
                    }
                    if (data.result == 'list') {
                        jQuery.each(data.list, function(sKey, oEl){
                            oEl.iseditable = oEl.iseditable != undefined ? oEl.iseditable : oEl.editable;
                            oEl.iscreateable = oEl.iscreateable != undefined ? oEl.iscreateable : oEl.createable;
                            oEl.feedEnabled = oEl.feedEnabled != undefined ? oEl.feedEnabled : false;
                            self._objectCache[sKey] = oEl;
                            aNames.push(sKey);
                        })
                    } else {
                        data.iseditable = data.iseditable != undefined ? data.iseditable : data.editable;
                        data.iscreateable = data.iscreateable != undefined ? data.iscreateable : data.createable;
                        data.feedEnabled = data.feedEnabled != undefined ? data.feedEnabled : false;
                        self._objectCache[aLoad[0]] = data;
                        aNames.push(aLoad[0]);
                    }
                    if (aListToLoad.length == 50 && aLoad.diff(aListToLoad).length > 0) {
                        self._parent._prependQueue(function(){
                            self._loadWithApex(aLoad.diff(aListToLoad));
                        }, false);
                    }
                    self._storeCacheObjects(aNames);
                });
            }]
        );
    }
    
    self._prepareLinkedObjects = function(aObjects, bOnlySingle) {
        var aRefObjects = [];
        for (var nObj = 0; nObj < aObjects.length; nObj++) {
            if (self._objectCache[aObjects[nObj]] == undefined) {
                continue;
            }
            var aFields = Array.objectValues(self._objectCache[aObjects[nObj]].fields);
            for (var nI = 0; nI < aFields.length; nI++) {
                if (aFields[nI].type != 'REFERENCE') {
                    continue;
                }
                if (bOnlySingle === true && aFields[nI].options.length > 1) {
                    continue;
                }
                for (var nJ = 0; nJ < aFields[nI].options.length; nJ++) {
                    aRefObjects.push(aFields[nI].options[nJ].name.toLowerCase());
                }
            }
            
        }
        return aRefObjects.unique();
    }
    
    self._loadWithRest = function(aList) {
        var aRealList = aList.unique();
        if (self._parent.options.session == undefined || !self._checkProfile('api')) {
            self._loadWithApex(aRealList);
            return;
        }
        self._parent._prependQueue([
            function(){
                for (var nJ = 0; nJ < aRealList.length; nJ++) {
                    var dT = self._aRESTCache[aRealList[nJ]] != undefined && self._aRESTCache[aRealList[nJ]].dt > 0
                            ? new Date(self._aRESTCache[aRealList[nJ]].dt)
                            : null,
                        aRequest = {
                            _hidden : {_requestObject : aRealList[nJ]},
                            url : "/services/data/v37.0/sobjects/" + aRealList[nJ] + "/describe",
                            func : function(data, sTextStatus, oRequest, oRequestParams){
                                if (data == undefined && sTextStatus == 'notmodified') {
                                    var sObjName = oRequestParams._hidden._requestObject;
                                    self._objectCache[sObjName] = self._aRESTCache[sObjName];
                                } else {
                                    self._addConnectorObjects([data]);
                                };
                            },
                            error : function(){
                                self._loadWithApex(aRealList);
                                nJ = aRealList.length;
                            }
                        };
                    if (dT != null && !isNaN(dT)) {
                        aRequest.headers = {"If-Modified-Since" : dT.toUTCString()};
                    }
                    self._restAPI(aRequest);
                }
            }
        ]);
        
    }
    
    self._getObjectStructure = function(sObjectname, fFunc) {
        if (fFunc != undefined) {
            self._getObject(sObjectname, function(oObj){
                if (typeof(fFunc) == 'function') {
                    fFunc(oObj.fields, oObj);
                }
            });
        }
    }
    
    self._checkObjectLoadedOptions = function(mObjects) {
        var aStructure, 
            aFieldsToCheck = {},
            nI;
//        if (mObjects != undefined && );
        mObjects = typeof(mObjects) == 'string' ? [mObjects] : mObjects;
        for (nI = 0; nI < mObjects.length; nI++) {
            if (self._objectCache[mObjects[nI]] == undefined
                || (aStructure = self._objectCache[mObjects[nI]].fields) == undefined
            ) {
                continue;
            }
            
            jQuery.each(aStructure, function(sField, aField) {
                if (['PICKLIST', 'COMBOBOX', 'MULTIPICKLIST'].indexOf(aField.type) >= 0
                    && aField.options.length == 0
                ) {
                    
                    if (typeof(aFieldsToCheck[mObjects[nI]]) == 'undefined') {
                        aFieldsToCheck[mObjects[nI]] = [];
                    }
                    if (aFieldsToCheck[mObjects[nI]].indexOf(sField) < 0) {
                        aFieldsToCheck[mObjects[nI]].push(sField);
                    }
                }
            });
//            if (self._checkObjectPropertiesAfter.indexOf(mObjects[nI]) >= 0) {
                self._checkObjectProperty(mObjects[nI]);
//            }
        }
        self._checkLoadedOptions(aFieldsToCheck);
    }
    
    self._checkLoadedOptions = function(aFieldsToCheck) {
        var aToLoad = {}, nCounter = 0;
        jQuery.each(aFieldsToCheck, function(sObj, aFields) {
            
//            aToLoad = {};
            for (var nI = 0; nI < aFields.length; nI++) {
                if (aToLoad[sObj] == undefined) {
                   aToLoad[sObj] = '';
                }
                nCounter++;
                aToLoad[sObj] += (aToLoad[sObj] != '' ? ',' : '') + aFields[nI];
//                if (nCounter % 10 == 0 ) {
//                    self._getPicklistOptions(aToLoad);
//                    aToLoad = {};
//                }
            }
        });
        if (!jQuery.isEmptyObject(aToLoad)) {
            self._getPicklistOptions(aToLoad);
        }
    }
    
    self._getPicklistOptions = function(aObjectFields) {
        var aNames = [];
        self._parent._prependQueue(function(){
            self._getFieldOptions(
            {
                picklist : aObjectFields,
                fobj     : ''
            },
            function(aResult){
                if (aResult == undefined) {
                    aResult = {};
                }
                jQuery.each(aResult, function(sObj, aFields){
                    jQuery.each(aFields, function(sField, aOptions){
                        if (typeof(self._objectCache[sObj]) != 'undefined'
                            && self._objectCache[sObj].fields != undefined
                            && self._objectCache[sObj].fields[sField] != undefined
                        ) {
                            self._objectCache[sObj].fields[sField].options = aOptions;
                            aNames.push(sObj);
                        }
                    });
                });
                self._storeCacheObjects(aNames);
                
            }
            );
        });
    }
    
    self._getFieldOptions = function(aParams, fFunc) {
        var aResponce,
            nMultiplier = aParams.hm * 20 > 200 ? 200 : aParams.hm * 20,
            nRealHm = aParams.hm,
            sHash = (aParams.cid != undefined && aParams.fid != undefined)
                ? (aParams.cid + "_" + aParams.fid + "_" 
                    + (parseInt(aParams.page / (nMultiplier)))
                    + (aParams.text != undefined ? aParams.text : "") + "-_"
                    + (aParams.obj != undefined ? aParams.obj : "") + "-_"
                    + (aParams.sort != undefined && aParams.sort != null ? aParams.sort : "") + "-_"
                    + (aParams.filters != undefined && aParams.filters.length > 0 ? JSON.stringify(aParams.filters) : "") + "-_"
                ).hashCode()
                : null,
            dNow;
        
        if (sHash != null) {
            dNow = Date.getTimeStamp() / 1000;
            if (self._aCacheFieldOptions[sHash] != undefined && self._aCacheFieldOptions[sHash]['time'] + 100 >= dNow ){
                return self._getHashOptions(sHash, aParams, fFunc);
            }
            aParams.hm = nMultiplier;
        }
        self._parent._request({
            "jsRemote"      : true,
            "requestType"   : "getCalendarFieldOptions", 
            "data"          : aParams
        }, function(data) {
            if (data.status == 200 && typeof(data.result) != 'undefined') {
                aResponce = data.result;
            } else {
                //aResponce;
            }
            if (sHash != undefined) {
                if (data.result != undefined && (aParams.sort == undefined || aParams.sort == '')) {
                    data.result.quickSort('name');
                }
                data.columns = data.columns || aParams.obj === '005' 
                        || (aParams.fields != undefined && aParams.fields != null && aParams.fields.length > 0);
                self._aCacheFieldOptions[sHash] = data;
                self._aCacheFieldOptions[sHash]['time'] = dNow;
                aParams.hm = nRealHm;
                self._getHashOptions(sHash, aParams, fFunc);
            } else if (typeof(fFunc) == 'function') {
                fFunc.call(this, aResponce, {next : data.next, prev : data.prev, columns : data.columns || aParams.obj === '005'});
            }
        });
        
    }
    
    self._getHashOptions = function(sHash, aParams, fFunc) {
//        console.log(sHash, aParams);
        var nMultiplier = aParams.hm * 20 > 200 ? 200 : aParams.hm * 20,
            aData = self._aCacheFieldOptions[sHash].result != undefined 
                ? self._aCacheFieldOptions[sHash].result
                : [],
            nCurPage = aParams.page - nMultiplier * parseInt(aParams.page / (nMultiplier)),
            aReasulData = aData.length > nCurPage
                ? aData.slice(nCurPage, Math.min(aData.length, nCurPage + aParams.hm))
                : [];
        if (typeof(fFunc) == 'function') {
            fFunc.call(
                this, 
                aReasulData, 
                {
                    next : (nCurPage + aParams.hm < aData.length ? true : self._aCacheFieldOptions[sHash].next), 
                    prev : aParams.page > 0,
                    columns : self._aCacheFieldOptions[sHash].columns
                }
            );
        }
    }
    
    self._checkObjectProperty = function(sName) {
        var aObj = self._objectCache[sName];
        if (typeof(aObj.fields['whatid']) != 'undefined') {
            if (aObj.fields['whatid'].options.length > 2) {
                aObj.fields['whatid'].label = "Related To";
            }
        }
        if (typeof(aObj.fields['createdbyid']) != 'undefined') {
            aObj.fields['createdbyid'].label = "Created By";
        }
        if (typeof(aObj.fields['lastmodifiedbyid']) != 'undefined') {
            aObj.fields['lastmodifiedbyid'].label = "Last Modified By";
        }
        
//        if (typeof(aObj.fields['whoid']) != 'undefined') {
//            aObj.fields['whoid'].label = "Name";
//        }
        if (sName == 'event' || sName == 'task'){
            if (typeof(aObj.fields['ownerid']) != 'undefined') {
                aObj.fields['ownerid'].label = "Assigned To";
            }
            if (typeof(aObj.fields['whoid']) != 'undefined') {
                aObj.fields['whoid'].label = "Name";
            }
            if (typeof(aObj.fields['activitydate']) != 'undefined') {
                aObj.fields['activitydate'].label = "Due Date";
            }
            if (sName == 'task') {
                if (typeof(aObj.fields['status']) != 'undefined') {
                    aObj.fields['status'].isRequired = true;
                }
                if (typeof(aObj.fields['priority']) != 'undefined') {
                    aObj.fields['priority'].isRequired = true;
                }
            }
            
            
        }
//        switch (sName) {
//            case "event" :
//        }
    }

    self._getObjectFilterFields = function(mName, fFunc, aParams) {
        mName = typeof(mName) == 'string' ? [mName] : mName;
        self._getObjects(mName, function(aObject){
            var aResultStructure = {},
                nI,
                aFilterTypes = typeof(aParams['type']) == 'undefined' 
                    ? undefined
                    : (typeof(aParams['type']) == 'string' 
                        ? [aParams['type']]
                        : aParams['type']);
            for (nI = 0; nI < mName.length; nI++) {
                var aAllFields = self._objectCache[mName[nI]] != undefined
                    ? self._objectCache[mName[nI]].fields
                    : {};
                if (aFilterTypes === undefined) {
                    aResultStructure[mName[nI]] = aAllFields;
                } else {
                    aResultStructure[mName[nI]] = {};
                    jQuery.each(aAllFields, function(sField, aField){
                        if (aFilterTypes.indexOf(aField.type) >= 0) {
                            aResultStructure[mName[nI]][sField] = aField;
                        }
                    });
                }
            }
            if (aParams.intersect === true) {
                var aIntersectFields = [], nObjects = 0;;
                jQuery.each(aResultStructure, function(sObj, aFld) {
                    if (aIntersectFields.length == 0) {
                        aIntersectFields = Array.objectKeys(aFld);
                    } else {
                        aIntersectFields = aIntersectFields.intersect(Array.objectKeys(aFld))
                    }
                    nObjects++;
                });
                if (nObjects > 1) {
                    for (nI = 0; nI < aIntersectFields.length; nI++) {
                        jQuery.each(aResultStructure, function(sKey, aFields){
                            var aDelete = Array.objectKeys(aFields).diff(aIntersectFields);
                            aDelete.map(function(sField){
                                aResultStructure[sKey][sField] = null;
                                delete aResultStructure[sKey][sField];
                            });
                        });
                    }
                }
            }
            if (typeof(fFunc) == 'function') {
                fFunc.call(this, aResultStructure);
            }                        
        });
    }

    self._getLinkedObjectsFields = function(aField, aTypes, bSort, sObjectName) {
        var sObj, aKeys = null, aFields = [], nI;
        if (self._checkPolyField(sObjectName, aField.name)) {
                
            var aObjectAsOptions = [];
            for (nI = 0; nI < aField.options.length; nI++) {
                aObjectAsOptions.push({
                    "name" : aField.options[nI].name.toLowerCase(),
                    "value" : aField.options[nI].name.toLowerCase()
                });
            }

            var aNamePolymorphic = Array.objectValues(self._aNamePolymorphic);
            aNamePolymorphic[4]["options"] = aObjectAsOptions; // 4 - means type field
            if (aTypes != undefined) {
                for (nI = 0; nI < aNamePolymorphic.length; nI++) {
                    if (aTypes.indexOf(aNamePolymorphic[nI].type) >= 0) {
                        continue;
                    }
                    aNamePolymorphic.splice(nI, 1);
                    nI--;
                }
            }
            return aNamePolymorphic;
        }
        
        for (nI = 0; nI < aField.options.length; nI++) {
            sObj = aField.options[nI].name.toLowerCase();
            if (self._objectCache[sObj] == undefined) {
                continue;
            }
            aKeys = (aKeys == null) 
                ? Array.objectKeys(self._objectCache[sObj].fields)
                : aKeys.intersect(Array.objectKeys(self._objectCache[sObj].fields));
        }
        if (aKeys == null || aKeys.length == 0) {
            return aFields;
        }
        
        sObj = aField.options[0].name.toLowerCase();
        if (self._objectCache[sObj] == undefined) {
            return aFields;
        }
        var aTemp = self._objectCache[sObj].fields;
        for (nI = 0; nI < aKeys.length; nI++) {
            if (aTypes != undefined && aTypes.indexOf(aTemp[aKeys[nI]].type) < 0) {
                continue;
            }
            aFields.push(aTemp[aKeys[nI]]);
        }
        if (typeof(bSort) == 'boolean' && bSort === true) {
            aFields.quickSort(self._sortFieldsByLabel);
        }
        return aFields;
    }
    
    self._sortFieldsByLabel = function(a,b){
        if (a.label.toLowerCase() < b.label.toLowerCase()) {
            return -1;
        } else if (a.label.toLowerCase() > b.label.toLowerCase()) {
            return 1;
        }
        return 0;
    }
    
    self._getObjectFieldByName = function(sObject, sField) {
        if (sField == undefined || (sObject != 'common' && self._objectCache[sObject] == undefined)) {
            return null;
        }
        if (sField.indexOf('.') >= 0) {
            var aFieldName = sField.split('.'),
                aBaseField = sObject == 'common' 
                    ? self._aCommonFields[aFieldName[0]]
                    : self._objectCache[sObject].fields[aFieldName[0]];
            if (aBaseField == null 
                || aBaseField.type != 'REFERENCE' 
                || aBaseField.options == undefined 
                || aBaseField.options.length == 0
            ) {
                return null;
            }
            
            if (self._checkPolyField(sObject, sField)) {
                if (self._aNamePolymorphic[aFieldName[1]] == undefined){
                    return null;
                }
                var aReturnField = jQuery.extend({}, self._aNamePolymorphic[aFieldName[1]]);
                if (aFieldName[1] == 'type') {
                    var aObjectAsOptions = [];
                    for (var nI = 0; nI < aBaseField.options.length; nI++) {
                        aObjectAsOptions.push({
                            "name" : aBaseField.options[nI].name.toLowerCase(),
                            "value" : aBaseField.options[nI].name.toLowerCase()
                        });
                    }
                    aReturnField['options'] = aObjectAsOptions;
                }
                return aReturnField;
            }
            
            for (var nI = 0; nI < aBaseField.options.length; nI++) {
                var sRefObject = aBaseField.options[nI].name.toLowerCase();
                if (self._objectCache[sRefObject] == undefined) {
                    continue;
                }
                if (self._objectCache[sRefObject].fields[aFieldName[1]] != undefined) {
                    return self._objectCache[sRefObject].fields[aFieldName[1]];
                }
            }
            
            return null;
        } else {
            return sObject == 'common' ? self._aCommonFields[sField] : self._objectCache[sObject].fields[sField];
        }
    }
    
    
    self._addObject = function(oObjectData){
        self._objectCache[oObjectData.name] = oObjectData;
        self._parent._prependQueue(function(){
            self._checkObjectLoadedOptions([oObjectData.name]);
        });
        self._storeCacheObjects(oObjectData.name);
    }
    
    
    self._loadReferenceObjects = function(sObject, fFunc) {
        if (self._objectCache[sObject] == undefined || typeof(self._objectCache[sObject].fields) == 'undefined') {
            return null;
        }
        var aRefObjects = [], aFields = Array.objectValues(self._objectCache[sObject].fields);
        for (var nI = 0; nI < aFields.length; nI++) {
            if (aFields[nI].type != 'REFERENCE') {
                continue;
            }
            for (var nJ = 0; nJ < aFields[nI].options.length; nJ++) {
                aRefObjects.push(aFields[nI].options[nJ].name.toLowerCase());
            }
        }
        aRefObjects = aRefObjects.unique();
//        console.log(aRefObjects);
        self._getObjects(aRefObjects, function(aObjectFields){
            if (typeof(fFunc) == 'function') {
                fFunc(aObjectFields);
            }
        });        
    }
    
    self._refreshSimple = function(aList) {
        if (aList == null && self._bSmpleRefreshed == true){
            return;
        }
        if (aList != null) {
            aList = aList.diff(self._objectSimple != null ? Array.objectKeys(self._objectSimple) : []);
        }
        self._parent._request({
                "jsRemote"  : true,
                data        : {"objects" : aList != undefined ? aList.numerize() : []},
                requestType : "simpleList"
            }, function(data) {
                if (aList == null ) {
                    self._bSmpleRefreshed = true;
                }
                self._initSimpleList(data, true);
            }
        )
    }
    
    self._initSimpleList = function(aList, bUpdate) {
        bUpdate = bUpdate || false;
        if (self._parent.options.site === true) {
            return;
        }
        if (!bUpdate)  {
            if (self._objectSimple != null) {
                return;
            }
            self._objectSimple = {};
        }
        
        var bAccessChecking = false;
        for (var nI = 0; nI < aList.length; nI++) {
            aList[nI].editable = aList[nI].editable == true || aList[nI].editable == 'true';
            aList[nI].accessible = aList[nI].accessible == true || aList[nI].accessible == 'true';
            self._objectSimple[aList[nI].name] = aList[nI];
            if (!bAccessChecking && !aList[nI].accessible) {
                bAccessChecking = true;
            }
            self._aObject2Key[aList[nI].name] = aList[nI].keyprefix;
            self._aKey2Object[aList[nI].keyprefix] = aList[nI].name;
        }
        if (bAccessChecking 
            && self._parent.options.session != undefined 
            && self._parent.options.session != ''
            && self._checkProfile('api')
        ) {
//            self._checkObjectsWithConnector();
            self._checkObjectsWithRest()
        }
    }
    
    self._checkObjectsWithConnector = function() {
        var sName, nI,
            aAllNames = Array.objectKeys(self._objectSimple),
            aPresentNames = [];
        self._parent._prependQueue([
            function(){
                
                if (window['sforce'] == undefined 
                    || self._parent.options.lighthning != null
                    || window['sforce'].connection == undefined
                ) {
                    return;
                }
                self._parent.waitQueue(1);

                window['sforce'].connection.sessionId = self._parent.options.session;
                window['sforce'].connection.describeGlobal({
                        onSuccess : function(data){
                            for (nI = 0; nI < data.sobjects.length; nI++) {
                                sName = data.sobjects[nI].name.toLowerCase();
                                aPresentNames.push(sName);
                                if (self._objectSimple[sName] == undefined) {
                                } else if (self._objectSimple[sName].accessible && data.sobjects[nI].retrieveable == 'false') { 
                                    self._objectSimple[sName].accessible = false;
                                    self._objectSimple[sName].editable = false;
                                }
                            }
                            var aDiff = aAllNames.diff(aPresentNames);
                            if (aDiff.length > 0) {
                                for (var nI = 0; nI < aDiff.length; nI++) {
                                    self._objectSimple[aDiff[nI]].accessible = false;
                                    self._objectSimple[aDiff[nI]].editable = false;
                                }
                            }
                            self._parent._aAPICache.simple = self._objectSimple;
                            self._parent._aAPICache.simpleDt = parseInt(Date.getTimeStamp() / 1000);
                            self._parent._saveAPICache();
                            self._parent.waitQueue(-1);

                        },
                        onFailure : function() {
                            self._parent.options.session = undefined;
                            window['sforce'].connection.sessionId = undefined;
                            self._parent.waitQueue(-1);
                        }
                    });
            },
            function(){
                self._initConnectLib();
            },
        ]);
    }
    
    self._checkObjectsWithRest = function() {
        var sName, nI,
            aAllNames = Array.objectKeys(self._objectSimple),
            aPresentNames = [];
        self._parent._prependQueue([
            function(){
                self._restAPI({
                    url : '/services/data/v37.0/sobjects/',
                    func : function(data){
                        for (nI = 0; nI < data.sobjects.length; nI++) {
                            sName = data.sobjects[nI].name.toLowerCase();
                            aPresentNames.push(sName);
                            if (self._objectSimple[sName] == undefined) {
                            } else if (self._objectSimple[sName].accessible && !data.sobjects[nI].retrieveable) { 
                                self._objectSimple[sName].accessible = false;
                                self._objectSimple[sName].editable = false;
                            } 
                            if (self._objectSimple[sName] != undefined && self._objectSimple[sName].feedEnabled != data.sobjects[nI].feedEnabled) {
                                self._objectSimple[sName].feedEnabled = data.sobjects[nI].feedEnabled;
                            }
                        }
                        var aDiff = aAllNames.diff(aPresentNames);
                        if (aDiff.length > 0) {
                            for (var nI = 0; nI < aDiff.length; nI++) {
                                self._objectSimple[aDiff[nI]].accessible = false;
                                self._objectSimple[aDiff[nI]].editable = false;
                            }
                        }
                        self._parent._aAPICache.simple = self._objectSimple;
                        self._parent._aAPICache.simpleDt = parseInt(Date.getTimeStamp() / 1000);
                        self._parent._saveAPICache();
                        
                    }
                });
            }
//            function(){
////                self._initConnectLib();
//            },
        ]);
    }
    
    self._splitAccess = function(aList) {
        var aResult = {"private" : [], "public" : []};
        for (var nI = 0; nI < aList.length; nI++) {
            if (self._objectSimple == null || self._objectSimple[aList[nI]] == undefined || !self._objectSimple[aList[nI]].accessible) {
                aResult["private"].push(aList[nI]);
            } else {
                aResult["public"].push(aList[nI]);
            }
        }
        return aResult;
    }
    
    self._initConnectLib = function(){
        if ((window['sforce'] == undefined  || window['sforce'].connection == undefined)
            && self._parent.options.session != '' 
            && self._parent.options.site !== true 
            && self._parent.options.lighthning == null
            && self._checkProfile('api')
        ) {
            self._parent._initScripts('//soap/ajax/37.0/connection.js');
            return true;
        } 
        return self._parent.options.session != undefined && self._parent.options.session != ''
            && self._parent.options.site !== true;
    } 
    
    self._checkPolyField = function(sObject, sField) {
        var aFieldName = sField.split('.'),
            aBaseField = sObject == 'common' 
                ? self._aCommonFields[aFieldName[0]] 
                : self._objectCache[sObject].fields[aFieldName[0]];
        if (aFieldName.length == 1 && aBaseField == undefined) {
            return false;
        }
        if (aBaseField.options != null && aBaseField.options.length > 1 ||
                (['ownerid', 'whatid', 'whoid'].indexOf(aFieldName[0]) >= 0
                    && (
                        sObject.indexOf('__c') >= 0 
                        || ['event', 'task'].indexOf(sObject) >= 0
                    )
                )
        ) {
            return true;
        }
        if (aFieldName[1] === 'userroleid') {
            return true;
        }
        return false;
    }
        
        
        
    self._getFieldSimpleTextValue = function(sType, mValue) {
        if (mValue === undefined || mValue === null) {
            return '';
        }
        if (sType != undefined && self['_getFieldValue' + sType.toLowerCase()] != undefined) {
            return self['_getFieldValue' + sType.toLowerCase()](mValue);
        } else {
            return mValue;
        }
    }
    
    self._getFieldValuedate = function(mValue) {
        var dDate = new Date.preParseSF(mValue, 'DATE');
        return dDate.format(self._parent.options.format['date']);
    }
    
    self._getFieldValuedatetime = function(mValue) {
        var dDate = new Date.preParseSF(mValue, 'DATETIME');
        return dDate.format(self._parent.options.format['shortDatetime']);
    }
    
    self._checkRecordType = function(sObj, sId, fFunc) {
        var aField, sFieldName, sRealValue = sId, bApex = false;
        
        self._parent._addQueue([
            function(){
                self._initConnectLib();
            },
            function(){
                if (
                        !window['sforce'] 
                        || self._parent.options.lighthning != null
                        || window['sforce'].connection == undefined 
                        || self._objectCache[sObj] == undefined
                ) {
                    self._checkRecordTypeApex(sObj, sId, fFunc);
                    bApex = true;
                    return;
                }
                if (self._objectRecordTypes[sObj] == undefined) {
                    self._parent.waitQueue(1);
                    if (window['sforce'].connection.sessionId == undefined) {
                        window['sforce'].connection.sessionId = self._parent.options.session;
                    }
                    window['sforce'].connection.describeLayout(sObj, null, null, function(data){
                        var aRecordTypesData = jQuery.isArray(data.recordTypeMappings) ? data.recordTypeMappings : [];
                        self._objectRecordTypes[sObj] = {};
                        self._objectRecordAvailableList[sObj] = [];
                        self._objectRecordTypesDefault[sObj] = {};
                        var aDepOpts, aDefaultValues;
                        for (var nI = 0; nI < aRecordTypesData.length; nI++) {
                            if (aRecordTypesData[nI]['available'] == 'false' 
                                || aRecordTypesData[nI]['available'] == false
                                || aRecordTypesData[nI]['name'].toLowerCase() == 'master'
                            ) {
                                continue;
                            }
                            
                            aDepOpts = {};
                            aDefaultValues = {};
                            if (aRecordTypesData[nI]['picklistsForRecordType'] != undefined) {
                                for (var nJ = 0; nJ < aRecordTypesData[nI]['picklistsForRecordType'].length; nJ++) {
                                    var aOpt = [],
                                        aPickList = aRecordTypesData[nI]['picklistsForRecordType'][nJ]['picklistValues'];
                                    aPickList = jQuery.isArray(aPickList) ? aPickList : [aPickList];
                                    sFieldName = aRecordTypesData[nI]['picklistsForRecordType'][nJ]['picklistName'].toLowerCase();
                                    for (var nO = 0; nO < aPickList.length; nO++) {
                                        aOpt.push(aPickList[nO].value);
                                        if (aPickList[nO].defaultValue == 'true') {
                                            aDefaultValues[sFieldName] = aPickList[nO].value;
                                        }
                                    }

                                    aDepOpts[sFieldName] = aOpt;
                                }
                            }
                            self._objectRecordTypes[sObj][aRecordTypesData[nI]['recordTypeId']] = aDepOpts;
                            self._objectRecordTypesDefault[sObj][aRecordTypesData[nI]['recordTypeId']] = aDefaultValues;
                            self._objectRecordAvailableList[sObj].push({
                                "key"       : aRecordTypesData[nI]['recordTypeId'],
                                "name"      : aRecordTypesData[nI]['name'],
                                "default"   : aRecordTypesData[nI]['defaultRecordTypeMapping'] != 'false' 
                                                && !!aRecordTypesData[nI]['defaultRecordTypeMapping']
                            });
                        }
                        self._parent._aAPICache.recordTypes[sObj] = self._objectRecordTypes[sObj];
                        self._parent._aAPICache.recordTypesDt[sObj] = Date.getTimeStamp();
                        self._parent._aAPICache.recordTypesDefault[sObj] = self._objectRecordTypesDefault[sObj];
                        self._parent._aAPICache.recordAvailableList[sObj] = self._objectRecordAvailableList[sObj];
                        self._parent._saveAPICache();
                        self._parent.waitQueue(-1);
                    });    
                }
            }, 
            function() {
                if (self._objectRecordAvailableList[sObj] == undefined || bApex) {
                    return;
                }
                if (sRealValue == null 
                    && self._objectRecordAvailableList[sObj] != undefined 
                    && self._objectRecordAvailableList[sObj].length > 0
                ) {
                    var aDefault = self._objectRecordAvailableList[sObj].filter(function(oEl){
                        return oEl['default'] === true;
                    });
                    if (aDefault != undefined && aDefault.length > 0) {
                        sRealValue = aDefault.pop().key;
                    }
                        
                }
                fFunc(
                    sRealValue != null  ? self._objectRecordTypes[sObj][sRealValue] : null, 
                    self._objectRecordAvailableList[sObj],
                    sRealValue != null ? self._objectRecordTypesDefault[sObj][sRealValue] : null
                );
            }
        ])
    }
    
    self._checkRecordTypeApex = function(sObj, sId, fFunc){
        if (typeof(self._objectRecordAvailableList[sObj]) != 'undefined') {
            if (fFunc != undefined) {
                fFunc(null, self._objectRecordAvailableList[sObj], null);
            }
            return ;
        }
        return self._getFieldOptions({
            fobj : sObj,
            fid : "recordtypeid",
            text : ''
//            cid : ''
        }, function(aResult){
            if (aResult == undefined) {
                fFunc(null, [], null);
            }
            for (var nJ = 0; nJ < aResult.length; nJ++) {
                aResult[nJ].default = aResult[nJ].default === 'true';
//                aResult[nJ].key = aResult[nJ].id;
            }
            self._objectRecordAvailableList[sObj] = aResult;
            fFunc(null, aResult, null);
        });
    }
    
    
    self._getObjectLabel = function(sObjectName){
        
        if (self._objectSimple[sObjectName] != undefined) {
            return self._objectSimple[sObjectName].label;
        } else if (sObjectName == 'common') {
            return 'Common';
        }
        return null;
    }
    
    self._storeCacheObjects = function(mValue) {
        if (typeof(mValue) == 'string') {
            mValue = [mValue];
        }
        var tNow = Date.now();
        for (var nI = 0; nI < mValue.length; nI++) {
            self._parent._aAPICache.objects[mValue[nI]] = self._objectCache[mValue[nI]];
            self._parent._aAPICache.objects[mValue[nI]].dt = tNow;
            self._aRESTCache[mValue[nI]] = self._parent._aAPICache.objects[mValue[nI]];
        }
        if (window.localStorage != undefined) {
            try {
                window.localStorage['aRESTCache'] = JSON.stringify(self._aRESTCache);
            } catch (e) {
                self._aRESTCache = {};
                window.localStorage['aRESTCache'] = JSON.stringify(self._aRESTCache);
            }
        }
        self._parent._saveAPICache();
    }
    
    self._getObjectsFieldsIntesect = function(mObjects, mType, fFunc){
        var aResult = [],
            aFields = {},
            bNewMode = true,
            aTmpResult = [],
            sName;
        mType = typeof(mType) == 'string' ? [mType] : mType;
        self._getObjects(mObjects, function(aObjs) {
            jQuery.each(aObjs, function(sKey, aObj) {
                sName = sKey;
                aTmpResult = [];
                jQuery.each(aObj.fields, function(sField, aField){
                    if (mType != undefined && mType.indexOf(aField.type) < 0) {
                        return;
                    }
                    aTmpResult.push(sField);
                })
                aResult = bNewMode ? aTmpResult : aResult.intersect(aTmpResult);
                bNewMode = false;
            });
            for (var nJ = 0; nJ < aResult.length; nJ++) {
                aFields[aResult[nJ]] = self._objectCache[sName].fields[aResult[nJ]];
            }
            if (typeof(fFunc) == 'function') {
                fFunc(aFields);
            }
        });
    }
    
    self._loadSpecialSettings = function(sName, fFunc, aParams) {
        if (self._aSpecialSettings[sName] != undefined) {
            if (fFunc != undefined) {
                fFunc(self._aSpecialSettings[sName]);
            }
            return;
        }
        var aRequestData = {"name" : sName};
        if (aParams != undefined && aParams.data != undefined) {
            jQuery.extend(aRequestData, aParams.data);
        }
        self._parent._request({
                "jsRemote"  : true,
                data        : aRequestData,
                requestType : self._parent.options.serverEvent.getSettings
            }, function(data) {
                if (typeof(data) == 'string') {
                    data = JSON.parse(data);
                }
                self._aSpecialSettings[sName] = data;
                if (fFunc != undefined) {
                    fFunc(data);
                }
            }
        );
    }
    
    self._saveSpecialSettings = function(sName, mData, aParams, fFunc) {
        self._aSpecialSettings[sName] = mData;
        var aRequestData = {
            "name" : sName, 
            "data" : (aParams != undefined && aParams.stringify === true ? JSON.stringify(mData) : mData), 
            'owner' : (aParams != undefined && aParams.owner === true ? 'true' : '')
        };
        if (aParams != undefined && aParams.data != undefined) {
            jQuery.extend(aRequestData, aParams.data);
        }
        self._parent._request({
                "jsRemote"  : true,
                data        : aRequestData,
                requestType : self._parent.options.serverEvent.saveSettings,
                serverPath  : "event"
            }, function(data) {
                if (fFunc != undefined) {
                    fFunc(data);
                }
            }
        );
        if (sName == 'lookupFields') {
            self._aCacheFieldOptions = {};
        }
    }
    
    self._getMetadata = function(sName, fFunc, aParams) {
        var aResult = [];
        if (self._aMetadata[sName] != undefined) {
            if (typeof(fFunc) == 'function') {
                fFunc(self._aMetadata[sName]);
            }
            return;
        }
        self._parent._prependQueue([
            function(){
                if (typeof(fFunc) == 'function') {
                    fFunc(aResult);
                }
            },
            function(){
                if (window.sforce == undefined || window.sforce.metadata == undefined || self._parent.options.lighthning != null) {
                    return;
                }
                if (window['sforce'].metadata.sessionId == undefined) {
                    window['sforce'].metadata.sessionId = self._parent.options.session;
                }
                self._parent.waitQueue(1);
                sforce.metadata.listMetadata(
                    {
                        queries     : [{"type" : sName}],
                        asOfVersion : 36
                    }, 
                    {
                        onSuccess : function(data){
                            self._aMetadata[sName] = data;
                            aResult = data;
                            self._parent.waitQueue(-1);
                        },
                        onFailure : function() {
                            self._parent.waitQueue(-1);
                        }
                    }
                );
                
                
            },
            function(){
                if (window.sforce == undefined) {
                    return;
                }
                self._parent._initScripts('/plugin/salesforce-metadata.js');
            },
            self._initConnectLib,
        ]);
    }
    
    self._getListviewRecords = function(sObj, sFilterId, fFunc, sQ, sFields) { // sQ = 'name like'%sdd%''        sFields='id,name'
        var oLV;
        if (sFilterId != null && sQ == undefined) {
            for (var nJ = 0; nJ < self._aListViewOptions[sObj].length; nJ++) {
                if (self._aListViewOptions[sObj][nJ].id == sFilterId) {
                    oLV = self._aListViewOptions[sObj][nJ];
                    break;
                }
            }
        }
        
        
        
        if (oLV != undefined && oLV.describeUrl != undefined && self._checkProfile('api')) {
            self._parent._prependQueue([
                function(){
                    var aRequestParams = {"obj" : sObj, 'list_id' : sFilterId};
                    if (oLV.soql != undefined && oLV.soql != '') {
                        aRequestParams.soql = oLV.soql;
                    }
                    self._parent._request({
                        "jsRemote"  : true,
                        data        : aRequestParams,
                        requestType : 'getListviewRecords'
                    }, function(data) {
                        if (fFunc != undefined) {
                            fFunc(data);
                        }
                    });
                },
                function(){
                     if (oLV.soql == undefined) {
                         self._restAPI({
                            url : oLV.describeUrl,
                            func : function(data){
                                var sQ = data.query;
                                if (sQ.indexOf('WHERE') < 0 || sQ.indexOf('ORDER BY') <= 0) {
                                    oLV.soql = '';
                                } else  {
                                    oLV.soql = sQ.substring(sQ.indexOf('WHERE') + 6, sQ.indexOf('ORDER BY'));
                                }
                                oLV.filters = data.whereCondition;
                            }
                        });
                     }
                }
                
            ]);
        } else {
            self._parent._request({
                "jsRemote"  : true,
                data        : {"obj" : sObj, 'list_id' : sFilterId, 'soql' : sQ, 'fields' : sFields},
                requestType : 'getListviewRecords'
            }, function(data) {
                if (fFunc != undefined) {
                    fFunc(data);
                }
            });
        }
        
    }
    
    self._getPresetRecords = function(aPresetFilters, fFunc) {
        self._parent._request({
            "jsRemote"  : true,
            data        : {"filters" : aPresetFilters},
            requestType : 'getPresetRecords'
        }, function(data) {
            if (fFunc != undefined) {
                fFunc(data);
            }
        });
    }
    
    self._getListviewOptions = function(sObj, fFunc) {
        if (self._aListViewOptions[sObj] != undefined) {
            if (fFunc != undefined) {
                fFunc(self._aListViewOptions[sObj]);
            }
            return;
        }
        var bUserConnector = self._parent.options.session != undefined 
            && self._parent.options.session != ''
            && self._parent.options.site !== true
            && self._checkProfile('api');
        
        if (bUserConnector) {
            var sVer = sObj == 'user' ? '34' : '37';
            self._restAPI({
                url : "/services/data/v" + sVer + ".0/sobjects/" + sObj + "/listviews",
                func : function(data){
                    self._aListViewOptions[sObj] = data.listviews;
                    if (fFunc != undefined) {
                        fFunc(data.listviews);
                    }
                }, error : function(){
                    self._getListviewOptions(sObj, fFunc);
                }
            });
        } else {
            self._parent._request({
                "jsRemote"  : true,
                data        : {"obj" : sObj},
                requestType : 'getListviewOptions'
            }, function(data) {
                self._aListViewOptions[sObj] = data;
                if (fFunc != undefined) {
                    fFunc(data);
                }
            });
        }
    }
    
    self._savePresets = function(aPresets) {
        self._saveSpecialSettings('swimlane', JSON.stringify(aPresets));
    }
    
    self._restAPI = function(aParams) {
        if (self._parent.options.session == undefined || self._parent.options.session == '' || !self._checkProfile('api')) {
            if (typeof(aParams.error) == 'function') {
                aParams.error();
            }
            return;
        }
        aParams.data = aParams.data || null;
        var aHeaders = {
                "Authorization" : "Bearer " + self._parent.options.session,
                "Content-Type" : "application/json"
            };
        if (aParams.headers != undefined) {
            jQuery.extend(aHeaders, aParams.headers);
        }
        self._parent._request({
            url     : aParams.url,
            cache   : aParams.cache !== false,
            headers : aHeaders,
            data    : aParams.data,
            post    : aParams.post === true,
            HTTPType : aParams.HTTPType ? aParams.HTTPType : undefined,
            _hidden : aParams._hidden != undefined ? aParams._hidden : {},
            error : function(){
                self._parent.options.session = undefined;
                if (window['sforce'] != undefined && window['sforce'].connection != undefined) {
                    window['sforce'].connection.sessionId = undefined;
                }
//                self._parent.waitQueue(-1);
                if (typeof(aParams.error) == 'function') {
                    aParams.error();
                }
            }
        }, aParams.func);
    }
    
    self._loadCustomFieldsInfo = function(){
        var aObjs = Array.objectKeys(self._objectCache);
        if (!self._checkProfile('modifyalldata')) {
            self._loadFieldIdsApex(aObjs.join(','), [], function(data, sName){
                jQuery.each(data, function(sKey, sId){
                    if (typeof(self._objectCache[sName].fields[sKey.toLowerCase()]) == 'undefined') {
                        return;
                    }
                    self._objectCache[sName].fields[sKey.toLowerCase()].id = sId;
                });
//                for (var nJ = 0; nJ < aAllFields.length; nJ++) {
//                    aTemp = aAllFields[nJ].fullName.toLowerCase().split('.');
//                    if (aTemp[0] != sObjName || self._objectCache[sObjName].fields[aTemp[1]] == undefined) {
//                        continue;
//                    }
//                    self._objectCache[sObjName].fields[aTemp[1]].id = aAllFields[nJ].id;
//                }
            });
        } else {
            self._getMetadata('CustomField', function(data){
                for (var nJ = 0; nJ < aObjs.length; nJ++) {
                    self._fillCustomFieldsInfo(aObjs[nJ]);
                }
            });
        }
    }
    
    self._loadFieldIds = function(sObjName, aFields, fFunc){
        var sSQL,
            aObjs = {},
            aNS = {};
            
        sObjName = sObjName.toLocaleLowerCase();
        
        if (!self._checkProfile('apex') || !self._checkProfile('api')) {
            return self._loadFieldIdsApex(sObjName, aFields, fFunc);
        }
        
        if (sObjName.indexOf('__c') >= 0) {
            
        } else if (sObjName == 'event' || sObjName == 'task') {
            sObjName = 'account';
        } else {
            //sObjName = sObjName.capitalize();
        }
        if (self._aSFIDs != null && self._aSFIDs[sObjName] != undefined) {
            return fFunc(self._aSFIDs[sObjName]);
        } else if (self._aSFIDs != null){
            return fFunc({});
        } else {
            self._aSFIDs = {};
            self._parent._addQueue([
                function(){
                    sSQL = 'Select Id, DeveloperName, NamespacePrefix From CustomObject';
                    self._restAPI({
                        url : '/services/data/v37.0/tooling/query/?q=' + encodeURIComponent(sSQL),
                        func : function(data){
                            var sName, sNS;
                            for (var nI = 0; nI < data.records.length; nI++) {
                                sNS = (data.records[nI].NamespacePrefix != '' && data.records[nI].NamespacePrefix != null)
                                    ? data.records[nI].NamespacePrefix.toLowerCase() + '__'
                                    : '';
                                
                                sName = sNS + data.records[nI].DeveloperName.toLowerCase() + '__c';
                                aObjs[data.records[nI].Id] = sName;
                                if (sNS != '') {
                                    aNS[data.records[nI].Id] = sNS;
                                }
                            }
//                            console.log(aObjs);
                        }
                    });
                },
                function(){
                    sSQL = 'Select Id,DeveloperName,NamespacePrefix,TableEnumOrId From CustomField';
                    self._restAPI({
                        url : '/services/data/v37.0/tooling/query/?q=' + encodeURIComponent(sSQL),
                        func : function(data){
                            for (var nI = 0; nI < data.records.length; nI++){
                                var sObj = aObjs[data.records[nI].TableEnumOrId] != undefined
                                    ? aObjs[data.records[nI].TableEnumOrId]
                                    : data.records[nI].TableEnumOrId.toLowerCase(),
                                    sField = (aNS[data.records[nI].TableEnumOrId] != undefined
                                        ? aNS[data.records[nI].TableEnumOrId]
                                        : "")
                                        + data.records[nI].DeveloperName.toLowerCase() + '__c';
                                if (self._aSFIDs[sObj] == undefined) {
                                    self._aSFIDs[sObj] = {};
                                }
                                self._aSFIDs[sObj][sField] = data.records[nI].Id;
                                
                            }
//                            console.log(self._aSFIDs);
                        }
                    });
                }, 
                function(){
                    return self._aSFIDs[sObjName] != undefined ? fFunc(self._aSFIDs[sObjName]) : fFunc({});
                }
            ]);
            
        }
    }
    
    self._loadFieldIdsApex = function(mObjName, aFields, fFunc) {
        if (self._checkProfile('api')) {
            return self._loadFieldIdsREST(mObjName, aFields, fFunc);
        }
        
        var aObjNames = typeof(mObjName) == 'string' ? mObjName.split(',') : mObjName;
//            aToLoad = [];
//        for (var nJ = 0; nJ < aObjNames.length; nJ++) {
//            if (self._aSFIDs == null || self._aSFIDs[aObjNames[nJ]] == undefined) {
//                aToLoad.push(aObjNames[nJ]);
//            }
//        }
//        if (self._aSFIDs != null && self._aSFIDs[sObjName] != undefined) {
//            return fFunc(self._aSFIDs[sObjName]);
//        }
        
        self._parent._addQueue([
            function(){
                self._parent._request({
                    "jsRemote"  : true,
                    data        : {'object' : aObjNames.join(',')},
                    requestType : 'getFieldIds'
                }, function(data) {
                    if (self._aSFIDs == null) {
                        self._aSFIDs = {};
                    }
                    var aKeys = Array.objectKeys(data);
                    for (var nI = 0; nI < aKeys.length; nI++) {
                        self._aSFIDs[aKeys[nI]] = data[aKeys[nI]];
                    }
//                    self._aSFIDs[sObjName] = data;
                });
            },
            function(){
                if (typeof(fFunc) == 'function') {
                    for (var nJ = 0; nJ < aObjNames.length; nJ++) {
                        if (aObjNames[nJ].trim() != '' && self._aSFIDs[aObjNames[nJ]] != undefined) {
                            fFunc(self._aSFIDs[aObjNames[nJ]], aObjNames[nJ]);
                        }
                    }
                    
                }
            }
        ]);
    }
    
    self._loadFieldIdsREST = function(mObjName, aFields, fFunc) {
        var aObjNames = typeof(mObjName) == 'string' ? mObjName.split(',') : mObjName,
            sObjName = aObjNames[0];
//            bLoad = false;
//        for (var nI = 0; nI < mObjName.length; nI++) {
//            if (self._aSFIDs[mObjName[nI].trim()] == undefined) {
//                bLoad = true;
//                break;
//            }
//        }
        if (self._aSFIDs != null && self._aSFIDs[sObjName] != undefined) {
            return fFunc(self._aSFIDs[sObjName]);
        }
        var sSQL = 'SELECT DurableId,QualifiedApiName FROM FieldDefinition '
            + ' where EntityDefinition.QualifiedApiName=\'' + sObjName + '\''
            + ' and DurableId LIKE \'%.00N%\'';
        self._parent._addQueue([
            function(){
                self._restAPI({
                    url : '/services/data/v37.0/tooling/query/?q=' + encodeURIComponent(sSQL),
                    func : function(data) {
                        var sField, aTemp;
                        if (self._aSFIDs == null) {
                            self._aSFIDs = {};
                        }
                        if (self._aSFIDs[sObjName] == undefined ) {
                            self._aSFIDs[sObjName] = {};
                        }
                        for (var nJ = 0; nJ < data.records.length; nJ++) {
                            aTemp = data.records[nJ].DurableId.split('.');
                            if (aTemp.length > 1) {
                                sField = data.records[nJ].QualifiedApiName.toLowerCase();
                                self._aSFIDs[sObjName][sField] = aTemp[1];
                            }
                        }
                    }
                });
            },
            function(){
                if (typeof(fFunc) == 'function') {
                    console.log(self._aSFIDs);
                    fFunc(self._aSFIDs[sObjName]);
                }
            }
        ]);
    }
    
    self._fillCustomFieldsInfo = function(sObjName) {
        if (self._objectCache[sObjName] == undefined || self._aMetadata['CustomField'] == undefined) {
            return;
        }
        var aAllFields = self._aMetadata['CustomField'],
            aTemp;
        for (var nJ = 0; nJ < aAllFields.length; nJ++) {
            aTemp = aAllFields[nJ].fullName.toLowerCase().split('.');
            if (aTemp[0] != sObjName || self._objectCache[sObjName].fields[aTemp[1]] == undefined) {
                continue;
            }
            self._objectCache[sObjName].fields[aTemp[1]].id = aAllFields[nJ].id;
        }
    }
    
    self._getChildTableData = function(oChild, nRecnum, nId, sObj, fFunc){
        var aParams = jQuery.extend({"recnum" : nRecnum, "id" : nId}, oChild);
        self._parent._request({
            "jsRemote"  : true,
            data        : aParams,
            requestType : 'getChildTableData'
        }, function(data) {
            if (fFunc != undefined) {
                fFunc(data);
            }
        });
    }
    
    self._isTrue = function(sText) {
        return sText === true || sText === 'true';
    }
    self._checkProfile = function(sParam){
        return self._parent.profile != undefined
            && self._parent.profile[sParam] != undefined 
            && self._isTrue(self._parent.profile[sParam]);
    }

    self._init();
    
    
    
    
    this.getObject = function(sName, fFunc) {
        return self._getObject(sName, fFunc);
    }
    
    this.getObjects = function(aNames, fFunc, aParams) {
        return self._getObjects(aNames, fFunc, aParams);
    }
    
    this.getObjectStructure = function(sName, fFunc, aParams) {
        return self._getObjectStructure(sName, fFunc, aParams);
    }
    
    this.getFieldOptions = function(aParams, fFunc) {
        return self._getFieldOptions(aParams, fFunc);
    }
    
    this.getObjectFilterFields = function(sName, fFunc, aParams) {
        return self._getObjectFilterFields(sName, fFunc, aParams);
    }
    
    this.getLinkedObjectsFields = function(aField, aTypes, bSort, sObjectName) {
        return self._getLinkedObjectsFields(aField, aTypes, bSort, sObjectName);
    }
    
    this.getObjectFieldByName = function(sObject, sField) {
        return self._getObjectFieldByName(sObject, sField);
    }
    
    this.isObjectLoaded = function(sObjectName) {
        return (self._objectCache[sObjectName] != undefined) ? true : false;
    }
    
    this.addObject = function(oObjectData) {
        self._addObject(oObjectData);
    }
    
    this.loadReferenceObjects = function(sObject, fFunc) {
        self._loadReferenceObjects(sObject, fFunc);
    }
    
    this.initSimpleList = function(aList, bUpdate) {
        self._initSimpleList(aList, bUpdate);
    }
    
    this.initConnectLib = function() {
        return self._initConnectLib();
    }
    
    this.checkPolyField = function(sObj, sField) {
        return self._checkPolyField(sObj, sField);
    }
    
    this.getFieldSimpleTextValue = function(sType, mValue) {
        return self._getFieldSimpleTextValue(sType, mValue);
    }
    
    this.checkRecordType = function(sObj, sId, fFunc) {
        return self._checkRecordType(sObj, sId, fFunc);
    }
    
    this.getObjectLabel = function(sObjectname) {
        return self._getObjectLabel(sObjectname);
    }
    
    this.getObjectsList = function() {
        return Array.objectValues(self._objectSimple);
    }
    
    this.getObjectsFieldsIntesect = function(mObjects, mType, fFunc) {
        return self._getObjectsFieldsIntesect(mObjects, mType, fFunc);
    }
    
    this.loadSpecialSettings = function(sName, fFunc, aParams) {
        self._loadSpecialSettings(sName, fFunc, aParams);
    }
    
    this.saveSpecialSettings = function(sName, mData, aParams, fFunc) {
        self._saveSpecialSettings(sName, mData, aParams, fFunc);
    }
    
    this.getSpecialSettings =  function(sName, mDefault, aParams) {
        var mValue = self._aSpecialSettings[sName] != undefined ? self._aSpecialSettings[sName]  : null;
        if (mValue != null && aParams != undefined &&  aParams.parse === true && typeof(mValue) == 'string') {
            mValue = JSON.parse(mValue);
        }
        return mValue != null ? mValue : mDefault;
    }
    
    this.getMetadata = function(sName, fFunc, aParams) {
        self._getMetadata(sName, fFunc, aParams);
    }
    
    this.getListviewRecords = function(sObj, sFilterId, fFunc, sQ, sFields) {
        self._getListviewRecords(sObj, sFilterId, fFunc, sQ, sFields);
    }

    this.getListviewOptions = function(sObj, fFunc) {
        self._getListviewOptions(sObj, fFunc);
    }
    
    this.savePresets = function(aPresets){
        self._savePresets(aPresets);
    }
    
    this.getPresetRecords = function(aPresetFilters, fFunc) {
        self._getPresetRecords(aPresetFilters, fFunc);
    }
    
    this.getChildTableData = function(oChild, nRecnum, nId, sObj, fFunc){
        self._getChildTableData(oChild, nRecnum, nId, sObj, fFunc);
    }
    
    this.getObjectPrefix = function(sName) {
        return self._aObject2Key[sName] != undefined ? self._aObject2Key[sName] : "";
    }
    
    this.getObjectNameByPrefix = function(sPrefix) {
        return self._aKey2Object[sPrefix] != undefined ? self._aKey2Object[sPrefix] : "";
    }
    
    this.refreshSimple = function(aList) {
        self._refreshSimple(aList);
    }
    
    this.restAPI = function(aParams) {
        return self._restAPI(aParams);
    }
    
    this.isFeed = function(sObj) {
        return self._objectSimple[sObj] != undefined && self._objectSimple[sObj].feedEnabled;
    }
    
    this.clearCache = function(){
        self._aRESTCache = {};
        if (window.localStorage != undefined) {
            window.localStorage['aRESTCache'] = '{}';
        }
        self._objectCache = {};
    }
    
    this.SOAP = function(sName, aParams, fFunc) {
        if (typeof(window['sforce'].connection[sName]) == 'undefined' 
            || self._parent.options.session == undefined
            || self._parent.options.session == ''
            || self._parent.options.lighthning != null
        ) {
            return;
        }
        var aExec = {
            onSuccess : function(data){
//                self._parent._nAjaxLoading--;
                if (typeof(fFunc) == 'function') {
                    fFunc(data);
                }
                self._parent.waitQueue(-1);
            },
            onFailure : function() {
                self._parent.waitQueue(-1);
            }
        }
        aParams.push(aExec);
        if (window['sforce'].connection.sessionId == undefined) {
            window['sforce'].connection.sessionId = self._parent.options.session;
        }
        self._parent.waitQueue(1);
        window['sforce'].connection[sName].apply(window['sforce'].connection, aParams);
    }
    
    this.getParentEvent = function(sId, fFunc) {
        self._parent._request({
                "jsRemote"  : true,
                data        : {"id" : sId},
                requestType : 'getEventParent'
            }, function(data) {
                if (typeof(fFunc) == 'function'){
                    fFunc(data.parentid);
                }
            }
        );
    }
    
    this.presetSpecialSettings = function(sName, mValue) {
        self._aSpecialSettings[sName] = typeof(mValue) == 'string' ? JSON.parse(mValue) : mValue;
    }
    
//    this.filterGrouping = function(sObj, aFields) {
//        if (self._aGroupingFields == null || self._aGroupingFields[sObj] == undefined) {
//            return aFields;
//        }
//        
//        var aCheck = typeof(self._aGroupingFields[sObj]) == 'string' 
//            ? self._aGroupingFields[sObj].split(",") 
//            : self._aGroupingFields[sObj],
//            aResult = [];
//        for (var nI = 0; nI < aFields.length; nI++) {
//            if (aCheck.indexOf(aFields[nI].name) >= 0) {
//                aResult.push(aFields[nI]);
//            }
//        }
//        return aResult;
//    }
    
    
    this.getCommonFields = function(){
        return self._aCommonFields;
    }
    
    
    this.loadFieldIds = function(sObjName, aFields, fFunc){
        self._loadFieldIds(sObjName, aFields, fFunc);
    }
    
    this.checkProfile = function(sParam){
        return self._checkProfile(sParam);
    }
    
    this.invitees = function(sName, oData, fFunc){
        self._parent._request({
            "jsRemote"  : true,
            data        : jQuery.extend({"mode" : sName}, oData),
            requestType : "inviteesOperation"
        }, function(data) {
            if (typeof(fFunc) == 'function') {
                fFunc(data);
            }
        });
    }
    
    this.chatterAPI = function(aParams, fFunc) {
        if (false && self._parent._objects.checkProfile('api')) {
            aParams.func = fFunc;
            if (aParams.data != undefined && typeof(aParams.data) != 'string'
                && (aParams.post === true || aParams.HTTPType == 'PATCH')
            ) {
                aParams.data = JSON.stringify(aParams.data);
            }
            self._restAPI(aParams);
        } else {
            var aRequestData = aParams.data || {};
            if (aParams.apexData != undefined) {
                aRequestData = jQuery.extend(aRequestData, aParams.apexData);
            }
            aRequestData.mode = aParams.mode;
            self._parent._request({
                "jsRemote"  : true,
                data        : aRequestData,
                requestType : "chatter"
            }, function(data) {
                if (data.status != 'ok') {
                    console.log('error chatter');
                    return;
                }
                var aData = typeof(data.data) == 'string' ? JSON.parse(data.data) : {};
                if (typeof(fFunc) == 'function') {
                    fFunc(aData);
                }
            });
        }
    }
    
    this.formatCurrency = function(nVal) {
        if (self._parent.options.format['dot'] == '.' 
            && (self._parent.options.format['coma'] == undefined || self._parent.options.format['coma'] == '')
        ){
            return '' + nVal;
        }
        var aN = ('' + nVal).split('.'),
            aLeft = aN[0].split('').reverse();
        if (self._parent.options.format['coma'] != undefined && self._parent.options.format['coma'] != '') {
            for (var nJ = 3; nJ < aLeft.length; nJ += 4) {
                aLeft.splice(nJ, 0, self._parent.options.format['coma']); 
            };
            aN[0] = aLeft.reverse().join('');
        }
        
        return aN.join(self._parent.options.format['dot']);
        
    }
                                    

}
