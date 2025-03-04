public class SpringCMRest {
    
    private static CurrentEnvironment__c cEnv;
    private static String currentEnvironment;
    private static SpringCM_REST_Environmental__c envProps;
    
    static {
        cEnv = CurrentEnvironment__c.getInstance('currentEnvironment');
        if (cEnv != null) {
            currentEnvironment = cEnv.environment__c;
            envProps = SpringCM_REST_Environmental__c.getInstance(currentEnvironment);
        }
    }
    
    public static HttpResponse Get(String url, String contentType, String accessToken) {
        if (envProps == null) return null;
        
        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        url = url.indexOf('/') == 0 ? envProps.Base_URL__c + url : url;
        req.setEndpoint(url);
        req.setHeader('Authorization', 'oauth ' + accessToken);
        req.setHeader('Content-Type', contentType == '' ? 'application/json' : contentType);
        HttpResponse res = new HttpResponse();
        if (Test.isRunningTest()) {
            System.assertEquals('GET', req.getMethod());

            // Create a fake response
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"Name":"SCM March 31","CreatedDate":"2015-04-01T03:41:38.847Z","CreatedBy":"SpringCM","UpdatedDate":"2015-04-01T03:41:38.847Z","UpdatedBy":"SpringCM","Description":"","ParentFolder":{"Href":"SpringCM"},"BrowseDocumentsUrl":"SpringCM","AccessLevel":{"See":true,"Read":true,"Write":true,"Move":true,"Create":true,"SetAccess":true},"Documents":{"Href":"SpringCM"},"Folders":{"Href":"SpringCM"},"EosInfo":{"Name":"SCM March 31","Path":"Accounts/SpringCM Test March 31/Opportunities","ObjectId":"SpringCM","ObjectType":"Salesforce.Opportunity","Folder":"SpringCM"},"ShareLinks":{"Href":"SpringCM"},"CreateDocumentHref":"SpringCM","Href":"SpringCM"}');
            res.setStatusCode(200);
            }
        else {
            Http http = new Http();
            res = http.send(req);
            }
        return res;
        }
/*
    public static HttpResponse Head(String url, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setMethod('HEAD');
        url = url.indexOf('/') == 0 ? envProps.Base_URL__c + url : url;
        req.setEndpoint(url);
        req.setHeader('Authorization', 'oauth ' + accessToken);
        req.setHeader('Content-Type', 'application/json');
        HttpResponse res = new HttpResponse();
        if (Test.isRunningTest()) {
            System.assertEquals('GET', req.getMethod());

            // Create a fake response
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"Name":"SCM March 31","CreatedDate":"2015-04-01T03:41:38.847Z","CreatedBy":"SpringCM","UpdatedDate":"2015-04-01T03:41:38.847Z","UpdatedBy":"SpringCM","Description":"","ParentFolder":{"Href":"SpringCM"},"BrowseDocumentsUrl":"SpringCM","AccessLevel":{"See":true,"Read":true,"Write":true,"Move":true,"Create":true,"SetAccess":true},"Documents":{"Href":"SpringCM"},"Folders":{"Href":"SpringCM"},"EosInfo":{"Name":"SCM March 31","Path":"Accounts/SpringCM Test March 31/Opportunities","ObjectId":"SpringCM","ObjectType":"Salesforce.Opportunity","Folder":"SpringCM"},"ShareLinks":{"Href":"SpringCM"},"CreateDocumentHref":"SpringCM","Href":"SpringCM"}');
            res.setStatusCode(200);
            }
        else {
            Http http = new Http();
            res = http.send(req);
            }
        return res;
        }
*/
    public static HttpResponse Post(String url, String body, Blob docBody, String accessToken, Boolean isDocumentUpload) {
        if (envProps == null) return null;
        
        HttpRequest req = new HttpRequest();
        req.setMethod('POST');
        if (isDocumentUpload) req.setBodyAsBlob(docBody);
        else req.setBody(body);
        url = url.indexOf('/') == 0 ? envProps.Base_URL__c + url : url;
        req.setEndpoint(url);
        if (accessToken != '') req.setHeader('Authorization', 'oauth ' + accessToken);
        req.setHeader('Content-Type', isDocumentUpload ? 'multipart/form-data' : 'application/json');
        HttpResponse res = new HttpResponse();
        if (Test.isRunningTest()) {
            System.assertEquals('POST', req.getMethod());

            // Create a fake response
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"Name":"SCM March 31","CreatedDate":"2015-04-01T03:41:38.847Z","CreatedBy":"SpringCM","UpdatedDate":"2015-04-01T03:41:38.847Z","UpdatedBy":"SpringCM","Description":"","ParentFolder":{"Href":"SpringCM"},"BrowseDocumentsUrl":"SpringCM","AccessLevel":{"See":true,"Read":true,"Write":true,"Move":true,"Create":true,"SetAccess":true},"Documents":{"Href":"SpringCM"},"Folders":{"Href":"SpringCM"},"EosInfo":{"Name":"SCM March 31","Path":"Accounts/SpringCM Test March 31/Opportunities","ObjectId":"SpringCM","ObjectType":"Salesforce.Opportunity","Folder":"SpringCM"},"ShareLinks":{"Href":"SpringCM"},"CreateDocumentHref":"SpringCM","Href":"SpringCM"}');
            if (accessToken == '') res.setBody('{"RefreshToken":"bar", "AccessTokenUrl":"accesstokenurl"}');
            if (isDocumentUpload) res.setBody('{"Name":"Testing","CreatedDate":"2015-04-06T18:01:21.807Z","CreatedBy":"zgoliak@springcm.com","UpdatedDate":"2015-04-06T18:01:21.8Z","UpdatedBy":"zgoliak@springcm.com","Description":"","ParentFolder":{"Href":"https://apiuatna11.springcm.com/v201411/folders/d47a6e9a-8d07-e411-903f-6c3be5a75f4d"},"HistoryItems":{"Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d/historyitems"},"AccessLevel":{"See":true,"Read":true,"Write":true,"Move":true,"Create":true,"SetAccess":true},"PageCount":0,"Lock":{"Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d/lock"},"PreviewUrl":"https://uatna11.springcm.com/atlas/Documents/Preview.aspx?aid=7531&ldUid=fb972aee-86dc-e411-bd70-6c3be5a75f4d","Versions":{"Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d/versions"},"ShareLinks":{"Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d/sharelinks"},"DocumentProcessTrackingActivities":{"Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d/documentprocesstrackingactivities"},"DocumentReminders":{"Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d/documentreminders"},"DownloadDocumentHref":"https://apidownloaduatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d","Href":"https://apiuatna11.springcm.com/v201411/documents/fb972aee-86dc-e411-bd70-6c3be5a75f4d"}');
            else {
                if (body.contains('fail')) res.setStatusCode(400);
                else res.setStatusCode(200);
                }
            }
        else {
            Http http = new Http();
            res = http.send(req);
            }
        return res;
        }
    }