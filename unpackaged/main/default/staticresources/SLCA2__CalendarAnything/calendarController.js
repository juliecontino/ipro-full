/**
 * Authors: Danil Grudzinskiy
 * Version: 2.0 beta
 * Date: 11.02.2010
 * Description: Widget that link fullCalendar jquery Widget with salesforce crm
 * 
 * 
 * changings from version 1.2:
 * -add status bars
 * -add events moving and creating
 *  
 */


//helpers area
 
// Serialise object and show fields of them in test div
function serialize(obj) { 
	var resStr = '', item;
	for (item in obj) {
		if (typeof obj[item] === 'function') {
			resStr += item + ' => function\n';
		} else if (typeof obj[item] === 'object') {
			resStr += item + ' => object\n';
		} else {
			resStr += item + ' => ' + obj[item] + '\n';
		}
	}
	return resStr;
}

function preventSomeChars(evt) {
	var e = (typeof (event) !== "undefined") ? (event) : (evt); // for trans-browser compatibility
	var charCode = e.which || e.keyCode;

	if (charCode === 35 || charCode === 124)
		return false;

	return true;
}

//necessary for ie support
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}

if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

var positionXY;

function mousePageXY(e) {
	var x = 0, y = 0;
	if (!e) e = window.event;

	if (e.pageX || e.pageY) {
		x = e.pageX;
		y = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
		y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
	}

	return {"x":x, "y":y};
}

jQuery(document).mousemove(function(e){
	if (jQuery("#loadingFrameHolder").length == 0)
		positionXY = mousePageXY(e);
});

//end of helpers area

