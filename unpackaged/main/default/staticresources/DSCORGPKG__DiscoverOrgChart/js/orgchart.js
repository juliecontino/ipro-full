/**
 * Created with JetBrains PhpStorm.
 * User: Employee Login
 * Date: 1/20/14
 * Time: 5:32 PM
 * To change this template use File | Settings | File Templates.
 */






if(settings['AllowDownloads']=='Off')
{
    $('.save-btn a').remove();
    $('.save-btn').append('<span class="disbaled">Open with Excel </span>')
    $('#printing_tips .btn-container-export').remove();
    $('#printing_tips').append('<span id="pdfNoOrgChart">View PDF</span>');
    $('table.org_sf').remove();
}

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

var viewModel={};
var linesToLeave=[];
var totalContactsCount=0;
var fetchAttributes={
    companyId:getURLParameter('co_id'),
    fetchCompanyDetail:1,
    start:0,
    end:15,
    createCollapseMenu:true

}





dataService.getOrgChartData(fetchAttributes,displayCompanyInformation);

$('#loading').show();


function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
    );
}

function displayCompanyInformation(data)
{



    var companyDetail=data.companyDetail;

    dataService.createOrgChartPDF(companyDetail.coId,function(data){
        $('#printing_tips a').attr('href','/pdf/discoverorg_'+companyDetail.coId+'.pdf');
    })

    totalContactsCount=data.totalCount;


    var scrollTo=(new String(window.location).match(/_scrollTo=(\d+)/))?RegExp.$1:"";

    if(scrollTo)
    {
        fetchAttributes.start=0;
        fetchAttributes.end=totalContactsCount;
        fetchAttributes.fetchCompanyDetail=0;

        dataService.getOrgChartData(fetchAttributes,constructOrgChart);
        $('#orgchart-collapse-section input').attr('disabled',false);
        $('#orgchart-collapse-section').css('background-color','#FAFAFA').css('opacity','1');

    }
    else
    {
        window.saveLevelOneNodes=true;
        loadCIOAndCFOs();

    }



    $('title').html(companyDetail.name+' Org Chart');
    $('#company-name').html(companyDetail.name);
    $('#company-name').attr('href','/EXEC/SiteImprov/MVC/Views/CompanyInfo.php?co.CO_ID='+companyDetail.coId)
    $('#company-address').html(companyDetail.address);
    $('#company-website').html(companyDetail.website);
    $('#company-website').attr('href','http://'+companyDetail.website);

    viewModel=ko.mapping.fromJS(data);
    ko.applyBindings(viewModel);

    $('#company_detail').html(companyDetail.description);

    $('#data-management-container').html(companyDetail.techs);
    $('#company_description').show();
    $('.char-container-right').show();
    $('#technology-search').show();




    createCompanyInformationDetail();


}






function loadCIOAndCFOs()
{
    fetchAttributes.fetchCompanyDetail=0;


    if(fetchAttributes.start<totalContactsCount)
    {
        dataService.getOrgChartData(fetchAttributes,bindLevelZeroNodes);
    }
    else if(fetchAttributes.start>=totalContactsCount)
    {

        if(totalContactsCount>20)
        {
            setTimeout(function(){
                $('#orgchart-collapse-section input').attr('disabled',false);
                $('#orgchart-collapse-section').css('background-color','#FAFAFA').css('opacity','1');
                // $('#showAllLevel').attr('disabled',true);
                window.isLevelNodeFillComplete=true;
                $('#contact-load').remove();
                $('.save-btn').show();
                $('#printing_tips').show();
                $('.level-processing-msg').remove();
            },2000)
        }
        else
        {
            $('#orgchart-collapse-section input').attr('disabled',false);

            $('#orgchart-collapse-section').css('background-color','#FAFAFA').css('opacity','1');
            // $('#showAllLevel').attr('disabled',true);
            window.isLevelNodeFillComplete=true;
            $('#contact-load').remove();
            $('.save-btn').show();
            $('#printing_tips').show();
            $('.level-processing-msg').remove();
        }

        var lastZeroLevelId= $('#mapped-nodes .orgcard[level="0"]').last().attr('id');
        $('#mapped-nodes .orgcard[level="0"]').last().children('.zeroLine').css('height','52px');
        $('#mapped-nodes .orgcard[reports_to_id*="'+lastZeroLevelId+'"]').children('.zeroLine').remove();


    }


}

function bindLevelZeroNodes(data)
{
    $('#contact-load').remove();

    constructOrgChart(data);

    if(fetchAttributes.start==0)
        fetchAttributes.start=fetchAttributes.end;
    else
        fetchAttributes.start=fetchAttributes.start+100;


    fetchAttributes.end=100;


    window.isLevelNodeFillComplete=false;

    loadCIOAndCFOs();
}










function getOrgChartData()
{

    fetchAttributes.fetchCompanyDetail=0;
    dataService.getOrgChartData(fetchAttributes,LazyLoad);
    $('#loading').hide();
    jq('#orgchart-collapse-section').after('<p style="text-align: center" id="loading-levels-msg">Please wait constructing levels... &nbsp <img style="width: 20px;" src="/img/login-ajax-img.gif"/></p>');


}

var images=['blue-box-bg_1.jpg', 'purple-box-bg_2.jpg','green-box-bg_3.jpg', 'grey-box-bg_4.jpg', 'red-box-bg_5.jpg', 'light-orange_6.jpg', 'light-green_7.jpg', 'green-box-bg_8.jpg', 'grey-box-bg_4.jpg', 'red-box-bg_5.jpg'];


window.orgchartNodes =[];
var totalLevels=0;

