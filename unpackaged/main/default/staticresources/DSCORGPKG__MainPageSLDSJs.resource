var myVarTech;
var searchCriteriaScoped = 0;
var searchCriteriaNoScope = 0;
var myVar;
var hitCountVar;
var reportNotSubmited;
var reportSubmited;
var startTotalIndustryAnyVar = false;
var compnysizepick = true;
var techset = new Set();
var totSelsize = 0;
var techMap = new Map();
$(document).ready(function() {
    try {
        jqyeryInitialization();
    }catch (e) {}
});

function isLightningExperienceOrSalesforce1() {
    return ((typeof sforce != 'undefined') && sforce && (!!sforce.one));
}


function checkCompanyFilled() {
    if ($("[id*='searchKeyword']").val() == null || $("[id*='searchKeyword']").val() == "") {
        alert('Please Enter the company name.');
    } else {
        showStatusForAll('companyDivProcess');
        basicsearch();
    }
}

function after3SecSearch() {
    $("[id*='goSearch']").click();    
}

function compantSearchBarInit(){
    $("[id*='searchKeyword']").keyup(function(event) {
        clearTimeout(myVar);
        var searchStr = $("[id*='searchKeyword']").val();
        var code = event.keyCode || event.which;
        if (code == 13 && searchStr.length >= 2) {
            after3SecSearch();
        } else if (code == 13 && searchStr.length == 0) {
            $("[id*='extAll']").click();
        } else if (searchStr.length >= 2) {
            myVar = setTimeout(after3SecSearch, 1000);
        }
    });
}

//SFNA-2143 : sagar sadhnani -- start
function checkUncheckAllType(type){
    //
    if($('#' + type + '_type:checked').length > 0){
        $('.' + type + '_innertype').prop( "checked", true );    
    }else{
        $('.' + type + '_innertype').prop( "checked", false );    
    }
}  

function checkUncheckType(type){
    //
    if($('.' + type + '_innertype:checked').length == $('.' + type + '_innertype').length){
        $('#' + type + '_type').prop( "checked", true );    
    }else{
        $('#' + type + '_type').prop( "checked", false );    
    }
}
function checkParentTypeOnLoad(){
    if($('.innertype') != undefined && $('.innertype').length > 0){
        $('.innertype').each(function(){
            if($('.' + $(this).next().data('count') + '_innertype:checked').length == $('.' + $(this).next().data('count') + '_innertype').length){
                $('#' + $(this).next().data('count') + '_type').prop( "checked", true );    
            }else{
                $('#' + $(this).next().data('count') + '_type').prop( "checked", false );    
            }    
        });
    }
}
//SFNA-2143 : sagar sadhnani -- end

