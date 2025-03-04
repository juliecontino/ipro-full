/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */





function show_object(data, title)  {
//    console.log(data);
    
    if (typeof(data.length) == 'undefined' || data.length < 1) {
        return;
    }
    
    var self = {
        callee : arguments.callee
        
    };
    
    self._show_object_by_type = function (val) {
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
    
    
    self._init = function(){
        self.div = jQuery('#show_object');
        
        if (self.div.size() < 1) {
            self._addCss();
            self.div = jQuery('<div id=show_object>'
                + '<ul class=show_object_tabs></ul><div class=close>X</div></div>'
            ).appendTo('body');
            self.callee.counter = 0;
            
            self.div.on('click', 'div.close', function(){
                self.div.hide()
            });
            self.div.on('click', 'ul > li', function(){
                self._showTab(jQuery(this).data('id'));
            });
            self.div.on('dblclick', 'ul > li', function(){
                self._closeTab(jQuery(this).data('id'));
            });
        }
        self._counter = ++self.callee.counter;
        self.tabs = self.div.children('.show_object_tabs');
        
    }
    
    self._addCss = function() {
        var strCSS = ''
            + '#show_object {position:fixed;top:15%;left:15%;right:15%;bottom:15%;background-color:#fff;border:1px solid gray;box-shadow:0px 0px 10px #000 ;padding:5px;z-index:999;overflow-y:auto;overflow-x:auto;}'
            + '#show_object ul.show_object_tabs{height:25px;display:inline-block;overflow: hidden;list-style: none;border-collapse: collapse;margin:0px;padding:0px;vertical-align: top;}'
            + '#show_object ul.show_object_tabs > li{padding:0px;border-collapse: collapse;display:inline-block;text-align: center;border:1px solid #ddd;border-top-right-radius:5px;border-top-left-radius:5px;background-color:#eee;margin-right:2px;cursor:pointer;font-size:10px;color:#aaa}'
            + '#show_object ul.show_object_tabs > li:hover, #show_object ul.show_object_tabs > li.sel{background-color:#fff;color:black;font-weight:bold}'
            + '#show_object > table{position:absolute;top:25px;bottom:5px;left:10px;right:100%;font-size:10px;font-weight:normal;background-color:#aaa;display:none;}'
            + '#show_object > table.sel{display:table;}'
            + '#show_object > div.close{position:absolute;top:3px;right:10px;border-radius:10px;height:10px;width:10px;cursor:pointer;background-color:white;color:red;font-size:12px;font-weight:bold;}';
        
        if (jQuery.support.style){
            jQuery('head').append('<style>' + strCSS + '</style>');
        } else {
            var oStyle = document.createElement('style');
            oStyle.setAttribute("type", "text/css");
            jQuery('head').append(oStyle);
            oStyle.styleSheet.cssText = strCSS;
        }        
    }
    
    self._buildTable = function(data) {
        var firstEl = data[0];
        var sHTML = '<table cellspacing=1 data-id="' + self._counter + '"><thead><th>#</th>';
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
                ? (typeof(el[fieldList[nI]]) == 'object' 
                    ? self._show_object_by_type(el[fieldList[nI]]) 
                    : el[fieldList[nI]])
                : "-";
                sHTML += '</td>';
            }
            sHTML += '</tr>';
        });
        sHTML += '</tbody></table>';
        self.div.append(sHTML);
        
    }
    
    self._addTab = function(title) {
        title = title || "#" + self._counter;
        self.tabs.append('<li data-id=' + self._counter + '>' + title + '</li>');
    }
    
    self._showTab = function(i) {
        i = i || self._counter;
        self.tabs.children().removeClass('sel').filter('li[data-id="' + i + '"]').addClass('sel');
        self.div.children('table').removeClass('sel').filter('[data-id="' + i + '"]').addClass('sel');
    }
    
    self._closeTab = function(i) {
        i = i || self._counter;
        self.tabs.children().filter('li[data-id="' + i + '"]').remove();
        self.div.children('table').filter('[data-id="' + i + '"]').remove();
    }
    
    
    self._init();
    
    //self.showEl = self._getObjectDiv();

    sHTML = self._buildTable(data);
    self.div.show();
    self._addTab(title);
    self._showTab();
    
}    