function constructOrgChart(data,createLevels)
{

    //data=data.splice(0,5);

    window.orgchartObject=data;

    var orphanCount=0;

    $('#companyBox').remove();

    var companyBox="<div id='companyBox' class='orgcard' style='left: -86px;top: 25px;'><span><img src='/img/orgchart.png'/></span></div>"
    jq('#mapped-nodes').prepend(companyBox);

    for(var i=0;i<data.length;i++)
    {
        var orgChartObject=data[i];


        if(orgChartObject.childNodes.length >0)
        {
            window.perviousLevel=0;
            constructDescendOrgChart(orgChartObject,0,linesToLeave,0);

        }
        else
        {
            var personInfo=orgChartObject.node[0];

            var top=orphanCount/3;

            var left=(orphanCount/3-top)*3;

            top=top*70;

            left=left*450;

            var linkedInLink = personInfo.linkedInUrl ? "<span style='margin-left: 10px' personid="+personInfo.personId+" class='IN-canvas' rel='"+personInfo.linkedInUrl+"'></span>": ' ';


            var sflink=buildCRMIcons(personInfo);

            var titleClass=(personInfo.Title.length > 48)?(personInfo.Title.length > 58)?"title tinytitle":"title smalltitle":"title";

            var isMobile=false;

            var ml='';//(isMobile)?"/cgi-bin/webdata_pro.pl?_cgifunction=form&_layout=mobile_exec2&keyval=pers.PERS_ID$id":"/cgi-bin/webdata_pro.pl?_cgifunction=form&_layout=exec2&keyval=pers.pers_id=$id";
            var val = "";
            var personNotes = (personInfo.Notes === null) ?val:personInfo.Notes;
            //var notes = personNotes?(personInfo.Notes != '' ): $.trim(personInfo.Notes);

            //alert(notes);

            var maincard="<div class='maincard'>"+sflink+"<div class='left-grey-box'><span class='name'><a title=\""+personNotes+"\"  href = '/EXEC/SiteImprov/MVC/Views/PersonInfo.php?persid=" + personInfo.personId + "' target=_new  >" + personInfo.Name + "</a>" + linkedInLink + "</span><p><span class='"+titleClass+"'>"+personInfo.Title+"</span>"+personInfo.Phone+"&nbsp;<a href='mailto:"+ personInfo.Email+"'>"+personInfo.Email+"</a></p></div></div>";

            var orgcard="<div id='" + personInfo.personId + "' level='-1'  class='orgcard' style='float:left;margin-left:20px; width:auto;'><img src='/img/purple-box-bg.jpg'><span class='cardtext'>"+maincard+"</span></div>";

            $('#unmapped-nodes').append(orgcard);

            orphanCount++;
        }
    }

    $('#mapped-nodes .orgcard').last().find('.minus').remove();

    if(createLevels ||  typeof  createLevels=='undefined')
    {
        createCollapseMenu();
    }


    if((new String(window.location).match(/_scrollTo=(\d+)/))?RegExp.$1:"")
        $('#orgchart-collapse-section input').attr('disabled',false);

    $('#loading').hide();
    $('.save-btn').show();
    $('#printing_tips').show();
    var personId=(new String(window.location).match(/_scrollTo=(\d+)/))?RegExp.$1:"";
    if(personId)
    {
        var lastZeroLevelId= $('#mapped-nodes .orgcard[level="0"]').last().attr('id');
        $('#mapped-nodes .orgcard[level="0"]').last().children('.zeroLine').css('height','52px');
        $('#mapped-nodes .orgcard[reports_to_id*="'+lastZeroLevelId+'"]').children('.zeroLine').remove();
        scrollTo(personId);

    }



    showCRM();


}





