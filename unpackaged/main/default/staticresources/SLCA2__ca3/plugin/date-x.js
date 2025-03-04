/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

Date.staticCache = {
    "month_days" : {},
    "month_weeks" : {},
    "year_days" : {},
    "year_weeks" : {}
}

Date.prototype.getDOY = function() {
    var onejan = new Date(this.getFullYear(),0,1),
        dCopy = Date.baseDate(this).resetHours();
    return Math.ceil((dCopy - onejan) / 86400000) + 1;
}        

Date.prototype.getWOY = function() {
    var d = Date.baseDate(this).resetHours().changeDate(4 - (this.getDay() || 7)),
        dFirst = new Date(d.getFullYear(), 0, 1),
        nWeek = Math.ceil(( ( (d - dFirst) / 86400000) + 1)/7);
    return nWeek;
}        

Date.prototype.getYearWeeks = function() {
    var sYear = this.getFullYear();
    if (typeof(Date.staticCache.year_weeks[sYear]) == 'undefined'){
        var dFirst = new Date(sYear, 0, 1),
            nDay = dFirst.getDay();
        Date.staticCache.year_weeks[sYear] = nDay == 4 || (nDay == 3 && this.getYearDays() == 366) ? 53 : 52;
    }
    return Date.staticCache.year_weeks[sYear];
};

Date.prototype.getYearDays = function() {
    var sYear = this.getFullYear();
    if (typeof(Date.staticCache.year_days[sYear]) == 'undefined'){
        var dFirst = new Date(sYear, 0, 1),
            dLast = new Date(parseInt(sYear) + 1 , 0, 1);
        Date.staticCache.year_days[sYear] = Math.ceil((dLast - dFirst) / 86400000);
    }
    return Date.staticCache.year_days[sYear];
    
};

Date.prototype.getMonthWeeks = function() {
    var nDays = this.getMonthDays(),
        dStart = Date.baseDate(this).resetHours();
    dStart.setDate(1);
    var nStartDay = dStart.getDay() || 7;
    var nResult = 4 + ((8 - (nDays - 28)) < nStartDay || nStartDay == 1 ? 1 : 0);
    return nResult;
}        



Date.prototype.getMonthDays = function() {
    var cacheStr = this.getFullYear() + "." + this.getMonth();
    if (typeof(Date.staticCache.month_days[cacheStr]) != 'undefined'){
        return Date.staticCache.month_days[cacheStr];
    }

    var dFirst = new Date(this);
    dFirst.setDate(1);
    dFirst.setMonth(dFirst.getMonth() + 1);
    dFirst.setDate(0);
    Date.staticCache.month_days[cacheStr] = dFirst.getDate();
    return dFirst.getDate();
}

Date.prototype.isCurrentMonth = function(dDate) {
    if (dDate.getFullYear() == this.getFullYear() 
        && dDate.getMonth() == this.getMonth()
        ) {
        return true;
    }
    return false;
}

Date.prototype.isCurrentYear = function(dDate) {
    return dDate.getFullYear() == this.getFullYear();
}

Date.prototype.getMonthFrom = function(dDate, bParts, bFromFisrtDay) {
    var nMonth = 12 * (this.getFullYear() - dDate.getFullYear());
    bFromFisrtDay = bFromFisrtDay || false;
    var minDate = new Date(dDate);
    if (bFromFisrtDay) {
        minDate.setDate(1); 
    }
            
    nMonth += this.getMonth() - minDate.getMonth();
    if (this.getDate() < minDate.getDate() && nMonth > 0) {
        nMonth--;
    }
    bParts = bParts || false;
    if (bParts){
        nMonth += this.getDate() / this.getMonthDays();
    }
    return nMonth;
}
        
Date.prototype.getWeekFrom = function(dDate, bParts) {
    bParts = bParts || false;
    var nWeeks = (Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()) - Date.UTC(dDate.getFullYear(), dDate.getMonth(), dDate.getDate()))  / (86400 * 1000 * 7);
    if (!bParts) {
        nWeeks = parseInt(nWeeks);
    }
    return nWeeks;
}
        
