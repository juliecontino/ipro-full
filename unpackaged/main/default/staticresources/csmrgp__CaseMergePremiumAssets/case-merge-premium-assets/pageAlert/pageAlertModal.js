
function PageAlertModal(id) {
    this.id = id;
    this.animated = false;
    this.isOpen = false;
    this.copyableMessage = null;
    this.detailsOpen = false;
    this.showCopiedPopoverTimeout1 = null;
    this.showCopiedPopoverTimeout2 = null;
    this.showDetailsSection = false;

    /** DOM Getters */
    this.findElement = function(querySelector) {
        return document.querySelector("[id$='" + this.id + "'] ." + PageAlertModal.CLASS.SELF + " " + querySelector);
    };

    this.getElement = function() {
        return this.findElement("");
    };

    this.getModalElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.SLDS_MODAL);
    };

    this.getBackdropElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.BACKDROP);
    };

    this.getHeaderElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.HEADER);
    };

    this.getTitleElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.TITLE);
    };

    this.getCloseButtonElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.CLOSE_BUTTON);
    };

    this.getMessageElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.MESSAGE);
    }

    this.getCopyButtonElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.COPY_BUTTON);
    };

    this.getCopiedPopoverElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.COPIED_POPOVER);
    };

    this.getDetailsElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.DETAILS);
    };

    this.getDetailsSectionElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.DETAILS_SECTION);
    };

    this.getDetailsToggleButtonElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.DETAILS_TOGGLE_BUTTON);
    };

    this.getDetailsTitleElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.DETAILS_TITLE);
    };

    this.getDetailsTextElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.DETAILS_TEXT);
    };

    this.getCopyableMessageTextareaElement = function() {
        return this.findElement("." + PageAlertModal.CLASS.COPYABLE_MESSAGE);
    };

    this.show = function() {
        this.isOpen = true;
        this.getModalElement().classList.add(PageAlertModal.CLASS.MODAL_OPEN);
        this.getBackdropElement().classList.add(PageAlertModal.CLASS.BACKDROP_OPEN);
    };

    this.hide = function() {
        this.isOpen = false;
        this.getModalElement().classList.remove(PageAlertModal.CLASS.MODAL_OPEN);
        this.getBackdropElement().classList.remove(PageAlertModal.CLASS.BACKDROP_OPEN);
    }

    /** Animation */
    this.setAnimated = function(animated) {
        this.animated = animated === true;
        this.getHeaderElement().setAttribute(PageAlertNotification.ATTRIBUTE.ANIMATED, this.animated);
    };

    /** Modal DOM Updates */
    this.update = function(config) {
        config = config || {};
        if(config.modal && config.modal.hasOwnProperty("animated")) {
            this.setAnimated(config.modal.animated);
        }
        this.setAnimated(config.modal.animated);
        this.setTitle(config.modal.title);
        this.setDetailsTitle(config.modal.detailsTitle);
        this.setMessage(config.message);
        this.setDetails(config.details);
        this.setCopyableMessage(config.modal.detailsTitle, config.message, config.details);
    };

    this.setTitle = function(title) {
        title = title || '';

        var titleEl = this.getTitleElement();
        titleEl.removeAllChildren();
        titleEl.appendChild(document.createTextNode(title));
    };

    this.setDetailsTitle = function(title) {
        title = title || 'Details';

        var detailsTitleEl = this.getDetailsTitleElement();
        detailsTitleEl.removeAllChildren();
        detailsTitleEl.appendChild(document.createTextNode(title));
    };

    this.setMessage = function(message) {
        message = message || '';

        var messageEl = this.getMessageElement();
        messageEl.removeAllChildren();
        messageEl.appendChild(document.createTextNode(message));
    };

    this.setDetails = function(details) {
        if(!Array.isArray(details)) {
            details = [];
        }
        
        if(details.length > 0) {
            var detailsTextEl = this.getDetailsTextElement();
            detailsTextEl.removeAllChildren();
            
            for(var i = 0; i < details.length; i++) {
                var pEl = document.createElement("p");
                pEl.appendChild(document.createTextNode(details[i]));
                detailsTextEl.appendChild(pEl);
            }
        }

        this.getDetailsElement().setAttribute(PageAlertModal.ATTRIBUTE.SHOW, details.length > 0);
    };

    this.setCopyableMessage = function(detailsTitle, message, details) {
        detailsTitle = detailsTitle || 'Details';
        message = message || '';
        if(!Array.isArray(details)) {
            details = [];
        }

        var messageParts = [];
        if(message) {
            messageParts.push('Message\n' + message);
        }

        if(details.length > 0) {
            messageParts.push(detailsTitle + '\n' + details.join('\n'));
        }

        this.copyableMessage = messageParts.join('\n\n');
    };

    /** Copy Button  */
    this.copyToClipboard = function() {
        if(navigator.clipboard) {
            var thisModal = this;
            navigator.clipboard.writeText(this.copyableMessage).then(
                function() {
                    thisModal.showCopiedPopover(); 
                }
            ).catch(() => {
                this.copyToClipboardIE();
            });
        }
        else {
            this.copyToClipboardIE();
        }
    };

    this.copyToClipboardIE = function() {
        // IE
        var copyableMessageEl = this.getCopyableMessageTextareaElement();
        copyableMessageEl.value = this.copyableMessage;
        copyableMessageEl.disabled = false;
        copyableMessageEl.select();
        copyableMessageEl.disabled = true;
        this.showCopiedPopover();
        document.execCommand('copy');   // Deprecated in other browsers.
    }
    
    this.showCopiedPopover = function() {
        clearTimeout(this.showCopiedPopoverTimeout1);
        clearTimeout(this.showCopiedPopoverTimeout2);

        var copiedPopoverEl = this.getCopiedPopoverElement();
        if(copiedPopoverEl) {
            copiedPopoverEl.style.transition = null;
            copiedPopoverEl.setAttribute(PageAlertModal.ATTRIBUTE.SHOW, true);

            this.showCopiedPopoverTimeout1 = setTimeout(function() {
                copiedPopoverEl.style.transition = "opacity 1s linear, visibility 1s linear";
            }, 100);

            this.showCopiedPopoverTimeout2 = setTimeout(function() {
                copiedPopoverEl.setAttribute(PageAlertModal.ATTRIBUTE.SHOW, false);
            }, 1500);
        }
    };
    
    /** Details Toggle */
    this.toggleModalDetailsSection = function() {
        this.detailsOpen = !this.detailsOpen;
        if(this.detailsOpen) {
            this.getDetailsSectionElement().classList.add(PageAlertModal.CLASS.SECTION_OPEN);
        }
        else {
            this.getDetailsSectionElement().classList.remove(PageAlertModal.CLASS.SECTION_OPEN);
        }
    };

    /** Theme */
    this.setTheme = function(theme) {
        if(theme === PageAlert.THEME.WARNING) {
            this.getCloseButtonElement().classList.remove(PageAlertNotification.CLASS.BUTTON_ICON_INVERSE);
        }
        else {
            this.getCloseButtonElement().classList.add(PageAlertNotification.CLASS.BUTTON_ICON_INVERSE);
        }
    };
}

PageAlertModal.CLASS = {
    SELF: "page-alert-modal",
    SLDS_MODAL: "slds-modal",
    MODAL_OPEN: "slds-fade-in-open",
    BACKDROP: "page-alert-modal-backdrop",
    BACKDROP_OPEN: "slds-backdrop_open",
    HEADER: "page-alert-modal-header",
    TITLE: "page-alert-modal-header-text",
    CLOSE_BUTTON: "page-alert-modal-close-button",
    MESSAGE: "page-alert-modal-message",
    COPY_BUTTON: "modal-copy-button",
    DETAILS: "page-alert-modal-details",
    DETAILS_SECTION: "page-alert-modal-details-section",
    DETAILS_TOGGLE_BUTTON: "page-alert-modal-details-toggle-button",
    DETAILS_TITLE: "page-alert-modal-details-title",
    DETAILS_TEXT: "page-alert-modal-details-text",
    COPYABLE_MESSAGE: "page-alert-modal-copyable-message",
    COPIED_POPOVER: "copied-text-popover",
    SECTION_OPEN: "slds-is-open"
};

PageAlertModal.ATTRIBUTE = {
    SHOW: "data-show"
}