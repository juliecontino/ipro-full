/**
 * @preserve
 * FullCalendar v1.4.10
 * http://arshaw.com/fullcalendar/
 *
 * Use fullcalendar.css for basic styling.
 * For event drag & drop, requires jQuery UI draggable.
 * For event resizing, requires jQuery UI resizable.
 *
 * Copyright (c) 2010 Adam Shaw
 * Dual licensed under the MIT and GPL licenses, located in
 * MIT-LICENSE.txt and GPL-LICENSE.txt respectively.
 *
 * Date: Sat Jan 1 23:46:27 2011 -0800
 *
 */
 
 /* <!--- GAiello - custom HACK to get MORE events working based on version 1.4.4 (7/5/10) ---> 
  * And pushed to version 1.4.10 by dan gru. Hate hacks. Hate GAiello. >_<
  * You can find all functions changed during hacking by search for MORE HUCK phraze
  */
(function ($, undefined) {

/* Find top scroll position (D. Malenko) */
function getBodyScrollTop() {
	return self.pageYOffset || 
	(document.documentElement && document.documentElement.scrollTop) || 
	(document.body && document.body.scrollTop);
}

/* Prevent bubbling event */
function stopBubble(oEvent){
	if(oEvent && oEvent.stopPropagation)
		oEvent.stopPropagation();
	else
		window.event.cancelBubble = true;
}

/* Custom function for generate popup window to show error message (D. Malenko) */
function showErrorMessage(p_message) {
	var messageContainer = document.createElement('div');
	document.body.appendChild(messageContainer);
	var itemsLen = $('.widgetError').length;

	$(messageContainer).addClass('widgetError');
	$(messageContainer).attr('id','wdg_err_wnd_'+itemsLen);
	$(messageContainer).css('top',document.scrollTop);
	$(document).find('body').addClass('scrollHidden');

	var text = "";
	var grayElems = $('.widgetGrayBackground').length;
	if (grayElems > 0) {
		text += "<div class='widgetGrayBackground' style='display:none;'></div>";
	} else {
		text += "<div class='widgetGrayBackground'></div>";
	}
	text += "<table width='55%' class='widgetMessage' style='margin:"+(itemsLen*8)+"px; top: "+
			(getBodyScrollTop()+120)+"px;'>";
	text += "<tr><td style='color:#fff;padding:10px;' id='wdg_msg_container' align='center'>";
	text += p_message;
	text += "</td><td valign='top'>";
	text += "<a class=_lnk style='color:yellow; font-weight:bold; text-decoration:none;'>X</a>";
	text += "</td></tr>";
	text += "</table>";
	
	$(messageContainer).html(text);
	$(messageContainer).find('a').bind('click',function(){
		$(document).find('body').removeClass('scrollHidden');
		$(messageContainer).remove();
	});
	$('.widgetGrayBackground').css('height',(document.body.scrollHeight > document.body.offsetHeight)?document.body.scrollHeight:document.body.offsetHeight);
}

/* Serialise object and print to test div (D. Malenko) */
function serialize(obj,level) {
	var resStr = '';
	if (level == undefined) level = 0;
	if (level < 20) {
		var symb = '';
		if (level > 0) {
			for (var i=0; i<level; i++) {
				symb += '    ';
			}
			symb += '|-';
		}
		for (var item in obj) {
			if (typeof obj[item] == 'function') {
				resStr += symb + item + ' => function\n';
			} else if (typeof obj[item] == 'object'){
				resStr += symb + item + '\n';
				resStr += print_r(obj[item],(level+1));
			} else {
				resStr += symb + item + ' => ' + obj[item] + '\n';
			}
		}
	}
	return resStr;
}

/* Calculate time before two timepoint (D. Malenko) */
function loadingTime(startTime, endTime) {
	var res = 0;
	if (startTime != null && endTime != null) {
		var start = startTime.split('.');
		var end = endTime.split('.');
		var startSeconds = parseInt(start[0]);
		var startMilliseconds = parseInt(start[1]);
		var endSeconds = parseInt(end[0]);
		var endMilliseconds = parseInt(end[1]);
		
		if (endSeconds < startSeconds) {
			endSeconds += 60;
		}
		
		res = (((endSeconds * 1000) + endMilliseconds) - ((startSeconds * 1000) + startMilliseconds)) / 1000;
		
		if (isNaN(res)) {
			res = 0;
		}
	}
	
	return res;
}
	
var defaults = {

	// display
	defaultView: 'month',
	aspectRatio: 1.35,
	more : 3,
	header: {
		left: 'title',
		center: '',
		right: 'today prev,next'
	},
	weekends: true,
	
	allDayDefault: true,
	ignoreTimezone: true,
	
	// event ajax
	lazyFetching: true,
	startParam: 'start',
	endParam: 'end',
	
	// time formats
	titleFormat: {
		month: 'MMMM yyyy',//'dddd, MMM dd, yyyy',
		week: "MMM d[ yyyy]{ '&#8212;'[ MMM] d, yyyy}",
		day: 'dddd, MMM d, yyyy'
	},
	columnFormat: {
		month: 'dddd',
		week: 'ddd M/d',
		day: 'dddd M/d'
	},
	monthFormat: {
		month: 'MMM'
	},
	timeFormat: { // for event elements
		'': 'h(:mm)t' // default
	},
	
	// locale
	isRTL: false,
	firstDay: 0,
	monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
	monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
	dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
	dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
	buttonText: {
		prev: '&nbsp;&#9668;&nbsp;',
		next: '&nbsp;&#9658;&nbsp;',
		prevYear: '&nbsp;&lt;&lt;&nbsp;',
		nextYear: '&nbsp;&gt;&gt;&nbsp;',
		today: 'today',
		month: 'month',
		week: 'week',
		day: 'day'
	},
	
	// jquery-ui theming
	theme: false,
	buttonIcons: {
		prev: 'circle-triangle-w',
		next: 'circle-triangle-e'
	},
	
	//selectable: false,
	unselectAuto: true,
	
	dropAccept: '*'
	
};

// right-to-left defaults
var rtlDefaults = {
	header: {
		left: 'next,prev today',
		center: '',
		right: 'title'
	},
	buttonText: {
		prev: '&nbsp;&#9658;&nbsp;',
		next: '&nbsp;&#9668;&nbsp;',
		prevYear: '&nbsp;&gt;&gt;&nbsp;',
		nextYear: '&nbsp;&lt;&lt;&nbsp;'
	},
	buttonIcons: {
		prev: 'circle-triangle-e',
		next: 'circle-triangle-w'
	}
};



    var fc = $.fullCalendar = {
        version: "1.4.10 with particulary updates to 1.5.1"
    };
var fcViews = fc.views = {};


$.fn.fullCalendar = function(options) {


	// method calling
	if (typeof options == 'string') {
		var args = Array.prototype.slice.call(arguments, 1);
		var res;
		this.each(function() {
			var calendar = $.data(this, 'fullCalendar');
			if (calendar && $.isFunction(calendar[options])) {
				var r = calendar[options].apply(calendar, args);
				if (res === undefined) {
					res = r;
				}
				if (options == 'destroy') {
					$.removeData(this, 'fullCalendar');
				}
			}
		});
		if (res !== undefined) {
			return res;
		}
		return this;
	}
	
	
	// would like to have this logic in EventManager, but needs to happen before options are recursively extended
	var eventSources = options.eventSources || [];
	delete options.eventSources;
	if (options.events) {
		eventSources.push(options.events);
		delete options.events;
	}
	

	options = $.extend(true, {},
		defaults,
		(options.isRTL || options.isRTL===undefined && defaults.isRTL) ? rtlDefaults : {},
		options
	);
	
	
	this.each(function(i, _element) {
		var element = $(_element);
		var calendar = new Calendar(element, options, eventSources);
		element.data('fullCalendar', calendar); // TODO: look into memory leak implications
		calendar.render();
	});
	
	
	return this;
	
};


// function for adding/overriding defaults
function setDefaults(d) {
	$.extend(true, defaults, d);
}
 
function Calendar(element, options, eventSources) {
	var t = this;
	
	// exports
	t.options = options;
	t.render = render;
	t.destroy = destroy;
	t.refetchEvents = refetchEvents;
	t.reportEvents = reportEvents;
	t.reportEventChange = reportEventChange;
	t.rerenderEvents = rerenderEvents;
	t.changeView = changeView;
	t.select = select;
	t.unselect = unselect;
	t.prev = prev;
	t.next = next;
	t.prevYear = prevYear;
	t.nextYear = nextYear;
	t.today = today;
	t.gotoDate = gotoDate;
	t.refresh = refresh;
	t.incrementDate = incrementDate;
        t.formatDate = function(format, date) {
            return formatDate(format, date, options)
        };
        t.formatDates = function(format, date1, date2) {
            return formatDates(format, date1, date2, options)
        };
    t.setDate = setDate;
	t.getDate = getDate;
	t.getView = getView;
	t.option = option;
	t.trigger = trigger;
	t.calendarControllerOptions = options.calendarControllerOptions;
	
	
	// imports
	EventManager.call(t, options, eventSources);
	var isFetchNeeded = t.isFetchNeeded;
	var fetchEvents = t.fetchEvents;
	
	
	// locals
	var _element = element[0];
	var header;
	var headerElement;
	var content;
	var tm; // for making theme classes
	var currentView;
	var viewInstances = {};
	var elementOuterWidth;
	var suggestedViewHeight;
	var absoluteViewElement;
	var resizeUID = 0;
	var ignoreWindowResize = 0;
	var date = new Date();
	var events = [];
	var _dragElement;
	
	/* Main Rendering
	-----------------------------------------------------------------------------*/
	
	
	setYMD(date, options.year, options.month, options.date);
	
	
	function render(inc) {
		if (!content) {
			initialRender();
		}else{
			calcSize();
			markSizesDirty();
			markEventsDirty();
			renderView(inc);
		}
	}
	
	
	function initialRender() {
		tm = options.theme ? 'ui' : 'fc';
		element.addClass('fc');
		if (options.isRTL) {
			element.addClass('fc-rtl');
		}
		if (options.theme) {
			element.addClass('ui-widget');
		}
		content = $("<div class='fc-content " + tm + "-widget-content' style='position:relative'/>")
			.prependTo(element);
		header = new Header(t, options);
		headerElement = header.render();
		if (headerElement) {
			element.prepend(headerElement);
		}
		changeView(options.defaultView);
		$(window).resize(windowResize);
		
		// needed for IE in a 0x0 iframe, b/c when it is resized, never triggers a windowResize
		if (!bodyVisible()) {
			lateRender();
		}
	}
	
	
	// called when we know the calendar couldn't be rendered when it was initialized,
	// but we think it's ready now
	function lateRender() {
		setTimeout(function() { // IE7 needs this so dimensions are calculated correctly
			if (!currentView.start && bodyVisible()) { // !currentView.start makes sure this never happens more than once
				renderView();
			}
		},200);
	}
	
	
	function destroy() {
		$(window).unbind('resize', windowResize);
		header.destroy();
		content.remove();
		element.removeClass('fc fc-rtl fc-ui-widget');
	}
	
	
	
	function elementVisible() {
		return _element.offsetWidth !== 0;
	}
	
	
	function bodyVisible() {
		return $('body')[0].offsetWidth !== 0;
	}
	
	
	
	/* View Rendering
	-----------------------------------------------------------------------------*/
	
	
	function changeView(newViewName) {
		if (!currentView || newViewName != currentView.name) {
			ignoreWindowResize++; // because setMinHeight might change the height before render (and subsequently setSize) is reached

			unselect();
			
			var oldView = currentView;
			var newViewElement;
				
			if (oldView) {
				(oldView.beforeHide || noop)(); // called before changing min-height. if called after, scroll state is reset (in Opera)
				setMinHeight(content, content.height());
				oldView.element.hide();
			}else{
				setMinHeight(content, 1); // needs to be 1 (not 0) for IE7, or else view dimensions miscalculated
			}
			content.css('overflow', 'hidden');
			
			currentView = viewInstances[newViewName];
			if (currentView) {
				currentView.element.show();
			}else{
				currentView = viewInstances[newViewName] = new fcViews[newViewName](
					newViewElement = absoluteViewElement =
						$("<div class='fc-view fc-view-" + newViewName + "' style='position:absolute'/>")
							.appendTo(content),
					t // the calendar object
				);
			}
			
			if (oldView) {
				header.deactivateButton(oldView.name);
			}
			header.activateButton(newViewName);
			
			renderView(); // after height has been set, will make absoluteViewElement's position=relative, then set to null
			
			content.css('overflow', '');
			if (oldView) {
				setMinHeight(content, 1);
			}
			
			if (!newViewElement) {
				(currentView.afterShow || noop)(); // called after setting min-height/overflow, so in final scroll state (for Opera)
			}
			
			ignoreWindowResize--;
		}
	}
	
	
	
	function renderView(inc) {
		if (elementVisible()) {
			ignoreWindowResize++; // because renderEvents might temporarily change the height before setSize is reached

			unselect();
			
			if (suggestedViewHeight === undefined) {
				calcSize();
			}
			
			var forceEventRender = false;
			if (!currentView.start || inc || date < currentView.start || date >= currentView.end) {
				// view must render an entire new date range (and refetch/render events)
				currentView.render(date, inc || 0); // responsible for clearing events
				setSize(true);
				forceEventRender = true;
			}
			else if (currentView.sizeDirty) {
				// view must resize (and rerender events)
				currentView.clearEvents();
				setSize();
				forceEventRender = true;
			}
			else if (currentView.eventsDirty) {
				currentView.clearEvents();
				forceEventRender = true;
			} else if (currentView.reloadDirty != undefined && currentView.reloadDirty) {
				currentView.clearEvents();
				forceEventRender = 'refresh';
				currentView.reloadDirty = undefined;
			}
			currentView.sizeDirty = false;
			currentView.eventsDirty = false;
			currentView.eventsDirty = false;
			updateEvents(forceEventRender);
			
			elementOuterWidth = element.outerWidth();

			header.updateTitle(currentView.title);
			var today = new Date();
			if (today >= currentView.start && today < currentView.end) {
				header.disableButton('today');
			}else{
				header.enableButton('today');
			}
			
			ignoreWindowResize--;
			currentView.trigger('viewDisplay', _element);
		}
	}
	
	
	
	/* Resizing
	-----------------------------------------------------------------------------*/
	
	
	function updateSize() {
		markSizesDirty();
		if (elementVisible()) {
			calcSize();
			setSize();
			unselect();
			currentView.clearEvents();
			currentView.renderEvents(events);
			currentView.sizeDirty = false;
		}
	}
	
	
	function markSizesDirty() {
		$.each(viewInstances, function(i, inst) {
			inst.sizeDirty = true;
		});
	}
	
	
	function calcSize() {
		if (options.contentHeight) {
			suggestedViewHeight = options.contentHeight;
		}
		else if (options.height) {
			suggestedViewHeight = options.height - (headerElement ? headerElement.height() : 0) - vsides(content[0]);
		}
		else {
			suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
		}
	}
	
	
	function setSize(dateChanged) { // todo: dateChanged?
		ignoreWindowResize++;
		
		// FIX: autoheight calendar widget
        var CurrentHeight = $(window).height() - 260;
        if (jQuery('html').hasClass('maxPageSize')) {
            CurrentHeight += 180;
        }		
		//alert(CurrentHeight);
//		$("#three_dots").height(CurrentHeight);
		
		var CurLeftCalendarHeight = CurrentHeight;
		if (CurLeftCalendarHeight < 202) CurLeftCalendarHeight = 202;
		$("#body_calendars").height(CurLeftCalendarHeight);
		
//		var three_dots_top = Math.floor((CurrentHeight) / 2) - 18 + 43;
//		if (three_dots_top < 177) three_dots_top = 177;
//		$("#three_dots .hiddener_button").css("margin-top", three_dots_top);
		
		var my_calendar_top = Math.floor((CurrentHeight) / 2) - 104;
		if (my_calendar_top < 45) my_calendar_top = 45;
		$(".rotatedBlock").css("margin-top", my_calendar_top);
		
		$("#overlayBlock").height($("#body_calendars").height());
        $("#overlayBlock").css("width", $("#body_calendars").css("width"));
		
		//var CurrentHeight = content.width();
		//suggestedViewHeight was replace by CurrentHeight
		currentView.setHeight(CurrentHeight, dateChanged);
		if (absoluteViewElement) {
			absoluteViewElement.css('position', 'relative');
			absoluteViewElement = null;
		}
		var newWidth = Math.round(content.width()) ;
		var newWidth2 = Math.round($('#calendar_holder_td').width() - ($('#markupContainer').width() - $(window).width() + 40));
//		console.log('from setsize ' + newWidth + ' / ' + newWidth2);
//		var newWidth = Math.round($('#calendar_holder_td').width() - $('#contentWrapper').width() + $(window).width() - 40) ;
		currentView.setWidth(newWidth, dateChanged);
		ignoreWindowResize--;
	}
	
	
	function windowResize() {
		if (!ignoreWindowResize) {
			if (currentView.start) { // view has already been rendered
				var uid = ++resizeUID;
				setTimeout(function() { // add a delay
					if (uid == resizeUID && !ignoreWindowResize && elementVisible()) {
						var newWidth = Math.round(($(window).width() / 5) * 3);
//						$('#contentWrapper').width($(window).width() - 20);
////						var newWidth = Math.round($('#calendar_holder_td').width() - $('#contentWrapper').width() + $(window).width() - 40) ;
//						var newWidth = Math.round($('#calendar_holder_td').width() - 20) ;
//						console.log(newWidth , $('#calendar_holder_td').width(), $('#contentWrapper').width(), $(window).width());
						currentView.setWidth(newWidth);
//						console.log('from window.resize ' + newWidth);

						ignoreWindowResize++; // in case the windowResize callback changes the height
						updateSize();
						currentView.trigger('windowResize', _element);
						ignoreWindowResize--;
					}
				}, 500);
				
			}else{
				// calendar must have been initialized in a 0x0 iframe that has just been resized
				lateRender();
			}
		}
	}
	
	
	
	/* Event Fetching/Rendering
	-----------------------------------------------------------------------------*/
	
	
	// fetches events if necessary, rerenders events if necessary (or if forced)
	function updateEvents(forceRender) {
		if (forceRender === 'refresh' || !options.lazyFetching || isFetchNeeded(currentView.visStart, currentView.visEnd)) {
			refetchEvents();
		}
		else if (forceRender) {
			rerenderEvents();
		}
	}
	
	
	function refetchEvents() {
		fetchEvents(currentView.visStart, currentView.visEnd); // will call reportEvents
	}
	
	
	// called when event data arrives
	function reportEvents(_events) {
		events = _events;
		rerenderEvents();
	}
	
	
	// called when a single event's data has been changed
	function reportEventChange(eventID) {
		rerenderEvents(eventID);
	}
	
	// attempts to rerenderEvents
	function rerenderEvents(modifiedEventID) {
		$('#eventsCount').html(events.length);
		$('#loadTime').html(loadingTime($('#start_loading_events').html(), $('#end_loading_events').html())+' sec');
		markEventsDirty();
		if (elementVisible()) {
			currentView.clearEvents();
			currentView.renderEvents(events, modifiedEventID);
			currentView.eventsDirty = false;
		}
		
	}
	
	
	function markEventsDirty() {
		$.each(viewInstances, function(i, inst) {
			inst.eventsDirty = true;
		});
	}
	


	/* Selection
	-----------------------------------------------------------------------------*/
	

	function select(start, end, allDay) {
		currentView.select(start, end, allDay===undefined ? true : allDay);
	}
	

	function unselect() { // safe to be called before renderView
		if (currentView) {
			currentView.unselect();
		}
	}
	
	
	
	/* Date
	-----------------------------------------------------------------------------*/
	
	
	function prev() {
		renderView(-1);
	}
	
	
	function next() {
		renderView(1);
	}
	
	
	function prevYear() {
		addYears(date, -1);
		renderView();
	}
	
	
	function nextYear() {
		addYears(date, 1);
		renderView();
	}
	
	
	function today() {
		date = new Date();
		renderView();
	}
	
	
	function gotoDate(year, month, dateOfMonth) {
		if (year instanceof Date) {
			date = cloneDate(year); // provided 1 argument, a Date
		}else{
			setYMD(date, year, month, dateOfMonth);
		}
		renderView();
	}
	
	function setDate(dDate) {
		date = cloneDate(dDate);
	}
	
	function refresh() {
		currentView.reloadDirty = true;
		renderView();
	}
	/*function edit() 
	{
		// smth...
		renderView();
	}
	
	function year() 
	{
		// smth...
		renderView();
	}
	
	function list() 
	{
		// smth...
		renderView();
	}*/
	
	function incrementDate(years, months, days) {
		if (years !== undefined) {
			addYears(date, years);
		}
		if (months !== undefined) {
			addMonths(date, months);
		}
		if (days !== undefined) {
			addDays(date, days);
		}
		renderView();
	}
	
	
	function getDate() {
		return cloneDate(date);
	}
	
	
	
	/* Misc
	-----------------------------------------------------------------------------*/
	
	
	function getView() {
		return currentView;
	}
	
	
	function option(name, value) {
		if (value === undefined) {
			return options[name];
		}
		if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
			options[name] = value;
			updateSize();
		}
	}
	
	
	function trigger(name, thisObj) {
		if (options[name]) {
			return options[name].apply(
				thisObj || _element,
				Array.prototype.slice.call(arguments, 2)
			);
		}
	}
	
	
	
	/* External Dragging
	------------------------------------------------------------------------*/
	
	if (options.droppable) {
		$(document)
			.bind('dragstart', function(ev, ui) {
				var _e = ev.target;
				var e = $(_e);
				if (!e.parents('.fc').length) { // not already inside a calendar
					var accept = options.dropAccept;
					if ($.isFunction(accept) ? accept.call(_e, e) : e.is(accept)) {
						_dragElement = _e;
						currentView.dragStart(_dragElement, ev, ui);
					}
				}
			})
			.bind('dragstop', function(ev, ui) {
				if (_dragElement) {
					currentView.dragStop(_dragElement, ev, ui);
					_dragElement = null;
				}
			});
	}
	

}

function Header(calendar, options) {
	var t = this;
	
	
	// exports
	t.render = render;
	t.destroy = destroy;
	t.updateTitle = updateTitle;
	t.activateButton = activateButton;
	t.deactivateButton = deactivateButton;
	t.disableButton = disableButton;
	t.enableButton = enableButton;
	
	
	// locals
	var element = $([]);
	var tm;
	


	function render() {
		tm = options.theme ? 'ui' : 'fc';
		var sections = options.header;
		if (sections) {
			element = $("<table class='fc-header'/>")
				.append($("<tr/>")
					.append($("<td class='fc-header-left'/>")
						.append(renderSection(sections.left)))
					.append($("<td class='fc-header-center'/>")
						.append(renderSection(sections.center)))
					.append($("<td class='fc-header-right'/>")
						.append(renderSection(sections.right))));
			return element;
		}
	}
	
	
	function destroy() {
		element.remove();
	}
	
	
	function renderSection(buttonStr) {
		var aBtns = buttonStr.split(",");
		if (buttonStr) {
			var tr = $("<tr/>");
			if (aBtns.indexOf("edit") >= 0) {			
				var btn = $("<div title='My Calendars Display Settings' class='fc-button-edit ui-state-default'><a class='dlg_visible_open_lnk _lnk' ><span></span></a></div>");
				btn.addClass('ui-corner-left');
				btn.addClass('ui-no-right');
				btn.hover(
					function () {
						btn.addClass(tm + '-state-hover');
					},
					function () {
						btn.removeClass(tm + '-state-hover');
					}
				);
				btn.appendTo($("<td/>").appendTo(tr));
			}
			
			$.each(buttonStr.split(' '), function(i) {
				if (i > 0) {
					tr.append("<td><span class='fc-header-space'/></td>");
				}
				var prevButton;
				$.each(this.split(','), function(j, buttonName) {
					if (buttonName == 'title') {
						tr.append("<td><h2 class='fc-header-title'>&nbsp;</h2></td>");
						if (prevButton) {
							prevButton.addClass(tm + '-corner-right');
						}
						prevButton = null;
					}else{
						var buttonClick;
						if (calendar[buttonName]) {
							buttonClick = calendar[buttonName]; // calendar method
						}
						else if (fcViews[buttonName]) {
							buttonClick = function() {
								button.removeClass(tm + '-state-hover'); // forget why
								calendar.changeView(buttonName);
							};
						}
						if (buttonClick) {
							if (prevButton) {
								prevButton.addClass(tm + '-no-right');
							}
							var button;
							var icon = options.theme ? smartProperty(options.buttonIcons, buttonName) : null;
							var text = smartProperty(options.buttonText, buttonName);
							if (icon) {
								button = $("<div class='fc-button-" + buttonName + " ui-state-default'>" +
									"<a><span class='ui-icon ui-icon-" + icon + "'/></a></div>");
							}
							else if (text) {
								button = $("<div class='fc-button-" + buttonName + " " + tm + "-state-default'>" +
									"<a><span>" + text + "</span></a></div>");
							}
							if (button) {
								button
									.click(function() {
										if (!button.hasClass(tm + '-state-disabled')) {
											buttonClick();
										}
									})
									.mousedown(function() {
										button
											.not('.' + tm + '-state-active')
											.not('.' + tm + '-state-disabled')
											.addClass(tm + '-state-down');
									})
									.mouseup(function() {
										button.removeClass(tm + '-state-down');
									})
									.hover(
										function() {
											button
												.not('.' + tm + '-state-active')
												.not('.' + tm + '-state-disabled')
												.addClass(tm + '-state-hover');
										},
										function() {
											button
												.removeClass(tm + '-state-hover')
												.removeClass(tm + '-state-down');
										}
									)
									.appendTo($("<td/>").appendTo(tr));
								if (prevButton) {
									prevButton.addClass(tm + '-no-right');
								}else{
									if (buttonStr.substr(21,5) != 'month') {
										button.addClass(tm + '-corner-left');
									}
								}
								prevButton = button;
							}
						}
					}
				});

				if (prevButton) {
					prevButton.addClass(tm + '-corner-right');
				}
			});
			if (aBtns.indexOf("gantt") >= 0) {
				var btn = $("<div class='fc-button-gantt ui-state-default' style='padding:0px;height:23px;'><a style='display:block;height:23px;' href='/apex/GanttChart'><span style='line-height:23px;'>Gantt</span></a></div>");
				btn.addClass('ui-corner-left');
				btn.addClass('ui-no-right');
				btn.hover(
					function () {
						btn.addClass(tm + '-state-hover');
					},
					function () {
						btn.removeClass(tm + '-state-hover');
					}
				);
				btn.appendTo($("<td/>").appendTo(tr));
			}
			return $("<table/>").append(tr);
		}
	}
	
	
	function updateTitle(html) {
		element.find('h2.fc-header-title')
			.html(html);
	}
	
	
	function activateButton(buttonName) {
		element.find('div.fc-button-' + buttonName)
			.addClass(tm + '-state-active');
	}
	
	
	function deactivateButton(buttonName) {
		element.find('div.fc-button-' + buttonName)
			.removeClass(tm + '-state-active');
	}
	
	
	function disableButton(buttonName) {
		element.find('div.fc-button-' + buttonName)
			.addClass(tm + '-state-disabled');
	}
	
	
	function enableButton(buttonName) {
		element.find('div.fc-button-' + buttonName)
			.removeClass(tm + '-state-disabled');
	}


}

fc.sourceNormalizers = [];
fc.sourceFetchers = [];

var ajaxDefaults = {
	dataType: 'json',
	cache: false
};

var eventGUID = 1;

function EventManager(options, _sources) {
	var t = this;
	
	
	// exports
	t.isFetchNeeded = isFetchNeeded;
	t.fetchEvents = fetchEvents;
	t.addEventSource = addEventSource;
        t.updateEventSource = updateEventSource;
	t.removeEventSource = removeEventSource;
	t.updateEvent = updateEvent;
	t.renderEvent = renderEvent;
	t.removeEvents = removeEvents;
	t.clientEvents = clientEvents;
	t.normalizeEvent = normalizeEvent;
	
	
	// imports
	var trigger = t.trigger;
	var getView = t.getView;
	var reportEvents = t.reportEvents;
	
	
	// locals
        var stickySource = {
            events: []
        };
	var sources = [ stickySource ];
	var rangeStart, rangeEnd;
	var currentFetchID = 0;
	var pendingSourceCnt = 0;
	var loadingLevel = 0;
	var cache = [];
	
	for (var i=0; i<_sources.length; i++) {
		_addEventSource(_sources[i]);
	}
	
	/* Fetching
	-----------------------------------------------------------------------------*/
	
	
	function isFetchNeeded(start, end) {
		return !rangeStart || start < rangeStart || end > rangeEnd;
	}
	
	
	function fetchEvents(start, end) {
		rangeStart = start;
		rangeEnd = end;
		cache = [];
		var fetchID = ++currentFetchID;
		var len = sources.length;
		pendingSourceCnt = len;
		for (var i=0; i<len; i++) {
			fetchEventSource(sources[i], fetchID);
		}
	}
	
	
	function fetchEventSource(source, fetchID, cal_id) {
		// Calculate time of load events (D. Malenko)
		var d = new Date();
		$('#start_loading_events').html(d.getSeconds()+'.'+d.getMilliseconds());
		$('#last_loading_events').html('');
		$('#time-details-rows').html('');
		$('#lastEventsCount').html('');
		//****
		if (cal_id) {
			source.cal_id = cal_id;
		}
		_fetchEventSource(source, function(events) {
			if (fetchID == currentFetchID) {
				if (events) {
					if (events.length >= ($.browser.mozilla ? 1600 : 2600)) {
						var msg = '<b style="color:#ccf">'+events[0].objectName+'</b> object contains over the maximum number of viewable entries (' + ($.browser.mozilla ? 1600 : 2600) + '). Only the first ' + ($.browser.mozilla ? 1600 : 2600) + ' records have been displayed. Please add a <a href="/apex/CalendarEditBtn?cid='+events[0].calendarid+'" style="color:yellow;">filter</a> to optimize CalendarAnything performance. For more information, please contact <a href="mailto:calendar@silverlinecrm.com" style="color:yellow;">Silverline support</a>.';
						showErrorMessage(msg);
						for (var i=0; i<events.length || i<($.browser.mozilla ? 1600 : 2600); i++) {
							events[i].source = source;
							normalizeEvent(events[i]);
						}
					} else {
						for (var i=0; i<events.length; i++) {
							events[i].source = source;
							normalizeEvent(events[i]);
						}
//                        } else {
//                            for (var i=0; i<events.length; i++) {
//                                events[i].source = source;
//                                normalizeEvent(events[i]);
//                            }
                                    }
                                    if (typeof(source.id) != 'undefined') {
                                        cache = $.grep(cache, function(el) {
                                            var bResult =  typeof(el.source.id) == 'undefined' || el.source.id != source.id ;
                                            return bResult ;
                                        });
                                    }
                                    cache = cache.concat(events);
                                }
				pendingSourceCnt--;
				if (!pendingSourceCnt) {
					reportEvents(cache);
				}
			}
			
			var QuickCreationIdEvent = $('#QuickCreationIdEvent').text();
			if (QuickCreationIdEvent == undefined || QuickCreationIdEvent == '') {
				return;
			}
			if (events != undefined && events != null && events.length > 0) {
				
				var eventsLength = events.length;
				var showMessage = false;
				$('#QuickCreationIdEvent').remove();
				
				for (var j=0; j < eventsLength; j++) {
					if (events[j].event_id == QuickCreationIdEvent || events[j].id == QuickCreationIdEvent) {
						showMessage = true; 
					}
				}
				if (showMessage == false && QuickCreationIdEvent != '' && $("#" + QuickCreationIdEvent + " span.checkbox_checked").length == 0) {
					showErrorMessage("Due to filter settings for this calendar, this record will not display once saved");
				}
			} else {
				if (QuickCreationIdEvent != '' && $("#" + QuickCreationIdEvent + " span.checkbox_checked").length == 0) {
					$('#QuickCreationIdEvent').remove();
					showErrorMessage("Due to filter settings for this calendar, this record will not display once saved");
				}
			}
		});
		
	}
	
	function _fetchEventSource(source, callback) {
		var i;
		var fetchers = fc.sourceFetchers;
		var res;
		for (i=0; i<fetchers.length; i++) {
			res = fetchers[i](source, rangeStart, rangeEnd, callback);
			if (res === true) {
				// the fetcher is in charge. made its own async request
				return;
			}
			else if (typeof res == 'object') {
				// the fetcher returned a new source. process it
				_fetchEventSource(res, callback);
				return;
			}
		}
		var events = source.events;
		if (events) {
			if ($.isFunction(events)) {
				pushLoading();
				events(cloneDate(rangeStart), cloneDate(rangeEnd), function(events) {
					callback(events);
					popLoading();
				});
			}
			else if ($.isArray(events)) {
				callback(events);
			}
			else {
				callback();
			}
		}else{
			var url = source.url;
			if (url) {
				var success = source.success;
				var error = source.error;
				var complete = source.complete;
				var data = $.extend({}, source.data || {});
				var startParam = firstDefined(source.startParam, options.startParam);
				var endParam = firstDefined(source.endParam, options.endParam);
				var regex = /theErrorPage(.+)theError(.+)Too many script statements/g;
				if (startParam) {
					data[startParam] = Math.round(+rangeStart / 1000);
				}
				if (endParam) {
					data[endParam] = Math.round(+rangeEnd / 1000);
				}
				if ($.browser.mozilla) {
					data['isMozilla'] = true;
				} else if ($.browser.webkit) {
					data['isWebkit'] = true;
				}
				pushLoading();
                    var ajaxParams = $.extend({}, ajaxDefaults, source, {
					data: data,
					success: function(events) {
						events = events || [];
						var res = applyAll(success, this, arguments);
						if ($.isArray(res)) {
							events = res;
						}
						callback(events);
					},
					error: function(err) {
						if (regex.test(err.responseText))
						{
							var arr_cid = url.match(/[&\?]+cid=([\w\d]+)/);
							var arr_gid = url.match(/[&\?]+cgid=([\w\d]+)/);

							var isGroup = (arr_gid != null && arr_gid.length == 2) ? true : false;
							if (isGroup)
							{
								var cid = arr_gid[1];
								var cookieString = 'Calendar_Group_Cookie_';
							}
							else
							{
								var cid = arr_cid[1];
								var cookieString = 'Calendar_Cookie_';
							}
							
							var cid = (isGroup) ? arr_gid[1] : arr_cid[1];
							if (cid != null)
							{
								var userId = $("#curUserId").text();
								var calStandard = calGroup = '';
								$(".checkbox_checked").each(function()
								{
									var cur_id = $(this).attr('id');
									if (cur_id != cid)
									{
										if (arr_gid != null && arr_gid.length == 2)
										{
											if (calGroup != '') calGroup += ',';
											calGroup += cur_id;
										}
										else
										{
											if (calStandard != '') calStandard += ',';
											calStandard += cur_id;
										}
									}
								});

								var expiresDate = new Date();
								expiresDate.setTime(expiresDate.getTime() + (1000 * 86400 * 365));
															
								if (isGroup)
								{
									var calIdSelectGroups = new Array();
									$("#groupsListHolder .checkbox_checked").each(function(i, el)
									{
										var calCurrentIdGroup = $(el).attr("id");
										var calCurrentAllGroups = $("#" + calCurrentIdGroup + "_title").attr("rel");
										var calCurrentGroups = calCurrentAllGroups.split(';');

										if (calCurrentGroups != '')
										{
											for (var i=0; i<calCurrentGroups.length; i++) 
											{
												var calCurId = calCurrentGroups[i];											
												if (calIdSelectGroups[calCurId] == undefined)
													calIdSelectGroups[calCurId] = 1; 
												else
													calIdSelectGroups[calCurId] += 1;
											}
										}
									});									
									
									var calAllGroups = $("#" + cid + "_title").attr("rel");
									var calGroups = calAllGroups.split(';');
                                        if (calGroups.length > 0) {
                                            for (var i=0; i<calGroups.length; i++) {
                                                if (calIdSelectGroups[calGroups[i]] == 1) {
												var el = $('#' + calGroups[i] + '_container');
                                                    $(el).find('.active-title, .active-box').show();
                                                    $(el).find('.inactive-title, .inactive-box').hide();
											}
										}
									}
								}
								
								$(".checkbox_checked[id='" + cid + "']").removeClass("checkbox_checked");
								wcookie(cookieString + userId, (isGroup) ? calGroup : calStandard, 
								{
									expires: expiresDate.toGMTString(),
									path: '/',
									domain: document.domain,
									secure: false
								});	
							}
							
							showErrorMessage('Error: Too many events on this layout. Use the filters please.');
						}
						applyAll(error, this, arguments);
						callback();
					},
					complete: function() {
						applyAll(complete, this, arguments);
						popLoading();
					}
                    });
                    $.ajax(ajaxParams);
			}else{
				callback();
			}
		}
	}
	
	function wcookie (name, value, options) {
		try {
			if (typeof value != 'undefined') { // name and value given, set cookie
				options = options || {};
				if (value === null) {
					value = '';
					options.expires = -1;
				}
				var expires = '';
				if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
					var date;
					if (typeof options.expires == 'number') {
						date = new Date();
						date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
					} else {
						date = options.expires;
					}
					expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
				}
				var path = options.path ? '; path=' + (options.path) : '';
				var domain = options.domain ? '; domain=' + (options.domain) : '';
				var secure = options.secure ? '; secure' : '';
				// ds ---- expiration date of cookies
				date = new Date();
				date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
				expires = '; expires=' + date.toUTCString();
				document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, '; secure'].join('');
				// ---- ds
			} else { // only name given, get cookie
				var cookieValue = '';
				if (document.cookie && document.cookie != '') {
					var cookies = document.cookie.split(',');
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
		} catch(err) {
			alert("wcookie: " + err); 
			return null;
		}
	}

	
	/* Sources
	-----------------------------------------------------------------------------*/
	
	
	// first event source is reserved for "sticky" events
	sources.unshift([]);
	

	function addEventSource(source, cal_id) {
		source = _addEventSource(source);
		if (source) {
			pendingSourceCnt++;
			fetchEventSource(source, currentFetchID, cal_id); // will eventually call reportEvents
		}
	}
	
	
	function _addEventSource(source) {
		if ($.isFunction(source) || $.isArray(source)) {
                source = {
                    events: source
                };
		}
		else if (typeof source == 'string') {
                source = {
                    url: source
                };
		}
		if (typeof source == 'object') {
			normalizeSource(source);
			sources.push(source);
			return source;
		}
	}
	

	function removeEventSource(source) {
		sources = $.grep(sources, function(src) {
			return !isSourcesEqual(src, source);
		});
		// remove all client events from that source
		cache = $.grep(cache, function(e) {
			return !isSourcesEqual(e.source, source);
		});
		reportEvents(cache);
	}
	
        function _removeEventByClass(sClassName) {
            cache = $.grep(cache, function(e) {
                return e.className != sClassName;
            });
            reportEvents(cache);
        }
	
	function updateEventSource(source) {
            if (source.id == undefined) {
                addEventSource(source.url);
                return;
            }
            var bFound = false;
            $.each(sources, function(idx, el) {
                if (el.id !== undefined && el.id == source.id) {
	
                    el.url = source.url;
                    if (typeof(source.remove) != "undefined") {
                        _removeEventByClass(source.remove);
                    } else {
                        pendingSourceCnt++;
                        fetchEventSource(el, currentFetchID); // will eventually call reportEvents
                    }
                    
                    bFound = true;
                    return false;
                }
            });
            if (!bFound && typeof(source.remove) == "undefined") {
                addEventSource(source);
            }
        }
        
        
	
	/* Manipulation
	-----------------------------------------------------------------------------*/
	
	
	function updateEvent(event) { // update an existing event
		var i, len = cache.length, e,
			defaultEventEnd = getView().defaultEventEnd, // getView???
			startDelta = event.start - event._start,
			endDelta = event.end ?
				(event.end - (event._end || defaultEventEnd(event))) // event._end would be null if event.end
				: 0;                                                      // was null and event was just resized
		for (i=0; i<len; i++) {
			e = cache[i];
			if (e._id == event._id && e != event) {
				e.start = new Date(+e.start + startDelta);
				if (event.end) {
					if (e.end) {
						e.end = new Date(+e.end + endDelta);
					}else{
						e.end = new Date(+defaultEventEnd(e) + endDelta);
					}
				}else{
					e.end = null;
				}
				e.title = event.title;
				e.url = event.url;
				e.allDay = event.allDay;
				e.className = event.className;
				e.editable = event.editable;
				e.color = event.color;
				e.backgroudColor = event.backgroudColor;
				e.borderColor = event.borderColor;
				e.textColor = event.textColor;
				normalizeEvent(e);
			}
		}
		normalizeEvent(event);
		reportEvents(cache);
	}
	
	
	function renderEvent(event, stick) {
		normalizeEvent(event);
		if (!event.source) {
			if (stick) {
				sources[0].push(event);
				event.source = sources[0];
			}
			cache.push(event);
		}
		reportEvents(cache);
	}
	
	
	function removeEvents(filter) {
		if (!filter) { // remove all
			cache = [];
			// clear all array sources
			for (var i=0; i<sources.length; i++) {
				if (typeof sources[i] == 'object') {
					sources[i] = [];
				}
			}
		}else{
			if (!$.isFunction(filter)) { // an event ID
				var id = filter + '';
				filter = function(e) {
					return e._id == id;
				};
			}
			cache = $.grep(cache, filter, true);
			// remove events from array sources
			for (var i=0; i<sources.length; i++) {
				if (typeof sources[i] == 'object') {
					sources[i] = $.grep(sources[i], filter, true);
					// TODO: event objects' sources will no longer be correct reference :(
				}
			}
		}
		reportEvents(cache);
	}
	
	
	function clientEvents(filter) {
		if ($.isFunction(filter)) {
			return $.grep(cache, filter);
		}
		else if (filter) { // an event ID
			filter += '';
			return $.grep(cache, function(e) {
				return e._id == filter;
			});
		}
		return cache; // else, return all
	}
	
	
	
	/* Loading State
	-----------------------------------------------------------------------------*/
	
	
	function pushLoading() {
		if (!loadingLevel++) {
			trigger('loading', null, true);
		}
	}
	
	
	function popLoading() {
		if (!--loadingLevel) {
			trigger('loading', null, false);
		}
	}
	
	
	
	/* Event Normalization
	-----------------------------------------------------------------------------*/
	
	function normalizeEvent(event) {
		event._id = event._id || (event.id === undefined ? '_fc' + eventGUID++ : event.id + '');
		if (event.date) {
			if (!event.start) {
				event.start = event.date;
			}
			delete event.date;
		}
		event._start = cloneDate(event.start = parseDate(event.start, options.ignoreTimezone));
		event.end = parseDate(event.end, options.ignoreTimezone);
		if (event.end && event.end <= event.start) {
			event.end = null;
		}
		event._end = event.end ? cloneDate(event.end) : null;
		if (event.allDay === undefined) {
			event.allDay = options.allDayDefault;
		}
		if (event.className) {
			if (typeof event.className == 'string') {
				event.className = event.className.split(/\s+/);
			}
		}else{
			event.className = [];
		}
		// TODO: if there is no start date, return false to indicate an invalid event
	}


	/* Utils
	------------------------------------------------------------------------------*/


	function normalizeSource(source) {
		if (source.className) {
			// TODO: repeat code, same code for event classNames
			if (typeof source.className == 'string') {
				source.className = source.className.split(/\s+/);
			}
		}else{
			source.className = [];
		}
		var normalizers = fc.sourceNormalizers;
		for (var i=0; i<normalizers.length; i++) {
			normalizers[i](source);
		}
	}


	function isSourcesEqual(source1, source2) {
		return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
	}


	function getSourcePrimitive(source) {
		return ((typeof source == 'object') ? (source.events || source.url) : '') || source;
	}


}


fc.addDays = addDays;
fc.cloneDate = cloneDate;
fc.parseDate = parseDate;
fc.parseISO8601 = parseISO8601;
fc.parseTime = parseTime;
fc.formatDate = formatDate;
fc.formatDates = formatDates;



/* Date Math
-----------------------------------------------------------------------------*/

var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	DAY_MS = 86400000,
	HOUR_MS = 3600000,
	MINUTE_MS = 60000;


function addYears(d, n, keepTime) {
	d.setFullYear(d.getFullYear() + n);
	if (!keepTime) {
		clearTime(d);
	}
	return d;
}


function addMonths(d, n, keepTime) { // prevents day overflow/underflow
	if (+d) { // prevent infinite looping on invalid dates
		var m = d.getMonth() + n,
			check = cloneDate(d);
		check.setDate(1);
		check.setMonth(m);
		d.setMonth(m);
		if (!keepTime) {
			clearTime(d);
		}
		while (d.getMonth() != check.getMonth()) {
			d.setDate(d.getDate() + (d < check ? 1 : -1));
		}
	}
	return d;
}


function addDays(d, n, keepTime) { // deals with daylight savings
	if (+d) {
		var dd = d.getDate() + n,
			check = cloneDate(d);
		check.setHours(9); // set to middle of day
		check.setDate(dd);
		d.setDate(dd);
		if (!keepTime) {
			clearTime(d);
		}
		fixDate(d, check);
	}
	return d;
}


function fixDate(d, check) { // force d to be on check's YMD, for daylight savings purposes
	if (+d) { // prevent infinite looping on invalid dates
		while (d.getDate() != check.getDate()) {
			d.setTime(+d + (d < check ? 1 : -1) * HOUR_MS);
		}
	}
}


function addMinutes(d, n) {
	d.setMinutes(d.getMinutes() + n);
	return d;
}


function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}


