/**
 * @author dgrudzinskiy
 */
var colorPickerManagerForGroups = {
	
	CurrentPickarea : null, //pickarea, colorpicker is active for
	
	colorPicker : null,
	
	//default afterpick action
	afterPickAction : function(p_element,p_curColor){
		jQuery(p_element).css('background-color',p_curColor);
	},
	
	getColorPickerBody : function()
	{
		var retHTML = '';
		retHTML += "<a class='close-picker-button'>X</a>"
		retHTML += "<table class='colors-table'>";
		retHTML += "<tr>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#C0C0C0;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#808080;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#000000;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#FF0000;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#800000;'></a></td>";
		retHTML += "</tr>";
		retHTML += "<tr>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#FFFF00;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#808000;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#00FF00;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#008000;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#00FFFF;'></a></td>";
		retHTML += "</tr>";
		retHTML += "<tr>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#008080;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#0000FF;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#000080;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#FF00FF;'></a></td>";
		retHTML += "	<td><a href='#' class='fcui-popup-color-item' style='background-color:#800080;'></a></td>";
		retHTML += "</tr>";
		retHTML += "<tr>";
		retHTML += "	<td colspan='5' style='text-align:right;'><a hef='#' class='calendar-controller-item-color-link' style='cursor:pointer;'>advanced</a></td>";
		retHTML += "</tr>";
		retHTML += "</table>";
	
		return retHTML;
	},
	
	getColorpicker : function()
	{
		if (this.colorPicker == null) {
			this.colorPicker = document.createElement('div');
			var wrappedColorpicker = jQuery(this.colorPicker);
			wrappedColorpicker.attr('class','fcui-popup-colors');
			wrappedColorpicker.attr('id','colors');
			wrappedColorpicker.html(this.getColorPickerBody());
			wrappedColorpicker.appendTo('body');
			wrappedColorpicker.find('.fcui-popup-color-item').bind('click',{managerObj: this},this.pickChoosenColor);
			var managerObj = this;
			wrappedColorpicker.find('.close-picker-button').bind('click',function(){
				managerObj.closePicker()
			});
			
			var pickerObj = this;
			var oldValue = jQuery(pickerObj.CurrentPickarea).css('background-color');

			wrappedColorpicker.find(".calendar-controller-item-color-link").ColorPicker({
				color: jQuery(pickerObj.CurrentPickarea).css('background-color'),
				onShow: function (colpkr) {
					var colorParts = jQuery(pickerObj.CurrentPickarea).css('background-color').replace(/rgb\(/g,'').replace(/\)/g,'').split(', ');
					jQuery('.colorpicker_rgb_r input').val(colorParts[0]);
					jQuery('.colorpicker_rgb_g input').val(colorParts[1]);
					jQuery('.colorpicker_rgb_b input').val(colorParts[2]);
					jQuery('.colorpicker_rgb_b input').trigger('change');
					jQuery(colpkr).fadeIn(500);
					return false;
				},
				onHide: function (colpkr) {
					jQuery(colpkr).fadeOut(500);

					return false;
				},
				onSubmitColor: function (hex) {
					jQuery(pickerObj.CurrentPickarea).css('background-color', '#' + hex);
					if (oldValue != jQuery(pickerObj.CurrentPickarea).css('background-color')) {
						pickerObj.afterPickAction(pickerObj.CurrentPickarea,jQuery(pickerObj.CurrentPickarea).css('background-color'));
					}
				}
			});
			
		}	
		
		return this.colorPicker;
	},
	
	pickChoosenColor : function(event)
	{
		 var managerObj = event.data.managerObj;
		 var fcui_current_target = (event.target)? event.target : event.srcElement;
		 //var prevColor = jQuery(managerObj.CurrentPickarea).css('background-color');
		 var choosenColor = jQuery(fcui_current_target).css('background-color');
		 //jQuery(managerObj.CurrentPickarea).css('background-color',jQuery(fcui_current_target).css('background-color'));
		 managerObj.closePicker();
		 managerObj.afterPickAction(managerObj.CurrentPickarea,choosenColor);
	},
	
	closePicker : function()
	{
		 var picker = jQuery(this.getColorpicker());
		 picker.find(".close-picker-button").css('display','none');
		 picker.hide('fast');
	},
	
	openColorpickerForPickarea : function(event) {
         var fcui_current_target = (event.target)? event.target : event.srcElement;
		 event.data.managerObj.CurrentPickarea = fcui_current_target;
         var coords = jQuery(fcui_current_target).offset();
         var clr_height = jQuery('#AppBodyHeader').height();
		 var picker = jQuery(event.data.managerObj.getColorpicker());
         picker.css('left', coords.left-7).css('top', coords.top-((clr_height!=null)?(clr_height):(0))+7).show('fast',function(){
		 	jQuery(this).find(".close-picker-button").css('display','block');
		 });  // button for close shows after window open to avoid box jumping
    },
	
	initPickAreas : function(p_className){
		jQuery('.'+p_className).bind('click',{managerObj: this},this.openColorpickerForPickarea);
	}
	
	
}
