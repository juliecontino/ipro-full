/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


(function(){
    var self = {
        _css        : '/css/ical.css',
        _parent     : null,
        _div        : null,
        _calendarId : null,
        _event      : null,
        _sClientId  : '',
        _sClientCert : ''
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._div = parent._dom.popup;;
        self._parent = parent;
        self._parent.loadCss(self._css);
    }
    
    view.show = function(params) {
        self._calendarId = params.cid;
        self._event = params.event;
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            self['_' + sAction + 'Action'](el, evt);
        }
        return self._parent._cancelBubble(evt);
    }
    
    self._show = function(params) {
        self._parent._addQueue([
            function() {
                self._parent._request(
                    {
                        "jsRemote"      : true,
                        "data"          : {cid : self._calendarId},
                        "requestType"   : self._parent._getRequestEvent('ical'),
                        "serverPath" : "event"
                    }, function(data) {
                        if (data.result != undefined) {
                            self._params = data.result;
                        }
                    }
                );
            },
            function(){
                self._parent._objects.loadSpecialSettings('clientKey', function(data){
                    self._sClientId = data.value;
                }, {data : {secure : true}});
                self._parent._objects.loadSpecialSettings('clientCert', function(data){
                    self._sClientCert = data.value;
                }, {data : {secure : true}});
            }, 
            function() {
                var sHTML = self._buildHTML(params);
                self._parent.showPopup({
                    html : sHTML,
                    event : self._event,
                    view : view,
                    noLeave : true
                });
            }
        ])
    }
    
    self._buildHTML = function(params) {
        var sHTML = 
            '<div class=ca_ical>'
            + '<div class="title">'
            + self._parent.getText('message_publich_ical', 'Publish Calendar as Read Only iCalendar')
            + '</div>' 
        if (typeof(self._params.sites) == 'string') {
            self._params.sites = jQuery.parseJSON(self._params.sites);
        }
        if (self._params.sites != undefined && self._params.sites.length > 0) {
            sHTML +=  '<div class="blocks">'
                    + '<span class="title">'
                        + self._parent.getText('message_privilegies_ical_title', 'Calendar Data will be displayed with access privileges for Current User')
                        + ':</span>'
                    + '<span class="_blue">' + self._params.user + '</span>'
                + '</div>'
                + (!self._parent.getParam('displayNewICAL') 
                    ? '<div class=blocks>'
                        + '<span class="title">'
                            + self._parent.getText('ical_enter_password_user', 'Enter Password for Current User')
                            + ':'
                            + '<br/><span class="_grey">'
                            + self._parent.getText('ical_converted_password', 'Password will be converted to an encrypted token and stored in your Salesforce.org')
                            + '</span>'
                        + '</span>'
                        + '<span><input type="password" name="pwd" placeholder="'
                        + self._parent.getText('ical_enter_password', 'Enter password')
                        + '"></span>'
                    + ' </div>' 
                    : ''
//                            '<div class=blocks>'
//                        + '<span class="title">Use oAuth</span>'
//                        + '<span>'
//                        //+ (self._params.refresh_token == '' ? '<a data-action="getToken">Get new token</a>' : "Token check OK")
//                        + '</span>'
//                    + ' </div>' 
                )
                + '<div class=blocks>'
                    + '<span class="title">'
                    + self._parent.getText('ical_select_site', 'Select Force.com site to use')
                    + ':</span>'
                    + '<span>';
//            if (!self._parent.getParam('displayNewICAL'))  {
                sHTML += '<select name="site">';
                for (var nI = 0; nI < self._params.sites.length; nI++) {
                    sHTML += '<option value="' + self._params.sites[nI]['domain'] + '" '
                        + ' data-id="' + self._params.sites[nI]['id'] + '" '
                        + ' data-full="' + self._params.sites[nI]['full_url'] + '" '
                        + ' data-prefix="' + self._params.sites[nI]['prefix'] + '" '
                        + (self._params.site_id != undefined && self._params.site_id == self._params.sites[nI]['id'] ? " selected " : "")
                        + '>' 
                        + self._params.sites[nI]['name'];
                }
                sHTML += '</select>';
//            } else {
//                var oSite = self._params.sites[0];
//                sHTML += '<input name="site" '
//                    + ' data-id="' + oSite['id'] + '" '
//                    + ' value="' + oSite['domain'] + '"'
//                    + ' data-prefix="' + oSite['prefix'] + '"/>'
//                    + oSite['name'];
//            }
            sHTML += '</span>'
                + ' </div>' 
                + '<div class=blocks>'
                    + ''
                + ' </div>' 
                + ' <div data-box="token" class="' 
                    + (self._params.url == undefined || self._params.url == '' || true ? 'hidden'  : '' ) 
                + '">'
                    + '<span class="title">'
                    + self._parent.getText('ical_subscription_url', 'Calendar Subscription URL')
                    + ':</span><br>'
                    + '<span><input type="text" data-element="url" value="'
                        + (self._params.url == undefined || self._params.url == ''  
                            ? ''  
                            : (self._params.url == 'PWD' || true
                                ? self._parent.getText('ical_subscription_url_available', 'Subscription URL available only on generating. Generate new Link please to get it.')
                                : self._params.url)
                        )
                    + '"></span>'
                    + ' <div>'
                        + '<span class="simple_button" data-action="remove">'
                        + self._parent.getText('ical_disable_link', 'Disable Current Link')
                        + '</span>'
                        + '<span class="simple_button" data-action="copy">'
                        + self._parent.getText('ical_copy_link', 'Copy Link')
                        + '</span>'
                    + '</div>'
                + '</div>'
                + ' <div class="buttons">'
                    + (self._parent.getParam('displayNewICAL') 
                        ? '<span class="simple_button ' 
                                + (self._sClientId == '' || self._sClientId == null || self._params.sites.length < 1
                                    ?  '_working'
                                    : ''
                                )
                                + '" data-action="useOAuth"'
                                + (self._sClientId == '' || self._sClientId == null || self._params.sites.length < 1
                                    ? ' title="You must have at least one Site and populated Consumer Key and Consumer Secret in Display Settings->ical to Publish iCalendars"'
                                    : ''
                                )
                                + '>Get oAuth Token</span>'
                        : '<span class="simple_button" data-action="generate">'
                            + self._parent.getText('ical_generate_link', 'Generate New Subscription Link')
                        + '</span>'
                    )
                    + '<span class="simple_button disable"  data-action="load">'
                        + self._parent.getText('ical_download_file', 'Download as file')
                    + '</span>'
                    + '<span class="simple_button close">'
                        + self._parent.getText('close', 'Close')
                    + '</span>'
                + ' </div>'             
        } else {
            sHTML += '<div class=blocks>'
                    + '<span>'
                    + self._parent.getText('ical_no_sites', 'There are no active Sites on this org')
                    + '</span>'
                    + '<span class="simple_button" data-action="load">'
                    + self._parent.getText('ical_download_file', 'Download as file')
                    + '</span>'
                + ' </div>' 
        }
        sHTML += '</div>';
        return sHTML;
    }
    
    
    self._generateAction = function(el, evt)  {
        var aFields = self._div.find('input, select'),
            oPassw = self._div.find('input[type="password"]');
        aFields.removeClass('_error');
        
        if (jQuery.trim(oPassw.val()) =='') {
            oPassw.addClass('_error').focus();
            return false;
        }

        self._parent._request(
            {
                "jsRemote"      : true,    
                "data"          : {
                    "cid"           : self._calendarId, 
                    "pwd"           : oPassw.val(),
                    "domain"        : aFields.filter('select').val(),
                    "site_id"       : aFields.filter('select').children(':selected').data('id'),
                    "site_prefix"   : aFields.filter('select').children(':selected').data('prefix')
                },
                "requestType"   : self._parent._getRequestEvent('ical'),
                "serverPath" : "event",
                "post" : "true"
            }, function(data) {
                if (data.result != undefined && data.result.url != undefined) {
                    oPassw.val('');
                    self._div.find('[data-box="token"]').removeClass('hidden');
                    self._div.find('[data-element="url"]').val(data.result.url);
                }
                self._parent.checkPopupVisiblility();
            }
        );
    }
    
    self._removeAction = function(el, evt)  {
        self._parent._request(
            {
                "jsRemote"  : true,
                "data"          : {
                    "cid"       : self._calendarId, 
                    "remove"    : true
                },
                "requestType"   : self._parent._getRequestEvent('ical'),
                "serverPath" : "event"
            }, function(data) {
                if (data.result != undefined) {
                    self._div.find('[data-box="token"]').addClass('hidden');
                    self._div.find('[data-element="url"]').val('');
                }
                self._parent.checkPopupVisiblility();
            }
        );
    }
    
    self._copyAction = function(el, evt) {
        var oText = self._div.find('[data-element="url"]');
        if (!self._parent.isMobile()) {
            window.prompt ("Copy to clipboard: Ctrl+C, Enter", oText.val());
            return;
        } else {
            oText.focus();
            oText.select();
        }
    }
    
    self._loadAction = function(el, evt) {
        document.location.href = self._parent.options.serverUrl['default']
            .replace('CA_AjaxResponces', 'ical') + '?cid=' + self._calendarId + '&event=saveFile';
        self._parent.hidePopup();
    }
        
        
    self._useOAuthAction = function(el, evt) {
        var aFields = self._div.find('input, select');
        if (jQuery(evt.target).hasClass('_working')) {
            return;
        }
        if (self._sClientCert != '') {
            self._parent._request(
                {
                    "jsRemote"      : true,    
                    "data"          : {
                        "cid"           : self._calendarId, 
                        "jwt"           : '1',
                        'user'          : self._parent.options.user,
                        "domain"        : aFields.filter('select').val(),
                        "site_id"       : aFields.filter('select').children(':selected').data('id'),
                        "site_prefix"   : aFields.filter('select').children(':selected').data('prefix')
                    },
                    "requestType"   : self._parent._getRequestEvent('ical'),
                    "serverPath" : "event",
                    "post" : "true"
                }, function(data) {
                    if (data.result != undefined && data.result.url != undefined) {
                        self._div.find('[data-box="token"]').removeClass('hidden');
                        self._div.find('[data-element="url"]').val(data.result.url);
                    }
                    self._parent.checkPopupVisiblility();
                }
            );
        } else {
            self._parent._addQueue([
                function(){
                    var sSiteId = self._div.find('select[name="site"] option:selected').data('id'),
                        sSiteFull = self._div.find('select[name="site"] option:selected').data('full'),
                        sSiteUrl = sSiteFull
                            + (self._params.icalNS != '' ? self._params.icalNS + '__' : '')
                            + 'CA_ical?event=token';

                    var oPopupWin = window.open('//' + (self._params.sandbox === true ? 'test' : 'login') + '.salesforce.com/'
                            + 'services/oauth2/authorize?response_type=code'
                            + '&client_id=' + self._sClientId
                            + '&display=popup'
                            + '&state=site_' + sSiteId + '_' + self._calendarId + '_' + self._parent.options.user
                                + (self._parent.options.debug ? '_debug' : '')
                            + '&redirect_uri=' + sSiteUrl

                            ,
    //                        + '&redirect_uri=/apex/ical?event=token',
                        'tokenWin', 
                        'width=400,height=200'
                    );

                    window.addEventListener("message", self._presentUrl, false)
                }
            ]);
        }
        //5950831163494526374
    }
    
    self._presentUrl = function(evt) {
        if (evt.data == undefined || evt.data == '') {
            return;
        }
        var aResult = JSON.parse(evt.data);
        if (aResult.message != 'saveToken' || aResult.url == undefined || aResult.url == '') {
            return;
        }
        var oPassw = self._div.find('input[type="password"]');
        if (aResult.url != undefined) {
            oPassw.val('');
            self._div.find('[data-box="token"]').removeClass('hidden');
            self._div.find('[data-element="url"]').val(aResult.url);
        }
        self._parent.checkPopupVisiblility();
        window.removeEventListener('message', self._presentUrl);
    }
    
    jQuery.calendarAnything.appendView('ical', view);
})();
