public class SpringCM201411 {
    private String accessToken { get; set; }
    private String expirationDateTime { get; set; }
    private String scope { get; set; }
    private String baseUrl { get; set; }

    private CurrentEnvironment__c cEnv;
    private String currentEnvironment;
    private SpringCMUtilities utils = new SpringCMUtilities();
    private SpringCM_REST_Environmental__c envProps = new SpringCM_REST_Environmental__c();

    public class SpringCMRESTException extends Exception {}

    public SpringCM201411() {
        cEnv = CurrentEnvironment__c.getInstance('currentEnvironment');
        if (cEnv != null) {
            currentEnvironment = cEnv.environment__c;
            envProps = SpringCM_REST_Environmental__c.getInstance(currentEnvironment);
        }
    }

    public void AuthenticateUsingSession(String sId) {
        if (accessToken != null || envProps == null) return;

        String cId = envProps.API_Key__c;
        String cSecret = envProps.Client_Secret__c;
        String authenticationBaseUrl = envProps.Auth_URL__c;
        String pUrl = Url.getSalesforceBaseUrl().toExternalForm() + '/services/Soap/u/32.0/' +
                UserInfo.getOrganizationId();
        String body = '{"ClientId":"' + cId + '","ClientSecret":"' + cSecret + '","SFSessionId":"' +
                sId + '","ApiUri":"' + pUrl + '"}';
        HttpResponse res = SpringCMRest.Post(authenticationBaseUrl + 'sfaccesstoken', body, null, '', false);
        if (res == null) return;
        
        System.debug(res);
        if (res.getStatusCode() == 200) {
            Map<String,Object> m = (Map<String,Object>)JSON.deserializeUntyped(res.getBody());
            accessToken = (String)m.get('AccessTokenValue');
            expirationDateTime = (String)m.get('ExpirationDateTime');
            scope = (String)m.get('Scope');
            baseUrl = (String)m.get('BaseURL');
            }
        else throw new SpringCMRESTException('Authentication using Salesforce User session failed with message:\n' + res.getStatus());
        }

    public void AuthenticateUsingAPIUser() {
        if (accessToken != null || envProps == null) return;

        String cId = envProps.API_Key__c;
        String cSecret = envProps.Client_Secret__c;
        String authenticationBaseUrl = envProps.Auth_URL__c;
        String body = '{"ClientId":"' + cId + '","ClientSecret":"' + cSecret + '"}';
        HttpResponse res = SpringCMRest.Post(authenticationBaseUrl + 'apiuser', body, null, '', false);
        if (res == null) return;

        System.debug(res);
        if (res.getStatusCode() == 200) {
            Map<String,Object> m = (Map<String,Object>)JSON.deserializeUntyped(res.getBody());
            accessToken = (String)m.get('AccessTokenValue');
            expirationDateTime = (String)m.get('ExpirationDateTime');
            scope = (String)m.get('Scope');
            baseUrl = (String)m.get('BaseURL');
            }
        else throw new SpringCMRESTException('Authentication using Salesforce User session failed with message:\n' + res.getStatus());
        }

    public Map<String,Object> StartWorkflow(String wfName, String params, String sId) {
        if (!utils.isValid(wfName)) throw new SpringCMRESTException('No Workflow name provided');
        sId = sId == '' ? null : sId;
        params = params == null ? '' : params;
        String url = '/v201411/workflows';
        String body = '{"name":"' + wfName + '","Params":"' + params + '"}';
        System.debug('Access Token: ' + accessToken);
        if (accessToken == null || accessToken == '')
            if (sId == null) AuthenticateUsingAPIUser();
            else AuthenticateUsingSession(sId);
        System.debug('Access Token: ' + accessToken);
        HttpResponse res = SpringCMRest.Post(baseUrl != null ? baseUrl + url : url, body, null, accessToken, false);
        if (res == null) return null;

        System.debug(res);
        if (res.getStatusCode() >= 400)
            utils.retryGet(baseUrl != null ? baseUrl + url : url, body, accessToken, 10000);

        if (res.getStatusCode() < 400)
            return (Map<String,Object>)JSON.deserializeUntyped(res.getBody());
        return null;
        //String name = (String)m.get('Name');
        //String startDate = (String)m.get('StartDate');
        //String endDate = (String)m.get('EndDate');
        //String status = (String)m.get('Status');
        //String info = (String)m.get('Info');
        //String params = (String)m.get('Params');
        //Object workflowDocuments = (String)m.get('WorkflowDocuments');
        //String href = (String)m.get('Href');
        }