function jqyeryInitialization(){
    convertCheckBoxToLDS();
    compantSearchBarInit();
    setChildwindow();
    
    if( $(".switch").find(".slider").length == 0 ){
        $(".switch").append('<div class="slider round"></div>');
    }
    
    
    
    
    
    $( window ).scroll(function() {
        resetPosForSearches();
    });
        
    $(".GeoSearchType").each(function() {
        var onck1 = $(this).attr("onclick");
       // 
        if( onck1.indexOf( $("#pg\\:frm\\:headq").val() ) != -1 ){
            $(this).click();
        }
    });
    
    // This is to get rid of the multiple clicks on the button (view on discoverOrg site)
    $( ".gotoDOrg").unbind( "click" );
    $(".gotoDOrg").click(function() {
        if (isLightningExperienceOrSalesforce1()) {
            var isFirefox = typeof InstallTrigger !== 'undefined';
            if (isFirefox) {
                $(".dorgLink").removeAttr('target');
                var targetURL = 'https://go.discoverydb.com/';
                targetURL = targetURL.substring(targetURL.lastIndexOf("srcUp('") + 7, targetURL.lastIndexOf("');"));
                window.open(decodeURIComponent(targetURL));
                return false;
            }
        }
        $(".dorgLink")[0].click();
        return false;
    });
    
    // This is to get rid of the multiple clicks on the button (my Account)
    $( ".myAccount").unbind( "click" );
    $(".myAccount").click(function() {
        if (isLightningExperienceOrSalesforce1()) {
            $(".myaccountLink").removeAttr('target');
           // 
        }
        $(".myaccountLink")[0].click();
        return false;
    });
    
    checkParentTypeOnLoad(); // SFNA-2143
    
    $("#BusinessModel").find('input').click(function() {
        AdditionalDetailsClicked();
    });
    
    $(".AdditionalDetailsInputs").focusout(function() {
        AdditionalDetailsClicked();
    });
    
    $("#pg\\:frm\\:company").find('input').click(function() {
        companyClicked();
    });    
    
    $("[id*='indSelect']").find('input').click(function() {
        industryClicked();
    });
    $("[id*='IndustryType']").find('input').click(function() {// for any and primary radio buttons : sagar sadhnani
        startTotalIndustryAnyVar = true; // used to count industry any radio buttons after selecting any filter : Fix
        industryClicked();
    });
    
    $(".indCodes").focusout(function() {
        industryClicked();
    });
    
    $(".GeoSearchType").click(function() {       
        hitForCount();
    });
        
    $(".companyDeptInputs").focusout(function() {
        departmentSizeClicked();
    });

	$(".companyInputs").focusout(function() {
        companySizeClicked();
    });
    
    $(".companyInputsFortune").change(function() { 
        
        companySizeClicked();
    });
       
    
    $("[id*='Ownershiplst']").find('input').click(function() {
        OwnershipClicked();
    });
    
    $("#DepartmentDiv").find('input').click(function() {
        DepartmentClicked();
    });
    
    $("#JobFunctionDiv").find('input').click(function() {
        JobFunctionClicked();
    });
    $("#SeniorityLevelDiv").find('input').click(function() {
        SeniorityLevelClicked();
    });
    $("#AdditionalDetailDiv").find('input').click(function() { // By Neha Agrawal
        employeeAdditionDetailClicked();
    });
    
    $(".clvl").click(function() {
        SeniorityLevelClicked();
    });
    $("#TechnologyDiv").find('input').change(function() {
		//console.log('TechnologyDiv click');
        TechnologyClicked();
    });
    $("#techCategoryType").find('input').click(function() {
        TechnologyClicked();
    });
    
    $("#ContactDetailsDiv").find('input').click(function() {
        ContactDetailsClicked();
    });
    
    $("#TriggersTypeDiv").find('input').click(function() {
        setTimeout(function(){// used to count after group chechbox processing script: sagar sadhnani
        	triggersTypeClicked();
        },10);
        
    });
       
    $("#TriggersDepartmentDiv").find('input').click(function() {
        TriggersDepartmentClicked();
    });
    
    $(".triggersDateRangeInputs").focusout(function() {
        dateRangeClicked();
    });
    
    $("#TriggersCategoriesDiv").find('input').click(function() {
        TriggersCategoriesClicked();
    });
    
    $(".keyWordOptions").find('input').click(function() {
        keywordClicked();
    });
    
    $(".keyWordSearchInput").focusout(function() {
        keywordClicked();
    });
    
    $("#BusinessModel").find('input').click(function() {
        AdditionalDetailsClicked();
    });
    
    $(".AdditionalDetailsInputs").focusout(function() {
        AdditionalDetailsClicked();
    });
    
    $(".LocationPostalCodeInputs").focusout(function() {
        LocationPostalCodeClicked();
    });
    
    $("#LocationGeographyDiv").find('input:checkbox').click(function() {
        LocationGeographyClicked();
    });
    
    
    
	//Searching Start Here
    $("#industrySearchInput").keyup(function() {
        $("[id*='indSelect']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#industrySearchInput").val().toUpperCase();
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();
                }
            }
        });
    });
    
    $("#senlevelSearchInput").keyup(function() {
        $("[id*='senlevelSelect']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#senlevelSearchInput").val().toUpperCase();
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();
                }
            }
        });
    });
    
    $("#jobFunctionSearchInput").keyup(function() {
        $("[id*='jobFunctionSelect']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#jobFunctionSearchInput").val().toUpperCase();
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();
                }
            }
        });
    });
	
	$("#topicSearchInput").keyup(function() {
        $("[id*='TriggersCategoriesSelect']").each(function() {
            var eachTrVal = $(this).parent().find('.slds-form-element__label').text().trim().toUpperCase();
            searchStrs = $("#topicSearchInput").val().trim().toUpperCase();
            if (searchStrs.length == 0) {
                $(this).parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).parent().parent().show();
                } else {
                    $(this).parent().parent().hide();
                }
            }
        });
    });
	
    $("#areaCodeSearchInput").keyup(function() {
        if( $(this).val().length == 0 ){
            $(this).parent().find(".fa-times").hide();
        }
        else{
            $(this).parent().find(".fa-times").show();
        }
        $("[id*='areacode']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#areaCodeSearchInput").val().toUpperCase();
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();                    
                }
            }
        });
    });   
    
    $("#StatesSearchInput").keyup(function() {
        if( $(this).val().length == 0 ){
            $(this).parent().find(".fa-times").hide();
        }
        else{
            $(this).parent().find(".fa-times").show();
        }
        $("[id*='states']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#StatesSearchInput").val().toUpperCase();        	
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {            	            	
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();
                }
                
            }
        });
    });
    
    $("#CountrySearchInput").keyup(function() {
        if( $(this).val().length == 0 ){
            $(this).parent().find(".fa-times").hide();
        }
        else{
            $(this).parent().find(".fa-times").show();
        }
        $("[id*='contries']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#CountrySearchInput").val().toUpperCase();            
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();
                }
            }
        });
    });
    
    $("#MetroAreasSearchInput").keyup(function() {
        if( $(this).val().length == 0 ){
            $(this).parent().find(".fa-times").hide();
        }
        else{
            $(this).parent().find(".fa-times").show();
        }
        $("[id*='metroarea']").each(function() {
            var eachTrVal = $(this).next().next().text().toUpperCase();
            searchStrs = $("#MetroAreasSearchInput").val().toUpperCase();
            if (searchStrs.length == 0) {
                $(this).next().next().parent().parent().show();
            } else {
                if (eachTrVal.indexOf(searchStrs) != -1) {
                    $(this).next().next().parent().parent().show();
                } else {
                    $(this).next().next().parent().parent().hide();
                }
            }
        });
    });
    $(".btn").removeClass("btn");
    
    $('body').keypress(function(event){
        if (event.keyCode === 10 || event.keyCode === 13) {            
            event.preventDefault(); 
        }
    });
    
    $('.searchForConNCompInpBx').keypress(function(event){
        if (event.keyCode === 10 || event.keyCode === 13) {            
            event.preventDefault();
            filterUpdate();
        }
    });
    
	$('input[type=text], textarea').keyup(function(event){
        if($(this).val())
			$(this).val(html2text($(this).val())); 
    });
	
	$('input[type=text], textarea').keydown(function(event){
        if($(this).val())
			$(this).val(html2text($(this).val())); 
    });
	
    $('.slds-tooltip-right').hover(function() {
        setPosition( $(this), "right" );                    
        $("#slds-tooltip-right").show();
    }, function() {
        $("#slds-tooltip-right").hide();
    });
    
    $('.slds-tooltip-top').hover(function() {
        setPosition( $(this), "top" );                    
        $("#slds-tooltip-top").show();
    }, function() {
        $("#slds-tooltip-top").hide();
    });
    
    $('.slds-tooltip-left').hover(function() {
        setPosition( $(this), "left" );                    
        $("#slds-tooltip-left").show();
    }, function() {
        $("#slds-tooltip-left").hide();
    });
    
    /* Help Pop Start*/
    $('button.help-link').mouseenter(function(){
        $('.helpdetail').fadeIn();
    });
    $('.slds-dropdown-trigger').mouseleave(function(){
        $('.helpdetail').fadeOut();
    });
    /* Help Pop Ends */
    
    /* Other Link Start*/
    $('button.otherLink').mouseenter(function(){
        $('.otherTabsLink').fadeIn();
    });
    $('.otherTabArea').mouseleave(function(){
        $('.otherTabsLink').fadeOut();
    });
    /* Other Link Ends */
	
    //$("#submit-research-request").click(function() {
        //$("[id$='research-sel-option']").val("New Contact Request");
        //$("[id$='research-textarea']").val("");
        //$("#research-modal").show();
    //});
    
    // Research request
    $("#submit-research-request").click(function(){
        $("#help-research-request").removeClass("slds-hide").addClass("slds-fade-in-open");
        $("[id$='research-sel-option']").val("Select a Research Option");
        callOptionsDisplay("Select a Research Option");
        return false;
    });
    
    
    $("#leftPanelExpanded").click(function(e){
        var savedLst = $("#savedSrCls");
        if ( !savedLst.is(e.target) && savedLst.has(e.target).length == 0) {
            $("#pg\\:frm\\:MySavedSearchesPopup").hide();
        }
        
        var recentLst = $("#recentSrCls");
        if ( !recentLst.is(e.target) && recentLst.has(e.target).length == 0) {
            $("#RecentSearchesPopup").hide();
        }       
    });
    
    $(document).click(function(e){
        var locGeoConti  = $(".locGeoConti");
        if ( !locGeoConti.is(e.target) && locGeoConti.has(e.target).length == 0) {
            $("#locationGeoContinent").hide();
        }
        
        var locGeoCountry  = $(".locGeoCountry");
        if ( !locGeoCountry.is(e.target) && locGeoCountry.has(e.target).length == 0) {
            $("#locationGeoCountry").hide();
        }
        
        var locGeoState  = $(".locGeoState");
        if ( !locGeoState.is(e.target) && locGeoState.has(e.target).length == 0) {
            $("#locationGeoState").hide();
        }
        
        var locaGeoMArea  = $(".locaGeoMArea");
        if ( !locaGeoMArea.is(e.target) && locaGeoMArea.has(e.target).length == 0) {
            $("#locationGeoMetroArea").hide();
        }
        
        var lcoaGeoACodes  = $(".lcoaGeoACodes");
        if ( !lcoaGeoACodes.is(e.target) && lcoaGeoACodes.has(e.target).length == 0) {
            $("#locationGeoAreaCodes").hide();
        }  
    });
       
	$(".slds-button--Help-model-close").click(function(){
        $("#help-research-request").addClass("slds-hide").removeClass("slds-fade-in-open");
        $("[id$='help-research-textarea']").val("");
        //$("[id$='research-sel-option']").val("Select a Research Option");
        return false;
    });
    //$(".cancel-research").click(function() {
    //    $(".submit-research").attr("disabled", false).css("opacity", '').css("cursor", 'pointer');
    //    $("#research-modal").hide();
    //});
    
    
    //Custom Show Hide Tooltip For Reseearch Request Help Start Here        
    $(".tooltipResReqHelp").mouseout(function(e) {
        $(".tooltipResReqArrow").hide("fast");
        $(".tooltipResReq").hide("fast");
    });
    $(".tooltipResReqHelp").mouseover(function() {
        $(".tooltipResReqArrow").show("fast");
        $(".tooltipResReq").show("fast");
    });
    //Custom Show Hide Tooltip For Reseearch Request Help End Here 
    savedSearchPopupInit();
    
    technologySearchBarInit();
    dateRangeInits();
    initNumberFieldEvents();
}

