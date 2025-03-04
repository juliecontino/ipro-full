(function($) {
	$.fn.ColorSelect = function(options) {
		var m_options = { nopopup : false, 
						  color   : 'rgb(204, 51, 51)' 
						};
		m_options = $.extend(m_options, options || {});
		var m_colors = [  [
						  "191, 191, 191",
						  "127, 127, 127",
						  "0, 0, 0",
						  "255, 0, 0",
						  "127, 0, 0",
						  ],
						  
						  [
						  "255, 255, 0",
						  "127, 127, 0",
						  "0, 255, 0",
						  "0, 127, 0",
						  "0, 255, 255",
						  ],
						  
						  [
						  "0, 127, 127",
						  "0, 0, 100",
						  "0, 0, 127",
						  "255, 0, 255",
						  "127, 0, 127",
						  ]
					 ];
		
		var $this = $(this);
		$this.append(render());
		var $colors_select = $('#cs_popup');
		var $colors_ind = $('#cs_indicator');
		$colors_select.css({'top': '0px', 'left' : '0px', 'display': 'none', 'z-index' : '999'});
		
		if(m_options.nopopup == false) {
			$colors_ind.bind('click', function(event) {
					$colors_select.show();
			});
		} else {
			$colors_select.show();
		}
		
		$("a[id*='cs_item_']").bind('click', function(event) {
			    var $current_target = (event.target)? $(event.target) : $(event.srcElement);
				$colors_ind.css('background-color' ,  $current_target.css('background-color'));
				if(m_options.nopopup == false) {
					$colors_select.hide();
				}
		});
		
		function render() {
			var html = '';
			
			html += '<table>';
			html += '<tr>';
			html += '<td>';

			html += '<a href="#"  class="cs-popup-color-item"  style="background-color: ' + m_options.color + ';" id="cs_indicator" ></a>';

			html += '</td>';
			html += '<td>';

			html += '<div id="cs_popup" class="cs-colors">';
			html += '<table style="border-left-style:solid; border-color: #000; border-width: 1px; ">';
			for(i = 0; i < m_colors.length; i++) {
				html += '<tr>';
				for(e = 0; e < m_colors[i].length; e++) {
					html += '<td>';
					html += '<a href="#" class="cs-popup-color-item" id="cs_item_' + i + e + '"';
					html += 'style="background-color:rgb(' +  m_colors[i][e] +');" ';
					html += 'onmouseover="this.style.borderColor=\'#000\'" onmouseout="this.style.borderColor=\'#FFF\'">';
					html += '</a>';
					html += '</td>';
				}
				html += '</tr>';
			}
			
			html += '</table>'
			html += '</div>';
			
			html += '</td>';
			html += '</tr>';
			html += '</table>';
			return html;
		}	
		
		
	}		  
})(jQuery);