    public Map<String,Object> GetFolder(String id, String type, String sId, String url) {
        if (!utils.isValid(id)) throw new SpringCMRESTException('No object identifier provided');
        if (!utils.isValid(type)) throw new SpringCMRESTException('No object type provided');
        sId = sId == '' ? null : sId;
        url = '/v201411/folders?eosObjectType=' + type + '&eosObjectId=' + id + url;
        if (accessToken == null || accessToken == '')
            if (sId == null) AuthenticateUsingAPIUser();
            else AuthenticateUsingSession(sId);
        HttpResponse res = SpringCMRest.Get(baseUrl != null ? baseUrl + url : url, '', accessToken);
        if (res == null) return null;

        System.debug(res);
        if (res.getStatusCode() >= 400)
            utils.retryGet(baseUrl != null ? baseUrl + url : url, null, accessToken, 10000);

        if (res.getStatusCode() < 400)
            return (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
        return null;
        }

    public Map<String,Object> UploadDocument(String id, String type, String name, Blob document, String sId) {
        if (!utils.isValid(name)) throw new SpringCMRESTException('No document name provided');
        if (document.size() <= 0) throw new SpringCMRESTException('No document or zero byte document provided');
        if (document.size() > 5242880) throw new SpringCMRESTException('Document provided too large for Salesforce upload');

        Map<String, Object> folder = GetFolder(id, type, sId, '');
        String url = ((String)folder.get('CreateDocumentHref')).replace('{?name}', '?name=' + name);
        if (accessToken == null || accessToken == '')
            if (sId == null) AuthenticateUsingAPIUser();
            else AuthenticateUsingSession(sId);
        HttpResponse res = SpringCMRest.Post(url, null, document, accessToken, true);
        if (res == null) return null;

        System.debug(res);
        if(res.getStatusCode() >= 400)
            utils.retryGet(baseUrl != null ? baseUrl + url : url, null, accessToken, 10000);

        if(res.getStatusCode() < 400)
            return (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
        return null;
        }

    /*public Map<String,Object> FindOrCreateFolder(String id, String type, String sId) {
        HttpResponse res;
        if (accessToken == null || accessToken == '')
            if (sId == null) AuthenticateUsingAPIUser();
            else AuthenticateUsingSession(sId);
        Map<String,Object> folder = GetFolder(id, type, sId, '&expand=Folders');
        if (folder.size() <= 0) {
            String url = '/v201411/folders';
            SpringCMEos.SpringCMUtilities.EOSObject eosResult = SpringCMEos.SpringCMUtilities.createEOSObject(id, type);
            if (eosResult == null) throw new SpringCMRESTException('Parent object not found');
            String body = '{"EosInfo":{"Name":"' + eosResult.getFoldername() + '", "ObjectId":"' +
                    eosResult.getSfId() + '","ObjectType":"' + eosResult.getSfType() + '"}}';
            res = SpringCMRest.Post(url, body, null, accessToken, false);
            folder = (Map<String,Object>)JSON.deserializeUntyped(res);
            }
        return folder;
        }*/

    public Map<String,Object> CreateSubFolders(Map<String,Object> parent, String name) {
        return null;
        }

    public class SpringCMUtilities {
        public boolean isValid(String value) {
            return value != null || value != '';
            }

        public void springRESTErrorHandler(Map<String, Object> res) {}

        public Map<String, Object> retryGet(String url, String body, String accessToken, Integer delay) {
            Long startingTime = 0l;
            HttpResponse res;
            Integer retryCount = 0;
            do {
                retryCount++;
                startingTime = System.now().getTime();
                while (System.now().getTime() - startingTime < delay) {}
                if (body == null) res = SpringCMRest.Get(url, '', accessToken);
                else res = SpringCMRest.Post(url, body, null, accessToken, false);
                if (res == null) return null;
                System.debug(res + ' (' + retryCount + ')');
                } while (res.getStatusCode() >= 400 && retryCount <= 4);
            return (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            }
        }
    }