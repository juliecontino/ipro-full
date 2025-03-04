/** 
 * @class weekView
 * 
 * Used for output data in week mode
 */
(function(){
    var self = {
        _css        : '/css/addon/chatter.css',
        _parent     : null,
        _div        : null,
        _dom        : {
            data    : null,
            settings : null
        },
        _params     : {},
        _comment    : {},
//        _active     : true,
        _sKeyMode   : null,
        _nKeyStartPos : 0,
        _nKeyEndPos : 0,
        _aMentions  : [],
        _aTopics    : []
        
    };
    var addon = {};

    /** 
    * public init
    *
    * Init all necessary data
    */

    addon.init = function (parent){
        self._parent = parent;
        self._parent.loadCss(self._css);
    }
    
    /** 
    * @public show
    * draw grid
    * @return void;
    */
    
    
    addon.show = function(div, aParams) {
        self._params = aParams;
        self._div = div;
//        self._active = true;
//        if (self._parent.options.session == undefined 
//            || self._parent.options.session == ''
//            || !self._parent._objects.checkProfile('api')
//        ) {
////            self._active = false;
//            var sHTML = "<div class=chatter_message>"
//                + self._parent.getText('addon_disabled_chatter', 'Chatter is not available for users with API disabled')
//                + "</div>";
//            self._div.append(jQuery(sHTML));
//            return;
//        }
        
        if (!self._parent._objects.isFeed(self._params.object)
            || (
                (   
                    self._parent._addons['chatter'].settings.sflimit != true 
                    && self._parent._addons['chatter'].settings.sflimit != 'true'
                )
                && 
                (self._parent._addons['chatter'].settings.objects == undefined
                    || self._parent._addons['chatter'].settings.objects.indexOf(self._params.object) < 0
                )
            )
        ) {
//            self._active = false;
            var sHTML = "<div class=chatter_message>"
                + self._parent.getText('addon_object_disabled_chatter', 'This object is disabled for Chatter')
                + "</div>";
            self._div.append(jQuery(sHTML));
            return;
        }
        if (self._params.event.isReccurence() 
            || (self._params.detail != undefined 
                && self._params.detail.data != undefined
                && self._params.detail.data.ischild == true
            )
        ) {
            var sHTML = "<div class=chatter_message>"
                + self._parent.getText('addon_reccurence_disabled_chatter', 'Recurrent or Child Events are disabled for Chatter')
                + "</div>";
            self._div.append(jQuery(sHTML));
            return;
        }
        if (self._dom.data == null || self._dom.data.html() == '' || self._dom.data.parents('.CA_popup').size() < 1) {
            self._buildHTML();
            self._initEvents();
        }
        self._refresh();
    }
    
    addon.showSettings = function(div, aParams) {
        
        self._div = div;
        self._params = aParams;
        if (self._dom.settings == null || self._dom.settings.html() == '') {
            self._parent._addQueue([function(){
                    if (self._parent.params.fastStart == true) {
                        self._parent._objects.refreshSimple();
                    }
                }, function(){
                    self._buildSettingsHTML();
                }
            ]);
        }
    }
    
    addon.getSettings = function(){
        var aResult = {};
        if (self._dom.settings == null) {
            return null;
        }
        self._dom.settings.find('[data-field]').each(function(nIdx, oEl){
            oEl = jQuery(oEl);
            var oField = oEl.find('select, input, textarea'),
                sVal = oField.val();
            if (oEl.data('type') == 'boolean') {
                sVal = oField.is(':checked') ? true : false;
            } else if (oEl.data('type') == 'multiselect') {
                sVal = sVal != undefined && sVal.length > 0 ? sVal.join(",") : "";
            }
            aResult[oEl.data('field')] = sVal;
        });
        return aResult;
    }
    
    addon.resetSettings = function(){
        var aResult = {};
        if (self._dom.settings == null) {
            return null;
        }
        
        jQuery.each(self._parent._addons['chatter'].settings, function(sKey, mVal){
            var oEl = self._dom.settings.find('[data-field="' + sKey + '"]');
            if (oEl.size() < 1) {
                return;
            }
            
            var oField = oEl.find('select, input, textarea');
            if (oEl.data('type') == 'boolean') {
                oField.prop('checked', mVal);
            } else if (oEl.data('type') == 'multiselect') {
                if (typeof(mVal) == 'string') {
                    mVal = mVal.split(',');
                }
                oField.val(mVal);
            } else {
                oField.val(mVal);
            }
        });
    }
    

    /** 
    * @public resize
    *
    * Clear offset cache when resize
    *
    */
    addon.resize = function(){
    }
    
    addon.refresh = function(){
        self._refresh();
    }
    
    addon.action = function(sAction, el, evt) {
        if (typeof(self['_' + sAction + 'Action']) != 'undefined') {
            return self['_' + sAction + 'Action'](el, evt);
        }
    }
    
    addon.clearView = function() {
        self._dom.data = null;
        self._dom.settings = null;
        
    }

    addon.beforeHide = function(sNewMode) {
    }

    /**
     * @private _buildRightAgendaGrid
     * Draw grid
     **/
    
    
    self._buildHTML = function() {
        
        var sHTML = "<form class='_post_form'><textarea></textarea>"
                + '<i class=tag_datalist></i>'
                + "<b>"
                + "<span class='simple_button' data-action='addPost'>"
                + self._parent.getText('addon_share', 'Share')
                + "</span>"
                + "<span class='simple_button' data-action='cancelPost'>" 
                + self._parent.getText('cancel', 'Cancel')
                + "</span>"
                + '</b>'
                + "</form>"
                + "<div class='_posts' data-last=''></div>"
                + "<span class='add_post_button' data-action='comment'></span>"
                + "<span class='simple_button follow_button' data-action='follow' data-follow=''>"
                + self._parent.getText('addon_follow', 'Follow')
                + "</span>";
        
        self._div.append(jQuery(sHTML));
        self._dom.data = self._div.find('._posts');
        self._dom.form = self._div.find('._post_form');
    }
    
    self._initEvents = function(){
        var sTag = '', nIdTag, nTimer = null,
            aCheckKeys = [40, 38, 13, 27],
            bTagKeyMode  =false;
        var oEl = self._dom.form.find('textarea');
        oEl.on('keydown', function(evt){
             if (self._sKeyMode != null && self._sKeyMode != '' && aCheckKeys.indexOf(evt.keyCode) >= 0) {
                switch (evt.keyCode) {
                    case 40:
                        self._changeSelectedTag(1);
                        break;
                    case 38:
                        self._changeSelectedTag(-1);
                        break;
                    case 13:
                        var oSel = self._dom.form.find('.tag_datalist > div._sel');
                        if (oSel.size() > 0) {
                            self._selTagAction(oSel);
                        }
                    case 27:
                        self._cancelTagAction();
                        break;
                }
                bTagKeyMode = true;
                return false;
            }
        });
        oEl.on('keyup', function(evt){
            var nPos = oEl.prop('selectionStart'),
                sBody = oEl.val(),
                sMode = "";
            if (bTagKeyMode) {
                bTagKeyMode = false;
                return false;
            }
           
            
            for (var nJ = nPos; nJ >= 0; nJ--) {
                if (sBody[nJ] == "\n") {
                    return true;
                } else if (sBody[nJ] == "@" || sBody[nJ] == "#") {
                    if ((nJ > 0 && (sBody[nJ - 1] != "\n" && sBody[nJ - 1] != " "))
                        || (nJ < sBody.length && sBody[nJ + 1] == '{')
                        || (nJ < sBody.length && sBody[nJ + 1] == '[')
                    ){
                        return true;
                    }
                    sMode = sBody[nJ] == "@" ? "mention" : "topic";
                    sTag = sBody.substr(nJ + 1, nPos);
                    self._nKeyStartPos = nJ + 1;
                    self._nKeyEndPos = nPos;
                    break;
                }
            }
            
            
            if (sMode != '' && sTag != '') {
                self._sKeyMode = sMode;
//                if (evt.keyCode == 27) {
//                    self._dom.form.removeClass('show_tag');
//                    return;
//                }

                if (nTimer != null) {
                    clearTimeout(nTimer);
                }
                if (sMode == 'topic' && sTag.length < 2) {
                    return;
                }
                nTimer = setTimeout(function(){
                    self._getTag(sTag);
                }, 300);
            } else if (evt.keyCode == 27) {
                self._cancelPostAction();
            }
            return;
        });
    }
    
    self._buildSettingsHTML = function() {
        var aSettings = self._parent._addons['chatter'].settings,
            aObjects = self._parent._objects.getObjectsList();
        var sHTML = '<div class="block_fields">'
                + '<div data-type="boolean" data-field="sflimit" class="field">'
                    + '<div class="name">' 
                    + self._parent.getText('addon_use_tracking', 'Use Salesforce Tracking Feed for Objects')
                    + '<span></span><br>'
                    + '<span class="_info">' 
                    + self._parent.getText('addon_uncheck_to enable', 'Uncheck it to enable additional restriction for chatter objects')
                    + '</span>'
                    + '</div>'
                    + '<div class="element" style="vertical-align:top">'
                        + '<input type="checkbox" name=addon[chatter][sflimit] value="1" ' 
                        + (aSettings.sflimit == true || aSettings.sflimit == 'true' ? 'checked="checked" ' : '') 
//                        + ' data-action="changeCatterSettings"'
                        + '/>'
                    + '</div>'
                + '</div>'
                + '<div data-type="multiselect" data-field="objects" class="field">'
                    + '<div class="name" style="vertical-align:top;padding-top:3px;">' 
                    + self._parent.getText('addon_chatter_objects', 'Chatter objects')
                    + '<span></span><br>'
                    + '<span class="_info">' 
                    + self._parent.getText('addon_select_objects', 'Select objects to limit chatter feed')
                    + '</span>'
                    + '</div>'
                    + '<div class="element">'
                        + '<select name=addon[chatter][objects] multiple size=5 ' 
                        + (aSettings.sflimit == true || aSettings.sflimit == 'true' ? 'disabled' : '') + '>';
        var aSelectedObjs = aSettings.objects != undefined
            ? aSettings.objects
            : [];
        aSelectedObjs = typeof(aSelectedObjs) == 'string' ? aSelectedObjs.split(",") : aSelectedObjs;
        aObjects.quickSort('label');
        for (var nI = 0; nI < aObjects.length; nI++) {
            if (!aObjects[nI].feedEnabled) {
                continue;
            }
            sHTML += '<option value="' + aObjects[nI].name + '" ' 
                + (aSelectedObjs.indexOf(aObjects[nI].name) >= 0 ? " selected " : "")
                + '>'
                + aObjects[nI].label.htmlspecialchars()
                + '</option>';
        }
        sHTML += '</select></div>'
            + '</div>'
        ;
        self._dom.settings = jQuery(sHTML);
        self._div.append(self._dom.settings);
        self._dom.settings.on('change', 'input[type="checkbox"]', function(evt){
	    var oEl = jQuery(evt.target);
	    self._dom.settings.find('select').prop('disabled', oEl.is(':checked'));
	});

    }
    
    self._refresh = function(){
        if (!self._refresh || !self._dom.data) {
            return;
        }

        var sDate = self._dom.data.data('last'),
            aRequestData = {
                "cache" : false,
                "url"   : "/services/data/v37.0/chatter/feeds/record/" + self._params.id + "/feed-elements",
                "mode"  : "record",
                "data" : {id      : self._params.id}
            };
        if (sDate != '') {
            aRequestData.data.updatedSince = sDate;
            aRequestData.data.sort = 'LastModifiedDateDesc';
        }
//        if (self._parent._objects.checkProfile('api')) {
//            self._parent._objects.restAPI({
//                "url" : "/services/data/v37.0/chatter/feeds/record/" + self._params.id + "/feed-elements",
//                "cache" : false,
//                "data" : aRequestData,
//                "func" : function(aResult) {
//                    if (aResult.elements.length < 1) {
//                        return;
//                    }
//                    self._buildFeeds(aResult.elements);
//                    self._dom.data.data('last', aResult.updatesToken);
//                }
//            })
//        } else {
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                if (aResult.elements.length < 1) {
                    return;
                }
                self._buildFeeds(aResult.elements);
                self._dom.data.data('last', aResult.updatesToken);
            });
//        }
    }
    
    self._buildFeeds = function(aData) {
        var sHTML = '', aEl,
            sFollow = "";
        for (var nI = 0; nI < aData.length; nI++) {
            aEl = aData[nI];
            var sLikeId = aEl.capabilities.chatterLikes != undefined && aEl.capabilities.chatterLikes.isLikedByCurrentUser == true
                ? aEl.capabilities.chatterLikes.myLike.id
                : "",
                nLikes = aEl.capabilities.chatterLikes != undefined && aEl.capabilities.chatterLikes.page.total != undefined
                    ? aEl.capabilities.chatterLikes.page.total
                    : 0;
            if (sFollow == '' && aEl.parent.mySubscription != null) {
                sFollow = aEl.parent.mySubscription.id;
            }
            sHTML += '<div data-feed="' + aEl.id + '">'
                + (aEl.actor != undefined ?'<img class="actor_foto" src="' + aEl.actor.photo.standardEmailPhotoUrl  + '" />' : "")
                + '<b class=_block>'
                + (aEl.title != undefined ?'<span class="title">' + aEl.title  + '</span>' : "")
                
                + (aEl.actor != undefined ?'<span class="actor">' + aEl.actor.displayName  + '</span>' : "")
                + (aEl.relativeCreatedDate != undefined ?'<span class="date">' + aEl.relativeCreatedDate  + '</span>' : "")
                + (self['_' + aEl.type + 'Type'] != undefined ? self['_' + aEl.type + 'Type'](aEl) : '')
                + (aEl.body != undefined ?'<div class="text">' 
                    + (aEl.body.messageSegments != undefined 
                        ? self._buildFeedBody(aEl.body.messageSegments) 
                        : aEl.body.text.nl2br()
                    )
                + '</div>' : "")
                + '<div class=actions>'
                    + '<a data-action=comment>'
                    + self._parent.getText('addon_comment', 'Comment')
                    + '</a>'
                    + '<a data-action=like data-total="' + nLikes + '" data-like="' + sLikeId + '">' 
                    + (sLikeId != '' 
                        ? self._parent.getText('addon_unlike', 'Unlike') 
                        : self._parent.getText('addon_like', 'Like')
                    ) 
                    + '</a>'
                    + (nLikes > 0
                        ? "<sup title='" + aEl.capabilities.chatterLikes.likesMessage.text.htmlspecialchars() + "'>(" + nLikes + ')</sup>'
                        : "<sup></sup>"
                    )
                + '</div>'        
                + '</b>'
        
                + (aEl.capabilities != undefined && aEl.capabilities.comments != undefined 
                    ? self._buildFeedComments(aEl.capabilities.comments.page.items)
                    : ""
                ) 
                + '</div>';
        }
        
        if (sFollow != '') {
            self._div.find('.follow_button').data('follow', sFollow)
                    .text(self._parent.getText('addon_unfollow', 'Unfollow'));
        }
        self._dom.data.prepend(sHTML);
        
    }
    
    self._buildFeedBody = function(aData) {
        var sHTML = '';
        for (var nI = 0; nI < aData.length; nI++) {
            switch (aData[nI].type) {
                case "Mention" :
                    sHTML += '<a class="_mention" data-action="showUrl" href="/' + aData[nI].record.id + '">' + aData[nI].text + "</a>";
                    break;
                case "Hashtag" :
                    sHTML += '<a class="_topic" data-action="showUrl" href="' 
                            + "/_ui/core/chatter/topics/TopicPage?name=" + aData[nI].tag + "&ref=hash_mention"
                            + '">' + aData[nI].text + "</a>";
                    
                    break;
                case "Text" :
                    sHTML += aData[nI].text.nl2br();
                    break;
            }
        }
        return sHTML;
    }
    
    self._buildFeedComments = function(aData) {
        var sHTML = '', aEl, sLikeId = "";
        for (var nI = 0; nI < aData.length; nI++) {
            aEl = aData[nI];
            sLikeId = aEl.myLike != null ? aEl.myLike.id : "";
            sHTML += '<div class="comment" data-comment="' + aEl.id + '">'
                + (aEl.user != undefined ?'<img class="actor_foto" src="' + aEl.user.photo.smallPhotoUrl  + '" />' : "")
                + '<b class=_block>'
                + (aEl.user != undefined ?'<span class="actor">' + aEl.user.displayName  + '</span>' : "")
                + (aEl.relativeCreatedDate != undefined ?'<span class="date">' + aEl.relativeCreatedDate  + '</span>' : "")
                + (aEl.body != undefined ?'<div class="body">' 
                    + (aEl.body.messageSegments != undefined 
                        ? self._buildFeedBody(aEl.body.messageSegments) 
                        : aEl.body.text.nl2br() 
                    )
                    + '</div>' : ""
                )
                + '<div class=actions>'
                    + '<a data-action=like data-total="' + aEl.likes.total + '" data-like="' + sLikeId + '">' + (sLikeId == '' ? 'Like' : 'Unlike') + '</a>'
                    + (aEl.likes.total != undefined && aEl.likes.total > 0
                        ? "<sup title='" + aEl.likesMessage.text.htmlspecialchars() + "'>(" + aEl.likes.total + ')</sup>'
                        : "<sup></sup>"
                    )
                + '</div>'
                + '</b>'
                + '</div>';
        }
        if (sHTML != '') {
            sHTML = '<div class="comments">' + sHTML + '</div>';
        }
        return sHTML;
    }
    
    self._LinkPostType = function(aEl) {
        if (aEl.capabilities.link == undefined || aEl.capabilities.link.url == undefined) {
            return '';
        }
        return '<span class="link"><a href="' + aEl.capabilities.link.url.htmlspecialchars() + '" target=_blank>'
            + (aEl.capabilities.link.urlName != '' ? aEl.capabilities.link.urlName : aEl.capabilities.link.url).htmlspecialchars()
            + '</a></span>';
    }
    
    self._PollPostType = function(aEl, bOnlyResult) {
        if (aEl.capabilities.poll == undefined || aEl.capabilities.poll.choices.length  < 1) {
            return '';
        }
        var sHTML = "";
        if (bOnlyResult !== true) {
             sHTML +='<div class="poll">'
                    + "<span class=poll_title>" + aEl.body.text.nl2br() + '</span>'
            aEl.body.text = "";
        }
        for (var nJ = 0; nJ < aEl.capabilities.poll.choices.length; nJ++) {
            if (aEl.capabilities.poll.myChoiceId == undefined || aEl.capabilities.poll.totalVoteCount < 1) {
                sHTML += "<span>"
                    + '<input type=radio name="' + aEl.id + '" value="' + aEl.capabilities.poll.choices[nJ].id  + '">'
                    + aEl.capabilities.poll.choices[nJ].text
                    + '</span>';
            } else {
                var nSize = 100 * parseInt(aEl.capabilities.poll.choices[nJ].voteCountRatio / aEl.capabilities.poll.totalVoteCount);
                sHTML += "<span>"
                    + aEl.capabilities.poll.choices[nJ].text + '<br>'
                    + '<i style="width:' + parseInt(0.8 * nSize) + '%"></i>'
                    + aEl.capabilities.poll.choices[nJ].voteCountRatio
                    + " (" + nSize + "%)"
                    + '</span>';
            }
        }
        if (aEl.capabilities.poll.myChoiceId != undefined) {
            sHTML += '<span class=votes>Votes: ' + aEl.capabilities.poll.totalVoteCount + '</span>'
        } else {
            sHTML += '<span data-action=pollVote class="simple_button">' 
                    + self._parent.getText('addon_vote', 'Vote')
                    + '!</span>'
        }
        if (bOnlyResult !== true)  {
            sHTML += '</div>';
        }
        
        return sHTML;
    }
    
    self._ContentPostType = function(aEl) {
        if (aEl.capabilities.content == undefined || aEl.capabilities.content.downloadUrl == '') {
            return '';
        }
        var sHTML = "<span class=file>"
            + '<a href="' + aEl.capabilities.content.downloadUrl + '">'
            + aEl.capabilities.content.title.htmlspecialchars()
            + "</a></span>";
        return sHTML;
    }
    
    self._followAction = function(oEl, evt) {
        var sFollow = oEl.data('follow'),
            aRequestData ;
        if (sFollow == '') {
            aRequestData = {
                "post" : true,
                "url"   : "/services/data/v37.0/chatter/users/me/following",
                "mode"  : "following",
                "data" : {subjectId : self._params.id} 
            };
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                oEl.text('Unfollow').data('follow', aResult.id);
            });