function constructDescendOrgChart(data,curlevel,linesToSkip,isLast)
{

    var skipLine=linesToSkip;

    var personInfo=data.node[0],

        level=curlevel

    adjustHeight = (level==0)?"position:relative;top-5px;":"",

        titleClass=(personInfo.Title.length > 48)?(personInfo.Title.length > 58)?"title tinytitle":"title smalltitle":"title",

        isMobile='',

        mb='',

        ml='',

        sflink=buildCRMIcons(personInfo);

    var linkedInLink = personInfo.linkedInUrl ? "<span style='margin-left: 10px' personid="+personInfo.personId+" class='IN-canvas' rel='"+personInfo.linkedInUrl+"'></span>": ' ';

    var maincard='';
    var val = "";
    var personNotes = (personInfo.Notes === null) ?val:personInfo.Notes;
    if(in_array(levelsToToggle,curlevel) || curlevel==0 || levelsToToggle.length==0)
        maincard="<div class='maincard'>"+sflink+"<div class='left-grey-box'><span class='name'><a   title=\""+personNotes+"\"  href='/EXEC/SiteImprov/MVC/Views/PersonInfo.php?persid=" + personInfo.personId + "' target=_new >" + personInfo.Name + "</a>" + linkedInLink + "</span><p><span class='"+titleClass+"'>"+personInfo.Title+"</span>"+personInfo.Phone+"&nbsp;<a href='mailto:"+ personInfo.Email+"'>"+personInfo.Email+"</a></p></div></div>";
    else
        maincard="<div class='maincard' style='display: none'>"+sflink+"<div class='left-grey-box'><span class='name'><a  title=\""+ personNotes+"\" href='/EXEC/SiteImprov/MVC/Views/PersonInfo.php?persid=" + personInfo.personId + "' target=_new >" + personInfo.Name + "</a>" + linkedInLink + "</span><p><span class='"+titleClass+"'>"+personInfo.Title+"</span>"+personInfo.Phone+"&nbsp;<a href='mailto:"+ personInfo.Email+"'>"+personInfo.Email+"</a></p></div></div>";

    left=(level*150)+'px',

        leftLine="<div class='leftline' style='position:absolute;display:block;visibility:visible;z-index:1;left:-60px;top:31px;width:60px;height:1px;overflow:hidden;background-repeat:no-repeat;border-top:1px dotted #aaa'></div>",

        cardImage=images[level];

    var vertline='';
    var vertleft='';
    var vertheight='';



    for(var i=0;i<level;i++)
    {
        vertleft=(i*-150-60)+"px";
        vertheight=((isLast)&&(i==0))?"52px":"120px";

        if(skipLine.length >0 )
        {
            if (in_array(skipLine,level-i))
            {
                continue;
            }
        }

        var collapseSymbol;

        if(levelsToToggle.length==0)
        {
            collapseSymbol="<div class='minus expand-collapse' per-node-id='"+personInfo.personId+"' level='"+curlevel+"' style='position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/minus.png'/></div>";
        }
        else if(in_array(levelsToToggle,curlevel) && curlevel==Math.max.apply(0, levelsToToggle))
        {
            collapseSymbol="<div class='plus expand-collapse' per-node-id='"+personInfo.personId+"' level='"+curlevel+"' style='position:relative;top:31px;color:#0455a3;left: -9px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/plus.png'/></div>";
        }
        else if(in_array(levelsToToggle,curlevel) && curlevel<Math.max.apply(0, levelsToToggle))
        {
            collapseSymbol="<div class='minus expand-collapse' per-node-id='"+personInfo.personId+"' level='"+curlevel+"' style='position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/minus.png'/></div>";
        }
        else
        {
            collapseSymbol="<div class='plus expand-collapse' per-node-id='"+personInfo.personId+"' level='"+curlevel+"' style='position:relative;top:31px;color:#0455a3;left: -9px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/plus.png'/></div>";

        }

        if(i==0)
            vertline=vertline+"<div class='vertline' style='position:absolute;z-index:1;left:"+vertleft+";top:-22px;width:1px;height:"+vertheight+";border-left:1px dotted #aaa'>"+collapseSymbol+"</div>";
        else
            vertline=vertline+"<div class='vertline' style='position:absolute;z-index:1;left:"+vertleft+";top:-22px;width:1px;height:"+vertheight+";border-left:1px dotted #aaa'></div>";

    }

    if (level==0)
    {
        leftLine=""
        vertline=""
    }

    var curLevelMatchToPrevLevel=window.perviousLevel == curlevel ?true:false;

    if(levelsToToggle.length>0)
    {
        if(in_array(levelsToToggle,curlevel) || curlevel==0)
        {
            var a= typeof $('#'+personInfo.reports_to_id).attr('reports_to_id') == 'undefined' || $('#'+personInfo.reports_to_id).attr('reports_to_id') == null ?'':$('#'+personInfo.reports_to_id).attr('reports_to_id')+',';

            if(curlevel!=0)
                orgCard = "<div id=" + personInfo.personId +  " reports_to_id="+a+','+personInfo.reports_to_id+"  isPrev=" + curLevelMatchToPrevLevel + " level=" + level + " class='orgcard' style='left:" + left + "'><img src='/img/" + cardImage + "'>" + leftLine + vertline + "<span class='cardtext'>" + maincard + "</span></div>";
            else
                orgCard = "<div id=" + personInfo.personId +"  isPrev=" + curLevelMatchToPrevLevel + " level=" + level + " class='orgcard' style='left:" + left + "'><img src='/img/" + cardImage + "'>" + leftLine + vertline + "<span class='cardtext'>" + maincard + "</span></div>";


        }
        else
        {
            maincard=maincard+"<div class='place-holder-card'><div class='left-grey-box-placeholder'> <span class='org-chart-placeholder-text'>Click plus to reveal this contacts</span><span class='org-chart-plus' onclick=''></span></div>";
            var a= typeof $('#'+personInfo.reports_to_id).attr('reports_to_id') == 'undefined' || $('#'+personInfo.reports_to_id).attr('reports_to_id') == null ?'':$('#'+personInfo.reports_to_id).attr('reports_to_id')+',';
            orgCard = "<div  id=" + personInfo.personId + "  reports_to_id="+a+','+personInfo.reports_to_id+"  isPrev=" + curLevelMatchToPrevLevel + " level=" + level + " class='orgcard' style='display:none;left:" + left + "'><img style='height: 45px; width: 300px;' src='/img/" + cardImage + "'>" + leftLine + vertline + "<span class='cardtext'>" + maincard + "</span></div>";
            if(window.perviousLevel==curlevel)
            {
                $('#mapped-nodes .orgcard').last().hide();
            }

        }
    }
    else
    {
        var a= typeof $('#'+personInfo.reports_to_id).attr('reports_to_id') == 'undefined' || $('#'+personInfo.reports_to_id).attr('reports_to_id') == null ?'':$('#'+personInfo.reports_to_id).attr('reports_to_id')+',';
        //  orgCard = "<div  id=" + personInfo.personId + " reports_to_id="+a+personInfo.reports_to_id+"  level=" + level + " class='orgcard' style='left:" + left + "'><img src='/img/" + cardImage + "'>" + leftLine + vertline + "<span class='cardtext'>" + maincard + "</span></div>";

        if(curlevel!=0)
            orgCard = "<div id=" + personInfo.personId +  " reports_to_id="+a+personInfo.reports_to_id+"  isPrev=" + curLevelMatchToPrevLevel + " level=" + level + " class='orgcard' style='left:" + left + "'><img src='/img/" + cardImage + "'>" + leftLine + vertline + "<span class='cardtext'>" + maincard + "</span></div>";
        else
            orgCard = "<div id=" + personInfo.personId +"  isPrev=" + curLevelMatchToPrevLevel + " level=" + level + " class='orgcard' style='left:" + left + "'><img src='/img/" + cardImage + "'>" + leftLine + vertline + "<span class='cardtext'>" + maincard + "</span></div>";
    }


    if(window.perviousLevel==curlevel){
        $('#mapped-nodes .orgcard').last().children('.vertline').children('.minus').remove();
        $('#mapped-nodes .orgcard').last().children('.vertline').children('.plus').remove();
    }
    else  if(window.perviousLevel>curlevel){
        $('#mapped-nodes .orgcard').last().children('.vertline').children('.minus').remove();
        $('#mapped-nodes .orgcard').last().children('.vertline').children('.plus').remove();
    }



    $('#mapped-nodes').append(orgCard);




    var vertLeft=(curlevel*-150-60)+"px";
    var vertlineForLevelOneNode='<div class="vertline zeroLine" style="position:absolute;z-index:1;left:'+vertLeft+';top:-22px;width:1px;height:120px;border-left:1px dotted #aaa"></div></div>';

    if(curlevel==0)
    {
        var vertline='<div class="vertline zeroLine" style="position:absolute;z-index:1;left:-60px;top:-22px;width:1px;height:120px;border-left:1px dotted #aaa"><div class="minus expand-collapse" per-node-id="'+personInfo.personId+'" level="0" style="position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer"><img title="Collapse" src="/img/minus.png"></div></div>';
        var leftLine='<div class="leftline" style="position:absolute;display:block;visibility:visible;z-index:1;left:-60px;top:31px;width:60px;height:1px;overflow:hidden;background-repeat:no-repeat;border-top:1px dotted #aaa"></div>';
        $('#'+personInfo.personId).append(vertline);
        $('#'+personInfo.personId).append(leftLine);

    }
    else
    {
        $('#'+personInfo.personId).append(vertlineForLevelOneNode);
    }

    window.perviousLevel = curlevel;



    if (isLast) {
        skipLine.push(curlevel);
    }

    if(data.childNodes.length > 0)
    {
        level++
        for(var i=0;i<data.childNodes.length;i++)
        {

            if(i!=data.childNodes.length-1)
            {

                constructDescendOrgChart(data.childNodes[i], level, skipLine, false);
                if(level>totalLevels)
                    totalLevels=level;
            }
            else
            {

                constructDescendOrgChart(data.childNodes[i], level, skipLine, true);
                skipLine.pop();
                if(level>totalLevels)
                    totalLevels=level;
            }
        }
    }
}




