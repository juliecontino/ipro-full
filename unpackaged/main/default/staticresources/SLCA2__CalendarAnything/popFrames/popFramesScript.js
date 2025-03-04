/**
 * @author dgrudzinskiy
 * 
 * version 1.2 from 02.01.2011
 * and lockFrame and unlockFrame functions to allow prevent(and allow) showing hovers for specified link.
 * 
 * version 1.1 from 28.01.2011
 * Can be added to elements by class(elements should has 'id' and 'source' attributes)
 * Now displays not fixed on link but where the mouse stays
 * 
 * 
 * version 1.01 redone 13.12.2010. Now works if there are many links with the same source on one page.
 */

jQuery.noConflict();	

function eventPush(obj, event, handler){
 	if (obj.addEventListener) {
 		obj.addEventListener(event, handler, false);
 	}
 	else 
 		if (obj.attachEvent) {
 			obj.attachEvent('on' + event, handler);
 		}
};
   
var FramesController ={
	
isIE : (navigator.userAgent.toLowerCase().indexOf("msie 6.0") != -1 || navigator.userAgent.toLowerCase().indexOf("msie 7.0") != -1),

Frames : {},

AttachFramesToClass : function(className, sEventType)
{
    sEventType = sEventType || "mouseover";
    jQuery('.' + className).each(function() {
        var jQelement = jQuery(this);
        var elem = this;

        eventPush(elem, sEventType, function (event) {
            FramesController.mouseOverFramedLink(jQelement.attr('source'),jQelement.attr('id'),event)
        });
        eventPush(elem,'mouseout',function(event) {
            FramesController.closeFrame(jQelement.attr('source'),event);
        });
    });
},

AttachFrameToElement : function(p_element, p_source, sEventType)
{
	var elem = p_element;
	var source = p_source;
        sEventType = sEventType || "mouseover";
        
        eventPush(elem, sEventType, function (event) {
            FramesController.mouseOverFramedLink(source, elem.id, event)
        });
        eventPush(p_element,'mouseout',function(event) {
            FramesController.closeFrame(source, event);
        });
},

//create appropriate object but don't load anithing - just fill mouseHoldOwerLink to true and run "openFrame" function after timeout; 
mouseOverFramedLink : function(p_link,p_id,event)
{
	if(!(this._checkArrayItemExisting(p_link)))
		this.Frames[p_link] = {};
	
	this.Frames[p_link].mouseHoldOwerLink = true;
	
	var xy = this.mousePageXY(event);
	
	var xyStringified = "{x:'"+xy.x+"',y:'"+xy.y + "'}";
	var func = "FramesController.openFrame('"+p_link+"','"+p_id+"',"+ xyStringified +")";
	setTimeout(func, 500);
},

generateFrame : function()
{
	var frameHolder = document.createElement("div");
	var frameWrapper = document.createElement("div");
	var frameMain = document.createElement("div");
	var frameBody = document.createElement("div");
	var frameFooter = document.createElement("div");
	
	if (!this.isIE) {
		frameHolder.setAttribute("class", "popDiv");
		frameWrapper.setAttribute("class", "wrapper");
		frameMain.setAttribute("class", "mainPart");
		frameBody.setAttribute("class", "body");
		frameFooter.setAttribute("class", "footer");
	}
	else {
		frameHolder.className = "popDiv";
		frameWrapper.className = "wrapper";
		frameMain.className = "mainPart";
		frameBody.className = "body";
		frameFooter.className = "footer";
	}
	
	frameHolder.id = 'loadingFrameHolder';
	
	frameHolder.appendChild(frameWrapper);
	frameWrapper.appendChild(frameMain);
	frameMain.appendChild(frameBody);
	frameMain.appendChild(frameFooter);
	
	jQuery(frameMain).addClass('ui-state-default');
	
	return frameHolder;
},

openFrame : function(p_link,p_id,p_mouseCoords)
{
	if(!(this.Frames[p_link].mouseHoldOwerLink)) //check if mouse hold on link
		return;

	if(this.Frames[p_link].isLocked)
		return;
		

	if(this._checkFrameExisting(p_link) && this.Frames[p_link].initializeMe != true)
	{
		this.Frames[p_link].linkId = p_id; //Probably id of element ,might be changed dynamicly on page(with ajax)
		//this._setPosition(p_link);		   //or if the same links have a one source
		this._setPosition(p_link,p_mouseCoords);
		this._showFrame(p_link,p_mouseCoords);
	}
	else
	{
		var newFrame = document.createElement("iframe");
		var newFrameContent = document.createElement("div");  //!!!!!!!!!
		var loadingDiv = document.createElement("span");
		
		newFrame.src = p_link;
		newFrame.style.display = "none";
		newFrame.setAttribute("id","frame_"+p_link);
		newFrame.className = "frameStyle";
		
		loadingDiv.innerHTML = "Loading...";
		loadingDiv.setAttribute("id","loading_"+p_link);
		loadingDiv.className = "loadingStyle";
		
		newFrameContent.setAttribute("id","content_"+p_link);
		newFrameContent.setAttribute("class", "frameStyle");  //!!!!!!!!!
		newFrameContent.className = "frameStyle";  //!!!!!!!!!
		
		frameHolder = this.generateFrame();
		frameBody = jQuery(frameHolder).find('.body')[0];
		
		eventPush(newFrame,'load',function () 
		{
			FramesController._substituteLoadingByFrame(p_link)
			FramesController.setPosition(frameHolder,p_mouseCoords);
		});
		eventPush(frameHolder,'mouseout',function(event)
		{
			FramesController.closeFrame(p_link,event);
		});
		
		frameHolder.setAttribute("id","holder_"+p_link);
		
		if (p_link.substr(0,3) != '@@@') {
		frameBody.appendChild(loadingDiv);
		frameBody.appendChild(newFrame);
		frameBody.appendChild(newFrameContent);   //!!!!!!!!!
		}
		this.Frames[p_link].holder = frameHolder;  
		this.Frames[p_link].linkId = p_id; 
		this.Frames[p_link].initializeMe = false;
		
		this._setPosition(p_link,p_mouseCoords);
		
		document.body.appendChild(frameHolder);
	}
},

_setPosition : function(p_link,p_mouseCoords)
{ 
	var holder = this.Frames[p_link].holder;
	this.setPosition(holder,p_mouseCoords); 
}, 

setPosition : function(p_holder,p_mouseCoords) 
{
	var totalWidth = jQuery("body").width();
	var totalHeight = jQuery("body").height();
	var holder = p_holder;
	var holderHeight = jQuery(holder).height();
	var positionLeft = 0;
	
	holder.style.top = p_mouseCoords.y + "px"; 
	if (totalWidth > parseInt(p_mouseCoords.x) + 400) {
		holder.style.left = p_mouseCoords.x + "px";
		jQuery(holder).find(".mainPart").removeClass("mirror");
	}
	else {
		holder.style.left = (p_mouseCoords.x - 420) + "px";
		jQuery(holder).find(".mainPart").addClass("mirror");
	}
	
	if (jQuery(holder).find(".mainPart").hasClass("mirror")) {
		positionLeft = 394;
	}
	
	if (totalHeight > parseInt(p_mouseCoords.y) + holderHeight) {
		holder.style.top = p_mouseCoords.y + "px";
		jQuery(holder).find(".mainPart").removeClass("bottom");
		jQuery(holder).find('.mainPart').css('background-position','');
	}
	else {
		var topPosition = p_mouseCoords.y - holderHeight;
		holder.style.top = topPosition + "px";
		if (topPosition > 0) {
			jQuery(holder).find('.mainPart').css('background-position',positionLeft + 'px ' + (holderHeight-40) + 'px');
			jQuery(holder).find(".mainPart").addClass("bottom");
		} else {
			holder.style.top = "5px";
			jQuery(holder).find('.mainPart').css('background-position',positionLeft + 'px ' + (p_mouseCoords.y) + 'px');
		}
	}
},

_substituteLoadingByFrame : function(p_link)
{
	if(this.isIE){
		var frameHere = document.getElementById("frame_" + p_link);
		var loadingHere = document.getElementById("loading_" + p_link);
		var mainPartHere = loadingHere.parentNode.parentNode;
		var content = document.getElementById("content_" + p_link);
		
		content.innerHTML = jQuery(frameHere).contents().find("body").html(); 
		content.style.display = "block";
		loadingHere.style.display = "none";
		
		/* this is the piece of code to move footer to bottom after it */
		
		var footerTempHolder = jQuery(mainPartHere).find(".footer")[0];
		var footerHere = mainPartHere.removeChild(footerTempHolder);
		mainPartHere.appendChild(footerHere);
	}
	else
	{
		var iFrame =  document.getElementById("frame_" + p_link);
		var content = document.getElementById("content_" + p_link);
		
		content.innerHTML = jQuery(iFrame).contents().find("body").html(); 
		content.style.display = "block";
		document.getElementById("loading_" + p_link).style.display = "none";
	}
},

_showFrame : function(p_link,p_mouseCoords){
	var holder = this.Frames[p_link].holder;
	holder.style.display="block";
	
	var totalHeight = jQuery("body").height();
	var holderHeight = jQuery(holder).height();
	var positionLeft = 0;
	if (jQuery(holder).find(".mainPart").hasClass("mirror")) {
		positionLeft = 394;
	}
	
	if (totalHeight > parseInt(p_mouseCoords.y) + holderHeight) {
		holder.style.top = p_mouseCoords.y + "px";
	}
	else {
		holder.style.top = (p_mouseCoords.y - holderHeight) + "px";
		jQuery(holder).find('.mainPart').css('background-position',positionLeft + 'px ' + (holderHeight-40) + 'px');
	}
},

closeFrame : function(p_link, e)
{
    if (typeof(this.Frames[p_link]) == 'undefined') {
        return;
    }
    this.Frames[p_link].mouseHoldOwerLink = false;

    if(!(this._checkFrameExisting(p_link))) {
        return;
    }
        

    var linkCoords = this._getElementPositionById(this.Frames[p_link].linkId);
    var frameCoords = this._getElementPositionById(this.Frames[p_link].holder.id);
    var mouseCoords = this.mousePageXY(e);

    var isFrameLocked = this.Frames[p_link].isLocked;

    if(!( this._isPointInRectangle(linkCoords , mouseCoords) 
        || this._isPointInRectangle(frameCoords,mouseCoords))
    ) {
        var el = this.Frames[p_link].holder;
        el.style.display="none";
    }
},

unlockFrame : function(p_link)
{
	if(this.Frames[p_link] != undefined)
		this.Frames[p_link].isLocked = false;
},

lockFrame : function(p_link)
{
	if(this.Frames[p_link] == undefined)
		return;

	this.Frames[p_link].isLocked = true;
	this.Frames[p_link].initializeMe = true;
	
	if (this.Frames[p_link].holder != null) {
		document.body.removeChild(this.Frames[p_link].holder);
		this.Frames[p_link].holder = null;
	}
},

mousePageXY : function(e)
{
  var x = 0, y = 0;

  if (!e) e = window.event;

  if (e.pageX || e.pageY)
  {
    x = e.pageX;
    y = e.pageY;
  }
  else if (e.clientX || e.clientY)
  {
    x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
    y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
  }

  if (x >= 5 ) x = x - 5;
  if (y >= 5 ) y = y - 5;
  return {"x":x, "y":y};
},

_getElementPositionById : function(p_elemId)
{
	var tempPos = {xMin : 0,xMax : 0, yMin : 0, yMax : 0};
	var element = document.getElementById(p_elemId);
	var elem = jQuery(element);
	if (elem != null && elem.offset() != null) {
		tempPos.xMin = elem.offset().left;
		tempPos.xMax = tempPos.xMin + elem.width();
		tempPos.yMin = elem.offset().top;
		tempPos.yMax = tempPos.yMin + elem.height() - 1; //interested bug, ressearch it
	}
	return tempPos;
},

_isPointInRectangle : function(p_rect,p_point)
{
	if(p_point.x >= p_rect.xMin && p_point.x <= p_rect.xMax &&
	   p_point.y >= p_rect.yMin && p_point.y <= p_rect.yMax)
	   return true;
	else
		return false; 
},

_checkFrameExisting : function(p_existThisLink)
{
	if(this.Frames[p_existThisLink].holder != null)
			return true;
	return false;
},

_checkArrayItemExisting : function(p_existThisLink)
{
	if(this.Frames[p_existThisLink] != null)
			return true;
	return false;
}

};