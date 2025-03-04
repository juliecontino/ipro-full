/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

(function(){
    var self = {
        _css        : '/css/calendar-edit.css',
        _parent     : null,
        _div        : null,
        _sCalendarId : null,
        _sCalendarType : null,
        _aStructure : null,
        _dom        : {},
        _filterView : null,
        _aList      : [],
        _bClone     : false,
        _aListColumns : {
            "sf" : ['name', 'color', 'owner_name', 'object', 'start', 'end', 'title', 'ownership'],
            'web' : ['name', 'color', 'owner_name', 'url'],
            'group' : ['name', 'color', 'owner_name', 'calendars']
        },
        _sMode : 'edit',
        _aPredefineLayoutFields     : {},
        _sCurrentObject             : "",
        _aAvaibleForCheckLayouts    : ['lead', 'opportunity', 
        'event', 'task', 'campaign', 'account', 'contact', 'case', 'contracts', 
        'solution', 'product', 'asset', 'user'],
        _editTitles : {},
        _buttonTitles : {},
        _bOldinsideEdit : null,
        _nMaxCalendars  : 100,
        _nListPage : 0
    };
    var view = {};
    
    view.init = function(div, parent) {
        self._parent = parent;
        self._div = div;
        self._setTexts();
        self._parent.loadCss(self._css);
        self._bOldinsideEdit = self._parent.params.showAdditionalFields;
    }
    
    view.show = function(params) {
        self._show(params);
    }
    
    view.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        } 
        if (self._filterView != null) {
            return self._filterView.action(sAction, el, evt);
        }
    }
    
    self._show = function(params) {
        self._nRules = 0;
        self._sCalendarId = params.calendar;
        self._sCalendarType = params.type;
        self._bClone = params.clone === true ? params.clone : false;
        
        if (self._dom.div == undefined 
            || self._dom.div == null 
            || self._bOldinsideEdit != self._parent.params.showAdditionalFields
            || (jQuery.browser.msie )//&& jQuery.browser.version == 10)
        ) {
            self._buildBaseHTML();
            self._bOldinsideEdit = self._parent.params.showAdditionalFields;
        }
        self._dom.div.removeClass('_mode_edit _mode_list').addClass('_mode_' + params.mode);
        self._dom.div.find('.ca_reference_selector').removeClass('show');
//        console.log(self._dom.selector);
        self._sMode = params.mode;
        if (params.mode == 'edit') {
            self._loadCalendarProp();
        } else {
            self._dom.selectList.val(self._sCalendarType);
            self._loadCalendarsList({init : true, page : 0, text : ""});
        }
        self._initEvents();
    }
    
    self._buildBaseHTML = function() {
        var sHTML = 
            '<div class="CA_calendar_edit">'
                + '<div class=edit_form_title><span>'
                        + self._parent.getText('cs_calendar_settings', 'Calendar Settings')
                    + '</span>'
                    + '<div>'
                    + '<a class="small_button" data-action="prev_step">'
                        + self._parent.getText('prev', 'Prev')
                    + '</a>'
                    + '<select name="step"></select>'
                    + '<a class="small_button" data-action="next_step">' 
                        + self._parent.getText('next', 'Next')
                    + '</a>'
                    + '</div>'
                + '</div>'
                + '<div class="calendar_edit_name">'
                    + '<span class="_text"></span>'
                + '</div>'
                + '<div class="edit_form_fields">'
                    + '<div data-type="sf">' + self._buildSFForm() + '</div>'
                    + '<div data-type="group">' + self._buildGroupForm() + '</div>'
                    + '<div data-type="web">' + self._buildWebForm() + '</div>'
                + '</div>'
                
//                + '<div class="ca_reference_selector"></div>'
            
                + '<div class="CA_calendar_list">'
                    + '<div data-type="sf">' + self._buildSFList() + '</div>'
                    + '<div data-type="group">' + self._buildGroupList() + '</div>'
                    + '<div data-type="web">' + self._buildWebList() + '</div>'
                + '</div>'
                + '<div class="form_buttons">'
                    + '<select>'
                        + (self._parent._calendars.getPermission('Read', 'sf') == true 
                            ? '<option value="sf">' + self._parent.getText('cs_tab_calendars', 'Calendars' )
                            : '')
                        + (self._parent._calendars.getPermission('Read', 'group') == true 
                            ? '<option value="group">' + self._parent.getText('cs_tab_groups', 'Groups') 
                            : '')
                        + (self._parent._calendars.getPermission('Read', 'web') == true 
                            ? '<option value="web">' + self._parent.getText('cs_web_calendars', 'Web calendars')
                            : '')
                    + '</select>'
                    + '<span data-action="add_calendar">' + self._parent.getText('ce_add_calendar', 'Add Calendar') + '</span>'
                    + '<span data-action="save_calendar">' + self._parent.getText('save', 'Save') + '</span>'
                    + '<span data-action="cancel">' + self._parent.getText('cancel', 'Cancel') + '</span>'
                    + '<span data-action="prev">&lt;</span>'    
                    + '<span data-action="next">&gt;</span>'
                    + '<input type="text" class="_element" placeholder="' + self._parent.getText('search', 'Search') + '"/>'
                + '</div>'
            + '</div>'
        ;
        self._dom.div = jQuery(sHTML);
        self._dom.title = self._dom.div.find('.edit_form_title');
        self._dom.calendar = self._dom.div.find('.calendar_edit_name');
        self._dom.fields = self._dom.div.find('.edit_form_fields');
        self._dom.selector = self._dom.div.find('.ca_reference_selector');
        self._dom.list = self._dom.div.find('.CA_calendar_list');
        self._dom.selectList = self._dom.div.find('.form_buttons > select');
        self._dom.searchList = self._dom.div.find('.form_buttons > input');
    }
    
    self._buildSFForm = function() {
        var sHTML = '<div>' 
                + '<div class="_title">1. ' + self._parent.getText('ce_step_1', 'Calendar Name & Color') + '</div>'
                + '<div class="_fields " >'
                    + '<div class="_cols_2">'
                        + '<span data-field="name"><span>' 
                            + self._parent.getText('ce_calendar_name', 'Calendar Name')
                        + '</span><input placeholder="'
                            + self._parent.getText('ce_calendar_name_ph', 'Enter Calendar Name')
                        + '" required maxlength="80" /></span>'
                        + '<span data-field="color"><span>' 
                            + self._parent.getText('ce_calendar_color', 'Calendar Color')
                        + '</span>' 
                        + '<span class=_color_selector style="background-color:#89d248" /><input type="hidden" value="#89d248" />'
//                        + self._calendarColorTemplate()
                        + '</span>'
                    + '</div>'
                    + '<div class="_cols_2">'
                        + '<span data-field="friendlyName"><span>' 
                            + self._parent.getText('ce_site_calendar_name', 'SiteCalendar Name')
                        + '</span><input readonly/></span>'
                        + '<span data-field="id"><span>' 
                            + self._parent.getText('ce_calendar_id', 'Calendar ID')
                        + ' </span><input readonly/></span>'
                    + '</div>'
                + '</div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_1', 'Enter a name for this calendar and select a color for the entries that are displayed when activated.  The SiteCalendar Name field will automatically populate and is used when publishing via Force.com sites.  Calendar ID is used when creating Dymanic and Embedded Calendars.  Refer to the CalendarAnything Admin Guide for more details.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">2. ' + self._parent.getText('ce_step_2', 'Object & Entry Details') + '</div>'
                + '<div class="_fields ">'
                    + '<div class="_cols_2">'
                        + '<span data-temp="object_type"><span>' 
                                + self._parent.getText('ce_object_type', 'Object type')
                            + '</span><select>'
                            + '<option value=0>' + self._parent.getText('ce_all', 'All')
                            + '<option value=1>' + self._parent.getText('ce_custom', 'Custom')
                            + '<option value=2>' + self._parent.getText('ce_standard', 'Standard')
                            + '<option value=3>' + self._parent.getText('ce_specified', 'Specified')
                            + '</select>'
                        + '</span>'
                        + '<span data-field="object_name"><span>' 
                            + self._parent.getText('ce_object_name', 'Object Name')
                        + '</span><select "data-referenced_select=object_ref_name"></select></span>'
                        + '<span data-field="entry_name"><span>' 
                            + self._parent.getText('ce_entity_name', 'Entry Name')
                        + '</span><select required></select></span>'
                    + '</div>'
                    + '<div class="_cols_2">'
                        + '<span data-field="start_field"><span>' 
                            + self._parent.getText('ce_entity_start', 'Entry Start')
                        + '</span><select required></select></span>'
                        + '<span data-field="end_field"><span>' 
                            + self._parent.getText('ce_entity_end', 'Entry End')
                        + '</span><select></select></span>'
                        + '<span data-field="gantt_grouping"><span>' 
                            + self._parent.getText('ce_default_gantt', 'Default Gantt Grouping')
                        + '</span><select></select></span>'
                        + '<span data-field="swimlane_grouping"><span>' 
                            + self._parent.getText('ce_swimlane_lookup', 'Swimlane Lookup')
                        + '</span><select name="settings[swimlane_grouping]"></select></span>'
                        + '<span data-field="allday_field"><span>' 
                            + self._parent.getText('ce_all_day_field', 'All Day Field')
                        + '</span><select name="settings[allday_field]"></select></span>'
                        + '<span data-field="sum_field"><span>Grouping Sum Field' 
                            //+ self._parent.getText('ce_all_day_field', 'All Day Field')
                        + '</span><select name="settings[sum_field]"></select></span>'
                        + '<span data-field="visible"><span>' 
                            + self._parent.getText('ce_visible', 'Visible')
                        + '</span><input type="checkbox" checked /></span>'
                        + '<span data-field="editable"><span>' 
                            + self._parent.getText('ce_editable', 'Editable')
                        + '</span><input type="checkbox"/></span>'
                    + '</div>'
                + '</div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_2', 'Specify the object for this calendar as well as the date fields to use for Entry Start and optionally, Entry End. The Visible box determines whether this calendar is available in your sidebar.   The Editable box determines whether  users can drag and drop records, or create records on this calendar, if unchecked, the calendar will be read only even if a user has priviliges to modify the records displayed.  Otherwise, object and field level security are respected.  Default Gantt Grouping specifies how records will be initially grouped on Gantt View for all users.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">3. ' + self._parent.getText('ce_step_3', 'Filter Criteria') + '</div>'
                + '<div class="_fields" data-block="filter">'
                    + '<div>'
                    + '<span data-field="filter_owner" style="text-align:left"><span>' 
                        + self._parent.getText('ce_filter_by_onwer', 'Filter by Owner')
                    + '</span>'
                        + '<span><input type=radio name="filter_owner_input" value="all">&nbsp;' 
                            + self._parent.getText('ce_all_records', 'All Records')
                        + '&nbsp;&nbsp;'
                        + '<input type="radio" name="filter_owner_input" value="my">&nbsp;' 
                            + self._parent.getText('ce_my_records', 'My Records')
                        + '</span>'
                    + '</span>'
                    + '</div>'
                + '</div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_3', 'Apply filter criteria specify which records should appear when activating this calendar.  Similar to a view, you can apply , multiple filters and control advanced filter query rules.  See the CalendarAnything Advanced Admin Guiee for more information about using filters with Dynamic and Embedded calendars.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">4. ' + self._parent.getText('ce_step_4', 'Fields to Display on Details Dialog') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="hover">' 
                    + self._buildHover('hover')
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_4', 'Specify and order the fields shown when clicking or tapping a calendar entry.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">5. ' + self._parent.getText('ce_step_5', 'Fields to Display on Create & Edit Dialogs') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="quick">'
                    + self._buildEdit()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_5', 'Specify and order the fields shown when creating a new calendar entry or editing an existing one. Checked items will be required when creating or editing in CalendarAnything.  Required fields will automatically show up checked in the selected area.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">6. ' + self._parent.getText('ce_step_6', 'Restrict Visibility with Public Groups') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="access">'
                    + self._buildAccessGroups()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_6', 'Restrict visibility of the calendar using Public Groups in your org setup. Only members of selected groups will have access to this calendar in My Calendars> Display Settings> Calendars.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">7. ' + self._parent.getText('ce_step_7', 'Publish on Force.com Sites') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="site">'
                    + self._buildAvaibleSites()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_7', 'Specify the Force.com that can be used to display a read-only version of this calendar.  Additional setup and configuration by an Admin is required.  Refer to the CalandarAnything Advanced Admin Guide for more information.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">8. ' + self._parent.getText('ce_step_8', 'Publish Read Only iCalendars') + '</div>'
                + '<div class="_fields"><span data-field="clear_token">'
//                    + 'ICal Publishing is currently unavailable.'
                    + '<span>' 
                        + self._parent.getText('ce_clear_ical_token', 'Clear iCal Tokens')
                    + '</span><input type="checkbox"/>'
                + '</span></div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_8', 'Additional setup and configuration by an Admin is required to publish calendars in the iCal format for subscription in iPhone, iPad, iCal and Outlook.  Refer to the CalandarAnything Advanced Admin Guide for more information.  Checking Clear ical Tokens and clicking Save will revoke access to this calendar for any user who has created a published link.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">9. ' + self._parent.getText('ce_step_9', 'Conditional Coloring') + '</div>'
                + '<div class="_fields _specialcolors">'
                    + self._buildColorConditions()
                + '</div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_9', 'Override the default calendar color with colors based on field values.  Select a field from the picklist, then choose a possible value.  Click Add and then click the color box to select a color for records that meet the specified criteria.')
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">10. ' + self._parent.getText('ce_step_10', 'List View Event Label Fields') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="add_title">' 
                    + self._buildAddTitle()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_10', 'List View displays calendar entries in an All Day area and allows multiple fields to be displayed and ordered on an "event tile" without having to click the entry to see the detail dialog.') 
                + '</div>'
             + '</div>'
             + '<div data-onsave="back_child">' 
                 + '<div class="_title">11. ' + self._parent.getText('ce_step_11', 'Child objects on Hover') + '</div>'
                 + '<div class="_fields _multi_select_block _child" data-block="child" data-submode="list" >' 
                     + self._buildChildLists()
                 + '</div>'
                 + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_11', 'Specify and order the list data shown when clicking or tapping a calendar entry.') 
                + '</div>'
             + '</div>'
            

        ;
        return sHTML;
    }
    
    self._buildGroupForm = function() {
        var sHTML = 
            '<div>' 
                + '<div class="_title">1. ' + self._parent.getText('ce_step_g1', 'Group Name and Color') + '</div>'
                + '<div class="_fields " >'
                    + '<div class="_cols_2">'
                        + '<span data-field="name"><span>' 
                            + self._parent.getText('ce_group_name', 'Group Name')
                        + '</span><input placeholder="' 
                            + self._parent.getText('ce_enter_group_name', 'Enter Group Name')
                        + '" required maxlength="80" /></span>'
                        + '<span data-field="friendlyName"><span>' 
                            + self._parent.getText('ce_group_friendly_name', 'Group Friendly Name')
                        + '</span><input disabled/></span>'
                        + '<span data-field="id"><span>' 
                            + self._parent.getText('ce_group_id', 'Group ID')
                        + ' </span><input disabled/></span>'
                        + '<span data-field="visible"><span>' 
                            + self._parent.getText('ce_visible', 'Visible')
                        + '</span><input type="checkbox" checked /></span>'
                        + '<span data-field="color"><span>' 
                            + self._parent.getText('ce_group_color', 'Group Color')
                        + '</span><span class=_color_selector style="background-color:#89d248" /><input type="hidden" value="#89d248"/></span>'
                    + '</div>'
                    + '<div>'
                        
                    + '</div>'
                    + '<div class="_cols_2">'
                        + '<span data-field="colorType"><span>' 
                                + self._parent.getText('ce_use_color', 'Use Color')
                            + '</span><span class="as_field">'
                            + '<input type="radio" value="group" name="colorType" checked>'
                            + '&nbsp;' 
                                + self._parent.getText('ce_group_color_single', 'Display calendars using single group color')
                            + '<br>'
                            + '<input type="radio" value="calendar" name="colorType">'
                            + '&nbsp;' 
                                + self._parent.getText('ce_group_color_original', 'Display all calendars in their original colors')
                            + '&nbsp;</span>'
                        + '</span>'
                    + '</div>'
                + '</div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_g1', 'Enter a name for your calendar group and select a method to determine the color of the entries displayed when this group is activated.   Calendars can  maintain their individual colors or one display color can be assigned to all calendars that are part of the group.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">2. ' + self._parent.getText('ce_step_g2', 'Selected Calendars') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="calendars">' 
                    + self._buildGroupCalendars()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_g2', 'Select calendars to be displaed when this group is activated.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">3. ' + self._parent.getText('ce_step_g3', 'Restrict Visibility') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="access">'
                    + self._buildAccessGroups()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_g3', 'Restrict visibility of the calendar group using Public Groups in your org setup. Only members of selected groups will have access to this calendar in My Calendars> Display Settings> Calendar Groups.') 
                + '</div>'
            + '</div>';
            
        return sHTML;
    }
    
    self._buildWebForm = function() {
        var sHTML = 
            '<div>' 
                + '<div class="_title">1. ' + self._parent.getText('ce_step_w1', 'Web Calendar Name and Color') + '</div>'
                + '<div class="_fields _cells_2" >'
                    + '<div>'
                        + '<span data-field="name"><span>' 
                            + self._parent.getText('ce_web_calendar_name', 'Web Calendar Name')
                        + '</span><input placeholder="' 
                            + self._parent.getText('ce_enter_web_calendar_name', 'Enter Web Calendar Name')
                        + '" required maxlength="80" /></span>'
                        + '<span data-field="friendlyName"><span>' 
                            + self._parent.getText('ce_web_friendly', 'Web Calendar friendly Name')
                        + '</span><input disabled/></span>'
                        + '<span data-field="color"><span>' 
                            + self._parent.getText('ce_calendar_color', 'Calendar Color')
                        + '</span><span class=_color_selector style="background-color:#89d248" /><input type="hidden" value="#89d248" /></span>'
                    + '</div>'
                    + '<div>'
                        + '<span data-field="id"><span>' 
                            + self._parent.getText('ce_web_id', 'Web Calendar ID')
                        + ' </span><input disabled/></span>'
                        + '<span data-field="visible"><span>' 
                            + self._parent.getText('ce_visible', 'Visible')
                        + '</span><input type="checkbox" checked /></span>'
                    + '</div>'
                    + '<div class="_cols_2">'
                        + '<span data-field="url"><span>' 
                            + self._parent.getText('ce_calendar_url', 'Calendar URL')
                        + '</span>'
                        + '<input type="url" placeholder="' 
                            + self._parent.getText('ce_enter_valid_url', 'Enter valid URL please')
                        + '" required maxlength="255" '
                            + ' pattern="^http[s]?:\\/\\/[a-z0-9\\.\\-]{0,9}[a-z0-9\\-]*\\.[a-z]{2,5}\\/.*$" '
                        + '/></span>'
                    + '</div>'
                + '</div>'
                + '<div class="_help"><span></span>' 
                    + self._parent.getText('ce_help_w1', 'Enter a name for your calenda group and select a method to display the group color(s). You may choose to allow calendars to maintain individual colors or assign one color to all grouped calendars.') 
                + '</div>'
            + '</div>'
            + '<div>' 
                + '<div class="_title">2. ' + self._parent.getText('ce_step_w2', 'Restrict Visibility') + '</div>'
                + '<div class="_fields _multi_select_block" data-block="access">'
                    + self._buildAccessGroups()
                + '</div>'
                + '<div class="_help _abs"><span></span>' 
                    + self._parent.getText('ce_help_w2', 'Restrict visibility of the web calendar using Public Groups in your org setup. Only members of selected groups will have access to this calendar in My Calendars> Display Settings> Web Calendars.') 
                + '</div>'
            + '</div>';
        return sHTML;
    }    
    
    
    
    self._initEvents = function() {
        if (self._sMode == 'edit') {
            
            var oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]');
            self._dom.fields.off('.CA_COLOR');
            self._dom.fields
            .on('change.CA_COLOR', '[data-temp="object_type"] select', function(evt) {
                var nFilter = jQuery(evt.target).val();
                self._changeSelectedObjectType(nFilter);
            }).on('change.CA_COLOR', '[data-field="object_name"] select', function(evt) {
                var sObject = jQuery(evt.target).val();
                self._changeSelectedObjectName(sObject);
            }).on('change.CA_COLOR', '._specialcolors [data-mode="selector"] select[name="field"]', function(evt){
                self._changeColorField(jQuery(evt.target).val()); 
            }).on('change.CA_COLOR', '[data-field="start_field"] select, [data-field="end_field"] select', function(evt) {
                self._checkEditable();
            }).on('keyup.CA_COLOR', '._specialcolors .ca_filter_reference', function(evt){
                self._colorReferenceSelector(evt);
            });
            
            self._dom.calendar.on('click', '_help', function(evt) {
                self._showHelp(true);
            });

            self._dom.title.on('change', 'select', function() {
                if (self._filterView != null) {
                    self._filterView.action('close_selector');
                }
                self._changeStep(parseInt(jQuery(this).val()));
            });
            self._dom.fields.off('keypress');
            if (true || self._sCalendarType == 'sf') {
                oFieldsForm
                    .off('.CA_COLOR')
                    .on('keyup.CA_COLOR change.CA_COLOR', '[data-field="name"] input', function(evt){
                        self._calculateFriendlyName(jQuery(evt.target).val());
                    });
                    
                oFieldsForm.on('change', '._specialcolors select[name="sort"]', function(evt){
                    var oEl = jQuery(evt.target),
                        oRow = oEl.parents('div[data-sort]');
                    oRow.data('sort', oEl.val());
                });
            }
            
            
            
            

            self._parent._prependQueue([
                function(){
                    oFieldsForm.find('div[data-block="hover"], '
                        + 'div[data-block="quick"], '
                        + 'div[data-block="access"], '
                        + 'div[data-block="site"], '
                        + 'div[data-block="add_title"], '
                        + 'div[data-block="calendars"], '
                        + 'div[data-block="child"] > div[data-submode="fields"] > ._bottom_panel '
                    ).CAMultiSelect({
                        "left" : 'div[data-list="_off"]',
                        "right" : 'div[data-list="_on"]',
                        "buttons" : 'div.simple_buttons >  a[data-mode]',
                        "sub" : "div._moveable",
                        "orderable" : "div._orderable",
                        "touchhold" : 1000,
                        "touchradius" : 10,
                        "touchscrollarea" : 15,
                        "searchField" : ".multi_select_title  > input"
                    });
                },
                function(){
                    self._parent._initScripts('/plugin/jquery.ca-multiselect.js');
                    self._parent.loadCss('/css/plugin-multi-select.css');
                }
            ]);
            self._parent._prependQueue([
                function(){
                    oFieldsForm.on('click.CA_COLOR', '._color_selector', function(evt){
                        var oEl = jQuery(evt.target),
                            oRow = oEl.parents('[data-field]');
                        if (oRow.size() > 0) {
                            oEl.caColor({
                                success : function(sNewColor, sTpl) {
                                    if (oRow.data('field') == 'color') {
                                        oRow.find('input').val(sNewColor);
                                    } else {
                                        oRow.data('color', sNewColor);
                                    }
                                    if (oEl.data('tpl') != undefined) {
                                        oEl.removeClass('evt_tpl_' + oEl.data('tpl'));
                                    }
                                    oEl.css('background-color', sNewColor);
                                    if (sTpl != undefined) {
                                        oEl.addClass('evt_tpl_' + sTpl).data('tpl', sTpl);
                                        if (oRow.data('field') != 'color') {
                                            oRow.data('tpl', sTpl);
                                        }
                                    }
                                },
                                show : true,
                                tpl : self._sCalendarType == 'sf' ? oEl.data('tpl') || 0 : undefined,
                                canvasUrl   : self._parent.options.staticUrl + '/pic/gradient.png'
                            });
                        }
                    });
//                    oFieldsForm.on('change.CA_COLOR', '._color_tpl_selector', function(evt){
//                        var oEl = jQuery(evt.target);
//                        var sPrev = oEl.siblings('._color_selector').data('tpl');
//                        if (sPrev != undefined) {
//                            oEl.siblings('._color_selector').removeClass('evt_tpl_' + sPrev);
//                        }
//                        oEl.siblings('._color_selector').addClass('evt_tpl_' + oEl.val()).data('tpl', oEl.val());
//                    });
                },
                function(){
                    self._parent.loadCss('/css/plugin-ca-color.css');
                    self._parent._initScripts('/plugin/jquery.ca-color.js');
                }
            ]);
        } else {
            self._dom.list.on('click.CA_COLOR', 'th[data-field]', function(evt){
                var sSort = jQuery(evt.target).data('field'),
                    bDown = self._dom.list.data('sortby') == sSort;
                self._dom.list.data('sortby', bDown ? '' : sSort);
                self._refreshList({
                    "sort" : sSort,
                    'down' : bDown
                });
            });
            self._dom.selectList.on('change.CA_COLOR', function(evt){
                self._sCalendarType = self._dom.selectList.val();
                self._loadCalendarsList({page : 0, text : ""});
            });
            var nTimer = null;
            self._dom.searchList.on('keyup.CA_COLOR,change.CA_COLOR', function(evt){
                if (nTimer != null) {
                    clearTimeout(nTimer);
                }
                nTimer = setTimeout(function(){
                    self._loadCalendarsList({text : self._dom.searchList.val(), page : 0});
                }, 200);
            });
        }
    }
    
    self._loadCalendarProp = function() {
        var aQue = [
            function(){
                self._parent.showPopup({
                    html        : '<div style="height:380px;line-height:380px;text-align:center;">'
                                    + self._parent.getText('swimlane_loading', 'Loading')
                                    + '</div>',         // send ready dom 
                    center      : true,
                    shadow      : true,
                    view        : view,
                    autohide    : false,
                    overflow    : false,
                    modal       : true,
                    noCloseRule : '.CA_calendar, .CA_color_select',
                    slide       : self._parent.options._small ? 'bottom' : false,
                    fullScreen  : self._parent.options._small
                });       
            },
            function(){
                if (self._parent.params.fastStart == true) {
                    self._parent._objects.refreshSimple();
                }
            },
            function(){
                self._parent._calendars.getCalendarEditData(self._sCalendarType, self._sCalendarId, function(aData){
                    self._aProperties = aData;
                    self._sCurrentObject = aData.selectedObject !== undefined ? aData.selectedObject : "";
                    self._aProperties.objects = self._parent._objects.getObjectsList();
                    if (self._aProperties.objects != undefined) {
                        self._aProperties.objects.quickSort('label');
                    }
                    if (self._aProperties.sites != undefined) {
                        self._aProperties.sites.quickSort('name');
                    }
                    if (self._aProperties.groups != undefined) {
                        self._aProperties.groups.quickSort('name');
                    }
                   
                });
            },
            function(){
                if ((self._aProperties.fields == undefined || self._aProperties.fields.length == 0 )
                    && self._sCalendarType == 'sf'
                ) {
                    self._parent._objects.getObjectStructure(self._aProperties.selectedObject, function(aFields, aObjectProperties){
                        self._aProperties.fields = aFields;
                        self._aProperties.iscreateable = aObjectProperties.createable || aObjectProperties.iscreateable;
                        self._aProperties.iseditable = aObjectProperties.editable || aObjectProperties.iseditable;
                        self._aProperties.child = aObjectProperties.child != undefined ? aObjectProperties.child : undefined;
                        self._aProperties.dt = aObjectProperties.dt != undefined ? aObjectProperties.dt : undefined;
                        self._aProperties.feedEnabled = aObjectProperties.feedEnabled != undefined ? aObjectProperties.feedEnabled : undefined;
//                        jQuery.extend(self._aProperties, aObjectProperties);
                    });
                }
            },
            function(){
                
                if (self._aProperties.fields != undefined && self._sCalendarType == 'sf') {
                    self._aProperties.fieldsList = Array.objectValues(self._aProperties.fields);
                    self._aProperties.fieldsList.quickSort(function(a,b){
                        if (a.label.toLowerCase() < b.label.toLowerCase()) {
                            return -1;
                        } else if (a.label.toLowerCase() > b.label.toLowerCase()) {
                            return 1;
                        }
                        return 0;
                    });
                }
                
                if (typeof(self._aProperties.allFriendlyNames) == 'string') {
                    self._aProperties.allFriendlyNames 
                        = self._aProperties.allFriendlyNames.split('#').map(function(sS){return sS.toLowerCase()});
                }
            },
            function(){
                if (self._sCalendarType == 'sf') {
                    self._loadCalendarPropCheckReferences();
                }
            },
            function(){
                self._loadCalendarPropAfter();
                if (self._parent.options.func.calendarEdit != undefined ) {
                    self._parent.options.func.calendarEdit(self._parent._dom.popup);
                }

            },
        ];
        
        self._parent._addQueue(aQue);
        
    }
    
    self._loadCalendarPropCheckReferences = function() {
        var aRefObjects = [];
        if (typeof(self._aProperties.fieldsList) == 'undefined' || !self._parent.params.showAdditionalFields) {
            self._aProperties.refObjects = {};
            return;
        }
        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
            if (self._aProperties.fieldsList[nI].type != 'REFERENCE') {
                continue;
            }
            for (var nJ = 0; nJ < self._aProperties.fieldsList[nI].options.length; nJ++) {
                aRefObjects.push(self._aProperties.fieldsList[nI].options[nJ].name.toLowerCase());
            }
        }
        aRefObjects = aRefObjects.unique();