function cloneDate(d, dontKeepTime) {
	if (dontKeepTime) {
		return clearTime(new Date(+d));
	}
	return new Date(+d);
}


function zeroDate() { // returns a Date with time 00:00:00 and dateOfMonth=1
	var i=0, d;
	do {
		d = new Date(1970, i++, 1);
	} while (d.getHours()); // != 0
	return d;
}


function skipWeekend(date, inc, excl) {
	inc = inc || 1;
	while (!date.getDay() || (excl && date.getDay()==1 || !excl && date.getDay()==6)) {
		addDays(date, inc);
	}
	return date;
}


function dayDiff(d1, d2) { // d1 - d2
	return Math.round((cloneDate(d1, true) - cloneDate(d2, true)) / DAY_MS);
}


function setYMD(date, y, m, d) {
	if (y !== undefined && y != date.getFullYear()) {
		date.setDate(1);
		date.setMonth(0);
		date.setFullYear(y);
	}
	if (m !== undefined && m != date.getMonth()) {
		date.setDate(1);
		date.setMonth(m);
	}
	if (d !== undefined) {
		date.setDate(d);
	}
}



/* Date Parsing
-----------------------------------------------------------------------------*/


function parseDate(s, ignoreTimezone) { // ignoreTimezone defaults to true
	if (typeof s == 'object') { // already a Date object
		return s;
	}
	if (typeof s == 'number') { // a UNIX timestamp
		return new Date(s * 1000);
	}
	if (typeof s == 'string') {
		if (s.match(/^\d+(\.\d+)?$/)) { // a UNIX timestamp
			return new Date(parseFloat(s) * 1000);
		}
		if (ignoreTimezone === undefined) {
			ignoreTimezone = true;
		}
		return parseISO8601(s, ignoreTimezone) || (s ? new Date(s) : null);
	}
	// TODO: never return invalid dates (like from new Date(<string>)), return null instead
	return null;
}