Date.prototype.getDaysFrom = function(dDate, bParts) {
    var nDays = (Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()) - Date.UTC(dDate.getFullYear(), dDate.getMonth(), dDate.getDate())) / (86400 * 1000);
    if (!bParts) {
//        nDays = (Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()) - Date.UTC(dDate.getFullYear(), dDate.getMonth(), dDate.getDate())) / (86400 * 1000);
        nDays = parseInt(nDays);
//    } else {
//        nDays = (Date.UTC(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), 0) - Date.UTC(dDate.getFullYear(), dDate.getMonth(), dDate.getDate(), dDate.getHours(), dDate.getMinutes(), 0)) / (86400 * 1000);
    }
    return nDays;
}

Date.prototype.getHoursFrom = function(dDate, bParts) {
    var nHours = (Date.UTC(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), 0) - Date.UTC(dDate.getFullYear(), dDate.getMonth(), dDate.getDate(), dDate.getHours(), dDate.getMinutes(), 0)) / (3600 * 1000);
    if (!bParts) {
        nHours = parseInt(nHours);
    }
    return nHours;
}

        
Date.prototype.getMonthName = function() {
    var aDate = this.toString().split(" ");
    return aDate[1];
}

Date.prototype.getMinDate = function(){
    var d = this;
    var aCompare = [];
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] instanceof Array 
            || (arguments[i] instanceof Object) && arguments[i].length > 0
        ) {
            for (var j = 0; j < arguments[i].length; j++) {
                aCompare.push(arguments[i][j]);
            }
        } else if (arguments[i] instanceof Date) {
            aCompare.push(arguments[i]);
        }
    }
    
    for (var i = 0; i < aCompare.length; i++) {
        if (d > aCompare[i]) {
            d.setTime(aCompare[i].valueOf());
        }
    }
    return d;
}


Date.prototype.getMaxDate = function(){
    var d = this;
    var aCompare = [];
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] instanceof Array 
            || (arguments[i] instanceof Object) && arguments[i].length > 0
        ) {
            for (var j = 0; j < arguments[i].length; j++) {
                aCompare.push(arguments[i][j]);
            }
        } else if (arguments[i] instanceof Date) {
            aCompare.push(arguments[i]);
        }
    }
    for (var i = 0; i < aCompare.length; i++) {
        if (d < aCompare[i]) {
            d.setTime(aCompare[i].valueOf());
        }
    }
    return d;
}

Date.getMinDate = function() {
    
    if (arguments.length == 0) {
        return null;
    }
    var d = new Date(arguments[0]);
    d.getMinDate(arguments)
    return d;
}


Date.getMaxDate = function() {
    
    if (arguments.length == 0) {
        return null;
    }
    var d = new Date(arguments[0]);
    d.getMaxDate(arguments)
    return d;
}


Date.prototype.changeDate = function(nDay) {
    if (nDay == undefined || nDay == 0) { 
        return this;
    }
    this.setDate(this.getDate() + nDay);
    return this;
}

Date.prototype.changeMonth = function(nMonth) {
    if (nMonth == undefined) {
        return this;
    }
    var nCurDay = this.getDate();
    this.setMonth(this.getMonth() + nMonth);
    var nFinalDay = this.getDate();
    if (nFinalDay != nCurDay) {
        this.changeDate(-nFinalDay);
    }
    //if (this.getMonth() - nMonth);
    return this;
}

Date.prototype.changeHour = function(nHour) {
    if (nHour == undefined) {
        return this;
    }
    var nMinutes = parseInt(60 * (nHour - parseInt(nHour))),
        nCurHour = this.getHours();
    this.setHours(nCurHour + parseInt(nHour), this.getMinutes() + nMinutes, this.getSeconds());
    if ((nHour == 1 || nHour == -1 ) && nCurHour == this.getHours()) {
        this.changeHour(nHour * 2);
    }
    return this;
}

Date.prototype.changeSecond = function(nSecond) {
    if (nSecond == undefined) {
        return this;
    }
    this.setSeconds(this.getSeconds() + nSecond);
    return this;
}