function savedSearchPopupInit(){
	$('#savedSearchsSFNATab').unbind('mouseenter mouseleave');//SFNA-2752
	$('#savedSearchsSFNATab').hover(function() {
        showHideSavedSearchsSFNA();
    });
    $('.savedSearchsSFNA').unbind('mouseenter mouseleave');
	$('.savedSearchsSFNA').hover(function() {
        showHideSavedSearchsSFNA();
    });
    $('#savedSearchsDOTab').unbind('mouseenter mouseleave');
    $('#savedSearchsDOTab').hover(function() {
        showHideSavedSearchsDO();
    });
    $('.savedSearchsDO').unbind('mouseenter mouseleave');
    $('.savedSearchsDO').hover(function() {
        showHideSavedSearchsDO();
    });
    //console.log('popup Initialized!!!!');
}

function initNumberFieldEvents() {
	$('.js-number-input').on('paste', function (event) {
		event.preventDefault();
		event = event.originalEvent || event;
		var clipboardData = event.clipboardData || window.clipboardData;
		var pastedData = clipboardData.getData('Text');
		$(this).val(pastedData.replace(/\D/g, ''));
	}).on('keypress', isNumber);
}

function valueBlank(ele){
	console.log('@@##==' + $(ele).val());
	if(!$.isNumeric($(ele).val())){
		$(ele).val('');
	}
}
function isNumber(evt){
	// Allow: backspace, delete, tab, escape, enter and .
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    
	if ($.inArray(charCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: Ctrl+A,Ctrl+C,Ctrl+V, Command+A
      ((charCode == 65 || charCode == 86 || charCode == 67) && (evt.ctrlKey === true || evt.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (charCode >= 35 && charCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((evt.shiftKey || (charCode < 48 || charCode > 57)) && (charCode < 96 || charCode > 105)) {
      evt.preventDefault();
    }
}

function technologySearchBarInit(){
    $("[id*='technoSeTxtID']").keyup(function(event) {
        clearTimeout(myVarTech);
        var searchStr = html2text($("[id*='technoSeTxtID']").val());
        var code = event.keyCode || event.which;
        if (code == 13 && searchStr.length >= 1) {
            after3SecSearchtechnology();
        } else if (code == 13 && searchStr.length == 0) {
            //$("[id*='extAll']").click();
        } else if (searchStr.length >= 1) {
            myVarTech = setTimeout(after3SecSearchtechnology, 1000);
        }
    });
}
function html2text(html){
    var retHtml = html;
    if( retHtml.includes('<') && retHtml.includes('>') ){
        retHtml = '';
    }
    return retHtml;
}

function after3SecSearchtechnology() {
    showStatusForAll('TechnologiesdivProcess');
    technologyByText();
}

function companyClicked(){
    var isAnyChecked = false;
    $("[id*='company'] table").find('input').each(function() {
        if( $(this).prop("checked") ){
            isAnyChecked = true;
        }
    });
    
    if( isAnyChecked ){
        disableIndustry(true);
    }
    else{        
        disableIndustry(false);
    }
    companyNameFilter();
}

function disableCompany(flag) {
    /*if (flag) {
        $("#pg\\:frm\\:company").find('input').each(function() {
            $(this).attr("disabled", true);
            $(".companyName2Btn").attr("disabled", true);
        });
    } else {
        $("#pg\\:frm\\:company").find('input').each(function() {
            $(this).attr("disabled", false);
            $(".companyName2Btn").attr("disabled", false);
        });
    }
	*/    
}

function showStatusForAll(divId) {
    document.getElementById(divId).style.display = 'block';
}

function hideStatusForAll(divId) {
    document.getElementById(divId).style.display = 'none';
    convertCheckBoxToLDS();
    jqyeryInitialization();
}

//Convert standard checkboxes to Lightning Design System
function convertCheckBoxToLDS() {
    var Row = document.getElementsByClassName("convertToLSD");
    for (var k = 0; k < Row.length; k++) {
        if ($(Row[k]).hasClass("converted") == false) {
            var colTds = Row[k].getElementsByTagName("td");
            for (var i = 0; i < colTds.length; i++) {
                var inrHtml = colTds[i].innerHTML;
                var chkId = inrHtml.substring(inrHtml.indexOf("id=") + 4, inrHtml.indexOf("\"", inrHtml.indexOf("id=") + 4));
                var chkBx = inrHtml.substring(inrHtml.indexOf("<input"), inrHtml.indexOf(">") + 1);
                var chkLable = colTds[i].getElementsByTagName("label")[0].textContent;
                var typeOfInput = colTds[i].getElementsByTagName("input")[0].getAttribute("type");
                var newChkBox = '<label class="slds-' + typeOfInput + '" for="' + chkId + '">' + chkBx +
                    '<span class="slds-' + typeOfInput + '--faux"></span>' +
                    '<span class="slds-form-element__label">&nbsp;' + chkLable.trim() + '</span>' +
                    '</label>';
                colTds[i].innerHTML = newChkBox;
            }
        }
    }
    $(".convertToLSD").addClass("converted");
}

function closePopupPanel(popUpName , subTagId){
    $(".panelPopups").hide();
    $(".subTab").parent().css("background-color","");
    $("#arrow").hide();
    $(".subTab").css("color","#666666");
    $(".angleRightTd").css("color","#666666");
    $(".angleRightTd").find(".fa-times").css("display", "none");
    $(".angleRightTd").find(".fa-angle-right").css("display", "");
    $(".countOvalSubTab").css("border-width","0px");
    
    $( ".panelPopupsHeader" ).each(function( index ) {
        $(this).find(".dataBodyPanel").css("max-height","");
        $(this).find(".dataBodyPanel").css("overflow","");
        $(this).find(".dataBodyPanel").css("width","96%");
    });
}

function openPopupPanel( popUpName, subTagId){
    //Reset Panel
    //
    closePopupPanel('', '');
    
    $("#"+subTagId).next().find(".fa-times").css("display", "");
    $("#"+subTagId).next().find(".fa-angle-right").css("display", "none");
    $("#"+subTagId).parent().css("background-color","#666666");
    $("#"+subTagId).css("color","white");
    
    $("#"+subTagId).find(".countOvalSubTab").css("border-width","1px");
    
    var width = parseFloat( $("#"+subTagId).css("width").replace("px","") ) +80;    
    var leftPos = parseInt($("#leftPanelExpanded").css("width").replace("px",""));
    var topPos = $("#"+subTagId).position().top;
    var topPos2 = $("#"+subTagId).position().top;        
    
    if( $("#"+subTagId).parent().parent().css("display") == 'none' ){
        topPos2 = $("#"+subTagId).parent().parent().parent().parent().find("font").position().top;     
    }
    
    $("#"+popUpName).css("left", (leftPos+10) +"px");    
    //$("#"+popUpName).css("top", (topPos2-50)+"px");        
    $("#"+popUpName).css("top", "125px");        
    $("#"+popUpName).show();
    
    $("#arrow").css("left", (leftPos+3) +"px");
    $("#arrow").css("top", topPos+103+"px");
    //$("#arrow").show();
    $( ".panelPopups" ).each(function( index ) {
        if ( $(this).height() > $(window).height() ){
            $(this).find(".dataBodyPanel").css("max-height",$(window).height()-210+"px");
            $(".companyDeptInputsTd2").css("margin-left","6%");
            $(this).find(".dataBodyPanel").css("overflow-x","hidden");
            $(this).find(".dataBodyPanel").css("width","96%");
        }
    });
    
}

function showHideSubtabs( subTableId ){
    if( $("#"+subTableId+"Table").css("display") != 'none' ){
        showHideFilters( subTableId , false);
    }
    else{
        showHideFilters( subTableId , true);
    }
    
    $(".filterTable").find("tr").each(function() { 
        //&& $(this).parent().parent().css("display")!= 'none'
        if( $(this).css("background-color") == 'rgb(102, 102, 102)'   ){
            $(this).find("td").click();
        }
    });
    resetPosForSearches();
}

function topRightPanelFilter(ele){
    var sterm = $(ele).val().toLowerCase();
    
    if( sterm.length > 0 ){
        $("#crossSrchIconTopRght").show();
    }
    else{
        $("#crossSrchIconTopRght").hide();
    }
}

function showHideFilters( subTableId , isShow ){
    if( isShow ){
    	
    	$("#"+subTableId+"Table").show();
        $("#"+subTableId+"FA").addClass("fa-caret-down");
        $("#"+subTableId+"FA").removeClass("fa-caret-right");
        
        if(subTableId == 'Triggers'){// To show legacy topics only when we have at least one legacy topic is available: Sagar Sadhnani
    		if(parseInt($('#TriggersLegacyTopicsTr').find('.TriggersLegacyTopicsCount').html()) > 0){
    			$('#TriggersLegacyTopicsTr').show();
    		}else{
    			$('#TriggersLegacyTopicsTr').hide();
    		}
    	}
    }else{
        $("#"+subTableId+"Table").hide();
        $("#"+subTableId+"FA").addClass("fa-caret-right");
        $("#"+subTableId+"FA").removeClass("fa-caret-down");
    }
}

function companyNameFilter(){
    var totSel = 0;
    $("#companyNamePopup").find("input").each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    
    $(".ComapnyNameCount").html(totSel+'');
    if( totSel == 0){
        $(".ComapnyNameCount").hide();
    }
    else{
        $(".ComapnyNameCount").show();
    }
    companyTotCount();
}

function disableIndustry(flag) {
    
}


function OwnershipClicked(){
    var totSel = 0;
    $("[id*='Ownershiplst']").find("input").each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    
    $(".ComapnyOwnershipCount").html(totSel+'');
    if( totSel == 0){
        $(".ComapnyOwnershipCount").hide();
    }
    else{
        $(".ComapnyOwnershipCount").show();
    }
    companyTotCount();
}

function companySizeClicked(){
   
    var totSel = 0;
    //console.log('++companySizeClicked++'+$('.companyInputsFortune').val());
    $(".companyInputs").each(function() {
        if( $(this).val() !='' ){
            totSel++;
        }
    });
    
    
    if($('.companyInputsFortune').val()!=''){
        //
        totSel++;
    }
    $(".ComapnySizeCount").html(totSel+'');
    if( totSel == 0){
        $(".ComapnySizeCount").hide();
    }
    else{
        $(".ComapnySizeCount").show();
    }
    companyTotCount();
}

function departmentSizeClicked(){
    var totSel = 0;
    $(".companyDeptInputs").each(function() {
        if( $(this).val() !='' ){
            totSel++;
        }
    });
    $(".ComapnyDepartmentSizeCount").html(totSel+'');
    if( totSel == 0){
        $(".ComapnyDepartmentSizeCount").hide();
    }
    else{
        $(".ComapnyDepartmentSizeCount").show();
    }
    companyTotCount();
}

function AdditionalDetailsClicked(){
    var totSel = 0;
    $(".AdditionalDetailsInputs").each(function() {
        if( $(this).val() !='' ){
            totSel++;
        }
    });
    
    $("#BusinessModel").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    
    $(".ComapnyAdditionalDetailsCount").html(totSel+'');
    if( totSel == 0){
        $(".ComapnyAdditionalDetailsCount").hide();
    }
    else{
        $(".ComapnyAdditionalDetailsCount").show();
    }
    companyTotCount();
}

function LocationPostalCodeClicked(){
    var totSel = 0;
    $(".LocationPostalCodeInputs").each(function() {
        if( $(this).val() !='' ){
            totSel++;
        }
    });
    $(".LocationPostalCodeCount").html(totSel+'');
    if( totSel == 0){
        $(".LocationPostalCodeCount").hide();
    }
    else{
        $(".LocationPostalCodeCount").show();
    }
    LocationTotCount();
}

function DepartmentClicked(){
    var totSel = 0;
    $("#DepartmentDiv").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    $(".EmployeesDepartmentCount").html(totSel+'');
    if( totSel == 0){
        $(".EmployeesDepartmentCount").hide();
    }
    else{
        $(".EmployeesDepartmentCount").show();
    }
    employeesTotCount();    
}

function JobFunctionClicked(){
    var totSel = 0;
    $("#JobFunctionDiv").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    $(".EmployeesJobFunctionCount").html(totSel+'');
    if( totSel == 0){
        $(".EmployeesJobFunctionCount").hide();
    }
    else{
        $(".EmployeesJobFunctionCount").show();
    }
    employeesTotCount();    
}

function SeniorityLevelClicked(){
    var totSel = 0;
    $("#SeniorityLevelDiv").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    
    if( $(".clvl").prop("checked") ){
        totSel++;
    }
    
    $(".EmployeesSeniorityLevelCount").html(totSel+'');
    if( totSel == 0){
        $(".EmployeesSeniorityLevelCount").hide();
    }
    else{
        $(".EmployeesSeniorityLevelCount").show();
    }
    employeesTotCount();    
}

function TechnologyClicked(){
    var totSel = 0;
    $("#TechnologyDiv").find('input').each(function() {
       // if( $(this).prop("checked") ){
        //    totSel++;
       // }
	   countSelectedTchChkBox($(this));
    });
	totSel = techset.size;
	console.log('@@##$$ totSel-- '+totSel);
    $(".TechnologyCount").html(totSel+'');    
    
    if( totSel >0 ){
        $("#TechnologyNotification").show();
        $(".TechnologyCount").show();
    }else{
        $("#TechnologyNotification").hide();
        $(".TechnologyCount").hide();
    }
    hitForCount();
}

function ContactDetailsClicked(){
    var totSel = 0;
    $("#ContactDetailsDiv").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    $(".EmployeesContactDetailsCount").html(totSel+'');
    if( totSel == 0){
        $(".EmployeesContactDetailsCount").hide();
    }
    else{
        $(".EmployeesContactDetailsCount").show();
    }
    employeesTotCount();   
}

function triggersTypeClicked(){
    var totSel = 0;
    totSel = $("#TriggersTypeDiv .innertype:checked").length;
    $(".TriggersTypeCount").html(totSel+'');
    if( totSel == 0){
        $(".TriggersTypeCount").hide();
    }
    else{
        $(".TriggersTypeCount").show();
    }
    triggersTotCount();   
}

function TriggersDepartmentClicked(){
    var totSel = 0;
    $("#TriggersDepartmentDiv").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    $(".TriggersDepartmentCount").html(totSel+'');
    if( totSel == 0){
        $(".TriggersDepartmentCount").hide();
    }
    else{
        $(".TriggersDepartmentCount").show();
    }
    triggersTotCount();    
}

function dateRangeClicked(){        
    var totSel = 0;
    $(".triggersDateRangeInputs").each(function() {
        console.log('==1126=='+$(this).val());
        if( $(this).val() !='' ){
            totSel++;
        }
    });
    console.log('==1130=='+totSel);
    $(".TriggersDateRangeCount").html(totSel+'');
    if( totSel == 0){
        $(".TriggersDateRangeCount").hide();
    }
    else{
        $(".TriggersDateRangeCount").show();
    }
    triggersTotCount();    
}

function TriggersCategoriesClicked(){
    var totSel = 0;
    $("#TriggersCategoriesDiv").find('input').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    $(".TriggersCategoriesCount").html(totSel+'');
    if( totSel == 0){
        $(".TriggersCategoriesCount").hide();
    }
    else{
        $(".TriggersCategoriesCount").show();
    }
    triggersTotCount();    
}

function ScoopLegacyTopicsClicked(){
    var totSel = $("[id*=TriggersLegacyTopicsPanel]").find('.slds-badge').length;
    
    $(".TriggersLegacyTopicsCount").html(totSel+'');
    if( totSel == 0){
        $(".TriggersLegacyTopicsCount").hide();
    }
    else{
        $(".TriggersLegacyTopicsCount").show();
    }
    triggersTotCount();    
}

function LocationGeographyClicked(){
    var totSel = 0;
    $("#LocationGeographyDiv").find('input:checkbox').each(function() {
        if( $(this).prop("checked") ){
            totSel++;
        }
    });
    $(".LocationGeographyCount").html(totSel+'');
    if( totSel == 0){
        $(".LocationGeographyCount").hide();
    }
    else{
        $(".LocationGeographyCount").show();
    }
	LocationTotCount();
}

function keywordClicked(){
    var totSel = 0;   
    
    if( $(".keyWordSearchInput").val() != '' ){
        $(".keyWordSearchInput").val(html2text($(".keyWordSearchInput").val()));
        totSel++;
    }    
    
    $(".KeywordCount").html(totSel+'');  
    
    if( totSel >0 ){
        $("#KeywordNotification").show();
        $(".KeywordCount").show();
    }else{
        $("#KeywordNotification").hide();
        $(".KeywordCount").hide();
    }    
    hitForCount();
}

function industryClicked(){
    var totSel = 0;
    var isAnyChecked = false;
    
    if(startTotalIndustryAnyVar)// this is to not update first time when radio button by default selected
    	totSel += $("[id*=IndustryType").find('input:checked').length;// for any and primary radio buttons : sagar sadhnani
    $("#pg\\:frm\\:indSelect").find('input').each(function() {
        if( $(this).prop("checked") ){
            isAnyChecked = true;
            totSel++;
        }
    });
    
    if( isAnyChecked ){
        //$("[id*=searchKeyword]").attr("disabled",true);
        disableCompany(true);
    }
    else{
        disableCompany(false);
        //$("[id*=searchKeyword]").attr("disabled",false);
    }
    
    $(".indCodes").each(function() {
        if( $(this).val() !='' ){
            totSel++;
        }
    });
    
    $(".ComapnyIndustryCount").html(totSel+'');
    if( totSel == 0 ){
        $(".ComapnyIndustryCount").hide();
    }else{
        $(".ComapnyIndustryCount").show();
    }
    
    companyTotCount();
}

function companyTotCount(){
    var totCPanel = parseInt($(".ComapnyNameCount").html()) + parseInt($(".ComapnyOwnershipCount").html()) + parseInt($(".ComapnyIndustryCount").html()) + parseInt($(".ComapnySizeCount").html()) + parseInt($(".ComapnyAdditionalDetailsCount").html())+ parseInt($(".ComapnyDepartmentSizeCount").html()) ;
	$("#companiesCount").html(totCPanel);
    if( totCPanel >0 ){
        $("#CompaniesNotification").show();
        $("#companiesCount").show();
    }else{
        $("#CompaniesNotification").hide();
        $("#companiesCount").hide();
    }
    hitForCount();
}

function employeesTotCount(){
    var totCPanel = parseInt($(".EmployeesDepartmentCount").html()) + parseInt($(".EmployeesJobFunctionCount").html()) + parseInt($(".EmployeesSeniorityLevelCount").html())  + parseInt($(".EmployeesContactDetailsCount").html()) + parseInt($(".EmployeesAdditionalDetailCount").html()) ;
	$("#EmployeesCount").html(totCPanel);
    if( totCPanel >0 ){
        $("#EmployeesNotification").show();
        $("#EmployeesCount").show();
    }else{
        $("#EmployeesNotification").hide();
        $("#EmployeesCount").hide();
    }
    hitForCount();
}



function triggersTotCount(){
    var totCPanel = parseInt($(".TriggersTypeCount").html()) + parseInt($(".TriggersDepartmentCount").html()) + parseInt($(".TriggersDateRangeCount").html())  + parseInt($(".TriggersCategoriesCount").html()) + parseInt($(".TriggersLegacyTopicsCount").html()) ;
	$("#TriggersCount").html(totCPanel);
    if( totCPanel >0 ){
        $("#TriggersNotification").show();
        $("#TriggersCount").show();
    }else{
        $("#TriggersNotification").hide();
        $("#TriggersCount").hide();
    }
    hitForCount();
}

function LocationTotCount(){
    var totCPanel = parseInt($(".LocationGeographyCount ").html()) + parseInt($(".LocationPostalCodeCount ").html());
    $("#LocationCount").html(totCPanel);
    if( totCPanel >0 ){
        $("#locationNotification").show();
        $("#LocationCount").show();
    }else{
        $("#locationNotification").hide();
        $("#LocationCount").hide();
    }
    hitForCount();
}

function after1SecHitCount() {
    var selectedTab = $("#searchResIfrm").contents().find(".slds-tabs--default__nav").find(".slds-active").attr("title");            
    var countLoader = '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
    $(".searchResult").html(countLoader+" "+ selectedTab +" Result(s)");   
    if( selectedTab == null  ){
        selectedTab = 'Employees'
    }
    var csvVals = '';
        
    if(techset.size>0){
    techset.forEach(function (item) {  
    csvVals +=item.toString() + ",";  
    });
    } 
    var selChkTdss = document.getElementsByClassName('makeIdsForCheckBoxes');
    if(selChkTdss.length<=0){
     csvVals=''; 
    } 
    
    jQuery('[id$=selectedTechnologyIdsHide]').val(csvVals);
	doCountFun(selectedTab);
    
}

function after1SecHitCount2(){
    setTimeout(after1SecHitCount, 1000);
}

function hitForCount(){
	clearTimeout(hitCountVar);
    hitCountVar = setTimeout(after1SecHitCount, 1000);        
}

function resetPosForSearches(){
    $("#pg\\:frm\\:SavedSearchesCategory").css( "left" , $("#MySavedSearchesBtn").position().left );
    $("#pg\\:frm\\:SavedSearchesCategory").css( "top" , $("#MySavedSearchesBtn").position().top);
    
    var offset = $("#savedSearchsSFNATab").offset();
	var posY = offset.top - $(window).scrollTop();
    
    var offset2 = $("#savedSearchsDOTab").offset();
	var posY2 = offset2.top - $(window).scrollTop();
    
    $(".savedSearchsSFNA").css( "left" , $("#savedSearchsSFNATab").offset().left+220 );
    $(".savedSearchsSFNA").css( "top" , posY);
    $(".savedSearchsDO").css( "left" , $("#savedSearchsDOTab").offset().left+220 );
    $(".savedSearchsDO").css( "top" , posY2);
    
    $("#RecentSearchesPopup").css( "left" , $("#RecentSearchesBtn").position().left );
    $("#RecentSearchesPopup").css( "top" , $("#RecentSearchesBtn").position().top);
}

function showHideMySavedSearches(){
    $("#pg\\:frm\\:SavedSearchesCategory").css( "left" , $("#MySavedSearchesBtn").position().left );
    $("#pg\\:frm\\:SavedSearchesCategory").css( "top" , $("#MySavedSearchesBtn").position().top);
    
    if( $("#pg\\:frm\\:SavedSearchesCategory").css("display") == 'none' ){
        $("#pg\\:frm\\:SavedSearchesCategory").show();
        
        if( $("#pg\\:frm\\:savedSearchList").find("table").find("tr").length == 0 ){
            fetchAllSavedSearchsFun();
        }
    }
    else{
        $("#pg\\:frm\\:SavedSearchesCategory").hide();
        $(".savedSearchsSFNA").hide();
        $(".savedSearchsDO").hide();
    }
    $("#RecentSearchesPopup").hide();
}

function showHideSavedSearchsSFNA(){
    var glblHei = 0;
    if( $(".globalHeaderBar").length > 0 ){
        glblHei = $(".globalHeaderBar").height();
    }
    var offset = $("#savedSearchsSFNATab").offset();
	var posY = offset.top - $(window).scrollTop();
    
    $(".savedSearchsSFNA").css( "left" , $("#savedSearchsSFNATab").offset().left+220 );
    $(".savedSearchsSFNA").css( "top" , posY );
    
    if( $(".savedSearchsSFNA").css("display") == 'none' ){
        $(".savedSearchsSFNA").show();
    }
    else{
        $(".savedSearchsSFNA").hide();
    }
    $(".savedSearchsDO").hide();
    //console.log('done!!!');
}

function showHideSavedSearchsDO(){
    var glblHei = 0;
    if( $(".globalHeaderBar").length > 0 ){
        glblHei = $(".globalHeaderBar").height();
    }
    
    var offset = $("#savedSearchsDOTab").offset();
	var posY = offset.top - $(window).scrollTop();
    $(".savedSearchsDO").css( "left" , $("#savedSearchsDOTab").offset().left+220 );
    $(".savedSearchsDO").css( "top" , posY );
    
    if( $(".savedSearchsDO").css("display") == 'none' ){
        $(".savedSearchsDO").show();
    }
    else{
        $(".savedSearchsDO").hide();
    }
    $(".savedSearchsSFNA").hide();
    //console.log('done2!!!');
}

function fetchAllSavedSearchsFun(){
    $("#pg\\\:frm\\:savedSearchList").html("");
	$(".savedSearchLoading").show();
    fetchAllSavedSearchs();                    
}

function showHideRecentSearches(){
    $("#RecentSearchesPopup").css( "left" , $("#RecentSearchesBtn").position().left );
    $("#RecentSearchesPopup").css( "top" , $("#RecentSearchesBtn").position().top);
    $("#RecentSearchesPopup").toggle();
    $("#MySavedSearchesPopup").hide();
}

function openGeoPopup( ele, locationPopupId ){
    $(".locationGeoDropDown").each(function() {
        if( $(this).attr("id") != locationPopupId ){
            $(this).hide();
        }
    });
    
    $("#"+locationPopupId).css( "left" , $(ele).position().left );
    $("#"+locationPopupId).css( "top" , $(ele).position().top-6);
    $("#"+locationPopupId).toggle();
}

function showMiniLeftPanel(){
    $("#leftPanelExpanded").hide();
    $("#leftPanelCollapse").show();
    $("#divPati").css("background","white");
    closePopupPanel('', '');
    document.getElementById('searchResIfrm').contentWindow.CallFromParentPage();
}

function hideMiniLeftPanel(){
    $("#leftPanelExpanded").show();
    $("#leftPanelCollapse").hide();
    $("#divPati").css("background","#f8f8f8");
    closePopupPanel('', '');
    document.getElementById('searchResIfrm').contentWindow.CallFromParentPage();
    document.getElementById('searchResIfrm').contentWindow.CallFromParentPage();
}

function showStatusDiv() {
   // 
    document.getElementById('pnlLoadingtop').style.display = 'block'; 
    
}
function hideStatusDiv() {
    document.getElementById('pnlLoadingtop').style.display = 'none';       
}

function updateCountPanel(){
	setChildwindow();
    var selectedTab = $("#searchResIfrm").contents().find(".slds-tabs--default__nav").find(".slds-active").attr("title");
    
    if( searchCriteriaScoped == 0 ){
        $(".searchResult").css("color","#d4504c");
    }
    else{
        $(".searchResult").css("color","#666666");
    }
    $(".searchResult").html(searchCriteriaScoped+" "+ selectedTab +" Result(s)");
    
    
    if(parseInt($('.TriggersLegacyTopicsCount').html()) > 0){
    	$("#TriggersLegacyTopicsTr").show();
    }else{
    	$("#TriggersLegacyTopicsTr").hide();
    }
    savedSearchPopupInit();
}

function setChildwindow(){
    $("#searchResIfrm").contents().find(".pageSize").css("height", 800-24-parseInt( $("#pg\\:frm\\:PgeMsg" ).css("height").replace("px","")) );
}

function preventAttacksfromAllInputs(){
	$('input[type=text]').each(function(){
		if($(this).val())
			$(this).val(html2text($(this).val()));
	});
}

function filterUpdate(){    
    
	preventAttacksfromAllInputs();
    resetNumbering();
    closePopupPanel('', '');
    //var totCount = parseInt($("#companiesCount",window.parent.document).html()) + parseInt($("#EmployeesCount",window.parent.document).html()) + parseInt($("#LocationCount",window.parent.document).html()) + parseInt($(".TechnologyCount",window.parent.document).html());
    var totCount = parseInt($("#companiesCount").html()) + parseInt($("#EmployeesCount").html()) + parseInt($("#LocationCount").html()) + parseInt($(".TechnologyCount").html())+ parseInt($("#TriggersCount").html()) + parseInt($(".KeywordCount").html());
    console.log('##totCount==1===' +$("#companiesCount").html());
    if( $(".searchForConNCompInpBx").val() != '' ){
        totCount++;
    }
	
    if( totCount > 0 ){
        showStatusDiv();
        var selectedTab = $("#searchResIfrm").contents().find(".slds-tabs--default__nav").find(".slds-active").attr("title"); 
        console.log('===1491=='+selectedTab);
        if(selectedTab=='Scoops'){
            selectedTab='Triggers';
        }
        //
        var dealFucPri = '';        
        dealFucPri += 'EmployeesDP='+$("#searchResIfrm").contents().find(".dealPredictClsEmp").prop("checked");        
        dealFucPri += '&CompaniesDP='+$("#searchResIfrm").contents().find(".dealPredictClsCmp").prop("checked");        
        
        filterUpdateAjax(selectedTab,dealFucPri);
    }
    else{
        $("#seaCriNotSelPopup").show();
    }
    //console.log('--1499--11-----');
    after1SecHitCount();
    //console.log('--1499-------');
}

function openThisinRttPage(thisSrc){
    $("#searchResIfrm").attr("src",thisSrc);
}

function hideseaCriNotSelPopup(){
	$("#seaCriNotSelPopup").hide();    
}

function changeAddressType( val , ele ){
    $("#pg\\:frm\\:headq").val(val);
    $(ele).addClass("GeoSearchTypeActive");
    $(ele).next().removeClass("GeoSearchTypeActive");
    $(ele).prev().removeClass("GeoSearchTypeActive");
}

function resetNumbering(){
    AdditionalDetailsClicked();
    companyClicked();
    industryClicked();
    departmentSizeClicked();
    companySizeClicked();
    OwnershipClicked();
    DepartmentClicked();
    JobFunctionClicked();
    SeniorityLevelClicked();
    TechnologyClicked();
    ContactDetailsClicked();
    keywordClicked();
    LocationPostalCodeClicked();
    LocationGeographyClicked();
    triggersTypeClicked();
    TriggersDepartmentClicked();
    dateRangeClicked();
    TriggersCategoriesClicked();
    ScoopLegacyTopicsClicked();
    employeeAdditionDetailClicked();
}

function onSubmitOfResReq() {
    var commentText = $("[id$='research-textarea']").val();
    if (commentText == '' || commentText.trim().length == 0) {
        $("[id$='research-textarea']").css("border-color", "#DC143C");
        return;
    }
    $("[id$='research-textarea']").css("border-color", "#1797c0");    
    $(".submit-research").attr("disabled", true).css("opacity", '0.5').css("cursor", 'not-allowed');
    showStatusDiv();
    sendResearchRequest();
}

function onCompOfResReq() {
    hideStatusDiv();
    $(".submit-research").attr("disabled", false).css("opacity", '').css("cursor", 'pointer');
    $("#research-modal").hide();
    if (!(typeof reportSubmited === 'undefined') && reportSubmited != '') {
        alert(reportSubmited);
    }

    if (!(typeof reportNotSubmited === 'undefined') && reportNotSubmited != '') {
        alert(reportNotSubmited);
    }
}



function openCloseIndCate(){
    if($(".indCatgEles").css("display") == 'none' ){
    	$(".indCodeEles").hide();
        $(".indCatgEles").show();
        $(".indCatgFA").addClass("fa-angle-down").removeClass("fa-angle-left");
        $(".indCodeFA").addClass("fa-angle-left").removeClass("fa-angle-down");
    }
    else{
        $(".indCodeEles").hide();
        $(".indCatgEles").hide();
        $(".indCatgFA").addClass("fa-angle-left").removeClass("fa-angle-down");
        $(".indCodeFA").addClass("fa-angle-left").removeClass("fa-angle-down");
    }
}
function openCloseIndCode(){
    if($(".indCodeEles").css("display") == 'none' ){
    	$(".indCodeEles").show();
        $(".indCatgEles").hide();
        $(".indCodeFA").addClass("fa-angle-down").removeClass("fa-angle-left");
        $(".indCatgFA").addClass("fa-angle-left").removeClass("fa-angle-down");
    }
    else{
        $(".indCodeEles").hide();
        $(".indCatgEles").hide();
        $(".indCodeFA").addClass("fa-angle-left").removeClass("fa-angle-down");
        $(".indCatgFA").addClass("fa-angle-left").removeClass("fa-angle-down");
    }
}

function setPosition( element, position){
    var eTop = element.offset().top; //get the offset top of the element
    var eLeft = element.offset().left; //get the offset top of the element
    var tooltipPosition =  eTop ;
    //set position
    if( position == "right"){
        $( "#slds-tooltip-right" ).find(".slds-tooltip__body").html( element.attr("data-tooltip") );
        $( "#slds-tooltip-right" ).css('right',  eLeft + element.outerWidth() );
        if($( element ).hasClass( "employeeAdditionalTooltip" )){
        	console.log('YESS!!!!');
            $( "#slds-tooltip-right" ).css('top', tooltipPosition - 130 );
    	}else{  
        	$( "#slds-tooltip-right" ).css('top',  ( eTop + 10 ) - ( element.outerHeight()/2 ) );
        }
        $( "#slds-tooltip-right" ).css('z-index', '9010');
        
    }
    
    //set position
    if( position == "left"){
        $( "#slds-tooltip-left" ).find(".slds-tooltip__body").html( element.attr("data-tooltip") );
        $( "#slds-tooltip-left" ).css('left',  ( eLeft -  ( $( "#slds-tooltip-left" ).outerWidth()+20 ) ) );        
        $( "#slds-tooltip-left" ).css('top',  0 );	    
        $( "#slds-tooltip-left" ).css('z-index', '9010');
        $( "#slds-tooltip-left" ).css('width', 'auto');
    }
    
    //set position
    if( position == "top"){
        $( "#slds-tooltip-left" ).find(".slds-tooltip__body").html( element.attr("data-tooltip") );
        $( "#slds-tooltip-top" ).css('top',  ( eLeft -  ( $( "#slds-tooltip-left" ).outerWidth() + 10 ) ) );
        
       // console.log( eTop - $( "#slds-tooltip-top" ).outerHeight()/2  + ( element.outerHeight()/2 ) );
        
        $( "#slds-tooltip-top" ).css('top',  ( eTop - $( "#slds-tooltip-top" ).outerHeight() ) +'px' );
        $( "#slds-tooltip-top" ).css('z-index', '9010');
    }
}

function makeGeoLabels(){
    var geoPanels = ["ContinentDiv", "CountryDiv", "StateDiv", "MetroAreaDiv", "AreaCodesDiv"];
    var htmlPills = '';
    
    for( var i =0 ; i < geoPanels.length ; i++){
        var geoInp = geoPanels[i];
        $("#"+geoInp).find("input").each(function( index ) {
            if( $(this).prop("checked") ){
                var selVal = $(this).next().next().text();			
                htmlPills += '<span>'+ selVal +'</span>';
            }
        });
    }
    
   // 
}

function dateRangeInits(){     
    var setFromDate = $('#fromDateHtml').val();  
    var setToDate = $('#toDateHtml').val();
    var imageURL = imageURLEvent;
    var SVG = $('<svg/>', {
        class: 'slds-input__icon slds-icon-text-default',
    });
    var SVGUse = $('<use/>');
    SVGUse.attr('xlink:href',imageURL);
    $('#IconEvent').prepend(SVG.append(SVGUse));
    $('#IconEvent' ).html($('#IconEvent').html());
    
    var imageURL = imageURLEvent;
    var SVG = $('<svg/>', {
        class: 'slds-input__icon slds-icon-text-default',
    });
    $(SVG).css("right","23px");
    var SVGUse = $('<use/>');
    SVGUse.attr('xlink:href',imageURL);
    $('#IconEvent1').prepend(SVG.append(SVGUse));
    $('#IconEvent1' ).html($('#IconEvent1').html());
    
    $('[id$=fromDateHtml]').removeAttr('disabled');
	$('[id$=toDateHtml]').removeAttr('disabled');
    
	$('#fromDateHtml').datepicker({
        format: 'YYYY-MM-DD',
        onChange: function() {            
            if( !isDateGreaterThanToday('fromDateHtml') ){
                if($("#toDateHtml").val() != '' &&  ( $("#fromDateHtml").val() >= $("#toDateHtml").val() ) ){
                    alert('Start date should be lower than end date.');
                    $("#fromDateHtml").val('');
                }
            }
            $("#pg\\:frm\\:fromDateApex").val( $("#fromDateHtml").val() );
            dateRangeClicked();
            $('[id$=fromDateHtml]').attr('disabled', 'disabled');
			$('[id$=toDateHtml]').attr('disabled', 'disabled');
        }            
    });  
    
    $('#toDateHtml').datepicker({                              
        format: 'YYYY-MM-DD',
        onChange: function(datepicker) {
            if( !isDateGreaterThanToday('toDateHtml') ){
                if($("#toDateHtml").val() != '' &&  ( $("#fromDateHtml").val() >= $("#toDateHtml").val() ) ){
                    alert('End date should be greater than start date.');
                    $("#toDateHtml").val('');
                }
            }
            $("#pg\\:frm\\:toDateApex").val( $("#toDateHtml").val() );
            dateRangeClicked();
            $('[id$=fromDateHtml]').attr('disabled', 'disabled');
			$('[id$=toDateHtml]').attr('disabled', 'disabled');
        }         
    });  
    
    $("#fromDateHtml").val(setFromDate);
    $("#toDateHtml").val(setToDate); 
}

function isDateGreaterThanToday(dateId){                        
    var todate = $("#"+dateId).val();
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    
    if(dd<10) {
        dd='0'+dd
    } 
    
    if(mm<10) {
        mm='0'+mm
    } 
    
    today = yyyy+'-'+mm+'-'+dd;
    if(todate > today){
        alert('Date cannot be greater than today');
        $("#"+dateId).val('');
        return true;
    }    
    return false;
}

function pressEnter(ev)  {
    if (window.event && window.event.keyCode == 13 || ev.which == 13) {
        //checkEmptyDate(ev);
        return false;
    } else {            
        return true;
    }   
}

/*for technology select filter */

function checkallGetSelectedId(){
    var selChkTds = document.getElementsByClassName('techChkUnchk');
    if(!techset.has($(this).attr("id"))){
        for (var i = 0; i < selChkTds.length; i++) {
            techset.add($(selChkTds[i]).attr("id")); 
			techMap.set($(selChkTds[i]).attr("id"), $(selChkTds[i]).attr("title"));
        }
        
        document.getElementsByClassName("TechnologyCount").innerHTML = techset.size;
    }
}
function createDynamicIdsOnCheckBoxesforTech() {            
    var selChkTds = document.getElementsByClassName('makeIdsForCheckBoxes');
    
    for (var i = 0; i < selChkTds.length; i++) {
        var newId = $(selChkTds[i]).attr('for');                
        $(selChkTds[i]).children("input").attr("id", newId);        
           
        }
}
            
function countSelectedTchChkBox(Ele) {
    if ($(Ele).is(':checked')) {
        if(!techset.has($(this).attr("id")))
            techset.add($(Ele).attr("id"));
			techMap.set($(Ele).attr("id"), $(Ele).attr("title"));

    } else {
        techset.delete($(Ele).attr("id"));
		techMap.delete($(Ele).attr("id"));
    }
    document.getElementsByClassName("TechnologyCount").innerHTML = techset.size;    
}
            
function aftersearchchecktruetechnology(){    
    $(".techChkUnchk").each(function(i) {        
        if(techset.has($(this).attr("id"))){           
            $('#'+$(this).attr('id')).prop('checked', true);
        }
    });               
}
function employeeAdditionDetailClicked(){
    var totSel = 0;
    if($("[id*='recordChanged']").prop("checked")){
    	totSel = 1;    
    }
    if($("[id*='recordAdded']").prop("checked")){
    	totSel = 1;    
    }  
    $(".EmployeesAdditionalDetailCount").html(totSel+'');
     if( totSel == 0){
        $(".EmployeesAdditionalDetailCount").hide();
    }
    else{
        $(".EmployeesAdditionalDetailCount").show();
    }
    employeesTotCount();
}