function parseISO8601(s, ignoreTimezone) { // ignoreTimezone defaults to false
	// derived from http://delete.me.uk/2005/03/iso8601.html
	// TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
	var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2})(:?([0-9]{2}))?))?)?)?)?$/);
	if (!m) {
		return null;
	}
	var date = new Date(m[1], 0, 1);
	if (ignoreTimezone || !m[14]) {
		var check = new Date(m[1], 0, 1, 9, 0);
		if (m[3]) {
			date.setMonth(m[3] - 1);
			check.setMonth(m[3] - 1);
		}
		if (m[5]) {
			date.setDate(m[5]);
			check.setDate(m[5]);
		}
		fixDate(date, check);
		if (m[7]) {
			date.setHours(m[7]);
		}
		if (m[8]) {
			date.setMinutes(m[8]);
		}
		if (m[10]) {
			date.setSeconds(m[10]);
		}
		if (m[12]) {
			date.setMilliseconds(Number("0." + m[12]) * 1000);
		}
		fixDate(date, check);
	}else{
		date.setUTCFullYear(
			m[1],
			m[3] ? m[3] - 1 : 0,
			m[5] || 1
		);
		date.setUTCHours(
			m[7] || 0,
			m[8] || 0,
			m[10] || 0,
			m[12] ? Number("0." + m[12]) * 1000 : 0
		);
		var offset = Number(m[16]) * 60 + (m[18] ? Number(m[18]) : 0);
		offset *= m[15] == '-' ? 1 : -1;
		date = new Date(+date + (offset * 60 * 1000));
	}
	return date;
}


function parseTime(s) { // returns minutes since start of day
	if (typeof s == 'number') { // an hour
		return s * 60;
	}
	if (typeof s == 'object') { // a Date object
		return s.getHours() * 60 + s.getMinutes();
	}
	var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
	if (m) {
		var h = parseInt(m[1], 10);
		if (m[3]) {
			h %= 12;
			if (m[3].toLowerCase().charAt(0) == 'p') {
				h += 12;
			}
		}
		return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
	}
}



/* Date Formatting
-----------------------------------------------------------------------------*/
// TODO: use same function formatDate(date, [date2], format, [options])


function formatDate(date, format, options) {
	return formatDates(date, null, format, options);
}


function formatDates(date1, date2, format, options) {
	options = options || defaults;
	var date = date1,
		otherDate = date2,
		i, len = format.length, c,
		i2, formatter,
		res = '';
	for (i=0; i<len; i++) {
		c = format.charAt(i);
		if (c == "'") {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == "'") {
					if (date) {
						if (i2 == i+1) {
							res += "'";
						}else{
							res += format.substring(i+1, i2);
						}
						i = i2;
					}
					break;
				}
			}
		}
		else if (c == '(') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ')') {
					var subres = formatDate(date, format.substring(i+1, i2), options);
					if (parseInt(subres.replace(/\D/, ''), 10)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '[') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ']') {
					var subformat = format.substring(i+1, i2);
					var subres = formatDate(date, subformat, options);
					if (subres != formatDate(otherDate, subformat, options)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '{') {
			date = date2;
			otherDate = date1;
		}
		else if (c == '}') {
			date = date1;
			otherDate = date2;
		}
		else {
			for (i2=len; i2>i; i2--) {
				if (formatter = dateFormatters[format.substring(i, i2)]) {
					if (date) {
						res += formatter(date, options);
					}
					i = i2 - 1;
					break;
				}
			}
			if (i2 == i) {
				if (date) {
					res += c;
				}
			}
		}
	}
	return res;
};


var dateFormatters = {
	s	: function(d)	{ return d.getSeconds() },
	ss	: function(d)	{ return zeroPad(d.getSeconds()) },
	m	: function(d)	{ return d.getMinutes() },
	mm	: function(d)	{ return zeroPad(d.getMinutes()) },
	h	: function(d)	{ return d.getHours() % 12 || 12 },
	hh	: function(d)	{ return zeroPad(d.getHours() % 12 || 12) },
	H	: function(d)	{ return d.getHours() },
	HH	: function(d)	{ return zeroPad(d.getHours()) },
	d	: function(d)	{ return d.getDate() },
	dd	: function(d)	{ return zeroPad(d.getDate()) },
	ddd	: function(d,o)	{ return o.dayNamesShort[d.getDay()] },
	dddd: function(d,o)	{ return o.dayNames[d.getDay()] },
	M	: function(d)	{ return d.getMonth() + 1 },
	MM	: function(d)	{ return zeroPad(d.getMonth() + 1) },
	MMM	: function(d,o)	{ return o.monthNamesShort[d.getMonth()] },
	MMMM: function(d,o)	{ return o.monthNames[d.getMonth()] },
	yy	: function(d)	{ return (d.getFullYear()+'').substring(2) },
	yyyy: function(d)	{ return d.getFullYear() },
	t	: function(d)	{ return d.getHours() < 12 ? 'a' : 'p' },
	tt	: function(d)	{ return d.getHours() < 12 ? 'am' : 'pm' },
	T	: function(d)	{ return d.getHours() < 12 ? 'A' : 'P' },
	TT	: function(d)	{ return d.getHours() < 12 ? 'AM' : 'PM' },
	u	: function(d)	{ return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'") },
	S	: function(d)	{
		var date = d.getDate();
		if (date > 10 && date < 20) {
			return 'th';
		}
		return ['st', 'nd', 'rd'][date%10-1] || 'th';
	}
};



fc.applyAll = applyAll;


/* Event Date Math
-----------------------------------------------------------------------------*/


function exclEndDay(event) {
	if (event.end) {
		return _exclEndDay(event.end, event.allDay);
	}else{
		return addDays(cloneDate(event.start), 1);
	}
}


function _exclEndDay(end, allDay) {
	end = cloneDate(end);
	return allDay || end.getHours() || end.getMinutes() ? addDays(end, 1) : clearTime(end);
}


function segCmp(a, b) {
	return (b.msLength - a.msLength) * 100 + (a.event.start - b.event.start);
}


function segsCollide(seg1, seg2) {
	return seg1.end > seg2.start && seg1.start < seg2.end;
}



/* Event Sorting
-----------------------------------------------------------------------------*/


// event rendering utilities
function sliceSegs(events, visEventEnds, start, end) {
	var segs = [],
		i, len=events.length, event,
		eventStart, eventEnd,
		segStart, segEnd,
		isStart, isEnd;
	for (i=0; i<len; i++) {
		event = events[i];
		eventStart = event.start;
		eventEnd = visEventEnds[i];
		if (eventEnd > start && eventStart < end) {
			if (eventStart < start) {
				segStart = cloneDate(start);
				isStart = false;
			}else{
				segStart = eventStart;
				isStart = true;
			}
			if (eventEnd > end) {
				segEnd = cloneDate(end);
				isEnd = false;
			}else{
				segEnd = eventEnd;
				isEnd = true;
			}
			segs.push({
				event: event,
				start: segStart,
				end: segEnd,
				isStart: isStart,
				isEnd: isEnd,
				msLength: segEnd - segStart
			});
		}
	}
	return segs.sort(segCmp);
}


// event rendering calculation utilities
function stackSegs(segs) {
	var levels = [],
		i, len = segs.length, seg,
		j, collide, k;
	for (i=0; i<len; i++) {
		seg = segs[i];
		j = 0; // the level index where seg should belong
		while (true) {
			collide = false;
			if (levels[j]) {
				for (k=0; k<levels[j].length; k++) {
					if (segsCollide(levels[j][k], seg)) {
						collide = true;
						break;
					}
				}
			}
			if (collide) {
				j++;
			}else{
				break;
			}
		}
		if (levels[j]) {
			levels[j].push(seg);
		}else{
			levels[j] = [seg];
		}
	}
	return levels;
}



/* Event Element Binding
-----------------------------------------------------------------------------*/


function lazySegBind(container, segs, bindHandlers) {
	container.unbind('mouseover').mouseover(function(ev) {
		var parent=ev.target, e,
			i, seg;
		while (parent != this) {
			e = parent;
			parent = parent.parentNode;
		}
		if ((i = e._fci) !== undefined) {
			e._fci = undefined;
			seg = segs[i];
			bindHandlers(seg.event, seg.element, seg);
			$(ev.target).trigger(ev);
		}
		ev.stopPropagation();
	});
}



/* Element Dimensions
-----------------------------------------------------------------------------*/


function setOuterWidth(element, width, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.width(Math.max(0, width - hsides(e, includeMargins)));
	}
}


function setOuterHeight(element, height, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.height(Math.max(0, height - vsides(e, includeMargins)));
	}
}


// TODO: curCSS has been deprecated (jQuery 1.4.3 - 10/16/2010)


function hsides(element, includeMargins) {
	return hpadding(element) + hborders(element) + (includeMargins ? hmargins(element) : 0);
}


function hpadding(element) {
	return (parseFloat($.curCSS(element[0], 'paddingLeft', true)) || 0) +
	       (parseFloat($.curCSS(element[0], 'paddingRight', true)) || 0);
}


function hmargins(element) {
	return (parseFloat($.curCSS(element[0], 'marginLeft', true)) || 0) +
	       (parseFloat($.curCSS(element[0], 'marginRight', true)) || 0);
}


function hborders(element) {
	return (parseFloat($.curCSS(element[0], 'borderLeftWidth', true)) || 0) +
	       (parseFloat($.curCSS(element[0], 'borderRightWidth', true)) || 0);
}


function vsides(element, includeMargins) {
	return vpadding(element) +  vborders(element) + (includeMargins ? vmargins(element) : 0);
}


function vpadding(element) {
	return (parseFloat($.curCSS(element[0], 'paddingTop', true)) || 0) +
	       (parseFloat($.curCSS(element[0], 'paddingBottom', true)) || 0);
}


function vmargins(element) {
	return (parseFloat($.curCSS(element[0], 'marginTop', true)) || 0) +
	       (parseFloat($.curCSS(element[0], 'marginBottom', true)) || 0);
}


function vborders(element) {
	return (parseFloat($.curCSS(element[0], 'borderTopWidth', true)) || 0) +
	       (parseFloat($.curCSS(element[0], 'borderBottomWidth', true)) || 0);
}


function setMinHeight(element, height) {
	height = (typeof height == 'number' ? height + 'px' : height);
	element.each(function(i, _element) {
		_element.style.cssText += ';min-height:' + height + ';_height:' + height;
		// why can't we just use .css() ? i forget
	});
}



/* Misc Utils
-----------------------------------------------------------------------------*/


//TODO: arraySlice
//TODO: isFunction, grep ?


function noop() { }


function cmp(a, b) {
	return a - b;
}


function arrayMax(a) {
	return Math.max.apply(Math, a);
}


function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}


function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	if (obj[name] !== undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i=parts.length-1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res !== undefined) {
			return res;
		}
	}
	return obj[''];
}


function htmlEscape(s) {
	return s.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#039;')
		.replace(/"/g, '&quot;')
		.replace(/\n/g, '<br />');
}


function cssKey(_element) {
	return _element.id + '/' + _element.className + '/' + _element.style.cssText.replace(/(^|;)\s*(top|left|width|height)\s*:[^;]*/ig, '');
}


function disableTextSelection(element) {
	element
		.attr('unselectable', 'on')
		.css('MozUserSelect', 'none')
        .bind('selectstart.ui', function() {
            return false;
        });
}


/*
function enableTextSelection(element) {
	element
		.attr('unselectable', 'off')
		.css('MozUserSelect', '')
		.unbind('selectstart.ui');
}
*/


function markFirstLast(e) {
	e.children()
		.removeClass('fc-first fc-last')
		.filter(':first-child')
			.addClass('fc-first')
		.end()
		.filter(':last-child')
			.addClass('fc-last');
}


function setDayID(cell, date) {
	cell.each(function(i, _cell) {
		_cell.className = _cell.className.replace(/^fc-\w*/, 'fc-' + dayIDs[date.getDay()]);
		// TODO: make a way that doesn't rely on order of classes
	});
}


function getSkinCss(event, opt) {
	var source = event.source || {};
	var eventColor = event.color;
	var sourceColor = source.color;
	var optionColor = opt('eventColor');
	var backgroundColor =
		event.backgroundColor ||
		eventColor ||
		source.backgroundColor ||
		sourceColor ||
		opt('eventBackgroundColor') ||
		optionColor;
	var borderColor =
		event.borderColor ||
		eventColor ||
		source.borderColor ||
		sourceColor ||
		opt('eventBorderColor') ||
		optionColor;
	var textColor =
		event.textColor ||
		source.textColor ||
		opt('eventTextColor');
	var statements = [];
	if (backgroundColor) {
		statements.push('background-color:' + backgroundColor);
	}
	if (borderColor) {
		statements.push('border-color:' + borderColor);
	}
	if (textColor) {
		statements.push('color:' + textColor);
	}
	return statements.join(';');
}


function applyAll(functions, thisObj, args) {
	if ($.isFunction(functions)) {
		functions = [ functions ];
	}
	if (functions) {
		var i;
		var ret;
		for (i=0; i<functions.length; i++) {
			ret = functions[i].apply(thisObj, args) || ret;
		}
		return ret;
	}
}


function firstDefined() {
	for (var i=0; i<arguments.length; i++) {
		if (arguments[i] !== undefined) {
			return arguments[i];
		}
	}
}

fcViews.month = MonthView;

function MonthView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	BasicView.call(t, element, calendar, 'month');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDate = calendar.formatDate;
	
	
	
	function render(date, delta) {
		if (delta) {
			addMonths(date, delta);
			date.setDate(1);
		}
		var start = cloneDate(date, true);
		start.setDate(1);
		var end = addMonths(cloneDate(start), 1);
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var firstDay = opt('firstDay');
		var nwe = opt('weekends') ? 0 : 1;
		if (nwe) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
		addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
		var rowCnt = Math.round((visEnd - visStart) / (DAY_MS * 7));
		if (opt('weekMode') == 'fixed') {
			addDays(visEnd, (6 - rowCnt) * 7);
			rowCnt = 6;
		}
		
		//var today = clearTime(new Date());
		//t.title = formatDate(today, opt('titleFormat'));
		t.title = formatDate(date, opt('titleFormat'));
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderBasic(rowCnt, nwe ? 5 : 7, true);
	}
	
	
}

fcViews.basicWeek = BasicWeekView;

function BasicWeekView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	BasicView.call(t, element, calendar, 'basicWeek');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDates = calendar.formatDates;
	
	
	
	function render(date, delta) {
		if (delta) {
			addDays(date, delta * 7);
		}
		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var weekends = opt('weekends');
		if (!weekends) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderBasic(1, weekends ? 7 : 5, false);
	}
	
	
}

fcViews.basicDay = BasicDayView;

//TODO: when calendar's date starts out on a weekend, shouldn't happen


function BasicDayView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	BasicView.call(t, element, calendar, 'basicDay');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDate = calendar.formatDate;
	
	
	
	function render(date, delta) {
		if (delta) {
			addDays(date, delta);
			if (!opt('weekends')) {
				skipWeekend(date, delta < 0 ? -1 : 1);
			}
		}
		t.title = formatDate(date, opt('titleFormat'));
		t.start = t.visStart = cloneDate(date, true);
		t.end = t.visEnd = addDays(cloneDate(t.start), 1);
		renderBasic(1, 1, false);
	}
	
	
}

var tdHeightBug;

setDefaults({
	weekMode: 'fixed'
});


function BasicView(element, calendar, viewName) {
	var t = this;
	
	
	// exports
	t.renderBasic = renderBasic;
	t.setHeight = setHeight;
	t.setWidth = setWidth;
	t.renderDayOverlay = renderDayOverlay;
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	t.defaultEventEnd = defaultEventEnd;
        t.getHoverListener = function() {
            return hoverListener
        };
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.dayOfWeekCol = dayOfWeekCol;
	t.dateCell = dateCell;
	t.cellDate = cellDate;
        t.cellIsAllDay = function() {
            return true
        };
	t.allDayTR = allDayTR;
	t.allDayBounds = allDayBounds;
        t.getRowCnt = function() {
            return rowCnt
        };
        t.getColCnt = function() {
            return colCnt
        };
        t.getColWidth = function() {
            return colWidth
        };
        t.getDaySegmentContainer = function() {
            return daySegmentContainer
        };
	
	
	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	BasicEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var daySelectionMousedown = t.daySelectionMousedown;
	var formatDate = calendar.formatDate;
	
	
	// locals
	var rtl, dis, dit;
	var firstDay;
	var nwe;
	var rowCnt, colCnt;
	var colWidth;
	var viewWidth, viewHeight;
	var thead, tbody;
	var daySegmentContainer;
	var coordinateGrid;
	var hoverListener;
	var colContentPositions;
	
	
	
	/* Rendering
	------------------------------------------------------------*/
	
	
	disableTextSelection(element.addClass('fc-grid'));
	
	
	function renderBasic(r, c, showNumbers) {
	
		rowCnt = r;
		colCnt = c;
		rtl = opt('isRTL');
		if (rtl) {
			dis = -1;
			dit = colCnt - 1;
            } else {
			dis = 1;
			dit = 0;
		}
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		
		var tm = opt('theme') ? 'ui' : 'fc';
		var colFormat = opt('columnFormat');
		var month = t.start.getMonth();
		var today = clearTime(new Date());
		var s, i, j, d = cloneDate(t.visStart);
		
		if (!tbody) { // first time, build all cells from scratch
		
			var table = $("<table/>").appendTo(element);
			
			s = "<thead><tr>";
			for (i=0; i<colCnt; i++) {
                    s += "<th class='fc-" 
                        + dayIDs[d.getDay()] + ' ' // needs to be first
                        + tm + '-state-default' 
                        + (i==dit ? ' fc-leftmost' : '') 
                        + "'>" + formatDate(d, colFormat) 
                        + "</th>";
				addDays(d, 1);
				if (nwe) {
					skipWeekend(d);
				}
			}
			thead = $(s + "</tr></thead>").appendTo(table);
			
			s = "<tbody>";
			d = cloneDate(t.visStart);
			for (i=0; i<rowCnt; i++) {
				s += "<tr class='fc-week" + i + "'>";
				for (j=0; j<colCnt; j++) {
                        var date_day = (d.getDate() == 1) ? (formatDate(d, opt('monthFormat')) + " " + d.getDate()) : d.getDate();
                        s += "<td class='fc-" 
                            + dayIDs[d.getDay()] + ' ' // needs to be first
                            + tm + '-state-default fc-day' + (i*colCnt+j) 
                            + (j==dit ? ' fc-leftmost' : '') 
                            + (rowCnt>1 && d.getMonth() != month ? ' fc-other-month' : '') 
                            + (+d == +today 
                                ? ' fc-today '+tm+'-state-highlight-cell' 
                                : ' fc-not-today') 
                            + "'>" 
                            + "" // + (showNumbers ? "<div class='fc-day-number'>" + d.getDate() + "</div>" : '') +
                            + (showNumbers 
                                ? "<div class='fc-day-number'>&nbsp;<a id='" 
                                    + d.getFullYear() + "_" 
                                    + d.getMonth() + "_" 
                                    + d.getDate() 
                                    + "' class='_lnk day-number-link' title='Go to " 
                                    + (d.getMonth()+1) + "-" + d.getDate() + '-' + d.getFullYear() + "' >" 
                                    + date_day + "</a></div>" 
                                : '') 
                            + "<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div></td>";
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				}
				s += "</tr>";
			}
			tbody = $(s + "</tbody>").appendTo(table);
			dayBind(tbody.find('td'));
			jQuery(".day-number-link").mousedown(function(evt){
				stopBubble(evt);
				var elem = this;
				var dateStr = $(elem).attr('id');
				var dateArray = dateStr.split('_');
				calendar.gotoDate(dateArray[0],dateArray[1],dateArray[2]);
				calendar.changeView('agendaDay');
            });
			daySegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0;' class='_CA-fc-view-area' />").appendTo(element);
            } else { // NOT first time, reuse as many cells as possible
		
			clearEvents();
		
			var prevRowCnt = tbody.find('tr').length;
			if (rowCnt < prevRowCnt) {
				tbody.find('tr:gt(' + (rowCnt-1) + ')').remove(); // remove extra rows
			}
			else if (rowCnt > prevRowCnt) { // needs to create new rows...
				s = '';
				for (i=prevRowCnt; i<rowCnt; i++) {
					s += "<tr class='fc-week" + i + "'>";
					for (j=0; j<colCnt; j++) {
                            s += "<td class='fc-" 
                                + dayIDs[d.getDay()] + ' ' // needs to be first
                                + tm + '-state-default fc-new fc-day' + (i*colCnt+j) 
                                + (j==dit ? ' fc-leftmost' : '') + "'>" 
                                + (showNumbers 
                                    ? "<div class='fc-day-number'>&nbsp;<a id='" 
                                        + d.getFullYear() + "_" 
                                        + d.getMonth() + "_" 
                                        + d.getDate() 
                                        + "' class='_lnk day-number-link' title='Go to " 
                                        + (d.getMonth()+1) + "-" + d.getDate() + '-' + d.getFullYear() + "' >" 
                                        + date_day + "</a></div>" 
                                    : '') 
                                + "<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div>" 
                                + "</td>";
						addDays(d, 1);
						if (nwe) {
							skipWeekend(d);
						}
					}
					s += "</tr>";
				}
				tbody.append(s);
			}
			dayBind(tbody.find('td.fc-new').removeClass('fc-new'));
			
			// re-label and re-class existing cells
			d = cloneDate(t.visStart);
			tbody.find('td').each(function() {
				var td = $(this);
				if (rowCnt > 1) {
					if (d.getMonth() == month) {
						td.removeClass('fc-other-month');
					}else{
						td.addClass('fc-other-month');
					}
				}
				if (+d == +today) {
					td.removeClass('fc-not-today')
						.addClass('fc-today')
						.addClass(tm + '-state-highlight-cell');
				}else{
					td.addClass('fc-not-today')
						.removeClass('fc-today')
						.removeClass(tm + '-state-highlight-cell');
				}
                    td.find('div.fc-day-number > a')
                        .text(d.getDate())
                        .attr('id', + d.getFullYear() + "_" + d.getMonth() + "_"  + d.getDate() )
                        .attr('title', "Go to " + (d.getMonth() + 1) + "-" + d.getDate() + '-' + d.getFullYear());
                        
				addDays(d, 1);
				if (nwe) {
					skipWeekend(d);
				}
			});
			
			if (rowCnt == 1) { // more changes likely (week or day view)
			
				// redo column header text and class
				d = cloneDate(t.visStart);
				thead.find('th').each(function(i, th) {
					$(th).text(formatDate(d, colFormat));
					th.className = th.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
				
				// redo cell day-of-weeks
				d = cloneDate(t.visStart);
				tbody.find('td').each(function(i, td) {
					td.className = td.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
				
			}
		
		}
		
	}
	
	
	function setHeight(height) {
		viewHeight = height;
		var leftTDs = tbody.find('tr td:first-child'),
			tbodyHeight = viewHeight - thead.height(),
			rowHeight1, rowHeight2;
		if (opt('weekMode') == 'variable') {
			rowHeight1 = rowHeight2 = Math.floor(tbodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight1 = Math.floor(tbodyHeight / rowCnt);
			rowHeight2 = tbodyHeight - rowHeight1*(rowCnt-1);
		}
		if (tdHeightBug === undefined) {
			// bug in firefox where cell height includes padding
			var tr = tbody.find('tr:first'),
				td = tr.find('td:first');
			td.height(rowHeight1);
			tdHeightBug = rowHeight1 != td.height();
		}
		if (tdHeightBug) {
			leftTDs.slice(0, -1).height(rowHeight1);
			leftTDs.slice(-1).height(rowHeight2);
		}else{
			setOuterHeight(leftTDs.slice(0, -1), rowHeight1);
			setOuterHeight(leftTDs.slice(-1), rowHeight2);
		}
	}
	
	
	function setWidth(width) {
		viewWidth = width;
		colContentPositions.clear();
		colWidth = Math.floor(viewWidth / colCnt);
		setOuterWidth(thead.find('th').slice(0, -1), colWidth);
		if (colCnt == 7) {
			setOuterWidth(thead.find('th:last-child'), viewWidth - colWidth * 6);
		}
	}
	
	
	
	/* Day clicking and binding
	-----------------------------------------------------------*/
	
	
	function dayBind(days) {
		days.click(dayClick)
			.mousedown(daySelectionMousedown);
	}
	
	
	function dayClick(ev) {
		if (!opt('selectable')) { // SelectionManager will worry about dayClick
			var n = parseInt(this.className.match(/fc\-day(\d+)/)[1]),
				date = addDays(
					cloneDate(t.visStart),
					Math.floor(n/colCnt) * 7 + n % colCnt
				);
			// TODO: what about weekends in middle of week?
			trigger('dayClick', this, date, true, ev);
		}
	}
	
	
//	function dayAdditionalBind(eventPanel) {
//		eventPanel.on('click', 'div:not(.fc-event)', function(){
//			console.log($(this));
//		});
////		days.click(dayClick)
////			.mousedown(daySelectionMousedown);
//	}
	/* Semi-transparent Overlay Helpers
	------------------------------------------------------*/
	
	
	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive
		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}
		var rowStart = cloneDate(t.visStart);
		var rowEnd = addDays(cloneDate(rowStart), colCnt);
		for (var i=0; i<rowCnt; i++) {
			var stretchStart = new Date(Math.max(rowStart, overlayStart));
			var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));
			if (stretchStart < stretchEnd) {
				var colStart, colEnd;
				if (rtl) {
					colStart = dayDiff(stretchEnd, rowStart)*dis+dit+1;
					colEnd = dayDiff(stretchStart, rowStart)*dis+dit+1;
				}else{
					colStart = dayDiff(stretchStart, rowStart);
					colEnd = dayDiff(stretchEnd, rowStart);
				}
				dayBind(
					renderCellOverlay(i, colStart, i, colEnd-1)
				);
			}
			addDays(rowStart, 7);
			addDays(rowEnd, 7);
		}
	}
	
	
	function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
		var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
		return renderOverlay(rect, element);
	}
	
	
	
	/* Selection
	-----------------------------------------------------------------------*/
	
	
	function defaultSelectionEnd(startDate, allDay) {
		return cloneDate(startDate);
	}
	
	
	function renderSelection(startDate, endDate, allDay) {
		renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
	}
	
	
	function clearSelection() {
		clearOverlays();
	}
	
	
	
	/* External Dragging
	-----------------------------------------------------------------------*/
	
	
	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
			}
		}, ev);
	}
	
	
	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			var d = cellDate(cell);
			trigger('drop', _dragElement, d, true, ev, ui);
		}
	}
	
	
	
	/* Utilities
	--------------------------------------------------------*/
	
	
	function defaultEventEnd(event) {
		return cloneDate(event.start);
	}
	
	
	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		var tds = tbody.find('tr:first td');
		if (rtl) {
			tds = $(tds.get().reverse());
		}
		tds.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		tbody.find('tr').each(function(i, _e) {
			e = $(_e);
			n = e.offset().top;
			if (i) {
				p[1] = n;
			}
			p = [n];
			rows[i] = p;
		});
		p[1] = n + e.outerHeight();
	});
	
	
	hoverListener = new HoverListener(coordinateGrid);
	
	
	colContentPositions = new HorizontalPositionCache(function(col) {
		return tbody.find('td:eq(' + col + ') div div');
	});
	
	
	function colContentLeft(col) {
		return colContentPositions.left(col);
	}
	
	
	function colContentRight(col) {
		return colContentPositions.right(col);
	}
	
	
	function dayOfWeekCol(dayOfWeek) {
		var res = (dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt;
		if (isNaN(res)) {
			res = 0;
		}
		return res;
	}
	
	
	function dateCell(date) {
		return {
			row: Math.floor(dayDiff(date, t.visStart) / 7),
			col: dayOfWeekCol(date.getDay())*dis + dit
		};
	}
	
	
	function cellDate(cell) {
		return addDays(cloneDate(t.visStart), cell.row*7 + cell.col*dis+dit);
		// TODO: what about weekends in middle of week?
	}
	
	
	function allDayTR(i) {
		return tbody.find('tr:eq('+i+')');
	}
	
	
	function allDayBounds(i) {
		return {
			left: 0,
			right: viewWidth
		};
	}
	
	
}