Date.prototype.toHourStep = function(nHourStep, bToUp) {
    bToUp = bToUp == undefined ? false : bToUp;
    var nSeconds = nHourStep * 3600,
        nDateSeconds = this.getHours() * 3600 + this.getMinutes() * 60 + this.getSeconds(),
        nDivision = nDateSeconds % nSeconds;
    if (nDivision != 0 || bToUp) {
        this.setHours(0, 0, nDateSeconds + nSeconds - nDivision, 0);
//        this.setMinutes(minutesValue, secondsValue, msValue)(0);
//        this.setSeconds();
    }
    return this;
}

Date.prototype.setDay = function(dDate) {
    if (dDate == undefined) {
        return this;
    }
    
    this.setTime(dDate.getTime());
    this.setHours(0,0,0,0);
    return this;
}

Date.prototype.setWeekDay = function(nDayOfWeek) {
    this.setDate(this.getDate() - this.getDay() + nDayOfWeek);
    return this;
};

Date.prototype.resetFirstWeekDay = function(nFirst) {
    nFirst = parseInt(nFirst);
    var dStartOfWeek = this.getDay();// || 0;
//    nFirst = nFirst || 0;
    if (dStartOfWeek == nFirst) {
        return this;
    }
    dStartOfWeek += dStartOfWeek < nFirst ? 7 : 0;
    this.setDate(this.getDate() - dStartOfWeek + nFirst);
    return this;
}

Date.prototype.resetHours = function() {
    this.setHours(0, 0, 0, 0);
    return this;
}

Date.prototype.getQuarterStart = function() {
    var dResult = new Date(this);
    var nMonth = parseInt(dResult.getMonth() / 3) * 3;
    dResult.setMonth(nMonth);
    dResult.setDate(1);
    return dResult;
}

//Date.prototype.getTimeStamp()

Date.preParse = function(sDate, sFormat) {
    
    var tDate = typeof(sDate) == 'number' 
        ? new Date(sDate * 1000)
        : (typeof(sDate) == 'object' 
            ? new Date(sDate) 
            : (sFormat != undefined ? NaN : Date.parse(sDate))
        );
    if (isNaN(tDate) && sFormat != undefined) {
        tDate = Date.preParseByFormat(sDate.toString(), sFormat);
    }
    if (isNaN(tDate)) {
        tDate = Date.parse(sDate.toString().replace(/-/g, "/"));
    } 
    if (isNaN(tDate) && typeof(sDate) == 'string') {
        if (sDate.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}$/) != null) {
            tDate = Date.parse(sDate.replace(' ', "T"));
        } else if (sDate.match(/^[0-9]{2}.[0-9]{2}.[0-9]{4}$/) != null) {
            tDate = new Date();
            var aTmp = sDate.split('\.');
            tDate.setFullYear(aTmp[2], aTmp[1] - 1, aTmp[0]);
        } else if (sDate.match(/^[0-9]{2,4}.[0-9]{2}.[0-9]{2,4}$/) != null) {
            tDate = Date.parse(sDate.replace(' ', "T").replace(/\./g, "/"));
        }
    }
    if (isNaN(tDate)) {
        tDate = 0;
    }
    return new Date(tDate);
}

Date.preParseSF = function(sDate, sType) {
    var tDate = null;
    if (sType == 'DATE') {
        if (sDate.match(/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/) != null) {
            tDate = new Date();
            var aTmp = sDate.split('/');
            tDate.setFullYear(aTmp[2], aTmp[1] - 1, aTmp[0]);
        }
        if (tDate == null ||isNaN(tDate)) {
            tDate = Date.preParse(sDate);
        }
    } else if (sType == 'DATETIME') {
        if (sDate.match(/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$/) != null) {
            tDate = new Date();
            var aTmp = sDate.split(' ')[0].split('/');
            tDate.setFullYear(aTmp[2], aTmp[1] - 1, aTmp[0]);
            aTmp = sDate.split(' ')[1].split(':');
            tDate.setHours(aTmp[0], aTmp[1], aTmp[2]);
        }
        if (tDate == null ||isNaN(tDate)) {
            tDate = Date.preParse(sDate);
        }
    }
    return tDate;
}

