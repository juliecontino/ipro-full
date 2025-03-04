/* Copyright (c) 2012, SliverLine, JQGantt, d.sorokin */


(function(){
    var self = {
        _data               : [],
        _css                : '/css/print/default.css',
        _parent             : null,
        _parentView         : null,
        _div                : null,
        _dom                : {},
        _dataBlocks         : [],
        _params             :  {
                                layout  : "landscape",
                                size    : 'letter',
                                w       : 939,  //800
                                h       : 680,  //550
                                sort    : 'calendars',
                                phrase  : ""
                            },
        _sizes              : {
                                "landscape" : {
                                    'letter' : [939, 680],
                                    'a4' : [1000, 660],
                                    'letterpoint' : [792, 612],
                                    'a4point' : [842, 595],
                                    'letter96' : [1056, 816],
                                    'a496' : [1122, 793],
                                },
                                "portrait" : {
                                    'letter' : [680, 939],
                                    'a4' : [660, 1000],
                                    'letterpoint' : [792, 612],
                                    'a4point' : [595, 842],
                                    'letter96' : [816, 1056],
                                    'a496' : [793, 1122],
                                }
                            }
    };
    
    var view = {};

/**
 * Initialization of Gantt
 *
 * @return {void}
 */
    view.init = function (div, parent){
        self._parent = parent;
        self._parent.loadCss(self._css);
        self._parentView = self._parent._getView('gantt');
        var aParams = self._parent.getLS('gantt_print_settings', null);
        if (aParams != null) {
            aParams = JSON.parse(aParams);
            jQuery.extend(self._params, aParams);
        }
    }
    

    view.show = function(aParams){
        var sHTML = self._initHTML(aParams);
        self._parent.hidePopup();
        self._parent.showPopup({
            html        : sHTML,
            onShow      : self._initEvents,
            autohide    : false,
            view        : view,
            fullScreen  : true,
            modal       : true
        });
        if (aParams != undefined) {
            jQuery.extend(self._params, aParams);
        }
        
        
        //self._prepareClasses(true);
        view.showData();
        
    }
    
    view.showData = function() {
//        console.log(params);
        var aResult = self._parentView.getBlocksData(self._params),
            aBlocks = aResult.data,
            sHTML = '', 
            nPage = 1;
        
//        for (var nD = )
        if (self._params.sort == 'calendars') {
            for (var nD = 0; nD < aBlocks[0].dates.length; nD++) {
                for (var nB = 0; nB < aBlocks.length; nB++) {
        //        for (var nD = 0; nD < aBlocks[nB].dates.length; nD++) {
                    sHTML += '<div data-block="' + nB + '" data-date="' + nD + '" class="_gantt_block">'
                        + '<div class="title">' 
                            + '<div class=_printed>Page #' + (nPage++) 
                                + '<br>'
                                + (self._params.phrase != '' ? self._params.phrase : 'Printed by CA')
                            + '</div>'
                            + aBlocks[nB].titles 
                        + '</div>'
                        + '<div class="gantt_dates">' + aBlocks[nB].dates[nD].html + '</div>'
                        + '<div class="events">' + aBlocks[nB].dates[nD].events + '</div>'
                        + '</div>';
                }
            }
        } else {
            for (var nB = 0; nB < aBlocks.length; nB++) {
                for (var nD = 0; nD < aBlocks[nB].dates.length; nD++) {
                    sHTML += '<div data-block="' + nB + '" data-date="' + nD + '" class="_gantt_block">'
                        + '<div class="title">' 
                            + '<div class=_printed>Page #' + (nPage++) 
                                + '<br>'
                                + (self._params.phrase != '' ? self._params.phrase : 'Printed by CA')
                            + '</div>'
                            + aBlocks[nB].titles 
                        + '</div>'
                        + '<div class="gantt_dates">' + aBlocks[nB].dates[nD].html + '</div>'
                        + '<div class="events">' + aBlocks[nB].dates[nD].events + '</div>'
                        + '</div>';
                }
            }
        }
        self._dom.blocks.html(sHTML).addClass('format_' + aResult.format);
        self._dom.blocks.find('.scroll_width').remove();
        
        self._dom.blocks.children().each(function(nIdx, oBlock){
            var oBlock = jQuery(oBlock),
                nWidth = oBlock.find('table').width();
            oBlock.find('.events').css('max-width', nWidth).css('width', nWidth);
            oBlock.find('table').width(nWidth);
            oBlock.find('.gantt_dates').width(nWidth + 20);
            
            
            
        });
        
        //console.log(aBlocks);
    }


    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        } 
    }

    
/**
 * Init all default events
 *
 * @return {void}
 */
    
    self._initEvents  = function(oPopup){
        self._dom.blocks = oPopup.find('.gantt_blocks');
        self._dom.frame = oPopup.find('iframe');
        self._dom.panel = oPopup.find('._panel');
        
    }