function BasicEventRenderer() {
	var t = this;
	
	
	// exports
	t.renderEvents = renderEvents;
	t.compileDaySegs = compileSegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.bindDaySeg = bindDaySeg;
	
	
	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var eventElementHandlers = t.eventElementHandlers;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getHoverListener = t.getHoverListener;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var renderDaySegs = t.renderDaySegs;
	var resizableDayEvent = t.resizableDayEvent;
	
	
	
	/* Rendering
	--------------------------------------------------------------------*/
	
	
	function renderEvents(events, modifiedEventId) {
		reportEvents(events);
		renderDaySegs(compileSegs(events), modifiedEventId);
	}
	
	
	function clearEvents() {
		reportEventClear();
		getDaySegmentContainer().empty();
	}
	
	
	/*function compileSegs(events) {
		var rowCnt = getRowCnt(),
			colCnt = getColCnt(),
			d1 = cloneDate(t.visStart),
			d2 = addDays(cloneDate(d1), colCnt),
			visEventsEnds = $.map(events, exclEndDay),
			i, row,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<rowCnt; i++) {
			row = stackSegs(sliceSegs(events, visEventsEnds, d1, d2));
			for (j=0; j<row.length; j++) {
				level = row[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.row = i;
					seg.level = j; // not needed anymore
					segs.push(seg);
				}
			}
			addDays(d1, 7);
			addDays(d2, 7);
		}
		return segs;
	}*/
	
//----MORE HUCK FUNCTION SECTION(compileSegs replaced
	function compileSegs(events) {
                var moreSegs = {};
		var	rowCnt = getRowCnt(), 
		colCnt = getColCnt(),
		d1 = cloneDate(t.visStart),
		d2 = addDays(cloneDate(d1), colCnt),
		//visEventsEnds = $.map(events, visEventEnd),
		visEventsEnds = $.map(events, exclEndDay),
		more = t.calendar.options.more,
		i, row,
		j, level,
		k, seg, moreSeg,
		segs = [];

		var Day0 = t.allDayTR(1).find('td:first'),
		firstDivOfDay0 = t.allDayTR(1).find('td:first div.fc-day-number'),
		divDayContent = t.allDayTR(1).find('td:first div.fc-day-content');
        var nLimitAddon = 1 + parseInt(Day0.height() / 150);
        more = Math.floor((Day0.height() - 2 * (firstDivOfDay0.height() + nLimitAddon)) / (divDayContent.height() + nLimitAddon)) - ($.browser.msie && $.browser.version == '9.0' ? 1 : 0);
		
		//more = Math.floor((Day0.height()-2*(firstDivOfDay0.height()+1))/divDayContent.height()) - ((($.browser.msie && $.browser.version == '9.0') || $.browser.safari == true) ? 1 : 0);	
		
		for (i=0; i<rowCnt; i++) {
			row = stackSegs(sliceSegs(events, visEventsEnds, d1, d2));
                for (j = 0; j < row.length; j++) {
				level = row[j];
                    for (k = 0; k < level.length; k++) {
					seg = level[k];
					seg.row = i;
					seg.level = j;
					
					moreSeg = seg;
					moreSeg.isHidden = true;
					//moreSegs.push(seg);
					var divideSegs = divideWeekByDay(moreSeg);
					segs = segs.concat(divideSegs);
					
			          if (!(seg.level >= more))
			          {
			            seg.isHidden = false;
			            segs.push(seg);
			          }
			          /*else
			          {
			            seg.isHidden = true;
			            var divideSegs = divideWeekByDay(seg);
			            segs = segs.concat(divideSegs);
			          }*/
        		}
			}
			addDays(d1, 7);
			addDays(d2, 7);
		}
		
            for (i = 0; i < segs.length; i++) {
		  var seg = segs[i];
		  var dateTime = seg.start.toDateString();
		  if (seg.level >= more) {
			if (moreSegs[dateTime] == undefined)	{
                        moreSegs[dateTime]= {
                            cnt: 1, 
                            row : seg.row
                        };
			}
			else	{
			  moreSegs[dateTime]['cnt']++;
			}
		  }
		}
                jQuery.each(moreSegs, function (idx, el) {
                    var seg = {
                        start : new Date(idx),
                        isStart : true,
                        isMore : true,
                        isEnd : true,
                        msLength : DAY_MS,
                        end : addDays(new Date(idx), 1),
                        event : {
                            title : '+ ' + el['cnt'] + ' more', 
                            className: ['more']
                        },
                        title : '+ ' + el['cnt'] + ' more',
                        row : el['row'],
                        level : more + 1
                    }
                    segs.push(seg);
                });
		var newSegs = segs;
		
		newSegs.sort(segCmpMore);
	return segs;
	}
	
	function divideWeekByDay(seg)
	{
	    var result = new Array();
	    var newStartDate = cloneDate(getOnlyDate(seg.start));
	    if (compareDates(newStartDate, addDays(cloneDate(getOnlyDate(seg.end)), -1)))
	    {
	        updateSegDates(seg, result, newStartDate);
	    }
	    else
	    {
	      var newEndDate = cloneDate(getOnlyDate(seg.end));
	      do {
	        var newStartDate = updateSegDates(seg, result, newStartDate);
	      }      
	      while (newStartDate < newEndDate);
	    }
	    return result;
	}
	
	function compareDates(date1, date2)
    {
    	return ((date1.getFullYear() == date2.getFullYear()) && (date1.getMonth() == date2.getMonth()) && (date1.getDate() == date2.getDate()) );
    }
	
    function clone(obj)
    { 
      var clone = {};
      clone.prototype = obj.prototype;
      for (property in obj) clone[property] = obj[property];
      return clone;
    }
	
	function updateSegDates(seg, result, newStartDate)
	{
	    var newSeg = clone(seg);
		if(seg.isStart && compareDates(seg.start,newStartDate))
	    	newSeg.hasOlder = false;
		else
			newSeg.hasOlder = true;
			
	    if(seg.isEnd && compareDates(seg.end,addDays(cloneDate(getOnlyDate(newStartDate)), 1)))
	    	newSeg.hasNewer = false;
		else
			newSeg.hasNewer = true;

		newSeg.isStart = true;
		newSeg.isEnd = true;
	    newSeg.start = cloneDate(newStartDate);
	    addDays(newStartDate, 1);
	    newSeg.end = cloneDate(newStartDate);
	    result.push(newSeg);    
	    return newStartDate;
	}
	
	function getOnlyDate(dateTime)
	{
	    var year = dateTime.getFullYear();
	    var month = dateTime.getMonth();
	    var day = dateTime.getDate();
	    return new Date(year, month, day);
	}
	
	function segCmpMore(a, b) {
	    if (b.row == a.row)	{
	      return a.level - b.level;
	    }
	    else {
	      return a.row - b.row;
	    }
    }
	
//--- end of MORE HUCK FUNCTION
	
	function bindDaySeg(event, eventElement, seg) {
		eventElementHandlers(event, eventElement);
		if (event.editable || event.editable === undefined && opt('editable')) {
			draggableDayEvent(event, eventElement);
			if (seg.isEnd) {
				resizableDayEvent(event, eventElement, seg);
			}
		}
	}
	
	 
	
	/* Dragging
	----------------------------------------------------------------------------*/
	
	
	function draggableDayEvent(event, eventElement) {
		if (!opt('disableDragging') && eventElement.draggable) {
			var hoverListener = getHoverListener();
			var dayDelta;
			var container = getDaySegmentContainer();
			eventElement.draggable({
				zIndex: 9,
				opacity: 0.5,
				appendTo: container, 
				helper: 'clone',
				revertDuration: opt('dragRevertDuration'),
				start: function(ev, ui) {
					eventElement.toggleClass('ui-draggable-dragging');
					eventElement.css('opacity','0.2');
//					eventElement.find('a').css('visibility','hidden');
					trigger('eventDragStart', eventElement, event, ev, ui);
					hideEvents(event, eventElement);
					hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
						eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
						clearOverlays();
						if (cell) { 
							dayDelta = rowDelta*7 + colDelta * (opt('isRTL') ? -1 : 1);
							renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
						}else{
							dayDelta = 0;
						}
					}, ev, 'drag');
				},
				stop: function(ev, ui) {
					eventElement.toggleClass('ui-draggable-dragging');
					eventElement.css('opacity','1');
					eventElement.find('a').css('visibility','visible');
					hoverListener.stop();
					clearOverlays();
					trigger('eventDragStop', eventElement, event, ev, ui);
					if (dayDelta) {
						eventElement.find('a').removeAttr('href'); // prevents safari from visiting the link
						eventDrop(this, event, dayDelta, 0, event.allDay, ev, ui);
					}else{
						if ($.browser.msie) {
							eventElement.css('filter', ''); // clear IE opacity side-effects
						}
						showEvents(event, eventElement);
					}
				}
			});
		}
	}


}

fcViews.agendaWeek = AgendaWeekView;

function AgendaWeekView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	AgendaView.call(t, element, calendar, 'agendaWeek');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var formatDates = calendar.formatDates;
	
	
	
	function render(date, delta) {
		if (delta) {
			addDays(date, delta * 7);
		}
		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var weekends = opt('weekends');
		if (!weekends) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderAgenda(weekends ? 7 : 5);
	}
	

}

fcViews.agendaDay = AgendaDayView;

function AgendaDayView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	AgendaView.call(t, element, calendar, 'agendaDay');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var formatDate = calendar.formatDate;
	
	
	
	function render(date, delta) {
		if (delta) {
			addDays(date, delta);
			if (!opt('weekends')) {
				skipWeekend(date, delta < 0 ? -1 : 1);
			}
		}
		var start = cloneDate(date, true);
		var end = addDays(cloneDate(start), 1);
		t.title = formatDate(date, opt('titleFormat'));
		t.start = t.visStart = start;
		t.end = t.visEnd = end;
		renderAgenda(1);
	}
	

}

setDefaults({
	allDaySlot: true,
	allDayText: 'all-day',
	firstHour: 6,
	slotMinutes: 30,
	defaultEventMinutes: 120,
	axisFormat: 'h(:mm)tt',
	timeFormat: {
		agenda: 'h:mm{ - h:mm}'
	},
	dragOpacity: {
		agenda: .5
	},
	minTime: 0,
	maxTime: 24
});


