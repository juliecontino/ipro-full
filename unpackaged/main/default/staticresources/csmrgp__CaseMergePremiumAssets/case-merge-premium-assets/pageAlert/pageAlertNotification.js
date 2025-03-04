function PageAlertNotification(id) {
    this.id = id;
    this.theme = PageAlert.THEME.NONE;
    this.animated = false;
    this.size = PageAlertNotification.SIZE.SMALL;
    this.collapsed = true
    this.message = null;
    this.successHideTimeout = null;
    this.hasDetails = false;

    /** Expand/Collapse the Notification */
    this.displayPageAlert = function(show) {
        clearTimeout(this.successHideTimeout);
        this.collapsed = show !== true;
        this.getElement().setAttribute(PageAlertNotification.ATTRIBUTE.COLLAPSED, this.collapsed);
    };
    
    this.show = function() {
        this.displayPageAlert(true);
    };
    
    this.hide = function() {
        this.displayPageAlert(false);
    };
    
    /** Animate the notification background */
    this.setAnimated = function(animated) {
        this.animated = animated === true;
        this.getElement().setAttribute(PageAlertNotification.ATTRIBUTE.ANIMATED, this.animated);
    };
    
    /** Set the notification message */
    this.setMessage = function(message) {
        clearTimeout(this.successHideTimeout);
        this.message = message || '';

        // Remove the current message
        var messageEl = this.getMessageElement();
        messageEl.removeAllChildren();
        
        // Add the new message
        var messageTextEl = document.createElement("span");
        messageTextEl.appendChild(document.createTextNode(this.message));
        messageTextEl.classList.add(PageAlertNotification.CLASS.MESSAGE_TEXT);
        messageEl.appendChild(messageTextEl);

        // Adjust the height of the alert.
        this.adjustHeight(messageTextEl);
    };

    this.adjustHeight = function(messageTextEl) {
        var messageHeight = messageTextEl.getBoundingClientRect().height;
        if(messageHeight > PageAlertNotification.MESSAGE_HEIGHT_ONE_LINE) {
            this.setLarge();
        }
        else {
            this.setSmall();
        }
    };
    
    /** Sizing */
    this.setSize = function(size) {
        this.size = size;
        this.getElement().setAttribute(PageAlertNotification.ATTRIBUTE.SIZE, this.size);
    };

    this.setLarge = function() {
        this.setSize(PageAlertNotification.SIZE.LARGE);
    };
    
    this.setSmall = function() {
        this.setSize(PageAlertNotification.SIZE.SMALL);
    };
    

    /** Theme */
    this.setTheme = function(theme) {
        this.theme = theme;
        if(theme === PageAlert.THEME.WARNING) {
            this.getCloseButtonElement().classList.remove(PageAlertNotification.CLASS.BUTTON_ICON_INVERSE);
        }
        else {
            this.getCloseButtonElement().classList.add(PageAlertNotification.CLASS.BUTTON_ICON_INVERSE);
        }
    };

    /** Updates */
    this.update = function(config) {
        config = config || {};
        if(config.notification && config.notification.hasOwnProperty("animated")) {
            this.setAnimated(config.notification.animated);
        }
        this.setMessage(config.message);

        this.hasDetails = Boolean(config.details) && config.details.length > 0;
        var displayViewDetailsLink = this.hasDetails;
        if(!displayViewDetailsLink) {
            var messageTextEl = this.getMessageTextElement();
            displayViewDetailsLink = messageTextEl.getBoundingClientRect().height > PageAlertNotification.MAX_HEIGHT;
        }

        this.displayViewDetailsLink(displayViewDetailsLink);
    };

    this.displayViewDetailsLink = function(show) {
        if(show) {
            this.getViewDetailsLinkElement().classList.remove(PageAlertNotification.CLASS.HIDE);
        }
        else {
            this.getViewDetailsLinkElement().classList.add(PageAlertNotification.CLASS.HIDE);
        }
    };

    /** DOM Getters */
    this.findElement = function(querySelector) {
        return document.querySelector("[id$='" + this.id + "'] ." + PageAlertNotification.CLASS.SELF + " " + querySelector);
    };

    this.getElement = function() {
        return this.findElement("");
    }

    this.getCloseButtonElement = function() {
        return this.findElement("." + PageAlertNotification.CLASS.CLOSE_BUTTON);
    };

    this.getMessageElement = function() {
        return this.findElement("." + PageAlertNotification.CLASS.MESSAGE);
    };

    this.getMessageTextElement = function() {
        return this.findElement("." + PageAlertNotification.CLASS.MESSAGE_TEXT);
    };


    this.getViewDetailsLinkElement = function() {
        return this.findElement("." + PageAlertNotification.CLASS.VIEW_DETAILS_LINK);
    };
};

PageAlertNotification.CLASS = {
    SELF: "page-alert-notification",
    CLOSE_BUTTON: "page-alert-close-button",
    MESSAGE: "page-alert-message",
    MESSAGE_TEXT: "page-alert-message-text",
    VIEW_DETAILS_LINK: "page-alert-view-details-link",
    BUTTON_ICON_INVERSE: "slds-button_icon-inverse",
    HIDE: "slds-hide"
};

PageAlertNotification.ATTRIBUTE = {
    COLLAPSED: "data-collapsed",
    ANIMATED: "data-animated",
    SIZE: "data-size"
};

PageAlertNotification.SIZE = {
    SMALL: "small",
    LARGE: "large"
};

// Used to determine if the notification should increase in size for a second line.
PageAlertNotification.MESSAGE_HEIGHT_ONE_LINE = 17;
PageAlertNotification.MAX_HEIGHT = 54;