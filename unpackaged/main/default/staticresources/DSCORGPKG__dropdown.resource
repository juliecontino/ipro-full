var DropdownPlugin;
(function($) {
    function Dropdown(element, config) {
        if (element == null) {
            throw new TypeError('Element cannot be null');
        }

        if (typeof element.fn === 'undefined') {
            element = $(element);
        }
        this._element = element;
        this._config = this._getConfig(config);
        this._menu = this._element.closest('.slds-combobox_container').find('.slds-dropdown')[0];
        if (!this._menu) {
            throw new TypeError('Could not find dropdown menu');
        }

        this._addEventListeners();
        this.updateSelections();
    }

    Dropdown.prototype.toggle = function() {
        if (this._element.hasClass('disabled')) {
            return;
        }

        var parent = this._element.closest('.slds-combobox_container');
        var isActive = $(this._menu).is(':visible');

        Dropdown._clearAllMenus();

        if (isActive) {
            return;
        }

        this._element.attr('aria-expanded', true);
        $(this._menu).show();
        parent.addClass('js-dropdown-show');
    };

    Dropdown.prototype.updateSelections = function() {
        var numSelected = $(this._menu).find('input[type="checkbox"]:checked').length;
        var text = this._config.emptyText;
        if (numSelected === 1) {
            text = '1 ' + this._config.singleText;
        } else if (numSelected > 1) {
            text = numSelected + ' ' + this._config.multipleText;
        }
        this._element.find('.slds-dropdown-text').attr('placeholder', text);
    }

    Dropdown.prototype.disable = function() {
        this._element.addClass('disabled');
    }

    Dropdown.prototype.enable = function() {
        this._element.removeClass('disabled');
    }

    Dropdown.prototype._addEventListeners = function() {
        var _this = this;
        this._element.on('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            _this.toggle();
        });

        $(this._menu).find('input[type="checkbox"]').change(function() {
            _this.updateSelections();
        });
    };

    Dropdown.prototype._getConfig = function(config) {
        return {
            emptyText: config.emptyText || this._element.data('emptyText') || 'Select',
            singleText: config.singleText || this._element.data('singleText') || 'Selected',
            multipleText: config.multipleText || this._element.data('multipleText') || 'Selected'
        };
    }

    Dropdown._clearAllMenus = function(event) {
        var toggles = [].slice.call(document.querySelectorAll('[data-toggle="slds-dropdown"]'));
        toggles.forEach(function(toggle) {
            var $toggle = $(toggle);
            var $parent = $toggle.closest('.slds-combobox_container');
            var context = $toggle.data('slds.dropdown');

            if (!context) {
                return;
            }

            if (!$parent.hasClass('js-dropdown-show')) {
                return;
            }

            if (event && $.contains(context._menu, event.target)) {
                return;
            }

            $toggle.attr('aria-expanded', false);
            $(context._menu).hide();
            $parent.removeClass('js-dropdown-show');
        });
    };

    Dropdown._jqueryInterface = function(config) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('slds.dropdown');
            var _config = typeof config === 'object' ? config : null;

            if (!data) {
                data = new Dropdown($this, _config);
                $this.data('slds.dropdown', data);
            }

            if (typeof config === 'string') {
                if (typeof data[config] === 'undefined') {
                    throw new TypeError('No method named ' + config);
                }
                data[config]();
            }
        });
    };

    $(document)
        .on('click', Dropdown._clearAllMenus)
        .on('click', '[data-toggle="slds-dropdown"]', function(event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).sldsDropdown('toggle');
        })

    DropdownPlugin = Dropdown;
    $.fn.sldsDropdown = Dropdown._jqueryInterface;
})(jQuery);