//            self._parent._objects.restAPI({
//                "url"  : "/services/data/v37.0/chatter/users/me/following",
//                "post" : true,
//                "data" : JSON.stringify({subjectId : self._params.id}) ,
//                "func" : function(aResult) {
//                    oEl.text('Unfollow').data('follow', aResult.id);
//                }
//            });
        } else {
            aRequestData = {
                "HTTPType" : "DELETE",
                "url"   : "/services/data/v37.0/chatter/subscriptions/" + sFollow,
                "mode"  : "unfollow",
                "apexData" : {"folow" : sFollow} 
            };
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                oEl.data('follow', '').text('Follow');
            });
//            self._parent._objects.restAPI({
//                "url" : "/services/data/v37.0/chatter/subscriptions/" + sFollow,
//                "HTTPType" : "DELETE",
//                "data" : {} ,
//                "func" : function(aResult) {
//                    oEl.data('follow', '').text('Follow');
//                }
//            })            
        }
    }
    
    self._likeAction = function(oEl, evt) {
        var oComment = oEl.parents('[data-comment]'),
            oFeed = oEl.parents('[data-feed]'),
            sId = oComment.size() > 0 ? oComment.data('comment') : oFeed.data('feed'),
            aRequestData;
        if (oEl.data('like') != undefined && oEl.data('like') != '') {
            aRequestData = {
                "HTTPType" : "DELETE",
                "url"   : "/services/data/v37.0/chatter/likes/" + oEl.data('like'),
                "mode"  : "unlike",
                "apexData" : {"like" : oEl.data('like')} 
            };
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                var nTotal = parseInt(oEl.data('total')) - 1;
                oEl.next('sup').text(nTotal > 0 ? '(' + nTotal + ')' : '');
                oEl.text('Like');
                oEl.data('like', '');
                oEl.data('total', nTotal);
            });
            