function AgendaView(element, calendar, viewName) {
	var t = this;
	
	
	// exports
	t.renderAgenda = renderAgenda;
	t.setWidth = setWidth;
	t.setHeight = setHeight;
	t.beforeHide = beforeHide;
	t.afterShow = afterShow;
	t.defaultEventEnd = defaultEventEnd;
	t.timePosition = timePosition;
	t.dayOfWeekCol = dayOfWeekCol;
	t.dateCell = dateCell;
	t.cellDate = cellDate;
	t.cellIsAllDay = cellIsAllDay;
	t.allDayTR = allDayTR;
	t.allDayBounds = allDayBounds;
        t.getHoverListener = function() {
            return hoverListener
        };
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
        t.getDaySegmentContainer = function() {
            return daySegmentContainer
        };
        t.getSlotSegmentContainer = function() {
            return slotSegmentContainer
        };
        t.getMinMinute = function() {
            return minMinute
        };
        t.getMaxMinute = function() {
            return maxMinute
        };
        t.getBodyContent = function() {
            return bodyContent
        };
        t.getRowCnt = function() {
            return 1
        };
        t.getColCnt = function() {
            return colCnt
        };
        t.getColWidth = function() {
            return colWidth
        };
        t.getSlotHeight = function() {
            return slotHeight
        };
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderDayOverlay = renderDayOverlay;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	
	
	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	AgendaEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var reportSelection = t.reportSelection;
	var unselect = t.unselect;
	var daySelectionMousedown = t.daySelectionMousedown;
	var slotSegHtml = t.slotSegHtml;
	var formatDate = calendar.formatDate;
	
	
	// locals
	var head, body, bodyContent, bodyTable, bg;
	var colCnt;
	var slotCnt=0; // spanning all the way across
	var axisWidth, colWidth, slotHeight; // TODO: what if slotHeight changes? (see issue 650)
	var viewWidth, viewHeight;
	var savedScrollTop;
	var tm, firstDay;
	var nwe;            // no weekends (int)
	var rtl, dis, dit;  // day index sign / translate
	var minMinute, maxMinute;
	var coordinateGrid;
	var hoverListener;
	var colContentPositions;
	var slotTopCache = {};
	var selectionHelper;
	var daySegmentContainer;
	var slotSegmentContainer;
	var slotTouchIPadContainer;
	

	
	/* Rendering
	-----------------------------------------------------------------------------*/
	
	
	disableTextSelection(element.addClass('fc-agenda'));
	
	
	function renderAgenda(c) {
	
		colCnt = c;
		
		// update option-derived variables
		tm = opt('theme') ? 'ui' : 'fc';
		nwe = opt('weekends') ? 0 : 1;
		firstDay = opt('firstDay');
		if (rtl = opt('isRTL')) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		minMinute = parseTime(opt('minTime'));
		maxMinute = parseTime(opt('maxTime'));
		
		var d0 = rtl ? addDays(cloneDate(t.visEnd), -1) : cloneDate(t.visStart),
			d = cloneDate(d0),
			today = clearTime(new Date()),
			colFormat = opt('columnFormat');
		
		if (!head) { // first time rendering, build from scratch
		
			var i,
				minutes,
				slotNormal = opt('slotMinutes') % 15 == 0, //...
			
			// head
                s = "<div class='fc-agenda-head' style='position:relative;z-index:4'>" 
                    + "<table style='width:100%'>" 
                    + "<tr class='fc-first" + (opt('allDaySlot') ? '' : ' fc-last') + "'>" 
                    + "<th class='fc-leftmost " 
                    + tm 
                    + "-state-default'>&nbsp;</th>";
			for (i=0; i<colCnt; i++) {
                    s += "<th class='fc-" 
                        + dayIDs[d.getDay()] + ' ' // needs to be first
                        + tm + "-state-default' "
                        + "data-date='" + d.getFullYear() + '_' + d.getMonth() + '_' + d.getDate() + "' " 
                        + "data-day='" + d.getDay() + "'>" 
                        + "<a class='_lnk week-header-link' "
                        + "id='" + d.getFullYear() + '_' + d.getMonth() + '_' + d.getDate() + "'>" 
                        + formatDate(d, colFormat) 
                        + "</a></th>";
                    
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			}
                s += "<th class='" 
                    + tm 
                    + "-state-default'>&nbsp;</th></tr>";
			if (opt('allDaySlot')) {
				s += "<tr class='fc-all-day'>" 
                        + "<th class='fc-axis fc-leftmost " 
                        + tm + "-state-default all-day-text'>" 
                        + opt('allDayText') 
                        + "</th>";
                    
                                for (var nI = 0; nI < colCnt; nI++) {
                                    s += "<td class='" + tm + "-state-default'>" 
                                        + "<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div></td>";
                                }

                                s += "<th class='" + tm + "-state-default'>&nbsp;</th>" 
                                    + "</tr><tr class='fc-divider fc-last'><th colspan='" + (colCnt+2) + "' class='" 
                                    + tm + "-state-default fc-leftmost'><div/></th></tr>";
				//s += "<tr><th></th><td colspan='"+(colCnt)+"' align='right'>All-day</td><td></td></tr>";
			}
			s+= "</table></div>";
			head = $(s).appendTo(element);
			dayBind(head.find('td'));
			
			jQuery(".week-header-link").click(function(evt){
				var elem = this;
				var dateStr = $(elem).attr('id');
				var dateArray = dateStr.split('_');
				calendar.gotoDate(dateArray[0],dateArray[1],dateArray[2]);
				calendar.changeView('agendaDay');
				stopBubble(evt);
            });
			
			// all-day event container
			daySegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0' class='_CA-fc-view-area'/>").appendTo(head);
			
			dayAdditionalBind(daySegmentContainer);
			
			// body
			d = zeroDate();
			var maxd = addMinutes(cloneDate(d), maxMinute);
			addMinutes(d, minMinute);
			s = "<table>";
			for (i=0; d < maxd; i++) {
				minutes = d.getMinutes();
                    s += "<tr class='" 
                        + (!i ? 'fc-first' : (!minutes ? '' : 'fc-minor')) 
                        + "'><th class='fc-axis fc-leftmost " + tm + "-state-default'>" 
                        + ((!slotNormal || !minutes) ? formatDate(d, opt('axisFormat')) : '&nbsp;') 
                        +  "</th><td class='fc-slot" + i + ' ' 
                        + tm 
                        + "-state-default'><div style='position:relative'>&nbsp;</div></td></tr>";
				addMinutes(d, opt('slotMinutes'));
				slotCnt++;
			}
			s += "</table>";
			body = $("<div class='fc-agenda-body' style='position:relative;z-index:2;overflow:auto'/>")
				.append(bodyContent = $("<div style='position:relative;overflow:hidden'>")
				.append(bodyTable = $(s)))
				.appendTo(element);
			slotBind(body.find('td'));
			
			// slot event container
            slotSegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0' class='_CA-fc-view-area'/>")
            	.appendTo(bodyContent);
            slotTouchIPadContainer = $("<div style='position:absolute;z-index:7;top:0px;left:0px;width:50px;bottom:0px;'/>")
            	.appendTo(bodyContent);
		    var hammer = new Hammer(slotTouchIPadContainer);
		    hammer.ondrag = function(ev) {
		        var top = 0;

		        // determine which direction we need to show the preview
		        if(ev.direction == 'down') {
		            top = 0 - ev.distance;
		        } else if(ev.direction == 'up') {
		            top = ev.distance;
		        }
		        body.scrollTop(slotTouchIPadContainer.data('top') + top);
		        
		    };
		    hammer.ondragstart = function(ev) {
		        // restore the margin
		    	slotTouchIPadContainer.data('top', body.scrollTop());
		    };    
 
			
            // event for ipad touch
//                slotTouchIPadContainer = $("<div style='position:absolute;z-index:7;top:0px;left:0px;width:50px;bottom:0px;'/>")
//                	.appendTo(bodyContent);
//                slotTouchIPadContainer.touchwipe({
//                	wipeUp: function() { body.scrollTop(body.scrollTop() - 20); },
//                	wipeDown: function() { body.scrollTop(body.scrollTop() + 20); },
//                    min_move_x: 5,
//                    min_move_y: 10,
//                    preventDefaultEvents: true
//               });
			
			// background stripes
			d = cloneDate(d0);
			s = "<div class='fc-agenda-bg' style='position:absolute;z-index:1'>" +
				"<table style='width:100%;height:100%'><tr class='fc-first'>";
			for (i=0; i<colCnt; i++) {
                    s += "<td class='fc-" 
                        + dayIDs[d.getDay()] + ' ' // needs to be first
                        + tm + '-state-default ' 
                        + (!i ? 'fc-leftmost ' : '') 
                        + (+d == +today ? tm + '-state-highlight-cell fc-today' : 'fc-not-today') 
                        + "'><div class='fc-day-content'><div>&nbsp;</div></div></td>";
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			}
			s += "</tr></table></div>";
			bg = $(s).appendTo(element);
			
            } else { // skeleton already built, just modify it
		
			clearEvents();
			
			// redo column header text and class
			head.find('tr:first th').slice(1, -1).each(function(i, th) {
				$(th).text(formatDate(d, colFormat));
				th.className = th.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			});
			
			// change classes of background stripes
			d = cloneDate(d0);
			bg.find('td').each(function(i, td) {
				td.className = td.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
				if (+d == +today) {
					$(td)
						.removeClass('fc-not-today')
						.addClass('fc-today')
						.addClass(tm + '-state-highlight-cell');
				}else{
					$(td)
						.addClass('fc-not-today')
						.removeClass('fc-today')
						.removeClass(tm + '-state-highlight-cell');
				}
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			});
		
		}
		
	}
	
	
	
	function setHeight(height, dateChanged) {
		if (height === undefined) {
			height = viewHeight;
		}
		
		viewHeight = height;
		slotTopCache = {};
		
		var bodyHeight = height - head.height();
		bodyHeight = Math.min(bodyHeight, bodyTable.height()); // shrink to fit table
		body.height(bodyHeight);
		
		slotHeight = body.find('tr:first div').height() + 1;
		
		if (dateChanged) {
			resetScroll();
		}
	}
	
	
	
	function setWidth(width) {
		viewWidth = width;
		colContentPositions.clear();
		
		body.width(width).css('overflow', 'auto');
		bodyTable.width('');
		
		var topTDs = head.find('tr:first th'),
			allDayLastTH = head.find('tr.fc-all-day th:last'),
			stripeTDs = bg.find('td'),
			clientWidth = body[0].clientWidth;
			
		bodyTable.width(clientWidth);
		clientWidth = body[0].clientWidth; // in ie6, sometimes previous clientWidth was wrongly reported
		bodyTable.width(clientWidth);
		
		// time-axis width
		axisWidth = 0;
		setOuterWidth(
			head.find('tr:lt(2) th:first').add(body.find('tr:first th'))
				.width(1)
				.each(function() {
					axisWidth = Math.max(axisWidth, $(this).outerWidth());
				}),
			axisWidth
		);
		
		// column width, except for last column
		colWidth = Math.floor((clientWidth - axisWidth) / colCnt);
		setOuterWidth(stripeTDs.slice(0, -1), colWidth);
		setOuterWidth(topTDs.slice(1, -2), colWidth);
		
		// column width for last column
//		if (width != clientWidth) { // has scrollbar
			//setOuterWidth(topTDs.slice(-2, -1), clientWidth - colWidth*(colCnt-1));
			setOuterWidth(topTDs.slice(-2, -1), clientWidth - axisWidth - colWidth*(colCnt-1));
			topTDs.slice(-1).show();
			//.width(width - clientWidth);
//			allDayLastTH.show().width(width - clientWidth);
//		}else{
//			body.css('overflow', 'hidden');
//			topTDs.slice(-2, -1).width('');
//			topTDs.slice(-1).hide();
//			allDayLastTH.hide();
//		}
		
		bg.css({
			top: head.find('tr').height(),
			left: axisWidth,
			width: clientWidth - axisWidth,
			//width: clientWidth ,
			height: viewHeight
		});
	}
	
	
	function resetScroll() {
		var d0 = zeroDate(),
			scrollDate = cloneDate(d0);
		scrollDate.setHours(opt('firstHour'));
		var top = timePosition(d0, scrollDate) + 1, // +1 for the border
			scroll = function() {
				body.scrollTop(top);
			};
		scroll();
		setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
	}
	
	
	function beforeHide() {
		savedScrollTop = body.scrollTop();
	}
	
	
	function afterShow() {
		body.scrollTop(savedScrollTop);
	}
	
	
	
	/* Slot/Day clicking and binding
	-----------------------------------------------------------------------*/
	

	function dayBind(tds) {
		tds.click(slotClick)
			.mousedown(daySelectionMousedown);
	}


	function slotBind(tds) {
		tds.click(slotClick)
			.mousedown(slotSelectionMousedown);
	}
	
	function dayAdditionalBind(eventPanel) {
		eventPanel
			.off('mousedown')
			.on('mousedown', function(evt){
				var el = jQuery(evt.target);
				if (el.parents('div.fc-event').size() < 1) {
					var tblRow = jQuery('.fc-agenda-head > table tr.fc-all-day');
					var nCellWidth = tblRow.children().eq(1).width(),
						nFirstCellWidth = tblRow.children().eq(0).width(),
						nCell = parseInt((evt.pageX  - el.offset().left - nFirstCellWidth) / nCellWidth);
					tblRow.children().eq(nCell + 1).trigger(evt);
				}
			});
	}	
	
	function slotClick(ev) {
		if (!opt('selectable')) { // SelectionManager will worry about dayClick
			var col = Math.min(colCnt-1, Math.floor((ev.pageX - bg.offset().left) / colWidth)),
				date = addDays(cloneDate(t.visStart), col*dis+dit),
				rowMatch = this.className.match(/fc-slot(\d+)/);
			if (rowMatch) {
				var mins = parseInt(rowMatch[1]) * opt('slotMinutes'),
					hours = Math.floor(mins/60);
				date.setHours(hours);
				date.setMinutes(mins%60 + minMinute);
				trigger('dayClick', this, date, false, ev);
			}else{
				trigger('dayClick', this, date, true, ev);
			}
		}
	}
	
	
	
	/* Semi-transparent Overlay Helpers
	-----------------------------------------------------*/
	

	function renderDayOverlay(startDate, endDate, refreshCoordinateGrid) { // endDate is exclusive
		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}
		var visStart = cloneDate(t.visStart);
		var startCol, endCol;
		if (rtl) {
			startCol = dayDiff(endDate, visStart)*dis+dit+1;
			endCol = dayDiff(startDate, visStart)*dis+dit+1;
		}else{
			startCol = dayDiff(startDate, visStart);
			endCol = dayDiff(endDate, visStart);
		}
		startCol = Math.max(0, startCol);
		endCol = Math.min(colCnt, endCol);
		if (startCol < endCol) {
			dayBind(
				renderCellOverlay(0, startCol, 0, endCol-1)
			);
		}
	}
	
	
	function renderCellOverlay(col0, row0, col1, row1) {
		var rect = coordinateGrid.rect(col0, row0, col1, row1, head);
		return renderOverlay(rect, head);
	}
	

	function renderSlotOverlay(overlayStart, overlayEnd) {
		var dayStart = cloneDate(t.visStart);
		var dayEnd = addDays(cloneDate(dayStart), 1);
		for (var i=0; i<colCnt; i++) {
			var stretchStart = new Date(Math.max(dayStart, overlayStart));
			var stretchEnd = new Date(Math.min(dayEnd, overlayEnd));
			if (stretchStart < stretchEnd) {
				var col = i*dis+dit;
				var rect = coordinateGrid.rect(0, col, 0, col, bodyContent); // only use it for horizontal coords
				var top = timePosition(dayStart, stretchStart);
				var bottom = timePosition(dayStart, stretchEnd);
				rect.top = top;
				rect.height = bottom - top;
				slotBind(
					renderOverlay(rect, bodyContent)
				);
			}
			addDays(dayStart, 1);
			addDays(dayEnd, 1);
		}
	}
	
	
	
	/* Coordinate Utilities
	-----------------------------------------------------------------------------*/
	
	
	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		bg.find('td').each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		if (opt('allDaySlot')) {
			e = head.find('td');
			n = e.offset().top;
			rows[0] = [n, n+e.outerHeight()];
		}
		var bodyContentTop = bodyContent.offset().top;
		var bodyTop = body.offset().top;
		var bodyBottom = bodyTop + body.outerHeight();
		function constrain(n) {
			return Math.max(bodyTop, Math.min(bodyBottom, n));
		}
		for (var i=0; i<slotCnt; i++) {
			rows.push([
				constrain(bodyContentTop + slotHeight*i),
				constrain(bodyContentTop + slotHeight*(i+1))
			]);
		}
	});
	
	
	hoverListener = new HoverListener(coordinateGrid);
	
	
	colContentPositions = new HorizontalPositionCache(function(col) {
		return bg.find('td:eq(' + col + ') div div');
	});
	
	
	function colContentLeft(col) {
		return axisWidth + colContentPositions.left(col);
	}
	
	
	function colContentRight(col) {
		return axisWidth + colContentPositions.right(col);
	}
	
	
	function dayOfWeekCol(dayOfWeek) {
		return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt)*dis+dit;
	}
	
	
	function dateCell(date) {
		return {
			row: Math.floor(dayDiff(date, t.visStart) / 7),
			col: dayOfWeekCol(date.getDay())
		};
	}
	
	
	// get the Y coordinate of the given time on the given day (both Date objects)
	function timePosition(day, time) { // both date objects. day holds 00:00 of current day
		day = cloneDate(day, true);
		if (time < addMinutes(cloneDate(day), minMinute)) {
			return 0;
		}
		if (time >= addMinutes(cloneDate(day), maxMinute)) {
			return bodyContent.height();
		}
		var slotMinutes = opt('slotMinutes'),
			minutes = time.getHours()*60 + time.getMinutes() - minMinute,
			slotI = Math.floor(minutes / slotMinutes),
			slotTop = slotTopCache[slotI];
		if (slotTop === undefined) {
			slotTop = slotTopCache[slotI] = body.find('tr:eq(' + slotI + ') td div')[0].offsetTop;
		}
		return Math.max(0, Math.round(
			slotTop - 1 + slotHeight * ((minutes % slotMinutes) / slotMinutes)
		));
	}
	
	
	function cellDate(cell) {
		var d = addDays(cloneDate(t.visStart), cell.col*dis+dit);
		var slotIndex = cell.row;
		if (opt('allDaySlot')) {
			slotIndex--;
		}
		if (slotIndex >= 0) {
			addMinutes(d, minMinute + slotIndex*opt('slotMinutes'));
		}
		return d;
	}
	
	
	function cellIsAllDay(cell) {
		return opt('allDaySlot') && !cell.row;
	}
	
	
	function allDayBounds() {
		return {
			left: axisWidth,
			right: viewWidth
		}
	}
	
	
	function allDayTR(index) {
		return head.find('tr.fc-all-day');
	}
	
	
	function defaultEventEnd(event) {
		var start = cloneDate(event.start);
		if (event.allDay) {
			return start;
		}
		return addMinutes(start, opt('defaultEventMinutes'));
	}
	
	
	
	/* Selection
	---------------------------------------------------------------------------------*/
	
	
	function defaultSelectionEnd(startDate, allDay) {
		if (allDay) {
			return cloneDate(startDate);
		}
		return addMinutes(cloneDate(startDate), opt('slotMinutes'));
	}
	
	
	function renderSelection(startDate, endDate, allDay) {
		if (allDay) {
			if (opt('allDaySlot')) {
				renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true);
			}
		}else{
			renderSlotSelection(startDate, endDate);
		}
	}
	
	
	function renderSlotSelection(startDate, endDate) {
		var helperOption = opt('selectHelper');
		coordinateGrid.build();
		if (helperOption) {
			var col = dayDiff(startDate, t.visStart) * dis + dit;
			if (col >= 0 && col < colCnt) { // only works when times are on same day
				var rect = coordinateGrid.rect(0, col, 0, col, bodyContent); // only for horizontal coords
				var top = timePosition(startDate, startDate);
				var bottom = timePosition(startDate, endDate);
				if (bottom > top) { // protect against selections that are entirely before or after visible range
					rect.top = top;
					rect.height = bottom - top;
					rect.left += 2;
					rect.width -= 5;
					if ($.isFunction(helperOption)) {
						var helperRes = helperOption(startDate, endDate);
						if (helperRes) {
							rect.position = 'absolute';
							rect.zIndex = 8;
							selectionHelper = $(helperRes)
								.css(rect)
								.appendTo(bodyContent);
						}
					}else{
						selectionHelper = $(slotSegHtml(
							{
								title: '',
								start: startDate,
								end: endDate,
								className: [],
								editable: false
							},
							rect,
							'fc-event fc-event-vert fc-corner-top fc-corner-bottom '
						));
						if ($.browser.msie) {
							selectionHelper.find('span.fc-event-bg').hide(); // nested opacities mess up in IE, just hide
						}
						selectionHelper.css('opacity', opt('dragOpacity'));
					}
					if (selectionHelper) {
						slotBind(selectionHelper);
						bodyContent.append(selectionHelper);
						setOuterWidth(selectionHelper, rect.width, true); // needs to be after appended
						setOuterHeight(selectionHelper, rect.height, true);
					}
				}
			}
		}else{
			renderSlotOverlay(startDate, endDate);
		}
	}
	
	
	function clearSelection() {
		clearOverlays();
		if (selectionHelper) {
			selectionHelper.remove();
			selectionHelper = null;
		}
	}
	
	
	function slotSelectionMousedown(ev) {
		if (ev.which == 1 && opt('selectable')) { // ev.which==1 means left mouse button
			unselect(ev);
			var _mousedownElement = this;
			var dates;
			hoverListener.start(function(cell, origCell) {
				clearSelection();
				if (cell && cell.col == origCell.col && !cellIsAllDay(cell)) {
					var d1 = cellDate(origCell);
					var d2 = cellDate(cell);
					dates = [
						d1,
						addMinutes(cloneDate(d1), opt('slotMinutes')),
						d2,
						addMinutes(cloneDate(d2), opt('slotMinutes'))
					].sort(cmp);
					renderSlotSelection(dates[0], dates[3]);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						trigger('dayClick', _mousedownElement, dates[0], false, ev);
						// BUG: _mousedownElement will sometimes be the overlay
					}
					reportSelection(dates[0], dates[3], false, ev);
				}
			});
		}
	}
	
	
	
	/* External Dragging
	--------------------------------------------------------------------------------*/
	
	
	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				if (cellIsAllDay(cell)) {
					renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
				}else{
					var d1 = cellDate(cell);
					var d2 = addMinutes(cloneDate(d1), opt('defaultEventMinutes'));
					renderSlotOverlay(d1, d2);
				}
			}
		}, ev);
	}
	
	
	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			trigger('drop', _dragElement, cellDate(cell), cellIsAllDay(cell), ev, ui);
		}
	}


}

function AgendaEventRenderer() {
	var t = this;
	
	
	// exports
	t.renderEvents = renderEvents;
	t.compileDaySegs = compileDaySegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.slotSegHtml = slotSegHtml;
	t.bindDaySeg = bindDaySeg;
	
	
	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var eventEnd = t.eventEnd;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var eventElementHandlers = t.eventElementHandlers;
	var setHeight = t.setHeight;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getSlotSegmentContainer = t.getSlotSegmentContainer;
	var getHoverListener = t.getHoverListener;
	var getMaxMinute = t.getMaxMinute;
	var getMinMinute = t.getMinMinute;
	var timePosition = t.timePosition;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var renderDaySegs = t.renderDaySegs;
	var resizableDayEvent = t.resizableDayEvent; // TODO: streamline binding architecture
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var getSlotHeight = t.getSlotHeight;
	var getBodyContent = t.getBodyContent;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var eventResize = t.eventResize;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;
	
	
	
	/* Rendering
	----------------------------------------------------------------------------*/
	

	function renderEvents(events, modifiedEventId) {
		reportEvents(events);
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}
		if (opt('allDaySlot')) {
			renderDaySegs(compileDaySegs(dayEvents), modifiedEventId);
			setHeight(); // no params means set to viewHeight
		}
		renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);
	}
	
	
	function clearEvents() {
		reportEventClear();
		getDaySegmentContainer().empty();
		getSlotSegmentContainer().empty();
	}
	
	
	function compileDaySegs(events) {
		var levels = stackSegs(sliceSegs(events, $.map(events, exclEndDay), t.visStart, t.visEnd)),
			i, levelCnt=levels.length, level,
			j, seg,
			segs=[];
		for (i=0; i<levelCnt; i++) {
			level = levels[i];
			for (j=0; j<level.length; j++) {
				seg = level[j];
				seg.row = 0;
				seg.level = i; // not needed anymore
				segs.push(seg);
			}
		}
		return segs;
	}
	
	
	function compileSlotSegs(events) {
		var colCnt = getColCnt(),
			minMinute = getMinMinute(),
			maxMinute = getMaxMinute(),
			d = addMinutes(cloneDate(t.visStart), minMinute),
			visEventEnds = $.map(events, slotEventEnd),
			i, col,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<colCnt; i++) {
			col = stackSegs(sliceSegs(events, visEventEnds, d, addMinutes(cloneDate(d), maxMinute-minMinute)));
			countForwardSegs(col);
			for (j=0; j<col.length; j++) {
				level = col[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.col = i;
					seg.level = j;
					segs.push(seg);
				}
			}
			addDays(d, 1, true);
		}
		return segs;
	}
	
	
	function slotEventEnd(event) {
		if (event.end) {
			return cloneDate(event.end);
		}else{
			return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
		}
	}
	
	
	// renders events in the 'time slots' at the bottom
	
	function renderSlotSegs(segs, modifiedEventId) {
	
		var i, segCnt=segs.length, seg,
			event,
			className,
			top, bottom,
			colI, levelI, forward,
			leftmost,
			availWidth,
			outerWidth,
			left,
			html='',
			eventElements,
			eventElement,
			triggerRes,
			vsideCache={},
			hsideCache={},
			key, val,
			titleSpan,
			height,
			slotSegmentContainer = getSlotSegmentContainer(),
			rtl, dis, dit,
			colCnt = getColCnt();
			
		if (rtl = opt('isRTL')) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
			
		// calculate position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			className = 'fc-event fc-event-vert ';
			if (seg.isStart) {
				className += 'fc-corner-top ';
			}
			if (seg.isEnd) {
				className += 'fc-corner-bottom ';
			}

			top = timePosition(seg.start, seg.start);
			bottom = timePosition(seg.start, seg.end);
			colI = seg.col;
			levelI = seg.level;
			forward = seg.forward || 0;
			leftmost = colContentLeft(colI*dis + dit);
			availWidth = colContentRight(colI*dis + dit) - leftmost;
			////////availWidth = Math.min(availWidth-6, availWidth*.95); // TODO: move this to CSS
			
			if (levelI) {
				// indented and thin
				outerWidth = availWidth / (levelI + forward + 1);
			}else{
				if (forward) {
					// moderately wide, aligned left still
					outerWidth = ((availWidth / (forward + 1)) - (12/2)) * 2; // 12 is the predicted width of resizer =
				}else{
					// can be entire width, aligned left
					outerWidth = availWidth;
				}
			}
			left = leftmost +                                  // leftmost possible
				(availWidth / (levelI + forward + 1) * levelI) // indentation
				* dis + (rtl ? availWidth - outerWidth : 0);   // rtl
			seg.top = top;
			seg.left = left;
			//seg.outerWidth = outerWidth;
			seg.outerWidth = outerWidth - (outerWidth * 20 / 100);
			seg.outerHeight = bottom - top;
			html += slotSegHtml(event, seg, className);
		}
		slotSegmentContainer[0].innerHTML = html; // faster than html()
		eventElements = slotSegmentContainer.children();
		
		// retrieve elements, run through eventRender callback, bind event handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			eventElement = $(eventElements[i]); // faster than eq()
			triggerRes = trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes)
						.css({
							position: 'absolute',
							top: seg.top,
							left: seg.left
						})
						.appendTo(slotSegmentContainer);
				}
				seg.element = eventElement;
				if (event._id === modifiedEventId) {
					bindSlotSeg(event, eventElement, seg);
				}else{
					eventElement[0]._fci = i; // for lazySegBind
				}
				reportEventElement(event, eventElement);
			}
		}
		
		lazySegBind(slotSegmentContainer, segs, bindSlotSeg);
		
		// record event sides and title positions
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				val = vsideCache[key = seg.key = cssKey(eventElement[0])];
				seg.vsides = val === undefined ? (vsideCache[key] = vsides(eventElement[0], true)) : val;
				val = hsideCache[key];
				seg.hsides = val === undefined ? (hsideCache[key] = hsides(eventElement[0], true)) : val;
				titleSpan = eventElement.find('span.fc-event-title');
				if (titleSpan.length) {
					seg.titleTop = titleSpan[0].offsetTop;
				}
			}
		}
		
		// set all positions/dimensions at once
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
				height = Math.max(0, seg.outerHeight - seg.vsides);
				eventElement[0].style.height = height + 'px';
				event = seg.event;
				if (seg.titleTop !== undefined && height - seg.titleTop < 10) {
					// not enough room for title, put it in the time header
					eventElement.find('span.fc-event-time')
						.text(formatDate(event.start, opt('timeFormat')) + ' - ' + event.title);
					eventElement.find('span.fc-event-title')
						.remove();
				}
				trigger('eventAfterRender', event, event, eventElement);
			}
		}
					
	}
	
	
	function slotSegHtml(event, seg, className) {
		return "<div "
			+ " class='" + className + event.className.join(' ') + "' "
			+ " style='position:absolute;z-index:8;top:" + seg.top + "px;left:" + seg.left + "px;border: 1px solid #fff !important;' "
			+ (event.color != undefined  ? " data-calendar-color-id='" + event.calendarid + "' " : "")
			+ ">"
			+ "<a>"
				+ "<span class='fc-event-bg'></span>" 
				+ "<span class='fc-event-time'>" + htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) + "</span>" 
				+ "<span class='fc-event-title'>" + htmlEscape(event.title) + "</span>" 
			+ "</a>" 
			+ ((event.editable || event.editable === undefined && opt('editable')) && !opt('disableResizing') && $.fn.resizable ?
				"<div class='ui-resizable-handle ui-resizable-s'>=</div>"
				: '') 
		+ "</div>";
	}
	
	
	function bindDaySeg(event, eventElement, seg) {
		eventElementHandlers(event, eventElement);
		if (event.editable || event.editable === undefined && opt('editable')) {
			draggableDayEvent(event, eventElement, seg.isStart);
			if (seg.isEnd) {
				resizableDayEvent(event, eventElement, seg);
			}
		}
	}
	
	
	function bindSlotSeg(event, eventElement, seg) {
		eventElementHandlers(event, eventElement);
		if (event.editable || event.editable === undefined && opt('editable')) {
			var timeElement = eventElement.find('span.fc-event-time');
			draggableSlotEvent(event, eventElement, timeElement);
			if (seg.isEnd) {
				resizableSlotEvent(event, eventElement, timeElement);
			}
		}
	}
	
	
	
	/* Dragging
	-----------------------------------------------------------------------------------*/
	
	
	// when event starts out FULL-DAY
	
	function draggableDayEvent(event, eventElement, isStart) {
		if (!opt('disableDragging') && eventElement.draggable) {
			var origWidth;
			var allDay=true;
			var dayDelta;
			var dis = opt('isRTL') ? -1 : 1;
			var hoverListener = getHoverListener();
			var colWidth = getColWidth();
			var slotHeight = getSlotHeight();
			var minMinute = getMinMinute();
			eventElement.draggable({
				zIndex: 9,
				////opacity: opt('dragOpacity', 'month'), // use whatever the month view was using
				opacity: 0.5,
				helper: 'original',
				revertDuration: opt('dragRevertDuration'),
				start: function(ev, ui) {
//					eventElement.find('a').css('visibility','hidden');
					trigger('eventDragStart', eventElement, event, ev, ui);
					hideEvents(event, eventElement);
					origWidth = eventElement.width();
					hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
						eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
						clearOverlays();
						if (cell) {
							dayDelta = colDelta * dis;
							if (!cell.row) {
								// on full-days
								renderDayOverlay(
									addDays(cloneDate(event.start), dayDelta),
									addDays(exclEndDay(event), dayDelta)
								);
								resetElement();
							}else{
								// mouse is over bottom slots
								if (isStart && allDay) {
									// convert event to temporary slot-event
									setOuterHeight(
										eventElement.width(colWidth - 10), // don't use entire width
										slotHeight * Math.round(
											(event.end ? ((event.end - event.start) / MINUTE_MS) : opt('defaultEventMinutes'))
											/ opt('slotMinutes')
										)
									);
									eventElement.draggable('option', 'grid', [colWidth, 1]);
									allDay = false;
								}
							}
						}
					}, ev, 'drag');
				},
				stop: function(ev, ui) {
					eventElement.find('a').css('visibility','visible');
					var cell = hoverListener.stop();
					clearOverlays();
					trigger('eventDragStop', eventElement, event, ev, ui);
					if (cell && (!allDay || dayDelta)) {
						// changed!
						eventElement.find('a').removeAttr('href'); // prevents safari from visiting the link
						var minuteDelta = 0;
						if (!allDay) {
							minuteDelta = Math.round((eventElement.offset().top - getBodyContent().offset().top) / slotHeight)
								* opt('slotMinutes')
								+ minMinute
								- (event.start.getHours() * 60 + event.start.getMinutes());
						}
						eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
					}else{
						// hasn't moved or is out of bounds (draggable has already reverted)
						var minuteDelta = 0;
						eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
						resetElement();
						if ($.browser.msie) {
							eventElement.css('filter', ''); // clear IE opacity side-effects
						}
						showEvents(event, eventElement);
					}
				}
			});
			function resetElement() {
				if (!allDay) {
					eventElement
						.width(origWidth)
						.height('')
						.draggable('option', 'grid', null);
					allDay = true;
				}
			}
		}
	}
	
	
	// when event starts out IN TIMESLOTS
	
	function draggableSlotEvent(event, eventElement, timeElement) {
		if (!opt('disableDragging') && eventElement.draggable) {
			var origPosition;
			var allDay=false;
			var dayDelta;
			var minuteDelta;
			var prevMinuteDelta;
			var dis = opt('isRTL') ? -1 : 1;
			var hoverListener = getHoverListener();
			var colCnt = getColCnt();
			var colWidth = getColWidth();
			var slotHeight = getSlotHeight();
			eventElement.draggable({
				zIndex: 9,
				scroll: false,
				grid: [colWidth, slotHeight],
				axis: colCnt==1 ? 'y' : false,
				opacity: opt('dragOpacity'),
				cursor: 'move',
				revertDuration: opt('dragRevertDuration'),
				start: function(ev, ui) {
//					eventElement.find('a').css('visibility','hidden');
					trigger('eventDragStart', eventElement, event, ev, ui);
					hideEvents(event, eventElement);
					if ($.browser.msie) {
						eventElement.find('span.fc-event-bg').hide(); // nested opacities mess up in IE, just hide
					}
					origPosition = eventElement.position();
					minuteDelta = prevMinuteDelta = 0;
					hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
						eventElement.draggable('option', 'revert', !cell);
						clearOverlays();
						if (cell) {
							dayDelta = colDelta * dis;
							if (opt('allDaySlot') && !cell.row) {
								// over full days
								if (!allDay) {
									// convert to temporary all-day event
									allDay = true;
									timeElement.hide();
									eventElement.draggable('option', 'grid', null);
								}
								renderDayOverlay(
									addDays(cloneDate(event.start), dayDelta),
									addDays(exclEndDay(event), dayDelta)
								);
							}else{
								// on slots
								resetElement();
							}
						}
					}, ev, 'drag');
				},
				drag: function(ev, ui) {
					minuteDelta = Math.round((ui.position.top - origPosition.top) / slotHeight) * opt('slotMinutes');
					if (minuteDelta != prevMinuteDelta) {
						if (!allDay) {
							updateTimeText(minuteDelta);
						}
						prevMinuteDelta = minuteDelta;
					}
				},
				stop: function(ev, ui) {
					eventElement.find('a').css('visibility','visible');
					var cell = hoverListener.stop();
					clearOverlays();
					trigger('eventDragStop', eventElement, event, ev, ui);
					if (cell && (dayDelta || minuteDelta || allDay)) {
						// changed!
						eventDrop(this, event, dayDelta, allDay ? 0 : minuteDelta, allDay, ev, ui);
					}else{
						// either no change or out-of-bounds (draggable has already reverted)
						resetElement();
						eventElement.css(origPosition); // sometimes fast drags make event revert to wrong position
						updateTimeText(0);
						if ($.browser.msie) {
							eventElement
								.css('filter', '') // clear IE opacity side-effects
								.find('span.fc-event-bg')
									.css('display', ''); // .show() made display=inline
						}
						showEvents(event, eventElement);
					}
				}
			});
			function updateTimeText(minuteDelta) {
				var newStart = addMinutes(cloneDate(event.start), minuteDelta);
				var newEnd;
				if (event.end) {
					newEnd = addMinutes(cloneDate(event.end), minuteDelta);
				}
				timeElement.text(formatDates(newStart, newEnd, opt('timeFormat')));
			}
			function resetElement() {
				// convert back to original slot-event
				if (allDay) {
					timeElement.css('display', ''); // show() was causing display=inline
					eventElement.draggable('option', 'grid', [colWidth, slotHeight]);
					allDay = false;
				}
			}
		}
	}
	
	
	
	/* Resizing
	--------------------------------------------------------------------------------------*/
	
	
	function resizableSlotEvent(event, eventElement, timeElement) {
		if (!opt('disableResizing') && eventElement.resizable) {
			var slotDelta, prevSlotDelta;
			var slotHeight = getSlotHeight();
			eventElement.resizable({
				handles: {
					s: 'div.ui-resizable-s'
				},
				grid: slotHeight,
				start: function(ev, ui) {
					slotDelta = prevSlotDelta = 0;
					hideEvents(event, eventElement);
					if ($.browser.msie && $.browser.version == '6.0') {
						eventElement.css('overflow', 'hidden');
					}
					eventElement.css('z-index', 9);
					trigger('eventResizeStart', this, event, ev, ui);
				},
				resize: function(ev, ui) {
					// don't rely on ui.size.height, doesn't take grid into account
					slotDelta = Math.round((Math.max(slotHeight, eventElement.height()) - ui.originalSize.height) / slotHeight);
					if (slotDelta != prevSlotDelta) {
						timeElement.text(
							formatDates(
								event.start,
								(!slotDelta && !event.end) ? null : // no change, so don't display time range
									addMinutes(eventEnd(event), opt('slotMinutes')*slotDelta),
								opt('timeFormat')
							)
						);
						prevSlotDelta = slotDelta;
					}
				},
				stop: function(ev, ui) {
					trigger('eventResizeStop', this, event, ev, ui);
					if (slotDelta) {
						eventResize(this, event, 0, opt('slotMinutes')*slotDelta, ev, ui);
					}else{
						eventElement.css('z-index', 8);
						showEvents(event, eventElement);
						// BUG: if event was really short, need to put title back in span
					}
				}
			});
		}
	}
	

}


