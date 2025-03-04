/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _parent     : null,
        _period     : {min : new Date(), max : new Date()}
    };
    var view = {};

    /** 
    * public init
    * @param div - div for view / unused
    * @param parent - parent CA
    * Init all necessary data
    */

    view.init = function (div, parent){
        self._parent = parent;
    }
    
    /** 
    * @public show
    * draw grid
    * @param aParams - income parameters
    * @return void;
    */
    
    
    view.show = function(aParams) {
        aParams = aParams || {};
        self._period.min.setTime(aParams.min != undefined ? aParams.min : self._parent.options.current.getTime());
        self._period.min.resetFirstWeekDay(self._parent.params.startWeekDay);
        self._period.max.setTime(self._period.min);
        
        self._period.max.changeDate(parseInt(self._parent.params.showWeekEnds) - 1);
        aParams.min = self._period.min;
        aParams.max = self._period.max;
        self._parent._initView('print/day', function(){
            var oView = self._parent._getView('print/day');
            if (oView != undefined) {
                oView.show(aParams);
            }
        });
    }
    
    jQuery.calendarAnything.appendView('print/week', view);
})();