//            self._parent._objects.restAPI({
//                "url" : "/services/data/v37.0/chatter/likes/" + oEl.data('like'),
//                "HTTPType" : "DELETE",
//                "data" : {} ,
////                "post" : true,
//                "func" : function(aResult) {
//                    var nTotal = parseInt(oEl.data('total')) - 1;
//                    oEl.next('sup').text(nTotal > 0 ? '(' + nTotal + ')' : '');
//                    oEl.text('Like');
//                    oEl.data('like', '');
//                    oEl.data('total', nTotal);
////                    oEl.data('id', aResult);
//                }
//            })
        } else {
            aRequestData = {
                "post" : true,
                "url"   : oComment.size() > 0
                        ? "/services/data/v37.0/chatter/comments/" + sId + "/likes"
                        : "/services/data/v37.0/chatter/feed-elements/" + sId + "/capabilities/chatter-likes/items",
                "mode"  : "like" + (oComment.size() > 0 ? 'Comment' : "Feed"),
                "apexData" : {"id" : sId} 
            };
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                 if (aResult.likedItem.id != undefined) {
                        var nTotal = 1 + parseInt(oEl.data('total'));
                        oEl.data('total', nTotal);
                        if (nTotal > 0) {
                            oEl.next('sup').text('(' + nTotal + ')');
                        }
                        oEl.text('Unlike');
                        oEl.data('like', aResult.id);
                    }
            });
            
