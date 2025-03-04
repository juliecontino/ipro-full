/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function($) {
    var simpleSelect = function(el, options) {
        var self = {};
        
        self._eventNames = window.navigator.msPointerEnabled || window.navigator.pointerEnabled
            ? (window.navigator.pointerEnabled 
                ? {
                    "start_fixed" : "pointerdown.CA_ms_fixed",
                    "start" : "pointerdown.CA_longtouch",
                    "end"   : "pointerup.CA_ms",
                    "move"  : "pointermove.CA_ms",
                    "leave" : "pointercancel.CA_ms mouseleave.CA_ms",
                    "cancel" : "pointercancel.CA_ms"
                }
                : {
                    "start_fixed" : "MSPointerDown.CA_ms_fixed",
                    "start" : "MSPointerDown.CA_longtouch",
                    "end"   : "MSPointerUp.CA_ms",
                    "move"  : "MSPointerMove.CA_ms",
                    "leave" : "MSPointerCancel.CA_ms mouseleave.CA_ms",
                    "cancel" : "MSPointerCancel.CA_ms"
                }
            )
            : {
                "start_fixed" : "mousedown.CA_ms_fixed touchstart.CA_ms_fixed",
                "start" : "mousedown.CA_ms_fixed touchstart.CA_ms_fixed",
                "end"   : "mouseup.CA_ms touchend.CA_ms",
                "move"  : "mousemove.CA_ms touchmove.CA_ms",
                "leave" : "mouseleave.CA_ms",  // touchleave.CA_ms  
                "cancel" : "touchcancel.CA_ms"
            }
        
        self._init = function(options){
            self._options = options;
            self._initStartEvent();
            if (self._options.moveSelector == undefined) {
                self._options.moveSelector = self._options.selector;
            }
        } 
//        el.on('touchmove.CA_ms_test', function(evt){
//            localCA.log('do mobing ' + self._options.moveSelector);
//        });
        self._initStartEvent = function() {
            el.on(self._eventNames.start_fixed, self._options.selector, function(evt){
//                localCA.log('start touch');
                if (self._options.swipe == undefined && self._options.notselector != undefined) {
                    var oEvtEl = jQuery(evt.target);
                    if (oEvtEl.is(self._options.notselector) || oEvtEl.parents(self._options.notselector).size() > 0) {
                        return;
                    }
                }
                self._startCoords = undefined;
                self.dragStart = false;
                self._initTouch(evt);
                self.hash = Math.random();
                el.data({"simpleSelectPressed" : self.hash});
                if (
                    (!self._isTouch(evt) && evt.which != 1 )
                    || 
                    (typeof(self._options.checkStart) == 'function' && !self._options.checkStart(el, evt))
                ) {
                    return;
                }
                //evt.type == 'touchstart' && 
                if ((self._isTouch(evt) || self._options.longClick)
                    && self._options.touchhold != undefined && self._options.touchhold > 0
                ) {
                    self._initTouchHold(evt);
                    return self._cancelEvent(evt);
                }
                if (self._options.notselector != undefined) {
                    var oEvtEl = jQuery(evt.target);
                    if (oEvtEl.is(self._options.notselector) || oEvtEl.parents(self._options.notselector).size() > 0) {
                        return self._cancelEvent(evt);
                    }
                }

                self.dragStart = true;
                self._dragging = false;
//                 var oOriginal = jQuery(evt.target);
//                    oOriginal = oOriginal.is(self._options.selector) ? oOriginal : oOriginal.parents(self._options.selector);
//
//                    var oCopy = oOriginal.clone();
//                    console.log(oCopy);
//                    oOriginal.after(oCopy);
//                    //oCopy.insertAfter(oOriginal);
//                    oOriginal.detach();
                self._initEvents();
                if (typeof(self._options.start) == 'function') {
                    if (!self._options.start(el, evt)) {
                        return self._cancelEvent(evt);
                    }
                };
            });
        }
        
        self._initEvents = function() {
           
//            console.log('init events', el, self._options.moveSelector);
            el.off(
                    self._eventNames.end + ' ' 
                    + self._eventNames.leave + ' ' 
                    + self._eventNames.cancel + ' ' 
                    + self._eventNames.move
            );
//            el.off('touchmove.CA_ms', self._options.moveSelector, self._doMoveHold);
            el.one(self._eventNames.end, self._options.moveSelector, self._doUp);
            el.on(self._eventNames.move, self._options.moveSelector, self._doMove);
            el.one(self._eventNames.leave + ' ' + self._eventNames.cancel , self._doCancel);
//            el.on('touchmove.CA_ms_test', function(evt){
//                localCA.log('other moving');
//            });
        }
        self._unInitEvents = function() {
//            el.off('mousemove.CA_ms touchmove.CA_ms mouseleave.CA_ms touchcancel.CA_ms '
//                + ' mouseup.CA_ms touchend.CA_ms touchmove.CA_ms');
            el.off(self._eventNames.move + ' ' + self._eventNames.end, self._options.moveSelector);
            el.off(self._eventNames.leave + ' ' + self._eventNames.cancel);
//            el.off('mousemove.CA_ms touchmove.CA_ms', self._options.moveSelector, self._doMove);
//            el.off('mouseleave touchcancel', self._doCancel);
//            el.off('mouseup touchend', self._options.moveSelector, self._doUp);
//            el.off('touchmove', self._options.moveSelector, self._doMoveHold);
        }
        
        self._doUp = function(evt) {
            
            self._initTouch(evt);
//            localCA.log('do up '
//                    + evt.type 
//                    + ' / ' + self._options.moveSelector
//                    + ' / xy : ' + evt.clientX + ' / ' + evt.clientY);
            self._unInitEvents();
            el.data('simpleSelectPressed', null);
            var bIfReturnFalse = false;
            if (typeof(self._options.stop) == 'function') {
                bIfReturnFalse = bIfReturnFalse || !self._options.stop(el, evt); 
            };
            if (self._options.clearStop != undefined && self._options.clearStop 
                && (self._dragging || bIfReturnFalse)
            ) {
                self._doCancel(evt);
                return self._cancelEvent(evt);
            }
        }
        
        
        self._doMove = function(evt) {
//            localCA.log('do little move ' );
            self._initTouch(evt);
            self._dragging = true;
            var bGo = typeof(self._options.check) == 'function'
                ? self._options.check(el, evt)
                : true;
            //self._dragging = self._dragging || bGo;
            if (bGo && typeof(self._options.move) == 'function') {
                if (!self._options.move(el, evt)) {
                }
                else {
                }
            };
        }
        
        self._doMoveHold = function(evt, sMode) {
            self._initTouch(evt);
//            localCA.log('do move hold');
            if (!self.dragStart && self._options.touchradius != undefined && self._timer != undefined) {
                self._curCoords = {x : evt.clientX, y : evt.clientY};
                if (self._startCoords != undefined) {
                    var aDelta = {x : evt.clientX - self._startCoords.x , y :  evt.clientY - self._startCoords.y};
                    if (self._options.scroll != undefined && typeof(self._options.scroll) == 'function' 
                        && (
                            Math.abs(aDelta.x) > self._options.touchradius
                            ||
                            Math.abs(aDelta.y) > self._options.touchradius
                        )
                    ) {
                        self._options.scroll(el, evt, aDelta);
                    }
                }
                
            }
            if (sMode != undefined && sMode == 'init') {
                self._startCoords = {x : evt.clientX, y : evt.clientY};
                if (self._options.scroll != undefined && typeof(self._options.scroll) == 'function') {
                    self._options.scroll(el, evt, self._startCoords, "init");
                }
            }
        }
        
        self._doCancel = function(evt, bNoEvent){
            delete self.touchTime ;
            self._initTouch(evt);
            self._unInitEvents();
            el.data('simpleSelectPressed', null);
            if ((bNoEvent == undefined || !bNoEvent) 
                && typeof(self._options.cancel) == 'function'
            ) {
                if (!self._options.cancel(el, evt)) {
                    return self._cancelEvent(evt);
                }
            };
                
        }
        
        self._doTimingUp = function(evt) {
            var bActiveTimer = self.touchTime > 0 && self.touchTime + self._options.touchhold >= Date.getTimeStamp();
//            console.log('== ' + bActiveTimer + ' / ' + self.touchTime + ' - ' + self._options.touchhold + ' / ' + Date.getTimeStamp());
            self.touchTime = 0;
            localCA.log('do timing up');
            if (typeof(self._timer) != 'undefined') {
                clearInterval(self._timer);
                self._timer = undefined;
                if (bActiveTimer) {
                    if (self._isTouch(evt) && self._options.swipe != undefined) { //.type == 'touchend'

                        self._initTouch(evt);
                        var aDelta = {x : evt.clientX - self._startCoords.x , y :  evt.clientY - self._startCoords.y};
                        if (
                            (self._options.swipeDelta.x > 0 && Math.abs(aDelta.x) > self._options.swipeDelta.x )
                            || 
                            (self._options.swipeDelta.y > 0 && Math.abs(aDelta.y) > self._options.swipeDelta.y)
                        ) {
                            return self._doSwipe(evt, aDelta);
                        }
                    } else {
                        if (self._options.notselector != undefined) {
                            var oEvtEl = jQuery(evt.target);
                            if (oEvtEl.is(self._options.notselector) || oEvtEl.parents(self._options.notselector).size() > 0) {
                                return self._cancelEvent(evt);
                            }
                        } 
                    }
                }
                self._curCoords = undefined;
                self._startCoords = undefined;
            } 
        }
        
        self._cancelEvent = function(evt) {
            evt.cancelBubble = true;
            evt.stopPropagation();
            evt.preventDefault();
            return false;
        }
        
        self._doSwipe = function(evt, aDelta) {
            self._options.swipe(el, evt, aDelta);
            
            self._doCancel(evt, true);
            self._curCoords = undefined;
            self._startCoords = undefined;
            //return true;
            return self._cancelEvent(evt);
        }
        
        self._initTouchHold = function(evt) {
//            console.log('--' + self._options.touchhold);
            self.touchTime = Date.getTimeStamp();
            self.dragStart = false;
            if (self._timer != undefined) {
                clearTimeout(self._timer);
            }
            el.one(
                self._eventNames.end + ' ' + self._eventNames.leave + ' ' + self._eventNames.cancel, 
                self._options.moveSelector, 
                self._doTimingUp
            );
            self._timer = setTimeout(function(){
//                self._timer = null;
                if (self._options.touchradius != undefined && self._curCoords != undefined 
                        && (
                            Math.abs(self._curCoords.x - evt.clientX) > self._options.touchradius
                            ||
                            Math.abs(self._curCoords.y - evt.clientY) > self._options.touchradius
                        )
                ){
//                    if (self._options.swipe != undefined) {
//                        self._goSwipe(evt);
//                    }
                    return false;
                }
                if (self.touchTime != undefined && self.touchTime > 0 && self.touchTime + self._options.touchhold <= Date.getTimeStamp()) {
                    if (self._options.notselector != undefined) {
                        var oEvtEl = jQuery(evt.target);
                        if (oEvtEl.is(self._options.notselector) || oEvtEl.parents(self._options.notselector).size() > 0) {
                            return self._cancelEvent(evt);
                        }
                    }                    
                    self.dragStart = true;
                    self._initEvents();
                    //if (self._options.copy != undefined && self._options.copy) {
                    
                    
                    //}
                    if (typeof(self._options.start) == 'function') {
                        self._options.start(el, evt);
                    }
                }
            }, self._options.touchhold);
            
            if (self._options.touchradius != undefined && self._options.touchradius > 0) {
                self._doMoveHold(evt, 'init');
                el.on(self._eventNames.move, self._options.moveSelector, self._doMoveHold);
            }
            
            
        }
        
        self._initTouch = function(evt) {
            if (evt.originalEvent == undefined || 
                    (
                        evt.originalEvent.changedTouches == undefined
                        && 
                        ((!window.navigator.msPointerEnabled && !window.navigator.pointerEnabled) 
                            || (window.navigator.msMaxTouchPoints === 0 || window.navigator.maxTouchPoints === 0)
                            || evt.originalEvent.pointerId == undefined
                        )
                    )
            ) {
                if (evt.clientX == undefined && evt.originalEvent.clientX !== undefined) {
                    evt.clientX = evt.originalEvent.clientX;
                    evt.clientY = evt.originalEvent.clientY;
                }
                return;
            }
//            console.log('evt pos ' + evt.originalEvent.clientX 
//                    + ' / ' + evt.originalEvent.clientY 
//                    + ' / ' + evt.target.tagName
//                    + ' / ' + window.navigator.maxTouchPoints
//            );
            var touch, 
                oOriginalEvt = evt.originalEvent;;
            if (window.navigator.msPointerEnabled || window.navigator.pointerEnabled) {
                touch = {
                    screenX : parseInt(oOriginalEvt.screenX),
                    screenY : parseInt(oOriginalEvt.screenY),
                    clientX : parseInt(oOriginalEvt.clientX),
                    clientY : parseInt(oOriginalEvt.clientY),
                    type    : evt.type
                }
            } else {
                touch = evt.originalEvent.changedTouches[0];
            }
            evt.view = window;
            evt.detail = 1;
            evt.screenX = touch.sceenX;
            evt.screenY = touch.screenY;
            evt.clientX = touch.clientX;
            evt.clientY = touch.clientY;
            evt.target = document.elementFromPoint(evt.clientX, evt.clientY)
            //localCA.log(evt);
//            console.log(evt.clientX + ' / ' + evt.clientY);
//      true,             // bubbles                    
//      true,             // cancelable                 
//      window,           // view                       
//      1,                // detail                     
//      touch.screenX,    // screenX                    
//      touch.screenY,    // screenY                    
//      touch.clientX,    // clientX                    
//      touch.clientY,    // clientY                    
//      false,            // ctrlKey                    
//      false,            // altKey                     
//      false,            // shiftKey                   
//      false,            // metaKey                    
//      0,                // button                     
//      null              // relatedTarget     
        }
        
        self._isTouch = function(evt){ 
            if (evt.type.indexOf('touch') >= 0) {
                return true;
            }
            if (evt.type.toLowerCase().indexOf('pointer') >= 0
                && window.navigator.msPointerEnabled && evt.originalEvent.pointerType  != 'mouse' 
                && evt.originalEvent.pointerType != 4
            ) {
                return true;
            }
            return false;
        }
        
        self._init(options);
    }

    // convert to jquery plugin        
    $.fn.simpleSelect = function(options) {
        return this.each(function() {
            return new simpleSelect(jQuery(this), options);
        });
    }
}(jQuery));


