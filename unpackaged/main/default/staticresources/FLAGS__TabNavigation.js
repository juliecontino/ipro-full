/*
 * Used for pages with LDS navigation tabs. Works with both scoped and default.
 */

// no parameter function called at the end of switchTabs.
var LDSTabsOnSwitch = null;

setTabListeners();

var tabItems = document.querySelectorAll('.slds-tabs_default__item,.slds-tabs_scoped__item');
for(var i = 0; i < tabItems.length; i++) {
    tabItems[i].style.cursor = "pointer";
}

function setTabListeners() {
    document.onkeydown = function(e) {
        var activeElement = document.activeElement;
        if((activeElement.classList.tagName != 'input' && activeElement.tagName != 'INPUT')&& !activeElement.classList.contains("slds-checkbox_faux")) {
            var activeTab = document.getElementsByClassName("slds-has-focus")[0];
            
            var leftArrowCode = 37;
            var upArrowCode = 38;
            var rightArrowCode = 39;
            var downArrowCode = 40;
            
            if(e.keyCode === leftArrowCode) {
                e.preventDefault();
                if(activeTab.previousElementSibling) {
                    switchTabs(activeTab,activeTab.previousElementSibling);
                }
                else {
                    var newTab = activeTab;
                    while(newTab.nextElementSibling) {
                        newTab = newTab.nextElementSibling;
                    }
                    switchTabs(activeTab, newTab);
                }
            }
            
            if(e.keyCode === rightArrowCode) {
                e.preventDefault();
                if(activeTab.nextElementSibling) {
                    switchTabs(activeTab,activeTab.nextElementSibling);
                }
                else {
                    var newTab = activeTab;
                    while(newTab.previousElementSibling) {
                        newTab = newTab.previousElementSibling;
                    }
                    switchTabs(activeTab, newTab);
                }
            }
        }
    }
}

// Switch top the new tab
function switchTabs(oldTab, newTab) {
    if(oldTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').id !== newTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').id) {
        document.getElementById(newTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').getAttribute('aria-controls')).classList.add('slds-show');
        document.getElementById(newTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').getAttribute('aria-controls')).classList.remove('slds-hide');
        document.getElementById(oldTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').getAttribute('aria-controls')).classList.remove('slds-show');
        document.getElementById(oldTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').getAttribute('aria-controls')).classList.add('slds-hide');
        document.getElementById(newTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').setAttribute('tabindex','0'));
        document.getElementById(oldTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').setAttribute('tabindex','-1'));
        oldTab.classList.remove('slds-is-active');
        oldTab.classList.remove('slds-has-focus')
        newTab.classList.add('slds-is-active');
        newTab.classList.add('slds-has-focus')
        newTab.querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').focus();
        if(newTab.classList.contains('slds-tabs_default__item')) {
           window.scroll(0,0);
    	}
        if(LDSTabsOnSwitch) {
            LDSTabsOnSwitch();
        }
    }
}

// switch to the given tab in the given tab navigation
function switchTabsInNav(listItem,navId) {
    var nav = document.getElementById(navId);
    var oldTab = nav.querySelector('.slds-tabs_default__item.slds-is-active,.slds-tabs_scoped__item.slds-is-active');
    switchTabs(oldTab, listItem);
}

// go to a tab with a specific title.
function goToTabWithTitle(tabTitle,navId) {
    var tabs = document.getElementById(navId).querySelectorAll('.slds-tabs_default__item,.slds-tabs_scoped__link');
    for(var i = 0; i < tabs.length; i++) {
        if(tabs[i].querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').textContent == tabTitle) {
            switchTabsInNavsInNav(tabs[i],navId);
            return;
        }
    }
}

// Get the current active tab (nested or not).
function getActiveTab() {
    var activeElement = document.activeElement;
    // get all active tabs
    var activeTabs = document.querySelectorAll('.slds-tabs_default__item.slds-is-active,.slds-tabs_scoped__item.slds-is-active');
    for(var i = activeTabs.length -1; i >= 0 ; i--) {
        if(activeTabs[i].contains(activeElement) || document.getElementById(activeTabs[i].querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').getAttribute('aria-controls')).contains(activeElement)) {
            return activeTabs[i];
        }
    }
    // By default return the outer most tab.
    return activeTabs[0];
}