Date.baseDate = function(mDate, nDay, nHour) {
    mDate = mDate || new Date();
    var oDay = Date.preParse(mDate);
        //new Date(typeof(mDate) == 'number' ? mDate * 1000 : mDate);
    if (nDay != undefined && nDay != 0) {
        oDay.changeDate(nDay);
    }
    if (nHour != undefined && nHour != 0) {
        oDay.changeHour(nHour);
    }
    return oDay;
}

Date.swap = function(dDate1, dDate2) {
    var dTmp = new Date(dDate1);
    dDate1.setTime(dDate2.getTime());
    dDate2.setTime(dTmp);
}

Date.getTimeStamp = function() {
    if (Date.now == undefined) {
        Date.now = function() {
            return (new Date()).getTime();
        }
    }
    return Date.now();
}


if (Date.prototype.toISOString == undefined) {
    Date.prototype.toISOString = function() {
        var nMonth = 1 + this.getUTCMonth(),
            nDay = 1 + this.getUTCDate(),
            nHours = this.getUTCHours(),
            nMinutes = this.getUTCMinutes(),
            nSeconds = this.getUTCSeconds();
        
        var sResult = this.getUTCFullYear() + '-' 
            + (nMonth < 10 ? "0" : '') + nMonth + '-' 
            + (nDay < 10 ? "0" : '') + nDay + 'T'
            + (nHours < 10 ? "0" : '') + nHours + ':'
            + (nMinutes < 10 ? "0" : '') + nMinutes + ':'
            + (nSeconds < 10 ? "0" : '') + nSeconds + '.000Z';
        return sResult
    }
}

if (Date.prototype.format == undefined) {
    Date.prototype.formatWhat = ['dd', 'd', 
                'hh', 'h', 
                'yyyy', 'yy' , 
                '(:ii)', 'ii', 'ss', 'z', 
                'aa', 'a',
                'mmmm', 'mmm', 'MM', 'mm',
                'eeee', 'eee' , 'w'
                ];
    Date.prototype.formatTo = ['Date', 'Date', 
                'Hours', 'Hours', 
                'FullYear', 'FullYear',  
                'Minutes', 'Minutes', 'Seconds', 'TimezoneOffset', 
                'Hours', 'Hours',
                'Month', 'Month', 'Month', 'Month',
                'Day', 'Day', 'Day',
    ];
    
    Date.prototype.formatRegexp = ['[0-9]{2}', '[0-9]{1,2}', 
                '[0-9]{2}', '[0-9]{1,2}', 
                '[0-9]{4}', '[0-9]{2}' , 
//                '[|\(\:0-9\)]{0,2}', '[0-9]{2}', '[0-9]{2}', 'z', 
                '[\\:0-9]{0,3}', '[0-9]{2}', '[0-9]{2}', 'z', 
                '(AM|PM)', '(a|p)',
                '(January|February|March|April|May|June|July|August|September|October|November|December)', 
                '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', 
                '[0-9]{2}', '[0-9]{1,2}',
                '(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)', 
                '(Sun|Mon|Tue|Wed|Thu|Fri|Sat)', 
                '[0-7]{1}'
                ];
    
    Date.prototype.formatText =  {
            "week" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "weekShort" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            "month" : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            "monthShort" : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    };
    
    Date.prototype.format = function(sFormat, bUtc) {
        var nValue,
            sResult = sFormat;
        if (sResult === undefined || sResult == '')  {
            return '';
        }
        for (var nI = 0; nI < Date.prototype.formatWhat.length; nI++) {
            if (this['get' + (bUtc ? 'UTC' : '') + Date.prototype.formatTo[nI]] != undefined) {
                nValue = this['get' + (bUtc ? 'UTC' : '') + Date.prototype.formatTo[nI]]();
            } else {
                nValue = '';
            }
            switch(Date.prototype.formatWhat[nI]) {
                case 'eee' :
                    nValue = Date.prototype.formatText.weekShort[nValue];
                    break;
                case 'eeee' :
                    nValue = Date.prototype.formatText.week[nValue];
                    break;
                case 'mmm' :
                    nValue = Date.prototype.formatText.monthShort[nValue];
                    break;
                case 'mmmm' :
                    nValue = Date.prototype.formatText.month[nValue];
                    break;
                case 'h' :
                    nValue = nValue % 12 == 0 ? 12 : nValue % 12;
                    break;
                case '(:ii)' :
                    nValue = nValue > 0 ? ':' + ((nValue < 10 ? '0' : '') + nValue) : '';
                    break;
                case 'mm' :
                    nValue++
                    break;
//                    nValue = (nValue < 10 ? '0' : '')  + nValue;
                case 'MM' :
                    nValue++;
                case 'yy' :
                    nValue = nValue % 100;
                case 'dd' :
                case 'hh' :
                case 'ii' :
                case 'ss' :
                    nValue = (nValue < 10 ? '0' : '') + nValue;
                    break;
                case 'aa' :
                    nValue = (nValue  >= 12) ? 'PM' : 'AM';
                    break;
                case 'a' :
                    nValue = (nValue  >= 12)  ? 'p' : 'a';
                    break;
                    
                    
            }
            sResult = sResult.replace(Date.prototype.formatWhat[nI], nValue);
        }
        return sResult;
    }
}

