/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */



(function(){
     var self = {
        _css                : '/css/custom.css',
        _parent             : null,
        _div                : null,
        _custom_div         : null,
        _period             : {"min" : new Date(), "max" : new Date(), baseDate : new Date()}, 
        _eventsData         : [],
        _modes  :   {
            "2d" : {"days" : 2, cols : 2, rows : 1},
            "3d" : {"days" : 3, cols : 3, rows : 1},
            "4d" : {"days" : 4, cols : 4, rows : 1},
            "5d" : {"days" : 5, cols : 5, rows : 1},
            "6d" : {"days" : 6, cols : 6, rows : 1},
            "7d" : {"days" : 7, cols : 7, rows : 1},
            "2w" : {"days" : 14, cols : 7, rows : 2},
            "3w" : {"days" : 21, cols : 7, rows : 3},
            "4w" : {"days" : 28, cols : 7, rows : 4},
            "manual" : {"days" : 1, cols : 1, rows : 1}
        },
        _cols   : 7,
        _rows   : 2,
        _currentMode : "2w",
        _showDays   : true,
        _showHours  : true,
        _nBlockHeight   : 1,
        _nPeriodMulti   : 0,
        _aMaxBottomLines    : [],
        _aCheckBottomLines  : [],
        _aRows      : [],
        _aCells     : [],
        _domHourly  : {},
        _domDaily   : {}
    };
    var view = {};
    
    view.init = function (div, parent){
        self._parent = parent;
        
        self._parent.loadCss(self._css);
        self._initMode();
    }    
    
    view.show = function(sMode) {
        if (self._div == null) {
            view.changeCurrentPeriod(self._parent.options, 0);
            self._div = self._parent.layout.getCurrentModeDiv('custom');
            self._div.addClass('custom_' + self._parent.params.customMode);
            self._initMode();
            
            self._addBasicDiv();
            self._setBasicCSS();
            self._initEvents();
            
        }
        view.changeCurrentPeriod(self._parent.options, 0);
//        console.log('only show');
        self._reBuildRightGrid({date : ""});
        self._div.addClass('show');
        if (sMode === 'toggle') {
            var oFirst = self._foundCurrentDiv();
            if (oFirst.size() > 0) {
                for (var nI = 0; nI < self._rows; nI++) {
                    self._scrollBottomOfRow(oFirst);
                    oFirst = oFirst.next();
                }
            }
        }
    }
    
    view.reShow = function(params) {
//        console.log('only reshow');
        self._reBuildRightGrid(params);
        self._div.addClass('show');
        if ( self._div == null) {
            view.changeCurrentPeriod(self._parent.options, 0);
        }
    }
    
    
    view.changeCurrentPeriod = function(aOptions, mDirection) {
        var nAllRow = self._modes[self._currentMode].days, 
            nOneRow = self._modes[self._currentMode].days / parseInt(self._modes[self._currentMode].rows),
            dMin;
//        console.log('here ' + mDirection);
        if (mDirection instanceof Date) {
            aOptions.current.setTime(mDirection.getTime());
            dMin = aOptions.current;
        } else {
            aOptions.current.changeDate(mDirection * nAllRow);
            if (mDirection == 0 && self._div == null){
                aOptions.current.setHours(0, 0, 0, 0);
                dMin = Date.baseDate(aOptions.current);
                var nChange = (dMin.getDay() - self._parent.params.startWeekDay) % self._cols;
                nChange += (nChange < 0 ? self._cols : 0);
                dMin.changeDate(-nChange);
                self._period.baseDate = Date.baseDate(dMin);
            }
        }
        if (dMin == undefined) {
            dMin = aOptions.current;
        }
        if (typeof(aOptions.min) == 'undefined') {
            aOptions.min = new Date();
        }
        if (typeof(aOptions.max) == 'undefined') {
            aOptions.max = new Date();
        } 
//        console.log('calculation ' + aOptions.current);
        aOptions.min.setTime(dMin.getTime());
        var nDays = self._period.baseDate.getDaysFrom(aOptions.min);
        if (nDays % nOneRow != 0) {
//            console.log(' old min ' + aOptions.min, '/ ' + nDays + ' / ' + nOneRow + ' / ', nDays % nOneRow);
            aOptions.min.changeDate(1 * (nDays % nOneRow - (nDays < 0 ? 0 : nOneRow)))
                .setHours(0, 0, 0, 0);
//            console.log(' new min ' + aOptions.min);
        }
        
        aOptions.max.setTime(aOptions.min);
        aOptions.max.changeDate(self._modes[self._currentMode].days - 1)
        self._period.min.setTime(aOptions.min);
        self._period.max.setTime(aOptions.max);
//        console.log('change date to ' + aOptions.current);
    }
    
    
    view.showData = function(params) {
        self._buildRightData(params);
    }
    
    
        
    view.getTitle = function(){
        return self._parent.options.min.format('mmm d - ')
            + (self._period.min.getMonth() != self._period.max.getMonth()
                ? self._parent.options.max.format('mmm') + ' ' 
                : "")
            + self._period.max.format('d, yyyy');

    }
    
    view.delEvent = function(mEventId) {}
    
    view.clearView = function() {
        if (self._custom_div != undefined && self._custom_div != null) {
            self._custom_div.remove();
            self._custom_div = null;
        }
        if (self._div != undefined && self._div != null) {
            self._div.remove();
        }
        self._div = null;
        self._aRows = [];
        self._aCells = [];
        self._domHourly = [];
        self._domDaily = [];
        self._aCheckBottomLines = [];
        self._aMaxBottomLines = [];
    }
    
    view.resize = function() {
        self._cacheCoords = undefined;
    }
    
    view.preparePrint = function(bMode) {
        self._expand(bMode);
    }

    /** 
    * @public refresh
    *
    * redraw data
    *
    */
    view.refresh = function(params) {
        view.showData();
    }


    view.getClickDate = function(oEvt) {
        var oCalculated = self._getWeekDay(oEvt),
            dD = Date.baseDate(
                oCalculated.day, 
                0, 
                oCalculated.style != 'daily' 
                    ? oCalculated.hour * parseInt(self._parent.params.minMinutePeriod) / 60 
                        + parseInt(self._parent.aCalculated.startHour)
                    : 0
            );
        if (oCalculated.day == undefined) {
            return false;
        };
        return {
            "date" : dD,
            "hourly" : oCalculated.style != 'daily' 
        }
    }
    
    self._addBasicDiv = function() {
        self._custom_div = jQuery('<div class=custom_scroll></div>').appendTo(self._div);
    }
    
    
    self._initEvents = function() {
        if (self._parent.options.readonly !== true) {
            self._parent._prependQueue([
                function(){
                    self._initDDEvent();
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.simpleselect.js');
                }
            ]);
        }
        self._custom_div
            .on(self._parent.eventNames.down, 'span.detail_day', function(evt){
                var el = jQuery(this).parent();
                self._parent.toggleMode('day', false, el.data('date'));
                return false;
            });
    }


    self._buildRightGrid = function(){
        var nRow, 
            dCur = Date.baseDate(self._period.min),
            nOldVisibleDiv = self._foundCurrentDiv();
//        console.log('building from date ' +  dCur);
        for (nRow = 0; nRow < self._rows; nRow++) {
            self._getRowOnGrid(dCur);
            dCur.changeDate(self._cols);
        }
        self._scrollTo(nOldVisibleDiv);
    }
    
    self._reBuildRightGrid = function(params) {
//        console.log('rebuild!');
        self._buildRightGrid();
        if (params.date != undefined) {
            
            var oRow = self._getRowOnGrid(self._period.min);
            self._scrollTo(oRow, 500);
            if (params.curtime != undefined) {
                self._scrollBottomOfRow(oRow);
            }
        }
    }
    
    self._scrollBottomOfRow = function(oRow) {
        if (self._parent.options.scrollLine != undefined 
            && self._parent.options.scrollLine > 0
        ) {
            var dBottom = oRow.children('.hourly');
            if (dBottom.size() > 0) {
                dBottom.scrollTop(self._parent.options.scrollLine);
                setTimeout(function(){
                    dBottom.scrollTop(self._parent.options.scrollLine);
                }, 300);
            }
        }
    }
    
    self._getRowOnGrid = function(mDate) {
        
        var dStartDate = typeof(mDate) == 'date' ? mDate : Date.baseDate(mDate),
            tStamp = typeof(mDate) == 'numeric' ? mDate : dStartDate.getTime() / 1000,
            divRow = self._custom_div.children('[data-date="' + tStamp + '"]'),
            bAMPM = self._parent.options.format.hourTitle.indexOf('a') >= 0,
            bAMPMShort = self._parent.options.format.hourTitle.indexOf('aa') >= 0,
            b2HourDigit = self._parent.options.format.hourTitle.indexOf('hh') >= 0,
            sPM = bAMPMShort ? 'PM' : 'p',
            sAM = bAMPMShort ? 'AM' : 'a',
            sDateFormat = "hh" + (bAMPM ? '<br>aa' : ''),
            tToday = self._parent.options.now.valueOf() / 1000,
            nHour;
        
        if (divRow.size() < 1) {
            var sDailyLi = '', sHourlyLi = '',
                dCur = Date.baseDate(tStamp, nDay),
                tCur,
                aAddCell = [];
//            console.log('put Row ' + dStartDate)    ;
            for (var nDay = 0; nDay < self._cols; nDay++) {
                tCur = dCur.getTime() / 1000;
                aAddCell.push(tCur);
                sDailyLi += self._getCellHTML(dCur);
                sHourlyLi += '<li data-date="' + tCur + '"'
                        + (tCur == tToday ? ' class="current"' : "")
                        + '>'
                    + '<div class=events></div>';
                if (nDay == self._cols - 1) {
                    sHourlyLi += '<div class="hours_title">';
                    for (var i = parseInt(self._parent.aCalculated.startHour); i < parseInt(self._parent.aCalculated.stopHour); i++) {
                        nHour = bAMPM 
                            ? (i == 0 ? 12 : (i > 12 ? i - 12 : i))
                            : i;
                        sHourlyLi += '<span>' 
                            + (b2HourDigit ? (nHour < 10 ? '0' + nHour : nHour) : nHour)
                            + (b2HourDigit || nHour >= 10 ? '<br>' : '')
                            + (bAMPM ? (i >= 12 ? sPM  : sAM) : '')
                        + '</span>';
                    }
                    sHourlyLi += '</div>';
                }
                sHourlyLi += '</li>';
                dCur.changeDate(1);
            }

            var sHTML = '<div '
                + 'data-date="' + tStamp + '" ' 
                + 'data-d="' + (dStartDate) + '" ' 
                + '>'
                + '<ul '
                    + (self._parent.params.showScrollButtons === true ? 'class="scroll_pad_r"' : "")
                    +'>'
                    + sDailyLi
                + '</ul>'
                + (self._showDays 
                    ? '<div class="daily '
                        + (self._parent.params.showScrollButtons === true ? '' : "scroll_pos_negative_r ")
                        + 'events"></div>'
                    : ''
                )
                + (self._showHours 
                    ? '<div class="hourly '
                            + (self._parent.params.showScrollButtons === true ? '' : "scroll_pos_negative_r ")
                            + '">'
                            + '<ul class="hour_v_area">'
                            + sHourlyLi
                            + '</ul>'
                        + '</div>'
                    : ''
                )
                + '</div>';

            var tMax = self._aRows.length > 0 ? self._aRows[self._aRows.length - 1] : 0,
                tMin = tMax != 0 ? self._aRows[0] : 0;
            divRow = jQuery(sHTML);
            if (tStamp > tMax) {
                self._aRows.push(tStamp);
                self._aCells = self._aCells.concat(aAddCell);
                divRow.appendTo(self._custom_div);
            } else if (tStamp < tMin) {
                self._aCells = aAddCell.concat(self._aCells);
                self._aRows.unshift(tStamp);
                divRow.prependTo(self._custom_div);
            } else {
                for (var nI = 0; nI < self._aRows.length; nI++) {
                    if (self._aRows[nI] < tStamp) {
                        continue;
                    }
                    divRow.insertBefore(self._custom_div.children('[data-date="' + self._aRows[nI] + '"]'));
                    var nIdx = self._aCells.indexOf(self._aRows[nI]);
                    self._aRows.splice(nI, 0, tStamp);
                    self._aCells = [].concat(self._aCells.slice(0, nIdx), aAddCell, self._aCells.slice(nIdx, self._aCells.length));
                    break;
                }
            }
            if (self._parent.options.scrollLine != undefined 
                && self._parent.options.scrollLine > 0
            ) {
                var dBottom = divRow.children('.hourly');
                if (dBottom.size() > 0) {
                    dBottom.scrollTop(self._parent.options.scrollLine);
                    setTimeout(function(){
                        dBottom.scrollTop(self._parent.options.scrollLine);
                    }, 300);
                }
            }

        }
        return divRow;
    }
    
    self._getCellHTML = function(dDate) {
        var sClass = (dDate.valueOf() == self._parent.options.now.valueOf()) ? " class='current' " : "",
            sHTML = '<li '
            + 'data-date="' + (dDate.getTime() / 1000) + '"' + sClass + '>';
        if (self._showDays) {
            sHTML += '<span class=detail_day>' 
                + self._parent.text.weekShort[dDate.getDay()] 
                + ' ' //  ' / '
                + dDate.getDate() + '</span>';
        }
        sHTML += '</li>';
        return sHTML;
    }
    
    self._initMode = function() {
        self._currentMode = self._parent.params.customMode;
        if (self._currentMode == 'manual') {
            self._cols = self._parent.params.customModeCols;
            self._rows = self._parent.params.customModeRows;
            self._modes['manual'].days = self._cols * self._rows;
            self._modes['manual'].rows = self._rows;
            self._modes['manual'].cols = self._cols;
        } else {
            self._cols = self._modes[self._currentMode].cols;
            self._rows = self._modes[self._currentMode].rows;
        }
        self._cols = parseInt(self._cols);
        self._rows = parseInt(self._rows);        
    }
    
    self._setBasicCSS = function() {
        var curMode = self._modes[self._currentMode], 
            nI, 
            nOneCellWidth = parseInt(10000 / curMode.cols) / 100,
            aRules = [],
            aStyles = [];
//        console.log(nOneCellWidth);
        aRules.push('.JQ_CA div.custom_scroll > div', '.JQ_CA div.custom_scroll > div   ul > li');
        aStyles.push('height: ' + parseInt(100 / curMode.rows) + '%;', 'width: ' + nOneCellWidth + '%;');
        
        var aArea = self._parent.params.customModeArea.split('_');
        aArea[0] = parseInt(aArea[0]);
        aArea[1] = parseInt(aArea[1]);
        aRules.push('.JQ_CA > .CA_r > div._mode-custom   div.daily', '.JQ_CA > .CA_r > div._mode-custom   div.hourly');
        if (aArea[0] > 0 && aArea[1] > 0) {
            aStyles.push(
                'display:block;top: 15px;bottom:' + (100 -  parseInt(100 * aArea[0] / (aArea[0] + aArea[1]) )) + '%;', 
                'display:block;bottom: 0px;top:' + parseInt(100 * aArea[0] / (aArea[0] + aArea[1] )) + '%;'
            );
        } else if (aArea[1] > 0){
            aStyles.push('display:none', 'display:block;top: 15px;bottom:0px');
        } else {
            aStyles.push('display:block;top: 15px;bottom:0px', 'display:none');
        }
        
        for (nI = 0; nI < curMode.cols; nI++) {
            aRules.push('.JQ_CA > .CA_r > div._mode-custom div .evt.d' + nI, '.JQ_CA > .CA_r > div._mode-custom div .evt.p' + nI);
            aStyles.push('left: ' + nOneCellWidth *  nI + '%;', 'width: ' + nOneCellWidth * (nI + 1) + '%;');
        }
        changeCssClass(aRules, aStyles, true);
    }


    self._foundCurrentDiv = function() {
        var nHeight = self._custom_div.children(":first").height(),
            nCurrent = nHeight > 0 ? self._custom_div.scrollTop() / nHeight : 0,
            oVisibleDiv = self._custom_div.children().eq(nCurrent);
        return oVisibleDiv;
    }
    
    
    self._scrollTo = function(oDiv, nSec) {
        nSec = nSec == undefined ? 0 : nSec;
        if (oDiv.size() > 0) {
            if (nSec == 0 || true) {
                setTimeout(function(){
                    var nTopPos = oDiv.position().top ;
                    self._custom_div.scrollTop(nTopPos + self._custom_div.scrollTop());
                }, 20);
                
            } else {
                self._custom_div.animate({"scrollTop" : nTopPos}, nSec);
            }
        }

    }
    
    
    self._buildRightData = function(params) {
        params = params || {};
        params.min = new Date(self._period.min);
        params.max = new Date(self._period.max);
        params.max.setHours(23,59,59,0);
        self._nBlockHeight = 3600 / (60 / parseInt(self._parent.params.minMinutePeriod));
        self._nPeriodMulti = (60 / parseInt(self._parent.params.minMinutePeriod));
        
        params.calendars = self._parent.layout.getActiveCalendars();
        
        if (self._div == null) {
            self._div = self._parent.layout.getCurrentModeDiv('custom');
        }
//        console.log(params.min + ' / ' + params.max);
        self._parent._events.getData(params, function(data){
            var aResult = self._splitData(data, params);
            self._putDataOnGrid(aResult, params);
        });
    }
    
    self._splitData = function(aData, params) {
        var aBlockDay = self._initRowData(params), oEvt,
            bAllDailyMode = self._parent.params.customModeArea == '1_0';
        for (var nI = 0; nI < aData.length; nI++) {
            oEvt = aData[nI];
            if (oEvt.disable === true) {
                continue;
            }
            var tStart = oEvt.dayStart.getTime() / 1000,
                tEnd = oEvt.dayEnd.getTime() / 1000,
                tTimeEnd = oEvt.dateEnd.getTime() / 1000;
            jQuery.each(aBlockDay, function(tStamp, aRow){
                
//                console.log(aRow.start, aRow.end, '' + aData[nI].dayStart , '' + aData[nI].dayEnd );
                if (aRow.start <= tEnd && aRow.end > tStart) {
                    if (oEvt.allDay === true || bAllDailyMode){
                        self._appendEventToRowTop(oEvt, aRow);
                    }
                    if (
                        (aRow.start < tTimeEnd || tStart == aRow.start)     // ??
                        && (oEvt.allDay !== true)
                    ) {
                        self._appendEventToRowBottom(oEvt, aRow);
                    }
                    
                }
            });
        }
        return aBlockDay;
        //console.log(aData);
    }
    
    self._initRowData = function(params) {
        var aResult = {}, dCur = new Date(params.min);
        while (dCur < params.max) {
            
            var tStamp = dCur.getTime() / 1000;
            
            aResult[tStamp] = {"start" : tStamp, "daily" : [], 'hourly' : [], 'dailyGrid' : []};
            dCur.changeDate(self._cols);
            aResult[tStamp]["end"] = dCur.getTime() / 1000;
        }
        return aResult;
    }
    
    self._appendEventToRowTop = function(oEvt, oRow) {
        var dStartRowDate = new Date(oRow.start * 1000),
            nDay = Math.max(oEvt.dateStart.getDaysFrom(dStartRowDate, false), 0),
            nLine = 0,
            nMaxDays = Math.min(
                self._cols, 
                oEvt.dayEnd.getDaysFrom(dStartRowDate, false) + (oEvt.allDay === true ? 1 : 1)
            ),
            aArr = oRow.daily,
            aGrid = oRow.dailyGrid;
        if (typeof(aGrid[nDay]) == 'undefined') {
            aArr[nDay] = [oEvt];
        } else {
            nLine = aGrid[nDay].emptyKey();
            if (aArr[nDay] == undefined) {
                aArr[nDay] = [];
            }
            aArr[nDay][nLine] = oEvt;
        }
        for (var nI = nDay; nI < nMaxDays; nI++) {
            if (typeof(aGrid[nI]) == 'undefined') {
                aGrid[nI] = [];
            }
            aGrid[nI][nLine] = oEvt;
        }
    }
    
    self._appendEventToRowBottom = function(oEvt, oRow) {
        var dStartRowDate = Date.baseDate(oRow.start),
            nDay = Math.max(oEvt.dateStart.getDaysFrom(dStartRowDate, false), 0),
            nMaxDays = Math.min(self._cols, oEvt.dayEnd.getDaysFrom(dStartRowDate, false) + 1);
        for (var nI = nDay ; nI < nMaxDays; nI++) {    
            if (typeof(oRow.hourly[nI]) == 'undefined') {
                oRow.hourly[nI] = [];
            } 
            oRow.hourly[nI].push(oEvt);
        }
    }
    
    self._putDataOnGrid = function(aBlocks, params) {
//        console.time('custom build');
        self._aCheckBottomLines.length = 0;
        jQuery.each(aBlocks, function(tStamp, aBlock) {
            self._putDataOnRow(aBlock, params);
        });
        self._setBottomLineCSS();
//        console.timeEnd('custom build');
    }
    
    self._putDataOnRow = function(aBlock, params) {
        var divRow = self._getRowOnGrid(new Date(aBlock.start * 1000)),
            sHTML = '',
            aDrawed = [],
            nDay,
            nLine,
            oEvt,
            aLines = [],
            oCells = divRow.find('div.hourly > ul > li'),
            oCell,
            aDailyHourlyLines = [], dCur = new Date(),
            nMaxLine = 0;
        divRow.find('li.more').removeClass('more');
        for (nDay = 0; nDay < aBlock.daily.length; nDay++) {
            if (aBlock.daily[nDay] == undefined) {
                continue;
            }
            for (nLine = 0; nLine < aBlock.daily[nDay].length; nLine++) {
                
                oEvt = aBlock.daily[nDay][nLine];
                if (oEvt == undefined ) {
                    continue;
                }
                if (oEvt != undefined) {
                    sHTML += self._buildDailyBar(nLine, oEvt, aBlock.start);
                }
            }
            nMaxLine = nMaxLine < nLine ? nLine : nMaxLine;
        }
        self._parent.layout.initLinesCSS(nMaxLine);
        divRow.children('div.daily').html(sHTML);
        oCells.find('.events').html('');
        
        var aLineGrid = [],
            aEvtGrid = [],
            bButify = true;
        
        var fillLineGrid = function(nLine, nEvt, dStart, dEnd, dStartDate){
            if (aLineGrid[nLine] == undefined) {
                aLineGrid[nLine] = [];
            }
            var aPos = self._calculateHourlyBarParams({
                "start" : dStart, "end" : dEnd, "date" :  dStartDate
            });
            for (var nI = aPos.nCellStart; 
                nI < aPos.nCellStart + (aPos.nCellLength == 0 ? 1 : aPos.nCellLength); 
                nI++
            ) {
                aLineGrid[nLine][nI] = nEvt;
            }
            aEvtGrid[nEvt] = [
                nLine, 
                aPos.nCellStart, 
                aPos.nCellStart + (aPos.nCellLength == 0 ? 1 : aPos.nCellLength)
            ];
        }
        
        for (nDay = 0; nDay < aBlock.hourly.length; nDay++) {
            sHTML = '';
            aLineGrid = [];
            aEvtGrid = [];
            aLines.length = 0;
            
            if (aBlock.hourly[nDay] == undefined) {
                continue;
            }
            dCur.setTime(aBlock.start * 1000);
            dCur.changeDate(nDay);
            for (var nI = 0; nI < aBlock.hourly[nDay].length; nI++) {
                oEvt = aBlock.hourly[nDay][nI];
                for (nLine = 0; nLine < aLines.length; nLine++) {
                    if (oEvt.dateStart >= aLines[nLine]) {
                        break;
                    }
                }
                nLine = nLine < nI ? nLine : nI;
                aLines[nLine] = Date.baseDate(oEvt.dateEnd);
                if (oEvt.dateEnd.getTime() == oEvt.dateStart.getTime()) {
                    aLines[nLine].changeHour(parseInt(self._parent.params.minMinutePeriod) / 60);
                }
                
                
                if (oEvt != undefined) {
                    if (!bButify) {
                        sHTML += self._buildHourlyEventBar(nLine, oEvt, dCur);
                    } else {
                        fillLineGrid(nLine, nI, oEvt.dateStart, oEvt.dateEnd, dCur);
                    }
                    
                }
            }
            if (bButify) {
                var nMAxLength;
                for (nI = 0; nI < aEvtGrid.length; nI++) {
                    nMAxLength = Math.min(aLines.length - 1, 9);
                    var aBar = aEvtGrid[nI];
                    for (var nJ = aBar[1]; nJ < aBar[2]; nJ++) {
                        for (var nL = aBar[0] + 1; nL <= nMAxLength; nL++) {
                            if (aLineGrid[nL][nJ] != undefined) {
                                nMAxLength = nL - 1;
                                break;

                            }
                        }
                    }
                    aBar[3] = nMAxLength - aBar[0];
                    sHTML += self._buildHourlyEventBar(aBar[0], aBlock.hourly[nDay][nI], dCur, aBar[3]);
                }
            }
            aDailyHourlyLines[nDay] = aLines.length;
            oCell = oCells.eq(nDay).children('.events');
            if (oCell.data('lines') != undefined) {
                oCell.removeClass('evts_' + oCell.data('lines'));
            }
            oCell.addClass('evts_' + aDailyHourlyLines[nDay]).data('lines', aDailyHourlyLines[nDay]);
            oCell.html(sHTML);
            self._aCheckBottomLines.push(aLines.length);
            if (aDailyHourlyLines[nDay] > 10) {
                divRow.children('ul').children('li').eq(nDay).addClass('more');
            }
        }
    }
    
    self._buildDailyBar = function(nLine, aEl, tStartDate) {
        var bNoMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false ,
            aCalendar = !bNoMove ? aEl.getCalendar() : null; //self._parent._calendars.getCalendar(aEl.calendarid)
        return self._getEventDailyHTML({
            "id"        : aEl.id,
            "date"      : Date.baseDate(tStartDate),
            "next"      : Date.baseDate(tStartDate, self._cols),
            "calendar"  : aEl.calendarid,
            "specColor" : aEl.specColor,
            "className" : aEl.className,
            "title"     : aEl.title,
            "hoverTitle" : aEl.getTitle(),
            "editable"  : !bNoMove && aCalendar.editable === true && aCalendar.move === true,
            "noEnd"     : aEl.noEnd || bNoMove,
            "start"     : aEl.dateStart,
            "end"       : aEl.dateEnd,
            "dayEnd"    : aEl.dayEnd,            
            "allDay"    : aEl.allDay,
            "line"      : nLine,
            "titleHTML" : aCalendar != null && aCalendar.titleHTML === true
        });
    }
    
    self._getEventDailyHTML = function(aParams) {
        var aCalculated = self._calculateDailyBarParams(aParams);
        var sHTML = '<div class="evt d' + aCalculated.nColStart  
            + ' p' + aCalculated.nColLength + ' ' 
            + ' l' + aParams.line + ' ' 
            + ( aCalculated.bFL ? "full_l " : ' ' )
            + ( aCalculated.bFR ? "full_r " : ' ' )
            + (aParams.addClass != undefined ? aParams.addClass + " " : ' ' )
            + (aParams.editable != undefined && !aParams.editable ? "non_e " : "")        
            + ( aParams.noEnd != undefined && aParams.noEnd ? "non_r " : ' ' )        
            + '" '
            + ' data-d="' + aCalculated.nColStart + '"'
            + ' data-p="' + aCalculated.nColLength + '"'
            + ' data-l="' + aParams.line + '"'
        
            + (aParams.id != undefined ? ' data-event="' + aParams.id + '"' : "")
            + (aParams.calendar != undefined ?' data-calendar="' + aParams.calendar + '"' : "")
            + ' data-start="' + ( aParams.start.valueOf() / 1000 ) + '"'
            + ' data-end="' + ( aParams.end.valueOf() / 1000 ) + '"'
            + ' title="' + aParams.hoverTitle + '"'
            + '>'
            + '<span class="title color_' + (aParams.className != undefined ? aParams.className : "" ) 
                + (aParams.specColor != undefined && aParams.specColor != '' ? ' ' + self._parent._events.getEventColor(aParams.specColor) : '')
            + '">' 
            + '<span class="text">' 
                + (aParams.allDay !== true && !aCalculated.bFL
                    ? self._parent._events.getBarLabelTime({
                        "dateStart" : aParams.start,
                        "dateEnd"   : aParams.end,
                        "allDay"    : aParams.allDay
                    })
                    : ''
                )
                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
            + '</span>'
            + '<span class=l></span><span class=r></span>'
            + '</span>'
            + '</div>';
        return sHTML;
        
    }
    
    
    
    
    self._buildHourlyEventBar = function(nLine, aEl, nStartDate, nWide) {
        var dStart = Date.baseDate(nStartDate),
            dNext =  Date.baseDate(nStartDate, 1),
            bNoMove = self._parent.options.readonly === true || self._parent.options.readonly.move === false ,
            aCalendar = !bNoMove ? aEl.getCalendar() : null; // self._parent._calendars.getCalendar(aEl.calendarid) 
        return self._getHourlyBarHTML({
            "id"    : aEl.id,
            "date"  : dStart,
            "next"  : dNext,
            "calendar"      : aEl.calendarid,
            "className"     : aEl.className,
            "specColor"     : aEl.specColor,
            "title"         : aEl.title,
            "hoverTitle"    : aEl.getTitle(),
            "editable"      : !bNoMove && aCalendar.editable === true && aCalendar.move === true,
            "noEnd"         : aEl.noEnd || bNoMove,
            "start"         : aEl.dateStart,
            "end"           : aEl.dateEnd,
            "dayEnd"        : aEl.dayEnd,
            "line"          : nLine,
            "allDay"        : aEl.allDay === true,
            "noLS"      : aEl.noLS,
            "noRS"      : aEl.noRS,
            "lFixed"    : aEl.lFixed,
            "rFixed"    : aEl.rFixed,
            'wide'      : nWide,
            'allDay'    : aEl.allDay,
            "titleHTML" : aCalendar != null && aCalendar.titleHTML === true
        });
    }
    
    self._getHourlyBarHTML = function(aParams) {

        var aCalculated = self._calculateHourlyBarParams(aParams);
        var sHTML = '<div '
            + ' class="evt '
            + ' e' + aParams.line                       // event # for day
            + ' i' + aCalculated.nCellLength            // 30/15 minutes interval length
            + ' s' + parseInt(aCalculated.nCellStart)             // start interval
            + ' ' + (aCalculated.bFT ? "full_t " : "")
            + (aCalculated.bFB ? "full_b " : "")
            + ( aParams.addClass != undefined ? aParams.addClass + " " : ' ' )
            + ( aParams.editable != undefined && !aParams.editable ? "non_e " : "")
            + ( aParams.noEnd != undefined && aParams.noEnd ? "non_r " : ' ' )        
            + ( aParams.noLS === true ? "non_ls " : ' ' )        
            + ( aParams.noRS === true ? "non_rs " : ' ' )        
            + ( aParams.lFixed === true ? "fixed_l " : ' ' )        
            + ( aParams.rFixed === true ? "fixed_r " : ' ' )        
            + ( aParams.wide != undefined && aParams.wide > 0 ? 'wd' + aParams.wide + " " : ' ' )
        
            + '"'
            + ' title="' + aParams.hoverTitle + '"'
            + ' data-e="' + aParams.line + '"'
            + ' data-i="' + aCalculated.nCellLength + '"'
            + ' data-s="' + parseInt(aCalculated.nCellStart) + '"'
            + (aParams.calendar != undefined ? ' data-calendar="' + aParams.calendar + '"' : "")
            + ' data-end="' + aParams.end.getTime() / 1000 + '"'
            + ' data-start="' + aParams.start.valueOf() / 1000 + '"'
            + (aParams.id != undefined ? ' data-event="' + aParams.id + '"' : "")
            + '>' 
            + '<span class="color_' + (aParams.className != undefined ? aParams.className : "" ) 
                + (aParams.specColor != undefined && aParams.specColor != '' ? ' ' + self._parent._events.getEventColor(aParams.specColor) : '')
            + '">'
            + '<span class="title">' 
                + (!aCalculated.bFT || aCalculated.nCellStart > 0 
                    ? self._parent._events.getBarLabelTime({
                        "dateStart" : aParams.start,
                        "dateEnd"   : aParams.end,
                        "allDay"    : aParams.allDay
                        }) 
//                        + '- '
                    : ''
                )        
                + (aParams.titleHTML !== true ? aParams.title.htmlspecialchars() : aParams.title)
            + '</span>'
            + '<span class=t></span><span class=b></span>'
            + '</span>'
            + '</div>';
        return sHTML;
    }
    
    self._calculateDailyBarParams = function(aParams) {
        if (aParams.start.getTime() > aParams.end.getTime()) {
            Date.swap(aParams.start, aParams.end);
        };
        if (aParams.event != undefined && aParams.calendar != undefined && aParams.allDay === undefined) {
            var aEvent = self._parent._events.getEvent(aParams.event, aParams.calendar);
            aParams.allDay = aEvent[0].allDay === true;
        }
        aParams.date = typeof(aParams.date == 'numeric') ? Date.baseDate(aParams.date) : aParams.date;
        aParams.next = Date.baseDate(aParams.date, self._cols);
        var dEndDay = aParams.dayEnd != undefined 
            ? aParams.dayEnd 
            : Date.baseDate(aParams.end).resetHours();
        var aResult = {
            bFL : aParams.start.getTime() < aParams.date.getTime(),
            bFR : dEndDay > aParams.next && aParams.start < aParams.end
                || (
                    dEndDay.valueOf() == aParams.next.valueOf()
                    &&
                    (aParams.end.valueOf() != dEndDay.valueOf() || aParams.allDay)
                )            
        };
        aResult.nColStart = aResult.bFL ? 0 : aParams.start.getDaysFrom(aParams.date);
        aResult.nColLength = Math.max(0, (
            aResult.bFR 
                ? self._cols - 1 
                : dEndDay.getDaysFrom(aParams.date) - (
                   aParams.allDay === false && dEndDay.valueOf() == aParams.end.valueOf() // && aParams.end > aParams.start 
                       ? 1 
                       : 0
                )
            ) - aResult.nColStart);
        return aResult;
    }
    
    self._calculateHourlyBarParams = function(aParams) {
        if (aParams.start.getTime() > aParams.end.getTime()) {
            Date.swap(aParams.start, aParams.end);
        };
        aParams.date = typeof(aParams.date == 'numeric') ? Date.baseDate(aParams.date) : aParams.date;
        aParams.next = aParams.next == undefined ? Date.baseDate(aParams.date, 1) : aParams.next;
        var dEndDay = aParams.dayEnd != undefined ? aParams.dayEnd : Date.baseDate(aParams.end);
        if (aParams.dayEnd == undefined) {
            dEndDay.setHours(0,0,0,0);
        }
        var aResult = {
            bFT : aParams.start.getTime() < aParams.date.getTime(),
            bFB : dEndDay > aParams.next && aParams.start < aParams.end
                || (
                    dEndDay.valueOf() == aParams.next.valueOf()
                    &&
                    aParams.end.valueOf() != dEndDay.valueOf()
                )
        };
        aResult.nCellStart = Math.floor(aResult.bFT ? 0 : aParams.start.getHoursFrom(aParams.date, true) * self._nPeriodMulti);
        aResult.nCellLength = Math.ceil(self._nPeriodMulti * (aResult.bFB ? 24 : aParams.end.getHoursFrom(aParams.date, true))) - aResult.nCellStart;
        return aResult;
    }
    
    self._setBottomLineCSS = function() {
        if (self._aCheckBottomLines.length == 0) {
            return;
        }
        self._aCheckBottomLines = self._aCheckBottomLines.unique();
        var aCSSToAdd = self._aCheckBottomLines.diff(self._aMaxBottomLines);
        if (aCSSToAdd.length < 1) {
            return;
        }
        var nI, aClass = [], aRule = [], nCount, nEvts, nRealEvts, nRealWidth;
        for (nCount = 0; nCount < aCSSToAdd.length; nCount++) {
            nEvts = Math.min(aCSSToAdd[nCount], 10);
            nRealEvts = aCSSToAdd[nCount];
            nRealWidth = parseInt(950 / nEvts) / 10;
            for (nI = 1; nI < nRealEvts; nI++){
                aClass.push('.JQ_CA > .CA_r > div._mode-custom   div.custom_scroll > div > div.hourly > ul > li .events.evts_'
                    + nRealEvts
                    + ' > div.evt.e' + nI);
                aRule.push('margin-left:' + (nI * nRealWidth) + '%;'
                    + (nI >= nEvts ? 'display:none;' : ''));
                
                aClass.push('.JQ_CA > .CA_r > div._mode-custom div.custom_scroll > div > div.hourly > ul > li > .events.evts_' 
                        + nRealEvts
                        + ' > div.evt.wd' + nI);
                aRule.push('width:' + nRealWidth * (1 + nI) + '%;');
            }
            aClass.push('.JQ_CA > .CA_r > div._mode-custom   div.custom_scroll > div > div.hourly > ul > li .events.evts_'
                + nRealEvts 
                + ' > div.evt');
            aRule.push('width:' + nRealWidth + '% ;');
        }
        changeCssClass(aClass, aRule, true);
        self._aMaxBottomLines = self._aMaxBottomLines.concat(aCSSToAdd);
        self._aCheckBottomLines.length = 0;
    }
    
    
    self._findDailyBar = function(mDate) {
        var tDate = typeof(mDate) == 'date' ? mDate().getTime() / 1000 : mDate;
        if (self._domDaily[tDate] == undefined) {
            self._domDaily[tDate] = self._getRowOnGrid(tDate).children('.events');
        }
        return self._domDaily[tDate];
    }
        
    self._findHourlyCell = function(mDate) {
        var tDate = mDate instanceof Date ? mDate.getTime() / 1000 : mDate;
        if (self._domHourly[tDate] == undefined) {
            var dFirst = Date.baseDate(tDate),
                nDistance = self._period.baseDate.getDaysFrom(dFirst) % self._cols;
            if (nDistance != 0) {
                nDistance = nDistance > 0 ? nDistance - self._cols : nDistance;
                dFirst.changeDate(nDistance);
            }
            self._domHourly[tDate] = self._getRowOnGrid(dFirst).find('.hourly li[data-date="' + tDate + '"] .events');
        }
        return self._domHourly[tDate];
    }
    
    self._initDDEvent = function(){
        var divScroll, aBasicScrollCoord;
        var _updateDailyBar = function(aParams) {
            var aCalculated = self._calculateDailyBarParams(aParams);
            var domBar = self._findDailyBar(aParams.date)
                .find('.evt.new_event');
            domBar
                .removeClass('full_l full_r p' + domBar.data('p') + ' d' + domBar.data('d'))
                .addClass(' ' 
                    + (aCalculated.bFL ? "full_l " : "")
                    + (aCalculated.bFR ? "full_r " : "")
                    + "p" + aCalculated.nColLength + ' ' 
                    + "d" + aCalculated.nColStart + ' ' 
                ).data({"d" : aCalculated.nColStart , "p" : aCalculated.nColLength})
                .show();
        }        
        
        var _updateHourlyBar = function(aParams) {
            var aCalculated = self._calculateHourlyBarParams(aParams),
                domBar = self._findHourlyCell(aParams.date).children('.evt.new_event');
            domBar
                .removeClass('full_t full_b s' + domBar.data('s') + ' i' + domBar.data('i'))
                .addClass(' ' 
                    + (aCalculated.bFT ? "full_t " : "")
                    + (aCalculated.bFB ? "full_b " : "")
                    + "s" + aCalculated.nCellStart + ' ' 
                    + "i" + aCalculated.nCellLength + ' ' 
                ).data({"s" : aCalculated.nCellStart , "i" : aCalculated.nCellLength})
                .find('.title').text(
                    (!aCalculated.bFT || aCalculated.nCellStart > 0 
                        ? aParams.start.format(self._parent.options.format.hourTitle) + '-'    
                            + aParams.end.format(self._parent.options.format.hourTitle) + ' '
                        : "")
                    + (aParams.title != null ? aParams.title : domBar.attr('title'))
                ).show();
        }
        
        var _barMove = function(el, evt) {
            var aNew = self._getWeekDay(evt),
                nChange = -el.data('baseDate').getDaysFrom(new Date(aNew.day * 1000)),
                nHourChange = (aNew.hour - el.data('baseHour')) / self._nPeriodMulti;
            if (el.data('creating')) {
                if (nChange < 0 || (nHourChange < 0 && nChange <= 0)) {
                    nHourChange -= self._parent.params.minMinutePeriod / 60;
                }
            }
            var dStart = Date.baseDate(
                    el.data('startDate'), 
                    (el.data('resize') != false ? nChange + (el.data('fixedL') === true && nHourChange < 0 ? -1 : 0): 0), 
                    el.data('resize') != false && el.data('fixedL') != true ? nHourChange : 0
                ),
                dEnd = Date.baseDate(
                    el.data('endDate'), 
                    (el.data('resize') != true ? nChange + (el.data('fixedL') === false && nHourChange > 0 ? 1 : 0) : 0) , 
                    el.data('resize') != true && el.data('fixedL') != false ? nHourChange : 0
                ),
                nI, tLast = 0,
                sStyle = el.data('style'),
                funcBuild = sStyle == 'daily' ? self._getEventDailyHTML : self._getHourlyBarHTML,
                funcMove = sStyle == 'daily' ? _updateDailyBar : _updateHourlyBar,
                funcFindBar = sStyle == 'daily' ? self._findDailyBar : self._findHourlyCell,
                oBar = el.data('bar'),
                oEvent = oBar != null ? self._parent._events.getEvent(oBar.data('event'), oBar.data('calendar')) : null,
                bCreating = el.data('creating');
            if (el.data('fixedL') != null && (dEnd < dStart) && sStyle != 'daily') {
                if (el.data('fixedL')) {
                    dStart.changeDate(dEnd.getDaysFrom(dStart));
                    if (dEnd < dStart) {
                        dStart.changeDate(-1);
                    }
                } else {
                    dEnd.changeDate(dStart.getDaysFrom(dEnd));
                    if (dEnd < dStart) {
                        dEnd.changeDate(1);
                    }
                }
            }
            if (el.data('resize') != null && dStart > dEnd) {
                Date.swap(dStart, dEnd);
            }
            if (el.data('first') && oBar != null) {
                el.data('container').addClass('new_events')
                    .children(
                        'div.evt'
                        + '[data-event="' + el.data('bar').data('event') + '"]'
                        + '[data-calendar="' + el.data('bar').data('calendar') + '"]'
                    )
                    .addClass('new_event');
                el.data('first', false);
            }
            var aBarParams = {
                event   : !bCreating ? oBar.data('event') : null, 
                calendar: !bCreating ? el.data('bar').data('calendar') : null, 
                style   : el.data('style'), 
                start   : dStart, 
                end     : dEnd,
                date    : Date.baseDate(sStyle == 'daily' ? aNew.row : aNew.day),
                allDay  : sStyle == 'daily',
                title   : bCreating ? self._parent.getText('custom_create_new', 'Create new') : (oEvent != null && oEvent.length > 0 ? oEvent[0].title : null),
                titleHTML : !bCreating && oEvent != null && oEvent.length ? oEvent[0].getCalendar() != null && oEvent[0].getCalendar().titleHTML : false

            };
            var aVisibleContainer = self._findVisibleContainer(aBarParams),
                aChangesAdd = aVisibleContainer.diff(el.data('cells')),
                aChangesRemove = el.data('cells').diff(aVisibleContainer),
                oEventArea;
            for (nI = 0; nI < aChangesAdd.length; nI++) {
                oEventArea = funcFindBar(aChangesAdd[nI]);
                var oCurrentBar = oEventArea.children('.new_event'), 
                    sHTML = '';
                if (oCurrentBar.size() < 1) {
                    sHTML = funcBuild({
                        date    : aChangesAdd[nI],
                        start   : dStart, 
                        end     : dEnd,
                        allDay  : sStyle == 'daily',
                        line    : bCreating ? 0 : oBar.data(sStyle == 'daily' ? 'l' : 'e'),
                        title   : bCreating ? self._parent.getText('custom_create_new', 'Create new') : (oEvent != null && oEvent.length > 0 ? oEvent[0].title : oBar.attr('title')),
                        titleHTML : !bCreating && oEvent != null && oEvent.length > 0 ? oEvent[0].getCalendar() != null && oEvent[0].getCalendar().titleHTML : false,
                        hoverTitle  : bCreating ? self._parent.getText('custom_create_new', 'Create new') : "",
                        id          : bCreating ? null : oBar.data('event'),
                        addClass    : "new_event " + (bCreating ? "create_event" : ""),
                        calendar    : bCreating ? null : oBar.data('calendar') ,
                        className   : bCreating ? null : oBar.data('calendar') 
                        
                    });
                    oEventArea.append(sHTML).addClass('new_events');
                    if (oBar == null) {
                        if (sStyle == 'daily') {
                            oEventArea.scrollTop(0);
                        }
                        el.data('bar', oEventArea.children('.new_event'));
                    }
                } else {
                    oEventArea.addClass('new_events');
                    oCurrentBar.show();
                }
                
            }
            for (nI = 0; nI < aChangesRemove.length; nI++) {
                funcFindBar(aChangesRemove[nI]).removeClass('new_events').children('.new_event').hide();
            }
            el.data({cells : aVisibleContainer});
            var aBarToCheck = [0, 1, aVisibleContainer.length - 2, aVisibleContainer.length - 1];
            for (nI = 0; nI < aBarToCheck.length; nI++) {
                if (aVisibleContainer[aBarToCheck[nI]] != undefined && aVisibleContainer[aBarToCheck[nI]] > tLast) {
                    aBarParams.date = aVisibleContainer[aBarToCheck[nI]];
                    aBarParams.next = undefined;
                    funcMove(aBarParams);
                    tLast = aVisibleContainer[aBarToCheck[nI]];
                }
            }
            return false;
        }      
        
        self._custom_div.simpleSelect({
            "selector"      : 'div.events > div.evt, div.events, li[data-date]', // selector for start drag event
            "moveSelector"  : 'div[data-d]',                       // selector for continue drag event
            "notselector"   : ".non_e, .create_event, .hours_title",             // means that noneditbale event cannot be moved
            "touchhold"     : 1000,                 // minimum time that activate "touchhold" event
            "touchradius"   : 10,                   // maximum radius for moving finger 
            "clearStop"     : true,                 // when TRUE than on mouseUp event we at least clear drag/drop object from cell
            "checkStart"    : function(el, evt) {
                var aNew = self._getWeekDay(evt);
                return aNew.day != undefined;
            },
            'longClick'     : self._parent.getParam('longClick', false),
            "start" : function(el, evt){
                self._clearCreatingEvent(el);
                var aNew = self._getWeekDay(evt);
//                if (aNew.day == undefined) {
//                    return false;
//                }
                var evtEl = jQuery(evt.currentTarget),
                    oBar = evtEl.hasClass('evt') && !evtEl.hasClass('create_event') ? evtEl : null,
                    clickEl = jQuery(evt.target),
                    bResize = oBar != null && !oBar.hasClass('non_r') && clickEl.filter('span.l, span.r, span.t, span.b').size() > 0
                        ? (clickEl.filter('span.l, span.t').size() > 0 && !oBar.hasClass('non_ls')
                            ? true  
                            : (clickEl.filter('span.r, span.b').size() > 0 && !oBar.hasClass('non_rs') ? false : null)
                        )
                        : (oBar != null ? null : false),
                    aContainer = el.children().children('.' + aNew.style)
                        .find('div.evt[data-event="' + evtEl.data('event') + '"][data-calendar="' + evtEl.data('calendar') + '"]')
                        .parent(),
                    dStart = oBar == null 
                        ? Date.baseDate(aNew.day, 0, aNew.style == 'daily' ? 0 : aNew.hour / self._nPeriodMulti + parseInt(self._parent.aCalculated.startHour))
                        : new Date(evtEl.data('start') * 1000),
                    dEnd = oBar == null 
                        ? Date.baseDate(dStart, 0,  self._parent.params.minMinutePeriod / 60)
                        : new Date(evtEl.data('end') * 1000),
                    aBaseCells = oBar == null  ? [] : self._findVisibleContainer({'start' : dStart , "end" : dEnd, "style" : aNew.style});
                
                el.data({
                    fixedL      : oBar != null && oBar.is('.fixed_l, .fixed_r') ? oBar.is('.fixed_l') : null,
                    resize      : bResize , 
                    currentDay  : aNew.day, 
                    currentHour : aNew.hour, 
                    baseDate    : Date.baseDate(aNew.day),
                    baseHour    : aNew.hour,
                    startDate   : dStart,
                    endDate     : dEnd,
                    bar         : oBar,
                    style       : aNew.style,
                    container   : aContainer,
                    cells       : aBaseCells,
                    baseCells   : aBaseCells,
                    first       : true,
                    creating    : oBar == null,
                    noCancel    : false,
                    noChange    : true
                });
                if (oBar == null && self._parent.options.readonly.create === false) {
                    return false;
                }
                if (self._parent.isMobile() || (oBar == null ) || self._parent.getParam('longClick', false)) { // && aNew.style == 'daily'
                    _barMove(el, evt);
                }
                return false;
            },
            "stop" : function(el, evt){
                var aNew = self._getWeekDay(evt),
                    nChangeDay = -el.data('baseDate').getDaysFrom(new Date(aNew.day * 1000)),
                    nChangeHour = -(aNew.hour - el.data('baseHour')) / self._nPeriodMulti,
                    nChangeHours = nChangeDay * 24 - nChangeHour;
                if (el.data('creating')) {
                    if (self._parent.options.readonly.create === false) {
                        return true;
                    }
                    var dStart = Date.baseDate(el.data('baseDate'), 0, 
                            parseInt(self._parent.aCalculated.startHour) + el.data('baseHour') / self._nPeriodMulti),
                        dEnd = Date.baseDate(dStart, 0, nChangeHours + (nChangeHours >= 0 ? self._parent.params.minMinutePeriod / 60 : 0));
                    if (isNaN(dEnd)) {
                        return false;
                    }
                    if (dEnd < dStart) {
                        Date.swap(dEnd, dStart);
                    }                
                    el.data('noCancel', true);
                    _barMove(el, evt);
                    self._parent.layout.showCreateEventForm({
                        "cid" : "",
                        "date" : {"start" : dStart, "stop" : dEnd},
                        "el" : null,
                        "onClose" : function(evt) {
                            view.showData();
                            self._clearCreatingEvent();
                        }, 
                        "onCancel" : function(evt) {
                            self._clearCreatingEvent();
                        }, 
                        "event" : evt,
                        "allDay" : el.data('style') == 'daily'
                    });
                    return false;
                }
                
                
                
                if (nChangeHours == 0) {
                    return true;
                }
                el.data('noChange', false);
                
                var aEvents = {"type" : "list_with_calendars"};
                aEvents[el.data('bar').data('event')] = [el.data('bar').data('calendar')];
                self._custom_div.find('.evt.sel[data-event]').each(function(){
                    var sId = jQuery(this).data('event'),
                        sCalendar = jQuery(this).data('calendar')
                    if (aEvents[sId] == undefined || aEvents[sId].indexOf(sCalendar) < 0) {
                        if (aEvents[sId] == undefined) {
                            aEvents[sId] = [];
                        }
                        aEvents[sId].push(sCalendar);
                    }
                });  
                
                self._parent._events.setEvent(
                    aEvents, {
                        hour_left_change : (el.data('resize') != false ? nChangeHours : 0),
                        hour_right_change : (el.data('resize') != true ? nChangeHours : 0)
                    }
                );
                return false;
            },
            "cancel" : function(el, evt){
                if (el.data('noCancel') != undefined && el.data('noCancel')) {
                    return false;
                }
                self._clearCreatingEvent();
                if (el.data('noChange') !== true) {
                    view.showData();
                }
            },
            "move" : function(el, evt) {
                if (el.data('creating') && self._parent.options.readonly.create === false) {
                    return false;
                }

                return _barMove(el, evt);
            },
            "check" : function(el, evt) {
                var b = self._isCellChange(el, evt)
                return b;
            },
            "swipe" : function(el, evt, aDelta) {
                if (!self._parent.isMobile()) {
                    return false;
                }
                
                return self._swipe(el, evt, aDelta);
            },
            "scroll" : function(el, evt, aDelta, sMode) {
                if (sMode != undefined && sMode == 'init') {
                    divScroll = jQuery(evt.target).filter('.daily');
                    if (divScroll.size() < 1) {
                        divScroll = jQuery(evt.target).parents('.hourly, .daily');
                    }
                    aBasicScrollCoord = divScroll.scrollTop();
                    return;
                }
                divScroll.scrollTop(aBasicScrollCoord - aDelta.y);
                
            },
            
            "swipeDelta" : {x : 100, y : 30}
        });
    }
    
    self._findVisibleContainer = function(aParams) {
        var dStart = Date.baseDate(aParams.start),
            dEnd = Date.baseDate(aParams.end),
            dRealyEnd = Date.baseDate(dEnd);
        dStart.setHours(0, 0, 0, 0);
        dEnd.setHours(0, 0, 0, 0);
        var tMin = Math.max(self._aCells[0], dStart.getTime() / 1000),
            tMax = Math.min(self._aCells[self._aCells.length - 1], dEnd.getTime() / 1000),
            dCur = Date.baseDate(tMin),
            aTmp = [];
        if (aParams.style == 'hourly' && dRealyEnd.getTime() / 1000 == tMax && tMin != tMax) {
            tMax--;
        }
        while (dCur.getTime() / 1000 <= tMax ) {
            if (dCur.getTime() == dEnd.getTime() 
                && dEnd.getTime() == aParams.end.getTime() 
                && aParams.end > aParams.start
                && aParams.style == 'hourly'
            ) {
                break;
            }
            aTmp.push(dCur.getTime() / 1000);
            dCur.changeDate(1);
        }
        aTmp = self._aCells.intersect(aTmp);
        
        if (aTmp.length == 0) {
            return aTmp;
        }
        if ((aParams.style != undefined && aParams.style == 'daily') 
            || self._custom_div.data('style') == 'daily'
        ) {
            var dFirst = Date.baseDate(aTmp[0]),
                nDistance = self._period.baseDate.getDaysFrom(dFirst) % self._cols;
            if (nDistance != 0) {
                nDistance = nDistance > 0 ? nDistance - self._cols : nDistance;
                dFirst.changeDate(nDistance);
                aTmp.unshift(dFirst.getTime() / 1000);
            }
            aTmp = self._aRows.intersect(aTmp);
        }
        return aTmp;
    }

    
    self._clearCreatingEvent = function(oEl){
        self._div.find('.new_events').removeClass('new_events')
            .children('.new_event')
            .filter('.create_event').remove();
        if (oEl != undefined) {
            self._div.find('.new_event').removeClass('new_event');
        }
    }
    
    self._getWeekDay = function(evt) {
        var el = jQuery(evt.target),
            elEvents = el.is('.daily, .hourly')  ? el : el.parents('.daily, .hourly');
        if (elEvents.size() < 1) {
            
            elEvents = el.is('div[data-d]') 
                ? el.children('div.events')
                : el.parents('div[data-d]').children('div.events');
        }
        var dt = new Date(),
            divEvents = elEvents,
            sStyle = divEvents.hasClass('daily') ? 'daily' : "hourly",
            divRow = divEvents.parent(),
            dBarDate = divRow.data('date'),
            aCalculated = (
                    self._cacheCoords == undefined 
                    || dt.getTime() - 1000 > self._cacheCoords.dt
                    || dBarDate != self._cacheCoords.date
                ) 
                ? self._cacheCoords = self._getCalculatedCell(divRow, divEvents, dt)
                : self._cacheCoords,
            nX = evt.pageX || evt.originalEvent.pageX,
            nY = evt.pageY || evt.originalEvent.pageY,
//            nDay = parseInt((evt.clientX - aCalculated.aOffset.left) / aCalculated.nCellWidth),
            nDay = parseInt((nX - aCalculated.aOffset.left) / aCalculated.nCellWidth),
            nHour = sStyle == 'daily' 
                ? 0 
//                : parseInt((evt.clientY + divEvents.scrollTop() - aCalculated.aOffset.top) / 30);
                : parseInt((nY + divEvents.scrollTop() - aCalculated.aOffset.top) / 30);
        
        return {
            "divRow"    : divRow,
            "row"       : divRow.data('date'),
            "day"       : self._cacheCoords.cells.eq(nDay).data('date'),
            "hour"      : nHour,
            "style"     : sStyle
        }
    }
    
    self._getCalculatedCell = function (divWeek, divEvents, dt) {
        return {
            nCellWidth  : divWeek.children('ul').children('li').eq(0).width(),
            nBarHeight  : divWeek.height(),
            aOffset : divEvents.offset(),
            dt      : dt.getTime(),
            date    : divWeek.data('date'),
            cells   : divWeek.children('ul').children('li')
        }
    }
    
    self._isCellChange = function(el, evt) {
        var aOld = {"day" : el.data('currentDay'), "hour" : el.data('currentHour')};
        var aNew = self._getWeekDay(evt);
        el.data({currentDay : aNew.day, currentHour : aNew.hour});
        
        var b = (aOld.day != aNew.day 
            || 
            (el.data('style') == 'hourly' && aOld.hour != undefined && aOld.hour != aNew.hour));
        return b;
    }
    
     
    self._swipe = function(el, evt, aDelta) {
        if (Math.abs(aDelta.x) > 100) {
            self._parent.layout.changePeriod(aDelta.x > 0 ? -1 : 1);
        }

    }
    
    
    self._expand = function(bMode) {
        var aDivs = self._custom_div.children();
        if (bMode) {
            var nAdditionalHeight = 0;
            aDivs.each(function() {
                var el = jQuery(this),
                    divTop = el.children('.daily'),
                    divBottom = el.children('.hourly'),
                    nTopHeight = Math.max(divTop[0].scrollHeight - divTop.height(), 0),
                    nBottomHeight = Math.max(divBottom[0].scrollHeight - divBottom.height(), 0);
                
                divTop.height(divTop[0].scrollHeight);
                divBottom.height(divBottom[0].scrollHeight)
                    .css('top', divTop[0].scrollHeight + 20 + 'px');
                el.height(el.height() + nTopHeight + nBottomHeight + 20).css('bottom', 'auto');
                nAdditionalHeight += nTopHeight + nBottomHeight + 20;
            });
            
            
            self._parent._dom.el
                .height(self._parent._dom.el.height() + nAdditionalHeight);
        } else {
            self._parent._dom.el.height('');
            aDivs.height('').children('.daily, .hourly')
                .height('')
                .css('top', '').css('bottom', '');
        }
    }

    jQuery.calendarAnything.appendView('custom', view);
})();