//        console.log(aRefObjects);
        self._parent._objects.getObjects(aRefObjects, function(aObjectFields){
            self._aProperties.refObjects = aObjectFields;
//            console.log(aObjectFields);
        });
    }
    
    
    self._loadCalendarPropAfter = function() {
        self._buildFields();

        var aSteps = [], sTitlesHTML = '';
        self._dom.fields.children().filter('div[data-type="' + self._sCalendarType + '"]')
            .children().each(function(){
                var oDiv = jQuery(this);
                aSteps.push(oDiv.children('._title').text());
            });

        for (var nI = 0; nI < aSteps.length; nI++) {
            sTitlesHTML += '<option value="' + nI + '">' + aSteps[nI];

        }
        self._dom.title.find('select').html(sTitlesHTML);
        self._dom.title.children('span').text(self._editTitles[self._sCalendarType]);

        self._dom.fields.children().removeClass('on')
            .filter('div[data-type="' + self._sCalendarType + '"]').addClass('on')
            .children().removeClass('on')
            .eq(0).addClass('on');
        if (self._sCalendarType == 'sf') {
            self._parent._initView('calendarFilter', function(){
                self._filterView = self._parent._getView('calendarFilter');
                if (self._filterView != null) {
                    self._filterView.show({
                        "object"    : self._aProperties.selectedObject,
                        "structure" : self._aProperties.fields,
                        "div"       : self._dom.fields.find('[data-block="filter"]'),
                        "filter"    : self._aProperties.filter == undefined || self._aProperties.filter == null 
                                        ? [] 
                                        : self._aProperties.filter,
                        'rule'      : self._aProperties.rule == null ? '' : self._aProperties.rule
                    });
                }
            });  
        }
        self._parent.showPopup({
            dom         : self._dom.div,         // send ready dom 
            center      : true,
            shadow      : true,
            view        : view,
            autohide    : false,
            overflow    : false,
            modal       : true,
            noCloseRule : '.CA_calendar, .CA_color_select',
            onClose     : function() {
            },
            slide       : self._parent.options._small ? 'bottom' : false,
            fullScreen  : self._parent.options._small
        });         
    }
    
    
    self._buildHover = function(sMode) {
        sMode = sMode || 'hover';
        var sHTML = 
                '<span class="multi_select_title ">' 
                + '<input type="search" placeholder="' + self._parent.getText('search', "Search") + '"/>'
                + self._parent.getText('addon_available', "Available") 
                + '</span>' 
                + '<div data-list="_off" class="multi_select"></div>'
                + '<div class="simple_buttons">'
                    + '<a data-mode=right>&gt;</a>'
                    + '<a data-mode=left>&lt;</a>'
                    + '<a data-mode="sort_left" title="'
                    + self._parent.getText('cs_sort_by_name', "Sort available by name")
                    + '">&darr;</a>'
                    + '<a data-mode="sort_right" title="' 
                    + self._parent.getText('cs_sort_available_name', "Sort Selected by name")
                    +'">&darr;</a>'
                    + (
                        ((sMode == 'hover' || sMode == 'add_title' || sMode == 'child')
                            && self._parent.params.showAdditionalFields
                        )
                        ? '<a data-mode="open" title="' 
                            + self._parent.getText('ce_open_reference', "Open Reference Fields")
                            + '">+</a>' 
                        : ''
                    ) + (sMode == 'access'
                        ? '<a data-mode="search" title="' + self._parent.getText('search', "Search") + '">' 
                                + self._parent.getText('search', "Search") 
                                + '</a>' 
                        : ''
                    )
                + '</div>'
                + '<div data-list="_on" class="multi_select"></div>'
                + '<span class=multi_select_title>' + self._parent.getText('addon_selected', "Selected") + '</span>' ;
        return sHTML;
    }
    
    
    self._buildEdit = function() {
        return self._buildHover('quick');
    }
    
    self._buildAccessGroups = function() {
        return self._buildHover('access');
    }
    
    self._buildChildLists = function(){
        var sHTML = '<div data-submode="list">'
                + '<p data-mode="selector" data-filter data-field>'
                + '<span><select name="object"></select></span>'
//                + '<span data-mode="field" style="display:none"><select name=field></select></span>'
                + '<span class="simple_button" data-action="add_child">' 
                + self._parent.getText('add', "Add")
                + '</span>'
                + '</p>'
                + '<p data-mode="list"></p>'
            + '</div>'
            + '<div data-submode=fields>'
                
                + '<div class=_top_panel>' 
                    + '<span class=small_button data-action="back_child">&nbsp;' 
                    + self._parent.getText('menu_ok', "OK")
                    + '&nbsp;</span>' 
                    + '<span class=small_button data-action="cancel_child">&nbsp;' 
                    + self._parent.getText('menu_cancel', "Cancel")
                    + '&nbsp;</span>' 
                    + '<span class="_child_title"></span>' 
                    + self._parent.getText('cs_rows', "Rows")
                    +  '<input type=number size=5 value="10" data-name="hm">'
                    + '&nbsp;' 
                    + self._parent.getText('ce_show_link', 'Show link to the element') 
                    + '<input data-name="showurl" type=checkbox value="true">'
                    + '&nbsp;'
                    + self._parent.getText('ce_special_url', 'Special URL') 
                    + ' <input data-name="url" type=text size=20 value="" title="'
                    + self._parent.getText('ce_use_id_title', 'Use [id], [ownerid], [name] as some field value') 
                    + '" placeholder="'
                    + self._parent.getText('ce_special_url_to_detail', 'Special URL to the detail page') 
                    + '">'
                + '</div>'
                + '<div class=_bottom_panel>' +  self._buildHover('child') + '</div>'
            + '</div>';
//            + '<div data-submode=search>' +  self._buildHover('child') + '</div>';
//            + '<span data-mode="setting"><input type="checkbox" value=1 name="settings[hide_color_field_label]" />&nbsp;Hide field labels</span>'
        return sHTML;
    }
    
    self._buildAvaibleSites = function() {
        
        return self._parent.getText('ce_sites_text', '<p style="text-align:left;margin:0;padding:5px;">This calendar can be published to the Internet in read-only mode using Force.com Sites. Additional setup and configuration by an Admin is required.<br/><br/>'
            + 'Previous version of CalendarAnything required that the Site be specified in this step, but that is no longer required. This calendar can be published to a Force.com site as long as the following is true:<br/>'
            + '1. The Site user is licensed for CalendarAnything<br/>'
            + '2. The Site user is a member of a Public group that has access to this calendar (step 6)<br/>'
            + '3. The Site profile has access to all the CalendarAnything Visualforce pages and Apex classes<br/>'
            + '4. The Site profile has read access to all CalendarAnything custom objects<br/>'
            + '5. The Site profile has read access to all objects and fields referenced by the calendar (step 2)<br/><br/>'
            + 'Refer to the CalandarAnything Advanced Admin Guide for more detailed information.</p>');
    }
    
    self._buildGroupCalendars = function() {
        return self._buildHover('calendars');
    }
    
    self._buildAddTitle = function() {
        return self._buildHover('add_title');
        //return self._parent.params.insideEdit == '1' ? self._buildHover('add_title') : '';
    }
    
    self._buildColorConditions = function() {
        var sHTML = 
            '<span data-mode="selector" data-filter data-field>'
                + '<span><select name="field"></select></span>'
                + '<span data-mode="picklist" style="display:none"><select name=value></select></span>'
                + '<span data-mode="reference" style="display:none"><input type=text name="value_text" class="ca_filter_reference" placeholder="'
                + self._parent.getText('message_type_to_search', 'Type to search')
                + '">'
                    + '<span class="simple_button" data-action="show_color_references">&gt;</span>'
                + '</span>'
                + '<span data-mode="text" style="display:none"><input type=text name="value_text" placeholder="'
                + self._parent.getText('ce_type_value', 'Type value')
                + '"></span>'
                + '<span class="simple_button" data-action="add_color">' 
                + self._parent.getText('add', 'Add')
                + '</span>'
            + '</span>'
            + '<span data-mode="list"></span>'
            + '<span data-mode="setting"><input type="checkbox" value=1 name="settings[hide_color_field_label]" />&nbsp;'
            + self._parent.getText('ce_hide_field_labels', 'Hide field labels')
            + '</span>';
        return sHTML;
    }
    
    self._buildFields = function() {
        var sHTML = '';
        if (self._sCalendarType == 'sf') {
            self._fillObjectList(-1);
            self._rebuildStructure();
            self._fillNameOptions();
            self._fillGroupOptions();
            self._fillStartOptions();
            self._fillEndOptions();
            self._fillHoverOptions();
            self._fillQuickCreateOptions();
/*            if (self._parent.params.insideEdit != '1') {
                self._fillSitesOptions();
            }*/
            self._fillColorsSelector();
            self._fillChildSelector();
            
//            if (self._parent.params.insideEdit == '1') {
                self._fillAddTitleOptions();
//            }
            
        } else if (self._sCalendarType == 'group') { 
            self._setColorGroup();
            self._fillCalendarsOptions();
        }
        self._fillAccessOptions();
        
        self._setCalendarValues();
        if (self._sCalendarType == 'sf') {
            self._checkEditable();
        }
        if (self._sCalendarId == undefined && self._sCalendarType == 'sf') {
            self._preFillLayoutFields(self._aProperties.selectedObject);
        }
        
    }
    
    self._fillObjectList = function(nType) {
        var sHTML = '',
            oSelect = self._dom.fields.find('[data-field="object_name"] select'),
            sVal = oSelect.val(),
            bShadow;
        if (nType === -1) {
            sVal = null;
            nType = 0;
        }
        sVal = (sVal == undefined || sVal == null) ? self._aProperties.selectedObject : sVal;
        
        nType = nType || 0;
        
        for (var nI = 0; nI < self._aProperties.objects.length; nI++) {
            bShadow = false;
            if (nType > 0) {
                if ((nType == 3 && self._aProperties.specifiedObjects.indexOf(self._aProperties.objects[nI].name) < 0)
                    || (nType == 1 && self._aProperties.objects[nI].type == 'standard')
                    || (nType == 2 && self._aProperties.objects[nI].type == 'custom')
                ) {
                    if (sVal != self._aProperties.objects[nI].name) {
                        continue;
                    } else {
                        bShadow = true;
                    }
                }
            }
            if (sVal != self._aProperties.objects[nI].name && self._aProperties.objects[nI].accessible !== true) {
                continue;
            }
            sHTML += '<option value="' + self._aProperties.objects[nI].name + '"'
                + (self._aProperties.objects[nI].name == sVal ? ' selected ' : "")
                + (bShadow ? ' class="_shadow" ' : "")
                + '>'
                + self._aProperties.objects[nI].label.htmlspecialchars()
        }
        oSelect.html(sHTML);
    }
    
    self._getReadyOptions = function(aFilter, aRefFilter, aReferenceTypes, aPredefineFields, bCheckReferencePresence) {
        var sHTML = '', bFound, sFieldHTML, bRefFound;
        bCheckReferencePresence = bCheckReferencePresence || false;
        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
            var aField = self._aProperties.fieldsList[nI], 
                sKey = aField['name'];
            if (aFilter.indexOf(aField['type']) < 0 || (aPredefineFields != undefined && aPredefineFields.indexOf(sKey) < 0)) {
                continue;
            }
            if (aField['type'] == 'REFERENCE' && aReferenceTypes != undefined && aField.options.length > 0) {
                bFound = false;
                for (var nO = 0; nO < aField.options.length; nO++) {
                    if (aReferenceTypes.indexOf(aField.options[nO].name) >= 0 
                        || aReferenceTypes.indexOf(aField.options[nO].key) >= 0
                    ) {
                        bFound = true;
                        break;
                    }
                }
                if (!bFound) {
                    continue;
                }
            }
            sFieldHTML = '<option value="' + sKey + '" '
                + (aField['type'] == 'REFERENCE' && self._parent.params.showAdditionalFields ? ' class="_ref" ' : '')
                + '>' + aField['label'].htmlspecialchars();
            if (aField['type'] == 'REFERENCE' && aRefFilter != undefined && self._parent.params.showAdditionalFields) {
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, aRefFilter, true, self._sCurrentObject);
                bRefFound = false;
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    if (aPredefineFields != undefined && aPredefineFields.indexOf(sKey + '.' + aRefFields[nJ]['name']) < 0) {
                        continue;
                    }
                    bRefFound = true;
                    sFieldHTML += '<option value="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
                        + 'class="_sub_ref"'
                        + '>&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
                }
                if (bCheckReferencePresence && !bRefFound) {
                    continue;
                }
            }
            sHTML += sFieldHTML;
        }
        return sHTML;
    }
    
    self._fillNameOptions = function() {
        var aFilter = [
                'TEXT', 'STRING', 'URL', 'PHONE', 
                'EMAIL', 'REFERENCE', 'DATE', 'DATETIME', 
                'PICKLIST', 'MULTIPICKLIST', 'COMBOBOX'
            ],
            aRefFilter = [
                'TEXT', 'STRING', 'URL', 'PHONE', 
                'EMAIL', 'DATE', 'DATETIME', 
                'PICKLIST', 'COMBOBOX'
            ],
            sHTML = self._getReadyOptions(aFilter, aRefFilter);
//        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
//            var aField = self._aProperties.fieldsList[nI], 
//                sKey = aField['name'];
//            if (aFilter.indexOf(aField['type']) < 0) {
//                continue;
//            }
//            sHTML += '<option value="' + sKey + '" '
//                + (aField['type'] == 'REFERENCE' ? ' class="_ref" ' : '')
//                + '>' + aField['label'].htmlspecialchars();
//            if (aField['type'] == 'REFERENCE') {
//                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, aRefFilter, true, self._sCurrentObject);
//                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
//                    sHTML += '<option value="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
//                        + 'class="_sub_ref"'
//                        + '>&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
//                }
//            }
//        }
        if (sHTML == '') {
            sHTML = '<option value="">' + self._parent.getText('ce_no_available_fields', 'No available fields');
        }
        self._dom.fields.find('[data-field="entry_name"] select').html(sHTML);
        self._dom.fields.find('.multi_select_title  input').val('');
    }
    
    self._fillGroupOptions = function() {
        var aFilter = ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'REFERENCE', 'PICKLIST', 'COMBOBOX'],
            aRefFilter = ['TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL', 'PICKLIST', 'COMBOBOX'],
            aSelectedGroupingFields = self._parent._objects.getSpecialSettings('groupingObjects', null),
            aSelectedFields = null;
        if (aSelectedGroupingFields != null && typeof(aSelectedGroupingFields) == 'string') {
            aSelectedGroupingFields = JSON.parse(aSelectedGroupingFields);
        }
        if (aSelectedGroupingFields != null 
                && aSelectedGroupingFields[self._aProperties.selectedObject] != undefined 
                && aSelectedGroupingFields[self._aProperties.selectedObject] != ''
        ) {
            var aSelectedFields = aSelectedGroupingFields[self._aProperties.selectedObject].split(',');
            
        }
        var sHTML = '<option value="">-----' + self._getReadyOptions(aFilter, aRefFilter, undefined, aSelectedFields);
        self._dom.fields.find('[data-field="gantt_grouping"] select').html(sHTML);
        self._dom.fields.find('[data-field="swimlane_grouping"] select')
            .html(
                '<option value="">' + self._parent.getText('ce_default', 'Default') 
                + self._getReadyOptions(['REFERENCE'], null, ['user'])
            );
        self._dom.fields.find('[data-field="allday_field"] select')
            .html(
                '<option value="">' + self._parent.getText('ce_default', 'Default') 
                + '<option value="1">' + self._parent.getText('ca_always_on', 'Always On') 
                + self._getReadyOptions(
                    ['BOOLEAN', (self._parent.getParam('showAdditionalFields', false) ? 'REFERENCE' : '--')], 
                    ['BOOLEAN'], 
                    null,
                    null,
                    true
                )
            );
        self._dom.fields.find('[data-field="sum_field"] select')
            .html(
                '<option value="">-----' 
                + self._getReadyOptions(
                    ['INTEGER', 'DOUBLE', 'PERCENT', 'CURRENCY', (self._parent.getParam('showAdditionalFields', false) ? 'REFERENCE' : '--')], 
                    ['INTEGER', 'DOUBLE', 'PERCENT', 'CURRENCY'], 
                    null,
                    null,
                    true
                )
            );
    }
    
    self._fillStartOptions = function() {
        var sHTML = '',
            aFilter = ['DATE', 'DATETIME'],
            bSelected = false;
        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
            var aField = self._aProperties.fieldsList[nI], 
                sKey = aField['name'];
            if (aField['type'] == 'REFERENCE' && self._parent.params.showAdditionalFields) {
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, aFilter, true, self._sCurrentObject);
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    sHTML += '<option value="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
                        + 'class="_sub_ref" '
                        + (!bSelected ? " selected='selected' " : "")
                        + '>&nbsp;&nbsp;' + aField['label'].htmlspecialchars() 
                            + ' / ' 
                            + aRefFields[nJ]['label'].htmlspecialchars();
                    bSelected = true;
                }
                
                continue;
            }
            if (aFilter.indexOf(aField['type']) < 0 ) {
                continue;
            }            
            sHTML += '<option value="' + sKey + '" '
                + (!bSelected ? " selected='selected' " : "")
                + '>' + aField['label'].htmlspecialchars();
            bSelected = true;
        }
        sHTML = sHTML == '' ? '<option value="">' + self._parent.getText('ce_no_available_fields', 'No available fields') : sHTML; 
        self._dom.fields.find('[data-field="start_field"] select').html(sHTML);
    }
    
    self._fillEndOptions = function() {
        var sHTML = '<option value="" selected>-----',
            aFilter = ['DATE', 'DATETIME'];
        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
            var aField = self._aProperties.fieldsList[nI], 
                sKey = aField['name'];
            if (aField['type'] == 'REFERENCE' && self._parent.params.showAdditionalFields) {
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, aFilter, true, self._sCurrentObject);
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    sHTML += '<option value="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
                        + 'class="_sub_ref"'
                        + '>&nbsp;&nbsp;' + aField['label'].htmlspecialchars() 
                            + ' / ' 
                            + aRefFields[nJ]['label'].htmlspecialchars();
                }
                continue;
            }        
            if (aFilter.indexOf(aField['type']) < 0) {
                continue;
            }            
            sHTML += '<option value="' + sKey + '">' + aField['label'].htmlspecialchars();
        }
        self._dom.fields.find('[data-field="end_field"] select').html(sHTML);
    }
    
    self._fillHoverOptions = function(sBlock, aFields) {
        var sHTML = '', bRefFields = false;
        aFields = aFields || self._aProperties.fieldsList;
        sBlock = sBlock || 'hover';
        bRefFields = (sBlock == 'hover' || sBlock == 'add_title' || sBlock == 'child')
                && self._parent.params.showAdditionalFields;
//            && (sBlock == 'hover' || sBlock == 'add_title' || sBlock == 'child');
        for (var nI = 0; nI < aFields.length; nI++) {
            var aField = aFields[nI], 
                sKey = aField['name'];
            sHTML += '<div data-fid="' + sKey + '" '
                + ' class="_moveable '
                + (bRefFields && aField['type'] == 'REFERENCE' ? '_plus' : '')             
                + '" '
                + (bRefFields && aField['type'] == 'REFERENCE' 
                    ? 'title="' + self._parent.getText('ce_reference_object', 'Reference object fields') 
                    : '') 
                + '>' 
                + aField['label'].htmlspecialchars() 
                + '</div>';
            if (bRefFields && aField['type'] == 'REFERENCE') {
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, undefined, true, self._sCurrentObject);
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    sHTML += '<div data-parent="' + sKey + '" data-fid="' + sKey + '.' + aRefFields[nJ]['name'] + '" '
                        + 'class="_moveable _off _small"'
                        + '>' 
                        + aField['label'].htmlspecialchars() 
                            + ' / '
                            + aRefFields[nJ]['label'].htmlspecialchars()
                        + '</div>'
                    ;
                }
            }
        }
        self._dom.fields.find('div[data-block="' + sBlock + '"] .multi_select[data-list="_off"]').html(sHTML);
        self._dom.fields.find('div[data-block="' + sBlock + '"] .multi_select[data-list="_on"]').html('');
    }
    
    self._fillCalendarsOptions = function() {
        var sHTML = '',
            oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]');
        if (self._aProperties.calendars != undefined) {
            jQuery.each(self._aProperties.calendars, function(sKey, aCalendar){
                
                
                var oCal = self._parent._calendars.getCalendar(aCalendar.id),
                    sObj = oCal != undefined && oCal.objectName != undefined 
                    ? self._parent._objects.getObjectLabel(oCal.objectName)
                    : '';
                sHTML += '<div data-cid="' + aCalendar.id + '" class="_moveable" title="' + sObj.htmlspecialchars() + '">' 
                    + aCalendar.name.htmlspecialchars() 
                    + '<span style="background-color:' + aCalendar.color + '"></span>'
                    + '</div>';
            });
        }
        oFieldsForm.find('div[data-block="calendars"] .multi_select[data-list="_off"]').html(sHTML);
        oFieldsForm.find('div[data-block="calendars"] .multi_select[data-list="_on"]').html('');
    }
    
    
    self._fillQuickCreateOptions = function() {
        var sHTML, sHTMLOn = '', sHTMLOff = '', 
            oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]'),
            oOff = oFieldsForm.find('div[data-block="quick"] .multi_select[data-list="_off"]'),
            oOn = oFieldsForm.find('div[data-block="quick"] .multi_select[data-list="_on"]');
        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
            var aField = self._aProperties.fieldsList[nI], 
                sKey = aField['name'];
            if (!aField.isUpdateable && !aField.isCreateable) {
                continue;
            }
            sHTML = '<div data-fid="' + sKey + '" '
                + ' data-type="' + aField['type'] +'" '
                + (!aField.isRequired ? ' class="_moveable" ' : "class='_orderable'")
                + '>'
                + '<input title="' 
                + self._parent.getText('ce_make_required', 'Make required') 
                + '" type=checkbox ' + (aField.isRequired ? 'disabled checked' : '') + '/>' 
                + aField['label'].htmlspecialchars() 
                + '</div>';
            if (aField.isRequired) {
                sHTMLOn += sHTML;
            } else {
                sHTMLOff += sHTML;
            }
            
        }
        oOff.html(sHTMLOff);
        oOn.html(sHTMLOn);
    }
    
    self._fillAccessOptions = function() {
        var oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]'),
            oOff = oFieldsForm.find('div[data-block="access"] .multi_select[data-list="_off"]'),
            oOn = oFieldsForm.find('div[data-block="access"] .multi_select[data-list="_on"]');
        
        oOn.html('');
        
        var fMakeList = function(aList) {
            var sHTML = '', 
                bEmpty = oOn.children().size() == 0;
            if (aList == undefined || aList == null) {
                return sHTML;
            }
            for (var nI = 0; nI < aList.length; nI++) {
                if (!bEmpty && oOn.children('[data-id="' + aList[nI]['id'] + '"]').size() > 0) {
                    continue;
                }
                sHTML += '<div data-id="' + aList[nI]['id'] + '" class="_moveable">' 
                    + aList[nI]['name'].htmlspecialchars() 
                    + '</div>';
            }
            return sHTML;
        }
        
        
        var sNoAccess = (self._aProperties.restrictSharedGroups === true 
                ? self._parent.getText('ce_insufficient_provolegies', "Insufficient privileges: you cannot Share this calendar to other Groups") 
                : ""
            );
        oOff.html(sNoAccess != '' ? "" : fMakeList(self._aProperties.groups));
        
        if (self._aProperties.limitGroups === true) {
            oFieldsForm
                .find('._multi_select_block[data-block="access"]')
                .data('multiApi')
                .reInit({
                    "search" : function(sText, evt) {
                        self._parent._objects.getFieldOptions(
                            {
                                obj  : 'group',
                                text : sText,
                                hm   : 100
                            },
                            function(aList, aPrevNext){
                                if (aList == undefined || aList == null) {
                                    aList = [];
                                }
                                oOff.html(fMakeList(aList));
                            }
                        );
                        
                        
                    },
                    "textLeft" : self._parent.getText('ce_more_100_groups', 
                            "There are more than 100 Public Groups available in the org. "
                            + "Click the Search button to refine your search criteria and display matching groups."
                        ) 
                        + "<br>" + sNoAccess,
                    "textRight" : (self._aProperties.limitSharedGroups === true 
                        && (!self._bClone || self._parent.options.readonly.cloneSharing !== false)
                        ? self._parent.getText('ce_more_100_groups_shared', "There are more than 100 shared groups. Add groups with search.") 
                        : null
                    ) 
                });
        } else {
            oFieldsForm
                .find('._multi_select_block[data-block="access"]')
                .data('multiApi').reInit({
                    "search" : false,
                    "textLeft" : '' + sNoAccess
                });
        
        }
    }
    
    self._fillSitesOptions = function() {
        var sHTML = '';
        if (self._aProperties.sites == undefined) {
            return;
        }
        for (var nI = 0; nI < self._aProperties.sites.length; nI++) {
            sHTML += '<div data-id="' + self._aProperties.sites[nI]['id'] + '" class="_moveable">' 
                + self._aProperties.sites[nI]['name'].htmlspecialchars()
                + '</div>';
        }
        self._dom.fields.find('div[data-block="site"] .multi_select[data-list="_off"]').html(sHTML);
        self._dom.fields.find('div[data-block="site"] .multi_select[data-list="_on"]').html('');
    }
    
    
    self._fillColorsSelector = function() {
        var sHTML = '<option value="">-----',
            aFilter = ['PICKLIST', 'COMBOBOX', 'MULTIPICKLIST', 'BOOLEAN', 'REFERENCE', 
                'TEXT', 'STRING', 'URL', 'PHONE', 'EMAIL'
            ],
            bRefFields = self._parent.params.showAdditionalFields;
        if (self._aProperties.fields == undefined || self._aProperties.fields == null) {
            return;
        }
        for (var nI = 0; nI < self._aProperties.fieldsList.length; nI++) {
            var aField = self._aProperties.fieldsList[nI], 
                sKey = aField['name'];
            if (aFilter.indexOf(aField['type']) < 0) {
                continue;
            }
            
            sHTML += '<option value="' + sKey + '" '
                    + '>' 
                    + aField['label'].htmlspecialchars();

            if (bRefFields && aField['type'] == 'REFERENCE'){
                var aRefFields = self._parent._objects.getLinkedObjectsFields(aField, aFilter, true, self._sCurrentObject);
//                console.log(aRefFields);
                for (var nJ = 0; nJ < aRefFields.length; nJ++) {
                    sHTML += '<option value="' + aField.name + '.' + aRefFields[nJ]['name'] + '" '
                        + 'class="_sub_ref"'
                        + '>&nbsp;&nbsp;' + aRefFields[nJ]['label'].htmlspecialchars();
                }
            }
        }
        self._dom.fields.find('._specialcolors [data-mode="selector"] select[name="field"]').html(sHTML).val('');
        self._dom.fields.find('._specialcolors [data-mode="selector"]')
            .find('[data-mode]').hide();
        self._dom.fields.find('._specialcolors [data-mode="selector"] input').val('');
        self._dom.fields.find('._specialcolors [data-mode="list"]').html('');
        
    
    }
    
    self._fillChildSelector = function(){
        var oSelect = self._dom.fields.find('._child [data-submode="list"] select'),
            sHTML = '<option value="">Select Child Relation';
        oSelect.html('');
        self._dom.fields.find('._child [data-mode="list"]').html('');
        if (self._aProperties.child == undefined) {
            return;
        }
        for (var nJ = 0; nJ < self._aProperties.child.length; nJ++) {
            var sObjName = self._parent._objects.getObjectLabel(self._aProperties.child[nJ].object);
            
            sHTML += '<option value=' + self._aProperties.child[nJ].label + '>' 
                + sObjName + ' (' + self._aProperties.child[nJ].field + ')' ;
        }
        oSelect.html(sHTML);
        
    }
    
    self._fillAddTitleOptions = function() {
        self._fillHoverOptions('add_title');
    }
    
    self._setChild = function() {
        var aChilds = typeof(self._aProperties.childFields) == 'string' 
            ? (self._aProperties.childFields != '' ? JSON.parse(self._aProperties.childFields) : [])
            : self._aProperties.childFields,
            sHTML = '',
            aObjs = [];
        if (aChilds == undefined) {
            return;
        }
        for (var nJ = 0; nJ < aChilds.length; nJ++) {
            var aChild = self._getChildRelation(aChilds[nJ].label);
            if (aChild == null) {
                continue;
            }
            aObjs.push(aChild.object);
        }
        if (aObjs.length > 0) {
            self._parent._addQueue(function() {
                self._parent._objects.getObjects(aObjs);
            });
        }
        self._parent._addQueue(function() {
            for (var nJ = 0; nJ < aChilds.length; nJ++) {
                var aFields = aChilds[nJ].fields != '' ? aChilds[nJ].fields.split(',') : [];
                sHTML += self._buildChildRow(
                    aChilds[nJ].label, 
                    aFields, 
                    aChilds[nJ].hm, 
                    aChilds[nJ].url, 
                    aChilds[nJ].showurl
                );
            }
            var oList = self._dom.fields.find('._child [data-mode="list"]');
            oList.html(sHTML);
        });
    }
    
    self._setColors = function() {
        var aColors = self._splitSpecialColors(self._aProperties.specialColors),
            oColorsList = self._dom.fields.find('._specialcolors [data-mode="list"]'),
            aDynamicField = [], aDynamicValue = [];
        oColorsList.html('');
        if (aColors == null || aColors == undefined) {
            return;
        }
        for (var nI = 0; nI < aColors.length; nI++) {
            oColorsList.append(self._buildColorRow(
                    aColors[nI]['field'], 
                    aColors[nI]['value'], 
                    aColors[nI]['text'], 
                    aColors[nI]['color'],
                    aColors[nI]['sort'],
                    aColors[nI]['tpl']
                )
            );
            if (('' + aColors[nI]['value']).indexOf('DYNAMIC') >= 0) {
                aDynamicField.push(aColors[nI]['field']);
                aDynamicValue.push(aColors[nI]['sort']);
            }
        }
        
        if (aDynamicField.length > 0) {
            self._refreshColorsDynamic(aDynamicField, aDynamicValue);
        }
    }
    
    self._splitSpecialColors = function(sColors) {
        if (typeof(sColors) == 'string' && sColors[0] == '[') {
            return jQuery.parseJSON(sColors);
        }
        var aColors = {};
        try {
            aColors = sColors != '' && typeof(sColors) == 'string'
            ? (
                sColors.indexOf('___') < 0 
                    ? jQuery.parseJSON(sColors) 
                    : sColors
                )
            : sColors;
        } catch (e) {
            aColors = {};
        }
        if (typeof(aColors) == 'string' && aColors.indexOf('___') >= 0 ) {
            var aTmp = aColors.split('::');
            aColors = {};
            for (var nI = 0; nI < aTmp.length; nI++) {
                var aField = aTmp[nI].split('___');
                if (aColors[aField[0]] == undefined) {
                    aColors[aField[0]] = {};
                }
                aColors[aField[0]][aField[1]] = aField[2];
            }
        }
        var aResult = [];
        
        jQuery.each(aColors, function(sField, aValues) {
            jQuery.each(aValues, function(sVal, sColor){
                var aVal = sVal.split('###');
                aResult.push({
                    "value" : aVal.length > 1 ? aVal[1] : aVal[0],
                    'text'  : aVal[0],
                    'field' : sField,
                    'color' : sColor
                })
            });
        });
        return aResult;
    }
    
    self._setMultiListArea = function(aData, sBlockName, sElementFieldName, sDataSelectorName) {
        if (aData == undefined || aData.length < 1) {
            return;
        }
        sElementFieldName = sElementFieldName || '';
        sDataSelectorName = sDataSelectorName || '';
        var oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]'),
            jOff = oFieldsForm.find('div[data-block="' + sBlockName + '"] .multi_select[data-list="_off"]'),
            jOn = oFieldsForm.find('div[data-block="' + sBlockName + '"] .multi_select[data-list="_on"]'),
            nI, jEl, mEl, sElName;
        if (jOff.size() < 1 || jOn.size() < 1) {
            return;
        }
        for (nI = 0; nI < aData.length; nI++) {
            mEl = aData[nI];
            sElName = sElementFieldName != '' && mEl[sElementFieldName] != undefined ? mEl[sElementFieldName] : mEl;
            var oEl = jOff.children('div[data-' + sDataSelectorName + '="' + sElName + '"]');
            oEl.remove().appendTo(jOn).removeClass('_off');
        }
    }
    
    self._setCalendarValues = function() {
        var nI, oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]');
        oFieldsForm.find('[data-field="name"] input').val(
            !self._bClone && self._aProperties.name != undefined ? self._aProperties.name : ''
        );
        var sColor = self._aProperties.color != undefined && self._aProperties.color != ''
            ? self._aProperties.color
            : '#89d248';
        oFieldsForm.find('[data-field="color"] input').val( sColor);
        oFieldsForm.find('[data-field="color"] ._color_selector').css('background-color', sColor)
                .removeClass('evt_tpl_' + Array.from(Array(34).keys()).join(' evt_tpl_'));
