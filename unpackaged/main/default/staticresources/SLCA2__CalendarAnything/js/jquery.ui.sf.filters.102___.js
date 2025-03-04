/*
 * jQuery UI, Filter for SF 1.0.2.050
 * - IE8 error fixed 
 * - added lookups
 * - added first filter yes/no option
 * - added safe control values yes/no option
 * - added new picklist and MultiPiclist functional
 * - fixed record type
 * - added setup advanced filter value
 * Author: Serg Brull 
 * Copyright (c) 2010 
 *
 * Updated by Privlad 
 * 
 * Updated by Yuriy Guziy on 09 Dec 2010 from 1.0.2.050 to 1.0.2.050a
 * - added lookupURL option
 * - added lookupAddClass option
 * - "add button" position through function this.options.calcMargin
 *
 * Updated by Dmitry Malenko
 * - added window to select type of lookup of owner
 * - added functionality to Advanced filters logic
 *
 * Depends:
 *  jQuery UI 1.8.2
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.ui.datepicker.js
 */
 
(function($) {
		  
	$.fn.value = function() {
		if(this.attr("fieldType") == "checkbox") {
			return this[0].checked;	
		} else {
			return this.val();	
		}	
	}
	
	$.widget("ui.sfFilters", {
		log : function() {
			if (this.options.debug == true) {
				var msg = '';
				for(var i = 0; i < arguments.length; i++) {
					msg += arguments[i];
				}
				$("#sf_filter_debug").append("<div>msg: " + msg +"</div>");
			}
		},
		
		options : {
			debug : false,
			source : "http://localhost/",
			sourceFieldData : "http://localhost/json_pl",
			lookupURL : "/apex/SL_FilterLookupPage",
			lookupAddClass : "",
			calcMargin : function(width) {return (width == 0)? 390 : width-160;},
			goalTargetID: '',
			filterset : [],
			fieldset : [],
			advancedFilter : '',
			firstFilter : true,
			safeValue : true,
			switchover : false,
			sort : false,
			delimiter : "|", 
			//events
			change : null,
			load : null,
			afterload : null
		},
		
		/*presets*/
		filter_empty : { name: '', operator: '', value: ''},
		
		operators_text_set : [
			{"Name" : "equals", "Label" : "equal"},
			{"Name" : "not equal", "Label" : "notEqual"},
			{"Name" : "contains", "Label" : "contains"},
			{"Name" : "not contain", "Label" : "notContain"},
			{"Name" : "includes", "Label" : "includes"},
			{"Name" : "excludes", "Label" : "excludes"},
			{"Name" : "starts with", "Label" : "startsWith"}
		],
		
		operators_default_set : [
			{"Name" : "equals", "Label" : "equal"},
			{"Name" : "not equal", "Label" : "notEqual"}
								 
		],

		operators_number_set : [
			{"Name" : "equals", "Label" : "equal"},
			{"Name" : "not equal", "Label" : "notEqual"},
			{"Name" : "less than", "Label" : "lessThan"},
			{"Name" : "less or equal", "Label" : "lessOrEqual"},
			{"Name" : "greater or equal", "Label" : "greaterOrEqual"},
			{"Name" : "greater than", "Label" : "greaterThan"}
		],
		
		operators_picklist_set : [
			{"Name" : "includes", "Label" : "includes"},
			{"Name" : "excludes", "Label" : "excludes"}
		],
		operators_multipicklist_set : [
			{"Name" : "equals", "Label" : "equal"},
			{"Name" : "not equal", "Label" : "notEqual"},
			{"Name" : "includes", "Label" : "includes"},
			{"Name" : "excludes", "Label" : "excludes"}
		],
		
		operators : {},
		
		type_render_functions : {},
		
		/*variables*/
		content : null,
		field_select_control : null,
		operator_select_control : null,
		
		filter_index : 1,
		
		field_data :  {},
		
		/*public function*/
		Load : function() {
			
			this.log("load start");
			var widget = this;
			this.events = new Array();
			
			//this need for fix IE8 error with ajax request
			$.ajaxSetup( {xhr:function(){
				try{
					if(window.ActiveXObject)
						return new window.ActiveXObject("Microsoft.XMLHTTP");
				} catch(e){}
						return new window.XMLHttpRequest();
				}  
			});
			
			$.ajax({
				  url: widget.options.source,
				  type: 'POST',
				  //data: params,
				  dataType: 'json',
				  cache: false, 
				  success: function(data) {
					  	widget.log("load::data", data)
					    if(data.fields != undefined) {
							widget.options.fieldset  = data.fields;
						}
					    if(data.filters != undefined) {
							widget.options.fiterset  = data.filters;
							widget.log("loadFiterSet", data.filters);
						}
						widget.filter_index = 1;
						widget._initialize();
						widget._generateView();
				  },
				  error : function(XMLHttpRequest, textStatus, errorThrown) {
					  widget.log('@Error: ' + errorThrown);
            		  widget.log('@Status: ' + textStatus);
            		  widget.log('@Status Text: ' + XMLHttpRequest.statusText);
					  widget.element.html(textStatus);
				  },
				  complete : function(XMLHttpRequest, textStatus) {
					  widget.log("load::complete", textStatus);
				  }
			});
		},
		
		_loadFieldData : function(p_field_name, p_filter_index, p_value, p_callback) {
			var widget = this;
			this.events = new Array();
			var params = {};
			params["picklist"] = p_field_name;
			
			//this need for fix IE8 error with ajax request
			$.ajaxSetup( {xhr:function(){
				try{
					if(window.ActiveXObject)
						return new window.ActiveXObject("Microsoft.XMLHTTP");
				} catch(e){}
						return new window.XMLHttpRequest();
				}  
			});
			
			$.ajax({
				  url: widget.options.sourceFieldData,
				  type: 'POST',
				  data: params,
				  dataType: 'json',
				  cache: false, 
				  success: function(data) {
					 widget.log("_loadFieldData", data)
					 if($.isFunction(p_callback)) {
						if(data[p_field_name] != undefined) 
							p_callback(p_filter_index, p_value, data[p_field_name], widget);	 
						else{
							p_callback(p_filter_index, p_value, [], widget);	 
						}	
					 }
					 	
				  }
			});
		},
		
		Serialize : function() {
			var result = '';
			for(var i = 1; i < this.filter_index; i++)	{
				var $field = $("#sf_filter_field_" + i);
				var field = $field.val();
				var field_type = this._getCurrentFieldType(field);				
				var operator = $("#sf_filter_operator_" + i).val();
				var value = $("#sf_value_" + i).value();
				var value_lookup = $("#sf_value_" + i + "_lkid").val();
				if(value_lookup == undefined) {
					value_lookup = "";
				}
				
				if(i != 1) {
					result += "##";
				}
				// Type|operator|value|a05###
				var delimiter = this.options.delimiter;
				result += field_type + delimiter + field + delimiter + operator + delimiter + 
						  this._normalizeValue(field_type, value)+ delimiter + value_lookup;
			}
			return result;
		},
		
		AdvancedFilter : function(p_value) {
			var $fa_value = $("#sf_filter_advanced_value");
			var value ='';
			if(p_value == undefined) {
				value = $fa_value.val();
				if(value == '') {
					this._generateAdvancedFilterValue();
					value =  $fa_value.val();
				}
			} else {
				 $fa_value.val(p_value);
			}
			return value;	
		},
		
		Reinit : function(p_fieldset, p_filterset) {
			if(p_fieldset != undefined) {
				this.options.fieldset = p_fieldset;
			}
			if(p_filterset != undefined) {
				this.options.filterset = p_filterset;
				widget.log("setFiterSet:", p_filterset);
			}
			this.log("Reinit");
			this._initialize();
			this._generateView();
		},
		
		Source : function(p_source) {
			this.options.source = p_source;
			this.options.sourceFieldData = p_source;
			this.Load();
		},
		
		Enable : function(p_is_enable) {
			this.log("Enable: ", p_is_enable);
			if(p_is_enable == false) {
				this.element.find(":enabled").attr("disabled", "disabled");
				this._renderFog(true);
			} else {
				this.element.find(":disabled").removeAttr("disabled");	
				this._renderFog(false);
			}
		},
		
		_renderFog : function(p_is_fog) {
			if(p_is_fog == true) {
				this.element.prepend('<div id="sf_filter_fog" style="background-color:#eeecd1; z-index: 190; opacity: .6; filter: alpha(opacity = 60);position: absolute;"></div>');
				$("#sf_filter_fog")
						.css("width", this.element.width())
						.css("height", this.element.height());
			} else {
				$("#sf_filter_fog").remove();	
			}
		},

		_switchoverNameAndValue : function() {
			var result = new Array();
			var label = "";
			
			for(var i = 0; i  < this.options.fieldset.length; i++) {
				label = this.options.fieldset[i].id ;
				this.options.fieldset[i].id = this.options.fieldset[i].value;
				this.options.fieldset[i].value = label;
			}
			
		},		
		
		_normalizeValue : function(p_type, p_value) {
			result = p_value;
			if(p_type == "DATETIME") {
				result = result.replace(" ", "T");
				if(result != '') { 
					if( result.substr(result.length - 4) != ":00Z") {
						result += ":00Z" 
					}
				};	
			}
			return result;
		},
		
		/*initialize functions*/
		_create: function() {
			if(this.options.debug == true) {
				this.element.parent().append('<div id="sf_filter_debug"></div>');
			}
			this.log("_create start");
			this.operators["TEXT"] 			= this.operators_text_set;
			this.operators["STRING"] 		= this.operators_text_set;
			this.operators["TEXTAREA"] 		= this.operators_text_set;	
			this.operators["PICKLIST"] 		= this.operators_picklist_set;	
			this.operators["MULTIPICKLIST"] = this.operators_multipicklist_set;	
			this.operators["COMBOBOX"] 		= this.operators_text_set;	
			this.operators["DOUBLE"] 		= this.operators_number_set;	
			this.operators["DATE"] 			= this.operators_number_set;	
			this.operators["DATETIME"] 		= this.operators_number_set;	
			this.operators["ID"] 			= this.operators_default_set;	
			this.operators["REFERENCE"] 	= this.operators_default_set;	
			this.operators["LOOKUP"] 		= this.operators_default_set;	
			this.operators["URL"] 			= this.operators_text_set;	
			this.operators["PHONE"] 		= this.operators_text_set;	
			this.operators["PERCENT"] 		= this.operators_number_set;	
			this.operators["INTEGER"] 		= this.operators_number_set;
			this.operators["CURRENCY"] 		= this.operators_number_set;
			this.operators["BOOLEAN"] 		= this.operators_default_set;
			this.operators["DEFAULT"] 		= this.operators_default_set;
			
			this.type_render_functions["REFERENCE"] = this._generateLookupControl;
			this.type_render_functions["LOOKUP"] = this._generateLookupControl;
			this.type_render_functions["URL"] = this._generateTextControl;
			this.type_render_functions["PHONE"] = this._generateTextControl;
			this.type_render_functions["DEFAULT"] = this._generateTextControl;
			
			this.type_render_functions["BOOLEAN"] = this._generateBooleanControl;
			this.type_render_functions["PICKLIST"] = this._generatePicklistControl;
			this.type_render_functions["MULTIPICKLIST"] = this._generateMultiPicklistControl;
			
			if(!$.isFunction(this.options.load)) {
				this.Load();
			} else {
				this.options.load(this);
				if( this.options.switchover == true) {
					this.log("switchover");
					this._switchoverNameAndValue();	
				}
				this._initialize();
				this._generateView();
			}
			
		},
	
		_setOption: function(key, value) { 
			this.options[key] = value;
		},
		
		_initialize : function() {
			this.filter_index = 1;
			if(this.options.sort == true) {
				this._sort(this.options.fieldset, "name");
			}
		},
		
		_in_array : function(p_array, p_value) {
			var result = false;
			for(var i = 0; i < p_array.length; i++) {
				if(p_array[i] == p_value) {
					result = true;
					break;
				}
			}
			return result;	
		},
		
		_getFormId : function() {
			return this.element.parents("form").attr("id");
		},
		
		_sort : function(p_array_of_objects, p_property_name) {
			p_array_of_objects.sort(function(a, b) {
				return a[p_property_name] > b[p_property_name];											 
			});
		},
		
		_replaceIndexInName : function(p_name, p_index) {
			return p_name.replace(/\d/, p_index);
		},
		
		_replaceIndexInElement : function(p_element, p_index) {
			var id = p_element.attr("id");
			if(id != undefined && id != '') {
				var new_id = widget._replaceIndexInName(id, p_index);
				p_element.attr("id", new_id);
			}
			var bindtofilter = p_element.attr("bindtofilter");
			if(bindtofilter != undefined && bindtofilter != '') {
				p_element.attr("bindtofilter", p_index);
			}
		},
		
		_changeFilterIndex : function(p_filter_element, p_new_index) {
			var $element = $(p_filter_element);
			var widget = this;
			widget._replaceIndexInElement($element, p_new_index);
			$element.children("span:first").html(p_new_index);
			$element.find("*").each(function(idx){
				widget._replaceIndexInElement($(this), p_new_index);
			});
		},
		
		_getRenderFunctionByType : function(p_type) {
			var callback = this.type_render_functions[p_type];
			if($.isFunction(callback)) {
				return callback;
			} else {
				return this.type_render_functions["DEFAULT"];
			}
		},
		
		_getAvaiableOperators : function(p_type) {
			var result = this.operators[p_type];
			if(result == undefined) {
				result =  this.operators["DEFAULT"];
			}
			return result;
		},
		
		_getCurrentFieldType : function(p_selected) {
			if(this.options.fieldset.length == 0) return "DEFAULT";
			try {
				if(p_selected == "recordtypeid" || p_selected == "RecordTypeId") {
					return "PICKLIST";		
				}
				var result =  this.options.fieldset[0].type;
				for(var i =0; i < this.options.fieldset.length; i++) {
					if( this.options.fieldset[i].value == p_selected) {
						result =  this.options.fieldset[i].type;
						break;
					}		
				}
			} catch(err) {
				var result = "DEFAULT";
			}
			console.log("_getCurrentFieldType:: ", p_selected, result);
			return result;
		},
		
		_getReferencePrefix : function(p_field_name) {
			if(this.options.fieldset.length == 0) return "000";	
			var result =  "000";
			this.log("_getReferencePrefix::" + p_field_name);
			for(var i =0; i < this.options.fieldset.length; i++) {
				//this.log("_getReferencePrefix::this.options.fieldset["+i+"].value = " +  this.options.fieldset[i].value);
				//this.log("_getReferencePrefix::prefix = " +  this.options.fieldset[i].prefix);
				if( this.options.fieldset[i].value == p_field_name) {
					this.log("_getReferencePrefix::" +  this.options.fieldset[i].prefix);
					result =  this.options.fieldset[i].prefix;
					break;
				}
			}
			//if (p_field_name == 'OwnerId') result = '005';
			return result;
		},
		
		_generateAdvancedFilterValue : function(mode) {
			var result = '';
			if (mode !== 'add') {
				for(var i = 1; i < this.filter_index; i++) {
					if(i != 1) {
						result += " AND ";	
					}
					result += i;
				}
				$("#sf_filter_advanced_value").val(result);
			} else {
				var currValue = $("#sf_filter_advanced_value").val();
				if (currValue === '') {
					currValue = '1';
				} else if (currValue === '1') {
					currValue += ' AND 2';
				} else {
					currValue = '(' + currValue + ') AND ' + (this.filter_index-1);
				}
				$("#sf_filter_advanced_value").val(currValue);
			}
			return result;
		},
		
		_generateView : function() {
			this.element.html('<div id="sf_filters_content"></div>');
			this.content = $("#sf_filters_content");
			this._addButton();
			this._addAdvancedOptions();
			if(this.options.firstFilter == true) {
				this._addFilter(this.filter_empty);
			}
			this.log(" generateView: Start");	
			try {
				this.log(" generateView: options.filterset.length: "+this.options.filterset.length);	
				for(var i = 0; i < this.options.filterset.length; i++) {
					this._addFilter(this.options.filterset[i], true);
				}
			} catch(err) {
				this.log(" _generateView:: Exception: " + err);	
			}
			
			if($.isFunction(this.options.afterload)) {
				this.options.afterload(this);			
			}
			
		},
		
		_addButton : function() {
			widget = this;
			var margin = this.element.width();
			if ($.isFunction(this.options.calcMargin)) margin = this.options.calcMargin(margin);

			this.element.append('<div id="sf_filter_add_place" class="sf_filter_add_place" style="width:30px; margin-top: 10px; margin-left:'+ margin +'px;"><input type="button" id="sf_filter_add_btn" value="add search criteria" /></div>');
			
			IE = navigator.userAgent.indexOf("MSIE") >= 0;
			if (IE) {
				IE7 = navigator.userAgent.indexOf("MSIE 7.0") >= 0;
				if(IE7)	{
					$("#sf_filter_add_btn").css('left','-30px');
				}
			}

			
			$("#sf_filter_add_btn")
				.button()
				.bind("click", this, function(event){
					var callback = event.data.options.change;																		   
					if($.isFunction(callback)) {
						callback(event, event.data);
					}					
					widget._addFilter(widget.filter_empty, false);							
			});	
		},
		
		_addAdvancedOptions : function() {
			widget = this;
			this.element.append(this._generateAdvanced());
			$("#sf_filter_advanced").accordion({ 
					header: 'h3' , 
					collapsible: true,
					fillSpace: false,
					autoHeight: false,
					animated: false,
					clearStyle: false,
					navigation: false,
					active: 2
			});
			if(this.options.advancedFilter != '') {
				$("#sf_filter_advanced_value").val(this.options.advancedFilter);		
			}
		},
		
		_FieldChangeHandler : function(event) {
			var callback = event.data.options.change;																		   
			if($.isFunction(callback)) {
				callback(event, event.data);
			}
			event.data._FieldChange(this);
		},
		
		_FieldChange : function(p_element) {
			var $this = $(p_element);
			var field = $this.val();
			console.dir(p_element);
			console.log(field);
			var filter_index = $this.parent().attr("bindtofilter");
			var field_type = this._getCurrentFieldType(field);				
			var selected = $("#sf_filter_operator_" + filter_index).val();
			var value = (field_type != "BOOLEAN")? "" : false;
			//this._safeValueValidator($("#sf_value_" + filter_index).val());
			
			//this.log("field_type::" + field_type + "; filter_index:: " + filter_index + "; selected:: " + selected + "; value:: " + value + "; field:: "  + field);
			$("#sf_filter_place_" + filter_index).html(
					this._generatePlaceData(field_type, filter_index, selected, value, field, this)
			);
			
			$("#sf_value_" + filter_index).bind("keydown", this, function(event){
				try {
					var filter_index = $(this).parents("div").attr("bindtofilter");
					$("#sf_value_" + filter_index + "_lkid").val("");
					//event.data.log("_FieldChange::ClearLookUpID:" + filter_index 
					//			   + "; eid:" + "#sf_value_" + filter_index + "_lkid");
				} catch(err) {}																  
				var callback = event.data.options.change;																		   
				if($.isFunction(callback)) {
					callback(event, event.data);
				}															 
			});
			
			if(field_type == "DATE") {
				$("#sf_value_" + filter_index).datepicker({
									showButtonPanel: true, 
									showTime: false,
									dateFormat: 'yy-mm-dd'
								    });
				$("#sf_value_" + filter_index).after('<input type="button" id="sf_filter_clear_btn_'+ filter_index +'"  value="clear" style="background-color:#dfeffc; border: 1px solid #c5dbec; border-radius: 5px; color:#2e6ebf; width:' + ($.browser.mozilla ? '40px' : 'auto') + '" />');
				$('#sf_filter_clear_btn_'+ filter_index).bind('click',function(ev) {
					document.getElementById("sf_value_" + filter_index).value = '';
				});
			} else if(field_type == "DATETIME") {
				$("#sf_value_" + filter_index).datepicker({
									showButtonPanel: true, 
									showTime: true,
									dateFormat: 'yy-mm-dd'
								    });
				$("#sf_value_" + filter_index).after('<input type="button" id="sf_filter_clear_btn_'+ filter_index +'"  value="clear" style="background-color:#dfeffc; border: 1px solid #c5dbec; border-radius: 5px; color:#2e6ebf; width:' + ($.browser.mozilla ? '40px' : 'auto') + '" />');
				$('#sf_filter_clear_btn_'+ filter_index).bind('click',function(ev) {
					document.getElementById("sf_value_" + filter_index).value = '';
				});
			}
			
			//this.log('generated palce: ', event.data._generatePlaceData(field_type, filter_index, selected, value));			
		},
		
		_FilterDeleteHandler : function(event) {
			var callback = event.data.options.change;																		   
			if($.isFunction(callback)) {
				callback(event, event.data);
			}
			event.data._FilterDelete(this);
			$('.ui-block-sites-section').hide();
		},
		
		_FilterDelete : function(p_element) {
			var $element = $(p_element);
			var filter_index = $element.parent().attr("bindtofilter");
			$element.parent().remove();
			for(var i = filter_index ;  i < this.filter_index; i++) {
				var $filter = $("#sf_filter_" + i);
				this._changeFilterIndex($filter, i-1)
			}
			this.filter_index--;
			this._generateAdvancedFilterValue('delete');
		},
		
		_addFilter : function(p_filter_object, p_is_load) {
			var field_name = "";
			if(p_filter_object.Name == "") {
				try {
					field_name = this.options.fieldset[0].value;
				} catch(err) {
					this.log(err);
				}
			}else {
				field_name = p_filter_object.id;
			}
			
			var current_field_type = this._getCurrentFieldType(field_name);
			var value = (p_is_load == true)? p_filter_object.value : this._safeValueValidator(p_filter_object.value, current_field_type); 
			
			var html = '<div id="sf_filter_'+ this.filter_index + '" bindtofilter="'+  this.filter_index +'" style=" margin-left: 5px; margin-top: 3px;">';
			html +=  '<span id="sf_filter_counter_'+ this.filter_index +'" style="">'+ this.filter_index + 
					 '</span>. <input type="button" id="sf_filter_remove_btn_'+ this.filter_index +'"  value="del" />';
			html += '&nbsp;';
			html += this._generateSelect('sf_filter_field', this.filter_index, this.options.fieldset, p_filter_object.id, 150);
			html += '&nbsp;';
			html += '<span id="sf_filter_place_' +  this.filter_index + '">'
			html += this._generatePlaceData(current_field_type, 
											this.filter_index, 
											p_filter_object.operator, 
											value,//this._safeValueValidator(p_filter_object.value, current_field_type), 
											field_name,
											this);
			html += '</span>';
			html += '</div>';
			
			this.content.append(html);
			
			//if (field_name == 'OwnerId') {
				var widget = this;
				$('.owner-lookup-btn').live('click',function () {
					var elem = this;
					var overlay = $('<div>',{'class': 'filter-owner-overlay'});
					overlay.css({
						'position': 'fixed',
						'z-index': '1000',
						'top': '0px',
						'left': '0px',
						'width': '100%',
						'height': '100%',
						'background-color': '#333',
						'opacity': '0.5'
					});
					
					var htmlStr = '';
					htmlStr += '<table style="background-color:#fcfcfc;border-radius:5px;width:200px;">';
					htmlStr += '	<tr>';
					htmlStr += '		<td>Select owner type</td>';
					htmlStr += '		<td align="right"><a href="#" class="close-filter-owner-window">X</a></td>';
					htmlStr += '	</tr>';
					htmlStr += '	<tr>';
					htmlStr += '		<td colspan="2" align="center">';
					htmlStr += '			<select class="option-filter-owner-window">';
					htmlStr += '				<option value="005">User</option>';
					htmlStr += '				<option value="00g">Group</option>';
					htmlStr += '			</select>';
					htmlStr += '			<input type="button" class="confirm-filter-owner-window" value="ok" />';
					htmlStr += '		</td>';
					htmlStr += '	</tr>';
					htmlStr += '</table>';
					var ownerTypeSelect = $('<div>',{
						'class': 'filter-owner-window',
						'html': htmlStr
					});
					ownerTypeSelect.css({
						'position': 'fixed',
						'z-index': '1010',
						'top': '50%',
						'left': '47%'
					});
					
					$('body').append(overlay);
					$('body').append(ownerTypeSelect);
					
					$('.close-filter-owner-window').bind('click',function () {
						$('.filter-owner-overlay').remove();
						$('.filter-owner-window').remove();
					});
					
					$('.confirm-filter-owner-window').click(function () {
						var id = $(elem).attr('id');
						var form_id = $(elem).attr('form_id');
						$('#' + id + '_lktp').val($('.option-filter-owner-window').val());
						//alert(id + '_lktp');
						openLookup('/_ui/common/data/LookupPage?kfm='+ form_id + '&lknm='+ id + '&lktp=' + getElementByIdCS(id + '_lktp').value,670,'1','&lksrch=' + escapeUTF(getElementByIdCS(id).value.substring(0, 80)));
						
						$('.filter-owner-overlay').remove();
						$('.filter-owner-window').remove();
					});
				});
			//}
			
			$("#sf_filter_remove_btn_"+ this.filter_index).bind("click", this, this._FilterDeleteHandler).button();
			
			$("#sf_filter_field_" + this.filter_index).bind("change", this, this._FieldChangeHandler);
			
			$("#sf_value_" + this.filter_index).bind("keydown", this, function(event) {
				try {
					var filter_index = $(this).parents("div").attr("bindtofilter");
					$("#sf_value_" + filter_index + "_lkid").val("");
				} catch(err) {}															   
				var callback = event.data.options.change;																		   
				if($.isFunction(callback)) {
					callback(event, event.data);
				}															 
			});
			
			var f_index = this.filter_index;
			if(current_field_type == "DATE") {
				$("#sf_value_" + this.filter_index).datepicker({
									showButtonPanel: true, 
									showTime: false,
									dateFormat: 'yy-mm-dd'
								    });
				$("#sf_value_" + this.filter_index).after('<input type="button" id="sf_filter_clear_btn_'+ this.filter_index +'"  value="clear" style="background-color:#dfeffc; border: 1px solid #c5dbec; border-radius: 5px; color:#2e6ebf; width:' + ($.browser.mozilla ? '40px' : 'auto') + '" />');
				$('#sf_filter_clear_btn_'+ this.filter_index).bind('click',function(ev) {
					document.getElementById("sf_value_" + f_index).value = '';
				});
			} else if(current_field_type == "DATETIME") {
				$("#sf_value_" + this.filter_index).datepicker({
									showButtonPanel: true, 
									showTime: true,
									dateFormat: 'yy-mm-dd'
								    });
				$("#sf_value_" + this.filter_index).after('<input type="button" id="sf_filter_clear_btn_'+ this.filter_index +'"  value="clear" style="background-color:#dfeffc; border: 1px solid #c5dbec; border-radius: 5px; color:#2e6ebf; width:' + ($.browser.mozilla ? '40px' : 'auto') + '" />');
				$('#sf_filter_clear_btn_'+ this.filter_index).bind('click',function(ev) {
					document.getElementById("sf_value_" + f_index).value = '';
				});
			}

			this.filter_index++;
			if(p_is_load != true) {
				this._generateAdvancedFilterValue('add');
			}
		},
		
		_generatePlaceData : function(p_field_type, p_filter_index, p_selected, p_value, p_field_name, p_widget) {
			var html = '';
			//this.log("_generatePlaceData::p_filter_index:: ", p_filter_index);
			html += this._generateSelect("sf_filter_operator", p_filter_index,  this._getAvaiableOperators(p_field_type),  p_selected, 130);
			html += '&nbsp;';
			var callback = this._getRenderFunctionByType(p_field_type);
			this.log("_generatePlaceData::p_field_name:: " + p_field_name );
			html += callback(p_filter_index, p_value, p_field_name, p_widget);
			return html;
		},
		
		_safeValueValidator : function(p_value, p_field_type) {
			var p_empty_value  = (p_field_type != "BOOLEAN")? "" : false;
			return (this.options.safeValue == true)? p_value : p_empty_value;	
		},
		
		_generateAdvanced : function() {
			var html = "";
			html += '<div id="sf_filter_advanced" class="ui-advanced" style="margin-left:0px; margin-top:5px;">';
			html += '<h3><a href="#" >Advanced Filter</a></h3>';
			html += '<div id="sf_filter_advanced_container" style="display: none;">';
			html += '<input type="text" id="sf_filter_advanced_value" style="font-size: 1.2em; width:99%; background: #fff;" class="text ui-widget-content ui-corner-all"/><br />';
			//html += '<img height="211" width="533" title="Boolean Filters Help" alt="Boolean Filters Help" src="jquery/report_boolean_filter.gif">';
			html += '<img height="211" width="533" title="Boolean Filters Help" alt="Boolean Filters Help" src="/img/report_boolean_filter.gif">';
			html += '</div>';
			html += '</div>';
			return html;
		},
		
		_generateSelect : function(p_field_name, p_filter_index, p_options_list, p_selected, width) {
			//this.log("_generateSelect::p_filter_index:: ", p_filter_index);
			var html = '<select id="' + p_field_name + '_' + p_filter_index + '" class="text ui-widget-content ui-corner-all" style="width:'+width+'px;">';
			for(var i = 0; i < p_options_list.length; i++) {
				html += this._generateOption( p_options_list[i].id, p_options_list[i].value, (p_options_list[i].id == p_selected) || (p_options_list[i].value == p_selected));
			}
			html += '</select>';
			return html;
		},
		
		_generateOption : function(p_name, p_value, p_selected) {
			var selected = (p_selected == true)? 'selected="selected"' : '';
			html = '\t<option value="' + p_value +'" ' + selected + '>' + ((p_name != undefined)?  p_name : p_value) + '</option>';
			return html;
		},
		
		_generateTextControl : function(p_filter_index, p_value) {
			var regex = /^(\d{4})\D?(0[1-9]|1[0-2])\D?([12]\d|0[1-9]|3[01])(\D?([01]\d|2[0-3])\D?([0-5]\d)\D?([0-5]\d)?\D?(\d{3})?([zZ]|([\+-])([01]\d|2[0-3])\D?([0-5]\d)?)?)?$/g;
			var value = p_value;
			if (regex.test(p_value)) {
				value = p_value.substr(0,10) + ' ' + p_value.substr(11,5);
			}
			var html = '<input  type="text" id="sf_value_' + p_filter_index + '" value="' + value +'" class="ext ui-widget-content ui-corner-all" style="width:180px;">';
			return html;
		},
		
		_generateBooleanControl : function(p_filter_index, p_value) {
			var checked = (p_value == true || p_value == "true") ? "checked=checked" : "";
			var html = '<input type="checkbox"  id="sf_value_' + p_filter_index + '" ' + checked + '/>';
			return html;	
		},
		
		
		
		
		_generatePicklistControl : function(p_filter_index, p_value, p_field_name, p_widget) {
			var html = '';
			html += '<script  type="text/javascript">';
			html += "filterLookupValueElem = 'sf_value_" + p_filter_index +"';";
			html += '</script>';
			
			html += '<span id="sf_filter_lookup">';
				html += '<span class="lookupInput ' + p_widget.options.lookupAddClass + '">';
					html += '<input type="text" size="20" name="sf_value_' + p_filter_index + '" maxlength="255" id="sf_value_' + p_filter_index + '" value="'+p_value+'"/>';
					html += '<a title="Lookup (New Window)" onclick="setLastMousePosition(event)" ';
					html += 'href="'
					html += "javascript:filterLookupValueElem='sf_value_" + p_filter_index +"'; openPopupFocus('"+p_widget.options.lookupURL+"?event=load&target="+p_widget.options.goalTargetID+"&picklist="+p_field_name+"', 'filter_lookup', 620, 430, 'width=620,height=430,resizable=yes,toolbar=no,status=no,scrollbars=yes,menubar=no,directories=no,location=no,dependant=no', false, true);";
					html += '">';
					html += '<img title="Lookup (New Window)"'; 
					html += "onmouseover=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
					html += "onmouseout=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\"";
					html += "onfocus=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
					html += "onblur=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\" class=\"lookupIcon filter\" alt=\"Lookup (New Window)\" src=\"/s.gif\">";
					html += '</a>';
				html += '</span>';	
			html += '</span>';
			return html;
			
		},
		
		_generateMultiPicklistControl : function(p_filter_index, p_value, p_field_name, p_widget) {

			var html = '';
			html += '<script  type="text/javascript">';
			html += "filterLookupValueElem = 'sf_value_" + p_filter_index +"';";
			html += '</script>';
			
			html += '<span id="sf_filter_lookup">';
				html += '<span class="lookupInput ' + p_widget.options.lookupAddClass + '">';
					html += '<input type="text" size="20" name="sf_value_' + p_filter_index + '" maxlength="255" id="sf_value_' + p_filter_index + '" value="' + p_value + '" />';
					html += '<a title="Lookup (New Window)" onclick="setLastMousePosition(event)" ';
					html += 'href="'
					html += "javascript:filterLookupValueElem='sf_value_" + p_filter_index +"'; openPopupFocus('"+p_widget.options.lookupURL+"?event=load&target="+p_widget.options.goalTargetID+"&picklist="+p_field_name+"', 'filter_lookup', 620, 430, 'width=620,height=430,resizable=yes,toolbar=no,status=no,scrollbars=yes,menubar=no,directories=no,location=no,dependant=no', false, true);";
					html += '">';
					html += '<img title="Lookup (New Window)"'; 
					html += "onmouseover=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
					html += "onmouseout=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\"";
					html += "onfocus=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
					html += "onblur=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\" class=\"lookupIcon filter\" alt=\"Lookup (New Window)\" src=\"/s.gif\">";
					html += '</a>';
				html += '</span>';	
			html += '</span>';
			return html;
			
		},		
		
		_picklistCallBackHandler : function( p_filter_index, p_value, p_data, p_widget) {
			var html = p_widget._generateSelect("sf_value", p_filter_index, p_data, p_value, 180);
			//p_widget.log("_picklistCallBackHandler::", p_value, " Data:: ", html);
			$("#sf_value_container_" + p_filter_index).html(html);
		},

		_generateLookupControl : function(p_filter_index, p_value, p_field_name, p_widget) {
			if(p_widget == null) { return "<span>Error, info not loaded...<span>"}
			var id = "sf_value_" + p_filter_index;
			var form_id = p_widget._getFormId();
			var referenced_to = p_widget._getReferencePrefix(p_field_name);
			p_widget.log("_generateLookupControl::p_field_name: " + p_field_name);
			p_widget.log("_generateLookupControl::referenced_to: " + referenced_to);
			var html = '';
			html += '<span id="sf_filter_lookup">';
				html += '<input type="hidden" value="000000000000000" id="' + id + '_lkid" name="'+ id + '_lkid" />';
				html += '<input type="hidden" value="null" id="' + id + '_lkold" name="'+ id + '_lkold" />';
				html += '<input type="hidden" value="' + referenced_to + '" id="' + id + '_lktp" name="'+ id + '_lktp" class="lookup_id" />';
				html += '<input type="hidden" value="0" id="' + id + '_lspf" name="'+ id + '_lspf" />';
				html += '<input type="hidden" value="0" id="' + id + '_lspfsub" name="'+ id + '_lspfsub" />';
				html += '<input type="hidden" value="0" id="' + id + '_mod" name="'+ id + '_mod" />';
				
				var objName = $('#dlg_object_name').val();
				var postfix;
				if (objName) {
					postfix = objName.substr(objName.length - 3, 3);
				}
				
				if (p_field_name == 'OwnerId' && (objName == 'case' || objName == 'lead' || objName == 'contract' || postfix == '__c')) {
					html += '<span class="lookupInput ' + p_widget.options.lookupAddClass + '">';
						html += '<input type="text" size="20" name="' + id + '" maxlength="255" id="' + id + '" value="' + p_value + '" />';
						html += '<a onclick="setLastMousePosition(event)" id="' + id + '" form_id="' + form_id + '" class="owner-lookup-btn">';
						html += '<img title="Deal Name Lookup (New Window)"'; 
						html += "onmouseover=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
						html += "onmouseout=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\"";
						html += "onfocus=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
						html += "onblur=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\" class=\"lookupIcon filter\" alt=\"Deal Name Lookup (New Window)\" src=\"/s.gif\">";
						html += '</a>';
					html += '</span>';
				} else {
					html += '<span class="lookupInput ' + p_widget.options.lookupAddClass + '">';
						html += '<input type="text" size="20" name="' + id + '" maxlength="255" id="' + id + '" value="' + p_value + '" />';
						html += '<a title="Deal Name Lookup (New Window)" onclick="setLastMousePosition(event)" ';
						html += 'href="'
						html += "javascript: openLookup('/_ui/common/data/LookupPage";
						html += "?kfm="+ form_id + "&lknm="+ id + "&lktp='";
						html += " + getElementByIdCS('" + id + "_lktp').value,670,'1','&lksrch='";
						html += " + escapeUTF(getElementByIdCS('" + id + "').value.substring(0, 80)))";
						html += '">';
						html += '<img title="Deal Name Lookup (New Window)"'; 
						html += "onmouseover=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
						html += "onmouseout=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\"";
						html += "onfocus=\"this.className = 'lookupIconOn " + p_widget.options.lookupAddClass + "';\"";
						html += "onblur=\"this.className = 'lookupIcon " + p_widget.options.lookupAddClass + "';\" class=\"lookupIcon filter\" alt=\"Deal Name Lookup (New Window)\" src=\"/s.gif\">";
						html += '</a>';
					html += '</span>';
				}
			html += '</span>';
			return html;
		}
	});
})(jQuery);