/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
(function(){

    var self = {
        _css        : '/css/calendar-menu.css',
        _parent     : null,
        _div        : null,
        _type       : null,
        _event      : null,
        _color      : false,
        _mode       : '',
        _buttonTitles : {},
        _buttonMultiTitles : {}
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._parent = parent;
        self._buttonTitles = self._parent.getText('menu_calendar_titles')
        self._buttonMultiTitles = self._parent.getText('menu_calendars_titles')
        self._div = div;
        self._parent.loadCss(self._css);
    }
    
    view.show = function(params) {
        self._event = params.event;
        var aLinked = params.calendar;
        if (self._parent.options.readonly === true) {
            return;
        }
        if (params.calendar.hasClass('title')) {
            aLinked = params.calendar;
            self._mode = 'title';
        } else if (params.calendar.hasClass('calendar') || params.calendar.parents('.calendar').size() > 0) {
            aLinked = params.calendar.is('[data-calendar]') ? params.calendar : params.calendar.parents('[data-calendar]');
            self._mode = 'calendar';
        } else if (params.calendar.hasClass('_filterset') || params.calendar.parents('._filterset').size() > 0) {
            if (!params.calendar.hasClass('_filterset')) {
                aLinked = params.calendar.parents('._filterset');
            } else {
                aLinked = params.calendar;
            }
            self._mode = 'filterset';
        }
        params.calendar = aLinked;
        self._type = params.calendar.is('[data-type]') 
            ? params.calendar.data('type') 
            : params.calendar.parents('[data-type]').data('type');
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            self['_' + sAction + 'Action'](el, evt);
        }
        return false;
    }
    
    
    self._show = function(params) {
        var sHTML = self['_build' + self._mode + 'HTML'](params),
                //self._mode == 'title' ? self._buildTitleHTML(params) : self._buildHTML(params),
            nX = params.event.pageX || params.event.originalEvent.pageX,
            nY = params.event.pageY || params.event.originalEvent.pageY;
        if (sHTML == '') {
            return;
        }
        self._parent.showPopup({
            html : sHTML,
//            coords : {"x" : params.event.clientX - 10, "y" : params.event.clientY - 10},
            coords : {"x" : nX - 10, "y" : nY - 10},
            linkedEl : params.calendar,
            view : view,
            overflow : false
        });
    }
    
    self._buildcalendarHTML = function(params) {
        var aCalendar = self._parent._calendars.getCalendar(params.calendar.data('calendar')),
            sType = params.calendar.data('type'),
            sHTML = '<div class=event_calendarmenu>'
            + ((aCalendar.operation === undefined || aCalendar.operation === true || aCalendar.operation === 'edit') 
                && self._parent._calendars.getPermission('Edit', aCalendar.calendarType)
                ? ' <div data-action=editinside>' + self._parent.getText('edit', 'Edit') + '</div>'  
                : ""
            )
            + (self._parent._calendars.getPermission('Create', aCalendar.calendarType)
                ? ' <div data-action=cloneinside>' + self._parent.getText('clone', 'Clone') + '</div>' 
                : ''
            )
            + ((aCalendar.operation === undefined || aCalendar.operation === true || aCalendar.operation === 'delete') 
                && self._parent._calendars.getPermission('Delete', aCalendar.calendarType) 
                ? ' <div data-action=del>' + self._parent.getText('delete', 'Delete') + '</div>' 
                : ""
            )
            + ' <div data-action=visible>' + self._parent.getText('show_only_this_calendar', 'Display only this calendar') + '</div>'
            + (self._parent._calendars.getPermission('Hide', aCalendar.calendarType) 
                ? ' <div data-action=hide>' + self._parent.getText('agd_hide', 'Hide') + '</div>' 
                : ''
            )
            + (aCalendar.operation !== false && self._parent._calendars.getPermission('Edit', aCalendar.calendarType)
                ? ' <div data-action=color>' + self._parent.getText('menu_change_color', 'Change color') + '</div>' 
                : ""
            )
            + (sType == 'sf' 
                ? ' <div data-action=filter '
                    + (aCalendar['filters'] != undefined && aCalendar['filters'] != '' ? ' class="_active"' : '')
                    + '>' + self._parent.getText('menu_quick_filters', 'Quick filters' ) 
                    + (aCalendar['filters'] != undefined && aCalendar['filters'] != '' 
                        ? ' <span>' + self._parent.getText('menu_applied', 'Applied' )  + '</span>' 
                        : ''
                    )
                + '</div>' 
                : ""
            ) 
    
            + (sType == 'sf' ? ' <div data-action=ical>' + self._parent.getText('menu_publoch_ical', 'Publish iCalendar' )  + '</div>' : '')
            + '</div>';
        return sHTML;
    }
    
    self._buildtitleHTML = function(params) {
        var sType = params.calendar.parent().data('type'), 
            sHTML = '';
        sType = (sType == undefined || params == null) ? 'sf' : sType;
        if (self._buttonTitles[sType] == undefined)  {
            return sHTML;
        }
        var sText = self._buttonTitles[sType];
        sHTML = '<div class=event_calendarmenu>'
            + (' <div data-action=listCalendars>' + self._parent.getText('menu_list_all', 'List all' ) + ' ' + sText + '</div>')
            + (self._parent._calendars.getPermission('Create', sType) 
                ? ' <div data-action=addCalendar>' + self._parent.getText('menu_new', 'New' )  + ' ' + sText + '</div>' 
                : ''
            )
            + '</div>';
        return sHTML;
    }   
    
    self._buildfiltersetHTML = function(params) {
        var sHTML = '<div class=event_calendarmenu>'
            
            + (params.calendar.data('type') != 'custom' && (self._parent.options.SA || params.calendar.data('type') == 'user' )
              ? '<div data-action=editFS>' + self._parent.getText('edit', 'Edit') +  '</div>'
              : ''
            )
            + '<div data-action=cloneFS>' + self._parent.getText('clone', 'Clone') +  '</div>'
            + (params.calendar.data('type') != 'custom' && (self._parent.options.SA || params.calendar.data('type') == 'user')
                ? '<div data-action=delFS>' + self._parent.getText('delete', 'Delete') + '</div>' 
                : ''
            )
            + (params.calendar.data('type') != 'custom' && (self._parent.options.SA || params.calendar.data('type') == 'user')
                ? '<div data-action=renameFS>Rename</div>' 
                : ''
            )
            + '</div>';
        return sHTML;
    }   
    
    self._editinsideAction = function(el, evt)  {
        self._parent.layout.showCalendarEditForm(self._type, el.data('calendar'));
    }
    
    self._cloneinsideAction = function(el, evt)  {
        self._parent.layout.showCalendarEditForm(self._type, el.data('calendar'), true);
    }
    
    
    self._visibleAction = function(el, evt)  {
        var aSelectedCalendars = self._parent.layout.getActiveCalendars() ;
        aSelectedCalendars = [].concat(aSelectedCalendars.group, aSelectedCalendars.calendar, aSelectedCalendars.web);
        var nPresentPosition = aSelectedCalendars.indexOf(el.data('calendar'));
        if (nPresentPosition >= 0) {
            aSelectedCalendars.splice(nPresentPosition, 1);
        }
        self._parent.layout.toggleCalendar(aSelectedCalendars, true);
        if (nPresentPosition < 0) {
            self._parent.layout.toggleCalendar(el.data('calendar'));
        }
        self._parent.hidePopup();
    }
    
    self._hideAction = function(el, evt)  {
        self._parent.layout.changeVisibleCalendar(null, [el.data('calendar')]);
        self._parent.hidePopup();
    }
    
    self._delAction = function(el, evt)  {
        /*
        if (!self._parent.params.confirmDelete || confirm('Are you sure you want to delete?')) {
            self._parent.layout.delCalendar(el.data('calendar'));
        }
        self._parent.hidePopup();
        */
        if (!self._parent.params.confirmDelete) {
            self._parent.layout.delCalendar(el.data('calendar'));
            self._parent.hidePopup();
        } else {
            self._parent.hidePopup();
            self._parent.showNotify('Are you sure you want to delete?', 'confirm', function() {
                self._parent.layout.delCalendar(el.data('calendar'));
            });
        }
    }
    
    self._setColorAction = function(el, evt) {
        var domColor = jQuery('.event_calendarmenu .select_color'),
            domInputColor = domColor.children('input');
        self._parent.layout.changeCalendarColor(el.data('calendar'), domInputColor.val());
        self._parent.hidePopup();
    }
    
    self._icalAction = function(el, evt) {
        self._parent.layout.showiCal(el.data('calendar'), evt);
        self._parent.hidePopup();
    }
    
    self._colorAction = function(el, evt)  {
        var sCalendarId = el.data('calendar'),
            aCalendar = self._parent._calendars.getCalendar(sCalendarId),
            sColor = aCalendar.color;
        
        self._parent._prependQueue([
            function(){
                jQuery(evt.target).caColor({
                    success : function(sNewColor, sTpl) {
                        self._parent.layout.changeCalendarColor(el.data('calendar'), sNewColor, sTpl);
                        self._parent.hidePopup();
                    },
                    color : sColor,
                    show : true,
                    tpl : self._type == 'sf' ? aCalendar.settings.color_tpl || 0 : undefined,
                    canvasUrl : self._parent.options.staticUrl + '/pic/gradient.png'
                });
            },
            function(){
                if (!self._color) {
                    self._parent.loadCss('/css/plugin-ca-color.css');
                    self._parent._initScripts('/plugin/jquery.ca-color.js');
                }
                self._color = true;
            }
        ]);
        return;
    }
    
    self._filterAction = function(el, evt)  {
        self._parent.layout.showCalendarQuickFilter(el.data('calendar'), self._event);
    }
    
    self._listCalendarsAction = function(el, evt) {
        self._parent.layout.manageCalendarsList(self._type);
    }
    
    self._addCalendarAction = function(el, evt) {
        self._parent.layout.showCalendarEditForm(self._type, '', false);
        
    }
    
    self._delFSAction = function(oEl, evt) {
        var oView = self._parent._getView('filteringPanel');
        if (oView != undefined) {
            /*
            if (confirm('Are you sure you want to delete?')) {
                oView.action('delFS', oEl, evt);
            }
            */
            self._parent.showNotify('Are you sure you want to delete?', 'confirm', function() {
                oView.action('delFS', oEl, evt);
                self._parent.hidePopup();
            });
            
        } else {
            //alert('You cannot delete filter set');
            self._parent.showNotify('You cannot delete filter set', 'alert');
        }
        self._parent.hidePopup();
    }
    
    self._editFSAction = function(oEl, evt) {
        var oView = self._parent._getView('filteringPanel');
        if (oView != undefined) {
            oView.action('editFS', oEl, evt);
        } else {
            //alert('You cannot edit filter set');
            self._parent.showNotify('You cannot edit filter set', 'alert');
        }
        self._parent.hidePopup();
    }
    
    self._cloneFSAction = function(oEl, evt) {
        var oView = self._parent._getView('filteringPanel');
        if (oView != undefined) {
            oView.action('cloneFS', oEl, evt);
        } else {
            //alert('You cannot clone filter set');
            self._parent.showNotify('You cannot clone filter set', 'alert');
        }
        self._parent.hidePopup();
    }

    self._renameFSAction = function(oEl, evt){
        var oView = self._parent._getView('filteringPanel');
        if (oView != undefined) {
            oView.action('renameFS', oEl, evt);
        } else {
            //alert('You cannot rename filter set');
            self._parent.showNotify('You cannot rename filter set', 'alert');
        }
//        self._parent.hidePopup();
    }
    
    jQuery.calendarAnything.appendView('calendarMenu', view);
    
})();