Date.preParseByFormat = function(sDate, sFormat) {
    var sRegexp = sFormat, dReturn;
    for (var nI = 0; nI < Date.prototype.formatWhat.length; nI++) {
        sRegexp = sRegexp.replace(
            Date.prototype.formatWhat[nI], 
            Date.prototype.formatRegexp[nI]
        );
    }
    sRegexp.replace('\\', '\\\\').replace('.', '\\.');
//    console.log(sRegexp);
    var oRegexp = new RegExp('^' + sRegexp + '$', 'igm');
    if (!oRegexp.test(sDate) && true) {
        return null;
    } 
    
    var aResult = {},
        sTemporaryFormat = sFormat,
        aSearchOrder = ['mmmm', 'mmm', 'eeee', 'eee', 'mm', 'd', 'h', 
                'dd',
                'hh',  
                'yyyy', 'yy' , 
                '(:ii)', 'ii', 'ss', 'z', 
                'aa', 'a',
                'MM', 
                'w'
                ],
        aSpecialFormatTo = {"aa" : "ampm", "a" : "ampm"},
        nI, nPos, sCurrentMode, sFormatTo;
    
    for (var nSearch = 0; nSearch < aSearchOrder.length; nSearch++) {
        nI = Date.prototype.formatWhat.indexOf(aSearchOrder[nSearch]);
        sCurrentMode = Date.prototype.formatWhat[nI];
        sFormatTo = aSpecialFormatTo[sCurrentMode] != undefined
            ? aSpecialFormatTo[sCurrentMode]
            : Date.prototype.formatTo[nI];
        nPos = sTemporaryFormat.indexOf(sCurrentMode);
        if (nPos == -1 || aResult[sFormatTo] != undefined) {
            continue;
        }
        if ((sCurrentMode == 'd' || sCurrentMode == 'h')
            && (sTemporaryFormat.indexOf(sCurrentMode == 'd' ? 'dd' : 'hh') >= 0)
        ) {
            continue;
        }
        var sFound = sDate.substr(nPos),
            sResult = '';
        switch(sCurrentMode) {
            case 'dd' :
            case 'hh' :
            case 'yy' :
            case 'MM' :
            case 'ii' :
            case 'ss' :
            case 'aa' :
                sResult = sFound.substring(0, 2);
                break;
            case 'mm' :
            case 'd' :
            case 'h' :
                sResult = parseInt(sFound.substring(0, 2));
                break;
            case 'a' :
                sResult = parseInt(sFound.substring(0, 1));
                break;
            case 'yyyy' :
                sResult = sFound.substring(0, 4);
                break;
            case 'mmmm' :
            case 'mmm' :
            case 'eeee' :
            case 'eee' :
                oRegexp.compile('^' + Date.prototype.formatRegexp[nI], 'igm');
                sResult = oRegexp.exec(sFound);
                if (sResult != null && sResult.length > 0) {
                    sResult = sResult[0];
                }
                break;
            case '(:ii)' :
                if (sFound.substr(0, 1) == ':') {
                    sResult = sFound.substr(1, 2)
                }
                break;
            default : 
                break;
        }
        if (sResult != null && (sResult != '' || sCurrentMode == '(:ii)')) {
//            console.log('old format' +  sTemporaryFormat + ' / ' + sResult + ' / ' + sCurrentMode);
            sTemporaryFormat = sTemporaryFormat.substring(0, nPos)
                + (sCurrentMode == '(:ii)' && sResult != '' ? ':' : '')
                + sResult
                + sTemporaryFormat.substring(nPos + sCurrentMode.length);
//            console.log('new format' +  sTemporaryFormat);
            if (sCurrentMode == 'mmmm') {
                sResult = 1 + Date.prototype.formatText.month.indexOf(sResult);
            } else if (sCurrentMode == 'mmm') {
                sResult = 1 + Date.prototype.formatText.monthShort.indexOf(sResult);
            } else if (sCurrentMode == 'yy') {
                var nY = new Number(sResult);
                sResult = 2000 + nY;
            } 
        }
        
//        console.log('found at pos ', nPos, sResult, sCurrentMode);
        aResult[sFormatTo] = sResult;
//        sRegexp = sFormat.replace(
//            Date.prototype.formatWhat[nI], 
//            Date.prototype.formatRegexp[nI]
//        );
//        if (sRegexp == sFormat) {
//            continue;
//        }
//        oRegexp.compile(sRegexp, 'igm');
//        console.log(oRegexp, oRegexp.exec(sDate));
//        aResult[Date.prototype.formatTo[nI]] = oRegexp.exec(sDate);
    }
//    console.log(aResult);
    dReturn = new Date();
    
    dReturn.setFullYear(aResult['FullYear'], aResult['Month'] - 1, aResult['Date']);
    if (dReturn != null 
        && !isNaN(dReturn) 
        && aResult['Hours'] != undefined 
        && aResult['Hours'] != '' 
        && !isNaN(aResult['Hours'])
    ) {
        if (aResult['ampm'] != undefined) {
            if (aResult['Hours'] == 12 && (aResult['ampm'] == 'a' || aResult['ampm'] == 'AM')) {
                aResult['Hours'] = 0;
            }
            if (aResult['Hours'] < 12  && (aResult['ampm'] == 'p' || aResult['ampm'] == 'PM')){
                aResult['Hours'] += 12;
            }
        }
        dReturn.setHours(
            aResult['Hours'], 
            aResult['Minutes'] !== undefined && !isNaN(aResult['Minutes']) ? aResult['Minutes'] : 0, 
            aResult['Seconds'] !== undefined && !isNaN(aResult['Seconds']) ? aResult['Seconds'] : 0
        );
    }
    return dReturn;
}

