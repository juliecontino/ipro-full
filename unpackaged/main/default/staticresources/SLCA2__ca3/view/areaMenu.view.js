/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){

    var self = {
        _css        : '/css/area-menu.css',
        _parent    : null,
        "_menu"     : null,
        _div        : null,
        _area       : null,
        _event      : null
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._parent = parent;
        self._div = div;
        self._parent.loadCss(self._css);
    }
    
    view.show = function(params) {
        self._area = params.area;
        self._event = params.event;
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        var oView = self._parent._getView();
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            self['_' + sAction + 'Action'](el, evt);
        } else if (typeof(oView.areaMenuAction) == 'function'){
            oView.areaMenuAction(sAction, el, self._event);
        }
    }
    
    self._show = function(params) {
        if (self._parent.options.readonly === true) {
            return;
        }
        var sHTML = self._buildHTML(params),
            nX = params.event.pageX || params.event.originalEvent.pageX,
            nY = params.event.pageY || params.event.originalEvent.pageY;

        self._parent.showPopup({
            html : sHTML,
//            coords : {"x" : params.event.clientX - 10, "y" : params.event.clientY - 10},
            coords : {"x" : nX - 10, "y" : nY - 10},
            linkedEl : params.area, 
            view : view
        });
    }
    
    self._buildHTML = function(params) {
        var oView = self._parent._getView(),
            sHTML = '<div class=area_submenu>'
            + (self._parent.options.readonly === true || self._parent.options.readonly.create === false 
                ? '' 
                :  '<div data-action=create>'
                + self._parent.getText('menu_create', 'Create')
                + '</div>'
            )
            + (self._parent.options.readonly === true || self._parent.options.readonly.move === false 
                ? ''
                : '<div data-action=paste>'
                    + self._parent.getText('menu_paste', 'Paste')
                    + '</div>' 
            )
            + ' <div data-action=selectall>'
                + self._parent.getText('menu_select_all', 'Select all')
                + '</div>'
            + (typeof(oView.areaMenu) == 'function'
                ? oView.areaMenu(self._area, self._event)
                : ''
            )
            + '</div>';
        return sHTML;
    }
    
    self._pasteAction = function(el)  {
        var domMode = self._parent.layout.getCurrentModeDiv();
        self._parent.layout.pasteEvent(self._area, self._event, function(){
            domMode.find('.evt.CA_cut').removeClass('CA_cut');
        });
        self._parent.hidePopup();
    }
    
    self._createAction = function(el, evt)  {
        var oView = self._parent._getView(),
            oClickDate = oView.getClickDate(self._event);
        self._parent.hidePopup();
        if (oClickDate === false) {
            return false;
        }
        self._parent.layout.showCreateEventForm({
            "cid" : "",
            "date" : {"start" : Date.baseDate(oClickDate.date), "stop" : Date.baseDate(oClickDate.date)},
            "el" : null,
            "onClose" : function(evt) {
                oView.showData();
            }, 
            "onCancel" : function(evt) {
                oView.showData();
            }, 
            "event" : evt,
            "allDay" : !oClickDate.hourly
        });        
        
    }
    
    self._selectallAction = function(el, evt) {
        var domMode = self._parent.layout.getCurrentModeDiv();
        domMode.find('.evt').addClass('sel');
        self._parent.hidePopup();
    }
    
    jQuery.calendarAnything.appendView('areaMenu', view);
})();

