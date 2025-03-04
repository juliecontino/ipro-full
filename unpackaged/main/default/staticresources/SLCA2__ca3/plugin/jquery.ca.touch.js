/* long touch / long click
 */

(function(){

    // public jQuery properties
    var self = {
        plugin : this,
        options : {
            "time" : 750,
            "radius" : 20,
            "zoomChangePercent" : 20,
            "zoomChangeMin" : 50,
            "maxSwipeTime" : 250,
            "minSwipeLength" : 100,
            "handle" : {
                move : true,
                swipe : true,
                longtouch : true,
                zoom : true
            },
            preventDefaultMove : true
        },
        _coords : {},
        _evt : null,
        _target : null,
        _eventTarget : null,
        _mode : "move",
        _timer : null,
        _touches : null,
        _ieTouches : [],
        _startTime : null,
        _initEvent  : false,
        _eventNames :  window.navigator.msPointerEnabled
            ? {
                "start" : "MSPointerDown.CA_longtouch",
                "end"   : "MSPointerUp.CA_longtouch",
                "move"  : "MSPointerMove.CA_longtouch",
                "leave" : "MSPointerCancel.CA_longtouch",
                "cancel" : "MSPointerCancel.CA_longtouch"
            }
            : {
                "start" : "touchstart.CA_longtouch",
                "end"   : "touchend.CA_longtouch",
                "move"  : "touchmove.CA_longtouch",
                "leave" : "touchleave.CA_longtouch",
                "cancel" : "touchcancel.CA_longtouch"
            }
    };
    
    this._setup = function(data, namespace, eventHandle){
        if (data.handle == undefined) {
            data.handle = {move : true,
                swipe : true,
                longtouch : true,
                zoom : true
            }
        }
        data.preventDefaultMove = data.preventDefaultMove == undefined ? true : data.preventDefaultMove;
        jQuery.extend(self.options, data);
        self.namespace = namespace;
        self.eventHandle = eventHandle;
        self.el = jQuery(this);
        self.el.data('ca_longtouch_options', data);
        self.elThis = this;
    };
    
    this._add = function(handleObj){
        self.selector = handleObj.selector;
        self.el
            .on(self._eventNames.start, handleObj.selector, self.plugin._startTimer);
        self.el.data('ca_longtouch_handler', handleObj.handler);
//        self.handler = handleObj.handler;
    }
    
    this._teardown = function(namespaces){
        self.el.off('.CA_longtouch', self.selector, self.plugin._startTimer);
    }
    
    this._startTimer = function(evt) {
        if (window.navigator.msPointerEnabled && evt.originalEvent.isPrimary) {
            self._touches = null;
            self._ieTouches = [];
            console.log('primary');
        }
//        console.log('start');
        self.plugin._returnTouchEvent(evt);
        if (self._touches != null && self._touches.length > 1) {
            self._mode = 'zoom';
            self._initZoom();
            return;
        }
//        console.log(self._touches != null ? self._touches.length : 'first');
        self._startTime = evt.timeStamp;
        var oTarget = jQuery(evt.delegateTarget);
        self._target = oTarget;
        self._eventTarget = jQuery(evt.currentTarget);
        jQuery.extend(self.options, oTarget.data('ca_longtouch_options'));
        self.handler = oTarget.data('ca_longtouch_handler');
//        self.el.data('ca_longtouch_options', data);
        self.resetTouchend = false;
        self._initEvent = true;
//        self.plugin._returnTouchEvent(evt);
        self._coords = {x : evt.clientX, y : evt.clientY, lastX : evt.clientX, lastY : evt.clientY};
        self._evt = evt;
        if (window.navigator.msPointerEnabled) {
            oTarget.one('contextmenu.CA_longtouch MSGestureHold.CA_longtouch selectstart.CA_longtouch', function(evt){
                evt.preventDefault();
                return false;
            });
        }
        oTarget
            .off(self._eventNames.move +' ' 
                + self._eventNames.leave + ' '
                + self._eventNames.end + ' ' 
                + self._eventNames.cancel
            );
//        self.plugin._clearTimer(evt);
        self._mode = 'longtouch';
        if (evt.data == undefined) {
            evt.data = {};
        }
        evt.type = 'calongtouch';
        evt.data.type = 'longtouch';
        oTarget
            .on(self._eventNames.move,  self.plugin._checkCoords)
            .on(self._eventNames.end + ' ' + self._eventNames.leave, self.plugin._clearTimer);
        if (self.options.handle.longtouch === true) {
            self._eventTarget.one(self._eventNames.end, self.plugin._clearTimer);
        }
//            .one('touchend.CA_longtouch touchleave.CA_longtouch touchcancel.CA_longtouch', self.plugin._clearTimer);
        if (self._timer) {
            clearTimeout(self._timer);
            self._timer = null;
        }
        self._timer = setTimeout(function(){
            self.plugin._checkTimer(evt);
        }, self.options.time);
        //self.el.bind('longclick');
    }
    
    this._checkTimer = function(evt) {
        if (self.options.handle.longtouch !== true){
            return;
        }
        
        self.resetTouchend = true;
        this._clearTimer(evt, true);
        var d = new Date();
        if (d.getTime() - self._startTime > self.options.time + 100) {
            return;
        }
        //self.plugin._returnTouchEvent(evt);
//        evt.data.type = 'longtouch';
        jQuery(evt.target).one(self._eventNames.end, function(evt){
            evt.cancelBubble = true;
            evt.stopPropagation();
            evt.preventDefault();
            return false;
        });
        
        self.handler.apply(self.elThis, arguments);
    }
    
    this._clearTimer = function(evt, bStopMode) {
        self.plugin._returnTouchEvent(evt);
        bStopMode = bStopMode || false;
//        console.log(self._touches.length + ' /--/ ' + evt.type + ' - ' + evt.originalEvent.type);
//        console.log('stop 1');
        if (self._touches != null && self._touches.length > 0 && !bStopMode) {
            self._mode = 'move';
            console.log('switch to move');
            return true;
        }
//        console.log('stop 2');
        if (['touchend', 'MSPointerUp'].indexOf(evt.originalEvent.type) >= 0 && evt.timeStamp - self._startTime < self.options.maxSwipeTime) {
            self._doSwipe(evt);
        }
        jQuery(evt.currentTarget)
            .off(self._eventNames.move +' ' 
                + self._eventNames.leave + ' '
                + self._eventNames.end + ' ' 
                + self._eventNames.cancel
            );
        self._eventTarget.off(self._eventNames.end);
            
//        console.trace();
//        console.log('cancel ' + evt.type);
        
//        touchend.CA_longtouch touchleave.CA_longtouch touchcancel.CA_longtouch
        if (self._timer) {
            clearTimeout(self._timer);
            self._timer = null;
        }
        self._touches = null;
        self._initEvent = false;
        if (self.resetTouchend) {
            evt.cancelBubble = true;
            evt.stopPropagation();
            evt.preventDefault();
            return false;
        } 
        return true;
    }
    
    this._checkCoords = function(evt) {
        if (self.options.preventDefaultMove !== false) {
            evt.cancelBubble = true;
            evt.stopPropagation();
            evt.preventDefault();
        }
        if (self.options.radius == undefined || self.options.radius < 1 ) {
            return false;
        }
        
        self.plugin._returnTouchEvent(evt);
        switch (self._mode) {
            case 'zoom' :
                if (self.options.handle.zoom !== true){
                    return false;
                }

                var nNewDistance = self._getZoomDistance();
                if (nNewDistance == 0 || self._coords.zoomDistance == 0) {
                    break;
                }
                if (Math.abs(nNewDistance -  self._coords.zoomDistance)  < self.options.zoomChangeMin
                    || Math.abs(nNewDistance -  self._coords.zoomDistance) 
                        / self._coords.zoomDistance < self.options.zoomChangePercent / 100
                ){
                    break;
                }
                
                if (evt.data == undefined) {
                    evt.data = {};
                }
                jQuery.extend(evt.data, {
                    zoom : nNewDistance > self._coords.zoomDistance
                }, self._getZoomMiddlePoint());
                evt.data.type = 'zoom';
                self._coords.zoomDistance = nNewDistance;
                self.handler.apply(self.elThis, arguments);
                break;
            case 'move' :
                if (self.options.handle.move !== true || evt.timeStamp - self._startTime < self.options.maxSwipeTime){
                    if (self.options.preventDefaultMove !== false) {
                        return false;
                    } else {
                        return;
                    }
                }

                if (evt.data == undefined) {
                    evt.data = {};
                }
                evt.data.type = 'move';
                jQuery.extend(evt.data, {
                    startX : self._coords.x,
                    startY : self._coords.y,
                    deltaX : self._coords.lastX - evt.clientX,
                    deltaY : self._coords.lastY - evt.clientY,
                    startDeltaX : self._coords.x - evt.clientX,
                    startDeltaY : self._coords.y - evt.clientY,
                    initMode : self._initEvent ? 'init' : ''
                });
                self._initEvent = false;
                self._coords.lastX = evt.clientX;
                self._coords.lastY = evt.clientY;
                
                self.handler.apply(self.elThis, arguments);
                break;
            case 'longtouch' :
                if (
                    Math.abs(evt.clientX - self._coords.x) > self.options.radius
                    || 
                    Math.abs(evt.clientY - self._coords.y) > self.options.radius
                ) {
                    
//                    evt.cancelBubble = true;
//                    evt.stopPropagation();
//                    evt.preventDefault();
//                    self.resetTouchend = true;
                    self._mode = 'move';
                    if (self._timer) {
                        clearTimeout(self._timer);
                        self._timer = null;
                    }
                    //return self.plugin._clearTimer(self._evt);
                }
                break;
        }
        
    }
    
    
    self._initZoom = function(evt){
        if (self._timer) {
            clearTimeout(self._timer);
            self._timer = null;
        }
        if (self._touches.length < 2) {
            return;
        }
        self._coords.zoomDistance = self._getZoomDistance();
//        self._coords.zoomX = evt.clientX;
//        self._coords.zoomY = evt.clientY;
    }
    
    self._getZoomDistance = function(){
        if (self._touches.length < 2) {
            return 0;
        }
        return Math.sqrt(
                Math.pow(self._touches[0].clientX - self._touches[1].clientX, 2)
                + Math.pow(self._touches[0].clientY - self._touches[1].clientY, 2)
            );
    }
    
    self._getZoomMiddlePoint = function(){
        if (self._touches.length < 2) {
            return 0;
        }
        return {
            "x" : parseInt(Math.abs(self._touches[0].clientX + self._touches[1].clientX) / 2),
            "y" : parseInt(Math.abs(self._touches[0].clientY + self._touches[1].clientY) / 2)
        }
    }
    
    self._doSwipe = function(evt) {
        if (self.options.handle.swipe !== true){
            return false;
        }
        if (Math.abs(self._coords.x - evt.clientX) < self.options.minSwipeLength 
            && Math.abs(self._coords.y - evt.clientY) < self.options.minSwipeLength
        ){
            return false;
        }
        if (evt.data == undefined) {
            evt.data = {};
        }
        evt.data.type = 'swipe';
        var sDir = Math.abs(self._coords.x - evt.clientX) > self.options.minSwipeLength ? 'h' : 'v';
        jQuery.extend(evt.data, {
            what : sDir,
            where :  (sDir = 'h') ? (self._coords.x - evt.clientX < 0) : (self._coords.y - evt.clientY < 0)
        });
        self.handler.apply(self.elThis, arguments);
    }
    
    this._returnTouchEvent = function(evt) {
        if (evt.originalEvent == undefined 
            || (
                evt.originalEvent.changedTouches == undefined
                && 
                (!window.navigator.msPointerEnabled || evt.originalEvent.pointerId == undefined)
            )
        ) {
            //alert(evt.originalEvent.pointerId);
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
//            alert(oOriginalEvt.pointerId);
            if (['MSPointerUp', 'MSPointerOut', 'MSPointerCancel'].indexOf(evt.originalEvent.type) == -1) {
                self._touches = self._touches == null ? [] : self._touches;
                var nIdx = self._ieTouches[oOriginalEvt.pointerId] == undefined 
                    ? self._touches.length
                    : self._ieTouches[oOriginalEvt.pointerId];
//                if (nIdx > 0 && nIdx == self._touches.length) {
//                    console.log(oOriginalEvt.pointerId + ' - ' + nIdx);
//                }
                self._touches[nIdx] = touch;
                self._ieTouches[oOriginalEvt.pointerId] = nIdx;
            } else {
                
                if (self._ieTouches[oOriginalEvt.pointerId] != undefined ) {
//                    delete self._touches[self._ieTouches[oOriginalEvt.pointerId]];
//alert(self._ieTouches[oOriginalEvt.pointerId]);
                    self._touches.splice(self._ieTouches[oOriginalEvt.pointerId], 1);
                    delete self._ieTouches[oOriginalEvt.pointerId];
                }
//                console.log(oOriginalEvt.pointerId + ' -> ' + self._touches.length);
//                alert(evt.type + ' / ' + self._touches.length);
            }
            
        } else {
            touch = oOriginalEvt.changedTouches[0];
            self._touches = oOriginalEvt.touches;
        }
        evt.view = window;
        evt.detail = 1;
        evt.screenX = touch.sceenX;
        evt.screenY = touch.screenY;
        evt.clientX = touch.clientX;
        evt.clientY = touch.clientY;
        evt.target = document.elementFromPoint(evt.clientX, evt.clientY)
    }
    
    jQuery.event.special.calongtouch = {
        "setup" : this._setup,
        "teardown" : this._teardown,
        "add" : this._add
    }
    
//    jQuery.event.special.camovetouch = {
//        "setup" : this._setup,
//        "teardown" : this._teardown,
//        "add" : this._add
//    }
})();