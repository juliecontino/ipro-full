/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/addon/invite.css',
        _parent     : null,
        _div        : null,
        _dom        : {
            data    : null,
            settings : null
        },
        _params     : {},
        _comment    : {},
        _sKeyMode   : null,
        _nKeyStartPos : 0,
        _nKeyEndPos : 0,
        _aMentions  : [],
        _aTopics    : [],
        _aCurrentList : [],
        _bLoading   : false,
        _aAllow     : ['005', '003', '00Q', '023'],
        _bSharedActivities : false,
        _bActive    : true,
        _bSOAP      : false,
        _aEditPermissions : ['edit', true]
    };
    var addon = {};

    /** 
    * public init
    *
    * Init all necessary data
    */

    addon.init = function (parent){
        self._parent = parent;
        self._parent.loadCss(self._css);
        self._bActive = true;
        self._bSOAP = self._parent.options.session != undefined 
                    && self._parent.options.session != ''
                    && self._parent._objects.checkProfile('api');
    }
    
    /** 
    * @public show
    * draw grid
    * @return void;
    */
    
    
    addon.show = function(div, aParams) {
        self._params = aParams;
        self._div = div;
        
        if (self._dom.data == null || self._dom.data.html() == '' || self._dom.data.parents('.CA_popup').size() < 1) {
            self._parent._addQueue([
                self._buildHTML,
                self._initEvents,
                self._refresh
            ]);
        }
        
    }
    
    addon.showSettings = function(div, aParams) {
        
        self._div = div;
        self._params = aParams;
        if (self._dom.settings == null || self._dom.settings.html() == '') {
            self._buildSettingsHTML();
        }
    }
    
    addon.getSettings = function(){
        var aResult = {};
        if (self._dom.settings == null) {
            return null;
        }
        return aResult;
    }
    

    /** 
    * @public resize
    *
    * Clear offset cache when resize
    *
    */
    addon.resize = function(){
    }
    
    addon.refresh = function(){
        self._refresh();
    }
    
    addon.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
    }
    
    addon.clearView = function() {
        self._dom.data = null;
        self._dom.settings = null;
        
    }

    addon.beforeHide = function(sNewMode) {
    }

    /**
     * @private _buildRightAgendaGrid
     * Draw grid
     **/
    
    
    self._buildHTML = function() {
        
        var sHTML = "<div class='_inviteers'>"
                + "<select>"
                    + "<option value='user,contact,lead'>"
                        + self._parent.getText('addon_users_lead_contacts', 'Users, Leads, Contacts')
                    + "</option>"
                    + "<option value='user'>"
                        + self._parent.getText('addon_users', 'Users')
                    + "</option>"
                    + "<option value='lead'>"
                        + self._parent.getText('addon_leads', 'Leads')
                    + "</option>"
                    + "<option value='contact'>"
                        + self._parent.getText('addon_contact', 'Contacts')
                    + "</option>"
                    + "<option value='group'>Groups</option>"
                    + "<option value='userrole'>User Roles</option>"
                    + (self._parent._objects.checkProfile('accountteam') ? "<option value='account'>Account Teams</option>" : "")
                    + (self._parent._objects.checkProfile('chattergroup') ? "<option value='collaborationgroup'>Chatter Groups</option>" : "")
                + "</select>"
                + "<input placeholder='"
                    + self._parent.getText('addon_search_invitees', 'Search invitees')
                    + "'></input>"
                + '<div class="_l_label">' 
                    + self._parent.getText('addon_available', 'Available')
                + '</div>'
                + '<div class="_r_label">'
                    + self._parent.getText('addon_selected', 'Selected')
                + '</div>'
                + '<div class=_l_list></div>'
                + '<div class=_m_panel>'
//                    + "<span class='simple_button' data-action='accept'>Accept</span>"
//                    + "<span class='simple_button' data-action='decline'>Decline</span>"
                    + "<span class='simple_button' data-action='invite'>&gt;</span><br>"
                    + "<span class='simple_button' data-action='uninvite'>&lt;</span><br>"
                    + "<span class='simple_button simple_button2 _working' data-action='saveInvote' data-param='save'>" 
                        + self._parent.getText('addon_set', 'Set')
                    + "</span>"
//                    + "<span class='simple_button simple_button2 _working' data-action='saveInvote' data-param='save_email_all'>Set & Email All</span>"
                    + "<span class='simple_button simple_button2 _working' data-action='saveInvote' data-param='save_email_update'>Set & Email Changed</span>"                    
                + '</div>'
                + '<div class=_r_list></div>'
                + (!self._bActive
                    ? "<div class='_acceot_message _as_message'>" 
                        + self._parent.getText('addon_disabled_invitee', 'Invitee is not available for users with API disabled')
                        + '</div>'
                    : '<textarea class=_acceot_message maxlength="255"></textarea>'
                )
                + '</div>';
        
        self._div.append(jQuery(sHTML));
        self._dom.data = self._div.find('._posts');
        self._dom.form = self._div.find('._inviteers');
        if (self._params.detail != undefined 
            && self._params.detail.data != undefined
            && self._params.detail.data.ischild == true
        ) {
//            self._parent._addQueue(function(){
                self._parent._objects.getParentEvent(self._params.id, function(sId){
                    if (sId != null) {
                        self._params.id = sId;
                    }
                });
//            });
//            self._dom.form.addClass('_readonly');
//            self._dom.form.find('input').prop('disabled', true);
        }
//        } else 
        if (self._params.detail.data == undefined 
            || (self._params.detail.data.ownerid != self._parent.options.user 
                && 
                (self._params.detail.data.ca_permission == undefined 
                    || self._aEditPermissions.indexOf(self._params.detail.data.ca_permission) < 0
                )
            )
            || (self._params.detail.data.ischild === true)
        ) {
            self._dom.form.addClass('_readonly');
            self._dom.form.find('input, select').prop('disabled', true);
        } else if (self._params.detail.data.ownerid == self._parent.options.user  && !self._bActive) {
            self._dom.form.addClass('_readonly _acceptdecline');
        }
    }
    
    self._initEvents = function(){
        var nTimer,
            oInput = self._dom.form.find('input'),
            oSelect = self._dom.form.find('select'),
            sOldText = "";
        oInput.on('keyup change', function(evt){
            var sText = oInput.val();
            if (sOldText == sText) {
                return;
            }
//            console.log(sText, sOldText);
            if (nTimer != null) {
                clearTimeout(nTimer);
            }
            if (sText.length < 2) {
                return;
            }
            sOldText = sText;
            nTimer = setTimeout(function(){
                self._getInviter(sText, oSelect.val());
            }, 400);
        });
        oSelect.on('change', function(){
            oInput.val('');
            self._dom.form.find('._l_list').children().not('[data-relationid]').remove();
        });
        var aOld = null;
        self._dom.form.find('._r_list, ._l_list').on('click', 'a', function(evt){
            var oEl = jQuery(evt.target),
                bSel = oEl.hasClass('sel'),
                aMass;
            oEl.toggleClass('sel');
            if (aOld !=null && evt.shiftKey && !aOld.is(oEl)) {
                if (oEl.next(aOld).size() > 0) {
                    aMass = oEl.nextAll();
                } else {
                    aMass = oEl.prevAll();
                }
                aMass.each(function(){
                    var aTemp = jQuery(this);
                    if (aTemp.is(aOld)) {
                        return false;
                    }
                    aTemp.toggleClass('sel', !bSel);
                });
            }
            
            aOld = oEl;
            
        });
    }
    
    self._buildSettingsHTML = function() {
        var sHTML = '<div class="block_fields">'
                + '<div data-type="boolean" data-field="sflimit" class="field">'
                    + '<div class="name">'
                        + self._parent.getText('addon_no_special_settings', 'There is no special settings')
                    + '<span></span><br>'
                    + '</div>'
            + '</div>'
        ;
        self._dom.settings = jQuery(sHTML);
        self._div.append(self._dom.settings);
    }
    
    self._refresh = function(){
        var oChild = {
                "label" : 'EventRelations',
                "field" : 'eventid',
                "object" : "eventrelation",
                "fields" : "id,relationid,relationid.name,relationid.type,status,response,IsInvitee",
                /*'typeFields' : JSON.stringify({
                    'relationid' : {
                        'lead' : 'company,ownerid.name',
                        'user' : 'ownerid.name',
                        'contact' : 'ownerid.name'
                    }
                }),*/
                "hm" : 99,
                "url"   : "",
                "showurl" : "",
                "search" : " IsInvitee=true"
            };
        self._parent._addQueue(function(){
            self._parent._objects.getChildTableData(oChild, 0, self._params.id, '', function(data){
                var aList = typeof(data.data) == 'string' ? JSON.parse(data.data) : data.data,
                    aTemp = [],
                    sKey,

                    aFiltered = [];
                
                for (var nJ = 0; nJ < aList.length; nJ++) {
                    sKey = aList[nJ].relationid.substring(0, 3);
                    if (self._aAllow.indexOf(sKey) < 0) {
                        continue;
                    }
                    aFiltered.push(aList[nJ]);
                    aTemp.push(aList[nJ].relationid);
                }
                self._aCurrentList = aTemp;
                self._fillPanel('right', aFiltered, 'relationid.name', 'relationid');
                self._fillPanel('left', []);
            });
        }, function(){
            self._parent._models.getObjectStructure('eventrelation', function(aFields){
                if (aFields['isinvitee'] != undefined && aFields['isparent'] != undefined) {
                    self._bSharedActivities = true;
                }
            });
        });
    }
    
    self._uninviteAction = function(oEl, evt) {
        var aWhat = self._dom.form.find('._r_list a.sel'),
            aWhere = self._dom.form.find('._l_list');
        if (aWhat.size() > 0) {
            var aWhatGroupIds = [], sKey;
            aWhat.each(function(nIdx, aEl) {
                sKey = jQuery(aEl).data('id');
                if (self._keyIsGroup(sKey)) {
                    aWhatGroupIds.push(sKey);
                }
            });
            aWhat.appendTo(aWhere).removeClass('sel');
            self._dom.form.find('[data-action="saveInvote"]').removeClass('_working');
            var aWhatSub = self._dom.form.find("._r_list a[group-id='" + aWhatGroupIds.join("'],[group-id='") + "']");
            aWhatSub.appendTo(aWhere).removeClass('sel');
        }
    }
    
    self._inviteAction = function(oEl, evt) {
        var aWhat = self._dom.form.find('._l_list a.sel'),
            aWhere = self._dom.form.find('._r_list');
        if (aWhat.size() > 0) {
            var aWhatGroupIds = [], sKey;
            aWhat.each(function(nIdx, aEl) {
                sKey = jQuery(aEl).data('id');
                if (self._keyIsGroup(sKey)) {
                    aWhatGroupIds.push(sKey);
                }
            });
            aWhat.appendTo(aWhere).removeClass('sel');
            self._dom.form.find('[data-action="saveInvote"]').removeClass('_working');
            var aWhatSub = self._dom.form.find("._l_list a[group-id='" + aWhatGroupIds.join("'],[group-id='") + "']");
            aWhatSub.appendTo(aWhere).removeClass('sel');
        }
    }
    
    self._saveInvoteAction = function(oEl, evt){
        // sParam can equal: save, save_email_all, save_email_update
        var sParam = evt.currentTarget.attributes['data-param'].nodeValue,
            aNewRelationIds = [],
            aNewRecords = [],
            aDelete = [],
            aNotChanged = [],
            aWhat = self._dom.form.find('._r_list a'),
            aWhatDelete = self._dom.form.find('._l_list a[data-id][data-relationid]'),
            aWhatNotChanged = self._dom.form.find('._r_list a[data-id][data-relationid]'),
            oSetUserIds = {},
            sUserId,
            aUpdRecordsForCreate = [],
            aUpdRecordsForDelete = [];
    
        if (oEl.hasClass('_working')) {
            return;
        }
        self._parent._addQueue([
            function(){
                // loading not loaded group users
                var aWhat = self._dom.form.find('._r_list a[data-users-loaded="false"]'),
                    aEl, sGroupId;
                aWhat.each(function(nIdx, aElement) {
                    aEl = jQuery(aElement);
                    sGroupId = aEl.data('id');
                    var fCallbackFunc = function(data) {
                        for(var i=0; i < data.length; i++) { 
                            aEl.parent().append('<a data-id="' + data[i].id + '" title="User: ' + data[i].name + '" group-id="' + sGroupId + '">' + data[i].name + '</a>');
                        }
                    }
                    self._getUsersByGroupId( sGroupId, fCallbackFunc );
                });
            },
            function(){
                var aGroup = self._dom.form.find('._r_list a[data-users-loaded]');
                aGroup.remove();
                if (self._bSOAP) {
                    self._parent._objects.initConnectLib();
                }
            },
            function(){
                aWhat = self._dom.form.find('._r_list a');
                aWhat.each(function(){
                    var aEl = jQuery(this);
                    var oObject = self._bSOAP ? new window['sforce'].SObject('EventRelation') : {};
                    if (aEl.data('relationid') != undefined) {
                        return;
                    }
                    if (self._aCurrentList.indexOf(aEl.data('id')) >= 0) {
                        return;
                    }
                    sUserId = aEl.data('id');
                    if(sUserId in oSetUserIds) {
                        // nothing
                    } else {
                        oObject.RelationId = sUserId;
                        aNewRelationIds.push(oObject.RelationId);
                        oObject.EventId = self._params.id;
                        if (self._bSharedActivities) {
                            oObject.isParent = false;
                            oObject.isInvitee = false;
                        }
                        aNewRecords.push(oObject);
                        oSetUserIds[sUserId] = 1;
                    }
                });
                aWhatDelete.each(function(){
                    var aEl = jQuery(this);
                    if (aEl.data('id') == undefined || aEl.data('relationid') == undefined) {
                        return;
                    }
                    aDelete.push(aEl.data('id'));
                });
            },
            function(){
                
                // "creating" invitees
                var sFieldsForCreate = "RelationId,IsInvitee",
                    aFields = sFieldsForCreate.split(','),
                    fTransformQueryResult = function(aFields, oResult) {
                        var aLabel = oResult.label.split(',');
                        var oRetResult = {};
                        for(var i=0; i < aFields.length; i++) {
                            oRetResult[aFields[i]] = aLabel[i].trim();
                        }
                        oRetResult.id = oResult.id;
                        oRetResult.type = 'EventRelation';
                        return oRetResult;
                    },
                    fResFuncForCreate = function(aList) {
                        var oCurObj,
                            oMapRelationId2Obj = {},
                            aTmpRecords = [];
                        for(var i=0; i < aList.length; i++) {
                            oCurObj = fTransformQueryResult(aFields, aList[i]);
                            oMapRelationId2Obj[oCurObj.RelationId] = oCurObj;
                        }
                        for(var i=0; i < aNewRecords.length; i++) {
                            oCurObj = oMapRelationId2Obj[aNewRecords[i].RelationId]
                            if(oCurObj) {
                                for(k in oCurObj) {
                                    aNewRecords[i][k] = oCurObj[k];
                                }
                                aNewRecords[i].IsInvitee = 'true';
                                aNewRecords[i].Status = 'New';
                                delete aNewRecords[i]['RelationId'];
                                delete aNewRecords[i]['EventId'];
                                aUpdRecordsForCreate.push(aNewRecords[i]);
                            } else {
                                aTmpRecords.push(aNewRecords[i]);
                            }
                        }
                        aNewRecords = aTmpRecords;
                    };
                self._parent._objects.getListviewRecords("EventRelation", null, fResFuncForCreate, " EventId = '" + self._params.id + "' AND RelationId IN ('" + aNewRelationIds.join("','") + "')", sFieldsForCreate)
                
                
                // "deleting" invitees
                var sFieldsForDelete = "IsParent",
                    fResFuncForDelete = function(aList) {
                        var oCurObj,
                            oMapId2Obj = {},
                            aFields = sFieldsForDelete.split(','),
                            aTmpRecords = [];
                        for(var i=0; i < aList.length; i++) {
                            oCurObj = fTransformQueryResult(aFields, aList[i]);
                            oMapId2Obj[oCurObj.id] = oCurObj;
                        }
                        for(var i=0; i < aDelete.length; i++) {
                            oCurObj = oMapId2Obj[aDelete[i]];
                            if(oCurObj.IsParent == 'true') {
                                var oObject = self._bSOAP ? new window['sforce'].SObject('EventRelation') : {};
                                oObject.id = oCurObj.id;
                                oObject.IsInvitee = 'false';
                                oObject.Status = '';
                                aUpdRecordsForDelete.push(oObject);
                            } else {
                                aTmpRecords.push(oCurObj.id);
                            }
                        }
                        aDelete = aTmpRecords;
                    };
                self._parent._objects.getListviewRecords("EventRelation", null, fResFuncForDelete, "Id IN ('" + aDelete.join("','") + "')", sFieldsForDelete)
            },
            function(){
                aWhatNotChanged.each(function() {
                    var aEl = jQuery(this);
                    if (aEl.data('id') == undefined || aEl.data('relationid') == undefined) {
                        return;
                    }
                    aNotChanged.push(aEl.data('id'));
                });
                var bRefresh = false,
                    aOldEmailHeader = self._bSOAP ? window['sforce'].connection.emailHeader : null,
                    fResultFunc = function(){
                        if (!bRefresh) {
                            self._parent._addQueue(function(){
                                self._parent._events.emptyEvent({
                                    min : Date.baseDate(self._params.event.dayStart, -1), 
                                    max : Date.baseDate(self._params.event.dayEnd, 1)
                                });
                                self._parent.layout.clearPeriod(self._params.event.calendarid, self._params.event.dateStart, self._params.event.dateEnd, true);
                                self._refresh();
                                self._parent.layout.refreshEvents();
                            });
                            if (self._bSOAP) {
                                window['sforce'].connection.emailHeader = aOldEmailHeader;
                            }
                            bRefresh = true;
                            self._dom.form.find('[data-action="saveInvote"]').addClass('_working');
                        }             
                    };
                if (self._bSOAP) {
                    if (sParam == 'save_email_all' || sParam == 'save_email_update') {
                        window['sforce'].connection.emailHeader = {triggerOtherEmail : true, triggerUserEmail : true}
                    }
                    if (aNewRecords.length > 0) {
                        self._parent._objects.SOAP('create', [aNewRecords], fResultFunc);
                    }
                    if (aDelete.length > 0) {
                        self._parent._objects.SOAP('deleteIds', [aDelete], fResultFunc);
                    }
                    if (sParam == 'save_email_all' && aNotChanged.length > 0) {
                        self._parent._objects.SOAP('update', [aNotChanged], fResultFunc);
                    }
                    if(aUpdRecordsForCreate.length > 0) {
                        self._parent._objects.SOAP('update', [aUpdRecordsForCreate], fResultFunc);
                    }
                    if(aUpdRecordsForDelete.length > 0) {
                        self._parent._objects.SOAP('update', [aUpdRecordsForDelete], fResultFunc);
                    }
                } else {
                    if (aNewRecords.length > 0) {
                        self._parent._objects.invitees('create', {data : aNewRecords}, fResultFunc);
                    }
                    if (aDelete.length > 0) {
                        self._parent._objects.invitees('deleteIds', {data : aDelete}, fResultFunc);
                    }
                    if (sParam == 'save_email_all' && aNotChanged.length > 0) {
                        self._parent._objects.invitees('update', {data : aNotChanged}, fResultFunc);
                    }
                    if(aUpdRecordsForCreate.length > 0) {
                        self._parent._objects.invitees('update', {data : aUpdRecordsForCreate}, fResultFunc);
                    }
                    if(aUpdRecordsForDelete.length > 0) {
                        self._parent._objects.invitees('update', {data : aUpdRecordsForDelete}, fResultFunc);
                    }
                }
                self._dom.form.find('input').val('');
            }
        ]);
        
        
    }
    
    self._finishAccept = function(sStatus) {
        self._dom.form.removeClass('_acceptdecline');
        self._parent._dom.popup
            .find('.buttons')
            .children('[data-action]').not('[data-action="edit"]')
            .show()
                .filter('[data-action="accept"], [data-action="decline"]')
                .remove();
        self._parent._events.emptyEvent({
            min : Date.baseDate(self._params.event.dayStart, -1), 
            max : Date.baseDate(self._params.event.dayEnd, 1)
        });
        self._parent.layout.clearPeriod(self._params.event.calendarid, self._params.event.dateStart, self._params.event.dateEnd, true);
        self._parent.layout.refreshEvents();
        if (sStatus == 'Declined') {
            self._parent.hidePopup();
        }
    }
    
    self._acceptAction = function(oEl, evt, sStatus){
        sStatus = sStatus || 'Accepted';
        var nId = self._dom.form.find('._r_list a[data-relationid="' + self._parent.options.user + '"]').data('id');
        self._parent._addQueue([
            function(){
                if (self._bSOAP) {
                    self._parent._objects.initConnectLib();
                }
            },
            function(){
                var oObject = self._bSOAP ? new window['sforce'].SObject('EventRelation') : {};
                oObject.Id = nId;
                oObject.Status = sStatus;
                oObject.Response = self._dom.form.find('textarea').val();
                var aObjects = [oObject];
                if (self._bSOAP) {
                    self._parent._objects.SOAP('update', [aObjects], function(){
                        self._finishAccept(sStatus);
                    });
                } else {
                    self._parent._objects.invitees('update', {data : aObjects}, function(){
                        self._finishAccept(sStatus);
                    });
                }
            }
        ]);
    }
    
    self._declineAction = function(oEl, evt){
        self._acceptAction(oEl, evt, 'Declined');
    }
    
    self._getInviter = function(sText, sType) {
        if (self._bLoading) {
            return;
        }
        if(['user','contact','lead','user,contact,lead'].indexOf(sType) > -1) {
            self._bLoading = true;
            self._parent._objects.getFieldOptions({
                fobj : 'eventRelation',
                fid  : 'relationid',
                text : sText,
                page : 0,
                obj  : sType || "user,contact,lead",
                hm   : 99,
                fields : 'ownerid.name,company'
            },
            function(aList, aPagesOption){
                self._bLoading = false;
                if (aList == undefined) {
                    aList = [];
                }
                self._fillPanel('left', aList);
            }
            );
        } else if(['group','userrole','account','collaborationgroup'].indexOf(sType) > -1) {
            var resFunc = function(aList) {
                self._bLoading = false;
                if (aList == undefined) {
                    aList = [];
                }
                self._fillPanel('left', aList);
            }
            self._parent._objects.getListviewRecords(sType, null, resFunc, " Name LIKE '%" + sText + "%' ")
        }
    }
    
    self._getKeyFromSfId = function(sSfId) {
        var sKey = typeof(sSfId) == 'string' ? sSfId.substring(0, 3) : '' + parseInt(sSfId);
        return sKey;
    }
    
    self._keyIsGroup = function(sKey) {
        if (['00G','00E','001','0F9'].indexOf(sKey.substring(0,3)) > -1) {
            return true;
        }
        return false;
    }
    
    self._getUsersByGroupId = function(sGroupId, fCallbackFunc) {
        var sKey = self._getKeyFromSfId(sGroupId);
        var oKeyToObjName = {'00G':'Group','00E':'UserRole','001':'Account','0F9':'CollaborationGroup'};
        var sObjName = oKeyToObjName[sKey];
        
        if (sObjName == 'Group') {
            var fGetUserInfo = function(data) {
                var aUserIds = [];
                for(var i=0; i < data.length; i++) { 
                    aUserIds.push(data[i].label); 
                }
                var sWhere = " Id IN ('" + aUserIds.join("','") + "') ";
                self._parent._objects.getListviewRecords('User', null, fCallbackFunc, sWhere, "");
            }
            self._parent._objects.getListviewRecords('GroupMember', null, fGetUserInfo, " GroupId='" + sGroupId + "' ", "UserOrGroupId");
        } else if (sObjName == 'UserRole') {
            self._parent._objects.getListviewRecords('User', null, fCallbackFunc, " UserRoleId='" + sGroupId + "' ", "")
        } else if (sObjName == 'Account') {
            var fCallbackFunction = function(data) {
                var aElem = [];
                var aFields;
                for(var i=0; i < data.length; i++) { 
                    aFields = data[i].label.split(',');
                    aElem.push({
                        id: aFields[0].trim(),
                        name: aFields[1].trim()
                    });
                }
                fCallbackFunc(aElem);
            }
            self._parent._objects.getListviewRecords('AccountTeamMember', null, fCallbackFunction, " AccountId='" + sGroupId + "' ", "UserId,User.name")
        } else if (sObjName == 'CollaborationGroup') {
            var fCallbackFunction = function(data) {
                var aElem = [];
                var aFields;
                for(var i=0; i < data.length; i++) { 
                    aFields = data[i].label.split(',');
                    aElem.push({
                        id: aFields[0].trim(),
                        name: aFields[1].trim()
                    });
                }
                fCallbackFunc(aElem);
            }
            self._parent._objects.getListviewRecords('CollaborationGroupMember', null, fCallbackFunction, " CollaborationGroupId='" + sGroupId + "' ", "MemberId,Member.name")
        }
    }
    
    self._loadGroupUsers = function(aEl_A) {
        var sAttr = aEl_A.data('users-loaded');
        if (typeof sAttr !== typeof undefined && sAttr == 'true') {
            return;
        }

        var oParentPanel = aEl_A.parent();
        var sGroupId = aEl_A.data('id');
        self._getUsersByGroupId(sGroupId, function(data) {
            for(var i=0; i < data.length; i++) { 
                oParentPanel.append('<a data-id="' + data[i].id + '" title="User: ' + data[i].name + '" group-id="' + sGroupId + '">' + data[i].name + '</a>');
            }
            aEl_A.data('users-loaded', 'true');
            aEl_A.find('b[group="group"]').text('-');
        });
    }    
    
    self._fillPanel = function(sType, aList, sNameField, sAddField){
        var oKeyToObjName = {'00G':'Group','00E':'UserRole','001':'Account','0F9':'CollaborationGroup'};
        
        sNameField = sNameField || 'name';
        var oList = self._dom.form.find('._' + (sType == 'left' ? 'l' : 'r') + '_list'),
            sHTML = '',
            bAccept = false,
            sTitle = '',
            aStatuses = {'New' : 'N', 'Declined' : 'D', 'Accepted' : 'A'},
            aTitleTypes = {'00Q' : 'Lead', '005' : 'User', '003' : 'Contact', '00G' : 'Group', '00E' : 'Role', '001' : 'Account', '0F9' : 'ChatterGroup'},
            aTitleFieldLabels = self._parent.getText('addon_title_roles_labels');
            
        for (var nI = 0; nI < aList.length; nI++) {
            if (sAddField == undefined && self._aCurrentList.indexOf(aList[nI]['id']) >= 0) {
                continue;
            }
            if (sAddField != undefined 
                && aList[nI][sAddField] == self._parent.options.user 
                && aList[nI].status == 'New'
            ) {
                bAccept = true;
            }
            var aTitleFields = aList[nI].columns != undefined && aList[nI].columns != ''
                ? aList[nI].columns.split('::')
                : [];
            var sKey = self._getKeyFromSfId(aList[nI]['id']);
            if (sType  == 'left') {
                //sKey = typeof(aList[nI]['id']) == 'string' ? aList[nI]['id'].substring(0, 3) : '' + parseInt(aList[nI]['id']);
                sTitle = (aTitleTypes[sKey] != undefined ? aTitleTypes[sKey] + ': ' : '') 
                    + aList[nI][sNameField];
                if (aTitleFields.length) {
                    for (var nT = 0; nT < aTitleFields.length; nT++) {
                        if (aTitleFields[nT] != '') {
                            sTitle += "\n" + aTitleFieldLabels[nT] + aTitleFields[nT];
                        }
                    }
                }
            } else {
                sTitle = aList[nI]['relationid.type'] + ': ' + aList[nI][sNameField]
                    + (aList[nI]['response'] != undefined && aList[nI]['response'] != '' 
                        ? "\n" + aList[nI]['response'] 
                        : ''
                    );
                
            }
            var bFlagGroup = false;
            if (sKey in oKeyToObjName) {
                bFlagGroup = true;
            }
            sHTML += '<a data-id="' + aList[nI]['id'] + '" '
                    + (sAddField != undefined ? 'data-' + sAddField + '="' + aList[nI][sAddField] + '"' : "")
                    + ' title="' + sTitle.htmlspecialchars() + '"'
                    + (bFlagGroup ? ' data-users-loaded="false" ' : '')
                    + '>' 
                    + (aStatuses[aList[nI].status] != undefined 
                        ? '<b class="_status_' + aStatuses[aList[nI].status] + '">' + aStatuses[aList[nI].status] + '</b>'
                        : ''
                    )
                    + (bFlagGroup ? '<b data-group="group">+</b>' : '')
                    + aList[nI][sNameField].htmlspecialchars() 
                    + '</a>';
        }
        oList.html(sHTML);
        
        oList.find('b[data-group="group"]').on('click', function() {
            var aEl_A = jQuery(this).parent();
            self._loadGroupUsers( aEl_A )
        });
        
        if (bAccept && self._params.detail.data.ownerid == self._parent.options.user) {
            self._dom.form.addClass('_acceptdecline');
            if (self._bActive && self._parent._dom.popup.find('.buttons span[data-action="accept"]').size() < 1) {
                var sAddHTML = "<span class='simple_button' data-action='accept' data-addon='invite'>"
                        + self._parent.getText('addon_accept', "Accept")
                    + "</span>"
                    + "<span class='simple_button' data-action='decline' data-addon='invite'>"
                        + self._parent.getText('addon_decline', "Decline")
                    + "</span>";
                self._parent._dom.popup.find('.buttons')
                    .children('[data-action]')
                    .hide();
                self._parent._dom.popup.find('.buttons').prepend(sAddHTML);

            }
        }
    }
    
    jQuery.calendarAnything.appendAddon('invite', addon);
})();