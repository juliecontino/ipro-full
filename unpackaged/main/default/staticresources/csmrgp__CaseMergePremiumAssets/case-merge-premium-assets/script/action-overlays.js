/**
 *  01/30/18    BE@IC   (00156539)
 *  USE: Use for overlays of a div or entire page.
 *  onstart = setEnableTabsForDiv(false,divId);
 *  onstop = setEnableTabsForDiv(true,divId,elementToFocus);
 *  If you want to prevent tabbing for the whole page, divID should be null.
 */
ACTION_OVERLAYS = {

    setEnableTabsForPage: function(isEnabled) {
        this.setEnableTabs(isEnabled,document);
    },
    
    setEnableTabsForDiv: function(isEnabled, divId) {
        this.setEnableTabs(isEnabled,document.getElementById(divId));
    },
    
    setEnableTabs: function(isEnabled, scope) {
        var allFocusableElementsInScope = scope.querySelectorAll('input,select,textarea,button,a,area,iframe,[tabindex]');
        for(var i = 0; i < allFocusableElementsInScope.length; i++) {
            var element = allFocusableElementsInScope[i];
            var tabIndexValue = isEnabled ? "0" : "-1";
            element.setAttribute('tabindex',tabIndexValue);
        }
        document.activeElement.blur();
    },
    
    setEnableTabsForPageExceptDiv: function(isEnabled, divId) {
        this.setEnableTabsForPage(isEnabled);
        this.setEnableTabsForDiv(!isEnabled,divId);
    }
}