Date.prototype.isMidNight= Date.prototype.isMidNight || function() {
    return this.getHours() == 0 && this.getMinutes() == 0 && this.getSeconds() == 0 && this.getMilliseconds() == 0;
}

Date.prototype.isValid = Date.prototype.isValid || function(){
    if ( Object.prototype.toString.call(this) !== "[object Date]" ) {
        return false;
    }
    return !isNaN(this.getTime());
}

Date.prototype.isSameDay= Date.prototype.isSameDay || function(dCompare) {
    return this.getDate() == dCompare.getDate()
        && this.getFullYear() == dCompare.getFullYear()
        && this.getMonth() == dCompare.getMonth()
}

Date.prototype.isSameMonth= Date.prototype.isSameMonth || function(dCompare) {
    return this.getFullYear() == dCompare.getFullYear()
        && this.getMonth() == dCompare.getMonth()
}


Date.prototype.changeTimeZone = function(nOffset, bReverse, nCurrentTZ) {
    bReverse = bReverse || false;
    nCurrentTZ = nCurrentTZ === undefined ? this.getTimezoneOffset() : parseInt(nCurrentTZ);
    var nUTC = this.getTime() + ((bReverse ? nOffset : nCurrentTZ) * 60000);
    this.setTime(nUTC - (60000 * (bReverse ? nCurrentTZ : nOffset)));
    return this;
    
}