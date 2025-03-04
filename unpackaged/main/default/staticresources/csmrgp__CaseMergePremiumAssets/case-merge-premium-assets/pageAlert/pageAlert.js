/**
 *  Used to create a JavaScript instance for a PageAlert Visualforce Component.
 */
function PageAlert(id) {
    this.id = id;
    this.theme = PageAlert.THEME.NONE;
    this.notification = new PageAlertNotification(id);
    this.modal = new PageAlertModal(id);

    /** DOM Getters */
    this.findElement = function(querySelector) {
        return document.querySelector("[id$='" + this.id + "'] ." + PageAlert.CLASS.PAGE_ALERT + " " + querySelector);
    };

    this.getElement = function() {
        return this.findElement("");
    }

    this.getNotificationElement = function() {
        return this.findElement("." + PageAlert.CLASS.NOTIFICATION);
    };

    this.getModalElement = function() {
        return this.findElement("." + PageAlert.CLASS.MODAL);
    };

    /** Theming */
    this.setTheme = function(theme) {
        clearTimeout(this.successHideTimeout);
        if([PageAlert.THEME.ERROR, PageAlert.THEME.INFO, PageAlert.THEME.OFFLINE, PageAlert.THEME.NONE, PageAlert.THEME.WARNING, PageAlert.THEME.SUCCESS].indexOf(theme) === -1) {
            theme = PageAlert.THEME.NONE;
        }
        this.theme = theme;
        this.getElement().setAttribute(PageAlert.ATTRIBUTE.THEME, this.theme);
        this.notification.setTheme(theme);
        this.modal.setTheme(theme);
    };

    this.updateFromJSON = function(pageAlertJSON, options) {
        options = options || {};
        var pageAlertInfo;
        try {
            pageAlertInfo = JSON.parse(pageAlertJSON);
        }
        catch(err) {}
        if(pageAlertInfo) {
            for(var prop in options) {
                pageAlertInfo[prop] = options[prop];
            }
        }
        this.update(pageAlertInfo);
    }

    this.update = function(config) {
        config = config || {};
        this.setTheme(config.theme);
        this.notification.update(config);
        this.modal.update(config);

        if(config.show) {
            this.notification.show();
        }
        else {
            this.notification.hide();
            this.modal.hide();
        }
    };
}

// All Classes used
PageAlert.CLASS = {
    PAGE_ALERT: "page-alert",
    NOTIFICATION: "page-alert-notification",
    MODAL: "page-alert-modal"
};

// Page Alert HTML Attributes
PageAlert.ATTRIBUTE = {
    THEME: "data-theme"
};

// Page Alert Themes
PageAlert.THEME = {
    NONE : "none",
    INFO : "info",
    SUCCESS : "success",
    ERROR : "error",
    WARNING : "warning",
    OFFLINE : "offline"
};


// Use this to create a PageAlert object.
// Will create the object as well as setup event listeners automatically.
PageAlert.newInstance = function(id, options) {
    options = options || {};
    var pageAlert = new PageAlert(id, options);

    // Set the event listeners for this page alert.
    var notificationCloseButtonHandler = function(e) {
        pageAlert.notification.hide();
    };
    pageAlert.notification.getCloseButtonElement().addEventListener("click", notificationCloseButtonHandler);

    var viewDetailsLinkHandler = function(e) {
        pageAlert.modal.show();
    };
    pageAlert.notification.getViewDetailsLinkElement().addEventListener("click", viewDetailsLinkHandler);

    var modalCloseButtonHandler = function(e) {
        pageAlert.modal.hide();
    };
    pageAlert.modal.getCloseButtonElement().addEventListener("click", modalCloseButtonHandler);

    var modalCopyButtonHandler = function(e) {
        pageAlert.modal.copyToClipboard();
    };
    pageAlert.modal.getCopyButtonElement().addEventListener("click", modalCopyButtonHandler);

    var modalDetailsToggleHandler = function(e) {
        pageAlert.modal.toggleModalDetailsSection();
    };
    pageAlert.modal.getDetailsToggleButtonElement().addEventListener("click", modalDetailsToggleHandler);

    window.addEventListener("resize", function(e) {
        pageAlert.notification.update({
            message: pageAlert.notification.message,
            details: (pageAlert.notification.hasDetails) ? ['detail'] : []  // Will not actually change the details, but need it to confirm whether or not we need the View Details link.
        });
    });

    return pageAlert;
};

// Removes all child nodes from a node.
if(typeof Node.removeAllChildren !== "function") {
    Node.prototype.removeAllChildren = function() {
        while(this.lastChild) {
            this.removeChild(this.lastChild);
        }
    }
}