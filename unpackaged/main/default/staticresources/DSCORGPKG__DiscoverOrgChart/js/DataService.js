/**
 * Created with JetBrains PhpStorm.
 * User: Employee Login
 * Date: 11/29/13
 * Time: 12:39 PM
 * To change this template use File | Settings | File Templates.
 */


var dataService=new function()
{
    var serviceBase='../Controller',

        getCompanyDetail=function(fetchAttributes,callback,elementsToBind){

            var coId=fetchAttributes.coId;
            var currentPageNo=fetchAttributes.currentPageNo;
            var sortCondition=fetchAttributes.currentSortCondition;
            var filterCondition=fetchAttributes.currentFilter;
            var limit=fetchAttributes.limit;
            var type=fetchAttributes.type;

            $.ajax({
                url: serviceBase+'/CompanyInfo/Company.php?coid='+coId+'&page='+currentPageNo+'&search='+filterCondition+'&sort='+sortCondition+'&limit='+limit+'&type='+type,
                dataType:'json'
            }).done(function(data){
                    if(elementsToBind=='undefined')
                        callback(data);
                    else
                        callback(data,elementsToBind);
                });

        },


        getPersonDetail=function(fetchAttributes,callback)
        {
            var personId=fetchAttributes.personId;

            $.ajax({
                url: serviceBase+'/PersonInfo/Contact.php?persid=' + personId,
                dataType:'json'
            }).done(function(data){
                    callback(data);
                })
        },

        getOrgChartData=function(fetchAttributes,callback)
        {
            var companyId=fetchAttributes.companyId;
            var requireDetail=fetchAttributes.fetchCompanyDetail;
            var start=fetchAttributes.start;
            var end=fetchAttributes.end;


            var url=serviceBase+'/OrgChart/orgchart.php?co_id='+companyId+'&require_detail='+requireDetail+'&start='+start+'&end='+end;

            if(fetchAttributes.sortColumn)
                url=url+'&sortColumn='+fetchAttributes.sortColumn;
            if(fetchAttributes.sortOrder)
                url=url+'&sortOrder='+fetchAttributes.sortOrder;

            $.ajax({
                url:url,
                dataType:'json'
            }).done(function(data){
                    callback(data,fetchAttributes.createCollapseMenu);
                })
        },

        getFirstLevelNodeInOrgChart=function(companyId,requireDetail,personId,isLast,callback)
        {
            var url=serviceBase+'/OrgChart/orgchart.php?co_id='+companyId+'&require_detail='+requireDetail+'&personId='+personId;

            $.ajax({
                url:url,
                dataType:'json'
            }).done(function(data){
                    callback(data,personId,isLast);
                })
        },
        createOrgChartPDF=function(companyId,callback)
        {
            var url='/cgi-bin/webdata_pro.pl?_cgifunction=createPDF&amp;co.CO_ID='+companyId;

            $.ajax({
                url:url
            }).done(function(data){
                    callback(data);
                })
        }

    return{
        getCompanyInformation:getCompanyDetail,
        getPersonDetail:getPersonDetail,
        getOrgChartData:getOrgChartData,
        getFirstLevelNodeInOrgChart:getFirstLevelNodeInOrgChart,
        createOrgChartPDF:createOrgChartPDF

    };

}();