function countForwardSegs(levels) {
	var i, j, k, level, segForward, segBack;
	for (i=levels.length-1; i>0; i--) {
		level = levels[i];
		for (j=0; j<level.length; j++) {
			segForward = level[j];
			for (k=0; k<levels[i-1].length; k++) {
				segBack = levels[i-1][k];
				if (segsCollide(segForward, segBack)) {
					segBack.forward = Math.max(segBack.forward||0, (segForward.forward||0)+1);
				}
			}
		}
	}
}




function View(element, calendar, viewName) {
	var t = this;
	
	
	// exports
	t.element = element;
	t.calendar = calendar;
	t.name = viewName;
	t.opt = opt;
	t.trigger = trigger;
	t.reportEvents = reportEvents;
	t.eventEnd = eventEnd;
	t.reportEventElement = reportEventElement;
	t.reportEventClear = reportEventClear;
	t.eventElementHandlers = eventElementHandlers;
	t.showEvents = showEvents;
	t.hideEvents = hideEvents;
	t.eventDrop = eventDrop;
	t.eventResize = eventResize;
	// t.title
	// t.start, t.end
	// t.visStart, t.visEnd
	
	
	// imports
	var defaultEventEnd = t.defaultEventEnd;
	var normalizeEvent = calendar.normalizeEvent; // in EventManager
	var reportEventChange = calendar.reportEventChange;
	
	
	// locals
	var eventsByID = {};
	var eventElements = [];
	var eventElementsByID = {};
	var options = calendar.options;
	
	
	
	function opt(name, viewNameOverride) {
		var v = options[name];
		if (typeof v == 'object') {
			return smartProperty(v, viewNameOverride || viewName);
		}
		return v;
	}

	
	function trigger(name, thisObj) {
		return calendar.trigger.apply(
			calendar,
			[name, thisObj || t].concat(Array.prototype.slice.call(arguments, 2), [t])
		);
	}
	
	
	
	/* Event Data
	------------------------------------------------------------------------------*/
	
	
	// report when view receives new events
	function reportEvents(events) { // events are already normalized at this point
		eventsByID = {};
		var i, len=events.length, event;
		for (i=0; i<len; i++) {
			event = events[i];
			if (eventsByID[event._id]) {
				eventsByID[event._id].push(event);
			}else{
				eventsByID[event._id] = [event];
			}
		}
	}
	
	
	// returns a Date object for an event's end
	function eventEnd(event) {
		return event.end ? cloneDate(event.end) : defaultEventEnd(event);
	}
	
	
	
	/* Event Elements
	------------------------------------------------------------------------------*/
	
	
	// report when view creates an element for an event
	function reportEventElement(event, element) {
		eventElements.push(element);
		if (eventElementsByID[event._id]) {
			eventElementsByID[event._id].push(element);
		}else{
			eventElementsByID[event._id] = [element];
		}
	}
	
	
	function reportEventClear() {
		eventElements = [];
		eventElementsByID = {};
	}
	
	
	// attaches eventClick, eventMouseover, eventMouseout
	function eventElementHandlers(event, eventElement) {
		eventElement
			.click(function(ev) {
				if (!eventElement.hasClass('ui-draggable-dragging') &&
					!eventElement.hasClass('ui-resizable-resizing')) {
						return trigger('eventClick', this, event, ev);
					}
			})
			.dblclick(function(ev) {
				if (!eventElement.hasClass('ui-draggable-dragging') &&
					!eventElement.hasClass('ui-resizable-resizing')) {
						return trigger('eventDblClick', this, event, ev);
					}
			})
			.hover(
				function(ev) {
					trigger('eventMouseover', this, event, ev);
				},
				function(ev) {
					trigger('eventMouseout', this, event, ev);
				}
			);
		// TODO: don't fire eventMouseover/eventMouseout *while* dragging is occuring (on subject element)
		// TODO: same for resizing
	}
	
	
	function showEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'show');
	}
	
	
	function hideEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'hide');
	}
	
	
	function eachEventElement(event, exceptElement, funcName) {
		var elements = eventElementsByID[event._id],
			i, len = elements.length;
		for (i=0; i<len; i++) {
			if (!exceptElement || elements[i][0] != exceptElement[0]) {
				elements[i][funcName]();
			}
		}
	}
	
	
	
	/* Event Modification Reporting
	---------------------------------------------------------------------------------*/
	
	
	function eventDrop(e, event, dayDelta, minuteDelta, allDay, ev, ui) {
		var oldAllDay = event.allDay;
		var fullEventId = event._id;
		var eventId = event._id.substr(0,18);
		moveEvents(eventsByID[eventId], dayDelta, minuteDelta, allDay);
		if (fullEventId != eventId) {
			moveEvents(eventsByID[fullEventId], dayDelta, minuteDelta, allDay);
		} else {
			moveEvents(eventsByID[eventId + '&evFG;'], dayDelta, minuteDelta, allDay);
		}
		trigger(
			'eventDrop',
			e,
			event,
			dayDelta,
			minuteDelta,
			allDay,
			function() {
				// TODO: investigate cases where this inverse technique might not work
				moveEvents(eventsByID[eventId], -dayDelta, -minuteDelta, oldAllDay);
				if (fullEventId != eventId) {
					moveEvents(eventsByID[fullEventId], -dayDelta, -minuteDelta, oldAllDay);
				} else {
					moveEvents(eventsByID[fullEventId + '&evFG;'], dayDelta, minuteDelta, allDay);
				}
				reportEventChange(eventId);
			},
			ev,
			ui
		);
		reportEventChange(eventId);
	}
	
	
	function eventResize(e, event, dayDelta, minuteDelta, ev, ui) {
		var fullEventId = event._id;
		var eventId = event._id.substr(0,18);
		elongateEvents(eventsByID[eventId], dayDelta, minuteDelta);
		if (fullEventId != eventId) {
			elongateEvents(eventsByID[fullEventId], dayDelta, minuteDelta);
		} else {
			elongateEvents(eventsByID[eventId + '&evFG;'], dayDelta, minuteDelta);
		}
		trigger(
			'eventResize',
			e,
			event,
			dayDelta,
			minuteDelta,
			function() {
				// TODO: investigate cases where this inverse technique might not work
				elongateEvents(eventsByID[eventId], -dayDelta, -minuteDelta);
				reportEventChange(eventId);
			},
			ev,
			ui
		);
		reportEventChange(eventId);
	}
	
	
	
	/* Event Modification Math
	---------------------------------------------------------------------------------*/
	
	
	function moveEvents(events, dayDelta, minuteDelta, allDay) {
		minuteDelta = minuteDelta || 0;
		if (events) {
			for (var e, len=events.length, i=0; i<len; i++) {
				e = events[i];
				if (allDay !== undefined) {
					e.allDay = allDay;
				}
				addMinutes(addDays(e.start, dayDelta, true), minuteDelta);
				if (e.end) {
					e.end = addMinutes(addDays(e.end, dayDelta, true), minuteDelta);
				}
				normalizeEvent(e, options);
			}
		}
	}
	
	
	function elongateEvents(events, dayDelta, minuteDelta) {
		minuteDelta = minuteDelta || 0;
		if (events) {
			for (var e, len=events.length, i=0; i<len; i++) {
				e = events[i];
				e.end = addMinutes(addDays(eventEnd(e), dayDelta, true), minuteDelta);
				normalizeEvent(e, options);
			}
		}
	}
	

}