function in_array(array, id) {
    for(var i=0;i<array.length;i++) {
        if(array[i]==id)
            return true;
    }
    return false;
}



function createCollapseMenu()
{
    var levelCollapse='';

    levelCollapse=levelCollapse+'<li style="margin-right: 5px;padding: 1px 2px 0px 2px;color:#5E5E5E"><input id="showAllLevel" level=-1 name="collapseLevel" type="radio"  checked>Show All Levels</li>'

    for(var i=0;i<=totalLevels;i++)
    {
        levelCollapse=levelCollapse+'<li level='+i+' style="margin-right: 5px;padding: 1px 2px 0px 2px;color: white;background-image:url(/img/'+ images[i]+')"><input level='+i+' name="collapseLevel" type="radio"  disabled=true">'+toWords(i+1)+'Level</li>'
    }



    $('#orgchart-collapse-section').html(levelCollapse);
    var scrollTo=(new String(window.location).match(/_scrollTo=(\d+)/))?RegExp.$1:"";
    if(!scrollTo)
    {
        $('#orgchart-collapse-section').css('background-color','#D7D7D7').css('opacity','0.3');
        $('#orgChartBody').before('<p style="text-align: center;top:28px;position: absolute;font-weight: bolder;color: gray;padding: 0px;width: 1100px;margin: 0 auto;" class="level-processing-msg">Loading Org Chart - Please wait &nbsp <img style="width: 17px;margin-top: 3px" src="/img/login-ajax-img.gif"/></p>');
    }
    $('#orgchart-collapse-section').show();
    $('#mapped-nodes .orgcard[level="0"]').length==0?$('#orgchart-collapse-section li[level="0"],#companyBox').remove():'';
    $('#show-hide-com-details').show();
}


// Convert numbers to words
// copyright 25th July 2006, by Stephen Chapman http://javascript.about.com
// permission to use this Javascript on your web page is granted
// provided that all of the code (including this copyright notice) is
// used exactly as shown (you can change the numbering system if you wish)

// American Numbering System
var th = ['','thousand','million', 'billion','trillion'];
// uncomment this line for English Number System
// var th = ['','thousand','million', 'milliard','billion'];

