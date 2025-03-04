/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/addon/attach.css',
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
        _bLoading   : false
        
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
            self._buildHTML();
            self._initEvents();
            self._parent.checkPopupVisiblility();
            self._refresh();
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
        
        var sHTML = "<div class='_attach'>"
                + "<input type=file placeholder='" 
                + self._parent.getText('addon_insert_file', 'Insert file here')
                + "'/>"
                + "<span class='simple_button' data-action='add'>"
                + self._parent.getText('addon_upload', 'Upload')
                + "</span>"
                + '<div class=_list></div>'
                + '</div>';
        
        self._div.append(jQuery(sHTML));
        self._dom.data = self._div.find('._posts');
        self._dom.form = self._div.find('._attach');
        
        if (self._params.detail != undefined 
            && self._params.detail.data != undefined
            && (self._params.detail.data.ischild == true || 
                (!self._parent.options.SA && self._params.detail.data.ownerid != self._parent.options.user) 
            )
        ) {
            if (self._params.detail.data.ischild == true) {
                self._parent._addQueue(function(){
                    self._parent._objects.getParentEvent(self._params.id, function(sId){
                        if (sId != null) {
                            self._params.id = sId;
                        }
                    });
                });
            }
            self._dom.form.addClass('_readonly');
            self._dom.form.find('input').prop('disabled', true);
        }
    }
    
    self._initEvents = function(){
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
                "label" : "Attachments",
                "field" : 'parentid',
                "object" : "attachment",
                "fields" : "id,name,bodylength",
                "hm" : 99,
                "url"   : "",
                "showurl" : ""
            };
        self._parent._addQueue(function(){
            
        
            self._parent._objects.getChildTableData(oChild, 0, self._params.id, '', function(data){
                var aList = typeof(data.data) == 'string' ? JSON.parse(data.data) : data.data,
                    oList = self._dom.form.find('._list'),
                    sHTML = '';
                for (var nI = 0; nI < aList.length; nI++) {
                    sHTML += '<div data-id="' + aList[nI]['id'] + '">'
                            + '<a data-action="show_ref_field" '
                                + 'title="' + aList[nI]['name'].htmlspecialchars() + '" '
                                + 'data-id="' + aList[nI]['id'] + '" '
                                + 'href="/servlet/servlet.FileDownload?file=' + aList[nI]['id'] + '"'
                            + '>' + aList[nI]['name'] + '</a>'
                            + '<span>' + self._sizeKB(aList[nI]['bodylength']) + '</span>'
                            + '<a data-action="delFile" class="small_button">'
                            + self._parent.getText('addon_del', 'del')
                            + '</a>'
                            + '</div>'
                    ;
                }
                oList.html(sHTML);
            });
        });
    }
    
    self._addAction = function(oEl, evt) {
        var oFile = self._dom.form.find('input'),
            aFile = oFile[0].files;
        if (aFile.length < 1) {
            return;
        }
        var oReader = new FileReader(),
            aData = {
                'ParentId' : self._params.id,
                'Name' : aFile[0].name,
                'ContentType' : aFile[0].type
            },
            bIEBuffer = oReader.readAsArrayBuffer !== undefined && oReader.readAsBinaryString == undefined;
        if (self._params.object == 'event' || self._params.object == 'task') {
            if (self._params.detail != null && self._params.detail.data.ownerid != undefined) {
                aData.OwnerId = self._params.detail.data.ownerid;
            }
        }
        oReader.onload = function(oEvt) {
            if (bIEBuffer) {
                var sBinary = "",
                    aBytes = new Uint8Array(oEvt.target.result),
                    nLength = aBytes.byteLength;
                for (var i = 0; i < nLength; i++) {
                    sBinary += String.fromCharCode(aBytes[i]);
                }

//                aData.Body = (new sforce.Base64Binary(sBinary)).toString();
                aData.Body = window.btoa(sBinary);
            } else {
                var nLength = oEvt.target.result.length;
                aData.Body = window.btoa(oEvt.target.result);
            }
            
            if (self._parent._objects.checkProfile('api') && nLength > 25000000) {
                //alert(self._parent.getText('addon_file_too_large', 'File size is too large. Maximum file size is 25Mb'));
                self._parent.showNotify(self._parent.getText('addon_file_too_large', 'File size is too large. Maximum file size is 25Mb'), 'alert');
                return;
            }
            
            
            if (self._parent.options.session == undefined 
                || self._parent.options.session == ''
                || !self._parent._objects.checkProfile('api')
            ) {
                if (nLength > 700000) {
                    //alert(self._parent.getText('addon_file_too_large_700', 'File size is too large. Maximum file size is 700Kb'));
                    self._parent.showNotify(self._parent.getText('addon_file_too_large_700', 'File size is too large. Maximum file size is 700Kb'), 'alert');
                    return;
                }
                self._div.children().addClass('CA_ajax_loading');
                self._parent._request({
                        'jsRemote'  : true,
                        'post'      : true,
                        "serverPath" : "event",
                        'data'      : aData,
                        'requestType' : 'saveAttachment',
                        'error' : function(){
                            self._div.children().removeClass('CA_ajax_loading');
                        }
                    }, function(oXHR, sStatus) {
                        oFile.val('');
                        console.log(sStatus);
                        self._div.children().removeClass('CA_ajax_loading');
                        self._refresh();
                    }
                );
            } else {
                self._div.children().addClass('CA_ajax_loading');
                self._parent._objects.restAPI({
                    "url" : "/services/data/v37.0/sobjects/Attachment",
                    "data" : JSON.stringify(aData),
                    "post" : true,
                    "func" : function(aResult) {
                        oFile.val('');
                        self._div.children().removeClass('CA_ajax_loading');
                        self._refresh();
                    },
                    error : function(oXHR, sStatus) {
                        self._div.children().removeClass('CA_ajax_loading');
                        if (oXHR.responseText != undefined) {
                            var aResult = typeof(oXHR.responseText) == 'string' 
                                ? JSON.parse(oXHR.responseText)
                                : oXHR.responseText;
                            if (aResult.length > 0 && aResult[0] != undefined) {
                                aResult = aResult[0];
                            }
                            if (aResult.message != undefined) { 
                                self._parent.showNotify(
                                    self._parent.getText('addon_uploading_eror', 'Attachment uploading error')
                                    + ': ' + aResult.message , true);
                            }
                        }
                        oFile.val('');
                    }
                })
            }
        }
        if (bIEBuffer) {
            oReader.readAsArrayBuffer(aFile[0]);
        } else {
            oReader.readAsBinaryString(aFile[0]);
        }
    }
    
    self._delFileAction = function(oEl, evt) {
        var sId = oEl.parent('div').data('id');
        if (self._parent.options.session == undefined 
            || self._parent.options.session == ''
            || !self._parent._objects.checkProfile('api')
        ) {
            self._parent._request({
                    'jsRemote'  : true,
                    "serverPath" : "event",
                    'data'      : {arrachmentId : sId},
                    'requestType' : 'delAttachment'
                }, function(oXHR, sStatus) {
                    oEl.parent('div').remove();
                }
            );
        } else {
            self._parent._objects.restAPI({
                "url" : "/services/data/v37.0/sobjects/Attachment/" + sId,
                "HTTPType" : "DELETE",
                "data" : {} ,
                "func" : function() {
                    oEl.parent('div').remove();
                }
            });
        }
        
    }
    
    
    self._sizeKB = function(nSize){
        var sResult = '';
        if (nSize > 10000000) {
            sResult = (Math.round(nSize / 104857.6) / 10) + ' Mb';
        } else if (nSize > 1000000) {
            sResult = (Math.round(nSize / 10485.76) / 100) + ' Mb';
        } else if (nSize > 10000) {
            sResult = (Math.round(nSize / 102.4) / 10) + ' Kb';
        } else {
            sResult = (nSize) + ' bytes';
        } 
        return sResult;
    }
    
    jQuery.calendarAnything.appendAddon('attach', addon);
})();