/**
 * Build left part of Gantt
 *
 * @return {void}
 */

    self._initHTML = function(){
        var sHTML = '<div class=gantt_blocks></div>'
                + '<iframe class="ca_print_frame" src=""></iframe>'
                + '<div class=ca_print_settings>'
                    + '<div class=_buttons>'
                        + '<span data-action="print" class=simple_button>'
                        + self._parent.getText('print', 'Print')
                        + '</span>&nbsp;&nbsp;'
                        + '<span data-action="settings" class=simple_button>'
                        + self._parent.getText('print_settings', 'Settings')
                        + '</span>&nbsp;&nbsp;'
                        + '<span data-action="close" class=simple_button>'
                        + self._parent.getText('close', 'Close')
                        + '</span>&nbsp;&nbsp;'
                    + '</div>'
                    + '<div class=_panel>'
                        + 'Phrase: <input name="text" value="' + self._params.phrase + '"/>&nbsp;'
                        + self._parent.getText('cs_layout', 'Layout')
                            + ': <select name="layout">'
                            + '<option value="landscape">Landscape'
                            + '<option value="portrait" ' + (self._params.layout == 'portrait' ? 'selected' : '') + '>Portrait'
                            + '</select>&nbsp;'
                        + self._parent.getText('cs_display_size', 'Size')
                            + ': <select name="size">'
                            + '<option value="letter">Letter'
                            + '<option value="a4" ' + (self._params.size == 'a4' ? 'selected' : '') + '>A4'
                            + '<option value="letterpoint" ' + (self._params.size == 'letterpoint' ? 'selected' : '') + '>Letter point'
                            + '<option value="a4point" ' + (self._params.size == 'a4point' ? 'selected' : '') + '>A4 point'
                            + '<option value="letter96" ' + (self._params.size == 'letter96' ? 'selected' : '') + '>Letter 96'
                            + '<option value="a496" ' + (self._params.size == 'a496' ? 'selected' : '') + '>A4 96'
                            + '</select>&nbsp;'
                        + self._parent.getText('cs_print_group_by', 'Print order')
                        + ': <select name="sort">'
                            + '<option value="calendars">By calendars'
                            + '<option value="date" ' + (self._params.sort == 'date' ? 'selected' : '') + '>By date'
                            + '</select>&nbsp;'
                        + '<span data-action="ok" class=simple_button>'
                        + self._parent.getText('menu_ok', 'Ok')
                            + '</span>&nbsp;&nbsp;'
                    + '</div>'
                + '</div>'
                ;
        self._dom.div = jQuery(sHTML);
        return self._dom.div;
    }
    
    
    self._closeAction = function(){
        self._parent.hidePopup();
    }
    
    self._settingsAction = function(){
        self._dom.panel.toggleClass('_on');
    }
    
    self._okAction = function() {
        self._dom.panel.removeClass('_on');
        var aParams = {};
        self._params.size   = self._dom.panel.find('[name="size"]').val();
        self._params.layout = self._dom.panel.find('[name="layout"]').val();
        self._params.sort   = self._dom.panel.find('[name="sort"]').val();
        self._params.w = self._sizes[self._params.layout][self._params.size][0];
        self._params.h = self._sizes[self._params.layout][self._params.size][1];
        self._params.phrase = self._dom.panel.find('[name="text"]').val();
        
        self._parent.setLS('gantt_print_settings', JSON.stringify(self._params));
        view.showData();
    }
    
    self._printAction = function(){
        var aCSS = self._parent.layout.getCSSCOlor(),
            sCSS = '';
        for (var sSelector in aCSS) {
            sCSS += sSelector + '{' + aCSS[sSelector] + '}' + "\n";
        }
        var 
            oWin = self._parent.options.anyIE ? self._dom.frame[0].contentDocument : self._dom.frame[0].contentWindow,
            sHTML = '<html><head>' 
                + '<link href="' + self._parent.options.staticUrl + '/css/print/default.css" media="all" rel="stylesheet" type="text/css"/>'
                + '<link href="' + self._parent.options.staticUrl + '/css/gantt.css" media="all" rel="stylesheet" type="text/css"/>'
                + '<style>'
                    + '.JQ_CA{' 
                        + 'font-size:12px;'  + "\n"
                        + 'font-family: Arial,Helvetica,sans-serif;' + "\n"
                        + 'font-size: 12px;' + "\n"
                        + 'color: #555555;' + "\n"
                    + '}' + "\n" 
                    //+ '.events .evt > span{background-color:#777}' + "\n" 
                    + sCSS
                +' </style>'
                + '</head>'
                + '<body ' 
                + (self._parent.options.anyIE && false ? '' : 'onload="printFrame()" ' )
                + '>'
                + '<div class="JQ_CA">'
                + self._dom.blocks[0].outerHTML
                + '</div>'
                //+ (self._parent.options.anyIE ? '<script>self.focus();print();<script>' : '')
                + '<script>'
                + (self._parent.options.anyIE
                    ? 'function doPrint(){self.focus();self.print();}' + "\n"
                        + 'function printFrame(){setTimeout(doPrint, 1000);}'  + "\n"
                    : 'function printFrame(){'
                        + "window.print();" + "\n"
                        + '}' + "\n"
                    )
                + '</script>'
                + '</body>'
                + '</html>';
//        console.log(oWin);
        if (self._parent.options.anyIE) {
            oWin.write(sHTML);
            oWin.close();
//            alert('3');
            //self._dom.frame[0].focus();
            //self._dom.frame[0].print();
//            oWin.focus();
//            window.print();
//            self._dom.frame[0].src= "javascript:'" + sHTML + "';print();";
        } else {
            oWin.document.write(sHTML);
            oWin.document.close(); //important!
            oWin.focus(); //IE fix
        }
        //oWin.print();
    }
       
    
    jQuery.calendarAnything.appendView('print/gantt', view);
})();