var dg = ['zero','First','Second','Third','Fourth', 'Fifth','Sixth','Seventh','Eighth','Ninth']; var tn = ['ten','eleven','twelve','thirteen', 'fourteen','fifteen','sixteen', 'seventeen','eighteen','nineteen']; var tw = ['twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];


function toWords(s){s = s.toString(); s = s.replace(/[\, ]/g,''); if (s != parseFloat(s)) return 'not a number'; var x = s.indexOf('.'); if (x == -1) x = s.length; if (x > 15) return 'too big'; var n = s.split(''); var str = ''; var sk = 0; for (var i=0; i < x; i++) {if ((x-i)%3==2) {if (n[i] == '1') {str += tn[Number(n[i+1])] + ' '; i++; sk=1;} else if (n[i]!=0) {str += tw[n[i]-2] + ' ';sk=1;}} else if (n[i]!=0) {str += dg[n[i]] +' '; if ((x-i)%3==0) str += 'hundred ';sk=1;} if ((x-i)%3==1) {if (sk) str += th[(x-i-1)/3] + ' ';sk=0;}} if (x != s.length) {var y = s.length; str += 'point '; for (var i=x+1; i<y; i++) str += dg[n[i]] +' ';} return str.replace(/\s+/g,' ');}

levelsToToggle=new Array();
window.checkedLevel=new Array();

window.isToggleOperationFinished=false;

$('#orgchart-collapse-section input').live('click',function(){

    intialCount=0;

    var level=$(this).attr('level');
    var element=$(this);

    var checkItem={
        level:level,
        elements:element
    }

    if(level!=-1)
    {
        $('#orgchart-collapse-section input[level="-1"]').attr('checked',false);
        if(level==0)
        {
            showCIOsAndCFOs();
            return;
        }


    }
    else if(level==-1)
    {
        $('#orgchart-collapse-section input').attr('checked',false);
        $('#orgchart-collapse-section input[level="-1"]').attr('checked',true);
    }



    window.checkedLevel.push(checkItem);

    $('#orgchart-collapse-section input').attr('disabled',true);
    $('#orgchart-collapse-section').css('background-color','#D7D7D7').css('opacity','0.3');
    $('#orgChartBody').before('<p style="text-align: center;top:28px;position: absolute;font-weight: bolder;color: gray;padding: 0px;width: 1100px;margin: 0 auto;" class="level-processing-msg">Loading Org Chart - Please wait &nbsp <img style="width: 17px;margin-top: 3px" src="/img/login-ajax-img.gif"/></p>');

    window.isToggleOperationFinished=false;

});

setInterval(function(){

    if(window.checkedLevel.length>0)
    {
        window.isToggleOperationFinished=true;
        var item=window.checkedLevel.pop();
        reCreateOrgChart(0);
        $('#unmapped-nodes .orgcard').show();
        window.checkedLevel.length=0;

    }

},1500);



function reCreateOrgChart(startCount)
{
    var nodeToProcess=5;
    var currentCheckElement=$('#orgchart-collapse-section input:checked').attr('level');

    var levels=new Array();

    var pervNodeLevelId=0;

    jq('#mapped-nodes .orgcard').filter(function(){




        var element=$(this)
        var previousElement=$(this).prev();

        var currentNodeLevel=$(element).attr('level');
        var previousLevel=$(previousElement).attr('level');
        var nextLevel=element.next().attr('level');

        levels.push(currentNodeLevel);

        if(currentCheckElement=="-1")
        {
            $(element).show();

            if((currentNodeLevel-previousLevel)==1)
            {
                var personId=previousElement.attr('id');
                var level=previousElement.attr('level');
                if(currentCheckElement>level || currentCheckElement=="-1")
                {
                    var minus="<div class='minus expand-collapse' per-node-id='"+personId+"' level='"+level+"' style='position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/minus.png'></div>";
                    $('#'+personId).children('.vertline').children().remove();
                    $('#'+personId).children('.vertline').first().append(minus);
                }
            }

            if(currentNodeLevel>nextLevel)
                $(element).children('.vertline').children().remove();

        }
        else
        {

            if((currentNodeLevel-previousLevel)==1)
            {
                var personId=previousElement.attr('id');
                var level=previousElement.attr('level');
                if(currentCheckElement>level || currentCheckElement=="-1")
                {
                    var minus="<div class='minus expand-collapse' per-node-id='"+personId+"' level='"+level+"' style='position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/minus.png'></div>";
                    $('#'+personId).children('.vertline').children().remove();
                    $('#'+personId).children('.vertline').first().append(minus);
                }
            }

            if(currentNodeLevel==1)
            {
                var max=Math.max.apply(0,levels);
                var personId=pervNodeLevelId!=0?pervNodeLevelId:'undefined';
                pervNodeLevelId=element.attr('id');


                if(max<currentCheckElement && typeof personId!='undefined')
                {
                    jq('#'+personId).nextUntil('.orgcard[level=1]').filter('.orgcard[level!=0]').hide();
                    var plusSign="<div class='plus expand-collapse' per-node-id='"+personId+"' level='1' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";
                    if((!$('#'+personId).children('.vertline').first().children().hasClass('plus') && $('#'+personId).children('.vertline').first().children().hasClass('expand-collapse') ))
                    {
                        $('#'+personId).children('.vertline').children().first('.expand-collapse').remove();
                        $('#'+personId).children('.vertline').first().append(plusSign);
                    }

                }


                levels.length=0;
            }



            if(currentNodeLevel>currentCheckElement)
            {
                var id=$(element).attr('id');
                var level=element.attr('level');
                var prevLevelId=$(previousElement).attr('id');
                var level=Number(currentNodeLevel)-1;
                var plusSign="<div class='plus expand-collapse' per-node-id='"+id+"' level='"+level+"' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";
                if((currentNodeLevel-currentCheckElement)==1  && currentNodeLevel!=previousLevel)  $('#'+prevLevelId).children('.vertline').children().remove();
                if((currentNodeLevel-currentCheckElement)==1 && currentNodeLevel!=previousLevel ) $('#'+prevLevelId).children('.vertline').first().append(plusSign);
                //$('#mapped-nodes').append(element);
                $('#'+id).last().hide();

            }
            else
            {
                if(currentCheckElement!="-1")
                    $(element).last().show();
            }

            if(previousLevel>currentNodeLevel)
                $(previousElement).children('.vertline').children().remove();


        }


    });


    $('.level-processing-msg').remove();
    $('#orgchart-collapse-section').css('background-color','#FAFAFA').css('opacity','1');
    $('#orgchart-collapse-section input').attr('disabled',false);

}



function showCIOsAndCFOs()
{
    $('#mapped-nodes .orgcard').hide();
    $('#companyBox').show();

    //$('#unmapped-nodes .orgcard').hide();

    $('#mapped-nodes .orgcard[level="0"]').filter(function(){

        var id=$(this).attr('id');
        $(this).children('.zeroLine').children('.expand-collapse').remove();
        var plusSign="<div class='plus expand-collapse' per-node-id='"+id+"' level='0' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";
        $(this).children('.zeroLine').append(plusSign);
    });

    $('#mapped-nodes .orgcard[level="0"]').show();

};



function buildCRMIcons(personInformation)
{

    var personId=personInformation.personId;

    var isMobile=false;

    var sfLink="<table class='org_sf' cellspacing='0' cellpadding='0' border='0' style='float:right;margin-right:20px'><tbody><tr><td align='center'>";

    if (personInformation.sfstatus==0) {sfLink=sfLink+'<img src="/img/salesforce-lead-tick.png?20110101" class="sfbutton sflead_button crmorgcharticon" class="sfbutton sflead_button" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your SalesForce account.">'}

    else if (personInformation.sfstatus==1) {sfLink=sfLink+'<img src="/images/warning24.png?20110101" class="sfbutton sflead_button crmorgcharticon" class="sfbutton sflead_button" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your SalesForce Account. Click here to load it again.">'}

    else { sfLink=sfLink+'<img src="/img/salesforce-lead-icon.png?20110101" class="sfbutton sflead_button crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="Upload this LEAD to your SalesForce Account.">' };


    if ( ! isMobile ) {

        sfLink=sfLink+"</td><td align='center'>";

        if (personInformation.sfstatus==2) {sfLink=sfLink+'<img src="/img/salesforce-contact-tick.png?20110101" class="sfbutton sfcontact_button crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your SalesForce account.">'}

        else if (personInformation.sfstatus==3) {sfLink=sfLink+'<img src="/images/warning24.png?20110101" class="sfbutton sfcontact_button crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your SalesForce Account. Click here to load it again.">'}

        else {sfLink=sfLink+'<img src="/img/salesforce-contact-icon.png?20110101" class="sfbutton sfcontact_button crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="Upload as a CONTACT to your SalesForce Account.">'};

    }

    sfLink=sfLink+"</td></tr>";


    if (! isMobile ) {

        //begin MSCRM

        sfLink=sfLink+"<tr><td class='mscrmtable crmorgcharticon' align='center'>";

        if (personInformation.mscrmstatus==0) {sfLink=sfLink+'<img src="/img/mscrm-lead-tick.png?20110101" value="' +personId+'" class="msdynbutton msdynbutton_lead crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your MS Dynamics CRM account.">'}

        else if (personInformation.mscrmstatus==1) {sfLink=sfLink+'<img src="/images/warning24.png?20110101" value="' +personId+'" class="msdynbutton msdynbutton_lead crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your MS Dynamics CRM Account. Click here to load it again.">'}

        else {sfLink=sfLink+'<img title="Add this lead to your MS Dynamics CRM account." value="' +personId+'" class="msdynbutton msdynbutton_lead crmorgcharticon" src="/img/mscrm-lead-icon.png?20110101">'};

        sfLink=sfLink+"</td><td class='mscrmtable crmorgcharticon' align='center'>";

        if (personInformation.mscrmstatus==2) {sfLink=sfLink+'<img src="/img/mscrm-contact-tick.png?20110101" value="' +personId+'" class="msdynbutton msdynbutton_contact crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your MS Dynamics CRM account.">'}

        else if (personInformation.mscrmstatus==3) {sfLink=sfLink+'<img src="/images/warning24.png?20110101" value="' +personId+'" class="msdynbutton msdynbutton_contact crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your MS Dynamics CRM Account. Click here to load it again.">'}

        else {sfLink=sfLink+'<img title="Add this contact to your MS Dynamics CRM account." value="' +personId+'" class="msdynbutton msdynbutton_contact crmorgcharticon" src="/img/mscrm-contact-icon.png?20110101">'};

        sfLink=sfLink+"</td>";

        //begin SugarCRM

        sfLink=sfLink+"<td class='sugarcrmtable crmorgcharticon' align='center'";

        if (personInformation.sugarcrmstatus==0) {sfLink=sfLink+'<img src="/img/sugar_lead_tick.png?20110101" value="' +personId+'" class="sugarbutton sugarbutton_lead crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your SugarCRM account.">'}

        else if (personInformation.sugarcrmstatus==1) {sfLink=sfLink+'<img src="/images/sugar_warning.png?20110101" value="' +personId+'" class="sugarbutton sugarbutton_lead crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your SugarCRM Account. Click here to load it again.">'}

        else {sfLink=sfLink+'<img title="Add this lead to your SugarCRM account." value="' +personId+'" class="sugarbutton sugarbutton_lead crmorgcharticon" src="/images/sugar_logo_lead.png?20110101">'};

        sfLink=sfLink+"</td><td class='sugarcrmtable crmorgcharticon' align='center'";

        if (personInformation.sugarcrmstatus==2) {sfLink=sfLink+'<img src="/img/sugar_contact_tick.png?20110101" value="' +personId+'" class="sugarbutton sugarbutton_contact crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your SugarCRM account.">'}

        else if (personInformation.sugarcrmstatus==3) {sfLink=sfLink+'<img src="/images/sugar_warning.png?20110101" value="' +personId+'" class="sugarbutton sugarbutton_contact crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your SugarCRM Account. Click here to load it again.">'}

        else {sfLink=sfLink+'<img title="Add this contact to your SugarCRM account." value="' +personId+'" class="sugarbutton sugarbutton_contact crmorgcharticon" src="/images/sugar_logo_contact.png?20110101">'};

		

		sfLink=sfLink+"</td>";

        //begin NetSuite

        sfLink=sfLink+"<td class='netsuitetable crmorgcharticon' align='center'>";

        if (personInformation.netsuitestatus==2) {sfLink=sfLink+'<img src="/img/netsuite_contact_tick.png?20110101" value="' +personId+'" class="netsuitebutton netsuitebutton_contact crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has already been uploaded to your NetSuite account.">'}

        else if (personInformation.netsuitestatus==3) {sfLink=sfLink+'<img src="/images/warning24.png?20110101" value="' +personId+'" class="netsuitebutton netsuitebutton_contact crmorgcharticon" value="'+personId+'" style="cursor:pointer;border:none" title="This contact has been updated since you last uploaded it to your NetSuite Account. Click here to load it again.">'}

        else {sfLink=sfLink+'<img title="Add this contact to your NetSuite account." value="' +personId+'" class="netsuitebutton netsuitebutton_contact crmorgcharticon" src="/img/netsuite_contact_icon.png?20110101">'};




        sfLink=sfLink+"</td></tr>";
    }

    sfLink=sfLink+"</tbody></table>";


    return sfLink;

}

createCompanyInformationDetail=function()
{
    $('#tabs').show();
    $('#tabs  div[id^="tabs-"]').hide();
    $('#tabs div:first, #tabs div#tabs-1').show();
    $('#tabs ul li:first').addClass('active');

    $('#tabs ul li a').live('click', function () {

        $('#tabs ul li').removeClass('active');

        $(this).parent().addClass('active');


        var  currentTab =  $(this).attr('href');

        $(currentTab).find("div").attr("style", "overflow:auto;");

        $(currentTab).find("div").attr("style", "overflow:hidden;");

        $('#tabs div[id^="tabs-"]').hide();

        $(currentTab).show();

        return false;

    });


    var tabCount = 1;
    var heading = "";
    var techGroups={"Business Intelligence":"Applications","Collaboration":"Applications","CRM / Marketing Automation":"Applications","Data Management":"Applications","Data Storage":"Infrastructure","Databases":"Development","Enterprise Applications":"Applications","ERP / HR / HCM / FI":"Applications","Hardware/OS/Systems Environment":"Infrastructure","ITSM":"Infrastructure","Languages":"Development","Networking":"Infrastructure","Other Technologies / ITO Agreements / IT Intel":"Other","Programming Tools":"Development","Security":"Infrastructure","Servers":"Infrastructure","Telecommunications":"Infrastructure","Virtualization":"Infrastructure"};
    var techDepts={"Business Intelligence":"IT,FI","Collaboration":"IT","CRM / Marketing Automation":"IT","Data Management":"IT","Data Storage":"IT","Databases":"IT","Enterprise Applications":"IT","ERP / HR / HCM / FI":"IT,FI","Hardware/OS/Systems Environment":"IT","ITSM":"IT","Languages":"IT","Networking":"IT","Other Technologies / ITO Agreements / IT Intel":"IT","Programming Tools":"IT","Security":"IT","Servers":"IT","Telecommunications":"IT","Virtualization":"IT"};
    var dept=(location.href.match(/finance/))?"FI":"IT";
    var str = ($('#data-management-container').length)?$('#data-management-container').html():"";
    if ((!str)||(typeof str=="undefined") || (!str.length)) {str=""};
    var results = [], contents = [],div="";
    //str = str.replace(/<br>/gi,'');
    //str = str.replace(/\n/gi,'');
    results = str.split(/<b>/i);
    var hideCheck = 1;
    for(var i=0;i<results.length;i++){
        var parts=results[i].split(/<\/b>/i);
        if(typeof parts[1] != 'undefined' && techDepts[parts[0]].match(new RegExp(dept))){
            var tabnum=$('#mycarousel li a:contains('+techGroups[parts[0]]+')').attr('href');
            $('div#'+tabnum+' div.data-management-container').append('<strong>'+parts[0]+'</strong>'+parts[1]);
        }
    }

    var length=0;

    $('.data-management-container').slice(0,4).each(function(){
        length=length+$(this).html().length;
    })

    if(!length)
        $('#technology-search').remove();


    $('a[href="#tab-5"]').show();

    $('.categories').each(function(){

        var that=$(this);


        var length=$(this).html().length;
        if(length<=22)
        {
            $(this).hide();
            return;
        }
        var categoires=$(this).html();
        var category=categoires.split(',')
        var string='';

        for(var i=0;i<category.length;i++)
        {
            string=string+'<a style="text-decoration:none" class="category">'+category[i]+'</a>';
        }

        that.css('float','none').css('display','block');
        that.html(string);



    });

    $('#inner-tabs > div.content_box').each(function() {
        if ($(this).find('div.data-management-container').html().length<6) {
            var tab=$(this).attr('id');
            $('a[href="#'+tab+'"]').hide();
        }
    });


    if(!$('#tabs-5 .data-management-container table tr').length)
        $('a[href="#tabs-5"]').hide();

    if (!$('ul#mycarousel li:visible').length) {
        $('#tabs').hide();
    }

    if($('#company_detail').html()==""){
        $('#company_description').css('display','none');
    } else{
        $('#company_description').css('display','block');
    }

    $('#mycarousel li').each(function() {
        if (!$(this).find('a').length) {$(this).remove()}
    });

    if ($('a[href^=#tabs-]:visible').length == 1) {
        $('a[href^=#tabs-]:visible').click();
    }

}



$('.category').live('click',function(){

    var valueofRtt=$(this).html();

    var href="/cgi-bin/webdata_pro.pl?_cgifunction=search&amp;_layout=all_newsfeeds&amp;news.active=1&amp;news.categories="+ $.trim(valueofRtt);

    window.open(href);

    return false;
});


//auto scroll...
$.fn.autoscroll = function(speed) {
    $('html,body').animate(
        {
            //scrollLeft: this.offset().left,
            scrollTop: (this.offset().top-$(window).height()/2+50)
        },
        speed
    );
    return this;
};


function scrollTo(personId)
{
    var $orgCard = $('#'+personId);
    var extraMarginStyles = '';
    if ($orgCard.css('left').replace('px','').replace('auto','0') == 0) {
        if ($orgCard.offset().left > 500) {
            extraMarginStyles = 'margin-left:-29px;margin-top:-60px;';
        } else {
            extraMarginStyles = 'margin-left:-40px;margin-top:-60px;';
        }
    }
    $('.pointer').remove();

    var card=$('#'+personId).autoscroll(2500).find('div:eq(1)').append('<div class="pointer" style="position:relative;top:34px;' + extraMarginStyles + 'color:red;left:-4px;font-size:24pt;">&#9654;</div>');
}


$('#jobfunction').change(function(){

    var selectedValue=$(this).val();

    var personId=$(".title:contains('"+selectedValue+"')").parent().parent().parent().parent().parent().attr('id');

    scrollTo(personId);

});


$('#show-hide-com-details').click(function(){
    //$('.chart-container').slideToggle('slow');
    $('#company_description').slideToggle('slow');
    $('.char-container-right').slideToggle('slow');
    $('.technologies').slideToggle('slow');
    $('#technology-search').slideToggle('slow');
    window.scrollTo(0,0);

})


$('#technology-search').bind('keyup',function(e)
{


    // if(e.keyCode==13)
    // {

    var searchTerm=$(this).val();

    // for(var i=0;i<searchTerms.length;i++)
    // {
    //  var searchTerm=searchTerms[i];

    var tab=new Hilitor('tabs');
    if(searchTerm)
    {
        tab.apply(searchTerm);
        var a=jQuery("#tabs-1 .data-management-container em")
        if(a.length>0)
        {
            $('a[href="#tabs-1"] .hit-count').remove();
            $('a[href="#tabs-1"]').append('<span  class="hit-count" title="Match is present for the above keyword"><img style="width:13px" src="/img/tick.png"></span>');
            //  tab_1.apply(searchTerm);
        }
        else
            $('a[href="#tabs-1"] .hit-count').remove();


        var a=jQuery("#tabs-2 .data-management-container em")
        if(a.length>0)
        {
            $('a[href="#tabs-2"] .hit-count').remove();
            $('a[href="#tabs-2"]').append('<span  class="hit-count" title="Match is present for the above keyword"><img style="width:13px" src="/img/tick.png"></span>');
        }
        else
            $('a[href="#tabs-2"] .hit-count').remove();


        var a=jQuery("#tabs-3 .data-management-container em")
        if(a.length>0)
        {
            $('a[href="#tabs-3"] .hit-count').remove();
            $('a[href="#tabs-3"]').append('<span  class="hit-count" title="Match is present for the above keyword"><img style="width:13px" src="/img/tick.png"></span>');
        }
        else
            $('a[href="#tabs-3"] .hit-count').remove();

        var a=jQuery("#tabs-4 .data-management-container em")
        if(a.length>0)
        {
            $('a[href="#tabs-4"] .hit-count').remove();
            $('a[href="#tabs-4"]').append('<span  class="hit-count" title="Match is present for the above keyword"><img style="width:13px" src="/img/tick.png"></span>');
        }

        else
            $('a[href="#tabs-4"] .hit-count').remove();



    }
    else
        tab.remove();


    // }

    if(!searchTerm)
        $('.hit-count').remove();



});



$('.minus').live('click',function(){

    var personId = $(this).attr('per-node-id');
    var curlevel = $(this).attr('level');




    var plusSign="<div class='plus expand-collapse' per-node-id='"+personId+"' level='"+curlevel+"' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";


    $(this).after(plusSign);

    $(this).remove();

    jq('.orgcard[reports_to_id*='+personId+']').hide();

});


$('.plus').live('click',function(){

    var personId =$(this).parent().parent().attr('id'); //$(this).attr('per-node-id');
    var curlevel = $(this).attr('level');
    var nextLevel=Number(Number(curlevel)+1);

    var minus="<div class='minus expand-collapse' per-node-id='"+personId+"' level='"+curlevel+"' style='position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/minus.png'></div>";

    $(this).after(minus);

    $(this).remove();

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+']').children('img').css('height','90px').css('width','475px');

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+'] .cardtext .place-holder-card').hide();

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+'] .cardtext .maincard').show();

    var plusSign="<div class='plus' per-node-id='"+personId+"' level='"+nextLevel+"' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+']').children('.vertline').children('.minus').replaceWith(plusSign);

    jq('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+']').show();

})





