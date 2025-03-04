(function(){
    var self = function(sRule, dStart, dEnd, dPeriodStart, dPeriodEnd){
        this._sRule = sRule;
        this._dStart = dStart;
        this._dEnd = dEnd || null;
        this._dMax = dPeriodEnd != null ? new Date(dPeriodEnd) : null;
        this._aRuleParts = [];
        this._sType = '';
        this._aParams = {'INTERVAL' : 1};
        this._aDates = [];
        this._nTimeLength = -1;
        this._dMin = dPeriodStart != null ? new Date(dPeriodStart) : null;
        this._nMinTime = this._dMin != null ? this._dMin.getTime() : 0;
//        console.log('== ' + dStart + ' / ' + dEnd);
        
        this._parseRule();
        
    };
    
    self.prototype._aTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    self.prototype._aWeekDays = {'SU' : 0, 'MO' : 1, 'TU' : 2, 'WE' : 3, 'TH' : 4, 'FR' : 5, 'ST' : 6}
    
    self.prototype._parseRule = function(){
        this._aRuleParts = this._sRule.split(';');
        
        for (var nJ = 0; nJ < this._aRuleParts.length; nJ++) {
            if (this._aRuleParts[nJ].trim() == '') {
                continue;
            }
            
            var aTmp = this._aRuleParts[nJ].split('=');
            this._aParams[aTmp[0]] = aTmp[1];
        }
//        console.log(this._aRuleParts);
        if (this._aParams['FREQ'] == undefined || this._aTypes.indexOf(this._aParams['FREQ']) < 0) {
            return;
        }
        this._sType = this._aParams['FREQ'];
        
        
        if (this._aParams['UNTIL'] != undefined && this._aParams['UNTIL'] != '') {
            var dRealMax = Date.preParse(this._aParams['UNTIL'], 'yyyyMMddThhiissz');
            if (dRealMax.getTime() < 1) {
                dRealMax = Date.preParse(this._aParams['UNTIL'], 'yyyyMMddThhiiss');
            }
            this._dMax = this._dMax == null ? dRealMax : this._dMax.getMinDate(dRealMax);
        }
        
        if (this._dEnd != undefined && this._dEnd != null) {
            this._nTimeLength = this._dEnd.getTime() - this._dStart.getTime();
        }
        this._aParams['INTERVAL'] = parseInt(this._aParams['INTERVAL']);
        
        switch (this._sType) {
            case 'DAILY' :
                this._parseDaily();
                break;
            case 'WEEKLY' :
                this._parseWeekly();
                break;
            case 'MONTHLY' :
                if (this._aParams['BYMONTHDAY'] != undefined) {
                    this._parseMonthly();
                } else if (this._aParams['BYDAY'] != undefined) {
                    this._parseMonthlyWeekly();
                }
                break;
            case 'YEARLY' :
                if (this._aParams['BYDAY'] != undefined) {
                    this._parseYearlyWeekly();
                } else {
                    this._parseYearly();
                }
                break;
        }
    }
    
    self.prototype._parseDaily = function(){
        var dCur = Date.baseDate(this._dStart, this._aParams['INTERVAL']),
            dTo = new Date(),
            nMaxCount = this._aParams['COUNT'] != undefined ? parseInt(this._aParams['COUNT']) : 999;
        
        for (
            var nI = 0; 
            nI < nMaxCount && (this._dMax == null || dCur < this._dMax); 
            nI++, dCur.changeDate(this._aParams['INTERVAL'])
        ){
            if (!this._checkMinPeriod(dCur, true)) {
                continue;
            }
            if (this._nTimeLength >= 0) {
                dTo.setTime(dCur.getTime() + this._nTimeLength);
            }
            this._aDates.push({
                'start' : new Date(dCur),
                'end'   : this._nTimeLength >= 0 ? new Date(dTo) : null
            });
        }
        
    }
    
    self.prototype._parseWeekly = function(){
        var dWeek = Date.baseDate(this._dStart),
            dNextWeek = new Date(),
            dCur = new Date(),
            dTo = new Date(),
            nMaxCount = this._aParams['COUNT'] != undefined ? parseInt(this._aParams['COUNT']) : 999,
            nWeekStart = this._aParams['WKST'] != undefined && this._aWeekDays[this._aParams['WKST']] != undefined
                ?this._aWeekDays[this._aParams['WKST']]
                : 1;
        dWeek.changeDate(7 *  this._aParams['INTERVAL']);
        dWeek.resetFirstWeekDay(nWeekStart);
        dNextWeek.setTime(dWeek.getTime());
        dNextWeek.changeDate(7 *  this._aParams['INTERVAL']);
//        console.log('' + dWeek);
        if (this._aParams['BYDAY'] == undefined || this._aParams['BYDAY'] == '') {
            this._aParams['BYDAY'] = 'MO,TU,WE,TH,FR,ST,SU';
        }
        var aDays = this._aParams['BYDAY'].split(',');
            
        for (
            var nI = 0;
            nI < nMaxCount && (this._dMax == null || dWeek < this._dMax);
            nI++, 
            dWeek.setTime(dNextWeek.getTime()),
            dNextWeek.changeDate(7 *  this._aParams['INTERVAL'])
        ){
            if (!this._checkMinPeriod(dNextWeek)) {
                continue;
            }
            for (var nJ = 0; nJ < aDays.length; nJ++) {
                if (typeof(this._aWeekDays[aDays[nJ]]) == 'undefined') {
                    continue;
                }
//                console.log('dWeek ' + dWeek + ' / ' + this._dStart);
                dCur.setTime(dWeek.getTime());
                dCur.setWeekDay(this._aWeekDays[aDays[nJ]] ); // + (nWeekStart > 0 ? 7 : 0) ? ?? ???? 
                if (!this._checkMinPeriod(dCur, true)) {
                    continue;
                }
                if (this._nTimeLength >= 0) {
                    dTo.setTime(dCur.getTime() + this._nTimeLength);
                }
                
                this._aDates.push({
                    'start' : new Date(dCur),
                    'end'   : this._nTimeLength >= 0 ? new Date(dTo) : null
                });
            }
        }
    }
    
    self.prototype._parseMonthly = function(){
        var dMonth = Date.baseDate(this._dStart),
            dNextMonth = new Date(),
            dCur = new Date(),
            dTo = new Date(),
            nMaxDays = 0,
            nCurDay = 0,
            nMaxCount = this._aParams['COUNT'] != undefined ? parseInt(this._aParams['COUNT']) : 999;
            
        dMonth.changeMonth(this._aParams['INTERVAL']);
        dMonth.setDate(1);
        dNextMonth.setTime(dMonth.getTime());
        dNextMonth.changeMonth(this._aParams['INTERVAL']);
        
//        console.log('' + dWeek);
        if (this._aParams['BYMONTHDAY'] == undefined || this._aParams['BYMONTHDAY'] == '') {
            this._aParams['BYMONTHDAY'] = '' + dCur.getDate();
        }
        var aDays = this._aParams['BYMONTHDAY'].split(',');
            
        for (
            var nI = 0; 
            nI < nMaxCount && (this._dMax == null || dMonth < this._dMax); 
            nI++, 
            dMonth.setTime(dNextMonth.getTime()),
            dNextMonth.changeMonth(this._aParams['INTERVAL'])
        ){
            if (!this._checkMinPeriod(dNextMonth)) {
                continue;
            }
            nMaxDays = dMonth.getMonthDays();
            for (var nJ = 0; nJ < aDays.length; nJ++) {
                nCurDay = parseInt(aDays[nJ]);
                if (nCurDay < 1 || nCurDay > nMaxDays) {
                    continue;
                }
                dCur.setTime(dMonth.getTime());
                dCur.setDate(nCurDay);
                if (!this._checkMinPeriod(dCur, true)) {
                    continue;
                }
                if (this._nTimeLength >= 0) {
                    dTo.setTime(dCur.getTime() + this._nTimeLength);
                }
                this._aDates.push({
                    'start' : new Date(dCur),
                    'end'   : this._nTimeLength >= 0 ? new Date(dTo) : null
                });
            }
            
            console.log('month ' + dMonth);
//            if (nI > 1000) {
//                break;
//            }
        }
    }
    
    self.prototype._parseMonthlyWeekly = function(){
        var dMonth = Date.baseDate(this._dStart).changeMonth(this._aParams['INTERVAL']),
            dNextMonth = new Date(),
            dCur = new Date(),
            dTo = new Date(),
            nMaxCount = this._aParams['COUNT'] != undefined ? parseInt(this._aParams['COUNT']) : 999;
//            nWeekStart = this._aParams['WKST'] != undefined && this._aWeekDays[this._aParams['WKST']] != undefined
//                ?this._aWeekDays[this._aParams['WKST']]
//                : 1;
            
//        dMonth.changeMonth(this._aParams['INTERVAL']);
        dMonth.setDate(1);
        dNextMonth.setTime(dMonth.getTime());
        dNextMonth.changeMonth(this._aParams['INTERVAL']);
//        console.log('' + dWeek);
        if (this._aParams['BYDAY'] == undefined || this._aParams['BYDAY'] == '') {
            this._aParams['BYDAY'] = '1MO';
        }
        var aDays = this._aParams['BYDAY'].split(','),
            sWeekDay;
        aDays = aDays.unique();
        for (var nJ = 0; nJ < aDays.length; nJ++) {
            if (aDays[nJ].length == 2) {
                sWeekDay = aDays[nJ];
                aDays[nJ] = '1' + sWeekDay;
                aDays.push('2' + sWeekDay, '3' + sWeekDay, '4' + sWeekDay, '5' + sWeekDay);
            }
        }
        aDays = aDays.unique();
        
        for (var nI = 0; 
            nI < nMaxCount && (this._dMax == null || dMonth < this._dMax); 
            nI++,
            dMonth.setTime(dNextMonth.getTime()),
            dNextMonth.changeMonth(this._aParams['INTERVAL'])
        ){
            if (!this._checkMinPeriod(dNextMonth)) {
                continue;
            }
            for (var nJ = 0; nJ < aDays.length; nJ++) {
                dCur = this._getMonthWeekDay(aDays[nJ], dMonth);
                if (dCur == null || !this._checkMinPeriod(dCur, true)) {
                    continue;
                }
                if (this._nTimeLength >= 0) {
                    dTo.setTime(dCur.getTime() + this._nTimeLength);
                }
                this._aDates.push({
                    'start' : new Date(dCur),
                    'end'   : this._nTimeLength >= 0 ? new Date(dTo) : null
                });
            }
        }
    }
    
    self.prototype._parseYearlyWeekly = function(){
        var dYear = Date.baseDate(this._dStart).changeMonth(12 * this._aParams['INTERVAL']),
            dNextYear = new Date(),
            dMonth = Date.baseDate(this._dStart),
            dNextMonth = new Date(),
            dCur = new Date(),
            dTo = new Date(),
            nMaxCount = this._aParams['COUNT'] != undefined ? parseInt(this._aParams['COUNT']) : 999;
//            nWeekStart = this._aParams['WKST'] != undefined && this._aWeekDays[this._aParams['WKST']] != undefined
//                ?this._aWeekDays[this._aParams['WKST']]
//                : 1;
        
        dYear.setMonth(0);
        dNextYear.setTime(dYear.getTime());
        dNextYear.changeMonth(12 * this._aParams['INTERVAL']);
        
        var aMonths = this._aParams['BYMONTH'].split(','),
            aDays = this._aParams['BYDAY'].split(','),
            nWeek,
            sWeekDay;
        aDays = aDays.unique();
        for (var nJ = 0; nJ < aDays.length; nJ++) {
            if (aDays[nJ].length == 2) {
                sWeekDay = aDays[nJ];
                aDays[nJ] = '1' + sWeekDay;
                aDays.push('2' + sWeekDay, '3' + sWeekDay, '4' + sWeekDay, '5' + sWeekDay);
            }
        }
        aDays = aDays.unique();
        
        for (var nY = 0;
            nY < nMaxCount && (this._dMax == null || dYear < this._dMax); 
            nY++,
            dYear.setTime(dNextYear.getTime()),
            dNextYear.changeMonth(12 * this._aParams['INTERVAL'])
        ){
            if (!this._checkMinPeriod(dNextYear)) {
                continue;
            }
            dMonth.setTime(dYear.getTime());
            for (var nI = 0; 
                nI < aMonths.length && (this._dMax == null || dMonth < this._dMax); 
                nI++
            ){
                dMonth.setMonth(aMonths[nI] - 1);
                dMonth.setDate(1);
                dNextMonth.setTime(dMonth.getTime());
                dNextMonth.changeMonth(1);
                if (!this._checkMinPeriod(dNextMonth)) {
                    continue;
                }
//                console.log('month ' + dMonth + ' / ' + aMonths[nI]);
                for (var nJ = 0; nJ < aDays.length; nJ++) {
                    dCur = this._getMonthWeekDay(aDays[nJ], dMonth);
                    if (dCur == null || !this._checkMinPeriod(dCur, true)) {
                        continue;
                    }
                    if (this._nTimeLength >= 0) {
                        dTo.setTime(dCur.getTime() + this._nTimeLength);
                    }
                    this._aDates.push({
                        'start' : new Date(dCur),
                        'end'   : this._nTimeLength >= 0 ? new Date(dTo) : null
                    });
                }
            }
//            if (nY > 1000) {
//                break;
//            }
        }
    }
    
    self.prototype._parseYearly = function(){
        var dYear = Date.baseDate(this._dStart),
            dNextYear = new Date(),
            dCur = new Date(),
            dTo = new Date(),
            nCurMonth = 0,
            nMaxCount = this._aParams['COUNT'] != undefined ? parseInt(this._aParams['COUNT']) : 999;
            
//        dYear.setMonth(1);
        dYear.changeMonth(12 * this._aParams['INTERVAL']);
        dNextYear.setTime(dYear.getTime());
        dNextYear.changeMonth(12 * this._aParams['INTERVAL']);
        var aMonths = this._aParams['BYMONTH'].split(',');
            
        for (var nI = 0; 
            nI < nMaxCount && (this._dMax == null || dYear < this._dMax); 
            nI++, 
            dYear.setTime(dNextYear.getTime()),
            dNextYear.changeMonth(12 * this._aParams['INTERVAL'])
        ){
            if (!this._checkMinPeriod(dNextYear)) {
                continue;
            }
            for (var nJ = 0; nJ < aMonths.length; nJ++) {
                nCurMonth = parseInt(aMonths[nJ]);
                if (nCurMonth < 1 || nCurMonth > 12) {
                    continue;
                }
                dCur.setTime(dYear.getTime());
                dCur.setMonth(nCurMonth - 1);
                if (!this._checkMinPeriod(dCur, true)) {
                    continue;
                }
                if (this._nTimeLength >= 0) {
                    dTo.setTime(dCur.getTime() + this._nTimeLength);
                }
                this._aDates.push({
                    'start' : new Date(dCur),
                    'end'   : this._nTimeLength >= 0 ? new Date(dTo) : null
                });
            }
        }
    }
    
    
    
    self.prototype._getMonthWeekDay = function(sDay, dMonth){
        var dCur = new Date(dMonth),
            nWeek, sWeekday;
        if (sDay.length == 4) {
            nWeek = parseInt(sDay.substring(0, 2));
            sWeekday = sDay.substring(2, 4);
        } else if (sDay.length == 3) {
            nWeek = parseInt(sDay.substring(0, 1));
            sWeekday = sDay.substring(1, 3);
        }
        if (typeof(this._aWeekDays[sWeekday]) == 'undefined') {
            return null;
        }
        if (nWeek < 0) {
            dCur.setTime(dMonth.getTime());
            dCur.setDate(dMonth.getMonthDays());
            dCur.setWeekDay(this._aWeekDays[sWeekday]);
            if (!dCur.isSameMonth(dMonth)) {
                dCur.changeDate(-7);
            }
            dCur.changeDate((7 * (nWeek + 1)));
        } else {
            dCur.setTime(dMonth.getTime());
            dCur.setWeekDay(this._aWeekDays[sWeekday]);
            dCur.changeDate((7 * (nWeek - 1 + (dCur < dMonth ? 1 : 0))));
        }

        if (!dCur.isSameMonth(dMonth)) {
            return null;
        }
        return dCur;
    }
    
    self.prototype._checkMinPeriod = function(dDate, bMax) {
        if ((this._dMin != undefined 
                && dDate < this._dMin 
                && (this._nTimeLength < 0 || dDate.getTime() + this._nTimeLength < this._nMinTime)
            )
            ||
            (bMax === true && this._dMax != undefined && dDate > this._dMax)
        ) {
            return false;
        }
        return true;
    }
    
    
    self.prototype.getDates = function(){
        return this._aDates;
    }
    
    
    
    
    Date.fRRuleParse = function(sRule, dStart, dEnd, dPeriodStart, dPeriodEnd){
        var oSelf = new self(sRule, dStart, dEnd, dPeriodStart, dPeriodEnd);
        return oSelf.getDates();
    }    
    
    Date.parseICALDate = function(sSecondTag, sDateString, bTagLength, sLocalTimeZone) {
        var bAllDay = false,
            dDate = null,
            dMoment;
        if (bTagLength) {
            if (sSecondTag == 'VALUE=DATE') {
                bAllDay = true;
                dDate = Date.preParse(sDateString, 'yyyyMMdd');
                dDate.resetHours();
            } else if (sSecondTag.substring(0, 5) == 'TZID='){
                dMoment = moment.tz(sDateString, sSecondTag.substring(5));
//                if (sLocalTimeZone != undefined && sLocalTimeZone != '') {
//                    dMoment.tz(sLocalTimeZone);
//                }
                dDate = dMoment.toDate();
                        //new Date((Date.preParse(aLine[1], 'yyyyMMddThhiiss').format('yyyy-MM-dd hh:ii:ss') ));
            } else {
                dDate = new Date((Date.preParse(sDateString, 'yyyyMMddThhiissz').format('yyyy-MM-ddThh:ii:ss') + 'Z'));
                if (isNaN(dDate) || Math.abs(dDate.getTime()) < 86400000) {
                    dDate = new Date((Date.preParse(sDateString, 'yyyyMMddThhiiss').format('yyyy-MM-ddThh:ii:ss') ));
                }
            }
        
        } else {
            dDate = new Date((Date.preParse(sDateString, 'yyyyMMddThhiissz').format('yyyy-MM-ddThh:ii:ss') + 'Z'));
            //dDate = Date.preParse(Date.preParse(sDateString, 'yyyyMMddThhiissz').format('yyyy-MM-dd hh:ii:ss') + 'Z');
            if (isNaN(dDate) || Math.abs(dDate.getTime()) < 86400000) {
                dDate = new Date((Date.preParse(sDateString, 'yyyyMMddThhiiss').format('yyyy-MM-ddThh:ii:ss') ));
                //dDate = Date.preParse(Date.preParse(sDateString, 'yyyyMMddThhiiss').format('yyyy-MM-dd hh:ii:ss') );
            }
        }
        if (!bAllDay && sLocalTimeZone != undefined && sLocalTimeZone != '') {
            var dM = moment(dDate),
                sFormated = dM.tz(sLocalTimeZone).format('YYYY-MM-DDTHH:mm:ss');
//            dDate = new Date();
            dDate = Date.preParse(sFormated, 'yyyy-MM-ddThh:ii:ss');
        }
        
//        if (nNewTZ != undefined) {
//            dDate.changeHour(parseInt(nNewTZ) / 60);
//  
//console.log('wrong date ', sSecondTag, sDateString, bTagLength, sLocalTimeZone, 'result ' + dDate);      
        return {
            date : dDate,
            allDay : bAllDay
        }
    }
    
})();

