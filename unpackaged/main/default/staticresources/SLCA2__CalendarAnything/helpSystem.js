(function($){
	$.widget('ds.helpSystem',{
		options: {
			helpButton: 'helpButton',
			baseURL: ''
		},
		
		content: '',
		wnd: '',
		
		_create: function() {
			var wdg = this;
			$('.'+this.options.helpButton).click(function(event){
				wdg.cancelBubbling(event);
				if ($(this).attr('id') != null && $(this).attr('id') != '') {
					$("<div></div>").load(wdg.options.baseURL+$(this).attr('id')+'.html',function(data){
						wdg._showContent(wdg._parseImages(data));
					});
				} else {
					wdg._showContent('Error: Help not found.');
				}
			});
		},
		
		cancelBubbling: function(oEvent) {
			if(oEvent && oEvent.stopPropagation)
				oEvent.stopPropagation();
			else
				window.event.cancelBubble = true;
		},
		
		_showContent: function(content) {
			var baseUrl = this.options.baseURL;
			var wdg = this;
			wdg.wnd = $("<div>",{
				'class': 'helpMessage',
				'html' : content,
				'title': 'Help'
			});
			wdg.wnd.appendTo($(wdg.element));
			wdg.wnd.dialog({
				width: 500,
				height: 300
			});
		},
		
		_parseImages: function(data) {
			var regexp = /{![a-zA-Z0-9\._]+}/g;
			var quantes = data.match(regexp);
			if (quantes) {
				for (var i=0; i<quantes.length; i++) {
					var clearQuant = quantes[i].substr(2,quantes[i].length - 3);
					data = data.replace(quantes[i],'<img src="' + this.options.baseURL + clearQuant + '" class="helpImage" />');
				}
			}
			return data;
		}

	});
})(jQuery) 