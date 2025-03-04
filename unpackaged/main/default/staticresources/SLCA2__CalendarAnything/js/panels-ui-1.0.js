//version 1.1(modified by Dan gru) 
//-works with items, haven't been rendered yet 
//-(changed 'name' property of list item to 'id')
//-added ablylity to prevent dropping specified items between panels 

(function($) {
		  
	var _self = {};
	
	$.fn.SortablePanelsGetResult = function(options) {
		var m_options = {
			panel1 : "list_of_object_fields",
			panel2 : "list_of_selected_fields",
			type : "string",
			ReturnRequiredFields: 'false'
		};

		m_options = $.extend(m_options, options || {});
		var panel1, panel2;
		var $items1 = $("#" + m_options.panel1 + " ul li");
		var $items2 = $("#" + m_options.panel2 + " ul li");
		
		if( m_options.type == "object" )  {
                    panel1 = [], panel2 = [];
                    $items1.each(function(idx) {
                        panel1.push({name: $(this).attr('id'), value: $(this).html()});												
                    });

                    $items2.each(function(idx) {
                        panel2.push({name: $(this).attr('id'), value: $(this).html()});												
                    });
		} else {
                    panel1 = '', panel2 = '';

                    $items1.each(function(idx) {
                        panel1 += (panel1.length > 0 ? "|" : "") + $(this).attr('id');
                    });
                    $items2.each(function(idx) {
                        panel2 += (panel2.length > 0 ? "|" : "") + $(this).attr('id'); 
                        if (m_options.ReturnRequiredFields == 'true' && $(this).find('input').attr('checked') == 'checked') {
                            panel2 += "&crf;";
                        }
                    });
		}
		var aReturn = {"panel1" : panel1,  "panel2" : panel2};
		if (_self.panel1Data != undefined) {
			aReturn.panel1Data = _self.panel1Data; 
		}
		return aReturn;
	};
	
	$.fn.SortablePanels = function(options) {
		var m_options = {
			clean : true,
			panel1 : "list_of_object_fields",
			panel2 : "list_of_selected_fields",
			connected_class : "connectedSortable",
			panel1_list : [],
			panel2_list : [],
			nonMoveablePropertyName : 'fixed',
			ShowCheckbox : 'false',
			sort : true
		};
                
		m_options = $.extend(m_options, options || {});
		
		if(m_options.clean == true) {
                    $("#" + m_options.panel1 + " ul, #" + m_options.panel2 + " ul")
                        .children().remove();
		}
                var element = $(this);
		init_lists();
		
		element.find("#" + m_options.panel1 + " ul, #" + m_options.panel2 + " ul").sortable({
			connectWith : "." + m_options.connected_class,
			
			over: function(ev, ui) {
				setTimeout(removeAllSelect, 100);
				stopBubble(ev);
				//if (jQuery.browser.msie == null || jQuery.browser.msie == false) ui.item.bind('dblclick', function(event) { move_to(event, accepting, owner); } );	
			},
			receive : function(event, ui)
			{
				//console.log('drop');
                                afterReplace(event, ui);
				setTimeout(removeAllSelect, 100);
				stopBubble(event);
			},
                        stop : function(event, ui) {
//                            console.log('stop');
                            if (jQuery(ui.item).children('div').size() > 0) {
                                replaceMultipleDD(jQuery(ui.item));
                            }
                            //console.log('drop2');
                        },
                        start : function(event, ui) {
//                            console.log('start');
                            var dragEl = jQuery(ui.item);
                            //console.log(ui);
                            var els = dragEl.parent().children("li.is-selected-item[id]");
                            if (els.length > 1) {
                                rebuildMultipleDD(dragEl, els)
                            }
                        }
		});
		
                function rebuildMultipleDD(starterEl, els) {
                    var sHTML = '';
                    els.each(function(){
                        var el = $(this);
                        
                        sHTML += '<div data-id=' + el.attr('id') + '>' + el.text() + '</div>';
                    });
                    
                    starterEl.html(sHTML).height('auto').addClass('ui-sortable-multiple');
                    els.not(starterEl).hide();
                }
                
                function replaceMultipleDD(starterEl) {
                    var bAfter = false;
                    var sRealText;
                    jQuery(starterEl).children('div').each(function() {
                        var el = $(this);
                        var li = element.find('li#' + el.data('id'));
                        if (starterEl.attr('id') == el.data('id')) {
                            bAfter = true;
                            sRealText = el.text();
                            return;
                            
                        }
                        if (!bAfter) {
                            li.insertBefore(starterEl);
                        } else {
                            li.insertAfter(starterEl);
                        }
                        li.show();
                    });
                    setTimeout(removeAllSelect, 100);
                    starterEl.removeClass('ui-sortable-multiple').text(sRealText);
                }
                
		function stopBubble(oEvent){
			if(oEvent && oEvent.stopPropagation)
				oEvent.stopPropagation();
			else
				window.event.cancelBubble = true;
		}
		
		function afterReplace(p_event, p_ui)
		{
			if(p_ui.item.hasClass('non-moveable'))
				$(p_ui.sender).sortable('cancel');
			
			var itemId = p_ui.item.parents('#list_of_object_fields').attr('id');
			if (typeof(itemId) == 'undefined') {
				itemId = p_ui.item.parents('#list_of_selected_fields').attr('id')
			}
			
			var senderId = p_ui.sender.parents('#list_of_object_fields').attr('id');
			if (typeof(senderId) == 'undefined') {
				senderId = p_ui.sender.parents('#list_of_selected_fields').attr('id')
			}
			
			if (
				(typeof(itemId) == 'undefined' || typeof(senderId) == 'undefined') &&
				(typeof(itemId) != 'undefined' || typeof(senderId) != 'undefined')
			) {
				$(p_ui.sender).sortable('cancel');
			}
			
			////----////
			
			var citemId = p_ui.item.parents('#list_of_object_creating_fields').attr('id');
			if (typeof(citemId) == 'undefined') {
				citemId = p_ui.item.parents('#list_of_selected_creating_fields').attr('id')
			}
			
			var csenderId = p_ui.sender.parents('#list_of_object_creating_fields').attr('id');
			if (typeof(csenderId) == 'undefined') {
				csenderId = p_ui.sender.parents('#list_of_selected_creating_fields').attr('id')
			}
			
			if (
				(typeof(citemId) == 'undefined' || typeof(csenderId) == 'undefined') &&
				(typeof(citemId) != 'undefined' || typeof(csenderId) != 'undefined')
			) {
				$(p_ui.sender).sortable('cancel');
			}
			AddingCheckbox();
		}
		
		function move_to(event, accepting, owner) {

			var current_target = $(event.target);
			if(m_options.ShowCheckbox == 'true' 
                             && $(current_target).is('.is-req, .label-for-custom-required, .label-of-item-li') 
                        ) {
                                current_target = current_target.parent();
                        }
			accepting.find("ul").append($(current_target));
			$(current_target).unbind('dblclick');
			//if (jQuery.browser.msie == null || jQuery.browser.msie == false) 
			$(current_target).bind('dblclick', function(event_) { 
                            move_to(event_, owner, accepting);
                            return false;
			});	
                        AddingCheckbox();	
		}
		
		function afterDblClick() {
//			alert('111');
		}

    /*function adds checkbox for selecting a required field*/
    
		function AddingCheckbox() {
                    if(m_options.ShowCheckbox == 'true') {
			//<div style="color:#a00; float:right;" id="label_for_custom_required">make required &nbsp;</div>
                        var req = '<input type="checkbox" class="is-req"/>'
                            + '<div style="color:#a00; float:right;" class="label-for-custom-required">make&nbsp;required&nbsp;</div>';
                        element.find("#" +  m_options.panel2 + " ul li:not(.non-moveable):not(:has(.is-req))")
                            .append(req)
                            .find('input[type="checkbox"]')
                                .dblclick(function(){return false})
                                .click(function(){
                                    $(this).parent().css('border', $(this).attr('checked') ? '1px solid #a00' : '');
                                });
                                
                        element.find("#" +  m_options.panel1 + " ul li").css('border','')
                            .find('input[type="checkbox"], .label-for-custom-required').remove();
                    }                
                }
		
		function sortLeftPanel() {
                    var buf;
                    for( var i = 0; i < m_options.panel1_list.length; i++ ) {
                        for( var j = 0; j < m_options.panel1_list.length - i - 1; j++ ) {
                            if (m_options.panel1_list[j].value > m_options.panel1_list[j + 1].value) {
                                buf = m_options.panel1_list[j];
                                m_options.panel1_list[j] = m_options.panel1_list[j + 1];
                                m_options.panel1_list[j + 1] = buf;
                            }
                        }
                    }
                }
		


		function init_lists() {
			sortLeftPanel();
			if (m_options.panel1 == 'list_of_all_calendars' 
				&& (m_options.panel1_list == undefined || m_options.panel1_list.length < 1)
			) {
				var oPanel = element.find("#list_of_all_calendars ul");
//				console.log(oPanel);
				oPanel.addClass('_waiting');
				jQuery.get('/apex/CA_AjaxResponces?event=getUnVisibleCalendars', function(data){
					m_options.panel1_list = data;
					_buildPanel(m_options.panel1, m_options.panel1_list);
					_self.panel1Data = data;
					oPanel.removeClass('_waiting');
				}, 'json')
			} else {
				_buildPanel(m_options.panel1, m_options.panel1_list);
			}
			_buildPanel(m_options.panel2, m_options.panel2_list);

			// call function AddingCheckbox and set attribute checked for
			// checkboxes at initialization
			AddingCheckbox(element);
			_setRequiredCheckbox(m_options.panel2, m_options.panel2_list)

			element.find("#" + m_options.panel2 + " ul").on('click', "li",
					function(evt) {
						var elem = $(this);
						clickToEvent(evt, elem, m_options.panel2, element);
					}).on(
					'dblclick',
					"li",
					function(event) {

						move_to(event, element.find("#" + m_options.panel1),
								element.find("#" + m_options.panel2));
						setTimeout(removeAllSelect, 100);
						stopBubble(event);
						return false;
					});

			element.find("#" + m_options.panel1 + " ul")
				.on('click', "li",
					function(evt) {
						var elem = $(this);
						clickToEvent(evt, elem, m_options.panel1, element);
					})
				.on('dblclick', "li",
					function(event) {
						move_to(event, element.find("#" + m_options.panel2),
								element.find("#" + m_options.panel1));
						setTimeout(removeAllSelect, 100);
						stopBubble(event);
						return false;
					});
			element.find('tbody > tr:first-child > td > div > span').bind(
					'click',
					function(event) {
						if (element.find('tbody > tr > td > div > span').index(
								this) == 0) {
							moveMultiSelected(event, m_options.panel1,
									m_options.panel2, element);
						} else {
							moveMultiSelected(event, m_options.panel2,
									m_options.panel1, element);
						}
					});
			element.find('.non-moveable').unbind('dblclick').draggable(
					'disable').css('border', '1px solid #a00');

		}
		
		function removeAllSelect() {
                    element.find("li").removeClass('is-selected-item').addClass('ui-state-default');
		}
		
		function clickToEvent(evt, elem, panel, root) {
                    evt = (evt) ? evt : window.event;
                    var panelEl = $("#" + panel);
                    if (!evt.ctrlKey && !evt.shiftKey && !evt.metaKey) {
                        panelEl.find("ul li")
                            .removeClass('is-selected-item')
                            .addClass('ui-state-default');
                    }
                    if (!elem.hasClass('non-moveable')) {
                        elem.toggleClass('is-selected-item ui-state-default');
                    }
                    if (evt.ctrlKey || evt.metaKey) {
                        if (window.getSelection) {
                            window.getSelection().removeAllRanges();
                        } else if (document.selection && document.selection.clear) {
                            document.selection.clear();
                        }
                    } else if (evt.shiftKey && panelEl.data('last') != undefined) {
                        var idxFrom = panelEl.find('li').index(panelEl.data('last'));
                        var idxTo = panelEl.find('li').index(elem);
                        if (idxTo < idxFrom) {
                            var tmp = idxFrom; 
                            idxFrom = idxTo; 
                            idxTo = tmp;
                        }
                        
                        panelEl.find('li').slice(idxFrom, idxTo).addClass('is-selected-item');
                        
                    }
                    panelEl.data('last', elem);
                    
		}
		
		function moveMultiSelected(event, from, to, root) {
			var selectedObjs = element.find('#' + from).find('.is-selected-item');
			element.find('#' + to).find("ul").append(selectedObjs.toArray());
			selectedObjs.toggleClass('is-selected-item ui-state-default');
			AddingCheckbox(root);
		}
		
        function _buildPanel(sName, aData) {
            var oPanel = element.find("#" +  sName + " ul");
            for( var i = 0; i < aData.length; i++ ) {
                if (typeof(aData[i].value) != 'undefined') {
                    if (!(aData.calendarType != undefined && aData.calendarType == 'web')) {
                        oPanel.append('<li class="ui-state-default '+((aData[i][m_options.nonMoveablePropertyName])?('non-moveable'):('')) +'" id="' 
                            + aData[i].id + '">' 
                            + (m_options.ShowCheckbox == 'true' ? '<div style="float:left;" class="label-of-item-li">' : '')
                            +  aData[i].value 
                            + (m_options.ShowCheckbox == 'true' ? '</div>' : '')
                            + '</li>'
                        );
                    }
                }
            }                    
        }
        
        function _setRequiredCheckbox(sName, aData) {
            var oPanel = element.find("#" +  sName + " ul");
            for ( var i = 0; i < aData.length; i++ ) {
                if (typeof(aData[i].value) != 'undefined')  {
                    oPanel.find('li[id="' + aData[i].id+'"]').each(function() {
                        if (aData[i]['isRequiredCustom']) {
                            $(this).css('border','1px solid #a00')
                                .find('input[type="checkbox"]')
                                    .attr("checked","checked");
                        }        
                    });	
                }				
            }                     
        }		
                
                
	};
})(jQuery);
		
		
		
		
		


if (typeof(console) == 'undefined') {
	var console = {
			
	} ;
}
if (typeof(console.log) == 'undefined') {
	console.log = function(){}
}

if (typeof(console.time) == 'undefined') {
	console.time = function(){}
}

if (typeof(console.timeEnd) == 'undefined') {
	console.timeEnd = function(){}
}