/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css        : '/css/event-menu.css',
        _parent     : null,
        _div        : null,
        _oBar       : null,
        _oEvt       : null
    };
    var view = {};
    
    view.init = function (div, parent){
        self._div = div;
        self._parent = parent;
        self._parent.loadCss(self._css);
    }
    
    view.show = function(params) {
        if (self._parent.options.readonly === true) {
            return;
        }
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (jQuery(evt.target).hasClass('non_e')) {
            return false;
        }
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
    }
    
    self._show = function(params) {
        self._oBar = params.el;
        self._oEvt = params.event;
        var sHTML = self._buildHTML(params),
            nX = params.event.pageX || params.event.originalEvent.pageX,
            nY = params.event.pageY || params.event.originalEvent.pageY;

        
        self._parent.showPopup({
            html : sHTML,
//            coords : {"x" : params.event.clientX - 10, "y" : params.event.clientY - 10},
            coords : {"x" : nX - 10, "y" : nY - 10},
            linkedEl : params.el, 
            view : view
        });
    }
    
    self._buildHTML = function(params) {
        var oCalendar = self._parent._calendars.getCalendar(self._oBar.data('calendar')),
            bNoMove = self._oBar.hasClass('non_e'),
            bReadonlyMode = self._parent.options.detailUrl == '0'  //self._oBar.hasClass('non_e') 
                || self._parent.options.readonly === true,
            sHTML = '<div class=event_submenu>'
            + ' <div '
                + (bReadonlyMode || oCalendar['edit'] === false 
                    || self._parent.options.readonly.edit === false
                    ? ' class="non_e" ' 
                    : ""
                )
                + 'data-action=edit>'
                + self._parent.getText('edit', 'Edit')
                + '</div>' 
            + ' <div '
                + (bNoMove || bReadonlyMode || oCalendar['create'] === false 
                    || self._parent.options.readonly.create=== false
                    ? ' class="non_e" ' 
                    : ""
                    )
                + 'data-action=clone>'
                + self._parent.getText('clone', 'Clone')
                + '</div>' 
            + ' <div '
                + (bNoMove || bReadonlyMode || oCalendar['create'] === false 
                    || self._parent.options.readonly.create=== false
                    ? ' class="non_e" '
                    : ""
                )
                + 'data-action=copy>'
                + self._parent.getText('copy', 'Copy')
                + '</div>'
            + ' <div '
                + (bNoMove || bReadonlyMode || oCalendar['move'] === false 
                    || self._parent.options.readonly.move=== false
                    ? ' class="non_e" '
                    : ""
                )
                + 'data-action=cut>'
                + self._parent.getText('cut', 'Cut')
                + '</div>'
            + ' <div ' 
                + (bReadonlyMode || oCalendar['delete'] === false 
                    || self._parent.options.readonly.del === false 
                    ? ' class="non_e" '
                    : ""
                )
                + 'data-action=del>'
                + self._parent.getText('delete', 'Delete')
                + '</div>'
            + (self._parent.options.readonly.hover === false 
                ? '' 
                : ' <div data-action=detail>'
                    + self._parent.getText('event_menu_details', 'Details')
                    + '</div>'
            )
            + (self._parent.options.readonly.contextCalendar === false 
                ? '' 
                : '<div data-action=calendar>'
                    + self._parent.getText('event_menu_calendar_menu', 'Calendar menu')
                    + '</div>'
            )
            + '</div>';
        return sHTML;
    }
    
    self._delAction = function(el)  {
        var evtId = el.data('event');
        self._parent.layout.delEvent(evtId, el.data('calendar'));
        self._parent.hidePopup();
    }
    
    self._cutAction = function(el)  {
        var domMode = self._parent.layout.getCurrentModeDiv();
        if (el.hasClass('CA_cut')) {
            domMode.find('.CA_cut').removeClass('CA_cut');
            self._parent._events.basketEvent([], 'cut');
            self._parent.hidePopup();
            return false;
        }
        var aCut = [{
                "calendar" : el.data('calendar'),
                "id" : el.data('event')
            }];
            
        
        if (el.hasClass('non_e')){
            //alert(self._parent.getText('message_cannot_edit', 'You can not cut this event'));
            self._parent.showNotify(self._parent.getText('message_cannot_edit', 'You can not cut this event'), 'alert');
            return false;
        }
        
        domMode.find('.evt.sel[data-event]').each(function(){
            var el = jQuery(this);
            if (!el.hasClass('non_e')) {
                aCut.push({ 
                    "calendar" : el.data('calendar'),
                    "id" : el.data('event')
                });
            }
        });
        domMode.find('.evt').removeClass('CA_cut');
        for (var nI = 0; nI < aCut.length; nI++){
            
            domMode.find(
                '.evt'
                + '[data-calendar="' + aCut[nI].calendar + '"]'
                + '[data-event="' + aCut[nI].id + '"]'
            ).addClass('CA_cut');
        }
        
        self._parent._events.basketEvent(aCut, 'cut');
        self._parent.hidePopup();
        return false;
    }
    
    self._copyAction = function(el) {
        var domMode = self._parent.layout.getCurrentModeDiv(),
            aCopy = [{
                "calendar" : el.data('calendar'),
                "id" : el.data('event')
            }];
         if (el.hasClass('non_e')){
            //alert(self._parent.getText('message_cannot_copy', 'You can not copy this event'));
            self._parent.showNotify(self._parent.getText('message_cannot_copy', 'You can not copy this event'), 'alert');
            return false;
        }
        domMode.find('.evt.sel[data-event]').each(function(){
            var el = jQuery(this);
            if (!el.hasClass('non_e')) {
                aCopy.push({ 
                    "calendar" : el.data('calendar'),
                    "id" : el.data('event')
                });
            }
        });
        self._parent._events.basketEvent(aCopy, 'copy');
        self._parent.hidePopup();
        return false;
    }
    
    self._editAction = function(el, evt)  {
        var evtId = el.data('event');
        
        self._parent.hidePopup();
        self._parent.layout.showCreateEventForm({
                    "cid" : el.data('calendar'),
                    "el" : el,
                    "eventId" : el.data('event'),
                    "onClose" : function() {
                        self._parent.layout.buildData();
                    }, 
                    "event" : evt
                });        
        return false;
    }
    
    self._detailAction = function(el, evt) {
        var evtId = el.data('event');
        self._parent.hidePopup();
        self._parent.layout.showEventDetail(el, evt);
        return false;
    }
    
    self._cloneAction = function(el, evt) {
        var evtId = el.data('event');
        if (el.hasClass('non_e')){
            //alert(self._parent.getText('message_cannot_clone', 'You can not clone this event'));
            self._parent.showNotify(self._parent.getText('message_cannot_clone', 'You can not clone this event'), 'alert');
            return false;
        }
        self._parent.hidePopup();
        self._parent.layout.showCreateEventForm({
                    "cid" : el.data('calendar'),
                    "el" : el,
                    "eventId" : el.data('event'),
                    "onClose" : function() {
                        self._parent.layout.buildData();
                    }, 
                    "event" : evt,
                    "clone" : true
                });
        return false;
    }
    
    self._calendarAction = function(el, evt) {
        self._parent.layout.showCalendarSubmenu(el.data('calendar') , self._oEvt);
        return false;
    }
    
    jQuery.calendarAnything.appendView('eventMenu', view);
})();
