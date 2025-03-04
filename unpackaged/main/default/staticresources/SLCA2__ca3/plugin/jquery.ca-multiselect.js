/*! Copyright (c) 2012 SL_CA / den (den@bigmir.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 */

/**
 * multiselect 2  panels
 */
(function($) {
    var aEventNames = localCA != undefined ? localCA.eventNames : {
        "click"         : "click",
        "down"          : "mousedown",
        "up"            : "mouseup",
        "dblclick"      : "dblclick",
        "move"          : 'mousemove',
        "out"           : "mouseleave",
        "leave"         : "mouseleave",
        "in"            : "mouseenter"
    };
    var self = {
        options : {},
        dropElement : null,
        dropBarHeight : null,
        dropHeight  : null,
        dropOffset  : null,
        ie          : (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) <= 8)
    }
    self._init = function(params) {
        return this.each(function(){
            var options = jQuery.extend({}, params);
            options.el = jQuery(this);
            self.el = jQuery(this);
            options.l = self.el.find(options.left);
            options.r = self.el.find(options.right);
            options.srch = options.searchField != undefined && self.el.find(options.searchField).size() > 0
                ? self.el.find(options.searchField)
                : null;
            var sDropSelector = '';
            if (options.left != undefined) {
                sDropSelector += options.left;
            }
            if (options.right != undefined) {
                sDropSelector += (sDropSelector != '' ? ', ' : '') + options.right;
            }
            options.dropSelector = sDropSelector;
            self.el.data('options', options);
            self.el.data('multiApi', self._multiApi(options.el));
            self._initEvents(options);
            //options.el.find(sDropSelector).append('<div class=_multi_up></div><div class=_multi_down></div>');
        });
    }
    
    self._initEvents = function(options){
        var domEl = options.el,
            domL = options.l,
            domR = options.r,
            nTimer = null;
            
        domEl
            .on(aEventNames.click, options.sub, function(evt){
                var el = jQuery(this);
                if (evt.ctrlKey) {
                    el.toggleClass('sel');
                } else if(evt.shiftKey) {
                    var oFirst = el.siblings('.sel').eq(0);
                    if (oFirst.size() > 0) {
                        var aAll = el.parent().children(),
                            nStart = aAll.index(el),
                            nStop = aAll.index(oFirst);
                        for (var nI = Math.min(nStart, nStop); nI <= Math.max(nStart, nStop); nI++) {
                            if ((self.options.orderable != undefined && aAll.eq(nI).is(self.options.orderable))
                                || !aAll.eq(nI).is(':visible')
                            ) {
                                continue;
                            }
                            aAll.eq(nI).addClass('sel');
                        }
                    }
                } else {
                    el.addClass('sel').siblings('.sel').removeClass('sel');
                }
            })
            .on(aEventNames.click, options.buttons, function(evt){
                self._runAction(jQuery(this).data('mode'), evt, options);
            })
            .on(aEventNames.dblclick, options.sub, function(evt){
                var el = jQuery(this),
                    dSource = el.parent(),
                    dDestination = dSource.get(0) == domL.get(0) ? domR : domL;

                el.remove().appendTo(dDestination).removeClass('sel');
                dDestination.children('._text').removeClass('_show');
            })
            .on(
                aEventNames.down + '.CA_multiselect', 
                options.sub + (options.orderable != undefined ? ", " + options.orderable: ''), 
                function(evt) { // init drag
                    self.options = options;
                    self._initTouch(evt);
                    if (self.ie) {
                        if (domL.children('._ie8').size() < 1) {
                            domL.append('<div class=_ie8></div>');
                        }
                        if (domR.children('._ie8').size() < 1) {
                            domR.append('<div class=_ie8></div>');
                        }
                    }
                    if (evt.type == 'touchstart' && options.touchhold != undefined && options.touchhold > 0) {
                        self._initTouchHold(evt, options);
                        return self._cancelEvent(evt);
                    }
                    return self._dragInit(evt, options);
                }
            )
            .on('keydown', '._search_popup', function(evt){
                var oInput = jQuery(evt.target);
                if (nTimer != null) {
                    clearTimeout(nTimer);
                    nTimer = null;
                }
                
                nTimer = setTimeout(function(){
                    if (oInput.val().length >= 2 && typeof(options.search) == 'function') {
                        options.search(oInput.val());
                    }
                    nTimer = null;
                }, 200);
            });
        
        if (options.srch != null) {
            options.srch.on('input', function(evt){
                self._refreshSearchField(options.l, jQuery(evt.target).val());
            });
        }
            
    }
    
    
    self._dragInit = function(evt){
        self._initTouch(evt);
        var dragElement = jQuery(evt.target), 
            domEl = jQuery(evt.delegateTarget);
        self._aBasePos = {x : evt.clientX, y : evt.clientY};
        domEl
            .on(aEventNames.move + '.CA_multiselect.CA_drag', function(evtMove) {
                self._initTouch(evtMove);
                if (Math.abs(self._aBasePos.x - evtMove.clientX) > 10 || Math.abs(self._aBasePos.y - evtMove.clientY) > 10) {
                    self._initDragEvents(evt);
                }
                return self._cancelEvent(evt);
            })
            .one(aEventNames.up + '.CA_multiselect.CA_drag', function(evtUp){
                self._initTouch(evtUp, true);
                domEl.off('.CA_drag');
            }); 
        return self._cancelEvent(evt);
    }
    
    
    self._initDragEvents = function(evt) {
        var sBar = '<div class=dragbar>';
        self._domEl = jQuery(evt.delegateTarget);
        self._domElPos = self._domEl.offset();
        self._dragEl = jQuery(evt.target);
        var aAll = self._dragEl.add(self._dragEl.siblings('.sel'));
            
        self._dragEl.addClass('sel');
        aAll.each(function(){
            var el = jQuery(this);
            sBar += '<div data-calendar="' + el.data('calendar') + '">' + el.text().htmlspecialchars() + '</div>';
        }).hide();
        sBar += '</div>';
        self._moveEl = jQuery(sBar).appendTo(self._domEl);
        
        self._moveEl
            .css('position', 'absolute')
            .css({top : evt.clientY - self._domElPos.top + 10, left : evt.clientX - self._domElPos.left + 10});
        self._bDrag = true;
        self._domEl
            .off('.CA_drag')
            .addClass('_dragable')
            .on(aEventNames.move + '.CA_multiselect.CA_drag', function(evt) {
                
                self._initTouch(evt);
//                console.log('all area ' + Date.getTimeStamp());
                self._moveObject(evt);
            })
            .one(aEventNames.up + '.CA_multiselect.CA_drag', function(evt){
                self._initTouch(evt, true);
                self._dragCancel(evt);
            })
            .on(aEventNames.out + '.CA_multiselect.CA_drag', function(evt){
                self._initTouch(evt);
                self._dragCancel(evt);
            });
//        if (self._domEl.data('options')) {
//            var sDropSelector = self._domEl.data('options').dropSelector;
        if (self.options.dropSelector) {
            
            var sDropSelector = self.options.dropSelector;
            
            if (sDropSelector != '')  {
                self._dropIn(evt, sDropSelector);
                //self._dragEl.parents(sDropSelector);
                //.addClass('draghover');
                self._domEl
                    .on(aEventNames.up + '.CA_multiselect.CA_drag', sDropSelector, function(evt){
                        self._initTouch(evt, true);
                        self._dropEnd(evt, sDropSelector);
                        self._dropOut(evt, sDropSelector);
                    })
                    .on(aEventNames.move + '.CA_multiselect.CA_drag', sDropSelector, function(evt){
//                        console.log('drop area ' + Date.getTimeStamp());
                        self._initTouch(evt);
                        self._dropMove(evt, sDropSelector);
//                        return self._cancelEvent(evt);
                    })
                    .on(aEventNames.leave + '.CA_multiselect.CA_drag', sDropSelector, function(evt){
                        self._initTouch(evt, true);
                        self._dropOut(evt, sDropSelector);
                    })
                    .on(aEventNames['in'] + '.CA_multiselect.CA_drag', sDropSelector, function(evt){
                        self._initTouch(evt, true);
                        self._dropIn(evt, sDropSelector);
                    }); 
            }
            
        }
    }
    
    self._moveObject = function(evt) {
        self._moveEl.css({top : evt.clientY - self._domElPos.top + 10, left : evt.clientX - self._domElPos.left + 10});
        
    }
    
    self._resetDragEvents = function(evt) {
        
        self._domEl
            .off('.CA_drag')
            .off('.CA_moveHold')
            .removeClass('_dragable')
            .find('.drag-inserted-before, .drag-inserted-after')
                .removeClass('drag-inserted-before drag-inserted-after');
        self._bDrag = false;
        self._moveEl.remove();
        if (self._scrollTimer != undefined) {
            clearTimeout(self._scrollTimer);
        }
    }
    
    
    self._dragCancel = function(evt) {
        self._dragEl.add(self._dragEl.siblings('.sel')).show().removeClass('sel');
        self._resetDragEvents(evt);
        if (self.ie) {
            self._checkIEBarPos();
        }
    }
    
    
    self._dragEnd = function(evt, dragElement) {
        dragElement.add(dragElement.siblings('.sel')).show().removeClass('sel');
        dragElement.add(dragElement.siblings('.drag-inserted-before, .drag-inserted-after'))
            .removeClass('drag-inserted-before drag-inserted-after');
        
        if (self.ie) {
            self._checkIEBarPos();
        }
    }
    
    self._checkIEBarPos = function() {
        if (self.options.l.size() > 0){
            self.options.l.append(self.options.l.children('._ie8'));
        }
        if (self.options.r.size() > 0){
            self.options.r.append(self.options.r.children('._ie8'));
        }
    }
    
    self._dropMove = function(evt, sSelector) {
        if (evt.type == 'touchmove') {
//            console.time('movestart');
            var dropTempElement = jQuery(evt.target);
            if (!dropTempElement.is(sSelector)) {
                dropTempElement = dropTempElement.parents(sSelector);
            }
            if (dropTempElement.size() > 0) {
                if (self.dropElement == null || dropTempElement[0] != self.dropElement[0]) {
                    self._dropIn(evt, sSelector);
                }
            } else if (self.dropElement != null) {
                self._dropOut();
            }
//            console.timeEnd('movestart');
            //console.log(dropTempElement.data('list'));
        }
        //self._dragEl
        var dropElement = self.dropElement;
        if (dropElement == null || dropElement.size() < 1) {
            return;
        }

        if (self.options.touchscrollarea !== undefined) {
            var nArea = self.options.touchscrollarea;
            if (evt.type == 'touchmove') {
                nArea *= 2;
            }
            var nScroll = 0;
            
            if (evt.clientY - self.dropOffset.top < nArea) {
                nScroll = -self.dropBarHeight;
                
            } else if (self.dropOffset.top  + self.dropHeight - evt.clientY < nArea) {
                nScroll = self.dropBarHeight;
            } 
            
//            console.log('scroll area ' + nArea 
//                + ' / drop offset '
//                + self.dropOffset.top
//                + '/ dropHeight'
//                + self.dropHeight
//                + ' evt clientY ' 
//                + evt.clientY
//                + ' nScroll ' + nScroll
//                + ' scrollTimer ' + self._scrollTimer
//            );
//            console.log(nScroll, nArea);
            if (nScroll == 0 && self._scrollTimer != undefined) {
                clearTimeout(self._scrollTimer);
                self._scrollTimer = undefined;
            }
            if (nScroll != 0 && self._scrollTimer == undefined) {
                var fScroll = function(){
                    dropElement.scrollTop(dropElement.scrollTop() + nScroll);
                    if (self._scrollTimer != undefined) {
                        self._scrollTimer = setTimeout(fScroll, 100)
                    }
                };
                self._scrollTimer = setTimeout(fScroll, 100)
//                self._scrollTimer = setInterval(, 100);
            }
        }
        var nTop = self.dropBarHeight > 0 
                ? parseInt((evt.clientY - self.dropOffset.top + dropElement.scrollTop()) / self.dropBarHeight) 
                : -1,
            nBeforeTop = dropElement.data('drag-inserted-before') != undefined ? dropElement.data('drag-inserted-before') : -1;
//        console.log('used ', self.dropBarHeight, nTop);
        if (nTop == -1) {
            return;
        }
        if (nBeforeTop >= 0 && nBeforeTop != nTop) {
            dropElement.children(':visible').eq(nBeforeTop).removeClass('drag-inserted-before');
            dropElement.children('.drag-inserted-after').removeClass('drag-inserted-after');
        }
        if (nBeforeTop != nTop) {
            dropElement.data('drag-inserted-before', nTop);
            var oHover = dropElement.children(':visible').eq(nTop).addClass('drag-inserted-before');
            if (oHover.size() < 1) {
                dropElement.children(':visible:last').addClass('drag-inserted-after')
            }
                
        }
        
        
        
    }
    
    self._dropOut = function(evt, sSelector) {
        
//        var dropElement = jQuery(evt.target);
//        if (!dropElement.is(sSelector)) {
//            dropElement = dropElement.parents(sSelector);
//        }
        if (self._scrollTimer != undefined) {
            clearTimeout(self._scrollTimer);
            self._scrollTimer = undefined;
        }
        if (self.dropElement == null) {
            return;
        }
        if (self.options.orderable != undefined && self._dragEl.is(self.options.orderable)) {
            self.dropElement = null;
            return self._dragCancel(evt);
        }
        self.dropElement
//            .removeClass('draghover')
//            .data('drag-inserted-before', -1)
            .children('.drag-inserted-before, .drag-inserted-after')
                .removeClass('drag-inserted-before drag-inserted-after');
        
        self.dropElement = null;
    }
    
    self._dropIn = function(evt, sSelector){
        if (self._scrollTimer != undefined) {
            clearTimeout(self._scrollTimer);
            self._scrollTimer = undefined;
        }
        var dropElement = jQuery(evt.target);
        if (!dropElement.is(sSelector)) {
            dropElement = dropElement.parents(sSelector);
        }
        if (self.dropElement != null) {
            self._dropOut(evt, sSelector);
        }
        self.dropElement = dropElement;
        self.dropOffset = dropElement.offset();
        self.dropHeight = dropElement.height();
        
        var aChildren = dropElement.children(':visible');
        self.dropBarHeight = aChildren.size() > 1 
            ? parseFloat(aChildren.eq(1).position().top + self.dropElement.scrollTop() / 1)
            : (aChildren.size() > 0 ? aChildren.eq(0).outerHeight(true) : 0);
        //jQuery(evt.target).addClass('draghover');
    }
    
    self._dropEnd = function(evt, sSelector) {
        if (self.dropElement == null) {
            return false;
        }
        var dropElement = self.dropElement;
//        var dropElement = jQuery(evt.target);
//        if (!dropElement.is(sSelector)) {
//            dropElement = dropElement.parents(sSelector);
//        }
////        dropElement.removeClass('draghover');
//        if (dropElement.size() < 1) {
//            return false;
//        }
        var nTop = dropElement.data('drag-inserted-before') != undefined 
            ? dropElement.data('drag-inserted-before') 
            : -1;
        evt.cancelBubble = true;
        evt.stopPropagation();
        var aAll = self._dragEl.add(self._dragEl.siblings('.sel'));
        
        var domBefore = nTop >=0 ? dropElement.children(':visible').not('.sel').eq(nTop) : null;
        if (domBefore != null && domBefore.size() > 0 ) {
            aAll.remove().insertBefore(domBefore)
        } else {
            aAll.remove().appendTo(dropElement)
        }
        aAll.show().removeClass('sel');
        self._resetDragEvents(evt);
        if (self.ie) {
            self._checkIEBarPos();
        }
        dropElement.children('._text').removeClass('_show');
        return false;
    }
    
   
                
    
    self._checkTouchCoords = function(evt, options) {
        var aDOM = [options.l, options.r];
        if (evt.type == 'touchmove') {
            
        }
        
        for (var nI = 0; nI < aDOM.length; nI++) {
            var aCoords = aDOM[nI].offset();
            aCoords.right = aCoords.left + aDOM[nI].outerWidth();
            aCoords.bottom = aCoords.top + aDOM[nI].outerHeight();
            if (
                evt.clientY >= aCoords.top && evt.clientY <= aCoords.bottom
                && evt.clientX >= aCoords.left && evt.clientX <= aCoords.right
            ) {
                self._dropMove(evt, options);
            }
        }
    }
    
    self._runAction = function(sAction, evt, options) {
        if (self['_' + sAction + 'Action'] != undefined) {
            self['_' + sAction + 'Action'](evt, options);
        }
    }
    
    self._leftAction = function(evt, options) {
        var aOpts = options.r.children(options.sub).filter('.sel');
        if (aOpts.size() < 1) {
            return;
        }
        aOpts.remove()
            .appendTo(options.l).removeClass('sel');    
        if (options.textLeft) {
            options.l.children('._text').removeClass('_show');
        }
        if (options.textRight && options.textRight != null && options.textRight != '') {
            options.r.children('._text').removeClass('_show');
        }
        if (self.ie) {
            self._checkIEBarPos();
        }
    }
    
    self._rightAction = function(evt, options) {
        options.l.children(options.sub).filter('.sel').remove()
            .appendTo(options.r).removeClass('sel');
        if (options.textRight) {
            options.r.children('._text').removeClass('_show');
        }
        if (self.ie) {
            self._checkIEBarPos();
        }
    }
    
    self._sort_leftAction = function(evt, options) {
        self._sortPanel(options.l, options);
        if (self.ie) {
            self._checkIEBarPos();
        }
    }
    
    self._sort_rightAction = function(evt, options) {
        self._sortPanel(options.r, options);
        if (self.ie) {
            self._checkIEBarPos();
        }
    }
    
    self._openAction = function(evt, options) {
        options.l.find('._small').toggleClass('_off');
    }
    
    self._searchAction = function(evt, options) {
        if (typeof(options.search) == 'function') {
            self._showSearchPopup(evt, options);
            //options.search(evt);
        }
        //options.l.find('._small').toggleClass('_off');
    }
    
    self._sortPanel = function(oPanel, options) {
        var aArr = [], 
            aList = oPanel.children(options.sub),
            sHTML = '';
        aList.each(function(idx, el) {
            aArr.push({"name" : jQuery(el).text(), "idx" : idx, 'low' : jQuery(el).text().toLowerCase()});
        });
        aArr.quickSort('low');
//        aArr.sort(function(a, b){
//            var bResult = a.low < b.low 
//                ? -1
//                : (a.low > b.low 
//                    ? 1 
//                    : 0
//                );
//            return bResult;
//        });
        for (var nI = 0; nI < aArr.length; nI++) {
            sHTML += aList.eq(aArr[nI].idx)[0].outerHTML;
        }
        aList.remove();
        oPanel.append(sHTML);
    }
    
    self._showSearchPopup = function(evt, options) {
        var oButton = jQuery(evt.target),
            oSearchPopup = oButton.children('._search_popup');
        if (oSearchPopup.size() < 1) {
            oSearchPopup = jQuery('<input type=text class="_search_popup" placeholder="Start typing for search"/>').appendTo(oButton);
        }
        oSearchPopup.toggleClass('_show').focus();
    }
    
    self._initTouch = function(evt) {
        if (evt.originalEvent == undefined || 
                (
                    evt.originalEvent.changedTouches == undefined
                    && 
                    ((!window.navigator.msPointerEnabled && !window.navigator.pointerEnabled) || evt.originalEvent.pointerId == undefined)
                )
            ) {
            if (evt.clientX == undefined && evt.originalEvent.clientX !== undefined) {
                evt.clientX = evt.originalEvent.clientX;
                evt.clientY = evt.originalEvent.clientY;
            }
            return;
        }
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
            touch = oOriginalEvt.changedTouches[0];
        }
        evt.view = window;
        evt.detail = 1;
        evt.screenX = touch.sceenX;
        evt.screenY = touch.screenY;
        evt.clientX = touch.clientX;
        evt.clientY = touch.clientY;
        evt.target = document.elementFromPoint(evt.clientX, evt.clientY)
        }
        
    
    
    self._initTouchHold = function(evt, options) {
//            console.log('--' + self._options.touchhold);
        var dropElement = jQuery(evt.target), 
            oBar = jQuery(evt.target);
        if (!dropElement.is(options.el.data('options').dropSelector)) {
            dropElement = dropElement.parents(options.el.data('options').dropSelector);
        }
//        alert(oBar.html());
        if (!oBar.is(options.sub)) {
            oBar = oBar.parents(options.sub);
//                    oBar = oBar.parents('[data-calendar]');
                    //oBar = oBar.parents(options.sub);
        }
        
        self.touchTime = Date.getTimeStamp();
        self._bDrag = false;
        if (self._timer != undefined) {
            clearTimeout(self._timer);
        }
        
//        if (dropElement.children().size() < 50) {
//            var sHTML = dropElement.html();
//            dropElement.append(jQuery(sHTML + sHTML + sHTML));
//        }
        var el = options.el;
        el.one(
            'mouseup.CA_moveHold touchend.CA_moveHold mouseleave.CA_moveHold touchcancel.CA_moveHold', 
            function(evt) {
                return self._doTimingUp(evt, options)
            }
        );
            
        self._timer = setTimeout(function(){
            if (options.touchradius != undefined && self._curCoords != undefined 
                    && (
                        Math.abs(self._curCoords.x - evt.clientX) > options.touchradius
                        ||
                        Math.abs(self._curCoords.y - evt.clientY) > options.touchradius
                    )
            ){
                return false;
            }
            if (self.touchTime != undefined && self.touchTime > 0 && self.touchTime + options.touchhold <= Date.getTimeStamp()) {
                self._bDrag = true;
//                var oBar = jQuery(evt.target);
//                if (oBar.data('calendar') == undefined) {
////                    oBar = oBar.parents('[data-calendar]');
//                    //oBar = oBar.parents(options.sub);
//                }
//                alert(oBar.html());
                oBar.addClass('sel').siblings('.sel').removeClass('sel');
                el.off('.CA_moveHold');
                self._dragInit(evt, options);
            }
        }, options.touchhold);

        if (options.touchradius != undefined && options.touchradius > 0) {
            self._doTouchScroll(evt, options, 'init');
            el.on('touchmove.CA_moveHold', options.el.data('options').dropSelector, function(evt) {
                self._doTouchScroll(evt, options)
            });
        }
    }
    
    
    self._doTouchScroll = function(evt, options, sMode) {
        self._initTouch(evt);
        if (sMode != undefined && sMode == 'init') {
            self._curCoords = {x : evt.clientX, y : evt.clientY};
            return;
        }
        var dropElement = jQuery(evt.target);
        if (!dropElement.is(options.el.data('options').dropSelector)) {
            dropElement = dropElement.parents(options.el.data('options').dropSelector);
        }
        if (!self._bDrag && options.touchradius != undefined && self._timer != undefined) {
            var aCurDelta = {x : evt.clientX - self._curCoords.x , y :  evt.clientY - self._curCoords.y};
            self._curCoords = {x : evt.clientX, y : evt.clientY};
            if (aCurDelta.y != 0) {
                dropElement.scrollTop(dropElement.scrollTop() - aCurDelta.y);
            }
        }
    }
    
    self._doTimingUp = function(evt, options) {
        self.touchTime = 0;
        if (typeof(self._timer) != 'undefined') {
            clearInterval(self._timer);
            self._timer = undefined;
            self._curCoords = undefined;
        } 
        return self._cancelEvent(evt);
    }
    
    self._cancelEvent = function(evt) {
        evt.cancelBubble = true;
        evt.stopPropagation();
        return false;
    }
    
    self._api = function(oEl){
        var aResult = {el : oEl};
        aResult.reInit = function(aParams) {
            var aOptions = oEl.data('options');
            jQuery.each(aParams, function(sKey, mParam){
                aOptions[sKey] = mParam;
            });
            oEl.find('._search_popup').removeClass('_show').val('');
            if (aOptions['search'] === false) {
                oEl.removeClass('_with_search');
            } else if (typeof(aOptions['search']) == 'function'){
                oEl.addClass('_with_search');
            }
            if (aOptions['textLeft'] != undefined) {
                self._showText('left', aOptions['textLeft'], aOptions);
            } else {
                self._showText('left', '', aOptions);
            }
            if (aOptions['textRight'] != undefined && aOptions['textRight'] != '') {
                self._showText('right', aOptions['textRight'], aOptions);
            } else {
                self._showText('right', '', aOptions);
            }
            
        }
        return aResult;
    }
    
    self._showText = function(sPos, sText, aOptions) {
        var oBlock = aOptions[sPos === 'left' ? 'l' : 'r'],
            oTextBlock = oBlock.children('._text');
        if (sText == null || sText == '' || oBlock.children(aOptions.sub).size() > 0) {
            oTextBlock.removeClass('_show');
            return;
        }
        
        if (oTextBlock.size() < 1) {
            oTextBlock = jQuery('<div class="_text"/>').appendTo(oBlock);
        }
        oTextBlock.text(sText).addClass('_show');
    }
    
    self._multiApi = function(oDomEl){
        return new self._api(oDomEl);
//        jQuery.extend(self._api, {el : oDomEl});
    }
    
    self._refreshSearchField = function(oBlock, sText){
        sText = sText.trim().toLowerCase();
        oBlock.children('._off_search').removeClass('_off_search');
        if (sText == '') {
            return;
        }
        oBlock.children().each(function(nIdx, oEl){
            oEl = jQuery(oEl);
            if (oEl.text().toLowerCase().indexOf(sText) < 0) {
                oEl.addClass('_off_search');
            }
        });
    }
    
    $.fn.CAMultiSelect = function(){
        return self._init.apply( this, arguments );
    }
})(jQuery);