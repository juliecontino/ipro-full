/**
 *  01/30/18    BE@IC   (00156539)
 *  USE: Javascript for SLDS Tabs (https://www.lightningdesignsystem.com/components/tabs/)
 *  Allows for arrow movement and the user to switch tabs on click.
 *  REQUIREMENTS
 *      [1] An id attribute to be added to any divs with the class 'slds-tabs_default'
 *      [2] The html data attribute 'data-navigation-id' to be added to each tab list item. The value of this field should be the id listed in the previous step.
 *      [3] Each div with class 'slds-tabs_default', and each div containing tab content should have the html data attribute 'data-tab-name' 
            that should have a name for the corresponding tab.
 *  OPTIONAL
 *      [1] The controller may store a list of strings containing all the tab names to make setting up 'data-tab-name' simpler.
 */
NAVIGATION_TABS = {
    NAV_ID_ATTR: 'data-navigation-id',
    TAB_NAME_ATTR: 'data-tab-name',
    ACTIVE_TAB_CLASS: 'slds-is-active',
    TAB_ITEM_CLASS: 'slds-tabs_default__item',
    SCOPED_TAB_ITEM_CLASS: 'slds-tabs_scoped__item',
    TAB_CONTENT_CLASS: 'slds-tabs_default__content',
    SCOPED_TAB_CONTENT_CLASS: 'slds-tabs_scoped__content',
    SHOW_CLASS: 'slds-show',
    HIDE_CLASS: 'slds-hide',
    KEY_CODE_MAP: {
        "left": 37,
        "up": 38,
        "right": 39,
        "down": 40
    },
    CAN_USE_ARROWS: true,
    DIRECTION_NEXT: 'next',
    DIRECTION_PREVIOUS: 'prev',

    switchNavigationTab: function(newActiveNavigationTab) {
        var navId = newActiveNavigationTab.getAttribute(this.NAV_ID_ATTR);
        var goToTabName = newActiveNavigationTab.getAttribute(this.TAB_NAME_ATTR);
        var currentTab = this.getActiveTab();
        var currentTabName = currentTab.getAttribute(this.TAB_NAME_ATTR);
        // Same tab
        if(currentTabName === goToTabName) {
            return;
        }
        var navigationContentWrappers = document.querySelectorAll('#' + navId + ' .' + this.TAB_CONTENT_CLASS + ', #' + navId + ' .' + this.SCOPED_TAB_CONTENT_CLASS);
        var navigationTabs = document.querySelectorAll('#' + navId + ' .' + this.TAB_ITEM_CLASS + ', #' + navId + ' .' + this.SCOPED_TAB_ITEM_CLASS);
        for(var i = 0; i < navigationTabs.length; i++) {
            if(navigationTabs[i].getAttribute(this.TAB_NAME_ATTR) === goToTabName) {
               this.focusTab(navigationTabs[i]);
            }
            if(navigationTabs[i].getAttribute(this.TAB_NAME_ATTR) === currentTabName) {
                this.unfocusTab(navigationTabs[i]);
            }
        }
        
        for(var i = 0; i < navigationContentWrappers.length; i++) {
            if(navigationContentWrappers[i].getAttribute(this.TAB_NAME_ATTR) === goToTabName) {
                this.showTabContent(navigationContentWrappers[i]);
            }
            if(navigationContentWrappers[i].getAttribute(this.TAB_NAME_ATTR) === currentTabName) {
                this.hideTabContent(navigationContentWrappers[i]);
            }
        }
    },
    
    showTabContent: function(tabContent) {
        tabContent.classList.add(this.SHOW_CLASS);
        tabContent.classList.remove(this.HIDE_CLASS);
    },
    
    hideTabContent: function(tabContent) {
        tabContent.classList.add(this.HIDE_CLASS);
        tabContent.classList.remove(this.SHOW_CLASS);
    },
    
    focusTab: function(tab) {
        tab.classList.add(this.ACTIVE_TAB_CLASS);
    },
    
    unfocusTab: function(tab) {
        tab.classList.remove(this.ACTIVE_TAB_CLASS);
    },
    
    getActiveTab: function() {
        var activeElement = document.activeElement;
        // get all active tabs
        var activeTabs = document.querySelectorAll('.'+this.TAB_ITEM_CLASS + '.' + this.ACTIVE_TAB_CLASS + ',.' + this.SCOPED_TAB_ITEM_CLASS + '.' + this.ACTIVE_TAB_CLASS);
        for(var i = activeTabs.length -1; i >= 0 ; i--) {
            if(activeTabs[i].contains(activeElement)) {
                // || document.getElementById(activeTabs[i].querySelector('a.slds-tabs_default__link,a.slds-tabs_scoped__link').getAttribute('aria-controls')).contains(activeElement)
                return activeTabs[i];
            }
        }
        // By default return the outer most tab.
        return activeTabs[0];
    },

    moveToAdjacentTab: function(direction) {
        var activeTab = this.getActiveTab();
        var navId = activeTab.getAttribute(this.NAV_ID_ATTR);
        if(direction === this.DIRECTION_NEXT) {
            var hasNextTab = activeTab.nextElementSibling !== null;
            if(hasNextTab) {
                // go to next
                this.switchNavigationTab(activeTab.nextElementSibling);
            }
            else {
                // wrap back to first
                this.switchNavigationTab(document.querySelector('#' + navId + ' .' + this.TAB_ITEM_CLASS + ' , #' + navId + ' .' + this.SCOPED_TAB_ITEM_CLASS));
            }
        }
        else {
            var hasPrevTab = activeTab.previousElementSibling !== null;
            if(hasPrevTab) {
                // go to prev
                this.switchNavigationTab(activeTab.previousElementSibling);
            }
            else {
                // wrap to last.
                var tabs = document.querySelectorAll('#' + navId + ' .' + this.TAB_ITEM_CLASS + ' , #' + navId + ' .' + this.SCOPED_TAB_ITEM_CLASS);
                this.switchNavigationTab(tabs[tabs.length - 1]);
            }
        }
    },

    canUseArrowMovement: function() {
        if(!this.CAN_USE_ARROWS) {
            return false;
        }

        var activeElement = document.activeElement;
        if(activeElement.tagName.toLowerCase() === 'select' || activeElement.tagName.toLowerCase() === 'textarea') {
            return false;
        }

        var ignoredInputTypes = ['checkbox','submit','button']
        if(activeElement.tagName.toLowerCase() === 'input' && ignoredInputTypes.indexOf(activeElement.getAttribute('type').toLowerCase()) === -1) {
            return false;
        }

        return true;
    },
    
    setupArrowKeyListeners: function(callback) {
        if(this.CAN_USE_ARROWS) {
            // 'this' will become document in the event listener.
            var helper = this;
            document.addEventListener('keydown',
                function(e) {
                    if(helper.isLeftOrRightArrowKey(e.keyCode)) {
                        var direction = (e.keyCode > helper.KEY_CODE_MAP.up) ? helper.DIRECTION_NEXT : helper.DIRECTION_PREVIOUS;
                        if(helper.canUseArrowMovement()) {
                            e.preventDefault();
                            helper.moveToAdjacentTab(direction);
                            if(typeof(callback) === 'function') {
                                callback();
                            }
                        }
                    }
                }
            );
        }
    },

    disableArrowMovement: function() {
        this.CAN_USE_ARROWS = false;
    },

    enableArrowMovement: function() {
        this.CAN_USE_ARROWS = true;
    },

    isArrowKey: function(keyCode) {
        return keyCode >= this.KEY_CODE_MAP.left && keyCode <= this.KEY_CODE_MAP.down;
    },

    isLeftOrRightArrowKey: function(keyCode) {
        return keyCode === this.KEY_CODE_MAP.left || keyCode === this.KEY_CODE_MAP.right;
    }


}