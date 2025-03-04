/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


(function(){
    var self = {
        _css        : '/css/main-menu.css',
        _parent     : null,
        _div        : null
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._div = div;
        self._parent = parent;
        self._parent.loadCss(self._css);
    }
    
    view.show = function(params) {
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            self['_' + sAction + 'Action'](el, evt);
        }
        return self._parent._cancelBubble(evt);
    }
    
    self._show = function(params) {
        var sHTML = self._buildHTML(params);
        var aCoords = params.event ? jQuery(params.event.currentTarget).offset() : self._parent._dom.title.offset();
        self._parent.showPopup({
            html : sHTML,
            coords : {"x" : aCoords.left, "y" : aCoords.top + 30},
            view : view
        });
    }
    
    self._buildHTML = function(params) {
        var sHTML = '<div class=ca_menu>'
            + (!self._parent.options._small 
                ? '<div>'
                    + '<span class="switch">'
                        + '<a data-action=switcher data-param="on"  class="' + (self._parent.params.noleft ? 'on' : '' ) + '">'
                            + self._parent.getText('agd_hide', 'Hide')
                            + '</a>'
                        + '<a data-action=switcher data-param="off" class="' + (self._parent.params.noleft ? '' : 'on' ) + '">'
                            + self._parent.getText('agd_show', 'Show')
                            + '</a>'
                    + '</span>'
                    + '<span class="text">'
                    + self._parent.getText('mainmenu_controls_full_screen', 'Controls whether to show the full Calendar Sidebar')
                    + '</span>'
                + '</div>' 
                
                + '<div>'
                    + '<span class="switch">'
                        + '<a data-action=maximize data-param="off" class="' + (self._parent.params.maximize ? '' : 'on' ) + '">'
                            + self._parent.getText('mainmenu_normal', 'Normal')
                            + '</a>'
                        + '<a data-action=maximize data-param="on"  class="' + (self._parent.params.maximize ? 'on' : '' ) + '">'
                            + self._parent.getText('mainmenu_fullscreen', 'Fullscreen')
                            + '</a>'
                    + '</span>'
                    + '<span class="text">'
                        + self._parent.getText('mainmenu_full_screen_hides', 'Fullscreen mode hides Salesforce apps and tabs')
                        + '</span>'
                + '</div>' 
                : ''
            )
            + ' <div>'
                + '<span data-action="controls" class="ico _controls "><a></a>'
                    + self._parent.getText('mainmenu_calendar_controls', 'Calendar Controls')
                + '</span>'
                + '<span class="text">'
                    + self._parent.getText('mainmenu_create_edit_cals', 'Create and edit Calendars')
                    + '<br>'
                    + self._parent.getText('mainmenu_manage_groups_webcals', 'Manage Groups and Web Calendars')
                    + '</span>'
            + ' </div>' 
            + ' <div >'
                + '<span data-action="settings" class="ico _settings"><a></a>'
                + self._parent.getText('mainmenu_display_settings', 'Display Settings')
                + '</span>'
                + '<span class="text">'
                + self._parent.getText('mainmenu_set_personal_options', 'Set personal options and choose which calendars to display')
                + '</span>'
            + ' </div>' 
            + ' <div>'
                + '<span data-action="print" class="ico _print"><a></a>'
                + self._parent.getText('print', 'Print')
                + '</span>'
                + '<span class="text">'
                + self._parent.getText('mainmenu_current_view_print', 'Print current view or save data to image for future use')
                + '</span>'
            + ' </div>' 
            + ' <div>'
                + '<span data-action="refresh" class="ico _refresh"><a></a>' 
                + self._parent.getText('refresh', 'Refresh')
                + '</span>'
                + '<span class="text">'
                + self._parent.getText('mainmenu_refresh', 'Refresh current calendar view')
                + '</span>'
            + ' </div>' 
            + ' <div>'
                + '<span class="text all">'
                + self._parent.getText('mainmenu_url', 'Url to page')
                + ':<input type=text value="' + self._getCurrentPageUrl() + '"></span>'
            + ' </div>' 
            + ' <div data-action=link>'
                + '<span class="text header all">'
                    + '<a data-action="link" href="'
                    + (typeof(self._parent.options.orgId) != 'undefined' && self._parent.options.orgId != '0'
                        ? 'http://silverline.force.com/calendaranything/HelpHome?subId=' + self._parent.options.orgId 
                        : 'http://www.silverlinecrm.com/Support'
                    )
                    + '" target=_blank>'
                    + self._parent.getText('mainmenu_documentation', 'Documentation & Support')
                    + '</a>'
                + '</span>'
            + '</div>' 
            + (self._parent.options.SA ? 
                ' <div data-action=license align=center>'
                    + '<span class="text all">'
                        + '<a data-action=link  href="https://silverline.secure.force.com/licensemanager/buylicense?orgid=' 
                            + self._parent.options.orgId.substr(0, 15) + '" target=_blank>'
                            + self._parent.getText('mainmenu_purchase', 'Purchase Additional Licenses or Renew Subscription')
                        +  '</a><br />'
                    + '</span>'
                + '</div>' 
                : ""
            )
            + '</div>';
        return sHTML;
    }
    
    
    self._switcherAction = function(el, evt)  {
        var bMode = jQuery(evt.target).data('param') == 'on';
        jQuery(evt.target).addClass('on')
            .siblings('.on').removeClass('on');
        self._parent._dom.el.toggleClass('_noleft', bMode);
        self._parent._reResize();
        self._parent._setParam('noleft', bMode);
        self._parent.hidePopup();
    }
    
    self._controlsAction = function(el, evt)  {
        var aCheck = ['sf', 'group', 'web'];
        for (var nI = 0; nI < aCheck.length; nI++) {
            if (self._parent._calendars.getPermission('Read', aCheck[nI]) == true
                && self._parent._calendars.getPermission('Hide', aCheck[nI]) == true
            ) {
                self._parent.layout.manageCalendarsList(aCheck[nI]);
                break;
            }
        }
        
    }
    
    self._settingsAction = function(el, evt)  {
        self._parent.hidePopup();
        self._parent.layout.showSettings();
    }
    
    self._printAction = function(el, evt)  {
        self._parent.hidePopup();
        self._parent.layout.showPrint();
    }
    
    self._refreshAction = function(el, evt) {
        self._parent.hidePopup();
        self._parent._events.clearEvents();
        self._parent._objects.clearCache();
        self._parent.clearView();
        self._parent._aAPICache = {
            "structure" : {}, 
            "objects"   : {}, 
            "simple"    : {}, 
            "simpleDt"  : 0, 
            "recordTypes"           : {},
            "recordTypesDt"         : {},
            "recordTypesDefault"    : {},
            "recordAvailableList"   : {}
        };
        self._parent._saveAPICache();
    }
    
    self._maximizeAction = function(el, evt)  {
        var bMode = jQuery(evt.target).data('param') == 'on';
        jQuery(evt.target).addClass('on')
            .siblings('.on').removeClass('on');
        self._parent._dom.el.toggleClass('_maximize', bMode);
        self._parent._reResize();
        self._parent._setParam('maximize', bMode);
        self._parent.hidePopup();
    }
    
    self._linkAction = function(el, evt) {
//        self._parent.openExternalUrl(jQuery(evt.target).attr('href'));
        window.open(jQuery(evt.target).attr('href'));
        self._parent.hidePopup();
    }
    
    self._getCurrentPageUrl = function() {
        var sUrl = '',
            aUrls = document.location.href.split('?'),
            aCalendars = self._parent.layout.getActiveCalendars(),
            aAllCalendars = [].concat(aCalendars.calendar, aCalendars.group, aCalendars.web),
            aViewModes = {'day' : 'd', 'month' : 'm', 'week' : 'w', 'custom' : 'c' , 'gantt' : 'g', 'swimlane' : 's'};
        sUrl = aUrls[0] + '?date=' + self._parent.options.current.format('yyyy-mm-dd')
            + '&cid=' + aAllCalendars.join(',')
            + '&sb=' + (self._parent.params['closeleft'] ? 2 : (self._parent.params['noleft'] ? 0 : 1))
            + '&v=' + aViewModes[self._parent._currentModeName];
        return sUrl;
    }
    
    jQuery.calendarAnything.appendView('mainMenu', view);
})();
