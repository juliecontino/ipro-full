/*
 * FullCalendar v1.5.1 Google Calendar Plugin
 *
 * Copyright (c) 2011 Adam Shaw
 * Dual licensed under the MIT and GPL licenses, located in
 * MIT-LICENSE.txt and GPL-LICENSE.txt respectively.
 *
 * Date: Sat Apr 9 14:09:51 2011 -0700
 *
 */
 
(function($) {


var fc = $.fullCalendar;
var formatDate = fc.formatDate;
var parseISO8601 = fc.parseISO8601;
var addDays = fc.addDays;
var applyAll = fc.applyAll;

fc.sourceNormalizers.push(function(sourceOptions) {
	if (sourceOptions.dataType == 'gcal' ||
		sourceOptions.dataType === undefined &&
		(sourceOptions.url || '').match(/^(http|https):\/\/www.google.com\/calendar\/feeds\//)) {
			sourceOptions.dataType = 'gcal';
			if (sourceOptions.editable === undefined) {
				sourceOptions.editable = false;
			}
		}
});


fc.sourceFetchers.push(function(sourceOptions, start, end) {
	var res;
	if (sourceOptions.dataType == 'gcal') {
		try {
			res = transformOptions(sourceOptions, start, end);
		} catch (ex) {
			alert('Error: ' + ex);
		}
	}
	return res;
});


function transformOptions(sourceOptions, start, end) {
	
	var success = sourceOptions.success;
	var data = $.extend({}, sourceOptions.data || {}, {
		'start-min': formatDate(start, 'u'),
		'start-max': formatDate(end, 'u'),
		'singleevents': true,
		'max-results': 9999
	});
	
	var ctz = sourceOptions.currentTimezone;
	if (ctz) {
		data.ctz = ctz = ctz.replace(' ', '_');
	}
	
	var isError = false;
	
	$.ajax({
		url: sourceOptions.url.replace(/\/basic$/, '/full') + '?alt=json-in-script&callback=callbackFn',
		async: false,
		//dataType: 'jsonp',
		//contentType: "application/json",
		complete: function(data,status) {
			//alert(serialize(data));
			if(data.status == 0 && navigator.appName.indexOf('Explorer') < 0) {
				alert('gCal ERROR: This Google Calendar not visible');
				isError = true;
			}
		}
	});

	if (isError) return {};
	
	return $.extend({}, sourceOptions, {
				url: sourceOptions.url.replace(/\/basic$/, '/full') + '?alt=json-in-script&callback=?',
				dataType: 'jsonp',
				data: data,
				startParam: false,
				endParam: false,
				success: function(data) {
					var events = [];
					if (data.feed.entry) {
						$.each(data.feed.entry, function(i, entry) {
							var startStr = entry['gd$when'][0]['startTime'];
							var start = parseISO8601(startStr, true);
							var end = parseISO8601(entry['gd$when'][0]['endTime'], true);
							var allDay = startStr.indexOf('T') == -1;
							var url;
							$.each(entry.link, function(i, link) {
								if (link.type == 'text/html') {
									url = link.href;
									if (ctz) {
										url += (url.indexOf('?') == -1 ? '?' : '&') + 'ctz=' + ctz;
									}
								}
							});
							if (allDay) {
								addDays(end, -1); // make inclusive
							}
							events.push({
								id: entry['gCal$uid']['value'],
								title: entry['title']['$t'],
								url: url,
								start: start,
								end: end,
								allDay: allDay,
								location: entry['gd$where'][0]['valueString'],
								description: entry['content']['$t'],
								cal_id: sourceOptions.cal_id
							});
							/*events.push({
								recordId: entry['gCal$uid']['value'],
								Title: entry['title']['$t'],
								Url: url,
								startDateTime: start,
								endDateTime: end,
								isAllDay: allDay,
								location: entry['gd$where'][0]['valueString'],
								description: entry['content']['$t'],
								cal_id: sourceOptions.cal_id
							});*/
						});
					}
					var args = [events].concat(Array.prototype.slice.call(arguments, 1));
					var res = applyAll(success, this, args);
					if ($.isArray(res)) {
						return res;
					}
					return events;
				}
			});
	
}


// legacy
fc.gcalFeed = function(url, sourceOptions) {
	return $.extend({}, sourceOptions, { url: url, dataType: 'gcal' });
};


})(jQuery);