function collapse(elements)
{
    for(var i=0;i<elements.length;i++)
    {
        var personId=$(elements[i]).attr('id');

        var personId = $('#'+personId + ' .expand-collapse').attr('per-node-id');

        var curlevel = $('#'+personId + ' .expand-collapse').attr('level');

        $('#'+personId + ' .expand-collapse').remove();

        var plusSign="<div class='plus expand-collapse' per-node-id='"+personId+"' level='"+curlevel+"' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";

        $('#'+personId).children('.vertline').first().append(plusSign);

        jq('.orgcard[reports_to_id*='+personId+']').hide();
    }
}

function Expand(personId)
{
    var personId = $('#'+personId + ' .expand-collapse').attr('per-node-id');
    var curlevel = $('#'+personId + ' .expand-collapse').attr('level');

    var nextLevel=Number(Number(curlevel)+1);


    var minus="<div class='minus' per-node-id='"+personId+"' level='"+curlevel+"' style='position:relative;top:32px;color:#0455a3;left: -7px;font-size:24pt;cursor:pointer'><img title='Collapse'  src='/img/minus.png'></div>";

    $('#'+personId + ' .expand-collapse').after(minus);

    $('#'+personId + ' .expand-collapse').remove();

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+']').children('img').css('height','90px').css('width','475px');

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+'] .cardtext .place-holder-card').hide();

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+'] .cardtext .maincard').show();

    var plusSign="<div class='plus' per-node-id='"+personId+"' level='"+nextLevel+"' style='position:relative;top:42px;color:#0455a3;left: -9px;font-size:16pt;cursor:pointer'><img title='Expand'  src='/img/plus.png'></div>";

    $('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+']').children('.vertline').children('.minus').replaceWith(plusSign);

    jq('.orgcard[reports_to_id*='+personId+'][level='+nextLevel+']').show();

}



/*

 $('#viewPdf').click(function(){
 var currentCheckedItem=$('#orgchart-collapse-section input:checked').attr('level');
 if(currentCheckedItem=="-1")
 window.open("/cgi-bin/webdata_pro.pl?_cgifunction=createPDF&co.CO_ID="+viewModel.companyDetail.coId()+'&level=10','_blank');
 else
 window.open("/cgi-bin/webdata_pro.pl?_cgifunction=createPDF&co.CO_ID="+viewModel.companyDetail.coId()+'&level='+currentCheckedItem,'_blank');
 })
 */