function DayEventRenderer() {
	var t = this;

	
	// exports
	t.renderDaySegs = renderDaySegs;
	t.resizableDayEvent = resizableDayEvent;
	var aAlreadyLoadedCalendarColors = {};
	
	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var eventEnd = t.eventEnd;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventResize = t.eventResize;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var allDayTR = t.allDayTR;
	var allDayBounds = t.allDayBounds;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var dayOfWeekCol = t.dayOfWeekCol;
	var dateCell = t.dateCell;
	var compileDaySegs = t.compileDaySegs;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var bindDaySeg = t.bindDaySeg; //TODO: streamline this
	var formatDates = t.calendar.formatDates;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var clearSelection = t.clearSelection;
	
	
	
	/* Rendering
	-----------------------------------------------------------------------------*/
	
	//MORE HUCK CAUSE TO CHANGE THIS FUNCTION
		function renderDaySegs(segs, modifiedEventId) {
			var segmentContainer = getDaySegmentContainer();
			var rowDivs;
			var rowCnt = getRowCnt();
			var colCnt = getColCnt();
			var i = 0;
			var rowI;
			var levelI;
			var colHeights;
			var j;
			var segCnt = segs.length;
			var seg;
			var top;
			var k;
			var moreBoxes = {};
			var view = $(".ui-state-active a span").html();
			segmentContainer[0].innerHTML = daySegHTML(segs); // faster than
																// .html()
			daySegElementResolve(segs, segmentContainer.children());
			daySegElementReport(segs);
			daySegHandlers(segs, segmentContainer, modifiedEventId);
			daySegCalcHSides(segs);
			daySegSetWidths(segs);
			daySegCalcHeights(segs);
			rowDivs = getRowDivs();
			if (view != 'month') {
				jQuery(segs).each(
						function(idx, seg) {
							if (typeof (seg.event.calendarid) != 'undefined') {
								segs[idx].sortSpecial = seg.event.className
										.toString()
										+ '_'
										+ seg.event.calendarid.toString()
										+ '_'
										+ seg.event._start.getTime()
										+ '_'
										+ seg.event.title.toLowerCase()
										+ '_';
							}
						})
				_quickSort(segs, 'sortSpecial');
			}
			// set row heights, calculate event tops (in relation to row top)
			for (rowI = 0; rowI < rowCnt; rowI++) {
				levelI = 0;
				colHeights = [];
				for (j = 0; j < colCnt; j++) {
					colHeights[j] = 0;
				}
				i = 0;
				while (i < segCnt) {
					seg = segs[i];
					if (typeof (seg.row) == 'undefined' || seg.row != rowI) {
						i++;
						continue;
					}
					// loop through segs in a row
					if (typeof (seg.sortBy) == 'undefined'
							&& typeof (seg.event.calendarid) != 'undefined') {
						seg.sortBy = seg.event.className.toString() + '_'
								+ seg.event.calendarid.toString() + '_'
								+ seg.event._start.getTime() + '_'
								+ seg.event.title.toLowerCase() + '_';
					}

					if (seg.isHidden == true) {
						if (moreBoxes[seg.start] == null)
							moreBoxes[seg.start] = generateMoreBox(seg);

						moreBoxes[seg.start].segs.push(seg);
					} else {
						top = arrayMax(colHeights.slice(seg.startCol,
								seg.endCol));
						seg.top = top;
						top += seg.outerHeight + 1;
						for (k = seg.startCol; k < seg.endCol; k++) {
							colHeights[k] = top;
						}
					}

					if (seg.isMore == true) {
						if (moreBoxes[seg.start] == null)
							moreBoxes[seg.start] = generateMoreBox(seg);

						seg.linkedBox = moreBoxes[seg.start];
					}
					i++;
				}
				if (view != 'month') {
					if (rowI == 0) {
						var currRow = rowDivs[rowI];
						var realyEventHeight = arrayMax(colHeights);
						currRow.height(realyEventHeight);

						var allBody = currRow.parents('div.fc-agenda.fc-view');
						var nMaxAllDayHeight = parseInt(allBody.height() / 3);
						currRow.css('max-height', nMaxAllDayHeight);
						$(".fc-event-hori").show();
						$(".all-day-text")
								.css('position', 'relative')
								.html(
										"<div style='position:absolute;top:50%;margin-top:-13px;left:15px;z-index:99;'>"
												+ "<a class='show-section' title='Show all-day section' style='cursor:pointer; text-decoration:underline;  display:none;'>Show<br />all-day</a>"
												+ "<a class='hide-section' title='Hide all-day section' style='cursor:pointer; text-decoration:underline;'>Hide<br />all-day</a>"
												+ "<span style='display:none;'></span></div>");
						$(".all-day-text span").html('' + arrayMax(colHeights));
						var tdCounts = jQuery('.fc-agenda.'
								+ (view == 'week' ? 'fc-view-agendaWeek'
										: 'fc-view-agendaDay')
								+ ' .fc-all-day > td.ui-state-default > div.show_hidden_bar_count');
						var tdHead = jQuery('.fc-agenda.'
								+ (view == 'week' ? 'fc-view-agendaWeek'
										: 'fc-view-agendaDay')
								+ ' .fc-first > th[data-day]');
						if (tdCounts.size() > 0) {
							tdCounts.hide();
						}
						resizeAgenda(true);
						// SHOW CLICK HERE
						$(".show-section").bind(
								'click',
								function() {
									currRow.height(parseInt($(
											".all-day-text span").html()));
									$(".fc-event-hori").show();
									$(".show-section").hide();
									$(".hide-section").show();
									tdCounts.hide();
									resizeAgenda();
								});
						// HIDE CLICK HERE
						$(".hide-section")
								.bind(
										'click',
										function() {
											currRow.height(5);
											$(".fc-event-hori").hide();
											$(".show-section").show();
											$(".hide-section").hide();

											if (tdCounts.size() < 1) {
												tdCounts = jQuery('<div class=show_hidden_bar_count></div>');
												jQuery(
														'.fc-agenda.'
																+ (view == 'week' ? 'fc-view-agendaWeek'
																		: 'fc-view-agendaDay')
																+ ' .fc-all-day > td.ui-state-default')
														.append(tdCounts);
												tdCounts = jQuery('.fc-all-day > td.ui-state-default > div.show_hidden_bar_count');
											} else {
												tdCounts.html('');
											}
											var nIdx = 0;
											tdCounts.show();

											if (view == 'week') {
												tdCounts
														.each(function(idx) {
															var el = $(this);
															var nDay = tdHead
																	.eq(idx)
																	.data('day');
															var nSIze = jQuery(
																	'.fc-view-agendaWeek > .fc-agenda-head > div > .fc-event.fc-event-hori[data-day~="'
																			+ nDay
																			+ '"]')
																	.size();
															if (nSIze > 0) {
																el
																		.html('+'
																				+ nSIze
																				+ ' items');
															} else {
																el.html('');
															}
															nIdx++;
														});
											} else {
												var nSIze = jQuery(
														'.fc-view-agendaDay > .fc-agenda-head > div > .fc-event.fc-event-hori')
														.size();
												if (nSIze > 0) {
													tdCounts.html('+' + nSIze
															+ ' items');
												} else {
													tdCounts.html('');
												}
											}
											resizeAgenda();
										});
					}
				}
				// rowDivs[rowI].height(arrayMax(colHeights));
			}
			_sortMoreBoxes(moreBoxes);
			var rowTops = getRowTops(rowDivs);
			renderMoreBoxes(moreBoxes, rowTops);
			appendOpenEventsToSegs(segs);
			appendCloseEventsToBoxes();
			if (view != 'month') {
				// rowTops[0] = rowTops[0] - 21;
				rowTops[0] = 0;
				// alert(jQuery(segmentContainer[0]).css('top'));
				jQuery(segmentContainer[0]).css({
					"top" : "21px",
					"overflow-y" : "auto",
					"overflow-x" : "hidden",
					"max-height" : nMaxAllDayHeight,
					"height" : realyEventHeight,
					"width" : "100%"
				});
			}
			daySegSetTops(segs, rowTops);
		}
	
        function resizeAgenda(bInit){
            bInit = bInit || false;
            if (typeof(arguments.callee.nOldHeight) == 'undefined' || bInit) {
                arguments.callee.nOldHeight = $('.fc-agenda-head:visible').height();
                return;
            }
            var nOldHeight = arguments.callee.nOldHeight;
            var nNewHeight = $('.fc-agenda-head:visible').height();
            if (nOldHeight != nNewHeight) {
                $('.fc-agenda-body:visible, fc-agenda-bg').height(function(idx, oldH) {
                    return oldH + nOldHeight - nNewHeight;
                });                
                arguments.callee.nOldHeight = nNewHeight;
            }
        
        
        }
        
        function _sortMoreBoxes(boxes) {
            var nI = 0;
            jQuery.each(boxes, function(idx, el) {
                if (el.segs.length < 1) {
                    return;
                }
                _quickSort(boxes[idx].segs, 'sortBy');
            });
        }
        
        
	        
// ---MORE HUCK FUNCTIONS
	function appendCloseEventsToBoxes()
	{
		$('.ui-box-close').bind('click',function(event){
			$(this).parents('.ui-box-container').css('display','none');
		});
	}  
	
	function checkOpenUpPosition(oPopup) {
		var nWidth = oPopup.width(),
			nHeight = oPopup.height(),
			nPosX = parseInt(oPopup.css('left')),
			nPosY = parseInt(oPopup.css('top')),
			nMaxX = oPopup.parents('._CA-fc-view-area').parent().width(),
			nMaxY = oPopup.parents('._CA-fc-view-area').parent().height();
		if (nHeight + nPosY > nMaxY) {
			nPosY = nMaxY - nHeight - 3; 
		} 
		if (nWidth + nPosX > nMaxX) {
			nPosX = nMaxX - nWidth - 3; 
		}
		oPopup.css({
			top : nPosY < 0 ? 0 : nPosY,
			left : nPosX < 0 ? 0 : nPosX 
		});
		
	}
	
	function appendOpenEventsToSegs(p_segs)  
	{
		var seg,
			segsLength = p_segs.length;
			
		for (i = 0; i < segsLength; i++) {
			seg = p_segs[i];
			var box = seg.linkedBox;
			if (box != undefined && box != null) {
                seg.element.bind('click', {
                    	openUp : box.element
                    },
                    function(event){
                    	event.data.openUp.css('display', 'block');
                    	checkOpenUpPosition(event.data.openUp);
			        }
                );
			}
        }
	}
	
	function generateMoreBox(p_seg){
		retBox = {};
		retBox.segs = [];
		retBox.left = p_seg.left;
		retBox.row = p_seg.row;
		retBox.date = p_seg.start;
		return retBox;
	}
	
	function renderMoreBoxes(p_boxes, p_tops){
		var calendarLayout = getDaySegmentContainer()[0];
		for (boxDate in p_boxes) {
			var box = p_boxes[boxDate];
			p_boxes[boxDate].element =  $(renderMoreBox(box,p_tops[box.row]));
			calendarLayout.appendChild(p_boxes[boxDate].element[0]);
		}
	}
	
	function renderMoreBox(p_box,p_top)
	{
		var h = p_box.segs[0].element.width() - 35,
	    	str = '<div class="ui-box-title ui-box-text ">'
		    	+				formatDateForTitle(p_box.date)
		    	+      	'<span id="uibox_close_'+formatDateForId(p_box.date)+'" class="ui-box-close" style:"top:-20;"><a>X</a></span>'
		    	+    	'</div>'
		    	+    '<div id="uibox_content_'+formatDateForId(p_box.date)+'" class="ui-box-content-removed">'		
		    	+ '</div>'
		    	+ '<div class="_size_change"></div>',
			ox = Math.round((document.compatMode=='CSS1Compat' && !window.opera?document.documentElement.clientWidth:document.body.clientWidth)/2),
			oy = Math.round((document.compatMode=='CSS1Compat' && !window.opera?document.documentElement.clientHeight:document.body.clientHeight)/2),
			nW = p_box.segs[0].element.width(),
			//nH = p_box.segs[0].element.width() - 15,
			nH = parseInt(jQuery('._CA-fc-view-area').parent().height() / 6);
			Box = $(document.createElement('div'))
				.addClass('ui-box-container ui-box-outline _resizeable_moveable')
				.css({
					"top" : p_top - 17,
//					'position' : 'absolute',
					'x-index' : "5",
					"width" : nW * 2 - 25,
					"height" : nH * 4 - 15,
					"min-width" : nW ,
					"min-height" : nH,
					"max-width" : (nW * 3) + 'px',
					"max-height" : (nH * 4) + 'px',
					"left" : p_box.left
//					"box-shadow" : "0px 10px 10px #000000",
//					"display" : "none"
				})
				.attr('id','uibox_'+formatDateForId(p_box.date));
		Box[0].innerHTML = str;
		composeInnerSegs(p_box.segs, Box);
		return Box[0];
	}

	
	function composeInnerSegs(p_segs,p_boxElem) 
	{
		var contentHolder = p_boxElem.find('.ui-box-content-removed')[0];
		var segLength = p_segs.length;
		var element;
		var seg;
		var currentTop = 4; //=( fix this hardcode
		for(var i = 0; i < segLength; i++)
		{
			seg = p_segs[i];
			element = seg.element;
			element.css('left','0');
			element.css('top',currentTop);
			element.css('position','relative');
			element.css('width','98%');
			if (element != null) {
				contentHolder.appendChild(element[0]);
				trigger('eventAfterRender', seg.event, seg.event, element);
			}
		}	
	}
	
	function formatDateForId(d) {
  		return '' + d.getFullYear() + '-' + ((d.getMonth()<10)?('0'+(d.getMonth()+1)):(d.getMonth()+1))+ '-' +((d.getDate()<10)?('0'+d.getDate()):d.getDate());
	}
	
	function formatDateForTitle(date) {
	  	var week_deys_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	 	var month_names = ["January", "February", "March", "April", "May", "June", 
	         "July", "August", "September", "October", "November", "December"];
	
	 	 var d =  new Date(date);
	 	 return "" + week_deys_names[d.getDay()] + ", " + month_names[d.getMonth()] + " " + d.getDate();
	}

//---END OF MORE HUCK FUNCTIONS
	function renderTempDaySegs(segs, adjustRow, adjustTop) {
		var tempContainer = $("<div/>");
		var elements;
		var segmentContainer = getDaySegmentContainer();
		var i;
		var segCnt = segs.length;
		var element;
		tempContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
		elements = tempContainer.children();
		segmentContainer.append(elements);
		daySegElementResolve(segs, elements);
		daySegCalcHSides(segs);
		daySegSetWidths(segs);
		daySegCalcHeights(segs);
		daySegSetTops(segs, getRowTops(getRowDivs()));
		elements = [];
		for (i=0; i<segCnt; i++) {
			element = segs[i].element;
			if (element) {
				if (segs[i].row === adjustRow) {
					element.css('top', adjustTop);
				}
				elements.push(element[0]);
			}
		}
		return $(elements);
	}
	
	
	function daySegHTML(segs) { // also sets seg.left and seg.outerWidth
		var rtl = opt('isRTL');
		var i;
		var segCnt=segs.length;
		var seg;
		var event;
		var className;
		var bounds = allDayBounds();
		var minLeft = bounds.left;
		var maxLeft = bounds.right;
		var cols = []; // don't really like this system (but have to do this b/c RTL works differently in basic vs agenda)
		var left;
		var right
		var html = '';
        var aCalendarColors = {};
//        var aTempSegs = [].concat(segs);
//        for (i = 0; i < aTempSegs.length; i++ ) {
//        	aTempSegs[i].sortDaily = 
//        		aTempSegs[i].start.getTime()
//				+ '_'
//				+ aTempSegs[i].event.title.toLowerCase()
//				+ '_';
//        	
//        }
//        _quickSort(aTempSegs, 'sortDaily');
		// calculate desired position/dimensions, create html
        for (i = 0; i < segCnt; i++) {
			seg = segs[i]; 
			//seg = aTempSegs[i];
			event = seg.event;
			/*if(seg.isMore == true)
				continue;*/
			className = 'fc-event fc-event-hori ';
			if (rtl) {
				if (seg.isStart) {
					className += 'fc-corner-right ';
				}
				if (seg.isEnd) {
					className += 'fc-corner-left ';
				}
				cols[0] = dayOfWeekCol(seg.end.getDay()-1);
				cols[1] = dayOfWeekCol(seg.start.getDay());
				left = seg.isEnd ? colContentLeft(cols[0]) : minLeft;
				right = seg.isStart ? colContentRight(cols[1]) : maxLeft;
			} else {
				if (seg.isStart) {
					className += 'fc-corner-left ';
				}
				if (seg.isEnd) {
					className += 'fc-corner-right ';
				}
				cols[0] = dayOfWeekCol(seg.start.getDay());
				cols[1] = dayOfWeekCol(seg.end.getDay()-1);
				left = seg.isStart ? colContentLeft(cols[0]) : minLeft;
				right = seg.isEnd ? colContentRight(cols[1]) : maxLeft;
			}
			
			//MORE HUCK SNEAKS HERE	
			var event_title = event.title;
			var active_button = $("div.ui-state-active");
			/*if (active_button.hasClass("fc-button-month") && event_title.length > 15) {
				event_title = event_title.substring(0,13)+'...';
			}*/
                        var dayList = [];
                        for (var nDay = seg.start.getDay(); 
                            nDay <= (seg.end.getDay() > seg.start.getDay() 
                                ? seg.end.getDay() - 1 
                                : 6); 
                            nDay++) {
                            dayList.push(nDay);
                        }
			html +=
                            "<div class='" + className + event.className.join(' ') + (event.cal_id ? event.cal_id : '') + "' "
                            + " style='" 
//                            + (event.color != undefined ? 'background-color:' + event.color + ';' : '') 
                            + "position:absolute;z-index:8;left:"+left+"px'"
                            + "data-day='" + dayList.join(' ') + "'"
//                            + "data-dstart='" + seg.start + "'"
//                            + "data-dend='" + seg.end + "'"
                            + "data-dstart_day='" + seg.start.getDay() + "'"
                            + "data-dend_day='" + seg.end.getDay() + "'"
//                            + "data-url='" + event.url + "'"
                            + (event.color != undefined ? "data-calendar-color-id='" + event.calendarid + "' " : "")
                            + ">" 
                            + ((seg.hasOlder == true) ? "<div class='has-left'></div>" : "") 
                            + "<a "
                            + ((seg.hasOlder == true) ? " style='padding-left:16px'" : "") 
//                    + (event.url ? " href='" + htmlEscape(event.url) + "'" : '') 
                    + ">" 
                            + (!event.allDay && seg.isStart 
                                ? "<span class='fc-event-time'>" 
                                    + htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) 
                                    + "</span>"
                                : ''
                            ) 
                            + "<span class='fc-event-title'>" + htmlEscape(event_title) + "</span>" 
                            + "</a>" 
                            + ((seg.hasNewer == true) ? "<div class='has-right'></div>" : "") 
                            + (seg.isEnd && (event.editable || event.editable === undefined && opt('editable')) && !opt('disableResizing') && seg.hasNewer != true 
                                ? "<div class='ui-resizable-handle ui-resizable-" + (rtl ? 'w' : 'e') + "'></div>"
                                : ''
                            ) 
                            + "</div>";                        
                        
			//MORE HUCK SNEAKS OUT FROM HERE
                        if (event.color != 'undefined' && aAlreadyLoadedCalendarColors[event.calendarid] == undefined) {
                        	aAlreadyLoadedCalendarColors[event.calendarid] = event.color;
                            aCalendarColors[event.calendarid] = event.color;
                        }
			seg.left = left;
			seg.outerWidth = right - left;
			cols.sort(cmp);
			seg.startCol = cols[0];
			seg.endCol = cols[1] + 1;
		}
        renderCalendarColorsStyle(aCalendarColors, {update : false});
		return html;
	}
        
    renderCalendarColorsStyle = function(aCalendarColors, aFlags) {
    	
        jQuery.each(aCalendarColors, function(sCalendar, sColor){
//        	console.log(' try to set calendar ' + sCalendar + ' / ' + sColor);
            if (sCalendar == undefined || sColor == undefined) {
                return;
            }
            reRenderCalendarColorsStyle(sCalendar, sColor);
            //changeCssClass('div.fc-event[data-calendar-color-id="' + sCalendar + '"] a', 'background-color: ' + sColor + ' !important');
        });
    }
    
    reRenderCalendarColorsStyle = function(classname, bgcolor, visible){
    	var contrastingColor = function (color) {
	          return (luma(color) >= 165) ? '000' : 'fff';
	      }
	      
	      var luma = function (color) { // color can be a hx string or an array of RGB values 0-255
	          var rgb = (typeof color === 'string') ? hexToRGBArray(color) : color;
	          return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
	      }
	      
	      var hexToRGBArray = function hexToRGBArray(color) {
	    	  var rgb = [0 , 0, 0];
	    	  if (color.length === 3) {
	              color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
	          } else if (color.length === 6) {
		          for (var i = 0; i <= 2; i++) {
		              rgb[i] = parseInt(color.substr(i * 2, 2), 16);
		          }
	          } else if (color.length === 7 && color.substr(0, 1) == '#') {
		          for (var i = 0; i <= 2; i++) {
		              rgb[i] = parseInt(color.substr(i * 2 + 1, 2), 16);
		          }
	          } else if (color.substr(0, 4) == 'rgb(') {
	        	  var aTmp = color.substr(4).split(",");
		          for (var i = 0; i <= 2; i++) {
		              rgb[i] = parseInt(jQuery.trim(aTmp[i]));
		          }
	          }
	          
	          return rgb;
	      }
	
	
	      if(visible == null ||  visible == true) {
	          changeCssClass('.' + classname + ' a', 'display: block; visibility: visible; background-color: ' + bgcolor  + ' !important;  border-color: ' + bgcolor  + '  !important; color: #' + contrastingColor(bgcolor) +   ' !important; ');
	          changeCssClass('.' + classname, 'display: block; visibility: visible; border-color: ' + bgcolor  + '  !important; ');
	          changeCssClass('.eh-title-container.' + classname, 'background-color: ' + bgcolor  + '  !important; ');
	          changeCssClass('.eh-title-container.' + classname + ' h2.mainTitle', 'color: #' + contrastingColor(bgcolor) + ' !important;');
	          changeCssClass('div.fc-event[data-calendar-color-id="' + classname + '"] a', 'background-color: ' + bgcolor + ' !important');
	      } else {
	          changeCssClass('.' + classname + ' a', ' display: none; visibility: hidden;');
	          changeCssClass('.' + classname, 'display: none; visibility: hidden; ');
	      }    	
    }    
	function daySegElementResolve(segs, elements) { // sets seg.element
		var i;
		var segCnt = segs.length;
		var seg;
		var event;
		var element;
		var triggerRes;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			element = $(elements[i]); // faster than .eq()
			triggerRes = trigger('eventRender', event, event, element);
			if (triggerRes === false) {
				element.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					triggerRes = $(triggerRes)
						.css({
							position: 'absolute',
							left: seg.left
						});
					element.replaceWith(triggerRes);
					element = triggerRes;
				}
				seg.element = element;
			}
		}
	}
	
	
	function daySegElementReport(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				reportEventElement(seg.event, element);
			}
		}
	}
	
	
	function daySegHandlers(segs, segmentContainer, modifiedEventId) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var event;
		// retrieve elements, run through eventRender callback, bind handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) { 
				event = seg.event;
				if (event._id === modifiedEventId) {
					bindDaySeg(event, element, seg);
				}else{
					element[0]._fci = i; // for lazySegBind
				}
			}
		}
		lazySegBind(segmentContainer, segs, bindDaySeg);
	}
	
	
	function daySegCalcHSides(segs) { // also sets seg.key
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var key, val;
		var hsideCache = {};
		// record event horizontal sides
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				key = seg.key = cssKey(element[0]);
				val = hsideCache[key];
				if (val === undefined) {
					val = hsideCache[key] = hsides(element[0], true);
				}
				seg.hsides = val;
			}
		}
	}
	
	
	function daySegSetWidths(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				element[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
			}
		}
	}

	
	function daySegCalcHeights(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var key, val;
		var vmarginCache = {};
		// record event heights
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				key = seg.key; // created in daySegCalcHSides
				val = vmarginCache[key];
				if (val === undefined) {
					val = vmarginCache[key] = vmargins(element[0]);
				}
				if((element[0].offsetHeight + val) > 15)
				  seg.outerHeight = 15;
				else 
				  seg.outerHeight = element[0].offsetHeight + val;
			}
		}		
	}
	
	
	function getRowDivs() {
		var i;
		var rowCnt = getRowCnt();
		var rowDivs = [];
		for (i=0; i<rowCnt; i++) {
			rowDivs[i] = allDayTR(i)
				.find('td:first div.fc-day-content > div'); // optimal selector?
		}
		return rowDivs;
	}
	
	
	function getRowTops(rowDivs) {
		var i;
		var rowCnt = rowDivs.length;
		var tops = [];
		for (i=0; i<rowCnt; i++) {
			tops[i] = rowDivs[i][0].offsetTop;
		}
		return tops;
	}
	
	
	function daySegSetTops(segs, rowTops) { // also triggers eventAfterRender
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var event;
		var elemClientHeight = 0;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element && seg.isHidden != true && seg.row != undefined) {
				//element[0].style.top = rowTops[seg.row] + (seg.top||0) + 'px';
                    var segtop = (seg.top || 0);
				if ($.browser.safari == true) 
				{
					if (elemClientHeight == 0) elemClientHeight = seg.element[0].clientHeight;
					if (seg.element[0].className.indexOf('more') >= 0)
						segtop = ((elemClientHeight + 1)  * (seg.level - 1)) + seg.level;
					else
						segtop = ((elemClientHeight + 1)  * seg.level) + seg.level;
				}
				
				element[0].style.top = rowTops[seg.row] + segtop + 'px';
				event = seg.event;
				trigger('eventAfterRender', event, event, element);
			}
		}
	}
	
	
	
	/* Resizing
	-----------------------------------------------------------------------------------*/
	
	
	function resizableDayEvent(event, element, seg) {
		if (!opt('disableResizing') && seg.isEnd) {
			var rtl = opt('isRTL');
			var direction = rtl ? 'w' : 'e';
			var handle = element.find('div.ui-resizable-' + direction);
			handle.mousedown(function(ev) {
				if (ev.which != 1) {
					return; // needs to be left mouse button
				}
				var hoverListener = t.getHoverListener();
				var rowCnt = getRowCnt();
				var colCnt = getColCnt();
				var dis = rtl ? -1 : 1;
				var dit = rtl ? colCnt : 0;
				var elementTop = element.css('top');
				var dayDelta;
				var helpers;
				var eventCopy = $.extend({}, event);
				var minCell = dateCell(event.start);
				clearSelection();
				$('body')
					.css('cursor', direction + '-resize')
					.one('mouseup', mouseup);
				trigger('eventResizeStart', this, event, ev);
				hoverListener.start(function(cell, origCell) {
					if (cell) {
						var r = Math.max(minCell.row, cell.row);
						var c = cell.col;
						if (rowCnt == 1) {
							r = 0; // hack for all-day area in agenda views
						}
						if (r == minCell.row) {
							if (rtl) {
								c = Math.min(minCell.col, c);
							}else{
								c = Math.max(minCell.col, c);
							}
						}
						dayDelta = (r*7 + c*dis+dit) - (origCell.row*7 + origCell.col*dis+dit);
						var newEnd = addDays(eventEnd(event), dayDelta, true);
						if (dayDelta) {
							eventCopy.end = newEnd;
							var oldHelpers = helpers;
							helpers = renderTempDaySegs(compileDaySegs([eventCopy]), seg.row, elementTop);
							helpers.find('*').css('cursor', direction + '-resize');
							if (oldHelpers) {
								oldHelpers.remove();
							}
							hideEvents(event);
						}else{
							if (helpers) {
								showEvents(event);
								helpers.remove();
								helpers = null;
							}
						}
						clearOverlays();
						renderDayOverlay(event.start, addDays(cloneDate(newEnd), 1)); // coordinate grid already rebuild at hoverListener.start
					}
				}, ev);
				function mouseup(ev) {
					trigger('eventResizeStop', this, event, ev);
					$('body').css('cursor', 'auto');
					hoverListener.stop();
					clearOverlays();
					if (dayDelta) {
						eventResize(this, event, dayDelta, 0, ev);
						// event redraw will clear helpers
					}
					// otherwise, the drag handler already restored the old events
				}
			});
		}
	}
	

}

//BUG: unselect needs to be triggered when events are dragged+dropped

function SelectionManager() {
	var t = this;
	
	
	// exports
	t.select = select;
	t.unselect = unselect;
	t.reportSelection = reportSelection;
	t.daySelectionMousedown = daySelectionMousedown;
	
	
	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var defaultSelectionEnd = t.defaultSelectionEnd;
	var renderSelection = t.renderSelection;
	var clearSelection = t.clearSelection;
	
	
	// locals
	var selected = false;



	// unselectAuto
	if (opt('selectable') && opt('unselectAuto')) {
		$(document).mousedown(function(ev) {
			var ignore = opt('unselectCancel');
			if (ignore) {
				if ($(ev.target).parents(ignore).length) { // could be optimized to stop after first match
					return;
				}
			}
			unselect(ev);
		});
	}
	

	function select(startDate, endDate, allDay) {
		unselect();
		if (!endDate) {
			endDate = defaultSelectionEnd(startDate, allDay);
		}
		renderSelection(startDate, endDate, allDay);
		reportSelection(startDate, endDate, allDay);
	}
	
	
	function unselect(ev) {
		if (selected) {
			selected = false;
			clearSelection();
			trigger('unselect', null, ev);
		}
	}
	
	
	function reportSelection(startDate, endDate, allDay, ev) {
		selected = true;
		trigger('select', null, startDate, endDate, allDay, ev);
	}
	
	
	function daySelectionMousedown(ev) { // not really a generic manager method, oh well
		var cellDate = t.cellDate;
		var cellIsAllDay = t.cellIsAllDay;
		var hoverListener = t.getHoverListener();
		if (ev.which == 1 && opt('selectable')) { // which==1 means left mouse button
			unselect(ev);
			var _mousedownElement = this;
			var dates;
			hoverListener.start(function(cell, origCell) { // TODO: maybe put cellDate/cellIsAllDay info in cell
				clearSelection();
				if (cell && cellIsAllDay(cell)) {
					dates = [ cellDate(origCell), cellDate(cell) ].sort(cmp);
					renderSelection(dates[0], dates[1], true);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						trigger('dayClick', _mousedownElement, dates[0], true, ev);
						// BUG: _mousedownElement will sometimes be the overlay
					}
					reportSelection(dates[0], dates[1], true, ev);
				}
			});
		}
	}


}
 
function OverlayManager() {
	var t = this;
	
	
	// exports
	t.renderOverlay = renderOverlay;
	t.clearOverlays = clearOverlays;
	
	
	// locals
	var usedOverlays = [];
	var unusedOverlays = [];
	
	
	function renderOverlay(rect, parent) {
		var e = unusedOverlays.shift();
		if (!e) {
			e = $("<div class='fc-cell-overlay' style='position:absolute;z-index:3'/>");
		}
		if (e[0].parentNode != parent[0]) {
			e.appendTo(parent);
		}
		usedOverlays.push(e.css(rect).show());
		return e;
	}
	

	function clearOverlays() {
		var e;
		while (e = usedOverlays.shift()) {
			unusedOverlays.push(e.hide().unbind());
		}
	}


}

function CoordinateGrid(buildFunc) {

	var t = this;
	var rows;
	var cols;
	
	t.build = function() {
		rows = [];
		cols = [];
		buildFunc(rows, cols);
	};
	
	t.cell = function(x, y) {
		var rowCnt = rows.length;
		var colCnt = cols.length;
		var i, r=-1, c=-1;
		for (i=0; i<rowCnt; i++) {
			if (y >= rows[i][0] && y < rows[i][1]) {
				r = i;
				break;
			}
		}
		for (i=0; i<colCnt; i++) {
			if (x >= cols[i][0] && x < cols[i][1]) {
				c = i;
				break;
			}
		}
            return (r>=0 && c>=0) ? {
                row:r, 
                col:c
            } : null;
	};
	
	t.rect = function(row0, col0, row1, col1, originElement) { // row1,col1 is inclusive
		var origin = originElement.offset();
		return {
			top: rows[row0][0] - origin.top,
			left: cols[col0][0] - origin.left,
			width: cols[col1][1] - cols[col0][0],
			height: rows[row1][1] - rows[row0][0]
		};
	};

}

function HoverListener(coordinateGrid) {


	var t = this;
	var bindType;
	var change;
	var firstCell;
	var cell;
	
	
	t.start = function(_change, ev, _bindType) {
		change = _change;
		firstCell = cell = null;
		coordinateGrid.build();
		mouse(ev);
		bindType = _bindType || 'mousemove';
		$(document).bind(bindType, mouse);
	};
	
	
	function mouse(ev) {
		var newCell = coordinateGrid.cell(ev.pageX, ev.pageY);
		if (!newCell != !cell || newCell && (newCell.row != cell.row || newCell.col != cell.col)) {
			if (newCell) {
				if (!firstCell) {
					firstCell = newCell;
				}
				change(newCell, firstCell, newCell.row-firstCell.row, newCell.col-firstCell.col);
			}else{
				change(newCell, firstCell);
			}
			cell = newCell;
		}
	}
	
	
	t.stop = function() {
		$(document).unbind(bindType, mouse);
		return cell;
	};
	
	
}

function HorizontalPositionCache(getElement) {

	var t = this,
		elements = {},
		lefts = {},
		rights = {};
		
	function e(i) {
		return elements[i] = elements[i] || getElement(i);
	}
	
	t.left = function(i) {
		return lefts[i] = lefts[i] === undefined ? e(i).position().left : lefts[i];
	};
	
	t.right = function(i) {
		return rights[i] = rights[i] === undefined ? t.left(i) + e(i).width() : rights[i];
	};
	
	t.clear = function() {
		elements = {};
		lefts = {};
		rights = {};
	};
	
}


fc.addDays = addDays;
fc.cloneDate = cloneDate;
fc.parseDate = parseDate;
fc.parseISO8601 = parseISO8601;
fc.parseTime = parseTime;
fc.formatDate = formatDate;
fc.formatDates = formatDates;



/* Date Math
-----------------------------------------------------------------------------*/

var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	DAY_MS = 86400000,
	HOUR_MS = 3600000,
	MINUTE_MS = 60000;
	

function addYears(d, n, keepTime) {
	d.setFullYear(d.getFullYear() + n);
	if (!keepTime) {
		clearTime(d);
	}
	return d;
}