/* Object that holds popup for creating a new events described down*/
newEventsCreator = {
		widget : null,
		startDate: null,
		endDate: null,
		StartField: null,
		EndField: null,
		OtherFields: null,
		Calendars: [],
		Holder: null,
		HolderBody: null,
		HolderStatusString : null,
		HolderCalendarList: null,
		HolderContent: null,
		SaveButton: null,
		mouseCoords: null,
		
		choosenCalendar: null,
		
		show: function(startDate, endDate, jsEvent){
			this.Calendars = this.widget.options.data.SelectedCalendars;
			this.startDate = startDate;
			this.endDate = endDate;
			
			this._composeHolder();
			this._composeCalendarsList();
			this._composePopupContent();
			
			mouseCoords = FramesController.mousePageXY(jsEvent);
			if (mouseCoords.x != positionXY.x || mouseCoords.y != positionXY.y)
			{
				positionXY = mouseCoords;
			}

			this.innerShow(FramesController.mousePageXY(jsEvent));
		},
		
		innerShow: function(p_museXY){
			jQuery(this.Holder).css("display", "block");
			FramesController.setPosition(this.Holder, p_museXY);
		},
		
		hide: function(){
			jQuery(this.Holder).css("display", "none");
		},
		
		_composeHolder: function(){
			if (this.Holder == null) {
				this.Holder = FramesController.generateFrame();
				this.HolderBody = jQuery(this.Holder).find(".body")[0];
				this._addCloseButtonToHolder();
				jQuery(this.Holder).css('display','none');
				document.body.appendChild(this.Holder);
			}
		},
		
		isIe: (navigator.userAgent.toLowerCase().indexOf("msie 6.0") != -1 || navigator.userAgent.toLowerCase().indexOf("msie 7.0") != -1),
		
		_addCloseButtonToHolder: function(){
			var temp = document.createElement("div");
			var input = document.createElement("div");
			
			if (this.isIe) {
				input.className = "close-new-button";
			} else {
				input.setAttribute("class", "close-new-button");
			}
			
			var popWindow = this;
			this.HolderBody.appendChild(input);
			
			input.onmousedown = function(){
				popWindow.hide();
				popWindow.widget.element.fullCalendar('unselect');
			};
		},
		
		_composeCalendarsList: function(){
			var AllCalendars = this.Calendars;
			var AllCalendarsLength = AllCalendars.length;
			var EditableCalendars = 0;
			
			for (var i = 0; i < AllCalendarsLength; i++) {
				if(AllCalendars[i].editable){
					EditableCalendars ++;
				}
			}
			
			if (this.HolderCalendarList == null) {
				if (EditableCalendars > 0) {
					this.HolderCalendarList = document.createElement('select');
				} else {
					this.HolderCalendarList = document.createElement('div');
					this.HolderCalendarList.innerHTML = 'No editable calendars.';
				}
				
				if (this.isIe) {
					this.HolderCalendarList.className = 'calendars-list-for-new-record';
				} else {
					this.HolderCalendarList.setAttribute('class','calendars-list-for-new-record');
				}
				var HolderCalendarLabelDiv = document.createElement('div');
				if (this.isIe) {
					HolderCalendarLabelDiv.className = 'calendars-list-for-new-record-holder';
				} else {
					HolderCalendarLabelDiv.setAttribute('class','calendars-list-for-new-record-holder');
				}
				this.HolderStatusString = document.createElement('div');
				this._setStatus('Choose calendar create event for:','info')
				HolderCalendarLabelDiv.appendChild(this.HolderStatusString);
				HolderCalendarLabelDiv.appendChild(this.HolderCalendarList);
				this.HolderBody.appendChild(HolderCalendarLabelDiv); 
				var PopHolder = this
				jQuery(this.HolderCalendarList).bind('change',function()
				{	
					PopHolder._composePopupContent();
				});
			}
			
			if (AllCalendarsLength == 0) {
				return;
			}
 
			this.HolderCalendarList.innerHTML = '';
			
			var alrt = '';
			for (var i = 0; i < AllCalendarsLength; i++) {
				if(AllCalendars[i].editable) {
					var oOption = document.createElement("OPTION");
					var calName = AllCalendars[i].value;
					if (calName.length > 20) {
						calName = calName.substr(0,40).lastIndexOf(' ') > 1 ? calName.substr(0,calName.substr(0,40).lastIndexOf(' ')) + '...' : calName.substr(0,40) + '...';
					}
					oOption.innerHTML = calName;
					oOption.value=AllCalendars[i].id;
					this.HolderCalendarList.appendChild(oOption);
				}
			}
		},
		
		_composePopupContent: function(popHolder){
			
			
			if (this.HolderCalendarList == null  
					|| jQuery(this.HolderCalendarList).children('option').size() < 1) {
				this._setStatus('No calendars available to create new records', 'error', false);
				return;
			}
			
			if (this.HolderContent == null) {
				this.HolderContent = document.createElement('div');
				if (this.isIe) {
					this.HolderContent.className = 'new-event-content';
				} else {
					this.HolderContent.setAttribute('class','new-event-content');
				}
				this.HolderBody.appendChild(this.HolderContent);
			}
//			jQuery(this.HolderContent).css('max-height', jQuery(window).height() - 180);
			
			if (this.Calendars.length == 0) {
				this._setStatus('No calendars available to create new records', 'error', false);
				return;
			}
			 
			this.choosenCalendar = this.widget.getCalendarById(this.widget.options.data.SelectedCalendars,jQuery(this.HolderCalendarList).find('option:selected').val());
			
			var params = {};
			 
			var options = this.widget.options;
			params[options.GetParamNameEvent] = options.EventNameGetCalendarInfo;
			params[options.GetParamNameToken] = options.sessionToken;
			
			if (this.choosenCalendar != null) {
				params[options.GetParamNameCalID] = this.choosenCalendar.id;
			}
			
			
			
			this._setStatus('Loading information about required fields of target object...','info',true);
			var popHolder = this;
			jQuery.ajax({
				url: popHolder.widget.options.jsonResponsesUrl,
				type: 'POST',
				dataType: 'json',
				cache: false,
				data: params,
				success: function(data){
					var status = data.status;
					if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') {
						popHolder._setStatus(data.status, 'error', false);
					}
					else {
						popHolder._processContentLoaded(data);
						popHolder._renderNewEventPopupFields();
						var holder = popHolder.Holder;
						
						FramesController.setPosition(holder,positionXY);
						popHolder._huckFunctionsForSomeSFFields();
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown){
					popHolder._setStatus('textStatus','error',false);
					popHolder.element.html(textStatus);
				}
			});
		},
		
		_processContentLoaded : function(p_data)
		{
			var AllCalendars = this.Calendars;
			var AllCalendarsLength = AllCalendars.length;
			var EditableCalendars = 0;
			
			for (var i = 0; i < AllCalendarsLength; i++) {
				if(AllCalendars[i].editable){
					EditableCalendars ++;
				}
			}
			
			this.OtherFields = p_data.otherFields;
			this.StartField = p_data.StartField;
			this.EndField = p_data.EndField;

			if(this.otherFields == null || this.otherFields.length == 0)
				if (EditableCalendars > 0) {
					this._setStatus('Press "Create" to create an event in the selected calendar or select another one (only editable calendars are shown):','info',false);
				}else{
					this._setStatus('No editable calendars to create events.','info',false);
				}
			else
				this._setStatus('Feel required fields and press "create" to create record, or choose another calendar(only editable shows):','info',false);
		},
		
		_contentLoading : function(flag)
		{
			if (flag) {
				this.HolderContent.innerHTML = 'loading...';
				jQuery(this.HolderContent).addClass('loadingStyle');
			}
			else {
				jQuery(this.HolderContent).removeClass('loadingStyle');
				this.HolderContent.innerHTML = '';
			} 
		},
		
		_setLoading : function(flag)
		{
			if (flag) {
				jQuery(this.HolderStatusString).addClass('loadingStyle');
			}
			else {
				jQuery(this.HolderStatusString).removeClass('loadingStyle');
			}
		},
		
		_setStatus : function(p_text,p_status,p_loadingFlag)
		{
			this.HolderStatusString.innerHTML = p_text;
			
			var jStatus = jQuery(this.HolderStatusString);
			
			jStatus.removeClass();
			jStatus.addClass('message');
			switch(p_status.toLowerCase())
			{
			case 'error':
				jStatus.addClass('errorM3');
				break;
			case 'info':
				jStatus.addClass('infoM3');
				break;
			case 'warning':
				jStatus.addClass('warningM3');
				break;
			case 'confirm':
				jStatus.addClass('confirmM3');
				break;
			}	
			
			this._setLoading(p_loadingFlag);	
		},
		
		_renderNewEventPopupFields: function(){
			var fillHtml = '<form id="popup_form"><table cellpadding="0" cellspacing="0">';
			/*fillHtml += '<tr>';
			fillHtml += '<td><b>' + this.StartField.Label + ':</b></td>';
			fillHtml += '<td>' + this.startDate.format('dddd, mmmm d, yyyy HH:MM') + '</td>';
			fillHtml += '</tr>';
			if (this.EndField.Label != null && this.EndField.Label != undefined && this.EndField.Label != '') {
				fillHtml += '<tr>';
				fillHtml += '<td><b>' + this.EndField.Label + ':</b></td>';
				fillHtml += '<td>' + this.endDate.format('dddd, mmmm d, yyyy HH:MM') + '</td>';
				fillHtml += '</tr>';
			}*/
			fillHtml += this._getHtmlForFields(this.OtherFields); 
			fillHtml += '</table></form>' 
			
			this.HolderContent.innerHTML = fillHtml;
			
			this._addDatepickers();
			
			this._addSaveButton();
			this._initSelectBox();
		},
		
		_huckFunctionsForSomeSFFields : function () {
			jQuery('#IsPrivate__sfid').unbind('click');
			
			jQuery('#IsPrivate__sfid').live('click',function () {
				var val = jQuery('#IsPrivate_sfid:checked');
				if (val.length > 0) {
					//alert('111');
				}
			});
		},
		
		//Picklists, checkboxes, comboboxes always has a default values, so don't process it, because they shouldn't be recieved in p_field.
		_getHtmlForFields: function(p_list){
			var retString = '';
			
			if(p_list == null)
				return; 
				
			var fields = p_list;
			var length = fields.length;
			var aHTML5Fields = {
					"EMAIL" : "email",
					"PHONE" : "tel",
					"URL"	: "url",
					"INTEGER" : {"type" : "number", "step" : 1},
					"DOUBLE"  : {"type" : "number", "step" : 0.01},
					"PERCENT" : {"type" : "number", "step" : 0.1},
					"CURRENCY" : {"type" : "number", "step" : 0.01}
			}
			
			
			for (var i = 0; i < length; i++) {
				var curField = fields[i];
				var isHidden = '';
				if (curField == null 
					|| curField == undefined 
					|| (curField.isCreateable == false && curField.isUpdateable == false)  
					|| (curField.isUpdateable == "false" && curField.isCreateable == 'false')
				) {
					continue;
				}
				if (curField.Name == 'Fiscal' || curField.Name == 'ForecastCategory' || curField.Name == 'StatusCode' || curField.Name == undefined){
					isHidden = ' style="display:none;" ';
				}
				retString += '<tr ' + isHidden + '><td>' + curField.Label + '</td>';
				retString += '<td>';
				
				if((curField.isRequired == 'true') || (curField.isRequiredCustom == 'true')) {
					retString += '<div class="requiredInput">';
					retString += '<div class="requiredBlock"></div>';
				}
				
				if (curField.fieldType == 'REFERENCE') {
					if (curField.Name == 'OwnerId') {
						retString += '<input type="text" id="' + this._fieldIdByName(curField.Name) + ' style="width:110px;" disabled="disabled" value="' + this.widget.options.userName + '">';
					} else if (curField.Name == 'RecordTypeId'){
						retString += this._generateRecordTypeControl(this._fieldIdByName(curField.Name), curField.prefix, this.choosenCalendar.objectName, curField.Name);
					} else {
						retString += this._generateLookupControl(curField);
					}
				}
				
				if (curField.fieldType == 'STRING' 
					//|| curField.fieldType == 'EMAIL'
					|| curField.fieldType == 'TEXTAREA'
					//|| curField.fieldType == 'PHONE'
					//|| curField.fieldType == 'URL'
					//|| curField.fieldType == 'INTEGER'
					//|| curField.fieldType == 'DOUBLE'
					//|| curField.fieldType == 'PERCENT'
					//|| curField.fieldType == 'CURRENCY'
					) {
					retString += this._generateTextControl(curField);
				}
				
				if ( aHTML5Fields[curField.fieldType] != undefined) {
					retString += this._generateHTML5TextControl(curField, aHTML5Fields[curField.fieldType]);
				}
				
				if (curField.fieldType == 'DATE') {
					retString += this._generateTextControl(this._fieldIdByName(curField.Name), 'addDatepickerDate', curField.Label);
				}
				
				if (curField.fieldType == 'DATETIME') {
					retString += this._generateTextControl(this._fieldIdByName(curField.Name), 'addDatepickerDateTime', curField.Label);
				}
				
				if (curField.fieldType == 'BOOLEAN'){
					retString += this._generateBooleanControl(this._fieldIdByName(curField.Name),false);
				}
				
				if (curField.fieldType == 'PICKLIST' || curField.fieldType == 'COMBOBOX'){
					retString += this._generatePicklistControl(this._fieldIdByName(curField.Name), curField.Name, false, curField.options);
				}
				
				if (curField.fieldType == 'MULTIPICKLIST'){
					retString += this._generatePicklistControl(this._fieldIdByName(curField.Name),curField.Name, true, curField.options);          
				}
				
				if((curField.isRequired == true) || (curField.isRequiredCustom == true))
					retString += '</div>';
				
				retString += '</td></tr>'
			}
			
			return retString;
		},
		
		_addDatepickers: function(){
			jQuery(".addDatepickerDate").datepicker({
				showTime: false,
				dateFormat: this.widget.options.dateFormat
			});
			jQuery(".addDatepickerDateTime").datepicker({
				showTime: true,
				dateFormat: this.widget.options.dateFormat
			});
			//jQuery(".addDatepickerDate, .addDatepickerDateTime").after("<span class='clearDateTime' style='border:1px solid #26c; border-radius:3px; cursor:pointer; color:#26c; background-color:#eef; margin-left:3px;'>clear</span>");
			jQuery(".addDatepickerDate:enabled, .addDatepickerDateTime:enabled").after("<span class='clearDateTime btn'>clear</span>");
			jQuery(".clearDateTime").click(function () {
				jQuery(this).prev().val('');
			});
		},
		
		_generateRecordTypeControl: function (fName, fPrefix, objName, targetField) {
			var html = '';
			html += '<script  type="text/javascript">';
			html += "filterLookupValueElem = 'sf_value_" + fName +"';";
			html += '</script>';
			
			html += '<span id="sf_filter_lookup">';
				html += '<span class="lookupInput">';
					html += '<input type="text" size="20" name="sf_value_' + fName + '" maxlength="255" id="sf_value_' + fName + '" value=""/>';
					html += '<a title="Lookup (New Window)" onclick="setLastMousePosition(event)" ';
					html += 'href="'
					html += "javascript:filterLookupValueElem='sf_value_" + fName +"'; openPopupFocus('/apex/SL_FilterLookupPage?event=load&target="+objName+"&picklist="+targetField+"', 'filter_lookup', 620, 430, 'width=620,height=430,resizable=yes,toolbar=no,status=no,scrollbars=yes,menubar=no,directories=no,location=no,dependant=no', false, true);";
					html += '">';
					html += '<img title="Lookup (New Window)"'; 
					html += "onmouseover=\"this.className = 'lookupIconOn';this.className = 'lookupIconOn ';\"";
					html += "onmouseout=\"this.className = 'lookupIcon';this.className = 'lookupIcon';\"";
					html += "onfocus=\"this.className = 'lookupIconOn';\"";
					html += "onblur=\"this.className = 'lookupIcon';\" class=\"lookupIcon filter\" alt=\"Lookup (New Window)\" src=\"/s.gif\">";
					html += '</a>';
				html += '</span>';	
			html += '</span>';
			return html;

		},
		
		_generateLookupControl: function(oCurField) {
		//p_id, p_objectPrefix){
			//this._fieldIdByName(curField.Name), curField.prefix
			var id = this._fieldIdByName(oCurField.Name);
			var form_id = this._getFormId();// form id should be put here
			var referenced_to = oCurField.prefix;
			
			var html = '';
			html += '<span id="sf_filter_lookup">';
			html += '<input type="hidden" value="000000000000000" id="' + id + '_lkid" name="' + id + '_lkid" />';
			html += '<input type="hidden" value="null" id="' + id + '_lkold" name="' + id + '_lkold" />';
			html += '<input type="hidden" value="' + referenced_to + '" id="' + id + '_lktp" name="' + id + '_lktp" />';
			html += '<input type="hidden" value="0" id="' + id + '_lspf" name="' + id + '_lspf" />';
			html += '<input type="hidden" value="0" id="' + id + '_lspfsub" name="' + id + '_lspfsub" />';
			html += '<input type="hidden" value="0" id="' + id + '_mod" name="' + id + '_mod" />';
			html += '<span class="lookupInput">';
			if (oCurField.options != undefined && oCurField.options.length > 1){
				var sObjectName = '';
				html += '<select style="width:70px;" onChange="jQuery(this).parent().siblings(\'input#' + id + '_lktp\').val(jQuery(this).val());">';
				
				for (var nI = 0; nI < oCurField.options.length; nI++) {
					html += '<option value="' + oCurField.options[nI].key + '" ' 
						+ (oCurField.options[nI].key == referenced_to ? 'selected' : '')
						+ '>'
						+ oCurField.options[nI].value
						+ '</option>';
					if (oCurField.options[nI].key == referenced_to) {
						sObjectName = oCurField.options[nI].value; 
					}
				}	
				html += '</select>'
					+ '<input type="text" size="10" style="width:80px;" name="' + id + '" maxlength="255" id="' + id + '"/>'
//					+ '<a title="' + sObjectName + ' Lookup (New Window)" class="CA_lookup_selector">';
				//setLastMousePosition(event)
			} else {
			
				html += '<input type="text" size="20" name="' + id + '" maxlength="255" id="' + id + '"/>';
			}
			
			html += '<a title="Deal Name Lookup (New Window)" onclick="setLastMousePosition(event)" '
					+ 'href="'
					+ "javascript: openLookup('/_ui/common/data/LookupPage"
					+ "?kfm=" + form_id + "&lknm=" + id + "&lktp='"
					+ " + getElementByIdCS('" + id + "_lktp').value,670,'1','&lksrch='"
					+ " + escapeUTF(getElementByIdCS('" + id + "').value.substring(0, 80)))"
					+ '">';
			html += '<img ';
			html += "onmouseover=\"this.className = 'lookupIconOn';this.className = 'lookupIconOn';\"";
			html += "onmouseout=\"this.className = 'lookupIcon';this.className = 'lookupIcon';\"";
			html += "onfocus=\"this.className = 'lookupIconOn';\"";
			html += "onblur=\"this.className = 'lookupIcon';\" class=\"lookupIcon\" src=\"/s.gif\">";
			html += '</a>';
			html += '</span>';
			html += '</span>';
			return html;
		},
		
		_generateTextControl: function(mField, p_class, field_name){
			var sIdValue = mField, sRequired = '';
			if (typeof(mField) != 'string') {
				sIdValue = this._fieldIdByName(mField.Name);
				sRequired = ((mField.isRequired == 'true' || mField.isRequiredCustom == 'true')
							||
							(mField.isRequired || mField.isRequiredCustom))
							? 'required="required"'
							: '';
				
			}
			var theClass = '';
			theClass = ((p_class == null) ? ('') : (p_class));
			var p_value = '';
			var disableParam = '';
			if (field_name == this.StartField.Label) {
				if (this.widget.options.dateFormat.substring(0,2) == 'mm') {
					p_value = this.startDate.format('mm/dd/yyyy HH:MM');
				} else {
					p_value = this.startDate.format('dd.mm.yyyy HH:MM');
				}
				disableParam = 'disabled="disabled"';
			} else if (field_name == this.EndField.Label) {
				if (this.widget.options.dateFormat.substring(0,2) == 'mm') {
					p_value = this.endDate.format('mm/dd/yyyy HH:MM');
				} else {
					p_value = this.endDate.format('dd.mm.yyyy HH:MM');
				}
				disableParam = 'disabled="disabled"';
			}
			var html = '<input '
				+ ' onkeypress="return preventSomeChars(event)" '
				+ ' type="text" '
				+ ' id="' + sIdValue + '" '
				+ 'class="' + theClass + '" '
				+ disableParam 
				+ ' style="width:110px;" ' 
				+ ' value="' + p_value + '" '
				+ sRequired
				+ '>';
			
			return html;
		},
		
		_generateHTML5TextControl : function(mField, mType) {
			var sType = typeof(mType) == 'string' ? mType : mType.type;
			var sIdValue = mField, sRequired = '';
			if (typeof(mField) != 'string') {
				sIdValue = this._fieldIdByName(mField.Name);
				sRequired = ((mField.isRequired == 'true' || mField.isRequiredCustom == 'true')
							||
							(mField.isRequired || mField.isRequiredCustom))
							? ' required="required" '
							: '';
				
			}			
			var html = '<input  '
				+ ' onkeypress="return preventSomeChars(event)" '
				+ ' type="' + sType + '" '
				+ ' id="' + sIdValue + '" '
				+ ' style="width:110px;" '
				+ sRequired
				+ ' value="" ';
			if (typeof(mType) != 'string') {
				jQuery.each(mType, function(sKey, sVal){
					html += ' ' + sKey + '="' + sVal + '" ';
				});
			}
			html += '>';
			return html;
		},
		
		_generateBooleanControl : function(p_id, p_value) {
			var disabled = '', checked = (p_value == true || p_value == "true")? "checked=checked" : "";
			if (p_id == 'IsAllDayEvent__sfid' 
				&& this.startDate.format('HH:MM') == '00:00' 
				&& this.endDate.format('HH:MM') == '00:00') {
				checked = 'checked=checked';
				disabled  = 'disabled';
			}
				
			var html = '<input type="checkbox"  id="' + p_id + '" ' + checked + ' ' + disabled  + ' />';
			return html;	
		},
		
		
		_generateSelect : function(p_id, p_options_list, isMultiSelect) {
			var html = '';
			if(isMultiSelect == true) {
				MultiSelect = 'multiple="multiple" size="3"';
				html = '<select id="' + p_id + '" class="text" '+MultiSelect+' style="width:150px;">';
				if (!isMultiSelect) {
					html += '\t<option value="--none--">--none--</option>';
				}
				for(var i = 0; i < p_options_list.length; i++) {
					html += this._generateOption( p_options_list[i].name, p_options_list[i].value, (i == 0));
				}
				html += '</select>';
			} else {
				html += ' <input type="text" id="' + p_id + '" />'
					+ '<a id="sf_search_btn_' + p_id + '" class="btn a_btn">V</a>';
			}
			
			return html;
		},
		
		_generateOption : function(p_name, p_value, p_selected) {
			var selected = (p_selected == true)? 'selected="selected"' : '';
			html = '\t<option value="' + p_value +'" >' + ((p_name != undefined)?  p_name : p_value) + '</option>';
			return html;
		},
		
		_initSelectBox : function() {
			jQuery(this.HolderContent).find('span[data-select_options][data-multi="false"]').each(function(){
				var el = jQuery(this),
					inputElem = el.children('input'),
					searchBtn = el.children('a'),
					p_id = el.data('field'),
					values = [],
					aOptions = el.data('select_options');
				for (var nI = 0; nI < aOptions.length; nI++){
					values.push(aOptions[nI].value);
				}
				
				
				var widg = inputElem.autocomplete({
					source: values,
					minLength: 0,
					appendTo: "#sf_value_container_" + p_id
				});
				searchBtn.click(function (evt) {
					if (inputElem.autocomplete("widget").is(":visible")) {
						inputElem.autocomplete("close");
						return;
					}
					jQuery(this).blur();
					inputElem.autocomplete( "search", "" );
					inputElem.focus();
                    evt.stopPropagation();
                    return false;
				});
			});
		},
		
		_generatePicklistControl : function(p_id, p_field_name, isMultiSelect, aOptions) {
			if (aOptions == undefined) {
				this._loadFieldData(p_field_name, p_id, isMultiSelect);
				message = "Loading...";
				return '<span id="sf_value_container_' + p_id + '" style="white-space:nowrap">'+ message +'</span>' ;
			} else {
				var sValues = JSON.stringify(aOptions);
				sValues = sValues.replace(/'/g, "&apos;");
//				sValues = sValues.replace("\\\"", "&quot;");
				return '<span id="sf_value_container_' + p_id + '" ' 
					+ 'style="white-space:nowrap" '
					+ 'data-select_options=\'' + sValues + '\' '
					+ 'data-field="' + p_id + '" '
					+ 'data-multi="' + isMultiSelect + '">'
					+ this._generateSelect(p_id, aOptions, isMultiSelect);
					+'</span>'; 				
			}
		},
		
		_loadFieldData : function(p_field_name, p_id, isMultiSelect) {
			var PopHolder = this;
			var params = {};
			params[PopHolder.widget.options.GetParamNamePicklist] = p_field_name;
			params[PopHolder.widget.options.GetParamNameToken] = PopHolder.widget.options.sessionToken;
			params[PopHolder.widget.options.GetParamNameEvent] = PopHolder.widget.options.EventPicklistLoad;
			params[PopHolder.widget.options.GetParamNameCalID] = PopHolder.choosenCalendar.id;
			params[PopHolder.widget.options.GetParamNameObjName] = PopHolder.choosenCalendar.objectName;
			
			var PopHolder = this;
			jQuery.ajax({
				  url: PopHolder.widget.options.jsonResponsesUrl,
				  type: 'POST',
				  data: params,
				  dataType: 'json',
				  cache: false, 
				  success: function(data) {
						if(data[p_field_name] != undefined) 
							PopHolder._picklistCallBackHandler(p_id, data[p_field_name], isMultiSelect);	 
						else{
							PopHolder._picklistCallBackHandler(p_id, [], isMultiSelect);	 
						}	
				  },
				  error: function()
				  {
				  		PopHolder._picklistCallBackHandler(p_id, [], isMultiSelect);
				  }
			});
		},
		
		_picklistCallBackHandler : function( p_id, p_data, isMultiSelect) { 
			var html = this._generateSelect(p_id, p_data, isMultiSelect);
			var cont = jQuery("#sf_value_container_" + p_id);
			if (isMultiSelect) {
				cont.html(html);
			} else {
				cont.html('');
				var inputElem = jQuery('<input>',{'type':'text','id': p_id}).appendTo(cont);
				var searchBtn = jQuery('<button>',{'html':'V','id':'sf_search_btn_' + p_id}).appendTo(cont);
				var values = new Array();
				for (var i=0; i<p_data.length; i++) {
					values[i] = p_data[i].value;
				}
				var widg = inputElem.autocomplete({
					source: values,
					minLength: 0,
					appendTo: "#sf_value_container_" + p_id
				});
				searchBtn.click(function (evt) {
					if (inputElem.autocomplete("widget").is(":visible")) {
						inputElem.autocomplete("close");
						return;
					}
					jQuery(this).blur();
					inputElem.autocomplete( "search", "" );
					inputElem.focus();
                                        evt.stopPropagation();
                                        return false;
                                        
				});
			}
		},
		
		_getFormId: function(){
			//return jQuery(this.widget.element).parents("form").attr("id");
			return 'popup_form';
		},
		
		_fieldIdByName: function(p_name){
			return p_name + '__sfid';
		}, 
		
		_fieldNameById: function(p_id){
			return p_id.replace('__sfid', '');
		},
		
		_addSaveButton : function()
		{
			var popHolder = this;
			if(this.SaveButton == null)
			{
				this.SaveButton = document.createElement('input');
				this.SaveButton.setAttribute('type','button');
				this.SaveButton.setAttribute('class','btn');
				this.SaveButton.setAttribute('value','create');
				jQuery(this.SaveButton).bind('click',function(){
					jQuery(this.SaveButton).attr('disabled', true);
					popHolder._SendSaveRequest(false);
				});
				
				this.SaveAndEditButton = document.createElement('input');
				this.SaveAndEditButton.setAttribute('type','button');
				this.SaveAndEditButton.setAttribute('class','btn');
				this.SaveAndEditButton.setAttribute('value','create&edit');
				jQuery(this.SaveAndEditButton).bind('click',function(){
					jQuery(this.SaveAndEditButton).attr('disabled', true);					
					popHolder._SendSaveRequest(true);
				});
			}	
			
			this.HolderContent.appendChild(this.SaveButton);
			this.HolderContent.appendChild(this.SaveAndEditButton);
		},
		
		_getTimestampCompensated : function(p_date)
		{
			return p_date.valueOf() - p_date.getTimezoneOffset() * 1000 * 60;
		},
		
		_SendSaveRequest : function(p_openEditWindow)
		{
			var options = this.widget.options;
			params = {};
			
			var validationErrorMessage = this._validateFields();
			
			if (validationErrorMessage.length > 0) {
//				jQuery(this.SaveButton).attr('disabled', false);
//				jQuery(this.SaveAndEditButton).attr('disabled', false);
				this._setStatus(validationErrorMessage, 'error', false);
				return;
			}
			
			var p_openEditWindowClosured = p_openEditWindow;
			var calendarIdClosured = jQuery(this.HolderCalendarList).find('option:selected')[0].value;
			
			params[options.GetParamNameEvent] = options.EventNameCreateAction;
			params[options.GetParamNameToken] = options.sessionToken;
			params[options.GetParamNameCalID] = calendarIdClosured;
			var composedFields = this._composeFieldsForNewObject();
			if (!composedFields) {
				return;
			}
			params[options.GetParamNameFields] = encodeURIComponent(composedFields);
			
			params[options.GetParamNameStart] = this._getTimestampCompensated(this.startDate);
			if (this.EndField != undefined) {
				var oAllDay = jQuery('div.new-event-content > form#popup_form #IsAllDayEvent__sfid');
				if (
					oAllDay.size() > 0
					&& oAllDay.attr('checked') !== true
					&& oAllDay.attr('checked') != 'checked'
					&& this.endDate.getHours() == 0 
					&& this.endDate.getMinutes() == 0
				) {
					this.endDate.setDate(this.endDate.getDate() + 1);
				}
				params[options.GetParamNameEnd] = this._getTimestampCompensated(this.endDate);
			} else {
				params[options.GetParamNameEnd] = this._getTimestampCompensated(this.startDate);
			}
			
			this._setStatus('Saving record...','info',true)
			
			var popHolder = this;
			jQuery.ajax({
				url: popHolder.widget.options.saveSelectedUrl,
				type: 'POST',
				dataType: 'json', 
				cache: false,
				data: params,
				success: function(data){
					var status = data.status;
					if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') {
						popHolder._setStatus(data.status,'error',false);
					} else {
						popHolder._creationSuccess(data.id,calendarIdClosured, (p_openEditWindowClosured == true));
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown){
					popHolder._setStatus(textStatus,'error',false);
				}
			});
		
			
			this.widget.element.fullCalendar('unselect');
		},
		
		_validateFields : function()
		{
//			var fields = this.OtherFields;
//			
//			fieldsLength = fields.length;
			var errorList = [];
			for(var i = 0; i < this.OtherFields.length; i++) {
				var error = this._validateField(this.OtherFields[i]);
				if(error != null) {
					errorList.push(error);
				}
			}
			return this._getErrorsHtml(errorList);
		},
		
		//all validation should be described here. Now only required fields validation described
		_validateField : function(p_field)
		{
			var field = p_field;
			var name = field.id == undefined ? field.Name : field.id;
			var valueFieldId = this._fieldIdByName(name) + (field.type == 'REFERENCE' ? '_lkid' : '');
			var value = document.getElementById(valueFieldId) != undefined 
				? document.getElementById(valueFieldId).value
				: null;
			if (value != null) {
				if(name != 'Fiscal' && value.trim().length == 0 
					&& (
						field.isRequired == true || field.isRequired == 'true' 
						|| 
						field.isRequiredCustom == true || field.isRequiredCustom == 'true'
					)
					
				) {
					jQuery('#' + valueFieldId).css('border-color', 'red');
					return 'Required field is empty: ' + field.Label;
				} else {
					jQuery('#' + valueFieldId).css('border-color', 'initial');
				}
			}
			return null;
		},
		
		_getErrorsHtml : function(p_errorsList)
		{
			var retString = '';
			var errorsLength = p_errorsList.length;
			for(var i = 0; i < errorsLength; i++)
			{
				retString += '<li>' + p_errorsList[i] +'</li>'
			}
			
			if(errorsLength != 0)
				retString = '<ul>' + retString + '</ul>';
				
			return retString;
		},
		
		_creationSuccess : function(p_id,p_calendarId,p_openEditWindow)
		{
			var self = this;
			if(p_openEditWindow == true) {
				//window.open('/' + p_id + '/e?retURL=' + '/' + p_id);
				//location.href = ('/' + p_id + '/e?retURL=/apex/CalendarAnything');
				location.href = ('/' + p_id + '/e?retURL=' + location.href);
			} else {
				var oCheckbox = jQuery('#' + p_calendarId + '.checkbox.calendar-controller-item-checkbox'); 
				if (!oCheckbox.hasClass('checkbox_checked') && oCheckbox.is(':visible')) {
					this.widget.options.data.CheckedCalendars.push(p_calendarId);
					this.widget.data.aCalendars.push(p_calendarId);
					oCheckbox.addClass('checkbox_checked');
					var source = {
						"url" : this.widget._getUrlForAll(),
						"id" : "ALL_CALENDAR"
					}
					this.widget.element.fullCalendar('updateEventSource', source);					
					
					//oCheckbox.click();
				}
				this.widget._init();			
				jQuery('body').append('<div id="QuickCreationIdEvent" style="display: none;">' + p_id + '</div>');
			}
			this.hide();
		},
		

		_strToTimeStamp : function(value) {
			var realDate = new Date(value.substring(6,10), parseInt(value.substring(0,2),10) - 1, parseInt(value.substring(3,5),10), parseInt(value.substring(11,13),10),parseInt(value.substring(14,16),10), 0, 0);
			value = this._getTimestampCompensated(realDate);
			return value;
		},
		
		_composeFieldsForNewObject : function()
		{ 
			var retString = '';
			
			if (this.choosenCalendar.objectName == 'event') {
				var popHolder = this;
				
				if (jQuery('#StartDateTime__sfid').val() == '' || jQuery('#EndDateTime__sfid').val() == '') {
					popHolder._setStatus('Enter the values to all required fields.','error',false);
					return false;
				}
				
				var start = end = '';
				var startValueId = this._fieldIdByName('StartDateTime');
				if (document.getElementById(startValueId) != null && document.getElementById(startValueId).length > 0)
				{
					var startValue = document.getElementById(startValueId).value;
					start = this._strToTimeStamp(startValue);
				}
					
				var endValueId = this._fieldIdByName('EndDateTime');
				if (document.getElementById(endValueId) != null && document.getElementById(endValueId).length > 0)
				{
					var endValue = jQuery('#' + endValueId).val();
					if (endValue != undefined) {
						end = this._strToTimeStamp(endValue);
					}
				}
				
				if (start > end && start != '' && end != '') 
				{
					popHolder._setStatus('Start Date Time must be less then End Date Time.','error',false);
					return false;
				}
			}
			var fieldsLength = this.OtherFields.length;
			for(var i = 0; i < fieldsLength; i++)
			{
				var field = this.OtherFields[i];
				var name = field.Name;
				var valueFieldId = this._fieldIdByName(name);
				
				if(field.fieldType == 'REFERENCE')
					valueFieldId += '_lkid';
					
					
				if (document.getElementById(valueFieldId) == null || document.getElementById(valueFieldId) == 'null') continue;
				var value = document.getElementById(valueFieldId).value;
				
				if (typeof(value) == 'undefined' || value == '000000000000000' || name == 'Owner' || name == 'owner' || value == '--none--') continue;
				
				//convert to microtime
				if(field.fieldType == 'DATETIME')
				{
					if (this.widget.options.dateFormat.substring(0,2) == 'mm') {
						var realDate = new Date(value.substring(6,10), parseInt(value.substring(0,2),10) - 1, parseInt(value.substring(3,5),10), parseInt(value.substring(11,13),10),parseInt(value.substring(14,16),10), 0, 0);
					} else {
						var realDate = new Date(value.substring(6,10), parseInt(value.substring(3,5),10) - 1, parseInt(value.substring(0,2),10), parseInt(value.substring(11,13),10),parseInt(value.substring(14,16),10), 0, 0);
					}
					value = this._getTimestampCompensated(realDate);
				}
				
				if(field.fieldType == 'DATE')
				{
					if (this.widget.options.dateFormat.substring(0,2) == 'mm') {
						var realDate = new Date(value.substring(6,10), parseInt(value.substring(0,2),10) - 1, parseInt(value.substring(3,5),10));
					} else {
						var realDate = new Date(value.substring(6,10), parseInt(value.substring(3,5),10) - 1, parseInt(value.substring(0,2),10));
					}
					value = this._getTimestampCompensated(realDate);
				}
				
				if(field.fieldType == 'BOOLEAN')
				{
					if(document.getElementById(valueFieldId).checked)	
						value = 'true';
					else
						value = 'false';
				}
				if(field.fieldType == 'MULTIPICKLIST') {
					value = '';
					var max_idx = jQuery('#'+valueFieldId).find('option:selected').length;     
					jQuery('#'+valueFieldId).find('option:selected').each(function(idx){
						var currValue = jQuery(this).val();
						if (currValue == '--none--') {
							currValue = '';
						}
						value += currValue;
						if(max_idx != idx+1) {value += ';';}
					});
				}
				
				retString += '##' + name + '|' + value;
			}
			
			if(retString.length > 0) {
				retString = retString.substring(2);
			}
			return retString;
		}
	};


(function($) {
	
$.widget("ui.calendarController", {
	options: {
		data : '',
		loadDataUrl : '',
		
		groupIcon: '',
		webIcon: '',
		slotMinutes: 30,
		startDay: 0,
		dateFormat: 'mm/dd/yy',
		
		saveSelectedUrl : '',
		jsonResponsesUrl : '',
		
		userId : '',
		userName : '',
		calendarsListContainerId : '', 
		calendarGroupsListContainerId : '',
		messageContainerId : '',
		
		CalendarsCookieName : '',
		GroupsCookieName : '',
		sessionToken : '',
		
		TooltipPage : '',
		
		timeFormat : 'h(:mm)t',
		more : 0,
		
		
		EventNameSaveColor : 'saveCalendarColor',
		EventNameSaveColorForGroup : 'saveCalendarGroupColor',
		EventNameSaveVisibility : 'saveSelectedCalendars',
		EventNameGetCalendarJson : 'getCalendarEvents',
		EventNameGetEventsForGroupJson : 'getCalendarEventsForGroup',
		EventNameMoveEvent : 'moveCalendarEvent',
		EventNameResizeEvent : 'resizeCalendarEvent',
		EventNameCreateAction : 'createCalendarEvent',
		EventNameGetCalendarInfo : 'getAdditionalInfo',
		EventPicklistLoad : 'getPickListInfo',

		GetParamNameEvent : 'event',
		GetParamNameCalID : 'cid',
		GetParamNameCalGrID : 'cgid',
		GetParamNameToken : 'token',
		GetParamNameColor : 'color',
		GetParamNameObjType : 'objecttype',
		GetParamNameObjName : 'objectName',
		GetParamNameObjID : 'rid',
		GetParamNameVisible : 'visible',
		GetParamNameMDelta : 'mdelta',
		GetParamNameDDelta : 'ddelta',
		GetParamNameFields : 'fields',
		GetParamNameStart : 'start',
		GetParamNameEnd : 'end',
		GetParamNamePicklist : 'picklisstName'
	},
	
	/*checkedCalendars: function(calendars)
	{
		if (calendars != undefined)
		{
			this.options.data.CheckedCalendars = calendars;
		}
		else
		{
			return this.options.data.CheckedCalendars;
		}
	}*/
	
	//agregated data
	CalendarsList : null,
	CalendarGroupsList : null,
	OverlayDiv : null,
	LoadingDiv : null,
	CalendarsSelectorDiv : null,
	messageContainer : null,
	draggingEventTrack : null,
        data : {
            aCalendars : [], aGroups : [], aWeb : []
        },

	_init : function()
	{
		var currentView = this.element.fullCalendar('getView').name;
		var currentDate = this.element.fullCalendar('getDate');
		if (currentView == undefined) {
			currentView = 'month';
		}
		
//		if ((currentDate instanceof Date)) {
//			this.element.fullCalendar('setDate', currentDate);
//		}
		if (!(currentDate instanceof Date)) {
			this._initialLoadingMarkupRendering();
			this._recieveData();
			newEventsCreator.widget = this;
			this.element.fullCalendar('changeView', currentView);
		} else {
			//this.element.fullCalendar('gotoDate', currentDate);
			this.element.fullCalendar('refresh');
		}
		this._refreshStandardCalendars();
	},
	 
	_initialLoadingMarkupRendering : function()
	{
		var retHTML = ' <div id="calendar-overlay" class="fcui-overlay" style="float:left; margin-left: -20px;">';
		retHTML += '<div id="calendar-loading" class="fcui-loading" style="width:200px;">';
		retHTML += '<div class="loading-image"></div>';
		retHTML += '<span style="margin-left: 10px; margin-bottom: 5px;">loading...</span>';
		retHTML += '</div>';
		retHTML += '</div>';
		
		this.element.html(retHTML);
		
		this.CalendarsList = $('#'+this.options.calendarsListContainerId);
		this.WebCalendarsList = $('#'+this.options.webCalendarsListContainerId);
		this.CalendarGroupsList = $('#'+this.options.calendarGroupsListContainerId);
		
	    this.LoadingDiv = this.element.find('#calendar-loading');
        this.OverlayDiv = this.element.find('#calendar-overlay');
	},
	
	_recieveData : function()
	{
		if(this.options.data == null && this.options.loadDataUrl != '')
		{
			var widget = this;
			$.ajax({
				url: widget.options.loadDataUrl,
				type: 'POST',
				dataType: 'json',
				cache: false, 
				data: urlParams,
				success: function(data) {
					widget.options.data = data;
					widget._processData();
				},
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					widget.element.html(textStatus);
				}
			});
		} else {
			this._processData();
		}
	},

	_processData : function()
	{
		this._renderWidget();
		this._initChecked();
		this._initFullCalendar();
		this._attachEvents();
        this._preloadWhenStart();
	},
	
	_renderWidget : function()
	{
		this._renderSkeleton();
		this._renderWebSkeleton();
		this._renderSelectedCalendars();
		this._renderWebCalendars();
		this._renderSkeletonCalendarGroups();
		this._renderAllGroups();
	},
	
	_renderSkeleton : function()
	{
		
		var htmlString = '<div class="calendar-controller-container">'
                    + '<div class="ui-state-default calendar-controller-container-top">'
                    + '<div class="small_arrows arrow_down"></div>'
                    + '<div class="top_title">Standard Calendars</div>'
                    + '</div>'
                    + '<div class="calendar-controller-items">'
                    + '</div>'
                    + '</div>';
		
		this.CalendarsList.html(htmlString);
	},
	
	_renderWebSkeleton : function()
	{
		var htmlString = '<div class="calendar-controller-container">'
                    + '<div class="ui-state-default calendar-controller-container-top">'
                    + '<div class="small_arrows arrow_down"></div>'
                    + '<div class="top_title">Web Calendars</div>'
                    + '</div>'
                    + '<div class="calendar-controller-items">'
                    + '</div>'
                    + '</div>';
		
		this.WebCalendarsList.html(htmlString);
	},
	
	_renderSkeletonCalendarGroups : function()
	{
		var htmlString = '<div class="calendar-controller-container">'
                    + '<div class="ui-state-default calendar-controller-container-top">'
                    + '<div class="small_arrows arrow_down"></div>'
                    + '<div class="top_title">Calendar Groups</div>'
                    + '</div>'
                    + '<div class="calendar-controller-items group-controller-items">'
                    + '</div>'
                    + '</div>';
		
		this.CalendarGroupsList.html(htmlString);
	},	

  _renderAllGroups : function()
	{
		var htmlString = '';
		var itemsBox = this.CalendarGroupsList.find('.group-controller-items');

		if (this.options.data == undefined)
			itemsBox.html('There are no calendars and groups available for current user');
		else if(this.options.data.allGroups == undefined || this.options.data.allGroups == null || this.options.data.allGroups.length == 0)
			itemsBox.html('<div class="no_calendars">No groups are visible.</div>');
		else {
			var allGroups = this.options.data.allGroups;
			
			var groupsNumber = allGroups.length;
			itemsBox.html('');
                        this.options.data.groupsID = [];
			for(var i = 0; i < groupsNumber ; i++)
			{
				var calAllGroups = '';
				calDataAllGroups = this.getGroupById(this.options.data.allGroups,allGroups[i].id);
                                if (calDataAllGroups == null) {
                                    continue;
                                }
				calAllGroups = calDataAllGroups.calendars;

				htmlString += '<div class="calendar-controller-item group-controller-item" id="'+allGroups[i].id +'_container">'
                                    + '<div class="arrow_items ui-state-default ui-corner-all" style="float: right"><span class="ui-icon ui-icon-triangle-1-s"/></div>'
				//htmlString += '<div class="arrow_items arrow_down" style="float: right"></div>';
				//htmlString += '<input type="checkbox" id="'+allGroups[i].id +'" class="calendar-controller-item-checkbox group-controller-item-checkbox styled" />';
                                    + '<span class="' + (allGroups[i].selected ? 'initWhenStartClick' : '') + ' checkbox calendar-controller-item-checkbox group-controller-item-checkbox" id="'+allGroups[i].id +'" style="background-color:'+ ((allGroups[i].colorType == 'group' || allGroups[i].colorType == null) ? allGroups[i].color : '#0C7FC8') +';" />'
                                    + '<a title="' + allGroups[i].name + '" id="'+allGroups[i].id +'_title" rel="'+calAllGroups+'" class="_lnk calendar-controller-item-title group-controller-item-title color_type_'+allGroups[i].colorType+'">'
                                    + '<span style="display: block; overflow: hidden; width: 85%;">' + ((allGroups[i].name.length > 27) ? (allGroups[i].name.substr(0, 25) + '...') : allGroups[i].name) + '</span>'
                                    + '</a>'
                                    + '<span id="'+allGroups[i].id+'_hide" style="display:none">'
                                    + allGroups[i].name
                                    + '</span>'
				//htmlString += '<img src="' + this.options.groupIcon + '" title="Group of Calendars" />';
				//htmlString += '<a href="#" id="'+allGroups[i].id +'_color" style="background-color:'+allGroups[i].color+';" class="group-controller-item-color">';
				//htmlString += '</a>';
                                    + '</div>';
                                this.options.data.groupsID.push(this.options.data.allGroups,allGroups[i].id);
			}
			itemsBox.html(itemsBox.html() + htmlString);
		}
	},

	_renderWebCalendars : function()
	{
		var htmlString = '';
		var itemsBox = this.WebCalendarsList.find('.calendar-controller-items');
		
		if (this.options.data != undefined) {
			var allSelectedCalendars = this.options.data.SelectedCalendars;
			var calendarsNumber = allSelectedCalendars.length;
			
			itemsBox.html('');
			var s = 0;
			for(var i = 0; i < calendarsNumber ; i++)
			{
				var aCalData = allSelectedCalendars[i];
				if (aCalData.calendarType == 'web') {
					s++;
					htmlString += '<div class="calendar-controller-item" id="'+aCalData.id +'_container">'
                        + '<div class="arrow_items ui-state-default ui-corner-all" style="float: right"><span class="ui-icon ui-icon-triangle-1-s"/></div>'
					/*htmlString += '<div class="arrow_items arrow_down" style="float: right"></div>';
					htmlString += '<input type="checkbox" id="'+allSelectedCalendars[i].id +'" class="calendar-controller-item-checkbox styled" />';*/
                        + '<span class="' + (aCalData.selected ? 'initWhenStartClick' : '') + ' checkbox calendar-controller-item-checkbox" id="' + aCalData.id +'" style="background-color:' + aCalData.color + ';"  />'
                        + '<a title="' + aCalData.value + '" id="'+aCalData.id +'_title" class="_lnk calendar-controller-item-title">'
                        + (aCalData.value.length > 17 ? (aCalData.value.substr(0, 15) + '...') : aCalData.value)
                        + '</a>'
                        + '<span id="' + aCalData.id + '_hide" style="display:none">'
                        + aCalData.value
                        + '</span>'
					/*htmlString += '<img src="' + this.options.webIcon + '" title="Web Calendar" height="12px" />';
					htmlString += '<a href="#" id="'+allSelectedCalendars[i].id +'_color" style="background-color:'+allSelectedCalendars[i].color+';" class="web-calendar-controller-item-color">';
					htmlString += '</a>';*/
                                            + '</div>';
				}
			}
			if (s == 0) {
				itemsBox.html('<div class="no_calendars">No Web calendars are visible.</div>');
			} else {
				itemsBox.html(itemsBox.html() + htmlString);
			}
			
		} else {
			itemsBox.html('<div class="no_calendars">No Web calendars are visible.</div>');
		}
	},
	
	jsonpGcalCallback : function(jsonData,calendarId) {
		var calendar = this.element;
		
		calendar.fullCalendar('processEvents',jsonData,calendarId);
	},
	
	_renderSelectedCalendars : function()
	{
		var htmlString = '';
		var itemsBox = this.CalendarsList.find('.calendar-controller-items');
		if (this.options.data == undefined) 
			itemsBox.html('There are no calendars available for current user');
		else if(this.options.data.SelectedCalendars == undefined || this.options.data.SelectedCalendars == null || this.options.data.SelectedCalendars.length == 0) 
			itemsBox.html('<div class="no_calendars">No calendars are selected. Please <a class="dlg_visible_open_lnk _lnk" style="text-decoration:underline">add an existing calendar</a> or <a href="/apex/calendarsList" style="text-decoration:underline">create a new one</a>.</div>');
			
		else {
			var allSelectedCalendars = this.options.data.SelectedCalendars;
			var calendarsNumber = allSelectedCalendars.length;
			if (typeof(this.options.data.calendarsID) == 'undefined') {
                            this.options.data.calendarsID = [];
                        }
			itemsBox.html('');
			var s = 0;
			for(var i = 0; i < calendarsNumber ; i++)
			{
				var name_truncate = (allSelectedCalendars[i].value.length > 27) ? (allSelectedCalendars[i].value.substr(0, 25) + '...') : allSelectedCalendars[i].value;
				if (allSelectedCalendars[i].calendarType != 'web') {
					
					htmlString += '<div class="calendar-controller-item standard-calendar-item" id="'+allSelectedCalendars[i].id +'_container">';
					htmlString += '<div class="arrow_items ui-state-default ui-corner-all" style="float: right"><span class="ui-icon ui-icon-triangle-1-s"/></div>';
					//htmlString += '<div class="arrow_items arrow_down" style="float: right"></div>';
					//htmlString += '<input type="checkbox" id="'+allSelectedCalendars[i].id +'" class="calendar-controller-item-checkbox styled" />';
					htmlString += '<span class="active-box checkbox calendar-controller-item-checkbox" id="'+allSelectedCalendars[i].id +'" rel="'+allSelectedCalendars[i].keyPrefix +'" style="background-color:'+allSelectedCalendars[i].color+';"  />';
					htmlString += '<a title="' + allSelectedCalendars[i].value + '" id="'+allSelectedCalendars[i].id +'_title" class="active-title calendar-controller-item-title _lnk">';
					htmlString += '<span style="display: block; overflow: hidden; width: 85%;">' + name_truncate + '</span>';
					htmlString += '</a>';
					htmlString += '<span class="inactive-box" style="display:none"></span>';
					htmlString += '<span class="inactive-title" id="'+allSelectedCalendars[i].id+'_hide" title="' + allSelectedCalendars[i].value + '" style="display:none">';
					htmlString += name_truncate;
					htmlString += '</span>';
					htmlString += '<div class="small_arrow_down item_arrows"></div>';
					//htmlString += '<a href="#" id="'+allSelectedCalendars[i].id +'_color" style="background-color:'+allSelectedCalendars[i].color+';" class="calendar-controller-item-color">';
					//htmlString += '</a>';
					htmlString += '</div>';
                    this.options.data.calendarsID.push(allSelectedCalendars[i].id);
					s++;
				}
			}
			if (s == 0) {
				itemsBox.html('<div class="no_calendars">No calendars are selected. Please <a class="dlg_visible_open_lnk _lnk" style="text-decoration:underline">add an existing calendar</a> or <a href="/apex/calendarsList" style="text-decoration:underline">create a new one</a>.</div>');
			} else {
				itemsBox.html(itemsBox.html() + htmlString);
			}
		}
	},
	
	//
	// 1) if information about checked calendars recieved with all data - appropriate calendars checks and cookies set to be
	// in accordance with this data
	// 2) if information about checked calendars not recieved with all data - it reads from cookies to a widget data 
	// 
	//
	_initChecked : function(bRefresh)
	{
            bRefresh = bRefresh || false;
            jQuery('').find('#groupsListHolder div > span.checkbox, #calendarsListHolder  div > span.checkbox')
                .removeClass('initWhenStartClick');
		//$('.calendar-controller-item').css('background-color','');
            if (!bRefresh && this.options.calendarId != '' && this.options.calendarId != undefined) {
			$('#' + this.options.calendarId).addClass("initWhenStartClick");
			return;
            }
            var aCalendarsToCheck = [];
            var aGroupsToCheck = [];
            var bNeedToUpdateCookie = false;
            if (this.options.data == undefined)  {
                return; 
            } else if (
                (this.options.data.CheckedCalendars != undefined 
                    && this.options.data.CheckedCalendars != null 
                    && this.options.data.CheckedCalendars.length != 0 
                )
                ||
                (this.options.data.CheckedCalendarGroups != undefined 
                    && this.options.data.CheckedCalendarGroups != null
                    && this.options.data.CheckedCalendarGroups.length > 0)
            ) {
                //check calendars based on response recieved(or initial data) 
                aCalendarsToCheck = this.options.data.CheckedCalendars;
                aGroupsToCheck = this.options.data.CheckedCalendarGroups;
                bNeedToUpdateCookie = true;
            } else { 
                //check calendars based on information in cookies if there is no information about checked calendars in request
                aCalendarsToCheck = this._wcookie(this.options.CalendarsCookieName + this.options.userId).split(',');
                aGroupsToCheck = this._wcookie(this.options.GroupsCookieName + this.options.userId).split(',');
                this.options.data.CheckedCalendars = this._copyArrayWithoutEmptyValues(aCalendarsToCheck);			
                this.options.data.CheckedCalendarGroups = this._copyArrayWithoutEmptyValues(aGroupsToCheck);	
            }
            if (aCalendarsToCheck.length > 0) {
                $('#' + aCalendarsToCheck.join(', #')).addClass("initWhenStartClick checkbox_checked");
            }
            if (aGroupsToCheck != null && aGroupsToCheck != '' && aGroupsToCheck.length > 0){
                $('#' + aGroupsToCheck.join(', #')).addClass("initWhenStartClick checkbox_checked")
                    .each(function(){
                        var el = $(this).next();
                        var aHideChecked = el.attr('rel').split(';')
                        var aToHide = $('#' + aHideChecked.join("_container, #") + '_container');
                        aToHide.find('.active-title, .active-box').hide();
                        aToHide.find('.inactive-title, .inactive-box').show();
                        
                    });
            }
            if (bNeedToUpdateCookie) {
                this._refreshCookie();	
            }
                        
	},
	
	_copyArrayWithoutEmptyValues : function(p_array)
	{ 
		var arrLength = p_array.length;
		var newArray = [];
		
		
		for(var i = 0; i < arrLength; i++)
		{
			if(p_array[i] != undefined && p_array[i] != null && p_array[i].trim() != '')
			{
				newArray.push(p_array[i]);
			}
		}
		
		return newArray;	
	},
	
	_createInfoBlock : function()
	{
		var messageContainerHolder = document.getElementById(this.options.messageContainerId);
		if (messageContainerHolder == undefined || messageContainerHolder == null) {
			messageContainerHolder = document.createElement('div');
			this.CalendarsList.append(messageContainerHolder);
		}	
		
		this.messageContainer = $(document.createElement('div'));
		this.messageContainer.css('display','none');
		$(messageContainerHolder).append(this.messageContainer);
	},
	
	allTimeouts : [],
	
	_convert_to_user_friendly_message: function(messageText) {
		var res = messageText;
		var regexp, test;
		
		regexp = /INSUFFICIENT_ACCESS_OR_READONLY/g;
		test = regexp.test(messageText);
		if (test) {
			res = 'Error: you don\'t have sufficient permissions to move events/resize events/change calendar colour';
		}
		
		return res;
	},
	
	showInfoMessage : function(p_message, p_status,p_loading)
	{
		if(this.messageContainer == null)
		{
			this._createInfoBlock();
		}
		
		this.messageContainer.removeClass();
		
		this.messageContainer.addClass('message');
		if(p_loading == true)
			this.messageContainer.addClass('loadingStyle');
			
		switch(p_status.toLowerCase())
		{
		case 'error':
			this.messageContainer.addClass('errorM3');
			break;
		case 'info':
			this.messageContainer.addClass('infoM3');
			break;
		case 'warning':
			this.messageContainer.addClass('warningM3');
			break;
		case 'confirm':
			this.messageContainer.addClass('confirmM3');
			break;
		}	
		
		this.messageContainer.css('display','block');
		this.messageContainer.html(p_message);
		var widget = this;
		
		if (p_status.toLowerCase() != "error") {
			var tId;
			tId = setTimeout(function(){
				widget.messageContainer.fadeOut('slow');
			}, 3000);
			this.allTimeouts[this.allTimeouts.length] = tId;
		} else {
			for (var i=0; i<this.allTimeouts.length; i++) {
				clearTimeout(this.allTimeouts[i]);
			}
			var wndText = $("div.errorM3").html();
			$("div.errorM3").width(500)
			$("div.errorM3").attr("id","thisToClose");
			var text = "";
			text += "<script>";
			text += "function closeErrWnd() {";
			text += "var elem = document.getElementById('"+$("div.errorM3").attr("id")+"');";
			text += "elem.style.display = 'none';";
			text += "}";
			text += "</script>";
			text += "<table width='500'>"
			text += "<tr><td>";
			text += this._convert_to_user_friendly_message(wndText);
			text += "</td><td valign='top'>";
			text += "<a class=_lnk onClick='closeErrWnd();'>X</a>";
			text += "</td></tr>";
			text += "</table>";
			
			$("div.errorM3").html(text);
		}
	},
	
	_wcookie : function(name, value, options){
    	try {
	    	if (typeof value != 'undefined') { // name and value given, set cookie
		        options = options || {};
                value = (value === null ? '' : value);
                    var path = options.path ? ';path=' + (options.path) : '';
                    var domain = options.domain ? ';domain=' + (options.domain) : '';
                var date = new Date();
                    date.setDate(date.getDate() + 365);
                    var expires = ';expires=' + date.toUTCString();
                    var secure = options.secure ? ";secure" : "";
                    document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
				// ---- ds
			} else { // only name given, get cookie
				var cookieValue = '';
				if (document.cookie && document.cookie != '') {
					var cookies = document.cookie.split(';');
					for (var i = 0; i < cookies.length; i++) {
						var cookie = $.trim(cookies[i]);
						// Does this cookie string begin with the name we want?
						if (cookie.substring(0, name.length + 1) == (name + '=')) {
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
						}
					}
				}
				return cookieValue;
			}
            }
            catch (err) {
			alert("wcookie: " + err); 
			return null;
		}
	},
	
	getCalendarById : function(p_array, p_id)
	{
            var self = this;
            if (typeof(p_id) == 'undefined' && typeof(p_array) == 'string') {
                if (typeof(arguments.callee.aCache) == 'undefined') {
                    arguments.callee.aCache = {};
                }
                if (typeof(arguments.callee.aCache[p_array]) != 'undefined') {
                    return arguments.callee.aCache[p_array];
                }
                var result = self.getCalendarById(self.options.data.SelectedCalendars, p_array);
                if (result == null) {
                    result = self.getCalendarById(self.options.data.NonSelectedCalendars, p_array);
                }
                arguments.callee.aCache[p_array] = result;
                return result;
                
            } else {
		var theLength = p_array.length;
		for (var i=0; i < theLength; i++) {
                    if(p_array[i].id != null && p_array[i].id == p_id) {
				return p_array[i]; 
		}
		}
		
		return null;
            }
	},

	getGroupById : function(p_array,p_id) {
		var theLength = p_array.length;
		for(var i=0; i < theLength; i++) {
			if(p_array[i].id != null && p_array[i].id == p_id)
				return p_array[i]; 
		}		
		return null;
	},	

	checkGroup : function(p_id) {	

		// Check selected calendars
		var calGroup = [];
		$("#groupsListHolder .checkbox_checked").each(function() {
                    calGroup.push($(this).attr('id'));
		});
		this.options.data.CheckedCalendarGroups = calGroup;
	
		var CheckedCalendarGroups = this.options.data.CheckedCalendarGroups;
		var groupAlreadyChecked = jQuery.inArray(p_id, this.options.data.CheckedCalendarGroups);
                groupAlreadyChecked = groupAlreadyChecked == -1 ? false : groupAlreadyChecked;
//		for(var i = 0; i<CheckedCalendarGroups.length; i++) {
//			if(CheckedCalendarGroups[i] == p_id) {
//				groupAlreadyChecked = true;
//			}
//		}
		if (groupAlreadyChecked === false) {
			//$('#'+p_id).attr("checked", "checked");
			$('#groupsListHolder #' + p_id).addClass("checkbox_checked");
			this.options.data.CheckedCalendarGroups.push(p_id);
			this._checkUncheckCalendarsOfGroup(p_id, true);
		} else {	  
			//$('#'+p_id).removeAttr("checked"); 
			$('#groupsListHolder #' + p_id).removeClass("checkbox_checked"); 
                        this.options.data.CheckedCalendarGroups.splice(groupAlreadyChecked, 1);
//			var newCheckedCalendarGroups = [];
//			this.CalendarGroupsList.find('.group-controller-item-checkbox').each(function(){
//				if($(this).attr('checked')) {
//					newCheckedCalendarGroups.push(this.id);
//				}
//			});
//			this.options.data.CheckedCalendarGroups = newCheckedCalendarGroups;
			this._checkUncheckCalendarsOfGroup(p_id, false);			
		}
		this._refreshCookie();
		this._refreshStandardCalendars();
	},
	
	_refreshStandardCalendars: function () {
		var checkedCalendarsIds = [];
		
		$('.active-title, .active-box').show();
		$('.inactive-title, .inactive-box').hide();
		var controller = this;
		$('.group-controller-item-checkbox[class*="checkbox_checked"]').each(function (i,el) {
                    var p_id = $(el).attr('id');
                    var curGroupOfCalendars = controller.getGroupById(controller.options.data.allGroups,p_id);
                    if (curGroupOfCalendars != null && curGroupOfCalendars.calendars != '') {
                        var currCals = curGroupOfCalendars.calendars.split(';');
                        for (var j=0; j<currCals.length; j++) {
                            if (currCals[j] != '') {
                        		checkedCalendarsIds.push(currCals[j]);
                            }
                        }
                    }
		});
		if (checkedCalendarsIds.length > 0) {
                    var aToRemove = this.options.data.CheckedCalendars.intersect(checkedCalendarsIds);
                    if (aToRemove.length > 0) {
                        for (var i = 0; i < aToRemove.length; i++) {
                            controller._removeCalendarFromFullCalendar(aToRemove[i]);
                            jQuery('span.calendar-controller-item-checkbox.checkbox_checked[id="' + aToRemove[i] + '"]').removeClass('checkbox_checked');
                        }
                    }
                    var aToHide = $('#' + checkedCalendarsIds.join("_container, #") + '_container');
                    aToHide.find('.active-title, .active-box').hide();
                    aToHide.find('.inactive-title, .inactive-box').show();
                    this.options.data.CheckedCalendars = this.options.data.CheckedCalendars.diff(checkedCalendarsIds);
                }
                
//		$('.standard-calendar-item').each(function (i,el) {
//			var currCheckbox = $(el).find('span.calendar-controller-item-checkbox');
//			var currId = currCheckbox.attr('id');
//			var isChecked;
//			if (currCheckbox.hasClass('checkbox_checked')) {
//				isChecked = true;
//			}
//                        
//			for (var i=0; i<checkedCalendarsIds.length; i++) {
//				if (currId == checkedCalendarsIds[i]) {
//					if (currCheckbox.hasClass('checkbox_checked')) {
//						currCheckbox.removeClass('checkbox_checked');
//						controller._removeCalendarFromFullCalendar(currId);
//						isChecked = false;
//					}
//				}
//			}
//			if (isChecked) {
//				newCheckedCalendarsIds.push(currId);
//			}
//		});
//		this.options.data.CheckedCalendars = newCheckedCalendarsIds;
//		for (var i=0; i<checkedCalendarsIds.length; i++) {
//			var el = $('#' + checkedCalendarsIds[i] + '_container');
//			controller._removeCalendarFromFullCalendar(checkedCalendarsIds[i]);
//			$(el).find('.active-title, .active-box').hide();
//			$(el).find('.inactive-title, .inactive-box').show();
//		}
//		
		this._refreshCookie();
		//this._init();
	},
	
	_checkUncheckCalendarsOfGroup : function(p_id, isChecked) {
            var curGroupOfCalendars = this.getGroupById(this.options.data.allGroups, p_id);		
            if (isChecked) {
                    this._addCalendarOfGroupOnFullCalendar(null, curGroupOfCalendars);
		} else {
                    this._removeCalendarOfGroupFromFullCalendar(null, curGroupOfCalendars.id);
		}
	},

	getCalendarFromAll : function(p_id) {
		var selCals = this.options.data.SelectedCalendars,
			nonSelCals = this.options.data.NonSelectedCalendars;
		for(var i=0; i < selCals.length; i++) {
			if(selCals[i].id != null && selCals[i].id == p_id) {
				return selCals[i];
			}
		}
		for(var i=0; i < nonSelCals.length; i++) {
			if(nonSelCals[i].id != null && nonSelCals[i].id == p_id) {
				return nonSelCals[i];
			}
		}		
		return null;		    
	},
	
	blockadePanelsOfCalendarsAndGroups : function(isHide) {
            $("#overlayBlock").css("display", (isHide ? "block" : "none"));
	},
  	
	checkCalendar : function(p_id)
	{
        if(this.options.data.CheckedCalendars == undefined || this.options.data.CheckedCalendars == null)  {
            this.options.data.CheckedCalendars = [];
        }

		// Check selected calendars
        var aTmp = [];
        $("#calendarsListHolder .checkbox").not('.checkbox_checked').each(function() {
            aTmp.push($(this).attr('id'));
		});
        this.options.data.CheckedCalendars.diff(aTmp);
		var checkbox = $('#calendarsListHolder #' + p_id);   
                
        var calendarAlreadyChecked = jQuery.inArray(p_id, this.options.data.CheckedCalendars);
        if (calendarAlreadyChecked == -1) {calendarAlreadyChecked = false;}
                    
		if (calendarAlreadyChecked === false) {
			
			//checkbox.attr("checked", "checked");
			checkbox.addClass("checkbox_checked");
			$('#hide_'+p_id).addClass("checkbox_checked");
			this.options.data.CheckedCalendars.push(p_id);
//			this._addCalendarOnFullCalendar(this.getCalendarById(this.options.data.SelectedCalendars, this.options.data.CheckedCalendars[i]));
			this._addCalendarOnFullCalendar(this.getCalendarById(this.options.data.SelectedCalendars, p_id));
		} else {
			checkbox.removeClass("checkbox_checked");	
			$('#hide_'+p_id).removeClass("checkbox_checked");
			
                        this.options.data.CheckedCalendars.splice(calendarAlreadyChecked, 1);
			this._removeCalendarFromFullCalendar(p_id);
		}
		this._refreshCookie();
	},
	
	checkWebCalendar : function(p_id)
	{
                if(this.options.data.CheckedCalendars == undefined || this.options.data.CheckedCalendars == null) {
                    this.options.data.CheckedCalendars = [];
                }

		// Check selected calendars
                var aTmp = [];
                $("#webCalendarsListHolder .checkbox").not('.checkbox_checked').each(function() {
                    aTmp.push($(this).attr('id'));
		});
                this.options.data.CheckedCalendars.diff(aTmp);
		var checkbox = $('#'+p_id);  		
                var calendarAlreadyChecked = jQuery.inArray(p_id, this.options.data.CheckedCalendars);
                if (calendarAlreadyChecked == -1) {calendarAlreadyChecked = false;}

		
		var isNeedReinit = false;
		if (calendarAlreadyChecked === false) {
			checkbox.attr("checked", "checked");
			checkbox.addClass("checkbox_checked");
			
			this.options.data.CheckedCalendars.push(p_id);
			this._addWebCalendarOnFullCalendar(this.getCalendarById(this.options.data.SelectedCalendars, p_id));
		} else {
			checkbox.removeAttr("checked");
			checkbox.removeClass("checkbox_checked");
			
			this.options.data.CheckedCalendars.splice(calendarAlreadyChecked, 1);
			this._removeWebCalendarFromFullCalendar(this.getCalendarById(this.options.data.SelectedCalendars, p_id).url);
			//console.log('uncheck -> ');
			isNeedReinit = true;
			//location.reload();
		}
		
		this._refreshCookie();
//		if (isNeedReinit) {
//			this._init();
//		}
	},
	
	_refreshCookie : function()
	{	
		// Check selected calendars
		this.options.data.CheckedCalendars = this.options.data.CheckedCalendars.unique();
		var newCookieValue = this.options.data.CheckedCalendars.join(",");
		var cookieName = this.options.CalendarsCookieName + this.options.userId;	
		var expiresDate = new Date();
		expiresDate.setDate(expiresDate.getDate() + 365);
		this._wcookie(cookieName, newCookieValue, {
			expires: expiresDate.toGMTString()
//			path: '/',
//			domain: document.domain,
//			secure: false
		});

		// Check selected calendars
		var calGroup = new Array();
		$("#groupsListHolder .checkbox_checked").each(function()
		{
			calGroup.push($(this).attr('id'));
		});
		this.options.data.CheckedCalendarGroups = calGroup;
	
		var gr_newCookieValue = this.options.data.CheckedCalendarGroups.join(',');
		var gr_cookieName = this.options.GroupsCookieName + this.options.userId;
		
		this._wcookie(gr_cookieName, gr_newCookieValue, {
			expires: expiresDate.toGMTString()
//			path: '/',
//			domain: document.domain,
//			secure: false
		});
	},
	
	_initDatepicker : function()
	{
		var jQdatepickerHolder = $(document.createElement('input'));
		jQdatepickerHolder.attr('type','button');
		jQdatepickerHolder.css({
			'height':'10px',
			'margin-top' : '0',
			'padding' : '0',
			'visibility':'hidden',
			'width':'0'});

		$(this.element.find('.fc-header-left')).append(jQdatepickerHolder);
		
		var fullCal = this.element;
		
		$(jQdatepickerHolder).datepicker(
		{
			showOn: 'button',
			buttonText : 'Go&nbsp;to&nbsp;date',
			buttonHeight: 24,
			onSelect: function(dateText, inst)
			{
				$("div.popDiv").css('display','none');
				newEventsCreator.hide();
				fullCal.fullCalendar('gotoDate', inst.selectedYear, inst.selectedMonth, inst.selectedDay);
			}
		});
		
		$('.ui-datepicker-trigger').button();
		$('.ui-datepicker-trigger').css({
			'padding-top': '0px'
		,	'margin':'0 2px'})
		  .children('span').css('padding', '2px 0 0 0');
	},
	
	_initFullCalendar : function()
	{
		var calendar = this.element; //to make closures on fullCalendar in calback functions
		var calendarController = this;	//to make closures on calendarController in calback functions
		var aHeaderDisplay = {
            "l_ds" : "edit", "l_p" : "prev", "l_n" : "next", "l_t" : "today",
            "c_t" : "title", 
            "r_d" : "agendaDay", "r_w" : "agendaWeek", "r_m" : "month",
            "r_y" : "year", "r_l" : "list" , "r_g" : "gantt"
        };
        var aShortHeader = {"l" : "left", "c" : "center", "r" : "right"};
        var aHeaderButtons = {"left" : '', "center" : '', "right" : ''};
        jQuery.each(aHeaderDisplay, function(idx, val){
            if (document.location.href.indexOf(idx + '=0') == -1)  {
                var sBar = aShortHeader[idx.substr(0, 1)];
                aHeaderButtons[sBar] += (aHeaderButtons[sBar].length > 0 ? "," : "") + val;
            }
        });		
        
		calendar.fullCalendar({
			header : aHeaderButtons,
//            header: {
//                left: 'edit,prev,next,today',
//				center: 'title',
//                right: 'agendaDay,agendaWeek,month,year,list'
//				/*left: 'prev,next,today',
//                center: 'title',
//                right: 'month,agendaWeek,agendaDay'*/
//            }, 
            allDayDefault: false,
			slotMinutes: calendarController.options.slotMinutes,
			firstDay: calendarController.options.firstDay,
            theme: true,
            editable: false,
			selectable : true,
			timeFormat : calendarController.options.timeFormat,
			calendarControllerOptions : calendarController.options,
			
			unselectAuto : false,
            
            loading: function( isLoading, view ) {
            	calendarController.loadingBar(isLoading);
				if(isLoading == false) {
					calendarController.blockadePanelsOfCalendarsAndGroups(false);
					calendarController.showInfoMessage('<b id="eventsCount"></b> events were successfully loaded','confirm');
				}
			},
			
            eventDrop: function(event, ddelta, mdelta, allDay , revertFunc) {
				if(event.allDay == calendarController.draggingEventTrack.allDay && (ddelta != 0 || mdelta != 0)) {
					calendarController._sendEvent(calendarController.options.EventNameMoveEvent, event, ddelta, mdelta, revertFunc);
				} else {
					revertFunc();
				}
					
				calendarController.draggingEventTrack = null;
            }, 
            
            eventResize: function(event,ddelta,mdelta,revertFunc) { 
                calendarController._sendEvent(calendarController.options.EventNameResizeEvent, event, ddelta, mdelta, revertFunc);
            },
           
		    eventDragStart : function(event, jsEvent, ui, view ){
				FramesController.lockFrame(calendarController.composeParamsStringForHover(event));
				calendarController.draggingEventTrack = jQuery.extend(true,{},event);
			},
			
			eventDragStop : function(event, jsEvent, ui, view ){
				var func = "FramesController.unlockFrame('" + calendarController.composeParamsStringForHover(event) + "')";
				setTimeout(func, 500);
			},
			
			eventResizeStart : function(event, jsEvent, ui, view){
				FramesController.lockFrame(calendarController.composeParamsStringForHover(event));
			}, 
			
			eventResizeStop : function(event, jsEvent, ui, view ){
				var func = "FramesController.unlockFrame('" + calendarController.composeParamsStringForHover(event) +"')";
				setTimeout(func, 500);
			},
			
            eventRender: function(event, element, view) {
//                        if(event.url != undefined) {
//                                element.find("a").attr("target", "_blank");
//                        }
				
				if(event.source != undefined)
				{
					if(event.renderedEvents == undefined)
						event.renderedEvents = 0;
					else	
						event.renderedEvents++;
					
					var link = element.find("a");
                                link.attr('id', event.id + '_' + event.calendarid + '_' + event.renderedEvents);
					
					var paramString = calendarController.composeParamsStringForHover(event);

                                FramesController.AttachFrameToElement(link[0],paramString, "click"); 
				}
            },
			
			select : function( startDate, endDate, allDay, jsEvent, view )
			{
				if(!($(jsEvent.currentTarget.activeElement.parentNode).hasClass('events-view-more'))){
					newEventsCreator.show(startDate, endDate, jsEvent);
				}
			},
			
			blur : function()
			{
				newEventsCreator.hide();
			},
			
            eventClick: function(calEvent, jsEvent, view) {

            },
            
            eventDblClick : function(calEvent, jsEvent, view) {
            	window.open(calEvent.url);
//            	console.log(jQuery(calEvent));
//            	view.stopPropagation();
//            	view.cancelBubble = true;
            	return false;
            },
            
            dayClick: function(date, allDay, jsEvent, view) {
            	
            },
            viewDisplay: function( view ) {  
				if(view.name == "month") {
					calendar.fullCalendar('rerenderEvents');
				}
			}
        });
		
		if(calendarController.options.more != 0)
			calendar.limitEvents(calendarController.options.more);
		this._initDatepicker();
	},

	composeParamsStringForHover : function(event)
	{
        var retString = this.options.TooltipPage+'?';
		retString += this.options.GetParamNameObjID + '=' + event.id;
		if (event.calendarid) {
			retString += '&' + this.options.GetParamNameCalID + '=' + event.calendarid;
			retString += '&className=' + event.className;
			//console.log(event.calendarid,event.className[0]);
			if (event.color && event.calendarid.substr(0,15) != event.className[0].substr(0,15)) {
				retString += '&color=' + event.color;
			}
		} else if (event.cal_id != undefined) {
			retString += '&className=' + event.cal_id
				+ '&title=' + event.title
				+ '&ds=' + event.start
				+ '&de=' + event.end;
		}
		var url = event.url;
		if (url) {
			retString += '&url=' + escape(url);
		}
		return retString;
		
	},
	
	loadingBar : function(show) {
        if(show) {
            var body = $('body');
            var width = this.element.width();
            var height = this.element.height();
            var position = this.element.position();
            
            this.OverlayDiv
                .css({'width': width, 'height' : height, 'left' : position.left+20, 'top': position.top})
                .show();
                
            this.LoadingDiv.hide().addClass('fcui-loading');
            var loading_width = this.LoadingDiv.width();    
            var loading_height = this.LoadingDiv.height();
            var real_loading_left = position.left + ((width / 2) - (loading_width /2));
            var real_loading_top = position.top + ((height / 2) - (loading_height /2));
            this.LoadingDiv
                .css({'position' : 'relative', 'left': real_loading_left - position.left, 'top': real_loading_top - position.top})
                .show();
        } else {
            this.LoadingDiv.hide();   
            this.OverlayDiv.hide();       
        }
    },

	_sendEvent : function(call, event,ddelta,mdelta,revertFunc) {
		var widget = this;  
        var params = {};
		var eventName = event.title;
		var funcClosure = revertFunc;
		
		widget.showInfoMessage('Saving new date of '+ eventName +'...','info',true);
        params[this.options.GetParamNameEvent] = call;
        params[this.options.GetParamNameObjID] = event.id.split('&evFG;').join('');
        params[this.options.GetParamNameDDelta] = ddelta;
        params[this.options.GetParamNameMDelta] = mdelta;
        params[this.options.GetParamNameToken] = this.options.sessionToken;
		params[this.options.GetParamNameCalID] = event.calendarid;
        $.ajax({
            url: this.options.saveSelectedUrl,
            type: 'POST',
            dataType: 'json',
            data: params,
            cache: false, 
            success: function(data){  
                var status = data.status;
				if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') {
					widget.showInfoMessage(data.status, 'error');
					funcClosure();
				}
				else 
					widget.showInfoMessage('Event ' + eventName + ' was succesfull moved', 'confirm');
            },
			error : function(XMLHttpRequest, textStatus, errorThrown){
				widget.showInfoMessage(textStatus, 'error');
				funcClosure();
			}
			
        });     
    },
	
        
	_preloadWhenStart : function() {
		var self = this;
		if (typeof(self.options.data.CheckedCalendars) == 'undefined' || self.options.data.CheckedCalendars == null) {
			self.options.data.CheckedCalendars = [];
		}
		//this.showInfoMessage('Load events from calendar ' + p_calendar.value, 'info', true);
		var aInitCalendars = [];
		jQuery('#calendarsListHolder span.checkbox.initWhenStartClick').each(function(){
			var el = $(this);
			aInitCalendars.push(el.attr('id'));
			self._createNewCssClass(el.attr('id'), el.css('background-color'));
			el.addClass('checkbox_checked');
			self.options.data.CheckedCalendars.push(el.attr('id'));
		});
		
		var aInitGroups = [];
		jQuery('#groupsListHolder span.checkbox.initWhenStartClick').each(function(){
			var el = $(this);
			aInitGroups.push(el.attr('id'));
//			console.log('-----> ' + el.next().hasClass('color_type_calendar'));
			if (el.next().hasClass('color_type_group')) {
				self._createNewCssClass(el.attr('id'), el.css('background-color'));
			}
			el.addClass('checkbox_checked');
		});
		self._calendarOnOff({"calendar" : aInitCalendars, "group" : aInitGroups});
		if (aInitCalendars.length > 0 || aInitGroups.length > 0 ) {
			this.blockadePanelsOfCalendarsAndGroups(true);
			var currentDate = self.element.fullCalendar('getDate');
			var source = {
				"url" : self._getUrlForAll(),
				"id" : "ALL_CALENDAR"
			}
			self.element.fullCalendar('updateEventSource', source);
			
		}
		
		jQuery('#webCalendarsListHolder span.checkbox.initWhenStartClick').each(function(){
			var el = $(this);
			self._createNewCssClass(el.attr('id'), el.css('background-color'));
			el.addClass('checkbox_checked');
			var aCalendar = self.getCalendarById(el.attr('id'));
                self.options.data.CheckedCalendars.push(el.attr('id'));
			if (aCalendar != null) {
				self.element.fullCalendar(
					'addEventSource', 
					aCalendar.url, 
					el.attr('id')
				);
			}
		});
		
	},
		
	getUrlParameter : function(p) {
		var res = '';
		var url = location.href.substr(location.href.indexOf('?') + 1);
		var parts = url.split('&');
		for (var i = 0; i < parts.length; i++) {
			if (parts[i] != undefined) {
				var param = parts[i].split('=');
				if (param[0] == p) {
					res = param[1];
				}
			}
		}
		return res;
    },
	
	_getCalendarsByObjectName : function(p_array,p_objectName)
	{
		var theLength = p_array.length;
		var retArray = [];
		
		for(var i=0; i < theLength; i++)
		{
			if(p_array[i].objectName != null && p_array[i].objectName == p_objectName)
				retArray.push(p_array[i]); 
		}
		
		return retArray;
	},
	
	refreshCalendarOnFullCalendar : function(p_calendarId)
	{
		if(this.options.data.CheckedCalendars.indexOf(p_calendarId) == -1)
			return;
		
		var calendar = this.getCalendarById(this.options.data.SelectedCalendars,p_calendarId);
		var calendars = this._getCalendarsByObjectName(this.options.data.SelectedCalendars,calendar.objectName);
		
		var calendarsLength = calendars.length;
		
		for(var i=0; i < calendarsLength; i++)
		{
			this._removeCalendarFromFullCalendar(calendars[i].id);
			this._removeWebCalendarFromFullCalendar(calendars[i].url);
			this._addCalendarOnFullCalendar(calendars[i]);
		}
		
	},
	
	_addCalendarOnFullCalendar : function(p_calendar)
	{
		this.blockadePanelsOfCalendarsAndGroups(true);	
		if (p_calendar != null) {
                this.showInfoMessage('Load events from calendar ' + p_calendar.value, 'info', true);
                this._createNewCssClass(p_calendar.id, p_calendar.color);
                
                this._calendarOnOff({"calendar" : p_calendar.id});
                var source = {
                    "url" : this._getUrlForAll(),
                    "id" : "ALL_CALENDAR"
		}
                this.element.fullCalendar('updateEventSource', source);
//                this.element.fullCalendar('addEventSource', this._composeCalendarEventUrl(p_calendar.id));
            }
	},
	
	_removeCalendarFromFullCalendar : function(p_id)
	{
            this._calendarOnOff({"calendar" : p_id}, false);
            var source = {
                "url" : this._getUrlForAll(),
                "id" : "ALL_CALENDAR",
                "remove" : p_id
            }
                
            this.element.fullCalendar('updateEventSource', source);            
            
            // this.element.fullCalendar('removeEventSource', this._composeCalendarEventUrl(p_id));
	},
	
	_addWebCalendarOnFullCalendar : function(p_calendar)
	{
		//this.blockadePanelsOfCalendarsAndGroups(true);	
		if (p_calendar != null) {
			this.showInfoMessage('Load events from calendar '+ p_calendar.value,'info',true);
			this._createNewCssClass(p_calendar.id,p_calendar.color);
			this.element.fullCalendar('addEventSource', p_calendar.url, p_calendar.id);
		}
	},
	
	_removeWebCalendarFromFullCalendar : function(p_url)
	{
		this.element.fullCalendar('removeEventSource', p_url);
	},
	
//	_composeCalendarEventUrl : function(p_id)
//	{
//		var retString = this.options.jsonResponsesUrl + '?more=4';
//		retString += '&' + this.options.GetParamNameCalID + '=' + p_id;
//		retString += '&' + this.options.GetParamNameToken + '=' + this.options.sessionToken;
//		retString += '&' + this.options.GetParamNameEvent + '=' + this.options.EventNameGetCalendarJson;
//		/** Parse url params str */
//		var url = location.href;
//                var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
//                var rx = new RegExp(pattern); 
//                var parts = rx.exec(url);
//                if (parts[8] != undefined) {
//			var params = parts[8].substr(1).split('&');
//			var urlParams = new Array();
//			for (var i=0; i<params.length; i++) {
//				if (params[i].substr(0,2) == 'pv') {
//					var paramParts = params[i].split('=');
//					retString += '&' + paramParts[0] + '=' + paramParts[1];
//				} else if (params[i].substr(0,3) == 'cid') {
//					var paramParts = params[i].split('=');
//					//$('#' + paramParts[1]).attr('checked','checked');
//					$('#' + paramParts[1]).addClass("checkbox_checked");
//					//$('#HiddenOptionalPanel div[rel=' + paramParts[1] + "']").addClass("checkbox_checked");
//				}
//			}
//		}
//		/** end parse */
//		
//		return retString;
//	},
		
        _calendarOnOff : function(params, bStatus) {
            bStatus = typeof(bStatus) == 'undefined' ? true : bStatus;
            params.group = params.group || [];
            params.calendar = params.calendar || [];
            var self = this;
            if (bStatus) {
                self.data.aCalendars = self.data.aCalendars.merge(params.calendar);
                self.data.aGroups = self.data.aGroups.merge(params.group);
            } else {
                self.data.aCalendars = self.data.aCalendars.diff(params.calendar);
                self.data.aGroups = self.data.aGroups.diff(params.group);
            }
        },
        _getUrlForAll : function(){
            var sFilter = this._getFilterParams({key : 'pv', url : true});
            return this.options.jsonResponsesUrl + '?more=4'
                + '&' + this.options.GetParamNameCalID + '=' + this.data.aCalendars.join(",")
                + '&' + this.options.GetParamNameCalGrID + '=' + this.data.aGroups.join(",")
                + '&' + this.options.GetParamNameToken + '=' + this.options.sessionToken
                + '&' + this.options.GetParamNameEvent + '=' + this.options.EventNameGetEventsForGroupJson
//                + (sFilter != '' && this.data.aGroups.length < 1 && this.data.aCalendars.length == 1 ? '&' + sFilter : '');
                + (sFilter != ''  ? '&' + sFilter : '');
        },
        
        _getFilterParams : function(aParams) {
            if (typeof(arguments.callee.filter) == 'undefined') {
                var aGetStr = location.href.substr(location.href.indexOf('?') + 1).split('&');
                var aPair;
                arguments.callee.filter = [];
                for (var i = 0; i < aGetStr.length; i++) {
                    /*if (aGetStr[i] == undefined) {
                        continue;
                    }*/
                    aPair = aGetStr[i].split('=');
                    if (aPair[1] != 'undefined' || aPair[1] == '') {
                        arguments.callee.filter.push([aPair[0], aPair[1]]);
                    }
                }
            }
            if (arguments.callee.filter.length < 1) {
                return [];
            }
            var aResult = arguments.callee.filter;
            if (aParams.key != undefined && aParams.key != '') {
                aResult = aResult.filter(function(el) {return el[0].substr(0, aParams.key.length) == aParams.key})
            }
            if (aParams.val != undefined && aParams.val != '') {
                aResult = aResult.filter(function(el) {return el[1].substr(0, aParams.val.length) == aParams.val})
            }
            if (aParams.url != undefined && aParams.url) {
                var sResult = '';
                for (var i = 0; i < aResult.length; i++) {
                    sResult += (sResult.length > 0 ? '&' : "") + aResult[i][0] + '=' + aResult[i][1];
                }
                aResult = sResult;
            }
            return aResult;
        },
        
    _addCalendarOfGroupOnFullCalendar : function(p_id, p_group) {
//		console.log(p_id, p_group);
		this.blockadePanelsOfCalendarsAndGroups(true);	
		this.showInfoMessage('Load events from calendars of group '+ p_group.name,'info',true);
		if (p_group.colorType == 'group') {
//                alert(p_group.id + ' / ' + p_group.color);
                this._createNewCssClass(p_group.id, p_group.color);
		}
//		this.element.fullCalendar('addEventSource', this._composeCalendarEventForGroupUrl(p_id, p_group.id));
//            this._calendarOnOff({"calendar" : p_id, "group" : p_group.id});
            this._calendarOnOff({"group" : p_group.id});
            var source = {
                "url" : this._getUrlForAll(),
                "id" : "ALL_CALENDAR"
            }
            this.element.fullCalendar('updateEventSource', source);
	},
	
	_removeCalendarOfGroupFromFullCalendar : function(p_id, p_id_group)
	{
//            this._calendarOnOff({"calendar" : p_id, "group" : p_id_group}, false);
            this._calendarOnOff({"group" : p_id_group}, false);
            var source = {
                    "url" : this._getUrlForAll(),
                    "id" : "ALL_CALENDAR",
                    "remove" : p_id_group
                }
                
            this.element.fullCalendar('updateEventSource', source);            
            //this.element.fullCalendar('removeEventSource', this._composeCalendarEventForGroupUrl(p_id, p_id_group));
	},
	
	_composeCalendarEventForGroupUrl : function(p_id, p_id_group)
	{
		var retString = this.options.jsonResponsesUrl + '?more=4';
                p_id = typeof(p_id) == 'array' ? p_id.join(",") : p_id;
                p_id_group = typeof(p_id_group) == 'array' ? p_id_group.join(",") : p_id_group;
		retString += '&' + this.options.GetParamNameCalID + '=' + p_id;
		retString += '&' + this.options.GetParamNameCalGrID + '=' + p_id_group;
		retString += '&' + this.options.GetParamNameToken + '=' + this.options.sessionToken;
		retString += '&' + this.options.GetParamNameEvent + '=' + this.options.EventNameGetEventsForGroupJson;		
		return retString;
	},	
	
	checkEventsFromHiddenOptionalPanel : function(elem)
	{
		var class_elem = "checkbox_checked";
		((elem).hasClass(class_elem)) ? elem.removeClass(class_elem) : elem.addClass(class_elem);
	},
	
	_attachEvents : function()
	{
		var calendarsController = this;
		var element = this.CalendarsList;
		if (this.CalendarsList.data('already_init') === true) {
			return;
		}
		this.CalendarsList.data('already_init', true);
		
		this.CalendarsList
			.off('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title')
			.on('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title', function(){
				calendarsController.checkCalendar(this.id.replace('_title',''));
			});
		
//		element.find('.calendar-controller-item-checkbox').bind('click',function(){
//			calendarsController.checkCalendar(this.id);
//		});		
//		element.find('.calendar-controller-item-title').bind('click',function(){
//			calendarsController.checkCalendar(this.id.replace('_title',''));
//		});	

		// Click for checkbox in Standsrd Calendars on HiddenOptionalPanel
		$("#HiddenOptionalPanel #standard_cls")
			.off('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title')
			.on('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title', function(){
				var el = $(this);
				el = el.hasClass('calendar-controller-item-title') ? el.prev("span") : el;
				calendarsController.checkEventsFromHiddenOptionalPanel(el);
				//calendarsController.checkCalendar(el.attr("id").substr(10));
				calendarsController.checkCalendar(el.attr("id").replace('hideblock_',''));
			});
//		$("#HiddenOptionalPanel #standard_cls .calendar-controller-item-checkbox").live('click', function()
//		{
//			var cal_id = $(this).attr("id").substr(10);
//			calendarsController.checkEventsFromHiddenOptionalPanel($(this));
//			calendarsController.checkCalendar(cal_id);
//		});	
//		$("#HiddenOptionalPanel #standard_cls .calendar-controller-item-title").live('click', function()
//		{
//			var cal_id = $(this).attr("id").substr(10).replace('_title','');
//			calendarsController.checkEventsFromHiddenOptionalPanel($(this).prev("span"));
//			calendarsController.checkCalendar(cal_id);
//		});
		
		//*** need to be reinit ? 
		
		colorPickerManager.initPickAreas("calendar-controller-item-color");
		/*colorPickerManager.afterPickAction = function(p_choosenPickarea,p_choosenColor){
			calendarsController._changeCalendarColor(p_choosenPickarea,p_choosenColor);
		};*/
		
		
		this.WebCalendarsList
			.off('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title')
			.on('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title', function(){
			calendarsController.checkWebCalendar(this.id.replace('_title',''));
		});
		
//		web_element.find('.calendar-controller-item-checkbox').bind('click',function(){
//			calendarsController.checkWebCalendar(this.id);
//		});	
//		web_element.find('.calendar-controller-item-title').bind('click',function(){
//			calendarsController.checkWebCalendar(this.id.replace('_title',''));
//		});	

		// Click for checkbox in Web Calendars on HiddenOptionalPanel
		$("#HiddenOptionalPanel #web_cls")
			.off('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title')
			.on('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title', function(){
				var el = $(this);
				el = el.hasClass('calendar-controller-item-title') ? el.prev('span') : el;
				calendarsController.checkEventsFromHiddenOptionalPanel(el);
//				calendarsController.checkWebCalendar(el.attr("id").substr(10));
				calendarsController.checkWebCalendar(el.attr("id").replace('hideblock_',''));

			});
		
//		$("#HiddenOptionalPanel #web_cls .calendar-controller-item-checkbox").live('click', function()
//		{
//			var cal_id = $(this).attr("id").substr(10);
//			calendarsController.checkEventsFromHiddenOptionalPanel($(this));
//			calendarsController.checkWebCalendar(cal_id);
//		});	
//		$("#HiddenOptionalPanel #web_cls .calendar-controller-item-title").live('click', function()
//		{
//			var cal_id = $(this).attr("id").substr(10).replace('_title','');
//			calendarsController.checkEventsFromHiddenOptionalPanel($(this).prev("span"));
//			calendarsController.checkWebCalendar(cal_id);
//		});
		
		// *** need to be reinit ? 
		colorPickerManager.initPickAreas("web-calendar-controller-item-color");
		colorPickerManager.afterPickAction = function(p_choosenPickarea,p_choosenColor){
			calendarsController._changeCalendarColor(p_choosenPickarea,p_choosenColor);
			calendarsController._changeWebCalendarColor(p_choosenPickarea,p_choosenColor);
		};
		
		this.CalendarGroupsList
			.off('click', '.group-controller-item-checkbox, .group-controller-item-title')
			.on('click', '.group-controller-item-checkbox, .group-controller-item-title', function(){
				calendarsController.checkGroup(this.id.replace('_title',''));
			});
//		groups_element.find('.group-controller-item-checkbox').live('click',function(){
//			calendarsController.checkGroup(this.id);
//		});	
//		groups_element.find('.group-controller-item-title').live('click',function(){
//			calendarsController.checkGroup(this.id.replace('_title',''));
//		});
		
		// Click for checkbox in Group Calendars on HiddenOptionalPanel
		$("#HiddenOptionalPanel #group_cls")
			.off('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title')
			.on('click', '.calendar-controller-item-checkbox, .calendar-controller-item-title', function(){
				var el = $(this);
				el = el.hasClass('calendar-controller-item-title') ? el.prev('span') : el;
				calendarsController.checkEventsFromHiddenOptionalPanel(el);
//				calendarsController.checkGroup(el.attr("id").substr(10));
				calendarsController.checkGroup(el.attr("id").replace('hideblock_',''));
				
			});
			
		
//		$("#HiddenOptionalPanel #group_cls .calendar-controller-item-checkbox").live('click', function()
//		{
//			var cal_id = $(this).attr("id").substr(10);
//			calendarsController.checkEventsFromHiddenOptionalPanel($(this));
//			calendarsController.checkGroup(cal_id);
//		});
//		$("#HiddenOptionalPanel #group_cls .calendar-controller-item-title").live('click', function()
//		{
//			var cal_id = $(this).attr("id").substr(10).replace('_title','');
//			calendarsController.checkEventsFromHiddenOptionalPanel($(this).prev("span"));
//			calendarsController.checkGroup(cal_id);
//		});
		
		colorPickerManagerForGroups.initPickAreas("group-controller-item-color");
		colorPickerManagerForGroups.afterPickAction = function(p_choosenPickarea,p_choosenColor){
			calendarsController._changeGroupColor(p_choosenPickarea,p_choosenColor);
		};
	},
  
	_changeGroupColor : function(p_pickArea,p_choosenColor) {
		var grId = p_pickArea.id.replace('_color',''); 
		var bgcolor = p_choosenColor;  
		var pickarea = p_pickArea;  
		
		var params = {};
		var widget = this;
                var curGroup = this.getGroupById(this.options.data.allGroups,grId);
                var groupName = (curGroup != null) ? curGroup.name : '';
		params[this.options.GetParamNameEvent] = this.options.EventNameSaveColorForGroup;
		params[this.options.GetParamNameColor] = bgcolor;  
		params[this.options.GetParamNameCalGrID] = grId;   
		params[this.options.GetParamNameToken] = this.options.sessionToken;		
		widget.showInfoMessage('Changing color of '+ groupName +' ...','info',true);
		$.ajax({
		  url: this.options.saveSelectedUrl,
		  type: 'POST',
		  dataType: 'json',
		  data: params,
		  cache: false, 
				error : function(XMLHttpRequest, textStatus, errorThrown){
				  widget.showInfoMessage('Changes don\'t saved to server. The error thrown: '+errorThrown,'error');
				},
		  success: function(data){
				  var status = data.status;
					if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') 
					  widget.showInfoMessage(data.status, 'error');
					else {
						widget.showInfoMessage('Color of group ' + groupName + ' was succesfull saved to server', 'confirm');
						widget._applyColorChanges(p_pickArea,grId,bgcolor);
						//document.location.href = "/apex/CalendarAnything";
					}
				}
		});    
	},
  	
	_changeCalendarColor : function(p_pickArea,p_choosenColor)
	{
		var calId = p_pickArea.id.replace('_color','');
		var bgcolor = p_choosenColor;
		var pickarea = p_pickArea;
		
		var params = {};
		var widget = this;
		if (!this.getCalendarById(this.options.data.SelectedCalendars,calId)) return;
		var calendarName = this.getCalendarById(this.options.data.SelectedCalendars,calId).value;
		params[this.options.GetParamNameEvent] = this.options.EventNameSaveColor;
		params[this.options.GetParamNameColor] = bgcolor;
		params[this.options.GetParamNameCalID] = calId;
		params[this.options.GetParamNameToken] = this.options.sessionToken;		
		widget.showInfoMessage('Changing color of '+ calendarName +' ...','info',true);   

		$.ajax({
		  url: this.options.saveSelectedUrl,
		  type: 'POST',
		  dataType: 'json',
		  data: params,
		  cache: false, 
				error : function(XMLHttpRequest, textStatus, errorThrown){
				  widget.showInfoMessage('Changes don\'t saved to server. The error thrown: '+errorThrown,'error');
				},
		  success: function(data){
				  var status = data.status;
					if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') 
					  widget.showInfoMessage(data.status, 'error');
					else {
						widget.showInfoMessage('Color of calendar ' + calendarName + ' was succesfull saved to server', 'confirm');
						widget._applyColorChanges(p_pickArea,calId,bgcolor);
						//document.location.href = "/apex/CalendarAnything";
					}
				}
		});
	},

	_changeWebCalendarColor : function(p_pickArea,p_choosenColor)
	{
		var calId = p_pickArea.id.replace('_color','');
		var bgcolor = p_choosenColor;
		var pickarea = p_pickArea;
		
		var params = {};
		var widget = this;
		if (!this.getCalendarById(this.options.data.SelectedCalendars, calId)) return;
		var calendarName = this.getCalendarById(this.options.data.SelectedCalendars, calId).value;
		params[this.options.GetParamNameEvent] = this.options.EventNameSaveWebColor;
		params[this.options.GetParamNameColor] = bgcolor;
		params[this.options.GetParamNameCalID] = calId;
		params[this.options.GetParamNameToken] = this.options.sessionToken;		
		widget.showInfoMessage('Changing color of '+ calendarName +' ...','info',true);    
		$.ajax({
		  url: this.options.saveSelectedUrl,
		  type: 'POST',
		  dataType: 'json',
		  data: params,
		  cache: false, 
				error : function(XMLHttpRequest, textStatus, errorThrown){
				  widget.showInfoMessage('Changes don\'t saved to server. The error thrown: '+errorThrown,'error');
				},
		  success: function(data){
				  var status = data.status;
					if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') 
					  widget.showInfoMessage(data.status, 'error');
					else {
						widget.showInfoMessage('Color of calendar ' + calendarName + ' was succesfull saved to server', 'confirm');
						widget._applyColorChanges(p_pickArea,calId,bgcolor);
						//document.location.href = "/apex/CalendarAnything";
					}
				}
		});
	},

	_applyColorChanges : function(p_pickArea,p_calId,p_bgcolor)
	{
		$(p_pickArea).css('background-color',p_bgcolor)
		this._createNewCssClass(p_calId,p_bgcolor);
	},
	
	
	_createNewCssClass : function(classname, bgcolor, visible) {
		reRenderCalendarColorsStyle(classname, bgcolor, visible);
    },	
	
//	_createNewCssClass : function(classname, bgcolor, visible) {
//        var str_append = '';
//		var colorInst = bgcolor.parseColor();
//		var fontColor = colorInst.revertColor;
//        if(visible == null ||  visible == true) {
//            str_append = '<style class="cls_styles"> .' + classname + ',.' + classname + ' a { display: block; visibility: visible; background-color: ' + bgcolor  + ' !important;  border-color: ' + bgcolor  + '  !important; color: ' + fontColor + '  !important; }  .' + classname + ' { display: block; visibility: visible; border-color: ' + bgcolor  + '  !important; } </style>';
//        } else {
//            str_append = '<style class="cls_styles"> .' + classname + ' { display: none; visibility: hidden; } .' + classname + ' a { display: none; visibility: hidden; } </style>';
//        }
//
//		if ($("style.cls_styles").length > 0)
//		{
//			var s = 0;
//			$("style.cls_styles").each(function(i) 
//			{
//				if ($(this).is(":contains(." + classname + ")")) 
//				{
//					s = s + 1;
//				} 
//			});
//			if (s == 0) $('body').append(str_append);
//		}
//		else $('body').append(str_append);
//    },
	
	openCalendarsSelector : function()
	{
		this._getDialogWnd().dialog('open');
//                this.CalendarsSelectorDiv.SortablePanels({
//                    clean : true,
//                    sort: false,
//                    panel1 : 'list_of_all_calendars',
//                    panel2 : 'list_of_visible_calendars',
//                    connected_class : 'connectedVisbleCalendarsSortable', 
//                    panel1_list : this.options.data.NonSelectedCalendars,
//                    panel2_list : this.options.data.SelectedCalendars
//                });
	},
	
	_getDialogWnd : function()
	{
		if (this.CalendarsSelectorDiv != null) {
			this.CalendarsSelectorDiv.remove();
			this.CalendarsSelectorDiv = null;
		}
		if(this.CalendarsSelectorDiv == null)
		{
			var calendarController = this;
			var dialogHTML = '<div id="dlg_visible_for_user" title="Select Calendar to Display" style="display: none; padding: 0px;">';
			dialogHTML += '<table width="500" class="calendar-selector-text">';
			dialogHTML += '<tr>';
			dialogHTML += '<td align="left">';
			dialogHTML += '<table style="height:100px;">';
			dialogHTML += '<tr>';
			dialogHTML += '<td>';
			dialogHTML += '<div id="list_of_all_calendars">';
			dialogHTML += '<h5 class="calendar-selector-heading">Available:</h5>';
			dialogHTML += '<ul class="ui-state-highlight connectedVisbleCalendarsSortable"></ul>';
			dialogHTML += '</div>';
			dialogHTML += '</td>';
			dialogHTML += '<td style="width:100px;">';
			dialogHTML += '<div class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" id="sel_right_btn" style="width:100%; margin-bottom: 3px; padding: 0.3em 0;">';
			dialogHTML += '<span class="ui-button-text">Select &gt;</span>';
			dialogHTML += '</div>';
			dialogHTML += '<div class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" id="sel_left_btn" style="width:100%; margin-bottom: 3px; padding: 0.3em 0;">';
			dialogHTML += '<span class="ui-button-text">&lt; Don\'t Select</span>';
			dialogHTML += '</div>';
			dialogHTML += '</td>';
			dialogHTML += '<td>';
			dialogHTML += '<div id="list_of_visible_calendars">';
			dialogHTML += '<h5 class="calendar-selector-heading">Selected:</h5>';
			dialogHTML += '<ul class="ui-state-highlight connectedVisbleCalendarsSortable"></ul>';
			dialogHTML += '</div>';
			dialogHTML += '</td>';
			dialogHTML += '</tr>';
			dialogHTML += '<tr>';
			dialogHTML += '<td>';
			dialogHTML += '<div class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" id="sort-available-list-btn" style="width:100%; margin-bottom: 3px; padding: 0.3em 0;">';
			dialogHTML += '<span class="ui-button-text">Sort</span>';
			dialogHTML += '</div>';
			dialogHTML += '</td>';
			dialogHTML += '<td></td>';
			dialogHTML += '<td>';
			dialogHTML += '<div class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" id="sort-list-btn" style="width:100%; margin-bottom: 3px; padding: 0.3em 0;">';
			dialogHTML += '<span class="ui-button-text">Sort</span>';
			dialogHTML += '</div>';
			dialogHTML += '</td>';
			dialogHTML += '</tr>';
			dialogHTML += '</table>';
			dialogHTML += '<div id="dlg_visible_for_user_text" class="calendar-selector-text"> ';
			dialogHTML += 'Help: Please select the calendars you\'d like to display on the My Calendars page. ';
			dialogHTML += 'Please note, only calendars you have access to will display on the list provided below.';
			dialogHTML += '</div>';
			dialogHTML += '</td>';
			dialogHTML += '</tr>';
			dialogHTML += '</table>';
			dialogHTML += '</div>';
			
			var tempWrapper = document.createElement('div');
			tempWrapper.innerHTML = dialogHTML;
			this.CalendarsSelectorDiv = $(tempWrapper).find('#dlg_visible_for_user');
			
			var f27Trim = function(i, val) {
				val.value = (val.value.length > 29) ? (val.value.substr(0, 27) + '...') : val.value;
			}
			var filterWebCalendar = function(el) {
				return el.calendarType != 'web'
			}
			jQuery.each(this.options.data.NonSelectedCalendars, f27Trim);
			jQuery.each(this.options.data.SelectedCalendars, f27Trim);
			
			var aSelected = []
				.concat(this.options.data.SelectedCalendars)
				.filter(filterWebCalendar);
			var aNonSelected = []
				.concat(this.options.data.NonSelectedCalendars)
				.filter(filterWebCalendar);
			
			this.CalendarsSelectorDiv.SortablePanels({
                            clean : true,
							sort: false,
                            panel1 : 'list_of_all_calendars',
                            panel2 : 'list_of_visible_calendars',
                            connected_class : 'connectedVisbleCalendarsSortable', 
                            panel1_list : aNonSelected,
                            panel2_list : aSelected
            });
			
			jQuery('#sort-list-btn, #sort-available-list-btn').live('click',function () {
				var items = ($(this).attr('id') == 'sort-list-btn') 
					? $('#list_of_visible_calendars li')
					: $('#list_of_all_calendars li');
				var itemsCount = items.length;
				for (var i = 0; i < itemsCount; i++) {
					//items = $('#list_of_visible_calendars li');
					items = ($(this).attr('id') == 'sort-list-btn') 
						? $('#list_of_visible_calendars li')
						: $('#list_of_all_calendars li');					
					for (var j = 0; j < itemsCount - 1; j++) {
						if (jQuery(items[j]).html().toLowerCase() > jQuery(items[j + 1]).html().toLowerCase()) {
							jQuery(items[j + 1]).insertBefore(jQuery(items[j]));
						}
					}
				}
			});
			
			this.CalendarsSelectorDiv.dialog({
                        bgiframe: true,
                        autoOpen: false,
                        width: 500,
                        height: 430,
                        modal: true,
						resizable: false,
                        buttons: {
							'Save': function() {
							    var result = calendarController.CalendarsSelectorDiv.SortablePanelsGetResult(
					                {panel1 : 'list_of_all_calendars', panel2 : 'list_of_visible_calendars'}
					            ); 
								
                                calendarController._saveDialogResult(result); 
                                $(this).dialog('close');
								calendarController._initChecked();
								return false;  
                            },
                            'Cancel': function() {
                                $(this).dialog('close');
                                return false;
                            }
                        }
			}); 
		}
		
		return this.CalendarsSelectorDiv;
	},
	
	//should it be a separate function or better do it on dialog save action?
	_saveDialogResult : function(p_result)
	{	
		if (this.options.data.NonSelectedCalendars.length == 0 && p_result.panel1Data != undefined && p_result.panel1Data.length > 0) {
			this.options.data.NonSelectedCalendars = p_result.panel1Data;
		}
		var oldAllCalendars = this.options.data.NonSelectedCalendars,
			oldSelectedCalendars = this.options.data.SelectedCalendars,
			newNonSelectedCalendars = [],
			newSelectedCalendars = [];
		
		//create merged assoc array that contains both selected and non-selected calendars
		var mergedCalendarsWithIdKeys = {},
			oldAllCalendarsLength = oldAllCalendars.length; 
		for (var i = 0; i < oldAllCalendarsLength; i++) {
			mergedCalendarsWithIdKeys[oldAllCalendars[i].id] = oldAllCalendars[i];
		}
		var oldSelectedCalendarsLength = oldSelectedCalendars.length; 
		for (var i = 0; i < oldSelectedCalendarsLength; i++) {
			mergedCalendarsWithIdKeys[oldSelectedCalendars[i].id] = oldSelectedCalendars[i];
		}
		
		//move calendars in accordance to a dialog result
		var newAllIds =  p_result.panel1.split('|'),
			newAllLength = newAllIds.length;
		for (var i = 0; i < newAllLength; i++) {
            if (newAllIds[i].length > 0) {
				newNonSelectedCalendars.push(mergedCalendarsWithIdKeys[newAllIds[i]]);
		    }
		}
		this.options.data.NonSelectedCalendars = newNonSelectedCalendars;
		
		var newSelectedIds = p_result.panel2.split('|'),
			newSelectedLength = newSelectedIds.length,
			aNeedToCheckEditable = [];
		
		
		for (var i = 0; i < newSelectedLength; i++) {
            if (newSelectedIds[i].length > 0) {
				newSelectedCalendars.push(mergedCalendarsWithIdKeys[newSelectedIds[i]]);
				if (mergedCalendarsWithIdKeys[newSelectedIds[i]].editable == null) {
					aNeedToCheckEditable.push(newSelectedIds[i]);
				}
		    }
		}
		this.options.data.SelectedCalendars = newSelectedCalendars;
		
        var aToRemove = this.options.data.CheckedCalendars.intersect(newAllIds);
		
        if (aToRemove.length > 0) {
            if (aToRemove.length > 0) {
                for (var i = 0; i < aToRemove.length; i++) {
                    this._removeCalendarFromFullCalendar(aToRemove[i]);
                    jQuery('span.calendar-controller-item-checkbox.checkbox_checked[id="' + aToRemove[i] + '"]').removeClass('checkbox_checked');
		        }
		    }	
            this.options.data.CheckedCalendars = this.options.data.CheckedCalendars.diff(aToRemove);
            this._refreshCookie();
        }	
			
		//remove the unselected calendars from checked, from fullCalendar and from cookies
//		var CheckedCalendars = this.options.data.CheckedCalendars;
//		var CheckedCalendarsLength = CheckedCalendars.length;
//		var newCheckedCalendars = [];
//		var cookieNeedRefresh = false;
//		
//		for(var i = 0; i < CheckedCalendarsLength; i++)
//		{
//			if(CheckedCalendars[i].length > 0)
//			if(newSelectedIds.indexOf(CheckedCalendars[i]) == -1)
//			{		  
//				this._removeCalendarFromFullCalendar(CheckedCalendars[i]);
//				cookieNeedRefresh = true;
//			}
//			else
//			{
//				newCheckedCalendars.push(CheckedCalendars[i]);
//			}		
//		}
//		this.options.data.CheckedCalendars = newCheckedCalendars;
//		if(cookieNeedRefresh)
//			this._refreshCookie();
			
		this._renderSelectedCalendars();
		this._renderAllGroups();
		this._initChecked(true);
		this._attachEvents();
		this._saveSelectedCalendarsToServer(p_result.panel1, p_result.panel2, aNeedToCheckEditable);
	},
	 
	_saveSelectedCalendarsToServer : function(p_stringWithAllIds, p_stringWithSelectedIds, aNeedToCheckEditable)
	{
		var params = {}, self = this;

		var widget = this;
        params[this.options.GetParamNameEvent] = this.options.EventNameSaveVisibility;
        params[this.options.GetParamNameVisible] = p_stringWithSelectedIds;
        params[this.options.GetParamNameToken] = this.options.sessionToken;
        if (aNeedToCheckEditable != undefined && aNeedToCheckEditable.length > 0) {
        	params.checkEditable = aNeedToCheckEditable.join('|');
        }
 		widget.showInfoMessage('Changing calendars visibility...','info',true);
		
        $.ajax({
    		url: this.options.saveSelectedUrl,
            type: 'POST',
            data: params,
			dataType: 'json',
            cache: false, 
			error : function(XMLHttpRequest, textStatus, errorThrown){
			 	widget.showInfoMessage('Changes don\'t saved to server. The error thrown: '+errorThrown,'error');
			},
            success: function(data){
			  	var status = data.status;
				if (status == undefined || status == null || status.substring(0, 5).toLowerCase() == 'error') {
					widget.showInfoMessage(data.status, 'error');
				} else {
					widget.showInfoMessage('Calendars visibility was successfully saved to server', 'confirm');
				}
				if (data.result != undefined ) {
					self._updateEditable(data.result);
				}
           	}  
        });
	},
	
	_updateEditable : function(editable) {
		var aTmpLink = {}, self = this;
		for (var i = 0; i < this.options.data.SelectedCalendars.length; i++) {
			aTmpLink[this.options.data.SelectedCalendars[i].id] = i;
		}

		
		jQuery.each(editable, function(sKey, bValue){
			if (aTmpLink[sKey] != undefined) {
				self.options.data.SelectedCalendars[aTmpLink[sKey]].editable = bValue;
			}
		});
	}
  });
})(jQuery);