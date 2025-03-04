/**
 * Author: Dmitry Malenko
 * Version: 1.0 beta
 * Date: Dec 2011
 * Description: Widget that display and control Color Picker
 * 
 */

jQuery(function ($) {
	
	$.widget('ds.ColorSelector',{
		options: {
			color : 'rgb(12, 127, 200)',
			widgetPath : ''
		},
		
		_colorTable: '',
		_advancedWindow: '',
		_popupPosition: {},
		_canvas: '',
		_ctx: '',

		
		_create: function () {
			wdg = this;
			wdg._createSkeleton();
			wdg._initStartColor(wdg.options.color);
			wdg._bindEvents();
		},
		
		_createSkeleton: function () {
			wdg = this;
			wdg._colorTable = $('<table>',{
				'cellspacing': '2px',
				'cellpadding': '0px',
				'html' :
					'<tr>' +
						'<td class="ds-color-selector-td" style="background-color:#d24848;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#d2b348;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#89d248;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#48d2a3;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#48b0d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#4882d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#6548d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#cd48d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#e11e35;">&nbsp;</td>' +
						'<td class="ds-advanced-selector-td" rowspan="2">&nbsp;</td>' +
					'</tr>' +
					'<tr>' +
						'<td class="ds-color-selector-td" style="background-color:#d27548;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#d0d248;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#48d24b;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#48d2c3;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#48a6d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#4865d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#8c48d2;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#d2487f;">&nbsp;</td>' +
						'<td class="ds-color-selector-td" style="background-color:#9e9e9e;">&nbsp;</td>' +
						'<td></td>' +
					'</tr>'
			});
			$(wdg._colorTable).appendTo(wdg.element);
			wdg._popupPosition.left = $(wdg._colorTable).find('.ds-advanced-selector-td').offset().left;
			wdg._popupPosition.top = $(wdg._colorTable).find('.ds-advanced-selector-td').offset().top;
		},
		
		_bindEvents: function () {
			wdg = this;
			
			/* Change standard color */
			$(wdg._colorTable).find('.ds-color-selector-td').click(function () {
				$(wdg._colorTable).find('.ds-color-selector-td').removeClass('ds-color-selector-td-checked');
				$(this).addClass('ds-color-selector-td-checked');
				wdg._trigger("onColorChange", null, {color:$(wdg._colorTable).find('.ds-color-selector-td-checked').css('background-color')});
			});
			
			/* Change custom color */
			$(wdg._colorTable).find('.ds-advanced-selector-td').toggle(function () {
				wdg._showAdvancedWindow();
			},
			function () {
				$(wdg._advancedWindow).remove();
			});
		},
		
		_initStartColor: function (color) {
			var colorFound = false;
			wdg = this;
			$(wdg._colorTable).find('.ds-color-selector-td').removeClass('ds-color-selector-td-checked');
			$(wdg._colorTable).find('.ds-color-selector-td').each(function (i,el) {
				if ($(this).css('background-color') == color) {
					$(this).addClass('ds-color-selector-td-checked');
					colorFound = true;
					return false;
				}
			});
			if (!colorFound) {
				$(wdg._colorTable).find('.ds-color-selector-td:last').css('background-color',color);
				$(wdg._colorTable).find('.ds-color-selector-td:last').addClass('ds-color-selector-td-checked');
			}
		},
		
		_showAdvancedWindow: function () {
			wdg = this;
			console.dir(wdg._popupPosition);
			wdg._advancedWindow = $('<div>',{
				'class': 'ds-advanced-color-selector-back',
				'style': 'top:' + (wdg._popupPosition.top - 30) + 'px;left:' + (wdg._popupPosition.left + 25) + 'px;',
				'html' : 
						'<div class="ds-color-selector-header">' +
							'<span>Select custom color</span><div class="ds-color-selector-preview"></div>' +
						'</div>' +
						'<div class="ds-color-selector-content">' +
							'<table width="100%">' +
								'<tr>' +
									'<td rowspan="2"><canvas id="dScSpickerArea" width="125" height="100" style="margin:5px;"></canvas></td>' +
									'<td>' +
										'R: <input type="text" class="ds-color-component component-r" /> G: <input type="text" class="ds-color-component component-g" /> B: <input type="text" class="ds-color-component component-b" /><br />' +
										'HEX: <input type="text" class="ds-color-hex" /><br />' +
									'</td>' +
								'</tr>' +
								'<tr>' +
									//'<td></td>' +
									'<td align="right" valign="bottom">' +
										'<input type="button" value="Save" class="ds-color-button ds-color-save-button" />' +
										'<input type="button" value="Cancel" class="ds-color-button ds-color-cancel-button" />' +
									'</td>' +
								'</tr>' +
							'</table>' +
						'</div>'
			});
			$(wdg._advancedWindow).appendTo('body');
			
			var image = new Image();
			image.onload = function () {
				wdg._ctx.drawImage(image, 0, 0, image.width, image.height);
			}
			image.src = this.options.widgetPath + 'css/gradient.png';
			//wdg._canvas = $(wdg._advancedWindow).find('.pickerArea').get();
			wdg._canvas = document.getElementById('dScSpickerArea');
			wdg._ctx = wdg._canvas.getContext('2d');
			
			$('#dScSpickerArea').click(function(e) {
				var canvasOffset = $(wdg._canvas).offset();
				var canvasX = Math.floor(e.pageX - canvasOffset.left);
				var canvasY = Math.floor(e.pageY - canvasOffset.top);
				var imageData = wdg._ctx.getImageData(canvasX, canvasY, 1, 1);
				var pixel = imageData.data;
				
				var pixelColor = "rgba("+pixel[0]+", "+pixel[1]+", "+pixel[2]+", "+pixel[3]+")";
				$(wdg._advancedWindow).find('.ds-color-selector-preview').css('backgroundColor', pixelColor);
			});
			
			$('#dScSpickerArea').mousemove(function(e) {
				var canvasOffset = $(wdg._canvas).offset();
				var canvasX = Math.floor(e.pageX - canvasOffset.left);
				var canvasY = Math.floor(e.pageY - canvasOffset.top);
				var imageData = wdg._ctx.getImageData(canvasX, canvasY, 1, 1);
				var pixel = imageData.data;
				
				$(wdg._advancedWindow).find('.component-r').val(pixel[0]);
				$(wdg._advancedWindow).find('.component-g').val(pixel[1]);
				$(wdg._advancedWindow).find('.component-b').val(pixel[2]);
				var dColor = pixel[2] + 256 * pixel[1] + 65536 * pixel[0];
				$(wdg._advancedWindow).find('.ds-color-hex').val( '#' + dColor.toString(16) );
			});
			
			$('.ds-color-save-button').click(function () {
				$(wdg._colorTable).find('.ds-color-selector-td').removeClass('ds-color-selector-td-checked');
				$(wdg._colorTable).find('.ds-color-selector-td:last').css('background-color',$(wdg._advancedWindow).find('.ds-color-selector-preview').css('backgroundColor'));
				$(wdg._colorTable).find('.ds-color-selector-td:last').addClass('ds-color-selector-td-checked');
				wdg._trigger("onColorChange", null, {color:$(wdg._colorTable).find('.ds-color-selector-td-checked').css('background-color')});
				$(wdg._advancedWindow).remove();
			});
			
			$('.ds-color-cancel-button').click(function () {
				$(wdg._advancedWindow).remove();
			});
		}
	});
	
});