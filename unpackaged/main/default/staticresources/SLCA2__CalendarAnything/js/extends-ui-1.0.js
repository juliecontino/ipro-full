(function($) {

  $.fn.SelectInitialize = function(options, selected, objName) {
		$this = $(this);
		$this.html('');
		if (objName == undefined) objName = '';
		for(i = 0; i < options.length; i++) {
			if (!(objName.toLowerCase() === 'event' && (options[i].name === 'recurrenceenddateonly' || options[i].name === 'recurrencestartdatetime')))
			if(options[i].name != selected ) { 
				$this.append('<option value="' + options[i].name +'">' + options[i].value +'</option>');	
			} else {
				$this.append('<option value="' + options[i].name +'" selected="selected">' + options[i].value +'</option>');	
			}
		}
	}
	
	$.fn.RadioInitialize = function(value) {
		$this = $(this);
		$("#" + value ).attr('checked', 'checked');	
	}

	$.fn.RadioInitializeByReturn = function(value) {
		$this = $(this);
		$("input[return="+ value +"]" ).each(function(idx, element) {
				$(this).attr('checked', 'checked');	
				$(this)[0].checked = true;	
		});
	}
	
	$.fn.RadioGetValue = function() {
		$this = $(this);
		result = '';
		$this.children("input").each(function(idx){
			if( $(this)[0].checked == true ) {
				result = $(this).attr("id");
			}											  	
		});
		return result; 
	}
	
	$.fn.RadioGetReturn = function() {
		$this = $(this);
		result = '';
		$this.children("input").each(function(idx){
			if( $(this)[0].checked == true ) {
				result = $(this).attr("return");
			}											  	
		});
		return result; 
	}
	
	$.fn.CheckboxGetValue = function() {
		$this = $(this);
		var result = false;

		$this.each( function(idx){
			if( $(this)[0].checked == true ) {
				result = true;
			}
		});
		return  result;
	}
	
	$.fn.CheckboxInitialize = function(value) {
		$this = $(this);
		$this.each( function(i){
  			$(this)[0].checked = (value == true || value == "true")? true : false;
		});
	}

	$.fn.loadingBar = function(p_show) {
    	var $this = $(this);
		var lb_width = 80;
		var lb_height = 25;
		var width = $(window).width();
		var height = $(window).height();
		var top = (width / 2) - (lb_width / 2);
		var left = (width / 2) - (lb_width / 2);
		
		if(p_show == true) {
			var html = '<div id="loadingBar" ' + 
					   ' style="background-color:#eeecd1; z-index: 190; opacity: .6; left:0px; top:0px;' + 
					   'filter: alpha(opacity = 60);position: absolute; width:' + width +'px; height:' + height + 'px;">';
		    html += '	<div  style="position: relative; top:' + top + 'px; left: ' + left + 'px; ' + 
		    		   'height: ' + lb_height +'px; width:'+ lb_width +'px;">';
			html +=    '<img src="/img/loading.gif" alt="Please wait..." title="Please wait..." width="16" height="16"/>';
			html +=    '<span style="margin-left: 10px; margin-bottom: 5px;">loading...<span>';
			html +=    '</div>';
			html +=    '</div>';
		
		$this.append(html);
		
		} else {
			$("#loadingBar").remove();	
		}
    }
})(jQuery);