//        var sPrev = oFieldsForm.find('[data-field="color"] ._color_selector').data('tpl');
//        if (sPrev != undefined) {
//            console.log(sPrev);
//            oFieldsForm.find('[data-field="color"] ._color_selector').removeClass('evt_tpl_' + sPrev).data('tpl', '');
//        }

        if (self._aProperties.settings != undefined 
            && self._aProperties.settings.color_tpl != undefined 
            && self._aProperties.settings.color_tpl > 0
        ) {
            oFieldsForm.find('[data-field="color"] ._color_selector')
                    .data('tpl', self._aProperties.settings.color_tpl)
                    .addClass('evt_tpl_' + self._aProperties.settings.color_tpl);
        }
        
        
        self._dom.calendar.children('._text')
            .text(!self._bClone && self._aProperties.name != undefined ? self._aProperties.name : '');
        oFieldsForm.find('[data-field="visible"] input').attr('checked', self._aProperties.visible);
        
        if (!self._bClone && self._aProperties.friendlyName != undefined && self._sCalendarId != undefined) {
            oFieldsForm.find('[data-field="friendlyName"] input').val(self._aProperties.friendlyName);
            oFieldsForm.find('[data-field="id"] input').val(self._sCalendarId);
        } else {
            oFieldsForm.find('[data-field="friendlyName"] input, [data-field="id"] input').val('');
        }

        if (self._sCalendarType == 'sf') {
            
            var oEditable = oFieldsForm.find('[data-field="editable"] input');
            oEditable.attr('checked', self._aProperties.editable != null ? self._aProperties.editable : false);
            oFieldsForm.find('[data-field="start_field"] select').val(self._aProperties.start != null ? self._aProperties.start : '');
            oFieldsForm.find('[data-field="end_field"] select').val(self._aProperties.end != null ? self._aProperties.end : '');
            oFieldsForm.find('[data-field="entry_name"] select').val(self._aProperties.title != null ? self._aProperties.title : '');
            if (self._aProperties.group != null) {
                if (oFieldsForm.find('[data-field="gantt_grouping"] select option[value="' + self._aProperties.group + '"]').size() < 1) {
                    var oField = self._getStructureField(self._aProperties.group);
                    
                    var sOptionHTML = '<option value="' + self._aProperties.group + '" '
                        + 'class=" _out_selected ' 
                            + (self._aProperties.group.indexOf('.') >= 0 
                                ? '_sub_ref' 
                                : (oField.type == 'REFERENCE' ? ' _ref' : '')) 
                        + '"'
                        + '>' + (self._aProperties.group.indexOf('.') >= 0  ? '&nbsp;&nbsp;' : '')
                        + oField['label'].htmlspecialchars() + '</option>';
                    jQuery(sOptionHTML).insertAfter(oFieldsForm.find('[data-field="gantt_grouping"] select option').eq(0));
                }
                oFieldsForm.find('[data-field="gantt_grouping"] select').val(self._aProperties.group != null ? self._aProperties.group : '');
            }
            
            oFieldsForm.find('[data-temp="object_type"] select').val(0);
        }
        
        
        var oQuickOff = oFieldsForm.find('div[data-block="quick"] .multi_select[data-list="_off"]'),
            oQuickOn = oFieldsForm.find('div[data-block="quick"] .multi_select[data-list="_on"]');
        if (self._sCalendarType == 'sf') {
            self._setMultiListArea(self._aProperties.hover, 'hover', '', 'fid');
            //if (self._parent.params.insideEdit == '1') {
                self._setMultiListArea(
                    typeof(self._aProperties.addTitle) == 'string' ? self._aProperties.addTitle.split('::') : self._aProperties.addTitle, 
                    'add_title', 
                    '', 
                    'fid'
                );
            //}
            for (nI = 0; nI < self._aProperties.create.length; nI++) {
                var oEl = oQuickOff.children('div[data-fid="' + self._aProperties.create[nI].name + '"]');
                if (oEl.size() < 1) {
                    oEl = oQuickOn.children('div[data-fid="' + self._aProperties.create[nI].name + '"]');
                }
                oEl.remove()
                    .appendTo(oQuickOn)
                    .children('input[type="checkbox"]:not([disabled])')
                    .attr(
                        'checked', 
                        self._aProperties.create[nI].isRequiredCustom === true
                        || self._aProperties.create[nI].isRequiredCustom == 'true'
                    );
            }
//            if (self._parent.params.insideEdit != '1') {
//                self._setMultiListArea(self._aProperties.selectedSites, 'site', '', 'id');
//            }
            var oRadio = oFieldsForm.find(
                    'div[data-block="filter"] '
                    + ' [data-field="filter_owner"] input[value="' 
                        + (self._aProperties.filterOwner != undefined 
                            ? self._aProperties.filterOwner 
                            : 'all'
                        )
                    + '"]'
                );
            setTimeout(function(){
                oRadio.prop('checked', true).data('aaa_checked', self._aProperties.filterOwner);
            }, 0);
            
            self._setColors();
            self._setChild();
        } else if (self._sCalendarType == 'group') {
            self._setMultiListArea(self._aProperties.selectedCalendars, 'calendars', '', 'cid');
        } else if (self._sCalendarType == 'web') {
            oFieldsForm.find('[data-field="url"] input').val(self._aProperties.url);
        }
        if (!self._bClone || self._parent.options.readonly.cloneSharing !== false) {
            self._setMultiListArea(self._aProperties.selectedGroups, 'access', '', 'id');
        } 
        if (self._aProperties.limitGroups === true) {
            self._dom.fields.children('[data-type="' + self._sCalendarType + '"]').find('[data-block="access"]')
                .data('multiApi')
                .reInit({
                    "textLeft" : self._parent.getText('ce_more_100_groups', 
                                    "There are more than 100 Public Groups available in the org. "
                                    + "Click the Search button to refine your search criteria and display matching groups."
                                ) 
                });
        }
        oFieldsForm.find('input[name^="settings["], '
                    + 'select[name^="settings["],'
                    + 'textarea[name^="settings["]')
            .val('')
            .filter('[type="checkbox"]').attr('checked', false);
        if (self._aProperties.settings != undefined) {
            
            jQuery.each(self._aProperties.settings, function(sKey, mVal) {
                var oEl = self._dom.div.find('input[name="settings[' + sKey + ']"], '
                    + 'select[name="settings[' + sKey + ']"],'
                    + 'textarea[name="settings[' + sKey + ']"]');
                if (oEl.size() < 1) {
                    return;
                }
                switch (oEl[0].tagName) {
                    case 'INPUT' :
                        if (oEl.attr('type') == 'checkbox' ) {
                            oEl.attr('checked', mVal == 1 || mVal === true);
                        } else {
                            oEl.val(mVal);
                        }
                        break;
                    case 'TEXTAREA' :
                    case 'SELECT':
                        oEl.val(mVal);
                        break;
                }
                
            });
        }
    }
    
    
    
    self._changeSelectedObjectType = function(nOption) {
        self._fillObjectList(nOption);
        return;
    }
    
    self._changeSelectedObjectName = function(sObjectName) {
        self._sCurrentObject = sObjectName;
        self._parent._addQueue([
            function(){
                self._parent._objects.getObjectStructure(sObjectName, function(aFields, aObjectProperties){
                    self._aProperties.fields = aFields;
                    self._aProperties.fieldsList = Array.objectValues(self._aProperties.fields);
                    self._aProperties.fieldsList.quickSort(function(a,b){
                        if (a.label.toLowerCase() < b.label.toLowerCase()) {
                            return -1;
                        } else if (a.label.toLowerCase() > b.label.toLowerCase()) {
                            return 1;
                        }
                        return 0;
                    });
                    jQuery.extend(self._aProperties, aObjectProperties);
                });
            },
            function() {
                self._loadCalendarPropCheckReferences();
            },
            function() {
                self._fillNameOptions();
                self._fillGroupOptions();
                self._fillStartOptions();
                self._fillEndOptions();
                self._fillHoverOptions();
                self._fillQuickCreateOptions();
                self._fillColorsSelector();
                self._fillChildSelector();
//                if (self._parent.params.insideEdit == '1') {
                    self._fillAddTitleOptions();
//                }

                self._checkEditable();
                if (self._filterView != null) {
                    self._filterView.resetFilter(sObjectName, self._aProperties.fields);
                }
//                var oSpec
                if (self._sCalendarId == null) {
                    self._preFillLayoutFields(sObjectName);
                }
            }
        ]);
    }
    
    self._rebuildStructure = function() {
        var aList = [];
        jQuery.each(self._aProperties.fields, function(sKey, aField){
            aList.push(aField);
        });
        self._aProperties.structure = aList;
    }
    
    
    self._buildColorRow = function(sField, sVal, sTextVal, sColor, sSort, sTpl) {
        var aField = self._getStructureField(sField);
        sTextVal = sTextVal || sVal;
        sSort = sSort || 'name';
        if (aField == undefined) {
            return '';
        }
        var sFieldLabel = aField.label;
        if (sField.indexOf('.') >= 0) {
            sFieldLabel = self._getStructureField(sField.split('.')[0])['label'] + ' / ' + sFieldLabel;
        }
        if (sColor == undefined) {
            sColor = '#ffffff';
        }
        sColor = sColor.length == 6 && sColor.substr(0, 3) != 'rgb' ? '#' + sColor : sColor;
        sVal = '' + sVal;
        if (sVal.indexOf('###') >= 0 ) {
            var aTmp = sVal.split('###');
            if (aTmp.length > 1) {
                sTextVal = aTmp[0];
                sVal = aTmp[1];
            }
        };
        switch (aField.type) {
            case 'REFERENCE' :
//                var aTmp = sVal.split('###');
//                if (aTmp.length > 1) {
//                    sTextVal = aTmp[0];
//                    sVal = aTmp[1];
//                } else {
//                    return '';
//                }
                break;
            case 'BOOLEAN' :
                break;
            case 'TEXT':
            case 'STRING':
            case 'URL':
            case 'PHONE':
            case 'EMAIL':
                break;
            default:
                for (var nI = 0; nI < aField.options.length; nI++) {
                    var sKey = aField.options[nI].key 
                            ? aField.options[nI].key 
                            : aField.options[nI].value,
                        sName = aField.options[nI].key && aField.options[nI].value 
                            ? aField.options[nI].value 
                            : aField.options[nI].name;
                    if (sKey == sVal) {
                        sTextVal = sName;
                        break;
                    }
                }
            break;
        }
        sTextVal = '' + sTextVal;
        var sHTML = '<div data-field="' + sField + '" '
            + ' data-value="' + sVal.htmlspecialchars() + '" '
            + ' data-text="' + sTextVal.htmlspecialchars() + '" '
            + ' data-sort="' + (sVal.indexOf('DYNAMIC') >= 0 ? sSort : "") + '" '
            + ' data-tpl="' + (sTpl == undefined ? '0' : sTpl) + '"'
            + ' data-color="' + sColor +'">'
                + '<span class="simple_buttons">'
                    + '<span data-action="up_color">&uarr;</span>'
                    + '<span data-action="down_color">&darr;</span>'
                    + '<span data-action="del_color">X</span>'
                + '</span>'
                + '<span class="_color_selector ' 
                    + (sTpl == undefined ? '' : 'evt_tpl_' + sTpl) + '" '
                    + (sTpl == undefined ? '' : ' data-tpl="' + sTpl + '" ') 
                    + ' style="background-color:' + sColor + '"></span>'
                + '<span class="_field_name">' + sFieldLabel.htmlspecialchars() + '</span>'
                + '<span>' + sTextVal.htmlspecialchars() + '</span>'
                + (sVal.indexOf('DYNAMIC') >= 0 ? '<span class="_field_sort"></span>' : "")
                + '</div>';
//        if (sVal.indexOf('DYNAMIC') >= 0) {
//            self._parent._addQueue(function(){
//                self._refreshColorsDynamic(sField, sSort);
//            });
//            
//        }
        
        return sHTML;
        
    }
    
    self._changeColorField = function(sField) {
        var aField = self._getStructureField(sField),
            aColorBlock = self._dom.fields.find('._specialcolors [data-mode="selector"]');
        if (aField == undefined) {
            return;
        }
        aColorBlock.children('span[data-mode]').hide();
        switch(aField.type) {
            case 'REFERENCE':
                aColorBlock.children('span[data-mode="reference"]').show();
                break;
            case 'BOOLEAN' : 
                var sHTML = '<option value="true">True<option value="false">False';
                aColorBlock.children('span[data-mode="picklist"]').show();
                aColorBlock.find('span[data-mode="picklist"] select').html(sHTML);
                break;
            case 'TEXT':
            case 'STRING':
            case 'URL':
            case 'PHONE':
            case 'EMAIL':
                aColorBlock.children('span[data-mode="text"]').show();
                break;
            default:
                aColorBlock.children('span[data-mode="picklist"]').show();
                var sHTML = '';
                for (var nI = 0; nI < aField.options.length; nI++) {
                    var sKey = aField.options[nI].key 
                            ? aField.options[nI].key 
                            : aField.options[nI].value,
                        sName = aField.options[nI].key && aField.options[nI].value 
                            ? aField.options[nI].value 
                            : aField.options[nI].name;
                    sHTML += '<option value="' + sKey.htmlspecialchars() + '">' 
                        + sName.htmlspecialchars();
                }
                aColorBlock.find('span[data-mode="picklist"] select').html(sHTML);
                break;
            
        }
    }
    
    self._refreshColorsDynamic = function(mField, mSort) {
        var aRefObjects = [],
            aQ = [];
        mField = typeof(mField) == 'string' ? [mField] : mField;
        mSort = typeof(mSort) == 'string' ? [mSort] : mSort;
        
        for (var nJ = 0; nJ < mField.length; nJ++) {
            var sField = mField[nJ],
                aField = self._getStructureField(sField);
            if (aField == undefined) {
                continue;
            }
            if (aField.type == 'REFERENCE' && aField.options != undefined ) {
                for (var nO = 0; nO < aField.options.length; nO++) {
                    aRefObjects.push(aField.options[nO].name.toLowerCase());
                }
            }
                    
        }
        
        if (aRefObjects.length >= 0) {
            aQ.push(
                function(){
                    self._parent._objects.getObjects(aRefObjects);
                }, 
                function(){
                    
                    for (var nJ = 0; nJ < mField.length; nJ++) {
                        var sField = mField[nJ],
                            aField = self._getStructureField(sField),
                            sSort = (mSort != undefined && mSort[nJ]) || 'name';
                        if (aField == undefined) {
                            continue;
                        }
                        var aFields = self._parent._objects.getLinkedObjectsFields(
                            aField, 
                            null, 
                            true,
                            self._sCurrentObject
                        );
                        if (aFields.length > 0) {
                            var sHTML = 'Sort By <select name="sort" title="Sort by">';
                            for (var nO = 0; nO < aFields.length; nO++) {
                                sHTML += '<option value="' + aFields[nO].name.htmlspecialchars() + '" '
                                        + (aFields[nO].name == sSort ? 'selected' : "")
                                        + '>' + aFields[nO].label.htmlspecialchars() + '</option>';
                            }
                            sHTML += '</select>';
    //                        console.log(self._dom.fields.find('._specialcolors ._field_sort'), sHTML);
                            self._dom.fields.find('._specialcolors [data-mode="list"] [data-field="' + sField + '"] ._field_sort').html(sHTML);
                            self._dom.fields.find('._specialcolors [data-mode="list"] [data-field="' + sField + '"][data-sort]').data('sort', sSort);
                        }
                    }
                }
            );
        }
        self._parent._addQueue(aQ);
    }
    
    
    
    self._buildChildRow = function(sRelation, aFields, nHM, sURL, bShowUrl) {
        nHM = nHM || 10;
        var aChild = self._getChildRelation(sRelation);
        if (aChild == null) {
            return '';;
        }
        var sChildObjectName = self._parent._objects.getObjectLabel(aChild.object),
            aField = self._parent._objects.getObjectFieldByName(aChild.object, aChild.field);
//            self._getStructureField(aChild.field);
        if (aField == undefined) {
            return '';
        }
        var sHTML = '<div data-child="' + sRelation + '" '
            + ' data-fields="' + (aFields != undefined ? aFields.join(",").htmlspecialchars() : '' )+ '" '
            + ' data-hm="' + (nHM != undefined ? nHM : 10) + '" '
            + ' data-url="' + (sURL != undefined ? sURL : '')+ '" '
            + ' data-showurl="' + (bShowUrl != undefined ? bShowUrl : '')+ '" '
            + '>'
                + '<span class="simple_buttons">'
                    + '<span data-action="up_child">&uarr;</span>'
                    + '<span data-action="down_child">&darr;</span>'
                    + '<span data-action="edit_child">E</span>'
                    + '<span data-action="del_child">X</span>'
                + '</span>'
                + '<span class="_child_name">' + sChildObjectName + ' (' + aField.label + ')</span>'
            + '</div>';
        return sHTML;
    }
    
    self._checkEditable = function() {
        var sStart = self._dom.fields.find('[data-field="start_field"] select').val(),
            sEnd = self._dom.fields.find('[data-field="end_field"] select').val(),
            oEditable = self._dom.fields.find('[data-field="editable"] input'),
            aStartField = self._getStructureField(sStart),
            aEndField = self._getStructureField(sEnd);
        
        var bReferenceStartEnd = (sStart != null && sStart.indexOf('.') >= 0) || (sEnd != null && sEnd.indexOf('.') >= 0),
            bCreateable = !bReferenceStartEnd 
                && self._aProperties.iscreateable == true 
                && aStartField != undefined 
                && aStartField.isCreateable === true 
                && (aEndField == null || (sEnd != '' && aEndField != undefined && aEndField.isCreateable )
                ),
            bUpdateable = self._aProperties.iseditable == true && !bReferenceStartEnd,
            bMoveAble = bUpdateable 
                && aStartField != undefined 
                && aStartField.isUpdateable === true 
                && (aEndField == null || (sEnd != '' && aEndField != undefined && aEndField.isUpdateable )
                );
            
        if (
            (bCreateable || bUpdateable || bMoveAble)
//            self._parent.params.insideEdit == '1' 
//                && 
//            || self._parent.params.insideEdit != '1' 
//                && (bCreateable && bUpdateable && bMoveAble)
            ) {
            oEditable.attr('disabled', false).attr('title', 
                (bCreateable ? 'C' : '')
                + (bUpdateable ? 'U' : '')
                + (bMoveAble ? 'M' : '')
            );
        } else {
            oEditable.attr('disabled', true).attr('checked', false);
        }
    }
    
    
    self._setColorGroup = function() {
        self._dom.fields.find('[data-field="colorType"] input[value="' + self._aProperties.colorType + '"]')
            .attr('checked', true)
    }
    
    self._getActiveGroups = function() {
        var oList = self._dom.fields
                .children('[data-type="' + self._sCalendarType + '"]')
                .find('[data-block="access"] div[data-list="_on"]'),
            aResult = [];
        if (self._aProperties.limitSharedGroups === true) {
            aResult.push('ADD');
        }
        oList.children('[data-id]').each(function(){
            aResult.push(jQuery(this).data('id'));
        });
        return aResult;
    }
    
    self._getActiveSites = function() {
        var oList = self._dom.fields.find('[data-block="site"] div[data-list="_on"]'),
            aResult = [];
//        if (self._parent.params.insideEdit == '1') {
        return aResult;
//        }
        oList.children('[data-id]').each(function(){
            aResult.push(jQuery(this).data('id'));
        });
        return aResult;
    }
    
    self._getActiveHover = function() {
        var oList = self._dom.fields.find('[data-block="hover"] div[data-list="_on"]'),
            aResult = [];
        oList.children('[data-fid]').each(function(){
            aResult.push(jQuery(this).data('fid'));
        });
        return aResult;
    }
    
    self._getActiveCreate = function() {
        var oList = self._dom.fields.find('[data-block="quick"] div[data-list="_on"]'),
            aResult = [];
        oList.children('[data-fid]').each(function(){
            aResult.push(jQuery(this).data('fid') + '___' + (jQuery(this).children('input').attr('checked') ? '1' : '0'));
        });
        return aResult;
    }
    
    self._getActiveColors = function() {
        var oList = self._dom.fields.find('._specialcolors [data-mode="list"]'),
            aResult = [];
        oList.children('[data-field]').each(function(){
            var oEl = jQuery(this);
            aResult.push({
                "field" : oEl.data('field'),
                "value" : oEl.data('value'),
                "text" : oEl.data('text'),
                "color" : oEl.data('color'),
                "sort" : oEl.data('sort') != undefined ? oEl.data('sort') : '',
                "tpl" : oEl.data('tpl') != undefined ? oEl.data('tpl') : '0',
            });
            //aResult.push(oEl.data('field') + '___' + oEl.data('value') + '___' + oEl.data('color'));
        });
        return JSON.stringify(aResult);
    }
    
    self._getChilds = function() {
        var oList = self._dom.fields.find('._child                                  [data-mode="list"]'),
            aResult = [];
        oList.children('[data-child]').each(function(){
            var oEl = jQuery(this),
                aChild = self._getChildRelation(oEl.data('child'));
            if (aChild == undefined) {
                return;
            }
            aResult.push({
                "label" : aChild.label,
                "field" : aChild.field,
                "object" : aChild.object,
                "fields" : oEl.data('fields'),
                "hm" : oEl.data('hm'),
                "url"   : oEl.data('url'),
                "showurl" : oEl.data('showurl'),
            });
            //aResult.push(oEl.data('field') + '___' + oEl.data('value') + '___' + oEl.data('color'));
        });
        return JSON.stringify(aResult);
    }
    
    self._getActiveCalendars = function() {
        var oList = self._dom.fields.find('[data-block="calendars"] div[data-list="_on"]'),
            aResult = [];
        oList.children('[data-cid]').each(function(){
            aResult.push(jQuery(this).data('cid'));
        });
        return aResult;
    }
    
    self._getActiveAddTitles = function() {
        var oList = self._dom.fields.find('[data-block="add_title"] div[data-list="_on"]'),
            aResult = [];
//        if (self._parent.params.insideEdit != '1') {
//            return aResult;
//        }
        oList.children('[data-fid]').each(function(){
            aResult.push(jQuery(this).data('fid'));
        });
        return aResult;
    }

    
    /*---- ACTION METHODS---*/
    
    self._add_colorAction = function(el, evt) {
        var oColorBar = self._dom.fields.find('._specialcolors'),
            oColorsList = oColorBar.find('[data-mode="list"]'),
            sField = oColorBar.find('select[name="field"]').val(),
            sVal = oColorBar.find(
                'select[name="value"]:visible,'
                + ' input[name="value_text"][type="text"]:visible'
            ).val(),
            sId = oColorBar.find('input.ca_filter_reference').data('id');
        if (sField == '' || oColorsList.find('div[data-field="' + sField + '"][data-value="' + sVal + '"]').size() > 0) {
            return;
        }
        oColorBar.find('input.ca_filter_reference').data('id', '');
        oColorBar.find('input[name="value_text"][type="text"]:visible').val('');
        oColorsList.append(self._buildColorRow(sField, sId != undefined && sId != '' ? sId : sVal, sVal, '#fff'));
        if (sVal.indexOf('DYNAMIC') >= 0) {
            self._refreshColorsDynamic(sField);
        }
    }
    
    self._del_colorAction = function(el, evt) {
        jQuery(evt.target).parents('div[data-color]').remove();
    }
    
    self._up_colorAction = function(el, evt) {
        var oRow = jQuery(evt.target).parents('div[data-color]'),
            oPrev = oRow.prev();
        if (oPrev.size() > 0) {
            oPrev.before(oRow);
        }
        
    }
    
    self._down_colorAction = function(el, evt) {
        var oRow = jQuery(evt.target).parents('div[data-color]'),
            oNext = oRow.next();
        if (oNext.size() > 0) {
            oNext.after(oRow);
        }
        
    }
    
    self._show_color_referencesAction = function(el, evt) {
        var oColorBar = self._dom.fields.find('._specialcolors'),
            sField = oColorBar.find('select[name="field"]').val(),
            oInput = oColorBar.find('input.ca_filter_reference');
        if (evt.data == undefined) {
            evt.data = {};
        }
        jQuery.extend(evt.data, {
            object : self._sCurrentObject,
            field : sField,
            input : oInput,
            parent : oColorBar.parent(),
            selectorDiv : self._dom.div,
            onselect : function(sText, sId) {
                oInput.val(sText).data('id', sId);
            },
            additionOptions : [{name : "_NOT EMPTY_", id : "!NULL"}, {name : "_IS EMPTY_", id : "NULL"}, {name : "_DYNAMIC_", id : "DYNAMIC"}]
        });
        return self._filterView.action('show_external_references', el, evt);
    }
    
    self._colorReferenceSelector = function(evt) {
        if (self._nColorRefTimer != null) {
            clearTimeout(self._nColorRefTimer);
            self._nColorRefTimer = null;
        }
        
        var el = jQuery(evt.currentTarget);
        
        switch (evt.which ) {
            case 27 :
            case 38 :
            case 40 :
            case 13 :
                self._filterView.action('key_selector', el, evt);

        }
        if ((evt.which <= 48 || evt.which >= 91) && evt.which != 8 && evt.which != 46) {
            return;
        }
        self._nColorRefTimer = setTimeout(function(){
            self._show_color_referencesAction(el, evt);
        }, 200);
    }
    
    self._add_childAction = function(el, evt){
        var sVal = self._dom.fields.find('._child [data-submode="list"] select').val(),
            oList = self._dom.fields.find('._child [data-submode="list"] p[data-mode="list"]');
    
        if (sVal == null || sVal == '' || oList.children('[data-child="' + sVal + '"]').size() > 0) {
            return;
        }
        var aChild = self._getChildRelation(sVal);
        self._parent._objects.getObject(aChild.object, function(){
            oList.append(self._buildChildRow(sVal));
        });
    }
    
    self._del_childAction = function(el, evt) {
        jQuery(evt.target).parents('div[data-child]').remove();
    }
    
    self._up_childAction = function(el, evt) {
        var oRow = jQuery(evt.target).parents('div[data-child]'),
            oPrev = oRow.prev();
        if (oPrev.size() > 0) {
            oPrev.before(oRow);
        }
    }
    
    self._down_childAction = function(el, evt) {
        var oRow = jQuery(evt.target).parents('div[data-child]'),
            oNext = oRow.next();
        if (oNext.size() > 0) {
            oNext.after(oRow);
        }
    }
    
    self._edit_childAction = function(el, evt) {
        var oRow = jQuery(evt.target).parents('div[data-child]'),
            oList = self._dom.fields.find('._child [data-submode="list"]'),
            oFields = self._dom.fields.find('._child [data-submode="fields"]'),
            aChild = self._getChildRelation(oRow.data('child'));
        
//        self._parent._objects.getObjectStructure(aChild.object, function(aFields, aObjectProperties){
        self._parent._objects.getObjects(aChild.object, function(aObjs){
            oList.hide();
            oFields.show();
            oFields.find('._child_title').text(aChild.field + ' -> ' + aChild.object);
            oFields.find('input[data-name], select[data-name]').each(function(){
                var oField = jQuery(this),
                    sVal = oRow.data(oField.data('name'));
                if (oField.attr('type') == 'checkbox') {
                    oField.prop('checked', sVal == 'true' || sVal);
                } else {
                    oField.val(sVal != undefined ? sVal : '');
                }
            });
            self._fillHoverOptions('child', Array.objectValues(aObjs[aChild.object].fields));
//            self._fillHoverOptions('child', Array.objectValues(aFields));
            self._setMultiListArea(oRow.data('fields').split(','), 'child', '', 'fid');
            oFields.data('active', aChild.label);
        }, {loadReferenced : true, "onlySingleReference" : true});
    }
    
    self._back_childAction = function(el, evt) {
        var oList = self._dom.fields.find('._child [data-submode="list"]'),
            oFields = self._dom.fields.find('._child [data-submode="fields"]'),
            oRow = oList.find('div[data-child="' + oFields.data('active') + '"]');
        if (oFields.css('display') != 'block') {
            return;
        }
        var oListData = oFields.find('div[data-list="_on"]'),
            aResult = [];
        oListData.children('[data-fid]').each(function(){
            aResult.push(jQuery(this).data('fid'));
        });
        oRow.data('fields', aResult.join(','));
        oFields.find('input[data-name], select[data-name]').each(function(){
            var oField = jQuery(this),
                sVal = oField.val();
            if (oField.attr('type') == 'checkbox') {
                sVal = oField.is(':checked') ? 'true' : '';
            }
            
            oRow.data(oField.data('name'), sVal);
        });
        
        oList.show();
        oFields.hide();
    }
    
    self._cancel_childAction = function(el, evt) {
        var oList = self._dom.fields.find('._child [data-submode="list"]'),
            oFields = self._dom.fields.find('._child [data-submode="fields"]');
        oList.show();
        oFields.hide();
    }
    
    self._save_calendarAction = function(el, evt) {
        var aCalendarParams,
            oFieldsForm = self._dom.fields.children('.on'),
            bCorrect = true,
            oButton = jQuery(evt.target);
        
        if (oButton.data('off') == 1 ) {
            return false;
        }
        oFieldsForm.find('._err').removeClass('_err');
        oFieldsForm.find('input[required], select[required]').each(function(){
            var oField = jQuery(this),
                mVal = oField.val();
            if (mVal == '') {
                self._changeStep(null, oField);
                bCorrect = false;
                return false;
            }
        });
        oFieldsForm.find('input[pattern]').each(function(){
            var oField = jQuery(this),
                mVal = oField.val(),
                oPattern = new RegExp(oField.attr('pattern'));
            if (mVal.match(oPattern) == null) {
                self._changeStep(null, oField);
                bCorrect = false;
                return false;
            }
        });
        
        oFieldsForm.children('[data-onsave]').each(function(){
            var sAction = jQuery(this).data('onsave');
            if (typeof(self['_' + sAction + 'Action']) == 'function'){
                self['_' + sAction + 'Action'](el, evt);
            }
        });
        if (!bCorrect) {
            return;
        }
        
        if (self._sCalendarType == 'sf') {
            aCalendarParams = {
                name            : oFieldsForm.find('[data-field="name"] input').val().substr(0, 80),
                friendlyName    : oFieldsForm.find('[data-field="friendlyName"] input').val().substr(0, 255),
                selectedObject  : oFieldsForm.find('[data-field="object_name"] select').val(),
                color           : oFieldsForm.find('[data-field="color"] input').val(),
                start           : oFieldsForm.find('[data-field="start_field"] select').val(),
                end             : oFieldsForm.find('[data-field="end_field"] select').val(),
                title           : oFieldsForm.find('[data-field="entry_name"] select').val(),
                group           : oFieldsForm.find('[data-field="gantt_grouping"] select').val(),
                visible         : oFieldsForm.find('[data-field="visible"] input').prop('checked') ? true : false,
                editable        : oFieldsForm.find('[data-field="editable"] input').prop('checked') ? true : false,
                filter          : self._filterView.getFilters(true),
                rule            : self._filterView.getRule(),
                filterOwner     : oFieldsForm.find('div[data-block="filter"] '
                                    + ' [data-field="filter_owner"] input:checked').val(),
                selectedGroups  : self._getActiveGroups().join('::'),
                selectedSites   : self._getActiveSites().join('::'),
                hover           : self._getActiveHover().join('::'),
                addTitle        : self._getActiveAddTitles().join('::'),
                create          : self._getActiveCreate().join('::'),
//                specialColors   : self._getActiveColors().join('::'),
                specialColors   : self._getActiveColors(),
                childFields     : self._getChilds(),
                clearToken      : oFieldsForm.find('[data-field="clear_token"] input').prop('checked') ? 'true' : 'false'
            };
        } else if (self._sCalendarType == 'group') {
            aCalendarParams = {
                name            : oFieldsForm.find('[data-field="name"] input').val().substr(0, 80),
                friendlyName    : oFieldsForm.find('[data-field="friendlyName"] input').val().substr(0, 255),
                color           : oFieldsForm.find('[data-field="color"] input').val(),
                colorType       : oFieldsForm.find('[data-field="colorType"] input:checked').val(),
                visible         : oFieldsForm.find('[data-field="visible"] input').prop('checked') ? true : false,
                selectedGroups  : self._getActiveGroups().join('::'),
                selectedCalendars   : self._getActiveCalendars().join('::')
            };
        } else if (self._sCalendarType == 'web') { 
            aCalendarParams = {
                name            : oFieldsForm.find('[data-field="name"] input').val().substr(0, 80),
                friendlyName    : oFieldsForm.find('[data-field="friendlyName"] input').val().substr(0, 255),                        
                color           : oFieldsForm.find('[data-field="color"] input').val(),
                url             : oFieldsForm.find('[data-field="url"] input').val().substr(0, 255),
                visible         : oFieldsForm.find('[data-field="visible"] input').prop('checked') ? true : false,
                selectedGroups  : self._getActiveGroups().join('::')
            };
            
        }
        var oSettings = {};
        oFieldsForm.find('input[name^="settings["], '
                    + 'select[name^="settings["],'
                    + 'textarea[name^="settings["]')
        .each(function(nIdx, oEl){
            oEl = jQuery(oEl);
            var sSettingName = oEl.attr('name').replace('settings[', '').replace(']', '');
            switch(oEl[0].tagName) {
                case 'TEXTAREA':
                case 'SELECT':
                    oSettings[sSettingName] = oEl.val();
                    break;
                case 'INPUT' :
                    if (oEl.attr('type') == 'checkbox') {
                        oSettings[sSettingName] = oEl.prop('checked') == true ? '1' : '0';
                    } else {
                        oSettings[sSettingName] = oEl.val();
                    }
                    break;
            }
        });
        if (oFieldsForm.find('[data-field="color"] ._color_selector').data('tpl') != undefined) {
            oSettings['color_tpl'] = oFieldsForm.find('[data-field="color"] ._color_selector').data('tpl');
        }
        aCalendarParams.settings = JSON.stringify(oSettings);
        
        if (aCalendarParams.color == undefined || aCalendarParams.color == null || aCalendarParams.color == '')  {
            aCalendarParams.color = '#ffffff';
        }
        if (aCalendarParams.filter === false) {
            self._changeStep(2);
            return;
        } else if (aCalendarParams.filter != undefined) {
            aCalendarParams.filter = aCalendarParams.filter.join('##');
        }
        if (aCalendarParams.selectedCalendars != undefined && aCalendarParams.selectedCalendars === '') {
            oFieldsForm.find('[data-block="calendars"] div[data-list="_on"]').addClass('_err');
            self._changeStep(1);
            return;
        }
        aCalendarParams.type = self._sCalendarType;
        oButton.data('off', 1).addClass('_working').text('Saving');
        self._parent._calendars.saveCalendar(!self._bClone ? self._sCalendarId : null, aCalendarParams, function(aResponce) {
            oButton.data('off', "").removeClass('_working').text('Save');
            if (('' + aResponce.status).indexOf('Error') >= 0) {
                return false;
            }
            var sNewId = aResponce.id != undefined 
                ? aResponce.id
                : (aResponce.result != undefined && aResponce.result.id != undefined)
                    ? aResponce.result.id
                    : null;
            if (self._sCalendarId != sNewId) {
                if (aResponce.result != undefined) {
                    self._parent._calendars.append(aResponce.result);
                    self._parent.layout.refreshCalendarsInSettings();
                }
                
            } else if (sNewId != null) {
                self._parent._calendars.update(aResponce.result);
                if (self._aProperties.visible != aCalendarParams.visible) {
                    self._parent.layout.changeVisibleCalendar(
                        aCalendarParams.visible ? [sNewId] : null, 
                        aCalendarParams.visible ? undefined : [sNewId],
                        true
                    );
                    if (aCalendarParams.visible === false) {
                        self._parent.layout.removeCalendars([sNewId]);
                    } else {
                        self._parent.layout.refreshCalendarsInSettings();
                    }
                }
            }
            
//            console.log(aResponce);
            self._parent._dom.el.find('.CA_color_select').hide();
            self._parent.hidePopup();
        });
//        console.log(aCalendarParams);
        
    }
    
    self._edit_calendarAction = function(el, evt) {
        var aRow = jQuery(evt.target).parents('tr[data-id]'),
            sId = aRow.data('id');
        self._parent.hidePopup();
        view.show({
            type : self._sCalendarType,
            calendar : sId,
            "clone" : false,
            "mode"  : "edit"
        });
    }
    
    self._add_calendarAction = function(el, evt) {
        self._parent.hidePopup();
        view.show({
            type : self._sCalendarType,
            calendar : '',
            "clone" : false,
            "mode"  : "edit"
        });
    }
    
    self._clone_calendarAction = function(el, evt) {
        var aRow = jQuery(evt.target).parents('tr[data-id]'),
            sId = aRow.data('id');
        self._parent.hidePopup();
        view.show({
            type : self._sCalendarType,
            calendar : sId,
            "clone" : true,
            "mode"  : "edit"
        });
    }
    
    self._del_calendarAction = function(el, evt) {
        var aRow = jQuery(evt.target).parents('tr[data-id]'),
            sId = aRow.data('id');
        /*
        if (!self._parent.params.confirmDelete || confirm(self._parent.getText('shure_to_delete', 'Are you sure you want to delete?'))
        ) {
            self._parent.layout.delCalendar(sId);
            aRow.remove();
        }
        */
        
        if (!self._parent.params.confirmDelete) {
            self._parent.layout.delCalendar(sId);
            aRow.remove();
        } else {
            self._parent.showNotify(self._parent.getText('shure_to_delete', 'Are you sure you want to delete?'), 'confirm', function() {
                self._parent.layout.delCalendar(sId);
                aRow.remove();
            });
        };
    }
    
    self._cancelAction = function(el)  {
        self._parent.hidePopup();
        self._parent._dom.el.find('.CA_color_select').hide();
    }
    
    
    self._next_stepAction = function(el, evt) {
        self._changeStep('+1');
    }
    
    self._prev_stepAction = function(el, evt) {
        self._changeStep('-1');
    }
    
    self._changeStep = function(mStep, oField) {
        if (mStep == null && oField != undefined) {
            oField.focus();
            mStep = oField.parents('._fields').parent().index();
        }
        
        var oBlocks = self._dom.fields.children('.on').children(),
            oSelector = self._dom.title.find('select'),
            nStep = typeof(mStep) == 'number' ? mStep : parseInt(oSelector.val()) + parseInt(mStep);
        
        if (nStep >= oBlocks.size() || nStep < 0) {
            return;
        }
        if (typeof(mStep) == 'string' || oSelector.val() != nStep) {
            oSelector.val(nStep);
        }
        oBlocks.filter('.on').removeClass('on');
        oBlocks.eq(nStep).addClass('on');
    }
    
    self._nextAction = function(oEl) {
        self._loadCalendarsList({page : self._nListPage + self._nMaxCalendars, text : self._dom.searchList.val()});
    }
    
    self._prevAction = function(oEl) {
        self._loadCalendarsList({page : self._nListPage - self._nMaxCalendars, text : self._dom.searchList.val()});
    }
    
    self._buildSFList = function() {
        var sHTML = '<table>'
            + '<thead>'
                + '<tr>'
                    + '<th></th>'
                    + '<th data-field="name">' + self._parent.getText('ce_name', 'Name') + '</th>'
                    + '<th data-field="color">' + self._parent.getText('ce_color', 'Color') + '</th>'
                    + '<th data-field="owner_name">' + self._parent.getText('ce_owner', 'Owner') + '</th>'
                    + '<th data-field="object">' + self._parent.getText('ce_object', 'Object') + '</th>'
                    + '<th data-field="start">' + self._parent.getText('details_start', 'Start') + '</th>'
                    + '<th data-field="end">' + self._parent.getText('details_end', 'End') + '</th>'
                    + '<th data-field="title">' + self._parent.getText('details_title', 'Title') + '</th>'
                    + '<th data-field="ownership">' + self._parent.getText('ce_ownership', 'Ownership') + '</th>'
                + '</tr>'
            + '</thead>'
            + '<tbody></tbody>'
            + '</table>';
        return sHTML;
    }
    
    self._buildGroupList = function() {
        var sHTML = '<table>'
            + '<thead>'
                + '<tr>'
                    + '<th></th>'
                    + '<th data-field="name">' + self._parent.getText('ce_name', 'Name') + '</th>'
                    + '<th data-field="color">' + self._parent.getText('ce_color', 'Color') + '</th>'
                    + '<th data-field="owner_name">' + self._parent.getText('ce_owner', 'Owner') + '</th>'
                    + '<th data-field="calendars">' + self._parent.getText('cs_tab_calendars', 'Calendars') + '</th>'
                + '</tr>'
            + '</thead>'
            + '<tbody></tbody>'
            + '</table>';
        return sHTML;
    }
    
    self._buildWebList = function() {
        var sHTML = '<table>'
            + '<thead>'
                + '<tr>'
                    + '<th></th>'
                    + '<th data-field="name">' + self._parent.getText('ce_name', 'Name') + '</th>'
                    + '<th data-field="color">' + self._parent.getText('ce_color', 'Color') + '</th>'
                    + '<th data-field="owner_name">' + self._parent.getText('ce_owner', 'Owner') + '</th>'
                    + '<th data-field="url">' + self._parent.getText('ce_url', 'Url') + '</th>'
                + '</tr>'
            + '</thead>'
            + '<tbody></tbody>'
            + '</table>';
        return sHTML;
    }
    
    self._loadCalendarsList = function(aParams) {

        aParams = aParams || {page : 0, text : ""};
        self._nListPage = aParams.page != undefined ? aParams.page : self._nListPage;
        self._parent._calendars.getCalendarsList(self._sCalendarType, aParams, function(aList){
            self._dom.div
                .toggleClass('_more_next', aList.length > self._nMaxCalendars)
                .toggleClass('_more_prev', aParams.page > 0);
        
            if (aList.length > self._nMaxCalendars) {
                aList.length = self._nMaxCalendars;
            }
            self._aList = aList;
            self._refreshList();
            var sMode = self._dom.list.children('.on').data('type');
            if (sMode == undefined || sMode != self._sCalendarType || aParams.init === true) {
                self._dom.searchList.val('');
                self._dom.list.children().removeClass('on')
                    .filter('div[data-type="' + self._sCalendarType + '"]').addClass('on');
                self._dom.div.find('.form_buttons span[data-action="add_calendar"]')
                    .text(self._buttonTitles[self._sCalendarType])
                    .toggleClass('_CA_off', !self._parent._calendars.getPermission('Create', self._sCalendarType));
                if (sMode == undefined || aParams.init === true) {
                    self._parent.showPopup({
                        dom         : self._dom.div,         // send ready dom 
                        center      : true,
                        shadow      : true,
                        view        : view,
                        autohide    : false,
                        overflow    : false,
                        noCloseRule : '.CA_calendar, .CA_color_select',
                        modal       : true,
                        onClose     : function() {
                            //self._checkClose()
                        }
                    });
                }
            }
        });
    }
    
    self._refreshList = function(aParams) {
        var oTable = self._dom.list.find('div[data-type="' + self._sCalendarType + '"] > table'),
            sHTML = '',
            aColumns = self._aListColumns[self._sCalendarType],
            aCurParams = oTable.data('params');
        aParams = aParams || {"page" : 0, "hm" : 10, "letter" : '', 'sort' : 'name', "more" : false};
        
        self._aList.quickSort(function(a, b){
            var sFirst = a[aParams.sort] != undefined ? a[aParams.sort].toLowerCase() : '',
                sSecond = b[aParams.sort] != undefined ? b[aParams.sort].toLowerCase() : "",
                nResult = sFirst > sSecond
                    ? 1 
                    : (sFirst < sSecond  ? -1 : 0);
            return aParams.down ? -1 * nResult : nResult;
        });
        for (var nI = 0; nI < self._aList.length; nI++) {
            if (aParams.letter != undefined && aParams.letter != '' && self._aList[nI]['name'][0] != aParams.letter) {
                continue;
            }
            sHTML += '<tr data-id="' +  self._aList[nI]['id'] + '">'
                + '<td>'
                    + '<a data-action="edit_calendar" class="_ico_edit ' 
                        + ((self._aList[nI].operation !== true && self._aList[nI].operation !== 'edit')
                            || !self._parent._calendars.getPermission('Edit', self._sCalendarType) 
                            ? '_off' 
                            : ''
                        ) 
                        + '" title="' + self._parent.getText('edit', 'Edit') + '"></a>'
                    + '<a data-action="clone_calendar" class="_ico_clone '
                        + (!self._parent._calendars.getPermission('Create', self._sCalendarType) 
                            ? ' _off'
                            : ""
                        )
                        + '" title="' + self._parent.getText('clone', 'Clone') + '"></a>'
                    + '<a data-action="del_calendar" class="_ico_del ' 
                        + ((self._aList[nI].operation !== true && self._aList[nI].operation  !== 'delete')
                            || !self._parent._calendars.getPermission('Delete', self._sCalendarType) 
                            ? '_off' 
                            : ''
                        ) 
                        + '" title="' + self._parent.getText('delete', 'Del') + '"></a>'
                + '</td>';
            for (var nJ = 0; nJ < aColumns.length; nJ++ ) {
                sHTML += '<td>';
                if (aColumns[nJ] == 'color') {
                    sHTML += '<span class="_color" style="background-color:' + self._aList[nI][aColumns[nJ]] + '"></span>';
                } else {
                    sHTML += self._aList[nI][aColumns[nJ]] != null 
                        ? (typeof(self._aList[nI][aColumns[nJ]]) == 'string' ? self._aList[nI][aColumns[nJ]].htmlspecialchars() : self._aList[nI][aColumns[nJ]])
                        : "";
                }
                sHTML += '</td>';
            }
            sHTML += '</tr>';
        }
        if (aParams.more) {
            sHTML += '<tr><td colspan="' + (aColumns.length + 1) + '"><span data-action="more_calendars" class="simple_button">' 
                + self._parent.getText('detail_more', 'More')
                + '</span></td></tr>';
        }
        oTable.find('tbody').html(sHTML);
    }
    
    self._preFillLayoutFields = function(sObjectName) {
        sObjectName = sObjectName || self._sCurrentObject;
        self._parent._addQueue([
            function(){
                self._parent._objects.initConnectLib();
            },
            function(){
                if (!window['sforce'] || window['sforce'].connection == undefined) {
                    return;
                }
                window['sforce'].connection.sessionId = self._parent.options.session;
                if (typeof(self._aPredefineLayoutFields[sObjectName]) 
                    && (self._aAvaibleForCheckLayouts.indexOf(sObjectName) >= 0
                        || sObjectName.indexOf('__c') >= 0
                    )
                ) {
                    window['sforce'].connection.describeLayout(sObjectName, null, function(data){
		        var aLayout = jQuery.isArray(data.layouts) ? data.layouts[0] : data.layouts;
                        self._aPredefineLayoutFields[sObjectName] = {
                            "hover" : self._calculateBlock(aLayout.detailLayoutSections), 
                            "create" : self._calculateBlock(aLayout.editLayoutSections, true)
                        };
                        self._fillLayoutFields(sObjectName);
                    });
                } else {
                    self._fillLayoutFields(sObjectName);
                }
            }
        ]);
    }
    
    self._calculateBlock = function(aSections, bCreate) {
        var aResult = [],
            aTmp = [],
            aRows, aItems, 
            nI, nJ, nK;
        bCreate = bCreate || false;
	if (aSections == null || aSections == undefined) {
	    return [];
	}
        if (!jQuery.isArray(aSections))  {
            aSections = [aSections];
        }
        for (nI = 0; nI < aSections.length; nI++) {
            aRows = jQuery.isArray(aSections[nI].layoutRows) 
                ? aSections[nI].layoutRows 
                : [aSections[nI].layoutRows];
            for (nJ = 0; nJ < aRows.length; nJ++) {
                aItems = jQuery.isArray(aRows[nJ].layoutItems) ? aRows[nJ].layoutItems : [aRows[nJ].layoutItems];
                for (nK = 0; nK < aItems.length; nK++) {
                    if (
                        aItems[nK].layoutComponents != undefined 
                        && 
                        aItems[nK].layoutComponents.type == 'Field'
                    ) {
//                        console.log(aItems[nK].layoutComponents.tabOrder, aItems[nK].layoutComponents.value);
                        aTmp[aItems[nK].layoutComponents.tabOrder] = 
                            {name : aItems[nK].layoutComponents.value.toLowerCase()};
                        if (bCreate) {
                            aTmp[aItems[nK].layoutComponents.tabOrder].required = 
                                '' + aItems[nK].required == 'true';
                        }
                        
                    }
                }
            }
        }
        for (nI = 0; nI < aTmp.length; nI++) {
            if (aTmp[nI] == undefined) {
                continue;
            }
            aResult.push(aTmp[nI]);
        }
        return aResult;
    }
    
    self._fillLayoutFields = function(sObjectName) {
        if (self._aPredefineLayoutFields[sObjectName] == undefined) {
            return;
        }
        var oFieldsForm = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]'),
            oHoverOff = oFieldsForm.find('div[data-block="hover"] .multi_select[data-list="_off"]'),
            oHoverOn = oFieldsForm.find('div[data-block="hover"] .multi_select[data-list="_on"]'),
            oQuickOff = oFieldsForm.find('div[data-block="quick"] .multi_select[data-list="_off"]'),
            oQuickOn = oFieldsForm.find('div[data-block="quick"] .multi_select[data-list="_on"]'),
            nI,
            aHover = self._aPredefineLayoutFields[sObjectName].hover,
            aCreate = self._aPredefineLayoutFields[sObjectName].create;
        for (nI = 0; nI < aHover.length; nI++) {
            oHoverOff.children('div[data-fid="' + aHover[nI].name + '"]')
                .remove().appendTo(oHoverOn);
        }
        for (nI = 0; nI < aCreate.length; nI++) {
            oQuickOff.children('div[data-fid="' + aCreate[nI].name + '"]')
                .remove().appendTo(oQuickOn)
                .children('input[type="checkbox"]:not([disabled])')
                    .attr('checked', aCreate[nI].required === true);
        }
    }
    
    self._showHelp = function(bMode) {
        
    }
    
    self._calculateFriendlyName = function(sVal) {
        var oAlias = self._dom.fields.children('[data-type="' + self._sCalendarType + '"]')
            .find('span[data-field="friendlyName"] input'),
            sNewVal = sVal.replace(/[\s'"`@\%\&\-\#]/g, '_');
        var aAllNames = typeof(self._aProperties.allFriendlyNames) != 'undefined'
            ? self._aProperties.allFriendlyNames
            : [];
        if (sNewVal == '' 
            || aAllNames.indexOf(sNewVal.toLowerCase()) == -1
            || (!self._bClone && sNewVal == self._aProperties.friendlyName)
        ) {
            oAlias.val(sNewVal);
            return;
        }
        var nIdx = 1, 
            sResetVal = sNewVal;
        do{
            sNewVal = sResetVal + '_' + nIdx++;
        } while(nIdx < 100 && aAllNames.indexOf(sNewVal.toLowerCase()) >= 0);
        if (nIdx == 100) {
            sNewVal = sResetVal + '_' + Math.random();
        }
        oAlias.val(sNewVal);
    }

    self._getStructureField = function(sField) {
        var aField;
        if (sField == null || sField == '') {
            return null;
        } else if (sField.indexOf('.') >= 0) {
            aField = self._parent._objects.getObjectFieldByName(self._sCurrentObject, sField);
        } else {
            aField = self._aProperties.fields[sField];
        }
        return aField;
    }
    
    self._getChildRelation = function(sRelation) {
        if (self._aProperties.child == undefined || self._aProperties.child.length < 1) {
            return null;
        }
        for (var nJ = 0; nJ < self._aProperties.child.length; nJ++) {
            if (self._aProperties.child[nJ].label == sRelation) {
                return self._aProperties.child[nJ];
            }
        }
        return null;
    }
    
    self._setTexts = function(){
        self._editTitles = self._parent.getText('cs_edit_titles');
        self._buttonTitles = self._parent.getText('cs_button_titles');
    }
    
/*    self._calendarColorTemplate = function(){
        var sHTML = '<select name="settings[color_tpl]" class="_color_tpl_selector">'
            + '<option value="0" selected>No</option>';
        for (var nI = 1; nI < 18; nI++) {
            sHTML += '<option value="' + nI + '" class="evt_tpl_' + nI + '">Template ' + nI + '</option>';
        }
        sHTML += '</select>';
        return sHTML;
    }
*/    
    jQuery.calendarAnything.appendView('calendarEdit', view);
    
})();
