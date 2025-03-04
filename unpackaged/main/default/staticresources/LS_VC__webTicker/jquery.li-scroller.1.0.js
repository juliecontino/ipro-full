/*!
 * liScroll 1.0
 * Examples and documentation at: 
 * http://www.gcmingati.net/wordpress/wp-content/lab/jquery/newsticker/jq-liscroll/scrollanimate.html
 * 2007-2010 Gian Carlo Mingati
 * Version: 1.0.2 (30-MARCH-2009)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Requires:
 * jQuery v1.2.x or later
 * 
 */
stripWidth = 0;
var totalTravel;
var defTiming;
var containerWidth;

function scrollnews($strip, spazio, tempo){
	if(rightToLeft)
		$strip.animate({left: '-='+ spazio}, tempo, "linear", function(){$strip.css("left", containerWidth);scrollnews($strip, totalTravel, defTiming);});
	else
		$strip.animate({left: '+='+ spazio}, tempo, "linear", function(){$strip.css("left", -stripWidth);scrollnews($strip, totalTravel, defTiming);});
}

jQuery.fn.liScroll = function(settings) {
		settings = jQuery.extend({
		travelocity: 0.07
		}, settings);
		return this.each(function(){
				var $strip = jQuery(this);
				$strip.addClass("newsticker");
				stripWidth = 0;
				var $mask = $strip.wrap("<div class='mask'></div>");
				var $tickercontainer = $strip.parent().wrap("<div class='tickercontainer'></div>");
				containerWidth = $strip.parent().parent().width();	//a.k.a. 'mask' width
				$strip.find("li").each(function(i){
				stripWidth += jQuery(this, i).outerWidth(true); // thanks to Michael Haszprunar
				});
				$strip.width(stripWidth);
				totalTravel = stripWidth+containerWidth;
				defTiming = totalTravel/settings.travelocity;	// thanks to Scott Waye
				scrollnews($strip, totalTravel, defTiming);
				$strip.hover(function(){if(!isPaused)jQuery(this).stop();},
				function doScroll(){
					var offset = jQuery(this).offset();
					var residualSpace;
					if(rightToLeft)
						residualSpace = offset.left + stripWidth;
					else
						residualSpace = containerWidth - offset.left + 25;
					var residualTime = residualSpace/settings.travelocity;
					if(!isPaused){scrollnews($strip, residualSpace, residualTime);}
				});
		});
};
