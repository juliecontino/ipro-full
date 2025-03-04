/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function($) {
    
    var self = {
        _dom : {},
        _canvasOffset : null,
        _el : null,
        _ie : false,
        _small : false,
        _tpl : null
    };

    self._init = function(el, options){
        self._options = options;
        self._el = el;
        self._ie = jQuery.browser.msie && parseInt(jQuery.browser.version, 10) <= 8;
//        self._ie9 = jQuery.browser.msie && parseInt(jQuery.browser.version, 10) <= 9;
        self._small = jQuery(window).height() <= 800 || jQuery.browser.msie;
        self._dom.div = jQuery('div.CA_color_select');
        if (self._dom.div.size() < 1) {
            self._dom.div = jQuery('<div class="CA_color_select" tabindex="0"></div>').appendTo('.JQ_CA');
            self._buildColorPanel();
            self._initColorEvents();
        }
        if (self._options.show == true) {
            self._go();
        } else {
            self._el.on('click', function(){
                self._go();
            });
        }
    } 

    self._go = function() {
        if (self._options.color == undefined && self._el.css('background-color') != undefined) {
            self._options.color = self._el.css('background-color');
        }
        self._dom.div.find('.set').removeClass('set');

        
        self._position();
        self._initData();
        self._dom.div.find('select').toggle(self._options.tpl !== undefined);
        self._dom.div.toggle().trigger("focus");
    }

    self._cancelEvent = function(evt) {
        evt.cancelBubble = true;
        evt.stopPropagation();
        return false;
    }


    self._buildColorPanel = function() {
//        var aColors = [ '#d24848', '#d2b348', '#89d248', '#48d2a3', 
//                        '#48b0d2', '#4882d2', '#6548d2', '#cd48d2', 
//                        '#e11e35', '#d27548', '#d0d248', '#48d24b', 
//                        '#48d2c3', '#48a6d2', '#4865d2', '#8c48d2',
//                        '#d2487f', '#9e9e9e'
//        ];
        var aColors = [ '#990000', '#d95700', '#ffd940', '#90d900', 
                        '#1d736d', '#5989b3', '#d0bfff', '#f200c2', 
                        '#ff4040', '#f2ceb6', '#807d60', '#29a65b', 
                        '#00eeff', '#001f73', '#8f30bf', '#ff0066',
                        '#d97b6c', '#a66c29', '#a0a653', '#bfffd9',
                        '#006dcc', '#0000ff', '#695673', '#cc668f',
        ];        
        var sHTML = '<div class="color_select_current"><span>OK</span></div>'
            + '<input type=text value=""/>'
            + self._calendarColorTemplate()
            + '<div class="color_select_panel">';
        for (var nI = 0; nI < aColors.length; nI++) {
            sHTML += '<span data-color="' + aColors[nI] + '" style="background-color:' + aColors[nI] + '"></span>';
        }
        sHTML += '</div>'
            + '<div class="color_select_canvas">'
                + '<canvas width=125 height=100></canvas>'
            + '</div>';
        self._dom.div.html(sHTML);
    }

    self._initData = function() {
        if (typeof(self._options.color) == 'undefined') {
            self._options.color = '#fff';
        }
        self._dom.div.children('.color_select_current').css('background-color', self._options.color);
        if (self._tpl != null) {
            self._dom.div.children('.color_select_current').removeClass('evt_tpl_' + self._tpl);
        }
        if (self._options.tpl != undefined) {
            self._tpl = self._options.tpl;
            self._dom.div.children('.color_select_current').addClass('evt_tpl_' + self._options.tpl);
        }
        self._dom.div.children('input').val(self._options.color);
        if (self._options.tpl != undefined) {
            self._dom.div.children('select').val(self._options.tpl);
        }
    }

    self._position = function() {
        var aCoords = {top : 0, left : 0},
            aSize = {height : self._dom.div.height(), 'width' : self._dom.div.width()},
            aWin = {height : jQuery(window).height(), 'width' : jQuery(window).width()},
            nMinBottom = jQuery.browser.msie ? 200 : 0;
        if (self._options.el != undefined) {
            aCoords = self._options.el.offset();
        } else {
            aCoords = self._el.offset();
        }
        self._dom.div.toggleClass('_centered', self._small);
        self._canvasOffset = null;
        if (self._small) {
            return;
            
//            aCoords.top = 'auto';
//            aCoords.left = 'auto';
        } else if (aCoords.top + aSize.height > aWin.height - nMinBottom) {
//            aCoords.top = aWin.height - aSize.height - 50;
            if (nMinBottom > 0) {
                aCoords.top = 'auto';
                aCoords.bottom = 200;
            } else {
                aCoords.top -= aSize.height - 40;
            }
            
        }
        if (aCoords.left + aSize.width > aWin.width) {
            aCoords.left = aWin.width - aSize.width - 50;
        }
        self._dom.div.css(aCoords);
        
    }


    self._initColorEvents = function() {
        var domColor = self._dom.div,
            domColorShow = domColor.children('.color_select_current'),
            domInputColor = domColor.children('input'),
            domTpl = domColor.children('select'),
            domCanvas = domColor.find('.color_select_canvas > canvas'),
            oCanvas = (domCanvas.size() > 0 && domCanvas[0].getContext != undefined  ? domCanvas[0].getContext('2d') : null);

        domColor.off('mouseover click mouseout mousemove mouseleave');
        domColor
            .on('mouseover click', '.color_select_panel span', function(evt){
                _setPreviewColor(jQuery(this).data('color'), evt.type == 'click')
            }).on('mousemove click', '.color_select_canvas > canvas', function(evt){
                _setPreviewColor(_getCanvasColor(evt), evt.type == 'click')
            }).on('mouseout', '.color_select_panel span, .color_select_canvas > canvas', function(){
                domColorShow.css('background-color', domInputColor.val());
            }).on('click', '.color_select_current span', function(){
                if (typeof(self._options.success) == 'function') {
                    self._options.success(domInputColor.val(), self._options.tpl === undefined ? null : domTpl.val());
                }
                self._options.color = undefined;
                //self._dom.div.hide();
                self._dom.div.blur();
            }).on('mouseleave', function(){
                //self._dom.div.hide();
            }).on('blur focusout', function(evt){
                var oEl = jQuery(evt.relatedTarget);
                if (oEl.hasClass('CA_color_select') || oEl.parents('.CA_color_select').size() > 0) {
                    //domColor.focus();
                    //return false;
                    return self._cancelEvent(evt);
                }
                //if (evt.currentTarget)
                
                self._dom.div.hide();
            });
        domTpl.on('change', function(evt){
            if (self._tpl != null) {
                domColorShow.removeClass('evt_tpl_' + self._tpl);
            }
            self._tpl = domTpl.val();
            domColorShow.addClass('set evt_tpl_' + self._tpl);
        });
        domInputColor.on('keyup change', function(evt){
            domColorShow.css('background-color', domInputColor.val()).addClass('set');
        });

        var _setPreviewColor = function(sColor, bClick) {
            domColorShow.css('background-color', sColor);
            if (bClick) {
                domInputColor.val(sColor);
                domColorShow.addClass('set');
            }
        }

        var _getCanvasColor = function(evt) {

            if (self._canvasOffset == null) {
                self._canvasOffset = self._dom.div.find('.color_select_canvas > canvas').offset();
            }
            var canvasX = Math.floor(evt.clientX - self._canvasOffset.left),
                canvasY = Math.floor(evt.clientY - self._canvasOffset.top),
                aPixel = oCanvas.getImageData(canvasX, canvasY, 1, 1).data;
            return '#' + (aPixel[2] | (aPixel[1] << 8) | (aPixel[0] << 16)).toString(16);
        }

        var _initCanvas = function() {
            if (self._ie) {
                return;
            }
            var domImage = new Image(),
//                sSrc = domCanvas.css('background-image').substr(5);
                sSrc = domCanvas.css('background-image');
            if (sSrc == 'none' || sSrc == undefined || sSrc == null || sSrc == '') {
                sSrc = self._options.canvasUrl;
            }
            sSrc = jQuery.trim(
                sSrc.replace('url(', '').replace(')', '').replace('"', '').replace('"', '')
            );
            domImage.onload = function(){
                oCanvas.drawImage(domImage, 0, 0);
            }
            domImage.src = sSrc;
        }
        if (domCanvas.size() > 0) {
            _initCanvas();
        }
        
//        self._dom.div.on('focus', function(){
//            console.log('in');
//        });
    }
    var caColor = function(el, options) {
        self._init(el, options);
    }
    
    self._calendarColorTemplate = function(){
        var sHTML = '<select name="_tpl" class="_color_tpl_selector">'
            + '<option value="0" selected>---</option>';
        for (var nI = 1; nI <= 36; nI++) {
            sHTML += '<option value="' + nI + '" class="evt_tpl_' + nI + '">' + nI + '</option>';
        }
        sHTML += '</select>';
        return sHTML;
    }
    
    
    
    

    // convert to jquery plugin
    $.fn.caColor = function(options) {
        return this.each(function() {
            return new caColor(jQuery(this), options);
        });
    }
}(jQuery));