function addMonths(d, n, keepTime) { // prevents day overflow/underflow
	if (+d) { // prevent infinite looping on invalid dates
		var m = d.getMonth() + n,
			check = cloneDate(d);
		check.setDate(1);
		check.setMonth(m);
		d.setMonth(m);
		if (!keepTime) {
			clearTime(d);
		}
		while (d.getMonth() != check.getMonth()) {
			d.setDate(d.getDate() + (d < check ? 1 : -1));
		}
	}
	return d;
}


function addDays(d, n, keepTime) { // deals with daylight savings
	if (+d) {
		var dd = d.getDate() + n,
			check = cloneDate(d);
		check.setHours(9); // set to middle of day
		check.setDate(dd);
		d.setDate(dd);
		if (!keepTime) {
			clearTime(d);
		}
		fixDate(d, check);
	}
	return d;
}


function fixDate(d, check) { // force d to be on check's YMD, for daylight savings purposes
	if (+d) { // prevent infinite looping on invalid dates
		while (d.getDate() != check.getDate()) {
			d.setTime(+d + (d < check ? 1 : -1) * HOUR_MS);
		}
	}
}


function addMinutes(d, n) {
	d.setMinutes(d.getMinutes() + n);
	return d;
}


function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0); 
	d.setMilliseconds(0);
	return d;
}


function cloneDate(d, dontKeepTime) {
	if (dontKeepTime) {
		return clearTime(new Date(+d));
	}
	return new Date(+d);
}


function zeroDate() { // returns a Date with time 00:00:00 and dateOfMonth=1
	var i=0, d;
	do {
		d = new Date(1970, i++, 1);
	} while (d.getHours()); // != 0
	return d;
}


function skipWeekend(date, inc, excl) {
	inc = inc || 1;
	while (!date.getDay() || (excl && date.getDay()==1 || !excl && date.getDay()==6)) {
		addDays(date, inc);
	}
	return date;
}


function dayDiff(d1, d2) { // d1 - d2
	return Math.round((cloneDate(d1, true) - cloneDate(d2, true)) / DAY_MS);
}


function setYMD(date, y, m, d) {
	if (y !== undefined && y != date.getFullYear()) {
		date.setDate(1);
		date.setMonth(0);
		date.setFullYear(y);
	}
	if (m !== undefined && m != date.getMonth()) {
		date.setDate(1);
		date.setMonth(m);
	}
	if (d !== undefined) {
		date.setDate(d);
	}
}



/* Date Parsing
-----------------------------------------------------------------------------*/


function parseDate(s, ignoreTimezone) { // ignoreTimezone defaults to true
	if (typeof s == 'object') { // already a Date object
		return s;
	}
	if (typeof s == 'number') { // a UNIX timestamp
		return new Date(s * 1000);
	}
	if (typeof s == 'string') {
		if (s.match(/^\d+$/)) { // a UNIX timestamp
			return new Date(parseInt(s, 10) * 1000);
		}
		if (ignoreTimezone === undefined) {
			ignoreTimezone = true;
		}
		return parseISO8601(s, ignoreTimezone) || (s ? new Date(s) : null);
	}
	// TODO: never return invalid dates (like from new Date(<string>)), return null instead
	return null;
}


function parseISO8601(s, ignoreTimezone) { // ignoreTimezone defaults to false
	// derived from http://delete.me.uk/2005/03/iso8601.html
	// TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
	var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?$/);
	if (!m) {
		return null;
	}
	var date = new Date(m[1], 0, 1);
	if (ignoreTimezone || !m[14]) {
		var check = new Date(m[1], 0, 1, 9, 0);
		if (m[3]) {
			date.setMonth(m[3] - 1);
			check.setMonth(m[3] - 1);
		}
		if (m[5]) {
			date.setDate(m[5]);
			check.setDate(m[5]);
		}
		fixDate(date, check);
		if (m[7]) {
			date.setHours(m[7]);
		}
		if (m[8]) {
			date.setMinutes(m[8]);
		}
		if (m[10]) {
			date.setSeconds(m[10]);
		}
		if (m[12]) {
			date.setMilliseconds(Number("0." + m[12]) * 1000);
		}
		fixDate(date, check);
	}else{
		date.setUTCFullYear(
			m[1],
			m[3] ? m[3] - 1 : 0,
			m[5] || 1
		);
		date.setUTCHours(
			m[7] || 0,
			m[8] || 0,
			m[10] || 0,
			m[12] ? Number("0." + m[12]) * 1000 : 0
		);
		var offset = Number(m[16]) * 60 + Number(m[17]);
		offset *= m[15] == '-' ? 1 : -1;
		date = new Date(+date + (offset * 60 * 1000));
	}
	return date;
}


function parseTime(s) { // returns minutes since start of day
	if (typeof s == 'number') { // an hour
		return s * 60;
	}
	if (typeof s == 'object') { // a Date object
		return s.getHours() * 60 + s.getMinutes();
	}
	var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
	if (m) {
		var h = parseInt(m[1], 10);
		if (m[3]) {
			h %= 12;
			if (m[3].toLowerCase().charAt(0) == 'p') {
				h += 12;
			}
		}
		return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
	}
}



/* Date Formatting
-----------------------------------------------------------------------------*/
// TODO: use same function formatDate(date, [date2], format, [options])


function formatDate(date, format, options) {
	return formatDates(date, null, format, options);
}


function formatDates(date1, date2, format, options) {
	options = options || defaults;
	var date = date1,
		otherDate = date2,
		i, len = format.length, c,
		i2, formatter,
		res = '';
	for (i=0; i<len; i++) {
		c = format.charAt(i);
		if (c == "'") {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == "'") {
					if (date) {
						if (i2 == i+1) {
							res += "'";
						}else{
							res += format.substring(i+1, i2);
						}
						i = i2;
					}
					break;
				}
			}
		}
		else if (c == '(') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ')') {
					var subres = formatDate(date, format.substring(i+1, i2), options);
					if (parseInt(subres.replace(/\D/, ''), 10)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '[') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ']') {
					var subformat = format.substring(i+1, i2);
					var subres = formatDate(date, subformat, options);
					if (subres != formatDate(otherDate, subformat, options)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '{') {
			date = date2;
			otherDate = date1;
		}
		else if (c == '}') {
			date = date1;
			otherDate = date2;
		}
		else {
			for (i2=len; i2>i; i2--) {
				if (formatter = dateFormatters[format.substring(i, i2)]) {
					if (date) {
						res += formatter(date, options);
					}
					i = i2 - 1;
					break;
				}
			}
			if (i2 == i) {
				if (date) {
					res += c;
				}
			}
		}
	}
	return res;
};


var dateFormatters = {
	s	: function(d)	{ return d.getSeconds() },
	ss	: function(d)	{ return zeroPad(d.getSeconds()) },
	m	: function(d)	{ return d.getMinutes() },
	mm	: function(d)	{ return zeroPad(d.getMinutes()) },
	h	: function(d)	{ return d.getHours() % 12 || 12 },
	hh	: function(d)	{ return zeroPad(d.getHours() % 12 || 12) },
	H	: function(d)	{ return d.getHours() },
	HH	: function(d)	{ return zeroPad(d.getHours()) },
	d	: function(d)	{ return d.getDate() },
	dd	: function(d)	{ return zeroPad(d.getDate()) },
	ddd	: function(d,o)	{ return o.dayNamesShort[d.getDay()] },
	dddd: function(d,o)	{ return o.dayNames[d.getDay()] },
	M	: function(d)	{ return d.getMonth() + 1 },
	MM	: function(d)	{ return zeroPad(d.getMonth() + 1) },
	MMM	: function(d,o)	{ return o.monthNamesShort[d.getMonth()] },
	MMMM: function(d,o)	{ return o.monthNames[d.getMonth()] },
	yy	: function(d)	{ return (d.getFullYear()+'').substring(2) },
	yyyy: function(d)	{ return d.getFullYear() },
	t	: function(d)	{ return d.getHours() < 12 ? 'a' : 'p' },
	tt	: function(d)	{ return d.getHours() < 12 ? 'am' : 'pm' },
	T	: function(d)	{ return d.getHours() < 12 ? 'A' : 'P' },
	TT	: function(d)	{ return d.getHours() < 12 ? 'AM' : 'PM' },
	u	: function(d)	{ return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'") },
	S	: function(d)	{
		var date = d.getDate();
		if (date > 10 && date < 20) {
			return 'th';
		}
		return ['st', 'nd', 'rd'][date%10-1] || 'th';
	}
};




/* Event Date Math
-----------------------------------------------------------------------------*/


function exclEndDay(event) {
	if (event != undefined) {
		if (event.end) {
			return _exclEndDay(event.end, event.allDay);
		}else{
			return addDays(cloneDate(event.start), 1);
		}
	}
}


function _exclEndDay(end, allDay) {
	end = cloneDate(end);
	return allDay || end.getHours() || end.getMinutes() ? addDays(end, 1) : clearTime(end);
}


function segCmp(a, b) {
	return (b.msLength - a.msLength) * 100 + (a.event.start - b.event.start);
}


function segsCollide(seg1, seg2) {
	return seg1.end > seg2.start && seg1.start < seg2.end;
}



/* Event Sorting
-----------------------------------------------------------------------------*/


// event rendering utilities
function sliceSegs(events, visEventEnds, start, end) {
	var segs = [],
		i, len=events.length, event,
		eventStart, eventEnd,
		segStart, segEnd,
		isStart, isEnd;
	for (i=0; i<len; i++) {
		event = events[i];
		eventStart = event.start;
		eventEnd = visEventEnds[i];
		if (eventEnd > start && eventStart < end) {
			if (eventStart < start) {
				segStart = cloneDate(start);
				isStart = false;
			}else{
				segStart = eventStart;
				isStart = true;
			}
			if (eventEnd > end) {
				segEnd = cloneDate(end);
				isEnd = false;
			}else{
				segEnd = eventEnd;
				isEnd = true;
			}
			segs.push({
				event: event,
				start: segStart,
				end: segEnd,
				isStart: isStart,
				isEnd: isEnd,
				msLength: segEnd - segStart
			});
		}
	} 
	return segs.sort(segCmp);
}


// event rendering calculation utilities
function stackSegs(segs) {
	var levels = [],
		i, len = segs.length, seg,
		j, collide, k;
	for (i=0; i<len; i++) {
		seg = segs[i];
		j = 0; // the level index where seg should belong
		while (true) {
			collide = false;
			if (levels[j]) {
				for (k=0; k<levels[j].length; k++) {
					if (segsCollide(levels[j][k], seg)) {
						collide = true;
						break;
					}
				}
			}
			if (collide) {
				j++;
			}else{
				break;
			}
		}
		if (levels[j]) {
			levels[j].push(seg);
		}else{
			levels[j] = [seg];
		}
	}
	return levels;
}



/* Event Element Binding
-----------------------------------------------------------------------------*/


function lazySegBind(container, segs, bindHandlers) {
	container.unbind('mouseover').mouseover(function(ev) {
		var parent=ev.target, e,
			i, seg, parentFound = false;
		
		
		//MORE HUCK REPLACE THIS BLOCK
		/*while (parent != this) {
			e = parent;
			parent = parent.parentNode;
		}*/

		//BY THIS LINE
		e = $(ev.target).parents('.fc-event')[0];
		
		//AND ADD e!== undefined in 'if' condition
		if (e !== undefined && (i = e._fci) !== undefined) {
			e._fci = undefined;
			seg = segs[i];
			if (seg != null) {
				bindHandlers(seg.event, seg.element, seg);
			}
			$(ev.target).trigger(ev);
		}
		ev.stopPropagation();
	});

}



/* Element Dimensions
-----------------------------------------------------------------------------*/


function setOuterWidth(element, width, includeMargins) {
	element.each(function(i, _element) {
		_element.style.width = Math.max(0, width - hsides(_element, includeMargins)) + 'px';
	});
}


function setOuterHeight(element, height, includeMargins) {
	element.each(function(i, _element) {
		_element.style.height = Math.max(0, height - vsides(_element, includeMargins)) + 'px';
	});
}


// TODO: curCSS has been deprecated


function hsides(_element, includeMargins) {
	return (parseFloat($.curCSS(_element, 'paddingLeft', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'paddingRight', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'borderLeftWidth', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'borderRightWidth', true)) || 0) +
	       (includeMargins ? hmargins(_element) : 0);
}


function hmargins(_element) {
	return (parseFloat($.curCSS(_element, 'marginLeft', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'marginRight', true)) || 0);
}


function vsides(_element, includeMargins) {
	return (parseFloat($.curCSS(_element, 'paddingTop', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'paddingBottom', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'borderTopWidth', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'borderBottomWidth', true)) || 0) +
	       (includeMargins ? vmargins(_element) : 0);
}


function vmargins(_element) {
	return (parseFloat($.curCSS(_element, 'marginTop', true)) || 0) +
	       (parseFloat($.curCSS(_element, 'marginBottom', true)) || 0);
}


function setMinHeight(element, h) {
	h = typeof h == 'number' ? h + 'px' : h;
	element[0].style.cssText += ';min-height:' + h + ';_height:' + h;
}



/* Position Calculation
-----------------------------------------------------------------------------*/
// nasty bugs in opera 9.25
// position()'s top returning incorrectly with TR/TD or elements within TD

var topBug;

function topCorrect(tr) { // tr/th/td or anything else
	if (topBug !== false) {
		var cell;
		if (tr.is('th,td')) {
			tr = (cell = tr).parent();
		}
		if (topBug === undefined && tr.is('tr')) {
			topBug = tr.position().top != tr.children().position().top;
		}
		if (topBug) {
			return tr.parent().position().top + (cell ? tr.position().top - cell.position().top : 0);
		}
	}
	return 0;
}



/* Misc Utils
-----------------------------------------------------------------------------*/


//TODO: arraySlice
//TODO: isFunction, grep ?

function normalizeSource(source) {
	if (source.className) {
		// TODO: repeat code, same code for event classNames
		if (typeof source.className == 'string') {
			source.className = source.className.split(/\s+/);
		}
	}else{
			source.className = [];
	}
	var normalizers = fc.sourceNormalizers;
	for (var i=0; i<normalizers.length; i++) {
		normalizers[i](source);
	}
}

function noop() { }


function cmp(a, b) {
	return a - b;
}


function arrayMax(a) {
	return Math.max.apply(Math, a);
}


function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}


function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	if (obj[name] !== undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i=parts.length-1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res !== undefined) {
			return res;
		}
	}
	return obj[''];
}


function htmlEscape(s) {
	return s.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#039;')
		.replace(/"/g, '&quot;')
		.replace(/\n/g, '<br />');
}


function cssKey(_element) {
	return _element.id + '/' + _element.className + '/' + _element.style.cssText.replace(/(^|;)\s*(top|left|width|height)\s*:[^;]*/ig, '');
}


function disableTextSelection(element) {
	element
		.attr('unselectable', 'on')
		.css('MozUserSelect', 'none')
        .bind('selectstart.ui', function() {
            return false;
        });
}


/*
function enableTextSelection(element) {
	element
		.attr('unselectable', 'off')
		.css('MozUserSelect', '')
		.unbind('selectstart.ui');
}
*/




})(jQuery);







function show_object(data)  {           
    if (typeof(data.length) == 'undefined' || data.length < 1) {
        return;
    }
    var firstEl = data[0];
    var sHTML = '<table style="width:100%;font-size:10px;font-weight:normal;" cellspacing=1 bgcolor=#aaa><thead><th>#</th>';
    var fieldList = [];
    jQuery.each(firstEl, function(idx,val){
        sHTML += '<th title="'+ typeof(val) + ' / ' + (typeof(val) == 'object' ? val.constructor.name : '-') + '">' + idx + '</th>';
        fieldList.push(idx);
    });
    sHTML += '</thead><tbody>';
    var nI = 0;
    jQuery.each(data, function(id, el){
        sHTML += '<tr bgcolor=' + (id % 2 == 0 ? '#fff' : '#eee') + '>' + '<td>' + id + '</td>';
        for (nI = 0; nI < fieldList.length; nI++) {
            sHTML += '<td>';
            sHTML += typeof(el[fieldList[nI]]) != 'undefined' 
            ? (typeof(el[fieldList[nI]]) == 'object' ? show_object_by_type(el[fieldList[nI]]) : el[fieldList[nI]])
            : "-";
            sHTML += '</td>';
        }
        sHTML += '</tr>';
    });
    sHTML += '</tbody></table>';
    var showEl = jQuery('#show_object');
    if (showEl.size() < 1) {
        showEl = jQuery('<div id=show_object onClick="jQuery(this).hide()" style="position:fixed;top:15%;left:15%;right:15%;bottom:15%;background-color:#fff;border:1px solid gray;box-shadow:0px 0px 10px #000 ;padding:5px;z-index:999;overflow-y:auto;"></div>');
        showEl.appendTo('body');
    }
    showEl.html(sHTML).show();
            
    function show_object_by_type(val) {
        if (val == null) {
            return "null";
        }
        switch (val.constructor.name) {
            case 'Date' :
                return val.toString();
                break;
            default :
                return JSON.stringify(val);
                break;
        }
                
    }
}            

function _quickSort(objectList, byField) {
            
    qsort(objectList, 0, objectList.length);
            
    function partition(array, begin, end, pivot) {
        var piv = array[pivot];
        array.swap(pivot, end-1);
        var store = begin;
        var ix;
        for(ix = begin; ix < end-1; ++ix) {
            if(array[ix][byField] <= piv[byField]) {
                array.swap(store, ix);
                ++store;
            }
        }
        array.swap(end - 1, store);
        return store;
    }       
            
                       

    function qsort(array, begin, end) {
        if(end - 1 > begin) {
            var pivot = begin + Math.floor(Math.random() * (end - begin));

            pivot = partition(array, begin, end, pivot);
            qsort(array, begin, pivot);
            qsort(array, pivot+1, end);
        }
    }            
            
            
}
        
Array.prototype.swap = function(a, b) {
    var tmp = this[a];
    this[a] = this[b];
    this[b] = tmp;
} 

Array.prototype.diff = function(values) {
    if (typeof(values) == 'undefined') {
        return this;
    }
    return this.filter(function(i) {return !(values.indexOf(i) > -1);});
} 

Array.prototype.merge = function(values) {
    if (typeof(values) != 'string' && typeof(values) != 'numeric') {
        for ( var nonDuplicates = [], i = 0, l = values.length; i < l; ++i ) {
            if ( this.indexOf( values[i] ) === -1 ) {
                nonDuplicates.push( values[i] );
            }
        }
        return this.concat( nonDuplicates )
    } else if (typeof(values) != 'undefined') {
        this.push(values);
        return this;
    }
} 


Array.prototype.intersect = function(values) {
    this.sort();
    values.sort();
    var i = 0, j=0, ret=[];
    while (i < this.length && j < values.length){
        if (this[i] < values[j]) {
            i++;
        }
        else if (values[j] < this[i]) {
            j++;
        }
        else {
            ret.push(this[i]);
            i++, j++;
        }
    }
    return ret;
}

if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisp*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var res = new Array();
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }

        return res;
    };
}

Array.prototype.unique = Array.prototype.unique || function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if (this[i] in u) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}

Array.prototype.indexOf = Array.prototype.indexOf || function(elt)
{
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0) ? Math.ceil(from): Math.floor(from); 
    if (from < 0)from += len;

    for (; from < len; from++)
    {
        if (from in this && this[from] === elt)return from;
    }
    return -1;
};


function _closePopup(el){
	   jQuery(el).parents('.popDiv').hide();
}



function changeCssClass(sClass, sRule) {
    if (sClass == undefined || sRule == undefined) {
        return;
    }
    
    var nI, oStyle;
    if (arguments.callee.oStyle == undefined) {
        //jQuery = jQuery == undefined ? $ : jQuery;
        oStyle = jQuery('style[title="CA_custom_css"]');
        var bNew = false;
        if (oStyle.size() < 1) {
            oStyle = document.createElement('STYLE');
            oStyle .setAttribute('title', 'CA_custom_css');
            oStyle .setAttribute('media', '');
            document.documentElement.firstChild.appendChild(oStyle );
            bNew = true;
        }
        for (nI = 0; nI < document.styleSheets.length; nI++) {
            if (document.styleSheets[nI].title == 'CA_custom_css') {
                oStyle = document.styleSheets[nI];
                break;
            }
        }
        arguments.callee.oStyle = oStyle;
        if (oStyle.media != undefined) {
            oStyle.media.mediaText = '';
            oStyle.disabled = true;
            oStyle.disabled = false;
        }
    } else {
        oStyle = arguments.callee.oStyle;
    }

    //var fRemove = oStyle.deleteRule != undefined ? oStyle.deleteRule : oStyle.removeRule;
    var aRules = new Array();
    if (oStyle.cssRules) {
        aRules = oStyle.cssRules;
    } else if (oStyle.rules) {
        aRules = oStyle.rules;
    }
    else {
        return;
    }
    
    var nFoundRule = -1;
    if (!bNew) {
        for ( nI = 0; nI < aRules.length; nI++) {
            if (aRules[nI].selectorText.toLowerCase() == sClass) {
                nFoundRule = nI;
                break;
            }
        }
    }

    //var sCss = 'div.fc-event[data-calendar-color-id="' + sCalendar + '"] a {background-color: ' + sColor + ' !important}';
    if (nFoundRule >= 0) {
        if (oStyle.deleteRule != undefined) {
            oStyle.deleteRule(nFoundRule);
        } else {
            oStyle.removeRule(nFoundRule);
        }
    } 
    if (oStyle.addRule != undefined) {
        oStyle.addRule(sClass, sRule);
    } else {
        oStyle.insertRule(sClass + ' {' + sRule + '}', aRules.length);
    }

}


function changeSize(evt){
    var el = jQuery(evt.target),
        elParent = el.parent(),
        aCoords = {"x" : evt.clientX, "y" : evt.clientY, 
            "baseW" : elParent.width(), "baseH" : elParent.height()},
        funcMove = function(realEvt) {
    		var aChangeCoords =  {
                width : (aCoords.baseW - aCoords.x + realEvt.clientX),
                height  : (aCoords.baseH - aCoords.y + realEvt.clientY)
            }
    		if (typeof(evt.max) != 'undefined'){
    			aChangeCoords.width = Math.min(aChangeCoords.width, evt.max.width - parseInt(elParent.css('left')));
    			aChangeCoords.height = Math.min(aChangeCoords.height, evt.max.height - parseInt(elParent.css('top')));
    		}
            elParent.width(aChangeCoords.width).height(aChangeCoords.height);
        },
        funcStop = function(realEvt) {
            jQuery(document).off('mousemove',  funcMove);
        };
        
    if (evt.which != 1) {
        return false;
    }  
    
    jQuery(document).on('mousemove', funcMove)
       .one('mouseup', funcStop);    
}

function changePosition(evt){
    var el = jQuery(evt.target),
        elParent = el.parent(),
        aCoords = {"x" : evt.clientX, "y" : evt.clientY, 
            "baseL" : parseInt(elParent.css('left')), "baseT" : parseInt(elParent.css('top'))},
        funcMove = function(realEvt) {
    		var aChangeCoords =  {
                left : (aCoords.baseL - aCoords.x + realEvt.clientX),
                top  : (aCoords.baseT - aCoords.y + realEvt.clientY)
            }
    		if (typeof(evt.max) != 'undefined'){
    			aChangeCoords.left = Math.min(aChangeCoords.left, evt.max.width - elParent.width());
    			aChangeCoords.top = Math.min(aChangeCoords.top, evt.max.height - elParent.height());
    			aChangeCoords.left = Math.max(aChangeCoords.left, evt.max.left);
    			aChangeCoords.top = Math.max(aChangeCoords.top, evt.max.top);
    		}
    		aChangeCoords.left += 'px';
    		aChangeCoords.top += 'px';
            elParent.css(aChangeCoords);
        },
        funcStop = function(realEvt) {
            jQuery(document).off('mousemove',  funcMove);
        };
        
    if (evt.which != 1) {
        return false;
    }  
    
    jQuery(document)
        .on('mousemove', funcMove)
       .one('mouseup', funcStop);    
}