//            self._parent._objects.restAPI({
//                "url" : oComment.size() > 0
//                        ? "/services/data/v37.0/chatter/comments/" + sId + "/likes"
//                        : "/services/data/v37.0/chatter/feed-elements/" + sId + "/capabilities/chatter-likes/items",
//                "data" : {} ,
//                "post" : true,
//                "func" : function(aResult) {
//                    if (aResult.likedItem.id != undefined) {
//                        var nTotal = 1 + parseInt(oEl.data('total'));
//                        oEl.data('total', nTotal);
//                        if (nTotal > 0) {
//                            oEl.next('sup').text('(' + nTotal + ')');
//                        }
//                        oEl.text('Unlike');
//                        oEl.data('like', aResult.id);
//                    }
//                }
//            })
        }
        
    }
    
    self._changeCatterSettingsAction = function(oEl, evt){
        self._dom.settings.find('select').prop('disabled', oEl.is(':checked'));
    }
    
    self._addPostAction = function(oEl, evt) {
        var sText = self._dom.form.find('textarea').val(),
            aSegments = [];
        if (sText == '') {
            return;
        }
        self._dom.form.find('textarea').val("");
        if (self._aMentions.length > 0 || self._aTopics.length > 0) {
            var aTag2Id = {};
            for (var nJ = 0; nJ < self._aMentions.length; nJ++) {
                aTag2Id[self._aMentions[nJ].name] = self._aMentions[nJ].id;
            }
            for (var nJ = 0; nJ < self._aTopics.length; nJ++) {
                aTag2Id[self._aTopics[nJ].name] = self._aTopics[nJ].name;
            }
            
            var aSplit = sText.split(/[@{|#[]/);
            for (var nJ = 0; nJ < aSplit.length; nJ++) {
                if (aSplit[nJ] == '') {
                    continue;
                }
                var nPos = aSplit[nJ].indexOf('}'),
                    nTopicPos = aSplit[nJ].indexOf(']'),
                    sMode = nTopicPos >= 0 ? "topic" : "mention";
                if (sMode == "topic") {
                    nPos = nTopicPos;
                }
                
                if (nPos >= 0) {
                    var sTag = aSplit[nJ].substr(0, nPos);
                    if (aTag2Id[sTag] != undefined) {
                        if (sMode == 'mention') {
                            aSegments.push({
                                "type"  : "Mention",
                                "id"    : aTag2Id[sTag]
                            });
                        } else {
                            aSegments.push({
                                "type"  : "Hashtag",
                                "tag"   : aTag2Id[sTag]
                            });
                            
                        }
                        aSplit[nJ] = aSplit[nJ].substr(nPos + 1);
                    }
                }
                if (aSplit[nJ] != '') {
                    aSegments.push({
                        "type"  : "Text",
                        "text"    : aSplit[nJ]
                    });
                }
            }
            self._aMentions.length = 0;
        }
        if (aSegments.length == 0) {
            aSegments.push({
                "text" : sText,
                "type" : "Text"
            });
        }
        
        if (self._comment.type == 'comment' || self._comment.type == 'feed') {
            return self._addComment(aSegments);
        }
        
        var aRequestData = {
                "post" : true,
                "url"   : "/services/data/v37.0/chatter/feed-elements/",
                "mode"  : "addPost",
                "data" : {
                        "subjectId" : self._params.id, 
                        "body" : {"messageSegments" : aSegments}, 
                        "feedElementType" : "FeedItem"
                },
                "apexData" : {"segments" : aSegments},
                error : function(jqXHR, sStatus){
                    self._parent.showNotify(
                        self._parent.getText('addon_chatter_error', 'Chatter API error')
                        + ': ' + sStatus, true
                    );
                    self._cancelPostAction();
                }
        };
        self._parent._objects.chatterAPI(aRequestData, function(aResult){
            self._refresh();
            self._cancelPostAction();
        });
//        self._parent._objects.restAPI({
//            "url" : "/services/data/v37.0/chatter/feed-elements/",
//            "data" : JSON.stringify({
//                "subjectId" : self._params.id, 
//                "body" : {"messageSegments" : aSegments}, 
//                "feedElementType" : "FeedItem"
//            }) ,
//            "post" : true,
//            "func" : function(aResult) {
//                self._refresh();
//                self._cancelPostAction();
//            },
//            error : function(jqXHR, sStatus){
//                self._parent.showNotify(
//                    self._parent.getText('addon_chatter_error', 'Chatter API error')
//                    + ': ' + sStatus, true
//                );
//                self._cancelPostAction();
//            }
//        })
    }
    
    self._addComment = function(aSegments) {
        var aRequestData = {
                "post" : true,
                "url"   : "/services/data/v37.0/chatter/feed-elements/" + self._comment.feed + '/capabilities/comments/items',
                "mode"  : "addComment",
                "data" : {
                    "body" : {
                            "messageSegments" : aSegments
                        }
                },
                "apexData" : {
                    "feed" : self._comment.feed,
                    "segments" : aSegments
                }
        };
        self._parent._objects.chatterAPI(aRequestData, function(aResult){
            var sHTML = self._buildFeedComments([aResult]);
            self._dom.data.find('[data-feed="' + self._comment.feed + '"]').append(sHTML);
            self._cancelPostAction();
        });
        
//        self._parent._objects.restAPI({
//            "url" : "/services/data/v37.0/chatter/feed-elements/" + self._comment.feed + '/capabilities/comments/items',
//            "data" : JSON.stringify({
//                "body" : {
//                    "messageSegments" : aSegments
//                }, 
//            }) ,
//            "post" : true,
//            "func" : function(aResult) {
//                var sHTML = self._buildFeedComments([aResult]);
//                self._dom.data.find('[data-feed="' + self._comment.feed + '"]').append(sHTML);
//                self._cancelPostAction();
//            }
//        })
    }
    
    self._cancelPostAction = function(){
        self._div.removeClass('show_form');
        self._dom.form.removeClass('show_tag');
        self._sKeyMode = null;
    }
    
    self._commentAction = function(oEl, evt){
        self._div.addClass('show_form');
//        self._dom.form.addClass('show');
        self._dom.form.find('textarea').focus();
        var oParent = oEl.parents('[data-comment], [data-feed]'),
            sType,
            nId, nFeed;
        switch (oParent.size()) {
            case 2 :
                sType = "comment";
                nId = oParent.eq(0).data('comment');
                nFeed = oParent.eq(1).data('feed')
                break;
            case 1 :
                sType = "feed";
                nId = oParent.eq(0).data('feed');
                nFeed = nId;
                self._dom.form.find('.simple_button[data-action="addPost"]')
                    .text(
                        self._parent.getText('addon_comment', 'Comment')
                    );
                break;
            case 0 :
                self._dom.form.find('.simple_button[data-action="addPost"]')
                    .text(
                        self._parent.getText('addon_share', 'Share')
                    );
                sType = "post";
                nId = self._params.id;
                nFeed = "";
                break;
        }
        self._comment = {type : sType, id : nId, feed : nFeed};
        return false;
    }
    
    
    self._pollVoteAction = function(oEl, evt){
        var oPoll = oEl.parents('.poll'),
            sValue = oPoll.find('input:checked').val(),
            nFeed = oPoll.parents('[data-feed]').data('feed');
        if (sValue == '') {
            self._parent.showNotify(
                self._parent.getText('addon_chatter_error', 'Chatter API error')
                + ': Select Poll Option Value', true
            );
        }
        var aRequestData = {
                "HTTPType" : "PATCH",
                "url"   : "/services/data/v37.0/chatter/feed-elements/" + nFeed + "/capabilities/poll/",
                "mode"  : "pollVote",
                "data" : {"myChoiceId" : sValue},
                "apexData" : {"feed" : nFeed}
        };
        self._parent._objects.chatterAPI(aRequestData, function(aResult){
            var sHTML = self._PollPostType({
                id : nFeed,
                capabilities : {
                    poll : aResult
                }
            }, true);
            oPoll.children('span').not('.poll_title').remove();
            oPoll.append(sHTML);
        });    
//        self._parent._objects.restAPI({
//            "url" : "/services/data/v37.0/chatter/feed-elements/" + nFeed + "/capabilities/poll/",
//            "data" : JSON.stringify({
//                "myChoiceId" : sValue
//            }),
//            "HTTPType" : "PATCH",
//            "func" : function(aResult) {
//                var sHTML = self._PollPostType({
//                    id : nFeed,
//                    capabilities : {
//                        poll : aResult
//                    }
//                }, true);
//                oPoll.children('span').not('.poll_title').remove();
//                oPoll.append(sHTML);
//            }
//        })
    }
    
    self._selTagAction = function(oEl, evt) {
        self._dom.form.removeClass('show_tag');
        if (oEl.data('value') == undefined) {
            oEl = oEl.parents('[data-value]');
        }
        
        if (oEl.data('value') != undefined) {
            var oText = self._dom.form.find('textarea'),
                sText = oText.val();
            sText = sText.substr(0, self._nKeyStartPos) 
                + (self._sKeyMode == 'mention' ? '{' : '[')
                + oEl.data('value')
                + sText.substr(self._nKeyEndPos, sText.length) 
                + (self._sKeyMode == 'mention' ? '}' : ']');
            if (self._sKeyMode == 'mention') {
                self._aMentions.push({
                    id : '' + oEl.data('id'),
                    name : '' + oEl.data('value')
                });
            } else {
                self._aTopics.push({
                    id : '' + oEl.data('id'),
                    name : '' + oEl.data('value')
                });
            }
        }
        oText.val(sText).focus();
        self._sKeyMode = null;
//        console.log(oEl.data('id') + ' / ' + oEl.data('value'));
    }
    
    self._cancelTagAction = function(){
        self._dom.form.removeClass('show_tag');
        self._sKeyMode = null;
    }
    
    self._changeSelectedTag = function(nDir) {
        var oEl = self._dom.form.find('.tag_datalist > div._sel'),
            oNewEl = oEl[nDir > 0 ? "next" : "prev"]();
        if (oNewEl.size() > 0) {
            oEl.removeClass('_sel');
            oNewEl.addClass('_sel');
        }
        
        
    }
    
    self._getTag = function(sText) {
        var aRequestData;
        if (self._sKeyMode == 'mention') {
            
            aRequestData = {
                "cache" : false,
                "url"   : "/services/data/v37.0/chatter/mentions/completions",
                "mode"  : "getTagMention",
                "data" : {
                    "page"      : 0,
                    "pageSize"  : 50,
                    "q"         : sText,
                    "type"      : "All",
                    "contextId" : self._params.id
                }
            };
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                self._fillMentions(aResult.mentionCompletions, sText);
            });   
        
            
//            self._parent._objects.restAPI({
//                "url" : "/services/data/v37.0/chatter/mentions/completions",
//                "cache" : false,
//                "data" : {
//                    "page"      : 0,
//                    "pageSize"  : 50,
//                    "q"         : sText,
//                    "type"      : "All",
//                    "contextId" : self._params.id
//                },
//                "func" : function(aResult) {
//                    self._fillMentions(aResult.mentionCompletions, sText);
//                }
//            });
        } else {
            aRequestData = {
                "cache" : false,
                "url"   : "/services/data/v37.0/connect/topics",
                "mode"  : "getTagTopics",
                "data" : {
                    "page"      : 0,
                    "pageSize"  : 50,
                    "q"         : sText,
                    "sort"      : "popularDesc"
                }
            };
            self._parent._objects.chatterAPI(aRequestData, function(aResult){
                self._fillTopics(aResult.topics, sText);
            });   
        
//            self._parent._objects.restAPI({
//                "url" : "/services/data/v37.0/connect/topics",
//                "cache" : false,
//                "data" : {
//                    "page"      : 0,
//                    "pageSize"  : 50,
//                    "q"         : sText,
//                    "sort"      : "popularDesc"
//                },
//                "func" : function(aResult) {
//                    self._fillTopics(aResult.topics, sText);
//                }
//            });
        }
    }
    
    self._fillMentions = function(aData, sText) {
        var sHTML = '',
            oReplace = new RegExp(sText, "gi");
        self._dom.form.addClass('show_tag');
        
        for (var nI = 0; nI < aData.length; nI++) {
            sHTML += '<div data-action="selTag" '
                + ' data-id="' + aData[nI].recordId + '" '
                + ' data-value="' + aData[nI].name.htmlspecialchars() + '"' 
                + (nI == 0 ? " class='_sel' " : "")
            + '>'
                + '<img src="' + aData[nI].photoUrl + '">'
                + aData[nI].name.replace(oReplace, '<span>' + sText + '</span>')
            + '</div>';
        }
        self._dom.form.children('.tag_datalist').html(sHTML);
    }
    
    self._fillTopics = function(aData, sText) {
        var sHTML = '',
            oReplace = new RegExp(sText, "gi");
        self._dom.form.addClass('show_tag');
        
        sHTML += '<div data-action="selTag" '
            + ' data-id="" '
            + " class='_sel' "
            + ' data-value="' + sText.htmlspecialchars() 
        + '">'
            + sText + 
            ' (' + self._parent.getText('addon_add_topic', 'Add New Topic') + ')'
        + '</div>';

        for (var nI = 0; nI < aData.length; nI++) {
            sHTML += '<div data-action="selTag" '
                + ' data-id="' + aData[nI].id + '" '
                + ' data-value="' + aData[nI].name.htmlspecialchars() 
            + '">'
                + aData[nI].name.replace(oReplace, '<span>' + sText + '</span>')
            + '</div>';
        }
        self._dom.form.children('.tag_datalist').html(sHTML);
    }
    
    jQuery.calendarAnything.appendAddon('chatter', addon);
})();